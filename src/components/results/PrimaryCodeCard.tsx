import { ThumbsUp, ThumbsDown, Clock, TrendingUp } from "lucide-react";
import type { PrimaryCode } from "@/types/coding";
import { CptTooltip } from "@/components/CptTooltip";

interface PrimaryCodeCardProps {
  code: PrimaryCode;
  feedbackType: "positive" | "negative" | null;
  onFeedback: (type: "positive" | "negative") => void;
}

const confidenceConfig = {
  high:   { className: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]",   label: "High Confidence" },
  medium: { className: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",   label: "Medium Confidence" },
  low:    { className: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",   label: "Low Confidence" },
};

const globalPeriodLabel = (days: number | null | undefined) => {
  if (days === null || days === undefined) return null;
  if (days === 0)  return { label: "0-day global",  cls: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]" };
  if (days === 10) return { label: "10-day global", cls: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]" };
  if (days === 90) return { label: "90-day global", cls: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]" };
  return { label: `${days}-day global`, cls: "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]" };
};

const PrimaryCodeCard = ({ code, feedbackType, onFeedback }: PrimaryCodeCardProps) => {
  const conf = confidenceConfig[code.confidence];
  const globalInfo = globalPeriodLabel(code.global_period_days);

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
      {/* Top row: code + feedback buttons */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-3xl font-bold tracking-tight text-[#111827]">
            <CptTooltip code={code.cpt_code}>{code.cpt_code}</CptTooltip>
          </p>
          <p className="mt-1 text-sm leading-snug text-[#6B7280]">{code.description}</p>
        </div>
        <div className="flex shrink-0 gap-1 pt-0.5">
          <button
            onClick={() => onFeedback("positive")}
            title="This code looks correct"
            className={`rounded-md p-1.5 transition-colors hover:bg-[#F0FDF4] ${
              feedbackType === "positive" ? "text-[#16A34A]" : "text-[#D1D5DB]"
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onFeedback("negative")}
            title="This code needs correction"
            className={`rounded-md p-1.5 transition-colors hover:bg-[#FEF2F2] ${
              feedbackType === "negative" ? "text-[#DC2626]" : "text-[#D1D5DB]"
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Confidence */}
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${conf.className}`}>
          {conf.label}
        </span>

        {/* Global period */}
        {globalInfo && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${globalInfo.cls}`}>
            <Clock className="h-3 w-3" />
            {globalInfo.label}
          </span>
        )}

        {/* RVU */}
        {code.rvu != null && code.rvu > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-0.5 text-xs font-medium text-[#374151]">
            <TrendingUp className="h-3 w-3 text-[#2563EB]" />
            {code.rvu} wRVU
          </span>
        )}
      </div>
    </div>
  );
};

export default PrimaryCodeCard;
