import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import Svg from 'react-native-svg';

/** Avatars dessinés pour l'app. Un avatar = un seul entier (colonne `avatar` déjà existante),
 *  qui encode : teint, coiffure, couleur de cheveux, couleur du haut. */
export const SKINS = ['#FBE0CF', '#F3C9A5', '#E0A878', '#C48556', '#9C6638', '#6B4226'];
export const HAIR_COLORS = ['#1E1A1A', '#4A2C1A', '#7A4A2A', '#B5532B', '#E8A24A', '#E9D78B', '#5E7DA8', '#D9546A'];
export const SHIRTS = ['#8BA7E0', '#E5646E', '#F2B33D', '#5FB89A', '#8B7CFF', '#34495E', '#E58BB5', '#D8D2C4'];
export const HAIR_NAMES = ['Court', 'Bouclé', 'Long', 'Carré', 'Chignon', 'Couettes', 'Nœud', 'Voile', 'Mèche', 'Bonnet'];

export type AvatarSpec = { skin: number; hair: number; hcol: number; shirt: number };
export const encodeAvatar = (a: AvatarSpec) => a.skin + 6 * (a.hair + 10 * (a.hcol + 8 * a.shirt));
export function decodeAvatar(n: number): AvatarSpec {
  const v = Math.abs(Math.floor(Number.isFinite(n) ? n : 0)) % (6 * 10 * 8 * 8);
  return { skin: v % 6, hair: Math.floor(v / 6) % 10, hcol: Math.floor(v / 60) % 8, shirt: Math.floor(v / 480) % 8 };
}
export const randomAvatar = () => encodeAvatar({
  skin: Math.floor(Math.random() * 6), hair: Math.floor(Math.random() * 10),
  hcol: Math.floor(Math.random() * 8), shirt: Math.floor(Math.random() * 8),
});

const INK = '#2A2024';
const SW = 2.4;

export function AvatarArt({ spec }: { spec: AvatarSpec }) {
  const skin = SKINS[spec.skin];
  const hair = HAIR_COLORS[spec.hcol];
  const shirt = SHIRTS[spec.shirt];
  const h = spec.hair;
  const line = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const fringe = 'M19 54 Q16 22 50 22 Q84 22 81 54 Q66 44 50 34 Q34 44 19 54Z';
  const cap = 'M20 52 Q18 24 50 24 Q82 24 80 52 Q70 40 50 40 Q30 40 20 52Z';
  const swept = 'M19 56 Q14 20 52 22 Q84 24 81 54 Q70 36 40 40 Q26 44 19 56Z';
  const hijab = h === 7;
  return (
    <Svg viewBox="0 0 100 106" width="100%" height="100%">
      {/* arrière des cheveux */}
      {h === 2 || h === 6 ? <Rect x={16} y={38} width={68} height={60} rx={22} fill={hair} {...line} /> : null}
      {h === 3 ? <Rect x={17} y={38} width={66} height={42} rx={17} fill={hair} {...line} /> : null}
      {h === 4 ? <Circle cx={50} cy={19} r={12} fill={hair} {...line} /> : null}
      {h === 5 ? (<G><Circle cx={17} cy={38} r={12} fill={hair} {...line} /><Circle cx={83} cy={38} r={12} fill={hair} {...line} /></G>) : null}
      {/* haut du corps */}
      <Rect x={22} y={88} width={56} height={40} rx={16} fill={shirt} {...line} />
      {hijab ? (<G>
        <Path d="M50 16 Q13 16 13 60 Q13 84 22 104 L78 104 Q87 84 87 60 Q87 16 50 16Z" fill={hair} {...line} />
        <Path d="M24 84 Q30 98 44 103" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.28} />
        <Path d="M76 84 Q70 98 56 103" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.28} />
        <Path d="M30 30 Q50 20 70 30" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.28} />
      </G>) : null}
      {/* oreilles */}
      {hijab ? null : (<G>
        <Circle cx={20} cy={60} r={7} fill={skin} {...line} />
        <Circle cx={80} cy={60} r={7} fill={skin} {...line} />
      </G>)}
      {/* tête */}
      {hijab ? (<G>
        <Ellipse cx={50} cy={60} rx={27} ry={30} fill={skin} {...line} />
        <Ellipse cx={50} cy={60} rx={30} ry={33} fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.3} />
      </G>) : <Circle cx={50} cy={58} r={30} fill={skin} {...line} />}
      {/* devant des cheveux */}
      {h === 0 ? <Path d={cap} fill={hair} {...line} /> : null}
      {h === 1 ? (<G>
        <Path d={cap} fill={hair} {...line} />
        {[[26, 38, 11], [38, 28, 12], [52, 26, 12], [65, 29, 12], [76, 39, 11]].map(([x, y, r], k) => (
          <Circle key={k} cx={x} cy={y} r={r} fill={hair} {...line} />
        ))}
        <Path d="M26 44 Q50 32 74 44 L74 40 Q50 28 26 40Z" fill={hair} />
      </G>) : null}
      {h === 2 || h === 3 || h === 4 || h === 5 || h === 6 ? <Path d={fringe} fill={hair} {...line} /> : null}
      {h === 6 ? (<G>
        <Ellipse cx={70} cy={27} rx={9} ry={6} fill="#E5484D" {...line} transform="rotate(-20 70 27)" />
        <Ellipse cx={86} cy={22} rx={9} ry={6} fill="#E5484D" {...line} transform="rotate(20 86 22)" />
        <Circle cx={78} cy={25} r={4} fill="#E5484D" {...line} />
      </G>) : null}
      {h === 8 ? <Path d={swept} fill={hair} {...line} /> : null}
      {h === 9 ? (<G>
        <Path d="M19 48 Q18 16 50 16 Q82 16 81 48Z" fill={shirt} {...line} />
        <Rect x={17} y={43} width={66} height={11} rx={5.5} fill={shirt} {...line} />
        <Path d="M24 48.5 H76" stroke={INK} strokeWidth={1.4} strokeDasharray="3 3" opacity={0.5} />
        <Circle cx={50} cy={14} r={6} fill={shirt} {...line} />
      </G>) : null}
      {/* visage */}
      <Circle cx={hijab ? 42 : 39} cy={60} r={2.8} fill={INK} />
      <Circle cx={hijab ? 58 : 61} cy={60} r={2.8} fill={INK} />
      <Path d="M45 67 Q50 71.5 55 67" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Ellipse cx={hijab ? 37 : 31} cy={68} rx={5.5} ry={3.6} fill="#F27A7A" opacity={0.85} />
      <Ellipse cx={hijab ? 63 : 69} cy={68} rx={5.5} ry={3.6} fill="#F27A7A" opacity={0.85} />
    </Svg>
  );
}
