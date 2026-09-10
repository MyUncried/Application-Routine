# Rapport de changement — KODJO V2 `0.6.4` → `0.6.5` → `0.6.6` → `0.6.8`

| Métadonnée | Valeur |
|---|---|
| Origine | Revue indépendante Claude du paquet `0.6.4`, contre-analyse OpenAI, puis décision utilisateur de clôture de `MAJ-03` |
| Date | 2026-09-09 |
| Portée | 1 constat `BLOCKING`, 3 `MAJOR`, 6 `MINOR`. Aucun arbitrage d'architecture rouvert. |
| Vérification | 57 tests exécutés en local, 57 réussis dans une reconstruction fidèle du dépôt ; validation structurelle des deux workflows `OK` ; scanner `NO_REMOTE_FUNCTIONAL_WRITE_CAPABILITY` |
| Nouveaux scénarios de non-régression | `T02-PRES-013` à `T02-PRES-018`, plus trois tests d'encadrement (`MIN-01` × 2, `MIN-06`) |
| Reste `NON_VERIFIABLE` | Voir §6 |
| État d'activation | **Activation de V2 interdite** : `EVIDENCE_WRITER_ABSENT` |

> **Gouvernance.** Le paquet `0.6.5` a été relu par la contre-analyse OpenAI et le paquet `0.6.6` a reçu une décision utilisateur de clôture. La présente consolidation `0.6.8` a fait l'objet d'une vérification d'acceptation ciblée. Aucune nouvelle revue générale n'est requise avant le smoke test borné.

---

## 1. Correction bloquante

### `BLK-01` — le répertoire de travail du protocole contaminait le delta conservé

**Défaut.** Le workflow crée `delivery/` et les répertoires de téléchargement `source-recovery/` et `source-result/` **à l'intérieur du dépôt cloné**, alors que la suite de tests les plaçait systématiquement en dehors. Le patch étant fabriqué avec `git add -A -- :/`, les fichiers d'orchestration écrits avant la préservation — `delivery/adapter.json`, `delivery/integrity/*.json` — entraient dans `implementation.patch` et dans `modified-files.json`.

**Conséquence.** Le contrôle de périmètre échouait à chaque exécution réelle. `IMPLEMENTED_AND_VERIFIED` devenait inatteignable, la reprise ciblée relançait indéfiniment le même contrôle, et un patch restauré dans `/Dev` y aurait injecté un répertoire d'artefacts de protocole.

**Correction.**

- `scripts/kodjo/lib/delivery.js` : nouvelle fonction `patchExcludes()` qui calcule les pathspecs d'exclusion — le répertoire de livraison lorsqu'il est sous la racine du dépôt, les répertoires d'orchestration par défaut, et tout chemin déclaré par `KODJO_PATCH_EXCLUDE`. `buildPatch()` les applique à `git add`, à `git diff --cached` et à `--name-status`.
- Garde dure : un chemin d'orchestration présent malgré tout dans le delta lève `DELIVERY_DIR_IN_DELTA` et invalide la préservation. Un défaut de configuration ne peut plus produire silencieusement un delta faux.
- Traçabilité : `modified-files.json` et le manifeste portent désormais `excluded_pathspecs`.
- Workflow : déclaration de `KODJO_PATCH_EXCLUDE: source-recovery,source-result`.
- `scripts/kodjo/validate-workflows.js` : refus si `KODJO_PATCH_EXCLUDE` est absent, et refus de tout `download-artifact` dont le `path` n'est pas couvert par cette liste.
- Spécification §6.13-B : l'exclusion des répertoires d'orchestration devient normative.

**Preuve.** `T02-PRES-015` reproduit la disposition réelle du workflow — livraison et téléchargements dans le dépôt — et vérifie que le delta ne contient que `src/app.ts`, que `scope` passe, que le statut atteint `IMPLEMENTED_AND_VERIFIED`, et que la restauration ne crée aucun répertoire `delivery/`.

---

## 2. Corrections majeures

### `MAJ-01` — un échec du dépôt durable produisait un statut mensonger

**Défaut.** `uploaded_before_checks` était écrit à `true` en dur, sans consulter l'issue de l'étape de téléversement. Si celle-ci échouait, aucun contrôle ne s'exécutait, le statut devenait `IMPLEMENTED_WITH_FAILED_CHECKS` avec `recovery=TARGETED_FIX` — désignant un artefact source inexistant — et le noyau affichait « The recovery artifact was uploaded before the checks ». Le patch ne vivait alors plus que dans le workspace éphémère, jamais re-téléversé.

**Correction.**

- Workflow : nouvelle étape `recovery_upload_retry`, dépôt de secours déclenché uniquement si le premier a échoué, gardé par `always()` et placé avant tous les contrôles. Les contrôles acceptent désormais l'un ou l'autre dépôt.
- Workflow : `KODJO_RECOVERY_UPLOAD_OUTCOME` et les coordonnées du dépôt de secours sont transmis à la synthèse.
- `finalize-implementation-delivery.js` : la durabilité est un **fait observé**. `uploaded_before_checks` en découle, ainsi que `upload_outcome`, `fallback_used` et `fallback_outcome`.
- `lib/status.js` : nouvelle entrée `recoveryUploaded`. Un delta préservé et validé mais non déposé produit `IMPLEMENTATION_FAILED` avec le motif `RECOVERY_NOT_DURABLE`, conformément au §5.2-A — une préservation incomplète n'est pas un échec de contrôle.
- `exit-from-business-status.js` : le message final n'affirme plus un dépôt qui n'a pas eu lieu.
- `finalize` : le commentaire porte un champ explicite `recovery_artifact_uploaded`.
- `validate-workflows.js` : l'étape de secours est obligatoire et doit précéder les contrôles ; la synthèse doit recevoir `KODJO_RECOVERY_UPLOAD_OUTCOME`.
- Spécification §4.7 et §5.2-A : le téléversement est un fait observé, jamais présumé.

**Preuve.** `T02-PRES-013` (les deux dépôts échouent) et `T02-PRES-014` (le dépôt de secours réussit).

### `MAJ-02` — une reprise ciblée sans contrôles repris ne pouvait pas converger

**Défaut.** Le téléchargement de l'artefact de résultat source est facultatif et en `continue-on-error`. En son absence, les contrôles non relancés restaient `NOT_RUN` indéfiniment, et `IMPLEMENTED_AND_VERIFIED` devenait définitivement inatteignable : chaque reprise prescrivait une reprise identique.

**Correction.**

- `resolve-checks-to-run.js` : en mode `TARGETED_FIX`, si `KODJO_CARRIED_CHECKS_DIR` est absent ou vide, l'ensemble des contrôles requis est relancé, avec le diagnostic `CARRIED_CHECKS_UNAVAILABLE`.
- Workflow : l'étape `checks_plan` reçoit `KODJO_CARRIED_CHECKS_DIR`.
- `validate-workflows.js` : `checks_plan` doit exister et recevoir cette variable.
- Spécification §6.13-C : la règle de convergence devient normative.

**Preuve.** `T02-PRES-016` couvre le répertoire absent, le répertoire vide, et le retour à la sélection bornée dès que les contrôles repris sont présents.

### `MAJ-03` — contradiction normative sur la durabilité de l'artefact

**Défaut.** Le §4.5 déclarait l'artefact Actions « jamais preuve canonique unique » et le §18 le disait non autoritatif, alors que le §4.7 en faisait l'unique barrière de conservation et qu'aucune étape n'écrit sur la branche de preuves.

**Correction, documentaire.** Le §4.5 pose désormais une **exception unique, nommée et bornée** : sur le chemin distant éphémère, l'artefact de récupération est la copie unique du patch pendant sa fenêtre de rétention. Trois obligations l'encadrent — rétention au moins égale à la durée de la tranche, récupération obligatoire dans `/Dev` avant expiration, et `OUTPUT_NOT_RECOVERABLE` en cas d'expiration d'un artefact non récupéré. Le §18 est aligné.

---

## 3. Corrections mineures

| ID | Correction | Fichiers |
|---|---|---|
| `MIN-01` | Contrat de sortie de l'adaptateur : `0` terminé, `75` ambiguïté fonctionnelle → `CLARIFICATION_REQUIRED`, `78` précondition absente, autre → interrompu. Le statut `CLARIFICATION_REQUIRED` du §5.2-A cesse d'être inatteignable. | `run-implementation-agent.js`, spécification §6.13-B, test dédié |
| `MIN-02` | Versions alignées : schéma de livraison et `protocol_version` passent à `0.6.5`, comme la spécification et le workflow de référence. | `lib/delivery.js`, `finalize-implementation-delivery.js`, en-tête du workflow |
| `MIN-03` | L'arborescence du §4.4 inclut le troisième workflow. | spécification §4.4 |
| `MIN-04` | L'incident « T02 » reçoit un identifiant stable `INC-079` et son test `T-052` dans le registre, porté en `3.4.0`. Référencé depuis le §12. | registre, spécification §12 |
| `MIN-05` | Le statut et les contrôles échoués de la source sont lus dans le manifeste de **résultat** source, et non dans le manifeste de récupération qui, par construction, ne les porte pas. Origine tracée par `source_status_origin`. | `restore-source-artifact.js`, workflow |
| `MIN-06` | La validation normative sélectionne le workflow par **structure** — présence des étapes `preserve` ou `recovery_upload` — et non plus par nom de fichier. Un workflow renommé ou dupliqué n'y échappe plus. | `validate-workflows.js`, test dédié |

---

## 4. Corrections apportées au harnais de test

Deux défauts du harnais ont été corrigés. Ils n'affectaient pas le produit, mais ils masquaient `BLK-01` et `MAJ-01` :

1. le harnais ne propageait pas la sortie `agent_status` de l'adaptateur vers l'étape de préservation, contrairement au workflow. `GITHUB_OUTPUT` est désormais capturé et relayé ;
2. le magasin d'artefacts simulé était créé à côté du répertoire de livraison, donc potentiellement dans le dépôt sous test. Il est désormais créé hors du dépôt.

Le harnais reproduit également les nouvelles étapes du workflow : dépôt de secours, coordonnées transmises à la synthèse, issue du dépôt.

---

## 5. Inventaire historique du paquet intermédiaire `0.6.5`

Le tableau ci-dessous est conservé comme trace de l'étape `0.6.5`. Il ne décrit pas les noms de fichiers du paquet courant `0.6.8`, dont l'inventaire autoritatif figure dans `PACKAGE_MANIFEST.md`.

| Fichier | État |
|---|---|
| `primary/KODJO_PROTOCOL_V2_SPEC_0.6.5.md` | **remplace** la version `0.6.4` |
| `primary/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.5.yml` | **remplace** la version `0.6.4` ; identique au workflow exécutable hors en-tête |
| `evidence/workflows/kodjo-v2-implementation-artifact.yml` | modifié |
| `evidence/workflows/kodjo-v2-preservation-smoke.yml` | inchangé |
| `evidence/scripts/kodjo/lib/delivery.js` | modifié (`BLK-01`, `MIN-02`) |
| `evidence/scripts/kodjo/lib/status.js` | modifié (`MAJ-01`) |
| `evidence/scripts/kodjo/finalize-implementation-delivery.js` | modifié (`MAJ-01`, `MIN-02`) |
| `evidence/scripts/kodjo/exit-from-business-status.js` | modifié (`MAJ-01`) |
| `evidence/scripts/kodjo/resolve-checks-to-run.js` | modifié (`MAJ-02`) |
| `evidence/scripts/kodjo/run-implementation-agent.js` | modifié (`MIN-01`) |
| `evidence/scripts/kodjo/restore-source-artifact.js` | modifié (`MIN-05`) |
| `evidence/scripts/kodjo/validate-workflows.js` | modifié (`BLK-01`, `MAJ-01`, `MAJ-02`, `MIN-06`) |
| `evidence/tests/kodjo/t02-preservation.pilot.js` | 4 scénarios ajoutés |
| `evidence/tests/kodjo/adapter-guard.pilot.js` | 2 tests ajoutés |
| `evidence/tests/kodjo/helpers/pipeline.js` | modifié (fidélité au workflow) |
| `evidence/incidents/..._v3.4.0_CORRECTED.md` | **remplace** `v3.3.1` ; ajout d'`INC-079`/`T-052` |
| `evidence/t02/..._TEST_MATRIX_0.6.5.md` | **remplace** la version `0.6.3` ; 16 scénarios |
| `evidence/t02/..._CHANGE_REPORT_0.6.3.md` | inchangé (document historique) |
| `evidence/pilot/2026-09-08_...rev4.md` | inchangé (document historique) |
| `CHANGE_REPORT_0.6.5.md` | **nouveau** |
| `PROMPT.md` | **remplacé** par le prompt de la prochaine itération |

Aucun script, test ou workflow n'a été supprimé.

---

## 5 bis. Écarts introduits par la contre-analyse `0.6.6`

La contre-analyse a confirmé les dix constats. Elle a en revanche corrigé **trois traitements** retenus en `0.6.5`, sur des motifs fondés. Ces corrections sont appliquées ici.

### A. `BLK-01` — refuser, pas contourner

**Écart.** La `0.6.5` neutralisait le défaut par des exclusions de chemin, ce qui rendait acceptable une implantation invalide au lieu de la signaler.

**Correction `0.6.6`.**

- Le workflow résout `KODJO_DELIVERY_DIR`, `KODJO_SOURCE_RECOVERY_DIR` et `KODJO_SOURCE_RESULT_DIR` sous `${RUNNER_TEMP}`, dans une étape `orchestration_paths` placée immédiatement après le checkout — `runner.temp` n'étant pas disponible dans un `env` de job, il est publié via `$GITHUB_ENV`. Tous les chemins d'artefacts suivent.
- `preserve-implementation.js` **refuse** `DELIVERY_LOCATION_INVALID`, avant toute production, si le répertoire de livraison ou l'un des répertoires source se trouve dans la copie de travail.
- `validate-workflows.js` refuse l'absence de l'étape de résolution, une implantation figée dans l'environnement, et tout chemin d'artefact relatif à la copie de travail.
- Les exclusions de pathspec et la garde `DELIVERY_DIR_IN_DELTA` sont conservées, mais explicitement qualifiées de **défense secondaire** dans la spécification.

**Tests.** `T02-PRES-015` vérifie désormais le refus — plus l'exclusion silencieuse — et `T02-PRES-017` vérifie l'implantation nominale hors dépôt.

### B. `MAJ-03` — ne pas rouvrir l'arbitrage de stockage

**Écart, et il était réel.** La `0.6.5` amendait le §4.5 pour faire de l'artefact Actions la copie unique durable pendant sa rétention. C'était rouvrir l'arbitrage A du §16, déjà acté, qui fait de la branche de preuves le support canonique. La revue avait proposé deux options et n'aurait pas dû trancher pour celle qui touche un arbitrage fermé.

**Correction `0.6.6`.**

- Le §4.5 rétablit l'artefact Actions comme transport, **jamais** preuve canonique.
- Une sous-section « Writer de preuves distant » pose quatre règles cumulatives : séparation du job d'implémentation, droits limités aux objets protocolaires et à la branche de preuves, aucun fichier applicatif dans un commit de preuve, aucune application — celle-ci reste locale.
- L'absence de ce writer devient un **écart déclaré**, `EVIDENCE_WRITER_ABSENT`, inscrit au §18 et érigé en prérequis d'activation au §13.6. Les trois obligations d'exploitation intérimaires — rétention au moins égale à la tranche, récupération dans `/Dev` avant expiration, `OUTPUT_NOT_RECOVERABLE` à l'expiration — subsistent, mais comme mesures de contention d'un écart, non comme exception normative.

**Portée.** Le writer n'est **pas implémenté** : conformément à la règle « ne pas transformer le correctif ciblé en implémentation complète de V2 », il est spécifié et son absence est déclarée.

### C. `MIN-06` et `MIN-01` — précision plutôt qu'élargissement

- **`MIN-06`.** La détection purement structurelle de la `0.6.5` risquait des faux positifs. La `0.6.6` sélectionne par **type déclaré** — `KODJO_WORKFLOW_KIND` — et refuse en outre, sous `UNDECLARED_KODJO_WORKFLOW`, tout workflow non déclaré présentant la structure du workflow d'implémentation. Un workflow ordinaire ne déclenche rien.
- **`MIN-01`.** Le code de sortie `75` cesse d'être normatif. La spécification impose un **contrat structuré** — statut parmi `COMPLETED`, `CLARIFICATION_REQUIRED`, `INTERRUPTED`, accompagné de la question canonique le cas échéant — et la liaison par code de sortie n'est plus que celle de ce pilote, pour les adaptateurs qui ne déclarent rien. L'implémentation lit `adapter-status.json` en priorité et trace l'origine du statut dans `status_origin`.

### D. Traçabilité de la revue — corrections acceptées

1. **Décompte de fichiers.** La revue annonçait 44 fichiers ; le paquet en contient **45**. Le fichier omis est `PROMPT.md`, que j'avais exclu du décompte parce qu'il m'avait été transmis comme énoncé de mission. L'erreur est mienne, et le décompte correct est 45.
2. **« Réellement exécuté ».** La formulation était ambiguë. À lever partout : le workflow d'implémentation n'a **jamais** été exécuté sur GitHub Actions. Ce qui a été exécuté est le **harnais local**, qui reproduit le job étape par étape, complété par une validation structurelle du YAML livré. Ces deux niveaux ne valent pas exécution sur la plateforme.
3. **Code des simulations.** Les trois simulations conduites pendant la revue ne sont plus des vérifications ponctuelles : elles sont intégrées à la suite permanente sous `T02-PRES-013` à `T02-PRES-017` et inscrites à la matrice.
4. **Condition du `PASS`.** Les tests portent désormais sur la configuration réellement utilisée par le workflow : implantation hors dépôt, issue observée des étapes de dépôt, dépôt de secours. Un point subsiste et est déclaré au §6 : le comportement de `actions/upload-artifact` sur des chemins hors copie de travail n'a pas pu être vérifié en local.

---

## 5 ter. Clôture de `MAJ-03` par décision utilisateur — `0.6.8`

La décision arbitre définitivement le partage des rôles. Elle est reprise telle quelle dans la spécification, sans réinterprétation.

### Rôles fixés

| Support | Rôle |
|---|---|
| Artefact GitHub Actions | Barrière **immédiate** de récupération et transport **temporaire**. Jamais la preuve canonique définitive, ni par défaut, ni par expiration du writer |
| Branche `kodjo/protocol-evidence-v2` | Enregistrement durable du patch et de son manifeste, par le writer dédié |

### Le writer dédié — huit règles, portées au §4.5

Espace séparé du checkout fonctionnel ; aucun nom de branche en entrée ; cible exclusivement la branche fixe ; ajout d'objets protocolaires sous des chemins append-only prédéfinis ; aucune modification ni suppression d'une preuve existante ; aucune autorisation sur une branche fonctionnelle ; aucun fichier applicatif intégré dans un commit de preuve ; aucune application — le patch reste un objet de preuve et de transport, jamais un commit fonctionnel distant.

Le workflow d'implémentation reste en `contents: read`. Toute capacité d'écriture de preuves appartient exclusivement au writer séparé et doit être qualifiée avant l'activation de V2.

### Effet sur l'activation

`EVIDENCE_WRITER_ABSENT` n'est plus un écart négociable pour la durée du pilote : c'est une **interdiction d'activation de V2**. La `0.6.5` avait laissé la possibilité d'une acceptation par décision d'exploitation ; la `0.6.8` la retire. Le §13.6 et le §18 sont alignés, le §16 confirme explicitement l'arbitrage A, et le code de diagnostic `KODJO-V2-EVIDENCE-WRITER-ABSENT` entre au catalogue du §11.2.

### Point d'architecture résolu

La décision parle d'un writer « dédié ». Le §1.2 limite le protocole à trois workflows. Pour ne pas rouvrir cette limite, le writer est spécifié comme un **job dédié**, distinct de celui de l'implémentation, hébergé par `kodjo-v2-transition.yml` — auquel le §4.3 confie déjà la republication de preuves. La séparation exigée est bien assurée : job distinct, identifiants distincts, aucun checkout fonctionnel. Si tu préfères un quatrième workflow, c'est le §1.2 qu'il faut amender, et cela relève de toi.

### Ajout : la demande de dépôt de preuves

Le writer n'est pas implémenté, et il ne doit pas l'être dans une correction ciblée. Pour que son absence soit **observable** et non seulement documentée, le job d'implémentation — toujours sans le moindre droit d'écriture — produit une `EvidenceDepositRequest` jointe à l'artefact de résultat :

- `target_branch` fixe, `target_branch_is_fixed: true` : la branche n'est pas paramétrable et ne vient d'aucune entrée ;
- chemins canoniques append-only dérivés de la seule identité protocolaire — `slices/<slice>/operations/<operation>/attempts/<attempt>/implementation/<membre>` ;
- hash réel de chaque membre, `implementation.patch` marqué `TRANSPORT_AND_EVIDENCE` ;
- `contains_applicative_file: false`, `functional_ref_write_allowed: false`, `replaces_existing_path: false` ;
- `produced_by: IMPLEMENTATION_JOB_READ_ONLY`, `deposited_by: SEPARATE_EVIDENCE_WRITER` ;
- `writer_status: PENDING`, `diagnostic: EVIDENCE_WRITER_ABSENT`.

Cette demande **décrit** ce qui doit être déposé ; elle ne dépose rien et ne confère aucune capacité. La validation structurelle refuse par ailleurs qu'un job du workflow d'implémentation élève `contents` ou tente d'écrire une référence de preuves.

**Test.** `T02-PRES-018` vérifie chacun de ces points, ainsi que `contents: read` à tous les niveaux du workflow.

---

## 6. Ce qui reste `NON_VERIFIABLE`

Les corrections **ne changent rien** au périmètre de preuve. Restent non vérifiables, exactement comme en `0.6.4` :

1. le run GitHub `34286251097` et les artefacts associés ;
2. l'exécution du workflow d'implémentation sur GitHub Actions réel, y compris les nouvelles étapes — le dépôt de secours n'a jamais tourné sur la plateforme ;
3. le comportement d'un adaptateur d'implémentation réel. Le dispositif empêche le push fonctionnel, borne les permissions et détecte les mutations Git ; il ne démontre pas qu'un adaptateur réel serait incapable de créer un **commit local éphémère** en contournant le wrapper Git. L'invariant strict — aucune référence fonctionnelle durable créée ou poussée à distance — reste tenu par les permissions et l'absence d'identifiants ;
3 bis. le comportement de `actions/upload-artifact` et `download-artifact` sur des chemins situés hors de la copie de travail, choix retenu en `0.6.6` et vérifiable uniquement sur la plateforme ;
3 ter. le writer de preuves dédié, spécifié et non implémenté. Ce n'est plus un simple écart : tant qu'il n'est pas qualifié, l'activation de V2 est interdite. Seul un pilote technique borné de conservation et de reprise reste possible ;
4. l'exécution des commandes de contrôle du dépôt applicatif ;
5. la quasi-totalité du protocole spécifié : moteur, machine à états, branche de preuves, contrats, idempotence, coupe-circuit, mode manuel, adaptateurs IA, indépendance des revues, coexistence V1/V2.

Le paquet implémente une barrière de conservation, pas le protocole complet. Cette phrase reste vraie en `0.6.8`.

---

## 7. Conditions de démarrage du pilote

Les cinq conditions obligatoires de la revue sont traitées. Restent à faire, avant le premier cycle complet :

1. exécuter au moins une fois le workflow d'implémentation complet sur GitHub Actions, en mode `IMPLEMENT` avec l'adaptateur `none` et un périmètre configuré, conserver les logs, et **vérifier en premier lieu que les téléversements et téléchargements fonctionnent sur des chemins hors copie de travail** ;
2. exécuter une fois le chemin `TARGETED_FIX` sur la plateforme ;
3. faire relire ce paquet par un contexte distinct de celui qui l'a corrigé ;
3 bis. implémenter et qualifier le writer de preuves dédié — c'est désormais un prérequis d'activation, et non une décision d'exploitation ;
4. maintenir le périmètre annoncé : pilote de **conservation et de reprise**, pas d'implémentation. L'intégration d'un adaptateur réel est une étape ultérieure, avec sa propre qualification.
