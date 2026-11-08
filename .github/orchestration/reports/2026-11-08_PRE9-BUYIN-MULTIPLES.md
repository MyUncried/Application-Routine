# PRE9-BUYIN-MULTIPLES — buy-in / buy-out multiples dans le questionnaire et le récapitulatif d'un Format

## Identifiant et objectif

- Mission : `PRE9-BUYIN-MULTIPLES` (recette du 08/11/2026 au soir).
- Demande de Hermann (08/11/2026), verbatim : « Deux autres à ajouter : buy in / buy out. Il faut retirer la limite d'un exercice dans le questionnaire et le récapitulatif, c'est contradictoire avec la composition de séance. »
- Objectif : AMRAP (Buy-in) et For time (Buy-in, Buy-out) acceptent plusieurs mouvements par section, comme la Composition (référence Formats §3 ; recette f4-role du 07/11/2026).

## Branche et commit de départ

- Branche : `feat/pre9-catalogues-cartes-badge-20261106`.
- HEAD de départ : `7cc8d6b9`.

## Périmètre demandé / traité

- Demandé : questionnaire et récapitulatif (sélection multiple au catalogue, « + Ajouter » au lieu de « Changer », réordonner / retirer), tableaux, Déroulé, durée, création du Circuit, réédition, mode catalogue ; documentation (classe B) ; tests.
- Traité : tout le périmètre. Aucun fichier de la Composition touché (`CompositionScreen`, `layoutDrop`, `compositionLayout`, `configurationValidity`, `layoutMoves`, `layoutOperations` : modifications présentes dans l'arbre = autre agent). Aucune migration, aucun Figma.

## Constats

1. `ANSWER_BOUNDS.buyIn/buyOut { min: 0, max: 1 }` (`formatModels.ts` l. 195-196) borne l'**interrupteur** (booléen), pas le nombre de mouvements : laissé inchangé.
2. Limite réelle, dans `FormatModelScreen.tsx` :
   - `addMovements` : le choix BUY_IN / BUY_OUT ne gardait que le premier mouvement et **remplaçait** l'existant ;
   - `togglePicked` : sélection unique forcée au catalogue pour BUY_IN ;
   - lien de section « Changer » quand un buy-in / buy-out existe, qui **retirait** d'abord le mouvement ;
   - cartes buy-in / buy-out sans geste de déplacement, Monter / Descendre refusés.
3. Domaine déjà compatible : `hasRequiredRoles`, `summaryIssues`, `buildModelElements` (AMRAP et For time filtrent par Rôle : buy-ins, tour, buy-outs), `FormatTables` (une ligne par mouvement, `movementRole`), `formatReedit.modelStateOfCircuit` (Rôle par Exercice via `circuitRoleOf`).
4. Une seule hypothèse « un buy-in » dans le domaine : `formatTimeline.ts` (AMRAP) — `movements.slice(1)` et un seul bloc buy-in sur `movements[0]` : un second buy-in apparaissait comme mouvement de boucle dans le Déroulé. Corrigé.

## Historique (règle VNext non applicable)

Évolution fonctionnelle demandée, pas une régression VNext : l'analyse historique obligatoire des échecs VNext ne s'applique pas.

## Modifications réalisées

- `src/features/sessions/FormatModelScreen.tsx`
  - `addMovements` : buy-in ajoutés après les buy-in existants (tête), buy-out ajoutés en fin ; plus de remplacement.
  - `togglePicked` : sélection multiple pour toutes les sections.
  - `sectionLink` : plus de retrait préalable ; sections Buy-in / Buy-out toujours « + Ajouter ».
  - Déplacement : `sectionBounds(index)` borne geste et Monter / Descendre à la section de la carte (buy-in, boucle, buy-out) ; geste natif présent sur toutes les cartes ; `cardStep` mesuré sur la carte 0. Retrait par glissement inchangé (déjà actif sur toutes les cartes).
  - Textes remplacés conservés en commentaires annotés.
- `src/domain/sessions/formatTimeline.ts` (AMRAP) : un bloc « · buy-in » par buy-in, dans l'ordre, indices réels ; boucle = mouvements non buy-in.
- Tests : `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx` (test AMRAP adapté : « + Ajouter », second buy-in au récapitulatif, 4 membres dont 2 buy-in ; test du 06/11 « aucun geste » remplacé par un test For time 2 buy-in / 2 boucle / 2 buy-out : sélection multiple, geste et VoiceOver bornés à la section, retrait) ; nouveau `src/domain/sessions/__tests__/formatModels.buyinMultiples0811.test.ts` (création For time / AMRAP, rangs d'une série, durée, Déroulé, réédition).
- Documentation (classe B) :
  - ch07 : nouvelle sous-section « Recette du 08/11/2026 au soir — buy-in / buy-out multiples » (demande recopiée mot pour mot) juste avant « ## Catalogues, cartes et validation des modales — 5 et 6 novembre 2026 » ; annotations « remplacé le 08/11/2026 » sur « Buy-in : Changer » et « Saisie d'un mouvement » (« Changer »).
  - `docs/KODJO-Formats-entrainement-2026-11-02.md` : §7.1 (l. 239, 241), mode catalogue (l. 259), §7.3 (sélection unique ; « changer de Buy-in doit effacer… »), §7.4 (« Changer »), For time du 04/11 (« + Ajouter / Changer ») — textes conservés, annotation datée.
  - Documents dépendants portant la même phrase « le buy-in, sous « Mouvement du buy-in », une sélection unique » : ch06, ch08, ch13 (et ch13 l. 2476 « sélection unique par ajout de buy-in ») — annotés.

## Classe

**B — Évolution validée** (demande explicite de Hermann du 08/11/2026). Partie Déroulé AMRAP : conséquence directe (A, règle §3 « ils s'enchaînent dans l'ordre, une seule fois »).

## Tests et résultats exacts

- `npx jest src/domain/sessions/__tests__/formatModels.buyinMultiples0811.test.ts --testPathIgnorePatterns "\.claude" -w 2` : 6/6 PASS.
- `npx jest src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx … -w 2` : 48/48 PASS.
- `npx tsc --noEmit` : exit 0.
- `npx eslint` (FormatModelScreen.tsx, formatTimeline.ts, deux tests) : 1 erreur + 2 avertissements **préexistants, hors lignes modifiées** — `FormatModelScreen.c3.test.tsx:105` (`react-hooks/refs`, harnais `useState(draftRef.current)`), `:4` `Alert` inutilisé, `formatTimeline.ts:124` `openGeneric` inutilisé. Aucun problème sur le code ajouté.
- Final : `npx jest src/domain/sessions src/features/sessions/__tests__/FormatModelScreen src/features/sessions/__tests__/formats --testPathIgnorePatterns "\.claude" -w 2` : **48 suites, 989 tests, tous PASS** (avec les modifications en cours de l'autre agent présentes dans l'arbre).

## Hypothèses non démontrées

- Ordre d'ajout de plusieurs mouvements choisis en une fois : ordre de présentation du Catalogue (règle existante V2-CAT-01 §4.4), pas l'ordre des touchers — appliqué aussi au buy-in / buy-out.
- La réédition suppose des membres ordonnés buy-in, tour, buy-out (garanti par la Composition : `zonesOrdered`, `configurationValidity`) ; aucun tri ajouté dans `modelStateOfCircuit`.
- La clé i18n `change` (« Changer ») n'est plus utilisée par l'écran Format ; laissée en place.

## Non corrigé / hors périmètre

- Composition (déjà multiple) : non touchée.
- Avertissements / erreur ESLint préexistants cités ci-dessus.

## Vérifications sur iPhone

1. AMRAP, Buy-in activé : « + Ajouter » en section Buy-in, sélection de deux mouvements au catalogue → deux cartes buy-in, « + Ajouter » toujours affiché ; idem au récapitulatif.
2. For time, Buy-in et Buy-out : plusieurs mouvements dans chaque section ; appui long et glisser d'un buy-in / buy-out : réordonne dans la section seulement ; une carte de boucle ne passe ni avant les buy-in ni après les buy-out.
3. Glisser vers la gauche → Supprimer sur un buy-in : l'autre reste.
4. Récapitulatif : une ligne par buy-in / buy-out dans les tableaux (buy-in au premier tour, buy-out au dernier en For time), Déroulé avec un bloc par buy-in / buy-out dans l'ordre, durée estimée.
5. Enregistrer : Circuit dans la Composition dans l'ordre buy-in, tour, buy-out ; « Modifier le format » rouvre avec tous les buy-in / buy-out.

## Fichiers modifiés (par cette mission)

- `src/features/sessions/FormatModelScreen.tsx`
- `src/domain/sessions/formatTimeline.ts`
- `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx`
- `src/domain/sessions/__tests__/formatModels.buyinMultiples0811.test.ts` (nouveau)
- `docs/KODJO-Formats-entrainement-2026-11-02.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` (sous-section et deux annotations ; l'autre agent modifie une autre sous-section)
- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`, `08 – Conception fonctionnelle détaillée.md`, `13 – Contrats d’écran.md` (annotations)
- ce rapport

## Commit final et état Git

- Aucun commit (consigne explicite : « NE COMMITTE PAS, NE POUSSE PAS »). Le rapport est à inclure dans le commit de livraison par l'orchestrateur (`DELIVERY_REPORT_GATE` à compléter : hash à communiquer après commit).
- HEAD inchangé : `7cc8d6b9` ; arbre de travail modifié (fichiers ci-dessus + modifications de l'autre agent : `layoutMoves.ts`, `layoutOperations.ts`, `CompositionScreen.tsx`, `layoutDrop.ts`, `fr.ts`, `circuitMemberLimit.ts` et tests Superset).
