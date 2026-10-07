# DSF — Cartes, icônes et animations d’appui

**État courant06/10 :** [DSF Cadence et corrections](DSF-CADENCE-2026-10-06.md), [matrice courante](MATRICE-CADENCE-FIGMA-2026-10-06.md). Les mesures/captures datées ci-dessous restent historiques lorsqu’elles sont remplacées ; règles cartes média conservées. Cadence commune REPS et phrase unique selon paramètres v13, Phrase v1.

## Références et portée

Mise à jour du 30 septembre 2026, issue de `prompt_maj_DSF_et_documentation_cartes_point fermés.md`, complété par les six corrections du propriétaire et de la précision du propriétaire sur les pages Figma. Base documentaire : `MyUncried/Application-Routine`, `main`, commit `48b444ededb735da47a42474c39e150224e92395`. Aucun ZIP ancien n’est réintégré.

Figma : fichier `G6RY5Ebhgwb4AHIOYDwwvg`. Les nœuds ci-dessous ont été lus directement. Le rendu des cartes, les règles de gestion et le statut des essais sont distingués : les 17 points ont été clos explicitement par le propriétaire ; La révision du 03/10/2026 est consignée par D-260 à D-264 : RG-3 est définitive, Séance sans visuel.

| Source actuelle | Nœud | Usage |
|---|---|---|
| Cartes - Icônes | `6354:11187` | Page de référence indiquée par le propriétaire |
| Wireframe — APRÈS | `6354:16089` | Référence conservée ; les Exercices des contextes Catalogue/choix ont désormais une gouttière permanente |
| Wireframe — Photo | `6354:16964` | Référence conservée ; même gouttière que sans média, Séances sans visuel |
| Wireframe — Icônes de navigation | `6354:17843` | Dessins des destinations |
| Icônes — sélectionné, non sélectionné, inactif | `6354:17913` | États des icônes de sélection |
| Démonstrations — Animations d’appui | `6016:3303` | Mouvements d’appui et variante de réduction des animations |
| Composants — Cartes | `6214:3519` | Ancienne implantation ; composants canoniques promus dans DSF V2 avec identifiants conservés |
| Design system — Fondations | `2291:2` | Tokens, documentation et inventaire DSF |
| Prototype MVP | `510:101` | Écrans et navigation ; captures des écrans affectés renouvelées le 03/10/2026 |

Les références ci-dessus sont les identifiants courants vérifiés. Le propriétaire rapporte 133 cartes remplacées dans 38 écrans, environ 27 interactions recopiées ; ces totaux ne sont pas une certification de recette interactive.

## Grammaire des cartes

Une carte présente le titre et son badge, puis le classement, puis les valeurs. Les icônes de classement sont en pastille ; les icônes de valeur sont nues. La barre verticale colorée est supprimée sur les cartes standard ; le contexte compact Calendrier Jour conserve sa barre de repère de 4 px. La couleur de catégorie est portée par sa pastille dans les contextes colorés. Les zones corporelles restent un classement, avec leur pictogramme conservé dans les composants courants du Catalogue et des choix, y compris avec photo.

| Élément | Valeur de référence |
|---|---|
| Largeur sur écran de 402 | 354 ; marges extérieures 24 |
| Fond / bord intérieur | `#F9FAFC (surfaceSubtle ; ancienne valeur historique #FCFCFE)` / `#CCD1E0`, 0,5 |
| Rayon | 8 |
| Ombre | `#1A1A26` à 8 %, x=0, y=2, flou=10 |
| Archivée | fond `#F6F6F6`, bord `#D9D9D9` 0,5 ; même ombre ; Restaurer remplace Lecture |
| Titre / informations secondaires | Inter Semi Bold 15 / Inter 12 |
| Badge durée ou heure | `#F5F7FA (surface ; ancienne valeur historique #F4F4F8)`, sans bord, rayon 5, padding vertical 2 / horizontal 7, hauteur 19 |
| Espacement vertical | titre → classement 8 ; classement → valeurs 4 |
| Pastille de classement | 20 ; pictogramme blanc sur fond coloré ou gris `#9499A8` sur fond vide et contour 0,5 |
| Icône de valeur | 16, gris `#9499A8`, trait fin |
| Alignement | centres des icônes sur un même axe à 9 du bord du contenu ; textes alignés |
| Hauteur repliée / choix | séance Catalogue 90 ; exercice Catalogue et choix 91 ; Semaine 95,5 ; Suivi 67 |
| Hauteur déployée | séance Catalogue 235 ; Semaine 254,5. Exercice Catalogue ≈235,7 et Suivi Séance 310,5 : variantes historiques hors MVP, sans chemin d’accès |

Ces dimensions décrivent la référence à taille de texte standard. Le média seul n’agrandit pas la carte (RG-6). Cette règle ne supprime pas les exigences existantes de texte agrandi et de responsive : ne jamais réduire la police pour faire entrer le contenu. Le comportement exact de la carte avec vignette à 200 % reste à qualifier.

| Contexte | Classement représenté | Badge et commandes |
|---|---|---|
| Catalogue séance | Étiquette puis catégories issues des exercices | Durée ; Déployer et Lecture, ou Restaurer |
| Catalogue exercice | Catégorie puis zones corporelles | Durée ; Lecture/Restaurer ; aucun Déployer avec ou sans média (D-261) |
| Calendrier Semaine | Catégorie puis étiquette pour séance ; catégorie puis zones pour exercice | Heure `08:00` ; cercle de nature à gauche ; durée avec sablier sur la ligne des valeurs |
| Suivi | Ligne 1 : nature et titre ; ligne 2 : durée réelle et catégorie | Statut en haut à droite, largeur 76 ; indicateur Ressenti 20 × 20 en bas à droite ; sans déploiement, heure, zones ni étiquettes |
| Choix calendrier/planification | Même famille visuelle que le Catalogue | Radio ; aucun badge durée, Lecture ou Déployer représenté |
| Choix composition | Exercice | Case à cocher 20 ; aucun badge ni action représenté |

Dans le Suivi, la carte fait 354 × 67. Statut à x=262/y=9 (76 × 24), Ressenti à x=318/y=39 (20 × 20). Ligne 1 : nature, titre, statut ; ligne 2 : durée, catégorie, ressenti. Aucun chevron, heure, zone corporelle ou étiquette. La boîte du Ressenti et son dessin font 20 × 20 ; aucune zone tactile ni action. Les données historiques complètes restent conservées. D-175 reste la règle des gestes dans les contextes où ils sont accessibles.

Le cercle de nature est réservé aux cartes Semaine et Suivi : diamètre 26, marge 12 depuis le bord, fond `#F9FAFC (surfaceSubtle ; ancienne valeur historique #FCFCFE)`, bord blanc 0,5, ombre `#1A1A26` à 28 % (0,2,6), pictogramme `#14141A`. Séance : liste ; exercice : `person-simple-tai-chi-light`, dessin 15. Dans le Catalogue et les choix d’exercices, la nature apparaît dans la gouttière permanente sans média ; ce dessin24 n’est pas le cercle26 des cartes Semaine/Suivi/Jour. Le contexte Calendrier Jour emploie aussi le cercle de nature, selon les dimensions compactes ci-dessous.

## Iconographie et couleurs

| Usage | Source / composant |
|---|---|
| Durée | Phosphor `hourglass-light` |
| Heure | Phosphor `clock-light` |
| Récurrence déployée | Phosphor `calendar-blank-light` |
| Nombre d’exercices d’une séance | Phosphor `barbell-light` ; jamais nature de l’exercice |
| Nombre de tours | `Icon / Tour` existant, 16 sur les cartes, trait 1,35 |
| Nombre de séries | Phosphor `stack-light` |
| Bilatéral | Phosphor `flip-horizontal-light`, 16, gris, 12 après la synthèse |
| Nature exercice | Phosphor `person-simple-tai-chi-light` |
| Catégorie | `icon/categorie`, `6296:10530`, dessin sur mesure |
| Zone corporelle | `icon/zone-corporelle`, `6322:10880`, variantes Homme/Femme ; RG-5 |
| Étiquette | `cil:tag` |
| Place réservée média | Phosphor `person-simple-tai-chi-light`, 24 ; gouttière 64 permanente dans Catalogue et choix d’exercices |

Le booléen Figma `Bilatéral` est faux par défaut. Il est présent sur les variantes Catalogue et choix de l’exercice, absent en Semaine et Suivi. Il ne remplace ni le paramètre métier de direction ni `Indicator / Sides` (`D→G/G→D`). Il représente la bilatéralité à la place du texte « de chaque côté » sur les variantes concernées ; les données et les calculs ne changent pas.

| Objet | Couleur |
|---|---|
| Renforcement | `#0508E5` |
| Mobilité | `#4F9F83` |
| Étirements | `#FF8D28` |
| Cardio | `#F3A6A6` |
| Récupération (catégorie) | `#A7DDB7` |
| Hyrox (étiquette) | `#4678F5` |
| Marathon | `#E5484D` |
| Vacances d’été | `#F7D154` |
| Challenge groupe | `#B335A0` |

Ces couleurs documentent les références fournies ; elles ne créent ni catégories obligatoires ni couleur déduite du nom en production. Cardio et Récupération sont validées. Le contraste du pictogramme blanc inférieur à 3:1 est une situation connue et acceptée : environ 1,9:1 pour Cardio, 1,5:1 pour Récupération, 2,3:1 pour Étirements ; le nom de catégorie reste affiché à côté. Les autres catégories non concernées conservent leur définition.

Navigation : `Navigation / Bottom` (`6298:12462`), variantes Catalogue `6298:11827`, Calendar `6298:11988`, History `6298:12149`, Profile `6298:12310`, Search `6298:12461`. La présence de Search ne valide pas une destination fonctionnelle supplémentaire. Icônes : Catalogue `6296:10468` (quatre formes), Calendrier `6296:10484` (contour), Suivi `6296:10498` (quatre barres), Profil `6296:10514` (`people-outline`). Trait 2, dessin maximal 24 dans boîte optique 32, profil 24 × 20,1, centrage conservant le ratio. Actif `#0508E5`, non actif `#595E66`.

Icônes de sélection hors navigation : sélectionné `#0508E5`, non sélectionné `#595E66`, inactif `#C2C4D1`. Cette palette ne recolore pas les visages de Ressenti, les statuts, les boutons à fond coloré ou les icônes purement informatives de valeur. `target-light` reste réservé au Programme ; `pulse-light` reste réservé aux rapports ou au Suivi ; ces icônes ne sont pas encore utilisées. Les nouvelles icônes suivent `icon/<nom>` ; les icônes existantes ne sont pas renommées.

## Composants et écarts d’assemblage

| Set | Propriétés | Variantes vérifiées |
|---|---|---|
| DSF / Cards / Séance `6214:7276` | Contexte, État | 10 : Calendrier Jour replié ; Catalogue replié/archivé/déployé ; Semaine replié/déployé ; Suivi replié/déployé ; choix sélectionné/non sélectionné |
| DSF / Cards / Exercice `6214:7278` | Contexte, État, Bilatéral, Photo | 10 : Calendrier Jour replié ; Catalogue replié/archivé/déployé ; Semaine replié ; Suivi replié ; choix calendrier/planification sélectionné/non sélectionné ; choix composition sélectionné/non sélectionné |
| DSF / Status & Tags / Ressenti `6234:8895` | Ressenti | Bien, Neutre, Mal |

Les trois composants canoniques sont désormais implantés dans Design system — Fondations, sous les fiches Séance — tous contextes (`6759:13793`), Exercice — tous contextes (`6759:14284`) et Ressenti — indicateur (`6759:14309`). Identifiants conservés. Le booléen `Photo` ne change pas le format : il recouvre l’icône dans la gouttière permanente. Les variantes Catalogue Exercice Déployé (`6214:4237`) et Suivi Séance Déployé (`6214:3968`) sont historiques hors MVP ; aucune suppression de ces objets n’est demandée. Le contrôle de saisie Ressenti de la Synthèse demeure distinct de cet indicateur.

## État avec photo/vidéo et RG-1 à RG-13

| ID | Règle et portée | Statut |
|---|---|---|
| RG-1 | Un seul format au Catalogue et dans les choix d’exercices : gouttière permanente 64, photo si média, icône de nature sinon. Aucun réglage utilisateur de format. | Validé — D-260 |
| RG-2 | La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). | Validé par le propriétaire — 03/10/2026, D-264 |
| RG-3 | Les Séances ne portent jamais de visuel ; aucune photo dans les listes mixtes, le Calendrier ou le Suivi. | Validé définitivement — D-260 |
| RG-4 | Aucun déploiement accessible sur les cartes d’Exercice ou du Suivi, avec ou sans média. Déploiement des Séances conservé au Catalogue et au Calendrier Semaine. | Validé — D-261/D-262 |
| RG-5 | Une seule famille d’icônes de zone corporelle dans toute l’application ; variante Homme/Femme suivant la préférence de Profil définie par RG-10. | Validé |
| RG-6 | La gouttière permanente est 64 ; texte à x=88 ; Catalogue replié/archivé : titre250px et lignes basses207px ; Choix : largeur selon son contrôle de sélection. Le chargement du média ne change pas la hauteur. | Validé ; référence à taille standard |
| RG-7 | Minimum tactile 44 × 44, sans chevauchement. Boutons contextuels visibles 34. Une cible existante de 48 reste conforme et ne doit pas être réduite sans nécessité. | Validé ; révise le minimum commun de D-087, conserve les dimensions spécifiques supérieures |
| RG-8 | Zones des cartes d’Exercice : largeur du cadre = position du contrôle droit − début du texte − 8 px ; troncature finale, une ligne, sans scroll horizontal (D-263). Les Séances conservent leur minimum20. | Clarification validée par correction de l’audit du04/10/2026 ; aucune marge optique20 additionnelle pour ces zones |
| RG-9 | Marges latérales 24 sur la référence écran 402, sauf retraits volontaires documentés. | Validé ; ne remplace pas les règles responsive |
| RG-10 | Profil : champ silhouette facultatif, valeurs homme/femme ; absence = homme affiché. Effet limité à l’icône de zone corporelle, sans filtre, recherche ni autre effet métier. | Validé |
| RG-11 | Image ou couverture vidéo centrée, remplissant le carré 64 sans déformation ; excédent recadré. | Validé |
| RG-12 | Sans média, pendant le chargement ou si le média est indisponible, conserver la gouttière 64, son fond #EEF0F6 et l’icône de nature de l’exercice. | Validé — D-260 |
| RG-13 | Texte alternatif de la vignette : nom de l’exercice. | Validé |

Gouttière permanente : 64 × 64 à x=12, y=14 sur la carte Exercice 354 × 91, rayon 6, fond `#EEF0F6`, icône de nature 24 × 24 ; photo recadrée centrée, sans déformation. Le bloc texte est à x=88, largeur 207. La catégorie et les sélecteurs restent présents. Aucune photo sur les cartes de Calendrier Semaine/Jour ou du Suivi. Zones corporelles tronquées, sans défilement horizontal : cadre de coupe 60 px au Catalogue actif/archivé, 69 px dans les choix calendrier/planification/composition et 145 px en Calendrier Semaine ; calcul sur le contrôle droit réellement présent, avec 8 px entre le cadre de coupe et ce contrôle. La mesure porte sur le cadre de coupe, pas sur le dernier glyphe visible. La valeur145 en Semaine est arrondie depuis144,6 ; le développement calcule la largeur disponible, sans coder une largeur unique.

Profil : silhouettes dans deux cercles de 64, hauteur de silhouette 44, écart 24 ; choisi : bleu `#0508E5`, contour 2 ; non choisi : gris `#9499A8`, contour `#CCD1E0` 1. Les labels accessibles sont « Silhouette homme » / « Silhouette femme ». Le champ facultatif silhouette ne pilote que cette variante ; homme est affiché si absent, sans filtre ni autre effet métier. Dans Ajouter un exercice, les démonstrations montrent trois cercles 34, silhouettes 26 ; aucune nouvelle action ne se déduit de leur présence.

## Boutons contextuels, marges et segmentés

Boutons contextuels : diamètre 34, dessin 20 ; pilules hauteur 34, pastille de catégorie interne 26 ; écart visuel 12 (Catalogues, Suivi, Ajouter un exercice), 10 dans la Composition. Cible transparente 44 × 44 centrée ; pour une pilule, largeur visible +10 et hauteur 44. La rangée est centrée verticalement dans sa zone de contexte existante, sans en changer la hauteur. La Composition conserve la bande Durée + actions de 32 et le texte de durée ; les actions sont à droite et 6 plus bas. Les commandes Aujourd’hui/Planifier du Calendrier restent visuellement 32 : sans zone tactile de 44 ; situation connue et acceptée, à revoir ultérieurement et à développer après T04.

Segmentés à trois choix : largeur 354, padding 4 de chaque côté, deux gaps de 4, trois options de `(354−8−8)/3 = 112,6667`. Le dernier bord tombe à 350 et ne déborde pas. Mesure vérifiée sur `2586:2749`/`2586:2757`. Ce format concerne Jour/Semaine/Mois. Depuis D-324, les Catalogues et sélecteurs de type n’ont que Exercices/Séances : cadre354×42, padding4, gap4, options171×34, libellés16/20 ; voir DSF-SEGMENTES-TITRES-2026-10-07.md. Les autres sélecteurs conservent leurs propres dimensions. Retraits volontaires : chronologie Composition 50/60 ; paramètres et Changement de côté de l’éditeur 39 ; sélecteurs 36 ; modales 12.

## Animations d’appui

| Famille | Référence | Aller | Retour |
|---|---|---|---|
| Lecture ronde | `5988:4922` / `5988:4923` | ×1,2 ; 28 → 33,6 ; 120 ms ease-in | 700 ms Bouncy |
| Onglet individuel | `5988:4933` / `5988:4934` | ×1,2 ; dessin 24 → 28,8 ; 120 ms ease-in | 700 ms Bouncy |
| Action contextuelle | `6310:9684` / `6310:9688` | ×1,2 ; 34 → 40,8 ; 120 ms ease-in | 700 ms Bouncy |
| Terminer | `6000:3303` / `6000:3304` | Appui selon démo, 120 ms ease-in | 700 ms Bouncy |
| Champ éditable | `5988:4950` / `5988:4951` | Appui discret selon démo, 120 ms ease-in | 700 ms Gentle |
| Stepper | `6000:3310` / `6000:3311` / `6012:3303` | Seul + ou − touché réagit, 120 ms ease-in ; valeur/autre bouton fixes | 700 ms Gentle |
| Réduire les animations | `6000:3329` / `6000:3330` | Opacité seule, sans dilatation ; 80 ms ease-in | 150 ms linéaire |
| Barre de navigation complète | `5993:3540` → `3541` → `3542` → `3543` | 200 ms ease-in puis 400 ms ease-out | 700 ms Bouncy |

La source d’interaction complémentaire `specification-animation-appui.md`, **figée v2 du 29/09/2026**, a été relue intégralement. Elle précise une règle déjà arbitrée : **l’action se déclenche au relâchement/tap, sans attendre la fin de l’animation**. La dilatation commence au contact ; le retour commence au relâchement. Cette règle supersède l’ancienne formulation « action après l’animation » et ne doit pas être reposée comme question ouverte. La localisation historique de cette spécification est remplacée par la page actuelle `6016:3303`.

Deux motifs communs : Rebond pour actions rondes, navigation et actions principales rectangulaires ; Discret pour champs/valeurs éditables et boutons de stepper. Mise à l’échelle uniforme de tout l’élément autour de son centre (fond, bord, texte et icône). Petits éléments Rebond : ×1,2 ; Discret : ×1,08 à ×1,2 selon espace disponible. Actions principales rectangulaires et barre entière : ×1,06. Les durées de retour sont des repères de réglage du ressort ; elles ne retardent pas l’action.

Navigation composée : barre à 106 % pendant 200 ms avec déplacement du cadre actif ; arrivée en 400 ms, barre revenue à 100 %, cadre de sélection de 76 × 50 à 82 × 78 (dépassement surtout vertical) ; stabilisation 700 ms Bouncy. La démo d’onglet individuel décrit le motif, celle de barre le comportement composé.

Stepper : tap1 ; maintien≈500ms, répétition150ms, après2s pas5 et après4s pas10 avec arrondi directionnel au multiple. Bip/Compte à rebours/Fin sans accélération. Relâchement arrête et rétablit le pas1 ; saturation aux bornes. Seul le bouton touché s’anime, sans chevauchement.

Réduction des animations : opacité 100 % → environ 55 % → 100 %, sans mise à l’échelle, pour toutes les familles. Annulation par sortie du doigt : pas d’action, retour animé à 100 %. Appuis rapides : interruption du ressort puis reprise depuis l’état courant, sans attendre la fin du rebond.

Les réactions Figma utilisent ON_CLICK puis AFTER_TIMEOUT de 10 ms pour la démonstration ; ce timeout n’est pas une règle métier. La lecture des réactions ne constitue pas un test interactif ni une preuve d’implémentation des gestes dans l’application. Aucun câblage exhaustif des écrans n’est déclaré ici.

## Journal des changements et statuts

| Élément | Avant | Après / cible | Portée | Statut |
|---|---|---|---|---|
| Cartes | Barre verticale, anciens composants DSF | Pastilles de classement, valeurs nues, sets Carte séance/exercice | Catalogues, choix, Semaine, Suivi | Visuel validé |
| Typographie | Titre standard 16 / planche 17 | Titre de ces cartes 15 Semi Bold | Cartes concernées uniquement | Validé ; exception à D-083 |
| Habillage | Rayon standard 12, bord/fond anciens | Rayon 8, fond/bord/ombre ci-dessus | Cartes concernées | Validé |
| Commandes contextuelles | Rangée documentée 108 × 32, gap 8 | Cercles 34, dessins 20, gaps 12/10 | Contextes concernés | Validé |
| Cibles | Minimum commun 48 | Minimum 44 sans chevauchement, dimensions spécifiques 48 conservées | Commandes tactiles | RG-7 validée |
| Navigation | Source exact, people-sharp | Navigation / Bottom, quatre nouveaux vecteurs | Barre basse | Visuel validé |
| Photo | Pas de vignette sur la carte repliée | Vignette 64 sur exercice | Wireframe Photo | Validé, RG-2/RG-4/RG-6/RG-11 à RG-13 |
| Zones corporelles | Ancienne icône body/man-outline | Famille silhouette Homme/Femme | Cartes, Profil, éditeur | Validé, RG-5/RG-10 |
| Bilatéral | Texte « de chaque côté » | Miroir dans les variantes concernées | Exercice Catalogue/choix | Validé |
| Prochaine planification | D-206 impose une ligne conditionnelle | Ligne retirée du rendu | Deux Catalogues | Validé ; D-206 révisée sur l’affichage seul |
| Pause/récupération | Synthèses documentées et D-208 | Absentes de certaines synthèses graphiques | Catalogue, choix, Composition | Validé ; affichage révisé, données conservées ; calculs révisés par D-248/v13 |
| Format de synthèse | Format métier existant | N séries de X / N séries de N rép. / N séries à l’échec | Exercice | Validé |
| Heure / classement | Formats et agrégations existants | 08:00 en Semaine ; Suivi sans heure depuis D-262 ; étiquette sinon catégories hors Suivi | Cartes | Validé |
| Appui | Non décrit dans le DSF documentaire courant | Démonstrations et variantes accessibilité identifiées | Contrôles | Spécification v2 du 29/09 reprise ; action immédiate au relâchement |

## Points ouverts

Les 17 points du 30/09 sont clos ; les situations acceptées ne sont pas rouvertes. La sélection du média représentatif est également close par validation explicite du propriétaire le 03/10/2026 (D-264) : premier média dans l’ordre de la galerie, image de couverture si vidéo.

## Situations connues, acceptées et portée normative

- Les pauses et récupérations ne sont plus affichées dans le corps des cartes du Catalogue, des choix et de Composition ; leurs données, paramètres et calculs restent inchangés. D-208 est révisée sur l’affichage des cartes uniquement. Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement (D-303).
- La prochaine planification n’est plus affichée dans les deux Catalogues. D-206 conserve la planification directe SESSION/ACTIVITY et son calcul ; seule son exigence d’affichage sur carte est révisée.
- Synthèse exercice : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par icône miroir dans les contextes prévus. Badge heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi.
- Une séance sans étiquette affiche ses catégories issues des exercices. Plusieurs catégories/zones : point médian, puis points de suspension selon l’espace ; données complètes conservées. Aucun nouveau champ Catégorie de Séance.
- Les choix n’affichent pas de badge durée. La récurrence du Calendrier Semaine figure dans la carte déployée seulement.
- L’état Archivé de l’exercice existe comme variante, sans écran associé. Suivi — Vue d’ensemble est abandonné pour le MVP et sera conçu ultérieurement.
- La dilatation d’appui est une spécification à implémenter ; l’absence de câblage sur les écrans Figma est acceptée.
- Contraste pastel, nommage icon/<nom>, attributions target/pulse et boutons Calendrier 32 sont acceptés comme décrit ci-dessus.

## Écarts d’assemblage et limites de vérification

| Axe | État constaté | Suite documentée |
|---|---|---|
| Exercice déployé | Wireframe ≈260, composant ≈236 | Cible décrite ; composant et écran d’origine conservés conformément au document source |
| Gouttière Exercice | Propriété Photo du set6214:7278, place permanente64 dans Catalogue/choix | Un seul format ; icône de nature sans média ; aucune photo Calendrier/Suivi/liste mixte |
| Calendrier Jour | Deux variantes vérifiées, 298 × 46/48 | Exception compacte décrite ci-dessous |
| Valeurs d’exemple | Données de maquette | Aucune inférence du type, statut ou catégorie à partir du titre |
| Interactions | Lecture des réactions, pas de recette interactive complète | Ne pas déclarer l’application validée |
| Excel | Aucun classeur actif identifié ; classeur de revue archivé | Archive inchangée |

## Calendrier Jour — contexte compact

**Contexte « Calendrier Jour »** (vue Jour, carte compacte posée sur la grille horaire, à 80 px du bord, à droite de la colonne des heures) : **298 × 46 px** pour une séance et **298 × 48 px** pour une activité ; hauteur ajustée sur l’instance selon l’événement. Éléments : barre de repère colorée de 4 px à gauche (couleur de l’événement, réglée sur l’instance) ; **cercle de nature** de 26 px devant le titre (liste pour une séance, tai-chi pour une activité) ; titre de 13 px en gras ; heure et durée de 11 px, en gris (« 08 h · 13 min ») ; bouton de lecture de 26 px à droite. Il n’y a pas de bouton « Déployer » ni d’état déployé dans cette vue.

Composants : séance `6374:12704`, exercice `6374:12705` ; chacun des deux sets compte désormais 10 variantes. Exception explicite aux cartes standard : largeur 298, position x=80, barre colorée conservée, titre 13 gras. Aucun déploiement. La hauteur de base est ajustable sur l’instance selon l’événement.

| Famille ajoutée | Cartes | Écrans |
|---|---|---|
| Calendrier Jour | 10 | 5 |

Total rapporté par le propriétaire : 133 cartes / 38 écrans / environ 27 interactions. Ce total ne remplace pas une recette des interactions.

## Critères d’acceptation atomiques

1. CAR-01 : aucune barre verticale sur les cartes standard ; Calendrier Jour conserve sa barre de repère de 4.
2. CAR-02 : le titre standard est Inter Semi Bold 15 ; Calendrier Jour utilise 13 gras.
3. CAR-03 : le rayon est 8 et le bord intérieur 0,5 `#CCD1E0`.
4. CAR-04 : les pastilles de classement font 20 et les valeurs utilisent une icône nue 16.
5. CAR-05 : l’archivage remplace Lecture par Restaurer sans changer le sens de l’action.
6. CAR-06 : une carte de choix n’expose aucune action Lecture/Déployer ni badge durée conformément à la décision validée.
7. CAR-07 : Suivi sur deux lignes, hauteur 67 ; statut en haut à droite, indicateur Ressenti 20 × 20 en bas à droite, sans déploiement ni cible tactile.
8. MED-01 : sans média, la gouttière permanente 64 affiche l’icône de nature dans les contextes Catalogue/choix d’exercices.
9. MED-02 : avec média d’exercice, la vignette de référence fait 64 ; la carte n’est pas agrandie du seul fait de la photo.
10. MED-03 : zones d’Exercice tronquées sur une ligne à8 px du contrôle droit ; largeur calculée par contexte, données complètes conservées. Séances : minimum20 inchangé.
11. MED-04 : aucune Séance, liste mixte, carte Calendrier ou Suivi n’affiche de photo.
12. ICO-01 : la nature exercice utilise la posture ; l’haltère représente le nombre d’exercices.
13. ICO-02 : navigation = quatre composants exacts, trait 2 et taille maximale 24.
14. ICO-03 : la palette de sélection respecte les trois états sans recolorer Ressenti/statuts.
15. CTX-01 : bouton contextuel visible 34, dessin 20, cible au moins 44 et sans chevauchement.
16. CTX-02 : gaps 12, ou 10 en Composition ; les cibles existantes de 48 ne sont pas réduites automatiquement.
17. SEG-01 : cadre354, padding4/gap4 ; options112,6667 pour trois choix (Calendrier),171 pour deux choix (Catalogue/sélecteur de type), sans débordement. D-324/326.
18. ANI-01 : l’action contextuelle passe de 34 à 40,8 selon la démonstration.
19. ANI-02 : le retour discret utilise Gentle, le retour rebondissant Bouncy.
20. ANI-03 : avec réduction des animations, aucune dilatation ; seule l’opacité varie.
21. DAT-01 : aucun titre/heure/statut d’exemple ne devient une constante métier ou une règle d’inférence.
22. ANI-04 : l’action se déclenche au relâchement sans attendre le ressort ; une sortie du doigt annule l’action.
23. ANI-05 : un appui rapide interrompt et reprend l’animation depuis son état courant.
24. ANI-06 : Stepper : tap1 ; maintien≈500ms, répétition150ms, après2s pas5 et après4s pas10 avec arrondi directionnel au multiple. Bip/Compte à rebours/Fin sans accélération. Relâchement arrête et rétablit le pas1 ; saturation aux bornes. Seul le bouton touché s’anime, sans chevauchement.
25. DAT-02 : les sources de Routine et les instantanés historiques sont conservés ; les calculs actifs suivent D-248/v13.

26. MED-05 : aucun bouton Déployer sur Exercice, avec ou sans média, ni sur les cartes Suivi.
27. MED-06 : vignette centrée et recadrée sans déformation ; couverture pour la vidéo.
28. MED-07 : chargement et erreur conservent le cadre 64 et la place réservée.
29. MED-08 : texte alternatif égal au nom de l’exercice.
30. PRO-01 : silhouette absente → homme ; femme choisie → icône femme partout où une zone corporelle est représentée.
31. PRO-02 : la silhouette ne filtre aucun résultat et n’influence aucun calcul.
32. JOUR-01 : deux variantes compactes 298 × 46/48, x=80, barre 4, nature 26, titre 13 gras, métadonnées 11, lecture 26.
33. JOUR-02 : aucun contrôle ni état Déployé en Calendrier Jour.
34. CAR-08 : les cartes concernées n’affichent ni pause/récupération ni prochaine planification ; les données et calculs restent disponibles.

Ces critères spécifient la cible ; ils ne constituent pas une déclaration de recette réussie de l’application.

## Réalisation DSF et limites de la livraison

La planche `6364:10602` a été ajoutée à Design system — Fondations avec neuf instances illustratives des composants courants. Les descriptions des sept anciens sets de cartes Catalogue/choix/Calendrier/Suivi sont marquées historiques ; leurs noms et leurs objets sont conservés. Les légendes Navigation, palette et points de contrôle ont été corrigées. Dix-neuf tokens sémantiques ont été créés, reliés aux primitives : `color/cards/{surface,border,archive-surface,archive-border,badge,value-icon,nature-icon,media-placeholder}`, `color/tag/hyrox`, `component/cards/{radius,border-width,badge-radius,selection-text-gap,media-size}` et `component/context/{visual-size,icon-size,touch-target,gap,composition-gap}`.

Le token historique `size/touch-target-min` conserve sa valeur48 pour ne pas réduire les composants déjà liés ; le nouveau token contextuel vaut44. Les 18 variantes des deux sets actifs sont liées aux tokens de fond, bord, rayon et épaisseur. Cette liaison des surfaces ne constitue pas une liaison exhaustive de toutes les couches des écrans. Ce compte décrit le contrôle du30/09. Au03/10, les trois sets sont promus et toutes leurs peintures SOLID sont liées (contrôle ci-dessous) ; les variantes déployées Exercice/Suivi sont historiques hors MVP.

## Contrôle de reprise — 03/10/2026

Baseline documentaire : `main` `d05473055722b0b7677b3604daed5fa02fae1a42`, après PR #285 à #291 ; D-256 à D-259 préservées. Aucune règle de calcul v13 modifiée.

Lecture directe des trois sets : **0 remplissage/contour SOLID en dur, 831 liés**. Le compte antérieur 829 précède l’ajout du fond Calendrier Jour Exercice (remplissage et contour liés). Les tokens sont `color/cards/media-placeholder`, `color/cards/calendar-day-border`, `color/feeling/good` ; valeurs visuelles conservées. Aucun calque nommé Défilement horizontal dans les trois sets. Le fond `6770:13202` du Calendrier Jour Exercice fait 298 × 48 ; la carte reste rayon 8, contour #D6D9E0 de 1 px intérieur.

**130 instances / 38 écrans** dans Prototype MVP. Deux écrans sont des états déployés historiques hors MVP : `1992:8996` et `4738:6355` ; ils ne sont pas réexportés comme cible courante. Les 36 autres captures sont renouvelées ; registre des fichiers dans `Specifications-fonctionnelles/images/README-T03-FIGMA.md`. Les traits Ressenti 1,6/0,9 px sont conservés, sans redessin. Cette inspection/export ne constitue pas une recette de l’application ni une preuve d’absence d’activité interne dans l’ancienne conversation.

Correction du04/10/2026 : conteneurs Titre + durée totale `6214:4075`/`6214:4117` ajustés à la largeur207 du parent par FILL, au lieu de322. Badge en largeur intrinsèque, titre prenant le reste et tronqué ; bord droit du badge x295 sur carte354. Aucune hauteur ni donnée modifiée. Zones Calendrier Semaine `6214:4272` : troncature ENDING, une ligne, largeur145 conservée. Ces deux écarts d’assemblage sont corrigés ; cela ne vaut pas recette applicative.


## Durée des cartes — complément du07/10

[Référence normative courante](DSF-CARTES-DUREE-2026-10-07.md) : durée Catalogue sans cadre/padding, Inter Semi Bold12, droite16 ; propriété Durée ; titre250/lignes basses207 en Exercice, coupes60/69/145 fondées sur207. Composants actifs6214:7278 et6214:7276 ; anciennes cartes5544 ne sont pas les références.
