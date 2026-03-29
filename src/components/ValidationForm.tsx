import { useState } from "react";

export interface ValidationFormData {
  cptCodes: string[];
  modifiers: string[];
  dateOfService: string;
  icd10Code: string;
  patientAge: number | null;
  laterality: "left" | "right" | "bilateral" | "not_specified";
  payerType: "commercial" | "medicare" | "unknown";
  priorSurgeryCpt: string;
  priorSurgeryDate: string;
}

const VALID_MODIFIERS = [
  "25", "26", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
  "62", "66", "73", "74", "76", "77", "78", "79", "80", "81", "82",
  "LT", "RT", "TC", "XE", "XS", "XP", "XU", "24",
];

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ValidationFormProps {
  onSubmit: (data: ValidationFormData) => void;
  submitting?: boolean;
}

export default function ValidationForm({ onSubmit, submitting = false }: ValidationFormProps) {
  const [cptInput, setCptInput] = useState("");
  const [modifierInput, setModifierInput] = useState("");
  const [dateOfService, setDateOfService] = useState(todayString());
  const [icd10Code, setIcd10Code] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [laterality, setLaterality] = useState<ValidationFormData["laterality"]>("not_specified");
  const [payerType, setPayerType] = useState<ValidationFormData["payerType"]>("commercial");
  const [priorSurgeryCpt, setPriorSurgeryCpt] = useState("");
  const [priorSurgeryDate, setPriorSurgeryDate] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    const rawCpts = cptInput.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (rawCpts.length === 0) {
      errs.cpt = "At least one CPT code is required.";
    } else {
      for (const code of rawCpts) {
        if (!/^\d{5}$/.test(code)) {
          errs.cpt = `"${code}" is not a valid 5-digit CPT code.`;
          break;
        }
      }
    }

    if (modifierInput.trim()) {
      const rawMods = modifierInput.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      for (const mod of rawMods) {
        if (!VALID_MODIFIERS.includes(mod)) {
          errs.modifiers = `"${mod}" is not a recognized modifier.`;
          break;
        }
      }
    }

    if (!dateOfService) {
      errs.dos = "Date of service is required.";
    } else if (dateOfService > todayString()) {
      errs.dos = "Date of service cannot be in the future.";
    }

    if (icd10Code.trim()) {
      if (!/^[A-Z]\d{2,3}(\.\d{1,4})?$/i.test(icd10Code.trim())) {
        errs.icd10 = "Invalid ICD-10 format. Example: M17.11";
      }
    }

    if (patientAge.trim()) {
      const age = parseInt(patientAge, 10);
      if (isNaN(age) || age < 0 || age > 120) {
        errs.age = "Age must be between 0 and 120.";
      }
    }

    if (priorSurgeryCpt.trim() && !/^\d{5}$/.test(priorSurgeryCpt.trim())) {
      errs.priorCpt = "Prior surgery CPT must be a 5-digit code.";
    }

    if (priorSurgeryDate && priorSurgeryDate > dateOfService) {
      errs.priorDate = "Prior surgery date must be before the date of service.";
    }

    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const cptCodes = cptInput.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    const modifiers = modifierInput.trim()
      ? modifierInput.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
      : [];
    const age = patientAge.trim() ? parseInt(patientAge, 10) : null;

    onSubmit({
      cptCodes,
      modifiers,
      dateOfService,
      icd10Code: icd10Code.trim().toUpperCase(),
      patientAge: age,
      laterality,
      payerType,
      priorSurgeryCpt: priorSurgeryCpt.trim(),
      priorSurgeryDate,
    });
  }

  function handleClear() {
    setCptInput("");
    setModifierInput("");
    setDateOfService(todayString());
    setIcd10Code("");
    setPatientAge("");
    setLaterality("not_specified");
    setPayerType("commercial");
    setPriorSurgeryCpt("");
    setPriorSurgeryDate("");
    setShowAdvanced(false);
    setErrors({});
  }

  const inputClass = "w-full rounded-lg border border-cv-outline-variant/40 bg-cv-surface px-4 py-2.5 text-sm text-cv-on-surface placeholder:text-cv-on-surface-variant/50 focus:border-cv-primary focus:outline-none focus:ring-2 focus:ring-cv-primary/20";
  const selectClass = `${inputClass} appearance-none`;

  return (
    <div className="rounded-2xl border border-cv-outline-variant/20 bg-cv-surface-container-lowest p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-cv-secondary/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-cv-secondary text-xl">fact_check</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-cv-on-surface">Validate Claim</h2>
          <p className="text-xs text-cv-on-surface-variant">Enter claim data to run all validation modules</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* CPT Codes */}
        <div>
          <label htmlFor="cpt-codes" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
            CPT Code(s) <span className="text-cv-error">*</span>
          </label>
          <input id="cpt-codes" type="text" value={cptInput} onChange={(e) => setCptInput(e.target.value)}
            placeholder="e.g. 29881, 27447" className={inputClass} />
          <p className="mt-1 text-xs text-cv-on-surface-variant">Comma-separated 5-digit codes</p>
          {errors.cpt && <p className="mt-1 text-xs text-cv-error font-medium">{errors.cpt}</p>}
        </div>

        {/* Modifiers */}
        <div>
          <label htmlFor="modifiers" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
            Modifier(s)
          </label>
          <input id="modifiers" type="text" value={modifierInput} onChange={(e) => setModifierInput(e.target.value)}
            placeholder="e.g. 59, RT, XS" className={inputClass} />
          <p className="mt-1 text-xs text-cv-on-surface-variant">Optional. Comma-separated (25, 59, LT, RT, XE, XS, XP, XU, etc.)</p>
          {errors.modifiers && <p className="mt-1 text-xs text-cv-error font-medium">{errors.modifiers}</p>}
        </div>

        {/* Date of Service */}
        <div>
          <label htmlFor="dos" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
            Date of Service <span className="text-cv-error">*</span>
          </label>
          <input id="dos" type="date" value={dateOfService} onChange={(e) => setDateOfService(e.target.value)}
            max={todayString()} className={inputClass} />
          {errors.dos && <p className="mt-1 text-xs text-cv-error font-medium">{errors.dos}</p>}
        </div>

        {/* Laterality + Payer Type row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="laterality" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
              Laterality
            </label>
            <select id="laterality" value={laterality} onChange={(e) => setLaterality(e.target.value as ValidationFormData["laterality"])}
              className={selectClass}>
              <option value="not_specified">Not specified</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="bilateral">Bilateral</option>
            </select>
          </div>
          <div>
            <label htmlFor="payer-type" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
              Payer Type
            </label>
            <select id="payer-type" value={payerType} onChange={(e) => setPayerType(e.target.value as ValidationFormData["payerType"])}
              className={selectClass}>
              <option value="commercial">Commercial</option>
              <option value="medicare">Medicare</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* ICD-10 + Age row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="icd10" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
              ICD-10 Diagnosis Code
            </label>
            <input id="icd10" type="text" value={icd10Code} onChange={(e) => setIcd10Code(e.target.value)}
              placeholder="e.g. M17.11" className={inputClass} />
            <p className="mt-1 text-xs text-cv-on-surface-variant">Optional</p>
            {errors.icd10 && <p className="mt-1 text-xs text-cv-error font-medium">{errors.icd10}</p>}
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
              Patient Age
            </label>
            <input id="age" type="number" min={0} max={120} value={patientAge} onChange={(e) => setPatientAge(e.target.value)}
              placeholder="e.g. 65" className={inputClass} />
            <p className="mt-1 text-xs text-cv-on-surface-variant">Optional. 0–120</p>
            {errors.age && <p className="mt-1 text-xs text-cv-error font-medium">{errors.age}</p>}
          </div>
        </div>

        {/* Advanced: Global Period fields */}
        <div>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-semibold text-cv-on-surface-variant hover:text-cv-primary transition-colors">
            <span className={`material-symbols-outlined text-lg transition-transform ${showAdvanced ? "rotate-180" : ""}`}>expand_more</span>
            Global Period Check (optional)
          </button>

          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-xl bg-cv-surface-container-low/50 border border-cv-outline-variant/15">
              <div>
                <label htmlFor="prior-cpt" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
                  Prior Surgery CPT
                </label>
                <input id="prior-cpt" type="text" value={priorSurgeryCpt} onChange={(e) => setPriorSurgeryCpt(e.target.value)}
                  placeholder="e.g. 27447" className={inputClass} />
                <p className="mt-1 text-xs text-cv-on-surface-variant">The CPT code of the prior surgery</p>
                {errors.priorCpt && <p className="mt-1 text-xs text-cv-error font-medium">{errors.priorCpt}</p>}
              </div>
              <div>
                <label htmlFor="prior-date" className="block text-sm font-semibold text-cv-on-surface mb-1.5">
                  Prior Surgery Date
                </label>
                <input id="prior-date" type="date" value={priorSurgeryDate} onChange={(e) => setPriorSurgeryDate(e.target.value)}
                  max={dateOfService} className={inputClass} />
                <p className="mt-1 text-xs text-cv-on-surface-variant">When the prior surgery was performed</p>
                {errors.priorDate && <p className="mt-1 text-xs text-cv-error font-medium">{errors.priorDate}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button id="validate-btn" type="submit" disabled={submitting}
            className="bg-medical-gradient text-cv-on-primary px-8 py-3 text-sm font-bold rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? "Validating..." : "Validate"}
          </button>
          <button type="button" onClick={handleClear}
            className="px-6 py-3 text-sm font-semibold text-cv-on-surface-variant hover:bg-cv-surface-container-high rounded-lg transition-colors border border-cv-outline-variant/30">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
