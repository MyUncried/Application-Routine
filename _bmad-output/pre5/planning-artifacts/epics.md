---
status: final
stepsCompleted: ['step-01-validate-prerequisites','step-02-design-epics','step-03-create-stories','step-04-final-validation']
inputDocuments:
  - '_bmad-output/pre5/planning-artifacts/prds/prd-kodjo-pre5-2026-10-19/prd.md'
  - '_bmad-output/pre5/planning-artifacts/prds/prd-kodjo-pre5-2026-10-19/addendum.md'
  - '_bmad-output/pre5/planning-artifacts/architecture/architecture-kodjo-pre5-2026-10-19/ARCHITECTURE-SPINE.md'
  - '_bmad-output/pre5/table-delta.md'
  - '_bmad-output/pre5/propagation-borne-1s.md'
---

# KODJO PRE-5 — Découpage en epics et stories

## Vue d'ensemble

Ce document découpe en epics et stories le delta PRE-5 (« Éditeur d'Exercice et Feuille des paramètres ») : les 45 FR et 10 NFR du PRD PRE-5, les décisions AD-18 à AD-33 du spine d'architecture PRE-5 (AD-1 à AD-17 hérités de PRE-4), les décisions de Hermann consignées dans `table-delta.md` §6 (dont « Points signalés par le PRD ») et la propagation de D-430 (`propagation-borne-1s.md`).

Il n'existe pas de document UX séparé : le PRD et Figma font foi. Les propriétés Figma (S-2) sont relevées en lecture seule dans la story qui les utilise ; elles figurent ci-dessous comme exigences de conception UX (UX-DR) pour être rattachées à une story.

**Mode d'exécution du skill.** Le skill `bmad-create-epics-and-stories` a été exécuté en mode autonome : personne ne répondait aux menus, l'option « Continue » a été retenue à chaque étape et les décisions documentées ont été appliquées. Ce n'est pas une validation de Hermann. Quatre questions restent soumises à Hermann (QN-1 à QN-4) ; les critères qui en dépendent portent le défaut recommandé, marqué `[EN ATTENTE QN-x]`.

**Abréviations.** `EP` = `src/domain/activities/ExecutionParameters.ts` ; `Draft` = `src/domain/activities/ExecutionParametersDraft.ts` ; `Sheet` = `src/features/activities/ExecutionParametersSheet.tsx` ; `Form` = `src/features/activities/ActivityEditorForm.tsx`. Δnn = ligne de `table-delta.md` ; R-nn = remplacement accepté (PRD §7) ; « §9-n » = point signalé du PRD tranché le 19/10 (`table-delta.md` §6).

## Inventaire des exigences

### Exigences fonctionnelles

Extraites du PRD §4 (numérotation stable du PRD). Le détail fait foi dans le PRD ; les critères des stories le reprennent sans le reformuler à la baisse.

**Phases de l'exercice (§4.1)**

- FR-1 : Un Exercice porte de 0 à 6 phases ordonnées, communes à toutes les séries ; chaque phase a une identité stable, un libellé de 1 à 20 caractères après normalisation, une durée entière ≥ 1 s. « Aucune » = 0 phase ; une seule phase est admise ; une phase validée ne vaut jamais 0 s (le zéro n'existe que dans le brouillon) ; les données sans phases restent lisibles et se lisent sans phases. (Δ08)
- FR-2 : Phases disponibles seulement en Mode Durée, Condition À la cible, séries identiques. Avec des phases, Répétitions, À l'échec et Variables sont indisponibles (valeur réelle, état indisponible, RM-247) ; en Variables, à l'échec ou en Répétitions, la création de phases est indisponible ; aucune conversion destructive automatique ; mémoire des cibles par Mode conservée. (Δ13)
- FR-3 : Avec des phases, D = Σ durées, en lecture seule, sans arrondi ; T = N × (D + P) (6 + 3 s, 3 séries, pause 15 s → 72 s) ; l'inversion n'ajuste que N ; somme comprise entre 1 et 3 535 s **après** la normalisation de FR-9 (des phases à 0 s ne bloquent jamais ✓ ; une somme normalisée > 3 535 s rend ✓ indisponible) ; natures, symbole et `—` inchangés. (Δ09, Δ40, Δ50)
- FR-4 : Ligne « Phases de l'exercice » (Avec / Sans) en tête du cadre Séries, chevron intérieur à Avec ; sous Avec, tableau Libellé / Durée au patron du tableau des séries (déplacement, numéro, suppression avec annulation, ligne active), sans pied ni ± ; gestes et alternatives accessibles réutilisés (CE-UI-10 §13) ; le libellé suit sa phase lors d'un déplacement. (Δ10)
- FR-5 : Passer à Avec sans phase crée « Phase 1 » avec la durée de série courante ; si la durée vaut « — », « Phase 1 » est créée à renseigner (fond rouge pâle), aucune durée inventée, puis FR-9 s'applique ; une phase ajoutée reprend la durée de la dernière ; au-delà de six, ajout indisponible ; contrôle d'ajout : `9207:18817` une fois relevé (S-2), à défaut ligne d'ajout en fin de tableau, indisponible à six. (Δ10, QP5-04 (b))
- FR-6 : Libellé saisi au clavier texte, directement dans la cellule, 20 caractères au plus ; le clavier ne masque ni le champ ni les actions de la Feuille. (Δ11)
- FR-7 : Durée de phase réglée par la roue native existante (`DurationWheelPicker` dans `AnchoredPanel`) : minimum 1 s, pas 1 s, sans option « À l'échec », sans borne propre hors celle de la somme. (Δ12, QP5-03)
- FR-8 : Supprimer une phase retire sa contribution à D ; supprimer la dernière ramène « Aucune », sa durée devient la durée de série modifiable (D-371) ; l'annulation restitue ordre, libellés, durées et D ; Avec → Sans avec plusieurs phases : phases retirées, somme = durée unique de la série (6 + 3 + 5 → 14 s), modifiable, autres paramètres conservés ; aucune durée valide déductible → rien d'inventé ; repasser à Avec crée une seule phase à la durée courante, sans mémoire des anciennes ; ✕ restaure la configuration précédente, phases comprises. (Δ14)
- FR-9 : Au ✓ : phases à 0 s retirées sans message ni blocage ; libellé vide → « Phase n » selon la position finale ; liste vide ou entièrement nulle → « Aucune » ; cible absente ou invalide → validation existante ; ✕ restaure l'état antérieur. (Δ14, D-373)

**Charge (§4.2)** — règles identiques en Mode Durée et en Mode Répétitions, y compris À l'échec (Δ48).

- FR-10 : Charge en kg, activation (Avec / Sans) distincte des valeurs ; commune en identiques, par ligne en variables ; valeurs conservées sous Sans, y compris après enregistrement et réouverture ; absence lue Sans, jamais 0 kg ; décimale au pas de 0,25, sans plafond ; aucune valeur par côté ; sans effet sur cibles, durées, cadence, pauses, Condition d'arrêt et calculs. (Δ16, Δ48)
- FR-11 : La charge suit la série dans toutes les opérations du Brouillon (copie uniforme → variable, ajout, retrait et annulation, déplacement, passage identiques / variables), comme les autres valeurs de la série ; Q29 et réserves conservés ; D-249 ne s'applique pas à la charge ; aucune propagation automatique ; règle commune des champs de série pour une cellule vide (CH-04). (Δ17)
- FR-12 : Identiques : ligne Charge (Avec / Sans, Sans par défaut) après la Pause dans le cadre Séries ; Avec ouvre directement la saisie ; la valeur saisie remplace Avec (« 20 kg ») et reste éditable ; ligne disponible quand À l'échec masque Durée ou Répétitions. (Δ18, Δ48)
- FR-13 : Variables : ligne Charge (Avec / Sans) sous le tableau ; Avec affiche une colonne Charge au titre non interactif ; Sans masque la colonne et conserve les valeurs ; la charge suit sa série au déplacement. (Δ19)
- FR-14 : Saisie au clavier décimal, sans fenêtre ; arrondi au 0,25 supérieur à la sortie du champ ou à la validation, jamais pendant la frappe (1,3 → 1,5 ; 0,01 → 0,25 ; 1,25 → 1,25 ; 0 → 0) ; négatif non valide ; kg = affichage seulement ; zéro : en identiques désactive la charge, en variables vaut « sans charge » pour la série, toutes à zéro → Sans ; un zéro saisi n'est jamais remplacé par une ancienne charge ; 1re activation sans valeur → 0,25 kg et saisie ouverte ; réactivation restaure ; toutes nulles → 0,25 partout ; certaines nulles → restaurées telles quelles ; cas Δ48 exigés en tests et recette (Répétitions × Identiques, Répétitions × Variables, À l'échec avec charge). (Δ20, CH-05)

**Côtés (§4.3)**

- FR-15 : « Changement de côté » en segmenté en ligne, Avec à gauche, Sans à droite, sans direction ; Avec rend disponibles Enchainement et Pause entre les côtés, chevron intérieur à Avec ; Sans masque ces lignes et conserve leurs valeurs ; côté non renseigné → Sans au ✓ (D-406) ; copie de la Pause entre les côtés depuis le Profil (P3-10) et deux stratégies (RM-037) inchangées. (Δ21)
- FR-16 : `RIGHT_LEFT` et `LEFT_RIGHT` historiques se lisent Avec ; Enchainement enregistré conservé ; aucune réécriture des données ni des résultats historiques. (Δ22)
- FR-17 : Libellé « Enchainement » ; segmenté en ligne dans le cadre Côtés, largeur Figma ; libellés « Un côté après l'autre » et « Les deux côtés à chaque série », police réduite, centrés, sans troncature ; aucun sous-titre D/G ni notation C1S1 ; visible seulement si Avec et N > 1 (à N = 1 masquée, valeur conservée, NR Δ24) ; taille de police réglée sur appareil sans changement automatique de géométrie ; paramètre de l'Exercice, distinct des formats. (Δ23)
- FR-18 : Phrase en forme neutre « côté 1 puis le côté 2 » (ch. 10 l. 515) ; indicateur de côté de la Composition sans direction (seul son point de passage change, rendu Figma S-2) ; corpus étendu aux cas bilatéraux (S-3), grammaire et ponctuation conservées. (Δ43, Δ45)

**Condition d'arrêt (§4.4)** — ni troisième Mode, ni condition Mixte persistée.

- FR-19 : Identiques : ligne « Condition d'arrêt » dans le cadre Exécution, À l'échec à gauche, À la cible à droite, À la cible par défaut ; s'applique à toutes les séries selon le Mode ; retour à À la cible restaure la dernière valeur chiffrée connue pendant l'édition. (Δ25)
- FR-20 : Variables : résultat calculé non modifiable — toutes à cible → deux options, À la cible sélectionnée ; toutes à l'échec → deux options, À l'échec sélectionnée ; au moins une de chaque → une seule option « À la cible et à l'échec » ; mise à jour à chaque modification de cellule ; cellule vide comptée ni cible ni échec ; tableau incomplet ou vide → convention D-384 ; Variables → Identiques suit N1 existante ; aucune validation ajoutée ; sémantique accessible d'information non modifiable ; rendu Figma (S-2). (Δ26)
- FR-21 : Identiques à l'échec : ligne « Durée d'une série » masquée en Durée, « Répétitions » masquée en Répétitions ; valeurs restaurées au retour à À la cible. (Δ27, QP5-08)
- FR-22 : Identiques : roues « Durée d'une série » et « Répétitions » sans « À l'échec » ; roue d'une cellule variable garde l'option en tête (Q8), roue native et PickerToolbar conservées ; le choix ne s'applique qu'à la série éditée et met à jour FR-20 ; « À l'échec » n'est pas une durée nulle, zéro ne code jamais l'échec ; Pause et autres paramètres inchangés ; retour à une durée selon les conventions existantes. (Δ28)

**Champ de saisie clavier et navigation (§4.5)**

- FR-23 : La charge se saisit dans sa ligne (identiques) ou sa cellule (variables) ; la fenêtre « Charge — Série 1 » est supprimée. (Δ29)
- FR-24 : Champ clavier actif : champ visible ; tableau visible au-dessus du clavier avec la marge de `9292:18077` (12) ; clavier décimal fermé sans touche Retour (bouton « Fermer » à droite de la barre, §9-8 tranché) ; une seule surface ouverte ; absorption de ✓ et ✕ selon Q47. (Δ29)
- FR-25 : Précédent / Suivant de la barre du clavier numérique déplacent la saisie entre les cellules de charge ; clavier ouvert pendant la navigation ; valeur atteinte éditable ; fond de la cellule active qui suit le focus (indicateur d'état) ; état actif annoncé ; extrémités et cellules indisponibles selon les conventions de focus existantes, sans boucle ; les roues et steppers ne deviennent pas des champs clavier. (Δ49)

**Présentation de la Feuille (§4.6)**

- FR-26 : Quatre cadres gris arrondis espacés de 8 : Exécution (Mode, Condition d'arrêt) ; Séries (Phases et tableau, Nombre de séries, Type de série, Durée ou Répétitions et Pause ou tableau variable, Charge) ; Côtés (Changement de côté, Enchainement, Pause entre les côtés) ; Cadence et durée (Cadence, Durée de l'exercice, Compte à rebours, Fin d'exercice) ; libellés PR-01 ; contenu conditionnel dans son cadre ; panneaux ancrés à leur ligne d'origine ; couleur sans jeton = constante locale nommée ; briques `Row`, `ValuePill`, `Separator`, `SheetMotion`, animations Q39 à Q41 réutilisées. (Δ31)
- FR-27 : Mode, Condition d'arrêt, Phases, Type de série, Charge, Changement de côté, Enchainement et Cadence en segmentés en ligne (alignés à droite, sans enveloppe blanche, sans popover ni panneau) ; `SegmentedControl` existant avec une variante de style ; option indisponible garde sa valeur réelle ; principes PR-03 (libellés regular plus petits que les valeurs, non sélectionnées en gris regular sur fond clair, sélectionnée en violet existant, options de même largeur) ; segmenté natif `@expo/ui` seulement après vérification (faite par AD-24 : non retenu). (Δ32)
- FR-28 : Chevron intérieur centré avec le texte sur Variables, Avec (Phases), Avec (Changement de côté) : haut si déployé, bas sinon ; replier conserve valeurs et mode. (Δ33)
- FR-29 : Tableaux des séries et des phases : fond blanc sans contour, lignes de 36 (44 ailleurs) ; aucun stepper permanent ; chaque cellule ouvre son seul sélecteur (roue de cible, stepper de Pause, clavier de charge) ; glisser, croix, « Série supprimée — Annuler » sur `#FFF1F0` (Q35), roue sous la ligne (Q45) conservés ; cible tactile de 36 vérifiée sur appareil avant toute autre géométrie ; PR-02 (fond blanc dans son cadre, pas de séparateur après le tableau des phases, espace d'une hauteur de ligne sous la dernière, valeurs alignées sur les en-têtes, numéros rapprochés des poignées). (Δ34)
- FR-30 : Cadence Autre / 5 s / 2 s / 1 s / Sans, option reflétant la valeur (0 → Sans, 1, 2, 5 → option, autre → Autre, §9-7 tranché) ; Autre révèle le ± existant 0..10, pas 1, sans accélération ; aucune valeur personnalisée mémorisée ; bornes, pas et donnée inchangés. (Δ35)
- FR-31 : « Durée de l'exercice » remplace « Durée totale » ; chevron à 12 du libellé, replié par défaut, masque Compte à rebours et Fin sans les désactiver ; bas replié, haut déployé ; ouvrir ou fermer ne modifie pas la valeur ; ligne absente → signaux directement visibles ; Exercice ouvert depuis une Séance : Compte à rebours et Fin restent absents ; calcul, natures, `—`, N = 1, T(1)..T(99) et RM-218 inchangés. (Δ36)
- FR-32 : Hauteur de la Feuille adaptée au contenu visible ; un repli ne laisse aucun espace vide ; avec six phases le contenu défile ; marge basse réduite (PR-04) ; animations Q39 à Q41 conservées. (Δ37)

**Écran principal de l'Éditeur (§4.7)**

- FR-33 : Description en étapes numérotées : état vide « 1. Décrivez la première étape » sans ligne d'invitation ; liste remplie suivie d'une invite « n. Étape suivante » ; Entrée crée l'étape suivante, sans bouton Ajouter ; chaque étape modifiable en place ; pas de réordonnancement (modèle A) ; retour arrière sur une étape vide la supprime, curseur en fin de la précédente ; ↑ ferme le clavier (D-351) ; défilement au-dessus du clavier, `Terminer` immobile (D-349) ; présentation selon Figma courant (§9-2 tranché : demandes 17 et 21, texte à 14, sans cadre). (Δ01)
- FR-34 : À `Terminer`, étapes vides retirées et renumérotées, ordre préservé ; limite de 1 000 caractères (portée : QN-1) ; étapes enregistrées, relues, transportées par la copie Définition → Séance et la duplication ; détection de modification sur les étapes. (Δ02, Δ03)
- FR-35 : Anciennes descriptions : aucune migration, conversion réversible ni retour à l'ancien format ; ancien texte réutilisé seulement si c'est simple ; tolérance limitée aux descriptions. (QP5-01)
- FR-36 : Compte à rebours et Fin retirés du résumé de la Carte et de son nom accessible, avec `cardSeparator` ; données, Feuille, `computeExercisePlanDuration`, Phrase et sa « Durée totale » inchangés. (Δ04, R-14)
- FR-37 : `Terminer` abaissé selon Figma, zone réservée au-dessus garantissant que le dernier contenu n'est jamais masqué, clavier ouvert ou fermé ; `Terminer` ne remonte pas avec le clavier (D-349) ; couleurs actif / inactif conservées. (Δ05)
- FR-38 : Conformité Figma de l'écran principal (en-tête, Nom, accès Catégorie et Zones, titres de section, cadre des modalités, typographies, couleurs, positions) ; écarts E-V1 à E-V16 retenus corrigés ; Classification à une seule forme et deux registres d'état, rien ne bouge, glyphe teinté de la couleur de Catégorie, cibles tactiles préservées sans recouvrir le Nom ; Carte des modalités `#F9FAFC` (jeton `surfaceSubtle`), rayon 12, sans liseré ; D-327, « Retour » du ✕ (Q48), séparateur des Zones (Q49), comportements Catégorie / Zones (Q49, Q53), jetons verrouillés conservés ; tout écart exigeant un jeton ou un remplacement de composant est signalé. (Δ06)

**Persistance, copies, Phrase et lexique (§4.8)**

- FR-39 : Phases, charge et étapes persistées et relues ; absence lue sans phases, charge Sans (PRE-4, `migration010`) ; lecture de l'ancien format livrée avec la nouvelle écriture ; migrations 001 à 010 intactes. (Δ39)
- FR-40 : La durée projetée d'un Exercice à phases reste dans les bornes du CHECK ; FR-3 le garantit à la saisie, la projection le garde aussi. (Δ40)
- FR-41 : Copies Définition → Séance, duplications et instantanés transportent phases, charge (valeurs sous Sans comprises) et étapes ; chaque copie reste isolée. (Δ41)
- FR-42 : Phrase avec charge active, après la valeur par série (D-414) : `(charge : 20 kg)` ; `(charges : 20, 12, 13 kg)` jusqu'à trois ; `(charges : 20, 12 kg, ...)` au-delà ; valeurs dans l'ordre des séries, pas de charge commune si les séries diffèrent ; série à zéro listée (D-423) ; rien sous Sans ; statut et symboles des durées inchangés ; 276 phrases intactes sauf clause des côtés. (Δ42)
- FR-43 : Phrase avec phases : parenthèse après la durée de série, dans l'ordre d'exécution, exhaustive même pour une phase : « **3 séries de 9 s** (Descente : **6 s** - Maintien : **3 s**), avec une pause après chaque série de **15 s**. » ; régénérée après toute modification ; sans phases inchangée ; générateur et segments réutilisés ; corpus étendu ; ordre phases puis charge (§9-3 tranché). (Δ44)
- FR-44 : Lexique : Condition d'arrêt et trois résultats, Phases, Charge, kg, Avec / Sans, Enchainement et deux options, Cadence et options, Durée de l'exercice, invites des étapes ; clés orphelines retirées (Carte, sous-titres D/G) ; identifiants techniques inchangés (D-201). (Δ46)

**Bornes des durées (§4.9)**

- FR-45 : Toute durée strictement positive : minimum 1 s, pas 1 s (série, phase, exercice) ; T(1)..T(99) conservés ; zéro autorisé là où il l'était (Pause, Compte à rebours, Fin) ; grilles de Pause et de Récupération du Profil inchangées (§9-5 tranché) ; maxima conservés (durée de série et somme des phases dans 1..3 535 s) ; roues, validations et tests adaptés sans nouveau composant ; calculs inchangés ; formats hors périmètre. (Δ50, D-430, R-17)

### Exigences non fonctionnelles

- NFR-1 — Primitives natives d'abord ; aucun composant accepté remplacé sans décision ; seuls les remplacements R-01 à R-17 et les changements de présentation du PRD §7 sont admis ; `SegmentedControl` React Native réutilisé (QP5-06).
- NFR-2 — Garde-fous des roues : `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260` (zéro `ScrollView` iOS) intacts et verts ; aucune `ScrollView` introduite dans ces sélecteurs.
- NFR-3 — `migration001.ts` jamais modifiée ; nouvelle migration seulement si l'architecture la rend nécessaire (AD-18 : aucune) ; valeurs de `tokens.ts` inchangées et `tokensSpecification.test.ts` vert.
- NFR-4 — Chaque story se termine avec `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- NFR-5 — Une suite verte ne prouve ni rendu, ni geste, ni clavier ; recette iPhone par Hermann groupée par lot (Feuille, puis Éditeur) ; ses décisions priment et sont reportées.
- NFR-6 — Recette précoce du champ numérique : le champ clavier de la charge, avec Précédent / Suivant et fond de la cellule active, est essayé tôt sur iPhone avant toute généralisation.
- NFR-7 — Accessibilité : alternatives accessibles des gestes dans les nouveaux tableaux ; sémantique non modifiable pour le résultat dérivé et les options indisponibles ; cellule active annoncée ; cibles de 44 hors tableaux, dérogation à 36 dans les tableaux vérifiée sur appareil.
- NFR-8 — Préservation de PRE-4 : un comportement validé ne change que par §7 ; divergence avec un document généré signalée, pas appliquée ; aucune refactorisation justifiée seulement par le PRD ; revue approfondie réservée à la persistance et aux mécanismes nouveaux ; recette validée non rouverte.
- NFR-9 — Textes via `src/shared/i18n/` (`strings`) ; « Set » proscrit (D-077) ; code en anglais (D-035) ; persistance par les repositories seuls (D-043) ; duplication volontaire de `PickerToolbar` conservée ; piège CRLF pris en compte.
- NFR-10 — Aucun Exercice ni aucune Séance existants ne perdent de paramètre ; seule tolérance : les descriptions (FR-35).

### Exigences complémentaires (architecture)

Pas de modèle de départ (projet existant, `bmad/pre5-depuis-pre4`) ; aucune montée de version (expo 57.0.16, react-native 0.86.2, @expo/ui 57.0.13). Aucun déploiement : ni push, ni EAS.

- AR-18 (AD-18) — Format canonique v3 : `EXECUTION_PARAMETERS_VERSION` = 3 ; `serializeExecutionParameters` seul écrivain (repositories, Instantané), forme v2 + `loadEnabled`, `loadKg` (uniforme et lignes), `workPhases` (uniforme), toujours écrits ; `readExecutionParameters` seul lecteur (v2 → `readV2` avec `workPhases: []`, `loadEnabled: false`, `loadKg: 0` ; v3 → `readV3` strict ; autre → `ExecutionParametersDataError`) ; `readV2`/`serializeV2` comparent ou écrivent le littéral 2 (`EXECUTION_PARAMETERS_V2`) ; aucune migration SQL, `DATABASE_VERSION` = 10 ; `serializeV2` sans appelant de production, lève une erreur sur phases ou charge, test de garde de confinement ; `EXERCISE_SNAPSHOT_VERSION` = 3, `parseExerciseSnapshot` lit 1, 2, 3 ; retour arrière applicatif non pris en charge (erreur explicite).
- AR-19 (AD-19) — Charge : `loadEnabled` racine, `loadKg` sur `UniformSeries` et `SeriesRow`, fini ≥ 0 multiple de 0,25 ; module unique `exerciseLoad.ts` (`roundLoadUp`, `normalizeLoad`, `reactivateLoad`, `formatLoadKg`, `parseLoadText` acceptant « , » et « . », vide = 0, illisible ou négatif = valeur précédente) ; transitions `setLoadEnabled`, `setLoadValue` ; `normalizeLoad` à la fermeture du clavier, à Variables → Identiques et au ✓, jamais pendant Précédent / Suivant ; contrôle structurel propre à la charge, `checkStructuralNumber` inchangé ; `sameRowValue`/`alignRowsToBaseline` ignorent la charge ; champs obligatoires dans les types, constructeurs adaptés en story 1 ; `normalizeEffective` (N = 1) reprend le `loadKg` de la 1re ligne, `workPhases: []` ; égalité et clone étendus ; toute construction de `SeriesRow` recopie `loadKg`.
- AR-20 (AD-20) — Phases : `workPhases: WorkPhase[]` (`{id, label, durationSeconds}`) sur `UniformSeries` seulement ; invariant structurel (Mode Durée, Cible `NUMBER`, durées ≥ 1, libellé 1..20, `target.value` = Σ, Σ dans 1..3535, sans tolérance de ligne de base) validé par `validateForSave` et `readV3` ; écrivain unique `deriveSeriesDuration` (liste non vide seulement ; table d'appels de l'AD) ; durée `number | null` au brouillon ; `normalizeWorkPhases(phases, defaultLabel)` au ✓ ; prédicat unique `canEnableWorkPhases` ; à N = 1 en état variable demandé, `setVariable(false)` dans la même transition ; transitions vers Répétitions, À l'échec, Variables refusées avec des phases ; `WORK_PHASE_LIMITS = { maxCount: 6, labelMaxLength: 20, durationMin: 1 }`.
- AR-21 (AD-21) — Côtés : `SideMode` à trois valeurs, aucun CHECK modifié ; Avec ⇔ `isBilateral` ; Sans → Avec écrit `RIGHT_LEFT` et copie la Pause du Profil (P3-10) ; `LedgerSide` ordinal (`NONE | SIDE_1 | SIDE_2`) ; aucun module ne distingue `RIGHT_LEFT` de `LEFT_RIGHT` ; `SideModeControl.tsx` non étendu ; `normalizeEffective` écrit `BY_SIDE` à N = 1 (NR Δ24) ; QN-4.
- AR-22 (AD-22) — Étapes dans la colonne existante : codec unique `instructionSteps.ts` (`decodeInstructionSteps` sur `/\r?\n/`, `encodeInstructionSteps` sans vides ni numéros, `null` si vide, `splitStepAt`, `insertPastedText`, `instructionStepsLength`) ; `instructionSteps: readonly string[]` dans la valeur du formulaire ; `formValueEquals` compare les encodages ; encodage à `Terminer` seulement ; `normalizeInstruction` inchangée ; saisie dépassant la limite refusée en entier ; limite en points de code sur la chaîne encodée `[EN ATTENTE QN-1]`.
- AR-23 (AD-23) — Condition d'arrêt : `stopConditionOf(parameters)` seule autorité (`TARGET`, `FAILURE`, `MIXED`, `INCOMPLETE`), sur l'état effectif ; mémoire `lastNumberById` au Brouillon, distincte de `targetsById`, jamais écrasée par `FAILURE`/`UNSET` ; `failureOption` absente en identiques, conservée en variables ; Variables → Identiques puis `normalizeLoad` (charge reprise à 0 → Sans, §9-9).
- AR-24 (AD-24) — `SegmentedControl` reçoit `variant: "inline"` et les props optionnelles `chevron`, `compact`, `readOnly` ; `standard` et `parameters` inchangés ; `cadenceOptionOf(value)` ; vérification QP5-06 faite, segmenté natif non retenu ; valeurs Figma en constantes locales.
- AR-25 (AD-25) — Brouillon : `workPhases`, `nextPhaseId`, `loadEnabled`, `loadKg` (uniforme, lignes actives, cachées, sauvegardées), `lastNumberById` ; `openSheetDraft`, `plain`, `requestedParameters` portent tout (test d'aller-retour) ; `pendingRemoval` étendu à `{ kind: "series" | "phase" }`, remis à `null` par toute transition ; `sheetDraftResult(draft, defaultLabel)` = `normalizeWorkPhases` → `normalizeLoad` → `validateForSave`, sert la disponibilité du ✓ et `commitSheetDraft` (cas obligatoires `[0, null]` et 3 536 s).
- AR-26 (AD-26) — `KeyboardField` unique (`TextInput` RN) : charge `decimal-pad`, libellé clavier texte 20 au plus, longueur en points de code ; texte local, une transition à la sortie ; un `InputAccessoryView` par champ de charge (`nativeID` propre), barre Précédent / Suivant / « Fermer » à droite ; ordre `loadFieldOrder(draft)` ; extrémités indisponibles ; fond actif dérivé de la surface `keyboard` ; défilement par `SheetMotionScrollView` seul, piloté en JavaScript (pas d'`automaticallyAdjustKeyboardInsets`, pas de `KeyboardAvoidingView`), marge 12 ; libellé fermé par Retour ; essai précoce sur iPhone avant généralisation, repli signalé sans réimplémentation.
- AR-27 (AD-27) — `sheetSurface.ts` seul réducteur : surfaces `keyboard(load|phaseLabel)`, `selector(phaseDuration)`, `stepper(rowPause)` ajoutées ; `popover(mode|side|order|regime)` retirées ; synchronisation focus / surface dans un hook unique, `flushKeyboardField()` synchrone avant toute autre transition ; surfaces par identité ; une seule annulation en attente ; `DraggableRow`, `RemoveRowButton` et message d'annulation extraits dans un module partagé, `WorkPhasesTable` distinct ; ✓/✕ absorbés pendant `keyboard` (Q47) ; cellules sans ± ouvrant leur outil.
- AR-28 (AD-28) — Quatre `SheetMotionView` ; repère unique des panneaux (y du cadre + y de la ligne) dans une seule fonction ; panneaux rendus hors des cadres ; Charge identiques : segment Avec affichant `formatLoadKg`, champ dans la ligne ; gris des cadres en constante locale ; lignes 36 / 44 ; cible tactile 36 vérifiée dans la 1re story de tableau ; Durée de l'exercice repliée par `DisclosureControl`.
- AR-29 (AD-29) — Phrase : `workPhasesClause`, `loadClause`, point d'insertion unique après la valeur par série, `VALUE_SUFFIX_ORDER` = phases puis charge ; côtés neutres ; corpus 276 inchangé sur disque, attendus neutres et nouveaux cas en fixtures littérales ; cas Δ48 et charges variables égales obligatoires.
- AR-30 (AD-30) — Carte sans `phasesRow` ni `cardSeparator`, nom accessible réduit ; `Terminer` hors du `KeyboardAvoidingView`, zone protégée = espace de défilement réservé ; écart Figma exigeant un jeton ou un composant signalé.
- AR-31 (AD-31) — `EXECUTION_BOUNDS.durationTarget.min` 5 → 1 (`EP:88`), seul changement de valeur ; roues, `selectorOpeningPosition` (00:01), `stepTarget`, validation et somme des phases en dérivent ; maxima, CHECK, maintien 1/5/10, bornes et grilles des pauses inchangés ; tests listés par `propagation-borne-1s.md` §4.3 adaptés et tests §4.3 « à ajouter » écrits.
- AR-32 (AD-32) — Lexique : clés nouvelles via `src/shared/i18n/`, clés orphelines retirées dans la story qui retire leur dernier usage, identifiants techniques inchangés.
- AR-33 (AD-33) — Ordre : story 1 socle de données atomique (sans interface) ; transitions du Brouillon avant toute story de Feuille ; essai NFR-6 avant généralisation de `KeyboardField` ; `SegmentedControl` `inline` avant les lignes qui l'utilisent ; aucune story ne dépend d'une story placée après elle ; recette lot Feuille puis lot Éditeur.
- Hérités ratifiés (AD-1 à AD-17) : en particulier AD-2 (une machine de Brouillon), AD-5 (un calcul de durée), AD-6 (un générateur de Phrase), AD-7 (roues natives, garde zéro `ScrollView`), AD-8 (glisser PRE-3, actions accessibles), AD-9 (clonage profond), AD-10 (preuves SQLite réelles), AD-11 (lexique et jetons verrouillés), AD-13 (`validateForSave` unique), AD-15 (une seule surface), AD-16 (mécanisme ± unique).

### Exigences de conception UX

Aucun document UX séparé. Les propriétés Figma (S-2, PRD §9) sont relevées en lecture seule, frame par frame, dans la story qui les utilise, après vérification de l'identifiant actuel de la frame. Ce sont des propriétés de présentation, jamais des règles ; aucune modification de Figma.

- UX-DR1 : Gris des cadres, violet de sélection, dimensions des segmentés en ligne (hauteur, largeur égale des options, police), chevron intérieur — Feuille.
- UX-DR2 : Rendu du résultat dérivé de la Condition d'arrêt (violet atténué, texte blanc) — Feuille.
- UX-DR3 : Tableaux : fond blanc, lignes de 36, alignement valeurs / en-têtes, numéros rapprochés des poignées, espace sous la dernière ligne (PR-02) — Feuille.
- UX-DR4 : Contrôle d'ajout d'une phase (`9207:18817`, `NON VÉRIFIABLE` à ce jour) et trois écrans de phases — Feuille.
- UX-DR5 : Cellule de charge en saisie, clavier `9292:18077` (marge 12) — Feuille.
- UX-DR6 : Libellés et police réduite de l'Enchainement (frame `8328:38193` encore en D1/G1, non bloquante) — Feuille.
- UX-DR7 : Indicateur de côté de la Composition sans direction — Composition.
- UX-DR8 : Description en étapes (texte à 14, sans cadre, numéros, invite grise ; demandes 17 et 21 du registre v25) — Éditeur.
- UX-DR9 : Mesures de `Terminer` et de sa zone protégée, clavier ouvert compris — Éditeur.
- UX-DR10 : Typographies de l'écran principal, en-tête, Nom, Classification Catégorie / Zones (une forme, deux registres d'état), titres de section, Carte des modalités (`#F9FAFC`, rayon 12, sans liseré) — Éditeur.

### Carte de couverture des FR

Carte FR → epic → story(s). La story principale est en gras ; les autres complètent (domaine, interface, Phrase).

| FR | Epic | Stories | Objet |
|---|---|---|---|
| FR-1 | E1, E2 | **1.1**, 2.1, 2.8 | Modèle des phases ; transitions ; tableau |
| FR-2 | E2 | **2.1**, 2.4, 2.8 | Éligibilité et options indisponibles |
| FR-3 | E1, E2 | 1.1, **2.1**, 2.8 | Invariant Σ ; dérivation de D ; lecture seule |
| FR-4 | E2 | **2.8** (2.6 pour le module partagé) | Ligne et tableau des phases |
| FR-5 | E2 | 2.1, **2.8** | Création et ajout de phases |
| FR-6 | E2 | 2.2, **2.8** | Libellé au clavier texte |
| FR-7 | E2 | **2.8** | Durée de phase à la roue |
| FR-8 | E2 | **2.1**, 2.8 | Suppression, Avec → Sans, ✕ |
| FR-9 | E2 | **2.1**, 2.8 | Normalisation au ✓ |
| FR-10 | E1, E2 | **1.1**, 2.1, 2.7 | Modèle de la charge |
| FR-11 | E2 | **2.1**, 2.7 | Charge dans le Brouillon |
| FR-12 | E2 | **2.7** | Charge en identiques |
| FR-13 | E2 | **2.7** | Charge en variables |
| FR-14 | E1, E2 | 1.1, **2.1**, 2.7 | Arrondi, zéro, activation |
| FR-15 | E2 | 2.1, **2.5** | Changement de côté Avec / Sans |
| FR-16 | E1, E2 | **1.1**, 1.2, 2.5 | Lecture des côtés historiques |
| FR-17 | E2 | **2.5** | Enchainement |
| FR-18 | E1 | **1.2** | Phrase neutre, indicateur de la Composition |
| FR-19 | E2 | 2.1, **2.4** | Condition d'arrêt en identiques |
| FR-20 | E1, E2 | 1.1, **2.4** | Résultat dérivé en variables |
| FR-21 | E2 | 2.1, **2.4** | Champs masqués à l'échec |
| FR-22 | E2 | **2.4**, 2.6 | Roues sans option d'échec en identiques |
| FR-23 | E2 | 2.2, **2.7** | Charge saisie dans la cellule |
| FR-24 | E2 | **2.2**, 2.7, 2.8 | Visibilité, clavier, « Fermer », une surface |
| FR-25 | E2 | **2.2**, 2.7 | Précédent / Suivant, cellule active |
| FR-26 | E2 | **2.4** | Quatre cadres |
| FR-27 | E2 | 2.3, **2.4**, 2.5, 2.7, 2.8 | Segmentés en ligne |
| FR-28 | E2 | 2.3, 2.4, 2.5, 2.8 | Chevrons intérieurs |
| FR-29 | E2 | **2.6**, 2.8 | Tableaux sans steppers, lignes de 36 |
| FR-30 | E2 | **2.5** | Cadence |
| FR-31 | E2 | **2.5** | Durée de l'exercice |
| FR-32 | E2 | **2.4**, 2.8 | Hauteur adaptée au contenu |
| FR-33 | E3 | **3.1** | Description en étapes |
| FR-34 | E1, E3 | 1.1, **3.1** | Validation et conservation des étapes |
| FR-35 | E1, E3 | 1.1, **3.1** | Anciennes descriptions |
| FR-36 | E3 | **3.2** | Carte sans Compte à rebours ni Fin |
| FR-37 | E3 | **3.2** | `Terminer` abaissé, zone protégée |
| FR-38 | E3 | **3.2** | Conformité Figma de l'écran principal |
| FR-39 | E1 | **1.1** | Format persisté v3, lecture v2 |
| FR-40 | E1 | **1.1** | Projection scalaire bornée |
| FR-41 | E1 | **1.1** | Copies, duplications, instantanés |
| FR-42 | E1 | **1.2** | Phrase avec charge |
| FR-43 | E1 | **1.2** | Phrase avec phases |
| FR-44 | E1, E2, E3 | 1.2, 2.4, 2.5, 2.7, 2.8, 3.1, 3.2 | Lexique (clés ajoutées et orphelines retirées par la story concernée) |
| FR-45 | E1, E2 | **1.1**, 2.8 | Minimum de 1 s |

| NFR | Stories |
|---|---|
| NFR-1 | 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2 |
| NFR-2 | 1.1, 2.2, 2.4, 2.6, 2.8 |
| NFR-3 | 1.1, 2.4, 3.2 |
| NFR-4 | toutes |
| NFR-5 | 1.2, 2.2, 2.4 à 2.8, 3.1, 3.2 |
| NFR-6 | **2.2** (bloquante pour 2.7 et 2.8) |
| NFR-7 | 2.3, 2.4, 2.6, 2.7, 2.8, 3.1, 3.2 |
| NFR-8 | toutes |
| NFR-9 | toutes ; CRLF : 1.1, 3.1 |
| NFR-10 | **1.1**, 3.1 |

Lignes NR, rattachées comme critères de non-régression : Δ07 → 3.1, 3.2 ; Δ24 → 2.1, 2.5 ; Δ30 → 2.2, 2.6, 2.7, 2.8 ; Δ38 → 2.4, 2.5, 2.6 ; Δ47 → 1.1, 2.8. Δ15 : sans objet (§8 du PRD).

## Liste des epics

Trois epics, ordonnés selon AD-33. Le découpage de `table-delta.md` §5 (11 stories) est adapté : le socle de données est atomique (AD-33), les transitions du Brouillon précèdent la Feuille, un essai court sur iPhone précède la généralisation du champ clavier (NFR-6), la variante `inline` du `SegmentedControl` précède les lignes qui l'utilisent. Les lignes NR (Δ07, Δ24, Δ30, Δ38, Δ47) n'ont pas de story : elles sont des critères de non-régression des stories qui les touchent.

### Epic 1 : Mes Exercices portent phases, charge et étapes, sans perte

Les données PRE-5 (phases, charge, étapes, lecture Avec / Sans des côtés, minimum de 1 s) sont enregistrées, relues, copiées et dupliquées sans perte ; toute donnée PRE-4 reste lisible. La Phrase décrit phases, charge et côtés neutres, et la Composition n'affiche plus de direction. Aucun changement de la Feuille ni de l'Éditeur dans cet epic, hormis l'effet de la borne de 1 s.
**FR couverts :** FR-1, FR-3 (invariant), FR-10, FR-16, FR-18, FR-34 (codec), FR-35, FR-39, FR-40, FR-41, FR-42, FR-43, FR-44 (Composition), FR-45.
**Stories :** 1.1 Socle de données v3 ; 1.2 Phrase, côtés neutres et indicateur de la Composition.

### Epic 2 : Régler phases, charge, côtés et Condition d'arrêt dans une Feuille réorganisée

Hermann règle dans la Feuille « Paramètres d'exécution », réorganisée en quatre cadres à segmentés en ligne : la Condition d'arrêt, les phases, la charge saisie au clavier, les côtés Avec / Sans et l'Enchainement, la Cadence et la Durée de l'exercice. Recette groupée : lot Feuille.
**FR couverts :** FR-1 à FR-17 (interface), FR-19 à FR-32, FR-44 (Feuille), FR-45 (roue de phase).
**Stories :** 2.1 Transitions du Brouillon ; 2.2 Essai iPhone du champ clavier de la charge ; 2.3 Variante `inline` du `SegmentedControl` ; 2.4 Quatre cadres, Exécution et Type de série ; 2.5 Côtés, Cadence et Durée de l'exercice ; 2.6 Tableau des séries sans steppers de cellule ; 2.7 Charge dans la Feuille ; 2.8 Phases dans la Feuille.

### Epic 3 : Un Éditeur d'Exercice à Description en étapes, conforme à Figma

Hermann écrit la Description pas à pas, voit une Carte allégée, un `Terminer` abaissé qui ne masque jamais le dernier contenu, et un écran principal aligné sur Figma. Recette groupée : lot Éditeur.
**FR couverts :** FR-33, FR-34, FR-35, FR-36, FR-37, FR-38, FR-44 (Éditeur).
**Stories :** 3.1 Description en étapes ; 3.2 Carte allégée, `Terminer` abaissé et conformité Figma.

**Dépendances entre epics.** L'Epic 1 est autonome. L'Epic 2 s'appuie sur l'Epic 1 (modèle, lecteur, écrivain). L'Epic 3 s'appuie sur l'Epic 1 (codec des étapes) et non sur l'Epic 2 ; il peut avancer en parallèle de l'Epic 2 dès la story 1.1 livrée. Aucune story ne dépend d'une story placée après elle.

## Conventions communes à toutes les stories

- **Contrôles (NFR-4).** Chaque story se termine avec `npm test`, `npx tsc --noEmit` et `npm run lint` verts. Ce critère est repris dans chaque story sous le nom « Contrôles ».
- **Preuve (NFR-5).** Une suite verte ne vaut jamais preuve visuelle, tactile ou du clavier. La présentation, les gestes et le clavier se vérifient en recette iPhone par Hermann, groupée par lot : **lot Feuille** (Epic 2, après la story 2.8 ; essais précoces en 2.2 et 2.6), puis **lot Éditeur** (Epic 3, avec la Composition et la Phrase sur la Carte). Aucun résultat sur appareil n'est fabriqué.
- **Préservation (NFR-8).** Un comportement validé en PRE-3 ou PRE-4 ne change que par un remplacement R-01 à R-17 ou un changement de présentation du PRD §7, ou par une décision listée. Toute divergence avec un document généré est signalée, pas appliquée. Aucune refactorisation justifiée seulement par le PRD.
- **Textes et conventions (NFR-9).** Tout texte visible passe par `src/shared/i18n/` ; « Set » est proscrit ; le code est en anglais ; la persistance passe par les repositories ; les commentaires sont en français et citent FR, Δ, D et AD.
- **Figma (S-2).** Les propriétés sont relevées en lecture seule dans la story qui les utilise, après vérification de l'identifiant actuel de la frame ; elles deviennent des constantes locales nommées (aucun jeton modifié, NFR-3). Aucune modification de Figma.
- **Questions en attente.** Un critère marqué `[EN ATTENTE QN-x]` applique le défaut recommandé ; il sera remplacé après la réponse de Hermann.
- **Tailles.** S : un module, tests ciblés ; M : quelques modules ou une zone de la Feuille ; L : plusieurs couches, ou une zone large de la Feuille avec ses tests.

## Epic 1 : Mes Exercices portent phases, charge et étapes, sans perte

Les données PRE-5 sont enregistrées, relues, copiées et dupliquées sans perte, et toute donnée PRE-4 reste lisible. La Phrase décrit phases, charge et côtés neutres. Aucune interface nouvelle dans la Feuille ni dans l'Éditeur : seule la borne minimale de 1 s change un comportement visible (roue de durée).

### Story 1.1 : Socle de données v3 : phases, charge, étapes et minimum de 1 s

En tant que Hermann,
je veux que mes Exercices et mes Séances puissent porter des phases, une charge et une Description en étapes, enregistrées et relues sans perte, avec un minimum de 1 s pour toute durée positive,
afin que les stories d'interface s'appuient sur un modèle complet et qu'aucune donnée PRE-4 ni PRE-5 ne se perde à l'enregistrement.

**Exigences :** FR-1, FR-3 (invariant de somme), FR-10, FR-14 (fonctions du domaine), FR-16 (lecture), FR-20 (fonction de dérivation), FR-34 (codec et limite), FR-35, FR-39, FR-40, FR-41, FR-45 ; NFR-2, NFR-3, NFR-9 (CRLF), NFR-10 ; Δ02, Δ03, Δ08, Δ16, Δ22, Δ39, Δ40, Δ41, Δ48, Δ50 ; NR Δ47.
**Architecture :** AD-18, AD-19, AD-20 (modèle, invariant, bornes), AD-21 (lecture Avec), AD-22 (codec), AD-23 (`stopConditionOf`), AD-25 (transport seulement), AD-31, AD-33 (story 1 atomique) ; hérités AD-3, AD-4, AD-9, AD-10, AD-13.
**Dépend de :** rien.
**Taille :** L (atomique par AD-33 : une écriture v3 ne peut pas être livrée sans son lecteur ni sans le transport par le Brouillon).
**Questions :** QN-1 (mesure de la limite des étapes), QN-2 (dérivation avec cellules vides).

**Critères d'acceptation :**

**AC1 — Modèle et constructeurs (AD-19, AD-20, FR-1, FR-10).**
**Given** les types de `EP`
**When** la story est livrée
**Then** `ExecutionParameters` porte `loadEnabled: boolean` à la racine, `UniformSeries` porte `loadKg: number` et `workPhases: WorkPhase[]` (`WorkPhase = { id: number; label: string; durationSeconds: number }`), chaque `SeriesRow` porte `loadKg: number`, tous **obligatoires** (jamais optionnels), et une série `VARIABLE` ne porte aucune phase par construction
**And** `WORK_PHASE_LIMITS = { maxCount: 6, labelMaxLength: 20, durationMin: 1 }` est défini dans `EP`
**And** tous les constructeurs sont adaptés mécaniquement : `createEmptyExecutionParameters` (Sans, 0, `[]`), `seriesRowsOf`, `normalizeEffective` (à N = 1 depuis une série variable : `loadKg` de la première ligne, `workPhases: []`, `loadEnabled` inchangé ; une série déjà uniforme garde ses phases), `readV1`, `recoveryExecutionParameters`, `defaultExerciseExecutionParameters` (`SessionDraft.ts`), `composition.ts`, `executionParametersFixtures.ts`
**And** le nom de code des phases est `workPhases`, jamais `phases` seul, distinct de `phasesRow` et de `withProfilePhases`.

**AC2 — Écrivain v3 unique (AD-18, FR-39).**
**Given** des paramètres quelconques
**When** ils sont enregistrés par un repository ou mis dans un Instantané
**Then** ils passent par `serializeExecutionParameters`, seul écrivain, qui produit `{"version":3,…}` dans la forme exacte d'AD-18 : clés et ordre de la v2, `JSON.stringify` sans espace, `"loadEnabled"` à la racine après `"endSeconds"`, `"loadKg"` et `"workPhases"` dans l'uniforme, `"loadKg"` dans chaque ligne, **toujours écrits** (y compris `false`, `0` et `[]`)
**And** `EXECUTION_PARAMETERS_VERSION` vaut 3.

**AC3 — Lecteur unique v2 + v3 (AD-18, FR-39, NFR-10).**
**Given** une ligne enregistrée par PRE-4 (v2), une donnée issue de `migration010` et une ligne v3
**When** elles sont lues
**Then** toutes passent par `readExecutionParameters` : la v2 par `readV2` (grammaire inchangée) qui retourne `workPhases: []`, `loadEnabled: false` et `loadKg: 0` partout ; la v3 par `readV3`, strict (clé absente ou mal typée → `ExecutionParametersDataError`) ; toute autre version → `ExecutionParametersDataError` (existant)
**And** `readV2` et `serializeV2` comparent ou écrivent le littéral 2 (constante `EXECUTION_PARAMETERS_V2`), jamais `EXECUTION_PARAMETERS_VERSION`
**And** une donnée PRE-4 relue ne perd ni ne change aucun paramètre (SM-3) et se lit « sans phases, charge Sans ».

**AC4 — `serializeV2` confiné (AD-18).**
**Given** le code de production
**When** un test de garde, sur le modèle de `legacyModeConfinement.test.ts`, parcourt `src/`
**Then** `serializeV2` et `readV2` n'apparaissent que dans `EP`, leurs tests et `readExecutionParameters`
**And** `serializeV2` n'a aucun appelant de production, reste réservé aux tests de parité de `migration010`, et lève une erreur si on lui passe des phases, une charge active ou une valeur de charge non nulle.

**AC5 — Invariant des phases (AD-20, FR-1, FR-3, FR-40).**
**Given** des paramètres avec `workPhases` non vide
**When** `validateForSave` ou `readV3` les contrôlent
**Then** sont exigés : Mode `DURATION`, Cible commune `NUMBER`, 1 à 6 phases, `id` entier ≥ 1 unique dans la liste, chaque `durationSeconds` entier ≥ 1, libellé de 1 à 20 caractères comptés en points de code, `target.value` = Σ `durationSeconds`, Σ dans 1..3535
**And** tout écart est une violation structurelle (`validateForSave`) ou une `ExecutionParametersDataError` (`readV3`), sans aucune tolérance de ligne de base (H25 ne s'applique pas à la somme)
**And** la projection scalaire (`projectScalars`) d'un Exercice à phases donne `duration_seconds` = Σ, dans le CHECK 1..5999, et `assertActivityColumns` l'accepte (FR-40).

**AC6 — Charge : contrôle structurel et neutralité (AD-19, FR-10).**
**Given** une `loadKg` finie, ≥ 0, multiple de 0,25 (`Number.isInteger(loadKg * 4)`), sans plafond
**When** les paramètres sont validés
**Then** le contrôle structurel propre à la charge l'accepte, et refuse une valeur négative, non finie ou hors pas ; `checkStructuralNumber` reste entier et inchangé ; aucune borne de niveau saisie n'est ajoutée
**And** `sameRowValue` et `alignRowsToBaseline` ignorent la charge
**And** la charge n'a aucun effet sur cibles, durées, cadence, pauses, Condition d'arrêt et calculs : `workSeconds`, `computeExercisePlanDuration` et la projection donnent le même résultat avec ou sans charge, en Mode Durée comme en Mode Répétitions, y compris à l'échec (Δ48).

**AC7 — Module `exerciseLoad.ts` (AD-19, FR-14).**
**Given** le module unique `src/domain/activities/exerciseLoad.ts`
**When** ses fonctions sont testées
**Then** `roundLoadUp` donne 1,3 → 1,5 ; 0,01 → 0,25 ; 1,25 → 1,25 ; 0 → 0
**And** `normalizeLoad` : en identiques, une charge commune à 0 fait passer à Sans ; en variables, une ligne à 0 vaut « sans charge » pour cette série seulement et la charge reste active tant qu'une ligne est positive ; toutes les lignes à 0 font passer à Sans ; un zéro n'est jamais remplacé par une ancienne charge positive
**And** `reactivateLoad` : aucune valeur mémorisée, ou toutes nulles ([0 ; 0 ; 0]) → 0,25 kg partout ; sinon valeurs restaurées telles quelles, zéros compris
**And** `formatLoadKg` est le seul formateur de kg, avec le séparateur décimal du français (« 1,5 kg », « 20 kg »)
**And** `parseLoadText` accepte « , » et « . » et retourne `{ kind: "value", kg } | { kind: "empty" } | { kind: "invalid" }` ; un texte illisible ou négatif est `invalid` (la valeur précédente reste) ; un champ vide est `empty` (vaut 0 à la sortie du champ, §9-10)
**And** les cas Δ48 sont des tests explicites : Répétitions × Identiques, Répétitions × Variables, cible À l'échec avec charge — mêmes résultats qu'en Mode Durée.

**AC8 — `stopConditionOf` (AD-23, FR-20).**
**Given** la fonction pure `stopConditionOf(parameters)` de `EP`, seule autorité, lue sur l'état **effectif** (N = 1 = identiques) et appuyée sur `allTargetsFailure`, `hasFailureTarget`, `hasUnsetTarget`
**When** elle est appelée
**Then** en identiques : `FAILURE` si et seulement si la Cible commune est `FAILURE`, sinon `TARGET` (une Cible `UNSET` donne `TARGET`, valeur à renseigner) ; Mode non renseigné : `TARGET`
**And** en variables : toutes les lignes renseignées `NUMBER` → `TARGET` ; toutes `FAILURE` → `FAILURE` ; au moins une `NUMBER` et une `FAILURE` → `MIXED`
**And** `[EN ATTENTE QN-2]` les cellules vides (`UNSET`) ne sont pas comptées : le résultat se calcule sur les seules lignes renseignées ; sans aucune ligne renseignée, la fonction retourne `NONE` (aucun résultat ; la Feuille affiche « — »)
**And** aucune valeur « Mixte » ni aucun champ de condition n'est persisté ; la Phrase garde ses propres branches (aucune régression du corpus).

**AC9 — Codec des étapes (AD-22, FR-34, FR-35, NFR-9).**
**Given** le module unique `src/domain/activities/instructionSteps.ts`
**When** ses fonctions sont testées
**Then** `decodeInstructionSteps(text | null)` découpe sur `/\r?\n/` : un texte PRE-4 multiligne donne une étape par ligne, et une fixture à fins de ligne `\r\n` ne crée aucune étape fantôme
**And** `encodeInstructionSteps(steps)` retire les étapes vides après suppression des espaces extérieurs, joint par `\n`, sans numéro, et retourne `null` si la liste est vide ; une étape ne contient jamais de saut de ligne
**And** `splitStepAt` coupe une étape au curseur (§9-5) ; `insertPastedText` donne une étape par ligne d'un collage multiligne (§9-6)
**And** `instructionStepsLength` est la seule mesure de la limite, en points de code ; `[EN ATTENTE QN-1]` la limite de 1 000 (`INSTRUCTION_MAX_LENGTH`) s'applique à la chaîne encodée, séparateurs `\n` compris, ce qui garantit le CHECK `length(instruction) <= 1000` sans migration ; `normalizeInstruction` reste la validation de la chaîne encodée, sans seconde règle
**And** le stockage est inchangé (`activity_definitions.description`, `activities.instruction`) : aucune migration, aucune conversion, aucun retour à l'ancien format (FR-35) ; l'Instantané ne porte pas de Description.

**AC10 — Minimum de 1 s (AD-31, FR-45, D-430, R-17).**
**Given** `EXECUTION_BOUNDS.durationTarget` (`EP:88`)
**When** la story est livrée
**Then** `min` vaut 1 (au lieu de 5), seul changement de valeur ; `max` reste 3535
**And** en dérivent sans autre code : `targetBounds`, `nearestGridValue`, `selectorOpeningPosition` (« — » ouvre sur 00:01), `stepTarget` (+ depuis « — » donne 1 s), la validation de saisie (`checkInputBounds`) et la roue `DurationWheelPicker` (à 0 min, secondes « 00 » puis 01..59 ; 00:00 non validable)
**And** les tests listés dans `propagation-borne-1s.md` §4.3 sont adaptés (`ExecutionParameters.test.ts`, `ExecutionParametersDraft.test.ts`, `ExecutionParametersSheet.test.tsx`, `DurationWheelPicker.test.tsx`, `wheelPickerMath.test.ts` ; `ProfileStepper` seulement si ses bornes sont celles de la Durée), et les tests « à ajouter » sont écrits : 1 s acceptée ; 0 refusé pour une Durée par série ; roue à 0 min proposant 01..59 ; une phase de 1 s acceptée, une somme 0 refusée, une somme de 3 536 s refusée
**And** les commentaires cités au §4.1 du rapport sont corrigés (« 5 s à 58 min 55 s », « 00:05 », « 5..3535 »)
**And** restent inchangés : maxima, CHECK SQL (1..5999), maintien accéléré 1/5/10 (`EXECUTION_ACCELERATED_HOLD_POLICY`), bornes des pauses, `PAUSE_GRID_VALUES` du Profil (§9-5), T(1)..T(99) de la Durée de l'exercice (Q46), et `NumberWheelPicker` (Répétitions 1..100).

**AC11 — Repositories, Instantané et preuve SQLite (AD-18, AD-10, FR-39, NFR-3).**
**Given** `SqliteActivityDefinitionRepository`, `SqliteSessionRepository`, `exerciseSnapshot.ts` et `runNativeDatabaseIntegrationCheck`
**When** ils lisent et écrivent des paramètres
**Then** ils n'utilisent que `readExecutionParameters` et `serializeExecutionParameters` ; `EXERCISE_SNAPSHOT_VERSION` vaut 3 et `parseExerciseSnapshot` lit les enveloppes 1 (`readV1`), 2 et 3
**And** un test d'aller-retour sur `node:sqlite` réel prouve : une ligne v2 relue sans phases et Sans ; une ligne réenregistrée écrite en v3 ; une charge sous Sans (`loadEnabled = false`, `loadKg` non nuls) conservée après enregistrement et relecture ; des phases conservées avec leurs `id`, libellés et durées ; des valeurs `RIGHT_LEFT` et `LEFT_RIGHT` relues et réécrites inchangées (FR-16)
**And** aucune migration SQL n'est ajoutée ; `migration001` à `migration010` restent intactes, `DATABASE_VERSION` reste 10 ; `migration010.test.ts` et `preservation.story14.test.ts` passent
**And** un retour arrière applicatif (build PRE-4 sur une ligne v3) n'est pas pris en charge : la lecture lève `ExecutionParametersDataError`, sans perte silencieuse.

**AC12 — Égalité, clone, copies et instantanés (AD-9, AD-19, FR-41).**
**Given** `executionParametersEqual` et `cloneExecutionParameters`
**When** ils traitent des paramètres v3
**Then** ils incluent `loadEnabled`, `loadKg` (uniforme et lignes) et `workPhases` (avec `id`)
**And** la copie Définition → Séance, la duplication d'un Exercice ou d'une Séance et l'Instantané transportent les phases, la charge (valeurs sous Sans comprises) et la Description encodée ; `copiesAndSnapshots.story13.test.ts` est étendu en conséquence
**And** chaque copie reste isolée : modifier les phases ou la charge de la copie ne modifie pas la source, et inversement.

**AC13 — Transport par le Brouillon, sans transition nouvelle (AD-25, AD-33).**
**Given** `openSheetDraft`, `plain` et `requestedParameters` de `Draft`
**When** un Exercice v3 est ouvert puis validé dans la Feuille existante sans modification
**Then** `ExecutionSheetDraft` porte `workPhases`, `nextPhaseId` (max(`id`) + 1, 1 si aucune phase), `loadEnabled`, et `loadKg` dans `uniform` et dans chaque ligne (actives, cachées, sauvegardées) ; `plain` recopie `loadKg`
**And** un test d'aller-retour `requestedParameters(openSheetDraft(p))` = `p` le garde pour : charge sous Sans avec valeurs non nulles, charges variables, phases avec identifiants, côté `LEFT_RIGHT`
**And** aucune transition nouvelle n'est ajoutée dans cette story ; aucun ✓ ne perd une donnée lue.

**AC14 — Non-régression des consommateurs (NR Δ47, AD-5, AD-20).**
**Given** un Exercice à phases 6 s + 3 s, 3 séries, Pause 15 s
**When** les calculs existants le lisent
**Then** `workSeconds` donne D = 9 s et la Durée de l'exercice 72 s (`executionCalculations.test.ts`), sans modification de `workSeconds`, `projectScalars`, de l'Inversion (N seul change) ni de `computeIntrinsicDuration`
**And** `calculations.test.ts`, `compositionPresentation.test.ts` et `ActivityCard.test.tsx` passent sans être affaiblis.

**AC15 — Périmètre et contrôles.**
**Given** la story terminée
**When** l'agent la clôt
**Then** aucune interface nouvelle n'est ajoutée (seule la roue de durée change, par AC10) ; `tokens.ts` est inchangé et `tokensSpecification.test.ts` passe ; `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260` sont intacts et verts (NFR-2)
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (lot Feuille, groupée) :** roue « Durée d'une série » au minimum : 00:01 atteignable, 00:00 non validable (Δ50). Relecture sur l'appareil d'un Exercice PRE-4 existant : aucun paramètre perdu (SM-3).
**Hors story :** toute transition nouvelle du Brouillon (2.1) ; toute interface de phases, charge, côtés ou Condition d'arrêt (Epic 2) ; la Description en étapes à l'écran (3.1) ; la Phrase (1.2).

---

### Story 1.2 : Phrase avec phases et charge, côtés neutres et indicateur de la Composition

En tant que Hermann,
je veux que la Phrase de synthèse détaille les phases et la charge, et que la Phrase et la Composition désignent les côtés sans direction,
afin de lire d'un coup d'œil ce que l'Exercice prescrit, sans désignation anatomique.

**Exigences :** FR-16 (registre par côté), FR-18, FR-42, FR-43, FR-44 (Composition) ; NFR-5, NFR-9 ; Δ42, Δ43, Δ44, Δ45, Δ46 (partie Composition), Δ48 ; R-15, R-16 ; S-3 ; §9-3.
**Architecture :** AD-29, AD-21 (`LedgerSide` ordinal, Composition), AD-32 ; hérités AD-6, AD-10.
**Dépend de :** 1.1.
**Taille :** M.
**UX :** UX-DR7.
**Questions :** QN-5 (nouvelle : charges variables toutes égales).

**Critères d'acceptation :**

**AC1 — Clause de charge (FR-42, D-414, D-422, D-423).**
**Given** un Exercice à charge active
**When** `generateExecutionPhrase` produit la Phrase
**Then** la fonction pure `loadClause(parameters)` ajoute, après la valeur par série : en identiques `(charge : 20 kg)` ; en variables jusqu'à trois séries `(charges : 20, 12, 13 kg)` ; au-delà de trois `(charges : 20, 12 kg, ...)`
**And** les valeurs sont celles des séries, dans leur ordre ; une charge commune n'est pas présentée quand les séries diffèrent ; une série à zéro est listée avec 0 (`(charges : 0, 10, 15 kg)`)
**And** sous Sans, aucune mention ; la charge ne change ni le statut des durées, ni leurs symboles ; les nombres passent par `formatLoadKg`
**And** `[EN ATTENTE QN-5]` en séries variables à charges toutes égales, la liste des valeurs est présentée (`(charges : 20, 20, 20 kg)`), selon « les valeurs sont celles des séries, dans leur ordre ».

**AC2 — Clause des phases (FR-43, QP5-09).**
**Given** un Exercice à phases Descente 6 s et Maintien 3 s, 3 séries, Pause 15 s
**When** la Phrase est produite
**Then** la fonction pure `workPhasesClause(parameters)` donne exactement « **3 séries de 9 s** (Descente : **6 s** - Maintien : **3 s**), avec une pause après chaque série de **15 s**. », segments gras compris
**And** la liste est exhaustive, même pour une seule phase, avec les libellés et durées effectifs, dans l'ordre d'exécution ; la Phrase se régénère après toute modification des libellés, de leur ordre ou des durées ; sans phases, aucun segment n'est ajouté.

**AC3 — Point d'insertion et ordre (AD-29, §9-3).**
**Given** un Exercice à phases et à charge
**When** la Phrase est produite
**Then** les deux mentions sont insérées en un point unique, à la fin de l'expression de la valeur par série (« de 9 s », « de 12 rép. », « menées jusqu'à l'échec », liste ou plage variable), avant la clause de cadence et avant la Pause
**And** l'ordre est la constante unique `VALUE_SUFFIX_ORDER` = phases, puis charge : « **3 séries de 9 s** (Descente : **6 s** - Maintien : **3 s**) (charge : 20 kg), … »
**And** `generateExecutionPhrase` reste le seul générateur, en segments `{texte, gras}` (AD-6) ; la Phrase n'est jamais persistée ; sa « Durée totale » est inchangée (Q-V3-13).

**AC4 — Côtés neutres (FR-18, AD-21, R-16).**
**Given** un Exercice bilatéral, `RIGHT_LEFT` ou `LEFT_RIGHT`
**When** la Phrase est produite
**Then** la clause des côtés emploie la forme neutre « côté 1 puis le côté 2 » et les textes de ch. 10 l. 515, identiques pour les deux valeurs ; aucun module ne lit la direction
**And** `LedgerSide` devient ordinal (`NONE | SIDE_1 | SIDE_2`) dans `executionCalculations.ts`, et les résultats historiques restent lisibles par côté (FR-16)
**And** grammaire et ponctuation du corpus sont conservées.

**AC5 — Corpus (AD-29, AD-10, S-3).**
**Given** `phrases-276.json` et `attendus-phrases-276.json`
**When** le test du corpus s'exécute
**Then** ces deux fichiers ne sont pas modifiés sur disque ; les cas non bilatéraux sont vérifiés contre l'oracle ; les cas bilatéraux contre des attendus neutres en chaînes littérales dans `src/domain/activities/__tests__/fixtures/`
**And** le corpus étendu contient en fixtures littérales : une phase, plusieurs phases, charge commune, charges variables ≤ 3 et > 3, série à zéro, charges variables toutes égales (`[EN ATTENTE QN-5]`), combinaison phases + charge, et les trois cas Δ48 (Répétitions × Identiques, Répétitions × Variables, À l'échec avec charge) ; les `\r` sont retirés de toute fixture découpée par lignes
**And** les 276 phrases sans charge ni phases restent intactes, à la seule exception de la clause des côtés.

**AC6 — Indicateur de côté de la Composition (FR-18, R-15, Δ45).**
**Given** une Séance contenant un Exercice bilatéral
**When** la Composition l'affiche
**Then** l'indicateur ne porte plus de direction (« D→G » / « G→D » supprimés) ; seul le point de passage de `CompositionScreen.tsx` change, le reste de la Composition est intact (pas de refonte)
**And** son rendu suit la frame Figma relevée (UX-DR7, S-2), en constantes locales nommées
**And** les clés anatomiques de `fr.ts:47-50` devenues orphelines sont retirées ; `compositionPresentation.test.ts` passe, adapté seulement pour l'indicateur.

**AC7 — Contrôles.** `npm test`, `npx tsc --noEmit`, `npm run lint` verts ; `executionPhrase.test.ts` étendu.

**Recette iPhone (lot Éditeur, groupée) :** Phrase sur la Carte d'un Exercice à phases et charge, et d'un Exercice bilatéral ; indicateur de la Composition sans direction (frame relevée).
**Hors story :** la saisie des phases et de la charge (2.7, 2.8) ; le libellé « Enchainement » dans la Feuille (2.5).

---

## Epic 2 : Régler phases, charge, côtés et Condition d'arrêt dans une Feuille réorganisée

Hermann règle dans la Feuille « Paramètres d'exécution » (✓ / ✕), réorganisée en quatre cadres à segmentés en ligne : la Condition d'arrêt, les phases, la charge saisie au clavier, les côtés Avec / Sans et l'Enchainement, la Cadence et la Durée de l'exercice. Ordre imposé par AD-33 : transitions du Brouillon (2.1) avant toute story de Feuille ; essai iPhone du champ clavier (2.2) avant sa généralisation (2.7, 2.8) ; variante `inline` (2.3) avant les lignes qui l'utilisent (2.4 et suivantes). Les paramètres et la présentation d'une même zone de la Feuille sont livrés ensemble, pour ne réécrire chaque zone de `ExecutionParametersSheet.tsx` qu'une fois.

**Recette du lot Feuille.** Après la story 2.8, Hermann joue sur iPhone les scénarios de recette des stories 1.1 (roue au minimum) et 2.1 à 2.8, en une session. Les essais 2.2 (champ clavier) et 2.6 AC1 (cible tactile de 36) sont joués plus tôt, car ils bloquent la suite.

### Story 2.1 : Transitions du Brouillon : phases, charge, Condition d'arrêt et côtés

En tant que Hermann,
je veux que le Brouillon de la Feuille sache créer, modifier, retirer et normaliser les phases, activer et saisir la charge, choisir la Condition d'arrêt et basculer les côtés, avec ✕ qui restaure tout,
afin que chaque ligne de la Feuille ne fasse que dispatcher une transition déjà prouvée, sans gérer elle-même une donnée.

**Exigences :** FR-2, FR-3, FR-5, FR-8, FR-9, FR-11, FR-14, FR-15 (transition), FR-19 (mémoire), FR-21 (restauration) ; Δ09, Δ10, Δ13, Δ14, Δ17, Δ20, Δ21, Δ25, Δ27, Δ48 ; NR Δ24 ; §9-9, §9-10.
**Architecture :** AD-25, AD-20 (transitions, table d'appels de `deriveSeriesDuration`, `canEnableWorkPhases`), AD-19 (transitions de charge), AD-23 (mémoire `lastNumberById`), AD-21 (Avec / Sans) ; hérités AD-2, AD-13.
**Dépend de :** 1.1.
**Taille :** L (domaine seul, sans interface).
**Questions :** QN-3, QN-4.

**Critères d'acceptation :**

**AC1 — Éligibilité et compatibilité (FR-2, AD-20).**
**Given** le prédicat unique `canEnableWorkPhases(draft)`
**When** il est évalué
**Then** il est vrai seulement en Mode `DURATION`, en séries identiques **effectives** (N = 1 compris), avec une Cible commune non `FAILURE` ; hors de ce cas, l'activation des phases est refusée par le domaine
**And** à N = 1 avec un état variable demandé, toute transition de phases ou de charge commune passe d'abord, dans la même transition, par `setVariable(false)` : la Feuille et le Brouillon voient le même uniforme
**And** avec des phases, les transitions vers Répétitions, À l'échec et Variables sont refusées (aucune conversion destructive automatique) ; la mémoire des cibles par Mode (`TargetsByMode`) est conservée.

**AC2 — Création et ajout de phases (FR-5, AD-20).**
**Given** un Brouillon éligible sans phase
**When** Hermann passe à Avec
**Then** une phase est créée avec l'identité `nextPhaseId`, un libellé vide (le libellé par défaut est affiché selon la position) et la durée de la Cible `NUMBER` courante ; si la durée vaut « — » ou si la Cible héritée est hors de 1..3535, la durée est `null` (à renseigner), sans valeur inventée
**And** une phase ajoutée reprend la durée de la dernière phase ; à six phases l'ajout est refusé, aucune 7e phase n'est créée
**And** toute transition qui laisse la liste non vide (ajout, retrait d'une phase non dernière, annulation d'un retrait, réglage d'une durée) appelle `deriveSeriesDuration`, seul écrivain de D : `target` = `NUMBER(Σ)` si Σ ≥ 1, sinon `UNSET` ; une durée `null` compte pour 0
**And** tant que des phases existent, la transition qui règle la Cible commune est sans effet.

**AC3 — Déplacement, libellé, retrait et annulation (FR-4, FR-8, AD-25, AD-27).**
**Given** un Brouillon à trois phases
**When** Hermann déplace une phase, modifie un libellé, retire une phase puis annule
**Then** le libellé suit l'`id` de sa phase lors du déplacement
**And** le retrait passe par `pendingRemoval` étendu à `{ kind: "series" | "phase", … }` : une seule annulation en attente (série ou phase), un nouveau retrait remplace la précédente, toute autre transition du Brouillon la remet à `null` (Q29)
**And** l'annulation restitue l'ordre, les libellés, les durées et D
**And** le retrait de la **dernière** phase ramène la liste à « Aucune » sans appeler `deriveSeriesDuration` : `target` garde la dernière somme, qui devient la durée de série modifiable (D-371) ; une somme nulle laisse `UNSET` ; ce retrait reste annulable.

**AC4 — Avec → Sans et retour à Avec (FR-8, décision du 19/10).**
**Given** des phases 6 s, 3 s et 5 s
**When** Hermann passe de Avec à Sans
**Then** `workPhases = []`, la durée de série vaut 14 s, modifiable selon les règles existantes (FR-45), et tous les autres paramètres sont conservés
**And** si aucune durée valide ne peut être déduite (phases toutes à 0 ou `null`), la durée de série reste à renseigner (`UNSET`) : aucune valeur n'est inventée
**And** repasser à Avec crée une seule nouvelle phase initialisée avec la durée de série courante (AC2) ; les anciennes phases ne sont pas mémorisées.

**AC5 — Normalisation et disponibilité du ✓ (FR-3, FR-9, AD-25).**
**Given** la fonction pure unique `sheetDraftResult(draft, defaultLabel)`, qui applique dans cet ordre `normalizeWorkPhases`, `normalizeLoad`, puis `validateForSave`, et sert **à la fois** la disponibilité du ✓ et `commitSheetDraft`
**When** la Feuille est validée
**Then** les phases à 0 s ou `null` sont retirées sans message ni blocage ; un libellé vide (après suppression des espaces extérieurs) devient `defaultLabel(n)` (« Phase n », fourni depuis `strings` par l'appelant ; le domaine n'importe pas l'i18n) selon la position finale ; une liste vide ou entièrement nulle revient à « Aucune » ; une liste restée non vide rappelle `deriveSeriesDuration`
**And** cas obligatoire : phases `[0, null]` → la liste revient à « Aucune » et la validation existante de la durée de série décide seule de la disponibilité du ✓ (les phases ne bloquent jamais ✓ par elles-mêmes)
**And** cas obligatoire : somme normalisée de 3 536 s → ✓ indisponible, comme une durée de série invalide
**And** `[EN ATTENTE QN-3]` le libellé par défaut est stocké après ✓ comme un libellé ordinaire : il ne se renumérote plus ensuite, même après un déplacement
**And** ✕ abandonne le Brouillon : phases, charge, côtés et Condition d'arrêt reviennent à l'état d'ouverture.

**AC6 — Charge dans le Brouillon (FR-10, FR-11, FR-14, AD-19).**
**Given** les transitions `setLoadEnabled` et `setLoadValue(cible, kg | null)`, qui appellent seules les fonctions de `exerciseLoad.ts` (l'interface ne calcule ni arrondi ni zéro)
**When** Hermann active, saisit, désactive ou réactive la charge
**Then** à la première activation sans valeur mémorisée, la charge vaut 0,25 kg (commune, ou dans chaque ligne) ; une réactivation restaure les valeurs mémorisées ; toutes nulles → 0,25 partout ; certaines nulles → restaurées telles quelles
**And** sous Sans, les `loadKg` sont conservés dans le Brouillon (actifs, cachés, sauvegardés) ; D-249 ne s'applique pas à la charge
**And** `setLoadValue` arrondit au 0,25 supérieur ; une valeur `null` (champ vidé) vaut 0, donc aucune charge pour cette série (§9-10) ; une saisie ne se propage pas aux autres séries
**And** `normalizeLoad` (passage à Sans quand tout est à 0) s'applique à la fermeture du clavier, au passage Variables → Identiques et au ✓, **jamais** pendant Précédent / Suivant
**And** la charge suit la ligne dans toutes les opérations, comme les autres valeurs de la série : copie uniforme → variable, ajout de série, retrait et annulation, déplacement, réserves de N (Q29 et réserves existantes conservés)
**And** Variables → Identiques : `setVariable(false)` existant (l'uniforme reprend la première ligne courante, charge comprise), puis `normalizeLoad` : une charge commune reprise à 0 fait passer l'Exercice à Sans (§9-9)
**And** les cas Δ48 sont testés : Répétitions × Identiques, Répétitions × Variables, cible À l'échec avec charge, avec les mêmes résultats qu'en Durée.

**AC7 — Condition d'arrêt et mémoire « À la cible » (FR-19, FR-21, AD-23).**
**Given** un Brouillon en séries identiques avec une Cible commune `NUMBER` 30 s
**When** Hermann choisit À l'échec puis revient à À la cible
**Then** À l'échec écrit `FAILURE` dans la Cible commune, pour toutes les séries selon le Mode
**And** le retour restaure 30 s, dernière valeur `NUMBER` connue dans le Brouillon pour cette identité et ce Mode (mémoire `lastNumberById`, distincte de `targetsById`, jamais écrasée par `FAILURE` ni `UNSET`) ; sans valeur connue, la Cible devient `UNSET`
**And** rien de cette mémoire n'est persisté ; seules les Cibles typées le sont
**And** avec des phases, la transition vers À l'échec est refusée (AC1).

**AC8 — Côtés Avec / Sans (FR-15, AD-21).**
**Given** un Brouillon `UNILATERAL`
**When** Hermann passe à Avec, puis à Sans, puis de nouveau à Avec
**Then** le passage à Avec écrit `RIGHT_LEFT` (valeur canonique) ; une valeur bilatérale existante (`LEFT_RIGHT` compris) n'est jamais réécrite tant que l'utilisateur ne repasse pas par Sans
**And** `[EN ATTENTE QN-4]` le comportement existant est conservé tel quel : la Pause entre les côtés est copiée depuis le Profil à chaque passage à Avec (P3-10, `setSideMode`), et l'Enchainement est enregistré `BY_SIDE` à N = 1 par `normalizeEffective` (NR Δ24, tests Q38 inchangés)
**And** sous Sans, l'Enchainement et la Pause entre les côtés restent dans le Brouillon, masqués ; un côté non renseigné est normalisé à Sans au ✓ (D-406, existant).

**AC9 — Tests et contrôles.**
**Given** `ExecutionParametersDraft.test.ts`
**When** la story est livrée
**Then** chaque AC est couvert par des tests du domaine, y compris le test d'aller-retour de 1.1 étendu aux nouveaux champs ; aucune interface n'est modifiée
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Hors story :** toute ligne de la Feuille (2.4 à 2.8) ; le champ clavier (2.2).

---

### Story 2.2 : Essai sur iPhone du champ clavier de la charge (NFR-6)

En tant que Hermann,
je veux essayer tôt sur mon iPhone la saisie de la charge au clavier décimal dans la Feuille, avec Précédent / Suivant, « Fermer » et le fond de la cellule active,
afin que la saisie au clavier repose sur la primitive iOS qui fonctionne réellement dans la `Modal` de la Feuille avant d'être généralisée.

**Exigences :** FR-23, FR-24, FR-25 (essai), FR-6 (composant seulement) ; NFR-1, NFR-2, NFR-5, NFR-6, NFR-7 ; Δ29, Δ49 ; NR Δ30 ; §9-8 ; audit PRE-4, action 4.
**Architecture :** AD-26 (dont « Essai précoce »), AD-27 (surface `keyboard`, synchronisation focus / surface, absorption) ; hérités AD-7, AD-15.
**Dépend de :** 2.1.
**Taille :** M.
**UX :** UX-DR5.

**Critères d'acceptation :**

**AC1 — Composant unique et surface `keyboard` (AD-26, AD-27).**
**Given** le composant unique `KeyboardField` (`src/features/activities/`), sur `TextInput` de React Native
**When** il est livré
**Then** il gère un texte local pendant la frappe et appelle **une** transition du Brouillon à la sortie du champ (perte de focus, Précédent / Suivant, « Fermer ») — `setLoadValue` avec `parseLoadText` — sans arrondi pendant la frappe ; une sortie sans changement de valeur ne déclenche aucune transition (`pendingRemoval` préservé)
**And** il accepte aussi le mode texte du libellé de phase (clavier texte, 20 au plus mesurés en points de code par `codePointLength`, jamais par le seul `maxLength`), utilisé en 2.8
**And** `sheetSurface.ts` reste le seul réducteur et reçoit la surface `{ kind: "keyboard", field: { kind: "load"; row: number | "uniform" } | { kind: "phaseLabel"; phase: number } }`, désignée par identité ; `onFocus` est la seule source d'ouverture ; `flushKeyboardField()`, synchrone, est appelée avant toute autre transition du Brouillon ou du réducteur (toucher d'une autre surface, ✓, ✕, glisser, retrait, segmenté) et par `onBlur` (sans effet si déjà fait) ; un flush sur une identité disparue est ignoré ; toute sortie de la surface `keyboard` appelle `blur()`
**And** ✓ et ✕ de la Feuille sont absorbés pendant une surface `keyboard` (Q47 : premier appui = sortie du champ, valeur appliquée ; second appui = validation ou abandon) ; `sheetCommandsAbsorbed` l'inclut
**And** aucune autre valeur ne passe au clavier (NR Δ30).

**AC2 — Barre du clavier décimal (AD-26, FR-24, FR-25, §9-8).**
**Given** des champs de charge `keyboardType="decimal-pad"` sur iOS
**When** un champ prend le focus
**Then** il est relié par `inputAccessoryViewID` à **son propre** `InputAccessoryView` (`nativeID` dérivé de la clé du champ, monté avec lui ; un `nativeID` partagé est interdit) dont le contenu est un seul composant de barre : Précédent, Suivant, et « Fermer » à droite
**And** l'ordre est donné par la fonction pure `loadFieldOrder(draft)` : `[uniform]` en identiques, identités des lignes dans l'ordre courant en variables, `[]` sous Sans ; Précédent / Suivant font flush puis `focus()` du champ voisin sans fermer le clavier ; aux extrémités le bouton est indisponible, sans boucle
**And** « Fermer » fait sortir du champ (valeur appliquée) et ferme le clavier
**And** le fond de la cellule active est dérivé de la surface `keyboard` ouverte, jamais d'un état local du champ, et l'état actif est annoncé (`accessibilityState`) ; Android et web : pas de barre, champs fonctionnels, rendu non recetté.

**AC3 — Visibilité au-dessus du clavier (AD-26, FR-24).**
**Given** la Feuille ouverte et un champ de charge actif
**When** le clavier s'affiche, puis à chaque Précédent / Suivant
**Then** le corps défilant existant (`SheetMotionScrollView`) est le seul défilement, piloté en JavaScript : un espace bas égal à la hauteur du clavier (événements `Keyboard`) est ajouté au contenu ; après `keyboardDidShow` et à chaque Précédent / Suivant, un défilement calculé garde la ligne active, et autant que possible le tableau, au-dessus du clavier avec une marge de 12 ; la ligne active reste toujours visible
**And** `automaticallyAdjustKeyboardInsets` n'est pas utilisé ; aucun nouveau `ScrollView`, aucun `KeyboardAvoidingView` dans la Feuille ; `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260` restent intacts et verts (NFR-2).

**AC4 — Raccordement provisoire pour l'essai.**
**Given** la Feuille actuelle (avant les quatre cadres)
**When** l'essai est monté
**Then** `KeyboardField` est raccordé à la charge réelle du Brouillon (2.1) : une ligne Charge en séries identiques et une colonne Charge dans le tableau variable existant, activées par le `SegmentedControl` existant (variante actuelle), à la première activation 0,25 kg et focus sur le premier champ
**And** cette présentation est provisoire : la ligne, la colonne et leur segmenté définitifs sont livrés par 2.7 ; seuls `KeyboardField`, la barre, la surface `keyboard`, le hook de synchronisation et le défilement sont conservés comme base.

**AC5 — Constats sur iPhone (NFR-6, NFR-5).**
**Given** le dev client existant sur l'iPhone de Hermann, chargé par `npx expo start` depuis ce clone (jamais Expo Go), commit et état de l'arbre consignés
**When** Hermann joue les gestes, ou l'agent en sa présence
**Then** sont constatés et consignés tels quels (réussi, partiel, impossible) : (a) l'accessoire s'affiche dans la `Modal` de la Feuille ; (b) une barre par champ, avec plusieurs champs, un champ ajouté après l'ouverture et un passage Sans → Avec ; (c) Précédent / Suivant clavier ouvert, valeur arrondie appliquée à la sortie (1,3 → 1,5), extrémités indisponibles ; (d) « Fermer » applique et ferme ; (e) fond de la cellule active qui suit le focus, annoncé par VoiceOver ; (f) ligne active visible au-dessus du clavier, marge 12 ; (g) ✓ et ✕ absorbés au premier appui ; (h) toucher une roue pendant la saisie ferme le champ (valeur appliquée) et ouvre la roue dans le même geste
**And** si un nouveau build natif est nécessaire, la story s'arrête et le constat est signalé à Hermann, sans build ni EAS par l'agent.

**AC6 — Décision consignée, sans réimplémentation (AD-26).**
**Given** les constats d'AC5
**When** l'agent clôt la story
**Then** il consigne l'une des issues : **succès** — la base est conservée pour 2.7 et 2.8 ; **repli** — l'accessoire ne s'affiche pas dans la `Modal` (ou un autre constat bloque) : l'écart est signalé à Hermann, aucune barre n'est réimplémentée sans sa décision, et 2.7 et 2.8 restent bloquées jusqu'à son arbitrage
**And** l'application reste verte et utilisable quel que soit le résultat.

**AC7 — Tests et contrôles.**
**Given** les tests Jest
**When** ils s'exécutent
**Then** `sheetSurface.test.ts` couvre la surface `keyboard` (ouverture par focus, une seule surface, flush avant transition, absorption de ✓ / ✕, identité disparue) ; `loadFieldOrder` et la sortie de champ (`parseLoadText`, vide → 0, illisible → valeur précédente) sont testés ; un test vérifie l'absence de `KeyboardAvoidingView` et de nouveau `ScrollView` dans la Feuille
**And** les textes de la barre (Précédent, Suivant, « Fermer ») passent par `src/shared/i18n/`
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (précoce, hors lot) :** `R-2.2-01` à `R-2.2-08` = constats (a) à (h) d'AC5, Feuille ouverte sur un Exercice en séries variables de 4 séries puis en identiques.
**Hors story :** présentation définitive de la charge (2.7) ; libellé de phase (2.8).

---

### Story 2.3 : Variante `inline` du `SegmentedControl`

En tant que Hermann,
je veux que les choix de la Feuille soient des segmentés en ligne, alignés à droite, avec chevron intérieur, police réduite ou lecture seule quand il le faut,
afin que les lignes de la Feuille réutilisent le composant déjà accepté au lieu de popovers et de panneaux.

**Exigences :** FR-27, FR-28 (rendu du chevron), FR-17 (police réduite), FR-20 (lecture seule) ; NFR-1, NFR-3, NFR-7 ; Δ32, Δ33 ; QP5-06.
**Architecture :** AD-24 ; hérités AD-11.
**Dépend de :** rien (placée avant les lignes qui l'utilisent, AD-33).
**Taille :** S.
**UX :** UX-DR1.

**Critères d'acceptation :**

**AC1 — Variante `inline` (AD-24, FR-27, PR-03).**
**Given** `src/shared/ui/SegmentedControl.tsx`
**When** `variant="inline"` est passé
**Then** le contrôle est aligné à droite, sans enveloppe blanche, ses options ont la même largeur ; l'option choisie reçoit le traitement violet existant ; les options non sélectionnées sont en gris regular sur le même fond clair que les champs variables ; les dimensions et la police viennent du relevé Figma (UX-DR1) en constantes locales nommées
**And** les variantes `standard` et `parameters` sont inchangées : leurs tests existants passent sans modification.

**AC2 — Chevron intérieur, police réduite, lecture seule (AD-24, FR-28, FR-17, FR-20).**
**Given** les props optionnelles `chevron?: "up" | "down"` (par option), `compact?: boolean`, `readOnly?: boolean`
**When** elles sont passées
**Then** le chevron est rendu à l'intérieur de l'option, centré avec le libellé, vers le haut ou vers le bas ; `compact` réduit la police sans changer automatiquement la géométrie ; `readOnly` rend un contrôle non interactif, annoncé comme une information non modifiable
**And** `disabled` par option (existant) garde la valeur affichée et expose l'état indisponible (RM-247)
**And** sans ces props, le rendu des autres variantes est identique.

**AC3 — Aucun composant nouveau (QP5-06, NFR-1).**
**Given** la vérification QP5-06 déjà faite par AD-24 (`@expo/ui` 57.0.13 : aucune API documentée pour une option désactivée, un chevron intérieur ou une police par option)
**When** la story est livrée
**Then** aucun second composant segmenté n'est créé, aucun segmenté natif n'est adopté, aucune abstraction nouvelle n'est ajoutée ; `tokens.ts` est inchangé (`tokensSpecification.test.ts` vert)
**And** les tests de `SegmentedControl` couvrent `inline`, `chevron`, `compact`, `readOnly` et une option indisponible (rôle et état accessibles)
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (lot Feuille) :** vue au travers des lignes de 2.4, 2.5, 2.7, 2.8.
**Hors story :** toute ligne de la Feuille.

---

### Story 2.4 : Feuille en quatre cadres, Exécution et Type de série

En tant que Hermann,
je veux une Feuille en quatre cadres, avec le Mode et la Condition d'arrêt en ligne dans le cadre Exécution, le Type de série en ligne avec son chevron, et la ligne de cible masquée à l'échec,
afin de voir d'un coup d'œil si l'Exercice s'arrête à la cible ou à l'échec, sans popover ni panneau.

**Exigences :** FR-19, FR-20, FR-21, FR-22, FR-26, FR-27, FR-28 (Variables), FR-32, FR-44 (Feuille, partie Exécution et Séries) ; NFR-1, NFR-2, NFR-5, NFR-7 ; Δ25, Δ26, Δ27, Δ28, Δ31, Δ32, Δ33, Δ37 ; NR Δ38 ; R-01, R-03, R-09, R-10.
**Architecture :** AD-28 (quatre cadres, repère unique), AD-24, AD-23, AD-27 (retrait de `popover(mode | regime)`) ; hérités AD-7, AD-15, AD-16.
**Dépend de :** 2.1, 2.3.
**Taille :** L.
**UX :** UX-DR1, UX-DR2.
**Questions :** QN-2.

**Critères d'acceptation :**

**AC1 — Quatre cadres (FR-26, AD-28).**
**Given** la Feuille ouverte
**When** elle s'affiche
**Then** elle se compose de quatre `SheetMotionView` gris arrondis, espacés de 8, dans l'ordre Exécution ; Séries ; Côtés ; Cadence et durée ; chaque ligne existante est placée dans son cadre selon FR-26 (les lignes converties par 2.5, 2.7 et 2.8 y gardent leur place actuelle d'ici là)
**And** le gris des cadres est une constante locale nommée relevée sur Figma (UX-DR1) ; les jetons sont inchangés ; les briques `Row`, `ValuePill`, `Separator`, `SheetMotion` et les animations Q39 à Q41 sont réutilisées ; les libellés suivent PR-01
**And** le contenu conditionnel reste dans son cadre, sans chevauchement.

**AC2 — Repère unique des panneaux (AD-28).**
**Given** une ligne d'un cadre quelconque qui ouvre un `AnchoredPanel`
**When** le panneau s'ouvre, y compris après défilement
**Then** sa position est calculée par une seule fonction de la Feuille, dans les coordonnées du contenu défilant (y du cadre mesuré par `onLayout` + y de la ligne dans son cadre) ; `groupBox` et `variableGroupY` en deviennent des cas particuliers ou disparaissent
**And** les panneaux sont rendus au niveau du contenu défilant, hors des cadres, et ne sont jamais découpés par un cadre arrondi
**And** les tests de mise en page (`Sheet:1522`, `:1622`, `:1659`) sont adaptés au nouveau repère, sans affaiblir ce qu'ils prouvent.

**AC3 — Mode en ligne (FR-27, R-01).**
**Given** le cadre Exécution
**When** Hermann touche Durée ou Répétitions
**Then** le Mode est un segmenté `inline`, sans popover ; `NativeRowPopover` et la surface `popover(mode)` sont retirés ; les tests `ExecutionParametersSheet.test.tsx:1257` et `:1368` sont révisés par conception
**And** avec des phases, Répétitions est indisponible et garde la valeur réelle affichée (FR-2) ; la mémoire des cibles par Mode est conservée.

**AC4 — Condition d'arrêt en séries identiques (FR-19, FR-21).**
**Given** des séries identiques
**When** la ligne « Condition d'arrêt » s'affiche dans le cadre Exécution
**Then** c'est un segmenté `inline` : À l'échec à gauche, À la cible à droite, À la cible par défaut ; le choix appelle la transition de 2.1 et s'applique à toutes les séries selon le Mode
**And** à À l'échec, la ligne « Durée d'une série » est masquée en Mode Durée et la ligne « Répétitions » en Mode Répétitions ; au retour à À la cible, la dernière valeur chiffrée connue est restaurée
**And** avec des phases, À l'échec est indisponible et garde la valeur réelle affichée.

**AC5 — Résultat dérivé en séries variables (FR-20, AD-23).**
**Given** des séries variables
**When** la ligne s'affiche, puis après chaque modification de cellule
**Then** elle affiche `stopConditionOf` en `readOnly` : toutes à cible → deux options, À la cible sélectionnée ; toutes à l'échec → deux options, À l'échec sélectionnée ; au moins une de chaque → une seule option « À la cible et à l'échec » ; quand le détail redevient homogène, les deux options réapparaissent avec la sélection correspondante
**And** `[EN ATTENTE QN-2]` une cellule vide n'est comptée ni comme cible, ni comme échec ; sans aucune cellule renseignée, aucun résultat n'est affiché et « — » apparaît
**And** la ligne n'est pas modifiable et sa sémantique accessible est celle d'une information non modifiable ; aucune validation supplémentaire n'est ajoutée ; le rendu (violet atténué, texte blanc) suit le relevé Figma (UX-DR2)
**And** le passage de Variables à Identiques suit la normalisation N1 existante.

**AC6 — Roues sans option d'échec en identiques (FR-22, R-09, R-10).**
**Given** des séries identiques
**When** Hermann ouvre la roue « Durée d'une série » ou « Répétitions »
**Then** ces roues ne proposent plus « À l'échec » (aucune `failureOption`) ; en identiques, `FAILURE` n'est écrit que par la Condition d'arrêt
**And** la roue ouverte depuis une cellule variable garde l'option en tête (Q8) ; la roue native et sa `PickerToolbar` sont conservées ; le choix d'échec dans une cellule ne s'applique qu'à la série éditée et met à jour le résultat dérivé ; « À l'échec » n'est pas une durée nulle et zéro ne code jamais l'échec ; la Pause et les autres paramètres de la série ne changent pas ; le retour à une durée suit les conventions existantes
**And** `NumberWheelPicker.test.tsx:260` et `DurationWheelPicker.test.tsx:371` sont intacts et verts.

**AC7 — Type de série en ligne avec chevron (FR-27, FR-28, R-03).**
**Given** le cadre Séries
**When** Hermann touche Identiques ou Variables
**Then** « Type de série » est un segmenté `inline` ; le panneau du Régime et la surface `popover(regime)` sont retirés ; l'option Variables porte le chevron intérieur, vers le haut si le tableau est déployé, vers le bas sinon ; replier conserve les valeurs et le mode actif ; le `DisclosureControl` indépendant n'est plus utilisé pour cette ligne
**And** avec des phases, Variables est indisponible et garde la valeur réelle affichée.

**AC8 — Hauteur adaptée (FR-32).**
**Given** une ligne ou un tableau replié ou masqué
**When** la Feuille se redimensionne
**Then** aucun espace vide ne reste ; la marge basse reste réduite (PR-04) ; les animations Q39 à Q41 sont conservées.

**AC9 — Lexique et non-régression (FR-44, NR Δ38).**
**Given** `src/shared/i18n/`
**When** la story est livrée
**Then** les clés nouvelles sont ajoutées (Condition d'arrêt, À l'échec, À la cible, « À la cible et à l'échec », Type de série, Identiques, Variables) et les clés devenues orphelines par cette story (popover du Mode, Régime) sont retirées ; les identifiants techniques sont inchangés (D-201) ; aucun libellé « Cible », « Définie » ou « Ordre » n'est réintroduit
**And** Nombre de séries et Pause gardent valeur au repos et ± à l'appui, ✓ / ✕ en deux temps et fond rouge pâle si manquante (Q35, Q37, Q41, Q46, Q47) : leurs tests passent
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (lot Feuille) :** `R-2.4-01` quatre cadres et espacements ; `R-2.4-02` Condition d'arrêt identiques, aller-retour avec restauration de la valeur, en Durée puis en Répétitions ; `R-2.4-03` résultat dérivé en variables : homogène cible, homogène échec, mixte, retour à homogène, cellules vides ; `R-2.4-04` roues en identiques sans « À l'échec », cellule variable avec l'option en tête ; `R-2.4-05` Type de série avec chevron, repli sans perte ; `R-2.4-06` panneaux ancrés à leur ligne dans chaque cadre, après défilement ; `R-2.4-07` VoiceOver sur le résultat dérivé.
**Hors story :** Côtés, Cadence, Durée de l'exercice (2.5) ; cellules du tableau (2.6) ; Charge (2.7) ; Phases (2.8).

---

### Story 2.5 : Côtés Avec / Sans, Enchainement, Cadence et Durée de l'exercice

En tant que Hermann,
je veux décrire un Exercice bilatéral par Avec / Sans, choisir l'Enchainement en ligne, régler la Cadence par un segmenté et replier Compte à rebours et Fin sous « Durée de l'exercice »,
afin de régler les cadres Côtés et Cadence et durée sans désignation anatomique ni panneau.

**Exigences :** FR-15, FR-16 (affichage), FR-17, FR-28 (Avec des côtés), FR-30, FR-31, FR-44 (Feuille, partie Côtés et Cadence) ; NFR-1, NFR-5, NFR-7 ; Δ21, Δ22, Δ23, Δ35, Δ36, Δ46 ; NR Δ24, Δ38 ; R-02, R-04, R-07, R-08, R-11, R-12 ; QP5-07 ; §9-7.
**Architecture :** AD-21, AD-24 (dont `cadenceOptionOf`), AD-27 (retrait de `popover(side | order)`), AD-28 (Durée de l'exercice), AD-32 ; hérités AD-15, AD-16.
**Dépend de :** 2.1, 2.3, 2.4.
**Taille :** M.
**UX :** UX-DR1, UX-DR6.
**Questions :** QN-4.

**Critères d'acceptation :**

**AC1 — Changement de côté (FR-15, FR-16, R-02, R-08).**
**Given** le cadre Côtés
**When** Hermann touche Avec ou Sans
**Then** « Changement de côté » est un segmenté `inline`, Avec à gauche, Sans à droite, sans choix de direction ; le segmenté à trois valeurs dans un `AnchoredPanel` et la surface `popover(side)` sont retirés
**And** Avec porte le chevron intérieur et rend disponibles Enchainement et Pause entre les côtés ; Sans masque ces lignes et conserve leurs valeurs
**And** un Exercice historique `RIGHT_LEFT` ou `LEFT_RIGHT` s'affiche Avec ; son Enchainement enregistré est conservé ; un ✓ sans passage par Sans ne réécrit pas sa valeur
**And** `[EN ATTENTE QN-4]` la copie de la Pause entre les côtés depuis le Profil à chaque passage à Avec (P3-10) est conservée telle quelle ; les deux stratégies (RM-037) sont inchangées.

**AC2 — Enchainement (FR-17, QP5-07, R-04, R-07).**
**Given** le Changement de côté à Avec
**When** N > 1
**Then** la ligne « Enchainement » s'affiche dans le cadre Côtés : segmenté `inline` `compact`, à la largeur Figma, options « Un côté après l'autre » et « Les deux côtés à chaque série », centrées, sans troncature, sans sous-titre D/G ni notation C1S1 ; le panneau de l'Ordre et la surface `popover(order)` sont retirés
**And** à N = 1, la ligne est masquée et l'Enchainement demandé est conservé dans le Brouillon ; `[EN ATTENTE QN-4]` à l'enregistrement, `BY_SIDE` est écrit à N = 1 (comportement existant, NR Δ24, tests Q38 inchangés)
**And** la taille exacte de la police est réglée sur l'appareil, sans changement automatique de géométrie ; la frame `8328:38193` (encore en D1/G1) ne bloque pas (UX-DR6).

**AC3 — Cadence (FR-30, AD-24, R-11, §9-7).**
**Given** le cadre Cadence et durée
**When** la ligne « Cadence » s'affiche
**Then** c'est un segmenté `inline` Autre / 5 s / 2 s / 1 s / Sans, dont l'option affichée est donnée par la fonction pure `cadenceOptionOf(value)` : 0 → Sans, 1 → 1 s, 2 → 2 s, 5 → 5 s, toute autre valeur → Autre
**And** toucher Autre ne change pas la valeur et ouvre la surface `stepper(beep)` existante (± 0..10, pas 1, sans accélération) ; tant qu'elle est ouverte, l'option affichée est Autre ; à sa fermeture, l'affichage revient à `cadenceOptionOf(value)`
**And** aucune valeur personnalisée n'est mémorisée : Sans puis Autre ne restaure rien ; bornes, pas et donnée inchangés (D-312, D-313).

**AC4 — Durée de l'exercice (FR-31, AD-28, R-12).**
**Given** le cadre Cadence et durée
**When** la Feuille s'ouvre
**Then** la ligne s'intitule « Durée de l'exercice » ; son chevron (`DisclosureControl` existant) est placé à 12 du libellé ; la section est repliée par défaut et masque Compte à rebours et Fin d'exercice sans les désactiver ; chevron vers le bas replié, vers le haut déployé
**And** ouvrir ou fermer la section ne modifie pas la valeur de durée et reste indépendant de son édition
**And** si la ligne est absente (RC ligne 11), Compte à rebours et Fin sont directement visibles lorsqu'ils s'appliquent, sans faux total ni autre repli ; dans un Exercice ouvert depuis une Séance, ils restent absents et le chevron ne les réintroduit pas
**And** sont inchangés : le calcul, les natures, `—`, l'affichage à N = 1 (D-384, D-396, D-397), les bornes T(1)..T(99) (Q46), l'ajustement par N avec des phases (§9-4) et RM-218.

**AC5 — Lexique (FR-44, AD-32).**
**Given** `src/shared/i18n/`
**When** la story est livrée
**Then** les clés Changement de côté, Avec, Sans, Enchainement et ses deux options, Cadence et ses options, Durée de l'exercice sont ajoutées
**And** les clés orphelines sont retirées : « Ordre des côtés », sous-titres « (D1 → D2) → (G1 → G2) », libellés anatomiques de `sideModes`, « Bip de cadence », « Durée totale » de la Feuille (la « Durée totale » de la Phrase reste, Q-V3-13) ; `index.test.ts` est adapté ; `SideOrder`, `sideMode` et `target` ne sont pas renommés.

**AC6 — Non-régression et contrôles (NR Δ38).**
**Given** Pause entre les côtés, Compte à rebours et Fin
**When** Hermann les règle
**Then** ils gardent valeur au repos et ± à l'appui, ✓ / ✕ en deux temps, fond rouge pâle si manquante (Q35, Q37, Q41, Q46, Q47)
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (lot Feuille) :** `R-2.5-01` Avec / Sans, lignes masquées puis réaffichées avec leurs valeurs ; `R-2.5-02` Exercice historique `LEFT_RIGHT` affiché Avec, enregistré sans changement ; `R-2.5-03` Enchainement : libellés entiers et centrés, police à régler sur l'appareil, masqué à N = 1 ; `R-2.5-04` Cadence 0, 1, 2, 5 et 7 (Autre), Sans puis Autre ; `R-2.5-05` Durée de l'exercice repliée puis déployée, valeur inchangée, Exercice ouvert depuis une Séance.
**Hors story :** indicateur de côté de la Composition et Phrase (1.2).

---

### Story 2.6 : Tableau des séries sans steppers de cellule, lignes de 36

En tant que Hermann,
je veux un tableau des séries à fond blanc, aux lignes de 36, dont chaque cellule ouvre son propre sélecteur,
afin de régler une série sans les ± permanents et de préparer le tableau des phases sur le même patron.

**Exigences :** FR-29, FR-22 (cellule variable), FR-4 (module partagé) ; NFR-1, NFR-2, NFR-5, NFR-7 ; Δ34 ; NR Δ30, Δ38 ; R-05, R-06 ; QP5-05.
**Architecture :** AD-27 (cellules ouvrantes, `stepper(rowPause)`, extraction des briques du tableau), AD-28 (lignes 36 / 44, cible tactile) ; hérités AD-8, AD-15, AD-16.
**Dépend de :** 2.4.
**Taille :** M.
**UX :** UX-DR3.

**Critères d'acceptation :**

**AC1 — Cible tactile de 36 vérifiée d'abord (FR-29, QP5-05, R-06).**
**Given** le tableau des séries à lignes de 36
**When** la story commence
**Then** Hermann vérifie sur iPhone, avant toute autre géométrie, que les cellules, la poignée de glisser et la croix restent atteignables au doigt et par VoiceOver (NFR-7) ; le constat est consigné tel quel
**And** si la cible de 36 est jugée insuffisante, l'écart est signalé à Hermann et la géométrie suivante attend son arbitrage ; rien n'est décidé d'office.

**AC2 — Rendu du tableau (FR-29, PR-02).**
**Given** des séries variables
**When** le tableau s'affiche
**Then** il a un fond blanc sans contour, contenu dans son cadre sans déborder ni chevaucher les lignes voisines, des lignes de 36 (`TABLE_ROW_HEIGHT`) ; les autres lignes de la Feuille restent à 44
**And** les valeurs sont alignées avec leurs en-têtes, les numéros sont rapprochés des poignées, un espace d'une hauteur de ligne suit la dernière ligne ; les mesures viennent du relevé Figma (UX-DR3) en constantes locales nommées.

**AC3 — Cellules ouvrantes, sans ± permanent (FR-29, AD-27, R-05).**
**Given** une ligne du tableau
**When** Hermann touche une cellule
**Then** aucun stepper permanent n'est rendu dans les cellules ; la cellule Cible ouvre `selector(rowTarget)` dans un `AnchoredPanel` sous la ligne (Q45), avec « À l'échec » en tête (Q8) ; la cellule Pause ouvre `stepper(rowPause)` (`InlineStepper`, mécanisme ± unique) pour cette cellule seule
**And** les surfaces désignent l'identité de la ligne (`rowIds`), jamais son rang ; au plus une surface est ouverte ; toucher une autre surface ferme la première et ouvre l'autre dans le même geste ; « ligne disparue » couvre aussi `stepper(rowPause)`.

**AC4 — Briques partagées (AD-27, FR-4).**
**Given** `DraggableRow`, `RemoveRowButton` et le message d'annulation, aujourd'hui dans `Sheet`
**When** la story est livrée
**Then** ils sont extraits dans un module partagé de `src/features/activities/`, utilisé par le tableau des séries, prêt pour `WorkPhasesTable` (2.8), sans copie
**And** sont conservés : glisser PRE-3, actions accessibles de déplacement et de retrait, croix, « Série supprimée — Annuler » sur fond `#FFF1F0` (Q35), tests 3.6 existants verts (adaptés seulement pour la hauteur et les ± retirés).

**AC5 — Non-régression et contrôles (NR Δ30, Δ38, NFR-2).**
**Given** les roues et steppers
**When** la story est livrée
**Then** aucune valeur ne passe au clavier ; Nombre de séries et Pause commune gardent leurs steppers révélés (C-5) ; `DurationWheelPicker.test.tsx:371-379` et `NumberWheelPicker.test.tsx:260` sont intacts et verts
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone :** `R-2.6-01` (précoce, AC1) cible tactile de 36 ; `R-2.6-02` (lot Feuille) cellule Cible → roue sous la ligne, cellule Pause → ± de la seule cellule, glisser, croix et annulation.
**Hors story :** colonne Charge (2.7) ; tableau des phases (2.8).

---

### Story 2.7 : Charge dans la Feuille, en séries identiques et variables

En tant que Hermann,
je veux noter la charge utilisée, commune en séries identiques ou propre à chaque série, en la saisissant directement au clavier décimal,
afin de garder la trace des kilos sans fenêtre intermédiaire et sans effet sur les calculs.

**Exigences :** FR-10, FR-11, FR-12, FR-13, FR-14, FR-23, FR-24, FR-25, FR-27 (Charge), FR-44 (Charge) ; NFR-1, NFR-5, NFR-6 (généralisation après essai), NFR-7 ; Δ16 à Δ20, Δ29, Δ48, Δ49 ; NR Δ30 ; §9-8, §9-9, §9-10.
**Architecture :** AD-19, AD-26, AD-27, AD-28 (ligne Charge en identiques) ; AD-33.
**Dépend de :** 2.1, 2.2 (issue « succès » consignée), 2.3, 2.4, 2.6.
**Taille :** L.
**UX :** UX-DR5.

**Critères d'acceptation :**

**AC1 — Ligne Charge en séries identiques (FR-12, AD-28).**
**Given** des séries identiques
**When** la Feuille s'affiche
**Then** la ligne « Charge » (segmenté `inline` Avec / Sans, Sans par défaut) suit la Pause dans le cadre Séries ; la présentation provisoire de 2.2 est retirée
**And** Avec ouvre directement la saisie, sans écran intermédiaire : à la première activation la valeur commune vaut 0,25 kg et le focus va au champ commun ; une fois saisie, la valeur remplace Avec dans le segment (`formatLoadKg`, « 20 kg ») et reste éditable : toucher ce segment donne le focus au `KeyboardField` rendu dans la même ligne
**And** la ligne reste disponible quand À l'échec masque la ligne Durée ou Répétitions (FR-21, Δ48).

**AC2 — Ligne et colonne Charge en séries variables (FR-13).**
**Given** des séries variables
**When** la Feuille s'affiche
**Then** la ligne Charge (Avec / Sans) se place sous le tableau ; Avec affiche une colonne Charge au titre non interactif, chaque cellule étant un `KeyboardField` ; Sans masque la colonne et conserve les valeurs
**And** à la première activation chaque ligne vaut 0,25 kg et le focus va au premier champ de ligne
**And** la charge reste attachée à sa série lors d'un déplacement, d'un retrait et de son annulation, d'un ajout de série et d'un passage identiques / variables (2.1).

**AC3 — Saisie dans la cellule (FR-14, FR-23).**
**Given** un champ de charge actif
**When** Hermann tape une valeur puis sort du champ (Précédent, Suivant, « Fermer », toucher ailleurs, ✓)
**Then** la saisie se fait au clavier décimal, sans fenêtre intermédiaire (« Charge — Série 1 » n'existe pas) ; le séparateur « , » ou « . » est accepté ; l'unité kg est affichée, jamais saisie
**And** à la sortie : 1,3 → 1,5 ; 0,01 → 0,25 ; 1,25 → 1,25 ; 0 → 0 ; jamais d'arrondi pendant la frappe ; un champ vidé vaut 0 (pas de charge pour cette série, §9-10) ; un texte illisible ou négatif laisse la valeur précédente
**And** zéro : en identiques, il fait passer à Sans ; en variables, il vaut « sans charge » pour la seule série et la charge reste active tant qu'une série est positive ; toutes à zéro → Sans, appliqué à la fermeture du clavier ou au ✓, jamais pendant Précédent / Suivant ; un zéro saisi n'est jamais remplacé par une ancienne charge
**And** une réactivation restaure les valeurs mémorisées ; toutes nulles → 0,25 kg partout.

**AC4 — Navigation et cellule active (FR-24, FR-25, AD-26).**
**Given** une colonne Charge de quatre séries
**When** Hermann utilise la barre du clavier
**Then** Précédent et Suivant déplacent la saisie entre les seules cellules de charge, dans l'ordre courant des lignes (`loadFieldOrder`), clavier ouvert, valeur atteinte éditable ; aux extrémités le bouton est indisponible, sans boucle ; « Fermer » à droite applique la valeur et ferme le clavier
**And** la cellule active se distingue par sa couleur de fond, qui suit le focus et est annoncée de façon accessible
**And** la ligne active reste visible au-dessus du clavier avec la marge de 12, et autant que possible le tableau (`9292:18077`, UX-DR5) ; une seule surface est ouverte ; ✓ et ✕ sont absorbés au premier appui (Q47)
**And** les roues et steppers des autres cellules ne deviennent pas des champs clavier (NR Δ30).

**AC5 — Indépendance du Mode et conservation (FR-10, Δ48).**
**Given** la charge active
**When** Hermann change de Mode, de Condition d'arrêt ou de nombre de séries
**Then** la charge suit les mêmes règles en Durée et en Répétitions, y compris à l'échec, sans effet sur cibles, durées, cadence, pauses, Condition d'arrêt et Durée de l'exercice
**And** sous Sans, les valeurs sont conservées après ✓, enregistrement et réouverture ; ✕ restaure l'état d'ouverture
**And** les cas Δ48 sont testés dans la Feuille : Répétitions × Identiques, Répétitions × Variables, cible À l'échec avec charge.

**AC6 — Lexique et contrôles (FR-44).**
**Given** `src/shared/i18n/`
**When** la story est livrée
**Then** les clés Charge, kg, Avec / Sans de la charge et le titre de colonne sont ajoutées (Précédent, Suivant et « Fermer » le sont depuis 2.2) ; les clés provisoires de 2.2 devenues orphelines sont retirées
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (lot Feuille) :** `R-2.7-01` identiques : Avec → 0,25 kg et clavier, saisie 1,3 → « 1,5 kg », 0 → Sans ; `R-2.7-02` variables : colonne, Précédent / Suivant, fond actif, « Fermer », ligne active visible ; `R-2.7-03` [0 ; 0 ; 0] → Sans puis réactivation à 0,25 partout ; `R-2.7-04` déplacement d'une série avec sa charge ; `R-2.7-05` Répétitions × Identiques, Répétitions × Variables, À l'échec avec charge ; `R-2.7-06` Sans conserve les valeurs après enregistrement et réouverture ; `R-2.7-07` Phrase de la Carte avec charge (1.2).
**Hors story :** libellé de phase (2.8).

---

### Story 2.8 : Phases de l'exercice dans la Feuille

En tant que Hermann,
je veux décomposer une série en actions chronométrées (par exemple 6 s de descente puis 3 s de maintien), dans un tableau de phases au patron du tableau des séries,
afin que la durée de série soit la somme de ces actions, sans conversion destructive des autres paramètres.

**Exigences :** FR-1 à FR-9, FR-27 (Phases), FR-28 (Avec des phases), FR-29 (tableau des phases), FR-32 (six phases), FR-44 (Phases), FR-45 (roue de phase) ; NFR-1, NFR-2, NFR-5, NFR-7 ; Δ08 à Δ14, Δ40, Δ50 ; NR Δ30, Δ47 ; QP5-03, QP5-04.
**Architecture :** AD-20, AD-25, AD-26 (libellé), AD-27 (`keyboard(phaseLabel)`, `selector(phaseDuration)`, `WorkPhasesTable`), AD-28, AD-31.
**Dépend de :** 2.1, 2.2 (issue « succès »), 2.3, 2.4, 2.6.
**Taille :** L.
**UX :** UX-DR3, UX-DR4.
**Questions :** QN-3.

**Critères d'acceptation :**

**AC1 — Ligne « Phases de l'exercice » (FR-2, FR-4, FR-28).**
**Given** le cadre Séries
**When** la Feuille s'affiche
**Then** la ligne « Phases de l'exercice » (segmenté `inline` Avec / Sans) est en tête du cadre Séries ; l'option Avec porte le chevron intérieur (haut déployé, bas replié ; replier conserve les phases)
**And** Avec n'est disponible que si `canEnableWorkPhases` est vrai (Mode Durée, À la cible, séries identiques effectives) ; sinon il est indisponible et la valeur réelle est affichée
**And** avec des phases, Répétitions, À l'échec et Variables sont indisponibles et gardent leur valeur réelle (RM-247) ; pour changer d'option, Hermann supprime d'abord les phases.

**AC2 — Création et ajout (FR-5, UX-DR4).**
**Given** une Durée d'une série de 9 s et aucune phase
**When** Hermann passe à Avec
**Then** « Phase 1 » est créée avec 9 s ; si la durée vaut « — », « Phase 1 » est créée avec une durée à renseigner sur fond rouge pâle `#FFF1F0`, sans durée inventée
**And** le contrôle d'ajout suit la frame `9207:18817` si son relevé (S-2) l'établit ; à défaut, c'est une ligne d'ajout en fin de tableau ; une phase ajoutée reprend la durée de la dernière ; à six phases l'ajout est indisponible et aucune 7e ligne n'est créée.

**AC3 — Tableau des phases (FR-4, FR-29, AD-27).**
**Given** des phases
**When** le tableau s'affiche
**Then** `WorkPhasesTable` (composant distinct, construit sur les briques partagées de 2.6, sans copie) présente les colonnes Libellé / Durée, avec déplacement, numéro, suppression avec annulation, ligne active ; ni pied, ni ± ; fond blanc, lignes de 36, aucun séparateur après le tableau, un espace d'une hauteur de ligne sous la dernière ligne (PR-02, UX-DR3)
**And** les gestes et les alternatives accessibles du tableau des séries sont réutilisés (CE-UI-10 §13) ; lors d'un déplacement, chaque libellé reste attaché à sa phase
**And** le message d'annulation existant (« … supprimée — Annuler ») sert aux deux tableaux ; une seule annulation est en attente (série ou phase).

**AC4 — Libellé au clavier texte (FR-6, AD-26).**
**Given** une cellule Libellé
**When** Hermann la touche
**Then** le libellé se saisit directement dans la cellule, au clavier texte, par `KeyboardField` (surface `keyboard(phaseLabel)`), limité à 20 caractères comptés en points de code ; le champ se ferme par la touche Retour, sans barre
**And** une cellule vide affiche le libellé par défaut « Phase n » selon la position ; le clavier ne masque ni le champ édité, ni les actions de la Feuille (✓ absorbé au premier appui, Q47).

**AC5 — Durée de phase à la roue (FR-7, FR-45, AD-31).**
**Given** une cellule Durée
**When** Hermann la touche
**Then** elle ouvre `selector(phaseDuration)` : la roue native `DurationWheelPicker` dans `AnchoredPanel`, sous la ligne, bornes 1..3535, pas 1 s, sans option « À l'échec » ; « — » ouvre sur 00:01
**And** aucune borne propre à la phase autre que celle de la somme ; `DurationWheelPicker.test.tsx:371` reste intact.

**AC6 — Durée de série dérivée (FR-3).**
**Given** des phases 6 s et 3 s, 3 séries, Pause 15 s
**When** la Feuille s'affiche
**Then** la ligne « Durée d'une série » montre 9 s en lecture seule, sans arrondi ; la Durée de l'exercice vaut 72 s ; son inversion n'ajuste que N, jamais les phases (§9-4)
**And** les natures de calcul, le symbole et `—` sont inchangés.

**AC7 — Suppression, Avec → Sans, ✓ et ✕ (FR-8, FR-9).**
**Given** des phases
**When** Hermann supprime une phase, supprime la dernière, passe à Sans, valide ou annule
**Then** supprimer une phase retire sa contribution à D ; supprimer la dernière ramène « Aucune » et sa durée devient la durée de série modifiable ; l'annulation restitue ordre, libellés, durées et D
**And** Avec → Sans avec 6 s + 3 s + 5 s donne une durée de série de 14 s, modifiable, autres paramètres conservés ; repasser à Avec crée une seule phase à la durée courante
**And** au ✓ : phases à 0 s ou à renseigner retirées sans message ; libellés vides → « Phase n » selon la position finale ; liste vide → « Aucune » ; somme normalisée > 3 535 s → ✓ indisponible ; `[EN ATTENTE QN-3]` le libellé par défaut est ensuite stocké comme un libellé ordinaire et ne se renumérote plus
**And** ✕ restaure la configuration d'ouverture, phases comprises.

**AC8 — Six phases et défilement (FR-32).**
**Given** six phases
**When** la Feuille s'affiche
**Then** le contenu défile ; la hauteur suit le contenu visible ; un repli ne laisse aucun espace vide.

**AC9 — Persistance, Phrase, consommateurs (FR-39, FR-41, FR-43, NR Δ47).**
**Given** un Exercice à phases validé et enregistré
**When** il est rouvert, copié dans une Séance ou dupliqué
**Then** les phases (identités, libellés, durées) sont conservées (1.1) ; la Phrase de la Carte les détaille (1.2) ; les durées de Séance, les synthèses du Catalogue et de la Composition et la carte du Catalogue lisent D = Σ sans modification.

**AC10 — Lexique et contrôles (FR-44).**
**Given** `src/shared/i18n/`
**When** la story est livrée
**Then** les clés Phases de l'exercice, Libellé, Durée, « Phase n », le contrôle d'ajout et le message de retrait d'une phase sont ajoutés
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (lot Feuille) :** `R-2.8-01` Avec depuis 9 s → « Phase 1 » 9 s ; depuis « — » → durée à renseigner ; `R-2.8-02` ajout jusqu'à six, ajout indisponible ; `R-2.8-03` libellé au clavier texte, 20 caractères, champ visible ; `R-2.8-04` roue de durée de phase à 00:01 ; `R-2.8-05` déplacement avec libellé attaché, suppression et annulation ; `R-2.8-06` Avec → Sans (14 s), retour à Avec ; `R-2.8-07` ✓ avec une phase à 0 et un libellé vide ; ✕ ; `R-2.8-08` options Répétitions, À l'échec, Variables indisponibles avec phases ; `R-2.8-09` six phases, défilement ; `R-2.8-10` Phrase de la Carte avec phases.
**Hors story :** phases dans les formats, moteur d'exécution, annonces (PRD §8).

---

## Epic 3 : Un Éditeur d'Exercice à Description en étapes, conforme à Figma

Hermann écrit la Description pas à pas, voit une Carte allégée et un `Terminer` abaissé qui ne masque jamais le dernier contenu, sur un écran principal aligné sur Figma. L'epic ne dépend que de la story 1.1 ; il peut avancer en parallèle de l'Epic 2.

**Recette du lot Éditeur.** Après la story 3.2, Hermann joue sur iPhone les scénarios de 3.1 et 3.2, ainsi que ceux de 1.2 (Phrase sur la Carte, indicateur de la Composition) et la Phrase avec charge et phases (2.7, 2.8) si l'Epic 2 est livré.

### Story 3.1 : Description en étapes numérotées

En tant que Hermann,
je veux écrire la Description de mes Exercices comme une liste d'étapes numérotées, Entrée créant l'étape suivante,
afin de décrire un Exercice pas à pas, lisiblement, sans gérer moi-même la numérotation.

**Exigences :** FR-33, FR-34, FR-35, FR-44 (invites des étapes) ; NFR-1, NFR-5, NFR-7, NFR-9 (CRLF), NFR-10 ; Δ01, Δ02, Δ03 ; NR Δ07 ; R-13 ; QP5-01, QP5-02 ; §9-2, §9-5, §9-6, §9-7.
**Architecture :** AD-22 ; hérités AD-11.
**Dépend de :** 1.1.
**Taille :** M.
**UX :** UX-DR8.
**Questions :** QN-1.

**Critères d'acceptation :**

**AC1 — État vide et liste remplie (FR-33).**
**Given** un Exercice sans Description
**When** l'Éditeur s'affiche
**Then** la Description présente une seule ligne grise : « 1. » suivi de « Décrivez la première étape », sans ligne d'invitation
**And** dès qu'une étape existe, une ligne d'invitation grise « n. Étape suivante » suit la dernière étape ; il n'y a pas de bouton Ajouter
**And** la présentation suit le Figma courant relevé (UX-DR8, §9-2 : demandes 17 et 21 du registre v25, texte à 14 numéros compris, sans contenant) ; les chiffres sont des propriétés de présentation, en constantes locales nommées, jamais des règles.

**AC2 — Saisie (FR-33, AD-22, §9-5, §9-6).**
**Given** une étape en cours de saisie
**When** Hermann tape Entrée en fin d'étape
**Then** l'étape suivante est créée et reçoit le curseur
**And** Entrée au milieu d'une étape la coupe au curseur (`splitStepAt`) ; un collage sur plusieurs lignes donne une étape par ligne (`insertPastedText`, découpage `/\r?\n/`)
**And** chaque étape existante reste modifiable en place ; il n'y a pas de réordonnancement (modèle A)
**And** retour arrière sur une étape vide la supprime et place le curseur en fin de l'étape précédente
**And** ↑ ferme le clavier (D-351) ; le contenu défile au-dessus du clavier et `Terminer` reste immobile (D-349).

**AC3 — Limite de 1 000 caractères (FR-34, AD-22, §9-7).**
**Given** une Description proche de la limite
**When** Hermann tape ou colle un texte qui la ferait dépasser
**Then** la saisie est refusée en entier, sans troncature, et aucune étape existante n'est modifiée
**And** la mesure est la seule fonction `instructionStepsLength` du codec, en points de code, partagée par l'Éditeur et la validation ; le `maxLength` du `TextInput` n'est pas utilisé pour compter
**And** `[EN ATTENTE QN-1]` la limite porte sur la chaîne encodée, séparateurs compris (au plus n − 1 caractères de moins que la lecture « textes seuls » du PRD), sans migration ; si Hermann retient la lecture du PRD, seule la fonction de comptage change et une `migration011` relâchant le CHECK devient nécessaire (hors de cette story tant que QN-1 n'est pas tranchée).

**AC4 — Terminer, enregistrement et détection de modification (FR-34, AD-22).**
**Given** une liste avec des étapes vides intercalées
**When** Hermann touche `Terminer`
**Then** les étapes vides sont retirées et la liste est renumérotée, l'ordre préservé ; l'Éditeur encode par `encodeInstructionSteps` à ce moment seulement ; `normalizeInstruction` valide la chaîne encodée
**And** l'Éditeur porte `instructionSteps: readonly string[]` dans sa valeur de formulaire ; `formValueEquals` compare les encodages des deux valeurs : une étape vide créée par Entrée n'est pas une modification
**And** les étapes sont relues à la réouverture et transportées par la copie Définition → Séance et par la duplication (`ExerciseEditingPaths.integration.test.tsx`, `copiesAndSnapshots.story13.test.ts`).

**AC5 — Anciennes descriptions (FR-35, NFR-10).**
**Given** un Exercice PRE-4 à Description multiligne
**When** il est ouvert
**Then** son texte est relu par le même décodage, une ligne = une étape, sans migration ni conversion ; un texte à fins de ligne `\r\n` ne crée aucune étape fantôme
**And** aucune autre donnée de l'Exercice n'est touchée.

**AC6 — Accessibilité, lexique, non-régression (FR-44, NR Δ07).**
**Given** VoiceOver
**When** Hermann parcourt la Description
**Then** chaque étape est un champ annoncé avec son numéro ; les invites passent par `src/shared/i18n/` (« Décrivez la première étape », « Étape suivante »)
**And** l'ordre Description → Paramètres d'exécution → Média, le titre « Paramètres d'exécution » (Q11) et la Carte vide sans invite (Q55) sont inchangés ; `ActivityEditorForm.test.tsx` couvre saisie, Entrée, coupure, collage, retour arrière, ↑ et limite
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (lot Éditeur) :** `R-3.1-01` état vide puis trois étapes par Entrée ; `R-3.1-02` Entrée au milieu d'une étape ; collage de trois lignes ; `R-3.1-03` retour arrière sur une étape vide ; `R-3.1-04` ↑, clavier ouvert, curseur visible, `Terminer` immobile ; `R-3.1-05` étapes vides retirées et renumérotées à `Terminer`, réouverture ; `R-3.1-06` saisie refusée à la limite ; `R-3.1-07` ancienne Description multiligne ; `R-3.1-08` présentation conforme au relevé.
**Hors story :** `Terminer` abaissé (3.2).

---

### Story 3.2 : Carte allégée, `Terminer` abaissé et conformité Figma de l'écran principal

En tant que Hermann,
je veux une Carte des paramètres sans Compte à rebours ni Fin, un `Terminer` abaissé qui ne masque jamais le dernier contenu, et un écran principal fidèle à Figma,
afin que l'Éditeur soit fini, lisible et conforme aux références.

**Exigences :** FR-36, FR-37, FR-38, FR-44 (Carte) ; NFR-1, NFR-3, NFR-5, NFR-7, NFR-8 ; Δ04, Δ05, Δ06 ; NR Δ07 ; R-14 ; Q48 ; §9-1.
**Architecture :** AD-30, AD-32 ; hérités AD-11.
**Dépend de :** 1.1, 3.1.
**Taille :** M.
**UX :** UX-DR9, UX-DR10.

**Critères d'acceptation :**

**AC1 — Carte sans Compte à rebours ni Fin (FR-36, R-14).**
**Given** un Exercice avec Compte à rebours et Fin
**When** la Carte s'affiche
**Then** elle ne rend plus `phasesRow` ni `cardSeparator` ; son nom accessible ne contient plus ces deux valeurs
**And** les données, la Feuille, `computeExercisePlanDuration`, la Phrase et sa « Durée totale » (Q-V3-13) sont inchangés
**And** les tests `ActivityEditorForm.test.tsx:327, 374, 668, 737-739, 765, 987-990, 1055` et `EditorAccessibility.story46.test.tsx:454` sont réécrits en conséquence ; les clés `card.countdown` et `card.end` devenues orphelines sont retirées.

**AC2 — `Terminer` abaissé et zone protégée (FR-37, AD-30).**
**Given** l'Éditeur, clavier ouvert puis fermé
**When** Hermann fait défiler jusqu'au dernier contenu
**Then** `Terminer` est placé selon le relevé Figma (UX-DR9) ; une zone réservée au-dessus de lui, sous forme d'espace de défilement, garantit que le dernier contenu n'est jamais masqué
**And** `Terminer` reste hors du `KeyboardAvoidingView` et ne remonte pas avec le clavier (D-349) ; ses couleurs actif et inactif sont conservées ; le test du créneau `finishSlotTestID` est adapté.

**AC3 — Conformité Figma (FR-38, Q48, §9-1).**
**Given** les frames actuelles de l'écran principal, identifiants vérifiés avant usage (S-2)
**When** l'agent relève leurs propriétés en lecture seule (UX-DR10)
**Then** sont alignés : le titre d'en-tête et le Nom, l'accès à la Catégorie et aux Zones, les titres de section, la Carte des modalités, les typographies, couleurs et positions ; les écarts E-V1 à E-V16 retenus sont corrigés
**And** la Classification Catégorie / Zones a une seule forme et deux registres d'état (« à renseigner », « renseigné ») ; rien ne bouge entre les deux états ; le glyphe plein est teinté de la couleur de la Catégorie ; les cibles tactiles sont préservées et ne recouvrent pas le Nom
**And** la Carte des modalités est un bloc `#F9FAFC` (jeton `surfaceSubtle`), de rayon 12, sans liseré
**And** sont conservés : la grille verticale D-327, le libellé accessible « Retour » du ✕ (Q48), le séparateur des Zones (Q49), les comportements de Catégorie et Zones (Q49, Q53), les jetons verrouillés (`tokensSpecification.test.ts` vert)
**And** tout écart dont la correction exigerait un nouveau jeton, le remplacement d'un composant accepté ou une marge contraire à D-327 (par exemple les marges de 4 et 10 du registre face aux 13 de la grille) est soumis à Hermann écart par écart et n'est pas implémenté d'office ; la liste des écarts soumis est consignée dans le fichier de la story.

**AC4 — Non-régression et contrôles (NR Δ07).**
**Given** l'écran principal
**When** la story est livrée
**Then** l'ordre Description → Paramètres d'exécution → Média, le titre « Paramètres d'exécution » (Q11) et la Carte vide sans invite (Q55) sont inchangés ; les tests 4.2 et 4.3 de PRE-4 passent, adaptés seulement pour les écarts corrigés
**And** Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Recette iPhone (lot Éditeur) :** `R-3.2-01` Carte sans Compte à rebours ni Fin, VoiceOver ; `R-3.2-02` `Terminer` abaissé, dernier contenu visible clavier ouvert et fermé ; `R-3.2-03` Classification « à renseigner » puis « renseigné », rien ne bouge ; `R-3.2-04` Carte des modalités ; `R-3.2-05` comparaison visuelle avec les frames relevées, écart par écart.
**Hors story :** toute refonte des écrans voisins (Composition, Catalogue, médias, référentiels).

---

## Questions en attente et points signalés

| ID | Question | Défaut écrit dans les critères | Critères marqués |
|---|---|---|---|
| QN-1 | Limite de 1 000 caractères des étapes : chaîne encodée (CHECK actuel) ou textes seuls (FR-34) ? | Comptée sur la chaîne encodée, séparateurs compris, sans migration. | 1.1 AC9 ; 3.1 AC3 |
| QN-2 | Résultat dérivé AR-01 avec cellules vides en séries variables. | Cellules vides non comptées ; sans aucune cellule renseignée, aucun résultat et « — ». | 1.1 AC8 ; 2.4 AC5 |
| QN-3 | Libellé par défaut « Phase n » après ✓. | Stocké comme un libellé ordinaire, ne se renumérote plus. | 2.1 AC5 ; 2.8 AC7 |
| QN-4 | Pause entre les côtés et Enchainement « conservés » (FR-15, FR-17) face à l'existant. | Existant conservé : copie de la Pause du Profil à chaque passage à Avec (P3-10), `BY_SIDE` enregistré à N = 1 (NR Δ24). | 2.1 AC8 ; 2.5 AC1, AC2 |
| QN-5 (nouvelle) | Phrase, séries variables à charges toutes égales : liste (`(charges : 20, 20, 20 kg)`) ou forme commune (`(charge : 20 kg)`) ? AD-29 rend le cas obligatoire au corpus sans fixer son texte. | Liste des valeurs des séries, dans leur ordre (FR-42 : « les valeurs sont celles des séries »). | 1.2 AC1, AC5 |

**Point signalé — QN-2 et AD-23.** Le défaut de QN-2 retenu ici (cellules vides non comptées ; « — » sans cellule renseignée) diffère de l'`[ASSUMPTION]` d'AD-23 (`INCOMPLETE` dès qu'une `UNSET` existe sans mélange établi, rendu par les deux options non modifiables, aucune sélectionnée). Les critères suivent le défaut de QN-2 ; AD-23 sera aligné sur la réponse de Hermann.

**Points à traiter dans les stories, sans question nouvelle.** §9-1 (écarts Figma exigeant un jeton, un composant ou une marge contraire à D-327) : soumis à Hermann écart par écart en 3.2. Contrôle d'ajout d'une phase (`9207:18817`, `NON VÉRIFIABLE`) : relevé en 2.8, défaut décidé (QP5-04 (b)). Taille de police de l'Enchainement : réglée sur appareil en 2.5. Cible tactile de 36 : constat sur iPhone en 2.6 AC1, arbitrage de Hermann en cas d'insuffisance. Issue de l'essai clavier (2.2) : repli soumis à Hermann.

## Validation finale (étape 4 du skill)

- **Couverture des FR :** les 45 FR sont rattachées à au moins une story, et leurs détails repris dans les critères (carte ci-dessus). Aucune FR non couverte.
- **Couverture des NFR :** les 10 NFR sont rattachées (tableau NFR). NFR-6 a sa story dédiée (2.2), bloquante pour 2.7 et 2.8.
- **UX-DR :** UX-DR1 à UX-DR10 rattachées (1.2, 2.2 à 2.8, 3.1, 3.2).
- **Lignes NR :** Δ07, Δ24, Δ30, Δ38, Δ47 sans story, en critères de non-régression. Δ15 sans objet.
- **Modèle de départ :** aucun (projet existant). **Base de données :** aucune table ni migration créée (AD-18) ; seules les colonnes JSON et texte existantes évoluent, dans la story 1.1 qui en a besoin.
- **Dépendances :** 1.1 → 1.2 ; 1.1 → 2.1 → 2.2 ; 2.3 (sans dépendance) ; 2.1 + 2.3 → 2.4 → 2.5, 2.6 ; 2.1 + 2.2 + 2.3 + 2.4 + 2.6 → 2.7, 2.8 ; 1.1 → 3.1 → 3.2. Aucune dépendance vers une story placée après. L'Epic 3 ne dépend pas de l'Epic 2.
- **Ordre AD-33 :** socle atomique d'abord (1.1) ; transitions du Brouillon (2.1) avant toute story de Feuille ; essai iPhone (2.2) avant la généralisation (2.7, 2.8) ; variante `inline` (2.3) avant ses lignes (2.4 et suivantes).
- **Répétition de fichiers :** `ExecutionParametersSheet.tsx` est modifié par 2.2 et 2.4 à 2.8, dans un seul epic, zone par zone (paramètres et présentation d'une zone dans la même story) ; aucun autre epic ne le réécrit (1.1 n'adapte que des tests de bornes). `ActivityEditorForm.tsx` n'est modifié que par l'Epic 3.
- **Taille :** 1.1, 2.1, 2.4, 2.7 et 2.8 sont L ; 1.1 est atomique par AD-33 et reste réalisable par un seul agent car sans interface.
- **Vérification de préparation (implementation readiness) :** dans BMad 6.12.4 installé, elle n'est pas un skill séparé ; elle est la première partie de `bmad-sprint-planning` (« PASS / CONCERNS / FAIL »). Elle n'a donc pas été lancée (sprint planning hors consigne).

*Exécution autonome : les menus du skill ont été franchis par « Continue » sans validation interactive de Hermann.*

