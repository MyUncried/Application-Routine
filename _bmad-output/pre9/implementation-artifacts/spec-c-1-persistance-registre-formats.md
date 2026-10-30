# C.1 — Persistance et registre des Formats

Story PRE-9, epic C. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § C.1 ; architecture : `../planning-artifacts/architecture-pre9.md` §3 (migration 017) et §5. Dépend de : A.1 (`done`). Arbitrages : ARB-03, ARB-16, ARB-17, ARB-18b, ARB-25 (décidés) ; ARB-04 (ouvert, non tranché ici).

## Objectif

Porter le Format sur l'élément (Circuit ou Exercice) et l'origine de création sur la Séance, de bout en bout (domaine, brouillon, service, base), et décrire les six Formats dans un registre déclaratif. Aucun changement visible : aucune interface ne crée encore d'élément formaté (C.2 à C.4).

## Critères d'acceptation et preuves

| Critère (epics.md § C.1) | Livré | Preuve |
|---|---|---|
| Format et réglages persistés sur le Circuit ou l'Exercice porteur, relus à l'identique (ARB-03) | `StructureCircuit.format`, `Activity.format`, `CreateSessionActivityInput.format`, `SessionDraftExercise.format` ; colonnes `tours.format_key` / `format_settings`, `activities.format_key` / `format_settings` (migration 017) ; JSON versionné relu strictement | `elementFormats.c1.test.ts` (écriture, relecture, valeurs SQL) |
| Origine de création de la Séance (FMT-02) | `Session.origin`, `StructuredSessionInput.origin`, `SessionDraft.origin` ; `sessions.origin`, écrite à la création seulement | `elementFormats.c1.test.ts`, `formats.c1.test.ts` |
| Élément sans Format libre ; plusieurs éléments formatés par Séance, directement ou dans un Cycle | Format absent = libre (aucune clé ajoutée à la lecture) ; Séance de test : Tabata (Circuit), EMOM (Exercice direct de Cycle), For time (Circuit de Cycle), Exercices libres | `elementFormats.c1.test.ts`, `formats.c1.test.ts` |
| Version de règle figée dans l'instantané seulement (D.2) | Aucune colonne de version de règle | `migration017.test.ts` (colonnes) |
| Registre déclaratif des Formats : paramètres, verrouillage, bornes, porteur, compte du Circuit gouverné ; défauts comme données (ARB-04) | `src/domain/sessions/formats/registry.ts` : six Formats (FMT-01), constantes Tabata (FMT-10) et 30/30 (FMT-19), réglables et valeur calculée EMOM (FMT-20/21), AMRAP (FMT-26), For time (FMT-30/31, ARB-18b), Death by (FMT-33) ; porteurs (Death by à plusieurs Exercices réservé, R-03) ; compte du Circuit Tabata 1 / 8 (FMT-12/13) ; aucun défaut ; `formatDefaultsComplete` (seul Tabata) | `formats.c1.test.ts` |
| Aucun réglage ni compteur de répétition de l'ensemble (ARB-25) | Aucun paramètre de ce type dans le registre | `formats.c1.test.ts` |
| Format conservé par déplacement, insertion dans une autre Séance (ARB-16) et duplication (ARB-17) : aller-retour stockage | Le Format suit l'élément (colonnes de sa ligne) : déplacement d'un Exercice formaté hors d'un Cycle et d'un Circuit formaté vers le niveau principal relus avec leur Format ; duplication de Séance : Formats copiés, identités nouvelles (y compris le Circuit formaté d'une Séance de l'ancien modèle) | `elementFormats.c1.test.ts`, `formats.c1.test.ts` |
| Migration testée en mémoire et sur copie de base | Colonnes additives, aucune ligne touchée, Séances existantes libres et sans origine (FMT-40) ; rouvertes et réenregistrées à l'identique ; échec → annulation, base au schéma 16, reprise au démarrage suivant ; installation neuve | `migration017.test.ts` (base FICHIER au schéma 16, relue par une nouvelle connexion) ; suite des migrations 012–016 |

L'insertion d'un élément formaté dans une autre Séance (ARB-16) n'a pas encore d'opération propre (B.8) ; elle écrira l'élément par le même chemin, Format compris. La preuve de C.1 porte sur le stockage.

## Choix techniques (classe D, aucun effet utilisateur)

- **Contrôle structurel seulement** (`elementFormatViolations`, appliqué par `validateStructuredSessionInput`) : Format connu, porteur admis, réglages connus et réglables, entiers au-dessus de leur borne structurelle. Codes : `UNRECOGNIZED` / `FORBIDDEN_PLACEMENT` sur `element.format` ; `UNRECOGNIZED` / `MUST_BE_ABSENT` / `OUT_OF_RANGE` sur `element.formatSettings` ; `UNRECOGNIZED` sur `session.origin`. Réglages partiels admis (non renseignés). Les règles propres à chaque Format (compte commun, volume non nul, organisation, complétude) relèvent de C.3 ; la compatibilité des déplacements de C.4 (ARB-24).
- **Réglages enregistrés** : seuls les paramètres réglables ; une constante ou une valeur calculée est refusée à l'écriture (FMT-03, FMT-05).
- **Migration 017** additive (`ALTER TABLE`, modèle de la 015) ; listes de la 017 figées dans la migration, égales au registre (test). Lecture d'une clé inconnue ou d'un JSON illisible : erreur de contrat, jamais un élément libre.
- **Ancien port** (`SessionRepository.update`) : refuse une Séance portant un Format (`SessionStructureNotRepresentableError`) plutôt que d'effacer le Format. Aucun appelant de production.
- **Brouillon** : le Circuit d'une disposition de l'ancien modèle garde son Format relu à l'enregistrement ; la duplication conserve la disposition d'un Circuit formaté pour lui attribuer une identité nouvelle avec son Format.
- **Vignettes du Catalogue** (`sessionFormats.ts`, PRE-8) : inchangées ; un test vérifie qu'elles restent alignées sur le registre (clés). Leur disponibilité relève de C.2.

## Synchronisation code / documentation

- **Classe A (conformité)** : constantes et paramètres du registre (FMT-10, FMT-17, FMT-19, FMT-20, FMT-21, FMT-26, FMT-30, FMT-31, FMT-33) ; Séances existantes libres (FMT-40) ; origine distincte du Format (FMT-02) ; aucune version de règle hors instantané (ch09 l.593-598) ; Death by à plusieurs Exercices réservé (R-03).
- **Classe B (évolution validée, ARB-03, ARB-16, ARB-17 — registre ch07 « Arbitrages PRE-9 », DOC.0)** : annotations datées, texte d'origine conservé :
  - ch09 « Formats — données fonctionnelles et invariants » : lignes « Séance | Format facultatif » et « Séance | Réglages de format et organisation applicable » (porteur = élément ; organisation = nature du Circuit ; conservation par insertion et duplication) ;
  - ch10 FMT-01, FMT-03, FMT-04, aux deux endroits (règle et texte consolidé §3.1) ;
  - ch11 « Formats — contrats de services fonctionnels » : opérations par élément, identité fixée à la création de l'élément, origine sur la Séance.
  Recherche ciblée des formulations contraires (« Une séance peut porter », « fixé à la création », « Leur portée est la séance », « Format facultatif ») : aucune autre occurrence normative. Reste à annoter par les stories qui livrent le comportement : FMT-19, FMT-21, FMT-26, FMT-30/31, ch10 l.1545 (C.3) ; CE-FMT-01 §14, CE-FMT-03 §14-16 (C.2 à C.4) ; ch09 l.617 (B.5).
- **Classe D** : migration 017, codage des réglages, contrôle structurel (ci-dessus) ; README de la base complété. Pas d'entrée ch12 (les migrations 014–016 n'y figurent pas non plus).

## À CLARIFIER (ne bloque que l'opération citée)

- **Origine d'une Séance dupliquée** : la duplication (D-188) recopie Étiquette, Composition et paramètres ; elle ne dit rien de l'origine de création. Choix provisoire : l'origine n'est **pas** recopiée (la copie n'est pas créée depuis la grille). Question à Hermann : la copie garde-t-elle l'origine de la Séance source ? Opération concernée : duplication de Séance seulement (classement de la provenance, sans effet de comportement, FMT-02).
- **Table des porteurs** (`architecture-pre9.md` §5, « à confirmer en revue ») : le registre l'applique telle que proposée (un Exercice : porté par l'Exercice ; plusieurs : Circuit ; For time et AMRAP : Circuit à séries groupées seulement). Le changement de porteur reste ARB-27 (C.4).
- **Bornes** : seules des bornes structurelles sont posées (entier ; durée et compte ≥ 1 ; répétitions ≥ 0, zéro admis dans l'échelle For time par ARB-18b). Les bornes fonctionnelles de chaque réglage ne sont pas écrites ; elles seront confrontées aux règles en C.3, sans valeur inventée.
- **ARB-04 (ouvert)** : aucun défaut de réglage. Seul Tabata, sans réglable, a une configuration initiale complète ; les cinq autres Formats restent indisponibles tant que leurs défauts ne sont pas fournis.

## Limites et reports

- Aucune interface ne crée, n'affiche ou n'édite encore un Format : sélection (C.2), paramètres et récapitulatif (C.3), Composition préremplie et verrouillage (C.4). Les vignettes du Catalogue restent indisponibles sauf Libre (Q-E5).
- Nom affiché d'un élément formaté (dérivé de la clé) : C.4.
- Copie de base réelle de l'iPhone non disponible : migration éprouvée sur une base fichier peuplée comme une base d'appareil. Aucune recette iPhone (pas de changement visible) ; prochain point : après B.2.

## Tests

- `tsc --noEmit` et ESLint (`src/domain/sessions`, `src/infrastructure/database`) : sans erreur.
- Nouveaux : `src/domain/sessions/__tests__/formats.c1.test.ts` (11), `src/infrastructure/database/__tests__/elementFormats.c1.test.ts` (9), `migration017.test.ts` (5), `src/features/sessions/__tests__/sessionFormats.c1.test.ts` (1).
- Adaptés (version 17, colonnes ajoutées par la 017) : `migration012`, `migration013`, `migration014`, `migration015`, `migration016`, `migrateDatabase`, `executionParametersV3.roundTrip`.
- Suite complète du projet, un seul processus (`--maxWorkers=1`), le 29/10 : 228 suites, 4 809 tests verts. C.1 passe à `done`.

## Correction du 30/10 — Format porté exclusivement par l'Exercice

> Les mentions « Circuit ou Exercice », « Circuit formaté », « porteurs », « compte du Circuit Tabata 1 / 8 » et « Death by à plusieurs Exercices réservé (R-03) » des sections ci-dessus sont **historiques** (livraison du 29/10) ; elles sont remplacées par la présente section. Texte d'origine conservé.

### Décision de Hermann (30/10/2026, textuelle)

> « Je valide la correction ciblée : l'Exercice est le seul porteur du Format ; le Circuit porte son organisation et son nombre de tours. Aucun Format n'est transmis aux membres par ajout, dépose, déplacement ou duplication. Le Format déjà porté par un Exercice doit être conservé avec ses réglages lorsqu'il est déplacé ou dupliqué, y compris dans un Circuit. »
>
> « Conserver la migration 017 inchangée et laisser les deux colonnes comme vestiges inutilisés. Aucune migration de suppression […]. Retirer leur utilisation du code actif. Leur vacuité sur l'iPhone reste non vérifiée : ne pas la présenter comme un constat acquis. »
>
> « Ne pas reproduire les anciennes restrictions du Circuit porteur sous forme de nouvelles restrictions de compatibilité. Une incompatibilité doit correspondre à une impossibilité ou à une règle métier documentée. […] Si ces sources restent introuvables ou contradictoires, conserver les points précis « À CLARIFIER », sans inventer de règle et sans bloquer les corrections indépendantes. »
>
> « D.1 doit bien prendre en compte le Format de chaque Exercice membre. Il faut supprimer le chemin « Circuit formaté », mais ne pas remplacer le cas cible par un développement fini générique. »
>
> « Ne pas ajouter un paramètre utilisateur « passage » […]. »
>
> « Ne pas annoter globalement ARB-03 et ARB-24 comme remplacés : conserver leurs dispositions conformes et ne superséder que les formulations réellement obsolètes. L'interdiction de transmission reste applicable. »

Décidé, non rouvert : AMRAP groupé — chaque passage recommence un bloc à sa durée configurée complète, sans limite globale entre passages ; AMRAP alterné refusé ; Death by groupé admis, son arrêt termine l'élément et non la Séance ; Death by alterné admis, chaque Death by conserve son horloge propre ; raccordement détaillé des rangs, fenêtres et de la fin d'un membre Death by à instruire pour PRE-10/11. Proposition **non validée** (non appliquée) : « chaque nouvelle exécution [AMRAP / Death by] repart de ses réglages initiaux ».

Source de la matrice : `origin/main:docs/KODJO-PRE9-Arbitrages-Composition-Formats-Consolides-2026-10-30.md` §2.1 (D-02, D-05, D-07, D-08, D-12), §2.2 (D-14 à D-17, D-30), §2.3 (D-26, D-27), §2.4, §2.5 (D-18, D-29), §3. Classe **B** (évolution validée explicitement par Hermann).

### Ce qui change

- **Retiré du code actif** : `StructureCircuit.format` ; `FormatCarrierKind`, `FORMAT_CARRIER_RESERVED`, paramètre de porteur de `elementFormatViolations` ; `carriers` du registre (dont Tabata groupé « Circuit d'un tour » `TOURS: 1` et la réserve R-03 de Death by porté par un Circuit) ; lecture et écriture de `tours.format_key` / `format_settings` par `SqliteSessionRepository` (ni sélectionnées, ni insérées, ni mises à jour) et champs correspondants de `CircuitRow` ; reprise du Format du Circuit par le brouillon (`SessionDraft`, `layoutOperations.currentLayout`) ; cas « Circuit formaté » de la duplication ; chemin « Circuit formaté » de D.1 ; Format de Circuit de l'instantané D.2 ; porteur `EXERCISE_OR_CIRCUIT` de D.3 ; transmission du Format du Circuit aux membres et contrôle « Circuit porteur » de D.4.
- **Entrée non typée** portant un Format sur un Circuit : refusée (`FORBIDDEN_PLACEMENT` sur `element.format`), jamais transmise ; l'instantané ne recopie que l'identité, l'organisation, le compte et les Exercices d'un Circuit.
- **Registre** : `inCircuit` (par organisation `TOURS` = groupées, `SERIES` = alternées) et `circuitCompatibility(key, circuit)` — matrice §2.2 :

| Format de l'Exercice | Circuit groupé | Circuit alterné |
|---|---|---|
| Tabata | Admis, quel que soit le compte (D-15) | Admis si N = 8, refusé sinon (D-16, FMT-13) |
| Intervalles 30/30 | Admis (D-15) | Refusé (D-16) |
| EMOM | Admis (D-15) | Admis ; le N réglable de l'Exercice s'adapte à celui du Circuit (D-16, D-07) — adaptation par le geste de dépose (C.4), aucun contrôle ajouté |
| AMRAP | Admis ; durée configurée complète à chaque passage (D-15, D-30) | Refusé (D-16) |
| For time | Admis (D-15) | **Non décidé (`UNDECIDED`)** — jamais bloquant, signalé |
| Death by | Admis ; arrêt = fin de l'élément (D-15, D-18) | Admis (D-16, D-29) |

- **D.1** : chaque Exercice membre est développé selon son propre Format, rattaché à lui-même (`formattedElementId` = l'Exercice). Groupé : à chaque passage, bloc complet de chaque membre (séries d'un membre fini ; segment progressif d'un AMRAP ou d'un Death by, un par passage, jamais un développement fini générique). Alterné : au tour i, série i de chaque membre fini (Tabata N = 8 : A1 B1 … A8 B8, distinct de deux Tabata successifs A1…A8 B1…B8) ; segment d'un membre progressif à chaque tour. Le segment porte `openQuestion` lorsque son comportement n'est pas décidé.
- **D.4** : motif `INCOMPATIBLE_CIRCUIT` (Exercice formaté refusé par l'organisation ou le compte de **son** Circuit) ; `openQuestions` (combinaison `UNDECIDED`, non bloquante, présent seulement s'il y en a). Plus de contrôle du « Circuit porteur ».

### Ce qui est conservé

Tout le côté Exercice : `activities.format_key` / `format_settings`, codage versionné et lecture stricte, origine de création, clone et égalité des réglages, conservation par déplacement (Circuit compris) et duplication ; paramètres, constantes, verrouillages et bornes du registre (inchangés) ; migration 017 **inchangée** (aucune nouvelle migration). Les colonnes `tours.format_*` restent des **vestiges inutilisés** : une valeur éventuellement présente n'est ni lue, ni interprétée, ni effacée (la mise à jour d'un Circuit ne touche plus ces colonnes). **Leur vacuité sur l'iPhone n'est pas vérifiée.** Choix technique (classe D) : pas de lecture défensive qui lèverait une erreur de contrat sur une valeur non nulle — elle rendrait illisible une Séance pour une donnée que le code n'utilise plus. Restriction existante conservée, à arbitrer : `layoutOperations.eligibleExercise` refuse toujours de poser un Circuit sur un Exercice formaté (ARB-27, C.4) ; la matrice D-15 l'admettrait en groupé — non modifiée ici (hors des sites corrigés, aucun effet visible tant qu'aucun Exercice formaté ne se crée dans l'interface).

### À CLARIFIER (ne bloque que l'opération citée)

1. **For time en Circuit alterné** : refusé par main (§2.2, D-13, D-16), admis par la branche non fusionnée `docs/for-time-organisation-alternee-20261030` (A21 B21 A15 B15 A9 B9). Valeur `UNDECIDED`, non bloquante.
2. **Échelle For time dans un Circuit** : rejouée en entier à chaque passage (main) ou indexée par passage du Circuit (branche non fusionnée). D.1 ne lit pas l'échelle (séries ordinaires de l'Exercice) ; aucune des deux lectures n'est encodée.
3. **Death by groupé, passage suivant** : rang de reprise (rang initial ou poursuite) — aucune règle retrouvée ; la proposition « repart de ses réglages initiaux » n'est pas validée. Porté par `openQuestion` du segment et par D.3.
4. **Membre progressif d'un Circuit alterné** (Death by admis ; AMRAP refusé) : unité exécutée à chaque tour, raccordement des rangs, fenêtres et de la fin du membre — PRE-10/11 (D-29). D.1 produit un segment par tour, avec `openQuestion`.
5. **EMOM alterné** : l'adaptation de N à celui du Circuit (D-16) est un geste de dépose (C.4) ; un écart N ≠ compte du Circuit n'est pas contrôlé par D.4 (aucune règle de validité écrite).
6. **Origine d'une Séance dupliquée** (inchangé, voir plus haut).

### Synchronisation code / documentation (classe B)

- ch07 : ARB-03 — seule la phrase du porteur annotée ; ARB-24 — seule la phrase de transmission (« Circuit formaté », valeurs imposées) annotée ; dispositions conformes et interdiction de transmission conservées.
- ch09 l.594 et l.596, ch10 FMT-01, FMT-03, FMT-04 (règle et texte consolidé), ch11 l.322 : annotations « Circuit ou Exercice » / « Circuit formaté » datées du 30/10, texte d'origine conservé.
- `src/infrastructure/database/constants.ts` et `README.md` : note des vestiges `tours.format_*`.
- **`architecture-pre9.md` §7 (porteur « Exercice ou Circuit »)** : aucun patch préparé — la source la plus récente, `origin/main` @ `1810d9f0` (30/10 16:26, postérieure à `2b7ba4fa` et dont `2b7ba4fa` n'est pas ancêtre), porte déjà « Le porteur est toujours l'Exercice » et la colonne Porteur = Exercice pour les six Formats (la branche non fusionnée `docs/for-time-organisation-alternee-20261030` @ `f229c761` aussi). La copie locale de cette branche (§7 l.95-99, ligne `structure.ts` l.20) reste à l'ancien texte : à reprendre de main à l'intégration, sans annotation ici.
- **Intégration avec main** : main a déjà réécrit FMT-01 (« Un Circuit ne porte aucun Format propre ») et intégré les décisions consolidées ; les annotations du 30/10 de cette branche (ch07, ch09, ch10, ch11) sont transitoires et entreront en conflit textuel à l'intégration — retenir le texte de main là où il couvre la même règle.

### Tests de la correction

Adaptés et ajoutés : `formats.c1` (14), `elementFormats.c1` (10, SQLite réelle), `planExpansion.d1` (14), `sessionSnapshot.d2` (6), `formatCapabilities.d3` (4), `configurationValidity.d4` (8). Relancés sans changement : `migration017`, `SqliteSessionRepository`, `sessionStructure.a4`, `cycleMembers.a1`, `sessionLifecycle.e5`, `mfnServices.a13`, `layoutOperations.b2`, `layoutOperations.b1b`, `structure.a1`, `structure.a2`, `SessionDraft`, `sessionFormats.c1`. `tsc --noEmit` et ESLint (fichiers modifiés) sans erreur. Suite complète : à lancer par Hermann.
