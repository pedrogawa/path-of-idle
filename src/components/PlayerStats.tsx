import { useGameStore } from '../stores/gameStore';
import { computePlayerStats } from '../lib/combat';

export function PlayerStats() {
  const player = useGameStore(state => state.player);
  const stats = computePlayerStats(player);

  const expPercent = (player.experience / player.experienceToNextLevel) * 100;
  const hpPercent = (player.currentLife / stats.maxLife) * 100;
  const manaPercent = (player.currentMana / stats.maxMana) * 100;

  return (
    <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
      <h2 className="text-lg font-bold text-[#c9a227] mb-3 flex items-center gap-2">
        <span className="text-2xl">👤</span>
        {player.name}
        <span className="text-sm text-gray-500 font-normal ml-auto">Lv. {player.level}</span>
      </h2>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-400 font-medium">❤️ Life</span>
          <span className="text-gray-400">{Math.floor(player.currentLife)} / {Math.floor(stats.maxLife)}</span>
        </div>
        <div className="h-3 bg-[#0a0a0f] rounded-full overflow-hidden border border-red-900/50">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-150"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Mana Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-blue-400 font-medium">💧 Mana</span>
          <span className="text-gray-400">{Math.floor(player.currentMana)} / {Math.floor(stats.maxMana)}</span>
        </div>
        <div className="h-3 bg-[#0a0a0f] rounded-full overflow-hidden border border-blue-900/50">
          <div
            className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-150"
            style={{ width: `${manaPercent}%` }}
          />
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-purple-400 font-medium">✨ Experience</span>
          <span className="text-gray-400">{player.experience} / {player.experienceToNextLevel}</span>
        </div>
        <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden border border-purple-900/50">
          <div
            className="h-full bg-gradient-to-r from-purple-700 to-purple-500 transition-all duration-300"
            style={{ width: `${expPercent}%` }}
          />
        </div>
      </div>

      {/* Flask Bar */}
      <div className="mb-4">
        <div className="text-[#c9a227] text-xs font-semibold uppercase tracking-wide mb-2">Flasks</div>
        <div className="flex gap-2">
          {player.flasks.map((flask, index) => (
            <div
              key={index}
              className={`flex-1 h-10 rounded border-2 flex flex-col items-center justify-center relative overflow-hidden ${flask
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
                  {/* Flask fill indicator */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${flask.type === 'life' ? 'bg-red-600/40' :
                      flask.type === 'mana' ? 'bg-blue-600/40' :
                        'bg-purple-600/40'
                      }`}
                    style={{ height: `${(flask.currentCharges / flask.maxCharges) * 100}%` }}
                  />
                  {/* Flask icon */}
                  <span className="text-lg relative z-10">
                    {flask.type === 'life' ? '🧪' : flask.type === 'mana' ? '🧪' : '🧪'}
                  </span>
                  {/* Charges */}
                  <span className={`text-[10px] relative z-10 ${flask.currentCharges === 0 ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                    {flask.currentCharges}/{flask.maxCharges}
                  </span>
                  {/* Active indicator */}
                  {flask.isActive && (
                    <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />
                  )}
                </>
              ) : (
                <span className="text-gray-600 text-xs">Empty</span>
              )}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-500 mt-1 text-center">
          Auto-use at 50% HP/Mana • Refills on kills
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {/* Attributes */}
        <div className="col-span-2 text-[#c9a227] text-xs font-semibold uppercase tracking-wide mt-1 mb-1 border-b border-[#2a2a3a] pb-1">
          Attributes
        </div>

        <div className="flex justify-between">
          <span className="text-red-400">💪 Strength</span>
          <span className="text-white">{Math.floor(stats.strength)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-400">🏃 Dexterity</span>
          <span className="text-white">{Math.floor(stats.dexterity)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-400">🧠 Intelligence</span>
          <span className="text-white">{Math.floor(stats.intelligence)}</span>
        </div>
        <div className="col-span-1" /> {/* Spacer */}

        {/* Offensive */}
        <div className="col-span-2 text-[#c9a227] text-xs font-semibold uppercase tracking-wide mt-2 mb-1 border-b border-[#2a2a3a] pb-1">
          Offense
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">DPS</span>
          <span className="text-green-400 font-medium">{stats.dps.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Atk Speed</span>
          <span className="text-white">{stats.attackSpeed.toFixed(2)}/s</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">⚔️ Physical</span>
          <span className={stats.physicalDamageMax > 0 ? 'text-white' : 'text-gray-600'}>{Math.floor(stats.physicalDamageMin)}-{Math.floor(stats.physicalDamageMax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Accuracy</span>
          <span className="text-white">{Math.floor(stats.accuracy)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">🔥 Fire</span>
          <span className={stats.fireDamageMax > 0 ? 'text-orange-400' : 'text-gray-600'}>{Math.floor(stats.fireDamageMin)}-{Math.floor(stats.fireDamageMax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Crit Chance</span>
          <span className="text-yellow-400">{stats.criticalChance.toFixed(0)}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">❄️ Cold</span>
          <span className={stats.coldDamageMax > 0 ? 'text-cyan-400' : 'text-gray-600'}>{Math.floor(stats.coldDamageMin)}-{Math.floor(stats.coldDamageMax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Crit Multi</span>
          <span className="text-yellow-400">{stats.criticalMultiplier}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">⚡ Lightning</span>
          <span className={stats.lightningDamageMax > 0 ? 'text-yellow-300' : 'text-gray-600'}>{Math.floor(stats.lightningDamageMin)}-{Math.floor(stats.lightningDamageMax)}</span>
        </div>
        <div className="col-span-1" /> {/* Spacer */}

        {/* Increased damage modifiers - only show if > 0 */}
        {stats.increasedPhysicalDamage > 0 && (
          <div className="flex justify-between col-span-2 text-[10px]">
            <span className="text-gray-500">+{stats.increasedPhysicalDamage.toFixed(0)}% Physical Damage</span>
          </div>
        )}
        {stats.increasedFireDamage > 0 && (
          <div className="flex justify-between col-span-2 text-[10px]">
            <span className="text-orange-400/70">+{stats.increasedFireDamage.toFixed(0)}% Fire Damage</span>
          </div>
        )}
        {stats.increasedColdDamage > 0 && (
          <div className="flex justify-between col-span-2 text-[10px]">
            <span className="text-cyan-400/70">+{stats.increasedColdDamage.toFixed(0)}% Cold Damage</span>
          </div>
        )}
        {stats.increasedLightningDamage > 0 && (
          <div className="flex justify-between col-span-2 text-[10px]">
            <span className="text-yellow-300/70">+{stats.increasedLightningDamage.toFixed(0)}% Lightning Damage</span>
          </div>
        )}
        {stats.increasedAttackSpeed > 0 && (
          <div className="flex justify-between col-span-2 text-[10px]">
            <span className="text-gray-500">+{stats.increasedAttackSpeed.toFixed(1)}% Attack Speed</span>
          </div>
        )}

        {/* Defensive */}
        <div className="col-span-2 text-[#c9a227] text-xs font-semibold uppercase tracking-wide mt-2 mb-1 border-b border-[#2a2a3a] pb-1">
          Defense
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Armor</span>
          <span className="text-white">{stats.armor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Evasion</span>
          <span className="text-green-300">{stats.evasion}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Block</span>
          <span className={stats.blockChance > 0 ? 'text-blue-300' : 'text-gray-600'}>{stats.blockChance}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Life Regen</span>
          <span className="text-red-300">{stats.lifeRegeneration.toFixed(1)}/s</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">🔥 Fire Res</span>
          <span className={stats.fireResistance >= 75 ? 'text-green-400' : stats.fireResistance > 0 ? 'text-orange-400' : 'text-gray-600'}>
            {stats.fireResistance}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Mana Regen</span>
          <span className="text-blue-300">{stats.manaRegeneration.toFixed(1)}/s</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">❄️ Cold Res</span>
          <span className={stats.coldResistance >= 75 ? 'text-green-400' : stats.coldResistance > 0 ? 'text-cyan-400' : 'text-gray-600'}>
            {stats.coldResistance}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">⚡ Light Res</span>
          <span className={stats.lightningResistance >= 75 ? 'text-green-400' : stats.lightningResistance > 0 ? 'text-yellow-300' : 'text-gray-600'}>
            {stats.lightningResistance}%
          </span>
        </div>
      </div>
    </div>
  );
}
