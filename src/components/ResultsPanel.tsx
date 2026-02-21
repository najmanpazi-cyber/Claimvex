import { useState } from "react";
import {
  ClipboardList, Loader2, AlertTriangle, ChevronDown, ChevronUp,
  Copy, Check, FileText, Stethoscope, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CodingResult, CodingError } from "@/types/coding";
import { supabase } from "@/integrations/supabase/client";

import CleanClaimIndicator from "@/components/results/CleanClaimIndicator";
import PrimaryCodeCard from "@/components/results/PrimaryCodeCard";
import AddOnCodes from "@/components/results/AddOnCodes";
import DiagnosisCodes from "@/components/results/DiagnosisCodes";
import ModifierBadges from "@/components/results/ModifierBadges";
import RationaleCard from "@/components/results/RationaleCard";
import FeedbackForm from "@/components/results/FeedbackForm";

interface ResultsPanelProps {
  result: CodingResult | null;
  error: CodingError | null;
  isLoading: boolean;
  onRetry: () => void;
  sessionId: string;
  clinicalInputPreview: string;
}

// Loading steps to show while analyzing
const LOADING_STEPS = [
  { icon: FileText,      text: "Reading clinical documentation..." },
  { icon: Stethoscope,  text: "Identifying procedure and diagnosis..." },
  { icon: ShieldCheck,  text: "Checking NCCI bundling rules..." },
  { icon: ClipboardList, text: "Evaluating modifiers and payer rules..." },
];

const ResultsPanel = ({
  result, error, isLoading, onRetry, sessionId, clinicalInputPreview,
}: ResultsPanelProps) => {
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState<"all" | "cpt" | "icd" | null>(null);
  const [altOpen, setAltOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"positive" | "negative" | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Cycle through loading steps
  if (isLoading && loadingStep < LOADING_STEPS.length - 1) {
    setTimeout(() => setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 2200);
  }

  if (!result && !error && !isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
        <ClipboardList className="h-12 w-12 opacity-30" />
        <div className="text-center">
          <p className="text-sm font-medium">Ready to analyze</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste documentation, fill in context fields, and click Analyze
          </p>
          <p className="mt-1 text-xs text-muted-foreground opacity-70">
            Tip: use <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">⌘ Enter</kbd> to submit quickly
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    const step = LOADING_STEPS[loadingStep];
    const StepIcon = step.icon;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-70" />
          <p className="animate-pulse text-sm text-muted-foreground">{step.text}</p>
        </div>
        <div className="flex gap-2 mt-2">
          {LOADING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                i <= loadingStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error.user_message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>Try Again</Button>
      </div>
    );
  }

  if (!result) return null;

  // Copy text builders
  const buildFullCopyText = () => {
    const lines: string[] = [];
    const modCodes = result.modifiers.filter(m => m.apply).map(m => m.code).join("");
    lines.push(`CPT: ${result.primary_code.cpt_code}${modCodes} — ${result.primary_code.description}`);
    if (result.add_on_codes?.length > 0) {
      result.add_on_codes.forEach(a => lines.push(`Add-on CPT: ${a.cpt_code} — ${a.description}`));
    }
    result.icd10_codes.forEach((c, i) => lines.push(`ICD-10 (${i + 1}): ${c.code} — ${c.description}`));
    lines.push(`Confidence: ${result.primary_code.confidence}`);
    if (result.rationale) lines.push(`Rationale: ${result.rationale}`);
    if (result.missing_information?.length > 0) {
      lines.push(`Missing info: ${result.missing_information.join("; ")}`);
    }
    return lines.join("\n");
  };

  const buildCptOnly = () => {
    const modCodes = result.modifiers.filter(m => m.apply).map(m => m.code).join("");
    const addOns = result.add_on_codes?.length > 0
      ? " | " + result.add_on_codes.map(a => a.cpt_code).join(", ")
      : "";
    return `${result.primary_code.cpt_code}${modCodes}${addOns}`;
  };

  const buildIcdOnly = () =>
    result.icd10_codes.map(c => c.code).join(", ");

  const handleCopy = (type: "all" | "cpt" | "icd") => {
    const text = type === "all" ? buildFullCopyText()
      : type === "cpt" ? buildCptOnly()
      : buildIcdOnly();
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFeedback = async (type: "positive" | "negative") => {
    setFeedbackType(type);
    if (type === "positive") {
      try {
        await supabase.from("coding_feedback").insert({
          clinical_input_preview: clinicalInputPreview,
          suggested_code: result.primary_code.cpt_code,
          feedback_type: "positive",
          session_id: sessionId,
        });
      } catch (err) { console.error("Feedback insert failed:", err); }
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-6">
      {/* Clean Claim Indicator */}
      <CleanClaimIndicator ready={result.clean_claim_ready} missingCount={result.missing_information?.length ?? 0} />

      {/* Primary Code */}
      <PrimaryCodeCard code={result.primary_code} feedbackType={feedbackType} onFeedback={handleFeedback} />
      {feedbackSent && feedbackType !== "negative" && (
        <p className="text-xs text-[#16A34A]">✓ Thank you for your feedback!</p>
      )}
      {feedbackType === "negative" && !feedbackSent && (
        <FeedbackForm
          suggestedCode={result.primary_code.cpt_code}
          sessionId={sessionId}
          clinicalInputPreview={clinicalInputPreview}
          onSubmitted={() => { setFeedbackSent(true); setFeedbackType(null); }}
        />
      )}

      {/* Add-On Codes — prominently above ICD-10 */}
      {result.add_on_codes?.length > 0 && (
        <AddOnCodes codes={result.add_on_codes} />
      )}

      {/* ICD-10 Diagnosis Codes */}
      <DiagnosisCodes codes={result.icd10_codes} />

      {/* Modifiers */}
      <ModifierBadges modifiers={result.modifiers} />

      {/* Rationale */}
      <RationaleCard rationale={result.rationale} />

      {/* Missing Information */}
      {result.missing_information?.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-destructive">Missing Documentation</h3>
          {result.missing_information.map((info, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border-l-4 border-destructive bg-destructive/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-foreground">{info}</p>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {result.warnings?.length > 0 && (
        <div className="flex flex-col gap-2">
          {result.warnings.map((w, i) => {
            const colors = {
              error:   "border-destructive bg-destructive/5 text-destructive",
              warning: "border-[#D97706] bg-[#FFFBEB] text-[#92400E]",
              info:    "border-[#2563EB] bg-[#EFF6FF] text-[#1E40AF]",
            };
            return (
              <div key={i} className={`rounded-lg border-l-4 p-3 ${colors[w.type]}`}>
                <p className="text-sm">{w.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Alternatives — visible by default */}
      {result.alternatives?.length > 0 && (
        <div>
          <button
            onClick={() => setAltOpen(o => !o)}
            className="flex w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors"
          >
            <span>Alternative Codes ({result.alternatives.length})</span>
            {altOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {altOpen && (
            <div className="mt-2 flex flex-col gap-2">
              {result.alternatives.map((alt, i) => (
                <div key={i} className="rounded-lg border border-[#E5E7EB] p-3">
                  <p className="text-sm font-medium">
                    <span className="font-mono font-semibold text-[#111827]">{alt.cpt_code}</span>
                    <span className="ml-2 text-[#6B7280]">{alt.description}</span>
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    <span className="font-medium text-[#374151]">Consider when:</span> {alt.why_consider}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verification + Copy Footer */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Checkbox id="verify" checked={verified} onCheckedChange={(v) => setVerified(v === true)} />
          <label htmlFor="verify" className="text-sm text-foreground cursor-pointer">
            I have reviewed and verified these coding suggestions
          </label>
        </div>

        {/* Three copy options */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => handleCopy("cpt")}
            disabled={!verified}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {copied === "cpt"
              ? <><Check className="mr-1 h-3 w-3" /> Copied</>
              : <><Copy className="mr-1 h-3 w-3" /> CPT Only</>
            }
          </Button>
          <Button
            onClick={() => handleCopy("icd")}
            disabled={!verified}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {copied === "icd"
              ? <><Check className="mr-1 h-3 w-3" /> Copied</>
              : <><Copy className="mr-1 h-3 w-3" /> ICD-10 Only</>
            }
          </Button>
          <Button
            onClick={() => handleCopy("all")}
            disabled={!verified}
            size="sm"
            className="text-xs bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          >
            {copied === "all"
              ? <><Check className="mr-1 h-3 w-3" /> Copied</>
              : <><Copy className="mr-1 h-3 w-3" /> Copy All</>
            }
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Paste into your billing system or practice management software
        </p>
      </div>
    </div>
  );
};

export default ResultsPanel;
