# PRE-3 (#340) — retest court après correction (version 2)

Remplace `procedure-appareil-recette1.md` pour le retest. Durée estimée : 15 minutes. Ni VoiceOver ni base de données.

## 0. Vérifier que la mise à jour est chargée

1. Ouvrir **Routine Dev** avec le réseau actif et attendre 20 secondes.
2. Fermer complètement l’app (balayer vers le haut dans le sélecteur d’apps), puis la rouvrir.
3. Repère : **Catalogue › Créer › « Un nouvel exercice »**, écran « Créer un exercice ». Sous le bouton Retour (en haut à gauche), une **courbe blanche** mord dans la zone colorée, et le bas de cette zone devient progressivement blanc.
4. Si le repère est absent, recommencer les étapes 1 et 2 une fois. S’il reste absent, s’arrêter et le signaler : aucun résultat ne serait valable.

Rapporter une seule fois : **modèle d’iPhone** et **version d’iOS**.

## 1. Retests

Pour chaque ligne : Conforme ou Non conforme. En cas de Non conforme, faire une capture et donner l’information demandée.

| ID | Écran affiché | Données de départ | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|---|
| RT-01 Glisser (T-15) | « Paramètres d’exécution » (toucher la carte Paramètres de « Créer un exercice ») | Mode **Durée** ; Séries **3** ; Séries variables **activé** ; durées 30 s / 45 s / 1 min (modifier avec + / −) | Poser le doigt sur les six points à gauche de la ligne 1, glisser **deux lignes** vers le bas, relâcher | Aucun écran d’erreur. La ligne suit le doigt ; après relâchement : 45 s, 1 min, 30 s, chaque durée avec **sa** pause ; numéros 1, 2, 3 | Message affiché, ligne déplacée |
| RT-02 Changement de mode (T-10, F-02) | Même feuille | Celle de RT-01, sans ✓ | 1. Ligne 2 : toucher **+ trois fois**. 2. Toucher la valeur « Mode d’exécution », choisir **Répétitions**. 3. Ligne 1 : toucher **+**. 4. Choisir **Durée**. 5. Choisir **Répétitions**. | Étape 2 : cibles « — ». Étape 4 : la ligne 2 affiche la valeur de l’étape 1. Étape 5 : la ligne 1 affiche « 1 rép. ». Ne **jamais** toucher l’interrupteur Séries variables. | **Lequel** des contrôles 4 ou 5 échoue, valeurs affichées contre attendues, et si le tableau avait été replié avant |
| RT-03 Clavier Catégorie (T-34, T-35) | « Catégorie de l’exercice » (toucher Catégorie dans « Créer un exercice ») | — | Toucher « Créer une catégorie », écrire « Volonté » | Champ, flèche **↑** bleue dans le champ et bandeau de couleurs **visibles au-dessus du clavier** ; ↑ gris tant que le champ est vide ; « Annuler » sous le champ | Ce qui est caché par le clavier |
| RT-04 Bandeau de couleurs (T-34, T-59) | Même formulaire | — | Toucher une couleur du bandeau, puis **↑** | Bandeau horizontal de 12 couleurs ; la couleur touchée s’agrandit avec un liseré blanc ; ↑ crée « Volonté » de cette couleur et la sélectionne | Capture du bandeau |
| RT-05 Clavier Zone (T-34, T-35) | « Zones corporelles » | — | « Créer une zone corporelle », écrire un nom | Champ et **↑** visibles au-dessus du clavier ; aucune palette | Ce qui est caché |
| RT-06 Vidéo (T-39, T-43) | « Créer un exercice », section Médias | Une vidéo **déjà présente sur l’iPhone** | Ajouter la vidéo ; Terminer ; fermer l’app ; rouvrir l’exercice | Vignette montrant **une image de la vidéo** (badge « Vidéo » conservé), avant et après réouverture | Durée de la vidéo, stockée localement ou sur iCloud |
| RT-07 Cadre et réactivation (A-05, A-01) | « Paramètres d’exécution » | Séries variables activé, 3 Séries | 1. Toucher le chevron (tableau replié). 2. Désactiver puis réactiver l’interrupteur. | 1 : plus de cadre bleu autour de la ligne. 2 : tableau **déployé**, valeurs inchangées | État constaté |
| RT-08 Voile (A-04) | Ouvrir « Paramètres d’exécution » | — | Observer l’ouverture | Le voile sombre **apparaît sur place** (fondu) ; seule la feuille monte depuis le bas | Description du mouvement |
| RT-09 Cellule vide (A-02, A-07) | « Paramètres d’exécution » d’un **nouvel** exercice | Durée, 3 Séries, variable ; laisser la ligne 2 vide (cible « — ») | Observer | Contour **orange** autour de la cellule vide ; ✓ grisé ; message « Série 2 : renseignez la durée. » (conservé en attendant la décision D-2) | Couleur du contour |
| RT-10 Titres agrandis (T-61) | Réglages iOS › Accessibilité › Affichage et taille du texte › Police plus grande, **au maximum** ; puis les trois feuilles | — | Ouvrir « Paramètres d’exécution », « Catégorie de l’exercice », « Zones corporelles » | Titre de chaque feuille entier (sur plusieurs lignes si nécessaire), jamais rogné | **Réglage exact utilisé** (taille maximale standard ou tailles d’accessibilité supplémentaires), avec capture |
| RT-11 Copie de séance (T-04) | « Composition d’une séance » | Une séance en cours | Ajouter un exercice du Catalogue ; ouvrir sa copie ; carte Paramètres : Séries +1 ; ✓ ; **Terminer** ; **Continuer** ; rouvrir la séance, puis l’exercice dans le Catalogue | La séance garde la nouvelle valeur ; l’exercice du Catalogue est **inchangé** | Où la valeur est perdue |
| RT-12 N=1 (T-17) | « Paramètres d’exécution » | 3 Séries variables 30 s / 45 s / 1 min ; Changement de côté « Droite puis gauche » ; Ordre des côtés « Les deux côtés à chaque série » | **Essai A**, sans ✓ : Séries 3 → 1 → 3. **Essai B** : 3 → 1, ✓, Terminer, rouvrir, 1 → 3 | A : 30 s / 45 s / 1 min et l’ordre reviennent. B : pas de restauration ; les nouvelles lignes copient la ligne restante | Valeurs constatées |
| RT-13 Safe Areas (T-62) | Écrans et feuilles PRE-3, **sans VoiceOver** | — | Regarder le haut et le bas | Retour, ✕, ✓ et Terminer atteignables ; rien d’important sous l’encoche ni sous la barre d’accueil | Élément masqué |

Points non retestés car en attente de décision ou d’extension : sélecteurs qui restent ouverts, graisse des segmentés, icône de la Catégorie, couleur de la zone de contexte, Annuler du message d’ajustement, phrase « À l’échec », pas Compte à rebours / Fin, Étiquette.
