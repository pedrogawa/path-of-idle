import type { CurrencyType } from '../types';

export interface CurrencyDefinition {
  id: CurrencyType;
  name: string;
  description: string;
  dropWeight: number; // Higher = more common
  color: string;
}

export const currencies: CurrencyDefinition[] = [
  {
    id: 'transmutation',
    name: 'Orb of Transmutation',
    description: 'Upgrades a normal item to a magic item',
    dropWeight: 100,
    color: '#9ca3af',
  },
  {
    id: 'alteration',
    name: 'Orb of Alteration',
    description: 'Rerolls the affixes on a magic item',
    dropWeight: 80,
    color: '#3b82f6',
  },
  {
    id: 'augmentation',
    name: 'Orb of Augmentation',
    description: 'Adds an affix to a magic item',
    dropWeight: 30,
    color: '#3b82f6',
  },
  {
    id: 'alchemy',
    name: 'Orb of Alchemy',
    description: 'Upgrades a normal item to a rare item',
    dropWeight: 20,
    color: '#eab308',
  },
  {
    id: 'chaos',
    name: 'Chaos Orb',
    description: 'Rerolls the affixes on a rare item',
    dropWeight: 5,
    color: '#a855f7',
  },
  {
    id: 'exalted',
    name: 'Exalted Orb',
    description: 'Adds an affix to a rare item',
    dropWeight: 0.5,
    color: '#f59e0b',
  },
  {
    id: 'divine',
    name: 'Divine Orb',
    description: 'Rerolls the values of all affixes on an item',
    dropWeight: 0.2,
    color: '#ef4444',
  },
  {
    id: 'scouring',
    name: 'Orb of Scouring',
    description: 'Removes all affixes from an item',
    dropWeight: 15,
    color: '#6b7280',
  },
];

export const currencyById = new Map(currencies.map(c => [c.id, c]));

export const totalCurrencyWeight = currencies.reduce((sum, c) => sum + c.dropWeight, 0);
