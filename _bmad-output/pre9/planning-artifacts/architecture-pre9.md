# PRE-9 — Architecture — base Formats actualisée

[référence active Formats du 02/11/2026](../../../docs/KODJO-Formats-entrainement-2026-11-02.md). Cette révision modifie la cible, pas le code ; inventaire de la branche avant changement du schéma ou des consommateurs.

## Menu Créer — règle active

Le menu Créer propose trois options, dans cet ordre : **Créer un exercice**, **Créer un circuit**, **Créer un cycle**. Créer un exercice ouvre la modale commune « Créer un exercice » : Exercice libre, puis grille Formats d’entraînement. Les mouvements existants se sélectionnent dans la fiche de création ; aucun accès distinct « Utiliser des mouvements existants » ou « Utiliser un format d’entraînement » dans ce menu. Le bouton + devient Annuler, croix grise 34 px au même emplacement ; voile, axe jusqu’à Créer un cycle et fermeture sont conservés. Créer un circuit/un cycle conserve le choix d’emplacement existant.

À l’ouverture, le bouton + « Ajouter une activité » devient Annuler : croix standard sur fond gris, 34 px, à l’emplacement exact du + et au-dessus du voile. Le toucher ferme le menu sans action ; la fermeture rétablit +. Le bouton Pause / Ajouter un arrêt conserve sa place à gauche, sous le voile. [Précisé le 01/11/2026 — recette iPhone PRE-9 de Hermann : « la zone de contexte doit être sous le voile grisé, seuls le bouton créer -> annuler, et les options doivent être visible dessus » : toute la zone de contexte est sous le voile ; seuls Annuler (le + transformé), l’axe et les options sont au-dessus.] Un axe vertical, au-dessus du voile et sous les options, relie Annuler aux icônes et s’arrête à Ajouter un cycle. Aucune option Annuler n’est ajoutée à la liste.

L’écran ouvert par « Créer un exercice » porte ce même titre. Le bouton de confirmation du mouvement sélectionné porte « Créer un exercice ». Les cartes de suggestion conservent les composants et règles du parcours de recherche existant ; ce libellé ne renomme pas les actions distinctes de correction ou de création d’un Mouvement dans les autres contextes.

**MENU-FMT-01 — remplacée :** le parcours actif est celui de la fenêtre Formats et du menu à trois options ci-dessus.

Les exigences de menu ci-dessous se lisent avec cette règle ; aucune story ne doit réintroduire une entrée retirée.

## Parcours Formats — mise à jour du 03/11/2026

Le questionnaire et le récapitulatif sont des **modales**, ouvertes depuis la modale de création commune au Catalogue et à la Composition. Depuis la Composition, ils sont ouverts par le bas, pleine largeur, sous son titre ; depuis le Catalogue, aucun brouillon de Séance n’est créé avant l’arrivée en Composition. Ils ne portent aucun champ ni bloc « Titre de séance » : le nom, l’Étiquette et les réglages de Séance restent dans la Composition derrière le voile. Le titre de la modale est le nom du Format. Le questionnaire se ferme par croix vers le point de départ conservé (Catalogue ou Composition) ; son bouton **« Valider les paramètres »** ouvre le récapitulatif sans ajouter de structure. Le récapitulatif revient au questionnaire par Retour avec réponses conservées ; **« Enregistrer dans la séance »** ajoute la structure au brouillon de Composition, sans sauvegarde définitive. Aucun changement de nom de Séance n’est déclenché par ces étapes.

« Ouvrir le mode catalogue » reste dans la même modale de questionnaire : aucune navigation sortante ni modale de catalogue supplémentaire. La recherche reste visible avec le texte saisi et les résultats déjà filtrés ; croix d’effacement dès que le champ contient du texte. Filtrer, Trier et Replier / déplier les piles sont à droite sur la même ligne. Les petites cartes occupent la hauteur disponible jusqu’au bas de la modale, avec le filet des niveaux d’une famille, sans compteur « n familles · n mouvements ». « Ajouter » applique la sélection et referme ce mode ; « Fermer le mode catalogue » revient à la saisie sans ajouter de mouvement. La boucle permet la sélection multiple ; le buy-in, sous « Mouvement du buy-in », une sélection unique.

Dans le questionnaire et le récapitulatif, toucher la **photo** d’une petite carte ouvre la **Fiche du mouvement** en consultation seule, en modale par-dessus celle du Format, sur un second voile. Apparition par le bas, pleine largeur, coins hauts arrondis 24 px ; en-tête croix et titre « Fiche du mouvement », fond blanc et trait conservés. Nom, catégorie, zones corporelles, niveau, média, description et phases habituels ; aucun bouton d’action. Fermer restitue exactement l’état du parcours sous-jacent. Toucher le reste de la carte conserve son comportement existant.

**EMOM — tableau et validation du 5 novembre.** Tableau Unité | S1…Sn, quatre colonnes visibles au plus, nom et unité fixes ; chaque série porte sa cible et sa charge. Pas de champ d’incrément d’objectif ni de charge. Création : valeurs de S1 reprises initialement ; nouvelles séries ajoutées après coup à compléter selon les règles existantes ; réouverture sans réinitialisation. Pour chaque rang/fenêtre, travail connu en Durée incluant deux côtés et pause entre côtés applicable ; somme des membres dans un intervalle commun, intervalle local sinon. Atteinte ou dépassement de l’intervalle bloque la validation (message et cadres rouges), y compris après modification en Composition ; aucune durée inventée pour les membres en Répétitions.

**Validation du récapitulatif :** « Enregistrer dans la séance » n’est actif que si tous les paramètres requis sont renseignés et la configuration cohérente. Une cible à renseigner est signalée dans son cadre et bloque l’ajout ; un récapitulatif incomplet ne crée pas un Exercice « Paramètres à compléter » dans la Composition. Cet état reste possible après une modification ultérieure de Composition, notamment une entrée/sortie de Circuit ou de Format. Chaque case de tableau et la modale correspondante lisent et écrivent les mêmes champs standards de l’Exercice ; aucun second stockage.

**Contrôle EMOM des durées — seuil inclusif :** le travail prévu d’un Exercice en Durée est sa cible, multipliée par deux s’il est fait de chaque côté, plus la pause entre les côtés applicable. En simple, alternance et À la suite, travail prévu ≥ intervalle propre bloque la validation ; Dans chaque intervalle, somme du travail prévu des membres ≥ intervalle commun bloque la validation. Les membres en Répétitions contribuent pour 0 à ce contrôle de durée connue, sans garantie que le travail total tiendra dans la fenêtre. Message sous le tableau, cadres des valeurs concernées et de l’intervalle rouges ; validation bloquée dans le récapitulatif, la modale et lors de l’édition de l’intervalle du Circuit. À 60 s : 40 s d’un seul côté admis, 40 s de chaque côté refusés ; 30 s + 30 s refusés ; 10 répétitions + 30 s ne déclenche pas ce seul contrôle.

Réutiliser les composants modaux, recherche, contrôles, cartes et tableaux existants. État local de parcours conservé entre les vues, sans nom de Séance ni nouvelle table de valeurs. Aucun développement du moteur PRE-10/11 dans ce correctif.

## 1. Principes

1. **Une seule représentation** : `SessionStructure` (`src/domain/sessions/structure.ts`) devient le modèle unique du brouillon, du service, du dépôt et de l'écran. L'ancien modèle « avant / Circuit / après » ne subsiste que comme lecture de compatibilité, puis disparaît.
2. **Domaine pur d'abord** : chaque règle (insertion, enveloppe, déplacement, conversion de nature, points d'arrêt, développement, validation de Format) est une fonction pure testée avant l'interface, comme `composition.ts` et `placement.ts` aujourd'hui.
3. **Registre déclaratif** : quatre Formats spécialisés, porteur Exercice autonome ou Circuit selon l’organisation ; préconfigurations standards séparées. Format d’origine Circuit immuable, nature fixée, valeurs effectives modifiables. Aucun nouveau conteneur Bloc de Format.
4. **Pas de moteur** : PRE-9 produit les entrées du moteur (plan développé, instantané, descripteurs) sans état d'exécution.

## 2. Domaine Séance

| Module | Évolution | Réutilisation |
|---|---|---|
| `structure.ts` | **Exercices directs de Cycle** : `StructureCycle` ne contient aujourd'hui que des Circuits (`structure.ts:52-56`, refus d'un Cycle sans Circuit `:355`) alors que D-451 admet « Cycle : Exercices directs et Circuits » — le Cycle reçoit une liste ordonnée d'éléments (Exercice ou Circuit) ; emplacement de Point d'arrêt étendu au Cycle (`cycleId`) ; borne haute du Cycle 1..99 ; Format facultatif sur le bon porteur Exercice ou Circuit selon la référence active ; opérations pures sur l'arbre : insérer (ARB-07), poser un conteneur sur un premier contenu (ARB-06), déplacer un Exercice, un Circuit, un Cycle (ARB-09) ou un Point vers toute position autorisée, supprimer (conteneur vidé retiré), dupliquer un Exercice (ARB-08 : pas de conteneur), changer nature/compte ; identifiants stables | `validateStructureShape`, `computeStructureDuration`, `countStructureExercises` |
| `SessionDraft.ts` | Remplacé par un brouillon structuré : `structure`, `stopPoints` (positions dans l'arbre), réserve de séries **par Circuit** (`circuitSeriesReserve` devient une table indexée par Circuit), Mouvements du brouillon, Format et réglages de chaque Exercice formaté (C.1), origine de création de la Séance | Champs de réglages de Séance, Mouvements du brouillon |
| `circuit.ts` | Opérations de nature (`applyNatureChange`, `setCircuitCount`, `circuitVolumes`) appliquées à **un Circuit identifié** de l'arbre | Règles groupées/alternées, conversion avec perte, réserve |
| `StopPoint.ts`, `placement.ts` | Positions généralisées (niveau Séance, intérieur de Circuit, intérieur de Cycle — ARB-06) ; RM-219/251 et D-441/D-442 évalués sur la séquence fonctionnelle de toute la structure (`arbitrages-pre9.md` ARB-02) ; Point interne à un Cycle rencontré à chaque répétition, exceptions de début et de fin et demande de choix comme pour le Circuit, par le même code (ARB-02a/b) ; garde `STRUCTURE_STOP_POINTS_UNSUPPORTED` retirée | `isStopPointAllowed`, dédoublonnage, mode Placement |
| `composition.ts` | Zones structurelles (`STRUCTURAL_ZONES`) remplacées par des chemins dans l'arbre | `moveOccurrence`, `duplicateOccurrence`, numéro de copie |
| `structureFromLegacy` / `legacyFromStructure` | Conservés pour la lecture des anciennes données et les tests ; `legacyFromStructure` retiré des chemins de production | — |

## 3. Services et persistance

- **`SessionService`** : `createSession` / `updateSession` / `getSessionForEdit` / `getSessionForConsultation` / `duplicateSession` passent sur `createStructured` / `updateStructured` / `findStructuredById`. Aucune Séance n'est plus projetée vers l'ancien modèle ; `SessionStructureNotRepresentableError` cesse d'être atteignable.
- **Catalogue (PRE-8)** : `listCatalogue` lit déjà la structure générale ; inchangé.
- **Validation** : `validateStructuredSessionInput` (existant) cesse de passer par l'équivalent ancien modèle (`equivalentLegacyInput`) et valide directement l'arbre.

### Migrations proposées (aucune n'est créée dans cette mission ; numéros indicatifs, attribués à la livraison selon les arbitrages retenus)

| Migration | Contenu | Story | Condition |
|---|---|---|---|
| 016 | **Structure D-451 complète** : `activities.cycle_id` nullable (Exercice direct de Cycle ; FK composite vers `cycles`, comme `tours.cycle_id`) et `session_stop_points.cycle_id` nullable (Point à l'intérieur d'un Cycle) ; index uniques partiels de position par Cycle ; contrainte « au plus un parent » | A.1 | Validation du plan (ARB-06 rend la colonne de Point nécessaire quelle que soit la réponse à ARB-02a/b) |
| 017 | **Format porté uniquement par l’Exercice** : `activities.format_key`, `activities.format_settings` (NULL = Exercice libre ; réglages en JSON validé par le domaine, sur le modèle d'`execution_parameters`, avec leur version de schéma). **Aucune colonne de Format sur `tours`** : le Circuit n’est pas un porteur de Format ; `sessions.origin` nullable (provenance de création : carte Exercice, carte Séance, Format, départ rapide — FMT-02, ch09 l.593-598). La version de règle n'est figée que dans l'instantané (ch09 l.593-598) [PRE-9 dev, correction du 30/10 (Hermann, classe B, spec C.1) : migration 017 déjà livrée avec `tours.format_key` et `tours.format_settings`, conservées comme vestiges inutilisés (017 inchangée) — voir sprint-status c-1] | C.1 | Validation du plan |
| 018 [ajoutée le 31/10/2026, story A.2b ; Hermann, 31/10/2026 : « Oui, migration 018 (Recommandé) » — « A.4 → 019, A.5 → 020, plan annoté »] | **Durée facultative d'une phase du Mouvement** : `movement_phases.duration_seconds` nullable (1..3535 s, `NULL` = aucune durée), `ALTER TABLE` additif et idempotent, aucune reprise (toute phase existante reste sans durée) | A.2b | Approuvée par Hermann le 31/10/2026 ; preuves de conservation, d'échec et de reprise (`migration018.test.ts`, copie de base fichier au schéma 017) |
| 019 [ajoutée le 31/10/2026, recette iPhone n° 2, constat e ; A.4 → 020, A.5 → 021] | **Marque « Paramètre à vérifier »** : `activities.phases_to_verify` et `activity_definitions.phases_to_verify` nullables (liste JSON des identités de phase dont la durée a été reprise d'une valeur par défaut ajoutée au Mouvement), `ALTER TABLE` additifs et idempotents, aucune reprise | Recette n° 2 (constat e) | Décision de Hermann du 31/10/2026 (« Champs vides seulement », « Ouverture de la feuille », « Séances et Catalogue ») ; migration À CONFIRMER par Hermann (spec-recette-2-corrections.md) |
| 019 [31/10/2026, Hermann, 31/10/2026 : « Oui, migration 018 (Recommandé) » — « A.4 → 019, A.5 → 020, plan annoté » ; numéro d'origine : 018] [31/10/2026, recette iPhone n° 2 (constat e, décision de Hermann du 31/10) : migration 019 attribuée à la marque « Paramètre à vérifier » : renumérotée **020**] | Conversion E.8-b : chaque `activity_definitions` → Séance d'un Exercice (titre Q-E1), Mouvement et paramètres conservés, rapport `migration_notices`, annulation complète en cas d'échec ; médias et associations conservés ; transactionnelle ; **aucune ligne historique retirée** | A.4 | ARB-01 validé (révision 2) |
| 020 [31/10/2026, Hermann, 31/10/2026 : « Oui, migration 018 (Recommandé) » — « A.4 → 019, A.5 → 020, plan annoté » ; numéro d'origine : 019] [31/10/2026, recette iPhone n° 2 (constat e, décision de Hermann du 31/10) : migration 019 attribuée à la marque « Paramètre à vérifier » : renumérotée **021**] | Suppression de `activity_definitions` et `activity_definition_body_zones` — **conditionnelle** : justification de non-utilisation (test de garde), preuve de conservation (comparaison sur copie de base réelle), autorisation explicite de Hermann | A.5 | Hors engagement PRE-9 par défaut |
| À déterminer sur la branche [02/11/2026, référence Formats ; numéros réels de la branche : 016 à 019 exécutées, 020 réservée à A.4, 021 à A.5 — prochain numéro libre **022**] | Évolution additive pour Format/réglages sur le bon porteur et paramètres Circuit, intervalles locaux Death by alterné ; ne pas réécrire migration 017 exécutée | C.1 | Inventaire des migrations et données existantes |

[Version initiale remplacée le 29/10 : 016 = Format sur `sessions` (`format_key`, `format_origin`, `format_settings`, `format_rule_version`) ; 017 = `session_stop_points.cycle_id` sous condition d'ARB-02 option B ; 018 = conversion avec retrait de la ligne dans la même transaction ; 019 = suppression « après 018 et une version stable ». Motifs : ARB-03 (Format porté par l'élément), ARB-06 (Point dans un conteneur), ARB-01 (conversion distinguée de la suppression), lacune des Exercices directs de Cycle constatée le 29/10.]

**Porteurs et stockage :** Exercice autonome et Circuit selon la référence active ; aucune interdiction de colonnes de Format sur Circuit. Choisir une évolution compatible avec les migrations déjà exécutées, préserver données et instantanés.

Chaque migration : test sur base en mémoire et **sur copie d'une base réelle** (pattern `preservation.story1*`), compatibilité ascendante, aucune réinitialisation (D-440 ne se rejoue pas).

## 4. Interface de Composition

- **Découpage de `CompositionScreen.tsx` (6 060 lignes)** : extraction de composants par niveau (`SessionLevelList`, `CycleBlock`, `CircuitBlock`, `ExerciseRow`, en-têtes), l'écran gardant l'orchestration (brouillon, navigation, barre d'action). Objectif : changer de modèle sans régression, par étapes couvertes par les tests d'intégration existants.
- **Gestes** : `compositionGesture.ts` (`resolveDropTarget`, `resolveDragShifts`) généralisé des trois zones vers des positions d'arbre ; `useDragAutoScroll` réutilisé tel quel ; la carte portée suivie hors rendu (leçon PRE-8 f3-01).
- **Réutilisation** : `SheetMotion` (repli/dépli), `DisclosureControl`, `CircuitHeader`, `OccurrenceCard`, rail, sélecteurs à roue, `ExecutionParametersSheet`, `DecisionDialog`, `TransientNotification`, `SessionCompositionTree` (rendu de référence déjà testé).
- **Menu Créer** : réutiliser les composants de menu Figma, les trois options, le bouton rond +/Annuler et les couches définis dans CE-T03-08 ; aucun menu natif à six actions ; aucun composant nouveau sans nécessité documentée.

## 5. Formats

Réutiliser le registre et le brouillon structurés ; porteur Exercice ou Circuit, quatre Formats spécialisés et six préconfigurations standards de grille. Circuits porteurs : AMRAP groupé (blocs), For time alterné (travail et borne optionnelle), EMOM dans chaque intervalle (groupé), Death by dans chaque intervalle ou alterné (fin collective).

Death by alterné conserve l’Intervalle par membre, modifiable dans sa modale, sans durée d’en-tête ; groupé coordonné conserve un intervalle commun au Circuit. Le tableau Progression écrit les séries/charges existantes, pas un second modèle ; clavier direct et navigation Suivant propres au récapitulatif. Réutiliser blocs, lignes et composants ; ne pas créer de bibliothèque ou couche sans nécessité démontrée.

C.4 consomme A.1/B.1/B.2/B.3/B.4 multi-conteneurs. D.1/D.2/D.3/D.4 s’alignent sur les bons porteurs ; aucune liste non bornée générée en PRE-9. Les bornes de saisie ne plafonnent ni objectifs calculés ni comptes réalisés. Les horloges et résultats effectifs restent PRE-10/11.

## 6. Contrat de passage Composition → Exécution (indépendant de l'implémentation)

| Élément | Contenu | Règle source | Livré en |
|---|---|---|---|
| Instantané de Séance | Type et constructeur purs (sérialisation versionnée reportée à PRE-10, premier consommateur) ; version de schéma ; identité et origine de Séance ; structure complète (identifiants stables) ; **par porteur effectif Exercice ou Circuit** : Format, réglages effectifs, version de règle ; contenu des Mouvements résolu (nom, phases, médias) ; paramètres d'exécution par Exercice ; réglages de début et de fin | SU-07, ch09 l.593-598, ch11 l.13, `exerciseSnapshot.ts` (v3), ARB-03 | D.2 |
| Plan développé | **Plans finis seulement.** Suite ordonnée d'occurrences exécutables `{ id stable dérivé (chemin + indices de répétition, de tour, de série, de côté), Exercice, série, côté, cible, phases, récupération, point d'arrêt, contexte (Cycle i/n, Circuit t/N), porteur formaté de rattachement }` ; séries nulles sautées, sans la récupération directement associée (ARB-10b), pauses indépendantes conservées ; points consécutifs dédoublonnés ; compte à rebours et fin aux seules frontières ; un Cycle × k reproduit k fois le développement de ses éléments, formatés ou libres, sans autre facteur (ARB-25). Un élément AMRAP ou Death by apparaît comme **un segment progressif** `{ élément, Format, réglages }`, une fois par répétition de son Cycle, sans aucune occurrence générée. Les éléments formatés finis (Tabata, 30/30, EMOM, For time) sont développés par leur structure ordinaire (séries, compte, nature) ; leur sémantique temporelle (fenêtre, chronomètre) relève du descripteur | RM-252, ch10 l.1014-1015, l.1130, l.1136, RM-234, RM-251, RM-083, ch12 l.1829 | D.1 |
| Descripteur de capacités | Table documentaire sourcée + type minimal (pas de logique), **par Format et organisation, appliqué au porteur Exercice ou Circuit** : porteur ; expansion `FINITE` ou `PROGRESSIVE` ; références temporelles et échéances nécessaires (A2) ; déclencheurs (échéance, appui, Suivant, borne, arrêt déclaré) ; comportement à l'expiration lorsqu'il est défini, « NON DÉFINI » sinon (A4) ; fin ; progression fixe/dynamique ; résultats pertinents — motif de fin, résultat réalisé, niveau d'achèvement (A6) ; interruptions et reprise (RM-066…070 ; R-01 « NON DÉFINI ») ; familles d'événements de signal (interface, audio, haptique) ; `executionAvailable` (faux pour tout Format en PRE-9) | ch11 l.315, ch12 l.1824-1834, FMT, ch10 l.1594-1600 | D.3, D.5 |
| Validité et disponibilité | Deux notions distinctes : **validité de configuration** `valid` / `invalid` + motifs lisibles (cible manquante, volume nul, constante modifiée, structure invalide), par élément et pour la Séance, sans réparation silencieuse ; **disponibilité du moteur**, lue dans le descripteur (`executionAvailable`), indépendante de la validité. Aucun affichage nouveau : « Lecture indisponible » inchangé (ARB-21). [Version initiale : état unique `ready` / `incomplete` / `notExecutableYet` — remplacé le 29/10.] | cadrage §2.C (l.47) ; CE-FMT-02 §14, CE-FMT-04 §14 ; ARB-21 | D.4 |

Le **plan progressif** (AMRAP, Death by) n'est représenté que par son segment, son descripteur et ses réglages ; aucune occurrence n'est générée en PRE-9 et aucune liste infinie n'est créée (CE-FMT-05 §15).

## 7. Matrice des capacités — configuration active

| Modèle | Porteur / organisation | Représentation PRE-9 |
|---|---|---|
| Tabata et cinq départs | Standards, pas de Format spécialisé | Paramètres standards et structures de la référence active ; aucune constante imposée |
| EMOM autonome / À la suite / alterné | Exercice, Circuit standard si alterné | Fenêtres finies, intervalle par Exercice |
| EMOM dans chaque intervalle | Circuit groupé porteur | Compte fini, intervalle commun, membres sans duplication d’horloge |
| AMRAP | Exercice autonome ou Circuit groupé selon cas | Segment progressif, blocs configurés et tours de boucle distincts, sélection unique par ajout de buy-in, plusieurs buy-in possibles |
| For time | Exercice autonome ou Circuit alterné porteur | Séries indexées par tour, borne optionnelle et temps mesuré distincts |
| Death by indépendant | Exercice autonome, y compris dans standard groupé | Segment progressif, fin locale et départ réinitialisé au passage suivant |
| Death by coordonné | Circuit porteur groupé ou alterné | Régime ouvert, fin collective ; intervalle commun groupé ou intervalles locaux alternés |

Les références temporelles, acquisitions et résultats effectifs relèvent de PRE-10/11. Les capacités n’inventent aucun plafond de progression ou compte fini.

## 8. Orientation PRE-10 (non engagée)

Le moteur PRE-10 consommerait l'instantané et le plan développé (D.1, D.2) et les descripteurs (D.3) ; il implémenterait seulement l'expansion finie, l'horloge d'étape et les déclencheurs de Libre, en gardant des points d'extension pour la fenêtre, l'échéance d'élément et la génération progressive des segments. Les tables d'exécution et de résultats (A6), rattachées à l'élément formaté le cas échéant, sont conçues en PRE-10. Aucun de ces éléments n'est développé en PRE-9.

## 9. Risques techniques

| Risque | Maîtrise |
|---|---|
| Régression de la Composition (6 060 lignes, 19 tests d'intégration) | Découpage progressif ; tests d'intégration existants gardés verts à chaque story ; nouveaux tests par niveau |
| Perte de données à la migration du brouillon et à E.8-b | Tests sur copie de base réelle ; transaction unique ; rapport de migration ; aucune réinitialisation |
| Performance du glisser-déposer imbriqué | Carte portée hors rendu ; mesures sur iPhone dès B.4 |
| Formats × D-451 | ARB-03, ARB-24, ARB-25 décidés ; compatibilité centralisée dans le registre ; tests de non-double multiplication (Cycle × Circuit × séries) |
| Exercices directs de Cycle absents du domaine et du schéma | Traité dans A.1 (migration 016), avant tout écran |
| Rendus non dessinés (stepper, éclairage, Cycle déployé) | ARB-19 : réutilisation des composants existants ; manque précis signalé par story |
| Mémoire lors de la suite complète | Exécution fractionnée (Q.0, activité distincte) |
| Documents normatifs contradictoires | Lot documentaire de classe B à chaque story (règle permanente) |


## Formats — base finale du 4 novembre 2026

**Création et Formats — décisions du 5 novembre 2026.** Modale de création commune au Catalogue et à la Composition, nouveau brouillon prérempli à l’arrivée, sauvegarde uniquement dans la Composition ; fermeture vers le point de départ sans mutation. Menu à trois options, œil et CE-CIR-03 retirés ; photo de l’Exercice ouvrant une fiche en lecture seule avec « Dans cette séance ». Superset alterné trois tours ; EMOM prescrit par série ; Death by en Durée avec avertissement au seul premier rang impossible et arrêt avant un rang incompatible. Règles complètes dans la référence Formats actualisée, §§7/7.6/7.7/9.4/10/12.

C.1 : Nom du Circuit, Modèle d’origine distinct du Format d’origine, Rôle explicite du membre, conservation de charge inactive. C.2/C.3 : écrans actuels, clavier et charges, formulaires complets/cohérents. C.4 : regroupement multi-exercices, zones et garde-fous, actions Circuit, réédition en place. C.5/C.6 : départs rapides et édition/duplication selon cette même base. D.1 : développement selon le bon porteur et les Rôles, plusieurs buy-in/out, membres en Durée et incréments. D.2 : instantané des données effectives et provenance, historique immuable. D.3/D.4 : capacités et validations alignées, contrôle EMOM bilatéral. D.5 : correspondances aux capacités réellement livrées, sans déclarer le moteur spécialisé développé. Exécution spécialisée PRE-10/11 ; ne pas la développer par fragments sous couvert des seuls écrans. B.4c/B.7/B.8/B.9 sont développés et recettés selon Hermann ; reprendre au périmètre Formats après lecture intégrale des règles actuelles.

## Création et Formats — complément final du 5 novembre

**Création et Formats — décisions du 5 novembre 2026.** Modale de création commune au Catalogue et à la Composition, nouveau brouillon prérempli à l’arrivée, sauvegarde uniquement dans la Composition ; fermeture vers le point de départ sans mutation. Menu à trois options, œil et CE-CIR-03 retirés ; photo de l’Exercice ouvrant une fiche en lecture seule avec « Dans cette séance ». Superset alterné trois tours ; EMOM prescrit par série ; Death by en Durée avec avertissement au seul premier rang impossible et arrêt avant un rang incompatible. Règles complètes dans la référence Formats actualisée, §§7/7.6/7.7/9.4/10/12.

**EMOM — tableau et validation du 5 novembre.** Tableau Unité | S1…Sn, quatre colonnes visibles au plus, nom et unité fixes ; chaque série porte sa cible et sa charge. Pas de champ d’incrément d’objectif ni de charge. Création : valeurs de S1 reprises initialement ; nouvelles séries ajoutées après coup à compléter selon les règles existantes ; réouverture sans réinitialisation. Pour chaque rang/fenêtre, travail connu en Durée incluant deux côtés et pause entre côtés applicable ; somme des membres dans un intervalle commun, intervalle local sinon. Atteinte ou dépassement de l’intervalle bloque la validation (message et cadres rouges), y compris après modification en Composition ; aucune durée inventée pour les membres en Répétitions.

**Death by — cible du 5 novembre.** Répétitions ou Durée, Objectif de départ et Incrément ≥ +1 dans l’unité. Seul un premier rang dont le travail connu atteint ou dépasse l’intervalle déclenche un avertissement non bloquant ; sauvegarde autorisée si les autres champs sont valides. À l’exécution, ne pas lancer un rang dont ce travail atteint ou dépasse la fenêtre : arrêt après le précédent, résultat « limite de l’intervalle atteinte », aucun échec ni tentative fictifs. En Durée : deux côtés et pause applicable, somme des membres en fenêtre commune ou intervalle du membre en alternance. Rangs acquis et rang courant distincts ; durée partielle renseignée seulement pour une fenêtre réellement tentée et non tenue. Les autres règles de fin et d’achèvement Death by restent applicables ; aucune fenêtre prolongée. Exemple 10 s puis +10 s / 60 s : cinq rangs réussis, arrêt avant le rang 6. La progression future compatible au départ ne déclenche pas d’avertissement.

**Superset — cible du 5 novembre.** Exactement deux mouvements à la création, trois tours alternés par défaut, Circuit standard ; chaque membre porte N séries, séquence A1/B1 puis A2/B2, sans rejouer N séries à chaque tour. Réouverture avec les membres actuels, y compris un troisième ; au moins deux, Ajouter désactivé, validation soumise à complétude/cohérence. Tableau Unité | Tour 1…n ; Récupération après le tour lit/écrit le dernier Exercice actuel, sans transfert depuis l’ancien dernier et sans effacer les récupérations intermédiaires ; valeur absente à renseigner, zéro explicite conservé.

**Charge des modèles — cible du 5 novembre.** Les dix questionnaires proposent Avec charge, Sans par défaut. L’activation globale rend les commandes locales disponibles sans charger tous les mouvements ; (+ kg)/(− kg) pilote chaque Exercice. Charges facultatives : Progression/For time/Superset/EMOM par série ou tour ; autres modèles fixes par mouvement. Affichage entre parenthèses et unité kg. Masquer puis réactiver retrouve états et valeurs dans le même brouillon avant sauvegarde ; vider efface réellement. Une réouverture lit l’état enregistré, sans nouvelle obligation de mémorisation de réponses historiques. Aucun incrément de charge EMOM ; seules les charges effectives par série font référence.

[Source finale validée](../../../docs/sources/formats-2026-11-05/KODJO-Complement-Parcours-creation-2026-11-05.md). Aucun code ni moteur développé dans cette mise à jour documentaire.
