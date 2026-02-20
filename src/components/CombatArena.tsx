import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { computePlayerStats } from '../lib/combat';
import { isInMeleeRange, getBestTarget } from '../lib/monsters';
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
const PLAYER_X = 12;
const MELEE_X = 25;
const SPAWN_X = 92;

const MONSTER_Y_POSITIONS = [0.5, 0.25, 0.75, 0.15, 0.85];

const RARITY_COLORS = {
  normal: { primary: '#9ca3af', secondary: '#6b7280', glow: 'rgba(156, 163, 175, 0.3)' },
  magic: { primary: '#3b82f6', secondary: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.5)' },
  rare: { primary: '#eab308', secondary: '#ca8a04', glow: 'rgba(234, 179, 8, 0.5)' },
  boss: { primary: '#dc2626', secondary: '#991b1b', glow: 'rgba(220, 38, 38, 0.6)' },
};

function getMonsterX(distance: number): number {
  const t = distance / 100;
  return MELEE_X + (SPAWN_X - MELEE_X) * t;
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
  spriteUrl
}: CharacterProps) {
  const hpPercent = Math.max(0, (currentHp / maxHp) * 100);

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
        <div
          className={`rounded-full flex items-center justify-center font-bold text-white relative transition-all duration-100`}
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle at 30% 30%, ${color.primary}, ${color.secondary})`,
            boxShadow: `0 0 ${isAttacking ? 25 : 12}px ${color.glow}, inset 0 -5px 15px rgba(0,0,0,0.4)`,
            border: `3px solid ${color.primary}`,
            transform: isAttacking ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <span className="select-none" style={{ fontSize: size * 0.4 }}>
            {type === 'player' ? '⚔️' : '💀'}
          </span>

          {/* Shine */}
          <div
            className="absolute rounded-full bg-white/30"
            style={{
              width: size * 0.2,
              height: size * 0.2,
              top: size * 0.1,
              left: size * 0.15,
            }}
          />
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

export function CombatArena() {
  const player = useGameStore(state => state.player);
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
    const x = getMonsterX(monster.distance);

    const y = monster.rarity === 'boss'
      ? 0.5
      : MONSTER_Y_POSITIONS[monster.positionIndex % MONSTER_Y_POSITIONS.length];

    return { x, y };
  }, []);

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
          spawnDamage(damage, pos.x, pos.y * 100, true, damage > playerStats.averageHit * 1.3);
          setTimeout(() => setPlayerAttacking(false), 100);
        });

        if (monster.currentLife <= 0) {
          requestAnimationFrame(() => {
            setDyingMonsters(prev => new Set([...prev, monster.id]));
            spawnLoot(pos.x, pos.y * 100, monster.rarity);
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
          spawnDamage(damage, PLAYER_X, 50, false);
        });
      }
    }

    lastMonstersRef.current = currentMonsterHps;
    lastPlayerHpRef.current = player.currentLife;
    lastMonsterIdsRef.current = currentMonsterIds;
  }, [monsters, player.currentLife, combatState, spawnDamage, spawnLoot, playerStats.averageHit, getMonsterPosition]);

  useEffect(() => {
    if (combatLog.length > lastCombatLogLengthRef.current) {
      const newEntries = combatLog.slice(lastCombatLogLengthRef.current);

      for (const entry of newEntries) {
        if (entry.type === 'evade') {
          requestAnimationFrame(() => {
            spawnDamage(0, PLAYER_X, 50, false, false, 'evade');
          });
        } else if (entry.type === 'block') {
          requestAnimationFrame(() => {
            spawnDamage(0, PLAYER_X, 50, false, false, 'block');
          });
        }
      }
    }
    lastCombatLogLengthRef.current = combatLog.length;
  }, [combatLog, spawnDamage]);

  if (combatState === 'idle' || !map) {
    return (
      <div className="bg-[#12121a] rounded-lg border border-[#2a2a3a] overflow-hidden">
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
    <div className="bg-[#12121a] rounded-lg border border-[#2a2a3a] overflow-hidden">
      {/* Header */}
      <div className="bg-[#0a0a0f] px-4 py-2 border-b border-[#2a2a3a] flex justify-between items-center">
        <h2 className="text-lg font-bold text-[#c9a227]">⚔️ {map.name}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Monsters: <span className="text-white font-medium">{monsters.length}</span>
          </span>
          {!isBossFight && !bossReady && (
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

      {/* Arena */}
      <div
        className="relative overflow-hidden"
        style={{
          height: ARENA_HEIGHT,
          background: 'linear-gradient(180deg, #0d0d14 0%, #12121c 40%, #0d0d14 100%)',
        }}
      >
        {/* Ground effect */}
        <div
          className="absolute left-0 right-0 h-px"
          style={{
            top: '65%',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
          }}
        />

        {/* Ambient particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full animate-float-particle"
            style={{
              left: `${15 + i * 14}%`,
              top: `${25 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}

        <Character
          type="player"
          position={{ x: PLAYER_X, y: 50 }}
          size={55}
          color={{ primary: '#22c55e', secondary: '#15803d', glow: 'rgba(34, 197, 94, 0.5)' }}
          currentHp={player.currentLife}
          maxHp={playerStats.maxLife}
          isAttacking={playerAttacking}
          isDying={false}
          name={player.name}
          level={player.level}
        />

        {monsters.map(monster => {
          const pos = getMonsterPosition(monster);
          const color = RARITY_COLORS[monster.rarity] || RARITY_COLORS.normal;
          const size = monster.rarity === 'boss' ? 75 : 48;
          const inRange = isInMeleeRange(monster);
          const currentTarget = getBestTarget(monsters);
          const isTargeted = currentTarget?.id === monster.id;

          return (
            <Character
              key={monster.id}
              type="monster"
              position={{ x: pos.x, y: pos.y * 100 }}
              size={size}
              color={color}
              currentHp={monster.currentLife}
              maxHp={monster.maxLife}
              isAttacking={attackingMonsters.has(monster.id)}
              isDying={dyingMonsters.has(monster.id)}
              isWalking={!inRange}
              isTargeted={isTargeted}
              name={monster.name}
              level={monster.level}
            />
          );
        })}

        {/* Damage numbers */}
        {damageNumbers.map(dmg => (
          <FloatingDamage key={dmg.id} damage={dmg} />
        ))}

        {/* Loot drops */}
        {lootDrops.map(loot => (
          <LootDropAnimation key={loot.id} loot={loot} />
        ))}
      </div>

      {/* Stats bar */}
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
            const inMelee = monsters.filter(m => isInMeleeRange(m));
            const approaching = monsters.filter(m => !isInMeleeRange(m));
            const target = getBestTarget(monsters);

            return (
              <>
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
    </div>
  );
}
