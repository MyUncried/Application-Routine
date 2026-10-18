// Lot 6 (6J) — dossier d'arbitrage groupé, après restructuration (LECTURE SEULE sur docs/).
// Usage : node arbitrages-lot6.mjs <racine> <dossier-lot6> <sortie.md>
// Regroupe, avec leur place actuelle : les mentions « À CLARIFIER » des chapitres ; les paires divergentes relevées par la
// classification (divergences.tsv) ; les copies partielles et les occurrences de lignes « à vérifier » restées en place.
// Ne tranche rien : chaque point attend une décision de Hermann.
import fs from 'fs'; import path from 'path';
const [repo, L6, out] = process.argv.slice(2);
const SF = path.join(repo, 'docs', 'Specifications-fonctionnelles');
const tsv = f => fs.readFileSync(path.join(L6, f), 'utf8').trim().split(/\r?\n/).slice(1).map(l => l.split('\t'));
const cor = new Map(tsv('correspondance-actualisee.tsv').map(c => [c[0], c]));
const rel = '../../../../docs/Specifications-fonctionnelles/';
const lien = id => { const c = cor.get(id); if (!c) return id; const f = c[21], t = c[22], a = c[23]; return `[${(t || c[3]).replace(/[[\]|]/g, '')}](${rel}${encodeURIComponent(f)}${a ? '#' + a : ''}) (ch. ${f.slice(0, 2) === 'An' ? 'annexe' : f.slice(0, 2)})`; };
const ext = s => s.replace(/\]\([^)]*\)?/g, ']').replace(/\s+/g, ' ').trim(); // extraits sans cible de lien
const L = ['# Lot 6 — dossier d’arbitrage groupé (6J)', '', '- **État :** après la restructuration (étapes 6C à 6K).', '- **Nature :** liste de points à décider. **Aucun n’est tranché ici.** Les passages concernés restent en place, côte à côte, dans la documentation restructurée.', '- Les liens pointent vers la place actuelle des sections.', ''];
// 1. À CLARIFIER
L.push('## 1. Mentions « À CLARIFIER » présentes dans les chapitres', '', '| Chapitre | Section | Extrait |', '|---|---|---|');
for (const f of fs.readdirSync(SF).filter(f => f.endsWith('.md')).sort()) { let cur = ''; for (const l of fs.readFileSync(path.join(SF, f), 'utf8').split(/\r?\n/)) { const m = l.match(/^#{1,6} (.*)$/); if (m) cur = m[1];
  if (l.includes('À CLARIFIER') && !/^Annexe – (Correspondance|Index)/.test(f)) L.push(`| ${f.slice(0, 2)} | ${cur.replace(/\|/g, '\\|')} | ${ext(l).slice(0, 160).replace(/\|/g, '\\|')}… |`); } }
// 2. Divergences
const div = tsv('divergences.tsv');
L.push('', `## 2. Passages divergents relevés par la classification (${div.length} paires)`, '', 'Repérages vérifiés par lecture, au lot 6A ; ce n’est pas un audit exhaustif. La colonne « Constat » indique si la section était déjà visée par un constat du diagnostic. Les 30 paires sans constat sont les nouvelles divergences de QR-9.', '',
  '| # | Section A | Section B | Constats existants | Constat |', '|---|---|---|---|---|');
div.forEach((d, i) => L.push(`| ${i + 1} | ${lien(d[0])} | ${lien(d[2])} | ${[d[4], d[5]].filter(Boolean).join(' ; ').replace(/\|/g, '/')} | ${d[6] === 'oui' ? 'existant' : '**nouveau**'} |`));
// 3. Copies partielles et lignes à vérifier
L.push('', '## 3. Copies laissées en place (rapprochement à décider)', '', 'Ces copies n’ont pas été remplacées par un renvoi : l’équivalence complète (texte, portée, autorité) n’est pas établie. Pour chacune, il faut décider si la différence de portée ou les lignes propres sont voulues (on garde les deux) ou s’il s’agit d’un reste à aligner (décision de Hermann).', '', '### 3.1 Sections', '', '| Section | Écart |', '|---|---|');
for (const c of cor.values()) if (c[16]) L.push(`| ${lien(c[0])} | ${c[16].replace(/\|/g, '/')} |`);
const cl = tsv('copies-lignes.tsv').filter(r => r[5]);
L.push('', `### 3.2 Lignes copiées dont le contexte diffère (${cl.reduce((n, r) => n + r[5].split(' ').filter(Boolean).length, 0)} occurrences)`, '', '| Ligne (extrait) | Occurrence conservée | Occurrences à vérifier (motif) |', '|---|---|---|');
for (const r of cl) L.push(`| ${ext(r[6]).slice(0, 90).replace(/\|/g, '\\|')}… | ${lien(r[3].split(':')[0])} | ${r[5].split(' ').filter(Boolean).map(o => { const m = o.match(/^([^:]+):[^(]*\((.*)\)$/); return m ? `${lien(m[1])} (${m[2]})` : o; }).join(' ; ')} |`);
// 4. Décisions produit de qualité
L.push('', '## 4. Décisions produit sur la qualité des exigences', '', 'Liste du plan, [§10.2](plan-restructuration.md) : QF §2.0 (convention d’obligation), QF-07 et QF-08, QF-14, QF-16 et QC-14, QF-17 (format ≥ 1 h) et QF-19, QC-01 à QC-13 et QC-15, QS-13 (statut fermé du registre), QS-10 et P-14, S-01 à S-22, contrat d’écran du message de migration, emplacement du nombre d’Exercices (D-399). Aucune n’est tranchée par la restructuration.', '');
fs.writeFileSync(out, L.join('\n') + '\n');
console.log(`divergences=${div.length} copies_sections=${[...cor.values()].filter(c => c[16]).length} lignes=${cl.length}`);
