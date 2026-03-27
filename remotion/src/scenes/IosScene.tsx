import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { StepCard } from "../components/StepCard";

const { fontFamily } = loadFont("normal", { weights: ["600", "700"], subsets: ["latin"] });

export const IosScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 20 } });
  const headY = interpolate(headIn, [0, 1], [50, 0]);

  return (
    <AbsoluteFill style={{ fontFamily, padding: "120px 60px", display: "flex", flexDirection: "column" }}>
      <div style={{ opacity: headIn, transform: `translateY(${headY}px)`, marginBottom: 16 }}>
        <div style={{ fontSize: 26, color: "#60a5fa", fontWeight: 600, marginBottom: 8 }}>🍎 iPhone / iPad</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
          Safari Only
        </div>
      </div>
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 24 }}>
        <Sequence from={15}>
          <StepCard stepNumber="1" title="Tap Share ↑" subtitle="Bottom toolbar in Safari" icon="📤" />
        </Sequence>
        <Sequence from={35}>
          <StepCard stepNumber="2" title='"Add to Home Screen"' subtitle="Scroll down to find it" icon="➕" />
        </Sequence>
        <Sequence from={55}>
          <StepCard stepNumber="3" title='Tap "Add"' subtitle="Icon appears on home screen!" icon="✨" />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};