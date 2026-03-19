#!/usr/bin/env bun
// ACC-09: Adversarial Red-Team Pass #1 — Deterministic Validator Harness
// Runs all 109 ACC-02 scenarios through all 5 validators and produces break report + JSON artifact.

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

import { loadScenarios, runAllValidators } from "./lib/scenarioMapper";
import type { Scenario } from "./lib/scenarioMapper";
import {
  aggregateResults,
  classifyScenario,
  actionSeverity,
} from "./lib/scorer";
import type { Classification, AggregatedResult } from "./lib/scorer";
import {
  countClassifications,
  buildRunMetadata,
} from "./lib/reportWriter";

import { RULE_ACTION_MAP } from "@/utils/validateRuleEvaluation";
import type { RuleId, RuleDomain } from "@/types/ruleEngine";

// ============================================================================
// Types — ACC-09 specific (forensic analysis)
// ============================================================================

type Severity = "critical" | "high" | "medium" | "low";
type RootCause =
  | "RULE_GAP" | "RULE_TOO_STRICT" | "MAPPING_BUG" | "TEST_EXPECTATION_MISMATCH"
  | "DATA_GAP" | "SCHEMA_STATE_BUG" | "CROSS_VALIDATOR_INTERACTION"
  | "ARCHITECTURE_RISK" | "HARNESS_LIMITATION" | "UNKNOWN";
type FixPath =
  | "validator_patch" | "mapping_patch" | "data_patch"
  | "schema_patch" | "test_pack_review" | "architecture_followup";

interface Finding {
  scenario_id: string;
  domain: string;
  classification: Classification;
  severity: Severity;
  beta_blocker: boolean;
  clinical_vignette: string;
  expected_action: string;
  actual_action: string;
  expected_clean_claim_ready: boolean;
  actual_clean_claim_ready: boolean;
  expected_confidence: string;
  actual_confidence: string;
  expected_rule_hits: string[];
  actual_rule_hits: string[];
  expected_suppressed_codes: string[];
  actual_suppressed_codes: string[];
  expected_missing_info_keys: string[];
  actual_missing_info_keys: string[];
  root_cause_bucket: RootCause;
  observed_failure_reason: string;
  recommended_fix_path: FixPath;
  domain_details: AggregatedResult["domain_results"];
  unevaluable_domains: { domain: string; reason: string }[];
}

interface ScenarioResult {
  scenario_id: string;
  domain: string;
  classification: Classification;
  expected_action: string;
  actual_action: string;
  expected_clean_claim_ready: boolean;
  actual_clean_claim_ready: boolean;
  expected_confidence: string;
  actual_confidence: string;
  expected_rule_hits: string[];
  actual_rule_hits: string[];
  finding: Finding | null;
}

// ============================================================================
// Helpers — Severity, beta_blocker, root_cause, fix_path
// ============================================================================

function assignSeverity(classification: Classification, scenario: Scenario, agg: AggregatedResult): Severity {
  if (classification === "FALSE_PASS") {
    if (scenario.expected_action === "block") return "critical";
    if (scenario.expected_action === "force-review") return "critical";
    if (!scenario.expected_clean_claim_ready && agg.actual_clean_claim_ready) return "critical";
    return "high";
  }
  if (classification === "FALSE_FAIL") {
    if (agg.actual_action === "block" && scenario.expected_action === "pass") return "medium";
    if (agg.actual_action === "block" && scenario.expected_action === "warn") return "medium";
    if (agg.actual_action === "force-review" && scenario.expected_action === "pass") return "medium";
    return "medium";
  }
  if (classification === "WRONG_ACTION") {
    return "medium";
  }
  if (classification === "PARTIAL") {
    const extraRules = agg.actual_rule_hits.filter(
      (r) => !scenario.expected_rule_hits.includes(r)
    );
    const isSystmaticNoise = extraRules.every((r) => ["R-3.5.5", "R-3.2.2", "R-3.5.3"].includes(r));
    if (isSystmaticNoise) return "low";
    if (agg.actual_confidence !== scenario.expected_confidence) return "medium";
    return "low";
  }
  if (classification === "UNEVALUABLE") return "medium";
  return "low";
}

function assignBetaBlocker(classification: Classification, severity: Severity, scenario: Scenario, agg: AggregatedResult): boolean {
  if (classification === "FALSE_PASS" && severity === "critical") return true;
  if (classification === "FALSE_PASS") return true;
  return false;
}

function assignRootCause(classification: Classification, scenario: Scenario, agg: AggregatedResult): RootCause {
  if (classification === "UNEVALUABLE") return "HARNESS_LIMITATION";

  const extraRules = agg.actual_rule_hits.filter((r) => !scenario.expected_rule_hits.includes(r));
  const missingRules = scenario.expected_rule_hits.filter((r) => !agg.actual_rule_hits.includes(r));

  if (extraRules.some((r) => r === "R-3.5.5") || extraRules.some((r) => r === "R-3.5.3")) {
    if (classification === "PARTIAL" && extraRules.every((r) => ["R-3.5.5", "R-3.5.3", "R-3.2.2"].includes(r))) {
      return "MAPPING_BUG";
    }
  }

  if (missingRules.includes("R-3.5.4")) return "MAPPING_BUG";

  if (extraRules.includes("R-3.3.2") && !scenario.expected_rule_hits.includes("R-3.3.2")) {
    return "MAPPING_BUG";
  }

  if (extraRules.includes("R-3.4.2") && !scenario.expected_rule_hits.includes("R-3.4.2")) {
    return "MAPPING_BUG";
  }

  if (
    scenario.expected_clean_claim_ready !== agg.actual_clean_claim_ready &&
    agg.actual_action === "force-review" && scenario.expected_action === "force-review"
  ) {
    return "SCHEMA_STATE_BUG";
  }

  if (classification === "FALSE_PASS") {
    if (missingRules.length > 0) return "RULE_GAP";
    return "UNKNOWN";
  }

  if (classification === "FALSE_FAIL") {
    if (extraRules.length > 0) return "MAPPING_BUG";
    return "RULE_TOO_STRICT";
  }

  if (classification === "WRONG_ACTION") {
    if (extraRules.length > 0) return "MAPPING_BUG";
    return "SCHEMA_STATE_BUG";
  }

  if (classification === "PARTIAL") {
    if (extraRules.length > 0 || missingRules.length > 0) return "MAPPING_BUG";
    if (scenario.expected_confidence !== agg.actual_confidence) return "SCHEMA_STATE_BUG";
    return "MAPPING_BUG";
  }

  return "UNKNOWN";
}

function assignFixPath(rootCause: RootCause): FixPath {
  switch (rootCause) {
    case "RULE_GAP": return "validator_patch";
    case "RULE_TOO_STRICT": return "validator_patch";
    case "MAPPING_BUG": return "mapping_patch";
    case "TEST_EXPECTATION_MISMATCH": return "test_pack_review";
    case "DATA_GAP": return "data_patch";
    case "SCHEMA_STATE_BUG": return "schema_patch";
    case "CROSS_VALIDATOR_INTERACTION": return "architecture_followup";
    case "ARCHITECTURE_RISK": return "architecture_followup";
    case "HARNESS_LIMITATION": return "architecture_followup";
    default: return "architecture_followup";
  }
}

function describeFailure(classification: Classification, scenario: Scenario, agg: AggregatedResult): string {
  const extraRules = agg.actual_rule_hits.filter((r) => !scenario.expected_rule_hits.includes(r));
  const missingRules = scenario.expected_rule_hits.filter((r) => !agg.actual_rule_hits.includes(r));

  if (classification === "FALSE_PASS") {
    if (missingRules.includes("R-3.5.4")) {
      return `R-3.5.4 did not fire because diagnosis_text is null in structured_fields; rule-out keyword detection unavailable.`;
    }
    if (missingRules.length > 0) return `Expected rules ${missingRules.join(",")} did not fire.`;
    if (scenario.expected_clean_claim_ready === false && agg.actual_clean_claim_ready === true) {
      return `clean_claim_ready is true but expected false.`;
    }
    return `Expected ${scenario.expected_action} but got ${agg.actual_action}.`;
  }

  if (classification === "FALSE_FAIL") {
    if (extraRules.includes("R-3.3.2") && !scenario.expected_rule_hits.includes("R-3.3.2")) {
      return `R-3.3.2 over-fired due to absent documentation evidence booleans in structured_fields.`;
    }
    if (extraRules.includes("R-3.4.2") && !scenario.expected_rule_hits.includes("R-3.4.2")) {
      return `R-3.4.2 over-fired due to em_separately_identifiable defaulting to false.`;
    }
    if (agg.actual_clean_claim_ready === false && scenario.expected_clean_claim_ready === true) {
      if (agg.all_force_review_items.length > 0) {
        return `clean_claim_ready false due to pending force_review_items; test pack expects true for force-review.`;
      }
      return `clean_claim_ready false but expected true; extra blocking rules fired.`;
    }
    return `Expected ${scenario.expected_action} but got ${agg.actual_action} due to extra rules: ${extraRules.join(",")}.`;
  }

  if (classification === "WRONG_ACTION") {
    if (scenario.expected_action === "pass" && agg.actual_action === "warn") {
      return `Expected pass but R-3.5.5/R-3.2.2 warn rules fired due to absent anatomic_site/at-limit MUE.`;
    }
    return `Expected ${scenario.expected_action} but got ${agg.actual_action}.`;
  }

  if (classification === "PARTIAL") {
    const parts: string[] = [];
    if (extraRules.length > 0) parts.push(`extra rules: ${extraRules.join(",")}`);
    if (missingRules.length > 0) parts.push(`missing rules: ${missingRules.join(",")}`);
    if (scenario.expected_confidence !== agg.actual_confidence) {
      parts.push(`confidence ${scenario.expected_confidence}→${agg.actual_confidence}`);
    }
    return parts.join("; ") || "Supporting field mismatch.";
  }

  return "Unevaluable due to harness limitation.";
}

// ============================================================================
// Helpers — Confidence mismatch tracking
// ============================================================================

interface ConfidenceMismatch {
  scenario_id: string;
  expected: string;
  actual: string;
  direction: "too_optimistic" | "too_pessimistic";
  action_correct: boolean;
}

function trackConfidenceMismatch(scenario: Scenario, agg: AggregatedResult): ConfidenceMismatch | null {
  if (scenario.expected_confidence === agg.actual_confidence) return null;
  const confOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
  const expVal = confOrder[scenario.expected_confidence] ?? 1;
  const actVal = confOrder[agg.actual_confidence] ?? 1;
  return {
    scenario_id: scenario.id,
    expected: scenario.expected_confidence,
    actual: agg.actual_confidence,
    direction: actVal > expVal ? "too_optimistic" : "too_pessimistic",
    action_correct: scenario.expected_action === agg.actual_action,
  };
}

// ============================================================================
// Report generation — Markdown
// ============================================================================

function generateMarkdownReport(
  metadata: Record<string, string>,
  scenarios: Scenario[],
  results: ScenarioResult[],
  findings: Finding[],
  confidenceMismatches: ConfidenceMismatch[],
): string {
  const lines: string[] = [];
  const w = (s: string) => lines.push(s);

  const counts = countClassifications(results);

  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const betaBlockers = findings.filter((f) => f.beta_blocker);

  // 1. Title
  w("# ACC-09 — Adversarial Red-Team Pass #1");
  w("");

  // 2. Run Metadata
  w("## Run Metadata");
  w("");
  w(`| Field | Value |`);
  w(`|-------|-------|`);
  for (const [k, v] of Object.entries(metadata)) {
    w(`| ${k} | ${v} |`);
  }
  w("");

  // 3. Executive Summary
  w("## Executive Summary");
  w("");
  w(`| Classification | Count |`);
  w(`|---------------|-------|`);
  w(`| PASS | ${counts.pass} |`);
  w(`| FALSE PASS | ${counts.false_pass} |`);
  w(`| FALSE FAIL | ${counts.false_fail} |`);
  w(`| WRONG ACTION | ${counts.wrong_action} |`);
  w(`| PARTIAL | ${counts.partial} |`);
  w(`| UNEVALUABLE | ${counts.unevaluable} |`);
  w(`| **Total** | **${scenarios.length}** |`);
  w("");
  w(`- **Critical findings:** ${criticalFindings.length}`);
  w(`- **Beta blockers:** ${betaBlockers.length}`);
  w("");

  // 4. Critical Findings
  w("## Critical Findings");
  w("");
  if (criticalFindings.length === 0) {
    w("No critical findings.");
  } else {
    for (const f of criticalFindings) {
      w(`### ${f.scenario_id} — ${f.classification}`);
      w("");
      w(`**Vignette:** ${f.clinical_vignette}`);
      w(`**Expected:** action=${f.expected_action}, CCR=${f.expected_clean_claim_ready}, conf=${f.expected_confidence}, rules=[${f.expected_rule_hits.join(",")}]`);
      w(`**Actual:** action=${f.actual_action}, CCR=${f.actual_clean_claim_ready}, conf=${f.actual_confidence}, rules=[${f.actual_rule_hits.join(",")}]`);
      w(`**Root cause:** ${f.root_cause_bucket}`);
      w(`**Failure:** ${f.observed_failure_reason}`);
      w(`**Fix path:** ${f.recommended_fix_path}`);
      w(`**Beta blocker:** ${f.beta_blocker}`);
      w("");
    }
  }

  // 5. Beta Blockers
  w("## Beta Blockers");
  w("");
  if (betaBlockers.length === 0) {
    w("No beta blockers identified.");
  } else {
    w(`| Scenario | Classification | Severity | Root Cause | Failure |`);
    w(`|----------|---------------|----------|------------|---------|`);
    for (const f of betaBlockers) {
      w(`| ${f.scenario_id} | ${f.classification} | ${f.severity} | ${f.root_cause_bucket} | ${f.observed_failure_reason} |`);
    }
  }
  w("");

  // 6. Domain Scoreboard
  w("## Domain Scoreboard");
  w("");
  const domainNames: RuleDomain[] = ["PTP", "MUE", "MODIFIER", "GLOBAL", "DOC_SUFFICIENCY"];
  for (const domain of domainNames) {
    const domainScenarios = results.filter((r) => {
      const sc = scenarios.find((s) => s.id === r.scenario_id)!;
      return sc.domains_tested.includes(domain);
    });
    w(`### ${domain}`);
    w("");
    w(`| Metric | Count |`);
    w(`|--------|-------|`);
    w(`| Scenarios touching | ${domainScenarios.length} |`);
    w(`| PASS | ${domainScenarios.filter((r) => r.classification === "PASS").length} |`);
    w(`| FALSE PASS | ${domainScenarios.filter((r) => r.classification === "FALSE_PASS").length} |`);
    w(`| FALSE FAIL | ${domainScenarios.filter((r) => r.classification === "FALSE_FAIL").length} |`);
    w(`| WRONG ACTION | ${domainScenarios.filter((r) => r.classification === "WRONG_ACTION").length} |`);
    w(`| PARTIAL | ${domainScenarios.filter((r) => r.classification === "PARTIAL").length} |`);
    w(`| UNEVALUABLE | ${domainScenarios.filter((r) => r.classification === "UNEVALUABLE").length} |`);
    w("");
  }

  // 7. Scenario-Level Classification Summary
  w("## Scenario-Level Classification Summary");
  w("");
  w(`| Classification | Count | Pct |`);
  w(`|---------------|-------|-----|`);
  for (const [cls, count] of Object.entries(counts)) {
    w(`| ${cls.toUpperCase()} | ${count} | ${((count / scenarios.length) * 100).toFixed(1)}% |`);
  }
  w("");

  // 8. Confidence Mismatch Summary
  w("## Confidence Mismatch Summary");
  w("");
  const tooOpt = confidenceMismatches.filter((c) => c.direction === "too_optimistic");
  const tooPess = confidenceMismatches.filter((c) => c.direction === "too_pessimistic");
  w(`- **Total mismatches:** ${confidenceMismatches.length}`);
  w(`- **Too optimistic:** ${tooOpt.length}`);
  w(`- **Too pessimistic:** ${tooPess.length}`);
  w("");
  if (confidenceMismatches.length > 0) {
    w(`| Scenario | Expected | Actual | Direction | Action Correct |`);
    w(`|----------|----------|--------|-----------|---------------|`);
    for (const cm of confidenceMismatches.slice(0, 30)) {
      w(`| ${cm.scenario_id} | ${cm.expected} | ${cm.actual} | ${cm.direction} | ${cm.action_correct} |`);
    }
    if (confidenceMismatches.length > 30) {
      w(`| ... | ... | ... | ... | ... |`);
      w(`(${confidenceMismatches.length - 30} more omitted)`);
    }
  }
  w("");

  // 9. Schema / State Consistency Summary
  w("## Schema / State Consistency Summary");
  w("");
  const schemaFindings = findings.filter((f) => f.root_cause_bucket === "SCHEMA_STATE_BUG");
  if (schemaFindings.length === 0) {
    w("No schema/state consistency issues found.");
  } else {
    w(`| Scenario | Issue |`);
    w(`|----------|-------|`);
    for (const f of schemaFindings) {
      w(`| ${f.scenario_id} | ${f.observed_failure_reason} |`);
    }
  }
  w("");

  // 10. Full Findings
  w("## Full Findings");
  w("");
  const sortedFindings = [...findings].sort((a, b) => {
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const clsOrder: Record<string, number> = { FALSE_PASS: 0, FALSE_FAIL: 1, WRONG_ACTION: 2, PARTIAL: 3, UNEVALUABLE: 4 };
    const sevDiff = (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9);
    if (sevDiff !== 0) return sevDiff;
    return (clsOrder[a.classification] ?? 9) - (clsOrder[b.classification] ?? 9);
  });
  for (const f of sortedFindings) {
    w(`### ${f.scenario_id} — ${f.classification} (${f.severity})`);
    w("");
    w(`- **Vignette:** ${f.clinical_vignette}`);
    w(`- **Domain:** ${f.domain}`);
    w(`- **Beta blocker:** ${f.beta_blocker}`);
    w(`- **Expected:** action=${f.expected_action}, CCR=${f.expected_clean_claim_ready}, conf=${f.expected_confidence}`);
    w(`- **Actual:** action=${f.actual_action}, CCR=${f.actual_clean_claim_ready}, conf=${f.actual_confidence}`);
    w(`- **Expected rules:** [${f.expected_rule_hits.join(", ")}]`);
    w(`- **Actual rules:** [${f.actual_rule_hits.join(", ")}]`);
    w(`- **Expected suppressed:** [${f.expected_suppressed_codes.join(", ")}]`);
    w(`- **Actual suppressed:** [${f.actual_suppressed_codes.join(", ")}]`);
    w(`- **Expected missing info:** [${f.expected_missing_info_keys.join(", ")}]`);
    w(`- **Actual missing info:** [${f.actual_missing_info_keys.join(", ")}]`);
    w(`- **Root cause:** ${f.root_cause_bucket}`);
    w(`- **Failure:** ${f.observed_failure_reason}`);
    w(`- **Fix path:** ${f.recommended_fix_path}`);
    w("");
  }

  // 11. Architecture Follow-Ups
  w("## Architecture Follow-Ups");
  w("");
  w("### 1. Missing structured_fields for Documentation Validator");
  w("`diagnosis_text`, `anatomic_site`, and `approach` are not present in the ACC-02 structured_fields. This means:");
  w("- R-3.5.4 (rule-out diagnosis) can **never** fire — dangerous false passes on rule-out scenarios");
  w("- R-3.5.5 (anatomic specificity) **always** fires on all non-E/M codes — systemic noise");
  w("- R-3.5.3 (fracture approach) fires on all fracture codes regardless of actual documentation");
  w("");
  w("### 2. Missing structured_fields for Modifier Validator");
  w("`distinct_encounter_documented`, `distinct_site_documented`, `distinct_practitioner_documented`, `non_overlapping_service_documented` are absent. This causes R-3.3.2 to co-fire whenever R-3.3.1 or R-3.3.3 fires, turning force-review/warn into block.");
  w("");
  w("### 3. Missing structured_fields for Global Validator");
  w("`em_separately_identifiable` and `decision_for_surgery_documented` default to false, causing R-3.4.2 and R-3.4.3 to over-fire.");
  w("");
  w("### 4. clean_claim_ready Derivation");
  w("Per ACC-01 §3.0, `clean_claim_ready` is set to `false` only by block rules. Force-review leaves it unchanged. Derivation: `!hasBlock`.");
  w("");
  w("### 5. No Validator Orchestrator/Pipeline");
  w("All 5 validators run independently. There is no shared aggregation layer that combines results across validators and derives final state (action, clean_claim_ready, confidence). This harness implements ad-hoc aggregation. A production orchestrator is needed for ACC-10+.");
  w("");
  w("### 6. Audit Trace Gaps");
  w("Validators do not emit a unified audit trace or result version metadata. The `version_metadata` block is only in the `buildTestCodingOutput` helpers, not in the validator results themselves.");
  w("");

  // 12. ACC-10 Patch Queue Suggestions
  w("## ACC-10 Patch Queue Suggestions");
  w("");
  const rootCauseCounts: Record<string, number> = {};
  for (const f of findings) {
    rootCauseCounts[f.root_cause_bucket] = (rootCauseCounts[f.root_cause_bucket] ?? 0) + 1;
  }
  w("### By Root Cause");
  w("");
  w(`| Root Cause | Count | Priority Fix |`);
  w(`|-----------|-------|-------------|`);
  const sortedRC = Object.entries(rootCauseCounts).sort((a, b) => b[1] - a[1]);
  for (const [rc, count] of sortedRC) {
    const fix = assignFixPath(rc as RootCause);
    w(`| ${rc} | ${count} | ${fix} |`);
  }
  w("");
  w("### Recommended Priority Order");
  w("");
  w("1. **Add documentation evidence booleans to structured_fields** (MAPPING_BUG) — fixes ~30+ modifier and global false fails");
  w("2. **Add diagnosis_text to structured_fields or derive from clinical_input** (MAPPING_BUG) — fixes R-3.5.4 false passes (critical)");
  w("3. **Resolve clean_claim_ready semantics for force-review** (SCHEMA_STATE_BUG) — affects all force-review scenarios");
  w("4. **Add anatomic_site and approach to structured_fields** (MAPPING_BUG) — reduces R-3.5.5/R-3.5.3 noise");
  w("5. **Build validator orchestrator/pipeline** (ARCHITECTURE_RISK) — required for production integration");
  w("");

  return lines.join("\n");
}

// ============================================================================
// Report generation — JSON artifact
// ============================================================================

function generateJsonArtifact(
  metadata: Record<string, string>,
  scenarios: Scenario[],
  results: ScenarioResult[],
  findings: Finding[],
  confidenceMismatches: ConfidenceMismatch[],
): object {
  const counts = countClassifications(results);

  const domainNames: RuleDomain[] = ["PTP", "MUE", "MODIFIER", "GLOBAL", "DOC_SUFFICIENCY"];
  const domainSummary: Record<string, { total: number; pass: number }> = {};
  for (const domain of domainNames) {
    const domainResults = results.filter((r) => {
      const sc = scenarios.find((s) => s.id === r.scenario_id)!;
      return sc.domains_tested.includes(domain);
    });
    domainSummary[domain] = {
      total: domainResults.length,
      pass: domainResults.filter((r) => r.classification === "PASS").length,
      false_pass: domainResults.filter((r) => r.classification === "FALSE_PASS").length,
      false_fail: domainResults.filter((r) => r.classification === "FALSE_FAIL").length,
      wrong_action: domainResults.filter((r) => r.classification === "WRONG_ACTION").length,
      partial: domainResults.filter((r) => r.classification === "PARTIAL").length,
      unevaluable: domainResults.filter((r) => r.classification === "UNEVALUABLE").length,
    };
  }

  return {
    run_metadata: metadata,
    overall_summary: {
      total: scenarios.length,
      ...counts,
    },
    domain_summary: domainSummary,
    confidence_summary: {
      total_mismatches: confidenceMismatches.length,
      too_optimistic: confidenceMismatches.filter((c) => c.direction === "too_optimistic").length,
      too_pessimistic: confidenceMismatches.filter((c) => c.direction === "too_pessimistic").length,
      details: confidenceMismatches,
    },
    schema_state_summary: {
      issues: findings
        .filter((f) => f.root_cause_bucket === "SCHEMA_STATE_BUG")
        .map((f) => ({
          scenario_id: f.scenario_id,
          issue: f.observed_failure_reason,
        })),
    },
    findings: findings,
    scenario_results: results,
    patch_queue_suggestions: [
      { priority: 1, action: "Add documentation evidence booleans to structured_fields", root_cause: "MAPPING_BUG", affected_count: findings.filter((f) => f.root_cause_bucket === "MAPPING_BUG").length },
      { priority: 2, action: "Add diagnosis_text to structured_fields", root_cause: "MAPPING_BUG", target: "R-3.5.4" },
      { priority: 3, action: "Resolve clean_claim_ready force-review semantics", root_cause: "SCHEMA_STATE_BUG" },
      { priority: 4, action: "Add anatomic_site/approach to structured_fields", root_cause: "MAPPING_BUG", target: "R-3.5.5, R-3.5.3" },
      { priority: 5, action: "Build validator orchestrator", root_cause: "ARCHITECTURE_RISK" },
    ],
    architecture_followups: [
      "Missing structured_fields for documentation validator (diagnosis_text, anatomic_site, approach)",
      "Missing structured_fields for modifier validator (distinct_*_documented booleans)",
      "Missing structured_fields for global validator (em_separately_identifiable, decision_for_surgery_documented)",
      "clean_claim_ready derivation disagrees with test pack for force-review scenarios",
      "No unified validator orchestrator/pipeline",
      "No audit trace / result version metadata from validators directly",
    ],
  };
}

// ============================================================================
// Main execution
// ============================================================================

function main() {
  const projectRoot = resolve(import.meta.dir, "..");
  const scenarioPath = join(projectRoot, "specs", "ACC-02-scenarios.jsonl");
  const reportPath = join(projectRoot, "docs", "ACC-09-redteam-report.md");
  const artifactPath = join(projectRoot, "artifacts", "acc09-redteam-results.json");

  // Ensure output dirs exist
  for (const dir of [join(projectRoot, "docs"), join(projectRoot, "artifacts")]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  // Build run metadata
  const metadata = buildRunMetadata(projectRoot, {
    harness_file_path: "scripts/redteam-acc09.ts",
  });

  // Load scenarios
  console.log("Loading scenarios...");
  const scenarios = loadScenarios(scenarioPath);
  metadata.scenario_count_loaded = String(scenarios.length);
  console.log(`Loaded ${scenarios.length} scenarios.`);

  // Process each scenario
  const results: ScenarioResult[] = [];
  const findings: Finding[] = [];
  const confidenceMismatches: ConfidenceMismatch[] = [];

  for (const scenario of scenarios) {
    // Run all validators
    const runResult = runAllValidators(scenario.structured_fields);

    // Aggregate
    const agg = aggregateResults(scenario, runResult);

    // Classify
    const classification = classifyScenario(scenario, agg);

    // Track confidence mismatches
    const confMismatch = trackConfidenceMismatch(scenario, agg);
    if (confMismatch) confidenceMismatches.push(confMismatch);

    // Build scenario result
    const scenarioResult: ScenarioResult = {
      scenario_id: scenario.id,
      domain: scenario.domain,
      classification,
      expected_action: scenario.expected_action,
      actual_action: agg.actual_action,
      expected_clean_claim_ready: scenario.expected_clean_claim_ready,
      actual_clean_claim_ready: agg.actual_clean_claim_ready,
      expected_confidence: scenario.expected_confidence,
      actual_confidence: agg.actual_confidence,
      expected_rule_hits: scenario.expected_rule_hits,
      actual_rule_hits: agg.actual_rule_hits,
      finding: null,
    };

    if (classification !== "PASS") {
      const severity = assignSeverity(classification, scenario, agg);
      const betaBlocker = assignBetaBlocker(classification, severity, scenario, agg);
      const rootCause = assignRootCause(classification, scenario, agg);
      const fixPath = assignFixPath(rootCause);
      const failureReason = describeFailure(classification, scenario, agg);

      // Filter actual missing info keys to short-form only
      const actualMIK = agg.actual_missing_info_keys.filter((k) => !k.includes(" "));

      const finding: Finding = {
        scenario_id: scenario.id,
        domain: scenario.domains_tested.join("+"),
        classification,
        severity,
        beta_blocker: betaBlocker,
        clinical_vignette: scenario.clinical_vignette,
        expected_action: scenario.expected_action,
        actual_action: agg.actual_action,
        expected_clean_claim_ready: scenario.expected_clean_claim_ready,
        actual_clean_claim_ready: agg.actual_clean_claim_ready,
        expected_confidence: scenario.expected_confidence,
        actual_confidence: agg.actual_confidence,
        expected_rule_hits: scenario.expected_rule_hits,
        actual_rule_hits: agg.actual_rule_hits,
        expected_suppressed_codes: scenario.expected_suppressed_codes,
        actual_suppressed_codes: agg.actual_suppressed_codes,
        expected_missing_info_keys: scenario.expected_missing_info_keys,
        actual_missing_info_keys: actualMIK,
        root_cause_bucket: rootCause,
        observed_failure_reason: failureReason,
        recommended_fix_path: fixPath,
        domain_details: agg.domain_results,
        unevaluable_domains: agg.unevaluable_domains,
      };

      findings.push(finding);
      scenarioResult.finding = finding;
    }

    results.push(scenarioResult);
  }

  // Generate outputs
  console.log("\nGenerating markdown report...");
  const mdReport = generateMarkdownReport(metadata, scenarios, results, findings, confidenceMismatches);
  writeFileSync(reportPath, mdReport, "utf-8");
  console.log(`  → ${reportPath}`);

  console.log("Generating JSON artifact...");
  const jsonArtifact = generateJsonArtifact(metadata, scenarios, results, findings, confidenceMismatches);
  writeFileSync(artifactPath, JSON.stringify(jsonArtifact, null, 2), "utf-8");
  console.log(`  → ${artifactPath}`);

  // Print stdout summary
  const counts = countClassifications(results);
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const betaBlockerCount = findings.filter((f) => f.beta_blocker).length;

  console.log("\n" + "=".repeat(60));
  console.log("ACC-09 RED-TEAM SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total scenarios:     ${scenarios.length}`);
  console.log(`PASS:                ${counts.pass}`);
  console.log(`FALSE PASS:          ${counts.false_pass}`);
  console.log(`FALSE FAIL:          ${counts.false_fail}`);
  console.log(`WRONG ACTION:        ${counts.wrong_action}`);
  console.log(`PARTIAL:             ${counts.partial}`);
  console.log(`UNEVALUABLE:         ${counts.unevaluable}`);
  console.log(`---`);
  console.log(`Critical findings:   ${criticalCount}`);
  console.log(`Beta blockers:       ${betaBlockerCount}`);
  console.log(`Confidence mismatches: ${confidenceMismatches.length}`);
  console.log(`---`);
  console.log(`Report:    docs/ACC-09-redteam-report.md`);
  console.log(`Artifact:  artifacts/acc09-redteam-results.json`);
  console.log("=".repeat(60));

  // List critical false passes
  const criticalFP = findings.filter((f) => f.classification === "FALSE_PASS" && f.severity === "critical");
  if (criticalFP.length > 0) {
    console.log("\nCRITICAL FALSE PASSES:");
    for (const f of criticalFP) {
      console.log(`  ${f.scenario_id}: ${f.observed_failure_reason}`);
    }
  }
}

main();
