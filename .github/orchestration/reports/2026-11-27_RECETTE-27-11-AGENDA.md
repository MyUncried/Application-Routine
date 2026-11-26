# Recette iPhone du 26/11/2026 (soir) — paquet AGENDA : glissé gauche sur les planifications de l'Agenda

## Identification

- Mission : RECETTE-27-11-AGENDA (diagnostic, arrêt avant code : À CLARIFIER).
- Objectif : demande de Hermann (remarque d, mots exacts) : « Agenda, glissé gauche : doit aussi être actif pour les planifications de l'agenda. » Identifier les lignes de planification de l'Agenda sans glissé gauche (ou hors règle unique `SwipeActionsRow nativeGesture`) et les actions qu'elles doivent révéler, d'après la documentation ou les actions déjà offertes ailleurs pour la même planification ; à défaut de spécification, ne rien inventer.
- Branche : `fix/recette-27-11-agenda` (worktree `C:\Dev\KODJO-R27-AGENDA`).
- Commit de départ : `202570906` (recette `recette/agenda-axe-20261124`, lot 22 ; c'est aussi le HEAD servi par `KODJO-SERVE`, donc la version testée par Hermann).

## Périmètre

- Demandé : lignes de planification de l'Agenda (vue « Semaine », `CalendarWeekScreen`) ; actions à révéler.
- Traité : `CalendarWeekScreen.tsx` (rendu des cartes et des groupes de parcours), `SwipeActionsRow.tsx` (condition d'activation du geste natif), `PlanScreen.tsx` (vue Plan, pour écarter une autre lecture), rapport SUITE2 du 26/11, DSF Agenda, spécification du 21/11/2026 (§ 8), registre ch07 (D-534, D-537, D-549, D-553, D-568).
- Aucun fichier applicatif modifié.

## Constats

1. **Cartes de Séance de l'Agenda : déjà sur la règle unique.** Chaque carte (Séance seule ou Séance d'un parcours) est rendue par `SwipeActionsRow` avec `nativeGesture` (`src/features/planning/CalendarWeekScreen.tsx:519-539`, branchement SUITE2, commit `feb2c5093`, ancêtre de `202570906` et présent dans `KODJO-SERVE`). Actions : « Dupliquer » (routine), « Supprimer » (occurrence, ou Séance seule dans un parcours — D-537, D-553 arbitrage 9), ou « Rétablir » seule sur une carte « Supprimée » (D-568) (`CalendarWeekScreen.tsx:475-511`). Test `CalendarWeekScreen.integration.test.tsx:657` (règle unique) en place.
2. **Cartes sans glissé, par spécification** (le geste natif ne s'arme pas sans action : `SwipeActionsRow.tsx:175` et `:269`, `offset > 0`) :
   - Exécution hors planification (`occurrence === undefined` → `[]`, `CalendarWeekScreen.tsx:494-495`) : ce n'est pas une planification ; D-553 / commentaire l. 474 « Hors planification : aucune action glissée ».
   - Carte « Supprimée » dont la date est passée : « Rétablir » seulement tant que la date n'est pas passée (D-568).
3. **Ligne « Ⓟ nom » d'un parcours : aucun glissé.** C'est la seule ligne de l'Agenda qui représente la planification (Routine à plusieurs Séances, créneau) et non une Séance. Elle est rendue par une simple `View` (`CalendarWeekScreen.tsx:634-641`), sans `SwipeActionsRow`. C'est la lecture la plus probable de « les planifications de l'agenda » (« aussi » : en plus des cartes de Séance qui glissent déjà).
4. **Actions spécifiées pour la ligne Ⓟ : aucune.**
   - D-553 : ligne « Ⓟ nom » « sans heure, statut ni compteur » ; les gestes sont définis sur la carte d'une Séance de parcours uniquement.
   - Spécification du 21/11/2026, § 8, point 9 (`docs/KODJO-Agenda-seances-journal-filtre-2026-11-21.md:87`) : « Supprimer tout le Parcours d'un jour revient à supprimer chacune de ses Séances. La suppression de la dernière Séance restante supprime le créneau : aucune ligne Ⓟ ne reste seule. » — la suppression du parcours entier passe, telle qu'écrite, par ses Séances, pas par une action propre.
   - DSF Agenda l. 68 (« Dupliquer et Supprimer s'appliquent à la routine ») et D-534 : carte unique par occurrence d'une routine à plusieurs séances — **remplacé** par D-553 (21/11/2026) ; ne peut pas fonder une action sur la ligne Ⓟ.
   - D-549 (« glisser à gauche retire une routine du programme ») concerne la feuille d'un programme, déjà sur la règle unique — hors Agenda.
5. **Actions déjà offertes ailleurs pour la même planification** :
   - « Dupliquer » : présent sur chaque carte de Séance du parcours, et porte déjà sur la routine entière (`duplicate(occurrence.routineId)`, l. 497) — reprise directe possible, sans nouvelle règle.
   - « Supprimer » le créneau entier : le service et le dialogue existent (`planning.excludeOccurrence`, dialogue « Supprimer ce créneau », branche `sessionIndex === null`, l. 866-868), aujourd'hui réservés au créneau d'une Séance seule ; l'appliquer au parcours entier contredirait la formulation du § 8 point 9 et toucherait la trace D-568 (par Séance) → décision nécessaire.
   - Journal : « Dupliquer » / « Supprimer cette routine » portent sur la routine entière (toutes ses occurrences), pas sur le créneau du jour — ne pas transposer à l'Agenda (D-537 : l'Agenda ne supprime que l'occurrence).
6. **Autre lecture écartée : vue Plan.** Les lignes du Plan (une par routine) n'ont pas de glissé d'options ; le glisser horizontal du tableau y change de semaine (décision de Hermann, recette du 21/11/2026, constat a ; `PlanScreen.tsx:113-127`). Y ajouter un glisser-pour-options entrerait en conflit avec cette décision — non retenu sans arbitrage.

## Analyse historique (règle VNext du CLAUDE.md)

Non applicable au sens strict (pas une régression du protocole VNext) ; pour mémoire : la ligne Ⓟ n'a jamais eu de glissé depuis son introduction (D-553, 21/11/2026) ; SUITE2 (`feb2c5093`, 26/11 après-midi) n'a changé que le mécanisme des rangées existantes. Il ne s'agit pas d'une régression de SUITE2 : attribution « démontrée » par le diff de SUITE2 (ajout de `nativeGesture` seul sur la rangée de carte, l. 538).

## Hypothèses non démontrées

- Que « planifications » désigne la ligne Ⓟ des parcours. Si Hermann visait une carte de Séance qui ne glisse pas sur iPhone, la cause n'est pas démontrée : Jest ne reproduit pas l'arbitrage des gestes natifs ; il faudrait savoir quelle carte (heure, état, parcours ou non).

## PRESERVE / CHANGE / FORBIDDEN (pour la future implémentation, une fois arbitrée)

- PRESERVE : cartes de Séance (actions, ordre, largeurs `AGENDA_ACTION_WIDTH`, couleurs, marge droite, accessibilité, appui, déploiement), rendu de la ligne Ⓟ (badge, nom, lien, décalage), règle unique (`swipeReveal.ts`, `useSwipeRevealPan.ts`) et `SwipeActionsRow` sans modification, vue Plan et son glisser de semaine.
- CHANGE (proposé) : ligne Ⓟ enveloppée dans `SwipeActionsRow nativeGesture` (réutilisation, pas de nouveau geste), actions selon l'arbitrage.
- FORBIDDEN : inventer une action, modifier les seuils, glisser-pour-options dans le Plan, suppression de la routine entière depuis l'Agenda (D-537).

## Modifications réalisées

Aucune modification applicative. Seul ce rapport est ajouté.

## Tests

Aucun test applicable (diagnostic sans code). `tsc` / `eslint` non lancés : aucun fichier source modifié.

## Classe documentaire

C — non arbitré (action de la ligne Ⓟ non spécifiée). Aucun document normatif modifié : la décision de Hermann est nécessaire avant d'écrire le complément daté dans D-553 (ch07) et la spécification du 21/11 § 8.

## À CLARIFIER (proposition)

Ligne « Ⓟ nom du parcours » de l'Agenda — que révèle le glissé gauche ?
- **A** — « Dupliquer » seul (duplique la routine, comme sur chacune de ses cartes). Aucune règle nouvelle ; suppression toujours Séance par Séance (§ 8 point 9 inchangé).
- **B** — « Dupliquer » et « Supprimer » (supprime le créneau entier du jour, toutes ses Séances non exécutées ; absent si une Séance du créneau est commencée, D-537 ; même dialogue « Supprimer ce créneau » ; trace « Supprimée » par Séance, D-568). Remplace la formulation « revient à supprimer chacune de ses Séances » du § 8 point 9.
- **C** — autre.

Ma proposition : **B** si l'intention est de traiter le parcours comme une planification (cohérent avec le créneau d'une Séance seule, qui a déjà Dupliquer + Supprimer) ; sinon A. Mission arrêtée après ce rapport, conformément à la consigne.

## Vérifications iPhone restantes

- Après arbitrage et implémentation : dans l'Agenda, sur un jour avec un parcours, glisser court vers la gauche la ligne « Ⓟ nom » → les options choisies apparaissent ; glisser vers la droite → fermées ; les cartes de Séance dessous glissent toujours seules.
- Si Hermann visait une carte de Séance : préciser laquelle (heure, état) pour reproduire.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-27_RECETTE-27-11-AGENDA.md` (ce rapport).

## Commit final et état Git

Voir le message de livraison (hash du commit de ce rapport ; branche poussée sur `origin/fix/recette-27-11-agenda`).
