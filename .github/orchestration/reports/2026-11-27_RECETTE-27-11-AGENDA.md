# Recette iPhone du 26/11/2026 (soir) — paquet AGENDA : glissé gauche sur les planifications de l'Agenda

## Identification

- Mission : RECETTE-27-11-AGENDA. Phase 1 : diagnostic, arrêt avant code (À CLARIFIER, commit `bdfd906be`). Phase 2 : arbitrage de Hermann du 27/11/2026 (option B) et implémentation.
- Objectif : demande de Hermann (remarque d, mots exacts) : « Agenda, glissé gauche : doit aussi être actif pour les planifications de l'agenda. » Identifier les lignes de planification de l'Agenda sans glissé gauche (ou hors règle unique `SwipeActionsRow nativeGesture`) et les actions qu'elles doivent révéler, d'après la documentation ou les actions déjà offertes ailleurs pour la même planification ; à défaut de spécification, ne rien inventer.
- Branche : `fix/recette-27-11-agenda` (worktree `C:\Dev\KODJO-R27-AGENDA`).
- Commit de départ : `202570906` (recette `recette/agenda-axe-20261124`, lot 22 ; c'est aussi le HEAD servi par `KODJO-SERVE`, donc la version testée par Hermann).

## Périmètre

- Demandé : lignes de planification de l'Agenda (vue « Semaine », `CalendarWeekScreen`) ; actions à révéler.
- Traité : `CalendarWeekScreen.tsx` (rendu des cartes et des groupes de parcours), `SwipeActionsRow.tsx` (condition d'activation du geste natif), `PlanScreen.tsx` (vue Plan, pour écarter une autre lecture), rapport SUITE2 du 26/11, DSF Agenda, spécification du 21/11/2026 (§ 8), registre ch07 (D-534, D-537, D-549, D-553, D-568).
- Phase 1 : aucun fichier applicatif modifié. Phase 2 : ligne Ⓟ de l'Agenda uniquement (voir « Modifications réalisées »).

## Constats (phase 1 ; numéros de ligne avant modification)

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

## Arbitrage (27/11/2026)

Hermann retient l'option **B** : « Dupliquer et Supprimer » sur la ligne Ⓟ ; Supprimer retire tout le créneau du jour avec le même dialogue « Supprimer ce créneau », absent si une Séance du créneau est commencée (D-537), chaque Séance reste affichée « Supprimée » (D-568) ; remplace le § 8 point 9 du 21/11.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : cartes de Séance (actions, ordre, largeurs `AGENDA_ACTION_WIDTH`, couleurs, marge droite, accessibilité, appui, déploiement), rendu de la ligne Ⓟ (badge, nom, styles `parcoursHeader` / `parcoursName`, lien, décalage), règle unique (`swipeReveal.ts`, `useSwipeRevealPan.ts`) et `SwipeActionsRow` sans modification, service de planification sans modification, vue Plan et son glisser de semaine.
  Démonstration : `renderCard` non modifié (diff) ; `SwipeActionsRow.tsx`, `src/shared/gestures/*`, `PlanningService.ts`, `PlanScreen.tsx` hors du diff ; le contenu de la ligne Ⓟ (badge, texte, styles, identifiants de test) est repris à l'identique dans la rangée ; les 29 tests existants de `CalendarWeekScreen.integration` (dont parcours D-553, suppression d'une Séance de parcours, règle unique des cartes) passent sans modification.
- CHANGE : ligne Ⓟ enveloppée dans `SwipeActionsRow nativeGesture` (réutilisation, aucun nouveau geste) avec « Dupliquer » et « Supprimer ».
- FORBIDDEN : modifier les seuils, glisser-pour-options dans le Plan, suppression de la routine entière depuis l'Agenda (D-537), nouveau dialogue ou nouveau libellé.

## Modifications réalisées

- `src/features/planning/CalendarWeekScreen.tsx` : nouvelle fonction `renderParcoursHeader` (l. ~590-650) appelée à la place de la `View` de la ligne Ⓟ (l. ~692). Rangée `SwipeActionsRow` `nativeGesture`, `actionWidth` 90 et `actionsRightMargin` de l'écran comme les cartes ; actions :
  - « Dupliquer » (`duplicate(routine.id)`, comme les cartes) ;
  - « Supprimer » : `setDeleteCandidate({ routine, occurrenceKey, sessionIndex: null })` → dialogue existant « Supprimer ce créneau » → `planning.excludeOccurrence` existant (refus d'une occurrence commencée ; trace « Supprimée » par Séance pour une occurrence de la répétition, retrait pour un créneau ajouté ou unique — comportement existant du service). Absent si l'occurrence est commencée (D-537).
  - Appui simple sur la ligne : referme les options (aucune autre action, la ligne n'en avait pas).
- Choix de Claude (signalés dans le code et la doc) : « Supprimer » absent quand toutes les Séances sont déjà « Supprimées » (rien à supprimer) ; « Dupliquer » reste proposé ; bloc d'actions à la hauteur de la ligne Ⓟ (≈ 36 pt, pas de maquette Figma) — la hauteur de 52 des cartes déborderait sur la première carte.
- `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx` : deux tests (l. 659 et 689).

## Tests

| Commande | Résultat |
| --- | --- |
| `npx jest -w 1 --workerIdleMemoryLimit=800MB src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx src/features/activities/__tests__/SwipeActionsRow.nativeGesture.test.tsx` | 2 suites, 38/38 PASS |
| `npx tsc --noEmit` | PASS (aucune erreur) |
| `npx eslint src/features/planning/CalendarWeekScreen.tsx src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx` | PASS |

Nouveaux tests : ligne Ⓟ — règle unique du glisser (`expectSwipeRevealRule` : court, diagonale, lancer, sans rebond, aucun appui) ; « Dupliquer » → `/planning?duplicateOf` ; « Supprimer » → dialogue « Supprimer ce créneau » → les deux Séances restent « Supprimées » (D-568), le créneau du jeudi intact, puis plus de « Supprimer » ; parcours commencé : « Supprimer » absent, « Dupliquer » présent.
Une suite Jest verte ne prouve pas le rendu ni l'arbitrage des gestes sur iPhone (défilement de la liste, cartes voisines) : à vérifier en recette.

## Classe documentaire

B — évolution validée (arbitrage de Hermann du 27/11/2026). Documents touchés :
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : complément daté de D-553 (pas de nouveau numéro).
- `docs/KODJO-Agenda-seances-journal-filtre-2026-11-21.md` § 8 point 9 : phrase « Supprimer tout le Parcours d'un jour revient à supprimer chacune de ses Séances » marquée remplacée (texte d'origine conservé).
- `docs/DSF-AGENDA-PLANNING-2026-11-19.md` : section « Ligne « Ⓟ nom » d'un parcours glissée — 27/11/2026 ».
Recherche ciblée des formulations contraires (« Supprimer tout le Parcours », « supprimer chacune de ses Séances », « ligne Ⓟ ») : seule occurrence normative contraire, § 8 point 9 (traitée). D-534 / DSF Agenda l. 68 déjà remplacés par D-553. Aucun format concerné (`KODJO-Formats-entrainement` non touché).

## À CLARIFIER (phase 1, résolu le 27/11/2026 : option B)

Ligne « Ⓟ nom du parcours » de l'Agenda — que révèle le glissé gauche ?
- **A** — « Dupliquer » seul (duplique la routine, comme sur chacune de ses cartes). Aucune règle nouvelle ; suppression toujours Séance par Séance (§ 8 point 9 inchangé).
- **B** — « Dupliquer » et « Supprimer » (supprime le créneau entier du jour, toutes ses Séances non exécutées ; absent si une Séance du créneau est commencée, D-537 ; même dialogue « Supprimer ce créneau » ; trace « Supprimée » par Séance, D-568). Remplace la formulation « revient à supprimer chacune de ses Séances » du § 8 point 9.
- **C** — autre.

Ma proposition : **B** si l'intention est de traiter le parcours comme une planification (cohérent avec le créneau d'une Séance seule, qui a déjà Dupliquer + Supprimer) ; sinon A. Mission arrêtée après ce rapport, conformément à la consigne. → Hermann a retenu B.

Restent à valider à l'usage (choix de Claude) : hauteur du bloc d'actions de la ligne Ⓟ (hauteur de la ligne, plus basse que les cartes) ; « Supprimer » masqué quand toutes les Séances sont déjà « Supprimées » (aucun « Rétablir » global sur la ligne Ⓟ, les Séances se rétablissent une à une).

## Vérifications iPhone restantes

- Dans l'Agenda, sur un jour avec un parcours à venir : glisser court vers la gauche la ligne « Ⓟ nom » → « Dupliquer » (gris) et « Supprimer » (rouge) apparaissent ; glisser vers la droite → fermées ; départ en diagonale → suivi, sans rebond ni défilement ; les cartes de Séance dessous glissent toujours seules.
- « Supprimer » → « Supprimer ce créneau » → Confirmer : toutes les Séances du jour restent affichées « Supprimées » (grises), chacune rétablissable par son glisser ; les autres jours intacts.
- Parcours dont une Séance est exécutée : la ligne Ⓟ ne propose que « Dupliquer ».
- Rendu : hauteur et alignement du bloc d'actions sur la ligne Ⓟ, lien vertical du parcours intact pendant le glisser.

## Fichiers modifiés

- `src/features/planning/CalendarWeekScreen.tsx`
- `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/KODJO-Agenda-seances-journal-filtre-2026-11-21.md`
- `docs/DSF-AGENDA-PLANNING-2026-11-19.md`
- `.github/orchestration/reports/2026-11-27_RECETTE-27-11-AGENDA.md` (ce rapport).

## Commit final et état Git

Voir le message de livraison (hash du commit de ce rapport ; branche poussée sur `origin/fix/recette-27-11-agenda`).
