import styles from './ScoreCounter.module.css';

interface ScoreCounterProps {
  score: number;
}

export default function ScoreCounter({ score }: ScoreCounterProps) {
  return <div className={styles.container}>✅ {score}</div>;
}
