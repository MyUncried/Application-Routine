# Proposition de changement de sprint PRE-7 — 26/10/2026

> Format BMAD « correct course ». Rédigée sans interaction, à soumettre à Hermann. Base : `pre7-bmad/dev` @ `dc6099de` (intègre `origin/main` @ `e7947ddb`, PR #397 D-445 et PR #398 PHC-20261026). Rien n'est appliqué tant que Hermann n'a pas validé cette proposition. Les numéros de ligne sont ceux de ce HEAD.

## 1. Déclencheur et résumé

- **Déclencheurs.** (a) PR #397 (`main`) : **D-445**, « Validée par Hermann », clôt C01–C07 et C09 et remplace les points contraires de D-437 à D-439 et MFN-01 à MFN-11, que PRE-7 avait implémentés (ch07 l.890-940, `docs/KODJO-Niveaux-Recherche-Parcours-Regles-v7.md`). (b) PR #398 : **PHC-20261026**, les phases deviennent un motif cyclique (ch07 l.942-950, `docs/KODJO-Phases-Guidage-Cyclique-2026-10-26.md`). (c) Recette JA et arbitrages du 26/10 : phases autorisées aussi avec des séries variables (complément qui remplace l'exclusion de PHC) ; la copie locale garde le même mouvement, sans création automatique ; « le contenu du mouvement est désormais partagé ».
- **Constat.** Les 13 stories PRE-7 sont en `review`. Epic B est conforme. Les epics A1 à A4 suivent l'ancien MFN : l'occurrence garde une copie du contenu, le nom n'est pas unique, un drapeau `used` déclenche le dialogue, le vocabulaire est « geste », le contenu d'une occurrence est verrouillé, la variante reprend la description, la recherche est lexicale. Le correctif R1 (`f99c3f95`) contredit l'arbitrage de Hermann. D-446 n'est fait qu'en partie (`decda295`).
- **Proposition.** Six stories de reprise (R-1 à R-6) et une migration **013** : la 012 a déjà tourné sur l'iPhone (JA1), donc la réécrire ne la rejouerait pas. Le volet de schéma (R-3) attend la réponse à **Q1**.

## 2. Impact sur les stories livrées

| Story | Verdict | Décision source | Écart constaté (fichier:ligne) |
|---|---|---|---|
| B.1 Harmonisation visuelle | Conforme | D-447 | — |
| B.2 Libellés, Description | Conforme | D-447 | Seul écart, documentaire : PHC écrit « À la cible » (§5) |
| B.3 Changement de côté, barre clavier | Conforme | D-447 | — |
| A1.1 Domaine Mouvement, paramètres v4 | À reprendre (partiel) | Complément séries variables ; C03 | Phases portées par la série `UNIFORM` (`ExecutionParameters.ts:177-189`, « une série VARIABLE ne porte aucune phase ») ; drapeau `used` et `markMovementUsed` (`Movement.ts:267`) |
| A1.2 Schéma 012, repositories | À reprendre (par une 013) | C01, C05, intégrité active D-445 | Index `movements_normalized_name_idx` non UNIQUE (`migration012.ts:99`) ; aucune table d'alias ; colonne `used` (l.92) ; copies de contenu dans l'occurrence : `activities.name` (l.151), `instruction` (l.158), `category_id` (l.164), `activity_body_zones` (l.224), `session_activity_media` (l.229) ; libellés de phases dans la forme résolue v4 (`ExecutionParameters.ts:1555-1567`) ; `source_movement_id` sans clé étrangère (l.167), alors que D-445 exige des relations actives intègres depuis les occurrences ; recherche par `instr` (`SqliteMovementRepository.ts:355`) |
| A1.3 Services, filiation | À reprendre | C03, C05, arbitrage copie | « Déjà utilisé » posé au succès de l'enregistrement (C03 : « aucun indicateur d'utilisation irréversible ») ; propagation de copies de contenu ; `settlePendingLocalCopies` (`composition.ts:331`, `SessionDraft.ts:571`, `:607`) caduc |
| A2.1 Feuille MFN | À reprendre (partiel) | C04, complément | Structure verrouillée en occurrence (`ExerciseScreen.tsx:1104`) ; le reste (durée vide conservée, frère incomplet) est conforme |
| A2.2 Contenu partagé, verrouillage | À reprendre | C03, C04 | Dialogue conditionné par `used && sensitiveChange` (`sharedCorrection.ts:325`) ; libellés « Corriger cet exercice / Créer un nouvel exercice » et « Corriger ce geste / En faire un geste distinct » (`fr.ts:311-321`), au lieu de « Mettre à jour ce mouvement / Créer un nouveau mouvement / Annuler » + « Annuler / Confirmer » ; contenu d'occurrence verrouillé sans crayon (`ExerciseScreen.tsx:1394-1398`). L'étape de complétion facultative des frères reste conforme. |
| A2.3 Recherche, suggestions | À reprendre | C01, C02, R02-R05, R04 | Proximité lexicale par suite de mots (`movementSuggestion.ts:1-60`) au lieu du score R02 ; feuille à 3 choix au lieu du panneau de 5 résultats avec 2 actions ; `9959:19623` devient le catalogue d'entretien ; la variante reprend description et médias (`ExerciseScreen.tsx:360-368`, `:1230-1244`) au lieu de les laisser vierges avec l'invite « (compléter le nom) » ; ni Plus facile / Plus difficile, ni unicité, ni alias ; terminologie « geste » (`fr.ts:240-270`) au lieu de « mouvement » (v7 §1) |
| A3.1 Pastille, popover Niveau | À reprendre (partiel) | C06, C09, D-445 transfert par rang | Pastille « Niveau » / « Niveau N » conforme. Commande Niveau absente en reprise (`ExerciseScreen.tsx:381-383`, popover `null`) et dans l'éditeur d'occurrence (aucune prop `level`, l.1370-1412). Aucun remplacement d'occurrence par changement de niveau en Séance (MFN-09), donc aucun transfert par rang. |
| A3.2 Niveaux, réordonnancement | Conforme | C08 différé | — |
| A4.1 Catalogue par geste | À reprendre (partiel) | C06, C07 | Suffixe dérivé « - Nn » absent des cartes. Frère incomplet sélectionnable et signalé : conforme à C05. Regroupement : compatible avec C07. |
| Recette JA R1 (`f99c3f95`) | Caduque | Arbitrage copie + précision de Hermann | Nouveau mouvement automatique dès que le contenu diffère : refusé |
| Recette JA R2 (`f99c3f95`) | Conforme, validée | Hermann 26/10 | Documentation à propager (§4) |
| D-446 1/3 (`decda295`) | Conforme à PHC, sauf un point | PHC, complément | Les séries variables sont encore refusées avec des phases |
| D-446 2/3 (spec non suivie) | À fusionner dans R-2 | PHC | — |
| D-446 3/3 (spec non suivie) | Abandonnée | PR #398 | Remplacée par R-1 |

## 3. Stories de reprise, dans l'ordre des dépendances

```
R-1 (docs) ─────────────────────────────────────────────────┐
R-2 (phases, domaine + Feuille) ─┐                          │
Q1 ─→ R-3 (schéma 013, C05/C01) ─┴→ R-4 (dialogue, crayon) → R-5 (création, recherche) → R-6 (niveaux) → JA2
```

### R-1 — Lot documentaire de consolidation (D-446 ↔ PHC, R2, cohérence)
- **Objectif.** Un seul texte normatif par règle, et aucune contradiction entre `main` et PRE-7 (détail au §4).
- **Critères d'acceptation.** D-446 est rapproché de PHC et remplace explicitement l'exclusion phases + séries variables. R2 est propagé. Les incohérences du §4 sont corrigées par annotation, sans suppression d'historique. UTF-8 et CRLF préservés. `npx tsc --noEmit` vert.
- **Fichiers.** ch01, 04, 06, 07, 08, 10, 11, 13, `KODJO-Phases-Guidage-Cyclique-2026-10-26.md`, `KODJO-Niveaux-Recherche-Parcours-Regles-v7.md`, `PRODUCT.md`.
- **Risque.** Hors Epic 0, ce lot exige la validation de Hermann (CLAUDE.md), et il touche des fichiers aussi modifiés sur `main`. Mitigation : partir de `e7947ddb`, sans réécrire de section.

### R-2 — Phases : motif commun aux séries identiques et variables, calculs et guidage
- **Objectif.** Terminer D-446 : appliquer le complément sur les séries variables, puis les volets calculs et guidage (spec `spec-d446-2-phases-guidage-calculs.md`, fusionnée ici).
- **Critères d'acceptation.**
  1. Les phases sont des paramètres de l'exercice, hors de la série : une seule séquence de durées, commune aux séries `UNIFORM` et `VARIABLE`.
  2. Identiques ↔ Variables conserve les phases et leurs durées ; aucune durée de phase n'est propre à une série.
  3. Les exemples `30 s / 45 s / échec` et `10 / 12 / échec` sont représentables et valides.
  4. Les durées de phase ne sont jamais recalculées depuis les cibles, et aucune cible n'est remplacée par leur somme.
  5. En Répétitions, le travail nominal vaut R × motif, marqué « ≈ » ; en Durée, la cible de chaque ligne ; À l'échec, « Non calculable » (D-433).
  6. Le module pur `phaseGuidance.ts` couvre PHC/AC04 à AC08 ; aucune fin automatique en Répétitions.
  7. Les tests qui imposaient l'exclusion deviennent des tests de compatibilité.
- **Fichiers.** `ExecutionParameters.ts` (type et formes v4), `ExecutionParametersDraft.ts` (`setVariable`, l.83, l.1248), `executionCalculations.ts`, `ExecutionParametersSheet.tsx` (commande Variables, `totalNotCalculable`), `WorkPhasesTable.tsx`, nouveau `phaseGuidance.ts`, et leurs tests.
- **Risque.** Les formes persistées v4 (Catalogue et résolue) placent `workPhases` dans la série, et des données v4 existent sur l'iPhone. Changer la forme impose une réécriture JSON par la 013 (patron de la migration 010) ou une version 5 lue à côté de la 4. Recommandation : figer la nouvelle forme dans R-2 et la persister dans la 013 de R-3, pour un seul changement de format. Sans R-3 (Q1 = B), R-2 porte seule une 013 de réécriture JSON.

### R-3 — Modèle D-445 : occurrence sans copie de contenu, nom unique, alias (migration 013), conditionnelle à Q1
- **Objectif.** C05 et C01 dans le schéma et les repositories.
- **Critères d'acceptation.**
  1. Le contenu d'une occurrence (nom, description, médias, catégorie, zones, structure et libellés des phases) se lit dans le mouvement. L'occurrence ne garde que ses paramètres, sous forme `phaseId → durée`, avec des durées éventuellement manquantes et signalées.
  2. `activities.source_movement_id` reçoit une clé étrangère vers `movements` (intégrité active) ; les instantanés futurs restent sans contrainte.
  3. Nom principal UNIQUE sur la clé canonique, contrôlé aussi à l'écriture concurrente. Table d'alias partageables.
  4. La colonne `used` est retirée (C03).
  5. Le suffixe « (copie) » est traité selon Q3.
  6. La copie locale dans le brouillon référence le même mouvement en attente, et `settlePendingLocalCopies` est retiré : « Corriger » touche alors l'original et la copie sans mécanisme particulier (précision de Hermann).
  7. Test de migration sur base de copie (patron `buildVersion10.ts`) avec des données 012 réelles ; le Profil, les Catégories et les Zones sont conservés.
- **Fichiers.** Nouvelle `migration013.ts` (012 intouchée), `SqliteSessionRepository.ts`, `SqliteMovementRepository.ts`, `SqliteActivityDefinitionRepository.ts`, `SessionDraft.ts`, `composition.ts`, `Session.ts`, `SessionService.ts`, `ActivityDefinitionService.ts`, et les READMEs des tranches.
- **Risques.**
  - Doublons de noms déjà présents sur l'iPhone : l'index UNIQUE échouerait, et une fusion ou un renommage implicite est interdit (v7 §2). D'où Q2.
  - SQLite reconstruit les tables pour retirer des colonnes et ajouter la clé étrangère : faire comme pour la 012, en transaction exclusive.
  - La fusion sur `main` livrera 012 puis 013 : une installation neuve exécute les deux.
  - JA1-bis obligatoire (§6).

### R-4 — Dialogue unique de sauvegarde (C03), crayon depuis une Séance (C04), vocabulaire « mouvement »
- **Objectif.** Appliquer le tableau C03 dans tous les contextes : Catalogue, reprise, occurrence, brouillon de Séance.
- **Critères d'acceptation.**
  1. Nom modifié : le dialogue « Mettre à jour ce mouvement / Créer un nouveau mouvement / Annuler » s'ouvre toujours, sans présélection ; Confirmer reste indisponible tant qu'aucun choix n'est fait.
  2. Nom inchangé et contenu modifié, avec au moins un autre exercice (définitions et occurrences persistées, comptées une fois) ou une exécution enregistrée : confirmation « Annuler / Confirmer ». Sinon, sauvegarde silencieuse.
  3. Paramètres ou classement seuls : aucun dialogue. Les durées de phase ne créent jamais de mouvement.
  4. Le crayon est disponible dans l'éditeur d'occurrence.
  5. « Créer un nouveau mouvement » depuis une Séance remplace l'occurrence dans le brouillon.
  6. Dans le brouillon, copie et original suivent la même règle, sans exception.
  7. Les textes « geste » de l'interface deviennent « mouvement » ; identifiants inchangés (D-201).
- **Fichiers.** `sharedCorrection.ts` (`assessSharedCorrection`), `ExerciseScreen.tsx`, `ActivityEditorForm.tsx`, `fr.ts:238-330`, `DecisionDialog.tsx` (réutilisé), et les tests `*.mfn.a22*`.
- **Risque.** Tant que l'exécution n'existe pas, la condition « exécution enregistrée » vaut toujours faux. Le prévoir dans le code par une requête par identité de mouvement, qui rend zéro pour l'instant.

### R-5 — Création : unicité (C01), variante (C02), recherche R02 à R05
- **Objectif.** Le parcours de création de la v7 (§2, §6).
- **Critères d'acceptation.**
  1. L'erreur « nom déjà utilisé » s'affiche pendant la saisie ; le contrôle d'unicité exclut l'identité en cours d'édition.
  2. Variante : description et médias vierges ; catégorie et zones reprises ; nom conservé avec l'invite grise « (compléter le nom) », jamais persistée ; choix Plus facile / Plus difficile, qui insère la variante avant ou après l'origine ; la similarité est désactivée ensuite.
  3. Score R02 (jetons, trigrammes par jeton, préfixe ; seuils 0,75 et 0,45 ; bonus plafonnés).
  4. Panneau de 5 résultats au plus, avec « Utiliser ce mouvement / Créer une variante ».
  5. Écran de recherche R03, y compris « Voir tous les mouvements ».
  6. Alias (R05), un résultat par mouvement.
  7. Le corpus R07 est automatisé.
- **Fichiers.** `movementSuggestion.ts` (remplacé), `MovementSuggestionSheet.tsx`, `MovementSearchScreen`, `useMovementOriginChoice.tsx`, `ExerciseScreen.tsx:360-368` et `:1230-1244`, `Movement.ts:534`. Références visuelles : `DSF-NIVEAUX-RECHERCHE-2026-10-25.md`, `docs/figma-niveaux-2026-10-25/`.
- **Risque.** Le relevé Figma de la v7 reste incomplet (quota) : les composants absents sont classés `NON VÉRIFIABLE`, sans invention.

### R-6 — Niveaux dans tous les contextes (C06, C09), remplacement d'occurrence par rang
- **Objectif.** La commande Niveau est active hors crayon ; un changement de niveau en Séance remplace l'occurrence.
- **Critères d'acceptation.**
  1. La commande Niveau est présente en reprise et en occurrence.
  2. En Séance, changer de niveau prépare un remplacement avec transfert par rang : sans→sans, durée reprise ; sans→phases, durées vides ; phases→sans, cible conservée (PHC) ; phases→phases, rangs communs repris. Annuler restaure l'occurrence.
  3. Choisir un autre niveau ne reclasse pas le mouvement courant.
  4. Le suffixe dérivé « - Nn » apparaît sur les cartes sans pastille (Catalogue, Composition), jamais stocké.
  5. Les phases manquantes sont signalées sur l'occurrence (C05).
- **Fichiers.** `ExerciseScreen.tsx` (`editorLevelOf`, éditeur d'occurrence), `MovementLevelMenu.tsx`, `ActivityCard.tsx`, `CardTitleLine.tsx`, `composition.ts`, `useActivityCatalogue.ts`.
- **Risque.** Garde d'abandon sur un remplacement (déjà différée en A3.1) : la vérifier en JA2.

## 4. Documentation (contenu de R-1)

1. **D-446 ↔ PHC.** Pas de seconde décision concurrente : D-446 devient l'annotation PRE-7 de PHC-20261026 et contient le **complément du 26/10** : phases compatibles avec les séries variables, un seul motif commun, transitions Identiques ↔ Variables sans perte. Les passages de PHC qui maintiennent l'exclusion sont annotés « remplacé par D-446 » : PHC §Principe, tableau « Phases + séries variables », §Contrat d'écran « Variables reste indisponible », §Limites (2), PHC/AC02 ; ch07 l.944 et l.948 ; v7 fin de §8 ; mêmes phrases propagées dans les ch08, 10 et 13. Le point « arrêt mixte » de PHC est clos par les séries variables (complément, point 5).
2. **Transfert phases→sans.** ch07 l.935 (D-445) dit « phases→sans, somme ». La v7 §4, ch10 MFN-09 et ch12 l.252 disent « cible de série conservée », et PHC remplace explicitement ce transfert. Il suffit d'annoter ch07 l.935.
3. **« À la cible ».** PHC (2 occurrences) et ch07 l.944 utilisent le libellé remplacé par D-447 : annoter « À l'objectif ».
4. **Doublons d'en-têtes D-445.** Le bandeau « D-445 — décisions validées le 25/10 » est répété (ch07 l.3, l.886, puis la section l.890 ; deux fois dans la plupart des chapitres). `PRODUCT.md` l.540 et l.544 contient deux sections D-445 consécutives, à fusionner.
5. **D-440.** D-445 (ch07 l.892) et la v7 §8 écrivent « D-440 (base vierge) conservée, aucune migration requise » sans citer l'assouplissement du 23-24/10 (ch07 l.30, ch10 MFN-12, ch12 l.256, déjà annoté). Ajouter une annotation de renvoi, et mentionner la 013 si Q2 est tranchée.
6. **R2 (validée).** Dans ch13 CE-T03-04 (l.833-858) et ch06 (section de l'éditeur), écrire : « nom en saisie : le premier appui dans le corps défilant ferme seulement le clavier, sans ouvrir la Feuille ni la Description ; la rangée Catégorie / Zones / Niveau garde son comportement — décision de Hermann du 26/10/2026 ».
7. **Arbitrage de la copie locale.** `arbitrage-2026-10-26-copie-locale-identite.md`, dernière puce : « Exception limitée au brouillon… MFN-08 l.426 reste inchangé » contredit la précision ultérieure de Hermann (« ce n'est pas une exception », D-445). Annoter le fichier. Les libellés « Corriger ce geste / En faire un geste distinct » y sont remplacés par ceux de C03.
8. **Reports.** ch05 l.130 et ch01 l.216 (glossaire des phases), relevés en `deferred-work.md` et à vérifier après PHC.

## 5. Questions à Hermann

**Q1 — Faut-il refaire le modèle d'occurrence selon C05 dans PRE-7 maintenant ?**
- **Ce qui crée l'ambiguïté.** Le 26/10, vous avez écrit : « indépendamment de la proposition de simplification du modèle exercice/séance, qui n'est pas encore validée » et « Ne modifie pas le modèle exercice/séance sur la base de cette correction » (arbitrage phases, complément). Or D-445, marquée « Validée par Hermann » sur `main`, établit déjà que l'occurrence « référence directement le mouvement » et « ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases » (ch07 l.906-908 ; v7 §2 ; ch10 MFN-09 l.410).
- **Recherche faite.** Aucune « proposition de simplification » distincte de D-445 n'existe dans `docs/` ni dans l'historique git (recherche de « simplification » et de « proposition » : seule occurrence, votre propre arbitrage).
- **Pourquoi la réponse conditionne R-3.** Votre précision sur la copie (« le contenu du mouvement est désormais partagé… n'ajoute pas de mécanisme particulier ») ne peut être satisfaite sans C05, au moins dans le brouillon. Tant que chaque occurrence garde sa copie, faire « Corriger » sur l'original et sur la copie exige justement un mécanisme de synchronisation.
- **Options.**
  - **A** : R-3 complète dans PRE-7 (migration 013, suppression des copies de contenu des occurrences).
  - **B** : PRE-7 garde les copies et n'aligne que les comportements (R-4 à R-6) ; C05 ira dans la tranche de la « simplification ». R1 reste alors non conforme, ou exige un mécanisme que vous refusez.
  - **C** : la « proposition de simplification » est un autre sujet, qu'il faut d'abord me transmettre.
- **Recommandation : A**, sauf si la simplification visée change justement ce modèle (option C).

**Q2 — Que deviennent les données de l'iPhone avec la 013 ?**
- **A** : nouvelle réinitialisation ponctuelle des Exercices et Séances, Profil, Catégories et Zones conservés, avec avis (même patron que la 012).
- **B** : conversion : suppression des copies de contenu, contenu courant repris du mouvement, clé étrangère. Elle échoue s'il existe deux noms de mouvement de même clé canonique, puisque toute fusion ou tout renommage automatique est interdit.
- **Recommandation : A**, pour des données de recette : coût et risque bien moindres, et JA1-bis vous prévient avant le chargement.

**Q3 — Où vit le suffixe « (copie) » si l'occurrence ne garde plus de nom ?** MFN-09 dit qu'il « reste une distinction locale de présentation » (ch10 l.414), sans dire où il est stocké, et vous refusez un nom propre créé implicitement.
- **A** : attribut d'occurrence non éditable « numéro de copie », affiché après le nom du mouvement.
- **B** : abandon du suffixe ; la copie affiche le nom du mouvement.
- **Recommandation : A**, avec un libellé inchangé.

**Q4 — En Répétitions chiffrées avec phases, que se passe-t-il entre la cible et l'appui sur Suivant ?** ch08 l.607 : le bip continue « y compris après le nominal Répétitions » ; ch13 l.3213 : la progression est « plafonnée à la fin nominale sans terminer la Série ». Aucune règle propre aux phases.
- **A** : le motif continue de boucler, sans signal.
- **B** : un signal à l'atteinte de la cible.
- **C** : le guidage s'arrête et attend Suivant.
- **Recommandation : A**, qui découle des règles existantes.

**Q5 — Les durées de la première phase sont-elles préremplies à l'activation (D-432) ?** PHC : « Activer les phases ne copie pas la cible de série comme durée du motif ; demander les durées manquantes. » Le code de `decda295` conserve le préremplissage de D-432 en mode Durée.
- **A** : deux phases aux durées vides, à renseigner.
- **B** : préremplissage maintenu en Durée.
- **Recommandation : A**, conforme à PHC.

**Q6 — Cadence et motif en Répétitions.** PHC tranche l'estimation : R × motif, sans seconde estimation par la cadence. Reste une question : la Cadence reste-t-elle réglable et sonore avec des phases ? **Recommandation : oui, sans changement** (D-375 : bip continu sur la série).

**Q7 — Faut-il annoncer les phases à chaque cycle (D-375) ?**
- **A** : chaque libellé, à chaque cycle.
- **B** : au premier cycle seulement.
- **Recommandation : A**, qui est le texte même de D-375. PHC ajoute : « ne pas annoncer une phase qui ne sera pas exécutée ». La règle est consignée maintenant et sera implémentée avec T04.

**Q8 — Une cible de série plus courte que le motif (par exemple 5 s pour un motif de 7 s) est-elle permise ?**
- **A** : oui, sans avertissement (PHC : bornes indépendantes, arrêt même au milieu d'une phase).
- **B** : avertissement informatif.
- **Recommandation : A.**

**Q9 — Les phases sont-elles permises dans tous les formats ?** D-372 et D-374 sont remplacées ; PHC donne l'exemple d'un format à 20 s.
- **A** : les phases sont compatibles avec tous les formats ; les contraintes du format ne portent que sur le mode, la cible et les séries.
- **B** : liste de formats exclus, à préciser.
- **Recommandation : A.** Les incompatibilités de ch08 (section Formats) sont à annoter dans R-1.

**Q10 — Rattachement au groupe après « Créer un nouveau mouvement ».** D-445 : « reste explicite ». La v7 §2 règle la variante (Plus facile / Plus difficile). Pour une nouvelle identité : **recommandation : aucun rattachement automatique**, rattachement ultérieur par C08 (différé). Cela clôt les reports A2.2, A2.3 et A3.1 de `deferred-work.md`.

**Q11 — Qu'est-ce qui reste hors périmètre faute de moteur T04 ?** `src/features/execution/` ne contient qu'un README.
- **Recommandation.** Hors PRE-7 : instantanés figés, refus de lancement d'un exercice incomplet, guidage minuté, annonces, progression. Dans PRE-7 : signalement des durées manquantes sur les cartes et à la sélection, et module pur `phaseGuidance.ts`, testé, prêt pour `ExecutionService`.
- **Option.** Retirer `phaseGuidance.ts` de PRE-7 si vous préférez ne rien livrer sans moteur.

## 6. Jalons de recette iPhone (360 / 402 / 440, iOS 26)

| Jalon | Quand | Contenu |
|---|---|---|
| JB | Statut à confirmer (B.1 à B.3 en `review`) | Inchangé |
| JA1 | Fait (migration 012) | — |
| **JP** (nouveau) | Après R-2 | Phases × {Durée, Répétitions} × {objectif, échec} × {Identiques, Variables} ; passage Identiques ↔ Variables sans perte ; « Durée de l'exercice » avec « ≈ » ; cible indépendante |
| **JA1-bis** (nouveau) | Avant le chargement de la 013 | Hermann prévenu ; effet sur ses données selon Q2 ; avis affiché une fois ; aucun effet au second lancement |
| **JA2** (remplace JA) | Après R-6 | Dialogue C03 dans les quatre contextes ; crayon en Séance ; copie locale + « Mettre à jour » ; unicité ; variante ; recherche ; Niveau en Séance avec Annuler ; suffixe « - Nn » ; texte agrandi, VoiceOver (reports A2.2, A3.1, B.3) |

**Suivi proposé (`sprint-status.yaml`, après validation).**
- Ajouter `epic-r` avec `r-1` à `r-6` en `backlog`.
- Fusionner `recette-ja-d446-2-phases-guidage-calculs` dans `r-2`.
- Marquer `recette-ja-d446-1` `done`, avec la mention « complété par r-2 ».
- Laisser les stories A1 à A4 en `review` jusqu'à la fin de leur reprise.
- Fusion finale sur `main` : autorisation distincte, inchangée.
