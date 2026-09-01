import * as audio from '../../lib/audio';

export function createIntervalPlayer(
  options: {
    delayMs?: number;
    notePlayer?: (note: string) => Promise<void> | void;
  } = {},
) {
  return audio.createIntervalPlayer(options);
}

export function playNote(note: string, durationSec?: number): Promise<void> | void {
  return audio.playNote(note, durationSec);
}
