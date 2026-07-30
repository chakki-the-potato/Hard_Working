import type { CSSProperties } from "react";

const LINE_COUNT = 18;
const PARTICLE_COUNT = 14;

export function HeroDriftBackground() {
  const opacity = 0.55;
  const duration = 22;
  const lines = Array.from({ length: LINE_COUNT }, (_, index) => ({
    x: 40 + index * 65,
    delay: ((index * 0.7) % duration).toFixed(2),
    height: 120 + ((index * 37) % 280),
  }));
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    cx: (index * 137) % 1200,
    cy: 60 + ((index * 47) % 380),
    radius: 1 + (index % 3) * 0.6,
    duration: 8 + (index % 6) * 1.5,
    delay: (index * 0.4).toFixed(2),
  }));

  return (
    <div aria-hidden="true" className="qt-hero-bg">
      <svg
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 520"
        width="100%"
      >
        <defs>
          <linearGradient id="qt-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop
              offset="40%"
              stopColor="var(--accent)"
              stopOpacity={(0.6 * opacity).toFixed(3)}
            />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {lines.map((line) => (
          <line
            key={line.x}
            stroke="url(#qt-fade)"
            strokeWidth="1"
            style={{
              animation: `qt-drift ${duration}s linear infinite`,
              animationDelay: `-${line.delay}s`,
              transformBox: "fill-box",
            }}
            x1={line.x}
            x2={line.x}
            y1={-line.height}
            y2="0"
          />
        ))}
        {particles.map((particle) => (
          <circle
            cx={particle.cx}
            cy={particle.cy}
            fill="var(--accent)"
            key={`${particle.cx}-${particle.cy}`}
            opacity={(0.18 * opacity).toFixed(3)}
            r={particle.radius}
            style={
              {
                "--float-low": (0.1 * opacity).toFixed(3),
                "--float-high": (0.42 * opacity).toFixed(3),
                animation: `qt-float ${particle.duration}s ease-in-out infinite`,
                animationDelay: `-${particle.delay}s`,
                transformBox: "fill-box",
                transformOrigin: "center",
              } as CSSProperties
            }
          />
        ))}
      </svg>
    </div>
  );
}
