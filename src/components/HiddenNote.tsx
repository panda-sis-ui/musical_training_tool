import { useState } from 'react';
import styles from './HiddenNote.module.css';
import skripKey from '../assets/skrip_key.png';
import list1 from '../assets/list1.png';
import list2 from '../assets/list2.png';
import branch from '../assets/branch.png'; // импортируем ветку

interface HiddenNoteProps {
  note: string;
}

const notePositions: Record<string, number> = {
  'C4': 95,   'D4': 87.5, 'E4': 80, 'F4': 72.5,
  'G4': 65,   'A4': 57.5, 'B4': 50, 'C5': 42.5,
  'D5': 35,   'E5': 27.5,
};

export default function HiddenNote({ note }: HiddenNoteProps) {
  const [leavesVisible, setLeavesVisible] = useState(true);
  const clearLeaves = () => setLeavesVisible(false);

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

        {leavesVisible && (
          <div className={styles.leavesLayer}>
            <img src={list1} alt="лист" className={styles.leafBig1} />
            <img src={list2} alt="лист" className={styles.leafBig2} />
            <img src={branch} alt="ветка" className={styles.branch} />
          </div>
        )}

        <button className={styles.clearButton} onClick={clearLeaves} title="Убрать листья">
          🧹
        </button>
      </div>
    </div>
  );
}