import React, { useState, useRef } from 'react';
import { NoteName, ScaleType, Position, RunNote } from '../types';
import { generateBoxRun, generateDiagonalRun, generateFullNeckRun, getRunTabContent } from '../utils/musicLogic';
import * as htmlToImage from 'html-to-image';
import { Download, X, Mail, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

type RunType = 'box' | 'diagonal' | 'fullNeck';

interface TabGeneratorProps {
  root: NoteName;
  scaleType: ScaleType;
  position: Position;
  activeRun: RunNote[] | null;
  onRunGenerated: (notes: RunNote[]) => void;
  onClearRun: () => void;
}

const RUN_TYPES: { id: RunType; label: string; emoji: string; desc: string }[] = [
  { id: 'box',      label: 'Position Box',  emoji: '⬜', desc: 'Stay within current CAGED position' },
  { id: 'diagonal', label: 'Diagonal Run',  emoji: '↗',  desc: '3-per-string, travels across the neck' },
  { id: 'fullNeck', label: 'Full Neck',     emoji: '🎸', desc: 'All positions in ascending pitch order' },
];

// ─── Email gate helpers ───────────────────────────────────────────────────────
const LS_KEY = 'nn_email_captured';
const hasPassedEmailGate = (): boolean => {
  try { return !!localStorage.getItem(LS_KEY); } catch { return false; }
};
const markEmailGatePassed = (email: string) => {
  try {
    localStorage.setItem(LS_KEY, email || 'skipped');
    // ↓ Wire in your email service here, e.g. Formspree / EmailJS
    // if (email) fetch('https://formspree.io/f/YOUR_ID', { method: 'POST', body: JSON.stringify({ email }), headers: { 'Content-Type': 'application/json' } });
  } catch { /* ignore */ }
};
// ─────────────────────────────────────────────────────────────────────────────

const TabGenerator: React.FC<TabGeneratorProps> = ({
  root,
  scaleType,
  position,
  activeRun,
  onRunGenerated,
  onClearRun,
}) => {
  const [runType, setRunType] = useState<RunType>('diagonal');
  const [direction, setDirection] = useState<'Ascending' | 'Descending' | 'Up & Down'>('Ascending');
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const tabText = activeRun ? getRunTabContent(activeRun, direction) : null;
  const runLabel = RUN_TYPES.find(r => r.id === runType)?.label ?? '';

  const handleGenerate = () => {
    let notes: RunNote[];
    if (runType === 'box') notes = generateBoxRun(root, scaleType, position);
    else if (runType === 'diagonal') notes = generateDiagonalRun(root, scaleType);
    else notes = generateFullNeckRun(root, scaleType);
    onRunGenerated(notes);
  };

  const doDownload = async () => {
    if (!exportRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(exportRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `NeckNinja_${root}_${scaleType.replace(/\s/g, '_')}_${runType}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    if (hasPassedEmailGate()) {
      doDownload();
    } else {
      setShowEmailGate(true);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markEmailGatePassed(emailInput.trim());
    setShowEmailGate(false);
    doDownload();
  };

  const handleSkip = () => {
    markEmailGatePassed('');
    setShowEmailGate(false);
    doDownload();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">

      {/* Hidden export card — captured as PNG */}
      <div
        ref={exportRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          background: '#0f172a',
          padding: '24px 28px',
          borderRadius: 12,
          width: 'max-content',
          maxWidth: 800,
          fontFamily: '"Courier New", Courier, monospace',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>NECKNINJA</span>
          <span style={{ color: '#475569', fontSize: 10 }}>neckninja.app</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 18, marginTop: 0 }}>
          {root} {scaleType} · {runLabel} · {direction}
        </p>
        <pre style={{ color: '#4ade80', fontSize: 14, lineHeight: 1.8, margin: 0, whiteSpace: 'pre' }}>
          {tabText ?? ''}
        </pre>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div>
          <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
            <span>↗</span> Neck Runs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate a scale run — numbers appear on the neck above
          </p>
        </div>
        {activeRun && (
          <button
            onClick={onClearRun}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Clear run"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 flex-1 flex flex-col">
        {/* Run type */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Run Type</p>
          <div className="grid grid-cols-3 gap-1.5">
            {RUN_TYPES.map(rt => (
              <button
                key={rt.id}
                onClick={() => setRunType(rt.id)}
                className={clsx(
                  'flex flex-col items-center p-2 rounded-lg border text-center transition-colors',
                  runType === rt.id
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700'
                )}
              >
                <span className="text-lg leading-none mb-1">{rt.emoji}</span>
                <span className="text-[10px] font-bold leading-tight">{rt.label}</span>
                <span className={clsx('text-[9px] mt-0.5 leading-tight', runType === rt.id ? 'text-violet-200' : 'text-slate-400 dark:text-slate-500')}>
                  {rt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Direction */}
        <div>
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
          className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] text-sm"
        >
          Generate Run
        </button>

        {/* Tab output */}
        {tabText ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {activeRun?.length} notes · {direction}
              </span>
            </div>

            <pre className="p-3 bg-slate-900 text-green-400 font-mono text-xs rounded-lg overflow-x-auto border border-slate-700 shadow-inner leading-relaxed">
              {tabText}
            </pre>

            {/* Email gate — shown only on first download */}
            {showEmailGate ? (
              <form
                onSubmit={handleEmailSubmit}
                className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-3.5 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-violet-500 shrink-0" />
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                    Get free scale tips in your inbox
                  </p>
                </div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors"
                  >
                    <Download size={13} />
                    Download Image
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={handleDownloadClick}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-green-400 font-bold text-sm border border-slate-700 dark:border-slate-600 transition-colors active:scale-[0.98] disabled:opacity-60"
              >
                <Download size={15} />
                {downloading ? 'Downloading…' : 'Download Image'}
                <ChevronRight size={13} className="opacity-40" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 leading-relaxed">
            Pick a run type and hit <strong className="text-slate-500 dark:text-slate-400 mx-1">Generate Run</strong> — numbered sequence appears on the neck above
          </div>
        )}
      </div>
    </div>
  );
};

export default TabGenerator;
