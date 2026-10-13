# PRE-3 (#340) — EXT-R3-2, complément : trait gris au-dessus de la zone de contexte de la Composition

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_EXT-R3-2-SEPARATEUR` |
| Objectif | Retour visuel de Hermann (12/10) : « le trait […] gris au dessus de la zone de contexte colorée est toujours là. Ce point précis n’est pas corrigé. » |
| Interprétation | Le trait gris **horizontal** entre l’en-tête et la zone colorée de « Composition d’une séance » (`HeaderSeparator`) : c’est le seul trait gris au-dessus de cette zone. Le mot « vertical » du message est lu comme désignant sa position. |
| Autorisation | EXT-R3-2 (Hermann, 12/10) : `CompositionScreen.tsx` et ses tests, pendant PRE-3 ; PRE-4 non lancé |
| Branche | `feat/pre3-exercice-20261009`, départ `ecbca30ee3b75ff4a6eb03c69935a4085ab4db44` (local = distant) |
| Limites | Pas de PRE-4, de fusion, de clôture ni de `VISUAL_APPROVED`. `ScreenShell` non modifié. |

## Analyse historique

| Élément | Commit | Constat |
|---|---|---|
| Introduction du trait | CMP-01, « Shell Foundation » (03/09) : `<HeaderSeparator />` sous l’en-tête de la Composition | Présentation antérieure |
| Livraison précédente | `ee32191a` (EXT-R3-2, D-352) | Trait **conservé volontairement** : la demande écrite ne visait que les liserés inférieurs. Mon interprétation était trop restrictive par rapport à l’attente de Hermann. |
| Détection | Contrôle visuel de Hermann sur l’OTA `01a1314e` | **Attribution démontrée** : le trait vient de `HeaderSeparator`, présent dans le code de `ee32191a` |

## Modifications (`c649bffce883773172dfe3a46c0f033afa828462`)

- `CompositionScreen.tsx` :
  - `<HeaderSeparator />` retiré de l’écran principal. L’écran d’état (chargement ou erreur, sans zone de contexte) le garde.
  - Constante `HEADER_SEPARATOR_HEIGHT` supprimée.
  - Arbre « Ajouter une activité » et centre de la courbe recalés de 1 pt (plus de séparateur).
- `CompositionScreen.test.tsx` : trois assertions mises à jour et tracées :
  - CMP-01 : séparateur absent (D-353) ;
  - position de l’arbre sans le « + 1 » ;
  - test T-49 : courbe sans décalage, aucun trait.
- Documentation :
  - D-353 (registre 07) ; la note de D-352 renvoie à D-353 ;
  - `registre-recette3.md` ; `procedure-retest-recette3.md` (R3-05, étape 0 sur la nouvelle OTA).

## Preuves et tests

| Commande | Résultat |
|---|---|
| `tsc`, `eslint src app` | PASS |
| `CompositionScreen.test.tsx` | 165/165 |
| Mutation (`ee32191a` restauré) | 3 assertions **rouges** ; vertes après correction |
| `jest` complet | **98/98 suites, 1956/1956 tests** |
| Obligations `@43e7b344` | **442/442** |

## Publication

| Étape | Résultat |
|---|---|
| Git | Sans force : `ecbca30e..c649bffc`, tête vérifiée par l’API GitHub, puis le commit documentaire |
| Compatibilité | `OTA_COMPATIBLE` par rapport aux builds 8 et 7 ; aucun nouveau build |
| OTA | **`01a13191-b515-7e40-b5fa-f4ff579d8cb1`**, groupe `2aa81d03-149d-48cc-b2cd-467b31754c3e`, canal `review`, runtime 1.1.0, `gitCommitHash` `c649bffc…`, 19:23:15 UTC ; https://u.expo.dev/update/01a13191-b515-7e40-b5fa-f4ff579d8cb1 |
| Vérification effective | Manifeste du canal : HTTP 200, id `01a13191…`. 57/57 assets signés, SHA-256 conformes. Elle remplace `01a1314e` et contient toutes les corrections de la recette 3. |
| Version exécutée | **Non prouvée** : étape 0 de `procedure-retest-recette3.md` |

Preuves : `publication-ota-ext-r3-2-d353.json`, `verification-ota-ext-r3-2-d353.json`.

## Hypothèses non démontrées

Origine des deux liserés inférieurs (arête de la bande), inchangée par rapport au rapport `EXT-R3-2-COMPOSITION`.

## État

- Code corrigé et publié : oui.
- Candidat chargé, retest de Hermann et revue indépendante : non réalisés.
- **Prochaine action** : Hermann exécute l’étape 0 (identifiant attendu `01a13191…`), puis R3-05 (et R3-01 à R3-04 s’ils ne sont pas faits).
- **Aucune opération en cours.**
