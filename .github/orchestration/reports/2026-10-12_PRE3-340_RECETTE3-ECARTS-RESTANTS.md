# PRE-3 (#340) — correction de tous les écarts restants de la recette 3

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_RECETTE3-ECARTS-RESTANTS` |
| Objectif | Corriger tous les écarts encore ouverts du fichier « Recette 3 » (12/10 au soir) : T-49, N-01, N-02, N-03, N-04. Enregistrer l’autorisation consolidée, publier une version de recette vérifiable et fournir un retest ciblé. |
| Source | `KODJO_PRE3_Prompt_Tous_Ecarts_Restants.md` |
| Branche | `feat/pre3-exercice-20261009`, départ `0cd8c2e096e15b22bba8bcf97a81e82d2fd03f59` (local = distant ; aucune PR ni aucun run actif) |
| Autorisation | Extension consolidée de Hermann : EXT-R3-1, -3, -4 et EXT-R3-2 maintenue, bornées à ces écarts. Enregistrée **avant** toute modification : `autorisation-extension-recette3.json`, commit `40ac87bc`. |
| Limites | Pas de PRE-4, pas de modification du protocole VNext, pas de fusion, pas de clôture de #340, pas de `VISUAL_APPROVED`. |

## Périmètre

Toutes les lignes Écart sont traitées ; aucune n’est reportée. Lignes Conforme (dont T-53, N-05, T-15, T-10) : non rouvertes. Matrice complète par sous-point : `registre-recette3.md`, §6.

## Analyse historique et causes

| Sous-point | Introduction | Cause | Attribution |
|---|---|---|---|
| N-01, clavier | `ReferenceValueDialog` en `Modal` (PRE-2, D4/D-259) | Un `Modal` imbriqué retire le focus du champ actif de la feuille sur iOS | **Démontrée** par la structure ; le maintien réel du clavier reste à observer sur iPhone |
| N-01, Modifier | Rendu `isCreating ? création : editTarget ? édition` (PRE-2, repris en PRE-3) | Formulaire de création ouvert : l’édition n’est jamais affichée | **Démontrée** (test rouge sur l’original) |
| N-02 | — | Correctif D-350 présent depuis `1645b52f` ; constat non reproduit | **Indéterminée** (version exécutée lors du constat non prouvée) |
| N-03 | Feuille Étiquette PRE-2 (palette, boutons inférieurs, choix au toucher) | Présentation et comportement à aligner | Ajustement demandé (D-355) |
| N-04 | Menu PRE-2 (trois lignes de texte) | Présentation à aligner | Ajustement demandé (D-354) |
| T-49 Catalogue | Haut : `HeaderSeparator` (Shell Foundation) ; bas : aucun élément | Séparateur **démontré** ; bas = arête bande / fond, **plausible** | D-356 |
| T-49 Composition | — | Corrigé dans `ee32191a` et `c649bffc` | Inclusion vérifiée |

## Modifications (code `ce8e35a27705146ae76287f847cbdad45ee671bb`)

| Fichier | Changement |
|---|---|
| `ReferenceValueDialog.tsx` | Calque dans la fenêtre de la feuille (plus de `Modal`) ; carte au-dessus du clavier ; ✕ rond ; Modifier et Supprimer sur une ligne (D-102) ; confirmation dans le même calque |
| `CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx` | Édition prioritaire sur la création ; `CategoryColorBand` exporté, rendu inchangé |
| `LabelPickerModal.tsx` | Réécrit sur le modèle Catégorie, comportement B (D-355) |
| `CatalogueScreen.tsx`, `CatalogueCreateOptions.tsx` | Séparateur retiré, fondu inférieur, arbre « Créer » recalé de 1 |
| `src/shared/i18n/index.ts` | « Confirmer l’étiquette » |
| Tests | Nouveaux tests N-01 (×3), N-03 (×3), D-355 (×4), N-04 (×3), T-49 Catalogue. Attendus remplacés et tracés : Étiquette (4 tests), Composition (1), Catalogue (1), arbre « Créer » (1). Aucune suppression. |

**Documentation** :
- registre 07 : D-354, D-355, D-356 ;
- contrats 13 : contrat commun des référentiels et CE-T03-16 §4 ;
- `registre-recette3.md` §6 ;
- `procedure-retest-recette3-ecarts-restants.md` (remplace `procedure-retest-recette3.md`, marquée comme remplacée) ;
- preuves de publication et de vérification ;
- `autorisation-extension-recette3.json`, complété par la dépendance `CatalogueCreateOptions`.

**PRESERVE / CHANGE / FORBIDDEN** :

| Catégorie | Contenu |
|---|---|
| PRESERVE (testé) | D-343 et D-350 (Catégorie, Zones) ; confirmation destructive ; retour du focus R10 ; absence d’effet de l’appui long sur la sélection ; `ScreenShell` ; `DecisionDialog` ; couleurs propres du Catalogue et de la Composition ; acquis de l’éditeur |
| CHANGE | Voir les modifications |
| FORBIDDEN (non touché) | PRE-4, protocole, `ScreenShell.tsx`, `DecisionDialog.tsx`, autres écrans à séparateur |

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS (4 avertissements d’imports en double dans mes tests, corrigés) |
| `jest` complet | **98/98 suites, 1966/1966 tests** |
| Obligations `@43e7b344` | **442/442** |
| Mutation (fichiers applicatifs restaurés à `40ac87bc`) | **17** tests nouveaux ou révisés **rouges**, verts après correction |
| Contrôle de portée | Tous les chemins sont dans la `write_scope@43e7b344`, l’autorisation consolidée ou la documentation |

Une suite verte ne prouve ni le maintien réel du clavier ni la fidélité des pixels : ces points restent à constater sur iPhone.

## Publication

| Étape | Résultat |
|---|---|
| Git | Sans force : `0cd8c2e0..40ac87bc` (autorisation), `..ce8e35a2` (code), puis le commit documentaire ; tête vérifiée par l’API GitHub |
| Compatibilité | `OTA_COMPATIBLE` par rapport au build 8 (`58bbc3bc`) et au build 7 (`9f5cee0e`) ; aucun fichier natif ; aucun nouveau build |
| OTA | **`01a131d0-3f73-712c-8c34-19db4f55de01`**, groupe `0e8faf73-fcb5-42d3-a20a-f0eb346bde65`, canal `review`, runtime 1.1.0, `gitCommitHash` `ce8e35a2…`, 20:31:33 UTC ; https://u.expo.dev/update/01a131d0-3f73-712c-8c34-19db4f55de01 |
| Vérification effective | Manifeste du canal : HTTP 200, id `01a131d0…`. 57/57 assets signés, SHA-256 conformes. Bundle : fondu du Catalogue, feuille Étiquette, ↑ de la Description, diagnostic présents ; ancienne palette et ancien Annuler absents. |
| Version exécutée | **Non prouvée** : étape 0 de la procédure |

## Hypothèses non démontrées

- Bord bas du Catalogue : arête de la bande, effacée par le fondu.
- N-02 : cause du constat indéterminée ; correctif présent.
- N-01 : maintien effectif du clavier (comportement natif d’iOS).

## Tableau par sous-point

| Sous-point | Réalisé | Commit / version | Preuve | Contrôle iPhone | Statut |
|---|---|---|---|---|---|
| T-49 Catalogue, haut | Oui | `ce8e35a2` / `01a131d0` | Test T-49 Catalogue | R3B-01 | Publié, à retester |
| T-49 Catalogue, bas | Oui (fondu) | idem | idem | R3B-01 | Publié, à retester |
| T-49 Composition (4 résultats) | Déjà présent, vérifié | `ee32191a`, `c649bffc` / `01a131d0` | Tests EXT-R3-2, D-353 ; bundle | R3B-02 | Publié, à retester |
| N-01, clavier (×3) | Oui | `ce8e35a2` / `01a131d0` | Tests N-01, test du clavier | R3B-03 à 05 | Publié, à retester |
| N-01, Modifier (×3) | Oui | idem | Tests N-01 | R3B-03 à 05 | Publié, à retester |
| N-02 | Déjà présent, vérifié | `1645b52f` / `01a131d0` | Test N-02 | R3B-06 | Publié, à retester |
| N-03, présentation et pastille | Oui | `ce8e35a2` / `01a131d0` | Tests N-03 | R3B-07, R3B-08 | Publié, à retester |
| N-03, comportement B | Oui | idem | Tests D-355, Composition | R3B-07, R3B-08 | Publié, à retester |
| N-04 (×3 feuilles) | Oui | idem | Tests N-04 | R3B-09 | Publié, à retester |

## Quatre états

| État | Situation |
|---|---|
| Code publié | **Oui** : `ce8e35a2`, OTA `01a131d0` |
| Candidat exécuté sur l’iPhone | **Non prouvé** (étape 0) |
| Retest validé par Hermann | **Non** |
| Revue indépendante | **Non** |

**Prochaine action** : Hermann exécute l’étape 0, puis R3B-01 à R3B-09 de `procedure-retest-recette3-ecarts-restants.md`. Ensuite : revue indépendante (ChatGPT). **Aucune opération en cours.**
