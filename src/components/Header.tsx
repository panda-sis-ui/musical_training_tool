import { Link } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <div className={styles.header}>
      <Link to="/" className={styles.homeLink} title="На главную">
        <span className={styles.homeIcon}>🏠</span>
      </Link>
      <span className={styles.title}>{title}</span>
      <div className={styles.rightGroup}>
        <div className={styles.button_menu}>
          <span className={styles.hamburger}>☰</span>
        </div>
      </div>
    </div>
  );
}