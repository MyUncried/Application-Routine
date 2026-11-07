# KODJO — Complément parcours de création et Formats — 5 novembre 2026

**Nature :** document différentiel. Il complète la version finale « KODJO-Mise-a-jour-ecrans-formats-consolidee-2026-11-04_finale.md » et la référence active `docs/KODJO-Formats-entrainement-2026-11-02.md` publiée au commit `560f87bd`. Il remplace leurs prescriptions contraires dans les seuls périmètres explicités ci-dessous ; les autres règles restent applicables.
**Décisions :** Hermann, 4 et 5 novembre 2026.
**Destinataire :** ChatGPT, pour intégration à la documentation. Ce document ne constitue pas une preuve de développement.

## 1. Règle

Une seule **modale de création** est ouverte depuis deux endroits :
- le bouton **Créer** du **Catalogue des séances** ;
- l'option **Créer un exercice** du menu Créer de la **Composition**.

Elle propose :
- **Exercice libre** : la fiche de création d'un exercice vierge, mouvement puis paramètres d'exécution (parcours existant « Ajouter un exercice ») ;
- **les Formats**, dans la grille à deux colonnes existante : chaque Format ouvre son questionnaire, puis son récapitulatif.

## 2. Parcours

| Départ | Choix | Suite | Arrivée |
|---|---|---|---|
| Catalogue des séances, Créer | Exercice libre | Fiche de création : mouvement, puis paramètres | Composition d'une **nouvelle** Séance, contenant cet Exercice |
| Catalogue des séances, Créer | Un Format | Questionnaire, récapitulatif, « Enregistrer dans la séance » | Composition d'une **nouvelle** Séance, contenant la structure du Format |
| Composition, Créer un exercice | Exercice libre | Fiche de création | Retour à la Composition, Exercice ajouté |
| Composition, Créer un exercice | Un Format | Questionnaire, récapitulatif | Retour à la Composition, structure ajoutée |

- **Nouvelle Séance depuis le catalogue** : un nouveau **brouillon** de Séance est ouvert à l’arrivée dans la Composition, avec son contenu déjà en place. La sauvegarde définitive n’intervient qu’à la validation de la Composition ; son nom se saisit dans la Composition (le parcours Format n'affiche plus le nom de la Séance). Quitter la Composition sans enregistrer déclenche la confirmation d'abandon existante.
- **Fermer** la modale de création, le questionnaire (croix) ou la fiche de création sans valider : retour au point de départ, aucune Séance enregistrée créée ni modifiée. Le point de départ du parcours est conservé pour revenir au Catalogue ou à la Composition concernée, sans altérer son état antérieur.
- La modale de création remplace, depuis le catalogue, l'ouverture directe d'une Composition vide.

## 3. Menu Créer de la Composition

Le menu passe de cinq à **trois** options, dans cet ordre :
1. **Créer un exercice** : ouvre la modale de création (§1) ;
2. **Créer un circuit** : comportement actuel de « Ajouter un circuit » (choix de l'emplacement) ;
3. **Créer un cycle** : comportement actuel de « Ajouter un cycle ».

« Utiliser des mouvements existants » et « Utiliser un format d'entraînement » sont retirés du menu : la sélection d'un mouvement existant se fait dans la fiche de création (suggestions pendant la saisie du nom, ou mode catalogue), et les Formats sont dans la modale de création. Les autres règles du menu sont conservées : bouton + transformé en Annuler, voile, axe vertical (qui s'arrête à Créer un cycle), fermeture.

## 4. Écrans Figma de référence

- **Modale de création** (« P-Formats — Choix du format, deux colonnes ») : titre « Créer un exercice » ; carte pleine largeur **Exercice libre** (« un mouvement, puis ses paramètres ») au-dessus de la grille ; titre de section « Formats d'entraînement » ; la fenêtre remonte pour garder la marge basse.
- **Menu Créer** (« Composition séance — Créer (menu) ») : trois options, Créer un exercice, Créer un circuit, Créer un cycle ; axe vertical raccourci jusqu'à Créer un cycle.

## 5. Documentation à mettre à jour

| Document | Mise à jour |
|---|---|
| ch06 Écrans et navigation | Catalogue des séances : Créer ouvre la modale de création ; Composition : menu Créer à trois options (remplace la liste à cinq options) |
| ch08 Conception détaillée | Modale de création commune ; arrivée dans une nouvelle Composition depuis le catalogue |
| ch13 Contrats d'écran | Modale de création (Exercice libre et Formats) ; menu Créer |
| Référence Formats, §7 | Point d'entrée des Formats : la modale de création, depuis le catalogue et depuis la Composition |
| `docs/PRODUCT.md` | Parcours de création d'une Séance |

## 6. Retrait du bouton œil et de la fenêtre des volumes du Circuit

**Règle.** Le bouton œil « Voir les volumes » de la Composition (zone de contexte, à gauche de Ajouter un arrêt et du +) et la fenêtre en lecture seule qu'il ouvre (« Volumes du circuit », contrat CE-CIR-03) sont **retirés**. Ajouter un arrêt et + gardent leur place, alignés à droite.

**Présentation conservée.** Les volumes restent consultables :
- sur les cartes d'Exercice de la Composition (ligne des volumes, séries variables séparées par un point médian) ;
- dans la Séance déployée du Catalogue des séances (noms à gauche, volumes à droite) ;
- dans les tableaux du récapitulatif, pour un Circuit issu d'un modèle (« Modifier le format »).

La règle « présent dans les deux natures » et la grille des volumes (S1…Sn, colonne d'unité) ne s'appliquent plus à la Composition. La grille des volumes reste une règle de présentation des volumes là où elle est utilisée par ailleurs.

**Écrans Figma :** bouton œil retiré des zones de contexte de Composition du prototype (écrans de Composition et fonds des modales de Format) ; écrans « P-Composition séance — Circuit — Volumes (de séries) » et « Composition séance — Circuit — Volumes (de tours) » supprimés.

## 7. Documentation à mettre à jour (retrait de l'œil)

| Document | Mise à jour |
|---|---|
| ch06 Écrans et navigation | Retirer le bouton œil (« Voir les volumes ») et la section « vue d'ensemble des volumes » ; marquer les passages comme remplacés |
| ch10 Règles métier | Grille des volumes : retirer son usage dans la Composition |
| ch13 Contrats d'écran | CE-CIR-03 retiré ; CE-T03-08 et CE-UI-10 sans œil |
| DSF Circuits du 12/10 | Mention de remplacement (document daté, non réécrit) |

## 8. Incrément négatif de l’objectif AMRAP

**Règle.** L’Incrément par tour AMRAP peut être négatif, en Répétitions ou en Durée, pour représenter une échelle descendante. Il s’affiche avec son signe (« − 1 rép. », « − 5 s »). Le Death by conserve un incrément positif, au minimum +1 dans l’unité choisie (§13). L’EMOM n’a aucun champ d’incrément de charge ni d’objectif : ses valeurs sont saisies par série (§14).

**Borne des objectifs calculés.** Lorsqu’une progression AMRAP descendante atteindrait zéro ou une valeur négative, l’objectif calculé est borné à 1 répétition ou 1 s. La boucle ne se termine pas à cette borne : 5, 3, 1, 1, 1… La borne s’applique aux objectifs de cette progression, sans modifier les règles générales des cibles nulles intentionnelles ni rendre actif un Exercice sauté. Aucun incrément n’est appliqué aux membres pour lesquels il est inactif (Buy-in ou À l’échec).

**Saisie du signe.** Sur le champ Incrément par tour, la barre du clavier natif comporte **± | Précédent | Suivant | Fermer**. ± inverse le signe ; la saisie respecte l’unité et les bornes du champ. Aucun clavier personnalisé n’est introduit.

**Écran Figma :** « AMRAP — Récapitulatif, saisie d’un incrément négatif au clavier ».

**Documentation :** référence Formats (AMRAP), ch10 (bornes des incréments), ch13 (barre du clavier).

## 9. Progression et For time : charge décidée par mouvement

**Règle.** En Progression et en For time, la charge se décide **mouvement par mouvement**, dans le tableau du récapitulatif. Une même Progression ou un même For time associe souvent un mouvement chargé et un mouvement au poids du corps : la décision se prend par mouvement, une fois l'interrupteur « Avec charge » activé.

- **À la création**, chaque mouvement n’a que sa ligne d’objectif tant qu’aucune charge n’est activée pour lui. À la réouverture, son état effectif et ses valeurs sont repris (§16).
- **Un bouton sur chaque ligne**, dans la colonne Unité, en bleu KODJO, qui bascule selon l'état :
  - **« + kg »** (mouvement sans charge, sous « rép. ») : ajoute la ligne de charge de ce mouvement (cases « — ») et ouvre le clavier sur la première série (ou le premier tour) ;
  - **« − kg »** (mouvement avec charge, en face de la ligne de charge) : retire la ligne. Dans le même brouillon non sauvegardé, les valeurs saisies sont conservées sans s’appliquer et reviennent si l’on touche à nouveau « + kg » (§16).
- **Ligne de charge** : sous l'objectif, valeurs avec leur unité (« 10 kg »), modifiables au clavier (Précédent, Suivant, Fermer ; pavé décimal avec virgule).
- **Vider toutes les cases** retire la ligne à la fermeture du clavier, et « + kg » revient ; il n’y a rien à restaurer.
- **Présentation** : sur la ligne de charge, les valeurs s'affichent entre parenthèses avec leur unité (« (12 kg) », case vide « (—) »), et le bouton aussi (« (+ kg) », « (− kg) »), pour distinguer la charge de l'objectif. C'est un affichage seulement : la valeur reste un nombre décimal (12,5 kg possible). Même présentation en Progression, For time et Superset.
- **Données** : « + kg » met la Charge de l'Exercice sur « Avec » ; une ligne vidée la remet sur « Sans ».
- **Réouverture** (« Modifier le format ») : chaque mouvement affiche son état effectif ; l’interrupteur global suit la règle du §16.

**Interrupteur du questionnaire.** Progression et For time comportent « Avec charge », désactivé par défaut, selon le §16. Son activation rend disponibles les commandes locales ; la charge reste facultative pour chaque mouvement.

**Écrans Figma :** questionnaires Progression et For time avec interrupteur ; récapitulatifs et états clavier avec « (+ kg) » sur les mouvements sans charge et « (− kg) » sur les mouvements chargés ; « Progression — Récapitulatif, ajout d’une charge (+ kg) ».

**Documentation :** référence Formats (Progression §9.2–9.3, For time §11), ch13 (tableaux des récapitulatifs).

## 10. Composition : appui sur la photo d'un Exercice

**Règle.** Dans la Composition, **l'appui sur la carte** d'un Exercice ouvre ses Paramètres d'exécution (inchangé) ; **l'appui sur la photo** ouvre la **fiche de l'exercice**, en modale et **en lecture seule** :
- contenu de la fiche du mouvement : média, nom, catégorie, zones corporelles, niveau, description et phases du mouvement si elles existent ;
- section **« Dans cette séance »** : la synthèse des paramètres de cet Exercice : réutiliser la phrase générée pour les paramètres qu’elle couvre, et présenter la Récupération propre à l’Exercice sans modifier silencieusement les règles de cette phrase ;
- **aucun bouton Modifier** : la croix ramène à la Composition ; pour modifier, l'utilisateur touche la carte.

**Pourquoi.** Un geste, un rôle : la photo pour voir, la carte pour modifier. Un seul chemin de modification, donc un seul chemin de retour. Les phases restent lisibles au moment où l'on relit la séance (important en rééducation), avec ce qui est prévu dans cette séance. Même geste et même fiche que dans le questionnaire et le récapitulatif des Formats (§3 bis du document consolidé), complétés du contexte de la Séance.

**Écran Figma :** « Composition séance — Fiche de l'exercice (modale) ».

**Documentation :** ch06 (Composition : appui sur la photo), ch13 (contrat de la fiche en lecture seule).

## 11. Superset

**Deux mouvements à la création.** Un superset est une paire : le questionnaire n'accepte que deux mouvements. « + Ajouter » se désactive dès que deux mouvements sont choisis ; « Valider les paramètres » ne s'active qu'avec deux. Après l'enregistrement, le Circuit est un Circuit standard : un troisième Exercice peut y être ajouté depuis la Composition.

**Réouverture** (« Modifier le format ») : le questionnaire et le récapitulatif affichent les Exercices actuels du Circuit, y compris un troisième ajouté depuis la Composition ; la présence de plus de deux Exercices ne bloque pas « Valider les paramètres » ni « Enregistrer les modifications », sous réserve que tous les paramètres requis soient renseignés et cohérents ; « + Ajouter » reste désactivé ; un mouvement peut être retiré tant qu'il en reste au moins deux.

**Questionnaire.** La ligne « Répétitions par série » est retirée : l'objectif dépend du mouvement. Le questionnaire garde la structure : Circuit (nombre de tours, **3 tours par défaut**), Récupération après le tour, Durée totale.

**Récapitulatif.** Le tableau reprend celui de la Progression et du For time (§6 quater du document consolidé, §9 ci-dessus) : colonne **Unité** (mode Répétitions ou Durée, choisi au clavier), puis une colonne par tour (**Tour 1, Tour 2, Tour 3** ; 4 colonnes visibles au plus, défilement au-delà).
- **Aucune progression par défaut** : ~~chaque tour est prérempli avec la valeur du premier~~ **(remplacé le 06/11/2026 : chaque colonne se saisit indépendamment ; les cases non saisies restent à renseigner)** ; l'utilisateur modifie les tours qui évoluent (charge montante 40 / 45 / 50 kg, répétitions dégressives 12 / 10 / 8).
- **Charge par tour**, par mouvement : bouton « + kg » / « − kg » sur chaque ligne (§9). Présentation des charges : voir §9.
- **Présentation** : trois cadres séparés (Circuit ; tableau ; Récupération après le tour et Durée totale), §12.
- **À l'échec** n'est pas dans le tableau : c'est une condition d'arrêt, pas une unité ; elle se règle dans la modale de l'Exercice.

**Organisation.** Le Superset créé est un Circuit standard à **séries alternées**, trois tours par défaut : A1, B1, récupération, A2, B2… Chaque membre porte autant de séries effectives que de tours. Un tour ne rejoue pas la collection entière des séries de chaque membre. « Récupération après le tour » est la Récupération du **dernier** Exercice du Circuit ; aucun repos supplémentaire n’est ajouté entre les membres par cette préconfiguration. Les règles existantes de Pause terminale et de substitution par la Récupération restent applicables, sans double comptage.

**Troisième membre ajouté depuis la Composition.** Aucun transfert automatique : chaque Exercice garde sa Récupération. À la réouverture, « Récupération après le tour » affiche celle du nouveau dernier Exercice (« à renseigner » s’il n’en a pas) et l’enregistrement l’écrit sur lui ; les membres intermédiaires gardent la leur.

**Écrans Figma :** « Superset — Questionnaire » (ligne retirée, 3 tours) ; « Superset — Récapitulatif » (tableau par tour : Squats sautés 12 / 12 / 12 sans charge, Fentes avant 10 / 10 / 10 à 12 kg ; « + Ajouter » désactivé avec deux mouvements ; déroulé à jour). Le libellé « Récupération après la paire » des écrans devient « Récupération après le tour ».

## 12. Tableaux des récapitulatifs dans leur propre cadre

**Règle.** Dans les récapitulatifs Progression, For time, Superset, Death by et EMOM, le tableau des mouvements est **isolé dans son propre cadre**, entre le cadre des paramètres qui le précèdent (nombre de séries, de tours, intervalle…) et celui des paramètres qui le suivent (pause, récupération, durée totale, condition d'arrêt, exécution). **Position.** Pour Tabata, 30/30, Renforcement, À l'échec (sous « Nombre de séries ») et For time (sous « Nombre de tours »), le tableau des mouvements est placé **juste sous la ligne du nombre de séries ou de tours**, qui forme son propre cadre ; les autres paramètres (durée totale, exécution, récupération…) suivent dans un troisième cadre. En Death by, le tableau n'a pas de fond blanc propre : il prend la couleur de son cadre. Ses valeurs portent leur unité, à côté de la valeur (« 1 rép. », « + 1 rép. », « 10 s », « + 10 s »). Les cadres sont séparés de 8 px ; quand la place manque au-dessus du déroulé, l'écart descend à 4 px et le contenu de la modale défile si nécessaire.

**Écrans Figma :** « Progression — Récapitulatif » et ses écrans clavier et d'ajout de charge, « For time — Récapitulatif », « Superset — Récapitulatif », « Death by — Récapitulatif, dans chaque intervalle », « … en alternance », « … à la suite ».

## 13. Death by : Répétitions ou Durée

**Règle.** Chaque Exercice Death by peut être en Répétitions ou en Durée, sans restriction des mouvements sélectionnables : le Mode appartient à l’Exercice. Départ et Incrément portent cette unité (« 10 s », « + 10 s ») ; l’incrément vaut au minimum +1 répétition ou +1 s. Le changement d’unité ne convertit pas les valeurs et laisse les champs incompatibles à renseigner.

**Travail prévu d’un rang.** Pour un Exercice en Durée, il inclut les deux côtés et la pause entre côtés applicable. Dans un intervalle commun, c’est la somme des travaux connus des membres de la fenêtre ; à intervalles locaux, celui du membre. Les membres en Répétitions n’ont pas de durée déduite.

**À l’enregistrement.** Une progression en Durée finit toujours par atteindre l’intervalle : c’est la fin normale du défi, sans avertissement. Seul le cas où le **premier rang** atteint ou dépasse déjà l’intervalle déclenche un **avertissement non bloquant** : « Le premier intervalle ne peut pas être tenu : le défi s’arrêtera avant de commencer. » L’enregistrement reste possible. Le contrôle EMOM du §14 reste bloquant.

**À l’exécution.** Un rang dont le travail prévu connu atteint ou dépasse l’intervalle n’est pas lancé : le défi s’arrête à la fin du rang précédent. Même seuil que l’EMOM (atteint ou dépasse), appliqué à l’exécution plutôt qu’à la saisie. Sinon, la fin reste celle du Death by : la première fenêtre non tenue. Aucune fenêtre n’est prolongée.

**Résultat.** Rangs acquis = derniers rangs entièrement tenus. Fin par limite : mention « limite de l’intervalle atteinte », aucun échec ni tentative fictifs. Fin par fenêtre non tenue : pour un membre en Durée, la durée tenue est renseignée à la clôture, jamais déduite de l’objectif prescrit. Unités et côtés du résultat suivent la prescription.

**Documentation :** référence Formats §12, règles métier, données/résultats, capacités et conception du moteur. Le libellé « Nombre de répétitions de départ » devient « Objectif de départ » ; la tagline et les textes doivent couvrir les deux modes et les intervalles configurables, sans imposer ici une nouvelle formulation graphique.

**Écrans Figma :** récapitulatifs Death by avec un exemple mixte Répétitions/Durée. L’avertissement du premier rang n’a pas d’écran dédié : il suit la présentation des messages du formulaire.

## 14. EMOM : tableau par série, de type Progression

**Règle.** Le récapitulatif EMOM reprend le tableau de la Progression (§9, §12) : colonne **Unité** (« rép. » ou « durée », choisie au clavier), puis une colonne par série (**S1, S2, S3** ; 4 colonnes visibles au plus, défilement horizontal au-delà, nom et unité fixes). Le tableau est isolé dans son propre cadre.
- **Progression de l'EMOM** : ~~chaque série est préremplie avec la valeur de S1 (objectif fixe par défaut)~~ **(remplacé le 06/11/2026 : chaque colonne se saisit indépendamment ; les cases non saisies restent à renseigner)** ; l'utilisateur modifie les séries qui évoluent (« 3, 4, 5… soulevés de terre », « planche 20 s, 25 s, 30 s… »). Il n'y a pas de champ d'incrément.
- **Charge** : l'interrupteur « Avec charge » du questionnaire EMOM est conservé (il signale consciemment qu'une charge est à renseigner) ; activé, il fait apparaître le bouton « (+ kg) » / « (− kg) » sur chaque ligne ; la charge s'affiche en ligne sous l'objectif, une valeur par série (« (12 kg) »), comme en Progression.
- **Contrôle d’intervalle — bloquant.** Vérifier chaque série/fenêtre : travail prévu en Durée, deux côtés et pause entre côtés applicable compris, comparé à son intervalle. Dans chaque intervalle commun, sommer les travaux connus de tous les membres pour le rang concerné. Si le total atteint ou dépasse l’intervalle, afficher le message, les cadres rouges et bloquer la validation. Les membres en Répétitions ne reçoivent aucune estimation inventée. Ce contrôle s’applique aussi après modification depuis la Composition.

**Données.** Les objectifs et charges de chaque série sont les valeurs effectives de l’Exercice ; aucune formule d’incrément de charge EMOM n’est persistée ni réappliquée. Les diminutions de charge se saisissent directement dans les séries. Aucune mention de charge calculée nulle/négative ne s’applique.

**EMOM et Death by.** Les deux Formats partagent le principe de fenêtres temporelles, mais conservent leurs contrats distincts : compte fini et objectifs prescrits par série pour l’EMOM ; progression par rang, compte ouvert et fin au premier échec pour le Death by. Leur proximité ne justifie pas leur fusion.

**Écrans Figma :** « EMOM — Récapitulatif, dans chaque intervalle » (charge activée : Squats sautés 10 / 10 / 10 rép. « (+ kg) » ; Fentes avant 30 s × 3 à « (12 kg) » « (− kg) ») ; « … en alternance » et « … à la suite » (sans charge). L'écran « EMOM — Récapitulatif, saisie d'un incrément de charge négatif au clavier » est supprimé.

## 15. Tabata et 30/30 : charge par mouvement, sans progression

**Progression : aucune.** Tabata et 30/30 sont des protocoles de temps fixe (20 / 10 s, 30 / 30 s) : on progresse par le nombre de répétitions ou la vitesse dans la fenêtre, pas par la durée d'une série à l'autre. Le récapitulatif n'a pas de tableau par série ; les séries variables restent accessibles dans la modale de l'Exercice pour un cas particulier.

**Charge : par mouvement** (interrupteur au questionnaire, §16). Ces formats se font souvent au poids du corps, mais aussi au kettlebell ou au wall ball. Une seule valeur de charge par mouvement (charge commune de l'Exercice, identique d'une série à l'autre), saisie au clavier (pavé décimal avec virgule) ; « (+ kg) » sur un mouvement sans charge, « (12 kg) » puis « (− kg) » pour la retirer (restauration temporaire dans le même brouillon selon §16). Deux présentations :
- **Un seul mouvement** : une ligne **Charge** dans le cadre des paramètres, sous Durée totale.
- **Plusieurs mouvements** : un tableau par mouvement dans son propre cadre (§12), sous les paramètres. L'Objectif est le travail par série de chaque mouvement (20 s en Tabata, 30 s en 30/30 ; modifiable au clavier, Répétitions ou Durée) ; la ligne commune « Travail par série » est retirée des paramètres. **30/30** : trois colonnes de valeurs, **Objectif | Pause | Charge** ; la ligne commune « Pause » est aussi retirée. **Tabata** : **Objectif | Pause | Charge** également (« 20 s », « 10 s ») ; la ligne commune « Pause » est retirée des paramètres. La colonne Charge n'apparaît que si « Avec charge » est activé (§16).

**Écrans Figma :** « 30/30 — Récapitulatif », « P-Tabata — Récapitulatif, à la suite » et « … en alternance » : tableau Mouvement | Objectif | Pause | Charge, cette dernière colonne étant conditionnelle. Les lignes communes Travail par série et Pause sont retirées au profit des valeurs par mouvement. Le cas à un mouvement suit la règle décrite ci-dessus, même sans frame dédiée.

## 16. Interrupteur « Avec charge » dans tous les questionnaires où la charge s'applique

**Règle.** Chaque questionnaire d'un Format où une charge peut s'appliquer comporte l'interrupteur **« Avec charge »**, désactivé par défaut : Progression, For time, Superset, Tabata, 30/30, Renforcement, À l'échec, AMRAP, EMOM, Death by.
- **Activé** : les options de charge apparaissent dans le tableau du récapitulatif : bouton « (+ kg) » / « (− kg) » par mouvement et ligne de charge (Progression, For time, Superset, EMOM), ou colonne Charge (AMRAP, Tabata, 30/30, Renforcement, À l'échec, Death by). La décision reste prise **mouvement par mouvement**.
- **Renforcement et À l'échec** (structure de séries identiques, comme le 30/30) : un seul mouvement → ligne Charge sous Durée totale ; plusieurs → tableau **Mouvement | Objectif | Pause | Charge** dans son propre cadre (« 15 rép. » / « à l'échec », « 1 min » / « 2 min »), lignes communes « Répétitions par série » ou « Cible par série » et « Pause » retirées des paramètres. Une charge fixe par mouvement ; une charge qui évolue d'une série à l'autre relève de la Progression.
- **Death by** : colonne **Charge** ajoutée au tableau Mouvement | Départ | Incrément, une charge fixe par mouvement (par exemple Death by thrusters à 20 kg).
- **Désactivé** : aucune option de charge n'apparaît ; le tableau reste plus lisible pour une séance au poids du corps.
- **Réouverture** : l'interrupteur reprend l'état effectif (activé si au moins un Exercice a sa Charge sur « Avec », §6 sexies.7 du document consolidé). Dans le même brouillon non sauvegardé, désactiver puis réactiver l’interrupteur retrouve les mouvements précédemment chargés et leurs valeurs ; ceux qui étaient sans charge le restent. La même restauration temporaire s’applique aux boutons locaux. Une première activation globale rend les commandes disponibles sans charger automatiquement tous les mouvements.

**Portée de la restauration.** Elle suit le fonctionnement des Paramètres d’exécution dans la même session d’édition, avant sauvegarde. Elle ne crée aucune nouvelle obligation de mémorisation après sauvegarde : une ouverture ultérieure lit l’état effectif enregistré selon les règles de persistance existantes. Vider volontairement une valeur n’équivaut pas à la masquer : les valeurs effacées ne sont pas restaurées automatiquement.

**Écrans Figma :** interrupteur ajouté, représenté activé pour correspondre aux récapitulatifs, sur « P-Tabata — Questionnaire », « 30/30 — Questionnaire », « Superset — Questionnaire », « For time — Questionnaire », « Progression — Questionnaire », « Renforcement — Questionnaire », « À l'échec — Questionnaire », « Death by — Questionnaire » ; « Renforcement — Récapitulatif » et « À l'échec — Récapitulatif » : tableau Mouvement | Objectif | Pause | Charge ; récapitulatifs Death by : colonne Charge ; « 30/30 — Récapitulatif » : tableau Mouvement | Objectif | Pause | Charge, lignes « Travail par série » et « Pause » retirées des paramètres.

## 17. Alimentation des Exercices par les tableaux (complément au §4.4 du document consolidé)

Les unités proposées restent limitées par le modèle et le contexte de l’Exercice ; le tableau ci-dessous ne généralise pas Durée à l’AMRAP autonome ni à un autre cas qui l’exclut. Le principe du §4.4 est inchangé : chaque ligne d'un tableau correspond à un Exercice, et chaque case écrit dans un champ standard de cet Exercice, sans second stockage. Correspondances à jour :

| Format et tableau | Case | Champ de l'Exercice alimenté |
|---|---|---|
| Tous les tableaux | Colonne Unité, ou unité choisie au clavier | **Mode d'exécution** = Répétitions / Durée |
| Tous les tableaux | « (+ kg) » / « (− kg) » | **Charge** = Avec / Sans (restauration dans le brouillon seulement, §16) |
| Tous les questionnaires | Interrupteur « Avec charge » désactivé | **Charge** = Sans pour tous les Exercices (restauration dans le brouillon seulement, §16) |
| Progression — S1…Sn | Objectif et charge de la série k | **Séries variables** : cible et charge de la série k |
| For time — Tour 1…n | Objectif et charge du tour k | **Séries variables** : cible et charge de la série k ; nombre de séries = nombre de tours |
| Superset — Tour 1…n | Objectif et charge du tour k | **Séries variables** : cible et charge de la série k ; nombre de séries = nombre de tours (Circuit standard à séries alternées : A1, B1, récupération, A2, B2…) ; « Récupération après le tour » = **Récupération** du dernier Exercice |
| EMOM — S1…Sn | Objectif et charge de la série k | **Séries variables** : cible et charge de la série k ; nombre de séries = Nombre de séries de l'EMOM |
| Tabata, 30/30 — Objectif \| Pause \| Charge | Objectif | **Objectif de durée** (ou Nombre de répétitions) de chaque série, **séries identiques** |
| | Pause | **Pause** après chaque série |
| | Charge | **Charge** commune de l'Exercice |
| Renforcement — Objectif \| Pause \| Charge | Objectif | **Nombre de répétitions** (ou Objectif de durée) de chaque série, séries identiques |
| | Pause, Charge | **Pause** après chaque série ; **Charge** commune |
| À l'échec — Objectif \| Pause \| Charge | Objectif | **Condition d'arrêt** = À l'échec, dans le Mode choisi ; séries identiques |
| | Pause, Charge | **Pause** après chaque série ; **Charge** commune |
| AMRAP — Objectif \| Par tour \| Charge \| Max | Objectif, Par tour, Max | Inchangé (§4.4) |
| | Charge | **Charge** commune |
| Death by — Départ \| Incrément \| Charge | Départ | **Objectif de départ** (répétitions ou durée, §13) |
| | Incrément | **Incrément par intervalle** (au minimum + 1 dans l'unité) |
| | Charge | **Charge** commune |
| Un seul mouvement (Tabata, 30/30, Renforcement, À l'échec) | Ligne Charge sous Durée totale | **Charge** commune |

**Préremplissage et réouverture.** ~~La copie de la valeur de S1 concerne l’EMOM et le Superset décrits ici.~~ **(remplacé le 06/11/2026 : chaque colonne se saisit indépendamment ; les cases non saisies restent à renseigner)** Elle ne remplace pas les valeurs initiales propres aux autres modèles : la Progression conserve notamment 10 / 12 / 14 ; une échelle For time explicitement choisie n’est pas uniformisée. Les cases initiales non définies restent à renseigner, sans prendre les chiffres illustratifs Figma comme défauts. L’ajout ultérieur de séries/tours conserve les règles existantes de nouvelles cases à compléter. À la réouverture (« Modifier le format »), les cases affichent les valeurs effectives de chaque série, sans réinitialisation ni changement silencieux Identiques/Variables. Un réglage commun dont les valeurs diffèrent entre Exercices affiche « variable » (§6 sexies.7 du document consolidé).

## 18. Développement et vérifications pour la revue

1. Modale de création commune depuis le Catalogue des séances et la Composition ; nouveau brouillon à l’arrivée dans la Composition, sauvegarde définitive seulement à sa validation ; fermeture vers le point de départ sans mutation.
2. Menu Créer à trois options ; retrait de l’œil et de CE-CIR-03, maintien de l’accès au détail des volumes : une carte tronquée ne suffit pas, les valeurs doivent rester consultables dans les paramètres de l’Exercice, y compris pour un Circuit manuel.
3. Interrupteur Avec charge dans les dix questionnaires du §16, Sans par défaut ; activation globale donnant accès aux commandes locales, charges facultatives ; restauration temporaire des états et valeurs dans le même brouillon avant sauvegarde.
4. Boutons locaux (+ kg)/(− kg), charges entre parenthèses ; vidage volontaire distinct du masquage ; tableaux, modales et réouverture utilisant les mêmes paramètres effectifs.
5. AMRAP : incrément signé, bouton ±, objectif calculé borné à 1 répétition/1 s sans fin automatique de la boucle. Aucun incrément EMOM d’objectif ou de charge.
6. EMOM : tableau Unité et séries, objectifs/charges effectifs par série ; validation bloquante de chaque fenêtre, somme des membres dans une fenêtre commune et bilatéralité prises en compte.
7. Death by : Répétitions/Durée, départ et incrément dans l’unité ; avertissement non bloquant seulement si le premier rang ne tient pas ; à l’exécution, arrêt avant un rang dont le travail prévu atteint ou dépasse l’intervalle, résultat « limite de l’intervalle atteinte » ; résultats réels seulement. Le blocage EMOM n’est pas appliqué au Death by.
8. Superset : deux mouvements à la création, trois tours alternés par défaut ; tableau par tour ; « Récupération après le tour » sur le dernier Exercice, sans double comptage ; réouverture conservant les membres actuels et les paramètres, validation toujours soumise à complétude/cohérence.
9. Tabata, 30/30, Renforcement et À l’échec : paramètres et charges par mouvement selon §§15–17, tableaux Objectif/Pause/Charge ; valeurs identiques par série à la création de ces modèles, sans supprimer les possibilités d’édition existantes.
10. Tableaux dans leur propre cadre ; unités, clavier et ordre de navigation cohérents avec le format courant. Les chiffres de démonstration ne définissent pas de nouvelles valeurs initiales.
11. Appui sur la photo en Composition : fiche en lecture seule avec contexte « Dans cette séance » ; appui sur la carte : paramètres d’exécution.
12. Propager les changements au registre, glossaire/modèle, périmètre, règles, données, API, architecture, contrats, index et plan PRE-9 selon leurs dépendances réelles. Actualiser la conception du moteur pour les prescriptions variables EMOM, l’AMRAP dégressif et le Death by en Durée, sans lancer son développement dans cette revue. Ne pas modifier les archives OpenSpec.

**Scénarios de contrôle :** annuler depuis chacun des deux points d’entrée ; Progression 10/12/14 conservée ; échelle For time conservée ; AMRAP 5/3/1/1 ; charges Avec→Sans→Avec dans le même brouillon ; sauvegarde puis nouvelle ouverture de l’état effectif ; Superset rouvert avec trois membres et une cible manquante ; EMOM commun 30 s + 30 s pour 60 s bloqué ; EMOM bilatéral dépassant sa fenêtre bloqué ; Death by dont le premier rang dépasse l’intervalle, averti mais enregistrable ; Death by 10 s + 10 s par minute arrêté avant le rang 6, résultat 5 rangs et « limite de l’intervalle atteinte » ; Superset rouvert avec trois membres, récupération lue et écrite sur le troisième.
