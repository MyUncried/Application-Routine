# KODJO VNext — Variante de pilotage Claude Code

Statut : **préparée, non activée**. Instruction utilisateur du 2026-10-09 : premier usage prévu sur PRE-4, démarrage uniquement sur instruction explicite après la clôture de PRE-3.

## 1. Portée

- La variante est **optionnelle, tranche par tranche**. Une tranche sans désignation committée reste pilotée par ChatGPT ; le pilotage global, `AI_ORCHESTRATION.md` et `AI_ORCHESTRATION_CONTINUITY.md` sont inchangés.
- **PRE-3 est exclu** jusqu’à sa livraison finale : l’issue #340 et tout identifiant de tranche se terminant par `PRE-3` sont refusés (`PILOT_VARIANT_SLICE_EXCLUDED`). Lever cette exclusion exige une modification revue du code.
- Seules les tranches routées `VNEXT` sont admises (`PILOT_VARIANT_REQUIRES_VNEXT_SLICE`).
- Le moteur VNext (`vnext-chain.js`, contrats, gates, file, clôture) est réutilisé **sans modification**. Le pilote Claude l’appelle uniquement à travers `scripts/kodjo/claude-pilot.js`.

## 2. Rôles dans la variante

| Rôle | Acteur |
|---|---|
| Pilote (orchestration, préparation, appels des étapes du moteur, checkpoints, rapports) | Claude Code, session interactive désignée |
| Revue de plan par le moteur (stade `review`) | Claude CLI restreint en lecture seule (inchangé) |
| **Revue indépendante du plan**, avant tout gate propriétaire | ChatGPT via `chatgpt-codex-connector`, en relecteur et non en pilote |
| **Revue indépendante finale** de l’implémentation | ChatGPT via le connecteur (`finalize-vnext-delivery.js`, chemin `CONNECTOR_TECHNICAL_REVIEW`, inchangé) |
| Désignation du pilote, arbitrages, 👍 `USER_APPROVAL_REQUIRED` | Hermann exclusivement |

Le pilote ne peut pas être son propre relecteur indépendant.

## 3. Désignation du pilote

Fichier committé : `.github/orchestration/v2-slices/<SLICE>/pilot-designation.json` (schéma `kodjo.vnext.pilot-designation.v1`). C’est une chaîne de désignations, à laquelle on ne fait qu’ajouter :

```json
{
  "schema_version": "kodjo.vnext.pilot-designation.v1",
  "slice_id": "<SLICE>",
  "issue_number": 0,
  "designations": [
    { "sequence": 1, "from_pilot": "CHATGPT_WORK", "to_pilot": "CLAUDE_CODE",
      "checkpoint_commit": "<sha40>", "authorization_comment_id": "<id>",
      "recorded_at": "<ISO-8601>", "open_operations": ["<run id, gate_ref, request_id…>"] }
  ]
}
```

Le pilote courant est le `to_pilot` de la dernière entrée. Il n’est accepté que si les conditions suivantes sont toutes réunies :

- le fichier est lu au **HEAD committé**, une modification locale n’a aucun effet ;
- la séquence est continue et chaque `from_pilot` est égal au `to_pilot` précédent, la première entrée partant de `CHATGPT_WORK` ;
- `checkpoint_commit` est un ancêtre de HEAD : les artefacts du pilote sortant sont donc committés ;
- chaque `authorization_comment_id` désigne, sur l’issue de la tranche, un commentaire de **MyUncried publié directement**, sans `performed_via_github_app`, donc pas par le connecteur ChatGPT. Son texte est exactement celui-ci :

```
[KODJO_PILOT] DESIGNATE
slice_id=<SLICE>
sequence=<n>
from_pilot=<pilote sortant>
to_pilot=<pilote entrant>
checkpoint_commit=<sha40>
```

`node scripts/kodjo/claude-pilot.js designation-body <SLICE> <CLAUDE_CODE|CHATGPT_WORK> <sha40>` produit ce texte. **Claude ne publie jamais ce commentaire** : Hermann le poste lui-même.

Limite connue : GitHub ne distingue pas un commentaire posté par Hermann sur le web d’un commentaire posté via `gh` avec son jeton. L’interdiction faite à Claude est donc une règle organisationnelle. Le script `claude-pilot.js` n’a de son côté aucune capacité d’écriture GitHub, ce que vérifie un test.

## 4. Garde du pilote Claude

`node scripts/kodjo/claude-pilot.js run <SLICE> [--independent-plan-review=<comment_id>] <étape> <config> [sortie]`

1. Le script refuse l’exécution si le pilote désigné n’est pas `CLAUDE_CODE` (`PILOT_NOT_DESIGNATED`).
2. Il refuse toute étape absente de la liste du moteur (`PILOT_STAGE_INVALID`).
3. Pour `reserve-gate` et `request-approval`, il exige une revue indépendante du plan (`PILOT_INDEPENDENT_PLAN_REVIEW_REQUIRED`). Cette revue est un commentaire MyUncried publié via `chatgpt-codex-connector` sur l’issue de la tranche. Il commence par `[KODJO_VNEXT] INDEPENDENT_PLAN_REVIEW` et porte, chacune exactement une fois, les lignes `slice_id=`, `prepared_chain_hash=<contract_hash du dossier préparé>`, `reviewer=ChatGPT`, `verdict=APPROVE` et `human_review_performed=false`.
4. Il recherche les commentaires de revue directement dans GitHub, avec pagination complète. Le commentaire authentifié le plus récemment modifié pour la tranche et le hash exact fait autorité : un refus ou une réponse invalide interdit de réutiliser un ancien APPROVE. L'option `--independent-plan-review` reste compatible mais refuse un identifiant supersédé ; elle n'est plus nécessaire.
5. Il appelle ensuite `vnext-chain.js` avec les arguments transmis à l’identique.

`status <SLICE>` affiche le pilote courant, en lecture seule.

## 5. Règles du pilote Claude

- Il n’ajoute jamais de réaction et ne publie jamais de commentaire d’approbation sur un `USER_APPROVAL_REQUIRED`. Il ne publie aucune désignation. Il ne déclenche aucun workflow sans instruction.
- Il commite les artefacts locaux du moteur (`.intent.json`, `.response.json`, reçus de revue, transport finalisé, `evidence_directory`) sur la branche de la tranche avant tout transfert. Il ne rejoue jamais `finalize-transport` lorsqu’un transport existe pour le même dossier préparé.
- Il est réveillé à la main : Hermann ouvre Claude Code et écrit « Reprends le protocole KODJO. ». La reprise repart du checkpoint et du delta publiés. Aucune continuité de session n’est supposée, et aucun polling n’est fait.
- Les instructions des 6 et 7 octobre restent applicables : `DIRECT_REAL_USER_REQUEST`, aucun parcours jetable ni navigateur, diagnostic historique avant tout correctif. Le rapport de mission reste obligatoire.

## 6. Transfert et retour

**Prise de pilotage par Claude** (exemple PRE-4) :

1. La tranche est sur une barrière stable et aucun run lié n’est `in_progress`.
2. ChatGPT, s’il a piloté la tranche, publie son checkpoint et commite ses artefacts. Hermann désactive les automations ChatGPT de la tranche et relève l’état affiché dans ChatGPT.
3. La désignation `sequence=n` est préparée : texte produit par `designation-body`, puis commentaire posté par Hermann.
4. L’entrée correspondante est ajoutée à `pilot-designation.json`, avec `open_operations` et l’état des automations relevé, puis committée.
5. Claude contrôle avec `status`, puis revalide branche, HEAD, checkpoint, delta, fraîcheur, mode et écrivain avant toute action.

**Retour à ChatGPT** : même procédure, avec `to_pilot=CHATGPT_WORK`. Dès que l’entrée est committée, `claude-pilot.js` refuse toute nouvelle étape. ChatGPT reprend depuis le checkpoint et doit prouver le rattachement de son réveil (PE-09). Les opérations déjà exécutées ne sont pas rejouées : les commentaires de gate sont réutilisés grâce au scan distant de `reserve-gate`, les `request_id` sont consommés une seule fois (tag `kodjo-consumed/*`), la clôture est réutilisée (`REUSED_EXISTING_CLOSURE`), et les artefacts sont committés.

## 7. Activation

Cette variante ne doit pas être fusionnée sur `main` avant la clôture de PRE-3. Les approbations VNext portent sur une tête de protocole (`protocol_head`). Si la branche de PRE-3 se resynchronisait avec `main` après la fusion, ses gates en cours deviendraient périmés (`VNEXT_HANDOFF_APPROVAL_STALE`) : c’est un risque plausible, non démontré, évité en retardant la fusion. Le premier usage, sur PRE-4, exige une instruction explicite de Hermann.

Rapport de préparation : `.github/orchestration/reports/2026-10-09_VNEXT_CLAUDE_PILOT_VARIANT_PREPARATION.md`.

## 8. Passage de relais sans transfert de rapport — PRE-4 (#345)

Le changement de pilote ne supprime pas les revues ChatGPT du plan et de la livraison. Il ne fournit pas de mécanisme de réveil automatique d'une conversation ChatGPT. Ne pas confondre demande publiée, revue effectuée, résultat récupéré et reprise du pilote.

### Plan

1. Claude conserve et publie les artefacts sur la branche de tranche autorisée avant le transfert.
2. `plan-review-request-body <SLICE> <reserve-gate|request-approval> <config>` produit une demande portant le commit et le chemin du dossier préparé, son hash exact et l'acteur attendu. Le dossier doit être committé et son intégrité est contrôlée. Cette commande n'écrit pas dans GitHub.
3. Le pilote publie cette demande sur l'issue de tranche via le transport déjà autorisé, sans solliciter Hermann pour en recopier le texte. Il réutilise une demande existante pour le même dossier plutôt que d'en créer une nouvelle. Si ce transport n'est pas disponible, il enregistre un défaut d'orchestration, sans prétendre à un réveil automatique.
4. Lors d'une reprise ChatGPT, la demande et le dossier sont lus directement dans GitHub. ChatGPT réalise la revue en relecteur, publie les constats et le verdict au format de la section 4, puis laisse le pilotage à Claude. Une demande seule ne prouve ni la couverture ni une approbation.
5. `plan-review-status` retrouve la revue sans identifiant fourni par Hermann. Absence de revue : `WAITING_FOR_INDEPENDENT_PLAN_REVIEW`, avec lien de l'issue et `next_actor=CHATGPT_REVIEWER`. Le pilote conserve cet état dans son checkpoint ; aucune relance IA ni polling ne sont ajoutés.
6. Après APPROVE, `run ... reserve-gate` / `request-approval` récupère directement la revue depuis GitHub avant d'appeler le moteur. Toute modification du dossier impose une revue de son nouveau hash.

Si les conversations sont inactives, un message court de reprise peut encore être nécessaire dans chacune ; aucun rapport, JSON, SHA ou commande ne doit être transporté par l'utilisateur. La désignation directe du pilote et le 👍 du gate restent les validations explicitement conservées dans cette variante ; le présent ajout ne les transforme pas en autorisations automatiques.

### Livraison et autres étapes

Claude publie la livraison, les résultats des tests, les reçus et le checkpoint dans GitHub. ChatGPT lit les références publiées et y dépose sa revue finale. Claude récupère le commentaire et prépare le manifeste de finalisation lui-même ; aucun copier-coller du rapport par Hermann. Les gardes de `finalize-vnext-delivery.js` restent inchangées. Ce parcours est prescrit mais n'est pas qualifié par les tests du relais de plan.

### Limites avant PRE-4

- Aucun réveil automatique de ChatGPT ou de Claude n'est implémenté ; aucune API facturée ni automation n'est ajoutée.
- La variante a été réconciliée avec `main` `9c6ff9fa` (#342). Les lecteurs du pilote utilisent désormais `vnext-file-bundle`, y compris pour les parts lues au commit Git exact. Les tests couvrent le dossier découpé et le refus des parts corrompues ; ils ne prétendent pas réexécuter le dossier PRE-3 de plusieurs centaines de Mo.
- La qualification réelle des deux publications de revue et de leur reprise appartient au premier usage autorisé ; les tests locaux du relais ne constituent pas cette preuve.
