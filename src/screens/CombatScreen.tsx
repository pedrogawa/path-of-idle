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

type HudPanel = 'inventory' | 'equipment' | 'stats' | 'skills' | 'log';

export function CombatScreen() {
  const navigateTo = useGameStore(state => state.navigateTo);
  const stopFarming = useGameStore(state => state.stopFarming);
  const player = useGameStore(state => state.player);
  const currentMapId = useGameStore(state => state.currentMapId);
  const monsters = useGameStore(state => state.monsters);
  const bossReady = useGameStore(state => state.bossReady);
  const isBossFight = useGameStore(state => state.isBossFight);
  const spawnTimer = useGameStore(state => state.spawnTimer);
  const combatState = useGameStore(state => state.combatState);
  const mapProgress = useGameStore(state => state.mapProgress);
  const startBossFight = useGameStore(state => state.startBossFight);
  const toggleAutoBossSpawn = useGameStore(state => state.toggleAutoBossSpawn);

  const stats = computePlayerStats(player);
  const map = currentMapId ? mapById.get(currentMapId) : null;
  const progress = currentMapId ? mapProgress[currentMapId] : null;
  const [activePanel, setActivePanel] = useState<HudPanel | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{ item: Item; x: number; y: number } | null>(null);
  const expPercent = player.experience > 0
    ? Math.min(100, (player.experience / player.experienceToNextLevel) * 100)
    : 0;
  const panelClass = 'bg-[#090e1a]/86 backdrop-blur-md rounded-lg border border-[#2a2f45] shadow-[0_12px_28px_rgba(0,0,0,0.45)]';
  const dockButtonClass = 'px-3 py-2 rounded-lg border text-sm transition-all bg-[#0b1120]/88 border-[#2a2f45] text-gray-200 hover:border-[#c9a227]/60 hover:text-[#e8ce78]';
  const panelWidthClass = activePanel === 'equipment' ? 'w-[min(96vw,430px)]' : 'w-[min(96vw,760px)]';

  const togglePanel = (panel: HudPanel) => {
    setActivePanel(current => (current === panel ? null : panel));
    if (panel !== 'equipment') {
      setHoveredItem(null);
    }
  };

  return (
    <div className="h-screen relative overflow-hidden bg-[#060b13]">
      <CombatArena
        fullScreen
        showOverlayBars={false}
        className="absolute inset-0 z-0"
      />

      {/* Readability vignettes */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#05070d]/80 via-transparent to-[#05070d]/80" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-[#05070d]/65 via-transparent to-[#05070d]/75" />

      {/* Header */}
      <div className="absolute inset-x-0 top-0 z-30 bg-[#0a0a0f]/78 border-b border-[#2a2a3a] backdrop-blur-md">
        <div className="px-4 py-2 flex justify-between items-center gap-3">
          {/* Left - Map info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={stopFarming}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 rounded-lg border border-red-700/50 hover:bg-red-900/50 transition-colors text-sm text-red-300"
            >
              🏃 Leave
            </button>

            {map && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[#c9a227] truncate">{map.name}</h1>
                <p className="text-xs text-gray-400">
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

            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span>
                Monsters: <span className="text-white">{monsters.length}</span>
              </span>
              {!isBossFight && !bossReady && (
                <span>
                  Next: <span className="text-green-400">{spawnTimer.toFixed(1)}s</span>
                </span>
              )}
              {combatState === 'fighting' && !bossReady && (
                <span className="text-green-400">Fighting</span>
              )}
              {isBossFight && (
                <span className="text-red-400 font-semibold">Boss Fight</span>
              )}
              {bossReady && !isBossFight && (
                <button
                  onClick={startBossFight}
                  className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-red-800 text-white text-[10px] font-bold rounded
                            hover:from-red-500 hover:to-red-700 transition-all border border-red-500/50"
                >
                  👹 Challenge Boss
                </button>
              )}
              {progress && progress.timesCleared > 0 && !isBossFight && (
                <button
                  onClick={toggleAutoBossSpawn}
                  title={progress.autoBossSpawn ? 'Boss auto-spawns after kills' : 'Enable auto boss spawn'}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-all ${progress.autoBossSpawn
                    ? 'bg-green-900/50 text-green-400 border-green-700/50'
                    : 'bg-gray-800/60 text-gray-500 border-gray-600/50 hover:border-gray-500'
                    }`}
                >
                  {progress.autoBossSpawn ? '🔄 Auto' : '🔄'}
                </button>
              )}
            </div>
          </div>

          {/* Right - Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
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

      {/* Floating panel (opened by bottom dock) */}
      {activePanel && (
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-24 z-30 ${panelWidthClass} pointer-events-none`}>
          <div className={`${panelClass} p-3 pointer-events-auto`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[#c9a227] uppercase tracking-wide">
                {activePanel === 'inventory' && 'Inventory'}
                {activePanel === 'equipment' && 'Equipment'}
                {activePanel === 'stats' && 'Character Stats'}
                {activePanel === 'skills' && 'Skills'}
                {activePanel === 'log' && 'Combat Log'}
              </h3>
              <button
                onClick={() => {
                  setActivePanel(null);
                  setHoveredItem(null);
                }}
                className="px-2 py-1 rounded border border-[#2a2f45] text-xs text-gray-400 hover:text-white hover:border-[#c9a227]/60"
              >
                Close
              </button>
            </div>

            <div className={activePanel === 'equipment' || activePanel === 'inventory' ? '' : 'max-h-[56vh] overflow-y-auto pr-1'}>
              {activePanel === 'inventory' && <Inventory compact />}
              {activePanel === 'stats' && <PlayerStats />}
              {activePanel === 'skills' && <SkillBar />}
              {activePanel === 'log' && <CombatLog />}
              {activePanel === 'equipment' && (
                <div className="bg-[#12121a] rounded-lg p-3 border border-[#2a2a3a]">
                  <div
                    className="grid gap-2 justify-center"
                    style={{
                      gridTemplateAreas: `
                        ". helmet amulet"
                        "weapon body offhand"
                        "ring1 belt ring2"
                        "gloves . boots"
                      `,
                      gridTemplateColumns: '76px 76px 76px',
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
                          className={`w-[76px] h-[76px] rounded-lg flex flex-col items-center justify-center text-base border-2 transition-all ${item
                            ? `${RARITY_COLORS[item.rarity]} bg-[#1a1a24] hover:brightness-110`
                            : 'bg-[#0a0a0f] border-dashed border-[#2a2a3a]'
                            }`}
                          style={{ gridArea: slot === 'bodyArmor' ? 'body' : slot }}
                          title={item ? `${item.name} (${item.rarity})` : slot}
                        >
                          {icon}
                          {item && (
                            <span className={`text-[7px] mt-0.5 truncate max-w-full px-0.5 ${item.rarity === 'magic' ? 'text-blue-400' :
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Always-visible flask bar */}
      <div className="absolute left-4 bottom-4 z-30 pointer-events-none">
        <div className={`${panelClass} p-2 w-[260px] pointer-events-auto`}>
          <div className="text-[11px] font-semibold text-[#c9a227] mb-1">Flasks</div>
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
      </div>

      {/* Bottom action dock */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-30 pointer-events-none">
        <div className={`${panelClass} p-2 flex items-center gap-2 pointer-events-auto`}>
          <button onClick={() => togglePanel('equipment')} className={`${dockButtonClass} ${activePanel === 'equipment' ? 'border-[#c9a227] text-[#e8ce78]' : ''}`}>🛡️ Gear</button>
          <button onClick={() => togglePanel('inventory')} className={`${dockButtonClass} ${activePanel === 'inventory' ? 'border-[#c9a227] text-[#e8ce78]' : ''}`}>🎒 Bag</button>
          <button onClick={() => togglePanel('stats')} className={`${dockButtonClass} ${activePanel === 'stats' ? 'border-[#c9a227] text-[#e8ce78]' : ''}`}>📊 Stats</button>
          <button onClick={() => togglePanel('skills')} className={`${dockButtonClass} ${activePanel === 'skills' ? 'border-[#c9a227] text-[#e8ce78]' : ''}`}>⚡ Skills</button>
          <button onClick={() => togglePanel('log')} className={`${dockButtonClass} ${activePanel === 'log' ? 'border-[#c9a227] text-[#e8ce78]' : ''}`}>📜 Log</button>
        </div>
      </div>
    </div>
  );
}
