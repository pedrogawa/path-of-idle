import type { Monster, MonsterAggroState, MonsterRarity, MonsterDefinition } from '../types';
import { monsterById, bossById, mapById } from '../data';

let monsterIdCounter = 0;
function generateMonsterId(): string {
  return `monster_${Date.now()}_${monsterIdCounter++}`;
}

const SPAWN_DISTANCE = 100;
const MELEE_RANGE = 12;
const BASE_MOVE_SPEED = 35;
const PLAYER_MOVE_SPEED = 26;
const ARENA_MIN = 6;
const ARENA_MAX = 94;
const PACK_MIN_SIZE = 3;
const PACK_MAX_SIZE = 5;
const PACK_NODE_MIN_DISTANCE = 18;
const PACK_MIN_PLAYER_DISTANCE = 24;
const PACK_SPAWN_RADIUS = 7.5;

export const MONSTER_ALERT_RANGE = 34;
export const MONSTER_ENGAGE_RANGE = 24;
export const MONSTER_DISENGAGE_RANGE = 44;

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

function pointInsideObstacle(x: number, y: number, obstacle: ArenaObstacle, padding: number = 0): boolean {
  return (
    x > obstacle.x - padding &&
    x < obstacle.x + obstacle.width + padding &&
    y > obstacle.y - padding &&
    y < obstacle.y + obstacle.height + padding
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSpawnPointFromEdge(): ArenaPosition {
  const edge = Math.floor(Math.random() * 4);
  const spread = () => 14 + Math.random() * 72;

  if (edge === 0) return { x: spread(), y: ARENA_MIN };
  if (edge === 1) return { x: ARENA_MAX, y: spread() };
  if (edge === 2) return { x: spread(), y: ARENA_MAX };
  return { x: ARENA_MIN, y: spread() };
}

function distanceToPlayerFrom(
  x: number,
  y: number,
  playerPosition: ArenaPosition = PLAYER_ARENA_POSITION,
): number {
  return Math.hypot(x - playerPosition.x, y - playerPosition.y);
}

export function getArenaObstaclesForMap(mapId: string): ArenaObstacle[] {
  return MAP_OBSTACLES[mapId] ?? DEFAULT_OBSTACLES;
}

function getEncounterNodesForMap(
  mapId: string,
  count: number,
): ArenaPosition[] {
  const obstacles = getArenaObstaclesForMap(mapId);
  const minNodeDistance = Math.max(11, PACK_NODE_MIN_DISTANCE - Math.floor(count / 4));
  const nodes: ArenaPosition[] = [];

  for (let attempt = 0; attempt < count * 70 && nodes.length < count; attempt += 1) {
    const candidate = {
      x: 12 + Math.random() * 76,
      y: 14 + Math.random() * 72,
    };

    if (distanceToPlayerFrom(candidate.x, candidate.y, PLAYER_ARENA_POSITION) < PACK_MIN_PLAYER_DISTANCE) {
      continue;
    }

    if (collidesWithAnyObstacle(candidate.x, candidate.y, 2.5, obstacles)) {
      continue;
    }

    const tooCloseToExisting = nodes.some(node => Math.hypot(node.x - candidate.x, node.y - candidate.y) < minNodeDistance);
    if (tooCloseToExisting) {
      continue;
    }

    nodes.push(candidate);
  }

  if (nodes.length >= count) {
    return nodes;
  }

  const fallbackNodes: ArenaPosition[] = [
    { x: 18, y: 22 },
    { x: 82, y: 22 },
    { x: 20, y: 78 },
    { x: 80, y: 78 },
    { x: 50, y: 22 },
    { x: 50, y: 80 },
    { x: 24, y: 52 },
    { x: 76, y: 52 },
  ];

  for (const node of fallbackNodes) {
    if (nodes.length >= count) break;
    if (distanceToPlayerFrom(node.x, node.y, PLAYER_ARENA_POSITION) < PACK_MIN_PLAYER_DISTANCE) continue;
    if (collidesWithAnyObstacle(node.x, node.y, 2.5, obstacles)) continue;
    nodes.push(node);
  }

  if (nodes.length === 0) {
    nodes.push({ x: 18, y: 22 });
  }

  const existingNodes = [...nodes];
  while (nodes.length < count) {
    const base = existingNodes[nodes.length % existingNodes.length];
    nodes.push({ x: base.x, y: base.y });
  }

  return nodes.slice(0, count);
}

function buildPackSizes(totalMonsters: number): number[] {
  const total = Math.max(0, Math.floor(totalMonsters));
  if (total === 0) return [];

  const sizes: number[] = [];
  let remaining = total;

  while (remaining > 0) {
    if (remaining <= PACK_MAX_SIZE) {
      if (remaining < PACK_MIN_SIZE && sizes.length > 0) {
        sizes[sizes.length - 1] += remaining;
      } else {
        sizes.push(remaining);
      }
      break;
    }

    const maxAllowed = Math.min(PACK_MAX_SIZE, remaining - PACK_MIN_SIZE);
    const size = randomInt(PACK_MIN_SIZE, Math.max(PACK_MIN_SIZE, maxAllowed));
    sizes.push(size);
    remaining -= size;
  }

  return sizes;
}

function getPackMemberSpawnPoint(
  center: ArenaPosition,
  memberIndex: number,
  packSize: number,
  obstacles: ArenaObstacle[],
): ArenaPosition {
  const baseAngle = (Math.PI * 2 * memberIndex) / Math.max(1, packSize);
  const attemptAngles = [0, Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3];
  const attemptRadii = [1, 0.8, 0.6, 0.45];

  for (const radiusMultiplier of attemptRadii) {
    for (const angleOffset of attemptAngles) {
      const angle = baseAngle + angleOffset + (Math.random() - 0.5) * 0.16;
      const radius = PACK_SPAWN_RADIUS * radiusMultiplier * (0.55 + Math.random() * 0.45);
      const x = clampArenaPosition(center.x + Math.cos(angle) * radius);
      const y = clampArenaPosition(center.y + Math.sin(angle) * radius);
      if (!collidesWithAnyObstacle(x, y, 1.2, obstacles)) {
        return { x, y };
      }
    }
  }

  return {
    x: clampArenaPosition(center.x),
    y: clampArenaPosition(center.y),
  };
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
  forcedRarity?: MonsterRarity,
  options?: {
    packId?: string;
    aggroState?: MonsterAggroState;
  },
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
    packId: options?.packId ?? 'ambient',
    aggroState: options?.aggroState ?? 'engaged',
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
    packId: 'boss',
    aggroState: 'engaged',
  };
}

/**
 * Spawn a random monster for a map
 */
export function spawnMapMonster(mapId: string, positionIndex: number = 0): Monster | null {
  const map = mapById.get(mapId);
  if (!map) return null;
  
  const monsterId = map.monsterPool[Math.floor(Math.random() * map.monsterPool.length)];
  
  return spawnMonster(
    monsterId,
    map.monsterLevel,
    positionIndex,
    getSpawnPointFromEdge(),
    undefined,
    {
      packId: `edge_spawn_${positionIndex}`,
      aggroState: 'engaged',
    },
  );
}

export function spawnMapEncounterWave(mapId: string, totalMonsters: number): Monster[] {
  const map = mapById.get(mapId);
  if (!map) return [];

  const packSizes = buildPackSizes(totalMonsters);
  if (packSizes.length === 0) return [];

  const nodes = getEncounterNodesForMap(mapId, packSizes.length);
  const obstacles = getArenaObstaclesForMap(mapId);
  const spawned: Monster[] = [];
  let nextPositionIndex = 0;

  packSizes.forEach((packSize, packIndex) => {
    const packId = `pack_${Date.now()}_${packIndex}`;
    const center = nodes[packIndex];
    const monsterId = map.monsterPool[Math.floor(Math.random() * map.monsterPool.length)];

    for (let memberIndex = 0; memberIndex < packSize; memberIndex += 1) {
      const spawnPoint = getPackMemberSpawnPoint(center, memberIndex, packSize, obstacles);
      const monster = spawnMonster(
        monsterId,
        map.monsterLevel,
        nextPositionIndex,
        spawnPoint,
        undefined,
        {
          packId,
          aggroState: 'idle',
        },
      );

      if (monster) {
        spawned.push(monster);
        nextPositionIndex += 1;
      }
    }
  });

  return spawned;
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
export function isInMeleeRange(
  monster: Monster,
  playerPosition: ArenaPosition = PLAYER_ARENA_POSITION,
): boolean {
  return getDistanceToPlayer(monster, playerPosition) <= MELEE_RANGE;
}

/**
 * Get the best target based on priority (rarity first, then HP)
 * Only considers monsters in melee range
 */
export function getBestTarget(
  monsters: Monster[],
  playerPosition: ArenaPosition = PLAYER_ARENA_POSITION,
): Monster | null {
  const inRange = monsters.filter(m => isInMeleeRange(m, playerPosition) && m.currentLife > 0);
  if (inRange.length === 0) return null;
  
  const sorted = [...inRange].sort((a, b) => {
    const priorityDiff = RARITY_PRIORITY[b.rarity] - RARITY_PRIORITY[a.rarity];
    if (priorityDiff !== 0) return priorityDiff;
    return a.currentLife - b.currentLife;
  });
  
  return sorted[0];
}

export function getDistanceToPlayer(
  monster: Monster,
  playerPosition: ArenaPosition = PLAYER_ARENA_POSITION,
): number {
  return distanceToPlayerFrom(monster.arenaX, monster.arenaY, playerPosition);
}

export function hasLineOfSightToPlayer(
  monster: Monster,
  mapId: string,
  playerPosition: ArenaPosition = PLAYER_ARENA_POSITION,
): boolean {
  const obstacles = getArenaObstaclesForMap(mapId);
  if (obstacles.length === 0) {
    return true;
  }

  const startX = monster.arenaX;
  const startY = monster.arenaY;
  const endX = playerPosition.x;
  const endY = playerPosition.y;
  const distance = Math.hypot(endX - startX, endY - startY);
  const steps = Math.max(8, Math.ceil(distance / 2));

  for (let step = 1; step < steps; step += 1) {
    const t = step / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;

    const blocked = obstacles.some(obstacle => pointInsideObstacle(x, y, obstacle, 0.3));
    if (blocked) {
      return false;
    }
  }

  return true;
}

export function stepMonsterTowardsPlayer(
  monster: Monster,
  mapId: string,
  deltaTime: number,
  playerPosition: ArenaPosition = PLAYER_ARENA_POSITION,
): Monster {
  const obstacles = getArenaObstaclesForMap(mapId);
  const radius = monster.rarity === 'boss' ? 2.2 : 1.2;
  const currentDistance = distanceToPlayerFrom(monster.arenaX, monster.arenaY, playerPosition);

  // Hold position once in melee so monsters stop "pushing" through the player.
  if (currentDistance <= MELEE_RANGE) {
    return {
      ...monster,
      distance: currentDistance,
    };
  }

  const toPlayerX = playerPosition.x - monster.arenaX;
  const toPlayerY = playerPosition.y - monster.arenaY;
  const toPlayer = normalize(toPlayerX, toPlayerY);
  const desiredAdvance = Math.max(0, monster.moveSpeed * deltaTime);
  const maxAdvanceWithoutEnteringMelee = Math.max(0, currentDistance - MELEE_RANGE);
  const maxStepDistance = Math.min(desiredAdvance, maxAdvanceWithoutEnteringMelee);

  if (maxStepDistance <= 0) {
    return {
      ...monster,
      distance: currentDistance,
    };
  }

  const angleSteps = [0, Math.PI / 10, -Math.PI / 10, Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3, Math.PI / 2, -Math.PI / 2];
  const stepAttempts = [1, 0.75, 0.5, 0.25, 0.1]
    .map(multiplier => maxStepDistance * multiplier)
    .filter(step => step > 0.01);

  for (const stepDistance of stepAttempts) {
    let best: { x: number; y: number; distance: number } | null = null;

    for (const radians of angleSteps) {
      const candidateDir = rotateVector(toPlayer.x, toPlayer.y, radians);
      const candidateX = clampArenaPosition(monster.arenaX + candidateDir.x * stepDistance);
      const candidateY = clampArenaPosition(monster.arenaY + candidateDir.y * stepDistance);
      if (collidesWithAnyObstacle(candidateX, candidateY, radius, obstacles)) {
        continue;
      }

      const candidateDistance = distanceToPlayerFrom(candidateX, candidateY, playerPosition);
      if (!best || candidateDistance < best.distance) {
        best = { x: candidateX, y: candidateY, distance: candidateDistance };
      }
    }

    if (best) {
      return {
        ...monster,
        arenaX: best.x,
        arenaY: best.y,
        distance: best.distance,
      };
    }
  }

  return {
    ...monster,
    distance: getDistanceToPlayer(monster, playerPosition),
  };
}

export function stepPlayerPosition(
  playerPosition: ArenaPosition,
  mapId: string,
  deltaTime: number,
  directionX: number,
  directionY: number,
): ArenaPosition {
  const magnitude = Math.hypot(directionX, directionY);
  if (magnitude <= 0.001) {
    return playerPosition;
  }

  const dirX = directionX / magnitude;
  const dirY = directionY / magnitude;
  const moveDistance = Math.max(0, PLAYER_MOVE_SPEED * deltaTime);
  const obstacles = getArenaObstaclesForMap(mapId);
  const radius = 1.2;
  const attempts = [1, 0.75, 0.5, 0.25];

  for (const mult of attempts) {
    const candidateX = clampArenaPosition(playerPosition.x + dirX * moveDistance * mult);
    const candidateY = clampArenaPosition(playerPosition.y + dirY * moveDistance * mult);
    if (!collidesWithAnyObstacle(candidateX, candidateY, radius, obstacles)) {
      return { x: candidateX, y: candidateY };
    }
  }

  // Sliding fallback: keep whichever axis can move around obstacle.
  const slideX = clampArenaPosition(playerPosition.x + dirX * moveDistance * 0.5);
  if (!collidesWithAnyObstacle(slideX, playerPosition.y, radius, obstacles)) {
    return { x: slideX, y: playerPosition.y };
  }
  const slideY = clampArenaPosition(playerPosition.y + dirY * moveDistance * 0.5);
  if (!collidesWithAnyObstacle(playerPosition.x, slideY, radius, obstacles)) {
    return { x: playerPosition.x, y: slideY };
  }

  return playerPosition;
}

export function stepPlayerTowardsTarget(
  playerPosition: ArenaPosition,
  targetPosition: ArenaPosition,
  mapId: string,
  deltaTime: number,
): ArenaPosition {
  const toTargetX = targetPosition.x - playerPosition.x;
  const toTargetY = targetPosition.y - playerPosition.y;
  const distanceToTarget = Math.hypot(toTargetX, toTargetY);

  if (distanceToTarget <= 0.001) {
    return playerPosition;
  }

  const moveDistance = Math.max(0, PLAYER_MOVE_SPEED * deltaTime);
  if (moveDistance <= 0.001) {
    return playerPosition;
  }

  const obstacles = getArenaObstaclesForMap(mapId);
  const radius = 1.2;
  const targetDir = normalize(toTargetX, toTargetY);
  const angleSteps = [0, Math.PI / 10, -Math.PI / 10, Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3, Math.PI / 2, -Math.PI / 2];
  const stepAttempts = [1, 0.75, 0.5, 0.25]
    .map(multiplier => moveDistance * multiplier)
    .filter(step => step > 0.01);

  for (const stepDistance of stepAttempts) {
    let best: { x: number; y: number; distance: number } | null = null;

    for (const radians of angleSteps) {
      const candidateDir = rotateVector(targetDir.x, targetDir.y, radians);
      const candidateX = clampArenaPosition(playerPosition.x + candidateDir.x * stepDistance);
      const candidateY = clampArenaPosition(playerPosition.y + candidateDir.y * stepDistance);
      if (collidesWithAnyObstacle(candidateX, candidateY, radius, obstacles)) {
        continue;
      }

      const candidateDistance = Math.hypot(targetPosition.x - candidateX, targetPosition.y - candidateY);
      if (!best || candidateDistance < best.distance) {
        best = { x: candidateX, y: candidateY, distance: candidateDistance };
      }
    }

    if (best) {
      return {
        x: best.x,
        y: best.y,
      };
    }
  }

  // Last fallback: try direct axis sliding.
  return stepPlayerPosition(playerPosition, mapId, deltaTime, toTargetX, toTargetY);
}

export { SPAWN_DISTANCE, MELEE_RANGE, BASE_MOVE_SPEED, PLAYER_MOVE_SPEED, ARENA_MIN, ARENA_MAX };
