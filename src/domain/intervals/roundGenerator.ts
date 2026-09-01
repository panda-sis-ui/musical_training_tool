import { getRandomInterval, type Interval } from '../../lib/intervals';
import type { IntervalGameSettings } from '../../types/settings';
import { normalizeSettings } from '../settings/settings';

const ALL_NOTES = [
  'C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4',
  'C5','C#5','D5','D#5','E5','F5','F#5','G5','G#5','A5','A#5','B5'
] as const;

const NOTE_SEQUENCE = [...ALL_NOTES] as string[];
const MAX_NOTE = 'G5';

export type RoundDirection = 'up' | 'down';

export interface GeneratedRound {
  interval: Interval;
  lowerNote: string;
  upperNote: string;
  direction: RoundDirection;
  playbackOrder: [string, string];
}

export function buildIntervalRound(settings: IntervalGameSettings): GeneratedRound {
  const normalizedSettings = normalizeSettings(settings);
  const interval = getRandomInterval(normalizedSettings.intervalNames);
  const direction: RoundDirection = normalizedSettings.direction === 'both'
    ? (Math.random() < 0.5 ? 'up' : 'down')
    : normalizedSettings.direction;

  const candidateNotes = normalizedSettings.tonicFixed ? ['C4'] : [...NOTE_SEQUENCE];
  const validNotes = candidateNotes.filter((note) => {
    const index = NOTE_SEQUENCE.indexOf(note);
    return index !== -1 && isWithinPlayableRange(note);
  });

  let lowerNoteValue: string;
  let upperNoteValue: string;

  if (direction === 'down') {
    const validUpperNotes = NOTE_SEQUENCE.filter((note) => {
      const upperIndex = NOTE_SEQUENCE.indexOf(note);
      const lowerIndex = upperIndex - interval.semitones;
      return upperIndex !== -1 && lowerIndex >= 0 && isWithinPlayableRange(note) && isWithinPlayableRange(NOTE_SEQUENCE[lowerIndex]);
    });

    const startNote = validUpperNotes.length > 0
      ? validUpperNotes[Math.floor(Math.random() * validUpperNotes.length)]
      : 'C4';

    const upperIndex = NOTE_SEQUENCE.indexOf(startNote);
    const lowerIndex = upperIndex - interval.semitones;
    upperNoteValue = NOTE_SEQUENCE[upperIndex] ?? startNote;
    lowerNoteValue = NOTE_SEQUENCE[lowerIndex] ?? NOTE_SEQUENCE[Math.max(0, lowerIndex)];
  } else {
    const validStartNotes = validNotes.filter((note) => {
      const lowerIndex = NOTE_SEQUENCE.indexOf(note);
      const upperIndex = lowerIndex + interval.semitones;
      return upperIndex < NOTE_SEQUENCE.length && isWithinPlayableRange(NOTE_SEQUENCE[upperIndex]);
    });

    const startNote = validStartNotes.length > 0
      ? validStartNotes[Math.floor(Math.random() * validStartNotes.length)]
      : 'C4';

    const lowerIndex = NOTE_SEQUENCE.indexOf(startNote);
    const upperIndex = lowerIndex + interval.semitones;
    lowerNoteValue = NOTE_SEQUENCE[lowerIndex] ?? startNote;
    upperNoteValue = NOTE_SEQUENCE[upperIndex] ?? NOTE_SEQUENCE[Math.min(NOTE_SEQUENCE.length - 1, upperIndex)];
  }

  if (!isWithinPlayableRange(upperNoteValue)) {
    const fallbackIndex = Math.min(
      NOTE_SEQUENCE.indexOf(MAX_NOTE),
      Math.max(0, NOTE_SEQUENCE.indexOf(lowerNoteValue) + interval.semitones),
    );
    upperNoteValue = NOTE_SEQUENCE[fallbackIndex] ?? 'G5';
  }

  return {
    interval,
    lowerNote: lowerNoteValue,
    upperNote: upperNoteValue,
    direction,
    playbackOrder: direction === 'down' ? [upperNoteValue, lowerNoteValue] : [lowerNoteValue, upperNoteValue],
  };
}

function isWithinPlayableRange(note: string): boolean {
  return NOTE_SEQUENCE.indexOf(note) !== -1 && NOTE_SEQUENCE.indexOf(note) <= NOTE_SEQUENCE.indexOf(MAX_NOTE);
}
