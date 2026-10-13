# PRE-3 (#340) — recette ciblée après les décisions du 12/10 (version 3)

Remplace `procedure-retest-recette1-v2.md` (non exécutée). Durée estimée : 20 minutes. Ni VoiceOver ni base de données.

## 0. Vérifier que la mise à jour est chargée

1. Ouvrir **Routine Dev** avec le réseau actif et attendre 20 secondes ; fermer complètement l’app (balayer vers le haut dans le sélecteur d’apps) ; la rouvrir.
2. Repère : **Catalogue › Créer › « Un nouvel exercice »**, puis toucher la ligne Catégorie. La feuille « Catégorie de l’exercice » a un **✓ bleu en haut à droite**, et toucher une catégorie **ne ferme plus** la feuille.
3. Si le repère est absent, recommencer l’étape 1 une fois. S’il reste absent, s’arrêter et le signaler.

Rapporter une seule fois : **modèle d’iPhone** et **version d’iOS**.

## 1. Changements décidés le 12/10

| ID | Écran affiché | Données de départ | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|---|
| RT-01 Catégorie (D-8) | « Catégorie de l’exercice » | Exercice sans catégorie | 1. Toucher « Cardio ». 2. Toucher « Mobilité ». 3. Toucher ✓. | 1 et 2 : la catégorie touchée est mise en évidence, la feuille reste ouverte. 3 : la feuille se ferme progressivement et « Mobilité » est affichée dans l’éditeur. | Étape en défaut |
| RT-02 Abandon (D-8) | Même feuille | Exercice avec « Mobilité » | Toucher « Cardio », puis ✕ | La feuille se ferme ; l’éditeur affiche toujours **Mobilité** | Catégorie affichée |
| RT-03 Création (D-8, D-9, clavier) | Même feuille | — | « Créer une catégorie » ; écrire « Volonté » ; toucher une couleur de la barre ; toucher **↑** ; puis ✓ | Clavier sans masquer le champ, ↑ ni la barre ; **barre de 12 couleurs** sous le champ, **sans pastille à droite** ; ↑ crée « Volonté », mise en évidence, **feuille ouverte** ; ✓ l’affecte et ferme | Ce qui est masqué ou différent |
| RT-04 Création puis ✕ (D-8) | Même feuille | Exercice avec « Mobilité » | Créer « Souplesse » avec ↑, puis ✕ ; rouvrir la feuille | L’éditeur garde **Mobilité** ; « Souplesse » **existe toujours** dans la liste | Constat |
| RT-05 Saisie incomplète (D-2) | « Paramètres d’exécution » d’un **nouvel** exercice | Durée, 3 Séries, Séries variables activé ; ligne 2 laissée vide (« — ») | Observer | **Aucun texte rouge** « Renseignez … » ; contour **orange** autour de la cellule vide ; ✓ grisé ; total « — » | Texte ou couleur constatés |
| RT-06 Sélecteurs (D-4) | « Paramètres d’exécution » | — | Toucher la valeur « Mode d’exécution », choisir Répétitions ; puis Changement de côté → « Droite puis gauche » ; puis Ordre des côtés → une option | Pour chacun : la valeur choisie s’affiche tout de suite, le sélecteur reste visible un court instant sur ce choix, puis se replie en douceur | Sélecteur qui reste ouvert ou fermeture brusque |
| RT-07 Message d’ajustement (D-5) | « Paramètres d’exécution » | Durée, 1 Série, 30 s, pause 10 s | Toucher le total, choisir 1 min 40 s, valider. **A** : toucher **Annuler**. Recommencer. **B** : toucher le texte du message. | « Annuler » entouré d’un **cadre clair** ; A : retour à 1 série ; B : message fermé, **3 séries conservées** | Résultat A ou B |
| RT-08 Ouverture de la feuille (D-7) | « Paramètres d’exécution » | — | Ouvrir la feuille | Le voile sombre **apparaît sur place** ; seule la feuille monte depuis le bas | Mouvement constaté |
| RT-09 Réduire les animations (D-4, D-7, D-8) | Réglages iOS › Accessibilité › Mouvement › **Réduire les animations : activé** | — | Refaire RT-06, RT-08 et RT-01 étape 3 ; puis **désactiver** le réglage | Sélecteurs et feuille Catégorie se ferment **sans animation** ; la feuille Paramètres apparaît **sans monter** | Animation encore présente |

## 2. Corrections précédentes à vérifier (jamais retestées)

| ID | Écran affiché | Données de départ | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|---|
| RT-10 Glisser (T-15) | « Paramètres d’exécution » | Durée, 3 Séries variables 30 s / 45 s / 1 min | Glisser la ligne 1 (six points) de deux lignes vers le bas | Aucun écran d’erreur ; ordre 45 s, 1 min, 30 s, chaque durée avec sa pause | Message affiché |
| RT-11 Changement de mode (T-10, F-02) | « Paramètres d’exécution » | Comme RT-10, sans ✓ | 1. Ligne 2 : + trois fois. 2. Mode → Répétitions. 3. Ligne 1 : +. 4. Mode → Durée. 5. Mode → Répétitions. Ne jamais toucher l’interrupteur. | 2 : cibles « — ». 4 : la ligne 2 affiche la valeur de l’étape 1. 5 : la ligne 1 affiche « 1 rép. » | Contrôle (4 ou 5) en défaut, valeurs affichées et attendues |
| RT-12 Zone (T-34, T-35) | « Zones corporelles » | — | « Créer une zone corporelle », écrire un nom | Champ et ↑ visibles au-dessus du clavier | Ce qui est masqué |
| RT-13 Vidéo (T-39, T-43) | « Créer un exercice », section Médias | Une vidéo présente sur l’iPhone | Ajouter, Terminer, fermer l’app, rouvrir l’exercice | Vignette montrant une image de la vidéo, avant et après réouverture | Durée de la vidéo, stockage local ou iCloud |
| RT-14 Zone colorée (T-49) | « Créer un exercice » | — | Observer le haut de l’écran | Courbe blanche sous le bouton Retour ; bas de la zone colorée qui devient blanc progressivement. La couleur elle-même ne change pas encore (extension X-3). | Capture |
| RT-15 Tableau replié (A-05, A-01) | « Paramètres d’exécution » | Séries variables activé | Replier (chevron), puis désactiver et réactiver l’interrupteur | Replié : pas de cadre bleu ; après réactivation : tableau déployé, valeurs inchangées | État constaté |
| RT-16 Titres agrandis (T-61) | Réglages iOS › Accessibilité › Affichage et taille du texte › Police plus grande au maximum ; puis les trois feuilles | — | Ouvrir les trois feuilles | Titre de chaque feuille entier, jamais rogné | **Réglage exact** (taille maximale standard ou tailles d’accessibilité supplémentaires), avec capture |
| RT-17 Copie de séance (T-04) | « Composition d’une séance » | Une séance en cours | Ajouter un exercice du Catalogue ; ouvrir sa copie ; Séries +1 ; ✓ ; Terminer ; Continuer ; rouvrir la séance, puis l’exercice dans le Catalogue | La séance garde la nouvelle valeur ; le Catalogue est inchangé | Où la valeur est perdue |
| RT-18 N=1 (T-17) | « Paramètres d’exécution » | 3 Séries variables 30 s / 45 s / 1 min ; Changement de côté « Droite puis gauche » ; Ordre des côtés « Les deux côtés à chaque série » | **A**, sans ✓ : Séries 3 → 1 → 3. **B** : 3 → 1, ✓, Terminer, rouvrir, 1 → 3 | A : valeurs et ordre reviennent. B : pas de restauration ; les nouvelles lignes copient la ligne restante | Valeurs constatées |
| RT-19 Safe Areas (T-62) | Écrans et feuilles PRE-3, sans VoiceOver | — | Regarder le haut et le bas | Retour, ✕, ✓ et Terminer atteignables ; rien sous l’encoche ni sous la barre d’accueil | Élément masqué |

Points non retestables, en attente des extensions X-1 à X-4 : taille et graisse des options (D-6), libellés Côté et Ordre, icône de la Catégorie, couleur de la zone colorée, titres d’écran au texte agrandi.
