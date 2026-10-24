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
