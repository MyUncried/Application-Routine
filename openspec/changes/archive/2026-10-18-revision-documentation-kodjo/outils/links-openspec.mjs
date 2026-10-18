import fs from 'fs'; import path from 'path';
const root = process.argv[2]; const base = path.join(root, 'openspec');
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.md')) files.push(p); } })(base);
files.push(path.join(root, 'CLAUDE.md'));
let n = 0; const bad = [];
for (const f of files) {
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((l0, i) => {
    const l = l0.replace(/`[^`]*`/g, ''); // les liens dans un bloc de code ne sont pas rendus
    for (const m of l.matchAll(/\]\(([^)\s]+)\)/g)) {
      let u = m[1]; if (/^(https?:|mailto:|#)/.test(u)) continue; n++;
      let p = u.split('#')[0]; try { p = decodeURIComponent(p); } catch {}
      if (!fs.existsSync(path.resolve(path.dirname(f), p))) bad.push(`${path.relative(root, f)}:${i + 1}\t${u}`);
    }
  });
}
console.log(`fichiers=${files.length} liens=${n} rompus=${bad.length}`); if (bad.length) console.log(bad.join('\n'));
