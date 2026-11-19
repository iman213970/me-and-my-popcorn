import { useCallback, useEffect, useRef, useState } from 'react';

/** Brouillon gardé sur cet appareil : on retrouve son texte si on ferme l'appli avant d'envoyer. */
export function useDraft(key: string): [string, (v: string) => void, () => void] {
  const k = 'popcorn-draft:' + key;
  const read = () => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };
  const [text, setText] = useState(read);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setText(read()); }, [k]);
  const set = useCallback((v: string) => {
    setText(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* stockage indisponible */ } }, 300);
  }, [k]);
  const clear = useCallback(() => { clearTimeout(timer.current); setText(''); try { localStorage.removeItem(k); } catch { /* rien */ } }, [k]);
  return [text, set, clear];
}
