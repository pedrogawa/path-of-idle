import type { 
  Item, 
  ItemRarity, 
  Monster, 
  CurrencyType,
  Affix,
  EquipmentSlot,
  PlayerStats,
  ItemBase,
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

function rollTierValue(minValue: number, maxValue: number): number {
  const hasDecimals = !Number.isInteger(minValue) || !Number.isInteger(maxValue);
  if (hasDecimals) {
    const value = minValue + Math.random() * (maxValue - minValue);
    return Math.round(value * 10) / 10;
  }
  return Math.floor(minValue + Math.random() * (maxValue - minValue + 1));
}

function rollBaseStats(base: ItemBase): Partial<PlayerStats> {
  const rolled = { ...base.baseStats };
  if (!base.baseStatRanges) return rolled;

  Object.entries(base.baseStatRanges).forEach(([key, range]) => {
    if (!range) return;
    (rolled as Record<string, number>)[key] = rollTierValue(range.min, range.max);
  });

  return rolled;
}

function getItemLevelBonusForMonsterRarity(monster: Monster): number {
  switch (monster.rarity) {
    case 'magic':
      return 1;
    case 'rare':
    case 'boss':
      return 2;
    default:
      return 0;
  }
}

/**
 * Roll a random affix for an item
 */
function rollAffix(
  type: 'prefix' | 'suffix',
  base: ItemBase,
  slot: EquipmentSlot,
  itemLevel: number,
  existingAffixIds: string[]
): Affix | null {
  const baseTags = base.baseTags ?? [];
  const applicable = allAffixes.filter(a => 
    a.type === type && 
    a.applicableSlots.includes(slot) &&
    (!a.requiredBaseTagsAny || a.requiredBaseTagsAny.some(tag => baseTags.includes(tag))) &&
    !existingAffixIds.includes(a.id)
  );
  
  if (applicable.length === 0) return null;
  
  const affixDef = applicable[Math.floor(Math.random() * applicable.length)];
  
  const availableTiers = affixDef.tiers.filter(t => t.requiredItemLevel <= itemLevel);
  if (availableTiers.length === 0) return null;
  
  const tier = availableTiers[availableTiers.length - 1];
  
  const value = rollTierValue(tier.minValue, tier.maxValue);
  const secondaryValue = affixDef.secondaryStatKey
    ? affixDef.usePrimaryValueForSecondary
      ? value
      : (
        tier.secondaryMinValue !== undefined &&
        tier.secondaryMaxValue !== undefined
      )
        ? rollTierValue(tier.secondaryMinValue, tier.secondaryMaxValue)
        : undefined
    : undefined;

  const tertiaryValue = affixDef.tertiaryStatKey
    ? affixDef.usePrimaryValueForTertiary
      ? value
      : (
        tier.tertiaryMinValue !== undefined &&
        tier.tertiaryMaxValue !== undefined
      )
        ? rollTierValue(tier.tertiaryMinValue, tier.tertiaryMaxValue)
        : undefined
    : undefined;
  
  return {
    definitionId: affixDef.id,
    tier: tier.tier,
    value,
    secondaryValue,
    tertiaryValue,
  };
}

function rollAffixesForRarity(
  rarity: ItemRarity,
  base: ItemBase,
  slot: EquipmentSlot,
  itemLevel: number
): { prefixes: Affix[]; suffixes: Affix[] } {
  const prefixes: Affix[] = [];
  const suffixes: Affix[] = [];
  const existingIds: string[] = [];

  const minAffixes = rarity === 'magic' ? 1 : rarity === 'rare' ? 2 : 0;
  const maxAffixes = rarity === 'magic' ? 2 : rarity === 'rare' ? 6 : 0;
  if (maxAffixes === 0) {
    return { prefixes, suffixes };
  }

  const targetAffixes = minAffixes + Math.floor(Math.random() * (maxAffixes - minAffixes + 1));

  const tryAddAffix = (type: 'prefix' | 'suffix'): boolean => {
    if (type === 'prefix' && prefixes.length >= 3) return false;
    if (type === 'suffix' && suffixes.length >= 3) return false;

    const affix = rollAffix(type, base, slot, itemLevel, existingIds);
    if (!affix) return false;

    existingIds.push(affix.definitionId);
    if (type === 'prefix') {
      prefixes.push(affix);
    } else {
      suffixes.push(affix);
    }
    return true;
  };

  const totalAffixes = () => prefixes.length + suffixes.length;

  let attempts = 0;
  while (totalAffixes() < targetAffixes && attempts < 48) {
    attempts += 1;

    const canRollPrefix = prefixes.length < 3;
    const canRollSuffix = suffixes.length < 3;
    if (!canRollPrefix && !canRollSuffix) break;

    const firstType: 'prefix' | 'suffix' = canRollPrefix && canRollSuffix
      ? (Math.random() < 0.5 ? 'prefix' : 'suffix')
      : (canRollPrefix ? 'prefix' : 'suffix');
    const secondType: 'prefix' | 'suffix' = firstType === 'prefix' ? 'suffix' : 'prefix';

    if (tryAddAffix(firstType)) continue;
    if (tryAddAffix(secondType)) continue;

    break;
  }

  if (totalAffixes() < minAffixes) {
    let canStillRoll = true;
    while (totalAffixes() < minAffixes && canStillRoll) {
      canStillRoll = false;
      if (tryAddAffix('prefix')) canStillRoll = true;
      if (totalAffixes() >= minAffixes) break;
      if (tryAddAffix('suffix')) canStillRoll = true;
    }
  }

  return { prefixes, suffixes };
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

    if (def.secondaryStatKey && affix.secondaryValue !== undefined) {
      const secondaryCurrentValue = (stats[def.secondaryStatKey] as number) || 0;
      (stats as Record<string, number>)[def.secondaryStatKey] = secondaryCurrentValue + affix.secondaryValue;
    }

    if (def.tertiaryStatKey && affix.tertiaryValue !== undefined) {
      const tertiaryCurrentValue = (stats[def.tertiaryStatKey] as number) || 0;
      (stats as Record<string, number>)[def.tertiaryStatKey] = tertiaryCurrentValue + affix.tertiaryValue;
    }
  });

  // Local defenses: increased Armor/Evasion/ES on an item apply to that item's own defenses.
  const armor = (stats.armor as number) || 0;
  const increasedArmor = (stats.increasedArmor as number) || 0;
  if (armor > 0 && increasedArmor !== 0) {
    stats.armor = Math.floor(armor * (1 + increasedArmor / 100));
  }

  const evasion = (stats.evasion as number) || 0;
  const increasedEvasion = (stats.increasedEvasion as number) || 0;
  if (evasion > 0 && increasedEvasion !== 0) {
    stats.evasion = Math.floor(evasion * (1 + increasedEvasion / 100));
  }

  const energyShield = (stats.energyShield as number) || 0;
  const increasedEnergyShield = (stats.increasedEnergyShield as number) || 0;
  if (energyShield > 0 && increasedEnergyShield !== 0) {
    stats.energyShield = Math.floor(energyShield * (1 + increasedEnergyShield / 100));
  }
  
  return stats;
}

/**
 * Generate a random item
 */
export function generateItem(
  monsterLevel: number,
  lootBonus: number,
  forceRarity?: ItemRarity,
  itemLevelBonus: number = 0
): Item | null {
  const availableBases = itemBases.filter(b => b.dropLevel <= monsterLevel);
  if (availableBases.length === 0) return null;

  // Bias toward bases near the current area level.
  // This keeps progression feeling natural while still allowing occasional older bases.
  const sigma = Math.max(3, monsterLevel * 0.18);
  const weights = availableBases.map(b => {
    const levelDelta = monsterLevel - b.dropLevel;
    const gaussianWeight = Math.exp(-(levelDelta * levelDelta) / (2 * sigma * sigma));
    return 0.001 + gaussianWeight;
  });
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
  
  const itemLevel = Math.max(1, monsterLevel + itemLevelBonus);
  
  let slot = selectedBase.slot;
  if (slot === 'ring1' && Math.random() < 0.5) {
    slot = 'ring2';
  }

  const { prefixes, suffixes } = rollAffixesForRarity(rarity, selectedBase, slot, itemLevel);
  
  const name = selectedBase.name;
  
  const rolledBaseStats = rollBaseStats(selectedBase);

  const item: Item = {
    id: generateItemId(),
    baseId: selectedBase.id,
    name,
    slot,
    itemLevel,
    rolledBaseStats,
    rarity,
    prefixes,
    suffixes,
    stats: computeItemStats(rolledBaseStats, prefixes, suffixes),
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

function rollSocketOrbDrop(monster: Monster): boolean {
  // Very rare at low levels, slightly less rare later.
  const baseChance = monster.level <= 10
    ? 0.003
    : monster.level <= 20
      ? 0.006
      : 0.01;

  const rarityMultiplier = monster.rarity === 'boss'
    ? 3
    : monster.rarity === 'rare'
      ? 1.8
      : monster.rarity === 'magic'
        ? 1.3
        : 1;

  return Math.random() < baseChance * monster.lootBonus * rarityMultiplier;
}

/**
 * Generate a specific item by base ID (for boss guaranteed drops)
 */
export function generateItemByBaseId(
  baseId: string,
  monsterLevel: number,
  forceRarity?: ItemRarity,
  itemLevelBonus: number = 0
): Item | null {
  const selectedBase = itemBases.find(b => b.id === baseId);
  if (!selectedBase) return null;
  
  const rarity: ItemRarity = forceRarity || (Math.random() < 0.3 ? 'rare' : 'magic');
  const itemLevel = Math.max(1, monsterLevel + itemLevelBonus);
  
  let slot = selectedBase.slot;
  if (slot === 'ring1' && Math.random() < 0.5) {
    slot = 'ring2';
  }

  const { prefixes, suffixes } = rollAffixesForRarity(rarity, selectedBase, slot, itemLevel);
  
  const name = selectedBase.name;
  
  const rolledBaseStats = rollBaseStats(selectedBase);

  return {
    id: generateItemId(),
    baseId: selectedBase.id,
    name,
    slot,
    itemLevel,
    rolledBaseStats,
    rarity,
    prefixes,
    suffixes,
    stats: computeItemStats(rolledBaseStats, prefixes, suffixes),
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
  
  const itemLevelBonus = getItemLevelBonusForMonsterRarity(monster);
  
  if (Math.random() < itemDropChance * monster.lootBonus) {
    const item = generateItem(monster.level, monster.lootBonus, undefined, itemLevelBonus);
    if (item) {
      result.items.push(item);
    }
  }
  
  if (monster.rarity === 'boss') {
    const bossDefinition = bossById.get(monster.definitionId);
    if (bossDefinition && bossDefinition.guaranteedDrops) {
      for (const baseId of bossDefinition.guaranteedDrops) {
        const guaranteedItem = generateItemByBaseId(baseId, monster.level, undefined, itemLevelBonus);
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

  if (rollSocketOrbDrop(monster)) {
    result.currency.socketOrb = (result.currency.socketOrb || 0) + 1;
  }
  
  return result;
}
