import * as audio from './audio';

describe('audio envelope', () => {
  it('делает мягкий старт для последовательности нот, а не резкий pluck', async () => {
    const gainNode = {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    const oscillator = {
      type: 'square',
      frequency: { value: 0, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };

    const audioCtx = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gainNode),
      state: 'running',
      resume: vi.fn(),
    } as unknown as AudioContext;

    class AudioContextCtor {
      constructor() {
        return audioCtx;
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: AudioContextCtor,
    });

    await audio.playSequence(['C4'], { noteDurationSec: 0.2, gapSec: 0.05 });

    expect(audioCtx.createOscillator).toHaveBeenCalled();
    expect(oscillator.type).toBe('sine');
    expect(gainNode.gain.value).toBe(0.3);
    expect(gainNode.gain.setValueAtTime).not.toHaveBeenCalled();
    expect(gainNode.gain.exponentialRampToValueAtTime).not.toHaveBeenCalled();
  });
});
