import { useState, useCallback, useRef, useEffect } from 'react';
import * as audio from '../lib/audio';
import { getRandomInterval, DEFAULT_INTERVAL_NAMES, type Interval } from '../lib/intervals';
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
  direction: 'up',
};

const ALL_NOTES = [
  'C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4',
  'C5','C#5','D5','D#5','E5','F5','F#5','G5','G#5','A5','A#5','B5'
] as const;

const NOTE_SEQUENCE = [...ALL_NOTES] as string[];
const MAX_NOTE = 'G5';

function isWithinPlayableRange(note: string): boolean {
  return NOTE_SEQUENCE.indexOf(note) !== -1 && NOTE_SEQUENCE.indexOf(note) <= NOTE_SEQUENCE.indexOf(MAX_NOTE);
}

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
  const answerMode = 'buttons';
  const direction = candidate.direction === 'up' || candidate.direction === 'down' || candidate.direction === 'both'
    ? candidate.direction
    : 'up';

  return {
    intervalNames: normalizeIntervalNames(candidate.intervalNames),
    tonicFixed: typeof candidate.tonicFixed === 'boolean' ? candidate.tonicFixed : true,
    answerMode,
    direction,
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
    (candidate.answerMode === 'buttons' || candidate.answerMode === 'piano') &&
    (candidate.direction === 'up' || candidate.direction === 'down' || candidate.direction === 'both')
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
  const [roundDirection, setRoundDirection] = useState<'up' | 'down'>('up');
  const [leavesVisible, setLeavesVisible] = useState(true);

  // --- Подсказки ---
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintName, setHintName] = useState<string | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const intervalPlayerRef = useRef<ReturnType<typeof createIntervalPlayer> | null>(null);

  if (!intervalPlayerRef.current) {
    intervalPlayerRef.current = audio.createIntervalPlayer({
      delayMs: 500,
      notePlayer: (note) => audio.playNote(note),
    });
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
  const generateInterval = useCallback(
    (currentSettings: IntervalGameSettings = settings, options?: { autoPlay?: boolean }) => {
        const normalizedSettings = normalizeSettings(currentSettings);
      const interval = getRandomInterval(normalizedSettings.intervalNames);
      const chosenDirection = normalizedSettings.direction === 'both'
        ? (Math.random() < 0.5 ? 'up' : 'down')
        : normalizedSettings.direction;

      const fixedLowerNotes = normalizedSettings.tonicFixed ? ['C4'] : [...NOTE_SEQUENCE];
      const validNotes = fixedLowerNotes.filter((note) => {
        const index = NOTE_SEQUENCE.indexOf(note);
        return index !== -1 && isWithinPlayableRange(note);
      });

      let lowerNoteValue: string;
      let upperNoteValue: string;

      if (chosenDirection === 'down') {
        const validUpperNotes = NOTE_SEQUENCE.filter((note) => {
          const index = NOTE_SEQUENCE.indexOf(note);
          const lowerIndex = index - interval.semitones;
          return index !== -1 && lowerIndex >= 0 && isWithinPlayableRange(note) && isWithinPlayableRange(NOTE_SEQUENCE[lowerIndex]);
        });

        const startNote = validUpperNotes.length > 0
          ? validUpperNotes[Math.floor(Math.random() * validUpperNotes.length)]
          : 'C4';

        const upperIndex = NOTE_SEQUENCE.indexOf(startNote);
        const lowerIndex = upperIndex - interval.semitones;
        upperNoteValue = NOTE_SEQUENCE[upperIndex] ?? startNote;
        lowerNoteValue = NOTE_SEQUENCE[lowerIndex] ?? NOTE_SEQUENCE[Math.max(0, lowerIndex)];
      } else {
        const validStartNotes = validNotes.filter((note) => {
          const lowerIndex = NOTE_SEQUENCE.indexOf(note);
          const upperIndex = lowerIndex + interval.semitones;
          return upperIndex < NOTE_SEQUENCE.length && isWithinPlayableRange(NOTE_SEQUENCE[upperIndex]);
        });

        const startNote = validStartNotes.length > 0
          ? validStartNotes[Math.floor(Math.random() * validStartNotes.length)]
          : 'C4';

        const lowerIndex = NOTE_SEQUENCE.indexOf(startNote);
        const upperIndex = lowerIndex + interval.semitones;
        lowerNoteValue = NOTE_SEQUENCE[lowerIndex] ?? startNote;
        upperNoteValue = NOTE_SEQUENCE[upperIndex] ?? NOTE_SEQUENCE[Math.min(NOTE_SEQUENCE.length - 1, upperIndex)];
      }

      if (!isWithinPlayableRange(upperNoteValue)) {
        const fallbackIndex = Math.min(
          NOTE_SEQUENCE.indexOf(MAX_NOTE),
          Math.max(0, NOTE_SEQUENCE.indexOf(lowerNoteValue) + interval.semitones),
        );
        upperNoteValue = NOTE_SEQUENCE[fallbackIndex] ?? 'G5';
      }

      setTargetInterval(interval);
      setLowerNote(lowerNoteValue);
      setUpperNote(upperNoteValue);
      setRoundDirection(chosenDirection);

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

      const playbackOrder = chosenDirection === 'down'
        ? [upperNoteValue, lowerNoteValue]
        : [lowerNoteValue, upperNoteValue];

      if (options?.autoPlay !== false) {
        playInterval(playbackOrder[0], playbackOrder[1]);
      }

      return { lowerNote: lowerNoteValue, upperNote: upperNoteValue };
    },
    [settings, playInterval],
  );

  // --- Повторное воспроизведение текущего интервала ---
  const replayInterval = useCallback(() => {
    if (lowerNote && upperNote) {
      const playbackOrder = roundDirection === 'down' ? [upperNote, lowerNote] : [lowerNote, upperNote];
      playInterval(playbackOrder[0], playbackOrder[1]);
    }
  }, [lowerNote, upperNote, playInterval, roundDirection]);

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
    generateInterval(settings);
  }, [generateInterval, settings]);

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
  const initGame = useCallback((options?: { autoPlay?: boolean }) => {
    generateInterval(settings, options);
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
    roundDirection,
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