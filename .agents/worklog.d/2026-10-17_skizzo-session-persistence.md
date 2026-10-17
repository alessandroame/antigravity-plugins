# 2026-10-17 — Persistenza Sticky di Sessione e Comandi di Stop Naturali in `skizzo` v1.4.0

## Contesto e Causa Radice (`Turn-2 State Amnesia`)
Quando l'utente attiva `/skizzo` (da solo o insieme al primo compito `/skizzo <task>`), al Turno 1 Antigravity inietta `skills/skizzo/SKILL.md`. Nei Turni 2..N della stessa conversazione, quando l'utente invia normali messaggi operativi senza ripetere `/skizzo`, Antigravity non ri-inietta `SKILL.md` ma espone solo `rules/AGENTS.md` e lo storico della sessione. La precedente formulazione (`Inattivo di Default (OFF)` come primo punto senza guardia di ereditarietà multi-turno né riga dedicata nella Tabella di Anti-Razionalizzazione) induceva il modello a tornare silenziosamente in modalità normale dal secondo messaggio in poi.

## Decisioni Architetturali (Sintesi Dual-Track Alpha + Beta)
1. **Latch di Persistenza Sticky in `O(1)` basato sullo Storico Sessione (`rules/AGENTS.md` & `SKILL.md`)**:
   - Codificata la regola di **Verifica a Inizio Turno**: ad ogni nuovo messaggio (anche privo di `/skizzo`), se nello storico della conversazione corrente è stato attivato `/skizzo` o compare il banner `MODALITÀ SKIZZO ATTIVA` senza un successivo comando di stop, `SKIZZO = ON` (e `MEDIATOR = ON` se era attivo `--mediator`) resta bloccato e il ciclo a 4 fasi viene eseguito obbligatoriamente.
   - Evitato qualsiasi polling su file disco a inizio turno per preservare il vincolo Zero-Overhead nelle sessioni normali (`SKIZZO = OFF`).
2. **Comandi di Stop Tolleranti (Slash + Linguaggio Naturale)**:
   - Supportati `/skizzo stop`, `/skizzo off`, `/skizzo` (a vuoto quando `ON`) e le frasi naturali `stop skizzo`, `ferma skizzo`, `disattiva skizzo`, `esci da skizzo`, `chiudi skizzo`.
   - Gestito il caso combinato (*"stop skizzo, fai X"*): disattivazione immediata, rimozione del prefisso `[SKIZZO]` dal titolo chat ed esecuzione diretta di *X* nel flusso standard.
3. **Tabella di Anti-Razionalizzazione e Compattazione Budget (`<= 6.500 B`)**:
   - Aggiunta in testa alla Tabella di Anti-Razionalizzazione di `plugins/skizzo/rules/AGENTS.md` la regola che vieta di tornare al flusso normale quando il nuovo messaggio non contiene `/skizzo`, compattando il file a `6.370 byte` (`<= 6.500 byte`).

## Impatto e Verifiche
- Aggiornati `plugins/skizzo/rules/AGENTS.md`, `plugins/skizzo/skills/skizzo/SKILL.md`, `plugins/skizzo/skills/skizzo/references/dialectic-template.md`, `plugins/skizzo/plugin.json` (`v1.4.0`) e `plugins/skizzo/README.md`.
- Sincronizzato il catalogo globale tramite `npm run sync` e validato con `npm test` (`11/11` plugin `OK`, `0` errori).
