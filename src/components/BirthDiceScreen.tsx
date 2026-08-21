import { useState } from 'react';
import type { RollResult } from '../lib/game';
import { getPublicUrl } from '../lib/assets';
import { Dice3D } from './Dice3D';

interface BirthDiceScreenProps {
  onRoll: () => void;
  lastRoll: RollResult | null;
}

export function BirthDiceScreen({ onRoll, lastRoll }: BirthDiceScreenProps) {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (isRolling || lastRoll?.resultType === 'birth_success') return;
    setIsRolling(true);

    setTimeout(() => {
      onRoll();
      setIsRolling(false);
    }, 1350);
  };

  const isSuccess = lastRoll?.resultType === 'birth_success';

  return (
    <div 
      className="min-h-dvh flex flex-col relative bg-ink"
      style={{ 
        backgroundImage: `url(${getPublicUrl('/textures/base_graphite_topography_400.png')})`, 
        backgroundRepeat: 'repeat', 
        backgroundSize: '200px' 
      }}
    >
      {/* Header text */}
      <div className="pt-12 px-6 text-center">
        <h1 className="font-heading text-display text-bronze tracking-widest uppercase">
          Путь Мужчины
        </h1>
        <p className="font-heading text-h2 text-muted mt-1">
          Кубик пути
        </p>
      </div>

      {/* Center content - dice */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <Dice3D
          value={lastRoll?.dieValue ?? null}
          isRolling={isRolling}
          size={160}
        />

        {/* Subtitle under dice */}
        <p className="text-body text-bone/80 text-center mt-8 max-w-xs">
          Ты готов сделать следующий шаг?<br />
          <span className="text-muted">Доверься Пути. Брось кубик.</span>
        </p>
      </div>

      {/* Result overlay */}
      {lastRoll && !isRolling && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-ink/60 backdrop-blur-sm">
          <div className="bg-graphite rounded-2xl p-6 mx-6 text-center max-w-xs border border-bronze/20">
            <p className={`text-h1 font-heading mb-2 ${isSuccess ? 'text-bronze' : 'text-bone'}`}>
              {lastRoll.message}
            </p>
            {!isSuccess && (
              <p className="text-caption text-muted">Брось снова</p>
            )}
          </div>
        </div>
      )}

      {/* Bottom action area */}
      <div className="px-6 pb-24 pt-4">
        <button
          onClick={handleRoll}
          disabled={isRolling || isSuccess}
          className="w-full min-h-cta bg-bronze text-ink font-heading text-h2 rounded-card hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
        >
          <span>{isRolling ? 'Бросок...' : isSuccess ? 'Путь открыт' : 'Бросить кубик'}</span>
          {!isRolling && !isSuccess && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
          )}
        </button>

        <button
          onClick={() => {}}
          className="w-full mt-3 text-caption text-muted hover:text-bone transition-colors flex items-center justify-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14 4 9l5-5"/>
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
          </svg>
          Вернуться к карте
        </button>
      </div>
    </div>
  );
}
