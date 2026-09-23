/**
 * TrackWeb Motion mark — the iOS AE/AF-lock square (with its four inward
 * ticks) holding a tracked point, plus one faint sample of the motion trail
 * that led it there. Reads as a single silhouette at 16px.
 */
export function Mark({
  size = 28,
  className = "",
  title = "TrackWeb Motion",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <rect x="4.5" y="4.5" width="23" height="23" rx="3.2" stroke="#FFD60A" strokeWidth="2.4" />
      <path
        d="M16 4.5V9M16 27.5V23M4.5 16H9M27.5 16H23"
        stroke="#FFD60A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.9" fill="#fff" />
      <circle cx="11.6" cy="20.4" r="1.25" fill="#fff" fillOpacity="0.5" />
    </svg>
  );
}
