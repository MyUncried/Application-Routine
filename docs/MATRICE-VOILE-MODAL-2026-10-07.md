# Voile modal unique — traçabilité du 07/10/2026

Base vérifiée : `main` `ce7d641de233b8aad937ab513c979debf11c0696` (fusion #327). [Demande reçue](archives/voile-2026-10-07/demande-source.md), [preuves structurées et inventaire courant](VERIFICATION-VOILE-MODAL-2026-10-07.json).

## Règle consolidée

Tous les dialogues, feuilles de sélection, roues, filtres, classification, catégorie, zones corporelles, calendrier ouvert, abandon/confirmation et CE-UI-10 utilisent **`overlayScrim` = `color/overlay/scrim` = #1F2129 à 34 %**. Aucun autre token ou variante de couleur de voile n’est autorisé. Dans le code, le rôle est `color.overlayScrim` (`rgba(31, 33, 41, 0.34)`).

`compositionDraggedCardShadow` = `color/overlay-scrim` (#14171F, teinte opaque) reste réservé à l’ombre de la carte déplacée ; l’alpha est celui de l’effet d’ombre. Il est distinct de `overlayScrim` et ne sert jamais de voile. Aucun changement de calcul, de comportement modal, de shell ou de placement des contrôles. La roulette de CE-UI-10 reste inline dans sa feuille.

## Inventaire, plan appliqué et résultat

| ID | Écart / demande | Mise à jour appliquée | Statut |
|---|---|---|---|
| V01 | Exception de voile CE-UI-10 dans l’architecture | Chapitre 12 : exception de couleur supprimée ; portée du token étendue à tous les voiles ; roulette inline conservée | Traité |
| V02 | Token absent du contrat CE-UI-10 §9 | Chapitre 13 : référence explicite au token ; règle commune §4.6 pour tous les contrats | Traité |
| V03 | Portée trop courte du DSF Cadence et nom d’ombre ambigu | DSF Cadence §2 : voile unique, ombre jamais utilisée comme voile ; suivi A13 clarifié | Traité |
| V04 | POINTS-A-REINTEGRER n°18 à clore | Clôture dans DSF Cadence et index des sources Cadence ; original daté conservé | Clos |
| V05 | D-299 à préciser | Registre : usages, valeurs et distinction explicite de `overlayScrim` | Traité |
| V06 | H-15 (voile) à clore | Clôture du périmètre indiqué dans la demande, après contrôle des 62 voiles et corrections documentaires | Clos, périmètre voile |
| V07 | Ancienne valeur dans DSF Séries variables ; portée commune peu explicite | DSF Séries variables corrigé ; chapitres 06/08 complétés ; avertissement de préséance sur SOURCE-SAISIE historique | Traité |
| V08 | Captures antérieures et traçabilité | 57 écrans réexportés ; 48 PNG changés, 9 identiques ; inventaire courant de 139 références conservé dans le JSON | Traité |

## Contrôles et limites

- Lecture en direct de Prototype MVP `510:101` : **62 voiles sur 57 écrans**, tous visibles, opacité de nœud 1, remplissage #1F2129 à 34 %, lié à `VariableID:3384:4490` (`color/overlay/scrim`). Les 62 nœuds et leurs écrans parents figurent dans les preuves.
- Les deux tokens ont été résolus jusqu’à leurs primitives : voile `color/overlay/scrim-1F2129-34`, ombre `color/overlay/scrim-14171F`. Aucun changement de Figma.
- 57 PNG décodés et vérifiés ; comparaison par SHA Git avec `main`. Contrôle visuel de la feuille Paramètres `6407:9551` et de Zones corporelles `4478:7209`. Les captures sont des exports complets du rendu courant ; leur différence binaire ne prouve pas que chaque pixel changé provient exclusivement du voile.
- **30 contrats × 21 sections renseignées** conservés. Aucune valeur de voile concurrente dans les documents actifs contrôlés. Les valeurs anciennes des originaux archivés et de la source historique explicitement supersédée ne sont pas prescriptives.
- **H-15** est l’identifiant fourni par la demande : aucun registre original H-15 n’a été retrouvé dans les sources du dépôt examinées. Sa clôture signifie ici conformité du voile et de sa documentation, pas qualification globale du DSF. Ne pas le confondre avec A15 de la seconde passe DSF.
- **H-08, H-09, H-10, H-13, H-14 et H-16 restent ouverts selon la demande**, sans nouvel audit dans ce lot. Les thèmes en-tête 92/95 et couleur Séance restent hors périmètre.
- Aucun test applicatif : mission documentaire. L’application, l’accessibilité et les interactions sur appareil ne sont pas qualifiées par cette vérification Figma.

## Captures reprises

Les chemins existants sont conservés : les images du chapitre 06 et les renvois des contrats affichent les nouveaux exports sans doublonner la galerie.

| Écran | Nœud Figma | Capture | Comparaison à main |
|---|---|---|---|
| Modal — Supprimer une planification unique — Calendrier | `1992:5365` | [PNG](Specifications-fonctionnelles/images/modale-4-suppression-planification-unique.png) | Actualisée |
| Calendrier — Jour — Créneau à planifier — MVP | `1992:5794` | [PNG](Specifications-fonctionnelles/images/ecran-7e-calendrier-creneau-a-planifier.png) | Identique, contrôlée |
| Modal — Supprimer des occurrences — Calendrier | `1992:6102` | [PNG](Specifications-fonctionnelles/images/modale-4a-suppression-occurrences.png) | Actualisée |
| Modal — Choisir une séance — Planification — Liste longue | `1992:6249` | [PNG](Specifications-fonctionnelles/images/ecran-7d-calendrier-choisir-seance.png) | Actualisée |
| Planifier une séance — Test picker date ouvert | `1992:6622` | [PNG](Specifications-fonctionnelles/images/ecran-8a-planifier-date-ouverte.png) | Actualisée |
| Planifier une séance — Création | `1992:6838` | [PNG](Specifications-fonctionnelles/images/ecran-8-planifier-seance.png) | Identique, contrôlée |
| Planifier une séance — Test picker rappel personnalisé ouvert | `1992:7187` | [PNG](Specifications-fonctionnelles/images/ecran-8c-planifier-rappel-ouvert.png) | Identique, contrôlée |
| Planifier une séance — Test rappel personnalisé sélectionné | `1992:7369` | [PNG](Specifications-fonctionnelles/images/ecran-8d-planifier-rappel-selectionne.png) | Identique, contrôlée |
| Planifier une séance — Stepper Nombre de semaines | `1992:7537` | [PNG](Specifications-fonctionnelles/images/ecran-8e-planifier-semaines-ouvert.png) | Identique, contrôlée |
| Planifier une séance — Aucune répétition | `1992:7716` | [PNG](Specifications-fonctionnelles/images/ecran-8f-planifier-sans-repetition.png) | Identique, contrôlée |
| Planifier une séance — Chioisir la séance | `1992:7861` | [PNG](Specifications-fonctionnelles/images/ecran-8g-planifier-changer-seance.png) | Identique, contrôlée |
| Modal — Réinitialiser l’activité | `1992:8224` | [PNG](Specifications-fonctionnelles/images/modale-5-reinitialiser-activite.png) | Actualisée |
| Modal — Passer à l’activité suivante | `1992:8326` | [PNG](Specifications-fonctionnelles/images/modale-6-activite-suivante.png) | Actualisée |
| Modal — Séance en pause | `1992:8428` | [PNG](Specifications-fonctionnelles/images/modale-7-seance-en-pause.png) | Actualisée |
| Composition séance — Étiquettes | `2028:11204` | [PNG](Specifications-fonctionnelles/images/figma-2028-11204.png) | Actualisée |
| Composition séance — Abandon | `2028:11298` | [PNG](Specifications-fonctionnelles/images/modale-1-abandon-creation-seance.png) | Actualisée |
| Composition séance — Fin | `2028:11457` | [PNG](Specifications-fonctionnelles/images/ecran-3f-composition-fin-seance-ouverte.png) | Identique, contrôlée |
| Modal — Confirmer la suppression d’une séance archivée | `2234:189` | [PNG](Specifications-fonctionnelles/images/modale-3a-confirmer-suppression-seance-archivee.png) | Actualisée |
| Composition séance — Sélection exercices | `3789:5349` | [PNG](Specifications-fonctionnelles/images/ecran-14-selection-activites-existantes.png) | Identique, contrôlée |
| Catalogue des séances — Filtrer — Panneau ouvert | `4168:11149` | [PNG](Specifications-fonctionnelles/images/figma-4168-11149.png) | Actualisée |
| Catalogue des Exercices — Filtrer — Panneau ouvert | `4168:11262` | [PNG](Specifications-fonctionnelles/images/figma-4168-11262.png) | Actualisée |
| Modal — Confirmer l’archivage d’une séance planifiée | `4593:6285` | [PNG](Specifications-fonctionnelles/images/figma-4593-6285.png) | Actualisée |
| Ajouter un exercice — Catégories | `4332:7095` | [PNG](Specifications-fonctionnelles/images/figma-4332-7095.png) | Actualisée |
| Ajouter un exercice — Nouvelle catégorie | `4474:7157` | [PNG](Specifications-fonctionnelles/images/figma-4474-7157.png) | Actualisée |
| Ajouter un exercice — Zones corporelles | `4478:7209` | [PNG](Specifications-fonctionnelles/images/ecran-4h-creation-activite-zone-corporelle.png) | Actualisée |
| Composition séance — Nouvelle étiquette | `4640:6308` | [PNG](Specifications-fonctionnelles/images/figma-4640-6308.png) | Actualisée |
| Ajouter un exercice — Nouvelle zone corporelle | `4683:6336` | [PNG](Specifications-fonctionnelles/images/figma-4683-6336.png) | Actualisée |
| Modal — Abandonner la création de l’activité | `4714:6241` | [PNG](Specifications-fonctionnelles/images/figma-4714-6241.png) | Actualisée |
| Composition séance — Étiquettes — Appui long — Confirmation suppression | `4861:6145` | [PNG](Specifications-fonctionnelles/images/figma-4861-6145.png) | Actualisée |
| Ajouter un exercice — Catégorie — Appui long — Confirmation suppression | `4861:6259` | [PNG](Specifications-fonctionnelles/images/figma-4861-6259.png) | Actualisée |
| Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression | `4861:6348` | [PNG](Specifications-fonctionnelles/images/figma-4861-6348.png) | Actualisée |
| Modal — Choisir un exercice — Planification — Liste longue | `5451:4272` | [PNG](Specifications-fonctionnelles/images/figma-5451-4272.png) | Actualisée |
| Création activité — Paramètres en modale — 2 Modale ouverte (champs vides) | `6407:9551` | [PNG](Specifications-fonctionnelles/images/figma-6407-9551.png) | Actualisée |
| Création activité — Paramètres en modale — 4 Modale complète — mode activé | `6407:9805` | [PNG](Specifications-fonctionnelles/images/figma-6407-9805.png) | Actualisée |
| Création activité — Paramètres en modale — 5 Modale complète — steppers (séries, pauses) | `6407:9966` | [PNG](Specifications-fonctionnelles/images/figma-6407-9966.png) | Actualisée |
| Création activité — Paramètres en modale — 6 Durée activée (roulette ouverte) | `6407:10127` | [PNG](Specifications-fonctionnelles/images/figma-6407-10127.png) | Actualisée |
| Création activité — Paramètres en modale — 8 Changement de côté activé (contrôle segmenté) | `6407:10481` | [PNG](Specifications-fonctionnelles/images/figma-6407-10481.png) | Actualisée |
| Création activité — Paramètres en modale — 7 Durée totale activée (roulette ouverte) | `6411:9546` | [PNG](Specifications-fonctionnelles/images/figma-6411-9546.png) | Actualisée |
| Création activité — Paramètres en modale — 9 Avec changement de côté (pause au changement de côté) | `6411:9649` | [PNG](Specifications-fonctionnelles/images/figma-6411-9649.png) | Actualisée |
| Création activité — Paramètres en modale — 10 Répétitions (mode activé) | `6419:9847` | [PNG](Specifications-fonctionnelles/images/figma-6419-9847.png) | Actualisée |
| Création activité — Paramètres en modale — 11 À l’échec (mode activé) | `6419:10028` | [PNG](Specifications-fonctionnelles/images/figma-6419-10028.png) | Actualisée |
| Création activité — Paramètres en modale — 12 Modale complète — steppers (séries, pauses) avec message de durée totale ajustée | `6423:9953` | [PNG](Specifications-fonctionnelles/images/figma-6423-9953.png) | Actualisée |
| Séries variables — 2 Durée variable (scénario A) | `6665:24616` | [PNG](Specifications-fonctionnelles/images/figma-6665-24616.png) | Actualisée |
| Séries variables — 3 Répétitions variables (scénario E) | `6665:24844` | [PNG](Specifications-fonctionnelles/images/figma-6665-24844.png) | Actualisée |
| Séries variables — 4 À l’échec variable (scénario F) | `6665:25072` | [PNG](Specifications-fonctionnelles/images/figma-6665-25072.png) | Actualisée |
| Séries variables — 5 Douze séries (défilement — haut) | `6665:25277` | [PNG](Specifications-fonctionnelles/images/figma-6665-25277.png) | Actualisée |
| Ordre des côtés — 7 Sélection : Un côté après l’autre | `6665:26185` | [PNG](Specifications-fonctionnelles/images/figma-6665-26185.png) | Actualisée |
| Séries variables + Les deux côtés à chaque série — 9 (scénario D) | `6665:26575` | [PNG](Specifications-fonctionnelles/images/figma-6665-26575.png) | Actualisée |
| Une seule série — 10 Options sans effet | `6665:26822` | [PNG](Specifications-fonctionnelles/images/figma-6665-26822.png) | Actualisée |
| Changement de mode — 11 Cibles à renseigner | `6665:27008` | [PNG](Specifications-fonctionnelles/images/figma-6665-27008.png) | Actualisée |
| Validation impossible — 12 Série incomplète | `6665:27232` | [PNG](Specifications-fonctionnelles/images/figma-6665-27232.png) | Actualisée |
| Séries variables — 13 Tableau masqué | `6665:27458` | [PNG](Specifications-fonctionnelles/images/figma-6665-27458.png) | Actualisée |
| Séries variables — 14 Déplacement d’une série | `6665:27608` | [PNG](Specifications-fonctionnelles/images/figma-6665-27608.png) | Actualisée |
| Création activité — Paramètres en modale — 13 Répétitions avec cadence | `7059:13302` | [PNG](Specifications-fonctionnelles/images/figma-7059-13302.png) | Actualisée |
| Création activité — Paramètres en modale — 9b Avec changement de côté (copie) | `7069:13464` | [PNG](Specifications-fonctionnelles/images/figma-7069-13464.png) | Actualisée |
| Création activité — Paramètres en modale — 10b Répétitions (copie) | `7069:13573` | [PNG](Specifications-fonctionnelles/images/figma-7069-13573.png) | Actualisée |
| Composition d’une séance — Durée de récupération (modale) | `7173:13521` | [PNG](Specifications-fonctionnelles/images/figma-7173-13521.png) | Actualisée |
