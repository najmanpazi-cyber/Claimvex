import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Clock, TrendingUp, Tag } from "lucide-react";
import { lookupCpt, lookupModifier } from "@/data/cptReference";

// ─── CPT Code Tooltip ────────────────────────────────────────────────────────

interface CptTooltipProps {
  code: string;
  children: React.ReactNode;
}

const globalLabel = (days: 0 | 10 | 90 | null) => {
  if (days === null) return null;
  if (days === 0)  return { text: "0-day global", cls: "text-[#15803D]" };
  if (days === 10) return { text: "10-day global", cls: "text-[#92400E]" };
  if (days === 90) return { text: "90-day global", cls: "text-[#991B1B]" };
  return { text: `${days}-day global`, cls: "text-[#6B7280]" };
};

export const CptTooltip = ({ code, children }: CptTooltipProps) => {
  const info = lookupCpt(code);
  if (!info) return <>{children}</>;

  const global = globalLabel(info.globalDays);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted decoration-[#93C5FD] underline-offset-2">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-lg text-left"
          sideOffset={6}
        >
          {/* Code + Category */}
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-[#111827]">{code.replace(/^\+/, "")}</span>
            <span className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[10px] text-[#6B7280]">
              <Tag className="h-2.5 w-2.5" />
              {info.category}
            </span>
          </div>

          {/* Descriptor */}
          <p className="text-xs leading-snug text-[#374151]">{info.descriptor}</p>

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap gap-2">
            {info.rvu != null && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#374151]">
                <TrendingUp className="h-3 w-3 text-[#2563EB]" />
                {info.rvu} wRVU
              </span>
            )}
            {global && (
              <span className={`flex items-center gap-1 text-[11px] font-medium ${global.cls}`}>
                <Clock className="h-3 w-3" />
                {global.text}
              </span>
            )}
            {info.globalDays === null && info.category !== "Spine Add-on" && info.category !== "Pain Management Add-on" && info.category !== "Knee Add-on" && info.category !== "Arthroscopy Add-on" && (
              <span className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                <Clock className="h-3 w-3" />
                No global period
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── Modifier Tooltip ────────────────────────────────────────────────────────

interface ModifierTooltipProps {
  code: string;       // e.g. "-25" or "59" or "LT"
  children: React.ReactNode;
}

export const ModifierTooltip = ({ code, children }: ModifierTooltipProps) => {
  const info = lookupModifier(code);
  if (!info) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted decoration-[#93C5FD] underline-offset-2">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-lg text-left"
          sideOffset={6}
        >
          {/* Modifier code + name */}
          <div className="mb-1.5">
            <span className="font-mono text-xs font-bold text-[#111827]">
              -{code.replace(/^[-]/, "").toUpperCase()}
            </span>
            <span className="ml-1.5 text-xs font-semibold text-[#374151]">{info.name}</span>
          </div>

          {/* Definition */}
          <p className="text-xs leading-snug text-[#374151]">{info.definition}</p>

          {/* Common use */}
          <p className="mt-1.5 text-[11px] leading-snug text-[#6B7280]">
            <span className="font-medium text-[#374151]">Common use: </span>
            {info.commonUse}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
