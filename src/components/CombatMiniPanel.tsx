import { useGameStore } from '../stores/gameStore';
import { computePlayerStats } from '../lib/combat';
import { mapById } from '../data';

const RARITY_COLORS = {
  normal: '#9ca3af',
  magic: '#3b82f6',
  rare: '#eab308',
  unique: '#f97316',
  boss: '#ef4444',
};

export function CombatMiniPanel() {
  const combatState = useGameStore(state => state.combatState);
  const currentMapId = useGameStore(state => state.currentMapId);
  const currentScreen = useGameStore(state => state.currentScreen);
  const player = useGameStore(state => state.player);
  const monsters = useGameStore(state => state.monsters);
  const navigateTo = useGameStore(state => state.navigateTo);
  const stopFarming = useGameStore(state => state.stopFarming);
  const mapProgress = useGameStore(state => state.mapProgress);

  // Only show if combat is active and we're NOT on combat screen
  if (combatState !== 'fighting' || currentScreen === 'combat' || !currentMapId) {
    return null;
  }

  const stats = computePlayerStats(player);
  const map = mapById.get(currentMapId);
  const progress = mapProgress[currentMapId];

  // Get the targeted monster or first monster
  const targetMonster = monsters.find(m => m.currentLife > 0);
  const hpPercent = (player.currentLife / stats.maxLife) * 100;
  const monsterHpPercent = targetMonster ? (targetMonster.currentLife / targetMonster.maxLife) * 100 : 0;
  const expPercent = player.experience > 0
    ? Math.min(100, (player.experience / player.experienceToNextLevel) * 100)
    : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 border-t border-[#2a2a3a] backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Map & Progress */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚔️</span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#c9a227] truncate">{map?.name}</div>
                <div className="text-[10px] text-gray-500">
                  {progress?.killCount || 0}/{map?.killsRequired} kills • {monsters.length} active
                </div>
              </div>
            </div>
          </div>

          {/* Center - HP bars */}
          <div className="flex-1 flex items-center gap-4 max-w-md">
            {/* Player HP */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">You</span>
                <div className="flex-1 h-4 bg-[#1a1a24] rounded-full overflow-hidden border border-red-900/30 relative">
                  <div
                    className={`h-full transition-all duration-200 ${hpPercent < 30 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-red-700 to-red-500'
                      }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                    {Math.floor(player.currentLife)}/{stats.maxLife}
                  </span>
                </div>
              </div>
            </div>

            {/* VS */}
            <span className="text-gray-600 text-xs">vs</span>

            {/* Monster HP */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-4 bg-[#1a1a24] rounded-full overflow-hidden border border-gray-700/30 relative">
                  {targetMonster ? (
                    <>
                      <div
                        className="h-full transition-all duration-200"
                        style={{
                          width: `${monsterHpPercent}%`,
                          backgroundColor: RARITY_COLORS[targetMonster.rarity]
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow truncate px-1">
                        {targetMonster.name}
                      </span>
                    </>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">
                      Waiting...
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">Enemy</span>
              </div>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* XP mini bar */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Lv.{player.level}</span>
              <div className="w-16 h-2 bg-[#1a1a24] rounded-full overflow-hidden border border-purple-900/30">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => navigateTo('combat')}
              className="px-3 py-1.5 bg-[#c9a227] text-black font-bold text-sm rounded hover:bg-[#d4b03a] transition-colors"
            >
              ⚔️ Fight
            </button>
            <button
              onClick={stopFarming}
              className={`px-3 py-1.5 text-sm rounded font-medium transition-colors ${hpPercent < 30
                ? 'bg-red-600 text-white animate-pulse hover:bg-red-500'
                : 'bg-[#1a1a24] text-red-400 border border-red-900/50 hover:bg-red-900/30'
                }`}
            >
              🏃 Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
