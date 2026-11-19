# Claude Code — barre de titre à onglets et Agenda (19/11/2026)

Mission : appliquer à l'application la barre de titre à onglets (D-532) et la nouvelle présentation de l'Agenda (D-533 ; contrat CE-UI-15 ; chapitres 07 et 13 de `docs/Specifications-fonctionnelles/`, branche `docs/planification-grille-creneaux`, à lire sans la fusionner). Lis `docs/DSF-BARRE-TITRE-ONGLETS-2026-11-19.md` et `docs/DSF-AGENDA-PLANNING-2026-11-19.md` (source du rendu), `docs/AGENTS.md` (Expo v57) et `CLAUDE.md`. Travaille sur la branche de planification (`planification/ce-ui-12-20261118`), dans un commit distinct par lot, sans fusion.

Principe : le DSF décrit le rendu ; le Figma (écrans « P-Catalogue des séances » et « Agenda — Planning (proposition) ») le précise. Aucune règle métier nouvelle. Ne promeus pas un comportement en règle : tout point non couvert → signale-le, ne tranche pas.

## Lot 1 — Barre de titre à onglets

1. Remplace le contrôle de navigation des vues par une barre de titre à onglets : Catalogues Mouvements · Séances · Programmes ; Calendrier Journal · Agenda · Vue d'ensemble (les anciens libellés Jour / Semaine / Mois disparaissent de l'interface). Un seul composant partagé, paramétré par la liste d'onglets et l'onglet actif.
2. Géométrie, couleurs, couches et accessibilité : DSF Barre de titre à onglets § 2 à 4.
3. Navigation inchangée : même routes, même vue par défaut, même conservation de la vue.

## Lot 2 — Agenda : zone de contexte, navigation, liste, carte

1. Zone de contexte (DSF Agenda § 2) : trois lignes centrées verticalement ; mois en doubles flèches ; semaine en flèches simples rapprochées du centre (« du 16 au 22 ») ; « Aujourd'hui » en texte seul ; bouton « Planifier » à droite. Hauteur de la bande inchangée (115).
2. Rangée des jours (§ 3) : sept cartes 46 × 64, jour sélectionné plein, un point par séance du jour.
3. Liste (§ 4) : regroupée par jour, en-tête de jour, trait fin entre deux jours, aucun trait entre deux routines. Le défilement conserve le comportement existant (le jour choisi passe en tête, RM-046).
4. Carte d'une routine (§ 5) : une carte par **occurrence de routine** (nom de la routine en titre ; les séances sont dans le déployé), et non une carte par séance. Heure « 8h00 », chronomètre et durée, cadre teinté avec bande et traits épais, chevron de déploiement, étiquette « Terminée » ou bouton « Démarrer ». Dupliquer et Supprimer glissés s'appliquent à la routine.
5. États à conserver : déployé (carte + complément de composition du catalogue sous elle), actions glissées, après suppression, jour sélectionné.

Points À CLARIFIER à ne pas trancher : la propriété « spécialité » n'existe pas dans le modèle de données → n'affiche que les zones corporelles tant qu'elle n'est pas définie et signale-le ; teintes d'état du cadre (rendu provisoire) ; condition d'affichage de « Aujourd'hui » ; comportement du changement de mois. L'écran Jour sera remplacé : ne le modifie pas. L'enchaînement des séances au démarrage est hors périmètre (prompt distinct).

Règles du projet : primitives natives de l'OS prioritaires (aucun remplacement par une imitation) ; baseline gelée.
- PRESERVE : moteur de planification et d'occurrences, formulaire de planification, écran d'exécution, navigation du bas, comportement des routes, tests existants.
- CHANGE : barre de titre des écrans de catalogue et de calendrier ; vue Agenda (zone de contexte, rangée des jours, liste, carte) ; le rendu des cartes du calendrier.
- FORBIDDEN : réécriture massive des tests, changement de primitive native, modification du modèle de domaine, de la persistance ou de l'écran Jour. Tout besoin hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : un test par onglet (libellé, onglet actif, navigation inchangée) ; un test vérifie qu'une routine à plusieurs séances produit une seule carte par occurrence ; tests de la rangée des jours, du regroupement par jour et des états (déployé, glissé, après suppression). Une suite verte ne remplace pas la validation sur iPhone.

Livraison : classe de synchronisation A (le code rejoint D-532 et D-533). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git. À vérifier sur iPhone : barre à onglets sur chaque écran, semaine à cheval sur deux mois, routine à deux séances (une seule carte), glissement et déployé.
