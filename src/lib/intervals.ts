export interface Interval {
  name: string;
  shortName: string;
  semitones: number;
}

// Простые интервалы (по умолчанию)
export const SIMPLE_INTERVALS: Interval[] = [
  { name: 'прима', shortName: '1', semitones: 0 },
  { name: 'секунда', shortName: '2', semitones: 2 },
  { name: 'терция', shortName: '3', semitones: 4 },
  { name: 'кварта', shortName: '4', semitones: 5 },
  { name: 'квинта', shortName: '5', semitones: 7 },
  { name: 'секста', shortName: '6', semitones: 9 },
  { name: 'септима', shortName: '7', semitones: 11 },
  { name: 'октава', shortName: '8', semitones: 12 },
];

// Все доступные интервалы (пока только простые, позже можно расширить)
export const ALL_INTERVALS = SIMPLE_INTERVALS;

// Набор по умолчанию – все простые интервалы
export const DEFAULT_INTERVAL_NAMES = SIMPLE_INTERVALS.map(i => i.name);

export function getIntervalByName(name: string): Interval | undefined {
  return ALL_INTERVALS.find((i) => i.name === name);
}

export function getIntervalsByNames(names: string[]): Interval[] {
  return ALL_INTERVALS.filter((i) => names.includes(i.name));
}

export function getRandomInterval(intervalNames: string[]): Interval {
  const filtered = getIntervalsByNames(intervalNames);
  if (filtered.length === 0) {
    return ALL_INTERVALS[Math.floor(Math.random() * ALL_INTERVALS.length)];
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}