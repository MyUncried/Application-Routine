---
title: "KODJO PRE-5 — Éditeur d'Exercice et Feuille des paramètres (PRD ciblé)"
status: final
created: 2026-10-19
updated: 2026-10-19
base: "bmad/pre5-depuis-pre4, HEAD 52382b04 (src/ et app/ identiques au merge PRE-4 1116586b)"
inputs:
  - _bmad-output/pre5/table-delta.md (entrée principale ; §6 prime sur §3)
  - _bmad-output/pre5/inventaire-sources.md
  - _bmad-output/pre5/inventaire-code.md
  - _bmad-output/pre5/sources-2026-10-19/ (Décisions v2, spécification des phases §1 à 5, registre v25 demandes 10, 13, 14, 17, 18, 20 et 21, audit PRE-4 §5)
  - Décisions de Hermann du 19/10 transmises en cours de rédaction (bornes minimales des durées, Δ50 ; phases Avec → Sans)
  - Revue indépendante du 19/10 (verdict REVISE) et décisions de Hermann qui la suivent (D-431 Enchainement, D-432 contrôle des phases ; corrections C1 à C9, `revue-chatgpt/corrections-revue-2026-10-19.md`)
  - KODJO_PRE5_Cadrage_et_lancement_2026-10-18.md
  - openspec/changes/archive/2026-10-18-integration-parametres-execution-v3/source/KODJO_Charge_Specification_2026-10-18.md
---

# PRD : KODJO PRE-5 — Éditeur d'Exercice et Feuille des paramètres

## 0. Objet du document

Ce PRD décrit **uniquement le delta de PRE-5** par rapport à PRE-4 livré. Il ne reformule pas le produit. Pour le détail d'une règle, il renvoie à la table de delta (`table-delta.md`, lignes **Δ01 à Δ50**) et aux sources (D-xxx du ch. 07, RM-xxx du ch. 10, règles CH/CO/CA/DU/CV/AR/GR/RO/PR de la spécification de la charge v3, § de la spécification des phases du 16/10).

Il s'adresse à Hermann, seul propriétaire et utilisateur, à la revue indépendante par ChatGPT, puis aux étapes BMad suivantes : architecture des seuls changements, épopées et stories.

Organisation :

- §3 fixe le vocabulaire ;
- §4 regroupe les exigences fonctionnelles par thème (FR-1 à FR-45, numérotation stable) ;
- §5 donne les exigences non fonctionnelles transverses ;
- §6 liste les non-régressions ;
- §7 liste les remplacements de comportements acceptés ;
- §8 donne les exclusions.

Les questions techniques laissées à l'architecture sont dans `addendum.md`.

**Règle de préséance**, de la plus forte à la plus faible :

0. Les décisions de Hermann qui suivent la revue indépendante du 19/10 (`table-delta.md` §6, « Décisions de la revue indépendante du 19/10 ») : notation de l'Enchainement (D-431, FR-17) et contrôle des phases (D-432, FR-4, FR-5, FR-8, FR-9) ; puis l'affichage permanent de la Durée de l'exercice (D-433, FR-31) ; puis la saisie au clavier numérique des séries variables et des phases (D-434, FR-7, FR-22 à FR-25, FR-29). Elles priment sur tout texte antérieur, y compris `table-delta.md` §6.
1. Les deux décisions complémentaires de Hermann du 19/10, qui priment sur `table-delta.md` §6 pour QP5-04 :
   - les bornes minimales des durées (Δ50, FR-45) ;
   - le passage des phases de Avec à Sans (FR-8).
2. Les décisions de Hermann du 19/10 : `table-delta.md` §6 et `PRE5_BMAD_Decisions_v2.md`.
3. Les recommandations de `table-delta.md` §3 et les sources plus anciennes, pour ce que ces décisions ne corrigent pas.

Figma fixe le rendu, jamais une règle.

## 1. Vision

PRE-5 finalise la création et la modification d'un Exercice. Côté écran principal :

- la Description devient une liste d'étapes numérotées ;
- la Carte des paramètres est allégée ;
- `Terminer` est abaissé ;
- la présentation est alignée sur Figma.

Côté Feuille des paramètres d'exécution :

- les paramètres gagnent les phases, la charge informative, des côtés neutres (Avec / Sans) et une Condition d'arrêt explicite ;
- la Feuille est réorganisée en quatre cadres, avec des segmentés en ligne ;
- un premier champ de saisie au clavier apparaît dans la Feuille ; depuis D-434, il porte toutes les valeurs éditables des tableaux des séries variables et des phases.

Le principe directeur est la **réutilisation** : cibles typées, séries variables, calculs, brouillon, roues natives, `SegmentedControl` et gestes du tableau de PRE-4 sont étendus, pas reconstruits. Un comportement validé en PRE-3 ou PRE-4 ne change que par un remplacement listé au §7. Tout autre écart est signalé, pas décidé.

## 2. Utilisateur

Une seule personne, Hermann, sur iPhone. Il prépare ses Exercices dans le Catalogue ou dans une Séance. Ce qu'il doit pouvoir faire :

- décomposer une série en actions chronométrées, par exemple 6 s de descente puis 3 s de maintien ;
- noter la charge utilisée ;
- décrire un Exercice bilatéral sans désignation anatomique ;
- voir d'un coup d'œil si l'Exercice s'arrête à la cible ou à l'échec ;
- écrire la Description pas à pas.

Pas de parcours utilisateur détaillé : l'outil est interne et n'a qu'un opérateur.

## 3. Glossaire

Les termes visibles sont ceux de PR-01 (spécification de la charge v3, §11.1). Ne pas réintroduire Activité, Tour, Cible, Définie ou Ordre comme libellés de ces contrôles.

- **Exercice** : unité définie par l'utilisateur, au Catalogue (`ActivityDefinition`) ou dans une Séance (copie).
- **Feuille** : la Feuille « Paramètres d'exécution » (`ExecutionParametersSheet`), ouverte depuis la Carte. Elle se valide par ✓ et s'annule par ✕.
- **Carte** : le résumé des paramètres sur l'écran principal de l'éditeur. Elle porte la Phrase.
- **Phrase** : la phrase de synthèse générée, en segments `{texte, gras}`, jamais persistée.
- **Mode** : Durée ou Répétitions. Il n'existe que ces deux Modes techniques.
- **Condition d'arrêt** : À l'échec ou À la cible. C'est une entrée en séries identiques et un **résultat dérivé** en séries variables. Le résultat « À la cible et à l'échec » est calculé, jamais persisté.
- **Type de série** : Identiques ou Variables.
- **Phase** : subdivision chronométrée et ordonnée d'une série, commune à toutes les séries. Un Exercice porte de 0 à 6 phases. « Aucune » correspond à 0 phase. Le contrôle de la Feuille règle de 2 à 6 phases (D-432, FR-4).
- **Durée de série (D)** : avec des phases, c'est la somme de leurs durées, calculée et non modifiable.
- **Charge** : valeur informative en kg. Elle est commune en séries identiques et propre à chaque ligne en séries variables. Son activation (Avec / Sans) est distincte de ses valeurs conservées.
- **Changement de côté** : Avec ou Sans. Avec signifie un Exercice bilatéral, sans désignation du côté de départ.
- **Enchainement** : stratégie d'ordre des côtés. Deux stratégies, un côté après l'autre et les deux côtés à chaque série, présentées dans le contrôle par leur notation graphique Figma : `(D1 → D2) ➜ (G1 → G2)` et `(D1 → G1) ➜ (D2 → G2)` (D-431).
- **Cadence** : intervalle du bip. Options Autre / 5 s / 2 s / 1 s / Sans.
- **Durée de l'exercice** : libellé visible du concept de durée totale de la Feuille.
- **Étape** : élément numéroté de la Description.
- **Champ de saisie clavier** : cellule ou ligne de la Feuille saisie au clavier du système. En relèvent la charge (clavier décimal), le libellé de phase (clavier texte) et, depuis D-434, les cellules Durée et Pause du tableau des séries variables et les durées de phase (clavier numérique, saisie MMSS). D-434 remplace « seuls deux contenus en relèvent » ; hors tableaux, seule la charge commune en relève.
- **Ligne NR** : ligne Δ déjà conforme. C'est une exigence de non-régression, pas une fonction à construire.

## 4. Exigences fonctionnelles

Chaque FR indique ses lignes Δ et ses sources. Les comportements « conservés » de la table de delta restent exigibles même s'ils ne sont pas répétés.

### 4.1 Phases de l'exercice

Les phases décomposent une série en actions chronométrées. Elles sont réservées au Mode Durée, à une cible chiffrée et aux séries identiques. La durée de série devient leur somme.

#### FR-1 : Modèle des phases

Un Exercice porte de 0 à 6 phases ordonnées. Chaque phase a :

- une identité stable ;
- un libellé de 1 à 20 caractères après normalisation ;
- une durée entière en secondes, d'au moins 1 s.

La séquence est commune à toutes les séries.

- L'absence de phases se lit « Aucune ». Le modèle admet une seule phase (spécification des phases §2.1), mais le contrôle de PRE-5 règle de 2 à 6 phases (FR-4) : voir QR-1 et QR-2 (§9).
- Une phase validée ne vaut jamais 0 s ; le zéro n'existe que dans le brouillon.
- Les données sans phases (versions antérieures) restent lisibles et se lisent sans phases.

*Sources :* Δ08 ; D-370, D-373 ; spécification des phases §2.1, §5.

#### FR-2 : Éligibilité et compatibilité

Les phases ne sont disponibles qu'en Mode Durée, à Condition d'arrêt À la cible et en séries identiques.

- Si des phases existent, Répétitions, À l'échec et Variables sont indisponibles. Ces options gardent leur valeur réelle avec l'état visuel indisponible (RM-247).
- En Variables, à l'échec ou en Répétitions, la création de phases est indisponible.
- Aucune conversion destructive automatique : pour changer d'option, l'utilisateur supprime d'abord les phases.
- La mémoire des cibles par Mode est conservée.

*Sources :* Δ13 ; ch. 08 l. 244-246 ; CE-UI-10 l. 1067 ; spécification des phases §2.1.

#### FR-3 : Durée de série dérivée

Avec des phases, la durée de série D est la somme de leurs durées. Elle est affichée en lecture seule, sans arrondi.

- T = N × (D + P). L'exemple 6 + 3 s, 3 séries et pause de 15 s donne 72 s.
- L'inversion de la durée totale n'ajuste que N, jamais les phases.
- La somme est comprise entre 1 et 3 535 s (FR-45). La borne s'applique à la somme **après** la normalisation de FR-9 : des phases à 0 s ne bloquent jamais ✓. Une somme normalisée au-delà de 3 535 s rend la validation (✓) indisponible, comme une durée de série invalide.
- Les natures de calcul, le symbole et le `—` existants sont inchangés.

*Sources :* Δ09, Δ40, Δ50 ; ch. 08 l. 269-279 ; ch. 10 l. 278 ; CE-UI-10 §12 ; spécification des phases §2.4, §9 ; QP5-04 (validé le 19/10) ; décision de Hermann du 19/10 — bornes minimales des durées.

#### FR-4 : Ligne et tableau des phases

La ligne « Phases de l'exercice » est en tête du cadre Séries. C'est un contrôle à deux options, Avec / Sans. Sans est l'état par défaut, sans phase.

**Segment Avec (D-432).** Avec active la décomposition et affiche le nombre de phases dans le segment, sous la forme « 3 phases ».

- Le nombre de phases se règle avec le stepper existant `InlineStepper`, de **2 à 6**, révélé au toucher selon le mécanisme existant (celui du Nombre de séries).
- Stepper actif : − et + sont visibles. Stepper inactif : − et + disparaissent ; la valeur et le chevron restent visibles.
- Le tableau contient le nombre de phases configuré.

**Chevron.**

- C'est un chevron graphique existant (icône `control-chevron-up` / `control-chevron-down` de `DisclosureControl`), jamais une flèche ni un caractère Unicode.
- Il est intégré au segment Avec, à droite du nombre (D-410).
- Il pointe vers le haut quand le tableau est déployé, vers le bas quand il est replié.
- Il reste visible quand − et + sont masqués.
- Son appui replie ou déploie le tableau sans changer le nombre.

**Tableau.** Sous Avec, un tableau reprend le patron du tableau des séries. Chaque ligne porte une poignée de déplacement, un numéro, un libellé, une durée et une croix ✕ de suppression avec annulation ; la ligne active est signalée.

- Il n'y a ni ligne « Ajouter une phase », ni boutons +/− propres au tableau, ni nouveau composant : `InlineStepper`, la révélation au toucher et les briques existantes du tableau sont réutilisés.
- Les gestes et les alternatives accessibles du tableau des séries sont réutilisés (CE-UI-10 §13).
- Lors d'un déplacement, chaque libellé personnalisé reste attaché à sa phase (spécification des phases §2.2).

*Sources :* Δ10 ; D-410, D-413, D-432 ; ch. 08 l. 249-255 ; RC ligne 2b ; CV-01 ; Figma `9207:18817`, vérifiée par Hermann le 19/10 : le segment « Avec ^ » porte un chevron, chaque ligne a une poignée, un numéro, un libellé, une durée et une croix ✕. La forme « 3 phases » vient de la décision, pas de la frame.

#### FR-5 : Création et ajout de phases

- **Première activation de Avec, en durée libre (D-432)** : **deux phases** sont créées.
  - La première reprend la durée de série si elle existe.
  - La seconde reste à renseigner, selon la convention existante des valeurs manquantes (fond rouge pâle).
  - Sans durée de série (« — »), aucune durée n'est inventée : les deux phases sont à renseigner.
  - Toutes les durées sont modifiables ; la durée de série est recalculée comme leur somme.
  - Une phase restée à renseigner est traitée au ✓ par FR-9.
- **Stepper +** : ajoute une phase en fin de liste, qui reprend la durée de la dernière (§2.2). À six phases, + est indisponible ; aucune 7e ligne n'est créée.
- **Stepper −** : retire la dernière phase, avec la même annulation que la croix ✕ (FR-8). À deux phases, − est indisponible (QR-1 validée par Hermann le 19/10).
- **Contrôle d'ajout :** le stepper du segment Avec est le seul contrôle d'ajout. Il n'y a pas de ligne « Ajouter une phase ».
- **Durée imposée par un format :** le comportement spécifié est conservé (dernière phase calculée sur le restant ; exemple 20 s + 0 s, puis 12 s + 8 s). Aucun parcours de format n'existe dans `src/` : il reste non développé en PRE-5 (Δ15, §8). Le calcul de la dernière phase n'est **pas** généralisé à la durée libre.

Cette règle remplace « Avec crée une seule Phase 1 », y compris pour le retour de Sans à Avec (FR-8).

*Sources :* Δ10 ; D-432 ; QP5-04 ; spécification des phases §2.2, §3.

#### FR-6 : Libellé de phase

Le libellé se saisit au clavier texte, directement dans la cellule. Il est limité à 20 caractères. Le clavier ne masque ni le champ, ni les actions de la Feuille (FR-24).

Le clavier texte se ferme par sa touche Retour, sans barre d'accessoire. Sa saisie ne dépend pas de l'issue de l'essai précoce du clavier décimal (NFR-6) : un problème du seul clavier décimal ne bloque que la saisie de la charge.

*Sources :* Δ11 ; ch. 08 l. 253 ; CE-UI-10 §10 l. 1087.

#### FR-7 : Durée de phase

La durée d'une phase se saisit au clavier numérique, en MMSS, directement dans sa cellule, selon FR-23 à FR-25 (D-434, décision de Hermann du 19/10, qui remplace la roue de durée native `DurationWheelPicker` dans `AnchoredPanel`) :

- minimum 1 s, pas de 1 s ;
- aucune option « À l'échec » : la commande « À l'échec » de la barre du clavier n'apparaît pas pour une durée de phase ;
- aucune borne propre à la phase en dehors de celle de la somme (FR-3) ;
- une dernière phase calculée automatiquement (formats, D-372) reste non éditable.

*Sources :* Δ12 ; QP5-03 et QP5-04 (décidés) ; spécification des phases §2.1 ; D-370 ; D-434. La décision QP5-03 clôt la contradiction C-1. Elle s'appuie sur D-370 et D-412, et remplace la dernière phrase de RO-01 (« ne pas retirer son option À l'échec »).

#### FR-8 : Suppression et retour à Sans

- **Supprimer une phase** (croix ✕ de sa ligne, ou stepper − pour la dernière) retire sa contribution à D et décrémente le nombre affiché.
- **Croix ✕ à deux phases** (QR-1 validée par Hermann le 19/10) : la croix reste disponible au-dessus de 2 phases et devient indisponible à 2 ; le retrait passe alors par Sans. La règle de la spécification (supprimer la dernière phase restante ramène à « Aucune » et conserve sa durée comme durée de série, D-371) reste celle du modèle, mais le contrôle de PRE-5 ne descend pas sous 2 phases.
- **L'annulation d'une suppression** restitue l'ordre, les libellés et les durées, y compris D et le nombre de phases.
- **Passer de Avec à Sans avec plusieurs phases :**
  - les phases sont retirées de la configuration ;
  - la somme de leurs durées devient la durée unique de la série : 6 s + 3 s + 5 s donnent 14 s ;
  - cette durée reste modifiable selon les règles existantes (FR-45) ;
  - tous les autres paramètres sont conservés.
- **Si aucune durée valide ne peut être déduite**, par exemple avec des phases toutes à 0 s, aucune valeur n'est inventée. La durée de série reste à renseigner, selon la validation existante.
- **Repasser à Avec** crée deux nouvelles phases, la première à la durée de série courante, la seconde à renseigner (FR-5, D-432). Les anciennes phases ne sont pas mémorisées.
- **Annuler la Feuille (✕)** restaure la configuration précédente, phases comprises.

*Sources :* Δ14 ; spécification des phases §2.3 ; D-371 ; décision de Hermann du 19/10 — Phases Avec → Sans, révisée par D-432 pour le retour à Avec (deux phases). Cette décision clôt QP5-04. Elle prime sur la restauration des phases tant que la Feuille est ouverte, que proposait QP5-04 (d) de `table-delta.md` §3.

#### FR-9 : Normalisation à la validation

Au ✓ de la Feuille :

- les phases à 0 s sont retirées, sans message ni blocage ;
- un libellé vide devient « Phase n », selon la position finale ;
- une liste vide ou entièrement nulle revient à « Aucune » ;
- si la cible reste absente ou invalide, la validation existante s'applique.

(QR-2 validée par Hermann le 19/10) La normalisation peut laisser moins de 2 phases :

- s'il reste une seule phase, l'Exercice passe à Sans avec sa durée comme durée de série, sur le principe de D-371 ;
- s'il n'en reste aucune, l'Exercice passe à Sans sans durée inventée : la validation existante de la durée de série s'applique.

Les règles existantes de normalisation et de validation sont préservées. Annuler la Feuille (✕) restaure son état antérieur.

*Sources :* Δ14 ; D-373 ; ch. 08 l. 257-259, l. 342-343 ; spécification des phases §2.2 ; QP5-04. La recommandation (e) de §3, qui bloquait les phases toutes à 0, est abandonnée.

### 4.2 Charge

La charge est facultative et informative. Elle ne modifie aucun calcul. Ses règles sont **identiques en Mode Durée et en Mode Répétitions**, y compris avec une cible À l'échec (Δ48).

#### FR-10 : Modèle de la charge

- La charge est exprimée en kg. Son activation (Avec / Sans) est distincte de ses valeurs.
- Elle est commune en séries identiques et propre à chaque ligne en séries variables.
- Sous Sans, les valeurs sont conservées, y compris après enregistrement et réouverture.
- L'absence de charge se lit Sans, jamais 0 kg.
- La valeur est décimale, au pas de 0,25 kg, sans plafond.
- La charge ne crée pas de valeur par côté.
- Elle est sans effet sur les cibles, durées, cadence, pauses, Condition d'arrêt et calculs.

*Sources :* Δ16, Δ48 ; D-403, D-404 ; RM-235, RM-236 ; ch. 09 l. 344-347 ; CH-01, CH-02, CH-06, CH-07.

#### FR-11 : Charge dans le brouillon

La charge suit la série dans toutes les opérations du brouillon :

- copie uniforme → variable ;
- ajout et retrait de série, annulation du retrait ;
- déplacement ;
- passage entre identiques et variables.

Elle est traitée comme les autres valeurs de la série. Sont conservés :

- Q29 et les réserves existantes ;
- D-249 (non-persistance des variantes cachées), qui ne s'applique pas à la charge : celle-ci reste conservée sous Sans.

Une saisie ne se propage pas automatiquement aux autres séries. Aucune autorisation particulière de cellule de charge vide : la règle commune des champs de série s'applique (CH-04).

*Sources :* Δ17 ; CE-UI-10 §12 ; RM-238 ; CH-04, CH-07 ; Q29.

#### FR-12 : Charge en séries identiques

La ligne Charge (Avec / Sans, Sans par défaut) suit la Pause dans le cadre Séries.

- Avec ouvre directement la saisie, sans écran intermédiaire.
- Une fois saisie, la valeur remplace Avec, par exemple « 20 kg ». Elle reste éditable.
- La ligne reste disponible quand la Condition d'arrêt À l'échec masque la ligne Durée ou Répétitions (FR-21, Δ48).

*Sources :* Δ18 ; D-404 ; RM-237 ; RC ligne 6 ; CH-02, CH-03.

#### FR-13 : Charge en séries variables

La ligne Charge (Avec / Sans) se place sous le tableau.

- Avec affiche une colonne Charge, au titre non interactif.
- Sans masque la colonne et conserve les valeurs.
- La charge reste attachée à sa série lors d'un déplacement.

*Sources :* Δ19 ; D-404 ; RM-238 ; CH-04.

#### FR-14 : Règles de saisie de la charge

**Saisie et arrondi**

- La saisie se fait au clavier numérique décimal, sans fenêtre intermédiaire. Le séparateur suit la langue de l'interface.
- Une valeur positive hors pas est arrondie au multiple de 0,25 kg supérieur, sans message. L'arrondi intervient à la sortie du champ ou à la validation, jamais pendant la frappe : 1,3 donne 1,5 ; 0,01 donne 0,25 ; 1,25 reste 1,25 ; 0 reste 0.
- Une valeur négative n'est pas une charge valide ; le comportement standard des champs numériques du projet s'applique.
- L'unité kg est une information d'affichage. Elle ne fait pas partie du nombre enregistré.

**Zéro**

- En séries identiques, zéro désactive la charge.
- En séries variables, zéro vaut « sans charge » pour la seule série concernée. La charge reste active tant qu'une série a une valeur positive.
- Si toutes les séries passent à zéro, l'Exercice passe à Sans.
- Un zéro saisi n'est jamais remplacé par une ancienne charge positive.

**Activation**

- À la première activation, sans valeur mémorisée, la charge vaut 0,25 kg (commune, ou dans chaque série) et la saisie s'ouvre.
- Une réactivation restaure les valeurs mémorisées.
- Si toutes les valeurs mémorisées sont nulles, la réactivation met chaque série à 0,25 kg. Si seules certaines sont nulles, elles sont restaurées telles quelles.

Ces arbitrages (CH-05) sont clos.

**Cas d'acceptation exigés par Δ48**, dans les tests comme dans la recette :

- Répétitions × Identiques ;
- Répétitions × Variables ;
- cible À l'échec avec charge.

*Sources :* Δ20 ; D-405 ; RM-239 ; CH-05 ; scénarios de la spécification v3 l. 488.

### 4.3 Côtés

#### FR-15 : Changement de côté Avec / Sans

La ligne « Changement de côté » est un segmenté en ligne : Avec à gauche, Sans à droite, sans choix de direction.

- Avec rend disponibles Enchainement et Pause entre les côtés. Le chevron est intérieur à Avec.
- Sans masque ces lignes et conserve leurs valeurs.
- Un côté non renseigné est normalisé à Sans à la validation (D-406).
- Restent inchangées : la copie de la Pause entre les côtés depuis le Profil (P3-10) et les deux stratégies (RM-037).

*Sources :* Δ21 ; D-406, D-410 ; RM-242 ; RC ligne 7 ; CO-01.

#### FR-16 : Lecture des côtés historiques

Les valeurs historiques `RIGHT_LEFT` et `LEFT_RIGHT` se lisent Avec. L'Enchainement enregistré est conservé. Aucune réécriture des données ni des résultats historiques, qui restent lisibles par côté.

*Sources :* Δ22 ; RM-244 ; D-406.

#### FR-17 : Enchainement

- Le libellé est « Enchainement ».
- Le contrôle est un segmenté en ligne dans le cadre Côtés ; le segmenté et sa disposition Figma sont conservés.
- **Options (D-431)** : les deux notations de la frame `8328:38193` sont conservées exactement, dans cet ordre :
  - `(D1 → D2) ➜ (G1 → G2)` (un côté après l'autre) ;
  - `(D1 → G1) ➜ (D2 → G2)` (les deux côtés à chaque série).
- Les libellés longs « Un côté après l'autre » et « Les deux côtés à chaque série » sont abandonnés **dans le contrôle**. Ils restent le nom accessible des options, pour des annonces neutres (D-407).
- La police n'est réduite que si nécessaire ; sa taille exacte se règle sur l'appareil, sans changement automatique de géométrie.
- Aucune notation C1S1.
- Ces notations sont graphiques. D-407 reste applicable à la désignation fonctionnelle des côtés : la Phrase, la Composition et l'exécution restent neutres (« côté 1 / côté 2 », FR-18).
- La ligne n'est visible que si le Changement de côté vaut Avec et N > 1. À N = 1, elle est masquée et l'Enchainement enregistré est conservé (D-415, ligne NR Δ24).
- L'Enchainement est un paramètre de l'Exercice, distinct des variantes d'exécution des formats de Séance (§8).

*Sources :* Δ23 ; D-407, D-413, D-431 ; RM-243 ; QP5-07 (révisée par Hermann, revue du 19/10). Le code porte déjà ces notations en sous-titres (`sideOrderSubtitles`), à la flèche centrale près : c'est une réutilisation.

#### FR-18 : Désignations neutres hors de la Feuille

- La Phrase emploie la forme neutre « côté 1 puis le côté 2 », selon les textes du ch. 10 l. 515.
- L'indicateur de côté de la Composition ne porte plus de direction : seul son point de passage change, son rendu suit Figma (S-2).
- Le corpus des phrases est étendu pour les cas bilatéraux (S-3, validé le 19/10). La grammaire et la ponctuation du corpus sont conservées.

*Sources :* Δ43, Δ45 ; D-407 ; RM-151, RM-243.

### 4.4 Condition d'arrêt

Il n'existe ni troisième Mode, ni condition Mixte persistée. Les cibles typées `NUMBER`, `FAILURE` et `UNSET` restent la seule donnée.

#### FR-19 : Condition d'arrêt en séries identiques

La ligne « Condition d'arrêt » se place dans le cadre Exécution : À l'échec à gauche, À la cible à droite, À la cible par défaut.

- Le choix s'applique à toutes les séries, selon le Mode.
- Revenir à À la cible restaure la dernière valeur chiffrée connue pendant l'édition.

*Sources :* Δ25 ; D-411, D-416 ; RM-248 ; AR-01.

#### FR-20 : Résultat dérivé en séries variables

En séries variables, la ligne affiche un résultat calculé d'après les séries, non modifiable :

| Séries | Affichage |
|---|---|
| Toutes à cible définie | Deux options, À la cible sélectionnée |
| Toutes à l'échec | Deux options, À l'échec sélectionnée |
| Au moins une de chaque | Une seule option, « À la cible et à l'échec » |

- Le résultat se met à jour à chaque modification de cellule. Quand le détail redevient homogène, les deux options réapparaissent, avec la sélection correspondante.
- Une cellule vide n'est comptée ni comme cible, ni comme échec. Un tableau incomplet ou vide suit la convention des résultats calculés incomplets (D-384).
- Le passage de Variables à Identiques suit la normalisation N1 existante. L'architecture la relève dans le code ; aucune règle nouvelle n'est posée.
- Aucune validation supplémentaire n'est ajoutée.
- La sémantique accessible est celle d'une information non modifiable.
- Le rendu (violet atténué, texte blanc) suit Figma (S-2).

*Sources :* Δ26 ; D-411 ; RM-249 ; AR-01 ; spécification v3 l. 209-227.

#### FR-21 : Champs masqués à l'échec

En séries identiques à la Condition À l'échec, aucune valeur n'est prescrite :

- la ligne « Durée d'une série » est masquée en Mode Durée ;
- la ligne « Répétitions » est masquée en Mode Répétitions.

Les valeurs sont restaurées au retour à À la cible.

*Sources :* Δ27 ; D-419 ; RM-248 ; QP5-08.

#### FR-22 : Roues sans option d'échec en identiques

En séries identiques, les roues « Durée d'une série » et « Répétitions » ne proposent plus « À l'échec ».

Dans une cellule variable en mode Durée, « À l'échec » reste disponible pour la seule série, par la commande « À l'échec » à gauche de la barre du clavier (D-434, qui remplace la roue de cellule à option en tête, sa PickerToolbar et son ouverture sous la ligne). La cellule Répétitions n'est pas visée par D-434 : sa roue à option en tête (Q8, D-418) n'est ni confirmée ni remplacée (§9, QD-434-1). Pour cette option :

- le choix ne s'applique qu'à la série éditée et met à jour FR-20 ;
- « À l'échec » n'est pas une durée nulle, et zéro ne code jamais l'échec ;
- la Pause et les autres paramètres de la série ne changent pas ;
- le retour à une durée suit les conventions existantes, sans nouvelle borne ni valeur par défaut.

*Sources :* Δ28 ; D-412, D-418, D-434 ; RM-250 ; RO-01.

### 4.5 Champ de saisie clavier et navigation

Depuis D-434 (décision de Hermann du 19/10), le clavier porte la charge, le libellé de phase et toutes les valeurs éditables des tableaux : cellules Durée et Pause des séries variables et durées de phase, en MMSS. Hors tableaux, les autres valeurs gardent leurs roues et steppers (ligne NR Δ30, remplacée en partie). D-434 remplace « le clavier reste propre à deux contenus ».

#### FR-23 : Saisie dans la cellule

La charge se saisit directement dans sa ligne (identiques) ou dans sa cellule (variables). La fenêtre intermédiaire « Charge — Série 1 » est supprimée.

**Durées et pauses des tableaux (D-434).** Les cellules Durée et Pause du tableau des séries variables et les durées éditables des phases se saisissent au clavier numérique, en MMSS, directement dans la cellule. Plus de roue pour la durée ni de stepper pour la pause dans le tableau des séries variables.

- Sans focus, la durée est affichée en unités explicites, sans zéros inutiles : 5 s ; 1 min 5 s (65 s) ; 1 min 30 s (90 s) ; 12 min ; durée nulle autorisée : 0 s.
- Avec focus, la valeur est affichée dans la même cellule au format MM:SS, sur quatre chiffres : 00:05, 01:05, 01:30, 12:00.
- Les chiffres frappés se décalent vers la gauche, quatre au plus ; le séparateur `:` est inséré automatiquement.
- Le changement de format a lieu dans la cellule ; aucun champ de saisie supplémentaire.

**Focus (D-434), pour les cellules Durée, Pause, Charge et les durées de phase.**

- À l'activation, la cellule et sa valeur sont mises en évidence et le clavier natif s'ouvre.
- La sélection native de texte, qui fait apparaître les deux poignées verticales iOS, n'est pas utilisée.
- La première frappe remplace la valeur existante ; les suivantes composent la nouvelle valeur ; Retour arrière supprime le dernier chiffre.
- Ces règles remplacent la sélection de toute la valeur au focus (recette du 19/10, RC-3).

Les bornes et validations existantes des durées, pauses et charges sont conservées, ainsi que les séries à cible numérique, à l'échec et mixtes, les phases à durée libre et imposée, le modèle de données et la persistance.

*Sources :* Δ29 ; D-405, D-434 ; PR-04.

#### FR-24 : Visibilité et clavier dans la Feuille

Quand un champ de saisie clavier est actif :

- le clavier est le clavier numérique standard d'iOS et d'Android, décimal pour la charge, numérique pour les durées et pauses en MMSS (D-434) ; aucun clavier personnalisé ;
- à l'apparition du clavier et à chaque Précédent / Suivant, la ligne contenant le champ actif reste entièrement visible au-dessus du clavier ; si elle est trop bas, le contenu de la Feuille défile automatiquement pour la remonter ; il n'est pas nécessaire d'afficher toutes les lignes du tableau en même temps (correction de Hermann du 19/10) ;
- le clavier numérique se ferme par le bouton « Fermer », à droite de la barre ;
- la barre porte, de gauche à droite, sur une seule ligne : « À l'échec » | « ← Précédent » | « Suivant → » | « Fermer » (D-434). Les flèches sont accompagnées des libellés Précédent et Suivant si la largeur le permet ; sinon, flèches seules avec leurs libellés d'accessibilité. Les zones tactiles sont préservées ;
- « À l'échec » est visible pour les cellules de durée cible des séries lorsque le mode À l'échec est autorisé ; il bascule entre cible numérique et À l'échec pour la seule série, en préservant les valeurs selon les règles existantes (FR-22, RM-250). Il n'apparaît ni pour les pauses, ni pour les charges, ni pour les durées de phase ;
- une seule surface est ouverte à la fois ;
- l'absorption de ✓ et ✕ suit Q47.

*Sources :* Δ29 ; CE-UI-10 §10 l. 1085-1087 ; D-413, D-434 ; GR-01 ; PR-04.

#### FR-25 : Précédent / Suivant et cellule active

Dans la barre du clavier numérique, Précédent et Suivant déplacent la saisie entre les cellules saisies à ce clavier : depuis D-434, les cellules Durée, Pause et Charge du tableau des séries variables et les durées de phase (D-434 remplace « c'est-à-dire les cellules de charge »). Précédent, Suivant et Fermer restent disponibles dans tous les cas applicables. L'ordre de parcours n'est pas fixé par la décision (§9, QD-434-2).

- Le clavier reste ouvert pendant la navigation.
- La valeur de la cellule atteinte reste éditable.
- La cellule active se distingue par sa couleur de fond, qui suit le focus. Cette couleur est un indicateur d'état, pas une règle de valeur.
- L'état actif reste annoncé de façon accessible.
- Aux extrémités et sur les cellules indisponibles, le comportement suit les conventions de focus existantes, sans boucle inventée.
- La cellule atteinte suit les règles de focus de FR-23 : pas de sélection native, première frappe qui remplace la valeur.
- Hors tableaux, les roues et steppers ne deviennent pas des champs clavier (D-434 ne vise que les cellules des tableaux).

*Sources :* Δ49 ; décision de Hermann du 19/10 ; D-434.

### 4.6 Présentation de la Feuille

#### FR-26 : Quatre cadres

La Feuille se compose de quatre cadres gris arrondis, espacés de 8, dans cet ordre :

1. **Exécution** : Mode, Condition d'arrêt.
2. **Séries** : Phases de l'exercice et leur tableau ; Nombre de séries ; Type de série ; Durée ou Répétitions et Pause, ou le tableau variable ; Charge.
3. **Côtés** : Changement de côté, puis Enchainement et Pause entre les côtés.
4. **Cadence et durée** : Cadence, Durée de l'exercice, puis Compte à rebours et Fin d'exercice.

- Les libellés suivent PR-01.
- Le contenu conditionnel reste dans son cadre, sans chevauchement.
- Les panneaux ancrés gardent leur placement par rapport à la ligne d'origine dans le nouveau découpage.
- Une couleur sans jeton est une constante locale nommée (Q-V3-10) ; les jetons restent inchangés.
- Les briques existantes sont réutilisées : `Row`, `ValuePill`, `Separator`, `SheetMotion` et les animations Q39 à Q41.

*Sources :* Δ31 ; D-413 ; GR-01 ; PR-01 ; RC l. 1187-1202.

#### FR-27 : Segmentés en ligne

Mode, Condition d'arrêt, Phases, Type de série, Charge, Changement de côté, Enchainement et Cadence sont des segmentés en ligne :

- alignés à droite ;
- sans enveloppe blanche ;
- sans popover ni panneau.

Ils réutilisent le `SegmentedControl` existant, avec une variante de style. Une option indisponible garde sa valeur réelle.

Principes de traitement (PR-03), dont les valeurs numériques sont relevées sur Figma :

- libellés de ligne en regular, plus petits que les valeurs ;
- options non sélectionnées en gris regular, sur le même fond clair que les champs variables ;
- options sélectionnées dans le traitement violet existant ;
- même largeur pour les options d'un même contrôle.

Le segmenté natif d'`@expo/ui` 57 ne le remplace qu'après une vérification courte, et seulement si elle démontre un gain de simplicité sans perte visuelle, fonctionnelle ni d'accessibilité. Aucune story de refonte, aucune abstraction nouvelle.

*Sources :* Δ32 ; D-413 ; RC l. 1204 ; PR-03 ; QP5-06 ; R-01, R-03.

#### FR-28 : Chevrons intérieurs

Les options Variables (Type de série), Avec (Phases) et Avec (Changement de côté) portent un chevron intérieur, centré avec le texte : vers le haut si le contenu est déployé, vers le bas sinon. Replier conserve les valeurs et le mode actif.

Le chevron est graphique : c'est l'icône existante `control-chevron-up` / `control-chevron-down` (celle de `DisclosureControl`), jamais une flèche ni un caractère. Dans l'option Avec des phases, il se place à droite du nombre « n phases » et reste visible quand le stepper est inactif (FR-4).

*Sources :* Δ33 ; D-410 ; RM-247 ; CV-01.

#### FR-29 : Tableaux sans steppers de cellule

Les tableaux des séries et des phases ont un fond blanc sans contour et des lignes de 36. Les autres lignes de la Feuille restent à 44.

- Aucun stepper permanent dans les cellules.
- Chaque cellule ouvre, pour elle seule, la saisie de son champ : clavier numérique MMSS pour Durée et Pause, clavier décimal pour la charge (D-434, qui remplace la roue de cible et le stepper de Pause de cellule) ; la cellule Répétitions n'est pas visée par D-434 (§9, QD-434-1).
- Sont conservés : glisser, croix, « Série supprimée — Annuler » sur fond `#FFF1F0` (Q35). La roue sous la ligne (Q45) est sans objet pour les cellules Durée et Pause depuis D-434 ; pour la cellule Répétitions, voir QD-434-1.
- La cible tactile des lignes de 36 est vérifiée sur appareil avant toute autre géométrie.

Principes de PR-02, qui priment sur une ancienne capture :

- le fond blanc reste dans son cadre, sans déborder ni chevaucher les lignes voisines ;
- aucun séparateur après le tableau des phases ;
- sous la dernière ligne, un espace d'une hauteur de ligne ;
- les valeurs sont alignées avec leurs en-têtes ;
- les numéros sont rapprochés des poignées.

*Sources :* Δ34 ; D-413, D-417, D-434 ; RC ligne 5 ; CE-UI-10 §9 ; PR-02 ; QP5-05 ; R-05, R-06, R-18.

#### FR-30 : Cadence

La Cadence propose Autre / 5 s / 2 s / 1 s / Sans, et l'option sélectionnée reflète la valeur courante.

- Sans vaut 0.
- Autre révèle le mécanisme ± existant : 0 à 10, pas de 1, sans accélération.
- Aucune valeur personnalisée n'est mémorisée : Sans puis Autre ne restaure rien.
- Les bornes, le pas et la donnée sont inchangés (D-312, D-313).

*Sources :* Δ35 ; D-408, D-420 ; RM-245 ; CA-01.

#### FR-31 : Durée de l'exercice

La ligne « Durée de l'exercice » remplace « Durée totale » à l'écran. Son chevron est placé à 12 du libellé. Elle est repliée par défaut et masque Compte à rebours et Fin d'exercice sans les désactiver.

- Le chevron pointe vers le bas une fois replié, vers le haut une fois déployé.
- Ouvrir ou fermer la section ne modifie pas la valeur de durée ; c'est indépendant de son édition.
- **Ligne toujours affichée (D-433, décision de Hermann du 19/10).** La ligne est présente dans tous les modes et tous les états de saisie, à la même place, y compris lors des transitions entre ses trois états :
  1. données nécessaires manquantes : `—` (D-384) ;
  2. durée non calculable pour la configuration choisie : « Non calculable », notamment en Répétitions sans cadence, à l'échec, ou lorsqu'une combinaison comporte une partie empêchant le calcul. Cet état prime sur `—` lorsque la configuration exclut déjà le calcul ;
  3. durée calculable et données complètes : la valeur, avec « ≥ » pour une borne inférieure, « ≈ » pour une estimation, sans symbole si la durée est déterminée. Le symbole est placé immédiatement avant la valeur, dans la même zone d'affichage, jamais à côté du titre ni dans un élément éloigné : « ≥ 5 min 30 s », « ≈ 5 min 30 s ».

  `—` et « Non calculable » ne représentent jamais une durée nulle. D-433 remplace le masquage de D-397 et l'ancien cas « ligne absente (RC ligne 11) : signaux directement visibles » ; il remplace aussi le symbole porté par le libellé (« Durée totale ≈ », rendu PRE-3, Figma `7059:13302`).
- Dans un Exercice ouvert depuis une Séance, Compte à rebours et Fin restent absents ; le chevron ne les réintroduit pas.
- Restent inchangés : le calcul, les natures et l'attribution des symboles, `—`, l'affichage à N = 1 (D-384, D-396), les conditions de modification de la durée, la validation, les bornes T(1) à T(99) (Q46) et RM-218.

*Sources :* Δ36 ; D-409, D-433 ; RM-246 ; DU-01.

#### FR-32 : Hauteur adaptée au contenu

La Feuille s'adapte au contenu visible. Un repli ne laisse aucun espace vide. Avec six phases, le contenu défile. La marge basse reste réduite (PR-04). Les animations Q39 à Q41 sont conservées.

*Sources :* Δ37 ; D-413 ; CE-UI-10 §10 ; GR-01.

### 4.7 Écran principal de l'éditeur

#### FR-33 : Description en étapes

La Description est une liste d'étapes numérotées.

- **État vide :** une seule ligne grise, « 1. » suivi de « Décrivez la première étape », sans ligne d'invitation.
- **Liste remplie :** une ligne d'invitation grise « n. Étape suivante » suit la dernière étape.
- **Entrée** crée l'étape suivante. Il n'y a pas de bouton Ajouter.
- **Modification :** chaque étape existante reste modifiable en place.
- **Pas de réordonnancement :** c'est le modèle A ; le modèle B, réorganisable, est écarté.
- **Retour arrière** sur une étape vide la supprime et place le curseur en fin de l'étape précédente.
- **↑** ferme le clavier (D-351, conservé).
- Le contenu défile au-dessus du clavier ; `Terminer` reste immobile (D-349).

**Présentation :** elle suit l'état courant de Figma (Prototype MVP), relevé au moment de la story (S-2). Le registre v25 la fait évoluer en plusieurs étapes :

- demande 10 : cadre blanc de rayon 8, padding 14, espacement 8 ; numéro en Inter Medium 15, `#595E66`, largeur 16, aligné à droite ; texte en Inter Regular 15 ; invite en `#AEB3BA` ;
- demande 17 : textes des étapes à 14, numéros compris ;
- demande 21 : la Description n'a plus de contenant ; le cadre passe sur la Carte (FR-38).

Ces chiffres sont des propriétés de présentation, pas des règles (voir §9, point signalé).

*Sources :* Δ01 ; D-425 ; ch. 08 l. 366 ; CE-T03-04 l. 797, 841 ; QP5-02 ; `table-delta.md` §6, précisions ; registre v25, demandes 10, 17 et 21.

#### FR-34 : Validation et conservation des étapes

- À `Terminer`, les étapes vides sont retirées et la liste est renumérotée. L'ordre est préservé.
- La limite de 1 000 caractères porte sur l'ensemble des textes des étapes, numérotation exclue. Elle s'applique à la chaîne encodée, séparateurs de ligne compris, sans migration (QN-1, validée par Hermann) : ces séparateurs ne sont pas de la numérotation générée.
- Les étapes sont enregistrées et relues à la réouverture. Elles sont transportées par la copie Définition → Séance et par la duplication.
- La détection de modification de l'éditeur porte sur les étapes.

*Sources :* Δ02, Δ03 ; ch. 09 l. 332 ; ch. 11 l. 100, 125 ; QP5-02.

#### FR-35 : Anciennes descriptions

Aucune migration, aucune conversion réversible, aucun retour à l'ancien format. L'ancien texte n'est réutilisé que si les mécanismes disponibles le permettent simplement. Sinon, recréer à la main les trois ou quatre descriptions existantes est accepté.

Cette tolérance ne vaut que pour les descriptions. Toutes les autres données de l'Exercice sont conservées.

*Sources :* QP5-01 (décidé). La reprise des anciens textes et son test, prévus par Δ02, sortent du périmètre.

#### FR-36 : Carte sans Compte à rebours ni Fin

Compte à rebours et Fin sont retirés du résumé de la Carte et de son nom accessible, avec leur filet de séparation (`cardSeparator`). C'est une modification de présentation seulement.

Restent inchangés :

- les données ;
- la Feuille ;
- `computeExercisePlanDuration` ;
- la Phrase et sa « Durée totale » (Q-V3-13).

*Sources :* Δ04 ; cadrage l. 26 ; D-413 ; R-14.

#### FR-37 : Terminer abaissé et zone protégée

`Terminer` est abaissé selon Figma. Une zone réservée au-dessus de lui garantit que le dernier contenu n'est jamais masqué, clavier ouvert ou fermé.

`Terminer` ne remonte pas avec le clavier (D-349). Ses couleurs actif et inactif sont conservées.

*Sources :* Δ05 ; cadrage l. 27 ; registre du 10/10, demande 20 (y802) ; D-349. Les mesures sont relevées sur Figma (S-2).

#### FR-38 : Conformité Figma de l'écran principal

Sont alignés sur Figma :

- le titre d'en-tête et le Nom ;
- l'accès à la Catégorie et aux Zones ;
- les titres de section et le cadre des modalités ;
- les typographies, couleurs et positions.

Les écarts E-V1 à E-V16 retenus sont corrigés.

Deux points des sources finales précisent cet alignement :

- **Classification Catégorie / Zones** (registre v25, demandes 13, 14 et 18) :
  - une seule forme, avec deux registres d'état, « à renseigner » et « renseigné » ;
  - rien ne bouge entre les deux états ;
  - le glyphe plein est teinté de la couleur de la Catégorie ;
  - les cibles tactiles sont préservées et ne recouvrent pas le Nom.
- **Carte des modalités** (demande 21) : bloc `#F9FAFC` de rayon 12, sans liseré. La couleur existe déjà en jeton (`surfaceSubtle`).

Sont conservés :

- la grille verticale D-327 ;
- le libellé accessible « Retour » du ✕ (Q48) ;
- le séparateur des Zones (Q49) ;
- les comportements de Catégorie et Zones (Q49, Q53) ;
- les jetons verrouillés.

Tout écart dont la correction exigerait un nouveau jeton ou le remplacement d'un composant accepté est signalé à Hermann, pas décidé (voir §9, point signalé).

*Sources :* Δ06 ; cadrage l. 24 ; registre du 10/10, demandes 1, 5, 13, 14, 17, 18, 21 ; Q48 ; C-4, C-6.

### 4.8 Persistance, copies, Phrase et lexique

#### FR-39 : Format persisté compatible

Les nouvelles données (phases, charge, étapes) sont persistées et relues.

- Leur absence se lit sans phases, charge Sans, comme dans les données PRE-4 et `migration010`.
- La lecture de l'ancien format est livrée avec la nouvelle écriture.
- Les migrations 001 à 010 restent intactes. Le choix du format est une question d'architecture (addendum, Q-A1).

*Sources :* Δ39 ; ch. 09 l. 378-380 ; ch. 11 l. 118 ; spécification des phases §5.

#### FR-40 : Projection scalaire bornée

La durée projetée d'un Exercice à phases reste dans les bornes du CHECK de la base. FR-3 le garantit à la saisie ; la projection le garde aussi.

*Sources :* Δ40 ; ch. 08 l. 345 ; CE-UI-10 §14.

#### FR-41 : Copies, duplications et instantanés

Les copies Définition → Séance, les duplications et les instantanés transportent :

- les phases ;
- la charge, y compris les valeurs conservées sous Sans ;
- les étapes.

Chaque copie reste isolée.

*Sources :* Δ41 ; D-403 ; ch. 09 l. 242, 430, 450 ; ch. 11 l. 125 ; cadrage, clarification 6.

#### FR-42 : Phrase avec charge

Avec une charge active, la Phrase mentionne la charge après la valeur par série (D-422), sous la forme fixée par D-414 :

- charge commune : `(charge : 20 kg)` ;
- charges variables, jusqu'à trois séries : `(charges : 20, 12, 13 kg)` ;
- plus de trois séries : `(charges : 20, 12 kg, ...)`.

Règles complémentaires :

- Les valeurs sont celles des séries, dans leur ordre. Une charge commune n'est pas présentée quand les séries diffèrent.
- Une série à zéro apparaît dans la liste avec la valeur 0, par exemple `(charges : 0, 10, 15 kg)` (D-423).
- Sous Sans, aucune mention.
- La charge ne change ni le statut des durées, ni leurs symboles.
- Les 276 phrases sans charge restent intactes, à une exception près : la clause des côtés devient neutre (FR-18).

*Sources :* Δ42 ; D-414, D-422, D-423 ; RM-240 ; ch. 10 l. 491, 507. D-414, validée par Hermann le 18/10, fixe la forme ; l'exemple « avec une charge de 10 kg » de CH-08 n'est pas repris.

#### FR-43 : Phrase avec phases

Après la durée de série, une parenthèse détaille les phases dans l'ordre d'exécution : « **3 séries de 9 s** (Descente : **6 s** - Maintien : **3 s**), avec une pause après chaque série de **15 s**. »

- La liste est exhaustive, même pour une seule phase, avec les libellés et durées effectifs.
- La Phrase se régénère après toute modification des libellés, de leur ordre ou des durées.
- Sans phases, la Phrase ne change pas.
- Le générateur et ses segments existants sont réutilisés.
- Le corpus est étendu avec les déclinaisons des phases.

*Sources :* Δ44 ; QP5-09 (corrige §3) ; spécification des phases §4.1, §5.

#### FR-44 : Lexique

Le lexique ajoute les nouveaux libellés :

- Condition d'arrêt et ses trois résultats ;
- Phases, Charge, kg, Avec / Sans ;
- Enchainement et ses deux options ;
- Cadence et ses options ;
- Durée de l'exercice ;
- invites des étapes.

Les clés devenues orphelines sont retirées, par exemple celles de la Carte et les libellés anatomiques des côtés. Les sous-titres `sideOrderSubtitles` ne sont pas orphelins : ils deviennent le texte des options d'Enchainement (D-431, FR-17). Les identifiants techniques restent inchangés (D-201).

*Sources :* Δ46 ; RM-092 ; D-413.

### 4.9 Bornes des durées

#### FR-45 : Minimum de 1 s pour toute durée positive

Toute durée strictement positive a un minimum de 1 s et un pas de réglage de 1 s. La décision cite la durée de série, la durée de phase et la durée de l'exercice, avec un « etc. ».

Le minimum de 5 s est abaissé à 1 s. Le pas de 1 s existe déjà pour la durée de série depuis PRE-4 (Q36, `EXECUTION_BOUNDS.durationTarget`, `EP:82-88`).

- La Durée de l'exercice continue de proposer les valeurs T(1) à T(99) de l'inversion (Q46, FR-31). Seules ses éventuelles valeurs de saisie en secondes sont concernées.
- Zéro reste autorisé là où il l'était déjà : Pause, Compte à rebours, Fin, etc.
- Pour ces durées qui admettent zéro, seul un éventuel minimum positif ou palier de 5 s est retiré. L'architecture relève leur pas actuel. Elle signale toute extension qui irait au-delà du texte de la décision (voir §9).
- Les maxima existants sont conservés. La durée de série et la somme des phases sont donc comprises entre 1 et 3 535 s.
- Les roues, validations et tests existants sont adaptés, sans nouveau composant ni nouveau mécanisme de saisie. Depuis D-434, les cellules de durée et de pause des séries variables et les durées de phase se saisissent au clavier MMSS (FR-23) ; ces bornes s'y appliquent inchangées.
- Les règles de calcul et les autres comportements validés ne changent pas.
- Les durées imposées par un format suivent leurs propres contraintes, hors périmètre (§8).

*Sources :* Δ50 ; décision de Hermann du 19/10 — bornes minimales des durées. Le rapport `propagation-borne-1s.md`, cité par Δ50, est absent du clone à la date du PRD. La décision remplace D-232, RM-234 et toute règle antérieure imposant 5 s, ainsi que la lecture « 5 à 3 535 s » de QP5-04 (`table-delta.md` §6).

## 5. Exigences non fonctionnelles transverses

- **NFR-1 — Primitives natives d'abord.** Quand une primitive native iOS existe pour l'interaction, elle est utilisée, et l'intégration s'adapte autour d'elle (AGENTS.md). Aucun composant déjà accepté n'est remplacé sans décision explicite. Les seuls remplacements admis sont ceux du §7. Le `SegmentedControl` React Native est réutilisé par défaut : c'est une exception décidée (QP5-06), car il est déjà accepté.
- **NFR-2 — Garde-fous des roues.** Les tests `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260`, qui assertent zéro `ScrollView` sur iOS, restent intacts et passent. Aucune `ScrollView` n'est introduite dans les sélecteurs qu'ils gardent.
- **NFR-3 — Schéma et jetons verrouillés.** `migration001.ts` n'est jamais modifiée ; un changement de schéma passe par une nouvelle migration numérotée, seulement si l'architecture le rend nécessaire. Les valeurs de `tokens.ts` restent inchangées et `tokensSpecification.test.ts` passe.
- **NFR-4 — Contrôles locaux.** Chaque story se termine avec `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- **NFR-5 — Recette sur appareil.** Une suite verte ne prouve jamais un rendu, un geste ou un comportement du clavier. La présentation, les gestes et le clavier sont recettés sur iPhone par Hermann, groupés par lot : Feuille, puis Éditeur. Les décisions de recette de Hermann priment et sont reportées dans les documents.
- **NFR-6 — Recette précoce du champ numérique.** Avant toute généralisation, le champ de saisie clavier de la charge est essayé tôt sur iPhone, avec Précédent / Suivant, « Fermer » et le fond de la cellule active (FR-23 à FR-25 ; audit PRE-4, action 4). L'essai porte sur les composants définitifs ou directement réutilisables (`KeyboardField` final, barre Précédent / Suivant / Fermer, fond actif), pas sur une interface provisoire à reconstruire. Un problème du seul clavier décimal ne bloque que la saisie de la charge : les fonctions indépendantes, dont le libellé de phase au clavier texte (FR-6), n'en dépendent pas.
- **NFR-7 — Accessibilité.**
  - Les nouveaux tableaux gardent les alternatives accessibles des gestes (CE-UI-10 §13).
  - Le résultat dérivé et les options indisponibles exposent une sémantique non modifiable.
  - La cellule active est annoncée.
  - Hors tableaux, les cibles tactiles restent de 44. La dérogation à 36 dans les tableaux (R-06) est vérifiée sur appareil.
- **NFR-8 — Préservation de PRE-4.**
  - Un comportement validé ne change que par un remplacement ou un changement de présentation listé au §7.
  - Une divergence avec un document généré ne suffit pas à modifier l'existant : elle est signalée.
  - Aucune refactorisation justifiée seulement par ce PRD.
  - La revue approfondie est réservée à la persistance et aux mécanismes nouveaux : phases, charge, champ clavier.
  - Les décisions finales sont consolidées une seule fois, dans les documents courants. La recette déjà validée n'est pas rouverte (audit PRE-4, action 5).
- **NFR-9 — Textes et conventions.** Tout texte visible passe par `src/shared/i18n/` (`strings`). Les conventions d'`AGENTS.md` s'appliquent, notamment :
  - le terme « Set » est proscrit (D-077) ;
  - les noms de code sont en anglais (D-035) ;
  - la persistance passe uniquement par les repositories (D-043) ;
  - la duplication volontaire de `PickerToolbar` est conservée ;
  - le piège des fins de ligne Windows (CRLF) est pris en compte, en particulier si les étapes sont encodées une par ligne.
- **NFR-10 — Données existantes.** Aucun Exercice ni aucune Séance existants ne perdent de paramètre. La seule tolérance concerne les descriptions (FR-35).

## 6. Non-régression (lignes NR)

Ces lignes sont déjà conformes. Elles n'ont ni story, ni revue complète. Leurs tests existants doivent continuer de passer.

| Δ | Exigence de non-régression | Preuve |
|---|---|---|
| Δ07 | Ordre Description → Paramètres d'exécution → Média ; titre « Paramètres d'exécution » (Q11) ; Carte vide sans invite (Q55) | Tests existants de l'éditeur |
| Δ24 | Enchainement non affiché à N = 1, Avec / Sans disponible, Enchainement conservé (Q38 = D-415) | Tests Q38 |
| Δ30 | Aucune autre valeur ne passe au clavier : roues natives et steppers conservés. **Remplacée en partie par D-434 (19/10)** : les cellules Durée et Pause du tableau des séries variables et les durées de phase passent au clavier numérique MMSS ; hors tableaux, la ligne reste valable | `DurationWheelPicker.test.tsx:371-379`, `NumberWheelPicker.test.tsx:260` |
| Δ38 | Nombre de séries, Pause, Pause entre les côtés, Compte à rebours et Fin : valeur au repos, ± à l'appui ; roues en panneau sans flèche ; ✓/✕ en deux temps ; fond rouge pâle si manquante (Q35, Q37, Q41, Q46, Q47). **Impératif (revue du 19/10) :** le stepper « Nombre de séries » de PRE-4 est conservé à l'identique (présentation, interactions, révélation et fermeture, pas, accessibilité) ; le tableau des séries variables suit N ; aucun remplacement par une roulette ni par le clavier ; seule son intégration visuelle dans la nouvelle Feuille peut s'adapter | Tests existants de la Feuille ; critère explicite de la recette Feuille (stories 2.4 à 2.6) |
| Δ47 | Durées de Séance, synthèses de ligne du Catalogue et de la Composition, carte du Catalogue : inchangées tant que `workSeconds` reste juste avec les phases | `calculations.test.ts`, `compositionPresentation.test.ts`, `ActivityCard.test.tsx` |

Sont aussi conservés, malgré les captures : la Pause après chaque série à N = 1 (la matrice du 19/10 ne prime pas) et les steppers révélés de N et de la Pause (C-5).

## 7. Remplacements de comportements acceptés

Seuls ces remplacements sont admis : R-01 à R-16 de `table-delta.md` §2, plus R-17, issu de la décision du 19/10 sur les bornes minimales des durées, et R-18, issu de D-434. Tous sont décidés.

| R | Comportement PRE-3 / PRE-4 | Remplacé par | FR |
|---|---|---|---|
| R-01 | Popover natif du Mode | Segmenté en ligne | FR-27 |
| R-02 | Côté : segmenté à trois valeurs dans un panneau | Avec / Sans en ligne, chevron intérieur | FR-15, FR-27 |
| R-03 | Régime dans un panneau | « Type de série » en ligne, chevron dans Variables | FR-27, FR-28 |
| R-04 | Ordre des côtés dans un panneau | Segmenté en ligne dans le cadre Côtés (QP5-07) | FR-17 |
| R-05 | ± permanents des cellules Cible et Pause | Sélecteur ouvert par la cellule | FR-29 |
| R-06 | Lignes de tableau à 44 | Lignes de 36 dans les deux tableaux (QP5-05) | FR-29 |
| R-07 | « Ordre des côtés » ; options à libellés longs et sous-titres D1/G1 | « Enchainement » ; options réduites à la notation graphique Figma (D-431, QP5-07 révisée) | FR-17 |
| R-08 | Droite puis gauche / Gauche puis droite | Avec / Sans | FR-15, FR-16 |
| R-09 | « Aucune durée, à l'échec » dans la roue de Durée commune | Condition d'arrêt | FR-19, FR-22 |
| R-10 | « Aucune répétition, à l'échec » en identiques | Condition d'arrêt | FR-19, FR-22 |
| R-11 | « Bip de cadence » en stepper | Cadence segmentée, Autre avec ± | FR-30 |
| R-12 | « Durée totale », absente sans durée calculée, `≈` dans le libellé ; Compte à rebours et Fin toujours visibles | « Durée de l'exercice » avec chevron, toujours affichée (`—`, « Non calculable » ou valeur), `≈`/`≥` juste avant la valeur (D-433) | FR-31 |
| R-13 | Description multiligne, Retour = saut de ligne | Étapes numérotées | FR-33 à FR-35 |
| R-14 | Compte à rebours et Fin sur la Carte | Retirés de la présentation | FR-36 |
| R-15 | Indicateur « D→G » de la Composition | Indicateur sans direction | FR-18 |
| R-16 | Phrase « côté droit puis le gauche » | « côté 1 / côté 2 » | FR-18 |
| R-17 | Durées positives au minimum de 5 s (D-232 et RM-234, pour leur part relative aux durées ; le pas de 5 s est déjà levé par Q36 ; les bornes de répétitions et de séries sont inchangées) | Minimum de 1 s, maxima inchangés (décision du 19/10) | FR-45 |
| R-18 | Cellules du tableau des séries variables : roue de cible sous la ligne (Q45) à option « À l'échec » en tête, stepper de Pause de cellule ; roue de durée de phase ; barre « Précédent / Suivant / Fermer » limitée à la charge ; toute la valeur sélectionnée au focus (RC-3) | Clavier numérique MMSS dans la cellule (« 1 min 5 s » au repos, « 01:05 » au focus) ; barre « À l'échec | ← Précédent | Suivant → | Fermer » ; pas de sélection native, première frappe qui remplace (D-434). Cellule Répétitions non visée (QD-434-1) | FR-7, FR-22 à FR-25, FR-29 |

**Changements de présentation demandés explicitement.** Ils ne remplacent aucun comportement validé autre que leur présentation. NFR-1 et NFR-8 les admettent au même titre que R-01 à R-18.

| Changement | Source | FR |
|---|---|---|
| Quatre cadres au lieu d'un groupe unique | D-413, GR-01 | FR-26 |
| Chevrons intérieurs au lieu du `DisclosureControl` indépendant | D-410, RM-247 | FR-28 |
| Ligne de cible masquée en identiques à l'échec | D-419, QP5-08 | FR-21 |
| `Terminer` abaissé, avec zone protégée | cadrage l. 27 | FR-37 |
| Conformité Figma de l'écran principal, pour les écarts retenus | cadrage l. 24 ; Q48 | FR-38 |
| Description en étapes, Carte allégée | D-425 ; cadrage l. 26 | FR-33, FR-36 |

## 8. Exclusions explicites

- **Exécution :** moteur d'exécution, cadran, audio, annonces de phases, progression et affichage de la charge pendant l'exécution (spécification des phases §4 ; CH-09). Les nouvelles données sont seulement transportées. La persistance des phases ne vaut pas livraison de leur exécution.
- **Formats :** formats de Séance, durée imposée, dernière phase calculée et adaptation proportionnelle des phases (D-372, D-374 ; spécification des phases §3). Δ15 est sans objet : aucun parcours de format n'existe dans `src/`. Le comportement spécifié reste valable, mais il n'est pas développé en PRE-5, et le calcul de la dernière phase n'est pas généralisé à la durée libre (FR-5).
- **Planification :** non touchée.
- **Calculs, Composition et instantanés :** modifications limitées au strict nécessaire (transport des nouvelles données, affichage neutre des côtés). L'ordre des côtés, les identifiants techniques (`LedgerSide` de `executionCalculations.ts` compris) et les résultats historiques ne changent pas.
- **Anciennes descriptions :** pas de migration ni de conversion (FR-35).
- **`SegmentedControl` :** pas de refonte ; seule une variante de style est admise (FR-27).
- **Écrans voisins :** pas de refonte de la Composition, du Catalogue, des médias ni des référentiels. Seuls les points de passage nécessaires changent (FR-18, FR-41, Δ47).
- **Modèle :** aucun troisième Mode ; aucune condition Mixte persistée ; aucun nouveau réglage booléen des signaux.
- **Clavier :** il n'est étendu à aucune autre valeur que la charge, le libellé de phase et, depuis D-434, les cellules Durée et Pause du tableau des séries variables et les durées de phase. Hors tableaux (Durée d'une série et Pause des séries identiques, Nombre de séries, Pause entre les côtés, Cadence, Durée de l'exercice, Compte à rebours, Fin), rien ne change. Aucun clavier numérique personnalisé.
- **Figma :** aucune règle métier n'est déduite de valeurs illustratives ; aucune modification de Figma.
- **Hors périmètre :** mécanismes VNext, push, fusion et EAS.

## 9. Questions ouvertes

Toutes les QP5 sont décidées : `table-delta.md` §6, ainsi que les décisions complémentaires du 19/10 sur les bornes minimales et sur le passage des phases de Avec à Sans, et les décisions qui suivent la revue indépendante du 19/10 (D-431, D-432). Les incompatibilités QR-1 et QR-2 ci-dessous ont été validées par Hermann le 19/10 avec les défauts proposés. Restent ouverts les seuls points non tranchés par D-434 (QD-434-1 à QD-434-4, ci-dessous).

Restent quatre types de points : les points d'architecture, les propriétés Figma, les incompatibilités du contrôle 2–6 et les points signalés, que les sources laissent ouverts.

- **Points d'architecture :** Q-A1 à Q-A7, détaillés dans `addendum.md`. Exemples : version 2 étendue ou version 3 du JSON ; représentation de la charge ; emplacement des phases.
- **Propriétés Figma (S-2) :** à relever en lecture seule, frame par frame, au moment des stories concernées. Les identifiants Figma actuels sont vérifiés avant de fonder une story sur une ancienne référence. Il s'agit notamment :
  - des mesures de `Terminer` et de sa zone ;
  - des typographies de l'écran principal ;
  - du gris des cadres et du violet de sélection ;
  - des dimensions des segmentés et du chevron ;
  - du rendu du résultat dérivé ;
  - de la cellule de charge en saisie ;
  - des mesures du segment Avec des phases et de son chevron (`9207:18817`, vérifiée par Hermann le 19/10 : segment « Avec ^ » à chevron ; lignes à poignée, numéro, libellé, durée et croix ✕). Le contrôle d'ajout est tranché par D-432 : le stepper du segment Avec ;
  - de l'indicateur de côté de la Composition.

**Incompatibilités du contrôle 2–6 (D-432).** Le contrôle des phases règle de 2 à 6 phases, alors que deux règles existantes admettent moins de 2 phases. Hermann a validé QR-1 et QR-2 le 19/10 avec les défauts proposés ; les FR concernées portent « (QR-n validée par Hermann le 19/10) ».

- **QR-1.** La spécification des phases (§2.1) admet une seule phase, et la suppression de la dernière ramène à « Aucune » (§2.3, D-371) ; le stepper commence à 2.
  - Règle validée : la croix ✕ d'une ligne reste disponible au-dessus de 2 phases et devient indisponible à 2 ; le retrait passe alors par Sans.
  - Le stepper − retire la dernière phase, avec la même annulation que la croix.
  - Le stepper + ajoute une phase qui reprend la durée de la dernière (§2.2).
- **QR-2.** La normalisation au ✓ retire sans message les phases à 0 s ou à renseigner, et peut laisser moins de 2 phases.
  - Règle validée : s'il reste une seule phase, l'Exercice passe à Sans avec sa durée comme durée de série, sur le principe de D-371.
  - S'il n'en reste aucune, l'Exercice passe à Sans sans durée inventée : la validation existante s'applique.

**Points non tranchés par D-434 (décision de Hermann du 19/10, saisie au clavier numérique des tableaux).** Signalés, non décidés ; aucune règle n'est inventée.

- **QD-434-1 — Cellule cible en mode Répétitions.** D-434 cite les cellules Durée, Pause et Charge et les durées de phase, pas la cellule du nombre de répétitions d'une série variable. Sa roue à « Aucune répétition, à l'échec » en tête (Q8, D-418) n'est ni confirmée ni remplacée.
- **QD-434-2 — Ordre de Précédent / Suivant.** D-434 étend la barre à toutes les cellules saisies au clavier sans fixer l'ordre de parcours : ligne par ligne (Durée → Pause → Charge, puis ligne suivante) ou colonne par colonne ; ni si le parcours inclut la ligne Charge commune ou les libellés de phase (clavier texte, hors D-434), présents avec le tableau des phases.
- **QD-434-3 — Frappe MMSS hors bornes ou non normalisée.** Les bornes existantes sont conservées (durée 1..3535 s, soit 58:55 ; pause 0..300 s), mais D-434 ne dit pas comment traiter une frappe comme `01:75` (secondes ≥ 60) ou `99:99`, ni à quel moment (refus de la frappe, normalisation, validation à la sortie de la cellule).
- **QD-434-4 — Cellule vidée et cellule à l'échec.** D-434 ne dit pas ce que vaut une cellule de durée ou de pause entièrement effacée par Retour arrière à la sortie du champ (`—` à renseigner, 0 s, valeur précédente), ni ce qu'affiche au focus une cellule cible À l'échec, avant la première frappe.

**Points signalés, décidés par Hermann le 19/10.** Les points 2 à 10 ci-dessous sont tranchés dans `table-delta.md` §6, sous « Points signalés par le PRD ». Leur décision prime sur le texte qui suit. Il s’agit notamment :

- du bouton « Fermer » à droite de la barre du clavier ;
- de l’ordre des mentions dans la Phrase : phases, puis charge ;
- de l’ajustement par le nombre de séries, conservé ;
- de la Description au texte de 14, sans cadre.

Le point 1 (Q48) se traite story par story.

1. **Δ06 et Q48.** La table de delta indique que Δ06 dépend aussi de « l'arbitrage écart par écart de Q48 » (PRE-4, seize écarts E-V1 à E-V16). Aucune QP5 ne le tranche.
   - Le cadrage (l. 24) demande la conformité Figma. FR-38 l'applique dans les contraintes de NFR-1 et NFR-3.
   - Tout écart qui exigerait un jeton, un remplacement de composant ou une marge contraire à la grille D-327 est soumis à Hermann au moment de la story concernée. Exemple : les marges de 4 et 10 du registre, face aux 13 de la grille.
2. **Présentation de la Description.** Deux sources divergent :
   - les précisions de `table-delta.md` §6 reprennent la demande 10 du registre (cadre blanc de rayon 8, texte à 15) ;
   - les demandes 17 et 21 du même registre, ultérieures, portent le texte à 14 et retirent le contenant.

   FR-33 renvoie au Figma courant. Hermann confirme lors du relevé S-2.
3. **Ordre des mentions dans la Phrase.** Pour un Exercice à phases qui a aussi une charge, aucune source ne fixe l'ordre entre la parenthèse des phases (FR-43) et la mention de charge (FR-42), toutes deux placées après la valeur par série. Un cas de corpus est à faire valider par Hermann.
4. **Durée de l'exercice avec phases.** Deux sources divergent :
   - le scénario « Tableau de 3 phases » de la spécification v3 (§11.2) montre une Durée de l'exercice non modifiable ;
   - le ch. 13 (l. 1120) et la spécification des phases (§9) conservent l'inversion par N quand N est libre.

   FR-3 suit la règle écrite.
5. **Portée du pas de 1 s (FR-45)** pour les valeurs positives de Pause, Compte à rebours et Fin. La décision ne les nomme que pour y autoriser zéro.
6. **Cas de saisie des étapes non décrits.** Les sources ne décrivent pas trois cas :
   - Entrée au milieu d'une étape ;
   - le collage d'un texte sur plusieurs lignes ;
   - le comportement à 1 000 caractères atteints.

   À constater sur le comportement natif du champ pendant la story, puis à soumettre à Hermann à la recette, sans règle inventée.
7. **Cadence « Autre ».** Quand la valeur réglée par ± vaut 0, 1, 2 ou 5, CA-01 (« le choix visuel reflète la valeur ») ne dit pas si l'option Autre reste sélectionnée.
8. **Clavier décimal (FR-24).** Tranché par Hermann le 19/10 : bouton « Fermer » à droite de la barre ; la ligne du champ actif reste entièrement visible au-dessus du clavier, par défilement automatique si nécessaire, sans exiger l'affichage simultané de toutes les lignes. À vérifier lors de la recette précoce (NFR-6), notamment avec une ligne en bas du tableau.
9. **Charge et passage Variables → Identiques.** La charge commune reprend la règle existante des champs de série (FR-11). Si la valeur reprise est 0, FR-14 fait passer l'Exercice à Sans. Cette conséquence est à confirmer.
10. **Cellule de charge vidée** à la sortie du champ : aucune source ne dit si elle vaut 0 ou garde sa valeur précédente. La règle commune des champs de série (CH-04) s'applique, à constater.
## 10. Critères de réussite

- **SM-1 :** Hermann valide sur iPhone deux lots de recette :
  - le lot Feuille : FR-1 à FR-32 et FR-45 ;
  - le lot Éditeur : FR-33 à FR-38.

  Les FR de Phrase, de persistance, de transport et de lexique (FR-18, FR-39 à FR-44) sont vérifiés dans le lot où ils deviennent visibles : la Carte de l'Éditeur, et la Composition pour FR-18.
- **SM-2 :** les tests des lignes NR et les garde-fous NFR-2 et NFR-3 passent sans être affaiblis.
- **SM-3 :** une donnée PRE-4 relue après PRE-5 ne perd ni ne change aucun paramètre (FR-39, FR-41, NFR-10).

**À ne pas optimiser :**

- **SM-C1 :** le nombre de composants réécrits. Toute réécriture non exigée par un FR est un écart (NFR-8).
- **SM-C2 :** le nombre de tests verts, qui ne remplace pas SM-1 (NFR-5).

## Annexe — Couverture des lignes Δ

| Δ | FR / traitement |
|---|---|
| Δ01 | FR-33 |
| Δ02 | FR-34 ; reprise des anciens textes exclue (FR-35, QP5-01) |
| Δ03 | FR-34 |
| Δ04 | FR-36 |
| Δ05 | FR-37 |
| Δ06 | FR-38 (point signalé §9) |
| Δ07 | NR (§6) |
| Δ08 | FR-1 |
| Δ09 | FR-3 |
| Δ10 | FR-4, FR-5 |
| Δ11 | FR-6 |
| Δ12 | FR-7 |
| Δ13 | FR-2 |
| Δ14 | FR-8, FR-9 |
| Δ15 | Sans objet (§8) |
| Δ16 | FR-10 |
| Δ17 | FR-11 |
| Δ18 | FR-12 |
| Δ19 | FR-13 |
| Δ20 | FR-14 |
| Δ21 | FR-15 |
| Δ22 | FR-16 |
| Δ23 | FR-17 |
| Δ24 | NR (§6) ; FR-17 |
| Δ25 | FR-19 |
| Δ26 | FR-20 |
| Δ27 | FR-21 |
| Δ28 | FR-22 |
| Δ29 | FR-23, FR-24 |
| Δ30 | NR (§6), remplacée en partie par D-434 (FR-7, FR-23 à FR-25, FR-29) |
| Δ31 | FR-26 |
| Δ32 | FR-27 |
| Δ33 | FR-28 |
| Δ34 | FR-29 |
| Δ35 | FR-30 |
| Δ36 | FR-31 |
| Δ37 | FR-32 |
| Δ38 | NR (§6) |
| Δ39 | FR-39 |
| Δ40 | FR-3, FR-40, FR-45 |
| Δ41 | FR-41 |
| Δ42 | FR-42 |
| Δ43 | FR-18 |
| Δ44 | FR-43 |
| Δ45 | FR-18 |
| Δ46 | FR-44 |
| Δ47 | NR (§6) |
| Δ48 | FR-10 à FR-14 (préambule §4.2) |
| Δ49 | FR-25 |
| Δ50 | FR-45 (et FR-3, FR-7) |
