# PRE-8 — Intégration documentaire contrôlée de `main` (à réaliser avant la livraison finale)

Décision de Hermann du 28/10/2026 (Q-E0) :
- aucune fusion automatique de `main` dans `pre8-bmad/dev` pour synchroniser les documents ;
- avant la livraison finale de PRE-8, une intégration contrôlée conserve les modifications des deux branches et la traçabilité des décisions ;
- chaque conflit est résolu sur le fond, jamais par un choix systématique « ours » ou « theirs ».

**Base observée.** `origin/main` @ `ff7600ac`. Fusion simulée le 27/10 (`git merge-tree`) : 6 conflits documentaires, aucun conflit de code.
- `docs/DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md`
- ch06, ch07, ch10, ch12, ch13

## Corrections de fond déjà décidées, à porter dans les textes de `main`

### b8-3 — Rangs après archivage (Hermann, 28/10/2026, option A)

Les rangs affichés des membres actifs sont recalculés sans discontinuité après archivage ; restaurer réintègre le membre dans cette numérotation. Un membre archivé garde son rang dans la famille complète. Identité, appartenance et clé de tri sont inchangées. Le comportement livré est `MovementCatalogueService` et la fiche Mouvement (`displayedLevelPosition`) ; tests `movementLifecycle.b8.test.ts` et `MovementScreen.b2.integration.test.tsx` (« b8-3 »).

| Fichier sur `main` | Passage | Correction à apporter |
|---|---|---|
| ch09, « Réordonnancement des niveaux depuis le catalogue des mouvements — 27/10/2026 », règle 8 | « Archiver ou restaurer un membre conserve son appartenance et sa clé de tri ; ces opérations ne modifient pas les niveaux. » | Conserver appartenance et clé de tri. Remplacer « ces opérations ne modifient pas les niveaux » par la règle b8-3 : les rangs affichés des actifs sont recalculés sur les seuls actifs ; un archivé garde son rang dans la famille complète. Mention « [remplacé par b8-3, 28/10/2026] » sur le texte d'origine, conservé pour la traçabilité |
| ch09, même section, paragraphe suivant | « Le calcul porte sur la famille complète, membres archivés compris, avant filtrage. » | Préciser : vrai pour le filtrage et pour le rang d'un archivé ; les rangs des actifs se calculent sur les actifs (b8-3) |
| ch07, « Précision de D-439 et D-448 point 9 », paragraphe des clarifications | « Archivage, restauration et filtrage ne changent pas les niveaux » | Limiter au filtrage ; renvoyer à b8-3 pour l'archivage et la restauration |
| ch07, tableau de traçabilité, ligne « 8. Archivage et filtres » | Statut « clos sur ces effets » | Ajouter « rangs après archivage et restauration remplacés par b8-3 (28/10/2026) » |

La partie filtres de la règle 8 (« un filtre masque des membres sans recalculer les niveaux des membres visibles ») reste valable et conforme au code.

### Epic E — arbitrages du 28/10/2026 (ch07 de la branche, « PRE-8, epic E »)

| Fichier sur `main` | Formulation à remplacer | Remplacement |
|---|---|---|
| ch13 CE-T03-01 (révisé) | « La nouvelle logique de combinaison Catégories/Zones reste à rechercher dans les règles existantes ou à préciser pour cette story » | Q-E3 option B : caractéristiques agrégées, OU dans une section, ET entre sections, exercices éventuellement différents, Étiquette et Format de la Séance, Statut d'abord, bascule combinée |
| ch13 CE-T03-01 | Filtre étendu (« conserver les options ») ; état compact absent | ~~Q-E4 : trois états du filtre, deux lignes si nécessaire~~ [remplacé le 28/10, recette q4-02] Q-E4 révisé : inactif, rond qui ouvre ; actif, forme étendue toujours, texte « N filtres » quand le nom ne tient pas, une seule ligne, ni forme compacte ni croix ; 44 × 44 ; réinitialisation sans toucher la bascule ; précision UX hors Figma |
| ch13 CE-T03-01 (actions sur une carte) et ch07 « epic E » | Ouvrir une Séance archivée : aucune règle de consultation dans la Composition | Recette du 28/10 (r2-02, décision de Hermann) : la Séance archivée s'ouvre dans la Composition elle-même en consultation seule, titre « Séance archivée », avis à la place de « Continuer », cartes d'Exercice non ouvrables ; restaurer pour modifier |
| ch13 CE-T03-01 | Format : « le jeu final des vignettes de formats est une dépendance de livraison » | Q-E5 : vignettes visibles, Libre sélectionnable, autres désactivées jusqu'à leur développement |
| ch13 CE-T03-01 et ch07 « Catalogue des séances — carte unique et filtres » | « le catalogue autonome d'exercices est remplacé par la vue Un exercice » | Ajouter E.8-a : anciennes définitions conservées, consultables et modifiables par le parcours d'édition existant, depuis une commande Modifier de la sélection d'Exercices de la Composition (option 1, 28/10), jusqu'à la transition coordonnée avec l'epic C (E.8-b) |
| DSF-CATALOGUE-SEANCES-2026-10-27.md, « Vérification et limites » | « Les règles de sélection multiple […] ne sont pas précisées » | Renvoi à Q-E3 (option B) |
| preparation/catalogue-seances-2026-10-27/PERIMETRE-ET-PROMPT-BMAD.md | « proposition à faire valider : OU entre valeurs […], recherche sur l'ensemble des exercices » | Marquer « validée le 28/10 (Q-E3 option B) » |
| ch13, tableau ancien « Champs et comportements des fonctionnalités — Catalogue de séances » | Toutes, Planifiées, Non planifiées, Archivées ; « T03 n'invente aucune nouvelle option Filtrer » | Aligner sur CE-T03-01 révisé (Statut Actives / Archivées, sections du panneau), en marquant l'ancien texte comme remplacé |

### Autres points relevés pendant la préparation de l'epic E

- **Chaque conflit** est résolu en gardant les décisions des deux branches et leurs sources. La résolution est consignée dans le rapport de mission de l'intégration.

## Préparation de la résolution — état au 28/10/2026, après le développement de l'epic E

Fusion simulée le 28/10 (`git merge-tree --write-tree HEAD origin/main`, HEAD = `pre8-bmad/dev` après E.7, `origin/main` = `ff7600ac`, base `082390c0`) : **toujours 6 fichiers en conflit, 15 blocs, tous documentaires** ; le code fusionne sans conflit (`assets/icons/manifest.json` et `KodjoIcon.tsx` fusionnés automatiquement). Aucune PR documentaire ouverte ou fusionnée depuis #407 ne touche le Catalogue des séances (vérifié le 28/10 ; PR documentaires ouvertes #402, #395, #390 et #246, antérieures, sans lien direct avec le Catalogue des séances).

**Opération Git soumise à décision de Hermann** : réaliser la fusion `origin/main` → `pre8-bmad/dev` (commit de fusion local, sans push), résoudre chaque bloc selon le tableau ci-dessous, puis appliquer les corrections de fond déjà décidées (sections précédentes : b8-3, epic E). Aucune de ces opérations n'a été effectuée.

| Fichier | Bloc | Côté PRE-8 (HEAD) | Côté `main` | Résolution proposée (sur le fond) |
|---|---|---|---|---|
| DSF Mouvements | 1 « Hors de ce lot » | piles, filtres, archives intégrés au lot (arbitrages du 27/10) | refonte hors lot ; Actions glissées et Ajouter un niveau au complément 27/10 | Texte de `main` + précision PRE-8 : piles, recherche, filtres, actions glissées, archives et suppression intégrés par les arbitrages du 27/10 (ch07) |
| ch06 | 1, 2, 4, 5 navigation | cinq destinations avec « (E01) » et Communauté « visible et désactivée » | cinq destinations, rédaction propre | Rédaction de `main` ; conserver « Communauté visible et désactivée, sans écran » (comportement livré E01), supprimer les mentions « auparavant quatre » devenues inutiles |
| ch06 | 3 calendrier | même paragraphe, variante mineure | idem | Comparer mot à mot à la fusion ; garder la version la plus récente de `main` sauf mention PRE-8 propre |
| ch07 | 1 fin de section 27/10 | sections « Arbitrages Catalogue des Mouvements », « Recette A/B » (1er, 2e passages), « epic E — arbitrages du 28/10 », passages 3 et 4, bouton Lecture, b8-3 | « Complément — Ajouter un niveau dans le glissé (27/10) » | **Conserver les deux** : sections PRE-8 puis complément de `main` (aucun recouvrement de règle : B11/B12 PRE-8 et le complément disent la même chose ; ajouter un renvoi réciproque) |
| ch07 | 2 D-225 | texte ancien + « supersédé par E01 » | texte réécrit à cinq destinations (`6513:20151`) | Texte de `main` (il intègre E01) ; ajouter « Communauté visible et désactivée (E01, 27/10) » |
| ch10 | 1 rang et archivage | « archivage tranché b8-3 (28/10) » | règle 8 : archiver ou restaurer conserve appartenance et clé de tri | Garder la phrase de `main` sur appartenance et clé de tri ; remplacer « ne modifient pas les niveaux » par la règle b8-3 (section b8-3 ci-dessus), texte d'origine marqué « [remplacé par b8-3, 28/10/2026] » |
| ch12 | 1 `icon.navigation` | « (cinq depuis E01) » | « cinq destinations » | Texte de `main` |
| ch12 | 2 navigation + animations | phrase navigation + **puce « Animations de mise en page (B05) »** | phrase navigation seule | Phrase de `main` **et** puce B05 de PRE-8 (règle technique propre à PRE-8, absente de `main`) |
| ch13 | 1 CE-MVT-01 (actions de la fiche) | « variante → difficulté puis création » | « Ajouter un niveau → choix du sens puis création ; depuis le glissé, CE-MVT-02 » | Texte de `main` (B12 PRE-8 identique sur le fond) ; vérifier à la fusion qu'aucune autre précision PRE-8 de la ligne n'est perdue |
| ch13 | 2, 3, 4 navigation | quatre → cinq avec mentions E01 | cinq destinations | Texte de `main` ; Communauté désactivée précisée dans le contrat CE-UI-05 si absente |

Les tokens ajoutés par l'epic E au ch12 (`cardsArchiveBorder`, `catalogueSessionTitle`, `catalogueSessionMuted`) sont hors des blocs en conflit (fusion automatique attendue) : à vérifier dans le résultat.

### Écarts relevés pendant le développement de E, à corriger sur `main` à l'intégration

| Fichier sur `main` | Passage | Constat | Proposition |
|---|---|---|---|
| ch13, « Catalogue des séances — Filtres » (l. ~700) | « sélecteur `Exercices / Séances` […] `Exercices` actif en T03 » | Contredit les trois segments (spécification §4) et E.8-a. La phrase « T03 n'invente aucune option de filtre » est traitée par la ligne ch13 du tableau « Epic E » ci-dessus | Marquer le sélecteur « [remplacé par la spécification du 27/10 §4 et E.8-a, 28/10/2026] » |
| ch13, « Carte de Séance — vue déployée » | « groupe compact `durée/reps · xN` […] `12 reps · x3`, `45 s · x2` » | Différence avec la spécification du 27/10 §2 (« nom à gauche, volume à droite », exemples Figma « 3 × 12 reps ») ; aucun texte ne remplace explicitement l'ancien format | ~~Question à Hermann (R-E4)~~ **Tranché le 28/10 (R-E4 OK)** : format de la synthèse d'occurrence (« 3 × 12 rép. », « 45 s ») ; marquer `durée/reps · xN` « [remplacé, R-E4, 28/10/2026] » |
| ch13, « Catalogue des séances — Actions sur une carte » | « zone `Démarrer` : ouvre l'écran initial d'Exécution » | Aucune Exécution n'existe ; CE-T03-01 (« destination non livrée explicitement indisponible ») appliqué | Ajouter « tant que l'Exécution n'est pas livrée, Lecture est présente et indisponible » |
| ch13, « Catalogue des séances — Création d'une Séance » | Créer : « ouvre `Composer une séance` » | Conforme au code (E.4) ; l'ancienne liste d'options Créer n'existe plus | Rien, sinon retirer toute mention restante de l'arbre « Un nouvel exercice / Une séance » |
| ch13, « Catalogue des séances — État vide » | « Le filtre `Archivées` possède également un état vide […] message d'absence de Séance archivée » | Texte non fourni ; Q-E6 ne le couvre pas ; le code affiche « Aucune séance ne correspond aux filtres. » | ~~Question à Hermann (R-E5)~~ **Tranché le 28/10 (R-E5 OK)** : message générique ; marquer le message propre aux Archivées « [remplacé, R-E5, 28/10/2026] » |

### Passages anciens relevés par la seconde passe documentaire (28/10), à marquer remplacés à l'intégration

Identiques sur la branche et sur `main` (`ff7600ac`) sauf mention ; aucune modification faite sur la branche (spécifications produit : correction après validation de Hermann d'un lot proposé).

| Fichier | Passage | Contradiction avec le livré | Proposition |
|---|---|---|---|
| ch06 (branche l. ~309) | carte « 354 × 90 […] Étiquette puis catégories […] sans vignette, définitivement (D-260) » | Carte unique (spécification §1, remplace D-260/D-261 au Catalogue) ; `main` porte déjà la mention de remplacement | Prendre la version de `main` à la fusion |
| ch13 (branche l. ~465) | « Segment Exercices → CE-T03-02 […] Démarrer → CE-EXEC-SESSION-01 » | Segment retiré (E.8-a) ; Lecture indisponible | Marquer remplacé (E.8-a) ; Lecture indisponible tant que l'Exécution n'est pas livrée |
| ch13 (branche l. ~638, ~650, ~658, ~732) | « `Exercices / Séances` », zone `Démarrer`, filtre `Toutes` | Trois segments, Lecture indisponible, Statut Actives / Archivées | Couvert par CE-T03-01 révisé de `main` ; vérifier après fusion |
| ch13 (l. ~5017, ~5034) | « communs à `Exercices / Séances` », « exactement **Exercices / Séances** » | Trois segments | Marquer remplacé par la spécification du 27/10 §4 |
| ch01 (l. ~256, 259, 260, 299) | glossaire « Catalogue des exercices », « Toutes », « Planifiées » | Plus de Catalogue des exercices autonome ; Statut Actives / Archivées | Ajouter « [remplacé, 28/10/2026 : vue Un exercice du Catalogue des séances ; Statut Actives / Archivées] » |
| ch02 (l. ~210, 214, B-077) | « ouvrir le Catalogue des Exercices depuis le sélecteur de type » | Idem | Idem, renvoi à E.8-a (accès par la sélection d'Exercices de la Composition) |
| ch03 (l. ~174, 198, 289) | « l'utilisateur sélectionne `Exercices` » | Idem | Idem |
| `docs/DSF-SEGMENTES-TITRES-2026-10-07.md` l. 13, `docs/BACKLOG-SEGMENTS-CATALOGUE-2026-10-07.md` l. 12 | segmenté `Exercices / Séances` | Idem | Mention « remplacé par la spécification du 27/10 §4 » en tête des passages |

## Complément du 28/10/2026 — `main` @ `0a40735f` (familles de niveaux)

`origin/main` a avancé de `ff7600ac` à `0a40735f` (« docs: actualiser ordre et composition des familles de mouvements », 24 fichiers). Ce commit n'a pas été fusionné : ses règles A à E sont lues et appliquées au code par le lot `fam-familles-de-niveaux-geste`. À la fusion locale soumise à décision (Q-E0), en plus des 15 blocs ci-dessus :

- **Ne pas propager** les formulations contraires à b8-3 (rangs affichés recalculés sur les membres actifs après archivage ou restauration) ; liste exacte des passages et correction proposée : `implementation-artifacts/spec-familles-mouvements-2026-10-28.md`, § 7.
- **Préciser B5** : dans PRE-8, Trier n'étant pas actif, le classement implicite par nom tient lieu de tri.
- **Réserves à faire trancher** [tranchées le 28/10, voir « Clôture du lot Familles » ci-dessous] avant de les écrire dans `main` : libellé de l'entrée dans une famille, alternative accessible, dernier couple avec un archivé, singleton subi, renumérotation de secours (même fichier, § 6).
- Le nombre de conflits textuels avec la branche n'a pas été recalculé pour `0a40735f` ; à refaire au moment de la fusion autorisée.

## Clôture du lot Familles (28/10/2026)

Patch prêt : `_bmad-output/pre8/integration-familles-cloture-2026-10-28.patch`, établi sur `origin/main` @ `0a40735f` (`git apply --check` OK sur un index temporaire). Il porte b8-3, le rééquilibrage technique exceptionnel, le libellé d'entrée définitif, le report VoiceOver, l'écart pointillé accepté provisoirement et le dépliage à l'arrêt (DSF familles, DSF Mouvements du 27/10, ch07 avec le texte de b8-3, ch09, ch10, ch13). Le ch07 de `main` ne porte pas b8-3 : le patch en reprend le texte dans son paragraphe de clôture, il ne dépend donc pas de la fusion du ch07 de la branche. Il remplace, pour ces fichiers, la section « Réserves à faire trancher » ci-dessus (réserves désormais tranchées). **Opération soumise à décision** : application lors de l'intégration documentaire de `main` ; aucune écriture dans `main` n'a été faite.

## Intégration réalisée (28/10/2026, clôture de PRE-8)

Fusion de `origin/main` @ `c73079e9` dans `pre8-bmad/dev` (commit de fusion local, publié avec la branche) : conflits résolus selon le présent plan ; corrections du patch `integration-familles-cloture-2026-10-28.patch` appliquées directement aux fichiers fusionnés (le patch reste comme trace) ; Q-E4 révisé, consultation en lecture seule, R-E4, R-E5 déjà présents dans le ch07 et le ch13 de la branche. La fusion de la PR dans `main` reste soumise à l'autorisation de Hermann.
