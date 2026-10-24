---
title: 'A2.3 — Création : recherche et suggestions de gestes'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '29373454a0f566383985e33e8bf922a082417f4f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A2-context.md'
  - '{project-root}/src/features/activities/README.md'
  - '{project-root}/src/features/sessions/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La création d'un Exercice (Catalogue ou Séance) ne propose ni suggestion de geste proche ni recherche explicite des gestes (MFN-06) : toute création produit un geste indépendant, la recherche de `SqliteMovementRepository` n'est pas exposée, et le point d'entrée « geste repris » d'A2.2 n'est branché sur aucun parcours.

**Approach:** Exposer la recherche par le service (geste, nombre d'Exercices du Catalogue, rang et total du groupe dérivés) ; dans l'éditeur en création, tant que seul le nom est saisi : feuille de suggestion `9882:19049` à la fin de la saisie d'un nom proche (trois choix explicites, rien de présélectionné, « Rechercher un autre geste »), lien de recherche explicite indépendant de la similarité, écran de recherche `9959:19623` (gestes locaux compris) dont la sélection reprend le geste réellement choisi. Effets : même geste → reprise (Catalogue : contexte A2.2 lecture seule + crayon ; Séance : occurrence portant la filiation, contenu verrouillé) ; variante → nouveau geste, champs vides initialisés depuis l'origine, enregistrement direct sans question d'identité ; indépendant → création inchangée. Rien n'est écrit avant `Terminer`.

## Boundaries & Constraints

**Always:** MFN-04, MFN-05 (aucun rattachement automatique), MFN-06, MFN-07 (initialisation depuis l'original), MFN-08 (variante sans question), MFN-09 ; D-439 (recherche spécialisée, ne lève pas D-221 — aucune recherche dans les listes Catalogue) ; relevé `DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md` ; suggestion purement lexicale (nom normalisé, mots entiers), jamais une attribution ; aucune sélection n'écrase une saisie autre que le nom ; Annuler / abandon sans résidu (aucune écriture, aucune marque « déjà utilisé ») ; textes au lexique, libellés Figma ; « geste », jamais « mouvement » ; cibles ≥ 44 ; `TextInput` et `Modal` natifs ; services A1.3 seuls pour écrire ; comptes et rangs calculés ; trois contrôles verts ; tests existants non affaiblis.

**Never:** recherche dans les listes Catalogue ; proposition de rattachement au groupe et popover de niveau (A3.1) ; Catalogue regroupé (A4.1) ; migration, schéma, `tokens.ts`, `package.json`, `app.json`, `.github/`, `main` ; crayon sur une occurrence.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Nom proche | création, seul le nom « Squats assistés » saisi, geste « Squats » existe | à la fin de la saisie : feuille, carte du geste (rang, nombre d'Exercices), trois choix, « Rechercher un autre geste » | recherche en échec → aucune feuille |
| Aucun nom proche | « Gainage » | aucune feuille | N/A |
| Même geste (Catalogue) | choix | contenu du geste en lecture seule + crayon ; Terminer → `SAME_MOVEMENT` | geste introuvable → erreur de chargement existante |
| Même geste (Séance) | choix | occurrence `sourceMovementId` = geste, contenu verrouillé ; Continuer marque le geste utilisé | N/A |
| Variante | choix | nom saisi conservé, champs vides repris de l'origine ; Terminer → `VARIANT` sans question, `joinOriginGroup: false` (Catalogue) ; création locale (Séance) | N/A |
| Indépendant | choix | création inchangée ; le même geste n'est plus proposé | N/A |
| Recherche | lien ou « Rechercher un autre geste » | écran « Choisir un geste », filtre par nom, gestes locaux compris ; sélection = même geste | ✕ → retour au brouillon intact |
| Saisie détaillée commencée | description, média, Catégorie, Zones ou paramètres saisis | ni lien ni suggestion | N/A |
| Abandon | après un choix | confirmation d'abandon existante ; rien d'écrit | N/A |

</frozen-after-approval>

## Code Map

- `src/infrastructure/database/repositories/SqliteMovementRepository.ts` -- `search(query)` (contenu du nom normalisé ; `""` = tous), `countDefinitions`, `listGroup` : réutilisés tels quels.
- `src/features/activities/ActivityDefinitionService.ts` -- ajouter `searchMovements(query)` → `MovementChoice[]` (geste, `definitionCount`, `level {rank,total} | null`), `supportsMovementSearch` (patron `supportsSharedCorrection`) ; `getMovement`, `createActivityDefinitionWithOrigin` existants.
- Nouveau domaine pur `src/domain/activities/movementSuggestion.ts` -- `findCloseMovement(name, candidates)` (égalité, sinon séquence de mots entiers incluse dans l'autre ; départage : écart de longueur, nom, id), `movementLevelPosition(movement, members)` (singleton / sans groupe → `null`, MFN-05).
- `src/features/activities/ActivityEditorForm.tsx` -- props `onNameEndEditing`, `movementSearchAction` (lien en tête du contenu).
- Nouveaux `src/features/activities/MovementSuggestionSheet.tsx` (feuille `9882:19125` : coins 24, titre Semi Bold 20, message 14 `#7A7A80`, carte `#F3F4F9` 354 × 72 rayon 12 + gabarit 48 `#DEE2EC` rayon 10, choix 64 bordés `#E4E7EF`, lien Medium 15 `primary`) ; `MovementSearchScreen.tsx` (`Modal` plein écran, en-tête « Choisir un geste », champ `#F3F4F9` 44 rayon 12, note 13, cartes 72 bordées, gap 10, marges 24/16) ; `movementChoicePresentation.ts` (sous-titre « Niveau r sur t · n exercices »).
- `src/features/sessions/ExerciseScreen.tsx` -- Catalogue : `repriseMovementId` en état (sélection = reprise A2.2 en place, Profil réappliqué) ; `variantOrigin` → écriture `VARIANT` ; Séance : reprise (filiation, contenu verrouillé si `local.sourceMovementId`), variante (préremplissage) ; garde « seul le nom » ; mouvements déjà proposés écartés.
- `src/shared/i18n/resources/fr.ts` -- libellés Figma.
- Ne pas toucher : repositories, `IdentityDecisionSheet`, `SiblingCompletionStep`, `ExecutionParametersSheet`, Catalogue (`CatalogueScreen`).

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/movementSuggestion.ts` + tests -- proximité lexicale, rang dérivé.
- [x] `ActivityDefinitionService.ts` + tests (SQLite réelle) -- `searchMovements`, `supportsMovementSearch`.
- [x] `fr.ts`, `movementChoicePresentation.ts`, `MovementSuggestionSheet.tsx`, `MovementSearchScreen.tsx` + tests de rendu.
- [x] `ActivityEditorForm.tsx` -- fin de saisie du nom, lien de recherche.
- [x] `ExerciseScreen.tsx` + tests d'intégration (matrice, Catalogue et Séance, sans résidu).
- [x] READMEs `src/features/activities/`, `src/features/sessions/`, `src/domain/`, `deferred-work.md`, `sprint-status.yaml`.

**Acceptance Criteria:**
- Given un geste local (créé dans une Séance enregistrée, absent du Catalogue), when il est recherché et choisi puis l'Exercice terminé, then la définition référence ce geste et aucune autre définition n'est créée (DSF recette 4, MFN/AC19).
- Given une création abandonnée après un choix, when l'abandon est confirmé, then aucun geste, aucune définition, aucune marque « déjà utilisé » n'est écrit.
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts.

## Design Notes

- **Disponibilité :** création seulement (Catalogue `new` sans `movementId` de route, nouvelle occurrence), avant tout choix, et tant que le brouillon ne porte que le nom (« avant la saisie détaillée », ch03 l.152) : aucune sélection ne peut écraser une saisie autre que le nom, que le choix explicite d'un geste remplace par le sien.
- **Sélection dans la recherche :** reprise du geste choisi (DSF « Sélection d'un résultat → reprise du geste réellement choisi »).
- **Variante :** MFN-06 « Créer une variante / un niveau » = MFN-07 : description, médias, Zones et Catégorie initialisés depuis l'origine (champs vides seulement), paramètres non repris (plusieurs Exercices possibles, MFN/AC16).

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- Implémentation conduite directement par l'agent de la story (investigation dans son contexte, comme A1.3 à A2.2). Checkpoints pré-approuvés par Hermann (absent) ; spec conservée entière.
- **D-221 / MFN-06 :** D-221 (ch07 l.432) exclut toute recherche globale et toute recherche locale DANS LES CATALOGUES ; le complément de D-439 (ch07 l.19) et ch08 l.176 posent explicitement que la recherche spécialisée de gestes « ne généralise pas la recherche des Catalogues exclue par D-221 ». Aucune contradiction : la recherche est un état de l'éditeur (CE-T03-04 §11), les listes Catalogue restent sans recherche.
- **Figma (lecture seule, session MCP) :** `get_metadata` de `9882:19049`, `9959:19623`, `9891:39982` ; `get_design_context` de `9882:19125` (feuille) et `9959:19701` (liste). Aucun actif graphique : le « gabarit photo » est une place réservée grise, remplacée par la vignette du premier média quand il existe (`MediaPreview`, rendu du Catalogue). Aucun frame ne montre l'accès à la recherche dans le formulaire vide (le relevé retire l'état vide autonome) : lien « Rechercher un geste » en tête du contenu, `NON VÉRIFIABLE`.
- **Primitives :** feuille sur `Modal` native (comme `IdentityDecisionSheet`) ; recherche en `Modal` native plein écran au-dessus de l'éditeur (le brouillon reste monté, aucune route nouvelle) ; champ `TextInput` natif (`clearButtonMode`, `returnKeyType="search"`) — la barre de recherche native iOS (`headerSearchBarOptions`) n'existe que dans un en-tête de pile native, absent ici. iOS : l'écran de recherche n'est présenté qu'après `onDismiss` de la feuille (deux présentations natives simultanées échouent), procédé de `useReferenceSheet`.
- **Déclencheur de la suggestion :** `onEndEditing` du nom (clavier fermé, champ quitté ou validé) ; une seule proposition par geste et par éditeur ; échec de lecture : aucune feuille (journal).
- **Report A2.1 « compteur de phase sur geste repris » :** déjà câblé par A2.2 (`setMovementNextPhaseId(movement.nextPhaseId)` à la reprise) ; la reprise en place d'A2.3 passe par le même chargement. La variante crée un geste neuf (compteur max + 1, sans structure héritée). Occurrence de Séance reprise : structure verrouillée, aucune phase ajoutée.
- **« Déjà utilisé » à l'enregistrement de la Séance** pour une occurrence portant la filiation d'un geste existant : comportement du repository A1.2, couvert par `mfnPersistence.a12.test.ts` (l.278, l.473) ; non redémontré à l'écran.
- **Points renvoyés à Hermann (option conservatrice appliquée) :**
  1. Variante et groupe de niveaux : MFN-06 « proposer le rattachement au groupe d'origine » (ch10 l.390), sans libellé ni frame de proposition ; le sous-titre Figma « Crée un niveau de plus dans la progression » (`9882:19137`) est affiché tel quel, mais aucun rattachement n'est écrit (`joinOriginGroup: false`, MFN-05 l.364 « appartenance toujours choisie », aucun rattachement automatique). Proposition : à `Terminer` d'une variante, une feuille « Ajouter aux niveaux de {geste} ? » Oui / Non sans présélection (même question que le point 1 d'A2.2), en A3.1 ; ou bien considérer le choix « Variante de ce geste » comme le rattachement explicite (insertion après l'origine, MFN-07).
  2. Accès à la recherche explicite « avant la saisie détaillée » (ch10 l.392, ch03 l.152) : aucune frame ; lien texte « Rechercher un geste » (libellé du champ `9959:19703`, style de `9882:19141`) en tête du contenu, visible en création tant que seul le nom est saisi. Alternative : action d'en-tête (comme le crayon).
  3. Disponibilité limitée au brouillon « nom seul » : garantit qu'aucune sélection n'écrase une saisie (MFN-06 l.392) sans dialogue inventé ; après une saisie détaillée, ni suggestion ni lien. Alternative : garder l'accès et demander confirmation avant d'écraser (texte à fournir).
  4. Sélection d'un résultat de recherche = « même geste » (relevé l.52 « reprise du geste réellement choisi ») ; variante d'un geste trouvé par la recherche : non proposée. Alternative : présenter les trois choix après la sélection.
  5. Message de suggestion pour un geste sans Exercice au Catalogue (relevé l.71 : adapter ou formulation neutre) : « {nom} existe déjà. Voulez-vous le réutiliser ? » (texte nouveau, à valider). Sous-titre : nombre d'Exercices DU CATALOGUE (zéro omis) ; la mention Figma « Créé dans une séance » n'est pas affichée, l'origine d'un geste n'étant pas enregistrée (un geste du Catalogue dont les Exercices ont été supprimés n'est pas distinguable d'un geste local).
  6. Proximité de nom : lexicale (égalité normalisée ou suite de mots entiers), aucune similarité approximative (MFN-08 l.436 « aucun mécanisme de détection sémantique »). Alternative : seuil de similarité (fautes de frappe).
  7. Variante : description, médias, Zones et Catégorie initialisés depuis l'origine (MFN-07 l.402, MFN-05 l.375) ; paramètres non repris. Alternative : variante vierge (contraste du sous-titre Figma de « Même geste »).
  8. Création depuis une Séance, « Même geste » : contenu verrouillé sans crayon (MFN-09 : occurrence portant une filiation) ; corriger le geste reste possible depuis le Catalogue. Alternative : crayon et correction partagée depuis la Séance (non documenté).
  9. Liste de recherche vide : aucun texte (aucun texte documenté).

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification), sous-agents indépendants.

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | edge | Reprise en place : `profileApplied` réarmé alors que l'ancien brouillon est encore monté → Compte à rebours / Fin du Profil appliqués à l'ancien brouillon, pas au geste rechargé | medium | Vérifié (rendu suivant, `initial`/`value` non nuls) ; patch (brouillon vidé avant le réarmement ; test : Compte à rebours 7 du Profil relu, échoue sans le correctif) |
| 2 | blind | Fin de saisie du nom provoquée par l'ouverture d'une feuille (Paramètres, Catégorie, Zones) → suggestion présentée par-dessus cette feuille | medium | Vérifié (`Keyboard.dismiss` / présentation → `onEndEditing`) ; patch (fin de saisie ignorée quand elle suit l'ouverture d'une feuille, interne au formulaire ; test) |
| 3 | edge + blind + verification-gap | `openSearch` et réponse tardive de `proposeFor` pendant le fondu de fermeture iOS de la feuille, ou recherche ouverte → deux présentations ; `runPending` tardif efface une nouvelle suggestion | medium | Vérifié (`isSuggestionVisible` faux pendant le fondu) ; patch (garde « feuille montée ou recherche ouverte », `overlayRef`) |
| 4 | verification-gap | Garde « nom seul » non testée côté Séance, occurrence existante, paramètres seuls | medium | Gap pré-vérifié ; patch (tests) |
| 5 | verification-gap | Branche Android (`runPending` synchrone, retour système) jamais exécutée | medium | Gap pré-vérifié ; patch (test Android : recherche depuis la feuille, `onRequestClose` sans écriture) |
| 6 | verification-gap + blind | Reprise des médias de l'origine par la variante non observée (fixtures sans média) | medium | Gap pré-vérifié ; patch (test : origine à photo, variante relit `p1`, origine intacte) |
| 7 | edge | Mots séparés par espaces seulement : « Squats-sautés » jamais proche de « Squats » | low | Correction directe ; patch (séparation sur tout caractère ni lettre ni chiffre ; tests) |
| 8 | blind | Paragraphe A2.3 du README sessions collé à la liste A2.2 | low | Correction directe ; patch (ligne vide) |
| 9 | edge | `deferred-work.md` non mis à jour | low | Vérifié ; patch (report A2.1 traité, variante / groupe, courses non testées) |
| 10 | blind + verification-gap | Variante : sous-titre « Crée un niveau de plus » sans rattachement ; variante de Séance sans lien d'origine | medium | Réel ; aucun libellé ni frame pour la proposition (MFN-06), option conservatrice ; defer (`deferred-work.md`, point 1 renvoyé à Hermann, A3.1) |
| 11 | verification-gap | Réponses hors d'ordre (`requestRef`, `enabledRef`) non testées | low | Gap pré-vérifié, disposition defer ; defer (`deferred-work.md`) |
| 12 | blind | « Même geste » remplace le nom saisi (et, en Séance, Catégorie, Zones, médias, structure) sans avertir | false | Disponibilité limitée au brouillon « nom seul » : Catégorie, Zones, médias, description et paramètres sont vides ou initiaux (tests 4) ; le nom est remplacé par le choix explicite du geste affiché (point 3 renvoyé à Hermann) |
| 13 | blind | Choix « Variante » irréversible dans l'éditeur | low | Choix explicite ; revenir = abandonner la création ; rejeté |
| 14 | blind | Médias de la variante partagés par référence, risque de suppression de fichiers | low | `abandonMediaDraft` ne supprime que les copies préparées par ce brouillon ; même partage qu'A2.2 (nouvelle identité) ; rejeté |
| 15 | blind | Lectures N+1 (`countDefinitions` par geste), recherche à chaque frappe | low | Base locale de quelques dizaines de gestes ; optimisation = nouvelle requête de repository ; rejeté |
| 16 | blind | ✕ annoncé « Retour » | low | Même libellé que le ✕ de l'éditeur (`backAccessibilityLabel`) ; rejeté |
| 17 | blind | Feuille sans fermeture neutre sur iOS | low | « Geste indépendant » laisse la création inchangée (même effet qu'une fermeture) ; rejeté |
| 18 | blind | `suggestion` non remise à zéro après « Même geste » / « Variante » (feuille démontée avant `onDismiss`) | false | La disponibilité ne revient jamais après ces choix ; aucun rendu ni effet n'en dépend |
| 19 | blind | `proposeFor` compare un nom périmé (`value.name` de la fermeture) | false | `onChangeText` met l'état à jour avant `onEndEditing` ; le gestionnaire est celui du dernier rendu |
| 20 | blind | Échec de recherche affiché comme « aucun résultat » ; gestes orphelins listés | low | Aucun texte d'erreur documenté (RM-092) ; gestes sans définition proposés par règle (MFN-04 « La recherche continue de proposer ce geste ») ; rejeté |
| 21 | blind | Cibles du lien de la feuille par `hitSlop` | low | Même procédé que « Annuler » d'`IdentityDecisionSheet` (cible 48) ; rejeté |
| 22 | blind | Accès à la recherche et libellé non soumis à Hermann ; spec absente du diff | false | Points 2 et 5 des Implementation Notes ; spec et suivi hors diff de code par construction |
| 23 | edge | Échec de chargement après une reprise en place : brouillon perdu, seulement « Réessayer » | low | Geste lu à l'instant par la recherche ; seul le nom était saisi ; correction = restauration d'état ; rejeté |
| 24 | edge | Aucun test de rendu dédié à `MovementSearchScreen` | low | Écran exercé par les parcours d'intégration (titre, note, filtre, sélection, ✕, Android) ; rejeté |

Contrôles après correctifs : `npm test -- --maxWorkers=2` 165 suites, 4 258 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert. Avant revue : 165 suites, 4 254 tests.
