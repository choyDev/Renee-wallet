import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[var(--brand-600)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
