import type { ItemBase } from '../types';

export const itemBases: ItemBase[] = [
  // ============================================
  // WEAPONS
  // ============================================
  {
    id: 'rustySword',
    name: 'Rusty Sword',
    slot: 'weapon',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      physicalDamageMin: 2,
      physicalDamageMax: 5,
      attackSpeed: 1.2,
      criticalChance: 5,
    },
  },
  {
    id: 'ironSword',
    name: 'Iron Sword',
    slot: 'weapon',
    requiredLevel: 5,
    dropLevel: 5,
    baseStats: {
      physicalDamageMin: 5,
      physicalDamageMax: 12,
      attackSpeed: 1.2,
      criticalChance: 5,
    },
  },
  {
    id: 'steelBlade',
    name: 'Steel Blade',
    slot: 'weapon',
    requiredLevel: 12,
    dropLevel: 12,
    baseStats: {
      physicalDamageMin: 10,
      physicalDamageMax: 22,
      attackSpeed: 1.3,
      criticalChance: 5,
    },
  },
  {
    id: 'mithrilSword',
    name: 'Mithril Sword',
    slot: 'weapon',
    requiredLevel: 20,
    dropLevel: 20,
    baseStats: {
      physicalDamageMin: 18,
      physicalDamageMax: 35,
      attackSpeed: 1.4,
      criticalChance: 6,
    },
  },
  {
    id: 'demonBlade',
    name: 'Demon Blade',
    slot: 'weapon',
    requiredLevel: 30,
    dropLevel: 30,
    baseStats: {
      physicalDamageMin: 28,
      physicalDamageMax: 52,
      attackSpeed: 1.3,
      criticalChance: 7,
    },
  },
  
  // ============================================
  // HELMETS
  // ============================================
  {
    id: 'leatherCap',
    name: 'Leather Cap',
    slot: 'helmet',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      armor: 5,
      maxLife: 5,
    },
  },
  {
    id: 'ironHelm',
    name: 'Iron Helm',
    slot: 'helmet',
    requiredLevel: 8,
    dropLevel: 8,
    baseStats: {
      armor: 20,
      maxLife: 10,
    },
  },
  {
    id: 'steelHelmet',
    name: 'Steel Helmet',
    slot: 'helmet',
    requiredLevel: 18,
    dropLevel: 18,
    baseStats: {
      armor: 40,
      maxLife: 15,
    },
  },
  {
    id: 'plateHelm',
    name: 'Plate Helm',
    slot: 'helmet',
    requiredLevel: 28,
    dropLevel: 28,
    baseStats: {
      armor: 65,
      maxLife: 20,
    },
  },
  
  // ============================================
  // BODY ARMOR
  // ============================================
  {
    id: 'tatteredShirt',
    name: 'Tattered Shirt',
    slot: 'bodyArmor',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      armor: 8,
      maxLife: 10,
    },
  },
  {
    id: 'leatherVest',
    name: 'Leather Vest',
    slot: 'bodyArmor',
    requiredLevel: 6,
    dropLevel: 6,
    baseStats: {
      armor: 25,
      maxLife: 20,
    },
  },
  {
    id: 'chainmail',
    name: 'Chainmail',
    slot: 'bodyArmor',
    requiredLevel: 14,
    dropLevel: 14,
    baseStats: {
      armor: 55,
      maxLife: 30,
    },
  },
  {
    id: 'plateArmor',
    name: 'Plate Armor',
    slot: 'bodyArmor',
    requiredLevel: 24,
    dropLevel: 24,
    baseStats: {
      armor: 100,
      maxLife: 45,
    },
  },
  
  // ============================================
  // GLOVES
  // ============================================
  {
    id: 'raggedGloves',
    name: 'Ragged Gloves',
    slot: 'gloves',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      armor: 3,
    },
  },
  {
    id: 'leatherGloves',
    name: 'Leather Gloves',
    slot: 'gloves',
    requiredLevel: 7,
    dropLevel: 7,
    baseStats: {
      armor: 12,
    },
  },
  {
    id: 'chainGloves',
    name: 'Chain Gloves',
    slot: 'gloves',
    requiredLevel: 16,
    dropLevel: 16,
    baseStats: {
      armor: 28,
    },
  },
  {
    id: 'plateGauntlets',
    name: 'Plate Gauntlets',
    slot: 'gloves',
    requiredLevel: 26,
    dropLevel: 26,
    baseStats: {
      armor: 48,
    },
  },
  
  // ============================================
  // BOOTS
  // ============================================
  {
    id: 'wornSandals',
    name: 'Worn Sandals',
    slot: 'boots',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      armor: 3,
    },
  },
  {
    id: 'leatherBoots',
    name: 'Leather Boots',
    slot: 'boots',
    requiredLevel: 7,
    dropLevel: 7,
    baseStats: {
      armor: 12,
    },
  },
  {
    id: 'chainBoots',
    name: 'Chain Boots',
    slot: 'boots',
    requiredLevel: 16,
    dropLevel: 16,
    baseStats: {
      armor: 28,
    },
  },
  {
    id: 'plateBoots',
    name: 'Plate Boots',
    slot: 'boots',
    requiredLevel: 26,
    dropLevel: 26,
    baseStats: {
      armor: 48,
    },
  },
  
  // ============================================
  // BELTS
  // ============================================
  {
    id: 'ropeBelt',
    name: 'Rope Belt',
    slot: 'belt',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      maxLife: 5,
    },
  },
  {
    id: 'leatherBelt',
    name: 'Leather Belt',
    slot: 'belt',
    requiredLevel: 8,
    dropLevel: 8,
    baseStats: {
      maxLife: 15,
      armor: 5,
    },
  },
  {
    id: 'studdedBelt',
    name: 'Studded Belt',
    slot: 'belt',
    requiredLevel: 18,
    dropLevel: 18,
    baseStats: {
      maxLife: 30,
      armor: 12,
    },
  },
  {
    id: 'heavyBelt',
    name: 'Heavy Belt',
    slot: 'belt',
    requiredLevel: 28,
    dropLevel: 28,
    baseStats: {
      maxLife: 50,
      armor: 20,
    },
  },
  
  // ============================================
  // RINGS
  // ============================================
  {
    id: 'copperRing',
    name: 'Copper Ring',
    slot: 'ring1', // Can be either ring slot
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {},
  },
  {
    id: 'ironRing',
    name: 'Iron Ring',
    slot: 'ring1',
    requiredLevel: 8,
    dropLevel: 8,
    baseStats: {
      physicalDamageMin: 1,
      physicalDamageMax: 3,
    },
  },
  {
    id: 'goldRing',
    name: 'Gold Ring',
    slot: 'ring1',
    requiredLevel: 16,
    dropLevel: 16,
    baseStats: {},
  },
  {
    id: 'rubyRing',
    name: 'Ruby Ring',
    slot: 'ring1',
    requiredLevel: 24,
    dropLevel: 24,
    baseStats: {
      fireResistance: 10,
    },
  },
  {
    id: 'sapphireRing',
    name: 'Sapphire Ring',
    slot: 'ring1',
    requiredLevel: 24,
    dropLevel: 24,
    baseStats: {
      coldResistance: 10,
    },
  },
  {
    id: 'topazRing',
    name: 'Topaz Ring',
    slot: 'ring1',
    requiredLevel: 24,
    dropLevel: 24,
    baseStats: {
      lightningResistance: 10,
    },
  },
  
  // ============================================
  // AMULETS (NEW!)
  // ============================================
  
  {
    id: 'pauaAmulet',
    name: 'Paua Amulet',
    slot: 'amulet',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      maxMana: 10,
    },
  },
  {
    id: 'coralAmulet',
    name: 'Coral Amulet',
    slot: 'amulet',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      lifeRegeneration: 1,
    },
  },
  {
    id: 'jadeAmulet',
    name: 'Jade Amulet',
    slot: 'amulet',
    requiredLevel: 8,
    dropLevel: 8,
    baseStats: {
      dexterity: 10,
    },
  },
  {
    id: 'amberAmulet',
    name: 'Amber Amulet',
    slot: 'amulet',
    requiredLevel: 8,
    dropLevel: 8,
    baseStats: {
      strength: 10,
    },
  },
  {
    id: 'lapisAmulet',
    name: 'Lapis Amulet',
    slot: 'amulet',
    requiredLevel: 8,
    dropLevel: 8,
    baseStats: {
      intelligence: 10,
    },
  },
  {
    id: 'goldAmulet',
    name: 'Gold Amulet',
    slot: 'amulet',
    requiredLevel: 16,
    dropLevel: 16,
    baseStats: {},
  },
  {
    id: 'onyxAmulet',
    name: 'Onyx Amulet',
    slot: 'amulet',
    requiredLevel: 24,
    dropLevel: 24,
    baseStats: {
      strength: 5,
      dexterity: 5,
      intelligence: 5,
    },
  },
  
  // ============================================
  // SHIELDS (OFF-HAND) (NEW!)
  // ============================================
  
  {
    id: 'splinteredTowerShield',
    name: 'Splintered Tower Shield',
    slot: 'offhand',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      armor: 15,
      blockChance: 10,
    },
  },
  {
    id: 'rottenRoundShield',
    name: 'Rotten Round Shield',
    slot: 'offhand',
    requiredLevel: 1,
    dropLevel: 1,
    baseStats: {
      evasion: 20,
      blockChance: 12,
    },
  },
  {
    id: 'plankKiteShield',
    name: 'Plank Kite Shield',
    slot: 'offhand',
    requiredLevel: 5,
    dropLevel: 5,
    baseStats: {
      armor: 30,
      blockChance: 14,
    },
  },
  {
    id: 'spikedBundle',
    name: 'Spiked Bundle',
    slot: 'offhand',
    requiredLevel: 8,
    dropLevel: 8,
    baseStats: {
      evasion: 40,
      blockChance: 16,
    },
  },
  {
    id: 'ironBuckler',
    name: 'Iron Buckler',
    slot: 'offhand',
    requiredLevel: 12,
    dropLevel: 12,
    baseStats: {
      armor: 50,
      evasion: 25,
      blockChance: 18,
    },
  },
  {
    id: 'steelKiteShield',
    name: 'Steel Kite Shield',
    slot: 'offhand',
    requiredLevel: 18,
    dropLevel: 18,
    baseStats: {
      armor: 80,
      blockChance: 20,
    },
  },
  {
    id: 'lacqueredBuckler',
    name: 'Lacquered Buckler',
    slot: 'offhand',
    requiredLevel: 18,
    dropLevel: 18,
    baseStats: {
      evasion: 100,
      blockChance: 22,
    },
  },
  {
    id: 'reinforcedTowerShield',
    name: 'Reinforced Tower Shield',
    slot: 'offhand',
    requiredLevel: 25,
    dropLevel: 25,
    baseStats: {
      armor: 120,
      blockChance: 24,
    },
  },
];

export const itemBaseById = new Map(itemBases.map(b => [b.id, b]));

export const getItemBasesForSlot = (slot: string, maxDropLevel: number): ItemBase[] => {
  return itemBases.filter(b => {
    const slotMatches = b.slot === slot || 
      (slot === 'ring2' && b.slot === 'ring1') ||
      (slot === 'ring1' && b.slot === 'ring1') ||
      (slot === 'amulet' && b.slot === 'amulet') ||
      (slot === 'offhand' && b.slot === 'offhand');
    return slotMatches && b.dropLevel <= maxDropLevel;
  });
};
