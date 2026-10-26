# Travaux différés PRE-7

- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-b-1-harmonisation-visuelle-feuille-parametres.md`
  summary: Valeur statique de la Cible avec phases (`execution-sheet-target-static`) — l'habillage de pastille n'est posé qu'à l'état invalide, d'où un décalage horizontal (12) et vertical au basculement valide / invalide.
  evidence: `ExecutionParametersSheet.tsx` (~l.2017) applique `[styles.valuePill, styles.valuePillInvalid]` seulement si `uniformTargetInvalid` ; comportement préexistant (décalage de 10 avant B.1). Corriger demande de fixer le rendu valide (marges constantes), choix de présentation à faire valider en recette JB.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-b-3-changement-de-cote-barre-clavier.md`
  summary: Déroulant de l'Enchainement (et panneaux `AnchoredPanel` existants) — à l'ouverture, le focus VoiceOver / TalkBack n'est pas déplacé dans le panneau, et la modalité ne vaut que sur iOS (`accessibilityViewIsModal`).
  evidence: maybe-false, gravité medium non vérifiée ; le menu natif retiré gérait le focus lui-même. À vérifier en recette JB avec VoiceOver (ouverture, lecture des deux rangées, échappement) ; si le focus reste sur le déclencheur, ajouter `AccessibilityInfo.setAccessibilityFocus` sur le menu.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a1-1-domaine-mouvement-parametres-v4.md`
  summary: Brouillon de la Feuille — avec une durée de phase non renseignée, « Durée d'une série » affiche la somme partielle des durées connues (`deriveSeriesDuration` compte `null` pour 0), alors que la forme Catalogue v4 impose la Cible `UNSET` pour une liste incomplète.
  evidence: comportement PRE-5 conservé (affichage seulement, ✓ refusé par D-438) ; un frère `INCOMPLETE` s'ouvre en `UNSET` puis passe à `NUMBER(Σ connus)` à la première saisie. À trancher en A2.1 (« durée vide conservée ») : afficher « — » tant qu'une durée manque, ou garder la somme partielle.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a1-1-domaine-mouvement-parametres-v4.md`
  summary: Les paramètres résolus d'un frère `INCOMPLETE` (durée manquante à 0 dans un `ExecutionParameters` ordinaire) peuvent être écrits par `serializeExecutionParameters` (v3), puis refusés par le lecteur.
  evidence: maybe-false, gravité medium non vérifiée ; aucun appelant en A1.1. À garantir en A1.2/A1.3 : seule la forme v4 persiste un frère incomplet, et une copie de Séance, une insertion ou un Instantané n'est produit que d'une résolution `EXECUTABLE` (ch11 « Exécuter : refuser les exercices incomplets »).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a1-2-schema-012-transition-repositories.md`
  summary: L'éditeur ouvre la Feuille avec `nextPhaseId` = max + 1 au lieu du compteur du Mouvement : une phase retirée puis rajoutée dans une réouverture non enregistrée reprend l'identité retirée.
  evidence: `ExecutionParametersSheet.tsx:503` appelle `openSheetDraft(parent, { inheritedSeriesCount })` sans `nextPhaseId` ; `allocatePhaseIdentities` (repository) garde tout identifiant encore présent dans la structure. À câbler en A2.1 (exposer le compteur du Mouvement à la Feuille).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a1-2-schema-012-transition-repositories.md`
  summary: Après la migration 012, les fichiers physiques des médias (photos, vidéos) restent dans le stockage de l'application sans aucune ligne `media_assets` qui les référence.
  evidence: `migration012.ts` supprime les lignes et non les fichiers (aucun accès fichier dans une migration SQL). Un balayage des fichiers non référencés au démarrage reste à décider par Hermann.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a1-2-schema-012-transition-repositories.md`
  summary: Une occurrence locale dupliquée avant le premier enregistrement de la Séance reçoit un Mouvement distinct de sa source, au lieu de partager la filiation.
  evidence: le brouillon ne porte aucune filiation pour une création locale non enregistrée ; le repository crée un Mouvement par occurrence sans filiation. À traiter en A1.3 (filiation pré-allouée au brouillon, MFN-04).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a1-3-services-filiation.md`
  summary: La question d'identité (MFN-08) n'est pas imposée à l'écriture : `updateActivityDefinition` et l'origine `SAME_MOVEMENT` corrigent le geste partagé sans accusé du choix.
  evidence: `assessActivityDefinitionCorrection` rend `requiresIdentityDecision`, mais l'écriture ne le vérifie pas ; seul appelant aujourd'hui `ExerciseScreen` (geste à définition unique). À câbler en A2.2 : évaluer avant chaque enregistrement et présenter le dialogue, puis l'étape de complétion.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-1-feuille-parametres-mfn.md`
  summary: Un Exercice frère incomplet (`missingPhaseIds`) peut être choisi pour une Séance depuis la sélection du Catalogue ; il n'est refusé qu'à l'enregistrement (`toCreateSessionInput`), sans signalement à l'insertion.
  evidence: hors CE-UI-10 (CE-T03-07, sélection) ; ch13 l.846 et l.894 « frère incomplet non exécutable », « exclusion des frères incomplets du lancement ». À traiter en A4.1 (sélection désignant une définition précise) ; aucun parcours d'interface ne crée de frère incomplet avant A2.2.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-1-feuille-parametres-mfn.md`
  summary: La copie d'une occurrence locale non enregistrée (`pendingLocalMovement`) a sa structure de phases verrouillée alors que sa source reste modifiable : à l'enregistrement, les deux partagent un Mouvement créé depuis la source avec des structures différentes.
  evidence: préexistant (avant A2.1 les deux étaient modifiables) ; décision renvoyée à Hermann (verrouiller aussi la source dupliquée, ou rendre la copie modifiable jusqu'au premier enregistrement ; ch10 MFN-09 l.444-446).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-1-feuille-parametres-mfn.md`
  summary: Le verrou de structure d'une occurrence n'a pas d'indice d'accessibilité (raison de l'indisponibilité) : seul l'état disabled est annoncé.
  evidence: aucun texte documenté pour cet indice (RM-092, aucune invention) ; proposer à Hermann un libellé, sur le modèle de « Nombre de séries imposé par le circuit ».
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-1-feuille-parametres-mfn.md`
  summary: La création d'un Exercice sur un geste repris (origine SAME_MOVEMENT ou VARIANT) devra transmettre à la Feuille le compteur de phase du Mouvement repris (`nextPhaseId`), et non max + 1.
  evidence: A2.1 ne câble que l'édition Catalogue (`movementNextPhaseId` de la définition lue) ; le parcours de reprise n'existe qu'en A2.3.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-2-contenu-partage-verrouillage.md`
  summary: Report A1.3 « question d'identité non imposée à l'écriture » traité par A2.2 — l'Éditeur évalue toute correction avant d'écrire, présente la question d'identité et l'étape de complétion.
  evidence: `ExerciseScreen.tsx` (`handleFinish` → `assessActivityDefinitionCorrection`) ; tests `ExerciseScreen.mfn.a22.integration.test.tsx`. Le service n'impose toujours pas l'accusé du choix à l'écriture (contrat A1.3 inchangé).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-2-contenu-partage-verrouillage.md`
  summary: Après « Créer un nouvel exercice » / « En faire un geste distinct », le rattachement au groupe de niveaux d'origine n'est pas proposé (MFN-08, CE-T03-04 §14 : « proposé sans présélection ») ; aucun rattachement n'est fait.
  evidence: aucun libellé documenté ni frame pour cette proposition ; option conservatrice `joinOriginGroup: false` (MFN-05, rattachement ultérieur possible MFN-06). À décider par Hermann, à câbler avec le popover de niveau (A3.1).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-2-contenu-partage-verrouillage.md`
  summary: Les refus d'une correction partagée (frère inéligible, durée de frère invalide ou somme hors bornes, complétion devenue nécessaire entre l'évaluation et l'écriture) aboutissent au message générique « L'exercice n'a pas pu être enregistré. Réessayez. » et l'étape de complétion rouverte repart vide.
  evidence: `ExerciseScreen.tsx` `proceedWithCorrection` / `writeCorrection` ; aucun texte documenté pour ces refus (RM-092). À proposer à Hermann (texte par refus, contrôle de la somme à l'étape, conservation des saisies).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-2-contenu-partage-verrouillage.md`
  summary: Le crayon « Modifier le geste » disparaît à l'appui sans déplacer le focus VoiceOver ni annoncer le déverrouillage.
  evidence: `EditMovementAction` démonté à l'appui ; à constater en recette JA avec VoiceOver ; si le focus se perd, le placer sur le Nom (`AccessibilityInfo.setAccessibilityFocus`).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-3-recherche-suggestions-gestes.md`
  summary: Report A2.1 « compteur de phase sur geste repris » traité — la reprise (route A2.2, ou choisie en place par la suggestion ou la recherche A2.3) transmet `movement.nextPhaseId` à la Feuille ; la variante crée un geste neuf (compteur max + 1).
  evidence: `ExerciseScreen.tsx` (`fetchDefinition`, `setMovementNextPhaseId(movement.nextPhaseId)`) ; parcours `ExerciseScreen.mfn.a23.integration.test.tsx`.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-3-recherche-suggestions-gestes.md`
  summary: « Variante de ce geste » (sous-titre Figma « Crée un niveau de plus dans la progression ») n'écrit aucun rattachement au groupe d'origine (`joinOriginGroup: false`) au Catalogue, et, créée depuis une Séance, ne garde aucun lien avec son origine (création locale indépendante).
  evidence: MFN-06 (ch10 l.390) « proposer le rattachement au groupe d'origine » sans libellé ni frame ; MFN-05 « appartenance toujours choisie ». À décider par Hermann avec le point 1 d'A2.2 (feuille de proposition sans présélection, ou choix « Variante » valant rattachement explicite), à câbler en A3.1.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a2-3-recherche-suggestions-gestes.md`
  summary: Les gardes de réponses hors d'ordre (`requestRef` de `MovementSearchScreen` et de `useMovementOriginChoice.proposeFor`, `enabledRef` / `overlayRef`) ne sont couvertes par aucun test à résolution différée.
  evidence: revue A2.3 (lacunes de vérification) ; demande une doublure de `searchMovements` à promesse contrôlée ; courses peu probables sur appareil (lecture locale rapide).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a3-1-pastille-popover-niveau.md`
  summary: Reports A2.2 et A2.3 « rattachement au groupe » examinés en A3.1 — « Ajouter un niveau » du popover est branché (`joinOriginGroup: true`, inséré juste après l'origine) ; la variante des suggestions et la nouvelle identité (« Créer un nouvel exercice » / « En faire un geste distinct ») restent sans rattachement.
  evidence: MFN-06 (ch10 l.391) et CE-T03-04 §14 demandent une PROPOSITION de rattachement sans présélection, sans libellé ni frame ; MFN-05 l.370 « appartenance toujours choisie ». À décider par Hermann (feuille Oui / Non à libeller, ou « Variante de ce geste » valant rattachement) ; à câbler alors dans `ExerciseScreen.tsx` (`setVariantOrigin({ …, joinOriginGroup })`, `writeNewIdentity`).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a3-1-pastille-popover-niveau.md`
  summary: Garde d'abandon sur « Changer de niveau » / « Ajouter un niveau » (`router.replace` depuis un brouillon modifié) non démontrée par un test : `useCompositionExitGuard` est simulé dans les parcours.
  evidence: revue A3.1 (lacunes de vérification) ; `usePreventRemove` intercepte la suppression d'écran d'un remplacement dans la pile native, à constater en recette JA (modifier un Exercice, choisir un autre niveau : « Abandonner les modifications ? »).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a3-1-pastille-popover-niveau.md`
  summary: Panneau de repli du popover de niveau (Android, web) : ni retour à l'étape précédente, ni recadrage dans l'écran (pastille près d'un bord, longue liste de niveaux).
  evidence: rendu `NON VÉRIFIABLE` (Figma ne dessine que le menu natif iOS) ; fermer et rouvrir suffit ; à reprendre si Android entre en recette.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a3-2-consultation-reordonnancement-niveaux.md`
  summary: Retrait d'un membre du groupe (`detachFromGroup`, MFN-05 « Retirer un membre… ») et rattachement ultérieur (MFN-06) sans accès dans l'interface.
  evidence: aucun libellé, frame ni parcours documenté ; le plan A3.2 ne couvre que la liste et le réordonnancement. À décider par Hermann avec les reports de rattachement d'A2.2 / A2.3 / A3.1.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a3-2-consultation-reordonnancement-niveaux.md`
  summary: Lignes de l'écran des niveaux à hauteur fixe de 36 (`DraggableRow`, AD-28) : nom tronqué sur une ligne, texte agrandi possiblement rogné ; poignée à cible 36.
  evidence: géométrie du composant accepté réutilisé sans modification (plan §3, §8) ; à constater en recette JA (360 / 402 / 440, texte agrandi).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a3-2-consultation-reordonnancement-niveaux.md`
  summary: Gardes « aucune navigation pendant une écriture en vol » d'`ExerciseScreen` (`onChangeLevel`, `onAddLevel` d'A3.1, `onReorderLevels` d'A3.2) non couvertes par un test.
  evidence: revue A3.2 (lacunes de vérification) ; un test d'intégration commun, `Terminer` ralenti par une écriture différée puis appui sur chaque entrée du popover, couvrirait les trois.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-a4-1-catalogue-par-geste-selection.md`
  summary: Report A2.1 « frère incomplet sélectionnable pour une Séance, refusé seulement à l'enregistrement » traité par A4.1 (option conservatrice, à valider par Hermann) — le frère reste sélectionnable (définition active, durées = paramètres modifiables de l'occurrence, MFN-02, MFN-09), signalé par le résumé existant « Paramètres à compléter. » sur la carte de choix puis sur l'occurrence ; `Continuer` reste inactif tant qu'il n'est pas complété ; aucun message supplémentaire (D-389).
  evidence: `useActivityCatalogue.ts` (ordre regroupé), `ActivitySelectionScreen.tsx` (`SelectionRow` inchangé) ; tests `features/activities/__tests__/catalogueByMovement.a41.test.tsx`. Alternative non retenue : exclure le frère de la modale. Le lancement reste réservé aux Exercices exécutables.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-recette-ja-corrections.md`
  summary: Reports A1.2 « filiation de la copie locale » et A2.1 « copie verrouillée » traités par la recette JA — décision de Hermann du 26/10/2026 : « La copie d'un exercice local doit être déverrouillée » (copie en attente modifiable comme sa source jusqu'au premier enregistrement). Règle de filiation à l'enregistrement (option conservatrice, à valider par Hermann) : la copie ne partage le Mouvement de sa référence que si son geste est identique (nom modulo suffixe de copie, description, médias, Catégorie, Zones, structure des phases) ; sinon elle crée son propre Mouvement.
  evidence: `ExerciseScreen.tsx` (`openedOccurrenceOf`), `composition.ts` (`settlePendingLocalCopies`), `SessionDraft.ts` (`toCreateSessionInput`, `toUpdateSessionInput`) ; tests `composition.test.ts`, `SessionDraft.test.ts`, `ExerciseScreen.test.tsx`. Propagation documentaire à proposer à Hermann : MFN-09 l.448 (« Ce nom reste non éditable ») et MFN/AC32 dépassés pour la copie locale non enregistrée.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-recette-ja-corrections.md`
  summary: Nom en saisie, un appui sur la Carte Paramètres ou la Description ferme seulement le clavier (décision de Hermann du 26/10/2026) ; les accès de la rangée de classification (Catégorie, Zone, Niveau) restent hors périmètre et s'ouvrent toujours depuis la saisie du nom.
  evidence: `ActivityEditorForm.tsx` (`isNameFocused`, `keyboardShouldPersistTaps` `never` / `handled`, `pointerEvents` de `exercise-description-steps-area`). Documents à mettre à jour (lot à proposer à Hermann) : ch13 CE-T03-04 l.854 (« Toucher la zone Paramètres ouvre CE-UI-10 » : premier appui pendant la saisie du nom = fermeture du clavier seulement) et ch06 l.1897. Rangée de classification, sources : `src/features/activities/ActivityEditorForm.tsx` (accès Catégorie et Zones dans le bandeau, hors du `ScrollView` `exercise-body`), menu Niveau iOS natif (`MovementLevelMenu.tsx`, `Menu` SwiftUI d'`@expo/ui`), `nameEndSuppressedRef` (A2.3, fin de saisie du nom provoquée par l'ouverture d'une feuille). Proposition à Hermann : (1) garder le comportement actuel (accès délibéré, le clavier se ferme à l'ouverture de la feuille ou du menu) ; ou (2) appliquer la même règle du premier appui à Catégorie et Zones — le menu Niveau natif ne peut pas être intercepté sans le remplacer, il garderait le comportement actuel.

- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-2-phases-motif-commun.md`
  summary: Retirer le cas `INELIGIBLE` / `INELIGIBLE_SIBLINGS`, devenu inatteignable depuis R-2 (sharedCorrection.ts:83, 90, 233, 312 ; ActivityDefinitionService.ts:65, 148).
  evidence: `planSiblingCorrection` ne renvoie plus `INELIGIBLE` (phases communes aux séries variables) ; à traiter avec R-4, qui réécrit la condition de correction partagée.

- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-3-occurrence-sans-copie-migration-013.md`
  summary: Nom de Mouvement déjà pris ou en double dans le brouillon : la Séance n'est pas enregistrée, mais l'interface n'en dit pas la cause (erreur générique, ou `Continuer` inactif).
  evidence: `CompositionScreen.handleSave` capte `DuplicateMovementNameError` comme une erreur quelconque ; `validateSessionMovements` rend `DUPLICATE` sur `exercise.name`. À traiter avec R-5 (contrôle d'unicité pendant la saisie, C01).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-3-occurrence-sans-copie-migration-013.md`
  summary: Un Mouvement créé depuis une Séance reste en base après le retrait de sa dernière occurrence et garde son nom (medium, non vérifié).
  evidence: Il reste trouvable par `MovementRepository.search`. À vérifier avec R-5 (écran de recherche R03) : il y est visible, et il peut être supprimé ou réutilisé.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-3-occurrence-sans-copie-migration-013.md`
  summary: La portée affichée d'une correction du Catalogue doit inclure les occurrences de Séance.
  evidence: `affectedDefinitionCount` ne compte que les définitions ; R-4 refait le dialogue avec le décompte définitions plus occurrences.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-3-occurrence-sans-copie-migration-013.md`
  summary: migration013, comme la 012, laisse sur l'appareil les fichiers des médias dont les lignes sont supprimées.
  evidence: L'en-tête de `migration013.ts` le dit (« les fichiers physiques ne sont pas touchés ») ; aucune purge n'est prévue.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-3-occurrence-sans-copie-migration-013.md`
  summary: La traduction d'une violation de l'index UNIQUE en `DuplicateMovementNameError` (`withNameUniqueness`) n'est couverte par aucun test.
  evidence: Les tests passent toujours par la vérification préalable `assertNameAvailable` ; il faudrait un cas où cette vérification passe et l'index refuse l'écriture.

- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-4-dialogue-sauvegarde-c03-crayon.md`
  summary: Reports R-2 « cas `INELIGIBLE` / `INELIGIBLE_SIBLINGS` inatteignable » et R-3 « portée affichée sans les occurrences » traités par R-4 — le cas est retiré (`sharedCorrection.ts`, `ActivityDefinitionService.ts`) ; le dialogue C03 annonce les autres exercices (définitions et occurrences persistées).
  evidence: `assessSharedCorrection` rend `decision` (`decideMovementSave`) ; tests `sharedCorrection.a13.test.ts`, `ExerciseScreen.mfn.a22.integration.test.tsx`.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-4-dialogue-sauvegarde-c03-crayon.md`
  summary: Crayon en Séance (C04) + « Mettre à jour » qui change l'ENSEMBLE des phases : le Mouvement est réécrit à l'enregistrement de la Séance, mais les Exercices du Catalogue qui le partagent ne passent par aucune étape de complétion (leurs durées des phases nouvelles manquent).
  evidence: `writeSessionMovements` (`SqliteSessionRepository.ts`) appelle `updateMovementContent` sans plan des frères (comportement R-3 inchangé). À vérifier (lecture d'un frère après une telle correction) et à arbitrer par Hermann : étape de complétion depuis la Séance, ou frère laissé incomplet.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-4-dialogue-sauvegarde-c03-crayon.md`
  summary: Le crayon n'est proposé que sur une occurrence EXISTANTE d'un Mouvement enregistré ; une occurrence en cours de création reprise par « Même mouvement » (suggestion ou recherche) reste verrouillée sans crayon (MFN-09, option la plus simple).
  evidence: `ExerciseScreen.tsx` (`canUnlockMovement`, `repriseLocked`). Une lecture en échec de l'usage du Mouvement à `Terminer` laisse l'éditeur ouvert sans message (journal seulement).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-4-dialogue-sauvegarde-c03-crayon.md`
  summary: « Créer un nouveau mouvement » avec un nom déjà pris (y compris un changement de casse seul, même nom normalisé) échoue à l'enregistrement avec l'erreur générique.
  evidence: `replaceOccurrenceWithNewMovement` et `chooseNewIdentity` laissent l'unicité au repository (`DuplicateMovementNameError`). À traiter avec R-5 (contrôle pendant la saisie, C01), comme le report R-3 sur les noms en double.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-4-dialogue-sauvegarde-c03-crayon.md`
  summary: Un échec de lecture du Mouvement au déverrouillage par le crayon n'est que journalisé ; le crayon reste actif sans message.
  evidence: `unlockMovement` dans `ExerciseScreen.tsx` : `console.error` seul.

- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-5-creation-unicite-variante-recherche.md`
  summary: Reports R-3 « nom déjà pris ou en double dans le brouillon, erreur générique » et R-4 « Créer un nouveau mouvement avec un nom déjà pris » traités par R-5 — unicité contrôlée pendant la saisie dans les deux éditeurs (mouvements enregistrés et Mouvements `NEW` / `EDITED` référencés du brouillon, identité éditée exclue), `Terminer` indisponible — c'est ce contrôle qui empêche deux créations de même nom dans le brouillon ; « Créer un nouveau mouvement » refusé si la clé est prise, original compris ; `DuplicateMovementNameError` (nom pris en base entre la saisie et l'enregistrement) → message propre (éditeur Catalogue, Composition). Report R-3 « mouvement sans occurrence visible et réutilisable » vérifié : `listMovementChoices` liste tous les mouvements, l'écran de recherche R03 les montre sur « Voir tous les mouvements » et la reprise fonctionne.
  evidence: `useMovementOriginChoice.tsx`, `ExerciseScreen.tsx`, `CompositionScreen.tsx` ; tests `ExerciseScreen.r5.integration.test.tsx`, `ExerciseScreen.r4.integration.test.tsx`, `CompositionScreen.test.tsx` (« R-5 »).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-5-creation-unicite-variante-recherche.md`
  summary: Saisie et modification des alias (R05) sans interface : les alias sont recherchés et dédoublonnés, mais aucun champ ne permet d'en saisir (aucune frame, aucun parcours ; DSF l.156 « la saisie/édition des alias … reste à couvrir »).
  evidence: `Movement.aliases`, `movement_aliases` (R-3) ; `rankMovements` les lit. À décider par Hermann : emplacement et forme du champ (contenu du mouvement, soumis au dialogue C03), puis transport dans `CreateActivityDefinitionInput` (création Catalogue : `aliases: []` codé dans `SqliteActivityDefinitionRepository.create`).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-5-creation-unicite-variante-recherche.md`
  summary: « Ajouter un niveau » du popover (A3.1) n'applique pas encore C02 : contenu de l'origine repris (description, médias, paramètres), insertion toujours après l'origine, sans le choix Plus facile / Plus difficile du déploiement `10152:20369`.
  evidence: `ExerciseScreen.tsx` (`levelOriginDefinitionId`), `MovementLevelMenu.tsx` (`onAddLevel`). Le domaine et les repositories acceptent déjà `placement` (`BEFORE_ORIGIN` / `AFTER_ORIGIN`). À traiter avec la commande Niveau (R-6) ou sur décision de Hermann.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-5-creation-unicite-variante-recherche.md`
  summary: Carte Résultat sans Zones corporelles ni mention d'origine locale, que R04 cite parmi le « contexte permettant le choix … si nécessaire » ; la carte `10199:22268` ne dessine que photo, nom, niveau et description.
  evidence: `MovementResultCard.tsx` suit le relevé ; la note « Les mouvements créés dans une séance apparaissent aussi. » reste sur l'écran de recherche. À trancher en recette JA2 (ajout d'une ligne Zones, ou carte en l'état).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-5-creation-unicite-variante-recherche.md`
  summary: Rendu du panneau sous le nom, de l'invite grise superposée et de l'écran de recherche non constaté sur appareil (position par `onLayout`, ombre, invite alignée sur le texte du champ, clavier visible).
  evidence: tests fonctionnels seulement ; à constater en recette JA2 (360 / 402 / 440, texte agrandi, Android hors recette).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-5-creation-unicite-variante-recherche.md`
  summary: Le panneau reste disponible après le choix d'une Catégorie ou de Zones, mais « Utiliser ce mouvement » les remplace par celles du mouvement choisi.
  evidence: Cohérent avec C05 (le contenu de l'occurrence vient du mouvement), mais contraire à la lettre de MFN-06 (« jamais d'écrasement silencieux »), qui est antérieur. À constater en JA2 et à confirmer par Hermann.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-5-creation-unicite-variante-recherche.md`
  summary: Une variante de Séance dont le mouvement d'origine a disparu avant l'enregistrement bloque la Séance avec l'erreur générique.
  evidence: `writeSessionMovements` lève sur l'échec de `joinMovementGroup` ; le `levelOrigin` du brouillon n'est jamais retiré.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-5-creation-unicite-variante-recherche.md`
  summary: Aucune pastille « Niveau N » pour une variante créée en Séance, contrairement au Catalogue.
  evidence: `CompositionExerciseEditor` ne calcule pas `level` ; la commande Niveau en Séance relève de R-6.

- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: Reports R-5 « Ajouter un niveau pas aligné sur C02 » et « pastille Niveau N absente pour une variante créée en Séance » traités par R-6. Au Catalogue, « Ajouter un niveau » est un sous-menu natif « Plus facile / Plus difficile » (MFN-07 l.371, `10152:20369`) : insertion avant / après l'origine, description et médias vierges, Catégorie et Zones reprises, pastille du rang prévu. En Séance, une variante (choisie dans l'éditeur, ou Mouvement `NEW` rouvert) montre la pastille de son rang prévu, sans menu.
  evidence: `MovementLevelMenu.tsx`, `ExerciseScreen.tsx` (`levelPlacement`, `variantLevelOrigin`) ; tests `ExerciseScreen.mfn.a31.integration.test.tsx`, `ExerciseScreen.r6.integration.test.tsx`, `MovementLevelMenu.test.tsx`.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: « Ajouter un niveau » est indisponible en reprise et sur une occurrence de Séance (option conservatrice). MFN-07 ne dit pas si, en Séance, le niveau créé remplace l'occurrence ou en ajoute une.
  evidence: `ExerciseScreen.tsx` (`onAddLevel: null` en reprise et en occurrence). À décider par Hermann ; le domaine accepte déjà `levelOrigin` en Séance (R-5).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: Garde d'abandon sur un remplacement (risque cité par la proposition §R-6) : après un changement de niveau, l'occurrence diffère de l'ouverture, donc la fermeture passe par le dialogue d'abandon existant ; confirmer restitue l'occurrence. Couvert par les tests seulement avec une garde simulée.
  evidence: `ExerciseScreen.tsx` (`shouldBlockExit`, `useCompositionExitGuard`). À constater en recette JA2.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: La capture `10070:20073` (« Durées à compléter », Feuille ouverte) n'est pas reproduite. Après un changement de niveau aux durées manquantes, l'éditeur affiche « Paramètres à compléter. » et `Terminer` reste indisponible ; la Feuille ne s'ouvre pas d'elle-même, et le titre reste celui de l'éditeur.
  evidence: capture datée, sans règle écrite (DSF l.153 : la capture « établit le parcours et son titre, pas l’état de champs manquants ni le blocage de validation ») ; le titre « Durées à compléter » et l’ouverture de la Feuille sont à trancher par Hermann en JA2.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: Le suffixe « - Nn » d'une carte est lu en base. Une variante créée en Séance et pas encore enregistrée n'en a pas sur sa carte de Composition, et un mouvement corrigé dans le brouillon garde son ancien nom dans la liste des niveaux du menu.
  evidence: `listMovementLevelPositions`, `getMovementLevels` (lecture seule de la base) ; rendu à constater en JA2.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: Rendu du suffixe (« Squats - N2 (copie 2) » : ordre des deux suffixes, troncature des noms longs) et du sous-menu natif « Ajouter un niveau » non constatés sur appareil.
  evidence: tests fonctionnels seulement ; à constater en recette JA2 (360 / 402 / 440, texte agrandi).
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: La règle du crayon diffère selon le contexte (option conservatrice). En Séance, il est retiré après un changement de niveau jusqu'à `Terminer` ; en reprise au Catalogue, il reste disponible et corrige le mouvement choisi.
  evidence: `ExerciseScreen.tsx` (`canUnlockMovement`, `contentLocked`). À valider par Hermann.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: L'écran des niveaux ouvert depuis une occurrence de Séance réordonne le groupe en base immédiatement (comportement A3.2). L'abandon de l'éditeur ou de la Séance ne l'annule pas.
  evidence: `MovementLevelsScreen` (écriture directe), ouvert depuis `CompositionExerciseEditor`. À confirmer par Hermann en JA2.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: `listMovementLevelPositions` lit tous les mouvements, puis chaque groupe (1 + G lectures) à chaque rechargement du Catalogue et à chaque retour sur la Composition.
  evidence: `ActivityDefinitionService.ts` (positions) ; une requête unique sur l'appartenance aux groupes suffirait.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-6-niveaux-tous-contextes.md`
  summary: La relecture des suffixes « - Nn » au retour sur la Composition n'est couverte par aucun test.
  evidence: `useMovementLevelPositions(…, categoriesFocusToken)` ; le seul test vérifie la première lecture.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-7-phases-durees-signalements.md`
  summary: Le défilement au dépliage de « Durée de l'exercice » (`scrollToEnd` dans `onLayout` de la ligne Fin) peut précéder la mise à jour de la taille du contenu et s'arrêter trop tôt.
  evidence: maybe-false, non reproductible en Jest ; à constater en recette JA3 sur iPhone. Si avéré : déclencher depuis `onContentSizeChange` ou viser la position mesurée de la ligne.
- source_spec: `_bmad-output/pre7/implementation-artifacts/spec-r-7-phases-durees-signalements.md`
  summary: La couleur rouge de « Paramètres à compléter. » dans `SiblingCompletionStep` n'est vérifiée par aucun test.
  evidence: Seul `ExerciseScreen.mfn.a22.integration.test.tsx:403` vérifie la présence de la ligne, pas sa couleur.
