import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import ComingSoon from './pages/ComingSoon';

// HashRouter вместо BrowserRouter: GitHub Pages не умеет отдавать index.html
// для произвольных путей, а с hash-маршрутами обновление страницы работает везде.
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/guess-note" element={<GamePage />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="*" element={<h1>404 – Страница не найдена</h1>} />
      </Routes>
    </HashRouter>
  );
}

export default App;