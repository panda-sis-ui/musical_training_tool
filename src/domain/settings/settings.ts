import { DEFAULT_INTERVAL_NAMES, type Interval } from '../../lib/intervals';
import type { IntervalGameSettings } from '../../types/settings';

export const DEFAULT_SETTINGS: IntervalGameSettings = {
  intervalNames: DEFAULT_INTERVAL_NAMES,
  tonicFixed: true,
  answerMode: 'buttons',
  direction: 'up',
};

export function normalizeSettings(value: unknown): IntervalGameSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_SETTINGS;
  }

  const candidate = value as Partial<IntervalGameSettings>;
  const answerMode = 'buttons';
  const direction = candidate.direction === 'up' || candidate.direction === 'down' || candidate.direction === 'both'
    ? candidate.direction
    : 'up';

  return {
    intervalNames: normalizeIntervalNames(candidate.intervalNames),
    tonicFixed: typeof candidate.tonicFixed === 'boolean' ? candidate.tonicFixed : true,
    answerMode,
    direction,
  };
}

export function isValidSettings(value: unknown): value is IntervalGameSettings {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<IntervalGameSettings>;
  return (
    Array.isArray(candidate.intervalNames) &&
    typeof candidate.tonicFixed === 'boolean' &&
    (candidate.answerMode === 'buttons' || candidate.answerMode === 'piano') &&
    (candidate.direction === 'up' || candidate.direction === 'down' || candidate.direction === 'both')
  );
}

function normalizeIntervalNames(intervalNames: unknown): string[] {
  if (!Array.isArray(intervalNames)) {
    return DEFAULT_INTERVAL_NAMES;
  }

  const validNames = intervalNames.filter((name): name is string => typeof name === 'string');
  const normalized = validNames.filter((name) => DEFAULT_INTERVAL_NAMES.includes(name));

  return normalized.length > 0 ? normalized : DEFAULT_INTERVAL_NAMES;
}

export function isIntervalNameAllowed(name: string): boolean {
  return DEFAULT_INTERVAL_NAMES.includes(name);
}

export function listIntervalNames(): string[] {
  return [...DEFAULT_INTERVAL_NAMES];
}

export function defaultIntervalForName(name: string): Interval | undefined {
  return DEFAULT_INTERVAL_NAMES.includes(name)
    ? { name, shortName: name, semitones: 0 }
    : undefined;
}
