# DSF courant — Cadence et corrections du05/10 intégrées le06/10/2026

Référence de layout, tokens et qualification documentaire ; aucune règle de calcul issue de Figma. Baseline dépôt6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b. Sources figées dans `archives/cadence-2026-10-06`, relevé courant de Figma `G6RY5Ebhgwb4AHIOYDwwvg`. D-299/D-300. Le présent état supersède les valeurs incompatibles des inventaires DSF antérieurs ; ceux-ci restent des preuves datées.

## 1. Inventaire direct du06/10

| Objet | Relevé courant |
|---|---|
| Variables locales | Primitives350 ; Sémantiques432 ; Responsive4 |
| Styles texte |51, dont styles historiques et nouveau style neutre Inter Semi Bold17 |
| Prototype MVP |133 frames +3 component sets au premier niveau ;5 frames ajoutées à l’inventaire128 du03/10. Présence sur la page ne signifie pas activation produit. |
| Valeur modifiable6944:26423 |4 variantes : Texte13/14 × État Normal/Grisé ;5826:4110,6944:26421,7092:13604,7092:13606 |
| Roulette5544:5146 |4 variantes : Secondes5544:5101, Minutes secondes5544:5118, Fin de séance5826:4290, Secondes avec unité7130:13496 |
| Tri5544:4721 |34×34, rayon17, fond blanc72%, trait75%, dessin20 |
| Photo7021:13149 |icon/photo-ajouter24×24 ; nouveau composant, export applicatif à qualifier |
| Copies résiduelles |6944:26411/26415/26419 existent encore comme archives, pas supprimées |

Les comptes du journal50styles ou ceux du04/09 ne sont pas des mesures simultanées de cet état. Les51styles ne prouvent pas une liaison exhaustive de toutes les propriétés. Les captures renouvelées sont centralisées au chapitre06 ; correspondances dans la matrice du06/10.

## 2. Couleurs et géométrie

| Rôle/code | Référence Figma / valeur | Portée |
|---|---|---|
| divider | border#E0E3E8 | Nom conservé, valeur alignée |
| iconNeutral | textSecondary#595E66 | Nom conservé, icônes neutres |
| mediaSurface | surface#F5F7FA | Nom conservé |
| navigation/pill | surfaceSubtle#F9FAFC | Surface de navigation |
| textLabel | color/text-label#46464C | Libellés secondaires selon contexte |
| textTertiary | color/text-tertiary#7A7A80 | Texte tertiaire |
| cardsBorder | color/cards/border#CCD1E0 | Bordure renforcée des cartes |
| onPrimary | color/on-primary#FFFFFF | Texte/icône sur primaire |
| primarySoft | color/primary-soft#8283F2 | Décor ; ne remplace pas selection#5F60EE pour du texte blanc normal |
| calendarMarker | color/calendar-marker#1F9E7A | Point de séance Calendrier ; positive#4F9F83 conservé ailleurs |
| breakpoint | color/action/breakpoint#ED7314 | Point d’arrêt |
| danger | #D92D20 | Fond/bord des actions destructives ; remplaceE62B1E/DB2E2E |
| overlayScrim | color/overlay/scrim#1F2129,alpha34% | Voile modal |
| compositionDraggedCardShadow | color/overlay-scrim#14171F | Teinte d’ombre, alpha d’effet propre ; jamais fusionnée au voile |
| Espacements |10,14,20 ajoutés à l’échelle | Compléments, pas remplacement global des marges |
| Rayons |14,17 ajoutés |17 notamment Tri |

Fusions déclarées par le journal§5.3 :

| Token supprimé | Ancienne valeur | Cible | Valeur courante | Écart source | Usage |
|---|---|---|---|---:|---|
| color/cards/badge | #F4F4F8 | color/surface | #F5F7FA | 4 | Badge replié |
| color/cards/surface | #FCFCFE | color/surface-subtle | #F9FAFC | 4 | Surface des cartes |
| color/cards/archive-surface | `#F6F6F6` dans l’ancienne prescription documentaire (chapitres06/13) ; valeur historique du token non attestée par le journal | color/surface | #F5F7FA | 4 | Surface archivée |
| color/progress-track | #BABDD1 | color/disabled | #BEC2CC | 8 | Repères chronomètre |
| color/text-muted | #6B6E7A | color/text-tertiary | #7A7A80 | 20 | Texte atténué |
| color/card-surface | #FFFFFF | color/background | #FFFFFF | 0 | Surface blanche |
| color/stroke-inverse | #FFFFFF | color/on-primary | #FFFFFF | 0 | Traits inverses |
| color/icon-on-primary | #FFFFFF | color/on-primary | #FFFFFF | 0 | Icônes sur primaire |

Les écarts sont ceux du journal, pas une nouvelle mesure colorimétrique. `color/text-on-primary` est renommé `color/on-primary` : rôle étendu aux textes, formes et traits.

### Opacités de présentation

Valeurs du journal §7.1/§9 et du brief annexe H ; aucune nouvelle règle métier. L’opacité d’un nœud et celle de son remplissage sont distinctes.

| Élément | Couleur / opacité | Portée |
|---|---|---|
| Contrôle segmenté | Blanc, remplissage 50 % | Surface du contrôle |
| Tri DSF | Blanc 72 % ; trait disabled #BEC2CC 75 % | Master 34 × 34, rayon 17 |
| Rappel / Option | #FBFAF7, 82 % | Fond de l’option |
| Repères principaux 3 h / 6 h / 9 h | disabled #BEC2CC, remplissage 62 % | Cible confirmée au nouveau contrôle du 06/10 : 171 repères à 62 % |
| 16 petits traits du chronomètre | Nœud 40 % | Variantes visibles ; variantes masquées d’animation restent à 0 % |
| Libellé Renforcement… | textTertiary #7A7A80, 75 % | Usage contextualisé |
| Textes de roulette périphériques | #1A1A1F, 20 % ou 45 % selon rangée | Ne pas appliquer indistinctement à la sélection centrale |

## 3. Typographie par rôle

Inter pour interface, Roboto Condensed volontaire pour chronomètres/compteurs. Inter Auto se traduit par son rendu explicite (en général round(1,21×taille)), avec maintien de chaque interligne explicitement défini dans Figma. Cette règle n’est pas appliquée aveuglément à Roboto ni aux styles historiques.

| Rôle | Cible / mesure | Qualification |
|---|---|---|
| Titres de cartes standard | Inter Semi Bold15/18 | Masters alignés à15 selon rapport ; rôle distinct de cardTitle |
| compactCardTitle |15/18 | Décision du propriétaire consignée dans points§1 ; pas de nouvel arbitrage |
| cardTitle hors nouvelles cartes |16, rôle historique | Valeur conservée ; ne pas forcer les cartes15 à16 |
| Phrase paramètres | Inter13/20, valeurs en gras | Mesuré sur les nouvelles frames ; hauteur auto, largeur324 sur402 |
| Chronomètre principal | Roboto Condensed Bold100, Auto | Style courant ; interligne effectif à mesurer par contexte lors de l’alignement code |
| Compteurs | Roboto Condensed Bold/SemiBold30 | Rôles à mapper selon usage ; pas remplacement par taille seule |
| Indication média | Roboto Condensed Medium24 | Style DSF courant |
| Chronomètre secondaire5017:6051 | Inter Semi Bold17, style neutre | Ne plus le mapper à Card title17 obsolète |
| Caption | Inter Regular11/13 | Cible établie par la règle D2 : round(1,21×11)=13 ; usages Calendrier Jour/Semaine relus (1992:5552/5554, 1992:5125/5131), Inter11 Auto. Anciennes valeurs code14/doc16 à aligner dans le lot code |
| Navigation label | Inter Regular11/13 | Usages de Navigation / Bottom relus (I2565:968;6298:11912, I2565:1597;6298:12073, 5828:3139), Inter11 Auto ; traduction selon D2. Ancien style local Navigation label11/16 non représentatif de ces usages |
| Exceptions |14/18 ;10/16 ; Roboto16/22 ; Inter12/15 | Interlignes explicites à conserver par rôle |

Ne pas remplacer toutes les tailles15/16/17 ensemble. `tokens.ts`, chargement des polices et `ProfileStepper.tsx` devront être alignés dans un lot code ; aucun de ces fichiers n’est changé par cette révision documentaire.

## 4. Composition des écrans et contrôles

En-tête fixe : propriétés Titre et Démarcation ; barre d’état9:41 purement décorative Figma, rendue par le système sur appareil. Respecter les Safe Areas réelles, pas une constante d’en-tête95px. Poignée de modale et Progression par tours sont des composants DSF ; pas de réinvention du shell.

Cadence : ligne commune REPETITIONS, valeur Aucune ou secondes, sous la cible uniforme et avant Pause ; indentation52px contre36 pour groupe sur402, séparateurs314 ; roulette avec unité immédiatement sous la ligne, contenu poussé dans le flux. En variable : ligne commune hors tableau, aucun contrôle par Série. Valeur Grisé signifie indisponibilité effective ; Aucune reste sélectionnable. Suppression par sélection de « Aucun » dans la même roulette (clarification du propriétaire le06/10), suivie de✓ ; retour à absence/null sur toutes les Séries. Le libellé de ligne est Aucune. Le viewport centré sur4 n’affiche qu’un extrait des valeurs : aucune exigence de bouton supplémentaire ni de prototype interactif.

Phrase unique Inter13/20, valeurs en gras ; zone entière cliquable ; aucun segment éditable. Les textes des frames13/14/phrase longue servent de témoins de layout ; Phrase v1 gouverne le texte généré et le calcul métier fournit le total. Leur harmonisation éditoriale Figma est facultative pour le développement tant que le layout ne change pas. Les états avant/après nominal et Pause/Reprise réemploient le layout d’exécution ; les spécifications suffisent, sans trois frames supplémentaires exigées.

Séance sans photo ; liste mixte sans photo ; Exercice Catalogue/choix garde la gouttière64, premier média ou icône, hauteur inchangée. Circuit structure de Séance et N tours répétition ; «N circuits» sur l’écran de composition `4893:6675` est un écart de libellé, pas une nouvelle règle. Catalogue : Parcours, hors MVP ; ancien arbre Un circuit retiré.

## 5. Corrections A01–A15 : provenance et suite

| ID | Statut documentaire courant | Preuve / limite |
|---|---|---|
| A01 | Correction confirmée le06/10 :171 repères à62%, sans surcharge sur les8instances concernées | Lecture des11pages ;69Prototype MVP+69Communautaire+9Fondations+15Validation responsive+9Référence responsive. Huit composants maîtres : #BEC2CC, remplissage62%, aucune variable liée. Douze repères des4instances visibles exportés enPNG : alpha158/255, cohérent avec62%. Les4autres jeux restent masqués à0% de nœud ; leur remplissage est aussi62%. Voir rapport VERIFICATION_F09_REPERES |
| A02 | Clos par décision du propriétaire : recréation manuelle en temps voulu | Les §1 et §5 du rapport sont cohérents ; base410/285 datée. Présence des interactions non contrôlée et non requise pour le développement |
| A03 | Mapping partiel, sources probables | Comparaison de tracés nécessaire avant manifeste canonique |
| A04 | Dimensions navigation à qualifier | Sources et viewBox divergent du manifeste ; conserver exports existants |
| A05 | Code à aligner | Plus/moins textuels de ProfileStepper, aucun correctif code dans cette PR |
| A06 | Documentation corrigée | Divider/iconNeutral ; code restant à aligner |
| A07 | Rationalisation documentée ; vérification ciblée complétée | Caption/navLabel11/13 issus des usages Inter11 Auto et D2 ; exceptions explicites et métriques Roboto préservées. Chargement des polices et migration des tokens relèvent du code |
| A08 | Correction Figma documentée ; décisions conservées |40 masters à15 selon rapport, ancien Card title17 marqué obsolète dans le style courant ; compactCardTitle15/18, cardTitle16 hors nouvelles cartes ; aucun arbitrage rouvert |
| A09 | Correction déclarée, composant24×24 retrouvé |38 glyphes remplacés selon rapport ; pas38 nouvelles vérifications indépendantes |
| A10 | Archivage confirmé par inventaire |3 masters résiduels encore présents, aucune suppression |
| A11 | Correction mesurée directement | Tri34×34/r17/72%/75% |
| A12 | Registre sans suppression |44 tokens sans usage détecté :40réserve+4couleurs ; absence d’usage≠suppression autorisée |
| A13 | Deux scrims documentés | Voile et ombre, aucune fusion |
| A14 | Préexistant selon rapport | Débordement15px dans35écrans, parent clippé ; aucune retouche |
| A15 | Version Figma nommée non démontrée | À enregistrer par propriétaire après contrôle ; captures du06/10 fournissent une preuve datée, pas cette version nommée |

## 6. Assets : mapping préparatoire, aucune réécriture du manifeste

Au baseline, rapport :27SVG pour25entrées, deux fichiers hors manifeste (`select-field-chevron.svg`, `label-outline.svg`). Le problème déclaré porte sur traçabilité/dimensions, pas une preuve d’icônes toutes absentes.

| Rôle | Source candidate / état | Suite |
|---|---|---|
| action.add |6959:15706 icon/ajouter24×24 | Comparer tracé etviewBox avant remplacer |
| control.back |6959:15940 icon/retour24×24 | Comparer tracé |
| wheel.action.cancel/validate | Primitives Icône d’action de modale | Qualifier variantes exactes etexports |
| navigation.sessions active/inactive |6296:10468 icon/catalogue | Qualifier rôle etviewBox |
| action.start ; control.chevronDown ; control.chevronUp ; control.repetitionPullDown ; state.selected ; composition.fixed | Sources actuelles non établies dans le rapport | Identifier composants/tracés ; aucune invention ni export déclaré validé |
| Navigation Calendrier | Sources24×24 vs manifeste26×26 | Qualifier dimensions avant remplacement |
| Navigation Suivi | Sources24×19,3846 vs26×21 | Qualifier dimensions |
| Navigation Profil | Sources21,5172×24 vs26×29 | Qualifier dimensions |
| Nouveaux vecteurs |tri6939:26387(20²),photo7021:13149(24²),suivant/précédent/ajouter/fermer/retour | Export et raccordement dans lot assets explicite |

Le présent document ne certifie pas que le manifeste est prêt à être remplacé. Les fichiers sources et exports applicatifs restent inchangés. Les animations Smart Animate ne sont pas des règles de développement ; le comportement du retournement vient des contrats.

### Vérification et dépôt des assets — 06/10/2026

Les25entrées du manifeste historique ont chacune un SVG présent dans `assets/icons/`, vérifié aussi par l’inventaire GitHub sur main et sur la branche documentaire. Les six fichiers précédemment regroupés comme sources non établies sont : `action-start.svg`, `control-chevron-down.svg`, `control-chevron-up.svg`, `control-repetition-pull-down.svg`, `state-selected.svg`, `composition-fixed.svg`. Ils ne sont pas manquants ; leurs anciens IDs Figma absents restent un sujet de traçabilité, pas une demande de dessin ni un motif de blocage documentaire.

Les exports courants sont déposés et tracés dans [figma-current-exports.json](../assets/icons/figma-current-exports.json) :

| Composant Figma | Fichier exact dans le dépôt | Résultat |
|---|---|---|
| icon/tri6939:26387 | [icon-tri.svg](../assets/icons/icon-tri.svg) | Nouveau SVG20×20 |
| icon/suivant6959:15460 | [icon-suivant.svg](../assets/icons/icon-suivant.svg) | Nouveau SVG24×24 |
| icon/précédent6959:15579 | [icon-precedent.svg](../assets/icons/icon-precedent.svg) | Nouveau SVG24×24 |
| icon/ajouter6959:15706 | [action-add.svg](../assets/icons/action-add.svg) | Déjà présent, identité octet pour octet ; aucun doublon ajouté |
| icon/fermer6959:15825 | [icon-fermer.svg](../assets/icons/icon-fermer.svg) | Nouveau SVG24×24 |
| icon/retour6959:15940 | [icon-retour.svg](../assets/icons/icon-retour.svg) | Nouveau SVG24×24 ; control-back existant conservé |
| icon/photo-ajouter7021:13149 | [icon-photo-ajouter.svg](../assets/icons/icon-photo-ajouter.svg) | Nouveau SVG24×24 |

Exports SVG_STRING directs, XML/viewBox et empreintes vérifiés, rendu des sept sources relu. Aucun dessin recréé approximativement. Les nouveaux fichiers sont disponibles pour le lot code ; le manifeste historique consommé par l’application et le branchement runtime restent inchangés. Les différences de dimensions des anciennes navigations sont un écart à résoudre lors de cet alignement, pas une absence d’assets.

Les interactions du prototype sont hors conditions de livraison documentaire ou de développement : le journal§7 en confie déjà la reprise au propriétaire, sans impact sur le développement. Aucun contrôle de présence d’interactions supplémentaire n’est requis.

Les SVG exportés conservent les couleurs littérales de Figma (#1F2023 suivant/précédent, #141414 fermer/retour, #9499A8 tri, #595E66 photo, #0508E5 ajouter). Lors du futur branchement runtime, leur teinte doit être fournie par le token correspondant au rôle et à l’état ; ne pas transformer ces littéraux en nouvelles couleurs canoniques. Les exports sources restent intacts.

## 7. Correspondance des composants après rationalisation

Noms et identifiants relus directement dans Figma le 06/10. Les 659 migrations et 31 familles restaurées sont des volumes du journal §6, pas un recomptage des instances. Les 13 lignes ci-dessous détaillent les familles archivées, y compris le bouton désactivé séparé ; les anciennes déclinaisons Segmenté /3/1 et /2/1 suivent le même set cible. L’archive contient également les trois masters résiduels : sa taille ne doit pas être confondue avec le nombre de familles fusionnées.

| Ancien nom archivé | Nom courant | Identifiant | Variantes / exception |
|---|---|---|---|
| Controls / Switch — Source exact | DSF / Controls / Interrupteur | `5544:4632` | Actif / Inactif |
| Controls / Disclosure — Source exact | DSF / Controls / Disclosure | `5544:4650` | Replié / Déployé / Désactivé |
| Modal / Header Action — Source exact | DSF / Actions / Fermer et valider | `5544:4541` | Fermer / Valider |
| Header / Sound Control — Source exact | DSF / Controls / Son | `5544:4770` | Activé / Désactivé |
| Header / Voice Control — Source exact | DSF / Controls / Voix | `5544:4790` | Activée / Désactivée |
| Indicator / Sides — Source exact | DSF / Status & Tags / Indicateur de côté | `5544:6944` | Droite → Gauche / Gauche → Droite |
| Overlay / Decision Dialog | DSF / Overlays / Confirmation | `5544:6095` | Primaire / Destructive / Trois actions / Abandon ; 6 dialogues longs conservés dans la primitive ancienne |
| Button / Primary — Source exact | DSF / Actions / Bouton primaire | `5544:4522` | Actif / Désactivé |
| Button / Primary — Source exact/Disabled | DSF / Actions / Bouton primaire | `5544:4522` | Désactivé |
| Controls / Segmented | DSF / Controls / Segmenté | `5548:9818` | 6 variantes : Deux détaillé (1/2), Trois (1/2/3), Deux (1) |
| Activity / Name Field — Source exact | DSF / Forms / Nom | `5544:4821` | Exercice / Profil / Séance / Étiquette / Nom exercice champ vide |
| Selection / Category Tag | DSF / Status & Tags / Catégorie sélectionnable | `5548:10518` | Sélectionnée / Non sélectionnée × standard / Libellé seul |
| Status / Badge — Source exact | DSF / Status & Tags / Statut d’exécution | `5544:6902` | Catalogue / Planifiée / Exécutée / Archivée / Partielle / Terminée / Interrompue |

Les 18 renommages conservent leurs identifiants ; les primitives « ancien » restent des exceptions identifiées, pas la nouvelle référence générique.

| Ancien nom | Nom courant conservé | Identifiant | Variantes / statut |
|---|---|---|---|
| Icon / Modal Action — Source exact | DSF / Primitives / Icône d’action de modale | `4155:6201` | Cancel / Validate |
| Icon / Tour | DSF / Primitives / Icône de tour | `3066:4685` | Unique |
| Icon / Structure / Movable | DSF / Primitives / Icône de structure — déplaçable | `3066:4676` | Unique |
| Icon / Search | DSF / Primitives / Icône de recherche | `3847:5508` | Unique |
| Overlay / Decision Dialog/Icon/Add — Source exact | DSF / Primitives / Icône d’ajout — dialogue | `4173:6713` | Unique |
| Calendrier / Jour mensuel | DSF / Primitives / Jour mensuel | `138:14` | Unique |
| Composition / Activity Row | DSF / Primitives / Composition — ligne d’activité | `2588:2679` | Unique |
| Composition / Boundary Activity — Source exact | DSF / Primitives / Composition — activité de bord | `2537:1475` | Initial countdown / End session |
| Action / Categories — Source exact/Create | DSF / Primitives / Action — créer une catégorie | `4152:6182` | Unique |
| Action / Back | DSF / Primitives / Action — retour | `2624:3105` | Unique |
| Forms / Text Field — Source exact | DSF / Primitives / Champ de texte | `2537:1075` | Single line / Multiline |
| Header / Fixed | DSF / Primitives / En-tête fixe (ancien) | `2581:2740` | Standard Back Off / On / Close ; exception résiduelle |
| Header / Fixed/Execution/On | DSF / Primitives / En-tête fixe — exécution | `2581:2727` | 5 en-têtes conservés selon journal |
| Overlay / Decision Dialog | DSF / Primitives / Dialogue de décision (ancien) | `2590:2961` | 4 variantes ; 6 instances longues conservées selon journal |
| Indicator / Sides — Source exact | DSF / Primitives / Indicateur de côté (ancien) | `3706:5020` | RightLeft / LeftRight |
| Shell / Screen | DSF / Gabarits / Écran | `2718:69` | Context On/Off × Bottom Navigation/Action |
| Shell / Execution | DSF / Gabarits / Exécution | `2700:94` | Run / Summary |
| Shell / Modal Fullscreen | DSF / Gabarits / Modale plein écran | `2700:75` | Unique |

La nouvelle navigation est `DSF / Navigation / Barre inférieure` (`5544:4441`), états Catalogue / Calendrier / Suivi / Profil. L’en-tête courant est `DSF / Navigation / En-tête fixe` (`5544:4504`), états Standard / Retour / Fermer, propriétés Titre et Démarcation ; la barre d’état décorative est `6955:26633`. L’en-tête de modale courant est `DSF / Overlays / En-tête de modale` (`5544:5567`), variantes Classification / Roulette / Sélection. La présence d’une variante ne l’active pas dans le produit.

Le nouveau contrôle F-09 lève la réserve de persistance précédente ; preuves et limites dans [2026-10-06_VERIFICATION_F09_REPERES.md](../.github/orchestration/reports/2026-10-06_VERIFICATION_F09_REPERES.md). Les rapports précédents restent des relevés datés.

## Coche de sélection multiple — clôture H-10

La carte courante `DSF / Cards / Exercice` `6214:4425` (Choix composition, Sélectionné) contient la case20 ×20 `6214:4423` et la coche `6214:4424`. Le dessin courant est conservé sous forme de [SVG vectorisé](../assets/icons/selection-check.svg), export exact du glyphe, tracé10 ×8 dans un slot20 ×20 ; la case bleue `#0508E5`, rayon6, appartient au contrôle hôte. Les dimensions24 ×24 et le fond `#5F60EE` de l’ancien composant supprimé ne s’appliquent plus à cet usage. Voir chapitre12 et [preuves H-10](../.github/orchestration/reports/2026-10-06_CLOTURE_H10_COCHE_SELECTION.md).
