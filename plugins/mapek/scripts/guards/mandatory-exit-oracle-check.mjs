#!/usr/bin/env node
/**
 * MAPE-K Synthesized L3 Deterministic Guard (mandatory-exit-oracle-check)
 * Precondition: Session modifies >= 2 code files and closes without executing any automated test or static validator
 * Oracle: 100% of multi-file code modification sessions execute at least one test/validation command before exit
 */

export function evaluateSynthesizedGuard(sessionSummary = {}) {
  const modified = Number(sessionSummary.modifiedCodeFiles || 0);
  const verified = Number(sessionSummary.verificationRuns || 0);
  const unverifiedStreak = Number(sessionSummary.consecutiveUnverifiedEdits || 0);
  const passed = (modified < 2 || verified > 0) && unverifiedStreak < 3;
  return {
    passed,
    guardId: 'mandatory-exit-oracle-check',
    reason: passed ? "OK" : "Verification oracle missing or unverified edit spiral detected"
  };
}
