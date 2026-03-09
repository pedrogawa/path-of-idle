import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { computePlayerStats } from '../lib/combat';
import { ARENA_MAX, ARENA_MIN, isInMeleeRange, getBestTarget, getArenaObstaclesForMap } from '../lib/monsters';
import { mapById } from '../data';
import type { Monster } from '../types';

interface Position {
  x: number;
  y: number;
}

interface DamageNumber {
  id: number;
  value: number;
  position: Position;
  isPlayerDamage: boolean;
  isCrit?: boolean;
  type?: 'damage' | 'evade' | 'block' | 'skill'; // Special types
}

interface LootDrop {
  id: number;
  type: 'item' | 'currency';
  rarity?: string;
  position: Position;
}

const ARENA_HEIGHT = 220;
const CAMERA_VIEW_WIDTH = 42;
const CAMERA_VIEW_HEIGHT = 31;
const CAMERA_CULL_MARGIN = 8;

const RARITY_COLORS = {
  normal: { primary: '#9ca3af', secondary: '#6b7280', glow: 'rgba(156, 163, 175, 0.3)' },
  magic: { primary: '#3b82f6', secondary: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.5)' },
  rare: { primary: '#eab308', secondary: '#ca8a04', glow: 'rgba(234, 179, 8, 0.5)' },
  boss: { primary: '#dc2626', secondary: '#991b1b', glow: 'rgba(220, 38, 38, 0.6)' },
};

interface CombatArenaProps {
  fullScreen?: boolean;
  showOverlayBars?: boolean;
  arenaHeight?: number | string;
  className?: string;
}

interface BiomeVisual {
  skyTop: string;
  skyBottom: string;
  horizonGlow: string;
  floorFar: string;
  floorNear: string;
  laneColor: string;
  propA: string;
  propB: string;
}

const DEFAULT_BIOME_VISUAL: BiomeVisual = {
  skyTop: '#101624',
  skyBottom: '#1b2233',
  horizonGlow: 'rgba(120, 140, 190, 0.25)',
  floorFar: '#223042',
  floorNear: '#151b28',
  laneColor: 'rgba(173, 194, 226, 0.14)',
  propA: '#2a3c57',
  propB: '#1f2a3b',
};

const BIOME_VISUALS: Record<string, BiomeVisual> = {
  beach: {
    skyTop: '#3f4e64',
    skyBottom: '#6f7b8e',
    horizonGlow: 'rgba(248, 222, 155, 0.32)',
    floorFar: '#c8a977',
    floorNear: '#8d7249',
    laneColor: 'rgba(255, 239, 189, 0.2)',
    propA: '#b98e5b',
    propB: '#7e613a',
  },
  cave: {
    skyTop: '#0d1118',
    skyBottom: '#1b2535',
    horizonGlow: 'rgba(113, 152, 209, 0.26)',
    floorFar: '#2e3647',
    floorNear: '#1b202c',
    laneColor: 'rgba(154, 180, 220, 0.14)',
    propA: '#39455e',
    propB: '#232d3f',
  },
  shipwreck: {
    skyTop: '#2d374b',
    skyBottom: '#4b5a74',
    horizonGlow: 'rgba(236, 179, 131, 0.24)',
    floorFar: '#5e4738',
    floorNear: '#34271f',
    laneColor: 'rgba(227, 189, 157, 0.14)',
    propA: '#6a4f3a',
    propB: '#413324',
  },
  underwater: {
    skyTop: '#123142',
    skyBottom: '#27556d',
    horizonGlow: 'rgba(121, 212, 255, 0.2)',
    floorFar: '#2f687a',
    floorNear: '#214959',
    laneColor: 'rgba(142, 230, 255, 0.15)',
    propA: '#3d8091',
    propB: '#245363',
  },
  temple: {
    skyTop: '#2c2730',
    skyBottom: '#4e4250',
    horizonGlow: 'rgba(220, 182, 122, 0.24)',
    floorFar: '#6a5740',
    floorNear: '#3f3327',
    laneColor: 'rgba(242, 214, 164, 0.15)',
    propA: '#7e6648',
    propB: '#4e3f2d',
  },
  ruins: {
    skyTop: '#1f2a2f',
    skyBottom: '#3b4951',
    horizonGlow: 'rgba(160, 207, 188, 0.22)',
    floorFar: '#53645d',
    floorNear: '#323d39',
    laneColor: 'rgba(183, 225, 209, 0.14)',
    propA: '#5e726a',
    propB: '#384541',
  },
  lair: {
    skyTop: '#261d2c',
    skyBottom: '#453553',
    horizonGlow: 'rgba(215, 133, 203, 0.2)',
    floorFar: '#5f3a68',
    floorNear: '#321e3d',
    laneColor: 'rgba(239, 166, 255, 0.13)',
    propA: '#71457e',
    propB: '#422851',
  },
  abyss: {
    skyTop: '#101423',
    skyBottom: '#182145',
    horizonGlow: 'rgba(92, 119, 221, 0.2)',
    floorFar: '#26325c',
    floorNear: '#151b34',
    laneColor: 'rgba(133, 156, 255, 0.13)',
    propA: '#334477',
    propB: '#1d294b',
  },
  throne: {
    skyTop: '#221724',
    skyBottom: '#3a233c',
    horizonGlow: 'rgba(255, 164, 90, 0.2)',
    floorFar: '#59403b',
    floorNear: '#352622',
    laneColor: 'rgba(255, 202, 144, 0.14)',
    propA: '#765148',
    propB: '#48322d',
  },
  maelstrom: {
    skyTop: '#101423',
    skyBottom: '#2b2d58',
    horizonGlow: 'rgba(103, 134, 255, 0.24)',
    floorFar: '#39458a',
    floorNear: '#1f2450',
    laneColor: 'rgba(172, 190, 255, 0.17)',
    propA: '#4b5ca0',
    propB: '#283569',
  },
};

interface TerrainProp {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

function getBiomeVisual(biome?: string): BiomeVisual {
  if (!biome) return DEFAULT_BIOME_VISUAL;
  return BIOME_VISUALS[biome] ?? DEFAULT_BIOME_VISUAL;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pseudoRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967295;
  };
}

function buildTerrainProps(mapId: string, palette: BiomeVisual): TerrainProp[] {
  const random = pseudoRandom(hashString(mapId));
  const props: TerrainProp[] = [];

  for (let i = 0; i < 15; i += 1) {
    const y = 22 + random() * 62;
    const depthScale = 0.45 + y / 130;
    props.push({
      id: `terrain-prop-${i}`,
      x: 10 + random() * 80,
      y,
      w: (8 + random() * 15) * depthScale,
      h: (14 + random() * 26) * depthScale,
      color: i % 2 === 0 ? palette.propA : palette.propB,
    });
  }

  return props.sort((a, b) => a.y - b.y);
}

interface CharacterProps {
  type: 'player' | 'monster';
  position: Position;
  size: number;
  color: { primary: string; secondary: string; glow: string };
  currentHp: number;
  maxHp: number;
  isAttacking: boolean;
  isDying: boolean;
  isSpawning?: boolean;
  isWalking?: boolean;
  isTargeted?: boolean;
  name?: string;
  level?: number;
  spriteUrl?: string;
  isBleeding?: boolean;
  bleedRemainingDuration?: number;
  bleedDps?: number;
}

function Character({
  type,
  position,
  size,
  color,
  currentHp,
  maxHp,
  isAttacking,
  isDying,
  isSpawning,
  isWalking,
  isTargeted,
  name,
  level,
  spriteUrl,
  isBleeding,
  bleedRemainingDuration,
  bleedDps,
}: CharacterProps) {
  const hpPercent = Math.max(0, (currentHp / maxHp) * 100);
  const bodyWidth = Math.max(12, size * (type === 'player' ? 0.34 : 0.38));
  const bodyHeight = Math.max(28, size * (type === 'player' ? 0.95 : 0.84));
  const shadowWidth = Math.max(18, size * 0.7);
  const shadowHeight = Math.max(6, size * 0.2);
  const torsoTopOffset = type === 'player' ? size * 0.14 : size * 0.2;
  const peakHeight = Math.max(6, size * 0.14);

  return (
    <div
      className={`absolute ${isDying ? 'duration-300' : 'duration-100'} ${isSpawning ? 'animate-spawn' : ''} ${isWalking ? 'animate-walk' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) ${isAttacking ? (type === 'player' ? 'translateX(15px) scale(1.1)' : 'translateX(-15px) scale(1.1)') : ''} ${isDying ? 'scale(0) rotate(180deg)' : ''}`,
        opacity: isDying ? 0 : 1,
        zIndex: type === 'player' ? 10 : 5,
        transition: 'left 0.1s linear, top 0.1s linear, transform 0.1s ease-out, opacity 0.3s',
      }}
    >
      {/* Character body */}
      {spriteUrl ? (
        <img
          src={spriteUrl}
          alt={name}
          className="object-contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <div className="relative" style={{ width: size, height: size }}>
          {/* Ground shadow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-[999px] blur-[1px]"
            style={{
              width: shadowWidth,
              height: shadowHeight,
              bottom: 2,
              background: 'rgba(0,0,0,0.48)',
              transform: isAttacking ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.12s ease-out',
            }}
          />

          {/* Main body - elongated geometric prism */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-100"
            style={{
              width: bodyWidth,
              height: bodyHeight,
              top: torsoTopOffset,
              borderRadius: type === 'player' ? 10 : 7,
              background: `linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 82%)`,
              border: `2px solid ${color.primary}`,
              boxShadow: `0 0 ${isAttacking ? 20 : 11}px ${color.glow}, inset -4px -6px 10px rgba(0,0,0,0.32), inset 3px 2px 6px rgba(255,255,255,0.12)`,
              transform: isAttacking ? 'translateY(-2px) scale(1.08)' : 'translateY(0) scale(1)',
            }}
          >
            {/* Prism face */}
            <div
              className="absolute"
              style={{
                top: -peakHeight,
                left: type === 'player' ? 1 : -1,
                width: bodyWidth - 2,
                height: peakHeight + 2,
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                background: `linear-gradient(180deg, ${color.primary}, ${color.secondary})`,
                opacity: 0.95,
              }}
            />

            {/* Highlight strip */}
            <div
              className="absolute rounded-[999px]"
              style={{
                width: Math.max(3, bodyWidth * 0.13),
                height: bodyHeight * 0.76,
                left: type === 'player' ? bodyWidth * 0.12 : bodyWidth * 0.18,
                top: bodyHeight * 0.08,
                background: 'rgba(255,255,255,0.28)',
                filter: 'blur(0.2px)',
              }}
            />

            {/* Facing marker */}
            <div
              className="absolute rounded-[999px]"
              style={{
                width: Math.max(5, bodyWidth * 0.22),
                height: Math.max(5, bodyWidth * 0.22),
                top: bodyHeight * 0.15,
                right: bodyWidth * 0.17,
                background: type === 'player' ? 'rgba(214, 255, 220, 0.85)' : 'rgba(255, 228, 210, 0.85)',
                boxShadow: '0 0 8px rgba(255,255,255,0.4)',
              }}
            />
          </div>

          {/* Attack trail */}
          {isAttacking && (
            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                [type === 'player' ? 'left' : 'right']: -10,
                width: 18,
                height: 4,
                borderRadius: 999,
                background: `linear-gradient(to ${type === 'player' ? 'right' : 'left'}, ${color.primary}, transparent)`,
                boxShadow: `0 0 9px ${color.glow}`,
              }}
            />
          )}
        </div>
      )}

      {/* HP Bar */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-black/70 rounded-full overflow-hidden border border-gray-600"
        style={{
          width: size * 1.3,
          height: 8,
          bottom: -12,
        }}
      >
        <div
          className="h-full transition-all duration-150"
          style={{
            width: `${hpPercent}%`,
            background: type === 'player'
              ? 'linear-gradient(to right, #dc2626, #f87171)'
              : `linear-gradient(to right, ${color.secondary}, ${color.primary})`
          }}
        />
      </div>

      {/* Target indicator */}
      {isTargeted && (
        <div
          className="absolute left-1/2 -translate-x-1/2 animate-bounce text-red-500"
          style={{ top: -40 }}
        >
          <span className="text-lg">⚔️</span>
        </div>
      )}

      {/* Name tag */}
      {name && (
        <div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center" style={{ top: -24 }}>
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isTargeted ? 'bg-red-900/70 ring-1 ring-red-500' : 'bg-black/50'}`}
            style={{ color: isTargeted ? '#fbbf24' : color.primary }}
          >
            {name}
          </span>
          {level && (
            <span className="text-[10px] text-gray-400 ml-1">
              Lv.{level}
            </span>
          )}

          {isBleeding && (
            <div className="text-[10px] text-red-300 mt-0.5 bg-red-950/70 rounded px-1 py-0.5 border border-red-700/60">
              🩸 Bleeding {bleedDps ? `${bleedDps.toFixed(0)} DPS` : ''} {bleedRemainingDuration ? `(${bleedRemainingDuration.toFixed(1)}s)` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// DAMAGE NUMBER
// ============================================

function FloatingDamage({ damage }: { damage: DamageNumber }) {
  // Special rendering for evade/block
  if (damage.type === 'evade') {
    return (
      <div
        className="absolute pointer-events-none font-bold animate-float-damage z-20"
        style={{
          left: `${damage.position.x}%`,
          top: `${damage.position.y}%`,
          color: '#22c55e',
          fontSize: '1.1rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(34,197,94,0.5)',
        }}
      >
        🌀 EVADE
      </div>
    );
  }

  if (damage.type === 'block') {
    return (
      <div
        className="absolute pointer-events-none font-bold animate-float-damage z-20"
        style={{
          left: `${damage.position.x}%`,
          top: `${damage.position.y}%`,
          color: '#3b82f6',
          fontSize: '1.1rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(59,130,246,0.5)',
        }}
      >
        🛡️ BLOCK
      </div>
    );
  }

  if (damage.type === 'skill') {
    return (
      <div
        className="absolute pointer-events-none font-bold animate-float-damage z-20"
        style={{
          left: `${damage.position.x}%`,
          top: `${damage.position.y}%`,
          color: '#a855f7',
          fontSize: '1.3rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(168,85,247,0.5)',
        }}
      >
        -{damage.value}
      </div>
    );
  }

  return (
    <div
      className="absolute pointer-events-none font-bold animate-float-damage z-20"
      style={{
        left: `${damage.position.x}%`,
        top: `${damage.position.y}%`,
        color: damage.isPlayerDamage ? '#fbbf24' : '#ef4444',
        fontSize: damage.isCrit ? '1.6rem' : '1.1rem',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)',
      }}
    >
      {damage.isCrit && '💥'}
      -{damage.value}
    </div>
  );
}

function LootDropAnimation({ loot }: { loot: LootDrop }) {
  const color = loot.rarity ? RARITY_COLORS[loot.rarity as keyof typeof RARITY_COLORS]?.primary || '#c9a227' : '#c9a227';

  return (
    <div
      className="absolute pointer-events-none animate-loot-drop z-20"
      style={{
        left: `${loot.position.x}%`,
        top: `${loot.position.y}%`,
      }}
    >
      <div
        className="w-4 h-4 rounded animate-spin-slow"
        style={{
          background: color,
          boxShadow: `0 0 15px ${color}`,
        }}
      />
    </div>
  );
}

// ============================================
// MAIN ARENA
// ============================================

export function CombatArena({
  fullScreen = false,
  showOverlayBars = true,
  arenaHeight = ARENA_HEIGHT,
  className = '',
}: CombatArenaProps = {}) {
  const player = useGameStore(state => state.player);
  const playerArenaX = useGameStore(state => state.playerArenaX);
  const playerArenaY = useGameStore(state => state.playerArenaY);
  const setPlayerMoveDirection = useGameStore(state => state.setPlayerMoveDirection);
  const currentMapId = useGameStore(state => state.currentMapId);
  const monsters = useGameStore(state => state.monsters);
  const combatState = useGameStore(state => state.combatState);
  const isBossFight = useGameStore(state => state.isBossFight);
  const bossReady = useGameStore(state => state.bossReady);
  const spawnTimer = useGameStore(state => state.spawnTimer);
  const mapProgress = useGameStore(state => currentMapId ? state.mapProgress[currentMapId] : null);
  const startBossFight = useGameStore(state => state.startBossFight);
  const toggleAutoBossSpawn = useGameStore(state => state.toggleAutoBossSpawn);
  const combatLog = useGameStore(state => state.combatLog);

  const playerStats = computePlayerStats(player);
  const map = currentMapId ? mapById.get(currentMapId) : null;
  const biomeVisual = useMemo(() => getBiomeVisual(map?.biome), [map?.biome]);
  const terrainProps = useMemo(
    () => (map ? buildTerrainProps(map.id, biomeVisual) : []),
    [map, biomeVisual],
  );
  const mapObstacles = useMemo(
    () => (map ? getArenaObstaclesForMap(map.id) : []),
    [map],
  );
  const playerPosition = useMemo(() => ({ x: playerArenaX, y: playerArenaY }), [playerArenaX, playerArenaY]);
  const camera = useMemo(() => {
    const maxLeft = Math.max(ARENA_MIN, ARENA_MAX - CAMERA_VIEW_WIDTH);
    const maxTop = Math.max(ARENA_MIN, ARENA_MAX - CAMERA_VIEW_HEIGHT);
    const left = Math.min(Math.max(playerPosition.x - CAMERA_VIEW_WIDTH / 2, ARENA_MIN), maxLeft);
    const top = Math.min(Math.max(playerPosition.y - CAMERA_VIEW_HEIGHT / 2, ARENA_MIN), maxTop);
    return {
      left,
      top,
      right: left + CAMERA_VIEW_WIDTH,
      bottom: top + CAMERA_VIEW_HEIGHT,
      width: CAMERA_VIEW_WIDTH,
      height: CAMERA_VIEW_HEIGHT,
    };
  }, [playerPosition.x, playerPosition.y]);
  const worldToScreen = useCallback((x: number, y: number) => {
    return {
      x: ((x - camera.left) / camera.width) * 100,
      y: ((y - camera.top) / camera.height) * 100,
    };
  }, [camera.height, camera.left, camera.top, camera.width]);
  const isWorldPointVisible = useCallback((x: number, y: number, margin: number = CAMERA_CULL_MARGIN) => {
    return (
      x >= camera.left - margin &&
      x <= camera.right + margin &&
      y >= camera.top - margin &&
      y <= camera.bottom + margin
    );
  }, [camera.bottom, camera.left, camera.right, camera.top]);
  const isWorldRectVisible = useCallback((x: number, y: number, width: number, height: number, margin: number = CAMERA_CULL_MARGIN) => {
    return (
      x + width >= camera.left - margin &&
      x <= camera.right + margin &&
      y + height >= camera.top - margin &&
      y <= camera.bottom + margin
    );
  }, [camera.bottom, camera.left, camera.right, camera.top]);
  const onScreenMonsters = useMemo(() => {
    return monsters.filter(monster => isWorldPointVisible(monster.arenaX, monster.arenaY));
  }, [isWorldPointVisible, monsters]);
  const visibleTarget = useMemo(() => getBestTarget(onScreenMonsters, playerPosition), [onScreenMonsters, playerPosition]);

  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [attackingMonsters, setAttackingMonsters] = useState<Set<string>>(new Set());
  const [dyingMonsters, setDyingMonsters] = useState<Set<string>>(new Set());
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [lootDrops, setLootDrops] = useState<LootDrop[]>([]);

  const lastMonstersRef = useRef<Map<string, number>>(new Map());
  const lastPlayerHpRef = useRef(player.currentLife);
  const lastMonsterIdsRef = useRef<Set<string>>(new Set());
  const lastCombatLogLengthRef = useRef(0);
  const damageIdRef = useRef(0);

  const spawnDamage = useCallback((value: number, x: number, y: number, isPlayerDamage: boolean, isCrit: boolean = false, type?: 'damage' | 'evade' | 'block' | 'skill') => {
    if (value < 0.5 && !type) return;

    const id = damageIdRef.current++;
    const newDamage: DamageNumber = {
      id,
      value: Math.max(1, Math.round(value)),
      position: { x: x + (Math.random() - 0.5) * 8, y: y - 5 + (Math.random() - 0.5) * 10 },
      isPlayerDamage,
      isCrit,
      type: type || 'damage',
    };

    setDamageNumbers(prev => [...prev.slice(-15), newDamage]);
    setTimeout(() => setDamageNumbers(prev => prev.filter(d => d.id !== id)), 1000);
  }, []);

  const spawnLoot = useCallback((x: number, y: number, rarity?: string) => {
    const id = damageIdRef.current++;
    const newLoot: LootDrop = {
      id,
      type: 'item',
      rarity,
      position: { x, y },
    };

    setLootDrops(prev => [...prev.slice(-8), newLoot]);
    setTimeout(() => setLootDrops(prev => prev.filter(l => l.id !== id)), 1500);
  }, []);

  const getMonsterPosition = useCallback((monster: Monster): { x: number; y: number } => {
    return { x: monster.arenaX, y: monster.arenaY };
  }, []);

  useEffect(() => {
    if (combatState !== 'fighting') {
      setPlayerMoveDirection(0, 0);
      return;
    }

    const pressed = new Set<string>();
    const toKey = (value: string) => value.toLowerCase();
    const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
    const updateDirection = () => {
      let x = 0;
      let y = 0;
      if (pressed.has('a') || pressed.has('arrowleft')) x -= 1;
      if (pressed.has('d') || pressed.has('arrowright')) x += 1;
      if (pressed.has('w') || pressed.has('arrowup')) y -= 1;
      if (pressed.has('s') || pressed.has('arrowdown')) y += 1;
      setPlayerMoveDirection(x, y);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }
      const key = toKey(event.key);
      if (!movementKeys.has(key)) return;
      event.preventDefault();
      pressed.add(key);
      updateDirection();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = toKey(event.key);
      if (!movementKeys.has(key)) return;
      event.preventDefault();
      pressed.delete(key);
      updateDirection();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      setPlayerMoveDirection(0, 0);
    };
  }, [combatState, setPlayerMoveDirection]);

  useEffect(() => {
    if (combatState !== 'fighting') return;

    const currentMonsterIds = new Set(monsters.map(m => m.id));
    const currentMonsterHps = new Map(monsters.map(m => [m.id, m.currentLife]));

    monsters.forEach(monster => {
      const lastHp = lastMonstersRef.current.get(monster.id);
      if (lastHp !== undefined && monster.currentLife < lastHp) {
        const damage = lastHp - monster.currentLife;
        const pos = getMonsterPosition(monster);

        requestAnimationFrame(() => {
          setPlayerAttacking(true);
          spawnDamage(damage, pos.x, pos.y, true, damage > playerStats.averageHit * 1.3);
          setTimeout(() => setPlayerAttacking(false), 100);
        });

        if (monster.currentLife <= 0) {
          requestAnimationFrame(() => {
            setDyingMonsters(prev => new Set([...prev, monster.id]));
            spawnLoot(pos.x, pos.y, monster.rarity);
          });
        }
      }
    });

    lastMonsterIdsRef.current.forEach(id => {
      if (!currentMonsterIds.has(id)) {
        setTimeout(() => {
          setDyingMonsters(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 300);
      }
    });

    if (player.currentLife < lastPlayerHpRef.current && lastPlayerHpRef.current > 0) {
      const damage = lastPlayerHpRef.current - player.currentLife;
      if (damage > 0.5) {
        requestAnimationFrame(() => {
          const attackerId = monsters[Math.floor(Math.random() * monsters.length)]?.id;
          if (attackerId) {
            setAttackingMonsters(prev => new Set([...prev, attackerId]));
            setTimeout(() => {
              setAttackingMonsters(prev => {
                const next = new Set(prev);
                next.delete(attackerId);
                return next;
              });
            }, 100);
          }
          spawnDamage(damage, playerPosition.x, playerPosition.y, false);
        });
      }
    }

    lastMonstersRef.current = currentMonsterHps;
    lastPlayerHpRef.current = player.currentLife;
    lastMonsterIdsRef.current = currentMonsterIds;
  }, [monsters, player.currentLife, combatState, spawnDamage, spawnLoot, playerPosition.x, playerPosition.y, playerStats.averageHit, getMonsterPosition]);

  useEffect(() => {
    if (combatLog.length > lastCombatLogLengthRef.current) {
      const newEntries = combatLog.slice(lastCombatLogLengthRef.current);

      for (const entry of newEntries) {
        if (entry.type === 'evade') {
          requestAnimationFrame(() => {
            spawnDamage(0, playerPosition.x, playerPosition.y, false, false, 'evade');
          });
        } else if (entry.type === 'block') {
          requestAnimationFrame(() => {
            spawnDamage(0, playerPosition.x, playerPosition.y, false, false, 'block');
          });
        }
      }
    }
    lastCombatLogLengthRef.current = combatLog.length;
  }, [combatLog, playerPosition.x, playerPosition.y, spawnDamage]);

  if (combatState === 'idle' || !map) {
    if (fullScreen) {
      return (
        <div
          className={`relative flex items-center justify-center ${className}`}
          style={{
            height: arenaHeight,
            background: 'linear-gradient(to bottom, #0a0a0f 0%, #151520 50%, #0a0a0f 100%)',
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">⚔️</div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">Ready for Battle</h3>
            <p className="text-gray-400 text-sm">Select a map to start hunting</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-[#12121a] rounded-lg border border-[#2a2a3a] overflow-hidden ${className}`}>
        <div className="bg-[#0a0a0f] px-4 py-2 border-b border-[#2a2a3a]">
          <h2 className="text-lg font-bold text-[#c9a227]">⚔️ Combat Arena</h2>
        </div>

        <div
          className="relative flex items-center justify-center"
          style={{
            height: ARENA_HEIGHT,
            background: 'linear-gradient(to bottom, #0a0a0f 0%, #151520 50%, #0a0a0f 100%)',
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">⚔️</div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">Ready for Battle</h3>
            <p className="text-gray-500 text-sm">Select a map to start hunting</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullScreen ? 'relative w-full h-full overflow-hidden' : 'bg-[#12121a] rounded-lg border border-[#2a2a3a] overflow-hidden'} ${className}`}>
      {/* Header */}
      {showOverlayBars && (
        <div className="bg-[#0a0a0f] px-4 py-2 border-b border-[#2a2a3a] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#c9a227]">⚔️ {map.name}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Monsters: <span className="text-white font-medium">{monsters.length}</span>
            </span>
            {!isBossFight && !bossReady && spawnTimer > 0.05 && (
              <span className="text-xs text-gray-500">
                Next: <span className="text-green-400 font-medium">{spawnTimer.toFixed(1)}s</span>
              </span>
            )}
            {combatState === 'fighting' && !bossReady && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-900/30 rounded-full border border-green-700/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">Fighting</span>
              </div>
            )}
            {isBossFight && (
              <div className="px-2 py-0.5 bg-red-900/30 rounded-full border border-red-700/50 animate-pulse">
                <span className="text-xs text-red-400">⚠️ BOSS FIGHT</span>
              </div>
            )}
            {bossReady && !isBossFight && (
              <button
                onClick={startBossFight}
                className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-800 text-white text-xs font-bold rounded
                       hover:from-red-500 hover:to-red-700 transition-all animate-pulse
                       shadow-lg shadow-red-900/50 border border-red-500/50"
              >
                👹 Challenge Boss
              </button>
            )}
            {/* Auto-spawn toggle (only after first clear) */}
            {mapProgress && mapProgress.timesCleared > 0 && !isBossFight && (
              <button
                onClick={toggleAutoBossSpawn}
                title={mapProgress.autoBossSpawn ? 'Boss auto-spawns after kills' : 'Click to enable auto boss spawn'}
                className={`px-2 py-1 rounded text-xs transition-all ${mapProgress.autoBossSpawn
                  ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                  : 'bg-gray-800/50 text-gray-500 border border-gray-600/50 hover:border-gray-500'
                  }`}
              >
                {mapProgress.autoBossSpawn ? '🔄 Auto' : '🔄'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Arena */}
      <div
        className="relative overflow-hidden"
        style={{
          height: showOverlayBars ? arenaHeight : '100%',
          background: `linear-gradient(180deg, ${biomeVisual.skyTop} 0%, ${biomeVisual.skyBottom} 39%, ${biomeVisual.floorFar} 40%, ${biomeVisual.floorNear} 100%)`,
        }}
      >
        {/* Horizon glow */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: '34%',
            height: '16%',
            background: `radial-gradient(ellipse at center, ${biomeVisual.horizonGlow} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />

        {/* Pseudo-3D floor planes */}
        <div
          className="absolute left-[-4%] right-[-4%] pointer-events-none"
          style={{
            top: '38%',
            bottom: '-6%',
            background: `linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(0,0,0,0.22) 74%), repeating-linear-gradient(165deg, ${biomeVisual.laneColor} 0px, ${biomeVisual.laneColor} 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 28px)`,
            backgroundPosition: `${-camera.left * 8}px ${-camera.top * 8}px`,
            clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
            opacity: 0.9,
          }}
        />

        <div
          className="absolute left-[-3%] right-[-3%] pointer-events-none"
          style={{
            top: '42%',
            bottom: '-10%',
            background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.28) 80%)`,
            clipPath: 'polygon(14% 0%, 86% 0%, 98% 100%, 2% 100%)',
          }}
        />

        {/* Geometric props to hint map volume */}
        {terrainProps.map(prop => {
          if (!isWorldPointVisible(prop.x, prop.y, 10)) {
            return null;
          }

          const screenPos = worldToScreen(prop.x, prop.y);
          return (
            <div
              key={prop.id}
              className="absolute pointer-events-none"
              style={{
                left: `${screenPos.x}%`,
                top: `${screenPos.y}%`,
                transform: 'translate(-50%, -50%)',
                width: `${prop.w}px`,
                height: `${prop.h}px`,
                background: `linear-gradient(120deg, ${prop.color} 0%, rgba(0,0,0,0.28) 100%)`,
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: 'inset -8px -8px 10px rgba(0,0,0,0.25)',
                clipPath: 'polygon(15% 0%, 100% 20%, 85% 100%, 0% 78%)',
                opacity: 0.55,
                zIndex: prop.y < playerPosition.y ? 2 : 4,
              }}
            >
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  bottom: -4,
                  width: '85%',
                  height: 5,
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.3)',
                  filter: 'blur(0.5px)',
                }}
              />
            </div>
          );
        })}

        {/* Solid walls / blockers */}
        {mapObstacles.map((obstacle, index) => {
          if (!isWorldRectVisible(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 6)) {
            return null;
          }

          const screenPos = worldToScreen(obstacle.x, obstacle.y);
          return (
            <div
              key={`wall_${index}_${obstacle.x}_${obstacle.y}`}
              className="absolute pointer-events-none"
              style={{
                left: `${screenPos.x}%`,
                top: `${screenPos.y}%`,
                width: `${(obstacle.width / camera.width) * 100}%`,
                height: `${(obstacle.height / camera.height) * 100}%`,
                background: 'linear-gradient(145deg, rgba(40,48,66,0.8), rgba(23,29,43,0.88))',
                border: '1px solid rgba(138,156,191,0.35)',
                boxShadow: 'inset -8px -8px 10px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.25)',
                borderRadius: 8,
                zIndex: obstacle.y > playerPosition.y ? 4 : 3,
              }}
            />
          );
        })}

        {/* Ambient particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-float-particle pointer-events-none"
            style={{
              left: `${8 + i * 11}%`,
              top: `${17 + (i % 4) * 17}%`,
              animationDelay: `${i * 0.55}s`,
              background: 'rgba(255,255,255,0.16)',
            }}
          />
        ))}

        <Character
          type="player"
          position={worldToScreen(playerPosition.x, playerPosition.y)}
          size={55}
          color={{ primary: '#22c55e', secondary: '#15803d', glow: 'rgba(34, 197, 94, 0.5)' }}
          currentHp={player.currentLife}
          maxHp={playerStats.maxLife}
          isAttacking={playerAttacking}
          isDying={false}
          name={player.name}
          level={player.level}
        />

        {onScreenMonsters.map(monster => {
          const pos = getMonsterPosition(monster);
          const screenPos = worldToScreen(pos.x, pos.y);
          const color = RARITY_COLORS[monster.rarity] || RARITY_COLORS.normal;
          const size = monster.rarity === 'boss' ? 75 : 48;
          const inRange = isInMeleeRange(monster, playerPosition);
          const isAdvancing = monster.rarity === 'boss' || monster.aggroState === 'alerted' || monster.aggroState === 'engaged';
          const isTargeted = visibleTarget?.id === monster.id;

          return (
            <Character
              key={monster.id}
              type="monster"
              position={screenPos}
              size={size}
              color={color}
              currentHp={monster.currentLife}
              maxHp={monster.maxLife}
              isAttacking={attackingMonsters.has(monster.id)}
              isDying={dyingMonsters.has(monster.id)}
              isWalking={!inRange && isAdvancing}
              isTargeted={isTargeted}
              name={monster.name}
              level={monster.level}
              isBleeding={monster.bleedRemainingDuration > 0 && monster.bleedDps > 0}
              bleedRemainingDuration={monster.bleedRemainingDuration}
              bleedDps={monster.bleedDps}
            />
          );
        })}

        {/* Damage numbers */}
        {damageNumbers.map(dmg => {
          if (!isWorldPointVisible(dmg.position.x, dmg.position.y, 3)) {
            return null;
          }

          const screenPos = worldToScreen(dmg.position.x, dmg.position.y);
          return <FloatingDamage key={dmg.id} damage={{ ...dmg, position: screenPos }} />;
        })}

        {/* Loot drops */}
        {lootDrops.map(loot => {
          if (!isWorldPointVisible(loot.position.x, loot.position.y, 3)) {
            return null;
          }

          const screenPos = worldToScreen(loot.position.x, loot.position.y);
          return <LootDropAnimation key={loot.id} loot={{ ...loot, position: screenPos }} />;
        })}
      </div>

      {/* Stats bar */}
      {showOverlayBars && (
        <div className="bg-[#0a0a0f] px-4 py-2 border-t border-[#2a2a3a] flex justify-between text-xs">
          <div className="flex gap-4">
            <span className="text-gray-400">
              DPS: <span className="text-green-400 font-medium">{playerStats.dps.toFixed(1)}</span>
            </span>
            <span className="text-gray-400">
              HP: <span className="text-red-400 font-medium">{Math.floor(player.currentLife)}/{Math.floor(playerStats.maxLife)}</span>
            </span>
          </div>
          <div className="text-gray-400 flex gap-3">
            {(() => {
              const inMelee = onScreenMonsters.filter(m => isInMeleeRange(m, playerPosition));
              const approaching = onScreenMonsters.filter(m => !isInMeleeRange(m, playerPosition));
              const offScreenCount = Math.max(0, monsters.length - onScreenMonsters.length);
              const target = getBestTarget(onScreenMonsters, playerPosition);

              return (
                <>
                  {offScreenCount > 0 && (
                    <span>
                      🧭 <span className="text-gray-300">{offScreenCount}</span> off-screen
                    </span>
                  )}
                  {inMelee.length > 0 && (
                    <span>
                      ⚔️ <span className="text-red-400">{inMelee.length}</span> fighting
                    </span>
                  )}
                  {approaching.length > 0 && (
                    <span>
                      🚶 <span className="text-yellow-400">{approaching.length}</span> approaching
                    </span>
                  )}
                  {target && (
                    <span>
                      🎯 <span style={{ color: RARITY_COLORS[target.rarity].primary }}>
                        {target.name}
                      </span>
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
