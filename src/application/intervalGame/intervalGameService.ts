/**
 * Service layer: orchestrates game logic, side effects, and state management.
 * Provides a clean interface for UI consumption.
 * Coordinates domain logic, reducer state, and infrastructure (audio, storage).
 */

import type { Dispatch } from 'react';
import * as audio from '../../lib/audio';
import { normalizeSettings } from '../../domain/settings/settings';
import { loadSettings, saveSettings } from '../../infrastructure/storage/settingsStorage';
import {
  createInitialIntervalGameState,
  createNextRoundState,
  type IntervalGameState,
} from './intervalGame';
import type { IntervalGameAction } from './intervalGameReducer';
import type { IntervalGameSettings } from '../../types/settings';

export interface IntervalGameServiceConfig {
  dispatch: Dispatch<IntervalGameAction>;
  getState: () => IntervalGameState;
  hintTimerRef: React.MutableRefObject<number | null>;
  intervalPlayerRef: React.MutableRefObject<ReturnType<typeof audio.createIntervalPlayer> | null>;
}

export class IntervalGameService {
  private dispatch: Dispatch<IntervalGameAction>;
  private getState: () => IntervalGameState;
  private hintTimerRef: React.MutableRefObject<number | null>;
  private intervalPlayerRef: React.MutableRefObject<ReturnType<typeof audio.createIntervalPlayer> | null>;

  constructor(config: IntervalGameServiceConfig) {
    this.dispatch = config.dispatch;
    this.getState = config.getState;
    this.hintTimerRef = config.hintTimerRef;
    this.intervalPlayerRef = config.intervalPlayerRef;

    if (!this.intervalPlayerRef.current) {
      this.intervalPlayerRef.current = audio.createIntervalPlayer({
        delayMs: 500,
        notePlayer: (note) => audio.playNote(note),
      });
    }
  }

  private playInterval(lower: string, upper: string): void {
    this.dispatch({ type: 'SET_LISTENING' });
    this.intervalPlayerRef.current?.play(lower, upper);
  }

  private clearHintTimer(): void {
    if (this.hintTimerRef.current !== null) {
      clearTimeout(this.hintTimerRef.current);
      this.hintTimerRef.current = null;
    }
  }

  private scheduleHintClear(): void {
    this.clearHintTimer();
    this.hintTimerRef.current = window.setTimeout(() => {
      try {
        this.dispatch({ type: 'CLEAR_HINT' });
      } finally {
        this.hintTimerRef.current = null;
      }
    }, 2000);
  }

  init(settings: IntervalGameSettings, autoPlay = true): void {
    const nextState = createInitialIntervalGameState(settings);
    this.dispatch({ type: 'INIT', settings });

    if (autoPlay) {
      this.playInterval(nextState.playbackOrder[0], nextState.playbackOrder[1]);
    }
  }

  nextRound(settings: IntervalGameSettings, autoPlay = true): void {
    const currentState = this.getState();
    const nextState = createNextRoundState(currentState, settings);

    this.clearHintTimer();
    this.dispatch({ type: 'NEXT_ROUND', nextState });

    if (autoPlay) {
      this.playInterval(nextState.playbackOrder[0], nextState.playbackOrder[1]);
    }
  }

  answerQuestion(selectedName: string): void {
    this.dispatch({ type: 'ANSWER', selectedName });
  }

  replay(): void {
    const state = this.getState();
    if (!state.lowerNote || !state.upperNote) return;

    const playbackOrder = state.roundDirection === 'down'
      ? [state.upperNote, state.lowerNote]
      : [state.lowerNote, state.upperNote];

    this.playInterval(playbackOrder[0], playbackOrder[1]);
  }

  requestHint(): void {
    const state = this.getState();

    if (!state.targetInterval || state.isCorrectGuessed || state.hintsLeft <= 0) {
      return;
    }

    this.dispatch({ type: 'HINT' });
    this.scheduleHintClear();
  }

  updateSettings(newSettings: IntervalGameSettings): void {
    const normalizedSettings = normalizeSettings(newSettings);

    saveSettings(normalizedSettings);
    this.dispatch({ type: 'SETTINGS', settings: normalizedSettings });
  }

  hideLeaves(): void {
    this.dispatch({ type: 'HIDE_LEAVES' });
  }

  dispose(): void {
    this.clearHintTimer();
    this.intervalPlayerRef.current?.cancel();
  }
}

export function createIntervalGameService(
  config: IntervalGameServiceConfig,
): IntervalGameService {
  return new IntervalGameService(config);
}
