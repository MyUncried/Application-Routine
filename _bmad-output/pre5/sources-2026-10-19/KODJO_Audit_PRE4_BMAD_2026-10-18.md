# Audit PRE-4 BMAD — périmètre, réutilisation et reprises

Date : 18 octobre 2026. Audit indépendant de la livraison PR #372. Aucun fichier du dépôt modifié, aucun commit ni push, aucun déploiement.

## Verdict

**La livraison ne correspond pas à une reconstruction générale de ce qui existait. Le socle PRE-3 a réellement été réutilisé. En revanche, le travail a été alourdi par un découpage centré sur la couverture complète des exigences, par des reprises techniques et ergonomiques, et par au moins une modification fonctionnelle injustifiée à son introduction.**

Le périmètre initial était borné à l’éditeur, mais techniquement plus important qu’une simple finition : passer d’un Mode « À l’échec » à une Cible « À l’échec » pour chaque Série impose de modifier les types, la persistance, les copies, les validations, les calculs et les consommateurs. En parallèle, l’interface devait changer de mécanismes de sélection. Ces deux changements justifient un vrai développement.

L’affirmation « 80 % étaient déjà développés » est plausible pour les fonctions visibles, mais aucun pourcentage vérifiable ne peut être établi avec les éléments disponibles. Le nombre de stories, le nombre de lignes et le nombre de tests ne mesurent pas directement ce pourcentage.

Le défaut de méthode principal est **l’insuffisante traduction de l’existant en travail restant**. L’inventaire initial connaissait les quatre parcours, les feuilles, les référentiels et les médias déjà présents. Pourtant, ils ont été redécrits, revus et retestés à une échelle proche de fonctions nouvelles. Le bilan différentiel a été établi à la demande de Hermann seulement après l’Epic 1.

## Références et méthode

- Livraison : [PR #372](https://github.com/MyUncried/Application-Routine/pull/372).
- Main immédiatement avant livraison : `6656fefc58330955f5ad74d513ce616ea51809b0`.
- Commit de livraison : `16f5f839cf3b8c62c0b9da3e98d68f3bead56d09`.
- Fusion : `1116586b35e4767c0c6ecedb0564680f17a7cd70`.
- Base de travail BMAD : `c32e360d891614f2b08a1d8f7f3f631eef0b57ea`.

Le graphe Git confirme les deux parents de la fusion. La comparaison de `src/` et `app/` entre `c32e360d` et `6656fefc` est vide : le parent de main fournit donc une référence applicative valable pour isoler PRE-4. La comparaison de toute la base BMAD avec main aurait aussi inclus des changements documentaires et VNext indépendants ; elle n’a pas été utilisée pour attribuer le volume de livraison à BMAD.

Travail réalisé : inventaire des 305 fichiers de la PR ; métriques corrigées des seules différences de fin de ligne ; comparaison du code des principaux changements (modèle, validation, migration, calculs, phrases, copies, feuille, roulettes, référentiels, parcours et Composition) ; rapprochement des 22 stories avec le périmètre ED et les décisions ; lecture des bilans, notes de réalisation et journaux de revue. L’annexe recense les 66 fichiers applicatifs changés.

Il s’agit d’un audit de justification et de réutilisation, pas d’une certification exhaustive de chaque ligne ni d’un nouvel audit général des bugs. Les tests n’ont pas été relancés : 113 suites et 2 864 tests verts sont le résultat rapporté par Claude lors de la livraison, non un résultat reproduit ici. La validation fonctionnelle sur appareil a été donnée par Hermann.

**Limite historique importante :** la branche `bmad/pre4-comparaison` n’apparaît pas dans les références distantes récupérées ; seul `pre4-bmad/livraison-main` est publié. Le commit local `4e2b2fbd` cité dans le compte rendu n’est pas résolu par GitHub. L’histoire publiée de la livraison contient un unique commit de réalisation. Les reprises sont donc établies par les documents versionnés et les échanges pour les cas cités, mais leur diff intermédiaire et leur durée exacte ne sont pas tous récupérables. L’annonce précédente selon laquelle toute l’histoire serait disponible après fusion doit être corrigée sur ce point.

## 1. Ce que mesure réellement la taille de la livraison

Commandes de référence : `git diff --ignore-space-at-eol --numstat 6656fefc 1116586b` et inventaire des fichiers de la PR.

| Catégorie | Fichiers | Lignes ajoutées | Lignes retirées |
|---|---:|---:|---:|
| Code applicatif dans src/ et app/, hors tests et Markdown | 66 | 8 520 | 2 608 |
| Tests, fixtures et outillage de tests | 71 | 23 851 | 2 386 |
| Documentation et artefacts textuels de préparation | 82 | 56 409 | 3 |
| Configuration, actifs textuels et outils annexes | 19 | 16 771 | 6 |
| Images et archives binaires | 67 | — | — |
| **Total** | **305** | | |

Les lignes comprennent commentaires, données de fixtures et fichiers générés. Les actifs textuels incluent notamment les SVG : ils ne doivent pas être interprétés comme autant de code métier. La documentation comprend des copies de sources et des documents historiques : 56 409 lignes ajoutées ne signifient pas 56 409 lignes nouvellement rédigées pour le produit.

Les tests représentent environ 2,8 fois les ajouts applicatifs. C’est un indice de l’importance de la vérification dans le chantier, pas une preuve que chaque test est inutile. Les tests de migration sur SQLite réelle, de rollback et de copies ont une utilité directe.

| Module | Avant | Après | Lecture |
|---|---:|---:|---|
| ExecutionParametersSheet.tsx | 1 312 lignes | 2 641 lignes | Principal foyer de croissance : surfaces, roues, animations, accessibilité et interactions du tableau |
| ActivityEditorForm.tsx | 838 | 959 | Adaptation de l’éditeur, pas remplacement intégral |
| ExecutionParameters.ts | 527 | 948 | Cibles typées, lecture/validation v2 et préservation des anciennes valeurs |
| executionCalculations.ts | 270 | 363 | Extension du moteur existant |
| executionPhrase.ts | 201 | 256 | Extension du générateur existant |

Le PRD livré compte 2 944 lignes (356 362 octets) ; `epics.md`, 2 789 lignes (365 768 octets), avec en plus les parties par Epic. Les 22 stories ont chacune une spécification et une trace de revue mentionnant `blind-hunter`, `edge-case-hunter` et `verification-gap`. Cela atteste du dispositif employé, sans fournir le temps ni le coût de chaque intervention.

## 2. Constats principaux

### A1 — L’existant était connu, mais le plan n’était pas suffisamment construit à partir des seuls écarts

**Établi, priorité forte pour la méthode.** `extracts/code-depart.md`, daté du 16 octobre, décrit déjà l’éditeur unique, ses quatre parcours, la feuille de 1 312 lignes, les contrôles existants et la persistance. Il est donc incorrect de dire que BMAD aurait commencé sans lire le code.

Le bilan du 17 octobre décrit ensuite 2.4 comme « surtout conforme », 3.2 comme « surtout vérification », 4.1 comme « surtout vérification », 4.3 comme « surtout conforme » et 4.6 comme « vérification et documentation ». Malgré ce recalage, la règle conserve tous les critères, tests et revues prévus. Le travail différentiel était explicité, mais la charge de couverture restait largement celle du plan complet.

**Conséquence :** 22 stories ne signifient pas 22 capacités à construire. Le découpage pouvait être conservé comme matrice de couverture, sans soumettre chaque groupe déjà conforme à une nouvelle réalisation complète et à une revue d’ampleur identique.

### A2 — Changement injustifié des Zones lors de la story 4.3

**Établi, écart de périmètre au moment de sa réalisation.** La spec 4.3 reconnaît que E-F7 et E-F8 avaient été livrés dans `3dd1060f` uniquement pour se conformer à FR-20-04 et FR-20-09 du PRD généré. Ils proposaient une Zone retirée encore affectée et conservaient dans la sélection une Zone supprimée depuis la feuille. Or le bilan approuvé demandait les libellés, les icônes et deux messages distincts, en conservant les feuilles et règles PRE-3.

Les changements ont été retirés à la demande de Hermann. Il s’agit bien d’une reprise évitable : une exigence dérivée dans un document généré a été traitée comme une autorisation de modifier un comportement validé.

**Ne pas confondre avec la livraison finale :** Q53 a ensuite explicitement autorisé un nouveau comportement après découverte du blocage de sauvegarde, puis l’a précisé : disparition dans l’objet depuis lequel on supprime, conservation sur fond rouge ailleurs. Le code final des feuilles et des repositories correspond à cette nouvelle direction. Les extensions aux Catégories et Étiquettes sont consignées comme décisions de Hermann en Q53 (8), puis le retrait des avis en Q53 (9). Ce dernier état ne doit pas être annulé au motif que l’initiative initiale était injustifiée.

### A3 — Cellule active et pied commun : développement commencé puis abandonné

**Établi par le journal de réalisation.** La spec 3.6 indique : « Le premier état du développement (Cellule active, Pied commun, cellules sans ±) a été retiré à la main, sans commande Git. »

Le pied commun était explicitement demandé dans ED-10 et dans le plan approuvé. Son développement initial n’est donc pas une invention de BMAD. Q44 a modifié le besoin en cours de réalisation et conservé les ± permanents. La reprise est réelle ; elle relève ici d’un changement de décision. Une validation plus précoce de cette interaction aurait évité ce travail. Son volume exact ne peut pas être reconstitué depuis le commit livré.

La story 3.6 reste justifiée après réduction : ouverture d’une roue par cellule, cible Échec par Série, retrait/Annuler et correction du comportement des pas aux bornes.

### A4 — La faisabilité native et l’ergonomie ont demandé plusieurs reprises

**Établi.** La story 3.1 consigne les problèmes tactiles et d’alignement du montage React Native/SwiftUI, puis leur correction. La roue a ensuite changé de présentation : Q37, puis Q41 (panneaux sans flèche). Les choix de mouvement et de sélection ont évolué à travers Q39–Q42. Le module `SheetMotion.tsx` et le conteneur `AnchoredPanel.tsx` portent ce travail supplémentaire.

Il faut distinguer : défaut d’intégration initial à corriger ; choix ergonomique modifié par Hermann ; travail fonctionnel requis. Une suite Jest verte ne valide pas le toucher, les dimensions d’un hôte SwiftUI ni la fluidité sur iPhone. La story de faisabilité avait une raison d’être ; le gain aurait été de stabiliser ce montage et sa présentation avant de le multiplier.

### A5 — Réutilisation réelle des calculs, phrases, roues et parcours

**Établi sur les diffs.** Le registre de calcul `buildExecutionLedger`, la substitution de récupération et l’essentiel de l’inversion sont conservés. Les modifications portent sur l’extraction de la valeur typée, la qualification `lowerBound`/`incomplete` et leurs consommateurs. `SegmentBuilder` et les branches historiques du générateur de phrases restent en place ; une branche pour les mélanges est ajoutée.

Les roues natives sont étendues par des props de bornes et d’échec, pas remplacées par un autre mécanisme. `FixedHeader` reçoit des props optionnelles. La logique des quatre parcours reste dans `ExerciseScreen`. Les changements de copie portent notamment sur le clonage, les types et la détection d’une occurrence supprimée entre ouverture et enregistrement.

**Conclusion :** l’impression « il redéveloppe tout » n’est pas confirmée par le code final. L’impression « il passe beaucoup de temps à revérifier ce qui était déjà fait » est, elle, étayée par les artefacts et les tests.

### A6 — Deux extensions de fin de recette sont explicitement autorisées

**Établi dans les décisions livrées.** Q53 explique les changements supplémentaires de référentiels et de sauvegarde. Q54 autorise la suppression de l’écran vestige « Catégories de la séance » et le déplacement de l’enregistrement dans Composition. Le diff de `CompositionScreen.tsx` est concentré sur cette sauvegarde et sur le retrait d’Étiquette ; il n’implémente pas la refonte générale de Composition initialement exclue.

Le volume final n’est donc pas exactement celui du périmètre initial : il comprend ces corrections/extensions décidées pendant la recette. Les comparer à VNext comme si les deux livraisons avaient des exigences et décisions identiques serait trompeur.

### A7 — Documentation livrée encore partiellement contradictoire

**Établi, priorité moyenne.** Le document `evolutions-PRE3-a-PRE4.md` finit par « Points en attente d’arbitrage : Q44 à Q52 », alors que ses propres lignes les présentent comme décisions et que `questions-ouvertes.md` les traite. Des passages de specs conservent des instructions anciennes sous une annotation prioritaire : la 3.6 garde ainsi des contraintes sur le pied et la cellule active après Q44. C’est traçable, mais coûteux à interpréter.

Les fichiers normatifs de premier niveau `docs/Specifications-fonctionnelles/` ne sont pas modifiés par la PR #372. Les décisions nouvelles résident principalement dans les artefacts BMAD et `docs/preparation/PRE-4/bmad/`. Cela ne prouve pas que les chapitres sont tous faux ; cela montre que cette livraison ne les a pas consolidés avec les décisions finales.

La description numérotée reste expressément exclue du PRD (FR-02-07/P18). Le registre de conception fourni par Hermann la documente pourtant. C’est un défaut de transmission des sources, distinct d’un défaut de programmation de PRE-4. Cette vérification ne réintègre pas cette fonction dans la tranche validée.

### A8 — Un petit ajout sans consommateur actuel

**Établi, importance faible.** La story 2.2 ajoute `computeSessionExecutionDuration` et `toSessionExecutionDurationResult` pour compter les phases initiale/finale de Séance. La recherche dans `src/` et `app/` ne trouve que leur définition, leur appel mutuel et les tests ; aucune interface ne les utilise. Le travail est rattaché à P31, donc documenté, mais son utilité immédiate pour finaliser l’éditeur n’est pas démontrée. C’est un exemple limité de préparation future, pas l’explication principale des heures passées.

### A9 — Garde de copie des Zones : compromis local à connaître

**Établi dans le code, pas de régression utilisateur démontrée.** Pour une nouvelle occurrence, `getInheritableBodyZoneIds` accepte les Zones retirées affectées quelque part dans le Catalogue ou une Séance, pas uniquement à une source explicitement identifiée. La restriction à l’Exercice concerné est assurée par le sélecteur ; le commentaire explique l’absence de lien persistant vers la source. Même logique globale pour les Catégories.

Cela résout le blocage Q53, mais la couche de persistance seule ne prouve pas la provenance d’une affectation héritée. Aucun durcissement ni refonte n’est demandé ici : c’est une limite à garder en tête si un import ou un autre chemin d’écriture est ajouté ultérieurement.

## 3. Lecture des 22 stories

« Justifié » signifie rattachable au périmètre ou à une décision, pas optimal en coût ni exempt de défaut.

| Story | Travail réellement nécessaire / constat | Verdict de périmètre et de proportion |
|---|---|---|
| 1.1 | Types de Cible, format v2, migration 010, lecteurs et adaptation des consommateurs | Nécessaire et transversal ; plus qu’une finition UI. La migration de 825 lignes inclut conversion, rejets autorisés, reconstruction, liens et contrôles. |
| 1.2 | Avis des données écartées et restitution des Séances vides | Justifié par les décisions de migration Q19/Q32 ; petit ajout visible, persistance et tests associés. |
| 1.3 | Copies existantes adaptées, indépendance des objets, compatibilité d’Instantanés | Réutilisation avec corrections ciblées ; les nombreux tests ne sont pas de nouveaux parcours. |
| 1.4 | Preuve de migration sur SQLite v9 fichier et correction des contrôles de clés étrangères | Vérification de risque réel ; ne pas compter comme nouvelle fonction produit. |
| 2.1 | Natures partielle/incomplète et adaptations du calcul | Extension justifiée, moteur largement conservé. |
| 2.2 | Formateur commun, préfixes, calcul de plan de Séance sans consommateur | Principalement consolidation/vérification ; ajout futur limité signalé A8. |
| 2.3 | Phrases de cibles mixtes et extension du corpus | Nouveau besoin réel ; générateur existant conservé. |
| 2.4 | Total partiel non arrondi et résumés | Petite adaptation ; les notes indiquent une seule fonction de production changée au stade de cette story. |
| 3.1 | Essai de popover natif sur iPhone | Justifié ; a révélé des défauts d’intégration. Coût de reprise à séparer des choix ergonomiques ultérieurs. |
| 3.2 | Retrait/Annuler, identité de ligne et conservation des anciennes valeurs | Extension du brouillon déjà présent ; forte couverture de fonctions existantes. |
| 3.3 | Surfaces de choix, Régime, ± à l’appui, panneaux et animations | Changement d’interaction substantiel demandé ; plusieurs reprises de recette. |
| 3.4 | Extension de la roue Durée avec Échec et bornes | Justifiée ; abandon du pas de 5 par Q36, pas une invention initiale puisque ED-09 le prescrivait. |
| 3.5 | Roue Répétitions avec Échec et borne 100 | Extension justifiée de la roue existante. |
| 3.6 | Roue par cellule, retrait/Annuler, pas et bornes ; pied/activeCell abandonnés | Besoin final borné ; reprise documentée après Q44, pas reconstruction justifiée de tout le tableau. |
| 3.7 | Total partiel/lecture seule, présentation de l’inversion | Adaptation de l’inversion existante, pas nouveau calcul complet. |
| 3.8 | Accessibilité des contrôles modifiés et recette | Nécessaire sur le delta ; recouvre des vérifications déjà réparties dans les stories précédentes. |
| 4.1 | Accès direct Créer, retour/défilement, contrôle d’occurrence disparue, quatre parcours testés | Parcours déjà construits ; petites corrections et tests d’intégration importants. |
| 4.2 | Ordre des blocs, fermeture, marges et abandon | Adaptation ciblée ; invite H22 ajoutée puis retirée par Q55. |
| 4.3 | Libellés/icônes/messages ; dérive E-F7/E-F8 ; Q53 ensuite | Dérive initiale démontrée, retirée ; comportement final de recette explicitement autorisé. |
| 4.4 | Vignette du premier Média et vérification de l’import/ordre/copies | Import déjà existant, réutilisé ; vignette réellement ajoutée. |
| 4.5 | Consultation vidéo/photo et passage du menu à l’appui long | Fonction nouvelle autorisée Q27/Q31 ; les Médias n’étaient pas entièrement nouveaux, leur consultation l’était. |
| 4.6 | Accessibilité, focus, cibles tactiles, conformité et recette consolidée | Corrections ciblées justifiées ; charge de revue et de consolidation importante pour une story de clôture. |

Q53 et Q54 sont des décisions de recette transverses en plus du découpage initial. La variante Routine BMAD et les outils de tunnel servent à l’expérimentation demandée ; ils ne doivent pas être comptés comme fonctionnalités de l’éditeur.

## 4. Pourquoi ce chantier a pu être long

| Facteur | Niveau de preuve | Attribution |
|---|---|---|
| Changement du modèle de Cible, avec migration et consommateurs | Code et sources | Travail nécessaire, même si l’écran était déjà avancé |
| Inventaire complet décliné en 22 specs et revues à trois regards | Artefacts versionnés | Charge de méthode démontrée ; durée non quantifiable |
| Tests des parcours déjà présents et nouvelles preuves de non-régression | Diffs et notes | Charge réelle ; utilité variable, ne pas tous supprimer |
| Zones modifiées sur la seule autorité du PRD généré puis rétablies | Spec 4.3 et échanges | Reprise évitable par contrôle de portée |
| Pied commun développé puis retiré | Spec 3.6 | Changement de décision ; travail perdu démontré, volume inconnu |
| Popovers, ancrage, animation, présentation | Specs 3.1/3.3 et décisions | Défauts techniques et changements ergonomiques à distinguer |
| Corrections de fin de recette Q53/Q54 et variante de build | Code et décisions | Extension autorisée de la livraison |
| BMAD intrinsèquement plus lent que VNext | Non démontré | Pas de journaux comparables de durée/coût sur même périmètre |

Les éléments disponibles expliquent les catégories de travail, pas leur répartition horaire. Aucun chiffre de temps économisable, de tokens consommés ou de productivité comparative n’est inventé.

## 5. Actions raisonnables pour la prochaine tranche

1. **Partir du delta avant de créer les stories.** Pour chaque exigence : existant conforme, adaptation, nouveau, ou simple vérification ; fichier actuel et changement attendu. Utiliser l’inventaire déjà réalisé, pas un nouvel audit général.
2. **Une divergence avec un document généré ne suffit pas à changer l’existant validé.** Relier le changement à une exigence source ou une décision de Hermann ; sinon conserver le comportement et signaler l’écart.
3. **Adapter la revue au risque.** Revue approfondie pour migration/persistance et nouveaux mécanismes ; réutiliser les preuves PRE-3 pour l’inchangé, compléter seulement ce que le delta affecte. Garder les tests utiles sans exiger un nouveau dispositif complet pour chaque story surtout conforme.
4. **Essayer tôt une interaction native représentative.** Stabiliser le toucher, l’ancrage et la présentation sur iPhone avant généralisation aux autres champs.
5. **Consolider les décisions finales une fois, dans les documents courants.** Conserver l’histoire dans un journal ; éviter qu’un agent doive arbitrer entre paragraphes anciens et annotations prioritaires. Ne pas rouvrir la recette déjà validée.
6. **Publier l’historique de travail lors de la livraison suivante**, en plus du commit nettoyé destiné à main, pour distinguer développement et reprises. C’est une amélioration de traçabilité, pas un nouveau blocage de livraison.

Aucun retour arrière global ni refactorisation immédiate n’est recommandé. Les changements validés en recette restent la référence. L’audit met en évidence un problème de cadrage différentiel et de gestion des sources, pas une raison de jeter PRE-4.

## 6. Vérifications techniques effectuées

- Les parents de la fusion et le commit de livraison sont vérifiés par Git.
- Identité du code applicatif entre la base BMAD et le main avant livraison : vérifiée.
- Diff de livraison vide sur `.github/`, `scripts/kodjo/`, `package.json`, `package-lock.json`, `src/shared/ui/tokens.ts` et les migrations historiques 001–009 : vérifié.
- `app.config.js` conserve sa branche de configuration habituelle et ajoute une branche BMAD ; `eas.json` ajoute `development-bmad` sans modifier les profils précédents : vérifié par lecture du diff, sans relancer EAS.
- La livraison n’inclut pas les instructions CLAUDE/AGENTS du clone BMAD ni l’installation `_bmad/` : vérifié par inventaire de la PR.
- La suite complète, le typecheck et le lint n’ont pas été relancés dans cet audit en lecture seule. Aucun résultat de test nouveau n’est revendiqué.
- Le fonctionnement visuel/tactile et les workflows GitHub ne sont pas recertifiés par cet audit de portée.

## Sources principales

Les liens ci-dessous sont figés sur le commit livré.

- [Périmètre ED-01 à ED-22](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/docs/preparation/PRE-4/perimetre-et-couverture.md)
- [Inventaire initial du code](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/extracts/code-depart.md)
- [Bilan différentiel du 17 octobre](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/_bmad-output/implementation-artifacts/bilan-ecarts-2026-10-17.md)
- [Décisions Q et règles P](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/docs/preparation/PRE-4/bmad/questions-ouvertes.md)
- [Évolutions livrées](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/docs/preparation/PRE-4/bmad/evolutions-PRE3-a-PRE4.md)
- [PRD](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md)
- [Story 3.1, essai natif](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/_bmad-output/implementation-artifacts/spec-3-1-faisabilite-sur-iphone-du-popover-natif-dans-la-feuille-s0.md)
- [Story 3.6, travail retiré](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/_bmad-output/implementation-artifacts/spec-3-6-tableau-des-series-variables-cellule-active-pied-commun-retrait-glisser.md)
- [Story 4.3, Zones et reprises](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/_bmad-output/implementation-artifacts/spec-4-3-categorie-et-zones-corporelles-depuis-l-editeur.md)
- [Story 4.6, revue finale](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/_bmad-output/implementation-artifacts/spec-4-6-fidelite-accessibilite-et-recette-finale-de-l-editeur.md)
- [Migration 010](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/src/infrastructure/database/migrations/migration010.ts)
- [Calculs existants adaptés](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/src/domain/activities/executionCalculations.ts)
- [Générateur de phrases](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/src/domain/activities/executionPhrase.ts)
- [Feuille des paramètres](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/src/features/activities/ExecutionParametersSheet.tsx)
- [Copie et affectations retirées](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/src/infrastructure/database/repositories/SqliteSessionRepository.ts)
- [Sauvegarde Composition Q54](https://github.com/MyUncried/Application-Routine/blob/1116586b35e4767c0c6ecedb0564680f17a7cd70/src/features/sessions/CompositionScreen.tsx)

## Annexe — inventaire exhaustif des fichiers applicatifs changés

Ce tableau est un inventaire, pas une déclaration de revue exhaustive de chaque ligne. Les valeurs ignorent les changements de fin de ligne seuls ; les commentaires comptent comme des lignes. Les tests et documents sont comptés séparément plus haut.

| Fichier | Ajouts | Retraits |
|---|---:|---:|
| `app/(creation)/_layout.tsx` | 8 | 21 |
| `app/(creation)/categories.tsx` | 0 | 6 |
| `app/_layout.tsx` | 9 | 0 |
| `src/domain/activities/ActivityDefinition.ts` | 75 | 256 |
| `src/domain/activities/ExecutionParameters.ts` | 613 | 192 |
| `src/domain/activities/ExecutionParametersDraft.ts` | 255 | 45 |
| `src/domain/activities/durationFormat.ts` | 21 | 0 |
| `src/domain/activities/executionCalculations.ts` | 113 | 20 |
| `src/domain/activities/executionPhrase.ts` | 77 | 22 |
| `src/domain/activities/exerciseSnapshot.ts` | 39 | 10 |
| `src/domain/activities/readV1.ts` | 253 | 0 |
| `src/domain/migration/MigrationNotice.ts` | 32 | 0 |
| `src/domain/sessions/Session.ts` | 46 | 60 |
| `src/domain/sessions/SessionDraft.ts` | 71 | 67 |
| `src/domain/sessions/SessionRepository.ts` | 7 | 1 |
| `src/domain/sessions/calculations.ts` | 55 | 31 |
| `src/domain/sessions/composition.ts` | 1 | 3 |
| `src/domain/sessions/errors.ts` | 2 | 2 |
| `src/domain/sessions/validation.ts` | 65 | 194 |
| `src/features/activities/ActivityCard.tsx` | 161 | 17 |
| `src/features/activities/ActivityEditorForm.tsx` | 252 | 131 |
| `src/features/activities/ActivityMediaList.tsx` | 224 | 9 |
| `src/features/activities/ActivitySelectionScreen.tsx` | 3 | 3 |
| `src/features/activities/AnchoredPanel.tsx` | 106 | 0 |
| `src/features/activities/ExecutionParametersSheet.tsx` | 1909 | 580 |
| `src/features/activities/MediaConsultation.tsx` | 366 | 0 |
| `src/features/activities/SheetMotion.tsx` | 221 | 0 |
| `src/features/activities/catalogueVideoCover.ts` | 67 | 0 |
| `src/features/activities/sheetSurface.ts` | 161 | 0 |
| `src/features/activities/useActivityCatalogue.ts` | 5 | 1 |
| `src/features/migration/MigrationNoticeGate.tsx` | 102 | 0 |
| `src/features/reference-data/BodyZonePickerModal.tsx` | 106 | 11 |
| `src/features/reference-data/CategoryPickerModal.tsx` | 137 | 13 |
| `src/features/reference-data/LabelPickerModal.tsx` | 51 | 13 |
| `src/features/reference-data/ReferenceValueDialog.tsx` | 34 | 4 |
| `src/features/reference-data/useReferenceSheet.ts` | 66 | 0 |
| `src/features/sessions/BodyZoneSelector.tsx` | 42 | 3 |
| `src/features/sessions/CatalogueScreen.tsx` | 38 | 7 |
| `src/features/sessions/CategoriesScreen.tsx` | 0 | 144 |
| `src/features/sessions/CompositionScreen.tsx` | 86 | 16 |
| `src/features/sessions/DurationWheelPicker.tsx` | 357 | 46 |
| `src/features/sessions/ExerciseExitConfirmModal.tsx` | 10 | 3 |
| `src/features/sessions/ExerciseScreen.tsx` | 116 | 65 |
| `src/features/sessions/MigrationNoticeRepositoryContext.tsx` | 13 | 0 |
| `src/features/sessions/NumberWheelPicker.tsx` | 232 | 30 |
| `src/features/sessions/SessionService.ts` | 3 | 1 |
| `src/features/sessions/SessionServiceProvider.tsx` | 26 | 1 |
| `src/features/sessions/compositionPresentation.ts` | 90 | 261 |
| `src/features/sessions/formatSessionSummary.ts` | 12 | 4 |
| `src/features/sessions/wheelPickerMath.ts` | 68 | 0 |
| `src/infrastructure/database/constants.ts` | 8 | 1 |
| `src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts` | 19 | 6 |
| `src/infrastructure/database/migrateDatabase.ts` | 15 | 1 |
| `src/infrastructure/database/migrations/migration010.ts` | 825 | 0 |
| `src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts` | 44 | 60 |
| `src/infrastructure/database/repositories/SqliteMigrationNoticeRepository.ts` | 46 | 0 |
| `src/infrastructure/database/repositories/SqliteSessionRepository.ts` | 385 | 171 |
| `src/infrastructure/database/types/DatabaseRows.ts` | 58 | 10 |
| `src/shared/i18n/index.ts` | 61 | 7 |
| `src/shared/i18n/resources/fr.ts` | 64 | 28 |
| `src/shared/ui/BodyZoneIcon.tsx` | 15 | 2 |
| `src/shared/ui/KodjoIcon.tsx` | 18 | 0 |
| `src/shared/ui/ProfileStepper.tsx` | 112 | 27 |
| `src/shared/ui/ScreenShell.tsx` | 21 | 2 |
| `src/shared/ui/entryMenuAction.ts` | 13 | 0 |
| `src/shared/ui/opacity.ts` | 10 | 0 |
