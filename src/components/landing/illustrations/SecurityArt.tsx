// Decorative illustration for the Security section (primary-tinted)
// Usage: <SecurityArt className="absolute inset-0" />
export default function SecurityArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 600" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="s-rad" cx="50%" cy="55%" r="60%">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="s-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* base bloom */}
      <ellipse cx="260" cy="360" rx="220" ry="120" fill="url(#s-rad)" />

      {/* shield */}
      <g transform="translate(260,320)">
        <path
          d="M0,-120 C65,-110 95,-95 120,-70 C120,-20 95,25 0,95 C-95,25 -120,-20 -120,-70 C-95,-95 -65,-110 0,-120Z"
          fill="none"
          stroke="url(#s-stroke)"
          strokeWidth="2"
        />
        <path d="M-40,0 l30,30 l60,-60" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* orbits */}
      <path d="M80,280 C180,180 340,180 440,280" fill="none" stroke="url(#s-stroke)" strokeWidth="2" strokeDasharray="6 10" opacity="0.6" />
      <path d="M90,400 C200,480 330,480 440,400" fill="none" stroke="url(#s-stroke)" strokeWidth="2" strokeDasharray="6 10" opacity="0.5" />

      {/* nodes */}
      <circle cx="92" cy="280" r="6" fill="var(--color-primary)" opacity="0.85" />
      <circle cx="438" cy="280" r="6" fill="var(--color-primary)" opacity="0.85" />
      <circle cx="90" cy="400" r="6" fill="var(--color-primary)" opacity="0.5" />
      <circle cx="440" cy="400" r="6" fill="var(--color-primary)" opacity="0.5" />
    </svg>
  );
}
