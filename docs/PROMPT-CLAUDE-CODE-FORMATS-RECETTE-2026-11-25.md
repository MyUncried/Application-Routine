# Claude Code — Formats : corrections de recette iPhone (25/11/2026)

Mission : appliquer D-572 (registre, ch07 ; `docs/KODJO-Formats-entrainement-2026-11-02.md` § 9.9, branche `docs/planification-grille-creneaux`, à lire sans la fusionner), en complément de D-568 à D-571 (la modale allégée est conservée ; elle s'ouvre depuis la page de l'exercice, D-573). Ces règles décrivent le contenu des réglages d'exercice (modale « Paramètres d'exécution » allégée).

Général
1. Le clavier ne doit jamais masquer le champ saisi (Charge notamment) : la feuille se remonte ou défile au-dessus du clavier.
2. « De chaque côté » : menu natif iOS.
3. « + Ajouter » devient « + Modifier » dès qu'un mouvement est choisi. 5 mouvements au plus par format.
4. Catalogue en modification : mouvements sélectionnés figés en haut, en état sélectionné (zone plafonnée à environ 40 % de la hauteur, défilement interne) ; la liste défile dessous et disparaît derrière la zone figée ; marge sous la dernière carte ; aucune carte visible entre les cartes figées ; désélectionner une carte la libère.
4 bis. Modale « Paramètres d'exécution » : pas de poignée ; fermeture par la croix (sans valider) ou la coche (valide) ; désactiver la fermeture par glissé vers le bas (D-574).
4 ter. Pages Tabata, 30/30, HIIT : colonne « Intervalle » ; Durée totale en dernière ligne ; charge sous la valeur de l'intervalle (petit, entre parenthèses), sans colonne Charge. Page Renforcement : Durée totale après Exécution ; charge sous l'objectif ; première colonne « Séries » ; suppression de la ligne globale « Nombre de séries » ; Death by : charge sous Départ ; dernière colonne des tableaux alignée à droite ; modale du Renforcement : cadres [Mode, Répétitions, Séries, Charge], [De chaque côté, Cadence], [Pause] (D-575).

Par format
5. Cadence rétablie : Tabata, 30/30, Renforcement, Superset, Progression.
6. Tabata, 30/30 : objectif de répétitions facultatif. Renseigné : résultat (total de répétitions par exercice) saisi après l'exécution, facultatif. Non renseigné : aucun résultat.
7. Renforcement : champ valeur (répétitions ou durée selon le Mode). Corriger la validation impossible en Durée.
8. Superset : tableau standard par tour (identiques ou variables), avec charge si besoin ; corriger la validation impossible en Durée ; « Récupération après le tour » vide affiche « — ». Nom selon le nombre de mouvements : 2 Superset, 3 Tri-set, 4 et plus Giant set ; le nom de la modale, la proposition de préfixe du nom de séance et le nom du format sur la carte du catalogue suivent la sélection.
9. Progression : retirer la pause comme paramètre global.
10. EMOM : intervalle propre à chaque mouvement et à chaque tour ; plus d'un tour : tableau par série (objectif en durée ou répétitions, intervalle, charge). « Dans chaque intervalle » : l'intervalle de chaque tour est partagé par les mouvements, le modifier pour l'un le modifie pour les autres.
11. Paramètre global « Nombre de Tabata / de 30/30 / d'EMOM / de For time » : nombre de tours du circuit en « À la suite », nombre de cycles en « En alternance » ; « Repos entre les cycles » affiché seulement si le nombre est supérieur à 1.
12. AMRAP : Condition d'arrêt « À l'échec » ou « À l'objectif » ; corriger « À l'échec » inactif dans la modale et la case « Max » inactive dans le tableau ; un seul terme, « À l'échec » (« Max » disparaît). For time : toujours à l'objectif, ligne Condition d'arrêt non affichée.

Hors périmètre : exécution, calcul des durées au-delà des champs ci-dessus.
Tests : un cas par point ci-dessus (clavier ouvert sur chaque champ de saisie ; validation en Durée sur Renforcement et Superset ; nom selon 2, 3, 4 et 5 mouvements ; cycles avec et sans repos ; intervalle partagé EMOM ; catalogue avec 1 à 5 sélections).
Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires ; Expo v57 ; aucune réécriture hors périmètre. PRESERVE / CHANGE / FORBIDDEN à établir avant de coder et à démontrer dans le rapport. La validation visuelle se fait sur iPhone.
