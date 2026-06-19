"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ThumbsUp, ThumbsDown, ShieldAlert, Loader2, Info } from "lucide-react";
import { predict } from "../lib/api";
import type { PredictResponse } from "../lib/types";

interface PredictFormProps {
  onResult: () => void;
}

const LABEL_PT: Record<PredictResponse["label"], string> = {
  positive: "Positivo",
  negative: "Negativo",
};

export function PredictForm({ onResult }: PredictFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await predict(text);
      setResult(response);
      onResult();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao analisar o texto");
    } finally {
      setLoading(false);
    }
  }

  const isPositive = result?.label === "positive";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Send className="h-4 w-4 text-indigo-400" />
        Analisar frase
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma frase para analisar..."
          className="min-h-24 resize-none rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando... (modelo pode estar inicializando)
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Analisar
            </>
          )}
        </motion.button>
      </form>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        O modelo de embeddings (MiniLM) é majoritariamente treinado em inglês; em português a
        acurácia fica em torno de 84%, ainda assim bem acima do acaso.
      </p>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm"
          >
            <div className="flex items-center gap-2">
              {isPositive ? (
                <ThumbsUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <ThumbsDown className="h-4 w-4 text-rose-400" />
              )}
              <span className={isPositive ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"}>
                {LABEL_PT[result.label]}
              </span>
              <span className="text-slate-400">
                ({(result.confidence * 100).toFixed(1)}% de confiança)
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence * 100}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`}
              />
            </div>

            <p className="mt-2 text-slate-400">
              Distância de drift: <span className="text-slate-200">{result.driftDistance.toFixed(3)}</span>
            </p>

            {result.isDriftFlagged && (
              <p className="mt-2 flex items-center gap-1.5 font-medium text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                Marcado como fora do domínio de treino
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
