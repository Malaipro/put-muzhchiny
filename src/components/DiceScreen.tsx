import { useState } from 'react';
import type { GameState } from '../lib/game';
import type { RollResult } from '../lib/game';
import { DiceCube } from './DiceCube';

interface DiceScreenProps {
  game: GameState;
  lastRoll: RollResult | null;
  onRoll: () => void;
  onBack: () => void;
}

export function DiceScreen({ game, lastRoll, onRoll, onBack }: DiceScreenProps) {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);

    setTimeout(() => {
      onRoll();
      setIsRolling(false);
    }, 1200);
  };

  const isBirth = game.status === 'waiting_birth';

  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center py-8 px-safe">
      <button
        onClick={onBack}
        className="self-start text-caption text-muted hover:text-bone transition-colors mb-8"
      >
        ← Назад
      </button>

      <div className="text-center mb-8">
        <h2 className="font-heading text-h1 text-bone mb-2">
          {isBirth ? 'Вход в Путь' : 'Бросок кубика'}
        </h2>
        <p className="text-body text-muted">
          {isBirth
            ? 'Бросай до выпадения шестёрки'
            : game.status === 'ready_bonus_roll'
            ? 'Бонусный бросок!'
            : `Текущая клетка: ${game.currentCellId}`}
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
          <p className="text-body text-bone mb-2">{lastRoll.message}</p>
          {lastRoll.landedCell && (
            <p className="text-caption text-muted">
              {game.currentCellId} + {lastRoll.dieValue} = {lastRoll.landedCell}
            </p>
          )}
          {lastRoll.bonusGenerated && (
            <p className="text-caption text-bronze mt-1">+1 бонусный бросок</p>
          )}
        </div>
      )}

      {/* Roll Button */}
      <button
        onClick={handleRoll}
        disabled={isRolling}
        className="min-h-cta px-10 bg-bronze text-ink font-heading text-h2 rounded-card hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isRolling ? 'Бросок...' : isBirth ? 'Бросить кубик' : 'Бросить'}
      </button>
    </div>
  );
}
