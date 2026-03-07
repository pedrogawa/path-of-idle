import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getBuyableSkills, getSkillPurchaseCost, supportGems, supportGemById, skillById } from '../data';
import { canGemLevelUp, getGemNextLevelTotalExperience, getGemRequiredCharacterLevelForLevel } from '../lib/gems';
import { estimateSkillDamageRange, getSkillRuntimeStats } from '../lib/skills';
import type { GemPrimaryAttribute, PlayerSkill, PlayerSupportGem, SkillDefinition, SupportGemDefinition } from '../types';

type TrainerTab = 'loadout' | 'buy';
type LoadoutStashTab = 'active' | 'support';
type BuyGemTab = 'active' | 'support';
interface TrainerTooltip {
  lines: string[];
  x: number;
  y: number;
}

const ATTRIBUTE_STYLES: Record<GemPrimaryAttribute, {
  border: string;
  bg: string;
  text: string;
  dot: string;
}> = {
  strength: {
    border: 'border-red-700/70',
    bg: 'bg-red-950/25',
    text: 'text-red-300',
    dot: 'bg-red-500',
  },
  dexterity: {
    border: 'border-emerald-700/70',
    bg: 'bg-emerald-950/25',
    text: 'text-emerald-300',
    dot: 'bg-emerald-500',
  },
  intelligence: {
    border: 'border-blue-700/70',
    bg: 'bg-blue-950/25',
    text: 'text-blue-300',
    dot: 'bg-blue-500',
  },
  neutral: {
    border: 'border-gray-600/70',
    bg: 'bg-gray-900/30',
    text: 'text-gray-300',
    dot: 'bg-gray-400',
  },
};

const ATTRIBUTE_LABELS: Record<GemPrimaryAttribute, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  intelligence: 'Intelligence',
  neutral: 'Neutral',
};

// Bottom padding when combat mini panel is shown
const useCombatPadding = () => {
  const combatState = useGameStore(state => state.combatState);
  return combatState === 'fighting' ? 'pb-20' : '';
};

function getClampedTooltipPosition(
  position: { x: number; y: number },
  width: number,
  height: number
): { left: number; top: number } {
  let left = position.x + 16;
  let top = position.y - 12;

  if (left + width > window.innerWidth - 16) left = position.x - width - 16;
  if (top + height > window.innerHeight - 16) top = window.innerHeight - height - 16;
  if (top < 16) top = 16;
  if (left < 16) left = 16;

  return { left, top };
}

function GemDot({ attribute, size = 'md' }: { attribute: GemPrimaryAttribute; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'xs'
    ? 'w-2.5 h-2.5'
    : size === 'sm'
      ? 'w-3.5 h-3.5'
      : size === 'lg'
        ? 'w-9 h-9'
        : 'w-5 h-5';

  return (
    <span
      className={`inline-block rounded-full border border-black/40 shadow-[0_0_10px_rgba(255,255,255,0.08)] ${sizeClass} ${ATTRIBUTE_STYLES[attribute].dot}`}
    />
  );
}

function GemTooltip({ tooltip }: { tooltip: TrainerTooltip }) {
  const tooltipWidth = 360;
  const tooltipHeight = 460;
  const { left, top } = getClampedTooltipPosition(
    { x: tooltip.x, y: tooltip.y },
    tooltipWidth,
    tooltipHeight
  );

  const [title, ...details] = tooltip.lines;

  return (
    <div className="fixed z-[9999] pointer-events-none" style={{ left, top }}>
      <div className="w-[360px] max-h-[460px] overflow-auto rounded-lg border border-[#c9a227]/60 bg-[#14100a] shadow-xl shadow-black/50">
        <div className="px-3 py-2 border-b border-[#c9a227]/40">
          <div className="text-sm font-bold text-[#f0d98c]">{title}</div>
        </div>
        <div className="px-3 py-2 space-y-1">
          {details.map((line, index) => (
            line === ''
              ? <div key={`divider_${index}`} className="border-t border-[#2f2a20] my-2" />
              : <div key={`line_${index}`} className="text-xs text-gray-200">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getLeveledSupportValue(
  baseValue: number | undefined,
  valuesByLevel: number[] | undefined,
  level: number
): number {
  const resolvedBase = baseValue ?? 0;
  if (!valuesByLevel || valuesByLevel.length === 0) return resolvedBase;
  const levelIndex = Math.max(0, Math.min(valuesByLevel.length - 1, level - 1));
  return valuesByLevel[levelIndex];
}

function getSupportDetailLines(support: SupportGemDefinition, level: number): string[] {
  const lines = [`${support.name} (Lv.${level})`, support.description, '', `Primary: ${ATTRIBUTE_LABELS[support.primaryAttribute]}`];

  const attackSpeedMore = getLeveledSupportValue(
    support.attackSpeedMorePercent,
    support.attackSpeedMorePercentByLevel,
    level
  );
  const secondHitLess = getLeveledSupportValue(
    support.secondHitLessDamagePercent,
    support.secondHitLessDamagePercentByLevel,
    level
  );
  const physAsExtraFire = getLeveledSupportValue(
    support.physicalAsExtraFirePercent,
    support.physicalAsExtraFirePercentByLevel,
    level
  );
  const chanceToBleed = getLeveledSupportValue(
    support.chanceToBleedPercent,
    support.chanceToBleedPercentByLevel,
    level
  );
  const moreBleedingDamage = getLeveledSupportValue(
    support.moreBleedingDamagePercent,
    support.moreBleedingDamagePercentByLevel,
    level
  );

  if (support.moreDamageMultiplier) lines.push(`More Damage: +${Math.round(support.moreDamageMultiplier * 100)}%`);
  if (attackSpeedMore > 0) lines.push(`More Attack Speed: +${Math.round(attackSpeedMore)}%`);
  if (secondHitLess > 0) lines.push(`Second Hit Less Damage: ${Math.round(secondHitLess)}%`);
  if (physAsExtraFire > 0) lines.push(`Physical as Extra Fire: +${Math.round(physAsExtraFire)}%`);
  if (chanceToBleed > 0) lines.push(`Chance to Bleed: ${Math.round(chanceToBleed)}%`);
  if (moreBleedingDamage > 0) lines.push(`More Bleeding Damage: +${Math.round(moreBleedingDamage)}%`);
  if (support.addedHits) lines.push(`Additional Hits: +${support.addedHits}`);
  if (support.cooldownMultiplier) lines.push(`Cooldown Multiplier: x${support.cooldownMultiplier.toFixed(2)}`);
  if (support.manaMultiplier) lines.push(`Mana Multiplier: x${support.manaMultiplier.toFixed(2)}`);

  const nextTotalXp = getGemNextLevelTotalExperience(level, support.gemTotalExperienceByLevel);
  const nextRequiredLevel = getGemRequiredCharacterLevelForLevel(level + 1, support.requiredLevel, support.requiredCharacterLevelByGemLevel);
  lines.push('', `Next Level XP: ${nextTotalXp?.toLocaleString() || 'MAX'}`);
  lines.push(`Next Level Req Character Lv.: ${nextTotalXp ? nextRequiredLevel : 'MAX'}`);

  return lines;
}

function getSkillDetailLines(
  skillDef: SkillDefinition,
  playerSkill: PlayerSkill,
  supportGemInstances: PlayerSupportGem[],
  player: ReturnType<typeof useGameStore.getState>['player']
): string[] {
  const runtime = getSkillRuntimeStats(skillDef, playerSkill, supportGemInstances);
  const estimate = estimateSkillDamageRange(player, runtime);
  const nextTotalXp = getGemNextLevelTotalExperience(playerSkill.level, skillDef.gemTotalExperienceByLevel);
  const nextRequiredLevel = getGemRequiredCharacterLevelForLevel(
    playerSkill.level + 1,
    skillDef.requiredLevel,
    skillDef.requiredCharacterLevelByGemLevel
  );

  return [
    `${skillDef.name} (Lv.${playerSkill.level})`,
    skillDef.description,
    '',
    `Primary: ${ATTRIBUTE_LABELS[skillDef.primaryAttribute]}`,
    `Damage: ${Math.floor(estimate.min)}-${Math.floor(estimate.max)} (${skillDef.damageType.toUpperCase()})`,
    `Damage Effectiveness: ${(runtime.damageMultiplier * 100).toFixed(1)}%`,
    `Mana: ${runtime.manaCost}`,
    `Cooldown: ${runtime.cooldown.toFixed(2)}s`,
    `Hits: ${runtime.numberOfHits}`,
    `Double Damage: ${Math.round(runtime.doubleDamageChance || 0)}%`,
    `Physical as Extra Fire: ${Math.round(runtime.extraFireFromPhysicalPercent || 0)}%`,
    `Chance to Bleed: ${Math.round(runtime.chanceToBleedPercent || 0)}%`,
    `More Bleeding Damage: ${Math.round(runtime.moreBleedingDamagePercent || 0)}%`,
    `Supports: ${runtime.supportGems.map(gem => gem.name).join(', ') || 'None'}`,
    '',
    `Gem XP: ${playerSkill.experience.toLocaleString()} / ${nextTotalXp?.toLocaleString() || 'MAX'}`,
    `Next Level Req Character Lv.: ${nextTotalXp ? nextRequiredLevel : 'MAX'}`,
  ];
}

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
  const socketSupportGemInstance = useGameStore(state => state.socketSupportGemInstance);
  const unsocketSupportGem = useGameStore(state => state.unsocketSupportGem);
  const combatState = useGameStore(state => state.combatState);
  const combatPadding = useCombatPadding();

  const [activeTab, setActiveTab] = useState<TrainerTab>('loadout');
  const [loadoutStashTab, setLoadoutStashTab] = useState<LoadoutStashTab>('active');
  const [buyGemTab, setBuyGemTab] = useState<BuyGemTab>('active');
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [selectedEquippedSlot, setSelectedEquippedSlot] = useState<number | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<TrainerTooltip | null>(null);
  const [activeStashSearch, setActiveStashSearch] = useState('');
  const [supportStashSearch, setSupportStashSearch] = useState('');
  const [activeBuySearch, setActiveBuySearch] = useState('');
  const [supportBuySearch, setSupportBuySearch] = useState('');

  const openTooltip = (lines: string[], event: ReactMouseEvent<HTMLElement>) => {
    setHoverTooltip({ lines, x: event.clientX, y: event.clientY });
  };

  const moveTooltip = (event: ReactMouseEvent<HTMLElement>) => {
    setHoverTooltip(current => {
      if (!current) return current;
      return { ...current, x: event.clientX, y: event.clientY };
    });
  };

  const closeTooltip = () => {
    setHoverTooltip(null);
  };

  const ownedSkillIds = useMemo(() => {
    const ids = new Set(player.skills.filter(Boolean).map(skill => skill!.definitionId));
    for (const skill of player.inactiveSkills) {
      ids.add(skill.definitionId);
    }
    return ids;
  }, [player.skills, player.inactiveSkills]);

  const availableSkillsToBuy = useMemo(() => {
    const search = activeBuySearch.trim().toLowerCase();
    return getBuyableSkills()
      .filter(skill => !ownedSkillIds.has(skill.id))
      .filter(skill => search.length === 0 || skill.name.toLowerCase().includes(search));
  }, [ownedSkillIds, activeBuySearch]);

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

  const supportsByDefinition = useMemo(() => {
    const map = new Map<string, PlayerSupportGem[]>();
    for (const supportGem of player.supportGems) {
      const current = map.get(supportGem.definitionId) ?? [];
      current.push(supportGem);
      map.set(supportGem.definitionId, current);
    }
    return map;
  }, [player.supportGems]);

  const hasEmptySkillSlot = player.skills.some(skill => skill === null);

  const resolvedSelectedEquippedSlot = useMemo(() => {
    if (selectedEquippedSlot !== null && player.skills[selectedEquippedSlot]) return selectedEquippedSlot;
    const firstOccupied = player.skills.findIndex(skill => skill !== null);
    return firstOccupied >= 0 ? firstOccupied : null;
  }, [selectedEquippedSlot, player.skills]);

  const selectedEquippedSkill = resolvedSelectedEquippedSlot !== null
    ? player.skills[resolvedSelectedEquippedSlot]
    : null;
  const selectedEquippedSkillDef = selectedEquippedSkill ? skillById.get(selectedEquippedSkill.definitionId) : null;

  const filteredInactiveSkills = useMemo(() => {
    const search = activeStashSearch.trim().toLowerCase();
    return player.inactiveSkills
      .map((skill, index) => ({ skill, index, skillDef: skillById.get(skill.definitionId) }))
      .filter(entry => entry.skillDef)
      .filter(entry => search.length === 0 || entry.skillDef!.name.toLowerCase().includes(search));
  }, [player.inactiveSkills, activeStashSearch]);

  const unlinkedSupportGems = useMemo(() => {
    const search = supportStashSearch.trim().toLowerCase();
    return player.supportGems
      .filter(gem => !socketedSupportInstanceIds.has(gem.instanceId))
      .map((gem, index) => ({ gem, index, supportDef: supportGemById.get(gem.definitionId) }))
      .filter(entry => entry.supportDef)
      .filter(entry => search.length === 0 || entry.supportDef!.name.toLowerCase().includes(search));
  }, [player.supportGems, socketedSupportInstanceIds, supportStashSearch]);

  const filteredSupportGemsToBuy = useMemo(() => {
    const search = supportBuySearch.trim().toLowerCase();
    return supportGems.filter(support => search.length === 0 || support.name.toLowerCase().includes(search));
  }, [supportBuySearch]);

  const handleSkillDrop = (targetSlotIndex: number) => {
    if (draggedSlot === null) return;
    moveSkillSlot(draggedSlot, targetSlotIndex);
    setDraggedSlot(null);
    setDragOverSlot(null);
    setSelectedEquippedSlot(targetSlotIndex);
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
              <p className="text-xs text-gray-500">Compact loadout, stash, and gem shop</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-300">Level {player.level}</div>
            <div className="text-xs text-teal-400">Socket Orbs: {player.currency.socketOrb}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('loadout')}
            className={`px-3 py-1.5 rounded border text-sm transition-colors ${
              activeTab === 'loadout'
                ? 'border-[#c9a227] bg-[#2a220a] text-[#e3c15c]'
                : 'border-[#2a2a3a] bg-[#12121a] text-gray-300 hover:border-[#c9a227]/60'
            }`}
          >
            Loadout
          </button>
          <button
            onClick={() => setActiveTab('buy')}
            className={`px-3 py-1.5 rounded border text-sm transition-colors ${
              activeTab === 'buy'
                ? 'border-[#c9a227] bg-[#2a220a] text-[#e3c15c]'
                : 'border-[#2a2a3a] bg-[#12121a] text-gray-300 hover:border-[#c9a227]/60'
            }`}
          >
            Buy Gems
          </button>
        </div>

        {activeTab === 'loadout' && (
          <div className="space-y-6">
            <section className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <h2 className="text-lg font-bold text-[#c9a227] mb-1">Equipped Skill Bar</h2>
              <p className="text-xs text-gray-500 mb-4">Drag and drop to reorder priority. Hover gems for full details.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                        className={`h-32 rounded-lg border border-dashed p-2 flex items-center justify-center text-sm ${
                          dragOverSlot === slotIndex
                            ? 'border-[#c9a227] bg-[#201a06] text-[#e3c15c]'
                            : 'border-[#2a2a3a] bg-[#0a0a0f] text-gray-600'
                        }`}
                      >
                        Slot {slotIndex + 1}
                      </div>
                    );
                  }

                  const skillDef = skillById.get(skill.definitionId);
                  if (!skillDef) return null;
                  const attrStyle = ATTRIBUTE_STYLES[skillDef.primaryAttribute];
                  const nextSkillLevelTotalXp = getGemNextLevelTotalExperience(skill.level, skillDef.gemTotalExperienceByLevel);
                  const nextSkillRequiredLevel = getGemRequiredCharacterLevelForLevel(
                    skill.level + 1,
                    skillDef.requiredLevel,
                    skillDef.requiredCharacterLevelByGemLevel
                  );
                  const hasRequiredCharacterLevel = player.level >= nextSkillRequiredLevel;
                  const skillCanLevel = hasRequiredCharacterLevel
                    && canGemLevelUp(skill.level, skill.experience, skillDef.gemTotalExperienceByLevel);
                  const skillTooltipLines = getSkillDetailLines(skillDef, skill, player.supportGems, player);

                  return (
                    <div
                      key={slotIndex}
                      draggable
                      onMouseEnter={event => openTooltip(skillTooltipLines, event)}
                      onMouseMove={moveTooltip}
                      onMouseLeave={closeTooltip}
                      onClick={() => setSelectedEquippedSlot(slotIndex)}
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
                      className={`rounded-lg border p-2 transition-colors cursor-move ${
                        dragOverSlot === slotIndex
                          ? 'border-[#c9a227] bg-[#1f1705]'
                          : resolvedSelectedEquippedSlot === slotIndex
                            ? `border-[#c9a227] ${attrStyle.bg}`
                            : `${attrStyle.border} ${attrStyle.bg}`
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>Slot {slotIndex + 1}</span>
                        <span>Lv.{skill.level}</span>
                      </div>

                      <div className="h-11 flex items-center justify-center">
                        <GemDot attribute={skillDef.primaryAttribute} size="lg" />
                      </div>

                      <div className="flex items-center justify-center gap-1">
                        {Array.from({ length: skill.maxSupportSockets }).map((_, idx) => {
                          const supportInstanceId = skill.socketedSupportIds[idx];
                          const supportInstance = supportInstanceId ? supportInstanceById.get(supportInstanceId) : null;
                          const support = supportInstance ? supportGemById.get(supportInstance.definitionId) : null;
                          const supportTooltipLines = support && supportInstance
                            ? [
                              ...getSupportDetailLines(support, supportInstance.level),
                              '',
                              `Gem XP: ${supportInstance.experience.toLocaleString()} / ${getGemNextLevelTotalExperience(
                                supportInstance.level,
                                support.gemTotalExperienceByLevel
                              )?.toLocaleString() || 'MAX'}`,
                              'Click socket to unsocket this support gem.',
                            ]
                            : [`Empty Socket ${idx + 1}`, '', 'Click a support gem from stash to link it to the selected active gem.'];
                          return (
                            <button
                              key={idx}
                              onMouseEnter={event => openTooltip(supportTooltipLines, event)}
                              onMouseMove={moveTooltip}
                              onMouseLeave={closeTooltip}
                              onClick={event => {
                                event.stopPropagation();
                                if (support) {
                                  unsocketSupportGem(slotIndex, idx);
                                }
                              }}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                                support ? `${ATTRIBUTE_STYLES[support.primaryAttribute].border} ${ATTRIBUTE_STYLES[support.primaryAttribute].bg}` : 'border-dashed border-gray-700 bg-[#0d0d13]'
                              }`}
                            >
                              {support ? <GemDot attribute={support.primaryAttribute} size="xs" /> : ''}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-1">
                        <button
                          onClick={event => {
                            event.stopPropagation();
                            levelUpSkillGem(slotIndex);
                          }}
                          disabled={!skillCanLevel}
                          className="px-1 py-1 text-[10px] rounded border border-indigo-700/50 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-900/20"
                          title={hasRequiredCharacterLevel ? 'Level up gem' : `Requires character level ${nextSkillRequiredLevel}`}
                        >
                          +
                        </button>
                        <button
                          onClick={event => {
                            event.stopPropagation();
                            addSkillSocket(slotIndex);
                          }}
                          disabled={player.currency.socketOrb < 1 || skill.maxSupportSockets >= 5}
                          className="px-1 py-1 text-[10px] rounded border border-teal-700/50 text-teal-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-900/20"
                          title="Add support socket"
                        >
                          Socket
                        </button>
                        <button
                          onClick={event => {
                            event.stopPropagation();
                            removeEquippedSkill(slotIndex);
                          }}
                          className="px-1 py-1 text-[10px] rounded border border-red-700/50 text-red-300 hover:bg-red-900/20"
                          title="Move to stash"
                        >
                          Stash
                        </button>
                      </div>

                      <div className={`mt-1 text-center text-[10px] ${attrStyle.text}`}>{skillDef.name}</div>
                      <div className="text-center text-[10px] text-gray-500">
                        XP {skill.experience.toLocaleString()} / {nextSkillLevelTotalXp?.toLocaleString() || 'MAX'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-bold text-[#c9a227]">Gem Stash</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLoadoutStashTab('active')}
                    className={`px-2 py-1 rounded border text-xs transition-colors ${
                      loadoutStashTab === 'active'
                        ? 'border-[#c9a227] bg-[#2a220a] text-[#e3c15c]'
                        : 'border-[#2a2a3a] bg-[#12121a] text-gray-300 hover:border-[#c9a227]/60'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setLoadoutStashTab('support')}
                    className={`px-2 py-1 rounded border text-xs transition-colors ${
                      loadoutStashTab === 'support'
                        ? 'border-[#c9a227] bg-[#2a220a] text-[#e3c15c]'
                        : 'border-[#2a2a3a] bg-[#12121a] text-gray-300 hover:border-[#c9a227]/60'
                    }`}
                  >
                    Support
                  </button>
                </div>
              </div>

              <input
                value={loadoutStashTab === 'active' ? activeStashSearch : supportStashSearch}
                onChange={event => {
                  if (loadoutStashTab === 'active') {
                    setActiveStashSearch(event.target.value);
                  } else {
                    setSupportStashSearch(event.target.value);
                  }
                }}
                className="w-full mb-3 rounded border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#c9a227]/60"
                placeholder={loadoutStashTab === 'active' ? 'Search active gems...' : 'Search support gems...'}
              />

              {loadoutStashTab === 'active' && (
                filteredInactiveSkills.length === 0 ? (
                  <div className="text-sm text-gray-500">No active gems found in stash.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {filteredInactiveSkills.map(({ skill, index, skillDef }) => {
                      const resolvedSkillDef = skillDef!;
                      const attrStyle = ATTRIBUTE_STYLES[resolvedSkillDef.primaryAttribute];

                      const nextRequiredLevel = getGemRequiredCharacterLevelForLevel(
                        skill.level + 1,
                        resolvedSkillDef.requiredLevel,
                        resolvedSkillDef.requiredCharacterLevelByGemLevel
                      );
                      const hasRequiredCharacterLevel = player.level >= nextRequiredLevel;
                      const canLevel = hasRequiredCharacterLevel
                        && canGemLevelUp(skill.level, skill.experience, resolvedSkillDef.gemTotalExperienceByLevel);
                      const skillTooltipLines = getSkillDetailLines(resolvedSkillDef, skill, player.supportGems, player);

                      return (
                        <div
                          key={`${skill.definitionId}_${index}`}
                          className={`rounded-lg border p-2 ${attrStyle.border} ${attrStyle.bg}`}
                          onMouseEnter={event => openTooltip(skillTooltipLines, event)}
                          onMouseMove={moveTooltip}
                          onMouseLeave={closeTooltip}
                        >
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>#{index + 1}</span>
                            <span>Lv.{skill.level}</span>
                          </div>
                          <div className="h-10 flex items-center justify-center">
                            <GemDot attribute={resolvedSkillDef.primaryAttribute} size="lg" />
                          </div>
                          <div className={`text-center text-[10px] ${attrStyle.text}`}>{resolvedSkillDef.name}</div>
                          <div className="mt-1 grid grid-cols-2 gap-1">
                            <button
                              onClick={() => equipInactiveSkill(index)}
                              disabled={!hasEmptySkillSlot}
                              className="px-1 py-1 text-[10px] rounded border border-[#2a2a3a] text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#c9a227]/60"
                            >
                              Equip
                            </button>
                            <button
                              onClick={() => levelUpInactiveSkillGem(index)}
                              disabled={!canLevel}
                              className="px-1 py-1 text-[10px] rounded border border-indigo-700/50 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-900/20"
                              title={hasRequiredCharacterLevel ? 'Level up gem' : `Requires character level ${nextRequiredLevel}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {loadoutStashTab === 'support' && (
                <>
                  <div className="mb-3 text-xs text-gray-500">
                    {selectedEquippedSkill && selectedEquippedSkillDef && resolvedSelectedEquippedSlot !== null
                      ? `Selected Active Gem: ${selectedEquippedSkillDef.name} (Slot ${resolvedSelectedEquippedSlot + 1}) • Click support gem to socket`
                      : 'Select an equipped active gem first, then click a support gem to socket it.'}
                  </div>

                  {unlinkedSupportGems.length === 0 ? (
                    <div className="text-sm text-gray-500">No unlinked support gems found in stash.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {unlinkedSupportGems.map(({ gem: supportInstance, index, supportDef }) => {
                        const resolvedSupportDef = supportDef!;
                        const attrStyle = ATTRIBUTE_STYLES[resolvedSupportDef.primaryAttribute];
                        const nextLevelTotalXp = getGemNextLevelTotalExperience(
                          supportInstance.level,
                          resolvedSupportDef.gemTotalExperienceByLevel
                        );
                        const nextRequiredLevel = getGemRequiredCharacterLevelForLevel(
                          supportInstance.level + 1,
                          resolvedSupportDef.requiredLevel,
                          resolvedSupportDef.requiredCharacterLevelByGemLevel
                        );
                        const hasRequiredCharacterLevel = player.level >= nextRequiredLevel;
                        const canLevel = hasRequiredCharacterLevel && canGemLevelUp(
                          supportInstance.level,
                          supportInstance.experience,
                          resolvedSupportDef.gemTotalExperienceByLevel
                        );

                        const canSocketToSelected = Boolean(
                          selectedEquippedSkill
                          && selectedEquippedSkillDef
                          && resolvedSelectedEquippedSlot !== null
                          && selectedEquippedSkill.socketedSupportIds.length < selectedEquippedSkill.maxSupportSockets
                          && resolvedSupportDef.compatibleSkillTypes.includes(selectedEquippedSkillDef.type)
                        );

                        const supportTooltipLines = [
                          ...getSupportDetailLines(resolvedSupportDef, supportInstance.level),
                          '',
                          `Gem XP: ${supportInstance.experience.toLocaleString()} / ${nextLevelTotalXp?.toLocaleString() || 'MAX'}`,
                          canSocketToSelected
                            ? `Click to socket into ${selectedEquippedSkillDef?.name}.`
                            : 'Cannot socket to selected active gem (select one with a free compatible socket).',
                        ];

                        return (
                          <div
                            key={supportInstance.instanceId}
                            className={`rounded-lg border p-2 ${attrStyle.border} ${attrStyle.bg} ${canSocketToSelected ? 'cursor-pointer hover:brightness-110' : ''}`}
                            onMouseEnter={event => openTooltip(supportTooltipLines, event)}
                            onMouseMove={moveTooltip}
                            onMouseLeave={closeTooltip}
                            onClick={() => {
                              if (!canSocketToSelected || resolvedSelectedEquippedSlot === null) return;
                              socketSupportGemInstance(resolvedSelectedEquippedSlot, supportInstance.instanceId);
                            }}
                          >
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                              <span>#{index + 1}</span>
                              <span>Lv.{supportInstance.level}</span>
                            </div>
                            <div className="h-10 flex items-center justify-center">
                              <GemDot attribute={resolvedSupportDef.primaryAttribute} size="lg" />
                            </div>
                            <div className={`text-center text-[10px] ${attrStyle.text}`}>{resolvedSupportDef.name}</div>
                            <div className="text-center text-[10px] text-gray-500">
                              {canSocketToSelected ? 'Click to socket' : 'Stored'}
                            </div>
                            <button
                              onClick={event => {
                                event.stopPropagation();
                                levelUpSupportGem(supportInstance.instanceId);
                              }}
                              disabled={!canLevel}
                              className="mt-1 w-full px-1 py-1 text-[10px] rounded border border-indigo-700/50 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-900/20"
                              title={hasRequiredCharacterLevel ? 'Level up support gem' : `Requires character level ${nextRequiredLevel}`}
                            >
                              +
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        {activeTab === 'buy' && (
          <div className="space-y-6">
            <section className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-bold text-[#c9a227]">Buy Gems</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBuyGemTab('active')}
                    className={`px-2 py-1 rounded border text-xs transition-colors ${
                      buyGemTab === 'active'
                        ? 'border-[#c9a227] bg-[#2a220a] text-[#e3c15c]'
                        : 'border-[#2a2a3a] bg-[#12121a] text-gray-300 hover:border-[#c9a227]/60'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setBuyGemTab('support')}
                    className={`px-2 py-1 rounded border text-xs transition-colors ${
                      buyGemTab === 'support'
                        ? 'border-[#c9a227] bg-[#2a220a] text-[#e3c15c]'
                        : 'border-[#2a2a3a] bg-[#12121a] text-gray-300 hover:border-[#c9a227]/60'
                    }`}
                  >
                    Support
                  </button>
                </div>
              </div>

              <input
                value={buyGemTab === 'active' ? activeBuySearch : supportBuySearch}
                onChange={event => {
                  if (buyGemTab === 'active') {
                    setActiveBuySearch(event.target.value);
                  } else {
                    setSupportBuySearch(event.target.value);
                  }
                }}
                className="w-full mb-3 rounded border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#c9a227]/60"
                placeholder={buyGemTab === 'active' ? 'Search active gems...' : 'Search support gems...'}
              />

              {buyGemTab === 'active' && (
                availableSkillsToBuy.length === 0 ? (
                  <div className="text-sm text-gray-500">No active gems found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableSkillsToBuy.map(skill => {
                      const price = getSkillPurchaseCost(skill);
                      const canBuy = player.currency.transmutation >= price;
                      const attrStyle = ATTRIBUTE_STYLES[skill.primaryAttribute];
                      const skillTooltipLines = getSkillDetailLines(skill, {
                        definitionId: skill.id,
                        level: 1,
                        experience: 0,
                        currentCooldown: 0,
                        isActive: true,
                        maxSupportSockets: 1,
                        socketedSupportIds: [],
                      }, player.supportGems, player);

                      return (
                        <div
                          key={skill.id}
                          className={`rounded-lg border p-3 ${attrStyle.border} ${attrStyle.bg}`}
                          onMouseEnter={event => openTooltip(skillTooltipLines, event)}
                          onMouseMove={moveTooltip}
                          onMouseLeave={closeTooltip}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-white font-semibold inline-flex items-center gap-2">
                                <GemDot attribute={skill.primaryAttribute} size="sm" />
                                {skill.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                Req Lv.{skill.requiredLevel} • {ATTRIBUTE_LABELS[skill.primaryAttribute]}
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
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {buyGemTab === 'support' && (
                filteredSupportGemsToBuy.length === 0 ? (
                  <div className="text-sm text-gray-500">No support gems found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredSupportGemsToBuy.map(support => {
                      const owned = (supportsByDefinition.get(support.id) ?? []).length;
                      const canBuy = player.currency[support.costCurrency] >= support.costAmount;
                      const attrStyle = ATTRIBUTE_STYLES[support.primaryAttribute];
                      const supportTooltipLines = getSupportDetailLines(support, 1);

                      return (
                        <div
                          key={support.id}
                          className={`rounded-lg border p-3 ${attrStyle.border} ${attrStyle.bg}`}
                          onMouseEnter={event => openTooltip(supportTooltipLines, event)}
                          onMouseMove={moveTooltip}
                          onMouseLeave={closeTooltip}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-white font-semibold inline-flex items-center gap-2">
                                <GemDot attribute={support.primaryAttribute} size="sm" />
                                {support.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                Req Lv.{support.requiredLevel} • {ATTRIBUTE_LABELS[support.primaryAttribute]} • Owned: {owned}
                              </div>
                              <div className="text-xs text-gray-500">
                                Cost: {support.costAmount} {support.costCurrency}
                              </div>
                            </div>
                            <button
                              onClick={() => buySupportGem(support.id)}
                              disabled={!canBuy}
                              className="px-3 py-1.5 rounded border border-[#2a2a3a] bg-[#1a1a24] text-sm text-gray-200 hover:border-[#c9a227]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Buy
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </section>
          </div>
        )}
      </div>
      {hoverTooltip && <GemTooltip tooltip={hoverTooltip} />}
    </div>
  );
}
