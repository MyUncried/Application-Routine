# Phases d’un exercice — spécification fonctionnelle consolidée et analyse d’impact

Version consolidée du 16 octobre 2026. Périmètre : MVP.

Cette spécification consolide les documents V2 et les arbitrages d’Hermann des 15 et 16 octobre 2026. Elle constitue le document de référence de cette évolution pour sa réintégration dans les chapitres 01 à 13. Cette révision ne vaut ni publication dans le dépôt ni livraison applicative. Les spécifications définissent les règles fonctionnelles ; Figma définit les principes de présentation. Aucun nouvel emplacement, cadran ou format de carte n’est prescrit ici.

## 1. Finalité et périmètre

Décrire plusieurs actions chronométrées à l’intérieur d’un même exercice, sans créer plusieurs exercices dans le catalogue ou plusieurs lignes dans la séance. Exemple : une action de 6 s suivie d’une autre de 3 s, répétées à chaque série.

Une phase est une subdivision ordonnée d’une série. Une série exécute une fois la séquence entière des phases. Le nombre de séries porte la répétition ; aucun compteur de cycles de phases supplémentaire n’est introduit.

Les phases entrent dans le MVP. Leur représentation précise sur le cadran et sur la carte de composition reste un travail de présentation séparé, nécessaire à la livraison complète. La personnalisation libre du cadran n’est pas incluse dans cette évolution.

## 2. Règles fonctionnelles

### 2.1 Structure et éligibilité

- Un exercice contient zéro à six phases ordonnées. Zéro signifie « Aucune » ; une seule phase est autorisée.
- Chaque phase porte un libellé de 20 caractères maximum et une durée entière en secondes.
- Une phase conservée dure au moins 1 seconde. Le pas de réglage est de 1 seconde ; les bornes du réglage d’une série sans phases restent distinctes.
- Les phases sont réservées au mode Durée avec une cible chiffrée et des séries identiques.
- Elles sont incompatibles avec le mode Répétitions, une cible À l’échec et les séries variables.
- Si des phases existent, les choix incompatibles sont indisponibles. L’utilisateur supprime d’abord les phases ; aucune conversion destructive automatique n’est créée.
- Avec des séries variables ou une cible À l’échec, la création de phases est indisponible. L’interface doit également respecter l’exclusion du mode Répétitions.
- La séquence de phases est commune à toutes les séries de l’exercice. Elle ne définit ni exercice supplémentaire ni pause entre ses éléments.

### 2.2 Création et édition

Après sélection du mode Durée, l’utilisateur peut ajouter des phases. Sans phases, la valeur est « Aucune » ; l’appui crée la première ligne. Si la durée de série existe, elle est reprise. Sinon, la ligne est vide et doit être renseignée : aucune durée arbitraire n’est attribuée. Un libellé vide est traité à la validation suivant la règle ci-dessous.

Le chevron n’apparaît que si des phases existent et permet de replier ou déplier leur détail. Les opérations fonctionnelles sont : saisir le libellé, modifier une durée éditable, ajouter, supprimer et réordonner les phases. Leur disposition relève de Figma et du DSF, sans nouveau choix de présentation dans cette spécification.

Hors durée imposée, une phase ajoutée reprend la durée de la dernière phase ; un libellé non renseigné reçoit « Phase n » à la validation. Toutes les durées sont modifiables ; la durée de série est recalculée. L’ajout est indisponible après la sixième phase, sans créer de septième ligne.

Un libellé laissé vide est remplacé par « Phase n » à la validation, suivant la position finale. Les libellés personnalisés restent attachés à leur phase lors d’un déplacement.

Toute phase restée à 0 s est retirée automatiquement à la validation, sans message ni blocage. Zéro est un état temporaire de saisie, pas une phase exécutable persistée. Une liste entièrement vide ou nulle revient à « Aucune » ; aucune durée positive n’est inventée et les règles existantes de complétude de l’exercice restent applicables. La validation de la feuille applique les paramètres au brouillon parent ; l’enregistrement définitif suit la frontière existante de l’éditeur. Annuler restaure l’état antérieur de cette feuille.

### 2.3 Suppression et retour sans phases

Hors durée imposée, supprimer une phase retire sa contribution à la durée de série. Supprimer la dernière phase existante ramène la ligne à « Aucune » et conserve la durée qu’elle portait juste avant sa suppression comme durée de série. Cette durée redevient modifiable, sauf contrainte du format.

Les conventions existantes de suppression et d’annulation doivent être réutilisées : restaurer une suppression restitue l’ordre, les libellés et les durées de l’état précédent, y compris les valeurs calculées affectées par cette suppression.

### 2.4 Durée de série et durée totale

Soit D la somme des durées des phases actives. La durée d’une série est D, affichée comme résultat calculé non modifiable. Elle ne constitue pas une seconde prescription indépendante.

Pour un exercice unilatéral de N séries identiques et une pause P après chaque série :

`T intrinsèque = N × (D + P)`

Cette durée comprend la dernière pause et exclut le compte à rebours et la fin propres. Si une récupération de séance positive R suit l’occurrence, la substitution existante s’applique à sa pause terminale : `T occurrence = T intrinsèque − P + R`, dans ce cas unilatéral exécuté comme bloc complet. Dans un circuit de séries, appliquer la substitution au passage concerné conformément au plan existant, sans transposer aveuglément la formule de bloc.

Exemple validé : phases 6 s et 3 s, trois séries, pause de 15 s : D = 9 s ; T = 3 × (9 + 15) = 72 s, soit 1 min 12 s. C’est la valeur du champ Durée totale des paramètres. Aucun compte à rebours ni fin n’y est ajouté.

Les règles bilatérales, les deux ordres de côtés, les circuits, les récupérations et les points d’arrêt restent applicables. Chaque passage de travail d’un côté exécute la séquence complète avant la transition déjà prescrite. Les phases n’ajoutent aucune pause de côté ni pause de série.

Une séquence chronométrée a une durée déterminée. Elle n’introduit pas à elle seule un symbole ≈ ou ≥. Le symbole de la séance reste déterminé par l’ensemble de ses contributions. Aucune estimation de 2 s par répétition n’est utilisée.

## 3. Formats imposant une durée de travail

### 3.1 Réglage dans le format

Les phases sont autorisées lorsque le format impose une durée de travail compatible avec l’éligibilité ci-dessus. Tabata constitue le cas validé : une série reste de 20 s.

La dernière phase porte automatiquement le temps restant :

`durée dernière phase = durée imposée − somme des phases précédentes`.

Les durées précédentes sont modifiables dans les limites du budget restant ; aucune durée négative n’est produite et aucun blocage de validation pour dépassement n’est ajouté. La dernière phase est calculée et peut temporairement valoir zéro.

| Action | Résultat attendu pour 20 s |
| --- | --- |
| Créer la première phase | Une phase calculée de 20 s |
| Ajouter une deuxième phase | 20 s + 0 s ; aucune division automatique |
| Régler la première à 12 s | 12 s + 8 s |
| Ajouter une troisième | 12 s + 8 s + 0 s ; la deuxième devient modifiable |
| Déplacer une phase | Les durées restent inchangées ; la nouvelle dernière devient calculée |
| Supprimer 7 s dans 5 + 7 + 8 | 5 + 15 s |
| Supprimer la dernière dans 5 + 7 + 8 | 5 + 15 s ; la précédente devient calculée |
| Supprimer l’unique phase | Aucune phase ; série de 20 s toujours imposée |
| Valider 20 + 0 | Retrait silencieux de la phase à zéro ; une phase de 20 s |

### 3.2 Intégration d’un exercice déjà décomposé

Si la somme des phases de l’exercice ajouté diffère de la durée imposée, adapter proportionnellement leurs durées dans la copie de séance, à la hausse comme à la baisse. Préserver l’ordre et les libellés. L’exercice source du catalogue reste inchangé.

Avant arrondi, chaque durée est multipliée par le rapport `durée imposée / somme initiale`. Les arrondis sont absorbés par la dernière phase pour conserver exactement le total imposé. Toutefois, l’arrondi doit préserver chaque phase à au moins 1 s : si un simple report sur la dernière ne suffit pas, redistribuer les secondes entre les phases au plus près des proportions initiales. La somme finale doit être exactement la durée imposée ; aucune phase n’est supprimée par cette adaptation. Exemple : 1 + 29 s adaptés à 20 s donnent 1 + 19 s. Le choix de l’algorithme déterministe d’arrondi appartient à la réalisation technique et doit respecter ces invariants.

Un message informatif explique l’adaptation, sans demander de confirmation supplémentaire. Exemple : « Les durées des phases ont été ajustées pour respecter les 20 s du format Tabata : 15 s + 15 s deviennent 10 s + 10 s. »

Exemples validés : 15 + 15 devient 10 + 10 ; 6 + 3 devient 13 + 7. Lorsque les totaux sont déjà égaux, aucune adaptation n’est nécessaire. Cette adaptation à l’intégration ne remplace pas le calcul du temps restant pendant l’édition.

Si la durée imposée est inférieure au nombre de phases à conserver exprimé en secondes, la validation est impossible. Exemple : six phases ne peuvent pas tenir dans cinq secondes. Ne pas supprimer de phase ni augmenter la durée imposée pour contourner cette impossibilité. Ce cas est distinct d’une phase volontairement laissée à zéro pendant l’édition, retirée par la normalisation prévue au §2.2.

### 3.3 Limite de généralisation

Une durée globale de séance ou de fenêtre n’est pas nécessairement une durée de travail imposée à l’exercice. Ne pas transformer automatiquement une fenêtre EMOM en durée d’effort : son repos résiduel fait partie de sa définition. L’éligibilité dépend du mode et de la cible de travail réellement prescrits. Les formats prescrivant des répétitions restent incompatibles avec les phases dans cette version ; leurs règles ne sont pas converties pour permettre l’ajout.

## 4. Exécution, audio et progression

Les phases s’enchaînent automatiquement à expiration de leur durée, sans pause ni attente d’une annonce. La fin de la dernière phase termine le passage de travail de la série ; le plan reprend ensuite la pause, le côté ou le passage suivant selon les règles existantes.

Le bip de cadence reste continu à l’intérieur d’une série : un changement de phase ne réinitialise pas son intervalle. Exemple 6 s + 3 s, bip toutes les 4 s : bips à 4 s et 8 s. Les règles existantes de pause manuelle/reprise du bip restent applicables. Si un bip coïncide avec une transition, le signal de transition prime ; aucun double signal.

Si les annonces vocales sont activées, le libellé est annoncé au début de chaque phase, première comprise. Le chronométrage ne l’attend pas. L’annonce de la nouvelle phase interrompt celle de la précédente si elle n’est pas terminée. Aucun empilement d’annonces de phases périmées.

Les commandes gardent leur portée existante. Réinitialiser recommence la série courante en unilatéral, donc depuis sa première phase ; en bilatéral, le périmètre du côté courant reste celui déjà spécifié. Les résultats de l’autre côté et le temps réel cumulé sont conservés. Suivant ne devient pas implicitement une commande « phase suivante » : il garde le périmètre et les confirmations de la série ou du bloc existant.

Pause/Reprendre et reprise technique doivent conserver la position dans la séquence et le temps restant, sans rejouer les phases déjà achevées du passage. L’exécution s’appuie sur son instantané figé, pas sur une relecture du catalogue.

La progression ne doit pas dépendre artificiellement du nombre de subdivisions. Décomposer une série de 9 s en 6 + 3 ne change pas son poids global. Conserver l’unité contributive Série dans la pondération existante et répartir sa progression interne selon le temps ; ne pas augmenter mécaniquement M dans les plans mêlant durées connues et inconnues.

La présentation du cadran et des cartes relève du chantier Figma. Aucune proposition de temps affiché, de rang ou d’emplacement n’est validée par ce document. Aucune nouvelle commande de navigation entre phases n’est créée par ce document.

### 4.1 Phrase de synthèse

Conserver la grammaire existante de la phrase et détailler les phases entre parenthèses après la durée de série, dans l’ordre d’exécution :

`(nom : X s - nom : Y s - …)`

Exemple : « **3 séries de 9 s** (Descente : **6 s** - Maintien : **3 s**), avec une pause après chaque série de **15 s**. »

La liste est exhaustive, y compris pour une seule phase ; elle utilise les libellés et durées effectifs après validation et, le cas échéant, adaptation au format. Sans phases, la phrase existante reste inchangée. Le libellé « pause après chaque série » est conservé. La phrase se régénère après toute modification des paramètres, des libellés ou de leur ordre.

Le générateur retourne des segments `{texte, gras}`, avec les valeurs mises en valeur suivant les conventions existantes. Ni la phrase ni ses segments ne sont stockés en base. La syntaxe française ne doit pas être présentée comme un mécanisme multilingue : une internationalisation nécessitera des modèles localisés, avec règles de pluriel et ordre des groupes adaptés.

## 5. Modèle de données et contrats techniques proposés

La liste appartient aux paramètres d’exécution de l’exercice. Le code actuel possède déjà un objet canonique ExecutionParameters commun au catalogue et à l’occurrence de séance : l’étendre plutôt que créer un modèle concurrent.

Proposition de structure logique : collection ordonnée `phases`, avec pour chaque élément une identité stable, un libellé et une durée en secondes. L’ordre de la collection constitue l’ordre d’exécution. Les noms et la stratégie d’identité seront précisés au plan technique ; ils ne sont pas un arbitrage métier supplémentaire.

La séquence n’est pas dupliquée N fois dans la définition. Le développement en séries/côtés/passages appartient au plan d’exécution. L’instantané doit conserver la séquence effective et ses durées après toute adaptation au format.

Avec phases, la durée de série est une projection de leur somme. Si un champ historique reste nécessaire, sa valeur est dérivée, jamais écrite indépendamment. La dernière durée peut être matérialisée dans les paramètres validés ; son caractère non modifiable découle du contexte de format, pas d’une seconde valeur concurrente.

Les brouillons peuvent contenir une phase à zéro ; les paramètres validés n’en contiennent pas. Les phrases, segments de mise en forme et durées totales ne sont pas persistés. Le générateur reste une fonction pure produisant des segments `{texte, gras}`. Le corpus de phrases doit être étendu avec les déclinaisons de la règle du §4.1 ; les 276 combinaisons historiques ne démontrent pas à elles seules la couverture des phases.

Les anciennes données sans liste de phases restent des exercices sans phases. Prévoir une évolution versionnée du JSON canonique, la lecture de l’ancienne version, les copies et les projections. Ne pas réécrire les résultats historiques. Le parseur actuel refuse les versions inconnues : la compatibilité de lecture doit être livrée avec la nouvelle écriture.

## 6. Impacts sur la solution développée

Inspection ciblée du main `6656fefc58330955f5ad74d513ce616ea51809b0`, le 15/10/2026. Cette analyse ne constitue pas une revue exhaustive du code ni une estimation de charge en jours.

| Domaine | Impact | Travail nécessaire |
| --- | --- | --- |
| Paramètres canoniques | Modéré et transversal | Étendre ExecutionParameters, validations, normalisation, clonage, sérialisation et lecture versionnée |
| Catalogue et copie de séance | Modéré | Transporter les phases dans les entrées, sorties, brouillons et copies indépendantes |
| Persistance locale | Modéré | Étendre le JSON execution_parameters et ses adaptateurs ; vérifier l’ensemble des chemins de séance et snapshots |
| Éditeur des paramètres | Significatif | Tableau de phases, exclusion des modes, zéro temporaire, dernière durée calculée, limites et annulation atomique |
| Calculs et phrases | Modéré | Somme des phases, projections, formats, segments de synthèse et cas de recette |
| Moteur cible | Structurant mais additif | Sous-étapes chronométrées de la série, reprise, identité de phase, audio et progression sans double comptage |
| Cadran et cartes | À compléter | Présentation du libellé et de la décomposition, contrats et captures ; pas de refonte générale décidée |
| Serveur et hébergement | Aucun besoin nouveau identifié | La gestion locale de six phases ne justifie aucun nouveau service ni infrastructure |

Points concrets observés :

- `src/domain/activities/ActivityDefinition.ts` porte déjà `executionParameters` ; les scalaires historiques sont des projections.
- `src/domain/activities/ExecutionParameters.ts` définit une version 1, sans collection de phases, et sérialise explicitement les champs. Ajouter une propriété au type seul ne suffit donc pas : elle serait perdue à la sérialisation.
- `src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts` stocke déjà les paramètres canoniques dans `execution_parameters`. Une nouvelle table n’est pas imposée par le besoin ; le choix final dépend des chemins de séance et d’historique.
- Les fichiers `ExecutionParametersDraft.ts`, `executionPhrase.ts` et `ExecutionParametersSheet.tsx` sont des points d’entrée identifiés pour l’analyse technique suivante ; leur fonctionnement complet n’a pas été audité dans cette consolidation.

Le moteur cible a été déclaré non encore développé dans les échanges du projet. Dans ce contexte, les phases sont à intégrer à sa conception initiale, plutôt qu’à traiter comme la refonte d’un moteur livré. Les éditeurs et la persistance déjà présents, eux, doivent être adaptés et vérifiés.

L’augmentation de volume reste limitée à six descriptions et durées par exercice et par copie/instantané pertinent. Aucun surcoût récurrent d’hébergement spécifique n’est identifié. Le coût principal est le développement et la recette. Les libellés restent des données textuelles : longueur bornée, aucune interprétation comme code, pas d’introduction d’un service vocal distant par cette spécification.

## 7. Mise à jour de la documentation globale

Le contenu normatif doit être réparti directement dans les chapitres existants. Cette consolidation ne doit pas devenir un quatorzième chapitre ou une annexe normative concurrente. Les preuves de traitement restent dans le suivi de changement.

| Destination | Contenu à intégrer |
| --- | --- |
| 01–02 | Mention courte du besoin de décomposition d’un geste, si nécessaire ; aucun développement en double |
| 03 Parcours | Créer, modifier et intégrer un exercice à phases dans une séance |
| 04 Modèle fonctionnel | Relation Exercice/Série/Phase ; distinguer phase de geste et phase structurelle du plan |
| 05 Versions | Phases dans le MVP ; dépendances de présentation à livrer |
| 06 Écrans | États sans phases, phases définies, incompatibilités, durée imposée ; captures correspondantes |
| 07 Décisions | Décisions validées, sans dupliquer toute la spécification |
| 08 Conception détaillée | Édition, formats, adaptation, messages, calculs et synthèses |
| 09 Données | Liste ordonnée, copies, valeurs dérivées, instantanés et compatibilité |
| 10 Règles transverses | Éligibilité, normalisation, calcul, ordre d’exécution, sons et progression |
| 11 API fonctionnelles | Validation, normalisation, copie, calcul, génération de phrase et de plan |
| 12 Architecture | Évolution des paramètres canoniques, version du JSON, reprise et ordonnancement |
| 13 Contrats d’écran | Champs, états, actions, bornes, annulation, accessibilité et recettes |
| DSF existant | Réemploi du tableau, libellé 20 caractères, état calculé, état indisponible, repli et message informatif |

Le rapport Figma V2 recense trois écrans dédiés sur Conception — Hors MVP, 38 écrans modifiés répartis sur deux pages et seize modales de format non encore complétées. Ces nombres proviennent du rapport fourni, pas d’un nouvel inventaire Figma en direct.

Les corrections collatérales de fond gris, hauteur de feuille, marge basse et alignement du chevron doivent être suivies séparément des règles de phases. L’écran incomplet supprimé sur Conception ne supprime pas son équivalent complet du MVP. Actualiser les exports uniquement pour les frames nouvelles ou réellement modifiées.

## 8. Recette fonctionnelle à préparer

| Cas | Résultat attendu |
| --- | --- |
| Exercice historique sans phases | Aucun changement de paramètres, de durée ou d’exécution |
| Aucune → première phase | Durée actuelle reprise si elle existe ; sinon ligne vide à renseigner ; chevron désormais présent |
| Ajout libre à une phase de 6 s | Deux phases de 6 s ; série de 12 s |
| Six phases | Ajout supplémentaire indisponible |
| Libellé vide | Phase n après validation ; maximum 20 caractères |
| Phase à zéro | Retrait à la validation sans message ; aucun stockage ni exécution de cette ligne |
| 6 + 3, N=3, P=15 | Durée totale intrinsèque 72 s |
| 6 + 3, N=3, P=0 | 27 s, aucun repos entre phases ou séries |
| Récupération positive après occurrence | Substitution terminale existante, sans double pause |
| Durée imposée 20 s, ajout | 20 + 0, puis 12 + 8 après modification |
| Réorganisation sous durée imposée | Valeurs conservées, dernière position calculée |
| Suppression sous durée imposée | Temps libéré repris par la dernière restante |
| Intégration 30 vers 20 s | 15 + 15 devient 10 + 10, message, catalogue inchangé |
| Intégration 9 vers 20 s | 6 + 3 devient 13 + 7, message, catalogue inchangé |
| Total déjà conforme | Durées inchangées |
| Phase de 1 s ; réglage de 3 à 4 s | Minimum 1 s, pas de 1 s |
| Adaptation 1 + 29 vers 20 s | 1 + 19 s ; deux phases conservées |
| Six phases adaptées à 5 s | Validation impossible ; aucune suppression automatique |
| Synthèse de deux phases | Détail « (nom : X s - nom : Y s) » dans leur ordre |
| Modification du nom, de l’ordre ou de la durée | Synthèse immédiatement régénérée depuis les paramètres |
| Durée totale modifiée, nombre de séries libre | Nombre de séries ajusté selon la règle existante ; phases inchangées |
| Cible À l’échec / Répétitions / séries variables | Phases indisponibles ; aucune destruction implicite |
| Bip toutes les 4 s sur 6 + 3 | Bips à 4 et 8 s ; pas de remise à zéro à 6 s |
| Annonce plus longue que sa phase | La suivante interrompt la précédente ; temps non retardé |
| Pause/reprise et interruption technique | Même phase, temps correct, aucun résultat dupliqué |
| Réinitialiser / Suivant | Portée existante conservée, pas de nouvelle commande par phase |
| Bilatéral et circuit de séries | Chaque passage exécute son motif complet, pauses aux frontières prévues |
| Série de 9 s vs décomposition 6 + 3 | Même poids de progression globale, y compris avec travail inconnu ailleurs |
| Annuler après édition/adaptation | Retour cohérent à l’état précédent dans le périmètre d’annulation existant |
| Sauvegarder, relire, dupliquer | Ordre, libellés, durées et indépendance catalogue/séance conservés |

Ces cas sont une liste de vérification à implémenter et exécuter, pas des tests applicatifs déjà passés.

## 9. Conditions de réalisation et limites

Les arbitrages traités dans cette consolidation sont clos : minimum et pas de 1 seconde, conservation des phases lors de l’adaptation, validation impossible si le budget ne peut les contenir, création d’une ligne à renseigner en l’absence de durée et détail des phases dans la phrase.

Les points suivants sont des travaux de réalisation ou des limites de vérification, pas des décisions métier à rouvrir :

- Définir et tester l’algorithme déterministe d’arrondi conforme au §3.2, avec minimum et somme exacte.
- Étendre le corpus de synthèses avec phases, sans modifier les règles de pause.
- Actualiser les contrats et captures à partir de Figma ; ce document ne prétend pas avoir réalisé ces exports.
- Raccorder les annonces de phases à l’ordonnanceur audio existant : aucun retard du chronométrage, aucune file d’annonces périmées. L’articulation avec les annonces de nom d’exercice et de côté doit être vérifiée lors de cette intégration ; elle n’est pas présentée comme déjà testée.
- Corriger dans le lot technique approprié l’écart préexistant de bornes : RM-234 impose 5..3535 s pour le réglage de série concerné, tandis que le code inspecté autorisait 1..5999 s. La spécification prime. Le pas propre aux phases permet notamment 6 + 3 = 9 s ; la somme ne doit pas être arrondie au pas de 5 s du sélecteur de série.
- Conserver la règle existante d’inversion de la durée totale : elle ajuste le nombre de séries lorsqu’il est libre, pas les durées des phases. Lorsque ce nombre est imposé, la durée totale est en lecture seule.

L’analyse technique du §6 est datée du commit indiqué ; elle ne prétend pas décrire un nouvel audit de la tête courante. La vérification applicative, la migration et la recette restent à réaliser.

Sources : documents V2 fournis ; arbitrages de cette conversation des 15 et 16 octobre 2026 ; documentation et fichiers techniques au commit cité au §6.
