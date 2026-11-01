# KODJO — Composition : circuits, cycles et création

Référence consolidée du 28 octobre 2026. Périmètre : composition de séance et conséquences sur son développement. Source : [décisions et synthèse fournies](KODJO-Conteneurs-composition-2026-10-28-source.md). Figma consulté le 28/10, fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101` Prototype MVP. Analyse et réserves : [revue critique](REVUE-COMPOSITION-2026-10-28.md).

Les règles explicitement décidées dans la source sont intégrées. Les recommandations de la revue ne sont pas des décisions. Figma établit le rendu observé, jamais les calculs ni une preuve de fonctionnement sur appareil. La source affirme une intégration antérieure de D-450 et RM-252 : ces références étaient absentes de `main` au commit `0a40735f`. La présente intégration les rend effectives dans ce référentiel. **Correspondance de registre : la source nomme cette décision D-450 ; la PR ouverte [#402](https://github.com/MyUncried/Application-Routine/pull/402) emploie déjà D-450 pour les filtres des mouvements. Elle est intégrée ici sous D-451, sans modifier son fond.**

<a id="recuperation-exercice-et-defauts-profil"></a>

## Récupération de l’Exercice et défauts du Profil

La Récupération après exercice appartient directement à l’Exercice dans le modèle cible de Séance. La ligne Récupération de la modale Paramètres d’exécution est son unique accès de saisie et de modification ; la Composition affiche exactement cette même valeur, sans objet Récupération autonome ni valeur concurrente. Le bouton Pause / Ajouter un arrêt ne propose que les Points d’arrêt : aucun ajout, réglage ou retrait de récupération par Placement.

À la création d’un nouvel Exercice, sa Récupération reprend « Récupération après un exercice » du Profil ; 30 s n’est pas une constante. Modifier un Exercice conserve sa valeur ; un ancien Exercice sans récupération affiche 0 s sans recevoir le défaut du Profil. Déplacement et duplication conservent la récupération de l’Exercice. À 0 s, aucune récupération n’est exécutée ; les règles existantes de Pause terminale, d’ordre avant Point d’arrêt et de répétition dans un Circuit restent applicables. Les anciens instantanés, exécutions et données historiques restent lisibles sans réécriture ; la règle historique « aucune récupération post-exercice en ACTIVITY » reste limitée à cet ancien parcours, sans réintroduire un Exercice autonome dans la cible.

Toute valeur initialisée depuis un défaut du Profil est présentée dans son cadre à fond orange dans Paramètres d’exécution jusqu’au premier ✓ validant les paramètres de cet Exercice. La règle est générale : elle vise chaque défaut du Profil effectivement repris, pas seulement Récupération. Ouvrir ou fermer la feuille ne vaut pas validation ; ✕ annule les changements et conserve l’état antérieur. ✓ applique les valeurs et leur état validé au brouillon parent ; une réouverture après ce ✓ utilise le rendu normal. La sauvegarde définitive reste celle de la Séance ; abandonner le brouillon restaure l’état enregistré. Changer ultérieurement le Profil ne réinitialise pas les paramètres d’un Exercice existant. Les constantes imposées par un Format ne sont pas des défauts Profil. Le fond orange n’altère ni la valeur ni les règles de calcul, ni les couleurs du texte éditable/verrouillé.

## 1. Structure autorisée — D-451, RM-025, RM-028, RM-252

| Parent | Membres de composition autorisés | Répétition |
|---|---|---|
| Séance | Exercices, circuits, cycles dans leur ordre | Séance entière au lancement |
| Cycle | Exercices directs et circuits, dans leur ordre | Compte propre, 1 à 99, défaut 1 |
| Circuit | Exercices dans leur ordre | 1 à 99 tours, défaut 1 ; nature groupées ou alternées |

Les objets récupération et point d’arrêt conservent leurs règles de placement ; ce tableau définit les appartenances des exercices et conteneurs, pas une extension des positions d’arrêt. [31/10/2026, PRE-9 B.6 — les positions d’arrêt s’étendent désormais à toute la structure par ARB-02 et ARB-06 (registre ch07 « Arbitrages PRE-9 »), sans règle nouvelle : RM-219, RM-251, D-441, D-442 sur la séquence de toute la structure.] Aucun cycle dans un cycle, aucun circuit dans un circuit, aucune séance imbriquée. Un circuit peut appartenir directement à la séance ou à un cycle. Un exercice peut appartenir à chacun de ces trois niveaux. Le cycle technique invisible disparaît de la cible MVP. Plusieurs circuits et plusieurs cycles successifs sont dans le MVP.

Un exercice direct du cycle est exécuté une fois, avec ses séries propres, à chaque répétition du cycle (RM-252). Un exercice direct de la séance l’est une fois. Exemple : séance E0, cycle répété deux fois [E1, circuit trois tours [A,B]], E2 : E0 et E2 sont exécutés une fois, E1 deux fois et le circuit six passages. Chaque circuit développe ensuite ses séries selon sa nature. Le compte à rebours initial et la fin de séance restent hors des conteneurs, présents une seule fois, non déplaçables.

Un conteneur naît autour de membres existants, jamais vide. Un conteneur à un membre est conservé. Il disparaît lorsque son dernier membre en sort. Il n’existe pas d’action distincte « supprimer le conteneur ». Sa disparition ne signifie pas supprimer ses membres déplacés.

## 2. Nature et compte : deux commandes distinctes

| Nature canonique | Un tour | Compte des séries de l’exercice |
|---|---|---|
| Séries groupées | Toutes les séries de A, puis toutes celles de B, etc. | Propre à chaque exercice |
| Séries alternées | Série i de A, puis série i de B, au tour i | N séries pour chaque membre, N étant le compte du circuit |

Les anciens termes « circuit de tours » et « circuit de séries » correspondent respectivement à groupées et alternées. Ils restent des termes historiques, pas une deuxième nomenclature active. Les identifiants techniques persistés ne sont pas migrés par cette mise à jour documentaire.

Exemple avec A et B à trois séries : groupées, trois tours = `(A1 A2 A3 B1 B2 B3) × 3` ; alternées, trois tours = `A1 B1 A2 B2 A3 B3`. Le régime identiques/variables est indépendant de la nature. SU-08 interdit la table supplémentaire de cibles par passage ; il n’interdit pas d’entrelacer les séries propres des exercices.

En-tête : `3 tours · groupées` ou `3 tours · alternées`. L’unité reste « tour(s) » et n’est pas interactive. Toucher le nombre ouvre le stepper ; toucher l’adjectif ouvre le sélecteur de nature. Le sélecteur écrit « Séries groupées » et « Séries alternées », avec les descriptions observées : « toutes les séries d’un exercice exécutées à chaque tour » / « une série de chaque exercice exécutée à chaque tour ». Le féminin pluriel reste constant ; tour et répétition s’accordent au compte. [29/10/2026, recette PRE-9 n° 1 (Hermann) : unité contiguë au nombre, en gras, incluse dans la cible du stepper — voir ch07 « Recette PRE-9 n° 1 — décisions de Hermann du 29/10/2026 ».]

La conversion groupées → alternées conserve N, adapte les séries de chaque exercice à N, étend par la dernière valeur et tronque au-delà. Confirmation si et seulement si des valeurs sont perdues ; Annuler restitue tout l’état antérieur. Les séries tronquées par conversion confirmée ne sont pas restaurées par le retour en groupées. Alternées → groupées conserve les séries et paramètres, sans confirmation. La diminution de N sans conversion conserve la règle existante de réserve dans le brouillon. Le maintien de N commun est décidé ; il ne reste pas ouvert.

## 3. Valeur nulle et valeur manquante

Une cible de série peut être 0 s ou 0 répétition, à toute position. Elle signifie une participation volontairement absente. L’étape correspondante et sa pause sont sautées. En alternées, la série i n’est pas supprimée de la liste : son index est conservé pour que les séries suivantes gardent leur tour.

Une nouvelle ligne porte un tiret, jamais un zéro initialisé. Le tiret signifie « à renseigner » et bloque l’enregistrement ; le zéro est renseigné et l’autorise sous réserve que l’exercice ait un volume non nul. Un exercice dont toutes les cibles numériques sont nulles est refusé. Les cibles À l’échec restent un état distinct : ne pas assimiler l’absence de durée calculable à un volume nul.

Les bornes numériques de cible deviennent 0..100 répétitions et 0..3535 s par série. Le nombre de séries demeure 1..99 et les bornes des pauses demeurent inchangées. Cette ouverture ne rend pas nulles les durées de phases du mouvement, qui conservent leur minimum propre. D-232, D-430 et RM-234 sont remplacées sur le seul minimum de cible de série.

La récupération contextuelle après exercice est distincte de la pause de série. La source ne tranche pas son sort quand l’occurrence est sautée ; ce point est réservé dans la revue, sans règle inventée. [29/10/2026, tranché par ARB-10b (registre ch07 « Arbitrages PRE-9 ») : une occurrence sautée n’exécute pas la récupération qui lui est directement associée ; les pauses indépendantes placées dans la Séance restent conservées.] Le plan développé applique toujours la déduplication des points d’arrêt déjà prévue par RM-251, sans modifier la séance enregistrée.

## 4. En-têtes et identification

Une ligne : nom, chevron de circuit, compteur, durée à droite. Nom et nombre : 15 pt ; unité : 13 pt ; durée : 12 pt. Nom et chevron occupent une colonne fixe, compteur à abscisse fixe ; aucun centrage dans l’espace résiduel. Le bleu `color/primary` marque le nombre et la nature ; `color/text-primary` porte les autres textes. La généralisation du bleu à tous les choix de liste n’est pas décidée ici. [29/10/2026, recette PRE-9 n° 1 (Hermann) : nombre et unité en gras ; durée en noir et en gras ; adjectif en gras ; Circuit replié de 68 pt au total, ligne d’en-tête de 18 — voir ch07 « Recette PRE-9 n° 1 — décisions de Hermann du 29/10/2026 ».]

Circuit replié : deuxième ligne contenant les noms d’exercices séparés par un point médian, sur une ligne tronquée, écart de 7 pt ; hauteur de référence 68 pt. L’ancienne valeur 80 pt du texte de défilement est périmée. Le cycle ne se replie pas : aucun chevron ni zone de repli. Sa ligne n’a pas d’adjectif de nature ; unité « répétition(s) » [31/10/2026, Hermann : « Remplacer le terme « répétition » par « passage » dans la composition de séance pour le nombre de cycles, et dans le message » — unité « passage(s) » ; dialogue « Début / Fin de passage »].

Lettres de désignation : Circuit A, Circuit B, Cycle A ; continuité des circuits à l’échelle de la séance, sans repartir à A dans chaque cycle. Omettre la lettre lorsqu’un seul conteneur de cette nature est présent. La lettre affichée sert à désigner ; elle ne doit pas être confondue avec un identifiant interne stable. La conduite à tenir au-delà de Z reste à préciser si ce cas est autorisé.

À la référence de 402 pt : cycle pleine largeur, circuit 386, exercice 370 ; fonds du plus soutenu au plus clair, sans indentation supplémentaire des cartes de Composition. Frange de dégradé du cycle : 4 pt en haut et en bas, pas un pourcentage. Anneau de borne haute 16 pt autour du repère 10 pt, trait extérieur 1 pt. Les bornes sont des repères, jamais des poignées.

La durée réapparaît dans les en-têtes observés : la clause de D-443 qui la masquait ne décrit plus le rendu cible. Les calculs existants restent applicables ; le rendu du cycle et l’arrondi précis sont à qualifier indépendamment des chiffres illustratifs. Les cibles 48 × 33 pt rapportées par la source sont un compromis de conception, pas une preuve d’accessibilité ; aucune équivalence automatique avec 44 pt de hauteur n’est affirmée.

## 5. Écran de choix et placement

Le menu Créer de la Composition présente exactement quatre options, dans cet ordre : « Créer un exercice » [30/10/2026, contre-recette PRE-9 n° 1 (Hermann) : libellé « Créer un nouveau mouvement »] (annotation PRE-9 portée sur l’ancienne formulation, à réexaminer), « Utiliser une séance existante », « Ajouter un circuit », « Ajouter un cycle ». Chaque option porte son icône ronde à droite ; « Créer un exercice » réutilise l’icône de silhouette du mouvement. La recherche par saisie du nom dans Créer un exercice propose déjà les mouvements existants sous forme de cartes avec titre, niveau, photo et extrait de description : aucune entrée séparée « Utiliser un mouvement existant » n’est proposée. [Remplacé le 01/11/2026 — recette iPhone PRE-9 de Hermann : « il faut intégrer de nouveau l'option du menu « utiliser un mouvement existant » » ; position « 2e, après Créer » ; icône « Haltère (ancienne) ». Le menu présente cinq options, dans cet ordre : « Créer un exercice », « Utiliser un mouvement existant », « Utiliser une séance existante », « Ajouter un circuit », « Ajouter un cycle ». « Utiliser un mouvement existant » ouvre la sélection des Mouvements du Catalogue (sélection multiple, Mouvements déjà dans la Séance marqués « dans la séance ») ; la recherche par saisie du nom dans Créer un exercice reste disponible ; l’axe s’arrête toujours à Ajouter un cycle. Voir ch07 « Menu Créer — recette du 01/11/2026 ».]

À l’ouverture, le bouton + « Ajouter une activité » devient Annuler : croix standard sur fond gris, 34 px, à l’emplacement exact du + et au-dessus du voile. Le toucher ferme le menu sans action ; la fermeture rétablit +. Le bouton Pause / Ajouter un arrêt conserve sa place à gauche, sous le voile. [Précisé le 01/11/2026 — recette iPhone PRE-9 de Hermann : « la zone de contexte doit être sous le voile grisé, seuls le bouton créer -> annuler, et les options doivent être visible dessus » : toute la zone de contexte est sous le voile ; seuls Annuler (le + transformé), l’axe et les options sont au-dessus.] Un axe vertical, au-dessus du voile et sous les options, relie Annuler aux icônes et s’arrête à Ajouter un cycle. Aucune option Annuler n’est ajoutée à la liste.

L’écran ouvert par « Créer un exercice » porte ce même titre. Le bouton de confirmation du mouvement sélectionné porte « Créer un exercice ». Les cartes de suggestion conservent les composants et règles du parcours de recherche existant ; ce libellé ne renomme pas les actions distinctes de correction ou de création d’un Mouvement dans les autres contextes.

**À CLARIFIER — MENU-FMT-01.** Le menu à quatre options ne comporte pas d’entrée Format. [Cinq options depuis le 01/11/2026 (ch07 « Menu Créer — recette du 01/11/2026 ») ; toujours aucune entrée Format.] La prescription antérieure d’ARB-23 d’ajouter Format à ce menu n’est plus active. Le parcours de remplacement permettant d’ajouter un Format depuis la Composition n’est pas spécifié par cette modification ; ne pas inventer de cinquième option [d’accès Format ; la cinquième option rétablie le 01/11/2026 est « Utiliser un mouvement existant »] ni supprimer les Formats de l’Exercice. Les accès aux Formats extérieurs à ce menu ne sont pas modifiés.

Le placement montre l’enveloppe choisie en trait plein et les candidats en pointillé. Pied : « Confirmer le circuit » ou « Confirmer le cycle », avec Annuler. Le cycle accepte des circuits et des exercices directs. Le circuit accepte des exercices. L’illustration de cycle ne montrant que deux circuits n’annule pas l’admission d’un exercice direct.

La création effective exige au moins un membre. La présentation des actions inéligibles, la sélection contiguë/non contiguë, le franchissement d’une frontière de conteneur et le rattachement d’un point d’arrêt à l’enveloppe ne sont pas déduits des captures : réserves explicites de la revue. [31/10/2026, PRE-9 B.4b — demandes de Hermann du 29/10 et précisions du 31/10 (ch07 « A.2b et B.4b — précisions de Hermann du 31/10/2026 ») : plusieurs contenus peuvent être désignés en une fois, un conteneur par contenu désigné (« Un Circuit par Exercice » ; un Cycle par contenu désigné, lecture par analogie à confirmer) ; le conteneur en cours de pose porte deux traits, en haut et en bas de son cadre, qui étendent ou réduisent son périmètre sur les contenus contigus éligibles du même parent (Circuit et Cycle, « idem pour la séance » = « Le Cycle »). Le franchissement d’une frontière de conteneur et le rattachement d’un point d’arrêt restent réservés.] Le menu à quatre options suit MENU-FMT-01 ; aucun accès Format supplémentaire n’est déduit des captures.

## 6. Déplacement — règles G1 à G8

Appui long, déplacement, arrêt sur l’emplacement visé, relâchement. Un exercice change de circuit, de cycle ou de niveau séance ; l’appartenance directe au cycle est autorisée par D-451. Un circuit replié se déplace entre cycles ou vers la séance. Un appui long sur l’en-tête d’un circuit déployé commence par le replier puis amorce son déplacement. [31/10/2026, recette iPhone n° 2 (Hermann) — complété (ch07 « Recette iPhone n° 2 du 31/10/2026 — suggestions de nom, Circuit replié, durée des en-têtes ») : « Appui long sur la zone de la durée d’un circuit ou d’un cycle doit permettre de le déplacer » — la durée de l’en-tête porte le même appui long que le titre ; « L’arrêt d’une carte sur un circuit replié doit l’ouvrir » — une carte arrêtée 500 ms (délai choisi) sur un circuit replié le déploie, ses cartes deviennent des destinations.]

L’étendue change par entrée/sortie des membres, sans poignée. [31/10/2026, PRE-9 B.4b : pendant la pose d’un conteneur (avant « Confirmer »), son périmètre s’ajuste par deux traits, haut et bas (« appui sur les traits puis glissement », Hermann, 29/10) ; une fois le conteneur posé, la règle ci-dessus reste inchangée.] L’éclairage de la destination est obligatoire, particulièrement à la frontière dedans/dehors. Les en-têtes collantes se décollent pendant le déplacement. Le départ du dernier membre entraîne la disparition du conteneur. Les règles d’identité des familles de mouvements ne s’appliquent pas aux conteneurs de composition.

Le déplacement d’un exercice vers un circuit alterné respecte le N commun. Le chapitre 10, « Ajout et sortie du circuit », définissait déjà cette adaptation pour le futur multicircuit ; D-451 la rend applicable au MVP : confirmation en cas de perte, Annuler conserve emplacement et données d’origine, Confirmer réalise déplacement et adaptation ensemble. Sans perte, les règles existantes d’adaptation s’appliquent. La disparition du conteneur source vidé appartient à l’application effective du déplacement. Aucun geste de déplacement d’un cycle entier n’est spécifié dans G1–G8. [29/10/2026, ARB-09 (registre ch07 « Arbitrages PRE-9 ») : déplacement d’un cycle entier autorisé, par le même geste de glisser-déposer, au niveau de la séance (aucun cycle dans un cycle) ; réalisé par PRE-9 B.4 le 31/10/2026.]

## 7. Défilement — règles CS-D1 à CS-D8

Ces identifiants documentaires reprennent D1–D8 validées dans la source ; ils ne sont pas des décisions supplémentaires du registre.

| ID | Comportement |
|---|---|
| CS-D1 | Cartes, compte à rebours, fin et points défilent. Aucun élément collé en bas. |
| CS-D2 | L’en-tête colle lorsque le haut de son conteneur dépasse le seuil et que le bas du conteneur reste sous ce seuil. Le « bord bas » désigne le conteneur entier. |
| CS-D3 | Relève entre conteneurs frères par poussée, sans fondu. |
| CS-D4 | Cycle et circuit peuvent coller simultanément, deux niveaux maximum ; les deux comptes restent visibles. |
| CS-D5 | Les commandes existantes restent actives : nombre/nature/chevron pour un circuit ; nombre seul pour un cycle. |
| CS-D6 | Replier le circuit collé ajuste le scroll pour maintenir son en-tête sous le doigt ; utiliser sa hauteur réelle, pas l’ancienne constante 80. |
| CS-D7 | Pendant un déplacement, décoller les en-têtes ; les rétablir au relâchement. |
| CS-D8 | Tout scroll applicatif amène la cible sous la zone collante, jamais derrière. |

Deux niveaux maximum ne signifie pas hauteur universelle de 60 pt : mesurer les en-têtes rendues, notamment avec agrandissement du texte. Le rail doit rester lisible à travers la zone collante ; montage à vérifier. Priorité CS-D7 pendant un déplacement, y compris lorsqu’un appui long replie d’abord un circuit collé.

## 8. Références Figma vérifiées

| Écran | Node |
|---|---|
| Créer (menu) | [10705:20223](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10705-20223) |
| Deux circuits repliés | [10717:20056](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10717-20056) |
| Deux circuits, un replié | [10725:20142](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10725-20142) |
| Cycle | [10744:20108](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10744-20108) |
| Base sans circuit | [10818:20175](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10818-20175) |
| Ajouter un circuit | [10819:20344](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10819-20344) |
| Circuit créé | [10821:20222](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10821-20222) |
| Ajouter un cycle | [10836:20478](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10836-20478) |
| Nature | [8328:34662](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34662) |
| Confirmation de conversion | [8328:34813](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34813) |

L’écran « Extension par la borne » de la source n’est plus présent dans l’inventaire actuel des frames Composition ; il ne sert pas de référence. Captures examinées : menu, cycle, deux placements, sélecteur de nature. Les autres nodes ont été vérifiés dans l’inventaire. Le stepper ouvert, le survol de destination et le fonctionnement des en-têtes collantes ne sont pas qualifiés par cette revue statique.

## 9. Recette à conduire

| Cas | Résultat attendu ou statut |
|---|---|
| Séance sans conteneur | Exercices directs exécutables ; pas de cycle technique ajouté |
| Cycle avec exercice direct et deux circuits | Répétition de la séquence entière ; comptes des circuits conservés |
| Groupées / alternées, A et B à 3 séries, N=3 | 18 / 6 occurrences avant développement des côtés |
| Alternées : A=[10,0,14], B=[8,9,10] | A1 B1 B2 A3 B3 ; pas de pause propre pour A2 |
| Série manquante / zéro volontaire / toutes nulles | Blocage / admis si volume non nul / refus |
| Conversion avec perte puis Annuler | Aucun changement de nature, compte ni série |
| Dernier membre déplacé / un membre restant | Conteneur disparu / conteneur conservé |
| Circuit déployé saisi par en-tête | Repli avant déplacement ; destination éclairée |
| Repli sous en-tête collante | Position du toucher préservée, contenu accessible |
| Création puis scroll applicatif | Objet visible sous les en-têtes, pied accessible |
| 360/402/440, texte agrandi | Contrôles séparés, noms tronqués sans masquer comptes/durée ; mesure des cibles |
| Dépôt vers alternées avec perte | Confirmation ; Annuler conserve les deux parents et les séries, Confirmer applique déplacement et adaptation ensemble |
| Cycle entier, tour tout nul | Contrats encore à compléter ; aucune validation de recette revendiquée |

Les tests de code et la recette sur appareil ne font pas partie de cette livraison documentaire.
