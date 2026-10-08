# Antigravity Plugin: Laws of UX

Plugin completo per **Google Antigravity** che unifica le **30 Laws of UX** (Jon Yablonski), le **10 Euristiche di Usabilità di Nielsen Norman Group (NN/G)**, i **benchmark empirici di Baymard Institute** (su 200.000+ ore di test di form ed e-commerce) e i **principi 2026 per interfacce autonome/AI** (Windmill & UXPilot).

Il plugin agisce come un sistema intelligente di **Regole contestuali** e **Skill specializzate**, attivandosi automaticamente quando l'agente progetta, scrive o revisiona codice di interfaccia (HTML, CSS, React, Vue, Svelte, Flutter, SwiftUI, Android XML).

---

## Obiettivo del Plugin (Goal)

Garantire che ogni vista, componente o flusso generato da Antigravity rispetti standard quantitativi e scientifici rigorosi:
1. **Form snelli & validazione non distruttiva**: riduzione del 20-60% dei campi rispetto al default ($\le 6-8$ campi per step, benchmark Baymard), layout a colonna singola, tolleranza dei formati prima dell'invio (Legge di Postel) e autocompletamento semantico obbligatorio.
2. **Layout Gestalt & Gerarchia**: rispetto dei confini visivi espliciti (Common Region), spaziatura correlata tra label e input ($\le 8\text{ px}$) ed eliminazione di elementi ridondanti (Prägnanz e Rasoio di Occam).
3. **Ergonomia motoria & Touch Target**: touch target $\ge 48\times 48\text{ px}$ su mobile e $\ge 32\times 32\text{ px}$ su desktop, distanziati di almeno $8\text{ px}$ (Legge di Fitts) e allineati alla Thumb Zone.
4. **Timing Hierarchy & Controllo**: feedback visivo istantaneo entro 400ms (Doherty Threshold), skeleton screens per attese oltre 1 secondo, progress bar determinate tra 3-10s, finestra di annullamento *Undo Grace Period* (5-10s) prima del commit definitivo (NN/G Euristica #3).
5. **Ricerca con Recognition over Recall & Filtri Faccettati**: autocompletamento predittivo, tolleranza a typo/sinonimi e 5 categorie chiave di filtro (categoria, specifiche, prezzo, rating, disponibilità).
6. **Interfacce Autonome & AI (Standard 2026)**: trasparenza e motivazione verificabile inline (*Show the Reasoning*), con possibilità di correzione o override manuale con sforzo minimo (*Cheap Takeover*).

---

## Attivazione Modulare in Base al Problema

Il plugin espone **7 Skill tematiche** e **5 Regole contestuali**:

| Problema da Risolvere | Skill Attivata | Regola Automatica | Leggi & Standard di Riferimento |
| :--- | :--- | :--- | :--- |
| **Form, checkout, validazione e input complessi** | `ux-form-optimization` | `ux-forms-and-inputs.md` | *Postel, Parkinson, Proximity, Tesler, Chunking, Benchmark Baymard ($\le 6-8$ campi, colonna singola)* |
| **Layout disordinato, card, dashboard e griglie** | `ux-layout-and-visual-hierarchy` | `ux-layout-and-gestalt.md` | *Principi Gestalt (Proximity, Common Region, Similarity, Connectedness, Prägnanz), NN/G #8* |
| **Pulsanti, CTA, touch target ed ergonomia** | `ux-button-and-touch-ergonomics` | `ux-buttons-and-touch-targets.md` | *Fitts's Law ($\ge 48\times 48\text{ px}$), Von Restorff, Thumb Zone, WCAG AA* |
| **Latenza, caricamenti lenti e feedback mancante** | `ux-feedback-and-perceived-performance` | `ux-performance-and-feedback.md` | *Doherty Threshold (<400ms), Timing Hierarchy (<1s, 1-3s, 3-10s, >10s), Undo Pattern (NN/G #3)* |
| **Scelte complesse, menu, search e cataloghi** | `ux-choice-and-navigation-design` | `ux-navigation-and-choice.md` | *Hick's Law, Choice Overload, Recognition over Recall (NN/G #6), 5 Filtri Baymard, Serial Position* |
| **Abbandono dell'onboarding e setup profili** | `ux-onboarding-and-retention` | `AGENTS.md` | *Jakob's Law, Active User Paradox, Goal-Gradient, Zeigarnik, Flow* |
| **Audit euristico completo e interfaccia AI** | `laws-of-ux-audit` | Tutte le regole | *30 Laws of UX + 10 Euristiche NN/G + Benchmark Baymard + Explainability & Cheap Takeover (Windmill 2026)* |


---

## Struttura Interna del Plugin

```text
laws-of-ux/
├── plugin.json                                # Manifest ufficiale del plugin Antigravity
├── README.md                                  # Questa documentazione
├── rules/                                     # Regole automatiche per il codice
│   ├── AGENTS.md                              # Regola unificata di riferimento
│   ├── ux-forms-and-inputs.md                 # Trigger su form, checkout, wizard
│   ├── ux-layout-and-gestalt.md               # Trigger su card, griglie, dashboard
│   ├── ux-buttons-and-touch-targets.md        # Trigger su button, cta, action-bar
│   ├── ux-performance-and-feedback.md         # Trigger su loader, skeleton, toast
│   └── ux-navigation-and-choice.md            # Trigger su nav, menu, sidebar, pricing
├── skills/                                    # Skill on-demand attivate in base al problema
│   ├── ux-form-optimization/SKILL.md
│   ├── ux-layout-and-visual-hierarchy/SKILL.md
│   ├── ux-button-and-touch-ergonomics/SKILL.md
│   ├── ux-feedback-and-perceived-performance/SKILL.md
│   ├── ux-choice-and-navigation-design/SKILL.md
│   ├── ux-onboarding-and-retention/SKILL.md
│   └── laws-of-ux-audit/SKILL.md
├── references/                                # Catalogo e teoria approfondita
│   ├── 01-gestalt-principles.md
│   ├── 02-interaction-ergonomics.md
│   ├── 03-cognitive-memory.md
│   ├── 04-behavior-motivation.md
│   └── all-30-laws-catalog.md
└── examples/                                  # Risorse operative
    ├── component-patterns-guide.md            # Pattern pratici Do & Don't
    └── ux-audit-report-template.md            # Modello di report di audit
```

---

## Prompt di Esempio

L'agente individua automaticamente la skill o la regola opportuna in base alla richiesta:

- **Per i Form**:
  > *"Ottimizza questo form di registrazione per ridurre gli errori e l'abbandono applicando la legge di Postel."*
- **Per i Pulsanti & Touch**:
  > *"Verifica se i pulsanti e le icone di questa bottom bar sono accessibili e rispettano la dimensione minima di target di Fitts su smartphone."*
- **Per il Caricamento & Latenza**:
  > *"Migliora la percezione dell'attesa in questa pagina che carica dati asincroni introducendo uno skeleton screen conforme al Doherty Threshold."*
- **Per i Menu & Prezzi**:
  > *"Questa tabella di prezzi a 5 opzioni genera confusione. Riorganizzala per facilitare la comparazione secondo la legge di Hick."*
- **Per un Audit Completo**:
  > *"Esegui un UX audit euristico su questa interfaccia secondo il plugin laws-of-ux e genera il report con priorità P0-P3."*

---

## Modalità di Installazione

### 1. Installazione nel Singolo Workspace (Consigliata)
```bash
# Linux/macOS
mkdir -p <percorso-progetto>/.agents/plugins
cp -r plugins/laws-of-ux <percorso-progetto>/.agents/plugins/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "<percorso-progetto>\.agents\plugins"
Copy-Item -Recurse plugins/laws-of-ux "<percorso-progetto>\.agents\plugins\"
```

Directory Junction su Windows:
```powershell
New-Item -ItemType Junction -Path "<percorso-progetto>\.agents\plugins\laws-of-ux" -Target "c:\github\antigravity-plugins\plugins\laws-of-ux"
```

### 2. Installazione Globale (Per tutti i progetti)
```powershell
Copy-Item -Recurse plugins/laws-of-ux "$env:USERPROFILE\.gemini\config\plugins\"
```

---

## Sinergia con gli Altri Plugin

- **`engineering-sobriety`**: collabora nel garantire che le interfacce non adottino visualizzazioni placebo o metriche simulate, assicurando un design sobrio e privo di decorazioni superflue (Legge di Prägnanz e Rasoio di Occam).
- **`proactive-mentorship`**: permette all'agente di segnalare tempestivamente difetti di usabilità e attrito nei form o nei layout proposti dall'utente prima di implementare modifiche estese.
