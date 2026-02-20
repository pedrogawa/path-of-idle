import { useGameStore } from '../stores/gameStore';
import { maps, bossById } from '../data';

// Bottom padding when combat mini panel is shown
const useCombatPadding = () => {
  const combatState = useGameStore(state => state.combatState);
  return combatState === 'fighting' ? 'pb-20' : '';
};

export function WorldMapScreen() {
  const navigateTo = useGameStore(state => state.navigateTo);
  const selectMap = useGameStore(state => state.selectMap);
  const unlockedMapIds = useGameStore(state => state.unlockedMapIds);
  const mapProgress = useGameStore(state => state.mapProgress);
  const combatPadding = useCombatPadding();

  const world1Maps = maps.filter(m => m.worldId === 1);

  const handleMapSelect = (mapId: string) => {
    if (unlockedMapIds.includes(mapId)) {
      selectMap(mapId);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] ${combatPadding}`}>
      {/* Header */}
      <div className="bg-[#0a0a0f]/80 border-b border-[#2a2a3a] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => navigateTo('town')}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors text-sm text-gray-300"
          >
            ← Back to Town
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <h1 className="text-xl font-bold text-[#c9a227]">World Map</h1>
              <p className="text-xs text-gray-500">Select a zone to explore</p>
            </div>
          </div>

          <div className="w-32" /> {/* Spacer */}
        </div>
      </div>

      {/* World content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Act header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a24] rounded-full border border-[#2a2a3a] mb-4">
            <span className="text-2xl">🌊</span>
            <span className="text-lg font-bold text-white">Act 1</span>
          </div>
          <h2 className="text-3xl font-bold text-[#c9a227] mb-2">The Corrupted Shores</h2>
          <p className="text-gray-400">A cursed coastline teeming with the drowned dead</p>
        </div>

        {/* Map path visualization */}
        <div className="relative">
          {/* Connection lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {world1Maps.slice(0, -1).map((_, index) => {
              const isUnlocked = unlockedMapIds.includes(world1Maps[index + 1]?.id);
              return (
                <line
                  key={index}
                  x1={`${10 + (index % 5) * 20}%`}
                  y1={`${Math.floor(index / 5) * 50 + 25}%`}
                  x2={`${10 + ((index + 1) % 5) * 20}%`}
                  y2={`${Math.floor((index + 1) / 5) * 50 + 25}%`}
                  stroke={isUnlocked ? '#c9a227' : '#2a2a3a'}
                  strokeWidth="2"
                  strokeDasharray={isUnlocked ? '0' : '5,5'}
                />
              );
            })}
          </svg>

          {/* Map nodes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 relative z-10">
            {world1Maps.map((map, index) => {
              const isUnlocked = unlockedMapIds.includes(map.id);
              const progress = mapProgress[map.id];
              const boss = bossById.get(map.bossId);
              const progressPercent = progress
                ? Math.min(100, (progress.killCount / map.killsRequired) * 100)
                : 0;
              const isCleared = progress?.bossDefeated;
              const isLast = index === world1Maps.length - 1;

              return (
                <button
                  key={map.id}
                  onClick={() => handleMapSelect(map.id)}
                  disabled={!isUnlocked}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-300 text-left
                    ${isUnlocked
                      ? isCleared
                        ? 'bg-[#1a2a1a] border-green-700/50 hover:border-green-500'
                        : 'bg-[#12121a] border-[#2a2a3a] hover:border-[#c9a227] hover:bg-[#1a1a24] cursor-pointer'
                      : 'bg-[#0a0a0f] border-[#1a1a24] opacity-60 cursor-not-allowed'
                    }
                    ${isLast ? 'ring-2 ring-red-500/30' : ''}
                  `}
                >
                  {/* Map number badge */}
                  <div className={`
                    absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isCleared
                      ? 'bg-green-600 text-white'
                      : isUnlocked
                        ? 'bg-[#c9a227] text-black'
                        : 'bg-[#2a2a3a] text-gray-500'
                    }
                  `}>
                    {isCleared ? '✓' : index + 1}
                  </div>

                  {/* Boss indicator */}
                  {isLast && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white uppercase">
                      World Boss
                    </div>
                  )}

                  {/* Map icon */}
                  <div className="text-3xl mb-2">
                    {isCleared ? '🏆' : isUnlocked ? '⚔️' : '🔒'}
                  </div>

                  {/* Map name */}
                  <h3 className={`font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                    {isUnlocked ? map.name : '???'}
                  </h3>

                  {/* Level & kills */}
                  <div className="text-xs text-gray-400 mb-2">
                    {isUnlocked ? (
                      <>
                        Lv.{map.monsterLevel} • {map.killsRequired} kills to boss
                      </>
                    ) : (
                      'Defeat the previous boss'
                    )}
                  </div>

                  {/* Progress bar */}
                  {isUnlocked && (
                    <div className="mb-2">
                      <div className="h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isCleared
                            ? 'bg-green-500'
                            : 'bg-gradient-to-r from-[#c9a227] to-[#f0d060]'
                            }`}
                          style={{ width: `${isCleared ? 100 : progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>{progress?.killCount || 0}/{map.killsRequired}</span>
                        {progress?.timesCleared ? (
                          <span className="text-green-400">Cleared ×{progress.timesCleared}</span>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Boss preview */}
                  {isUnlocked && boss && (
                    <div className={`
                      flex items-center gap-2 p-2 rounded-lg mt-2
                      ${isCleared ? 'bg-green-900/30' : 'bg-[#0a0a0f]'}
                    `}>
                      <span className="text-lg">{isLast ? '👹' : '💀'}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${isCleared ? 'text-green-400' : 'text-red-400'}`}>
                          {boss.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {boss.title}
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Future acts teaser */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Act 2: The Burning Highlands', icon: '🔥', levels: '37-60' },
            { name: 'Act 3: The Frozen Wastes', icon: '❄️', levels: '61-80' },
            { name: 'Act 4: The Void Realm', icon: '🌀', levels: '81-100' },
          ].map((act, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#0a0a0f] border border-[#1a1a24] opacity-40"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl grayscale">{act.icon}</span>
                <div>
                  <div className="text-sm font-bold text-gray-500">{act.name}</div>
                  <div className="text-xs text-gray-600">Levels {act.levels} • Coming Soon</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
