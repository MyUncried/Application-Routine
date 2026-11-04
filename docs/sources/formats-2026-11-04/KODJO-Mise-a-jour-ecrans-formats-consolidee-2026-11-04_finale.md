# KODJO — Mise à jour des écrans Formats — version consolidée du 4 novembre 2026

**Portée :** spécification consolidée des modifications. L’état de leur intégration au dépôt doit être vérifié sur le `main` courant ; ce document ne constitue pas un constat de développement ni de publication.

**Destinataire :** ChatGPT.
1. Mettre à jour la documentation (référence Formats, ch06, ch07, ch08, ch09, ch10, ch13, PRODUCT), selon le §7.
2. Préparer les corrections du développement en cours, sur les Formats PRE-9 (C.2 à C.6).

**Source :** Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP », rangée des Formats. Les écrans cités sont les références visuelles. Les comportements et arbitrages fonctionnels sont décrits dans le présent document ; ils ne sont pas tous démontrables par une capture.

---

## 1. Questionnaires et récapitulatifs présentés en modale

**Règle.** Le parcours Format (questionnaire, puis récapitulatif) est appelé depuis la Composition de la Séance : c'est une **modale**, pas un écran.

| Élément | Règle |
|---|---|
| Apparition | Par le bas, jusqu'à juste sous le titre de l'écran de Composition (y = 95 sur 874) |
| Forme | Pleine largeur, coins hauts arrondis (24 px), coins bas carrés, sans poignée |
| Fond | La Composition de la Séance reste visible sous le voile modal, comme sous le menu Créer |
| En-tête de la modale | Questionnaire : **croix** (fermer, retour à la Composition) et **nom du Format** en titre. Récapitulatif : **bouton Retour** (retour au questionnaire, réponses conservées) et nom du Format. En-tête transparent, sans trait de séparation, posé sur la zone de contexte. |
| Composant d'en-tête | « DSF / Overlays / En-tête de modale », variante standard **Sélection** (croix et titre, sans bouton de validation) ; titre Inter Semi Bold 18, centré. Sur les récapitulatifs, la croix est remplacée par `icon/retour`. Seuls remplacements locaux : fond transparent et trait masqué, pour se poser sur la zone de contexte. La fiche du mouvement garde fond blanc et trait. |
| Zone de contexte | Part du haut de la modale ; hauteur d'origine (109 px) ; couleur et motif du Format |
| Tagline | 14 px (au lieu de 13), interligne 20, **centrée**, sur deux lignes, juste sous le titre |
| Déroulé et bouton | Calés en bas, positions inchangées (bouton à 802 px du haut de l'écran ; déroulé 25 px au-dessus) |
| Clavier | Au premier plan, au-dessus de la modale, pendant la saisie d'un mouvement |
| Défilement | Si le contenu dépasse, le contenu de la modale défile ; le bouton reste en bas |

**Écrans :** les 13 « … — Questionnaire » et les 24 « … — Récapitulatif » de la rangée des Formats (états de saisie compris) (Tabata, EMOM, AMRAP, Death by, For time, 30/30, Renforcement, Superset, Progression, À l'échec).

**Tagline Death by**, raccourcie pour tenir sur deux lignes : « Une répétition de plus à chaque minute. On continue tant qu'on termine dans la minute. »

## 2. Suppression du nom de la Séance dans le parcours Format

**Règle.** Le questionnaire et le récapitulatif **n'affichent plus le nom de la Séance**, ni son champ. Ils sont appelés depuis la Séance elle-même : le nom s'y règle, dans la Composition. Le bloc « Titre de séance » (nom, couleur, durée, actions) est retiré de ces écrans.

## 2 bis. Bouton du questionnaire : « Valider les paramètres »

**Règle.** Le questionnaire ne mène pas directement à la Séance : il ouvre le récapitulatif. Son bouton d'action s'appelle donc **« Valider les paramètres »**, au lieu de « Enregistrer dans la séance ». **« Enregistrer dans la séance »** reste le libellé du bouton du **récapitulatif**, qui ajoute la structure au brouillon de Composition.

**Écrans :** les 13 « … — Questionnaire » de la rangée des Formats, dont les deux saisies d'un mouvement et « AMRAP — Questionnaire, plusieurs blocs », qui portait jusqu'ici « Valider ».

## 3. Ouverture du catalogue depuis un questionnaire : « mode catalogue »

**Règle.** « Ouvrir le mode catalogue » **ne quitte pas la modale du questionnaire**, et n'ouvre pas de modale séparée.
- La zone de recherche se **détache** : elle reste affichée en permanence, avec le texte déjà saisi et des résultats déjà filtrés.
- Une **croix d'effacement** apparaît dans le champ dès qu'un texte est saisi : pastille grise de 20 px, zone tactile de 44 × 44.
- Sur la ligne de recherche, à droite : **Filtrer**, **Trier** et **Replier / déplier les piles**. Ce dernier contrôle est nouveau, avec le même gabarit (34 × 34) et le même état inactif que Trier.
- Les résultats occupent **toute la hauteur jusqu'en bas de la modale**, directement sous la ligne de recherche, **sans compteur** « n familles · n mouvements » (réservé au Catalogue des mouvements). Ils utilisent la petite carte « Carte — Mouvement sélectionné » (§5), avec le filet des niveaux d'une même famille.
- Le bouton **« Ajouter »** en bas ajoute la sélection et referme le mode catalogue.
- Le lien de section devient **« Fermer le mode catalogue »**, qui revient à la saisie sans rien ajouter.
- Buy-in AMRAP : la section s'intitule « Mouvement du buy-in », et la sélection est unique.

**Libellés.** « Ouvrir le mode catalogue » remplace « Ouvrir le catalogue ». La règle d'ajout d'un mouvement (référence Formats, §7.1) est à mettre à jour en conséquence.

**Écrans :** « P-Tabata — Questionnaire, saisie d'un mouvement », « AMRAP — Questionnaire, saisie d'un mouvement », « P-Tabata — Choix des mouvements », « AMRAP — Choix des mouvements », « AMRAP — Choix du buy-in ».

## 3 bis. Fiche du mouvement en modale depuis le questionnaire ou le récapitulatif

**Règle.** Dans le questionnaire ou le récapitulatif d'un Format, **appuyer sur la photo** d'une carte de mouvement ouvre la **fiche du mouvement en modale**, par-dessus la modale du Format :
- elle apparaît **par le bas**, pleine largeur, coins hauts arrondis (24 px), sur un second voile ;
- son en-tête porte la croix et le titre « Fiche du mouvement » ;
- elle présente la fiche habituelle : nom, catégorie, zones corporelles, niveau, média, description et phases du mouvement ;
- **en consultation seulement**, sans bouton d'action : la croix la ferme et revient au questionnaire ou au récapitulatif, dans le même état ;
- l'appui sur le reste de la carte garde son comportement existant.

**Écran :** « P-Tabata — Récapitulatif, fiche du mouvement (modale) », qui reprend le contenu de « Mouvement — Fiche ».

## 4. EMOM et Death by

### 4.1 EMOM : mode Répétitions ou Durée
**Règle inchangée.** En EMOM, le Mode reste **Répétitions par défaut** et **Durée reste possible**, pour chaque Exercice : un EMOM peut mélanger les deux (« 10 burpees puis 20 s de gainage dans chaque minute ») ou n'avoir qu'un Exercice en Durée (gainage de 40 s chaque minute). Aucune modification des modales EMOM ; la référence Formats (§10) n'est pas à changer sur ce point.

### 4.2 EMOM : tableau des objectifs par mouvement
**Règle.** Sur les récapitulatifs EMOM à plusieurs mouvements (dans chaque intervalle, en alternance, à la suite), un tableau **« Mouvement | Objectif »** est placé dans les paramètres, juste sous « Nombre de séries ». **La nature de l'objectif se définit par mouvement** : chaque case Objectif affiche la valeur avec son unité (« 10 rép. », « 30 s ») et ouvre la **saisie au clavier** (§4.5), qui règle l'unité puis la valeur. Les durées s'affichent au format minutes-secondes de l'application (« 30 s », « 1 min 30 »), jamais « 0:30 ».

Présentation identique au tableau des phases : fond blanc arrondi inséré dans le cadre gris, en-têtes gris, séparateurs fins. Les champs Objectif ont tous la même largeur, contenu centré, alignés à droite sur le bord des autres valeurs.

Quand « Avec charge » est activé, le tableau ajoute les colonnes Charge et + / série (§6 quater bis).

**La ligne « Repos · jusqu'à la cadence » est retirée.** Le repos n'est pas un paramètre (c'est le temps restant dans la fenêtre), et le libellé prêtait à confusion avec la Cadence.

### 4.3 Death by : tableau départ et incrément par mouvement
**Règle.** Sur les récapitulatifs Death by à plusieurs mouvements (dans chaque intervalle, en alternance, à la suite), un tableau **« Mouvement | Départ | Incrément »** est placé juste sous « Intervalle », par exemple Squats sautés 1 / + 1 et Fentes avant 2 / + 2.

Il **remplace** les lignes communes « Nombre de répétitions » et « Incrément par intervalle ». L'incrément reste au minimum de + 1. Le Death by à un seul mouvement garde ses lignes.

### 4.3 bis AMRAP : tableau « Mouvement | Objectif | Par tour | (Charge) | Max »
**Règle.** Les Exercices d'un Circuit AMRAP peuvent être en Répétitions **ou en Durée** (référence Formats, §3), **buy-in compris** ; seul l'AMRAP à un seul Exercice reste en Répétitions. Le tableau du récapitulatif devient :
- **Objectif** (au lieu de « Rép. ») : la valeur avec son unité, en bleu gras KODJO (« 10 rép. », « 50 rép. » pour le buy-in, « 30 s » pour le gainage). Un appui ouvre la **saisie au clavier** (§4.5). La case est grisée et ne s'ouvre pas quand Max est actif.
- **Par tour** : l'incrément, seulement si « Volume croissant » est activé, dans l'unité de l'objectif (« + 2 », « + 5 s ») ; « — » pour le buy-in.
- **Max** : bouton radio **par Exercice**, aligné à droite sur le texte des autres valeurs, avec le titre « Max » centré au-dessus. Activé, il grise l'Objectif et Par tour (Condition d'arrêt = À l'échec). Max peut concerner un, plusieurs ou tous les mouvements de la boucle.
- **Disposition** : les colonnes Objectif, Par tour, Charge (si l'interrupteur est activé, §6 quater bis) et Max sont distribuées à espacement égal entre la colonne Mouvement et la marge droite ; chaque valeur (et le bouton radio) est centrée sous le titre de sa colonne.

**Écrans :** « AMRAP — Récapitulatif, incrément et max », « … suppression glissée », « … buy-in et incrément ».

### 4.4 Alimentation des Exercices par les tableaux des récapitulatifs

**Principe.** Chaque ligne d'un tableau de récapitulatif correspond à **un Exercice** de la structure créée. Ses cases écrivent directement dans les **champs standards de cet Exercice**. Il n'y a pas de second stockage : rouvrir le récapitulatif ou la modale de l'Exercice montre les mêmes valeurs.

| Tableau | Case | Champ de l'Exercice alimenté |
|---|---|---|
| EMOM — Mouvement \| Objectif | Unité choisie au clavier (Répétitions / Durée) | **Mode d'exécution** = Répétitions / Durée |
| | Objectif, en Répétitions | **Nombre de répétitions** (cible chiffrée de chaque série) |
| | Objectif, en Durée | **Objectif de durée** (de chaque série) |
| Death by — Mouvement \| Départ \| Incrément | Départ | **Nombre de répétitions** de départ |
| | Incrément | **Incrément par intervalle** (au minimum + 1) |
| AMRAP — Mouvement \| Objectif \| Par tour \| Max | Unité choisie au clavier | **Mode d'exécution** = Répétitions / Durée |
| | Objectif | **Nombre de répétitions** (lu « par tour ») ou **Objectif de durée** |
| | Par tour | **Incrément par tour** |
| | Max | **Condition d'arrêt** = À l'échec (Objectif et Par tour grisés, inactifs ; Charge modifiable) |
| | Charge | **Charge** commune de l'Exercice |
| Progression — Mouvement \| Unité \| S1…Sn | Objectif de la série k | **Séries variables** : cible de la série k |
| | Charge de la série k | **Séries variables** : charge de la série k (seulement si la Charge de l'Exercice est « Avec » ; case vide = série sans charge, aucune valeur 0) |
| For time — Mouvement \| Unité \| Tour 1…n | Objectif du tour k | **Séries** : cible de la série k (nombre de séries = nombre de tours) |
| | Charge du tour k | Charge de la série k |
| EMOM — Charge \| + / série | Charge et incrément | **Charge par série** : charge de départ sur la première série, augmentée de l'incrément à chaque série suivante. Les charges par série font référence ; départ et incrément sont une saisie qui les calcule (§6 quater bis) |

**Valeurs initiales.** À la création, chaque ligne reçoit les valeurs initiales du Format : EMOM en mode Répétitions ; Death by au départ 1 et à l'incrément + 1 ; Progression à 10, 12 et 14 ; AMRAP selon le questionnaire. Seules les valeurs effectivement initialisées depuis le Profil gardent le fond orange avant la première validation (§14.3 de la référence Formats).

**Changement d'unité (tous les tableaux).** Passer une ligne de Répétitions à Durée, ou l'inverse, au clavier, change le Mode de l'Exercice. L'objectif devient **« à renseigner »** dans la nouvelle unité. Il n'y a ni conversion entre répétitions et secondes ni valeur inventée. Le reste de l'Exercice est conservé : séries, charge, côtés, phases compatibles. C'est la même règle que pour les entrées et les sorties de Circuit (référence Formats, §6).

**Enregistrement — décision de Hermann du 3 novembre.** Le récapitulatif est un formulaire : **« Enregistrer dans la séance » (ou « Enregistrer les modifications » à la réouverture, §6 sexies) n'est actif que si tous les paramètres à renseigner le sont et si la configuration est cohérente**. Un objectif « à renseigner » (par exemple après un changement de mode) ou des durées EMOM incompatibles avec l'intervalle (ci-dessous) désactivent le bouton. La valeur manquante est signalée dans son cadre. L'état « Paramètres à compléter » reste réservé aux Exercices modifiés après coup dans la Composition (entrée dans un Circuit, sortie d'un Format, §6 et §13 de la référence Formats) ; il ne s'applique pas à la sortie du parcours Format.

**Cohérence avec la modale.** Les valeurs du tableau et celles de la modale de l'Exercice sont **les mêmes données**. Modifier l'une modifie l'autre.

**Durées incompatibles avec l'intervalle (EMOM) — décision de Hermann du 3 novembre.**
- **Condition** : la durée de travail prévue dans un intervalle **atteint ou dépasse** cet intervalle.
  - **Travail prévu d'un Exercice** : son objectif de durée, multiplié par 2 s'il est fait de chaque côté, plus la pause entre les côtés si elle s'applique (40 s de chaque côté = 80 s au moins).
  - EMOM simple, en alternance ou à la suite : le travail prévu d'un Exercice est supérieur ou égal à son Intervalle (70 s pour 60 s).
  - EMOM dans chaque intervalle : la **somme** du travail prévu des membres est supérieure ou égale à l'intervalle commun (30 s + 30 s pour 60 s). Les membres en Répétitions comptent pour 0, puisque leur durée n'est pas connue : le contrôle porte sur la durée connue et ne garantit pas que l'ensemble tiendra dans la fenêtre.
- **Effet** :
  1. **Informer** : un message sous le tableau, par exemple « Les durées atteignent ou dépassent l’intervalle de 1 min : il ne reste pas de temps pour le reste du travail ni pour le repos. » ;
  2. mettre **sur fond rouge** le cadre des valeurs concernées (les objectifs de durée en cause et l'intervalle) ;
  3. **bloquer la validation** : « Enregistrer dans la séance » est désactivé tant que la condition est remplie.
- La même règle s'applique dans la modale de l'Exercice et dans l'en-tête du Circuit quand on modifie l'objectif ou l'intervalle après l'enregistrement : la valeur passe en rouge et la validation de la modale est bloquée.
- Le moteur n'a pas de cas particulier à traiter : une configuration dans cet état n'est jamais enregistrée.

### 4.5 Saisie de l'objectif au clavier (unité, puis valeur)

**Règle.** Dans les tableaux AMRAP et EMOM, un appui sur la case **Objectif** d'un mouvement ouvre le **clavier numérique** décrit pour la Progression (§6 quater), sans roulette ni modale :
1. **ligne sans unité** : la barre affiche **Répétitions**, **Durée** et **Fermer** ;
2. **unité choisie** : elle reste affichée en état sélectionné, suivie de **Précédent**, **Suivant** et **Fermer** ; l'utilisateur tape la valeur. Suivant passe à l'objectif du mouvement suivant (puis à sa charge si l'interrupteur est activé) ;
3. **nouvel appui sur l'unité** : la barre repropose les deux unités ;
4. **affichage** : la case porte la valeur avec son unité (« 12 rép. », « 45 s », « 1 min 30 »), et le Mode de l'Exercice est mis à jour. La case en cours de saisie est surlignée.

L'Incrément par tour suit l'unité de l'objectif (« + 2 », « + 5 s »).

**Changement d'unité.** Il n'y a aucune conversion : la valeur repasse « à renseigner ».

**Unités proposées selon le contexte.** AMRAP à un seul Exercice : Répétitions seulement. Exercice d'un Circuit AMRAP, EMOM, Progression : Répétitions ou Durée. For time : Répétitions ou Durée, pour les buy-in, buy-out et Exercices de la boucle, sauf si ce changement supprimerait le dernier Exercice en Répétitions de l’ensemble du Circuit, buy-in et buy-out compris (§6 bis 2). La barre du clavier ne propose que les unités autorisées. **Max** (AMRAP) reste le bouton radio de la ligne : actif, il grise la case Objectif, qui ne s'ouvre pas.

**Remplacements.** En EMOM, la colonne Mode et son popover sont supprimés. En AMRAP, le champ d'unité séparé est supprimé.

**Écrans :** « AMRAP — Récapitulatif, saisie de l'objectif au clavier (répétitions) » et « AMRAP — Récapitulatif, saisie de l'objectif au clavier (durée) ».

## 5. Composant « Carte — Mouvement sélectionné » (petite carte)

**Règle.** Sur la petite carte (370 × 52), la description tronquée sur une ligne est remplacée par les **zones corporelles** du mouvement, précédées de la pastille de zone corporelle, dans le style des cartes de la Composition (12 px, gris).

Ce changement est fait dans le composant (variantes Possible, Bloquée et Aucune), donc partout où la carte est utilisée : résultats de saisie, mode catalogue, récapitulatifs.

## 6. Alignement des valeurs non modifiables

**Règle.** Dans les cadres de paramètres des questionnaires et des récapitulatifs, une **valeur non modifiable** (Durée totale, Condition d'arrêt…) est alignée à droite **sur le texte** des valeurs modifiables, et non sur le bord de leur pastille. Le retrait vaut la marge intérieure de la pastille, soit 10 px.

La même règle vaut pour les colonnes de valeurs des tableaux (§4.2).

## 6 bis. À l'échec : pas de durée totale

**Règle.** Le format À l'échec n'affiche **aucune durée totale**, ni dans le cadre des paramètres du questionnaire et du récapitulatif, ni en borne de fin du déroulé. Le nombre de répétitions n'étant pas connu à l'avance, cette durée n'a pas de sens.

La durée estimée de la Séance (« ≥ … » en Composition) continue d'intégrer ce qui est connu, c'est-à-dire les pauses entre séries.

**Écrans :** « À l'échec — Questionnaire », « À l'échec — Récapitulatif ».

## 6 bis 1. AMRAP : déroulé du questionnaire

**Règle.** Le déroulé du questionnaire AMRAP montre **un seul bloc continu** de 0 à la Durée (12 min), et non des cases égales numérotées, qui évoqueraient des intervalles fixes comme en EMOM. À l'intérieur, de courts séparateurs à espacement irrégulier, contenus dans la barre sans la couper, figurent des tours de durée variable, numérotés « Tour 1 », puis « T2 », « T3 »… ; le dernier tour, coupé par l'échéance, n'est pas numéroté et garde la même couleur. Avec plusieurs blocs, chaque bloc garde cette représentation. Les tours dessinés sont illustratifs : ils ne constituent pas une estimation des tours réalisables.

**Écran :** « AMRAP — Questionnaire ».

## 6 bis 2. AMRAP et For time : Rôle dans le circuit (buy-in, tour, buy-out)

**Rôle dans le circuit.** Dans un Circuit AMRAP ou For time, chaque Exercice porte un **Rôle dans le circuit** (libellé à l'écran : « Rôle »), qui remplace le champ « Passage » (Une fois / À chaque tour). Ce concept est distinct du Format porté par l'Exercice : le Rôle dit sa place dans l'organisation, pas ce qu'il fait.
- **AMRAP** : **Buy-in | Tour**. Pas de buy-out : l'échéance termine le bloc (puis sa clôture, et le bloc suivant ou la suite de la Séance) ; un travail après l'AMRAP n'est pas compté dans son temps et se compose comme l'élément suivant de la Séance ;
- **For time** : **Buy-in | Tour | Buy-out**.

La ligne n'existe que dans ces deux Circuits, et y est toujours présente ; « Tour » par défaut. Le rôle est une donnée explicite : la position en découle, et non l'inverse.

**Le rôle fixe la zone.** Le Circuit est découpé en trois zones dans cet ordre : buy-in, tour (la boucle), buy-out.
- Passer un Exercice en Buy-in le place à la fin de la zone buy-in ; en Buy-out, à la fin de la zone buy-out ; revenir à Tour le place en tête de la boucle. Un Exercice ajouté après coup peut ainsi prendre l'une ou l'autre position.
- Le glisser-déposer réordonne à l'intérieur d'une zone ; changer de zone passe par le Rôle, pour qu'un geste imprécis ne transforme pas un Exercice en buy-in.
- **Plusieurs buy-in sont autorisés** (par exemple 1000 m de rameur puis 50 burpees avant l'AMRAP), ainsi que plusieurs buy-out en For time. Ils s'enchaînent dans l'ordre, une seule fois. En AMRAP, les buy-in consomment le temps du premier bloc uniquement.
- **Au moins un Exercice reste en Tour** : pour le dernier Exercice de la boucle, les options Buy-in et Buy-out sont désactivées ; il ne peut pas non plus être supprimé ni sorti du Circuit tant qu'un buy-in ou un buy-out reste présent (message court invitant à passer d'abord un autre Exercice en Tour).
- **Changer de rôle** ne perd rien : passer en Buy-in ou Buy-out conserve l'Incrément et la Récupération de l'Exercice sans les appliquer (ligne grisée, Récupération à 0 s) ; revenir à Tour les rétablit. En For time, un Exercice à l'échec passé en Buy-in ou Buy-out passe À l'objectif, son objectif « à renseigner ».

**Ce qu'impose un buy-in ou un buy-out.** Pas d'incrément (ligne grisée), une seule exécution, Récupération 0 s verrouillée. Condition d'arrêt :
- **AMRAP** : À l'objectif ou **À l'échec** (par exemple un max de pompes avant l'AMRAP). Le temps passé est pris sur le premier bloc. « Terminé » lance immédiatement la boucle : aucune saisie ne s'intercale pendant que le temps du bloc court. Les répétitions réalisées sur le buy-in se saisissent **à la clôture du bloc**, avec le résultat de l'AMRAP (tours complets et partiel) ;
- **For time** : À l'objectif uniquement. Le résultat est le temps mis pour finir : un buy-in ou buy-out à l'échec le rendrait dépendant de l'effort fourni sur le max, et non comparable d'une séance à l'autre. « For time puis max en 1 min » se compose avec deux éléments successifs.

**Mode.** Un buy-in ou un buy-out peut être en **Répétitions ou en Durée** (par exemple 2 min de rameur) ; la cible est le Nombre de répétitions ou l'Objectif de durée selon le Mode. En For time, une durée fixe s'ajoute au chrono sans fausser le résultat. Revenir à Tour rend l'Incrément et la Récupération modifiables.

La modale d'un buy-in n'a ni ligne Séries ni ligne Pause : aucune modale AMRAP n'a de Séries, le tour en tient lieu, et le temps qui suit le buy-in est sa Récupération.

**Incrément par tour (AMRAP).** La ligne est **toujours présente** dans la modale d'un Exercice AMRAP, à « + 0 » par défaut ; on la laisse à 0 quand on n'en veut pas. Elle s'exprime dans l'unité de l'objectif : « + 2 rép. » en Répétitions, « + 5 s » en Durée (par exemple un gainage qui s'allonge à chaque tour). Elle est **grisée**, non modifiable, quand elle ne peut rien porter :
- Rôle Buy-in : pas de tour suivant ;
- Condition d'arrêt À l'échec : pas d'objectif chiffré à augmenter.

Le For time n'a pas d'Incrément par tour.

**Modale For time d'un Exercice seul.** Les séries peuvent être **variables** (21 / 15 / 9, cas le plus courant) ou **identiques** (par exemple 5 × 20 burpees) : le For time fixe un travail fait le plus vite possible, sans imposer sa forme. L'écran « For time — Modale exercice, standard » montre l'état initial cohérent avec le questionnaire : « 3 séries variables » sélectionné, 21 / 15 / 9 répétitions, pauses à 0 s.

**Boucle du For time.** Un Exercice de rôle Tour peut être en Répétitions ou en Durée (par exemple « 3 tours : 20 burpees, puis 30 s de gainage » : le chrono mesure toujours la performance). **Au moins un Exercice de l’ensemble du Circuit reste en Répétitions**, buy-in et buy-out compris : le travail du Circuit ne doit pas être entièrement défini par des durées fixes. Pour le dernier Exercice en Répétitions du Circuit, l’option Durée est désactivée, avec un message court. Ce contrôle s’applique aussi à la suppression, au déplacement hors du Circuit et aux autres modifications de mode. Une boucle entièrement en Durée est possible si un buy-in ou un buy-out reste en Répétitions.

**Données et développement.** Le champ « Passage » (Une fois / À chaque tour) devient « Rôle dans le circuit » (Buy-in / Tour / Buy-out). La règle qui réservait « Une fois » au premier ou au dernier Exercice, la limite à un seul buy-in et l'interdiction de dupliquer isolément un buy-in sont retirées : dupliquer un buy-in crée un second buy-in, exécuté une seule fois, placé juste après l'original dans la zone buy-in ; il en va de même pour un buy-out, dont la copie est placée juste après l'original dans la zone buy-out. Les règles de réordonnancement des buy-in et buy-out (§6 de la référence Formats, points 4 et suivants) sont remplacées par le découpage en zones ci-dessus.

**Point ouvert, à décider séparément : la distance.** KODJO ne connaît que les Modes Répétitions et Durée. Un Mode Distance (en mètres) toucherait la saisie, l'exécution, les résultats et les records de tous les formats ; il n'est pas introduit par cette règle.

**Écrans :** ligne « Rôle » sur « AMRAP — Modale exercice, buy-in », « … dans un circuit », « … dans un circuit, durée à l'échec », « For time — Modale exercice, dans un circuit » et « … buy-in ou buy-out » ; Durée activable sur les modales de buy-in et buy-out et sur « For time — Modale exercice, dans un circuit », et À l'échec sur « AMRAP — Modale exercice, buy-in » ; ligne Incrément grisée sur « AMRAP — Modale exercice, buy-in », « … simple, à l'échec (Max) » et « … dans un circuit, durée à l'échec ».

## 6 ter. Regroupement en Circuit dès deux Exercices

**Règle.** Dès que l'enregistrement d'un Format crée **au moins deux Exercices**, ces Exercices sont placés dans un **Circuit**. Il n'y a plus d'Exercices successifs posés à plat dans la Séance.

| Cas | Avant | Désormais |
|---|---|---|
| Circuits porteurs d'un Format (AMRAP, For time, EMOM et Death by dans chaque intervalle, Death by en alternance) | Circuit porteur | Inchangé |
| Circuits standards déjà créés (Tabata et EMOM en alternance, Superset) | Circuit standard | Inchangé |
| **À la suite** (Tabata, EMOM, Death by) et départs rapides à plusieurs mouvements (30/30, Renforcement, Progression, À l'échec) | Exercices successifs, sans Circuit | **Circuit standard, nature « groupées », 1 tour** |

**Correspondance « À la suite ».** La nature « groupées » avec 1 tour reproduit exactement l'exécution À la suite : chaque Exercice fait toutes ses séries, puis le suivant démarre. Les paramètres des Exercices sont inchangés :
- la récupération entre les mouvements reste la Récupération de chaque Exercice, 0 s sur le dernier ;
- les durées sont identiques (Tabata À la suite : 8 min 50 s) ;
- les Exercices EMOM et Death by gardent leur propre Format, comme tout Exercice formaté simple dans un Circuit standard groupé : un Death by qui échoue termine ce membre, puis le Circuit passe au suivant ; les résultats restent distincts.

**Pourquoi.** Ce que l'utilisateur a composé en une fois est une unité : on le replie, on le déplace et on le supprime d'un seul geste, et l'en-tête dit comment il s'enchaîne. Le Circuit standard existe déjà et ne demande aucun nouveau paramètre.

**Dans la Séance.** Le Circuit s'affiche comme tout Circuit standard, avec pour titre le nom de son modèle (« Tabata », « Progression », §6 quinquies) et en deuxième ligne « 1 tour · groupées ». Il reste librement modifiable (nombre de tours, nature, ajout ou sortie d'un Exercice) selon les règles des Circuits standards.

**Cas laissé de côté.** Le Format à un seul Exercice n'est pas traité ici : il garde son comportement actuel.

## 6 quater. Progression : interrupteur « Avec charge »

**Règle.** Le questionnaire Progression comporte un interrupteur **« Avec charge »**, entre Pause et Durée totale. Il n'existe que dans le questionnaire.
- **Activé** : le tableau des séries du récapitulatif affiche, sous les répétitions de chaque série, une **charge par série** pour chaque mouvement. La charge est facultative par mouvement : laissée vide, ce mouvement est fait sans charge, par exemple un mouvement au poids du corps dans la même Progression. Une charge vide ne bloque donc pas « Enregistrer dans la séance ».
- **Désactivé** : le tableau n'affiche que les répétitions, et aucune charge n'est créée sur les Exercices.
- **Après l'enregistrement**, la charge se modifie dans la modale de l'Exercice, comme pour tout Exercice standard. L'interrupteur n'est pas reporté dans le récapitulatif ni dans la Séance.

**Valeur par défaut.** Désactivé (Sans charge). L'écran « Progression — Questionnaire » le représente activé, pour correspondre au récapitulatif « Progression — Récapitulatif » (charges sur « Fentes avant », aucune sur « Squats sautés »).

**Tableau des séries.** Le tableau affiche au plus **4 colonnes visibles** à côté du nom du mouvement : la première pour l'**unité** de l'objectif (« rép. », ou « durée »), puis une colonne par série (S1, S2, S3). Au-delà de trois séries, les colonnes de séries défilent horizontalement ; le nom et l'unité restent fixes. Les cases de l'objectif ne portent que des nombres (« 12 ») ; la durée s'affiche au format de l'application (« 30 s », « 1 min 30 »). La ligne de charge apparaît sous l'objectif quand l'interrupteur est activé, avec l'unité à côté de la valeur (« 10 kg »), en bleu KODJO comme toute valeur modifiable. Le déroulé garde les nombres seuls.

**Saisie au clavier.** Toutes les valeurs du tableau se saisissent avec le clavier numérique déjà développé pour les séries variables (barre au-dessus du clavier, boutons en pastilles, Fermer plein en bleu KODJO). Pas de roulette.
1. **Première case d'une ligne sans unité** : la barre affiche **Répétitions**, **Durée** et **Fermer**. Fermer ferme le clavier sans rien enregistrer. Un chiffre tapé sans choix vaut Répétitions.
2. **Unité choisie** : elle reste affichée dans la barre en état sélectionné (identifiable pendant la frappe), suivie de **Précédent**, **Suivant** et **Fermer** ; l'utilisateur entre les valeurs. Les autres cases de la ligne s'ouvrent directement dans cette configuration. Fermer garde les valeurs saisies.
3. **Nouvel appui sur l'unité** : Précédent et Suivant disparaissent, et la barre propose à nouveau les deux unités, la courante restant sélectionnée. Choisir l'autre unité remet les valeurs de la ligne « à renseigner », sans conversion.
4. **Durée** : les chiffres se remplissent par la droite (3, 0 → 30 s ; 1, 3, 0 → 1 min 30). **Charge** : même clavier, avec la virgule, sans choix d'unité (kg).
5. **Ordre de Suivant** : objectif S1 → S3, puis charges S1 → S3, puis ligne suivante.

**Écrans :** « Progression — Récapitulatif » ; « Progression — Récapitulatif, clavier étape 1 (unité) », « … étape 2 (valeurs) », « … étape 3 (changement d'unité) », placés à la suite du récapitulatif.

## 6 quater bis. For time, AMRAP et EMOM : interrupteur « Avec charge »

**Règle.** Les questionnaires For time, AMRAP et EMOM comportent le même interrupteur **« Avec charge »** que la Progression, **désactivé par défaut** : la charge est souvent prescrite dans ces formats (par exemple Fran, thrusters à 43 kg ; kettlebell en AMRAP ou EMOM). Il n'existe que dans le questionnaire.
- **Activé, For time** : présentation et fonctionnement identiques à la Progression : colonne Unité, une colonne par tour (Tour 1, Tour 2, Tour 3 ; 4 colonnes visibles au plus, défilement au-delà), **une charge par tour** sous l'objectif (40 / 45 / 50 kg), car elle varie souvent d'un tour à l'autre ; les tours sont préremplis avec la même valeur. Même clavier.
- **Activé, EMOM** : pas de tableau de séries. Le tableau compte trois colonnes de valeurs : **Objectif** (valeur avec son unité, « 10 rép. », « 30 s »), **Charge** de départ (« 12 kg », « — » tant qu'elle n'est pas renseignée) et **+ / série**, l'incrément de charge appliqué à chaque série (« + 2,5 kg », par exemple 3 soulevés de terre chaque minute en ajoutant 5 kg), à « + 0 » par défaut, soit une charge fixe. Même clavier pour l'unité de l'objectif.
- **Activé, AMRAP** : **charge fixe** (on ne change pas de charge en cours d'AMRAP). Quatrième colonne **Charge** entre Par tour et Max ; colonnes resserrées : Objectif, Par tour, Charge, Max. Une seule valeur d'objectif par mouvement, avec l'unité à côté de la valeur ; même clavier. Max grise l'Objectif et Par tour, **pas la Charge** : un max de répétitions se fait avec une charge.
- **Référence des charges EMOM** : ce sont les charges effectives de chaque série de l'Exercice. Départ et incrément servent à les calculer (12 kg, + 2,5 kg, 6 séries → 12 ; 14,5 ; 17 ; 19,5 ; 22 ; 24,5 kg). Si une série a été modifiée ensuite dans la modale, le récapitulatif affiche le départ et « variable » dans « + / série » ; il ne réécrit jamais la suite de lui-même. Modifier l’incrément recalcule toutes les séries ; une confirmation est demandée uniquement si ce recalcul écrase des charges personnalisées. Aucune confirmation n’est nécessaire lors de la première saisie. L'incrément est grisé tant qu'aucune charge de départ n'est renseignée.
- **Commun** : la charge est facultative : laissée vide, le mouvement est fait **sans charge**, sans valeur 0 enregistrée (les tractions de Fran) ; elle ne bloque pas l'enregistrement. Saisie au clavier numérique avec la virgule.
- **Ordre de Suivant** : Progression et For time, objectif S1 → Sn (ou Tour 1 → n), puis charges, puis ligne suivante ; AMRAP, Objectif → Par tour → Charge → ligne suivante ; EMOM, Objectif → Charge → + / série → ligne suivante. Les cases grisées sont sautées.
- **Désactivation après saisie** : désactiver « Avec charge » (retour au questionnaire) applique la règle existante : les valeurs sont conservées mais ne s'appliquent pas tant que la charge est « Sans ».
- **Désactivé** : aucune charge n'est affichée ni créée.
- **Après l'enregistrement**, la charge se modifie dans la modale de l'Exercice.

Tabata et 30/30 n'ont pas cet interrupteur : ils se font presque toujours au poids du corps, et la modale de l'Exercice suffit.

**Écrans :** interrupteur sur « For time — Questionnaire », « EMOM — Questionnaire » (entre Repos et Durée totale), « AMRAP — Questionnaire » et ses variantes (« … plusieurs blocs », « … saisie d'un mouvement », « AMRAP — Choix des mouvements », « AMRAP — Choix du buy-in ») ; charge activée représentée sur « For time — Récapitulatif », « AMRAP — Récapitulatif, incrément et max » et « EMOM — Récapitulatif, dans chaque intervalle » (For time : charge par tour 40 / 45 / 50 kg sur Fentes avant ; AMRAP : colonne Charge ; EMOM : colonnes Charge et + / série, « 12 kg » et « + 2,5 kg » sur Fentes avant, « — » sur Squats sautés).

## 6 quinquies. Circuit replié : actions glissées et nom du Circuit

**Règle.** Dans la Composition, un **glissé à gauche sur un Circuit replié** révèle **Renommer | Dupliquer | Supprimer** pour un Circuit composé à la main ou sans Modèle d'origine ; un Circuit issu d’un modèle propose **Renommer | Modifier le format | Dupliquer | Supprimer** (§6 sexies), sur le modèle du glissé d'un Exercice. Le Circuit déplié ne se glisse pas : le geste déplacerait tout le bloc et entrerait en concurrence avec le glissé des Exercices qu'il contient. Le Cycle n'est pas concerné : il n'est jamais replié.

**Présentation.** Le cadre du Circuit glisse à gauche avec son contenu et s'arrête à 8 px de Renommer. Les boutons ont la hauteur du cadre et forment un seul bloc : Renommer (bleu KODJO) arrondi à gauche, Modifier le format (violet, pour un Circuit issu d’un modèle) et Dupliquer (gris) à coins carrés, Supprimer (rouge) arrondi à droite, avec le rayon du cadre du Circuit.

- **Nom du Circuit** : nouvel attribut du Circuit. Par défaut : le nom de son **Modèle d'origine** pour tout Circuit créé par un modèle, porteur (« AMRAP », « For time ») ou standard (« Tabata », « Superset ») ; « Circuit » pour un Circuit composé à la main. Le nom ne remplace que le titre : la deuxième ligne garde l'organisation (« AMRAP · 1 bloc · groupées »), et renommer ne modifie ni le Format ni sa nature. L'appui sur le titre et le chevron reste réservé au repli et au dépliage ; le nom ne se modifie que par l'action Renommer.
- **Renommer** : le titre passe en saisie en ligne, avec le clavier ; validation par la touche Retour ; un nom vide reprend le nom par défaut.
- **Dupliquer** : la copie est insérée juste après l'original, repliée, avec tous ses Exercices et réglages, y compris le Format porté et le Modèle d’origine ; elle est indépendante de l'original. Son titre passe aussitôt en saisie, prérempli avec le nom d'origine suivi de « (C) » (« Circuit (C) ») et sélectionné : l'utilisateur tape un nouveau nom ou valide.
- **Supprimer** : confirmation « Supprimer ce circuit ? », « Le circuit et ses N exercices seront supprimés de la séance. », Annuler / Supprimer. La confirmation se justifie parce qu'une erreur de geste fait perdre plusieurs Exercices.

**Écrans :** « Composition séance — Circuit replié, actions glissées » (trois actions), « Composition séance — Circuit issu d'un format, actions glissées » (quatre actions), « Composition séance — Circuit replié, suppression (confirmation) », « Composition séance — Circuit dupliqué, saisie du titre ».

## 6 sexies. Rouvrir le parcours du modèle depuis la Composition

### 6 sexies.1. Règle

Le glissé à gauche sur un **Circuit replié issu d'un modèle** (Modèle d'origine renseigné) révèle une quatrième action, **« Modifier le format »**, entre Renommer et Dupliquer : **Renommer | Modifier le format | Dupliquer | Supprimer**. Un Circuit composé à la main garde les trois actions.

« Modifier le format » ouvre la **modale du récapitulatif** du modèle, préremplie avec l'état actuel du Circuit. Le bouton Retour mène au questionnaire, pour changer la structure (par exemple l'Exécution) ; « Valider les paramètres » ramène au récapitulatif. Le bouton du récapitulatif s'intitule **« Enregistrer les modifications »** et suit la même règle d'activation que « Enregistrer dans la séance » (§4.4). L'enregistrement met à jour le Circuit existant ; fermer sans enregistrer ne change rien.

### 6 sexies.2. Origine du Circuit

- **Modèle d'origine** : le Circuit garde le modèle qui l'a créé. Ce champ est **distinct** de « Format d'origine », qui reste propre aux Circuits porteurs et gouverne leur exécution (§6 sexies.7) ; il est renseigné pour tous les Circuits créés par un modèle :
  - Circuits porteurs : AMRAP, For time, EMOM, Death by (déjà connus) ;
  - Circuits standards créés par un Format : Tabata, 30/30, Superset, Renforcement, Progression, À l'échec, et les exécutions « À la suite » (§6 ter du présent document).
- Un Circuit sans Modèle d'origine (composé à la main) n'a pas l'action.
- Le Modèle d'origine n'est pas modifiable et ne change rien à l'exécution du Circuit standard ; il sert uniquement à rouvrir le bon questionnaire.

### 6 sexies.3. Préremplissage

- Le questionnaire et le récapitulatif sont **reconstruits à partir de l'état actuel** du Circuit et de ses Exercices ; les réponses d'origine ne sont pas stockées.
- Ils montrent donc ce qui sera exécuté, y compris les modifications faites après coup (valeurs, Exercices ajoutés ou retirés, Rôles).
- Les réponses se déduisent des champs : durée et nombre de blocs, nombre de tours, nature, présence d'un buy-in ou buy-out (Rôles), volume croissant (incrément non nul), « Avec charge » (§6 sexies.7), objectifs et charges des tableaux.

### 6 sexies.4. Enregistrement

- Le Circuit est **mis à jour en place**, pas recréé : mêmes identifiants d'Exercices, même position dans la Séance, même nom du Circuit.
- Seuls les champs **effectivement modifiés** dans le questionnaire et le récapitulatif sont mis à jour. Les autres sont **conservés** : phases, cadence, côtés, charges d'un modèle sans interrupteur de charge (Tabata, 30/30), réglages faits dans la modale de l'Exercice.
- **Changement de structure** (par exemple EMOM « dans chaque intervalle » vers « à la suite ») : la règle d'entrée dans un Circuit s'applique (référence Formats, §6). Les paramètres compatibles sont conservés, les autres passent « à renseigner », et « Enregistrer les modifications » reste inactif tant qu'ils manquent. Aucune confirmation de perte supplémentaire. Le Format d'origine suit la nouvelle structure (renseigné pour un Circuit porteur, vide pour un Circuit standard) ; le Modèle d'origine et le nom du Circuit sont conservés.
- **Fermer sans enregistrer** (Retour vers le questionnaire, puis croix) : aucune modification n'est appliquée.

### 6 sexies.5. Ce qui ne change pas

- Instantanés déjà figés, historique et records existants : aucun effet rétroactif. Les prochains lancements utilisent la configuration modifiée. L'instantané d'une Séance est figé au démarrage.
- Les autres actions glissées (Renommer, Dupliquer, Supprimer) et leurs règles.

### 6 sexies.6. Écrans Figma

- « Composition séance — Circuit issu d'un format, actions glissées » : quatre actions de 70 px ; « Modifier le format » en violet, coins carrés ; exemple sur un Circuit « Tabata ».
- « Tabata — Récapitulatif rouvert depuis la Composition » : récapitulatif prérempli, bouton « Enregistrer les modifications ».

### 6 sexies.7. Représentation de l'état courant dans le formulaire

- **Avec / Sans charge.** L'interrupteur reprend l'**état effectif actuel** : il est activé si au moins un Exercice du Circuit a sa Charge sur « Avec », désactivé sinon. Des charges conservées sur un Exercice dont la Charge est « Sans » ne réactivent pas l'interrupteur. Les réponses historiques du questionnaire ne sont pas stockées. Activer l'interrupteur à la réouverture affiche les colonnes de charge ; un Exercice dont des valeurs avaient été conservées les retrouve, les autres restent vides (« — », sans charge). Le désactiver repasse la Charge des Exercices à « Sans », en conservant les valeurs (§6 quater bis).
- **Réglages hétérogènes.** Quand un réglage commun du questionnaire ou du récapitulatif (nombre de séries, travail par série, pause, intervalle, incrément de charge EMOM…) ne correspond pas à une valeur unique parce que les Exercices ont des valeurs différentes :
  - le champ commun affiche **« variable »**, dans le style d'une valeur modifiable ;
  - les valeurs propres à chaque Exercice sont **conservées** à la réouverture et visibles là où le récapitulatif les détaille (tableaux, déroulé) ; elles ne sont jamais uniformisées automatiquement ;
  - seule une **modification explicite** du champ commun (saisie d'une valeur) remplace les valeurs de tous les Exercices concernés ; une confirmation courte l'annonce, puisque des valeurs personnalisées sont écrasées ;
  - « variable » n'est pas une valeur « à renseigner » : il ne bloque pas « Enregistrer les modifications ».
- **Modèle d'origine et Format d'exécution.** Le modèle technique distingue l'information qui permet de rouvrir le parcours (Modèle d'origine) et les paramètres qui gouvernent l'exécution (Format d'origine d'un Circuit porteur, paramètres standards). Un Circuit standard issu d'un modèle conserve son exécution standard ; son origine ne lui attribue aucun Format partagé.

### 6 sexies.8. Vérifications attendues

- Réouverture avec les valeurs actuelles, y compris après modification individuelle d’un Exercice.
- Enregistrement en place : conservation des identifiants des Exercices conservés, du nom, de la position et des réglages hors périmètre des champs effectivement modifiés.
- Fermeture et retour sans enregistrement : aucune modification de la Composition.
- Changement de structure : conservation des paramètres compatibles, paramètres incompatibles à compléter, validation inactive si des valeurs obligatoires manquent, sans confirmation de perte supplémentaire.
- Circuit manuel ou ancien Circuit sans Modèle d’origine : absence de l’action.
- Avec / Sans charge repris de l'état effectif ; charges conservées en « Sans » sans réactivation.
- Réglage hétérogène affiché « variable », valeurs conservées, remplacement seulement sur saisie explicite.
- Duplication : conservation du Modèle d’origine et indépendance de la copie.

---

## 7. Documentation à mettre à jour

| Document | Sections |
|---|---|
| `docs/KODJO-Formats-entrainement-2026-11-02.md` | §7 Parcours de composition (modale, sans nom de Séance, en-têtes) ; §7.1 bouton « Valider les paramètres » (au lieu de « Enregistrer dans la séance ») ; §7.1 (« Ouvrir le mode catalogue », mode catalogue, croix) ; §7.2 et §7.3 (mode catalogue au lieu de la modale du catalogue) ; §10 EMOM (tableau, retrait de la ligne Repos) ; §12 Death by (tableau départ / incrément) ; À l'échec (pas de durée totale, §6 bis) ; §3 et §6 : « Passage » remplacé par « Rôle dans le circuit » (Buy-in / Tour / Buy-out), zones, plusieurs buy-in possibles, buy-in et buy-out en Répétitions ou en Durée ; §11 For time : boucle en Répétitions ou en Durée, au moins un Exercice en Répétitions dans l’ensemble du Circuit, buy-in et buy-out compris (§6 bis 2), en marquant l'ancienne formulation comme remplacée ; §1 l.26, §9 (tableau Tabata, ligne À la suite), §9.2, §10 (EMOM À la suite), §12 (Death by À la suite) : Circuit standard groupé à 1 tour dès deux Exercices (§6 ter), en marquant « sans Circuit » comme remplacé ; §9.2 et §9.3 Progression : interrupteur « Avec charge » du questionnaire (§6 quater) ; §10 EMOM, §11 For time et §7 AMRAP : interrupteur « Avec charge » et charge par mouvement au récapitulatif (§6 quater bis) ; §7.4 et §7.5 (appui sur la photo d'une carte : fiche du mouvement en modale) ; §16 Inventaire Figma (§5 de ce document ; contrôle Replier / déplier ; écrans reconstruits ; nouvel écran « P-Tabata — Récapitulatif, fiche du mouvement (modale) » ; en-têtes de modale en variante Sélection) |
| ch06 Écrans et navigation | Parcours Format en modale depuis la Composition ; glissé du Circuit replié (§6 quinquies) ; réouverture du récapitulatif et retour au questionnaire (§6 sexies) |
| ch09 Modèle de données | Attribut « Nom du circuit » : nom du Modèle d'origine par défaut, « Circuit » pour un Circuit composé à la main (§6 quinquies) ; Modèle d’origine (§6 sexies) ; « Passage » remplacé par « Rôle dans le circuit » (Buy-in / Tour / Buy-out) (§6 bis 2) |
| ch10 Règles métier | Rôle dans le circuit et zones ; buy-in / buy-out (Mode, condition d'arrêt, incrément, récupération) ; Incrément par tour en Durée ; regroupement en Circuit dès deux Exercices ; charge des Formats ; réédition en place et conservation des réglages (§6 sexies) |
| ch07 Registre des décisions | Décisions des 3 et 4 novembre : Rôle dans le circuit, plusieurs buy-in et buy-out, Répétitions dans l'ensemble du Circuit For time, buy-in AMRAP à l'échec, charge des Formats, regroupement en Circuit, Nom du circuit, réédition depuis la Composition |
| ch08 Conception détaillée | Questionnaire et récapitulatif modaux ; mode catalogue ; saisie au clavier |
| ch13 Contrats d'écran | Contrats des questionnaires, récapitulatifs et du mode catalogue ; alignement des valeurs ; saisie au clavier des tableaux ; Composition : actions glissées du Circuit replié, saisie du nom, confirmation de suppression ; quatre actions pour un Circuit issu d’un modèle ; récapitulatif rouvert et bouton « Enregistrer les modifications » (§6 sexies) |
| `docs/PRODUCT.md` | Parcours Formats : « fenêtre de choix, puis questionnaire et récapitulatif en modale, puis ajout au brouillon » |

## 8. Corrections à prévoir dans le développement (C.2 à C.6)

À vérifier dans le code de la branche de développement, puis à corriger seulement si l'écart est confirmé :
1. **Présentation modale** du questionnaire et du récapitulatif sur la Composition : apparition par le bas, en-têtes croix ou Retour, fond voilé, clavier au premier plan.
2. **Retrait du nom de la Séance** et du bloc titre dans ces deux étapes ; bouton du questionnaire « Valider les paramètres », celui du récapitulatif « Enregistrer dans la séance ».
3. **Mode catalogue** dans la modale :
   - recherche détachée avec croix d'effacement ;
   - Filtrer, Trier et le nouveau Replier / déplier ;
   - petites cartes sur toute la hauteur, Ajouter, « Fermer le mode catalogue » ;
   - sélection unique pour le buy-in.
4. **EMOM** : Mode Répétitions par défaut, Durée possible (pas de changement) ; tableau « Mouvement | Objectif » au récapitulatif, objectif et unité réglés par mouvement au clavier (§4.5) ; retrait de la ligne Repos.
4 bis. **Bouton « Enregistrer dans la séance » du récapitulatif** actif seulement si tous les paramètres sont renseignés et cohérents. **Alimentation des Exercices** par les tableaux (§4.4) : chaque case écrit dans le champ standard de son Exercice ; changement de mode sans conversion, objectif « à renseigner » ; mêmes données que la modale. **Contrôle EMOM** : durée prévue ≥ intervalle (par Exercice, ou somme des membres dans chaque intervalle) → message, cadre des valeurs en rouge, validation bloquée, au récapitulatif comme dans la modale et l'en-tête du Circuit.
4 ter. **AMRAP et EMOM** : case Objectif unique (valeur et unité) ouvrant le clavier numérique (§4.5) : choix Répétitions | Durée dans la barre du clavier, puis valeur ; pas de conversion au changement d'unité ; AMRAP simple en Répétitions seulement, buy-in en Répétitions ou en Durée ; Max par Exercice aligné à droite (AMRAP).
5. **Death by à plusieurs mouvements** : tableau « Mouvement | Départ | Incrément » au récapitulatif, avec des valeurs propres à chaque mouvement (au minimum + 1).
6. **Petite carte de mouvement** : zones corporelles à la place de la description.
7. **Fiche du mouvement** en modale par appui sur la photo d'une carte, dans le questionnaire et le récapitulatif ; consultation seule.
8. **Alignement** des valeurs non modifiables et des colonnes de tableau sur le texte des valeurs modifiables.
9. **Saisie au clavier** des tableaux (Progression, For time, EMOM, AMRAP), sans roulette : barre Répétitions / Durée / Fermer, puis unité sélectionnée, Précédent, Suivant, Fermer (§4.5, §6 quater) ; colonne Unité et 4 colonnes visibles pour Progression et For time.
10. **Interrupteur « Avec charge »** aux questionnaires Progression, For time, AMRAP et EMOM ; charge par série (Progression), par tour (For time), fixe (AMRAP), de départ avec incrément par série (EMOM) (§6 quater, §6 quater bis).
11. **Rôle dans le circuit** (Buy-in / Tour / Buy-out, libellé « Rôle ») à la place de Passage, zones, plusieurs buy-in ; buy-in et buy-out en Répétitions ou en Durée, buy-in AMRAP à l'échec possible, saisie de son résultat à la clôture du bloc ; boucle For time en Répétitions ou en Durée, au moins un Exercice en Répétitions dans l’ensemble du Circuit, buy-in et buy-out compris ; Incrément par tour toujours présent, grisé pour un buy-in ou à l'échec, en Durée possible (§6 bis 2).
12. **Regroupement en Circuit** standard groupé à 1 tour dès deux Exercices créés par un Format (§6 ter).
13. **À l'échec** : pas de durée totale (§6 bis). **Déroulé AMRAP** : bloc continu (§6 bis 1).
14. **Circuit replié** : glissé Renommer / Dupliquer / Supprimer, nom du Circuit (nom du modèle par défaut), copie « (C) » en saisie, confirmation de suppression (§6 quinquies).
15. **Modifier le format** : quatrième action pour un Circuit issu d'un modèle ; Modèle d'origine ; récapitulatif prérempli depuis l'état actuel, Retour vers le questionnaire ; mise à jour en place des seuls champs modifiés ; « variable » pour les réglages hétérogènes ; Avec / Sans charge selon l'état effectif (§6 sexies).

Les impacts d’exécution à prendre en compte comprennent l’enchaînement de plusieurs buy-in et buy-out (§6 bis 2), l’incrément de durée par tour, les membres For time en Durée et la saisie différée des résultats des buy-in AMRAP. La réédition d’un Circuit modifie sa configuration pour les prochains lancements et ne modifie aucun instantané déjà figé (§6 sexies). Les valeurs des tableaux (objectifs, charges, départ et incrément Death by, incrément de charge EMOM) écrivent dans les champs standards des Exercices. Les données concernées comprennent « Nom du circuit », « Rôle dans le circuit » (qui remplace « Passage ») et « Modèle d’origine » (§6 sexies). Le plan PRE-9 doit couvrir les dépendances de données, de validation, d’instantané et de composition, au-delà des seuls écrans C.2 à C.6.

## 9. Sources de la consolidation et limites de contrôle

Base conservée : `KODJO-Mise-a-jour-ecrans-formats-2026-11-03_intégration remarques chatgpt.md`. Complément intégré : `KODJO-Complement-Modifier-format-circuit-2026-11-04.md`. Arbitrages du 4 novembre : présence d’un Exercice en Répétitions appréciée sur l’ensemble du Circuit For time, buy-in et buy-out compris ; duplication isolée d’un buy-in autorisée (second buy-in, exécuté une seule fois), appliquée de la même façon au buy-out ; réouverture du récapitulatif depuis un Circuit issu d'un modèle, mise à jour en place ; Avec / Sans charge repris de l'état effectif ; réglages hétérogènes conservés.

Références Figma contrôlées directement : `11551:21479` (actions glissées d’un Circuit issu d’un format) et `11551:21673` (récapitulatif Tabata rouvert). Ce contrôle ne vaut ni validation de l’exécution du parcours ni contrôle du code. Aucune mise à jour du dépôt n’est attestée par ce document.
