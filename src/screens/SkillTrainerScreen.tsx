import { useMemo, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getBuyableSkills, getSkillPurchaseCost, supportGems, supportGemById, skillById } from '../data';
import { canGemLevelUp, getGemNextLevelTotalExperience } from '../lib/gems';
import { estimateSkillDamageRange, getSkillRuntimeStats } from '../lib/skills';

// Bottom padding when combat mini panel is shown
const useCombatPadding = () => {
  const combatState = useGameStore(state => state.combatState);
  return combatState === 'fighting' ? 'pb-20' : '';
};

export function SkillTrainerScreen() {
  const navigateTo = useGameStore(state => state.navigateTo);
  const player = useGameStore(state => state.player);
  const buySkill = useGameStore(state => state.buySkill);
  const removeEquippedSkill = useGameStore(state => state.removeEquippedSkill);
  const equipInactiveSkill = useGameStore(state => state.equipInactiveSkill);
  const moveSkillSlot = useGameStore(state => state.moveSkillSlot);
  const levelUpSkillGem = useGameStore(state => state.levelUpSkillGem);
  const levelUpInactiveSkillGem = useGameStore(state => state.levelUpInactiveSkillGem);
  const levelUpSupportGem = useGameStore(state => state.levelUpSupportGem);
  const buySupportGem = useGameStore(state => state.buySupportGem);
  const addSkillSocket = useGameStore(state => state.addSkillSocket);
  const toggleSupportGemSocket = useGameStore(state => state.toggleSupportGemSocket);
  const combatState = useGameStore(state => state.combatState);
  const combatPadding = useCombatPadding();
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const ownedSkillIds = useMemo(() => {
    const ids = new Set(player.skills.filter(Boolean).map(skill => skill!.definitionId));
    for (const skill of player.inactiveSkills) {
      ids.add(skill.definitionId);
    }
    return ids;
  }, [player.skills, player.inactiveSkills]);

  const availableSkillsToBuy = useMemo(() => {
    return getBuyableSkills(player.level).filter(skill => !ownedSkillIds.has(skill.id));
  }, [player.level, ownedSkillIds]);

  const supportInstanceById = useMemo(() => {
    return new Map(player.supportGems.map(gem => [gem.instanceId, gem]));
  }, [player.supportGems]);

  const socketedSupportInstanceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const skill of player.skills) {
      if (!skill) continue;
      skill.socketedSupportIds.forEach(id => ids.add(id));
    }
    for (const skill of player.inactiveSkills) {
      skill.socketedSupportIds.forEach(id => ids.add(id));
    }
    return ids;
  }, [player.skills, player.inactiveSkills]);

  const getAvailableSupportCopies = (supportDefinitionId: string) => {
    return player.supportGems.filter(gem =>
      gem.definitionId === supportDefinitionId && !socketedSupportInstanceIds.has(gem.instanceId)
    ).length;
  };

  const getSupportInstancesForDefinition = (supportDefinitionId: string) => {
    return player.supportGems.filter(gem => gem.definitionId === supportDefinitionId);
  };
  const hasEmptySkillSlot = player.skills.some(skill => skill === null);

  const handleSkillDrop = (targetSlotIndex: number) => {
    if (draggedSlot === null) return;
    moveSkillSlot(draggedSlot, targetSlotIndex);
    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] ${combatPadding}`}>
      <div className="bg-[#0a0a0f]/80 border-b border-[#2a2a3a] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => navigateTo(combatState === 'fighting' ? 'combat' : 'town')}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#c9a227]/50 transition-colors text-sm text-gray-300"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <h1 className="text-xl font-bold text-[#c9a227]">Skill Trainer</h1>
              <p className="text-xs text-gray-500">Learn skills, buy support gems, and add sockets</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-300">Level {player.level}</div>
            <div className="text-xs text-teal-400">Socket Orbs: {player.currency.socketOrb}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
            <h2 className="text-lg font-bold text-[#c9a227] mb-1">Equipped Skills</h2>
            <p className="text-xs text-gray-500 mb-3">Drag and drop skill cards to reorder the Skill Bar.</p>
            <div className="space-y-3">
              {player.skills.map((skill, slotIndex) => {
                if (!skill) {
                  return (
                    <div
                      key={slotIndex}
                      onDragOver={event => {
                        event.preventDefault();
                        setDragOverSlot(slotIndex);
                      }}
                      onDragLeave={() => setDragOverSlot(current => (current === slotIndex ? null : current))}
                      onDrop={() => handleSkillDrop(slotIndex)}
                      className={`rounded-lg border border-dashed p-3 text-sm ${
                        dragOverSlot === slotIndex
                          ? 'border-[#c9a227] bg-[#201a06]'
                          : 'border-[#2a2a3a] bg-[#0a0a0f] text-gray-600'
                      }`}
                    >
                      Empty Slot {slotIndex + 1}
                    </div>
                  );
                }

                const skillDef = skillById.get(skill.definitionId);
                if (!skillDef) return null;

                const runtime = getSkillRuntimeStats(skillDef, skill, player.supportGems);
                const estimate = estimateSkillDamageRange(player, runtime);
                const socketedNames = runtime.supportGems.map(gem => gem.name).join(', ');
                const supportsForSkill = supportGems.filter(gem => gem.compatibleSkillTypes.includes(skillDef.type));
                const nextSkillLevelTotalXp = getGemNextLevelTotalExperience(skill.level, skillDef.gemTotalExperienceByLevel);
                const skillCanLevel = canGemLevelUp(skill.level, skill.experience, skillDef.gemTotalExperienceByLevel);

                return (
                  <div
                    key={slotIndex}
                    draggable
                    onDragStart={() => setDraggedSlot(slotIndex)}
                    onDragEnd={() => {
                      setDraggedSlot(null);
                      setDragOverSlot(null);
                    }}
                    onDragOver={event => {
                      event.preventDefault();
                      setDragOverSlot(slotIndex);
                    }}
                    onDragLeave={() => setDragOverSlot(current => (current === slotIndex ? null : current))}
                    onDrop={() => handleSkillDrop(slotIndex)}
                    className={`rounded-lg border bg-[#0a0a0f] p-3 cursor-move ${
                      dragOverSlot === slotIndex ? 'border-[#c9a227]' : 'border-[#2a2a3a]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-white font-semibold">
                          {skillDef.icon} {skillDef.name}
                          <span className="ml-2 text-xs text-gray-500">Slot {slotIndex + 1}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Level {skill.level} • {skillDef.damageType.toUpperCase()} • {Math.floor(estimate.min)}-{Math.floor(estimate.max)} damage
                        </div>
                        <div className="text-xs text-gray-500">
                          Mana {runtime.manaCost} • Cooldown {runtime.cooldown.toFixed(1)}s • Hits {runtime.numberOfHits}
                        </div>
                        <div className="text-xs text-gray-500">
                          Damage Effectiveness {(runtime.damageMultiplier * 100).toFixed(1)}% • Double Damage {Math.round(runtime.doubleDamageChance || 0)}%
                        </div>
                        <div className="text-xs text-indigo-300">
                          Gem XP {skill.experience.toLocaleString()} / {nextSkillLevelTotalXp?.toLocaleString() || 'MAX'}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => levelUpSkillGem(slotIndex)}
                          disabled={!skillCanLevel}
                          className="px-2 py-1 text-xs rounded border border-indigo-700/50 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-900/20"
                          title="Level up gem"
                        >
                          +
                        </button>
                        <button
                          onClick={() => addSkillSocket(slotIndex)}
                          disabled={player.currency.socketOrb < 1 || skill.maxSupportSockets >= 5}
                          className="px-2 py-1 text-xs rounded border border-teal-700/50 text-teal-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-900/20"
                        >
                          + Socket
                        </button>
                        <button
                          onClick={() => removeEquippedSkill(slotIndex)}
                          className="px-2 py-1 text-xs rounded border border-red-700/50 text-red-300 hover:bg-red-900/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: skill.maxSupportSockets }).map((_, idx) => {
                        const supportInstanceId = skill.socketedSupportIds[idx];
                        const supportInstance = supportInstanceId ? supportInstanceById.get(supportInstanceId) : null;
                        const support = supportInstance ? supportGemById.get(supportInstance.definitionId) : null;
                        return (
                          <div
                            key={idx}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs ${support ? 'border-[#c9a227] bg-[#1a1a24]' : 'border-dashed border-gray-700 bg-[#0d0d13]'}`}
                            title={support ? support.name : 'Empty support socket'}
                          >
                            {support ? support.icon : ''}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-gray-500 mb-2">
                      Linked: {socketedNames || 'None'}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {supportsForSkill.map(support => {
                        const isSocketed = skill.socketedSupportIds.some(instanceId => {
                          const supportInstance = supportInstanceById.get(instanceId);
                          return supportInstance?.definitionId === support.id;
                        });
                        const availableCopies = getAvailableSupportCopies(support.id);
                        const hasOpenSocket = skill.socketedSupportIds.length < skill.maxSupportSockets;
                        const canUse = isSocketed || (availableCopies > 0 && hasOpenSocket);

                        return (
                          <button
                            key={support.id}
                            onClick={() => toggleSupportGemSocket(slotIndex, support.id)}
                            disabled={!canUse}
                            className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                              isSocketed
                                ? 'border-green-600 bg-green-900/30 text-green-300'
                                : canUse
                                  ? 'border-[#2a2a3a] bg-[#161620] text-gray-300 hover:border-[#c9a227]/50'
                                  : 'border-[#2a2a3a] bg-[#12121a] text-gray-600 cursor-not-allowed'
                            }`}
                            title={`${support.name} (${availableCopies} free copy)`}
                          >
                            {support.icon} {support.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="space-y-6">
            <section className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <h2 className="text-lg font-bold text-[#c9a227] mb-3">Inactive Skills</h2>
              <div className="space-y-2">
                {player.inactiveSkills.length === 0 && (
                  <div className="text-sm text-gray-500">No inactive skills.</div>
                )}
                {player.inactiveSkills.map((skill, index) => {
                  const skillDef = skillById.get(skill.definitionId);
                  if (!skillDef) return null;
                  const nextLevelTotalXp = getGemNextLevelTotalExperience(skill.level, skillDef.gemTotalExperienceByLevel);
                  const canLevel = canGemLevelUp(skill.level, skill.experience, skillDef.gemTotalExperienceByLevel);

                  return (
                    <div key={`${skill.definitionId}_${index}`} className="rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold">{skillDef.icon} {skillDef.name}</div>
                        <div className="text-xs text-gray-500">
                          Lv.{skill.level} • XP {skill.experience.toLocaleString()} / {nextLevelTotalXp?.toLocaleString() || 'MAX'} • Sockets {skill.maxSupportSockets}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => levelUpInactiveSkillGem(skill.definitionId)}
                          disabled={!canLevel}
                          className="px-2 py-1 text-xs rounded border border-indigo-700/50 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-900/20"
                          title="Level up gem"
                        >
                          +
                        </button>
                        <button
                          onClick={() => equipInactiveSkill(skill.definitionId)}
                          disabled={!hasEmptySkillSlot}
                          className="px-3 py-1.5 rounded border border-[#2a2a3a] bg-[#1a1a24] text-sm text-gray-200 hover:border-[#c9a227]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Equip
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <h2 className="text-lg font-bold text-[#c9a227] mb-3">Buy Skills</h2>
              <div className="space-y-2">
                {availableSkillsToBuy.length === 0 && (
                  <div className="text-sm text-gray-500">No new skills available at your level.</div>
                )}
                {availableSkillsToBuy.map(skill => {
                  const price = getSkillPurchaseCost(skill);
                  const canBuy = player.currency.transmutation >= price;

                  return (
                    <div key={skill.id} className="rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold">{skill.icon} {skill.name}</div>
                        <div className="text-xs text-gray-400">
                          Lv.{skill.requiredLevel} • {skill.damageType.toUpperCase()} • Mana {skill.manaCost} • CD {skill.cooldown}s
                        </div>
                      </div>
                      <button
                        onClick={() => buySkill(skill.id)}
                        disabled={!canBuy}
                        className="px-3 py-1.5 rounded border border-[#2a2a3a] bg-[#1a1a24] text-sm text-gray-200 hover:border-[#c9a227]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Buy ({price} Trans)
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <section className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
          <h2 className="text-lg font-bold text-[#c9a227] mb-3">Support Gems</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {supportGems.map(support => {
              const supportInstances = getSupportInstancesForDefinition(support.id);
              const owned = supportInstances.length;
              const canBuy = player.level >= support.requiredLevel &&
                player.currency[support.costCurrency] >= support.costAmount;

              return (
                <div key={support.id} className="rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold text-sm">{support.icon} {support.name}</div>
                    <div className="text-xs text-gray-500">Owned: {owned}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{support.description}</div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    Lv.{support.requiredLevel} • Cost: {support.costAmount} {support.costCurrency}
                  </div>
                  {supportInstances.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {supportInstances.map((supportInstance, index) => {
                        const nextLevelTotalXp = getGemNextLevelTotalExperience(supportInstance.level);
                        const canLevel = canGemLevelUp(supportInstance.level, supportInstance.experience);
                        const isLinked = socketedSupportInstanceIds.has(supportInstance.instanceId);
                        return (
                          <div key={supportInstance.instanceId} className="text-[11px] rounded border border-[#2a2a3a] bg-[#12121a] px-2 py-1 flex items-center justify-between gap-2">
                            <div>
                              <div className="text-gray-300">
                                #{index + 1} • Lv.{supportInstance.level} {isLinked ? '• Linked' : '• Stored'}
                              </div>
                              <div className="text-gray-500">
                                XP {supportInstance.experience.toLocaleString()} / {nextLevelTotalXp?.toLocaleString() || 'MAX'}
                              </div>
                            </div>
                            <button
                              onClick={() => levelUpSupportGem(supportInstance.instanceId)}
                              disabled={!canLevel}
                              className="px-1.5 py-0.5 text-[11px] rounded border border-indigo-700/50 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-900/20"
                              title="Level up support gem"
                            >
                              +
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    onClick={() => buySupportGem(support.id)}
                    disabled={!canBuy}
                    className="mt-2 w-full px-2 py-1.5 rounded border border-[#2a2a3a] bg-[#1a1a24] text-xs text-gray-200 hover:border-[#c9a227]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy Support Gem
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
