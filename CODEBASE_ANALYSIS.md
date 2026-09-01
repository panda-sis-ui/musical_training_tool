# "Угадай интервал" Game - Comprehensive Codebase Analysis

## Executive Summary
The codebase has a solid architecture with clear separation of concerns (hooks, domain, application, infrastructure), but contains several critical runtime issues, edge cases, and UX problems that could impact reliability and user experience.

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. **Service Instance Race Condition & Stale Closures** 
**File:** [src/hooks/useIntervalGame.ts](src/hooks/useIntervalGame.ts#L24-L38)  
**Severity:** CRITICAL  
**Description:**  
The service instance is recreated on every render because of the `[state]` dependency in the useEffect that updates serviceRef:
```typescript
useEffect(() => {
  serviceRef.current = createIntervalGameService({...});
}, [state]); // ← Runs on EVERY state change
```
This causes:
- Multiple service instances to exist simultaneously
- Stale closures where methods reference old state
- Timing issues with audio playback (intervals scheduled to play might fire with wrong notes)
- Hint timers might reference wrong state values
- Resource leaks if previous instances' timers aren't properly cleared

**Fix:** Remove this effect. The service should only be created once in the ref initialization. Pass a callback to get current state instead of recreating:
```typescript
useEffect(() => {
  serviceRef.current.setState(() => state);
}, [state]); // Update state accessor, don't recreate service
```

---

### 2. **No Validation for Empty Interval Selection**
**File:** [src/domain/settings/settings.ts](src/domain/settings/settings.ts), [src/components/IntervalSettingsModal.tsx](src/components/IntervalSettingsModal.tsx#L119-L140)  
**Severity:** CRITICAL  
**Description:**  
Users can uncheck all intervals in the settings modal and save, leaving `intervalNames: []`. When a new round is generated:
```typescript
// src/lib/intervals.ts:26
export function getRandomInterval(intervalNames: string[]): Interval {
  const filtered = getIntervalsByNames(intervalNames);
  if (filtered.length === 0) {  // ← Falls back to ALL_INTERVALS!
    return ALL_INTERVALS[Math.floor(Math.random() * ALL_INTERVALS.length)];
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}
```
Silent fallback violates user's intent and breaks game settings.

**Fix:**
```typescript
// In IntervalSettingsModal.tsx - prevent deselecting all
const toggleInterval = (name: string) => {
  setLocalSettings((prev) => {
    const newNames = prev.intervalNames.includes(name)
      ? prev.intervalNames.filter((n) => n !== name)
      : [...prev.intervalNames, name];
    // ← Add validation: don't allow empty array
    if (newNames.length === 0) return prev; // Keep at least one
    return { ...prev, intervalNames: newNames };
  });
};

// In domain/settings/settings.ts - throw error instead of silent fallback
export function getRandomInterval(intervalNames: string[]): Interval {
  const filtered = getIntervalsByNames(intervalNames);
  if (filtered.length === 0) {
    throw new Error('No valid intervals available for selection');
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}
```

---

### 3. **Interval Range Boundary Conditions Broken**
**File:** [src/domain/intervals/roundGenerator.ts](src/domain/intervals/roundGenerator.ts#L50-90)  
**Severity:** CRITICAL  
**Description:**  
Multiple boundary issues can produce invalid intervals:

**Issue 3a:** Fallback logic after selecting upper note doesn't guarantee valid range:
```typescript
if (!isWithinPlayableRange(upperNoteValue)) {
  const fallbackIndex = Math.min(
    NOTE_SEQUENCE.indexOf(MAX_NOTE),          // e.g., index 23
    Math.max(0, NOTE_SEQUENCE.indexOf(lowerNoteValue) + interval.semitones), // e.g., index 25
  );
  upperNoteValue = NOTE_SEQUENCE[fallbackIndex] ?? 'G5';
}
```
When `lowerNoteValue + interval.semitones` > `G5` index, the fallback uses MAX_NOTE. But if `lowerNoteValue + interval.semitones < MAX_NOTE`, it correctly clips. However, if the lower note itself is beyond the valid range, this could fail.

**Issue 3b:** For direction='down', starting note selection doesn't validate that the lower note will be valid:
```typescript
const lowerIndex = upperIndex - interval.semitones;
const lowerNoteValue = NOTE_SEQUENCE[lowerIndex] ?? NOTE_SEQUENCE[Math.max(0, lowerIndex)];
```
If `lowerIndex` is -5, it accesses `Math.max(0, -5) = 0`, giving 'C4'. But we never checked if tonicFixed is true and should constrain to 'C4'.

**Issue 3c:** When tonicFixed=true, upward direction doesn't actually constrain start to 'C4':
```typescript
const candidateNotes = normalizedSettings.tonicFixed ? ['C4'] : [...NOTE_SEQUENCE];
// ← This is good, but...
const validStartNotes = validNotes.filter((note) => {
  const lowerIndex = NOTE_SEQUENCE.indexOf(note);
  const upperIndex = lowerIndex + interval.semitones;
  return upperIndex < NOTE_SEQUENCE.length && isWithinPlayableRange(NOTE_SEQUENCE[upperIndex]);
});
// ← Correctly filters, but if tonicFixed and none are valid, falls back to 'C4' anyway
```

**Fix:**
```typescript
function buildIntervalRound(settings: IntervalGameSettings): GeneratedRound {
  const normalizedSettings = normalizeSettings(settings);
  const interval = getRandomInterval(normalizedSettings.intervalNames);
  const direction: RoundDirection = normalizedSettings.direction === 'both'
    ? (Math.random() < 0.5 ? 'up' : 'down')
    : normalizedSettings.direction;

  const MIN_NOTE_INDEX = 0; // C4
  const MAX_NOTE_INDEX = NOTE_SEQUENCE.indexOf(MAX_NOTE); // G5

  let lowerNoteValue: string;
  let upperNoteValue: string;

  if (direction === 'down') {
    // For downward: pick upper note, compute lower
    const validUpperIndices = [];
    for (let i = interval.semitones; i <= MAX_NOTE_INDEX; i++) {
      const lowerIdx = i - interval.semitones;
      if (lowerIdx >= MIN_NOTE_INDEX) {
        validUpperIndices.push(i);
      }
    }
    if (validUpperIndices.length === 0) {
      throw new Error(`Cannot create downward ${interval.name} interval within range`);
    }
    const upperIdx = validUpperIndices[Math.floor(Math.random() * validUpperIndices.length)];
    const lowerIdx = upperIdx - interval.semitones;
    upperNoteValue = NOTE_SEQUENCE[upperIdx];
    lowerNoteValue = NOTE_SEQUENCE[lowerIdx];
  } else {
    // For upward: pick lower note, compute upper
    let minStartIdx = MIN_NOTE_INDEX;
    if (normalizedSettings.tonicFixed) {
      minStartIdx = MAX_NOTE_INDEX; // Only start from C4
      // Actually this should be: const C4_INDEX = 0; minStartIdx = C4_INDEX;
    }
    const validLowerIndices = [];
    for (let i = minStartIdx; i <= MAX_NOTE_INDEX; i++) {
      const upperIdx = i + interval.semitones;
      if (upperIdx <= MAX_NOTE_INDEX) {
        validLowerIndices.push(i);
      }
    }
    if (validLowerIndices.length === 0) {
      throw new Error(`Cannot create upward ${interval.name} interval within range`);
    }
    const lowerIdx = validLowerIndices[Math.floor(Math.random() * validLowerIndices.length)];
    const upperIdx = lowerIdx + interval.semitones;
    lowerNoteValue = NOTE_SEQUENCE[lowerIdx];
    upperNoteValue = NOTE_SEQUENCE[upperIdx];
  }

  return {
    interval,
    lowerNote: lowerNoteValue,
    upperNote: upperNoteValue,
    direction,
    playbackOrder: direction === 'down' ? [upperNoteValue, lowerNoteValue] : [lowerNoteValue, upperNoteValue],
  };
}
```

---

### 4. **Async Audio Context Not Awaited in Critical Paths**
**File:** [src/lib/audio.ts](src/lib/audio.ts#L58-100)  
**Severity:** CRITICAL  
**Description:**  
Audio functions are async but callers don't await them:

In [intervalGameService.ts](src/application/intervalGame/intervalGameService.ts#L40-45):
```typescript
private playInterval(lower: string, upper: string): void {
  this.dispatch({ type: 'SET_LISTENING' });
  this.intervalPlayerRef.current?.play(lower, upper);
  // ← No await, doesn't wait for AudioContext to be ready
}
```

In [audio.ts](src/lib/audio.ts#L132-147):
```typescript
export function createIntervalPlayer({
  delayMs = 500,
  notePlayer = playNote, // ← playNote is async
}: ...) {
  const play = (lowerNote: string, upperNote: string) => {
    if (typeof window === 'undefined') return;
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    
    notePlayer(lowerNote); // ← Not awaited!
    timeoutId = window.setTimeout(() => {
      notePlayer(upperNote); // ← Not awaited!
    }, delayMs);
  };
  return { play, cancel };
}
```

Result: If AudioContext fails to initialize (user denies permissions, API not available), audio plays silently without error feedback.

**Fix:**
```typescript
// In audio.ts - make play async aware
export function createIntervalPlayer({
  delayMs = 500,
  notePlayer = playNote,
}: ...) {
  let timeoutId: number | null = null;
  let currentPromise: Promise<void> | null = null;

  const play = async (lowerNote: string, upperNote: string) => {
    if (typeof window === 'undefined') return;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    await currentPromise; // Wait for previous playback
    
    currentPromise = (async () => {
      try {
        const ctx = await ensureAudioContext();
        if (!ctx) {
          console.warn('Audio context unavailable');
          return;
        }
        await notePlayer(lowerNote);
        await new Promise(r => {
          timeoutId = window.setTimeout(r, delayMs);
        });
        await notePlayer(upperNote);
      } catch (e) {
        console.error('Playback error:', e);
      } finally {
        currentPromise = null;
      }
    })();
  };

  return { play, cancel };
}

// In intervalGameService.ts
private async playInterval(lower: string, upper: string): Promise<void> {
  this.dispatch({ type: 'SET_LISTENING' });
  try {
    await this.intervalPlayerRef.current?.play(lower, upper);
  } catch (e) {
    console.error('Failed to play interval:', e);
    this.dispatch({ type: 'ANSWER', selectedName: '' }); // Reset state
  }
}
```

---

## 🟠 HIGH SEVERITY ISSUES

### 5. **Memory Leak: Hint Timer Not Cleaned Up on Unmount**
**File:** [src/hooks/useIntervalGame.ts](src/hooks/useIntervalGame.ts#L42-47), [src/application/intervalGame/intervalGameService.ts](src/application/intervalGame/intervalGameService.ts#L162-166)  
**Severity:** HIGH  
**Description:**  
The cleanup in dispose() only clears the hint timer, but there's a race condition:
1. Component unmounts
2. useEffect cleanup calls `serviceRef.current.dispose()`
3. But if `scheduleHintClear()` was called and its timeout fires AFTER the cleanup, it calls `dispatch({ type: 'CLEAR_HINT' })`
4. This triggers a state update on unmounted component

**Fix:**
```typescript
// In intervalGameService.ts
private unmounting = false;

dispose(): void {
  this.unmounting = true;
  this.clearHintTimer();
  this.intervalPlayerRef.current?.cancel();
}

private scheduleHintClear(): void {
  this.clearHintTimer();
  this.hintTimerRef.current = window.setTimeout(() => {
    if (!this.unmounting) { // ← Check before dispatch
      this.dispatch({ type: 'CLEAR_HINT' });
    }
    this.hintTimerRef.current = null;
  }, 2000);
}
```

---

### 6. **Hint Button Enable Logic Is Unintuitive**
**File:** [src/pages/IntervalGamePage.tsx](src/pages/IntervalGamePage.tsx#L63-69)  
**Severity:** HIGH  
**Description:**  
```typescript
disabled={game.hintsLeft === 0 || game.lastResult !== null || !game.leavesVisible}
```

Issues:
- Hint is disabled if `lastResult !== null` (any result, correct or wrong). Makes sense for preventing multiple hints per question.
- But `!game.leavesVisible` also disables it. Why? If leaves are hidden, user can't see notes anyway, so they might want a hint.
- More importantly: when user guesses incorrectly, `leavesVisible` becomes false. But hint button enables after that if they start a new round. However, the condition allows hints even after correct guess as long as leavesVisible is true, which shouldn't happen.

**Current state after correct answer:**
- `isCorrectGuessed = true`
- `leavesVisible = false`
- `lastResult = { isCorrect: true }`

The button is disabled because `lastResult !== null`. But what if we call hideLeaves() after correct answer? It's already false, so that doesn't help.

**Better logic:**
```typescript
// Hints disabled if: no hints left, or already answered (regardless of correctness), or already showed leaves
disabled={game.hintsLeft === 0 || game.lastResult !== null}
```

---

### 7. **Playback Order Inconsistency Between Round Generation and Replay**
**File:** [src/domain/intervals/roundGenerator.ts](src/domain/intervals/roundGenerator.ts#L82-83), [src/application/intervalGame/intervalGameService.ts](src/application/intervalGame/intervalGameService.ts#L110-120)  
**Severity:** HIGH  
**Description:**  
Round generation computes playbackOrder:
```typescript
playbackOrder: direction === 'down' ? [upperNoteValue, lowerNoteValue] : [lowerNoteValue, upperNoteValue],
```

But replay() recalculates it:
```typescript
const playbackOrder = state.roundDirection === 'down'
  ? [state.upperNote, state.lowerNote]
  : [state.lowerNote, state.upperNote];
```

If there's ever a bug where `roundDirection` doesn't match the actual notes (e.g., due to the boundary issues in issue #3), replay will play the wrong order. Better to use the stored playbackOrder:

**Fix:**
```typescript
// Store playbackOrder in state (already done: playbackOrder: [string, string])
// Use it consistently
replay(): void {
  const state = this.getState();
  if (!state.playbackOrder[0] || !state.playbackOrder[1]) return;
  this.playInterval(state.playbackOrder[0], state.playbackOrder[1]);
}
```

---

### 8. **Settings Change Auto-Plays New Round Without Warning**
**File:** [src/application/intervalGame/intervalGameService.ts](src/application/intervalGame/intervalGameService.ts#L131-137)  
**Severity:** HIGH (UX)  
**Description:**  
When user changes settings in the modal, a new round is instantly generated and auto-played:
```typescript
updateSettings(newSettings: IntervalGameSettings): void {
  const normalizedSettings = normalizeSettings(newSettings);
  const currentState = this.getState();
  const nextState = createNextRoundState(currentState, normalizedSettings);

  saveSettings(normalizedSettings);
  this.dispatch({ type: 'SETTINGS', settings: normalizedSettings });
  this.playInterval(nextState.playbackOrder[0], nextState.playbackOrder[1]); // ← Immediate!
}
```

User might expect to stay on current round, just with different allowed answers. Instead they're forced to a new round. Also, if they change direction from 'up' to 'down', the immediate playback starts before modal closes, confusing UX.

**Fix:**
```typescript
updateSettings(newSettings: IntervalGameSettings): void {
  const normalizedSettings = normalizeSettings(newSettings);
  const currentState = this.getState();
  
  // Only update settings, don't auto-generate new round or play
  saveSettings(normalizedSettings);
  this.dispatch({ type: 'SETTINGS', settings: normalizedSettings });
  
  // If user explicitly wants a new round, they click the "Next" button
  // Alternatively, ask user: "Start new round with new settings?"
}

// Or in component, add a separate action:
const handleSettingsSave = (newSettings: IntervalGameSettings) => {
  updateSettings(newSettings);
  // Show modal asking "Start new round?" with Yes/No
};
```

---

### 9. **Settings Modal Allows But Doesn't Properly Handle Empty Intervals (Duplicate of #2 but from UI side)**
**File:** [src/components/IntervalSettingsModal.tsx](src/components/IntervalSettingsModal.tsx#L130-141)  
**Severity:** HIGH  
**Description:**  
The save button doesn't validate that at least one interval is selected. Need to disable save if no intervals selected:

**Fix:**
```typescript
const handleSave = () => {
  if (localSettings.intervalNames.length === 0) {
    alert('Выберите хотя бы один интервал');
    return;
  }
  onSave(localSettings);
  onClose();
};
```

---

### 10. **No Error Boundary or Audio Initialization Error Handling**
**File:** [src/pages/IntervalGamePage.tsx](src/pages/IntervalGamePage.tsx), [src/lib/audio.ts](src/lib/audio.ts#L12-30)  
**Severity:** HIGH  
**Description:**  
If AudioContext initialization fails (browser doesn't support it, user denies permission, system audio disabled):
- `ensureAudioContext()` returns `null`
- No error message shown to user
- Game appears to work but produces no sound
- No retry mechanism

**Fix:**
```typescript
// In IntervalGamePage.tsx
const [audioError, setAudioError] = useState<string | null>(null);

useEffect(() => {
  (async () => {
    try {
      const ctx = await ensureAudioContext();
      if (!ctx) {
        setAudioError('Web Audio API не поддерживается или недоступно');
      }
    } catch (e) {
      setAudioError(`Ошибка инициализации аудио: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  })();
}, []);

// Render error if present
if (audioError) {
  return (
    <div className={styles.container}>
      <Header title="Угадай интервал" />
      <div className={styles.errorMessage}>
        {audioError}
        <button onClick={() => window.location.reload()}>Перезагрузить</button>
      </div>
    </div>
  );
}
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### 11. **Score Not Reset When Changing Settings (Design Issue)**
**File:** [src/application/intervalGame/intervalGame.ts](src/application/intervalGame/intervalGame.ts#L104-108)  
**Severity:** MEDIUM  
**Description:**  
When settings change, a new round is created but score persists:
```typescript
return createNextRoundState({
  ...currentState,  // ← Score is preserved!
  settings: normalizedSettings,
}, normalizedSettings);
```

User can select 'easy' mode (e.g., only primes), accumulate score, then switch to 'hard' mode. The score reflects a mix of difficulties. This might be intentional, but it's ambiguous.

**Fix:**
Either reset score:
```typescript
return createNextRoundState({
  ...currentState,
  settings: normalizedSettings,
  score: 0, // ← Reset when settings change
}, normalizedSettings);
```

Or add a confirmation dialog.

---

### 12. **LocalStorage Quota Error Handling Too Silent**
**File:** [src/infrastructure/storage/settingsStorage.ts](src/infrastructure/storage/settingsStorage.ts#L6-10)  
**Severity:** MEDIUM  
**Description:**  
Settings save silently fails if localStorage is full:
```typescript
try {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
} catch {
  // Браузер может запретить запись localStorage.
  // ← No logging, no user feedback
}
```

If localStorage is full and settings aren't saved, user's preferences are lost. Next session loads default settings without knowing why.

**Fix:**
```typescript
try {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
} catch (e) {
  const err = e instanceof Error ? e.message : 'Unknown error';
  console.warn(`Failed to save settings to localStorage: ${err}`);
  
  // Try to clean up old data and retry once
  if (e instanceof Error && e.name === 'QuotaExceededError') {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k !== STORAGE_KEY) localStorage.removeItem(k);
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.warn('Settings saved after cleanup');
    } catch (retryErr) {
      console.error('Failed to save settings even after cleanup:', retryErr);
    }
  }
}
```

---

### 13. **Hints Are Not Progressive (One-Level Only)**
**File:** [src/application/intervalGame/intervalGame.ts](src/application/intervalGame/intervalGame.ts#L115-124)  
**Severity:** MEDIUM (UX/Completeness)  
**Description:**  
Every hint just shows the interval name. No progressive hints:
- Hint 1: Show interval name
- Hint 2: Show interval semitones
- Hint 3: Show notes on staff

Currently, users get the same hint 3 times, which is wasteful.

**Fix:**
```typescript
export function requestHintState(
  currentState: IntervalGameState,
): IntervalGameState {
  if (!currentState.targetInterval || currentState.isCorrectGuessed || currentState.hintsLeft <= 0) {
    return currentState;
  }

  const hintsUsed = 3 - currentState.hintsLeft;
  let hintName: string;
  
  switch (hintsUsed) {
    case 0:
      hintName = currentState.targetInterval.name; // e.g., "терция"
      break;
    case 1:
      hintName = `${currentState.targetInterval.semitones} полутонов`; // "4 полутона"
      break;
    case 2:
      hintName = `${currentState.lowerNote}–${currentState.upperNote}`; // "C4–E4"
      break;
    default:
      return currentState;
  }

  return {
    ...currentState,
    hintsLeft: currentState.hintsLeft - 1,
    hintName,
  };
}
```

---

### 14. **No Accessibility Support (A11y)**
**File:** Multiple components  
**Severity:** MEDIUM  
**Description:**  
Missing features:
- No ARIA labels on buttons (except title attributes)
- No semantic HTML headings for screenreaders
- No alt text for fox images and SVG content
- No color-blind support (using only emoji ✅/❌ and colors)
- Score counter not marked as live region
- No keyboard focus visible indicators (except Piano)
- Modal not properly marked with role="dialog" and aria-labelledby

**Fixes:**
```typescript
// Example: IntervalGamePage.tsx
<div className={styles.container}>
  <Header title="Угадай интервал" />
  <main>
    {/* ... */}
  </main>
</div>

// HeroImage.tsx
<img src={image} alt="Персонаж лиса" className={styles.avatar} />

// ScoreCounter.tsx
<div className={styles.container} role="status" aria-live="polite">
  <span aria-label="Количество правильных ответов">✅</span> {score}
</div>

// IntervalSettingsModal.tsx
<div className={styles.modal} role="dialog" aria-labelledby="modal-title">
  <h2 id="modal-title" className={styles.title}>Настройки игры</h2>
  {/* ... */}
</div>

// IntervalButtons.tsx
<button
  key={name}
  className={className}
  onClick={() => onSelect(name)}
  disabled={isBlocked}
  aria-label={`Ответить интервал ${name}`}
>
  {name}
</button>
```

---

### 15. **TwoNoteStaff Ledger Lines Hardcoded for Only 2 Notes**
**File:** [src/components/TwoNoteStaff.tsx](src/components/TwoNoteStaff.tsx#L27-30)  
**Severity:** MEDIUM  
**Description:**  
```typescript
const ledgerNotes = ['C4', 'G5'];
const needsLedgerLower = ledgerNotes.includes(lowerBase);
const needsLedgerUpper = ledgerNotes.includes(upperBase);
```

Only C4 and G5 get ledger lines. But notes below and above the staff also need them (e.g., B3, A5 depending on staff orientation).

**Fix:**
```typescript
function needsLedgerLine(note: string, topLineY: number, bottomLineY: number, yPosition: number): boolean {
  return yPosition < bottomLineY || yPosition > topLineY;
}

// Render ledger lines for both notes if needed
{yLower < 20 && (
  <line x1={xLower - 20} y1={yLower} x2={xLower + 20} y2={yLower} stroke="#333" strokeWidth="1.5" />
)}
{yUpper > 80 && (
  <line x1={xUpper - 20} y1={yUpper} x2={xUpper + 20} y2={yUpper} stroke="#333" strokeWidth="1.5" />
)}
```

---

### 16. **Piano Mode UI Incomplete and Confusing**
**File:** [src/components/IntervalSettingsModal.tsx](src/components/IntervalSettingsModal.tsx#L58-67)  
**Severity:** MEDIUM  
**Description:**  
```typescript
<label>
  <input
    type="radio"
    name="answerMode"
    value="piano"
    checked={false}
    disabled
  />
  Игра на пианино (скоро)
</label>
```

Piano mode is marked as "coming soon" but:
- Infrastructure exists (Piano.tsx component)
- Confuses users about feature status
- answerMode in settings is always hardcoded to 'buttons'

Either:
- Remove Piano mode UI until it's ready
- Or implement it fully

---

### 17. **Unused HiddenNote Component**
**File:** [src/components/HiddenNote.tsx](src/components/HiddenNote.tsx)  
**Severity:** MEDIUM  
**Description:**  
Component exists but isn't imported or used anywhere. Is it abandoned? Causes maintenance confusion.

**Fix:** Either use it or delete it. If TwoNoteStaff replaces it, remove HiddenNote.tsx.

---

## 🔵 LOW SEVERITY ISSUES

### 18. **Unused Variables in Piano Component**
**File:** [src/components/Piano.tsx](src/components/Piano.tsx#L166-167)  
**Severity:** LOW  
**Description:**  
```typescript
const blackKeyWidth = 6;
const whiteKeyWidth = 10;
// Never used
```

Likely planned for styling but not implemented.

**Fix:** Remove or implement CSS-based width logic.

---

### 19. **No Visual Feedback for Active Audio Playback**
**File:** [src/pages/IntervalGamePage.tsx](src/pages/IntervalGamePage.tsx)  
**Severity:** LOW (UX Polish)  
**Description:**  
Mood changes to 'listening' but there's no visual indication of which note is currently playing. Users can't tell if audio is working without making a guess.

**Fix:** Add a visual indicator:
```typescript
const [playingNote, setPlayingNote] = useState<string | null>(null);

// In service, dispatch an action when note plays
export class IntervalGameService {
  private notePlayer = async (note: string) => {
    this.dispatch({ type: 'SET_PLAYING_NOTE', note });
    await playNote(note);
    this.dispatch({ type: 'SET_PLAYING_NOTE', note: null });
  };
}

// In component, render indicator
{state.playingNote && (
  <div className={styles.playingIndicator}>
    Проигрывается: {getRussianNoteName(state.playingNote)}
  </div>
)}
```

---

### 20. **Settings Modal Doesn't Update if Changed in Another Tab**
**File:** [src/components/IntervalSettingsModal.tsx](src/components/IntervalSettingsModal.tsx#L20-23)  
**Severity:** LOW  
**Description:**  
If user opens game in two tabs, changes settings in Tab A, Tab B's settings modal won't reflect the changes.

**Fix:** Listen to storage events:
```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'intervalGameSettings' && e.newValue) {
      const updated = JSON.parse(e.newValue);
      setLocalSettings(updated);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

---

### 21. **Inconsistent Naming: "Leaves" vs "Hidden Note"**
**File:** Multiple components use both `leavesVisible` and "листья"  
**Severity:** LOW  
**Description:**  
State uses `leavesVisible` (leaves/листья) but component is named `HiddenNote`. Conceptually unclear.

**Fix:** Rename consistently. If using leaves overlay metaphor, rename state to `leafCoverVisible` and component to `LeafCover.tsx`.

---

### 22. **No Transition Animations**
**File:** [src/pages/IntervalGamePage.tsx](src/pages/IntervalGamePage.tsx), components  
**Severity:** LOW (Polish)  
**Description:**  
Hero mood changes instantly. No transition feedback makes game feel choppy.

**Fix:** Add CSS transitions:
```css
.avatar {
  transition: opacity 0.3s ease-in-out;
}

.moodChange {
  animation: fadeIn 0.3s ease-in-out;
}
```

---

### 23. **Incomplete Test Coverage**
**File:** [src/hooks/useIntervalGame.test.ts](src/hooks/useIntervalGame.test.ts), [src/lib/audio.test.ts](src/lib/audio.test.ts)  
**Severity:** LOW  
**Description:**  
Only a few tests cover happy paths. Missing:
- Error cases (empty intervals, bad settings)
- Audio context initialization failures
- Settings save failures
- Boundary conditions in roundGenerator
- hint timer cleanup
- Replay with different directions

**Fix:** Add tests for all edge cases mentioned in this analysis.

---

## Summary Table

| # | Issue | Severity | Type | Fix Effort |
|---|-------|----------|------|-----------|
| 1 | Service race condition & stale closures | 🔴 CRITICAL | Architecture | High |
| 2 | Empty interval selection allowed | 🔴 CRITICAL | Logic | Medium |
| 3 | Interval range boundary broken | 🔴 CRITICAL | Logic | Very High |
| 4 | Async audio not awaited | 🔴 CRITICAL | Async/Reliability | High |
| 5 | Hint timer memory leak on unmount | 🟠 HIGH | Memory | Low |
| 6 | Hint button enable logic unintuitive | 🟠 HIGH | UX | Low |
| 7 | Playback order inconsistency | 🟠 HIGH | Logic | Low |
| 8 | Settings change auto-plays round | 🟠 HIGH | UX | Medium |
| 9 | Settings modal doesn't validate empty | 🟠 HIGH | Validation | Low |
| 10 | No audio init error handling | 🟠 HIGH | Error Handling | Medium |
| 11 | Score not reset on settings change | 🟡 MEDIUM | Design | Low |
| 12 | localStorage error silent | 🟡 MEDIUM | Reliability | Low |
| 13 | Hints not progressive | 🟡 MEDIUM | UX/Feature | Medium |
| 14 | No accessibility support | 🟡 MEDIUM | A11y | High |
| 15 | Ledger lines hardcoded | 🟡 MEDIUM | Display | Low |
| 16 | Piano mode incomplete | 🟡 MEDIUM | Feature | Very High |
| 17 | Unused HiddenNote component | 🟡 MEDIUM | Cleanup | Low |
| 18 | Unused variables in Piano | 🔵 LOW | Cleanup | Trivial |
| 19 | No playback feedback | 🔵 LOW | UX Polish | Low |
| 20 | Settings not synced across tabs | 🔵 LOW | UX | Low |
| 21 | Inconsistent naming | 🔵 LOW | Code Quality | Low |
| 22 | No animations | 🔵 LOW | Polish | Low |
| 23 | Incomplete test coverage | 🔵 LOW | Testing | High |

---

## Recommended Fix Priority

**Phase 1 (Immediate - Blocking):**
1. Fix service race condition (#1)
2. Validate interval selection (#2)
3. Fix interval boundary logic (#3)
4. Await audio context initialization (#4)

**Phase 2 (High Priority - Reliability):**
5. Clean up hint timer (#5)
6. Add audio init error handling (#10)
7. Fix playback order inconsistency (#7)

**Phase 3 (Medium Priority - UX):**
8. Fix hint button logic (#6)
9. Settings change UX (#8)
10. Progressive hints (#13)

**Phase 4 (Polish & Accessibility):**
11. Accessibility improvements (#14)
12. Fix ledger lines (#15)
13. Animations (#22)
14. Test coverage (#23)

**Phase 5 (Cleanup & Future):**
15. Remove/use HiddenNote (#17)
16. Decide on Piano mode (#16)
17. Unused variables (#18)

