// ACC-11: Tests for the centralized UI gating state resolver
import { describe, it, expect } from "vitest";
import { resolveGatingState } from "@/hooks/useResultGatingState";
import {
  MOCK_DETERMINISTIC_READY,
  MOCK_DETERMINISTIC_REVIEW_PENDING,
  MOCK_DETERMINISTIC_REVIEW_MEDIUM,
  MOCK_DETERMINISTIC_BLOCKED,
  MOCK_DETERMINISTIC_BLOCKED_FALLBACK,
} from "@/components/results/mockData";
import type { DeterministicCodingOutput } from "@/types/ruleEngine";

describe("resolveGatingState — ACC-11 canonical state resolver", () => {
  // =========================================================================
  // STATE_READY
  // =========================================================================

  it("1. returns STATE_READY for clean high-confidence result", () => {
    expect(resolveGatingState(MOCK_DETERMINISTIC_READY)).toBe("STATE_READY");
  });

  it("2. returns STATE_READY when clean_claim_ready=true, force_review_pending=false, confidence=high", () => {
    const output: DeterministicCodingOutput = {
      ...MOCK_DETERMINISTIC_READY,
      clean_claim_ready: true,
      force_review_pending: false,
      confidence: "high",
    };
    expect(resolveGatingState(output)).toBe("STATE_READY");
  });

  // =========================================================================
  // STATE_REVIEW_REQUIRED
  // =========================================================================

  it("3. returns STATE_REVIEW_REQUIRED when force_review_pending=true", () => {
    expect(resolveGatingState(MOCK_DETERMINISTIC_REVIEW_PENDING)).toBe("STATE_REVIEW_REQUIRED");
  });

  it("4. returns STATE_REVIEW_REQUIRED when confidence=medium (no force_review)", () => {
    expect(resolveGatingState(MOCK_DETERMINISTIC_REVIEW_MEDIUM)).toBe("STATE_REVIEW_REQUIRED");
  });

  it("5. returns STATE_REVIEW_REQUIRED for force_review_pending=true even with high confidence", () => {
    const output: DeterministicCodingOutput = {
      ...MOCK_DETERMINISTIC_READY,
      force_review_pending: true,
      confidence: "high",
    };
    expect(resolveGatingState(output)).toBe("STATE_REVIEW_REQUIRED");
  });

  // =========================================================================
  // STATE_BLOCKED
  // =========================================================================

  it("6. returns STATE_BLOCKED when clean_claim_ready=false with explicit block rules", () => {
    expect(resolveGatingState(MOCK_DETERMINISTIC_BLOCKED)).toBe("STATE_BLOCKED");
  });

  it("7. returns STATE_BLOCKED for fallback (clean_claim_ready=false, no block rules)", () => {
    expect(resolveGatingState(MOCK_DETERMINISTIC_BLOCKED_FALLBACK)).toBe("STATE_BLOCKED");
  });

  // =========================================================================
  // Priority order: blocked > review_required > ready
  // =========================================================================

  it("8. blocked wins over review_required (clean_claim_ready=false + force_review_pending=true)", () => {
    const output: DeterministicCodingOutput = {
      ...MOCK_DETERMINISTIC_BLOCKED,
      force_review_pending: true,
      confidence: "medium",
    };
    expect(resolveGatingState(output)).toBe("STATE_BLOCKED");
  });

  it("9. blocked wins over medium confidence", () => {
    const output: DeterministicCodingOutput = {
      ...MOCK_DETERMINISTIC_READY,
      clean_claim_ready: false,
      confidence: "medium",
    };
    expect(resolveGatingState(output)).toBe("STATE_BLOCKED");
  });

  it("10. review_required wins over ready when confidence=medium", () => {
    const output: DeterministicCodingOutput = {
      ...MOCK_DETERMINISTIC_READY,
      clean_claim_ready: true,
      force_review_pending: false,
      confidence: "medium",
    };
    expect(resolveGatingState(output)).toBe("STATE_REVIEW_REQUIRED");
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  it("11. low confidence with clean_claim_ready=false returns STATE_BLOCKED", () => {
    const output: DeterministicCodingOutput = {
      ...MOCK_DETERMINISTIC_READY,
      clean_claim_ready: false,
      confidence: "low",
    };
    expect(resolveGatingState(output)).toBe("STATE_BLOCKED");
  });

  it("12. low confidence with clean_claim_ready=true returns STATE_READY (low confidence alone does not gate)", () => {
    // Per task spec: "Do not create a separate fourth state"
    // Low confidence with clean_claim_ready=true and no force_review is STATE_READY
    const output: DeterministicCodingOutput = {
      ...MOCK_DETERMINISTIC_READY,
      clean_claim_ready: true,
      force_review_pending: false,
      confidence: "low",
    };
    expect(resolveGatingState(output)).toBe("STATE_READY");
  });
});
