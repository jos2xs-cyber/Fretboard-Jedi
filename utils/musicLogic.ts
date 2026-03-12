import { NOTES, SCALES, CHORDS, STRING_TUNING_INDICES } from '../constants';
import {
  FretboardNote,
  ScaleType,
  ChordType,
  NoteName,
  Position,
  Mode,
  KeyMode,
  ProgressionScaleSuggestions,
  SoloScaleSuggestion,
  RunNote,
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
  mode: Mode,
  showAllNotes = false
): FretboardNote[] => {
  // Select data source based on mode
  const definition = mode === 'Scale' ? SCALES[type as ScaleType] : CHORDS[type as ChordType];
  const notes: FretboardNote[] = [];
  
  // Find where Position 1 starts (Root on Low E)
  const p1Start = getPosition1StartFret(root);

  // 5 box ranges anchored to the root on Low E (Position 1 = root box, ascending up the neck).
  // Each position uses only its single base range — no octave copies — so filtering shows
  // one clean compact box. Octave copies are only used for Full Neck position coloring.
  const BOX_OFFSETS = [
    { min: -1, max: 3 },  // Box 1 (root-anchored)
    { min: 2,  max: 5 },  // Box 2
    { min: 4,  max: 8 },  // Box 3
    { min: 7,  max: 10 }, // Box 4
    { min: 9,  max: 13 }, // Box 5
  ];
  // Root-anchored box ranges — Box 1 always starts at the root on Low E.
  const boxRanges = BOX_OFFSETS.map(o => ({ min: p1Start + o.min, max: p1Start + o.max }));

  // All octave copies of a position that land on the physical neck (frets 0–24).
  // Used for both position filtering and Full Neck coloring.
  const getOctaveCopies = (pos: number) => {
    const base = boxRanges[pos - 1];
    return [base, { min: base.min + 12, max: base.max + 12 }, { min: base.min - 12, max: base.max - 12 }];
  };

  // Copies visible on the neck — used when a specific box is selected so both the
  // root position AND its octave repeat(s) light up at full opacity.
  const getVisibleRanges = (pos: number) =>
    getOctaveCopies(pos).filter(r => r.max >= 0 && r.min <= 24);

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    for (let fret = 0; fret <= 24; fret++) {
      const note = getNoteAtFret(stringIdx, fret);
      const interval = getIntervalFromRoot(root, note);

      const isCorrectNote = showAllNotes ? true : definition.intervals.includes(interval);
      const isRoot = interval === 0;

      if (!isCorrectNote) continue;

      // Assign box color using all octave copies (so Full Neck shows color across whole neck)
      let posIndex = 0;
      for (let p = 1; p <= 5; p++) {
        if (getOctaveCopies(p).some(r => fret >= r.min && fret <= r.max)) {
          posIndex = p;
          break;
        }
      }
      if (posIndex === 0) posIndex = 1;

      // Visibility logic
      let opacity = 0.2;
      if (currentPosition === 'Full Neck') {
        opacity = 1;
      } else {
        // Show all octave copies of this box that land on the neck
        const inRange = getVisibleRanges(Number(currentPosition)).some(
          r => fret >= r.min && fret <= r.max
        );
        if (inRange) {
          opacity = 1;
          posIndex = Number(currentPosition);
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

// ─── Scale Run Generators ────────────────────────────────────────────────────

/** Plays current CAGED position string-by-string, low E → high e */
export const generateBoxRun = (
  root: NoteName,
  scaleType: ScaleType,
  position: Position,
): RunNote[] => {
  const notes = generateFretboard(root, scaleType, position, 'Scale');
  const active = notes.filter(n => n.opacity >= 0.5);
  active.sort((a, b) => {
    if (a.stringIndex !== b.stringIndex) return a.stringIndex - b.stringIndex;
    return a.fret - b.fret;
  });
  return active.map((n, i) => ({
    stringIndex: n.stringIndex,
    fret: n.fret,
    note: n.note,
    interval: n.interval,
    sequence: i + 1,
  }));
};

/**
 * 3-note-per-string (2 for pentatonic) diagonal run starting at Position 1.
 * Each string advances the fret window forward so the pattern travels diagonally up the neck.
 */
export const generateDiagonalRun = (
  root: NoteName,
  scaleType: ScaleType,
): RunNote[] => {
  const scale = SCALES[scaleType];
  const p1Start = getPosition1StartFret(root);
  const runNotes: RunNote[] = [];
  let seq = 1;
  const notesPerString = scale.intervals.length <= 5 ? 2 : 3;
  let windowFret = Math.max(0, p1Start - 1);

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    const onString: { fret: number; note: NoteName; interval: number }[] = [];
    for (let fret = 0; fret <= 24; fret++) {
      const n = getNoteAtFret(stringIdx, fret);
      const interval = getIntervalFromRoot(root, n);
      if (scale.intervals.includes(interval)) {
        onString.push({ fret, note: n, interval });
      }
    }
    const startIdx = onString.findIndex(n => n.fret >= windowFret);
    if (startIdx === -1) continue;
    const slice = onString.slice(startIdx, startIdx + notesPerString);
    if (slice.length === 0) continue;
    slice.forEach(n => {
      runNotes.push({ stringIndex: stringIdx, fret: n.fret, note: n.note, interval: n.interval, sequence: seq++ });
    });
    // Advance window to last note of this slice to enforce the diagonal
    windowFret = slice[slice.length - 1].fret;
  }
  return runNotes;
};

const STRING_BASE_PITCH = [0, 5, 10, 15, 19, 24] as const; // semitones above open Low E

/** Full neck sweep: all scale notes on every string from fret 0–22, string by string (Low E → high e) */
export const generateFullNeckRun = (
  root: NoteName,
  scaleType: ScaleType,
): RunNote[] => {
  const scale = SCALES[scaleType];
  const runNotes: RunNote[] = [];
  let seq = 1;

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    for (let fret = 0; fret <= 22; fret++) {
      const note = getNoteAtFret(stringIdx, fret);
      const interval = getIntervalFromRoot(root, note);
      if (scale.intervals.includes(interval)) {
        runNotes.push({ stringIndex: stringIdx, fret, note, interval, sequence: seq++ });
      }
    }
  }
  return runNotes;
};

/** Convert a RunNote sequence to guitar tab text */
export const getRunTabContent = (
  runNotes: RunNote[],
  direction: 'Ascending' | 'Descending' | 'Up & Down',
): string => {
  if (runNotes.length === 0) return '';
  let sequence = [...runNotes];
  if (direction === 'Descending') sequence.reverse();
  else if (direction === 'Up & Down') sequence = [...sequence, ...[...sequence].reverse().slice(1, -1)];

  const lines: string[][] = [['e', '|'], ['B', '|'], ['G', '|'], ['D', '|'], ['A', '|'], ['E', '|']];
  sequence.forEach(note => {
    const fretStr = note.fret.toString();
    const lineIdx = 5 - note.stringIndex;
    lines.forEach((line, idx) => {
      if (idx === lineIdx) line.push(fretStr + '-');
      else line.push('-'.repeat(fretStr.length + 1));
    });
  });
  lines.forEach(line => line.push('|'));
  return lines.map(line => line.join('')).join('\n');
};

// ─────────────────────────────────────────────────────────────────────────────

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

const getRelativeMajor = (minorKey: NoteName): NoteName => {
  const minorIdx = getNoteIndex(minorKey);
  return NOTES[(minorIdx + 3) % 12];
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
  chordType: ChordType,
  progressionMode: KeyMode
): SoloScaleSuggestion[] => {
  const keyCenterScaleKind = progressionMode === 'Major' ? 'major' : 'naturalMinor';

  if (chordType === ChordType.MAJOR || chordType === ChordType.MAJOR_7) {
    return [
      {
        name: getScaleName(chordRoot, 'majorPent'),
        why: 'Strong chord-tone targeting with simple phrasing.',
        priority: 'primary',
      },
      {
        name: getScaleName(progressionKey, keyCenterScaleKind),
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
        name: getScaleName(progressionKey, keyCenterScaleKind),
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
      name: getScaleName(progressionKey, keyCenterScaleKind),
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
  chords: Array<{ root: NoteName; chordType: ChordType }>,
  progressionMode: KeyMode
): ProgressionScaleSuggestions => {
  const relativeMinor = getRelativeMinor(progressionKey);
  const relativeMajor = getRelativeMajor(progressionKey);
  const isMajor = progressionMode === 'Major';

  return {
    global: [
      {
        name: isMajor ? getScaleName(progressionKey, 'major') : getScaleName(progressionKey, 'naturalMinor'),
        why: isMajor
          ? 'Primary all-purpose scale for this major-key progression.'
          : 'Primary all-purpose scale for this natural-minor progression.',
        priority: 'primary',
      },
      {
        name: isMajor ? getScaleName(progressionKey, 'majorPent') : getScaleName(progressionKey, 'minorPent'),
        why: isMajor
          ? `Safe melodic option (relative: ${getScaleName(relativeMinor, 'minorPent')}).`
          : `Safe melodic option (relative: ${getScaleName(relativeMajor, 'majorPent')}).`,
        priority: 'secondary',
      },
    ],
    perChord: chords.map((chord) => ({
      chordLabel: getChordDisplayLabel(chord.root, chord.chordType),
      scales: getChordScaleSuggestions(progressionKey, chord.root, chord.chordType, progressionMode),
    })),
  };
};
