// ACC-13: Shared report utility functions
// Used by both ACC-09 and ACC-13 harnesses for classification counting,
// run metadata assembly, and domain-level scoring.

import { execSync } from "child_process";
import type { Classification } from "./scorer";
import type { Scenario } from "./scenarioMapper";
import type { RuleDomain } from "@/types/ruleEngine";

// ============================================================================
// Classification counts
// ============================================================================

export interface ClassificationCounts {
  pass: number;
  false_pass: number;
  false_fail: number;
  wrong_action: number;
  partial: number;
  unevaluable: number;
}

export function countClassifications(results: { classification: Classification }[]): ClassificationCounts {
  return {
    pass: results.filter((r) => r.classification === "PASS").length,
    false_pass: results.filter((r) => r.classification === "FALSE_PASS").length,
    false_fail: results.filter((r) => r.classification === "FALSE_FAIL").length,
    wrong_action: results.filter((r) => r.classification === "WRONG_ACTION").length,
    partial: results.filter((r) => r.classification === "PARTIAL").length,
    unevaluable: results.filter((r) => r.classification === "UNEVALUABLE").length,
  };
}

// ============================================================================
// Domain-level classification counts
// ============================================================================

export function countDomainClassifications(
  domain: RuleDomain,
  results: { scenario_id: string; classification: Classification }[],
  scenarios: Scenario[],
): ClassificationCounts {
  const domainResults = results.filter((r) => {
    const sc = scenarios.find((s) => s.id === r.scenario_id)!;
    return sc.domains_tested.includes(domain);
  });
  return countClassifications(domainResults);
}

// ============================================================================
// Run metadata
// ============================================================================

export interface RunMetadata {
  run_timestamp: string;
  git_commit_sha: string;
  scenario_pack_path: string;
  scenario_count_loaded: string;
  harness_file_path: string;
  validator_files_used: string;
  rule_engine_version: string;
  test_pack_version: string;
  environment: string;
}

export function buildRunMetadata(projectRoot: string, overrides: Partial<RunMetadata> = {}): RunMetadata {
  let gitSha = "unavailable";
  try {
    gitSha = execSync("git rev-parse HEAD", { cwd: projectRoot }).toString().trim();
  } catch { /* git sha unavailable */ }

  return {
    run_timestamp: new Date().toISOString(),
    git_commit_sha: gitSha,
    scenario_pack_path: "specs/ACC-02-scenarios.jsonl",
    scenario_count_loaded: "0",
    harness_file_path: "scripts/evaluate-acc13.ts",
    validator_files_used: [
      "src/validators/ptpValidator.ts",
      "src/validators/mueValidator.ts",
      "src/validators/modifierValidator.ts",
      "src/validators/globalValidator.ts",
      "src/validators/documentationValidator.ts",
    ].join(", "),
    rule_engine_version: "orthopedics-v1-beta",
    test_pack_version: "ACC-02 v1",
    environment: `bun ${typeof Bun !== "undefined" ? Bun.version : "unknown"}, ${process.platform}`,
    ...overrides,
  };
}

// ============================================================================
// Markdown table helpers
// ============================================================================

export function classificationTable(counts: ClassificationCounts, total: number): string {
  const lines: string[] = [];
  lines.push("| Classification | Count | Pct |");
  lines.push("|----------------|-------|-----|");
  lines.push(`| PASS | ${counts.pass} | ${pct(counts.pass, total)} |`);
  lines.push(`| FALSE_PASS | ${counts.false_pass} | ${pct(counts.false_pass, total)} |`);
  lines.push(`| FALSE_FAIL | ${counts.false_fail} | ${pct(counts.false_fail, total)} |`);
  lines.push(`| WRONG_ACTION | ${counts.wrong_action} | ${pct(counts.wrong_action, total)} |`);
  lines.push(`| PARTIAL | ${counts.partial} | ${pct(counts.partial, total)} |`);
  lines.push(`| UNEVALUABLE | ${counts.unevaluable} | ${pct(counts.unevaluable, total)} |`);
  lines.push(`| **Total** | **${total}** | |`);
  return lines.join("\n");
}

function pct(n: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}
