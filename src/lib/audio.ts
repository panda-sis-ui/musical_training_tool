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

function createToneEnvelope(audioCtx: AudioContext, freq: number, volume = 0.3) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const now = audioCtx.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), now + 0.02);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  return { oscillator, gainNode, now };
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

  const { oscillator, gainNode, now } = createToneEnvelope(audioCtx, freq, 0.3);
  oscillator.start(now);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
        oscillator.stop(audioCtx.currentTime + 0.05);
        oscillator.disconnect();
        gainNode.disconnect();
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

  const { oscillator, gainNode, now } = createToneEnvelope(audioCtx, freq, 0.3);
  oscillator.start(now);

  const releaseTime = Math.max(durationSec, 0.06);
  gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
  oscillator.stop(now + releaseTime + 0.02);
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

export function createIntervalPlayer(
  {
    delayMs = 500,
    notePlayer = playNote,
  }: {
    delayMs?: number;
    notePlayer?: (note: string) => Promise<void> | void;
  } = {},
) {
  let timeoutId: number | null = null;

  const play = (lowerNote: string, upperNote: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }

    notePlayer(lowerNote);
    timeoutId = window.setTimeout(() => {
      notePlayer(upperNote);
      timeoutId = null;
    }, delayMs);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { play, cancel };
}
