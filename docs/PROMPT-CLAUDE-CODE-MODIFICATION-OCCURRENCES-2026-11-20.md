# Claude Code — modification d'une routine et de ses occurrences (20/11/2026)

Mission : corriger la planification pour appliquer D-536 (registre, ch07, branche `docs/planification-grille-creneaux`, à lire sans la fusionner ; `docs/DSF-JOURNAL-2026-11-19.md` § 5 et `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 8). Aucune règle métier nouvelle : D-536 est la source. Tout point non couvert → signale-le, ne tranche pas.

## Problème constaté en recette

Modifier la séquence d'une routine depuis le Journal réécrit toutes les occurrences, passées et à venir, exécutées ou non, et change leur statut (une occurrence Complétée devient Partielle). C'est une réécriture de l'historique.

## Règles à appliquer

1. Une occurrence est **commencée** dès qu'une de ses séances a été lancée (complète, partielle ou arrêtée). Elle est figée : séquence, séances et statut ne changent plus ; aucune modification n'est possible dessus.
2. Modifier la routine depuis le Journal ne s'applique qu'aux occurrences **non commencées** : à venir, d'aujourd'hui, passées non faites. Une modification ne change jamais le statut d'une occurrence. À la sauvegarde, une confirmation : « N occurrences non commencées (à venir ou à rattraper) seront modifiées ; les occurrences déjà commencées restent inchangées ».
3. **Protection par groupe** : un changement global ne remplace que les réglages non modifiés à la main sur l'occurrence. Trois groupes : date et heure ; séances (pastilles activées ou désactivées, séance ajoutée) ; rappel. Une occurrence déplacée suit donc un futur changement de séquence.
4. Modification d'une occurrence seule, dans l'Agenda : date, heure, activation ou désactivation des pastilles du créneau, ajout d'une séance à ce créneau uniquement (une séance ajoutée à la main peut être retirée de l'occurrence ; les séances de la routine ne se retirent pas, on les désactive), rappel. Seul le créneau de l'occurrence ouverte est coloré (en-tête et pastille), les autres sont grisés. Choix « Cette occurrence seulement » / « Toute la routine » avant la sauvegarde, sur le modèle de la suppression d'occurrences. Dans le Journal, la modification porte toujours sur la routine entière.
5. Occurrence « Complétée » = toutes ses séances **actives** sont faites ; désactiver une pastille avant de lancer ne la rend pas « Partielle ».
6. Bouton : « Rattraper » sur une occurrence passée non commencée (journée terminée) ; « Démarrer » sinon ; étiquette « Complétée », « Partielle » ou « Arrêtée » pour une occurrence commencée. Pastille à hauteur fixe, largeur selon le texte.
7. **Dates** : conserve la date prévue de l'occurrence et enregistre la date réelle d'exécution (début et fin) de chaque séance, nécessaire aux graphiques. Vérifie d'abord si c'est déjà le cas ; sinon, signale-le avant de modifier le modèle (migration possible).

## Implémentation

La séquence d'une occurrence doit être conservée au moment où elle est figée (copie à ce moment-là ou versions de la routine avec date d'effet) au lieu d'être recalculée depuis la routine. Cela touche le modèle de données : propose l'approche et attends validation avant de coder. Une occurrence figée dont une séance a été retirée de la routine doit toujours pouvoir l'afficher.

Règles du projet : baseline gelée.
- PRESERVE : moteur d'exécution, écrans d'exécution, formulaire de planification (hors points ci-dessus), tests existants.
- CHANGE : application des modifications de routine aux occurrences, modification d'une occurrence, états du bouton.
- FORBIDDEN : réécriture massive des tests, changement de primitive native, toute modification du modèle sans validation. Hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : une occurrence Complétée reste Complétée après ajout d'une séance ; inversion de séquence : seules les occurrences non commencées changent ; occurrence en cours inchangée ; occurrence rouge suit la nouvelle séquence, reste rouge, affiche « Rattraper » ; occurrence future exécutée en avance inchangée ; occurrence déplacée à la main suit un changement de séquence mais pas un changement de récurrence. Une suite verte ne remplace pas la recette sur iPhone.

Livraison : classe de synchronisation A. Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
