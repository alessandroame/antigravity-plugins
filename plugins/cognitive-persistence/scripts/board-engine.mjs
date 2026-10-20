/**
 * Headless Remote Kanban & Conflict-Aware Parallel Execution Engine.
 * Zero DOM, zero storage, zero network globals. Executable in pure Node.js.
 */

export const ALLOWED_ACTIVE_COLUMNS = Object.freeze(['inbox', 'planned', 'ready', 'in_progress']);
export const MAX_WIP_LIMIT = 2;
export const MAX_CELL_CHARS = 160;
export const MAX_VOICE_QUESTIONS = 2;
export const MAX_SPOKEN_WORDS_PER_TURN = 35;

export const GLOBAL_COGNITIVE_FILES = new Set([
  'DESIDERATA.md',
  'WORKLOG.md',
  'MEMORY.md',
  'NOTES.md'
]);

export const UNIVERSAL_SHARED_ROOT_FILES = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'tsconfig.json',
  'pyproject.toml',
  'requirements.txt',
  'poetry.lock',
  'Cargo.toml',
  'Cargo.lock',
  'go.mod',
  'go.sum',
  'pom.xml',
  'Dockerfile',
  'docker-compose.yml',
  'Makefile'
]);

export const UNIVERSAL_SHARED_DIRS = Object.freeze([
  'shared',
  'common',
  'migrations',
  'prisma',
  '.github',
  'config'
]);

export const MODULE_CONTAINER_PREFIXES = Object.freeze([
  '',
  'src',
  'src/features',
  'src/modules',
  'src/components',
  'src/pages',
  'app',
  'packages',
  'apps',
  'services',
  'libs',
  'crates',
  'internal',
  'cmd',
  'plugins'
]);

/**
 * Normalizes a path string to forward slashes without leading @ or trailing slash.
 * @param {string} rawPath
 * @returns {string}
 */
export function normalizeRepoPath(rawPath) {
  return String(rawPath ?? '')
    .trim()
    .replace(/^@/, '')
    .replace(/\\+/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/+$/, '');
}

/**
 * [P1-UX] Parses a raw mobile issue title using Postel's Law and Tesler's Law.
 * Supports leading '!' for immediate Ready promotion and '<scope>: <title>' prefixing.
 * @param {string} rawTitle
 * @param {string[]} existingLabels
 */
export function parseMobileIssueInput(rawTitle, existingLabels = []) {
  let text = String(rawTitle ?? '').trim().replace(/\s+/g, ' ');
  if (!text) {
    throw new Error('INVALID_CARD_TITLE: Card title cannot be empty');
  }

  let isUrgentBang = false;
  if (text.startsWith('!')) {
    isUrgentBang = true;
    text = text.slice(1).trim();
  }

  const prefixMatch = text.match(/^([a-z0-9_-]+)\s*:\s*(.+)$/i);
  const scope = prefixMatch ? prefixMatch[1].toLowerCase() : 'shared';
  const title = prefixMatch ? prefixMatch[2].trim() : text;

  let status = 'inbox';
  if (isUrgentBang || existingLabels.includes('status:ready')) {
    status = 'ready';
  } else if (existingLabels.includes('status:in-progress')) {
    status = 'in_progress';
  } else if (existingLabels.includes('status:planned')) {
    status = 'planned';
  }

  return Object.freeze({
    status,
    scope,
    title,
    isUrgentBang
  });
}

/**
 * [P0-PORT] Resolves an abstract module scope name against actual directories of any host repository.
 * Falls back conservatively to ['*'] when the scope does not match any isolated folder.
 * @param {string} scope
 * @param {string[]} repoDirs
 * @returns {string[]}
 */
export function resolveScopeToPaths(scope, repoDirs = []) {
  if (!scope || scope === '—') return ['*'];
  const cleanScope = normalizeRepoPath(scope).toLowerCase();
  if (!cleanScope || ['global', 'root', 'all', 'shared', 'common', 'config', 'db'].includes(cleanScope)) {
    return ['*'];
  }

  const normalizedRepoDirs = repoDirs.map((d) => normalizeRepoPath(d));
  const dirSet = new Set(normalizedRepoDirs.map((d) => d.toLowerCase()));

  if (dirSet.has(cleanScope)) {
    const exact = normalizedRepoDirs.find((d) => d.toLowerCase() === cleanScope);
    return [exact];
  }

  const matchedPaths = [];
  for (const prefix of MODULE_CONTAINER_PREFIXES) {
    const candidateLower = prefix ? `${prefix}/${cleanScope}` : cleanScope;
    if (dirSet.has(candidateLower)) {
      const original = normalizedRepoDirs.find((d) => d.toLowerCase() === candidateLower);
      matchedPaths.push(original);
    }
  }

  if (matchedPaths.length > 0) {
    return matchedPaths.sort();
  }

  // Fuzzy segment match across repository directories
  const segmentMatches = normalizedRepoDirs.filter((dir) =>
    dir.toLowerCase().split('/').some((seg) => seg === cleanScope)
  );

  return segmentMatches.length > 0 ? segmentMatches.sort() : ['*'];
}

/**
 * Extracts the touch-set of files/directories for a task across any technology stack.
 * @param {object} task
 * @param {string[]} repoDirs
 * @returns {string[]}
 */
export function extractUniversalTouchSet(task, repoDirs = []) {
  if (Array.isArray(task?.verifiedTouchSet) && task.verifiedTouchSet.length > 0) {
    const cleanVerified = task.verifiedTouchSet.map((p) => normalizeRepoPath(p));
    for (const p of cleanVerified) {
      if (UNIVERSAL_SHARED_ROOT_FILES.has(p) || GLOBAL_COGNITIVE_FILES.has(p)) {
        return ['*'];
      }
      if (UNIVERSAL_SHARED_DIRS.some((d) => p === d || p.startsWith(`${d}/`))) {
        return ['*'];
      }
    }
    return cleanVerified.sort();
  }

  const paths = new Set();
  const noteText = String(task?.note ?? '');
  const explicitMatches = noteText.match(/@[\w./-]+/g) || [];

  for (const raw of explicitMatches) {
    const clean = normalizeRepoPath(raw);
    if (!clean) continue;
    if (UNIVERSAL_SHARED_ROOT_FILES.has(clean) || GLOBAL_COGNITIVE_FILES.has(clean)) {
      return ['*'];
    }
    if (UNIVERSAL_SHARED_DIRS.some((d) => clean === d || clean.startsWith(`${d}/`))) {
      return ['*'];
    }
    paths.add(clean);
  }

  if (task?.scope) {
    const scopePaths = resolveScopeToPaths(task.scope, repoDirs);
    if (scopePaths.includes('*') && paths.size === 0) {
      return ['*'];
    }
    for (const sp of scopePaths) {
      if (sp !== '*') paths.add(sp);
    }
  }

  return paths.size > 0 ? Array.from(paths).sort() : ['*'];
}

/**
 * Resolves the touch-set along with confidence level:
 * - VERIFIED_BY_REVIEW when explicit @file paths or sidecar verifiedTouchSet are present.
 * - FAST_TRACK_SCOPE when derived from folder scope (e.g., mobile '!' shorthand).
 * @param {object} card
 * @param {string[]} repoDirs
 */
export function resolveCardTouchSet(card, repoDirs = []) {
  const hasSidecarFiles = Array.isArray(card?.verifiedTouchSet) && card.verifiedTouchSet.length > 0;
  const inlineAtFiles = String(card?.note ?? '').match(/@[\w./-]+/g) || [];

  if (hasSidecarFiles || inlineAtFiles.length > 0) {
    const paths = extractUniversalTouchSet(card, repoDirs);
    return Object.freeze({
      confidence: 'VERIFIED_BY_REVIEW',
      paths
    });
  }

  const folderPaths = resolveScopeToPaths(card?.scope, repoDirs);
  return Object.freeze({
    confidence: 'FAST_TRACK_SCOPE',
    paths: folderPaths
  });
}

/**
 * Checks whether two touch-sets overlap (wildcard, exact match, or parent/child path prefix).
 * @param {string[]} setA
 * @param {string[]} setB
 * @returns {boolean}
 */
export function hasTouchSetConflict(setA, setB) {
  if (!Array.isArray(setA) || !Array.isArray(setB) || setA.length === 0 || setB.length === 0) {
    return true;
  }
  if (setA.includes('*') || setB.includes('*')) {
    return true;
  }
  for (const rawA of setA) {
    const a = normalizeRepoPath(rawA);
    for (const rawB of setB) {
      const b = normalizeRepoPath(rawB);
      if (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Plans the next parallel execution wave while serializing conflicting tasks automatically.
 * @param {object[]} readyQueue
 * @param {object[]} activeTasks
 * @param {string[]} repoDirs
 * @param {number} maxWip
 */
export function planExecutionWave(readyQueue, activeTasks = [], repoDirs = [], maxWip = MAX_WIP_LIMIT) {
  const running = activeTasks.map((t) => ({
    ...t,
    touchSet: t.touchSet || extractUniversalTouchSet(t, repoDirs)
  }));
  const parallelStart = [];
  const serializedBehind = [];

  for (const candidate of readyQueue) {
    const candidateTouchSet = extractUniversalTouchSet(candidate, repoDirs);
    const allAllocated = [...running, ...parallelStart];

    const blocker = allAllocated.find((active) =>
      hasTouchSetConflict(candidateTouchSet, active.touchSet)
    );

    if (blocker) {
      serializedBehind.push(
        Object.freeze({
          id: candidate.id,
          reason: 'TOUCH_SET_CONFLICT',
          queuedBehind: blocker.id,
          conflictingTouchSet: candidateTouchSet,
          userNotice: `In attesa automatica dietro a #${blocker.id} perche toccano gli stessi file (${candidateTouchSet.join(', ')}). Partira da solo appena #${blocker.id} termina.`
        })
      );
      continue;
    }

    if (allAllocated.length >= maxWip) {
      serializedBehind.push(
        Object.freeze({
          id: candidate.id,
          reason: 'WIP_CAPACITY_REACHED',
          queuedBehind: allAllocated[0].id,
          conflictingTouchSet: candidateTouchSet,
          userNotice: `In coda: ci sono gia ${maxWip} lavori attivi in parallelo.`
        })
      );
      continue;
    }

    parallelStart.push(
      Object.freeze({
        ...candidate,
        touchSet: candidateTouchSet,
        worktreeBranch: `feat/${String(candidate.id).toLowerCase()}`
      })
    );
  }

  return Object.freeze({
    parallelStart: Object.freeze(parallelStart),
    serializedBehind: Object.freeze(serializedBehind)
  });
}

/**
 * [CRITICO-1] Merges clean DESIDERATA.md rows (<= 160 chars) with sidecar metadata (.agents/board-state.json).
 * @param {object[]} desiderataCards
 * @param {object} sidecarState
 */
export function mergeDesiderataWithSidecar(desiderataCards, sidecarState = { tasks: {} }) {
  return desiderataCards.map((card) => {
    const meta = sidecarState?.tasks?.[card.id] || {};
    return Object.freeze({
      ...card,
      verifiedTouchSet: Array.isArray(meta.verifiedTouchSet) ? meta.verifiedTouchSet : null,
      lockedBy: meta.lockedBy ?? card.lockedBy ?? null,
      lockedAtMs: meta.lockedAtMs ?? card.lockedAtMs ?? null,
      queuedBehind: meta.queuedBehind ?? null
    });
  });
}

/**
 * Parses markdown rows from DESIDERATA.md into structured immutable card records.
 * @param {string} rawMarkdown
 */
export function parseDesiderataTable(rawMarkdown) {
  const lines = String(rawMarkdown ?? '').split(/\r?\n/);
  const cards = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('Modulo / Funzionalità') || trimmed.includes(':---')) {
      continue;
    }
    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 4) continue;

    const [rawModuleCell, scopeCell, statusCell, noteCell] = cells;
    if (rawModuleCell.includes('*Nessun task pendente')) continue;

    const idMatch = rawModuleCell.match(/`?\[(TASK-[A-Z0-9-]+)\]`?/i);
    const id = idMatch ? idMatch[1].toUpperCase() : `TASK-${cards.length + 1}`;
    const title = rawModuleCell.replace(/`?\[TASK-[A-Z0-9-]+\]`?\s*/i, '').trim();

    const rawStatus = statusCell.replace(/^`|`$/g, '').trim();
    const issueMatch = noteCell.match(/\(#(\d+)\)/);
    const remoteIssueId = issueMatch ? issueMatch[1] : null;

    let column = 'Backlog';
    if (rawStatus.includes('Prioritario') || rawStatus.includes('Pianificato')) {
      column = 'Ready';
    } else if (rawStatus.includes('In Lavorazione')) {
      column = 'In Progress';
    } else if (rawStatus.includes('Completato')) {
      column = 'Done';
    }

    cards.push(
      Object.freeze({
        id,
        remoteIssueId,
        title,
        scope: scopeCell,
        column,
        rawStatus,
        note: noteCell.slice(0, MAX_CELL_CHARS),
        lockedBy: null
      })
    );
  }

  return Object.freeze({ cards: Object.freeze(cards) });
}

/**
 * Serializes structured card state back into a DESIDERATA.md markdown table.
 * Enforces the <= 160 char constraint on the Note column.
 * @param {object} state
 * @returns {string}
 */
export function serializeDesiderataTable(state) {
  const header = [
    '| Modulo / Funzionalità | Ambito | Stato | Note / Specifica di Riferimento (<= 160 char) |',
    '| :--- | :---: | :---: | :--- |'
  ];

  const rows = (state?.cards || []).map((card) => {
    const safeNote = String(card.note ?? '').trim();
    const truncatedNote =
      safeNote.length > MAX_CELL_CHARS ? `${safeNote.slice(0, MAX_CELL_CHARS - 1)}…` : safeNote;
    const moduleLabel = card.id ? `\`[${card.id}]\` ${card.title}` : card.title;
    return `| ${moduleLabel} | ${card.scope} | \`${card.rawStatus}\` | ${truncatedNote} |`;
  });

  return [...header, ...rows].join('\n');
}

/**
 * Transitions a card to a target column while enforcing atomic lock and maxConcurrentWip limit.
 * @param {object} state
 * @param {string} cardId
 * @param {string} targetColumn
 * @param {object} options
 */
export function transitionCardState(state, cardId, targetColumn, options = {}) {
  const maxWip = options.maxWip ?? MAX_WIP_LIMIT;
  const sessionId = options.sessionId ?? 'default-session';
  const nowMs = options.nowMs ?? Date.now();

  const targetCard = state.cards.find((c) => c.id === cardId);
  if (!targetCard) {
    throw new Error(`CARD_NOT_FOUND: ${cardId}`);
  }

  if (targetColumn === 'In Progress') {
    if (targetCard.lockedBy && targetCard.lockedBy !== sessionId) {
      throw new Error(`TASK_ALREADY_LOCKED: ${cardId} is locked by ${targetCard.lockedBy}`);
    }
    const activeWipCount = state.cards.filter(
      (c) => c.column === 'In Progress' && c.id !== cardId
    ).length;
    if (activeWipCount >= maxWip) {
      throw new Error(`WIP_LIMIT_EXCEEDED: active WIP count (${activeWipCount}) reached limit (${maxWip})`);
    }
  }

  const nextCards = state.cards.map((c) => {
    if (c.id !== cardId) return c;
    const isNowInProgress = targetColumn === 'In Progress';
    return Object.freeze({
      ...c,
      column: targetColumn,
      rawStatus: isNowInProgress
        ? '🟡 In Lavorazione'
        : targetColumn === 'Done'
          ? '🟢 Completato'
          : '🔴 Prioritario',
      lockedBy: isNowInProgress ? sessionId : null,
      lockedAtMs: isNowInProgress ? nowMs : null
    });
  });

  return Object.freeze({ cards: Object.freeze(nextCards) });
}

/**
 * Reconciles local board state with remote GitHub issue transitions without mutating inputs.
 * @param {object} localState
 * @param {object[]} remoteIssues
 */
export function reconcileBoardStates(localState, remoteIssues = []) {
  const remoteByNumber = new Map(remoteIssues.map((r) => [String(r.issueNumber), r]));
  const actions = [];

  const nextCards = (localState?.cards || []).map((card) => {
    const remote = remoteByNumber.get(String(card.remoteIssueId));
    if (!remote) return card;

    if ((remote.updatedAt ?? 0) > (card.updatedAt ?? 0) && remote.labelColumn !== card.column) {
      actions.push({
        type: `PROMOTE_TO_${String(remote.labelColumn).toUpperCase().replace(/\s+/g, '_')}`,
        id: card.id,
        issueNumber: String(card.remoteIssueId)
      });
      return Object.freeze({
        ...card,
        column: remote.labelColumn,
        updatedAt: remote.updatedAt
      });
    }
    return card;
  });

  return Object.freeze({
    nextState: Object.freeze({ cards: Object.freeze(nextCards) }),
    actions: Object.freeze(actions)
  });
}

/**
 * [P0-SEC] Zero-Trust Author & Label Actor Guard for GitHub Issues.
 * Prevents external users on public repositories from injecting agent tasks.
 * @param {object} issue
 * @param {object} policy
 */
export function verifyTrustedTaskOrigin(issue, policy) {
  if (!policy || !policy.repoOwner) {
    throw new Error('SECURITY_POLICY_MISSING: repoOwner is required');
  }
  const allowed = new Set([
    policy.repoOwner.toLowerCase(),
    ...(policy.allowedAuthors || []).map((a) => String(a).toLowerCase())
  ]);

  const author = String(issue?.authorLogin ?? '').toLowerCase();
  const labeledBy = String(issue?.readyLabeledBy ?? issue?.authorLogin ?? '').toLowerCase();

  if (!allowed.has(author)) {
    return Object.freeze({ trusted: false, reason: 'UNTRUSTED_ISSUE_AUTHOR', actor: author });
  }
  if (!allowed.has(labeledBy)) {
    return Object.freeze({ trusted: false, reason: 'UNTRUSTED_LABEL_ACTOR', actor: labeledBy });
  }

  return Object.freeze({
    trusted: true,
    reason: null,
    sanitizedBody: String(issue?.body ?? '').slice(0, 4000)
  });
}

/**
 * [P0-ISO] Post-Execution Runtime Touch-Set Isolation Guard.
 * Verifies that actual git diff files inside a worktree do not collide with peer worktrees or global cognitive files.
 * @param {string[]} actualChangedFiles
 * @param {string[]} declaredTouchSet
 * @param {string[][]} peerActiveTouchSets
 */
export function verifyWorktreeDiffIsolation(
  actualChangedFiles,
  declaredTouchSet,
  peerActiveTouchSets = []
) {
  const normalizedActual = actualChangedFiles.map((f) => normalizeRepoPath(f));
  const cognitiveLeaks = normalizedActual.filter((f) => GLOBAL_COGNITIVE_FILES.has(f));
  const peerConflicts = [];

  for (const peerSet of peerActiveTouchSets) {
    for (const file of normalizedActual) {
      if (hasTouchSetConflict([file], peerSet) && !peerConflicts.includes(file)) {
        peerConflicts.push(file);
      }
    }
  }

  const outOfDeclaredBounds = declaredTouchSet.includes('*')
    ? []
    : normalizedActual.filter(
        (f) =>
          !GLOBAL_COGNITIVE_FILES.has(f) &&
          !f.startsWith('.agents/worklog.d/') &&
          !hasTouchSetConflict([f], declaredTouchSet)
      );

  return Object.freeze({
    valid: cognitiveLeaks.length === 0 && peerConflicts.length === 0,
    cognitiveLeaks: Object.freeze(cognitiveLeaks),
    peerConflicts: Object.freeze(peerConflicts),
    outOfDeclaredBounds: Object.freeze(outOfDeclaredBounds)
  });
}

/**
 * [P1-LCK] Lease TTL & Zombie Worktree Recovery (Default TTL = 45 minutes).
 * @param {object[]} cards
 * @param {number} nowMs
 * @param {Set<string>} activeWorktreeIds
 * @param {number} ttlMs
 */
export function reclaimStaleLocks(
  cards,
  nowMs,
  activeWorktreeIds = new Set(),
  ttlMs = 45 * 60 * 1000
) {
  const recoveredIds = [];
  const nextCards = cards.map((card) => {
    if (card.column !== 'In Progress' || !card.lockedAtMs) return card;
    const isExpired = nowMs - card.lockedAtMs > ttlMs;
    const isWorktreeMissing = !activeWorktreeIds.has(card.id);

    if (isExpired && isWorktreeMissing) {
      recoveredIds.push(card.id);
      return Object.freeze({
        ...card,
        column: 'Ready',
        rawStatus: '🔴 Prioritario',
        lockedBy: null,
        lockedAtMs: null,
        recoveredFromStale: true
      });
    }
    return card;
  });

  return Object.freeze({
    cards: Object.freeze(nextCards),
    recoveredIds: Object.freeze(recoveredIds)
  });
}

/**
 * [P0-UX] Unattended Ambiguity Bypass (Park, Notify & Advance Next Task).
 * Never blocks an unattended session with a modal; parks the ambiguous task and promotes the next disjoint task.
 * @param {object} runningTask
 * @param {object[]} queuedTasks
 * @param {string} questionText
 * @param {string[]} repoDirs
 */
export function handleUnattendedAmbiguity(runningTask, queuedTasks, questionText, repoDirs = []) {
  const parkedTask = Object.freeze({
    ...runningTask,
    status: 'blocked_input',
    mobileNotificationSent: true,
    commentBody: `Serve una tua scelta rapida (rispondi con 1 o 2):\n${questionText}`
  });

  const runningSet = extractUniversalTouchSet(runningTask, repoDirs);
  const nextCandidate =
    queuedTasks.find((t) => {
      const candidateSet = extractUniversalTouchSet(t, repoDirs);
      return !hasTouchSetConflict(runningSet, candidateSet) || t.scope !== runningTask.scope;
    }) ?? null;

  return Object.freeze({
    parkedTask,
    promotedTask: nextCandidate ? Object.freeze({ ...nextCandidate, status: 'in_progress' }) : null
  });
}

/**
 * [P1-NOTIF] Idempotent Notification Guard (Zero-Spam on Mobile).
 * Emits a push notification comment only on 'blocked_input' or 'done', editing in-place otherwise.
 * @param {string} prevStatus
 * @param {string} nextStatus
 * @param {boolean} hasExistingBotComment
 */
export function decideCommentAction(prevStatus, nextStatus, hasExistingBotComment) {
  const pushStates = new Set(['blocked_input', 'done']);
  if (pushStates.has(nextStatus) && prevStatus !== nextStatus) {
    return Object.freeze({ action: 'CREATE_NEW_COMMENT_WITH_PUSH' });
  }
  if (hasExistingBotComment) {
    return Object.freeze({ action: 'EDIT_LAST_COMMENT_SILENTLY' });
  }
  return Object.freeze({ action: 'CREATE_INITIAL_STATUS_COMMENT' });
}

/**
 * [ALTO-4] Protects NOTES.md <= 120 lines ceiling when importing a batch of mobile issues.
 * @param {number} currentNotesLineCount
 * @param {object[]} incomingIssues
 * @param {number} maxLinesCeiling
 * @param {number} linesPerNote
 */
export function planSafeInboxImport(
  currentNotesLineCount,
  incomingIssues,
  maxLinesCeiling = 115,
  linesPerNote = 8
) {
  const availableLines = Math.max(0, maxLinesCeiling - currentNotesLineCount);
  const maxNotesToImport = Math.floor(availableLines / linesPerNote);

  return Object.freeze({
    imported: Object.freeze(incomingIssues.slice(0, maxNotesToImport)),
    deferredOnGithub: Object.freeze(incomingIssues.slice(maxNotesToImport))
  });
}

/**
 * [P0-PORT] Auto-detects the test runner command of any host repository.
 * @param {string[]} rootFiles
 * @param {object} packageJsonScripts
 * @param {string|null} customCommand
 * @returns {string|null}
 */
export function detectProjectTestCommand(
  rootFiles = [],
  packageJsonScripts = {},
  customCommand = null
) {
  if (customCommand && typeof customCommand === 'string' && customCommand.trim()) {
    return customCommand.trim();
  }
  const files = new Set(rootFiles);
  if (files.has('package.json') && packageJsonScripts?.test) {
    if (files.has('pnpm-lock.yaml')) return 'pnpm test';
    if (files.has('yarn.lock')) return 'yarn test';
    return 'npm test';
  }
  if (files.has('Cargo.toml')) return 'cargo test';
  if (files.has('go.mod')) return 'go test ./...';
  if (files.has('pyproject.toml') || files.has('pytest.ini')) return 'pytest';
  if ([...files].some((f) => f.endsWith('.sln') || f.endsWith('.csproj'))) return 'dotnet test';
  return null;
}

/**
 * Validates voice assistant turns for Gemini Live / AI Studio (max 2 questions, <= 35 spoken words).
 * @param {object} turnState
 */
export function validateVoiceAssistantTurn(turnState) {
  const spoken = String(turnState?.spokenReply ?? '').trim();
  const wordCount = spoken ? spoken.split(/\s+/).length : 0;
  if (wordCount > MAX_SPOKEN_WORDS_PER_TURN) {
    return Object.freeze({ valid: false, reason: 'SPOKEN_REPLY_TOO_LONG' });
  }
  if ((turnState?.questionsAskedSoFar ?? 0) > MAX_VOICE_QUESTIONS) {
    return Object.freeze({ valid: false, reason: 'TOO_MANY_QUESTIONS_INTERROGATION' });
  }
  return Object.freeze({ valid: true, reason: null });
}

/**
 * Transforms a structured voice assistant payload (Google AI Studio / Gemini Live)
 * into a GitHub Issue payload + 1-Tap Copy Block (avoiding broken GitHub Mobile URL query params).
 * @param {object} payload
 */
export function buildIssueFromVoicePayload(payload) {
  if (!payload || typeof payload.title !== 'string' || !payload.title.trim()) {
    throw new Error('VOICE_PAYLOAD_INVALID: non-empty title is required');
  }
  const cleanScope =
    String(payload.scope || 'global')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '') || 'global';

  const cleanTitle = payload.title
    .trim()
    .replace(/^[!\s]+/, '')
    .replace(/^[\w-]+\s*:\s*/, '')
    .slice(0, 80);

  const isFastTrack =
    payload.mode === 'FAST_TRACK_READY' ||
    /fai\s+ora|subito|urgente/i.test(String(payload.voiceCommand ?? ''));

  const issueTitle = isFastTrack
    ? `! ${cleanScope}: ${cleanTitle}`
    : `${cleanScope}: ${cleanTitle}`;

  const safeCompactSpec = String(payload.compactSpec || cleanTitle)
    .replace(/\r?\n/g, ' ')
    .trim()
    .slice(0, 140);

  const issueBody = [
    `> **Specifica DESIDERATA (<=140c)**: ${safeCompactSpec}`,
    '',
    '### Contesto Vocale Raccolto',
    String(payload.verbatimTranscriptSummary || cleanTitle).trim()
  ].join('\n');

  const copyBlock = `${issueTitle}\n\n${issueBody}`;

  return Object.freeze({
    status: isFastTrack ? 'ready' : 'inbox',
    title: issueTitle,
    body: issueBody,
    labels: Object.freeze([isFastTrack ? 'status:ready' : 'status:inbox', `scope:${cleanScope}`]),
    copyBlock
  });
}
