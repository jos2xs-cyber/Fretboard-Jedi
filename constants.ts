import { MusicalDefinition, ScaleType, ChordType, NoteName } from './types';

export const NOTES: NoteName[] = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

// Standard Tuning: E A D G B E (Low to High)
// Indices in NOTES array: E=7, A=0, D=5, G=10, B=2, E=7
export const STRING_TUNING_INDICES = [7, 0, 5, 10, 2, 7]; 

export const SCALES: Record<ScaleType, MusicalDefinition> = {
  [ScaleType.MINOR_PENTATONIC]: {
    name: ScaleType.MINOR_PENTATONIC,
    intervals: [0, 3, 5, 7, 10],
    description: "The essential rock and blues scale. Five notes per octave.",
    tip: "Master Box 1 first. It's the 'home base' for 90% of guitar solos."
  },
  [ScaleType.MAJOR_PENTATONIC]: {
    name: ScaleType.MAJOR_PENTATONIC,
    intervals: [0, 2, 4, 7, 9],
    description: "Bright, country, and happy sounding. Related to the major scale.",
    tip: "This is the same shape as Minor Pentatonic but shifted down 3 frets (relative minor)."
  },
  [ScaleType.NATURAL_MINOR]: {
    name: ScaleType.NATURAL_MINOR,
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: "Also known as Aeolian mode. Sad, emotional, and epic.",
    tip: "Add the 2nd and b6 to your minor pentatonic to get this full sound."
  },
  [ScaleType.MAJOR]: {
    name: ScaleType.MAJOR,
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: "The Ionian mode. The foundation of Western music theory.",
    tip: "Learn the 3-note-per-string patterns to play this fast."
  },
  [ScaleType.BLUES]: {
    name: ScaleType.BLUES,
    intervals: [0, 3, 5, 6, 7, 10],
    description: "Minor pentatonic with the added 'blue note' (b5).",
    tip: "Bend the blue note slightly for that authentic blues growl."
  },
  [ScaleType.DORIAN]: {
    name: ScaleType.DORIAN,
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: "Minor scale with a natural 6th. Jazzy, soulful, Santana-esque.",
    tip: "Great over minor 7th chords. The natural 6th is the 'Dorian' flavor note."
  },
  [ScaleType.MIXOLYDIAN]: {
    name: ScaleType.MIXOLYDIAN,
    intervals: [0, 2, 4, 5, 7, 9, 10],
    description: "Major scale with a flat 7. The sound of classic rock and jam bands.",
    tip: "Works perfectly over dominant 7th chords (e.g., A7)."
  },
  [ScaleType.HARMONIC_MINOR]: {
    name: ScaleType.HARMONIC_MINOR,
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: "Exotic, classical, and neo-classical metal sound.",
    tip: "The gap between b6 and 7 gives it that distinct 'Snake Charmer' vibe."
  },
};

export const CHORDS: Record<ChordType, MusicalDefinition> = {
  [ChordType.MAJOR]: {
    name: "Major Triad",
    intervals: [0, 4, 7],
    description: "The fundamental happy chord. Root, 3rd, 5th.",
    tip: "Look for the C-Shape and E-Shape barriers to visualize this across the neck."
  },
  [ChordType.MINOR]: {
    name: "Minor Triad",
    intervals: [0, 3, 7],
    description: "The fundamental sad chord. Root, flat 3rd, 5th.",
    tip: "The A-Shape and E-Shape minor barriers are the most commonly used."
  },
  [ChordType.DOMINANT_7]: {
    name: "Dominant 7",
    intervals: [0, 4, 7, 10],
    description: "Major triad with a flat 7. Bluesy and unresolved.",
    tip: "This outlines the Mixolydian mode. Essential for Blues rhythm."
  },
  [ChordType.MAJOR_7]: {
    name: "Major 7",
    intervals: [0, 4, 7, 11],
    description: "Major triad with a natural 7. Dreamy, jazzy, lush.",
    tip: "The E-Shape Major 7 is often harder to play fully; try playing just the top 4 strings."
  },
  [ChordType.MINOR_7]: {
    name: "Minor 7",
    intervals: [0, 3, 7, 10],
    description: "Minor triad with a flat 7. Smooth, mellow, sophisticated.",
    tip: "The backbone of Jazz II-V-I progressions."
  },
  [ChordType.MINOR_7_FLAT_5]: {
    name: "m7b5 (Half Dim)",
    intervals: [0, 3, 6, 10],
    description: "Tense and unstable. Often acts as the ii chord in minor keys.",
    tip: "Visualize this as a minor 7 chord with the 5th flattened."
  },
  [ChordType.DIMINISHED]: {
    name: "Diminished 7",
    intervals: [0, 3, 6, 9],
    description: "Symmetrical and ominous. Repeats every 3 frets.",
    tip: "This shape is movable in minor 3rd intervals (3 frets) and stays the same note set."
  },
};

export const POSITION_COLORS = {
  1: '#ef4444', // Red
  2: '#f97316', // Orange
  3: '#eab308', // Yellow
  4: '#22c55e', // Green
  5: '#3b82f6', // Blue
};

export const POSITION_NAMES = {
  1: "Box 1",
  2: "Box 2",
  3: "Box 3",
  4: "Box 4",
  5: "Box 5",
};