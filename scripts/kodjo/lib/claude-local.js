'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const CLAUDE_CODE_VERSION = '2.1.263';
const MODES = new Set(['INITIAL', 'RESUME_DELTA']);
const CHECKS = new Set(['jest', 'typescript', 'lint']);
const TOOL_SURFACE = 'Read,Edit,Write,Glob,Grep,Bash';
const ALLOWED_TOOLS = [
  'Read',
  'Edit',
  'Write',
  'Glob',
  'Grep',
  'Bash(node {KODJO_CHECK_RUNNER} jest)',
  'Bash(node {KODJO_CHECK_RUNNER} typescript)',
  'Bash(node {KODJO_CHECK_RUNNER} lint)',
];
const DISALLOWED_TOOLS = [
  'mcp__*',
  'Bash(git *)',
  'Bash(gh *)',
  'Bash(curl *)',
  'Bash(wget *)',
  'Bash(ssh *)',
  'Bash(scp *)',
  'Bash(rm *)',
  'Bash(del *)',
  'Bash(powershell *)',
  'Bash(pwsh *)',
];
const DEFAULT_LIMITS = Object.freeze({
  max_ai_calls: 1,
  max_turns: 12,
  max_duration_seconds: 3600,
  max_prompt_bytes: 32768,
  max_total_prompt_bytes: 32768,
  max_rollovers: 0,
});

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function adapterConfig() {
  return {
    bridge_logical_id: 'kodjo-v2-claude-local-0.6.11',
    claude_code_version: CLAUDE_CODE_VERSION,
    non_interactive: true,
    output_format: 'json',
    restricted: true,
    permission_mode: 'dontAsk',
    permission_prompts: 'none',
    strict_mcp_config: true,
    tools: TOOL_SURFACE,
    allowed_tools: ALLOWED_TOOLS,
    disallowed_tools: DISALLOWED_TOOLS,
    limits: DEFAULT_LIMITS,
  };
}

function adapterConfigHash() {
  return sha256(canonical(adapterConfig()));
}

function normalizeRequest(raw, repoRoot) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('REQUEST_INVALID');
  if (raw.schema_version !== 'kodjo.protocol.v2.local-implementation.0.6.11') {
    throw new Error('REQUEST_SCHEMA_UNSUPPORTED');
  }
  const mode = String(raw.mode || '').toUpperCase();
  if (!MODES.has(mode)) throw new Error('CLAUDE_MODE_INVALID');
  const sessionId = raw.session_id === null || raw.session_id === undefined ? null : String(raw.session_id);
  if (mode === 'INITIAL' && sessionId !== null) throw new Error('INITIAL_SESSION_MUST_BE_NULL');
  if (mode === 'RESUME_DELTA' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId || '')) {
    throw new Error('RESUME_SESSION_ID_INVALID');
  }
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(String(raw.slice_id || ''))) throw new Error('SLICE_ID_INVALID');
  if (!/^[0-9a-f]{40}$/.test(String(raw.source_head || ''))) throw new Error('SOURCE_HEAD_INVALID');

  const promptFile = path.resolve(repoRoot, String(raw.prompt_file || ''));
  if (!promptFile.startsWith(repoRoot + path.sep) || !fs.statSync(promptFile).isFile()) {
    throw new Error('PROMPT_FILE_INVALID');
  }
  const scopes = Array.isArray(raw.scope_allow) ? raw.scope_allow.map(String) : [];
  if (!scopes.length || scopes.some((s) => !s || path.isAbsolute(s) || s.includes('..') || s.includes('\\'))) {
    throw new Error('SCOPE_ALLOW_INVALID');
  }
  const checks = Array.isArray(raw.checks) ? raw.checks.map((v) => String(v).toLowerCase()) : [];
  if (!checks.length || checks.some((c) => !CHECKS.has(c))) throw new Error('CHECKS_INVALID');

  const limits = { ...DEFAULT_LIMITS, ...(raw.limits || {}) };
  for (const [key, ceiling] of Object.entries(DEFAULT_LIMITS)) {
    if (!Number.isInteger(limits[key]) || limits[key] < 0 || limits[key] > ceiling) {
      throw new Error('BUDGET_INVALID_' + key.toUpperCase());
    }
  }
  if (limits.max_ai_calls !== 1 || limits.max_rollovers !== 0) throw new Error('BUDGET_NOT_SINGLE_INVOCATION');

  return {
    schema_version: raw.schema_version,
    slice_id: String(raw.slice_id),
    source_head: String(raw.source_head),
    mode, session_id: sessionId,
    prompt_file: promptFile,
    scope_allow: scopes,
    checks,
    limits,
  };
}

function checkRunnerPath(configDir) {
  return path.join(configDir, 'kodjo-check-runner.js').replace(/\\/g, '/');
}

function concreteAllowedTools(configDir) {
  const runner = checkRunnerPath(configDir);
  return ALLOWED_TOOLS.map((rule) => rule.replace('{KODJO_CHECK_RUNNER}', '"' + runner + '"'));
}

function buildPrompt(request, taskText, configDir) {
  const runner = checkRunnerPath(configDir);
  const checkCommands = request.checks.map((c) => ({
    jest: 'node "' + runner + '" jest',
    typescript: 'node "' + runner + '" typescript',
    lint: 'node "' + runner + '" lint',
  })[c]);
  return [
    'KODJO V2 LOCAL IMPLEMENTATION — ' + request.mode,
    'Slice: ' + request.slice_id,
    'Source HEAD: ' + request.source_head,
    '',
    'Mission:',
    taskText.trim(),
    '',
    'Bornes obligatoires:',
    '- Modifier uniquement: ' + request.scope_allow.join(', '),
    '- Ne lancer aucune commande git, gh, réseau, publication, suppression globale ou shell indirect.',
    '- Ne créer ni commit, branche, tag, stash ou push.',
    '- Exécuter les contrôles autorisés: ' + checkCommands.join(' ; '),
    '- Si un contrôle échoue, lire son erreur, corriger uniquement la cause dans le périmètre, puis relancer ce contrôle.',
    '- Répéter dans cette invocation bornée jusqu’au succès ou jusqu’à un blocage réel.',
    '- Ne jamais affaiblir, supprimer ou contourner un test pour obtenir artificiellement PASS.',
    '- En cas d’ambiguïté fonctionnelle, ne pas inventer: arrêter avec CLARIFICATION_REQUIRED.',
    '- À la fin, résumer les fichiers modifiés, corrections et contrôles réellement exécutés.',
  ].join('\n') + '\n';
}

function buildArgs(request, configDir, prompt) {
  const c = adapterConfig();
  const args = [
    '-p',
    '--restricted',
    '--permission-mode', c.permission_mode,
    '--permission-prompts', c.permission_prompts,
    '--output-format', c.output_format,
    '--max-turns', String(request.limits.max_turns),
    '--tools', c.tools,
    '--allowedTools', concreteAllowedTools(configDir).join(','),
    '--disallowedTools', c.disallowed_tools.join(','),
    '--strict-mcp-config',
    '--mcp-config', path.join(configDir, 'mcp.json'),
    '--settings', path.join(configDir, 'settings.json'),
  ];
  if (request.mode === 'INITIAL') args.push('--session-id', request.generated_session_id);
  else args.push('--resume', request.session_id);
  args.push(prompt);
  return args;
}

function classifyClaudeFailure(result) {
  const text = String((result && result.stderr) || '') + '\n' + String((result && result.stdout) || '');
  if (/oauth|authentication|unauthorized|invalid token|token.*expired|401/i.test(text)) return 'KODJO-V2-CLAUDE-AUTH';
  if (/rate limit|usage limit|quota|429|limit.*reset/i.test(text)) return 'KODJO-V2-CLAUDE-USAGE-LIMIT';
  if (result && result.status === null) return 'KODJO-V2-CLAUDE-TIMEOUT';
  return result && result.status === 0 ? null : 'KODJO-V2-CLAUDE-EXECUTION';
}

function redact(text) {
  const token = process.env.CLAUDE_CODE_OAUTH_TOKEN || '';
  return token ? String(text || '').split(token).join('[REDACTED]') : String(text || '');
}

module.exports = {
  CLAUDE_CODE_VERSION,
  DEFAULT_LIMITS,
  TOOL_SURFACE,
  ALLOWED_TOOLS,
  DISALLOWED_TOOLS,
  adapterConfig,
  adapterConfigHash,
  canonical,
  sha256,
  normalizeRequest,
  buildPrompt,
  buildArgs,
  checkRunnerPath,
  concreteAllowedTools,
  classifyClaudeFailure,
  redact,
};
