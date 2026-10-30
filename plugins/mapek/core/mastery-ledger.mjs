/**
 * MAPE-K Execute-Gate & Knowledge Engine — Mastery Model, Consent Guard & ROI Ledger
 * Pure Node.js headless module (zero DOM/browser dependencies).
 *
 * Maintains:
 * 1. Adaptive Operator Mastery EMA (`0.00 .. 1.00`) across 5 process dimensions;
 * 2. Strict Human-in-the-Loop Consent State Machine (blocks any unapproved mutation);
 * 3. Post-Adoption ROI Evaluation (flags ineffective artifacts after N sessions for pruning);
 * 4. Semantic Drill-Down (`L0 -> L1 -> L2`) report formatting.
 */

export const MASTERY_DIMENSIONS = Object.freeze([
  {
    key: 'specClarity',
    labelIt: 'Chiarezza Perimetro Iniziale',
    detectorId: 'PREMATURE_IMPLEMENTATION_LOOP'
  },
  {
    key: 'deterministicDebugging',
    labelIt: 'Debugging Deterministico (Zero Tentativi Ciechi)',
    detectorId: 'UNANCHORED_CORRECTION_SPIRAL'
  },
  {
    key: 'contextHygiene',
    labelIt: 'Igiene Finestra di Contesto (< 150k token)',
    detectorId: 'CONTEXT_ENTROPY_DRIFT'
  },
  {
    key: 'delegationLeverage',
    labelIt: 'Delega Autonoma (Zero Micro-Smistamento)',
    detectorId: 'HUMAN_ROUTER_MICROMANAGEMENT'
  },
  {
    key: 'verificationDiscipline',
    labelIt: 'Verifica Automatica di Uscita',
    detectorId: 'MISSING_VERIFICATION_ORACLE'
  }
]);

export const DEFAULT_LEDGER_CONFIG = Object.freeze({
  emaAlpha: 0.25,
  masteredThreshold: 0.8,
  frictionThreshold: 0.55,
  rejectCooldownDays: 30,
  snoozeHours: 24,
  postAdoptionEvalSessions: 10,
  minRelativeImprovementRatio: 0.2
});

/**
 * Creates a clean initial operator mastery state.
 * @returns {object}
 */
export function createInitialMasteryState() {
  const dimensions = {};
  for (const dim of MASTERY_DIMENSIONS) {
    dimensions[dim.key] = {
      score: 0.75,
      samples: 0,
      trend: 'stable',
      band: 'DEVELOPING'
    };
  }
  return {
    schemaVersion: 1,
    updatedAtMs: 0,
    processedSessionIds: [],
    dimensions
  };
}

/**
 * Updates the operator mastery profile using Exponential Moving Average (EMA)
 * across newly analyzed sessions (idempotent per `conversationId`).
 *
 * @param {object} prevState
 * @param {Array<object>} analyzedSessions
 * @param {Partial<typeof DEFAULT_LEDGER_CONFIG>} [customConfig]
 * @returns {object}
 */
export function updateOperatorMastery(prevState, analyzedSessions, customConfig = {}) {
  const cfg = { ...DEFAULT_LEDGER_CONFIG, ...customConfig };
  const base = prevState && prevState.dimensions ? structuredClone(prevState) : createInitialMasteryState();
  const seen = new Set(Array.isArray(base.processedSessionIds) ? base.processedSessionIds : []);

  const ordered = [...(analyzedSessions || [])]
    .filter((s) => s && s.conversationId && s.masterySignals)
    .sort((a, b) => Number(a.endedAtMs || 0) - Number(b.endedAtMs || 0));

  for (const session of ordered) {
    if (seen.has(session.conversationId)) continue;
    seen.add(session.conversationId);

    for (const dim of MASTERY_DIMENSIONS) {
      const obs = Number(session.masterySignals[dim.key]);
      if (Number.isNaN(obs)) continue;

      const entry = base.dimensions[dim.key] || { score: 0.75, samples: 0, trend: 'stable', band: 'DEVELOPING' };
      const prevScore = entry.score;
      const nextScore =
        entry.samples === 0
          ? Number((0.6 * prevScore + 0.4 * obs).toFixed(3))
          : Number(((1 - cfg.emaAlpha) * prevScore + cfg.emaAlpha * obs).toFixed(3));

      const delta = nextScore - prevScore;
      const trend = delta >= 0.03 ? 'improving' : delta <= -0.03 ? 'regressing' : 'stable';
      const band =
        nextScore >= cfg.masteredThreshold
          ? 'MASTERED'
          : nextScore < cfg.frictionThreshold
            ? 'FRICTION_ACTIVE'
            : 'DEVELOPING';

      base.dimensions[dim.key] = {
        score: nextScore,
        samples: entry.samples + 1,
        trend,
        band
      };
    }

    if (Number(session.endedAtMs || 0) > base.updatedAtMs) {
      base.updatedAtMs = Number(session.endedAtMs || 0);
    }
  }

  // Cap processedSessionIds history to latest 300 IDs
  base.processedSessionIds = [...seen].slice(-300);
  return base;
}

/**
 * Reconciles newly synthesized decision proposals against pending, rejected, snoozed,
 * and active ledger entries. Never promotes any decision beyond `PENDING_APPROVAL`.
 *
 * @param {Array<object>} existingPending
 * @param {Array<object>} ledgerEntries
 * @param {Array<object>} newProposals
 * @param {number} [nowMs]
 * @param {Partial<typeof DEFAULT_LEDGER_CONFIG>} [customConfig]
 * @returns {Array<object>}
 */
export function reconcilePendingDecisions(
  existingPending = [],
  ledgerEntries = [],
  newProposals = [],
  nowMs = Date.now(),
  customConfig = {}
) {
  const cfg = { ...DEFAULT_LEDGER_CONFIG, ...customConfig };
  const rejectCooldownMs = cfg.rejectCooldownDays * 24 * 3600 * 1000;

  const activePatternKeys = new Set(
    (ledgerEntries || [])
      .filter((e) => e.status === 'ACTIVE' && e.targetLevel !== 'PRUNE')
      .map((e) => e.patternKey)
  );

  const recentlyRejectedKeys = new Set(
    (ledgerEntries || [])
      .filter(
        (e) =>
          e.status === 'REJECTED' &&
          Number(e.decidedAtMs || 0) > 0 &&
          nowMs - Number(e.decidedAtMs) < rejectCooldownMs
      )
      .map((e) => e.patternKey)
  );

  const byKey = new Map();
  for (const prev of existingPending || []) {
    if (!prev || !prev.patternKey) continue;
    if (activePatternKeys.has(prev.patternKey) && prev.targetLevel !== 'PRUNE') continue;
    if (recentlyRejectedKeys.has(prev.patternKey)) continue;
    byKey.set(prev.patternKey, { ...prev, status: 'PENDING_APPROVAL', requiresExplicitUserApproval: true });
  }

  for (const prop of newProposals || []) {
    if (!prop || !prop.patternKey) continue;
    if (activePatternKeys.has(prop.patternKey) && prop.targetLevel !== 'PRUNE') continue;
    if (recentlyRejectedKeys.has(prop.patternKey)) continue;

    const existing = byKey.get(prop.patternKey);
    byKey.set(prop.patternKey, {
      ...prop,
      decisionId: existing?.decisionId || prop.decisionId,
      status: 'PENDING_APPROVAL',
      requiresExplicitUserApproval: true,
      snoozedUntilMs: existing?.snoozedUntilMs || 0,
      lastNotifiedAtMs: existing?.lastNotifiedAtMs || 0
    });
  }

  return [...byKey.values()].sort(
    (a, b) => Number(b.projectedSavedSeconds15 || 0) - Number(a.projectedSavedSeconds15 || 0)
  );
}

/**
 * Evaluates active artifacts in `process-ledger.json` against sessions completed
 * AFTER `approvedAtMs` to verify whether friction actually decreased or if the
 * artifact should be proposed for pruning (`STALE_CANDIDATE`).
 *
 * @param {Array<object>} ledgerEntries
 * @param {Array<object>} analyzedSessions
 * @param {Partial<typeof DEFAULT_LEDGER_CONFIG>} [customConfig]
 * @returns {{ updatedLedger: Array<object>, pruningClusters: Array<object> }}
 */
export function evaluatePostAdoptionRoi(ledgerEntries = [], analyzedSessions = [], customConfig = {}) {
  const cfg = { ...DEFAULT_LEDGER_CONFIG, ...customConfig };
  const updatedLedger = [];
  const pruningClusters = [];

  for (const entry of ledgerEntries || []) {
    if (!entry || entry.status !== 'ACTIVE') {
      updatedLedger.push(entry);
      continue;
    }

    const approvedAt = Number(entry.approvedAtMs || entry.decidedAtMs || 0);
    const postSessions = (analyzedSessions || []).filter((s) => Number(s.endedAtMs || 0) > approvedAt);

    if (postSessions.length < cfg.postAdoptionEvalSessions) {
      updatedLedger.push({
        ...entry,
        observedSessionsAfter: postSessions.length,
        efficacyStatus: 'MONITORING'
      });
      continue;
    }

    const matchingFrictionSessions = postSessions.filter((s) =>
      (s.episodes || []).some((ep) => ep.detectorId === entry.detectorId)
    ).length;

    const postFrictionRate = Number((matchingFrictionSessions / postSessions.length).toFixed(3));
    const baseline = Math.max(0.001, Number(entry.baselineFrictionRate || 0.25));
    const relativeImprovement = (baseline - postFrictionRate) / baseline;
    const relativeImprovementPct = Math.round(relativeImprovement * 100);

    if (relativeImprovement >= cfg.minRelativeImprovementRatio) {
      updatedLedger.push({
        ...entry,
        observedSessionsAfter: postSessions.length,
        postFrictionRate,
        relativeImprovementPct,
        efficacyStatus: 'VALIDATED'
      });
    } else {
      updatedLedger.push({
        ...entry,
        observedSessionsAfter: postSessions.length,
        postFrictionRate,
        relativeImprovementPct,
        efficacyStatus: 'STALE_CANDIDATE'
      });

      pruningClusters.push({
        isStaleArtifact: true,
        detectorId: entry.detectorId,
        patternKey: `prune:${entry.patternKey}`,
        titleIt: `Rimuovere artefatto senza beneficio misurato (${entry.targetArtifact?.relativePath || entry.decisionId})`,
        targetPath: entry.targetArtifact?.relativePath || '',
        observedSessionsAfter: postSessions.length,
        relativeImprovementPct,
        projectedSavedSeconds15: 160,
        generalizedContract: entry.generalizedContract
      });
    }
  }

  return { updatedLedger, pruningClusters };
}

/**
 * Hard Consent Gate: verifies explicit human approval before allowing any file mutation.
 *
 * @param {object | null | undefined} decision
 * @param {{ explicitUserApproval?: boolean }} [consent]
 * @returns {{ allowed: boolean, error?: string }}
 */
export function authorizeDecisionExecution(decision, consent = {}) {
  if (!decision || typeof decision !== 'object') {
    return { allowed: false, error: 'DECISION_NOT_FOUND' };
  }
  if (consent.explicitUserApproval !== true) {
    return {
      allowed: false,
      error: 'HUMAN_CONSENT_REQUIRED: MAPE-K cannot write or prune files without explicit user approval.'
    };
  }
  if (decision.status !== 'PENDING_APPROVAL') {
    return {
      allowed: false,
      error: `INVALID_DECISION_STATE: expected PENDING_APPROVAL, got ${decision.status}`
    };
  }
  return { allowed: true };
}

/**
 * Formats the complete MAPE-K digest and pending decisions in Semantic Drill-Down
 * (`L0 -> L1 -> L2`) compliant with CommonMark and `scripts/validate.mjs`.
 *
 * @param {{
 *   sessionsAnalyzed: number,
 *   masteryState: object,
 *   pendingDecisions: Array<object>,
 *   ledgerEntries: Array<object>
 * }} digest
 * @returns {string}
 */
export function formatDrillDownDecisionReport(digest) {
  const sessionsCount = Number(digest?.sessionsAnalyzed || 0);
  const pending = Array.isArray(digest?.pendingDecisions) ? digest.pendingDecisions : [];
  const mastery = digest?.masteryState?.dimensions || {};
  const ledger = Array.isArray(digest?.ledgerEntries) ? digest.ledgerEntries : [];

  const masteredList = [];
  const activeFrictionList = [];
  for (const dim of MASTERY_DIMENSIONS) {
    const d = mastery[dim.key] || { score: 0.75, band: 'DEVELOPING', trend: 'stable' };
    if (d.band === 'MASTERED') masteredList.push(`${dim.labelIt} (${Math.round(d.score * 100)}%)`);
    else if (d.band === 'FRICTION_ACTIVE') activeFrictionList.push(`${dim.labelIt} (${Math.round(d.score * 100)}%)`);
  }

  const lines = [];
  lines.push('## Rapporto Supervisore di Processo (`Livello 0` — Sintesi Operativa)');
  lines.push('');

  if (pending.length === 0) {
    lines.push(
      `Analizzate **${sessionsCount}** sessioni umane in sola lettura: **nessun intervento richiesto** (` +
        `${masteredList.length}/${MASTERY_DIMENSIONS.length} aree già padroneggiate, ` +
        `0 proposte in attesa di consenso).`
    );
  } else {
    const top = pending[0];
    lines.push(
      `Analizzate **${sessionsCount}** sessioni umane in sola lettura: rilevata **${pending.length} decisione pronta** ` +
        `(**${top.titleIt}** -> \`${top.targetArtifact?.relativePath}\`). ` +
        `Nessun file è stato modificato: il sistema attende la tua conferma esplicita prima di agire.`
    );
  }
  lines.push('');

  // L1 Drawer 1: Pending Decisions & Rationale
  if (pending.length > 0) {
    for (let i = 0; i < Math.min(3, pending.length); i++) {
      const dec = pending[i];
      lines.push('<details>');
      lines.push(
        `<summary><strong>${i + 1}. Decisione [${dec.decisionId}] — ${dec.titleIt} (${dec.primitiveLabelIt})</strong></summary>`
      );
      lines.push('');
      lines.push(`- **Dato osservato**: ${dec.observedEvidenceIt}`);
      lines.push(`- **Perché questa scelta**: ${dec.decisionRationaleIt}`);
      lines.push(`- **Indicazione pratica per te**: ${dec.operatorLessonIt}`);
      lines.push(`- **Operazione richiesta**: \`${dec.targetArtifact?.action}\` su \`${dec.targetArtifact?.relativePath}\` (solo dopo tua conferma).`);
      lines.push('');
      lines.push('<details>');
      lines.push('<summary>Alternative Scartate e Anteprima File L2 — Verifica tecnica prima del consenso</summary>');
      lines.push('');
      for (const rej of dec.rejectedAlternativesIt || []) {
        lines.push(`- *Scartata*: ${rej}`);
      }
      if (dec.targetArtifact?.proposedContent) {
        lines.push('');
        lines.push('```text');
        lines.push(dec.targetArtifact.proposedContent.trim());
        lines.push('```');
      }
      lines.push('');
      lines.push('</details>');
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
  }

  // L1 Drawer 2: Operator Mastery Profile (Adaptive)
  const masteryConclusion =
    activeFrictionList.length > 0
      ? `Focus consigliato su ${activeFrictionList.join(', ')}; silenzio attivo su ${masteredList.length} aree già solide`
      : `Tutte le ${MASTERY_DIMENSIONS.length} abitudini monitorate sono sopra la soglia di sicurezza`;

  lines.push('<details>');
  lines.push(`<summary><strong>Profilo di Padronanza Operatore — ${masteryConclusion}</strong></summary>`);
  lines.push('');
  for (const dim of MASTERY_DIMENSIONS) {
    const d = mastery[dim.key] || { score: 0.75, band: 'DEVELOPING', trend: 'stable', samples: 0 };
    const statusLabel =
      d.band === 'MASTERED' ? 'Padroneggiata (silenzio attivo)' : d.band === 'FRICTION_ACTIVE' ? 'Attrito rilevato' : 'Stabile';
    lines.push(`- **${dim.labelIt}**: \`${Math.round(d.score * 100)}%\` — ${statusLabel} (trend: \`${d.trend}\`).`);
  }
  lines.push('');
  lines.push('</details>');
  lines.push('');

  // L1 Drawer 3: Ledger History & Post-Adoption Audit
  if (ledger.length > 0) {
    const activeCount = ledger.filter((e) => e.status === 'ACTIVE').length;
    const staleCount = ledger.filter((e) => e.efficacyStatus === 'STALE_CANDIDATE').length;
    lines.push('<details>');
    lines.push(
      `<summary><strong>Storico Decisioni Approvate — ${activeCount} attive, ${staleCount} candidate alla rimozione</strong></summary>`
    );
    lines.push('');
    for (const entry of ledger.slice(-8)) {
      lines.push(
        `- \`[${entry.decisionId}]\` **${entry.status}** (\`${entry.efficacyStatus || 'N/A'}\`): \`${entry.targetArtifact?.relativePath || entry.patternKey}\`.`
      );
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}
