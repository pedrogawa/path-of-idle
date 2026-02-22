export const GEM_TOTAL_EXPERIENCE_BY_LEVEL: number[] = [
  0,
  15249,
  56766,
  138749,
  286717,
  537274,
  942360,
  1390078,
  2005396,
  2840035,
  4410795,
  6044782,
  8195812,
  11008001,
  16107361,
  25508092,
  40781458,
  67068040,
  129958630,
  342004647,
];

export const GEM_MAX_LEVEL = GEM_TOTAL_EXPERIENCE_BY_LEVEL.length;

function getSafeExperienceTable(totalExperienceByLevel?: readonly number[]): readonly number[] {
  if (!totalExperienceByLevel || totalExperienceByLevel.length === 0) {
    return GEM_TOTAL_EXPERIENCE_BY_LEVEL;
  }
  return totalExperienceByLevel;
}

export function getGemTotalExperienceForLevel(
  level: number,
  totalExperienceByLevel?: readonly number[]
): number {
  const table = getSafeExperienceTable(totalExperienceByLevel);
  const maxLevel = table.length;

  if (level <= 1) return table[0];
  if (level >= maxLevel) return table[maxLevel - 1];
  return table[level - 1];
}

export function getGemNextLevelTotalExperience(
  level: number,
  totalExperienceByLevel?: readonly number[]
): number | null {
  const table = getSafeExperienceTable(totalExperienceByLevel);
  if (level >= table.length) return null;
  return table[level];
}

export function canGemLevelUp(
  level: number,
  experience: number,
  totalExperienceByLevel?: readonly number[]
): boolean {
  const nextLevelTotal = getGemNextLevelTotalExperience(level, totalExperienceByLevel);
  if (nextLevelTotal === null) return false;
  return experience >= nextLevelTotal;
}

export function getGemRequiredCharacterLevelForLevel(
  gemLevel: number,
  baseRequiredLevel: number,
  requiredCharacterLevelByGemLevel?: readonly number[]
): number {
  if (gemLevel <= 1) {
    return requiredCharacterLevelByGemLevel?.[0] ?? baseRequiredLevel;
  }

  if (requiredCharacterLevelByGemLevel && requiredCharacterLevelByGemLevel.length > 0) {
    const levelIndex = Math.max(0, Math.min(requiredCharacterLevelByGemLevel.length - 1, gemLevel - 1));
    return requiredCharacterLevelByGemLevel[levelIndex];
  }
  return baseRequiredLevel;
}
