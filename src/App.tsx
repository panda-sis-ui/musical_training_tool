import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import IntervalGamePage from './pages/IntervalGamePage';
import ComingSoon from './pages/ComingSoon';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/guess-note" element={<GamePage />} />
        <Route path="/guess-interval" element={<IntervalGamePage />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="*" element={<h1>404 – Страница не найдена</h1>} />
      </Routes>
    </HashRouter>
  );
}

export default App;