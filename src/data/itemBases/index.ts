import type { ItemBase } from '../../types';
import { bodyArmorBases } from './bodyArmor';
import { nonBodyItemBases } from './nonBodyItemBases';

export const itemBases: ItemBase[] = [...nonBodyItemBases, ...bodyArmorBases];

export const itemBaseById = new Map(itemBases.map(b => [b.id, b]));

export const getItemBasesForSlot = (slot: string, maxDropLevel: number): ItemBase[] => {
  return itemBases.filter(base => {
    const slotMatches = base.slot === slot ||
      (slot === 'ring2' && base.slot === 'ring1') ||
      (slot === 'ring1' && base.slot === 'ring1') ||
      (slot === 'amulet' && base.slot === 'amulet') ||
      (slot === 'offhand' && base.slot === 'offhand');

    return slotMatches && base.dropLevel <= maxDropLevel;
  });
};

