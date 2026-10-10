---
name: tone-audit
description: Esegue la scansione e la bonifica del codice e della documentazione per rimuovere termini promozionali, convenevoli, enfasi di marketing ed emoji decorative non funzionali.
---

# Skill: Tone & Sobriety Audit

Questa skill guida l'analisi sistematica del codebase e della documentazione per identificare ed eliminare linguaggio promozionale, superlativi e termini non tecnici.

## Procedura Operativa

### 1. Scansione Lessicale ed Emoji Decorativi
Eseguire una ricerca mirata nei file di testo, documentazione, commenti e markup UI:
- **Termini Vietati**: `rivoluzionario`, `game-changer`, `stato dell'arte`, `eccellenza`, `battle-tested`, `bulletproof`, `cockpit`, `tattico`, `radar`, `pulsante magico`, `silver bullet`.
- **Convenevoli Superflui**: Formule di apertura di cortesia nei prompt di sistema e nelle risposte automatiche.
- **Emoji Decorative**: Ricerca nei sorgenti UI e viste di simboli non funzionali (`📈`, `🎙️`, `⏱️`, `ℹ️`, `🚀`, `✨`, `🔥`, `🎉`, `💡`).

### 2. Bonifica e Sostituzione
- Applicare le sostituzioni obbligatorie indicate in `rules/AGENTS.md`.
- Sostituire formule enfatiche con descrizioni oggettive, parametri fisici e dati misurabili.
- Rimuovere le emoji decorative o sostituirle con indicatori semantici/icone accessibili con `aria-label`.

### 3. Verifica Integrità Test
- Ispezionare i test unitari e verificare l'assenza di asserzioni tautologiche (self-matching) o mock fittizi.
- Segnalare ogni test che non verifica una proprietà reale e indipendente.

### 4. Output del Report
Produrre una sintesi asciutta:
- Numero di file scansionati.
- Occorrenze bonificate suddivise per file.
- Eventuali anomalie riscontrate nei test.
