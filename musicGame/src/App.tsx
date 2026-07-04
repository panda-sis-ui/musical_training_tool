import Piano from './components/Piano';

function App() {
  const handleNote = (note: string, freq: number) => {
    console.log(`Нажата нота ${note} (${freq} Гц)`);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Piano onNotePlay={handleNote} />
    </div>
  );
}

export default App;