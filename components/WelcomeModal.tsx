import React, { useEffect, useState } from 'react';
import { Music, Layers, Triangle, X, Sparkles, Timer, User, Coffee } from 'lucide-react';
import clsx from 'clsx';

interface WelcomeModalProps {
  onClose: () => void;
  initialTab?: Tab;
}

type Tab = 'overview' | 'scales' | 'chords' | 'practice' | 'about';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Overview',  icon: <Sparkles size={13} /> },
  { id: 'scales',    label: 'Scales',    icon: <Music size={13} /> },
  { id: 'chords',    label: 'Chords',    icon: <Layers size={13} /> },
  { id: 'practice',  label: 'Practice',  icon: <Timer size={13} /> },
  { id: 'about',     label: 'About',     icon: <Coffee size={13} /> },
];

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-3.5">
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</p>
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">{children}</div>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        NeckNinja has three sections — pick the one that matches what you're working on:
      </p>

      {[
        {
          icon: <Music size={18} className="text-violet-500 shrink-0 mt-0.5" />,
          title: 'Scales',
          body: 'Visualize scales across the neck by box position or see every note on every string. Great for soloing and fretboard memorization.',
        },
        {
          icon: <Layers size={18} className="text-violet-500 shrink-0 mt-0.5" />,
          title: 'Chords',
          body: 'Build a chord progression and see every voicing of each chord up the neck via CAGED shapes. Use presets to instantly load common progressions.',
        },
        {
          icon: <Triangle size={18} className="text-violet-500 shrink-0 mt-0.5" />,
          title: 'Triads',
          body: 'See the 3-note core of every chord across different string groups. Essential for melodic rhythm playing and chord inversions.',
        },
      ].map(({ icon, title, body }) => (
        <div key={title} className="flex gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
          {icon}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{body}</p>
          </div>
        </div>
      ))}

      <Tip>
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">💡 Start here</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 leading-relaxed">
          Go to <strong>Scales → Scale Pattern</strong>, pick any root and <strong>Minor Pentatonic</strong>, then select <strong>Box 1</strong>. That single box shape is the foundation of most rock and blues soloing.
        </p>
      </Tip>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Use the tabs above to learn about each section in detail.
      </p>
    </div>
  );
}

function ScalesTab() {
  return (
    <div className="space-y-3">
      <Section title="The 5 Box Positions">
        <p>The neck is divided into 5 overlapping boxes. Each box is a group of scale notes you can play within a ~4-fret window. Each box is color-coded.</p>
        <p className="mt-1"><strong className="text-slate-700 dark:text-slate-300">Box 1</strong> is always the lowest position on the neck for your key. Work through Box 1 → Box 5 to map the full neck.</p>
      </Section>

      <Section title="Scale Pattern vs All Notes">
        <p><strong className="text-slate-700 dark:text-slate-300">Scale Pattern</strong> — shows notes filtered to a specific box position. Use the position selector to focus on one box at a time.</p>
        <p><strong className="text-slate-700 dark:text-slate-300">All Notes</strong> — shows every occurrence of every scale note across all 24 frets, colored by note name. Great for seeing the big picture.</p>
      </Section>

      <Section title="Horizontal vs Vertical Layout">
        <p><strong className="text-slate-700 dark:text-slate-300">Horizontal</strong> — the neck runs left to right, like looking down at your guitar from above. Best for seeing the whole neck at once.</p>
        <p><strong className="text-slate-700 dark:text-slate-300">Vertical</strong> — the neck runs top to bottom, like a chord diagram. Easier to compare with what you actually see while playing.</p>
      </Section>

      <Tip>
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">💡 Practice tip</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 leading-relaxed">
          Start with Box 1, then learn the box directly above it (Box 2). Those two positions cover the most common solo territory for any key before you expand up the neck.
        </p>
      </Tip>
    </div>
  );
}

function ChordsTab() {
  return (
    <div className="space-y-3">
      <Section title="Progression Presets">
        <p>Click a preset like <strong className="text-slate-700 dark:text-slate-300">I-V-vi-IV</strong> and it instantly fills your chord slots with the correct chords for your chosen key. Change the key dropdown to transpose the whole progression.</p>
        <p className="mt-1">You can also build a custom progression by editing each chord slot manually.</p>
      </Section>

      <Section title="Core CAGED vs Full CAGED">
        <p><strong className="text-slate-700 dark:text-slate-300">Core CAGED</strong> — shows the 3 most practical shapes (A, E, D). The best starting point — these cover the most common chord voicings guitarists actually use.</p>
        <p><strong className="text-slate-700 dark:text-slate-300">Full CAGED</strong> — shows all 5 shapes across the entire neck. Use this once you're comfortable with the core shapes and want to map the full neck.</p>
      </Section>

      <Section title="Adding Chords">
        <p>Click the dashed <strong className="text-slate-700 dark:text-slate-300">+ Add Chord</strong> card to add up to 5 chords. Each chord has its own fretboard showing all its voicings. Hit <strong className="text-slate-700 dark:text-slate-300">Remove</strong> on any card to remove it.</p>
      </Section>

      <Tip>
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">💡 Pro tip</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 leading-relaxed">
          After loading a preset, switch to <strong>Scales</strong> mode — the <strong>Solo Scale Suggestions</strong> panel updates automatically with the best scales to solo over your progression.
        </p>
      </Tip>
    </div>
  );
}

function PracticeTab() {
  return (
    <div className="space-y-3">
      <Section title="Metronome">
        <p>Set your BPM with the slider and hit <strong className="text-slate-700 dark:text-slate-300">Start Metronome</strong>. Beat 1 of every bar plays slightly louder so you can feel the downbeat.</p>
        <p className="mt-1">Start slow — 60 BPM — until the pattern is clean and automatic. Only then push the tempo up. Speed is a result of accuracy, not the other way around.</p>
      </Section>

      <Section title="Play Progression">
        <p>In <strong className="text-slate-700 dark:text-slate-300">Chords</strong> mode, hit <strong className="text-slate-700 dark:text-slate-300">Play Progression</strong> and the app cycles through your chords one bar at a time at the current BPM. The active chord highlights on the fretboard so you always know where you are.</p>
        <p className="mt-1">If you have a <strong className="text-slate-700 dark:text-slate-300">looper pedal</strong>, record one pass of your progression into it, then let NeckNinja run alongside — you get real backing chords to solo or comp over while keeping your hands free on the guitar.</p>
      </Section>

      <Tip>
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">💡 The CAGED looper challenge</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 leading-relaxed">
          Using a looper pedal, create a loop of your progression and make a rule: every time a chord comes around, play it in a <strong>different CAGED shape</strong> than last time. Four passes through the progression = four different voicings. This is one of the fastest ways to build real neck fluency.
        </p>
      </Tip>

      <Tip>
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">💡 Soloing over the progression</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 leading-relaxed">
          Whether you're using a looper pedal or just following along, watch the highlighted chord and target its <strong>root, 3rd, and 5th</strong> as landing notes — those are the notes that make your solo sound intentional rather than random.
        </p>
      </Tip>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <User size={20} className="text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">James Build</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Creator of NeckNinja</p>
        </div>
      </div>

      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
        <p>
          I'm a self-taught guitarist who finally got serious about learning theory and actually knowing my way around the fretboard — so I built NeckNinja.
        </p>
        <p>
          Started it just for myself, then figured there were probably others out there like me: beginner to intermediate players who've burned through more YouTube, TikTok, and Instagram videos than they can count, still trying to connect the dots. That was me.
        </p>
        <p>
          It's free. But if it helps you out, I won't say no to a coffee now and then — keeps me motivated to keep building! Keep playing you've got this!
        </p>
      </div>

      <a
        href="https://buymeacoffee.com/jamesbuild"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#FFDD00] hover:bg-yellow-300 active:bg-yellow-400 text-slate-900 text-sm font-bold transition-colors"
      >
        <Coffee size={16} />
        Buy me a coffee
      </a>
    </div>
  );
}

export default function WelcomeModal({ onClose, initialTab = 'overview' }: WelcomeModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Sync tab when initialTab changes (e.g. footer vs help button)
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 1rem)' }}
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">NeckNinja Guide</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Master the neck — one position at a time.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex-none flex border-b border-slate-100 dark:border-slate-700 px-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body — scrolls independently */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview'  && <OverviewTab />}
          {activeTab === 'scales'    && <ScalesTab />}
          {activeTab === 'chords'    && <ChordsTab />}
          {activeTab === 'practice'  && <PracticeTab />}
          {activeTab === 'about'     && <AboutTab />}
        </div>

        {/* Footer */}
        <div className="flex-none px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-sm font-bold transition-colors"
          >
            Got it, let's play!
          </button>
        </div>
      </div>
    </div>
  );
}
