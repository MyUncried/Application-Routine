# Claude Code — période d'un programme (23/11/2026)

Mission : appliquer D-543 (registre, ch07 ; `docs/DSF-PROGRAMMES-2026-11-23.md` § 1), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. Écran Figma : « PROG — 13 Créer ou configurer un programme », carte Période.

1. Trois lignes : « Du [date] » ; « au [date] » ou « pendant [N] [jours / semaines / mois] » (le mot « au » / « pendant » est une valeur modifiable qui ouvre un menu pour changer de mode) ; une ligne d'information en gris, non modifiable.
2. Ligne d'information : mode dates, « N jours, soit S semaines » (+ « et J jour(s) » si N n'est pas multiple de 7 ; moins d'une semaine : « N jours » seul) ; mode durée, « Se termine le 14 décembre 2026 ».
3. Fin comprise dans la période : jours et semaines = début + N − 1 jour (semaine = 7 jours) ; mois = même quantième du mois suivant moins un jour, dernier jour du mois si le quantième n'existe pas (31 janvier + 1 mois : 28 février).
4. Changement de mode sans perte : de dates vers durée, la période s'exprime en jours, ou en semaines si multiple de 7.
5. Bornes : fin ≥ début ; durée ≥ 1.
6. Raccourcir la période : si des créneaux d'une planification dépassent la nouvelle fin, confirmation « N créneaux seront supprimés ».
7. Figma ne montre que le mode dates ; le mode « pendant » est à réaliser d'après cette spécification, avec les composants existants (valeurs modifiables, menu natif iOS).
8. Tests : logique de calcul (mois, fin de mois, semaines, changement de mode) en tests unitaires ; ne les remplace pas par une preuve sur iPhone.

Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires ; Expo v57 ; aucune réécriture hors périmètre. PRESERVE / CHANGE / FORBIDDEN à établir avant de coder et à démontrer dans le rapport de mission. Si l'objet Programme (modèle, stockage, catalogue) n'existe pas encore dans le code, ne l'invente pas : dis-le en tête du rapport, applique seulement ce qui s'appuie sur du code existant et signale le reste « préparé, non appliqué ».
