interface AlertBannerProps {
  active: boolean;
}

export function AlertBanner({ active }: AlertBannerProps) {
  if (!active) return null;

  return (
    <div className="animate-pulse rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-800 font-medium">
      Drift Detected — model reference distribution has shifted. Auto-reindex will trigger
      shortly.
    </div>
  );
}
