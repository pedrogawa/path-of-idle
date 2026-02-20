import type { AffixDefinition } from '../types';

// ============================================
// PREFIX DEFINITIONS
// ============================================

export const prefixes: AffixDefinition[] = [
  {
    id: 'flatPhys',
    name: 'Physical Damage',
    type: 'prefix',
    statKey: 'physicalDamageMin',
    isPercentage: false,
    applicableSlots: ['weapon'],
    tiers: [
      { tier: 1, minValue: 1, maxValue: 3, requiredItemLevel: 1 },
      { tier: 2, minValue: 4, maxValue: 7, requiredItemLevel: 5 },
      { tier: 3, minValue: 8, maxValue: 12, requiredItemLevel: 10 },
      { tier: 4, minValue: 13, maxValue: 18, requiredItemLevel: 15 },
      { tier: 5, minValue: 19, maxValue: 25, requiredItemLevel: 20 },
      { tier: 6, minValue: 26, maxValue: 35, requiredItemLevel: 25 },
      { tier: 7, minValue: 36, maxValue: 45, requiredItemLevel: 30 },
    ],
  },
  
  {
    id: 'flatLife',
    name: 'Maximum Life',
    type: 'prefix',
    statKey: 'maxLife',
    isPercentage: false,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 10, requiredItemLevel: 1 },
      { tier: 2, minValue: 11, maxValue: 20, requiredItemLevel: 5 },
      { tier: 3, minValue: 21, maxValue: 30, requiredItemLevel: 10 },
      { tier: 4, minValue: 31, maxValue: 45, requiredItemLevel: 15 },
      { tier: 5, minValue: 46, maxValue: 60, requiredItemLevel: 20 },
      { tier: 6, minValue: 61, maxValue: 80, requiredItemLevel: 25 },
      { tier: 7, minValue: 81, maxValue: 100, requiredItemLevel: 30 },
    ],
  },
  
  {
    id: 'flatArmor',
    name: 'Armor',
    type: 'prefix',
    statKey: 'armor',
    isPercentage: false,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt'],
    tiers: [
      { tier: 1, minValue: 10, maxValue: 20, requiredItemLevel: 1 },
      { tier: 2, minValue: 21, maxValue: 40, requiredItemLevel: 5 },
      { tier: 3, minValue: 41, maxValue: 70, requiredItemLevel: 10 },
      { tier: 4, minValue: 71, maxValue: 100, requiredItemLevel: 15 },
      { tier: 5, minValue: 101, maxValue: 140, requiredItemLevel: 20 },
      { tier: 6, minValue: 141, maxValue: 180, requiredItemLevel: 25 },
      { tier: 7, minValue: 181, maxValue: 220, requiredItemLevel: 30 },
    ],
  },
  
  {
    id: 'incFireDmg',
    name: 'Increased Fire Damage',
    type: 'prefix',
    statKey: 'increasedFireDamage',
    isPercentage: true,
    applicableSlots: ['weapon', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 10, requiredItemLevel: 1 },
      { tier: 2, minValue: 11, maxValue: 18, requiredItemLevel: 8 },
      { tier: 3, minValue: 19, maxValue: 28, requiredItemLevel: 16 },
      { tier: 4, minValue: 29, maxValue: 40, requiredItemLevel: 24 },
      { tier: 5, minValue: 41, maxValue: 55, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'incColdDmg',
    name: 'Increased Cold Damage',
    type: 'prefix',
    statKey: 'increasedColdDamage',
    isPercentage: true,
    applicableSlots: ['weapon', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 10, requiredItemLevel: 1 },
      { tier: 2, minValue: 11, maxValue: 18, requiredItemLevel: 8 },
      { tier: 3, minValue: 19, maxValue: 28, requiredItemLevel: 16 },
      { tier: 4, minValue: 29, maxValue: 40, requiredItemLevel: 24 },
      { tier: 5, minValue: 41, maxValue: 55, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'incLightDmg',
    name: 'Increased Lightning Damage',
    type: 'prefix',
    statKey: 'increasedLightningDamage',
    isPercentage: true,
    applicableSlots: ['weapon', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 10, requiredItemLevel: 1 },
      { tier: 2, minValue: 11, maxValue: 18, requiredItemLevel: 8 },
      { tier: 3, minValue: 19, maxValue: 28, requiredItemLevel: 16 },
      { tier: 4, minValue: 29, maxValue: 40, requiredItemLevel: 24 },
      { tier: 5, minValue: 41, maxValue: 55, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'incPhysDmg',
    name: 'Increased Physical Damage',
    type: 'prefix',
    statKey: 'increasedPhysicalDamage',
    isPercentage: true,
    applicableSlots: ['weapon'],
    tiers: [
      { tier: 1, minValue: 10, maxValue: 20, requiredItemLevel: 1 },
      { tier: 2, minValue: 21, maxValue: 35, requiredItemLevel: 8 },
      { tier: 3, minValue: 36, maxValue: 55, requiredItemLevel: 16 },
      { tier: 4, minValue: 56, maxValue: 75, requiredItemLevel: 24 },
      { tier: 5, minValue: 76, maxValue: 100, requiredItemLevel: 32 },
    ],
  },
  
  // ============================================
  // FLAT ELEMENTAL DAMAGE
  // ============================================
  
  {
    id: 'flatFire',
    name: 'Fire Damage',
    type: 'prefix',
    statKey: 'fireDamageMin',
    isPercentage: false,
    applicableSlots: ['weapon', 'ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 1, maxValue: 3, requiredItemLevel: 1 },
      { tier: 2, minValue: 4, maxValue: 8, requiredItemLevel: 8 },
      { tier: 3, minValue: 9, maxValue: 14, requiredItemLevel: 16 },
      { tier: 4, minValue: 15, maxValue: 22, requiredItemLevel: 24 },
      { tier: 5, minValue: 23, maxValue: 32, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'flatCold',
    name: 'Cold Damage',
    type: 'prefix',
    statKey: 'coldDamageMin',
    isPercentage: false,
    applicableSlots: ['weapon', 'ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 1, maxValue: 3, requiredItemLevel: 1 },
      { tier: 2, minValue: 4, maxValue: 8, requiredItemLevel: 8 },
      { tier: 3, minValue: 9, maxValue: 14, requiredItemLevel: 16 },
      { tier: 4, minValue: 15, maxValue: 22, requiredItemLevel: 24 },
      { tier: 5, minValue: 23, maxValue: 32, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'flatLightning',
    name: 'Lightning Damage',
    type: 'prefix',
    statKey: 'lightningDamageMin',
    isPercentage: false,
    applicableSlots: ['weapon', 'ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 1, maxValue: 5, requiredItemLevel: 1 },
      { tier: 2, minValue: 2, maxValue: 12, requiredItemLevel: 8 },
      { tier: 3, minValue: 3, maxValue: 20, requiredItemLevel: 16 },
      { tier: 4, minValue: 5, maxValue: 30, requiredItemLevel: 24 },
      { tier: 5, minValue: 8, maxValue: 45, requiredItemLevel: 32 },
    ],
  },
  
  // ============================================
  // ATTRIBUTES
  // ============================================
  
  {
    id: 'flatStr',
    name: 'Strength',
    type: 'prefix',
    statKey: 'strength',
    isPercentage: false,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt', 'ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 10, requiredItemLevel: 1 },
      { tier: 2, minValue: 11, maxValue: 18, requiredItemLevel: 8 },
      { tier: 3, minValue: 19, maxValue: 28, requiredItemLevel: 16 },
      { tier: 4, minValue: 29, maxValue: 40, requiredItemLevel: 24 },
      { tier: 5, minValue: 41, maxValue: 55, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'flatDex',
    name: 'Dexterity',
    type: 'prefix',
    statKey: 'dexterity',
    isPercentage: false,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt', 'ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 10, requiredItemLevel: 1 },
      { tier: 2, minValue: 11, maxValue: 18, requiredItemLevel: 8 },
      { tier: 3, minValue: 19, maxValue: 28, requiredItemLevel: 16 },
      { tier: 4, minValue: 29, maxValue: 40, requiredItemLevel: 24 },
      { tier: 5, minValue: 41, maxValue: 55, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'flatInt',
    name: 'Intelligence',
    type: 'prefix',
    statKey: 'intelligence',
    isPercentage: false,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt', 'ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 10, requiredItemLevel: 1 },
      { tier: 2, minValue: 11, maxValue: 18, requiredItemLevel: 8 },
      { tier: 3, minValue: 19, maxValue: 28, requiredItemLevel: 16 },
      { tier: 4, minValue: 29, maxValue: 40, requiredItemLevel: 24 },
      { tier: 5, minValue: 41, maxValue: 55, requiredItemLevel: 32 },
    ],
  },
  
  // ============================================
  // EVASION
  // ============================================
  
  {
    id: 'flatEvasion',
    name: 'Evasion Rating',
    type: 'prefix',
    statKey: 'evasion',
    isPercentage: false,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt'],
    tiers: [
      { tier: 1, minValue: 15, maxValue: 30, requiredItemLevel: 1 },
      { tier: 2, minValue: 31, maxValue: 60, requiredItemLevel: 8 },
      { tier: 3, minValue: 61, maxValue: 100, requiredItemLevel: 16 },
      { tier: 4, minValue: 101, maxValue: 150, requiredItemLevel: 24 },
      { tier: 5, minValue: 151, maxValue: 220, requiredItemLevel: 32 },
    ],
  },
];

// ============================================
// SUFFIX DEFINITIONS
// ============================================

export const suffixes: AffixDefinition[] = [
  {
    id: 'attackSpeed',
    name: 'Attack Speed',
    type: 'suffix',
    statKey: 'increasedAttackSpeed',
    isPercentage: true,
    applicableSlots: ['weapon', 'gloves', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 3, maxValue: 5, requiredItemLevel: 1 },
      { tier: 2, minValue: 6, maxValue: 9, requiredItemLevel: 8 },
      { tier: 3, minValue: 10, maxValue: 13, requiredItemLevel: 16 },
      { tier: 4, minValue: 14, maxValue: 18, requiredItemLevel: 24 },
      { tier: 5, minValue: 19, maxValue: 25, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'critChance',
    name: 'Critical Strike Chance',
    type: 'suffix',
    statKey: 'criticalChance',
    isPercentage: true,
    applicableSlots: ['weapon', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 10, requiredItemLevel: 1 },
      { tier: 2, minValue: 11, maxValue: 18, requiredItemLevel: 8 },
      { tier: 3, minValue: 19, maxValue: 28, requiredItemLevel: 16 },
      { tier: 4, minValue: 29, maxValue: 38, requiredItemLevel: 24 },
      { tier: 5, minValue: 39, maxValue: 50, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'critMulti',
    name: 'Critical Strike Multiplier',
    type: 'suffix',
    statKey: 'criticalMultiplier',
    isPercentage: true,
    applicableSlots: ['weapon', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 10, maxValue: 20, requiredItemLevel: 1 },
      { tier: 2, minValue: 21, maxValue: 35, requiredItemLevel: 8 },
      { tier: 3, minValue: 36, maxValue: 55, requiredItemLevel: 16 },
      { tier: 4, minValue: 56, maxValue: 80, requiredItemLevel: 24 },
      { tier: 5, minValue: 81, maxValue: 110, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'lifeRegen',
    name: 'Life Regeneration',
    type: 'suffix',
    statKey: 'lifeRegeneration',
    isPercentage: false,
    applicableSlots: ['helmet', 'bodyArmor', 'belt', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 1, maxValue: 2, requiredItemLevel: 1 },
      { tier: 2, minValue: 3, maxValue: 5, requiredItemLevel: 8 },
      { tier: 3, minValue: 6, maxValue: 9, requiredItemLevel: 16 },
      { tier: 4, minValue: 10, maxValue: 14, requiredItemLevel: 24 },
      { tier: 5, minValue: 15, maxValue: 20, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'fireRes',
    name: 'Fire Resistance',
    type: 'suffix',
    statKey: 'fireResistance',
    isPercentage: true,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 6, maxValue: 11, requiredItemLevel: 1 },
      { tier: 2, minValue: 12, maxValue: 17, requiredItemLevel: 8 },
      { tier: 3, minValue: 18, maxValue: 24, requiredItemLevel: 16 },
      { tier: 4, minValue: 25, maxValue: 32, requiredItemLevel: 24 },
      { tier: 5, minValue: 33, maxValue: 42, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'coldRes',
    name: 'Cold Resistance',
    type: 'suffix',
    statKey: 'coldResistance',
    isPercentage: true,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 6, maxValue: 11, requiredItemLevel: 1 },
      { tier: 2, minValue: 12, maxValue: 17, requiredItemLevel: 8 },
      { tier: 3, minValue: 18, maxValue: 24, requiredItemLevel: 16 },
      { tier: 4, minValue: 25, maxValue: 32, requiredItemLevel: 24 },
      { tier: 5, minValue: 33, maxValue: 42, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'lightRes',
    name: 'Lightning Resistance',
    type: 'suffix',
    statKey: 'lightningResistance',
    isPercentage: true,
    applicableSlots: ['helmet', 'bodyArmor', 'gloves', 'boots', 'belt', 'ring1', 'ring2'],
    tiers: [
      { tier: 1, minValue: 6, maxValue: 11, requiredItemLevel: 1 },
      { tier: 2, minValue: 12, maxValue: 17, requiredItemLevel: 8 },
      { tier: 3, minValue: 18, maxValue: 24, requiredItemLevel: 16 },
      { tier: 4, minValue: 25, maxValue: 32, requiredItemLevel: 24 },
      { tier: 5, minValue: 33, maxValue: 42, requiredItemLevel: 32 },
    ],
  },
  
  // ============================================
  // ACCURACY
  // ============================================
  
  {
    id: 'accuracy',
    name: 'Accuracy Rating',
    type: 'suffix',
    statKey: 'accuracy',
    isPercentage: false,
    applicableSlots: ['weapon', 'helmet', 'gloves', 'ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 20, maxValue: 40, requiredItemLevel: 1 },
      { tier: 2, minValue: 41, maxValue: 80, requiredItemLevel: 8 },
      { tier: 3, minValue: 81, maxValue: 130, requiredItemLevel: 16 },
      { tier: 4, minValue: 131, maxValue: 200, requiredItemLevel: 24 },
      { tier: 5, minValue: 201, maxValue: 300, requiredItemLevel: 32 },
    ],
  },
  
  // ============================================
  // BLOCK CHANCE
  // ============================================
  
  {
    id: 'blockChance',
    name: 'Block Chance',
    type: 'suffix',
    statKey: 'blockChance',
    isPercentage: true,
    applicableSlots: ['offhand'],
    tiers: [
      { tier: 1, minValue: 2, maxValue: 4, requiredItemLevel: 1 },
      { tier: 2, minValue: 5, maxValue: 8, requiredItemLevel: 8 },
      { tier: 3, minValue: 9, maxValue: 12, requiredItemLevel: 16 },
      { tier: 4, minValue: 13, maxValue: 16, requiredItemLevel: 24 },
      { tier: 5, minValue: 17, maxValue: 22, requiredItemLevel: 32 },
    ],
  },
  
  // ============================================
  // MANA
  // ============================================
  
  {
    id: 'flatMana',
    name: 'Maximum Mana',
    type: 'suffix',
    statKey: 'maxMana',
    isPercentage: false,
    applicableSlots: ['helmet', 'bodyArmor', 'ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 5, maxValue: 12, requiredItemLevel: 1 },
      { tier: 2, minValue: 13, maxValue: 25, requiredItemLevel: 8 },
      { tier: 3, minValue: 26, maxValue: 40, requiredItemLevel: 16 },
      { tier: 4, minValue: 41, maxValue: 60, requiredItemLevel: 24 },
      { tier: 5, minValue: 61, maxValue: 85, requiredItemLevel: 32 },
    ],
  },
  
  {
    id: 'manaRegen',
    name: 'Mana Regeneration',
    type: 'suffix',
    statKey: 'manaRegeneration',
    isPercentage: false,
    applicableSlots: ['ring1', 'ring2', 'amulet'],
    tiers: [
      { tier: 1, minValue: 1, maxValue: 2, requiredItemLevel: 1 },
      { tier: 2, minValue: 2, maxValue: 4, requiredItemLevel: 8 },
      { tier: 3, minValue: 4, maxValue: 6, requiredItemLevel: 16 },
      { tier: 4, minValue: 6, maxValue: 9, requiredItemLevel: 24 },
      { tier: 5, minValue: 9, maxValue: 13, requiredItemLevel: 32 },
    ],
  },
];

export const allAffixes: AffixDefinition[] = [...prefixes, ...suffixes];

export const affixById = new Map(allAffixes.map(a => [a.id, a]));
