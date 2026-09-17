from pathlib import Path

register = Path('.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md')
text = register.read_text(encoding='utf-8')
if 'Version du registre : **3.41.0**' in text:
    raise SystemExit(0)
text = text.replace('Version du registre : **3.40.0**', 'Version du registre : **3.41.0**', 1)
anchor = '| T-114 | V2 0.6.29 | Tests requis dans le contrat d’écriture | Cohérence tests/scope | Exiger un test inexistant sans CREATE puis avec CREATE autorisé | Le premier cas échoue `TEST_CONTRACT_CONSISTENCY`, le second passe | plan-contract-consistency.pilot.js | NON RETESTÉ | INC-141 |\n'
if anchor not in text:
    raise SystemExit('register T-114 anchor missing')
addition = anchor + '| INC-142 | 2026-09-17 | V2 planification 0.6.30 | DÉFAUT_CONCEPTION | Clarification mineure du plan | Une correction littérale mineure imposait jusqu’ici une reconstruction complète du plan et une revue produit complète alors que le contrat machine restait inchangé | Le protocole ne distinguait pas clarification littérale bornée et révision structurelle | Parcours V2-CAT-01 du 17/09/2026 : arbitrage de libellé puis relances complètes de plan/revue | Fast path `START_MINOR_PLAN_CLARIFICATION` : remplacement littéral exact hors blocs machine, rejeu impact/contrat, revue Claude réduite, repli obligatoire vers le parcours complet | Aucun fast path si source_head, contrat machine, scope, tests, migration, API, architecture, données ou stratégie changent | T-115 | NON RETESTÉ | START_INITIAL_PLAN uniquement | OUVERT | — | Extension START_PLAN_REVISION explicitement hors 0.6.30 |\n| T-115 | V2 0.6.30 | Clarification mineure bornée | Routage / preuve | Remplacer un littéral exact avec contrat inchangé, puis injecter occurrence incorrecte, marqueur protégé, contrat absent et statut non admissible | Le cas nominal produit `kodjo.minor-plan-clarification.v1`; tous les cas non admissibles échouent avant publication ; le workflow impose une revue réduite et un fallback complet | minor-plan-clarification.pilot.js + workflow 0.6.30 | NON RETESTÉ | INC-142 |\n'
text = text.replace(anchor, addition, 1)
history = '| 3.39.0 | 2026-09-17 | Ajout d’INC-137 à INC-139 et T-110 à T-112 : portabilité des empreintes, sorties structurées et contrat INITIAL à un niveau ; qualification Linux/Windows puis exécution réelle V2-CAT-01 entièrement verte. |'
if history not in text:
    raise SystemExit('history anchor missing')
text = text.replace(history, '| 3.41.0 | 2026-09-17 | Ajout d’INC-142 et T-115 : fast path de clarification mineure du plan initial, transformation littérale déterministe, revalidation machine et revue réduite avec fallback complet. |\n' + history, 1)
register.write_text(text, encoding='utf-8')

testfile = Path('tests/kodjo/incident-register.pilot.js')
t = testfile.read_text(encoding='utf-8')
t = t.replace("test('registre canonique 3.40.0: incidents uniques, complets et à valeurs contrôlées'", "test('registre canonique 3.41.0: incidents uniques, complets et à valeurs contrôlées'", 1)
t = t.replace('/Version du registre : \\*\\*3\\.40\\.0\\*\\*/', '/Version du registre : \\*\\*3\\.41\\.0\\*\\*/', 1)
t = t.replace("assertSequence(incidents, 'INC', 141);", "assertSequence(incidents, 'INC', 142);", 1)
t = t.replace("assertSequence(ids('T'), 'T', 114);", "assertSequence(ids('T'), 'T', 115);", 1)
testfile.write_text(t, encoding='utf-8')
