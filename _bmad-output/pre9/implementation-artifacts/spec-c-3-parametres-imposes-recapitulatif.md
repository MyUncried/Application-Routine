# C.3 — Paramètres imposés et récapitulatif

Story PRE-9, epic C. Plan : `../planning-artifacts/epics.md` § C.3 (ARB-03, ARB-18, ARB-22a, ARB-25, ARB-04 valeurs initiales validées). Branche `pre9-bmad/dev`. Figma en lecture seule : `8624:30306` (Tabata), `8624:30392` (EMOM), `8656:35062` (Progression). Aucune migration.

## Sources appliquées

| Source | Passage | Effet |
|---|---|---|
| ch07 l.1414 « Défauts validés » | « Tabata 8×20 s/10 s imposés ; 30/30 6 séries, cadence 30/30 imposée ; EMOM fenêtre 60 s/N 6 ; AMRAP durée 12:00 **réglable** ; For time 21·15·9 ; Death by départ1/incrément1/fenêtre1 min. **Départs rapides** sans Mouvement présélectionné : Renforcement 3×15, Progression 10/12/14, À l'échec 3 séries, Superset Circuit groupé 1 passage/deux emplacements vides, Libre Séance vide ; Gainage · Mobilité supprimé. Aucune autre valeur de maquette n'est un défaut. » | `sessionModels.ts` : seules ces valeurs. |
| Consolidation 30/10, D-02 | « le Format et ses réglages appartiennent à l'Exercice, **jamais au Circuit** » | Chaque Exercice reçoit `format` ; aucun Format sur un Circuit. |
| D-13 | « Pour Tabata, EMOM, Progression : proposer l'organisation à l'ajout du second Exercice ; pas de sélecteur d'organisation pour For time. » | Segment « À la suite / En alternance » seulement pour ces trois modèles, à partir de deux Exercices. |
| D-16, FMT-13 | Tabata alterné admis si N = 8 ; EMOM alterné, N adapté. | « En alternance » : Circuit alterné de compte égal aux séries des membres (Tabata 8, EMOM N, Progression 3). |
| D-22 / D-23 | « aucun Mouvement présélectionné […] Les modèles réutilisent le parcours Catalogue de choix des Mouvements. » | Format / départ rapide → sélection des Mouvements (écran existant) → paramètres. |
| CE-FMT-02 §5, §8, §12, §14, §16 | Paramètres par Exercice formaté ; Tabata séries 8 ; EMOM durée calculée N×E×W ; For time sans segment ; « Changer un réglage recalcule synthèse et durée. Segment change ordre, pas volume. » ; aucune borne nouvelle ; retour conserve les réglages. | Constantes grisées avec leur raison ; réglages par pas ; durée totale recalculée (autorité de B.7) ; minimum structurel du registre seulement. |
| ARB-18b | For time : zéro admis dans une position si le volume total n'est pas nul. | `withModelSetting` refuse un volume total nul. |
| ARB-15, B.9 | Nom initial suggéré = nom du Format, modifiable. | Champ de nom en tête, prérempli du nom du Format (Format seulement), resté suggéré s'il n'est pas modifié. |

## Réalisé

- **Domaine** `src/domain/sessions/sessionModels.ts` : paramètres par modèle (verrouillé / réglable), valeurs initiales, `withModelSetting`, `modelFormat`, `modelExecutionParameters` (Tabata 8×20/10, 30/30 N×30/30, EMOM N séries, Renforcement N×R répétitions, Progression échelle de répétitions, À l'échec N séries à l'échec ; AMRAP, For time, Death by et Superset gardent les paramètres du Mouvement, leur bloc étant décrit par le Format, D.1), `modelArrangement`, `modelDraftPatch` (modèle à Circuit unique : Exercices enchaînés ou membres du Circuit).
- **Écran** `FormatParametersScreen.tsx`, route `(creation)/format-parameters` : « Composer une séance {modèle} », nom, Mouvements choisis, Paramètres d'exécution, Durée totale (`formatSessionDurationEstimate`, annoncée poliment), Exécution, « Enregistrer dans la séance » → brouillon prérempli (C.4, première puce) et Composition.
- `MovementSelectionScreen` : `then=format-parameters` enchaîne sur les paramètres ; le retour revient au choix des Mouvements.
- `SessionDraftProvider.suggestDraftName` : nom proposé qui reste suggéré (B.9).

## À CLARIFIER (non bloquant)

1. **Superset — « deux emplacements d'Exercices vides »** (D-24) contre COMP §1 « Un conteneur naît autour de membres existants, jamais vide ». Réalisé sans emplacement vide : le Circuit groupé d'un passage est formé des Mouvements choisis dans le Catalogue (D-22/D-23). Un emplacement vide demanderait un nouvel objet de modèle.
2. **« Récupération entre les mouvements »** (Tabata, `8624:30306`, 1 min) : valeur de maquette, absente des défauts validés — non rendue. La Récupération de l'Exercice (défaut du Profil) s'applique.
3. **« Déroulé »** (graphique des maquettes) : non exigé par CE-FMT-02 §8 ; non rendu.
4. **Libellé EMOM** : la maquette montre « Dans chaque intervalle » ; le segment commun « À la suite / En alternance » est retenu (CE-FMT-02 §12).
5. **Saisie des réglages** : pas de 1 (5 s pour les fenêtres, 1 min pour l'AMRAP) par boutons − / +, élément ajustable VoiceOver ; la valeur Figma en pastille ne précise pas l'éditeur.

## Synchronisation documentaire

Classe **A** (règles écrites ci-dessus) ; points 1 à 5 consignés ici, sans règle créée.

## Tests

`src/domain/sessions/__tests__/sessionModels.c3.test.ts` (valeurs initiales, constantes, EMOM N × W, For time ARB-18b, départs rapides sans Format, organisation, Superset, brouillon).

## Reprise du 02/11/2026 — questionnaires et récapitulatifs (remplace ce qui précède)

[Le contenu ci-dessus (écran unique de paramètres, constantes Tabata/30/30 grisées, À CLARIFIER 1 à 5) est **remplacé** par la référence Formats du 02/11/2026 §7, §9 à §12, §15 et CE-FMT-02. Les points 1 (Superset sans emplacement vide : A4), 2 (Récupération entre les mouvements : §9, §10, §12), 3 (Déroulé : §15) et 4 (libellé EMOM : « Dans chaque intervalle ») sont tranchés ; le point 5 (saisie) suit CE-FMT-02.]

- **Domaine** `formatModels.ts` : réponses du questionnaire (valeurs initiales décidées seulement ; pause et récupération non décidées = Profil, §14.3), options d'Exécution (Tabata/30/30/Renforcement/Progression/À l'échec : À la suite | En alternance ; EMOM : Dans chaque intervalle | À la suite | En alternance ; Death by : À la suite | En alternance | Dans chaque intervalle ; aucune pour AMRAP, For time, Superset), valeurs par mouvement, adaptation à N (A6, §9.3 : lignes « à compléter », surplus retiré), structure produite (§1 : Exercices standards, Exercices formatés autonomes, Circuit standard, Circuit porteur), ajout au brouillon (`appendModelToDraft`). `formatTimeline.ts` : Déroulé calculé (§15).
- **Écran** `FormatModelScreen` (routes `format-questionnaire`, `format-summary`) : croix au questionnaire, Retour au récapitulatif (réponses conservées par `FormatModelDraftProvider`, titre inchangé) ; zone de contexte (couleur, motif agrandi, nom, accroche) ; « + Ajouter » → champ de saisie et « Ouvrir le catalogue » (le Catalogue reprend le texte saisi) ; suggestions en cartes « Mouvement sélectionné » ; choix → récapitulatif ; cartes à suppression glissée (dernier mouvement de boucle bloqué) ; tableaux AMRAP (Rép. | Par tour | Max), For time (tours), Progression (séries, répétitions et charge locales, clavier numérique/décimal, Suivant) ; Déroulé à 25 px du bouton ; « Enregistrer dans la séance » → brouillon, retour à la Composition, nom du modèle suggéré (B.9).
- Modale « Mouvement du buy-in » (sélection unique) ; « Changer » remplace le buy-in.

Écarts restants (C.3) : réordonnancement par appui long non réalisé (actions VoiceOver Monter / Descendre seulement) ; police d'accroche « Mali » non embarquée (Inter italique) ; « Charge Avec/Sans » se règle dans la modale du mouvement de la Composition, pas encore depuis le récapitulatif ; nombre de séries variables For time / Progression édité par cellule, sans roulette.

Synchronisation : classe **A**. Tests : `formatModels.c3` (20), `FormatModelScreen.c3` (3).

## Recette iPhone n° 3 du 02/11/2026 — corrections (f3-fenetre, f3-questionnaire, f3-tabata, f3-emom)

Retours de Hermann (cahier de recette, section f3), traités avant la suite de la recette :

| Retour | Classe | Correction |
|---|---|---|
| f3-fenetre : « Le bouton Annuler n'est pas au format standard de ce bouton, il existe un composant » | A (D-142) | Fenêtre Formats : action Fermer standard (`CloseCircleAction`, `ScreenShell.tsx`, même cercle 38 / icône 24 / cible 48 que le ✕ de `FixedHeader`). |
| f3-questionnaire : « ajouter un deuxième format ouvre le questionnaire déjà validé avec ses mouvements et ses paramètres au lieu d'ouvrir un questionnaire vierge » ; sélection et appui long confondant les exercices identiques ; déplacements impossibles | A (CE-FMT-02 : questionnaire neuf) — anomalie | Brouillon de modèle neuf à chaque ouverture (`opening`) ; `appendModelToDraft` remplace toute identité d'Exercice déjà présente. Cause des sélections multiples, de l'appui long qui supprimait les autres exercices, des déplacements sans dépose et de l'erreur « Encountered two children with the same key » : deux Exercices de même identité. Une Composition déjà enregistrée avec ces doublons reste à recréer. |
| « Le titre de la modale doit être "Configurer un X" et non plus "Composer une séance X" » | B | `formatModel.titles` : « Configurer un Tabata », … ; « Configurer une Progression » (accord), « Configurer un À l’échec ». [C.3 : « Composer une séance {modèle}» — remplacé.] |
| « L'appui long sur la carte du mouvement devrait permettre de déplacer la carte » | A (§7.4 « Réordonnancement par appui long ») | Appui long : carte soulevée qui suit le doigt, cartes franchies décalées, dépose à la place atteinte ; buy-in fixe en tête ; Monter / Descendre VoiceOver conservés. |
| « Le format de la fenêtre du popover de l'Exécution est différent de celui utilisé jusqu'à présent » | A (P-4, procédé de `CircuitNatureMenu`) | `Menu` SwiftUI natif (`@expo/ui`), option courante cochée. [C.3 : `ActionSheetIOS` — remplacé.] |
| « Le résultat de la recherche défile avec tout l'écran. L'écran doit rester fixe et le résultat défiler dans son cadre » | B | Suggestions dans un cadre défilant (hauteur bornée) ; l'écran ne défile pas tant que des suggestions sont affichées. |
| Premier mouvement choisi : « fait glisser tout l'écran à gauche […] C'est ce dernier comportement qu'il faut aussi pour le premier » | B | Route `format-summary` sans transition (aller et Retour). |
| « Ouvrir le catalogue : un écran apparaît par la droite, c'est perturbant et il faut donner l'impression qu'on ne change pas d'écran » | B | `movement-selection` ouvert en fondu depuis un questionnaire (inchangé depuis la Composition). |
| « Il n'est pas possible de supprimer le dernier mouvement. Il faut pouvoir le faire, mais […] "Enregistrer dans la séance" doit être grisé » | B | Suppression toujours permise ; enregistrement indisponible sans mouvement de boucle. Référence Formats §7.4 annotée. |
| f3-tabata : « Durée totale 8 min 45 (arrondi au 15 min près) » | A (§9.1, FMT-12 : 8 min 50 s) | Durée totale et repère du Déroulé exacts au questionnaire (`formatPhraseDuration`), « ≥ » pour une borne ; l'arrondi au quart de minute reste celui de la Composition. |
| f3-emom : « Illustration du déroulé "Dans chaque intervalle" incorrect (un seul cadre pour deux mouvements) » | A (Figma `8624:30392`, §15) | Un cadre par intervalle, mouvements accolés (EMOM et Death by « dans chaque intervalle »). |

À CLARIFIER (non appliqué) :

1. « Tabata deux mouvements alternés — Le nom Circuit doit être remplacé par Tabata » : contraire à la décision du 02/11 (`KODJO-Modifications-Figma-2026-11-02`, `11294:19682` : « L'en-tête du circuit devient « Circuit · 8 tours · alternées » (au lieu de « Tabata »). C'est un circuit standard, sans Format d'origine »). Un Circuit standard ne porte ni nom ni origine persistés : afficher « Tabata » demande une donnée nouvelle (migration) et une règle de vie de ce nom (changement de nature, ajout d'un membre).
2. « Il manque l'option de la récupération entre les mouvements » (même contexte, alternance) : la référence §9.1 et la maquette `11146:18902` n'ont pas cette ligne en alternance (Récupération 0 s) ; elle existe en « À la suite ». Sens attendu en alternance à préciser (après chaque mouvement, après chaque tour, après le Circuit).

Tests : `FormatModelScreen.c3` (+4 : 8 min 50 s, cadres EMOM, suppression du dernier mouvement, questionnaire vierge sans identité partagée), `formatModels.c3` (+1 : identités remplacées).

## Recette iPhone n° 3 du 03/11/2026 — archivage d'un Mouvement utilisé seulement dans des Séances archivées

Demande de Hermann du 03/11/2026, avant la contre-recette : « on doit pouvoir archiver un mouvement qui n’est utilisé que dans des séances archivées. Aujourd’hui c’est bloqué, on ne peut archiver un mouvement si il est utilisé dans une séance, quelque soit son statut d’activité. »

| Comportement | Classe | Traitement |
|---|---|---|
| Garde d'archivage : seuls les Exercices des Séances actives bloquent ; le dialogue « Archivage impossible » compte ces seuls Exercices | B | `SqliteMovementRepository.archive` (`countMovementActiveOccurrences`) ; registre ch. 07, règle « Archivage » du 27/10 annotée comme remplacée, nouvelle section du 03/11/2026 |
| Définitions de l'ancien Catalogue des Exercices (non affiché, conversion A.4) : ne bloquent plus. Recette : le dialogue comptait ces définitions (« utilisé par N exercices » sans Séance active) ; question à Hermann, réponse « Ne bloquent plus » | B | Même garde ; registre ch. 07 (section du 03/11/2026) ; `epics.md` A.4 annoté (Mouvements archivés) |
| Suppression définitive depuis les Archives | — | Inchangée (Q8) : refusée tant qu'une Séance, même archivée, ou une définition référence le Mouvement |
| Restauration d'une Séance archivée dont un Mouvement est archivé | A | Aucun contrôle ajouté : RM-120 (l'élément archivé reste valable dans ses usages existants) et Q6 (il n'est plus proposé à un nouvel usage) s'appliquent |

Tests : `movementLifecycle.b8.test.ts` (refus compté sur les seules Séances actives ; archivage accepté quand toutes les Séances sont archivées ou quand seule une définition référence le Mouvement ; suppression définitive refusée). Aucune migration.

## Recette iPhone n° 3 du 03/11/2026 — autres constats (enregistrement, AMRAP)

Constats de Hermann (cahier de recette, « Autres constats »), à corriger avant la suite des tests :

> Séance avec deux exercices Tabata : Ajout d'un tabata mode alterné avec deux exercices : Enregistrer > Cela ouvre un écran de composition de séance vierge > Fermeture de l'écran > La séance inchangée est toujours au catalogue.
> AMRAP : La sélection d'un mouvement fait directement passer à l'écran suivant du questionnaire (il faut rester sur l'écran et que le bouton d'action soit "Valider ces paramètres". Appuyer sur retour faire revenir au premier écran sans possibilité d'avancer de nouveau sur le deuxième écran. Appuyer sur "Enregistrer dans la séance" amène à l'écran de conception de séance vierge.

| Constat | Classe | Correction |
|---|---|---|
| « Enregistrer dans la séance » ouvre une Composition vierge (Séance ouverte depuis le Catalogue) | A (référence Formats §7.1 : l'enregistrement ajoute au brouillon de Composition) | Cause : `router.dismissTo("/composition")` remplace les paramètres de la route ; la Composition perdait `sessionId` et réinitialisait le brouillon. Retour par dépilement jusqu'à la Composition (`router.dismiss(n)`, paramètres intacts) |
| AMRAP : rester sur le questionnaire après le choix d'un mouvement ; bouton « Valider ces paramètres » | B | Questionnaire AMRAP : aucun passage automatique au récapitulatif ; bouton « Valider ces paramètres » (indisponible sans mouvement de boucle) ouvre le récapitulatif. Référence Formats §7.1 (Bouton) annotée |
| AMRAP : Retour sans possibilité d'avancer | B | Résolu par « Valider ces paramètres » |

À CLARIFIER 3 : le même comportement (« Valider ces paramètres ») vaut-il pour les autres modèles à récapitulatif enrichi (For time, Progression : tableaux), ou pour tous ? Appliqué à l'AMRAP seul, comme demandé. [Résolu le 03/11/2026, Hermann : « Il faut être homogène entre tous les écrans similaires, "Valider ces paramètres" pour passer du questionnaire initial au récapitulatif avec les données à compléter, "Enregistrer dans la séance" lorsque le prochain écran est la séance. » (classe B) — « Valider ces paramètres » : AMRAP, For time, Progression ; « Enregistrer dans la séance » dès le questionnaire : Tabata, 30/30, EMOM, Death by, Renforcement, Superset, À l'échec ; aucun passage automatique au récapitulatif. Référence Formats annotée (fenêtre Formats, §7.1).]

Tests : `FormatModelScreen.c3.test.tsx` (dépilement vers la Composition d'une Séance existante ; AMRAP : choix sur place, « Valider ces paramètres »).

## Recette iPhone n° 3 du 03/11/2026 — familles : seul membre actif après archivage

Signalé par Hermann comme « le dernier mouvement du catalogue ne peut pas intégrer ou créer une famille ». Précisions : « Je peux avec appuie long déplacer la dernière carte du catalogue, mais les autres cartes ne se déplacent pas et il n'y a pas de filet. Relâcher la carte où que ce soit la ramène à sa position. Déplacer une autre carte vers celle-ci fait apparaître le filet, une famille se crée au relâchement. » Cause : ce mouvement était le seul actif d'une famille dont l'autre membre avait été archivé pendant le nettoyage ; C6 et D4 le traitaient comme membre (non libre). Sa place en fin de liste était fortuite.

| Comportement | Classe | Traitement |
|---|---|---|
| Seul actif d'un groupe : libre pour le geste ; posé ailleurs, il quitte son groupe (laissé aux archivés ; un archivé seul n'a plus de groupe) | B (réponse de Hermann « Il quitte l'ancienne ») | `SqliteMovementRepository.placeInFamily` (membres actifs, `leftBehind`), `MovementCatalogueList` (`groupSizes` sur les actifs) ; registre ch. 07 ; règles Familles D4 annotées (deux copies) |

Tests : `movementFamilies.fam.test.ts` (création et entrée depuis un seul actif, archivés conservés, Annuler) ; `MovementCatalogueList.fam.test.tsx` (filet et création au geste).

## Recette iPhone n° 3 du 03/11/2026 — autres constats (deuxième lot)

Hermann : « tous ce qui est dans "Autres constats" doit être corrigé » ; inclut les notes KO f3r-deplacer, f3r-recherche et f3-depart. Décisions recopiées au registre ch. 07 (« Recette iPhone n° 3 — autres constats du 03/11/2026 »). À CLARIFIER 1 de la recette n° 3 (nom « Tabata ») : résolu (B).

| Comportement | Classe | Traitement |
|---|---|---|
| Nom du modèle d'origine à la place de « Circuit » (Composition, Catalogue), compteur décalé à droite | B | migration 020 `tours.origin_model` ; `structure.ts`, `formatModels.ts`, `SqliteSessionRepository`, `sessionSnapshot`, `SessionDraft`, `CircuitHeader`, `carrierPresentation`, `sessionCatalogueProjection`, `SessionCompositionTree`, `fr.ts` ; référence Formats (Tabata en alternance), relevé Figma du 02/11 annoté ; sprint-status et epics (A.4 → 021, A.5 → 022) |
| « groupées » aligné sur la ligne (Circuit porteur) | A/D | `CircuitHeader` (même boîte que l'adjectif du menu) |
| Circuit replié teinté à compléter / à vérifier | B | `collapsedCircuitTone` (`compositionPresentation.ts`), `CompositionScreen` |
| Appui long sur toute la surface du Circuit | B | `LayoutDragParts` (`onSurfaceLongPress`), `CompositionScreen` |
| Buy-in / buy-out fixés dans le Circuit porteur (sortie permise) | A (référence Formats §6 point 4) | `layoutMoves.ts` (`PASSAGE_FIXED`), `layoutDrop.ts`, `fr.ts` (texte de refus à valider) |
| AMRAP : sections Buy-in / En boucle dès le questionnaire, buy-in explicite requis | B | `ModelMovement.buyIn`, `hasChosenBuyIn` (`formatModels.ts`, `formatTimeline.ts`), `FormatModelScreen` |
| Barre Précédent / Suivant / Fermer des tableaux AMRAP, For time, Progression ; cellule révélée au-dessus du clavier | B | `FormatModelScreen` (`KeyboardAccessoryBar`) |
| Même champ de saisie au récapitulatif (« + Ajouter », « Changer ») ; clavier maintenu ; suggestions jusqu'au clavier | B | `FormatModelScreen` |
| Fiche du mouvement en modale, lecture seule | B | route `movement-sheet`, `MovementSheet readOnly` |
| Pause du Renforcement | B | `FormatModelScreen` (valeur héritée de la pause des Exercices) |
| Catalogue des séances : chevron pour toute séance ; photo / zone déployée → modification, reste → déploiement | B | `SessionCard`, `SessionCatalogueList` ; spécification carte/catalogue §1 et ch. 06, 08, 10, 13 annotés ; champ `expandable` de la projection devenu sans lecteur (annoté) |

Interprétations techniques à confirmer sur iPhone : VoiceOver de la carte de séance (activer = déployer, « Modifier la séance » en action nommée) ; lettre conservée après le nom (« Tabata B ») ; nom conservé après changement de nature ; carte du buy-in encore saisissable pour sortir du Circuit (référence §6 point 4). Question f3-depart sur la durée du Renforcement : réponse donnée en conversation (pas de changement de calcul).

## Contre-recette n° 3 bis du 03/11/2026 — corrections (f3s-nom, f3s-clavier, f3s-recherche, f3s-fiche, f3s-pause, f3-depart)

Hermann : « je propose de corriger ces constats avant que je ne continue ». Commit de départ 89f9c026. Décisions recopiées au registre ch. 07 (« Contre-recette n° 3 bis — 03/11/2026 »).

| Comportement | Classe | Traitement |
|---|---|---|
| En-tête d'un Circuit sans lettre (le Cycle garde la sienne) | B | `CircuitHeader` (prop `letter` retirée), `CompositionScreen` ; référence de composition du 28/10, ch. 13, ARB-13 annotés |
| Compteur à position identique (Circuit et Cycle), nom tronqué ; colonnes durée / compteur réservées depuis le bord droit, largeurs mesurées une fois par taille de texte | B (interprétation de la place « minimum » à confirmer) | `useContainerColumns` (`CircuitHeader`), `CycleHeader` ; référence Formats §9, référence de composition, ch. 13 annotés |
| « alternée » et durée mal alignées (Renforcement en alternance) | C → traité par la disposition ci-dessus, cause non reproduite hors appareil | à vérifier sur iPhone |
| Clavier des tableaux sans touche « Next » | B | `NumberCell` (`FormatModelScreen`) ; référence Formats §7.4, §9.3 |
| Saisie d'un mouvement : toucher ailleurs, Entrée, défilement ne ferment pas le clavier | B (précision de §7.1) | `FormatModelScreen` (`keyboardShouldPersistTaps` « always » pendant la saisie) ; référence Formats §7.1 |
| Fiche du mouvement : feuille ajustée à son contenu, plafonnée sous le titre de l'écran ; titre sans marge de zone sûre ; sans bouton Terminer | B | route `movement-sheet` (`formSheet`, hauteur mesurée), `MovementSheet` (`onBodyMeasure`), `ActivityEditorForm` (`hideFinish`, `onBodyMeasure`), `FixedHeader.topInset`, `EditorHeader` |
| À l'échec : sans Durée totale | B | `FormatModelScreen` ; référence Formats §9.2 |
| Progression : Pause affichée, Durée totale au récapitulatif seulement, Exécution en dernier ; tableau à noms fixes et séries défilantes | B | `FormatModelScreen` (`ProgressionTable`) ; référence Formats §9.3 |

Interprétations à confirmer sur iPhone : place réservée à la durée (« ≈ 88 min 45 s ») et au compteur (« 99 tours · alternées ») ; compteur Death by « jusqu'à l'échec · alternées » plus large que la réserve (il prend sa place sur le nom) ; hauteur de la feuille plafonnée au bas du titre de l'écran (fraction calculée depuis la zone sûre initiale).

Tests : `FormatModelScreen.c3.test.tsx` (saisie, clavier, À l'échec, Progression), `recette3.circuits.test.tsx` (nom sans lettre, colonnes mesurées), `ActivityEditorForm.test.tsx` (fiche sans Terminer, mesures du corps), tests B.1b, B.2, B.4b (titres sans lettre). Jest ne prouve ni le rendu ni le geste sur iPhone.
