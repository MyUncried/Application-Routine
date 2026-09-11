'use strict';

/**
 * Refuse un chemin candidat ambigu au lieu de le normaliser puis de l'admettre.
 * Les chemins produits par Git sont relatifs, séparés par `/` et sans segments
 * vides, `.` ou `..`.
 */
function normalizeScopeCandidate(file) {
  if (typeof file !== 'string' || file.length === 0 || file.includes('\0')) return null;
  if (file.includes('\\') || file.startsWith('/') || /^[A-Za-z]:/.test(file)) return null;
  const parts = file.split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) return null;
  return parts.join('/');
}

/** Les règles sont validées séparément des chemins candidats. */
function normalizeScopeRule(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.includes('\0')) return null;
  const normalized = raw.replace(/\\/g, '/');
  const suffix = normalized.endsWith('/**') ? '/**' : normalized.endsWith('/*') ? '/*' : '';
  const base = suffix ? normalized.slice(0, -suffix.length) : normalized;
  if (!base || base.startsWith('/') || /^[A-Za-z]:/.test(base)) return null;
  const parts = base.split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) return null;
  return parts.join('/') + suffix;
}

function inScope(file, scopes) {
  const candidate = normalizeScopeCandidate(file);
  if (!candidate || !Array.isArray(scopes)) return false;
  return scopes.some((raw) => {
    const rule = normalizeScopeRule(raw);
    if (!rule) return false;
    if (rule.endsWith('/**')) return candidate === rule.slice(0, -3) || candidate.startsWith(rule.slice(0, -2));
    if (rule.endsWith('/*')) return candidate.startsWith(rule.slice(0, -1)) && !candidate.slice(rule.length - 1).includes('/');
    return candidate === rule;
  });
}

module.exports = { normalizeScopeCandidate, normalizeScopeRule, inScope };
