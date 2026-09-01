// src/types/settings.ts

export type AnswerMode = 'buttons' | 'piano';
export type IntervalDirection = 'up' | 'down' | 'both';

export interface IntervalGameSettings {
  intervalNames: string[];
  tonicFixed: boolean;
  answerMode: AnswerMode;
  direction: IntervalDirection;
}