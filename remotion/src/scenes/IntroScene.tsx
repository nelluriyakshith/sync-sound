import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const subtitleIn = spring({ frame: frame - 12, fps, config: { damping: 20 } });
  const iconScale = spring({ frame: frame - 5, fps, config: { damping: 8 } });

  const titleY = interpolate(titleIn, [0, 1], [80, 0]);
  const subtitleY = interpolate(subtitleIn, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 36,
          background: "linear-gradient(135deg, #c026d3, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          transform: `scale(${iconScale})`,
          marginBottom: 40,
          boxShadow: "0 20px 60px rgba(192,38,211,0.4)",
        }}
      >
        🔊
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: "white",
          opacity: titleIn,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
        }}
      >
        How to Install
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          background: "linear-gradient(90deg, #c026d3, #7c3aed)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: titleIn,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
        }}
      >
        Sync Sound
      </div>
      <div
        style={{
          fontSize: 30,
          color: "rgba(255,255,255,0.5)",
          marginTop: 24,
          opacity: subtitleIn,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        3 platforms • 30 seconds
      </div>
    </AbsoluteFill>
  );
};