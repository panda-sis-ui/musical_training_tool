import { useEffect, useState } from 'react';
import styles from './IntervalGamePage.module.css';
import Header from '../components/Header';
import HeroImage from '../components/HeroImage';
import NewNoteButton from '../components/NewNoteButton';
import ScoreCounter from '../components/ScoreCounter';
import IntervalButtons from '../components/IntervalButtons';
import TwoNoteStaff from '../components/TwoNoteStaff';
import IntervalSettingsModal from '../components/IntervalSettingsModal';
import { useIntervalGame, type HeroMood } from '../hooks/useIntervalGame';
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

export default function IntervalGamePage() {
  const game = useIntervalGame();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    game.initGame({ autoPlay: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resultMessage = game.lastResult
    ? {
        text: game.lastResult.isCorrect ? '✅' : '❌',
        isCorrect: game.lastResult.isCorrect,
      }
    : null;

  const showStaff = game.lowerNote && game.upperNote;

  return (
    <div className={styles.container}>
      <Header title="Угадай интервал" />
      <div className={styles.main}>
        <div className={styles.heroColumn}>
          <HeroImage
            image={MOOD_IMAGES[game.mood]}
            caption="Нажми, чтобы услышать интервал"
            onCloudClick={game.replayInterval}
            resultMessage={resultMessage}
            hintName={game.hintName}
          />
          <div className={styles.controls}>
            <ScoreCounter score={game.score} />
            <NewNoteButton onNewNote={game.startNewRound} label="🎲 Следующий интервал" />
            {/* Кнопка настроек */}
            <button
              className={styles.settingsButton}
              onClick={() => setIsSettingsOpen(true)}
              title="Настройки"
            >
              ⚙️
            </button>
            <button
              className={styles.hintButton}
              onClick={game.requestHint}
              disabled={game.hintsLeft === 0 || game.lastResult !== null}
              title={game.hintsLeft === 0 ? 'Подсказки закончились' : 'Показать название интервала'}
            >
              💡 {game.hintsLeft > 0 ? game.hintsLeft : '0'}
            </button>
          </div>
        </div>

        <div className={styles.staffWrapper}>
          {showStaff && game.upperNote ? (
            <TwoNoteStaff
              lowerNote={game.roundDirection === 'down' ? game.upperNote : game.lowerNote}
              upperNote={game.roundDirection === 'down' ? game.lowerNote : game.upperNote}
              visible={game.leavesVisible}
              onClear={game.hideLeaves}
            />
          ) : (
            <div>Загрузка...</div>
          )}
        </div>
      </div>

      <div className={styles.buttonsWrapper}>
        <IntervalButtons
          intervalNames={game.settings.intervalNames}  // используем настройки
          onSelect={game.handleAnswer}
          disabled={game.isCorrectGuessed}
          lastResult={game.lastResult}
        />
      </div>

      {/* Модальное окно настроек */}
      <IntervalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={game.settings}
        onSave={game.updateSettings}
      />
    </div>
  );
}