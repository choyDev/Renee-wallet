"use client";

import { useRouter } from "next/navigation";

export default function BackHomeButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push("/")}
            className="
    absolute left-6 top-6 z-50 
    flex items-center gap-2 
    text-black dark:text-white 
    hover:text-[var(--brand-500)]
    hover:dark:text-[var(--brand-600)]
    transition-colors duration-200
  "
        >
            {/* Arrow Icon "<" */}
            <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6L9 12L15 18" />
            </svg>

            <span className="text-sm font-medium">Home</span>
        </button>
    );
}
