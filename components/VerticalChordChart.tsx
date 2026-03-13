import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NoteName, ChordType } from '../types';
import { NOTES, CHORDS, POSITION_COLORS, POSITION_NAMES, STRING_TUNING_INDICES } from '../constants';
import clsx from 'clsx';

interface SelectedChord {
  id: number;
  root: NoteName;
  chordType: ChordType;
}

interface VerticalChordChartProps {
  chords: SelectedChord[];
  noteDisplayMode: 'shape' | 'all';
  cagedScope: 'core' | 'full';
  activeChordId?: number | null;
  settings: {
    showNoteNames: boolean;
  };
}

// Get note at a specific string and fret
const getNoteAtFret = (stringIndex: number, fret: number): NoteName => {
  const openNoteIndex = STRING_TUNING_INDICES[stringIndex];
  const currentNoteIndex = (openNoteIndex + fret) % 12;
  return NOTES[currentNoteIndex];
};

// Get interval from root
const getIntervalFromRoot = (root: NoteName, note: NoteName): number => {
  const rootIdx = NOTES.indexOf(root);
  const noteIdx = NOTES.indexOf(note);
  return (noteIdx - rootIdx + 12) % 12;
};

// Get Position 1 start fret for a root
const getPosition1StartFret = (root: NoteName): number => {
  const rootIdx = NOTES.indexOf(root);
  const lowEIdx = 7; // E
  return (rootIdx - lowEIdx + 12) % 12;
};

// CAGED position fret offsets relative to P1 root
const CAGED_OFFSETS = [
  { pos: 1, name: 'E', minOffset: -1, maxOffset: 3 },
  { pos: 2, name: 'D', minOffset: 2, maxOffset: 5 },
  { pos: 3, name: 'C', minOffset: 4, maxOffset: 8 },
  { pos: 4, name: 'A', minOffset: 7, maxOffset: 10 },
  { pos: 5, name: 'G', minOffset: 9, maxOffset: 13 },
];

interface ChordNote {
  stringIndex: number;
  fret: number;
  note: NoteName;
  interval: number;
  isRoot: boolean;
  positionIndex: number;
}

interface ShapeRange {
  pos: 1 | 2 | 3 | 4 | 5;
  label: string;
  minFret: number;
  maxFret: number;
  centerFret: number;
  isOpenSupplement?: boolean;
}

const MINOR_FAMILY_CHORDS = new Set<ChordType>([
  ChordType.MINOR,
  ChordType.MINOR_7,
  ChordType.MINOR_7_FLAT_5,
  ChordType.DIMINISHED,
]);

const MAJOR_FAMILY_CHORDS = new Set<ChordType>([
  ChordType.MAJOR,
  ChordType.MAJOR_7,
  ChordType.DOMINANT_7,
]);

const getRootFretOnString = (root: NoteName, openStringIndex: number): number => {
  const rootIdx = NOTES.indexOf(root);
  return (rootIdx - openStringIndex + 12) % 12;
};

const clampAndSortRanges = (raw: ShapeRange[], maxFret: number): ShapeRange[] => {
  return raw
    .map((range) => ({
      ...range,
      minFret: Math.max(0, range.minFret),
      maxFret: Math.min(maxFret, range.maxFret),
      centerFret: Math.max(0, Math.min(maxFret, range.centerFret)),
    }))
    .filter((range) => range.minFret <= range.maxFret)
    .sort((a, b) => a.centerFret - b.centerFret);
};

const normalizeShapeRanges = (raw: ShapeRange[], maxFret: number): ShapeRange[] => {
  const sortedRanges = clampAndSortRanges(raw, maxFret);

  for (let i = 0; i < sortedRanges.length - 1; i++) {
    const current = sortedRanges[i];
    const next = sortedRanges[i + 1];
    const boundary = Math.floor((current.centerFret + next.centerFret) / 2);
    current.maxFret = Math.min(current.maxFret, boundary);
    next.minFret = Math.max(next.minFret, boundary + 1);
  }

  return sortedRanges
    .filter((range) => range.minFret <= range.maxFret)
    .map((range) => ({
      ...range,
      centerFret: Math.floor((range.minFret + range.maxFret) / 2),
    }));
};

const ensureOpenWindow = (ranges: ShapeRange[], openWindow: ShapeRange, maxFret: number): ShapeRange[] => {
  const hasOpenCoverage = ranges.some((range) => range.minFret <= 0 && range.maxFret >= 0);
  if (hasOpenCoverage) return ranges;
  return normalizeShapeRanges([...ranges, { ...openWindow, isOpenSupplement: true }], maxFret);
};

const appendOctaveRepeats = (ranges: ShapeRange[], maxFret: number): ShapeRange[] => {
  if (ranges.length === 0) return ranges;

  const baseRanges = ranges.filter((range) => !range.isOpenSupplement);
  const additions: ShapeRange[] = [];

  for (const base of baseRanges) {
    for (let shift = 12; base.minFret + shift <= maxFret; shift += 12) {
      const repeated: ShapeRange = {
        ...base,
        minFret: base.minFret + shift,
        maxFret: base.maxFret + shift,
        centerFret: base.centerFret + shift,
      };

      const duplicateInOriginal = ranges.some(
        (range) =>
          range.label === repeated.label &&
          range.minFret === repeated.minFret &&
          range.maxFret === repeated.maxFret
      );
      const duplicateInAdditions = additions.some(
        (range) =>
          range.label === repeated.label &&
          range.minFret === repeated.minFret &&
          range.maxFret === repeated.maxFret
      );
      if (!duplicateInOriginal && !duplicateInAdditions) {
        additions.push(repeated);
      }
    }
  }

  return normalizeShapeRanges([...ranges, ...additions], maxFret);
};

const getMinorShapeRanges = (root: NoteName, maxFret: number): ShapeRange[] => {
  const aRoot = getRootFretOnString(root, 0); // A string
  const eRoot = getRootFretOnString(root, 7); // low E string
  const dRoot = getRootFretOnString(root, 5); // D string

  const raw: ShapeRange[] = [
    { pos: 1, label: 'A-Shape', minFret: aRoot, maxFret: aRoot + 3, centerFret: aRoot + 1 },
    { pos: 5, label: 'E-Shape', minFret: eRoot, maxFret: eRoot + 3, centerFret: eRoot + 1 },
    { pos: 4, label: 'D-Shape', minFret: dRoot + 1, maxFret: dRoot + 4, centerFret: dRoot + 2 },
  ];

  const withOpenWindow = ensureOpenWindow(
    normalizeShapeRanges(raw, maxFret),
    { pos: 5, label: 'E-Shape', minFret: 0, maxFret: 3, centerFret: 1 },
    maxFret
  );

  return appendOctaveRepeats(withOpenWindow, maxFret);
};

const getMajorShapeRanges = (root: NoteName, maxFret: number): ShapeRange[] => {
  const aRoot = getRootFretOnString(root, 0); // A string
  const eRoot = getRootFretOnString(root, 7); // low E string
  const dRoot = getRootFretOnString(root, 5); // D string

  const raw: ShapeRange[] = [
    { pos: 4, label: 'D/C Shape', minFret: dRoot + 2, maxFret: dRoot + 4, centerFret: dRoot + 3 },
    { pos: 1, label: 'A/G Shape', minFret: aRoot, maxFret: aRoot + 3, centerFret: aRoot + 1 },
    { pos: 5, label: 'E Shape', minFret: eRoot - 1, maxFret: eRoot + 2, centerFret: eRoot + 1 },
  ];

  const withOpenWindow = ensureOpenWindow(
    normalizeShapeRanges(raw, maxFret),
    { pos: 5, label: 'E Shape', minFret: 0, maxFret: 3, centerFret: 1 },
    maxFret
  );

  return appendOctaveRepeats(withOpenWindow, maxFret);
};

const getDefaultShapeRanges = (root: NoteName, maxFret: number): ShapeRange[] => {
  const p1Start = getPosition1StartFret(root);
  const octaveShifts = [-12, 0, 12, 24];
  const rawRanges = CAGED_OFFSETS.flatMap((offset) =>
    octaveShifts.map((shift) => {
      const minFret = p1Start + offset.minOffset + shift;
      const maxFretForShape = p1Start + offset.maxOffset + shift;
      return {
        pos: offset.pos as 1 | 2 | 3 | 4 | 5,
        label: POSITION_NAMES[offset.pos as 1 | 2 | 3 | 4 | 5],
        minFret,
        maxFret: maxFretForShape,
        centerFret: Math.floor((minFret + maxFretForShape) / 2),
      };
    })
  ).filter((range) => range.maxFret >= 0 && range.minFret <= maxFret);

  return normalizeShapeRanges(rawRanges, maxFret);
};

const getShapeRanges = (
  root: NoteName,
  chordType: ChordType,
  maxFret: number,
  cagedScope: 'core' | 'full'
): ShapeRange[] => {
  if (cagedScope === 'full') {
    return getDefaultShapeRanges(root, maxFret);
  }
  if (MAJOR_FAMILY_CHORDS.has(chordType)) {
    return getMajorShapeRanges(root, maxFret);
  }
  if (MINOR_FAMILY_CHORDS.has(chordType)) {
    return getMinorShapeRanges(root, maxFret);
  }
  return getDefaultShapeRanges(root, maxFret);
};

const getPositionIndexForFret = (fret: number, shapeRanges: ShapeRange[]): number => {
  const match = shapeRanges.find((range) => fret >= range.minFret && fret <= range.maxFret);
  return match?.pos ?? 0;
};

const getShapeRangeForFret = (fret: number, shapeRanges: ShapeRange[]): ShapeRange | undefined => {
  return shapeRanges.find((range) => fret >= range.minFret && fret <= range.maxFret);
};

const isStringAllowedForShape = (stringIndex: number, shapeLabel: string): boolean => {
  // stringIndex: 0=low E, 1=A, 2=D, 3=G, 4=B, 5=high E
  if (shapeLabel === 'A/G Shape' || shapeLabel === 'A-Shape') return stringIndex >= 1;
  if (shapeLabel === 'D/C Shape' || shapeLabel === 'D-Shape') return stringIndex >= 2;
  return true; // E-shape and defaults
};

const generateChordNotes = (
  root: NoteName,
  chordType: ChordType,
  noteDisplayMode: 'shape' | 'all' = 'shape',
  cagedScope: 'core' | 'full' = 'core',
  maxFret: number = 24
): ChordNote[] => {
  const definition = CHORDS[chordType];
  const notes: ChordNote[] = [];
  const shapeRanges = getShapeRanges(root, chordType, maxFret, cagedScope);
  const allowedIntervals = definition.intervals;

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    for (let fret = 0; fret <= maxFret; fret++) {
      const note = getNoteAtFret(stringIdx, fret);
      const interval = getIntervalFromRoot(root, note);

      if (!allowedIntervals.includes(interval)) continue;

      const shapeRange = getShapeRangeForFret(fret, shapeRanges);
      if (noteDisplayMode === 'shape') {
        if (!shapeRange) continue;
        if (!isStringAllowedForShape(stringIdx, shapeRange.label)) continue;
      }
      const posIndex = shapeRange?.pos ?? getPositionIndexForFret(fret, shapeRanges);

      notes.push({
        stringIndex: stringIdx,
        fret,
        note,
        interval,
        isRoot: interval === 0,
        positionIndex: posIndex,
      });
    }
  }

  if (noteDisplayMode === 'shape') {
    const best = new Map<string, ChordNote>();
    for (const n of notes) {
      const shapeRange = getShapeRangeForFret(n.fret, shapeRanges);
      const key = `${shapeRange?.label ?? ''}:${shapeRange?.minFret ?? 0}:${n.stringIndex}`;
      const existing = best.get(key);
      if (!existing || n.fret < existing.fret) best.set(key, n);
    }
    return Array.from(best.values());
  }

  return notes;
};

// Single vertical fretboard column
const FretboardColumn: React.FC<{
  chordId: number;
  root: NoteName;
  chordType: ChordType;
  noteDisplayMode: 'shape' | 'all';
  cagedScope: 'core' | 'full';
  showNoteNames: boolean;
  totalChords: number;
  isActive: boolean;
}> = ({ chordId, root, chordType, noteDisplayMode, cagedScope, showNoteNames, totalChords, isActive }) => {
  const maxFret = 24;
  const shapeRanges = useMemo(
    () => getShapeRanges(root, chordType, maxFret, cagedScope),
    [root, chordType, maxFret, cagedScope]
  );
  const notes = useMemo(
    () => generateChordNotes(root, chordType, noteDisplayMode, cagedScope, maxFret),
    [root, chordType, noteDisplayMode, cagedScope, maxFret]
  );
  const fretHeight = 36;
  const stringSpacing = totalChords >= 5 ? 36 : totalChords === 4 ? 42 : totalChords === 3 ? 36 : 32;
  const nutHeight = 8;
  const labelWidth = 98;
  const fretNumberWidth = 26;
  const leftRailWidth = labelWidth + fretNumberWidth;
  const fretboardWidth = stringSpacing * 5 + 40; // 6 strings

  // Calculate shape label positions
  const shapeLabels = shapeRanges.map((range) => ({
    pos: range.pos,
    name: range.label,
    fret: Math.max(1, Math.min(range.centerFret, maxFret - 1)),
    color: POSITION_COLORS[range.pos],
  }));

  // Get chord quality label
  const getChordLabel = () => {
    switch (chordType) {
      case ChordType.MAJOR:
        return `${root} Major`;
      case ChordType.MINOR:
        return `${root} minor`;
      case ChordType.DOMINANT_7:
        return `${root}7`;
      case ChordType.MAJOR_7:
        return `${root}maj7`;
      case ChordType.MINOR_7:
        return `${root}m7`;
      case ChordType.MINOR_7_FLAT_5:
        return `${root}m7b5`;
      case ChordType.DIMINISHED:
        return `${root}dim`;
      default:
        return `${root} ${CHORDS[chordType].name}`;
    }
  };

  return (
    <div
      className={clsx(
        "flex flex-col items-center rounded-lg p-2 transition-colors",
        isActive && "bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-400 dark:ring-violet-500"
      )}
      data-chord-id={chordId}
    >
      {/* Header */}
      <div className="mb-2 text-center">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Example: {getChordLabel()}
        </span>
      </div>

      <div className="flex">
        {/* Shape Labels (left side) */}
        <div className="relative" style={{ width: leftRailWidth, height: (maxFret + 1) * fretHeight + nutHeight }}>
          {shapeLabels.map((label, idx) => (
            <div
              key={`label-${label.pos}-${label.fret}-${idx}`}
              className="absolute flex items-center gap-1 text-xs whitespace-nowrap"
              style={{
                top: nutHeight + label.fret * fretHeight - 8,
                right: fretNumberWidth + 8,
              }}
            >
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: label.color }}
              />
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {label.name}
              </span>
            </div>
          ))}

          {/* Fret Numbers (left of neck) */}
          {Array.from({ length: maxFret }).map((_, i) => {
            const fretNum = i + 1;
            return (
              <div
                key={`left-fretnum-${fretNum}`}
                className="absolute text-xs text-slate-600 dark:text-slate-300 font-mono font-bold z-20 bg-white/80 dark:bg-slate-900/70 rounded px-1"
                style={{
                  top: nutHeight + fretNum * fretHeight - fretHeight / 2 - 6,
                  right: 2,
                }}
              >
                {fretNum}
              </div>
            );
          })}
        </div>

        {/* Fretboard */}
        <div
          className="relative bg-white border border-slate-300 dark:border-slate-600 rounded"
          style={{
            width: fretboardWidth,
            height: (maxFret + 1) * fretHeight + nutHeight,
          }}
        >
          {/* Nut */}
          <div
            className="absolute left-0 right-0 top-0 bg-slate-200 dark:bg-slate-500 border-b-2 border-slate-400 dark:border-slate-300"
            style={{ height: nutHeight }}
          />

          {/* Frets (horizontal lines) */}
          {Array.from({ length: maxFret + 1 }).map((_, fretNum) => (
            <div
              key={`fret-${fretNum}`}
              className="absolute left-0 right-0 border-b border-slate-400 dark:border-slate-500"
              style={{ top: nutHeight + fretNum * fretHeight }}
            />
          ))}

          {/* Strings (vertical lines) */}
          {Array.from({ length: 6 }).map((_, stringIdx) => (
            <div
              key={`string-${stringIdx}`}
              className="absolute top-0 bottom-0 bg-gradient-to-r from-slate-400 to-slate-500"
              style={{
                left: 20 + stringIdx * stringSpacing,
                width: 1 + (5 - stringIdx) * 0.3,
              }}
            />
          ))}

          {/* Inlay dots */}
          {[3, 5, 7, 9, 15, 17, 19, 21].map(fret => (
            <div
              key={`inlay-${fret}`}
              className="absolute w-3 h-3 rounded-full bg-black/55"
              style={{
                top: nutHeight + fret * fretHeight - fretHeight / 2 - 6,
                left: fretboardWidth / 2 - 6,
              }}
            />
          ))}
          {/* Double dots at 12 and 24 */}
          <div
            className="absolute w-3 h-3 rounded-full bg-black/55"
            style={{
              top: nutHeight + 12 * fretHeight - fretHeight / 2 - 6,
              left: fretboardWidth / 2 - 20,
            }}
          />
          <div
            className="absolute w-3 h-3 rounded-full bg-black/55"
            style={{
              top: nutHeight + 12 * fretHeight - fretHeight / 2 - 6,
              left: fretboardWidth / 2 + 8,
            }}
          />
          <div
            className="absolute w-3 h-3 rounded-full bg-black/55"
            style={{
              top: nutHeight + 24 * fretHeight - fretHeight / 2 - 6,
              left: fretboardWidth / 2 - 20,
            }}
          />
          <div
            className="absolute w-3 h-3 rounded-full bg-black/55"
            style={{
              top: nutHeight + 24 * fretHeight - fretHeight / 2 - 6,
              left: fretboardWidth / 2 + 8,
            }}
          />

          {/* Notes */}
          {notes.map((note, idx) => {
            const x = 20 + note.stringIndex * stringSpacing;
            const y = note.fret === 0
              ? nutHeight / 2
              : nutHeight + note.fret * fretHeight - fretHeight / 2;
            const color = POSITION_COLORS[note.positionIndex as 1|2|3|4|5];

            return (
              <div
                key={`note-${idx}`}
                className={clsx(
                  "absolute w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md",
                  note.isRoot && "ring-2 ring-white w-7 h-7"
                )}
                style={{
                  left: x - (note.isRoot ? 14 : 12),
                  top: y - (note.isRoot ? 14 : 12),
                  backgroundColor: color,
                }}
              >
                {showNoteNames && note.note}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const VerticalChordChart: React.FC<VerticalChordChartProps> = ({
  chords,
  noteDisplayMode,
  cagedScope,
  activeChordId = null,
  settings,
}) => {
  const [mobileIndex, setMobileIndex] = useState(0);

  // Keep mobile carousel in sync when practice mode advances the active chord
  useEffect(() => {
    if (activeChordId == null) return;
    const idx = chords.findIndex((c) => c.id === activeChordId);
    if (idx !== -1) setMobileIndex(idx);
  }, [activeChordId, chords]);

  // Clamp index if chords list shrinks
  useEffect(() => {
    setMobileIndex((prev) => Math.min(prev, Math.max(0, chords.length - 1)));
  }, [chords.length]);

  const activeChord = chords[mobileIndex];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">

      {/* ── Mobile carousel (hidden md+) ── */}
      <div className="md:hidden">
        {chords.length > 0 && activeChord && (
          <>
            <FretboardColumn
              key={activeChord.id}
              chordId={activeChord.id}
              root={activeChord.root}
              chordType={activeChord.chordType}
              noteDisplayMode={noteDisplayMode}
              cagedScope={cagedScope}
              showNoteNames={settings.showNoteNames}
              totalChords={1}
              isActive={activeChordId === activeChord.id}
            />

            {/* Prev / Next + dots */}
            {chords.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setMobileIndex((i) => Math.max(0, i - 1))}
                  disabled={mobileIndex === 0}
                  className="p-1.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Previous chord"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex gap-2">
                  {chords.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setMobileIndex(i)}
                      aria-label={`Go to chord ${i + 1}`}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i === mobileIndex
                          ? 'bg-violet-500'
                          : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setMobileIndex((i) => Math.min(chords.length - 1, i + 1))}
                  disabled={mobileIndex === chords.length - 1}
                  className="p-1.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Next chord"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Desktop: all chords side by side (hidden below md) ── */}
      <div className="hidden md:block overflow-x-auto">
        <div className="flex gap-6 justify-between w-full min-w-max">
          {chords.map((chord) => (
            <FretboardColumn
              key={chord.id}
              chordId={chord.id}
              root={chord.root}
              chordType={chord.chordType}
              noteDisplayMode={noteDisplayMode}
              cagedScope={cagedScope}
              showNoteNames={settings.showNoteNames}
              totalChords={chords.length}
              isActive={activeChordId === chord.id}
            />
          ))}
        </div>
      </div>

    </div>
  );
};

export default VerticalChordChart;
