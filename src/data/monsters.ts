import type { MonsterDefinition, BossDefinition, BossSkill } from '../types';

// ============================================
// BOSS SKILLS
// ============================================

// Skills for early game bosses (simpler, less damage)
const drownedCaptainSkills: BossSkill[] = [
  {
    id: 'anchorSlam',
    name: 'Anchor Slam',
    description: 'Slams the ground with a heavy anchor',
    damageMultiplier: 2.5,
    cooldown: 5,
    skillType: 'slam',
    color: '#4a5568',
  },
  {
    id: 'cutlassFlurry',
    name: 'Cutlass Flurry',
    description: 'A rapid series of sword strikes',
    damageMultiplier: 1.5,
    cooldown: 3,
    skillType: 'cleave',
    color: '#718096',
  },
];

const caveLurkerSkills: BossSkill[] = [
  {
    id: 'rockCrush',
    name: 'Rock Crush',
    description: 'Hurls a massive boulder',
    damageMultiplier: 3,
    cooldown: 6,
    skillType: 'projectile',
    color: '#805ad5',
  },
  {
    id: 'burrowStrike',
    name: 'Burrow Strike',
    description: 'Emerges from the ground for a devastating attack',
    damageMultiplier: 2,
    cooldown: 4,
    skillType: 'slam',
    color: '#6b46c1',
  },
];

const ghostAdmiralSkills: BossSkill[] = [
  {
    id: 'spectralCannon',
    name: 'Spectral Cannon',
    description: 'Fires a ghostly cannonball',
    damageMultiplier: 2.5,
    cooldown: 4,
    skillType: 'projectile',
    color: '#63b3ed',
  },
  {
    id: 'chillingPresence',
    name: 'Chilling Presence',
    description: 'Cold aura damages everything nearby',
    damageMultiplier: 2,
    cooldown: 5,
    skillType: 'aoe',
    color: '#90cdf4',
  },
  {
    id: 'phantomBlade',
    name: 'Phantom Blade',
    description: 'A devastating ethereal slash',
    damageMultiplier: 3.5,
    cooldown: 8,
    skillType: 'cleave',
    color: '#4299e1',
  },
];

const abyssalCrabSkills: BossSkill[] = [
  {
    id: 'pinchCrush',
    name: 'Pinch Crush',
    description: 'Crushing attack with massive claws',
    damageMultiplier: 3,
    cooldown: 5,
    skillType: 'slam',
    color: '#ed8936',
  },
  {
    id: 'bubbleBarrage',
    name: 'Bubble Barrage',
    description: 'Shoots a stream of pressurized bubbles',
    damageMultiplier: 2,
    cooldown: 3,
    skillType: 'projectile',
    color: '#4fd1c5',
  },
  {
    id: 'shellShock',
    name: 'Shell Shock',
    description: 'Slams shell into the ground causing tremors',
    damageMultiplier: 4,
    cooldown: 10,
    skillType: 'aoe',
    color: '#dd6b20',
  },
];

const templeGuardianSkills: BossSkill[] = [
  {
    id: 'lightningStrike',
    name: 'Lightning Strike',
    description: 'Calls down a bolt of lightning',
    damageMultiplier: 3.5,
    cooldown: 5,
    skillType: 'projectile',
    color: '#f6e05e',
  },
  {
    id: 'staticField',
    name: 'Static Field',
    description: 'Creates an electrified zone',
    damageMultiplier: 2,
    cooldown: 4,
    skillType: 'aoe',
    color: '#ecc94b',
  },
  {
    id: 'guardianSmite',
    name: 'Guardian Smite',
    description: 'A powerful divine strike',
    damageMultiplier: 4,
    cooldown: 8,
    skillType: 'slam',
    color: '#d69e2e',
  },
];

const ruinedSentinelSkills: BossSkill[] = [
  {
    id: 'swordSweep',
    name: 'Sword Sweep',
    description: 'Wide sweeping attack',
    damageMultiplier: 2.5,
    cooldown: 4,
    skillType: 'cleave',
    color: '#718096',
  },
  {
    id: 'shieldBash',
    name: 'Shield Bash',
    description: 'Stuns and damages with shield',
    damageMultiplier: 3,
    cooldown: 6,
    skillType: 'slam',
    color: '#4a5568',
  },
  {
    id: 'titanicSlam',
    name: 'Titanic Slam',
    description: 'Jumps and slams down with full force',
    damageMultiplier: 5,
    cooldown: 12,
    skillType: 'slam',
    color: '#2d3748',
  },
];

const sirenQueenSkills: BossSkill[] = [
  {
    id: 'sirenSong',
    name: 'Siren Song',
    description: 'Magical damaging melody',
    damageMultiplier: 2,
    cooldown: 3,
    skillType: 'projectile',
    color: '#d53f8c',
  },
  {
    id: 'tidalWave',
    name: 'Tidal Wave',
    description: 'Summons a crushing wave of water',
    damageMultiplier: 3.5,
    cooldown: 7,
    skillType: 'aoe',
    color: '#319795',
  },
  {
    id: 'frostKiss',
    name: 'Frost Kiss',
    description: 'A freezing touch of death',
    damageMultiplier: 4.5,
    cooldown: 10,
    skillType: 'slam',
    color: '#0bc5ea',
  },
];

const youngKrakenSkills: BossSkill[] = [
  {
    id: 'tentacleSlam',
    name: 'Tentacle Slam',
    description: 'Smashes with a massive tentacle',
    damageMultiplier: 3,
    cooldown: 4,
    skillType: 'slam',
    color: '#553c9a',
  },
  {
    id: 'inkCloud',
    name: 'Ink Cloud',
    description: 'Releases damaging toxic ink',
    damageMultiplier: 2.5,
    cooldown: 5,
    skillType: 'aoe',
    color: '#1a202c',
  },
  {
    id: 'devour',
    name: 'Devour',
    description: 'Attempts to swallow the player',
    damageMultiplier: 5,
    cooldown: 12,
    skillType: 'slam',
    color: '#e53e3e',
  },
];

const abyssalLordSkills: BossSkill[] = [
  {
    id: 'voidSlash',
    name: 'Void Slash',
    description: 'A slash imbued with void energy',
    damageMultiplier: 3.5,
    cooldown: 5,
    skillType: 'cleave',
    color: '#6b46c1',
  },
  {
    id: 'abyssalGrasp',
    name: 'Abyssal Grasp',
    description: 'Dark tendrils erupt from the ground',
    damageMultiplier: 3,
    cooldown: 6,
    skillType: 'aoe',
    color: '#322659',
  },
  {
    id: 'soulRend',
    name: 'Soul Rend',
    description: 'Tears at the very essence of life',
    damageMultiplier: 6,
    cooldown: 15,
    skillType: 'slam',
    color: '#805ad5',
  },
];

const leviathanSkills: BossSkill[] = [
  {
    id: 'worldQuake',
    name: 'World Quake',
    description: 'Shakes the entire battlefield',
    damageMultiplier: 4,
    cooldown: 6,
    skillType: 'aoe',
    color: '#c53030',
  },
  {
    id: 'lightningBreath',
    name: 'Lightning Breath',
    description: 'Breathes a cone of lightning',
    damageMultiplier: 5,
    cooldown: 8,
    skillType: 'projectile',
    color: '#ecc94b',
  },
  {
    id: 'tailSweep',
    name: 'Tail Sweep',
    description: 'Massive tail sweep attack',
    damageMultiplier: 3.5,
    cooldown: 5,
    skillType: 'cleave',
    color: '#48bb78',
  },
  {
    id: 'apocalypse',
    name: 'Apocalypse',
    description: 'Ultimate devastating attack',
    damageMultiplier: 8,
    cooldown: 20,
    skillType: 'slam',
    color: '#f56565',
  },
];

// ============================================
// REGULAR MONSTERS - World 1: Corrupted Shores
// ============================================

// Balance: Player base DPS ~2.4 (2-4 dmg, 0.8 atk spd)
// Normal monsters should take 8-15 seconds to kill at level 1
// Magic (2x HP): 16-30 seconds
// Rare (4x HP): 32-60 seconds (mini boss feel)

export const monsters: MonsterDefinition[] = [
  // Beach monsters (Maps 1-2) - ~20-25 HP base for 8-10 sec kills
  // XP scaled for new table: ~20-30 kills to level up early game
  {
    id: 'drownedZombie',
    name: 'Drowned Zombie',
    baseLife: 22,
    baseDamage: 1,
    attackSpeed: 0.6,
    damageType: 'physical',
    experienceReward: 25,
    lootBonus: 1,
  },
  {
    id: 'seaCrab',
    name: 'Sea Crab',
    baseLife: 28,
    baseDamage: 2,
    attackSpeed: 0.5,
    damageType: 'physical',
    experienceReward: 30,
    lootBonus: 1,
  },
  {
    id: 'beachLurker',
    name: 'Beach Lurker',
    baseLife: 18,
    baseDamage: 2,
    attackSpeed: 0.8,
    damageType: 'physical',
    experienceReward: 28,
    lootBonus: 1.1,
  },
  
  // Cave monsters (Maps 3-4) - ~30-40 HP base
  {
    id: 'caveSpider',
    name: 'Cave Spider',
    baseLife: 32,
    baseDamage: 3,
    attackSpeed: 0.9,
    damageType: 'physical',
    experienceReward: 45,
    lootBonus: 1.1,
  },
  {
    id: 'stalactiteBat',
    name: 'Stalactite Bat',
    baseLife: 24,
    baseDamage: 4,
    attackSpeed: 1.1,
    damageType: 'physical',
    experienceReward: 38,
    lootBonus: 1,
  },
  {
    id: 'deepCrawler',
    name: 'Deep Crawler',
    baseLife: 45,
    baseDamage: 3,
    attackSpeed: 0.5,
    damageType: 'cold',
    experienceReward: 52,
    lootBonus: 1.2,
  },
  
  // Shipwreck monsters (Maps 5-6) - ~40-60 HP base
  {
    id: 'pirateGhost',
    name: 'Pirate Ghost',
    baseLife: 48,
    baseDamage: 5,
    attackSpeed: 0.8,
    damageType: 'cold',
    experienceReward: 70,
    lootBonus: 1.2,
  },
  {
    id: 'barnacleGolem',
    name: 'Barnacle Golem',
    baseLife: 75,
    baseDamage: 4,
    attackSpeed: 0.4,
    damageType: 'physical',
    experienceReward: 85,
    lootBonus: 1.3,
  },
  {
    id: 'rottenDeckhand',
    name: 'Rotten Deckhand',
    baseLife: 42,
    baseDamage: 5,
    attackSpeed: 0.7,
    damageType: 'physical',
    experienceReward: 62,
    lootBonus: 1.15,
  },
  
  // Temple monsters (Maps 7-8) - ~60-90 HP base
  {
    id: 'templeGuardian',
    name: 'Temple Guardian',
    baseLife: 90,
    baseDamage: 7,
    attackSpeed: 0.5,
    damageType: 'lightning',
    experienceReward: 120,
    lootBonus: 1.4,
  },
  {
    id: 'sirenServant',
    name: 'Siren Servant',
    baseLife: 55,
    baseDamage: 8,
    attackSpeed: 0.9,
    damageType: 'cold',
    experienceReward: 100,
    lootBonus: 1.3,
  },
  {
    id: 'coralElemental',
    name: 'Coral Elemental',
    baseLife: 70,
    baseDamage: 6,
    attackSpeed: 0.6,
    damageType: 'physical',
    experienceReward: 95,
    lootBonus: 1.25,
  },
  
  // Abyss monsters (Maps 9-10) - ~80-120 HP base
  {
    id: 'abyssalHorror',
    name: 'Abyssal Horror',
    baseLife: 110,
    baseDamage: 10,
    attackSpeed: 0.6,
    damageType: 'cold',
    experienceReward: 175,
    lootBonus: 1.5,
  },
  {
    id: 'voidTentacle',
    name: 'Void Tentacle',
    baseLife: 65,
    baseDamage: 12,
    attackSpeed: 1.0,
    damageType: 'lightning',
    experienceReward: 140,
    lootBonus: 1.4,
  },
  {
    id: 'deepSeaLeviathan',
    name: 'Deep Sea Leviathan',
    baseLife: 140,
    baseDamage: 8,
    attackSpeed: 0.4,
    damageType: 'physical',
    experienceReward: 200,
    lootBonus: 1.6,
  },
];

// ============================================
// BOSSES - World 1
// ============================================

// Bosses should feel like a real challenge
// First boss at ~250 HP = ~100 seconds at level 1 (need gear!)
// Later bosses scale with expected player power

export const bosses: BossDefinition[] = [
  {
    id: 'drownedCaptain',
    name: 'The Drowned Captain',
    title: 'Terror of Twilight Beach',
    baseLife: 250,
    baseDamage: 6,
    attackSpeed: 0.8,
    damageType: 'physical',
    experienceReward: 250, // ~1 level worth for early game
    lootBonus: 3,
    guaranteedDrops: ['rustySword', 'leatherCap'],
    skills: drownedCaptainSkills,
  },
  {
    id: 'caveLurker',
    name: 'The Cave Lurker',
    title: 'Dweller in Darkness',
    baseLife: 450,
    baseDamage: 8,
    attackSpeed: 0.9,
    damageType: 'physical',
    experienceReward: 450,
    lootBonus: 3.5,
    guaranteedDrops: ['ironSword', 'chestplate'],
    skills: caveLurkerSkills,
  },
  {
    id: 'ghostAdmiral',
    name: 'Ghost Admiral',
    title: 'Specter of the Graveyard',
    baseLife: 700,
    baseDamage: 10,
    attackSpeed: 0.7,
    damageType: 'cold',
    experienceReward: 700,
    lootBonus: 4,
    guaranteedDrops: ['ironHelm', 'copperPlate'],
    skills: ghostAdmiralSkills,
  },
  {
    id: 'abyssalCrab',
    name: 'Abyssal Crab',
    title: 'Guardian of the Depths',
    baseLife: 1000,
    baseDamage: 12,
    attackSpeed: 0.6,
    damageType: 'physical',
    experienceReward: 1000,
    lootBonus: 4.5,
    guaranteedDrops: ['steelBlade', 'chainGloves'],
    skills: abyssalCrabSkills,
  },
  {
    id: 'templeGuardianBoss',
    name: 'Ancient Guardian',
    title: 'Protector of the Sunken Temple',
    baseLife: 1400,
    baseDamage: 15,
    attackSpeed: 0.6,
    damageType: 'lightning',
    experienceReward: 1400,
    lootBonus: 5,
    guaranteedDrops: ['steelHelmet', 'chainBoots'],
    skills: templeGuardianSkills,
  },
  {
    id: 'ruinedSentinel',
    name: 'Ruined Sentinel',
    title: 'Warden of Tidal Ruins',
    baseLife: 1900,
    baseDamage: 18,
    attackSpeed: 0.55,
    damageType: 'physical',
    experienceReward: 1900,
    lootBonus: 5.5,
    guaranteedDrops: ['warPlate', 'studdedBelt'],
    skills: ruinedSentinelSkills,
  },
  {
    id: 'sirenQueen',
    name: 'Siren Queen',
    title: 'Enchantress of the Deep',
    baseLife: 2500,
    baseDamage: 22,
    attackSpeed: 0.9,
    damageType: 'cold',
    experienceReward: 2500,
    lootBonus: 6,
    guaranteedDrops: ['mithrilSword', 'goldRing'],
    skills: sirenQueenSkills,
  },
  {
    id: 'youngKraken',
    name: 'Young Kraken',
    title: 'Terror of Kraken\'s Rest',
    baseLife: 3200,
    baseDamage: 28,
    attackSpeed: 0.65,
    damageType: 'physical',
    experienceReward: 3500,
    lootBonus: 7,
    guaranteedDrops: ['plateHelm', 'plateGauntlets'],
    skills: youngKrakenSkills,
  },
  {
    id: 'abyssalLord',
    name: 'Abyssal Lord',
    title: 'Ruler of the Deep',
    baseLife: 4200,
    baseDamage: 35,
    attackSpeed: 0.6,
    damageType: 'cold',
    experienceReward: 5000,
    lootBonus: 8,
    guaranteedDrops: ['plateBoots', 'heavyBelt'],
    skills: abyssalLordSkills,
  },
  {
    id: 'leviathan',
    name: 'Leviathan',
    title: 'World Boss - The Ancient One',
    baseLife: 8000,
    baseDamage: 50,
    attackSpeed: 0.5,
    damageType: 'lightning',
    experienceReward: 15000,
    lootBonus: 15,
    guaranteedDrops: ['demonBlade', 'rubyRing', 'sapphireRing', 'topazRing'],
    skills: leviathanSkills,
  },
];

export const monsterById = new Map(monsters.map(m => [m.id, m]));
export const bossById = new Map(bosses.map(b => [b.id, b]));
