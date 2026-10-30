# `mapek` — Supervisore Sempre Attivo dei Processi Umano-AI

Plugin di supervisione continua a ciclo chiuso (**Monitor -> Analyze -> Plan -> Gate Umano -> Execute -> Knowledge**) che osserva in sola lettura le traiettorie di lavoro tra l'operatore umano e l'AI, individua colli di bottiglia ripetuti tra sessioni e progetti, progetta la personalizzazione nativa più leggera (Controlli automatici `L3`, **Agenti isolati `agents/*.md` `L2c`**, Procedure `SKILL.md` `L2b` o Regole `L2a`), comunica le decisioni in formato **Semantic Drill-Down** e attende sempre il permesso esplicito prima di agire.

<details>
<summary><strong>1. Funzionamento Sempre Attivo e Garanzia Zero Modifiche Silenziose — Osserva da solo, ma scrive solo dopo il tuo sì</strong></summary>

Il plugin opera automaticamente su tutte le conversazioni umane senza bisogno di digitare comandi:
- **Hook `Stop` (`scripts/mapek-stop-hook.mjs`)**: a fine turno (`< 5ms`, `0` rumore in chat) conta le sessioni umane aggiornate e ogni `3` sessioni (o `12` ore) lancia in background `mapek.mjs --analyze --quiet` in **sola lettura**.
- **Hook `PreInvocation` (`scripts/mapek-pre-hook.mjs`)**: resta completamente silenzioso (`{}\n`) finché tutto fila liscio; solo quando matura una decisione ad alto risparmio (`PENDING_APPROVAL`), avvisa l'agente di mostrarti la scheda motivata in Drill-Down e chiederti il consenso con `ask_question`.
- **Gate di Consenso nel Codice (`authorizeDecisionExecution`)**: anche da riga di comando, `mapek.mjs --apply <id>` blocca qualunque scrittura o rimozione se manca `--confirm-user-approval`.

</details>

<details>
<summary><strong>2. I 5 Attriti di Processo Monitorati e la Scelta dello Strumento — Ogni problema viene risolto col meccanismo a minor consumo di token</strong></summary>

A differenza di `pattern-harvester` (che conta sequenze sintattiche di comandi) e `telemetry-analytics` (che misura i consumi grezzi), `mapek` analizza la qualità del dialogo `Umano <-> AI`:
1. **`PREMATURE_IMPLEMENTATION_LOOP`**: modifiche su `>= 3` file nei primi turni senza piano né file bersaglio espliciti, seguite da ripetute correzioni sugli stessi file -> instradato verso **Procedura `SKILL.md` (`L2b`)**.
2. **`UNANCHORED_CORRECTION_SPIRAL`**: `>= 3` ritocchi consecutivi sugli stessi file senza eseguire test intermedi -> instradato verso **Controllo Deterministico (`L3`)**.
3. **`CONTEXT_ENTROPY_DRIFT`**: chat trascinate oltre `150k` token e `20` turni senza compattazione né subagent -> instradato verso **Agente Isolato `agents/*.md` (`L2c`)**.
4. **`HUMAN_ROUTER_MICROMANAGEMENT`**: `>= 5` micro-comandi brevi consecutivi con cui l'umano fa da passacarte manuale -> instradato verso **Agente Esecutore Isolato (`L2c`)**.
5. **`MISSING_VERIFICATION_ORACLE`**: sessioni con modifiche a più file sorgente chiuse senza alcun test o validazione -> instradato verso **Controllo di Uscita (`L3`)**.

</details>

<details>
<summary><strong>3. Apprendimento Adattivo e Potatura dopo 10 Sessioni — Tace su ciò che sai già fare e propone di eliminare le regole inutili</strong></summary>

- **Profilo di Padronanza (`operator-mastery.json`)**: calcola una media mobile esponenziale sulle 5 dimensioni operative. Sulle abitudini con punteggio `>= 80%` mantiene il silenzio; concentra le indicazioni pratiche solo dove rileva attrito attivo (`< 55%`).
- **Verifica Post-Adozione (`process-ledger.json`)**: ogni decisione che approvi viene monitorata per le `10` sessioni successive. Se l'attrito scende di almeno il `20%` viene promossa a `VALIDATED`; altrimenti diventa `STALE_CANDIDATE` e il supervisore ti chiede il permesso di rimuoverla per liberare contesto.

<details>
<summary>Comandi CLI Manuali L2 — Ispezione on-demand, approvazione, rifiuto e test</summary>

```powershell
# Rapporto completo in formato Semantic Drill-Down (sola lettura)
node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --digest

# Visualizza la bozza completa di una decisione in sospeso
node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --show <decisionId>

# Applica una decisione approvata (esegue validate.mjs + test + sync globale con rollback automatico)
node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --apply <decisionId> --confirm-user-approval

# Rifiuta (cooldown 30 giorni) o rimanda (24 ore)
node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --reject <decisionId>
node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --snooze <decisionId>
```

</details>

</details>
