// Lot 6 (étape 6K) — contrôle qu'une correction rédactionnelle ne change pas le sens d'une règle (LECTURE SEULE).
// Usage : node verifier-redaction.mjs <corrections.json>
// Entrée : corrections au format des lots précédents ({ id, ref, file, ancien, nouveau, [classe], [decision] }).
// Pour chaque correction classée DOC (par défaut), les éléments porteurs de sens doivent être identiques, en nombre et en
// valeur, entre « ancien » et « nouveau » :
//   - nombres et leurs unités (après normalisation des espaces : « 3min15s » = « 3 min 15 s ») ;
//   - identifiants (D-, RM-, CE-, REC-, CIR-, DM-, API-, FMT-) ;
//   - libellés d'interface entre `…` ou « … » ;
//   - négations et restrictions (ne, n’, pas, aucun, jamais, sans, sauf, ni, seul, uniquement, hors) ;
//   - modalités (doit, peut, obligatoire, facultatif, interdit, toujours).
// Une correction qui change l'un d'eux n'est pas rédactionnelle : elle doit être classée FONCT-ARBITRÉ avec la décision qui
// la fonde (champ « decision » : D-nnn), ou soumise à décision (6J). Code de sortie 1 si une correction DOC change le sens.
import fs from 'fs';
const [file] = process.argv.slice(2);
const brut = JSON.parse(fs.readFileSync(file, 'utf8')); const corr = Array.isArray(brut) ? brut : brut.corrections || Object.values(brut).find(Array.isArray) || [];
const norm = s => s.normalize('NFC').replace(/[   ]/g, ' ');
const compact = s => norm(s).replace(/(\d)\s+(?=[a-zA-Zµ%°])/g, '$1').replace(/\s+/g, ' ');
const FAMILLES = {
  nombres: s => compact(s).match(/\d+(?:[.,]\d+)?(?:\s?(?:min|ms|s|h|px|pt|%|°))?/g) || [],
  identifiants: s => norm(s).match(/\b(?:D|RM|CE|REC|CIR|DM|API|FMT)-[A-Z0-9-]*\d+[a-z]?\b/g) || [],
  libelles: s => norm(s).match(/`[^`]+`|«\s?[^»]+?\s?»/g)?.map(x => x.replace(/\s+/g, ' ').replace(/«\s?|\s?»/g, '"')) || [],
  negations: s => norm(s).toLowerCase().match(/\b(?:ne|pas|aucune?|jamais|sans|sauf|ni|seule?s?|uniquement|hors)\b|\bn[’']/g)?.map(x => x.replace('’', "'")) || [],
  modalites: s => norm(s).toLowerCase().match(/\b(?:doi(?:t|vent)|peu(?:t|vent)|obligatoires?|facultati(?:f|ve)s?|interdite?s?|toujours)\b/g) || [],
};
const multiset = a => a.slice().sort().join('|');
let ko = 0;
for (const c of corr) {
  if (c.motif && c.motif !== 'REDACTION') continue; // seules les corrections rédactionnelles sont soumises aux invariants (les autres ont leur propre preuve)
  const diffs = Object.entries(FAMILLES).filter(([, f]) => multiset(f(c.ancien)) !== multiset(f(c.nouveau))).map(([k]) => k);
  const classe = c.classe || 'DOC';
  if (!diffs.length) continue;
  if (classe === 'FONCT-ARBITRÉ' && /^D-\d{3}$/.test(c.decision || '')) { console.log(`${c.id} : ${diffs.join(', ')} modifiés — FONCT-ARBITRÉ (${c.decision})`); continue; }
  ko++; console.log(`${c.id} : ${diffs.join(', ')} modifiés — correction non rédactionnelle (décision requise)`);
}
console.log(`corrections=${corr.length} non_redactionnelles=${ko}`);
process.exit(ko ? 1 : 0);
