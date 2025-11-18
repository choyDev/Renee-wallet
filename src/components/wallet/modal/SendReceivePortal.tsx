"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function SendReceivePortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden"; // disable scroll
    return () => {
      document.body.style.overflow = "auto"; // restore scroll
    };
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
