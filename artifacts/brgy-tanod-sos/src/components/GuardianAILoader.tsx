// src/components/GuardianAILoader.tsx
// Shows Guardian AI status badge (server-side Gemini is always ready)

import { useState } from "react";

type Variant = "admin" | "compact";

interface GuardianAILoaderProps {
  /** "admin"   → full widget shown in the dashboard header (default)
   *  "compact" → slim inline badge for Tanod/Resident views          */
  variant?: Variant;
}

export function GuardianAILoader({ variant = "admin" }: GuardianAILoaderProps) {
  const [ready] = useState(true); // Server-side Gemini AI is always ready

  if (!ready) return null;

  // Server-side AI is always active — show ready badge immediately
  if (variant === "compact") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-900/20 border border-cyan-500/20 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.2)] font-black uppercase tracking-widest">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
        </span>
        AI LINKED
      </span>
    );
  }
  return (
    <div className="flex items-center gap-3 text-cyan-400 text-[10px] font-mono font-black uppercase tracking-[0.2em] px-4 py-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded-full shadow-glow-cyan">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
      </span>
      GUARDIAN_CORE: ACTIVE
    </div>
  );
}
