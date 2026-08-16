import { useState } from 'react';
import type { RollResult } from '../lib/game';

interface BirthDiceScreenProps {
  onRoll: () => void;
  lastRoll: RollResult | null;
}

export function BirthDiceScreen({ onRoll, lastRoll }: BirthDiceScreenProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);

  const handleRoll = () => {
    setIsRolling(true);
    setDisplayValue(null);

    let count = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        onRoll();
        setIsRolling(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center py-8">
      <div className="text-center mb-8">
        <h2 className="font-heading text-h1 text-bone mb-2">Вход в Путь</h2>
        <p className="text-body text-muted">
          Бросай кубик до выпадения шестёрки. Только она открывает путь.
        </p>
      </div>

      <div className="w-32 h-32 bg-graphite rounded-2xl border-2 border-bronze/50 flex items-center justify-center mb-8 shadow-lg">
        {displayValue !== null || lastRoll ? (
          <span className={`font-heading text-display ${
            lastRoll?.resultType === 'birth_success' ? 'text-bronze' : 'text-bone'
          }`}>
            {displayValue ?? lastRoll?.dieValue}
          </span>
        ) : (
          <span className="text-muted text-h2">?</span>
        )}
      </div>

      {lastRoll && !isRolling && (
        <div className="text-center mb-6">
          <p className="text-body text-bone">{lastRoll.message}</p>
        </div>
      )}

      <button
        onClick={handleRoll}
        disabled={isRolling || lastRoll?.resultType === 'birth_success'}
        className="min-h-cta px-8 bg-bronze text-ink font-heading text-h2 rounded-card hover:opacity-90 transition-opacity disabled:opacity-30"
      >
        {isRolling ? 'Бросок...' : 'Бросить кубик'}
      </button>
    </div>
  );
}
