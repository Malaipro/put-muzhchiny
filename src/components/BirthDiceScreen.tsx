import { useState } from 'react';
import type { RollResult } from '../lib/game';
import { DiceCube } from './DiceCube';

interface BirthDiceScreenProps {
  onRoll: () => void;
  lastRoll: RollResult | null;
}

export function BirthDiceScreen({ onRoll, lastRoll }: BirthDiceScreenProps) {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (isRolling || lastRoll?.resultType === 'birth_success') return;
    setIsRolling(true);

    // Animate for 1.2s then trigger actual roll
    setTimeout(() => {
      onRoll();
      setIsRolling(false);
    }, 1200);
  };

  const isSuccess = lastRoll?.resultType === 'birth_success';

  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center py-8 px-safe">
      <div className="text-center mb-8">
        <h2 className="font-heading text-h1 text-bone mb-2">Вход в Путь</h2>
        <p className="text-body text-muted">
          Бросай кубик до выпадения шестёрки. Только она открывает путь.
        </p>
      </div>

      {/* 3D Dice */}
      <div className="mb-8">
        <DiceCube
          value={lastRoll?.dieValue ?? null}
          isRolling={isRolling}
          size={140}
        />
      </div>

      {/* Result Message */}
      {lastRoll && !isRolling && (
        <div className="text-center mb-6 max-w-xs">
          <p className={`text-body mb-2 ${isSuccess ? 'text-bronze' : 'text-bone'}`}>
            {lastRoll.message}
          </p>
          {!isSuccess && (
            <p className="text-caption text-muted">Брось снова</p>
          )}
        </div>
      )}

      {/* Roll Button */}
      <button
        onClick={handleRoll}
        disabled={isRolling || isSuccess}
        className="min-h-cta px-10 bg-bronze text-ink font-heading text-h2 rounded-card hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isRolling ? 'Бросок...' : isSuccess ? 'Путь открыт' : 'Бросить кубик'}
      </button>
    </div>
  );
}
