import styles from './GamePage.module.css';
import Piano from '../components/Piano';
import Header from '../components/Header';
import HeroImage from '../components/HeroImage';
import HiddenNote from '../components/HiddenNote';
import NewNoteButton from '../components/NewNoteButton';
import ScoreCounter from '../components/ScoreCounter';
import { useGuessNoteGame, type HeroMood } from '../hooks/useGuessNoteGame';
import foxIdle from '../assets/fox1.webp';
import foxListening from '../assets/fox3.webp';
import foxHappy from '../assets/fox4.webp';
import foxSad from '../assets/fox5.webp';

const MOOD_IMAGES: Record<HeroMood, string> = {
  idle: foxIdle,
  listening: foxListening,
  happy: foxHappy,
  sad: foxSad,
};

export default function GamePage() {
  const game = useGuessNoteGame();

  const resultMessage = game.lastResult
    ? { text: game.lastResult.isCorrect ? '✅' : '❌', isCorrect: game.lastResult.isCorrect }
    : null;

  return (
    <div className={styles.container}>
    <Header title="Угадай ноту" />
    <div className={styles.main}>
      <div className={styles.heroColumn}>
        <HeroImage
          image={MOOD_IMAGES[game.mood]}
          caption="Нажми, чтобы услышать"
          onCloudClick={game.playTargetNote}
          resultMessage={resultMessage}
          hintName={game.hintName}   // ← передаём название подсказки
        />
        <div className={styles.controls}>
          <ScoreCounter score={game.score} />
          <NewNoteButton onNewNote={game.startNewRound} />
          {/* Новая кнопка подсказки */}
          <button
            className={styles.hintButton}
            onClick={game.requestHint}
            disabled={game.hintsLeft === 0 || !game.leavesVisible || game.lastResult !== null}
            title={game.hintsLeft === 0 ? 'Подсказки закончились' : 'Показать название ноты'}
          >
            💡 {game.hintsLeft > 0 ? game.hintsLeft : '0'}
          </button>
        </div>
      </div>

        <div className={styles.staffWrapper}>
          <HiddenNote
            key={game.roundId}
            note={game.targetNote}
            visible={game.leavesVisible}
            onClear={game.hideLeaves}
          />
        </div>
      </div>

      <div className={styles.pianoWrapper}>
        <Piano onNotePlay={game.handleNotePlay} lastResult={game.lastResult} />
      </div>
    </div>
  );
}
