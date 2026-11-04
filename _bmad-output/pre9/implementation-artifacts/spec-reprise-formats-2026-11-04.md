# PRE-9 — Reprise Formats et Composition du 4 novembre 2026

Branche `pre9-bmad/dev`. Départ : `77ae5562`. `main` `560f87bd` intégré par fusion `177e40a5`, sans réinitialisation ; conflits résolus dans la référence Formats (texte du 04/11 retenu, décisions de recette du 03/11 encore applicables rattachées) et dans le registre ch07 (sections des deux côtés conservées).

Sources relues : `docs/KODJO-Formats-entrainement-2026-11-02.md` (actualisée au 04/11) ; `docs/sources/formats-2026-11-04/KODJO-Mise-a-jour-ecrans-formats-consolidee-2026-11-04_finale.md` (« MAJ ») ; ch06, ch07, ch09, ch10, ch13 (CE-FMT-01 à 05) ; `architecture-pre9.md`, `epics.md`, `arbitrages-pre9.md` ; `docs/preparation/PRE-9/Prompt-Claude-Code-Corrections-Formats-2026-11-03.md` ; captures Figma locales `docs/figma-formats-2026-11-02/captures.json` (68). Figma consulté en lecture seule, non modifié.

Règle de synchronisation code / documentation : livraison de **classe B** (décisions de Hermann des 3 et 4 novembre, déjà portées par la documentation de `main`), sauf mention. Aucune nouvelle règle n'est déduite du code.

## 1. Plan actualisé

Ordre suivi : base → réalignement C.1 à C.4 → C.5 / C.6 → A.3 (et nettoyage des anciennes définitions) → D.1 à D.5 (raccordements) → DOC.1 → Q.1 (préparée). Le moteur spécialisé PRE-10/11 n'est pas développé. B.10 reste différé ; Q.0 garde son statut hors chemin critique.

## 2. Réalisé (code)

| Point (prompt du 04/11) | Avant | Réalisé | Commit |
|---|---|---|---|
| Parcours modal | Écrans pleins, nom de Séance, « Enregistrer » dès le questionnaire pour 7 modèles | Modale par le bas sous le titre de la Composition (y = 95, coins 24, voile), en-tête transparent croix / Retour et nom du Format, accroche 14/20 centrée ; aucun nom de Séance ; « Valider les paramètres » ouvre le récapitulatif de **tous** les modèles, sur place ; Retour : réponses conservées | `fd0b177e` |
| Police Mali (écart C.3) | Inter italique | `Mali_500Medium_Italic` embarquée (`@expo-google-fonts/mali`) | `fd0b177e` |
| Mode catalogue intégré | Modale du Catalogue séparée (`/movement-selection`) | Dans la modale : recherche détachée avec effacement, Filtrer, Trier (inactif comme au Catalogue), Replier / déplier les piles, petites cartes avec filet des niveaux, sans compteur, « Ajouter », « Fermer le mode catalogue », sélection unique pour le buy-in | `fd0b177e` |
| Petite carte, Fiche du mouvement | Description tronquée ; appui sur la carte | Zones corporelles avec pastille ; appui sur la **photo** : Fiche du mouvement en consultation (le reste de la carte garde son comportement) | `fd0b177e` |
| Tableaux et clavier | Cellules Rép. sans unité ; EMOM sans tableau ; colonne Mode | Objectif à unité (Répétitions / Durée) choisie dans la barre du clavier, changement d'unité sans conversion (« à renseigner »), durée remplie par la droite, charge décimale, Précédent / Suivant (ordre §6 quater bis) ; tableaux AMRAP (Objectif / Par tour / Charge / Max), EMOM (Objectif / Charge / + / série), Death by (Départ / Incrément), For time et Progression (Unité + colonnes, 4 visibles) ; ligne « Repos · jusqu'à la cadence » retirée | `fd0b177e` |
| Validation | Cellules vides seulement | Formulaire complet et cohérent ; contrôle EMOM au seuil inclusif (× 2 de chaque côté + pause entre côtés ; somme dans chaque intervalle) : message, cadres rouges, bouton indisponible — au récapitulatif, dans la modale de l'Exercice et sur la roulette de l'intervalle commun | `fd0b177e`, `6083731e`, `9faff385` |
| Charges | Charge selon l'Exercice de base | Interrupteur « Avec charge » (Progression, For time, AMRAP, EMOM ; désactivé par défaut) ; Progression et For time par série / tour, AMRAP fixe, EMOM départ + incrément matérialisés par série ; case vide = série sans charge (0 kg, AD-19), ne bloque pas | `fd0b177e` |
| Rôle dans le circuit | Passage « Une fois » positionnel, buy-in unique non duplicable | `circuitRole` (Buy-in / Tour / Buy-out) ; zones ordonnées, plusieurs buy-in/out ; replacement dans la zone au changement de Rôle ; glisser limité à la zone ; dernier membre de la boucle et dernier en Répétitions du For time protégés (suppression, sortie) ; duplication d'un buy-in juste après l'original ; ligne « Rôle » dans la modale ; ancien `passageOnce` relu sans migration (Buy-in en tête, Buy-out en fin) | `fd0b177e`, `6083731e` |
| AMRAP | Incrément en répétitions, buy-in en Répétitions | Incrément dans l'unité de l'objectif ; buy-in en Répétitions ou Durée, à l'échec admis ; Incrément toujours présent, grisé pour un buy-in ou à l'échec ; déroulé en bloc continu, tours illustratifs | `fd0b177e`, `9faff385` |
| Regroupement | À la suite = Exercices successifs | Dès deux Exercices : Circuit ; À la suite et départs rapides concernés : Circuit standard « groupées » à 1 tour, Modèle d'origine posé | `fd0b177e` |
| Circuit replié | Aucune action | Glissé Renommer / (Modifier le format) / Dupliquer / Supprimer, seulement replié ; nom saisi en ligne (Retour), nom vide = nom par défaut ; copie « (C) » en saisie ; confirmation de suppression native | `fc1061d0` |
| Réédition | — | Récapitulatif rouvert prérempli depuis l'état actuel (Avec / Sans charge effectif, « variable » avec confirmation au remplacement), Retour au questionnaire, « Enregistrer les modifications » : mise à jour en place de la seule différence (identifiants, nom, position, réglages hors champ conservés) ; fermer = aucune mutation | `fc1061d0` |
| Modèle d'origine / Format d'origine | Modèle d'origine posé (020) | Distinction explicitée (structure, réédition) ; un Circuit standard ne reçoit aucun Format | `fc1061d0` |
| CE-FMT-04 (suspension levée) | Réglages de Format absents de la modale | Cadre Format : Rôle, Incrément par tour / par intervalle, Intervalle, Durée de l'exercice AMRAP, Durée maximum du For time (« Aucune »), borne héritée grisée, À l'échec imposé (Death by) ; appliqué au ✓ | `6083731e` |

Déjà conformes, non repris : appui long sur la surface du Circuit, Circuit replié teinté, compteur à position fixe, roulettes porteuses (« Sans limite »), réserve des valeurs For time / Progression, recherche qui garde le clavier.

## 3. C.5 et C.6

- **C.5** : cinq départs standards sans Libre (fenêtre Formats inchangée, conforme) ; Superset : deux mouvements exigés avant validation ; à deux mouvements ou plus, Circuit standard (§6 ter). `9faff385`.
- **C.6** : édition et duplication selon la base du 04/11 — réédition depuis la Composition (`formatReedit.ts`), duplication du Circuit entier et d'un buy-in / buy-out, Rôles conservés. Rattachées à C.6 ; leurs dépendances (Nom du Circuit, Modèle d'origine, Rôle) à C.1 / C.4.

## 4. A.3 et anciennes données (décision du 04/11)

Traité dans une branche de travail séparée puis intégré : voir le bilan d'intégration de A.3 (§ 9) — suppression des anciennes définitions par migration additive, retrait du parcours E.8-a ; A.5 (suppression de la table) reste non autorisée.

## 5. D.1 à D.5

| Story | Statut réel avant | Adaptations faites | Reste au moteur (PRE-10/11) |
|---|---|---|---|
| D.1 plan | `done`, code du 02/11 ; For time sans zones | Circuit For time : buy-in une fois avant le tour 1, buy-out une fois après le dernier, boucle alternée, repos entre les tours ; AMRAP : buy-in dans le segment du premier bloc (inchangé) | Contenu des segments AMRAP / Death by ; chrono For time ; étape à l'échéance (A4) |
| D.2 instantané | `done` ; copie profonde | Nom du Circuit copié ; `FORMAT_RULES_VERSION` 2 → 3 ; réédition sans effet sur un instantané figé (instantané au démarrage, inchangé) | — |
| D.3 capacités | `done` | Descripteurs AMRAP / For time : Rôles admis, Condition d'arrêt d'un buy-in, résultat différé du buy-in AMRAP, Modes des membres, unité de l'incrément, charges lues par série | Exécution (`executionAvailable: false` inchangé) |
| D.4 validité | `done` ; buy-in en Répétitions imposé | Rôles et zones (`ROLE_ZONES`), For time sans Répétitions (`NO_REPETITIONS`), contrôle EMOM (`EMOM_DURATION`), buy-in / membres For time en Durée admis, buy-in AMRAP à l'échec admis | — |
| D.5 document | `done` (29/10) | Correspondances à actualiser dans `spec-d-5-instruction-capacites-execution.md` (§ annexe ajoutée) | — |

**Dépendances du moteur et conséquences pour sa conception consolidée** : lire le Rôle de chaque membre (zones, une seule exécution, ordre) ; AMRAP — temps du buy-in pris sur le premier bloc, « Terminé » lance la boucle sans saisie intercalée, résultat du buy-in à l'échec saisi à la clôture du bloc avec tours complets et partiel ; incrément par tour en secondes pour un objectif en Durée ; For time — membres en Durée comme étapes chronométrées dans le chrono, buy-out qui termine l'élément ; charges lues par série depuis l'instantané, jamais recalculées ; questions A4, A6, R-01 à R-04 inchangées.

## 6. À CLARIFIER (contradictions réelles, avec recommandation)

1. **EMOM « dans chaque intervalle » et « + / série »** — Figma (`EMOM — Récapitulatif, dans chaque intervalle`) montre une progression de charge par série, mais dans ce Circuit chaque membre ne fait qu'une série par tour : la donnée « charge de la série k » n'existe pas. Conséquence actuelle : charge fixe, « + / série » inactif. Recommandation : lire la charge du tour k comme celle de la série k du membre (membre à N séries indexées par tour, comme le For time), ce qui touche D.1 et le moteur.
2. **Progression : Durée totale au questionnaire** — §9.3 place « Avec charge » « entre Pause et Durée totale », alors que la contre-recette du 03/11 (« ne pas calculer de durée total sur l'écran Questionnaire ») l'a retirée. Conservé : pas de durée au questionnaire, interrupteur après Pause. À confirmer.
3. **Death by « jusqu'à l'échec »** — le texte de `main` du 04/11 garde « jusqu'à l'échec » et « 1 → n rép. », sans remplacer explicitement la décision du 03/11 (« à l'échec », « 1 / +1 rép. »). La décision du 03/11 est conservée.
4. **Contrôle « Replier / déplier les piles »** — glyphe dessiné localement (pas d'icône dans le dépôt) ; à comparer au rendu Figma.

## 7. Tests exécutés

- `npx tsc --noEmit` : sans erreur. ESLint sur les fichiers touchés : aucune nouvelle erreur (les erreurs « refs during render » de `CompositionScreen` et `FormatModelScreen` préexistent).
- Nouveaux : `formatModels.reprise0411` (14), `circuitRoles.reprise0411` (9), `formatReedit.reprise0411` (7), `CompositionScreen.circuitActions0411` (4) ; `FormatModelScreen.c3` réécrit (23, dont mode catalogue et réédition).
- Adaptés aux règles du 04/11 (texte d'origine en commentaire) : `formatModels.c3`, `recette3.circuits`, `carrierMembership.c4`, `configurationValidity.d4`.
- Suite complète : voir § 9.

## 8. Recettes iPhone à rejouer

Rien n'est qualifié sans recette. À rejouer à cause des changements : parcours de chaque modèle (modale, Valider / Retour / Enregistrer), mode catalogue, saisie au clavier (unité, durée, charge, Précédent / Suivant), contrôle EMOM (récapitulatif, modale, en-tête), charges (quatre modèles), Rôles (changement, zones, glisser, gardes, duplication d'un buy-in), regroupement À la suite, Circuit replié (quatre actions), réédition (Retour, variable, enregistrer, fermer). Résultats antérieurs encore valables : contre-recette n° 3 quater (points non touchés : roulettes, réserve For time / Progression, Death by « à l'échec »).

## 9. Intégration A.3 et qualification

- **A.3** (branche de travail intégrée, `7ada8e12`) : migration 021 — suppression de toutes les lignes de `activity_definitions` (table conservée vide ; A.5 non autorisée) ; retrait de « Modifier » (E.8-a), de `ActivitySelectionScreen`, du parcours `catalogueDefinitionId` et des écritures / lectures de définitions ; gardes du Mouvement sans définitions ; test de garde `legacyDefinitionsGuard.a3`. Documentation : ch07 (E.8-a, ARB-01, archivage, Q8), ch12, epics, arbitrages, sprint-status. À CLARIFIER (classe C) : `Category.isUsed` — règle provisoire prudente (Catégorie utilisée si un Mouvement la référence).
- **Migration 022** : `tours.name` (nom du Circuit), écrite et relue par le dépôt ; tests `migration022` ; tests historiques 014 à 021 alignés sur la version 22 (colonne ignorée des comparaisons).
- **Qualification** : voir le rapport de fin de mission (suite complète).
