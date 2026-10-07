# Antigravity Plugin: Laws of UX

Plugin completo per **Google Antigravity** che trasforma le **30 Laws of UX** (raccolte da Jon Yablonski su [lawsofux.com](https://lawsofux.com/)) in un sistema intelligente di **Regole contestuali** e **Skill mirate**, attivate selettivamente in base allo specifico problema di design, ergonomia o codice di interfaccia da risolvere.

---

## Obiettivo del Plugin (Goal)

Durante la progettazione e l'implementazione di interfacce utente (HTML, CSS, React, Vue, Svelte, Flutter, SwiftUI, Android XML), gli agenti AI tendono a concentrarsi sulla correttezza funzionale tralasciando spesso i principi cardine della percezione visiva, del carico cognitivo e dell'ergonomia di puntamento. Questo porta a problemi noti:
1. **Form ostili ed elevato attrito di input**: campi sprovvisti di attributi di autocompletamento semantico, formati rigidi che rifiutano spazi o prefissi (violazione della Legge di Postel), etichette distanti dai relativi campi.
2. **Layout disordinati e scarsa gerarchia**: violazione dei principi Gestalt di prossimità e regione comune, con card prive di confini definiti e informazioni eterogenee raggruppate insieme.
3. **Target touch inadeguati e click accidentali**: pulsanti troppo piccoli (< 48x48px su mobile) o privi di adeguata spaziatura (violazione della Legge di Fitts).
4. **Paralisi decisionale e latenza percepita**: troppe opzioni contemporanee (Legge di Hick) e assenza di skeleton loading per attese superiori al Doherty Threshold (< 400ms).

Il plugin `laws-of-ux` fornisce all'agente un corpus ingegneristico di regole automatiche e skill di audit che garantiscono che ogni componente o vista generata rispetti gli standard della psicologia cognitiva e dell'ergonomia applicata.

---

## Attivazione Modulare in Base al Problema

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
