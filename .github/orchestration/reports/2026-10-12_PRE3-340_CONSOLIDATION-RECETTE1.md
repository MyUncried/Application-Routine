# PRE-3 (#340) — consolidation de la recette 1 : extensions, contradictions, arbitrages, retest

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_CONSOLIDATION-RECETTE1` |
| Objectif | Distinguer les extensions techniques nécessaires au contrat PRE-3 des véritables changements de besoin ; résoudre les contradictions documentaires selon l’ordre d’autorité ; poursuivre les corrections autorisées ; produire un retest court ; publier `e1c3296e`. |
| Branche | `feat/pre3-exercice-20261009` (sans PR) |
| Tête de départ | `3da0841e` sur le distant, `e1c3296e` en local |
| Plan approuvé | `43e7b344` |
| Écrivain | Claude Code local, seul, worktree isolé sans conversion des fins de ligne |
| Limites | Aucune fusion, aucun `VISUAL_APPROVED`, aucun PRE-4, aucune modification VNext ou V2, aucune extension appliquée sans approbation |

## Périmètre

**Demandé** :
1. Proposition unique d’extensions techniques, avec les corrections indépendantes poursuivies.
2. Contradictions résolues selon l’ordre d’autorité.
3. Tableau des vrais arbitrages.
4. Retest court et autonome, avec scénario F-02.
5. Publication de `e1c3296e`, puis état final.

**Traité** : les cinq points. Les corrections sont limitées au `write_scope@43e7b344` (contrôle PASS).

## Publication de `e1c3296e`

- Portée vérifiée : 2 fichiers documentaires seulement, le rapport `…CORRECTION-RECETTE1.md` et `publication-ota-recette1.json`.
- Parent : `3da0841e` (tête distante).
- Publié sur autorisation de Hermann, sans force : `3da0841e..e1c3296e`.

## Constats

Documents produits :
- `docs/preparation/PRE-3/planification/execution/preuves/consolidation-recette1.md` : §1 extensions X-1 à X-4, §2 contradictions C-1 à C-10, §3 arbitrages D-1 à D-9 ;
- mise à jour datée du registre (`registre-recette1.md` §6) ;
- `procedure-retest-recette1-v2.md`.

**Ordre d’autorité appliqué** : `perimetre-et-couverture.md` l.20-24, complété par `docs/INDEX.md` §6 et `PRODUCT.md` §13. Il tranche 8 des 10 divergences. Il en reste deux :
- C-7 : effet du ✓ d’en-tête pendant une création de Catégorie ;
- C-8 : trajectoire de la feuille.

Analyse historique (défauts corrigés dans cette étape, tous **détectés** par la recette 1) :

| Défaut | Introduction | Attribution |
|---|---|---|
| Halo et fondu de la zone de contexte absents | `bdc133c3` (zone pleine, écart E1 déclaré) | Démontrée par le figé 3542-4656 |
| Activation des Séries variables gardant le tableau replié | `12506088` (repli local, sans réinitialisation) | Démontrée par le figé 6665:24616 |
| Voile qui glisse avec la feuille | `bdc133c3` (`animationType="slide"`) | Démontrée par le prototype figé |
| Ajouter et Annuler au lieu de ↑ ; palette dépliable | Formulaire PRE-2 (`10ac761e`) conservé par `bdc133c3` | Démontrée par le figé 4474:7157, 4683:6336 et CE-UI-09 §9 |

## Modifications (`f372cc5dbab3c97efc3c39a26db74c6dd683b995`)

- `ActivityEditorForm.tsx` : halo blanc Ø 59,28 concentrique au bouton Retour, rogné à la zone ; fondu figé sur les 20 % inférieurs ; aucun token nouveau.
- `ExecutionParametersSheet.tsx` :
  - activation des Séries variables avec tableau déployé ;
  - `Modal` en `fade`, et feuille seule animée depuis le bas (0,25 s, ease-out).
- `CategoryPickerModal.tsx` :
  - ↑ dans le champ, avec les mêmes règles et le même `testID` qu’Ajouter ;
  - bandeau horizontal des 12 couleurs D-026, en création et en modification ;
  - `ColorPalette` n’est plus utilisé ici (fichier partagé non modifié).
- `BodyZonePickerModal.tsx` : ↑ dans le champ.
- Tests : +5. Une assertion remplacée (palette en flux), aucune supprimée.

**PRESERVE** : `SegmentedControl`, `ScreenShell`, `ColorPalette`, `KodjoIcon`, `LabelPickerModal`, les tokens, la roulette native et le stepper Profil sont inchangés ; le domaine, les migrations, la phrase et les calculs aussi.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS |
| `npx jest --json` | **97/97 suites, 1931/1931 tests**, 0 échec |
| Obligations `tests-and-preservation.json@43e7b344` | **442/442 PASS** |
| `controle-portee.cjs --start 9f5cee0e…` | PASS |
| F-02, 3 trajets supplémentaires (test temporaire supprimé) | Non reproduit (8 trajets au total) |

Preuves : `resultats-tests-recette1b.json`, `couverture-obligations-recette1b.json`, `controle-portee-recette1b.json`.

## Hypothèses non démontrées

- Le rendu iPhone n’est pas observé : halo, fondu, bandeau, ↑, voile.
- Le halo est centré sur le bouton Retour réel de l’en-tête partagé (marge 24). La maquette place ce bouton à 17 : l’écart vient de l’en-tête partagé, hors périmètre.
- F-02 n’est pas reproduit.

## Non corrigé ou hors périmètre

| Catégorie | Points |
|---|---|
| Extensions à approuver | X-1 `SegmentedControl` ; X-2 icône Catégorie (export du master à vérifier) ; X-3 tokens et ch. 12 ; X-4 `ScreenShell` (minHeight) |
| Décisions produit | D-1 à D-9 |
| Hors PRE-3 | Clavier de l’Étiquette (PRE-2) ; Catalogue et Profil au texte agrandi ; couleur de la Composition |

## Vérifications restant à faire sur appareil

`procedure-retest-recette1-v2.md`, RT-01 à RT-13.

## Fichiers modifiés (`e1c3296e` → tête)

- **Code** : `ActivityEditorForm.tsx`, `ExecutionParametersSheet.tsx`, `CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx`.
- **Tests** : `ActivityEditorForm.test.tsx`, `ExecutionParametersSheet.test.tsx`, `CategoryPickerModal.test.tsx`, `BodyZonePickerModal.test.tsx`.
- **Documentaire** :
  - ce rapport ;
  - `consolidation-recette1.md`, `procedure-retest-recette1-v2.md` ;
  - registre (§6 ajouté) ;
  - `resultats-tests-recette1b.json`, `couverture-obligations-recette1b.json`, `controle-portee-recette1b.json`.

## Commit final et état Git

Commit de code `f372cc5d`. Le commit documentaire, la publication et la mise à jour OTA sont consignés dans la section « Publication » ajoutée après leur exécution.
