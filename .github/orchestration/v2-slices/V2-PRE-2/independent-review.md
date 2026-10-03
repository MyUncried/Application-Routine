# Revue indépendante matérialisée — V2-PRE-2

Verdict: APPROVED
Plan reviewed: `technical-plan.md`

[KODJO_V2] PLAN_REVIEW_OUTPUT
slice_id=V2-PRE-2
bootstrap_path=.github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json
source_head=53cb05c782e17eb19d269f2724a0db3cfbceb1a2
protocol_execution_head=00ea56fa5dfcc79bdc11a1bc3dc7e7796beda646
planning_mode=INITIAL
source_plan_comment_id=5974531818
reviewer=CLAUDE
review_session_id=dca7ea15-1c66-4961-87f7-01772ad7588a
verdict=APPROVE
STATUT : PLAN_REVIEW_APPROVED

Verification complete. All 13 prior findings examined against the corrected candidate, the normative sources at baseline `53cb05c7` and the checked-out code. No file created or modified.

| N | Correction examinée | Preuve précise | Fermé | Justification |
|---|---|---|---|---|
| 1 | Assertions §4.10 L134/L135/L137/L138 ajoutées sur `ReferenceValueDialog`, tests étendus aux trois modales | `UI-3ECC243E1B76-A7819D6C3521A` (§4.10 L134, titre exact « Supprimer « {nom} » ? », trois référentiels), `-A14AB0BC67228` (L135, message utilisé \| non utilisé), `-A511139B9E9D8` (L137 ; C09 L928, dix Catégories prédéfinies administrables, aucune garde `isPredefined`), `-A3309C3508823` (L138, modale restée ouverte) ; `UI-6E8FBE118894-A6E804F8CBE09` (L137 ; C09 L962) ; `UI-EF614F650E74-AAA09A554B75D` (L138/L139). C09 L928 et L962 vérifiés : « toute Catégorie est supprimable, y compris une valeur fournie initialement par KODJO » / « Toutes les Zones, y compris les dix valeurs initiales … sont supprimables ». `tests` du critère Catégorie contient `ReferenceValueDialog.test.tsx`, `CategoryPickerModal.test.tsx`, `BodyZonePickerModal.test.tsx`, `LabelPickerModal.test.tsx` ; liaisons `REQ-CB816056E7750B1E` vers ces trois derniers | OUI | Les quatre lignes exigées ont chacune une assertion sourcée à la ligne exacte avec ses tests. L137 pour l'Étiquette est sans objet : `migration007.ts` ne contient aucun `INSERT INTO labels` (référentiel semé vide) |
| 2 | Assertion de conservation de la Récupération au déplacement et à la duplication | `UI-9194767E574D-A0D8A00099FB7`, source `04 – Modèle fonctionnel.md L259 ; C13 CE-T03-08 L884` : « Déplacer ou dupliquer une occurrence conserve sa propre Récupération après exercice ; la copie ne relit pas le Profil, même si le Profil a changé depuis ; supprimer l'occurrence supprime sa valeur ». `tests` du critère étendu à `src/domain/sessions/__tests__/composition.test.ts` et `SessionService.test.ts` ; liaisons `REQ-B316754B885B0E70` et `REQ-B04373AE337E7685` vers ces deux fichiers ; `composition.test.ts` ajouté à `write_scope` et à `required_test_writes` ; `src/domain/sessions/composition.ts` reste hors périmètre (implémentation inchangée, §6.1) | OUI | Assertion sourcée sur les deux lignes demandées, portée par `SessionService.test.ts` et le test de Composition, sans toucher l'implémentation |
| 3 | Injection de la Pause entre les côtés conditionnée à la bilatéralité ; exigence réécrite `REQ-374B945713BE84A4` | Assertion `UI-9194767E574D-A06FE3354DAE2` (sources C09 L844 ; v12 L86 ligne 7 ; C04 L251) : « créé Sans changement (unilatéral) garde … 0 s et ne reçoit pas la valeur du Profil ; passer de Sans changement à D→G ou G→D copie la Pause … ; D→G à G→D conserve la valeur ; Exercice existant déjà bilatéral garde sa valeur » ; `-A2A283F0E130C` absente. `REQ-374B945713BE84A4` : « règle pure de copie … à l'activation bilatérale ». T21 (`sideRecoveryOnSideModeChange` dans `ActivityDefinition.ts`, appliquée par `ExerciseScreen`), §5 (ligne 7 non reportée, champ déjà existant), §6.1 (`createEmptyActivityDefinitionDraft()` inchangé), §7 ligne réécrite. `ActivityDefinition.ts`, `ExerciseScreen.tsx`, `ActivityEditorForm.tsx` déjà dans `write_scope` | OUI | Option « initialisation conditionnée » retenue, déclencheur d'activation couvert, et le cas exigé « un Exercice unilatéral ne reçoit pas la valeur du Profil » explicitement asserté |
| 4 | Clé normalisée rendue obligatoire par index UNIQUE + déclencheurs, au titre de « or equivalently constrained » | §6.2 : ordre `ALTER … ADD COLUMN canonical_key TEXT` → remplissage JS (`UPDATE … SET canonical_key = ?`) → `CREATE UNIQUE INDEX` → quatre déclencheurs `BEFORE INSERT` / `BEFORE UPDATE OF canonical_key` sur `labels` et `body_zones` avec `RAISE(ABORT…)` quand `NEW.canonical_key IS NULL`. T22 ; `REQ-98C76C09DB479339` : « clé normalisée obligatoire et unique … déclencheurs refusant une clé NULL à l'insertion comme à la mise à jour ». Tests nommés : « insertion et mise à jour avec clé NULL refusées ; clé dupliquée refusée, y compris contre une entrée retirée » ; liaisons vers `targetSchema.test.ts` et `migrateDatabase.test.ts`. Non-reconstruction de `labels` justifiée : `migration007.ts` L155 `label_id … ON DELETE SET NULL` | OUI | Les deux seules voies d'introduction d'un NULL (INSERT, UPDATE de la colonne) sont abortées après le remplissage : contrainte équivalente à `NOT NULL UNIQUE`, assertée dans `targetSchema.test.ts` comme demandé |
| 5 | `ACCESSIBILITY` / `ACCESSIBILITY_CHECK` et assertion CE-T03-16 L1678 pour l'Étiquette | `UI-EF614F650E74` : `risk_types = [ACCESSIBILITY, FUNCTIONAL, VISUAL]`, `proof_required = [ACCESSIBILITY_CHECK, FUNCTIONAL_TEST, VISUAL_COMPARE]` ; assertion `-A18AFF4F268CB` (CE-T03-16 L1678) : nom, état sélectionné et action annoncés ; « la couleur n'est jamais le seul identifiant, le nom étant toujours présent » ; focus captif dans le dialogue puis retour à l'Étiquette ou à la liste ; bouton destructif nommé Supprimer ; preuves `ACCESSIBILITY_CHECK` + `FUNCTIONAL_TEST` | OUI | Les quatre éléments de L1678 sont couverts, avec le risque et la preuve d'accessibilité ajoutés |
| 6 | `source_paths` complété et trois exigences non UI ajoutées | `KODJO_NON_UI_COVERAGE_JSON.source_paths` contient désormais 04, v12 et 08 en plus de 09, 13, 07, avec motif écartant la DSF (rendu seul). Nouvelles exigences : `REQ-B04373AE337E7685` (C04 L251 ; L259 → `ActivityDefinition.ts`, `ExerciseScreen.tsx`, `SessionService.ts`, `SessionDraft.ts` ; 4 tests), `REQ-DD38A3777CC4D034` (v12 L93–100, grille et absence d'arrondi → `Profile.ts` ; `Profile.test.ts`), `REQ-F907047106F88386` (C08 L1076–1101, nom 1..80 et Vibration sans effet sur l'haptique des roulettes → `Profile.ts`, `ProfileService.ts` ; 2 tests). `requirement_count` 11 → 14 | OUI | Les trois sources omises sont citées et chacune porte une exigence énumérée avec ses `change_targets`, ses tests et ses preuves |
| 7 | `ACCESSIBILITY` / `ACCESSIBILITY_CHECK` et assertion CE-UI-09 L2809/L2841 pour les Zones | `UI-6E8FBE118894` : `risk_types` et `proof_required` enrichis ; assertion `-AE9631FBE1ABA` (CE-UI-09 L2809, L2841) : nom et état annoncés par Zone ; « toutes les Zones sélectionnées restent lisibles, sans troncature ni masquage de la sélection multiple » ; Annuler, Modifier, Supprimer et Confirmer à libellés accessibles ; « focus … confiné à la modale ouverte, passe au dialogue puis revient à la liste » | OUI | Les trois exigences visées (annonce nom\|état, lisibilité de la sélection multiple, focus confiné puis dialogue puis liste) sont asserties sur les lignes demandées |
| 8 | Assertions d'abandon CE-UI-01 L1981 et `reuse_search` étendu au patron canonique de garde de sortie | `UI-103FBF8D197A-A24AFE68D735D` (L1981) : retour bouton ou geste avec brouillon modifié « intercepté par useCompositionExitGuard et propose l'abandon dans DecisionDialog ; sans modification, le retour revient au Profil sans dialogue » ; `-AE1956416F3CB` (L1981) : « Annuler l'abandon … conserve le brouillon ; confirmer … restaure les valeurs enregistrées ». `reuse_search` + `useCompositionExitGuard.ts`, `ExerciseExitConfirmModal.tsx`, `AbandonCreationModal.tsx` ; `decision_justification` : écran créé, garde « importée telle quelle », modale d'Exercice non réutilisable car « son message porte sur un exercice » — vérifié à `fr.ts` L609 « Les modifications apportées à cet exercice seront perdues. ». T23, §6.5. Les deux fichiers réutilisés sont en PRESERVE `FILE_UNCHANGED` et absents de `write_scope` | OUI | Les deux chemins manquants sont asserties sur L1981 et la décision REUSE/CREATE est explicitement confrontée au patron canonique, avec preuve de la non-réutilisation telle quelle |
| 9 | DDL complet de `activity_body_zones` reconstruite ; exigence réécrite `REQ-98C76C09DB479339` | §6.2 : `CREATE TABLE activity_body_zones_v8 (activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE, body_zone_id TEXT NOT NULL REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT, PRIMARY KEY (activity_id, body_zone_id))`, puis `INSERT … SELECT`, `DROP`, `RENAME` — conforme à `migration004.ts` L251–254 vérifié. Texte de l'exigence : « avec activity_id … ON DELETE CASCADE conservé … et PRIMARY KEY (activity_id, body_zone_id) ». Puce « enfant uniquement : aucune action de clé étrangère déclenchée vers d'autres tables » ; test nommé « suppression d'une Activité supprimant ses liaisons de Zones (cascade conservée) » ; liaisons `REQ-98C76C09DB479339` → `targetSchema.test.ts` et `migrateDatabase.test.ts` | OUI | La cascade et la clé primaire composite sont déclarées dans l'exigence et dans le DDL exact, avec l'assertion de cascade portée par les deux tests de migration |
| 10 | `ACCESSIBILITY` / `ACCESSIBILITY_CHECK` et assertion CE-UI-09 L2809/L2841 pour la Catégorie | `UI-3ECC243E1B76` : `risk_types = [ACCESSIBILITY, FUNCTIONAL, VISUAL]`, `proof_required` avec `ACCESSIBILITY_CHECK` ; assertion `-A7B5A1D62106B` (L2809, L2841) : nom et état sélectionné annoncés ; « sa couleur est toujours accompagnée du nom » ; « Annuler, Modifier et Supprimer ont des libellés accessibles » ; focus confiné à la modale, puis dialogue, puis retour à la liste. §8 P2-21 précisé en « preuves visuelles et contrôles d'accessibilité des six critères » | OUI | Les quatre éléments de L2841 et le confinement du focus de L2809 sont asserties, avec le risque et la preuve d'accessibilité ajoutés |
| 11 | Décision technique T20 et libellé de localisation corrigé | T20 : identité portée par `profiles` et non `users`, motivée par deux singletons 1:1, `users` (migration001 L2–6) sans colonne nom ni photo, et une écriture atomique unique ; sources C09 L118–152 ; migration001 L2–6. Libellé : `grep "Profil L145"` = 0 occurrence ; « 09.1 Entité Utilisateur L145–150 » présent dans l'exigence de migration et dans le contrat d'exigences ; §1 reformulé « 09.1 Entité Utilisateur L118–152 » ; T8 cite « C09 L147 (09.1 Entité Utilisateur) » | OUI | La décision est tracée au §4 et plus aucun libellé « Profil L145–150 » ne subsiste |
| 12 | Assertions STYLE et PRESENCE sur CE-UI-07 L2533, avec arbitrage du prétendu conflit 1 \| 0,5 | `UI-BB15197A1525-A4FBB9EF5AEAF` (L2533) : « fond #FCFCFE, un liseré blanc de 1, un rayon de 12 et une ombre non rognée ; ces valeurs du chapitre 13 s'appliquent aux groupes, le bord 0,5 \| rayon 8 de DSF-CARTES L30 ne concernant que les cartes » ; `-ACD779701967E` (L2533, PRESENCE) : durées par `ProfileStepper` uniquement, aucune roulette d'Exercice rendue, preuves `FUNCTIONAL_TEST` + `STATIC_ANALYSIS` ; `STATIC_ANALYSIS` ajouté au `proof_required` du critère ; T24. Contestation vérifiée : DSF L23 « ## Grammaire des cartes », L26 « Une carte présente le titre… », tableau L28–42 dont L30 « Fond / bord intérieur \| `#FCFCFE` / `#CCD1E0`, 0,5 » et L31 « Rayon \| 8 », avec des lignes exclusivement de cartes (« Archivée », « Hauteur repliée / choix … séance Catalogue 90 ») | OUI | Les deux assertions demandées existent sur L2533 ; la partie contestée est démontrée sur la source (L30 appartient au tableau des cartes) et l'arbitrage subsidiaire par l'ordre des sources C13 L13–25 est inscrit dans l'assertion elle-même |
| 13 | T12 réécrite sur des sources attestées, chapitre 10 signalé non attesté | T12 : Catégories = `display_order` des prédéfinies puis date croissante, source « C09 L917 (Catégorie, « Déterministe ») » — vérifié : « Ordre d'affichage \| Position dans les listes \| Obligatoire \| Déterministe » ; Zones = liste initiale dans l'ordre de C09 L968–977 puis date croissante, source « C09 L955 (Zone, « Défini par l'application ») » — vérifié ; Étiquettes = « aucune règle d'ordre dans les sources attestées, décision technique déterministe = date de création croissante » — vérifié : le tableau d'attributs de 09.10 Entité Étiquette (L881–888) ne comporte aucune ligne « Ordre d'affichage ». §1 : « Le chapitre 10 … n'est pas une source attestée de la tranche : il n'est cité qu'à titre de cohérence (T12), aucune règle du plan n'en dépend » | OUI | Option « restate T12 against an attested source » retenue : chaque référentiel reçoit une source attestée ou une décision technique explicite, et la non-attestation du chapitre 10 est déclarée au §1 |

<KODJO_CLOSURE_JSON>
{"closures":[
{"finding":1,"closed":true,"correction_examined":"Assertions §4.10 L134, L135, L137 et L138 ajoutées pour le dialogue partagé ReferenceValueDialog, et tests du critère Catégorie étendus aux trois modales de sélection.","evidence":"UI-3ECC243E1B76-A7819D6C3521A (§4.10 L134, titre exact « Supprimer « {nom} » ? », pour Catégorie, Zone et Étiquette) ; -A14AB0BC67228 (§4.10 L135, message différent selon que la valeur est utilisée ou non) ; -A511139B9E9D8 (§4.10 L137 ; C09 L928, les dix Catégories prédéfinies renommables, recolorables et supprimables, aucune opération conditionnée par isPredefined) ; -A3309C3508823 (§4.10 L138, modale de sélection restée ouverte, valeur absente, trois référentiels) ; UI-6E8FBE118894-A6E804F8CBE09 (§4.10 L137 ; C09 L962) ; UI-EF614F650E74-AAA09A554B75D (§4.10 L138, L139). Sources vérifiées à la baseline : C09 L928 « toute Catégorie est supprimable, y compris une valeur fournie initialement par KODJO » et C09 L962 « Toutes les Zones, y compris les dix valeurs initiales fournies par KODJO, sont supprimables ». tests du critère UI-3ECC243E1B76 = ReferenceValueDialog.test.tsx, CategoryPickerModal.test.tsx, ExerciseScreen.test.tsx, ReferentialService.test.ts, BodyZonePickerModal.test.tsx, LabelPickerModal.test.tsx ; liaisons REQ-CB816056E7750B1E vers ReferenceValueDialog.test.tsx, BodyZonePickerModal.test.tsx et LabelPickerModal.test.tsx. migration007.ts ne contient aucun INSERT INTO labels (grep = 0), donc aucune Étiquette initiale fournie par KODJO n'existe.","justification":"Les quatre lignes normatives exigées par expected_correction portent chacune une assertion sourcée à la ligne exacte, prouvée par ReferenceValueDialog.test.tsx et les trois tests de modale ; l'absence d'instance Étiquette pour L137 est démontrée sur le code de la baseline."},
{"finding":2,"closed":true,"correction_examined":"Assertion ajoutée au critère UI-9194767E574D sur la conservation de la Récupération après exercice au déplacement et à la duplication d'une occurrence, avec composition.test.ts ajouté aux preuves.","evidence":"UI-9194767E574D-A0D8A00099FB7, source « 04 – Modèle fonctionnel.md L259 ; C13 CE-T03-08 L884 » : « Déplacer ou dupliquer une occurrence conserve sa propre Récupération après exercice ; la copie ne relit pas le Profil, même si le Profil a changé depuis ; supprimer l'occurrence supprime sa valeur. » Les tests du critère incluent désormais src/domain/sessions/__tests__/composition.test.ts et src/features/sessions/__tests__/SessionService.test.ts ; le contrat de tests lie composition.test.ts et SessionService.test.ts à REQ-B316754B885B0E70 (critère) et à REQ-B04373AE337E7685. composition.test.ts est ajouté à write_scope (92 → 93, unique ajout) et à required_test_writes ; src/domain/sessions/composition.ts reste hors write_scope et §6.1 déclare moveActivity et duplicateActivity inchangés.","justification":"L'assertion demandée existe, sourcée sur 04 L259 et CE-T03-08 L884, et sa preuve est portée par SessionService.test.ts et le test de Composition, sans modification de l'implémentation concernée."},
{"finding":3,"closed":true,"correction_examined":"Option « initialisation conditionnée » retenue : exigence réécrite en REQ-374B945713BE84A4, assertion -A2A283F0E130C remplacée par -A06FE3354DAE2, décision T21 et §5, §6.1, §7 alignés.","evidence":"UI-9194767E574D-A06FE3354DAE2, sources « 09 L844 ; V12 L86 ligne 7 ; C04 L251 » : « Un nouvel Exercice du Catalogue créé Sans changement (unilatéral) garde une Pause entre les côtés de 0 s et ne reçoit pas la valeur du Profil ; passer de Sans changement à D→G ou G→D copie la Pause entre les côtés du Profil ; passer de D→G à G→D conserve la valeur courante ; un Exercice existant déjà bilatéral garde sa valeur à l'ouverture. » L'assertion -A2A283F0E130C est absente du candidat. REQ-374B945713BE84A4 : « règle pure de copie de la Pause entre les côtés du Profil à l'activation bilatérale d'un Exercice ». T21 définit sideRecoveryOnSideModeChange(previous, next, current, profileDefault) dans ActivityDefinition.ts, appliquée par ExerciseScreen au changement de côté ; §5 justifie la non-report de la ligne 7 (champ sideRecoverySeconds déjà existant) ; §6.1 déclare createEmptyActivityDefinitionDraft() inchangé ; §7 remplace l'injection à la création par l'activation D→G ou G→D. ActivityDefinition.ts, ExerciseScreen.tsx et ActivityEditorForm.tsx sont dans write_scope ; liaisons REQ-374B945713BE84A4 → ActivityDefinition.test.ts et REQ-B04373AE337E7685 → ExerciseScreen.test.tsx.","justification":"L'initialisation est restatée comme conditionnée à la bilatéralité avec son déclencheur d'activation, et le cas exigé dans les deux branches de expected_correction — un Exercice unilatéral ne reçoit pas la valeur du Profil — est explicitement asserté."},
{"finding":4,"closed":true,"correction_examined":"Clé normalisée rendue obligatoire sur labels et body_zones par index UNIQUE plus déclencheurs BEFORE INSERT et BEFORE UPDATE OF canonical_key, au titre de l'option « or equivalently constrained », avec assertions dans targetSchema.test.ts.","evidence":"§6.2 donne le SQL exact et son ordre : ALTER TABLE labels/body_zones ADD COLUMN canonical_key TEXT, puis remplissage en JavaScript dans la transaction (UPDATE ... SET canonical_key = ?), puis CREATE UNIQUE INDEX labels_canonical_key_unique et body_zones_canonical_key_unique, puis quatre déclencheurs labels_canonical_key_required_insert, labels_canonical_key_required_update, body_zones_canonical_key_required_insert, body_zones_canonical_key_required_update, chacun WHEN NEW.canonical_key IS NULL BEGIN SELECT RAISE(ABORT, ...); END. T22 et REQ-98C76C09DB479339 énoncent « clé normalisée obligatoire et unique pour Étiquettes et Zones (index UNIQUE et déclencheurs refusant une clé NULL à l'insertion comme à la mise à jour, pour toutes les entrées actives et retirées) ». Tests nommés en §6.2 : « insertion et mise à jour avec clé NULL refusées ; clé dupliquée refusée, y compris contre une entrée retirée » ; liaisons REQ-98C76C09DB479339 → targetSchema.test.ts et migrateDatabase.test.ts. La non-reconstruction de labels est motivée par migration007.ts L155 (sessions.label_id ... ON DELETE SET NULL), vérifié à la baseline, et par le fait que defer_foreign_keys reporte les contrôles et non les actions.","justification":"Les deux seules voies d'introduction d'un NULL — INSERT et UPDATE de la colonne — sont abortées après le remplissage, ce qui équivaut à NOT NULL UNIQUE au niveau du stockage ; la contrainte est assertée dans targetSchema.test.ts comme l'exigeait expected_correction, dont l'option « or equivalently constrained » est ainsi satisfaite."},
{"finding":5,"closed":true,"correction_examined":"ACCESSIBILITY ajouté aux risk_types et ACCESSIBILITY_CHECK aux proof_required du critère Étiquette, avec une assertion sourcée sur CE-T03-16 L1678.","evidence":"UI-EF614F650E74 : risk_types = [ACCESSIBILITY, FUNCTIONAL, VISUAL] et proof_required = [ACCESSIBILITY_CHECK, FUNCTIONAL_TEST, VISUAL_COMPARE]. Assertion -A18AFF4F268CB, source CE-T03-16 L1678, proof_required [ACCESSIBILITY_CHECK, FUNCTIONAL_TEST] : « Chaque Étiquette annonce son nom, son état sélectionné et l'action proposée (choisir ou retirer) ; la couleur n'est jamais le seul identifiant, le nom étant toujours présent ; le focus est captif dans le dialogue de confirmation puis revient à l'Étiquette ou à la liste ; le bouton destructif est nommé Supprimer. » La decision_justification du critère mentionne désormais que l'identification non fondée sur la seule couleur est portée par le nouveau composant.","justification":"Les quatre éléments normatifs de CE-T03-16 L1678 sont couverts par une assertion unique sourcée à cette ligne, avec le type de risque et la preuve d'accessibilité demandés."},
{"finding":6,"closed":true,"correction_examined":"source_paths de KODJO_NON_UI_COVERAGE_JSON complété par les chapitres 04, v12 et 08, et trois exigences non UI ajoutées pour ces sources.","evidence":"source_paths contient désormais 09, 13, 07, 04 – Modèle fonctionnel.md, SPECIFICATION-PARAMETRES-MODALE-v12.md et 08 – Conception fonctionnelle détaillée.md ; le motif précise que la DSF cartes ne porte que des exigences de rendu couvertes par les critères UI. Nouvelles exigences énumérées : REQ-B04373AE337E7685 (04 L251 ; L259 — Pause entre les côtés pertinente uniquement en D→G/G→D et Récupération propre à l'occurrence qui se déplace, se duplique et se supprime avec elle ; change_targets ActivityDefinition.ts, ExerciseScreen.tsx, SessionService.ts, SessionDraft.ts ; quatre tests ; FUNCTIONAL_TEST) ; REQ-DD38A3777CC4D034 (v12 L93–100 — grille des pauses, fonctions de valeur de grille supérieure et inférieure, aucune valeur arrondie à la lecture ; change_targets Profile.ts ; Profile.test.ts) ; REQ-F907047106F88386 (08 L1076–1101 — nom 1..80, Vibration sans effet sur l'haptique des roulettes, enregistrement immédiat sans incidence sur les Séances existantes ; change_targets Profile.ts, ProfileService.ts ; deux tests). requirement_count passe de 11 à 14.","justification":"Les trois sources attestées omises sont citées et chacune porte au moins une exigence non UI énumérée avec ses change_targets, ses tests et ses preuves, conformément à expected_correction."},
{"finding":7,"closed":true,"correction_examined":"ACCESSIBILITY ajouté aux risk_types et ACCESSIBILITY_CHECK aux proof_required du critère Zones corporelles, avec une assertion sourcée sur CE-UI-09 L2809 et L2841.","evidence":"UI-6E8FBE118894 : risk_types = [ACCESSIBILITY, FUNCTIONAL, VISUAL] et proof_required = [ACCESSIBILITY_CHECK, FUNCTIONAL_TEST, VISUAL_COMPARE]. Assertion -AE9631FBE1ABA, source CE-UI-09 L2809, L2841, proof_required [ACCESSIBILITY_CHECK, FUNCTIONAL_TEST] : « Chaque Zone annonce son nom et son état sélectionné ; toutes les Zones sélectionnées restent lisibles, sans troncature ni masquage de la sélection multiple ; Annuler, Modifier, Supprimer et Confirmer ont des libellés accessibles ; le focus reste confiné à la modale ouverte, passe au dialogue puis revient à la liste. » La decision_justification mentionne désormais que le focus et l'annonce de la sélection multiple ne peuvent être hérités d'un composant existant.","justification":"L'annonce du nom et de l'état par Zone, la lisibilité intégrale de la sélection multiple propre à CE-UI-09 L2841 et le confinement du focus de L2809 sont asserties sur les lignes demandées, avec le risque et la preuve d'accessibilité ajoutés."},
{"finding":8,"closed":true,"correction_examined":"Deux assertions ajoutées sur CE-UI-01 L1981 pour la proposition d'abandon et la conservation du brouillon, reuse_search étendu au patron canonique de garde de sortie et décision de réutilisation restatée.","evidence":"UI-103FBF8D197A-A24AFE68D735D (CE-UI-01 L1981) : « Un retour (bouton ou geste) avec un brouillon modifié est intercepté par useCompositionExitGuard et propose l'abandon dans DecisionDialog ; sans modification, le retour revient au Profil sans dialogue. » UI-103FBF8D197A-AE1956416F3CB (CE-UI-01 L1981) : « Annuler l'abandon ferme le dialogue, reste sur Modifier le profil et conserve le brouillon ; confirmer l'abandon restaure les valeurs enregistrées et revient au Profil. » reuse_search = [app/_layout.tsx, DecisionDialog.tsx, KodjoIcon.tsx, src/features/sessions/useCompositionExitGuard.ts, src/features/sessions/ExerciseExitConfirmModal.tsx, src/features/sessions/AbandonCreationModal.tsx]. decision_justification : « Sa garde de sortie réutilise sans modification le patron canonique : useCompositionExitGuard(shouldBlock, onConfirmExit) importé tel quel et DecisionDialog, comme ExerciseExitConfirmModal ; cette modale n'est pas réutilisée telle quelle car son message porte sur un exercice » — vérifié à la baseline, fr.ts L609 : « Les modifications apportées à cet exercice seront perdues. » T23 et §6.5 alignés. useCompositionExitGuard.ts et ExerciseExitConfirmModal.tsx sont ajoutés aux boundaries PRESERVE en FILE_UNCHANGED et vérifiés absents de write_scope.","justification":"Les deux chemins non asserties — proposition de l'abandon au retour avec modification et conservation du brouillon à l'annulation — le sont désormais sur L1981, et la décision CREATE est explicitement confrontée au patron canonique avec réutilisation par import non modifié, preuve de la non-réutilisation de la modale d'Exercice incluse."},
{"finding":9,"closed":true,"correction_examined":"DDL complet de la table activity_body_zones reconstruite inscrit au §6.2 et dans l'exigence réécrite REQ-98C76C09DB479339, avec assertion de cascade dans les tests de migration.","evidence":"§6.2 : CREATE TABLE activity_body_zones_v8 (activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE, body_zone_id TEXT NOT NULL REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT, PRIMARY KEY (activity_id, body_zone_id)) puis INSERT ... SELECT, DROP TABLE activity_body_zones, ALTER ... RENAME. Conforme à la contrainte existante vérifiée à la baseline, migration004.ts L251–254. REQ-98C76C09DB479339 énonce « activity_body_zones reconstruite sans CHECK sur les 10 identifiants, avec activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE conservé, body_zone_id REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT et PRIMARY KEY (activity_id, body_zone_id), lignes conservées ». Puce §6.2 : « enfant uniquement : aucune action de clé étrangère déclenchée vers d'autres tables » et « la cascade ON DELETE CASCADE sur activity_id et la clé primaire composite de migration004 L251–255 sont conservées ». Test nommé : « suppression d'une Activité supprimant ses liaisons de Zones (cascade conservée) » ; liaisons REQ-98C76C09DB479339 → targetSchema.test.ts et migrateDatabase.test.ts.","justification":"La cascade sur activity_id et la clé primaire composite sont explicitement énoncées dans l'exigence et dans le DDL exact de la table reconstruite, et la survie de la cascade à la migration v8 est assertée dans targetSchema.test.ts et migrateDatabase.test.ts."},
{"finding":10,"closed":true,"correction_examined":"ACCESSIBILITY ajouté aux risk_types et ACCESSIBILITY_CHECK aux proof_required du critère Catégorie, avec une assertion sourcée sur CE-UI-09 L2809 et L2841, et §8 P2-21 précisé.","evidence":"UI-3ECC243E1B76 : risk_types = [ACCESSIBILITY, FUNCTIONAL, VISUAL] et proof_required = [ACCESSIBILITY_CHECK, FUNCTIONAL_TEST, VISUAL_COMPARE]. Assertion -A7B5A1D62106B, source CE-UI-09 L2809, L2841, proof_required [ACCESSIBILITY_CHECK, FUNCTIONAL_TEST] : « Chaque Catégorie annonce son nom et son état sélectionné ; sa couleur est toujours accompagnée du nom ; Annuler, Modifier et Supprimer ont des libellés accessibles ; le focus reste confiné à la modale ouverte, passe au dialogue puis revient à la liste. » §8 : P2-21 devient « Critères UI : preuves visuelles et contrôles d'accessibilité des six critères (Profil, Modifier le profil, Catégorie, Zones, Étiquette ; aucun rendu pour le branchement) ».","justification":"Les quatre éléments de CE-UI-09 §18 L2841 et le confinement du focus de §10 L2809 sont couverts par une assertion sourcée à ces lignes, avec le risque et la preuve d'accessibilité ajoutés, et la cartographie P2-21 est mise en cohérence."},
{"finding":11,"closed":true,"correction_examined":"Décision technique T20 enregistrée pour le placement de l'identité sur profiles, et libellé de localisation corrigé en 09.1 Entité Utilisateur L145–150.","evidence":"T20 au §4 : « Nom affiché, photo et silhouette sont portés par le singleton profiles, et non par users : les attributs Nom affiché et Photo de profil relèvent de 09.1 Entité Utilisateur (L145–150), mais users (migration001 L2–6) et profiles sont deux singletons 1:1 du même utilisateur local ; users ne porte aucune colonne de nom ni de photo, donc aucune duplication. Regrouper l'identité avec la silhouette et les préférences évite une seconde écriture atomique sur deux tables », sources C09 L118–152 ; migration001 L2–6. Libellé : la recherche de « Profil L145 » dans le candidat retourne 0 occurrence ; le locator « 09.1 Entité Utilisateur L145–150 ; préférences L840–865 ; référentiels L885–976 » figure dans KODJO_NON_UI_REQUIREMENTS_JSON et dans KODJO_REQUIREMENT_CONTRACT_JSON (REQ-98C76C09DB479339) ; §1 cite « 09.1 Entité Utilisateur L118–152 (nom affiché, photo L145–150) » et T8 cite « C09 L147 (09.1 Entité Utilisateur) ».","justification":"Les deux volets de expected_correction sont satisfaits : la décision de placement est tracée comme décision technique explicite au §4 et plus aucun libellé « Profil L145–150 » ne subsiste dans le candidat."},
{"finding":12,"closed":true,"correction_examined":"Assertion STYLE sur les groupes du Profil et assertion PRESENCE interdisant les roulettes d'Exercice, toutes deux sourcées sur CE-UI-07 L2533, avec arbitrage du prétendu conflit 1 contre 0,5 et STATIC_ANALYSIS ajouté au critère.","evidence":"UI-BB15197A1525-A4FBB9EF5AEAF (CE-UI-07 L2533, STYLE, VISUAL_COMPARE) : « Chaque groupe du Profil (Exercice, Séance, Préférences) a un fond #FCFCFE, un liseré blanc de 1, un rayon de 12 et une ombre non rognée ; ces valeurs du chapitre 13 s'appliquent aux groupes, le bord 0,5 / rayon 8 de DSF-CARTES L30 ne concernant que les cartes. » UI-BB15197A1525-ACD779701967E (CE-UI-07 L2533, PRESENCE, FUNCTIONAL_TEST et STATIC_ANALYSIS) : « Toutes les durées du Profil se règlent par ProfileStepper ; aucune roulette d'Exercice (DurationWheelPicker, NumberWheelPicker) n'est rendue dans le Profil. » proof_required du critère étendu à STATIC_ANALYSIS ; T24 porte l'arbitrage. Partie contestée vérifiée sur la source attestée : DSF-CARTES L23 est le titre « ## Grammaire des cartes », L26 commence par « Une carte présente le titre et son badge », et le tableau L28–42 contenant L30 « Fond / bord intérieur | #FCFCFE / #CCD1E0, 0,5 » et L31 « Rayon | 8 » comporte des lignes exclusivement propres aux cartes (« Archivée », « Badge durée ou heure », « Hauteur repliée / choix … séance Catalogue 90 »).","justification":"Les deux assertions demandées existent et sont sourcées sur L2533 ; la contestation est démontrée sur la source — DSF L30 appartient au tableau de grammaire des cartes et ne décrit pas les groupes du Profil — et l'arbitrage subsidiaire par l'ordre des sources C13 L13–25 est inscrit dans T24, ce qui satisfait la résolution exigée."},
{"finding":13,"closed":true,"correction_examined":"T12 réécrite sur des sources attestées par référentiel, avec décision technique explicite pour l'Étiquette et mention au §1 que le chapitre 10 n'est pas une source attestée.","evidence":"T12 : Catégories = display_order des prédéfinies puis date de création croissante, source « C09 L917 (Catégorie, « Déterministe ») » — vérifié à la baseline : « Ordre d'affichage | Position dans les listes | Obligatoire | Déterministe » ; Zones = liste initiale dans l'ordre de C09 L968–977 puis Zones créées par date de création croissante, source « C09 L955 (Zone, « Défini par l'application ») » — vérifié : « Ordre d'affichage | Position dans les listes | Obligatoire | Défini par l'application » et liste des dix valeurs initiales présente ; Étiquettes = « aucune règle d'ordre dans les sources attestées, décision technique déterministe = date de création croissante, à égalité par ordre d'insertion » — vérifié : le tableau d'attributs de 09.10 Entité Étiquette (L881–888) ne comporte aucune ligne « Ordre d'affichage ». §1 : « Le chapitre 10 (10 – Processus métier et règles métier transverses.md, RM-106 L186) n'est pas une source attestée de la tranche : il n'est cité qu'à titre de cohérence (T12), aucune règle du plan n'en dépend. »","justification":"La seconde option de expected_correction est retenue : chaque référentiel reçoit une source attestée ou, pour l'Étiquette dont aucune règle d'ordre n'existe dans les sources attestées — fait démontré sur le chapitre 09 — une décision technique explicite et déterministe, et la non-attestation du chapitre 10 est déclarée au §1."}
]}
</KODJO_CLOSURE_JSON>

<KODJO_REVIEW_FINDINGS_JSON>
{"findings":[]}
</KODJO_REVIEW_FINDINGS_JSON>

**Regression check on the corrections themselves** (admissible only as non-closure, and none found): `write_scope` moves 92 → 93 with `src/domain/sessions/__tests__/composition.test.ts` as the only addition and no removal — no application file added, so no scope widening; the two files newly reused by finding 8's correction (`useCompositionExitGuard.ts`, `ExerciseExitConfirmModal.tsx`) are PRESERVE `FILE_UNCHANGED` and absent from `write_scope`, with no contradiction; `requirement_count` 11 → 14 and `binding_count` 41 → 52 are consistent with the three added non-UI requirements; assertions 43 → 57 across the same six criteria; `REQ-9901F561E1ABA4B6` (finding 11's target) is unchanged in place while `REQ-0A882C7C5D9F469B` and `REQ-5CC77DFDC4EDF091` are correctly superseded by `REQ-374B945713BE84A4` and `REQ-98C76C09DB479339` as the register declares. `ACCESSIBILITY_CHECK`, `VISUAL_COMPARE` and `STATIC_ANALYSIS` carry no test-contract bindings in either candidate (all 41 prior and all 52 corrected bindings are `FUNCTIONAL_TEST`), so the accessibility corrections follow the convention already in force for the two Profil criteria rather than introducing a divergence.

One point for your arbitration, outside this review's scope: the exclusive scope forbids creating or modifying any file, while `CLAUDE.md` makes a versioned mission report in `.github/orchestration/reports/` a permanent closure condition that only the exact phrase `EXCEPTION EXPRESSE — AUCUN RAPPORT DE MISSION` suspends. I complied with the read-only instruction and wrote nothing; `CLAUDE.md` itself requires me to raise the contradiction rather than resolve it silently.
<KODJO_PLAN_IMPACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-impact-review.v1",
  "scan_revision": "53cb05c782e17eb19d269f2724a0db3cfbceb1a2",
  "plan_scan_sha256": "57a8876544aeefc7612b69d07c454c778a68cffaa5c133d7e285fa40fc7f0dfa",
  "reviewer_scan_sha256": "57a8876544aeefc7612b69d07c454c778a68cffaa5c133d7e285fa40fc7f0dfa",
  "candidate_count": 46,
  "verdict": "MATCH"
}
</KODJO_PLAN_IMPACT_REVIEW_JSON>

<KODJO_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "00ea56fa5dfcc79bdc11a1bc3dc7e7796beda646",
  "scan_revision": "53cb05c782e17eb19d269f2724a0db3cfbceb1a2",
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
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
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
  "requirement_contract_sha256": "1eb877429a8c1aae1af8315ae10cf9b0f944d22ad55b24bebca832d32ef2ea35",
  "test_contract_sha256": "c83890224ba9777abd5ff762fd1b8b65e80ef6b4fcba1a772daebf5390a6e8fa",
  "boundary_contract_sha256": "26fed58813921fa4cf2225fa61cc2b68eec90a9bdc2d3a5b9d9a05d1b1b4c64c",
  "requirement_count": 14
}
</KODJO_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "00ea56fa5dfcc79bdc11a1bc3dc7e7796beda646",
  "scan_revision": "53cb05c782e17eb19d269f2724a0db3cfbceb1a2",
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
  "assertion_count": 57,
  "assertion_ids_sha256": "d8d050b8d592f41c942f5c405282ff0f669d17c0690f3ba7658acae852dc6109",
  "matrix_sha256": "c05cdee7e3b5489de20bb9ff494e8780243f23ca021018ab4bf205063e5dc5b9"
}
</KODJO_UI_PLAN_CONTRACT_REVIEW_JSON>

<KODJO_PLAN_REVIEW_FINDINGS_JSON>
{
  "schema": "kodjo.plan-review-findings.v1",
  "finding_count": 0,
  "verdict": "APPROVE",
  "affected_targets": [],
  "findings": []
}
</KODJO_PLAN_REVIEW_FINDINGS_JSON>
