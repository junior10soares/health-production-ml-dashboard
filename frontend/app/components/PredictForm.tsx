"use client";

import { useState } from "react";
import { predict } from "../lib/api";
import type { PredictResponse } from "../lib/types";

interface PredictFormProps {
  onResult: () => void;
}

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
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a sentence to analyze..."
          className="min-h-24 rounded border border-gray-300 p-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Analyzing... (model may be warming up)" : "Analyze"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm">
          <p>
            Label:{" "}
            <span
              className={`font-semibold ${
                result.label === "positive" ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.label}
            </span>{" "}
            ({(result.confidence * 100).toFixed(1)}% confidence)
          </p>
          <p>Drift distance: {result.driftDistance.toFixed(3)}</p>
          {result.isDriftFlagged && (
            <p className="font-medium text-amber-600">Flagged as out-of-domain</p>
          )}
        </div>
      )}
    </div>
  );
}
