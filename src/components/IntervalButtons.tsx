import styles from './IntervalButtons.module.css';

interface IntervalButtonsProps {
  intervalNames: string[];
  onSelect: (name: string) => void;
  disabled?: boolean;       // блокировка при завершённом раунде (правильный ответ)
  lastResult?: { intervalName: string; isCorrect: boolean } | null;
}

export default function IntervalButtons({
  intervalNames,
  onSelect,
  disabled = false,
  lastResult,
}: IntervalButtonsProps) {
  // Кнопки блокируются только если disabled=true ИЛИ был правильный ответ (lastResult?.isCorrect === true)
  const isBlocked = disabled || (lastResult?.isCorrect === true);

  return (
    <div className={styles.buttonsGrid}>
      {intervalNames.map((name) => {
        let className = styles.button;
        if (lastResult && lastResult.intervalName === name) {
          className += lastResult.isCorrect ? ` ${styles.correct}` : ` ${styles.wrong}`;
        }
        return (
          <button
            key={name}
            className={className}
            onClick={() => onSelect(name)}
            disabled={isBlocked}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}