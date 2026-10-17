# Design — gouvernance documentaire (révision 2)

## Historique de ce document

| Révision | Date | Motif |
|---|---|---|
| 1 | 2026-10-16 | Proposition initiale à partir des passes 1 et 2 |
| 3 (proposée, non validée) | 2026-10-17 | Lot 6A, révision 2 : architecture cible de la restructuration ([lot6/plan-restructuration.md](lot6/plan-restructuration.md)). Si Hermann la valide (QR-1), G1 est remplacé par l'architecture C révisée : fichiers conservés ; ch. 08 en conception par fonctionnalité citant les règles du ch. 10 ; conventions d'interface au ch. 06 ; une annexe historique créée. Le tableau de G2 est alors remplacé par les règles de domicile du plan §4.5. D'ici là, G1 et G2 s'appliquent tels quels. |
| 2 | 2026-10-16 | Intégration de la revue ChatGPT des deux diagnostics. L'orientation est conservée ; la gouvernance est allégée : DSF maintenus jusqu'au transfert, le domicile ne tranche pas les contradictions, ancres ciblées, pas de bandeaux systématiques. Ajout des constats de restauration R-06 et R-07 (identifiants et statuts effacés par `7a89220f`). |

Les principaux écarts entre les deux révisions figurent en fin de document (§ « Ce qui change par rapport à la révision 1 »).

## Contexte

Le diagnostic ([diagnostic.md](diagnostic.md), [qualite.md](qualite.md)) montre que les défauts viennent surtout de l'organisation :

- règles de priorité concurrentes ;
- remplacements implicites ;
- copies multiples ;
- identifiants perdus.

Le réexamen de la révision 2 établit qu'une part importante des pertes d'identifiants et de statuts vient d'**un seul commit**, la consolidation `7a89220f` du 14/10. Elle est donc **restaurable depuis Git, sans décision produit** (voir [diagnostic.md §6](diagnostic.md)).

L'objectif reste : **chaque règle a une référence claire, et il n'existe qu'une version normative de chaque règle**.

## Principes

### G1 — Les 13 chapitres restent la structure principale

- Aucune refonte des chapitres.
- Aucune renumérotation générale.
- Aucun déplacement massif de contenu.

Les améliorations se font **sur place**, par petites révisions traçables.

*Lot 6A (17/10) :* une restructuration est désormais **proposée** (plan-restructuration.md, option C). Elle ne s'appliquera qu'après décision de Hermann (QR-1 à QR-9) et sous les contrôles C1 à C12 (texte, portée, autorité, références). Tant que cette décision n'est pas prise, G1 reste en vigueur.

### G2 — Une source normative unique par règle, atteinte progressivement

Une règle produit est énoncée en un seul endroit faisant foi. Ailleurs, elle est **citée** par son identifiant, avec un lien quand c'est utile, plutôt que reformulée.

Pour savoir **où écrire** une règle nouvelle ou réécrite, le tableau indicatif ci-dessous reprend l'organisation déjà annoncée par `INDEX.md` et les chapitres. Il ne sert pas à décider qui a raison en cas de conflit.

| Type de contenu | Emplacement habituel |
|---|---|
| Termes, définitions | ch. 01 (glossaire) |
| Besoins | ch. 02 |
| Parcours (illustratifs) | ch. 03 |
| Concepts et objets | ch. 04 |
| Périmètre des versions | ch. 05 |
| Navigation, inventaire des écrans, captures | ch. 06 |
| Décisions (arbitrages) | ch. 07 |
| Comportements fonctionnels transverses | ch. 08 |
| Données, persistance, migration | ch. 09 |
| Règles métier et calculs (RM-xxx) | ch. 10 |
| API fonctionnelles | ch. 11 |
| Architecture technique | ch. 12 |
| Comportement par écran (CE-xx) | ch. 13 |
| Rendu visuel | Figma |

**Les copies existantes ne sont pas supprimées d'office.** Une copie n'est remplacée par un renvoi que dans deux cas :
- elle diverge de la règle de référence et cette divergence a été tranchée ;
- les deux textes sont identiques, et le remplacement est fait règle par règle, lors d'une révision qui touche déjà ce passage.

### G3 — Le seul emplacement ne résout jamais une contradiction

- Une contradiction entre deux passages est **soit résolue par une décision explicite existante** (D-xxx, ou décision de Hermann documentée), dont la référence est citée, **soit soumise à décision**.
- Ni l'emplacement d'un passage, ni sa date, ni le rang d'un chapitre ne suffisent à la trancher automatiquement.
- Tant qu'une contradiction n'est pas tranchée, **les deux passages restent en place**. La contradiction est consignée dans le change OpenSpec qui la traite.
- Les ordres de priorité existants (PRODUCT.md:434–442, ch. 13:19, ch. 08:33, ch. 07:559) **ne sont pas appliqués mécaniquement** par ce chantier. Leur harmonisation est l'objet de la question Q-A ([arbitrages.md](arbitrages.md)).

### G4 — Les DSF restent applicables jusqu'au transfert vérifié de leurs règles

- Un DSF qui porte aujourd'hui une règle applicable, par exemple RG-1 à RG-13 de DSF-CARTES-ICONES-APPUIS, **reste la référence de cette règle** tant que celle-ci n'a pas été transférée dans un chapitre et que ce transfert n'a pas été vérifié.
- Le transfert se fait règle par règle. Le renvoi depuis le DSF vers le chapitre est posé **dans le même commit** que le transfert, afin d'éviter deux versions normatives.
- Aucun DSF n'est déclassé, déplacé ni marqué « traçabilité » avant ce transfert.

### G5 — Remplacement explicite et texte d'origine conservé

- Une décision qui en remplace une autre la nomme, ainsi que le point remplacé.
- La décision remplacée indique par quoi elle l'est, **et son texte d'origine reste lisible** dans le registre : le renvoi « ancienne version conservée dans Git » ne remplace pas le texte d'origine.
- Une révision réécrit le texte qu'elle modifie et cite la décision. Ce principe vaut pour les révisions futures. Il **n'impose pas** de reprendre d'un coup les compléments datés existants (P-21, P-22) : ils seront traités progressivement (lot 6).

### G6 — Identifiants et liens

- **Restaurer avant de numéroter.** Les identifiants effacés sont rétablis à l'identique depuis Git : `RM-FMT-nn`, `REC-nn`, `DEC-nn`, statuts. Aucune nouvelle numérotation n'est créée tant qu'une restauration est possible.
- **Une nouvelle numérotation** n'est proposée que pour un besoin démontré, par exemple pour des règles sans aucun identifiant historique. Elle se fait alors par famille, sans renumérotation générale.
- **Ancres explicites ciblées.** Elles sont réservées aux cibles qui doivent rester stables face aux renommages et qui sont fortement citées. Cas avéré : CE-FMT-01 à 06, 166 liens. Ailleurs, les liens vers les ancres générées depuis les titres suffisent.
- **Liens rompus.** Ils sont corrigés vers la cible actuelle quand elle existe. Quand la cible a disparu, ils pointent vers un permalien Git de l'état antérieur, si le document est historique.
- Le contrôle mécanique des liens (`outils/links.mjs`) est rejoué après chaque lot.

### G7 — Statut des documents : seulement là où il manque ou trompe

- Pas de bandeau systématique.
- Une mention de statut n'est ajoutée ou corrigée que lorsqu'un document **se présente comme courant alors qu'il ne l'est plus**, ou lorsqu'il **déclare deux statuts incompatibles** (H-15, H-17, H-18). Cas concret : README « Références actives ».

### G8 — Frontière documentation / Figma

C'est un acquis explicite :
- `INDEX.md:3` : « Les règles métier, calculs et comportements sont définis ici ; Figma décrit les dispositions visuelles » ;
- `README.md:11` ;
- décisions D-255 et D-300.

Une valeur de calcul ou par défaut ne se justifie pas par une capture. Le retrait du rendu visuel recopié dans les ch. 09 à 12 (P-17) relève de l'amélioration progressive : il n'est pas prioritaire.

### G9 — OpenSpec : outil de gestion des changements, pas seconde source

- Chaque révision documentaire passe par un change `openspec/changes/<nom>/` : diagnostic, proposition, lot, preuves.
- Aucune règle produit n'est écrite dans `openspec/specs/`.
- La spec delta `specs/gouvernance-documentaire/spec.md` ne décrit que la **méthode de gestion de la documentation**. Elle reste une proposition non archivée.
- L'archivage, qui la copierait dans `openspec/specs/`, ne se fera qu'après validation de cette gouvernance par Hermann.
- L'alternative « migrer les règles produit dans `openspec/specs/` » est **écartée** pour ce chantier.

### G10 — Séparer le documentaire du fonctionnel

Chaque tâche est classée :

| Classe | Définition | Exigence avant application |
|---|---|---|
| **DOC** | Purement documentaire, sans effet possible sur une règle produit : restauration exacte depuis Git, lien, ancre, typographie, mention de statut | Accord de lot ; preuve mécanique de l'absence d'autre changement |
| **DOC-AUTORITÉ** | Clarifie qui fait foi, sans changer le contenu d'une règle | Décision de gouvernance (Q-A à Q-C) |
| **FONCT-ARBITRÉ** | Modifie le texte d'une règle produit pour l'aligner sur une décision **déjà prise** et citée | Citation de la décision ; coordination avec les PR ; vérification de sa portée (générale ou PRE-4) |
| **FONCT-À-ARBITRER** | Exige une décision produit nouvelle | Décision de Hermann |

## Contraintes transverses

- **Sources figées PRE-4.** Les chapitres 01, 04 à 13 et cinq DSF ou matrices sont des sources de PRE-4, figées à `caa2a5cf`. PRE-4 BMAD travaille sur des **copies** (`docs/preparation/PRE-4/bmad/sources-caa2a5cf/`), mais la consigne reste : aucune mise à jour de ces fichiers dans `main` sans décision explicite. Chaque tâche qui les touche porte la marque `[PRE4]`.
- **PR ouvertes :** #363 (ch. 06), #370 (13 chapitres et 3 DSF) et #371 (ch. 06, 07, 08, 13 et 2 DSF). Il a été vérifié qu'**aucune des lignes à restaurer des lots 1 et 3** (lignes EXACT de R-06, lignes du registre de R-07) n'est modifiée par ces PR (`outils/plan-restauration-identifiants.mjs`, `outils/inventaire-lot1-registre.mjs`). Les PR ajoutent cependant des lignes dans les mêmes fichiers : l'ordre de fusion doit être fixé (voir [arbitrages.md](arbitrages.md) Q-L).
- **Pas de nouvelle règle bloquante.** Les principes G1 à G10 décrivent une manière de travailler. Aucun ne bloque une livraison produit. La spec de gouvernance n'emploie MUST que pour des propriétés vérifiables de la documentation.

## Ce qui change par rapport à la révision 1

| Révision 1 | Révision 2 | Raison |
|---|---|---|
| D1 : seuls les chapitres sont normatifs ; DSF en traçabilité | G4 : DSF applicables jusqu'au transfert vérifié | Ne pas créer de vide normatif |
| D2 : domicile + règle d'arbitrage « décision > domicile > autres » | G2 et G3 : l'emplacement indique où écrire ; il ne tranche rien | Éviter une résolution automatique non décidée |
| D4 : ancres explicites pour tous les titres porteurs d'identifiant ; numérotation RM-FMT proposée | G6 : restauration depuis Git d'abord ; ancres ciblées (CE-FMT) | Éviter numérotation et balisage disproportionnés |
| D5 : en-tête de statut obligatoire sur tout document hors chapitres | G7 : seulement là où le statut manque ou trompe | Valeur ajoutée |
| D6 : alternative B (migration vers `openspec/specs`) décrite | G9 : écartée | Pas de seconde source normative |
| Réécriture en place de tous les compléments (lot 2.4) | G5 : principe pour l'avenir ; reprise progressive | Proportionnalité |
