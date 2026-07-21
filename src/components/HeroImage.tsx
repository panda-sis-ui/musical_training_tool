import styles from './HeroImage.module.css';

interface HeroImageProps {
  /** Картинка персонажа */
  image: string;
  /** Подпись по дуге над персонажем */
  caption: string;
  /** Клик по облачку мыслей (например, повторить звук) */
  onCloudClick?: () => void;
  /** Что показать в облачке вместо 💭 (результат ответа) */
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
    <div className={styles.heroContainer}>
      <div className={styles.imageWrapper}>
        <img src={image} alt={caption} className={styles.avatar} />
        {/* SVG с текстом по дуге */}
        <svg className={styles.arcSvg} viewBox="0 0 300 300" preserveAspectRatio="none">
          <path id="textArc" d="M 30 150 A 120 120 0 1 1 270 150" fill="none" stroke="none" />
          <text className={styles.arcText} fontSize="24" fontWeight="bold" fill="#2c3e50">
            <textPath href="#textArc" startOffset="50%" textAnchor="middle">
              {caption}
            </textPath>
          </text>
        </svg>
      </div>
      {/* Облачко с эмодзи – кликабельно */}
      <div className={styles.cloud} onClick={onCloudClick}>
        {cloudContent}
        <div className={styles.cloudTail}></div>
      </div>
    </div>
  );
}
