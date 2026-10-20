# PRE-5 BMAD — Corrections après la revue indépendante du 2026-10-19

**Clone :** `C:\Dev\KODJO-BMAD-PRE5`, branche `bmad/pre5-depuis-pre4`, HEAD `0119438b` (aucun commit créé).
**Origine :** revue indépendante (verdict REVISE) et décisions de Hermann du 19/10 (C1 à C9).
**Méthode :** corrections ciblées par Edit. Le découpage en 3 epics et 12 stories, les identifiants (FR-n, AD-n, Δnn, R-nn) et les noms de fichiers sont conservés. Aucun titre de story ne change : `sprint-status.yaml` n'est pas modifié. Ni `src/`, ni `app/`, ni les tests ne sont touchés.

**Validation de QR-1 et QR-2.** Hermann a validé QR-1 et QR-2 le 19/10, avec les défauts proposés. Tous les marqueurs `[EN ATTENTE QR-1]` et `[EN ATTENTE QR-2]` sont remplacés par « (QR-n validée par Hermann le 19/10) » dans `table-delta.md`, le PRD, le spine et les epics. Dans D-432 de `docs/`, ces règles sont écrites comme validées : D-432 ne contient plus aucun point en attente.

## 1. Corrections par point

### C1 — Enchainement (D-431)

**Code relevé.** `src/shared/i18n/index.ts:84` contient déjà les deux notations, utilisées comme sous-titres :

- `sideOrderSubtitles: { BY_SIDE: "(D1 → D2) → (G1 → G2)", BY_SERIES: "(D1 → G1) → (D2 → G2)" }`, affichés par `Sheet:1212-1214` ;
- seule la flèche centrale diffère : `→` dans le code, `➜` dans Figma.

C'est une **réutilisation**, ce que Δ23 indique désormais.

| Fichier | Section | Avant → après |
|---|---|---|
| `table-delta.md` | Δ23 | Libellé et sous-titres neutres, contrôle selon arbitrage, bloqué par QP5-07 → notations exactes de `8328:38193`, dans l'ordre, dans un segmenté. Code réutilisé (`sideOrderSubtitles`, flèche centrale alignée). Libellés longs retirés du contrôle, mais conservés comme nom accessible. D-407 maintenu. Plus aucun blocage. |
| `table-delta.md` | R-07 | « notation sans direction » → options réduites à la notation graphique Figma (D-431). |
| `table-delta.md` | §6 QP5-07 | « Décidé », libellés longs → « Décidé, révisée par Hermann (revue du 19/10) ». Le texte initial est marqué comme remplacé et la révision est écrite. |
| `table-delta.md` | §6, nouvelle sous-section « Décisions de la revue indépendante du 19/10 » | Ajout de C1. |
| `prd.md` | Glossaire, Enchainement | Deux libellés longs → deux stratégies présentées par leur notation graphique (D-431). |
| `prd.md` | FR-17 | Libellés longs définitifs, aucun sous-titre D/G → notations exactes dans l'ordre. Libellés longs hors du contrôle (nom accessible seulement). Police réduite seulement si nécessaire. D-407 et neutralité de la Phrase, de la Composition et de l'exécution rappelées. Mention de la réutilisation. |
| `prd.md` | §7 R-07 ; FR-44 | « libellés de QP5-07 » → notation graphique ; `sideOrderSubtitles` n'est plus orpheline. |
| `ARCHITECTURE-SPINE.md` | AD-21 | Nouvelle règle « Options de l'Enchainement » : texte visible = `sideOrderSubtitles` avec `➜`, nom accessible = `sideOrders`. |
| `ARCHITECTURE-SPINE.md` | AD-32 | « clés orphelines (sous-titres D/G…) », « D1/G1 » interdit → D1/G1 admis seulement dans la notation de l'Enchainement ; `sideOrderSubtitles` conservée ; « Ordre des côtés » remplacé par « Enchainement ». |
| `epics.md` | FR-17, FR-44, AR-21, UX-DR6 | Alignés sur D-431. |
| `epics.md` | 2.5 AC2, AC5, `R-2.5-03` | Libellés longs, police réduite → notations exactes, réutilisation de `sideOrderSubtitles`, nom accessible neutre, police réduite seulement si nécessaire. Les clés retirées excluent désormais les sous-titres. |

### C2 — Contrôle des phases (D-432)

| Fichier | Section | Avant → après |
|---|---|---|
| `table-delta.md` | Δ10 | Avec crée « Phase 1 », ajout copie la dernière durée, bloqué par QP5-04 (b)(c) → « n phases », `InlineStepper` 2..6 révélé au toucher, chevron graphique, tableau de n lignes, deux phases à l'activation. Code réutilisé : `InlineStepper` (`ProfileStepper.tsx:207`), `RevealStepper` (`Sheet:2233`), icône `control-chevron-up/down` (`DisclosureControl.tsx:105`). Plus aucun blocage. |
| `table-delta.md` | Δ11 | Ajout : libellé au clavier texte, fermé par Retour, indépendant de l'essai du clavier décimal. |
| `table-delta.md` | Δ14 | Ajout de la règle de QR-2. |
| `table-delta.md` | §6 QP5-04 | « revenir à Avec crée une seule phase » → marqué remplacé par D-432 (deux phases). |
| `table-delta.md` | §6, nouvelles sous-sections | « Décisions de la revue… » (C2 complet) et « Incompatibilités du contrôle 2–6 » (QR-1, QR-2, validées). |
| `prd.md` | Préséance | Ajout d'un niveau 0 : les décisions de la revue (D-431, D-432) priment sur tout. |
| `prd.md` | Glossaire, Phase ; FR-1 | Ajout : le contrôle règle de 2 à 6 ; le modèle admet toujours une seule phase. |
| `prd.md` | FR-4 | Avec / Sans + chevron intérieur + tableau Libellé / Durée → segment « n phases », stepper 2..6, chevron graphique (comportement complet), tableau de n lignes (poignée, numéro, libellé, durée, ✕). Interdits explicites. Référence `9207:18817` vérifiée par Hermann. |
| `prd.md` | FR-5 | « Phase 1 », contrôle d'ajout `NON VÉRIFIABLE` → deux phases, stepper + et −, stepper seul contrôle d'ajout. La durée imposée est conservée mais non développée, et non généralisée à la durée libre. |
| `prd.md` | FR-8 | Supprimer la dernière ramène à « Aucune » ; repasser à Avec crée une seule phase → croix indisponible à 2 (QR-1) ; repasser à Avec crée deux phases. |
| `prd.md` | FR-9 | Ajout de QR-2. Les règles existantes de normalisation et de validation sont préservées. |
| `prd.md` | FR-28 | Ajout : chevron graphique, à droite du nombre. |
| `prd.md` | §9 | Le contrôle d'ajout `NON VÉRIFIABLE` → tranché par D-432. Ajout d'un bloc « Incompatibilités du contrôle 2–6 ». |
| `ARCHITECTURE-SPINE.md` | AD-20 | Avec → une phase ; ajout refusé à 6 ; table d'appels → Avec → deux phases ; `setWorkPhaseCount(n)` 2..6 ; croix refusée à 2 ; table d'appels revue ; `normalizeWorkPhases` avec QR-2 ; `WORK_PHASE_LIMITS.controlMinCount = 2` (contrôle seulement) ; dernière phase calculée réservée aux formats. |
| `ARCHITECTURE-SPINE.md` | AD-16 hérité, AD-24, AD-25, AD-27, AD-28 | Stepper du nombre de phases ; chevron graphique `KodjoIcon` et `onChevronPress` ; `selectedContent` ; retrait par − via `pendingRemoval` ; surface `stepper(phaseCount)` (nouvelle valeur de `SheetStepperField`, `sheetSurface.ts:39`) ; ligne Phases ; cas de test `[9, null]`. |
| `ARCHITECTURE-SPINE.md` | Questions ouvertes | Ajout de QR-1 et QR-2 (validées). |
| `epics.md` | FR-1, FR-4, FR-5, FR-8, FR-9, FR-28, AR-20, AR-24, AR-27, UX-DR4 | Alignés sur D-432. |
| `epics.md` | 2.1 AC2, AC3, AC4, AC5 | Une phase → deux ; `setWorkPhaseCount` ; croix refusée à 2 ; retour à Avec → deux phases ; cas `[9, null]`. |
| `epics.md` | 2.3 AC2, AC3 | Chevron graphique, appui distinct, `selectedContent`. |
| `epics.md` | 2.8 | AC2 réécrit (segment, stepper, chevron) ; AC3 (création et stepper) ; nouveau AC3b (tableau, croix) ; AC7 (Avec → Sans, QR-2) ; AC10 (lexique) ; recette `R-2.8-01`, `R-2.8-02`, nouveau `R-2.8-11`. Les ACs ne sont pas renumérotés. |
| `epics.md` | Table des questions | Ajout de QR-1 et QR-2 (validées). |

### C3 — Nombre de séries (non-régression impérative)

| Fichier | Section | Avant → après |
|---|---|---|
| `table-delta.md` | Δ38 | NR → NR + règle impérative : stepper conservé à l'identique, tableau qui suit N, aucune roulette ni clavier, critère de recette explicite. |
| `prd.md` | §6 Δ38 | Même ajout. |
| `ARCHITECTURE-SPINE.md` | AD-16 hérité, AD-28 | Même règle, `RevealStepper` `Sheet:993`. |
| `epics.md` | Conventions communes | Nouvelle puce « Nombre de séries (NR Δ38, impératif) ». |
| `epics.md` | Carte NR | Δ38 précisé. |
| `epics.md` | 2.4 AC9 | Critère explicite + nouvelle recette `R-2.4-08`. |
| `epics.md` | 2.5 AC6 | Nombre de séries ajouté au critère. |
| `epics.md` | 2.6 AC5 | Critère explicite (le tableau suit N) + nouvelle recette `R-2.6-03`. |
| `epics.md` | Recette du lot Feuille | Mention de `R-2.4-08`. |

### C4 — Charge et clavier

**Ce qu'imposent AD-26 et AD-27 au libellé de phase.** Le libellé utilise bien `KeyboardField`, en mode texte, avec la surface `keyboard(phaseLabel)`. Il ne dépend que :

- du texte local ;
- de la sortie de champ ;
- du réducteur de surfaces.

Il n'utilise ni barre ni `InputAccessoryView`. Le découplage est donc écrit : seule la story 2.7 attend l'issue de l'essai. La story 2.8 attend seulement la livraison du composant par 2.2.

| Fichier | Section | Avant → après |
|---|---|---|
| `table-delta.md` | Δ29, Δ49 | Ajout de l'indépendance et de l'essai sur les composants définitifs. |
| `prd.md` | FR-6, NFR-6 | Ajout : fermeture par Retour, indépendance, essai sur les composants définitifs. |
| `addendum.md` | Q-A7 | « Le prototype est recetté tôt » → les composants définitifs sont recettés tôt, et le libellé est indépendant. |
| `ARCHITECTURE-SPINE.md` | AD-26 | Essai « avant toute story qui généralise » → essai avant la story Charge, sur les composants définitifs. Le repli ne bloque que la charge. Le libellé est découplé. |
| `ARCHITECTURE-SPINE.md` | AD-33 | Même correction, et schéma mermaid revu. |
| `epics.md` | FR-6, AR-26, AR-33 ; tables FR-6 et NFR-6 | Alignés. |
| `epics.md` | 2.2 | Énoncé revu. AC1 : mode texte indépendant. AC4 « Raccordement provisoire » → « Composants définitifs, sans interface provisoire ». AC6 : « 2.7 et 2.8 bloquées » → seule 2.7 attend. |
| `epics.md` | 2.7 AC1, AC6 | « Présentation provisoire retirée » → composants conservés tels quels, segmenté passé en `inline`. |
| `epics.md` | 2.8 | « Dépend de » et AC4 : indépendance explicite. |
| `epics.md` | Epic 2, Recette, Validation finale | Dépendances corrigées. |

**Règles inchangées, vérifiées :** FR-10 à FR-14, FR-24, FR-25 et Δ48. Elles couvrent :

- une charge identique en modes Durée et Répétitions ;
- une charge commune ou par série ;
- la compatibilité avec la cible À l'échec ;
- l'absence d'effet sur les calculs ;
- Précédent / Suivant, le fond actif et le tableau visible au-dessus du clavier.

### C5 — `SegmentedControl`

Vérification faite : aucun texte n'annonce un remplacement systématique par le natif.

- FR-27, NFR-1, AD-24 et 2.3 AC3 disent tous que le contrôle existant est réutilisé.
- Le natif n'est adopté qu'après vérification, et il n'a pas été retenu.

Seul ajout : une phrase explicite en 2.3 AC3.

### C6 — Description et QN-1

| Fichier | Section | Avant → après |
|---|---|---|
| `ARCHITECTURE-SPINE.md` | AD-22 | « Différence avec FR-34 … question QN-1 … `migration011` » → phrase factuelle : chaîne encodée, sans migration, les séparateurs ne sont pas de la numérotation générée. |
| `ARCHITECTURE-SPINE.md` | Questions ouvertes, QN-1 | « Bloque : Oui, pour la story Description » → décidée, « Non ». |
| `epics.md` | Mode d'exécution (l. 20), FR-34 | QN-1 rendue factuelle. |
| `epics.md` | 1.1 Questions ; 3.1 Questions | « QN-1 » → « aucune en attente ». |
| `epics.md` | 3.1 AC3 | Phrase conditionnelle (`migration011`) supprimée et remplacée par une phrase factuelle. |
| `epics.md` | Table QN | QN-1 marquée « non bloquante ». |
| `prd.md` | FR-34 | Ajout de la phrase factuelle. |
| `table-delta.md` | §6, ligne QN | Ajout : les séparateurs ne sont pas de la numérotation générée. |

L'ordre de l'éditeur (Description avant Paramètres) est déjà conforme : NR Δ07, inchangé.

### C7 — Durées et Phrase

Cohérence vérifiée, sans changement de fond :

- D-430 : FR-45, AD-31, 1.1 AC10 ;
- somme des phases limitée à 3 535 s : FR-3, AD-20, AD-25 ;
- 276 formulations : FR-42, AD-29 ;
- parenthèse des phases : FR-43, §4.1, 1.2 AC2.

Les deux phases créées à l'activation passent par `deriveSeriesDuration`, avec `null` compté pour 0. La somme reste soumise à 1..3535 après normalisation.

### C8 — Périmètre technique minimal et AD-21

**Réexamen.** `LedgerSide = "NONE" | "RIGHT" | "LEFT"` (`executionCalculations.ts:34`) :

- n'est utilisé que dans `buildExecutionLedger` (`:135-160`) ;
- n'est lu par aucun module de production (`grep` sur `.side` et `LedgerSide`) ;
- n'est ni affiché, ni persisté, ni annoncé ;
- n'influe pas sur les durées.

Le test `ExecutionParametersDraft.test.ts:1031-1035` en dépend.

**Conclusion :** le passage en ordinal n'est pas nécessaire. La neutralité ne concerne que l'affichage (Phrase, lexique, indicateur de la Composition). AD-21 devient « neutralité d'affichage seulement », et `executionCalculations.ts` n'est pas modifié pour les côtés.

| Fichier | Section | Avant → après |
|---|---|---|
| `ARCHITECTURE-SPINE.md` | AD-21 | « `LedgerSide` devient ordinal » → `LedgerSide` inchangé, avec justification. « Écart / tension : QN-4 » → QN-4 décidée. |
| `ARCHITECTURE-SPINE.md` | Structural Seed, Capability Map | `executionCalculations (LedgerSide ordinal)` retiré. |
| `epics.md` | AR-21 ; 1.2 « Architecture » | Alignés. |
| `epics.md` | 1.2 AC4 | « `LedgerSide` devient ordinal » → non modifié, tests passant sans changement lié aux côtés. |
| `epics.md` | 1.2 AC6 | Ajout : instantanés touchés pour le transport seulement. |
| `table-delta.md` | Δ43, Δ45 | Justification ajoutée ; « aucune refonte de la Composition ». |
| `addendum.md` | Q-A4 | Le registre de durée est noté « inchangé (AD-21) ». |
| `prd.md` | §8 | Ajout de la phrase « La persistance des phases ne vaut pas livraison de leur exécution. », et de puces Formats (non généralisé), Planification, Calculs / Composition / instantanés au strict nécessaire. |

### C9 — Documentation applicable (`docs/Specifications-fonctionnelles/`)

D-431 et D-432 étaient libres : D-430 était la dernière décision, et aucune annexe ne référence D-43x. Les décisions suivent le format des D-427 à D-430 : `### D-xxx — Titre`, suivi d'un paragraphe.

| Fichier : ligne | Avant | Après |
|---|---|---|
| `07 – Registre des décisions de conception.md:20-25` | (absent) | Ajout de `### D-431 — Notation graphique de l'Enchainement` et de `### D-432 — Contrôle des phases de l'exercice`, QR-1 et QR-2 écrites comme validées par Hermann le 19/10/2026. |
| `07 – …:762-763` | Intégration du 18/10 seule | Ajout d'un paragraphe « Intégration du 19/10/2026 : D-432 remplace sur ces points D-371… ». |
| `08 – Conception fonctionnelle détaillée.md:252` | « Choisir Avec crée la première phase, reprend la durée… “Phase 1” » | Deux phases, « n phases », chevron graphique, stepper 2..6, + et −. |
| `08 – …:254` | Chevron et tableau (déplacement, numéro…) | Le chevron replie sans changer le nombre ; tableau de n lignes (poignée, numéro, Libellé, Durée, croix), sans ligne d'ajout ni +/−. |
| `08 – …:256` | « une phase ajoutée reprend… » | « … (stepper +, D-432) … ». |
| `08 – …:260` | Retrait des phases à 0 s | Ajout de QR-2 (validée). |
| `08 – …:264` | Suppression de la dernière → Sans | Ajout : le contrôle ne descend pas sous 2, croix indisponible à 2 (QR-1, validée). |
| `08 – …:377` | Enchainement « notation Figma à flèches (RM-243) » | Ajout des deux notations exactes et de « sans libellé long (D-431) ». |
| `10 – Processus métier et règles métier transverses.md:381` (RM-243) | « conservent leur notation Figma à flèches » | Ajout des notations exactes, du caractère graphique et de D-431. |
| `10 – …:397` (RM-247) | Chevron des phases dans l'option Avec | Ajout : à droite du nombre, visible stepper replié, graphique (D-432). |
| `13 – Contrats d'écran.md:1067` | « ajout limité à 6 phases » | « nombre de phases réglé de 2 à 6 par le stepper de l'option Avec (D-432) ». |
| `13 – …:1118` | « Avec crée Phase1 à la durée actuelle (D-410). Ajout libre copie… » | Deux phases, stepper + et −, croix à 2, QR-1 et QR-2 validées ; le reste (formats) est inchangé. |
| `13 – …:1191` (RC ligne 2b) | Segmenté Avec / Sans, chevron, tableau sans +/− | « n phases », stepper 2..6, chevron graphique, tableau de n lignes. |
| `13 – …:1197` (RC ligne 8) | « deux options à la notation Figma (RM-243) » | Notations exactes, sans libellé long, police réduite si nécessaire (D-431). |
| `13 – …:4842` | « Enchainement 14 px + sous-titre 11 px. » | Ajout : « depuis D-431, les options ne portent plus que leur notation Figma ». |

Ni les archives, ni `docs/preparation/PRE-4/**`, ni l'historique ne sont touchés.

## 2. Table des deltas actualisée (lignes modifiées)

| Δ | Code réutilisé | Changement nécessaire |
|---|---|---|
| Δ10 | `VariableTable` et ses briques (`Sheet:1825-1995`) ; `InlineStepper` (`ProfileStepper.tsx:207`) ; `RevealStepper` (`Sheet:2233-2299`) ; `KodjoIcon` `control-chevron-up/down` (`DisclosureControl.tsx:105`) | Segment Avec « n phases » + stepper 2..6 + chevron graphique ; tableau de n lignes ; deux phases à l'activation ; + et − ; QR-1. |
| Δ11 | — (aucun `TextInput` dans la Feuille) | Champ texte de cellule, fermé par Retour, sans barre, indépendant de l'essai décimal. |
| Δ14 | `commitSheetDraft` → `validateForSave` | Normalisation au ✓ + QR-2. |
| Δ23 | `sideOrderSubtitles` (`index.ts:84`), `sideOrders` (`:77`), panneau `Sheet:1198-1227` | Notations exactes en options d'un segmenté (flèche centrale `➜`) ; libellés longs en nom accessible ; libellé « Enchainement ». |
| Δ29 | Patrons clavier existants, `sheetSurface.ts` | Un problème du seul clavier décimal ne bloque que la charge. |
| Δ38 (NR) | `RevealStepper` `Sheet:993` | Aucun : conservation impérative du stepper Nombre de séries, tableau qui suit N. |
| Δ43 | `executionPhrase.ts:190-212` ; `LedgerSide` (`executionCalculations.ts:34`) inchangé | Textes neutres seulement ; aucun changement de `executionCalculations.ts`. |
| Δ45 | `CompositionScreen.tsx:1721-1880`, `fr.ts:47-50` | Point de passage seulement, aucune refonte. |
| Δ49 | — | Essai iPhone sur les composants définitifs. |
| R-07 | — | Options réduites à la notation graphique (D-431). |

## 3. QR-1 et QR-2 (validées par Hermann le 19/10)

- **QR-1.** La spécification des phases (§2.1) admet une seule phase, et supprimer la dernière ramène à « Aucune » (§2.3, D-371). Le stepper commence à 2.
  - **Règle :** la croix ✕ est disponible au-dessus de 2 phases et indisponible à 2 ; le retrait passe alors par Sans.
  - Le stepper − retire la dernière phase, avec la même annulation que la croix.
  - Le stepper + ajoute une phase qui reprend la durée de la dernière (§2.2).
- **QR-2.** La normalisation au ✓ retire les phases à 0 s ou à renseigner, et peut laisser moins de 2 phases.
  - **Règle :** s'il reste une seule phase, l'Exercice passe à Sans avec sa durée comme durée de série (principe de D-371).
  - S'il n'en reste aucune, l'Exercice passe à Sans sans durée inventée, et la validation existante s'applique.

Le modèle de données admet toujours une seule phase. `controlMinCount` ne borne que le contrôle.

## 4. Dépendances réellement bloquantes restantes

- 1.1 → toutes les autres stories (socle atomique, AD-33).
- 2.1 → stories de Feuille ; 2.3 → lignes `inline` (2.4 et suivantes) ; 2.4 → 2.5 et 2.6 ; 2.6 → 2.7 et 2.8.
- **2.2 → 2.7 seulement.** L'issue « succès » de l'essai du clavier décimal est requise pour la charge. Si l'essai aboutit à un repli, Hermann doit arbitrer avant 2.7.
- 2.2 → 2.8 pour la seule livraison du composant `KeyboardField`, quelle que soit l'issue de l'essai.
- 2.6 AC1 (cible tactile de 36) : une insuffisance constatée suspend la géométrie suivante jusqu'à l'arbitrage de Hermann.
- 3.1 → 3.2.
- **Aucune question produit bloquante** : QN-1 à QN-5, QR-1 et QR-2 sont décidées.
- Restent signalés, sans bloquer : §9-1 (écart Figma qui exigerait un jeton ou un composant, soumis en 3.2) et les relevés Figma S-2 par story.

## 5. Contrôles

- Lint du spine : `uv run .claude/skills/bmad-architecture/scripts/lint_spine.py --workspace …/architecture-kodjo-pre5-2026-10-19` → `ok: true`, 0 constat. Relancé après la validation de QR-1 et QR-2 : même résultat.
- Memlogs : une entrée `change` ajoutée à chacun, par `memlog.py append` :
  - spine : 27 entrées ;
  - PRD : 33 entrées.
- `sprint-status.yaml` n'est pas modifié (aucun titre de story ne change) : la validation du sprint n'est pas requise.

## 6. État du clone

HEAD `0119438b`, branche `bmad/pre5-depuis-pre4`. Aucun commit, push, EAS ni changement Figma.

`git status --short`, hors `_bmad/` et `.claude/skills/bmad-*` (avant l'écriture du présent fichier) :

```text
 M _bmad-output/pre5/planning-artifacts/architecture/architecture-kodjo-pre5-2026-10-19/.memlog.md
 M _bmad-output/pre5/planning-artifacts/architecture/architecture-kodjo-pre5-2026-10-19/ARCHITECTURE-SPINE.md
 M _bmad-output/pre5/planning-artifacts/epics.md
 M _bmad-output/pre5/planning-artifacts/prds/prd-kodjo-pre5-2026-10-19/.memlog.md
 M _bmad-output/pre5/planning-artifacts/prds/prd-kodjo-pre5-2026-10-19/addendum.md
 M _bmad-output/pre5/planning-artifacts/prds/prd-kodjo-pre5-2026-10-19/prd.md
 M _bmad-output/pre5/table-delta.md
 M "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md"
 M "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md"
 M "docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md"
 M "docs/Specifications-fonctionnelles/13 – Contrats d'écran.md"
?? _bmad-output/pre5/revue-chatgpt/PRE5-BMAD-2026-10-19.zip   (préexistant)
?? _bmad-output/pre5/revue-chatgpt/corrections-revue-2026-10-19.md   (le présent fichier)
```

L'archive `PRE5-BMAD-2026-10-19.zip` date d'avant ces corrections. Elle ne les contient pas.

## 7. Points d'interprétation à confirmer

- **Nom accessible des options d'Enchainement.** Le défaut retenu est le libellé long neutre (`sideOrders`), pour que VoiceOver n'annonce pas « D1 / G1 » (D-407, annonces vocales neutres). Ce n'est pas écrit dans la décision C1.
- **Durée de la phase ajoutée par + quand la dernière est à renseigner.** La nouvelle phase est elle aussi à renseigner (`null`), par application littérale de « reprend la durée de la dernière ».
- **API de l'option Avec des phases.** Le choix technique est une prop optionnelle `selectedContent` du `SegmentedControl` et un `onChevronPress` distinct. Ce sont des extensions du composant existant, pas un nouveau composant.
