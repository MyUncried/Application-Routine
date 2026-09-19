#!/usr/bin/env bash
# Banc d'integration KODJO V2 — parcours de file.
#
# Exerce le VRAI parcours : run-queued-request.ps1 -> project-queued-request.js
# -> start-kodjo-v2.ps1 -> run-local-claude.js -> lib/*. Seuls Claude et `gh`
# sont remplaces par des executables factices.
#
# Aucun hote distant : `origin` est un depot nu local, et le banc refuse de
# demarrer si `origin` designe autre chose.
#
# Usage : PWSH=<chemin pwsh> bash tests/kodjo/queue-integration/run-bench.sh
set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PWSH="${PWSH:-pwsh}"
command -v "$PWSH" >/dev/null 2>&1 || { echo "SKIP: pwsh indisponible"; exit 0; }

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

BIN="$WORK/bin"; CAP="$WORK/capture"; STATE="$WORK/state"; TMP="$WORK/tmp"; LAD="$WORK/localappdata"
mkdir -p "$BIN" "$CAP" "$STATE" "$TMP" "$LAD"

WINDOWS_STUBS=0
if command -v powershell.exe >/dev/null 2>&1; then
  WINDOWS_STUBS=1
  powershell.exe -NoLogo -NonInteractive -ExecutionPolicy Bypass -File \
    "$(cygpath -w "$REPO_ROOT/tests/kodjo/queue-integration/build-windows-stubs.ps1")" \
    -BinDirectory "$(cygpath -w "$BIN")" || exit 1
else
cat > "$BIN/node" <<'EOS'
#!/usr/bin/env bash
if [ "${1:-}" = "scripts/kodjo/run-local-claude.js" ] && [ -n "${2:-}" ] && [ -f "$2" ]; then
  cp "$2" "$KODJO_BENCH_CAPTURE/local-request.json"
fi
exec "$KODJO_BENCH_REAL_NODE" "$@"
EOS
cat > "$BIN/fakeclaude" <<'EOS'
#!/usr/bin/env bash
for a in "$@"; do [ "$a" = "--version" ] && { echo "2.1.263 (Claude Code)"; exit 0; }; done
echo '{"ok":true}'
case "${KODJO_BENCH_SCENARIO:-none}" in
  edit|control-drift) printf 'export const bilateral = true;\n' >> src/domain/sessions/Session.ts ;;
  rename) git mv src/domain/sessions/Session.ts secrets/exfiltrated.ts ;;
  accent) printf 'x\n' > "src/domain/sessions/café bilatéral.ts" ;;
esac
exit 0
EOS
cat > "$BIN/gh" <<'EOS'
#!/usr/bin/env bash
echo "GH_STUB $*" >> "$KODJO_BENCH_CAPTURE/gh-calls.txt"
exit 0
EOS
chmod +x "$BIN/node" "$BIN/fakeclaude" "$BIN/gh"
fi

git init -q --bare "$WORK/origin.git"
FIX="$WORK/repo"; mkdir -p "$FIX"
cp -r "$REPO_ROOT/scripts" "$REPO_ROOT/tests" "$FIX/"
mkdir -p "$FIX/src/domain/sessions" "$FIX/secrets" "$FIX/.github/orchestration/queue/v2" \
         "$FIX/.github/orchestration/v2-slices/QUALIF"
cd "$FIX"
git init -q . && git config user.email bench@test.local && git config user.name bench && git config core.autocrlf false
printf 'export const a = 1;\n' > src/domain/sessions/Session.ts
# Controles triviaux : le banc eprouve le parcours, pas la qualite applicative.
# Pas de package-lock.json : `npm ci` est volontairement saute (KV2-19).
cat > package.json <<'PKG'
{ "name": "kodjo-bench-fixture", "private": true, "version": "0.0.0",
  "scripts": { "test": "node tests/kodjo/queue-integration/fake-jest.js" } }
PKG
printf '' > secrets/.gitkeep
printf 'Mission de qualification jetable.\n' > .github/orchestration/v2-slices/QUALIF/implementation-mission.md
node "$REPO_ROOT/tests/kodjo/queue-integration/make-fixture.js" "$FIX" || exit 1
git add -A >/dev/null && git commit -qm base >/dev/null
git remote add origin "$WORK/origin.git"
git push -q -u origin HEAD:refs/heads/main
SRC="$(git rev-parse HEAD)"
node "$REPO_ROOT/tests/kodjo/queue-integration/make-fixture.js" "$FIX" "$SRC" || exit 1
git add -A >/dev/null && git commit -qm "demandes de file" >/dev/null
QHEAD="$(git rev-parse HEAD)"
echo "demandes generees : $(ls .github/orchestration/queue/v2 | tr '\n' ' ')"

case "$(git remote get-url origin)" in
  *://*) echo "REFUS: origin designe un hote distant"; exit 1 ;;
esac

FAILURES=0
run_case() { # $1 libelle  $2 fichier de file  $3 scenario  $4 attendu
  local label="$1" qf="$2" scenario="$3" expect="$4" pr_expect="${5:-any}"
  rm -rf "$CAP" "$STATE"; mkdir -p "$CAP" "$STATE"
  git -C "$FIX" switch -q main 2>/dev/null || true
  git -C "$FIX" reset -q --hard "$QHEAD"; git -C "$FIX" clean -qfd
  git -C "$FIX" for-each-ref --format='%(refname:short)' refs/heads \
    | grep '^kodjo/v2-' | xargs -r -n1 git -C "$FIX" branch -q -D
  echo "--------------------------------------------------------------"
  echo "CAS : $label"
  local out
  local claude_bin="$BIN/fakeclaude"
  [ "$WINDOWS_STUBS" -eq 1 ] && claude_bin="$(cygpath -w "$BIN/fakeclaude.exe")"
  local preflight_arg=()
  if [ "$qf" = "nominal" ]; then
    local pf="$TMP/preflight-$RANDOM.json"
    node "$REPO_ROOT/tests/kodjo/queue-integration/make-preflight.js" "$FIX" ".github/orchestration/queue/v2/$qf.json" "$pf" || exit 1
    preflight_arg=(-PreflightFile "$pf")
  fi
  out="$( cd "$FIX" && \
    PATH="$BIN:$PATH" KODJO_BENCH_REAL_NODE="$(command -v node)" \
    KODJO_BENCH_CAPTURE="$CAP" KODJO_BENCH_SCENARIO="$scenario" \
    KODJO_ALLOW_TEST_ADAPTER=1 KODJO_CLAUDE_BIN="$claude_bin" \
    KODJO_STATE_ROOT="$STATE" GITHUB_ACTIONS=true GH_TOKEN=stub-token \
    GITHUB_RUN_ID="90000$RANDOM" RUNNER_TEMP="$TMP" HOME="$WORK" LOCALAPPDATA="$LAD" \
    "$PWSH" -NoLogo -NonInteractive -File scripts/kodjo/run-queued-request.ps1 \
      -QueueFile ".github/orchestration/queue/v2/$qf.json" "${preflight_arg[@]}" 2>&1 )"
  echo "$out" | sed 's/\x1b\[[0-9;]*m//g' | sed 's/^/  /' | head -14
  if echo "$out" | grep -q "$expect"; then
    echo "  => ATTENDU TROUVE : $expect"
  else
    echo "  => ECHEC : motif attendu absent : $expect"; FAILURES=$((FAILURES+1))
  fi
  if [ -f "$CAP/local-request.json" ]; then
    echo -n "  requete locale : "; node -e "
      const d=require('$CAP/local-request.json');
      console.log('cles='+Object.keys(d).length+' amorce='+('allow_legacy_recovery_bootstrap' in d ? d.allow_legacy_recovery_bootstrap : 'ABSENTE'))"
  else
    echo "  requete locale : non produite"
  fi
  [ -f "$CAP/gh-calls.txt" ] && echo "  PR : creee" || echo "  PR : aucune"
  if [ "$pr_expect" = "none" ] && [ -f "$CAP/gh-calls.txt" ]; then
    echo "  => ECHEC : une publication a ete tentee"; FAILURES=$((FAILURES+1))
  fi
  if [ "$scenario" = "control-drift" ]; then
    local result_file
    result_file="$(find "$STATE" -type f -name result.json | head -1)"
    if [ -z "$result_file" ]; then
      echo "  => ECHEC : result.json R4 absent"; FAILURES=$((FAILURES+1))
    elif ! node -e "
      const r=require(process.argv[1]);
      const ok=r.status==='IMPLEMENTED_WITH_FAILED_CHECKS'
        && r.out_of_scope_files.includes('secrets/r4-control-drift.txt')
        && r.post_check_drift.includes('APPARU:secrets/r4-control-drift.txt')
        && Array.isArray(r.publishable_paths) && r.publishable_paths.length===0
        && r.publishable_pathspec_file===null;
      if (!ok) { console.error(JSON.stringify(r)); process.exit(1); }
    " "$result_file"; then
      echo "  => ECHEC : oracle structure R4"; FAILURES=$((FAILURES+1))
    else
      echo "  => ORACLE R4 : delta initial conserve, derive refusee, publication vide"
    fi
  fi
}

echo "=============================================================="
echo "BANC D INTEGRATION — parcours de file reel"
echo "pwsh : $("$PWSH" -NoLogo -NonInteractive -Command '$PSVersionTable.PSVersion.ToString()')"
echo "git  : $(git --version)"
echo "=============================================================="
run_case "N1 · nominal, modification dans le perimetre" nominal edit "IMPLEMENTED_AND_VERIFIED"
run_case "N2 · renommage hors perimetre (KV2-02)"      nominal rename "SCOPE_VIOLATION"
run_case "N3 · chemin accentue dans le perimetre"      nominal accent "IMPLEMENTED_AND_VERIFIED"
run_case "R4 · dérive hors périmètre pendant Jest"      nominal control-drift "POST_CHECK_DELTA_DIVERGED" none
run_case "N4 · amorce de type invalide (KV2-01)"       invalide edit "KODJO_QUEUE_LEGACY_RECOVERY_BOOTSTRAP_INVALID"
run_case "N5 · amorce absente de la file"              nominal edit "IMPLEMENTED_AND_VERIFIED"

# Les refus d'admission surviennent AVANT run-queued-request.ps1 : ils sont
# eprouves sur le module reellement appele par le workflow, chaque demande
# ajoutee dans son propre commit.
admission_case() { # $1 libelle  $2 fichier  $3 motif attendu
  local label="$1" qf="$2" expect="$3"
  # Le dernier cas a laisse le depot sur une branche creee a source_head, qui
  # precede l'ajout des demandes : on revient a l'etat de la file.
  git -C "$FIX" switch -q main 2>/dev/null || true
  git -C "$FIX" reset -q --hard "$QHEAD"; git -C "$FIX" clean -qfd
  echo "--------------------------------------------------------------"
  echo "CAS : $label"
  local out
  out="$( cd "$FIX" && QF="$qf" node -e "
    const { admit } = require('./scripts/kodjo/verify-queue-admission');
    const { validateQueueRequest } = require('./scripts/kodjo/lib/queue-contract');
    const { verify } = require('./scripts/kodjo/verify-authorizations');
    const plan = JSON.parse(require('fs').readFileSync(
      '.github/orchestration/queue/v2/nominal.json', 'utf8')).authorized_plan.plan_blob_oid;
    const github = {
      comment: (r, id) => ({ id, issue_url: 'https://api.github.com/repos/o/r/issues/999',
        body: 'preuve ' + plan, user: { login: String(id) === '11' ? 'kodjo-reviewer' : 'kodjo-protocol' } }),
      reactions: () => [{ content: '+1', user: { login: 'MyUncried' } }],
    };
    const rel = '.github/orchestration/queue/v2/' + process.env.QF + '.json';
    const q = JSON.parse(require('fs').readFileSync(rel, 'utf8'));
    const v = validateQueueRequest(q);
    if (v.length) { console.log('KODJO_QUEUE_CONTRACT_REFUSED: ' + v.map(x => x.diagnostic).join(', ')); process.exit(0); }
    try { verify(rel, { cwd: process.cwd(), github }); console.log('ADMISE'); }
    catch (e) { console.log(e.message); }
    void admit;
  " 2>&1 )"
  echo "$out" | sed 's/^/  /' | head -4
  if echo "$out" | grep -q "$expect"; then echo "  => ATTENDU TROUVE : $expect";
  else echo "  => ECHEC : $expect"; FAILURES=$((FAILURES+1)); fi
}

admission_case "N6 · preuve declarative PLAN_APPROVED"    gate-declaratif  "KODJO_QUEUE_CONTRACT_REFUSED"
admission_case "N7 · revue sur une autre version du plan" revue-divergente "REVIEW_PLAN_HASH_MISMATCH"
admission_case "N8 · demande nominale : autorisations coherentes" nominal "ADMISE"

echo "=============================================================="
if [ "$FAILURES" -eq 0 ]; then echo "BANC: OK"; else echo "BANC: $FAILURES ECHEC(S)"; fi
exit "$FAILURES"
