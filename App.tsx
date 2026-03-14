import React, { useState, useEffect } from 'react';
import { Sun, Moon, Info, ChevronDown, ChevronUp, Music, Layers, Triangle, Link2, Play, Pause, Timer, HelpCircle, Coffee, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import Fretboard from './components/Fretboard';
import VerticalScaleFretboard from './components/VerticalScaleFretboard';
import VerticalChordChart from './components/VerticalChordChart';
import TriadFretboard from './components/TriadFretboard';
import Tooltip from './components/Tooltip';
import WelcomeModal from './components/WelcomeModal';
import { NOTES, SCALES, CHORDS, POSITION_NAMES, POSITION_COLORS } from './constants';
import { NoteName, ScaleType, ChordType, Position, Settings, Mode, TriadQuality, StringGroup } from './types';
import { getScaleNotes, getScaleDegreeChords } from './utils/musicLogic';

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

type SavedChord = {
  root: NoteName;
  chordType: ChordType;
};

type ChordView = 'Chords' | 'Triads';
type ScaleView = 'pattern' | 'allNotes';
type ChordNoteDisplayMode = 'shape' | 'all';
type ChordCagedScope = 'core' | 'full';


const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

const MAJOR_DIATONIC_TRIAD_QUALITIES: ChordType[] = [
  ChordType.MAJOR,
  ChordType.MINOR,
  ChordType.MINOR,
  ChordType.MAJOR,
  ChordType.MAJOR,
  ChordType.MINOR,
  ChordType.DIMINISHED,
];

const MAJOR_CHORD_PROGRESSIONS: ProgressionPreset[] = [
  { id: 'one-five-six-four', label: 'I-V-vi-IV', degrees: [{ degree: 1 }, { degree: 5 }, { degree: 6 }, { degree: 4 }] },
  { id: 'one-four-five', label: 'I-IV-V', degrees: [{ degree: 1 }, { degree: 4 }, { degree: 5 }] },
  { id: 'two-five-one', label: 'ii-V-I', degrees: [{ degree: 2 }, { degree: 5, forceType: ChordType.DOMINANT_7 }, { degree: 1 }] },
  { id: 'six-four-one-five', label: 'vi-IV-I-V', degrees: [{ degree: 6 }, { degree: 4 }, { degree: 1 }, { degree: 5 }] },
  { id: 'one-six-two-five', label: 'I-vi-ii-V', degrees: [{ degree: 1 }, { degree: 6 }, { degree: 2 }, { degree: 5, forceType: ChordType.DOMINANT_7 }] },
];


const isNoteName = (value: string | null): value is NoteName => {
  return !!value && NOTES.includes(value as NoteName);
};

const SCALE_VALUES = Object.values(ScaleType);
const TRIAD_VALUES = Object.values(TriadQuality);
const CHORD_TYPE_VALUES = Object.values(ChordType);

const isScaleType = (value: string | null): value is ScaleType => {
  return !!value && SCALE_VALUES.includes(value as ScaleType);
};

const isTriadQuality = (value: string | null): value is TriadQuality => {
  return !!value && TRIAD_VALUES.includes(value as TriadQuality);
};

const isChordType = (value: string): value is ChordType => {
  return CHORD_TYPE_VALUES.includes(value as ChordType);
};

export default function App() {
  // State
  const [mode, setMode] = useState<Mode>('Scale');

  const [scaleView, setScaleView] = useState<ScaleView>('pattern');
  const [scaleLayout, setScaleLayout] = useState<'horizontal' | 'vertical'>('vertical');
  const [root, setRoot] = useState<NoteName>('A');
  const [scaleType, setScaleType] = useState<ScaleType>(ScaleType.MINOR_PENTATONIC);
  const [selectedChords, setSelectedChords] = useState<SelectedChord[]>([
    { id: 1, root: 'A', chordType: ChordType.MAJOR },
    { id: 2, root: 'E', chordType: ChordType.MAJOR },
    { id: 3, root: 'F#', chordType: ChordType.MINOR },
    { id: 4, root: 'D', chordType: ChordType.MAJOR },
  ]);
  const [chordNoteDisplayMode, setChordNoteDisplayMode] = useState<ChordNoteDisplayMode>('shape');
  const [chordCagedScope, setChordCagedScope] = useState<ChordCagedScope>('core');
  const [triadQuality, setTriadQuality] = useState<TriadQuality>(TriadQuality.MAJOR);
  const [showIntervalLabels, setShowIntervalLabels] = useState(true);
  const [stringGroup, setStringGroup] = useState<StringGroup>('All');
  const [position, setPosition] = useState<Position>('Full Neck');
  const [allNotesZoom, setAllNotesZoom] = useState(1.35);
  const [settings, setSettings] = useState<Settings>({
    showNoteNames: true,
    showPositionLabels: true,
    showConnections: true,
    darkMode: true, // Default to dark as per request
  });
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [showScaleDegreeHelper, setShowScaleDegreeHelper] = useState(true);
  const [allNotesStringFilter, setAllNotesStringFilter] = useState<number | null>(null);
  const [allNotesNoteFilter, setAllNotesNoteFilter] = useState<NoteName | null>(null);
  const [progressionKey, setProgressionKey] = useState<NoteName>('A');
  const [activeProgressionPresetId, setActiveProgressionPresetId] = useState<string | null>('one-five-six-four');
  const [bpm, setBpm] = useState(90);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [metronomeBlocked, setMetronomeBlocked] = useState(false);
  const [practicePlaying, setPracticePlaying] = useState(false);
  const [activePracticeChordIndex, setActivePracticeChordIndex] = useState<number | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return localStorage.getItem('nn_welcomed') !== '1'; } catch { return true; }
  });
  const [welcomeInitialTab, setWelcomeInitialTab] = useState<'overview' | 'scales' | 'chords' | 'practice' | 'about'>('overview');
  const [isChordToolsExpanded, setIsChordToolsExpanded] = useState(false);

  const closeWelcome = () => {
    setShowWelcome(false);
    try { localStorage.setItem('nn_welcomed', '1'); } catch { /* ignore */ }
  };

  const hasLoadedFromUrlRef = React.useRef(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const bottomScrollRef = React.useRef<HTMLDivElement>(null);
  const metronomeTimerRef = React.useRef<number | null>(null);
  const progressionTimerRef = React.useRef<number | null>(null);
  const metronomeBeatRef = React.useRef(0);

  // Dark Mode Effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    if (mode !== 'Chord') {
      setPracticePlaying(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!(mode === 'Scale' && scaleView === 'allNotes')) {
      setAllNotesStringFilter(null);
      setAllNotesNoteFilter(null);
    }
  }, [mode, scaleView]);

  useEffect(() => {
    if (mode === 'Triads') {
      setPracticePlaying(false);
    }
  }, [mode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const rootParam = params.get('root');
    const scaleParam = params.get('scale');
    const scaleViewParam = params.get('scaleView');
    const scaleLayoutParam = params.get('scaleLayout');
    const allNotesZoomParam = params.get('allNotesZoom');
    const positionParam = params.get('position');
    const progressionKeyParam = params.get('progressionKey');

    const presetParam = params.get('preset');
    const bpmParam = params.get('bpm');
    const triadParam = params.get('triad');
    const chordNoteModeParam = params.get('chordNoteMode');
    const cagedScopeParam = params.get('cagedScope');
    const stringGroupParam = params.get('stringGroup');
    const chordsParam = params.get('chords');

    if (modeParam === 'Scale' || modeParam === 'Chord' || modeParam === 'Triads') {
      setMode(modeParam);
    }
    if (scaleViewParam === 'pattern' || scaleViewParam === 'allNotes') setScaleView(scaleViewParam);
    if (scaleLayoutParam === 'horizontal' || scaleLayoutParam === 'vertical') setScaleLayout(scaleLayoutParam);
    if (isNoteName(rootParam)) setRoot(rootParam);
    if (isScaleType(scaleParam)) setScaleType(scaleParam);
    if (allNotesZoomParam) {
      const parsedAllNotesZoom = Number(allNotesZoomParam);
      if (!Number.isNaN(parsedAllNotesZoom)) {
        setAllNotesZoom(Math.min(2.2, Math.max(1, parsedAllNotesZoom)));
      }
    }
    if (isTriadQuality(triadParam)) setTriadQuality(triadParam);
    if (chordNoteModeParam === 'shape' || chordNoteModeParam === 'all') setChordNoteDisplayMode(chordNoteModeParam);
    if (cagedScopeParam === 'core' || cagedScopeParam === 'full') setChordCagedScope(cagedScopeParam);
    if (stringGroupParam && ['All', '1-2-3', '2-3-4', '3-4-5', '4-5-6'].includes(stringGroupParam)) {
      setStringGroup(stringGroupParam as StringGroup);
    }

    if (positionParam === 'Full Neck') {
      setPosition('Full Neck');
    } else if (positionParam) {
      const numericPosition = Number(positionParam);
      if ([1, 2, 3, 4, 5].includes(numericPosition)) setPosition(numericPosition as Position);
    }

    if (isNoteName(progressionKeyParam)) setProgressionKey(progressionKeyParam);
    const VALID_PRESET_IDS = MAJOR_CHORD_PROGRESSIONS.map(p => p.id);
    if (presetParam && VALID_PRESET_IDS.includes(presetParam)) setActiveProgressionPresetId(presetParam);
    if (bpmParam) {
      const parsedBpm = Number(bpmParam);
      if (!Number.isNaN(parsedBpm) && parsedBpm >= 50 && parsedBpm <= 200) setBpm(parsedBpm);
    }

    if (chordsParam) {
      try {
        const parsed = JSON.parse(chordsParam) as SavedChord[];
        const parsedChords = parsed
          .filter((ch): ch is SavedChord => isNoteName(ch.root) && isChordType(ch.chordType))
          .slice(0, 5)
          .map((ch, index) => ({ id: index + 1, root: ch.root, chordType: ch.chordType }));

        if (parsedChords.length > 0) setSelectedChords(parsedChords);
      } catch {
        // Ignore malformed URL state
      }
    }

    hasLoadedFromUrlRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedFromUrlRef.current) return;

    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('root', root);
    params.set('scale', scaleType);
    params.set('scaleView', scaleView);
    params.set('scaleLayout', scaleLayout);
    params.set('allNotesZoom', allNotesZoom.toFixed(2));
    params.set('position', String(position));
    params.set('progressionKey', progressionKey);
    params.set('triad', triadQuality);
    params.set('chordNoteMode', chordNoteDisplayMode);
    params.set('cagedScope', chordCagedScope);
    params.set('stringGroup', stringGroup);
    params.set('bpm', String(bpm));

    if (activeProgressionPresetId) params.set('preset', activeProgressionPresetId);
    params.set(
      'chords',
      JSON.stringify(selectedChords.map(({ root: chordRoot, chordType }) => ({ root: chordRoot, chordType })))
    );

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [
    mode,
    root,
    scaleType,
    scaleView,
    scaleLayout,
    allNotesZoom,
    position,
    progressionKey,
    triadQuality,
    chordNoteDisplayMode,
    chordCagedScope,
    stringGroup,
    bpm,
    activeProgressionPresetId,
    selectedChords
  ]);

  // Derived Data
  const chromaticDefinition = {
    name: 'Chromatic Notes',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    description: 'Shows every note on the fretboard from open strings through the 24th fret.',
    tip: 'Use this view to memorize note locations and octave shapes across all strings.'
  };
  const triadDefinition = {
    name: `${triadQuality} Triad`,
    intervals: triadQuality === TriadQuality.MAJOR ? [0, 4, 7] : [0, 3, 7],
    description: triadQuality === TriadQuality.MAJOR
      ? "The fundamental happy chord. Root (R), Major 3rd (3), Perfect 5th (5)."
      : "The fundamental sad chord. Root (R), Minor 3rd (b3), Perfect 5th (5).",
    tip: "Practice finding triads on different string groups. The colors show interval function: Red=Root, Blue=3rd, Green=5th."
  };
  const activeChordType = selectedChords[0]?.chordType ?? ChordType.MAJOR;
  const currentDefinition =
    mode === 'Scale'
      ? (scaleView === 'allNotes' ? chromaticDefinition : SCALES[scaleType])
      : mode === 'Chord'
        ? CHORDS[activeChordType]
        : triadDefinition;
  const isScaleAllNotesView = mode === 'Scale' && scaleView === 'allNotes';
  const effectiveScalePosition: Position = isScaleAllNotesView ? 'Full Neck' : position;
  const positionLabel = position === 'Full Neck' 
    ? 'All Positions' 
    : `${POSITION_NAMES[position]} (${position})`;
  const selectedScaleNotes = getScaleNotes(root, scaleType);
  const selectedScaleDegreeChords = getScaleDegreeChords(root, scaleType);
  const activeProgressions = MAJOR_CHORD_PROGRESSIONS;
  const activeProgressionPreset = activeProgressions.find((preset) => preset.id === activeProgressionPresetId) ?? null;
  const activePracticeChordId = activePracticeChordIndex !== null ? selectedChords[activePracticeChordIndex]?.id ?? null : null;

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    return audioContextRef.current;
  };

  const playMetronomeClick = async (accent: boolean) => {
    try {
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = 'sine';
      oscillator.frequency.value = accent ? 1200 : 880;
      gainNode.gain.setValueAtTime(accent ? 0.5 : 0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.08);
      setMetronomeBlocked(false);
    } catch {
      setMetronomeBlocked(true);
      setMetronomeOn(false);
    }
  };

  useEffect(() => {
    if (!metronomeOn) {
      if (metronomeTimerRef.current) window.clearInterval(metronomeTimerRef.current);
      metronomeTimerRef.current = null;
      metronomeBeatRef.current = 0;
      return;
    }

    const msPerBeat = Math.max(120, Math.floor(60000 / bpm));
    const useBarAccent = mode === 'Chord';
    metronomeTimerRef.current = window.setInterval(() => {
      const accent = useBarAccent && metronomeBeatRef.current % 4 === 0;
      playMetronomeClick(accent);
      metronomeBeatRef.current += 1;
    }, msPerBeat);

    return () => {
      if (metronomeTimerRef.current) window.clearInterval(metronomeTimerRef.current);
      metronomeTimerRef.current = null;
    };
  }, [metronomeOn, bpm, mode]);

  useEffect(() => {
    if (!practicePlaying || selectedChords.length === 0) {
      if (progressionTimerRef.current) window.clearInterval(progressionTimerRef.current);
      progressionTimerRef.current = null;
      setActivePracticeChordIndex(null);
      return;
    }

    let step = 0;
    setActivePracticeChordIndex(0);
    const msPerChord = Math.max(500, Math.floor((60000 / bpm) * 4));

    progressionTimerRef.current = window.setInterval(() => {
      step = (step + 1) % selectedChords.length;
      setActivePracticeChordIndex(step);
    }, msPerChord);

    return () => {
      if (progressionTimerRef.current) window.clearInterval(progressionTimerRef.current);
      progressionTimerRef.current = null;
    };
  }, [practicePlaying, selectedChords, bpm]);

  useEffect(() => {
    return () => {
      if (metronomeTimerRef.current) window.clearInterval(metronomeTimerRef.current);
      if (progressionTimerRef.current) window.clearInterval(progressionTimerRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  const updateChordSelection = (id: number, field: 'root' | 'chordType', value: NoteName | ChordType) => {
    setActiveProgressionPresetId(null);
    setSelectedChords(prev =>
      prev.map(chord => (chord.id === id ? { ...chord, [field]: value } : chord))
    );
  };

  const addChordSelection = () => {
    setActiveProgressionPresetId(null);
    setSelectedChords(prev => {
      if (prev.length >= 5) return prev;
      const nextId = prev.length ? Math.max(...prev.map(ch => ch.id)) + 1 : 1;
      return [...prev, { id: nextId, root: 'A', chordType: ChordType.MAJOR }];
    });
  };

  const removeChordSelection = (id: number) => {
    setActiveProgressionPresetId(null);
    setSelectedChords(prev => (prev.length > 1 ? prev.filter(chord => chord.id !== id) : prev));
  };

  const applyProgressionPreset = (preset: ProgressionPreset, forKey?: NoteName) => {
    const scaleIntervals = MAJOR_SCALE_INTERVALS;
    const diatonicQualities = MAJOR_DIATONIC_TRIAD_QUALITIES;
    const keyIndex = NOTES.indexOf(forKey ?? progressionKey);
    const nextChords: SelectedChord[] = preset.degrees.slice(0, 5).map((degreeData, index) => {
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

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-violet-500/30">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Top bar: logo + buttons */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-3">
            <img
              src="/neckninjalogo2.png"
              alt="NeckNinja logo"
              className="h-14 w-auto object-contain"
            />
            <div className="flex flex-col items-start">
              <span className="text-slate-900 dark:text-slate-100 font-extrabold tracking-tight text-3xl leading-tight">
                NeckNinja
              </span>
              <span className="font-bold uppercase tracking-[0.2em] text-xs text-[#18D5D9]">
                Master the Neck
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 relative z-10">
            <Tooltip content="Help & Feature Guide" position="bottom">
              <button
                onClick={() => { setWelcomeInitialTab('overview'); setShowWelcome(true); }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                aria-label="Help"
              >
                <HelpCircle size={20} />
              </button>
            </Tooltip>
            <button
              onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
        {/* Mode switcher always visible in sticky header */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 flex justify-center">
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-full flex w-full max-w-xl">
            <button
              onClick={() => setMode('Scale')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-bold transition-all duration-300",
                mode === 'Scale'
                  ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm"
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
                  ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm"
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
                  ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <Triangle size={16} /> Triads
            </button>
          </div>
        </div>
      </header>

      {showWelcome && <WelcomeModal onClose={closeWelcome} initialTab={welcomeInitialTab} />}

      <main className="flex-1 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        
        {/* CONTROL PANEL */}
        <div className={clsx("bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6 space-y-6", (mode === 'Scale' || mode === 'Chord') && 'lg:hidden')}>
          
          <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
            
            {/* Group 1: Definition Selection */}
            {mode === 'Chord' ? (
              <div className="flex-1 w-full space-y-3">
                <>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Chords (up to 5)
                </label>

                <div className="block">
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Progression Presets
                        </label>
                        <div className="relative w-[130px]">
                          <select
                            value={progressionKey}
                            onChange={(e) => {
                              const newKey = e.target.value as NoteName;
                              setProgressionKey(newKey);
                              if (activeProgressionPresetId) {
                                const preset = activeProgressions.find(p => p.id === activeProgressionPresetId);
                                if (preset) applyProgressionPreset(preset, newKey);
                              }
                            }}
                            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-1.5 px-3 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm font-medium"
                          >
                            {NOTES.map(note => <option key={note} value={note}>{note} major</option>)}
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
                            title={`Apply ${preset.label} in ${progressionKey} major`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-3 justify-between">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Practice Tools
                        </h4>
                        <button
                          onClick={copyShareLink}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Copy shareable link"
                        >
                          <Link2 size={14} /> {shareCopied ? 'Copied' : 'Share Link'}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <Timer size={14} />
                          BPM
                        </label>
                        <input
                          type="range"
                          min={50}
                          max={200}
                          value={bpm}
                          onChange={(e) => setBpm(Number(e.target.value))}
                          className="w-36"
                        />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 w-10 text-right">{bpm}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setMetronomeOn((prev) => !prev)}
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors",
                            metronomeOn
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          {metronomeOn ? <Pause size={14} /> : <Play size={14} />}
                          {metronomeOn ? 'Stop Metronome' : 'Start Metronome'}
                        </button>

                        <button
                          onClick={() => setPracticePlaying((prev) => !prev)}
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors",
                            practicePlaying
                              ? "border-violet-500 bg-violet-500 text-white"
                              : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          {practicePlaying ? <Pause size={14} /> : <Play size={14} />}
                          {practicePlaying ? 'Stop Progression' : 'Play Progression'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedChords.map((chord, index) => (
                        <div
                          key={chord.id}
                          className={clsx(
                            "bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2 transition-colors",
                            activePracticeChordIndex === index && "ring-2 ring-violet-400 dark:ring-violet-500 bg-violet-50/70 dark:bg-violet-900/20"
                          )}
                        >
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
                      {selectedChords.length < 5 && (
                        <button
                          onClick={addChordSelection}
                          className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 dark:text-slate-500 hover:border-violet-400 hover:text-violet-500 dark:hover:border-violet-500 dark:hover:text-violet-400 transition-colors min-h-[80px]"
                        >
                          + Add Chord
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                </>
              </div>
            ) : (
              <div className="flex gap-4 flex-1">
                <div className="flex-1 min-w-[100px]">
                  {mode === 'Scale' && (
                    <>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Available Views</label>
                      <div className="flex flex-col gap-2 mb-3">
                        {/* Row 1: view toggle + optional tooltip */}
                        <div className="flex items-center gap-2">
                          <div className="inline-flex bg-slate-100 dark:bg-slate-900 rounded-md p-0.5 w-fit">
                            <button onClick={() => setScaleView('pattern')} className={clsx("px-3 py-1.5 text-xs font-semibold rounded transition-colors", scaleView === 'pattern' ? "bg-violet-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")}>Scale Pattern</button>
                            <button onClick={() => setScaleView('allNotes')} className={clsx("px-3 py-1.5 text-xs font-semibold rounded transition-colors", scaleView === 'allNotes' ? "bg-violet-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")}>All Notes</button>
                          </div>
                          {scaleView === 'allNotes' && (
                            <Tooltip content="Tip: click a string label (6th, 5th…) on the fretboard to filter notes to just that string. Click again to show all strings." position="bottom">
                              <span className="inline-flex items-center gap-1 text-xs text-violet-500 cursor-default select-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                Filter by string
                              </span>
                            </Tooltip>
                          )}
                        </div>
                        {/* Row 2: layout toggle */}
                        <div className="inline-flex bg-slate-100 dark:bg-slate-900 rounded-md p-0.5 w-fit">
                            <Tooltip content="Horizontal fretboard — great for seeing the full neck at once" position="bottom">
                              <button
                                onClick={() => setScaleLayout('horizontal')}
                                className={clsx(
                                  "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
                                  scaleLayout === 'horizontal'
                                    ? "bg-violet-500 text-white"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                              >
                                Horizontal
                              </button>
                            </Tooltip>
                            <Tooltip content="Vertical fretboard — matches how you see the neck while playing" position="bottom">
                              <button
                                onClick={() => setScaleLayout('vertical')}
                                className={clsx(
                                  "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
                                  scaleLayout === 'vertical'
                                    ? "bg-violet-500 text-white"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                              >
                                Vertical
                              </button>
                            </Tooltip>
                          </div>
                      </div>
                    </>
                  )}
                  {!isScaleAllNotesView && (
                    <>
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
                    </>
                  )}
                </div>

                {!isScaleAllNotesView && (
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
                )}
              </div>
            )}

            {/* Group 2: Position Selection (only for Scale mode) */}
            {mode === 'Scale' && scaleView === 'pattern' && (
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
            {mode === 'Scale' && scaleView === 'allNotes' && scaleLayout === 'horizontal' && (
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Neck Width <span className="text-violet-500 ml-2 font-normal normal-case">{Math.round(allNotesZoom * 100)}%</span>
                </label>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit">
                  <button
                    onClick={() => setAllNotesZoom((prev) => Math.max(1, Math.round((prev - 0.1) * 100) / 100))}
                    className="px-3 py-2 rounded-md text-sm font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    title="Decrease neck width"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setAllNotesZoom((prev) => Math.min(2.2, Math.round((prev + 0.1) * 100) / 100))}
                    className="px-3 py-2 rounded-md text-sm font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    title="Increase neck width"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* String Group Selection (only for Triads mode) */}
            {mode === 'Triads' && (
              <div className="flex-1 w-full">
                 <Tooltip content="Each string group shows the triad voiced across 3 adjacent strings. Start with 1-2-3 (top strings) — it's the easiest to hear and play." position="bottom">
                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 w-fit cursor-default">
                     String Group
                   </label>
                 </Tooltip>
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
              <Tooltip content="Show or hide note names (A, B, C…) on each dot" position="bottom">
                <button
                  onClick={() => setSettings(s => ({ ...s, showNoteNames: !s.showNoteNames }))}
                  className={clsx(
                      "p-2.5 rounded-lg border transition-colors",
                      settings.showNoteNames ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                  )}
                >
                  <span className="font-bold text-xs">Notes</span>
                </button>
              </Tooltip>

              {mode === 'Scale' && scaleView === 'pattern' && (
                <Tooltip content="Draw lines connecting adjacent scale positions so you can see how they overlap and link across the neck" position="bottom">
                  <button
                    onClick={() => setSettings(s => ({ ...s, showConnections: !s.showConnections }))}
                    className={clsx(
                        "p-2.5 rounded-lg border transition-colors",
                        settings.showConnections ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                    )}
                  >
                    <span className="font-bold text-xs">CONN</span>
                  </button>
                </Tooltip>
              )}

              {mode === 'Scale' && scaleView === 'pattern' && (
                <Tooltip content="Show the diatonic chords that naturally fit in this key — useful for knowing what chords to play over a scale" position="bottom">
                  <button
                    onClick={() => setShowScaleDegreeHelper(prev => !prev)}
                    className={clsx(
                        "p-2.5 rounded-lg border transition-colors",
                        showScaleDegreeHelper ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                    )}
                  >
                    <span className="font-bold text-xs">KEY</span>
                  </button>
                </Tooltip>
              )}

              {mode === 'Chord' && (
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Tooltip content="Show only the notes that belong to the specific CAGED chord shape — easier to see the chord voicing clearly" position="bottom">
                    <button
                      onClick={() => setChordNoteDisplayMode('shape')}
                      className={clsx(
                        "px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors",
                        chordNoteDisplayMode === 'shape'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      SHAPE
                    </button>
                  </Tooltip>
                  <Tooltip content="Show every chord tone across the entire neck, not just one shape" position="bottom">
                    <button
                      onClick={() => setChordNoteDisplayMode('all')}
                      className={clsx(
                        "px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors border-l border-slate-200 dark:border-slate-700",
                        chordNoteDisplayMode === 'all'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      ALL TONES
                    </button>
                  </Tooltip>
                </div>
              )}

              {mode === 'Chord' && (
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Tooltip content="Show the 3 most common CAGED shapes (A, E, D) — the best starting point for most guitarists" position="bottom">
                    <button
                      onClick={() => setChordCagedScope('core')}
                      className={clsx(
                        "px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors",
                        chordCagedScope === 'core'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      CORE CAGED
                    </button>
                  </Tooltip>
                  <Tooltip content="Show all 5 CAGED shapes across the full neck" position="bottom">
                    <button
                      onClick={() => setChordCagedScope('full')}
                      className={clsx(
                        "px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors border-l border-slate-200 dark:border-slate-700",
                        chordCagedScope === 'full'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      FULL CAGED
                    </button>
                  </Tooltip>
                </div>
              )}

              {mode === 'Triads' && (
                <Tooltip content="Label each note by its interval role: R = Root, 3 = Third, 5 = Fifth" position="bottom">
                  <button
                    onClick={() => setShowIntervalLabels(prev => !prev)}
                    className={clsx(
                        "p-2.5 rounded-lg border transition-colors",
                        showIntervalLabels ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                    )}
                  >
                    <span className="font-bold text-xs">Root, 3rd, 5th</span>
                  </button>
                </Tooltip>
              )}
            </div>

          </div>

          {mode === 'Scale' && scaleView === 'pattern' && (
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Practice Tools
              </h4>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Timer size={14} />
                  BPM
                </label>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-40"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 w-10 text-right">{bpm}</span>
                <button
                  onClick={() => { setMetronomeBlocked(false); setMetronomeOn((prev) => !prev); }}
                  className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors",
                    metronomeOn
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {metronomeOn ? <Pause size={14} /> : <Play size={14} />}
                  {metronomeOn ? 'Stop Metronome' : 'Start Metronome'}
                </button>
                {metronomeBlocked && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Audio blocked — tap anywhere on the page first, then try again.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FRETBOARD AREA */}
        <section className={clsx("relative", (mode === 'Scale' || mode === 'Chord') && 'lg:hidden')}>
           {/* Color Legend (Mobile Overlay or Top Strip) - only for Scale and Chord modes */}
           {!isScaleAllNotesView && mode !== 'Triads' && (
             <div className="flex gap-4 mb-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {[1,2,3,4,5].map(p => (
                    <div key={p} className="flex items-center gap-1.5 min-w-max">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: POSITION_COLORS[p as 1|2|3|4|5] }}></div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Pos {p} ({POSITION_NAMES[p as 1|2|3|4|5]})</span>
                    </div>
                ))}
             </div>
           )}

           {isScaleAllNotesView && (
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500 py-1 select-none">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-slate-400/50 dark:bg-slate-500/50" />
                Click a <strong className="text-slate-500 dark:text-slate-400">note dot</strong> to filter by that note
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block text-[10px] font-bold border border-slate-400/50 rounded px-1 text-slate-400">6th</span>
                Click a <strong className="text-slate-500 dark:text-slate-400">string label</strong> to isolate that string
              </span>
            </div>
          )}

          {mode === 'Scale' ? (
             scaleLayout === 'vertical' ? (
               <VerticalScaleFretboard
                 root={root}
                 scaleType={scaleType}
                 position={effectiveScalePosition}
                 settings={settings}
                 showAllNotes={isScaleAllNotesView}
                 activeStringFilter={isScaleAllNotesView ? allNotesStringFilter : undefined}
                 onStringFilterChange={isScaleAllNotesView ? setAllNotesStringFilter : undefined}
                 activeNoteFilter={isScaleAllNotesView ? allNotesNoteFilter : undefined}
                 onNoteFilterChange={isScaleAllNotesView ? setAllNotesNoteFilter : undefined}
               />
             ) : (
               <Fretboard
                  root={root}
                  type={scaleType}
                  mode={mode}
                  position={effectiveScalePosition}
                  settings={settings}
                  showAllNotes={isScaleAllNotesView}
                  allNotesZoom={allNotesZoom}
                  activeStringFilter={allNotesStringFilter}
                  onStringFilterChange={setAllNotesStringFilter}
                  activeNoteFilter={allNotesNoteFilter}
                  onNoteFilterChange={setAllNotesNoteFilter}
               />
             )
           ) : mode === 'Chord' ? (
             <VerticalChordChart
               chords={selectedChords}
               noteDisplayMode={chordNoteDisplayMode}
               cagedScope={chordCagedScope}
               activeChordId={activePracticeChordId}
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
        <div className={clsx("grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12", (mode === 'Scale' || mode === 'Chord') && 'lg:hidden')}>
            
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

              {mode === 'Scale' && scaleView === 'pattern' && showScaleDegreeHelper && (
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

        </div>

        {/* ── SCALE MODE: lg+ sidebar layout ── */}
        {mode === 'Scale' && (
          <div className="hidden lg:flex items-start gap-0">

            {/* SIDEBAR */}
            <aside className="w-64 shrink-0 sticky top-[148px] self-start overflow-y-auto max-h-[calc(100vh-160px)] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 rounded-xl flex flex-col p-4 space-y-5">

              {/* Available Views */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Available Views</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex bg-slate-100 dark:bg-slate-900 rounded-md p-0.5 w-fit">
                      <button onClick={() => setScaleView('pattern')} className={clsx("px-3 py-1.5 text-xs font-semibold rounded transition-colors", scaleView === 'pattern' ? "bg-violet-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")}>Scale Pattern</button>
                      <button onClick={() => setScaleView('allNotes')} className={clsx("px-3 py-1.5 text-xs font-semibold rounded transition-colors", scaleView === 'allNotes' ? "bg-violet-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")}>All Notes</button>
                    </div>
                    {scaleView === 'allNotes' && (
                      <Tooltip content="Tip: click a string label (6th, 5th…) on the fretboard to filter notes to just that string. Click again to show all strings." position="bottom">
                        <span className="inline-flex items-center gap-1 text-xs text-violet-500 cursor-default select-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          Filter by string
                        </span>
                      </Tooltip>
                    )}
                  </div>
                  <div className="inline-flex bg-slate-100 dark:bg-slate-900 rounded-md p-0.5 w-fit">
                      <Tooltip content="Horizontal fretboard — great for seeing the full neck at once" position="bottom">
                        <button onClick={() => setScaleLayout('horizontal')} className={clsx("px-3 py-1.5 text-xs font-semibold rounded transition-colors", scaleLayout === 'horizontal' ? "bg-violet-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")}>Horizontal</button>
                      </Tooltip>
                      <Tooltip content="Vertical fretboard — matches how you see the neck while playing" position="bottom">
                        <button onClick={() => setScaleLayout('vertical')} className={clsx("px-3 py-1.5 text-xs font-semibold rounded transition-colors", scaleLayout === 'vertical' ? "bg-violet-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")}>Vertical</button>
                      </Tooltip>
                    </div>
                </div>
              </div>

              {/* Root */}
              {!isScaleAllNotesView && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Root</label>
                  <div className="relative">
                    <select value={root} onChange={(e) => setRoot(e.target.value as NoteName)} className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2.5 px-4 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium">
                      {NOTES.map(note => <option key={note} value={note}>{note}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Scale Type */}
              {!isScaleAllNotesView && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Scale Type</label>
                  <div className="relative">
                    <select value={scaleType} onChange={(e) => setScaleType(e.target.value as ScaleType)} className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2.5 px-4 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none font-medium">
                      {Object.values(ScaleType).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Position */}
              {scaleView === 'pattern' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Position <span className="text-violet-500 ml-2 font-normal normal-case">{positionLabel}</span>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {(['Full Neck', 1, 2, 3, 4, 5] as const).map(p => (
                      <button key={p} onClick={() => setPosition(p)} className={clsx("flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all whitespace-nowrap", position === p ? "bg-violet-500 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>
                        {p === 'Full Neck' ? 'All' : p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Neck Width */}
              {scaleView === 'allNotes' && scaleLayout === 'horizontal' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Neck Width <span className="text-violet-500 ml-2 font-normal normal-case">{Math.round(allNotesZoom * 100)}%</span>
                  </label>
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit">
                    <button onClick={() => setAllNotesZoom((prev) => Math.max(1, Math.round((prev - 0.1) * 100) / 100))} className="px-3 py-2 rounded-md text-sm font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors" title="Decrease neck width">-</button>
                    <button onClick={() => setAllNotesZoom((prev) => Math.min(2.2, Math.round((prev + 0.1) * 100) / 100))} className="px-3 py-2 rounded-md text-sm font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors" title="Increase neck width">+</button>
                  </div>
                </div>
              )}

              {/* Display Toggles */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Display</label>
                <div className="flex gap-2 flex-wrap">
                  <Tooltip content="Show or hide note names (A, B, C…) on each dot" position="bottom">
                    <button onClick={() => setSettings(s => ({ ...s, showNoteNames: !s.showNoteNames }))} className={clsx("p-2.5 rounded-lg border transition-colors", settings.showNoteNames ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400")}>
                      <span className="font-bold text-xs">Notes</span>
                    </button>
                  </Tooltip>
                  {scaleView === 'pattern' && (
                    <Tooltip content="Draw lines connecting adjacent scale positions so you can see how they overlap and link across the neck" position="bottom">
                      <button onClick={() => setSettings(s => ({ ...s, showConnections: !s.showConnections }))} className={clsx("p-2.5 rounded-lg border transition-colors", settings.showConnections ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400")}>
                        <span className="font-bold text-xs">CONN</span>
                      </button>
                    </Tooltip>
                  )}
                  {scaleView === 'pattern' && (
                    <Tooltip content="Show the diatonic chords that naturally fit in this key — useful for knowing what chords to play over a scale" position="bottom">
                      <button onClick={() => setShowScaleDegreeHelper(prev => !prev)} className={clsx("p-2.5 rounded-lg border transition-colors", showScaleDegreeHelper ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400")}>
                        <span className="font-bold text-xs">KEY</span>
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Practice Tools */}
              {scaleView === 'pattern' && (
                <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Practice Tools</h4>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Timer size={14} /> BPM
                    </label>
                    <input type="range" min={50} max={200} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{bpm} BPM</span>
                      <button onClick={() => { setMetronomeBlocked(false); setMetronomeOn((prev) => !prev); }} className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors", metronomeOn ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                        {metronomeOn ? <Pause size={14} /> : <Play size={14} />}
                        {metronomeOn ? 'Stop' : 'Start'}
                      </button>
                    </div>
                    {metronomeBlocked && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">Audio blocked — tap anywhere first.</span>
                    )}
                  </div>
                </div>
              )}

            </aside>

            {/* RIGHT AREA */}
            <div className="flex-1 min-w-0 pl-6 flex flex-row gap-6 items-start">

              {/* Fretboard column */}
              <div className="flex-1 flex flex-col items-center gap-4 min-w-0">

                {/* Color Legend */}
                {!isScaleAllNotesView && (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {[1,2,3,4,5].map(p => (
                      <div key={p} className="flex items-center gap-1.5 min-w-max">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: POSITION_COLORS[p as 1|2|3|4|5] }}></div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Pos {p} ({POSITION_NAMES[p as 1|2|3|4|5]})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* All Notes hint */}
                {isScaleAllNotesView && (
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500 py-1 select-none">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-full bg-slate-400/50 dark:bg-slate-500/50" />
                      Click a <strong className="text-slate-500 dark:text-slate-400">note dot</strong> to filter by that note
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block text-[10px] font-bold border border-slate-400/50 rounded px-1 text-slate-400">6th</span>
                      Click a <strong className="text-slate-500 dark:text-slate-400">string label</strong> to isolate that string
                    </span>
                  </div>
                )}

                {/* Fretboard */}
                {scaleLayout === 'vertical' ? (
                  <div className="flex justify-center w-full">
                    <VerticalScaleFretboard
                      root={root}
                      scaleType={scaleType}
                      position={effectiveScalePosition}
                      settings={settings}
                      showAllNotes={isScaleAllNotesView}
                      activeStringFilter={isScaleAllNotesView ? allNotesStringFilter : undefined}
                      onStringFilterChange={isScaleAllNotesView ? setAllNotesStringFilter : undefined}
                      activeNoteFilter={isScaleAllNotesView ? allNotesNoteFilter : undefined}
                      onNoteFilterChange={isScaleAllNotesView ? setAllNotesNoteFilter : undefined}
                    />
                  </div>
                ) : (
                  <Fretboard
                    root={root}
                    type={scaleType}
                    mode={mode}
                    position={effectiveScalePosition}
                    settings={settings}
                    showAllNotes={isScaleAllNotesView}
                    allNotesZoom={allNotesZoom}
                    activeStringFilter={allNotesStringFilter}
                    onStringFilterChange={setAllNotesStringFilter}
                    activeNoteFilter={allNotesNoteFilter}
                    onNoteFilterChange={setAllNotesNoteFilter}
                  />
                )}

                {/* Panels below fretboard — visible on lg, hidden on xl (shown in sticky column instead) */}
                <div className="xl:hidden flex flex-col gap-4 w-full">

                  {/* Scale Info accordion */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button onClick={() => setIsInfoExpanded(!isInfoExpanded)} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                        <Info size={20} className="text-violet-500" />
                        Scale Info
                      </h3>
                      {isInfoExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {isInfoExpanded && (
                      <div className="p-5 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Intervals</h4>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {currentDefinition.intervals.map((int, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-700 dark:text-slate-300">{int === 0 ? 'R' : int}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Description</h4>
                          <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">{currentDefinition.description}</p>
                        </div>
                        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-4 rounded-lg">
                          <h4 className="text-sm font-bold text-violet-700 dark:text-violet-300 mb-1">Pro Tip 💡</h4>
                          <p className="text-sm text-violet-600 dark:text-violet-400 italic">{currentDefinition.tip}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chords for a Key */}
                  {scaleView === 'pattern' && showScaleDegreeHelper && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">Chords for a Key</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{root} {scaleType}: {selectedScaleNotes.join(' ')}</p>
                      {selectedScaleDegreeChords ? (
                        <div className="mt-4 space-y-1.5 text-slate-800 dark:text-slate-100 font-medium">
                          {selectedScaleDegreeChords.map(({ degree, note, shortQuality }) => (
                            <p key={degree}>{degree} - {note}{shortQuality ? ` ${shortQuality}` : ''}{scaleType === ScaleType.MAJOR && degree === 6 ? ' (relative minor)' : ''}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Degree chords are shown for 7-note scales (Major, Natural Minor, Dorian, Mixolydian, Harmonic Minor).</p>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Sticky panels column — xl+ only */}
              <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0 sticky top-[148px] self-start max-h-[calc(100vh-160px)] overflow-y-auto">

                {/* Scale Info accordion */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button onClick={() => setIsInfoExpanded(!isInfoExpanded)} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                      <Info size={20} className="text-violet-500" />
                      Scale Info
                    </h3>
                    {isInfoExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {isInfoExpanded && (
                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Intervals</h4>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {currentDefinition.intervals.map((int, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-700 dark:text-slate-300">{int === 0 ? 'R' : int}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Description</h4>
                        <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">{currentDefinition.description}</p>
                      </div>
                      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-4 rounded-lg">
                        <h4 className="text-sm font-bold text-violet-700 dark:text-violet-300 mb-1">Pro Tip 💡</h4>
                        <p className="text-sm text-violet-600 dark:text-violet-400 italic">{currentDefinition.tip}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chords for a Key */}
                {scaleView === 'pattern' && showScaleDegreeHelper && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Chords for a Key</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{root} {scaleType}: {selectedScaleNotes.join(' ')}</p>
                    {selectedScaleDegreeChords ? (
                      <div className="mt-4 space-y-1.5 text-slate-800 dark:text-slate-100 font-medium">
                        {selectedScaleDegreeChords.map(({ degree, note, shortQuality }) => (
                          <p key={degree}>{degree} - {note}{shortQuality ? ` ${shortQuality}` : ''}{scaleType === ScaleType.MAJOR && degree === 6 ? ' (relative minor)' : ''}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Degree chords are shown for 7-note scales (Major, Natural Minor, Dorian, Mixolydian, Harmonic Minor).</p>
                    )}
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* ── CHORD MODE: lg+ layout ── */}
        {mode === 'Chord' && (
          <div className="hidden lg:flex flex-col gap-4">

            {/* TOP BAR */}
            <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center gap-3 flex-wrap">

                {/* Preset buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {MAJOR_CHORD_PROGRESSIONS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyProgressionPreset(preset)}
                      className={clsx(
                        "px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors",
                        activeProgressionPresetId === preset.id
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                      )}
                      title={`Apply ${preset.label} in ${progressionKey} major`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />

                {/* Key dropdown */}
                <div className="relative">
                  <select
                    value={progressionKey}
                    onChange={(e) => {
                      const newKey = e.target.value as NoteName;
                      setProgressionKey(newKey);
                      if (activeProgressionPresetId) {
                        const preset = MAJOR_CHORD_PROGRESSIONS.find(p => p.id === activeProgressionPresetId);
                        if (preset) applyProgressionPreset(preset, newKey);
                      }
                    }}
                    className="appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-1.5 px-3 pr-8 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm font-semibold"
                  >
                    {NOTES.map(note => <option key={note} value={note}>{note} major</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Song reference hint */}
                {(() => {
                  const SONG_REFS: Record<string, string> = {
                    "one-five-six-four:C": "Let It Be · Don't Stop Believin' · No Woman No Cry",
                    "one-five-six-four:D": "With or Without You · Photograph",
                    "one-five-six-four:A": "Take Me to Church",
                    "one-four-five:G": "Sweet Home Alabama · Knockin' on Heaven's Door",
                    "one-four-five:A": "Wild Thing · La Bamba",
                    "one-four-five:E": "Johnny B. Goode · Whole Lotta Love",
                    "two-five-one:C": "Autumn Leaves · Fly Me to the Moon",
                    "two-five-one:G": "The Girl from Ipanema",
                    "six-four-one-five:A": "Counting Stars · Despacito",
                    "six-four-one-five:C": "Africa by Toto",
                    "six-four-one-five:G": "Someone Like You",
                    "one-six-two-five:C": "Heart and Soul · Blue Moon",
                  };
                  const songs = activeProgressionPresetId ? SONG_REFS[`${activeProgressionPresetId}:${progressionKey}`] : null;
                  if (!songs) return null;
                  return (
                    <Tooltip content={`🎵 Popular songs using these chords: ${songs}`} position="bottom">
                      <button className="text-slate-400 hover:text-violet-500 transition-colors p-0.5" tabIndex={-1} aria-label="Song examples">
                        <Info size={14} />
                      </button>
                    </Tooltip>
                  );
                })()}

                <div className="flex-1" />

                {/* Notes toggle */}
                <Tooltip content="Show or hide note names (A, B, C…) on each dot" position="bottom">
                  <button
                    onClick={() => setSettings(s => ({ ...s, showNoteNames: !s.showNoteNames }))}
                    className={clsx(
                      "px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors",
                      settings.showNoteNames
                        ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                        : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400"
                    )}
                  >Notes</button>
                </Tooltip>

                {/* Shape / All Tones toggle */}
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Tooltip content="Show only the notes that belong to the specific CAGED chord shape — easier to see the chord voicing clearly" position="bottom">
                    <button
                      onClick={() => setChordNoteDisplayMode('shape')}
                      className={clsx(
                        "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                        chordNoteDisplayMode === 'shape'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >Shape</button>
                  </Tooltip>
                  <Tooltip content="Show every chord tone across the entire neck, not just one shape" position="bottom">
                    <button
                      onClick={() => setChordNoteDisplayMode('all')}
                      className={clsx(
                        "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors border-l border-slate-200 dark:border-slate-700",
                        chordNoteDisplayMode === 'all'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >All Tones</button>
                  </Tooltip>
                </div>

                {/* Core / Full CAGED toggle */}
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Tooltip content="Show the 3 most common CAGED shapes (A, E, D) — the best starting point for most guitarists" position="bottom">
                    <button
                      onClick={() => setChordCagedScope('core')}
                      className={clsx(
                        "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                        chordCagedScope === 'core'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >Core</button>
                  </Tooltip>
                  <Tooltip content="Show all 5 CAGED shapes across the full neck" position="bottom">
                    <button
                      onClick={() => setChordCagedScope('full')}
                      className={clsx(
                        "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors border-l border-slate-200 dark:border-slate-700",
                        chordCagedScope === 'full'
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >Full CAGED</button>
                  </Tooltip>
                </div>

                {/* More Tools toggle */}
                <button
                  onClick={() => setIsChordToolsExpanded(prev => !prev)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                    isChordToolsExpanded
                      ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  More Tools {isChordToolsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

              </div>

              {/* More Tools panel */}
              {isChordToolsExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Timer size={13} /> BPM
                    </label>
                    <input type="range" min={50} max={200} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-28" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 w-8 text-right">{bpm}</span>
                  </div>
                  <button
                    onClick={() => setMetronomeOn(prev => !prev)}
                    className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors",
                      metronomeOn ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800")}
                  >
                    {metronomeOn ? <Pause size={13} /> : <Play size={13} />}
                    {metronomeOn ? 'Stop Metronome' : 'Start Metronome'}
                  </button>
                  <button
                    onClick={() => setPracticePlaying(prev => !prev)}
                    className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors",
                      practicePlaying ? "border-violet-500 bg-violet-500 text-white" : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800")}
                  >
                    {practicePlaying ? <Pause size={13} /> : <Play size={13} />}
                    {practicePlaying ? 'Stop Progression' : 'Play Progression'}
                  </button>
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Link2 size={13} /> {shareCopied ? 'Copied' : 'Share Link'}
                  </button>
                </div>
              )}
            </div>

            {/* MAIN AREA */}
            <div className="overflow-x-auto" ref={bottomScrollRef}>
              <VerticalChordChart
                chords={selectedChords}
                noteDisplayMode={chordNoteDisplayMode}
                cagedScope={chordCagedScope}
                activeChordId={activePracticeChordId}
                settings={settings}
              />
            </div>

            {/* Helper text */}
            <p className="text-xs text-slate-400 dark:text-slate-500 px-2 py-1">
              Pick your own chords — select up to 4 chords below, or use a progression preset above to auto-fill.
            </p>

            {/* Bottom bar — chord slot editor */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
              <div className="flex flex-row gap-3 flex-wrap items-center">
                {selectedChords.map((chord, index) => (
                  <div key={chord.id} className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-400">Chord {index + 1}</span>
                    <select
                      value={chord.root}
                      onChange={(e) => updateChordSelection(chord.id, 'root', e.target.value as NoteName)}
                      className="appearance-none bg-slate-900 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                    >
                      {NOTES.map((note) => (
                        <option key={note} value={note}>{note}</option>
                      ))}
                    </select>
                    <select
                      value={chord.chordType}
                      onChange={(e) => updateChordSelection(chord.id, 'chordType', e.target.value as ChordType)}
                      className="appearance-none bg-slate-900 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                    >
                      {Object.values(ChordType).map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeChordSelection(chord.id)}
                      disabled={selectedChords.length === 1}
                      className="text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed px-1"
                    ><Trash2 size={14} /></button>
                  </div>
                ))}
                {selectedChords.length < 5 && (
                  <button
                    onClick={addChordSelection}
                    className="border border-dashed border-slate-600 text-slate-400 hover:border-violet-500 hover:text-violet-400 rounded px-3 py-1 text-sm"
                  >+ Add</button>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      <footer className="py-5 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
          <p>Practice slow, play fast 🎸</p>
          <div className="flex items-center gap-3">
            <span>Created by <strong className="text-slate-500 dark:text-slate-400">James Build</strong></span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => { setWelcomeInitialTab('about'); setShowWelcome(true); }}
              className="flex items-center gap-1 hover:text-violet-500 transition-colors"
            >
              <Coffee size={12} /> About
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
