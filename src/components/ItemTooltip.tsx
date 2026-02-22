import { createPortal } from 'react-dom';
import type { Item, PlayerStats } from '../types';
import { allAffixes, itemBaseById } from '../data';

const RARITY_STYLES = {
  normal: {
    text: 'text-gray-300',
    border: 'border-gray-600',
    bgSolid: 'bg-[#1a1a24]',
    headerBg: 'bg-gray-700',
  },
  magic: {
    text: 'text-blue-400',
    border: 'border-blue-500',
    bgSolid: 'bg-[#0d1a2d]',
    headerBg: 'bg-blue-800',
  },
  rare: {
    text: 'text-yellow-400',
    border: 'border-yellow-500',
    bgSolid: 'bg-[#1f1a0d]',
    headerBg: 'bg-yellow-800',
  },
  unique: {
    text: 'text-orange-400',
    border: 'border-orange-500',
    bgSolid: 'bg-[#1f140d]',
    headerBg: 'bg-orange-800',
  },
};

const PERCENTAGE_STATS = new Set([
  'attackSpeed',
  'increasedAttackSpeed',
  'increasedPhysicalDamage',
  'increasedFireDamage',
  'increasedColdDamage',
  'increasedLightningDamage',
  'increasedEnergyShield',
  'increasedArmor',
  'increasedEvasion',
  'criticalChance',
  'fireResistance',
  'coldResistance',
  'lightningResistance',
  'chaosResistance',
  'blockChance',
]);

const affixById = new Map(allAffixes.map(affix => [affix.id, affix]));

function isPercentageStat(key: string): boolean {
  if (PERCENTAGE_STATS.has(key)) return true;
  const affix = allAffixes.find(a => a.statKey === key);
  return affix?.isPercentage ?? false;
}

function formatStatName(key: string): string {
  const affix = allAffixes.find(a => a.statKey === key);
  if (affix) return affix.name;
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

function formatStatValue(value: number): string {
  return Number.isInteger(value) ? String(Math.floor(value)) : value.toFixed(1);
}

function getBaseStats(item: Item): Partial<PlayerStats> {
  const base = itemBaseById.get(item.baseId);
  return item.rolledBaseStats ?? base?.baseStats ?? {};
}

const LOCAL_DEFENSE_KEYS: Array<keyof PlayerStats> = ['armor', 'evasion', 'energyShield'];

function getDisplayBaseStats(item: Item): Partial<PlayerStats> {
  const baseStats = getBaseStats(item);
  const display = { ...baseStats };

  // PoE-like presentation: local defense lines include local affix effects.
  for (const statKey of LOCAL_DEFENSE_KEYS) {
    const totalValue = item.stats[statKey];
    if (typeof totalValue === 'number' && totalValue !== 0) {
      (display as Record<string, number>)[statKey] = totalValue;
    }
  }

  return display;
}

function getClampedTooltipPosition(
  position: { x: number; y: number },
  width: number,
  height: number
): { left: number; top: number } {
  let left = position.x + 20;
  let top = position.y - 10;

  if (left + width > window.innerWidth - 20) {
    left = position.x - width - 20;
  }
  if (top + height > window.innerHeight - 20) {
    top = window.innerHeight - height - 20;
  }
  if (top < 20) top = 20;
  if (left < 20) left = 20;

  return { left, top };
}

export function ItemTooltipPortal({
  item,
  position,
  label = 'Equipped',
  hint,
}: {
  item: Item;
  position: { x: number; y: number };
  label?: string;
  hint?: string;
}) {
  const style = RARITY_STYLES[item.rarity];
  const base = itemBaseById.get(item.baseId);
  const baseStats = getDisplayBaseStats(item);
  const baseStatRows = Object.entries(baseStats).filter(([, value]) => typeof value === 'number' && value !== 0);
  const affixRows = [
    ...item.prefixes.map(affix => ({ affix, kind: 'Prefix' })),
    ...item.suffixes.map(affix => ({ affix, kind: 'Suffix' })),
  ];

  const tooltipWidth = 320;
  const tooltipHeight = 460;
  const { left, top } = getClampedTooltipPosition(position, tooltipWidth, tooltipHeight);

  return createPortal(
    <div className="fixed z-[9999] pointer-events-none" style={{ left, top }}>
      <div className={`rounded-lg border-2 ${style.border} ${style.bgSolid} min-w-[280px] max-w-[320px]`}>
        <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${style.headerBg} rounded-t-md text-white/80`}>
          {label}
        </div>

        <div className="p-3">
          <div className={`font-bold text-sm ${style.text}`}>{item.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">{base?.name}</div>
          <div className="flex gap-2 text-[10px] text-gray-500">
            <span>{item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}</span>
            <span>•</span>
            <span>iLvl {item.itemLevel}</span>
          </div>

          <div className="border-t border-gray-700 my-2" />
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Base Stats</div>
            {baseStatRows.length === 0 && <div className="text-xs text-gray-500 italic">No bonuses</div>}
            {baseStatRows.map(([key, value]) => (
              <div key={`base_${key}`} className="text-xs flex justify-between gap-4">
                <span className="text-gray-300">{formatStatName(key)}</span>
                <span className="text-blue-200 font-medium">
                  +{formatStatValue(value as number)}{isPercentageStat(key) ? '%' : ''}
                </span>
              </div>
            ))}
          </div>

          {affixRows.length > 0 && (
            <>
              <div className="border-t border-gray-700 my-2" />
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Affixes</div>
                {affixRows.map(({ affix, kind }) => {
                  const def = affixById.get(affix.definitionId);
                  if (!def) return null;
                  const statParts: Array<{ key: keyof PlayerStats; value: number }> = [{ key: def.statKey, value: affix.value }];
                  if (def.secondaryStatKey && affix.secondaryValue !== undefined) {
                    statParts.push({ key: def.secondaryStatKey, value: affix.secondaryValue });
                  }
                  if (def.tertiaryStatKey && affix.tertiaryValue !== undefined) {
                    statParts.push({ key: def.tertiaryStatKey, value: affix.tertiaryValue });
                  }
                  return (
                    <div key={`${affix.definitionId}_${kind}_${affix.tier}`} className="rounded border border-[#2a2a3a] bg-[#0a0a0f]/60 px-2 py-1">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {kind} • Tier {affix.tier}
                      </div>
                      {statParts.map((part, index) => (
                        <div key={`${affix.definitionId}_${part.key}_${index}`} className="text-xs flex justify-between gap-4">
                          <span className="text-gray-300">{formatStatName(part.key)}</span>
                          <span className="text-blue-300 font-medium">
                            +{formatStatValue(part.value)}{def.isPercentage ? '%' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {hint && (
        <div className="mt-2 text-[10px] text-gray-500 bg-[#0a0a0f] px-2 py-1 rounded inline-block border border-gray-700">
          {hint}
        </div>
      )}
    </div>,
    document.body
  );
}
