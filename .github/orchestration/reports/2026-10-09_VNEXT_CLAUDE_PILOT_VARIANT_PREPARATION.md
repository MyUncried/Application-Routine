# VNext — Préparation de la variante de pilotage Claude Code (premier usage prévu : PRE-4)

| Champ | Valeur |
|---|---|
| Identifiant | `VNEXT_CLAUDE_PILOT_VARIANT_PREPARATION` |
| Date | 2026-10-09 |
| Type | Développement protocole sur branche dédiée, non fusionné, non activé |
| Branche | `protocol/vnext-claude-pilot-variant-20261009` |
| Commit de départ | `1ddfb6d144552f578388257adc78db47ab5992c8` (`main`, registre final VNext après #339) |
| Diagnostic d’origine | `2026-10-08_VNEXT_CLAUDE_PILOT_TRANSFER_DIAGNOSTIC.md`, branche locale `docs/vnext-claude-pilot-transfer-diagnostic-20261008` (`117183c0`) |
| Statut | `IMPLEMENTATION_READY_FOR_REVIEW`, en attente de validation de Hermann |

## 1. Demande

Instruction de Hermann du 2026-10-09 :

- préparer la variante de pilotage Claude Code pour un premier usage sur PRE-4 ;
- PRE-3 reste piloté par ChatGPT jusqu’à sa livraison finale : aucun transfert, aucune intervention, aucune modification du pilotage global qui l’affecterait ;
- réutiliser le moteur VNext, préserver les validations de Hermann et la revue indépendante, permettre un retour à ChatGPT ;
- le démarrage de PRE-4 fera l’objet d’une instruction explicite après la clôture de PRE-3.

## 2. Périmètre réellement traité

| Liste | Éléments |
|---|---|
| **CHANGE** (ajouts uniquement) | `scripts/kodjo/lib/vnext-pilot-designation.js`, `scripts/kodjo/claude-pilot.js`, `tests/kodjo/vnext-claude-pilot.pilot.js`, `.github/orchestration/KODJO_VNEXT_CLAUDE_PILOT_VARIANT.md`, ce rapport |
| **PRESERVE** (octets inchangés, vérifiés par `git diff --stat 1ddfb6d1`) | `vnext-chain.js` et `lib/*` existants, `finalize-vnext-delivery.js`, `verify-source-comment.js`, tous les workflows, `AI_ORCHESTRATION*.md`, `CLAUDE.md`, `vnext-cutover/*`, registres, `comment-routes.json`, sources applicatives |
| **FORBIDDEN** (non touchés) | PRE-3 : issue #340, branche `plan/pre3-vnext-20261008`, ses fichiers et opérations ; automations ChatGPT ; workflows et runs ; fusion sur `main` ; push |

## 3. Conception

- **Activation tranche par tranche** : sans `v2-slices/<SLICE>/pilot-designation.json` committé, le pilote reste `CHATGPT_WORK`. Aucune tranche existante ne change de comportement.
- **Exclusion de PRE-3 en dur** : l’issue 340 et tout identifiant de tranche se terminant par `PRE-3` sont refusés. Seules les tranches routées `VNEXT` sont admises.
- **Un seul pilote actif** : la chaîne de désignations, à laquelle on ne fait qu’ajouter, est lue au HEAD committé. Elle doit être continue, chaque entrée étant autorisée par un commentaire exact de MyUncried **publié directement**, pas par le connecteur ChatGPT, et liée à un commit de checkpoint ancêtre de HEAD.
- **Moteur inchangé** : `claude-pilot.js run` vérifie la désignation, puis appelle `vnext-chain.js` avec les mêmes arguments.
- **Revue indépendante** :
  - avant `reserve-gate` et `request-approval`, le script exige une revue ChatGPT, publiée via le connecteur et vérifiée par le nom de l’app, liée au `prepared_chain_hash` exact, avec `verdict=APPROVE` ;
  - la revue finale ChatGPT de `finalize-vnext-delivery.js` est conservée telle quelle.
- **Validations de Hermann** : le 👍 de gate, les arbitrages et les désignations restent à lui. Les scripts de la variante n’ont aucune capacité d’écriture GitHub, ce que vérifie un test statique.
- **Retour à ChatGPT** : une nouvelle entrée `to_pilot=CHATGPT_WORK`, après quoi le script refuse toute étape. Les gardes existantes empêchent de rejouer les opérations : scan distant de `reserve-gate`, tag `kodjo-consumed/*`, `REUSED_EXISTING_CLOSURE`.

## 4. Tests

| Commande | Résultat |
|---|---|
| `node --test tests/kodjo/vnext-claude-pilot.pilot.js` | **8/8 PASS** |
| `node scripts/kodjo/scan-remote-write-capability.js` | **PASS** : `NO_UNDECLARED_REMOTE_WRITE_CAPABILITY`, 243 fichiers analysés |
| `node scripts/kodjo/test-vnext.js --concurrency=8` (branche, Windows local, 7 min 49 s) | 462 tests : **457 PASS, 5 FAIL**, 0 skip |
| Les 3 fichiers contenant les 5 échecs, rejoués sur `main` pur `1ddfb6d1` (worktree temporaire supprimé ensuite) | **Mêmes 5 FAIL**, 14 PASS |
| `node scripts/kodjo/validate-orchestration-paths.js` | Non applicable hors workflow : `KODJO_DELIVERY_DIR is missing` |

Couverture des 8 tests :

1. Défaut ChatGPT et refus du pilote Claude sans désignation.
2. Désignation valide ; une modification non committée est ignorée.
3. Autorisation refusée si elle passe par le connecteur, vient d’un autre login, a un texte inexact, vise une autre issue ou un commentaire absent.
4. Retour à ChatGPT ; refus d’une chaîne discontinue et d’un checkpoint non ancêtre.
5. Exclusion de PRE-3 par identifiant et par issue 340 ; refus d’une tranche LEGACY.
6. Revue indépendante : absente, sans app, mauvais hash, `REVISE`, champ manquant, ligne dupliquée. Le moteur ne s’exécute jamais avant la garde, et les arguments lui sont transmis à l’identique.
7. Texte exact de désignation.
8. Absence statique de toute écriture GitHub ou Git dans les scripts de la variante.

**Analyse historique des 5 échecs** (règle du 6 octobre) :

- Tests concernés : `vnext-transport-security` (parseur de workflows), `vnext-candidate-source` (×2), `vnext-campaign-sequence` (×2, dont l’analyse PowerShell).
- Identiques sur `main` sans les modifications : **l’introduction par cette branche est démontrée absente**.
- Cause **plausible** et non démontrée : Python et `pwsh` sont introuvables dans ce shell local (vérifié), alors que ces tests utilisent le parseur Python des workflows et PowerShell.
- Les qualifications distantes Linux/Windows récentes en vert sur `main` n’ont pas été relancées, conformément à l’instruction : aucune qualification.
- Vérification ciblée proposée : rejouer ces 3 fichiers dans un environnement disposant de Python et `pwsh`, ou dans la CI de la PR le moment venu.

Le nouveau fichier `vnext-claude-pilot.pilot.js` correspond au motif de `test-vnext.js` : il fera partie du périmètre VNext une fois fusionné. Ce n’est pas un problème pour PRE-3 tant que la fusion attend sa clôture.

## 5. Plan restant (soumis à validation)

1. **Revue** de cette branche par Hermann et revue indépendante ChatGPT du diff (relecteur, pas pilote).
2. **Push et PR** de la branche, uniquement sur instruction. La création de branche déclenche `KODJO VNext proof stability and architecture` sur l’événement `create` ; c’est la raison pour laquelle rien n’a été poussé.
3. **Fusion sur `main` après la clôture de PRE-3** uniquement, CI de PR verte, ce qui couvre aussi les 5 tests dépendants de l’environnement.
4. **Démarrage de PRE-4** sur instruction explicite :
   - activation VNext de la tranche ;
   - commentaire de désignation posté par Hermann ;
   - commit de `pilot-designation.json` ;
   - `claude-pilot.js status`.

   Premier usage réel = première preuve de la variante. Aucun parcours jetable n’est prévu.

## 6. Hypothèses non démontrées

- Commentaire posté sur le web ou via `gh` avec le jeton de Hermann : GitHub ne fait pas la différence. Le refus pour Claude est organisationnel, et la variante n’a aucune capacité d’écriture.
- ChatGPT, appelé en relecteur, publiera la revue de plan au format exact attendu : c’est à démontrer au premier usage sur PRE-4.
- Le partage de `C:\Users\hadjo\.claude` entre la session pilote interactive et le runner pourrait perturber la session OAuth du runner. Ce point a été relevé dans le diagnostic du 8 octobre, sans lien causal démontré.

## 7. Non traités / hors périmètre

- Aucune modification des normes globales `AI_ORCHESTRATION*.md` : un renvoi vers la variante pourra être ajouté après la clôture de PRE-3, sur décision.
- Pas de réveil automatique de Claude : reprise manuelle, routine Claude Code non configurée.
- Le run V2 en file `34748621746` et les automations ChatGPT ne sont pas touchés.

## 8. Vérifications sur appareil réel

Aucune : changement de protocole sans effet applicatif.

## 9. Fichiers modifiés

- `.github/orchestration/KODJO_VNEXT_CLAUDE_PILOT_VARIANT.md` (nouveau)
- `.github/orchestration/reports/2026-10-09_VNEXT_CLAUDE_PILOT_VARIANT_PREPARATION.md` (nouveau)
- `scripts/kodjo/claude-pilot.js` (nouveau)
- `scripts/kodjo/lib/vnext-pilot-designation.js` (nouveau)
- `tests/kodjo/vnext-claude-pilot.pilot.js` (nouveau)

## 10. Commit final et état Git

Branche locale `protocol/vnext-claude-pilot-variant-20261009`, **non poussée**. Le hash du commit et l’état final sont communiqués dans la réponse de clôture.
