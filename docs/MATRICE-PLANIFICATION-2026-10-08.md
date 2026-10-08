# Traçabilité — interface générale et planification — 08/10/2026

**État : documentation propagée et captures de planification reprises.** Après confirmation du propriétaire, Planifier un parcours et la modale Fréquence ont été relus et recapturés sur les deux pages. Cette matrice ne vaut ni recette de l’application ni validation du prototype interactif.

Sources : [prompt archivé](archives/planification-2026-10-08/demande-source.md), [relevé Figma](archives/planification-2026-10-08/releve-figma.json). Règles : [DSF général](DSF-INTERFACE-GENERALE-2026-10-08.md), [spécification de planification](Specifications-fonctionnelles/SPECIFICATION-PLANIFICATION-2026-10-08.md), contrats CE-UI-04/05/11 du chapitre13.

## Exigences et propagation

| ID | Exigence | Documentation / preuve | État et limite |
|---|---|---|---|
| P01 | Grille 18/20/13/12, exception Profil, bas géométrique du contexte | DSF général §0.1 ; architecture ; règles communes des contrats | Documenté ; comptages du brief non recomptés |
| P02 | CTA x24/y802, 354 × 48, centrage porté par le composant | DSF §0.2/8.2 ; CE-UI-04/05/11 | Documenté ; Safe Areas et responsive conservés |
| P03 | Surfaces blanches ; blocs gris sans trait | DSF §0.3/0.4 ; chapitre06 ; contrats | Documenté ; voile 34 % distinct et conservé |
| P04 | Créneau à liste ordonnée mixte ; parcours seulement libellé | PRODUCT ; glossaire ; chapitres01–05/08–12 | Propagé ; aucun objet Parcours réintroduit |
| P05 | Fréquence x/n ; n pastilles ; remise au gris | Spécification §2 ; données ; API ; CE-UI-11 | Documenté ; interaction x/pastilles encore ouverte |
| P06 | Répétition par interrupteur ; Jour/Semaine/Mois | D-330 ; PRODUCT ; parcours ; modèles ; CE-UI-05 | Propagé ; calcul Jour/Mois incomplet explicitement signalé |
| P07 | Borne jusqu’au/date ou pendant/nombre d’unités | D-331 ; données ; API ; CE-UI-05 | Documenté ; conversion non inventée |
| P08 | Programme facultatif avant Début ; fenêtre bornant les dates | D-332 ; glossaire ; modèle ; spécification §4 | Documenté ; trois écrans manquants et V1.2 non retrouvée |
| P09 | Même sélection à cases et CTA décompté ; titres contextuels | D-222/D-223 révisées ; CE-UI-04 ; chapitres03/06 | Propagé ; validation au toucher retirée pour la planification |
| P10 | Ordre des sections ; liste sans titre ; récapitulatif protégé | Spécification §5/6 ; CE-UI-05 ; chapitre06 | Documenté ; titre retiré des deux pages ; capture corrigée reprise et vérifiée |
| P11 | Rappel par interrupteur ; options égales ; Autre conservé | D-330 ; RM-054a ; conception ; CE-UI-05 ; DSF §8.3 | Propagé ; dette du segmenté manuel conservée |
| P12 | Disclosure 6 variantes ; bouton primaire ; interrupteur 9 variantes | DSF §8 ; architecture ; contrats | Sets inspectés ; cible 48 distincte du cadre 28 ; décalage vertical restant tracé |
| P13 | Dix états ; renommages ; anciennes références remplacées | Chapitre06 ; présente matrice ; notices des anciennes matrices | 10 PNG repris ; Planifier un parcours corrigé et recapturé ; autres captures non réexportées |
| P14 | Retrait du modèle autonome Parcours | Glossaire ; registre ; modèle ; données ; API ; architecture ; roadmap | Propagé ; anciennes décisions marquées supersédées ; Circuit interne conservé |
| P15 | Cinq points ouverts et exclusions | Spécification §10 et limites ; contrats ; rapport | Conservés ; aucune unité Heure ni décision métier implicite |

## Captures effectivement reprises

Les dix PNG proviennent de captures rendues dans Figma le 08/10, à l’échelle 1, sans retouche. Les noms de fichiers reposent sur les identifiants stables. Les pages ne sont pas certifiées identiques : leurs données d’exemple diffèrent notamment dans la sélection à un élément.

| État | Prototype MVP | Communautaire | Capture MVP | Statut |
|---|---|---|---|---|
| Création | `1992:6838` | `7413:26761` | [figma-1992-6838.png](Specifications-fonctionnelles/images/figma-1992-6838.png) | Capture du relevé du 08/10 |
| Sélection à un élément | `7599:14197` | `7599:14753` | [figma-7599-14197.png](Specifications-fonctionnelles/images/figma-7599-14197.png) | Capture du relevé du 08/10 |
| Date ouverte | `1992:6622` | `7413:26600` | [figma-1992-6622.png](Specifications-fonctionnelles/images/figma-1992-6622.png) | Capture du relevé du 08/10 |
| Rappel personnalisé ouvert | `1992:7187` | `7413:26872` | [figma-1992-7187.png](Specifications-fonctionnelles/images/figma-1992-7187.png) | Capture du relevé du 08/10 |
| Stepper du nombre de semaines | `1992:7537` | `7413:27125` | [figma-1992-7537.png](Specifications-fonctionnelles/images/figma-1992-7537.png) | Capture du relevé du 08/10 |
| Rappel personnalisé sélectionné | `1992:7369` | `7413:27014` | [figma-1992-7369.png](Specifications-fonctionnelles/images/figma-1992-7369.png) | Capture du relevé du 08/10 |
| Sans répétition | `1992:7716` | `7413:27242` | [figma-1992-7716.png](Specifications-fonctionnelles/images/figma-1992-7716.png) | Capture du relevé du 08/10 |
| Sélection à plusieurs éléments | `7594:34809` | `7600:14108` | [figma-7594-34809.png](Specifications-fonctionnelles/images/figma-7594-34809.png) | Capture du relevé du 08/10 |
| Planifier un parcours | `7594:34531` | `7443:31021` | [figma-7594-34531.png](Specifications-fonctionnelles/images/figma-7594-34531.png) | Capture reprise après correction de Claude ; blocs et absence de titre vérifiés |
| Fréquence | `7594:34653` | `7567:13761` | [figma-7594-34653.png](Specifications-fonctionnelles/images/figma-7594-34653.png) | Capture du relevé du 08/10 ; arrière-plan revérifié après correction de l’écran parent |

Les anciennes références actives 1992:6249, 1992:7861 et 5451:4272 ne sont plus utilisées dans la galerie de planification du chapitre06. Les inventaires datés précédents sont conservés comme historiques avec renvoi vers cette matrice. Aucun fichier ancien n’est supprimé en masse.

PROG — 2 (`7420:13824`) et PROG — 3 (`7420:13861`) existent sur la page communautaire, en construction. Leur présence ne remplace pas les trois parcours Programme manquants et ne prouve pas une livraison MVP.

## Contrôles et limites

- Les 31 contrats du chapitre13 contiennent chacun les rubriques 1 à 21 ; CE-UI-04/05 sont réécrits et CE-UI-11 est ajouté. Rubrique présente ne signifie pas règle métier résolue : les lacunes restent nommées.
- Les dix PNG ont été ouverts en planche de contrôle ; Création et Fréquence ont également été lus en pleine taille. Après correction, Planifier un parcours et Fréquence ont été relus en pleine taille sur les deux pages : blocs gris sans trait, absence du titre et géométrie du pied vérifiés.
- Le titre « Éléments planifiés » a été retiré sur les deux pages, nœuds 7594:34636 et 7510:33124. Aucune autre correction Figma n’est effectuée pendant le travail de Claude.
- Les nombres 111 écrans, 49 sections, 173 boutons et les nombres d’instances sont rapportés par le brief, pas recomptés exhaustivement. Les captures des autres écrans n’ont pas été actualisées dans cette passe.
- Programme V1.2 n’a pas été retrouvé. La V1.1 disponible n’est pas substituée à cette source ; seules les règles explicitement transmises sont propagées.
- Les cinq points ouverts du brief restent ouverts. Les compléments techniques requis sont tracés : calendrier mensuel, bornes des nouveaux steppers, origine du motif, identité/statut des réalisations multi-contenus, archivage d’une entrée et ordre initial de sélection mixte.

Aucun code applicatif ni workflow modifié ; aucune fusion main ni mise à jour du dev local dans ce lot. La vérification visuelle ciblée est terminée ; les limites de spécification restent explicitement ouvertes.

Preuve de clôture ciblée : [relevé après correction](archives/planification-2026-10-08/verification-apres-correction.json). Les dégradés peuvent masquer le bas du formulaire derrière le pied protégé ; les champs doivent rester atteignables par défilement, selon CE-UI-05.
