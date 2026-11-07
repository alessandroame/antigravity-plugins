---
name: circuit-breaker
description: >-
  Use this skill when repeated build or test errors occur to trigger quantitative circuit breakers, detect identical consecutive failures, and enforce immediate git rollback on test regressions.
---

# Circuit Breaker Protocol & Loop Governor

## 1. Objective
Prevent recursive fix loops, exponential token waste, and fragile workarounds during autonomous coding. Always reply to the user in plain Italian.

---

## 2. Invariant Error Detection

1. **Error Tracking**:
   Before applying a fix, record the exact error message, failed assertion, and file/line number.
2. **Post-Edit Comparison**:
   IF the exact same error recurs on the same line after an edit:
   - *Attempt 1*: Formulate a distinct structural approach.
   - *Attempt 2*: IF the identical error recurs a 2nd consecutive time, **IMMEDIATELY TRIGGER THE CIRCUIT BREAKER**. NEVER attempt a 3rd retry.

---

## 3. Regression Rollback Guard

IF a fix causes previously passing tests to fail:
1. IMMEDIATELY revert the breaking changes (`git checkout -- <file>`).
2. NEVER layer additional patches on top of a broken test state.
3. Restart analysis from the last verified green state.

---

## 4. STUCK Escalation Report (User-Facing in Italian)

WHEN a circuit breaker trips:
1. STOP all automated file edits immediately.
2. Present a structured escalation report to the user in plain Italian:
   - **Obiettivo Fallito**: File esatto, funzione o test non superato.
   - **Ipotesi Testate**: Sintesi dei tentativi effettuati nelle iterazioni precedenti.
   - **Causa Radice del Blocco**: Motivo per cui l'architettura o il contesto attuale rigetta la modifica.
   - **Due Alternative Architetturali**: Proporre 2 soluzioni pulite e strutturali (non workaround) chiedendo all'utente come preferisce procedere.
