import { getRandomInterval, type Interval } from '../../lib/intervals';
import type { IntervalGameSettings } from '../../types/settings';
import { normalizeSettings } from '../settings/settings';

const ALL_NOTES = [
  'C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4',
  'C5','C#5','D5','D#5','E5','F5','F#5','G5','G#5','A5','A#5','B5'
] as const;

const NOTE_SEQUENCE = [...ALL_NOTES] as string[];
const MAX_NOTE = 'G5';
const MAX_NOTE_INDEX = NOTE_SEQUENCE.indexOf(MAX_NOTE);

export type RoundDirection = 'up' | 'down';

export interface GeneratedRound {
  interval: Interval;
  lowerNote: string;
  upperNote: string;
  direction: RoundDirection;
  playbackOrder: [string, string];
}

function isWithinPlayableRange(noteIndex: number): boolean {
  return noteIndex >= 0 && noteIndex <= MAX_NOTE_INDEX;
}

function getRandomValidNote(settings: IntervalGameSettings, direction: RoundDirection, interval: Interval): { lower: string; upper: string } {
  const tonicIndex = settings.tonicFixed ? 0 : Math.floor(Math.random() * (MAX_NOTE_INDEX + 1));

  if (direction === 'down') {
    // Для нисходящего: находим верхнюю ноту, нижняя = верхняя - интервал
    const maxUpperIndex = Math.min(MAX_NOTE_INDEX, NOTE_SEQUENCE.length - 1 - interval.semitones);
    if (maxUpperIndex < interval.semitones) {
      // Не хватает диапазона - используем fallback
      return { lower: 'C4', upper: 'E4' };
    }

    const upperIndex = settings.tonicFixed
      ? Math.min(tonicIndex + interval.semitones, maxUpperIndex)
      : Math.floor(Math.random() * (maxUpperIndex - interval.semitones + 1)) + interval.semitones;

    const lowerIndex = upperIndex - interval.semitones;

    if (!isWithinPlayableRange(upperIndex) || !isWithinPlayableRange(lowerIndex)) {
      return { lower: 'C4', upper: 'E4' };
    }

    return {
      lower: NOTE_SEQUENCE[lowerIndex] ?? 'C4',
      upper: NOTE_SEQUENCE[upperIndex] ?? 'E4',
    };
  } else {
    // Для восходящего: находим нижнюю ноту, верхняя = нижняя + интервал
    const maxLowerIndex = Math.min(MAX_NOTE_INDEX - interval.semitones, NOTE_SEQUENCE.length - 1 - interval.semitones);
    if (maxLowerIndex < 0) {
      // Не хватает диапазона - используем fallback
      return { lower: 'C4', upper: 'E4' };
    }

    const lowerIndex = settings.tonicFixed
      ? tonicIndex
      : Math.floor(Math.random() * (maxLowerIndex + 1));

    const upperIndex = lowerIndex + interval.semitones;

    if (!isWithinPlayableRange(lowerIndex) || !isWithinPlayableRange(upperIndex)) {
      return { lower: 'C4', upper: 'E4' };
    }

    return {
      lower: NOTE_SEQUENCE[lowerIndex] ?? 'C4',
      upper: NOTE_SEQUENCE[upperIndex] ?? 'E4',
    };
  }
}

export function buildIntervalRound(settings: IntervalGameSettings): GeneratedRound {
  const normalizedSettings = normalizeSettings(settings);
  const interval = getRandomInterval(normalizedSettings.intervalNames);
  const direction: RoundDirection = normalizedSettings.direction === 'both'
    ? (Math.random() < 0.5 ? 'up' : 'down')
    : normalizedSettings.direction;

  const { lower: lowerNote, upper: upperNote } = getRandomValidNote(normalizedSettings, direction, interval);

  return {
    interval,
    lowerNote,
    upperNote,
    direction,
    playbackOrder: direction === 'down' ? [upperNote, lowerNote] : [lowerNote, upperNote],
  };
}
