// src/components/TwoNoteStaff.tsx
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
  // Получаем базовые имена (без диезов) для позиционирования
  const { base: lowerBase } = parseNote(lowerNote);
  const { base: upperBase } = parseNote(upperNote);
  const yLower = STAFF_POSITIONS[lowerBase];
  const yUpper = STAFF_POSITIONS[upperBase];

  if (yLower === undefined || yUpper === undefined) return null;

  const svgWidth = 220;
  const svgHeight = 110;
  const lineY = [20, 35, 50, 65, 80];
  const noteRadius = 8;

  // Единый список нот, которым нужна добавочная линия (базовые имена)
  const ledgerNotes = ['C4', 'G5'];
  const needsLedgerLower = ledgerNotes.includes(lowerBase);
  const needsLedgerUpper = ledgerNotes.includes(upperBase);

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

          <image href={skripKey} x="15" y="12" width="50" height="80" preserveAspectRatio="xMidYMid meet" />

          {/* Добавочная линия для нижней ноты, если нужно */}
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
          {/* Добавочная линия для верхней ноты, если нужно */}
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
          {/* Верхняя нота */}
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

        {visible && (
          <div className={styles.leavesLayer}>
            <img src={leavesImage} alt="листья" className={styles.leavesImage} />
          </div>
        )}

        <button className={styles.clearButton} onClick={onClear} title="Убрать листья">
          🧹
        </button>
      </div>
    </div>
  );
}