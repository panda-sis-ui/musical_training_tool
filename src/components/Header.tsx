// 1. Импорты
// ------------------------------------------------------------------
import styles from './Header.module.css';

// 2. Интерфейс пропсов
// ------------------------------------------------------------------
interface HeaderProps {
  /** Заголовок, который будет отображаться */
  title: string;
}

// 3. Компонент (функциональный)
// ------------------------------------------------------------------
export default function Header({ title }: HeaderProps) {
  // 7. JSX-разметка
  // ------------------------------------------------------------------
  return (
    <div className={styles.header}>
      <span className={styles.title}>{title}</span>
      <div className={styles.button_menu}>
        <span className={styles.hamburger}>☰</span>
      </div>
    </div>
  );
}