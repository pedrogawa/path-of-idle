import { supportGemById } from '../data';
import { computePlayerStats } from './combat';
import type {
  Player,
  PlayerSkill,
  PlayerSupportGem,
  SkillDefinition,
  SupportGemDefinition,
} from '../types';

export interface SkillRuntimeStats {
  manaCost: number;
  cooldown: number;
  damageMultiplier: number;
  addedDamageMin: number;
  addedDamageMax: number;
  numberOfHits: number;
  aoeRadius: number;
  doubleDamageChance?: number;
  critBonusChance?: number;
  lifestealPercent?: number;
  supportGems: SupportGemDefinition[];
}

export interface SkillDamageEstimate {
  min: number;
  max: number;
  avg: number;
}

function isSupportCompatible(skillType: SkillDefinition['type'], support: SupportGemDefinition): boolean {
  return support.compatibleSkillTypes.includes(skillType);
}

function getLeveledSkillValue(baseValue: number, valuesByLevel: number[] | undefined, level: number): number {
  if (!valuesByLevel || valuesByLevel.length === 0) return baseValue;

  const levelIndex = Math.max(0, Math.min(valuesByLevel.length - 1, level - 1));
  return valuesByLevel[levelIndex];
}

export function getSocketedSupportGems(
  skill: PlayerSkill,
  supportGemInstances: PlayerSupportGem[]
): SupportGemDefinition[] {
  const instanceById = new Map(supportGemInstances.map(instance => [instance.instanceId, instance]));
  const gems: SupportGemDefinition[] = [];

  for (const supportInstanceId of skill.socketedSupportIds) {
    const supportInstance = instanceById.get(supportInstanceId);
    if (!supportInstance) continue;
    const support = supportGemById.get(supportInstance.definitionId);
    if (support) gems.push(support);
  }

  return gems;
}

export function getSkillRuntimeStats(
  skillDef: SkillDefinition,
  playerSkill: PlayerSkill,
  supportGemInstances: PlayerSupportGem[]
): SkillRuntimeStats {
  const skillLevel = Math.max(1, playerSkill.level);
  let manaCost = getLeveledSkillValue(skillDef.manaCost, skillDef.manaCostByLevel, skillLevel);
  let cooldown = skillDef.cooldown;
  let damageMultiplier = getLeveledSkillValue(skillDef.damageMultiplier, skillDef.damageMultiplierByLevel, skillLevel);
  let addedDamageMin = skillDef.addedDamageMin || 0;
  let addedDamageMax = skillDef.addedDamageMax || 0;
  let numberOfHits = skillDef.numberOfHits || 1;
  const doubleDamageChance = getLeveledSkillValue(
    skillDef.doubleDamageChance || 0,
    skillDef.doubleDamageChanceByLevel,
    skillLevel
  );

  const supportGems = getSocketedSupportGems(playerSkill, supportGemInstances).filter(support =>
    isSupportCompatible(skillDef.type, support)
  );

  for (const support of supportGems) {
    if (support.moreDamageMultiplier) {
      damageMultiplier *= 1 + support.moreDamageMultiplier;
    }

    if (support.cooldownMultiplier) {
      cooldown *= support.cooldownMultiplier;
    }

    if (support.manaMultiplier) {
      manaCost *= support.manaMultiplier;
    }

    if (support.addedDamageMin) {
      addedDamageMin += support.addedDamageMin;
    }

    if (support.addedDamageMax) {
      addedDamageMax += support.addedDamageMax;
    }

    if (support.addedHits) {
      numberOfHits += support.addedHits;
    }
  }

  return {
    manaCost: Math.max(0, Math.round(manaCost)),
    cooldown: Math.max(0, cooldown),
    damageMultiplier,
    addedDamageMin,
    addedDamageMax,
    numberOfHits: Math.max(1, numberOfHits),
    aoeRadius: skillDef.aoeRadius || 1,
    doubleDamageChance: doubleDamageChance > 0 ? doubleDamageChance : undefined,
    critBonusChance: skillDef.critBonusChance,
    lifestealPercent: skillDef.lifestealPercent,
    supportGems,
  };
}

export function estimateSkillDamageRange(
  player: Player,
  runtime: SkillRuntimeStats
): SkillDamageEstimate {
  const stats = computePlayerStats(player);

  const physMin = stats.physicalDamageMin * (1 + stats.increasedPhysicalDamage / 100);
  const physMax = stats.physicalDamageMax * (1 + stats.increasedPhysicalDamage / 100);
  const fireMin = stats.fireDamageMin * (1 + stats.increasedFireDamage / 100);
  const fireMax = stats.fireDamageMax * (1 + stats.increasedFireDamage / 100);
  const coldMin = stats.coldDamageMin * (1 + stats.increasedColdDamage / 100);
  const coldMax = stats.coldDamageMax * (1 + stats.increasedColdDamage / 100);
  const lightningMin = stats.lightningDamageMin * (1 + stats.increasedLightningDamage / 100);
  const lightningMax = stats.lightningDamageMax * (1 + stats.increasedLightningDamage / 100);

  const baseMin = physMin + fireMin + coldMin + lightningMin;
  const baseMax = physMax + fireMax + coldMax + lightningMax;

  const weaponPartMin = baseMin * runtime.damageMultiplier;
  const weaponPartMax = baseMax * runtime.damageMultiplier;

  const rawMin = (weaponPartMin + runtime.addedDamageMin) * runtime.numberOfHits;
  const rawMax = (weaponPartMax + runtime.addedDamageMax) * runtime.numberOfHits;
  const avg = (rawMin + rawMax) / 2;

  return {
    min: Math.max(0, rawMin),
    max: Math.max(0, rawMax),
    avg: Math.max(0, avg),
  };
}
