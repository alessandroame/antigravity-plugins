---
name: tone-audit
description: >-
  Use this skill when scanning and sanitizing code, UI markup, and documentation
  to remove promotional hype, sycophantic filler, and non-functional decorative emojis.
---

# Skill: Tone & Sobriety Audit (`/tone-audit`)

Guides systematic scanning and sanitization of codebase, UI copy, and documentation to eliminate promotional language, superlatives, and decorative emojis. Always reply to the user in plain Italian.

## Operational Procedure

### Step 1: Lexical & Decorative Emoji Scan
Search text files, documentation, comments, and UI markup for:
- **Forbidden Hype Terms**: `rivoluzionario`, `game-changer`, `stato dell'arte`, `eccellenza`, `battle-tested`, `bulletproof`, `cockpit`, `tattico`, `radar`, `pulsante magico`, `silver bullet`.
- **Sycophantic Openers**: Polite filler in system prompts and automated responses.
- **Decorative Emojis**: Non-functional symbols in UI views and headings (`📈`, `🎙️`, `⏱️`, `ℹ️`, `🚀`, `✨`, `🔥`, `🎉`, `💡`).

### Step 2: Sanitization & Replacement
- Apply the mandatory Italian replacements defined in `rules/AGENTS.md`.
- Replace emphatic claims with objective descriptions, physical parameters, and measurable metrics.
- Remove decorative emojis or replace them with semantic indicators / accessible icons with `aria-label`.

### Step 3: Test Integrity Check
- Inspect unit tests for tautological assertions (self-matching) or fake mocks that do not verify an independent property.

### Step 4: Audit Report (in Italian)
Present a concise summary in plain Italian:
- Number of files scanned.
- Sanitized occurrences grouped by file.
- Any test integrity anomalies detected.
