import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1>🎵 Музыкальные игры</h1>
      <ul className={styles.menu}>
        <li>
          <Link to="/guess-note">🎹 Угадай ноту</Link>
        </li>
        <li>
          <Link to="/coming-soon">🚧 Скоро …</Link>
        </li>
      </ul>
    </div>
  );
}