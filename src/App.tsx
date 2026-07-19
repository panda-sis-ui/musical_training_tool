import { useState, useCallback, useRef } from 'react';
import Piano from './components/Piano';
import Header from './components/Header';
import Hero_img from './components/Hero_img';
import HiddenNote from './components/HiddenNote';
import NewNoteButton from './components/NewNoteButton';
import Check from './components/Check';
import fox1 from './assets/fox1.png';
//import fox2 from './assets/fox2.png';
import fox3 from './assets/fox3.png';
import fox4 from './assets/fox4.png';
import fox5 from './assets/fox5.png';


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
  //Состояние картинки
  const [currentImage, setCurrentImage] = useState(fox1);
  // Последний сыгранный результат для подсветки клавиш
  const [lastResult, setLastResult] = useState<{ note: string; isCorrect: boolean } | null>(null);
  
  // ID для принудительного пересоздания HiddenNote при новой ноте (чтобы листья снова появились)
  const [generationId, setGenerationId] = useState(0);

  // Реф для AudioContext (инициализируется по первому клику пользователя)
  const audioCtxRef = useRef<AudioContext | null>(null);

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
  const handleNotePlay = (playedNote: string) => {
  const isCorrect = playedNote === targetNote;
  setLastResult({ note: playedNote, isCorrect });
  setResultMessage({
    text: isCorrect ? '✅' : '❌',
    isCorrect,
  });

  if (isCorrect) {
    setCurrentImage(fox4);
    if (!isNoteGuessed) {
      setScore(prev => prev + 1);
      setIsNoteGuessed(true);
    }
  } else {
    setCurrentImage(fox5);
  }
};

  // Генерация новой случайной ноты и сброс результатов
  const generateNewNote = useCallback(() => {
    const newNote = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
    setTargetNote(newNote);
    setResultMessage(null);
    setLastResult(null);
    setIsNoteGuessed(false);
    setCurrentImage(fox1);
    setGenerationId(prev => prev + 1); // увеличиваем счётчик, чтобы пересоздать HiddenNote

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
      setCurrentImage(fox3);   // задумчивая лиса
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
          flex: '1 1 auto',
          minHeight: 0,
          gap: '10px',
          flexWrap: 'wrap',
          padding: '8px',
        }}
      >
        {/* Левая колонка */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            minWidth: '200px',
          }}
        >
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

        {/* Правая часть – нотный стан */}
        <div style={{ flex: '1 1 200px', minWidth: '150px', maxWidth: '400px' }}>
          <HiddenNote key={generationId} note={targetNote} />
        </div>
      </div>

      {/* Пианино – занимает всё оставшееся место */}
      <div
        style={{
          flex: '0 0 auto',
          minHeight: '200px',
          height: 'auto',
          padding: '8px',
          }}
      >
        <Piano onNotePlay={handleNotePlay} lastResult={lastResult} onInitAudio={initAudio} audioContextRef={audioCtxRef}/>
      </div>
    </div>
  );
}

export default App;