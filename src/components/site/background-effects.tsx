export function BackgroundEffects() {
  return (
    <div aria-hidden="true" className="qt-bg-fx">
      <div className="qt-bg-mesh" />
      <svg
        className="qt-bg-noise"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="qt-noise-filter">
          <feTurbulence
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
            type="fractalNoise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          filter="url(#qt-noise-filter)"
          height="100%"
          width="100%"
        />
      </svg>
    </div>
  );
}
