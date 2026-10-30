/**
 * MAPE-K Plan Engine — 4-Target Primitive Router & Decision Proposal Synthesizer
 * Pure Node.js headless module (zero DOM/browser dependencies).
 *
 * Compiles generalized process bottlenecks into the lowest-token-cost Antigravity
 * native primitive (L3 Guard, L2c Declarative Subagent, L2b Skill, L2a Rule, or Prune)
 * and builds Human-Gated Decision Proposals with explicit rejected alternatives.
 */

import { createHash } from 'node:crypto';

export const GLOBAL_INLINE_RULES_SAFE_CEILING_BYTES = 55000;

/**
 * Deterministically selects the optimal Antigravity customization primitive
 * for a validated cross-session bottleneck cluster.
 *
 * @param {object} cluster
 * @param {{ totalRulesBytes?: number, existingAgentNames?: string[], existingSkillNames?: string[] }} [catalogContext]
 * @returns {{
 *   targetLevel: 'L3' | 'L2c' | 'L2b' | 'L2a' | 'PRUNE',
 *   primitiveLabelIt: string,
 *   rationaleIt: string,
 *   rejectedAlternativesIt: string[]
 * }}
 */
export function routeBottleneckToPrimitive(cluster, catalogContext = {}) {
  const totalRulesBytes = Number(catalogContext.totalRulesBytes || 0);

  if (cluster?.isStaleArtifact) {
    return {
      targetLevel: 'PRUNE',
      primitiveLabelIt: 'Potatura / Declassamento Artefatto Inefficace',
      rationaleIt:
        'Dopo almeno 10 sessioni dall\'attivazione il tasso di attrito non si è ridotto in modo misurabile: rimuoverlo o spostarlo on-demand libera budget nel contesto.',
      rejectedAlternativesIt: [
        'Mantenere attivo così com\'è: continua a occupare spazio nel prompt senza ridurre gli errori reali.',
        'Aggiungere un\'ulteriore regola sopra la precedente: stratifica complessità invece di correggere la causa.'
      ]
    };
  }

  if (cluster?.staticallyCheckable) {
    return {
      targetLevel: 'L3',
      primitiveLabelIt: 'Controllo Automatico / Hook Deterministico (L3 — 0 token fissi)',
      rationaleIt:
        'La condizione di errore è verificabile meccanicamente via script Node.js senza consumare token del modello a ogni turno.',
      rejectedAlternativesIt: [
        'Regola testuale in AGENTS.md (L2a): consuma byte a ogni messaggio e può essere ignorata sotto carico di contesto.',
        'Agente dedicato (L2c): avviare un subagent LLM per un controllo booleano deterministico spreca tempo e token.'
      ]
    };
  }

  if (cluster?.requiresIsolatedContext) {
    return {
      targetLevel: 'L2c',
      primitiveLabelIt: 'Agente Isolato Dichiarativo (L2c — agents/*.md con contesto separato)',
      rationaleIt:
        'Il collo di bottiglia deriva da esplorazioni o cicli operativi ripetuti che gonfiano la chat principale: un subagent con finestra di contesto isolata e strumenti ristretti azzera l\'inquinamento della sessione attiva.',
      rejectedAlternativesIt: [
        'Regola in AGENTS.md (L2a): appesantisce tutte le chat ma non isola i token letti durante il lavoro.',
        'Skill standard (L2b): viene comunque eseguita dentro la stessa finestra di contesto già carica della chat padre.'
      ]
    };
  }

  if (cluster?.isMultiStepProcedure) {
    return {
      targetLevel: 'L2b',
      primitiveLabelIt: 'Procedura Operativa On-Demand (L2b — skills/*/SKILL.md)',
      rationaleIt:
        'Il problema richiede una sequenza ordinata di passaggi pre-modifica caricabile solo quando serve (~35 token di indice fisso).',
      rejectedAlternativesIt: [
        'Regola sempre attiva (L2a): inietterebbe l\'intera procedura anche nelle domande rapide su singolo file.',
        'Controllo statico (L3): richiede ragionamento semantico sul perimetro prima di modificare i file.'
      ]
    };
  }

  const nearBudgetCeiling = totalRulesBytes >= GLOBAL_INLINE_RULES_SAFE_CEILING_BYTES;
  return {
    targetLevel: 'L2a',
    primitiveLabelIt: nearBudgetCeiling
      ? 'Regola Condizionale di Progetto (L2a — trigger: model_decision)'
      : 'Regola Comportamentale Compatta (L2a — rules/AGENTS.md)',
    rationaleIt: nearBudgetCeiling
      ? `Il budget globale di regole sempre attive è vicino alla soglia (${Math.round(totalRulesBytes / 1024)} KB): usiamo una regola condizionale caricata solo sui file pertinenti.`
      : 'È un vincolo trasversale breve che orienta ogni risposta senza richiedere passaggi procedurali lunghi.',
    rejectedAlternativesIt: [
      'Agente separato (L2c): latenza eccessiva per un vincolo di comportamento immediato.',
      'Controllo statico (L3): il vincolo riguarda una scelta semantica non riducibile a una regex.'
    ]
  };
}

const DETECTOR_PROPOSAL_TEMPLATES = Object.freeze({
  PREMATURE_IMPLEMENTATION_LOOP: {
    slug: 'pre-edit-scope-lock',
    titleIt: 'Bloccare il perimetro dei file prima di modifiche multi-file',
    operatorLessonIt:
      'Prima di chiedere modifiche che toccano 3 o più file, fissa in 1 riga i file bersaglio (@file) e il test di uscita oppure anteponi /plan: eviti i giri successivi di correzione sugli stessi file.'
  },
  UNANCHORED_CORRECTION_SPIRAL: {
    slug: 'halt-unverified-edit-spiral',
    titleIt: 'Fermare le correzioni a tentativi dopo 2 modifiche senza test',
    operatorLessonIt:
      'Quando una correzione non funziona al primo tentativo, non chiedere subito un secondo ritocco "a occhio": chiedi prima un test o una traccia diagnostica che riproduca il difetto.'
  },
  CONTEXT_ENTROPY_DRIFT: {
    slug: 'context-offload-scout',
    titleIt: 'Delegare ricerche e verifiche pesanti a un Agente esploratore isolato',
    operatorLessonIt:
      'Oltre i 20 messaggi o 150k token la precisione cala e ogni turno ricarica tutto lo storico: delega le letture esplorative a un subagent isolato o usa /compact prima di cambiare sotto-task.'
  },
  HUMAN_ROUTER_MICROMANAGEMENT: {
    slug: 'autonomous-verification-runner',
    titleIt: 'Sostituire i micro-comandi passo-passo con un Agente esecutore autonomo',
    operatorLessonIt:
      'Quando ti accorgi di inviare 5+ messaggi brevi consecutivi per guidare modifica -> test -> fix, raggruppa obiettivo e comando di verifica in un solo task autonomo (/goal o subagent dedicato).'
  },
  MISSING_VERIFICATION_ORACLE: {
    slug: 'mandatory-exit-oracle-check',
    titleIt: 'Richiedere almeno una verifica automatica prima di chiudere modifiche codice',
    operatorLessonIt:
      'Includi sempre il criterio di verifica finale quando chiedi una modifica su più file sorgente, così la sessione non si chiude con regressioni latenti.'
  }
});

/**
 * Generates pre-validated file content matching `scripts/validate.mjs` constraints
 * for the selected target primitive.
 *
 * @param {object} cluster
 * @param {ReturnType<typeof routeBottleneckToPrimitive>} route
 * @param {string} slug
 * @returns {{ relativePath: string, proposedContent: string }}
 */
export function synthesizeArtifactDraft(cluster, route, slug) {
  const contract = cluster?.generalizedContract || {
    precondition: 'Recurring multi-session friction detected',
    transformation: 'Apply structured pre-check and verification gate',
    falsifiableOracle: 'Measured rework turns decrease by >= 20%'
  };

  if (route.targetLevel === 'L2c') {
    const relativePath = `plugins/mapek/agents/${slug}.md`;
    const proposedContent = [
      '---',
      `name: ${slug}`,
      `description: "Isolated specialist subagent synthesized by MAPE-K to offload multi-file exploration and verification loops without polluting the main session context."`,
      'tools:',
      '  - read_file',
      '  - grep_search',
      '  - find_by_name',
      '  - run_command',
      'mainAgent: false',
      'subagent: true',
      'commandExecutionPolicy: auto',
      '---',
      '',
      `# Specialist Subagent — ${slug}`,
      '',
      'Operate inside an isolated context window to execute bounded exploration, impact mapping, or verification runs and return only distilled findings to the parent agent.',
      '',
      '## Generalized Execution Contract',
      '',
      `- **Activation Precondition**: ${contract.precondition}.`,
      `- **Required Transformation**: ${contract.transformation}.`,
      `- **Verification Oracle**: ${contract.falsifiableOracle}.`,
      '',
      '## Output Discipline',
      '',
      '1. Inspect target files and run read-only diagnostics or unit tests within at most 4 tool turns.',
      '2. Return a compact summary (< 15 lines) with exact file paths, line ranges, and verification exit status.',
      ''
    ].join('\n');
    return { relativePath, proposedContent };
  }

  if (route.targetLevel === 'L2b') {
    const relativePath = `plugins/mapek/skills/${slug}/SKILL.md`;
    const desc = `Esegue la procedura preventiva anti-rework sintetizzata da MAPE-K per bloccare perimetro e oracolo di verifica prima delle modifiche. Utilizza questa skill quando inizi modifiche multi-file.`;
    const boundedDesc = desc.length > 245 ? desc.slice(0, 242) + '...' : desc;
    const proposedContent = [
      '---',
      `name: ${slug}`,
      'description: >-',
      `  ${boundedDesc}`,
      '---',
      '',
      `# Runbook Anti-Attrito — ${slug}`,
      '',
      '## Step 1 — Verifica della Precondizione Strutturale',
      '',
      `- Condizione intercettata: ${contract.precondition}.`,
      '- Elenca esplicitamente i file coinvolti e verifica che il perimetro sia chiuso prima di modificare il codice.',
      '',
      '## Step 2 — Trasformazione Operativa',
      '',
      `- Azione: ${contract.transformation}.`,
      '- Definisci il comando esatto di test o validazione che fungerà da criterio di uscita.',
      '',
      '## Step 3 — Controllo dell\'Oracolo di Uscita',
      '',
      `- Oracolo falsificabile: ${contract.falsifiableOracle}.`,
      '- Esegui il comando di verifica prima di dichiarare concluso il task.',
      ''
    ].join('\n');
    return { relativePath, proposedContent };
  }

  if (route.targetLevel === 'L3') {
    const relativePath = `plugins/mapek/scripts/guards/${slug}.mjs`;
    const proposedContent = [
      '#!/usr/bin/env node',
      '/**',
      ` * MAPE-K Synthesized L3 Deterministic Guard (${slug})`,
      ` * Precondition: ${contract.precondition}`,
      ` * Oracle: ${contract.falsifiableOracle}`,
      ' */',
      '',
      'export function evaluateSynthesizedGuard(sessionSummary = {}) {',
      '  const modified = Number(sessionSummary.modifiedCodeFiles || 0);',
      '  const verified = Number(sessionSummary.verificationRuns || 0);',
      '  const unverifiedStreak = Number(sessionSummary.consecutiveUnverifiedEdits || 0);',
      '  const passed = (modified < 2 || verified > 0) && unverifiedStreak < 3;',
      '  return {',
      '    passed,',
      `    guardId: '${slug}',`,
      '    reason: passed ? "OK" : "Verification oracle missing or unverified edit spiral detected"',
      '  };',
      '}',
      ''
    ].join('\n');
    return { relativePath, proposedContent };
  }

  if (route.targetLevel === 'PRUNE') {
    return {
      relativePath: String(cluster?.targetPath || 'plugins/mapek/rules/AGENTS.md'),
      proposedContent: ''
    };
  }

  const relativePath = `.agents/rules/${slug}.md`;
  const proposedContent = [
    '---',
    'trigger: model_decision',
    `description: Apply when ${contract.precondition.toLowerCase()}`,
    '---',
    '',
    `# Vincolo di Processo (${slug})`,
    '',
    `- **Precondizione**: ${contract.precondition}.`,
    `- **Regola**: ${contract.transformation}.`,
    `- **Oracolo**: ${contract.falsifiableOracle}.`,
    ''
  ].join('\n');
  return { relativePath, proposedContent };
}

/**
 * Builds a complete Human-Gated Decision Proposal (`status: 'PENDING_APPROVAL'`).
 * Never writes to disk; requires explicit user confirmation before execution.
 *
 * @param {object} cluster
 * @param {ReturnType<typeof routeBottleneckToPrimitive>} route
 * @param {number} [nowMs]
 * @returns {object}
 */
export function buildDecisionProposal(cluster, route, nowMs = Date.now()) {
  const tpl = DETECTOR_PROPOSAL_TEMPLATES[cluster.detectorId] || {
    slug: String(cluster.patternKey || 'custom-process-policy')
      .replace(/[^a-z0-9-]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase(),
    titleIt: cluster.titleIt || 'Ottimizzazione strutturale del processo di interazione',
    operatorLessonIt:
      'Ancora sempre il perimetro dei file e il comando di verifica prima di iterare modifiche multi-turno.'
  };

  const hash = createHash('sha256')
    .update(`${cluster.patternKey}:${route.targetLevel}:${tpl.slug}`)
    .digest('hex')
    .slice(0, 8);

  const decisionId = `mapek-${hash}`;
  const draft = synthesizeArtifactDraft(cluster, route, tpl.slug);
  const wastedMin = Math.max(1, Math.round(Number(cluster.totalWastedSeconds || 0) / 60));
  const wastedTokK = Math.round(Number(cluster.totalWastedTokens || 0) / 1000);

  const observedEvidenceIt = cluster.isStaleArtifact
    ? `L'artefatto '${draft.relativePath}' è stato osservato per ${cluster.observedSessionsAfter} sessioni senza ridurre il tasso di attrito (variazione misurata: ${cluster.relativeImprovementPct}%).`
    : `Rilevato ${cluster.occurrences} volte in ${cluster.distinctSessions} sessioni distinte (${cluster.distinctWorkspaces} workspace: ${(cluster.workspaces || []).join(', ')}), con un costo misurato di ~${wastedMin} min (${cluster.totalWastedTurns} turni extra, ~${wastedTokK}k token) e un risparmio stimato di ~${cluster.projectedSavedSeconds15}s sulle prossime 15 sessioni.`;

  return {
    decisionId,
    patternKey: cluster.patternKey,
    detectorId: cluster.detectorId,
    status: 'PENDING_APPROVAL',
    requiresExplicitUserApproval: true,
    createdAtMs: nowMs,
    titleIt: tpl.titleIt,
    targetLevel: route.targetLevel,
    primitiveLabelIt: route.primitiveLabelIt,
    observedEvidenceIt,
    decisionRationaleIt: route.rationaleIt,
    rejectedAlternativesIt: route.rejectedAlternativesIt,
    operatorLessonIt: tpl.operatorLessonIt,
    generalizedContract: cluster.generalizedContract,
    baselineFrictionRate: cluster.baselineFrictionRate || 0,
    projectedSavedSeconds15: cluster.projectedSavedSeconds15 || 0,
    sampleConversations: cluster.sampleConversations || [],
    targetArtifact: {
      action: route.targetLevel === 'PRUNE' ? 'DELETE_OR_ARCHIVE' : 'CREATE',
      relativePath: draft.relativePath,
      proposedContent: draft.proposedContent
    }
  };
}
