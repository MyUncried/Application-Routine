import Svg, { Circle, Line, Path } from "react-native-svg";

import type { SessionFeeling } from "./endSession";

/**
 * Visages du ressenti à cinq niveaux (D-579, Figma `1992:8718`), dessinés en trait : très mal (yeux en croix, langue tirée, sans bouche
 * ouverte), mal (moue), neutre, bien (sourire), très bien (sourire large, bouche en contour). Icônes seules : le bouton qui les porte
 * est un `Pressable` natif (FeelingButton, `EndSessionScreen`).
 */
export function FeelingFace({ feeling, color, size = 26 }: { readonly feeling: SessionFeeling; readonly color: string; readonly size?: number }) {
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" testID={`feeling-face-${feeling}`}>
      <Circle cx={12} cy={12} r={10} {...stroke} />
      {feeling === "VERY_BAD" ? (
        <>
          <Line x1={7} y1={8} x2={10} y2={11} {...stroke} />
          <Line x1={10} y1={8} x2={7} y2={11} {...stroke} />
          <Line x1={14} y1={8} x2={17} y2={11} {...stroke} />
          <Line x1={17} y1={8} x2={14} y2={11} {...stroke} />
          <Line x1={8} y1={15} x2={16} y2={15} {...stroke} />
          <Path d="M11 15 v2.2 a1.6 1.6 0 0 0 3.2 0 V15" {...stroke} />
        </>
      ) : (
        <>
          <Circle cx={9} cy={9.5} r={1.2} fill={color} />
          <Circle cx={15} cy={9.5} r={1.2} fill={color} />
          {feeling === "BAD" ? <Path d="M8.5 16.5 Q12 13.5 15.5 16.5" {...stroke} /> : null}
          {feeling === "NEUTRAL" ? <Line x1={8.5} y1={15.5} x2={15.5} y2={15.5} {...stroke} /> : null}
          {feeling === "GOOD" ? <Path d="M8.5 14.5 Q12 17.5 15.5 14.5" {...stroke} /> : null}
          {feeling === "VERY_GOOD" ? <Path d="M7.5 13.5 H16.5 Q16 18.5 12 18.5 Q8 18.5 7.5 13.5 Z" {...stroke} /> : null}
        </>
      )}
    </Svg>
  );
}
