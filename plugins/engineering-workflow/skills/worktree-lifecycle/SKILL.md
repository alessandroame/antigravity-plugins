---
name: worktree-lifecycle
description: >-
  Gestione completa del ciclo di vita dei Git Worktrees. Utilizza per inizializzare rami di lavoro isolati,
  evitare collisioni tra sessioni concorrenti, verificare lo stato del repository e procedere al teardown pulito.
---

# Git Worktree Lifecycle Runbook

## 1. Perché Usare i Git Worktree
Nei flussi di sviluppo agentico concorrente o quando si aprono più sessioni con Antigravity, cambiare branch direttamente all'interno della cartella principale con `git checkout -b` modifica i file condivisi in tempo reale, corrompendo le sessioni parallele.
I Git Worktree permettono di avere directory separate su disco per ciascun branch di feature, completamente isolate.

---

## 2. Sequenza Operativa

### Fase 1: Pre-flight Guard
Verificare che il repository non contenga modifiche pendenti non tracciate o in conflitto:
```bash
git status --porcelain
```
Se sono presenti modifiche non committate dell'utente, chiedere indicazioni prima di procedere.

### Fase 2: Creazione del Worktree
Creare la cartella isolata a fianco del repository principale:
```bash
git worktree add ../<repo>-<nome-feature> -b feature/<nome-feature>
```
Dirigere tutte le successive letture, scritture e comandi dell'agente verso `../<repo>-<nome-feature>`.

### Fase 3: Sviluppo e Verifica
1. Implementare le modifiche necessarie.
2. Eseguire l'intera suite di test e verifica nel worktree.
3. Presentare all'utente il resoconto con i comandi o gli URL di collaudo.

### Fase 4: Consolidamento e Pre-Commit (Post-Approvazione)
Una volta ottenuto il consenso esplicito dell'utente:
1. Eseguire lo staging chirurgico dei soli file rilevanti:
   ```bash
   git add <file1> <file2>
   git commit -m "feat(<scope>): <descrizione Conventional Commits>"
   ```
2. Riportare il contesto sulla cartella principale del repository:
   ```bash
   git checkout main
   git merge feature/<nome-feature>
   ```

### Fase 5: Teardown Pulito
Rimuovere il worktree e cancellare il branch unito:
```bash
git worktree remove ../<repo>-<nome-feature>
git branch -d feature/<nome-feature>
```
