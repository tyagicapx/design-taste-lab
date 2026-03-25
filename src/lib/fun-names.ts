const ADJECTIVES = [
  'Cosmic', 'Velvet', 'Electric', 'Neon', 'Crystal', 'Midnight',
  'Golden', 'Phantom', 'Lunar', 'Solar', 'Mystic', 'Atomic',
  'Turbo', 'Zen', 'Pixel', 'Sonic', 'Prism', 'Ember',
  'Frost', 'Nova', 'Shadow', 'Coral', 'Ivory', 'Obsidian',
  'Crimson', 'Azure', 'Jade', 'Amber', 'Indigo', 'Sage',
];

const NOUNS = [
  'Palette', 'Canvas', 'Spectrum', 'Spark', 'Drift', 'Wave',
  'Bloom', 'Glow', 'Prism', 'Pulse', 'Horizon', 'Orbit',
  'Realm', 'Echo', 'Voyage', 'Mirage', 'Aura', 'Vibe',
  'Flare', 'Shift', 'Mosaic', 'Cipher', 'Signal', 'Tone',
  'Texture', 'Flow', 'Grid', 'Layer', 'Frame', 'Sketch',
];

const EMOJIS = [
  '🎨', '✨', '🌈', '🔮', '💎', '🪐', '🌊', '🔥',
  '⚡', '🍭', '🎭', '🧊', '🌸', '🎪', '🦋', '🌙',
  '☀️', '🎯', '🧬', '💜', '🖤', '🤍', '💫', '🫧',
  '🪩', '🎹', '🧿', '🌿', '🍂', '🪸',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateFunName(): { name: string; emoji: string } {
  return {
    name: `${pick(ADJECTIVES)} ${pick(NOUNS)}`,
    emoji: pick(EMOJIS),
  };
}
