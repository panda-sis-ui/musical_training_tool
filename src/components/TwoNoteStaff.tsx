import styles from './TwoNoteStaff.module.css';
import skripKey from '../assets/skrip_key.webp';
import leavesImage from '../assets/lists.webp';
import { STAFF_POSITIONS, parseNote } from '../lib/notes';

interface TwoNoteStaffProps {
  lowerNote: string;
  upperNote: string;
  visible: boolean;
  onClear: () => void;
}

export default function TwoNoteStaff({
  lowerNote,
  upperNote,
  visible,
  onClear,
}: TwoNoteStaffProps) {
  const { base: lowerBase } = parseNote(lowerNote);
  const { base: upperBase } = parseNote(upperNote);
  const yLower = STAFF_POSITIONS[lowerBase];
  const yUpper = STAFF_POSITIONS[upperBase];

  if (yLower === undefined || yUpper === undefined) return null;

  const svgWidth = 220;
  const svgHeight = 110;
  const lineY = [20, 35, 50, 65, 80];
  const noteRadius = 8;

  const needsLedgerLower = yLower < 20 || yLower > 80;
  const needsLedgerUpper = yUpper < 20 || yUpper > 80;

  // Позиции нот – всегда две, даже при приме
  const xLower = 85;
  const xUpper = 145;

  return (
    <div className={styles.container}>
      <div className={styles.noteWrapper}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          height="100%"
          className={styles.svg}
        >
          {/* Линии стана */}
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

          {/* Скрипичный ключ */}
          <image href={skripKey} x="15" y="12" width="50" height="80" preserveAspectRatio="xMidYMid meet" />

          {/* Добавочные линии для нижней ноты */}
          {needsLedgerLower && (
            <line
              x1={xLower - 20}
              y1={yLower}
              x2={xLower + 20}
              y2={yLower}
              stroke="#333"
              strokeWidth="1.5"
            />
          )}
          {/* Добавочные линии для верхней ноты */}
          {needsLedgerUpper && (
            <line
              x1={xUpper - 20}
              y1={yUpper}
              x2={xUpper + 20}
              y2={yUpper}
              stroke="#333"
              strokeWidth="1.5"
            />
          )}

          {/* Нижняя нота */}
          <ellipse
            cx={xLower}
            cy={yLower}
            rx={noteRadius}
            ry={noteRadius * 0.9}
            fill="#1a1a1a"
            stroke="#1a1a1a"
            strokeWidth="1"
          />
          {/* Верхняя нота – теперь всегда рисуется */}
          <ellipse
            cx={xUpper}
            cy={yUpper}
            rx={noteRadius}
            ry={noteRadius * 0.9}
            fill="#1a1a1a"
            stroke="#1a1a1a"
            strokeWidth="1"
          />
        </svg>

        {/* Слой листьев */}
        {visible && (
          <div className={styles.leavesLayer}>
            <img src={leavesImage} alt="листья" className={styles.leavesImage} />
          </div>
        )}

        {/* Кнопка очистки */}
        <button className={styles.clearButton} onClick={onClear} title="Убрать листья">
          🧹
        </button>
      </div>
    </div>
  );
}