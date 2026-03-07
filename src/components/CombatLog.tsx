import { useGameStore } from '../stores/gameStore';
import type { CombatLogEntry } from '../types';

const TYPE_COLORS: Record<CombatLogEntry['type'], string> = {
  playerHit: 'text-gray-400',
  monsterHit: 'text-red-400',
  playerCrit: 'text-yellow-400',
  monsterDeath: 'text-green-400',
  playerDeath: 'text-red-500',
  loot: 'text-blue-400',
  levelUp: 'text-purple-400',
  evade: 'text-green-300',
  block: 'text-blue-300',
  skillUse: 'text-indigo-300',
};

const TYPE_ICONS: Record<CombatLogEntry['type'], string> = {
  playerHit: '⚔️',
  monsterHit: '💥',
  playerCrit: '💫',
  monsterDeath: '💀',
  playerDeath: '☠️',
  loot: '🎁',
  levelUp: '⬆️',
  evade: '🌀',
  block: '🛡️',
  skillUse: '✨',
};

export function CombatLog() {
  const combatLog = useGameStore(state => state.combatLog);
  const clearLog = useGameStore(state => state.clearLog);

  return (
    <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-[#c9a227] flex items-center gap-2">
          <span className="text-2xl">📜</span>
          Combat Log
        </h2>
        <button
          onClick={clearLog}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Clear
        </button>
      </div>

      <div className="h-40 overflow-y-auto space-y-1 text-xs font-mono">
        {combatLog.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No recent events
          </div>
        ) : (
          combatLog.map(entry => (
            <div
              key={entry.id}
              className={`flex items-start gap-2 ${TYPE_COLORS[entry.type]}`}
            >
              <span>{TYPE_ICONS[entry.type]}</span>
              <span className="flex-1">{entry.message}</span>
              {entry.value !== undefined && (
                <span className="text-gray-500">[{entry.value}]</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
