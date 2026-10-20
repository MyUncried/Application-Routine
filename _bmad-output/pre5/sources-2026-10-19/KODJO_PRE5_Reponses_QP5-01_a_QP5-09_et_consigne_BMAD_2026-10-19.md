# KODJO — PRE-5 : revue des arbitrages QP5-01 à QP5-09 et complément à transmettre à BMAD

**Date :** 19 octobre 2026  
**Dépôt :** `MyUncried/Application-Routine`  
**Statut :** propositions de réponses et recommandations pour validation, avant consolidation documentaire et développement.  
**Règle directrice :** ne pas changer ce qui existe déjà lorsque les changements demandés ne le remettent pas en cause.

> **Actualisation QP5-01 :** la décision exprimée après la revue initiale remplace la proposition antérieure de conversion réversible des descriptions historiques. Il n'existe actuellement que trois ou quatre exercices créés ; aucun chantier spécifique de migration de leurs descriptions n'est justifié.

## 1. Réponses recommandées

Sur les neuf propositions de BMAD, la plupart peuvent être validées, mais certaines nécessitent une correction pour respecter les décisions existantes.

Deux points sont particulièrement importants :

- **QP5-04 — Phases :** la proposition de BMAD ajoute des restrictions sur les durées et sur les phases à zéro qui ne figurent pas telles quelles dans la spécification consolidée.
- **QP5-09 — Phrase de synthèse :** la spécification des phases du 16 octobre prévoit explicitement d'afficher le détail des phases entre parenthèses. La proposition de BMAD l'oublie. Il faut conserver les 276 formulations existantes, mais y intégrer le complément prévu pour les phases, sans refondre le générateur.

**Ne pas approuver les neuf propositions en bloc sans les ajustements indiqués.**

| Question | Avis | Réponse proposée et justification |
|---|---|---|
| **QP5-01 — Description historique** | **Valider avec simplification (décision actualisée)** | Remplacer la description libre par les étapes numérotées. Réutiliser simplement le texte existant si possible, mais **ne pas développer de migration dédiée, de conversion sophistiquée ni de mécanisme de retour à l'ancien format**. Accepter de recréer manuellement les trois ou quatre descriptions si nécessaire. Ne pas ouvrir de story propre à cette conversion. Cela ne dispense pas de conserver les autres données existantes. |
| **QP5-02 — Étapes vides et 1 000 caractères** | **Valider** | Retirer les étapes vides à **Terminer**, renuméroter automatiquement et permettre la suppression d'une étape vide par retour arrière. Limite de 1 000 caractères sur **l'ensemble des textes des étapes**, hors numérotation générée par l'interface. Préserver les étapes non vides et leur ordre. |
| **QP5-03 — À l'échec dans une phase** | **Valider** | Une phase est exclusivement chronométrée. Le choix **À l'échec** s'applique à la Série, pas aux phases. Décisions D-370 et D-412. Roue numérique seule. |
| **QP5-04 — Bornes et comportements des phases** | **Corriger** | Minimum 1 s et pas 1 s par phase. La somme doit respecter les contraintes de durée de série applicables, mais éviter une borne indépendante non prévue pour chaque phase. **Avec** reprend la durée de série existante ; sinon **Phase 1** reste à renseigner. **Sans** doit préserver une durée valide. Les phases à zéro sont retirées à validation, sans blocage spécifique ; si aucune cible valide ne subsiste, la validation reste indisponible. |
| **QP5-05 — Hauteurs des lignes** | **Valider sous réserve tactile** | 36 px pour les lignes des deux tableaux et 44 pt pour les autres lignes de la feuille. Conserver les exigences d'accessibilité et de cibles tactiles, sans chevauchement. Si les 36 px empêchent réellement une interaction fiable, vérifier sur appareil avant de modifier la géométrie. |
| **QP5-06 — Contrôle segmenté** | **Valider** | Essayer d'abord le contrôle natif d'Expo UI 57. Repli sur `SegmentedControl` React Native existant si les chevrons intérieurs, états désactivés, couleurs ou dimensions Figma ne sont pas reproductibles. Pas de composant supplémentaire si l'existant suffit. |
| **QP5-07 — Enchainement** | **Valider le principe ; notation à clarifier** | Contrôle segmenté en ligne dans le cadre **Côtés**, avec les deux enchaînements existants. Visible uniquement avec **Changement de côté = Avec** et **N > 1**. La notation visuelle nécessite une précision, détaillée ci-dessous. |
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

### QP5-07 — Une contradiction Figma existe encore

La frame Figma actuelle **`8328:38193`** a été vérifiée directement. Elle représente un contrôle en ligne, mais ses deux options emploient encore les notations **`D1`, `D2`, `G1`, `G2`**.

Or **D-407** supprime les désignations anatomiques au profit de **côté 1** et **côté 2**. Il est recommandé de conserver les deux stratégies d'enchaînement, sans copier les anciennes indications droite/gauche comme nouvelle sémantique.

**La notation graphique exacte reste À CLARIFIER**, sans inventer une formule `C1S1/C2S1` précédemment écartée.

Référence Figma : [Création activité — Paramètres, changement de côté déployé](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38193).

### QP5-06 — Le natif a bien été vérifié

Le dépôt utilise `@expo/ui ~57.0.13` et Expo 57. Le contrôle SwiftUI `Picker` en style `segmented` est disponible dans cet écosystème.

Le composant React Native **`src/shared/ui/SegmentedControl.tsx`** existe déjà dans le dépôt. Il possède notamment une gestion des options désactivées et des styles spécifiques.

Tester le natif est raisonnable, mais ne justifie pas d'imposer un remplacement complet si le rendu est moins conforme.

Référence code : [`src/shared/ui/SegmentedControl.tsx`](https://github.com/MyUncried/Application-Routine/blob/main/src/shared/ui/SegmentedControl.tsx).

## 3. Corrections à signaler dès maintenant à BMAD

Outre les neuf questions, trois précisions sont utiles, issues des contradictions identifiées :

- **Ordre des sections :** **Description avant Paramètres d'exécution** dans l'éditeur, conformément à Figma et au code PRE-4. Ne pas réintroduire l'ordre inverse indiqué dans une partie du chapitre 13.
- **Pause après une série unique :** elle demeure applicable selon les règles validées. Ne pas suivre la suggestion contraire de la matrice du 19 octobre.
- **Périmètre :** l'enchaînement des côtés appartient bien aux paramètres de l'Exercice. Ne pas le confondre avec l'organisation d'exécution d'un format de Séance. Ne pas étendre PRE-5 à ces formats.

Ces précisions ne nécessitent pas de nouveaux lots ou de contrôles bloquants.

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
> Le contrôle segmenté natif Expo UI 57 est disponible. L'essayer prioritairement, mais conserver le composant React Native existant si le natif ne permet pas le rendu ou les interactions attendus. Pas de nouvelle abstraction inutile.
>
> **5. Cohérence documentaire**
>
> - Description avant Paramètres d'exécution dans l'éditeur, conformément à Figma et à PRE-4.
> - Pause après chaque série conservée, y compris N=1, selon les règles existantes.
> - Enchainement des côtés : deux stratégies de l'Exercice, distinctes des stratégies d'exécution des formats de séance.
> - Ne pas réintroduire les directions anatomiques D/G ; signaler la notation Figma actuelle comme point à clarifier.
> - Utiliser la matrice du 19 octobre comme analyse complémentaire, pas comme autorité supérieure aux décisions validées.
> - Vérifier les identifiants Figma actuels avant de fonder une story sur une ancienne référence.
>
> Ne pas modifier le code produit, générer de nouvelles stories ou démarrer le développement sur la base de ces seules précisions. Attendre la validation des arbitrages QP5 par Hermann et la consolidation documentaire correspondante.
>
> Conserver les mécanismes validés PRE-4. Toute modification doit correspondre à un delta nécessaire, pas à une reconstruction destinée à satisfaire un PRD généré.

## 5. Synthèse et prochaine étape

**Recommandation :** valider les réponses proposées, avec les corrections **QP5-04** et **QP5-09** et la simplification de **QP5-01** déjà exprimée. Le seul arbitrage visuel véritablement nécessaire identifié à ce stade est la notation de l'**Enchainement** dans **QP5-07**.

Après approbation des réponses, consolider la documentation de manière ciblée, puis laisser BMAD finaliser son plan. **Aucun développement, push sur main, fusion ni publication n'est autorisé par ce document.**

## 6. Sources de référence pour consolidation

- `KODJO_PRE5_Cadrage_et_lancement_2026-10-18.md` (Library).
- `KODJO_Audit_PRE4_BMAD_2026-10-18.md` (Library).
- `KODJO_Charge_Specification_2026-10-18(1).md` — version interne 3.0 (Library).
- `KODJO-Phases-specification-consolidee-2026-10-15.md` — consolidation du 16 octobre (Library).
- `Matrice des règles de compatibilité des paramètres d'exécution.md` — analyse du 19 octobre (Library), **à confronter aux décisions arbitrées**.
- `KODJO_Registre_Modifications_Creation-activite_2026-10-10_v25.md` — demande 10, modèle A (Library).
- [Dépôt GitHub — documentation fonctionnelle](https://github.com/MyUncried/Application-Routine/tree/main/docs/Specifications-fonctionnelles), principalement chapitres 07 à 10 et 13.
- [Figma — Prototype MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=510-101), notamment frame `8328:38193`.

*Ce document reprend intégralement l'avis et le message BMAD de la revue précédente, avec actualisation explicite de QP5-01. Il ne constitue pas, à lui seul, une mise à jour des sources documentaires du dépôt ni une nouvelle décision sur les autres questions.*
