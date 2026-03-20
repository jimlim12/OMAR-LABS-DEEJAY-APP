export type DeckId = 'A' | 'B' | 'C' | 'D';

export interface EQState {
  low: number;
  mid: number;
  high: number;
}

export interface EffectsState {
  filter: number;
  reverb: number;
  delay: number;
}

export interface DeckState {
  id: DeckId;
  isPlaying: boolean;
  volume: number;
  pitch: number;
  currentTime: number;
  duration: number;
  file: File | null;
  videoFile: File | null;
  eq: EQState;
  effects: EffectsState;
  loopLength: number | null; // in beats
  isLooping: boolean;
  bpm: number;
  key: string | null;
  isPitchLocked: boolean;
}

export interface Sample {
  id: string;
  name: string;
  url: string;
  color: string;
}
