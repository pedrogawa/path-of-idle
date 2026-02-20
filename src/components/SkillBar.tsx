import { useGameStore } from '../stores/gameStore';
import { skillById } from '../data';
import { computePlayerStats } from '../lib/combat';

export function SkillBar() {
  const player = useGameStore(state => state.player);
  const combatState = useGameStore(state => state.combatState);
  const stats = computePlayerStats(player);

  const isInCombat = combatState === 'fighting';

  return (
    <div className="bg-[#12121a] rounded-lg p-3 border border-[#2a2a3a]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#c9a227] uppercase tracking-wide">Skills</h3>
        <span className="text-xs text-gray-500">
          Mana: <span className="text-blue-400">{Math.floor(player.currentMana)}</span>/{Math.floor(stats.maxMana)}
        </span>
      </div>

      <div className="flex gap-2">
        {player.skills.map((skill, index) => {
          if (!skill) {
            return (
              <div
                key={index}
                className="w-12 h-12 rounded border-2 border-dashed border-gray-700 bg-[#0a0a0f] flex items-center justify-center"
              >
                <span className="text-gray-600 text-xs">{index + 1}</span>
              </div>
            );
          }

          const skillDef = skillById.get(skill.definitionId);
          if (!skillDef) return null;

          const isOnCooldown = skill.currentCooldown > 0;
          const hasEnoughMana = player.currentMana >= skillDef.manaCost;
          const isReady = !isOnCooldown && hasEnoughMana && isInCombat;
          const cooldownPercent = isOnCooldown
            ? (skill.currentCooldown / skillDef.cooldown) * 100
            : 0;

          return (
            <div
              key={index}
              className={`relative w-12 h-12 rounded border-2 flex flex-col items-center justify-center cursor-default transition-all
                ${skill.isActive
                  ? isReady
                    ? 'border-green-500 bg-green-900/30 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                    : isOnCooldown
                      ? 'border-yellow-600 bg-yellow-900/20'
                      : !hasEnoughMana
                        ? 'border-blue-800 bg-blue-900/20'
                        : 'border-gray-600 bg-[#1a1a24]'
                  : 'border-gray-700 bg-[#0a0a0f] opacity-50'
                }`}
              title={`${skillDef.name}\n${skillDef.description}\nMana: ${skillDef.manaCost}\nCooldown: ${skillDef.cooldown}s`}
            >
              {/* Cooldown overlay */}
              {isOnCooldown && (
                <div
                  className="absolute inset-0 bg-black/60 transition-all"
                  style={{
                    clipPath: `inset(${100 - cooldownPercent}% 0 0 0)`
                  }}
                />
              )}

              {/* Skill icon */}
              <span className="text-xl relative z-10">{skillDef.icon}</span>

              {/* Cooldown timer */}
              {isOnCooldown && (
                <span className="absolute bottom-0.5 text-[10px] font-bold text-yellow-400 z-10">
                  {skill.currentCooldown.toFixed(1)}
                </span>
              )}

              {/* Mana cost indicator */}
              {!isOnCooldown && !hasEnoughMana && (
                <span className="absolute bottom-0.5 text-[10px] font-bold text-blue-400 z-10">
                  {skillDef.manaCost}
                </span>
              )}

              {/* Hotkey */}
              <span className="absolute top-0.5 right-1 text-[9px] text-gray-500 z-10">{index + 1}</span>
            </div>
          );
        })}
      </div>

      {/* Skill tooltip info */}
      <div className="mt-2 text-[10px] text-gray-500 text-center">
        Skills auto-use when ready • Priority: AOE → Highest Damage
      </div>
    </div>
  );
}
