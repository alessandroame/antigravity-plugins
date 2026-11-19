#!/usr/bin/env node
/**
 * MAPE-K Synthesized L3 Deterministic Guard (halt-unverified-edit-spiral)
 * Precondition: >= 3 consecutive edit turns on overlapping files without intermediate test or probe execution
 * Oracle: Zero consecutive re-edit spirals >= 3 without an intermediate EXEC:TEST or EXEC:VALIDATE step
 */

export function evaluateSynthesizedGuard(sessionSummary = {}) {
  const modified = Number(sessionSummary.modifiedCodeFiles || 0);
  const verified = Number(sessionSummary.verificationRuns || 0);
  const unverifiedStreak = Number(sessionSummary.consecutiveUnverifiedEdits || 0);
  const passed = (modified < 2 || verified > 0) && unverifiedStreak < 3;
  return {
    passed,
    guardId: 'halt-unverified-edit-spiral',
    reason: passed ? "OK" : "Verification oracle missing or unverified edit spiral detected"
  };
}
