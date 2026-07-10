import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './Piano.module.css';

// Частоты для каждой ноты (используются в пианино)
const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25,
};

// Белые и чёрные клавиши в порядке расположения
const whiteKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
const blackKeys = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5'];

// Маппинг клавиш клавиатуры на ноты (русская раскладка не учитывается)
const KEYBOARD_MAP: Record<string, string> = {
  'a': 'C4',  'w': 'C#4',
  's': 'D4',  'e': 'D#4',
  'd': 'E4',
  'f': 'F4',  't': 'F#4',
  'g': 'G4',  'y': 'G#4',
  'h': 'A4',  'u': 'A#4',
  'j': 'B4',
  'k': 'C5',  'o': 'C#5',
  'l': 'D5',  'p': 'D#5',
  ';': 'E5',
};

// Минимальная длительность звука при отпускании клавиши (чтобы не было щелчков)
const MIN_DURATION = 100;

// Преобразование английского названия ноты в русское (с учётом диеза)
const getRussianNoteName = (note: string): string => {
  const base = note.slice(0, -1);
  const isSharp = base.includes('#');
  const letter = isSharp ? base.slice(0, -1) : base;
  const russianMap: Record<string, string> = {
    'C': 'До', 'D': 'Ре', 'E': 'Ми', 'F': 'Фа',
    'G': 'Соль', 'A': 'Ля', 'B': 'Си'
  };
  const russianBase = russianMap[letter] || letter;
  return isSharp ? russianBase + '#' : russianBase;
};

interface PianoProps {
  onNotePlay?: (note: string, frequency: number) => void; // колбэк при нажатии
  lastResult?: { note: string; isCorrect: boolean } | null; // для подсветки клавиш
  onInitAudio?: () => void;
}

export default function Piano({ onNotePlay, lastResult, onInitAudio }: PianoProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null); // текущая нажатая нота
  const [highlightedNote, setHighlightedNote] = useState<string | null>(null); // подсвеченная нота
  const [highlightColor, setHighlightColor] = useState<'green' | 'red' | null>(null);

  // Рефы для управления звуком
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillatorRef = useRef<OscillatorNode | null>(null);
  const activeGainRef = useRef<GainNode | null>(null);
  const noteStartTimeRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);

  // Получение или создание AudioContext
  const getAudioContext = useCallback(() => {
  // Если контекста нет или он закрыт, создаём новый
  if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API не поддерживается');
      return null;
    }
    audioCtxRef.current = new AudioContextClass();
  }
  if (audioCtxRef.current.state === 'suspended') {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
}, []);

  // Немедленная остановка звука и сброс состояния
  const stopNow = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (activeOscillatorRef.current) {
      try {
        activeOscillatorRef.current.stop();
        activeOscillatorRef.current.disconnect();
      } catch (_) {}
      activeOscillatorRef.current = null;
      activeGainRef.current = null;
    }
    setActiveNote(null);
  }, []);

  // Воспроизведение ноты (запуск осциллятора)
  const playNote = useCallback((note: string) => {
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    // Останавливаем предыдущий звук, если был
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (activeOscillatorRef.current) {
      try {
        activeOscillatorRef.current.stop();
        activeOscillatorRef.current.disconnect();
      } catch (_) {}
      activeOscillatorRef.current = null;
      activeGainRef.current = null;
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    gainNode.gain.value = 0.3;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    activeOscillatorRef.current = oscillator;
    activeGainRef.current = gainNode;
    setActiveNote(note);

    noteStartTimeRef.current = performance.now();

    if (onNotePlay) onNotePlay(note, freq);
  }, [getAudioContext, onNotePlay]);

  // Остановка звука с учётом минимальной длительности
  const stopNote = useCallback(() => {
    if (!activeOscillatorRef.current) return;
    const elapsed = performance.now() - noteStartTimeRef.current;
    if (elapsed < MIN_DURATION) {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = window.setTimeout(() => {
        stopNow();
        stopTimeoutRef.current = null;
      }, MIN_DURATION - elapsed);
    } else {
      stopNow();
    }
  }, [stopNow]);

  // Обработка изменения lastResult для подсветки клавиш (на 600 мс)
  useEffect(() => {
    if (lastResult) {
      setHighlightedNote(lastResult.note);
      setHighlightColor(lastResult.isCorrect ? 'green' : 'red');
      const timer = setTimeout(() => {
        setHighlightedNote(null);
        setHighlightColor(null);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setHighlightedNote(null);
      setHighlightColor(null);
    }
  }, [lastResult]);

  // Обработчики мыши/тача для клавиш
  const handleMouseDown = (note: string) => {
    if (onInitAudio) onInitAudio();
    // При новом нажатии сбрасываем старую подсветку результата
    setHighlightedNote(null);
    setHighlightColor(null);
    playNote(note);
  };

  const handleMouseUp = () => {
    stopNote();
  };

  const handleMouseLeave = () => {
    stopNote();
  };

  // Подписка на клавиатуру (нажатие/отпускание)
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (pressedKeys.has(key)) return;
      const note = KEYBOARD_MAP[key];
      if (note) {
        e.preventDefault();
        pressedKeys.add(key);
        if (onInitAudio) onInitAudio();
        setHighlightedNote(null);
        setHighlightColor(null);
        playNote(note);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (KEYBOARD_MAP[key]) {
        e.preventDefault();
        pressedKeys.delete(key);
        stopNote();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  stopNow();
  if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
    audioCtxRef.current.close();
  }
};
  }, [playNote, stopNote, stopNow]);

  // Ширина чёрной и белой клавиш в процентах (для позиционирования)
  const blackKeyWidth = 6;
  const whiteKeyWidth = 10;

  return (
    <div className={styles.pianoContainer} style={{ height: '100%', width: '100%', maxWidth: '100%', minHeight: '180px', }}>
      <div className={styles.whiteKeys}>
        {whiteKeys.map((note) => {
          let extraClass = '';
          if (activeNote === note) extraClass = styles.activeWhite;
          else if (highlightedNote === note && highlightColor === 'green') extraClass = styles.correct;
          else if (highlightedNote === note && highlightColor === 'red') extraClass = styles.wrong;
          return (
            <div
              key={note}
              className={`${styles.whiteKey} ${extraClass}`}
              onMouseDown={() => handleMouseDown(note)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleMouseDown(note)}
              onTouchEnd={handleMouseUp}
            >
              <span className={styles.noteLabel}>{getRussianNoteName(note)}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.blackKeys}>
        {blackKeys.map((note) => {
          // Вычисляем позицию чёрной клавиши относительно белых
          const baseNote = note.replace('#', '');
          const whiteIndex = whiteKeys.indexOf(baseNote);
          const leftPercent = (whiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2;
          let extraClass = '';
          if (activeNote === note) extraClass = styles.activeBlack;
          else if (highlightedNote === note && highlightColor === 'green') extraClass = styles.correct;
          else if (highlightedNote === note && highlightColor === 'red') extraClass = styles.wrong;
          return (
            <div
              key={note}
              className={`${styles.blackKey} ${extraClass}`}
              style={{
                left: `${leftPercent}%`,
                width: `${blackKeyWidth}%`,
              }}
              onMouseDown={() => handleMouseDown(note)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleMouseDown(note)}
              onTouchEnd={handleMouseUp}
            >
              <span className={styles.noteLabel}>{getRussianNoteName(note)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}