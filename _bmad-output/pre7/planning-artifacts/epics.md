# KODJO — Tranche PRE-7 (post-PRE-6) — Plan BMAD

> **Statut : approuvé par Hermann le 24/10/2026** (plan, transition par migration 012 avec conservation du Profil et des Catégories, B1 à B10 avec clavier natif, périmètre MFN D-437 à D-440 et MFN-01 à MFN-13, réutilisation, jalons JB, JA1, JA), avec deux précisions intégrées en A1.3 et A2.2. Fusion finale sur main : autorisation distincte.
> Préparé le 24/10/2026 dans le clone PRE-6, en lecture seule du code et de Figma (`G6RY5Ebhgwb4AHIOYDwwvg`, Prototype MVP `510:101`).

## 1. Baseline

- `main` @ `bcd84481` : PRE-4, PRE-5 (#389), docs #391 et #392 (MFN), PRE-6 (#393). À reconfirmer au démarrage (`git log -1 origin/main`).
- Schéma SQLite : migrations 001 à 011. Paramètres d'exécution JSON v3 (PRE-5). 149 suites, 4 070 tests.
- Numérotation : D-436 à D-440 = MFN (main) ; D-441 à D-444 = PRE-6. Prochain numéro libre : **D-445**.
- Démarrage proposé : nouveau worktree `C:\Dev\KODJO-BMAD-PRE7` (branche `pre7-bmad/dev` depuis `main`), BMad 6.12.4 copié comme pour PRE-6, artefacts dans `_bmad-output/pre7/`.

## 2. Constat de l'existant (vérifié dans le code)

**MFN : rien n'existe.** Aucun Mouvement, aucune filiation, aucun groupe de niveaux. Le contenu (nom, description, catégorie, zones, médias, libellés de phases) est aplati dans `activity_definitions` (migrations 006, 007, 009) ; les phases `{id,label,durationSeconds}` sont dans le JSON v3 (`ExecutionParameters.ts:147-175`) avec un `nextPhaseId` recalculé (max + 1) ; une occurrence de séance ne garde aucune référence à sa définition (`ActivityDefinition.ts:292-301`) ; aucune table d'exécution ni d'historique (`features/execution`, `features/history` = README) ; aucune recherche (D-221) ; actions Catalogue D-196 (Planifier, Dupliquer, Archiver) non implémentées.

**Éditeur (B1–B10)** : déjà conformes, à ne pas redévelopper : réouverture du stepper Cadence par un nouvel appui sur Autre ; conservation des valeurs de charge en Sans ; ordre de la barre clavier (À l'échec seulement pour une Cible) ; clavier natif `number-pad` / `decimal-pad`.

## 3. Réutilisation

| Besoin | Existant réutilisé |
|---|---|
| Popover de Niveau | `CircuitNatureMenu.tsx` (menu natif SwiftUI `@expo/ui`, repli `AnchoredPanel.tsx`) |
| Déroulant Changement de côté (Figma) | `AnchoredPanel.tsx` |
| Dialogues à choix (identité, confirmation contenu partagé, niveaux) | `DecisionDialog.tsx`, `TourBoundaryChoiceDialog.tsx`, `CircuitEntryConfirmModal.tsx` |
| Feuilles basses | `CategoryPickerModal`, `BodyZonePickerModal`, `useReferenceSheet.ts` |
| Réordonner les niveaux | `sheetTable.tsx` (`DraggableRow`, Monter / Descendre accessibles) ; mouvements `compositionMotion.ts`, `useAnimatedShift.ts` |
| Cartes et résumé | `ActivityCard.tsx`, `CardTitleLine.tsx`, `formatExerciseRowSummary` |
| Action principale | `PrimaryActionZone.tsx` (D-444) |
| Avis après migration | table `migration_notices` (migration 010) |
| Transaction de migration | `migrateDatabase.ts` (transaction exclusive) |

## 4. Transition des données (D-440 assouplie par Hermann le 23/10)

**Recommandation : réinitialisation ponctuelle des Exercices et des Séances ; conservation des préférences du Profil, des Catégories et des Zones corporelles.** (Zones ajoutées par Hermann le 24/10/2026.)

- Conserver les Exercices du Catalogue serait mécaniquement faisable (un Mouvement par définition), mais la filiation des occurrences de séance **n'est pas reconstituable** : aucune colonne ne relie une occurrence à sa définition, et un appariement par nom contredirait MFN-06. Il faudrait aussi réécrire les JSON v2/v3 et la table `activities` (patron de migration 010, 825 lignes). Coût et risque disproportionnés : non retenu.
- Les préférences du Profil, les Catégories et les Zones corporelles personnalisées (créations, renommages, retraits) vivent dans des tables que MFN ne change pas : les garder ne coûte rien.
- Mise en œuvre : **migration 012** (versionnée, exécutée une seule fois au premier lancement de la version qui la contient, jamais ensuite) : suppression et recréation des tables d'Exercices, médias, associations Exercice–zones, Séances et occurrences au nouveau schéma, sans toucher aux tables du Profil, des Catégories et des Zones corporelles ; intégrité référentielle préservée ; avis à l'utilisateur via `migration_notices`.
- Conséquence : à l'installation de la version, les Exercices et Séances existants (y compris ceux de recette sur l'iPhone) disparaissent. Hermann est prévenu avant de charger la version contenant la migration (jalon JA1).
- Réconciliation documentaire de D-440 et MFN-12 dans le lot de l'Epic 0 (texte ci-dessous).

## 5. Epics et stories

### Epic 0 — Lot documentaire préalable (1 story)

**0.1 Décisions et réconciliation documentaire.** Après approbation du plan :
- Annotation de D-440 et MFN-12 : « Assouplie par Hermann le 23/10/2026 : les préférences du Profil et les Catégories sont conservées ; Exercices et Séances sont réinitialisés une seule fois par la migration du nouveau schéma, avec avis ; aucune réinitialisation aux démarrages suivants. » Les autres décisions MFN sont inchangées.
- **D-445 — Finalisation de l'éditeur d'Exercice** (demande de Hermann du 23/10) : B1 à B10, avec les remplacements explicites : libellés « À l'objectif » / « À l'objectif et à l'échec » (D-411, D-416, D-424 et chapitres cités) ; colonne Charge toujours présente avec tiret en Sans (remplace « Sans la masque » de RM-238 et ch06:576) ; déroulant Changement de côté conforme à Figma `9462:18986` (remplace le menu natif accepté en recette PRE-5) ; barre du clavier (§6 B9) ; chevron nu de Durée de l'exercice (variante de `DisclosureControl`, ch12).
- Propagation des libellés B2 dans ch01, 04, 06, 07, 08, 10, 13.
- AC : aucune autre décision MFN modifiée ; noms Unicode et CRLF conservés ; `npx tsc --noEmit` vert.

### Epic B — Finalisation de l'éditeur d'Exercice (3 stories)

**B.1 Harmonisation visuelle de la Feuille des paramètres** (B3, B4, B6, B7 — interface seule).
- AC1 (B3) : hauteur commune de 32 pour segmentés, pastilles de valeur, steppers fermés et ouverts, champ charge ; rayons et espacements harmonisés ; champs de saisie distingués par leur fond (`colors.surface`) des options ; aucun jeton modifié.
- AC2 (B4) : marges intérieures des boutons Séries actifs portées de 8 à 12 ; largeurs à 360 / 402 / 440 sans débordement.
- AC3 (B6) : Pause après chaque série, Pause entre les côtés, Compte à rebours, Fin alignés à droite comme Durée de l'exercice, fermés et ouverts (la règle « la valeur ne bouge pas à l'ouverture » est maintenue par l'alignement à droite du stepper ouvert).
- AC4 (B7) : chevron de Durée de l'exercice sans cadre (variante de `DisclosureControl`), cible de 48, accessibilité et ouverture inchangées ; autres usages inchangés.
- Tests : géométrie existante de `ExecutionParametersSheet.test.tsx` et `rc15` mise à jour, pas de nouveau dispositif.

**B.2 Libellés, valeurs et Description** (B1, B2, B8, B10).
- AC1 (B1) : ligne « Étape suivante » rendue seulement quand la Description est active ; au repos, aucune étape supprimée ; invite de première étape conservée quand la liste est vide ; pas de clignotement en passant d'une étape à l'autre.
- AC2 (B2) : « À l'objectif » et « À l'objectif et à l'échec » dans tous les états, cas mixte compris ; source `src/shared/i18n/index.ts:57` ; identifiants `TARGET` / `MIXED` inchangés ; largeur de l'option vérifiée.
- AC3 (B8) : une valeur de Cadence personnalisée remplace « Autre » dans l'option (« 3 s ») ; un nouvel appui rouvre le stepper ; valeur conservée à la fermeture et à la réouverture selon le brouillon existant. Interface seule : passer à « 1 s » ou « Sans » remplace la valeur, comme aujourd'hui.
- AC4 (B10) : en Séries variables, colonne Charge toujours présente (en-tête, largeur 71) ; en Sans, tiret gris non éditable, ignoré par Précédent / Suivant ; en Avec, champs dans la même colonne, sans recréation.

**B.3 Changement de côté et barre du clavier** (B5, B9).
- AC1 (B5) : déroulant conforme à Figma `9462:18986` / `9462:18987` (144 × 88, deux rangées de 44, ancré sur l'option, chevron) construit sur `AnchoredPanel`, comportements D-431 inchangés, accessibilité (rôle menu, fermeture), pas de Droite / Gauche.
- AC2 (B5) : valeur sélectionnée entièrement contenue dans l'option après fermeture et réouverture de la Feuille ; cause identifiée (dimensionnement de l'hôte du menu natif) et supprimée avec lui.
- AC3 (B9) : mécanisme validé en RC-1 conservé (clavier natif + barre au-dessus du clavier) ; quatre emplacements de largeur et hauteur égales : À l'échec (emplacement réservé vide quand non applicable), Précédent, Suivant, Fermer ; Précédent et Suivant fixes au centre ; boutons arrondis au fond des touches ; Fermer bleu KODJO, texte blanc ; fond de la barre proche du clavier ; focus et navigation inchangés.
- Recette iPhone **JB** après B.3 (360 / 402 / 440, iOS 26).

### Epic A1 — Données et domaine MFN (3 stories)

**A1.1 Domaine Mouvement et paramètres v4.** Types `Movement` (nom, description, catégorie, zones, médias, structure de phases `{id,label}`, compteur de phase monotone, « déjà utilisé », groupe de niveaux et clé de tri) ; `ActivityDefinition.movementId` ; paramètres v4 avec couples `{phaseId, durationSeconds|null}` ; état exécutable / incomplet (frères incomplets, MFN-02, D-438) ; validateur et brouillon adaptés (fin du nettoyage silencieux, croix à 2 phases, 2 → 1 = Sans) ; phrase et calculs de durée inchangés pour une définition complète. Domaine pur, tests unitaires.

**A1.2 Schéma 012, transition et repositories.** Migration 012 (§4) : `movements`, rattachement zones et médias au Mouvement, `activity_definitions.movement_id`, `activities.source_movement_id` (non nul, sans intégrité), avis `migration_notices` ; `MovementRepository` SQLite (créer, lire, rechercher, marquer utilisé, compter les définitions, refus de suppression d'un Mouvement référencé, groupe : rattacher, insérer après l'origine, réordonner, retirer) ; repositories de définitions et de séances adaptés ; test de migration sur base de copie (patron `buildVersion10.ts`) prouvant la conservation du Profil, des Catégories et des Zones corporelles (personnalisations comprises) et l'absence de réinitialisation à un second lancement. **Jalon JA1** : Hermann prévenu, puis chargement de la version sur l'iPhone.

**A1.3 Services et filiation.** `ActivityDefinitionService` : création avec origine (même geste / variante / indépendant), correction partagée atomique (contenu + durées par `phaseId` + frères incomplets), liste regroupée par geste ; `SessionService` : création locale atomique du Mouvement avec la Séance (MFN-04), « déjà utilisé » au succès de l'enregistrement, `sourceMovementId` transporté par le brouillon, la réécriture des occurrences, la duplication d'occurrence (D-124, suffixe « (copie) ») et de séance ; instantané avec filiation : le type d'instantané porte `sourceMovementId` pour les futurs instantanés d'exécution (précision de Hermann du 24/10) ; aucun moteur d'exécution ni historique dans PRE-7.

### Epic A2 — Éditeur d'Exercice MFN (3 stories)

**A2.1 Feuille des paramètres MFN** (CE-UI-10) : structure de phases verrouillée en occurrence ; durée vide conservée ; frère incomplet signalé ; après B.1–B.3 (même fichier).

**A2.2 Contenu partagé et verrouillage** (CE-T03-04, MFN-08, MFN-09). Trois contextes d'édition distingués explicitement (précision de Hermann du 24/10, règles documentaires existantes, sans nouvel arbitrage) : édition directe d'un Exercice existant du Catalogue ; création à partir d'un geste repris, contenu d'abord en lecture seule et déverrouillable par le crayon ; occurrence de séance, contenu verrouillé selon MFN-09. Contenu : mode contenu en lecture seule + crayon ; contenu d'occurrence verrouillé, création locale modifiable jusqu'au premier enregistrement de la Séance ; confirmation conditionnelle (« déjà utilisé » et changement de nom, description, média ou structure) avec nombre d'Exercices concernés ; étape de complétion des durées manquantes ; dialogue d'identité à 3 choix (D-438). Figma `9891:39982`, `9959:19518`, `9952:44349`.

**A2.3 Création : recherche et suggestions de gestes** (MFN-06) : suggestions (`9882:19049`), recherche explicite (`9959:19623`, gestes locaux compris), trois choix, aucun rattachement automatique ; création depuis le Catalogue vs depuis une Séance (locale) ; Annuler sans résidu.

### Epic A3 — Niveaux (2 stories)

**A3.1 Pastille et popover de Niveau** (D-439, MFN-05, MFN-07) : pastille dans la rangée de classification (rang masqué pour un groupe singleton) ; popover « Changer de niveau / Ajouter un niveau » (`9577:19843`) sur la primitive native ; niveau ajouté après l'origine ; changer de niveau = choisir explicitement les paramètres.

**A3.2 Consultation et réordonnancement des Niveaux** : liste ordonnée du groupe, réordonnancement par glisser (`DraggableRow` + Monter / Descendre). Écran sans frame Figma : composé de composants existants, classé `NON VÉRIFIABLE` au sens du ch13, validé en recette.

### Epic A4 — Catalogue et Composition (1 story)

**A4.1 Catalogue par geste et sélection** (MFN-10, CE-T03-02, CE-T03-07) : Catalogue regroupé par geste avec résumé de paramètres ; ligne regroupée ni exécutable ni insérable ; sélection multiple désignant une définition précise ; duplication en Composition avec filiation. **Jalon JA** final (360 / 402 / 440, texte agrandi).

Hors périmètre (constaté, non inventé) : historique et synthèses (MFN-11) tant que l'exécution n'existe pas ; actions Catalogue D-196 Planifier / Dupliquer / Archiver ; records, charge réalisée, fusion, progression automatique (MFN-13).

## 6. B9 — Couverture par le mécanisme standard

- `InputAccessoryView` ne s'affiche pas dans la `Modal` de la Feuille (recette RC-1 de PRE-5) ; la barre au-dessus du clavier natif, validée alors, est le mécanisme standard retenu. Pas de clavier personnalisé.
- Couvert : une ligne, quatre emplacements égaux et stables, Précédent / Suivant au centre, À l'échec à gauche si applicable, Fermer à droite en bleu KODJO texte blanc, boutons arrondis, fond proche du clavier.
- Abandonné : fusion avec la forme du clavier, recouvrement des coins arrondis, reproduction du matériau vitré d'iOS 26.

## 7. Ordre et dépendances

```
0.1 (docs) ─┬─ B.1 → B.2 → B.3 ─────────────── JB
            └─ A1.1 → A1.2 (JA1) → A1.3 ─┐
                       B.3 ──────────────┴→ A2.1 → A2.2 → A2.3 → A3.1 → A3.2 → A4.1 → JA
```

- B avant A2 : les deux touchent `ExecutionParametersSheet.tsx` (3 475 lignes) ; finir l'harmonisation d'abord évite de la refaire sur les nouveaux états MFN.
- A1.1 peut avancer en parallèle de B (domaine pur).

## 8. Risques

| Risque | Réponse proportionnée |
|---|---|
| JSON v3 → v4 transversal (validateur, brouillon 1 207 lignes, phrase, durées) | A1.1 isolée en domaine pur, suite existante comme filet, pas de lecteur v3 conservé après 012 |
| Durée de phase nullable persistée | état exécutable / incomplet explicite, vérifié aux points d'entrée d'exécution |
| Atomicité (création locale + Séance, correction partagée, « déjà utilisé ») | transactions des repositories existants ; tests d'échec au milieu |
| Réécriture des occurrences à chaque mise à jour de Séance | `source_movement_id` porté par le brouillon, test dédié |
| Réinitialisation sur l'iPhone de recette | une seule exécution par migration versionnée, test sur base de copie, prévenir Hermann |
| Éditeur à quatre parcours + nouveaux modes | états dérivés dans le domaine, éditeur limité au rendu |
| Glisser des niveaux | réutiliser `DraggableRow` plutôt que la mécanique de Composition |
