import { create } from 'zustand';
import type { 
  GameState, 
  Player, 
  CurrencyType, 
  EquipmentSlot,
  CombatLogEntry,
  Flask,
  GameScreen,
  PlayerSkill,
} from '../types';
import { 
  getDefaultPlayerStats, 
  getExperienceForLevel,
  calculatePlayerDamage,
  calculateMonsterDamage,
  checkLevelUp,
  computePlayerStats,
} from '../lib/combat';
import { generateLoot } from '../lib/loot';
import { spawnMapMonster, spawnBoss, getNextPositionIndex, getBestTarget, isInMeleeRange } from '../lib/monsters';
import { mapById, maps, bossById, skillById, starterSkillIds } from '../data';

let logIdCounter = 0;
const generateLogId = () => `log_${Date.now()}_${logIdCounter++}`;

const DEFAULT_SPAWN_INTERVAL = 3;
const MAX_MONSTERS = 5;
const FLASK_AUTO_USE_THRESHOLD = 0.5;

function createLifeFlask(): Flask {
  return {
    id: 'life_flask_1',
    name: 'Small Life Flask',
    type: 'life',
    lifeRestore: 60,
    manaRestore: 0,
    duration: 3,
    maxCharges: 3,
    currentCharges: 3,
    chargesPerUse: 1,
    chargesOnKill: 1,
    isActive: false,
    remainingDuration: 0,
  };
}

function createStarterSkills(): (PlayerSkill | null)[] {
  const skills: (PlayerSkill | null)[] = [];
  
  for (let i = 0; i < 6; i++) {
    if (i < starterSkillIds.length) {
      skills.push({
        definitionId: starterSkillIds[i],
        level: 1,
        currentCooldown: 0,
        isActive: true, // All starter skills are active by default
      });
    } else {
      skills.push(null);
    }
  }
  
  return skills;
}

function createManaFlask(): Flask {
  return {
    id: 'mana_flask_1',
    name: 'Small Mana Flask',
    type: 'mana',
    lifeRestore: 0,
    manaRestore: 40,
    duration: 3,
    maxCharges: 3,
    currentCharges: 3,
    chargesPerUse: 1,
    chargesOnKill: 1,
    isActive: false,
    remainingDuration: 0,
  };
}

function createInitialPlayer(): Player {
  const currencies: Record<CurrencyType, number> = {
    transmutation: 5,
    alteration: 5,
    augmentation: 2,
    alchemy: 1,
    chaos: 0,
    exalted: 0,
    divine: 0,
    scouring: 1,
  };

  const stats = getDefaultPlayerStats();

  return {
    name: 'Exile',
    level: 1,
    experience: 0,
    experienceToNextLevel: getExperienceForLevel(1), // XP needed to go from level 1 to 2
    currentLife: stats.maxLife,
    currentMana: stats.maxMana,
    stats,
    equipment: {
      weapon: null,
      offhand: null,
      helmet: null,
      bodyArmor: null,
      gloves: null,
      boots: null,
      belt: null,
      amulet: null,
      ring1: null,
      ring2: null,
    },
    flasks: [createLifeFlask(), createManaFlask(), null, null, null], // 5 flask slots, 2 starter flasks
    skills: createStarterSkills(), // 6 skill slots
    inventory: [],
    inventorySize: 30,
    currency: currencies,
  };
}

function createInitialGameState(): GameState {
  return {
    player: createInitialPlayer(),
    
    currentScreen: 'town',
    currentMapId: null,
    combatState: 'idle',
    monsters: [],
    isBossFight: false,
    bossReady: false, // Boss is ready to be challenged
    spawnTimer: 0,
    spawnInterval: DEFAULT_SPAWN_INTERVAL,
    maxMonsters: MAX_MONSTERS,
    playerAttackCooldown: 0, // Ready to attack immediately
    
    unlockedMapIds: ['twilightBeach'],
    mapProgress: {
      twilightBeach: {
        mapId: 'twilightBeach',
        killCount: 0,
        bossDefeated: false,
        timesCleared: 0,
        autoBossSpawn: false, // Only available after first clear
      },
    },
    combatLog: [],
    lastTickTime: Date.now(),
    totalPlayTime: 0,
  };
}

interface GameStore extends GameState {
  navigateTo: (screen: GameScreen) => void;
  selectMap: (mapId: string) => void;
  stopFarming: () => void;
  gameTick: (deltaTime: number) => void;
  startBossFight: () => void;
  toggleAutoBossSpawn: () => void;
  equipItem: (itemId: string, slot?: EquipmentSlot) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  sellItem: (itemId: string) => void;
  addLog: (type: CombatLogEntry['type'], message: string, value?: number) => void;
  clearLog: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialGameState(),
  
  navigateTo: (screen: GameScreen) => {
    // Just navigate - combat continues in background
    // Only stopFarming() explicitly stops combat
    set({ currentScreen: screen });
  },
  
  selectMap: (mapId: string) => {
    const state = get();
    if (!state.unlockedMapIds.includes(mapId)) return;
    
    const map = mapById.get(mapId);
    if (!map) return;
    
    if (!state.mapProgress[mapId]) {
      set({
        mapProgress: {
          ...state.mapProgress,
          [mapId]: {
            mapId,
            killCount: 0,
            bossDefeated: false,
            timesCleared: 0,
            autoBossSpawn: false,
          },
        },
      });
    }
    
    const monster = spawnMapMonster(mapId, 0);
    
    set({
      currentScreen: 'combat',
      currentMapId: mapId,
      combatState: 'fighting',
      monsters: monster ? [monster] : [],
      isBossFight: false,
      bossReady: false,
      spawnTimer: DEFAULT_SPAWN_INTERVAL,
      playerAttackCooldown: 0,
    });
    
    get().addLog('playerHit', `Entered ${map.name}`);
  },
  
  stopFarming: () => {
    set({
      currentScreen: 'town',
      currentMapId: null,
      combatState: 'idle',
      monsters: [],
      isBossFight: false,
      bossReady: false,
      spawnTimer: 0,
      playerAttackCooldown: 0,
    });
    get().addLog('playerHit', 'Returned to town');
  },
  
  startBossFight: () => {
    const state = get();
    if (!state.bossReady || !state.currentMapId) return;
    
    const map = mapById.get(state.currentMapId);
    if (!map) return;
    
    const boss = spawnBoss(map.bossId, map.monsterLevel);
    if (boss) {
      set({
        monsters: [boss],
        isBossFight: true,
        bossReady: false,
      });
      get().addLog('monsterDeath', `⚠️ BOSS FIGHT STARTED: ${boss.name}!`);
    }
  },
  
  toggleAutoBossSpawn: () => {
    const state = get();
    if (!state.currentMapId) return;
    
    const mapProgress = state.mapProgress[state.currentMapId];
    if (!mapProgress || mapProgress.timesCleared === 0) {
      // Can only toggle after first clear
      get().addLog('playerHit', 'Defeat the boss once to unlock auto-spawn!');
      return;
    }
    
    set({
      mapProgress: {
        ...state.mapProgress,
        [state.currentMapId]: {
          ...mapProgress,
          autoBossSpawn: !mapProgress.autoBossSpawn,
        },
      },
    });
    
    const newValue = !mapProgress.autoBossSpawn;
    get().addLog('playerHit', `Auto boss spawn: ${newValue ? 'ON' : 'OFF'}`);
  },
  
  gameTick: (deltaTime: number) => {
    const state = get();
    
    if (state.combatState !== 'fighting' || !state.currentMapId) {
      return;
    }
    
    const map = mapById.get(state.currentMapId);
    if (!map) return;
    
    let monsters = state.monsters.map(m => ({ ...m }));
    let player = { ...state.player };
    const mapProgress = { ...state.mapProgress[state.currentMapId] };
    let unlockedMapIds = [...state.unlockedMapIds];
    let spawnTimer = state.spawnTimer;
    let isBossFight = state.isBossFight;
    let bossReady = state.bossReady;
    
    const playerStats = computePlayerStats(player);
    
    // ============================================
    // SPAWN NEW MONSTERS
    // ============================================
    
    spawnTimer -= deltaTime;
    
    const shouldForceSpawn = monsters.length === 0 && !isBossFight && !bossReady;
    const bossConditionMet = mapProgress.killCount >= map.killsRequired && !mapProgress.bossDefeated && !isBossFight;
    
    if (bossConditionMet && !bossReady) {
      bossReady = true;
      get().addLog('monsterDeath', `⚠️ BOSS READY! Click "Challenge Boss" when ready!`);
      
      if (mapProgress.autoBossSpawn && mapProgress.timesCleared > 0) {
        const boss = spawnBoss(map.bossId, map.monsterLevel);
        if (boss) {
          monsters = [boss];
          isBossFight = true;
          bossReady = false;
          get().addLog('monsterDeath', `⚠️ BOSS APPROACHING: ${boss.name}!`);
        }
      }
    }
    
    if (!isBossFight && monsters.length < state.maxMonsters && (spawnTimer <= 0 || shouldForceSpawn)) {
      const positionIndex = getNextPositionIndex(monsters);
      const newMonster = spawnMapMonster(state.currentMapId, positionIndex);
      if (newMonster) {
        monsters = [...monsters, newMonster];
      }
      
      spawnTimer = state.spawnInterval;
    }
    
    // ============================================
    // MONSTER MOVEMENT - Monsters walk towards player
    // ============================================
    
    monsters = monsters.map(m => {
      if (m.distance > 0) {
        const newDistance = Math.max(0, m.distance - m.moveSpeed * deltaTime);
        return { ...m, distance: newDistance };
      }
      return m;
    });
    
    // ============================================
    // COMBAT - Discrete attack system (integer damage)
    // ============================================
    
    const deadMonsterIds: string[] = [];
    let totalMonsterDamage = 0;
    
    // Get the best target for player (rarity priority, then lowest HP, must be in range)
    const targetMonster = getBestTarget(monsters);
    const monstersInRange = monsters.filter(m => isInMeleeRange(m) && m.currentLife > 0);
    
    // ========== UPDATE SKILL COOLDOWNS ==========
    const updatedSkills = player.skills.map(skill => {
      if (!skill) return null;
      return {
        ...skill,
        currentCooldown: Math.max(0, skill.currentCooldown - deltaTime),
      };
    });
    player = { ...player, skills: updatedSkills };
    
    // ========== PLAYER SKILL USAGE ==========
    let playerAttackCooldown = state.playerAttackCooldown - deltaTime;
    const skillDamageMap: Map<string, number> = new Map(); // monster id -> damage
    let lifestealAmount = 0;
    
    if (targetMonster && playerAttackCooldown <= 0) {
      // Priority: AOE skills if multiple targets, then highest damage skill that's ready
      let bestSkill: PlayerSkill | null = null;
      let bestSkillDef = null;
      
      for (const skill of player.skills) {
        if (!skill || !skill.isActive) continue;
        if (skill.currentCooldown > 0) continue;
        
        const skillDef = skillById.get(skill.definitionId);
        if (!skillDef) continue;
        if (skillDef.manaCost > player.currentMana) continue;
        
        const isAoe = (skillDef.aoeRadius && skillDef.aoeRadius > 1);
        const isBetterAoe = isAoe && monstersInRange.length > 1;
        const currentBestIsAoe = bestSkillDef?.aoeRadius && bestSkillDef.aoeRadius > 1;
        
        if (!bestSkill || 
            (isBetterAoe && !currentBestIsAoe) ||
            (skillDef.damageMultiplier + (skillDef.addedDamageMax || 0) / 10 > 
             (bestSkillDef?.damageMultiplier || 0) + ((bestSkillDef?.addedDamageMax || 0) / 10))) {
          bestSkill = skill;
          bestSkillDef = skillDef;
        }
      }
      
      if (bestSkill && bestSkillDef) {
        const { damage: weaponDamage, isCrit } = calculatePlayerDamage(player);
        
        let skillDamage = weaponDamage * bestSkillDef.damageMultiplier;
        
        if (bestSkillDef.addedDamageMin !== undefined && bestSkillDef.addedDamageMax !== undefined) {
          const addedDamage = bestSkillDef.addedDamageMin + 
            Math.random() * (bestSkillDef.addedDamageMax - bestSkillDef.addedDamageMin);
          skillDamage += addedDamage;
        }
        
        if (bestSkillDef.critBonusChance && !isCrit) {
          const bonusCritRoll = Math.random() * 100;
          if (bonusCritRoll < bestSkillDef.critBonusChance) {
            skillDamage *= playerStats.criticalMultiplier / 100;
          }
        }
        
        if (isCrit && bestSkillDef.damageMultiplier > 0) {
          // Crit already applied in calculatePlayerDamage for weapon portion
        }
        
        const numHits = bestSkillDef.numberOfHits || 1;
        skillDamage *= numHits;
        
        const maxTargets = bestSkillDef.aoeRadius || 1;
        const targets = monstersInRange.slice(0, maxTargets);
        
        for (const target of targets) {
          const damageToTarget = Math.round(skillDamage);
          skillDamageMap.set(target.id, (skillDamageMap.get(target.id) || 0) + damageToTarget);
          
          if (bestSkillDef.lifestealPercent) {
            lifestealAmount += Math.round(damageToTarget * bestSkillDef.lifestealPercent / 100);
          }
        }
        
        player.currentMana = Math.max(0, player.currentMana - bestSkillDef.manaCost);
        
        const skillIndex = player.skills.findIndex(s => s?.definitionId === bestSkill!.definitionId);
        if (skillIndex >= 0 && player.skills[skillIndex]) {
          player.skills[skillIndex] = {
            ...player.skills[skillIndex]!,
            currentCooldown: bestSkillDef.cooldown,
          };
        }
        
        if (bestSkillDef.id !== 'defaultAttack' && targets.length > 0) {
          const totalDamage = Array.from(skillDamageMap.values()).reduce((a, b) => a + b, 0);
          if (targets.length > 1) {
            get().addLog('playerHit', `${bestSkillDef.icon} ${bestSkillDef.name} hits ${targets.length} enemies!`, totalDamage);
          } else {
            get().addLog('playerHit', `${bestSkillDef.icon} ${bestSkillDef.name}!`, totalDamage);
          }
        }
        
        if (lifestealAmount > 0) {
          player.currentLife = Math.min(playerStats.maxLife, player.currentLife + lifestealAmount);
          get().addLog('playerHit', `💚 Lifesteal heals for ${lifestealAmount}!`);
        }
        
        playerAttackCooldown = 1 / playerStats.attackSpeed;
      } else {
        const { damage: baseDamage } = calculatePlayerDamage(player);
        skillDamageMap.set(targetMonster.id, Math.round(baseDamage));
        playerAttackCooldown = 1 / playerStats.attackSpeed;
      }
    }
    
    monsters = monsters.map(m => {
      let updatedMonster = { ...m };
      const inRange = isInMeleeRange(updatedMonster);
      
      const damageToThisMonster = skillDamageMap.get(updatedMonster.id) || 0;
      if (damageToThisMonster > 0) {
        updatedMonster.currentLife -= damageToThisMonster;
      }
      
      if (updatedMonster.currentLife > 0 && inRange) {
        updatedMonster.attackCooldown = Math.max(0, updatedMonster.attackCooldown - deltaTime);
        
        if (updatedMonster.attackCooldown <= 0) {
          const damageResult = calculateMonsterDamage(updatedMonster, player);
          
          if (damageResult.evaded) {
            get().addLog('evade', `🌀 Evaded ${updatedMonster.name}'s attack!`);
          } else if (damageResult.blocked) {
            get().addLog('block', `🛡️ Blocked ${updatedMonster.name}'s attack!`);
          } else {
            totalMonsterDamage += damageResult.damage;
          }
          
          updatedMonster.attackCooldown = 1 / updatedMonster.attackSpeed;
        }
        
        if (updatedMonster.rarity === 'boss' && updatedMonster.skillStates) {
          const bossDefinition = bossById.get(updatedMonster.definitionId);
          
          if (bossDefinition) {
            updatedMonster.skillStates = updatedMonster.skillStates.map(skillState => {
              const newSkillState = { ...skillState };
              
              newSkillState.currentCooldown = Math.max(0, newSkillState.currentCooldown - deltaTime);
              
              if (newSkillState.currentCooldown <= 0) {
                const skill = bossDefinition.skills.find(s => s.id === skillState.skillId);
                if (skill) {
                  const baseSkillDamage = updatedMonster.damage * skill.damageMultiplier;
                  const skillResult = calculateMonsterDamage(
                    updatedMonster, 
                    player, 
                    baseSkillDamage,
                    updatedMonster.damageType
                  );
                  
                  if (skillResult.evaded) {
                    get().addLog('evade', `🌀 Evaded ${skill.name}!`);
                  } else if (skillResult.blocked) {
                    get().addLog('block', `🛡️ Blocked ${skill.name}!`);
                  } else {
                    totalMonsterDamage += skillResult.damage;
                    get().addLog('monsterHit', `💥 ${updatedMonster.name} uses ${skill.name}!`, skillResult.damage);
                  }
                  
                  newSkillState.currentCooldown = skill.cooldown;
                }
              }
              
              return newSkillState;
            });
          }
        }
      }
      
      return updatedMonster;
    });
    
    // Apply total monster damage as integer
    if (totalMonsterDamage > 0) {
      player.currentLife -= totalMonsterDamage;
    }
    
    // ============================================
    // FLASK SYSTEM - Auto-use and process active flasks
    // ============================================
    
    player.flasks = player.flasks.map(flask => {
      if (!flask || !flask.isActive) return flask;
      
      const newFlask = { ...flask };
      const tickRestore = deltaTime / flask.duration;
      
      if (flask.type === 'life' || flask.type === 'hybrid') {
        const lifeRestoreThisTick = flask.lifeRestore * tickRestore;
        player.currentLife = Math.min(playerStats.maxLife, player.currentLife + lifeRestoreThisTick);
      }
      if (flask.type === 'mana' || flask.type === 'hybrid') {
        const manaRestoreThisTick = flask.manaRestore * tickRestore;
        player.currentMana = Math.min(playerStats.maxMana, player.currentMana + manaRestoreThisTick);
      }
      
      newFlask.remainingDuration -= deltaTime;
      if (newFlask.remainingDuration <= 0) {
        newFlask.isActive = false;
        newFlask.remainingDuration = 0;
      }
      
      return newFlask;
    });
    
    const hpPercent = player.currentLife / playerStats.maxLife;
    if (hpPercent < FLASK_AUTO_USE_THRESHOLD) {
      const lifeFlask = player.flasks.find(f => 
        f && (f.type === 'life' || f.type === 'hybrid') && 
        f.currentCharges >= f.chargesPerUse && !f.isActive
      );
      if (lifeFlask) {
        lifeFlask.currentCharges -= lifeFlask.chargesPerUse;
        lifeFlask.isActive = true;
        lifeFlask.remainingDuration = lifeFlask.duration;
      }
    }
    
    const manaPercent = player.currentMana / playerStats.maxMana;
    if (manaPercent < FLASK_AUTO_USE_THRESHOLD) {
      const manaFlask = player.flasks.find(f => 
        f && (f.type === 'mana' || f.type === 'hybrid') && 
        f.currentCharges >= f.chargesPerUse && !f.isActive
      );
      if (manaFlask) {
        manaFlask.currentCharges -= manaFlask.chargesPerUse;
        manaFlask.isActive = true;
        manaFlask.remainingDuration = manaFlask.duration;
      }
    }
    
    const lifeRegenAmount = playerStats.lifeRegeneration * deltaTime;
    const manaRegenAmount = playerStats.manaRegeneration * deltaTime;
    player.currentLife = Math.min(playerStats.maxLife, player.currentLife + lifeRegenAmount);
    player.currentMana = Math.min(playerStats.maxMana, player.currentMana + manaRegenAmount);
    
    // ============================================
    // CHECK FOR DEAD MONSTERS
    // ============================================
    
    monsters.forEach(monster => {
      if (monster.currentLife <= 0) {
        deadMonsterIds.push(monster.id);
        
        const loot = generateLoot(monster);
        
        player.experience += loot.experience;
        
        player.flasks = player.flasks.map(flask => {
          if (!flask) return flask;
          return {
            ...flask,
            currentCharges: Math.min(flask.maxCharges, flask.currentCharges + flask.chargesOnKill),
          };
        });
        
        const levelUpResult = checkLevelUp(player);
        if (levelUpResult.leveled) {
          player.level = levelUpResult.newLevel;
          player.stats = levelUpResult.newStats;
          player.experienceToNextLevel = levelUpResult.newExpToNext;
          player.experience = player.experience - get().player.experienceToNextLevel;
          const newStats = computePlayerStats(player);
          player.currentLife = newStats.maxLife;
          player.currentMana = newStats.maxMana;
          get().addLog('levelUp', `Level up! Now level ${player.level}`, player.level);
        }
        
        // Add items to inventory
        loot.items.forEach(item => {
          if (player.inventory.length < player.inventorySize) {
            player.inventory = [...player.inventory, item];
            get().addLog('loot', `Found: ${item.name}`, item.itemLevel);
          }
        });
        
        Object.entries(loot.currency).forEach(([currency, amount]) => {
          if (amount) {
            player.currency = {
              ...player.currency,
              [currency as CurrencyType]: player.currency[currency as CurrencyType] + amount,
            };
          }
        });
        
        if (monster.rarity !== 'boss') {
          mapProgress.killCount++;
        }
        
        if (monster.rarity === 'boss') {
          mapProgress.bossDefeated = true;
          mapProgress.timesCleared++;
          isBossFight = false;
          
          get().addLog('monsterDeath', `🏆 BOSS DEFEATED: ${monster.name}!`, loot.experience);
          
          const nextMap = maps.find(m => m.requiredMapId === state.currentMapId);
          if (nextMap && !unlockedMapIds.includes(nextMap.id)) {
            unlockedMapIds = [...unlockedMapIds, nextMap.id];
            get().addLog('loot', `🗺️ Unlocked new area: ${nextMap.name}!`);
          }
          
          mapProgress.killCount = 0;
          mapProgress.bossDefeated = false;
          spawnTimer = 0.5;
        }
      }
    });
    
    monsters = monsters.filter(m => !deadMonsterIds.includes(m.id));
    
    // ============================================
    // CHECK IF PLAYER DIED
    // ============================================
    
    if (player.currentLife <= 0) {
      const respawnStats = computePlayerStats(player);
      player.currentLife = respawnStats.maxLife;
      player.currentMana = respawnStats.maxMana;
      
      player.flasks = player.flasks.map(flask => {
        if (!flask) return flask;
        return { ...flask, currentCharges: flask.maxCharges, isActive: false, remainingDuration: 0 };
      });
      
      get().addLog('playerDeath', '💀 You died! Respawning...');
      
      set({
        player,
        combatState: 'idle',
        currentMapId: null,
        monsters: [],
        isBossFight: false,
        bossReady: false,
        spawnTimer: 0,
        playerAttackCooldown: 0,
      });
      
      return;
    }
    
    // ============================================
    // UPDATE STATE
    // ============================================
    
    set({
      player,
      monsters,
      isBossFight,
      bossReady,
      spawnTimer,
      playerAttackCooldown,
      mapProgress: {
        ...get().mapProgress,
        [state.currentMapId]: mapProgress,
      },
      unlockedMapIds,
      totalPlayTime: state.totalPlayTime + deltaTime,
    });
  },
  
  equipItem: (itemId: string, slot?: EquipmentSlot) => {
    const state = get();
    const itemIndex = state.player.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    const item = state.player.inventory[itemIndex];
    const targetSlot = slot || item.slot;
    
    const currentEquipped = state.player.equipment[targetSlot];
    
    let newInventory = state.player.inventory.filter(i => i.id !== itemId);
    if (currentEquipped) {
      newInventory = [...newInventory, currentEquipped];
    }
    
    set({
      player: {
        ...state.player,
        equipment: {
          ...state.player.equipment,
          [targetSlot]: item,
        },
        inventory: newInventory,
      },
    });
  },
  
  unequipItem: (slot: EquipmentSlot) => {
    const state = get();
    const item = state.player.equipment[slot];
    if (!item) return;
    
    if (state.player.inventory.length >= state.player.inventorySize) {
      get().addLog('loot', 'Inventory full!');
      return;
    }
    
    set({
      player: {
        ...state.player,
        equipment: {
          ...state.player.equipment,
          [slot]: null,
        },
        inventory: [...state.player.inventory, item],
      },
    });
  },
  
  sellItem: (itemId: string) => {
    const state = get();
    const item = state.player.inventory.find(i => i.id === itemId);
    if (!item) return;
    
    const currencyReward: Partial<Record<CurrencyType, number>> = {
      normal: {},
      magic: { transmutation: 1 },
      rare: { alteration: 2 },
      unique: { alchemy: 1 },
    }[item.rarity] || {};
    
    const newCurrency = { ...state.player.currency };
    Object.entries(currencyReward).forEach(([currency, amount]) => {
      newCurrency[currency as CurrencyType] += amount || 0;
    });
    
    set({
      player: {
        ...state.player,
        inventory: state.player.inventory.filter(i => i.id !== itemId),
        currency: newCurrency,
      },
    });
  },
  
  addLog: (type, message, value) => {
    const entry: CombatLogEntry = {
      id: generateLogId(),
      timestamp: Date.now(),
      type,
      message,
      value,
    };
    
    set(state => ({
      combatLog: [entry, ...state.combatLog].slice(0, 50),
    }));
  },
  
  clearLog: () => {
    set({ combatLog: [] });
  },
  
  resetGame: () => {
    set(createInitialGameState());
  },
}));
