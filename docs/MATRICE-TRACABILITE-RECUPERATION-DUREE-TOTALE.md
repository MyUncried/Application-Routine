# Matrice de traçabilité — Activité, Récupération et Durée totale

## Références

- Baseline Git exclusive : `917c53d91c4564d9b5047d6a301a5f4067883806` sur `feat/creation-seance-catalogue`.
- Référence Figma : `G6RY5Ebhgwb4AHIOYDwwvg`, état contrôlé le 8 septembre 2026.
- Périmètre : décisions validées après la mise en pause de T03 et 98 points de contrôle ci-dessous.
- Statut `Corrigé` : une preuve explicite existe dans une section normative et les anciennes formulations contradictoires ont été recherchées transversalement.

## Matrice exhaustive

| ID | Exigence ou contradiction relevée | Décision finale applicable | Documents et section d’origine | Formulation ou règle attendue | Figma / captures | Statut | Preuve finale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CON-01 | Deux types d’Activité imposaient Exercice et Récupération. | Supprimer ce typage. | PRODUCT Activité ; 00 Activité ; 04 Activité ; 09 §09.5 | Aucun type `Exercice`/`Récupération`. | `3542:4656` | Corrigé | 09 §09.5 : « aucun type d’Activité ». |
| CON-02 | Le contrôle de type restait visible. | Le retirer de l’écran. | 06 Écran 4 ; 08 Activité ; 13 CE-T01-13 | Aucun titre ni segmented de type. | `3542:4656` | Corrigé | 13 CE-T01-13 : « ne contient plus… Type d’activité ». |
| CON-03 | La Récupération était une carte autonome. | La rattacher à l’Activité. | PRODUCT ; 04 ; 09 §09.5 | Durée facultative de l’Activité. | `3572:64` | Corrigé | 04 : Récupération attachée après toutes les Séries. |
| CON-04 | La Récupération pouvait être confondue avec la Pause. | Conserver deux paramètres distincts. | 00 ; 04 ; 10 §4 | Pause entre Séries ; Récupération après toutes les Séries. | `3542:4656` | Corrigé | 10 RM-034 à RM-038. |
| CON-05 | La Pause pouvait être supprimée par erreur. | La conserver. | PRODUCT ; 06 Écran 4 ; 10 §4 | Pause disponible dans les trois modes. | Frames Activité | Corrigé | 06 : première rangée `Séries / cible / Pause`. |
| CON-06 | La règle de Pause après la dernière Série était contradictoire. | Conserver la recette validée : `C` Pauses si `R = 0`, sinon `C − 1`, la Récupération remplaçant la dernière Pause. | PRODUCT ; 04 ; 07 D-156 ; 09 ; 10 | Fonction `P(C,R)` conditionnelle. | — | Corrigé | 09 DM-014 ; décision produit issue #52. |
| CON-07 | La Récupération pouvait être répétée après chaque Série. | Une seule occurrence. | PRODUCT ; 08 ; 10 | Une phase après la dernière Série. | — | Corrigé | 10 RM-037. |
| CON-08 | Une Récupération nulle pouvait créer une phase. | Valeur canonique `0 s`, aucune phase. | 09 §09.5 ; 10 RM-034 | Insérer `RECOVERY` seulement si `R > 0`. | — | Corrigé | 09 : « valeur > 0 ». |
| CON-09 | Le nom « Récupération » pouvait déclencher un traitement spécial. | Aucun traitement par le nom. | 09 §09.5 | Une Activité ainsi nommée reste ordinaire. | — | Corrigé | 09 §09.5 : « aucune sémantique technique ». |
| CON-10 | Description et Zones étaient sur un second écran. | Les intégrer à l’écran unique. | 06 Écran 4 ; 08 Activité ; 13 CE-T01-15 | Sections repliables facultatives. | `3553:4704`, `3553:4768` | Corrigé | 13 CE-T01-15. |
| CON-11 | L’écran Informations complémentaires subsistait. | Le supprimer comme étape. | 06 Écran 5 ; 13 CE-T01-13/15 | Enregistrement depuis l’écran unique. | — | Corrigé | 13 CE-T01-13 : « aucun second écran ». |
| CON-12 | L’action finale restait `Valider`. | Utiliser `Terminer`. | 06 Écran 4 ; 08 Activité ; 13 CE-T01-13 | Bouton final fixe `Terminer`. | `3542:4656` | Corrigé | 08 tableau Activité. |
| CON-13 | T03 pouvait commencer sur l’ancien modèle. | Nouvelle structure préalable à T03. | 05 ; 09 DM-001 ; 12 T03 | Prérequis de données avant moteur T03. | — | Corrigé | 09 décisions : version « Prérequis T03 ». |
| CON-14 | T03 pouvait inclure plusieurs Séries. | Toujours refusé dans T03. | 05 ; 10 RM-127 ; 13 CE-T03-01 | Refus explicite avant toute écriture. | — | Corrigé | 13 CE-T03-01. |
| CON-15 | La prise en charge multi-Séries n’avait pas de tranche. | La conserver en T04. | 05 ; 10 RM-127 ; 13 T03 | Exécution complète en T04. | — | Corrigé | INDEX §10. |
| CAL-01 | Durée totale non définie. | La définir en mode Durée. | PRODUCT ; 00 ; 04 ; 10 | `D = C×A + P(C,R)×B + R`, avec `P=C` si `R=0`, sinon `C−1`. | `3580:4733` | Corrigé | 10 RM-129. |
| CAL-02 | La durée d’une Série n’était pas identifiée. | `A` = Durée cible d’une Série. | 04 ; 10 | Définition explicite de `A`. | — | Corrigé | 10 RM-129. |
| CAL-03 | La Pause n’était pas identifiée. | `B` = Pause entre Séries. | 04 ; 10 | Définition explicite de `B`. | — | Corrigé | 10 RM-129. |
| CAL-04 | Le nombre de Séries n’était pas identifié. | `C` = entier de 1 à 99. | 04 ; 09 ; 10 | Valeur canonique. | — | Corrigé | 09 attribut Nombre de Séries. |
| CAL-05 | La Récupération n’était pas incluse au calcul. | `R` ajouté une fois. | PRODUCT ; 04 ; 10 | Ajouter `R`, jamais `C×R`. | — | Corrigé | 10 RM-129. |
| CAL-06 | Durée totale pouvait être persistée comme seconde source. | Ne pas la persister. | 09 DM-015 ; 12 §12.34 | Valeur dérivée. | — | Corrigé | 12 : « Durée totale… non persistée ». |
| CAL-07 | Séries et Durée totale pouvaient piloter ensemble. | Pilote exclusif. | 06 ; 08 ; 10 RM-131 | Un seul pilote à la fois. | `3580:4733`, `3580:4845` | Corrigé | 10 RM-131. |
| CAL-08 | L’état initial devait rester ouvert au choix. | Tous contrôles utilisables. | 06 Dépendance ; 13 CE-T01-13 | Séries pilote implicitement sans contour. | `3542:4656` | Corrigé | 13 CE-T01-13. |
| CAL-09 | Changement de pilote pouvait se produire pendant le défilement. | Seulement après Confirmer. | 06 ; 08 ; 13 CE-T01-14 | Brouillon local jusqu’à confirmation. | Roulettes | Corrigé | 13 CE-T01-14. |
| CAL-10 | Inversion depuis Durée totale non définie. | Calculer `Cth`. | 04 ; 08 ; 10 | Si `R=0` : `D/(A+B)` ; si `R>0` : `(D−R+B)/(A+B)` ; division supplémentaire par `L` selon la formule bilatérale. | `3580:4845` | Corrigé | 10 RM-130. |
| CAL-11 | Arrondi du nombre de Séries non défini. | Plus proche, `.5` vers le haut. | 04 ; 08 ; 10 | Règle déterministe. | — | Corrigé | 08 « Durée totale pilotée ». |
| CAL-12 | Le calcul pouvait produire zéro Série. | Borne minimale `1`. | 04 ; 08 ; 10 | `C = max(1, arrondi(Cth))`. | — | Corrigé | 10 RM-130. |
| CAL-13 | Durée cible impossible pouvait rester affichée. | Réafficher la durée réalisable. | 06 ; 08 ; 10 | Recalcul de `D` après arrondi. | `3580:4957` | Corrigé | 06 : message « Durée ajustée… ». |
| CAL-14 | Le pilote pouvait être persisté. | État UI non persisté. | 09 DM-016 ; 10 RM-131 ; 12 | Séries redevient implicite à la réouverture. | — | Corrigé | 09 DM-016. |
| CAL-15 | Durée totale pouvait apparaître en Répétitions. | La masquer. | 06 ; 08 ; 10 | Masquée, emplacement vide. | `3561:4695` | Corrigé | 10 RM-132. |
| CAL-16 | Durée totale pouvait apparaître À l’échec. | La masquer. | 06 ; 08 ; 10 | Masquée, emplacement vide. | `3561:7802` | Corrigé | 10 RM-132. |
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
| UI-16 | Section Média ne pouvait se replier. | Chevron dans la cible. | 06 ; 08 ; 13 | Repliable post-T04. | `3382:71` | Corrigé | 08 tableau Activité. |
| UI-17 | Média risquait d’entrer dans le MVP. | Bouton visible désactivé. | PRODUCT ; 06 ; 13 | Pas d’action MVP. | `3382:60` | Corrigé | 13 CE-T01-13. |
| UI-18 | Section Média risquait d’apparaître dans le MVP. | La masquer au runtime MVP. | 06 ; 08 ; 13 | Cible Figma post-T04. | `3382:71` | Corrigé | 06 Écran 4. |
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
| EXE-01 | Plan ne distinguait pas les phases. | Types de phase explicites. | 09 §09.8 ; 12 §12.9 | `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `RECOVERY`, `SESSION_END`. | — | Corrigé | 12 §12.9. |
| EXE-02 | `RECOVERY` pouvait être un type d’Activité. | Type de phase seulement. | 09 ; 12 | Référence à l’Activité parente. | — | Corrigé | 09 tableau Activité d’exécution. |
| EXE-03 | Récupération après dernière Activité pouvait être sautée. | L’exécuter avant `SESSION_END`. | 10 RM-038 ; 13 CE-T03-10 | Toujours si `R>0`. | Shell Exécution | Corrigé | 13 CE-T03-10. |
| EXE-04 | Transition à zéro non définie. | Automatique et idempotente. | 10 RM-038 ; 13 CE-T03-04 | Sons standards puis étape suivante. | Shell | Corrigé | 13 CE-T03-04. |
| EXE-05 | Annonce de Récupération non définie. | Dire « Récupération ». | 10 RM-038 ; 13 CE-T03-04 | Annonce par défaut T03. | Shell | Corrigé | 13 CE-T03-04. |
| EXE-06 | Passage avant zéro pendant Récupération non défini. | Confirmation `Activité suivante`. | 10 RM-065a ; 11 API-EXE-05 | Même dialogue. | `1992:8326` | Corrigé | 13 CE-T03-07. |
| EXE-07 | Skip Récupération pouvait rendre l’Activité partielle. | Activité reste terminée. | 10 ; 11 ; 13 | Seule durée de Récupération est partielle. | — | Corrigé | 13 CE-T03-07. |
| EXE-08 | Reset Récupération pouvait rejouer l’Activité. | Réinitialiser la phase seulement. | 10 RM-062 ; 11 API-EXE-04 | Libellé spécifique. | `1992:8224` | Corrigé | 13 CE-T03-06. |
| EXE-09 | Arrêt en Récupération non défini. | Statut `Interrompue`. | 10 RM-065a ; 13 CE-T03-08 | Résultats acquis conservés. | `1992:8428` | Corrigé | 10 RM-065a. |
| EXE-10 | Temps réel pouvait omettre Récupération. | L’inclure. | 08 ; 10 RM-073 ; 11 API-EXE-08 | Toutes phases exécutées. | Exécution | Corrigé | 10 RM-073. |
| EXE-11 | Pause manuelle pouvait être confondue avec Pause entre Séries. | Seule Pause manuelle est exclue. | 10 RM-073 ; 13 CE-T03-08 | Pause planifiée incluse. | — | Corrigé | 10 RM-073. |
| EXE-12 | Progression pouvait omettre Récupération. | Pondérer sa durée planifiée. | 08 ; 13 CE-T03-04 | Barre du Plan complet. | Shell | Corrigé | 13 CE-T03-04. |
| EXE-13 | Modes Répétitions/Échec pouvaient devenir automatiques. | Fin manuelle par `Suivant`. | 10 RM-059 ; 13 CE-T03-05 | Mécanisme inchangé. | Shell | Corrigé | 13 CE-T03-05. |
| EXE-14 | Durée minimale non définie hors mode Durée. | Pauses + Récupération connues. | 06 ; 08 ; 10 RM-132 | Préfixe `≥`. | Frames Rep/Échec | Corrigé | 08 Modes non chronométrés. |
| EXE-15 | Sons/annonces T03 pouvaient dépendre du Profil. | Actifs par défaut, pas de préférence. | 10 RM-128 ; 13 CE-T03-02 | Règle T03 inchangée. | Exécution | Corrigé | 13 CE-T03-02. |
| DAT-01 | Le modèle conservait `activityType`. | Le retirer du modèle cible. | 09 §09.5 ; 12 §12.34 | Mode seulement. | — | Corrigé | 12 §12.34. |
| DAT-02 | Pause était une relation vers une Activité. | Stocker une durée. | 09 §09.5 | Valeur canonique ≥0. | — | Corrigé | 09 attribut Pause. |
| DAT-03 | Récupération était une relation vers une Activité. | Stocker une durée. | 09 §09.5 | Valeur canonique ≥0. | — | Corrigé | 09 attribut Récupération. |
| DAT-04 | Série pouvait être une entité. | Non, entier canonique. | 09 DM-013 | 1 à 99. | — | Corrigé | 09 DM-013. |
| DAT-05 | Durée totale pouvait devenir canonique. | Valeur dérivée. | 09 DM-015 | Non persistée. | — | Corrigé | 09 DM-015. |
| DAT-06 | Pilote pouvait être stocké. | Ne pas persister. | 09 DM-016 | État UI. | — | Corrigé | 09 DM-016. |
| DAT-07 | Résultat ne conservait pas la Récupération prévue. | Ajouter attribut fonctionnel. | 09 §09.7.1 ; 12 | `recoveryPlannedSeconds`. | — | Corrigé | 09 tableau Résultat. |
| DAT-08 | Résultat ne conservait pas la Récupération écoulée. | Ajouter attribut fonctionnel. | 09 §09.7.1 ; 12 | `recoveryElapsedSeconds`. | — | Corrigé | 09 tableau Résultat. |
| DAT-09 | Skip Récupération pouvait exiger un nouvel enum. | Aucun nouvel enum. | 10 ; 11 ; 13 | Durées suffisent. | — | Corrigé | 13 CE-T03-07. |
| DAT-10 | Données de récupération créées en développement pouvaient imposer une migration. | Aucun traitement spécifique. | 07 D-135 ; 12 T03 | Changement nul pour ces données non pertinentes. | — | Corrigé | 12 contraintes T03. |
| TEC-01 | API créait une Récupération autonome. | Remplacer par paramètres Pause/Récupération. | 11 §11.4 | API-ACT-03 sur l’Activité. | — | Corrigé | 11 API-ACT-03. |
| TEC-02 | API ne calculait pas Durée totale/Séries. | Ajouter calcul fonctionnel. | 11 §11.4 | API-ACT-02 et formules. | — | Corrigé | 11 API-ACT-02. |
| TEC-03 | Duplication API copiait un type. | Copier Description, Pause, Récupération. | 11 API-ACT-07 | Aucun type ni entité secondaire. | — | Corrigé | 11 API-ACT-07. |
| TEC-04 | Migration T03 ne couvrait pas les nouvelles valeurs. | Étendre la migration additive `004`. | 12 Contraintes T03 | `DATABASE_VERSION=4`, sans Durée totale/pilote. | — | Corrigé | 12 contraintes T03. |
| TEC-05 | DSF manquait le bloc Composition avec Récupération. | Référencer le composant créé. | 12 composants | `Composition / Activity Row with Recovery`. | `3572:64` | Corrigé | 12 tableau DSF. |
| TEC-06 | États de calcul Figma non documentés. | Référencer les trois frames. | 06 ; 12 ; 13 | Série pilote, Durée pilote, ajustement. | `3580:4733`, `3580:4845`, `3580:4957` | Corrigé | 12 tableau DSF. |
| TEC-07 | Alias du contour pilote imprécis. | Documenter l’alias exact. | 12 Couleurs/§12.34 | `color/selection` → `color/blue/selection-5F60EE`. | Variables `2290:52` → `2290:3` | Corrigé | 12 table d’alias. |
| TEC-08 | Captures pouvaient rester sur les anciens écrans. | Réexporter 15 captures et supprimer 3 obsolètes. | 06 ; 13 ; images | PNG `402×874`, références actuelles. | 15 nodes contrôlés | Corrigé | 06 États Figma + dossier images. |

## Résultat

- Total : **98 points**.
- Corrigés : **98**.
- Non applicables : **0**.
- À clarifier : **0**.
- Couverture partielle : **0**.

