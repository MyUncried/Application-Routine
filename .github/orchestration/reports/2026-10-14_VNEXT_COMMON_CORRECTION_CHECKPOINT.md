# VNext commun — checkpoint de correction, chantier ouvert

## Reprise et réconciliation

Audit lu intégralement : `94ea7dc96604843ff6a9b1ed4551ab4f83890aa1`, rapport `2026-10-14_VNEXT_GENERALISATION_INVENTORY.md`. La base constatée est main `55aa34480d51472b540156e2e664b8528c511f6b`. La PR #358 existante, tête `363e27a7126b93e452f7ad6cb5c7ec17da6cc125`, est reprise : son découpage atomique n'est pas remplacé par un chantier concurrent. Elle est remise en draft pendant cette consolidation. Les autres worktrees avec modifications sont conservés.

PRE-4 a avancé séparément jusqu'à `211a9a592f1a5743c89736111132816fc8e84d76`. Son pilote a déjà corrigé notamment les préservations, classifications natives, sources documentaires et captures. Ce checkpoint ne remplace pas ces travaux. Aucune revue Claude ni aucun développement PRE-4 n'est lancé ici. La variante #344, V2, les cycles clôturés et le produit ne sont pas modifiés.

## État des axes au checkpoint initial (avant reprise du pilote)

« Implémenté » désigne le candidat de #358, pas main. Les contrôles locaux sont des contrôles du mécanisme avec processus simulés et objets Git réels ; ils ne prouvent pas une réception Work ni une qualification visuelle produit.

| Axe | État initial de l'audit | Correction/conclusion dans le candidat | Intégration et démonstration restantes |
|---|---|---|---|
| N01 | Admission limitée à PRE-4 | CLI commun et compatible : identité syntaxique ; admission opérationnelle depuis routage, bootstrap et registre au SHA source exact, acteur autorisé et état courant du cycle. Deux identités passent l'entrée opérationnelle avec données Git et revue simulée ; acteur non autorisé et cycle historique protégés refusés. | CI Linux/Windows du candidat ; pas encore intégré ni démontré par deux nouvelles opérations métier réelles. |
| N02 | #340 global et numéro refusé en dur | Dépendances déclarées dans le bootstrap haché, checkpoint exact, registre fermé et issue fermée ; précédent opaque sans localisation refusé ; source historique et registre courant contrôlés séparément. | Qualification opérationnelle finale. Les anciens formats de checkpoint non localisés ne sont pas devinés. |
| N03 | SHA extrait du titre PRE-4 du run | HEAD et delta Git réel contre premier parent pour push ; locator immuable unique du journal de job pour dispatch ; titres ignorés. Ambiguïté et preuve inaccessible restent bloquantes, anciennes exceptions de non-invocation conservées. | Raccordement explicite d'une archive historique de revue complète partielle à son ledger avant nouvelle invocation complémentaire ; jamais de bypass par changement de clé de portée. |
| N04 | FULL_FILE sur main, mode optionnel dans #358 | Découpage précis par défaut dans launch, launchAndProduce et les constructeurs d'unités/exigences ; document intégral conservé ; anciens checkpoints reconstruits selon leur marqueur historique, sans réécriture. | Retirer le paramètre PRE-4 redondant lors de sa prochaine reconstruction par son pilote, après mise à disposition de l'interface commune. |
| N05 | Ancienne campagne consommée par publication et Windows | Nouvelle fenêtre de publication du candidat sans checkpoint de campagne ; anciens appels portant checkpoint conservés. Validation de la demande historique lorsqu'elle est modifiée. Base Windows issue de l'événement Git vérifié et de son merge-base, sans v8_consolidation.parent_head. | Exécution Windows réelle du candidat et contrôles de sécurité/histoire. |
| N06 | Signal commun pour trois revues seulement | Même transport et protections conservés ; restriction de préfixe de tranche retirée ; nouveau nom du relais propagé à l'abonné, ancien nom conservé pour runs historiques. | **Développement/queue, tests séparés, clôture et CI non encore raccordés.** Nécessitent leurs adaptateurs de résultat/provenance et le traitement des échecs, dont absence d'archive. |
| N07 | Surveillance particulière PRE-4 | Surveillance PRE-4 observée désormais désactivée ; aucun second pilote activé ici. | **Récupération commune sur opérations enregistrées non encore mise en service.** Ne pas confondre configuration et poursuite effective. |
| N08 | Deux conversation_id pour la même automation | Écart toujours observé : binding `6ac7f420-2fd8-83eb-83ae-4c72a07603a5`, configuration Work `6acf34ca-bfac-83ed-82bd-33adefbc2cbd`, automation `6aceac15818881918314f008b1742efc`. Le champ Git est recopié/contrôlé, il ne route pas lui-même la conversation Work. | **Cause du choix de destination, réception, accusé durable et reprise effective non établis.** Aucune redirection arbitraire, aucun accusé inventé. |

La documentation OpenAI consultée (`https://learn.chatgpt.com/docs/automations`) distingue tâches autonomes et tâches revenant dans un chat. Elle n'établit pas le choix réellement effectué pour cette automation. `peek` expose configuration et dernier déclenchement, pas les journaux de réception ou d'exécution de ce run ; la recherche de contexte n'a pas retrouvé ces preuves. Le `last_run_time` du 14 octobre à 07:56 UTC demeure insuffisant.

## Défaut confirmé : conservation et revue répétitive

La fermeture des maîtres, variantes, variables et ressources ainsi que la couverture exhaustive propriété par propriété existaient déjà. #358 apportait aussi la référence fonctionnelle précise, encore optionnelle. En revanche, PRE-4 construit ses décisions et assertions en parcourant les propriétés de chaque nœud ; ses composants sélectionnés désignent des hôtes d'écran et non une qualification explicite de chaque composant Figma dans le code. Le validateur commun exigeait les assertions et la revue de chacune, sans mode de couverture hérité.

La duplication est confirmée dans le générateur PRE-4 ; l'absence de mécanisme d'héritage dans les contrats communs est également confirmée. Il n'est pas démontré que tous les autres générateurs de tranche produisent le même volume artificiel.

## Mécanisme ajouté

Toute nouvelle construction UI conserve les assertions et produit la classification composant commun / instance / intégration, les contrôles d'instance et des liens conditionnels. Un mapping doit désigner le composant de code effectivement sélectionné et ses usages existants. Valeur égale ou token ne suffit pas : filiation corroborée, capture explicite des surcharges, variante, paramètres, bindings, modes et observable restent contrôlés.

En planification, le reçu brut doit attester l'examen de la propriété canonique et des critères de mapping commun/instance avant que le contrôleur dérive `inherited_target_ids`. Il ne les ajoute jamais aux identifiants déclarés directement examinés. En implémentation, les octets Git du composant et de ses usages au HEAD de livraison sont matérialisés ; des observations de mapping explicites sont exigées et l'héritage dispose de son propre reçu/signature, sans promotion de la revue du plan en conformité produit. Les mesures et obligations fonctionnelles, d'intégration, d'accessibilité et d'appareil restent exigées.

L'invalidation est conservatrice : changement du paquet, des variables/bindings/variantes ou de l'arbre de code invalide le contexte ; la preuve d'implémentation lie les versions effectivement observées. Les anciennes preuves restent lisibles, avec leur format et leur hash exacts. L'import de qualifications entre contextes distincts reste à implémenter/qualifier : aucune preuve ancienne non liée n'est présentée comme héritage valide.

## Couverture cumulative

Le schéma de reçu partiel est distinct du rapport final et porte `REVIEW_INCOMPLETE`, jamais APPROVE. Le ledger conserve toutes les réponses brutes, sessions, constats et identifiants effectivement examinés d'un contexte exact. Sa progression est append-only, dédupliquée, scellée, et refuse portée dépassée, réordonnancement, changement de source, conflit et absence de progrès. Le reçu final dérive la couverture cumulée avec les liens communs valides et reste soumis au validateur final existant et à son seuil inchangé.

Le relais générique sélectionne par défaut des portées bornées pour les nouveaux grands dossiers. Leur capacité est un paramètre immuable de portée, pas un seuil d'approbation. La consommation du reçu matérialise le ledger avant la nouvelle demande ; la dernière agrégation ne rappelle pas Claude. Le reçu cumulatif conserve les sessions réelles, sans en inventer une commune. Les mappings/renseignements de réutilisation manquants d'un grand catalogue répété doivent être résolus ou justifiés avant de substituer des dizaines de revues cumulatives à leur analyse.

Ce mécanisme de planification ne suffit pas à déclarer raccordés tous les traitements asynchrones ni toutes les reprises historiques. Le cumul des revues d'implémentation, l'import entre contextes et la preuve d'une poursuite Work effective restent à terminer/qualifier.

## Mesure PRE-4 et conservation

Source figée exacte `211a9a59`, paquet `088c6dc6c9df81d9ad433d71413a6de62c03e97473d976438b5cd3a96111db0d` ; rapport reproductible `2026-10-14_PRE4_COMPONENT_IMPACT.json`.

| Mesure | Avant | Après justifié à ce checkpoint |
|---|---:|---:|
| Obligations initiales | 180 526 | 180 526 conservées |
| Obligations directes | 180 526 | 180 526 |
| Obligations effectivement héritées | 0 | 0 |
| Obligations restant à vérifier sur ce contexte | 180 526 | 180 526 |
| Réduction vérifiée | — | 0 |

Répartition conservée : 143 473 géométrie, 35 729 style, 1 241 contenu, 83 états/scénarios. Inventaire : 5 465 nœuds, 680 instances, 58 maîtres et 11 ensembles de variantes. Zéro des 680 instances ne capture explicitement ses surcharges ; zéro mapping qualifié est enregistré dans ce contrat. Le contrôle commun identifie 24 composants dont la réutilisation répétée exige encore une qualification de source/mapping ou une justification directe étayée avant une grande revue. 45 109 égalités de valeurs se répartissent sur 3 574 propriétés de maîtres distinctes : **ce ne sont ni un volume factorisable démontré ni une réduction**. L'empreinte de l'ensemble des 180 526 identifiants initiaux est identique à celle des identifiants classifiés. Chaque obligation conserve donc un traitement direct explicite.

Les 4 996 cibles de l'ancienne revue sur 236 896 appartiennent à son ancien contexte ; elles ne sont pas transférées dans le contexte modifié de PRE-4. Les six constats et leur archive restent historiques, pas une approbation. Aucun nouvel appel sur le même paquet n'est justifié par ce checkpoint.

## Contrôles et prochaine action

Cas locaux : composant répété, variantes distinctes, paramètre/surcharge, token modifié, instance détachée, mapping absent, héritage conditionnel, comportement/intégration directs, compatibilité historique, déplacement et relecture de reçu, changement réel des octets de code, deux identités de tranche au travers de l'entrée d'exécution, admission/dépendances et refus de concurrence/ambiguïté. Les processus de revue sont simulés et explicitement marqués TEST ONLY. Une première suite complète a donné 537/538 : l'unique échec était un fichier historique absent du checkout sparse ; ses octets versionnés ont été restaurés et ses contrôles ciblés passent. Une passe élargie ultérieure a donné 544/544 ; les derniers contrôles ciblés du relais, des portées, des réconciliations et de l’héritage passent également. Les nombres exacts et la CI du candidat publié doivent être relus dans la PR : ces contrôles avec reviewers simulés ne certifient pas une réception Work.

Point à transmettre au pilote PRE-4 : attendre l'interface commune qualifiée ; conserver son HEAD et ses corrections ; compléter, sur une nouvelle source identifiée, la provenance des surcharges et les mappings Figma/code ou les justifications directes étayées ; mesurer de nouveau avant toute revue. Ensuite reconstruire les unités fonctionnelles par défaut, le catalogue et les contrats, puis seulement admettre la revue résiduelle justifiée. La revue Claude et le développement restent exclusivement sous son pilotage, avec approbation explicite du plan avant développement.

Le chantier n'est pas clos : terminer N06–N08, les interfaces de cumul/import restantes, la qualification opérationnelle et la réception/reprise réelle. Aucun succès unitaire ou diminution d'un compteur ne remplace ces critères.

## Qualification CI du candidat 4010508e et correction de fermeture

Run VNext `38561066022` : qualification Linux `115841965349` et Windows `115841965243` réussies. Les deux jobs d'équivalence historique échouent ; l'archive Linux `11892980110` désigne exactement F-001 : `lib/vnext-component-coverage.js` manque dans la liste des dépendances embarquées par le runtime IMPLEMENT. Le run de contrôles hérités `38561066211`, job `115842085201`, confirme le même défaut (1 530 réussites, un échec, deux skips).

La liste de fichiers du workflow IMPLEMENT est complétée, son empreinte exacte de sécurité mise à jour et le manifeste complété. Aucun changement des modes, transitions ou autorisations V2. Les 16 contrôles locaux ciblés de fermeture et gel passent. Le candidat corrigé doit repasser la CI ; un succès du candidat précédent ne vaut pas validation de cette correction.


## Reprise publiée du pilote PRE-4 — 14 octobre 2026

La reprise conserve le candidat `bb15aae411d6d3877eacfb881f4d79efb1d7ca5e` et la PR #358. Les états ci-dessus décrivent le checkpoint initial ; les corrections suivantes les complètent sans déclarer le chantier clos.

| Axe complémentaire | État du nouveau candidat | Preuve réelle restant nécessaire |
|---|---|---|
| N03, reprise historique | Import explicite de réponse partielle et de ses constats dans un ledger du même contexte exact ; refus de changement de source ou de faux raccordement. | L'ancien PRE-4 modifié n'est pas réconciliable par transfert de couverture. |
| N06, familles asynchrones | Adaptateurs CI, implémentation et tests/clôture avec provenance du run, tentative exacte, requête immuable, archives vérifiées et diagnostic d'archive absente. | CI du commit publié puis signal et consommation effectifs. |
| N07, récupération commune | Balayage paginé des opérations enregistrées et réveil commun ; claims durables, checkpoints publiés et reçus distincts de la récupération manuelle ; aucun vol par expiration. | Exécution du workflow sur main et poursuite effective. |
| N08, destination | Automation remplacée et ancienne désactivée. La destination renvoyée par Work correspond au binding Git de cette conversation ; destinations historiques explicitement conservées en lecture. | Configuration vérifiée seulement : réception automatique et accusé durable restent à démontrer. |
| Cumul d'implémentation | Portées bornées, réponses brutes et sessions conservées, ledger append-only, agrégation sans nouvel appel ; branchement au relais et consommation. | Qualification CI et opération réelle selon les gates existantes. |
| Import de preuve commune | Relecture de la preuve brute antérieure et de son code Git exact ; signature commune/token/variante/bindings ; mapping courant toujours obligatoire. | Aucun donneur ni mapping PRE-4 réellement qualifié à ce checkpoint. |

Contrôles locaux : suite complète **564 réussites, zéro échec, zéro skip**. Après le raccordement historique final, les **30 contrôles ciblés** du relais et du cumul passent également. Les tests de revue utilisent des réponses explicitement TEST ONLY ; ils ne sont pas une revue Claude du produit. Les contrôles de sécurité des écritures distantes et les filtres V2 restent exigés en CI. Aucun code applicatif n'est modifié.

Le plan PRE-4 consolidé reste à `211a9a592f1a5743c89736111132816fc8e84d76`. Le catalogue initial de 180 526 obligations est conservé ; sa réduction effective n'est toujours pas démontrée. Prochaine étape : qualifier ce candidat publié, intégrer les interfaces communes, compléter les sources/mappings réels avant mesure et reconstruction exactes. La revue résiduelle précède l'approbation explicite du propriétaire ; le développement produit reste interdit avant cette approbation.


## Réconciliation du 15 octobre, après intégration de #358

Les états précédents sont historiques. #358 est fusionnée ; la CI `38621132357` qualifie le candidat `754e71be8e28dfa47418c18875da30958b324779` sur Linux et Windows. Le résultat CI a été réellement reçu et consommé par l’exécution Work du 15 octobre à 00:27–00:31 Paris : quatre ZIP et leurs fichiers vérifiés, claim `ae877afe8a357d0cae13604e0c9160c7cfdfbd69`, checkpoint `f8b84bc5be79247116e6df775eda95659646f190` en RESULT_CONSUMED, reçu `d884cf9250694bf9824a57094aac2d3b52a37237` relus. Le claim porte AUTOMATION_EVENT et la livraison 62217550-c81e-11f1-90f6-cb6ca22dd614. Les événements produits par les reçus ont été ignorés sans reprise ni appel modèle.

N06 : raccordement générique intégré, démonstration opérationnelle obtenue pour la famille CI. Les autres familles conservent leur qualification de contrat ; aucun nouveau parcours produit n’est déduit de cet essai. N07 : possession/checkpoint/reçu automatiques démontrés sur ce signal réel, sans vol ni doublon. N08 : réception et consommation durables établies dans le chat d’exécution ; restitution spontanée dans le fil pilote NON VÉRIFIABLE. Le binding est une identité de contrôle, pas une API de publication dans un autre fil.

La consolidation finale conserve les octets ZIP automatiquement dans le commit du signal et ajoute une interface connecteur reprenant les mêmes fonctions du consommateur. Elle doit être qualifiée sur son candidat exact avant intégration. Cette preuve de transport ne corrige ni ne qualifie la couverture du catalogue PRE-4. Aucun développement, appel Claude ou arbitrage produit n’est lancé par ce checkpoint.
