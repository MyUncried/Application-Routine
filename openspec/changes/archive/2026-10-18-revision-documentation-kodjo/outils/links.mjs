import fs from 'fs'; import path from 'path';
const root = process.argv[2]; const docs = path.join(root, 'docs');
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/archives|preparation|sources/.test(p.slice(docs.length))) walk(p); } else if (p.endsWith('.md')) files.push(p); } })(docs);
const slug = s => s.trim().toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
const cache = new Map();
function anchors(f) {
  if (cache.has(f)) return cache.get(f);
  const set = new Set(); const counts = {};
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^#{1,6}\s+(.*)$/);
    if (m) { const s = slug(m[1]); if (counts[s] !== undefined) { counts[s]++; set.add(s + '-' + counts[s]); } else counts[s] = 0; set.add(s); }
    for (const a of l.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) set.add(a[1]);
    for (const a of l.matchAll(/\{#([\w-]+)\}/g)) set.add(a[1]);
  }
  cache.set(f, set); return set;
}
const out = [];
for (const f of files) {
  const rel = path.relative(root, f).split(path.sep).join('/');
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((l, i) => {
    for (const m of l.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const u = m[1]; if (/^(https?:|mailto:)/.test(u)) continue;
      let [p, h] = u.split('#'); try { p = decodeURIComponent(p); } catch {} if (h) { try { h = decodeURIComponent(h); } catch {} }
      const target = p ? path.resolve(path.dirname(f), p) : f;
      if (!fs.existsSync(target)) { out.push(`MISSING_FILE\t${rel}:${i + 1}\t${u}`); continue; }
      if (h && target.endsWith('.md') && !anchors(target).has(h)) out.push(`MISSING_ANCHOR\t${rel}:${i + 1}\t${u}`);
    }
    for (const m of l.matchAll(/`((?:docs\/)?(?:Specifications-fonctionnelles\/)?SPECIFICATION-[\w.-]+\.md)`/g)) out.push(`MENTION_REMOVED_SPEC\t${rel}:${i + 1}\t${m[1]}`);
  });
}
console.log(out.join('\n')); console.error(`files=${files.length} issues=${out.length}`);
