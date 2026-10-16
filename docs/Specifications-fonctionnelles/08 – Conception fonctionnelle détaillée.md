# 1. Principes généraux

> Planification à plusieurs contenus (08/10) : les règles antérieures d’archivage supprimant les Routines associées restent décrites pour le cas à contenu unique. Leur extension à une Routine contenant d’autres contenus est **non définie** ; ne pas supprimer ces autres planifications par généralisation. Voir la chapitre 08, Planification.

## 1.1 Objectif du document

Ce document décrit le fonctionnement détaillé des principales fonctionnalités du MVP.
Il complète les parcours utilisateur, les wireframes, le modèle de données fonctionnel et les règles métier en précisant le comportement attendu de l'application lors de son utilisation.
Il constitue la référence fonctionnelle utilisée pour le développement.

## 1.2 Périmètre

Ce document décrit :
- le comportement détaillé des fonctionnalités du MVP ;
- les interactions entre les différents écrans ;
- les comportements attendus lors des actions de l'utilisateur ;
- les règles propres à chaque fonctionnalité.

Il ne décrit pas :
- les parcours utilisateur ;
- la navigation entre les écrans ;
- le modèle de données ;
- les règles métier transverses ;
- les choix techniques d'implémentation.

## 1.3 Organisation

Le document est organisé selon les principales fonctionnalités du MVP.

Chaque chapitre décrit le fonctionnement détaillé d'une fonctionnalité indépendamment des écrans utilisés.
Lorsqu'une fonctionnalité fait intervenir plusieurs écrans, son comportement est décrit une seule fois dans le présent document.
Les caractéristiques propres à chaque écran restent décrites dans le chapitre **06 – Écrans et navigation de la V1**.
Les champs, contrôles et comportements spécifiques des écrans sont définis au chapitre 13.

## 1.4 Documents de référence

Chaque sujet est décrit dans un document unique afin d'éviter toute redondance.

| Sujet                                     | Document de référence                              |
| ----------------------------------------- | -------------------------------------------------- |
| Vision du produit                         | 01 – Vision générale                               |
| Utilisateurs et besoins                   | 02 – Utilisateurs et besoins                       |
| Parcours utilisateur                      | 03 – Parcours utilisateur                          |
| Fonctionnalités                           | 04 – Modèle fonctionnel                            |
| Versions du produit                       | 05 – Versions du produit                           |
| Navigation et écrans                      | 06 – Écrans et navigation de la V1                 |
| Décisions de conception                   | 07 – Registre des décisions                        |
| Comportement détaillé des fonctionnalités | 08 – Conception fonctionnelle détaillée            |
| Modèle de données                         | 09 – Modèle de données fonctionnel                 |
| Règles métier transverses                 | 10 – Processus métier et règles métier transverses |
| API fonctionnelles                        | 11 – API fonctionnelles                            |
| Architecture technique                    | 12 – Architecture technique                        |

## 1.5 Convention de lecture

Les termes utilisés dans ce document sont définis dans le **Glossaire**.

Les captures d'écran et wireframes illustrent les comportements décrits, mais ne constituent pas la référence fonctionnelle.

En cas de divergence entre un wireframe et le présent document, la spécification fonctionnelle prévaut.

## 1.6 Évolutivité

Les comportements décrits correspondent au périmètre du MVP.

Les évolutions prévues pour les versions ultérieures sont décrites dans le chapitre **05 – Versions du produit** et ne sont pas détaillées dans ce document, sauf lorsqu'elles sont nécessaires pour justifier un choix de conception du MVP.

# 2. Cycle de vie d'une séance

## 2.1 Principe général

Une séance constitue le modèle fonctionnel utilisé pour exécuter un entraînement.

Elle est créée une seule fois, peut être modifiée à tout moment, puis utilisée librement pour une exécution immédiate ou pour créer une ou plusieurs routines de planification.

Une séance reste indépendante de ses routines et de ses exécutions.

Les modifications apportées à une séance n'ont aucun effet sur les exécutions déjà réalisées.

## 2.2 Création d'une séance

La création d'une séance se déroule en quatre étapes successives :

1. saisie du nom, sélection de la couleur et construction de la Composition dans l’écran unique `Composer une séance` ;
2. sélection de l’Étiquette de Séance ;
3. retour au Catalogue des séances.

À l'issue de cette création, la séance est immédiatement disponible dans le catalogue.

Aucune routine n'est créée automatiquement.

## 2.3 Modification d'une séance

Une séance peut être modifiée à tout moment depuis le catalogue des séances.

La modification d’une Séance ouvre directement l’écran unique `Modifier une séance`, prérempli avec le nom, la couleur et les Exercices. Les modifications sont enregistrées selon les validations explicites prévues par les écrans.

L'utilisateur peut notamment modifier :

- son nom ;
- sa couleur ;
- sa composition ;
- ses exercices ;
- son Étiquette.

Les modifications sont immédiatement visibles dans le catalogue.

Les routines associées utilisent automatiquement la dernière version de la séance.

Les exécutions déjà enregistrées conservent leur propre instantané.

## 2.4 Duplication d'une séance

Une séance peut être dupliquée afin de créer rapidement une nouvelle variante.

La duplication crée une nouvelle séance indépendante.

La copie reprend :

- le nom de la séance avec le suffixe disponible suivant : `(copie)`, puis `(copie 2)`, `(copie 3)`, etc. ;
- l’Étiquette, dont la couleur devient la couleur de la Séance ;
- l'ensemble de la composition ;
- les paramètres d'exécution.

Les deux séances deviennent totalement indépendantes.

## 2.5 Suppression d'une séance

Une séance peut être supprimée depuis le catalogue.

La suppression est définitive.

Si la séance est utilisée par une ou plusieurs routines, l'application demande une confirmation avant la suppression.

La suppression d'une séance entraîne également la suppression de toutes les routines qui lui sont associées.

Les exécutions déjà enregistrées restent conservées dans l'historique.

## 2.6 Exécution d'une séance

Une séance peut être exécutée :

- directement depuis le catalogue des séances ;
- depuis une routine planifiée.

Au démarrage de l'exécution, un instantané fonctionnel de la séance est enregistré.

Cet instantané est utilisé pour garantir la cohérence de l'historique, même si la séance est ensuite modifiée.

## 2.7 Planification d’un contenu

Une Séance **ou un Exercice persistant** peut être associée à zéro, une ou plusieurs Routines.

Chaque Routine possède sa propre règle de créneau et une liste ordonnée de références SESSION/ACTIVITY .

La suppression d'une Routine n'a aucun effet sur sa source. La modification de la source est prise en compte par les occurrences futures ; au démarrage d’une Exécution, un Instantané immuable de la source est créé.

## 2.8 Historique

Chaque exécution crée un nouvel enregistrement dans le suivi.

L'historique conserve notamment :

- l'instantané de la séance ;
- les temps réalisés ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur.

L'historique n'est jamais modifié par les évolutions ultérieures de la séance.

## 2.9 État persistant et qualificatifs d'une séance

Le statut persistant d’une Séance est binaire : `Active` ou `Archivée`.

| Notion | Nature | Description |
| --- | --- | --- |
| En création | État temporaire du brouillon | La Séance n’est pas encore persistée. Ce n’est pas une valeur du statut de la Séance. |
| Active | Statut persistant | La Séance est disponible dans le Catalogue et peut être exécutée ou planifiée. |
| Archivée | Statut persistant | La Séance est retirée du Catalogue actif ; elle peut être restaurée ou supprimée définitivement depuis les archives. |
| Planifiée | Qualificatif dérivé, non exclusif | Au moins une Routine active référence la Séance. |
| Exécutée | Qualificatif dérivé, non exclusif | Au moins une Exécution existe dans le Suivi. |

Une Séance peut donc être simultanément `Active`, planifiée et déjà exécutée. `Supprimée` n’est pas un statut persistant : après suppression définitive, la Séance n’existe plus ; les Exécutions historiques restent consultables à partir de leurs Instantanés.
# 2 bis. Catalogue des Exercices — cycle de vie d’un Exercice persistant — MVP T03

## 2 bis.1 Catalogue multi-type

Le Catalogue distingue `Exercices` et `Séances`. `Séances` reste le type actif par défaut ; `Exercices` devient également actif dans le MVP à partir de T03. Dans le MVP T03, sélectionner `Exercices` charge les références persistantes ; aucun segment ni objet autonome Parcours n’est prévu .

La liste des Exercices conserve recherche, filtres, tri et position de défilement dans l’état de navigation. Chaque carte utilise une pastille de Catégorie colorée, sans barre verticale. Sa surface ouvre la consultation ou la modification ; le bouton Lecture lance uniquement l’Exécution directe. Le contrôle `Déployer` est actif dans le MVP et affiche ou masque le média associé. Un glissement gauche expose `Planifier / Dupliquer / Archiver` sur les Exercices actives et `Supprimer` dans les archives. Aucune poignée de déplacement n’est affichée.

## 2 bis.2 Créer, consulter ou modifier un Exercice de référence

Dans chaque Catalogue, `Créer` est contextuel et ouvre directement la création de l’objet correspondant au Catalogue courant, sans écran ni arbre intermédiaire. Dans le Catalogue des Exercices, il ouvre directement l’éditeur de création d’un Exercice persistant ; dans le Catalogue des Séances, il ouvre directement une nouvelle Composition. Aucun Catalogue Parcours n’est prévu .

La création d’un Exercice depuis le Catalogue réutilise l’éditeur unifié. Le champ Nom est le premier élément du bandeau bleu. Le Mode propose un popover à deux options : Durée et Répétitions. À l’échec est une cible de Série. La carte ouvre CE-UI-10 : Séries → Séries variables → cible/Pause communes ou tableau → Changement de côté → Ordre des côtés → Pause entre les côtés → Total applicable. Les sections Description, Zone corporelle, Mode et Médias suivent les contrats de l’Écran 4.

Ouvert depuis le Catalogue, `Terminer` crée ou met à jour un Exercice persistant et revient au Catalogue. Ouvert depuis une Composition, le même éditeur agit uniquement sur l’Exercice de Séance. Le contexte d’ouverture ne doit jamais être déduit de la seule apparence de l’écran.

## 2 bis.3 Ajouter un Exercice à une Séance

Depuis la Composition, `Ajouter un exercice` ouvre directement la sélection des Exercices du Catalogue. La capacité technique et fonctionnelle de créer un Exercice local à la Séance reste conservée mais n’est pas exposée dans le parcours courant.

- `Une nouvelle exercice` ouvre l’éditeur d’une copie appartenant uniquement à la Séance ;
- `Un exercice existant` ouvre la sélection multiple du Catalogue d’Exercices ;
- `Annuler` ferme les options sans modifier le brouillon.

La sélection multiple affiche le nombre `N`, désactive l’ajout pour `N = 0` et insère les copies selon l’ordre courant de présentation dans la liste filtrée au moment de la validation. L’ordre des touchers n’est pas conservé. Chaque copie reprend toutes les propriétés métier et associations média de la référence puis évolue indépendamment. Un Exercice créé dans une Séance n’est pas enregistrée automatiquement dans la bibliothèque.

## 2 bis.4 Exécuter directement un Exercice

L’action Lecture est disponible uniquement pour une référence valide. Le lancement fige la définition courante dans un instantané d’origine `ACTIVITY` et mémorise l’état du Catalogue.

Le Plan contient `DIRECT_PREPARE(5 s)`, puis les Séries, Pauses, côtés et, si l’Exercice est bilatéral, `SIDE_RECOVERY` de durée PC>0, selon l’Ordre des côtés ; aucun repli lorsque PC=0. Il ne contient jamais `POST_ACTIVITY_RECOVERY`, ni Tour, ni Cycle visible, ni `SESSION_END`. Le dernier achèvement produit le signal de fin et ouvre immédiatement la Synthèse.

La Synthèse affiche les données compatibles d’un Exercice seul. Le Ressenti est obligatoire pour activer `Enregistrer`; le Commentaire est facultatif. La finalisation enregistre l’Exécution dans le Suivi général, alimente les statistiques compatibles sans compter une Séance, puis restaure filtres et position de défilement du Catalogue.

## 2 bis.5 Médias d’Exercice

Dans le MVP, le Catalogue affiche le média associé dans la gouttière permanente de la carte d’Exercice, sans déploiement ; sans média, cette même gouttière affiche l’icône de nature . Dans l’éditeur, la zone Média suit le Figma courant et reste sous la Synthèse en cas de chevauchement. Cette décision ne crée pas implicitement de nouveau mécanisme d’import ou de capture. Dans le MVP, un Exercice peut porter `0..n` associations ordonnées vers des photos ou vidéos locales ; une vidéo ne démarre jamais automatiquement. L’ajout/import et la persistance des médias sont désormais inclus au MVP dans PRE-3, avant le moteur d’exécution  ; les règles de consultation en exécution sont conservées.

## 2 bis.6 Bilatéralité

`sideMode` est indépendant du mode Durée ou Répétitions, avec cible chiffrée ou À l’échec par série. Un Exercice de référence et sa copie portent chacune leur valeur. L’insertion et la duplication copient cette valeur, puis les objets évoluent indépendamment.

Un Exercice bilatéral exécute toutes les Séries du premier côté puis toutes celles du second. Aucun changement de côté n’est exposé au niveau du Circuit dans la version actuelle. Les résultats restent séparés par côté.

## 2 bis.7 Limite Parcours

**Ancienne cible autonome retirée le 08/10/2026.** Parcours est désormais le libellé d’un créneau à plusieurs contenus, sans identité, persistance, étapes ou exécution globale propres. Programme est un conteneur distinct ; Circuit reste interne à la Séance. Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

<a id="parametres-exercice"></a>

## Paramètres et brouillon d’un exercice

### Modèle et terminologie

Un Exercice possède un mode unique : Durée ou Répétitions, avec cible chiffrée ou À l’échec par série. Une Série est une définition subordonnée à l’Exercice, numérotée 1..N : une cible éventuelle et une Pause. Elle n’est pas une entité autonome, ni un groupe d’exercices. En bilatéral, N signifie N Séries **par côté**, avec les mêmes paramètres pour les deux côtés.

- **Séries variables** : état explicite, indépendant de l’égalité éventuelle des valeurs.
- **Pause après chaque série** : libellé d’interface ; Pi est la Pause configurée de la Série i. Elle est exécutée après chaque Série, dernière comprise ; seule PN est remplacée par une récupération positive qui suit l’Exercice. Zéro signifie absence de phase positive.
- **Changement de côté** : Sans changement / Droite puis gauche / Gauche puis droite ; détermine la bilatéralité et le départ.
- **Ordre des côtés** : Un côté après l’autre (défaut) / Les deux côtés à chaque série. Sans objet en unilatéral.
- **Pause entre les côtés** : PC, libellé unique y compris dans le Profil ; initialisée depuis le Profil (défaut 10 s). Le nom technique existant `sideRecoverySeconds` peut être conservé.
- **Récupération après exercice** : R, ajoutée explicitement et portée uniquement par l’occurrence de Séance (`postActivityRecoverySeconds`), jamais par ActivityDefinition.

En uniforme, une cible et une Pause communes sont effectives. En variable, la collection ordonnée des N cibles/Pauses est l’unique source de vérité : aucune combinaison valeur commune + surcharge. Dans les deux modes, chaque cible peut être chiffrée (Ti ou Ri) ou À l’échec ; une collection variable peut mélanger les deux. Cibles d’intensité (charge, RPE, etc.) hors périmètre.

### Brouillon, bascules et normalisation

La feuille travaille sur une copie des paramètres du parent. ✕/retour système annule toute l’ouverture. ✓ applique atomiquement l’état actif et valide au parent et régénère le résumé ; Terminer seul persiste l’Exercice. Les états alternatifs cachés servent au brouillon uniquement.

Activation variable : chaque ligne copie la cible et la Pause uniformes courantes. Désactivation : sans confirmation ni message temporaire, l’état uniforme reprend la **première ligne dans l’ordre courant**. Réactivation avant ✓ restitue le dernier tableau variable. Si ✓ valide en uniforme, les anciennes valeurs variables cachées ne sont pas persistées.

Augmentation de N : rétablir d’abord les lignes temporairement retirées ; au-delà des lignes récupérables, copier la dernière ligne active. Réduction : retirer les dernières lignes de la liste active, conserver temporairement leur cible/Pause et leur ordre pour une restauration avant ✓. Restaurer une tranche retirée dans son ordre relatif d’origine (par exemple réduire 5→3 puis revenir à5 restitue 4 puis5, pas5 puis4). Après ✓, les lignes retirées ne sont plus conservées.

**Déplacement validé** : la cible, la Pause et la cadence éventuelle se déplacent ensemble ; les lignes sont renumérotées 1..N dans l’ordre obtenu ; la nouvelle dernière ligne porte PN. Les lignes actives déplacées conservent leur nouvel ordre lors de la restauration des lignes retirées, qui sont réinsérées en fin dans leur ordre conservé. La désactivation reprend la nouvelle première ligne. ✕ annule aussi les déplacements.

Changement de mode : conserver N et les Pauses ; remplacer les cibles incompatibles par —, sans conversion Durée/Répétitions. Revenir au mode précédent avant ✓ restaure ses dernières cibles. Une valeur — n’est jamais zéro.

**N=1 — arbitrage explicite** : état effectif uniforme et Ordre des côtés effectif Un côté après l’autre **dès le brouillon et son calcul**, pas seulement à la sauvegarde. Champ de régime non modifiable, selon la normalisation N1 existante ; Ordre des côtés grisé lorsqu’il est visible en bilatéral ; aucun texte explicatif. Conserver temporairement l’ancien état variable, ses lignes et l’ancien ordre des côtés pour les restaurer si N remonte à2+ avant ✓. Valider à1 ne conserve qu’une série uniforme et l’ordre par défaut. Hors circuit de séries, les deux formules bilatérales ne sont pas déclarées équivalentes à N=1 : la normalisation choisit explicitement la première. Dans un circuit de séries, le passage suit toujours premier côté → PC → second côté → Pi, y compris pour compte1 ; aucun Pi supplémentaire avant PC.

# 3. Composition d'une séance

## 3.1 Principe général

Une séance est constituée d'un ensemble d'exercices organisées dans un ordre d'exécution précis.

L'utilisateur construit librement sa séance en ajoutant, modifiant, supprimant ou réorganisant ces exercices.

La structure d'une séance est entièrement définie par son contenu. Aucun comportement implicite n'est ajouté automatiquement par l'application.

## 3.2 Structure d'une séance

Une séance est composée, dans l'ordre, des éléments suivants :

1. un compte à rebours initial ;
2. un Cycle technique unique contenant, dans l’ordre, les Exercices placés avant le Circuit, un Circuit unique et les Exercices placés après le Circuit ;
3. une fin de séance.
Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Exercices. Leur durée peut être égale à 0 s.

Chaque Exercice peut en outre définir un Compte à rebours propre et une Fin d’exercice propre. Un Point d’arrêt peut être inséré dans la Composition et déplacé entre les éléments autorisés ; il ne possède pas d’écran dédié et son temps d’attente est exclu de la durée de la Séance.

Le compte à rebours initial est exécuté une seule fois au démarrage de la séance.

Les Exercices placés après le Circuit sont exécutés une seule fois, après le dernier Tour du Circuit et avant la Fin de séance.

Une séance contient obligatoirement un Cycle et un Tour et doit contenir au minimum un Exercice pour être exécutable.

## 3.3 Les exercices

Un exercice représente une étape élémentaire de la séance.

Chaque exercice est indépendante des autres.

Un exercice possède notamment :

- un nom ;
- une durée cible, un nombre de répétitions cible ou une cible À l’échec sans nombre prescrit ;
- Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : chapitre 10, Calculs des durées et ordre des phases.
- une **Pause entre les côtés** facultative, visible uniquement en `D→G/G→D` et exécutée selon l’Ordre des côtés (une fois par Exercice ou une fois par Série) ;
- une Description facultative et une ou plusieurs Zones corporelles obligatoires ;
- un média associé est affiché dans la gouttière permanente de la carte du Catalogue dans le MVP, sans déploiement ; l’import/ajout local et les associations ordonnées sont inclus au MVP dans PRE-3 , sans activation implicite de la caméra.

Les exercices sont exécutés dans l'ordre où elles apparaissent dans la séance.

## 3.4 Modes et récupération d’un Exercice

Le modèle cible ne possède pas de type d’Exercice `Exercice` ou `Récupération`. Toute Exercice correspond à une action réalisée par l’utilisateur.

Elle peut être définie :

- par une durée ;
- par un nombre de répétitions ;
- jusqu’à l’échec, sans durée ni nombre de répétitions cibles.

Elle peut être associée à une ou plusieurs zones corporelles.

Le modèle distingue deux récupérations. La **Pause entre les côtés** (`sideRecoverySeconds`) est une propriété intrinsèque facultative, uniquement pertinente pour un Exercice bilatéral ; lorsqu’elle est positive, `SIDE_RECOVERY` intervient selon l’Ordre des côtés (une fois par Exercice ou une fois par Série). La **Récupération après exercice** (`postActivityRecoverySeconds`) est contextuelle à chaque occurrence de Séance, existe y compris à `0 s` et, lorsqu’elle est positive, produit `POST_ACTIVITY_RECOVERY` après l’occurrence. Une `ActivityDefinition` n’en possède jamais.

Un Exercice dont le nom ou l’intention fonctionnelle est « Récupération » reste possible : elle utilise le même modèle et les mêmes modes que toute autre Exercice ; aucun traitement particulier n’est associé à son nom.

## 3.5 Circuit et compte

Le MVP comporte un seul Circuit par composition. Sa nature est Tours ou Séries ; le compte vaut de 1 à 99, par défaut 1, dans la composition libre. Un circuit de tours répète les exercices complets ; un circuit de séries entrelace leurs séries de même indice. Les contraintes propres aux formats sont détaillées dans la section Formats.

## 3.6 Cycle technique

Le Cycle technique reste exécuté une fois dans le MVP. Il ne constitue pas un réglage supplémentaire exposé à l’utilisateur. Le compte du Circuit est la référence effective ; aucune multiplication supplémentaire par un ancien compteur technique.

## 3.7 Réorganisation

Les exercices peuvent être :

- ajoutées ;
- supprimées ;
- dupliquées ;
- déplacées.

Leur ordre d'exécution correspond toujours à leur position dans la séance.

La réorganisation modifie le brouillon de composition ; l’enregistrement de la séance persiste cet ordre.

## 3.8 Validation

Une séance est considérée comme valide lorsqu'elle contient au minimum un Exercice.

Un exercice est valide lorsque toutes les informations obligatoires correspondant à son type sont renseignées.

Les exercices incomplètes sont signalées à l'utilisateur.

Une séance incomplète peut être enregistrée mais ne peut pas être exécutée.

## 3.9 Estimation

À chaque modification, l'application recalcule automatiquement :

- la **durée estimée d’exécution** ;
- la **durée synthétique des Exercices** ;
- le **nombre d'Exercices de la Composition**.

### Durée estimée d’exécution

La durée estimée d’exécution correspond à la somme de toutes les durées déterminables de l'Exécution complète construite à partir de la Composition. Elle est utilisée sur l’écran d’Exécution.

Le calcul tient compte :

- du Compte à rebours initial et de la Fin de séance ;
- de toutes les occurrences d'Exercices chronométrés ;
- des Pauses entre Séries effectivement insérées dans le plan ;
- de `sideRecoverySeconds` dans la durée intrinsèque de chaque Exercice bilatéral ;
- de `postActivityRecoverySeconds` après chaque occurrence de Séance, répété avec l’occurrence lorsqu’elle appartient au Circuit, à chaque Tour ;
- des Séries ;
- des Tours du Circuit ;
- des répétitions du Cycle ;
- de la position structurelle de chaque Exercice dans la Séance.

Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

### Durée synthétique des Exercices

La durée synthétique des Exercices est affichée sur les cartes du Catalogue et sous `Nombre de tours` dans la Composition. Elle applique les règles de développement des Séries, Pauses entre Séries et, pour un Exercice bilatéral, de `sideRecoverySeconds`. Dans une Composition, la durée de Séance ajoute également les `postActivityRecoverySeconds` des occurrences selon leur développement dans le Circuit. Elle exclut toujours le Compte à rebours initial et la Fin de séance.

Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

### Nombre d'Exercices de la Composition

Le nombre d'Exercices de la Composition correspond au nombre de cartes d’Exercice explicitement définies dans la Composition.

Il :

- ne tient pas compte des répétitions liées aux Séries, Tours ou Cycles ;
- ne comptabilise ni les Pauses entre Séries ni les phases de récupération comme Exercices.

Ces informations sont affichées en temps réel.

## 3.10 Principes de conception

La composition d'une séance repose sur les principes suivants :

- chaque exercice est indépendante ;
- l'utilisateur garde en permanence la maîtrise complète de la structure de sa séance ;
- les modifications sont enregistrées automatiquement ;
- toute séance peut être modifiée ultérieurement sans impact sur les exécutions déjà enregistrées.

<a id="circuits"></a>

## Circuits de tours et de séries

### Un circuit est *de tours* ou *de séries*

#### La règle

Un circuit porte désormais une **nature**, qui prend deux valeurs. L’ordre des exercices est conservé, mais le développement de leurs séries et le nombre d’occurrences exécutées diffèrent. La nature détermine aussi **d’où vient le nombre de séries de chaque exercice**.

| | circuit **de tours** | circuit **de séries** |
|---|---|---|
| exemple : compte 3, A et B à 3 séries | (A1 A2 A3 B1 B2 B3) × 3 | A1 B1 A2 B2 A3 B3 |
| nombre de séries par exercice | propre à chaque exercice, **indépendant** d'un exercice à l'autre | **identique pour tous**, hérité du circuit |
| ce qu'un passage exécute | toutes les séries de chaque exercice | **une et une seule** série de chaque exercice |
| statut | comportement actuel, inchangé | nouveau |

Le circuit de tours **est** le comportement existant : rien n'y change. Le circuit de séries **ne crée pas de paramètre**, il **contraint** un paramètre existant — le nombre de séries de chaque exercice du circuit vaut N, le nombre porté par l'en-tête.

C'est le circuit de séries qui rend exprimable le **circuit à volumes progressifs** : X exercices qui s'enchaînent, dont les volumes croissent d'un passage au suivant.

#### Le contrôle

La nature est portée par **le mot d'unité du compteur de l'en-tête de circuit**, déjà présent : « 3 tours » ou « 3 séries ».

- appuyer sur **le chiffre** révèle les boutons `−` et `+`, qui changent le nombre ;
- appuyer sur la pastille **« tours » ou « séries »** ouvre le choix de nature ;
- la pastille n’entoure jamais le chiffre.

Les deux cibles tactiles sont distinctes. Cette décision du 12 octobre remplace l’ancienne cible unique sur toute la valeur.

#### La conversion entre les deux natures

Le nombre affiché ne change pas : « 3 tours » devient « 3 séries ».

**Séries → tours ne perd rien.** La contrainte disparaît, chaque exercice garde son compte et ses valeurs. Aucune confirmation.

**Tours → séries force tous les exercices à N.** Un exercice qui a moins de N séries en gagne, **préremplies en répétant sa dernière valeur** ; un exercice qui en a plus **perd les séries au-delà de N, avec leurs valeurs**.

**L'aller-retour n'est donc pas réversible**, et c'est ce qui justifie une confirmation.

#### La règle de déclenchement de la confirmation

Une fenêtre de confirmation — Annuler / Confirmer — s'affiche **si et seulement si au moins un exercice perd des valeurs**.

Un exercice qui en gagne ne la déclenche pas : rien n'est détruit, et la valeur ajoutée est visible et corrigible à l'écran suivant.

**Les séries tronquées par une conversion confirmée ne sont pas mémorisées.** Un retour vers « tours » ne les restitue pas. Annuler abandonne toute la conversion : nature, compte et exercices restent inchangés. La diminution du compte sans changement de nature suit une règle distincte de brouillon, définie au §9.2.

#### Ce que le circuit ne contraint pas

**Une correction d'une formulation antérieure.** La définition du circuit de séries a été écrite une première fois comme « les exercices ont des séries variables, leur nombre est identique d'un exercice à l'autre et il est hérité ». **Le mot « variables » n'a pas lieu d'y être.**

**Le circuit contraint le nombre de séries, jamais leur régime.** Le régime — séries identiques ou séries variables — est un réglage propre à chaque exercice, et il existe déjà dans les écrans (ligne « Séries » de la modale des modalités d'exécution). Basculer de tours à séries ne change que le compte.

**Le défaut d’un exercice nouvellement créé et ajouté à un circuit est « identiques ».** Un exercice existant provenant du catalogue conserve son régime (voir §9.3). Il naît à une série ; le circuit porte son compte à N ; le préremplissage répète la même valeur. Sa carte lit alors « 3 × 30 s ».

---

### Le régime des séries d'un exercice

#### Deux valeurs

| régime | signification |
|---|---|
| **identiques** | toutes les séries ont la même valeur |
| **variables** | chaque série a sa propre valeur |

Le réglage est porté par un champ de la ligne « Séries », et le choix se fait par popover à deux entrées.

#### Trois états d'affichage, pas deux

Le régime et le repli de la liste sont **deux informations distinctes**, portées par deux contrôles distincts : le champ pour le régime, un chevron pour le repli.

| état | champ | chevron |
|---|---|---|
| séries identiques | `identiques` | **absent** — il n'y a pas de liste |
| variables, liste visible | `variables` | déployé |
| variables, liste masquée | `variables` | replié |

#### Le préremplissage, et la disparition du marqueur d'incomplétude

**Une série validée satisfait les paramètres requis par son mode.** Durée et Répétitions exigent une cible valide ; À l’échec n’exige pas de cible numérique. Une nouvelle série copie les paramètres de la dernière ligne active dans l’ordre courant, après restauration prioritaire des lignes temporairement retirées lorsque celle-ci s’applique. Cette règle existe déjà dans paramètres d’exercice du chapitre 08; elle comprend la cible et la Pause. Le Bip reste commun à l’exercice.

Conséquence directe : **il n'y a pas d'état « volume manquant » à signaler sur une carte de composition.** Le marqueur d'incomplétude envisagé pour la carte n'a plus d'objet et ne doit pas apparaître dans la documentation.

Le préremplissage s'applique dans les deux cas où une série apparaît sans saisie : l'ajout manuel d'une série, et l'extension forcée par la conversion tours → séries.

---

### Compléments normatifs issus des arbitrages du 12 octobre

#### Périmètre et plan d’exécution

Le MVP comporte **un seul circuit par composition**. Aucun écran de gestion multicircuit n’est introduit. Les décisions sur les déplacements entre circuits sont conservées pour une évolution future.

Circuit de séries : pour chaque indice i de 1 à N, parcourir les exercices dans l’ordre de composition et exécuter leur série i. Chaque passage d’un exercice bilatéral réalise ses deux côtés avant de passer à l’exercice suivant. Le côté de départ est conservé. **Le circuit n’écrit pas le réglage Ordre des côtés de l’exercice et ne le rend pas en lecture seule.** Le déroulement est unique : premier côté → Pause entre les côtés → second côté → Pause après la série → exercice suivant. Le réglage enregistré « Un côté après l’autre » ne crée pas de seconde variante de passage dans un circuit de séries.

Une récupération interne suit son emplacement de composition à chaque passage. Exemple, récupération après B : A1 → B1 → R → A2 → B2 → R → A3 → B3 → R. Si R>0, elle remplace uniquement la pause terminale du passage de B ; les pauses de A sont conservées. R=0 n’ajoute aucune phase et ne remplace aucune pause. La pause configurée reste dans les données de l’exercice.

Un point d’arrêt **interne** suit également son emplacement à chaque passage. Conserver l’ordre existant : Exercice → Récupération positive éventuelle → Point d’arrêt → suite. Les points extérieurs au circuit restent extérieurs : ils ne sont pas dupliqués avec ses passages. Leur attente reste exclue des durées prévues.

**Préparation et fin :** un exercice seul utilise son Compte à rebours et sa Fin d’exercice une fois. Dans une séance, ces paramètres propres ne sont jamais exécutés : seuls ceux de la séance s’appliquent, par substitution, une fois aux frontières de la séance. Cette décision explicite remplace pour la cible de cette évolution les mentions contraires du référentiel (voir §10). Aucun compte à rebours supplémentaire à chaque série ou passage. **Clarification du12/10 à09h28 : aucun booléen de Séance, même désactivé par défaut, ni contrôle correspondant. La règle est inconditionnelle. Figma est confirmé aligné par le propriétaire.**

Le déplacement d’une série conserve le comportement de paramètres d’exercice du chapitre 08 : ses paramètres se déplacent ensemble, l’ordre est renuméroté et les autres exercices restent inchangés. Aucun nouvel arbitrage ni redesign.

#### Nombre imposé et diminution

Dans un circuit de séries, le nombre de séries de chaque exercice est N, porté par l’en-tête. Dans la feuille de l’exercice, il reste visible avec sa valeur réelle, non modifiable. La mention discrète de son origine et un éventuel astérisque seront positionnés dans Figma. Pas de tiret à la place du nombre. **Ce nouvel état de lecture seule ne concerne pas l’Ordre des côtés.** Le régime reste celui de l’exercice, sous réserve des règles existantes de N=1.

Diminuer N, sans changer la nature du circuit, est immédiat et sans message. Les lignes retirées sont conservées pendant **l’édition de la séance** ; réaugmenter les restaure avec leurs paramètres et leur ordre. L’enregistrement ne conserve que les lignes actives. Une augmentation postérieure copie la dernière ligne persistée. Une ouverture/validation de la feuille d’un exercice ne doit pas purger à elle seule la réserve créée par le compteur du circuit : cette réserve appartient au brouillon de séance.

Cette réserve est une exception limitée au brouillon, pas un historique persistant. Elle est distincte de la troncature définitive d’une conversion confirmée. Les lignes retirées ne participent ni aux cartes, ni à la grille, ni au calcul, ni au plan.

Hors héritage du circuit, conserver la frontière existante de la feuille : restauration avant ✓ ; après ✓ les lignes retirées de cette feuille ne sont plus conservées. Aucun allongement implicite de leur durée de vie à toute la séance.

#### Ajout et sortie du circuit

Un exercice du catalogue ajouté au circuit conserve son régime et ses paramètres, puis son exemplaire de séance est adapté à N. S’il manque des séries, copier la dernière ligne ; s’il faut en retirer, confirmation avant application. Annuler abandonne l’ajout ; confirmer applique l’ajout et l’adaptation atomiquement. **L’exercice du catalogue n’est jamais modifié.**

Sortir l’exercice du circuit conserve le nombre actif et les paramètres actuels. Le nombre redevient modifiable ; aucun ancien nombre n’est restauré et aucun message n’est nécessaire.

Futur, hors MVP : déplacement vers un autre circuit de séries selon la même adaptation. Annuler conserve emplacement et données d’origine ; confirmer réalise déplacement et adaptation ensemble.

#### Régime et validation : règles existantes conservées

Variables → identiques reprend la première ligne dans l’ordre actuel : cible **et Pause**, déjà définies dans paramètres d’exercice du chapitre 08. Aucun nouveau message. La réactivation avant ✓ retrouve le tableau variable ; validation en uniforme ne persiste pas les alternatives cachées.

Ajouter une série restaure d’abord une ligne récupérable, sinon copie la dernière ligne active. Les pauses et cibles suivent la règle existante. Changer de mode ne convertit pas arbitrairement les cibles : les validations et la conservation temporaire propres aux modes restent celles de v13.

L’absence de marqueur d’incomplétude sur la carte de composition **ne supprime pas les erreurs de saisie dans la feuille**. Un changement de mode peut exiger une nouvelle cible ; ✓ reste interdit tant qu’une cible requise est invalide. À l’échec ne demande jamais de volume numérique.

#### Grille des volumes

- Colonnes S1…Smax, où Smax est le nombre maximal de séries des exercices ; circuit de séries : Smax=N.
- Série inexistante : `—`, sans signifier zéro ou erreur de saisie.
- Répétitions : nombres dans les cellules ; `rép.` en dernière colonne.
- Durées : `min:ss` dans toutes les cellules, par exemple `0:45`, `1:00`, `1:30` ; `min:ss` en dernière colonne.
- À l’échec : `✓` dans chaque cellule existante, `À l’échec` en dernière colonne. Dans cette vue de composition, le symbole signifie série prévue, jamais résultat réalisé. Libellé accessible : « Série N, à l’échec ».
- Bilatéral : cible **par côté**, sans doublement ; pastille de côté près du nom. Une cible de 10 répétitions par côté affiche 10.
- Lecture seule ; aucune pause ou récupération dans cette grille. Les durées `min:ss` sont des cibles de travail et non des totaux incluant les pauses.
- Conserver défilement horizontal des séries, colonne Exercice et colonne Unité/mode fixes ; contenu vertical accessible et défilant.

#### Suppression et interactions

Croix de suppression : retirer immédiatement, sans confirmation ; message discret « Série supprimée — Annuler ». Annuler restaure les paramètres et la position. Réutiliser la convention existante de notification ; ne pas inventer une durée ou un nouvel écran. Les bornes de validité existantes restent applicables.

Dans un circuit de séries, le nombre se règle dans l’en-tête : pas de suppression locale permettant de rompre l’invariant N dans un seul exercice. Le déplacement de lignes reste possible.

Un appui extérieur sur une cible destructive range d’abord l’outil sans déclencher la destruction. Un appui sur une cible inoffensive peut fermer et agir en un seul geste.

La pastille de nature et le chiffre sont deux cibles distinctes (§1.2 corrigé). Le régime et le chevron de repli restent distincts. Leur position, la couleur de la suppression et l’indication de lecture seule sont des finitions DSF/Figma, pas de nouveaux choix métier.

<a id="pauses-composition"></a>

## Placement des récupérations et des points d’arrêt

### Pause de Composition : deux types, un parcours

Pause est le terme d’interface commun à :
- Récupération : pause chronométrée explicitement ajoutée après une occurrence ;
- Point d’arrêt : arrêt structurel, attente exclue de la durée prévue.

Ces objets ne fusionnent pas avec la Pause après chaque série, la Pause entre les côtés ni la Pause manuelle d’exécution.

Une nouvelle occurrence ne crée aucune récupération. Le bouton Pause ouvre le mode placement de la Composition. Chaque emplacement autorisé présente deux blocs côte à côte, de largeur identique : Récupération et Point d’arrêt. Plusieurs éléments peuvent être sélectionnés en une seule entrée ; une récupération et un point peuvent coexister à la même position.

Sélectionner Récupération ouvre immédiatement la modale de durée. La valeur proposée provient du défaut Profil de récupération, initialement 0min30s. Cette règle dérivée conserve le réglage existant en déplaçant son application de la création d’occurrence à l’ajout explicite. Une modification ultérieure du Profil n’altère pas les pauses déjà ajoutées.

### Brouillons, validation et annulation

Entrer en placement crée un sous-brouillon de la Composition. Le clic sur un Point d’arrêt bascule sa sélection dans ce sous-brouillon. Sélectionner une récupération puis Valider la durée confirme l’ajout au sous-brouillon ; fermer la roulette sans Valider (retour/fermeture du panneau, sans inventer de bouton Annuler absent de la capture) abandonne uniquement cette édition et restitue l’état antérieur de cet emplacement.

Le bouton indique « Confirmer N pauses ajoutées » ; N compte les ajouts du sous-brouillon, une récupération et un point comptent deux éléments. Une désélection retire l’ajout du décompte. Les éléments déjà présents ne sont pas comptés comme nouveaux ; la modification de leur durée n’est pas un ajout. À N=0, aucune confirmation d’ajout vide n’est proposée comme action active. Annuler reste libellé Annuler et restitue l’état avant entrée en placement.

Confirmer applique atomiquement le sous-brouillon au brouillon parent. Continuer seul enregistre la Séance. Quitter/abandonner la Composition restitue la version persistée. Échec de validation, double appui et erreur d’écriture ne produisent pas d’ajout partiel.

Les récupérations restent 0..300s avec la grille de pas déjà validée ; 0 est valide, ne produit pas de phase et n’affiche pas d’information de récupération. Un objet explicitement réglé à0 est conservé en base, distinct de l’absence ; seul son retrait explicite supprime l’objet. La valeur0 ne crée aucune phase et ne remplace pas la Pause finale de Série. Tester séparément présence de données et visibilité.

### Contenu et trait de démarcation

| Contexte | Récupération positive | R absente ou0 | Point présent | Trait |
|---|---|---|---|---|
| Composition ordinaire | Icône et valeur visibles | Informations récupération absentes | Informations point visibles | Conservé |
| R absente/0 et aucun point | — | Aucune information de pause | — | Conservé hors placement |
| Placement | Bloc Récupération sélectionnable et valeur si renseignée | Emplacement Récupération sélectionnable | Bloc Point d’arrêt selon sélection | Trait de démarcation supprimé pendant le choix |

Le trait ne désigne pas la ligne entière de contenu. Supprimer les informations ne doit pas supprimer ce trait hors placement ni faire disparaître les contrôles pendant le choix. Même distinction après la dernière occurrence : récupération absente/0 sans phase et sans contenu, trait selon le layout hors placement. Aucun Point d’arrêt terminal n’est créé.

**Écart de capture maintenu explicitement :** certains écrans Figma, dont 2028:11700, ont supprimé tout l’emplacement à zéro. Les PNG sont fidèles à Figma et ne corrigent pas artificiellement ce rendu ; le contrat D-303 gouverne le trait. Cette mission documentaire ne modifie pas la géométrie Figma.

### Positions, ordre et retrait

Récupération uniquement après une occurrence, y compris la dernière ; aucune récupération avant le premier Exercice. Point d’arrêt : frontières existantes conservées, interdit juste après le compte à rebours initial et juste avant Fin de séance, permis avant/après Circuit et entre ses Exercices. Les deux types ont donc un parcours commun sans devenir interchangeables à toutes les frontières.

À un emplacement partagé : Exercice → récupération positive → Point d’arrêt → suite. Les éléments internes au Circuit s’exécutent à chaque Tour. Circuit désigne le groupe, Tour sa répétition.

Appui long sur la récupération existante ouvre la bulle Retirer la récupération, comme Retirer le point d’arrêt. Choisir Retirer supprime du brouillon ; toucher hors bulle ferme sans mutation. Ne pas ajouter un second dialogue absent de la référence. La suppression d’une récupération retire sa durée du plan et rétablit la Pause terminale configurée ; elle ne modifie pas la définition d’Exercice.

<a id="phrases"></a>

## Phrase de synthèse des paramètres

### Format d'affichage des durées

Une durée x, en secondes, s'écrit :

| Cas | Format | Exemple |
|---|---|---|
| x = 0 | `0 s` | 0 s |
| x < 60 | `{x} s` | 15 s |
| x multiple de 60 | `{x/60} min` | 1 min |
| autre | `{minutes} min {secondes} s` | 1 min 30 s |

### Grammaire française v15

Ordre : nombre de séries → contenu → pause → côtés → durée applicable. Ponctuation et accords conformes aux276 cas ; série/séries, menée/menées. Les espaces et unités font partie du texte. Mode affiché à part, absent du début de phrase.

| Cas | Forme |
|---|---|
| Durée uniforme | `{N} séries de {durée}` |
| Durée variable, jusqu’à3 | `{N} séries de durée variable ({d1}, {d2} puis {d3})` ; à2, séparer par « puis » |
| Durée variable, plus de3 | `{N} séries variables, de {min} à {max}` |
| Répétitions uniformes | `{N} séries de {R} répétitions` |
| Répétitions variables, jusqu’à3 | `{N} séries de {r1}, {r2} puis {r3} répétitions` |
| Répétitions variables, plus de3 | `{N} séries variables, de {min} à {max} répétitions` |
| Bip positif en Répétitions | Accoler `cadencées toutes les {bip}` aux répétitions |
| À l’échec | `1 série menée jusqu’à l’échec` / `{N} séries menées jusqu’à l’échec` |
| Uniforme, pause positive, N≥1 | `, avec {pause} de pause après chaque série` |
| Uniforme, pause nulle, N>1 | `, enchaînées sans pause` |
| Uniforme, pause nulle, N=1 | Aucune clause de pause |
| Séries variables, tous modes | Clause de pause omise conformément aux276 cas, même À l’échec ; aucune liste de pauses ajoutée |

N=1 est normalisé uniforme avant génération. Les min/max viennent des cibles actives, pas de la première et dernière ligne. Aucune ellipse après les trois premières valeurs. L’omission rédactionnelle des pauses variables ne les retire jamais du plan ni du calcul. La grammaire du classeur dit « la pause figure dans l’énumération », mais ses276 phrases variables n’énumèrent pas les pauses : conserver exactement leurs formulations, sans inventer cette énumération.

En Durée et À l’échec, le bip n’ajoute aucune clause. En Répétitions, le suffixe cadencé n’existe que pour b>0. Le texte n’explique pas les règles audio.

### Côtés et durée

Sans changement : aucune clause. N=1 bilatéral : « en faisant le côté droit puis le gauche ». N>1 par paire : « en alternant le côté droit puis le gauche à chaque série ». N>1 par côté : « en faisant d’abord toutes les séries à droite, puis à gauche ». Inverser les directions pour un départ gauche. PC>0 ajoute « , avec {PC} de pause au changement de côté » ; PC=0 omet le suffixe. Les modèles exacts de ponctuation sont ceux des276 cas.

Après le point final, afficher « Durée totale : {total}. » sans symbole en Durée ; « Durée totale : ≈ {total}. » en Répétitions avec bip. Omettre intégralement en Répétitions sans bip et À l’échec. Le mélange de cibles chiffrées et À l’échec affiche ≥ lorsque sa durée partielle est calculable ; aucun zéro ni tiret de remplacement pour une durée omise. **Redondance : omettre le total seulement pour une Série Durée sans côté ET sans pause.** Avec une pause positive, même une seule Série possède son total affiché. Cette exception rédactionnelle ne masque pas la durée de la carte Catalogue.

La pause après chaque série, dernière comprise, fait partie du calcul intrinsèque. Une récupération positive qui suit l’Exercice remplace seulement la dernière pause dans le plan de Séance ; la phrase intrinsèque demeure descriptive des paramètres de l’Exercice.

### Extension normative — deux modes et cibles mixtes (13/10)

Le mode ne sélectionne plus une branche « À l’échec » : le générateur examine les cibles ordonnées. Tout échec conserve le gabarit existant et les cartes du catalogue. Jusqu’à trois cibles, énumérer dans l’ordre. En Durée, insérer « jusqu’à l’échec » à la place de la durée concernée. En Répétitions mixtes, utiliser « {N} séries de répétitions variables ({r1}, {r2} puis jusqu’à l’échec) » ; à deux cibles, séparer par « puis ». Ne pas ajouter « répétitions » après la parenthèse. Conserver la position réelle de chaque cible à l’échec. Au-delà, compacter le mélange en « de {minimum numérique} rép. à l’échec » ou « de {minimum numérique formaté} à l’échec ». Les clauses de pauses/côtés restent celles du corpus : aucune liste de pauses variables.

Le total est celui du moteur : ≥ pour mélange calculable, prioritaire sur ≈ ; aucun total pour Répétitions sans bip ni toutes cibles À l’échec. Le corpus v15 ne couvre pas ces nouveaux cas ; ses 276 sorties ne doivent pas être présentées comme recette exhaustive du nouveau modèle. Ne pas modifier rétroactivement le fichier source Excel.

| Cas complémentaire | Fragment cible attendu | Total métier |
|---|---|---|
| Durée 30s,45s,échec | 3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec) | ≥ si calculable |
| Durée 30s,45s,60s,échec | 4 séries variables, de 30 s à l’échec | ≥ |
| Répétitions 10,12,échec | 3 séries de répétitions variables (10, 12 puis jusqu’à l’échec) | ≥ avec bip ; absent sans bip |
| Répétitions 10,12,15,échec | 4 séries variables, de 10 rép. à l’échec | ≥ avec bip ; absent sans bip |
| Trois cibles échec, pauses variables | 3 séries menées jusqu’à l’échec | Absent ; aucune clause énumérant les pauses |

Ces fragments étendent les gabarits ; les autres clauses, segments gras et ponctuation suivent les sections précédentes. Couvrir aussi échec en première/deuxième position, bip0/positif et les deux côtés. La capture8328:38848 contient encore une énumération des pauses : écart rédactionnel visuel, pas une nouvelle règle.

<a id="formats-raccordement"></a>

### Raccordement aux formats de séance

Le générateur reste une fonction des paramètres produisant des segments {texte, gras} ; aucune phrase persistée. For time : « 21 répétitions au premier tour, 15 au deuxième, 9 au troisième. Le plus vite possible. » L’échelle est indexée par tour ; Progression conserve les répétitions par série. Tabata : pause après chaque série, jamais récupération substituée comme simple artifice de présentation. EMOM : fenêtre et objectif distincts, repos résiduel. Le corpus historique v15 reste conservé ; les nouvelles phrases ne permettent pas de recalculer une durée ni de requalifier ses 276 cas comme un modèle de formats.

<a id="combinaisons-formats"></a>

### Combinaisons dont la règle reste à préciser

Les arbitrages explicitement traités sont clos. Cela ne vaut pas qualification exhaustive de toutes les combinaisons du futur moteur. Avant de déclarer un périmètre de réalisation prêt, les raccordements suivants doivent être démontrés dans les sources détaillées ou signalés comme incomplets :

- **Fenêtres et commandes générales :** portée de Pause/Reprendre, réinitialisation, points d’arrêt et reprise système face à la règle « fenêtre continue ». Cette règle décrit déjà la fin du travail ; elle ne suffit pas à décider silencieusement de supprimer les commandes générales ou de les laisser modifier les échéances.
- **Fenêtres et bilatéralité :** rattachement des côtés et de leurs pauses à la fenêtre commune. La formule EMOM validée ne doit pas recevoir un multiplicateur caché ; conserver une règle existante seulement si elle est compatible et démontrée.
- **Death by à plusieurs exercices :** la règle validée lie un tour acquis à une fenêtre accomplie ; le rang global, le changement d’exercice et l’incrément doivent être explicitement raccordés si le parcours autorise plusieurs exercices. L’exemple d’un exercice ne prouve pas ce raccordement.
- **Reconfiguration des comptes :** l’éditeur du Volume par tour doit conserver le lien entre nombre de tours et échelle ; l’EMOM « Par exercice » ne doit pas multiplier à la fois séries et tours. La représentation technique doit respecter les séquences et formules déjà décidées.

Ces points ne remettent pas en question les décisions consignées. Ils ne constituent pas des blocages démontrés ; leur effet éventuel se limite au comportement dont une règle manquerait réellement. S’ils ne se résolvent pas par les règles existantes, le dossier VNext doit conserver une clarification localisée, sans inventer de comportement.

<a id="formats-conception"></a>

## Formats de séances — comportements consolidés

Source normative : [spécification Formats du 14/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#formats-conception), . Ces règles étendent les parcours libres ; elles ne déclarent pas le moteur livré.

### 3. Concepts et invariants

#### 3.1 Format, origine et paramètres

- **— Format appliqué.** Une séance peut porter Tabata, Intervalles 30/30, EMOM, AMRAP, For time ou Death by. Ce champ détermine des contraintes et un comportement d’exécution. Une séance libre ne porte aucun format contraignant.
- **— Origine de création.** Le modèle de départ est conservé séparément. Il classe la provenance, sans imposer à lui seul de comportement. Renforcement, Gainage · Mobilité, Superset, Progression, À l’échec et Libre alimentent cette origine sans devenir des formats.
- **— Identité du format.** Le format est fixé à la création et ne devient pas un autre format par édition ordinaire. Les constantes restent imposées.
- **— Réglages de séance.** Les réglages autorisés par le format restent modifiables après composition. Leur portée est la séance, distincte des paramètres propres à chaque exercice.
- **— Valeurs dérivées.** Toute modification d’un réglage ou de la composition met à jour les valeurs calculées et la synthèse courante. Une valeur calculée n’est pas un second réglage concurrent.
- **— Historique.** Modifier la séance ne modifie pas rétroactivement les paramètres ni les résultats de ses exécutions passées. Cette préservation réutilise l’exigence générale d’instantané ; elle n’invente pas un nouvel historique parallèle.
- **— Présentation et synthèse.** Le texte descriptif du modèle peut rester fixe ; la synthèse de la séance décrit ses paramètres effectifs. Une synthèse ne disparaît pas au seul motif que la séance a été composée ou modifiée.

#### 3.2 Trois dimensions à distinguer

| Dimension | Question traitée | Exemples |
|---|---|---|
| Organisation / parcours | Dans quel ordre les efforts sont-ils exécutés ? | Par exercice ; en alternance ; circuit de tours ou de séries selon les règles du format |
| Indexation des objectifs | À quelle unité chaque valeur se rapporte-t-elle ? | Répétitions par série ; volume par tour |
| Borne | Qu’est-ce qui termine l’exécution prévue ? | Compte atteint ; durée écoulée ; travail accompli ; arrêt déclaré |

- **— Indexation explicite.** Une échelle de valeurs est indexée sur l’unité nommée par le paramètre. Une liste numérique ne change pas d’unité par simple changement de libellé ou réinterprétation technique.
- **— Réemploi des circuits.** Conserver les circuits de tours et de séries de SRC-04. Les circuits de séries ne sont pas réservés aux seules progressions ou pyramides. Un format peut imposer une organisation ; cela ne retire pas les choix existants à une séance libre.

« Exécution » sur un contrôle d’organisation ne remplace pas le mode Durée/Répétitions de l’exercice. À l’échec reste une cible par série, pas un troisième mode ni un format supplémentaire.

### 4. Tabata et Intervalles

#### 4.1 Tabata

- **.** Le format impose huit séries par exercice, 20 secondes d’effort par série et une pause de 10 secondes après chaque série.
- **.** Avec plusieurs exercices, le réglage global propose « Par exercice » et « En alternance ». Avec un exercice unique, la question est inutile puisque l’enchaînement est identique.
- **.** Par exercice : A1…A8, puis B1…B8. La configuration illustrée comporte un circuit d’un tour et deux cartes affichant chacune `8 × 20 s`. Le réglage de répétition de l’ensemble reste distinct des huit séries imposées.
- **.** En alternance : A1, B1, A2, B2…A8, B8. Le circuit de séries existant exprime cette organisation avec huit séries par exercice. Les huit séries ne deviennent pas huit efforts au total répartis entre A et B.
- **.** Le récapitulatif nomme le compte commun « Séries par exercice — 8 », compatible avec les deux organisations. Il ne présente pas ce compte comme huit tours de circuit dans le cas par exercice.
- **.** Le contrôle « Exécution » est en dernière ligne du bloc Paramètres, après Durée totale, avec séparateur. Son libellé et les options sont alignés sur la même ligne ; la taille de texte est celle des paramètres voisins. Le layout précis relève du DSF et du Figma courant.
- **.** Dans la composition par exercice, la carte affiche le volume `8 × 20 s`, sans afficher la pause dans cette expression.
- **.** La modale correspondante affiche Mode d’exécution = Durée, Nombre de séries = 8, Durée d’une série = 20 s et Pause après chaque série = 10 s. Les quatre valeurs sont visibles, grisées et non modifiables ; leur caractère imposé par Tabata est expliqué. Elles restent effectives et ne sont pas remplacées par un tiret.
- **.** Les 10 secondes constituent la pause après chaque série. Une récupération de séance n’est pas créée pour rendre cette pause visible. Aucune récupération supplémentaire n’est ajoutée par défaut. Si une récupération positive est explicitement ajoutée là où le modèle l’autorise, sa substitution à la dernière pause suit SRC-04/05, sans double comptage.

Exemple normatif unilatéral, sans récupération ni autre phase : deux exercices × huit séries × (20 + 10) secondes = **480 secondes, soit 8 minutes** dans les deux organisations. Il s’agit du total de ces efforts et pauses, pas du total incluant le compte à rebours et la fin de séance.

La copie avec 1 tour et 8 × 20 s est nommée « Par exercice », indépendamment de sa position de deuxième écran sur le canvas. L’ordre des copies Figma n’est pas une identité métier.

#### 4.2 Intervalles 30/30

- **.** Les constantes sont 30 secondes de travail et 30 secondes de pause. La borne réglée est un compte, jamais une durée totale saisie. La durée se déduit des occurrences effectivement prévues et de leurs phases. Les réglages de compte et la récupération éventuelle restent ceux du format décrit par SRC-01 ; ne pas déduire d’un chiffre de maquette une règle supplémentaire.

La généralisation aux formats cadencés porte sur la borne par compte. Elle ne suffit pas à créer, à elle seule, un sélecteur d’organisation pour tous les formats : ce sélecteur est explicitement décidé pour Tabata, EMOM et Progression, et explicitement exclu pour For time.

### 5. EMOM : fenêtres et borne

- **— Réglages.** L’utilisateur règle la cadence, c’est-à-dire la durée d’une fenêtre, le nombre de tours et l’organisation « Par exercice » ou « En alternance ».
- **— Durée.** La durée du bloc EMOM est calculée et affichée en direct : `nombre de tours × nombre d’exercices × durée de fenêtre`. Elle n’est jamais saisie. Les éventuelles phases propres de séance restent distinguées de ce total de bloc.
- **— Composition.** Ajouter ou retirer un exercice conserve le nombre de tours et recalcule la durée. La durée n’entraîne aucun arrondi du nombre de tours ni dernier tour tronqué.
- **— Fenêtre.** Chaque fenêtre va jusqu’à son terme ; la suivante commence à l’échéance. Terminer l’objectif avant l’échéance ne raccourcit pas la fenêtre. Ne pas terminer l’objectif ne prolonge pas la fenêtre.
- **— Appui.** L’appui sur le cadran indique que le travail de la fenêtre est terminé et révèle le repos restant. Il ne passe pas à la fenêtre suivante.
- **— Repos.** Le repos de la fenêtre est le temps qui reste entre la fin effective du travail et son échéance. Il est variable, non réglable et inclus dans la fenêtre ; il ne s’ajoute pas une deuxième fois à la durée totale. Sans fin de travail signalée avant l’échéance, aucune durée de repos positive n’est inventée.

Avec deux exercices et six passages chacun : « Par exercice » regroupe les six fenêtres de A puis les six de B ; « En alternance » alterne A et B six fois. La fenêtre commune et le nombre total de fenêtres restent identiques. Cette description est fonctionnelle : le raccordement aux champs du circuit doit éviter de multiplier une seconde fois les séries et les tours.

Exemple : 6 tours × 2 exercices × 60 s = **12 min**. Ajouter C donne **18 min**, toujours avec 6 tours. Fin du travail à 35 s dans une fenêtre de 60 s : **25 s de repos**. La durée de la fenêtre n’est pas le paramètre « Bip de cadence » de l’exercice ; ce sont deux informations distinctes.

### 6. AMRAP, For time et départs rapides

#### 6.1 AMRAP

- **.** L’AMRAP a une durée imposée réglable. Le circuit est répété jusqu’à l’échéance globale ; le nombre de tours réalisés est un résultat, pas une borne saisie.
- **.** Pour les formats cadencés Tabata, Intervalles et EMOM, la borne saisie est un compte. Cette règle ne s’applique pas à l’AMRAP ni au For time. Elle ne change pas les possibilités des séances libres en dehors du périmètre décidé.

SRC-01 exclut pour l’AMRAP le circuit de séries et les séries variables : ne pas lui appliquer le sélecteur de Progression par généralisation. Les objectifs par exercice restent les valeurs prescrites du format.

#### 6.2 Départs rapides et Progression

- **.** Renforcement, Gainage · Mobilité, Superset, Progression, À l’échec et Libre ne font que préremplir une séance libre. Aucun verrouillage métier ne provient de cette origine.
- **.** Progression propose « Par exercice » et « En alternance ». Ses valeurs sont des répétitions **par série**. En alternance, les passages restent comptés en séries : A10, B10, A12, B12, A14, B14. Par exercice : A10, A12, A14, puis B10, B12, B14. L’ordre n’efface ni ne réindexe la prescription.

Les exemples 3 × 15, postures, deux exercices enchaînés, 10 · 12 · 14 et trois séries à l’échec sont des préremplissages de leurs modèles respectifs, pas des constantes du moteur. La charge additionnelle et une entrée Pyramide distincte restent hors périmètre.

#### 6.3 For time

- **.** Le paramètre s’appelle « Volume par tour ». Pour `21 · 15 · 9`, chaque exercice est exécuté à 21 répétitions au premier tour, 15 au deuxième, 9 au troisième.
- **.** Aucun sélecteur « Par exercice / En alternance » n’est proposé pour For time. L’échelle reste indexée par tour ; elle n’est pas transformée en trois séries successives à l’intérieur de chaque exercice.
- **.** La phrase normative est : « 21 répétitions au premier tour, 15 au deuxième, 9 au troisième. Le plus vite possible. » Le travail prescrit borne le format ; le temps réellement nécessaire pour l’accomplir est un résultat.

Avec A et B : A21, B21, A15, B15, A9, B9. Les trois valeurs décrivent trois tours. Le modèle doit garantir la cohérence entre nombre de tours et valeurs applicables, sans inventer un objectif pour une entrée manquante. La mécanique exacte de l’éditeur d’échelle sera raccordée au contrat d’écran courant, sans recopier automatiquement la règle des séries variables si elle change l’unité.

« Le plus vite possible » exprime l’objectif du format, pas l’interdiction de faire une pause ni une détection automatique des mouvements. Les commandes générales non remplacées restent applicables.

### 7. Death by

#### 7.1 Fenêtres, objectif et acquisition

- **.** Le rang de fenêtre est déduit de l’horloge d’exécution ; l’utilisateur ne déclare jamais un nombre de tours à chaque passage. L’objectif est calculé depuis le rang, le départ et l’incrément du format. Dans le cas de référence : une répétition la première minute, puis une de plus à chaque minute.
- **.** Un seul bouton met fin à la séance et ouvre une confirmation distinguant « Limite atteinte » et « Abandonner ».
- **.** Un tour est acquis lorsque l’objectif de sa fenêtre est accompli, signalé par l’appui sur le cadran. Cet appui révèle le repos restant ; il ne fait pas avancer la fenêtre et ne compte pas les mouvements individuellement.
- **.** Une fenêtre entamée sans appui n’est pas un tour acquis. Son échéance ne vaut pas confirmation implicite. Le rang courant et le nombre de tours acquis sont deux données distinctes. Un appui répété dans la même fenêtre ne peut acquérir deux tours.

Pour une fenêtre de durée W et un temps actif t depuis le départ du bloc, hors traitement exact de la frontière d’échéance : `rang = floor(t / W) + 1`. Pour un départ q0 et un incrément d : `objectif(rang) = q0 + (rang − 1) × d`. Ces expressions décrivent la logique temporelle ; les événements de frontière doivent être traités une seule fois par le moteur.

La fenêtre n’attend pas une déclaration de rang pour démarrer. La progression temporelle et la confirmation du travail sont séparées. La confirmation du travail est déclarative, pas une mesure de répétitions par capteur.

#### 7.2 Dernière fenêtre et résultat

- **.** Lorsqu’une dernière fenêtre est entamée sans être achevée, elle ne compte pas comme tour. La confirmation d’arrêt demande le nombre de répétitions réalisées dans cette fenêtre, prérempli à zéro. La validation confirme la valeur affichée. Avant validation, ce zéro est une valeur proposée dans le formulaire, pas une mesure constatée.
- **.** Le résultat associe les tours acquis et les répétitions partielles, par exemple « 12 tours + 5 répétitions ». Le motif est « limite atteinte » ou « abandon ». Dans les deux cas, l’état d’achèvement reste **incomplet**, conformément à la décision du 14/10 à 17:13.

Cette règle remplace explicitement la V2 et l’interprétation antérieure selon lesquelles une limite atteinte produisait l’état « terminée ». Un arrêt après acquisition d’une fenêtre ne doit pas compter une seconde fois cette même fenêtre comme répétitions partielles.

Le formulaire de répétitions partielles est propre à cette clôture Death by. Il ne généralise pas une saisie obligatoire à toutes les cibles À l’échec des exercices. L’absence d’appui ne doit pas être transformée rétrospectivement en objectif accompli.

# 4. Exécution d'une séance

## 4.1 Principe général

L'exécution d'une séance consiste à guider l'utilisateur à travers l'ensemble des exercices qui composent la séance, dans l'ordre défini lors de sa création.

Avant le démarrage effectif de la séance, un instantané fonctionnel de la séance est enregistré. Cet instantané est utilisé pour garantir la cohérence de l'historique, même si la séance est modifiée ultérieurement.

Pendant toute l'exécution, l'application calcule en temps réel la progression de la séance, le temps écoulé et le temps restant.

## 4.2 Démarrage d'une séance

Une séance peut être démarrée :

- depuis le catalogue des séances ;

Avant de lancer la première exercice, l'application :

- crée un instantané de la séance ;
- initialise les indicateurs de progression ;
- démarre le compte à rebours initial, lorsque sa durée est supérieure à `0 s`.

Lorsque le Compte à rebours initial est configuré à `0 s`, cette phase est instantanée et la premier Exercice débute immédiatement.

## 4.3 Déroulement

**Portée formats :** les fenêtres EMOM/Death by, la borne AMRAP et la clôture Death by suivent la [section Formats](#formats-conception). La transition générique et le statut ci-dessous ne les remplacent pas.

Les exercices sont exécutés dans l'ordre défini dans la séance.

Chaque exercice est exécutée intégralement avant le passage à la suivante.

Le Cycle technique est exécuté une seule fois. Le Tour répète automatiquement son contenu jusqu’à atteindre son nombre de répétitions défini.

Les Exercices placés après le Circuit sont exécutés une seule fois après le dernier Tour du Circuit.

Lorsque le dernier Exercice est terminée, le Plan passe à la phase structurelle `SESSION_END`. La Séance n’est considérée comme terminée qu’après l’achèvement de cette phase.

## 4.4 Informations affichées

Pendant l'Exécution, l'écran affiche principalement :

- le nom de l'Exercice en cours ;
- la Série courante sous la forme `x/y` lorsqu'il s'agit d'un Exercice ;
- le temps de l’Exercice : compte à rebours pour un Exercice chronométré, chronomètre croissant pour un Exercice en Répétitions ou À l’échec ;
- la Série et le Tour en cours ; le Cycle n’est jamais affiché ;
- l'Exercice suivant et sa durée lorsqu'elle est connue ;
- les commandes Réinitialiser, Pause et Exercice suivant ;
- le temps total écoulé / durée estimée d’exécution et sa barre de progression.

La notion d'« étape » n'est pas affichée comme indicateur de progression dans le MVP.

### Temps écoulé et durée réelle

Le **temps total écoulé** correspond au temps actif réellement passé dans l'Exécution depuis son démarrage effectif, en excluant les périodes pendant lesquelles l'utilisateur a placé la Séance en Pause.

Il inclut notamment :

- le temps réellement passé dans les Exercices en mode Répétitions ou À l’échec ;
- les Exercices chronométrés ;
- les Pauses entre Séries effectivement exécutées ;
- les phases `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY` effectivement exécutées ;
- les phases chronométrées du Compte à rebours initial et de la Fin de séance.

La **durée réelle** enregistrée à la fin de l'Exécution suit la même règle : les périodes de Pause utilisateur en sont exclues.

### Barre de progression globale

La barre couvre le Plan d’Exécution complet : le Compte à rebours initial et la Fin de séance `SESSION_END` participent à son avancement. Elle ne peut atteindre `100 %` qu’à l’achèvement de `SESSION_END`. Dans T04, les étapes chronométrées sont pondérées proportionnellement à leur durée planifiée ; les occurrences en Répétitions ou À l’échec suivent la pondération hybride de RM-077 et leur part est acquise lorsque l’utilisateur touche `Suivant`. Les Pauses manuelles n’augmentent pas le remplissage.

La progression mathématique de la barre est continue. Sa piste est toutefois structurée visuellement par Tours conformément au prototype Figma. Ces séparations sont uniquement des repères de lecture et ne modifient ni les poids ni le calcul de l’avancement global.

Le calcul porte sur le plan développé et conserve la piste existante. M compte les étapes contributives ; R compte les Séries Répétitions sans cadence et À l’échec ; T somme les durées des phases chronométrées positives et les Ri×Ci des Séries cadencées. Chaque Série sans durée déterminable pèse1/M ; chaque étape temporelle de durée d pèse(1−R/M)×d/T. Sans R, poids d/T ; sans T, poids1/M. Phases0s, Pause manuelle et attente de point n’ont aucun poids. Les non-cadencées/À l’échec acquièrent leur part à Suivant ; les Répétitions avec bip progressent continûment, Suivant acquiert leur reste. À fin nominale, part de Série100% mais Série active. Pause abandonne la fraction d’intervalle pour la progression, conserve le temps réel ; reprise sur intervalle complet. Aucun100% global publié avant finalisation du plan. Poids figés au départ ; reset remet à zéro son périmètre seulement. Aucun nouveau composant de progression par Série.

La barre représente donc l'**avancement global dans le plan d'Exécution**. Elle n'est pas le simple rapport entre le temps total écoulé et la durée estimée d’exécution.

Répétitions et À l’échec : chronomètre croissant ; sans bip périodique, rotation et bip minute selon règles existantes. Répétitions cadencées : chronomètre croissant, intervalles sonores et signal périodique maintenu après nominal sans signal final distinct ; aucun bip minute ajouté et aucune fin automatique. Pause/Reprise suit la chapitre 08, Bip de cadence, progression et sécurité.

## 4.5 Actions disponibles

Pendant l'exécution, l'utilisateur peut :

- réinitialiser l'exercice en cours ;
- mettre la séance en pause ;
- passer à l'exercice suivante.

Toutes les autres informations sont consultatives.

## 4.6 Réinitialisation d'un exercice

L’utilisateur peut réinitialiser la Série courante en unilatéral ou le bloc du côté courant depuis sa première Série en bilatéral ; pendant une récupération, seule la phase courante est réinitialisée (D-029/D-150, RM-062).
Lorsque cette action est demandée, l'application affiche une demande de confirmation.

Si l'utilisateur confirme :

- en unilatéral, la Série courante recommence ; en bilatéral, le bloc du côté courant recommence selon D-029/D-150 et chapitre 08, paramètres d’exercice, dans les deux ordres ;
- pendant une récupération, seule la phase courante recommence (RM-062) ;
- le chronomètre de tentative et la progression du périmètre reviennent à zéro ; les paramètres, l’autre côté et les résultats hors périmètre sont conservés ;
- le temps actif réel cumulé, y compris celui des tentatives antérieures, reste enregistré ; aucun nombre de répétitions physiquement réalisées n’est déduit ni annulé.

Si l'utilisateur annule, aucun reset n’est appliqué. Les règles de confirmation et de suspension ci-dessous s’appliquent ; une reprise de Série cadencée suit l’exception d’intervalle complet de chapitre 10, résultats temporels.

Les confirmations appliquées pendant l'Exécution suivent la règle suivante :

- **Réinitialiser** → confirmation, afin d'éviter une perte involontaire de progression sur l'Exercice ;
- **Suivant** → pour un Exercice chronométré avant son terme, confirmation afin d’éviter un passage involontaire et enregistrement `Partielle` si confirmé ; pour un Exercice en mode Répétitions ou À l’échec, fin normale de la Série sans confirmation ;
- **Pause** → aucune confirmation, l'action étant réversible ;
- **Arrêter la séance** → confirmation via le modal de pause.

Les confirmations protègent ainsi les actions ayant un impact irréversible sur la progression.

## 4.7 Passage à l'exercice suivante

**Portée formats :** les fenêtres EMOM/Death by, la borne AMRAP et la clôture Death by suivent la [section Formats](#formats-conception). La transition générique et le statut ci-dessous ne les remplacent pas.

L’action **Suivant** a deux comportements selon le mode de l’Exercice :

- pour un Exercice chronométré utilisée avant son terme, une confirmation est demandée ; après confirmation, l'Exercice est enregistrée avec le statut **Partielle** ;
- pour un Exercice en mode Répétitions ou À l’échec, l’action constitue la fin normale de la Série courante et ne crée pas de statut Partielle.

Dans les deux cas, l'Exécution poursuit ensuite le plan normal.

## 4.8 Mise en pause

La mise en pause suspend immédiatement :

- le chronomètre ;
- les annonces vocales ;
- les signaux sonores ;
- la progression automatique.

La séance conserve son plan et ses résultats ; en cadence, la progression revient au dernier intervalle complet et le temps actif cumulé est conservé.

Depuis l'écran de pause, l'utilisateur peut :

- reprendre la séance ;
- arrêter la séance.

## 4.9 Reprise

La reprise conserve le plan et les résultats. Pour les décomptes, elle reprend le temps restant. Exception Cadence : la fraction incomplète a été abandonnée pour la progression ; un nouvel intervalle complet démarre, et le temps réel déjà dépensé est conservé (Cadence§4).

### Arrière-plan et verrouillage

Le passage en arrière-plan ou le verrouillage de l’écran ne constitue pas une mise en pause utilisateur. Le Plan d’Exécution continue selon ses horodatages de référence. Au retour, l’application reconstitue l’Exercice et la position temporelle qui auraient dû être atteintes ; elle ne reprend pas un compteur figé.

Une pause de sécurité est appliquée si aucune interaction n’a eu lieu :

- 30 minutes après la fin théorique d’un Exercice chronométré ou la fin nominale recalculée d’une Série cadencée ;
- 2 heures après le démarrage d’un Exercice en Répétitions sans cadence ou À l’échec.

La pause de sécurité conserve l’état recalculé au moment de son déclenchement et demande à l’utilisateur de reprendre ou d’arrêter la Séance.

## 4.10 Arrêt anticipé

**Portée formats :** les fenêtres EMOM/Death by, la borne AMRAP et la clôture Death by suivent la [section Formats](#formats-conception). La transition générique et le statut ci-dessous ne les remplacent pas.

L'arrêt anticipé est uniquement accessible depuis l'écran de pause.

Lorsque l'utilisateur confirme cet arrêt :

- l'exécution est interrompue ;
- les informations déjà enregistrées sont conservées ;
- la séance est enregistrée dans l'historique avec le statut **Interrompue** ;
- l'écran de synthèse est affiché.

Les exercices restants ne sont pas exécutées.
### Pause prolongée

Lorsqu'une Séance reste en pause pendant au moins 30 minutes consécutives, l'application demande à l'utilisateur s'il souhaite poursuivre l'Exécution.

L'utilisateur peut :

- reprendre la séance ;
- arrêter la séance.

En l’absence de réponse, la Séance reste suspendue avec son état conservé, sans délai d’arrêt automatique (chapitre13 R-03).

La durée de 30 minutes pourra devenir un paramètre utilisateur dans une version ultérieure.

## 4.11 Fin de séance

Lorsque le dernier Exercice est terminée, la phase chronométrée `SESSION_END` démarre. Lorsqu’elle est configurée à `0 s`, elle s’achève immédiatement. Ce n’est qu’après son achèvement que :

- l’Exécution est clôturée et enregistrée dans l'historique ;
- son statut est déterminé automatiquement ;
- l'écran de Synthèse est affiché.

Le statut de l'exécution est déterminé selon les règles suivantes :

> **Formats :** cette grille antérieure n’encode pas à elle seule l’achèvement incomplet du Death by. Conserver séparément motif, résultat et achèvement selon aucun mapping implicite vers Terminée.

| Statut      | Description                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Terminée    | Toutes les Exercices ont été terminées normalement et `SESSION_END` a été achevée. |
| Partielle   | `SESSION_END` a été achevée, mais au moins un Exercice a été interrompue ou ignorée. |
| Interrompue | L’Exécution a été arrêtée avant l’achèvement de `SESSION_END`, y compris pendant cette phase. |

## 4.12 Historique d'exécution

Chaque exécution enregistre notamment :

- la date et l'heure de début ;
- la durée réelle ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur ;
- l’instantané fonctionnel de la séance ;
- les informations propres à chaque exercice exécuté.

Cet instantané est suffisamment complet pour restituer la structure, les paramètres et les libellés de la Séance exécutée, mais il reste volontairement léger. Dès leur introduction au MVP dans PRE-3 , il conserve les associations média ordonnées et leurs références stables sans dupliquer les fichiers physiques.

Une exécution n'est jamais modifiée après son enregistrement.

## 4.13 Principes de conception

L'exécution d'une séance repose sur les principes suivants :

- une séance s'exécute toujours à partir d'un instantané ;
- les modifications ultérieures d'une séance n'ont aucun impact sur son historique ;
- l'utilisateur peut interrompre ou reprendre une séance à tout moment ;
- chaque exercice est enregistrée indépendamment afin de garantir la fidélité de l'historique ;
- les indicateurs de progression sont recalculés automatiquement pendant toute l'exécution.

<a id="bip-execution"></a>

## Bip de cadence, progression et sécurité

### Paramètre commun aux deux modes

**Bip de cadence** : signal périodique pendant une Série, en Durée ou Répétitions, avec cible chiffrée ou À l’échec par série. Intervalle entier de 0 à 10 secondes, défaut 0, affiché **Aucun** ; 1..10 affiche la valeur et l’unité s. Stepper, sans interrupteur ni roulette. Aucun nouveau réglage Profil. Zéro est une valeur valide, pas une erreur ou une cible manquante.

Nom logique cible : `cadenceBeepIntervalSeconds`. L’ancien nom limité aux répétitions est abandonné. Le réglage reste commun à toutes les Séries de l’Exercice : il est copié/modifié sur toutes les entrées de la collection effective ; aucune édition indépendante par ligne ni surcharge concurrente. Les deux modes acceptent ce champ ; changer de mode ne le masque ni ne l’efface. ✓ applique atomiquement au brouillon parent ; ✕ annule ; Terminer persiste. Déplacement/duplication/copie/instantané le conservent. Ancien objet sans champ : 0, aucun tempo implicite.

### Exécution et son

Le bip n’incrémente aucun compteur de répétitions réalisées, ne déclenche aucune transition et ne termine aucune Série. Durée chiffrée garde sa fin automatique au zéro du minuteur ; Répétitions et toute cible À l’échec se terminent par Suivant. « C’est l’utilisateur qui termine » ne désactive donc pas le minuteur Durée.

Premier bip après un intervalle complet, puis périodiquement tant que la Série est active, dans les deux modes. Conséquence de la nouvelle définition : en Répétitions, le nominal Ri×b n’arrête plus le bip et n’émet plus un signal final distinct. À 10 répétitions et b=4s, bips à4,8,…40,44… jusqu’à fin/Pause. Le nominal est seulement une estimation. Le temps cible estimé utilise la ligne de temps existante ; pas de nouvelle maquette d’exécution dans ce lot. Pour Répétitions à l’échec, les intervalles logiques proposent un relevé estimé, jamais un comptage détecté de mouvements.

Les bips s’arrêtent hors des phases de Série (Pause de série, changement de côté, récupération, point d’arrêt, préparation et fin) ; les signaux de ces phases restent distincts. Les préférences Sons existantes contrôlent l’audibilité ; les désactiver ne change ni la valeur du paramètre ni le calcul. Avec bip périodique, ne pas superposer le bip minute ; sans bip, les règles antérieures de signal minute restent celles des modes concernés. Si une fin de phase coïncide avec un bip, la transition et son signal priment ; aucun double signal.

Pause manuelle suspend le bip et conserve le temps réellement actif. Reprise : intervalle complet avant le prochain bip, sans rattrapage. Cette reprise audio ne réinitialise pas le minuteur Durée. Réinitialiser conserve sa portée métier : Série en unilatéral, côté courant en bilatéral, phase courante en récupération ; autre côté et temps cumulé conservés. Consulter les médias ne crée pas de Pause.

### Progression, sécurité et arrière-plan

Conserver la progression existante par plan : Durée chiffrée selon minuteur ; Répétitions chiffrées avec bip selon nominal estimé et plafond100% sans transition ; Répétitions sans bip/À l’échec acquièrent leur poids à Suivant. Le bip en À l’échec ne rend pas la durée calculable. Aucun nouvel indicateur par Série. Les intervalles sonores supplémentaires après nominal ne créent pas de progrès supplémentaire ; aucun100% global avant fin du plan.

En Répétitions chiffrées avec bip, Pause abandonne la fraction en cours pour la progression, mais pas pour le temps réel ; reprise sur un intervalle entier. En Durée, progression et temps restant suivent les règles du minuteur, indépendamment du nombre de bips. Les autres règles de progression du chapitre13 restent applicables aux phases effectivement générées.

Arrière-plan/verrouillage ne sont pas une Pause volontaire. Ordonnancement par ancres temporelles monotones, retour sans rejouer les signaux manqués, reprise idempotente après suspension système et absence de doublon. Qualifier le métronome sur appareil dans les deux modes, sur plusieurs minutes, avec écran verrouillé, interruptions audio et suspension ; aucune fiabilité native n’est déclarée acquise par la documentation.

Sécurité existante conservée là où elle a un sens : Répétitions chiffrées avec bip,30min après nominal recalculé ; Répétitions sans bip et toutes cibles À l’échec (les deux modes, avec ou sans bip),2h sans interaction ; Durée chiffrée conserve ses transitions chronométrées. Aucun arrêt définitif automatique si l’utilisateur ne répond pas à Reprendre/Arrêter.

<a id="releves-execution"></a>

## Cibles et relevés d’exécution

### Exécution et plan développé

| Mode | Cible | Mesure pendant l’effort | Fin normale |
|---|---|---|---|
| Durée | Chiffrée | Minuteur de la durée prescrite | Fin automatique existante |
| Durée | À l’échec | Temps d’effort écoulé | Suivant, sans confirmation |
| Répétitions | Chiffrée | Comportement existant, nominal estimé si bip positif | Suivant, sans confirmation |
| Répétitions | À l’échec | Temps d’effort et proposition de répétitions si bip positif | Suivant, sans confirmation |

La cible À l’échec n’est pas une durée infinie ni une durée zéro. Elle n’a pas de fin nominale. L’appui sur Suivant termine l’effort prescrit ; il ne prouve pas à lui seul un échec physiologique détecté par l’application.

Les règles existantes de Pause/Reprendre, Retour, réinitialisation, abandon et arrière-plan restent applicables. Chaque phase effective connaît le mode, la nature de cible, l’occurrence de série, le côté, le passage et le circuit éventuel.

#### Pauses, côtés et circuits

Aucune modification des règles déjà actées : pause après chaque série, traitement bilatéral, substitution de la toute dernière pause par une récupération positive, points d’arrêt et phases propres de séance. Le plan développé demeure la base de calcul.

Dans un circuit de séries, le passage bilatéral reste : premier côté → pause de changement de côté → second côté → pause de série ou récupération substituée → exercice suivant. Il n’y a pas de pause de série supplémentaire avant la pause de changement de côté. La nouvelle cible ne crée aucune exception.

#### Progression et sécurité

La classification doit porter sur la série effective :

- Cible À l’échec, dans les deux modes et avec ou sans bip : travail sans durée nominale ; poids acquis à Suivant selon le principe existant des étapes indéterminées.
- Durée chiffrée : progression temporelle existante.
- Répétitions chiffrées avec bip : progression selon le nominal estimé, sans fin automatique ; bips supplémentaires sans progression supplémentaire.
- Répétitions chiffrées sans bip : progression existante acquise à Suivant.

Les formules de pondération ne changent pas ; les prédicats de RM-077/RM-126 doivent être réécrits. « Mode Durée » ne suffit plus à reconnaître une phase chronométrée à fin automatique.

La sécurité existante sans fin nominale (2 h sans interaction selon la règle actuelle) s’applique à toute cible À l’échec. Les 30 min après nominal recalculé restent réservées aux répétitions chiffrées avec bip. Les transitions de Durée chiffrée restent celles du minuteur. Pas de nouveau seuil.

### Relevés d’exécution

Le relevé est distinct de la prescription et des totaux temporels de l’exécution. Il concerne les séries prescrites À l’échec ; cette évolution n’étend pas la saisie de répétitions réalisées à toutes les séries chiffrées.

#### Origine et qualification

| Cas | Valeur | Qualification |
|---|---|---|
| Durée à l’échec terminée | Temps actif de la dernière tentative terminée | Chronométrée |
| Répétitions à l’échec avec bip, sans confirmation | Nombre de bips proposé | Estimée |
| Même cas, confirmation sans correction | Nombre confirmé | Déclarée |
| Même cas, correction | Nombre corrigé | Déclarée |
| Répétitions à l’échec sans bip, saisie | Nombre renseigné | Déclarée |
| Répétitions à l’échec sans bip, aucune saisie | Absence de valeur | Non renseignée |

Ni Suivant, ni le passage à l’exercice suivant, ni l’enregistrement global de la séance ne constituent implicitement une confirmation de l’estimation. Le relevé n’est pas requis pour poursuivre. Absence de saisie et zéro sont distincts ; zéro peut notamment être la proposition après une fin avant le premier bip.

Le bip ne détecte pas le mouvement. La confirmation produit une déclaration de l’utilisateur, pas une mesure automatique certifiée. Une série à l’échec ne devient pas temporellement calculable parce qu’un relevé de répétitions lui est associé après exécution.

#### Comptage de la proposition

Réutiliser la chronologie logique des intervalles du bip ; ne pas faire dépendre la donnée du volume, de l’activation du son ou du nombre de fichiers audio effectivement joués. Le premier bip est après un intervalle complet, conformément à la spécification existante. Les signaux de préparation, pauses, changements de côté et fin ne comptent pas comme répétitions.

Une Pause suspend les intervalles selon la mécanique existante. Le comptage conserve les intervalles acquis ; une fraction abandonnée à la Pause ne devient pas une répétition complète. Ne pas remplacer cette logique par une division globale du temps cumulé lorsque des pauses ou réinitialisations sont intervenues. La priorité existante de la transition évite de compter deux fois une échéance à la fin d’une série. La reprise et les événements répétés doivent rester idempotents.

#### Réinitialisation

Le temps actif cumulé conserve les tentatives antérieures. Le relevé correspond à la dernière tentative terminée pour l’occurrence concernée ; une tentative remplacée par réinitialisation n’est pas additionnée à sa performance.

Exemple validé : 20 s → Réinitialiser → 35 s → Suivant donne 55 s de temps actif cumulé et 35 s de relevé. Les pauses manuelles n’entrent pas dans le temps actif de cette tentative. Une simple Pause/Reprendre ne constitue pas une réinitialisation.

Pour les répétitions proposées, le compteur de la tentative est réinitialisé dans le même périmètre que la tentative concernée. Les résultats hors du périmètre réinitialisé restent conservés conformément aux règles existantes.

#### Identité et historique

Le rattachement utilise l’occurrence exécutée : exécution, exercice de l’instantané, série, côté et passage/circuit applicables. Deux tours ou deux côtés n’écrasent pas le même relevé.

Conserver au minimum la valeur facultative, son unité, son origine (chronomètre, proposition issue du bip, saisie utilisateur), sa qualification (chronométrée, estimée, déclarée ou absente) et son rattachement à la tentative. Conserver la proposition source lorsqu’elle est corrigée permet de distinguer calcul et déclaration. Ce modèle est fonctionnel ; il ne prescrit pas encore des noms de colonnes SQL.

Un abandon conserve les données partielles selon les règles existantes ; une tentative interrompue ne doit pas être présentée comme une performance terminée à l’échec. Le contrat détaillé de saisie et de correction, notamment après la séance, sera conçu dans le chantier d’écran prévu séparément. Cette spécification n’ouvre pas implicitement une édition illimitée de l’historique.

<a id="planification"></a>

## 5. Planification des créneaux et de leurs contenus

### Le concept central : un créneau peut porter plusieurs contenus

#### Ce qui change

Jusqu'ici, planifier revenait à poser **une** séance ou **un** exercice sur un créneau. Désormais un créneau porte une **liste ordonnée de contenus**, qui peuvent être des séances, des exercices, ou un mélange des deux.

#### L'invariant, qui ne bouge pas

> **Le créneau produit les occurrences ; le contenu ne fait que les filtrer.**

Aucun contenu ne peut créer une occurrence que le créneau n'a pas produite. Cet invariant commande tout le reste, en particulier le modèle de fréquence (§ 2).

#### « Parcours » : un mot, pas un objet

Le mot **parcours** réapparaît dans l'interface, mais **uniquement comme vocabulaire**. L’ancien objet autonome Parcours est retiré de la conception :

> Le parcours n'est pas une entité du modèle. Il n'a ni identité, ni persistance propre, ni écran de détail, ni rattachement. Il désigne **ce que produit** la planification de plusieurs contenus liés sur un même créneau. C'est un résultat nommé, pas une classe.

À distinguer soigneusement du **Programme**, qui est, lui, un conteneur réel (§ 4).

L’ancien usage de **circuit** pour cet objet autonome est supprimé. Le **Circuit interne à une Séance** reste conservé : un Tour en est une répétition . Ne pas supprimer ni renommer les identifiants techniques historiques dans cette mission documentaire.

#### Ordre des contenus

La liste est ordonnée et réordonnable. Chaque ligne porte une poignée de réordonnancement (icône `icon/poignee`, 12 × 18), le nom du contenu, et sa fréquence propre.

---

### La fréquence d'un contenu : « x fois sur n »

#### La forme retenue

La fréquence d'un contenu au sein d'un créneau s'exprime **exclusivement** sous la forme :

> **x fois sur n**

Exemples : « à chaque fois », « 1 fois sur 2 », « 2 fois sur 3 ».

#### Pourquoi cette forme, et pas « tous les 2 jours »

Une formulation comme « 2 fois tous les 3 jours » décrit une **périodicité**, qui est l'affaire du créneau. Le contenu, lui, ne connaît pas les jours : il ne voit qu'une suite d'occurrences produites par le créneau, et il en retient certaines.

**Conséquence majeure à documenter : la fréquence d'un contenu n'a pas d'unité.** Changer le créneau de « tous les jours » à « toutes les semaines » ne modifie pas la fréquence du contenu — seule change la nature des occurrences filtrées.

#### Le cas par défaut

Quand x = n, la fréquence s'écrit **« à chaque fois »**, en minuscule. C'est la valeur par défaut d'un contenu ajouté à un créneau.

#### Le réglage : combien, puis lesquelles

L'écran de réglage comporte deux niveaux :

1. **Deux steppers** — le premier pour x, le second pour n — reliés par le mot « fois sur », en corps plus grand que les libellés voisins.
2. **n pastilles numérotées** de 1 à n, dont l'utilisateur sélectionne celles qu'il retient.

Cela rend exprimables des motifs que le seul couple (x, n) ne permettait pas : « la 1re et la 3e sur 3 » (●○●) se distingue de « les deux premières sur 3 » (●●○).

**Règle de réinitialisation :** modifier l'un des deux steppers **remet toutes les pastilles au gris**. Les paramètres définissent le cadre, la sélection le remplit. Il n'y a donc aucune règle de troncature à écrire quand n diminue.

**Nombre de pastilles affichées :** n. Une variante à 2n avec un séparateur visuel (un point) entre les deux cycles a été envisagée comme repli si n est petit ; elle n'est pas retenue pour l'instant.

**Aucun texte explicatif** n'accompagne le réglage. La forme « x fois sur n » et les pastilles se suffisent.

#### Ce que montre la liste

Dans la liste des contenus du créneau, la fréquence s'affiche sous sa **forme générique** — « à chaque fois », « 2 fois sur 3 ». Le motif détaillé (quelles occurrences) n'apparaît que :

- dans la feuille de réglage de la fréquence ;
- dans le calendrier, qui montre les occurrences réelles.

#### Point ouvert à consigner comme tel

Le x du premier stepper et le nombre de pastilles sélectionnées expriment la même information. Deux comportements sont possibles et ne sont pas tranchés :

- le stepper **plafonne** la sélection (on ne peut pas cocher plus de x pastilles) ;
- ou le stepper **se met à jour** quand l'utilisateur coche.

À clarifier avant de finaliser l’implémentation concernée ; aucun choix implicite n’est autorisé.

---

### La répétition du créneau

#### Un interrupteur, puis une unité

La ligne de section « Répétition » porte à droite un **interrupteur** et, **à côté du titre**, un **chevron de repli**.

- Interrupteur sur **Non** → la section est repliée, rien à régler.
- Interrupteur sur **Oui** → le paramétrage apparaît.

**L'option « Aucune » n'existe plus.** Elle appartenait à un contrôle binaire `Aucune / Périodique` qui est supprimé. C'est désormais l'état de l'interrupteur qui porte l'absence de répétition.

#### L'unité de récurrence

Un **contrôle segmenté à trois éléments** : **Jour · Semaine · Mois**.

Une quatrième unité « Heure » a été étudiée et **écartée pour l'instant**. Raisons à consigner, car elles resserviront :

- elle est la seule unité qui ne borne pas le nombre d'occurrences par jour ;
- la rangée L M M J V S D devient inopérante et appellerait un contrôle d'heures distinct ;
- le volume d'occurrences explose (≈ 1 000 sur trois mois contre 13 en hebdomadaire), ce qui pèse sur le stockage, la vue Jour, le Suivi et le calcul d'appartenance à un programme ;
- un rappel par occurrence dépasse rapidement le plafond de notifications programmables du système ;
- la borne « jusqu'au », qui est une date, ne suffirait plus.

**Alternative identifiée si le besoin revient** (rééducation, mobilisation pluriquotidienne) : ne pas ajouter d'unité, mais permettre **plusieurs heures dans une journée** sur l'unité Jour — « tous les jours à 8 h, 12 h et 16 h ». Ensemble borné, occurrences bornées, et cela reste un filtre, donc compatible avec l'invariant du § 1.2. À défaut, **plusieurs créneaux le même jour** répondent déjà au besoin sans rien changer au modèle.

#### La phrase éditable

La phrase de récurrence se compose sur **deux lignes** :

```
Toutes les
[2]  semaines  [jusqu'au]  [23 août 2026]
```

- **« Toutes les »** est un libellé libre, seul sur sa propre ligne, en **Medium 12**.
- **[2]** est une valeur modifiable (le multiplicateur), en **16**.
- **« semaines »** est un libellé libre accordé à l'unité sélectionnée, en **Medium 12**.
- **[jusqu'au]** est une **valeur modifiable à deux valeurs**, en **16** — voir § 3.4.
- **[23 août 2026]** est la borne, en **16**.

**Pourquoi deux lignes.** L’exemple mesuré dans le brief — « Toutes les 12 semaines jusqu'au 23 septembre 2026 » — mesure **410 px** au corps des titres de section, pour une largeur utile de **354 px**. Détacher « Toutes les » sur sa propre ligne ramène la ligne porteuse à **352 px**, sur le gabarit de référence. Les autres tailles d’écran et le texte agrandi doivent rester lisibles sans réduire la police. La règle à écrire est donc : *la phrase tient sur une seule ligne porteuse, le préfixe est posé au-dessus*.

#### `jusqu'au` / `pendant` : un paramètre, pas un mot fixe

C'est un point de modèle à documenter explicitement.

> La borne de fin est introduite par un **paramètre à deux valeurs** : **`jusqu'au`** et **`pendant`**.

| valeur | ce que porte la borne | exemple |
|---|---|---|
| `jusqu'au` | une **date** | Toutes les 2 semaines **jusqu'au** 23 août 2026 |
| `pendant` | un **nombre d'unités** | Toutes les 2 semaines **pendant** 12 semaines |

Le même emplacement porte donc deux types de valeur selon le paramètre choisi. La bascule devra assurer une conversion dans les deux sens ; sa formule et ses cas limites restent à spécifier avant développement.

#### Les jours de la semaine

La rangée **L M M J V S D** filtre les occurrences d'une récurrence. Elle n'a de sens que sous l'unité **Semaine**. Son comportement sous les unités Jour et Mois reste à définir : masquée, ou remplacée par un filtre adapté.

#### Accord grammatical

Le préfixe s'accorde à l'unité : « **toutes les** 2 semaines », « **tous les** 3 jours », « **tous les** 2 mois ». Règle déjà consignée, rappelée ici parce que le contrôle segmenté la rend systématique.

---

### Le Programme

#### Première apparition dans l'interface

Le Programme apparaît pour la **première fois** dans l'interface, sur l'écran de planification. C'est un point à souligner dans la documentation : le concept existait dans la conception (document `Programme / Modèle de Programme` V1.2) mais n'était représenté nulle part.

#### Forme et position

Une **ligne de valeur** — libellé « Programme » à gauche, valeur à droite — en **première position du formulaire**, au-dessus de « Début le ».

Valeur par défaut : **« Aucun »**. Le rattachement est facultatif.

#### Pourquoi en première position

Ce n'est pas un choix de mise en page mais une conséquence du modèle :

> La fenêtre du programme **borne** les dates qui le suivent. Le choisir après les dates reviendrait à valider à rebours une saisie déjà faite. Un conteneur se déclare avant son contenu.

Référence : document de conception `Programme / Modèle de Programme` V1.2, § 9 (borne de début) et § 29.2 (gel de l'échu).

#### Ce qui reste à concevoir

Trois écrans du parcours Programme n'existent pas encore et doivent être signalés comme tels :

- la **création** d'un programme (nom, intention, période) ;
- la **proposition de rattachement** automatique des occurrences existantes tombant dans la période ;
- l'**avertissement** lorsqu'une occurrence tombe hors de la période du programme choisi.

---

### Points ouverts, à consigner comme tels

1. **x : plafond ou résultat ?** Le premier stepper et le nombre de pastilles cochées expriment la même information (§ 2.6).
2. **La rangée L M M J V S D sous les unités Jour et Mois** — masquée ou remplacée (§ 3.5).
3. **Les trois écrans du parcours Programme** : création, proposition de rattachement, avertissement hors période (§ 4.4).
4. **La conversion `jusqu'au` ↔ `pendant`** dans les deux sens, quand l'utilisateur bascule le paramètre (§ 3.4).
5. **Le décalage de 3 px du carré de Disclosure** dans les variantes `Cadre=Oui`, soit 196 instances annoncées par le brief (DSF général, § 8.1).

---

### Limites de spécification à traiter avant développement

La borne hebdomadaire existante 1..12 et le calcul ancré sur la semaine contenant le début restent applicables à Semaine ; ils ne fixent pas automatiquement les bornes de Jour/Mois ou des steppersx/n. Les règles de fin de mois, l’ancrage précis du motif après édition/suppression, les résultats partiels d’un créneau à plusieurs contenus et l’effet de l’archivage d’un seul contenu nécessitent une spécification complémentaire. Les anciens traitements mono-source ne peuvent pas être généralisés implicitement à toute la liste.

Une fréquence valide doit décrire x positions parmi n ; le comportement d’interaction qui garantit cette cohérence reste le point ouvert 1. Ne pas inventer de sélection automatique après remise au gris. Pas d’unité Heure ; plusieurs heures par jour est une piste, pas une capacité livrée.

Le document Programme / Modèle de Programme V1.2 cité par le brief n’a pas été retrouvé dans le dépôt lu. Une recherche des fichiers a retrouvé la V1.1 du 18/09, mais pas la V1.2. La V1.1 ne suffit pas à attester les clauses V1.2 : son §29.2 porte sur la réalisation à date et son §32 prévoit encore le recalcul rétroactif ; ne pas les substituer au gel de l’échu annoncé par le nouveau brief. Le rattachement facultatif, la fenêtre bornant les dates et le gel des données échues sont les exigences explicitement fournies ; aucune autre clause de cette source n’est reconstituée de mémoire. Les trois écrans manquants restent à concevoir.
# 6. Suivi et historique des séances

## 6.1 Principe général

Chaque exécution d'une séance crée un nouvel enregistrement dans l'historique.

Le suivi permet à l'utilisateur de consulter les séances déjà réalisées, leur déroulement et leur résultat.

Chaque exécution est indépendante des autres et reste conservée même si la séance d'origine est ensuite modifiée ou supprimée.

## 6.2 Création d'un historique

Un historique est créé dès le démarrage d'une séance.

Il est basé sur l'instantané enregistré au lancement de l'exécution.

Cet instantané comprend notamment :

- l’identifiant et le nom de la Séance source ;
- son Étiquette et la couleur portée par cette Étiquette ;
- le Compte à rebours initial ;
- la structure ordonnée des Cycles, Tours et Exercices ;
- les paramètres fonctionnels nécessaires de chaque Exercice ;
- les zones corporelles nécessaires à la restitution fidèle de l’historique ;
- la Fin de séance ;
- les paramètres nécessaires à la génération du plan d’exécution.

Les informations média nécessaires à la restitution suivent le périmètre média courant ; l’historique conserve en priorité les données nécessaires à la fidélité fonctionnelle de l’Exécution.

L'instantané n'est jamais modifié après sa création.

## 6.3 Informations enregistrées

Chaque historique enregistre notamment :

- la date et l'heure de début ;
- la durée réelle ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur ;
- le détail des exercices exécutés ;
- les temps réellement réalisés ;
- les éventuelles interruptions.

Ces informations restent définitivement associées à cette exécution.

## 6.4 Statut d'une exécution

**Portée formats :** les fenêtres EMOM/Death by, la borne AMRAP et la clôture Death by suivent la [section Formats](#formats-conception). La transition générique et le statut ci-dessous ne les remplacent pas.

Chaque exécution possède un statut.

Le MVP distingue les statuts suivants :

> **Formats :** cette grille antérieure n’encode pas à elle seule l’achèvement incomplet du Death by. Conserver séparément motif, résultat et achèvement selon aucun mapping implicite vers Terminée.

|Statut|Description|
|---|---|
|Terminée|Toutes les Exercices ont été terminées normalement et `SESSION_END` a été achevée.|
|Partielle|La séance est arrivée à son terme, mais au moins un exercice chronométré a été interrompue avant la fin de sa durée.|
|Interrompue|La séance a été arrêtée avant la fin de son exécution.|

Le statut est déterminé automatiquement lors de la fin de la séance.

## 6.5 Consultation de l'historique

L'utilisateur peut consulter son historique depuis l'écran **Suivi**.

Les séances exécutées sont présentées sous forme de liste chronologique.

Pour les Exécutions enregistrées, l'utilisateur peut :

- rechercher une Exécution ;
- modifier l’ordre chronologique d’affichage.

Dans le MVP, les cartes du Suivi ont deux lignes, sans déploiement : nature, titre et statut ; puis durée réelle, catégorie et Ressenti lorsqu’il existe. Elles n’affichent ni heure, ni zones corporelles, ni étiquettes. Le détail d’Exécution demeure enregistré dans l’instantané et les résultats ; sa présentation déployée est hors MVP .

## 6.6 Recherche

La recherche est effectuée sur :

- le nom de la Séance ;
- les Étiquettes de Séance ;
- les Catégories et Zones corporelles des Exercices selon le contexte de recherche.

Les résultats sont mis à jour au fur et à mesure de la saisie.

## 6.7 Filtres

Les filtres avancés du Suivi ne font pas partie du MVP. Ils sont reportés à une version ultérieure.

## 6.8 Tri

Le Suivi permet d’inverser l’ordre chronologique des Exécutions :

- plus récent au plus ancien ;
- plus ancien au plus récent.

Par défaut, les Exécutions sont triées de la plus récente à la plus ancienne. Les autres critères de tri sont reportés à une version ultérieure.

## 6.9 Déploiement du détail

Chaque Exécution peut être déployée individuellement dans le MVP afin d’afficher son détail directement dans la carte.

Aucun bouton **Déployer tout / Replier tout** n'est affiché ; le déploiement est géré carte par carte.

## 6.10 Conservation des historiques

Les historiques sont conservés indépendamment :

- des modifications apportées à une séance ;
- de la suppression d'une routine ;
- de la suppression d'une séance.

Une exécution enregistrée n'est jamais modifiée automatiquement.

## 6.11 Principes de conception

Le suivi repose sur les principes suivants :

- chaque exécution constitue un enregistrement indépendant ;
- chaque historique est construit à partir d'un instantané immuable ;
- les historiques ne sont jamais modifiés par les évolutions ultérieures des séances ;
- le suivi privilégie une consultation rapide grâce à des cartes à deux lignes, sans déploiement  ; `Vue d’ensemble`, `Filtrer` et `Trier` restent visibles mais désactivés ;
- les données affichées correspondent toujours à l'état exact de la séance au moment de son exécution.

# Champs et comportements des fonctionnalités

## Catalogue de séances

### Champs affichés

| Élément affiché | Type | Visible | Valeur / comportement | Action |
| --- | --- | --- | --- | --- |
| Bouton Ajouter (+) | Bouton | Toujours | Visible | Créer une Séance |
| Champ Recherche | Champ texte | Toujours | Recherche instantanée sur le nom | Filtrer |
| Filtre `Toutes` | Filtre | Toujours | Affiche toutes les Séances actives, planifiées ou non ; exclut les archivées | Filtrer |
| Filtre `Planifiées` | Filtre | Toujours | Séances ayant au moins une Routine | Filtrer |
| Filtre `Non planifiées` | Filtre | Toujours | Séances actives ne possédant aucune Routine | Filtrer |
| Filtre `Archivées` | Filtre | Toujours | Séances archivées uniquement | Filtrer |
| Carte Séance | Carte | 1 par Séance | Condensée ou déployée | Zone principale : ouvrir la Séance en modification |
| Chevron | Bouton | Toujours | Droite si replié, bas si déployé | Déployer / Replier uniquement |
| Nom de la Séance | Texte | Toujours | Nom enregistré | Aucune action spécifique distincte de la zone principale |
| Métadonnées Étiquette/Catégorie | Texte | Selon données disponibles | `Étiquette · Catégorie`, une seule ligne tronquée si nécessaire | Aucune |
| Nombre d’Exercices / durée | Texte | Toujours | Nombre d’Exercices et durée synthétique des Exercices calculés ; Compte à rebours initial et Fin de séance exclus | Aucune |
| Circuit | Conteneur unique ; nature tours/séries, compte1..99 défaut1. Chiffre → ± ; pastille d’unité → choix de nature ; œil permanent → grille des volumes. Total exact/≈/≥ calculé sur les passages réels, hors préparation/fin de Séance. Géométrie à aligner ensuite dans Figma/DSF. |
| Dernière Exécution | Texte | Si disponible | Date relative | Aucune |
| Prochaine occurrence | Texte | Si planifiée | Date / heure relative | Aucune |
| Liste des Exercices | Liste | Carte déployée | Ordre de la Séance | Aucune |
| Résumé d’Exercice | Texte | Carte déployée | À droite : `durée/reps · xN` en uniforme ; en variable volumes séparés par points médians, unité finale, maximum trois valeurs selon place puis ellipse | Aucune |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Chargement | Les Séances sont affichées dès l’ouverture de l’écran. |
| `Toutes` | Affiche toutes les Séances non archivées. |
| `Planifiées` | Affiche les Séances disposant d’au moins une Routine. |
| `Archivées` | Affiche uniquement les Séances archivées. |
| Zone principale de la carte | Ouvre directement la Séance en mode modification. |
| Métadonnées | Sous le nom, affiche `Étiquette · Catégorie` selon les données disponibles et le rendu Figma actif ; même convention dans les archives. |
| Chevron | Sert exclusivement au déploiement / repli de la carte. |
| Carte déployée | Affiche la liste des Exercices ; la zone `Démarrer` conserve son action propre. |
| Actions d’une Séance active | Un glissement gauche révèle `Planifier`, `Dupliquer` et `Archiver`. |
| Modifier | Toucher la zone principale ouvre la Composition préremplie. |
| Supprimer | Disponible uniquement après archivage. Dans `Archivées`, un glissement gauche déplace la carte et révèle `Supprimer` derrière, puis ouvre une confirmation. Les Exécutions historiques sont conservées. |
| Archivage | Retire la Séance de `Toutes` et la rend accessible via `Archivées`. Sans Routine associée, l’action est immédiate, sans confirmation, puis affiche un snackbar `Séance archivée` avec `Annuler`. Si au moins une Routine est associée, une confirmation explicite est demandée avant l’archivage et la suppression de ces Routines ; après confirmation, aucun snackbar d’annulation n’est affiché. |

## Composition d’une séance — création et modification

Le nom, l’Étiquette/couleur et la Composition sont réunis dans le même écran.

### Éléments affichés

| Élément | Comportement et règle |
| --- | --- |
| Nom de la séance | Champ obligatoire de 1 à 80 caractères. |
| Étiquette | Facultative ; sa couleur devient la couleur affichée de la Séance. La sélection/création s’effectue dans la modale Étiquettes intégrée à la Composition. |
| Compte à rebours initial | Élément structurel ; roulette minutes/secondes intégrée ; valeur initiale 10 s. |
| Circuit | Conteneur unique ; nature tours/séries, compte1..99 défaut1. Chiffre → ± ; pastille d’unité → choix de nature ; œil permanent → grille des volumes. Total exact/≈/≥ calculé sur les passages réels, hors préparation/fin de Séance. Géométrie à aligner ensuite dans Figma/DSF. |
| Exercices | D-238 retire les informations de pause/récupération du corps de la carte, en distinguant contenu conditionnel et trait de démarcation . La donnée `postActivityRecoverySeconds` appartient toujours à l’occurrence et accompagne déplacement, duplication et suppression. Le corps principal de la carte affiche le nom, la Catégorie et les Zones corporelles ; toucher ouvre la modification. |
| Fin de séance | Élément structurel ; roulette minutes/secondes intégrée ; valeur initiale 5 s. |
| Résumé | `N exercice(s) · durée des Exercices`, placé dans l’en-tête du conteneur Circuit immédiatement sous `Nombre de tours`. Le nombre porte sur les Exercices seulement ; la durée de Séance intègre les durées intrinsèques des Exercices ainsi que leurs récupérations après exercice. Le Compte à rebours initial et la Fin de séance en sont toujours exclus. À l'état vide, affiche exactement `0 exercice · 0 min`, au singulier — exception locale à cet écran . |
| Ajouter un exercice | Un seul bouton secondaire `+ Ajouter un exercice`, placé en haut. |
| Continuer | Désactivé lorsque le nom est vide ou qu’aucun Exercice valide n’est présent ; valide et enregistre la Séance avec son Étiquette éventuelle. |

Le Cycle reste présent dans le modèle avec une répétition toujours égale à 1, mais il n’est jamais affiché ni modifiable dans le MVP. La condition métier d’exécutabilité demeure la présence d’au moins un Exercice valide.

Le Compte à rebours initial et la Fin de séance conservent chacun leur propre valeur confirmée et leur propre brouillon. L’ouverture copie la dernière valeur confirmée dans le brouillon ; le défilement ne modifie ni le jalon concerné ni la synthèse intégrée au Circuit. Annuler abandonne le brouillon. Confirmer enregistre exactement les minutes et secondes centrées, puis actualise seulement le jalon structurel concerné. La synthèse sous `Nombre de tours` reste inchangée, car elle exclut ces deux éléments structurels hors Circuit. Les secondes couvrent `00` à `59` avec un pas de `1`.

Dans la variante d’actions glissées (`2028:11808`), la liste conserve l’origine verticale canonique `y = 92` sous l’en-tête fixe. La carte ou le bloc suit le glissement et révèle progressivement `Dupliquer` et `Supprimer` placés derrière. Selon D-208, la ligne `Récupération {durée}` est systématique pour toute occurrence, y compris à `0 s`; le groupe d’actions couvre donc le bloc complet occurrence + ligne de récupération. Les anciennes géométries distinguant un bloc avec/sans récupération sont historiques sur cet axe jusqu’au réalignement Figma. `Dupliquer` conserve les rayons définis par Figma/DSF et un espace visuel à son bord gauche laisse apparaître le fond du conteneur Circuit conformément à D-176.

Dans la variante d’appui long (`3518:4576`), l’occurrence et sa ligne `Récupération {durée}` constituent un seul bloc fonctionnel déplacé ensemble. Les dimensions historiques liées à une récupération conditionnelle sont supersédées sur cet axe par D-208 et doivent être requalifiées après réalignement Figma. L’état soulevé reste transitoire : il ne modifie ni `postActivityRecoverySeconds` ni les autres données avant la dépose.

Retour pendant une nouvelle création ouvre le dialogue centré `Abandonner la création ?`. `Annuler` conserve les données ; `Confirmer`, action destructive rouge, les supprime. Pour une Séance existante, Retour ne supprime jamais la Séance.

## Étiquettes de la séance

L’Étiquette est gérée directement dans la Composition via une modale basse.

### Éléments affichés

| Élément affiché | Type | Comportement |
| --- | --- | --- |
| Titre de modale | Texte | `Étiquettes` |
| Étiquettes proposées | Tags | Sélection de l’Étiquette de la Séance ; données démonstratives dans Figma |
| Nouvelle étiquette | Action | Ouvre la saisie `Nom de l’étiquette` |
| Nom de l’étiquette | Champ texte | Permet d’ajouter une nouvelle Étiquette via l’action d’envoi |
| Étiquette sélectionnée | Libellé dans la Composition | Affichée sous le nom de la Séance ; sa couleur devient celle de la Séance |

### Règles fonctionnelles

- Étiquette et couleur de Séance désignent la même classification visuelle : il n’existe pas de couleur indépendante de l’Étiquette ;
- l’ouverture de la modale ne modifie pas les autres données de Composition ;
- la création d’une nouvelle Étiquette se fait depuis la modale sans écran autonome ;
- les valeurs `Marathon`, `Hyrox`, `Vacances d'été` et `Challenge groupe` sont des exemples Figma et non un référentiel statique imposé ;
- les Catégories sont réservées aux Exercices et ne doivent plus être utilisées comme classification de la Séance.

## Exercice

### Eléments affichés

| Élément affiché           | Type              | Visible                            | Obligatoire | Valeur par défaut              | Contraintes                                    | Source   | Action         | Remarques                                                                                                                                                                                                                              |
| ------------------------- | ----------------- | ---------------------------------- | ----------- | ------------------------------ | ---------------------------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bouton Retour             | Bouton            | Toujours                           | Oui         | Visible                        | Confirmation si modifications non enregistrées | Système  | Retour         |                                                                                                                                                                                                                                        |
| Titre de l'écran          | Texte             | Toujours                           | Oui         | "Ajouter une activité"            | Texte fixe                                     | Statique | Aucune         | En modification : "Modifier une activité"                                                                                                                                                                                                 |
| Nom                       | Champ texte       | Toujours                           | Oui         | Vide                           | 1 à 80 caractères | Activité | Saisie | Premier élément du bandeau bleu ; même hauteur et alignement que `Nom de la séance` en Composition |
| Catégorie | Bouton / sélection | Toujours | Oui | Aucune | Exactement une Catégorie d’Exercice  | Activité | Ouvrir la modale de sélection | Icône Catégorie dans l’état non renseigné ; pilule avec le nom après sélection |
| Zones corporelles | Bouton / sélection | Toujours | Oui | Aucune | Au moins une Zone, sélection multiple  | Activité | Ouvrir la modale de sélection | Icône de zone corporelle selon la silhouette du Profil ; accès à la modale |
| Description de l’exercice | Champ texte multiligne | Sous les paramètres d’exécution | Non | Vide | 1000 caractères max | Activité | Déployer / saisir | La copie actuelle présente le champ multiligne dans le formulaire |
| Mode d'exécution          | Ligne et popover dans CE-UI-10 | Toujours ; déployée par défaut | Oui | Aucun mode | Durée / Répétitions ; À l’échec comme cible par Série | Activité | Déployer / sélectionner | Phrase vide et Terminer désactivé sans mode ; premier choix irréversible vers aucun mode  |
| Durée                     | Roulette min/sec  | Étape 1, mode Durée                | Oui         | 1 min                           | 5 s à 58 min 55 s                              | Activité | Sélection      | Deux colonnes : minutes et secondes |
| Nombre de répétitions     | Stepper intégré | Étape 1, mode Répétition      | Oui         | 1                              | Entier de 1 à 100                        | Activité | Sélection      | Commandes − / valeur / + permanentes dans la feuille CE-UI-10 |
| Pause après chaque série | Stepper permanent | Uniforme ou par ligne variable CE-UI-10 | Non | 0 s | 0..300 s ; tap1 et maintien DSF Bip | Exercice / Série | −/+ | Après chaque série, dernière comprise ; seule la dernière Pause est remplacée par R positive en occurrence |
| Nombre de Séries          | Stepper intégré | Mode déployé                  | Oui         | 1                              | Entier de 1 à 99                        | Activité | Sélection      | Commandes − / valeur / + permanentes dans la feuille CE-UI-10 ; valeur canonique persistée |
| Changement de côté | Contrôle | Mode déployé | Non | `Aucun` (`UNILATERAL`) | `UNILATERAL`, `D→G`, `G→D` | Activité | Déployer le contrôle sous sa ligne dans la feuille | Aucun réglage de côté n’est exposé au niveau Tour |
| Pause entre les côtés | Stepper permanent CE-UI-10 | Visible uniquement en `D→G/G→D` | Non | Copie de la valeur courante du Profil (initialement 10 s) | 0..5min ; tap1s, maintien DSF Bip | Activité | Sélection | `sideRecoverySeconds`; une phase entre les côtés selon l’Ordre des côtés ; aucune récupération post-activité dans l’éditeur |
| Bip de cadence | Stepper | Trois modes, réglage commun | Non | Aucun (0) | Entier0..10s | Série | ± dans le brouillon ;0 retire le bip | Propagation à toutes les Séries ; conservation au changement de mode |
| Durée totale | Valeur calculée | Durée/Répétitions | Non | Calculée | Formules chapitre 08, paramètres d’exercice | Calcul | Roulette en Durée uniforme seulement | Variable : lecture seule, — si incomplet ; Répétitions chiffrées avec bip≈ ; sans bip absente ; mélange calculable≥ ; tout échec absent |
| Médias                    | Zone média | Selon état | Non | Vide | Le média associé est présenté dans la gouttière permanente de 64 px de la carte Catalogue ; aucun déploiement de carte d’Exercice n’est accessible au MVP  ; l’import/ajout local est inclus au MVP dans PRE-3 , sans activation implicite de la caméra | Activité | Afficher / masquer | La Synthèse reste au-dessus en cas de chevauchement dans l’éditeur |
| Bouton Terminer           | Bouton            | Toujours                           | Oui         | Désactivé si activité invalide | Nom, une Catégorie, au moins une Zone et un mode obligatoires ; cible valide selon le mode  | Statique | Enregistrer | Remplace l’ancien libellé `Valider` puisqu’il n’existe plus de second écran |

**Règle transverse des roulettes numériques :** chaque changement effectif de valeur déclenche un retour haptique léger et bref, une seule fois par cran. Ce feedback est systématique et indépendant de la préférence `Vibrations` du Profil.

**Présentation courante des paramètres :** la carte présente une phrase unique ; sa zone entière ouvre la feuille, sans raccourci autonome par segment. Les steppers sont permanents dans la feuille CE-UI-10 ; les roulettes de durée se déploient sous leur ligne dans cette même feuille. Les anciennes rangées de cadres ne sont plus la référence de placement.

Dans CE-UI-10, durée par Série et Durée totale utilisent des roulettes sous leur ligne ; les pauses utilisent des steppers. Séries `1..99` et Répétitions `1..100` utilisent des steppers ; les réglages du Profil utilisent des steppers. Les bornes et pas suivent D-232, les valeurs initiales D-246. ✓ de la roulette applique la sélection au brouillon de la feuille ; ✕ de la roulette restaure la valeur à son ouverture. ✓ de la feuille applique l’ensemble au parent ; ✕ de la feuille annule toutes les modifications depuis son ouverture, y compris celles validées dans une roulette. Aucune persistance définitive à la validation de la roulette.
### Règles fonctionnelles

| Règle             | Description                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mode Durée        | Affiche le sélecteur de durée.                                                                                                                                                                                                                                                                                                                                                             |
| Mode Répétitions  | Affiche le champ "Nombre de répétitions".                                                                                                                                                                                                                                                                                                                                                  |
| Mode À l’échec    | N’affiche aucune cible chiffrée ; conserve l’ordre `Séries` → cadre informatif transparent bordé `à l’échec` → `Pause`. |
| Séries            | Un Exercice possède un nombre de Séries propre, de 1 à 99 . En bilatéral autonome, ce nombre s’entend par côté. Une Série exécute la cible du mode ; chaque Série porte sa Pause, y compris la dernière, selon les successions de Bip v2, Pause terminale comprise. |
| Changement de côté | Réglage propre `Aucun` (`UNILATERAL`), `D→G` (`RIGHT_LEFT`) ou `G→D` (`LEFT_RIGHT`). Aucun réglage de côté n’est exposé au niveau Tour. |
| Pause entre les côtés | Durée intrinsèque facultative `sideRecoverySeconds`, uniquement en bilatéral. Elle intervient selon l’Ordre des côtés. Sa valeur initiale lors de l’activation bilatérale provient du défaut global **Pause entre les côtés** du Profil (`10 s` dans le Figma de référence) et reste modifiable dans l’éditeur de l’Exercice. |
| Durée totale calculée | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. |
| Durée totale pilotée | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. |
| Sélection de ligne | Dans CE-UI-10, le contour désigne uniquement la ligne de roulette/segmenté activée. Aucun contour sur Séries/stepper. Si T(N)≠Tv, message sous Total ; sinon aucun message. |
| Modes non chronométrés | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. |
| Zones corporelles | Sélection multiple dans un référentiel utilisateur administrable. Le référentiel est initialisé avec dix valeurs par défaut ; l’utilisateur peut créer, renommer et supprimer une Zone corporelle. Une suppression retire la valeur des choix futurs après confirmation et conserve les affectations existantes ainsi que l’historique. |

### Gestion commune des référentiels de classification

Dans les modales de sélection `Étiquettes`, `Catégorie` et `Zones corporelles`, un appui court valide et ferme une sélection simple ; il sélectionne/désélectionne une option dans une sélection multiple . Un appui long ouvre une confirmation destructrice sans modifier la sélection. Toutes les valeurs, initiales comme ajoutées ensuite, sont supprimables. Après confirmation, la valeur est retirée des choix futurs mais ses affectations existantes sont conservées ; les Instantanés et Exécutions historiques restent inchangés. La modale de sélection reste ouverte et reflète immédiatement la suppression.
| Validation        | Impossible tant que les champs obligatoires ne sont pas renseignés.                                                                                                                                                                                                                                                                                                                        |
| Retour            | Si des modifications non enregistrées existent, une confirmation est demandée.                                                                                                                                                                                                                                                                                                             |
| Synthèse          | Cadre immuable, indépendant du déploiement des sections et placé en bas du contenu à `spacing/24` de l’action finale. Style `KODJO / Body` (`14/20`). La phrase commence par le nombre de Séries et ne répète pas le mode. Sans mode sélectionné, elle est vide. Elle suit les fragments conditionnels D-232, se régénère à chaque modification et exclut nom d’Exercice, Compte à rebours, Fin d’exercice et Récupération post-activité.
## Exécution d'une séance

### Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur / comportement | Source | Action | Remarques |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| Titre de la séance | Texte | Toujours | Oui | Nom de la séance | Séance | Aucune | En-tête |
| Nom de l’Exercice courant | Texte | Toujours | Oui | Exercice courant | Plan d’Exécution | Aucune | |
| Série | Texte | Exercice | Non | `x/y` | Plan d’Exécution | Aucune | Paramètre propre à l’Exercice |
| Temps de l’Exercice | Minuteur | Toujours | Oui | Compte à rebours si chronométrée ; chronomètre croissant si Répétition | Exécution | Aucune | |
| Cercle du minuteur | Indicateur | Toujours | Oui | Progression temporelle | Exécution | Aucune | Répétitions sans cadence/À l’échec : rotation minute ; cadence : progression temporelle, voir spécification Cadence |
| Série / Tour | Texte | Toujours | Oui | Série à gauche, Tour à droite ; aucun Cycle affiché | Plan d’Exécution | Aucune | |
| À suivre | Texte | Sauf dernier Exercice | Non | Nom + durée/reps de l’Exercice suivant | Plan d’Exécution | Aucune | |
| Réinitialiser | Bouton | Pendant Exécution | Oui | Actif | Statique | Ouvrir confirmation | Réinitialise l’Exercice courant |
| Pause | Bouton | Pendant Exécution | Oui | Actif | Statique | Suspendre | Suspend aussi le chrono croissant en Répétitions ou À l’échec |
| Suivant | Bouton | Pendant Exécution | Oui | Actif | Statique | Terminer la Série ou passer à la suite | Fin normale en Répétitions/À l’échec ; confirmation avant terme pour un Exercice chronométré |
| Temps total | Texte + barre | Toujours | Oui | Temps écoulé / estimé | Exécution | Aucune | |
| Bips / annonces | Icônes / états | Toujours | Oui | Selon Préférences | Préférences | Activer / désactiver | |

### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Ouverture | Ouvrir l’écran d’Exécution ne démarre pas automatiquement la premier Exercice. |
| Exercice chronométré | Compte à rebours. `Exercice suivant` avant zéro demande confirmation et enregistre l’Exercice comme `Partielle`. |
| Exercice en Répétitions ou À l’échec | Chronomètre croissant ; sans cadence/À l’échec : rotation et bip minute. Avec cadence : intervalles sans signal nominal final, progression temporelle des seules cibles chiffrées sans fin automatique ; Pause/Reprise sur intervalle complet. Suivant termine normalement dans les deux cas. |
| Réinitialisation | Demande confirmation et remet l’Exercice courant à son état initial sans revenir à un Exercice antérieur. |
| Pause / arrêt | `Pause` ouvre la modale permettant `Reprendre la séance` ou `Arrêter la séance`. Aucun bouton Arrêter direct n’est présent sur l’écran. |
| Présentation | Le nouveau layout regroupe chrono circulaire, côté courant, cible `Sur`, Série/Tour, progression segmentée et bloc `Temps écoulé / À suivre`. Le contenu d’Exécution utilise Roboto Condensed ; le titre supérieur de Séance et les dialogues utilisent Inter. |
| Navigation | L’utilisateur ne revient pas à un Exercice déjà exécutée. |
| Étapes | Aucun compteur d’« étapes » n’est affiché dans le MVP. |

### Sons et annonces

- bip pendant les trois dernières secondes d’un Exercice chronométré selon les règles audio ;
- annonce vocale du nom de l’Exercice au démarrage ;
- pour un Exercice en Répétitions sans cadence ou À l’échec, bip fixe à chaque minute écoulée dans le MVP.

## Synthèse de séance

### Eléments affichés

| Élément affiché       | Type             |  Visible | Obligatoire | Valeur par défaut                                    | Contraintes                 | Source      | Action         | Remarques                            |
| --------------------- | ---------------- | -------: | ----------: | ---------------------------------------------------- | --------------------------- | ----------- | -------------- | ------------------------------------ |
| Titre de la séance    | Texte            | Toujours |         Oui | Nom de la séance                                     | 1 à 80 caractères           | Séance      | Aucune         | En-tête fixe                         |
| Carte Statut          | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Icône de statut       | Icône            | Toujours |         Oui | ✓                                                    | Terminée, Partielle ou Interrompue     | Séance      | Aucune         | Couleur selon le statut              |
| Libellé du statut     | Texte            | Toujours |         Oui | Séance terminée                                      | Terminée, Partielle ou Interrompue     | Séance      | Aucune         |                                      |
| Date / heure de fin   | Texte            | Toujours |         Oui | Date courante                                        | Format local                | Séance      | Aucune         |                                      |
| Carte Votre séance    | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Durée réelle          | Durée            | Toujours |         Oui | Calculée                                             | Temps réellement exécuté    | Séance      | Aucune         |                                      |
| Nombre d'exercices    | Valeur           | Toujours |         Oui | Calculé                                              | X / Y                       | Séance      | Aucune         |                                      |
| Exercices partiellement réalisées | Texte | Si > 0 | Non | Masqué | `n exercice(s) partiellement réalisée(s)` | Séance | Aucune | Libellé UI ; le statut métier de l’Exercice reste `Partielle` |
| Question de ressenti  | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Obligatoire" | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Choix du ressenti     | Sélecteur        | Toujours |         Oui | Aucun sélectionné                                    | Une seule sélection         | Utilisateur | Sélection      | MVP : 3 niveaux                      |
| Titre Commentaire     | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Facultatif"  | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Champ Commentaire     | Texte multiligne | Toujours |         Non | Vide                                                 | **200 caractères max**      | Utilisateur | Saisie         | Environ 2 à 3 lignes                 |
| Bouton Enregistrer       | Bouton           | Toujours |         Oui | Désactivé tant que le ressenti n'est pas sélectionné | Une seule action            | Statique    | Aller au Suivi | Enregistre définitivement la séance  |
### Règles fonctionnelles
| Règle               | Description                                                                      |
| ------------------- | -------------------------------------------------------------------------------- |
| Durée affichée      | Toujours la durée réellement exécutée.                                           |
| Tours / Cycles      | Non affichés dans le MVP.                                                        |
| Exercices partiellement réalisées | Affichées uniquement si leur nombre est supérieur à zéro ; `Partielle` reste le terme métier. |                        |
| Ressenti            | Obligatoire dès lors que la Synthèse est présentée ; peut être absent après une interruption technique sans Synthèse.                                            |
| Commentaire         | Facultatif, **200 caractères maximum**.                                                                      |
| Validation          | Le bouton **Enregistrer** reste désactivé tant qu'aucun ressenti n'est sélectionné. |
| Navigation          | Appui sur **Enregistrer** → écran **Suivi**.                                        |
| Sauvegarde          | Le ressenti et le commentaire sont enregistrés avec la séance.                   |
| Séance interrompue  | Même écran, avec un statut et une icône adaptés.                                 |
## Profil

### Eléments affichés
| Élément affiché                     | Type            |  Visible | Obligatoire | Valeur par défaut          | Contraintes                     | Source      | Action               | Remarques                                            |
| ----------------------------------- | --------------- | -------: | ----------: | -------------------------- | ------------------------------- | ----------- | -------------------- | ---------------------------------------------------- |
| Titre de l'écran                    | Texte           | Toujours |         Oui | Profil                     | Texte fixe                      | Statique    | Aucune               |                                                      |
| Avatar                              | Icône           | Toujours |         Oui | Initiales de l'utilisateur | Image personnalisée en V2       | Profil      | Modifier le profil   |                                                      |
| Nom                                 | Texte           | Toujours |         Oui | Nom de l'utilisateur       | 1 à 80 caractères               | Profil      | Modifier le profil   |                                                      |
| Action `Modifier`                   | Bouton          | Toujours |         Oui | Visible                    | Photo et nom d’affichage         | Profil      | Ouvrir l'édition     | Active dans le MVP                                   |
| Sons                                | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Valeur par défaut des séances                        |
| Annonces vocales                    | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Utilise la voix système                              |
| Vibration                           | Interrupteur    | Toujours |         Oui | Activée                    | Booléen                         | Préférences | Activer / Désactiver | Vibrations fonctionnelles de séance uniquement       |
| Compte à rebours initial par défaut | Sélecteur durée | Toujours |         Oui | 10 s                       | 0 à 60 s, pas 1 s        | Préférences | Modifier             | Valeur utilisée à la création d'une séance    |
| Fin de séance par défaut            | Sélecteur durée | Toujours |         Oui | 5 s                        | 0 à 60 s, pas 1 s        | Préférences | Modifier             | 0 s = phase instantanée                       |
| Notifications                       | Interrupteur    | Toujours |         Oui | Non autorisées             | Booléen                         | Préférences | Activer / Désactiver | Demande système lors de la première activation d’un rappel |
### Règles fonctionnelles

| Règle                    | Description                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Sauvegarde               | Toute modification est enregistrée immédiatement.                                                                                        |
| Paramètres par défaut    | Les valeurs définies ici sont utilisées lors de la création d'une nouvelle séance.                                                       |
| Surcharge                | Une séance peut remplacer les valeurs par défaut (compte à rebours initial et fin de séance).                                            |
| Sons                     | Désactive tous les bips de l'application.                                                                                                |
| Annonces vocales         | Désactive toutes les annonces vocales sans modifier les bips.                                                                            |
| Vibration                | Active ou désactive les vibrations fonctionnelles de séance. Ce réglage n'affecte pas le feedback haptique des roulettes numériques.     |
| Compte à rebours initial | Définit la durée proposée par défaut lors de la création d'une nouvelle séance. Une valeur de 0 s rend la phase instantanée sans la supprimer de la structure. |
| Fin de séance            | Définit la durée proposée par défaut lors de la création d'une nouvelle séance. Une valeur de 0 s rend la phase instantanée sans la supprimer de la structure.            |
| Langue du MVP            | Le MVP est disponible uniquement en français. Tous les textes utilisateur, pluriels, variables, formats locaux, notifications et libellés d’accessibilité utilisent des clés de traduction centralisées afin de permettre l’ajout d’autres langues sans modifier les composants. |
| Voix                     | La voix utilisée est toujours celle du système d'exploitation. Aucun choix de voix n'est proposé dans le MVP. La langue de synthèse vocale pourra être sélectionnable lors d'une évolution multilingue. |
| Volume                   | Le volume des annonces dépend exclusivement du réglage du téléphone.                                                                     |
| Notifications            | Active ou désactive les rappels locaux des Séances planifiées, sous réserve de l’autorisation accordée par le système d’exploitation. |
| Profil                   | Les informations personnelles n'ont aucune incidence sur les séances existantes.                                                         |
| Retour                   | Quitter l'écran ne demande aucune confirmation, les modifications étant enregistrées automatiquement.                                    |
## Calendrier

### Règles liées à la couleur

- Les occurrences affichées dans le calendrier utilisent la couleur de la séance comme repère visuel.
- Une routine ne possède pas de couleur propre.
- La modification de la couleur de la Séance est immédiatement reflétée par toutes les Routines existantes qui lui sont associées, celles-ci héritant de la couleur de la Séance.

## Planifier une Séance ou un Exercice

Les sélecteurs ouverts `Heure` et `Rappel personnalisé` conservent la géométrie propre à leur référence Figma, d’environ `310 × 201`, adaptée à la largeur disponible. Chaque colonne numérique possède son propre cadre de sélection gris `56 × 34`, rayon `17`, limité aux chiffres. Le nombre de semaines utilise désormais un stepper intégré (frame 1992:7537), sans roulette dédiée. Annuler, à gauche, abandonne le brouillon ; Confirmer, à droite, applique les valeurs centrées au formulaire. Les actions utilisent respectivement un cercle gris neutre et un cercle bleu primaire de `38 × 38`, une icône `24 × 24` et une cible tactile de `48 × 48`. Le cadre de mise en page `48 × 53` conserve les marges autour du cercle sans modifier la cible tactile.

### Règles liées à la couleur

- À contenu unique, la Routine reprend le repère visuel de sa source ; la représentation agrégée de plusieurs contenus reste à préciser : couleur d’Étiquette pour une Séance ; couleur de Catégorie pour un Exercice lorsqu’elle existe.
- Le champ couleur n’est pas affiché dans l’écran de planification.
- La couleur n’est jamais modifiée depuis la planification ; elle provient de la source.

## Suivi - Vue d'ensemble

### Règles liées à la couleur

- Les futurs indicateurs et graphiques peuvent utiliser la couleur enregistrée avec chaque exécution afin de faciliter l’identification des séances.

## Suivi - Séances

### Élément affiché lié à la couleur

| Élément affiché | Type | Visible | Obligatoire | Valeur par défaut | Contraintes | Source | Action | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Couleur de la séance exécutée | Indicateur visuel | Toujours | Oui | Couleur de l’instantané | Une couleur parmi 12 | Instantané de séance | Aucune | Ne dépend pas de la couleur actuelle de la séance |

### Règle fonctionnelle liée à la couleur

La couleur affichée dans le Suivi est celle enregistrée dans l’instantané de l’exécution. Une modification ultérieure de la couleur de la séance ne modifie pas les exécutions passées.

## Dialogues de confirmation

| Action                                           | Confirmation      | Boutons                 | Conséquence                                                            |
| ------------------------------------------------ | ----------------- | ----------------------- | ---------------------------------------------------------------------- |
| Supprimer une séance archivée                    | Oui               | Annuler / Confirmer | Dialogue centré ; disponible uniquement via le filtre `Archivées` ; conserve les Exécutions |
| Arrêter une séance en cours                      | Oui               | Reprendre la séance / Arrêter la séance | Dialogue centré ; enregistre une exécution interrompue |
| Archiver une séance                              | Conditionnelle : oui si ≥ 1 Routine associée ; sinon non | Sans Routine : snackbar `Séance archivée` + `Annuler` ; avec Routine(s) : dialogue de confirmation, puis aucun snackbar d’annulation | Archive la Séance ; si des Routines sont associées, elles sont supprimées après confirmation |
| Restaurer une séance                             | Non               | Snackbar + Annuler      | Replace la séance dans le catalogue                                    |
| Supprimer une valeur de référentiel (`Étiquette`, `Catégorie`, `Zone corporelle`) | Oui | Annuler / Supprimer | Appui long sur l’option ; toutes les valeurs sont supprimables. Retire la valeur des choix futurs, conserve les affectations existantes et les Instantanés/Exécutions historiques |
| Réinitialiser les préférences                    | Oui               | Annuler / Réinitialiser | Restaure les préférences par défaut                                    |
| Supprimer l'historique                           | Oui               | Annuler / Supprimer     | Supprime toutes les exécutions enregistrées                            |
| Quitter la création d'une séance non enregistrée | Oui               | Annuler / Confirmer | Dialogue centré ; `Confirmer` abandonne la création |

Tous les dialogues de décision utilisent `Overlay / Decision Dialog` (`2590:2961`) : largeur `354`, rayon `18`, centrage dans l’écran et voile bloquant `overlayScrim` (`color/overlay/scrim`, #1F2129 à 34 %), identique à celui de toutes les feuilles et modales. Le dernier paragraphe est séparé de la première ligne d’actions par `spacing/16`. Avec deux choix, les boutons `147 × 48` sont alignés ; avec trois choix, `Seulement cette occurrence` et `Toutes les occurrences à venir` sont les deux actions destructives de la première ligne, puis `Annuler` occupe la seconde ligne en pleine largeur `306 × 48`. Les textes sont centrés horizontalement et verticalement.

## Consultation média pendant l’Exécution — MVP

### Face Information et Face Média

La zone d’information d’Exécution possède une face alternative Média lorsque l’Exercice courant comporte au moins un média. Un bouton dédié, toujours disponible sur les deux faces, déclenche un retournement 3D horizontal ; le retour utilise le sens inverse. Aucun média implique l’absence du bouton.

### Galerie

La Face Média restitue la galerie dans son ordre fonctionnel. Un swipe horizontal change d’un seul média. La galerie est bornée, non circulaire et matérialise ses bornes par un effet de résistance. Des indicateurs de pagination discrets donnent la position. Le média utilise un cadrage de type « contenir » : ratio conservé, contenu complet, marges admises.

### Vidéo et audio

Une vidéo apparaît à l’arrêt et exige Lecture. Le moteur d’Exécution ne se met jamais en pause du seul fait de la consultation. Le son vidéo est actif par défaut ; pendant une annonce vocale KODJO, son volume est abaissé puis restauré. Retourner vers Information ou swiper hors de la vidéo la met en pause.

### Mémoire de séance

La dernière face et le média courant sont conservés par Exercice dans la séance courante. Une nouvelle séance repart sur Information. Revenir plus tard à un Exercice restaure la face et le média mais ne redémarre jamais automatiquement une vidéo.

### Plein écran

Un appui sur le média ouvre le plein écran. L’orientation suit l’appareil. Les contrôles vidéo sont Lecture/Pause, progression et Fermer. Un cadre flottant distinct du lecteur affiche le nom, le côté applicable, le chrono, Série/Tour et les commandes essentielles d’Exécution. Le moteur continue à progresser.

### Fin et erreur

La fin de l’Exercice ferme son affichage média et poursuit le Plan d’Exécution. Un média illisible produit un état d’erreur discret, sans interrompre l’Exécution ni la navigation vers les autres médias.

Référence normative détaillée : `../CONCEPTION-EXECUTION-MEDIA.md`.

### Récupérations — conception détaillée D-208

L’éditeur d’Exercice porte `sideRecoverySeconds` uniquement pour un Exercice bilatéral. Le passage à `Aucun` rend ce paramètre sans objet. Lors du passage de `Aucun` à une direction bilatérale, la valeur initiale provient du défaut global **Pause entre les côtés** du Profil (`10 s` dans le Figma de référence) et reste modifiable dans l’éditeur de l’Exercice.

La Composition porte `postActivityRecoverySeconds` sur chaque occurrence. Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement . D-238 retire seulement les informations de pause/récupération dans le corps des cartes. Dans un Circuit répété, cette même valeur est exécutée à chaque Tour. Une Exécution directe ne possède jamais de récupération post-exercice.

## Règles communes — D-209 à D-217

La Composition présente un **Circuit** interne à la Séance et un nombre de **Tours**. Le mot parcours désigne une planification multi-contenus sans objet autonome . Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul.

L’éditeur d’Exercice exige exactement une Catégorie et au moins une Zone corporelle. Dans la phrase de synthèse, `Durée totale` est omise par redondance uniquement en Durée avec une seule Série, sans changement de côté et sans pause. Les valeurs Profil utilisées à la création deviennent propres à l’Exercice après initialisation.

Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement . Placement multiple unifié selon D-304. Si les deux sont actifs : `Exercice → Récupération après exercice → Point d’arrêt → suite`. Les positions immédiatement après le Compte à rebours initial et immédiatement avant la Fin de séance ne sont jamais proposées. Les positions avant/après Circuit et entre Exercices du Circuit sont autorisées ; un Point d’arrêt interne est répété à chaque Tour.

Dans la face Média compacte, le bouton Lecture central est affiché avant lecture et disparaît pendant la lecture vidéo. Le retour à Information met la vidéo en pause.

**Interaction Point d’arrêt .** L’action dédiée d’ajout affiche les positions autorisées dans la Composition ; l’utilisateur choisit la position et peut quitter ce mode via le snackbar d’annulation. Un appui long sur un Point d’arrêt existant ouvre une bulle de retrait ; un appui ailleurs referme la bulle sans modification. Le mode de placement met en évidence les positions autorisées sur la ligne structurelle permanente ; il ne crée pas une ligne temporaire. La récupération reste réglable sur cette ligne hors du mode de placement.

## Conventions communes d’interface

D-221 retire la recherche globale et toute recherche locale des Catalogues du MVP. D-222 distingue sélection simple auto-validée et sélection multiple avec validation explicite. D-223 rend le titre de Planifier contextuel. Les règles de rendu communes sont celles de D-224 à D-230 : fonds/zones de contexte, navigation, halo et actions circulaires, steppers/badges, listes/modales, roulettes et composants spécialisés. Elles ne modifient le métier que lorsqu’un comportement est explicitement décrit.

### 8.x Générateur de phrase de synthèse v13

Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

### Contrôles et bornes v13

Séries : stepper `1..99`. Répétitions : stepper `1..100`. Durée par Série : roulette `5 s..58 min 55 s`. Pause après chaque série et Pause entre les côtés : stepper dans la feuille Exercice, `0..5 min`, tap1s et maintien accéléré1/5/10 selon DSF Bip  ; stepper pour les réglages du Profil. La Pause après chaque série est initialisée à `0 s` dans la feuille ; la Pause entre les côtés copie la valeur courante du Profil. Au changement de mode, les paramètres communs et les dernières valeurs spécifiques de chaque mode sont conservés pendant l’édition. Après la première sélection, le mode ne peut plus revenir à l’état vide. `Terminer` est désactivé avant cette première sélection.

## Présentation et interactions des cartes — 30 septembre 2026

Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture . Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.

Appuis — D-237 : la spécification figée v2 du 29 septembre impose une dilatation au contact, un retour au relâchement et une action immédiate au relâchement, sans attendre le ressort. Annulation hors cible : retour sans action ; nouvel appui : reprise depuis l’état courant. Stepper selon DSF Bip (maintien≈500ms, répétition150ms, paliers1/5/10) et réduction des animations par opacité seule. Paramètres et preuves dans le complément DSF.

### Implantation des contrôles — réconciliation Figma du 30 septembre

L’ordre et la présentation visuelle courants sont décrits dans le chapitre06 : carte récapitulative ouvrant CE-UI-10, Compte à rebours/Fin, Description, Média, Terminer. Les anciennes rangées de cadres et sections repliables ne constituent plus une prescription de layout. Les accès Catégorie et Zones corporelles sont représentés par leurs icônes dans les états non renseignés. Les valeurs métier, bornes, formules et conditions d’enregistrement restent inchangées.

> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20–%20Contrats%20d’écran.md#6-clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248/v13 (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.

### Saisie des paramètres — D-246

La référence active est [Paramètres en modale v13](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice), contrats CE-T03-04/CE-UI-10. Elle intègre Séries variables, Ordre des côtés, pauses terminales et récupération de l’occurrence. Feuille transactionnelle : ✕ annule, ✓ applique au parent, Terminer persiste. Les calculs et comportements sont normatifs dans les spécifications ; Figma définit le layout seulement. Les anciens textes v11 sont historiques.

## Cadence — comportements communs complémentaires

La [Règles détaillées](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#resultats-temporels) fait autorité sur les signaux, Pause/Reprise, reset, temps réel, arrière-plan et seuil de sécurité ; paramètres v13 pour pauses/côtés/Récupération, phrase v1 pour le texte. Elle s’applique à chaque occurrence/côté/Tour. Bip0 signifie Aucun ; aucune valeur positive implicite. Suivant avant la fin nominale est une fin normale, pas une preuve de répétitions réalisées ni une fin partielle automatique. Le passage anticipé d’un Exercice chronométré conserve ses règles distinctes.

### Avertissement d’enchaînement sans pause 

Lorsque deux Exercices consécutifs n’ont ni pause effective de transition ni Récupération positive après son occurrence, la Composition affiche l’avertissement non bloquant : « Attention, les exercices vont s’enchaîner sans pause. » Il concerne l’enchaînement entre Exercices ; aucun avertissement distinct entre Séries n’est ajouté. Il n’empêche ni l’enregistrement ni l’exécution et ne modifie aucun paramètre.

## Pauses et symboles

Aucune récupération automatique à la création d’une occurrence. Une récupération explicite est proposée au défaut Profil (30 s initialement) lors de son ajout ; elle reste solidaire de son occurrence. postActivityRecoverySeconds est sa projection de calcul, 0 en l’absence de récupération . Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement . Sélection multiple, ouverture immédiate de la durée, sous-brouillon atomique et retrait par bulle selon la spécification consolidée. Les frontières du Point d’arrêt ne deviennent pas celles de toutes les récupérations.

## Composition — comportement cible du12/10

En-tête : chiffre interactif (± au toucher), pastille tours/séries (choix de nature), œil sur la ligne du titre (volumes), total exact/≈/≥. Conserver shell et hiérarchie ; captures et mesures DSF seront alignées après ce lot.

Carte : régime identiques → forme N×valeur ; variables → valeurs séparées par points médians avec unité finale, au plus trois selon place puis ellipse, même si valeurs égales. Douze séries : aperçu tronqué ; durées composées longues : moins de valeurs. Aucun marqueur d’incomplétude sur la carte ; validation des cibles dans la feuille conservée. La grille est détaillée dans les nouveaux contrats du chapitre13.
