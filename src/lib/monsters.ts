import type { Monster, MonsterRarity, MonsterDefinition } from '../types';
import { monsterById, bossById, mapById } from '../data';

let monsterIdCounter = 0;
function generateMonsterId(): string {
  return `monster_${Date.now()}_${monsterIdCounter++}`;
}

const SPAWN_DISTANCE = 100;
const MELEE_RANGE = 5;
const BASE_MOVE_SPEED = 35;
const ARENA_MIN = 6;
const ARENA_MAX = 94;

export interface ArenaPosition {
  x: number;
  y: number;
}

export interface ArenaObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PLAYER_ARENA_POSITION: ArenaPosition = { x: 50, y: 56 };

const DEFAULT_OBSTACLES: ArenaObstacle[] = [
  { x: 30, y: 40, width: 8, height: 18 },
  { x: 64, y: 64, width: 10, height: 14 },
];

const MAP_OBSTACLES: Record<string, ArenaObstacle[]> = {
  twilightStrand: [
    { x: 37, y: 36, width: 9, height: 20 },
    { x: 59, y: 64, width: 11, height: 16 },
  ],
  coast: [
    { x: 44, y: 35, width: 12, height: 12 },
    { x: 62, y: 52, width: 8, height: 18 },
    { x: 30, y: 66, width: 9, height: 14 },
  ],
};

export const RARITY_PRIORITY: Record<MonsterRarity, number> = {
  normal: 1,
  magic: 2,
  rare: 3,
  boss: 4,
};

function clampArenaPosition(value: number): number {
  return Math.max(ARENA_MIN, Math.min(ARENA_MAX, value));
}

function normalize(dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy);
  if (len <= 0.0001) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

function rotateVector(x: number, y: number, radians: number): { x: number; y: number } {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return {
    x: x * c - y * s,
    y: x * s + y * c,
  };
}

function pointIntersectsObstacle(x: number, y: number, radius: number, obstacle: ArenaObstacle): boolean {
  return (
    x + radius > obstacle.x &&
    x - radius < obstacle.x + obstacle.width &&
    y + radius > obstacle.y &&
    y - radius < obstacle.y + obstacle.height
  );
}

function collidesWithAnyObstacle(
  x: number,
  y: number,
  radius: number,
  obstacles: ArenaObstacle[],
): boolean {
  return obstacles.some(obstacle => pointIntersectsObstacle(x, y, radius, obstacle));
}

function getSpawnPointFromEdge(): ArenaPosition {
  const edge = Math.floor(Math.random() * 4);
  const spread = () => 14 + Math.random() * 72;

  if (edge === 0) return { x: spread(), y: ARENA_MIN };
  if (edge === 1) return { x: ARENA_MAX, y: spread() };
  if (edge === 2) return { x: spread(), y: ARENA_MAX };
  return { x: ARENA_MIN, y: spread() };
}

function distanceToPlayerFrom(x: number, y: number): number {
  return Math.hypot(x - PLAYER_ARENA_POSITION.x, y - PLAYER_ARENA_POSITION.y);
}

export function getArenaObstaclesForMap(mapId: string): ArenaObstacle[] {
  return MAP_OBSTACLES[mapId] ?? DEFAULT_OBSTACLES;
}

/**
 * Scale monster stats based on level
 */
function scaleMonsterStats(base: MonsterDefinition, level: number): {
  maxLife: number;
  damage: number;
  experienceReward: number;
  attackSpeed: number;
} {
  const levelStats = base.levelStats?.[level];
  if (levelStats) {
    const fromAttackTime = levelStats.attackTime && levelStats.attackTime > 0
      ? 1 / levelStats.attackTime
      : undefined;

    return {
      maxLife: Math.floor(levelStats.life ?? base.baseLife),
      damage: Math.floor(levelStats.damage ?? base.baseDamage),
      experienceReward: Math.floor(levelStats.experience ?? base.experienceReward),
      attackSpeed: Number((levelStats.attackSpeed ?? fromAttackTime ?? base.attackSpeed).toFixed(4)),
    };
  }

  const levelMultiplier = Math.pow(1.1, level - 1);
  
  return {
    maxLife: Math.floor(base.baseLife * levelMultiplier),
    damage: Math.floor(base.baseDamage * levelMultiplier),
    experienceReward: Math.floor(base.experienceReward * levelMultiplier),
    attackSpeed: base.attackSpeed,
  };
}

/**
 * Get move speed based on rarity (rarer = slightly slower, more menacing)
 */
function getMoveSpeed(rarity: MonsterRarity): number {
  const speedMultipliers: Record<MonsterRarity, number> = {
    normal: 1.0,
    magic: 0.9,
    rare: 0.8,
    boss: 0.6, // Boss is slow but deadly
  };
  return BASE_MOVE_SPEED * speedMultipliers[rarity];
}

/**
 * Create a monster instance from a definition
 */
export function spawnMonster(
  definitionId: string,
  level: number,
  positionIndex: number = 0,
  spawnPoint: ArenaPosition = getSpawnPointFromEdge(),
  forcedRarity?: MonsterRarity
): Monster | null {
  const definition = monsterById.get(definitionId);
  if (!definition) return null;
  
  let rarity: MonsterRarity = forcedRarity || 'normal';
  if (!forcedRarity) {
    const rarityRoll = Math.random() * 100;
    if (rarityRoll < 2) {
      rarity = 'rare';
    } else if (rarityRoll < 10) {
      rarity = 'magic';
    }
  }
  
  const rarityMultipliers: Record<MonsterRarity, { life: number; damage: number; loot: number; exp: number }> = {
    normal: { life: 1, damage: 1, loot: 1, exp: 1 },
    magic: { life: 2, damage: 1.3, loot: 2, exp: 1.5 },
    rare: { life: 4, damage: 1.6, loot: 4, exp: 2.5 },
    boss: { life: 10, damage: 2, loot: 10, exp: 5 },
  };
  
  const multiplier = rarityMultipliers[rarity];
  const scaled = scaleMonsterStats(definition, level);
  
  const clampedX = clampArenaPosition(spawnPoint.x);
  const clampedY = clampArenaPosition(spawnPoint.y);

  return {
    id: generateMonsterId(),
    definitionId,
    name: rarity === 'normal' ? definition.name : `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${definition.name}`,
    level,
    rarity,
    maxLife: Math.floor(scaled.maxLife * multiplier.life),
    currentLife: Math.floor(scaled.maxLife * multiplier.life),
    damage: Math.floor(scaled.damage * multiplier.damage),
    attackSpeed: scaled.attackSpeed,
    damageType: definition.damageType,
    experienceReward: Math.floor(scaled.experienceReward * multiplier.exp),
    lootBonus: definition.lootBonus * multiplier.loot,
    positionIndex,
    arenaX: clampedX,
    arenaY: clampedY,
    distance: distanceToPlayerFrom(clampedX, clampedY),
    moveSpeed: getMoveSpeed(rarity),
    attackCooldown: 0,
    bleedDps: 0,
    bleedRemainingDuration: 0,
  };
}

/**
 * Spawn a boss from a map
 */
export function spawnBoss(bossId: string, mapLevel: number): Monster | null {
  const definition = bossById.get(bossId);
  if (!definition) return null;
  
  const scaled = scaleMonsterStats(definition, mapLevel);
  
  const skillStates = definition.skills.map(skill => ({
    skillId: skill.id,
    currentCooldown: 0,
  }));
  
  const spawnPoint = { x: 50, y: 10 };

  return {
    id: generateMonsterId(),
    definitionId: bossId,
    name: definition.name,
    level: mapLevel,
    rarity: 'boss',
    maxLife: scaled.maxLife,
    currentLife: scaled.maxLife,
    damage: scaled.damage,
    attackSpeed: scaled.attackSpeed,
    damageType: definition.damageType,
    experienceReward: scaled.experienceReward,
    lootBonus: definition.lootBonus,
    positionIndex: 0, // Boss is always center
    arenaX: spawnPoint.x,
    arenaY: spawnPoint.y,
    distance: distanceToPlayerFrom(spawnPoint.x, spawnPoint.y),
    moveSpeed: getMoveSpeed('boss'),
    attackCooldown: 0, // Ready to attack when in range
    bleedDps: 0,
    bleedRemainingDuration: 0,
    skillStates, // Boss skill cooldowns
  };
}

/**
 * Spawn a random monster for a map
 */
export function spawnMapMonster(mapId: string, positionIndex: number = 0): Monster | null {
  const map = mapById.get(mapId);
  if (!map) return null;
  
  const monsterId = map.monsterPool[Math.floor(Math.random() * map.monsterPool.length)];
  
  return spawnMonster(monsterId, map.monsterLevel, positionIndex, getSpawnPointFromEdge());
}

/**
 * Get next available position index for a new monster
 */
export function getNextPositionIndex(existingMonsters: Monster[]): number {
  if (existingMonsters.length === 0) return 0;
  
  const usedPositions = new Set(existingMonsters.map(m => m.positionIndex));
  for (let i = 0; i < 10; i++) {
    if (!usedPositions.has(i)) return i;
  }
  return existingMonsters.length;
}

/**
 * Check if monster is in melee range
 */
export function isInMeleeRange(monster: Monster): boolean {
  return getDistanceToPlayer(monster) <= MELEE_RANGE;
}

/**
 * Get the best target based on priority (rarity first, then HP)
 * Only considers monsters in melee range
 */
export function getBestTarget(monsters: Monster[]): Monster | null {
  const inRange = monsters.filter(m => isInMeleeRange(m) && m.currentLife > 0);
  if (inRange.length === 0) return null;
  
  const sorted = [...inRange].sort((a, b) => {
    const priorityDiff = RARITY_PRIORITY[b.rarity] - RARITY_PRIORITY[a.rarity];
    if (priorityDiff !== 0) return priorityDiff;
    return a.currentLife - b.currentLife;
  });
  
  return sorted[0];
}

export function getDistanceToPlayer(monster: Monster): number {
  return distanceToPlayerFrom(monster.arenaX, monster.arenaY);
}

export function stepMonsterTowardsPlayer(
  monster: Monster,
  mapId: string,
  deltaTime: number,
): Monster {
  const obstacles = getArenaObstaclesForMap(mapId);
  const radius = monster.rarity === 'boss' ? 2.2 : 1.2;

  const toPlayerX = PLAYER_ARENA_POSITION.x - monster.arenaX;
  const toPlayerY = PLAYER_ARENA_POSITION.y - monster.arenaY;
  const toPlayer = normalize(toPlayerX, toPlayerY);
  const moveDistance = Math.max(0, monster.moveSpeed * deltaTime);

  const angleSteps = [0, Math.PI / 10, -Math.PI / 10, Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3, Math.PI / 2, -Math.PI / 2];
  let best: { x: number; y: number; distance: number } | null = null;

  for (const radians of angleSteps) {
    const candidateDir = rotateVector(toPlayer.x, toPlayer.y, radians);
    const candidateX = clampArenaPosition(monster.arenaX + candidateDir.x * moveDistance);
    const candidateY = clampArenaPosition(monster.arenaY + candidateDir.y * moveDistance);
    if (collidesWithAnyObstacle(candidateX, candidateY, radius, obstacles)) {
      continue;
    }

    const candidateDistance = distanceToPlayerFrom(candidateX, candidateY);
    if (!best || candidateDistance < best.distance) {
      best = { x: candidateX, y: candidateY, distance: candidateDistance };
    }
  }

  if (!best) {
    return {
      ...monster,
      distance: getDistanceToPlayer(monster),
    };
  }

  return {
    ...monster,
    arenaX: best.x,
    arenaY: best.y,
    distance: best.distance,
  };
}

export { SPAWN_DISTANCE, MELEE_RANGE, BASE_MOVE_SPEED };
