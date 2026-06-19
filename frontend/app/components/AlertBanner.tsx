"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  active: boolean;
}

export function AlertBanner({ active }: AlertBannerProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: -16, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -16, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200 shadow-[0_0_25px_-5px_rgba(244,63,94,0.5)]">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
            </span>
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <p className="text-sm font-medium">
              <span className="font-semibold">Drift detectado</span> — a distribuição de
              referência do modelo mudou. A reindexação automática será disparada em breve.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
