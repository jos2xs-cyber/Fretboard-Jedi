import React, { useMemo } from 'react';
import { NoteName, ScaleType, Position, Settings, RunNote } from '../types';
import { POSITION_COLORS, POSITION_NAMES } from '../constants';
import { generateFretboard } from '../utils/musicLogic';
import clsx from 'clsx';

const NOTE_COLORS: Record<string, string> = {
  A: '#ef4444',
  'A#': '#f97316',
  B: '#eab308',
  C: '#84cc16',
  'C#': '#22c55e',
  D: '#14b8a6',
  'D#': '#06b6d4',
  E: '#3b82f6',
  F: '#6366f1',
  'F#': '#8b5cf6',
  G: '#d946ef',
  'G#': '#ec4899',
};

const STRING_LABELS = ['6th', '5th', '4th', '3rd', '2nd', '1st'];

interface VerticalScaleFretboardProps {
  root: NoteName;
  scaleType: ScaleType;
  position: Position;
  settings: Settings;
  showAllNotes?: boolean;
  hideScaleNotes?: boolean;
  activeStringFilter?: number | null;
  onStringFilterChange?: (idx: number | null) => void;
  activeNoteFilter?: NoteName | null;
  onNoteFilterChange?: (note: NoteName | null) => void;
  sequenceNotes?: RunNote[];
}

const VerticalScaleFretboard: React.FC<VerticalScaleFretboardProps> = ({
  root,
  scaleType,
  position,
  settings,
  showAllNotes = false,
  hideScaleNotes = false,
  activeStringFilter = null,
  onStringFilterChange,
  activeNoteFilter = null,
  onNoteFilterChange,
  sequenceNotes,
}) => {
  // When showing all notes, force Full Neck so every chromatic note gets opacity=1
  const effectivePosition: Position = showAllNotes ? 'Full Neck' : position;

  const allNotes = useMemo(
    () => generateFretboard(root, scaleType, effectivePosition, 'Scale', showAllNotes),
    [root, scaleType, effectivePosition, showAllNotes]
  );

  const activeNotes = useMemo(() => allNotes.filter(n => n.opacity >= 0.5), [allNotes]);

  const isFullNeck = effectivePosition === 'Full Neck';

  // Determine visible fret window (expand to include any active sequence run)
  const { minFret, maxFret } = useMemo(() => {
    if (showAllNotes) return { minFret: 0, maxFret: 24 };
    if (isFullNeck && !sequenceNotes?.length) return { minFret: 0, maxFret: 18 };
    const frets = activeNotes.filter(n => n.fret > 0).map(n => n.fret);
    const seqFrets = sequenceNotes?.filter(n => n.fret > 0).map(n => n.fret) ?? [];
    const allFrets = [...frets, ...seqFrets];
    if (allFrets.length === 0) return { minFret: 0, maxFret: 7 };
    return {
      minFret: Math.max(0, Math.min(...allFrets) - 1),
      maxFret: Math.min(24, Math.max(...allFrets) + 1),
    };
  }, [activeNotes, isFullNeck, showAllNotes, sequenceNotes]);

  const fretHeight = 46;
  const stringSpacing = 48;
  const nutHeight = 8;
  const labelWidth = showAllNotes ? 0 : 92;
  const fretNumberWidth = 26;
  const leftRailWidth = labelWidth + fretNumberWidth;
  const fretboardWidth = stringSpacing * 5 + 40;
  const fretCount = maxFret - minFret;
  const totalHeight = fretCount * fretHeight + nutHeight;

  // Position labels for full-neck scale pattern view (not shown in all-notes mode)
  const positionLabels = useMemo(() => {
    if (!isFullNeck || showAllNotes) return [];
    const posMap: Record<number, number[]> = {};
    activeNotes.forEach(n => {
      if (n.fret > 0 && n.positionIndex) {
        if (!posMap[n.positionIndex]) posMap[n.positionIndex] = [];
        posMap[n.positionIndex].push(n.fret);
      }
    });
    return Object.entries(posMap).map(([pos, frets]) => ({
      posIndex: Number(pos) as 1 | 2 | 3 | 4 | 5,
      name: POSITION_NAMES[Number(pos) as 1 | 2 | 3 | 4 | 5],
      midFret: Math.round(frets.reduce((a, b) => a + b, 0) / frets.length),
      color: POSITION_COLORS[Number(pos) as 1 | 2 | 3 | 4 | 5],
    }));
  }, [activeNotes, isFullNeck, showAllNotes]);

  const visibleNotes = activeNotes.filter(n =>
    n.fret >= minFret &&
    n.fret <= maxFret &&
    (activeStringFilter == null || n.stringIndex === activeStringFilter)
  );

  // Open scale notes — only those active in the current position (opacity >= 0.5).
  // This means ○ markers only appear when the current box actually includes fret 0.
  const openNotes = activeNotes.filter(n => n.fret === 0);

  const SINGLE_INLAY_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
  const DOUBLE_INLAY_FRETS = [12, 24];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col w-fit mx-auto overflow-x-auto">

      {/* String filter buttons (All Notes mode only) */}
      {showAllNotes && (
        <div
          className="flex mb-2"
          style={{ paddingLeft: leftRailWidth + fretNumberWidth }}
        >
          {STRING_LABELS.map((label, stringIdx) => {
            const isActive = activeStringFilter === stringIdx;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onStringFilterChange?.(isActive ? null : stringIdx)}
                style={{ width: stringSpacing, marginLeft: stringIdx === 0 ? 20 - stringSpacing / 2 : 0 }}
                className={clsx(
                  'text-[10px] font-bold border rounded py-0.5 transition-colors',
                  isActive
                    ? 'text-white bg-violet-600 border-violet-600'
                    : 'text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-900/85 border-slate-300 dark:border-slate-600 hover:bg-violet-50 dark:hover:bg-violet-900/25'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Open string indicators — "Open" label + ○ per string column above the nut */}
      {!hideScaleNotes && openNotes.length > 0 && (
        <div className="flex items-center mb-5">
          {/* "Open" label — occupies the same width as the left rail + string offset */}
          <div
            className="flex-none flex items-center justify-end pr-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
            style={{ width: leftRailWidth + 20 - stringSpacing / 2 }}
          >
            Open
          </div>
          {/* ○ per string — transparent placeholder keeps spacing for strings not in scale */}
          {Array.from({ length: 6 }).map((_, stringIdx) => {
            const n = openNotes.find(on => on.stringIndex === stringIdx);
            const color = n
              ? showAllNotes
                ? NOTE_COLORS[n.note] ?? '#64748b'
                : (POSITION_COLORS[isFullNeck ? n.positionIndex as 1|2|3|4|5 : position as 1|2|3|4|5] || POSITION_COLORS[1])
              : undefined;
            return (
              <div
                key={stringIdx}
                className="flex-none flex items-center justify-center font-bold text-base"
                style={{ width: stringSpacing, color: color ?? 'transparent' }}
              >
                {n ? '○' : '·'}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex">
        {/* Left rail: position labels + fret numbers */}
        <div className="relative" style={{ width: leftRailWidth, height: totalHeight }}>
          {positionLabels.map(label => {
            const top = nutHeight + (label.midFret - minFret) * fretHeight - 8;
            if (top < 0 || top > totalHeight) return null;
            return (
              <div
                key={`pos-${label.posIndex}`}
                className="absolute flex items-center gap-1 text-xs whitespace-nowrap"
                style={{ top, right: fretNumberWidth + 8 }}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: label.color }} />
                <span className="text-slate-600 dark:text-slate-400 font-medium">{label.name}</span>
              </div>
            );
          })}

          {Array.from({ length: fretCount }).map((_, i) => {
            const fretNum = minFret + i + 1;
            return (
              <div
                key={`fretnum-${fretNum}`}
                className="absolute text-xs text-slate-600 dark:text-slate-300 font-mono font-bold z-20 bg-white/80 dark:bg-slate-900/70 rounded px-1"
                style={{
                  top: nutHeight + (fretNum - minFret) * fretHeight - fretHeight / 2 - 6,
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
          style={{ width: fretboardWidth, height: totalHeight }}
        >
          {/* Nut */}
          {minFret === 0 && (
            <div
              className="absolute left-0 right-0 top-0 bg-slate-300 dark:bg-slate-500 border-b-4 border-slate-500 dark:border-slate-300"
              style={{ height: nutHeight }}
            />
          )}

          {/* Fret lines */}
          {Array.from({ length: fretCount + 1 }).map((_, i) => (
            <div
              key={`fretline-${i}`}
              className="absolute left-0 right-0 border-b border-slate-400 dark:border-slate-500"
              style={{ top: nutHeight + i * fretHeight }}
            />
          ))}

          {/* Strings (vertical) */}
          {Array.from({ length: 6 }).map((_, stringIdx) => (
            <div
              key={`string-${stringIdx}`}
              className={clsx(
                'absolute top-0 bottom-0 transition-opacity',
                activeStringFilter !== null && activeStringFilter !== stringIdx ? 'opacity-20' : ''
              )}
              style={{
                left: 20 + stringIdx * stringSpacing,
                width: 1 + (5 - stringIdx) * 0.3,
                backgroundColor: '#94a3b8',
              }}
            />
          ))}

          {/* Single inlay dots */}
          {SINGLE_INLAY_FRETS.filter(f => f > minFret && f <= maxFret).map(fret => (
            <div
              key={`inlay-${fret}`}
              className="absolute w-3 h-3 rounded-full bg-black/20"
              style={{
                top: nutHeight + (fret - minFret) * fretHeight - fretHeight / 2 - 6,
                left: fretboardWidth / 2 - 6,
              }}
            />
          ))}

          {/* Double inlay dots at 12 and 24 */}
          {DOUBLE_INLAY_FRETS.filter(f => f > minFret && f <= maxFret).map(fret => (
            <React.Fragment key={`double-${fret}`}>
              <div
                className="absolute w-3 h-3 rounded-full bg-black/20"
                style={{
                  top: nutHeight + (fret - minFret) * fretHeight - fretHeight / 2 - 6,
                  left: fretboardWidth / 2 - 20,
                }}
              />
              <div
                className="absolute w-3 h-3 rounded-full bg-black/20"
                style={{
                  top: nutHeight + (fret - minFret) * fretHeight - fretHeight / 2 - 6,
                  left: fretboardWidth / 2 + 8,
                }}
              />
            </React.Fragment>
          ))}

          {/* Notes */}
          {!hideScaleNotes && visibleNotes.map((note, idx) => {
            const x = 20 + note.stringIndex * stringSpacing;
            const y = note.fret === 0
              ? nutHeight / 2
              : nutHeight + (note.fret - minFret) * fretHeight - fretHeight / 2;

            const color = showAllNotes
              ? NOTE_COLORS[note.note] ?? '#64748b'
              : (POSITION_COLORS[isFullNeck ? note.positionIndex as 1|2|3|4|5 : position as 1|2|3|4|5] || POSITION_COLORS[1]);

            const isRoot = note.isRoot && !isFullNeck && !showAllNotes;
            const size = isRoot ? 36 : 32;
            const half = size / 2;
            const isNoteFiltered = showAllNotes && activeNoteFilter !== null && note.note !== activeNoteFilter;
            const isActiveFiltered = showAllNotes && activeNoteFilter === note.note;
            const dotOpacity = isNoteFiltered ? 0.15 : note.opacity;

            return (
              <div
                key={`note-${idx}`}
                onClick={showAllNotes ? () => onNoteFilterChange?.(activeNoteFilter === note.note ? null : note.note) : undefined}
                className={clsx(
                  'absolute rounded-full flex items-center justify-center font-bold text-white shadow-md z-10',
                  isRoot && 'ring-2 ring-white',
                  showAllNotes ? 'cursor-pointer' : 'cursor-default',
                  isActiveFiltered && 'ring-2 ring-white scale-110 z-20'
                )}
                style={{
                  width: size,
                  height: size,
                  left: x - half,
                  top: y - half,
                  backgroundColor: color,
                  fontSize: settings.showNoteNames ? 10 : undefined,
                  opacity: dotOpacity,
                }}
              >
                {settings.showNoteNames && note.note}
              </div>
            );
          })}

          {/* Sequence run overlay — amber numbered badges showing playing order */}
          {sequenceNotes && sequenceNotes
            .filter(rn => rn.fret >= minFret && rn.fret <= maxFret)
            .map(rn => {
              const x = 20 + rn.stringIndex * stringSpacing;
              const y = rn.fret === 0
                ? nutHeight / 2
                : nutHeight + (rn.fret - minFret) * fretHeight - fretHeight / 2;
              const size = 26;
              const half = size / 2;
              return (
                <div
                  key={`seq-${rn.sequence}`}
                  className="absolute rounded-full flex items-center justify-center font-bold text-slate-900 shadow-lg z-20 ring-2 ring-white/70"
                  style={{
                    width: size,
                    height: size,
                    left: x - half,
                    top: y - half,
                    backgroundColor: '#fbbf24',
                    fontSize: rn.sequence > 9 ? 8 : 10,
                  }}
                >
                  {rn.sequence}
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
};

export default VerticalScaleFretboard;
