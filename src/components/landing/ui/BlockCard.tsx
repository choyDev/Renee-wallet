// src/components/ui/BlockCard.tsx
import * as React from "react";

type Props = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function BlockCard({ title, icon, children, className = "" }: Props) {
  return (
    <div
      className={[
        "relative rounded-[20px] overflow-hidden isolate",
        // LIGHT: solid white + crisp separation
        "bg-white border border-slate-200 shadow-[0_8px_24px_rgba(2,6,23,0.06)]",
        // DARK: glassy surface
        "dark:bg-white/[0.03] dark:border-white/10 dark:shadow-[0_8px_32px_rgba(2,6,23,0.35)]",
        className,
      ].join(" ")}
    >
      {/* Inner ring — darker in LIGHT using primary with higher alpha */}
      <div className="
        pointer-events-none absolute inset-px rounded-[18px]
        bg-gradient-to-b from-[color:var(--color-primary)]/[0.35] to-transparent
        dark:from-white/[0.06]
      " />

      {/* Corner glow — stronger in LIGHT, same hue; slightly stronger in DARK */}
      <div className="
        pointer-events-none absolute -top-16 -left-24 h-56 w-56 rounded-full blur-3xl
        bg-[color:var(--color-primary)]/[0.45]
        dark:bg-[color:var(--color-primary)]/[0.18]
      " />

      <div className="relative p-6">
        <div className="mb-3 flex items-center gap-3">
          {/* Chip — darker primary in LIGHT */}
          <div
            className={[
              "grid h-9 w-9 place-items-center rounded-xl",
              "bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/40 text-[color:var(--color-primary)]", // LIGHT
              "dark:bg-white/6 dark:border-[color:var(--color-primary)]/30 dark:text-[color:var(--color-primary)]", // DARK
            ].join(" ")}
          >
            {icon ?? (
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path fill="currentColor" d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7z" />
              </svg>
            )}
          </div>
          <h3 className="text-[15px] font-semibold leading-none text-slate-900 dark:text-white/90">
            {title}
          </h3>
        </div>

        <div className="text-[13.5px] leading-6 text-slate-700 dark:text-white/80">
          {children}
        </div>
      </div>
    </div>
  );
}
