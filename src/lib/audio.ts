// Единый звуковой движок приложения.
// Один AudioContext на всё приложение; компоненты не работают с Web Audio API напрямую.

import { NOTE_FREQUENCIES } from './notes';

let ctx: AudioContext | null = null;

/**
 * Возвращает готовый к работе AudioContext (создаёт или возобновляет при необходимости).
 * Вызывать из обработчиков пользовательских действий — браузеры разрешают звук
 * только после жеста пользователя.
 */
export async function ensureAudioContext(): Promise<AudioContext | null> {
  if (!ctx || ctx.state === 'closed') {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API не поддерживается');
      return null;
    }
    ctx = new AudioContextClass();
  }
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (err) {
      console.warn('Не удалось возобновить AudioContext', err);
      return null;
    }
  }
  return ctx;
}

/** Управление длящейся нотой, начатой через startNote() */
export interface PlayingNote {
  stop(): void;
}

/**
 * Начинает звучание ноты и держит его, пока не вызовут stop().
 * Для клавиш пианино (звук на время нажатия).
 */
export async function startNote(note: string): Promise<PlayingNote | null> {
  const freq = NOTE_FREQUENCIES[note];
  if (!freq) return null;

  const audioCtx = await ensureAudioContext();
  if (!audioCtx) return null;

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  gain.gain.value = 0.3;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch {
        // осциллятор уже остановлен — не страшно
      }
    },
  };
}

/** Проигрывает ноту заданной длительности (по умолчанию 0.4 с) */
export async function playNote(note: string, durationSec = 0.4): Promise<void> {
  const freq = NOTE_FREQUENCIES[note];
  if (!freq) return;

  const audioCtx = await ensureAudioContext();
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  gain.gain.value = 0.3;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + durationSec);
}

/**
 * Проигрывает последовательность нот с паузами — задел для «Угадай интервал»
 * и генератора мелодических диктантов.
 */
export async function playSequence(
  notes: string[],
  { noteDurationSec = 0.5, gapSec = 0.15 }: { noteDurationSec?: number; gapSec?: number } = {},
): Promise<void> {
  const audioCtx = await ensureAudioContext();
  if (!audioCtx) return;

  let t = audioCtx.currentTime;
  for (const note of notes) {
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) continue;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    gain.gain.value = 0.3;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start(t);
    oscillator.stop(t + noteDurationSec);
    t += noteDurationSec + gapSec;
  }
}
