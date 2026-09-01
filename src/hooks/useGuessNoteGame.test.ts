import { act, renderHook } from '@testing-library/react';
import * as audioModule from '../lib/audio';
import * as notesModule from '../lib/notes';
import { useGuessNoteGame } from './useGuessNoteGame';

describe('useGuessNoteGame', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.spyOn(audioModule, 'playNote').mockResolvedValue();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('увеличивает счёт при правильном ответе и скрывает листья', () => {
    vi.spyOn(notesModule, 'getRandomNote').mockReturnValue('C4');

    const { result } = renderHook(() => useGuessNoteGame());

    expect(result.current.targetNote).toBe('C4');

    act(() => {
      result.current.handleNotePlay('C4');
    });

    expect(result.current.score).toBe(1);
    expect(result.current.lastResult).toEqual({ note: 'C4', isCorrect: true });
    expect(result.current.leavesVisible).toBe(false);
    expect(result.current.mood).toBe('happy');
  });

  it('не увеличивает счёт при неправильном ответе и ставит sad', () => {
    vi.spyOn(notesModule, 'getRandomNote').mockReturnValue('C4');

    const { result } = renderHook(() => useGuessNoteGame());

    act(() => {
      result.current.handleNotePlay('D4');
    });

    expect(result.current.score).toBe(0);
    expect(result.current.lastResult).toEqual({ note: 'D4', isCorrect: false });
    expect(result.current.mood).toBe('sad');
  });

  it('уменьшает количество подсказок и сбрасывает название через таймер', () => {
    vi.spyOn(notesModule, 'getRandomNote').mockReturnValue('C4');
    vi.spyOn(notesModule, 'getRussianNoteName').mockReturnValue('До');

    const { result } = renderHook(() => useGuessNoteGame());

    act(() => {
      result.current.requestHint();
    });

    expect(result.current.hintsLeft).toBe(2);
    expect(result.current.hintName).toBe('До');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.hintName).toBeNull();
  });

  it('создаёт новый раунд и сбрасывает состояние ответа', () => {
    vi.spyOn(notesModule, 'getRandomNote')
      .mockReturnValueOnce('C4')
      .mockReturnValueOnce('D4');

    const { result } = renderHook(() => useGuessNoteGame());

    act(() => {
      result.current.handleNotePlay('C4');
    });

    act(() => {
      result.current.startNewRound();
    });

    expect(result.current.targetNote).toBe('D4');
    expect(result.current.score).toBe(1);
    expect(result.current.lastResult).toBeNull();
    expect(result.current.leavesVisible).toBe(true);
    expect(result.current.mood).toBe('idle');
  });
});
