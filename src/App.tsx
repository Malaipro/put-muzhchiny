import { useState, useEffect, useCallback } from 'react';
import {
  getGame,
  createGame,
  rollBirthDice,
  rollDice,
  beginVisitExperience,
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
import { DiceIdleScreen } from './components/DiceIdleScreen';
import { GameBoard } from './components/GameBoard';
import { CellView } from './components/CellView';
import { DiceResultScreen } from './components/DiceResultScreen';
import { TransitionScreen } from './components/TransitionScreen';
import { BottomNav, type NavSection } from './components/BottomNav';
import { PassportScreen } from './components/PassportScreen';
import { SectionPlaceholder } from './components/SectionPlaceholder';
import { ReflectionsScreen } from './components/ReflectionsScreen';
import { isPlaytest } from './lib/playtest';
import { DesignedBoard } from './components/DesignedBoard';
import './playtest.css';

function App() {
  const [game, setGame] = useState<GameState | null>(getGame);
  const [screen, setScreen] = useState<string>('map');
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [transition, setTransition] = useState<{ type: 'support' | 'breakdown'; from: number; to: number } | null>(null);

  const { hapticImpact, hapticSuccess, hapticError, isInTelegram } = useTelegram();

  useEffect(() => {
    const refreshed = getGame();
    setGame(refreshed);
    if (refreshed?.status === 'waiting_birth') {
      setScreen('waiting_birth');
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
    } else {
      if (isInTelegram) hapticError();
    }
    setScreen('dice_result');
  };

  const handleRollDice = () => {
    if (isInTelegram) hapticImpact('medium');
    const result = rollDice();
    setLastRoll(result);
    refreshGame();
    if (result.resultType === 'move') {
      if (isInTelegram) hapticSuccess();
    } else {
      if (isInTelegram) hapticError();
    }
    setScreen('dice_result');
  };

  const handleBeginExperience = (
    visitId: string,
    questionId: string,
    questionText: string,
    challengeText: string,
    answer: string,
  ) => {
    beginVisitExperience(visitId, questionId, questionText, challengeText, answer);
    refreshGame();
    if (isInTelegram) hapticSuccess();
    setScreen('map');
  };

  const handleCompleteVisit = (
    visitId: string,
    questionId: string,
    questionText: string,
    challengeText: string,
    answer: string,
  ) => {
    const result = completeVisit(visitId, questionId, questionText, challengeText, answer);
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

  const handleResultContinue = () => {
    if (!lastRoll) return;
    if (lastRoll.resultType === 'move' || lastRoll.resultType === 'birth_success') {
      setScreen('cell');
      return;
    }
    if (lastRoll.resultType === 'birth_failed') {
      setLastRoll(null);
      setScreen('waiting_birth');
      return;
    }
    setScreen('map');
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
      <div className={`${isPlaytest ? 'playtest' : ''} min-h-dvh bg-ink text-bone`}>
        <Onboarding onStart={handleCreateGame} />
      </div>
    );
  }

  const currentVisit = getCurrentVisit();
  const currentCell = game.currentCellId > 0 ? getCellById(game.currentCellId) : null;

  return (
    <div className={`${isPlaytest ? 'playtest' : ''} min-h-dvh bg-ink text-bone flex flex-col`}>
      <main className="flex-1 overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom))]">
        {screen === 'map' && (
          <div className="px-safe">
            {isPlaytest ? <DesignedBoard game={game} currentVisit={currentVisit} onRoll={() => setScreen('dice')} onOpenCell={() => {
              if (game.status === 'transition_pending' && currentCell?.transitionTarget) {
                setTransition({ type: currentCell.transitionType as 'support' | 'breakdown', from: currentCell.id, to: currentCell.transitionTarget });
                setScreen('transition');
              } else setScreen('cell');
            }} /> : <GameBoard
              game={game}
              currentVisit={currentVisit}
              onRoll={() => setScreen('dice')}
              onOpenCell={() => setScreen('cell')}
            />}
          </div>
        )}

        {screen === 'dice' && (
          <DiceIdleScreen
            onRoll={game.status === 'waiting_birth' ? handleRollBirth : handleRollDice}
            onBack={() => setScreen('map')}
            canRoll={true}
            isBirth={game.status === 'waiting_birth'}
          />
        )}

        {screen === 'dice_result' && lastRoll && (
          <DiceResultScreen result={lastRoll} onContinue={handleResultContinue} />
        )}

        {screen === 'cell' && currentCell && currentVisit && (
          <CellView
            cell={currentCell}
            visit={currentVisit}
            isUnlocked={isVisitUnlocked(currentVisit)}
            onBeginExperience={(questionId, questionText, challengeText, answer) => (
              handleBeginExperience(currentVisit.visitId, questionId, questionText, challengeText, answer)
            )}
            onComplete={(questionId, questionText, challengeText, answer) => (
              handleCompleteVisit(currentVisit.visitId, questionId, questionText, challengeText, answer)
            )}
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
          <div className="px-safe">
            <PassportScreen stats={getGameStats()} onNewGame={handleReset} />
          </div>
        )}

        {screen === 'cells' && (
          <div className="px-safe">
            <SectionPlaceholder
              eyebrow="72 КЛЕТКИ"
              title="Клетки Пути"
              description="Здесь появится каталог клеток и история твоих посещений после утверждения канонического контента."
              icon="/icons/nav_map.svg"
            />
          </div>
        )}

        {screen === 'reflections' && (
          <ReflectionsScreen />
        )}

        {screen === 'waiting_birth' && game.status === 'waiting_birth' && (
          <DiceIdleScreen
            onRoll={handleRollBirth}
            canRoll={true}
            isBirth={true}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        active={
          screen === 'cells'
            ? 'cells'
            : screen === 'reflections'
              ? 'reflections'
              : screen === 'passport'
                ? 'profile'
                : 'path'
        }
        onNavigate={(section: NavSection) => {
          if (section === 'path') setScreen('map');
          if (section === 'cells') setScreen('cells');
          if (section === 'reflections') setScreen('reflections');
          if (section === 'profile') setScreen('passport');
        }}
      />
    </div>
  );
}

export default App;
