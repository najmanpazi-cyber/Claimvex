import { History, Trash2, ChevronRight, Clock, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { HistoryEntry } from "@/hooks/useSessionHistory";

interface HistoryDrawerProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

const confidenceColors = {
  high:   "bg-[#DCFCE7] text-[#15803D]",
  medium: "bg-[#FEF3C7] text-[#92400E]",
  low:    "bg-[#FEE2E2] text-[#991B1B]",
};

const HistoryDrawer = ({ history, onSelect, onClear }: HistoryDrawerProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="View session history"
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
          {history.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {history.length}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base font-semibold">Recent Analyses</SheetTitle>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Clear all history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <History className="h-10 w-10 text-muted-foreground opacity-30" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No history yet</p>
                <p className="mt-1 text-xs text-muted-foreground opacity-70">
                  Your last 10 analyses will appear here
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {history.map((entry) => {
                const { result, request } = entry;
                const conf = confidenceColors[result.primary_code.confidence];
                const modCodes = result.modifiers
                  .filter(m => m.apply)
                  .map(m => m.code)
                  .join("");
                const fullCode = `${result.primary_code.cpt_code}${modCodes}`;
                const icdPrimary = result.icd10_codes[0]?.code ?? "";

                return (
                  <li key={entry.id}>
                    <Sheet>
                      <SheetTrigger asChild>
                        {/* Use the outer Sheet's close via onSelect */}
                      </SheetTrigger>
                    </Sheet>
                    <button
                      onClick={() => onSelect(entry)}
                      className="group flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-secondary/60"
                    >
                      {/* Top row: code + timestamp */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-lg font-bold text-foreground">
                          {fullCode}
                        </span>
                        <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>

                      {/* Code description */}
                      <p className="text-xs leading-snug text-muted-foreground">
                        {truncate(result.primary_code.description, 72)}
                      </p>

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Confidence */}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${conf}`}>
                          {result.primary_code.confidence}
                        </span>

                        {/* ICD-10 primary */}
                        {icdPrimary && (
                          <span className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[10px] font-medium text-[#374151]">
                            {icdPrimary}
                          </span>
                        )}

                        {/* Add-ons */}
                        {result.add_on_codes?.length > 0 && (
                          <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-medium text-[#1D4ED8]">
                            +{result.add_on_codes.length} add-on
                          </span>
                        )}

                        {/* RVU */}
                        {result.primary_code.rvu != null && result.primary_code.rvu > 0 && (
                          <span className="flex items-center gap-0.5 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[10px] font-medium text-[#374151]">
                            <TrendingUp className="h-2.5 w-2.5 text-[#2563EB]" />
                            {result.primary_code.rvu} RVU
                          </span>
                        )}

                        {/* Setting */}
                        {request.setting && request.setting !== "Office/Outpatient" && (
                          <span className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[10px] text-[#6B7280]">
                            {request.setting}
                          </span>
                        )}

                        {/* Payer */}
                        {request.payer_type && request.payer_type !== "Not specified" && (
                          <span className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[10px] text-[#6B7280]">
                            {request.payer_type}
                          </span>
                        )}
                      </div>

                      {/* Clinical note preview */}
                      <p className="text-[11px] italic leading-snug text-muted-foreground opacity-60">
                        "{truncate(request.clinical_input.replace(/\s+/g, " ").trim(), 80)}"
                      </p>

                      <ChevronRight className="absolute right-3 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Stored locally in your browser · Last {Math.min(history.length, 10)} of 10 analyses
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistoryDrawer;
