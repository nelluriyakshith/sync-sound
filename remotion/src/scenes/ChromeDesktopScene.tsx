import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { StepCard } from "../components/StepCard";

const { fontFamily } = loadFont("normal", { weights: ["600", "700"], subsets: ["latin"] });

export const ChromeDesktopScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 20 } });
  const headY = interpolate(headIn, [0, 1], [50, 0]);

  return (
    <AbsoluteFill style={{ fontFamily, padding: "120px 60px", display: "flex", flexDirection: "column" }}>
      <div style={{ opacity: headIn, transform: `translateY(${headY}px)`, marginBottom: 16 }}>
        <div style={{ fontSize: 26, color: "#c084fc", fontWeight: 600, marginBottom: 8 }}>💻 Desktop</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
          Chrome / Edge
        </div>
      </div>
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 24 }}>
        <Sequence from={15}>
          <StepCard stepNumber="1" title='Click ⋮ menu' subtitle="Top-right of browser" icon="☰" />
        </Sequence>
        <Sequence from={35}>
          <StepCard stepNumber="2" title='"Install app"' subtitle='Or "Install Sync Sound"' icon="📥" />
        </Sequence>
        <Sequence from={55}>
          <StepCard stepNumber="3" title="Click Install" subtitle="App appears on desktop!" icon="✅" />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};