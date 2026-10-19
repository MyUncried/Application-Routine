# KODJO — PRE-5 : réponses QP5-01 à QP5-09, arbitrages et consignes consolidées pour BMAD

**Date :** 19 octobre 2026  
**Dépôt :** `MyUncried/Application-Routine`  
**Statut :** document de transmission actualisé. **Arbitrages explicites de l’utilisateur : QP5-01, présentation de QP5-07, charge en mode Répétitions et navigation du clavier numérique.** Les autres QP5 comportent des réponses recommandées fondées sur les sources ; l’accord global QP5-02 à QP5-09 reste à confirmer avant PRD/stories.  
**Base de modification :** `KODJO_PRE5_Reponses_QP5-01_a_QP5-09_et_consigne_BMAD_2026-10-19.md` (nouveau fichier ; original préservé).  
**Règle directrice :** ne pas changer ce qui existe déjà lorsque les changements demandés ne le remettent pas en cause.

> **Actualisation QP5-01 :** la décision exprimée après la revue initiale remplace la proposition antérieure de conversion réversible des descriptions historiques. Il n'existe actuellement que trois ou quatre exercices créés ; aucun chantier spécifique de migration de leurs descriptions n'est justifié.

## 1. Réponses recommandées

Sur les neuf propositions de BMAD, la plupart peuvent être validées, mais certaines nécessitent une correction pour respecter les décisions existantes.

Deux points sont particulièrement importants :

- **QP5-04 — Phases :** la proposition de BMAD ajoute des restrictions sur les durées et sur les phases à zéro qui ne figurent pas telles quelles dans la spécification consolidée.
- **QP5-09 — Phrase de synthèse :** la spécification des phases du 16 octobre prévoit explicitement d'afficher le détail des phases entre parenthèses. La proposition de BMAD l'oublie. Il faut conserver les 276 formulations existantes, mais y intégrer le complément prévu pour les phases, sans refondre le générateur.

**Ne pas assimiler ces recommandations à un accord global déjà donné.** Les modifications explicitement décidées par l’utilisateur ci-dessous priment les anciennes propositions.

| Question | Avis | Réponse proposée et justification |
|---|---|---|
| **QP5-01 — Description historique** | **Valider avec simplification (décision actualisée)** | Remplacer la description libre par les étapes numérotées. Réutiliser simplement le texte existant si possible, mais **ne pas développer de migration dédiée, de conversion sophistiquée ni de mécanisme de retour à l'ancien format**. Accepter de recréer manuellement les trois ou quatre descriptions si nécessaire. Ne pas ouvrir de story propre à cette conversion. Cela ne dispense pas de conserver les autres données existantes. |
| **QP5-02 — Étapes vides et 1 000 caractères** | **Valider** | Retirer les étapes vides à **Terminer**, renuméroter automatiquement et permettre la suppression d'une étape vide par retour arrière. Limite de 1 000 caractères sur **l'ensemble des textes des étapes**, hors numérotation générée par l'interface. Préserver les étapes non vides et leur ordre. |
| **QP5-03 — À l'échec dans une phase** | **Valider** | Une phase est exclusivement chronométrée. Le choix **À l'échec** s'applique à la Série, pas aux phases. Décisions D-370 et D-412. Roue numérique seule. |
| **QP5-04 — Bornes et comportements des phases** | **Corriger ; précision complémentaire en attente** | Phase positive : minimum 1 s, pas 1 s ; la somme des phases constitue la durée de série et suit ses bornes applicables, sans inventer de plafond indépendant par phase. **Avec** reprend la durée de série existante ; sinon « Phase 1 » est à renseigner. Sous format à durée imposée, dernière phase calculée. Les phases temporaires à 0 s sont retirées sans message à la validation ; si la cible résultante demeure absente ou invalide, appliquer la validation existante. **Sans** avec plusieurs phases : reprendre leur somme en durée de série est proposé, mais reste à confirmer ; le cas distinct « suppression de la dernière phase » conserve la durée de cette dernière (D-371). |
| **QP5-05 — Hauteurs des lignes** | **Valider sous réserve tactile** | 36 px pour les lignes des deux tableaux et 44 pt pour les autres lignes de la feuille. Conserver les exigences d'accessibilité et de cibles tactiles, sans chevauchement. Si les 36 px empêchent réellement une interaction fiable, vérifier sur appareil avant de modifier la géométrie. |
| **QP5-06 — Contrôle segmenté** | **Recommandation technique actualisée** | **Réutiliser par défaut le composant React Native existant** `src/shared/ui/SegmentedControl.tsx`. Le contrôle natif d’`@expo/ui` 57 existe, mais une comparaison rapide ne doit déboucher sur un remplacement que s’il diminue réellement la complexité et respecte visuel, états, chevrons, accessibilité et comportement. Ni réécriture générale ni nouveau composant sans nécessité. |
| **QP5-07 — Enchainement** | **Présentation arbitrée explicitement** | Conserver le contrôle segmenté **en ligne, dans le cadre Côtés, aux dimensions Figma**. Afficher deux libellés définitifs : **« Un côté après l’autre »** et **« Les deux côtés à chaque série »**. **Réduire explicitement la taille de police** pour loger les textes dans le contrôle existant ; centrer horizontalement/verticalement **sans troncature**. Aucun sous-titre D/G, aucune nouvelle notation C1S1/C2S1. Visible avec Changement de côté = Avec et **N > 1** (D-415). Règles d’exécution et largeur conservées ; taille exacte de police à régler sur appareil, sans changement automatique de géométrie. |
| **QP5-08 — Répétitions et À l'échec** | **Valider** | Masquer la ligne **Répétitions** en séries identiques lorsque la Condition d'arrêt est **À l'échec**. Aucun nombre prescrit n'existe dans ce cas (RM-248). Préserver les mécanismes existants de restauration des valeurs lors des changements de condition. |
| **QP5-09 — Synthèse des phases** | **Corriger** | Préserver les **276 formulations historiques**, mais ajouter après la durée de série la parenthèse détaillant les phases, comme prévu dans la spécification consolidée du 16 octobre, §4.1. Pas de refonte globale du générateur. |

### Précision propre à QP5-01 — Simplification validée par le propriétaire

Compte tenu des trois ou quatre exercices existants, il n'est pas justifié de développer un mécanisme spécifique de migration ou de conversion réversible.

- Remplacer la description libre par la nouvelle description en étapes numérotées.
- Réutiliser le texte existant si cela se fait simplement avec les mécanismes disponibles.
- Ne pas développer de migration spécifique, de conversion sophistiquée ni de mécanisme de retour à l'ancien format.
- Accepter de recréer manuellement les quelques descriptions existantes si nécessaire.

**Consigne BMAD :** privilégier la simplicité d'implémentation. La compatibilité des anciennes descriptions ne doit pas générer de story ni de travail supplémentaire significatif.

Cette simplification concerne **uniquement les descriptions historiques**, pas la conservation des paramètres d'exécution et des autres données existantes.

## 2. Précisions importantes

### QP5-04 — Ne pas confondre les bornes des phases et de la série

La spécification autorise une phase de **1 s**, alors que la cible d'une série suit ses propres bornes. Elle prévoit également deux comportements différents : durée libre ou durée imposée par un format.

Par exemple, sous Tabata, une durée de 20 s donne **12 + 8 s** si la première phase est réglée à 12 s. La dernière durée est calculée. Un zéro temporaire peut être supprimé lors de la validation, sans générer d'erreur artificielle.

La limite de **3 535 s** est celle de la cible de série existante. Son application exacte à une somme de phases reste à formaliser, plutôt que de la transformer en nouvelle limite indépendante.

**Références :** spécification consolidée des phases (16 octobre), décisions D-370 à D-375, chapitres 08, 09 et 10 du dépôt.

### QP5-07 — Arbitrage visuel définitif, sans solution provisoire

La frame Figma actuelle **`8328:38193`** montre encore les notations `D1`, `D2`, `G1`, `G2`, contraires à **D-407** (pas de désignation anatomique). Ce décalage **ne bloque pas** PRE-5 : les deux enchaînements sont fonctionnellement établis et restent identiques.

**Décision explicite de l’utilisateur :** conserver le contrôle segmenté en ligne et sa largeur ; afficher les libellés complets **« Un côté après l’autre »** / **« Les deux côtés à chaque série »** ; **diminuer la taille de police** pour les faire tenir, textes centrés sans troncature. Aucune étape provisoire, aucune notation anatomique D/G, aucun nouveau comportement métier. Vérifier uniquement le rendu effectif sur l’appareil ; le détail graphique Figma ancien devra être mis en cohérence lors de la consolidation documentaire/visuelle.

Référence Figma : [Création activité — Paramètres, changement de côté déployé](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38193).

### QP5-06 — Priorité à la réutilisation du composant existant

Le dépôt utilise `@expo/ui ~57.0.13` et Expo 57. Le contrôle SwiftUI `Picker` en style `segmented` est disponible dans cet écosystème.

Le composant React Native **`src/shared/ui/SegmentedControl.tsx`** existe déjà dans le dépôt. Il possède notamment une gestion des options désactivées et des styles spécifiques.

Le composant personnalisé a été créé alors que le natif était disponible ; sa justification historique tient notamment à la fidélité Figma et à la consolidation de deux anciennes variantes. **Pour PRE-5, conserver l’existant par défaut.** Une comparaison courte avec le natif est possible, mais un remplacement n’est justifié que si l’avantage est démontré, sans perte visuelle, fonctionnelle ou d’accessibilité. Ne pas transformer QP5-06 en story de refonte.

Référence code : [`src/shared/ui/SegmentedControl.tsx`](https://github.com/MyUncried/Application-Routine/blob/main/src/shared/ui/SegmentedControl.tsx).

### Complément utilisateur — Charge en mode Répétitions (décision explicite)

**Le concept de Charge s’applique en mode Répétitions exactement comme en mode Durée**, tant pour les **séries identiques** (charge commune) que pour les **séries variables** (charge associée à chaque ligne). Les comportements **Avec/Sans**, saisie décimale au clavier, incrément de 0,25 kg, activation, conservation des valeurs lorsque la charge est masquée, zéro et déplacement de lignes suivent les mêmes règles **D-403 à D-405 / RM-235 à RM-241**, sans exception par mode. Une cible « À l’échec » ne supprime pas la possibilité de renseigner une charge. La charge reste informative et n’affecte ni la cible, ni le mode, ni les durées calculées.

**Conséquence BMAD :** prévoir explicitement les cas Répétitions × Séries identiques et Répétitions × Séries variables dans la table des deltas et la recette ; ne pas n’implémenter la Charge qu’en mode Durée. Ne pas changer le modèle de calcul métier pour ce seul complément.

### Complément utilisateur — Navigation dans le tableau au clavier numérique (décision explicite)

Les boutons **« Précédent »** et **« Suivant »** de la barre du clavier numérique déplacent la saisie vers le **champ précédent/suivant du tableau géré par ce clavier**. Le **champ actif est identifié visuellement par sa couleur de fond** ; celle-ci suit la saisie quand on change de champ. Le texte ou la valeur restent éditables dans le champ sélectionné. La navigation doit fonctionner sans imposer de fermeture/réouverture du clavier à chaque changement.

Cette précision vise **les champs du tableau effectivement saisis via clavier numérique** (en particulier les cellules de charge) : elle **ne transforme pas** les roulettes, steppers ou autres sélecteurs du tableau en saisie clavier. L’ordre exact aux extrémités du tableau et le traitement des cellules indisponibles ne sont **pas arbitrés ici** ; utiliser les conventions de navigation/focus existantes et les vérifier sur appareil, sans inventer un nouveau comportement de boucle. La couleur de fond est un indicateur d’état actif, **pas une nouvelle règle de valeur ou de calcul** ; conserver l’indication accessible du champ actif.

**Conséquence BMAD :** couvrir la navigation Précédent/Suivant et le surlignage de la cellule active dans la présentation/saisie du tableau, sans module d’orchestration, refonte de la feuille ou modification des autres gestes existants.

## 3. Corrections à signaler dès maintenant à BMAD

Outre les neuf questions, trois précisions documentaires restent utiles :

- **Ordre des sections :** **Description avant Paramètres d'exécution** dans l'éditeur, conformément à Figma et au code PRE-4. Ne pas réintroduire l'ordre inverse indiqué dans une partie du chapitre 13.
- **Pause après une série unique :** elle demeure applicable selon les règles validées. Ne pas suivre la suggestion contraire de la matrice du 19 octobre.
- **Périmètre :** l'enchaînement des côtés appartient bien aux paramètres de l'Exercice. Ne pas le confondre avec l'organisation d'exécution d'un format de Séance. Ne pas étendre PRE-5 à ces formats.

Ces précisions, comme les deux décisions explicites ci-dessus, ne nécessitent pas de nouveaux lots ou de contrôles bloquants.

## 4. Message complémentaire à transmettre à BMAD

> **Complément à la revue QP5-01 à QP5-09 — PRE-5.**
>
> Avant de figer les réponses et le plan BMAD, tenir compte des précisions suivantes :
>
> **1. Descriptions historiques (QP5-01) — décision simplifiée du propriétaire**
>
> Seuls trois ou quatre exercices ont été créés. Remplacer la description libre par les étapes numérotées. Réutiliser les textes historiques uniquement si cela est simple. Aucune migration dédiée, aucune conversion réversible spécifique, aucun retour à l'ancien format, aucune story supplémentaire pour ces quelques descriptions. Une recréation manuelle est acceptable. **Ne pas étendre cette tolérance aux autres données d'Exercice.**
>
> **2. Phases (QP5-04)**
>
> Respecter D-370 à D-375 et la spécification consolidée du 16 octobre :
>
> - Phase positive : minimum 1 s, pas de 1 s.
> - Durée de série dérivée de la somme des phases.
> - Avec reprend la durée existante, ou crée une première phase à renseigner lorsqu'elle n'existe pas.
> - Sous durée imposée, dernière phase calculée à partir du restant.
> - Les phases temporairement à zéro sont retirées à validation. Ne pas créer un blocage spécifique contraire à cette normalisation.
> - Ne pas ajouter de nouvelle borne ou modifier les règles de durée existantes sans justification.
>
> **3. Synthèse (QP5-09)**
>
> Conserver les 276 formulations historiques et leur grammaire. Intégrer le détail des phases entre parenthèses après la durée de série, conformément au §4.1 de la spécification consolidée. Utiliser le générateur et les segments existants ; ne pas reconstruire le corpus.
>
> **4. Segments (QP5-06)**
>
> **Réutiliser le `SegmentedControl` React Native existant par défaut.** `@expo/ui` 57 propose un natif : un remplacement n’est à envisager qu’après vérification courte démontrant un vrai gain de simplicité et une conformité au moins équivalente. Aucun chantier de remplacement imposé, aucune nouvelle abstraction inutile.
>
> **5. Charge dans les deux modes — décision explicite**
>
> En **Répétitions**, Charge fonctionne **à l’identique du mode Durée** : charge commune en séries identiques, par ligne en séries variables, y compris pour une cible À l’échec ; mêmes règles Avec/Sans, saisie décimale, zéro, réactivation et conservation. Ne pas limiter la fonctionnalité au mode Durée ; ne pas interpréter la charge dans les calculs.
>
> **6. Clavier numérique du tableau — décision explicite**
>
> Les actions **Précédent** et **Suivant** déplacent le focus entre les **champs du tableau gérés par le clavier numérique** ; la cellule active se distingue par **sa couleur de fond**. Conserver le clavier pendant la navigation. Ne pas remplacer les roulettes ou steppers des autres champs ; vérifier le focus/surlignage sur appareil.
>
> **7. Cohérence documentaire**
>
> - Description avant Paramètres d'exécution dans l'éditeur, conformément à Figma et à PRE-4.
> - Pause après chaque série conservée, y compris N=1, selon les règles existantes.
> - Enchainement des côtés : deux stratégies de l'Exercice, distinctes des stratégies d'exécution des formats de séance.
> - QP5-07 **arbitré** : dans le segmenté Enchainement, libellés « Un côté après l’autre » / « Les deux côtés à chaque série » ; **réduire la police** pour tenir dans la largeur Figma sans troncature, texte centré. Supprimer toute notation D/G. L’ancienne frame Figma devra être alignée, **sans bloquer PRE-5**.
> - Utiliser la matrice du 19 octobre comme analyse complémentaire, pas comme autorité supérieure aux décisions validées.
> - Vérifier les identifiants Figma actuels avant de fonder une story sur une ancienne référence.
>
> Ne pas modifier le code produit, générer de nouvelles stories ou démarrer le développement sur la base de ces seules précisions. Attendre la validation des arbitrages QP5 par Hermann et la consolidation documentaire correspondante.
>
> Conserver les mécanismes validés PRE-4. Toute modification doit correspondre à un delta nécessaire, pas à une reconstruction destinée à satisfaire un PRD généré.

## 5. Synthèse et prochaine étape

**Recommandation :** valider les réponses proposées, avec les corrections **QP5-04** et **QP5-09** et la simplification de **QP5-01** déjà exprimée. La présentation de l’**Enchainement** est **désormais arrêtée** par l’utilisateur (libellés explicites, police plus petite, segmenté et largeur conservés). Les deux compléments Charge/Répétitions et clavier numérique sont également décidés.

Après confirmation des QP5 encore en attente, consolider la documentation de manière ciblée, puis laisser BMAD finaliser son plan. **Aucun développement, push sur main, fusion ni publication n'est autorisé par ce document.**

## 6. Réponse aux quatre points de BMAD

1. **QP5-02 à QP5-09 :** les réponses ci-dessus constituent le projet d’arbitrage corrigé. QP5-01 et la présentation de QP5-07 ont été expressément arbitrés ; les autres recommandations ne doivent pas être présentées comme une validation globale tacite. Les deux décisions récentes Charge/Répétitions et navigation clavier sont applicables au cadrage.
2. **Enchainement QP5-07 :** les deux libellés définitifs tiennent dans le contrôle segmenté par **réduction de la police**, sans sous-titre D/G, sans élargissement arbitraire et sans solution provisoire.
3. **Phases du 16 octobre :** le document `KODJO-Phases-specification-consolidee-2026-10-15.md` est disponible dans les sources de consultation ; son **§4.1** prescrit `(nom : X s - nom : Y s - …)` après la durée de série. **Vérifier la présence physique sur le poste BMAD** avant d’annoncer que Claude l’a lu.
4. **Sources complémentaires :** matrice du 19/10, registre v25 (demande 10, modèle A) et audit PRE-4 retrouvés dans la Library. Les transmettre réellement à Claude. La matrice est un instrument d’analyse et ne peut invalider une décision du registre (pause après N=1, Enchainement des côtés, éligibilité des phases).

## 7. Sources de référence pour consolidation

- `KODJO_PRE5_Cadrage_et_lancement_2026-10-18.md` (Library).
- `KODJO_Audit_PRE4_BMAD_2026-10-18.md` (Library).
- `KODJO_Charge_Specification_2026-10-18(1).md` — version interne 3.0 (Library).
- `KODJO-Phases-specification-consolidee-2026-10-15.md` — consolidation du 16 octobre (Library).
- `Matrice des règles de compatibilité des paramètres d'exécution.md` — analyse du 19 octobre (Library), **à confronter aux décisions arbitrées**.
- `KODJO_Registre_Modifications_Creation-activite_2026-10-10_v25.md` — demande 10, modèle A (Library).
- [Dépôt GitHub — documentation fonctionnelle](https://github.com/MyUncried/Application-Routine/tree/main/docs/Specifications-fonctionnelles), principalement chapitres 07 à 10 et 13.
- [Figma — Prototype MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=510-101), notamment frame `8328:38193`.

*Évolution par rapport au Markdown du 19 octobre : QP5-01 simplifié maintenu ; QP5-06 révisé en faveur de la réutilisation existante ; QP5-07 arrêté définitivement avec police réduite ; charge explicitement valable en Répétitions identiques/variables ; navigation Précédent/Suivant sur champs numériques avec fond actif. La source de référence, les décisions déjà intégrées et les points encore soumis à approbation demeurent distincts. Ce document ne modifie pas la documentation du dépôt.*
