# Navigation — cinq destinations — référence contrôlée le 27 octobre 2026

> Actualisation du 28/10 : les deux captures du geste de famille sont remplacées par les exports courants ; l’écran Création d’une famille est référencé dans [CE-MVT-03 et sa spécification](DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md). Les inventaires et décomptes du 27/10 restent datés.

> Actualisation ultérieure du 27/10 : les douze écrans du Catalogue des séances ont été modifiés et réexportés dans le [relevé Catalogue des séances](DSF-CATALOGUE-SEANCES-2026-10-27.md). Les captures ci-dessous de ces écrans sont des preuves antérieures ; les cinq destinations et leurs assets restent applicables.

## Périmètre et résultat

Source : fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`. Recensement des 62 écrans contenant une navigation, y compris les barres derrière un overlay ou une feuille. Chaque écran a été réexporté ; les zones de navigation ont été comparées visuellement. Le contrôle structurel final confirme **62 instances, toutes à cinq emplacements**.

Une anomalie Figma a été corrigée : `1992:375`, Profil — Vibration désactivée, contenait une barre détachée à quatre destinations. Elle est remplacée par l’instance `10601:46200`, variante Profil `6513:20200`. Les 61 autres instances utilisaient déjà la bonne famille.

L’inventaire des autres pages est conservé dans `figma-navigation-2026-10-27/inventaire-pages.json` comme état de découverte avant correction. Les pages Archives, Conception — Hors MVP et les jeux responsive ne deviennent pas des écrans MVP par cette mise à jour. Leurs preuves historiques ne sont pas réécrites. Le composant courant est exceptionnellement rangé sur Conception — Hors MVP (`6464:10219`) ; son emploi réel dans Prototype MVP, vérifié ici, fait référence. L’ancien set `6298:12462` ne doit plus servir à construire la navigation.

## Contrat commun CE-UI-05

Ce contrat s’applique à chacun des écrans du tableau ci-dessous, en complément de son contrat métier :

- Ordre invariant : **Catalogues, Calendrier, Suivi, Communauté, Profil**. Aucun emplacement Recherche.
- Composant : `Navigation / Bottom — 5 onglets`, set `6513:20151`. Une seule destination active, déterminée par la route. Libellé visuel sous l’icône active ; libellé accessible pour les cinq destinations, rôle tab et état selected.
- Au gabarit 402 pt : composant 402 × 77 ; pilule 354 × 62, x=24, y=8. Boîtes optiques 32 × 32 ; nœuds vectoriels 24 × 24 centrés (export Communauté 26 × 26 incluant le débordement du trait). Cibles tactiles au moins 48 × 48. Répartition responsive, sans reprendre des coordonnées absolues pour les autres largeurs ; Safe Area native.
- Actif : `#0508E5` ; inactif : `#595E66`. Utiliser les exports exacts, sans substituer une icône système. La personne seule représente Profil ; le groupe représente Communauté. Le master de ce dernier garde le nom historique `icon/profil` : son ID et son usage font foi.
- Le composant possède cinq états actifs et quatre états de badge (`Aucune`, `1-9`, `10-99`, `99+`), soit vingt variantes. L’existence graphique du badge ne définit pas sa source métier.
- Une feuille ou un dialogue peut masquer la barre ou la laisser visible derrière son overlay ; aucune navigation au travers du dialogue. La capture de chaque état fait foi pour sa visibilité. L’exécution conserve son propre shell.
- Une destination indisponible est explicitement désactivée. Cette mise à jour ne crée pas les fonctionnalités de Communauté et ne déclare pas la navigation applicative déjà implémentée à cinq routes.
- Vérifier ordre, état actif, icônes, labels accessibles, absence de chevauchement, Safe Areas, passage entre destinations disponibles et conservation d’état selon le contrat métier.

## Variantes et copies de référence

| Destination active | Variante Figma | Capture |
|---|---|---|
| Catalogues | `6513:20152` | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/6513-20152.png) |
| Calendrier | `6513:20168` | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/6513-20168.png) |
| Suivi | `6513:20184` | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/6513-20184.png) |
| Communauté | `6514:20240` | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/6514-20240.png) |
| Profil | `6513:20200` | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/6513-20200.png) |

## Assets livrés et disponibles au code

Les dix SVG sont exportés directement de Figma (`SVG_STRING`), avec leurs états de couleur. Le manifeste `assets/icons/manifest.json` trace le nœud exporté, le composant maître, les dimensions et le SHA-256. `src/shared/ui/KodjoIcon.tsx` expose les dix clés, en 24 × 24, sauf Communauté en 26 × 26 pour préserver le débordement du trait dans le viewport exporté ; les clés historiques `sessions` et `history` restent compatibles avec leurs consommateurs. La boîte 32 × 32 et la cible tactile appartiennent au composant de navigation, pas au SVG.

| Asset | Instance exportée | Composant maître |
|---|---|---|
| [navigation-sessions.svg](../assets/icons/navigation-sessions.svg) | `6513:20161` | `6296:10468` |
| [navigation-sessions-inactive.svg](../assets/icons/navigation-sessions-inactive.svg) | `6513:20177` | `6296:10468` |
| [navigation-calendar-active.svg](../assets/icons/navigation-calendar-active.svg) | `6513:20179` | `6296:10484` |
| [navigation-calendar.svg](../assets/icons/navigation-calendar.svg) | `6513:20163` | `6296:10484` |
| [navigation-history-active.svg](../assets/icons/navigation-history-active.svg) | `6513:20197` | `6296:10498` |
| [navigation-history.svg](../assets/icons/navigation-history.svg) | `6513:20165` | `6296:10498` |
| [navigation-community-active.svg](../assets/icons/navigation-community-active.svg) | `6514:23002` | `6296:10514` |
| [navigation-community.svg](../assets/icons/navigation-community.svg) | `6514:20257` | `6296:10514` |
| [navigation-profile-active.svg](../assets/icons/navigation-profile-active.svg) | `6514:20297` | `6513:20232` |
| [navigation-profile.svg](../assets/icons/navigation-profile.svg) | `6514:20264` | `6513:20232` |

## Contrôle écran par écran

Chaque lien PNG ci-dessous est une nouvelle copie complète de l’écran courant. La colonne « actif » identifie la variante sous-jacente, même lorsqu’un overlay la masque. Toutes les lignes relèvent de **CE-UI-05** ; cette liste complète les contrats de catalogue, calendrier, suivi et profil sans changer leurs comportements métier.

| Écran | Nœud Figma | Actif | Copie courante | Contrat navigation |
|---|---|---|---|---|
| P-Profil — Vue d'ensemble - Vibration désactivée | [1992:375](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-375) | Profil | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-375.png) | CE-UI-05 — 5 emplacements vérifiés |
| Profil — Stepper Pause changement de côté | [1992:474](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-474) | Profil | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-474.png) | CE-UI-05 — 5 emplacements vérifiés |
| Profil — Stepper Récupération après activité | [1992:579](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-579) | Profil | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-579.png) | CE-UI-05 — 5 emplacements vérifiés |
| Profil — Vue d'ensemble - Vibration activée | [1992:684](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-684) | Profil | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-684.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Calendrier — Semaine | [1992:5101](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5101) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-5101.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Calendrier — Mois | [1992:5237](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5237) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-5237.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Modal — Supprimer une planification unique — Calendrier | [1992:5365](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5365) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-5365.png) | CE-UI-05 — 5 emplacements vérifiés |
| Calendrier — Jour — MVP | [1992:5510](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5510) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-5510.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Calendrier — Jour — Appui long — MVP | [1992:5602](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5602) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-5602.png) | CE-UI-05 — 5 emplacements vérifiés |
| Calendrier — Jour — MAJ — MVP | [1992:5697](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5697) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-5697.png) | CE-UI-05 — 5 emplacements vérifiés |
| Calendrier — Jour — Créneau à planifier — MVP | [1992:5794](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5794) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-5794.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Calendrier — Semaine — Actions glissées | [1992:5962](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5962) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-5962.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Modal — Supprimer des occurrences — Calendrier | [1992:6102](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6102) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-6102.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Modal — Choisir une séance — Planification — Liste longue | [1992:6249](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6249) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-6249.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Calendrier — Semaine — Séance déployée | [1992:6389](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6389) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-6389.png) | CE-UI-05 — 5 emplacements vérifiés |
| Modal — Planifier une séance — Sélectionner une séance | [7599:14197](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=7599-14197) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/7599-14197.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Suivi — Séances — Liste condensée | [1992:8843](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8843) | Suivi | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-8843.png) | CE-UI-05 — 5 emplacements vérifiés |
| Suivi — Séances — Vue déployée | [1992:8996](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8996) | Suivi | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-8996.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Catalogue des séances — Liste par défaut | [1992:9910](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-9910) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-9910.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Catalogue des séances — Séance déployée | [1992:10014](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10014) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-10014.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — Liste condensée — actions glissées | [1992:10518](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10518) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-10518.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — Séance déployée — actions glissées | [1992:10628](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10628) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-10628.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — Archivées — Séance restaurée | [1992:10848](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10848) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-10848.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — Liste sans Renforcement du genou | [1992:10937](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10937) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/1992-10937.png) | CE-UI-05 — 5 emplacements vérifiés |
| Calendrier — Jour suivant — Glissement gauche — MVP | [2059:267](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2059-267) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2059-267.png) | CE-UI-05 — 5 emplacements vérifiés |
| Calendrier — Semaine — Après suppression d’une planification | [2074:86](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2074-86) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2074-86.png) | CE-UI-05 — 5 emplacements vérifiés |
| Calendrier — Semaine — Étirements — Actions glissées | [2094:86](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2094-86) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2094-86.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — État vide | [2117:86](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2117-86) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2117-86.png) | CE-UI-05 — 5 emplacements vérifiés |
| Suivi — Séances — État vide | [2117:190](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2117-190) | Suivi | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2117-190.png) | CE-UI-05 — 5 emplacements vérifiés |
| Calendrier — Jour — État vide | [2128:86](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2128-86) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2128-86.png) | CE-UI-05 — 5 emplacements vérifiés |
| Profil — Vue d'ensemble — Parcours vide | [2139:86](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2139-86) | Profil | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2139-86.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — Archivées — actions glissées | [2234:88](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-88) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2234-88.png) | CE-UI-05 — 5 emplacements vérifiés |
| Modal — Confirmer la suppression d’une séance archivée | [2234:189](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-189) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2234-189.png) | CE-UI-05 — 5 emplacements vérifiés |
| Calendrier — Semaine — Mardi sélectionné | [2252:86](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2252-86) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/2252-86.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Catalogue des Exercices — Liste | [3786:5093](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3786-5093) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/3786-5093.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Catalogue des séances — Filtrer — Panneau ouvert | [4168:11149](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11149) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4168-11149.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Catalogue des Exercices — Filtrer — Panneau ouvert | [4168:11262](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11262) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4168-11262.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Modal — Confirmer l’archivage d’une séance planifiée | [4593:6285](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4593-6285) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4593-6285.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des exercices — État vide | [4521:6220](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4521-6220) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4521-6220.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des Exercices — Liste — Filtre inactif étendu | [4544:6344](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4544-6344) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4544-6344.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des Exercices — Liste — Filtre actif étendu | [4544:6651](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4544-6651) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4544-6651.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — Liste — Filtre inactif étendu | [4549:6382](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6382) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4549-6382.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — Filtre actif Archivé | [4549:6742](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6742) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4549-6742.png) | CE-UI-05 — 5 emplacements vérifiés |
| Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité | [4592:6217](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4592-6217) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4592-6217.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Catalogue des Exercices — Liste — actions glissées | [4738:6209](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6209) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4738-6209.png) | CE-UI-05 — 5 emplacements vérifiés |
| S-Catalogue des Exercices — Liste — Première carte déployée — Média | [4738:6355](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6355) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/4738-6355.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Modal — Choisir un exercice — Planification — Liste longue | [5451:4272](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5451-4272) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/5451-4272.png) | CE-UI-05 — 5 emplacements vérifiés |
| Modal — Planifier un parcours — Sélectionner plusieurs séances | [7594:34809](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=7594-34809) | Calendrier | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/7594-34809.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Composition séance — Modèles | [8598:29271](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-29271) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/8598-29271.png) | CE-UI-05 — 5 emplacements vérifiés |
| P-Composition séance — Modèles — Deux colonnes | [9977:19613](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9977-19613) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/9977-19613.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Piles | [10266:20575](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10266-20575) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10266-20575.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Filtres | [10462:23370](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10462-23370) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10462-23370.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Filtre actif | [10465:23141](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10465-23141) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10465-23141.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Pile déployée | [10471:23291](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10471-23291) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10471-23291.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Actions glissées | [10475:47634](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10475-47634) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10475-47634.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Pile — Déplacement | [10480:23374](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10480-23374) | Catalogues | [PNG](Specifications-fonctionnelles/images/familles-2026-10-28/10480-23374.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Pile — Message de confirmation | [10484:23428](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10484-23428) | Catalogues | [PNG](Specifications-fonctionnelles/images/familles-2026-10-28/10484-23428.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Archivage refusé | [10495:24054](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10495-24054) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10495-24054.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Archivés | [10495:24099](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10495-24099) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10495-24099.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Archivés — Actions glissées | [10496:23705](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10496-23705) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10496-23705.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Archivés — Confirmer la suppression | [10500:23772](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10500-23772) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10500-23772.png) | CE-UI-05 — 5 emplacements vérifiés |
| Mouvement — Catalogue — Ajouter un niveau | [10579:21580](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10579-21580) | Catalogues | [PNG](Specifications-fonctionnelles/images/navigation-2026-10-27/10579-21580.png) | CE-UI-05 — 5 emplacements vérifiés |

## Preuves et contrôle reproductible

- `figma-navigation-2026-10-27/inventaire-ecrans.json` : correspondance des 62 écrans et instances après correction.
- `verification-finale.json` : lecture finale des composants et comptage des cinq icônes sur chacune des 62 instances.
- `composants.json` : inventaire du set et de ses vingt variantes.
- `exports-icones.json` : exports SVG originaux permettant la comparaison octet pour octet.
- `references-captures-mises-a-jour.json` : anciennes références de captures remplacées dans les documents courants.
- `captures.json` : empreintes des 67 PNG (62 écrans et cinq variantes).

À chaque changement Figma : recenser les instances du composant partagé sur la page cible, comparer les nœuds et états aux contrats, réexporter les écrans concernés, vérifier visuellement les captures, puis vérifier assets et liens. Une image existante ou un lien valide ne prouve pas son actualité. Une limitation d’accès doit rester signalée comme non vérifiée, jamais comme mise à jour complète.

Contrôles locaux : `python scripts/check_navigation_assets.py`. Ce contrôle vérifie la complétude des 62 correspondances, les empreintes des captures, les dix SVG exacts et leur disponibilité dans le registre de code. Il ne remplace ni une nouvelle lecture Figma après changement ni la recette sur appareil.
