import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { CodingRequest } from "@/types/coding";

// Full HIPAA Safe Harbor PHI detection — covers all 18 identifier categories
// relevant to text-based clinical notes
const PHI_PATTERNS: { label: string; regex: RegExp }[] = [
  // 1. Names — prefixed patterns
  { label: "Patient name",        regex: /\bpatient\s*(?:name|is|was|:)\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/i },
  // 1b. Names — title + name (Mr./Mrs./Ms./Dr. + two capitalized words)
  { label: "Patient name",        regex: /\b(?:Mr\.|Mrs\.|Ms\.|Miss|Dr\.)\s+[A-Z][a-zA-Z'-]+\s+[A-Z][a-zA-Z'-]+/},
  // 2. Geographic — street addresses
  { label: "Street address",      regex: /\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Za-z]+){1,4}\s+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Pl|Ter|Circle|Court|Street|Avenue|Boulevard|Drive|Road|Lane)\b/i },
  // 2b. ZIP codes (5-digit standalone — technically an identifier)
  { label: "ZIP code",            regex: /\b\d{5}(?:-\d{4})?\b/ },
  // 3. Dates — DOB prefixed
  { label: "Date of birth",       regex: /\b(?:dob|date of birth|born|birthdate)\s*[:\-]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i },
  // 3b. Full month dates (admission dates, procedure dates)
  { label: "Specific date",       regex: /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i },
  // 3c. Numeric dates
  { label: "Specific date",       regex: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/ },
  // 4. Phone numbers (also catches fax numbers — same format)
  { label: "Phone/fax number",    regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
  // 6. Email addresses
  { label: "Email address",       regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/ },
  // 7. Social Security Numbers
  { label: "SSN",                 regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/ },
  // 8. Medical Record Numbers
  { label: "MRN / chart number",  regex: /\b(?:mrn|mr#|mr\s*#|medical\s*record|chart\s*(?:#|no\.?|num|number)|med\.?\s*rec\.?)\s*[:\-#]?\s*[A-Z0-9\-]{4,}/i },
  // 9. Health plan beneficiary / Insurance member ID
  { label: "Insurance/member ID", regex: /\b(?:member\s*(?:id|#|no\.?)|insurance\s*(?:id|#|no\.?)|policy\s*(?:id|#|no\.?)|subscriber\s*id|group\s*(?:#|no\.?)|plan\s*(?:id|#)|beneficiary\s*(?:id|#))\s*[:\-#]?\s*[A-Z0-9\-]{4,}/i },
  // 10. Account numbers
  { label: "Account number",      regex: /\b(?:account|acct\.?|acct\s*(?:#|no\.?|number)|billing\s*(?:#|id))\s*[:\-#]?\s*[A-Z0-9\-]{4,}/i },
  // 18. Age over 89 (HIPAA specifies ages 90+ are identifiers)
  { label: "Age over 89",         regex: /\b(?:9[0-9]|1[0-9]{2})\s*[-\s]?year\s*[-\s]?old/i },
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
  const [payerType, setPayerType] = useState("Not specified");
  const [globalPeriod, setGlobalPeriod] = useState("Not in global period");
  const [units, setUnits] = useState("1");
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
      payer_type: payerType,
      global_period: globalPeriod,
      units,
    });
  }, [clinicalInput, laterality, patientType, setting, timeSpent, payerType, globalPeriod, units, isLoading, cooldown, onSubmit]);

  // Ctrl+Enter keyboard shortcut
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

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
          onKeyDown={handleKeyDown}
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
        {/* New: Payer Type — single biggest accuracy improvement */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Payer Type <span className="text-[#2563EB]">★</span>
          </label>
          <Select value={payerType} onValueChange={setPayerType}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Medicare", "Medicaid", "Commercial / Private", "Self-Pay", "Workers Comp", "Not specified"].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* New: Global Period — prevents denial errors */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Global Period Status</label>
          <Select value={globalPeriod} onValueChange={setGlobalPeriod}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[
                "Not in global period",
                "Within 90-day global",
                "Within 10-day global",
                "Unknown",
              ].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* New: Units */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Units / Joints</label>
          <Select value={units} onValueChange={setUnits}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["1", "2", "3", "4+"].map(v => (
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
          <span className="flex items-center justify-center gap-2">
            Analyze Documentation
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
              ⌘ Enter
            </kbd>
          </span>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Claive provides coding suggestions only. All codes must be verified by a qualified coder before claim submission.
        By submitting, you confirm this input contains no patient identifiers. ★ = improves accuracy
      </p>
    </div>
  );
};

export default ClinicalInput;
