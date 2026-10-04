# Revue indépendante matérialisée — V2-PRE-2

Verdict: APPROVED
Plan reviewed: `technical-plan.md`

[KODJO_V2] PLAN_REVIEW_OUTPUT
slice_id=V2-PRE-2
bootstrap_path=.github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json
source_head=4eff1882a65dbb2c80f302aeacd11aa26a12e67a
protocol_execution_head=4eff1882a65dbb2c80f302aeacd11aa26a12e67a
application_pr=303
application_head=10ac761ef453f360110bf7b668b3998487b071b3
source_plan_comment_id=5980545085
reviewer=CLAUDE
review_session_id=e9c7c78c-066e-48d0-b94e-36ea8e98f7a8
verdict=APPROVE
STATUT : PLAN_REVIEW_APPROVED

All five corrections verified against the normative sources at immutable product HEAD `4eff1882` (transition PASS, zero protected-blob drift, `changed_paths: []`) and against the application code at `10ac761e`.

| N | Correction examinée | Preuve précise | Fermé | Justification |
|---|---|---|---|---|
| 1 | `REQ-F907047106F88386` : locator porté à « Profil L1076–1103 », texte complété des clauses L1103 et L1098, `change_targets`/`tests` complétés, nouvelle assertion sur `UI-82B1544AE5AE` | Exigence devenue `REQ-B01623D27FF0E00D` : locator `Profil L1076–1101` → `Profil L1076–1103` ; texte complété de « quitter l'écran Profil ne demande aucune confirmation, les modifications étant déjà enregistrées (L1103) » et « tous les textes utilisateur et libellés d'accessibilité des écrans, modales, dialogues et steppers livrés utilisent les clés de traduction centralisées (Langue du MVP, L1098) », les trois clauses antérieures conservées mot pour mot ; `change_targets` += `src/features/preferences/ProfileScreen.tsx`, `src/shared/i18n/resources/fr.ts` ; `tests` += `ProfileScreen.test.tsx`, `src/shared/i18n/index.test.ts`. Nouvelle assertion `UI-82B1544AE5AE-A3B2D83AEBA4C`, property_type INTERACTION, locator « CE-UI-07 L2556 ; C08 L1103 », proof FUNCTIONAL_TEST, critère dont les `tests` contiennent déjà `ProfileScreen.test.tsx`. Sources vérifiées : C08 L1103 « Retour \| Quitter l'écran ne demande aucune confirmation… », C08 L1098 « Langue du MVP \| … clés de traduction centralisées… », C13 CE-UI-07 L2556 « Persistance immédiate… pas de bouton Enregistrer global ». Propagation de l'identifiant : 0 occurrence résiduelle de `REQ-F907047106F88386` dans tout le candidat ; `TEST_CONTRACT` remplace les 2 anciens liens par 4 liens sur le nouvel identifiant ; aucun lien orphelin, aucune exigence sans lien | OUI | Les deux volets de l'`expected_correction` sont présents et ancrés sur les lignes normatives exactes, l'assertion demandée existe sur le critère demandé avec le test demandé, et le changement d'identifiant déclaré est propagé sans référence périmée |
| 2 | `UI-5F3D94866D30` : assertion RESPONSIVE sur la liste des Catégories | Assertion ajoutée `UI-5F3D94866D30-A4BEE35F8C506`, property_type RESPONSIVE, locator « CE-UI-09 L2808 », `proof_required` [FUNCTIONAL_TEST, VISUAL_COMPARE] : « La liste des Catégories de la modale défile quel que soit le nombre d'entrées, toutes restant atteignables ; un nom long reste accessible sans troncature et le texte agrandi ne réduit pas la police, clavier affiché ou masqué. » Les `change_targets` du critère contiennent `src/features/reference-data/CategoryPickerModal.tsx` et ses `tests` `CategoryPickerModal.test.tsx` (déjà déclarés, inchangés). Source vérifiée C13 L2808 : « Liste scrollable, clavier et actions visibles ; nom long accessible ; textes agrandis sans réduction ; focus confiné à la modale ouverte. » Critère passé de 16 à 17 assertions, les 16 antérieures identiques | OUI | L'assertion couvre les trois propriétés omises (défilement, nom long, texte agrandi) avec le property_type, le locator, les preuves et le rattachement exacts demandés |
| 3 | `UI-5F3D94866D30` (et `UI-3D89E598F31D`, `UI-60B2C84BF572`) : `fr.ts` aux `change_targets`, `index.test.ts` aux `tests` | Diff structurel r2 → r3 : `src/shared/i18n/resources/fr.ts` ajouté aux `change_targets` et `src/shared/i18n/index.test.ts` aux `tests` des trois critères de référentiel, et de rien d'autre (aucun chemin retiré). `TEST_CONTRACT` : 3 liens ajoutés (`REQ-999D817E7965D8CA`, `REQ-443922E10308B36B`, `REQ-0FBEF4DDBFAD3BC6` → `index.test.ts`). Les assertions visées `A7819D6C3521A` (§4.10 L134, titre exact) et `A14AB0BC67228` (§4.10 L135) sont conservées à l'identique et désormais traçables vers le fichier portant ces chaînes (`src/shared/i18n/resources/fr.ts`, `referenceData.deleteConfirm`). Le volet L1098 du constat est porté par la correction 1, vérifié présent dans `REQ-B01623D27FF0E00D`. `write_scope` (95) et `required_test_writes` (41) élément par élément identiques à r2 : aucune extension de périmètre | OUI | Les deux chemins sont ajoutés aux trois critères désignés, les assertions de contenu sont rendues traçables, et le volet L1098 est effectivement couvert ailleurs comme le registre l'indique, sans extension de périmètre |
| 4 | `UI-96E7FD739BF0` : assertion RESPONSIVE sur Modifier le profil | Assertion ajoutée `UI-96E7FD739BF0-A202F52482AC0`, property_type RESPONSIVE, locator « CE-UI-01 L2004 », `proof_required` [FUNCTIONAL_TEST, VISUAL_COMPARE] : « Modifier le profil défile dans les Safe Areas : la photo, le champ Nom d'affichage, les deux silhouettes et Enregistrer restent entièrement atteignables et utilisables, clavier affiché ou masqué, et en texte agrandi sans réduction de police. » `change_targets` contient `src/features/preferences/ProfileEditScreen.tsx`, `tests` contient `ProfileEditScreen.test.tsx` (déjà déclarés). Source vérifiée C13 L2004 : « Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. » Critère passé de 10 à 11 assertions, les 10 antérieures identiques ; c'est la première property_type RESPONSIVE du critère | OUI | L'exigence CE-UI-01 §10, auparavant intégralement non assertée, est couverte par une assertion qui énumère les quatre contrôles de l'écran et les trois propriétés de la source, avec les preuves et le rattachement demandés |
| 5 | `UI-60B2C84BF572` : assertion RESPONSIVE sur la feuille d'Étiquettes | Assertion ajoutée `UI-60B2C84BF572-AEC754D3ABC2D`, property_type RESPONSIVE, locator « CE-T03-16 L1645 », `proof_required` [FUNCTIONAL_TEST, VISUAL_COMPARE] : « La feuille d'Étiquettes reste limitée à la zone sûre ; sa liste défile quel que soit le nombre d'Étiquettes, toutes restant atteignables ; son titre n'est pas tronqué et le texte agrandi ne réduit pas la police. » `change_targets` contient `src/features/reference-data/LabelPickerModal.tsx`, `tests` contient `LabelPickerModal.test.tsx`. Source vérifiée C13 L1645 : « Feuille limitée à la zone sûre, liste défilante, titre non tronqué ; clavier fait apparaître le nom saisi et les actions ; texte agrandi selon §4.2. » Critère passé de 9 à 10 assertions, les 9 antérieures identiques ; la partie clavier/actions reste portée par `AF726088ADFDB` | OUI | Les quatre propriétés non couvertes (zone sûre, liste défilante, titre non tronqué, texte agrandi) sont assertées, complétant sans la remplacer la couverture clavier existante, avec le property_type, le locator et les preuves demandés |

**Contrôle de régression sur le reste du plan.** Aucune régression ni perte d'élément du candidat précédemment examiné :

- Matrice UI : 6 critères conservés, 69 assertions conservées avec des identifiants et un contenu strictement identiques, 4 ajoutées, 0 retirée, 0 modifiée → 73, conforme au `criterion_count: 6` / `assertion_count: 73` du contrat UI répliqué.
- `PLAN_IMPACT` byte-identique (`plan_scan_sha256` = `reviewer_scan_sha256` = `558c1cae…`, replay MATCH, 46 candidats) ; `BOUNDARY_CONTRACT` et le bloc `preservation` (PRESERVE / CHANGE / FORBIDDEN) byte-identiques ; `NON_UI_COVERAGE`, `PLAN_CLARIFICATIONS`, `PLAN_REVISION_STATUS` byte-identiques.
- `PLAN_CONTRACT` ne diffère que par `protocol_commit` et les deux empreintes de contrats régénérés ; `write_scope` (95) et `required_test_writes` (41) identiques élément par élément ; l'empreinte du contrat de frontières est inchangée.
- Les 5 exigences UI « modifiées » sont la seule projection mécanique des corrections 2 à 5 (mêmes assertions et mêmes deux chemins i18n ajoutés, rien de retiré) ; une seule exigence a un contenu propre modifié, celle de la correction 1.
- Prose : le diff complet hors blocs structurés se limite aux métadonnées d'en-tête et aux quatre changements de narration déclarés (lignes R4 et R6 du §0 bis, deux paragraphes récapitulatifs). Les lignes R4 et R6 sont un réalignement sur des blocs **inchangés** — `UI-3D89E598F31D-A39FF697ED918` (liste de Zones défilante, CE-UI-09 L2796/L2808) et `UI-3D89E598F31D-AED410D36D72B` (noms de Zones de la Composition à jour) existaient déjà à l'identique dans r2 : la suppression de la mention « Zones inchangées » ne retire aucune règle et la modale Zones reste sans palette (`A5E23CB337921` conservée). Tout le reste de la prose (§6.2 migration, T1–T24, §8, §11, §13, liste des tests) est byte-identique.

<KODJO_CLOSURE_JSON>
{"closures":[{"finding":1,"closed":true,"correction_examined":"Locator de l'exigence Profil C08 porté à « Profil L1076–1103 », texte complété des clauses L1103 (sortie sans confirmation) et L1098 (clés de traduction centralisées), change_targets et tests complétés, nouvelle assertion sur le critère UI-82B1544AE5AE ; identifiant dérivé du contenu passant de REQ-F907047106F88386 à REQ-B01623D27FF0E00D.","evidence":"REQUIREMENT_CONTRACT r3 : REQ-B01623D27FF0E00D porte locator « Profil L1076–1103 » (r2 : « Profil L1076–1101 ») et ajoute « quitter l'écran Profil ne demande aucune confirmation, les modifications étant déjà enregistrées (L1103) » puis « tous les textes utilisateur et libellés d'accessibilité des écrans, modales, dialogues et steppers livrés utilisent les clés de traduction centralisées (Langue du MVP, L1098) », les trois clauses de r2 étant conservées mot pour mot ; change_targets += src/features/preferences/ProfileScreen.tsx et src/shared/i18n/resources/fr.ts ; tests += src/features/preferences/__tests__/ProfileScreen.test.tsx et src/shared/i18n/index.test.ts. UI_CRITERIA_MATRIX r3 : assertion UI-82B1544AE5AE-A3B2D83AEBA4C, property_type INTERACTION, locator « CE-UI-07 L2556 ; C08 L1103 », proof_required [FUNCTIONAL_TEST], expected « Quitter le Profil (onglet, bouton ou geste de retour) ne déclenche aucun dialogue de confirmation ni garde de sortie : chaque préférence étant déjà enregistrée, le retour est immédiat. » ; les tests du critère contiennent déjà src/features/preferences/__tests__/ProfileScreen.test.tsx. Sources normatives à 4eff1882 : 08 – Conception fonctionnelle détaillée.md L1103 et L1098 lus textuellement, 13 – Contrats d'écran.md L2556 lu textuellement. Propagation : 0 occurrence de REQ-F907047106F88386 dans tout le candidat, 5 occurrences du nouvel identifiant ; TEST_CONTRACT passe de 55 à 60 liens, les 2 liens de l'ancien identifiant étant remplacés par 4 liens du nouveau ; aucun identifiant de lien absent du contrat d'exigences et aucune exigence sans lien.","justification":"Les deux clauses exigées par l'expected_correction sont présentes dans le texte de l'exigence et ancrées sur les lignes normatives exactes, l'assertion demandée existe sur le critère UI-82B1544AE5AE avec le test de preuve demandé, le volet L1098 est prouvé par src/shared/i18n/index.test.ts, et le changement d'identifiant annoncé par le registre est intégralement propagé sans référence périmée."},{"finding":2,"closed":true,"correction_examined":"Ajout au critère UI-5F3D94866D30 d'une assertion RESPONSIVE couvrant le défilement de la liste des Catégories, l'accessibilité d'un nom long et le texte agrandi.","evidence":"UI_CRITERIA_MATRIX r3 : assertion UI-5F3D94866D30-A4BEE35F8C506, property_type RESPONSIVE, source path « docs/Specifications-fonctionnelles/13 – Contrats d'écran.md », locator « CE-UI-09 L2808 », proof_required [FUNCTIONAL_TEST, VISUAL_COMPARE], expected « La liste des Catégories de la modale défile quel que soit le nombre d'entrées, toutes restant atteignables ; un nom long reste accessible sans troncature et le texte agrandi ne réduit pas la police, clavier affiché ou masqué. » Rattachement : change_targets du critère contient src/features/reference-data/CategoryPickerModal.tsx et tests contient src/features/reference-data/__tests__/CategoryPickerModal.test.tsx, déjà déclarés et inchangés. Source normative à 4eff1882, C13 L2808 : « Liste scrollable, clavier et actions visibles ; nom long accessible ; textes agrandis sans réduction ; focus confiné à la modale ouverte. » Le critère passe de 16 à 17 assertions, les 16 antérieures restant identiques (aucune retirée, aucune modifiée) ; AA0B74A61E212 reste en place pour la carte et la palette.","justification":"L'assertion ajoutée couvre les trois propriétés que le constat déclarait omises pour la modale Catégorie et reprend exactement le property_type, le locator, les preuves et le rattachement aux cibles et tests déjà déclarés que l'expected_correction demandait."},{"finding":3,"closed":true,"correction_examined":"Ajout de src/shared/i18n/resources/fr.ts aux change_targets et de src/shared/i18n/index.test.ts aux tests des critères UI-5F3D94866D30, UI-3D89E598F31D et UI-60B2C84BF572, le volet « Langue du MVP » L1098 étant porté par la correction 1.","evidence":"Diff structurel r2 → r3 de UI_CRITERIA_MATRIX : pour chacun des trois critères de référentiel, change_targets added = [src/shared/i18n/resources/fr.ts], tests added = [src/shared/i18n/index.test.ts], removed = [] dans les deux cas ; aucun autre critère ne voit ses chemins modifiés. REQUIREMENT_CONTRACT : mêmes deux chemins ajoutés aux exigences miroir REQ-999D817E7965D8CA, REQ-443922E10308B36B et REQ-0FBEF4DDBFAD3BC6. TEST_CONTRACT : 3 liens ajoutés vers src/shared/i18n/index.test.ts pour ces trois exigences. Les assertions visées par le constat, A7819D6C3521A (§4.10 L134, titre exact « Supprimer « {nom} » ? ») et A14AB0BC67228 (§4.10 L135, messages selon l'usage), sont conservées à l'identique et désormais rattachées au fichier qui porte ces chaînes dans le dépôt à 10ac761e (src/shared/i18n/resources/fr.ts, referenceData.deleteConfirm). Sources normatives à 4eff1882 : C13 §4.10 L134 et L135 lus textuellement. Volet L1098 : présent dans REQ-B01623D27FF0E00D (correction 1). Absence d'extension : write_scope (95) et required_test_writes (41) de PLAN_CONTRACT identiques élément par élément à r2.","justification":"Les deux chemins sont ajoutés aux trois critères désignés par l'expected_correction, rendant les deux assertions de contenu traçables vers le fichier de traduction et le test i18n qui les prouvent ; le volet L1098 est effectivement couvert par la correction 1 comme le registre le soutient, et aucune extension de périmètre n'a été introduite."},{"finding":4,"closed":true,"correction_examined":"Ajout au critère UI-96E7FD739BF0 d'une assertion RESPONSIVE couvrant le défilement de Modifier le profil dans les Safe Areas, le clavier et le texte agrandi.","evidence":"UI_CRITERIA_MATRIX r3 : assertion UI-96E7FD739BF0-A202F52482AC0, property_type RESPONSIVE, source path « docs/Specifications-fonctionnelles/13 – Contrats d'écran.md », locator « CE-UI-01 L2004 », proof_required [FUNCTIONAL_TEST, VISUAL_COMPARE], expected « Modifier le profil défile dans les Safe Areas : la photo, le champ Nom d'affichage, les deux silhouettes et Enregistrer restent entièrement atteignables et utilisables, clavier affiché ou masqué, et en texte agrandi sans réduction de police. » Rattachement : change_targets contient src/features/preferences/ProfileEditScreen.tsx et tests contient src/features/preferences/__tests__/ProfileEditScreen.test.tsx, déjà déclarés. Source normative à 4eff1882, C13 L2004 : « Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. » Le critère passe de 10 à 11 assertions, les 10 antérieures restant identiques ; c'est désormais la seule et première property_type RESPONSIVE du critère, qui n'en comportait aucune en r2.","justification":"L'exigence CE-UI-01 §10, auparavant intégralement non assertée, est couverte par une assertion qui énumère les quatre contrôles de l'écran et les trois propriétés de la source, avec le property_type, le locator, les preuves et le rattachement exacts demandés par l'expected_correction."},{"finding":5,"closed":true,"correction_examined":"Ajout au critère UI-60B2C84BF572 d'une assertion RESPONSIVE couvrant la zone sûre, la liste défilante, le titre non tronqué et le texte agrandi de la feuille d'Étiquettes.","evidence":"UI_CRITERIA_MATRIX r3 : assertion UI-60B2C84BF572-AEC754D3ABC2D, property_type RESPONSIVE, source path « docs/Specifications-fonctionnelles/13 – Contrats d'écran.md », locator « CE-T03-16 L1645 », proof_required [FUNCTIONAL_TEST, VISUAL_COMPARE], expected « La feuille d'Étiquettes reste limitée à la zone sûre ; sa liste défile quel que soit le nombre d'Étiquettes, toutes restant atteignables ; son titre n'est pas tronqué et le texte agrandi ne réduit pas la police. » Rattachement : change_targets contient src/features/reference-data/LabelPickerModal.tsx et tests contient src/features/reference-data/__tests__/LabelPickerModal.test.tsx, déjà déclarés. Source normative à 4eff1882, C13 L1645 : « Feuille limitée à la zone sûre, liste défilante, titre non tronqué ; clavier fait apparaître le nom saisi et les actions ; texte agrandi selon §4.2. » Le critère passe de 9 à 10 assertions, les 9 antérieures restant identiques ; AF726088ADFDB conserve la couverture clavier et actions.","justification":"Les quatre propriétés de CE-T03-16 §10 que le constat déclarait non couvertes sont désormais assertées, en complément et non en remplacement de la couverture clavier existante, avec le property_type, le locator, les preuves et le rattachement demandés."}]}
</KODJO_CLOSURE_JSON>

<KODJO_REVIEW_FINDINGS_JSON>
{"findings":[]}
</KODJO_REVIEW_FINDINGS_JSON>

Read-only throughout: no file was created, modified or committed. I did not re-run Jest — out of this bounded closure scope, and the runner workspace has no `node_modules`.
<KODJO_PLAN_IMPACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-impact-review.v1",
  "scan_revision": "10ac761ef453f360110bf7b668b3998487b071b3",
  "plan_scan_sha256": "558c1caeb4f6c10bc41cca058b22375da1d3e4413751abee4a2267e0fa2e75d9",
  "reviewer_scan_sha256": "558c1caeb4f6c10bc41cca058b22375da1d3e4413751abee4a2267e0fa2e75d9",
  "candidate_count": 46,
  "verdict": "MATCH"
}
</KODJO_PLAN_IMPACT_REVIEW_JSON>

<KODJO_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "4eff1882a65dbb2c80f302aeacd11aa26a12e67a",
  "scan_revision": "10ac761ef453f360110bf7b668b3998487b071b3",
  "write_scope": [
    "app/(tabs)/profile.tsx",
    "app/__tests__/rootLayoutGesture.test.tsx",
    "app/_layout.tsx",
    "app/profile-edit.tsx",
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/body-zones/BodyZone.ts",
    "src/domain/body-zones/BodyZoneRepository.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/body-zones/index.ts",
    "src/domain/categories/CategoryRepository.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/categories/errors.ts",
    "src/domain/categories/index.ts",
    "src/domain/labels/Label.ts",
    "src/domain/labels/LabelRepository.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/labels/index.ts",
    "src/domain/preferences/Profile.ts",
    "src/domain/preferences/ProfileRepository.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/preferences/index.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/defaults.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/preferences/ProfileEditScreen.tsx",
    "src/features/preferences/ProfileScreen.tsx",
    "src/features/preferences/ProfileService.ts",
    "src/features/preferences/ProfileServiceContext.tsx",
    "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileService.test.ts",
    "src/features/preferences/__tests__/profilePhoto.test.ts",
    "src/features/preferences/notificationPermission.ts",
    "src/features/preferences/profilePhoto.ts",
    "src/features/reference-data/BodyZonePickerModal.tsx",
    "src/features/reference-data/CategoryPickerModal.tsx",
    "src/features/reference-data/LabelPickerModal.tsx",
    "src/features/reference-data/ReferenceValueDialog.tsx",
    "src/features/reference-data/ReferentialService.ts",
    "src/features/reference-data/ReferentialServiceContext.tsx",
    "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
    "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
    "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
    "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
    "src/features/reference-data/__tests__/ReferentialService.test.ts",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/ColorPalette.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/ColorPalette.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration008.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
    "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
    "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
    "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
    "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/i18n/resources/fr.ts",
    "src/shared/ui/BodyZoneIcon.tsx",
    "src/shared/ui/KodjoIcon.tsx",
    "src/shared/ui/ProfileStepper.tsx",
    "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
    "src/shared/ui/__tests__/ProfileStepper.test.tsx"
  ],
  "required_test_writes": [
    "app/__tests__/rootLayoutGesture.test.tsx",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileService.test.ts",
    "src/features/preferences/__tests__/profilePhoto.test.ts",
    "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
    "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
    "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
    "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
    "src/features/reference-data/__tests__/ReferentialService.test.ts",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/ColorPalette.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
    "src/shared/ui/__tests__/ProfileStepper.test.tsx"
  ],
  "requirement_contract_sha256": "3f768d0583e3a6d679e6edf67614978a31c21b4d269bbeba7f326c655a78edca",
  "test_contract_sha256": "087d83748736496fa642c42994ef19318b620e670ba1079d91ffaa08e12bfb5b",
  "boundary_contract_sha256": "26fed58813921fa4cf2225fa61cc2b68eec90a9bdc2d3a5b9d9a05d1b1b4c64c",
  "requirement_count": 14
}
</KODJO_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "4eff1882a65dbb2c80f302aeacd11aa26a12e67a",
  "scan_revision": "10ac761ef453f360110bf7b668b3998487b071b3",
  "ui_applicable": true,
  "ui_paths": [
    "app/(tabs)/profile.tsx",
    "app/_layout.tsx",
    "app/profile-edit.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/preferences/ProfileEditScreen.tsx",
    "src/features/preferences/ProfileScreen.tsx",
    "src/features/preferences/ProfileService.ts",
    "src/features/preferences/ProfileServiceContext.tsx",
    "src/features/preferences/notificationPermission.ts",
    "src/features/preferences/profilePhoto.ts",
    "src/features/reference-data/BodyZonePickerModal.tsx",
    "src/features/reference-data/CategoryPickerModal.tsx",
    "src/features/reference-data/LabelPickerModal.tsx",
    "src/features/reference-data/ReferenceValueDialog.tsx",
    "src/features/reference-data/ReferentialService.ts",
    "src/features/reference-data/ReferentialServiceContext.tsx",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/ColorPalette.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/shared/i18n/resources/fr.ts",
    "src/shared/ui/BodyZoneIcon.tsx",
    "src/shared/ui/KodjoIcon.tsx",
    "src/shared/ui/ProfileStepper.tsx"
  ],
  "criterion_count": 6,
  "assertion_count": 73,
  "assertion_ids_sha256": "01d119b87b8364950506346dd636e5620cadeaa72f62b6db46fd5143c10cfa03",
  "matrix_sha256": "a6a4991aea38e7f4fe82021ef760a0774a5ca1afee58279e598d37c97f678fa1"
}
</KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_PLAN_REVIEW_TRANSITION_JSON>
{
  "schema_version": "kodjo.protocol.v2.plan-review-transition.0.6.25",
  "source_head": "4eff1882a65dbb2c80f302aeacd11aa26a12e67a",
  "protocol_execution_head": "4eff1882a65dbb2c80f302aeacd11aa26a12e67a",
  "bootstrap_path": ".github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json",
  "status": "PASS",
  "reason": null,
  "protected_paths": [
    ".github/orchestration/v2-activation-registry.json",
    ".github/orchestration/v2-slices/V2-PRE-2/independent-review.md",
    ".github/orchestration/v2-slices/V2-PRE-2/planning-mission.md",
    ".github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json",
    ".github/orchestration/v2-slices/V2-PRE-2/technical-plan.md",
    "docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md",
    "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
    "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
    "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
    "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
    "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
    "docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md"
  ],
  "changed_paths": [],
  "protocol_changes": [],
  "protected_blobs": [
    {
      "path": ".github/orchestration/v2-activation-registry.json",
      "source_oid": "d87751f20abab675f79fbb5f6865a3e0ee642115",
      "execution_oid": "d87751f20abab675f79fbb5f6865a3e0ee642115"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-PRE-2/independent-review.md",
      "source_oid": "a7fe0ec8b655ae79e4315fba8bf6548dc684c8b2",
      "execution_oid": "a7fe0ec8b655ae79e4315fba8bf6548dc684c8b2"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-PRE-2/planning-mission.md",
      "source_oid": "38d85a74b64e140804d13b6b8b4eb181282fc831",
      "execution_oid": "38d85a74b64e140804d13b6b8b4eb181282fc831"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json",
      "source_oid": "6be627c9a6b4c581cc59a9718be4498764d3149b",
      "execution_oid": "6be627c9a6b4c581cc59a9718be4498764d3149b"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-PRE-2/technical-plan.md",
      "source_oid": "ae2a7a0d30e5895b91e5782e5a85d0a5f1808e94",
      "execution_oid": "ae2a7a0d30e5895b91e5782e5a85d0a5f1808e94"
    },
    {
      "path": "docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md",
      "source_oid": "4ab1e59841cccbda0496088a1fb6ab81dbd90e97",
      "execution_oid": "4ab1e59841cccbda0496088a1fb6ab81dbd90e97"
    },
    {
      "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
      "source_oid": "6a67f3d2f957f0df612941228394bea8230c9a03",
      "execution_oid": "6a67f3d2f957f0df612941228394bea8230c9a03"
    },
    {
      "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
      "source_oid": "377feb19385e6aa776e4a2a90dfebdcceef37641",
      "execution_oid": "377feb19385e6aa776e4a2a90dfebdcceef37641"
    },
    {
      "path": "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
      "source_oid": "943a3939cc6531bf4210cb67182de7195942bf9f",
      "execution_oid": "943a3939cc6531bf4210cb67182de7195942bf9f"
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
      "source_oid": "3f1d096819101ec96a0e3f4dc9eccc99ba98576b",
      "execution_oid": "3f1d096819101ec96a0e3f4dc9eccc99ba98576b"
    },
    {
      "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
      "source_oid": "b99474b8cbb2e90a992405907efada671f894711",
      "execution_oid": "b99474b8cbb2e90a992405907efada671f894711"
    },
    {
      "path": "docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md",
      "source_oid": "2f3737575bc2786d45540b2fbd14a6636106a151",
      "execution_oid": "2f3737575bc2786d45540b2fbd14a6636106a151"
    }
  ],
  "product_source_evidence": [
    {
      "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
      "declared_sha256": "978cd6bc52cdb03a1a7a4fd600c37741d7543552db87ffca1c74ecaacedd858b",
      "source_sha256": "dd8241b10db29408e9a3b3a6e9172f451b31911724fccb9b9ed02d48f52e438f",
      "execution_sha256": "dd8241b10db29408e9a3b3a6e9172f451b31911724fccb9b9ed02d48f52e438f",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
      "declared_sha256": "4c6daa7bcbc3d6fa3fc2fa19e1bb1c0d425acc0c5e8e0457520e54c3efe818f6",
      "source_sha256": "0f759141c8b0da93398d13807021592923dfbc0ed939022fd22f7a550ba75ec2",
      "execution_sha256": "0f759141c8b0da93398d13807021592923dfbc0ed939022fd22f7a550ba75ec2",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
      "declared_sha256": "3e22dbfbbb2b5645c75911850eef625ee6d243900402bda5677d3c7f9a440c51",
      "source_sha256": "6c59ef41877f284f08e311c9725478435091ee79234c998db75fe89343f2ed86",
      "execution_sha256": "6c59ef41877f284f08e311c9725478435091ee79234c998db75fe89343f2ed86",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
      "declared_sha256": "2adc38992c142a9aee1aa52d1174c10ae3657c2c0f244e2f448d67d93dc78c1c",
      "source_sha256": "438a8236187a29a181aa619bb793ac8508e936aa8616e06f6c99aeb699ccde53",
      "execution_sha256": "438a8236187a29a181aa619bb793ac8508e936aa8616e06f6c99aeb699ccde53",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
      "declared_sha256": "adf1492ae377ca061fd6c205c81546b999cd073d1d277fd5bb23c22c15491cd6",
      "source_sha256": "792806f347766ba84e819c984d26457df3694dc1fffab2b8b286beb054ab266b",
      "execution_sha256": "792806f347766ba84e819c984d26457df3694dc1fffab2b8b286beb054ab266b",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md",
      "declared_sha256": "3ad8b8181a46939c4aca0a54c21ce2ed3d682b01f7815b205dcc8f6ca5848339",
      "source_sha256": "3ad8b8181a46939c4aca0a54c21ce2ed3d682b01f7815b205dcc8f6ca5848339",
      "execution_sha256": "3ad8b8181a46939c4aca0a54c21ce2ed3d682b01f7815b205dcc8f6ca5848339",
      "declared_hash_matches_source": true,
      "transition_matches": true
    },
    {
      "path": "docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md",
      "declared_sha256": "5f9537cb2c86025ca61eb241773ae62a5a38d42252490994cf3c4b52c2cb3d52",
      "source_sha256": "03ba824f6677dc457078b8e25aad1aaced2673ca2d5e3ce6296837c8120e3d77",
      "execution_sha256": "03ba824f6677dc457078b8e25aad1aaced2673ca2d5e3ce6296837c8120e3d77",
      "declared_hash_matches_source": false,
      "transition_matches": true
    }
  ],
  "policy": {
    "classifier_sha256": "68270a5bf226b4c9bed4a9eed364eb4bb34b60314ce2f2ff805ee2bbf6d9b018",
    "blobs": [
      {
        "path": "scripts/kodjo/verify-plan-review-transition.js",
        "source_oid": "b9334553360ac12c6da07d0a14029a1f3ac56e29",
        "execution_oid": "b9334553360ac12c6da07d0a14029a1f3ac56e29"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan.yml",
        "source_oid": "d9475217c6085bce7c6ea288d7cfd189fd4a97c8",
        "execution_oid": "d9475217c6085bce7c6ea288d7cfd189fd4a97c8"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan-review.yml",
        "source_oid": "91ea5a6a25ff2f7b4d559298241bbe9856e3aa1c",
        "execution_oid": "91ea5a6a25ff2f7b4d559298241bbe9856e3aa1c"
      }
    ]
  }
}
</KODJO_PLAN_REVIEW_TRANSITION_JSON>

<KODJO_PLAN_REVIEW_FINDINGS_JSON>
{
  "schema": "kodjo.plan-review-findings.v1",
  "finding_count": 0,
  "verdict": "APPROVE",
  "affected_targets": [],
  "findings": []
}
</KODJO_PLAN_REVIEW_FINDINGS_JSON>
