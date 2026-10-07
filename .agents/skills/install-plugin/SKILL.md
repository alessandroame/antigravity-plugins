---
name: install-plugin
description: Procedura per installare o associare uno dei plugin di antigravity-plugins all'interno di un altro progetto, inclusa l'analisi automatica di conflitti, skill/regole concorrenti o duplicate e proposte di bonifica.
---

# Procedura di Installazione Plugin e Audit Concorrenza

Questa procedura standardizza l'associazione di un plugin della raccolta a una directory di progetto esterna, eseguendo un audit sistematico delle personalizzazioni preesistenti per evitare collisioni e ridondanze.

---

## 1. Risoluzione dei Parametri
- **Plugin sorgente**: verificare l'esistenza in `c:\github\antigravity-plugins\plugins\<nome-plugin>`.
- **Progetto destinazione**: individuare la cartella radice del progetto target (es. `c:\github\<nome-progetto>`).

---

## 2. Audit Concorrenza e Sovrapposizioni (Pre- o Post-Installazione)

Prima o contestualmente al collegamento, analizzare le personalizzazioni già presenti nel target (`.agents/skills/`, `.agents/rules/`, `.agents/plugins/`):

1. **Collisioni di Nome / Identificativo**:
   - Verificare se esistono skill o file con lo stesso nome (`name:` nel frontmatter YAML o cartelle omonime). In Antigravity, nomi duplicati provocano override prioritari o scarti silenti.
2. **Duplicati Semantici e Frammentazione**:
   - Identificare regole o skill "loose" preesistenti create in precedenza come prototipi o workaround che svolgono lo stesso compito ora incapsulato nel plugin.
3. **Incongruenze e Contrasti Normativi**:
   - Verificare se regole esistenti nel target contengono direttive in contraddizione con il nuovo plugin (ad es. uso di termini vietati dalla nuova blacklist del plugin).

### Matrice di Valutazione e Azioni Proposte:
Per ogni elemento concorrente identificato, proporre all'utente una tra le seguenti azioni:
- **Deprecazione / Rimozione**: se la regola o skill locale è un duplicato esatto o reso obsoleto dal plugin.
- **Sfoltimento (Refactoring)**: se una regola locale conteneva sia parti generiche (ora nel plugin) sia parti specifiche di dominio (da preservare nel progetto).
- **Risoluzione Conflitto**: bonificare file del progetto che violano le nuove direttive del plugin.

---

## 3. Modalità di Collegamento del Plugin

- **Directory Junction (Consigliata su Windows)**:
  ```powershell
  New-Item -ItemType Junction -Path "<target>\.agents\plugins\<nome-plugin>" -Target "c:\github\antigravity-plugins\plugins\<nome-plugin>"
  ```
- **Configurazione Dichiarativa (`plugins.json`)**:
  Aggiungere il plugin alla lista `entries` di `<target>\.agents\plugins.json`.

---

## 4. Report all'Utente
Fornire un output strutturato contenente:
- Esito del collegamento (percorso e componenti attivati).
- Tabella delle skill/regole concorrenti o duplicate rilevate.
- Piano di bonifica proposto, in attesa di autorizzazione prima di modificare o eliminare file nel progetto target.
