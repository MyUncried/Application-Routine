# Claude Code — Cycle de vie d'une routine : créneau expiré, routines actives et terminées (20/11/2026)

Mission : appliquer D-540 (registre, ch07 ; `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 10 ; `docs/DSF-JOURNAL-2026-11-19.md` § 2 et § 6), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. Ce lot remplace l'archivage des routines de `PROMPT-CLAUDE-CODE-SUPPRESSION-2026-11-20.md` (points 2 et 4). Expo v57 : lire la documentation versionnée avant d'écrire du code. Aucun autre changement.

## À faire (états calculés à l'affichage, jamais enregistrés)

1. **Créneau rattrapable** : un créneau non commencé dont la date est passée reste rattrapable (rouge, « Rattraper ») jusqu'au début du créneau suivant de la même routine (non supprimé), qu'un créneau ait été exécuté ou non entre-temps. Le dernier créneau d'une routine reste rattrapable 10 jours après sa date : constante unique, pas de réglage dans le profil.
2. **Créneau expiré** : ensuite, il garde son cadre rouge, l'étiquette rouge « Expiré » (même gabarit que « Partielle » ou « Arrêtée ») remplace le bouton « Rattraper », sans « Démarrer » ; il reste visible dans l'Agenda passé, n'est pas modifié par un changement de la routine (il n'est pas compté dans « N créneaux non commencés seront modifiés ») et est supprimé avec la routine. Supprimer le créneau suivant recalcule la règle.
3. **Routine active** : au moins un créneau à venir ou rattrapable, même si sa date de fin est passée ; sinon **terminée**. Prolonger la date de fin ou ajouter un créneau la réactive.
4. **Journal** : liste par défaut = routines actives seulement ; le statut du filtre « Archivées » devient « Terminées » (les terminées y sont visibles). Compteurs « Actives · Terminées » selon cette définition.
5. **Plus d'archivage de routine** : supprimer l'action glissée « Archiver » du Journal ; « Supprimer » reste. Routine avec au moins un créneau commencé : ses créneaux non commencés sont supprimés et elle devient terminée ; message du dialogue : « N créneaux non commencés seront supprimés. La routine sera terminée. » (le dialogue et son titre « Supprimer cette routine » restent). Routine sans créneau commencé : suppression complète, inchangée. Supprimer la dernière occurrence à venir : la routine devient terminée.
6. Filtre par routine de l'Agenda (D-539) : la liste inclut aussi les routines terminées.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : règles de figement D-536, suppression d'un créneau D-537 (1)(2), historique et graphiques, carte de routine, séances (le statut « Archivées » des séances n'est pas concerné), filtres multicritères du Journal, tout le reste de l'Agenda.
- CHANGE : calcul de l'état des créneaux et des routines, liste par défaut et statut du filtre du Journal, action glissée, message de suppression, étiquette « Expiré » (rouge) à la place du bouton « Rattraper ».
- FORBIDDEN : enregistrer l'état en base ; ajouter un réglage ; toucher aux séances archivées ; promouvoir en règle un comportement non décidé. Le rendu de l'étiquette « Expiré » est dessiné dans Figma (« P-Calendrier — Semaine — Créneau expiré (proposition) ») : suis-le.

## Tests et recette

- Tests : créneau manqué rattrapable jusqu'au créneau suivant puis expiré ; créneau suivant exécuté ou non ; dernier créneau expiré à 10 jours ; suppression du créneau suivant (règle recalculée) ; routine active (créneau rattrapable seul, date de fin passée) puis terminée ; prolongation de la date de fin ; liste par défaut du Journal et filtre « Terminées » ; compteurs ; action glissée sans « Archiver » ; suppression d'une routine avec historique ; créneaux expirés non modifiés par un changement de routine.
- À vérifier sur iPhone : étiquette « Expiré » (lisibilité sur le cadre rouge), bascule d'un créneau à minuit, liste du Journal après suppression.

Livraison : classe de synchronisation A (le code rejoint D-540). Rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
