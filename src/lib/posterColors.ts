import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { Title } from './catalog';
import { posterUrl } from './tmdb';

/** Couleurs tirées de l'affiche : [couleur vive, couleur plus profonde]. Calculé une fois par affiche. */
const cache = new Map<string, [string, string] | null>();

const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

function extract(url: string): Promise<[string, string] | null> {
  return new Promise((resolve) => {
    const img = new (globalThis as any).Image() as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(null);
    img.onload = () => {
      try {
        const W = 24, H = 36;
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const cx = cv.getContext('2d'); if (!cx) return resolve(null);
        cx.drawImage(img, 0, 0, W, H);
        const d = cx.getImageData(0, 0, W, H).data;
        let r = 0, g = 0, b = 0, w = 0, r2 = 0, g2 = 0, b2 = 0, n2 = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2];
          const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
          const sat = mx ? (mx - mn) / mx : 0, lum = (R + G + B) / 3;
          const wt = sat * sat * (lum > 25 && lum < 235 ? 1 : 0.2) + 0.02;
          r += R * wt; g += G * wt; b += B * wt; w += wt;
          if (y > H * 0.55) { r2 += R; g2 += G; b2 += B; n2++; }
        }
        resolve([hex(r / w, g / w, b / w), hex(r2 / n2, g2 / n2, b2 / n2)]);
      } catch { resolve(null); }
    };
    img.src = url;
  });
}

export function usePosterColors(t?: Title): [string, string] | null {
  const url = t?.poster && Platform.OS === 'web' ? posterUrl(t.poster, 'w342') : '';
  const [c, setC] = useState<[string, string] | null>(url && cache.has(url) ? cache.get(url)! : null);
  useEffect(() => {
    if (!url) return;
    if (cache.has(url)) { setC(cache.get(url)!); return; }
    let alive = true;
    extract(url).then((v) => { cache.set(url, v); if (alive) setC(v); });
    return () => { alive = false; };
  }, [url]);
  return c;
}

/** Mélange une couleur avec le fond de l'app pour garder le texte lisible. */
export function shade(hexColor: string, amount: number, base = '#12121C') {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hexColor), b = p(base);
  return hex(a[0] * amount + b[0] * (1 - amount), a[1] * amount + b[1] * (1 - amount), a[2] * amount + b[2] * (1 - amount));
}
