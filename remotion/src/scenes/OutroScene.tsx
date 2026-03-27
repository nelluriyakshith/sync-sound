import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scaleIn = spring({ frame, fps, config: { damping: 12 } });
  const textIn = spring({ frame: frame - 10, fps, config: { damping: 20 } });
  const textY = interpolate(textIn, [0, 1], [30, 0]);
  const pulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.95, 1.05]);

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 80, transform: `scale(${scaleIn * pulse})`, marginBottom: 30 }}>
        🎉
      </div>
      <div
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: "white",
          opacity: textIn,
          transform: `translateY(${textY}px)`,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        That's it!
      </div>
      <div
        style={{
          fontSize: 32,
          color: "rgba(255,255,255,0.6)",
          marginTop: 16,
          opacity: textIn,
          transform: `translateY(${textY}px)`,
          textAlign: "center",
        }}
      >
        Sync Sound is on your device
      </div>
    </AbsoluteFill>
  );
};