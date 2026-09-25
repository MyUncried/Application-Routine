# Matrice de traçabilité — Activité, Récupération et Durée totale

> **Correspondance de roadmap (D-166)** — Le Catalogue des Exercices constitue désormais T03 du MVP. Toute référence au moteur d’Exécution dans ce livrable est portée par T04, anciennement T03. L’ancienne T04 et les tranches suivantes sont décalées à partir de T05.

## Références

- Baseline Git exclusive : `917c53d91c4564d9b5047d6a301a5f4067883806` sur `feat/creation-seance-catalogue`.
- Référence Figma : `G6RY5Ebhgwb4AHIOYDwwvg`, état contrôlé le 8 septembre 2026.
- Périmètre : décisions validées après la mise en pause de T04 et 98 points de contrôle ci-dessous.
- Statut `Corrigé` : une preuve explicite existe dans une section normative et les anciennes formulations contradictoires ont été recherchées transversalement.

## Matrice exhaustive

| ID | Exigence ou contradiction relevée | Décision finale applicable | Documents et section d’origine | Formulation ou règle attendue | Figma / captures | Statut | Preuve finale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CON-01 | Deux types d’Activité imposaient Exercice et Récupération. | Supprimer ce typage. | PRODUCT Activité ; 00 Activité ; 04 Activité ; 09 §09.5 | Aucun type `Exercice`/`Récupération`. | `3542:4656` | Corrigé | 09 §09.5 : « aucun type d’Activité ». |
| CON-02 | Le contrôle de type restait visible. | Le retirer de l’écran. | 06 Écran 4 ; 08 Activité ; 13 CE-T01-13 | Aucun titre ni segmented de type. | `3542:4656` | Corrigé | 13 CE-T01-13 : « ne contient plus… Type d’activité ». |
| CON-03 | Ancienne récupération générique attachée à l’Activité. | Distinguer `sideRecoverySeconds` et `postActivityRecoverySeconds`. | D-208 ; PRODUCT ; 04 ; 09 | Intrinsèque entre côtés vs contextuelle après occurrence. | anciennes frames récupération | **SUPERSÉDÉ D-208** | L’ancien bloc générique n’est plus normatif. |
| CON-04 | Pause et récupération générique étaient distinguées en deux concepts. | Distinguer désormais trois concepts. | D-208 ; 00 ; 04 ; 10 | Pause ; récupération entre côtés ; récupération après activité. | — | **CONFORME D-208** | Trois porteurs/sémantiques distincts. |
| CON-05 | La Pause pouvait être supprimée par erreur. | La conserver. | PRODUCT ; 06 Écran 4 ; 10 §4 | Pause disponible dans les trois modes. | Frames Activité | Corrigé | 06 : première rangée `Séries / cible / Pause`. |
| CON-06 | Ancienne règle conditionnelle `C` ou `C−1` Pauses. | Toujours `C−1` Pauses par côté. | PRODUCT ; 04 ; 07 D-208 ; 09 ; 10 | Aucune Pause après la dernière Série. | — | **SUPERSÉDÉ D-208** | D-156 n’est plus active. |
| CON-07 | Ancienne récupération générique après les Séries. | Distinguer deux occurrences de récupération. | PRODUCT ; 08 ; 10 ; D-208 | `SIDE_RECOVERY` entre côtés si bilatéral ; `POST_ACTIVITY_RECOVERY` après occurrence de Séance/Parcours si valeur positive. | — | **SUPERSÉDÉ D-208** | Aucune récupération générique unique ne subsiste. |
| CON-08 | `0 s` signifiait absence de récupération générique. | `postActivityRecoverySeconds=0` reste une donnée présente/visible ; aucune phase chronométrée positive n’est créée. | D-208 ; 06 ; 09 ; 10 ; 13 | Donnée persistée, rendu `Récupération 0 s`. | — | **SUPERSÉDÉ D-208** | La présence de la donnée et l’existence d’une phase positive sont distinctes. |
| CON-09 | Le nom « Récupération » pouvait déclencher un traitement spécial. | Aucun traitement par le nom. | 09 §09.5 | Une Activité ainsi nommée reste ordinaire. | — | Corrigé | 09 §09.5 : « aucune sémantique technique ». |
| CON-10 | Description et Zones étaient sur un second écran. | Les intégrer à l’écran unique. | 06 Écran 4 ; 08 Activité ; 13 CE-T01-15 | Sections repliables facultatives. | `3553:4704`, `3553:4768` | Corrigé | 13 CE-T01-15. |
| CON-11 | L’écran Informations complémentaires subsistait. | Le supprimer comme étape. | 06 Écran 5 ; 13 CE-T01-13/15 | Enregistrement depuis l’écran unique. | — | Corrigé | 13 CE-T01-13 : « aucun second écran ». |
| CON-12 | L’action finale restait `Valider`. | Utiliser `Terminer`. | 06 Écran 4 ; 08 Activité ; 13 CE-T01-13 | Bouton final fixe `Terminer`. | `3542:4656` | Corrigé | 08 tableau Activité. |
| CON-13 | T04 pouvait commencer sur l’ancien modèle. | Nouvelle structure préalable à T04. | 05 ; 09 DM-001 ; 12 T04 | Prérequis de données avant moteur T04. | — | Corrigé | 09 décisions : version « Prérequis T04 ». |
| CON-14 | T04 pouvait inclure plusieurs Séries. | Toujours refusé dans T04. | 05 ; 10 RM-127 ; 13 CE-T04-01 | Refus explicite avant toute écriture. | — | Corrigé | 13 CE-T04-01. |
| CON-15 | La prise en charge multi-Séries n’avait pas de tranche. | La conserver en T04. | 05 ; 10 RM-127 ; 13 T04 | Exécution complète en T04. | — | Corrigé | INDEX §10. |
| CAL-01 | Ancienne formule intégrant `P(C,R)` et la récupération générique. | Unilatéral : `C×A+(C−1)×B`; bilatéral : `2×[C×A+(C−1)×B]+S`. | D-208 ; PRODUCT ; 04 ; 10 | `S=sideRecoverySeconds`; post-récupération exclue. | — | **SUPERSÉDÉ D-208** | Nouvelle durée intrinsèque. |
| CAL-02 | La durée d’une Série n’était pas identifiée. | `A` = Durée cible d’une Série. | 04 ; 10 | Définition explicite de `A`. | — | Corrigé | 10 RM-129. |
| CAL-03 | La Pause n’était pas identifiée. | `B` = Pause entre Séries. | 04 ; 10 | Définition explicite de `B`. | — | Corrigé | 10 RM-129. |
| CAL-04 | Le nombre de Séries n’était pas identifié. | `C` = entier de 1 à 99. | 04 ; 09 ; 10 | Valeur canonique. | — | Corrigé | 09 attribut Nombre de Séries. |
| CAL-05 | Ancienne récupération générique ajoutée à la Durée totale. | Ajouter seulement la récupération entre côtés en bilatéral ; exclure la récupération post-activité. | D-208 ; PRODUCT ; 04 ; 10 | Séparation stricte activité/séquence. | — | **SUPERSÉDÉ D-208** | — |
| CAL-06 | Durée totale pouvait être persistée comme seconde source. | Ne pas la persister. | 09 DM-015 ; 12 §12.34 | Valeur dérivée. | — | Corrigé | 12 : « Durée totale… non persistée ». |
| CAL-07 | Séries et Durée totale pouvaient piloter ensemble. | Pilote exclusif. | 06 ; 08 ; 10 RM-131 | Un seul pilote à la fois. | `3580:4733`, `3580:4845` | Corrigé | 10 RM-131. |
| CAL-08 | L’état initial devait rester ouvert au choix. | Tous contrôles utilisables. | 06 Dépendance ; 13 CE-T01-13 | Séries pilote implicitement sans contour. | `3542:4656` | Corrigé | 13 CE-T01-13. |
| CAL-09 | Changement de pilote pouvait se produire pendant le défilement. | Seulement après Confirmer. | 06 ; 08 ; 13 CE-T01-14 | Brouillon local jusqu’à confirmation. | Roulettes | Corrigé | 13 CE-T01-14. |
| CAL-10 | Inversion depuis Durée totale non définie. | Calculer `Cth` avec D-208. | 04 ; 06 ; 08 ; 10 | `Cth = ((D−S)/L + B)/(A+B)`, avec `L=1,S=0` en unilatéral et `L=2,S=sideRecoverySeconds` en bilatéral. | `3580:4845` | CONFORME D-208 | Post-récupération exclue. |
| CAL-11 | Arrondi du nombre de Séries non défini. | Plus proche, `.5` vers le haut. | 04 ; 08 ; 10 | Règle déterministe. | — | Corrigé | 08 « Durée totale pilotée ». |
| CAL-12 | Le calcul pouvait produire zéro Série. | Borne minimale `1`. | 04 ; 08 ; 10 | `C = max(1, arrondi(Cth))`. | — | Corrigé | 10 RM-130. |
| CAL-13 | Durée cible impossible pouvait rester affichée. | Réafficher la durée réalisable. | 06 ; 08 ; 10 | Recalcul de `D` après arrondi. | `3580:4957` | Corrigé | 06 : message « Durée ajustée… ». |
| CAL-14 | Le pilote pouvait être persisté. | État UI non persisté. | 09 DM-016 ; 10 RM-131 ; 12 | Séries redevient implicite à la réouverture. | — | Corrigé | 09 DM-016. |
| CAL-15 | Ancienne règle Répétitions. | Afficher une estimation `Durée totale >=` avec 1 s conventionnelle par répétition. | PRODUCT ; 06 ; 07 D-204/D-208 ; 08 ; 10 ; 13 | Unilatéral `C×N+(C−1)×B`; bilatéral `2×[C×N+(C−1)×B]+S`; post-récupération exclue. | `3561:4695` | CONFORME D-208 | D-204 révisée par D-208. |
| CAL-16 | Ancienne règle À l’échec. | Ne pas afficher de Durée totale dans le texte éditable. | 06 ; 08 ; 10 ; 13 | Libellé et valeur absents. | `3561:7802` | Corrigé | D-204 / RM-132. |
| UI-01 | Description devait être optionnelle. | Oui. | 06 ; 08 ; 13 CE-T01-15 | Champ multiligne facultatif. | `3553:4704` | Corrigé | 13 CE-T01-15. |
| UI-02 | Description devait pouvoir se déployer/replier. | Titre ou chevron actionnable. | 06 ; 08 | Valeur conservée au repli. | `3553:4704` | Corrigé | 08 tableau Activité. |
| UI-03 | Zone corporelle devait être optionnelle. | Oui. | 06 ; 08 ; 13 | Multisélection facultative. | `3553:4768` | Corrigé | 13 CE-T01-15. |
| UI-04 | Zone corporelle devait pouvoir se déployer/replier. | Titre ou chevron actionnable. | 06 ; 08 | Valeurs conservées. | `3553:4768` | Corrigé | 08 tableau Activité. |
| UI-05 | Typographie des titres pouvait diverger. | Même style que Mode d’exécution. | 06 ; 13 CE-T01-13 | Style commun. | Frames Activité | Corrigé | 13 CE-T01-13. |
| UI-06 | Mode d’exécution devait être repliable. | Ajouter un chevron. | 06 ; 08 | Section repliable. | `3542:4656` | Corrigé | 08 tableau Activité. |
| UI-07 | Mode devait être fermé initialement. | Non, déployé par défaut. | 06 ; 08 ; 13 | Ouvert à l’arrivée. | `3542:4656` | Corrigé | 13 CE-T01-13. |
| UI-08 | Titre Paramètres de l’activité subsistait. | Le supprimer. | 06 ; 13 | Garder les contrôles sans ce titre. | `3542:4656` | Corrigé | 07 D-137. |
| UI-09 | Ordre naturel des contrôles devait être respecté. | Séries, cible, Pause. | 06 ; 08 ; 13 | Ordre invariant. | Toutes variantes | Corrigé | 13 CE-T01-13. |
| UI-10 | Mode À l’échec laissait un vide ambigu. | Cadre `à l’échec`. | 06 ; 08 ; 13 | Minuscule, bordure, pas de cible. | `3561:7802` | Corrigé | 08 Mode À l’échec. |
| UI-11 | Seconde rangée non définie. | Récupération à gauche. | 06 ; 08 ; 13 | Contrôle durée. | `3542:4656` | Corrigé | 13 CE-T01-13. |
| UI-12 | Durée totale non positionnée. | À droite de Récupération. | 06 ; 08 ; 13 | Second contrôle. | `3542:4656` | Corrigé | 06 Contenu et sections. |
| UI-13 | Masquage pouvait déplacer les autres contrôles. | Conserver les emplacements. | 06 ; 08 ; 13 | Slot droit vide en Rep/Échec. | `3561:4695`, `3561:7802` | Corrigé | 13 CE-T01-13. |
| UI-14 | Synthèse bougeait avec les sections. | La rendre immuable. | 06 ; 08 ; 13 | Fixe hors contenu défilant. | Frames Activité | Corrigé | 08 Synthèse. |
| UI-15 | Espace Média/Synthèse insuffisant. | Utiliser l’espacement standard. | 06 ; 08 | `spacing/16` avant synthèse. | Frames Activité | Corrigé | 06 Écran 4. |
| UI-16 | Section Média ne pouvait se replier. | Chevron dans la cible. | 06 ; 08 ; 13 | Repliable post-T05. | `3382:71` | Corrigé | 08 tableau Activité. |
| UI-17 | Média risquait d’entrer dans le MVP. | Bouton visible désactivé. | PRODUCT ; 06 ; 13 | Pas d’action MVP. | `3382:60` | Corrigé | 13 CE-T01-13. |
| UI-18 | Section Média risquait d’apparaître dans le MVP. | La masquer au runtime MVP. | 06 ; 08 ; 13 | Cible Figma post-T05. | `3382:71` | Corrigé | 06 Écran 4. |
| UI-19 | L’icône Média pouvait être un caractère `+`. | Vecteur DSF. | 06 ; 08 ; 12 ; 13 | `3382:61`, `16×16`. | `3382:61` | Corrigé | 12 tableau DSF. |
| UI-20 | Roulettes Récupération supplémentaires envisagées. | Hériter de Durée. | 06 ; 08 ; 13 CE-T01-14 | Aucun écran supplémentaire. | `3556:7645` | Corrigé | 13 CE-T01-14. |
| UI-21 | Roulette Durée totale supplémentaire envisagée. | Hériter de Durée. | 06 ; 08 ; 13 CE-T01-14 | Aucun écran supplémentaire. | `3556:7645` | Corrigé | 13 CE-T01-14. |
| UI-22 | Pilote calculé non perceptible. | Contour `2 pt` `color/selection`. | 06 ; 07 ; 10 ; 12 | Seulement après confirmation. | `3580:4733`, `3580:4845` | Corrigé | 07 D-141. |
| COM-01 | Récupération devait apparaître en Composition. | Sous-carte attachée. | 06 ; 08 ; 13 CE-T01-09 | `Récupération X min Y s`. | `3572:64` | Corrigé | 13 CE-T01-09. |
| COM-02 | Récupération pouvait être comptée comme Activité. | L’exclure du nombre. | 08 ; 09 ; 10 | Nombre = cartes Activité. | — | Corrigé | 10 RM-074. |
| COM-03 | Sous-carte trop haute. | `24 pt`. | 06 ; 07 D-128 | Bloc total `354×93`. | `3572:64` | Corrigé | 07 D-128. |
| COM-04 | Texte Récupération trop fort. | Taille du nom, graisse normale. | 13 CE-T01-09 | Style distinct non gras. | `3572:64` | Corrigé | 13 CE-T01-09. |
| COM-05 | Déplacement pouvait séparer Récupération. | Déplacer le bloc entier. | 06 ; 10 RM-021 ; 13 CE-T02-02 | Une seule unité gestuelle. | `3518:4576` | Corrigé | 13 CE-T02-02. |
| COM-06 | Duplication pouvait perdre Récupération. | Copier la durée avec l’Activité. | 09 ; 11 ; 13 CE-T02-01 | Aucun objet secondaire. | `2028:11808` | Corrigé | 11 API-ACT-07. |
| COM-07 | Suppression pouvait laisser la Récupération. | Supprimer le bloc. | 06 ; 13 CE-T02-01 | Retrait atomique du brouillon. | `2028:11808` | Corrigé | 13 CE-T02-01. |
| COM-08 | Actions glissées couvraient seulement la carte haute. | Couvrir `93 pt`. | 06 ; 07 ; 13 | Deux actions `72×93`. | `2028:11808` | Corrigé | 07 D-128. |
| COM-09 | Appui long conservait l’ancienne taille. | Bloc soulevé `362×97`. | 06 ; 08 ; 12 ; 13 | Rayon `12`, ombre autour du bloc. | `3518:4576` | Corrigé | 13 CE-T02-02. |
| COM-10 | Fond d’appui long utilisait le mauvais bleu. | Bleu du bandeau supérieur. | 06 ; 13 | Fond interne transparent. | `3518:4576` | Corrigé | 13 CE-T02-02. |
| COM-11 | Durée synthétique omettait Récupération. | L’inclure. | 08 ; 10 RM-101 ; 13 CE-T02-01 | Inclure Pause et Récupération. | Composition/Catalogue | Corrigé | 10 RM-101. |
| COM-12 | Durée synthétique incluait les phases structurelles. | Les exclure. | 08 ; 10 RM-101 | Hors compte à rebours et `SESSION_END`. | Composition/Catalogue | Corrigé | 10 RM-101. |
| EXE-01 | Plan ne distinguait pas les phases. | Types de phase explicites. | 09 §09.8 ; 12 §12.9 | `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY`, `SESSION_END`. | — | CONFORME D-208 | Deux récupérations distinctes. |
| EXE-02 | `RECOVERY` pouvait être un type d’Activité ou une phase générique. | Deux types de phase seulement. | 09 ; 12 | `SIDE_RECOVERY` référence l’Activité ; `POST_ACTIVITY_RECOVERY` référence l’occurrence. | — | CONFORME D-208 | Aucun type d’Activité Récupération. |
| EXE-03 | Récupération après dernière Activité pouvait être sautée. | Exécuter `POST_ACTIVITY_RECOVERY` avant `SESSION_END`. | 10 RM-038 ; 12 ; 13 | Après la dernière occurrence, phase positive puis Fin de séance ; `0 s` reste une donnée visible sans phase positive. | Shell Exécution | CONFORME D-208 | Dernière occurrence incluse. |
| EXE-04 | Transition à zéro non définie. | Automatique et idempotente pour les deux phases. | 10 ; 11 ; 12 ; 13 | `SIDE_RECOVERY` → second côté ; `POST_ACTIVITY_RECOVERY` → étape suivante du Plan. | Shell | CONFORME D-208 | Transition selon type de phase. |
| EXE-05 | Annonce de Récupération non définie. | Dire `Récupération` au démarrage de chaque phase positive. | 05 ; 10 ; 12 ; 13 | Même annonce utilisateur, types de phase distincts en interne. | Shell | CONFORME D-208 | `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY`. |
| EXE-06 | Passage avant zéro pendant une récupération non défini. | Confirmation puis poursuite du Plan. | 10 RM-065a ; 11 API-EXE-05 ; 13 | Enregistrer la durée partielle de la phase courante sans rejouer les Séries acquises. | `1992:8326` | CONFORME D-208 | Phase typée conservée. |
| EXE-07 | Skip de récupération pouvait altérer le statut de l’Activité. | Conserver les résultats déjà acquis ; la phase seule est partielle. | 10 ; 11 ; 13 | `SIDE_RECOVERY` ne termine pas le second côté ; `POST_ACTIVITY_RECOVERY` intervient après une occurrence déjà réalisée. | — | CONFORME D-208 | Pas de confusion phase/résultat. |
| EXE-08 | Reset Récupération pouvait rejouer l’Activité. | Réinitialiser uniquement la phase courante. | 10 RM-062 ; 11 API-EXE-04 | Fonctionne pour `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY`. | `1992:8224` | CONFORME D-208 | Séries acquises inchangées. |
| EXE-09 | Arrêt en récupération non défini. | Statut `Interrompue`. | 10 RM-065a ; 13 | Résultats acquis conservés, quel que soit le type de récupération. | `1992:8428` | CONFORME D-208 | Deux phases couvertes. |
| EXE-10 | Temps réel pouvait omettre les récupérations. | Inclure les phases réellement exécutées. | 08 ; 10 RM-073 ; 11 API-EXE-08 | Inclut `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY`; seules les Pauses manuelles sont exclues. | Exécution | CONFORME D-208 | Deux phases couvertes. |
| EXE-11 | Pause manuelle pouvait être confondue avec Pause entre Séries. | Seule Pause manuelle est exclue. | 10 RM-073 ; 13 CE-T04-08 | Pause planifiée incluse. | — | Corrigé | 10 RM-073. |
| EXE-12 | Progression pouvait omettre les récupérations. | Pondérer la durée planifiée des phases positives. | 08 ; 12 ; 13 | `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY` participent au Plan complet. | Shell | CONFORME D-208 | Distinguer les deux phases. |
| EXE-13 | Modes Répétitions/Échec pouvaient devenir automatiques. | Fin manuelle par `Suivant`. | 10 RM-059 ; 13 CE-T04-05 | Mécanisme inchangé. | Shell | Corrigé | 13 CE-T04-05. |
| EXE-14 | Durée minimale non définie hors mode Durée. | Estimation intrinsèque selon D-208. | PRODUCT ; 06 ; 08 ; 10 RM-132 | 1 s/répétition + `C−1` Pauses + `sideRecoverySeconds` éventuel ; post-récupération exclue. | Frames Rep/Échec | CONFORME D-208 | Préfixe `>=`. |
| EXE-15 | Sons/annonces T04 pouvaient dépendre du Profil. | Actifs par défaut, pas de préférence. | 10 RM-128 ; 13 CE-T04-02 | Règle T04 inchangée. | Exécution | Corrigé | 13 CE-T04-02. |
| DAT-01 | Le modèle conservait `activityType`. | Le retirer du modèle cible. | 09 §09.5 ; 12 §12.34 | Mode seulement. | — | Corrigé | 12 §12.34. |
| DAT-02 | Pause était une relation vers une Activité. | Stocker une durée. | 09 §09.5 | Valeur canonique ≥0. | — | Corrigé | 09 attribut Pause. |
| DAT-03 | Récupération générique stockée sur l’Activité. | Séparer les données. | 09 ; 12 | `sideRecoverySeconds` sur ActivityDefinition/activité ; `postActivityRecoverySeconds` sur occurrence de Séance/Parcours. | — | CONFORME D-208 | Porteurs distincts. |
| DAT-04 | Série pouvait être une entité. | Non, entier canonique. | 09 DM-013 | 1 à 99. | — | Corrigé | 09 DM-013. |
| DAT-05 | Durée totale pouvait devenir canonique. | Valeur dérivée. | 09 DM-015 | Non persistée. | — | Corrigé | 09 DM-015. |
| DAT-06 | Pilote pouvait être stocké. | Ne pas persister. | 09 DM-016 | État UI. | — | Corrigé | 09 DM-016. |
| DAT-07 | Résultat ne distinguait pas les récupérations prévues. | Ajouter des métriques distinctes par phase. | 09 §09.7.1 ; 12 | Résultat/état d’Exécution distingue `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY`. | — | CONFORME D-208 | D-140 révisée. |
| DAT-08 | Résultat ne distinguait pas les récupérations écoulées. | Conserver les durées écoulées par phase. | 09 §09.7.1 ; 12 | Aucune métrique générique ambiguë `recoveryElapsedSeconds`. | — | CONFORME D-208 | D-140 révisée. |
| DAT-09 | Skip Récupération pouvait exiger un nouvel enum. | Aucun nouvel enum. | 10 ; 11 ; 13 | Durées suffisent. | — | Corrigé | 13 CE-T04-07. |
| DAT-10 | Données de récupération créées en développement pouvaient imposer une migration. | Aucun traitement spécifique. | 07 D-135 ; 12 T04 | Changement nul pour ces données non pertinentes. | — | Corrigé | 12 contraintes T04. |
| TEC-01 | API créait une Récupération autonome/générique. | Séparer les paramètres intrinsèques et contextuels. | 11 | `API-ACT-*` gère `sideRecoverySeconds`; `API-COM-REC-*` gère `postActivityRecoverySeconds`. | — | CONFORME D-208 | Deux responsabilités. |
| TEC-02 | API ne calculait pas Durée totale/Séries. | Ajouter calcul fonctionnel. | 11 §11.4 | API-ACT-02 et formules. | — | Corrigé | 11 API-ACT-02. |
| TEC-03 | Duplication API copiait une récupération générique. | Copier selon le porteur. | 11 | Duplication ActivityDefinition copie `sideRecoverySeconds`; duplication d’occurrence copie `postActivityRecoverySeconds`. | — | CONFORME D-208 | Aucun mélange des deux valeurs. |
| TEC-04 | Ancien schéma persistait `activities.recovery_seconds`. | Appliquer directement le schéma cible D-208. | 09 ; 12 | Base réinitialisable : `side_recovery_seconds` sur activité et `post_activity_recovery_seconds` sur occurrence ; aucune migration utilisateur de l’ancien modèle. | — | CONFORME D-208 | Ancienne migration 004 historique. |
| TEC-05 | DSF documentait une sous-carte Récupération conditionnelle. | Rendre la ligne post-récupération systématique dans la Composition. | 06 ; 12 ; 13 | `Récupération {durée}` visible même à `0 s`, attachée à l’occurrence. | Figma à réaligner | PARTIELLEMENT CONFORME | Documentation cible alignée ; preuve Figma à mettre à jour. |
| TEC-06 | États de calcul Figma non documentés. | Référencer les trois frames. | 06 ; 12 ; 13 | Série pilote, Durée pilote, ajustement. | `3580:4733`, `3580:4845`, `3580:4957` | Corrigé | 12 tableau DSF. |
| TEC-07 | Alias du contour pilote imprécis. | Documenter l’alias exact. | 12 Couleurs/§12.34 | `color/selection` → `color/blue/selection-5F60EE`. | Variables `2290:52` → `2290:3` | Corrigé | 12 table d’alias. |
| TEC-08 | Captures pouvaient rester sur les anciens écrans. | Réexporter 15 captures et supprimer 3 obsolètes. | 06 ; 13 ; images | PNG `402×874`, références actuelles. | 15 nodes contrôlés | Corrigé | 06 États Figma + dossier images. |

## Résultat

- Total : **98 points**.
- Corrigés : **98**.
- Non applicables : **0**.
- À clarifier : **0**.
- Couverture partielle : **0**.

## Mise à jour D-208 — 25/09/2026

Cette matrice est réinterprétée selon D-208. Toute ligne historique qui suppose une récupération générique `recoverySeconds`, une formule `P(C,R)` ou une carte conditionnelle absente à `0 s` est supersédée. Les axes actifs sont : `sideRecoverySeconds` sur l’Activité bilatérale, `postActivityRecoverySeconds` sur l’occurrence, `C−1` Pauses, Exécution directe sans post-récupération, et durée intrinsèque excluant la post-récupération.
