import { useGameStore } from '../stores/gameStore';
import { maps } from '../data';

export function MapSelector() {
  const unlockedMapIds = useGameStore(state => state.unlockedMapIds);
  const currentMapId = useGameStore(state => state.currentMapId);
  const mapProgress = useGameStore(state => state.mapProgress);
  const selectMap = useGameStore(state => state.selectMap);
  const stopFarming = useGameStore(state => state.stopFarming);

  const world1Maps = maps.filter(m => m.worldId === 1);

  return (
    <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
      <h2 className="text-lg font-bold text-[#c9a227] mb-3 flex items-center gap-2">
        <span className="text-2xl">🗺️</span>
        World 1: The Corrupted Shores
      </h2>

      <div className="grid gap-2">
        {world1Maps.map(map => {
          const isUnlocked = unlockedMapIds.includes(map.id);
          const isActive = currentMapId === map.id;
          const progress = mapProgress[map.id];

          return (
            <button
              key={map.id}
              onClick={() => isUnlocked && !isActive && selectMap(map.id)}
              disabled={!isUnlocked || isActive}
              className={`
                relative p-3 rounded-lg text-left transition-all
                ${isActive
                  ? 'bg-[#c9a227]/20 border-2 border-[#c9a227] shadow-lg shadow-[#c9a227]/20'
                  : isUnlocked
                    ? 'bg-[#1a1a24] border border-[#2a2a3a] hover:border-[#c9a227]/50 hover:bg-[#1f1f2a] cursor-pointer'
                    : 'bg-[#0a0a0f] border border-[#1a1a24] opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-60">#{map.order}</span>
                    <span className={`font-medium ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                      {isUnlocked ? map.name : '???'}
                    </span>
                    {isActive && (
                      <span className="text-xs bg-[#c9a227] text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {isUnlocked ? (
                      <>Monster Lv.{map.monsterLevel} • {map.killsRequired} kills to boss</>
                    ) : (
                      <>Defeat the previous boss to unlock</>
                    )}
                  </div>
                </div>

                {isUnlocked && progress && (
                  <div className="text-right text-xs">
                    <div className="text-gray-400">
                      {progress.killCount}/{map.killsRequired}
                    </div>
                    {progress.timesCleared > 0 && (
                      <div className="text-[#c9a227]">
                        ✓ Cleared {progress.timesCleared}x
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {isUnlocked && progress && (
                <div className="mt-2 h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#c9a227] to-[#f0d060] transition-all duration-300"
                    style={{ width: `${Math.min(100, (progress.killCount / map.killsRequired) * 100)}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {currentMapId && (
        <button
          onClick={stopFarming}
          className="mt-4 w-full py-2 px-4 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-lg border border-red-700/50 transition-colors"
        >
          ← Return to Town
        </button>
      )}
    </div>
  );
}
