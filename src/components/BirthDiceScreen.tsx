import { useState } from 'react';
import type { RollResult } from '../lib/game';
import { getPublicUrl } from '../lib/assets';
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
    <div 
      className="min-h-dvh flex flex-col items-center justify-end pb-24 px-safe bg-cover bg-center"
      style={{ backgroundImage: `url(${getPublicUrl('/screens/03_dice_idle.png')})` }}
    >
      {/* Text overlay at bottom */}
      <div className="text-center mb-6 w-full max-w-sm">
        <h2 className="font-heading text-h1 text-bone mb-2 drop-shadow-lg">Вход в Путь</h2>
        <p className="text-body text-bone/80 drop-shadow mb-4">
          Бросай кубик до выпадения шестёрки. Только она открывает путь.
        </p>

        {/* Animated dice overlay (only during roll) */}
        {isRolling && (
          <div className="flex justify-center mb-4">
            <DiceCube
              value={lastRoll?.dieValue ?? null}
              isRolling={isRolling}
              size={120}
            />
          </div>
        )}

        {/* Result Message */}
        {lastRoll && !isRolling && (
          <div className="mb-4">
            <p className={`text-body mb-1 ${isSuccess ? 'text-bronze' : 'text-bone'} drop-shadow`}>
              {lastRoll.message}
            </p>
            {!isSuccess && (
              <p className="text-caption text-bone/60">Брось снова</p>
            )}
          </div>
        )}

        {/* Roll Button */}
        <button
          onClick={handleRoll}
          disabled={isRolling || isSuccess}
          className="w-full min-h-cta bg-bronze text-ink font-heading text-h2 rounded-card hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
        >
          {isRolling ? 'Бросок...' : isSuccess ? 'Путь открыт' : 'Бросить кубик'}
        </button>
      </div>
    </div>
  );
}
