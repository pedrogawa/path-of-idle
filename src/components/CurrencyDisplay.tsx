import { useGameStore } from '../stores/gameStore';
import { currencies } from '../data';

export function CurrencyDisplay() {
  const playerCurrency = useGameStore(state => state.player.currency);

  return (
    <div className="bg-[#12121a] rounded-lg p-4 border border-[#2a2a3a]">
      <h2 className="text-lg font-bold text-[#c9a227] mb-3 flex items-center gap-2">
        <span className="text-2xl">💰</span>
        Currency
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {currencies.map(currency => {
          const amount = playerCurrency[currency.id];

          return (
            <div
              key={currency.id}
              className="flex items-center gap-2 p-2 bg-[#0a0a0f] rounded border border-[#2a2a3a]"
              title={currency.description}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: currency.color + '30', color: currency.color }}
              >
                {currency.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 truncate">{currency.name.replace('Orb of ', '').replace(' Orb', '')}</div>
                <div className="text-sm font-medium text-white">{amount}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
