# Template Report: UX Heuristic Audit (Laws of UX)

Utilizza questo schema standardizzato per condurre e documentare una revisione euristica di una schermata, di un flusso di conversione o di un'applicazione web/mobile secondo le 30 Laws of UX.

---

# [Nome Progetto] - UX Heuristic Audit Report
- **Data Audit**: AAAA-MM-GG
- **Revisore**: [Nome / Antigravity Agent]
- **Schermata / Flusso Esaminato**: [es. Flusso di Checkout / Onboarding / Dashboard Principale]
- **Target Device**: [Desktop / Mobile / Tablet]

---

## 1. Executive Summary
*Fornisci una sintesi di 3-5 frasi sulle condizioni generali dell'interfaccia, i principali punti di forza e le aree di attrito più critiche.*

### Valutazione Globale per Pilastro (Punteggio 1-5):
- 📐 **Principi Gestalt & Layout**: ⭐⭐⭐⭐☆ (4/5)
- 🎯 **Interazione ed Ergonomia**: ⭐⭐⭐☆☆ (3/5)
- 🧠 **Carico Cognitivo & Memoria**: ⭐⭐⭐☆☆ (3/5)
- ⏱️ **Comportamento, Reattività & Tempo**: ⭐⭐⭐⭐☆ (4/5)

---

## 2. Dettaglio delle Violazioni Riscontrate

### 🔴 Criticità P0 (Bloccanti / Critical)
#### [Titolo della Criticità, es. Touch Target sovrapposti nella Bottom Bar]
- **Legge Violata**: `Fitts's Law`
- **Descrizione**: I pulsanti 'Conferma' e 'Annulla' su mobile hanno un'altezza di soli 28px e uno spazio intermedio di 2px, provocando frequenti tap accidentali.
- **Impatto sull'Utente**: Errori irreversibili di sottomissione e frustrazione elevata.
- **Raccomandazione di Remediation**:
  - Aumentare l'area di tocco ad almeno 48×48 px.
  - Introdurre uno spazio di sicurezza minimo di 12 px tra le due azioni.
  - Distinguere cromaticamente l'azione primaria da quella secondaria (Von Restorff Effect).

---

### 🟠 Criticità P1 (Elevate / High)
#### [Titolo della Criticità, es. Sovraccarico di 25 filtri non categorizzati]
- **Legge Violata**: `Hick's Law` & `Choice Overload`
- **Descrizione**: Nella sidebar di ricerca prodotti vengono mostrati simultaneamente 25 checkbox senza alcuna categorizzazione o suddivisione logica.
- **Impatto sull'Utente**: Decision paralysis, abbandono della pagina.
- **Raccomandazione di Remediation**:
  - Raggruppare i filtri in 4 macro-categorie collassabili (Chunking / Miller's Law).
  - Mostrare inizialmente solo le 5 opzioni più selezionate con un link 'Mostra altri'.

---

### 🟡 Rilievi P2 (Medie / Medium)
#### [Titolo del Rilievo, es. Mancanza di Feedback durante il caricamento del report]
- **Legge Violata**: `Doherty Threshold`
- **Descrizione**: Al click su 'Genera Report PDF', l'applicazione non mostra alcun feedback per circa 1.8 secondi, inducendo l'utente a cliccare ripetutamente.
- **Impatto sull'Utente**: Richieste duplicate al backend e percezione di malfunzionamento.
- **Raccomandazione di Remediation**:
  - Disabilitare immediatamente il pulsante al click entro 100ms e mostrare uno spinner o skeleton animato.

---

### 🟢 Ottimizzazioni P3 (Basse / Polish)
#### [Titolo dell'Ottimizzazione, es. Schermata finale di successo poco coinvolgente]
- **Legge Violata**: `Peak-End Rule`
- **Descrizione**: Dopo il checkout, appare un semplice testo grigio 'Operazione riuscita'.
- **Raccomandazione**: Arricchire l'epilogo con un riepilogo visivo chiaro, un'illustrazione gratificante e link rapidi per tracciare la spedizione.

---

## 3. Checklist di Verifica Post-Intervento
- [ ] Tutti i target interattivi rispettano la soglia minima di 48×48 px (Fitts's Law).
- [ ] Ogni interazione fornisce feedback visivo entro 400ms (Doherty Threshold).
- [ ] I campi form complessi sono formattati e normalizzati automaticamente (Postel's Law).
- [ ] Le liste e i form lunghi sono strutturati in chunk logici di 5-7 elementi (Miller's Law / Chunking).
- [ ] La CTA primaria è unica e visivamente prominente (Von Restorff Effect).
