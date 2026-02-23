import type { ItemBase } from '../../types';
import { itemBases as legacyItemBases } from './legacyItemBases';

export const nonBodyItemBases: ItemBase[] = legacyItemBases.filter(base => base.slot !== 'bodyArmor');

