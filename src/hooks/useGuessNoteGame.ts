import { useState, useCallback, useRef } from 'react';
import { getRandomNote, getRussianNoteName } from '../lib/notes';
import { playNote } from '../lib/audio';

export type HeroMood = 'idle' | 'listening' | 'happy' | 'sad';

export interface GuessResult {
  note: string;
  isCorrect: boolean;
}

export function useGuessNoteGame() {
  const [score, setScore] = useState(0);
  const [isNoteGuessed, setIsNoteGuessed] = useState(false);
  const [targetNote, setTargetNote] = useState<string>(getRandomNote);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [mood, setMood] = useState<HeroMood>('idle');
  const [roundId, setRoundId] = useState(0);
  const [leavesVisible, setLeavesVisible] = useState(true);

  // --- Состояния для подсказки ---
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintName, setHintName] = useState<string | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  // --- Обработчик нажатия на клавишу ---
  const handleNotePlay = useCallback(
    (playedNote: string) => {
      const isCorrect = playedNote === targetNote;
      setLastResult({ note: playedNote, isCorrect });

      if (isCorrect) {
        setMood('happy');
        setLeavesVisible(false);
        if (!isNoteGuessed) {
          setScore((prev) => prev + 1);
          setIsNoteGuessed(true);
        }
      } else {
        setMood('sad');
      }
    },
    [targetNote, isNoteGuessed],
  );

  // --- Начать новый раунд ---
  const startNewRound = useCallback(() => {
    const newNote = getRandomNote();
    setTargetNote(newNote);
    setLastResult(null);
    setIsNoteGuessed(false);
    setMood('idle');
    setRoundId((prev) => prev + 1);
    setLeavesVisible(true);

    // Сброс подсказки
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setHintName(null);

    playNote(newNote);
  }, []);

  // --- Воспроизвести целевую ноту ---
  const playTargetNote = useCallback(() => {
    playNote(targetNote);
    setMood('listening');
  }, [targetNote]);

  // --- Убрать листья ---
  const hideLeaves = useCallback(() => setLeavesVisible(false), []);

  // --- Запросить подсказку ---
  const requestHint = useCallback(() => {
    // Условия: листья видны, нет результата, остались подсказки
    if (!leavesVisible || lastResult !== null || hintsLeft <= 0) {
      return;
    }

    setHintsLeft((prev) => prev - 1);
    const russianName = getRussianNoteName(targetNote);
    setHintName(russianName);

    // Автоматически скрыть через 2 секунды
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }
    hintTimerRef.current = window.setTimeout(() => {
      setHintName(null);
      hintTimerRef.current = null;
    }, 2000);
  }, [leavesVisible, lastResult, hintsLeft, targetNote]);

  // --- Возвращаемое значение ---
  return {
    score,
    targetNote,
    lastResult,
    mood,
    roundId,
    leavesVisible,
    handleNotePlay,
    startNewRound,
    playTargetNote,
    hideLeaves,
    hintsLeft,
    hintName,
    requestHint,
  };
}