import type { CSSProperties, ReactNode } from "react";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * A box with the image's exact aspect ratio that covers its container
 * (a `.cq` size container) while keeping the focal point (fx, fy) in view.
 * Anything placed inside in % lands on the same pixel of the photo.
 */
export function Cover({
  ratio,
  fx = 0.5,
  fy = 0.5,
  className = "",
  children,
}: {
  ratio: number;
  fx?: number;
  fy?: number;
  className?: string;
  children: ReactNode;
}) {
  const style: Vars = { "--r": ratio, "--fx": fx, "--fy": fy };
  return (
    <div className={`cover ${className}`} style={style}>
      {children}
    </div>
  );
}

/** The yellow AE/AF lock square. Animates (hunt → lock → pulse) when revealed. */
export function Lock({
  x,
  y,
  size,
  tag,
  delay = 0,
  className = "",
}: {
  x: number;
  y: number;
  size: number;
  tag?: string;
  delay?: number;
  className?: string;
}) {
  const style: Vars = {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${size * 100}%`,
    "--d": `${delay}ms`,
  };
  return (
    <div className={`af ${className}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M50 0v9M50 100v-9M0 50h9M100 50h-9"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {tag ? <span className="af-tag">{tag}</span> : null}
    </div>
  );
}

/** Viewfinder frame lines in the four corners. */
export function Corners({
  inset = 16,
  size = 22,
  className = "",
}: {
  inset?: number;
  size?: number;
  className?: string;
}) {
  const style: Vars = { inset: `${inset}px`, "--s": `${size}px` };
  const c = "absolute h-[var(--s)] w-[var(--s)] border-white/70";
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute ${className}`} style={style}>
      <span className={`${c} left-0 top-0 rounded-tl-[4px] border-l-[1.5px] border-t-[1.5px]`} />
      <span className={`${c} right-0 top-0 rounded-tr-[4px] border-r-[1.5px] border-t-[1.5px]`} />
      <span className={`${c} bottom-0 left-0 rounded-bl-[4px] border-b-[1.5px] border-l-[1.5px]`} />
      <span className={`${c} bottom-0 right-0 rounded-br-[4px] border-b-[1.5px] border-r-[1.5px]`} />
    </div>
  );
}

/* Pixel "deal with it" shades on a 26 × 5 grid. */
const SHADE_BLACK: [number, number, number, number][] = [
  [0, 0, 26, 1],
  [1, 1, 24, 1],
  [1, 2, 10, 1],
  [15, 2, 10, 1],
  [2, 3, 9, 1],
  [15, 3, 9, 1],
  [3, 4, 7, 1],
  [16, 4, 7, 1],
];
const SHADE_GLINT: [number, number][] = [
  [4, 2],
  [3, 3],
  [18, 2],
  [17, 3],
];

export function PixelShades({ x, y, w }: { x: number; y: number; w: number }) {
  const style: CSSProperties = { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%` };
  return (
    <div className="shades" style={style} aria-hidden="true">
      <svg viewBox="0 0 26 5" shapeRendering="crispEdges">
        {SHADE_BLACK.map(([a, b, c, d], i) => (
          <rect key={i} x={a} y={b} width={c} height={d} fill="#050505" />
        ))}
        {SHADE_GLINT.map(([a, b], i) => (
          <rect key={`g${i}`} x={a} y={b} width={1} height={1} fill="#ffffff" />
        ))}
      </svg>
    </div>
  );
}

/** Tracked samples along a quadratic path, drawn in image space. */
export function TrackPath({
  ratio,
  from,
  via,
  to,
  count = 11,
}: {
  ratio: number;
  from: [number, number];
  via: [number, number];
  to: [number, number];
  count?: number;
}) {
  const W = 100 * ratio;
  const pts = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const u = 1 - t;
    const x = u * u * from[0] + 2 * u * t * via[0] + t * t * to[0];
    const y = u * u * from[1] + 2 * u * t * via[1] + t * t * to[1];
    return [x * W, y * 100] as const;
  });
  return (
    <svg
      className="trk pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} 100`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ")}
        fill="none"
        stroke="rgba(255,214,10,0.38)"
        strokeWidth="1"
        strokeDasharray="3 5"
        vectorEffect="non-scaling-stroke"
      />
      {pts.slice(0, -1).map(([x, y], i) => {
        const style: Vars = { "--o": (0.2 + 0.75 * (i / (count - 1))).toFixed(2), "--i": i };
        return <circle key={i} cx={x} cy={y} r={0.6} fill="#FFD60A" style={style} />;
      })}
    </svg>
  );
}
