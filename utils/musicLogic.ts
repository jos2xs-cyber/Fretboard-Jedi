import { NOTES, SCALES, CHORDS, STRING_TUNING_INDICES } from '../constants';
import {
  FretboardNote,
  ScaleType,
  ChordType,
  NoteName,
  Position,
  Mode,
  ProgressionScaleSuggestions,
  SoloScaleSuggestion,
} from '../types';

export interface ScaleDegreeInfo {
  degree: number;
  note: NoteName;
  quality: 'Major' | 'Minor' | 'Diminished' | 'Augmented' | 'Unknown';
  shortQuality: '' | 'min' | 'dim' | 'aug' | '?';
}

/**
 * Get index of a note in the NOTES array
 */
export const getNoteIndex = (note: NoteName): number => NOTES.indexOf(note);

/**
 * Get note name at a specific string and fret
 */
export const getNoteAtFret = (stringIndex: number, fret: number): NoteName => {
  // stringIndex 0 = Low E (Index 7 in NOTES)
  // But wait, in constants we defined STRING_TUNING_INDICES as [7, 0, 5, 10, 2, 7]
  // Let's assume our system uses 0=Low E, 5=High E for iteration logic
  const openNoteIndex = STRING_TUNING_INDICES[stringIndex];
  const currentNoteIndex = (openNoteIndex + fret) % 12;
  return NOTES[currentNoteIndex];
};

/**
 * Calculate the semitones from Root for a given note
 */
export const getIntervalFromRoot = (root: NoteName, note: NoteName): number => {
  const rootIdx = getNoteIndex(root);
  const noteIdx = getNoteIndex(note);
  return (noteIdx - rootIdx + 12) % 12;
};

export const getScaleNotes = (root: NoteName, scaleType: ScaleType): NoteName[] => {
  const rootIdx = getNoteIndex(root);
  return SCALES[scaleType].intervals.map(interval => NOTES[(rootIdx + interval) % 12]);
};

const getTriadQuality = (thirdInterval: number, fifthInterval: number): ScaleDegreeInfo['quality'] => {
  if (thirdInterval === 4 && fifthInterval === 7) return 'Major';
  if (thirdInterval === 3 && fifthInterval === 7) return 'Minor';
  if (thirdInterval === 3 && fifthInterval === 6) return 'Diminished';
  if (thirdInterval === 4 && fifthInterval === 8) return 'Augmented';
  return 'Unknown';
};

const toShortQuality = (quality: ScaleDegreeInfo['quality']): ScaleDegreeInfo['shortQuality'] => {
  if (quality === 'Minor') return 'min';
  if (quality === 'Diminished') return 'dim';
  if (quality === 'Augmented') return 'aug';
  if (quality === 'Major') return '';
  return '?';
};

/**
 * Builds one triad per degree from the selected scale.
 * Returns null when the scale does not have enough tones to derive a full degree map.
 */
export const getScaleDegreeChords = (
  root: NoteName,
  scaleType: ScaleType
): ScaleDegreeInfo[] | null => {
  const intervals = SCALES[scaleType].intervals;
  if (intervals.length < 7) return null;

  const rootIdx = getNoteIndex(root);

  return intervals.map((rootInterval, degreeIndex) => {
    const thirdDegreeIndex = (degreeIndex + 2) % intervals.length;
    const fifthDegreeIndex = (degreeIndex + 4) % intervals.length;

    const thirdIntervalRaw = intervals[thirdDegreeIndex];
    const fifthIntervalRaw = intervals[fifthDegreeIndex];

    const thirdIntervalFromDegree = (thirdIntervalRaw - rootInterval + 12) % 12;
    const fifthIntervalFromDegree = (fifthIntervalRaw - rootInterval + 12) % 12;

    const quality = getTriadQuality(thirdIntervalFromDegree, fifthIntervalFromDegree);
    const note = NOTES[(rootIdx + rootInterval) % 12];

    return {
      degree: degreeIndex + 1,
      note,
      quality,
      shortQuality: toShortQuality(quality),
    };
  });
};

/**
 * Determine the start fret for Position 1 (E-Shape / Box 1) for a given root.
 * Convention: Lowest root on Low E string.
 */
export const getPosition1StartFret = (root: NoteName): number => {
  // Low E is 'E' (index 7).
  // Find fret where Note == Root on String 0 (Low E)
  const rootIdx = getNoteIndex(root); // e.g. A = 0
  const lowEIdx = 7;
  // (7 + fret) % 12 = 0 => fret = 5.
  // Formula: (target - start + 12) % 12
  return (rootIdx - lowEIdx + 12) % 12;
};

export const generateFretboard = (
  root: NoteName,
  type: ScaleType | ChordType,
  currentPosition: Position,
  mode: Mode
): FretboardNote[] => {
  // Select data source based on mode
  const definition = mode === 'Scale' ? SCALES[type as ScaleType] : CHORDS[type as ChordType];
  const notes: FretboardNote[] = [];
  
  // Find where Position 1 starts (Root on Low E)
  const p1Start = getPosition1StartFret(root);

  // CAGED Position Ranges relative to P1 Root Fret (R)
  const getFretRange = (pos: number, rootFret: number): {min: number, max: number}[] => {
    // Basic offsets for standard CAGED boxes (approximate, covers most scale types)
    const offsets = [
      { min: -1, max: 3 }, // P1 (E Shape)
      { min: 2, max: 5 },  // P2 (D Shape)
      { min: 4, max: 8 },  // P3 (C Shape)
      { min: 7, max: 10 }, // P4 (A Shape)
      { min: 9, max: 13 }, // P5 (G Shape)
    ];
    
    const offset = offsets[pos - 1];
    const ranges = [];
    
    // Base range
    let min = rootFret + offset.min;
    let max = rootFret + offset.max;
    ranges.push({ min, max });
    
    // Octave up
    ranges.push({ min: min + 12, max: max + 12 });
    
    // Octave down
    ranges.push({ min: min - 12, max: max - 12 });
    
    return ranges;
  };

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    for (let fret = 0; fret <= 22; fret++) {
      const note = getNoteAtFret(stringIdx, fret);
      const interval = getIntervalFromRoot(root, note);
      
      const isCorrectNote = definition.intervals.includes(interval);
      const isRoot = interval === 0;

      if (!isCorrectNote) continue;

      // Determine which position this note "belongs" to.
      let posIndex = 0;
      
      // Check each position to assign color/id
      for (let p = 1; p <= 5; p++) {
        const ranges = getFretRange(p, p1Start);
        for (const r of ranges) {
           if (fret >= r.min && fret <= r.max) {
             posIndex = p;
             break;
           }
        }
        if (posIndex !== 0) break; 
      }
      
      if (posIndex === 0) {
         posIndex = 1; 
      }

      // Visibility Logic
      let opacity = 0.2; // Dimmed by default
      if (currentPosition === 'Full Neck') {
        opacity = 1;
      } else {
        // Check if this specific note matches the requested position range
        const targetRanges = getFretRange(currentPosition, p1Start);
        const inRange = targetRanges.some(r => fret >= r.min && fret <= r.max);
        
        if (inRange) {
          opacity = 1;
          // In Chord Mode, we often want to strictly visualize the "shape", 
          // but relying on the same logic works well because the "shape" is defined by the CAGED box anyway.
          posIndex = currentPosition; 
        } else {
            opacity = 0.15;
        }
      }

      notes.push({
        stringIndex: stringIdx,
        fret,
        note,
        interval,
        isRoot,
        positionIndex: posIndex,
        opacity
      });
    }
  }

  return notes;
};

export const getTabContent = (
    root: NoteName,
    type: ScaleType | ChordType,
    position: Position,
    direction: 'Ascending' | 'Descending' | 'Up & Down',
    notes: FretboardNote[] 
): string => {
    
    // Filter active notes
    let activeNotes = notes.filter(n => n.opacity === 1);
    
    // Sort logic
    if (position === 'Full Neck') {
        const stringBase = [0, 5, 10, 15, 19, 24];
        activeNotes.sort((a, b) => {
            const pitchA = stringBase[a.stringIndex] + a.fret;
            const pitchB = stringBase[b.stringIndex] + b.fret;
            return pitchA - pitchB;
        });
    } else {
        // Single position
        activeNotes.sort((a, b) => {
            if (a.stringIndex !== b.stringIndex) {
                return a.stringIndex - b.stringIndex; // 0 (Low E) first
            }
            return a.fret - b.fret;
        });
    }

    // Apply Direction
    let sequence = [...activeNotes];
    if (direction === 'Descending') {
        sequence.reverse();
    } else if (direction === 'Up & Down') {
        sequence = [...sequence, ...[...sequence].reverse().slice(1)];
    }

    const lines: string[][] = [
        ['e', '|'],
        ['B', '|'],
        ['G', '|'],
        ['D', '|'],
        ['A', '|'],
        ['E', '|']
    ];

    // Initialize lines
    sequence.forEach(note => {
        const fretStr = note.fret.toString();
        const pad = '-'; 
        
        const lineIdx = 5 - note.stringIndex; 
        
        lines.forEach((line, idx) => {
            if (idx === lineIdx) {
                line.push(fretStr + pad);
            } else {
                const space = '-'.repeat(fretStr.length + 1);
                line.push(space);
            }
        });
    });

    lines.forEach(line => line.push('|'));

    return lines.map(line => line.join('')).join('\n');
};

const getScaleName = (
  root: NoteName,
  kind: 'major' | 'naturalMinor' | 'majorPent' | 'minorPent' | 'mixolydian'
): string => {
  if (kind === 'major') return `${root} Major`;
  if (kind === 'naturalMinor') return `${root} Natural Minor`;
  if (kind === 'majorPent') return `${root} Major Pentatonic`;
  if (kind === 'minorPent') return `${root} Minor Pentatonic`;
  return `${root} Mixolydian`;
};

const getRelativeMinor = (majorKey: NoteName): NoteName => {
  const majorIdx = getNoteIndex(majorKey);
  return NOTES[(majorIdx + 9) % 12];
};

const getChordSuffix = (chordType: ChordType): string => {
  if (chordType === ChordType.MAJOR) return '';
  if (chordType === ChordType.MINOR) return 'm';
  if (chordType === ChordType.DOMINANT_7) return '7';
  if (chordType === ChordType.MAJOR_7) return 'maj7';
  if (chordType === ChordType.MINOR_7) return 'm7';
  if (chordType === ChordType.MINOR_7_FLAT_5) return 'm7b5';
  return 'dim';
};

export const getChordDisplayLabel = (root: NoteName, chordType: ChordType): string => {
  return `${root}${getChordSuffix(chordType)}`;
};

const getChordScaleSuggestions = (
  progressionKey: NoteName,
  chordRoot: NoteName,
  chordType: ChordType
): SoloScaleSuggestion[] => {
  if (chordType === ChordType.MAJOR || chordType === ChordType.MAJOR_7) {
    return [
      {
        name: getScaleName(chordRoot, 'majorPent'),
        why: 'Strong chord-tone targeting with simple phrasing.',
        priority: 'primary',
      },
      {
        name: getScaleName(progressionKey, 'major'),
        why: 'Stays fully inside the progression key.',
        priority: 'secondary',
      },
    ];
  }

  if (chordType === ChordType.MINOR || chordType === ChordType.MINOR_7) {
    return [
      {
        name: getScaleName(chordRoot, 'minorPent'),
        why: 'Easy melodic vocabulary that highlights the minor color.',
        priority: 'primary',
      },
      {
        name: getScaleName(progressionKey, 'major'),
        why: 'Connects smoothly back to the full key center.',
        priority: 'secondary',
      },
    ];
  }

  if (chordType === ChordType.DOMINANT_7) {
    return [
      {
        name: getScaleName(chordRoot, 'mixolydian'),
        why: 'Best practical match for dominant 7 function.',
        priority: 'primary',
      },
      {
        name: getScaleName(chordRoot, 'majorPent'),
        why: 'Safe fallback for melodic lines over V7.',
        priority: 'secondary',
      },
    ];
  }

  return [
    {
      name: getScaleName(progressionKey, 'major'),
      why: 'Use key tones first; treat chord tones as passing tension.',
      priority: 'primary',
    },
    {
      name: getScaleName(chordRoot, 'minorPent'),
      why: 'Optional blues color if phrased lightly.',
      priority: 'secondary',
    },
  ];
};

export const getProgressionScaleSuggestions = (
  progressionKey: NoteName,
  chords: Array<{ root: NoteName; chordType: ChordType }>
): ProgressionScaleSuggestions => {
  const relativeMinor = getRelativeMinor(progressionKey);

  return {
    global: [
      {
        name: getScaleName(progressionKey, 'major'),
        why: 'Primary all-purpose scale for these major-key presets.',
        priority: 'primary',
      },
      {
        name: getScaleName(progressionKey, 'majorPent'),
        why: `Safe melodic option (relative: ${getScaleName(relativeMinor, 'minorPent')}).`,
        priority: 'secondary',
      },
    ],
    perChord: chords.map((chord) => ({
      chordLabel: getChordDisplayLabel(chord.root, chord.chordType),
      scales: getChordScaleSuggestions(progressionKey, chord.root, chord.chordType),
    })),
  };
};
