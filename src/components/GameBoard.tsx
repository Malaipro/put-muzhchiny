import type { GameState, VisitRecord } from '../lib/game';
import { getCellById } from '../lib/cells';
import { getVisits, isVisitUnlocked } from '../lib/game';

interface GameBoardProps {
  game: GameState;
  currentVisit: VisitRecord | null;
  onRoll: () => void;
  onOpenCell: () => void;
}

export function GameBoard({ game, currentVisit, onRoll, onOpenCell }: GameBoardProps) {
  const visits = getVisits();
  const currentCell = game.currentCellId > 0 ? getCellById(game.currentCellId) : null;

  const visitedCells = new Set(visits.map(v => v.cellId));
  const routeCells = visits.map(v => v.cellId);

  // Build grid: 8 rows of 9 cells each, alternating direction (snake pattern)
  const rows: number[][] = [];
  for (let row = 0; row < 8; row++) {
    const start = row * 9 + 1;
    const rowCells = Array.from({ length: 9 }, (_, i) => start + i);
    if (row % 2 === 1) rowCells.reverse();
    rows.push(rowCells);
  }

  const canRollNow = ['ready_to_roll', 'ready_bonus_roll', 'waiting_birth'].includes(game.status);
  const isWaiting = game.status === 'waiting_roll' && game.nextRollAt;
  const waitTimeLeft = isWaiting && game.nextRollAt
    ? Math.max(0, new Date(game.nextRollAt).getTime() - Date.now())
    : 0;

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="py-4">
      {/* Current Cell Card */}
      {currentCell && currentVisit && (
        <div className="mb-6 bg-graphite rounded-card p-4 border border-copper/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-muted">Клетка {currentCell.id}</span>
            <span className={`text-caption px-2 py-0.5 rounded ${
              currentVisit.visitMode === 'node' ? 'bg-red/20 text-red' :
              currentVisit.visitMode === 'return' ? 'bg-bronze/20 text-bronze' :
              'bg-olive/20 text-olive'
            }`}>
              {currentVisit.visitMode === 'introduction' ? 'Знакомство' :
               currentVisit.visitMode === 'return' ? 'Возврат' : 'Узел'}
            </span>
          </div>
          <h2 className="font-heading text-h1 text-bone mb-1">{currentCell.kempName}</h2>
          <p className="text-caption text-muted mb-3">{currentCell.subtitle}</p>
          <div
            className="text-body text-bone/90 mb-4 leading-relaxed prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: currentCell.shortText.replace(/\*\*/g, '<strong>').replace(/\n/g, '<br/>') }}
          />
          <div className="flex gap-2">
            <button
              onClick={onOpenCell}
              className="flex-1 min-h-touch bg-graphite border border-bronze text-bronze rounded-card text-body font-medium hover:bg-bronze/10 transition-colors"
            >
              Читать полностью
            </button>
            {canRollNow && (
              <button
                onClick={onRoll}
                className="flex-1 min-h-touch bg-bronze text-ink rounded-card text-body font-heading hover:opacity-90 transition-opacity"
              >
                {game.status === 'ready_bonus_roll' ? 'Бонусный бросок' : 'Бросить кубик'}
              </button>
            )}
          </div>
          {!canRollNow && game.status === 'active_cell' && (
            <div className="mt-3 text-center">
              {isVisitUnlocked(currentVisit) ? (
                <p className="text-caption text-olive">Минимальное время пройдено. Можно завершить.</p>
              ) : (
                <p className="text-caption text-muted">
                  До завершения: {formatTime(new Date(currentVisit.unlockAt).getTime() - Date.now())}
                </p>
              )}
            </div>
          )}
          {isWaiting && waitTimeLeft > 0 && (
            <p className="mt-3 text-center text-caption text-red">
              Ожидание: {formatTime(waitTimeLeft)}
            </p>
          )}
        </div>
      )}

      {/* Game Grid */}
      <div className="bg-graphite/50 rounded-card p-3 border border-copper/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-h2 text-bone">Карта Пути</h3>
          <span className="text-caption text-muted">{game.currentCellId > 0 ? `Текущая: ${game.currentCellId}` : 'Не начат'}</span>
        </div>
        <div className="grid grid-cols-9 gap-1">
          {rows.flat().map((cellId) => {
            const isCurrent = cellId === game.currentCellId;
            const isVisited = visitedCells.has(cellId);
            const cell = getCellById(cellId);
            const isSupport = cell?.transitionType === 'support';
            const isBreakdown = cell?.transitionType === 'breakdown';

            return (
              <button
                key={cellId}
                onClick={() => {}}
                className={`aspect-square rounded flex items-center justify-center text-[10px] font-medium leading-none ${
                  isCurrent
                    ? 'bg-bronze text-ink ring-2 ring-bronze/50'
                    : isBreakdown
                    ? 'bg-red/30 text-red'
                    : isSupport
                    ? 'bg-olive/30 text-olive'
                    : isVisited
                    ? 'bg-copper/20 text-bone/70'
                    : 'bg-ink text-muted/50'
                }`}
              >
                {cellId}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 text-caption">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-bronze"/>Текущая</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-olive"/>Опора</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red"/>Срыв</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-copper/40"/>Посещена</span>
        </div>
      </div>

      {/* Route History */}
      {routeCells.length > 0 && (
        <div className="mt-6 bg-graphite/30 rounded-card p-4 border border-copper/10">
          <h3 className="font-heading text-h2 text-bone mb-3">Маршрут</h3>
          <div className="flex flex-wrap gap-1 text-caption">
            {routeCells.map((cellId, i) => (
              <span key={i} className="flex items-center">
                <span className={`px-1.5 py-0.5 rounded ${
                  cellId === game.currentCellId ? 'bg-bronze text-ink' : 'bg-graphite text-muted'
                }`}>
                  {cellId}
                </span>
                {i < routeCells.length - 1 && <span className="text-muted mx-0.5">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
