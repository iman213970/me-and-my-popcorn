import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { C } from '../lib/theme';

type P = { size?: number; opacity?: number };
const ink = '#2A1812';

/** Seau de popcorn. */
export function PopcornArt({ size = 96, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      {[[32, 32, 13], [47, 24, 14], [63, 27, 13], [74, 38, 11], [40, 42, 12], [58, 41, 13]].map(([x, y, r], k) => (
        <Circle key={k} cx={x} cy={y} r={r} fill="#FFE08A" stroke={ink} strokeWidth={2.2} />
      ))}
      <Path d="M20 48 L80 48 L74 94 L26 94Z" fill="#fff" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M20 48 L32 48 L35 94 L26 94Z M44 48 L56 48 L55 94 L45 94Z M68 48 L80 48 L74 94 L65 94Z" fill={C.ac} />
      <Path d="M20 48 L80 48 L74 94 L26 94Z" fill="none" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
    </Svg>
  );
}

/** Ticket de cinéma. */
export function TicketArt({ size = 96, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      <G rotation={-12} origin="50, 50">
        <Path d="M10 30 H90 V43 A7 7 0 0 0 90 57 V70 H10 V57 A7 7 0 0 0 10 43 Z" fill={C.gold} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
        <Path d="M66 30 V70" stroke={ink} strokeWidth={2} strokeDasharray="4 4" />
        <Path d="M20 42 H54 M20 50 H46 M20 58 H52" stroke={ink} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        <Path d="M78 41 l2.5 5 5.5 .8 -4 3.9 1 5.5 -5 -2.6 -5 2.6 1 -5.5 -4 -3.9 5.5 -.8z" fill={C.wine} />
      </G>
    </Svg>
  );
}

/** Clap de cinéma. */
export function ClapArt({ size = 96, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      <Rect x={14} y={44} width={72} height={44} rx={8} fill="#3A2A24" stroke={ink} strokeWidth={2.4} />
      <Path d="M24 56 H76 M24 68 H60 M24 78 H70" stroke={C.soft} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      <G rotation={-16} origin="14, 42">
        <Rect x={14} y={26} width={74} height={16} rx={5} fill="#fff" stroke={ink} strokeWidth={2.4} />
        <Path d="M26 26 L18 42 M42 26 L34 42 M58 26 L50 42 M74 26 L66 42" stroke={C.ac} strokeWidth={7} />
        <Rect x={14} y={26} width={74} height={16} rx={5} fill="none" stroke={ink} strokeWidth={2.4} />
      </G>
      <Rect x={14} y={42} width={72} height={9} rx={3} fill="#fff" stroke={ink} strokeWidth={2.4} />
      <Path d="M24 42 L18 51 M40 42 L34 51 M56 42 L50 51 M72 42 L66 51" stroke={C.ac} strokeWidth={6} />
    </Svg>
  );
}

/** Bobine de film. */
export function ReelArt({ size = 96, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      <Circle cx={50} cy={50} r={42} fill={C.wine} stroke={ink} strokeWidth={2.4} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const x = 50 + 24 * Math.cos((a * Math.PI) / 180), y = 50 + 24 * Math.sin((a * Math.PI) / 180);
        return <Circle key={a} cx={x} cy={y} r={9} fill={C.bg} stroke={ink} strokeWidth={2} />;
      })}
      <Circle cx={50} cy={50} r={8} fill={C.gold} stroke={ink} strokeWidth={2} />
    </Svg>
  );
}
