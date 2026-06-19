"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
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
        // Atualiza o painel após cada requisição para capturar o alerta mesmo que
        // o reindex automático o reset antes do próximo ciclo de polling.
        onInjected();
      }
    } finally {
      setInjecting(false);
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={injecting}
      whileTap={{ scale: 0.97 }}
      title={`Envia ${INJECTION_COUNT} requisições fora do domínio (jargão jurídico) em sequência para disparar drift de forma confiável`}
      className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {injecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Injetando drift... ({INJECTION_COUNT} requisições)
        </>
      ) : (
        <>
          <Zap className="h-4 w-4" />
          Injetar Drift Sintético (Demo)
        </>
      )}
    </motion.button>
  );
}
