---
name: trace-debugging
description: >-
  Use this skill when UI interaction bugs, state discrepancies, test failures, or silent errors
  occur to isolate the exact root cause via deterministic numbered breadcrumb tracing.
---

# Trace-Based Fault Localization Runbook

## 1. Objective
Replace speculative guessing with deterministic breadcrumb tracing that scientifically isolates the root cause between the last good checkpoint and the first corrupted hop. Always reply to the user in plain Italian.

---

## 2. 5-Step Pipeline

```text
[Defect Detected]
        │
        ▼
[1. Trace Instrumentation] ──► Inject numbered logs along the causal chain
        │
        ▼
[2. Execution & Capture]   ──► Run test/scenario and capture console output
        │
        ▼
[3. Fault Localization]    ──► Pinpoint Last Known Good Checkpoint
        │
        ▼
[4. Targeted Resolution]   ──► Fix only the isolated code segment
        │
        ▼
[5. Cleanup & Verification] ──► Strip all [DEBUG-TRACE] logs and run full test suite
```

---

## 3. Operational Procedure

### Step 1: Inject Numbered Checkpoints
Insert temporary trace logs at key hops of the causal chain:
```javascript
console.log('[DEBUG-TRACE #1] Event triggered', { trigger, params });
console.log('[DEBUG-TRACE #2] Precondition guard passed', { state });
console.log('[DEBUG-TRACE #3] Pure computation output', { input, output });
console.log('[DEBUG-TRACE #4] State mutation completed', { before, after });
console.log('[DEBUG-TRACE #5] UI render updated', { domResult });
```

### Step 2: Execute & Capture
Run the unit test or reproduction script to capture the emitted sequence.

### Step 3: Pinpoint the Fault
1. Identify the **Last Known Good Checkpoint** (highest checkpoint index with valid values).
2. The root cause lies strictly between the last good checkpoint and the next missing or corrupted checkpoint.

### Step 4: Surgical Fix
Modify only the isolated segment without mixing broad refactors into the bug fix.

### Step 5: Total Cleanup & Verification
- **Strip trace logs**: Remove every `[DEBUG-TRACE]` line from source files before delivery.
- **Verify**: Run the full test suite to confirm zero regressions and a clean console.
