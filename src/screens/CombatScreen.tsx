import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { CombatArena } from '../components/CombatArena';
import { CombatLog } from '../components/CombatLog';
import { Inventory } from '../components/Inventory';
import { PlayerStats } from '../components/PlayerStats';
import { SkillBar } from '../components/SkillBar';
import { ItemTooltipPortal } from '../components/ItemTooltip';
import { computePlayerStats } from '../lib/combat';
import { mapById } from '../data';
import type { EquipmentSlot, Item } from '../types';

// Equipment slot layout for compact view
const EQUIPMENT_SLOTS: { slot: EquipmentSlot; icon: string }[] = [
  { slot: 'helmet', icon: '🪖' },
  { slot: 'amulet', icon: '📿' },
  { slot: 'weapon', icon: '⚔️' },
  { slot: 'bodyArmor', icon: '🛡️' },
  { slot: 'offhand', icon: '🛡️' },
  { slot: 'gloves', icon: '🧤' },
  { slot: 'belt', icon: '🎀' },
  { slot: 'boots', icon: '👢' },
  { slot: 'ring1', icon: '💍' },
  { slot: 'ring2', icon: '💍' },
];

const RARITY_COLORS = {
  normal: 'border-gray-600',
  magic: 'border-blue-500/50',
  rare: 'border-yellow-500/50',
  unique: 'border-orange-500/50',
};

export function CombatScreen() {
  const navigateTo = useGameStore(state => state.navigateTo);
  const stopFarming = useGameStore(state => state.stopFarming);
  const player = useGameStore(state => state.player);
  const currentMapId = useGameStore(state => state.currentMapId);
  const mapProgress = useGameStore(state => state.mapProgress);

  const stats = computePlayerStats(player);
  const map = currentMapId ? mapById.get(currentMapId) : null;
  const progress = currentMapId ? mapProgress[currentMapId] : null;
  const [hoveredItem, setHoveredItem] = useState<{ item: Item; x: number; y: number } | null>(null);
  const expPercent = player.experience > 0
    ? Math.min(100, (player.experience / player.experienceToNextLevel) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
      {/* Header */}
      <div className="bg-[#0a0a0f]/80 border-b border-[#2a2a3a] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          {/* Left - Map info */}
          <div className="flex items-center gap-4">
            <button
              onClick={stopFarming}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 rounded-lg border border-red-700/50 hover:bg-red-900/50 transition-colors text-sm text-red-300"
            >
              🏃 Leave
            </button>

            {map && (
              <div>
                <h1 className="text-lg font-bold text-[#c9a227]">{map.name}</h1>
                <p className="text-xs text-gray-500">
                  Lv.{map.monsterLevel} • {progress?.killCount || 0}/{map.killsRequired} kills
                </p>
              </div>
            )}
          </div>

          {/* Center - Player stats with XP bar */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-6">
              {/* HP */}
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-sm">❤️</span>
                <div className="w-24">
                  <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden border border-red-900/50">
                    <div
                      className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all"
                      style={{ width: `${(player.currentLife / stats.maxLife) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 text-center">
                    {Math.floor(player.currentLife)}/{stats.maxLife}
                  </div>
                </div>
              </div>

              {/* Mana */}
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-sm">💧</span>
                <div className="w-20">
                  <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden border border-blue-900/50">
                    <div
                      className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all"
                      style={{ width: `${(player.currentMana / stats.maxMana) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 text-center">
                    {Math.floor(player.currentMana)}/{stats.maxMana}
                  </div>
                </div>
              </div>

              {/* Level */}
              <div className="text-sm">
                <span className="text-gray-400">Lv.</span>
                <span className="text-white font-bold">{player.level}</span>
              </div>
            </div>

            {/* XP bar */}
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden border border-purple-900/30">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-500 min-w-[60px]">
                {Math.floor(expPercent)}% to {player.level + 1}
              </span>
            </div>
          </div>

          {/* Right - Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('character')}
              className="px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors text-sm text-gray-300"
            >
              👤 Character
            </button>
            <button
              onClick={() => navigateTo('worldMap')}
              className="px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors text-sm text-gray-300"
            >
              🗺️ Map
            </button>
          </div>
        </div>
      </div>

      {/* Combat content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left sidebar - Equipment + Stats + Flasks */}
          <div className="lg:col-span-3 space-y-3">
            {/* Equipment Panel */}
            <div className="bg-[#12121a] rounded-lg p-3 border border-[#2a2a3a]">
              <h3 className="text-sm font-bold text-[#c9a227] mb-3">⚔️ Equipment</h3>
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateAreas: `
                    ". helmet amulet"
                    "weapon body offhand"
                    "ring1 belt ring2"
                    "gloves . boots"
                  `,
                  gridTemplateColumns: '1fr 1fr 1fr',
                }}
              >
                {EQUIPMENT_SLOTS.map(({ slot, icon }) => {
                  const item = player.equipment[slot];
                  return (
                    <div
                      key={slot}
                      onMouseEnter={(e) => {
                        if (!item) return;
                        setHoveredItem({ item, x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        if (!item) return;
                        setHoveredItem({ item, x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => {
                        setHoveredItem(current => (current?.item.id === item?.id ? null : current));
                      }}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-lg border-2 transition-all ${item
                        ? `${RARITY_COLORS[item.rarity]} bg-[#1a1a24] hover:brightness-110`
                        : 'bg-[#0a0a0f] border-dashed border-[#2a2a3a]'
                        }`}
                      style={{ gridArea: slot === 'bodyArmor' ? 'body' : slot }}
                      title={item ? `${item.name} (${item.rarity})` : slot}
                    >
                      {icon}
                      {item && (
                        <span className={`text-[8px] mt-0.5 truncate max-w-full px-0.5 ${item.rarity === 'magic' ? 'text-blue-400' :
                          item.rarity === 'rare' ? 'text-yellow-400' :
                            item.rarity === 'unique' ? 'text-orange-400' : 'text-gray-400'
                          }`}>
                          {item.name.split(' ').slice(-1)[0]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {hoveredItem && (
                <ItemTooltipPortal
                  item={hoveredItem.item}
                  position={{ x: hoveredItem.x, y: hoveredItem.y }}
                  label="Equipped"
                />
              )}
            </div>

            {/* Flasks */}
            <div className="bg-[#12121a] rounded-lg p-3 border border-[#2a2a3a]">
              <h3 className="text-sm font-bold text-[#c9a227] mb-2">🧪 Flasks</h3>
              <div className="flex gap-1.5">
                {player.flasks.map((flask, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-12 rounded-lg border-2 flex flex-col items-center justify-center relative overflow-hidden ${flask
                      ? flask.isActive
                        ? 'border-yellow-500 bg-yellow-900/30'
                        : flask.currentCharges > 0
                          ? 'border-gray-600 bg-[#1a1a24]'
                          : 'border-gray-800 bg-[#0a0a0f]'
                      : 'border-gray-800 bg-[#0a0a0f] border-dashed'
                      }`}
                  >
                    {flask ? (
                      <>
                        <div
                          className={`absolute bottom-0 left-0 right-0 transition-all ${flask.type === 'life' ? 'bg-red-600/40' :
                            flask.type === 'mana' ? 'bg-blue-600/40' :
                              'bg-purple-600/40'
                            }`}
                          style={{ height: `${(flask.currentCharges / flask.maxCharges) * 100}%` }}
                        />
                        <span className="text-sm relative z-10">🧪</span>
                        <span className={`text-[9px] relative z-10 ${flask.currentCharges === 0 ? 'text-gray-600' : 'text-gray-300'
                          }`}>
                          {flask.currentCharges}/{flask.maxCharges}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-600 text-[9px]">Empty</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <SkillBar />

            {/* Player Stats - compact version */}
            <PlayerStats />

          </div>

          {/* Center - Combat Arena + Log below */}
          <div className="lg:col-span-5 space-y-3">
            <CombatArena />
            <CombatLog />
          </div>

          {/* Right sidebar - Larger Inventory */}
          <div className="lg:col-span-4">
            <Inventory />
          </div>
        </div>
      </div>
    </div>
  );
}
