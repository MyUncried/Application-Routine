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
