# NeckNinja - Project Context

## Overview
NeckNinja is a guitar learning web app for visualizing scales, chords, and triads on the fretboard. Built with React, TypeScript, and Vite.

## Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via utility classes)
- **Icons**: lucide-react

## Project Structure
```
App.tsx              # Main app component with mode switching and stateful subviews/controls
components/
  Fretboard.tsx           # Horizontal fretboard for scales and All Notes (24-fret chromatic map)
  VerticalScaleFretboard.tsx  # Vertical fretboard layout for scale patterns
  VerticalChordChart.tsx  # Vertical fretboard for chord voicings
  TriadFretboard.tsx      # Vertical fretboard for triad visualization
  TriadChart.tsx          # Mini voicing diagrams for triads
  TabGenerator.tsx        # Neck Runs panel (on disk but not rendered in app)
  Tooltip.tsx             # Portal-based tooltip component (hover/focus triggered)
  WelcomeModal.tsx        # Onboarding modal — tabs: Overview, Scales, Chords, Practice, About
constants.ts         # Note definitions, scales, chords, tuning data
types.ts             # TypeScript type definitions (includes RunNote)
utils/
  musicLogic.ts      # Scale/chord logic + run generators (generateBoxRun, generateDiagonalRun, generateFullNeckRun, getRunTabContent)
```

## Key Features
- **Three modes**: Scales, Chords, Triads — mode switcher lives in the sticky header (always visible)
- **Scales mode -> Available Views**:
  - `Scale Pattern` (CAGED position flow) — horizontal or vertical layout toggle (`scaleLayout`)
  - `All Notes` (chromatic notes on all strings to fret 24)
- **All Notes controls**:
  - Clickable string labels (`6th` to `1st`) to isolate one string (`allNotesStringFilter`)
  - Clickable note dots to filter by that note across all strings (`allNotesNoteFilter`)
  - Neck width (`- / +`) control — horizontal layout only
  - Hint banner above fretboard explaining click-to-filter interactions
- **Available Views layout**: `flex-col` — H/V layout toggle always on row below view toggle
- **Note dot sizes**: standardized to 32px (non-root) / 36px (root) across all fretboards
- **ABC button**: Toggles note name display (A, B, C, etc.)
- **R35 button** (Triads mode): Toggles interval labels (R, 3, 5)
- **Position selector** (Scale Pattern view): Filter by CAGED position (default: `'Full Neck'`)
- **String group selector** (Triads mode): Filter by string groups (1-2-3, 2-3-4, etc.)
- **Dark/Light mode**: Toggle in header
- **Help button** (`?` / `HelpCircle` icon): Reopens WelcomeModal to Overview tab
- **WelcomeModal**: Shown automatically on first visit; `initialTab` prop controls opening tab; dismissed state via `localStorage` key `nn_welcomed`
- **About tab** in WelcomeModal: Creator bio (James Build) + Buy Me a Coffee link
- **Footer**: "Created by James Build · ☕ About" — About opens WelcomeModal to About tab
- **Tooltip**: Wraps any element; renders via React portal to `document.body`
- **Chord display controls** (lg+ top bar, right side): Notes toggle · Shape/All Tones segmented toggle (`chordNoteDisplayMode`) · Core/Full CAGED segmented toggle (`chordCagedScope`) · More Tools (BPM, metronome, play progression, share link)
- **Chord lg+ layout**: two-part — TOP BAR (presets, key, display toggles, More Tools) + MAIN AREA (VerticalChordChart); no sidebar or bottom bar; chord slot editing is mobile-only
- **State persistence**: URL query params restore current mode/settings/chords when the same URL is reopened; includes `scaleLayout` param

## Running the App
```bash
npm install
npm run dev
```

## Common Patterns

### Fretboard Coordinate System (Vertical fretboards)
- Fret lines drawn at: `nutHeight + fretNum * fretHeight`
- Notes/inlays positioned at: `nutHeight + fret * fretHeight - fretHeight / 2`
- The `- fretHeight / 2` centers elements in the fret space ABOVE the fret line

### Note Dot Standard Size
- Non-root: 32px (`w-8 h-8`, offset -16)
- Root: 36px (`w-9 h-9`, offset -18, `ring-2 ring-white`)
- Reference implementation: `TriadFretboard.tsx`

### Display Priority (Triads mode)
When both ABC and R35 are on, ABC (note names) takes priority over R35 (intervals).

### WelcomeModal Tab Control
- `welcomeInitialTab` state in App.tsx passed as `initialTab` prop
- Help `?` button → sets to `'overview'`; Footer About → sets to `'about'`

### Key localStorage Keys
- `nn_welcomed` — WelcomeModal dismissed state
- `nn_email_captured` — legacy Neck Runs download gate (TabGenerator on disk, not rendered)
