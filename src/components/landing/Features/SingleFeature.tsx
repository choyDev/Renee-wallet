import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;

  return (
    <div className="w-full">
      <div
        className="
          relative flex flex-col items-center text-center group
          rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)]
          p-8 shadow-[0_0_0_rgba(124,74,255,0)]
          transition-all duration-300
          hover:-translate-y-[6px]
          hover:border-[var(--brand-600)]
          hover:shadow-[0_20px_48px_rgba(110,59,255,0.18)]
          min-h-[280px]
        "
      >

        {/* Glow ring */}
        <div
          className="
            absolute inset-0 rounded-2xl opacity-0 blur-xl
            bg-gradient-to-br
            from-[var(--brand-600)]/10
            via-transparent
            to-[var(--brand-400)]/5
            transition-opacity duration-300
            group-hover:opacity-100
          "
        />

        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Icon */}
          <div
            className="
              mb-8 flex h-[70px] w-[70px] items-center justify-center rounded-xl
              bg-[var(--brand-600)]/10 text-[var(--brand-400)]
              transition-all duration-300
              group-hover:bg-gradient-to-tr
              group-hover:from-[var(--brand-600)]/30
              group-hover:to-[var(--brand-400)]/30
            "
          >
            {icon}
          </div>

          {/* Title */}
          <h3 className="mb-3 text-xl font-semibold text-white">
            {title}
          </h3>

          {/* Description */}
          <p className="text-[15px] leading-relaxed text-slate-400">
            {paragraph}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SingleFeature;
