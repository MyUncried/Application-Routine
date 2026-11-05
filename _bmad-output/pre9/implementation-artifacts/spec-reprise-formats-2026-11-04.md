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

## 10. Recette iPhone du 04/11/2026 — écarts et corrections

Cahier « Recette Formats 04/11 » (https://claude.ai/artifact/XJCJLC7eHKcANDMrN1yNku), section « Écarts relevés le 04/11 — un par ligne » : 29 écarts, identifiants `e-*`. Texte exact de Hermann dans les notes des fiches f4-modale, f4-catalogue, f4-replie et « Autres constats » (a, b). Rien n'est qualifié sur iPhone.

| Écart | Correction | Classe | Documents |
|---|---|---|---|
| e-voile | La fenêtre Formats s'efface seule, son voile reste ; la route s'ouvre sans transition, la modale monte dans le même voile (`FORMATS_SCRIM`) ; descente animée à la fermeture | B (comportement) | ch07 « Recette iPhone du 04/11/2026 » |
| e-contexte-fondu, e-contexte-fixe | Zone de contexte figée au-dessus du contenu, part fondue de 22 px (rampe D-224) | B (rendu) | ch07 idem |
| e-tabata | Tabata : « Enregistrer dans la séance » au questionnaire, sans récapitulatif ; les autres modèles inchangés | B | référence Formats §7.1 annotée, PRODUCT, ch07 |
| e-emom-largeur | Colonne Objectif 84 px (EMOM, AMRAP) | A (rendu) | — |
| e-emom-mode | EMOM créé sans unité, objectif à renseigner ; barre Répétitions / Durée d'emblée ; valeur tapée sans unité lue en Répétitions (choix technique) | B | référence §7.6 et §10 annotées, PRODUCT, ch07 |
| e-emom-trait, e-amrap-trait | Case à renseigner : « — » sur fond rouge | B | référence §7.6, ch07 |
| e-fortime-buyin | Interrupteurs Buy-in et Buy-out au questionnaire For time ; sections, mouvement requis, Rôles, Déroulé (buy-in au départ, buy-out à la fin) ; réédition : interrupteurs déduits des Rôles | B | référence §11 annotée, ch07 |
| e-fortime-fond, -unite, -charge | Tableau For time sans fond, zones de saisie blanches, colonne Unité décalée de 20 px, charges en 11 px régulier, ligne plus basse | A (rendu) | — |
| e-amrap-max, -colonnes | Max sur 28 px aligné à droite, titre centré au-dessus ; colonnes Par tour / Charge 58 px | A (rendu) | — |
| e-deathby | Tableau Départ / Incrément dès deux mouvements, au questionnaire aussi | B | référence §12 annotée, ch07 |
| e-cat-fixe, e-cat-recherche, e-cat-defiler | En mode catalogue, en-tête de section et ligne de recherche dans la zone figée ; même champ que la saisie (croix intérieure), commandes qui apparaissent pendant que le champ se rétrécit ; défilement jamais bloqué | B (rendu) | ch07 |
| e-cat-filet | Toucher le filet d'une pile la replie ; « Déplier » les rouvre toutes | A | — |
| e-cat-selection | Carte sélectionnée : liseré 2 px, fond `#E8E9FF` | A (rendu) | — |
| e-cat-filtre-ouvrir, -fermer | Feuille de filtre `docked` : haut à la limite de la zone de contexte, montée 480 ms, descente 380 ms vers le bas | A (rendu) | — |
| e-replie-* (agent) | Enveloppe de glissement toujours montée (cause du soubresaut), actions sur toute la hauteur, cadre qui glisse avec un écart de 8, Circuit au-dessus du clavier au renommage, options refermées après Dupliquer | A / B | ch13 CE-FMT-05, référence §7.8 |
| e-ajout-fin (agent) | Exercice ajouté après un Circuit issu d'un Format, hors de lui (même conteneur) ; Circuit manuel inchangé (ARB-07) | B | ch07 et arbitrages ARB-07 annotés |
| e-segmente (agent) | Non modifié : aucune cause démontrée ; seule la largeur de l'option sélectionnée change (Figma) | — | question ouverte |

## 11. Feuilles natives iOS (essai adopté le 04/11/2026)

Demande et adoption de Hermann (texte exact au registre ch07, « Recette iPhone du 04/11/2026 ») ; classe B, P-4 (primitive native). Branche d'essai `pre9-bmad/essai-feuille-native` (db1a048e, a1677dd1, 2933ca54) avancée sans fusion dans `pre9-bmad/dev`.

- Routes `formats-window` (nouvelle, `formSheet` ajusté au contenu), `format-questionnaire`, `format-summary`, `movement-selection` : `formSheet`, sans poignée, fond blanc sur toute la hauteur ; haut des feuilles pleine hauteur à y = 95 (`useFormatSheetDetent`, même calcul que la fiche du mouvement).
- `FormatsWindow` : contenu de feuille (plus de `Modal`, plus de voile relais) ; la Composition pousse `/formats-window`.
- `FormatModelScreen` : plus de voile ni d'animation propres ; croix du questionnaire → Composition (`backToComposition`, fenêtre Formats empilée comprise).
- `MovementSelectionScreen` : `inSheet` (pas de marge de zone sûre en haut).
- Remplacé : voile conservé / relais (e-voile), fenêtre centrée, tap sur le voile pour fermer (à constater sur la feuille native).

**Réponses de Hermann du 04/11/2026 :** contrôle segmenté — « Peut-on tester la deuxième option ? » (option sélectionnée à droite : essai) ; Circuit libre — « Dans le circuit si il est libre, en dehors si c'est un circuit issu d'un format » (conforme au code) ; Circuit de Format dans un Cycle — « Dans le Cycle, après le Circuit » (conforme) ; récapitulatif — « Tous les modèles sans tableau » (30/30, Renforcement, À l'échec, Superset sans récapitulatif, réalisé). Question 5 tranchée (Hermann : « si la valeur est saisie avant le choix, elle est renseignée comme une répétition, mais le choix reste affiché ») : réalisé (barre Répétitions | Durée maintenue ; Durée choisie ensuite = à renseigner).

**Questions ouvertes (À CLARIFIER) :**
1. Contrôle segmenté (constat b) : anomalie (le contrôle bouge) ou règle (option sélectionnée à droite) ? Quel contrôle (Phases, Charge, Côtés, Séries) ?
2. Ajout d'un mouvement quand le dernier élément est un Circuit composé à la main : dans le Circuit (ARB-07) ou après lui ?
3. Circuit de Format dans un Cycle : l'Exercice ajouté reste dans le Cycle, après le Circuit (choix de l'agent).
4. Tabata seul sans récapitulatif : faut-il étendre aux autres modèles sans tableau (30/30, Renforcement, À l'échec, Superset) ?
5. EMOM : une valeur tapée sans avoir choisi l'unité est lue en Répétitions.

## 12. Recette iPhone du 05/11/2026 — écarts et corrections

Cahier « Recette Formats 04/11 », bloc « Constats » (c à f) et lignes KO du 05/11 ; décisions recopiées au registre ch07, « Recette iPhone du 05/11/2026 — décisions de Hermann ».

| Écart | Classe | Correction | Documents |
|---|---|---|---|
| c — résultats cachés derrière le clavier | A | Hauteur du cadre des suggestions ramenée au repère de l'écran (feuille native), nouvelle mesure une fois le clavier en place | — |
| c — texte sans résultat | B | Cadre des suggestions conservé, vide ; écran figé tant qu'un texte est tapé | Formats §7 (annotation), ch07 |
| c — rebond en bout de liste | B | Rebond (haut ou bas) des suggestions : clavier retiré, texte et résultats conservés | Formats §7 (annotation), ch07 |
| d — Entrée du mode catalogue | B | `submitBehavior="blurAndSubmit"` : résultat affiché, clavier fermé, focus retiré | Formats §7 (annotation), ch07 |
| d — For time, cadre du tableau | B | Cadre dédié identique au cadre des paramètres | Formats §7.6 (annotation), ch07 |
| e — Déroulé AMRAP en durée | B | Durée compacte ' et " (`compactBlockDuration`) | ch07 |
| f — Death by, unité au clavier | B | Barre : Répétitions, seule unité admise, sur Départ et Incrément | ch07 |
| e-fortime-charge | B | Objectif et charge serrés ; charge sans zone tactile (Précédent / Suivant) | Formats §7.6 (annotation), ch07 |
| e-fortime-unite | B | Unité calée à droite ; colonnes de 84 dès qu'une ligne est en durée | Formats §7.6 (annotation), ch07 |
| x-sans-recap — Superset | B | Ligne « Récupération après la paire » ; troisième exercice refusé (alerte « Deux exercices au maximum ») | ch07 |
| e-cat-filet | B | Pile repliée : deux feuilles sous la carte du dessus, filet conservé qui déplie la pile ; « Replier » replie chaque pile | ch07 |
| e-replie-glisse | B | Bloc d'actions translaté avec le Circuit (`slideActions`) | Formats §7.8 (annotation), ch07 |

**À CLARIFIER — tranché.** Le format compact ' et " a aussi été appliqué aux blocs For time en durée (et aux blocs buy-in / buy-out). [05/11/2026, Hermann (g-fortime-deroule) : « On garde, même format de durée pour tous les déroulés » — classe B.]

**Non traité.** e-voile (« Il reste cet effet "flash", est-il possible de le supprimer ou de l'atténuer ? ») : l'empilement de deux feuilles natives est animé par iOS ; aucune correction n'est proposée sans essai sur iPhone. Constats a et b : déjà traités (ajout en fin de Séance ; contrôle segmenté, option sélectionnée à droite).

Tests : `formats.recette0511.test.tsx` (durée compacte, Déroulé AMRAP, charge For time, glissement des options), `FormatModelScreen.c3` (Superset, cadre vide). Rien n'est vérifié sur iPhone.

### 12.1 Valeurs au clavier (05/11/2026)

Hermann : « Un point à corriger pour tous les écrans questionnaires, récapitulatif : on utilise systématiquement le clavier pour renseigner les valeurs, plus aucun stepper et de roulette. L'appui sur suivant permet de passer d'une valeur à l'autre, aussi entre deux lignes ou d'une ligne à un tableau. »

Classe B. Réalisation : chaque valeur des lignes de paramètres se tape dans sa pastille (pavé numérique ; durée « MM:SS » remplie par la droite, comme dans les tableaux) ; la barre du clavier (Précédent, Suivant, Fermer) enchaîne les lignes dans l'ordre affiché puis les cases du tableau ; bornes appliquées à la saisie ; une case vidée garde sa valeur, sauf le Temps limite qui repasse à « Sans limite » ; une valeur « variable » demande la confirmation existante à l'entrée dans la case. Composant : `TableCell` (variante `badge`) dans `stepRow` ; ordre de Suivant = lignes de paramètres (ordre affiché), puis `tableCellOrder` (Progression : tableau entre Nombre de séries et Pause). Stepper `ValueStepper` supprimé.

**Interprétations à confirmer :** case vidée → valeur précédente conservée (Temps limite → « Sans limite ») ; valeur hors bornes ramenée à la borne ; le contrôle d'Exécution (menu) et les interrupteurs restent des contrôles tactiles. Documents : référence Formats §7.1, ch13 CE-FMT-02 § 10, ch07.

### 12.2 Contre-recette du 05/11/2026

| Ligne | Classe | Correction |
|---|---|---|
| g-cat-pile, e-cat-filet — « Le filet ne reste pas sur la pile » | A (rendu) | Filet de la pile repliée le long de la carte du dessus (marges de 8) ; il était de hauteur négative sur une carte de 52 |
| g-fortime-cadre — largeur des zones de saisie | B | Zones de saisie For time en pastille (largeur de la valeur, min 48, rayon 10), comme les valeurs des lignes de paramètres |
| g-recherche-vide — « aucun résultat » | B | Texte « Aucun résultat » dans le cadre des suggestions |
| g-recherche-rebond — cadre jusqu'en bas | B | Sans clavier, le cadre des suggestions descend jusqu'au bas de l'écran (zone sûre déduite) ; changement animé au rythme du clavier |
| g-superset-deux — « J'ai compris » | B | Bouton « J'ai compris » ; puis clavier fermé, mode catalogue fermé, texte effacé, retour au questionnaire |
| g-fortime-deroule | B | Format ' et " conservé pour tous les Déroulés |

Documents : ch07 (« Recette iPhone du 05/11/2026 »). Rien n'est vérifié sur iPhone.
