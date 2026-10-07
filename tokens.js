// All design constants live here. Edit this file to change the video.
export const W = 1920;
export const H = 1080;
export const FPS = 30;

// Palette: background, ink, one accent
export const BG = '#0b0b0f';
export const INK = '#f4f2ec';
export const ACCENT = '#c8ff3d';

// Font (local file in fonts/, see @font-face in index.html)
export const FONT_FAMILY = 'Space Grotesk';
export const FONT_WEIGHT = 700;
export const FONT_SIZE = 168;      // max size; long lines shrink to fit
export const MIN_FONT_SIZE = 72;   // below this we refuse to render

// Layout
export const MARGIN = 144;         // nothing may be drawn outside this
export const RISE = 40;            // px a card rises while fading in

// Timing (seconds)
export const FADE_IN = 0.5;
export const FADE_OUT = 0.25;
export const LEAD = 1.0;           // empty background before the first card
export const GAP = 0.7;            // empty background between cards
export const TAIL = 1.2;           // empty background after the last card

// One *starred* word per line takes the accent colour. 1-6 words per line.
export const LINES = [
  'Every frame is *code*',
  'Nothing is *filmed*',
  'Same *input*',
  'Same *pixels*',
  'Render it *free*',
];
