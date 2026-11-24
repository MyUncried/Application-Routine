# CONSOLIDATION-2411 — intégration des branches de code et de documentation (24/11/2026)

Branche : `integration/consolidation-20261124` (worktree `C:\Dev\KODJO-CONSOL`), issue de `origin/main`. Partie code : à compléter par la session principale.

## Documentation

### Identifiant, objectif, départ

- **Mission :** CONSOLIDATION-2411, partie documentaire.
- **Objectif :** fusionner la branche documentaire `origin/docs/planification-grille-creneaux`, renuméroter les décisions en une seule fois, reporter la documentation de classe B non appliquée de la recette du Programme du 23/11/2026.
- **Départ :** `7f57801f` (merge Langues J1), après les fusions de `feat/plan-20261121`, `docs/agenda-seances-journal-filtre-20261121`, `recette/amrap-remarques-20261119` et `claude/exciting-lovelace-iyn2wf`.
- **Commits :**
  - `510bd999` — merge de `origin/docs/planification-grille-creneaux` (`a6efe1fa`, base commune `6a7e0376`) ;
  - `b6068c3e` — renumérotation et report de classe B ;
  - commit de ce rapport (voir l'état Git en fin de section).

### 1. Fusion de `docs/planification-grille-creneaux`

`git merge --no-ff` : 37 fichiers touchés par la branche, 11 en conflit. Résolution par **union** : aucune décision ni règle perdue.

| Fichier | Résolution |
|---|---|
| Registre ch07 | Lignes D-528 à D-531 (EMOM en durée, coins du chronomètre, annonce des tours, Max) et D-536 à D-542 ajoutées depuis la branche ; D-532, D-533, D-535 : texte de la branche (annotations du 20/11) précédé des annotations du 21/11 de la branche Agenda ; D-534 et D-520 à D-527 : version Agenda (sur-ensemble) ; D-541 et D-542 annotées « remplacées le 21/11/2026 par D-554 » (troisième onglet « Plan » rétabli) ; D-553 à D-569 de la branche Agenda conservés ; D-560 à D-563 de la branche gardés provisoirement, puis renumérotés (§ 2). |
| ch04 | Les deux annotations de la ligne « création d'un programme » cumulées (D-548 / D-549 du 20/11 ; écran « PROG — 13 » du 23/11). |
| ch06 | Version Agenda (contient l'annotation de la branche). |
| ch10 | RM-054a à RM-054d : version Agenda ; RM-254 à RM-264 : version Agenda (annotées) ; RM-265 à RM-272 (EMOM en durée, annonce des tours, Max) ajoutées depuis la branche. |
| ch13 | Version Agenda pour CE-UI-03 et CE-UI-12 (sur-ensemble) ; les annotations D-538 et D-539 du 20/11 ajoutées à l'écran « Agenda — Planning ». |
| DSF Agenda | § 2 du 20/11 (D-538, rangée des jours dans la bande) retenu comme texte courant, avec les annotations des recettes du 19/11 au soir au 22/11 (teintes, titre D-553, étiquettes, mois affiché) ; § 4 et § 5 complétés ; § 6 : en-tête de la branche, puces Agenda ; § 8 à § 10 (D-536, D-539, D-540) insérés avant les sections datées du 21/11 ; dans § 8 et § 9, annotations datées des remplacements ultérieurs (dialogue côte à côte du 20/11, contour bleu D-555, « Planifier » retiré D-558). |
| DSF Journal | Ligne 1 : texte Agenda + définition D-540 ; carte et comportement : version Agenda (recettes du 20 au 23/11) ; § 5 (D-536), § 6 (D-537), § 6 bis (nom unique) ajoutés ; « À clarifier » fusionné en § 7 (code couleur annoté « tranché le 19/11 au soir ») ; « noms non uniques » du 21/11 annoté (remplacé le 23/11). |
| DSF Barre de titre | Libellés : texte du 19/11 conservé, annotations datées du 20/11 (D-542, deux onglets) et du 21/11 (D-554, trois onglets). |
| Prompt Journal du 19/11 | Version de la branche (plus récente). |
| Rapport `2026-11-18_PLANIF-GRILLE-DOC.md` | Union des deux historiques. |

### 2. Renumérotation unique (24/11/2026)

Règle : `origin/main` garde D-500 à D-552 ; la branche Agenda garde D-553 à D-569 (déjà cités dans le code) ; les décisions en collision reçoivent un nouveau numéro à partir de D-570, dans l'ordre chronologique. Table aussi au registre, section « Renumérotation du 24/11/2026 (consolidation) ».

| Ancien identifiant | Branche | Nouvel identifiant | Titre |
|---|---|---|---|
| D-553 | PROG-CAT-01 (patch du 21/11) | D-570 | « Enregistrer comme modèle » grisé |
| D-554 | PROG-CAT-01 | D-571 | « Dupliquer » : copie sans dates ni routines |
| D-555 | PROG-CAT-01 | D-572 | « + Planifier une séance » |
| D-556 | PROG-CAT-01 | D-573 | « N planifications · N séances » |
| D-557 | PROG-CAT-01 | D-574 | « Garder les routines » ; historique porté par les exécutions |
| D-558 | PROG-CAT-01 | D-575 | « Effacer mes relevés » grisé |
| D-559 | PROG-CAT-01 | D-576 | Planification depuis un programme, bornée |
| D-543 (`7a4fd91e`), puis D-560 (`c489b91d`) | `docs/planification-grille-creneaux` | D-577 | Période d'un programme |
| D-544, puis D-561 | idem | D-578 | Routines d'un programme |
| D-545, puis D-562 | idem | D-579 | Rattachement (modale « Rattacher un programme ») |
| D-563 (« D-563 nom ») | idem (`e6b67479`) | D-580 | Nom des routines unique parmi les actives |

- **Inchangés :** D-553 à D-568 de la branche Agenda, dont D-563 (calendrier natif `UICalendarView`, abandonné le 23/11 et annoté « remplacé par D-581 ») ; D-569 (Langues).
- **Patch PROG-CAT-01** (`_bmad-output/prog-cat-01/integration-documentaire-main.patch`) : `git apply --check` échoue sur le registre ; spécification du Programme, ch04 et ch13 appliqués par `git apply` après renumérotation ; registre porté à la main (section « Programme — précisions de mise en œuvre (21/11/2026, PROG-CAT-01) »).
- **Patch nom unique pour la branche Agenda** (`_bmad-output/compte/integration-documentaire-D-563-branche-agenda.patch`) : renuméroté D-580, appliqué (spécification Agenda du 21/11, ch04, ch10, ch13 par `git apply` ; registre à la main : D-522 et la puce « supersédées » ; D-553 annoté séparément).
- **Références mises à jour :** DSF Programmes, DSF Journal § 6 bis, trois prompts Programmes et le prompt du nom unique, ch04, ch07 (D-332), rapports `2026-11-21_PROG-CAT-01.md` et `2026-11-23_RECETTE-PROG-2311.md` (forme « nouveau (ex-ancien) » + note de renumérotation), `2026-11-23_INTEG-PROG-2311.md` (note). Rapport antérieur `2026-11-18_PLANIF-GRILLE-DOC.md` : historique non réécrit, section de renumérotation ajoutée.
- **Code non modifié** — commentaires citant un ancien numéro, listés au registre :
  - « D-563 nom » (= D-580) : `Routine.ts`, `PlanningScreen.tsx`, `PlanningService.ts` et trois fichiers de tests ;
  - « D-543 » au sens de la période (= D-577) : `programPeriod.ts`, `ProgramService.ts`, `ProgramSheetScreen.tsx` ;
  - « D-544 » au sens des routines d'un programme (= D-578) : `JournalRoutineCard.tsx`, `programPresentation.ts`, `ProgramSheetScreen.tsx` ;
  - « D-545 » au sens du rattachement (= D-579) : `PlanningScreen.tsx`, `planningSheetRelay.ts`, `planningStrings.ts`, `ProgramChoiceSheet.tsx`, `ProgramCatalogue.tsx` et deux tests. « D-543 » à « D-552 » au sens de `main` restent dans `Program.ts`, `ProgramService.ts`, `ProgramCatalogue.tsx`, `programPresentation.ts` : les deux sens coexistent dans le code.

### 3. Report de la classe B non appliquée (recette du Programme du 23/11/2026)

Source : `2026-11-23_RECETTE-PROG-2311.md` (contre-recettes 2 à 5, nom unique, reprise PROG-CAT-01) ; citations de Hermann reprises du rapport et des commentaires du code qui les recopient. Nouvelles décisions au registre, section « Programme et calendrier — recette du 23/11/2026, lots 3 à 6, et reprise de PROG-CAT-01 » :

| ID | Règle | Remplace / annote | Documents |
|---|---|---|---|
| D-581 | Calendrier de la période = celui de Planifier, sans marquage de la période | D-563 (`UICalendarView`) | ch07, ch13 CE-PROG-02, DSF Programmes § 1, compléments du 23/11 § 3 |
| D-582 | Carte Période : « Du » 15, pastilles, « au / pendant » d'un toucher, unité par touchers successifs avec conversion, lignes « Se termine le … », « X jours, se termine le … », « X semaines, se termine le … » | D-577 (menu, ligne « Se termine le … » seule) ; états lot 5 bis / 5 ter | ch07, ch13, DSF Programmes § 1 |
| D-583 | Routine dans le programme : cadre = début dans le programme ; « N créneaux, jusqu'au … » borné par la fin du programme | D-578 | ch07, ch13, DSF Programmes § 2 |
| D-584 | Journal : « Actives » sélectionné par défaut, désélectionnable ; sans sélection, toutes les routines | D-540 (3), DSF Journal ligne 1 | ch07, DSF Journal |
| D-585 | Agenda : parcours à chaque créneau (i), nom du parcours gris (e), traits prolongés (k), sans espace (f), séance seule déployée au format du parcours (y7) | règle du lot 4 | ch07, DSF Agenda |
| D-586 | Plan : occurrence supprimée = heure grise sur gris, non tactile, hors Total | D-568 « pas de trace dans le Plan » | ch07, DSF Plan, compléments § 6 |
| D-587 | Journal : fenêtre unique « Modifier la routine » pour les créneaux hors période, sans seconde confirmation ; boutons « Les supprimer » / « Les garder dans le calendrier » | D-566, D-536 | ch07, DSF Journal § 5, compléments § 4, ch13 CE-UI-12 |
| D-588 | Agenda : programme d'une occurrence visible, non modifiable (x18) | menu g2 du lot 3 | ch07, DSF Agenda, ch13 CE-UI-12 |
| D-589 | Catalogue des programmes : Tri reporté ; Filtre « par séance, avec / sans douleur » décidé, non développé | — | ch07, ch13 CE-PROG-01, spécification § 2 |
| D-590 | « semaine N sur M » (M = jours ÷ 7 arrondi au plus proche ; N plafonnée à M) | — | ch07, ch13 CE-PROG-01, spécification § 2 |
| D-591 | « Utilisé par N programmes » : programmes actifs seulement | — | ch07, ch13 CE-PRF-01, spécification § 6 |
| D-592 | Validations sans changement : « Le programme sera supprimé. », Terminé conservé, état vide « Actifs 0 · Terminés 0 », accord conservé à la fermeture par la croix, Compte hors périmètre | — | ch07, ch13 CE-PROG-01 / 03, spécification § 2 et § 3 |

Annotations datées sans nouveau numéro :
- **D-560** (astérisque) étendu au créneau unique créé par le « + » de l'Agenda (« Oui. C'est le même concept ») : registre, DSF Agenda, DSF Plan ; « créneau unique non marqué » conservé et annoté remplacé.
- **D-580** (nom unique) : réponses 1-2-3 de Hermann (contrôle pendant la saisie en modification) : registre, DSF Journal § 6 bis.
- **D-562** : sens inverse calendrier → Catalogue (contre-recette 2, f / g) : registre, compléments § 2.
- **D-566** : titres sans point final, « Les supprimer », « Les garder dans le calendrier » (contre-recette 3, x9 / x10) : registre, compléments § 4.
- **D-576** : fin de routine non bornée en modification (d4, D-566).
- **Consentement douleur (x5)** : texte de Hermann et format du titre, fenêtre sur voile (constat a) : spécification du Programme § 5.
- **INDEX** : entrée « Consolidation du 24/11/2026 ».

### 4. À CLARIFIER (non tranché, pour Hermann)

1. **Collision D-532** (hors du périmètre annoncé) : « Calendrier : Journal · Agenda · Vue d'ensemble » (tableau, 19/11) et « EMOM à plusieurs mouvements » (section Formats PRE-11 du 18/11, citée par le code `fdf0a278`). Les deux datent du 19/11 ; aucun n'est sur `origin/main`. Non renuméroté.
2. **D-516 à D-518 absents du registre** : D-517 et D-518 (EMOM, PR #431) sont cités par `PROMPT-CLAUDE-CODE-EMOM-DUREE-2026-11-18.md` mais n'ont aucune ligne sur cette branche ; ils n'existent que sur `origin/docs/composition-increment-20261107`.
3. **Interprétations de Claude reprises telles quelles dans les règles** (à valider) : arrondis de D-582 (conversion au-dessus, X semaines = jours ÷ 7 au-dessous) ; popover ouvert et bornes de D-581 ; cartes « — » sans astérisque (D-560) ; lecture « traits prolongés » du constat k (D-585).
4. **Lot 3, classe B a à m** : seuls les trois reports « préparés, non appliqués » (D-562, D-564 / D-566, DSF Agenda i) et x5 ont été reportés ; les autres points (b confirmation « Retirer mon accord », c rattachement, d3 snackbar, e Plan en-tête collant, j trait, l, m titres « Créer un programme » / « Modifier le programme ») n'ont pas été recherchés dans la documentation normative.
5. **Points C ouverts** des contre-recettes 2 et 3 (rapport du 23/11) : non traités.
6. Les deux sens de D-543 à D-545 coexistent dans les commentaires du code (voir § 2) : une correction des commentaires relève d'une mission de code.

### Preuves et tests

- `git diff --check` sur les fichiers touchés : propre.
- Aucun marqueur de conflit : `git grep -n -E "^(<<<<<<<|>>>>>>>) " -- docs .github` vide.
- Unicité des identifiants du registre (script node comptant les lignes `| D-xxx |`) : 515 lignes, aucun doublon ; D-500 à D-592 tous présents sauf D-516 à D-518 (voir À CLARIFIER 2).
- Aucun test applicatif : mission documentaire, `src/` non modifié.
- Non vérifié : rendu Figma, iPhone (sans objet pour la documentation).

### Fichiers modifiés (partie documentaire)

- Fusion : 37 fichiers de la branche documentaire (dont `DSF-PLAN-2026-11-20.md`, `DSF-PROGRAMMES-2026-11-23.md`, 15 prompts ajoutés, chapitres 03, 04, 06, 07, 09, 10, 13).
- Renumérotation et classe B : registre ch07 ; ch04 ; ch10 ; ch13 ; `DSF-AGENDA-PLANNING-2026-11-19.md` ; `DSF-JOURNAL-2026-11-19.md` ; `DSF-PLAN-2026-11-21.md` ; `DSF-PROGRAMMES-2026-11-23.md` ; `KODJO-Agenda-seances-journal-filtre-2026-11-21.md` ; `KODJO-Programme-catalogue-creation-configuration-2026-11-20.md` ; `KODJO-Programme-recette-2026-11-23.md` ; `INDEX.md` ; quatre prompts du 23/11 ; rapports `2026-11-18_PLANIF-GRILLE-DOC.md`, `2026-11-21_PROG-CAT-01.md`, `2026-11-23_INTEG-PROG-2311.md`, `2026-11-23_RECETTE-PROG-2311.md` ; `_bmad-output/prog-cat-01/integration-documentaire-main.md`.
- Ce rapport.

### État Git (partie documentaire)

Branche `integration/consolidation-20261124`, sans push ; arbre propre après le commit de ce rapport.
