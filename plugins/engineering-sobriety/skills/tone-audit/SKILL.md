---
name: tone-audit
description: Esegue la scansione e la bonifica di un repository o di singoli documenti per rimuovere termini promozionali, enfasi di marketing, convenevoli ed espressioni pseudo-tattiche.
---

# Skill: Tone & Sobriety Audit

Questa skill guida l'analisi sistematica del codebase e della documentazione per identificare ed eliminare linguaggio promozionale, superlativi e termini non tecnici.

## Procedura Operativa

### 1. Scansione Lessicale
Eseguire una ricerca mirata dei termini vietati nei file di testo, documentazione e commenti:
- Pattern di ricerca: `rivoluzionario`, `game-changer`, `stato dell'arte`, `eccellenza`, `battle-tested`, `bulletproof`, `cockpit`, `tattico`, `radar`, `pulsante magico`, `silver bullet`.
- Verificare la presenza di convenevoli superflui nei prompt di sistema e nelle risposte automatiche.

### 2. Bonifica e Sostituzione
- Applicare le sostituzioni obbligatorie indicate in `rules/AGENTS.md`.
- Sostituire formule enfatiche con descrizioni oggettive, parametri fisici e dati misurabili.

### 3. Verifica Integrità Test
- Ispezionare i test unitari e verificare l'assenza di asserzioni tautologiche (self-matching) o mock fittizi.
- Segnalare ogni test che non verifica una proprietà reale e indipendente.

### 4. Output del Report
Produrre una sintesi asciutta:
- Numero di file scansionati.
- Occorrenze bonificate suddivise per file.
- Eventuali anomalie riscontrate nei test.
