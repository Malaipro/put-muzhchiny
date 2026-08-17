import { useState, useEffect, useCallback } from 'react';
import {
  getGame,
  createGame,
  rollBirthDice,
  rollDice,
  completeVisit,
  acceptTransition,
  getCurrentVisit,
  isVisitUnlocked,
  getGameStats,
  clearGame,
  type GameState,
  type RollResult,
} from './lib/game';
import { getCellById } from './lib/cells';
import { useTelegram } from './hooks/useTelegram';
import { Onboarding } from './components/Onboarding';
import { BirthDiceScreen } from './components/BirthDiceScreen';
import { GameBoard } from './components/GameBoard';
import { CellView } from './components/CellView';
import { DiceScreen } from './components/DiceScreen';
import { TransitionScreen } from './components/TransitionScreen';
import { BottomNav } from './components/BottomNav';
import { PassportScreen } from './components/PassportScreen';

function App() {
  const [game, setGame] = useState<GameState | null>(getGame);
  const [screen, setScreen] = useState<string>('map');
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [transition, setTransition] = useState<{ type: 'support' | 'breakdown'; from: number; to: number } | null>(null);

  const { hapticImpact, hapticSuccess, hapticError, isInTelegram } = useTelegram();

  useEffect(() => {
    if (game) {
      const refreshed = getGame();
      setGame(refreshed);
      // If game is in waiting_birth but screen is map, show birth screen
      if (refreshed?.status === 'waiting_birth' && screen !== 'waiting_birth') {
        setScreen('waiting_birth');
      }
    }
  }, []);

  const refreshGame = useCallback(() => {
    setGame(getGame());
  }, []);

  const handleCreateGame = (query: string) => {
    const g = createGame(query);
    setGame(g);
    setScreen('waiting_birth');
  };

  const handleRollBirth = () => {
    if (isInTelegram) hapticImpact('medium');
    const result = rollBirthDice();
    setLastRoll(result);
    refreshGame();
    if (result.resultType === 'birth_success') {
      if (isInTelegram) hapticSuccess();
      setTimeout(() => setScreen('cell'), 1500);
    } else {
      if (isInTelegram) hapticError();
    }
  };

  const handleRollDice = () => {
    if (isInTelegram) hapticImpact('medium');
    const result = rollDice();
    setLastRoll(result);
    refreshGame();
    if (result.resultType === 'move') {
      if (isInTelegram) hapticSuccess();
      setTimeout(() => setScreen('cell'), 1500);
    } else {
      if (isInTelegram) hapticError();
    }
  };

  const handleCompleteVisit = (visitId: string) => {
    const result = completeVisit(visitId);
    refreshGame();
    if (isInTelegram) hapticSuccess();
    if (result.transition) {
      setTransition(result.transition);
      setScreen('transition');
    } else if (result.message.includes('завершён')) {
      setScreen('passport');
    } else {
      setScreen('map');
    }
  };

  const handleAcceptTransition = (fromCellId: number) => {
    if (isInTelegram) hapticImpact('light');
    acceptTransition(fromCellId);
    setTransition(null);
    refreshGame();
    setScreen('cell');
  };

  const handleReset = () => {
    clearGame();
    setGame(null);
    setScreen('map');
    setLastRoll(null);
    setTransition(null);
  };

  if (!game) {
    return (
      <div className="min-h-dvh bg-ink text-bone">
        <Onboarding onStart={handleCreateGame} />
      </div>
    );
  }

  const currentVisit = getCurrentVisit();
  const currentCell = game.currentCellId > 0 ? getCellById(game.currentCellId) : null;

  return (
    <div className="min-h-dvh bg-ink text-bone flex flex-col">
      {/* Header */}
      <header className="px-safe pt-4 pb-2 flex items-center justify-between">
        <h1 className="font-heading text-h1 text-bronze tracking-wide">ПУТЬ МУЖЧИНЫ</h1>
        {game.status !== 'finished' && (
          <button
            onClick={handleReset}
            className="text-caption text-muted hover:text-bone transition-colors px-2 py-1"
          >
            Сбросить
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-safe pb-20">
        {screen === 'map' && (
          <GameBoard
            game={game}
            currentVisit={currentVisit}
            onRoll={() => setScreen('dice')}
            onOpenCell={() => setScreen('cell')}
          />
        )}

        {screen === 'dice' && (
          <DiceScreen
            game={game}
            lastRoll={lastRoll}
            onRoll={game.status === 'waiting_birth' ? handleRollBirth : handleRollDice}
            onBack={() => setScreen('map')}
          />
        )}

        {screen === 'cell' && currentCell && currentVisit && (
          <CellView
            cell={currentCell}
            visit={currentVisit}
            isUnlocked={isVisitUnlocked(currentVisit)}
            onComplete={() => handleCompleteVisit(currentVisit.visitId)}
            onBack={() => setScreen('map')}
          />
        )}

        {screen === 'transition' && transition && currentCell && (
          <TransitionScreen
            transition={transition}
            onAccept={() => handleAcceptTransition(transition.from)}
          />
        )}

        {screen === 'passport' && (
          <PassportScreen
            stats={getGameStats()}
            onNewGame={handleReset}
          />
        )}

        {screen === 'waiting_birth' && game.status === 'waiting_birth' && (
          <BirthDiceScreen
            onRoll={handleRollBirth}
            lastRoll={lastRoll}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        active={screen === 'map' || screen === 'cell' || screen === 'dice' || screen === 'transition' ? 'map' : screen}
        onNavigate={(nav) => {
          if (nav === 'map') setScreen('map');
          if (nav === 'passport') setScreen('passport');
        }}
      />
    </div>
  );
}

export default App;
