import styles from './HiddenNote.module.css';
import skripKey from '../assets/skrip_key.png';

interface HiddenNoteProps {
  note: string;
}

// Позиции нот – теперь C4 на 95 (добавочная линия)
const notePositions: Record<string, number> = {
  'C4': 95,
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
  let baseNote = note;
  let accidental = '';
  if (note.includes('#')) {
    const parts = note.split('#');
    baseNote = parts[0] + parts[1];
    accidental = '#';
  }
  const y = notePositions[baseNote];
  if (y === undefined) return null;

  const showLedgerLine = baseNote === 'C4';

  const svgWidth = 220;
  const svgHeight = 110;
  const lineY = [20, 35, 50, 65, 80]; // линии стана
  const noteX = 100;                  // центр ноты (сдвинуто влево)
  const noteRadius = 8;

  return (
    <div className={styles.container}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        height="100%"
        className={styles.svg}
      >
        {/* 5 линий нотного стана – теперь начинаются с x1=15 */}
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

        {/* Добавочная линия для C4 – на той же высоте, что и нота (y=95) */}
        {showLedgerLine && (
          <line
            x1="60"
            y1={95}
            x2="130"
            y2={95}
            stroke="#333"
            strokeWidth="1.5"
          />
        )}

        {/* Скрипичный ключ – сдвинут влево */}
        <image
          href={skripKey}
          x="15"
          y="12"
          width="50"
          height="80"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Знак диеза – теперь на той же высоте, что и нота (y) */}
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

        {/* Нота – на позиции y (для C4 это 95, т.е. на добавочной линии) */}
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