import type { Interval } from '../../lib/intervals';
import { buildIntervalRound } from '../../domain/intervals/roundGenerator';
import { normalizeSettings } from '../../domain/settings/settings';
import type { IntervalGameSettings } from '../../types/settings';

export type HeroMood = 'idle' | 'listening' | 'happy' | 'sad';

export interface IntervalResult {
  intervalName: string;
  isCorrect: boolean;
}

export interface IntervalGameState {
  score: number;
  targetInterval: Interval | null;
  lowerNote: string;
  upperNote: string | null;
  lastResult: IntervalResult | null;
  isCorrectGuessed: boolean;
  mood: HeroMood;
  roundId: number;
  roundDirection: 'up' | 'down';
  leavesVisible: boolean;
  hintsLeft: number;
  hintName: string | null;
  settings: IntervalGameSettings;
  playbackOrder: [string, string];
}

export function createInitialIntervalGameState(settings: IntervalGameSettings): IntervalGameState {
  const round = buildIntervalRound(normalizeSettings(settings));
  return {
    score: 0,
    targetInterval: round.interval,
    lowerNote: round.lowerNote,
    upperNote: round.upperNote,
    lastResult: null,
    isCorrectGuessed: false,
    mood: 'idle',
    roundId: 1,
    roundDirection: round.direction,
    leavesVisible: true,
    hintsLeft: 3,
    hintName: null,
    settings: normalizeSettings(settings),
    playbackOrder: round.playbackOrder,
  };
}

export function createNextRoundState(
  currentState: IntervalGameState,
  settings: IntervalGameSettings,
): IntervalGameState {
  const nextSettings = normalizeSettings(settings);
  const round = buildIntervalRound(nextSettings);

  return {
    ...currentState,
    targetInterval: round.interval,
    lowerNote: round.lowerNote,
    upperNote: round.upperNote,
    lastResult: null,
    isCorrectGuessed: false,
    mood: 'idle',
    roundId: currentState.roundId + 1,
    roundDirection: round.direction,
    leavesVisible: true,
    hintName: null,
    settings: nextSettings,
    playbackOrder: round.playbackOrder,
  };
}

export function applyAnswerState(
  currentState: IntervalGameState,
  selectedName: string,
): IntervalGameState {
  if (!currentState.targetInterval || currentState.isCorrectGuessed) {
    return currentState;
  }

  const isCorrect = selectedName === currentState.targetInterval.name;

  return {
    ...currentState,
    lastResult: { intervalName: selectedName, isCorrect },
    isCorrectGuessed: isCorrect,
    mood: isCorrect ? 'happy' : 'sad',
    leavesVisible: !isCorrect,
    score: isCorrect ? currentState.score + 1 : currentState.score,
  };
}

export function applySettingsState(
  currentState: IntervalGameState,
  newSettings: IntervalGameSettings,
): IntervalGameState {
  const normalizedSettings = normalizeSettings(newSettings);
  const nextRound = createNextRoundState(currentState, normalizedSettings);
  
  // Сброс счёта при изменении настроек
  return {
    ...nextRound,
    score: 0,
    hintsLeft: 3,
  };
}

export function requestHintState(
  currentState: IntervalGameState,
): IntervalGameState {
  if (!currentState.targetInterval || currentState.isCorrectGuessed || currentState.hintsLeft <= 0) {
    return currentState;
  }

  return {
    ...currentState,
    hintsLeft: currentState.hintsLeft - 1,
    hintName: currentState.targetInterval.name,
  };
}

export function hideLeavesState(currentState: IntervalGameState): IntervalGameState {
  return {
    ...currentState,
    leavesVisible: false,
  };
}
