import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { NoteName, ScaleType, Position, Settings, RunNote } from '../types';
import {
  generateBoxRun,
  generateDiagonalRun,
  generateFullNeckRun,
} from '../utils/musicLogic';
import VerticalScaleFretboard from './VerticalScaleFretboard';

type RunType = 'box' | 'diagonal' | 'fullNeck';
type Direction = 'Ascending' | 'Descending' | 'Up & Down';

const RUN_TYPES: { id: RunType; label: string; desc: string }[] = [
  { id: 'box',      label: 'Position Box', desc: 'Stay within current box' },
  { id: 'diagonal', label: 'Diagonal',     desc: '3-per-string across neck' },
  { id: 'fullNeck', label: 'Full Neck',    desc: 'Every note, string by string' },
];

interface ScaleRunViewProps {
  root: NoteName;
  scaleType: ScaleType;
  position: Position;
  settings: Settings;
}

const ScaleRunView: React.FC<ScaleRunViewProps> = ({ root, scaleType, position, settings }) => {
  const [runType, setRunType] = useState<RunType>('diagonal');
  const [direction, setDirection] = useState<Direction>('Ascending');
  const [activeRun, setActiveRun] = useState<RunNote[] | null>(null);

  const handleGenerate = () => {
    let notes: RunNote[];
    if (runType === 'box') notes = generateBoxRun(root, scaleType, position);
    else if (runType === 'diagonal') notes = generateDiagonalRun(root, scaleType);
    else notes = generateFullNeckRun(root, scaleType);
    setActiveRun(notes);
  };

  const fretboardRun = useMemo<RunNote[] | undefined>(() => {
    if (!activeRun) return undefined;

    const playSeq = direction === 'Descending' ? [...activeRun].reverse() : activeRun;
    if (playSeq.length === 0) return [];

    // Assign finger numbers (1=index, 2=middle, 3=ring, 4=pinky).
    // anchorFret = where the index finger sits in the current hand position.
    // A hand shift is detected when consecutive notes on the same string jump
    // more than 2 frets — the anchor resets to the new fret.
    let anchorFret = playSeq[0].fret;
    const lastFretOnString: Record<number, number> = {};

    return playSeq.map(note => {
      const prevFret = lastFretOnString[note.stringIndex];
      if (prevFret !== undefined && Math.abs(note.fret - prevFret) > 2) {
        anchorFret = note.fret;
      }
      const finger = Math.max(1, Math.min(4, note.fret - anchorFret + 1));
      lastFretOnString[note.stringIndex] = note.fret;
      return { ...note, sequence: finger };
    });
  }, [activeRun, direction]);

  return (
    <div className="w-full space-y-4">

      {/* Controls bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Run type */}
          <div className="flex-1 min-w-[200px]">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Run Type</p>
            <div className="flex gap-1.5">
              {RUN_TYPES.map(rt => (
                <button
                  key={rt.id}
                  onClick={() => setRunType(rt.id)}
                  className={clsx(
                    'flex-1 flex flex-col items-center p-2 rounded-lg border text-center transition-colors',
                    runType === rt.id
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700'
                  )}
                >
                  <span className="text-[10px] font-bold leading-tight">{rt.label}</span>
                  <span className={clsx('text-[9px] mt-0.5 leading-tight', runType === rt.id ? 'text-violet-200' : 'text-slate-400 dark:text-slate-500')}>
                    {rt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div className="flex-1 min-w-[200px]">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Direction</p>
            <div className="flex gap-1.5">
              {(['Ascending', 'Descending', 'Up & Down'] as const).map(dir => (
                <button
                  key={dir}
                  onClick={() => setDirection(dir)}
                  className={clsx(
                    'flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors',
                    direction === dir
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700'
                  )}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            className="py-2.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] text-sm whitespace-nowrap"
          >
            Generate Run
          </button>

        </div>
      </div>

      {/* Fretboard */}
      <div className="flex justify-center w-full">
        <VerticalScaleFretboard
          root={root}
          scaleType={scaleType}
          position="Full Neck"
          settings={settings}
          hideScaleNotes={true}
          sequenceNotes={fretboardRun}
        />
      </div>

    </div>
  );
};

export default ScaleRunView;
