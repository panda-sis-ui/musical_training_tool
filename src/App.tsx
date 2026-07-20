import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import ComingSoon from './pages/ComingSoon';

function App() {
  return (
    <BrowserRouter basename="/musical_training_tool">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/guess-note" element={<GamePage />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="*" element={<h1>404 – Страница не найдена</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;