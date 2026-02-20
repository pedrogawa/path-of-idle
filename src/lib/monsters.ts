import type { Monster, MonsterRarity, MonsterDefinition } from '../types';
import { monsterById, bossById, mapById } from '../data';

let monsterIdCounter = 0;
function generateMonsterId(): string {
  return `monster_${Date.now()}_${monsterIdCounter++}`;
}

const SPAWN_DISTANCE = 100;
const MELEE_RANGE = 5;
const BASE_MOVE_SPEED = 35;

export const RARITY_PRIORITY: Record<MonsterRarity, number> = {
  normal: 1,
  magic: 2,
  rare: 3,
  boss: 4,
};

/**
 * Scale monster stats based on level
 */
function scaleMonsterStats(base: MonsterDefinition, level: number): {
  maxLife: number;
  damage: number;
  experienceReward: number;
} {
  const levelMultiplier = Math.pow(1.1, level - 1);
  
  return {
    maxLife: Math.floor(base.baseLife * levelMultiplier),
    damage: Math.floor(base.baseDamage * levelMultiplier),
    experienceReward: Math.floor(base.experienceReward * levelMultiplier),
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
  
  return {
    id: generateMonsterId(),
    definitionId,
    name: rarity === 'normal' ? definition.name : `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${definition.name}`,
    level,
    rarity,
    maxLife: Math.floor(scaled.maxLife * multiplier.life),
    currentLife: Math.floor(scaled.maxLife * multiplier.life),
    damage: Math.floor(scaled.damage * multiplier.damage),
    attackSpeed: definition.attackSpeed,
    damageType: definition.damageType,
    experienceReward: Math.floor(scaled.experienceReward * multiplier.exp),
    lootBonus: definition.lootBonus * multiplier.loot,
    positionIndex,
    distance: SPAWN_DISTANCE,
    moveSpeed: getMoveSpeed(rarity),
    attackCooldown: 0,
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
  
  return {
    id: generateMonsterId(),
    definitionId: bossId,
    name: definition.name,
    level: mapLevel,
    rarity: 'boss',
    maxLife: scaled.maxLife,
    currentLife: scaled.maxLife,
    damage: scaled.damage,
    attackSpeed: definition.attackSpeed,
    damageType: definition.damageType,
    experienceReward: scaled.experienceReward,
    lootBonus: definition.lootBonus,
    positionIndex: 0, // Boss is always center
    distance: SPAWN_DISTANCE,
    moveSpeed: getMoveSpeed('boss'),
    attackCooldown: 0, // Ready to attack when in range
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
  
  return spawnMonster(monsterId, map.monsterLevel, positionIndex);
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
  return monster.distance <= MELEE_RANGE;
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

export { SPAWN_DISTANCE, MELEE_RANGE, BASE_MOVE_SPEED };
