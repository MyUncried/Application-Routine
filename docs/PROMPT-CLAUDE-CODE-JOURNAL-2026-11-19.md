# Claude Code — Journal des routines (19/11/2026)

Mission : développer l'onglet Journal du calendrier (D-535 ; chapitres 07 et 13 de `docs/Specifications-fonctionnelles/`, branche `docs/planification-grille-creneaux`, à lire sans la fusionner). Lis `docs/DSF-JOURNAL-2026-11-19.md` (source du rendu), `docs/DSF-AGENDA-PLANNING-2026-11-19.md` (§ 5 : carte, § 7 : routine à plusieurs séances) et `docs/DSF-BARRE-TITRE-ONGLETS-2026-11-19.md`. Écran Figma de référence : « Calendrier — Journal — MVP ».

Principe : le DSF décrit le rendu ; le Figma le précise. Aucune règle métier nouvelle. Ne promeus pas un comportement en règle : tout point non couvert → signale-le, ne tranche pas.

## Ce que fait le Journal

Le Journal remplace la vue Jour. C'est la **liste des routines créées** (pas leur planification dans le temps) : une carte par routine, quelle que soit sa récurrence.

1. Zone de contexte (bande 402 × 115, inchangée) : ligne 1 « Actives N · Terminées N » ; ligne 2 champ Rechercher, contrôle Filtre, contrôle Tri, bouton Planifier. Aucune navigation par date. Onglet « Journal » actif dans la barre de titre existante.
2. Liste : cartes espacées de 8 px, sans séparateurs, sans dates de regroupement, sans boutons d'action (ni Démarrer ni Terminer). Pas de glissement.
3. Carte : famille de la carte d'agenda (DSF Agenda § 5), hauteur 72 ; teinte unique `#EAEAFF` (cadre et bande), repères épais en bleu-violet moyen. Cadre : **date de création** de la routine. Ligne 1 : chevron + nom de la routine. Ligne 2 : spécialité · zones corporelles. Ligne 3 : récurrence (« Chaque lundi et jeudi · jusqu'au 28 déc. »). À droite : bouton « Modifier la planification », composant carré 32 × 32 (crayon, fond `#F3F4F9`, coins 10).
4. Comportement : toucher la carte ou le chevron la déploie (même déployé que l'Agenda et le catalogue des séances : filet, puis composition de la séance, réutilise le composant existant) ; le bouton crayon ouvre la routine.
5. Tri par défaut : date de création / modification, la plus récente en haut. Recherche par texte. Filtres : spécialité, catégorie, format, zones corporelles, programme (réutilise les composants de filtre des catalogues).
6. Compteurs : « Active » = au moins une occurrence en cours ou à venir ; « Terminée » = récurrence arrivée à son terme (plus aucune occurrence à venir). Une routine sans date de fin reste active.

Données : les routines existent déjà (créneau + séances ordonnées, enregistrées une fois avec leur nom, RM-258 / RM-261). Le Journal les **lit** ; il ne crée rien de nouveau dans le domaine ni dans la persistance. Calcule la date de création / modification depuis les champs existants ; s'ils manquent, signale-le sans les inventer.

Points À CLARIFIER à ne pas trancher : la propriété « spécialité » n'existe pas dans le modèle → n'affiche que les zones corporelles tant qu'elle n'est pas définie et signale-le ; l'écran de filtre du Journal (valeurs des cinq critères) n'est pas dessiné → utilise les composants de filtre existants sans inventer de variante ; la vue d'ensemble n'est pas concernée.

Règles du projet : primitives natives de l'OS prioritaires (aucun remplacement par une imitation) ; baseline gelée.
- PRESERVE : moteur de planification et d'occurrences, formulaire de planification, écran d'exécution, vue Agenda, navigation du bas, routes existantes, tests existants.
- CHANGE : écran Journal (remplace la vue Jour) ; son entrée dans la barre à onglets du calendrier ; le composant de bouton d'édition carré.
- FORBIDDEN : réécriture massive des tests, changement de primitive native, modification du modèle de domaine ou de la persistance, retouche de l'Agenda. Tout besoin hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : la liste affiche une carte par routine (une routine à deux séances = une carte) ; ordre par défaut ; compteurs Actives / Terminées ; déploiement ; le crayon ouvre la routine ; recherche et filtres. Une suite verte ne remplace pas la validation sur iPhone.

Livraison : classe de synchronisation A (le code rejoint D-535). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git. À vérifier sur iPhone : liste de routines, déploiement, ouverture par le crayon, tri, recherche, filtres, routine sans date de fin.
