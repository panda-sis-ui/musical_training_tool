import Piano from './components/Piano';
import Header from './components/Header';
import Hero_img from './components/Hero_img';
import HiddenNote from './components/Hidden_note';

import foxImage from './assets/fox1.png'; 

function App() {
  const handleNote = (note: string, freq: number) => {
    console.log(`Нажата нота ${note} (${freq} Гц)`);
  };

  return (
    <>
      <Header title="Угадай ноту" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-around' }}>
        <Hero_img name_image={foxImage} name_game="Угадай ноту" />
        <HiddenNote note="C#4" />
      </div>
      <Piano onNotePlay={handleNote} />
    </>
  );
}

export default App;