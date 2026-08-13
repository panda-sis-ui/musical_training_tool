// src/types/settings.ts

export type AnswerMode = 'buttons' | 'piano';

export interface IntervalGameSettings {
  intervalNames: string[];
  tonicFixed: boolean;
  answerMode: AnswerMode;
}