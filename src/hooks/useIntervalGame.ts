import { useCallback, useEffect, useReducer, useRef } from 'react';
import { loadSettings } from '../infrastructure/storage/settingsStorage';
import { intervalGameReducer } from '../application/intervalGame/intervalGameReducer';
import { createIntervalGameService } from '../application/intervalGame/intervalGameService';
import { createInitialIntervalGameState, type HeroMood, type IntervalResult } from '../application/intervalGame/intervalGame';
import * as audio from '../lib/audio';
import type { IntervalGameSettings } from '../types/settings';

export type { HeroMood, IntervalResult };

export function useIntervalGame() {
  const [state, dispatch] = useReducer(
    intervalGameReducer,
    createInitialIntervalGameState(loadSettings()),
  );

  const hintTimerRef = useRef<number | null>(null);
  const intervalPlayerRef = useRef<ReturnType<typeof audio.createIntervalPlayer> | null>(null);
  const stateRef = useRef(state);

  // Keep stateRef in sync with current state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Create service instance once (persisted across all renders)
  const serviceRef = useRef<ReturnType<typeof createIntervalGameService> | null>(null);

  if (!serviceRef.current) {
    serviceRef.current = createIntervalGameService({
      dispatch,
      getState: () => stateRef.current,
      hintTimerRef,
      intervalPlayerRef,
    });
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      serviceRef.current?.dispose();
    };
  }, []);

  const initGame = useCallback((options?: { autoPlay?: boolean }) => {
    const settings = loadSettings();
    serviceRef.current.init(settings, options?.autoPlay !== false);
  }, []);

  const startNewRound = useCallback(() => {
    const settings = loadSettings();
    serviceRef.current.nextRound(settings, true);
  }, []);

  const replayInterval = useCallback(() => {
    serviceRef.current.replay();
  }, []);

  const handleAnswer = useCallback((selectedName: string) => {
    serviceRef.current.answerQuestion(selectedName);
  }, []);

  const requestHint = useCallback(() => {
    serviceRef.current.requestHint();
  }, []);

  const hideLeaves = useCallback(() => {
    serviceRef.current.hideLeaves();
  }, []);

  const updateSettings = useCallback((newSettings: IntervalGameSettings) => {
    serviceRef.current.updateSettings(newSettings);
  }, []);

  return {
    score: state.score,
    targetInterval: state.targetInterval,
    lowerNote: state.lowerNote,
    upperNote: state.upperNote,
    roundDirection: state.roundDirection,
    lastResult: state.lastResult,
    isCorrectGuessed: state.isCorrectGuessed,
    mood: state.mood,
    roundId: state.roundId,
    leavesVisible: state.leavesVisible,
    hintsLeft: state.hintsLeft,
    hintName: state.hintName,
    handleAnswer,
    startNewRound,
    replayInterval,
    requestHint,
    initGame,
    hideLeaves,
    settings: state.settings,
    updateSettings,
  };
}