export interface CodingRequest {
  clinical_input: string;
  specialty: string;
  laterality: string;
  patient_type: string;
  setting: string;
  time_spent: string;
  payer_type: string;
  global_period: string;
  units: string;
}

export interface PrimaryCode {
  cpt_code: string;
  description: string;
  confidence: "high" | "medium" | "low";
  global_period_days?: number | null;
  rvu?: number | null;
}

export interface AddOnCode {
  cpt_code: string;
  description: string;
  requires_primary: string;
  reason: string;
}

export interface Alternative {
  cpt_code: string;
  description: string;
  why_consider: string;
}

export interface ICD10Code {
  code: string;
  description: string;
  necessity: string;
  sequence_position?: number;
}

export interface Modifier {
  code: string;
  name: string;
  apply: boolean;
  reason: string;
  payer_note?: string;
}

export interface CodingWarning {
  type: "error" | "warning" | "info";
  message: string;
}

export interface CodingResult {
  primary_code: PrimaryCode;
  add_on_codes: AddOnCode[];
  alternatives: Alternative[];
  icd10_codes: ICD10Code[];
  modifiers: Modifier[];
  rationale: string;
  missing_information: string[];
  warnings: CodingWarning[];
  clean_claim_ready: boolean;
}

export interface CodingError {
  error: true;
  error_code: string;
  error_message: string;
  user_message: string;
}
