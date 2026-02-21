import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { CodingRequest } from "@/types/coding";

// PHI patterns to detect and warn about (client-side only — never sent if flagged)
const PHI_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: "Patient name",       regex: /\bpatient\s*(?:name|is|:)\s*[A-Z][a-z]+\s+[A-Z][a-z]+/i },
  { label: "Date of birth",      regex: /\b(?:dob|date of birth|born)\s*[:\-]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i },
  { label: "SSN",                regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/ },
  { label: "MRN / chart number", regex: /\b(?:mrn|mr#|chart\s*(?:#|no|number)|med\s*rec)\s*[:\-#]?\s*\d+/i },
  { label: "Phone number",       regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
  { label: "Full date",          regex: /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i },
  { label: "Numeric date",       regex: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/ },
  { label: "Email address",      regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/ },
];

function detectPHI(text: string): string[] {
  const found: string[] = [];
  for (const { label, regex } of PHI_PATTERNS) {
    if (regex.test(text) && !found.includes(label)) found.push(label);
  }
  return found;
}

interface ClinicalInputProps {
  onSubmit: (request: CodingRequest) => void;
  isLoading: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

const ClinicalInput = ({ onSubmit, isLoading, textareaRef }: ClinicalInputProps) => {
  const [clinicalInput, setClinicalInput] = useState("");
  const [laterality, setLaterality] = useState("Not specified");
  const [patientType, setPatientType] = useState("Not specified");
  const [setting, setSetting] = useState("Office/Outpatient");
  const [timeSpent, setTimeSpent] = useState("Not specified");
  const [cooldown, setCooldown] = useState(false);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);

  // Run PHI detection on every keystroke (client-side only, never blocks submit)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setClinicalInput(val);
    if (val.length > 20) {
      setPhiWarnings(detectPHI(val));
    } else {
      setPhiWarnings([]);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!clinicalInput.trim() || isLoading || cooldown) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000);
    onSubmit({
      clinical_input: clinicalInput,
      laterality,
      patient_type: patientType,
      setting,
      time_spent: timeSpent,
    });
  }, [clinicalInput, laterality, patientType, setting, timeSpent, isLoading, cooldown, onSubmit]);

  const inputIsClear = clinicalInput.length === 0;
  const hasPhiWarnings = phiWarnings.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">

      {/* De-identification notice — always visible */}
      <div className="flex items-start gap-2.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
        <div className="text-xs text-[#1E40AF] leading-relaxed">
          <span className="font-semibold">De-identify before pasting.</span>{" "}
          Remove patient name, date of birth, MRN, SSN, phone number, and any other personal identifiers.
          Clinical details (procedure, diagnosis, laterality, setting) are all Claive needs.
        </div>
      </div>

      {/* PHI warning — appears when patterns are detected */}
      {hasPhiWarnings && (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
          <div className="text-xs text-[#991B1B] leading-relaxed">
            <span className="font-semibold">Possible patient identifier detected:</span>{" "}
            {phiWarnings.join(", ")}.{" "}
            Please remove before submitting.
          </div>
        </div>
      )}

      {/* All-clear indicator */}
      {!inputIsClear && !hasPhiWarnings && (
        <div className="flex items-center gap-2 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
          <span className="text-xs font-medium text-[#15803D]">No identifiers detected — looks de-identified.</span>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Clinical Documentation
        </label>
        <Textarea
          ref={textareaRef}
          placeholder="Paste de-identified operative notes or encounter documentation. Example: '52-year-old male, right knee arthroscopic partial medial meniscectomy with chondroplasty. Tourniquet time 42 min.'"
          value={clinicalInput}
          onChange={handleInputChange}
          className={`min-h-[160px] resize-y text-sm sm:min-h-[200px] ${hasPhiWarnings ? "border-[#FCA5A5] focus-visible:ring-red-300" : ""}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Laterality</label>
          <Select value={laterality} onValueChange={setLaterality}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Left", "Right", "Bilateral", "Not specified"].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Patient Type</label>
          <Select value={patientType} onValueChange={setPatientType}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["New", "Established", "Not specified"].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Setting</label>
          <Select value={setting} onValueChange={setSetting}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Office/Outpatient", "Outpatient Surgery Center", "Inpatient Hospital", "Emergency Department"].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Time Spent (E/M)</label>
          <Select value={timeSpent} onValueChange={setTimeSpent}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Not specified", "10-19 min", "20-29 min", "30-39 min", "40-54 min", "55+ min"].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!clinicalInput.trim() || isLoading || cooldown}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          "Analyze Documentation"
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Claive provides coding suggestions only. All codes must be verified by a qualified coder before claim submission.
        By submitting, you confirm this input contains no patient identifiers.
      </p>
    </div>
  );
};

export default ClinicalInput;
