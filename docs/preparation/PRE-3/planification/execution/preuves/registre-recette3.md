# PRE-3 (#340) — registre de la recette iPhone 3 de Hermann

## Repères

| Élément | Valeur |
|---|---|
| Source | `KODJO_PRE3_Recette3_Prompt_Corrections_Claude.md` (onglet « Recette 3 » de `KODJO_PRE3_Recette3.xlsx`, reçu le 12/10/2026) |
| Résultats déclarés | 78 : 64 Conforme, 7 Écart (T-49, T-53, N-01 à N-05), 2 Clarifier, 4 Non testé, 1 Non provoqué |
| Lignes Conforme | Validées par Hermann (clarification du 12/10, 16:52). Leurs commentaires hérités ne sont **pas** des écarts. Aucune réouverture : T-15, T-10/F-02, T-54 (Position Bip), T-58 (Annuler) compris. |
| Branche au départ | `feat/pre3-exercice-20261009` à `6c519aa7` (local = distant). Aucune PR ni aucun run actif. |
| Autorisations | `write_scope@43e7b344`, extensions X-1 à X-4, écran de diagnostic (arbitrage A du 12/10). **EXT-R2-A, -B et -C n’ont pas été accordées** : aucune trace d’approbation dans l’issue #340 ni dans le dépôt. **EXT-R3-2 accordée par Hermann le 12/10** : T-49 sur « Composition d’une séance », `CompositionScreen.tsx` et ses tests, pendant PRE-3 ; PRE-4 non lancé. |

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
| **T-49** (Composition) | — | Courbure sous Retour, dégradé inférieur, suppression des deux liserés inférieurs et du contour blanc du champ de nom | Champ visé **identifié** : nom de séance (`composition-name-color-field`, `borderColor: colors.sessionNameBorder`). C’est le seul champ de nom à contour de l’écran. Le nom d’exercice ouvert depuis la Composition passe par l’éditeur, sans contour depuis D-348 (résolu). Aucune question à poser. | EXT, **accordée (EXT-R3-2)** | `CompositionScreen.tsx` : courbe blanche concentrique au bouton Retour (Ø 59,28, centre décalé du séparateur conservé) et fondu inférieur sur 20 % en couches superposées, découpés à la bande, sous le contenu, sans interaction ni exposition à VoiceOver ; couleur de la bande inchangée (`selectionSurface` #E5F0FF) ; contour du nom de séance retiré. `ScreenShell` non modifié. **D-352.** Liserés inférieurs : aucun trait dans le code ; hypothèse plausible = arête nette bande / fond blanc, effacée par le fondu (comme l’éditeur avant D-348). Séparateur sous l’en-tête d’abord conservé, puis **retiré** après le retour visuel de Hermann (D-353 ; arbre « Ajouter une activité » et courbe recalés de 1). | Test T-49 Composition et test REWORK09 révisé (assertion du contour remplacée et tracée) ; **rouges sur l’original** | Corrigé, à retester. Si un liseré bas persiste : capture recadrée du bord bas. |
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
| EXT-R3-2 (**accordée le 12/10, réalisée**) | T-49, Composition | `src/features/sessions/CompositionScreen.tsx`, ses tests | Courbure sous Retour et fondu inférieur avec les **valeurs de l’éditeur** (halo, couches superposées jusqu’au bas, sans bandes), sur la **couleur propre** de la bande Composition (pas de lavande). Retirer les deux liserés inférieurs, à localiser dans le code au moment de l’implémentation. Retirer `borderWidth`/`sessionNameBorder` du **seul** champ nom de séance. Effets implémentés localement : l’éditeur, acquis gelé, n’est pas touché. | Composition seule. Le token `sessionNameBorder` n’a pas d’autre consommateur : il peut rester déclaré (chapitre 12) ou être marqué inutilisé. | Suites Composition : ordre de dessin, couches, absence de contour, actions et contenu inchangés |
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
| Code corrigé et publié | T-53, N-01, N-02, N-05 : commit `1645b52f`, OTA `01a130ce-0c5c-75c5-b821-2bc0d85e1113`. T-49 Composition : rapport `2026-10-12_PRE3-340_EXT-R3-2-COMPOSITION.md` |
| Candidat chargé sur l’iPhone | **Non prouvé** : procédure `procedure-retest-recette3.md`, étape 0 |
| Retest réussi par Hermann | Non réalisé |
| Revue indépendante | Non réalisée |

## 6. Écarts restants (fichier « Recette 3 » du 12/10 au soir) et autorisation consolidée

Résultats déclarés : 66 Conforme, 5 Écart (T-49, N-01, N-02, N-03, N-04), 2 Clarifier, 4 Non testé, 1 Non provoqué. **T-53, N-05, T-15 et T-10 sont Conforme.** Autorisation consolidée de Hermann (EXT-R3-1, -3, -4, EXT-R3-2 maintenue) enregistrée avant modification : `autorisation-extension-recette3.json` (commit `40ac87bc`).

**Composition, trait sous l’en-tête.** Le prompt le présente comme conservé (livraison `01a1314e`). Hermann en a pourtant demandé explicitement le retrait après cette livraison ; il a été retiré dans `c649bffc` (D-353, OTA `01a13191`). Cette demande plus récente est conservée.

| Sous-point | Attendu | Cause | Qualif. | Correction | Preuve | Candidat | Statut |
|---|---|---|---|---|---|---|---|
| T-49 Catalogue, bord haut | Aucun trait | `<HeaderSeparator />` sous l’en-tête (**démontré**, sonde de rendu) | DD + AJ | Retiré du Catalogue seul (`ScreenShell` inchangé) ; arbre « Créer » recalé de 1 (`CatalogueCreateOptions`, seul consommateur). **D-356.** | Test T-49 Catalogue (2 vues) ; tests révisés et tracés ; **rouges sur l’original** | `ce8e35a2`, OTA `01a131d0` | Publié, à retester |
| T-49 Catalogue, bord bas | Aucun trait | **Aucun élément** sous la bande (sonde : ni séparateur ni bordure, vue vide comme listes) : arête nette entre `#E5F0FF` et le fond blanc. Plausible, non démontré sur appareil. | AJ | Fondu vers le blanc sur 20 % (chapitre 12 l.1497), couches superposées, couleur propre conservée. **D-356.** | Même test | idem | Publié, à retester ; capture si un trait persiste |
| T-49 Composition (courbe, fondu, liserés bas, contour du nom) | Les quatre résultats | Présents depuis `ee32191a` ; trait du haut retiré dans `c649bffc` (D-352, D-353) | — | Aucune nouvelle modification ; inclusion vérifiée dans le bundle `01a131d0` (halo, fondu) | Tests EXT-R3-2 et D-353 verts | idem | Publié, à retester (non implicitement validé) |
| N-01, clavier pendant l’appui long (3 référentiels) | Clavier maintenu, menu accessible | **Démontrée** : `ReferenceValueDialog` était un `Modal` imbriqué ; sur iOS, un nouveau `Modal` retire le focus du champ actif (clavier masqué puis réaffiché) | DD | Calque dans la fenêtre de la feuille (aucun `Modal` imbriqué) ; carte centrée au-dessus du clavier ; confirmation de suppression dans le même calque | Tests N-01 (Catégorie, Zones, Étiquette : même champ, aucun Modal ajouté, texte conservé) ; test de position au-dessus du clavier ; **rouges sur l’original** | idem | Publié, à retester (le maintien réel du clavier ne se prouve que sur iPhone) |
| N-01, Modifier sans effet | Édition de l’entrée visée | **Démontrée** : le rendu testait `isCreating` avant `editTarget` ; formulaire de création ouvert, l’édition n’était jamais affichée | DD | Édition prioritaire ; la création revient ensuite avec son texte (Catégorie, Zones, Étiquette) | Mêmes tests N-01 (Modifier → champ prérempli, Enregistrer renomme sans créer, Annuler conserve) | idem | Publié, à retester |
| N-02 (Zone, ↑ garde le clavier) | Une Zone créée, clavier maintenu | Correctif D-350 présent depuis `1645b52f` (formulaire non démonté, une seule création) et inclus dans `01a131d0`. Constat iPhone **non reproduit** : la cause du constat reste **indéterminée**, et la version exécutée lors de ce constat n’est pas prouvée. Mention « nouvelle catégorie » = Zone corporelle. | AR | Aucune nouvelle modification | Test N-02 (rouge sur l’original de `1645b52f`) | idem | Publié, à retester sur iPhone (R3B-06) |
| N-03, présentation | Modèle Catégorie | Surface PRE-2 non alignée | AJ | Feuille ancrée en bas, pleine largeur, hauteur au contenu ; en-tête ✕ / titre / ✓ avec séparateur ; Fermer, Annuler et Ajouter retirés ; ↑ dans le champ ; barre de 12 couleurs (bandeau Catégorie exporté sans changement) ; pastille Ø 12 à marges égales (9). **D-355.** | Tests N-03 ; **rouges sur l’original** | idem | Publié, à retester |
| N-03, pastille de la pilule | Bonne taille, marges égales | Export figé `4640-6308` mesuré au pixel : pilule 30 (contour 1), pastille 12, marges 9 ; le code avait 12 à gauche. Les propriétés de `4581:6404` ne sont plus lisibles dans le fichier Figma (nœud supprimé) : mesure faite sur l’export conservé. La pilule d’Étiquette posée sur la Composition (pastille 34 dans `4581:6404`) n’est pas visée par N-03 et reste inchangée. | AJ | Marge gauche = (30 − 12) / 2 = 9 | Test de géométrie | idem | Publié, à retester |
| N-03, comportement | Option B (ARB-R3-1) | Ajustement produit retenu par la mission | AJ | Toucher marque / démarque ; ↑ crée et marque sans fermer ; ✓ applique (ou retire) et ferme progressivement ; ✕ conserve l’antérieure ; Étiquette créée conservée. Raccordement Composition inchangé (`onSelect` n’est plus appelé qu’à ✓). **D-355.** | Tests D-355 (4) et Composition révisés et tracés ; **rouges sur l’original** | idem | Publié, à retester |
| N-04, présentation du menu | ✕ rond ; Modifier puis Supprimer, bleu et rouge, texte blanc | Composant maison partagé | AJ | ✕ 38 en haut à gauche ; deux boutons sur une ligne (D-102 : 147 × 48 dans 354, `flex` pour les largeurs réduites) ; confirmation destructive conservée. **D-354.** | Tests N-04 ; **rouges sur l’original** | idem | Publié, à retester (3 feuilles) |

**Consommateurs protégés.** `ReferenceValueDialog` : Catégorie, Zones et Étiquette passent leurs suites (86 tests des référentiels). `ScreenShell` (`HeaderSeparator`, `ContextBand`) n’est pas modifié : Profil, Modifier le profil, Sélection d’activités et Catégories gardent leur séparateur. `DecisionDialog` (abandon de séance ou d’exercice, profil) n’est pas modifié.

**Statuts conservés.** T-04, T-17 : Clarifier (parcours distincts dans la procédure) ; T-42 : Non provoqué ; T-62 à T-65 : Non testé. Aucun constat supplémentaire démontré pendant le travail.

