import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Background = () => {
  const frame = useCurrentFrame();
  const hueShift = interpolate(frame, [0, 420], [0, 30]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${270 + hueShift}, 60%, 8%) 0%, hsl(${290 + hueShift}, 50%, 12%) 50%, hsl(${310 + hueShift}, 40%, 6%) 100%)`,
      }}
    />
  );
};