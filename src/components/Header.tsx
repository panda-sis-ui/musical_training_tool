// 1. Импорты
// ------------------------------------------------------------------
import styles from './Header.module.css';

// 2. Интерфейс пропсов – принимает только заголовок
// ------------------------------------------------------------------
interface HeaderProps {
  /** Заголовок, который будет отображаться */
  title: string;
}

// 3. Компонент – шапка с заголовком и иконкой меню (пока не функциональна)
// ------------------------------------------------------------------
export default function Header({ title }: HeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.title}>{title}</span>
      <div className={styles.button_menu}>
        <span className={styles.hamburger}>☰</span>
      </div>
    </div>
  );
}