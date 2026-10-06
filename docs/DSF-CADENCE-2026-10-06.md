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

| Token supprimé | Cible |
|---|---|
|color/cards/badge|color/surface|
|color/cards/surface|color/surface-subtle|
|color/cards/archive-surface|color/surface|
|color/progress-track|color/disabled|
|color/text-muted|color/text-tertiary|
|color/card-surface|color/background|
|color/stroke-inverse|color/on-primary|
|color/icon-on-primary|color/on-primary|


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
| Caption |11, cible de ligne13 | Source la donne à confirmer au plan ; code11/14 et ancienne doc11/16 ne constituent pas qualification |
| Navigation label | Rôle/interligne à vérifier | Recommandation13 non assimilée à décision mesurée |
| Exceptions |14/18 ;10/16 ; Roboto16/22 ; Inter12/15 | Interlignes explicites à conserver par rôle |

Ne pas remplacer toutes les tailles15/16/17 ensemble. `tokens.ts`, chargement des polices et `ProfileStepper.tsx` devront être alignés dans un lot code ; aucun de ces fichiers n’est changé par cette révision documentaire.

## 4. Composition des écrans et contrôles

En-tête fixe : propriétés Titre et Démarcation ; barre d’état9:41 purement décorative Figma, rendue par le système sur appareil. Respecter les Safe Areas réelles, pas une constante d’en-tête95px. Poignée de modale et Progression par tours sont des composants DSF ; pas de réinvention du shell.

Cadence : ligne commune REPETITIONS, valeur Aucune ou secondes, sous la cible uniforme et avant Pause ; indentation52px contre36 pour groupe sur402, séparateurs314 ; roulette avec unité immédiatement sous la ligne, contenu poussé dans le flux. En variable : ligne commune hors tableau, aucun contrôle par Série. Valeur Grisé signifie indisponibilité effective ; Aucune reste sélectionnable. Suppression vers Aucune fonctionnellement définie mais contrôle non identifié au relevé : réserve graphique CAD-V01, pas création d’un bouton arbitraire.

Phrase unique Inter13/20, valeurs en gras ; zone entière cliquable ; aucun segment éditable. Les textes restés anciens dans les frames13/14/phrase longue sont des démonstrations et doivent être rapprochés de Phrase v1, sans importer leurs totaux. Les trois états d’exécution cadencée déclarés manquants ne sont pas retrouvés parmi les frames courantes ; suivre CAD-V02–04.

Séance sans photo ; liste mixte sans photo ; Exercice Catalogue/choix garde la gouttière64, premier média ou icône, hauteur inchangée. Circuit structure de Séance et N tours répétition ; «N circuits» présent dans un exemple serait un écart de libellé, pas une nouvelle règle. Catalogue : Parcours, hors MVP ; ancien arbre Un circuit retiré.

## 5. Corrections A01–A15 : provenance et suite

| ID | Statut documentaire courant | Preuve / limite |
|---|---|---|
| A01 | Correction déclarée :6 repères revenus à62% | Rapport ; pas de prétention de nouvelle revue indépendante complète |
| A02 | Réparation manuelle confiée au propriétaire, non démontrée | Rapport contradictoire entre§1 et§5 ; base410/285 conservée comme mesure datée ; non bloquant pour développement |
| A03 | Mapping partiel, sources probables | Comparaison de tracés nécessaire avant manifeste canonique |
| A04 | Dimensions navigation à qualifier | Sources et viewBox divergent du manifeste ; conserver exports existants |
| A05 | Code à aligner | Plus/moins textuels de ProfileStepper, aucun correctif code dans cette PR |
| A06 | Documentation corrigée | Divider/iconNeutral ; code restant à aligner |
| A07 | Rôles documentés | Roboto à charger ; interlignes/roles non qualifiés explicités |
| A08 | Correction Figma déclarée, témoin chrono17 relu |40 masters à15 selon rapport ; compactCardTitle15/18 déjà décidé ; caption reste à qualifier |
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
