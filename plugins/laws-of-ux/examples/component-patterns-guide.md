# Guida ai Pattern di Componenti (Laws of UX)

Questa guida illustra pattern di componenti frontend comuni (Button, Form, Stepper, Card, Loader), confrontando implementazioni scorrette (**Anti-pattern ❌**) e implementazioni ottimali (**Best Practice ✅**) guidate dalle leggi di UX.

---

## 1. Pulsanti e Azioni (CTA)
*Leggi di riferimento: Fitts's Law, Von Restorff Effect, Doherty Threshold*

### ❌ Anti-pattern
```html
<!-- PROBLEMA: Tre bottoni identici con lo stesso colore e peso visivo -->
<!-- Touch target minuscolo (padding 4px) e nessun distanziamento -->
<div style="display: flex; gap: 2px;">
  <button style="padding: 4px; font-size: 11px; background: #007bff; color: white;">Salva</button>
  <button style="padding: 4px; font-size: 11px; background: #007bff; color: white;">Bozza</button>
  <button style="padding: 4px; font-size: 11px; background: #007bff; color: white;">Elimina</button>
</div>
```

### ✅ Best Practice
```html
<!-- SOLUZIONE: Un solo bottone primario (Von Restorff), target minimo 48px (Fitts) -->
<!-- Spaziatura adeguata (gap 12px) e stato di caricamento istantaneo (Doherty) -->
<div class="action-bar" style="display: flex; gap: 12px; align-items: center;">
  <!-- Primario prominente -->
  <button class="btn btn-primary" style="min-height: 48px; min-width: 120px; padding: 12px 24px;">
    Salva e Continua
  </button>
  <!-- Secondario discreto -->
  <button class="btn btn-secondary" style="min-height: 48px; padding: 12px 16px;">
    Salva Bozza
  </button>
  <!-- Distruttivo isolato a destra -->
  <button class="btn btn-ghost-danger" style="min-height: 48px; margin-left: auto; color: #dc3545;">
    Elimina
  </button>
</div>
```

---

## 2. Form Input e Validazione
*Leggi di riferimento: Postel's Law, Law of Proximity, Parkinson's Law*

### ❌ Anti-pattern
```html
<!-- PROBLEMA: Label staccata dall'input (violazione Proximity), nessun attributo autocomplete -->
<!-- Errore rigido se l'utente inserisce uno spazio nel codice fiscale o telefono -->
<div style="margin-bottom: 24px;">
  <span>Numero di Telefono</span>
  <div style="height: 20px;"></div> <!-- Spazio eccessivo tra label e input -->
  <input type="text" placeholder="Solo cifre senza prefisso ne spazi" />
  <!-- Errore mostrato solo dopo il refresh della pagina -->
</div>
```

### ✅ Best Practice
```html
<!-- SOLUZIONE: Label associata direttamente (Proximity 6px) -->
<!-- Autocomplete abilitato (Parkinson's Law), tolleranza degli input (Postel's Law) -->
<div class="form-group" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
  <label for="tel" style="font-weight: 600; font-size: 14px;">
    Numero di Telefono <span aria-hidden="true" style="color: #dc3545;">*</span>
  </label>
  <input 
    id="tel" 
    name="tel" 
    type="tel" 
    autocomplete="tel" 
    placeholder="+39 340 123 4567" 
    style="min-height: 48px; padding: 10px 14px; border: 1px solid #ccc; border-radius: 8px;"
  />
  <span class="hint-text" style="font-size: 12px; color: #666;">
    Accettiamo qualsiasi formato con o senza prefisso internazionale.
  </span>
</div>
```

---

## 3. Flussi Multi-step & Wizard
*Leggi di riferimento: Goal-Gradient Effect, Zeigarnik Effect, Chunking*

### ❌ Anti-pattern
- Un unico form chilometrico con 45 campi tutti visibili in una singola pagina a scorrimento infinito.
- Nessuna indicazione di quanto tempo o quanti passaggi mancano al completamento.

### ✅ Best Practice
```html
<!-- SOLUZIONE: Stepper visivo con connessione uniforme (Law of Uniform Connectedness) -->
<!-- Progresso evidente fin dal primo step per attivare il Goal-Gradient Effect -->
<nav aria-label="Avanzamento procedura" class="stepper" style="display: flex; align-items: center; gap: 8px; margin-bottom: 32px;">
  <div class="step step-complete" style="display: flex; align-items: center; gap: 6px;">
    <span class="badge" style="background: #28a745; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">✓</span>
    <span style="font-weight: 600;">1. Dati Personali</span>
  </div>
  <div class="line" style="flex: 1; height: 2px; background: #28a745;"></div>
  
  <div class="step step-active" style="display: flex; align-items: center; gap: 6px;">
    <span class="badge" style="background: #007bff; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">2</span>
    <span style="font-weight: 600; color: #007bff;">2. Spedizione (In corso)</span>
  </div>
  <div class="line" style="flex: 1; height: 2px; background: #e0e0e0;"></div>

  <div class="step step-pending" style="display: flex; align-items: center; gap: 6px; color: #999;">
    <span class="badge" style="background: #e0e0e0; color: #666; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">3</span>
    <span>3. Pagamento</span>
  </div>
</nav>
```

---

## 4. Stati di Caricamento & Latenza
*Leggi di riferimento: Doherty Threshold, Peak-End Rule*

### ❌ Anti-pattern
- Schermata completamente bianca o congelata per 3 secondi mentre i dati vengono scaricati via rete.
- L'utente clicca freneticamente più volte convinto che il sito non stia funzionando.

### ✅ Best Practice
- Mostrare uno **Skeleton Loader** entro 200ms dal caricamento iniziale per delineare la sagoma dei contenuti in arrivo ed eliminare il CLS.
- Rispettare la **Timing Hierarchy**:
  - `< 1s`: nessun loader invasivo.
  - `1-3s`: spinner contestuale inline.
  - `3-10s`: barra di avanzamento percentuale con messaggio rassicurante (*"Elaborazione in corso: 65%..."*).
  - `> 10s`: stima temporale residua ed esecuzione asincrona in background.
- Per invii critici o cancellazioni, implementare il pattern **Undo Grace Period**: toast con countdown di 5 secondi e pulsante "Annulla" prima del commit definitivo (NN/G Euristica #3).

---

## 5. Interfacce Autonome & Suggerimenti AI (Standard 2026 - Windmill #11)
*Leggi di riferimento: Explainability (Show the Reasoning), Cheap Takeover, User Control & Freedom*

### ❌ Anti-pattern
- Un sistema AI precompila campi o riscrive testi senza indicare da dove ha estratto l'informazione.
- Nessuna indicazione di confidenza; se l'utente vuole correggere una parola, l'interfaccia cancella l'intero blocco costringendolo a rifare tutto manualmente (elevato costo di takeover).

### ✅ Best Practice
```html
<!-- SOLUZIONE: Indicatore di confidenza inline, fonte verificabile e override con 1 click -->
<div class="ai-suggestion-box" style="border: 1px solid #cce5ff; background: #f0f8ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="background: #007bff; color: white; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 12px;">AI SUGGESTION</span>
      <span style="font-size: 12px; color: #495057;">Confidenza: <strong>96%</strong></span>
    </div>
    <!-- Fonte verificabile senza uscire dal contesto -->
    <a href="#view-source" style="font-size: 12px; color: #007bff; text-decoration: underline;">Visualizza documento sorgente (PDF p. 3)</a>
  </div>

  <p style="font-size: 14px; color: #212529; margin-bottom: 12px;">
    "Indirizzo di fatturazione dedotto automaticamente dalla visura camerale allegata."
  </p>

  <!-- Cheap Takeover: modifica rapida o rifiuto senza azzeramento -->
  <div style="display: flex; gap: 8px;">
    <button class="btn btn-sm btn-primary" style="padding: 6px 12px; font-size: 13px;">Accetta</button>
    <button class="btn btn-sm btn-outline" style="padding: 6px 12px; font-size: 13px;">Modifica inline</button>
    <button class="btn btn-sm btn-ghost" style="padding: 6px 12px; font-size: 13px; color: #6c757d;">Ignora</button>
  </div>
</div>
```

---

## 6. Ricerca & Filtri di Catalogo (Baymard & NN/G #6)
*Leggi di riferimento: Recognition over Recall, Hick's Law, Choice Overload*

### ❌ Anti-pattern
- Barra di ricerca a campo vuoto senza cronologia né suggerimenti; se l'utente sbaglia una lettera ("smarthone"), la pagina mostra "0 risultati trovati" senza alternative.
- Elenco prodotti con 40 checkbox disordinate senza raggruppamento né conteggio elementi.

### ✅ Best Practice
- **Ricerca Intelligente**: dropdown ad autocompletamento visivo che propone ricerche recenti, categorie correlate e prodotti suggeriti con miniatura. Tolleranza semantica ai refusi (*"Risultati per 'smartphone' invece di 'smarthone'"*).
- **5 Categorie di Filtro Baymard**:
  1. *Categoria* (es. Elettronica, Accessori).
  2. *Specifiche tecniche* (es. RAM, Memoria, Colore).
  3. *Fascia di prezzo* (slider o range predefiniti con conteggio).
  4. *Rating recensioni* (da 4 stelle in su).
  5. *Disponibilità* (es. "Spedizione immediata (14)").
- **Filtri Attivi Visibili**: ogni filtro selezionato compare in alto sotto forma di badge/pill rimovibile singolarmente o con pulsante "Cancella tutti i filtri".

