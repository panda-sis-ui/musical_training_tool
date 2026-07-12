import styles from './HiddenNote.module.css';
import skripKey from '../assets/skrip_key.png';

interface HiddenNoteProps {
  note: string; // нота в формате, например, "C#4"
}

// Позиции нот на нотном стане (y-координата в SVG)
const notePositions: Record<string, number> = {
  'C4': 95,   // с добавочной линией
  'D4': 87.5,
  'E4': 80,
  'F4': 72.5,
  'G4': 65,
  'A4': 57.5,
  'B4': 50,
  'C5': 42.5,
  'D5': 35,
  'E5': 27.5,
};

export default function HiddenNote({ note }: HiddenNoteProps) {
  // Отделяем основную ноту от знака альтерации (пока только #)
  let baseNote = note;
  let accidental = '';
  if (note.includes('#')) {
    const parts = note.split('#');
    baseNote = parts[0] + parts[1]; // например, "C4"
    accidental = '#';
  }
  const y = notePositions[baseNote];
  if (y === undefined) return null;

  const showLedgerLine = baseNote === 'C4'; // для C4 нужна добавочная линия

  const svgWidth = 220;
  const svgHeight = 110;
  const lineY = [20, 35, 50, 65, 80]; // линии стана
  const noteX = 100;                  // центр ноты
  const noteRadius = 8;

  return (
    <div className={styles.container}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        height="100%"
        className={styles.svg}
      >
        {/* Пять линий нотного стана */}
        {lineY.map((yPos) => (
          <line
            key={yPos}
            x1="15"
            y1={yPos}
            x2={svgWidth - 20}
            y2={yPos}
            stroke="#333"
            strokeWidth="1.5"
          />
        ))}

        {/* Добавочная линия для C4 */}
        {showLedgerLine && (
          <line
            x1="80"
            y1={95}
            x2="120"
            y2={95}
            stroke="#333"
            strokeWidth="1.5"
          />
        )}

        {/* Скрипичный ключ */}
        <image
          href={skripKey}
          x="15"
          y="12"
          width="50"
          height="80"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Диез, если есть */}
        {accidental === '#' && (
          <text
            x={noteX - 22}
            y={y}
            fontSize="18"
            fontWeight="bold"
            fill="#333"
            fontFamily="'Arial', sans-serif"
          >
            ♯
          </text>
        )}

        {/* Сама нота (залитый эллипс) */}
        <ellipse
          cx={noteX}
          cy={y}
          rx={noteRadius}
          ry={noteRadius * 0.9}
          fill="#1a1a1a"
          stroke="#1a1a1a"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}