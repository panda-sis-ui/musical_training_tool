import styles from './Hero_img.module.css';

interface HeroImgProps {
  name_image: string;
  name_game: string;
  onCloudClick?: () => void;
  resultMessage?: { text: string; isCorrect: boolean } | null;
}

export default function Hero_img({ name_image, name_game, onCloudClick, resultMessage }: HeroImgProps) {
  const handleCloudClick = () => {
    if (onCloudClick) onCloudClick();
  };

  // Определяем, что показывать в облачке
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
        <img src={name_image} alt={name_game} className={styles.avatar} />
        {/* SVG с текстом по дуге */}
        <svg className={styles.arcSvg} viewBox="0 0 300 300" preserveAspectRatio="none">
          <path id="textArc" d="M 30 150 A 120 120 0 1 1 270 150" fill="none" stroke="none" />
          <text className={styles.arcText} fontSize="24" fontWeight="bold" fill="#2c3e50">
            <textPath href="#textArc" startOffset="50%" textAnchor="middle">
              {name_game}
            </textPath>
          </text>
        </svg>
      </div>
      {/* Облачко с эмодзи – кликабельно */}
      <div className={styles.cloud} onClick={handleCloudClick}>
        {cloudContent}
        <div className={styles.cloudTail}></div>
      </div>
    </div>
  );
}