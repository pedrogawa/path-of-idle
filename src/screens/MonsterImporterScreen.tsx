import { useMemo, useState } from 'react';
import { useGameStore } from '../stores/gameStore';

const MIN_AREA_LEVEL = 1;
const MAX_AREA_LEVEL = 100;
const STORAGE_PREFIX = 'idleArpg.monsterImport';
const DEFAULT_MONSTER_HASH = '33424';

interface ProgressState {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  currentLevel: number | null;
}

interface MonsterLevelError {
  areaLevel: number;
  status?: number;
  message: string;
}

interface MonsterLevelResponse {
  areaLevel: number;
  ok: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

interface MonsterLevelResponseLog {
  areaLevel: number;
  ok: boolean;
  status?: number;
  parsed: boolean;
  error?: string;
}

interface ParsedFormula {
  raw: string;
  baseValue?: number;
  multiplier?: number;
  result?: number;
}

interface ParsedValue {
  text: string;
  numbers: number[];
  numeric?: number;
  min?: number;
  max?: number;
  isRange: boolean;
  isPercent: boolean;
  isSeconds: boolean;
  tooltip?: string;
  formula?: ParsedFormula;
}

interface ParsedMonsterStat {
  key: string;
  label: string;
  value: ParsedValue;
}

interface CompactMonsterLevelData {
  areaLevel: number;
  level: number;
  life?: number;
  armor?: number;
  evasion?: number;
  damage?: number;
  spellDamage?: number;
  accuracy?: number;
  attackTime?: number;
  attackSpeed?: number;
  experience?: number;
  minionLife?: number;
  minionDamage?: number;
  ailmentThreshold?: number;
  physConvertElePct?: number;
  chill?: number;
  shock?: number;
  brittle?: number;
  scorch?: number;
  sap?: number;
  canChill?: boolean;
  canShock?: boolean;
  canBrittle?: boolean;
  canScorch?: boolean;
  canSap?: boolean;
  resistances?: {
    fire?: number;
    cold?: number;
    lightning?: number;
    chaos?: number;
  };
}

interface MonsterImportResult {
  source: string;
  fetchedAt: string;
  monsterHash: number;
  levelRange: {
    start: number;
    end: number;
  };
  requestConfig: {
    timeoutMs: number;
    delayMs: number;
    concurrency: number;
  };
  summary: {
    requested: number;
    successful: number;
    failed: number;
    parsedSuccessful: number;
    parsedFailed: number;
    durationMs: number;
  };
  levels: Record<string, CompactMonsterLevelData>;
  errors: MonsterLevelError[];
  responses: MonsterLevelResponseLog[];
}

interface FetchOutcome {
  ok: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const buildRange = (start: number, end: number) => {
  const levels: number[] = [];
  for (let level = start; level <= end; level += 1) {
    levels.push(level);
  }
  return levels;
};

const toInteger = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const STAT_KEY_MAP: Record<string, string> = {
  level: 'level',
  life: 'life',
  armour: 'armor',
  'evasion rating': 'evasion',
  damage: 'damage',
  'spell damage': 'spellDamage',
  accuracy: 'accuracy',
  'attack time': 'attackTime',
  experience: 'experience',
  'minion life': 'minionLife',
  'minion damage': 'minionDamage',
  'ailment threshold': 'ailmentThreshold',
  chill: 'chill',
  shock: 'shock',
  brittle: 'brittle',
  scorch: 'scorch',
  sap: 'sap',
  'phys convert ele': 'physConvertEle',
  'fire resistance': 'fireResistance',
  'cold resistance': 'coldResistance',
  'lightning resistance': 'lightningResistance',
  'chaos resistance': 'chaosResistance',
};

const toCamelKey = (label: string) => {
  const cleaned = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 0) {
    return 'unknown';
  }

  const [first, ...rest] = parts;
  return `${first}${rest.map(part => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`).join('')}`;
};

const toStatKey = (label: string) => {
  const normalized = label.toLowerCase();
  return STAT_KEY_MAP[normalized] ?? toCamelKey(label);
};

const parseFormula = (tooltip: string): ParsedFormula | undefined => {
  const numericParts = (tooltip.replace(/,/g, '').match(/-?\d*\.?\d+/g) ?? [])
    .map(part => Number(part))
    .filter(number => Number.isFinite(number));

  if (numericParts.length === 0) {
    return undefined;
  }

  return {
    raw: tooltip,
    baseValue: numericParts[0],
    multiplier: numericParts[1],
    result: numericParts[2],
  };
};

const parseValue = (text: string, tooltip?: string): ParsedValue => {
  const normalized = normalizeText(text);
  const numericParts = (normalized.replace(/,/g, '').match(/-?\d*\.?\d+/g) ?? [])
    .map(part => Number(part))
    .filter(number => Number.isFinite(number));
  const isRange = /[~—-]/.test(normalized) && numericParts.length >= 2;
  const isPercent = normalized.includes('%');
  const isSeconds = /\bsec(ond)?s?\b/i.test(normalized);

  const value: ParsedValue = {
    text: normalized,
    numbers: numericParts,
    isRange,
    isPercent,
    isSeconds,
  };

  if (isRange) {
    value.min = numericParts[0];
    value.max = numericParts[1];
  } else if (numericParts.length > 0) {
    value.numeric = numericParts[0];
  }

  if (tooltip) {
    value.tooltip = normalizeText(tooltip);
    value.formula = parseFormula(value.tooltip);
  }

  return value;
};

const getStatNumeric = (stats: Record<string, ParsedMonsterStat>, key: string) => {
  const stat = stats[key];
  if (!stat) return undefined;
  if (stat.value.numeric !== undefined) return stat.value.numeric;
  if (stat.value.max !== undefined) return stat.value.max;
  if (stat.value.min !== undefined) return stat.value.min;
  return undefined;
};

const parseMonsterLevelHtml = (html: string, areaLevel: number): CompactMonsterLevelData => {
  const documentNode = new DOMParser().parseFromString(html, 'text/html');
  const statElements = Array.from(
    documentNode.querySelectorAll('div.border.p-2.d-flex.justify-content-between'),
  );
  const stats: Record<string, ParsedMonsterStat> = {};

  statElements.forEach(element => {
    const columns = Array.from(element.querySelectorAll(':scope > div'));
    if (columns.length < 2) {
      return;
    }

    const label = normalizeText(columns[0].textContent ?? '');
    const valueElement = columns[1];
    const valueText = normalizeText(valueElement.textContent ?? '');
    if (!label || !valueText) {
      return;
    }

    const tooltip = valueElement.querySelector<HTMLElement>('[title]')?.getAttribute('title') ?? undefined;
    const key = toStatKey(label);

    stats[key] = {
      key,
      label,
      value: parseValue(valueText, tooltip ?? undefined),
    };
  });

  const levelFromStats = getStatNumeric(stats, 'level');
  const attackTime = getStatNumeric(stats, 'attackTime');
  const result: CompactMonsterLevelData = {
    areaLevel,
    level: levelFromStats ?? areaLevel,
  };

  const numericAssignments: Array<{
    key:
      | 'life'
      | 'armor'
      | 'evasion'
      | 'damage'
      | 'spellDamage'
      | 'accuracy'
      | 'experience'
      | 'minionLife'
      | 'minionDamage'
      | 'ailmentThreshold'
      | 'physConvertElePct'
      | 'chill'
      | 'shock'
      | 'brittle'
      | 'scorch'
      | 'sap';
    statKey: string;
  }> = [
    { key: 'life', statKey: 'life' },
    { key: 'armor', statKey: 'armor' },
    { key: 'evasion', statKey: 'evasion' },
    { key: 'damage', statKey: 'damage' },
    { key: 'spellDamage', statKey: 'spellDamage' },
    { key: 'accuracy', statKey: 'accuracy' },
    { key: 'experience', statKey: 'experience' },
    { key: 'minionLife', statKey: 'minionLife' },
    { key: 'minionDamage', statKey: 'minionDamage' },
    { key: 'ailmentThreshold', statKey: 'ailmentThreshold' },
    { key: 'physConvertElePct', statKey: 'physConvertEle' },
    { key: 'chill', statKey: 'chill' },
    { key: 'shock', statKey: 'shock' },
    { key: 'brittle', statKey: 'brittle' },
    { key: 'scorch', statKey: 'scorch' },
    { key: 'sap', statKey: 'sap' },
  ];

  numericAssignments.forEach(({ key, statKey }) => {
    const value = getStatNumeric(stats, statKey);
    if (value !== undefined) {
      result[key] = value;
    }
  });

  if (attackTime !== undefined) {
    result.attackTime = attackTime;
    if (attackTime > 0) {
      result.attackSpeed = Number((1 / attackTime).toFixed(4));
    }
  }

  if (result.chill !== undefined) result.canChill = result.chill > 0;
  if (result.shock !== undefined) result.canShock = result.shock > 0;
  if (result.brittle !== undefined) result.canBrittle = result.brittle > 0;
  if (result.scorch !== undefined) result.canScorch = result.scorch > 0;
  if (result.sap !== undefined) result.canSap = result.sap > 0;

  const resistances = {
    fire: getStatNumeric(stats, 'fireResistance'),
    cold: getStatNumeric(stats, 'coldResistance'),
    lightning: getStatNumeric(stats, 'lightningResistance'),
    chaos: getStatNumeric(stats, 'chaosResistance'),
  };
  const hasAnyResistance = Object.values(resistances).some(value => value !== undefined);
  if (hasAnyResistance) {
    result.resistances = {};
    if (resistances.fire !== undefined) result.resistances.fire = resistances.fire;
    if (resistances.cold !== undefined) result.resistances.cold = resistances.cold;
    if (resistances.lightning !== undefined) result.resistances.lightning = resistances.lightning;
    if (resistances.chaos !== undefined) result.resistances.chaos = resistances.chaos;
  }

  return result;
};

const parseApiPayloadToMonsterLevel = (rawPayload: unknown, areaLevel: number) => {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return {
      parsed: null,
      error: 'API payload was not an object.',
    };
  }

  const payload = rawPayload as { code?: unknown; data?: unknown };
  const dataHtml = payload.data;
  if (typeof dataHtml !== 'string') {
    return {
      parsed: null,
      error: 'API payload missing HTML string in `data`.',
    };
  }

  const parsed = parseMonsterLevelHtml(dataHtml, areaLevel);
  const hasCoreStats = Object.keys(parsed).some(key => key !== 'areaLevel' && key !== 'level');
  if (!hasCoreStats) {
    return {
      parsed: null,
      error: 'Parsed payload but found no usable stats.',
    };
  }

  return {
    parsed,
    error: null,
  };
};

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<FetchOutcome> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    const rawText = await response.text();

    if (!response.ok) {
      const preview = rawText.slice(0, 200);
      const suffix = preview ? `: ${preview}` : '';
      return {
        ok: false,
        status: response.status,
        error: `HTTP ${response.status}${suffix}`,
      };
    }

    if (!rawText) {
      return {
        ok: true,
        status: response.status,
        data: null,
      };
    }

    try {
      const data = JSON.parse(rawText) as unknown;
      return {
        ok: true,
        status: response.status,
        data,
      };
    } catch {
      return {
        ok: false,
        status: response.status,
        error: 'Response was not valid JSON.',
      };
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        error: `Request timed out after ${timeoutMs}ms (${url})`,
      };
    }

    return {
      ok: false,
      error: error instanceof Error ? `${error.message} (${url})` : `Unknown request failure (${url})`,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchMonsterLevelSkill(monsterHash: number, areaLevel: number, timeoutMs: number): Promise<FetchOutcome> {
  const params = new URLSearchParams({
    monsterHash: String(monsterHash),
    arealv: String(areaLevel),
  });

  const requestUrls = [
    `/api/poedb/monsterLevelSkill?${params.toString()}`,
    `https://poedb.tw/us/api/monsterLevelSkill?${params.toString()}`,
  ];

  let lastFailure: FetchOutcome = {
    ok: false,
    error: 'Request failed',
  };

  for (const url of requestUrls) {
    const outcome = await fetchWithTimeout(url, timeoutMs);

    if (outcome.ok) {
      return outcome;
    }

    lastFailure = outcome;
    if (outcome.status && outcome.status !== 404) {
      return outcome;
    }
  }

  return lastFailure;
}

// Bottom padding when combat mini panel is shown
const useCombatPadding = () => {
  const combatState = useGameStore(state => state.combatState);
  return combatState === 'fighting' ? 'pb-20' : '';
};

export function MonsterImporterScreen() {
  const navigateTo = useGameStore(state => state.navigateTo);
  const combatState = useGameStore(state => state.combatState);
  const combatPadding = useCombatPadding();

  const [monsterHash, setMonsterHash] = useState(DEFAULT_MONSTER_HASH);
  const [startLevel, setStartLevel] = useState(1);
  const [endLevel, setEndLevel] = useState(100);
  const [requestTimeoutMs, setRequestTimeoutMs] = useState(8000);
  const [requestDelayMs, setRequestDelayMs] = useState(120);
  const [concurrency, setConcurrency] = useState(4);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MonsterImportResult | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    total: 0,
    completed: 0,
    successful: 0,
    failed: 0,
    currentLevel: null,
  });

  const parsedMonsterHash = toInteger(monsterHash.trim(), Number.NaN);
  const isMonsterHashValid = Number.isFinite(parsedMonsterHash) && parsedMonsterHash > 0;

  const normalizedStart = clamp(Math.min(startLevel, endLevel), MIN_AREA_LEVEL, MAX_AREA_LEVEL);
  const normalizedEnd = clamp(Math.max(startLevel, endLevel), MIN_AREA_LEVEL, MAX_AREA_LEVEL);
  const levelCount = normalizedEnd - normalizedStart + 1;
  const progressPercent = progress.total > 0 ? Math.floor((progress.completed / progress.total) * 100) : 0;

  const outputJson = useMemo(() => {
    if (!result) return '';
    return JSON.stringify(result, null, 2);
  }, [result]);

  const outputLevelsJson = useMemo(() => {
    if (!result) return '';
    return JSON.stringify(result.levels, null, 2);
  }, [result]);

  const handleRunImport = async () => {
    if (isLoading) return;

    if (!isMonsterHashValid) {
      setStatusMessage('Enter a numeric monster hash.');
      return;
    }

    const safeTimeout = clamp(requestTimeoutMs, 1000, 60000);
    const safeDelay = clamp(requestDelayMs, 0, 5000);
    const safeConcurrency = clamp(concurrency, 1, 10);
    const levels = buildRange(normalizedStart, normalizedEnd);
    const queue = [...levels];
    const resultByLevel = new Map<number, MonsterLevelResponse>();

    let completed = 0;
    let successful = 0;
    let failed = 0;
    let nextRequestAt = Date.now();

    setResult(null);
    setStatusMessage(`Fetching ${levels.length} requests from area level ${normalizedStart} to ${normalizedEnd}...`);
    setProgress({
      total: levels.length,
      completed: 0,
      successful: 0,
      failed: 0,
      currentLevel: null,
    });
    setIsLoading(true);

    const startedAt = Date.now();

    const worker = async () => {
      while (queue.length > 0) {
        const areaLevel = queue.shift();
        if (areaLevel === undefined) {
          return;
        }

        if (safeDelay > 0) {
          const now = Date.now();
          const waitTime = Math.max(0, nextRequestAt - now);
          nextRequestAt = Math.max(nextRequestAt, now) + safeDelay;
          if (waitTime > 0) {
            await sleep(waitTime);
          }
        }

        setProgress(current => ({
          ...current,
          currentLevel: areaLevel,
        }));

        const outcome = await fetchMonsterLevelSkill(parsedMonsterHash, areaLevel, safeTimeout);

        const response: MonsterLevelResponse = outcome.ok
          ? {
              areaLevel,
              ok: true,
              status: outcome.status,
              data: outcome.data,
            }
          : {
              areaLevel,
              ok: false,
              status: outcome.status,
              error: outcome.error ?? 'Request failed',
            };

        resultByLevel.set(areaLevel, response);
        completed += 1;
        if (response.ok) {
          successful += 1;
        } else {
          failed += 1;
        }

        setProgress({
          total: levels.length,
          completed,
          successful,
          failed,
          currentLevel: areaLevel,
        });
      }
    };

    try {
      const workerCount = Math.min(safeConcurrency, levels.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      const orderedResponses = levels
        .map(level => resultByLevel.get(level))
        .filter((entry): entry is MonsterLevelResponse => entry !== undefined);

      const errors: MonsterLevelError[] = [];
      const levelsPayload: Record<string, CompactMonsterLevelData> = {};
      const parseStatusByLevel = new Map<number, boolean>();
      const parseErrorByLevel = new Map<number, string>();
      let parsedSuccessful = 0;
      let parsedFailed = 0;

      orderedResponses.forEach(entry => {
        if (entry.ok) {
          const parsedPayload = parseApiPayloadToMonsterLevel(entry.data, entry.areaLevel);
          if (parsedPayload.parsed) {
            levelsPayload[String(entry.areaLevel)] = parsedPayload.parsed;
            parsedSuccessful += 1;
            parseStatusByLevel.set(entry.areaLevel, true);
            return;
          }

          parsedFailed += 1;
          parseStatusByLevel.set(entry.areaLevel, false);
          parseErrorByLevel.set(entry.areaLevel, parsedPayload.error ?? 'Unknown parsing error');
          errors.push({
            areaLevel: entry.areaLevel,
            status: entry.status,
            message: parsedPayload.error ?? 'Unknown parsing error',
          });
          return;
        }

        parseStatusByLevel.set(entry.areaLevel, false);
        parseErrorByLevel.set(entry.areaLevel, entry.error ?? 'Unknown request error');
        errors.push({
          areaLevel: entry.areaLevel,
          status: entry.status,
          message: entry.error ?? 'Unknown error',
        });
      });

      const responseLogs: MonsterLevelResponseLog[] = orderedResponses.map(entry => ({
        areaLevel: entry.areaLevel,
        ok: entry.ok,
        status: entry.status,
        parsed: parseStatusByLevel.get(entry.areaLevel) ?? false,
        error: parseErrorByLevel.get(entry.areaLevel),
      }));

      parsedFailed += failed;
      const durationMs = Date.now() - startedAt;
      const importResult: MonsterImportResult = {
        source: 'https://poedb.tw/us/api/monsterLevelSkill',
        fetchedAt: new Date().toISOString(),
        monsterHash: parsedMonsterHash,
        levelRange: {
          start: normalizedStart,
          end: normalizedEnd,
        },
        requestConfig: {
          timeoutMs: safeTimeout,
          delayMs: safeDelay,
          concurrency: safeConcurrency,
        },
        summary: {
          requested: levels.length,
          successful,
          failed,
          parsedSuccessful,
          parsedFailed,
          durationMs,
        },
        levels: levelsPayload,
        errors,
        responses: responseLogs,
      };

      setResult(importResult);
      setStatusMessage(
        `Finished in ${(durationMs / 1000).toFixed(1)}s. ` +
        `HTTP success: ${successful}, HTTP failed: ${failed}, parsed: ${parsedSuccessful}, parse failed: ${parsedFailed}.`,
      );
    } finally {
      setIsLoading(false);
      setProgress(current => ({
        ...current,
        currentLevel: null,
      }));
    }
  };

  const handleCopy = async () => {
    if (!outputJson) return;
    try {
      await navigator.clipboard.writeText(outputJson);
      setStatusMessage('Copied JSON to clipboard.');
    } catch {
      setStatusMessage('Clipboard write failed. Use Download JSON instead.');
    }
  };

  const handleCopyLevelsOnly = async () => {
    if (!outputLevelsJson) return;
    try {
      await navigator.clipboard.writeText(outputLevelsJson);
      setStatusMessage('Copied levels-only JSON to clipboard.');
    } catch {
      setStatusMessage('Clipboard write failed. Use Download JSON instead.');
    }
  };

  const handleDownload = () => {
    if (!outputJson || !result) return;

    const timestamp = new Date().toISOString().replaceAll(':', '-');
    const filename = `monster_${result.monsterHash}_levels_${result.levelRange.start}-${result.levelRange.end}_${timestamp}.json`;
    const blob = new Blob([outputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToBrowser = () => {
    if (!outputJson || !result) return;

    const key = `${STORAGE_PREFIX}.${result.monsterHash}.latest`;
    try {
      localStorage.setItem(key, outputJson);
      setStatusMessage(`Saved latest snapshot to localStorage key: ${key}`);
    } catch {
      setStatusMessage('Saving to localStorage failed (likely storage limit).');
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] ${combatPadding}`}>
      <div className="bg-[#0a0a0f]/80 border-b border-[#2a2a3a] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <button
            onClick={() => navigateTo(combatState === 'fighting' ? 'combat' : 'town')}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors text-sm text-gray-300"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl">🧪</span>
            <div>
              <h1 className="text-xl font-bold text-[#c9a227]">Monster Lab</h1>
              <p className="text-xs text-gray-500">Import PoEDB level-scaled monster stats</p>
            </div>
          </div>

          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-[#12121a] rounded-xl border border-[#2a2a3a] p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Fetch Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <label className="text-sm">
              <div className="text-gray-400 mb-1">Monster Hash</div>
              <input
                type="text"
                value={monsterHash}
                onChange={event => setMonsterHash(event.target.value)}
                placeholder="33424"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-white focus:outline-none focus:border-[#c9a227]"
              />
            </label>

            <label className="text-sm">
              <div className="text-gray-400 mb-1">Area Level Start</div>
              <input
                type="number"
                min={MIN_AREA_LEVEL}
                max={MAX_AREA_LEVEL}
                value={startLevel}
                onChange={event => setStartLevel(toInteger(event.target.value, MIN_AREA_LEVEL))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-white focus:outline-none focus:border-[#c9a227]"
              />
            </label>

            <label className="text-sm">
              <div className="text-gray-400 mb-1">Area Level End</div>
              <input
                type="number"
                min={MIN_AREA_LEVEL}
                max={MAX_AREA_LEVEL}
                value={endLevel}
                onChange={event => setEndLevel(toInteger(event.target.value, MAX_AREA_LEVEL))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-white focus:outline-none focus:border-[#c9a227]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <label className="text-sm">
              <div className="text-gray-400 mb-1">Timeout (ms)</div>
              <input
                type="number"
                min={1000}
                max={60000}
                value={requestTimeoutMs}
                onChange={event => setRequestTimeoutMs(toInteger(event.target.value, 8000))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-white focus:outline-none focus:border-[#c9a227]"
              />
            </label>

            <label className="text-sm">
              <div className="text-gray-400 mb-1">Delay Between Requests (ms)</div>
              <input
                type="number"
                min={0}
                max={5000}
                value={requestDelayMs}
                onChange={event => setRequestDelayMs(toInteger(event.target.value, 120))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-white focus:outline-none focus:border-[#c9a227]"
              />
            </label>

            <label className="text-sm">
              <div className="text-gray-400 mb-1">Parallel Requests</div>
              <input
                type="number"
                min={1}
                max={10}
                value={concurrency}
                onChange={event => setConcurrency(toInteger(event.target.value, 4))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-white focus:outline-none focus:border-[#c9a227]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleRunImport}
              disabled={isLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-[#c9a227] to-[#f0d060] text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Fetching...' : `Fetch ${levelCount} Levels`}
            </button>

            <span className="text-sm text-gray-400">
              {levelCount} requests will run for area levels {normalizedStart}-{normalizedEnd}.
            </span>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl border border-[#2a2a3a] p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Progress</h2>

          <div className="h-3 bg-[#0a0a0f] rounded-full overflow-hidden border border-[#2a2a3a] mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#c9a227] to-[#f0d060] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-sm text-gray-300 grid grid-cols-2 md:grid-cols-5 gap-2">
            <div>Total: {progress.total}</div>
            <div>Done: {progress.completed}</div>
            <div>Success: {progress.successful}</div>
            <div>Failed: {progress.failed}</div>
            <div>Current: {progress.currentLevel ?? '-'}</div>
          </div>

          {statusMessage && (
            <p className="mt-4 text-sm text-blue-300 bg-blue-950/30 border border-blue-800/40 rounded-lg p-3">
              {statusMessage}
            </p>
          )}
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-[#12121a] rounded-xl border border-[#2a2a3a] p-6">
              <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Exportable Object</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-sm text-gray-200 hover:border-[#c9a227]/50"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={handleCopyLevelsOnly}
                    className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-sm text-gray-200 hover:border-[#c9a227]/50"
                  >
                    Copy Levels Only
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-sm text-gray-200 hover:border-[#c9a227]/50"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={handleSaveToBrowser}
                    className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-sm text-gray-200 hover:border-[#c9a227]/50"
                  >
                    Save to Browser
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-3">
                Compact combat-ready JSON only. Raw HTML and skill card markup are not stored.
              </div>

              <pre className="max-h-[500px] overflow-auto bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg p-4 text-xs text-gray-300">
                <code>{outputJson}</code>
              </pre>
            </div>

            <div className="bg-[#12121a] rounded-xl border border-[#2a2a3a] p-6">
              <h2 className="text-lg font-bold text-white mb-4">Per-Level Result</h2>
              <div className="max-h-[420px] overflow-auto border border-[#2a2a3a] rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[#0a0a0f] sticky top-0">
                    <tr className="text-left text-gray-300">
                      <th className="px-3 py-2">Area Lv</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">HTTP</th>
                      <th className="px-3 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.responses.map(entry => (
                      <tr key={entry.areaLevel} className="border-t border-[#1a1a24]">
                        <td className="px-3 py-2 text-gray-200">{entry.areaLevel}</td>
                        <td
                          className={
                            `px-3 py-2 font-medium ${
                              entry.ok ? (entry.parsed ? 'text-green-400' : 'text-yellow-300') : 'text-red-400'
                            }`
                          }
                        >
                          {entry.ok ? (entry.parsed ? 'Parsed' : 'Parse Failed') : 'Request Failed'}
                        </td>
                        <td className="px-3 py-2 text-gray-400">{entry.status ?? '-'}</td>
                        <td className="px-3 py-2 text-gray-300 truncate max-w-[480px]">
                          {entry.ok && entry.parsed ? 'Structured object ready' : entry.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
