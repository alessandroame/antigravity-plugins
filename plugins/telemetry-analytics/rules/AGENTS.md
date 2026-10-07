# Regole di Telemetria, Analytics e Riservatezza Dati

Questo documento definisce i criteri operativi per la gestione delle metriche di utilizzo dei plugin e dei tool nel runtime di Antigravity.

---

## 1. Principi di Trasparenza Metrica e Sobrietà
1. **Misurazioni Oggettive**:
   - Riportare i valori temporali in millisecondi (`ms`) o secondi (`s`), con metriche quantitative dimostrate (`calls`, `success rate`, `tokens`).
   - Evitare qualsiasi aggettivazione enfatica o stime arbitrarie non ancorate ai log di esecuzione.
2. **Visibilità degli Errori**:
   - Dichiarare apertamente i fallimenti dei tool di sistema e i tassi di successo senza omissioni o arrotondamenti compiacenti.

---

## 2. Architettura Ibrida e Riservatezza Locale
1. **Confini di Persistenza**:
   - Tutti i dati di telemetria risiedono esclusivamente nel filesystem locale dell'utente (`~/.gemini/antigravity/analytics/`).
   - È severamente vietato trasmettere eventi di telemetria, payload di log o percorsi a endpoint di rete esterni.
2. **Isolamento Workspace**:
   - Quando si presentano report su richiesta dell'utente, limitare la visualizzazione predefinita al workspace corrente, a meno che l'utente non richieda esplicitamente la vista globale cross-project.
