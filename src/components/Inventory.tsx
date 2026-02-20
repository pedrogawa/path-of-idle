import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../stores/gameStore';
import type { Item, EquipmentSlot } from '../types';
import { allAffixes, itemBaseById } from '../data';

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: '⚔️ Weapon',
  offhand: '🛡️ Offhand',
  helmet: '🪖 Helmet',
  bodyArmor: '🛡️ Body',
  gloves: '🧤 Gloves',
  boots: '👢 Boots',
  belt: '🎀 Belt',
  amulet: '📿 Amulet',
  ring1: '💍 Ring 1',
  ring2: '💍 Ring 2',
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

const RARITY_STYLES = {
  normal: {
    text: 'text-gray-300',
    border: 'border-gray-600',
    bg: 'bg-gray-800/50',
    bgSolid: 'bg-[#1a1a24]',
    glow: '',
    headerBg: 'bg-gray-700',
  },
  magic: {
    text: 'text-blue-400',
    border: 'border-blue-500',
    bg: 'bg-blue-900/30',
    bgSolid: 'bg-[#0d1a2d]',
    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.3)]',
    headerBg: 'bg-blue-800',
  },
  rare: {
    text: 'text-yellow-400',
    border: 'border-yellow-500',
    bg: 'bg-yellow-900/20',
    bgSolid: 'bg-[#1f1a0d]',
    glow: 'shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    headerBg: 'bg-yellow-800',
  },
  unique: {
    text: 'text-orange-400',
    border: 'border-orange-500',
    bg: 'bg-orange-900/20',
    bgSolid: 'bg-[#1f140d]',
    glow: 'shadow-[0_0_8px_rgba(249,115,22,0.4)]',
    headerBg: 'bg-orange-800',
  },
};

const PERCENTAGE_STATS = new Set([
  'attackSpeed', // Old items might have this
  'increasedAttackSpeed',
  'increasedPhysicalDamage',
  'increasedFireDamage',
  'increasedColdDamage',
  'increasedLightningDamage',
  'criticalChance',
  'fireResistance',
  'coldResistance',
  'lightningResistance',
  'blockChance',
]);

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

function ItemCard({ item, label, dimmed = false, solid = false }: { item: Item; label?: string; dimmed?: boolean; solid?: boolean }) {
  const style = RARITY_STYLES[item.rarity];
  const base = itemBaseById.get(item.baseId);
  const bgClass = solid ? style.bgSolid : style.bg;

  return (
    <div className={`rounded-lg border-2 ${style.border} ${bgClass} min-w-[220px] ${dimmed ? 'opacity-60' : ''}`}>
      {/* Header */}
      {label && (
        <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${style.headerBg} rounded-t-md text-white/80`}>
          {label}
        </div>
      )}

      {/* Item name */}
      <div className="p-3">
        <div className={`font-bold text-sm ${style.text}`}>{item.name}</div>

        {/* Base type & info */}
        <div className="text-xs text-gray-400 mt-0.5">
          {base?.name}
        </div>
        <div className="flex gap-2 text-[10px] text-gray-500">
          <span>{item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}</span>
          <span>•</span>
          <span>iLvl {item.itemLevel}</span>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-700 my-2" />

        {/* Stats */}
        <div className="space-y-1">
          {Object.entries(item.stats).map(([key, value]) => {
            if (!value) return null;
            const label = formatStatName(key);
            const showPercent = isPercentageStat(key);

            return (
              <div key={key} className="text-xs flex justify-between gap-4">
                <span className="text-gray-400">{label}</span>
                <span className="text-blue-300 font-medium">
                  +{typeof value === 'number' ? Math.floor(value) : value}{showPercent ? '%' : ''}
                </span>
              </div>
            );
          })}
          {Object.keys(item.stats).length === 0 && (
            <div className="text-xs text-gray-500 italic">No bonuses</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonTooltip({
  item,
  equippedItem,
  position
}: {
  item: Item;
  equippedItem: Item | null;
  position: { x: number; y: number };
}) {
  const tooltipWidth = equippedItem ? 480 : 240;
  const tooltipHeight = 300;

  let left = position.x + 20;
  let top = position.y - 10;

  if (left + tooltipWidth > window.innerWidth - 20) {
    left = position.x - tooltipWidth - 20;
  }

  if (top + tooltipHeight > window.innerHeight - 20) {
    top = window.innerHeight - tooltipHeight - 20;
  }

  if (top < 20) {
    top = 20;
  }

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ left, top }}
    >
      <div className="flex gap-2 items-start">
        {/* New item */}
        <ItemCard item={item} label="Hovering" solid />

        {/* Equipped item for comparison */}
        {equippedItem && (
          <ItemCard item={equippedItem} label="Currently Equipped" solid />
        )}
      </div>

      {/* Hint */}
      <div className="mt-2 text-[10px] text-gray-500 bg-[#0a0a0f] px-2 py-1 rounded inline-block border border-gray-700">
        Click to equip • Right-click to sell
      </div>
    </div>,
    document.body
  );
}

function EquipmentSlotBox({
  slot,
  item,
  onUnequip
}: {
  slot: EquipmentSlot;
  item: Item | null;
  onUnequip: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const style = item ? RARITY_STYLES[item.rarity] : null;

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative">
      <div className="text-[10px] text-gray-500 mb-1 text-center truncate">
        {SLOT_LABELS[slot]}
      </div>

      <button
        onClick={item ? onUnequip : undefined}
        onMouseEnter={() => item && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseMove={handleMouseMove}
        className={`
          w-full h-14 rounded-lg border-2 flex flex-col items-center justify-center
          transition-all duration-150
          ${item
            ? `${style?.border} ${style?.bg} ${style?.glow} hover:brightness-125 cursor-pointer`
            : 'border-gray-700 border-dashed bg-[#0a0a0f] cursor-default'
          }
        `}
        title={item ? 'Click to unequip' : 'Empty slot'}
      >
        {item ? (
          <>
            <span className="text-lg">{SLOT_ICONS[slot]}</span>
            <span className={`text-[9px] truncate max-w-full px-1 ${style?.text}`}>
              {item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name}
            </span>
          </>
        ) : (
          <span className="text-gray-600 text-lg">{SLOT_ICONS[slot]}</span>
        )}
      </button>

      {/* Equipment tooltip - no comparison needed */}
      {showTooltip && item && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: mousePos.x + 20, top: mousePos.y - 10 }}
        >
          <ItemCard item={item} label="Equipped" solid />
          <div className="mt-2 text-[10px] text-gray-500 bg-[#0a0a0f] px-2 py-1 rounded inline-block border border-gray-700">
            Click to unequip
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function InventoryItem({
  item,
  equippedItem,
  onEquip,
  onSell
}: {
  item: Item;
  equippedItem: Item | null;
  onEquip: () => void;
  onSell: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const style = RARITY_STYLES[item.rarity];

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onSell();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative">
      <button
        onClick={onEquip}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseMove={handleMouseMove}
        className={`
          w-full p-2 rounded-lg border-2 text-left
          transition-all duration-150 hover:brightness-125 hover:scale-[1.02]
          ${style.border} ${style.bg} ${style.glow}
        `}
      >
        {/* Item name */}
        <div className={`font-medium text-sm truncate ${style.text}`}>
          {item.name}
        </div>

        {/* Item info row */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-500">
            {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
          </span>
          <span className="text-[10px] text-gray-600">
            iLvl {item.itemLevel}
          </span>
        </div>

        {/* Quick stat preview */}
        <div className="mt-1 flex flex-wrap gap-1">
          {Object.entries(item.stats).slice(0, 2).map(([key, value]) => {
            if (!value) return null;
            return (
              <span key={key} className="text-[9px] text-blue-400/80 bg-blue-900/30 px-1 rounded">
                +{typeof value === 'number' ? Math.floor(value) : value}{isPercentageStat(key) ? '%' : ''}
              </span>
            );
          })}
          {Object.keys(item.stats).length > 2 && (
            <span className="text-[9px] text-gray-500">
              +{Object.keys(item.stats).length - 2} more
            </span>
          )}
        </div>
      </button>

      {/* Tooltip with comparison - rendered via portal */}
      {showTooltip && (
        <ComparisonTooltip
          item={item}
          equippedItem={equippedItem}
          position={mousePos}
        />
      )}
    </div>
  );
}

interface InventoryProps {
  showEquipment?: boolean;
  compact?: boolean;
}

export function Inventory({ showEquipment = false, compact = false }: InventoryProps) {
  const player = useGameStore(state => state.player);
  const equipItem = useGameStore(state => state.equipItem);
  const unequipItem = useGameStore(state => state.unequipItem);
  const sellItem = useGameStore(state => state.sellItem);

  const getEquippedForSlot = (slot: EquipmentSlot): Item | null => {
    return player.equipment[slot];
  };

  return (
    <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
      <h2 className={`font-bold text-[#c9a227] mb-3 flex items-center gap-2 ${compact ? 'text-sm' : 'text-lg'}`}>
        <span className={compact ? 'text-lg' : 'text-2xl'}>🎒</span>
        Inventory
        <span className="text-xs text-gray-600 ml-auto font-normal">
          {player.inventory.length}/{player.inventorySize}
        </span>
      </h2>

      {/* Equipment Grid - optional */}
      {showEquipment && (
        <div className="grid grid-cols-4 gap-2 mb-4 pb-3 border-b border-[#2a2a3a]">
          {(Object.keys(SLOT_LABELS) as EquipmentSlot[]).map(slot => (
            <EquipmentSlotBox
              key={slot}
              slot={slot}
              item={player.equipment[slot]}
              onUnequip={() => unequipItem(slot)}
            />
          ))}
        </div>
      )}

      {/* Inventory Items */}
      {player.inventory.length === 0 ? (
        <div className={`text-center text-gray-500 text-sm bg-[#0a0a0f] rounded-lg border border-dashed border-gray-700 ${compact ? 'py-4' : 'py-12'}`}>
          No items yet. Kill some monsters!
        </div>
      ) : (
        <div className={`grid gap-2 overflow-y-auto pr-1 ${compact ? 'grid-cols-1 max-h-48' : 'grid-cols-2 max-h-[500px]'}`}>
          {player.inventory.map(item => {
            const targetSlot = item.slot;
            const equippedItem = getEquippedForSlot(targetSlot);

            return (
              <InventoryItem
                key={item.id}
                item={item}
                equippedItem={equippedItem}
                onEquip={() => equipItem(item.id)}
                onSell={() => sellItem(item.id)}
              />
            );
          })}
        </div>
      )}

      {/* Help text */}
      <div className="mt-3 text-[10px] text-gray-600 text-center">
        💡 Click to equip • Right-click to sell
      </div>
    </div>
  );
}
