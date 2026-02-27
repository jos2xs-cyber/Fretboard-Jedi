import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Info, ChevronDown, ChevronUp, Music, Layers, Triangle } from 'lucide-react';
import clsx from 'clsx';
import Fretboard from './components/Fretboard';
import TabGenerator from './components/TabGenerator';
import VerticalChordChart from './components/VerticalChordChart';
import TriadFretboard from './components/TriadFretboard';
import { NOTES, SCALES, CHORDS, POSITION_NAMES, POSITION_COLORS } from './constants';
import { NoteName, ScaleType, ChordType, Position, Settings, Mode, TriadQuality, StringGroup, KeyMode } from './types';
import { getScaleNotes, getScaleDegreeChords, getProgressionScaleSuggestions } from './utils/musicLogic';

interface SelectedChord {
  id: number;
  root: NoteName;
  chordType: ChordType;
}

interface ProgressionDegree {
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  forceType?: ChordType;
}

interface ProgressionPreset {
  id: string;
  label: string;
  degrees: ProgressionDegree[];
}

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;
const NATURAL_MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10] as const;

const MAJOR_DIATONIC_TRIAD_QUALITIES: ChordType[] = [
  ChordType.MAJOR,
  ChordType.MINOR,
  ChordType.MINOR,
  ChordType.MAJOR,
  ChordType.MAJOR,
  ChordType.MINOR,
  ChordType.DIMINISHED,
];

const MINOR_DIATONIC_TRIAD_QUALITIES: ChordType[] = [
  ChordType.MINOR,
  ChordType.DIMINISHED,
  ChordType.MAJOR,
  ChordType.MINOR,
  ChordType.MINOR,
  ChordType.MAJOR,
  ChordType.MAJOR,
];

const MAJOR_CHORD_PROGRESSIONS: ProgressionPreset[] = [
  { id: 'one-five-six-four', label: 'I-V-vi-IV', degrees: [{ degree: 1 }, { degree: 5 }, { degree: 6 }, { degree: 4 }] },
  { id: 'one-four-five', label: 'I-IV-V', degrees: [{ degree: 1 }, { degree: 4 }, { degree: 5 }] },
  { id: 'two-five-one', label: 'ii-V-I', degrees: [{ degree: 2 }, { degree: 5, forceType: ChordType.DOMINANT_7 }, { degree: 1 }] },
  { id: 'six-four-one-five', label: 'vi-IV-I-V', degrees: [{ degree: 6 }, { degree: 4 }, { degree: 1 }, { degree: 5 }] },
  { id: 'one-six-two-five', label: 'I-vi-ii-V', degrees: [{ degree: 1 }, { degree: 6 }, { degree: 2 }, { degree: 5, forceType: ChordType.DOMINANT_7 }] },
];

const MINOR_CHORD_PROGRESSIONS: ProgressionPreset[] = [
  { id: 'one-four-five-minor', label: 'i-iv-v', degrees: [{ degree: 1 }, { degree: 4 }, { degree: 5 }] },
  { id: 'one-six-three-seven', label: 'i-VI-III-VII', degrees: [{ degree: 1 }, { degree: 6 }, { degree: 3 }, { degree: 7 }] },
  { id: 'two-dim-five-one', label: 'iio-v-i', degrees: [{ degree: 2 }, { degree: 5 }, { degree: 1 }] },
  { id: 'one-five-six-four-minor', label: 'i-v-VI-iv', degrees: [{ degree: 1 }, { degree: 5 }, { degree: 6 }, { degree: 4 }] },
  { id: 'one-seven-six-seven', label: 'i-VII-VI-VII', degrees: [{ degree: 1 }, { degree: 7 }, { degree: 6 }, { degree: 7 }] },
];

export default function App() {
  // State
  const [mode, setMode] = useState<Mode>('Scale');
  const [root, setRoot] = useState<NoteName>('A');
  const [scaleType, setScaleType] = useState<ScaleType>(ScaleType.MINOR_PENTATONIC);
  const [selectedChords, setSelectedChords] = useState<SelectedChord[]>([
    { id: 1, root: 'C#', chordType: ChordType.MINOR },
    { id: 2, root: 'A', chordType: ChordType.MAJOR },
    { id: 3, root: 'E', chordType: ChordType.MAJOR },
  ]);
  const [triadsOnly, setTriadsOnly] = useState(false);
  const [triadQuality, setTriadQuality] = useState<TriadQuality>(TriadQuality.MAJOR);
  const [showIntervalLabels, setShowIntervalLabels] = useState(true);
  const [stringGroup, setStringGroup] = useState<StringGroup>('All');
  const [position, setPosition] = useState<Position>(1);
  const [settings, setSettings] = useState<Settings>({
    showNoteNames: true,
    showPositionLabels: true,
    showConnections: true,
    darkMode: true, // Default to dark as per request
  });
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [showScaleDegreeHelper, setShowScaleDegreeHelper] = useState(true);
  const [progressionKey, setProgressionKey] = useState<NoteName>('A');
  const [progressionMode, setProgressionMode] = useState<KeyMode>('Major');
  const [activeProgressionPresetId, setActiveProgressionPresetId] = useState<string | null>(null);

  // Ref for Fretboard export
  const fretboardRef = React.useRef<HTMLDivElement>(null);
  const setFretboardRef = (ref: React.RefObject<HTMLDivElement>) => {
      // @ts-ignore - assigning current purely for the TabGenerator to access
      fretboardRef.current = ref.current;
  };

  // Dark Mode Effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    setActiveProgressionPresetId(null);
  }, [progressionMode]);

  // Derived Data
  const triadDefinition = {
    name: `${triadQuality} Triad`,
    intervals: triadQuality === TriadQuality.MAJOR ? [0, 4, 7] : [0, 3, 7],
    description: triadQuality === TriadQuality.MAJOR
      ? "The fundamental happy chord. Root (R), Major 3rd (3), Perfect 5th (5)."
      : "The fundamental sad chord. Root (R), Minor 3rd (b3), Perfect 5th (5).",
    tip: "Practice finding triads on different string groups. The colors show interval function: Red=Root, Blue=3rd, Green=5th."
  };
  const activeChordType = selectedChords[0]?.chordType ?? ChordType.MAJOR;
  const currentDefinition = mode === 'Scale' ? SCALES[scaleType] : mode === 'Chord' ? CHORDS[activeChordType] : triadDefinition;
  const positionLabel = position === 'Full Neck' 
    ? 'All Positions' 
    : `${POSITION_NAMES[position]} (${position})`;
  const selectedScaleNotes = getScaleNotes(root, scaleType);
  const selectedScaleDegreeChords = getScaleDegreeChords(root, scaleType);
  const activeProgressions = progressionMode === 'Major' ? MAJOR_CHORD_PROGRESSIONS : MINOR_CHORD_PROGRESSIONS;
  const activeProgressionPreset = activeProgressions.find((preset) => preset.id === activeProgressionPresetId) ?? null;
  const progressionSuggestions = useMemo(
    () =>
      getProgressionScaleSuggestions(
        progressionKey,
        selectedChords.map((chord) => ({ root: chord.root, chordType: chord.chordType })),
        progressionMode
      ),
    [progressionKey, selectedChords, progressionMode]
  );

  const updateChordSelection = (id: number, field: 'root' | 'chordType', value: NoteName | ChordType) => {
    setActiveProgressionPresetId(null);
    setSelectedChords(prev =>
      prev.map(chord => (chord.id === id ? { ...chord, [field]: value } : chord))
    );
  };

  const addChordSelection = () => {
    setActiveProgressionPresetId(null);
    setSelectedChords(prev => {
      if (prev.length >= 4) return prev;
      const nextId = prev.length ? Math.max(...prev.map(ch => ch.id)) + 1 : 1;
      return [...prev, { id: nextId, root: 'A', chordType: ChordType.MAJOR }];
    });
  };

  const removeChordSelection = (id: number) => {
    setActiveProgressionPresetId(null);
    setSelectedChords(prev => (prev.length > 1 ? prev.filter(chord => chord.id !== id) : prev));
  };

  const applyProgressionPreset = (preset: ProgressionPreset) => {
    const scaleIntervals = progressionMode === 'Major' ? MAJOR_SCALE_INTERVALS : NATURAL_MINOR_INTERVALS;
    const diatonicQualities =
      progressionMode === 'Major' ? MAJOR_DIATONIC_TRIAD_QUALITIES : MINOR_DIATONIC_TRIAD_QUALITIES;
    const keyIndex = NOTES.indexOf(progressionKey);
    const nextChords: SelectedChord[] = preset.degrees.slice(0, 4).map((degreeData, index) => {
      const scaleInterval = scaleIntervals[degreeData.degree - 1];
      const rootNote = NOTES[(keyIndex + scaleInterval) % 12];
      const defaultChordType = diatonicQualities[degreeData.degree - 1];

      return {
        id: index + 1,
        root: rootNote,
        chordType: degreeData.forceType ?? defaultChordType,
      };
    });

    setSelectedChords(nextChords);
    setActiveProgressionPresetId(preset.id);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-violet-500/30">
      
      {/* HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Fretboard Jedi
              </h1>
              <p className="text-sm uppercase tracking-wider font-semibold opacity-70">
                Master the Neck
              </p>
            </div>
            <img
              src="/logo2.png"
              alt="Fretboard Jedi secondary logo"
              className="h-16 w-auto object-contain ml-3"
            />
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          >
            {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        
        {/* CONTROL PANEL */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6 space-y-6">
          
          {/* Mode Switcher */}
          <div className="flex justify-center pb-4 border-b border-slate-100 dark:border-slate-700/50">
             <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-full flex w-full max-w-lg">
                <button
                   onClick={() => setMode('Scale')}
                   className={clsx(
                       "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-bold transition-all duration-300",
                       mode === 'Scale'
                        ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm scale-100"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                   )}
                >
                   <Music size={16} /> Scales
                </button>
                <button
                   onClick={() => setMode('Chord')}
                   className={clsx(
                       "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-bold transition-all duration-300",
                       mode === 'Chord'
                        ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm scale-100"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                   )}
                >
                   <Layers size={16} /> Chords
                </button>
                <button
                   onClick={() => setMode('Triads')}
                   className={clsx(
                       "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-bold transition-all duration-300",
                       mode === 'Triads'
                        ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm scale-100"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                   )}
                >
                   <Triangle size={16} /> Triads
                </button>
             </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
            
            {/* Group 1: Definition Selection */}
            {mode === 'Chord' ? (
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Chords (up to 4)
                  </label>
                  <button
                    onClick={addChordSelection}
                    disabled={selectedChords.length >= 4}
                    className={clsx(
                      "text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors",
                      selectedChords.length >= 4
                        ? "border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                        : "border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    )}
                  >
                    + Add Chord
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-3 items-start">
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Progression Presets
                        </label>
                        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                          {(['Major', 'Minor'] as const).map((keyMode) => (
                            <button
                              key={keyMode}
                              onClick={() => setProgressionMode(keyMode)}
                              className={clsx(
                                "px-2.5 py-1 text-[11px] font-semibold rounded transition-colors",
                                progressionMode === keyMode
                                  ? "bg-violet-500 text-white"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              )}
                            >
                              {keyMode}
                            </button>
                          ))}
                        </div>
                        <div className="relative w-[130px]">
                          <select
                            value={progressionKey}
                            onChange={(e) => setProgressionKey(e.target.value as NoteName)}
                            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-1.5 px-3 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm font-medium"
                          >
                            {NOTES.map(note => <option key={note} value={note}>{note} {progressionMode.toLowerCase()}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {activeProgressions.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => applyProgressionPreset(preset)}
                            className={clsx(
                              "px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors",
                              activeProgressionPresetId === preset.id
                                ? "border-violet-500 bg-violet-500 text-white"
                                : "border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                            )}
                            title={`Apply ${preset.label} in ${progressionKey} ${progressionMode.toLowerCase()}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedChords.map((chord, index) => (
                        <div key={chord.id} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Chord {index + 1}
                            </span>
                            <button
                              onClick={() => removeChordSelection(chord.id)}
                              disabled={selectedChords.length === 1}
                              className={clsx(
                                "text-xs px-2 py-1 rounded border transition-colors",
                                selectedChords.length === 1
                                  ? "border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-[110px_1fr] gap-2">
                            <div className="relative">
                              <select
                                value={chord.root}
                                onChange={(e) => updateChordSelection(chord.id, 'root', e.target.value as NoteName)}
                                className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2 px-3 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm font-medium"
                              >
                                {NOTES.map(note => <option key={note} value={note}>{note}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative">
                              <select
                                value={chord.chordType}
                                onChange={(e) => updateChordSelection(chord.id, 'chordType', e.target.value as ChordType)}
                                className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2 px-3 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm font-medium"
                              >
                                {Object.values(ChordType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-violet-200/70 dark:border-violet-800 bg-white/80 dark:bg-slate-900/70 p-3 xl:max-h-[430px] xl:overflow-y-auto custom-scrollbar">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Solo Scale Suggestions</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {progressionKey} {progressionMode.toLowerCase()} {activeProgressionPreset ? `- ${activeProgressionPreset.label}` : '- Custom progression'}
                    </p>

                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Global</p>
                      {progressionSuggestions.global.map((suggestion) => (
                        <div key={suggestion.name} className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{suggestion.name}</span>
                            <span
                              className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-bold",
                                suggestion.priority === 'primary'
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                              )}
                            >
                              {suggestion.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{suggestion.why}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target by Chord</p>
                      {progressionSuggestions.perChord.map((entry) => (
                        <div key={entry.chordLabel} className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 p-2">
                          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">{entry.chordLabel}</p>
                          <div className="mt-1.5 space-y-1">
                            {entry.scales.map((suggestion) => (
                              <p key={`${entry.chordLabel}-${suggestion.name}`} className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                                <span className="font-semibold">{suggestion.name}:</span> {suggestion.why}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 flex-1">
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Root</label>
                  <div className="relative">
                    <select
                      value={root}
                      onChange={(e) => setRoot(e.target.value as NoteName)}
                      className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2.5 px-4 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium"
                    >
                      {NOTES.map(note => <option key={note} value={note}>{note}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex-[2]">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {mode === 'Scale' ? 'Scale Type' : 'Quality'}
                  </label>
                  <div className="relative">
                    {mode === 'Scale' ? (
                        <select
                          value={scaleType}
                          onChange={(e) => setScaleType(e.target.value as ScaleType)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2.5 px-4 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium"
                        >
                          {Object.values(ScaleType).map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    ) : (
                         <select
                          value={triadQuality}
                          onChange={(e) => setTriadQuality(e.target.value as TriadQuality)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2.5 px-4 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium"
                        >
                          {Object.values(TriadQuality).map(tq => <option key={tq} value={tq}>{tq}</option>)}
                        </select>
                    )}
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Group 2: Position Selection (only for Scale mode) */}
            {mode === 'Scale' && (
              <div className="flex-1 w-full">
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                   Position <span className="text-violet-500 ml-2 font-normal normal-case">{positionLabel}</span>
                 </label>
                 <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg overflow-x-auto">
                   {(['Full Neck', 1, 2, 3, 4, 5] as const).map(p => (
                     <button
                       key={p}
                       onClick={() => setPosition(p)}
                       className={clsx(
                         "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                         position === p
                          ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                       )}
                     >
                       {p === 'Full Neck' ? 'All' : p}
                     </button>
                   ))}
                 </div>
              </div>
            )}

            {/* String Group Selection (only for Triads mode) */}
            {mode === 'Triads' && (
              <div className="flex-1 w-full">
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                   String Group
                 </label>
                 <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg overflow-x-auto">
                   {(['All', '1-2-3', '2-3-4', '3-4-5', '4-5-6'] as StringGroup[]).map(sg => (
                     <button
                       key={sg}
                       onClick={() => setStringGroup(sg)}
                       className={clsx(
                         "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                         stringGroup === sg
                          ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                       )}
                     >
                       {sg}
                     </button>
                   ))}
                 </div>
              </div>
            )}

            {/* Group 3: Toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => setSettings(s => ({ ...s, showNoteNames: !s.showNoteNames }))}
                className={clsx(
                    "p-2.5 rounded-lg border transition-colors",
                    settings.showNoteNames ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                )}
                title="Toggle Note Names"
              >
                <span className="font-bold text-xs">ABC</span>
              </button>

              {mode === 'Scale' && (
                <button
                  onClick={() => setSettings(s => ({ ...s, showConnections: !s.showConnections }))}
                  className={clsx(
                      "p-2.5 rounded-lg border transition-colors",
                      settings.showConnections ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                  )}
                  title="Toggle Position Connections"
                >
                  <span className="font-bold text-xs">CONN</span>
                </button>
              )}

              {mode === 'Scale' && (
                <button
                  onClick={() => setShowScaleDegreeHelper(prev => !prev)}
                  className={clsx(
                      "p-2.5 rounded-lg border transition-colors",
                      showScaleDegreeHelper ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                  )}
                  title="Toggle Chords for a Key"
                >
                  <span className="font-bold text-xs">KEY</span>
                </button>
              )}

              {mode === 'Chord' && (
                <button
                  onClick={() => setTriadsOnly(prev => !prev)}
                  className={clsx(
                      "p-2.5 rounded-lg border transition-colors",
                      triadsOnly ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                  )}
                  title="Show Triads Only"
                >
                  <span className="font-bold text-xs">3</span>
                </button>
              )}

              {mode === 'Triads' && (
                <button
                  onClick={() => setShowIntervalLabels(prev => !prev)}
                  className={clsx(
                      "p-2.5 rounded-lg border transition-colors",
                      showIntervalLabels ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                  )}
                  title="Show Interval Labels (R/3/5)"
                >
                  <span className="font-bold text-xs">R35</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* FRETBOARD AREA */}
        <section className="relative">
           {/* Color Legend (Mobile Overlay or Top Strip) - only for Scale and Chord modes */}
           {mode !== 'Triads' && (
             <div className="flex gap-4 mb-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {[1,2,3,4,5].map(p => (
                    <div key={p} className="flex items-center gap-1.5 min-w-max">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: POSITION_COLORS[p as 1|2|3|4|5] }}></div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Pos {p} ({POSITION_NAMES[p as 1|2|3|4|5]})</span>
                    </div>
                ))}
             </div>
           )}

           {mode === 'Scale' ? (
             <Fretboard
                root={root}
                type={scaleType}
                mode={mode}
                position={position}
                settings={settings}
                onExportRef={setFretboardRef}
             />
           ) : mode === 'Chord' ? (
             <VerticalChordChart
               chords={selectedChords}
               triadsOnly={triadsOnly}
               settings={settings}
             />
           ) : (
             <TriadFretboard
               root={root}
               quality={triadQuality}
               showNoteNames={settings.showNoteNames}
               showIntervalLabels={showIntervalLabels}
               stringGroup={stringGroup}
             />
           )}
        </section>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            
            {/* Left: Info + Key Chords */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
                 <button 
                  onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                 >
                   <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                      <Info size={20} className="text-violet-500" />
                      {mode} Info
                   </h3>
                   {isInfoExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                 </button>

                 {isInfoExpanded && (
                     <div className="p-5 space-y-4">
                         <div>
                             <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Intervals</h4>
                             <div className="flex gap-2 mt-2 flex-wrap">
                                 {currentDefinition.intervals.map((int, i) => (
                                     <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-700 dark:text-slate-300">
                                         {int === 0 ? 'R' : int}
                                     </span>
                                 ))}
                             </div>
                         </div>
                         
                         <div>
                             <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Description</h4>
                             <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                                 {currentDefinition.description}
                             </p>
                         </div>

                         <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-4 rounded-lg">
                             <h4 className="text-sm font-bold text-violet-700 dark:text-violet-300 mb-1">Pro Tip 💡</h4>
                             <p className="text-sm text-violet-600 dark:text-violet-400 italic">
                                 {currentDefinition.tip}
                             </p>
                         </div>
                     </div>
                 )}
              </div>

              {mode === 'Scale' && showScaleDegreeHelper && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Chords for a Key</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {root} {scaleType}: {selectedScaleNotes.join(' ')}
                  </p>

                  {selectedScaleDegreeChords ? (
                    <div className="mt-4 space-y-1.5 text-slate-800 dark:text-slate-100 font-medium">
                      {selectedScaleDegreeChords.map(({ degree, note, shortQuality }) => (
                        <p key={degree}>
                          {degree} - {note}{shortQuality ? ` ${shortQuality}` : ''}
                          {scaleType === ScaleType.MAJOR && degree === 6 ? ' (relative minor)' : ''}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                      Degree chords are shown for 7-note scales (Major, Natural Minor, Dorian, Mixolydian, Harmonic Minor).
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right: Tab Gen (only for Scale mode) */}
            {mode === 'Scale' && (
              <div>
                <TabGenerator
                    root={root}
                    type={scaleType}
                    mode={mode}
                    position={position}
                    fretboardRef={fretboardRef as React.RefObject<HTMLDivElement>}
                />
              </div>
            )}
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 dark:text-slate-600 text-sm font-medium border-t border-slate-200 dark:border-slate-800 mt-auto">
         <p>Practice slow, play fast 🎸</p>
      </footer>
    </div>
  );
}


