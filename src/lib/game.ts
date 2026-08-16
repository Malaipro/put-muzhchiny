import type {
  GameStatus,
  VisitMode,
  VisitStatus,
  VisitSource,
  RollType,
  RollResultType,
} from '../types';
import { CELLS } from './cells';

const STORAGE_KEY = 'kemp-game-state';
const STORAGE_VISITS = 'kemp-visits';
const STORAGE_ROLLS = 'kemp-rolls';

export interface GameState {
  gameId: string;
  status: GameStatus;
  initialQuery: string;
  currentCellId: number;
  bonusRollCredits: number;
  nextRollAt: string | null;
  holdingReason: 'no_move' | null;
  startedAt: string;
  queryConfirmedAt: string | null;
}

export interface VisitRecord {
  visitId: string;
  cellId: number;
  source: VisitSource;
  startedAt: string;
  unlockAt: string;
  completedAt: string | null;
  status: VisitStatus;
  visitMode: VisitMode;
  gameVisitCount: number;
}

export interface RollRecord {
  rollId: string;
  dieValue: number;
  rollType: RollType;
  resultType: RollResultType;
  landedCell: number | null;
  bonusGenerated: boolean;
  createdAt: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

function addHours(dateStr: string, hours: number): string {
  const d = new Date(dateStr);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

// --- Persistence ---

export function getGame(): GameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveGame(game: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
}

export function getVisits(): VisitRecord[] {
  const raw = localStorage.getItem(STORAGE_VISITS);
  return raw ? JSON.parse(raw) : [];
}

export function saveVisits(visits: VisitRecord[]): void {
  localStorage.setItem(STORAGE_VISITS, JSON.stringify(visits));
}

export function getRolls(): RollRecord[] {
  const raw = localStorage.getItem(STORAGE_ROLLS);
  return raw ? JSON.parse(raw) : [];
}

export function saveRolls(rolls: RollRecord[]): void {
  localStorage.setItem(STORAGE_ROLLS, JSON.stringify(rolls));
}

export function clearGame(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_VISITS);
  localStorage.removeItem(STORAGE_ROLLS);
}

// --- Game Lifecycle ---

export function createGame(initialQuery: string): GameState {
  const game: GameState = {
    gameId: generateId(),
    status: 'waiting_birth',
    initialQuery,
    currentCellId: 0,
    bonusRollCredits: 0,
    nextRollAt: null,
    holdingReason: null,
    startedAt: now(),
    queryConfirmedAt: now(),
  };
  saveGame(game);
  saveVisits([]);
  saveRolls([]);
  return game;
}

// --- Dice Logic ---

function randomDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export interface RollResult {
  dieValue: number;
  resultType: RollResultType;
  landedCell: number | null;
  bonusGenerated: boolean;
  newStatus: GameStatus;
  message?: string;
}

export function rollBirthDice(): RollResult {
  const game = getGame();
  if (!game || game.status !== 'waiting_birth') {
    throw new Error('Game not in waiting_birth state');
  }

  const dieValue = randomDie();
  const roll: RollRecord = {
    rollId: generateId(),
    dieValue,
    rollType: 'birth',
    resultType: dieValue === 6 ? 'birth_success' : 'birth_failed',
    landedCell: dieValue === 6 ? 1 : null,
    bonusGenerated: false,
    createdAt: now(),
  };

  const rolls = getRolls();
  rolls.push(roll);
  saveRolls(rolls);

  if (dieValue === 6) {
    const visit: VisitRecord = {
      visitId: generateId(),
      cellId: 1,
      source: 'birth',
      startedAt: now(),
      unlockAt: addHours(now(), 24),
      completedAt: null,
      status: 'active',
      visitMode: 'introduction',
      gameVisitCount: 1,
    };
    saveVisits([visit]);

    game.status = 'active_cell';
    game.currentCellId = 1;
    game.startedAt = now();
    saveGame(game);

    return {
      dieValue,
      resultType: 'birth_success',
      landedCell: 1,
      bonusGenerated: false,
      newStatus: 'active_cell',
      message: 'Путь открыт. Ты на клетке 1 — Рождение.',
    };
  }

  return {
    dieValue,
    resultType: 'birth_failed',
    landedCell: null,
    bonusGenerated: false,
    newStatus: 'waiting_birth',
    message: 'Путь ещё не открыт. Брось снова.',
  };
}

export function rollDice(): RollResult {
  const game = getGame();
  if (!game) throw new Error('No active game');

  if (!canRoll(game)) {
    throw new Error('Cannot roll now');
  }

  const isBonus = game.status === 'ready_bonus_roll';
  const dieValue = randomDie();
  const current = game.currentCellId;
  const candidate = current + dieValue;

  if (isBonus) {
    game.bonusRollCredits = 0;
  }

  if (candidate > 72) {
    const roll: RollRecord = {
      rollId: generateId(),
      dieValue,
      rollType: isBonus ? 'bonus' : 'normal',
      resultType: 'no_move',
      landedCell: null,
      bonusGenerated: false,
      createdAt: now(),
    };
    const rolls = getRolls();
    rolls.push(roll);
    saveRolls(rolls);

    game.nextRollAt = addHours(now(), 24);
    game.holdingReason = 'no_move';
    game.status = 'waiting_roll';
    saveGame(game);

    return {
      dieValue,
      resultType: 'no_move',
      landedCell: null,
      bonusGenerated: false,
      newStatus: 'waiting_roll',
      message: 'Ты остаёшься здесь ещё на один цикл.',
    };
  }

  const bonusGenerated = dieValue === 6;
  if (bonusGenerated) {
    game.bonusRollCredits = 1;
  }

  const roll: RollRecord = {
    rollId: generateId(),
    dieValue,
    rollType: isBonus ? 'bonus' : 'normal',
    resultType: 'move',
    landedCell: candidate,
    bonusGenerated,
    createdAt: now(),
  };
  const rolls = getRolls();
  rolls.push(roll);
  saveRolls(rolls);

  const visits = getVisits();
  const cellVisits = visits.filter(v => v.cellId === candidate);
  let visitMode: VisitMode = 'introduction';
  if (cellVisits.length === 1) visitMode = 'return';
  else if (cellVisits.length >= 2) visitMode = 'node';

  const visit: VisitRecord = {
    visitId: generateId(),
    cellId: candidate,
    source: isBonus ? 'bonus' : 'dice',
    startedAt: now(),
    unlockAt: addHours(now(), 24),
    completedAt: null,
    status: 'active',
    visitMode,
    gameVisitCount: cellVisits.length + 1,
  };
  visits.push(visit);
  saveVisits(visits);

  game.currentCellId = candidate;
  game.status = 'active_cell';
  game.nextRollAt = null;
  game.holdingReason = null;
  saveGame(game);

  return {
    dieValue,
    resultType: 'move',
    landedCell: candidate,
    bonusGenerated,
    newStatus: 'active_cell',
    message: `Переход на клетку ${candidate}.`,
  };
}

// --- Visit Completion ---

export function completeVisit(visitId: string): { success: boolean; transition?: { type: 'support' | 'breakdown'; from: number; to: number }; message: string } {
  const game = getGame();
  if (!game) throw new Error('No active game');

  const visits = getVisits();
  const visit = visits.find(v => v.visitId === visitId);
  if (!visit) throw new Error('Visit not found');
  if (visit.status !== 'active' && visit.status !== 'eligible') {
    throw new Error('Visit not completable');
  }

  const nowStr = now();
  if (new Date(nowStr) < new Date(visit.unlockAt)) {
    throw new Error('24 hours not passed');
  }

  visit.status = 'completed';
  visit.completedAt = nowStr;
  saveVisits(visits);

  const cell = CELLS.find((c: any) => c.id === visit.cellId);

  if (cell && cell.transitionType !== 'none' && cell.transitionTarget) {
    game.status = 'transition_pending';
    saveGame(game);
    return {
      success: true,
      transition: {
        type: cell.transitionType as 'support' | 'breakdown',
        from: visit.cellId,
        to: cell.transitionTarget,
      },
      message: cell.transitionType === 'support' ? 'Опора обнаружена.' : 'Срыв.',
    };
  }

  if (visit.cellId === 68) {
    game.status = 'finished';
    saveGame(game);
    return {
      success: true,
      message: 'Путь завершён. Опора достигнута.',
    };
  }

  if (game.bonusRollCredits > 0) {
    game.status = 'ready_bonus_roll';
  } else {
    game.status = 'ready_to_roll';
  }
  saveGame(game);

  return {
    success: true,
    message: 'Клетка прожита. Готов к следующему броску.',
  };
}

// --- Transition Acceptance ---

export function acceptTransition(fromCellId: number): void {
  const game = getGame();
  if (!game || game.status !== 'transition_pending') {
    throw new Error('No pending transition');
  }

  const cell = CELLS.find((c: any) => c.id === fromCellId);
  if (!cell || cell.transitionType === 'none' || !cell.transitionTarget) {
    throw new Error('No transition defined for this cell');
  }

  const targetCellId = cell.transitionTarget;
  const visits = getVisits();
  const cellVisits = visits.filter(v => v.cellId === targetCellId);
  let visitMode: VisitMode = 'introduction';
  if (cellVisits.length === 1) visitMode = 'return';
  else if (cellVisits.length >= 2) visitMode = 'node';

  const visit: VisitRecord = {
    visitId: generateId(),
    cellId: targetCellId,
    source: cell.transitionType === 'support' ? 'support' : 'breakdown',
    startedAt: now(),
    unlockAt: addHours(now(), 24),
    completedAt: null,
    status: 'active',
    visitMode,
    gameVisitCount: cellVisits.length + 1,
  };
  visits.push(visit);
  saveVisits(visits);

  game.currentCellId = targetCellId;
  game.status = 'active_cell';
  saveGame(game);
}

// --- Queries ---

export function canRoll(game: GameState): boolean {
  if (game.status === 'waiting_roll' && game.nextRollAt) {
    return new Date() >= new Date(game.nextRollAt);
  }
  return ['ready_to_roll', 'ready_bonus_roll', 'waiting_birth'].includes(game.status);
}

export function getCurrentVisit(): VisitRecord | null {
  const visits = getVisits();
  return visits.length > 0 ? visits[visits.length - 1] : null;
}

export function getVisitCount(cellId: number): number {
  return getVisits().filter(v => v.cellId === cellId).length;
}

export function isVisitUnlocked(visit: VisitRecord): boolean {
  return new Date() >= new Date(visit.unlockAt);
}

export function getGameStats() {
  const game = getGame();
  const visits = getVisits();
  const rolls = getRolls();
  if (!game) return null;

  const uniqueCells = new Set(visits.map(v => v.cellId)).size;
  const supports = visits.filter(v => v.source === 'support').length;
  const breakdowns = visits.filter(v => v.source === 'breakdown').length;
  const nodes = visits.filter(v => v.visitMode === 'node').length;

  return {
    currentCell: game.currentCellId,
    status: game.status,
    daysInPath: Math.floor((Date.now() - new Date(game.startedAt).getTime()) / (1000 * 60 * 60 * 24)),
    totalVisits: visits.length,
    uniqueCells,
    totalRolls: rolls.length,
    supports,
    breakdowns,
    nodes,
    bonusCredits: game.bonusRollCredits,
  };
}
