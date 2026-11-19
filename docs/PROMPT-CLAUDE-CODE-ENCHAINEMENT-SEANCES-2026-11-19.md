# Claude Code — enchaînement des séances d'une routine (19/11/2026)

Mission : appliquer la décision D-534 (chapitre 07 de `docs/Specifications-fonctionnelles/`, branche `docs/planification-grille-creneaux`, à lire sans la fusionner ; rendu : `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 7). Lis aussi `docs/AGENTS.md` (Expo v57) et `CLAUDE.md`. Travaille sur la branche de planification (`planification/ce-ui-12-20261118`), commit dédié, sans fusion.

Constat : une routine à plusieurs séances est enregistrée correctement (une Routine, un nom, une occurrence à plusieurs contenus). Le calendrier affichait une carte par séance, chacune lançant `/execution` avec un seul `sessionId`. Le lot « une carte par occurrence » est traité dans le prompt Agenda / onglets (à faire avant celui-ci) ; ici, il s'agit de « Démarrer » sur la carte de la routine.

Principe : une couche d'orchestration **au-dessus** du moteur. Le moteur d'exécution (`src/domain/execution/`, `ExecutionService`) ne change pas : chaque séance reste une exécution complète et indépendante (`prepare` → `start` → `FINISHED` → `release`), avec son propre checkpoint, ses résultats et son historique.

À faire :
1. « Démarrer » sur la carte d'une routine ouvre `/execution` pour la **première** séance de la liste ordonnée de l'occurrence, en transmettant la chaîne : liste ordonnée des `sessionId` et rang courant (paramètres de route ou état en mémoire de l'orchestrateur ; **aucune nouvelle persistance**).
2. Quand une séance se termine normalement, `close()` ne revient plus au calendrier s'il reste une séance : il libère l'exécution (`service.release()`) **avant** de naviguer, puis remplace l'écran par celui de la séance suivante (même route, rang + 1), sans empiler. Après la dernière séance, retour au calendrier comme aujourd'hui.
3. Écran de transition : l'écran de démarrage de la séance suivante (rang ≥ 2), recouvert d'un voile vert translucide (≈ 35 %, vert des étiquettes « Terminée »), avec au centre un encadré vert plein plus foncé (rayon 16, marge 20) portant, en blanc, Inter semi-gras 32, sur trois lignes : « Appuyer pour » / « démarrer la 2è séance » / « du parcours » (rang calculé : 2è, 3è…). Écran Figma de référence : « Exécution d'une séance — Initial — Enchaînement (proposition) ». Un toucher n'importe où sur le voile déclenche la même action que « Démarrer » et fait disparaître le voile. [Hypothèse à signaler dans le rapport : l'appui lance directement la séance, sans second appui sur « Démarrer ».] La première séance (rang 1) s'ouvre sans voile, comme aujourd'hui.
4. Aucune information sur la séance, la routine ou le parcours n'est ajoutée aux écrans d'exécution eux-mêmes ; le voile est le seul ajout.
5. Reprise après interruption du processus (`ExecutionRecoveryGate`) : seule la séance interrompue est reprise ; la chaîne n'est pas reconstituée. À la fin de cette séance, retour au calendrier.

À CLARIFIER (ne pas trancher, ne pas dessiner) : arrêt volontaire d'une séance de la chaîne. Décision de principe : la suite est proposée (« Passer à la suivante » ou « Terminer »), mais formulation et dessin ne sont pas faits. En attendant, un arrêt volontaire ou une interruption termine la chaîne et ramène au calendrier ; signale-le dans le rapport.

Baseline gelée :
- PRESERVE : moteur et noyau d'exécution, `ExecutionService` (API et persistance), résultats et historique, planification et occurrences, écran de démarrage d'une séance isolée (Catalogue des séances), bips et vocal, dialogues, anneau et compteurs, tests existants.
- CHANGE : route `/execution` (paramètres de chaîne), `close()` de l'écran d'exécution, point d'entrée « Démarrer » de la carte de routine, écran de transition (voile).
- FORBIDDEN : modifier le moteur ou son modèle, fusionner plusieurs séances en une seule exécution, ajouter une persistance, réécrire les tests en masse, remplacer une primitive native. Tout besoin hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : un test de l'orchestrateur (une séance : comportement inchangé ; deux séances : la fin de la première ouvre la seconde avec rang 2, la fin de la seconde ramène au calendrier) ; un test vérifie que `release()` précède la navigation (pas de `ExecutionBlockedError`) ; un test du voile (absent au rang 1, présent au rang ≥ 2 avec le texte exact, un toucher lance la séance) ; un test de la reprise après interruption (pas de chaîne). Une suite verte ne remplace pas la validation sur iPhone.

Livraison : classe de synchronisation A (le code rejoint D-534). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git. À vérifier sur iPhone : routine à deux et à trois séances de bout en bout, bips et vocal entre deux séances, voile (lisibilité du texte sur le fond), arrêt volontaire en cours de chaîne, interruption puis reprise.
