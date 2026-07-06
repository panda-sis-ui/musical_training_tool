import styles from './Hero_img.module.css';

interface HeroImgProps {
  name_image: string;
  name_game: string;
}

export default function Hero_img({ name_image, name_game }: HeroImgProps) {
  const handleCloudClick = () => {
    console.log('Звучит нота');
  };

  return (
    <div className={styles.heroContainer}>
      {/* Основная часть: картинка + текст сверху */}
      <div className={styles.imageWrapper}>
        {/* Круглая картинка */}
        <img
          src={name_image}
          alt={name_game}
          className={styles.avatar}
        />

        {/* SVG с текстом по дуге (поверх картинки) */}
        <svg
          className={styles.arcSvg}
          viewBox="0 0 300 300"
          preserveAspectRatio="none"
        >
          {/* Путь для дуги (полукруг сверху) */}
          <path
            id="textArc"
            d="M 30 150 A 120 120 0 1 1 270 150"
            fill="none"
            stroke="none"
          />
          <text
            className={styles.arcText}
            fontSize="24"
            fontWeight="bold"
            fill="#2c3e50"
          >
            <textPath href="#textArc" startOffset="50%" textAnchor="middle">
              {name_game}
            </textPath>
          </text>
        </svg>
      </div>

      {/* Облако мысли – справа от картинки */}
      <div className={styles.cloud} onClick={handleCloudClick}>
        <span className={styles.cloudText}>💭</span>
        <div className={styles.cloudTail}></div>
      </div>
    </div>
  );
}