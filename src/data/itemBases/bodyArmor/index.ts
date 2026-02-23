import type { ItemBase } from '../../../types';
import { bodyArmorStrengthBases } from './strength';
import { bodyArmorDexterityBases } from './dexterity';
import { bodyArmorIntelligenceBases } from './intelligence';
import { bodyArmorStrengthDexterityBases } from './strengthDexterity';
import { bodyArmorDexterityIntelligenceBases } from './dexterityIntelligence';
import { bodyArmorStrengthIntelligenceBases } from './strengthIntelligence';
import { bodyArmorStrengthDexterityIntelligenceBases } from './strengthDexterityIntelligence';

export const bodyArmorBases: ItemBase[] = [
  ...bodyArmorStrengthBases,
  ...bodyArmorDexterityBases,
  ...bodyArmorIntelligenceBases,
  ...bodyArmorStrengthDexterityBases,
  ...bodyArmorDexterityIntelligenceBases,
  ...bodyArmorStrengthIntelligenceBases,
  ...bodyArmorStrengthDexterityIntelligenceBases,
];

