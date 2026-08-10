import styles from './HeroImage.module.css';

interface HeroImageProps {
  image: string;
  caption: string;
  onCloudClick?: () => void;        // функция для воспроизведения ноты
  resultMessage?: { text: string; isCorrect: boolean } | null;
}

export default function HeroImage({ image, caption, onCloudClick, resultMessage }: HeroImageProps) {
  const cloudContent = resultMessage ? (
    <span style={{ color: resultMessage.isCorrect ? 'green' : 'red', fontSize: '1.8rem' }}>
      {resultMessage.text}
    </span>
  ) : (
    <span className={styles.cloudText}>💭</span>
  );

  return (
    // Добавляем onClick сюда – на весь блок
    <div className={styles.heroContainer} onClick={onCloudClick}>
      <div className={styles.imageWrapper}>
        <img src={image} alt={caption} className={styles.avatar} />
        <svg className={styles.arcSvg} viewBox="0 0 300 300" preserveAspectRatio="none">
          <path id="textArc" d="M 30 150 A 120 120 0 1 1 270 150" fill="none" stroke="none" />
          <text className={styles.arcText} fontSize="24" fontWeight="bold" fill="#2c3e50">
            <textPath href="#textArc" startOffset="50%" textAnchor="middle">
              {caption}
            </textPath>
          </text>
        </svg>
      </div>
      {/* Убираем onClick с облачка – событие всплывёт к родителю */}
      <div className={styles.cloud}>
        {cloudContent}
        <div className={styles.cloudTail}></div>
      </div>
    </div>
  );
}