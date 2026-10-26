---
title: 'R-6 — Niveaux dans tous les contextes (C06, C09), remplacement d''occurrence par rang'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: 'ca4e35fd'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/KODJO-Niveaux-Recherche-Parcours-Regles-v7.md'
  - '{project-root}/docs/DSF-NIVEAUX-RECHERCHE-2026-10-25.md'
  - '{project-root}/_bmad-output/pre7/planning-artifacts/sprint-change-proposal-2026-10-26.md'
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-reprise-q1-q11.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La commande Niveau n'existe que sur un Exercice du Catalogue :
- en reprise, la pastille est affichée sans popover (`ExerciseScreen.tsx:405-406`, `editorLevelOf` avec `menu` `null`) ;
- l'éditeur d'occurrence de Séance n'a aucune prop `level` (`ExerciseScreen.tsx:1674-1713`) ;
- aucun changement de niveau en Séance ne remplace l'occurrence (MFN-09), donc aucun transfert par rang ;
- les cartes sans pastille n'affichent pas le suffixe « - Nn » (`ActivityCard.tsx:154`, `CompositionScreen.tsx:5068`).

Proposition du 26/10, §R-6, critères 1 à 5 (`sprint-change-proposal-2026-10-26.md:103-112`), sur D-445 C06 et C09 (ch07 l.902, l.905, l.936), v7 §4 (l.59) et §5 (l.67-69), MFN-09 (ch10 l.410-418), MFN-10 (l.426), CE-UI-NIV-01 (ch13 l.5439-5500).

**Approach:** Transfert par rang pur dans le domaine. Le popover accepte un choix par Mouvement (reprise, occurrence) en plus du choix par Exercice (Catalogue). En Séance, le changement prépare dans l'éditeur l'occurrence remplaçante ; `Terminer` l'inscrit à la même place sous une nouvelle identité, la fermeture l'abandonne. Le suffixe est dérivé à l'affichage de la position du Mouvement, lue par le service.

## Boundaries & Constraints

**Always:**
- **Critère 1, C09** (v7 l.67, MFN-09 l.410, CE-UI-NIV-01 §3) : la commande Niveau est active hors crayon sur un Exercice du Catalogue, en reprise (Catalogue et création en Séance) et sur une occurrence de Séance. Le menu reste le `Menu` SwiftUI d'`@expo/ui` (`MovementLevelMenu.tsx`), avec le panneau de repli hors iOS.
- **Critère 2, transfert par rang** (v7 l.59 ; MFN-09 l.418 ; ch07 l.936 annoté par PHC) :
  - sans→sans : paramètres repris, cible comprise ;
  - sans→phases : phases du mouvement choisi, durées vides ;
  - phases→sans : phases retirées, cible de série conservée (jamais la somme) ;
  - phases→phases : durées des rangs communs reprises, surplus source abandonné, surplus cible vide ;
  - mode, séries, cibles, pauses, charge, côtés, cadence, récupération et position conservés ; jamais d'association par identifiant de phase entre mouvements.
- **Remplacement en Séance** (MFN-09 l.412 ; CE-UI-NIV-01 §4, §12, §14, §15) :
  - le contenu affiché devient celui du mouvement choisi (entrée du brouillon s'il y en a une) ;
  - `Terminer` remplace l'occurrence à la même place par une nouvelle identité d'occurrence, sans numéro de copie ; l'entrée de réserve de Circuit suit ; aucun Exercice du Catalogue n'est créé ;
  - paramètres valides avant `Terminer` (validation existante : une durée de phase vide bloque) ;
  - ✕ (garde d'abandon) restitue l'occurrence d'origine : rien n'est inscrit dans le brouillon.
- **Critère 3** (C09, v7 l.67) : choisir un niveau n'écrit aucun groupe ni rang.
- **Critère 4, C06** (v7 l.69, MFN-10 l.426) : suffixe « - Nn » à la suite du nom sur les cartes sans pastille — Catalogue, choix d'exercices et Composition ; absent sans groupe ou en groupe singleton ; jamais dans un nom persisté ni dans la clé d'unicité. Texte via `strings`.
- **Critère 5, C05** : une durée de phase manquante est signalée sur l'occurrence (« Paramètres à compléter. », cartes et éditeur) ; mécanisme existant, vérifié par test.
- **MFN-07 l.371-373** (report R-5, source explicite) : « Ajouter un niveau » du Catalogue demande Plus facile / Plus difficile (sous-menu, comme `10152:20369`), insère avant / après l'origine, description et médias vierges, Catégorie et Zones reprises.
- Pastille « Niveau N » prévue pour une variante créée en Séance (report R-5), affichage seul.

**Never:**
- Aucune migration, aucun changement de `tokens.ts`, `migration001.ts`, `package.json`, `app.json`.
- Aucun rattachement automatique au groupe (Q10) ; aucun reclassement par le choix d'un niveau.
- Pas de remplacement du `Menu` SwiftUI, ni d'ouverture automatique de la Feuille après un changement (`10070:20073` est une capture, pas une règle).
- Hors périmètre : C08 (rattacher, détacher, supprimer) ; suffixe des lignes historiques (MFN-11).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| sans→phases (Séance) | occurrence de A (3 × 30 s), B a 2 phases | B affiché ; 3 × 30 s conservé ; 2 durées vides ; « Paramètres à compléter. » ; `Terminer` indisponible | N/A |
| phases→sans | A [5 s, 2 s], cible 45 s ; C sans phases | cible 45 s, aucune phase | N/A |
| phases→phases | A [5, 2, 3] → B à 2 phases ; A [5, 2] → C à 3 phases | B [5, 2] ; C [5, 2, vide] | N/A |
| Validation | durées complétées, `Terminer` | nouvelle occurrence de B à la même place, ancienne retirée, groupe inchangé | N/A |
| Annuler | ✕ puis abandon confirmé | brouillon intact | N/A |
| Niveau courant | choix du niveau coché | aucun effet | N/A |
| Reprise Catalogue | création sur A, choix de B | contenu de B, paramètres transférés, `Terminer` crée l'Exercice sur B | N/A |
| Suffixe | Squats rang 2 sur 2 ; Pompes sans groupe | « Squats - N2 » ; « Pompes » | positions illisibles : noms sans suffixe |

</frozen-after-approval>

## Open Questions

Options conservatrices appliquées, à valider par Hermann (aucune ne bloque) :
- **Reprise** : « Changer de niveau » remplace en place le mouvement repris de l'Exercice en création, avec transfert par rang, sans naviguer. CE-UI-NIV-01 §4 ne décrit que la consultation d'un Exercice existant au Catalogue, et la reprise n'en a pas.
- **« Ajouter un niveau » en reprise et en Séance** : indisponible. MFN-07 ne dit pas si, en Séance, la création remplace l'occurrence ou en ajoute une ; seul le Catalogue est aligné.
- **« Ajouter un niveau » au Catalogue** : nom vide et sans invite, rien n'ayant été saisi ; paramètres de l'origine repris (A3.1, MFN-07 muet).
- **Crayon** : pendant l'édition du contenu, la pastille reste affichée sans menu ; après un changement de niveau, le crayon n'est plus proposé jusqu'à `Terminer`. Cela évite de mêler une correction de mouvement et un remplacement.
- **Crayon, deux règles** : en Séance, il est retiré après un changement de niveau ; en reprise au Catalogue, il reste disponible et s'applique au mouvement choisi (cible des écritures).
- **Retour au niveau d'origine** : l'occurrence d'ouverture (Séance), ou la valeur initiale de la reprise, est restituée telle quelle. En reprise, une saisie faite avant le changement est donc perdue.
- **Copie** : l'occurrence remplaçante n'a pas de numéro de copie, comme « Créer un nouveau mouvement » (R-4).
- **Ordre des suffixes** : « Squats - N2 (copie) ».
- **Mouvement local** : le suffixe est lu en base. Un mouvement créé en Séance et pas encore enregistré n'en a pas sur sa carte ; son éditeur montre la pastille prévue.

## Code Map

- `src/domain/activities/Movement.ts` : `transferParametersByRank`, à côté de `repriseExecutionParameters`.
- `src/domain/sessions/SessionDraft.ts` : `withOccurrenceMovement` (vue et transfert), `replaceOccurrence` (même place, nouvelle identité, réserve).
- `src/features/activities/ActivityDefinitionService.ts` : `listMovementLevelPositions`.
- `src/features/activities/MovementLevelMenu.tsx` : choix par Mouvement, sous-menu Plus facile / Plus difficile.
- `src/features/sessions/ExerciseScreen.tsx` : `editorLevelOf`, éditeur Catalogue (reprise, Ajouter), éditeur d'occurrence.
- `ActivityCard.tsx`, `ActivityCatalogueList.tsx`, `useActivityCatalogue.ts`, `ActivitySelectionScreen.tsx`, `CompositionScreen.tsx`, `compositionPresentation.ts`, `movementChoicePresentation.ts` : suffixe.
- `src/shared/i18n/resources/fr.ts` : libellés.

## Tasks & Acceptance

**Execution:**
- [x] `Movement.ts`, `SessionDraft.ts` -- transfert par rang, vue et remplacement -- matrice testée en domaine.
- [x] `ActivityDefinitionService.ts` -- positions de niveau en une lecture -- suffixe.
- [x] `MovementLevelMenu.tsx` -- choix par Mouvement, Ajouter avec sens -- C09, MFN-07.
- [x] `ExerciseScreen.tsx` -- reprise, Ajouter (C02), occurrence (remplacement, Annuler), pastille de variante -- critères 1 à 3 et 5.
- [x] Cartes -- suffixe « - Nn » -- critère 4.
- [x] Tests (domaine, menu, intégration éditeur, cartes), README, `deferred-work.md`.

**Acceptance Criteria:**
- Given une occurrence de « Squats » (niveau 2 sur 2), when on choisit le niveau 1, complète les durées puis `Terminer`, then le brouillon contient à la même place une nouvelle occurrence de « Squats assistés » aux paramètres transférés, et l'ordre du groupe est inchangé.
- Given le même changement, when on ferme l'éditeur et confirme l'abandon, then le brouillon est inchangé.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `npx jest --maxWorkers=2` -- expected: toutes suites vertes

## Implementation Notes

- **Domaine** (aucune migration).
  - `Movement.ts` : `transferParametersByRank` réécrit seulement `series.workPhases` (identités et libellés du mouvement choisi, durée du même rang ou 0). Les séries variables sont couvertes (D-446).
  - `SessionDraft.ts` : `withOccurrenceMovement` (vue et transfert) et `replaceOccurrence` (même place, réserve de Circuit). `replaceOccurrenceWithNewMovement` (R-4) s'appuie désormais sur `replaceOccurrence`, sans changement de comportement.
- **Service** : `listMovementLevelPositions` lit tous les mouvements (`search("")`) puis chaque groupe une fois (`listGroup`) ; les singletons sont exclus.
- **Menu** :
  - `movementChoice` et `LevelOption.movementId` ; `currentDefinitionId` accepte `null`.
  - `onAddLevel(placement)` vaut `null` quand « Ajouter » est indisponible. Le sous-menu natif « Ajouter un niveau » porte `-add-easier` et `-add-harder` ; le panneau de repli a une étape `ADD`.
  - Libellés `levelMenu.addEasier` et `addHarder` (« Plus facile », « Plus difficile », comme le déploiement `10152:20369`).
- **Éditeur Catalogue** :
  - Paramètre de route `levelPlacement`, « après » par défaut.
  - La création du niveau charge les niveaux de l'origine pour la pastille prévue (`variantLevelPosition`) ; si la lecture échoue, aucune pastille.
  - En reprise, `changeRepriseLevel` met à jour `origin` (cible des écritures et des niveaux) sans changer `repriseMovementId`, pour ne pas relancer le chargement.
- **Éditeur d'occurrence** :
  - Les niveaux sont lus pour le mouvement enregistré de l'occurrence, ou pour l'origine d'une variante.
  - Seule la première lecture retarde l'affichage du formulaire (revue A3.1). Après un changement, la position est recalculée en place (`levelsAfterChange`), sans démonter le formulaire.
  - Remplacement dans `planFinish` : nouvelle identité (`Crypto.randomUUID`), `copyNumber: null`, réserve transmise à `commitFinished`.
- **Suffixe** :
  - Texte `activities.card.levelSuffix` (`{name} - N{rank}`), via `withLevelSuffix`.
  - Composition : suffixe de niveau, puis suffixe de copie, nom accessible compris.
  - Sources : `useActivityCatalogue` (`levelPositions` lues avec la liste) et `useMovementLevelPositions` (nouveau). Une lecture en échec laisse les cartes sans suffixe.
- **Tests** :
  - Nouveaux : `transferParametersByRank.r6.test.ts`, `occurrenceLevelChange.r6.test.ts`, `ExerciseScreen.r6.integration.test.tsx`, `levelSuffix.r6.test.tsx`, et un cas « R-6 » dans `CompositionScreen.test.tsx`.
  - Adaptés : `MovementLevelMenu.test.tsx` (sous-menu du sens, choix par mouvement) `ExerciseScreen.mfn.a31.integration.test.tsx` (sens, contenu vierge, reprise avec commande, Plus facile avant l'origine) et `useActivityCatalogue.test.ts` (état prêt avec `levelPositions`).
- **Revue** :
  - le retour au niveau d'origine restitue l'état d'ouverture ;
  - le nom accessible des points d'arrêt et la détection d'homonymes utilisent le nom affiché par la carte (`occurrenceCardName`) ;
  - après une relecture des positions en échec, les suffixes sont effacés ;
  - nouveaux cas de test : reprise jusqu'à `Terminer`, réserve de Circuit, création en Séance, Plus facile sans groupe.
- **README** : `src/domain`, `src/features/activities`, `src/features/sessions`.
- **Reports** (`deferred-work.md`) :
  - Ajouter en reprise et en Séance ;
  - garde d'abandon à constater en JA2 ;
  - capture `10070:20073` (titre « Durées à compléter », Feuille ouverte) ;
  - suffixe d'un mouvement local non enregistré ;
  - rendu à constater en JA2.

## Spec Change Log

## Review Triage Log

Revue du 26/10/2026 : trois couches (Blind Hunter, Edge Case Hunter, Verification Gap) sur le diff depuis `ca4e35fd`.

| # | Source | Constat | Verdict | Preuve | Route |
|---|---|---|---|---|---|
| 1 | BH, ECH | Aller vers un autre niveau puis revenir à l'origine perd les durées de phase d'origine | medium | `changeOccurrenceLevel` et `changeRepriseLevel` repartent de l'état courant | patch |
| 2 | VG, BH | Reprise : changement de niveau puis Terminer jamais testé | low | Gap filé | patch (test) |
| 3 | VG, ECH | Réserve de Circuit après changement de niveau non testée à l'écran | low | Séries modifiées : l'entrée est retirée (règle PRE-6), c'est correct ; séries inchangées : l'entrée suit. Seul un test de domaine couvre ces cas | patch (test) |
| 4 | VG, BH | Changement de niveau en création dans une Séance non testé | low | Gap filé | patch (test) |
| 5 | BH | « Plus facile » depuis un mouvement sans groupe non testé | low | Gap | patch (test) |
| 6 | BH | Point d'arrêt : nom accessible et homonymes sans le suffixe « - Nn » | low | `stopPointAnchor` utilise `occurrenceDisplayName` seul | patch |
| 7 | ECH | Échec de relecture des positions : les anciens suffixes restent affichés | low | Correction directe | patch |
| 8 | ECH | `levelsPending` peut garder le formulaire caché | maybe-false | Vérification demandée au correctif : `levelLookupId` qui devient nul avant la première lecture | patch (si avéré) |
| 9 | BH | Règle du crayon différente entre la Séance et la reprise, non signalée | low | Option conservatrice non listée | patch (doc) |
| 10 | BH | L'écran des niveaux ouvert depuis une Séance réordonne en base immédiatement, sans annulation à l'abandon | low | Même comportement qu'au Catalogue (A3.2) ; à confirmer par Hermann | defer |
| 11 | BH | Le remplacement par un niveau déjà présent dans la Séance donne deux cartes identiques sans « (copie) » | false | Q3 : le numéro de copie vient de la duplication ; les homonymes sont distingués par « n sur m » (R-3) | reject |
| 12 | ECH | Numéro de copie hérité en création après changement de niveau | false | Une occurrence nouvelle reprise n'a pas de numéro de copie, seule la duplication en donne un | reject |
| 13 | BH, ECH | `listMovementLevelPositions` fait 1 + G lectures, et la spec dit « une lecture » | low | Base locale ; une requête unique demanderait une nouvelle méthode de repository | defer |
| 14 | ECH | `Promise.all` fait attendre le Catalogue sur la lecture des positions | low | Lecture locale ; aucune attente infinie démontrée | reject |
| 15 | BH | Logique de chargement en double et garde `typeof` pour les doublures de test | low | Aucun dommage nommé | reject |
| 16 | VG | Relecture des suffixes au retour sur la Composition non testée | low | Gap filé, disposition de la couche : defer | defer |
| 17 | ECH | `replaceOccurrenceWithNewMovement` lève si l'occurrence a quitté le brouillon | low | Impossible : l'éditeur est au-dessus de la Composition | reject |
| 18 | BH | Spec absente du diff ; suivi de sprint resté en `in-progress` | false | La spec est hors diff par construction ; le suivi passe en `review` au commit | reject |
