// Decorative illustration for the Fees section (primary-tinted)
// Usage: <FeesArt className="absolute inset-0" />
export default function FeesArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 600"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <radialGradient id="f-rad" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="f-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="chip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0.08" />
        </linearGradient>

        <mask id="fade">
          <rect width="800" height="600" fill="url(#f-rad)" />
        </mask>
      </defs>

      {/* background bloom */}
      <ellipse cx="560" cy="180" rx="220" ry="120" fill="url(#f-rad)" />

      {/* dotted orbit */}
      <path
        d="M540,200 C620,110 720,180 700,260 C680,335 560,360 480,300"
        fill="none"
        stroke="url(#f-stroke)"
        strokeWidth="2"
        strokeDasharray="6 10"
        opacity="0.65"
      />

      {/* TRY chip */}
      <g transform="translate(480,240)">
        <circle r="26" fill="url(#chip)" stroke="var(--color-primary)" strokeOpacity="0.35" />
        <path d="M-5,0 h10 M-3,-6 h6 M0,-12 v24" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* USDT chip */}
      <g transform="translate(720,260)">
        <circle r="26" fill="url(#chip)" stroke="var(--color-primary)" strokeOpacity="0.35" />
        <path d="M-10,-2 h20 M0,-12 v24 M-6,6 h12" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* network bubble */}
      <g transform="translate(600,140)" opacity="0.9">
        <ellipse rx="90" ry="46" fill="url(#chip)" stroke="var(--color-primary)" strokeOpacity="0.3" />
        <rect x="-20" y="-12" width="40" height="20" rx="10" fill="var(--color-primary)" opacity="0.25" />
      </g>

      {/* fee tag */}
      <g transform="translate(570,220)" opacity="0.85">
        <rect x="-18" y="-10" width="52" height="22" rx="11" fill="var(--color-primary)" opacity="0.25" />
        <path d="M-8,0 h16" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* masked diagonal glow */}
      <g mask="url(#fade)">
        <rect x="380" y="380" width="420" height="260" fill="var(--color-primary)" opacity="0.12" transform="rotate(-18 380 380)" />
      </g>
    </svg>
  );
}
