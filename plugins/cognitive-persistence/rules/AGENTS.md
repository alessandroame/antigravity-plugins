# Disciplina di Continuità Cognitiva e Memoria di Progetto

Questo documento prescrive la persistenza strutturata delle decisioni architetturali, dei vincoli appresi e dello stato evolutivo del software per garantire continuità tra sessioni e chat indipendenti.

---

## 1. La Triade Cognitiva di Progetto

Ogni progetto governato da questo plugin adotta tre file canonici per la conservazione della memoria:

1. **`MEMORY.md` (Vincoli Stabili & Lezioni Apprese)**:
   - Registra le "lezioni apprese a caro prezzo" (es. incompatibilità di librerie, insidie di rendering mobile, race condition scoperte, antipattern banditi).
   - Deve essere aggiornato ogni volta che un bug sottile o un vicolo cieco architetturale viene risolto, formulando: (a) Problema riscontrato, (b) Causa radice, (c) Pattern vincolante di prevenzione.
2. **`WORKLOG.md` (Diario Cronologico degli Interventi & ADR)**:
   - Storico immutabile e leggibile degli interventi eseguiti.
   - Si alimenta tramite frammenti granulari nella cartella `.agents/worklog.d/` (formato `YYYY-MM-DD_<argomento>.md`) che documentano contesto, decisioni e impatti, successivamente consolidati nel giornale mastro.
3. **`DESIDERATA.md` (Matrice di Stato delle Funzionalità)**:
   - Mappa le funzionalità pianificate, in corso (`🟡 In Lavorazione`) o completate (`🟢 Completato`).
   - Fornisce all'agente entrante la visione d'insieme su cosa è già implementato e cosa resta da realizzare, evitando re-invenzioni o regressioni di requisiti.

---

## 2. Direttiva di Fine Task (End-of-Task Sync)

Al termine di ogni implementazione o correzione strutturale, l'agente non deve concludere il task senza aver sincronizzato lo stato cognitivo:

1. **Creazione Frammento**: Redigere la scheda dell'intervento in `.agents/worklog.d/`.
2. **Aggiornamento Lezioni**: Se sono emersi limiti o insidie, registrare la voce in `MEMORY.md`.
3. **Allineamento Matrice**: Aggiornare lo stato corrispondente in `DESIDERATA.md`.
