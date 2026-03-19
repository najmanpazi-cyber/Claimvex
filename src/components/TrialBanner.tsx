import { useState } from "react";

interface TrialBannerProps {
  daysRemaining: number;
}

export default function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="material-symbols-outlined text-amber-600 text-lg">schedule</span>
          <span className="text-amber-800 font-medium">
            Your free trial ends in <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong>.
          </span>
          <a
            href="mailto:pazi@claimvex.com?subject=ClaimVex%20—%20Continue%20after%20trial"
            className="text-amber-700 font-semibold hover:text-amber-900 underline underline-offset-2 transition-colors"
          >
            Learn about continuing →
          </a>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}
