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
      className="min-h-dvh flex flex-col relative bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url(${getPublicUrl('/screens/03_dice_idle.png')})` }}
    >
      {/* Rolling dice animation — centered on screen */}
      {isRolling && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-graphite/60 backdrop-blur-sm rounded-2xl p-8">
            <DiceCube
              value={lastRoll?.dieValue ?? null}
              isRolling={isRolling}
              size={160}
            />
          </div>
        </div>
      )}

      {/* Result overlay — centered, only after roll completes */}
      {lastRoll && !isRolling && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-graphite/80 backdrop-blur-sm rounded-2xl p-6 mx-6 text-center max-w-xs">
            <p className={`text-h2 font-heading mb-2 ${isSuccess ? 'text-bronze' : 'text-bone'}`}>
              {lastRoll.message}
            </p>
            {!isSuccess && (
              <p className="text-caption text-bone/60">Брось снова</p>
            )}
          </div>
        </div>
      )}

      {/* Spacer pushes button to bottom */}
      <div className="flex-1" />

      {/* Bottom action area */}
      <div className="px-6 pb-24 pt-8 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent">
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
