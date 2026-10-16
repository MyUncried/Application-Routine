# Design — organisation documentaire proposée

## Contexte

Le diagnostic ([diagnostic.md](diagnostic.md)) montre que les défauts viennent moins des règles elles-mêmes que de leur organisation :

- plusieurs règles de priorité concurrentes (H-01, H-02, H-03, H-14) ;
- des remplacements implicites (P-21, P-22, H-09) ;
- des copies multiples (P-13, P-14, H-19) ;
- des documents de travail encore normatifs (H-15, H-16, H-18).

L'objectif est que **chaque règle ait une référence claire et une seule version normative**.

## Décisions de conception proposées

### D1 — Une seule couche normative : les chapitres 01 à 13

C'est déjà l'intention de `INDEX.md:3`. Tout autre document de `docs/` est soit de **navigation** (INDEX, README, PRODUCT), soit de **traçabilité** (DSF, MATRICE, RAPPORT, REVUE, JOURNAL, VERIFICATION). Un document de traçabilité ne peut ni prévaloir sur un chapitre, ni porter seul une règle.

- Conséquence pour les règles qui n'existent que dans un DSF, par exemple RG-1 à RG-13 de DSF-CARTES-ICONES-APPUIS : elles sont **intégrées** dans leur chapitre domicile. Le DSF devient alors une trace.
- Alternative écartée : donner un rang aux DSF. Cela perpétue deux versions normatives (H-03).

### D2 — Un domicile unique par type de règle, au lieu d'un classement des chapitres

Un classement des chapitres, du type « ch. 08 > ch. 13 », traite les conflits comme normaux. Un domicile unique les rend anormaux : toute divergence est un défaut à corriger. Domiciles proposés :

| Type de contenu | Domicile | Les autres chapitres… |
|---|---|---|
| Termes, définitions, termes interdits | ch. 01 Glossaire | emploient le terme, sans le redéfinir |
| Besoins | ch. 02 | — |
| Parcours | ch. 03 (illustratifs) | renvoient aux RM et aux CE |
| Concepts et objets | ch. 04 | — |
| **Périmètre de version** (capacité → version) | **ch. 05, tableau unique** | ne déclarent pas de version |
| Navigation et inventaire des écrans, captures (illustratives) | ch. 06 | — |
| **Décisions** (arbitrages, avec statut et remplacement) | **ch. 07** | citent la décision sans la paraphraser |
| Comportements fonctionnels détaillés, transverses à plusieurs écrans | ch. 08 | — |
| Données, persistance, migration | ch. 09 | — |
| **Règles métier et calculs** (RM numérotées) | **ch. 10** | renvoient à RM-xxx sans recopier la formule |
| API fonctionnelles | ch. 11 | — |
| Architecture et contraintes techniques | ch. 12 | — |
| **Comportement par écran** (champs, états, contrôles, erreurs) | **ch. 13** (CE-xx) | renvoient au CE-xx |
| **Rendu visuel** (layout, couleurs, typographies, dimensions, animations) | **Figma** | la documentation ne recopie ni px ni couleurs ; elle peut nommer la présence, l'ordre logique ou le libellé d'un élément s'ils ont une portée comportementale |

**Règle d'arbitrage transitoire**, tant que les doublons ne sont pas résorbés :

1. une décision explicite du ch. 07, dans sa portée ;
2. le domicile ;
3. les autres chapitres.

Le critère de récence n'est **jamais** un critère d'arbitrage (contre ch. 07:559, H-14).

Cette proposition remplace les ordres de PRODUCT.md:434, ch. 13:19 et ch. 08:33 par **une règle écrite à un seul endroit** : en tête du ch. 07 ou dans INDEX.md, au choix de Hermann.

### D3 — Remplacement explicite et bidirectionnel

- Une décision qui en remplace une autre la **nomme** : « remplace D-xxx, sur tel point ».
- La décision remplacée prend le statut `Remplacée par D-yyy (sur tel point)`. **Son texte d'origine reste lisible**, ce qui interdit d'écrire « ancienne version conservée dans Git » à la place du texte (H-04).
- Le texte normatif du domicile est **réécrit en place**. Une ligne d'historique cite la décision. Il est interdit d'empiler un « Complément du JJ/MM » ou une « Révision » au-dessus d'un corps devenu faux (P-21, P-22).
- Aucune formule générique du type « prévaut sur les anciennes formulations » sans nommer ce qu'elle remplace (H-20).

### D4 — Identifiants stables et liens vérifiables

- Toute règle normative porte un identifiant : D-xxx, RM-xxx, CE-xx, ou des identifiants de version.
- Les titres porteurs d'identifiant reçoivent une ancre explicite courte (`<a id="ce-fmt-01"></a>`). Les liens visent cette ancre et non l'ancre générée depuis le titre. Cela corrige R-02 et résiste aux renommages.
- Plus de numéros vides (R-03), ni de renvois à des fichiers supprimés (R-01). Un contrôle mécanique des liens (`outils/links.mjs`) est rejoué à chaque lot.

### D5 — Statut visible de chaque document hors chapitres

En-tête obligatoire : `Statut : navigation | traçabilité | historique`, la date, et « ne fait pas foi ; voir <chapitre/ancre> ». Pour l'historique, les liens vers des fichiers supprimés sont remplacés par des permaliens Git vers le commit antérieur, par exemple `7a89220f^`.

### D6 — Rôle d'OpenSpec : processus, pas seconde source

- `openspec/specs/gouvernance-documentaire` porte les règles de gouvernance. Ce sont des règles sur la documentation, pas sur le produit.
- Les règles **produit** restent dans les chapitres. Chaque révision documentaire passe par un change OpenSpec (`openspec/changes/<nom>/`) qui décrit le diagnostic, la proposition et le lot. Le change est archivé après application.
- **Alternative B, non recommandée maintenant :** migrer progressivement les règles produit en `openspec/specs/<capacité>/spec.md`. Elle n'est acceptable que si chaque capacité migrée est **retirée du chapitre dans le même commit**, avec un renvoi. Sinon, deux versions normatives coexistent. Elle demanderait en outre de réécrire environ 1,4 Mo de spécifications au format Requirement/Scenario, ce qui n'est pas une exigence de qualité universelle (voir [qualite.md](qualite.md)).

## Risques et arbitrages

- **Sources figées PRE-4 :** la plupart des corrections structurantes touchent des fichiers figés par PRE-4. Elles sont donc séparées en lot 1B, appliqué seulement sur décision explicite et après coordination de l'ordre de fusion avec les PR #370 et #371.
- **Ch. 13 de `main` sans « Inventaire opposable PRE-4 » :** si PRE-4 doit devenir normatif dans `main`, son intégration est un sujet séparé. Elle ne fait pas partie de ce lot.
- **Taille des ch. 06 et 13 :** la résorption des compléments empilés (P-21, P-22) est un travail important, planifié contrat par contrat après le lot 1.
