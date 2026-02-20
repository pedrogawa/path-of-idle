import { useGameStore } from '../stores/gameStore';

// Bottom padding when combat mini panel is shown
const useCombatPadding = () => {
  const combatState = useGameStore(state => state.combatState);
  return combatState === 'fighting' ? 'pb-20' : '';
};

// Vendor data
const VENDORS = [
  {
    id: 'mapDevice',
    name: 'Map Device',
    icon: '🗺️',
    description: 'Travel to different zones',
    action: 'worldMap' as const,
    available: true,
  },
  {
    id: 'weaponsmith',
    name: 'Weaponsmith',
    icon: '⚔️',
    description: 'Buy and sell weapons',
    action: null,
    available: false,
  },
  {
    id: 'armorsmith',
    name: 'Armorsmith',
    icon: '🛡️',
    description: 'Buy and sell armor',
    action: null,
    available: false,
  },
  {
    id: 'jeweler',
    name: 'Jeweler',
    icon: '💍',
    description: 'Buy and sell rings',
    action: null,
    available: false,
  },
  {
    id: 'craftingBench',
    name: 'Crafting Bench',
    icon: '🔨',
    description: 'Craft and modify items',
    action: null,
    available: false,
  },
  {
    id: 'skillTrainer',
    name: 'Skill Trainer',
    icon: '📚',
    description: 'Learn and upgrade skills',
    action: null,
    available: false,
  },
  {
    id: 'stash',
    name: 'Stash',
    icon: '📦',
    description: 'Store your items',
    action: null,
    available: false,
  },
];

export function TownScreen() {
  const navigateTo = useGameStore(state => state.navigateTo);
  const player = useGameStore(state => state.player);
  const combatPadding = useCombatPadding();

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] ${combatPadding}`}>
      {/* Header */}
      <div className="bg-[#0a0a0f]/80 border-b border-[#2a2a3a] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            <div>
              <h1 className="text-xl font-bold text-[#c9a227]">Lioneye's Watch</h1>
              <p className="text-xs text-gray-500">Act 1 Town</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-gray-400">Level </span>
              <span className="text-white font-bold">{player.level}</span>
            </div>
            <button
              onClick={() => navigateTo('character')}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors"
            >
              <span>👤</span>
              <span className="text-sm text-gray-300">{player.name}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Town content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome message */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome, Exile</h2>
          <p className="text-gray-400">What would you like to do?</p>
        </div>

        {/* Vendor grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {VENDORS.map(vendor => (
            <button
              key={vendor.id}
              onClick={() => vendor.action && navigateTo(vendor.action)}
              disabled={!vendor.available}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200 text-left
                ${vendor.available
                  ? 'bg-[#12121a] border-[#2a2a3a] hover:border-[#c9a227] hover:bg-[#1a1a24] hover:shadow-lg hover:shadow-[#c9a227]/10 cursor-pointer group'
                  : 'bg-[#0a0a0f] border-[#1a1a24] opacity-50 cursor-not-allowed'
                }
              `}
            >
              {/* Icon */}
              <div className={`text-5xl mb-4 transition-transform ${vendor.available ? 'group-hover:scale-110' : ''}`}>
                {vendor.icon}
              </div>

              {/* Name */}
              <h3 className={`font-bold text-lg mb-1 ${vendor.available ? 'text-white' : 'text-gray-500'}`}>
                {vendor.name}
              </h3>

              {/* Description */}
              <p className={`text-sm ${vendor.available ? 'text-gray-400' : 'text-gray-600'}`}>
                {vendor.description}
              </p>

              {/* Coming soon badge */}
              {!vendor.available && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-500 uppercase tracking-wider">
                  Soon
                </div>
              )}

              {/* Glow effect on hover */}
              {vendor.available && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-[#c9a227]/10 to-transparent" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={() => navigateTo('worldMap')}
            className="px-6 py-3 bg-gradient-to-r from-[#c9a227] to-[#f0d060] text-black font-bold rounded-lg hover:from-[#d4b03a] hover:to-[#f5d870] transition-all shadow-lg shadow-[#c9a227]/20"
          >
            🗺️ Enter World Map
          </button>
          <button
            onClick={() => navigateTo('character')}
            className="px-6 py-3 bg-[#1a1a24] border border-[#2a2a3a] text-white font-medium rounded-lg hover:border-[#c9a227]/50 transition-all"
          >
            👤 Character
          </button>
        </div>
      </div>
    </div>
  );
}
