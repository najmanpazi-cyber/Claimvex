import { CheckCircle2, XCircle } from "lucide-react";

interface CleanClaimIndicatorProps {
  ready: boolean;
  missingCount?: number;
}

const CleanClaimIndicator = ({ ready, missingCount = 0 }: CleanClaimIndicatorProps) => (
  <div
    className={`flex items-center gap-2.5 rounded-lg p-3 ${
      ready
        ? "bg-[#F0FDF4] border border-[#BBF7D0]"
        : "bg-[#FEF2F2] border border-[#FECACA]"
    }`}
  >
    {ready
      ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16A34A]" />
      : <XCircle className="h-5 w-5 shrink-0 text-[#DC2626]" />
    }
    <div>
      <span className={`text-sm font-semibold ${ready ? "text-[#15803D]" : "text-[#991B1B]"}`}>
        {ready ? "Clean Claim Ready" : "Review Required"}
      </span>
      {!ready && missingCount > 0 && (
        <span className="ml-2 text-xs text-[#DC2626]">
          {missingCount} documentation gap{missingCount > 1 ? "s" : ""} — see below
        </span>
      )}
    </div>
  </div>
);

export default CleanClaimIndicator;
