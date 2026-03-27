import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

export const StepCard = ({
  stepNumber,
  title,
  subtitle,
  icon,
}: {
  stepNumber: string;
  title: string;
  subtitle: string;
  icon: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const y = interpolate(enter, [0, 1], [60, 0]);

  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${y}px)`,
        display: "flex",
        alignItems: "center",
        gap: 28,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 24,
        padding: "28px 36px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: "linear-gradient(135deg, #c026d3, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ color: "#c084fc", fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
          Step {stepNumber}
        </div>
        <div style={{ color: "white", fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>
          {title}
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 22, marginTop: 4 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
};