# 2026-10-04 — V2-PRE-2 : correction après recette iPhone (rapport d'état, mission bloquée)

## Identifiant et objectif

- Mission : `V2-PRE-2-RECETTE-REVISION`.
- Objectif : traiter le retour de recette iPhone du propriétaire sur la livraison #303, sans `VISUAL_APPROVED` ni finalisation :
  - consigner la décision D-265 (bornes 0..60 s des défauts de Séance du Profil) ;
  - corriger les écarts justifiés au contrat par le chemin V2 ;
  - livrer sur Routine Dev.

## Branche et commit de départ

- `main` au début de la mission : `d5de8a7f`.
- Livraison retenue : PR #303, branche `kodjo/v2-v2-pre-2-37178165890`, tête `10ac761ef453f360110bf7b668b3998487b071b3`.
- Revue d'implémentation : 5976789183, APPROVE, `device_gate_required=true`.

## Périmètre demandé

Points 1 à 11 du retour de recette :
- Profil : défilement, marge basse, accès à Modifier le profil, présentation ;
- bornes 0..60 s ;
- palette Catégorie et Étiquette ;
- pastille de Catégorie ;
- rafraîchissement des Zones ;
- Étiquette ;
- garde de sortie ;
- preuves non visibles à l'écran ;
- VoiceOver ;
- livraison et checklist.

## Périmètre réellement traité

1. **État vérifié au départ.** #303 seule livraison retenue, aucune correction engagée, seul run actif le run fantôme 34748621746 du 13/09.
2. **Qualification complète des observations.** Registre `.github/orchestration/v2-slices/V2-PRE-2/recette-2026-10-04.md` (PR #305, fusion `7a51179f`).
3. **Arbitrage du propriétaire.**
   - D-265 limitée aux valeurs par défaut du Profil ; Composition inchangée, PRE-4.
   - Valeurs supérieures à 60 s conservées sans plafonnement.
   - D-265 à D-267 consignées. Sources actualisées : 07 (D-089 amendée), 13 (CE-UI-07 §5, §9, §14 ; R-02), 08 (PR #304, fusion `8710c3af`).
4. **Chemin V2 établi.**
   - Une `VISUAL_CORRECTION` serait refusée à l'admission (`verify-authorizations.js` 289–297, tête de #303 différente de la `scan_revision` du plan).
   - Elle ne clôt pas une tranche et ne porte pas un changement de contrat.
   - Chemin retenu : révision de plan `START_PLAN_REVISION` sur la PR #303 existante, avec les défauts justifiés dans le même cycle.
5. **Révision publiée et relancée une fois.**
   - Commande 5978226685, puis reprise unique 5978253884.
   - Les deux runs de planification ont échoué à la validation déterministe de la sortie du modèle.

## Constats

| Point | Qualification | Suite prévue |
|---|---|---|
| R1 Profil | Écart au contrat : pas de `ScrollView`, barre de navigation en surimpression, aucun bloc Identité ni accès à Modifier en vue | Révision |
| R2 Bornes | Décision D-265 | Révision |
| R3 Libellé et séparateurs | Décisions D-266 et D-267 | Révision |
| R4 Palette Catégorie et Étiquette | Écart au contrat : surcouche absolue qui masque les actions, clavier non géré | Révision |
| R5 Pastille de Catégorie dans l'éditeur | Écart préexistant (PRE-1) au regard de C09 926 et de Figma 6407:9702 | Révision |
| R6 Rafraîchissement des Zones | Écart introduit par PRE-2 | Révision |
| R7a Nom de l'Étiquette en Composition | Écart au contrat | Révision |
| R7b Bleu sans Étiquette | Non défaut : sources muettes, aucune couleur stockée | Aucune |
| R8 Retour sans avertissement depuis l'éditeur du Catalogue | Défaut préexistant, non régressif, hors PRE-2 (CE-T03-04 §12, éditeur du Catalogue) | Consigné |
| R9 Récupération et Pause entre les côtés | Preuves automatiques existantes listées ; deux tests d'écran manquants | Révision |
| R10 VoiceOver | Défaut partiel sur les interrupteurs et sur l'action des Étiquettes ; confinement et retour du focus à vérifier sur appareil | Révision |

## Preuves et tests

- **Plan run 37189965479** (`kodjo-v2-slice-plan`, étape « Construct V2 plan draft with OpenAI ») :
  - appel au modèle réussi (`gpt-5.6-luna`, HTTP 200, 234 420 jetons sérialisés) ;
  - refus par le décodeur : `PLAN_GENERATION_MARKER_DUPLICATION` (`scripts/kodjo/generate-ui-plan-contract.js` L153) ;
  - classification : `ORCHESTRATION_FAILURE` / `HUMAN_DECISION_REQUIRED`, sans relance automatique ;
  - artefact : `kodjo-v2-slice-plan-37189965479`, sans la réponse brute du modèle.
- **Plan run 37190167568** (reprise) :
  - appel réussi (HTTP 200, 234 721 jetons) ;
  - refus : `UI_PLAN_TARGET_INVALID: UI-103FBF8D197A: cible hors scope_allow: src/features/preferences/profilePhoto.ts` ;
  - même classification ; rien n'a été publié.
- Aucun test applicatif n'est applicable : aucun code n'a été modifié.

## Hypothèses non démontrées

- **Échec 1 :** l'origine probable est une recopie, dans la narration, de balises du plan antérieur, qui en contient beaucoup. La réponse brute n'étant pas archivée, le marqueur exact n'est pas connu.
- **Échec 2 :** en révision sur une livraison existante, le périmètre est recalculé à partir des seuls modules modifiés déclarés par le modèle. Un critère inchangé qui garde ses fichiers cibles d'origine (ici `profilePhoto.ts`, non modifié par la révision) sort donc du périmètre. Ce mécanisme n'est pas démontré dans le code de la révision.

## Modifications réalisées

- PR #304 : D-265 à D-267, chapitres 07, 13 et 08.
- PR #305 : registre de recette.
- Commentaires sur #288 : 5978226685 et 5978253884.
- Aucun fichier applicatif.

## Éléments non corrigés ou hors périmètre

- Toutes les corrections R1 à R10 : la révision n'a pas abouti.
- R8 consigné hors PRE-2.
- Pas de `VISUAL_APPROVED`, pas de finalisation, pas de build.

## Vérifications restant à effectuer sur appareil réel

L'ensemble de la recette de la future livraison corrigée, en particulier Modifier le profil (non testable sur #303), la palette (clavier affiché et masqué), le confinement et le retour du focus VoiceOver.

## Fichiers modifiés

- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`
- `.github/orchestration/v2-slices/V2-PRE-2/recette-2026-10-04.md`
- ce rapport

## Commit final et état Git

Voir le commit qui introduit ce rapport. État attendu après fusion :
- `main` à jour ;
- PR #303 ouverte et inchangée à `10ac761e` ;
- aucune opération PRE-2 active.

## Complément — diagnostic voie A (décision du propriétaire)

- **Cause démontrée du premier échec.** Le prompt « draft » de révision (`.github/workflows/kodjo-v2-slice-plan.yml` L208–211) demande un bloc texte `<KODJO_MODIFIED_MODULES_JSON>`, que le décodeur interdit dans `plan_markdown` (`scripts/kodjo/generate-ui-plan-contract.js` L153). Le prompt initial a été migré vers le champ structuré `modified_modules` (`kodjo-v2-slice-initial-plan.yml` L158), celui de la révision non.
- **Cause du second échec.** En phase draft, le périmètre est exactement `modified_modules` (`generate-ui-plan-contract.js` L154–171) et chaque `change_target` doit y figurer (`lib/ui-criteria-contract.js` L176–181). Aucune consigne n'indiquait que, pour une tranche déjà livrée, ce périmètre est cumulatif.
- **Historique.** Aucun run de `kodjo-v2-slice-plan.yml` n'a abouti dans l'historique consulté : le chemin de révision n'est pas qualifié.
- **Correctif proposé, non fusionné : PR #307.** Il porte sur le texte du prompt uniquement (décodeur, contrats et validations inchangés). Test `tests/kodjo/v2-revision-draft-prompt.pilot.js` : 3/3 ; `validate-workflows` : OK.
- **Prochaine action, conditionnée à la validation du propriétaire.** Fusion de #307, puis une seule nouvelle commande `START_PLAN_REVISION` (`resume_command_comment_id=5978226685`).

## Complément — génération après correctif #307 (troisième run)

- **Correctif #307.** Validé par le propriétaire, rejoué localement sans API par le vrai décodeur (`tests/kodjo/v2-revision-draft-replay.pilot.js`, 7/7 avec `v2-revision-draft-prompt.pilot.js`), puis fusionné (`297d334c`). Transition `7a51179f` → `main` : PASS (protocole seulement).
- **Commande.** 5978651284 (reprise de 5978226685). Run 37193280090 : appel au modèle réussi (HTTP 200, 234 871 jetons).
- **Sortie du modèle.**
  - Elle passe les deux contrôles corrigés : marqueur dans la narration, périmètre cumulatif.
  - Elle est refusée sur une troisième règle : `UI_PLAN_ASSERTION_PROOF_COVERAGE_INCOMPLETE: UI-103FBF8D197A: chaque preuve du critere doit etre allouee a au moins une assertion` (`scripts/kodjo/lib/ui-criteria-contract.js` L111).
- **Classement.** Cette règle figure dans le contrat transmis au modèle (`contractPrompt` inclut le code du validateur). Ce n'est donc pas un défaut du prompt, mais une erreur de contenu de la génération.
- **Coût.** Trois appels au modèle (environ 235 000 jetons chacun), trois refus sur trois règles différentes. La génération de cette révision par le modèle n'est pas fiable pour ce plan (6 critères, 57 assertions).
- **Arrêt sans nouvelle relance ; arbitrage demandé au propriétaire.**
  - Option recommandée : publier une révision assemblée localement, avec les mêmes contrôles déterministes, par une extension bornée de la publication vérifiée (#290/#295) aux révisions sur une livraison existante.
  - Autre option : une nouvelle tentative du modèle.

## Complément — option A : révision assemblée localement et extension de publication

- **Décision.** Le propriétaire a choisi A. Aucun nouvel appel au modèle de planification n'a été fait. Branche `fix/kodjo-v2-revision-publication`, partie de `fd213f2d` (`main`) ; PR ouverte, **non fusionnée**.
- **Révision du plan.**
  - Fichier : `.github/orchestration/v2-slices/V2-PRE-2/revision-2026-10-04/technical-plan.md`.
  - Périmètre : écarts de recette R1, R4, R5, R6, R7a, R9 et R10, plus D-265 à D-267. Le reste du plan approuvé est conservé (§0 bis du plan) ; R8 et R7b restent hors révision.
  - Assemblage local avec les vrais scripts de `kodjo-v2-slice-plan.yml` : décodage draft et final, analyse d'impact à `10ac761e`, fermeture en 1 itération, réconciliation de la prose, `verify-bounded-plan-revision` = `APPROVED_BASE_NEW_CYCLE`, contrat UI (6 critères, 66 assertions), cohérence (périmètre 95, tests 41), impact vérifié.
  - Empreinte : sha256 `09598257b087a56ba0111ff97a7c2196e5b7b07f6ac05f86b7d3e0b2804a448f`, 252 796 octets, blob `87b7b6640498355ae46b17b28ed98a2237a1bf71`.
- **Défaut de protocole corrigé.** Pour une base approuvée à constats structurés, `verify-bounded-plan-revision.js` levait `PLAN_REVISION_REVIEW_INVALID`. Le chemin canonique aurait donc échoué lui aussi, même avec une génération correcte. Correctif : un nouveau cycle, comme pour une approbation non structurée. Un REVISE exige toujours un constat bloquant.
- **Extension bornée de publication** (`recover-published-plan.js`, `kodjo-v2-slice-plan-review.yml`) :
  - `planning_mode=REVISION` impose : PR et tête applicatives ; plan et revue remplacés liés par blob à `source_head` ; `source_head` sur `main` ; analyse à la tête applicative ; bloc de statut de révision.
  - L'en-tête reconstruit est identique au PLAN_OUTPUT du bot, sans `planning_mode`, ce qui laisse le relais non INITIAL inchangé.
  - La revue admet une publication vérifiée du propriétaire et expose `pinned_publication` ; après REVISE, cette publication n'est jamais régénérée par le modèle (arrêt `USER_VALIDATION`).
- **Contrainte découverte et respectée.** Le fichier du plan publié n'est pas un chemin protocolaire fermé (`verify-plan-review-transition.js`). Un `source_head` antérieur au commit du plan est donc refusé (`PLAN_REVIEW_NON_PROTOCOL_CHANGE`, démontré). La publication devra déclarer pour `source_head` le commit de `main` contenant le plan. Les 12 entrées produit protégées de ce commit sont identiques octet pour octet à celles de `7a51179f` (démontré). La politique de transition n'a pas été assouplie.

### Preuves et tests

- `node --test tests/kodjo/generic-revision-publication.pilot.js` : **12/12 PASS** (nominal, 8 refus, INITIAL avec champs applicatifs, borne de révision, branchement de la revue).
- E2E local sans modèle (`scratchpad/pre2/e2e/run-revision-e2e.js`) : vraie étape PowerShell « Validate immutable V2 review gate » contre une API simulée, puis les trois rejeux de la revue à `10ac761e`. Résultat **27/27 PASS**, avec `source_head` = tête de protocole = `16fdc80a`.
  - Admission et sorties exactes.
  - Corps relu = en-tête de révision + octets exacts.
  - 8 refus, chacun avec son code : auteur, octets altérés, plan remplacé, source divergente, tête analysée, `source_head` antérieur au plan, PR déplacée, PR fermée.
  - Rejeux impact, cohérence et UI (consume) : PASS ; rejeu à la baseline antérieure : refusé.
- `node tests/kodjo/run-all.js` : 917 tests, 898 PASS, 15 FAIL. Les 15 échecs sont **identiques sur `main` intact `fd213f2d`** (905 tests, 886 PASS, même ensemble d'échecs, comparé par diff) : tests du runtime OpenAI, IA-004 (`materialize-boundary-file.js`), 0.6.29, synchronisation d'environnement. Aucune régression introduite.
- `validate-workflows.js` : OK ; `verify-artifact-retention.js` : OK.

### Hors périmètre et suite

- **Non fait, en attente de la validation du propriétaire.** Fusion. Puis publication `[KODJO_V2] PLAN_PUBLICATION` (`planning_mode=REVISION`, `source_head` = commit de fusion, `application_pr=303`, `application_head=10ac761e…`, `supersedes_plan_blob_oid=ae2a7a0d…`, `prior_review_blob_oid=a7fe0ec8…`) et dispatch de la revue indépendante.
- Le chemin aval (relais, 👍, file, livraison sur #303) n'a pas été rejoué de bout en bout. Seule la lecture de la publication par le relais a été vérifiée dans le code (`materialize-approved-plan-handoff.js` L128–135, L83–96).
- PR #303 inchangée à `10ac761e` ; aucune opération PRE-2 active.

## Complément — fusion de #310 et publication bloquée

- **Fusion.** Le propriétaire a approuvé (« apprové »). #310 a été fusionnée par commit de fusion : `9bfbba0e195432d9c41e6db377ad41e96ec8a96f` = `main`.
- **CI de #310.** Le job `protocol` a échoué sur 2 tests : IA-004 (`materialize-boundary-file.js` absent du manifeste) et 0.6.29 (jeton de lancement Claude absent de `kodjo-v2-slice-initial-plan-review.yml`).
  - Les deux défauts existent à l'identique sur `fd213f2d`, dans des fichiers que #310 ne modifie pas. IA-004 date de `3419d5d3` (01/10/2026).
  - Ces checks ne sont pas requis (`mergeStateStatus=UNSTABLE`, `MERGEABLE`).
  - Les deux défauts sont préexistants, hors périmètre et non corrigés.
- **Contrôle avant publication** à `9bfbba0e` :
  - plan révisé présent (blob `87b7b664…`) ; plan et revue remplacés (`ae2a7a0d…`, `a7fe0ec8…`) ;
  - #303 ouverte à `10ac761e` ;
  - E2E sans modèle avec `source_head` = tête de protocole = `9bfbba0e` : **27/27 PASS**, dont l'identité octet pour octet des 12 entrées produit avec `7a51179f`.
- **Action bloquée.** La publication `[KODJO_V2] PLAN_PUBLICATION` sur l'issue #288 a été **refusée par le contrôle de permissions** (« External System Writes »). Appel refusé : `gh api --method POST repos/MyUncried/Application-Routine/issues/288/comments`. Aucun contournement n'a été tenté. La revue indépendante n'a pas été lancée.
- **Contenu prêt à publier** (corps exact) :

```
[KODJO_V2] PLAN_PUBLICATION
planning_mode=REVISION
slice_id=V2-PRE-2
bootstrap_path=.github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json
source_head=9bfbba0e195432d9c41e6db377ad41e96ec8a96f
application_pr=303
application_head=10ac761ef453f360110bf7b668b3998487b071b3
supersedes_plan_blob_oid=ae2a7a0d30e5895b91e5782e5a85d0a5f1808e94
prior_review_blob_oid=a7fe0ec8b655ae79e4315fba8bf6548dc684c8b2
plan_commit=16fdc80ac0796a0195e8cc008690ee5b8162ac7a
plan_path=.github/orchestration/v2-slices/V2-PRE-2/revision-2026-10-04/technical-plan.md
plan_blob=87b7b6640498355ae46b17b28ed98a2237a1bf71
plan_sha256=09598257b087a56ba0111ff97a7c2196e5b7b07f6ac05f86b7d3e0b2804a448f
plan_size=252796
```

- **Étapes suivantes**, après autorisation de l'écriture ou publication par le propriétaire :
  1. Relire la publication avec `recover-published-plan.js <id>`.
  2. Lancer `kodjo-v2-slice-plan-review.yml` (`issue_number=288`, `slice_id=V2-PRE-2`, `bootstrap_path`, `source_plan_comment_id=<id>`).

## Complément — publication effectuée, revue bloquée

- **Publication.** Sur instruction du propriétaire, la publication préparée a été postée sur #288 : commentaire `5979342848`.
- **Vérification** par `recover-published-plan.js 5979342848` contre l'API réelle, avec `main` = `9bfbba0e` : **PASS**.
  - En-tête de révision reconstruit exact : `source_head=9bfbba0e…`, `application_pr=303`, `application_head=10ac761e…`, `supersedes_plan_blob_oid=ae2a7a0d…`, `prior_review_blob_oid=a7fe0ec8…`.
  - Octets du plan identiques au plan assemblé (sha256 `09598257…`).
- **Avant lancement** : aucune revue en cours ; seul le run fantôme `34748621746` reste en file, non touché. Runner `KODJO-LOCAL-RUNNER` en ligne et libre.
- **Action bloquée.** Le lancement de la revue a été **refusé par le contrôle de permissions** (« External System Writes ») : `gh workflow run kodjo-v2-slice-plan-review.yml --ref main -f issue_number=288 -f slice_id=V2-PRE-2 -f bootstrap_path=.github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json -f source_plan_comment_id=5979342848`. Aucun contournement n'a été tenté ; aucune revue n'est lancée.

## Complément — revue indépendante 37198105017 : verdict obtenu, publication en échec

- **Lancement.** Vérification préalable : aucun run de `kodjo-v2-slice-plan-review.yml` depuis le 29/09 ; aucun commentaire après `5979342848` (seul le routeur `37197953280` a tourné, `skipped`) ; runner libre. Revue lancée une seule fois sur instruction du propriétaire : run `37198105017`.
- **Étapes réussies.** Barrière (publication propriétaire admise, `pinned_publication=true`), rejeux d'impact, de cohérence et d'interface à `10ac761e`, revue Claude (session `b68b25ea-a80b-4088-b77c-090dc07d247f`).
- **Échec de « Publish independent V2 plan review ».** `gh: Invalid request.` (HTTP 400). Rien n'a été posté sur #288 ; aucun relais ni aucune régénération n'a été déclenché.
- **Cause démontrée (`ORCHESTRATION_FAILURE`, défaut de protocole).** `kodjo-v2-slice-plan-review.yml` L248 lit le corps par `Get-Content -Raw`. Sous Windows PowerShell 5.1, `@{body=$commentBody}|ConvertTo-Json` sérialise alors `body` comme un objet (`value`, `PSPath`, `PSDrive`…), pas comme une chaîne. Reproduit localement. La taille n'est pas en cause : environ 40 000 caractères, sous la limite de 65 536. Ce chemin de publication n'avait jamais abouti auparavant.
- **Résultat de la revue (artefact `kodjo-v2-slice-plan-review-37198105017`, non publié) : verdict `REVISE`, 7 constats bloquants.**
  1. Zones : aucune assertion STYLE / VISUAL_COMPARE de la modale et de sa carte de création (CE-UI-09 L2772, L2804 ; frames 4478:7209, 4683:6336, 4861:6348).
  2. Zones : défilement, clavier, actions visibles et texte agrandi non assertés (CE-UI-09 L2796, L2808), alors que la modale a deux champs en ligne sans ScrollView ni KeyboardAvoidingView.
  3. R6 : le rafraîchissement doit couvrir aussi la Composition (registre R6) ; `CompositionScreen.tsx:83` n'a pas de jeton de rafraîchissement.
  4. Référentiels : états d'erreur (nom vide ou invalide, échec d'écriture, saisie conservée) non assertés (CE-UI-09 L2812, L2836 ; CE-T03-16 L1665, L1673).
  5. REQ-156EDCBC434B015A : validité du nom (non vide après trim, bornes de longueur) omise (C09 L885, L915).
  6. REQ-156EDCBC434B015A : ordre d'affichage déterministe des référentiels omis (C09 L917, L955).
  7. R10 : « titres de modale en en-tête » annoncé au §0 bis mais porté par aucune assertion.
- **Arrêt.** Conformément à l'instruction (« arrête-toi à son résultat publié »), aucune correction ni republication n'a été faite. Le protocole prévoit de rejouer uniquement la publication à partir de la sortie validée, sans nouvel appel à Claude ; cela suppose de corriger L248 (`[IO.File]::ReadAllText`) et de disposer d'un chemin de republication. Décision du propriétaire attendue.

## Complément — correctif de publication, republication et plan corrigé (PR #311)

- **Approbation du propriétaire** (« approuvé ») : corriger le défaut, republier le verdict sans Claude, corriger le plan sur les 7 constats, puis lancer une nouvelle revue.
- **Correctif.** `kodjo-v2-slice-plan-review.yml` lit désormais le corps par `[IO.File]::ReadAllText($commentPath,[Text.Encoding]::UTF8)`. Vérifié sous Windows PowerShell 5.1 : `body` est bien une chaîne.
- **Republication sans Claude** (`kodjo-v2-plan-review-republish.yml`, `scripts/kodjo/republish-plan-review.js`), sur dispatch uniquement et depuis `main` :
  - reconstruit le corps depuis l'artefact du run ;
  - lie ce corps aux octets du plan publié, à la tête de protocole du run et à la session Claude ;
  - refuse si une revue est déjà publiée pour ce plan ;
  - applique la suite de l'étape d'origine : APPROVE → relais ; REVISE → arrêt `USER_VALIDATION`, jamais de régénération.
  - Reconstruction en lecture seule sur l'artefact réel de 37198105017 : verdict REVISE, 44 881 caractères.
- **Plan corrigé** (même chemin `revision-2026-10-04/technical-plan.md`, commit `aa50dde2`).
  - Les 7 constats sont intégrés : 3 assertions ajoutées pour les Zones (rendu, clavier, Composition), 1 assertion partagée sur les erreurs, 3 assertions d'accessibilité étendues aux en-têtes, l'exigence des référentiels complétée (nom, ordre) et le §0 bis mis à jour.
  - Réassemblage local sans modèle : 6 critères, 69 assertions, périmètre 95, 41 tests, `APPROVED_BASE_NEW_CYCLE`.
  - Empreinte : sha256 `25e88521333c1a691bf2ea6795c8f80887e8629cf507ec716a2c40fa44b122cf`, 258 391 octets, blob `e3daef43e58d9e52d921f561aa3044d201b6ff93`.
- **Tests.**
  - `plan-review-republish.pilot.js` : 12/12.
  - E2E d'admission du plan corrigé (`source_head` = tête de protocole = `aa50dde2`) : 27/27.
  - Suite pilote : 910/929, avec les mêmes 15 échecs préexistants que `main`.
  - `validate-workflows` : OK.
- **Action bloquée.** La fusion de #311 a été refusée par le contrôle de permissions (« Merge Without Review »). Aucun contournement n'a été tenté.
- **Suite, après fusion :**
  1. Dispatch de `kodjo-v2-plan-review-republish.yml` (`run_id=37198105017`, `issue_number=288`, `source_plan_comment_id=5979342848`).
  2. Publication du plan corrigé avec `source_head` = commit de fusion et `plan_commit` = commit du plan.
  3. Une revue indépendante.

## Complément — fusion de #311, republication et revue du plan corrigé

- **Autorisations du propriétaire.** Fusion, republication, publication du plan corrigé et une seule revue indépendante.
- **Fusion de #311** : `8260bcaa5eba1a6897eb27055728fd3900ace2ae` = `main`. Les échecs CI restants sont les deux mêmes préexistants qu'avant (IA-004, 0.6.29).
- **Republication sans Claude.** Run `37202050660` (`kodjo-v2-plan-review-republish.yml`) : succès. Revue REVISE de 37198105017 publiée (commentaire `5979898944`, `republished_from_run_id=37198105017`), puis arrêt `PLAN_RETRY_USER_VALIDATION` / `PINNED_PUBLICATION` (`5979899061`). Aucune régénération par le modèle.
- **Publication du plan corrigé.**
  - Contrôle préalable : E2E d'admission local à `8260bcaa`, 27/27.
  - Commentaire `5979912654` : `source_head=8260bcaa…`, `plan_commit=aa50dde2…`, blob `e3daef43…`, sha256 `25e88521…`, 258 391 octets.
  - Vérifié par `recover-published-plan.js` contre l'API réelle : en-tête exact, octets identiques.
- **Revue indépendante unique.**
  - Contrôle préalable : aucune revue en cours, aucun commentaire postérieur, runner libre.
  - Run `37202181321` : toutes les étapes en succès ; le correctif de publication est validé en conditions réelles.
  - Résultat publié : commentaire `5980019179`, session `e9c7c78c-066e-48d0-b94e-36ea8e98f7a8`, **verdict REVISE, 5 constats bloquants**, puis arrêt `USER_VALIDATION` / `PINNED_PUBLICATION` (`5980019286`).
- **Constats.** Les 7 constats précédents n'ont pas été relevés à nouveau.
  1. REQ-F907047106F88386 (Profil, C08) : plage L1076–1101 tronquée. L1103, quitter Profil sans confirmation, n'est pas assertée, et L1098 (Langue du MVP, clés de traduction centralisées) est omise. Correction attendue : locator L1076–1103, plus une assertion de sortie sans confirmation sur UI-82B1544AE5AE.
  2. UI-5F3D94866D30 (Catégorie) : aucune assertion RESPONSIVE de CE-UI-09 L2808 (liste défilante, nom long, texte agrandi) ; `CategoryPickerModal.tsx` n'a pas de liste défilante.
  3. UI-5F3D94866D30 : les chaînes figées de §4.10 L134–L135 (A7819D6C3521A, A14AB0BC67228) ne sont pas liées à `src/shared/i18n/resources/fr.ts` ni à `src/shared/i18n/index.test.ts`. Ces deux chemins sont à ajouter aux critères Catégorie, Zones et Étiquette ; ils sont déjà dans le périmètre.
  4. UI-96E7FD739BF0 (Modifier le profil) : aucune assertion RESPONSIVE de CE-UI-01 L2004 (défilement, Safe Areas, clavier, texte agrandi) ; `ProfileEditScreen.tsx` n'a ni défilement ni évitement du clavier.
  5. UI-60B2C84BF572 (Étiquette) : aucune assertion RESPONSIVE de CE-T03-16 L1645 (zone sûre, liste défilante, titre non tronqué, texte agrandi).
  - Aucun constat ne demande d'extension du périmètre (`dependency_expansion_required=false`, fichiers déjà dans `write_scope`) ni de décision métier.
- **Arrêt** au résultat publié, conformément à l'instruction (une seule revue). Aucune correction ni nouvelle publication n'a été faite.

## Complément — correction r3 et revue de fermeture bornée (préparées)

- **Instruction du propriétaire.**
  - Corriger localement les 5 constats de `5980019179`, sans nouvelle génération ; tenir un registre ; vérifier les règles citées.
  - Faire passer les contrôles.
  - Préparer une revue de fermeture limitée à ces 5 constats et aux régressions causées par leurs corrections, en conservant les acquis.
  - Poursuivre jusqu'aux demandes de permission.
- **Règles vérifiées dans les sources** (à `8260bcaa`, contenu identique à `7a51179f`) :
  - C08 L1098 (Langue du MVP) et L1103 (Retour sans confirmation) ;
  - C13 §4.10 L134–L135, CE-UI-07 L2556, CE-UI-09 L2808, CE-UI-01 L2004, CE-T03-16 L1645.
  - Les 5 constats sont confirmés.
- **Registre** : `.github/orchestration/v2-slices/V2-PRE-2/revision-2026-10-04/correction-register-5980019179.md`. Pour chaque constat : observation, exigence avec citation de la source, qualification, correction, preuve ; plus les changements d'identifiant (`REQ-F907047106F88386` → `REQ-B01623D27FF0E00D`) et les conséquences vérifiées.
- **Constats épinglés** : `prior-findings-5980019179.json`, identiques au bloc de la revue publiée.
- **Plan r3** (commit `6b9a3641`, blob `fe46bda9f32c20a190e5a5fb6db9993defe6e27b`, sha256 `9da8a1eb724eb1a9dca813688e58ad6ce3b7818b882627ae918dd77aea39ee64`, 267 121 octets) :
  - 73 assertions, dont les 69 de r2 conservées à l'identique et 4 ajoutées ;
  - périmètre 95, tests 41, impact `558c1cae…` inchangé ; `APPROVED_BASE_NEW_CYCLE`.
- **Défaut découvert et corrigé : narration r2.** Le générateur local de la narration était en erreur de syntaxe depuis r2. L'assemblage, qui enchaînait les générateurs par `&&`, n'a pas échoué.
  - Effet : le candidat publié `5979912654` avait des blocs structurés complets, mais un §0 bis non mis à jour.
  - Correction : générateur corrigé, assemblage rendu strict ; la narration r3 aligne la prose sur les blocs (consigné au registre).
- **Protocole** (commit `d11aef0e`) : fermeture bornée sur le chemin de révision.
  - Publication de révision avec champs de fermeture.
  - Constats antérieurs pouvant partager une cible, identifiés par leur numéro (cas des constats 2 et 3).
  - Porte, prompt exclusif (5 constats, régressions causées par les corrections, perte d'un acquis du candidat précédent), garde mécanique avant publication, preuve conservée.
- **Tests.**
  - `revision-closure-review.pilot.js` 3/3 ; tests associés 48/48.
  - E2E de fermeture sans modèle (`run-closure-r3-e2e.js`), avec la vraie barrière PowerShell, les vrais commentaires `5980019179` et `5979912654` et les vrais blobs : **22/22**. Admission en fermeture, 4 refus, 3 rejeux, garde sur des sorties synthétiques.
  - Prompt de fermeture évalué sous PowerShell 5.1 : 5 constats, registre inclus.
  - Suite pilote 913/932, avec les mêmes 15 échecs préexistants que `main`.
  - `validate-workflows` et `verify-artifact-retention` : OK.
- **Session du relecteur précédent** `e9c7c78c-066e-48d0-b94e-36ea8e98f7a8` présente sur le runner : la revue de fermeture la reprendra (`review_session_id`).
- **En attente des permissions du propriétaire :**
  1. Fusion de la PR.
  2. Publication de r3, avec `source_head` = commit de fusion, `plan_commit=6b9a3641…` et les champs de fermeture.
  3. Une seule revue de fermeture.

## Complément — revue de fermeture : APPROVE, relais matérialisé

- **Autorisations du propriétaire** (« Tout autoriser ») : fusion de #312, publication de r3, une seule revue de fermeture.
- **Fusion de #312** : `4eff1882a65dbb2c80f302aeacd11aa26a12e67a`. E2E de fermeture rejoué à ce commit avant publication : 22/22.
- **Publication r3.** Commentaire `5980545085` : `source_head=4eff1882…`, `plan_commit=6b9a3641…`, blob `fe46bda9…`, plus les champs de fermeture.
  - Vérifiée contre l'API réelle par `recover-published-plan.js` : octets identiques.
  - Entrées de fermeture valides : revue antérieure `5980019179`, candidat précédent `5979912654`, 5 constats.
- **Revue de fermeture unique.** Run `37206153511`, session reprise `e9c7c78c-066e-48d0-b94e-36ea8e98f7a8`.
  - Contrôle préalable : aucune revue en cours, aucun commentaire postérieur, runner libre.
  - Toutes les étapes ont réussi, y compris la garde de fermeture.
  - Résultat publié : commentaire `5980614371`, **verdict APPROVE**, `finding_count=0`. Les 5 constats sont fermés : exigence Profil (devenue `REQ-B01623D27FF0E00D`), liste des Catégories, liaison i18n des chaînes de suppression, Modifier le profil, feuille d'Étiquettes.
- **Relais automatique** (étape d'origine après APPROVE). `PLAN_HANDOFF_READY` publié (`5980617069`), commit `99e8d134` sur `main` :
  - `technical-plan.md` → blob `0d0e7ce6…` ; `independent-review.md` → blob `15dd3dae…` ;
  - `planning_application_head=10ac761e…` ;
  - `next_action=ADD_REACTION_THEN_COMMENT`.
- **Arrêt au résultat publié.** Restent à faire, sous la décision du propriétaire :
  1. 👍 de Hermann depuis son propre compte sur `5980617069`, puis la commande de mise en file.
  2. Livraison sur #303.
  3. Revue d'implémentation, publication Routine Dev et nouvelle recette iPhone (§11 du plan).

## Complément — implémentation : run 37208114796 sans livraison, correctif du superviseur

- **Mise en file.**
  - 👍 de MyUncried vérifié sur `5980617069` (14:05:41Z).
  - Requête générée en lecture seule : `EXISTING_PR` #303, tête `10ac761e`, plan `0d0e7ce6`, 95 chemins.
  - `VALIDATE_PLAN_HANDOFF` → `PLAN_HANDOFF_VALIDATED` (`5980864146`) ; `QUEUE_APPROVED_PLAN` → `IMPLEMENTATION_QUEUED` (`5980867212`, requête `70ca9c09`).
- **Run de développement 37208114796 : échec `KODJO_QUEUE_NO_DELIVERY`.** Claude a déclaré `IMPLEMENTED_AND_VERIFIED` avec « fichiers modifiés : aucun » (jest 1486/1486, typescript, lint PASS). #303 n'a pas bougé.
- **Cause démontrée (`ORCHESTRATION_FAILURE`, défaut de protocole).**
  - L'arbre de travail est au HEAD applicatif `10ac761e`, dont `technical-plan.md` est le plan remplacé (`ae2a7a0d`, 57 assertions).
  - La mission, lue au HEAD protocolaire, désigne le plan approuvé `0d0e7ce6` (73 assertions), mais le modèle a lu la copie de l'arbre et conclu que tout était déjà implémenté (sortie : « ne contient que 57 assertion_id »).
  - Autre observation : `claude_failure=KODJO-V2-CLAUDE-AUTH` est une classification par texte (« 401 » ou « token » dans la sortie), sans effet ici (`exit 0`). Non corrigée, hors périmètre.
- **Correctif** (commit `71306821`) :
  - le plan autorisé est lu au HEAD protocolaire et lié à son blob ;
  - il est déposé en lecture seule dans `.kodjo-authorized-plan/technical-plan.md` (Read est confiné à l'arbre en mode `--restricted` : vérifié par un appel local réel), exclu de Git, puis retiré après l'appel ;
  - le prompt le désigne comme seul plan opposable.
  - Le test `v2-revision-draft-replay.pilot.js`, qui échouait sur `main` depuis `99e8d134`, est figé sur le blob du plan qu'il rejoue.
- **Tests.**
  - `existing-pr-authorized-plan.pilot.js` 5/5, dont un dépôt git réel : copie invisible pour `git status` et l'indexation, lecture seule, exclusion idempotente.
  - Rejeu corrigé 4/4.
  - Suite pilote : mêmes 15 échecs préexistants que la référence, les 3 échecs du rejeu étant corrigés.
- **Suite :** fusion, nouvelle mise en file `QUEUE_APPROVED_PLAN` du même relais approuvé (admissibilité vérifiée en lecture seule), puis suivi du run, de la revue d'implémentation et de la publication Routine Dev.
