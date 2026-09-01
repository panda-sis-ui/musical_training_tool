// Единый источник правды о нотах: диапазон, частоты, названия, позиции на стане.
// Все игры и компоненты берут данные о нотах отсюда.

/** Все ноты, используемые в приложении (диапазон C4–E5, с диезами) */
export const ALL_NOTES = [
  'C4', 'C#4', 'D4', 'D#4', 'E4',
  'F4', 'F#4', 'G4', 'G#4', 'A4',
  'A#4', 'B4', 'C5', 'C#5', 'D5',
  'D#5', 'E5', 'F5', 'F#5', 'G5',
  'G#5', 'A5', 'A#5', 'B5',
] as const;

export type Note = (typeof ALL_NOTES)[number];

/** Частоты нот в герцах (равномерная темперация, A4 = 440 Гц) */
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
  'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

/** Белые клавиши пианино в порядке слева направо */
export const WHITE_KEYS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];

/** Чёрные клавиши пианино */
export const BLACK_KEYS = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5'];

/** Раскладка компьютерной клавиатуры: клавиша → нота */
export const KEYBOARD_MAP: Record<string, string> = {
  'a': 'C4',  'w': 'C#4',
  's': 'D4',  'e': 'D#4',
  'd': 'E4',
  'f': 'F4',  't': 'F#4',
  'g': 'G4',  'y': 'G#4',
  'h': 'A4',  'u': 'A#4',
  'j': 'B4',
  'k': 'C5',  'o': 'C#5',
  'l': 'D5',  'p': 'D#5',
  ';': 'E5',
};

/**
 * Вертикальные позиции нот на нотном стане (в единицах viewBox компонента Staff,
 * высота 110). Только основные ступени — диез рисуется знаком у той же позиции.
 */
export const STAFF_POSITIONS: Record<string, number> = {
  // Октава 4
  'C4': 95,
  'D4': 87.5,
  'E4': 80,
  'F4': 72.5,
  'G4': 65,
  'A4': 57.5,
  'B4': 50,
  // Октава 5
  'C5': 42.5,
  'D5': 35,
  'E5': 27.5,
  'F5': 20,
  'G5': 12.5,
  'A5': 5,
  'B5': -2.5,
};

const RUSSIAN_NOTE_NAMES: Record<string, string> = {
  'C': 'До', 'D': 'Ре', 'E': 'Ми', 'F': 'Фа',
  'G': 'Соль', 'A': 'Ля', 'B': 'Си',
};

/** Русское название ноты: 'C4' → 'До', 'F#4' → 'Фа#' */
export function getRussianNoteName(note: string): string {
  const base = note.slice(0, -1);
  const isSharp = base.includes('#');
  const letter = isSharp ? base.slice(0, -1) : base;
  const russianBase = RUSSIAN_NOTE_NAMES[letter] || letter;
  return isSharp ? russianBase + '#' : russianBase;
}

/** Разбирает ноту на основную ступень (без диеза) и знак альтерации: 'C#4' → { base: 'C4', accidental: '#' } */
export function parseNote(note: string): { base: string; accidental: '' | '#' } {
  if (note.includes('#')) {
    const [letter, octave] = note.split('#');
    return { base: letter + octave, accidental: '#' };
  }
  return { base: note, accidental: '' };
}

/** Случайная нота из всего диапазона */
export function getRandomNote(): string {
  return ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
}
