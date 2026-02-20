import type { 
  Player, 
  Monster, 
  PlayerStats, 
  ComputedPlayerStats,
  DamageType 
} from '../types';

/**
 * XP required to level up from each level (index = level)
 * Level 1 needs 525 XP to reach level 2, etc.
 * Max level is 100.
 */
const XP_TABLE: number[] = [
  0,          // Level 0 (unused)
  525,        // Level 1 -> 2
  1235,       // Level 2 -> 3
  2021,       // Level 3 -> 4
  3403,       // Level 4 -> 5
  5002,       // Level 5 -> 6
  7138,       // Level 6 -> 7
  10053,      // Level 7 -> 8
  13804,      // Level 8 -> 9
  18512,      // Level 9 -> 10
  24297,      // Level 10 -> 11
  31516,      // Level 11 -> 12
  39878,      // Level 12 -> 13
  50352,      // Level 13 -> 14
  62261,      // Level 14 -> 15
  76465,      // Level 15 -> 16
  92806,      // Level 16 -> 17
  112027,     // Level 17 -> 18
  133876,     // Level 18 -> 19
  158538,     // Level 19 -> 20
  187025,     // Level 20 -> 21
  218895,     // Level 21 -> 22
  255366,     // Level 22 -> 23
  295852,     // Level 23 -> 24
  341805,     // Level 24 -> 25
  392470,     // Level 25 -> 26
  449555,     // Level 26 -> 27
  512121,     // Level 27 -> 28
  583857,     // Level 28 -> 29
  662181,     // Level 29 -> 30
  747411,     // Level 30 -> 31
  844146,     // Level 31 -> 32
  949053,     // Level 32 -> 33
  1064952,    // Level 33 -> 34
  1192712,    // Level 34 -> 35
  1333241,    // Level 35 -> 36
  1487491,    // Level 36 -> 37
  1656447,    // Level 37 -> 38
  1841143,    // Level 38 -> 39
  2046202,    // Level 39 -> 40
  2265837,    // Level 40 -> 41
  2508528,    // Level 41 -> 42
  2776124,    // Level 42 -> 43
  3061734,    // Level 43 -> 44
  3379914,    // Level 44 -> 45
  3723676,    // Level 45 -> 46
  4099570,    // Level 46 -> 47
  4504444,    // Level 47 -> 48
  4951099,    // Level 48 -> 49
  5430907,    // Level 49 -> 50
  5957868,    // Level 50 -> 51
  6528910,    // Level 51 -> 52
  7153414,    // Level 52 -> 53
  7827968,    // Level 53 -> 54
  8555414,    // Level 54 -> 55
  9353933,    // Level 55 -> 56
  10212541,   // Level 56 -> 57
  11142646,   // Level 57 -> 58
  12157041,   // Level 58 -> 59
  13252160,   // Level 59 -> 60
  14441758,   // Level 60 -> 61
  15731508,   // Level 61 -> 62
  17127265,   // Level 62 -> 63
  18635053,   // Level 63 -> 64
  20271765,   // Level 64 -> 65
  22044909,   // Level 65 -> 66
  23950783,   // Level 66 -> 67
  26019833,   // Level 67 -> 68
  28261412,   // Level 68 -> 69
  30672515,   // Level 69 -> 70
  33287878,   // Level 70 -> 71
  36118904,   // Level 71 -> 72
  39163425,   // Level 72 -> 73
  42460810,   // Level 73 -> 74
  46024718,   // Level 74 -> 75
  49853964,   // Level 75 -> 76
  54008554,   // Level 76 -> 77
  58473753,   // Level 77 -> 78
  63314495,   // Level 78 -> 79
  68516464,   // Level 79 -> 80
  74132190,   // Level 80 -> 81
  80182477,   // Level 81 -> 82
  86725730,   // Level 82 -> 83
  93748717,   // Level 83 -> 84
  101352108,  // Level 84 -> 85
  109524907,  // Level 85 -> 86
  118335069,  // Level 86 -> 87
  127813148,  // Level 87 -> 88
  138033822,  // Level 88 -> 89
  149032822,  // Level 89 -> 90
  160890604,  // Level 90 -> 91
  173648795,  // Level 91 -> 92
  187372170,  // Level 92 -> 93
  202153736,  // Level 93 -> 94
  218041909,  // Level 94 -> 95
  235163399,  // Level 95 -> 96
  253547862,  // Level 96 -> 97
  273358532,  // Level 97 -> 98
  294631836,  // Level 98 -> 99
  317515914,  // Level 99 -> 100
  0,          // Level 100 (max level)
];

/**
 * Calculate experience required to level up from a given level
 */
export function getExperienceForLevel(level: number): number {
  if (level < 1) return XP_TABLE[1];
  if (level >= 100) return 0; // Max level
  return XP_TABLE[level] || 0;
}

/**
 * Get default player stats
 * 
 * Balance goals:
 * - Level 1, no gear: ~5 DPS (4-5 sec to kill basic monster)
 * - Level 10 + some gear: ~12-15 DPS (2-3 sec kills)
 * - Level 20+ with build: ~30+ DPS (fast clears)
 * 
 * Player should be able to kill monsters but need flasks to sustain
 */
export function getDefaultPlayerStats(): PlayerStats {
  return {
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    
    physicalDamageMin: 4,
    physicalDamageMax: 7,
    fireDamageMin: 0,
    fireDamageMax: 0,
    coldDamageMin: 0,
    coldDamageMax: 0,
    lightningDamageMin: 0,
    lightningDamageMax: 0,
    attackSpeed: 1.0,
    increasedAttackSpeed: 0,
    criticalChance: 5,
    criticalMultiplier: 150,
    increasedPhysicalDamage: 0,
    increasedFireDamage: 0,
    increasedColdDamage: 0,
    increasedLightningDamage: 0,
    accuracy: 100,
    
    maxLife: 80,
    maxMana: 40,
    armor: 0,
    evasion: 0,
    blockChance: 0,
    fireResistance: 0,
    coldResistance: 0,
    lightningResistance: 0,
    lifeRegeneration: 1,
    manaRegeneration: 2,
  };
}

/**
 * Compute effective stats including all modifiers
 */
export function computePlayerStats(player: Player): ComputedPlayerStats {
  const stats = { ...player.stats };
  
  Object.values(player.equipment).forEach(item => {
    if (!item) return;
    
    Object.entries(item.stats).forEach(([key, value]) => {
      if (value === undefined) return;
      
      // Handle backwards compatibility: old items might have 'attackSpeed' 
      // which should be treated as 'increasedAttackSpeed' (percentage)
      if (key === 'attackSpeed') {
        stats.increasedAttackSpeed += value;
        return;
      }
      
      if (key in stats) {
        (stats as Record<string, number>)[key] += value;
      }
    });
  });
  
  // ============================================
  // ATTRIBUTE BONUSES
  // ============================================
  
  const strBonus = Math.floor(stats.strength / 10);
  stats.maxLife += strBonus * 2;
  stats.increasedPhysicalDamage += strBonus * 2;
  
  stats.accuracy += stats.dexterity * 2;
  const dexEvasionBonus = Math.floor(stats.dexterity / 5) * 2;
  stats.evasion = Math.floor(stats.evasion * (1 + dexEvasionBonus / 100));
  
  const intBonus = Math.floor(stats.intelligence / 10);
  stats.maxMana += intBonus * 2;
  const intElemBonus = intBonus * 2;
  stats.increasedFireDamage += intElemBonus;
  stats.increasedColdDamage += intElemBonus;
  stats.increasedLightningDamage += intElemBonus;
  
  // ============================================
  // DAMAGE CALCULATION
  // ============================================
  
  const physAvg = (stats.physicalDamageMin + stats.physicalDamageMax) / 2;
  const fireAvg = (stats.fireDamageMin + stats.fireDamageMax) / 2;
  const coldAvg = (stats.coldDamageMin + stats.coldDamageMax) / 2;
  const lightningAvg = (stats.lightningDamageMin + stats.lightningDamageMax) / 2;
  
  const physDmg = physAvg * (1 + stats.increasedPhysicalDamage / 100);
  const fireDmg = fireAvg * (1 + stats.increasedFireDamage / 100);
  const coldDmg = coldAvg * (1 + stats.increasedColdDamage / 100);
  const lightningDmg = lightningAvg * (1 + stats.increasedLightningDamage / 100);
  
  const averageHit = physDmg + fireDmg + coldDmg + lightningDmg;
  
  const critMultiplier = 1 + (stats.criticalChance / 100) * ((stats.criticalMultiplier - 100) / 100);
  const effectiveHit = averageHit * critMultiplier;
  
  const effectiveAttackSpeed = stats.attackSpeed * (1 + stats.increasedAttackSpeed / 100);
  
  const dps = effectiveHit * effectiveAttackSpeed;
  
  const effectiveHp = stats.maxLife;
  
  return {
    ...stats,
    attackSpeed: effectiveAttackSpeed, // Return the calculated attack speed
    dps,
    averageHit: effectiveHit,
    effectiveHp,
  };
}

/**
 * Calculate damage dealt to monster
 */
export function calculatePlayerDamage(player: Player): { damage: number; isCrit: boolean } {
  const stats = computePlayerStats(player);
  
  // Roll between min and max for each damage type
  const rollDamage = (min: number, max: number) => 
    min + Math.random() * (max - min);
  
  let totalDamage = 0;
  
  totalDamage += rollDamage(stats.physicalDamageMin, stats.physicalDamageMax) 
    * (1 + stats.increasedPhysicalDamage / 100);
  
  totalDamage += rollDamage(stats.fireDamageMin, stats.fireDamageMax)
    * (1 + stats.increasedFireDamage / 100);
  totalDamage += rollDamage(stats.coldDamageMin, stats.coldDamageMax)
    * (1 + stats.increasedColdDamage / 100);
  totalDamage += rollDamage(stats.lightningDamageMin, stats.lightningDamageMax)
    * (1 + stats.increasedLightningDamage / 100);
  
  const isCrit = Math.random() * 100 < stats.criticalChance;
  if (isCrit) {
    totalDamage *= stats.criticalMultiplier / 100;
  }
  
  return { damage: Math.floor(totalDamage), isCrit };
}


/**
 * Calculate hit chance based on accuracy vs evasion
 * Formula: hit chance = accuracy / (accuracy + (evasion / 4))
 * Clamped between 5% (min) and 100% (max)
 */
export function calculateHitChance(accuracy: number, evasion: number): number {
  if (evasion <= 0) return 100;
  const hitChance = (accuracy / (accuracy + evasion / 4)) * 100;
  return Math.min(100, Math.max(5, hitChance));
}

/**
 * Calculate damage dealt to player
 * Returns: { damage: number, evaded: boolean, blocked: boolean }
 */
export function calculateMonsterDamage(
  monster: Monster, 
  player: Player,
  baseDamageOverride?: number,
  damageTypeOverride?: DamageType
): { damage: number; evaded: boolean; blocked: boolean } {
  const stats = computePlayerStats(player);
  const baseDamage = baseDamageOverride ?? monster.damage;
  const damageType = damageTypeOverride ?? monster.damageType;
  
  const monsterAccuracy = 100 + monster.level * 10;
  
  const hitChance = calculateHitChance(monsterAccuracy, stats.evasion);
  if (Math.random() * 100 > hitChance) {
    return { damage: 0, evaded: true, blocked: false };
  }
  
  if (damageType === 'physical' && stats.blockChance > 0) {
    if (Math.random() * 100 < stats.blockChance) {
      return { damage: 0, evaded: false, blocked: true };
    }
  }
  
  const variance = 0.85 + Math.random() * 0.30;
  let damage = baseDamage * variance;
  
  const resistanceMap: Record<DamageType, keyof PlayerStats> = {
    physical: 'armor',
    fire: 'fireResistance',
    cold: 'coldResistance',
    lightning: 'lightningResistance',
  };
  
  const resistanceStat = resistanceMap[damageType];
  const resistance = stats[resistanceStat] as number;
  
  if (damageType === 'physical') {
    const reduction = resistance / (resistance + 10 * monster.level);
    damage *= (1 - reduction);
  } else {
    const cappedRes = Math.min(resistance, 75);
    damage *= (1 - cappedRes / 100);
  }
  
  return { damage: Math.max(1, Math.round(damage)), evaded: false, blocked: false };
}

/**
 * Check if player levels up and handle it
 * 
 * Note: Stats are NOT automatically increased on level up.
 * Players will gain skill points to spend on a passive tree (to be implemented).
 */
export function checkLevelUp(player: Player): { 
  leveled: boolean; 
  newLevel: number;
  newStats: PlayerStats;
  newExpToNext: number;
} {
  if (player.experience >= player.experienceToNextLevel) {
    const newLevel = player.level + 1;
    
    return {
      leveled: true,
      newLevel,
      newStats: player.stats, // Stats unchanged
      newExpToNext: getExperienceForLevel(newLevel), // XP needed to go from newLevel to newLevel+1
    };
  }
  
  return {
    leveled: false,
    newLevel: player.level,
    newStats: player.stats,
    newExpToNext: player.experienceToNextLevel,
  };
}
