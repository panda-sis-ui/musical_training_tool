import styles from './HeroImage.module.css';

interface HeroImageProps {
  image: string;
  caption: string;
  onCloudClick?: () => void;
  resultMessage?: { text: string; isCorrect: boolean } | null;
  hintName?: string | null;   // новое поле
}

export default function HeroImage({ image, caption, onCloudClick, resultMessage, hintName }: HeroImageProps) {
  // Определяем содержимое облачка с приоритетом:
  // 1. Результат (если есть)
  // 2. Подсказка (если активна)
  // 3. По умолчанию 💭
  let cloudContent: React.ReactNode;
  if (resultMessage) {
    cloudContent = (
      <span style={{ color: resultMessage.isCorrect ? 'green' : 'red', fontSize: '1.8rem' }}>
        {resultMessage.text}
      </span>
    );
  } else if (hintName) {
    cloudContent = (
      <span className={styles.hintText}>
        {hintName}
      </span>
    );
  } else {
    cloudContent = <span className={styles.cloudText}>💭</span>;
  }

  return (
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
      <div className={styles.cloud}>
        {cloudContent}
        <div className={styles.cloudTail}></div>
      </div>
    </div>
  );
}