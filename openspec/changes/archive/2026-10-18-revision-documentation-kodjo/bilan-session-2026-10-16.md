# Bilan de session — 2026-10-16 — chantier OpenSpec de révision documentaire KODJO

Ce fichier permet de reprendre le chantier dans une nouvelle session. Il remplace, pour ce clone, le rapport de mission exigé par le `CLAUDE.md` d'origine (voir `openspec/instructions/EXIGENCES-PRODUIT.md` P-7).

## 1. Identification

| Élément | Valeur |
|---|---|
| Mission | Révision de la documentation KODJO avec OpenSpec standard. Première mission : diagnostic et proposition seulement (passe 1 cohérence, passe 2 qualité). |
| Dépôt | `MyUncried/Application-Routine` |
| Clone | `C:\Dev\KODJO-OPENSPEC-DOCS` (créé dans cette session ; le dossier était vide) |
| Branche | `docs/openspec-revision` (locale, jamais poussée) |
| Base documentaire | `main` distant `6656fefc58330955f5ad74d513ce616ea51809b0`, relevé par `git ls-remote` au début de la session et revérifié à la fin : inchangé |
| OpenSpec installé | `@fission-ai/openspec` **1.14.2**, installation globale npm conforme au README officiel (`npm install -g @fission-ai/openspec@…`). Initialisation : `openspec init --tools claude --language French`. Schéma `spec-driven`, profil `core` (6 skills et 6 commandes `/opsx:*` dans `.claude/`). Télémétrie anonyme active par défaut (désactivable par `OPENSPEC_TELEMETRY=0`). |
| Change OpenSpec | `openspec/changes/revision-documentation-kodjo/` (non archivé) |

## 2. État du dépôt

### Avant

- Le dossier `C:\Dev\KODJO-OPENSPEC-DOCS` était vide.
- Clone frais de `main` `6656fefc`, branche `docs/openspec-revision` créée sur ce commit, arbre propre.

### Après

| Commit | Contenu |
|---|---|
| `f7ff4200` | Installation d'OpenSpec 1.14.2 avec l'intégration Claude Code ; séparation des instructions produit et VNext (`CLAUDE.md` du clone, `openspec/instructions/`) |
| `78d6e061` | Contexte projet KODJO dans `openspec/config.yaml` |
| `7cade218` | Passe 1 : diagnostic de cohérence, organisation proposée, spec de gouvernance (proposition), lot 1, rapports bruts H, X, S, P et R |
| *commit de ce bilan* | Passe 2 : `qualite.md`, rapports bruts QS, QF et QC, outils, correction de `tasks.md`, erratum de `diagnostic.md`, ce bilan |

Vérifications faites à la fin de la session :
- `git diff --stat 6656fefc HEAD -- docs .github app src tests e2e scripts package.json eas.json app.json` est **vide**. Aucune spécification produit, aucun code, aucun workflow n'a été modifié.
- Aucun push, aucun EAS, aucune modification Figma.
- Autres clones : lus uniquement, sans aucune écriture.
  - `C:\Dev\KODJO-BMAD-PRE4` : HEAD `a8ec6c35`, avec 6 modifications non committées qui **préexistaient** et appartiennent à une autre session. Seul le fichier `docs/preparation/PRE-4/bmad/questions-ouvertes.md` a été copié dans le scratchpad, pour lecture.
  - `C:\Dev\KODJO-BMAD-PRE5` : HEAD `8111fe57`, avec 2 modifications non committées qui préexistaient.
  - Les clones VNext (`Application-routine*`) n'ont pas été ouverts.

## 3. Séparation des instructions du clone

- Le `CLAUDE.md` racine est **propre à ce clone** et ne doit pas être fusionné tel quel. L'original est conservé à l'identique dans `openspec/instructions/originaux/CLAUDE.md` (blob `61761a5d…`).
- `.github/AI_ORCHESTRATION*.md` est inchangé mais n'est plus importé.
- Les exigences produit sont extraites, avec citation de leur source, dans `openspec/instructions/EXIGENCES-PRODUIT.md`.
- Les obligations VNext sont listées comme non actives dans `openspec/instructions/ORCHESTRATION-VNEXT.md`.
- Toute la démarche est documentée dans `openspec/instructions/README.md`.
- Aucun raccordement à BMAD ni à VNext.

## 4. Sources examinées

| Source | Usage |
|---|---|
| `docs/Specifications-fonctionnelles/01` à `13` (≈ 1,44 Mo, ≈ 15 600 lignes) | Corpus normatif des deux passes, en lecture ciblée et en mesures mécaniques exhaustives |
| `docs/INDEX.md`, `README.md`, `PRODUCT.md` | Navigation, priorités, périmètre |
| `docs/DSF-*.md` (17), `MATRICE-*`, `RAPPORT-*`, `REPORT-*`, `REVUE-*`, `JOURNAL-*`, `SOURCE-*`, JSON | En-têtes et statuts déclarés (passe 1) ; liens (78 fichiers `.md`) ; corps lu seulement de façon ciblée |
| `.github/AI_ORCHESTRATION.md` et `AI_ORCHESTRATION_CONTINUITY.md` | Séparation des instructions |
| PR ouvertes #363, #370 et #371 (diffs et descriptions) | Corrections en cours, à ne pas rediagnostiquer |
| Commits `7a89220f`, `d8985d6e`, `768dbaa7`, `37e372cd` | Consolidation, autorité, captures, remplacement des 24 décisions |
| `caa2a5cf` (branche `plan/pre4-vnext-20261013`) | Comparaison avec les sources figées PRE-4 (empreintes de fichiers) |
| `KODJO-BMAD-PRE4/…/questions-ouvertes.md` et `sources-retenues.md` (lecture seule) | Décisions Q1 à Q23 de Hermann ; liste des sources figées |

**Exclus :** `docs/archives`, `docs/preparation`, `docs/sources`, images, Figma.

**Couverture réelle :**
- Passe 1 : lecture ciblée, détaillée dans `diagnostic.md` §3.
- Passe 2 : environ 15 % (QS), 1 100 lignes (QF) et 25 % (QC) lus ligne à ligne, le reste mesuré par recherche.
- **Aucune des deux passes ne démontre la complétude globale.**

## 5. État des deux passes

| Passe | Analyse | Synthèse | Revue indépendante ChatGPT | Validation de Hermann |
|---|---|---|---|---|
| 1 — Cohérence | **terminée** : 4 analyses (H 20, X 19, S 22, P 22), 83 constats, et un contrôle mécanique des liens (R, 194 anomalies, regroupées en R-01 à R-05) | **produite** : `diagnostic.md` | **en attente** | en attente |
| 2 — Qualité | **terminée** : 3 analyses (QS, QF, QC), 49 défauts | **produite** : `qualite.md` | **en attente** | en attente |

Constats confirmés à la main pendant la session :
- **H-04 :** 24 décisions vidées par `37e372cd`. Le texte de D-237 a été retrouvé dans `37e372cd^`.
- **R-03 / S-10 :** 42 titres `### RM-` vides et 5 « (RM-et RM-) ».
- **R-02 :** les ancres `#ce-fmt-0x` sont inexistantes.
- **QS-10 :** trois textes identiques au ch. 08 l. 1584–1587 (même empreinte md5).
- Les citations « avant » de `qualite.md` sont exactes.
- Les 57 citations de X ont été recontrôlées par script.

Erratum : le ch. 13 compte 40 contrats et non 37 (`diagnostic.md` §4).

## 6. Livrables

Tous sont dans `openspec/changes/revision-documentation-kodjo/` :

| Fichier | Rôle |
|---|---|
| `proposal.md` | Pourquoi, quoi, impact |
| `diagnostic.md` | Synthèse de la passe 1 : corrections récentes prises en compte, inventaire des sources et des priorités, chaînes de remplacement, constats qualifiés, couverture, errata |
| `qualite.md` | Synthèse de la passe 2 : référentiels, couverture, bilan par dimension, défauts, manques démontrés et sujets à confirmer, recommandations, exemples avant/après, distinction avec le format OpenSpec |
| `design.md` | Organisation proposée (D1 à D6) : couche normative unique, domicile par type de règle, remplacement explicite, identifiants et ancres, statut des documents, rôle d'OpenSpec |
| `specs/gouvernance-documentaire/spec.md` | Spec delta de gouvernance, **proposition non archivée**. Elle ne contient aucune règle produit et rien n'est écrit dans `openspec/specs/`. |
| `tasks.md` | Préparation, lot 1A (hors PRE-4), lot 1B (sources figées PRE-4, décision explicite requise), 1C (14 décisions demandées), esquisse du lot 2 |
| `constats/H-hierarchie.md`, `X-exercice.md`, `S-seances.md`, `P-perimetre.md`, `R-liens-ancres.tsv` | Rapports bruts de la passe 1, avec passages exacts |
| `constats/qualite/QS-structure.md`, `QF-formulation.md`, `QC-contenu.md` | Rapports bruts de la passe 2, copies identiques (vérifiées par `cmp`) |
| `outils/links.mjs` (liens de `docs/`), `outils/links-openspec.mjs` (liens du change), `outils/qualite/links.py`, `outils/xcheck-citations-exercice.js`, `outils/brief-*.md` | Contrôles rejouables et consignes données aux analyses |

Contrôle des références internes des fichiers OpenSpec et du `CLAUDE.md` du clone (outil `outils/links-openspec.mjs`, qui ignore les blocs de code ; 21 fichiers, 58 liens relatifs) : aucun lien rompu dans les synthèses, les instructions et `tasks.md`. Les 34 liens signalés dans les rapports bruts (`constats/H-hierarchie.md` 31, `P-perimetre.md`, `S-seances.md`, `qualite/QS-structure.md`) sont des **citations verbatim** de passages de `docs/`, relatifs à leur emplacement d'origine ou abrégés par « … ». Ils sont conservés tels quels, comme preuves.

Python n'est pas installé sur ce poste : `links.py` est conservé comme trace, et `links.mjs` (Node) est l'outil rejouable.

## 7. Points restant à arbitrer

Le détail figure dans `tasks.md` §1C.

**Gouvernance :**
- Q-A : domicile unique et règle d'arbitrage unique ;
- Q-B : statut des DSF, et D-339 et D-341 ;
- Q-C : rôle de PRODUCT.md ;
- Q-D : définitions de MVP, V1, V2 et attribution d'une version à Formats, Circuits et Cadence ;
- Q-M : D-334 et D-335 au registre, D-047 ;
- Q-N : sort de l'« Inventaire opposable PRE-4 » absent du ch. 13 de `main`.

**Produit :**
- Q-E : médias pendant l'Exécution ;
- Q-F : statut `Partielle` ;
- Q-G : suppression d'une Séance ;
- Q-H : enregistrement de la Composition et séance contenant un exercice invalide ;
- Q-I : Death by incomplet ;
- Q-J : montant de l'en-tête du Circuit ;
- Q-K : valeur historique hors bornes, et total pendant une saisie incomplète.

**Intégration :**
- Q-L : intégrer Q8 et Q19 à Q23, et ordonner le lot 1B avec les PR #370 et #371 ;
- écarts entre la PR #371 et les décisions (X-06, X-07).

**Passe 2 :**
- convention d'obligation (choix des mots) ;
- exigences non fonctionnelles à chiffrer ;
- comportements face aux interruptions système ;
- ces points demandent des décisions produit et ne sont pas tranchés par cette analyse.

## 8. Prochaines étapes

1. **Prochain jalon : revue indépendante ChatGPT des deux diagnostics** (`diagnostic.md`, `qualite.md` et leurs rapports bruts), puis de `design.md` et du lot 1. Aucun arbitrage ni aucune correction documentaire avant cette revue.
2. Intégrer les retours de revue dans le change, par le parcours `/opsx:update` ou une révision manuelle, puis revalider avec `openspec validate revision-documentation-kodjo --strict`.
3. Soumettre à Hermann les décisions 1C et l'autorisation des lots 1A et 1B.
4. Seulement après autorisation : appliquer le lot 1A, puis 1B si autorisé (`/opsx:apply`). Rejouer `node outils/links.mjs <racine>`. Committer en local.
5. Ne pas archiver le change (`/opsx:archive`) avant que les lots soient appliqués et validés. L'archivage créerait `openspec/specs/gouvernance-documentaire/spec.md`, qui ne doit devenir effectif qu'une fois la gouvernance acceptée.

**Pour reprendre dans une nouvelle session :**
1. Ouvrir `C:\Dev\KODJO-OPENSPEC-DOCS` et vérifier `git status`, la branche `docs/openspec-revision` et `git ls-remote origin refs/heads/main`. Si `main` a bougé, vérifier les PR #363, #370 et #371 avant toute reprise.
2. Lire, dans l'ordre : ce bilan, `tasks.md`, `diagnostic.md`, `qualite.md`, `design.md`.
3. Commandes utiles : `openspec status --change revision-documentation-kodjo`, `openspec validate revision-documentation-kodjo --strict`.
