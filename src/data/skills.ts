import type { SkillDefinition, SupportGemDefinition } from '../types';

const HEAVY_STRIKE_MANA_COST_BY_LEVEL = [
  7, 7, 7, 7, 7, 8, 8, 8, 9, 9,
  9, 10, 10, 10, 10, 11, 11, 11, 12, 12,
];

const HEAVY_STRIKE_DAMAGE_MULTIPLIER_BY_LEVEL = [
  2.243, 2.341, 2.449, 2.565, 2.693, 2.831, 2.971, 3.118, 3.273, 3.433,
  3.603, 3.78, 3.966, 4.161, 4.365, 4.58, 4.804, 5.039, 5.277, 5.525,
];

const HEAVY_STRIKE_DOUBLE_DAMAGE_CHANCE_BY_LEVEL = [
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
];

const HEAVY_STRIKE_TOTAL_EXPERIENCE_BY_LEVEL = [
  0,
  70,
  378,
  1932,
  8599,
  34646,
  84371,
  180085,
  349680,
  633439,
  1087435,
  1790563,
  2851786,
  4917656,
  7424766,
  13223702,
  28307621,
  56100356,
  99970095,
  342051651,
];

// ============================================
// SKILL DEFINITIONS
// ============================================

export const skills: SkillDefinition[] = [
  // ============================================
  // BASIC ATTACKS (starter skills)
  // ============================================
  
  {
    id: 'defaultAttack',
    name: 'Strike',
    description: 'A basic attack with your weapon.',
    icon: '⚔️',
    type: 'attack',
    targeting: 'single',
    damageMultiplier: 1.0,
    damageType: 'physical',
    manaCost: 0,
    cooldown: 0, // No cooldown, can always use
    requiredLevel: 1,
    color: '#ffffff',
  },
  
  {
    id: 'heavyStrike',
    name: 'Heavy Strike',
    description: 'A powerful overhead strike that deals massive physical damage.',
    icon: '🔨',
    type: 'attack',
    targeting: 'single',
    damageMultiplier: HEAVY_STRIKE_DAMAGE_MULTIPLIER_BY_LEVEL[0],
    damageType: 'physical',
    manaCost: HEAVY_STRIKE_MANA_COST_BY_LEVEL[0],
    cooldown: 2,
    doubleDamageChance: HEAVY_STRIKE_DOUBLE_DAMAGE_CHANCE_BY_LEVEL[0],
    gemTotalExperienceByLevel: HEAVY_STRIKE_TOTAL_EXPERIENCE_BY_LEVEL,
    manaCostByLevel: HEAVY_STRIKE_MANA_COST_BY_LEVEL,
    damageMultiplierByLevel: HEAVY_STRIKE_DAMAGE_MULTIPLIER_BY_LEVEL,
    doubleDamageChanceByLevel: HEAVY_STRIKE_DOUBLE_DAMAGE_CHANCE_BY_LEVEL,
    requiredLevel: 1,
    color: '#b45309',
  },
  
  {
    id: 'doubleStrike',
    name: 'Double Strike',
    description: 'Attack twice in rapid succession.',
    icon: '⚡',
    type: 'attack',
    targeting: 'single',
    damageMultiplier: 0.8,
    damageType: 'physical',
    manaCost: 6,
    cooldown: 1.5,
    numberOfHits: 2,
    requiredLevel: 2,
    color: '#fbbf24',
  },
  
  // ============================================
  // AOE ATTACKS
  // ============================================
  
  {
    id: 'cleave',
    name: 'Cleave',
    description: 'Swing your weapon in a wide arc, hitting all nearby enemies.',
    icon: '🌀',
    type: 'attack',
    targeting: 'cone',
    damageMultiplier: 0.9,
    damageType: 'physical',
    manaCost: 10,
    cooldown: 2.5,
    aoeRadius: 3, // Hits up to 3 monsters
    requiredLevel: 3,
    color: '#dc2626',
  },
  
  {
    id: 'groundSlam',
    name: 'Ground Slam',
    description: 'Slam the ground, creating a shockwave that damages all enemies.',
    icon: '💥',
    type: 'attack',
    targeting: 'aoe',
    damageMultiplier: 1.2,
    damageType: 'physical',
    addedDamageMin: 3,
    addedDamageMax: 8,
    manaCost: 15,
    cooldown: 4,
    aoeRadius: 5, // Hits up to 5 monsters
    requiredLevel: 5,
    color: '#78350f',
  },
  
  // ============================================
  // ELEMENTAL ATTACKS
  // ============================================
  
  {
    id: 'moltenStrike',
    name: 'Molten Strike',
    description: 'Imbue your weapon with fire, dealing additional fire damage.',
    icon: '🔥',
    type: 'attack',
    targeting: 'single',
    damageMultiplier: 1.0,
    damageType: 'physical',
    addedDamageMin: 8,
    addedDamageMax: 15,
    manaCost: 12,
    cooldown: 2,
    requiredLevel: 4,
    color: '#f97316',
  },
  
  {
    id: 'glacialHammer',
    name: 'Glacial Hammer',
    description: 'A freezing strike that deals cold damage.',
    icon: '❄️',
    type: 'attack',
    targeting: 'single',
    damageMultiplier: 1.3,
    damageType: 'cold',
    addedDamageMin: 5,
    addedDamageMax: 12,
    manaCost: 10,
    cooldown: 2.5,
    requiredLevel: 4,
    color: '#06b6d4',
  },
  
  {
    id: 'lightningStrike',
    name: 'Lightning Strike',
    description: 'Channel lightning through your weapon for massive damage.',
    icon: '⚡',
    type: 'attack',
    targeting: 'single',
    damageMultiplier: 1.1,
    damageType: 'lightning',
    addedDamageMin: 2,
    addedDamageMax: 20, // High variance like lightning
    manaCost: 14,
    cooldown: 2,
    requiredLevel: 5,
    color: '#eab308',
  },
  
  // ============================================
  // SPELLS
  // ============================================
  
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launch a ball of fire at your target.',
    icon: '🔴',
    type: 'spell',
    targeting: 'single',
    damageMultiplier: 0, // Spells don't use weapon damage
    damageType: 'fire',
    addedDamageMin: 15,
    addedDamageMax: 25,
    manaCost: 18,
    cooldown: 3,
    requiredLevel: 6,
    color: '#dc2626',
  },
  
  {
    id: 'iceShard',
    name: 'Ice Shard',
    description: 'Fire a shard of ice at your enemy.',
    icon: '💎',
    type: 'spell',
    targeting: 'single',
    damageMultiplier: 0,
    damageType: 'cold',
    addedDamageMin: 12,
    addedDamageMax: 20,
    manaCost: 15,
    cooldown: 2.5,
    requiredLevel: 6,
    color: '#67e8f9',
  },
  
  // ============================================
  // UTILITY / BUFF SKILLS
  // ============================================
  
  {
    id: 'viciousStrike',
    name: 'Vicious Strike',
    description: 'A savage attack with increased critical chance.',
    icon: '🎯',
    type: 'attack',
    targeting: 'single',
    damageMultiplier: 1.2,
    damageType: 'physical',
    manaCost: 8,
    cooldown: 3,
    critBonusChance: 25, // +25% crit chance for this attack
    requiredLevel: 3,
    color: '#a855f7',
  },
  
  {
    id: 'lifetap',
    name: 'Lifetap',
    description: 'Drain life from your enemy with each strike.',
    icon: '💉',
    type: 'attack',
    targeting: 'single',
    damageMultiplier: 0.9,
    damageType: 'physical',
    manaCost: 12,
    cooldown: 4,
    lifestealPercent: 30, // 30% of damage returned as life
    requiredLevel: 5,
    color: '#be123c',
  },
];

export const skillById = new Map(skills.map(s => [s.id, s]));

export const getAvailableSkills = (playerLevel: number): SkillDefinition[] => {
  return skills.filter(s => s.requiredLevel <= playerLevel);
};

export const starterSkillIds = ['defaultAttack', 'heavyStrike', 'doubleStrike'];

// ============================================
// SUPPORT GEMS
// ============================================

export const supportGems: SupportGemDefinition[] = [
  {
    id: 'addedFireSupport',
    name: 'Added Fire Support',
    description: 'Adds flat fire damage to linked skill.',
    icon: '🔥',
    color: '#f97316',
    requiredLevel: 2,
    costCurrency: 'alteration',
    costAmount: 3,
    compatibleSkillTypes: ['attack', 'spell'],
    addedDamageMin: 3,
    addedDamageMax: 6,
    manaMultiplier: 1.1,
  },
  {
    id: 'brutalitySupport',
    name: 'Brutality Support',
    description: 'Linked skill deals more damage.',
    icon: '💪',
    color: '#d946ef',
    requiredLevel: 3,
    costCurrency: 'alteration',
    costAmount: 5,
    compatibleSkillTypes: ['attack', 'spell'],
    moreDamageMultiplier: 0.25,
    manaMultiplier: 1.2,
  },
  {
    id: 'fasterAttacksSupport',
    name: 'Faster Attacks Support',
    description: 'Linked skill recovers faster between casts.',
    icon: '⏩',
    color: '#22d3ee',
    requiredLevel: 4,
    costCurrency: 'alteration',
    costAmount: 6,
    compatibleSkillTypes: ['attack'],
    cooldownMultiplier: 0.8,
    manaMultiplier: 1.15,
  },
  {
    id: 'multistrikeSupport',
    name: 'Multistrike Support',
    description: 'Linked skill repeats one extra hit.',
    icon: '⚔️',
    color: '#facc15',
    requiredLevel: 6,
    costCurrency: 'alchemy',
    costAmount: 2,
    compatibleSkillTypes: ['attack'],
    addedHits: 1,
    cooldownMultiplier: 1.25,
    manaMultiplier: 1.25,
  },
];

export const supportGemById = new Map(supportGems.map(gem => [gem.id, gem]));

export const getBuyableSkills = (playerLevel: number): SkillDefinition[] => {
  return skills.filter(skill => skill.id !== 'defaultAttack' && skill.requiredLevel <= playerLevel);
};

export function getSkillPurchaseCost(skill: SkillDefinition): number {
  return Math.max(2, skill.requiredLevel * 2);
}
