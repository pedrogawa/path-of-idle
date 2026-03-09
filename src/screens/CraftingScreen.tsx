import { useMemo, useState } from 'react';
import { ItemTooltipPortal } from '../components/ItemTooltip';
import { allAffixes, currencies } from '../data';
import { itemBaseById } from '../data/itemBases';
import { useGameStore } from '../stores/gameStore';
import type { CurrencyType, EquipmentSlot, Item, PlayerStats } from '../types';

const useCombatPadding = () => {
  const combatState = useGameStore(state => state.combatState);
  return combatState === 'fighting' ? 'pb-20' : '';
};

const RARITY_TEXT: Record<Item['rarity'], string> = {
  normal: 'text-gray-300',
  magic: 'text-blue-400',
  rare: 'text-yellow-400',
  unique: 'text-orange-400',
};

const RARITY_BORDER: Record<Item['rarity'], string> = {
  normal: 'border-gray-600',
  magic: 'border-blue-500/60',
  rare: 'border-yellow-500/60',
  unique: 'border-orange-500/60',
};

const SLOT_ICONS: Record<EquipmentSlot, string> = {
  weapon: '⚔️',
  offhand: '🛡️',
  helmet: '🪖',
  bodyArmor: '🛡️',
  gloves: '🧤',
  boots: '👢',
  belt: '🎀',
  amulet: '📿',
  ring1: '💍',
  ring2: '💍',
};

const PERCENTAGE_STATS = new Set([
  'attackSpeed',
  'increasedAttackSpeed',
  'increasedPhysicalDamage',
  'increasedFireDamage',
  'increasedColdDamage',
  'increasedLightningDamage',
  'increasedEnergyShield',
  'increasedArmor',
  'increasedEvasion',
  'criticalChance',
  'fireResistance',
  'coldResistance',
  'lightningResistance',
  'chaosResistance',
  'blockChance',
]);

const affixById = new Map(allAffixes.map(affix => [affix.id, affix]));
const LOCAL_DEFENSE_KEYS: Array<keyof PlayerStats> = ['armor', 'evasion', 'energyShield'];

type CraftValidation = {
  canApply: boolean;
  reason: string;
};

function isPercentageStat(key: string): boolean {
  if (PERCENTAGE_STATS.has(key)) return true;
  const affix = allAffixes.find(a => a.statKey === key);
  return affix?.isPercentage ?? false;
}

function formatStatName(key: string): string {
  const affix = allAffixes.find(a => a.statKey === key);
  if (affix) return affix.name;
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

function formatStatValue(value: number): string {
  return Number.isInteger(value) ? String(Math.floor(value)) : value.toFixed(1);
}

function getDisplayBaseStats(item: Item): Partial<PlayerStats> {
  const base = itemBaseById.get(item.baseId);
  const baseStats = item.rolledBaseStats ?? base?.baseStats ?? {};
  const display = { ...baseStats };

  for (const statKey of LOCAL_DEFENSE_KEYS) {
    const totalValue = item.stats[statKey];
    if (typeof totalValue === 'number' && totalValue !== 0) {
      (display as Record<string, number>)[statKey] = totalValue;
    }
  }

  return display;
}

function getCraftValidation(currencyId: CurrencyType, item: Item | null): CraftValidation {
  if (!item) {
    return {
      canApply: false,
      reason: 'Select an item from your backpack.',
    };
  }

  if (currencyId === 'transmutation') {
    if (item.rarity !== 'normal') {
      return {
        canApply: false,
        reason: 'Orb of Transmutation can only be used on Normal items.',
      };
    }
    return {
      canApply: true,
      reason: 'Will upgrade this item to Magic with 1-2 valid affixes based on item level.',
    };
  }

  if (currencyId === 'alteration') {
    if (item.rarity !== 'magic') {
      return {
        canApply: false,
        reason: 'Orb of Alteration can only be used on Magic items.',
      };
    }
    return {
      canApply: true,
      reason: 'Will reroll this magic item into 1-2 affixes (prefix/suffix mix is random) using its iLvl affix pool.',
    };
  }

  if (currencyId === 'augmentation') {
    if (item.rarity !== 'magic') {
      return {
        canApply: false,
        reason: 'Orb of Augmentation can only be used on Magic items.',
      };
    }

    const affixCount = item.prefixes.length + item.suffixes.length;
    if (affixCount !== 1) {
      return {
        canApply: false,
        reason: 'Orb of Augmentation requires exactly 1 existing magic modifier.',
      };
    }

    return {
      canApply: true,
      reason: 'Will add 1 new affix (max 2 total) using the item iLvl affix pool.',
    };
  }

  return {
    canApply: false,
    reason: 'This currency crafting action is not implemented yet.',
  };
}

export function CraftingScreen() {
  const navigateTo = useGameStore(state => state.navigateTo);
  const combatState = useGameStore(state => state.combatState);
  const player = useGameStore(state => state.player);
  const addLog = useGameStore(state => state.addLog);
  const craftWithTransmutation = useGameStore(state => state.craftWithTransmutation);
  const craftWithAlteration = useGameStore(state => state.craftWithAlteration);
  const craftWithAugmentation = useGameStore(state => state.craftWithAugmentation);
  const combatPadding = useCombatPadding();

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('transmutation');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{ item: Item; x: number; y: number } | null>(null);

  const inventoryItems = useMemo(() => player.inventory, [player.inventory]);

  const selectedItem = (selectedItemId
    ? inventoryItems.find(item => item.id === selectedItemId)
    : undefined) ?? inventoryItems[0] ?? null;

  const selectedCurrencyDef = currencies.find(currency => currency.id === selectedCurrency) ?? currencies[0];
  const selectedCurrencyAmount = player.currency[selectedCurrency];
  const validation = getCraftValidation(selectedCurrency, selectedItem);
  const canCraft = validation.canApply && selectedCurrencyAmount > 0;
  const selectedBaseStats = selectedItem ? getDisplayBaseStats(selectedItem) : {};
  const selectedBaseStatRows = Object.entries(selectedBaseStats).filter(([, value]) => typeof value === 'number' && value !== 0);
  const selectedAffixRows = selectedItem
    ? [
      ...selectedItem.prefixes.map(affix => ({ affix, kind: 'Prefix' })),
      ...selectedItem.suffixes.map(affix => ({ affix, kind: 'Suffix' })),
    ]
    : [];

  const handleCraft = () => {
    if (!selectedItem) {
      addLog('playerHit', 'Select an item first.');
      return;
    }

    if (selectedCurrency === 'transmutation') {
      craftWithTransmutation(selectedItem.id);
      return;
    }

    if (selectedCurrency === 'alteration') {
      craftWithAlteration(selectedItem.id);
      return;
    }

    if (selectedCurrency === 'augmentation') {
      craftWithAugmentation(selectedItem.id);
      return;
    }

    addLog('playerHit', `${selectedCurrencyDef.name} crafting is not implemented yet.`);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] ${combatPadding}`}>
      <div className="bg-[#0a0a0f]/80 border-b border-[#2a2a3a] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => navigateTo(combatState === 'fighting' ? 'combat' : 'town')}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors text-sm text-gray-300"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl">🔨</span>
            <div>
              <h1 className="text-xl font-bold text-[#c9a227]">Crafting Bench</h1>
              <p className="text-xs text-gray-500">Select currency + item, then craft</p>
            </div>
          </div>

          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <h2 className="text-lg font-bold text-[#c9a227] mb-3">Crafting Table</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded border border-[#2a2a3a] bg-[#0a0a0f] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Item Slot</div>
                  {selectedItem ? (
                    <div className="space-y-2">
                      <div className={`text-sm font-semibold ${RARITY_TEXT[selectedItem.rarity]}`}>{selectedItem.name}</div>
                      <div className="text-xs text-gray-500">
                        Base: {itemBaseById.get(selectedItem.baseId)?.name ?? selectedItem.baseId}
                      </div>
                      <div className="text-xs text-gray-500">
                        iLvl {selectedItem.itemLevel} • {selectedItem.rarity}
                      </div>

                      <div className="border-t border-[#2a2a3a] my-2" />
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-gray-500">Base Stats</div>
                        {selectedBaseStatRows.length === 0 && (
                          <div className="text-xs text-gray-500 italic">No bonuses</div>
                        )}
                        {selectedBaseStatRows.map(([key, value]) => (
                          <div key={`craft_base_${key}`} className="text-xs flex justify-between gap-4">
                            <span className="text-gray-300">{formatStatName(key)}</span>
                            <span className="text-blue-200 font-medium">
                              +{formatStatValue(value as number)}{isPercentageStat(key) ? '%' : ''}
                            </span>
                          </div>
                        ))}
                      </div>

                      {selectedAffixRows.length > 0 && (
                        <>
                          <div className="border-t border-[#2a2a3a] my-2" />
                          <div className="space-y-1.5">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500">Affixes</div>
                            {selectedAffixRows.map(({ affix, kind }) => {
                              const def = affixById.get(affix.definitionId);
                              if (!def) return null;

                              const statParts: Array<{ key: keyof PlayerStats; value: number }> = [{ key: def.statKey, value: affix.value }];
                              if (def.secondaryStatKey && affix.secondaryValue !== undefined) {
                                statParts.push({ key: def.secondaryStatKey, value: affix.secondaryValue });
                              }
                              if (def.tertiaryStatKey && affix.tertiaryValue !== undefined) {
                                statParts.push({ key: def.tertiaryStatKey, value: affix.tertiaryValue });
                              }

                              return (
                                <div key={`craft_affix_${affix.definitionId}_${kind}_${affix.tier}`} className="rounded border border-[#2a2a3a] bg-[#111421] px-2 py-1">
                                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                    {kind} • Tier {affix.tier}
                                  </div>
                                  {statParts.map((part, index) => (
                                    <div key={`craft_part_${affix.definitionId}_${part.key}_${index}`} className="text-xs flex justify-between gap-4">
                                      <span className="text-gray-300">{formatStatName(part.key)}</span>
                                      <span className="text-blue-300 font-medium">
                                        +{formatStatValue(part.value)}{def.isPercentage ? '%' : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No item selected</div>
                  )}
                </div>

                <div className="rounded border border-[#2a2a3a] bg-[#0a0a0f] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Currency Slot</div>
                  <div className="text-sm font-semibold" style={{ color: selectedCurrencyDef.color }}>
                    {selectedCurrencyDef.name}
                  </div>
                  <div className="text-xs text-gray-500">{selectedCurrencyDef.description}</div>
                  <div className="text-xs text-gray-400 mt-1">Owned: {selectedCurrencyAmount}</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-400">{validation.reason}</div>

              <button
                onClick={handleCraft}
                disabled={!canCraft}
                className={`mt-4 w-full py-2.5 rounded-lg border font-semibold transition-colors ${
                  canCraft
                    ? 'border-blue-500/70 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50'
                    : 'border-[#2a2a3a] bg-[#0a0a0f] text-gray-500 cursor-not-allowed'
                }`}
              >
                Craft
              </button>
            </div>

            <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white">Backpack Items</h3>
                <span className="text-xs text-gray-500">{inventoryItems.length} items</span>
              </div>

              {inventoryItems.length === 0 ? (
                <div className="text-sm text-gray-500 bg-[#0a0a0f] rounded border border-dashed border-[#2a2a3a] p-4">
                  Your inventory is empty.
                </div>
              ) : (
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {inventoryItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      onMouseEnter={event => {
                        setHoveredItem({ item, x: event.clientX, y: event.clientY });
                      }}
                      onMouseMove={event => {
                        setHoveredItem({ item, x: event.clientX, y: event.clientY });
                      }}
                      onMouseLeave={() => {
                        setHoveredItem(current => (current?.item.id === item.id ? null : current));
                      }}
                      title={`${item.name} • iLvl ${item.itemLevel}`}
                      className={`relative aspect-square rounded border transition-colors ${
                        item.id === selectedItem?.id
                          ? 'border-[#c9a227]/70 bg-[#1b1a12] ring-1 ring-[#c9a227]/30'
                          : `${RARITY_BORDER[item.rarity]} bg-[#0a0a0f] hover:border-[#c9a227]/50`
                      }`}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <span className="text-lg leading-none">{SLOT_ICONS[item.slot]}</span>
                        <span className={`text-[9px] mt-1 ${RARITY_TEXT[item.rarity]}`}>
                          {item.rarity[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute top-0.5 right-0.5 text-[9px] text-gray-500 bg-[#00000080] px-1 rounded">
                        {item.itemLevel}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="text-[11px] text-gray-500 mt-2">
                Hover an item to inspect full details. Click to place it in the crafting table.
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <h3 className="text-lg font-bold text-[#c9a227] mb-3">Currency</h3>
              <div className="grid grid-cols-2 gap-2">
                {currencies.map(currency => {
                  const amount = player.currency[currency.id];
                  const isSelected = selectedCurrency === currency.id;

                  return (
                    <button
                      key={currency.id}
                      onClick={() => setSelectedCurrency(currency.id)}
                      className={`text-left p-2 rounded border transition-colors ${
                        isSelected
                          ? 'border-[#c9a227]/70 bg-[#1b1a12]'
                          : 'border-[#2a2a3a] bg-[#0a0a0f] hover:border-[#c9a227]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: `${currency.color}30`, color: currency.color }}
                        >
                          {currency.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-300 truncate">
                            {currency.name.replace('Orb of ', '').replace(' Orb', '')}
                          </div>
                          <div className="text-sm text-white font-semibold">{amount}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hoveredItem && (
        <ItemTooltipPortal
          item={hoveredItem.item}
          position={{ x: hoveredItem.x, y: hoveredItem.y }}
          label="Backpack Item"
          hint="Click to select for crafting"
        />
      )}
    </div>
  );
}
