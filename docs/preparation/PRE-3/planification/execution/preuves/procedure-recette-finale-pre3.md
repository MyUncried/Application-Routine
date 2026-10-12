# PRE-3 (#340) — recette finale consolidée

Procédure **unique** : elle remplace `procedure-appareil-recette1.md` et `procedure-retest-recette1-v2.md` / `-v3.md`. Durée estimée : 25 minutes. Ni VoiceOver ni base de données. La mise à jour à charger, son identifiant et son commit exact sont donnés dans le rapport `2026-10-12_PRE3-340_FINALISATION-RECETTE.md` (section Publication).

## 0. Charger la mise à jour et vérifier qu’elle est active

1. Ouvrir **Routine Dev** avec le réseau actif et attendre 20 secondes.
2. Fermer complètement l’app (balayer vers le haut dans le sélecteur d’apps), puis la rouvrir.
3. **Repère** : **Catalogue › Créer › « Un nouvel exercice »**. Sur l’écran « Créer un exercice » :
   - à gauche de « Catégorie », l’icône est un **petit arbre bleu** (un rectangle en haut et deux branches à droite), et non plus l’icône du Circuit ;
   - la zone colorée du haut est **lavande** (#EAEAFF), avec une courbe blanche sous le bouton Retour.
4. Si le repère est absent, recommencer les étapes 1 et 2 une fois. S’il reste absent, **s’arrêter** et le signaler : aucun résultat ne serait valable.

À rapporter une seule fois : **modèle d’iPhone** et **version d’iOS**.

## 1. Retests

Pour chaque ligne : **Conforme** ou **Non conforme**. En cas de Non conforme, faire une capture et donner l’information demandée.

### A. Éditeur et Catégorie

| ID | Écran affiché | Données de départ | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|---|
| R-01 Zone colorée (T-49, X-3) | « Créer un exercice » | — | Observer le haut | Fond lavande ; courbe blanche sous Retour ; bas de la zone qui devient blanc progressivement | Capture |
| R-02 Icône (T-59, X-2) | « Créer un exercice » | Aucune catégorie choisie | Observer la ligne Catégorie | Icône arbre bleue, nette, à la taille de l’icône voisine | Capture |
| R-03 Choix (D-8) | « Catégorie de l’exercice » | Exercice sans catégorie | Toucher « Cardio », puis « Mobilité », puis **✓** | La feuille reste ouverte aux deux touchers ; ✓ la ferme progressivement et l’éditeur affiche **Mobilité** | Étape en défaut |
| R-04 Abandon (D-8) | Même feuille | Exercice avec « Mobilité » | Toucher « Cardio », puis **✕** | L’éditeur affiche toujours **Mobilité** | Catégorie affichée |
| R-05 Création (D-8, D-9, clavier) | Même feuille | — | « Créer une catégorie » ; écrire « Volonté » ; toucher une couleur ; **↑** ; puis **✓** | Clavier sans masquer le champ, ↑ ni la barre ; **barre de 12 couleurs** sous le champ, sans pastille à droite ; ↑ crée « Volonté » et la marque, **feuille ouverte** ; ✓ l’affecte et ferme | Ce qui est masqué ou différent |
| R-06 Création puis ✕ (D-8) | Même feuille | Exercice avec « Mobilité » | Créer « Souplesse » avec ↑, puis ✕ ; rouvrir la feuille | L’éditeur garde **Mobilité** ; « Souplesse » existe toujours dans la liste | Constat |
| R-07 Zone (T-34, T-35) | « Zones corporelles » | — | « Créer une zone corporelle », écrire un nom | Champ et ↑ visibles au-dessus du clavier | Ce qui est masqué |
| R-08 Vidéo (T-39, T-43) | « Créer un exercice », section Médias | Une vidéo présente sur l’iPhone | Ajouter ; Terminer ; fermer l’app ; rouvrir l’exercice | Vignette montrant une image de la vidéo, avant et après réouverture | Durée et provenance (locale ou iCloud) |

### B. Feuille « Paramètres d’exécution »

| ID | Données de départ | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|
| R-09 Options des sélecteurs (D-6, X-1) | **Nouvel** exercice (mode vide), Changement de côté « Droite puis gauche » | Ouvrir Mode d’exécution, puis Changement de côté, puis Ordre des côtés | Mode : **aucune option en surbrillance** tant qu’aucun choix n’est fait ; textes plus petits, non gras, centrés. Côté : chaque option sur **deux lignes** (« Droite puis / gauche »). Ordre : titre et sous-titre « (D1 → D2) → (G1 → G2) » centrés. Cadre blanc à contour gris clair. Les titres des lignes à gauche sont inchangés. | Option concernée, capture |
| R-10 Fermeture des sélecteurs (D-4) | — | Mode → Répétitions ; Côté → une option ; Ordre → une option | La valeur choisie s’affiche tout de suite, reste visible un instant, puis le sélecteur se replie en douceur | Sélecteur qui reste ouvert ou fermeture brusque |
| R-11 Changement de mode (T-10, **F-02**) | Durée, 3 Séries, Séries variables 30 s / 45 s / 1 min, sans ✓ | 1. Ligne 2 : + trois fois. 2. Mode → Répétitions. 3. Ligne 1 : +. 4. Mode → Durée. 5. Mode → Répétitions. **Ne jamais toucher l’interrupteur.** | 2 : cibles « — ». 4 : la ligne 2 affiche la valeur de l’étape 1. 5 : la ligne 1 affiche « 1 rép. » | **Contrôle en défaut (4 ou 5), valeurs affichées et attendues, tableau replié ou non** |
| R-12 Glisser (T-15) | Comme R-11 | Glisser la ligne 1 (six points) de deux lignes vers le bas | Aucun écran d’erreur ; 45 s, 1 min, 30 s, chaque durée avec sa pause | Message affiché |
| R-13 Saisie incomplète (D-2) | Nouvel exercice : Durée, 3 Séries, variables, ligne 2 vide (« — ») | Observer | Aucun texte rouge « Renseignez … » ; contour **orange** autour de la cellule vide ; ✓ grisé ; total « — » | Texte ou couleur constatés |
| R-14 Groupe et repli (A-05, A-01, X-3) | Séries variables activé | Observer, replier (chevron), puis désactiver et réactiver l’interrupteur | Déployé : cadre bleu, fond gris très clair ; replié : pas de cadre ; après réactivation : tableau déployé, valeurs inchangées | État constaté |
| R-15 Message d’ajustement (D-5) | Durée, 1 Série, 30 s, pause 10 s | Toucher le total, choisir 1 min 40 s, valider. **A** : Annuler. Recommencer. **B** : toucher le texte du message. | « Annuler » dans un **cadre clair** ; A : retour à 1 série ; B : message fermé, **3 séries conservées** | Résultat A ou B |
| R-16 Ouverture (D-7) | — | Ouvrir la feuille | Le voile apparaît sur place ; seule la feuille monte depuis le bas | Mouvement constaté |
| R-17 N=1 (T-17) | 3 Séries variables 30 s / 45 s / 1 min ; Changement de côté « Droite puis gauche » ; Ordre des côtés « Les deux côtés à chaque série » | **A**, sans ✓ : Séries 3 → 1 → 3. **B** : 3 → 1, ✓, Terminer, rouvrir, 1 → 3 | A : valeurs et ordre reviennent. B : pas de restauration ; les nouvelles lignes copient la ligne restante | Valeurs constatées |

### C. Réglages iOS, Séance et écran

| ID | Préparation | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|
| R-18 Réduire les animations (D-4, D-7, D-8) | Réglages › Accessibilité › Mouvement › **Réduire les animations : activé** | Refaire R-10, R-16 et l’étape ✓ de R-03 ; puis **désactiver** le réglage | Sélecteurs et feuille Catégorie se ferment sans animation ; la feuille Paramètres apparaît sans monter | Animation encore présente |
| R-19 Texte agrandi (T-61, X-1, X-4) | Réglages › Accessibilité › Affichage et taille du texte › Police plus grande **au maximum** | Ouvrir « Créer un exercice », puis les trois feuilles et les sélecteurs Mode, Côté et Ordre | Titre de l’écran, titres des feuilles et options des sélecteurs **entiers**, sur plusieurs lignes si nécessaire, jamais rognés ; les sélecteurs grandissent | **Réglage exact** (taille maximale standard ou tailles d’accessibilité supplémentaires), avec capture. *Le Catalogue (Créer / Filtrer / Trier) et le Profil sont hors PRE-3.* |
| R-20 Copie de séance (T-04) | « Composition d’une séance » en cours | Ajouter un exercice du Catalogue ; ouvrir sa copie ; Séries +1 ; ✓ ; Terminer ; Continuer ; rouvrir la séance, puis l’exercice dans le Catalogue | La séance garde la nouvelle valeur ; le Catalogue est inchangé | Où la valeur est perdue |
| R-21 Safe Areas (T-62) | — | Regarder le haut et le bas des écrans et feuilles PRE-3, sans VoiceOver | Retour, ✕, ✓ et Terminer atteignables ; rien sous l’encoche ni sous la barre d’accueil | Élément masqué |

Hors de cette recette :
- VoiceOver (T-63 à T-65) : procédure courte séparée ;
- erreur iCloud (T-42, non provoquée) : couverte par les tests techniques ;
- clavier de l’Étiquette : surface PRE-2, hors PRE-3 ;
- phrase avec pauses variables : évolution D-338 ;
- fond rouge de la cellule incomplète : tranche ultérieure (D-337).
