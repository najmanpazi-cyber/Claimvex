// ACC-11: Centralized UI Gating State Resolver
//
// Single source of truth for mapping a DeterministicCodingOutput into
// one canonical frontend display state: READY | REVIEW_REQUIRED | BLOCKED.
//
// Priority order (mandatory):
//   1. BLOCKED — if clean_claim_ready === false
//   2. REVIEW_REQUIRED — if force_review_pending === true OR confidence === "medium"
//   3. READY — otherwise

import { useState, useMemo, useCallback } from "react";
import type {
  DeterministicCodingOutput,
  RuleEvaluation,
  SuppressedCode,
  ForceReviewItem,
} from "@/types/ruleEngine";

// ---------------------------------------------------------------------------
// State enum
// ---------------------------------------------------------------------------

export type ResultGatingState = "STATE_READY" | "STATE_REVIEW_REQUIRED" | "STATE_BLOCKED";

// ---------------------------------------------------------------------------
// Derived state returned by the hook
// ---------------------------------------------------------------------------

export interface GatingState {
  /** Canonical UI state */
  uiState: ResultGatingState;

  /** Force review items from the API response */
  reviewItems: ForceReviewItem[];

  /** Rule evaluations where action_type === "block" AND trigger_matched */
  blockedRules: RuleEvaluation[];

  /** Suppressed codes from the API response */
  suppressedCodes: SuppressedCode[];

  /** Whether interactive actions (export, print, copy) should be disabled */
  actionsDisabled: boolean;

  /** Whether the review has been acknowledged (STATE_REVIEW_REQUIRED only) */
  reviewAcknowledged: boolean;

  /** Checklist state for individual force_review_items (index → checked) */
  checklistState: boolean[];

  /** Check/uncheck a single checklist item */
  toggleChecklistItem: (index: number) => void;

  /** Acknowledge review (when no checklist items, or all items checked) */
  acknowledgeReview: () => void;

  /** Whether all checklist items are checked (or no items exist) */
  allItemsChecked: boolean;

  /** Display label for CleanClaimIndicator */
  indicatorLabel: string;

  /** Color variant for state: "success" | "warning" | "error" */
  indicatorVariant: "success" | "warning" | "error";

  /** Banner message — null if STATE_READY */
  bannerMessage: string | null;

  /** Whether this is a fallback blocked state (no explicit block rules) */
  isFallbackBlocked: boolean;
}

// ---------------------------------------------------------------------------
// Pure state resolver — no React, testable standalone
// ---------------------------------------------------------------------------

export function resolveGatingState(
  output: DeterministicCodingOutput
): ResultGatingState {
  // Priority 1: blocked wins over everything
  if (output.clean_claim_ready === false) {
    return "STATE_BLOCKED";
  }
  // Priority 2: review_required wins over ready
  if (output.force_review_pending === true || output.confidence === "medium") {
    return "STATE_REVIEW_REQUIRED";
  }
  // Priority 3: ready
  return "STATE_READY";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useResultGatingState(
  output: DeterministicCodingOutput | null
): GatingState | null {
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const [checklistState, setChecklistState] = useState<boolean[]>([]);

  // Derive gating state from output
  const derived = useMemo(() => {
    if (!output) return null;

    const uiState = resolveGatingState(output);

    const reviewItems = output.force_review_items ?? [];
    const blockedRules = (output.rule_evaluations ?? []).filter(
      (re) => re.trigger_matched && re.action_type === "block"
    );
    const suppressedCodes = output.suppressed_codes ?? [];

    const isFallbackBlocked = uiState === "STATE_BLOCKED" && blockedRules.length === 0;

    // Indicator
    let indicatorLabel: string;
    let indicatorVariant: "success" | "warning" | "error";
    let bannerMessage: string | null;

    switch (uiState) {
      case "STATE_READY":
        indicatorLabel = "Ready for Review";
        indicatorVariant = "success";
        bannerMessage = null;
        break;
      case "STATE_REVIEW_REQUIRED":
        indicatorLabel = "Review Required";
        indicatorVariant = "warning";
        bannerMessage = reviewItems.length > 0
          ? "The following items require your review before this result can be used."
          : "Coder review is required before using this result. Confidence is not high enough for direct use.";
        break;
      case "STATE_BLOCKED":
        indicatorLabel = "Blocked";
        indicatorVariant = "error";
        bannerMessage = isFallbackBlocked
          ? "This result is not claim-ready based on validator state. Review the issues and rationale below before proceeding."
          : "Resolve the issues below before submitting this claim.";
        break;
    }

    return {
      uiState,
      reviewItems,
      blockedRules,
      suppressedCodes,
      indicatorLabel,
      indicatorVariant,
      bannerMessage,
      isFallbackBlocked,
    };
  }, [output]);

  // Reset acknowledgment and checklist when output changes
  useMemo(() => {
    if (output) {
      setReviewAcknowledged(false);
      setChecklistState(
        (output.force_review_items ?? []).map(() => false)
      );
    }
  }, [output]);

  const allItemsChecked = useMemo(() => {
    if (!derived) return false;
    if (derived.reviewItems.length === 0) return true;
    return checklistState.length > 0 && checklistState.every(Boolean);
  }, [derived, checklistState]);

  const toggleChecklistItem = useCallback((index: number) => {
    setChecklistState((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const acknowledgeReview = useCallback(() => {
    setReviewAcknowledged(true);
  }, []);

  if (!derived) return null;

  // Actions disabled logic:
  // - BLOCKED: always disabled (not dismissible)
  // - REVIEW_REQUIRED: disabled until review acknowledged
  // - READY: enabled
  const actionsDisabled =
    derived.uiState === "STATE_BLOCKED" ||
    (derived.uiState === "STATE_REVIEW_REQUIRED" && !reviewAcknowledged);

  return {
    ...derived,
    actionsDisabled,
    reviewAcknowledged,
    checklistState,
    toggleChecklistItem,
    acknowledgeReview,
    allItemsChecked,
  };
}
