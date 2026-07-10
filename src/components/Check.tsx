import styles from './Check.module.css';

interface CheckProps { score: number; }
export default function Check({ score }: CheckProps) {
  return <div className={styles.container}>✅ {score}</div>;
}