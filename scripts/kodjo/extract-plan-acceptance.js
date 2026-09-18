'use strict';

const fs = require('node:fs');

function extract(planText) {
  const lines = String(planText).replace(/\r/g, '').split('\n');
  const start = lines.findIndex((line) => /^## 9\. Critères d[’']acceptation\s*$/.test(line.trim()));
  if (start < 0) throw new Error('KODJO_IMPLEMENTATION_REVIEW_ACCEPTANCE_SECTION_MISSING');
  const rows = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (/^##\s+/.test(line)) break;
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 2) continue;
    if (cells[0] === 'Exigence' || /^[-: ]+$/.test(cells[0])) continue;
    rows.push({
      id: 'AC-' + String(rows.length + 1).padStart(2, '0'),
      requirement: cells[0],
      expected_evidence: cells[1],
    });
  }
  if (rows.length === 0) throw new Error('KODJO_IMPLEMENTATION_REVIEW_ACCEPTANCE_EMPTY');
  return { schema: 'kodjo.protocol.v2.acceptance-coverage.0.6.38', criteria: rows };
}

function main(argv = process.argv.slice(2)) {
  const file = argv[0];
  if (!file) throw new Error('USAGE: extract-plan-acceptance.js <technical-plan.md>');
  const result = extract(fs.readFileSync(file, 'utf8'));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

if (require.main === module) {
  try { main(); } catch (err) { process.stderr.write(String(err.message || err) + '\n'); process.exit(1); }
}

module.exports = { extract };
