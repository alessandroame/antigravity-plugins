# Discovery Loop Contracts & Profiles (`discovery-loop`)

Reference specification for [`discovery-engine.mjs`](../../../core/discovery-engine.mjs), [`discovery.mjs`](../../../scripts/discovery.mjs), and [`discovery_workflow_template.py`](../../../references/discovery_workflow_template.py).

## 1. Profile Presets & 5-Condition Composite Exit Policy (`OR`)

Wall-clock duration is strictly a configurable safety cap (`maxWallClockMinutes`), never a minimum runtime floor:

| Profile | `maxWallClockMinutes` | `maxWaves` | `maxVariants` | `maxSubagentCalls` | `maxTotalTokens` | `stagnationWaves` | `targetSatisficingCount` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `quick` | `20` | `2` | `4` | `12` | `300,000` | `1` | `1` |
| `deep` | `60` | `4` | `8` | `28` | `800,000` | `2` | `2` |
| `overnight` | `120` | `6` | `12` | `48` | `1,500,000` | `2` | `2` |

Exit triggers (`EXIT_REASONS`):
1. `WALL_CLOCK_CAP`: `elapsedMs >= maxWallClockMinutes * 60000`.
2. `RESOURCE_BUDGET_REACHED`: any deterministic counter (`maxWaves`, `maxVariants`, `maxSubagentCalls`, `maxTotalTokens`) reached.
3. `TARGET_SATISFICED`: `satisficingOrthogonalCount >= targetSatisficingCount` with baseline improvement `>= targetBaselineMargin` (`0.10`).
4. `YIELD_COLLAPSE`: `consecutiveZeroYieldWaves >= yieldCollapseWaves` (`2`) or `lastWaveDuplicateRate > maxDuplicateRate` (`0.70`).
5. `PARETO_CONVERGED`: `wavesCompleted >= 1` and `consecutiveStagnantWaves >= stagnationWaves` (`delta < minImprovementDelta = 0.05`).

## 2. `discovery-brief.json` Contract

```json
{
  "schemaVersion": "1.0.0",
  "briefId": "a1b2c3d4e5f6",
  "createdAt": "2026-11-25T00:00:00.000Z",
  "goal": "Improve module determinism and clarity",
  "targetScope": ["plugins/example/module.mjs"],
  "profile": "deep",
  "stopPolicy": { "...": "profile preset + optional overrides" },
  "baseline": {
    "id": "baseline",
    "metrics": { "empiricalScore": 0.72, "invarianceRate": 0.9, "cognitiveScore": 0.75, "fiveFingerScore": 4, "complexityCost": 1 },
    "complexityCost": 1
  },
  "objectives": [
    { "key": "empiricalScore", "direction": "higher" },
    { "key": "invarianceRate", "direction": "higher" },
    { "key": "cognitiveScore", "direction": "higher" },
    { "key": "fiveFingerScore", "direction": "higher" },
    { "key": "complexityCost", "direction": "lower" }
  ]
}
```

## 3. 4-Oracle Stack & `discovery-verdict.json`

Every variant must clear all 4 blocking oracles (`empirical-data`, `invariance-fuzzing`, `blind-cognitive`, `technical-ab-bench`) before entering `computeParetoFrontier`.

`discovery-verdict.json` records:
- `exitReason` + `stopDecision` (`shouldStop`, `triggeredLimits`, `reasonIt`, `remainingBudget`)
- `mainBranchUntouched: true`
- `funnel` (`generatedCount`, `rejectedByOraclesCount`, `rejectionRatePct`, `passedCount`, `frontierCount`, `oracleRejectBreakdown`)
- `humanSelectionOptions` (Layer-1 non-dominated variants with `blindLabel`, `variantId`, `worktreeBranch`, `fiveFingerScore`, `improvementOverBaseline`)
- `rejectedVariants` (audit list of rejected variant IDs and exact blocking oracle reasons)
