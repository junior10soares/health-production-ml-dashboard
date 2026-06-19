"use client";

import { useState } from "react";
import { predict } from "../lib/api";

const DRIFT_SAMPLE =
  "Pursuant to subsection 4(b)(ii) of the indemnification clause, the licensee shall execute a recursive merge sort algorithm on the aforementioned tortious liability dataset prior to remand.";

const INJECTION_COUNT = 10;

interface DriftInjectorButtonProps {
  onInjected: () => void;
}

export function DriftInjectorButton({ onInjected }: DriftInjectorButtonProps) {
  const [injecting, setInjecting] = useState(false);

  async function handleClick() {
    setInjecting(true);
    try {
      for (let i = 0; i < INJECTION_COUNT; i++) {
        await predict(DRIFT_SAMPLE);
        // Refresh after each request so the dashboard can catch a brief
        // alert window even if auto-reindex resets it before the next poll tick.
        onInjected();
      }
    } finally {
      setInjecting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={injecting}
      title={`Submits ${INJECTION_COUNT} out-of-domain (legal jargon) requests in sequence to reliably trigger visible drift`}
      className="rounded border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 disabled:opacity-50"
    >
      {injecting ? `Injecting drift... (${INJECTION_COUNT} requests)` : "Inject Synthetic Drift (Demo)"}
    </button>
  );
}
