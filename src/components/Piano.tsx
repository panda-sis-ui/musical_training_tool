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

const whiteKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
const blackKeys = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5'];

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

const MIN_DURATION = 200;

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
  onNotePlay?: (note: string, frequency: number) => void;
  lastResult?: { note: string; isCorrect: boolean } | null;
  onInitAudio?: () => void;
  audioContextRef: React.RefObject<AudioContext | null>;
}

export default function Piano({
  onNotePlay,
  lastResult,
  onInitAudio,
  audioContextRef,
}: PianoProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [highlightedNote, setHighlightedNote] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState<'green' | 'red' | null>(null);

  const activeOscillatorRef = useRef<OscillatorNode | null>(null);
  const activeGainRef = useRef<GainNode | null>(null);
  const noteStartTimeRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);

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

  const playNote = useCallback(
  async (note: string) => {
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;

    // 1. Создаём контекст, если его нет или он закрыт
    if (onInitAudio) onInitAudio();

    // 2. Получаем контекст
    let ctx = audioContextRef.current;
    if (!ctx) {
      console.warn('AudioContext не доступен');
      return;
    }

    // 3. Если контекст приостановлен – дожидаемся resume
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('Не удалось возобновить контекст', err);
        return;
      }
    }

    // 4. Если закрыт – пытаемся пересоздать
    if (ctx.state === 'closed') {
      if (onInitAudio) onInitAudio();
      ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        console.warn('AudioContext закрыт и не может быть восстановлен');
        return;
      }
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (err) {
          console.warn('Не удалось возобновить контекст', err);
          return;
        }
      }
    }

    // 5. Останавливаем предыдущий звук
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

    // 6. Создаём осциллятор
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
  },
  [audioContextRef, onInitAudio, onNotePlay]
);

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

  useEffect(() => {
    if (lastResult) {
      setHighlightedNote(lastResult.note);
      setHighlightColor(lastResult.isCorrect ? 'green' : 'red');
      const timer = setTimeout(() => {
        setHighlightedNote(null);
        setHighlightColor(null);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setHighlightedNote(null);
      setHighlightColor(null);
    }
  }, [lastResult]);

  const handleMouseDown = (note: string) => {
    setHighlightedNote(null);
    setHighlightColor(null);
    playNote(note);
  };

  const handleMouseUp = () => stopNote();
  const handleMouseLeave = () => stopNote();

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (pressedKeys.has(key)) return;
      const note = KEYBOARD_MAP[key];
      if (note) {
        e.preventDefault();
        pressedKeys.add(key);
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
    };
  }, [playNote, stopNote, stopNow]);

  const blackKeyWidth = 6;
  const whiteKeyWidth = 10;

  return (
    <div
      className={styles.pianoContainer}
      style={{ height: '100%', width: '100%', maxWidth: '100%', minHeight: '180px' }}
    >
      <div className={styles.whiteKeys}>
        {whiteKeys.map((note) => {
          let extraClass = '';
          if (activeNote === note) extraClass = styles.activeWhite;
          else if (highlightedNote === note && highlightColor === 'green')
            extraClass = styles.correct;
          else if (highlightedNote === note && highlightColor === 'red')
            extraClass = styles.wrong;
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
          const baseNote = note.replace('#', '');
          const whiteIndex = whiteKeys.indexOf(baseNote);
          const leftPercent = (whiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2;
          let extraClass = '';
          if (activeNote === note) extraClass = styles.activeBlack;
          else if (highlightedNote === note && highlightColor === 'green')
            extraClass = styles.correct;
          else if (highlightedNote === note && highlightColor === 'red')
            extraClass = styles.wrong;
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