# V2-PRE-2 — Registre de correction de la revue 5971511255

Revue corrigée : run 37136337819, session `dca7ea15-1c66-4961-87f7-01772ad7588a`, publiée par le commentaire 5971511255 (`PLAN_REVIEW_RECOVERY`) : REVISE, 13 constats dont 11 bloquants. Constats épinglés : `prior-findings.json` (octets identiques à `findings_sha256` du commentaire 5971511255).

Candidat revu : publication 5970991340, blob `c374143708441ececb245748b214005fde7c873a`. Candidat corrigé : `technical-plan.md` de ce dossier. Baseline inchangée : `53cb05c782e17eb19d269f2724a0db3cfbceb1a2`. Périmètre PRE-2, séparation PRE-2/PRE-3 et décisions D-256 à D-259 inchangés.

Chaque constat a été vérifié contre le plan revu et les sources aux empreintes du bootstrap. Les 13 sont justifiés ; seul le conflit 1 / 0,5 du constat 12 est contesté, avec sa preuve.

## Changements d'identifiants

Les identifiants d'exigence dérivent de leur contenu ; deux exigences visées ont été réécrites :

| Constat | Identifiant revu | Identifiant corrigé |
|---|---|---|
| 3 | `REQ-0A882C7C5D9F469B` (brouillons, D-213) | `REQ-374B945713BE84A4` |
| 9 | `REQ-5CC77DFDC4EDF091` (migration v8) | `REQ-98C76C09DB479339` |

Les identifiants de critère sont inchangés. L'assertion `UI-9194767E574D-A2A283F0E130C` (injection inconditionnelle de la Pause entre les côtés) est supprimée et remplacée par `UI-9194767E574D-A06FE3354DAE2`.

## Constats

Numérotation : ordre de `prior-findings.json`.

### 1 — `RF-1B1DA5551A8E95D5` — PATH `src/features/reference-data/ReferenceValueDialog.tsx` (bloquant)

- **Justification** : confirmée. C13 §4.10 L134 (titre dynamique), L135 (message utilisé / non utilisé), L137 (valeurs initiales KODJO incluses), L138 (retour à la modale ouverte sans la valeur) n'étaient portées par aucune assertion. `Category.isPredefined` existe (`Category.ts` L28). C09 L895, L928, L962 confirment que les valeurs initiales sont supprimables.
- **Correction** : assertions `UI-3ECC243E1B76-A7819D6C3521A` (§4.10 L134, titre exact, trois référentiels), `-A14AB0BC67228` (L135, message selon l'usage), `-A6F2EDD689C0C` (L136, L139, affectation existante conservée), `-A511139B9E9D8` (L137, Catégories prédéfinies administrables sans garde `isPredefined`), `-A3309C3508823` (L138, modale restée ouverte, trois référentiels) ; `UI-6E8FBE118894-A6E804F8CBE09` (Zones initiales administrables) ; `UI-EF614F650E74-AAA09A554B75D` (Étiquette : modale ouverte, affectation conservée). Tests du critère Catégorie étendus à `BodyZonePickerModal.test.tsx` et `LabelPickerModal.test.tsx`. Texte : §6.5 (traductions, aucune garde `isPredefined`), §11 étape 6.
- **Preuve de fermeture** : les quatre lignes citées ont chacune une assertion sourcée à la ligne exacte, avec ses tests.

### 2 — `RF-353AEF6317A2BFA8` — CRITERION_ID `UI-9194767E574D` (bloquant)

- **Justification** : confirmée. C04 L259 et C13 CE-T03-08 L884 imposent que la Récupération suive l'occurrence au déplacement et à la duplication. `moveActivity` (`composition.ts` L144) et `duplicateActivity` (L215) n'avaient aucune preuve, alors que l'écrasement de `SessionService.createSession` (L105–115) est supprimé.
- **Correction** : assertion `UI-9194767E574D-A0D8A00099FB7` (déplacement et duplication conservent la valeur, sans relecture du Profil) ; tests `composition.test.ts` (classé `TEST_MUST_ADAPT`) et `SessionService.test.ts` ; nouvelle exigence non UI `REQ-B04373AE337E7685` (C04 L251, L259) ; §6.1, §7, §11 étape 3.
- **Preuve de fermeture** : assertion sourcée sur C04 L259 et CE-T03-08 L884, prouvée par `composition.test.ts` et `SessionService.test.ts`.

### 3 — `RF-4464C3E920E31B35` — REQUIREMENT_ID `REQ-0A882C7C5D9F469B` (bloquant)

- **Justification** : confirmée. C09 L844 (« lors de l'activation D→G ou G→D »), v12 L86 ligne 7 (« Bilatéral uniquement … copie du Profil à activation ») et C04 L251 conditionnent l'initialisation à la bilatéralité. `DEFAULT_SIDE_MODE = UNILATERAL` (`SessionDraft.ts` L102) et `createEmptyActivityDefinitionDraft` renvoie `sideRecoverySeconds: 0` (`ActivityDefinition.ts` L336). L'injection inconditionnelle aurait écrit 10 s sur un Exercice unilatéral.
- **Correction** : option « initialisation conditionnée » retenue, sans report à PRE-3. Contrairement aux lignes 9–10, le champ `sideRecoverySeconds` existe déjà. Assertion `UI-9194767E574D-A06FE3354DAE2` (unilatéral → 0 s sans valeur du Profil ; Sans changement → D→G/G→D → copie du Profil ; D→G ↔ G→D → valeur conservée ; Exercice déjà bilatéral → valeur conservée), remplaçant `-A2A283F0E130C`. Exigence `REQ-374B945713BE84A4` réécrite (règle pure de copie à l'activation). Décision T21 (`sideRecoveryOnSideModeChange` dans `ActivityDefinition.ts`, appliquée par `ExerciseScreen` au changement de côté via `SideModeControl`) ; `createEmptyActivityDefinitionDraft()` inchangé ; §5, §6.1, §7.
- **Preuve de fermeture** : la nouvelle assertion contient le cas « un Exercice unilatéral ne reçoit pas la valeur du Profil » demandé, et le déclencheur d'activation ; prouvée par `ActivityDefinition.test.ts` et `ExerciseScreen.test.tsx`.

### 4 — `RF-6AF885C945395ACA` — PATH `src/infrastructure/database/migrations/migration008.ts` (bloquant)

- **Justification** : confirmée. Un index UNIQUE SQLite admet plusieurs NULL ; `categories.canonical_key` est `NOT NULL UNIQUE` (migration002 L51).
- **Correction** : contrainte équivalente, retenue par l'option « or equivalently constrained » du constat : index UNIQUE et déclencheurs `BEFORE INSERT` / `BEFORE UPDATE OF canonical_key` refusant NULL sur `labels` et `body_zones` (§6.2, T22, `REQ-98C76C09DB479339`). Pas de reconstruction de `labels` : `sessions.label_id … ON DELETE SET NULL` (migration007 L155) ; avec `foreign_keys = ON`, `DROP TABLE labels` exécuterait l'action SET NULL (`defer_foreign_keys` reporte les contrôles, pas les actions) et effacerait les Étiquettes des Séances. Tests : insertion et mise à jour NULL refusées, doublon refusé y compris contre une entrée retirée, `sessions.label_id` inchangé après migration.
- **Preuve de fermeture** : §6.2 donne le SQL exact ; `targetSchema.test.ts` et `migrateDatabase.test.ts` portent les refus.

### 5 — `RF-9484DACDD90799B5` — CRITERION_ID `UI-EF614F650E74` (bloquant)

- **Justification** : confirmée (CE-T03-16 §18 L1678).
- **Correction** : `ACCESSIBILITY` ajouté aux risques, `ACCESSIBILITY_CHECK` aux preuves ; assertion `UI-EF614F650E74-A18AFF4F268CB` (nom, sélection et action annoncés ; couleur jamais seule ; focus captif puis retour ; bouton destructif nommé).
- **Preuve de fermeture** : assertion sourcée sur L1678, preuves `ACCESSIBILITY_CHECK` et `FUNCTIONAL_TEST`.

### 6 — `RF-963D4D976390321C` — PLAN `NON_UI_COVERAGE` (bloquant)

- **Justification** : confirmée. 04, v12 et 08 sont des sources attestées porteuses d'exigences non UI non citées.
- **Correction** : `source_paths` complété (04, v12, 08) ; exigences `REQ-B04373AE337E7685` (C04 L251, L259), `REQ-DD38A3777CC4D034` (v12 L93–100, grille et absence d'arrondi, `Profile.ts`), `REQ-F907047106F88386` (C08 L1076–1101, nom 1..80 et Vibration sans effet sur l'haptique des roulettes). La DSF cartes ne porte que du rendu, couvert par les critères UI (raison de la couverture).
- **Preuve de fermeture** : chaque exigence a ses fichiers, tests et preuves ; `verify-plan-contract-consistency` avec couverture non UI PASS.

### 7 — `RF-99F05380148D3D53` — CRITERION_ID `UI-6E8FBE118894` (bloquant)

- **Justification** : confirmée (CE-UI-09 L2809, L2841).
- **Correction** : `ACCESSIBILITY` et `ACCESSIBILITY_CHECK` ajoutés ; assertion `UI-6E8FBE118894-AE9631FBE1ABA` (nom et état annoncés, sélection multiple entièrement lisible, actions nommées, focus confiné à la modale puis dialogue puis liste).
- **Preuve de fermeture** : assertion sourcée sur L2809 et L2841.

### 8 — `RF-9C99B0645BC14720` — CRITERION_ID `UI-103FBF8D197A` (bloquant)

- **Justification** : confirmée. CE-UI-01 L1981 impose de proposer l'abandon et de conserver le brouillon si on annule. `useCompositionExitGuard(shouldBlock, onConfirmExit)` est générique ; `ExerciseExitConfirmModal` documente la réutilisation canonique (REWORK11).
- **Correction** : assertions `UI-103FBF8D197A-A24AFE68D735D` (retour modifié intercepté par `useCompositionExitGuard`, sans modification retour direct) et `-AE1956416F3CB` (annuler conserve le brouillon, confirmer restaure et revient). `reuse_search` étendu à `useCompositionExitGuard.ts`, `ExerciseExitConfirmModal.tsx`, `AbandonCreationModal.tsx`. Justification : écran créé, garde réutilisée sans modification avec `DecisionDialog` ; `ExerciseExitConfirmModal` n'est pas réutilisée telle quelle, son message (`fr.ts` L609) portant sur un exercice. Les deux fichiers réutilisés sont ajoutés à PRESERVE. T23, §6.5, §11 étape 5.
- **Preuve de fermeture** : deux assertions sur L1981 ; décision de réutilisation explicite et vérifiée.

### 9 — `RF-A477F619CE75C994` — REQUIREMENT_ID `REQ-5CC77DFDC4EDF091` (bloquant)

- **Justification** : confirmée (migration004 L251–255 : `activity_id … ON DELETE CASCADE`, clé primaire composite).
- **Correction** : `REQ-98C76C09DB479339` et §6.2 donnent le DDL complet de la table reconstruite : cascade conservée, clé primaire `(activity_id, body_zone_id)`, clé étrangère `body_zones(id)` RESTRICT, `CHECK` sur 10 identifiants retiré. La reconstruction ne touche qu'une table enfant. Test : la suppression d'une Activité supprime ses liaisons de Zones après v8.
- **Preuve de fermeture** : DDL exact dans le plan ; assertion de cascade dans `targetSchema.test.ts` / `migrateDatabase.test.ts`.

### 10 — `RF-B221093C511698F5` — CRITERION_ID `UI-3ECC243E1B76` (bloquant)

- **Justification** : confirmée (CE-UI-09 L2809, L2841).
- **Correction** : `ACCESSIBILITY` et `ACCESSIBILITY_CHECK` ajoutés ; assertion `UI-3ECC243E1B76-A7B5A1D62106B` (nom et état annoncés, couleur toujours avec le nom, libellés accessibles des actions, focus confiné puis dialogue puis liste) ; §8 P2-21 précisé.
- **Preuve de fermeture** : assertion sourcée sur L2809 et L2841.

### 11 — `RF-D9F4149DCB143104` — REQUIREMENT_ID `REQ-9901F561E1ABA4B6` (non bloquant)

- **Justification** : confirmée. Nom affiché et photo sont des attributs de 09.1 Entité Utilisateur (L118, L145–150) ; `users` existe (migration001 L2–6).
- **Correction** : décision technique T20 (identité sur `profiles` : deux singletons 1:1, `users` sans colonne nom/photo, une seule écriture atomique) ; libellé corrigé en « 09.1 Entité Utilisateur L145–150 » (exigence migration et §1).
- **Preuve de fermeture** : T20 présente ; plus aucun libellé « Profil L145–150 ».

### 12 — `RF-E807417257E33294` — CRITERION_ID `UI-BB15197A1525` (bloquant)

- **Justification** : confirmée pour les assertions manquantes (CE-UI-07 L2533 : valeurs des groupes ; interdiction de roulette seulement dans la justification).
- **Partie contestée, avec preuve** : il n'existe pas de conflit 1 / 0,5. DSF-CARTES L30 (« Fond / bord intérieur `#FCFCFE` / `#CCD1E0`, 0,5 ») appartient au tableau « Grammaire des cartes » (L23–43, avec « Rayon 8 » L31) : il décrit les cartes, non les groupes du Profil, dont CE-UI-07 L2533 fixe liseré blanc 1 et rayon 12. Si un conflit existait, l'ordre des sources (C13 L13–25) placerait le chapitre 13 avant le rendu Figma.
- **Correction** : assertion STYLE `UI-BB15197A1525-A4FBB9EF5AEAF` (fond `#FCFCFE`, liseré blanc 1, rayon 12, ombre non rognée, avec l'arbitrage ci-dessus) ; assertion PRESENCE `-ACD779701967E` (durées par `ProfileStepper` uniquement, aucune roulette d'Exercice ; preuves `FUNCTIONAL_TEST` et `STATIC_ANALYSIS`, cette dernière ajoutée au critère) ; T24.
- **Preuve de fermeture** : deux assertions sur L2533 ; arbitrage documenté.

### 13 — `RF-EAB68D13A35E9B6A` — SOURCE chapitre 10 (non bloquant)

- **Justification** : confirmée. RM-106 (chapitre 10 L186) n'est pas une source attestée ; le chapitre 10 ne peut pas être ajouté au bootstrap sans modifier une entrée protégée de la tranche.
- **Correction** : T12 réécrite sur des sources attestées : Catégorie, ordre « Déterministe » (C09 L917), réalisé par l'index gelé `categories_display_order_idx` (migration002 L62–63) ; Zone, ordre « Défini par l'application » (C09 L955), liste initiale C09 L968–977 puis date de création ; Étiquette, aucune règle d'ordre attestée, donc décision technique explicite (date de création). RM-106 cité seulement pour cohérence, chapitre 10 signalé non attesté au §1.
- **Preuve de fermeture** : T12 cite une source attestée par référentiel ou une décision technique explicite.

## Conséquences directes vérifiées

- **Périmètre** : `scope_allow` passe de 92 à 93. `composition.test.ts` devient `TEST_MUST_ADAPT` (constat 2) ; aucun fichier applicatif ajouté. `ExerciseScreen.tsx` et `ActivityDefinition.ts` étaient déjà dans le périmètre.
- **PRESERVE** : ajout de `useCompositionExitGuard.ts` et `ExerciseExitConfirmModal.tsx`. Les fichiers de migration 001–007, les roulettes et `defaults.ts` restent gelés. Les assertions sur les Catégories prédéfinies modifient des lignes en base, pas `defaults.ts`.
- **§7 et recette §11** : alignés sur T21 et sur les nouvelles assertions (étapes 3, 5, 6, 9).
- **§12** : O2 levé (#290, #292), O5 ajouté.
- **PRE-2 / PRE-3** : inchangé. Les lignes v12 9–10 restent en PRE-3 ; la ligne 7 n'est pas reportée. Le stepper d'édition de la Pause entre les côtés, absent à la baseline et hors matrice PRE-2, n'est pas ajouté.
- **D-256 à D-259** : inchangées (assertions D-256 L390, D-257 L391, D-258 L392, D-259 L393 conservées).

## Contrôles V2 sur les octets exacts du candidat corrigé

- `verify-ui-plan-criteria` (produce, consume) : PASS, 6 critères, 57 assertions.
- `verify-plan-contract-consistency` avec `KODJO_REQUIRE_NON_UI_COVERAGE=1` (produce, consume) : PASS, périmètre 93, 40 tests.
- `verify-plan-impact` : PASS (`57a8876544aeefc7612b69d07c454c778a68cffaa5c133d7e285fa40fc7f0dfa`).
- `PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW`.
