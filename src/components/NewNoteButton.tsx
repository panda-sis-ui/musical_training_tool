
interface NewNoteButtonProps {
  onNewNote: () => void;   // функция генерации новой ноты
  label?: string;          // текст на кнопке (по умолчанию "🎲 Новая нота")
}

import styles from './NewNoteButton.module.css';

export default function NewNoteButton({ onNewNote, label = '🎲 Новая нота' }: NewNoteButtonProps) {
  return (
    <button onClick={onNewNote} className={styles.button}>
      {label}
    </button>
  );
}