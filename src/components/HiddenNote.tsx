import styles from './HiddenNote.module.css';
import skripKey from '../assets/skrip_key.webp';
import leavesImage from '../assets/lists.webp';
import { STAFF_POSITIONS, parseNote } from '../lib/notes';

interface HiddenNoteProps {
  note: string;
  visible: boolean;          // управляется со страницы игры
  onClear: () => void;       // вызывается при клике на метлу
}

export default function HiddenNote({ note, visible, onClear }: HiddenNoteProps) {
  const { base: baseNote, accidental } = parseNote(note);
  const y = STAFF_POSITIONS[baseNote];
  if (y === undefined) return null;

  const showLedgerLine = baseNote === 'C4';
  const svgWidth = 220;
  const svgHeight = 110;
  const lineY = [20, 35, 50, 65, 80];
  const noteX = 100;
  const noteRadius = 8;

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
          {showLedgerLine && (
            <line x1="80" y1={95} x2="120" y2={95} stroke="#333" strokeWidth="1.5" />
          )}
          <image href={skripKey} x="15" y="12" width="50" height="80" preserveAspectRatio="xMidYMid meet" />
          {accidental === '#' && (
            <text x={noteX - 22} y={y} fontSize="18" fontWeight="bold" fill="#333" fontFamily="'Arial', sans-serif">
              ♯
            </text>
          )}
          <ellipse cx={noteX} cy={y} rx={noteRadius} ry={noteRadius * 0.9} fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="1" />
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