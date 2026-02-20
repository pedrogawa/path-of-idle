// ============================================
// CORE ENUMS
// ============================================

export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique';

export type EquipmentSlot = 
  | 'weapon' 
  | 'offhand'
  | 'helmet' 
  | 'bodyArmor' 
  | 'gloves' 
  | 'boots' 
  | 'belt' 
  | 'amulet'
  | 'ring1' 
  | 'ring2';

export type AffixType = 'prefix' | 'suffix';

export type MonsterRarity = 'normal' | 'magic' | 'rare' | 'boss';

export type CurrencyType = 
  | 'transmutation'  // Normal → Magic
  | 'alteration'     // Reroll Magic
  | 'augmentation'   // Add affix to Magic
  | 'alchemy'        // Normal → Rare
  | 'chaos'          // Reroll Rare
  | 'exalted'        // Add affix to Rare
  | 'divine'         // Reroll values
  | 'scouring';      // Remove all affixes

export type DamageType = 'physical' | 'fire' | 'cold' | 'lightning';

// ============================================
// AFFIXES
// ============================================

export interface AffixTier {
  tier: number;
  minValue: number;
  maxValue: number;
  requiredItemLevel: number;
}

export interface AffixDefinition {
  id: string;
  name: string;
  type: AffixType;
  statKey: keyof PlayerStats;
  tiers: AffixTier[];
  isPercentage: boolean;
  applicableSlots: EquipmentSlot[];
}

export interface Affix {
  definitionId: string;
  tier: number;
  value: number;
}

// ============================================
// ITEMS
// ============================================

export interface ItemBase {
  id: string;
  name: string;
  slot: EquipmentSlot;
  baseStats: Partial<PlayerStats>;
  requiredLevel: number;
  dropLevel: number;
}

export interface Item {
  id: string;
  baseId: string;
  name: string;
  slot: EquipmentSlot;
  itemLevel: number;
  rarity: ItemRarity;
  prefixes: Affix[];
  suffixes: Affix[];
  // Computed from base + affixes
  stats: Partial<PlayerStats>;
}

export interface UniqueItem extends Item {
  rarity: 'unique';
  uniqueId: string;
  flavor: string;
  fixedAffixes: Affix[];
}

// ============================================
// PLAYER
// ============================================

export interface PlayerStats {
  // Attributes (core stats that affect other stats)
  strength: number;      // +2 life per 10 str, +2% melee phys per 10 str
  dexterity: number;     // +2 accuracy per 1 dex, +2% evasion per 5 dex
  intelligence: number;  // +2 mana per 10 int, +2% increased elemental damage per 10 int
  
  // Offensive
  physicalDamageMin: number;
  physicalDamageMax: number;
  fireDamageMin: number;
  fireDamageMax: number;
  coldDamageMin: number;
  coldDamageMax: number;
  lightningDamageMin: number;
  lightningDamageMax: number;
  attackSpeed: number; // Base attacks per second
  increasedAttackSpeed: number; // Percentage modifier (e.g., 5 = +5%)
  criticalChance: number;
  criticalMultiplier: number;
  increasedPhysicalDamage: number;
  increasedFireDamage: number;
  increasedColdDamage: number;
  increasedLightningDamage: number;
  accuracy: number;      // Hit chance calculation vs evasion
  
  // Defensive
  maxLife: number;
  maxMana: number;
  armor: number;
  evasion: number;       // Chance to dodge attacks
  blockChance: number;   // Chance to block (shields)
  fireResistance: number;
  coldResistance: number;
  lightningResistance: number;
  lifeRegeneration: number;
  manaRegeneration: number;
}

// ============================================
// FLASKS
// ============================================

export type FlaskType = 'life' | 'mana' | 'hybrid';

export interface Flask {
  id: string;
  name: string;
  type: FlaskType;
  
  // Amount restored
  lifeRestore: number;
  manaRestore: number;
  
  // Duration and charges
  duration: number; // Seconds over which it restores
  maxCharges: number;
  currentCharges: number;
  chargesPerUse: number;
  chargesOnKill: number; // Charges gained when killing a monster
  
  // State
  isActive: boolean;
  remainingDuration: number;
}

export interface Player {
  name: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  
  currentLife: number;
  currentMana: number;
  stats: PlayerStats;
  
  equipment: Record<EquipmentSlot, Item | null>;
  flasks: (Flask | null)[]; // 5 flask slots
  skills: (PlayerSkill | null)[]; // 6 skill slots
  inventory: Item[];
  inventorySize: number;
  
  currency: Record<CurrencyType, number>;
}

// ============================================
// MONSTERS
// ============================================

export interface MonsterDefinition {
  id: string;
  name: string;
  baseLife: number;
  baseDamage: number;
  attackSpeed: number;
  damageType: DamageType;
  experienceReward: number;
  lootBonus: number; // Multiplier for drop rates
}

export interface Monster {
  id: string; // Unique instance ID
  definitionId: string;
  name: string;
  level: number;
  rarity: MonsterRarity;
  
  maxLife: number;
  currentLife: number;
  damage: number;
  attackSpeed: number; // Attacks per second
  damageType: DamageType;
  
  experienceReward: number;
  lootBonus: number;
  
  // Position in arena (for multi-monster support)
  positionIndex: number;
  
  // Distance from player (0 = melee range, starts at 100)
  distance: number;
  moveSpeed: number; // Units per second
  
  // Attack timing (for discrete attacks, not DPS)
  attackCooldown: number; // Seconds until next attack (0 = ready to attack)
  
  // Boss-specific: skill cooldowns (only present for bosses)
  skillStates?: BossSkillState[];
}

// ============================================
// BOSS SKILLS
// ============================================

export type BossSkillType = 'slam' | 'cleave' | 'projectile' | 'aoe' | 'buff' | 'summon';

// ============================================
// PLAYER SKILLS
// ============================================

export type SkillType = 'attack' | 'spell' | 'buff' | 'aura';
export type SkillTargeting = 'single' | 'aoe' | 'self' | 'cone';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji for now
  type: SkillType;
  targeting: SkillTargeting;
  
  // Damage
  damageMultiplier: number; // Multiplier on weapon damage (1.0 = 100%)
  damageType: DamageType;
  addedDamageMin?: number; // Flat added damage
  addedDamageMax?: number;
  
  // Cost & Cooldown
  manaCost: number;
  cooldown: number; // Seconds
  
  // Special effects
  aoeRadius?: number; // Hits multiple monsters if > 0
  numberOfHits?: number; // Multi-strike (default 1)
  critBonusChance?: number; // Added crit chance
  lifestealPercent?: number; // % of damage returned as life
  
  // Requirements
  requiredLevel: number;
  
  // Visual
  color: string; // For skill effects
}

export interface PlayerSkill {
  definitionId: string;
  level: number; // Skill level (1-20)
  currentCooldown: number; // 0 = ready to use
  isActive: boolean; // Is this skill enabled for auto-use
}

export interface SkillSlot {
  skill: PlayerSkill | null;
  slotIndex: number; // 0-5 (6 skill slots)
}

export interface BossSkill {
  id: string;
  name: string;
  description: string;
  damageMultiplier: number; // Multiplier on base damage (e.g., 3 = 300% damage)
  cooldown: number; // Seconds between uses
  skillType: BossSkillType;
  // Visual/animation hint for the UI
  color?: string;
}

export interface BossDefinition extends MonsterDefinition {
  title: string;
  guaranteedDrops: string[]; // Item base IDs
  skills: BossSkill[]; // Boss abilities
}

// Runtime boss skill state
export interface BossSkillState {
  skillId: string;
  currentCooldown: number; // 0 = ready to use
}

// ============================================
// MAPS
// ============================================

export interface GameMap {
  id: string;
  name: string;
  worldId: number;
  order: number;
  monsterLevel: number;
  
  // Unlock requirements
  requiredMapId: string | null;
  
  // Monsters
  monsterPool: string[]; // MonsterDefinition IDs
  killsRequired: number;
  bossId: string;
  
  // Theming
  description: string;
  biome: string;
}

// ============================================
// GAME STATE
// ============================================

export type GameScreen = 'town' | 'worldMap' | 'combat' | 'character';

export type CombatState = 'idle' | 'fighting' | 'looting' | 'dead';

export interface MapProgress {
  mapId: string;
  killCount: number;
  bossDefeated: boolean;
  timesCleared: number;
  autoBossSpawn: boolean; // Auto-start boss after kill threshold (only after first clear)
}

export interface GameState {
  player: Player;
  
  // Navigation
  currentScreen: GameScreen;
  
  // Current activity
  currentMapId: string | null;
  combatState: CombatState;
  
  // Multi-monster support
  monsters: Monster[];
  isBossFight: boolean;
  bossReady: boolean; // Boss can be challenged (kill threshold reached)
  spawnTimer: number; // Seconds until next monster spawns
  spawnInterval: number; // How often monsters spawn (seconds)
  maxMonsters: number; // Max monsters at once (not during boss)
  playerAttackCooldown: number; // Seconds until player can attack again
  
  // Progression
  unlockedMapIds: string[];
  mapProgress: Record<string, MapProgress>;
  
  // Combat log
  combatLog: CombatLogEntry[];
  
  // Timestamps
  lastTickTime: number;
  totalPlayTime: number;
}

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  type: 'playerHit' | 'monsterHit' | 'playerCrit' | 'monsterDeath' | 'playerDeath' | 'loot' | 'levelUp' | 'evade' | 'block' | 'skillUse';
  message: string;
  value?: number;
}

// ============================================
// LOOT
// ============================================

export interface LootTable {
  mapId: string;
  itemBases: WeightedDrop<string>[];
  currencyDrops: WeightedDrop<CurrencyType>[];
}

export interface WeightedDrop<T> {
  item: T;
  weight: number;
  minMonsterLevel?: number;
}

export interface LootResult {
  items: Item[];
  currency: Partial<Record<CurrencyType, number>>;
  experience: number;
}

// ============================================
// COMPUTED TYPES
// ============================================

export interface ComputedPlayerStats extends PlayerStats {
  dps: number;
  averageHit: number;
  effectiveHp: number;
}
