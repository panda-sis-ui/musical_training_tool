// src/components/Piano.tsx
import { useState } from 'react';
import styles from './Piano.module.css';

const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25,
};

const whiteKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
const blackKeys = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5'];

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
}

export default function Piano({ onNotePlay }: PianoProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const playSound = (note: string) => {
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    gainNode.gain.value = 0.3;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
    if (onNotePlay) onNotePlay(note, freq);
  };

  const handleNotePress = (note: string) => {
    setActiveNote(note);
    playSound(note);
    setTimeout(() => setActiveNote(null), 200);
  };

  // Процентное позиционирование для чёрных клавиш
  // Белая клавиша занимает 10% ширины (так как 10 белых)
  // Чёрная клавиша имеет ширину 6% (можно настроить)
  const blackKeyWidth = 6; // в %
  const whiteKeyWidth = 10; // в %

  return (
    <div className={styles.pianoContainer}>
      <div className={styles.whiteKeys}>
        {whiteKeys.map((note) => (
          <div
            key={note}
            className={`${styles.whiteKey} ${activeNote === note ? styles.activeWhite : ''}`}
            onMouseDown={() => handleNotePress(note)}
          >
            <span className={styles.noteLabel}>{getRussianNoteName(note)}</span>
          </div>
        ))}
      </div>

      <div className={styles.blackKeys}>
        {blackKeys.map((note) => {
          // Находим индекс белой клавиши, после которой стоит чёрная
          const baseNote = note.replace('#', '');
          const whiteIndex = whiteKeys.indexOf(baseNote);
          // Вычисляем позицию: центр промежутка между белыми клавишами
          const leftPercent = (whiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2;
          return (
            <div
              key={note}
              className={`${styles.blackKey} ${activeNote === note ? styles.activeBlack : ''}`}
              style={{
                left: `${leftPercent}%`,
                width: `${blackKeyWidth}%`,
              }}
              onClick={() => handleNotePress(note)}
            >
              <span className={styles.noteLabel}>{getRussianNoteName(note)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}