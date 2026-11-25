#!/usr/bin/env bash
# Applique les migrations T1 sur une base Postgres temporaire, avec un schéma `auth` simulé, puis exécute les tests.
# Usage : supabase/tests/run-sql-tests.sh   (nécessite psql et un serveur Postgres local accessible en tant que postgres)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db="kodjo_t1_test_$$"
PSQL=(psql -v ON_ERROR_STOP=1 -X -q)
if [ "$(id -un)" = "root" ]; then run() { su postgres -c "$(printf '%q ' "$@")"; }; else run() { "$@"; }; fi
run createdb "$db"
trap 'run dropdb --if-exists "$db"' EXIT
run "${PSQL[@]}" -d "$db" -f "$here/auth_stub.sql"
for f in "$here"/../migrations/*.sql; do run "${PSQL[@]}" -d "$db" -f "$f"; done
run "${PSQL[@]}" -d "$db" -f "$here/t1_accounts_test.sql"
