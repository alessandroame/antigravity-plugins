# Blind A/B Evaluation Protocol for Prompts, Skills & Plugins (`/ab-bench`)

Governs empirical blind A/B benchmarking between a baseline control (**Sfidante A — Base**) and an enhanced variant (**Sfidante B — Trattamento**) using the **5-Finger Test** and time/value ROI. Always reply to the user in plain Italian.

## 1. Default Dormancy & Activation Triggers (`/ab-bench`)
1. **Dormant by Default (`OFF`)**: Inactive unless the user explicitly invokes `/ab-bench` or asks for an A/B comparison.
2. **Zero-Config Modes**:
   - `/ab-bench <compito>`: compares **Senza `/skizzo` (Controllo)** vs **Con `/skizzo` (Dual-Track)**.
   - `/ab-bench --skill <nome> <compito>`: compares **Senza `<nome>`** vs **Con `<nome>`**.
   - `/ab-bench "<Prompt A>" vs "<Prompt B>"`: compares the two prompt formulations.
   - `/ab-bench --stats`: renders historical scoreboard from `~/.gemini/antigravity/analytics/ab-bench-history.ndjson`.

## 2. Blind Protocol & 5-Finger Binary Evaluation
1. **Isolation & Anonymization (`Soluzione X` vs `Soluzione Y`)**: Run `A` and `B` in isolated `research` subagents; `scripts/bench.mjs` strips plugin banners/links (`sanitizeForBlindJudge`) and assigns cryptographic blind labels `Soluzione X`/`Soluzione Y` before invoking the **Blind Judge Subagent** (`Giudice Cieco`; self-grading by parent is FORBIDDEN).
2. **Binary 5-Finger Scale (`0` or `1` per Finger, Total `0..5`, no decimals)**:
   - **Pollice (`Va al primo colpo`)**: Complete, immediately runnable, zero syntax errors, crashes, or unfinished `TODO`s.
   - **Indice (`Meno click / fatica`)**: Minimizes manual steps, clicks, and unnecessary user choices.
   - **Medio (`Tolleranza input sporchi`)**: Normalizes extra spaces, mixed separators, and imperfect inputs (Postel's Law).
   - **Anulare (`Tenuta casi limite`)**: Handles empty/null inputs, extremes, and `360px` viewports without breaking.
   - **Mignolo (`Logica pulita / separata`)**: Isolates calculation engine from UI and verifies with deterministic tests.
3. **Time/Value Verdict (Occam's Razor via `bench.mjs` on `transcript.jsonl`)**:
   - `Fingers(B) > Fingers(A)` -> **SÌ, VALEVA LA PENA** (`Vince B`, reporting gained fingers and seconds delta).
   - `Fingers(B) == Fingers(A)` -> **NO, TEMPO SPRECATO** (`Vince A`, same score in fewer steps/time).
   - `Fingers(B) < Fingers(A)` -> **NO, DANNO DA OVER-ENGINEERING** (`Vince A`).
