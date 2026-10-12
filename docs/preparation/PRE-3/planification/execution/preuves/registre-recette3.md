# PRE-3 (#340) — registre de la recette iPhone 3 de Hermann

## Repères

| Élément | Valeur |
|---|---|
| Source | `KODJO_PRE3_Recette3_Prompt_Corrections_Claude.md` (onglet « Recette 3 » de `KODJO_PRE3_Recette3.xlsx`, reçu le 12/10/2026) |
| Résultats déclarés | 78 : 64 Conforme, 7 Écart (T-49, T-53, N-01 à N-05), 2 Clarifier, 4 Non testé, 1 Non provoqué |
| Lignes Conforme | Validées par Hermann (clarification du 12/10, 16:52). Leurs commentaires hérités ne sont **pas** des écarts. Aucune réouverture : T-15, T-10/F-02, T-54 (Position Bip), T-58 (Annuler) compris. |
| Branche au départ | `feat/pre3-exercice-20261009` à `6c519aa7` (local = distant). Aucune PR ni aucun run actif. |
| Autorisations | `write_scope@43e7b344`, extensions X-1 à X-4, écran de diagnostic (arbitrage A du 12/10). **EXT-R2-A, -B et -C n’ont pas été accordées** : aucune trace d’approbation dans l’issue #340 ni dans le dépôt. |

## 1. Candidat exécuté pendant la recette 3

| Couche | Ce qui est établi | Preuve |
|---|---|---|
| Builds disponibles | Build 7 (`9f5cee0e`) ; build 8 `38bf5fc2` (1.0.0 (8), commit `58bbc3bc`, mise à jour embarquée `19e31f06-f210-432a-8297-fffe72cf2a0d`) | Rapport `2026-10-12_PRE3-340_OTA-NON-APPLIQUEE.md` |
| OTA proposée pendant la recette 3 | `01a12fae` (`a12bb92f`) jusqu’à 15:49 UTC | `eas channel:view review` |
| Données EAS (2 jours, iOS) | `01a12fae` : 0 installation. Une utilisation d’une mise à jour **embarquée** enregistrée. | `eas update:insights`, `eas channel:insights` |
| Indices fonctionnels | T-15 Conforme et « Annuler » de création de Catégorie déclaré supprimé (N-01 résolu). Ces corrections n’existent que dans `a12bb92f` et ses descendants, donc dans `01a12fae` ou dans le build 8. Elles sont absentes du build 7 et de `01a12f22`. | Sources ; bundles inspectés |
| **Conclusion** | Le code exécuté contenait les corrections de la recette 2. Le **build 8 embarqué** est l’hypothèse la plus plausible, compatible avec 0 installation de `01a12fae` et une utilisation d’une mise à jour embarquée. **L’identifiant exécuté n’est pas prouvé** : aucune capture du diagnostic n’a été reçue. | — |

Aucune observation de la recette 3 n’est attribuée définitivement à une version.

## 2. Écarts déclarés

Qualifications :
- **DD** : défaut démontré ;
- **AJ** : ajustement explicitement demandé ;
- **EXT** : surface hors du périmètre d’écriture PRE-3 ;
- **AR** : à reproduire.

| Réf. | Résolu (acquis conservé) | Besoin restant | Cause | Qualif. | Modification et portée | Preuve | État |
|---|---|---|---|---|---|---|---|
| **T-49** (éditeur) | Courbure, dégradé, sans liseré ni contour (D-348) | — | — | — | Aucune : acquis gelé | Tests T-49 de la recette 2 conservés | Résolu |
| **T-49** (Catalogue) | — | Supprimer les liserés gris au-dessus et au-dessous de la zone de contexte (exercices et séances : deux segments du **même** `CatalogueScreen`) | Haut : `HeaderSeparator` sous l’en-tête (**démontré**). Bas : aucun séparateur ni bord dans le code (**non localisé**) ; hypothèse : arête entre la bande `#E5F0FF` et le fond blanc. | EXT | Aucune : **EXT-R3-1** | — | En attente d’extension |
| **T-49** (Composition) | — | Courbure sous Retour, dégradé inférieur, suppression des deux liserés inférieurs et du contour blanc du champ de nom | Champ visé **identifié** : nom de séance (`composition-name-color-field`, `borderColor: colors.sessionNameBorder`). C’est le seul champ de nom à contour de l’écran. Le nom d’exercice ouvert depuis la Composition passe par l’éditeur, sans contour depuis D-348 (résolu). Aucune question à poser. | EXT | Aucune : **EXT-R3-2** | — | En attente d’extension |
| **T-53** | — | Interrupteur centré sur le libellé et entre les séparateurs | **Démontrée** : `Switch.js` de React Native 0.86 (branche iOS) compose le style avec `{alignSelf: 'flex-start'}`. Ce style l’emporte sur `alignItems: center` de la ligne et colle l’interrupteur en haut de la ligne de 42. La mesure native est correcte (`RCTSwitchSize`, taille réelle de `UISwitch`). | DD | `ExecutionParametersSheet.tsx` : `style={{ alignSelf: "center" }}` sur cet interrupteur | Test T-53 (replié, déployé, désactivé) sur le style réellement transmis au composant natif ; **rouge sur l’original** | Corrigé, à retester. Aucune capture ni version d’iOS nécessaire. |
| **N-01** | Annuler retiré ; espace barre/clavier réduit (D-347) | ↑ crée sans fermer le clavier | **Démontrée** : après une création réussie, `setIsCreating(false)` démontait le formulaire et le champ qui a le focus, donc iOS fermait le clavier. Le toucher sur ↑ seul ne le ferme pas (`keyboardShouldPersistTaps="handled"`). | DD + AJ | `CategoryPickerModal.tsx` : formulaire maintenu, nom vidé comme avant, une seule création en vol. **D-350.** | Test N-01 : même champ conservé, nom vidé, ↑ inactif à vide, **une seule création pour deux appuis**, ni affectation ni fermeture ; **rouge sur l’original** | Corrigé, à retester |
| **N-02** | Annuler retiré ; espace champ/clavier réduit (D-347) | Idem pour la Zone corporelle (le « nouvelle catégorie » du commentaire désigne la Zone) | Même cause, démontrée | DD + AJ | `BodyZonePickerModal.tsx` : idem ; l’entrée créée rejoint la sélection en cours. ✓ et ✕ inchangés. **D-350.** | Test N-02 ; **rouge sur l’original** | Corrigé, à retester |
| **N-03** | — | Feuilles « sélectionner » et « créer » de l’Étiquette sur le modèle des **deux feuilles Catégorie** | Surface PRE-2 exclue de PRE-3 ; règle d’affectation propre (CE-T03-16 : choix validé au toucher et fermeture) | EXT + arbitrage | Aucune : **EXT-R3-3** et **ARB-R3-1** | — | En attente d’extension et d’arbitrage |
| **N-04** | — | ✕ rond en haut à gauche ; Modifier puis Supprimer alignés, fond bleu Kodjo et fond rouge, texte blanc | Composant maison partagé `ReferenceValueDialog.tsx` (aucun menu natif), hors du périmètre d’écriture | EXT | Aucune : **EXT-R3-4** | — | En attente d’extension |
| **N-05** | Terminer ne remonte plus ; la Description reste au-dessus du clavier (D-349) | ↑ dans le champ Description pour valider et fermer le clavier | Ajout demandé, sans défaut | AJ | `ActivityEditorForm.tsx` : ↑ standard (32, bleu Kodjo, rayon 16) dans le coin bas droit du champ pendant la saisie ; place réservée au texte ; ↑ ferme le clavier ; texte déjà dans le brouillon ; **n’enregistre pas** l’exercice ; Retour reste un retour à la ligne ; libellé « Valider la description ». Le `TextInput` n’est pas déplacé : le recadrage D-349 est intact. **D-351.** | Test N-05 ; tests N-05 de la recette 2 inchangés et verts ; **rouge sur l’original** | Corrigé, à retester |

**Effets constatés hors des écarts.** `ExerciseScreen.test.tsx` : 7 obligations (P3-01, P3-02, P3-13, P3-16, INTERACTION et ACCESSIBILITY editor-finish) échouaient au départ, de façon reproductible, même avec la suite lancée seule. Instrumentation : la fermeture progressive de la feuille Catégorie (220 ms) se termine bien (`{ finished: true }`), mais en ≈ 7 s réelles dans cette suite, au-delà de l’attente de 3 s. **Cause démontrée** : le temps de rendu du test, et non l’application. Correction limitée au test : attente portée à 20 s, avec la mesure en commentaire. Le rapport `OTA-NON-APPLIQUEE` les qualifiait à tort de « charge machine ».

## 3. Proposition d’extension consolidée (non réalisée)

Les demandes visuelles ne sont pas remises en arbitrage. Seule l’**extension de fichiers** est à accorder ; le comportement de l’Étiquette (ARB-R3-1) est un **arbitrage produit** distinct.

| # | Objet | Fichiers | Modification minimale | Consommateurs et effets | Tests |
|---|---|---|---|---|---|
| EXT-R3-1 | T-49, Catalogue (exercices et séances) | `src/features/sessions/CatalogueScreen.tsx`, son test | Retirer `<HeaderSeparator />` du Catalogue seulement : `ScreenShell` reste inchangé. Liseré bas : vérifier l’arête de la bande ; capture recadrée du bord bas seulement si le défaut persiste après la correction. | Catalogue seul. Les autres consommateurs de `HeaderSeparator` (Profil, Modifier le profil, Sélection d’activités, Catégories, Composition) sont inchangés. | Suite Catalogue : aucun séparateur sous l’en-tête ; géométrie de la bande inchangée |
| EXT-R3-2 | T-49, Composition | `src/features/sessions/CompositionScreen.tsx`, ses tests | Courbure sous Retour et fondu inférieur avec les **valeurs de l’éditeur** (halo, couches superposées jusqu’au bas, sans bandes), sur la **couleur propre** de la bande Composition (pas de lavande). Retirer les deux liserés inférieurs, à localiser dans le code au moment de l’implémentation. Retirer `borderWidth`/`sessionNameBorder` du **seul** champ nom de séance. Effets implémentés localement : l’éditeur, acquis gelé, n’est pas touché. | Composition seule. Le token `sessionNameBorder` n’a pas d’autre consommateur : il peut rester déclaré (chapitre 12) ou être marqué inutilisé. | Suites Composition : ordre de dessin, couches, absence de contour, actions et contenu inchangés |
| EXT-R3-3 | N-03, Étiquette | `src/features/reference-data/LabelPickerModal.tsx` et son test ; `CategoryPickerModal.tsx`, seulement pour exporter `CategoryColorBand` (sans changer son rendu) ; consommateur `CompositionScreen.tsx` (props inchangées si possible) | Feuille ancrée en bas, pleine largeur, hauteur ajustée au contenu, zones système et clavier respectées. En-tête ✕ / titre / ✓ et séparateur. Fermer, Annuler et Ajouter retirés. ↑ dans le champ de création. Barre de couleurs sous le champ (12 couleurs D-026). Pastille de la pilule : diamètre repris des propriétés Figma extraites de l’Étiquette (`4861:6145`), marges gauche = haut = bas, soit `(hauteur − diamètre) / 2`. La pastille de la pilule est **conservée** ; seule l’ancienne pastille qui ouvrait la palette disparaît. | Composition (Étiquette de Séance) | Suite `LabelPickerModal` ; intégration Composition ; dimensions de la pastille |
| EXT-R3-4 | N-04, menu d’appui long | `src/features/reference-data/ReferenceValueDialog.tsx` et son test | ✕ rond standard en haut à gauche, à la place d’Annuler. **Disposition standard D-102** (deux choix alignés sur une ligne, boutons 147 × 48) : Modifier (fond `primary`, texte blanc) puis Supprimer (fond `danger`, texte blanc). Confirmation de suppression, retour du focus (R10) et absence d’effet de sélection conservés. Aucun champ dans ce dialogue : rien à prévoir pour le clavier. Composant déjà maison : aucune substitution d’une primitive native. | Catégorie et Zones (PRE-3), Étiquette (PRE-2) : les trois menus changent ensemble | Suite `ReferenceValueDialog` ; sélecteurs Catégorie, Zones et Étiquette |

**ARB-R3-1 — effet de ✓, ✕ et ↑ pour l’Étiquette.** Règle actuelle (CE-T03-16) : toucher choisit et ferme ; toucher l’Étiquette choisie la retire et ferme ; Ajouter crée, choisit et ferme. Avec un en-tête ✕/✓, deux comportements concrets sont possibles :
- **A — choix au toucher conservé** : toucher choisit (ou retire) et ferme ; ↑ crée, choisit et ferme ; ✕ ferme sans changement ; ✓ ferme sans changement (redondant).
- **B — confirmation explicite, comme la Catégorie (D-343)** : toucher marque (toucher l’Étiquette marquée la démarque, soit aucune Étiquette) ; ↑ crée et marque sans fermer, clavier conservé (D-350) ; ✓ applique la marque (ou le retrait) et ferme ; ✕ conserve l’Étiquette précédente. Une Étiquette créée reste au référentiel.

## 4. Statuts conservés

- T-04, T-17 : Clarifier. T-42 : Non provoqué. T-62 à T-65 : Non testé. Statuts inchangés, ni réussite ni défaut.
- Toutes les lignes Conforme restent validées. Décisions conservées : pas CR/Fin de 1, messages « Renseignez… » supprimés avec contour orange provisoire, corpus inchangé, opacité d’Annuler, typographie.
- T-54 (Position Bip) : Conforme, inchangé.

## 5. Quatre états distincts

| État | Situation |
|---|---|
| Code corrigé et publié | T-53, N-01, N-02, N-05 : commit `1645b52f`, OTA `01a130ce-0c5c-75c5-b821-2bc0d85e1113` (voir rapport) |
| Candidat chargé sur l’iPhone | **Non prouvé** : procédure `procedure-retest-recette3.md`, étape 0 |
| Retest réussi par Hermann | Non réalisé |
| Revue indépendante | Non réalisée |
