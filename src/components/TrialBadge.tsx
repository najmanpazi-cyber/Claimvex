import type { TrialStatus } from "@/services/trialService";

const BADGE_STYLES = {
  teal: "bg-cv-secondary/10 text-cv-secondary border-cv-secondary/20",
  gray: "bg-gray-100 text-gray-500 border-gray-200",
  green: "bg-green-50 text-green-700 border-green-200",
};

export default function TrialBadge({ status }: { status: TrialStatus }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${BADGE_STYLES[status.badgeColor]}`}>
      {status.badgeLabel}
    </span>
  );
}
