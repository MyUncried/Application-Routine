# Rapport de mission — Intégration par rebase de la branche distante et résolution des conflits documentaires T02

## Identifiant et objectif

**Identifiant** : `2026-09-07_rebase-sync-documentation-T02`

**Objectif** : intégrer les six commits distants de `feat/creation-seance-catalogue` sous le commit documentaire local `fd49f8e` au moyen d'un rebase, en résolvant les trois conflits documentaires de manière **cumulative** — conservation simultanée des modifications distantes et de l'intégralité des modifications de `fd49f8e` — sans choix global `ours`/`theirs` et sans suppression de règle. Puis pousser la branche et restaurer le stash sans le commiter.

## Branche et commit de départ

- **Branche** : `feat/creation-seance-catalogue`
- **HEAD local au départ** : `fd49f8e` — `docs: ajouter les contrats T02 et actualiser les écrans Activité`
- **Base commune** : `ed8fbc5` — `feat: implement T01-S10`
- **HEAD distant au départ** : `b350e8b` — `docs: record T02 long-press reorder decision`
- **Divergence** : 1 commit local / 6 commits distants
- **Stash au départ** : `stash@{0}` — `On feat/creation-seance-catalogue: temp avant sync documentation T02`

## Périmètre demandé

1. Vérifier que le rebase avait bien été annulé et que le stash était toujours présent.
2. Intégrer la branche distante par rebase.
3. Résoudre cumulativement les trois conflits annoncés :
   - `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
   - `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
   - `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
4. Contrôler l'absence de marqueurs de conflit, la validité UTF-8, les liens vers les images et la présence des contrats `CE-T02-01`, `CE-T02-02`, `CE-T01-13`, `CE-T01-14`.
5. Terminer le rebase, pousser la branche, restaurer le stash sans commiter les fichiers restaurés.

## Périmètre réellement traité

L'intégralité du périmètre demandé a été traitée. Un quatrième conflit **sémantique non signalé par Git** a été détecté et résolu en plus (duplication de la section `CE-T02-01`, voir constats). Deux défauts préexistants ont été constatés et **non corrigés**, car hors périmètre (voir « Éléments non corrigés »).

## Constats

### C1 — État initial conforme

Le rebase précédent avait bien été annulé (aucun répertoire `.git/rebase-merge` ni `.git/rebase-apply`, arbre de travail propre) et le stash `temp avant sync documentation T02` était bien présent.

### C2 — Trois conflits Git réels, tous de nature cumulative

Chaque conflit oppose une réécriture distante et une réécriture locale d'un même passage issu de la base `ed8fbc5`. Aucun n'est une opposition binaire : dans les trois cas, les deux côtés apportent des règles distinctes et complémentaires.

### C3 — Conflit sémantique masqué : `CE-T02-01` dupliqué (fichier 13)

**Les deux côtés ont créé un contrat `CE-T02-01`, dans deux régions différentes du fichier.** Git ne l'a pas signalé comme conflit et les aurait laissés coexister :

- version `fd49f8e` : `### CE-T02-01 — Composition complète`, insérée après `CE-T01-09` (ligne ~510) ;
- version distante : `### CE-T02-01 — Composition complète : réorganisation, duplication, suppression et nombre de Tours`, ajoutée en fin de fichier après le § 9.

Un document portant deux contrats de même identifiant est un défaut de traçabilité. Les deux versions ont donc été fusionnées en une seule section (voir M3).

### C4 — Collision d'identifiant `D-127` (fichier 07)

Le registre des décisions est une table numérotée s'arrêtant à `D-126` dans la base. Les deux côtés ont appendé à partir de `D-127` : une ligne côté distant, trois lignes côté `fd49f8e`. Les quatre lignes portent des règles distinctes.

Contrôle préalable effectué : aucune référence à `D-127`..`D-132` n'existe ailleurs dans le dépôt (hors `node_modules`), la renumérotation est donc sans effet de bord.

### C5 — Contradiction d'affectation de tranche réellement supersédée (fichier 13)

Sur la ligne `Nombre de Tours` du contrat `CE-T01-04` :

- base et `fd49f8e` : « la modification du nombre de Tours **appartient à T03** » ;
- distant : « **T02-S01** rend sa modification fonctionnelle de `1` à `99` selon CE-T02-01 ».

C'est le seul point où la fusion cumulative littérale est impossible : les deux propositions s'excluent. Le même push distant crée le contrat `CE-T02-01` couvrant explicitement le nombre de Tours en `T02-S01` ; l'attribution à `T03` est donc explicitement supersédée en amont. Seule cette proposition supersédée a été écartée ; toutes les autres règles de la ligne locale ont été conservées.

### C6 — Défaut préexistant : image corrompue dans `fd49f8e`

`docs/Specifications-fonctionnelles/images/creation-activite-exercice.png` a été remplacé dans `fd49f8e` par un fichier de **204 octets** qui n'est pas un PNG (aucune signature PNG, aucun bloc `IEND`) mais une page d'erreur HTML dont le titre est `Site Unavailable`.

La version de la base `ed8fbc5` était un PNG valide de 36 444 octets. Il s'agit d'un export/téléchargement échoué survenu lors de la constitution de `fd49f8e` ; le rebase n'en est pas la cause. Le lien Markdown reste résolvable (le fichier existe), c'est son contenu binaire qui est invalide. Les 76 autres PNG du dossier sont valides.

### C7 — Défaut préexistant : encodage non UTF-8 dans un rapport distant

`.github/orchestration/reports/2026-09-06_T01-S10.md` contient un octet non-UTF-8 (le mot « utilisée » encodé en latin-1) à la section `## Session de correction manuelle`. Ce contenu provient du commit distant `61afcdd` et est identique à `origin`. Ni `fd49f8e` ni la présente résolution ne touchent ce fichier.

### C8 — Conflit à la restauration du stash, sans perte

`git stash apply` a produit un conflit sur `.github/orchestration/reports/2026-09-06_T01-S10.md`. Vérification faite, la seule modification que le stash portait sur ce fichier (les 4 lignes de la section `## Session de correction manuelle`) **est déjà présente à l'identique dans HEAD**, ayant été reprise par le commit distant `61afcdd`. La résolution par la version HEAD ne perd donc aucun contenu du stash.

## Modifications réalisées

### M1 — `06 – Ecrans et navigation de la V1.md`, section « Réorganisation »

Fusion cumulative en un paragraphe unique suivi des deux paragraphes locaux :

- **conservé du distant** : portée « dans leur zone ou déplacées par glisser-déposer », conservation de l'identifiant et des paramètres, mise à jour de la position structurelle, renumérotation continue des positions de chaque zone, absence de persistance avant l'enregistrement final ;
- **conservé de `fd49f8e`** : déclenchement par appui long, état soulevé, suivi du glissement jusqu'à une dépose valide, maintien du toucher court en ouverture de modification, spécification visuelle complète de l'état Figma `3518:4576`, rôle de la poignée `Icon / Structure / Movable`, caractère strictement transitoire de l'état soulevé.

Aucune règle écartée.

### M2 — `07 – Registre des décisions de conception.md`

Les quatre lignes de décision sont conservées, avec renumérotation des trois lignes locales pour lever la collision :

| Ligne | Origine | Sujet |
| --- | --- | --- |
| `D-127` | distant, numéro inchangé | Réorganisation déclenchée par appui long sur toute la carte |
| `D-128` | `fd49f8e`, ex-`D-127` | Composant `Composition / Activity Row` et actions glissées |
| `D-129` | `fd49f8e`, ex-`D-128` | État transitoire `3518:4576` de la carte soulevée |
| `D-130` | `fd49f8e`, ex-`D-129` | Sélecteur du nombre de Tours (`66 × 34`, sans `x`/`×`, `#CDCEFA`) |

`D-127` conserve son numéro car il est déjà publié en amont. Aucune décision supprimée, aucune fusionnée.

### M3 — `13 – Contrats d’écran.md`

**a. Ligne en conflit du contrat `CE-T01-04`** — fusionnée. La ligne finale conserve, côté distant, le libellé de ligne et l'affectation `T02-S01`/`CE-T02-01` ; côté `fd49f8e`, l'alignement sur le bord droit des cartes, l'interdiction du préfixe `x`/`×`, la valeur `1` en T01 et la garde de recette T01. Seule l'affectation à `T03`, supersédée en amont, a été écartée (voir C5).

**b. Sections `CE-T02-01` dupliquées** — fusionnées en une seule section, placée à sa position logique dans la séquence des contrats (après `CE-T01-09`, avant `CE-T02-02`), sous le titre distant qui est le plus explicite. La section fusionnée réunit :

- table d'identification combinée : `Tranche T02-S01`, `Frame principale 2028:11700`, `État actions 2028:11808`, `État déplacement 3518:4576`, héritage `CE-T01-04 à CE-T01-10` dont `CE-T01-09`, `Structure`, `Périmètre T02` ;
- sous-sections distantes conservées : `Gestes d'une carte Activité` (table des 4 gestes, zones `BEFORE_TOUR`/`IN_TOUR`/`AFTER_TOUR`), `Duplication et suppression`, `Nombre de Tours` (`Type=Numeric wheel` `3210:49`, bornes, Annuler/Confirmer, restitution après réouverture), `Calculs` (`tourRepeatCount`), `Persistance et garde d'abandon` (enregistrement atomique, compatibilité T01) ;
- apports `fd49f8e` conservés : renvoi à `CE-T02-02`, persistance de l'ordre par `API-COM-06`, géométrie des actions glissées (`144 × 69` / `72 × 69`), copie des associations média, indisponibilité de `Continuer` après suppression du dernier Exercice, spécification visuelle du sélecteur de Tours, synthèse `N activité(s) · durée` et renvoi à `D-081`, `D-090`, `D-091`, `D-100`, `D-112` ;
- listes « Tests bloquants » des deux versions fusionnées en une seule liste sans perte d'item.

Le bloc distant en fin de fichier a été retiré **après** vérification que chacune de ses règles figure dans la section fusionnée.

**c.** Le reste des apports `fd49f8e` au fichier 13 (contrat `CE-T02-02`, refonte de `CE-T01-14` en « Sélecteurs de paramètres ouverts », matrice `6 bis`, réécritures de `CE-T01-09` et `CE-T01-13`) a été appliqué sans conflit.

## Preuves et tests

### Contrôle de non-perte de règles

Contrôle automatisé de présence de 28 formulations discriminantes extraites des **deux** versions de `CE-T02-01` avant fusion, exécuté sur le fichier fusionné :

```
ALL 28 RULES PRESENT
```

### Contrôles demandés, exécutés sur l'état final

| Contrôle | Portée | Résultat |
| --- | --- | --- |
| Marqueurs de conflit | 269 fichiers texte suivis | **0 marqueur** |
| Validité UTF-8 | 99 fichiers `.md` suivis | 98 valides — 1 invalide **préexistant** (C7) |
| Liens image | 77 liens dans `docs/**/*.md` | **0 lien cassé** |
| Intégrité PNG | 77 PNG suivis | 76 valides — 1 corrompu **préexistant** (C6) |
| Fins de ligne | 3 fichiers résolus | CRLF intégral préservé, aucun BOM introduit |
| Encodage des fichiers résolus | 3 fichiers résolus | UTF-8 valide, aucun caractère de remplacement |

### Présence des contrats exigés

| Contrat | Titres `###` | Mentions |
| --- | --- | --- |
| `CE-T02-01` | 1 | 5 |
| `CE-T02-02` | 1 | 6 |
| `CE-T01-13` | 1 | 6 |
| `CE-T01-14` | 1 | 3 |

Chaque contrat est présent exactement une fois comme titre de section — la duplication de `CE-T02-01` constatée en C3 est résorbée.

### Tests automatisés

```
commande : npx jest --ci --silent
résultat : PASS — 45 suites / 45, 780 tests / 780, 0 échec, 21,1 s
```

Ces tests portent sur le code applicatif intégré depuis le distant. La présente mission n'a modifié aucun fichier applicatif ; ils attestent que la branche intégrée est saine, non que les résolutions documentaires sont correctes — une documentation ne s'exécute pas.

### Intégrité de la restauration du stash

Comparaison par empreinte `git hash-object` entre le contenu du stash et l'arbre de travail :

```
OK   app.json          (identique au stash)
OK   package.json      (identique au stash)
OK   start-kodjo.ps1   (identique au stash)
OK   package-lock.json (identique au stash)
```

`git stash apply` a été employé plutôt que `pop` : le stash reste disponible comme filet de sécurité.

## Hypothèses non démontrées

- **H1** — L'attribution de l'édition du nombre de Tours à `T02-S01` plutôt qu'à `T03` (C5) est réputée intentionnelle et supersédante, sur la base du fait que le même push distant crée `CE-T02-01`. Cette lecture n'est pas attestée par un arbitrage explicite ; si `T03` reste l'affectation voulue, la ligne doit être corrigée.
- **H2** — La conservation du numéro `D-127` au profit de la ligne distante, et la renumérotation des lignes locales en `D-128`..`D-130`, reposent sur l'antériorité de publication. Aucune règle écrite du projet n'arbitre les collisions d'identifiants du registre.
- **H3** — `D-127` (distant) et `D-129` (ex-`D-128` local) traitent tous deux de l'appui long. Ils ont été conservés séparément comme complémentaires — règle du geste d'une part, spécification visuelle de l'état d'autre part. Une consolidation ultérieure en une décision unique relève d'un arbitrage documentaire, non de cette intégration.
- **H4** — Le placement de la section `CE-T02-01` fusionnée à la position locale (avant `CE-T02-02`) plutôt qu'en fin de fichier est un choix de cohérence de lecture, non une exigence attestée.
- **H5** — La conformité de fond des règles fusionnées aux frames Figma citées n'a pas été vérifiée ; seule leur préservation textuelle l'a été.

## Éléments non corrigés ou hors périmètre

- **N1 — `creation-activite-exercice.png` corrompu (C6).** Non corrigé délibérément. Le fichier fait partie du commit `fd49f8e` que la mission demandait de préserver intégralement ; restaurer la version de `ed8fbc5` reviendrait à annuler une modification de `fd49f8e` sans instruction en ce sens. **Action requise : réexporter cette capture depuis Figma et la recommiter.** En l'état, le document 06 référence une image qui ne s'affichera pas.
- **N2 — Encodage non UTF-8 du rapport `2026-09-06_T01-S10.md` (C7).** Non corrigé : fichier issu du commit distant `61afcdd`, hors des trois fichiers en conflit et hors périmètre de la mission.
- **N3 — Fichiers restaurés du stash.** Non commités, conformément à l'instruction. Ils restent en modifications non indexées.
- **N4 — Doublon de fond `D-127`/`D-129` (H3).** Laissé en l'état, consolidation à arbitrer.

## Vérifications restant à effectuer sur appareil réel

Aucune vérification sur appareil n'est requise par cette mission : elle n'a modifié aucun fichier applicatif et aucun rendu. Les vérifications device restent celles déjà portées par les contrats intégrés — notamment la clause « validation des gestes sur appareil réel » des tests bloquants de `CE-T02-01`, ainsi que la conformité visuelle de `CE-T02-02` à la frame `3518:4576` sur `402 × 874`, qui ne peuvent être démontrées par la suite Jest.

## Fichiers modifiés

Fichiers modifiés par la résolution des conflits, au sein du commit rebasé `d00a3e8` :

- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`

Le commit `d00a3e8` porte au total 29 fichiers (176 insertions, 102 suppressions) : les 26 autres sont les apports de `fd49f8e` réappliqués sans conflit.

Fichier ajouté par le présent rapport :

- `.github/orchestration/reports/2026-09-07_rebase-sync-documentation-T02.md`

## Commit final

- **Commit rebasé** : `d00a3e8` — `docs: ajouter les contrats T02 et actualiser les écrans Activité` (réécriture de `fd49f8e` sur `b350e8b`)
- **Push** : `b350e8b..d00a3e8` vers `origin/feat/creation-seance-catalogue`, en avance rapide, sans `--force`
- **Commit du rapport** : renseigné dans la restitution de mission accompagnant ce document.

## État Git

- **Branche** : `feat/creation-seance-catalogue`, synchronisée avec `origin`
- **Historique** : `d00a3e8` sur `b350e8b`, `1e2def1`, `8e97cc5`, `4336667`, `61afcdd`, `f2cf240`, `ed8fbc5`
- **Arbre de travail** : 4 fichiers modifiés non indexés, issus du stash et volontairement non commités — `app.json`, `package.json`, `package-lock.json`, `start-kodjo.ps1`
- **Stash** : `stash@{0}` — `temp avant sync documentation T02`, conservé
