/** Palette « salle de cinéma » : anthracite chaud, rouge cinéma, crème, or. */
export const C = {
  bg: '#12121C',
  sf: '#1C1C2B',
  sf2: '#26263A',
  line: '#2E2E45',
  tx: '#F5EFE6',
  mu: '#A3A2BC',
  ac: '#9B7BFF',
  vio: '#C26BFF',
  pink: '#FF6FB5',
  cyan: '#4FE0F0',
  mag: '#FF4FD8',
  acfg: '#12121C',
  wine: '#4A3AA8',
  gold: '#F0B84F',
  mint: '#9AD3A6',
  rose: '#F4A6A0',
  soft: '#EADCC8',
};
export const FONT_DISPLAY = 'Fraunces_700Bold';
export const FONT_DISPLAY_SEMI = 'Fraunces_600SemiBold';
export const SHADOW = '0px 10px 24px rgba(0,0,0,0.38)';
export const SHADOW_SOFT = '0px 6px 16px rgba(0,0,0,0.28)';

export const STATUS_COLORS: Record<string, [string, string]> = {
  'En cours': ['#3A2F12', '#F0B84F'],
  'À regarder': ['#2A2550', '#B4A9FF'],
  'Terminé': ['#1F3326', '#9AD3A6'],
  'Abandonné': ['#3A1D24', '#FF9AA8'],
};
/** Nom affiché d'un statut (la donnée reste « Terminé »). */
export const STATUS_LABEL: Record<string, string> = { 'Terminé': 'Vu' };
export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;

/** Dégradé signature violet vers rose. */
export const SIG: [string, string, string] = ['#8B6BFF', '#C26BFF', '#FF6FB5'];
export const GLOW = '0px 0px 22px rgba(194,107,255,0.5)';
