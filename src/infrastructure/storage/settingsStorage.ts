import { DEFAULT_SETTINGS, isValidSettings, normalizeSettings } from '../../domain/settings/settings';
import type { IntervalGameSettings } from '../../types/settings';

const STORAGE_KEY = 'intervalGameSettings';

export function saveSettings(settings: IntervalGameSettings): void {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Браузер может запретить запись localStorage.
  }
}

export function loadSettings(): IntervalGameSettings {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);
    if (isValidSettings(parsed)) {
      return normalizeSettings(parsed);
    }
  } catch {
    // Игнорируем ошибки парсинга и проблемный localStorage.
  }

  return DEFAULT_SETTINGS;
}
