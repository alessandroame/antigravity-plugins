# ADR 2026-10-21 — Collaudo Browser Obbligatorio (`ui-geometry-probe.js`) e Ricevuta Visiva a 4 Misure (Zero Quote Artificiali)

## Contesto
Durante lo sviluppo di interfacce ad alta densità informativa e operative sul campo (come GlideMind), l'agente tendeva a:
1. Fermarsi ai test statici in Node.js (`npm test`) senza avviare il browser reale.
2. Quando ispezionava uno screenshot, applicare un giudizio compiacente "da inventario" (*"vedo header, card e mappa -> tutto ok"*), ignorando mappe soffocate dai pannelli (`< 60%` viewport), effetto "muro di box" privi di gerarchia, controlli coperti da overlay (`z-index`) o azioni di click il cui effetto finiva fuori schermo (*below the fold*).
3. D'altro canto, imporre una "quota fissa di almeno 2 difetti da trovare" violerebbe il Rasoio di Occam, costringendo l'agente a inventare problemi inesistenti quando la UI è già ben proporzionata.

## Decisioni Architetturali
1. **Sonda Geometrica Eseguibile nel Browser (`ui-geometry-probe.js`)**:
   - Creato [`plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js) (verificato da [`tests/ui-geometry-probe.test.mjs`](file:///c:/github/antigravity-plugins/tests/ui-geometry-probe.test.mjs)) per misurare oggettivamente su `360x800` e `1280x800`: overflow orizzontale, touch target `< 44px`, testo troncato (`scrollWidth > clientWidth`), controlli coperti da overlay (`document.elementFromPoint`) e soffocamento del canvas primario (`heightRatio < 0.55`).
2. **Ricevuta Oggettiva a 4 Misure (Senza Quote Artificiali di Difetti)**:
   - Aggiornati [`plugins/engineering-workflow/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/rules/AGENTS.md) (Gate 4 e Gate 5 + Tabella Anti-Razionalizzazione) e [`plugins/laws-of-ux/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/laws-of-ux/rules/AGENTS.md) (Sezioni 2, 7 e 9):
     1. **Budget Schermo 60/40**: `>= 60%` del viewport `360x800` libero per mappa/grafico primario.
     2. **Gerarchia in 3 Secondi & Unità Inseparabili**: max 4 card *above-the-fold*, 3 livelli tipografici netti e `white-space: nowrap` su `valore + unità`.
     3. **Esito Sonda Geometrica**: `violations: 0` su `ui-geometry-probe.js`.
     4. **Flusso Reale (`Prima -> Click -> Dopo`)**: effetto dell'interazione visibile senza scrollare e `0` errori console.
   - Se tutte e 4 le misure sono già regolari al primo controllo, il risultato prescritto è **0 modifiche** (Rasoio di Occam).

## Impatto e Verifica
- Validazione statica (`node scripts/validate.mjs --all`): `13/13 plugin OK, 0 errori`.
- Test unitari sonda (`node --test tests/ui-geometry-probe.test.mjs`): `2/2 PASS`.
- Sincronizzazione globale (`npm run sync`): aggiornati `~/.gemini/config/plugins/engineering-workflow` e `~/.gemini/config/plugins/laws-of-ux`.
