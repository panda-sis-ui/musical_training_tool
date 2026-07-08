import styles from './Hero_img.module.css';

interface HeroImgProps {
  name_image: string;
  name_game: string;
  onCloudClick?: () => void;   // новый необязательный проп
}

export default function Hero_img({ name_image, name_game, onCloudClick }: HeroImgProps) {
  const handleCloudClick = () => {
    if (onCloudClick) {
      onCloudClick();     // вызываем переданную функцию
    } else {
      console.log('Звучит нота'); // fallback
    }
  };

  return (
    <div className={styles.heroContainer}>
      <div className={styles.imageWrapper}>
        <img src={name_image} alt={name_game} className={styles.avatar} />
        <svg className={styles.arcSvg} viewBox="0 0 300 300" preserveAspectRatio="none">
          <path id="textArc" d="M 30 150 A 120 120 0 1 1 270 150" fill="none" stroke="none" />
          <text className={styles.arcText} fontSize="24" fontWeight="bold" fill="#2c3e50">
            <textPath href="#textArc" startOffset="50%" textAnchor="middle">
              {name_game}
            </textPath>
          </text>
        </svg>
      </div>
      <div className={styles.cloud} onClick={handleCloudClick}>
        <span className={styles.cloudText}>💭</span>
        <div className={styles.cloudTail}></div>
      </div>
    </div>
  );
}