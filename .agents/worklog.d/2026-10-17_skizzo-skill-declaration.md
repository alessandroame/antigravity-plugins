# 2026-10-17 — Evoluzione Plugin `skizzo` v1.2.0 -> v1.3.0: Auto-Routing Skill, Barriera di Silenzio e Restituzione "Human-First"

## Contesto
Nel flusso Dual-Track (`/skizzo`), l'analisi empirica dello screenshot in chat (`~600px`) ha evidenziato due esigenze complementari:
1. Dichiarare in modo sintetico e automatico le skill specialistiche usate da `Alpha` e `Beta` senza ripetere meta-skill (`skizzo`) e senza rompere il rendering Markdown/LaTeX.
2. Sostituire nel blocco visibile a 0-Click il gergo autoreferenziale da prompt engineer (`Contratto Esterno`, `Motore Interno`, `Tesler/Postel`, `Oracolo Alpha 3/3 PASS`) con **4 risposte in italiano quotidiano** comprensibili a qualsiasi utente, eliminando inoltre i messaggi intermedi quando un subagent termina prima dell'altro.

## Decisioni Architetturali (Sintesi Dialettica `/skizzo`)
- **Auto-Routing Skill Foglia & Esclusione Meta-Skill (Fase 1)**: l'Orchestratore seleziona automaticamente **1–2 skill verticali** per binario (`<skills-alpha>` tecniche, `<skills-beta>` dominio/UX, vietato assegnare `skizzo` o `ab-bench`) e le inietta nel campo `**Skill Attive Assegnate**:`.
- **Barriera di Silenzio su Wakeup Parziale**: quando il primo subagent termina mentre il secondo è ancora `running`, è vietato emettere testo intermedio in chat (`0 byte` di output finché entrambi non hanno risposto).
- **Formato "Human-First" a 4 Punti (Fase 4 — Zero Gergo Fuori da `<details>`)**:
  - Nel blocco visibile sono banditi termini interni (`Contratto Esterno`, `Motore Interno`, `Tesler/Postel`, `0-Click`, `Oracolo Alpha/Beta`), contabilità di file (`npm run sync`, `MEMORY.md`, byte) e formule LaTeX (`$...$`).
  - I 4 bullet visibili rispondono sempre a: **Cosa cambia per te**, **Comodità difesa dall'Agente Utente (Beta)**, **Problema evitato dall'Agente Tecnico (Alpha)** e **Su cosa non erano d'accordo (e perché vince questa soluzione)** + **Controlli: Tutti i test superati (X/X OK)**.
  - Tutta la contabilità tecnica e la Matrice Dialettica risiedono nel cassetto `<details>`.

## Impatto & Verifica
- Aggiornati [`plugins/skizzo/plugin.json`](file:///c:/github/antigravity-plugins/plugins/skizzo/plugin.json) (`v1.3.0`), [`plugins/skizzo/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/rules/AGENTS.md), [`plugins/skizzo/skills/skizzo/SKILL.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/skills/skizzo/SKILL.md), [`plugins/skizzo/skills/skizzo/references/dialectic-template.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/skills/skizzo/references/dialectic-template.md), [`plugins/skizzo/README.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/README.md) e [`plugins/ab-bench/scripts/bench.mjs`](file:///c:/github/antigravity-plugins/plugins/ab-bench/scripts/bench.mjs).
- Sincronizzato il plugin in `~/.gemini/config/plugins/skizzo` tramite `npm run sync` e superati gli 8 controlli di `Oracolo Alpha` e `Oracolo Beta`.
