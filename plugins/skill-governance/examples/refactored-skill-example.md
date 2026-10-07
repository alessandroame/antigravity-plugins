# Esempio di Rifattorizzazione: Before vs After

Questo esempio illustra come trasformare una skill monolitica a elevato consumo di token in una struttura snella a divulgazione progressiva.

---

## 1. Scenario Iniziale (Antipattern Monolitico)

- **File unico**: `skills/deploy-service/SKILL.md` (480 righe).
- **Frontmatter verboso**: 450 caratteri con introduzione descrittiva non essenziale.
- **Contenuto**: Mescola istruzioni operative, schemi JSON di configurazione Kubernetes (180 righe), tabelle di codici di errore (120 righe) ed esempi curl.

### 🔴 Frontmatter Iniziale (Non Conforme):
```yaml
---
name: deploy-service
description: >
  Questa è una skill completa e dettagliata creata per permettere all'assistente AI di gestire l'intero ciclo
  di deployment di microservizi in ambienti Kubernetes e Docker, verificando tutti i certificati TLS,
  ispezionando i pod tramite kubectl, gestendo il rollback automatico in caso di CrashLoopBackOff e
  configurando le annotazioni Ingress per il bilanciamento del traffico di rete.
---
```
*Problema*: 380 caratteri iniettati in **ogni singolo turno** dell'intera sessione, anche per conversazioni su task di puro frontend.

---

## 2. Riorganizzazione Modulare a Divulgazione Progressiva

I contenuti vengono suddivisi logicamente:
```text
skills/deploy-service/
├── SKILL.md                          # 110 righe: Solo runbook e comandi sequenziali
├── references/
│   ├── kubernetes-manifest-schema.md # 180 righe di specifiche YAML
│   └── error-code-troubleshooting.md # 120 righe di tabella diagnostica
└── examples/
    └── sample-ingress-template.yaml  # 50 righe di file d'esempio
```

### 🟢 Frontmatter Ottimizzato:
```yaml
---
name: deploy-service
description: Gestisce il deployment e rollback di microservizi Kubernetes. Use this skill when deploying pods, configuring ingress, or handling CrashLoopBackOff.
---
```
*Risultato*: 160 caratteri (risparmio di oltre il 55% di caratteri a ogni turno).

---

## 3. Runbook `SKILL.md` Rifattorizzato (Estratto)

```markdown
# Runbook di Deployment del Servizio

## 1. Pre-requisiti
- Strumenti richiesti: `kubectl`, `helm >= 3.0`
- Contesto cluster attivo verificato con `kubectl config current-context`

## 2. Sequenza Operativa
1. **Verifica Stato Pod**:
   ```bash
   kubectl get pods -l app=<service-name>
   ```
2. **Applicazione Manifest**:
   > Per lo schema completo delle annotazioni supportate:
   > consultare `references/kubernetes-manifest-schema.md`.
   ```bash
   kubectl apply -f k8s/
   ```
3. **Controllo Rollout**:
   ```bash
   kubectl rollout status deployment/<service-name> --timeout=60s
   ```

## 3. Gestione Errori e Rollback
Se il comando fallisce con stato `CrashLoopBackOff`:
- Eseguire il rollback immediato: `kubectl rollout undo deployment/<service-name>`
- Ispezionare la tabella diagnostica in `references/error-code-troubleshooting.md`.
```
