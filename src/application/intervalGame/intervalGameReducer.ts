import type { IntervalGameSettings } from '../../types/settings';
import {
  applyAnswerState,
  applySettingsState,
  createInitialIntervalGameState,
  createNextRoundState,
  hideLeavesState,
  requestHintState,
  type IntervalGameState,
} from './intervalGame';

export type IntervalGameAction =
  | { type: 'INIT'; settings: IntervalGameSettings }
  | { type: 'NEXT_ROUND'; nextState: IntervalGameState }
  | { type: 'ANSWER'; selectedName: string }
  | { type: 'SETTINGS'; settings: IntervalGameSettings }
  | { type: 'HINT' }
  | { type: 'CLEAR_HINT' }
  | { type: 'HIDE_LEAVES' }
  | { type: 'SET_LISTENING' };

export function intervalGameReducer(
  state: IntervalGameState,
  action: IntervalGameAction,
): IntervalGameState {
  switch (action.type) {
    case 'INIT':
      return createInitialIntervalGameState(action.settings);
    case 'NEXT_ROUND':
      return action.nextState;
    case 'ANSWER':
      return applyAnswerState(state, action.selectedName);
    case 'SETTINGS':
      return applySettingsState(state, action.settings);
    case 'HINT':
      return requestHintState(state);
    case 'CLEAR_HINT':
      return { ...state, hintName: null };
    case 'HIDE_LEAVES':
      return hideLeavesState(state);
    case 'SET_LISTENING':
      return { ...state, mood: 'listening' };
    default:
      return state;
  }
}
