# PRE-9 — Inventaire Figma en lecture seule (page `510:101` « Prototype MVP »)

- Fichier `G6RY5Ebhgwb4AHIOYDwwvg`, accessible le 28/10/2026 par le MCP Figma (`create_session`, `get_metadata`, `get_screenshot`). **Aucune écriture.** `get_design_context` n'a pas été utilisé.
- Les métadonnées de la page (~2 Mo de XML) ont été lues en entier par script : 243 frames de premier niveau. 13 captures ont été examinées (repérées par « [capture] » ci-dessous).
- **Aucune date ni version** dans les noms des frames ou des calques (seules dates trouvées : « août 2026 » dans les maquettes de calendrier ; un seul marqueur « (ancien) », sur un composant DSF de dialogue). L'ancienneté est donc **déduite** des identifiants (le préfixe d'un id grandit avec le temps : 1992 < 8328 < 8598/8624/8656 < 8747/8795 < 9977 < 10705–10836) et des positions sur le canevas. C'est une hypothèse, pas une preuve.
- Codes : **R** = état effectivement représenté (vu en capture ou nommé explicitement) ; **I** = état déduit du nom seulement.

## 1. Composer une séance — conteneurs (ligne y=3172, série 10xxx la plus récente)

| Node | Nom | État représenté | R/I |
|---|---|---|---|
| 10818:20175 | Composition séance — Base (sans circuit) | Séance vide **sans circuit par défaut** (cible D-451 : « cycle technique invisible disparaît ») | I |
| 10705:20223 | Composition séance — Créer (menu) | [capture] Voile + menu d'actions : « Créer un nouvel exercice », « Utiliser un mouvement existant », « Utiliser une séance existante », « Ajouter un circuit », « Ajouter un cycle », « Annuler ». **En arrière-plan, la séance contient encore une ligne « Circuit » par défaut** (calques 10813:206xx) | R |
| 10819:20344 | Composition séance — Ajouter un circuit (emplacement) | [capture] Choix de l'**enveloppe** : exercice choisi (contour plein), exercice candidat (contour pointillé), bas d'écran « Confirmer le circuit / Annuler ». Calques « Enveloppe choisie/candidate — Circuit » | R |
| 10821:20222 | Composition séance — Circuit créé | Résultat après confirmation | I |
| 10836:20478 | Composition séance — Ajouter un cycle (emplacement) | Même mécanique pour un cycle (calques « Enveloppe choisie/candidate — Cycle ») | R (calques) |
| 10717:20056 | Composition séance — Deux circuits repliés | [capture] Exercice direct · Circuit A (3 tours · alternées, ≥ 19 min, résumé « Squat assisté · Extension du genou ») · Circuit B (2 tours · groupées, ≥ 8 min) · point d'arrêt · exercice direct · fin. En-tête ≥ 30 min | R |
| 10725:20142 | Composition séance — Deux circuits Un replié | Un circuit replié, l'autre déployé | I |
| 10744:20108 | Composition séance — Cycle | [capture] Cycle A « 2 répétitions », ≥ 54 min, contenant Circuit A et Circuit B repliés ; exercices directs de séance avant/après ; point d'arrêt ; en-tête ≥ 56 min | R |

Ces 10 ids (avec 8328:34662 et 8328:34813) sont cités dans `docs/KODJO-Composition-conteneurs-2026-10-28.md` l. 95-104 : **ils existent tous**, avec des noms qui correspondent.

**Ce qui n'est pas représenté :** un exercice direct **dans** un cycle (hors circuit) n'apparaît pas dans les captures, alors que D-451 l'autorise (doc l. 15-17). Pas d'état cycle déployé/replié distinct, pas de glisser-déposer d'un circuit entre cycles (doc l. 68), pas de déplacement d'un circuit, pas de récapitulatif de durée propre au cycle hors en-tête.

## 2. Composer une séance — états plus anciens (série 8328, y=3172)

| Node | Nom | Observation | Statut proposé |
|---|---|---|---|
| 8328:28172 | Composition séance — Initial | [capture] Séance vide avec **« Circuit 1 tour · groupées » par défaut** | **Obsolète probable** (modèle à circuit par défaut, remplacé par 10818:20175) |
| 8328:28238 / 28304 / 28377 | Nom saisi / Compte à rebours / Abandon (confirmation) | En-tête, compte à rebours, confirmation d'abandon | Encore utiles (I) |
| 8328:28445 | Composition séance — Sélection exercices | [capture] Feuille « Sélectionner les exercices », cases à cocher, « Créer un exercice », « Sélectionner » | À confronter au menu 10705 (I) |
| 8328:28605 | Composition séance — Standard | [capture] **Circuit unique** déployé « 3 tours · groupées » entre deux exercices directs, point d'arrêt, ≥ 21 min | **Obsolète probable pour la structure** (un seul circuit, nommé « Circuit ») ; le rendu des cartes reste valable |
| 8328:34520 | Standard — Séries variables | Variante de carte | I |
| 8328:28733 / 29133 | Récupération (modale) / Retirer une récupération | Pauses | I |
| 8328:29270 | P-Placement d'une pause | Pause | I |
| 8328:29428 / 33689 | P-Point d'arrêt / Retirer un point d'arrêt | Points d'arrêt | I |
| 8328:28863 | P-Actions glissées | Balayage d'une ligne | I |
| 8328:33546 | P-Déplacement | Glisser-déposer d'un exercice (circuit unique) | I — le déplacement multi-conteneurs n'est pas représenté |
| 8328:33836 / 34006 / 34107 / 34377 | Étiquettes (+ appui long, nouvelle, sélectionnée) | Étiquettes de séance | I |
| 8328:34662 / 34813 | Circuit — Nature (popover / confirmation générique) | Nature du circuit (alternées/groupées) ; conversion | I |
| 8328:34965 / 35135 | Circuit — Volumes (de séries / de tours) | Volume du circuit | I |
| 9779:19874 | Composition séance — Standard — Illustration (photos) | Variante avec photos | I |

## 3. Paramètres d'exécution (feuille modale, y=5720 et 4446)

| Node(s) | Contenu |
|---|---|
| 8328:36923, 37092, 37760, 37862, 9232:44646, 37972, 38193, 38084, 38409, 39072 | Champs vides, mode d'exécution (sélection segmentée), série en durée, roulettes durée de série / de phase / totale, changement de côté replié/déployé, durée totale ajustée (message), une seule série (I) |
| 8328:38513, 38632, 38741, 38848, 39279, 8470:13303, 8982:15172 | Séries variables (avec/sans cadence, tableau replié, déplacement, cas mixte, **phases verrouillées**) (I) |
| 9207:18817, 9289:17849, 9290:17953, 9292:18077, 9307:18208 | Tableau de 3 phases, charge, séries variables avec charge + clavier, durée de l'exercice déployée (I) |
| 9436:18101, 9436:18305, 9439:18307, 9445:18410, 9446:18513, 9446:18738, 9448:18721 | « Création exercice — Séries unifiées / Côtés unifiés » (série 94xx, plus récente) (I) |
| 8328:37022, 10027:40760, 10152:20245, 10152:20369 | Résumé des paramètres affiché, popover du niveau, changer/ajouter un niveau (I) |
| 8328:35698 | P-Ajouter un exercice — Initial — [capture] titre « Créer un exercice », « Nommer le mouvement », catégorie/zone/niveau, média, « Modalités d'exécution » (R) |

## 4. Formats (modèles) — ligne y=8268

| Node | Nom | Observation |
|---|---|---|
| 8598:29271 | P-Composition séance — Modèles | [capture] Titre « Créer », 3 colonnes : **Exercice** / **Séance** (« à composer »), puis Tabata, Intervalles, EMOM, AMRAP, For time, Death by, Renforcement, **Mobilité** (calque « Carte — Mobilité »), Superset, Progression, À l'échec. Calques « Carte — Libre Exercice » et « Carte — Libre Séance » |
| 9977:19613 | P-Composition séance — Modèles — Deux colonnes | [capture] Titre « Choisissez un format de départ », 2 colonnes : **« Un exercice — Format libre, à composer »**, « Une séance — Plusieurs exercices, Format libre, à composer », puis Tabata, Intervalles, EMOM, AMRAP, For time, Death by, Renforcement, Superset, Progression, À l'échec. **Aucune carte Mobilité ni Gainage · Mobilité** |
| 8624:29980 / 8598:29503 / 8624:30306 / 8624:30749 | Tabata : quels exercices / sélection / récapitulatif / préremplie | I |
| 8624:30040 / 30392 / 30880 | EMOM : paramètres [capture : « Tours 6 », « Cadence par exercice 1 min », « Repos jusqu'à la cadence », « Durée totale 12 min », bouton « Choisis tes exercices »] / récapitulatif / préremplie | R pour les paramètres |
| 8624:30143/30521/31043 · 30198/30602/31157 · 30255/30672/31263 | AMRAP, Death by, For time : paramètres / récapitulatif / préremplie | I |
| 8656:33799/33857/33941 · 34196/34263/34356 · 34494/34548/34628 · 34753/34807/34887 · 35005/35062/35145 · 35273/35331/35415 | Intervalles 30/30, Renforcement, **Gainage · Mobilité**, Superset, Progression, À l'échec : paramètres / récapitulatif / préremplie | I |
| 8598:30059, 30515, 30873, 31210, 31560 ; 8656:34070 | « Modification activité — Paramètres (modale) — Exercice <format> » (Tabata, EMOM, AMRAP, Death by, For time, 30/30) | I |
| 8747:14320 / 8747:14451 | Tabata préremplie Par exercice / modale **Par exercice** | [capture 14451] Valeurs imposées grisées (Mode Durée, 8 séries, 20 s, Pause 10 s), mention « 8 séries, 20 s et 10 s : imposés par Tabata. » → **paramètres verrouillés : R** |
| 8795:14449 / 14588 / 14681 | EMOM préremplie Par exercice + modale ; Progression préremplie Par alternance | I |

- Il n'existe **pas de frame de paramètres pour « Libre »** : Libre n'existe que sous forme de cartes et du filtre `8852:15197` dans 4168:11149.
- « Renforcement » et « Gainage · Mobilité » (les démarrages rapides) ont chacun une série paramètres / récapitulatif / préremplie, sans modale « Exercice <format> ».
- **Incohérence de libellés entre les deux grilles** : 8598:29271 dit « Mobilité », 9977:19613 n'a pas cette carte, les écrans de flux disent « Gainage · Mobilité » et le filtre du catalogue aussi (8852:15170). On ne sait pas quelle grille fait référence. Question pour Hermann.

## 5. Abandon de l'exercice autonome (« Un exercice »)

| Node | Observation |
|---|---|
| 1992:9910 | P-Catalogue des séances — Liste par défaut — [capture] onglets Mouvements / Séances / Programmes ; filtre **« Un exercice \| Plusieurs »** (calque « Vue — Un exercice », aussi présent dans 1992:10014, 10518, 10628, 10848, 10937, 2234:88, 2234:189, 4549:6742, 4592:6217, 4593:6285) ; des séances à un seul exercice (« Squat assisté », « Mobilisation du genou ») sont listées comme séances → **l'exercice autonome est représenté comme une séance d'un exercice (R)** |
| 9977:19613 / 8598:29271 | La carte « Un exercice » / « Exercice » subsiste comme format de départ (R) |
| 10705:20223 | Le menu « Créer » propose « Créer un nouvel exercice » / « Utiliser un mouvement existant » **dans** la séance (R) |
| 4521:6220 | « Catalogue des exercices — État vide » : ancien catalogue des exercices → **obsolète probable** (remplacé par Mouvement — Catalogue, série 10266–10797) |
| 5451:4272 | « P-Modal — Choisir un exercice — Planification — Liste longue » : planifier un exercice seul → **obsolète probable** si l'exercice autonome disparaît |
| 4968:8188, 4997:6113, 5588:4363, 5009:6069, 5021:5994, 5581:4257, 4968:8055, 4968:8105 | « Exécution d'un exercice » et « Synthèse d'exécution — Exercice » : exécution d'un exercice autonome → **à requalifier** (séance d'un seul exercice ?) |
| 9882:19049, 10131:21995, 10175:20349 | « Création exercice — Mouvement — … » (mouvements proches, options, nom déjà utilisé) (I) |

## 6. Ids cités dans la documentation

- `KODJO-Composition-conteneurs-2026-10-28.md` : les 10 ids sont présents sur 510:101.
- `DSF-FORMATS-SEANCES-2026-10-14.md` : 8747:14451 est présent. `5548:9818`, `7092:13605`, `7388:13779` et `7388:13786` **ne sont pas sur 510:101**. Ce sont vraisemblablement des composants DSF rangés sur une autre page (non vérifié).
- `13 – Contrats d'écran.md` : la plupart des frames citées existent. **Absents de 510:101** et utiles pour PRE-9 :
  - `8328:35810`, `8328:36056`, `8328:36348`, `8328:36536` (l. 521-524, « Ajouter un exercice — Catégories / Nouvelle catégorie / Zones corporelles / Nouvelle zone corporelle ») : supprimés, ou remplacés par 10415:21993 / 22111 / 22275 / 22335 (« Mouvement — … ») ? **Référence peut-être rompue.**
  - Une quarantaine d'autres ids (2028:*, 3xxx–7xxx, 8129:*, 9577:19843, 9798:44464, 10085:20050, 10124:21979, 10187:20340, 10253:20414, 10257:20651, 10586:4551x) ne sont pas des frames de cette page. Ce peut être des composants ou des calques d'autres pages ; ce n'est pas vérifié.
  - Note : `9577:19843` est déjà annoté « remplacé par D-448 » dans la doc (l. 1009).
  - Le motif « 2026:09/10 » est une date, pas un id.

## 7. Points ouverts (questions, sans décision)

1. Le menu 10705:20223 propose « Utiliser une séance existante ». Est-ce une copie du contenu ? La doc conteneurs l. 15 exclut toute « séance imbriquée ».
2. L'arrière-plan de 10705:20223 montre encore un circuit par défaut, ce qui est incohérent avec 10818:20175 (« Base sans circuit »).
3. Quelle grille de modèles est la référence : 8598:29271 (« Créer », avec Mobilité) ou 9977:19613 (« Choisissez un format de départ », sans Mobilité) ?
4. Les frames « Exécution d'un exercice » / « Synthèse — Exercice » doivent-elles rester, devenir des séances d'un exercice, ou être retirées ?
5. Les états suivants ne sont pas représentés : glisser-déposer entre conteneurs, exercice direct d'un cycle, cycle replié/déployé, résumé de durée par cycle hors en-tête.
