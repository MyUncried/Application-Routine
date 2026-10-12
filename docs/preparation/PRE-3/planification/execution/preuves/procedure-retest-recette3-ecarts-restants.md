# PRE-3 (#340) — retest des écarts restants de la recette 3

Ce retest porte uniquement sur les corrections livrées pour T-49, N-01, N-02, N-03 et N-04. Les lignes Conforme (T-53, N-05, T-15, T-10…) ne sont pas à refaire. Il **remplace** `procedure-retest-recette3.md`, dont les lignes R3-01 (T-53) et R3-04 (N-05) sont devenues Conforme. Durée : environ 20 minutes. Aucune suppression ni réinstallation ; les données sont conservées.

Candidat : commit `ce8e35a2`, OTA **`01a131d0-3f73-712c-8c34-19db4f55de01`** (canal `review`, runtime 1.1.0), compatible avec les builds 7 et 8. Il contient aussi toutes les corrections précédentes (D-350 à D-353).

## 0. Identifier la version exécutée (une fois)

1. Ouvrir **Routine Dev** avec le réseau actif.
2. Dans **Safari**, saisir `routine://diagnostic-updates`, valider, puis accepter « Ouvrir dans Routine Dev ».
3. Lire l’écran « Diagnostic des mises à jour » :

| Ce qui s’affiche | Signification | Suite |
|---|---|---|
| « Mise à jour exécutée » = `01a131d0-3f73-712c-8c34-19db4f55de01` et « Lancement » = « mise à jour OTA » | Le candidat est exécuté | Capture, puis retests du §1 |
| « Téléchargée, en attente » = `01a131d0…` | Téléchargée, appliquée au prochain lancement | Fermer complètement l’app **une seule fois**, la rouvrir, refaire 2 et 3 |
| Autre identifiant, sans attente | Mise à jour non reçue | Toucher « Vérifier maintenant », capture de tout l’écran, **s’arrêter** et la transmettre |
| Safari ne peut pas ouvrir le lien | Build 7 sans aucune mise à jour récente | **S’arrêter** et le signaler |

La correspondance au commit est vérifiée côté EAS : `01a131d0…` porte `gitCommitHash` `ce8e35a27705146ae76287f847cbdad45ee671bb`.

## 1. Retests

Données de départ communes : un exercice existant ouvert en « Modifier un exercice » (onglet Catalogues › Exercices › un exercice). Pour l’Étiquette, une séance ouverte en « Composition d’une séance » (Catalogues › Séances › une séance). Utiliser des **entrées de test** créées pour l’occasion (par exemple « Test R3 »), jamais une valeur réelle, pour Modifier et Supprimer.

| ID | Écran | Données de départ | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|---|
| R3B-01 **T-49** Catalogue | « Catalogues », vue **Exercices** puis vue **Séances** | — | Observer le haut et le bas de la zone colorée sous le titre, à taille normale puis avec le texte agrandi. Toucher Créer, puis fermer. | **Aucun trait gris** entre le titre et la zone ; bas de la zone fondu vers le blanc, **sans trait**. Couleur de la zone, sélecteur Exercices / Séances, Créer, Filtrer, Trier et liste inchangés. Le menu Créer s’ouvre juste sous la zone. | Vue concernée, capture du bord |
| R3B-02 **T-49** Composition | « Composition d’une séance » | Une séance existante | Observer, à taille normale puis agrandie : sous Retour, le haut et le bas de la zone, le champ Nom de séance | Courbe blanche sous Retour, sans trait gris au-dessus de la zone ; bas fondu vers le blanc, sans liseré ; Nom de séance sans contour blanc ; couleur de la zone inchangée ; aucune commande masquée | Capture du bord concerné |
| R3B-03 **N-01** Catégorie | « Catégorie de l’exercice » (Modifier un exercice › Catégorie) | Une entrée de test « Test R3 » existante | 1. « Créer une catégorie », écrire « Provisoire » (clavier affiché). 2. **Maintenir** « Test R3 ». 3. Toucher **✕** du menu. 4. Maintenir « Test R3 », toucher **Modifier**. 5. Remplacer par « Test R3 bis », **Enregistrer**. 6. Maintenir « Test R3 bis », Modifier, changer le texte, **Annuler**. | 2 : le menu s’ouvre **sans que le clavier disparaisse**, sans saut de la feuille ; menu lisible au-dessus du clavier. 3 : menu fermé, « Provisoire » et le clavier toujours là. 4 : un champ prérempli « Test R3 » apparaît, modifiable. 5 : « Test R3 bis » dans la liste, **aucune nouvelle entrée** ; le formulaire de création revient avec « Provisoire ». 6 : « Test R3 bis » inchangé. | Étape, état du clavier |
| R3B-04 **N-01** Zones | « Zones corporelles » (Modifier un exercice › Zones) | Une zone de test « Zone R3 » existante | Mêmes étapes 1 à 6 que R3B-03 avec « Zone R3 » | Mêmes résultats ; ✓ et ✕ de la feuille gardent leur effet sur la sélection | Étape, état du clavier |
| R3B-05 **N-01** Étiquette | Feuille « Étiquettes » (Composition d’une séance › bouton Étiquette) | Une étiquette de test « Étiq R3 » existante | Mêmes étapes 1 à 6 que R3B-03, avec « Créer une étiquette » et « Étiq R3 » ; en Modifier, la barre de couleurs permet aussi de changer la couleur | Mêmes résultats ; nom et couleur modifiés sans nouvelle étiquette | Étape, état du clavier |
| R3B-06 **N-02** Zones | « Zones corporelles » | — | 1. « Créer une zone corporelle », écrire « Zone R3c », toucher **↑**. 2. Sans retoucher le champ, écrire « Zone R3d », toucher ↑. 3. Toucher ✓. | 1 : « Zone R3c » apparaît **une fois**, cochée ; **le clavier reste affiché**, champ vidé. 2 : la saisie se fait directement ; « Zone R3d » apparaît, cochée. 3 : sélection appliquée à l’exercice. | Étape où le clavier se ferme |
| R3B-07 **N-03** Étiquette, sélection | Feuille « Étiquettes » | Séance avec l’Étiquette A ; une Étiquette B existe | 1. Observer la feuille. 2. Toucher B, puis **✕**. 3. Rouvrir, toucher B, puis **✓**. 4. Rouvrir, toucher B (marquée) pour la démarquer, puis ✓. 5. Toucher **Continuer**, rouvrir la séance. | 1 : feuille en bas, pleine largeur, hauteur au contenu ; ✕ rond à gauche, titre, ✓ rond à droite, trait sous l’en-tête ; **aucun** bouton Fermer, Annuler ou Ajouter en bas. Pastille de chaque pilule : petite, à égale distance du bord gauche, du haut et du bas. 2 : la feuille se ferme, la séance garde **A**. 3 : fermeture progressive, la séance porte **B**. 4 : la séance n’a **plus d’Étiquette**. 5 : l’état de 4 est conservé. | Étape, capture |
| R3B-08 **N-03** Étiquette, création | Feuille « Étiquettes » | — | 1. « Créer une étiquette ». 2. Écrire « Étiq R3e », choisir une couleur dans la barre, toucher **↑**. 3. Toucher ↑ à nouveau, champ vide. 4. Toucher **✕**. 5. Rouvrir : « Étiq R3e » est dans la liste ; la toucher, puis ✓. | 1 : ↑ dans le champ, barre horizontale de couleurs dessous, sans pastille ni palette déroulante. 2 : « Étiq R3e » créée **une fois** et marquée ; **clavier et feuille restent ouverts**. 3 : rien (↑ grisé). 4 : la séance garde son Étiquette antérieure ; « Étiq R3e » reste au référentiel. 5 : la séance porte « Étiq R3e ». | Étape, capture |
| R3B-09 **N-04** menu d’appui long | Feuilles Catégorie, Zones et Étiquettes | Une entrée de test dans chacune | 1. Maintenir l’entrée. 2. Observer le menu, toucher ✕. 3. Maintenir, **Supprimer**, puis **Annuler** dans la confirmation. | 1-2 : ✕ rond en haut à gauche ; **Modifier** (fond bleu) puis **Supprimer** (fond rouge) côte à côte, texte blanc, sans débordement (aussi au texte agrandi) ; ✕ ferme sans rien changer ; l’appui long ne change pas la sélection. 3 : la confirmation « Supprimer « … » ? » apparaît ; Annuler ne supprime rien. | Feuille, capture du menu |

## 2. Non concluants (statuts conservés, parcours distincts)

| ID | Statut | Parcours |
|---|---|---|
| T-04 Copie de séance | Clarifier | « Composition d’une séance » : ajouter un exercice du Catalogue ; l’ouvrir (« Modifier un exercice » de la copie) ; Séries +1 ; ✓ ; Terminer ; Continuer. Rouvrir la séance, puis ouvrir le même exercice depuis Catalogues › Exercices. **Attendu** : la séance garde la nouvelle valeur ; l’exercice du Catalogue est inchangé. |
| T-17 Série unique | Clarifier | « Paramètres d’exécution » avec 3 Séries variables (30 s / 45 s / 1 min) : **A**, sans ✓ : Séries 3 → 1 → 3 ; **B** : 3 → 1, ✓, Terminer, rouvrir, 1 → 3. **Attendu** : A, valeurs et ordre reviennent ; B, pas de restauration, les nouvelles lignes copient la ligne restante. |
| T-42 | Non provoqué | Inchangé |
| T-62 à T-65 | Non testé | Inchangés |
