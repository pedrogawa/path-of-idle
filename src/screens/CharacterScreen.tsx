import { useGameStore } from '../stores/gameStore';
import { PlayerStats } from '../components/PlayerStats';
import { Inventory } from '../components/Inventory';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { computePlayerStats } from '../lib/combat';
import type { EquipmentSlot } from '../types';

// Bottom padding when combat mini panel is shown
const useCombatPadding = () => {
  const combatState = useGameStore(state => state.combatState);
  return combatState === 'fighting' ? 'pb-20' : '';
};

// Equipment slot layout
const SLOT_LAYOUT: { slot: EquipmentSlot; name: string; icon: string; gridArea: string }[] = [
  { slot: 'helmet', name: 'Helmet', icon: '🪖', gridArea: 'helmet' },
  { slot: 'amulet', name: 'Amulet', icon: '📿', gridArea: 'amulet' },
  { slot: 'weapon', name: 'Weapon', icon: '⚔️', gridArea: 'weapon' },
  { slot: 'bodyArmor', name: 'Body', icon: '🛡️', gridArea: 'body' },
  { slot: 'offhand', name: 'Offhand', icon: '🛡️', gridArea: 'offhand' },
  { slot: 'gloves', name: 'Gloves', icon: '🧤', gridArea: 'gloves' },
  { slot: 'belt', name: 'Belt', icon: '🎀', gridArea: 'belt' },
  { slot: 'boots', name: 'Boots', icon: '👢', gridArea: 'boots' },
  { slot: 'ring1', name: 'Ring L', icon: '💍', gridArea: 'ring1' },
  { slot: 'ring2', name: 'Ring R', icon: '💍', gridArea: 'ring2' },
];

const RARITY_COLORS = {
  normal: 'border-gray-600 bg-[#1a1a24]',
  magic: 'border-blue-500/50 bg-blue-950/30',
  rare: 'border-yellow-500/50 bg-yellow-950/30',
  unique: 'border-orange-500/50 bg-orange-950/30',
};

const RARITY_TEXT_COLORS = {
  normal: 'text-gray-300',
  magic: 'text-blue-400',
  rare: 'text-yellow-400',
  unique: 'text-orange-400',
};

export function CharacterScreen() {
  const navigateTo = useGameStore(state => state.navigateTo);
  const player = useGameStore(state => state.player);
  const unequipItem = useGameStore(state => state.unequipItem);
  const combatState = useGameStore(state => state.combatState);
  const combatPadding = useCombatPadding();

  const stats = computePlayerStats(player);
  const expPercent = player.experience > 0
    ? Math.min(100, (player.experience / player.experienceToNextLevel) * 100)
    : 0;

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] ${combatPadding}`}>
      {/* Header */}
      <div className="bg-[#0a0a0f]/80 border-b border-[#2a2a3a] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => navigateTo(combatState === 'fighting' ? 'combat' : 'town')}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors text-sm text-gray-300"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl">👤</span>
            <div>
              <h1 className="text-xl font-bold text-[#c9a227]">{player.name}</h1>
              <p className="text-xs text-gray-500">Level {player.level} Exile</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('worldMap')}
              className="px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors text-sm text-gray-300"
            >
              🗺️ World Map
            </button>
          </div>
        </div>
      </div>

      {/* Character content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Character & Equipment */}
          <div className="lg:col-span-1 space-y-4">
            {/* Character panel */}
            <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              {/* Level & XP */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-white">Level {player.level}</div>
                  <div className="text-xs text-gray-500">
                    {player.experience.toLocaleString()} / {player.experienceToNextLevel.toLocaleString()} XP
                  </div>
                </div>
                <div className="text-4xl">👤</div>
              </div>

              {/* XP bar */}
              <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden border border-[#2a2a3a] mb-4">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                  style={{ width: `${expPercent}%` }}
                />
              </div>

              {/* Resource bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400">❤️ Life</span>
                    <span className="text-gray-400">{Math.floor(player.currentLife)} / {stats.maxLife}</span>
                  </div>
                  <div className="h-3 bg-[#0a0a0f] rounded-full overflow-hidden border border-red-900/50">
                    <div
                      className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all"
                      style={{ width: `${(player.currentLife / stats.maxLife) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-400">💧 Mana</span>
                    <span className="text-gray-400">{Math.floor(player.currentMana)} / {stats.maxMana}</span>
                  </div>
                  <div className="h-3 bg-[#0a0a0f] rounded-full overflow-hidden border border-blue-900/50">
                    <div
                      className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all"
                      style={{ width: `${(player.currentMana / stats.maxMana) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment panel */}
            <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <h3 className="text-sm font-bold text-[#c9a227] mb-4">⚔️ Equipment</h3>

              {/* Equipment grid with visual layout */}
              <div
                className="grid gap-2"
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
                {SLOT_LAYOUT.map(({ slot, name, icon, gridArea }) => {
                  const item = player.equipment[slot];

                  return (
                    <button
                      key={slot}
                      onClick={() => item && unequipItem(slot)}
                      className={`
                        relative p-2 rounded-lg border-2 aspect-square flex flex-col items-center justify-center transition-all
                        ${item
                          ? `${RARITY_COLORS[item.rarity]} hover:brightness-110 cursor-pointer`
                          : 'border-dashed border-[#2a2a3a] bg-[#0a0a0f]'
                        }
                      `}
                      style={{ gridArea }}
                      title={item ? `${item.name} (click to unequip)` : name}
                    >
                      {item ? (
                        <>
                          <span className="text-xl">{icon}</span>
                          <span className={`text-[9px] mt-1 truncate w-full text-center ${RARITY_TEXT_COLORS[item.rarity]}`}>
                            {item.name.split(' ').slice(-1)[0]}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl opacity-30">{icon}</span>
                          <span className="text-[9px] text-gray-600 mt-1">{name}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-500 mt-3 text-center">
                Click equipped item to unequip
              </p>
            </div>
          </div>

          {/* Middle Column - Stats */}
          <div className="lg:col-span-1 space-y-4">
            <PlayerStats />
            <CurrencyDisplay />
          </div>

          {/* Right Column - Inventory */}
          <div className="lg:col-span-1">
            <Inventory />
          </div>
        </div>
      </div>
    </div>
  );
}
