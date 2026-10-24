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
