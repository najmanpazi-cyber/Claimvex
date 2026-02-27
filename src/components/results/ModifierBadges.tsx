import type { Modifier } from "@/types/coding";
import { Info } from "lucide-react";
import { ModifierTooltip } from "@/components/CptTooltip";

interface ModifierBadgesProps {
  modifiers: Modifier[];
}

const ModifierBadges = ({ modifiers }: ModifierBadgesProps) => {
  if (modifiers.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        Modifiers
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          ({modifiers.length} applied)
        </span>
      </h3>
      <div className="flex flex-col gap-2">
        {modifiers.map((mod, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#92400E]">
                <ModifierTooltip code={mod.code}>{mod.code}</ModifierTooltip>
              </span>
              <span className="text-sm font-medium text-[#111827]">{mod.name}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#78350F]">{mod.reason}</p>
            {mod.payer_note && (
              <div className="mt-1.5 flex items-start gap-1.5 rounded bg-[#FEF3C7] px-2 py-1.5">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-[#D97706]" />
                <p className="text-xs text-[#92400E]">
                  <span className="font-semibold">Payer note:</span> {mod.payer_note}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifierBadges;
