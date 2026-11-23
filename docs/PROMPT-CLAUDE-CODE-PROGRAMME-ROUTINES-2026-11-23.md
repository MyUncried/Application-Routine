# Claude Code — routines d'un programme (23/11/2026)

Mission : appliquer D-544 (registre, ch07 ; `docs/DSF-PROGRAMMES-2026-11-23.md` § 2), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. Écran Figma : « PROG — 13 Créer ou configurer un programme », carte Planifications.

1. Chaque routine du programme reprend le format des routines du Journal (réutilise le composant de ligne du Journal ; pas de seconde implémentation) : cadre à gauche 80 × 44, trait d'état épais à gauche et à droite (6 × 44), bande de prolongement, couleurs de l'état « prévu », le tout contenu dans la carte (bords alignés).
2. Cadre : date de création de la routine, jour et mois abrégé en gras (« 12 sept. »), année dessous (« 2026 »).
3. Bloc de texte à 14 du cadre : nom (Inter Semi Bold 15, token existant) ; seconde ligne (Inter Regular 12, token existant) = « du X au Y », jours en chiffres, mois en toutes lettres, sans année (« du 15 septembre au 15 décembre »). Plus de fréquence ni d'heure sur la ligne.
4. Lignes séparées de 8 ; « + Planifier une séance » et « Rattacher une routine existante » restent sous les routines, avec leur filet.
5. Tests : la ligne utilise le composant du Journal ; le texte de la seconde ligne suit le format (mois en lettres, pas d'année).

Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires ; Expo v57 ; aucune réécriture hors périmètre. PRESERVE / CHANGE / FORBIDDEN à établir avant de coder et à démontrer dans le rapport de mission. Si l'objet Programme (modèle, stockage, catalogue) n'existe pas encore dans le code, ne l'invente pas : dis-le en tête du rapport, applique seulement ce qui s'appuie sur du code existant et signale le reste « préparé, non appliqué ».
