import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './Piano.module.css';
import { WHITE_KEYS, BLACK_KEYS, KEYBOARD_MAP, getRussianNoteName } from '../lib/notes';
import { startNote, type PlayingNote } from '../lib/audio';

/** Минимальная длительность звучания ноты, даже при коротком клике (мс) */
const MIN_DURATION = 200;

interface PianoProps {
  /** Вызывается при нажатии клавиши */
  onNotePlay?: (note: string) => void;
  /** Последний результат — подсветить клавишу зелёным (верно) или красным (неверно) */
  lastResult?: { note: string; isCorrect: boolean } | null;
}

export default function Piano({ onNotePlay, lastResult }: PianoProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [highlightedNote, setHighlightedNote] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState<'green' | 'red' | null>(null);

  const playingNoteRef = useRef<PlayingNote | null>(null);
  const noteStartTimeRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);

  const stopNow = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    playingNoteRef.current?.stop();
    playingNoteRef.current = null;
    setActiveNote(null);
  }, []);

  const playNote = useCallback(
    async (note: string) => {
      stopNow();
      setHighlightedNote(null);
      setHighlightColor(null);

      const playing = await startNote(note);
      if (!playing) return;

      playingNoteRef.current = playing;
      noteStartTimeRef.current = performance.now();
      setActiveNote(note);

      if (onNotePlay) onNotePlay(note);
    },
    [stopNow, onNotePlay],
  );

  const stopNote = useCallback(() => {
    if (!playingNoteRef.current) return;
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

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (pressedKeys.has(key)) return;
      const note = KEYBOARD_MAP[key];
      if (note) {
        e.preventDefault();
        pressedKeys.add(key);
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
    };
  }, [playNote, stopNote]);

  // Глушим звук только при размонтировании, а не при каждом пересоздании playNote
  useEffect(() => stopNow, [stopNow]);

  const handlePress = (note: string) => playNote(note);
  const handleRelease = () => stopNote();

  const keyClass = (note: string, activeClass: string): string => {
    if (activeNote === note) return activeClass;
    if (highlightedNote === note && highlightColor === 'green') return styles.correct;
    if (highlightedNote === note && highlightColor === 'red') return styles.wrong;
    return '';
  };

  const blackKeyWidth = 6;
  const whiteKeyWidth = 10;

  return (
    <div
      className={styles.pianoContainer}
      style={{ height: '100%', width: '100%', maxWidth: '100%', minHeight: '180px' }}
    >
      <div className={styles.whiteKeys}>
        {WHITE_KEYS.map((note) => (
          <div
            key={note}
            className={`${styles.whiteKey} ${keyClass(note, styles.activeWhite)}`}
            style={{ touchAction: 'none' }}
            onPointerDown={() => handlePress(note)}
            onPointerUp={handleRelease}
            onPointerLeave={handleRelease}
            onPointerCancel={handleRelease}
          >
            <span className={styles.noteLabel}>{getRussianNoteName(note)}</span>
          </div>
        ))}
      </div>
      <div className={styles.blackKeys}>
        {BLACK_KEYS.map((note) => {
          const baseNote = note.replace('#', '');
          const whiteIndex = WHITE_KEYS.indexOf(baseNote);
          const leftPercent = (whiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2;
          return (
            <div
              key={note}
              className={`${styles.blackKey} ${keyClass(note, styles.activeBlack)}`}
              style={{
                left: `${leftPercent}%`,
                width: `${blackKeyWidth}%`,
                touchAction: 'none',
              }}
              onPointerDown={() => handlePress(note)}
              onPointerUp={handleRelease}
              onPointerLeave={handleRelease}
              onPointerCancel={handleRelease}
            >
              <span className={styles.noteLabel}>{getRussianNoteName(note)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
