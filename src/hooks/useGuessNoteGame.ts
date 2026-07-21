import { useState, useCallback } from 'react';
import { getRandomNote } from '../lib/notes';
import { playNote } from '../lib/audio';

/** Настроение персонажа — страница сама решает, какой картинкой его показать */
export type HeroMood = 'idle' | 'listening' | 'happy' | 'sad';

export interface GuessResult {
  note: string;
  isCorrect: boolean;
}

/**
 * Логика игры «Угадай ноту»: загаданная нота, счёт, реакция на ответы.
 * Страница отвечает только за вёрстку и картинки.
 */
export function useGuessNoteGame() {
  const [score, setScore] = useState(0);
  const [isNoteGuessed, setIsNoteGuessed] = useState(false);
  const [targetNote, setTargetNote] = useState<string>(getRandomNote);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [mood, setMood] = useState<HeroMood>('idle');
  /** Меняется с каждым раундом — удобно как key для сброса дочерних компонентов */
  const [roundId, setRoundId] = useState(0);
  const [leavesVisible, setLeavesVisible] = useState(true);

  /** Ответ игрока: нажата нота на пианино */
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

  /** Новый раунд: загадать и проиграть новую ноту */
  const startNewRound = useCallback(() => {
    const newNote = getRandomNote();
    setTargetNote(newNote);
    setLastResult(null);
    setIsNoteGuessed(false);
    setMood('idle');
    setRoundId((prev) => prev + 1);
    setLeavesVisible(true);
    playNote(newNote);
  }, []);

  /** Повторить звучание загаданной ноты */
  const playTargetNote = useCallback(() => {
    playNote(targetNote);
    setMood('listening');
  }, [targetNote]);

  const hideLeaves = useCallback(() => setLeavesVisible(false), []);

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
  };
}
