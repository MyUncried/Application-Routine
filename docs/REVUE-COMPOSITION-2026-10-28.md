# Revue critique — Composition simplifiée KODJO

28 octobre 2026. Base vérifiée : `main`, `0a40735f3eed8be440ef5d4ea9386ec2b9d108f6`. [Référence consolidée](KODJO-Composition-conteneurs-2026-10-28.md) ; [source fournie](KODJO-Conteneurs-composition-2026-10-28-source.md). Aucun code applicatif ni écran Figma modifié.

## Conclusion

Le concept est cohérent : le circuit règle l’ordre de développement des séries ; le cycle répète une séquence qui peut mêler exercices et circuits. L’exercice direct d’un cycle évite le circuit artificiel à un membre pour une mobilisation à répéter. Le multi-circuit autorise une alternance de blocs sans multiplier les objets de catalogue. Le repli rend les circuits lisibles et déplaçables. La création par enveloppe unifie les deux niveaux et ne produit pas de conteneur vide.

La simplification est surtout visuelle et gestuelle. Les contraintes métier restent réelles : N imposé en alternées, conversion parfois destructive, trois niveaux possibles d’appartenance et multiplication des comptes. Les cacher davantage ne les supprimerait pas. La prochaine priorité est la qualification des transitions et le contrat des frontières, pas un nouveau remaniement du menu ou la suppression d’une des deux natures.

## Constats et traitement

| ID | Qualification / preuve | Conséquence et traitement |
|---|---|---|
| C01 | Contradiction interne : source §8 « crée un conteneur vide » contre G5 et les deux écrans de placement | Critique retirée de la référence courante. Le bouton ouvre le placement, l’objet n’existe qu’avec des membres. |
| C02 | Proposition périmée : source §8 « le cycle s’étend par ses bornes » contre §6/G1–G8 | Extension par déplacement de membres ; aucune poignée. L’écran d’extension n’est plus trouvé dans l’inventaire Figma actuel. |
| C03 | Écart de référentiel : SU-04 de main ne permettait explicitement que des circuits dans un cycle ; décision de cycle et RM-252 absentes | Intégration de la décision citée par la source, sans prétendre qu’elle était déjà publiée. |
| C04 | Contradiction réelle : chapitre 10 RM-025/RM-028 et modèle 04/09 imposaient encore cycle invisible et circuit unique | Cardinalités et comptes remplacés ; aucun cycle implicite ajouté à une séance simple. |
| C05 | Écart explicite : D-442 impose stepper permanent, 44 pt et taille uniforme ; source §3 et Figma montrent un nombre seul | Remplacement ciblé documenté. Le compromis tactile demeure à tester, la largeur ne démontre pas l’équivalence à la hauteur perdue. |
| C06 | Contradiction supplémentaire : D-443 masquait la durée et plaçait le stepper à droite ; Figma la rétablit à droite du compteur | Rendu courant documenté avec remplacement ciblé. Aucun nouveau calcul ou arrondi dérivé des exemples. |
| C07 | Valeurs incompatibles : 68 pt en source §3, 80 en D6 ; budget collant annoncé ~60 sans mesure responsive | Retenir 68 pour la référence compacte et la hauteur réelle pour le scroll ; deux niveaux ne garantissent pas 60 pt fixes. |
| C08 | Ambiguïté de D2 : « son bord bas » peut désigner l’en-tête au lieu du conteneur | Formulation précisée : le bas du conteneur délimite sa zone collante. D5 distingué entre cycle et circuit. |
| C09 | Écart Figma/source : le seul cycle de `10744:20108` s’appelle Cycle A | Règle conservée : pas de lettre s’il n’y a qu’un cycle. Écart visuel signalé, aucune modification Figma autorisée par cette tâche. |
| C10 | État non couvert : menu `10705:20223` montre Ajouter circuit/cycle actifs sur une composition vide avec un ancien circuit vide derrière | La capture ne suffit pas à définir l’éligibilité. Recommandation : action indisponible avec raison intelligible sans membre éligible ; ne pas créer un conteneur vide. Présentation à arbitrer. |
| C11 | Fragilité de vocabulaire : « alternées » seul oblige à reconstituer « séries » ; l’accord grammatical ne prouve pas la compréhension | Forme courte conservée, libellé complet dans le sélecteur. Recommander un libellé vocal complet et tester la compréhension ; ne pas imposer une nouvelle mise en page. |
| C12 | Affirmation non étayée dans la source : revue de 18 applications, aucune création depuis bouton global | Non utilisée comme preuve contre le menu actuel ; aucun benchmark reproduit. La critique pertinente est l’éligibilité, pas l’emplacement global du bouton. |
| C13 | État de clôture trompeur : « aucun ne reste ouvert » mais A et D sont reportés | Distinguer B clos, C périmé, A formats et D communauté différés. Aucun de ces reports n’invalide la structure retenue. |

## Transitions à compléter avant développement des cas concernés

### 1. Dépôt dans un circuit alterné — résolu par une règle existante

Exemple : exercice à cinq séries déplacé vers un circuit à trois tours. Le chapitre 10, « Ajout et sortie du circuit », contient déjà : « Futur, hors MVP : déplacement vers un autre circuit de séries selon la même adaptation. Annuler conserve emplacement et données d’origine ; confirmer réalise déplacement et adaptation ensemble. » D-451 admet désormais le multi-circuit : la mention hors MVP est retirée, sans inventer une nouvelle confirmation. Le contrat de perte est conservé ; la disparition du conteneur source vidé intervient avec le déplacement effectivement appliqué. Recette à réaliser avec les deux parents, les séries et Annuler/Confirmer.

### 2. Sélection d’une enveloppe et frontières — priorité haute

Les cadres plein/pointillé rendent lisible l’appartenance provisoire. Ils ne disent pas si deux éléments non contigus peuvent être choisis, si les intermédiaires sont automatiquement inclus, ni comment sélectionner à cheval sur deux parents. Il faut préciser ces cas sans introduire implicitement un réordonnancement. Même réserve pour le point d’arrêt situé entre deux membres enveloppés : devient-il interne et répété, ou reste-t-il hors conteneur ? La récupération attachée à l’exercice et le point d’arrêt autonome ne doivent pas être traités comme un même objet.

### 3. Zéros et plan développé — priorité haute

Zéro est utile pour une participation partielle tout en conservant N commun : A=[10,0,14], B=[8,9,10] garde trois indices. Il n’y a pas de série A2 exécutée ni sa pause. Il reste à traiter : tous les exercices à zéro au même tour ; pause entre côtés d’une occurrence sautée ; récupération contextuelle positive après une occurrence nulle ; points d’arrêt devenant voisins après suppression des étapes ; conversion de [10,0,0] vers un N inférieur ou extension dont la dernière valeur vaut zéro. La validation d’un exercice tout nul ne doit pas confondre cible À l’échec et total non calculable.

### 4. Cycle entier et disparition — priorité moyenne

G3 décrit le déplacement du circuit, G4 son repli préalable. Rien ne décrit celui du cycle entier, qui ne peut pas se replier. Ne pas annoncer un geste universel couvrant cet objet. L’absence d’action de dissolution réduit les commandes mais peut coûter plusieurs déplacements pour retirer une enveloppe : conserver la décision, tester le coût sur un cycle à nombreux membres. La disparition du dernier membre doit être compréhensible et ne doit pas être confondue avec une perte des membres.

### 5. Toucher, texte et défilement — priorité moyenne

Le compteur révélé économise de la place, au prix d’un toucher supplémentaire. Des cibles de 33 pt de haut ne deviennent pas démontrées accessibles parce qu’elles font 48 pt de large. Tester séparément nombre, nature et chevron, repos et position collante, largeurs 360/402/440 et texte agrandi. Un changement de hauteur ne doit pas déplacer la commande sous le doigt au repli. Vérifier le rail et l’accès aux premières positions de dépôt lorsque les en-têtes se décollent. Prévoir une interaction accessible équivalente au glisser-déposer est une recommandation à concevoir, pas un contrôle déjà dessiné.

### 6. Durées, noms et formats — priorité moyenne

Le cycle affiché multiplie la séquence ; les durées des en-têtes doivent agréger le plan réel avec leurs catégories exact/estimé/minimum, sans multiplier deux fois les séries alternées ni additionner des valeurs déjà arrondies. Les chiffres Figma ≥19, ≥8 et ≥54 ne sont pas des oracles. L’arrondi du cycle et les cas de changement de format sur une composition hétérogène restent à définir dans leur périmètre. Les lettres doivent rester des désignations ; au-delà de Z et après déplacement, la politique de réattribution reste à préciser. Le nom de fichier Figma « Volumes (de tours) » demeure historique ; sa présence n’introduit pas une troisième nature.

## Portée de la livraison

La référence consolidée remplace les raisonnements périmés de la source sans altérer sa copie d’origine. Le registre reprend D-451 pour la structure déjà décidée et enregistre un complément daté pour le rendu, les gestes, le zéro et le défilement, sans inventer un numéro de décision validée. Les chapitres métier, données, écran, API, architecture, PRODUCT, INDEX et annexes sont raccordés. Les anciennes valeurs nécessaires à l’historique sont explicitement identifiées comme remplacées.

Les états Figma ont été consultés en lecture seule. Cette livraison ne certifie ni le stepper révélé, ni le survol de destination, ni les en-têtes collantes sur appareil. Aucune modification du catalogue, des familles de mouvements, des écrans d’exécution ou des préparations PRE-4 figées.

## Coordination du registre

La PR ouverte [#402](https://github.com/MyUncried/Application-Routine/pull/402), vérifiée le 28/10, réserve D-450 au filtrage des familles de mouvements. La source jointe emploie le même numéro pour les cycles. L’intégration des cycles utilise donc D-451 ; la source est conservée verbatim et la correspondance explicitée. Le changement de numéro ne crée aucun nouvel arbitrage. PR #407 déjà fusionnée ; aucune autre PR documentaire de composition trouvée dans les dix PR les plus récemment mises à jour consultées.

## Validation documentaire

- Relecture des cinq captures Figma citées et inventaire des dix nodes de référence.
- Source jointe conservée à l’identique, distincte de la consolidation.
- Contrôle des liens ajoutés, des remplacements explicites et des bornes ciblées ; les valeurs historiques du registre et de la source restent conservées.
- Aucun changement dans app, src, tests, e2e, scripts, configuration, Figma ou préparation PRE-4.
- Le déplacement inter-circuits avec perte est couvert par le contrat préexistant, désormais dans le MVP. Les réserves restantes ne sont pas présentées comme des règles validées.
- Aucun test applicatif exécuté : livraison exclusivement documentaire. La recette proposée reste à réaliser.
