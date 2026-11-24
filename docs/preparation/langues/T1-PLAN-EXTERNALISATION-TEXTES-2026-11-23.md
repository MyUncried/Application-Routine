# T1 — Externalisation des textes restés dans le code : plan

> Chantier « Gestion des langues », lot T1 (`PLAN-GESTION-DES-LANGUES-2026-11-23.md` § 5). Base : `5117ee0` sur `claude/exciting-lovelace-iyn2wf` (= `main` `fe7d71d` + documentation langues).
> **STATUT : PLAN_READY_FOR_REVIEW** — aucun fichier applicatif ne sera modifié avant approbation.

## TÂCHE

Faire passer par le catalogue de textes (`src/shared/i18n`) tous les textes affichés ou prononcés qui sont encore écrits directement dans le code. Règle déjà en vigueur : RM-092 et D-081 (classe **A — conformité**). Aucune règle nouvelle.

## COMPRÉHENSION

- Le catalogue existe (`src/shared/i18n/resources/fr.ts`, `index.ts` qui expose `strings`) et est importé par 143 fichiers.
- Inventaire du 23/11. Méthode : analyse syntaxique TypeScript de `src/` et `app/`, littéraux de chaînes et textes JSX, commentaires exclus. Résultat : 958 littéraux ressemblant à du texte, dont **environ 360 textes français réellement destinés à l'utilisateur**, répartis dans 20 fichiers.
- **Résultat attendu : aucun changement visible ni audible.** Chaque texte reste identique au caractère près. Seul son emplacement change.

## PÉRIMÈTRE

### Inclus (CHANGE)

| Groupe | Fichiers | Textes (approx.) |
|---|---|---|
| E — Exécution | `features/execution/executionStrings.ts` (le fichier entier rejoint le catalogue), `features/execution/ExecutionScreen.tsx` (« coupé / activé »), `infrastructure/haptics/ExecutionSignalAdapter.ts` (**annonces vocales** : « Préparez-vous », « À suivre : … », ordinaux « première … dixième »…) | 88 |
| B — Bibliothèques et catalogue | `features/catalogue/LibraryScreens.tsx`, `PersonalLibraryScreens.tsx`, `libraryPresentation.ts`, `ProfileLibrariesSection.tsx`, `ImportedMovementBadge.tsx`, `importedMovements.ts` (« rév. »), `features/activities/MovementCatalogueList.tsx` (dialogues Archiver / Suppression impossible), `domain/catalogue/personalLibrary.ts` (message de doublon) | 260 |
| D — Divers | `features/sessions/SessionFilterSheet.tsx` (3), `shared/ui/KodjoSplash.tsx` (« Votre assistant du quotidien »), `domain/sessions/formatTimeline.ts` (« échec »), `infrastructure/catalogue/SqliteCatalogueRegistry.ts` (message affiché, à confirmer pendant l'implémentation) | 7 |

### Exclus (avec motif)

| Exclu | Motif | Traité dans |
|---|---|---|
| `domain/activities/executionPhrase.ts`, « Durée totale » d'`ActivityEditorForm.tsx` | Phrase de synthèse : d'abord simplifiée (décision du 23/11), puis gabarits par langue | T6 |
| `domain/categories/defaults.ts`, `features/reference-data/bodyZones.ts`, libellés de `features/sessions/sessionFormats.ts` | Référentiels et contenus KODJO : relèvent de la traduction des contenus | D4 / T7 |
| `domain/catalogue/MovementInbox.ts`, `catalogueEditing.ts` (« Création de la fiche… ») | Textes **enregistrés** dans les données (historique, notes). Les externaliser ferait varier les données selon la langue. | T7 |
| Écrans de diagnostic (`features/diagnostics/`, `devSoundDiagnosticMenu`), outils de recette « Routine Catalogue » (`app/catalogue-load.tsx`, `CatalogueLoadScreen`, `catalogueLoadPresentation`, `CatalogueLoadCommand`, `pickCatalogueFile`, import pilote, validations de `MovementCatalogueFile`), dossiers `testing/` | Outils internes, absents de la build publique | — (non traduits) |
| Journaux clavier (« Catégorie : champ focus »…) des sélecteurs Catégorie / Étiquette / Zones, `ReferenceValueDialog` | Traces de débogage, jamais affichées | — |
| Marqueurs de questions ouvertes (`formats/capabilities.ts`, `planExpansion.ts`) | Texte de conception interne | — |
| Messages d'erreur techniques en anglais, migrations | Non affichés à l'utilisateur | — |

### PRESERVE / FORBIDDEN

- **PRESERVE** :
  - texte exact (espaces insécables, apostrophes typographiques, guillemets, retours à la ligne) ;
  - accords existants (`Singular` / `Plural`, « 2d / 2e ») ;
  - ordre et rythme des annonces vocales ;
  - noms accessibles et `testID` ;
  - composants, styles et comportements ;
  - toutes les autres clés de `fr.ts`.
- **FORBIDDEN** :
  - modifier un texte ou corriger une coquille au passage (par exemple « l'exercice suivante » est conservé et signalé à part) ;
  - introduire un moteur de traduction ou `expo-localization` (lot T2) ;
  - toucher au générateur de phrases ;
  - changer une primitive, un composant ou une mise en page ;
  - réécrire massivement les tests existants.

## PLAN D'IMPLÉMENTATION

1. **Convention.**
   - Nouvelles clés dans `fr.ts`, groupées par écran : `execution`, `voice`, `libraries`, `personalLibraries`, `movementList`…
   - Variables avec la notation `{name}`, comme aujourd'hui.
   - Singulier et pluriel en deux clés, comme aujourd'hui.
   - Les petites fonctions de grammaire française (suffixe ordinal, ordinaux parlés, choix singulier/pluriel) rejoignent `src/shared/i18n/fr/` : elles dépendent de la langue et seront remplacées par langue au lot T2.
2. **Groupe E.**
   - `executionStrings` devient une section du catalogue.
   - Les fichiers qui l'importent pointent vers `strings`.
   - Les annonces vocales passent par des clés `voice.*`.
3. **Groupe B.** Remplacement fichier par fichier, une étape testée à la fois. `LibraryScreens.tsx` est traité en dernier, en plusieurs commits.
4. **Groupe D.**
5. **Garde-fou.**
   - Ajout d'un test qui analyse `src/` et `app/` et échoue si un texte français destiné à l'utilisateur réapparaît hors du catalogue.
   - Ce test s'appuie sur une liste d'exclusions explicite : le tableau « Exclus » ci-dessus.
   - Il empêche la dette de revenir.
6. **Rapport de livraison**, avec la preuve que les textes sont identiques (voir TESTS).

## MIGRATION / DONNÉES

Aucune. Aucune donnée enregistrée ne change.

## TESTS PRÉVUS

- `npx tsc --noEmit`, `npm run lint`.
- Suite Jest complète : les tests actuels vérifient les textes affichés et doivent rester verts **sans modification de leurs attentes**.
- **Preuve d'identité.**
  - Script ponctuel : pour chaque texte déplacé, comparer la chaîne produite avant et après (mêmes variables).
  - La liste des différences doit être vide.
- Nouveau garde-fou anti-régression (étape 5).
- **Sur iPhone (Hermann) :** contrôle rapide des écrans Bibliothèques, Profil › Bibliothèques et Exécution (dialogues et annonces vocales). Aucun changement attendu.

## RISQUES / EFFETS DE BORD

- **Texte altéré pendant le déplacement** (apostrophe droite remplacée par une typographique, espace perdu). Parade : preuve d'identité automatique.
- **Grande taille de `LibraryScreens.tsx`** (171 textes). Parade : commits par section.
- **Texte classé à tort comme interne**, ou l'inverse. Parade : la liste d'exclusion est revue avec ce plan.

## AMBIGUÏTÉS

- Coquilles relevées, **conservées en T1**, à corriger séparément si Hermann le souhaite :
  - « Passer à l'exercice suivante ? » ;
  - « avec l'exercice suivante » (`executionStrings.ts`, lignes 82–83).
- Le message de `SqliteCatalogueRegistry.ts` (« Registre de catalogue d'une version plus récente… ») est-il affiché à l'utilisateur ? À vérifier pendant l'implémentation. S'il ne l'est pas, il passe en exclusions.

## STATUT

PLAN_READY_FOR_REVIEW
