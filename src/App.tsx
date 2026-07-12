import { useState, useCallback, useEffect, useRef } from 'react';
import Piano from './components/Piano';
import Header from './components/Header';
import Hero_img from './components/Hero_img';
import HiddenNote from './components/HiddenNote';
import NewNoteButton from './components/NewNoteButton';
import Check from './components/Check';
import foxImage from './assets/fox1.png';

// Все возможные ноты в диапазоне от C4 до E5
const ALL_NOTES = [
  'C4', 'C#4', 'D4', 'D#4', 'E4',
  'F4', 'F#4', 'G4', 'G#4', 'A4',
  'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5'
];

// Частоты для воспроизведения звука
const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25,
};

function App() {
  const [score, setScore] = useState(0);  // счётчик правильных ответов
  const [isNoteGuessed, setIsNoteGuessed] = useState(false);

  // Текущая загаданная нота (выбирается случайно при первом рендере)
  const [targetNote, setTargetNote] = useState<string>(() => {
    return ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
  });

  // Сообщение о результате проверки
  const [resultMessage, setResultMessage] = useState<{ text: string; isCorrect: boolean } | null>(null);
  // Последний сыгранный результат для подсветки клавиш
  const [lastResult, setLastResult] = useState<{ note: string; isCorrect: boolean } | null>(null);

  // Реф для AudioContext (инициализируется по первому клику пользователя)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Инициализация AudioContext – вызывается по первому клику на странице
const initAudio = useCallback(() => {
  // Пересоздаём, если нет или закрыт
  if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
    return;
  }
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

  // Воспроизведение звука для заданной ноты (синусоида, длительность 0.4 с)
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



  // Обработчик нажатия на клавишу пианино
  const handleNotePlay = (playedNote: string, frequency: number) => {
    const isCorrect = playedNote === targetNote;
    setLastResult({ note: playedNote, isCorrect });
    setResultMessage({
      text: isCorrect ? '✅ Правильно!' : '❌ Неправильно',
      isCorrect,
    });
    if (isCorrect && !isNoteGuessed) {
      setScore(prev => prev + 1);
      setIsNoteGuessed(true);
    }
  }; // <-- закрывающая скобка для handleNotePlay

  // Генерация новой случайной ноты и сброс результатов
  const generateNewNote = useCallback(() => {
    const newNote = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
    setTargetNote(newNote);
    setResultMessage(null);
    setLastResult(null);
    setIsNoteGuessed(false);

    initAudio();
    if (audioCtxRef.current) {
      playNoteSound(newNote);
    }
  }, [initAudio, playNoteSound]);

  // Проигрывание загаданной ноты (по клику на облачко)
  const playTargetNote = useCallback(() => {
    initAudio();
    if (audioCtxRef.current) {
      playNoteSound(targetNote);
    }
  }, [targetNote, initAudio, playNoteSound]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header title="Угадай ноту" />

      {/* Верхняя часть – ограничена по высоте, чтобы не перекрывать пианино */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          flex: 1,                     // растягивается
          maxHeight: '60vh',           // не более 67% высоты экрана
          minHeight: 0,                // может сжиматься при нехватке места
          gap: '10px',
          flexWrap: 'wrap',
          overflow: 'hidden',    // скрываем лишнее, если содержимое слишком большое
        }}
      >
        {/* Левая колонка */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <Hero_img
            name_image={foxImage}
            name_game="Угадай ноту"
            onCloudClick={playTargetNote}
            resultMessage={resultMessage}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            width: '100%',
            alignItems: 'center',
          }}>
            <Check score={score} />
            <NewNoteButton onNewNote={generateNewNote} />
          </div>
        </div>

        {/* Правая часть – нотный стан */}
        <HiddenNote note={targetNote} />
      </div>

      {/* Пианино – занимает всё оставшееся место */}
      <div
        style={{
          height: '40vh',              // ровно треть экрана
          minHeight: '180px',          // минимум для удобства
          flexShrink: 0,               // не сжимается
          display: 'flex',
          alignItems: 'stretch',
          padding: '0 8px 8px',
        }}
      >
        <Piano onNotePlay={handleNotePlay} lastResult={lastResult} onInitAudio={initAudio} audioContextRef={audioCtxRef}/>
      </div>
    </div>
  );
}

export default App;