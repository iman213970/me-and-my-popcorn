/** Palette « salle de cinéma » : anthracite chaud, rouge cinéma, crème, or. */
export const C = {
  bg: '#16100E',
  sf: '#211815',
  sf2: '#2E221D',
  line: '#3D2D26',
  tx: '#F7EDE0',
  mu: '#B9A692',
  ac: '#E4572E',
  acfg: '#1A0E0A',
  wine: '#7B1E2F',
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
  'En cours': ['#3F2C0E', '#F0B84F'],
  'À regarder': ['#43202A', '#F6B5A8'],
  'Terminé': ['#1F3326', '#9AD3A6'],
  'Abandonné': ['#322826', '#B9A692'],
};
/** Nom affiché d'un statut (la donnée reste « Terminé »). */
export const STATUS_LABEL: Record<string, string> = { 'Terminé': 'Vu' };
export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;
