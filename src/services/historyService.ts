// Service for storing and retrieving validation history from Supabase.

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ValidationFormData } from "@/components/ValidationForm";
import type { ValidationResult } from "@/services/validationService";

export interface StoredValidation {
  id: string;
  user_id: string;
  input_data: ValidationFormData;
  results: ValidationResult;
  overall_status: "clean" | "issues_found";
  errors_found: number;
  warnings_found: number;
  created_at: string;
}

export interface UserMetrics {
  totalValidations: number;
  totalErrors: number;
  totalWarnings: number;
  errorRate: number;
  estimatedDenialsPrevented: number;
  estimatedSavings: number;
}

const COST_PER_DENIAL = 35;

export async function saveValidation(
  userId: string,
  inputData: ValidationFormData,
  result: ValidationResult,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("validations").insert([{
    user_id: userId,
    input_data: inputData as unknown as Json,
    results: result as unknown as Json,
    overall_status: result.overallStatus,
    errors_found: result.fails,
    warnings_found: result.warnings,
  }]);

  if (error) return { error: error.message };
  return { error: null };
}

export async function fetchValidations(userId: string): Promise<{ data: StoredValidation[]; error: string | null }> {
  const { data, error } = await supabase
    .from("validations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as unknown as StoredValidation[], error: null };
}

export function computeMetrics(validations: StoredValidation[]): UserMetrics {
  const totalValidations = validations.length;
  const totalErrors = validations.reduce((sum, v) => sum + v.errors_found, 0);
  const totalWarnings = validations.reduce((sum, v) => sum + v.warnings_found, 0);
  const validationsWithIssues = validations.filter(v => v.errors_found > 0 || v.warnings_found > 0).length;
  const errorRate = totalValidations > 0 ? (validationsWithIssues / totalValidations) * 100 : 0;

  return {
    totalValidations,
    totalErrors,
    totalWarnings,
    errorRate,
    estimatedDenialsPrevented: totalErrors,
    estimatedSavings: totalErrors * COST_PER_DENIAL,
  };
}
