# Antigravity Plugin: Laws of UX

Plugin completo per **Antigravity / Gemini Agent** che trasforma le **30 Laws of UX** (raccolte da Jon Yablonski su [lawsofux.com](https://lawsofux.com/)) in un sistema intelligente di **Regole automatiche** e **Skill mirate**, attivate selettivamente in base allo specifico problema di design o codice da risolvere.

---

## 🎯 Attivazione Modulare in Base al Problema

Invece di un blocco unico e generico, il plugin espone **7 Skill tematiche** e **5 Regole contestuali**. L'agente attiva autonomamente la regola o la skill più idonea in base alla richiesta o al tipo di file su cui sta lavorando:

| Problema da Risolvere | Skill Attivata | Regola Automatica | Leggi di Riferimento Chiave |
| :--- | :--- | :--- | :--- |
| **Form, checkout, validazione e input complessi** | `ux-form-optimization` | `ux-forms-and-inputs.md` | *Postel's Law, Parkinson's Law, Proximity, Tesler's Law, Chunking* |
| **Layout disordinato, card, dashboard e griglie** | `ux-layout-and-visual-hierarchy` | `ux-layout-and-gestalt.md` | *Principi Gestalt (Proximity, Common Region, Similarity, Connectedness, Prägnanz)* |
| **Pulsanti, CTA, touch target e click accidentali** | `ux-button-and-touch-ergonomics` | `ux-buttons-and-touch-targets.md` | *Fitts's Law, Von Restorff Effect, Aesthetic-Usability Effect* |
| **Latenza, caricamenti lenti e feedback mancante** | `ux-feedback-and-perceived-performance` | `ux-performance-and-feedback.md` | *Doherty Threshold, Peak-End Rule, Goal-Gradient Effect* |
| **Scelte troppe complesse, menu e pricing** | `ux-choice-and-navigation-design` | `ux-navigation-and-choice.md` | *Hick's Law, Choice Overload, Occam's Razor, Serial Position* |
| **Abbandono dell'onboarding e setup profili** | `ux-onboarding-and-retention` | `AGENTS.md` | *Jakob's Law, Active User Paradox, Goal-Gradient, Zeigarnik, Flow* |
| **Audit euristico completo di un'intera schermata/app** | `laws-of-ux-audit` | Tutte le regole | *Tutte le 30 Laws of UX con classificazione gravità P0–P3* |

---

## 📁 Struttura Interna del Plugin

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

## 📦 Come Copiare il Plugin in Altri Progetti

### Metodo 1: Plugin di Progetto (Consigliato per team e repository Git)
Basta copiare la cartella del plugin dentro la directory `.agents/plugins/` (oppure `.agent/plugins/`) alla radice del tuo nuovo progetto:

```bash
# Da terminale Linux/macOS
cp -r antigravity-plugin-laws-of-ux /percorso/del/tuo/progetto/.agents/plugins/laws-of-ux

# Da PowerShell su Windows
Copy-Item -Path "antigravity-plugin-laws-of-ux" -Destination "C:\percorso\tuo-progetto\.agents\plugins\laws-of-ux" -Recurse
```

All'apertura del progetto in Antigravity, il plugin verrà caricato automaticamente e le regole/skill saranno attive per tutto il team tramite Git.

---

### Metodo 2: Plugin Globale (Valido per tutti i progetti sulla tua macchina)
Il plugin è già stato pre-installato nella cartella delle estensioni globali di Antigravity:
`~/.gemini/config/plugins/laws-of-ux/` (`C:\Users\<tuo-utente>\.gemini\config\plugins\laws-of-ux`).

In questo modo, qualunque cartella o workspace tu apra con Antigravity erediterà automaticamente le 7 skill e le regole senza dover copiare alcun file!

---

## 💬 Esempi di Utilizzo nei Prompt

L'agente capirà automaticamente quale skill o regola attivare:

- **Per i Form**:
  > *"Ottimizza questo form di registrazione per ridurre gli errori e l'abbandono."*
  > *(Attiva automaticamente `ux-form-optimization` e `ux-forms-and-inputs.md`)*

- **Per i Pulsanti & Touch**:
  > *"Verifica se i pulsanti e le icone di questa bottom bar sono accessibili e facili da premere su smartphone."*
  > *(Attiva automaticamente `ux-button-and-touch-ergonomics` e `ux-buttons-and-touch-targets.md`)*

- **Per il Caricamento & Latenza**:
  > *"Migliora la percezione dell'attesa in questa pagina che scarica molti dati dall'API."*
  > *(Attiva automaticamente `ux-feedback-and-perceived-performance` e `ux-performance-and-feedback.md`)*

- **Per i Menu & Prezzi**:
  > *"Questa tabella di prezzi a 5 colonne genera confusione. Riorganizzala per facilitare la decisione."*
  > *(Attiva automaticamente `ux-choice-and-navigation-design` e `ux-navigation-and-choice.md`)*

- **Per un Audit Completo**:
  > *"Esegui un UX audit euristico su questa schermata secondo il plugin laws-of-ux."*
  > *(Attiva automaticamente `laws-of-ux-audit` producendo un report P0-P3)*
