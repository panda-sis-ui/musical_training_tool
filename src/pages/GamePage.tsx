import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Piano from '../components/Piano';
import Header from '../components/Header';
import Hero_img from '../components/Hero_img';
import HiddenNote from '../components/HiddenNote';
import NewNoteButton from '../components/NewNoteButton';
import Check from '../components/Check';
import fox1 from '../assets/fox1.png';
import fox3 from '../assets/fox3.png';
import fox4 from '../assets/fox4.png';
import fox5 from '../assets/fox5.png';

const ALL_NOTES = [
  'C4', 'C#4', 'D4', 'D#4', 'E4',
  'F4', 'F#4', 'G4', 'G#4', 'A4',
  'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5'
];

const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25,
};

export default function GamePage() {
  const [score, setScore] = useState(0);
  const [isNoteGuessed, setIsNoteGuessed] = useState(false);
  const [targetNote, setTargetNote] = useState<string>(() => {
    return ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
  });
  const [resultMessage, setResultMessage] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [currentImage, setCurrentImage] = useState(fox1);
  const [lastResult, setLastResult] = useState<{ note: string; isCorrect: boolean } | null>(null);
  const [generationId, setGenerationId] = useState(0);
  const [leavesVisible, setLeavesVisible] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API не поддерживается');
      return;
    }
    audioCtxRef.current = new AudioContextClass();
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playNoteSound = useCallback(async (note: string) => {
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;
    let ctx = audioCtxRef.current;
    if (!ctx || ctx.state === 'closed') {
      initAudio();
      ctx = audioCtxRef.current;
      if (!ctx) return;
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
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
  }, [initAudio]);

  const handleNotePlay = (playedNote: string) => {
    const isCorrect = playedNote === targetNote;
    setLastResult({ note: playedNote, isCorrect });
    setResultMessage({ text: isCorrect ? '✅' : '❌', isCorrect });

    if (isCorrect) {
      setCurrentImage(fox4);
      setLeavesVisible(false);
      if (!isNoteGuessed) {
        setScore(prev => prev + 1);
        setIsNoteGuessed(true);
      }
    } else {
      setCurrentImage(fox5);
    }
  };

  const generateNewNote = useCallback(() => {
    const newNote = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
    setTargetNote(newNote);
    setResultMessage(null);
    setLastResult(null);
    setIsNoteGuessed(false);
    setCurrentImage(fox1);
    setGenerationId(prev => prev + 1);
    setLeavesVisible(true);
    initAudio();
    if (audioCtxRef.current) {
      playNoteSound(newNote);
    }
  }, [initAudio, playNoteSound]);

  const playTargetNote = useCallback(() => {
    initAudio();
    if (audioCtxRef.current) {
      playNoteSound(targetNote);
      setCurrentImage(fox3);
    }
  }, [targetNote, initAudio, playNoteSound]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header title="Угадай ноту" />
      <Link to="/" style={{ margin: '10px', display: 'inline-block' }}>🏠 На главную</Link>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        flex: '1 1 auto',
        minHeight: 0,
        gap: '10px',
        flexWrap: 'wrap',
        padding: '8px',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          minWidth: '200px',
        }}>
          <Hero_img
            name_image={currentImage}
            name_game="Нажми, чтобы услышать"
            onCloudClick={playTargetNote}
            resultMessage={resultMessage}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <Check score={score} />
            <NewNoteButton onNewNote={generateNewNote} />
          </div>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '150px', maxWidth: '400px' }}>
          <HiddenNote
            key={generationId}
            note={targetNote}
            visible={leavesVisible}
            onClear={() => setLeavesVisible(false)}
          />
        </div>
      </div>

      <div style={{
        flex: '0 0 auto',
        minHeight: '200px',
        height: 'auto',
        padding: '8px',
      }}>
        <Piano onNotePlay={handleNotePlay} lastResult={lastResult} onInitAudio={initAudio} audioContextRef={audioCtxRef} />
      </div>
    </div>
  );
}