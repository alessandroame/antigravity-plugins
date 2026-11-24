# [2026-11-24] ADR: Studio Ciclo di Scoperta Orchestrato Guidato da Oracoli (`oracle-guided-discovery-loop`)

## Contesto & Motivazione
Valutata l'efficacia di sessioni orchestrate lunghe (`1+` ora) con personalità eterogenee, "stupide" o irrazionali per generare scoperte su software e interfacce utente. Il puro dibattito libero tra modelli produce consenso fittizio, caricature facilmente scartabili e deriva del contesto dopo `20-30` turni; al contrario, personalità divergenti risultano efficaci come **operatori di mutazione** solo se accoppiate a un filtro di selezione basato su oracoli oggettivi esterni.

## Decisioni Architetturali
1. **Scarto del roleplay libero non ancorato**: adozione dello schema *Mutazione -> Oracolo -> Selezione* su 3 fasi temporizzate (`15m + 25m + 20m`) in worktree isolati (`run_workflow` con `workspace="share"`/`"branch"`), senza toccare `main` prima dell'approvazione umana.
2. **Design a `0` byte inline (`rules/AGENTS.md` invariati)**: realizzazione pianificata come pure-skill/workflow on-demand (`plugins/ab-bench` `v1.1.0` o nuovo plugin puro) con 3 archetipi mutatori agnostici al dominio e 4 oracoli oggettivi (empirico su dati reali, invarianza/fuzzing, test cognitivo cieco su screenshot, sonde tecniche + `/ab-bench`).

## Impatto e Conseguenze
- Creato il piano esecutivo [`.agents/plans/oracle-guided-discovery-loop.md`](../plans/oracle-guided-discovery-loop.md).
- Inserito il modulo come prima voce `🔴 Prioritario` in [`DESIDERATA.md`](../../DESIDERATA.md) e registrato il puntatore in [`WORKLOG.md`](../../WORKLOG.md).
