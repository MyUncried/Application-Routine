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
