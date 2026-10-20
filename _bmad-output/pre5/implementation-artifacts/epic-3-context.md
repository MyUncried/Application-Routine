# Epic 3 Context: Un Éditeur d'Exercice à Description en étapes, conforme à Figma

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Finir l'écran principal de l'Éditeur d'Exercice. La Description devient une liste d'étapes numérotées : Entrée crée l'étape suivante et l'utilisateur ne gère plus la numérotation. La Carte des paramètres est allégée : Compte à rebours et Fin n'y figurent plus. `Terminer` est abaissé et ne masque jamais le dernier contenu. Le reste de l'écran est aligné sur les frames Figma actuelles. Le changement est de présentation seulement, en dehors du codec des étapes livré par 1.1 : aucune donnée, aucune Feuille, aucun calcul ne change. L'epic ne dépend que de 1.1 et avance en parallèle de l'Epic 2. Recette groupée « lot Éditeur » sur iPhone après 3.2.

## Stories

- Story 3.1 : Description en étapes numérotées
- Story 3.2 : Carte allégée, `Terminer` abaissé et conformité Figma de l'écran principal

## Requirements & Constraints

- **Description, état vide** : une seule ligne grise, « 1. » suivi de « Décrivez la première étape », sans ligne d'invitation. **Liste remplie** : une invite grise « n. Étape suivante » suit la dernière étape. Pas de bouton Ajouter.
- **Saisie** :
  - Entrée en fin d'étape crée l'étape suivante et lui donne le curseur. Entrée au milieu d'une étape la coupe au curseur.
  - Un collage sur plusieurs lignes donne une étape par ligne.
  - Chaque étape reste modifiable en place. Pas de réordonnancement.
  - Retour arrière sur une étape vide la supprime et place le curseur en fin de l'étape précédente.
  - ↑ ferme le clavier. Le contenu défile au-dessus du clavier et `Terminer` reste immobile.
- **Limite de 1 000 caractères** : mesurée en points de code sur la chaîne encodée, séparateurs compris, sans migration. Une saisie (frappe ou collage) qui ferait dépasser la limite est refusée en entier, sans troncature, et ne modifie aucune étape existante.
- **`Terminer`** :
  - les étapes vides sont retirées, la liste est renumérotée et l'ordre est préservé ;
  - les étapes sont enregistrées, puis relues à la réouverture ;
  - la copie Définition → Séance et la duplication les transportent.
  - Une étape vide créée par Entrée ne compte pas comme une modification.
- **Anciennes descriptions** : relues par le même décodage, une ligne = une étape. Aucune migration, conversion ni retour à l'ancien format. Un texte à fins de ligne `\r\n` ne crée aucune étape fantôme. Cette tolérance ne vaut que pour la Description : aucune autre donnée de l'Exercice n'est touchée.
- **Carte** : Compte à rebours, Fin et leur filet de séparation sont retirés du résumé et du nom accessible. Restent inchangés : les données, la Feuille, le calcul de durée du plan, la Phrase et sa « Durée totale ».
- **`Terminer` abaissé** selon le relevé Figma. Une zone réservée au-dessus garantit que le dernier contenu n'est jamais masqué, clavier ouvert ou fermé. `Terminer` ne remonte pas avec le clavier et garde ses couleurs actif et inactif.
- **Conformité Figma** :
  - **Éléments alignés** : titre d'en-tête et Nom, accès à la Catégorie et aux Zones, titres de section, Carte des modalités, typographies, couleurs et positions.
  - **Écarts** : les écarts E-V1 à E-V16 retenus sont corrigés.
  - **Classification Catégorie / Zones** : une seule forme, deux registres d'état (« à renseigner », « renseigné ») ; rien ne bouge entre les deux. Le glyphe plein est teinté de la couleur de la Catégorie. Les cibles tactiles sont préservées et ne recouvrent pas le Nom.
  - **Carte des modalités** : bloc `#F9FAFC` (jeton existant `surfaceSubtle`), rayon 12, sans liseré.
- **Points conservés** :
  - la grille verticale D-327 ;
  - le libellé accessible « Retour » du ✕ ;
  - le séparateur des Zones ;
  - les comportements de Catégorie et Zones ;
  - les jetons verrouillés ;
  - l'ordre Description → Paramètres d'exécution → Média ;
  - le titre « Paramètres d'exécution » ;
  - la Carte vide sans invite.
- **Écarts à soumettre à Hermann** : un écart Figma dont la correction exigerait un nouveau jeton, le remplacement d'un composant accepté ou une marge contraire à D-327 (par exemple les marges de 4 et 10 du registre face aux 13 de la grille) est soumis écart par écart. Il n'est pas implémenté d'office et la liste est consignée dans le fichier de la story.
- **Preuve** : chaque story finit avec `npm test`, `npx tsc --noEmit` et `npm run lint` verts. Une suite verte ne prouve ni rendu, ni geste, ni clavier, et aucun résultat d'appareil n'est fabriqué. Un comportement PRE-4 validé ne change que par une décision. Une divergence avec un document généré est signalée, pas appliquée.

## Technical Decisions

- **Codec unique `src/domain/activities/instructionSteps.ts`, livré par 1.1** :
  - fonctions `decodeInstructionSteps` (découpage `/\r?\n/`), `encodeInstructionSteps` (sans vides ni numéros, `null` si vide), `splitStepAt`, `insertPastedText` et `instructionStepsLength` ;
  - `instructionStepsLength` est la seule mesure de la limite, partagée par l'Éditeur et la validation ;
  - le `maxLength` du `TextInput` ne sert pas à compter ;
  - l'Éditeur appelle ces fonctions pures et ne réimplémente rien.
- **Stockage inchangé** : les colonnes texte `activity_definitions.description` et `activities.instruction` portent la chaîne encodée. Aucune migration, et l'Instantané ne porte toujours pas de Description.
- **Formulaire et encodage** :
  - la valeur de formulaire porte `instructionSteps: readonly string[]` ;
  - `formValueEquals` compare les encodages des deux valeurs ;
  - l'encodage se fait à `Terminer` seulement ;
  - `normalizeInstruction` reste la seule validation, appliquée à la chaîne encodée.
- **Carte** : `phasesRow` et `cardSeparator` ne sont plus rendus. Les clés `card.countdown` et `card.end`, devenues orphelines, sont retirées.
- **`Terminer`** : reste hors du `KeyboardAvoidingView`. Sa zone protégée est un espace de défilement réservé. Le test du créneau `finishSlotTestID` est adapté.
- **Styles** : `StyleSheet.create` et jetons existants. Les valeurs Figma sans jeton deviennent des constantes locales nommées. `tokens.ts` est inchangé et `tokensSpecification.test.ts` reste vert. Aucun jeton n'est ajouté.
- **Lexique** : les textes nouveaux (« Décrivez la première étape », « Étape suivante ») passent par `src/shared/i18n/`. Les clés orphelines sont retirées dans la story qui retire leur dernier usage. Les identifiants techniques ne changent pas. Code en anglais, commentaires en français citant FR, Δ, D et AD.
- **Fichiers touchés** : `ActivityEditorForm.tsx` n'est modifié que par cet epic. `ExerciseScreen.tsx` porte la détection de modification.
- **Tests à réécrire** :
  - pour la Carte : `ActivityEditorForm.test.tsx` (lignes 327, 374, 668, 737-739, 765, 987-990, 1055) et `EditorAccessibility.story46.test.tsx:454` ;
  - pour le transport des étapes : `ExerciseEditingPaths.integration.test.tsx` et `copiesAndSnapshots.story13.test.ts` ;
  - les tests 4.2 et 4.3 de PRE-4 sont adaptés seulement pour les écarts corrigés ;
  - toute fixture découpée par lignes retire les `\r`.

## UX & Interaction Patterns

- **Description** : suit le Figma courant. Texte des étapes à 14, numéros compris, sans contenant (le cadre passe sur la Carte des modalités) ; numéro et invite grise. Les chiffres sont des propriétés de présentation, en constantes locales, jamais des règles.
- **VoiceOver** : chaque étape est un champ annoncé avec son numéro.
- **Relevés Figma** : en lecture seule, frame par frame, après vérification de l'identifiant actuel de la frame. Trois relevés sont attendus :
  - la Description en étapes ;
  - les mesures de `Terminer` et de sa zone, clavier ouvert compris ;
  - les typographies de l'écran principal (en-tête, Nom, Classification, titres de section, Carte des modalités).
- **Figma** : aucune modification.
- **Recette iPhone (lot Éditeur)** : scénarios de 3.1 et 3.2, la Phrase sur la Carte et l'indicateur de la Composition (1.2), ainsi que la Phrase avec charge et phases (2.7, 2.8) si l'Epic 2 est livré. La comparaison visuelle avec les frames relevées se fait écart par écart.

## Cross-Story Dependencies

- **Dépendances** :
  - 3.1 dépend de 1.1 (codec des étapes, validation, stockage) ;
  - 3.2 dépend de 1.1 et de 3.1 (zone de la Description) ;
  - aucune dépendance envers l'Epic 2.
- **Hors périmètre** : toute refonte des écrans voisins (Composition, Catalogue, médias, référentiels).
