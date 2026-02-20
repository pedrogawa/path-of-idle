import type { 
  Item, 
  ItemRarity, 
  Monster, 
  CurrencyType,
  Affix,
  EquipmentSlot,
  PlayerStats,
  LootResult,
} from '../types';
import { 
  itemBases, 
  allAffixes, 
  currencies, 
  totalCurrencyWeight,
  bossById,
} from '../data';

let itemIdCounter = 0;
export function generateItemId(): string {
  return `item_${Date.now()}_${itemIdCounter++}`;
}

/**
 * Roll a random affix for an item
 */
function rollAffix(
  type: 'prefix' | 'suffix',
  slot: EquipmentSlot,
  itemLevel: number,
  existingAffixIds: string[]
): Affix | null {
  const applicable = allAffixes.filter(a => 
    a.type === type && 
    a.applicableSlots.includes(slot) &&
    !existingAffixIds.includes(a.id)
  );
  
  if (applicable.length === 0) return null;
  
  const affixDef = applicable[Math.floor(Math.random() * applicable.length)];
  
  const availableTiers = affixDef.tiers.filter(t => t.requiredItemLevel <= itemLevel);
  if (availableTiers.length === 0) return null;
  
  const tier = availableTiers[availableTiers.length - 1];
  
  const value = Math.floor(tier.minValue + Math.random() * (tier.maxValue - tier.minValue + 1));
  
  return {
    definitionId: affixDef.id,
    tier: tier.tier,
    value,
  };
}

/**
 * Compute item stats from base + affixes
 */
export function computeItemStats(
  baseStats: Partial<PlayerStats>,
  prefixes: Affix[],
  suffixes: Affix[]
): Partial<PlayerStats> {
  const stats = { ...baseStats };
  
  [...prefixes, ...suffixes].forEach(affix => {
    const def = allAffixes.find(a => a.id === affix.definitionId);
    if (!def) return;
    
    const currentValue = (stats[def.statKey] as number) || 0;
    
    if (def.isPercentage) {
      (stats as Record<string, number>)[def.statKey] = currentValue + affix.value;
    } else {
      (stats as Record<string, number>)[def.statKey] = currentValue + affix.value;
    }
  });
  
  return stats;
}

/**
 * Generate a random item
 */
export function generateItem(
  monsterLevel: number,
  lootBonus: number,
  forceRarity?: ItemRarity
): Item | null {
  const availableBases = itemBases.filter(b => b.dropLevel <= monsterLevel);
  if (availableBases.length === 0) return null;
  
  const weights = availableBases.map(b => 1 + (monsterLevel - b.dropLevel) * 0.1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  let roll = Math.random() * totalWeight;
  let selectedBase = availableBases[0];
  for (let i = 0; i < availableBases.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      selectedBase = availableBases[i];
      break;
    }
  }
  
  let rarity: ItemRarity = forceRarity || 'normal';
  if (!forceRarity) {
    const rarityRoll = Math.random() * 100;
    const rareBonusChance = 5 * lootBonus;
    const magicBonusChance = 25 * lootBonus;
    
    if (rarityRoll < rareBonusChance) {
      rarity = 'rare';
    } else if (rarityRoll < magicBonusChance) {
      rarity = 'magic';
    }
  }
  
  const prefixes: Affix[] = [];
  const suffixes: Affix[] = [];
  const existingIds: string[] = [];
  
  let slot = selectedBase.slot;
  if (slot === 'ring1' && Math.random() < 0.5) {
    slot = 'ring2';
  }
  
  if (rarity === 'magic') {
    const numAffixes = 1 + (Math.random() < 0.5 ? 1 : 0);
    
    for (let i = 0; i < numAffixes; i++) {
      const type = Math.random() < 0.5 ? 'prefix' : 'suffix';
      const affix = rollAffix(type, slot, monsterLevel, existingIds);
      if (affix) {
        existingIds.push(affix.definitionId);
        if (type === 'prefix') prefixes.push(affix);
        else suffixes.push(affix);
      }
    }
  } else if (rarity === 'rare') {
    // 3-6 affixes
    const numAffixes = 3 + Math.floor(Math.random() * 4);
    const numPrefixes = Math.min(3, Math.floor(numAffixes / 2) + (Math.random() < 0.5 ? 1 : 0));
    const numSuffixes = Math.min(3, numAffixes - numPrefixes);
    
    for (let i = 0; i < numPrefixes; i++) {
      const affix = rollAffix('prefix', slot, monsterLevel, existingIds);
      if (affix) {
        existingIds.push(affix.definitionId);
        prefixes.push(affix);
      }
    }
    
    for (let i = 0; i < numSuffixes; i++) {
      const affix = rollAffix('suffix', slot, monsterLevel, existingIds);
      if (affix) {
        existingIds.push(affix.definitionId);
        suffixes.push(affix);
      }
    }
  }
  
  let name = selectedBase.name;
  if (rarity === 'magic' && prefixes.length > 0) {
    const prefixDef = allAffixes.find(a => a.id === prefixes[0].definitionId);
    if (prefixDef) {
      name = `${prefixDef.name} ${selectedBase.name}`;
    }
  } else if (rarity === 'rare') {
    const prefixNames = ['Grim', 'Doom', 'Storm', 'Soul', 'Blood', 'Death', 'Void', 'Bane'];
    const suffixNames = ['Bringer', 'Render', 'Strike', 'Edge', 'Mark', 'Touch', 'Bite', 'Fang'];
    name = `${prefixNames[Math.floor(Math.random() * prefixNames.length)]} ${suffixNames[Math.floor(Math.random() * suffixNames.length)]}`;
  }
  
  const item: Item = {
    id: generateItemId(),
    baseId: selectedBase.id,
    name,
    slot,
    itemLevel: monsterLevel,
    rarity,
    prefixes,
    suffixes,
    stats: computeItemStats(selectedBase.baseStats, prefixes, suffixes),
  };
  
  return item;
}

export function rollCurrencyDrop(lootBonus: number): CurrencyType | null {
  if (Math.random() > 0.10 * lootBonus) return null;
  
  let roll = Math.random() * totalCurrencyWeight;
  
  for (const currency of currencies) {
    roll -= currency.dropWeight;
    if (roll <= 0) {
      return currency.id;
    }
  }
  
  return 'transmutation'; // Fallback
}

/**
 * Generate a specific item by base ID (for boss guaranteed drops)
 */
export function generateItemByBaseId(
  baseId: string,
  monsterLevel: number,
  forceRarity?: ItemRarity
): Item | null {
  const selectedBase = itemBases.find(b => b.id === baseId);
  if (!selectedBase) return null;
  
  const rarity: ItemRarity = forceRarity || (Math.random() < 0.3 ? 'rare' : 'magic');
  
  const prefixes: Affix[] = [];
  const suffixes: Affix[] = [];
  const existingIds: string[] = [];
  
  let slot = selectedBase.slot;
  if (slot === 'ring1' && Math.random() < 0.5) {
    slot = 'ring2';
  }
  
  if (rarity === 'magic') {
    const numAffixes = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < numAffixes; i++) {
      const type = Math.random() < 0.5 ? 'prefix' : 'suffix';
      const affix = rollAffix(type, slot, monsterLevel, existingIds);
      if (affix) {
        existingIds.push(affix.definitionId);
        if (type === 'prefix') prefixes.push(affix);
        else suffixes.push(affix);
      }
    }
  } else if (rarity === 'rare') {
    const numAffixes = 4 + Math.floor(Math.random() * 3); // 4-6 affixes for boss drops
    const numPrefixes = Math.min(3, Math.floor(numAffixes / 2) + (Math.random() < 0.5 ? 1 : 0));
    const numSuffixes = Math.min(3, numAffixes - numPrefixes);
    
    for (let i = 0; i < numPrefixes; i++) {
      const affix = rollAffix('prefix', slot, monsterLevel, existingIds);
      if (affix) {
        existingIds.push(affix.definitionId);
        prefixes.push(affix);
      }
    }
    
    for (let i = 0; i < numSuffixes; i++) {
      const affix = rollAffix('suffix', slot, monsterLevel, existingIds);
      if (affix) {
        existingIds.push(affix.definitionId);
        suffixes.push(affix);
      }
    }
  }
  
  let name = selectedBase.name;
  if (rarity === 'magic' && prefixes.length > 0) {
    const prefixDef = allAffixes.find(a => a.id === prefixes[0].definitionId);
    if (prefixDef) {
      name = `${prefixDef.name} ${selectedBase.name}`;
    }
  } else if (rarity === 'rare') {
    const prefixNames = ['Grim', 'Doom', 'Storm', 'Soul', 'Blood', 'Death', 'Void', 'Bane'];
    const suffixNames = ['Bringer', 'Render', 'Strike', 'Edge', 'Mark', 'Touch', 'Bite', 'Fang'];
    name = `${prefixNames[Math.floor(Math.random() * prefixNames.length)]} ${suffixNames[Math.floor(Math.random() * suffixNames.length)]}`;
  }
  
  return {
    id: generateItemId(),
    baseId: selectedBase.id,
    name,
    slot,
    itemLevel: monsterLevel,
    rarity,
    prefixes,
    suffixes,
    stats: computeItemStats(selectedBase.baseStats, prefixes, suffixes),
  };
}

/**
 * Generate all loot from killing a monster
 */
export function generateLoot(monster: Monster): LootResult {
  const result: LootResult = {
    items: [],
    currency: {},
    experience: monster.experienceReward,
  };
  
  const itemDropChance = monster.rarity === 'boss' ? 1.0 :
                         monster.rarity === 'rare' ? 0.5 :
                         monster.rarity === 'magic' ? 0.3 : 0.15;
  
  if (Math.random() < itemDropChance * monster.lootBonus) {
    const item = generateItem(monster.level, monster.lootBonus);
    if (item) {
      result.items.push(item);
    }
  }
  
  if (monster.rarity === 'boss') {
    const bossDefinition = bossById.get(monster.definitionId);
    if (bossDefinition && bossDefinition.guaranteedDrops) {
      for (const baseId of bossDefinition.guaranteedDrops) {
        const guaranteedItem = generateItemByBaseId(baseId, monster.level);
        if (guaranteedItem) {
          result.items.push(guaranteedItem);
        }
      }
    }
  }
  
  const currencyRolls = monster.rarity === 'boss' ? 3 : 1;
  for (let i = 0; i < currencyRolls; i++) {
    const currency = rollCurrencyDrop(monster.lootBonus);
    if (currency) {
      result.currency[currency] = (result.currency[currency] || 0) + 1;
    }
  }
  
  return result;
}
