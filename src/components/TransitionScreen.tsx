import { getCellById } from '../lib/cells';

interface TransitionScreenProps {
  transition: { type: 'support' | 'breakdown'; from: number; to: number };
  onAccept: () => void;
}

export function TransitionScreen({ transition, onAccept }: TransitionScreenProps) {
  const fromCell = getCellById(transition.from);
  const toCell = getCellById(transition.to);
  const isSupport = transition.type === 'support';

  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center py-8">
      <div className={`w-full max-w-sm rounded-card p-6 border-2 ${
        isSupport ? 'bg-olive/10 border-olive' : 'bg-red/10 border-red'
      }`}>
        <h2 className={`font-heading text-display text-center mb-4 ${
          isSupport ? 'text-olive' : 'text-red'
        }`}>
          {isSupport ? 'ОПОРА' : 'СРЫВ'}
        </h2>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 text-body text-bone mb-2">
            <span>{transition.from}. {fromCell?.kempName}</span>
            <span className={isSupport ? 'text-olive' : 'text-red'}>
              {isSupport ? '↑' : '↓'}
            </span>
            <span>{transition.to}. {toCell?.kempName}</span>
          </div>
          <p className="text-caption text-muted">
            {isSupport
              ? `${fromCell?.kempName} поднимает к ${toCell?.kempName}.`
              : `${fromCell?.kempName} возвращает к ${toCell?.kempName}.`}
          </p>
        </div>

        {fromCell?.transitionExplanation && (
          <p className="text-body text-bone/80 text-center mb-6 leading-relaxed">
            {fromCell.transitionExplanation}
          </p>
        )}

        <button
          onClick={onAccept}
          className={`w-full min-h-cta font-heading text-h2 rounded-card transition-opacity hover:opacity-90 ${
            isSupport
              ? 'bg-olive text-bone'
              : 'bg-red text-bone'
          }`}
        >
          {isSupport ? `Подняться на клетку ${transition.to}` : `Спуститься на клетку ${transition.to}`}
        </button>
      </div>
    </div>
  );
}
