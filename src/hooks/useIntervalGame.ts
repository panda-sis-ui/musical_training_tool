import { useState, useCallback, useRef } from 'react';
import { getRandomInterval, DEFAULT_INTERVAL_NAMES, type Interval } from '../lib/intervals';
import { playNote } from '../lib/audio';
import type { IntervalGameSettings } from '../types/settings';

export type HeroMood = 'idle' | 'listening' | 'happy' | 'sad';
export interface IntervalResult {
  intervalName: string;
  isCorrect: boolean;
}

// Ключ для localStorage
const STORAGE_KEY = 'intervalGameSettings';

/** Загрузка настроек из localStorage или значения по умолчанию */
function loadSettings(): IntervalGameSettings {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.intervalNames && typeof parsed.tonicFixed === 'boolean' && parsed.answerMode) {
        return parsed;
      }
    } catch {
      // игнорируем ошибки парсинга
    }
  }
  return {
    intervalNames: DEFAULT_INTERVAL_NAMES,
    tonicFixed: true,
    answerMode: 'buttons',
  };
}

/** Получить случайную ноту в диапазоне C4–B4 */
function getRandomNote(): string {
  const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'];
  return notes[Math.floor(Math.random() * notes.length)];
}

export function useIntervalGame() {
  // --- Настройки (загружаем из localStorage) ---
  const [settings, setSettings] = useState<IntervalGameSettings>(loadSettings);

  // --- Игровые состояния ---
  const [score, setScore] = useState(0);
  const [targetInterval, setTargetInterval] = useState<Interval | null>(null);
  const [lowerNote, setLowerNote] = useState<string>('C4');
  const [upperNote, setUpperNote] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<IntervalResult | null>(null);
  const [isCorrectGuessed, setIsCorrectGuessed] = useState(false);
  const [mood, setMood] = useState<HeroMood>('idle');
  const [roundId, setRoundId] = useState(0);
  const [leavesVisible, setLeavesVisible] = useState(true);

  // --- Подсказки ---
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintName, setHintName] = useState<string | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  // --- Воспроизведение интервала (мелодически) ---
  const playInterval = useCallback((lower: string, upper: string) => {
    playNote(lower);
    setMood('listening');
    setTimeout(() => {
      playNote(upper);
    }, 500);
  }, []);

  // --- Генерация нового интервала ---
  const generateInterval = useCallback(() => {
    const interval = getRandomInterval(settings.intervalNames);
    setTargetInterval(interval);

    let lower = 'C4';
    if (!settings.tonicFixed) {
      lower = getRandomNote();
    }
    setLowerNote(lower);

    const allNotes = [
      'C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4',
      'C5','C#5','D5','D#5','E5','F5','F#5','G5','G#5','A5','A#5','B5'
    ];
    const lowerIndex = allNotes.indexOf(lower);
    const upperIndex = lowerIndex + interval.semitones;
    if (upperIndex >= allNotes.length) {
      // Если выходит за пределы, пробуем рекурсивно с другой нижней нотой
      return generateInterval();
    }
    const upper = allNotes[upperIndex];
    setUpperNote(upper);

    setLastResult(null);
    setIsCorrectGuessed(false);
    setMood('idle');
    setLeavesVisible(true);
    setRoundId(prev => prev + 1);

    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setHintName(null);

    playInterval(lower, upper);
  }, [settings, playInterval]);

  // --- Повторное воспроизведение текущего интервала ---
  const replayInterval = useCallback(() => {
    if (lowerNote && upperNote) {
      playInterval(lowerNote, upperNote);
    }
  }, [lowerNote, upperNote, playInterval]);

  // --- Обработка ответа игрока (выбор интервала) ---
  const handleAnswer = useCallback(
    (selectedName: string) => {
      if (!targetInterval || isCorrectGuessed) return;

      const isCorrect = selectedName === targetInterval.name;
      setLastResult({ intervalName: selectedName, isCorrect });

      if (isCorrect) {
        setIsCorrectGuessed(true);
        setMood('happy');
        setLeavesVisible(false);
        setScore(prev => prev + 1);
      } else {
        setMood('sad');
        // Не блокируем кнопки, можно пытаться снова
      }
    },
    [targetInterval, isCorrectGuessed]
  );

  // --- Следующий раунд ---
  const startNewRound = useCallback(() => {
    generateInterval();
  }, [generateInterval]);

  // --- Подсказка ---
  const requestHint = useCallback(() => {
    if (!targetInterval || isCorrectGuessed || hintsLeft <= 0) return;
    setHintsLeft(prev => prev - 1);
    setHintName(targetInterval.name);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintName(null);
      hintTimerRef.current = null;
    }, 2000);
  }, [targetInterval, isCorrectGuessed, hintsLeft]);

  // --- Инициализация игры ---
  const initGame = useCallback(() => {
    generateInterval();
  }, [generateInterval]);

  // --- Убрать листья (вручную или после угадывания) ---
  const hideLeaves = useCallback(() => {
    setLeavesVisible(false);
  }, []);

  // --- Обновление настроек (сохранение в localStorage и перегенерация) ---
  const updateSettings = useCallback((newSettings: IntervalGameSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    // Перегенерировать интервал с новыми настройками
    generateInterval();
  }, [generateInterval]);

  // --- Возвращаемые значения ---
  return {
    // Игровые данные
    score,
    targetInterval,
    lowerNote,
    upperNote,
    lastResult,
    isCorrectGuessed,
    mood,
    roundId,
    leavesVisible,
    hintsLeft,
    hintName,
    // Действия
    handleAnswer,
    startNewRound,
    replayInterval,
    requestHint,
    initGame,
    hideLeaves,
    // Настройки
    settings,
    updateSettings,
  };
}