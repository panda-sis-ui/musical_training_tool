import { useState, useCallback, useRef, useEffect } from 'react';
import { getRandomInterval, DEFAULT_INTERVAL_NAMES, type Interval } from '../lib/intervals';
import { createIntervalPlayer } from '../lib/audio';
import type { IntervalGameSettings } from '../types/settings';

export type HeroMood = 'idle' | 'listening' | 'happy' | 'sad';
export interface IntervalResult {
  intervalName: string;
  isCorrect: boolean;
}

// Ключ для localStorage
const STORAGE_KEY = 'intervalGameSettings';
const DEFAULT_SETTINGS: IntervalGameSettings = {
  intervalNames: DEFAULT_INTERVAL_NAMES,
  tonicFixed: true,
  answerMode: 'buttons',
};

const ALL_NOTES = [
  'C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4',
  'C5','C#5','D5','D#5','E5','F5','F#5','G5','G#5','A5','A#5','B5'
] as const;

const NOTE_SEQUENCE = [...ALL_NOTES] as string[];

function normalizeIntervalNames(intervalNames: unknown): string[] {
  if (!Array.isArray(intervalNames)) {
    return DEFAULT_INTERVAL_NAMES;
  }

  const validNames = intervalNames.filter((name): name is string => typeof name === 'string');
  const normalized = validNames.filter((name) => DEFAULT_INTERVAL_NAMES.includes(name));

  return normalized.length > 0 ? normalized : DEFAULT_INTERVAL_NAMES;
}

function normalizeSettings(value: unknown): IntervalGameSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_SETTINGS;
  }

  const candidate = value as Partial<IntervalGameSettings>;
  const answerMode = candidate.answerMode === 'piano' ? 'piano' : 'buttons';

  return {
    intervalNames: normalizeIntervalNames(candidate.intervalNames),
    tonicFixed: typeof candidate.tonicFixed === 'boolean' ? candidate.tonicFixed : true,
    answerMode,
  };
}

function isValidSettings(value: unknown): value is IntervalGameSettings {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<IntervalGameSettings>;
  return (
    Array.isArray(candidate.intervalNames) &&
    typeof candidate.tonicFixed === 'boolean' &&
    (candidate.answerMode === 'buttons' || candidate.answerMode === 'piano')
  );
}

function saveSettings(settings: IntervalGameSettings): void {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Браузер может запретить запись localStorage.
  }
}

/** Загрузка настроек из localStorage или значения по умолчанию */
function loadSettings(): IntervalGameSettings {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);
    if (isValidSettings(parsed)) {
      return normalizeSettings(parsed);
    }
  } catch {
    // Игнорируем ошибки парсинга и проблемный localStorage.
  }

  return DEFAULT_SETTINGS;
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
  const intervalPlayerRef = useRef<ReturnType<typeof createIntervalPlayer> | null>(null);

  if (!intervalPlayerRef.current) {
    intervalPlayerRef.current = createIntervalPlayer({ delayMs: 500 });
  }

  useEffect(() => {
    return () => {
      if (hintTimerRef.current !== null) {
        clearTimeout(hintTimerRef.current);
      }
      intervalPlayerRef.current?.cancel();
    };
  }, []);

  // --- Воспроизведение интервала (мелодически) ---
  const playInterval = useCallback((lower: string, upper: string) => {
    setMood('listening');
    intervalPlayerRef.current?.play(lower, upper);
  }, []);

  // --- Генерация нового интервала ---
  const generateInterval = useCallback((currentSettings: IntervalGameSettings = settings) => {
    const normalizedSettings = normalizeSettings(currentSettings);
    const interval = getRandomInterval(normalizedSettings.intervalNames);

    const candidateLowerNotes = normalizedSettings.tonicFixed ? ['C4'] : [...NOTE_SEQUENCE];
    const validLowerNotes = candidateLowerNotes.filter((note) => {
      const lowerIndex = NOTE_SEQUENCE.indexOf(note);
      return lowerIndex !== -1 && lowerIndex + interval.semitones < NOTE_SEQUENCE.length;
    });

    const safeLowerNote = validLowerNotes.length > 0
      ? validLowerNotes[Math.floor(Math.random() * validLowerNotes.length)]
      : 'C4';

    const lowerIndex = NOTE_SEQUENCE.indexOf(safeLowerNote);
    const upperIndex = lowerIndex === -1 ? -1 : lowerIndex + interval.semitones;
    const upperNote = upperIndex >= 0 && upperIndex < NOTE_SEQUENCE.length
      ? NOTE_SEQUENCE[upperIndex]
      : NOTE_SEQUENCE[Math.min(NOTE_SEQUENCE.length - 1, lowerIndex === -1 ? 0 : lowerIndex + interval.semitones)];

    setTargetInterval(interval);
    setLowerNote(safeLowerNote);
    setUpperNote(upperNote);

    setLastResult(null);
    setIsCorrectGuessed(false);
    setMood('idle');
    setLeavesVisible(true);
    setRoundId(prev => prev + 1);

    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    intervalPlayerRef.current?.cancel();
    setHintName(null);

    playInterval(safeLowerNote, upperNote);
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
    generateInterval(settings);
  }, [generateInterval, settings]);

  // --- Убрать листья (вручную или после угадывания) ---
  const hideLeaves = useCallback(() => {
    setLeavesVisible(false);
  }, []);

  // --- Обновление настроек (сохранение в localStorage и перегенерация) ---
  const updateSettings = useCallback((newSettings: IntervalGameSettings) => {
    const normalizedSettings = normalizeSettings(newSettings);
    setSettings(normalizedSettings);
    saveSettings(normalizedSettings);
    generateInterval(normalizedSettings);
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