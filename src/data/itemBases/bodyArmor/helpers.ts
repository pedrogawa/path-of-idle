import type { ItemBase, ItemBaseTag } from '../../../types';
import { itemBases as legacyItemBases } from '../legacyItemBases';

export function getBodyArmorByTag(tag: ItemBaseTag): ItemBase[] {
  return legacyItemBases.filter(
    (base): base is ItemBase => base.slot === 'bodyArmor' && (base.baseTags?.includes(tag) ?? false)
  );
}

