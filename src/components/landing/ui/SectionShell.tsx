import * as React from "react";

type SectionShellProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
  containerClassName?: string;
  disableBloom?: boolean;
};

export default function SectionShell({
  id,
  className = "",
  containerClassName = "",
  disableBloom = false,
  children,
  ...rest
}: SectionShellProps) {
  return (
    <section id={id} className={`relative overflow-x-clip ${className}`} {...rest}>
      {!disableBloom && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className={[
              "absolute left-1/2 -translate-x-1/2 -top-20 rounded-full",
              "h-[220px] w-[320px] sm:h-[280px] sm:w-[460px] md:h-[340px] md:w-[620px] lg:h-[420px] lg:w-[820px]",
              "blur-[60px] md:blur-[80px] lg:blur-[90px]",
              "bg-[color:var(--color-primary)]/[0.10] dark:bg-[color:var(--color-primary)]/[0.10]",
            ].join(" ")}
          />
        </div>
      )}
      <div className={`container max-w-7xl px-6 py-12 ${containerClassName}`}>{children}</div>
    </section>
  );
}
