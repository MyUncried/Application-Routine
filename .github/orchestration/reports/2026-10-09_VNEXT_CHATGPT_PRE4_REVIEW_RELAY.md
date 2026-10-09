# Mission VNEXT_CHATGPT_PRE4_REVIEW_RELAY

## Objectif, baseline et périmètre

Demande utilisateur du 9 octobre : modifier VNext piloté par ChatGPT pour PRE-4 et laisser Claude modifier sa variante séparément. Baseline main : `aaa5d495b0b4b3c1fec51ad3255450e565ea7880` (#343). Branche : `protocol/vnext-chatgpt-pre4-relay-20261009`.

La livraison précédente `9947f522` avait été ajoutée à #344, mauvaise cible pour cette demande. Cette mission ne modifie, ne retire et ne fusionne aucun contenu de #344. Elle part de main avec ses correctifs de volume #342 et de clarification #343. PRE-3 est exclu ; aucun fichier applicatif, dossier PRE-3, activation, demande réelle ou budget n'est modifié.

## Diagnostic avant correction et limites historiques

Le workflow historique de revue V2 existe au commit `675252149dff35de7c7e33561167386ddb28a25a` (dernière modification retrouvée dans l'historique local). VNext dispose déjà de `review`, `recover-review`, réponse conservée et validation du reçu dans `vnext-live-chain.js`. La dernière modification de son CLI retrouvée est `877cbce79bce03bdd0ef59f4782e0b3c5b4f027a` (transport borné). La baseline comporte ces mécanismes mais aucune entrée de production PRE-4 permettant de publier une demande puis récupérer automatiquement la revue depuis ChatGPT.

Constat démontré par le code : raccordement absent, reviewer existant à réutiliser. Attribution de la régression historique rapportée par l'utilisateur : indéterminée. La dernière preuve réelle comparable et le premier échec de transfert ne sont pas établis par cette mission ; aucun run V2 ou jetable n'est présenté comme succès de PRE-4. Le diagnostic local non publié du 8 octobre n'a pas été utilisé.

## Modification réalisée

- Workflow distinct, déclenché par l'ajout exclusif d'une demande sur main ; dispatch de récupération conservé. Permissions uniquement de lecture et artefacts Actions.
- Demande fermée/scellée, pilote ChatGPT, tranche PRE-4, commit et dossier exacts ; lecture Git compatible avec les bundles bornés.
- Code du protocole issu de main et données issues du commit immuable ; runner/checkout/ascendance/Issue/PRE-3 revalidés avant appel.
- Revue existante en session distincte et lecture seule, même authentification et mêmes limites ; aucune API IA ajoutée.
- Reprise à partir du reçu ou de la réponse sauvegardée ; intent exclusif et verrou Claude existant ; cache perdu/tentative ambiguë refusés sans appel supplémentaire.
- Résultat et diagnostic publiés en artefacts, vérification du reçu par ChatGPT avant consommation ; REVISE n'est pas une approbation.
- Extension opératoire destinée au pilote, sans commande ni transfert technique confié à l'utilisateur.

## Validation

`node --test tests/kodjo/vnext-chatgpt-plan-review.pilot.js` : 10 PASS, 0 FAIL. Adaptateurs de reviewer, GitHub et verrou injectés ; aucun appel IA. Scénarios : portée, préconditions, dossier périmé, concurrence, demande en doublon, republication, interruption après réponse, quota/tentative inconnue, refus et résultat périmé, causalité obligatoire, structure du workflow cache perdu et lecture de bundles Git épinglés (édition locale ignorée, part committée corrompue refusée).

`node --check scripts/kodjo/chatgpt-plan-review.js` : PASS.
`node scripts/kodjo/validate-workflows.js` : PASS (validation locale de structure/syntaxe).
`node scripts/kodjo/scan-remote-write-capability.js` : PASS, NO_UNDECLARED_REMOTE_WRITE_CAPABILITY (244 chemins V2, scanner partagé des nouveaux producteurs).
`git diff --check` : PASS.

Aucun lancement manuel de CI, qualification globale, test jetable, parcours PRE-3 ou reviewer réel. La CI habituelle de la PR peut se déclencher automatiquement. Les tests locaux du relais ne prouvent pas l'authentification Claude du runner, le déclenchement push réel, le téléchargement des artefacts ni la conformité complète d'un dossier PRE-4.

## Non traité et vérifications restantes

Après clôture de #340, fusion autorisée du protocole et instruction PRE-4 : constater la première demande réelle, l'appel Claude, la consommation du reçu par ChatGPT et la reprise de publication. Aucun réveil automatique de conversation ajouté. Le développement, la revue d'implémentation et la clôture restent sur les mécanismes existants et ne sont pas requalifiés ici. Aucun contrôle sur appareil ou contrôle visuel ne s'applique à cette modification du transport.

## Fichiers et livraison

- `.github/workflows/kodjo-vnext-chatgpt-plan-review.yml`
- `scripts/kodjo/chatgpt-plan-review.js`
- `tests/kodjo/vnext-chatgpt-plan-review.pilot.js`
- `.github/orchestration/KODJO_VNEXT_CHATGPT_PRE4_REVIEW_RELAY.md`
- `.github/AI_ORCHESTRATION_CONTINUITY.md` : raccordement normatif limité PRE-4.
- `.github/orchestration/PACKAGE_MANIFEST.md` : inventaire additif.
- Le présent rapport.

Livraison en PR brouillon séparée, sans fusion ni activation. Le commit final contenant ce rapport est la tête de cette PR, identifiée dans la réponse de livraison ; le hash du rapport lui-même ne peut contenir son propre commit. L'état Git final est contrôlé après publication.
