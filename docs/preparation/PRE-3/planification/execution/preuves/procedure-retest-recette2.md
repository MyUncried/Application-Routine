# PRE-3 (#340) — retest ciblé après la recette 2

Procédure **unique** pour cette correction. Durée estimée : 15 minutes. Ni VoiceOver ni base de données. Identifiant de la mise à jour et commit exact : rapport `2026-10-12_PRE3-340_CORRECTION-RECETTE2.md`, section Publication.

## 0. Charger la mise à jour et vérifier qu’elle est active

1. Ouvrir **Routine Dev** avec le réseau actif et attendre 20 secondes ; fermer complètement l’app (balayer vers le haut dans le sélecteur d’apps) ; la rouvrir.
2. **Repère** : Catalogue › Créer › « Un nouvel exercice » › toucher **Catégorie** › « **Créer une catégorie** ». **Aucun bouton « Annuler »** n’apparaît sous le champ ; il ne reste que le champ avec ↑ et la barre de couleurs.
3. Si « Annuler » est encore visible, recommencer l’étape 1 une fois. S’il reste visible, s’arrêter et le signaler.

À rapporter une fois : **modèle d’iPhone** et **version d’iOS** (nécessaires pour T-53).

## 1. Retests

| ID | Écran affiché | Données de départ | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|---|
| R2-01 **F-02** (T-10) | « Paramètres d’exécution » (carte Paramètres de « Créer un exercice ») | Durée, 3 Séries, Séries variables activé, 30 s / 45 s / 1 min. Ne **jamais** toucher l’interrupteur. | 1. Ligne 1 : **+** (31 s). 2. Mode → **Répétitions**. 3. Ligne 1 : **+** deux fois. 4. Mode → **Durée**. 5. Mode → **Répétitions**. | 2 : cibles « — ». 3 : **« 1 rép. » puis « 2 rép. »** (jamais 30 ou 31 rép.). 4 : **31 s / 45 s / 1 min**. 5 : ligne 1 **« 2 rép. »**. | Étape et valeurs affichées |
| R2-02 Dépôt d’une Série (T-15) | Même feuille | Durée, 4 Séries variables 30 s / 45 s / 1 min / 1 min 15 s | Maintenir les six points de la ligne 1, la glisser entre les lignes 3 et 4, relâcher | Pendant le geste : la **feuille ne bouge pas**, la ligne suit le doigt, un **trait bleu** apparaît entre les lignes visées. Au relâchement : ordre **45 s, 1 min, 30 s, 1 min 15 s**, chaque durée avec sa pause, numéros 1 à 4. | Ce qui bouge, position finale |
| R2-03 Zone de contexte (T-49) | « Créer un exercice », puis « Modifier un exercice » | — | Observer le haut de l’écran | **Aucun trait** sous l’en-tête ; **aucun contour blanc** autour du champ Nom ; courbe blanche sous Retour ; bas de la zone qui passe progressivement au blanc, **sans lignes grises** | Capture si un trait subsiste |
| R2-04 Annuler (T-58) | « Paramètres d’exécution » | Durée, 1 Série, 30 s, pause 10 s | Toucher le total, choisir 1 min 40 s, valider ; puis **A** : Annuler ; recommencer ; **B** : toucher le texte du message | « Annuler » dans une **capsule** blanche très transparente, sans contour, bouts arrondis, avec **les mêmes marges** à droite, en haut et en bas. A : retour à 1 série ; B : message fermé, 3 séries conservées. | Capture ; dire si la transparence convient |
| R2-05 Création de Catégorie (N-01) | « Catégorie de l’exercice » | Exercice avec « Mobilité » | « Créer une catégorie », écrire « Volonté » (clavier ouvert) ; observer ; puis **✕** | Pas de bouton Annuler ; la barre de couleurs est **juste au-dessus du clavier**, sans grand espace vide. ✕ ferme la feuille et l’éditeur garde **Mobilité**. | Espace constaté, capture |
| R2-06 Création de Zone (N-02) | « Zones corporelles » | — | « Créer une zone corporelle », écrire un nom ; observer ; puis ✕ | Pas de bouton Annuler ; champ et ↑ **juste au-dessus du clavier** ; ✕ ferme sans modifier les zones choisies | Espace constaté |
| R2-07 Description (N-05) | « Créer un exercice », puis un exercice existant (« Modifier un exercice ») | — | Toucher **Description** ; écrire une dizaine de lignes (retours à la ligne) ; replacer le curseur au milieu et écrire ; fermer le clavier (toucher ailleurs) | **Terminer ne monte pas** avec le clavier. La Description reste **juste au-dessus du clavier** ; la ligne en cours reste visible, à la fin comme au milieu. Après fermeture : texte intact, **Terminer visible**, pas d’espace vide. | Étape en défaut, capture |
| R2-08 Interrupteur (T-53) | « Paramètres d’exécution » | Séries variables désactivé, puis activé et tableau replié | Observer la ligne « Séries variables » | Interrupteur centré verticalement avec le libellé et entre ses deux traits | **Capture de la ligne** (aucune correction faite : la cause n’est pas visible dans le code) |
| R2-09 Copie de séance (T-04) | « Composition d’une séance » | Une séance en cours | Ajouter un exercice du Catalogue ; ouvrir sa copie ; Séries +1 ; ✓ ; **Terminer** ; **Continuer** ; rouvrir la séance, puis l’exercice dans le Catalogue | La séance garde la nouvelle valeur ; le Catalogue est inchangé | Où la valeur est perdue |
| R2-10 N=1 (T-17) | « Paramètres d’exécution » | 3 Séries variables 30 s / 45 s / 1 min ; « Droite puis gauche » ; « Les deux côtés à chaque série » | **A**, sans ✓ : Séries 3 → 1 → 3. **B** : 3 → 1, ✓, Terminer, rouvrir, 1 → 3 | A : valeurs et ordre reviennent. B : pas de restauration ; les nouvelles lignes copient la ligne restante | Valeurs constatées |
| R2-11 Safe Areas (T-62) | Écrans et feuilles PRE-3, sans VoiceOver | — | Regarder le haut et le bas | Retour, ✕, ✓ et Terminer atteignables ; rien sous l’encoche ni sous la barre d’accueil | Élément masqué |

**Non retestés ici** : Catalogue et Composition (zone de contexte), Étiquette, menu d’appui long. Ces trois points attendent les extensions EXT-R2-A, -B et -C. Les points déjà déclarés Conforme ne sont pas repris.
