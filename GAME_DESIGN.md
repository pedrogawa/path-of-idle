# 🎮 Idle ARPG - Game Design Document

## Overview

An idle ARPG inspired by Path of Exile, featuring map progression, monster hunting, loot drops, and a deep crafting system.

---

## The Core Loop

The magic of idle games is **"numbers go up"** + **meaningful choices**:

1. **Visible Progress** - HP bars depleting, damage numbers, loot popping, kill counters
2. **Meaningful Decisions** - Gear choices, map farming strategies, crafting gambles

---

## 📍 World 1: "The Corrupted Shores" (10 Maps)

| Map | Name | Monster Level | Unlock Condition | Boss |
|-----|------|---------------|------------------|------|
| 1 | Twilight Beach | 1 | Start | Drowned Captain |
| 2 | Flooded Caves | 3 | Beat Map 1 Boss | Cave Lurker |
| 3 | Shipwreck Graveyard | 5 | Beat Map 2 Boss | Ghost Admiral |
| 4 | Coral Depths | 8 | Beat Map 3 Boss | Abyssal Crab |
| 5 | Sunken Temple | 11 | Beat Map 4 Boss | Temple Guardian |
| 6 | Tidal Ruins | 15 | Beat Map 5 Boss | Ruined Sentinel |
| 7 | Siren's Lair | 19 | Beat Map 6 Boss | Siren Queen |
| 8 | Kraken's Rest | 24 | Beat Map 7 Boss | Young Kraken |
| 9 | Abyssal Throne | 30 | Beat Map 8 Boss | Abyssal Lord |
| 10 | The Maelstrom | 36 | Beat Map 9 Boss | **Leviathan** (World Boss) |

### Map Mechanics
- Each map has a **kill requirement** (e.g., 20-50 monsters) before boss can be challenged
- Boss fights are **manually initiated** (or auto-spawned after first clear)
- Normal monsters continue spawning even when boss is ready
- Higher maps = better item level drops
- Can **replay** any unlocked map for farming

---

## ⚔️ Combat System

### Damage Formula
```
Base Damage = Weapon Damage + Flat Damage Bonuses
Total Damage = Base Damage × (1 + %Increased Damage / 100)
Final Damage = Total Damage × Crit Multiplier (if crit)

Attack Rate = Base Attack Speed × (1 + %Increased Attack Speed / 100)
DPS = Average Damage × Attack Rate
```

### Defense Formulas
```
Physical Reduction = Armor / (Armor + 10 × Monster Level)
Elemental Reduction = min(Resistance%, 75%)

Evasion: Hit Chance = Accuracy / (Accuracy + Evasion / 4) [5%-100%]
Block Chance: % chance to negate physical damage (shields)

Damage Taken = Raw Damage × (1 - Reduction) × Variance(0.85-1.15)
Minimum Damage = 1
```

### Attributes
| Attribute | Effects |
|-----------|---------|
| **Strength** | +2 Life per 10 STR, +2% Melee Physical Damage per 10 STR |
| **Dexterity** | +2 Accuracy per 1 DEX, +2% Evasion per 5 DEX |
| **Intelligence** | +2 Mana per 10 INT, +2% Elemental Damage per 10 INT |

### Monster Types
- **Normal** - Base HP, base drops
- **Magic** (Blue) - 2x HP, 2x XP, better drops
- **Rare** (Yellow) - 4x HP, 4x XP, even better drops
- **Boss** - Unique HP pool, guaranteed drops, skill rotations

### Boss Mechanics
- Bosses have **skill rotations** with cooldowns
- Skills deal multiplied damage (2-3x base)
- Manual fight initiation after kill threshold
- Auto-spawn toggle available after first clear

---

## 🎒 Item System

### Rarities
- ⬜ **Normal** - No affixes
- 🔵 **Magic** - 1-2 affixes (1 prefix + 1 suffix max)
- 🟡 **Rare** - 3-6 affixes (3 prefix + 3 suffix max)
- 🟠 **Unique** - Fixed special affixes, build-enabling

### Equipment Slots (10 total)
| Slot | Main Stats |
|------|-----------|
| Weapon | Physical Damage, Attack Speed, Crit |
| Off-Hand | Block, Damage, Spell Damage |
| Helmet | Armor, Life, Resistances |
| Body Armor | Armor, Life, Resistances |
| Gloves | Attack Speed, Accuracy, Damage |
| Boots | Movement Speed, Life, Resistances |
| Belt | Life, Resistances, Flask charges |
| Amulet | Damage, Life, Attributes |
| Ring ×2 | Damage, Life, Resistances |

### Affix Pool

#### Prefixes
| Affix | Tiers | Values |
|-------|-------|--------|
| Flat Physical Damage | 1-7 | +1 to +45 |
| Flat Fire Damage | 1-5 | +1 to +32 |
| Flat Cold Damage | 1-5 | +1 to +32 |
| Flat Lightning Damage | 1-5 | +1 to +45 (high variance) |
| Flat Life | 1-7 | +5 to +100 |
| Flat Armor | 1-7 | +10 to +220 |
| Flat Evasion | 1-5 | +15 to +220 |
| Strength | 1-5 | +5 to +55 |
| Dexterity | 1-5 | +5 to +55 |
| Intelligence | 1-5 | +5 to +55 |
| % Increased Fire Damage | 1-5 | +5% to +55% |
| % Increased Cold Damage | 1-5 | +5% to +55% |
| % Increased Lightning Damage | 1-5 | +5% to +55% |
| % Increased Physical Damage | 1-5 | +10% to +100% |

#### Suffixes
| Affix | Tiers | Values |
|-------|-------|--------|
| % Increased Attack Speed | 1-5 | +3% to +25% |
| % Critical Strike Chance | 1-5 | +5% to +50% |
| % Critical Strike Multiplier | 1-5 | +10% to +110% |
| Life Regeneration | 1-5 | +1 to +20/sec |
| Mana Regeneration | 1-5 | +1 to +13/sec |
| Flat Mana | 1-5 | +5 to +85 |
| Accuracy Rating | 1-5 | +20 to +300 |
| Block Chance (shields) | 1-5 | +2% to +22% |
| % Fire Resistance | 1-5 | +6% to +42% |
| % Cold Resistance | 1-5 | +6% to +42% |
| % Lightning Resistance | 1-5 | +6% to +42% |

---

## 🔨 Crafting System

### Currency Items
| Currency | Effect | Rarity |
|----------|--------|--------|
| **Transmutation Orb** | Normal → Magic | Common |
| **Alteration Orb** | Reroll Magic affixes | Common |
| **Augmentation Orb** | Add affix to Magic (if <2) | Uncommon |
| **Alchemy Orb** | Normal → Rare | Uncommon |
| **Chaos Orb** | Reroll Rare affixes | Rare |
| **Exalted Orb** | Add affix to Rare (if <6) | Very Rare |
| **Divine Orb** | Reroll affix values | Very Rare |
| **Scouring Orb** | Rare/Magic → Normal | Uncommon |

### Drop Rates (per kill)
- Transmutation: 10%
- Alteration: 8%
- Augmentation: 3%
- Alchemy: 2%
- Chaos: 0.5%
- Exalted: 0.05%
- Divine: 0.02%

---

## 🧪 Flask System

### Flask Slots
- 5 flask slots total
- Start with 1 Life Flask + 1 Mana Flask
- Auto-use at 50% HP/Mana threshold
- Refill on monster kills

### Future: Flask Affixes
- Magic/Rare flasks with modifiers
- Unique flasks with special effects

---

## 📊 Player Progression

### Stats
| Stat | Base Value | Effect |
|------|------------|--------|
| Strength | 10 | +2 life/10, +2% phys/10 |
| Dexterity | 10 | +2 acc/1, +2% evasion/5 |
| Intelligence | 10 | +2 mana/10, +2% elem/10 |
| Life | 80 | Health pool |
| Mana | 40 | Resource for skills |
| Physical Damage | 4-7 | Base hit damage |
| Attack Speed | 1.0 | Attacks per second |
| Critical Chance | 5% | Chance to crit |
| Critical Multiplier | 150% | Crit damage bonus |
| Accuracy | 100 | Hit chance vs evasion |
| Armor | 0 | Reduces physical damage |
| Evasion | 0 | Chance to dodge attacks |
| Block Chance | 0% | Chance to block (shields) |
| Fire Resistance | 0% | Reduces fire damage (cap 75%) |
| Cold Resistance | 0% | Reduces cold damage (cap 75%) |
| Lightning Resistance | 0% | Reduces lightning damage (cap 75%) |
| Life Regeneration | 1/s | Health restored per second |
| Mana Regeneration | 2/s | Mana restored per second |

### Leveling
- XP from kills based on monster level and rarity
- Custom XP table (525 XP for level 2, scaling to millions)
- No automatic stat gains - points saved for Passive Tree
- Level cap: 100

---

## 🗓️ Implementation Phases

### Phase 1: Core Foundation ✅ COMPLETE
- [x] Project setup (Vite + React + TypeScript + Tailwind)
- [x] Define data models (Player, Item, Monster, Map, Boss)
- [x] Create game state management (Zustand)
- [x] Combat math engine (damage types, armor, resistances, crits)
- [x] Attack-based combat with cooldowns
- [x] Damage variance (±15%)

### Phase 2: Map System ✅ COMPLETE
- [x] Implement 10 maps with unique monster pools
- [x] Kill counter & boss spawn logic
- [x] Map unlock progression
- [x] Map selection UI
- [x] Manual boss initiation + auto-spawn toggle
- [x] Boss skill rotations

### Phase 3: Items & Loot ✅ COMPLETE
- [x] Item generation with random affixes (tiers, ranges)
- [x] Loot drop system (rarity weights, boss guaranteed drops)
- [x] Inventory management (grid, tooltips)
- [x] Equipment system (equip/unequip, slot validation)
- [x] Item comparison tooltips
- [x] Click-to-equip, right-click-to-sell
- [x] **Attributes (STR/DEX/INT)** with derived bonuses
- [x] **Flat elemental damage** (fire, cold, lightning)
- [x] **Evasion & Accuracy** system
- [x] **Block chance** (shields)
- [x] **Amulets & Shields** item bases

### Phase 3.5: Skills System ✅ COMPLETE
- [x] Skill definitions (12 skills: attacks, spells, AOE)
- [x] Skill slots for player (6 slots)
- [x] Skill bar UI with cooldowns & mana display
- [x] Auto-use skills in combat (priority: AOE → highest damage)
- [x] Skill effects: multi-hit, AOE, lifesteal, crit bonus
- [x] Visual indicators for evade/block in combat

### Phase 4: Crafting 🔄 IN PROGRESS
- [x] Currency items defined & dropping
- [ ] **Crafting operations** (use currency on items)
- [ ] **Crafting UI** (bench/workbench interface)
- [ ] **Vendor system** (buy/sell items)

### Phase 5: Polish & Visuals ✅ MOSTLY COMPLETE
- [x] Animated combat arena (2D circles, movement)
- [x] Damage numbers with animations
- [x] Monster rarity colors & death animations
- [x] Screen navigation (Town, World Map, Combat, Character)
- [x] Mini combat panel for background farming
- [x] Player stats display (all damage types, resistances)
- [x] Flask system with auto-use
- [ ] Sprite animations (future enhancement)

### Phase 6: Persistence (Supabase)
- [ ] User authentication
- [ ] Save/load game state
- [ ] Cloud sync

---

## 🎯 Phase 4 Detailed: Crafting & Vendors

### Crafting Bench
```
┌─────────────────────────────────────┐
│  🔨 CRAFTING BENCH                  │
├─────────────────────────────────────┤
│  [Item Slot]     [Currency Slot]    │
│                                     │
│  Preview:                           │
│  "Iron Sword" → "Gleaming Iron Sword"│
│  + Adds 1-2 random affixes          │
│                                     │
│  [CRAFT] button                     │
└─────────────────────────────────────┘
```

### Vendor NPCs (Town)
| Vendor | Function |
|--------|----------|
| **Weapon Smith** | Sells basic weapons, buys weapons |
| **Armorer** | Sells basic armor, buys armor |
| **Jeweler** | Sells rings/amulets, buys accessories |
| **Alchemist** | Sells flasks & basic currency |

### Vendor Recipes (sell specific combos)
| Recipe | Result |
|--------|--------|
| 3 same-base items | 1 Transmutation Orb |
| 1 item of each slot | 1 Alchemy Orb |
| Full set of rare items | 1 Chaos Orb |
| 3 quality flasks | 1 Glassblower's Bauble |

---

## 🌳 Future: Passive Skill Tree

### Design Goals
- ~100-200 nodes for meaningful choices
- Starting area → Class specializations
- Notable nodes with powerful effects
- Keystones that fundamentally change playstyle

### Node Types
| Type | Effect |
|------|--------|
| **Minor** | +10 Life, +5% Damage |
| **Notable** | +30 Life, +15% Damage, special effects |
| **Keystone** | Major tradeoffs (e.g., "No Crits but +100% Damage") |

### Gain Points From
- Level up: 1 point per level
- Quest completion
- Ascendancy unlock

---

## ⚡ Future: Active Skills

### Skill Gems
- Socket into weapon/armor
- Level up with use
- Support gems modify active skills

### Example Skills
| Skill | Type | Effect |
|-------|------|--------|
| **Heavy Strike** | Attack | 150% damage, slower |
| **Cleave** | Attack | Hit multiple enemies |
| **Fireball** | Spell | Projectile, fire damage |
| **Frost Nova** | Spell | AoE around player |
| **Whirling Blades** | Movement | Dash + damage |

### Support Gems
| Support | Effect |
|---------|--------|
| **Added Fire** | +% fire damage |
| **Faster Attacks** | +% attack speed |
| **Multiple Projectiles** | More projectiles, less damage |
| **Increased AoE** | Bigger area |

---

## 🗺️ Future: Map Modifiers

### Rolled Affixes on Maps
| Modifier | Effect |
|----------|--------|
| **+% Monster Life** | Monsters tankier |
| **+% Monster Damage** | Monsters hit harder |
| **Elemental Weakness** | Player has -% resists |
| **% More Magic Monsters** | More blue packs |
| **Boss has X Skill** | Boss gains extra ability |

### Risk/Reward
- Harder mods = better drops
- "Juiced" maps for efficiency
- Corruption for extreme difficulty

---

## 🛠️ Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + TypeScript | Type safety, component model |
| State | Zustand | Simple, performant game state |
| Styling | Tailwind CSS | Fast iteration, utility-first |
| Backend | Supabase | Auth + Database + Realtime |
| Game Loop | setInterval | Consistent 100ms ticks |

---

## 📝 Backlog & Ideas

### High Priority
- [ ] Crafting bench UI
- [ ] Vendor NPCs in town
- [ ] Passive skill tree (basic version)
- [ ] Local storage persistence

### Medium Priority
- [ ] Active skills system
- [ ] More item bases per slot
- [ ] Unique items with special effects
- [ ] Map modifiers
- [ ] Achievement system

### Low Priority / Future
- [ ] Sprite animations
- [ ] Sound effects & music
- [ ] League/season mechanics
- [ ] Multiplayer trading
- [ ] Ascendancy classes
- [ ] Endless dungeon (Delve-like)
- [ ] Strongboxes & shrines
