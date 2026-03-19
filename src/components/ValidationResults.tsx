import { useState } from "react";
import type { ValidationResult, ModuleResult, ModuleStatus } from "@/services/validationService";

const STATUS_CONFIG: Record<ModuleStatus, { label: string; bg: string; text: string; icon: string }> = {
  pass:           { label: "PASS",           bg: "bg-green-50 border-green-200",  text: "text-green-700",  icon: "check_circle" },
  fail:           { label: "FAIL",           bg: "bg-red-50 border-red-200",      text: "text-red-700",    icon: "error" },
  warning:        { label: "WARNING",        bg: "bg-amber-50 border-amber-200",  text: "text-amber-700",  icon: "warning" },
  not_applicable: { label: "N/A",            bg: "bg-gray-50 border-gray-200",    text: "text-gray-500",   icon: "remove_circle_outline" },
};

function ModuleCard({ module }: { module: ModuleResult }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[module.status];

  return (
    <div className={`rounded-xl border ${config.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-black/[0.02] transition-colors"
      >
        <span className={`material-symbols-outlined text-2xl ${config.text}`}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-cv-on-surface">{module.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${config.text} ${config.bg}`}>
              {config.label}
            </span>
          </div>
          {module.status !== "pass" && module.status !== "not_applicable" && (
            <p className="text-xs text-cv-on-surface-variant mt-1 truncate">{module.summary}</p>
          )}
        </div>
        <span className={`material-symbols-outlined text-cv-on-surface-variant/40 text-xl transition-transform ${expanded ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {expanded && (
        <div className="border-t border-cv-outline-variant/20 px-5 py-4 bg-white/50">
          {module.triggered.length === 0 && module.warnings.length === 0 ? (
            <p className="text-sm text-cv-on-surface-variant">
              {module.status === "pass" ? "All rules evaluated — no issues found." : "No rules were applicable for the submitted codes."}
            </p>
          ) : (
            <div className="space-y-3">
              {module.triggered.map((rule, i) => (
                <div key={`${rule.rule_id}-${i}`} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-cv-primary bg-cv-primary/5 px-2 py-0.5 rounded">
                      {rule.rule_id}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${
                      rule.action_type === "block" ? "text-red-600" :
                      rule.action_type === "force-review" ? "text-amber-600" :
                      "text-amber-500"
                    }`}>
                      {rule.action_type}
                    </span>
                  </div>
                  <p className="text-cv-on-surface-variant leading-relaxed">{rule.message_user}</p>
                  {rule.payer_note && (
                    <p className="text-xs text-cv-on-surface-variant/70 mt-1 italic">Payer note: {rule.payer_note}</p>
                  )}
                </div>
              ))}
              {module.warnings.map((w, i) => (
                <div key={`warn-${i}`} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase text-amber-500">WARNING</span>
                  </div>
                  <p className="text-cv-on-surface-variant leading-relaxed">{w.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ValidationResultsProps {
  result: ValidationResult;
  onValidateAnother: () => void;
}

export default function ValidationResults({ result, onValidateAnother }: ValidationResultsProps) {
  const isClean = result.overallStatus === "clean";

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className={`rounded-2xl border p-6 ${isClean ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <div className="flex items-center gap-4">
          <span className={`material-symbols-outlined text-4xl ${isClean ? "text-green-600" : "text-red-600"}`}>
            {isClean ? "verified" : "gpp_bad"}
          </span>
          <div>
            <h2 className={`text-xl font-bold ${isClean ? "text-green-800" : "text-red-800"}`}>
              {isClean ? "Clean — All Checks Passed" : "Issues Found"}
            </h2>
            <div className="flex gap-4 mt-1 text-sm">
              <span className="text-green-700 font-medium">{result.passes} passed</span>
              {result.fails > 0 && <span className="text-red-700 font-medium">{result.fails} failed</span>}
              {result.warnings > 0 && <span className="text-amber-700 font-medium">{result.warnings} warnings</span>}
              <span className="text-gray-500">{result.totalChecks} modules checked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Module Cards */}
      <div className="space-y-3">
        {result.modules.map((m) => (
          <ModuleCard key={m.key} module={m} />
        ))}
      </div>

      {/* Validate Another */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onValidateAnother}
          className="px-6 py-3 text-sm font-bold text-cv-primary bg-cv-surface-container-high hover:bg-cv-surface-container-highest rounded-lg transition-colors border border-cv-outline-variant/20"
        >
          Validate Another Claim
        </button>
      </div>
    </div>
  );
}
