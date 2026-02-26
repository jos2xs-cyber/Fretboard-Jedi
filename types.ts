export type NoteName = 'A' | 'A#' | 'B' | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#';

export type Mode = 'Scale' | 'Chord' | 'Triads';

export enum TriadQuality {
  MAJOR = 'Major',
  MINOR = 'Minor',
}

// String groups for triad filtering (string numbers 1=high E, 6=low E)
export type StringGroup = 'All' | '1-2-3' | '2-3-4' | '3-4-5' | '4-5-6';

export enum ScaleType {
  MINOR_PENTATONIC = 'Minor Pentatonic',
  MAJOR_PENTATONIC = 'Major Pentatonic',
  NATURAL_MINOR = 'Natural Minor',
  MAJOR = 'Major',
  BLUES = 'Blues',
  DORIAN = 'Dorian',
  MIXOLYDIAN = 'Mixolydian',
  HARMONIC_MINOR = 'Harmonic Minor',
}

export enum ChordType {
  MAJOR = 'Major',
  MINOR = 'Minor',
  DOMINANT_7 = 'Dominant 7',
  MAJOR_7 = 'Major 7',
  MINOR_7 = 'Minor 7',
  MINOR_7_FLAT_5 = 'm7b5',
  DIMINISHED = 'Diminished'
}

export type Position = 'Full Neck' | 1 | 2 | 3 | 4 | 5;

export interface MusicalDefinition {
  name: string;
  intervals: number[]; // Semitones from root
  description: string;
  tip: string;
}

export interface FretboardNote {
  stringIndex: number; // 0 (Low E) to 5 (High E) - consistent with logic
  fret: number;
  note: NoteName;
  interval: number; // Interval from root
  isRoot: boolean;
  color?: string;
  positionIndex?: number; // Which CAGED position this note primarily belongs to
  opacity: number;
}

export interface TabConfig {
  direction: 'Ascending' | 'Descending' | 'Up & Down';
}

export interface SoloScaleSuggestion {
  name: string;
  why: string;
  priority: 'primary' | 'secondary';
}

export interface ChordScaleSuggestion {
  chordLabel: string;
  scales: SoloScaleSuggestion[];
}

export interface ProgressionScaleSuggestions {
  global: SoloScaleSuggestion[];
  perChord: ChordScaleSuggestion[];
}

export interface Settings {
  showNoteNames: boolean;
  showPositionLabels: boolean;
  showConnections: boolean;
  darkMode: boolean;
}
