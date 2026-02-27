import { useState, useCallback, useRef, useEffect } from "react";
import Header from "@/components/Header";
import ClinicalInput from "@/components/ClinicalInput";
import ResultsPanel from "@/components/ResultsPanel";
import HistoryDrawer from "@/components/HistoryDrawer";
import type { CodingRequest, CodingResult, CodingError } from "@/types/coding";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ClipboardList } from "lucide-react";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import type { HistoryEntry } from "@/hooks/useSessionHistory";

type MobileTab = "input" | "results";

const Index = () => {
  const [result, setResult] = useState<CodingResult | null>(null);
  const [error, setError] = useState<CodingError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClinicalInput, setLastClinicalInput] = useState("");
  const [lastRequest, setLastRequest] = useState<CodingRequest | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("input");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(crypto.randomUUID());
  const { history, addEntry, clearHistory } = useSessionHistory();

  // Auto-switch to results tab when analysis completes
  useEffect(() => {
    if (!isLoading && (result || error)) {
      setMobileTab("results");
    }
  }, [isLoading, result, error]);

  const handleSubmit = useCallback(async (request: CodingRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setMobileTab("results"); // switch immediately so user sees the loading spinner
    setLastClinicalInput(request.clinical_input);
    setLastRequest(request);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-codes", {
        body: {
          clinical_input: request.clinical_input,
          specialty: request.specialty,
          laterality: request.laterality,
          patient_type: request.patient_type,
          setting: request.setting,
          time_spent: request.time_spent,
          payer_type: request.payer_type,
          global_period: request.global_period,
          units: request.units,
        },
      });

      if (fnError || data?.error) {
        setError({
          error: true,
          error_code: data?.error_code || "UNKNOWN",
          error_message: data?.error_message || fnError?.message || "Unknown error",
          user_message: data?.user_message || "Something went wrong. Please try again.",
        });
      } else {
        const codingResult = data as CodingResult;
        setResult(codingResult);
        if (lastRequest) {
          addEntry(lastRequest, codingResult);
        }
      }
    } catch (err: any) {
      setError({
        error: true,
        error_code: "NETWORK_ERROR",
        error_message: err?.message || "Network error",
        user_message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setResult(entry.result);
    setError(null);
    setLastClinicalInput(entry.request.clinical_input);
    setLastRequest(entry.request);
    setMobileTab("results");
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setResult(null);
    setMobileTab("input");
    textareaRef.current?.focus();
  }, []);

  const hasResults = result !== null || error !== null || isLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        historyDrawer={
          <HistoryDrawer
            history={history}
            onSelect={handleHistorySelect}
            onClear={clearHistory}
          />
        }
      />

      {/* ── Mobile Tab Bar ── */}
      <div className="flex border-b lg:hidden">
        <button
          onClick={() => setMobileTab("input")}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            mobileTab === "input"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Input
        </button>
        <button
          onClick={() => setMobileTab("results")}
          className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            mobileTab === "results"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Results
          {hasResults && mobileTab !== "results" && (
            <span className="absolute right-6 top-2.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col lg:flex-row">

        {/* Input Panel */}
        <div
          className={`w-full border-b lg:w-2/5 lg:block lg:border-b-0 lg:border-r ${
            mobileTab === "input" ? "block" : "hidden"
          }`}
        >
          <ClinicalInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            textareaRef={textareaRef}
          />
        </div>

        {/* Results Panel */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto bg-secondary/30 lg:block ${
            mobileTab === "results" ? "block" : "hidden"
          }`}
          style={{ minHeight: mobileTab === "results" ? "calc(100vh - 120px)" : undefined }}
        >
          <ResultsPanel
            result={result}
            error={error}
            isLoading={isLoading}
            onRetry={handleRetry}
            sessionId={sessionId.current}
            clinicalInputPreview={lastClinicalInput.substring(0, 100)}
            lastRequest={lastRequest}
          />
        </div>

      </div>
    </div>
  );
};

export default Index;
