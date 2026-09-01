import { act, renderHook } from '@testing-library/react';
import * as audioModule from '../lib/audio';
import * as intervalsModule from '../lib/intervals';
import { useIntervalGame } from './useIntervalGame';

describe('useIntervalGame', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    vi.spyOn(audioModule, 'playNote').mockResolvedValue();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('генерирует корректный интервал и увеличивает счёт при правильном ответе', () => {
    vi.spyOn(intervalsModule, 'getRandomInterval').mockReturnValue({
      name: 'терция',
      shortName: '3',
      semitones: 4,
    });

    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.initGame();
    });

    expect(result.current.lowerNote).toBe('C4');
    expect(result.current.upperNote).toBe('E4');
    expect(result.current.targetInterval?.name).toBe('терция');

    act(() => {
      result.current.handleAnswer('терция');
    });

    expect(result.current.score).toBe(1);
    expect(result.current.lastResult).toEqual({ intervalName: 'терция', isCorrect: true });
    expect(result.current.mood).toBe('happy');
    expect(result.current.leavesVisible).toBe(false);
  });

  it('не увеличивает счёт при неправильном ответе', () => {
    vi.spyOn(intervalsModule, 'getRandomInterval').mockReturnValue({
      name: 'квинта',
      shortName: '5',
      semitones: 7,
    });

    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.initGame();
    });

    act(() => {
      result.current.handleAnswer('терция');
    });

    expect(result.current.score).toBe(0);
    expect(result.current.lastResult).toEqual({ intervalName: 'терция', isCorrect: false });
    expect(result.current.mood).toBe('sad');
  });

  it('не даёт появляться нотам выше G5 в интервале', () => {
    vi.spyOn(intervalsModule, 'getRandomInterval').mockReturnValue({
      name: 'октава',
      shortName: '8',
      semitones: 12,
    });

    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.initGame();
    });

    expect(result.current.lowerNote <= 'G5').toBe(true);
    expect(result.current.upperNote <= 'G5').toBe(true);
  });

  it('сохраняет настройки в localStorage и применяет их', () => {
    vi.spyOn(intervalsModule, 'getRandomInterval').mockReturnValue({
      name: 'кварта',
      shortName: '4',
      semitones: 5,
    });

    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.updateSettings({
        intervalNames: ['кварта'],
        tonicFixed: true,
        answerMode: 'buttons',
      });
    });

    expect(result.current.settings).toEqual({
      intervalNames: ['кварта'],
      tonicFixed: true,
      answerMode: 'buttons',
    });

    expect(JSON.parse(localStorage.getItem('intervalGameSettings') ?? 'null')).toEqual({
      intervalNames: ['кварта'],
      tonicFixed: true,
      answerMode: 'buttons',
    });
  });

  it('сбрасывает подсказку после таймера и уменьшает количество оставшихся подсказок', () => {
    vi.spyOn(intervalsModule, 'getRandomInterval').mockReturnValue({
      name: 'секунда',
      shortName: '2',
      semitones: 2,
    });

    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.initGame();
    });

    act(() => {
      result.current.requestHint();
    });

    expect(result.current.hintsLeft).toBe(2);
    expect(result.current.hintName).toBe('секунда');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.hintName).toBeNull();
  });

  it('воспроизводит оба звука при новом раунде', () => {
    const playNoteSpy = vi.spyOn(audioModule, 'playNote');
    vi.spyOn(intervalsModule, 'getRandomInterval').mockReturnValue({
      name: 'терция',
      shortName: '3',
      semitones: 4,
    });

    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.startNewRound();
    });

    expect(playNoteSpy).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(playNoteSpy).toHaveBeenCalledTimes(2);
  });

  it('перезапускает воспроизведение интервала без наложения второго звука', () => {
    vi.spyOn(intervalsModule, 'getRandomInterval').mockReturnValue({
      name: 'терция',
      shortName: '3',
      semitones: 4,
    });

    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.initGame();
    });

    act(() => {
      result.current.replayInterval();
      result.current.replayInterval();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalledTimes(3);
  });

  it('сворачивает неактуальный режим пианино в безопасный режим кнопок', () => {
    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.updateSettings({
        intervalNames: ['терция'],
        tonicFixed: true,
        answerMode: 'piano',
      });
    });

    expect(result.current.settings.answerMode).toBe('buttons');
  });

  it('нормализует невалидные настройки интервалов и не ломает раунд', () => {
    const { result } = renderHook(() => useIntervalGame());

    act(() => {
      result.current.updateSettings({
        intervalNames: ['неизвестный интервал'],
        tonicFixed: false,
        answerMode: 'buttons',
      } as unknown as any);
    });

    expect(result.current.settings.intervalNames).toEqual(expect.arrayContaining(['прима', 'секунда']));
    expect(result.current.settings.tonicFixed).toBe(false);
    expect(result.current.lowerNote).toBeTruthy();
    expect(result.current.upperNote).toBeTruthy();
    expect(result.current.targetInterval).not.toBeNull();
  });
});
