# KODJO — Registre versionné des incidents de protocole

- Version : **1.0.0**
- Date d'établissement : **2026-09-07**
- Périmètre : protocoles KODJO S09, transition générique S10 et reprises associées
- Source de vérité : GitHub (`MyUncried/Application-Routine`)
- Statuts de preuve : `CONFIRMÉ`, `PARTIEL`, `À COMPLÉTER`
- Statuts de test : `PERMANENT`, `HISTORIQUE`, `MANQUANT`

## Règle de tenue

Chaque incident reçoit un identifiant stable. Une correction de protocole ne clôt un incident que si :

1. la cause est reliée à une preuve GitHub ou documentaire ;
2. l'invariant permanent est formulé ;
3. un test reproductible est identifié ;
4. le statut du test indique honnêtement s'il est encore exécuté ;
5. toute nouvelle occurrence met à jour la ligne existante ou crée un nouvel identifiant ;
6. les runs dont seule l'existence est connue restent dans l'inventaire des preuves incomplètes.

Le registre ne transforme jamais un souvenir de conversation en fait confirmé sans preuve GitHub correspondante.

## Incidents capitalisés

| ID | Phase | Incident et preuve | Cause | Invariant permanent | Test associé | Statut |
|---|---|---|---|---|---|---|
| KIP-001 | S09 Plan | Plan complet tronqué ou réponse incomplète ; correctifs `6a09f195`, `f03efb7` (1800→4000 tokens) | Budget de sortie insuffisant pour une revue/plan volumineux | Toute sortie structurante doit disposer d'un budget compatible et être refusée si son marqueur terminal manque | Fixture longue ; vérification du marqueur final et du statut API | HISTORIQUE / PARTIEL |
| KIP-002 | S09 Plan | `CLARIFY` pouvait perdre les points bloquants ; `11f3c73f` | Publication partielle d'une réponse de clarification | Un état de clarification transporte obligatoirement tous les `blocking_points` et ne peut devenir READY | Cas CLARIFY avec plusieurs blocages ; rejet d'un faux READY | HISTORIQUE |
| KIP-003 | S09 Review | Conflit d'architecture traité comme perte de contexte (`ARBITRATION_CONTEXT_LOST`) | Contexte arbitral non transporté ou sortie non classifiée | Une décision manquante est un gate explicite ; aucune réinvention silencieuse | Fixture de conflit et attente d'un statut de clarification | HISTORIQUE / PARTIEL |
| KIP-004 | S09 Claude | RESUME dans un autre environnement : « No conversation found with session ID » ; rapport SESSION-RESUME-02 | Session locale non portable entre runners/environnements | Une reprise doit utiliser la session et le runner qui la possèdent ; aucun fallback INITIAL | Test BASE/RESUME sur même stockage ; rejet sur stockage absent | HISTORIQUE ; test permanent MANQUANT |
| KIP-005 | S09 Impl. | Feedback tronqué et faux état READY ; `0874fbb5` | Extraction/transport incomplet du feedback Claude | Le feedback est conservé intégralement et toute sortie ambiguë bloque READY | Feedback long + marqueur de clarification tardif | HISTORIQUE |
| KIP-006 | S09 Impl. | Chemins Git Unicode mal décodés ou cités ; `a3280705`, `bb3e6ae9`, `50f417c4`, `38993131`, `e19f188e`, `fc35b641` | `core.quotePath`, encodage console et parsing des chemins incompatibles | Les chemins sont lus sous forme brute UTF-8 et comparés après normalisation contrôlée | Fichiers avec accents/espaces ; scope positif et négatif | HISTORIQUE |
| KIP-007 | S09 Impl. | Travail Claude perdu après défaut de transport ; `4ac56941`, `9b0f1d77`, `8606959a`, `70cffd2f` | Worktree non durable avant validation/promotion | Tout travail coûteux doit être matérialisé dans un checkpoint récupérable avant une étape de transport fragile | Simulation d'échec après travail ; récupération depuis checkpoint sans nouvel appel IA | HISTORIQUE / PARTIEL |
| KIP-008 | S09 Workflow | Erreur de parseur PowerShell ; `8634387d` | Script PowerShell non analysé dans son shell réel | Toute étape PowerShell modifiée doit être parsée/exécutée sur le runner Windows cible avant activation | Analyse syntaxique PowerShell et micro-payload réel | HISTORIQUE ; test permanent MANQUANT |
| KIP-009 | S09 Workflow | Indentation YAML cassée ; `30416fbf`, puis structure review restaurée par `ada7150f` | Modification textuelle sans validation du document complet | Chaque workflow final est parsé comme YAML et sa structure jobs/steps est contrôlée | Parse YAML complet + inventaire des jobs/steps | PERMANENT pour workflows génériques |
| KIP-010 | S09 Claude | Prompt volumineux passé comme argument ; `03dbcd5d` | Limite/quoting de ligne de commande | Les prompts longs sont transmis par fichier ou stdin, jamais comme argument non borné | Prompt long, Unicode, guillemets et retours ligne via stdin | HISTORIQUE / PARTIEL |
| KIP-011 | S09 Recovery | Workflow de réparation non exécutable ; `d99f4f43` | Chemin secondaire créé sans test de déclenchement complet | Tout chemin de récupération est testé de l'événement jusqu'au dernier gate | Déclencheur exact + job présent + gate complet sans IA | HISTORIQUE ; couverture générique PARTIELLE |
| KIP-012 | S09 Review | Sortie bot impossible à relayer vers la revue ; `7a9c8346` | GitHub bloque les récursions provoquées par `GITHUB_TOKEN` | Une transition automatique possède un `repository_dispatch` explicite ou un relais utilisateur autorisé et vérifié | Commentaire bot seul, relais utilisateur exact, dispatch explicite | HISTORIQUE puis PERMANENT générique |
| KIP-013 | S09 Integration | Scan vide considéré comme échec ; `b4a1744a` | Code retour non nul attendu de `grep` sous mode strict | L'absence attendue d'un motif est un succès explicitement codé | Scan vide, un résultat autorisé, un résultat interdit | HISTORIQUE |
| KIP-014 | S09 OpenAI | Transport OpenAI fragile et workflow review structurellement cassé ; `95e1a053`, `ada7150f` | Réponse API et structure YAML insuffisamment validées | Statut API, texte non vide et verdict terminal exact sont obligatoires avant publication | Réponses completed/incomplete/error, texte vide, verdict absent/dupliqué | PARTIEL |
| KIP-015 | S09 Claude | Diagnostic perdu lors d'un échec DEV ; `bf0f0b5d` | Artefacts publiés seulement sur succès | stdout, stderr et diagnostic non secret sont conservés avec `if: always()` | Échec CLI simulé et présence des artefacts | HISTORIQUE / intégré aux workflows |
| KIP-016 | S09 Claude | Limite d'usage classée comme simple erreur CLI ; `7ac45d7a` | Ordre de classification incorrect | Les limites/rate limits deviennent `USAGE_LIMIT` avant l'erreur transport et interdisent les retries | Réponse 429/limit avec codes CLI variés | HISTORIQUE / PARTIEL |
| KIP-017 | S09 Finalize | Dépendances absentes pendant les contrôles finaux ; `fab95d69` | Jest/TypeScript exécutés avant `npm ci` | Tout gate Node installe depuis le lockfile avant Jest/TypeScript | Checkout propre sans `node_modules`, puis `npm ci`, Jest, TS | HISTORIQUE / intégré |
| KIP-018 | Générique S10 | Dépendance YAML non déclarée sur quatre workflows ; `ca995389`, `85ca1408`, `f210539f`, `dc8d9214` | Parser supposé disponible sur tous les runners | Aucune commande ne dépend d'un outil non déclaré ; utiliser un runtime garanti ou tester sa présence | Matrice Ubuntu/Windows des exécutables requis | HISTORIQUE ; matrice permanente MANQUANTE |
| KIP-019 | Générique S10 | Parser de manifeste supprimé/cassé sur quatre workflows ; `9d7d9699`, `4fffddb3`, `27490d9a`, `5a07ee8d` | Correctif mécanique non vérifié transversalement | Tous les consommateurs du manifeste partagent les mêmes contrôles d'identité, baseline et branche | Fixture manifeste valide + champs absents/mal formés sur chaque workflow | PARTIEL |
| KIP-020 | Générique S10 | CRLF rejeté dans quatre manifests ; `d61e276f`, `a24fcecc`, `ed1bb852`, `b25c0494` | Expressions de ligne limitées à LF | Tout corps/manifeste est normalisé en LF avant extraction | LF, CRLF, CR et fins mixtes | PERMANENT pour commentaires ; manifeste PARTIEL |
| KIP-021 | Générique S10 | `START_PLAN` intercepté par le mauvais job ; `f80f2889` | Routage ambigu entre plan et plan-review | Chaque événement possède un marqueur exact et un seul consommateur | Matrice de tous les marqueurs voisins et préfixes | PERMANENT |
| KIP-022 | Générique S10 | Session de revue de plan non préservée ; `f3e943bd` | Identifiant de session omis lors de la transition | Toute correction reprend la session de son activité ; aucune session croisée | Sortie/reprise même session ; rejet d'une autre session | PARTIEL |
| KIP-023 | Générique S10 | BOM UTF-8 dans review/status ; `5de0120d`, `0e7414cd`, `ebc7768e`, `fb89e4f` | Écriture PowerShell UTF-8 avec BOM et comparaison du premier caractère | Les sorties protocolaires sont UTF-8 sans BOM ; les anciennes sources tolérées sont normalisées | BOM/non-BOM sur première ligne, publication puis récupération | PARTIEL |
| KIP-024 | Générique S10 | Clarification Claude non routée vers Développement ; `724b3deb` | Aucun événement de réveil après `CLARIFICATION_REQUIRED` | Toute clarification publie sa causalité et réveille ChatGPT Développement sans second appel IA | Sortie clarification et présence de l'événement de reprise | PARTIEL |
| KIP-025 | Générique S10 | Replanification après implémentation non supportée ; `c97e6bd8`, `e066e412`, `4956b26e`, `5ba1a530` | Machine d'état supposait un plan unique | Toute replanification est explicitement liée au plan, HEAD et incrément qu'elle remplace | Replan autorisé, métadonnées manquantes, plan précédent non remplacé | PARTIEL |
| KIP-026 | Générique S10 | Faux échec `pipefail` pendant replan ; `79dcecf8` | Producteur long relié à un consommateur fermant tôt | Sous `pipefail`, aucun `grep -q`/`head` précoce sur un producteur long | Commentaire court et 200 kB ; aucun SIGPIPE | PERMANENT |
| KIP-027 | Générique S10 | Reprises Claude retransmettant le contexte complet ; `4920ee3f`, `63811444`, `c8aac044` | Reprise reconstruite au lieu d'être différentielle | `--resume` reçoit seulement le delta, les identifiants causaux et le HEAD ; plan/revue complets interdits | Garde-fou sur marqueurs de paquet complet et longueur du prompt | INTÉGRÉ / PARTIEL |
| KIP-028 | Générique S10 | Sortie d'implémentation bot ne déclenchant pas la revue ; `bc0de083`, `ec72a4bf`, `c6459bd2` | Protection anti-récursion GitHub et absence de reprise | Dispatch explicite et récupération depuis un `IMPLEMENTATION_OUTPUT` existant | Dispatch nominal + reprise manuelle liée au commentaire source | PERMANENT / PARTIEL |
| KIP-029 | Générique S10 | `START_IMPLEMENTATION_REVIEW` déclenchait aussi l'implémentation ; runs `34094043696`, `34094043707`; `76548134`, `8bcfa404` | Recherche par sous-chaîne/préfixe ambigu | Première ligne exacte ; aucun marqueur ne peut être préfixe fonctionnel d'un autre | Marqueur exact, voisin, suffixé, seulement préfixé | PERMANENT |
| KIP-030 | Générique S10 | Saut de ligne écrit comme `\\n` littéral dans expression GitHub ; run `34095983755`; `391f1e70`, `726894c8` | Sémantique des littéraux GitHub Actions mal interprétée | Utiliser une vraie valeur newline, par ex. `fromJSON('"\\n"')` | Évaluation des deux marqueurs avec newline réel et faux `\\n` | PERMANENT statique |
| KIP-031 | Générique S10 | Métadonnées CRLF conservant un `\\r` final ; run `34096598591`; `1c0ea389`, `cdfa6519` | Seule la première ligne était normalisée | Normaliser le corps entier avant tout parsing, puis exiger une occurrence exacte par champ | Payload autoritatif LF/CRLF/mixte, doublons et champs mal formés | PERMANENT |
| KIP-032 | Générique S10 | `git ls-remote` après `persist-credentials:false` sur dépôt privé ; run `34097406368`; `57db2c28`, `e65764d5` | Credential supprimé avant lecture Git distante | Les refs privées sont lues via API GitHub authentifiée avec permission minimale vérifiée | Ref correcte/fausse via API ; interdiction statique de lecture Git non authentifiée | PARTIEL |
| KIP-033 | Générique S10 | Revue du lot 2 contre le plan S10 complet ; commentaire `5567353795`; `97e91de6`, `553399e6`, `f3be11ce` | `increment` perdu entre trigger, output et prompt | L'incrément structuré est propagé et la revue ignore les lots ultérieurs | Nominal, historique lié, absent, dupliqué, bornes invalides, mismatch, prompt borné | PERMANENT |
| KIP-034 | Générique S10 | Corruption YAML transitoire lors de l'édition `3e2ce3e5`, réparée par `553399e6` | Substitution textuelle interprétant les séquences `$` | Toute édition est suivie d'un refetch depuis GitHub et d'un parse YAML avant activation | Parse du fichier relu depuis `main`, pas seulement du buffer local | HISTORIQUE ; automatisation PARTIELLE |
| KIP-035 | Générique S10 | Reprise d'implémentation refusant un HEAD descendant ; `b5466160` | Baseline du manifeste confondue avec le HEAD causal de l'incrément | Un resume vérifié accepte un descendant autorisé tout en contrôlant l'ascendance et le HEAD distant | Baseline exacte, descendant valide, branche divergente | PARTIEL |
| KIP-036 | Générique S10 | `gh issue comment --json id` inconnu après push de `b21fb817`; `c36b0bff` | Option non disponible dans la version réelle de `gh` du runner Windows | Publication canonique par `gh api --method POST`, puis lecture de `.id` | Interdiction statique de la commande, présence du transport API | PERMANENT |
| KIP-037 | Générique S10 | Commit poussé sans `IMPLEMENTATION_OUTPUT` ; `e76a3a74`, `f4076cec`; output récupéré `5569247304` | Publication fragile exécutée après le push sans chemin idempotent | Aucun redéveloppement après push ; récupération déterministe puis revue normale | Parent direct, HEAD distant, causalité, Jest, TS, sortie unique | PERMANENT / chemin réel validé |
| KIP-038 | Générique S10 | `repository_dispatch` refusé HTTP 403 après output `5569247304`; `48ac7d03`, `ed5eecd3`, `13dfe4bf`, `cf2f2adf` | `contents: read` au lieu de `contents: write` | Tout appel `/dispatches` déclare `contents: write` et la reprise réutilise une sortie existante | Scan transversal de tous les callers, idempotence, détection de doublons | PERMANENT |

## Preuves de runs historiques dont la cause détaillée reste à compléter

Ces échecs sont attestés par les notifications GitHub retrouvées, mais les extraits disponibles ne suffisent pas à attribuer une cause sans relire les logs. Ils ne doivent pas être fusionnés arbitrairement avec les incidents ci-dessus.

| Référence | Date | Workflow / preuve | État du registre |
|---|---|---|---|
| S09-H01 | 2026-09-04 | Plan Local, événements `5547350464`, `5547363159`, `5547713050` ; commits `bb8be6f`, `faee60e`, `e570b68` | Cause à relire dans les logs |
| S09-H02 | 2026-09-04 | Automated Review, événements `5547492341`, `5547581747` ; commits `0f28b63`, `d0ec155` | Cause à relire |
| S09-H03 | 2026-09-05 | Plan Local « No jobs were run » ; commits `1e20295`, `af59d25`, `6c6b9b9` | Routage probable, non confirmé |
| S09-H04 | 2026-09-05 | Review « No jobs were run » ; commits `72cf4a9`, `8606959` | Routage probable, non confirmé |
| S09-H05 | 2026-09-05 | Independent Plan Review ; commits `5b242dd`, `6456cfa`, plusieurs tentatives | Cause à relire |
| S09-H06 | 2026-09-05 | Implementation Local ; commits `a328070`, `0874fbb`, `0d6c6d0` | Plusieurs causes possibles ; ne pas déduire |
| S09-H07 | 2026-09-05/06 | Recover Worktree ; commits `4ac5694`, `8606959` | Cause à relire |
| S09-H08 | 2026-09-06 | Independent Review, job `implementation-openai-review` échoué, `plan-claude-review` ignoré | Cause à relire |
| S09-H09 | 2026-09-06 | Validate Integration ; commits `eac289e`, `fc35b64` | Probablement relié à KIP-006/KIP-013, à confirmer |
| S09-H10 | 2026-09-06 | Implementation Local, commit `7a9c834`, 13 min 15 s | Cause à relire |
| S09-H11 | 2026-09-06 | Finalize, job échoué en 52 s | Probablement relié à KIP-017, à confirmer |

## Couverture permanente actuellement disponible

- `.github/orchestration/tests/test-increment-review-gate.sh`
  - parsing LF/CRLF ;
  - commentaires longs ;
  - marqueurs exacts ;
  - champs absents, dupliqués et incohérents ;
  - bornes d'incrément ;
  - périmètre de revue ;
  - transport de publication par API ;
  - récupération sans IA ;
  - permissions de tous les appels `repository_dispatch` ;
  - idempotence et doublons de sorties récupérées.
- Gates intégrés aux workflows :
  - identité Issue/manifeste/branche/HEAD ;
  - auteur et commentaire source ;
  - ascendance Git ;
  - Jest complet et TypeScript ;
  - migration001 immuable ;
  - diagnostics Claude conservés.

## Dette de qualification explicite

Les tests suivants restent à créer ou centraliser ; leur absence ne doit plus être masquée :

1. analyse PowerShell réelle sur le runner Windows ;
2. matrice des versions et capacités de `gh`, Git, Node, Claude CLI, Ruby et jq ;
3. replay sans IA de tous les anciens payloads S09 conservés ;
4. test bout en bout de chaque événement jusqu'à la publication et au dispatch, avec API GitHub simulée ;
5. test de portabilité/absence des sessions Claude entre stockages ;
6. validation automatique des budgets et marqueurs terminaux des réponses OpenAI ;
7. association des logs aux preuves historiques S09-H01 à S09-H11.

## Historique du registre

| Version | Date | Changement |
|---|---|---|
| 1.0.0 | 2026-09-07 | Reconstruction initiale S09→S10 depuis historique GitHub, commentaires, documents et contexte inter-conversations ; 38 incidents et 11 groupes de runs à instruire. |
