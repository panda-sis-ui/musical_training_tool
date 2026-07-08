import { useState, useCallback, useEffect, useRef } from 'react';
import Piano from './components/Piano';
import Header from './components/Header';
import Hero_img from './components/Hero_img';
import HiddenNote from './components/HiddenNote';
import NewNoteButton from './components/NewNoteButton';
import foxImage from './assets/fox1.png';

const ALL_NOTES = [
  'C4','C#4','D4','D#4','E4',
  'F4','F#4','G4','G#4','A4',
  'A#4','B4','C5','C#5','D5','D#5','E5'
];

const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25,
};

function App() {
  const [targetNote, setTargetNote] = useState<string>(() => {
    return ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
  });

  const [resultMessage, setResultMessage] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [lastResult, setLastResult] = useState<{ note: string; isCorrect: boolean } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API не поддерживается');
      return;
    }
    audioCtxRef.current = new AudioContextClass();
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsAudioReady(true);
  }, []);

  const playNoteSound = useCallback((note: string) => {
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }, []);

  useEffect(() => {
    if (isAudioReady) {
      playNoteSound(targetNote);
    }
  }, [targetNote, isAudioReady, playNoteSound]);

  useEffect(() => {
    const handleFirstClick = () => {
      initAudio();
      if (audioCtxRef.current) {
        playNoteSound(targetNote);
      }
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, [initAudio, playNoteSound, targetNote]);

  const generateNewNote = useCallback(() => {
    const newNote = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
    setTargetNote(newNote);
    setResultMessage(null);
    setLastResult(null); // сброс подсветки
  }, []);

  const handleNotePlay = (playedNote: string, frequency: number) => {
    const isCorrect = playedNote === targetNote;
    setLastResult({ note: playedNote, isCorrect });
    setResultMessage({
      text: isCorrect ? '✅ Правильно!' : `❌ Неправильно`,
      isCorrect,
    });
  };

  const playTargetNote = useCallback(() => {
    if (isAudioReady) {
      playNoteSound(targetNote);
    } else {
      initAudio();
      if (audioCtxRef.current) {
        playNoteSound(targetNote);
      }
    }
  }, [targetNote, isAudioReady, initAudio, playNoteSound]);

  return (
    <>
      <Header title="Угадай ноту" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-around' }}>
        <Hero_img
          name_image={foxImage}
          name_game="Угадай ноту"
          onCloudClick={playTargetNote}
        />
        <HiddenNote note={targetNote} />
      </div>
      <Piano onNotePlay={handleNotePlay} lastResult={lastResult} />
      {resultMessage && (
        <div style={{
          textAlign: 'center',
          fontSize: '24px',
          marginTop: '20px',
          color: resultMessage.isCorrect ? 'green' : 'red',
        }}>
          {resultMessage.text}
        </div>
      )}
      <NewNoteButton onNewNote={generateNewNote} />
    </>
  );
}

export default App;