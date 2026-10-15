# [2026-10-15] ADR: Buffer Pre-Desiderata `NOTES.md`, Cattura In-Flight (`/take-note`) e Triage Differito (`/review-notes`)

## Contesto & Motivazione
Durante l'uso di un'applicazione (es. GlideMind) o mentre è già aperta una lavorazione in corso (`🟡 In Lavorazione` in `DESIDERATA.md`), emergono osservazioni di UX, idee o anomalie da annotare. Scriverle direttamente nella conversazione attiva innesca cambi di contesto prematuri e spinge l'agente ad analizzare file sorgente che la lavorazione corrente sta ancora modificando. Era necessario un meccanismo a due fasi (CQRS cognitivo): cattura istantanea passiva durante il lavoro e comando dedicato per mostrare le note ed eseguire il task di analisi approfondita a lavorazione conclusa.

## Decisioni Architetturali
1. **Estensione di `cognitive-persistence` (v1.2.0) a Ciclo Cognitivo 3+1**:
   - In conformità al principio di *Univocità Semantica del Dominio* (`skill-governance`), il buffer pre-desiderata `NOTES.md` è stato integrato in `cognitive-persistence` anziché frammentato in un plugin separato.
2. **Skill `/take-note` (`plugins/cognitive-persistence/skills/take-note/SKILL.md`)**:
   - Registra una nota singola o un batch multi-nota in `NOTES.md` con ID incrementale (`NOTE-XXX`), data/ora e metadato `Lavorazione Attiva al Momento della Nota` (estratto da `DESIDERATA.md`).
   - Impone una **Guardia Rigida Anti-Analisi Prematura**: divieto assoluto di invocare tool di lettura/ricerca sul codice applicativo o di formulare ipotesi risolutive durante la cattura. Risposta di 1 riga e ripresa immediata del task attivo.
3. **Skill `/review-notes` (`plugins/cognitive-persistence/skills/review-notes/SKILL.md`)**:
   - Comando unificato per **mostrare il cruscotto delle note aperte** (`📥 Da Analizzare`) ed **eseguire il task di analisi approfondita** (selettore interattivo `ask_question`, `/review-notes NOTE-XXX` o `/review-notes all`).
   - Esegue la riconciliazione del delta post-lavorazione (verifica se i task completati nel frattempo hanno impattato l'oggetto della nota), ispeziona il codice sorgente aggiornato, applica le lenti `laws-of-ux` / `proactive-mentorship`, rinomina la sessione via `set-chat-title.mjs` e consolida l'esito promuovendo il requisito in `DESIDERATA.md` e spostando la nota sotto `✅ Analizzate & Consolidate`.
4. **Allineamento `/next-step` e `/memory-sync`**:
   - `/next-step` segnala in modo non bloccante l'eventuale presenza di note aperte in `NOTES.md`.
   - `/memory-sync` chiude eventuali `NOTE-XXX` associate al task appena completato.

## Impatto e Conseguenze
- Validazione statica `node scripts/validate.mjs --all`: 0 errori.
- Sincronizzazione fisica globale `npm run sync` completata in `~/.gemini/config/plugins/cognitive-persistence`.
- Inizializzato `c:/github/glidemind/NOTES.md` con le prime 3 note (`NOTE-001`, `NOTE-002`, `NOTE-003`).
