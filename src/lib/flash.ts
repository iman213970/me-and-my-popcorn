/** Petit message qui apparaît quelques secondes (ajout, épisode vu, etc.). */
type L = (msg: string) => void;
let listener: L | null = null;
export const onFlash = (l: L | null) => { listener = l; };
export const flash = (msg: string) => { listener?.(msg); };
