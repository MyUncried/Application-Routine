# Mouvement — création et modification : périmètre documentaire


> **Recette A/B du 27/10/2026 (Hermann).** F07 : depuis le Catalogue des Mouvements, une fiche existante s'ouvre directement en édition (plus de consultation préalable ni de crayon ; brouillon, abandon et dialogues C03 conservés ; archivé : consultation seule ; lecture seule depuis une Séance inchangée). F01/F02 : média prolongé derrière la zone de contexte sans bande blanche, zone média fixe au défilement, gabarit toujours présent. F03–F05 : « Description du mouvement » et « Phases du mouvement (pour minuter l'exécution) » en 11, mêmes marges ; phases en liste d'étapes textuelles, sans durée. F06 (MVT-09) : libellé de phase limité à 20 points de code (`WORK_PHASE_LIMITS.labelMaxLength`). A01 : marges de 16. Catalogue : carte selon `Carte — Mouvement` (deux premières étapes de description), « Ajouter un niveau » remplace « Créer une variante », réordonnancement par appui long dans une pile déployée, glissé réservé aux piles déployées. Détail : chapitre 07, « Recette A/B du 27/10/2026 ».
> **C08 — actualisation du 28/10/2026.** La [composition des familles depuis le catalogue](DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), règles A à E et CE-MVT-03, est désormais définie : rattacher, détacher et dissoudre une famille par geste. Les mentions antérieures « C08 différé » restent historiques pour ces opérations ; elles ne sont plus une restriction active. La suppression définitive d'un mouvement reste distincte et n'est pas clôturée par ce lot.

Date : 27 octobre 2026. Statut : référence cible du lot documentaire demandé par Hermann ; aucun développement produit ni modification Figma effectué par cette mise à jour.

## 1. Autorité et périmètre

Sources : décisions D-445 et D-449 ; règles arrêtées du 26/10/2026, troisième version reçue (`KODJO-Regles-arretees-2026-10-26(2).md`), sections 1, 3.9 et 3.10 ; lecture directe du fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`. La source reçue comporte encore des propositions sur la composition : elles ne sont pas validées par ce report ciblé.

Objectif : depuis le catalogue des mouvements, créer, retrouver, consulter et modifier un mouvement ; créer une variante explicitement reliée à sa famille. Un mouvement peut exister sans exercice. Aucun exercice ni séance n'est créé comme effet secondaire de cette fiche.

Inclus : accès minimal au catalogue et ouverture de la fiche, recherche au fil du nom, unicité, contenu, référentiels, médias, structure des phases, niveau et variante, brouillon, sauvegarde, persistance et tests automatiques. Les règles et composants déjà livrés sont réutilisés.

Hors de ce lot : refonte complète des piles et filtres du catalogue, réordonnancement des familles, partage/archivage/suppression des mouvements, fusion des catalogues de séances, composition et reprise des séances, paramètres d'exécution, planification et moteur. Les entrées de catalogue hors lot ne doivent pas conduire à des actions factices ; leur livraison relève du découpage technique. La refonte complète du catalogue reste hors lot ; les états Actions glissées et Ajouter un niveau sont intégrés par le complément du 27/10 ci-dessous. [précisé par les arbitrages de Hermann du 27/10/2026 sur le Catalogue des Mouvements (chapitre 07) : piles et déploiement, recherche, filtres, création de variante par action glissée, archivage, restauration et suppression définitive font désormais partie du lot ; « Partager » et « Trier » restent présents mais grisés ; le réordonnancement des familles reste hors lot] [Réordonnancement et composition des familles intégrés ensuite : B08 (recette A/B du 27/10/2026) et lot Familles de PRE-8 (28/10/2026).]

## 2. Contenu et invariants

- Le mouvement porte son nom principal unique, ses alias existants, catégorie, zones corporelles, description en étapes, médias, structure ordonnée des phases et rattachement éventuel à une famille.
- L'exercice porte les paramètres d'exécution : mode, cibles, séries, durées des phases, pauses, charge et côtés. Aucun de ces paramètres n'apparaît dans la fiche Mouvement.
- Une phase du mouvement possède une identité stable et un libellé ; sa durée n'est pas une propriété du mouvement. Dans une correction, conserver les `WorkPhase.id` des phases conservées, même déplacées. Ne pas recycler une identité supprimée, ni inventer des durées pour les exercices liés.
- Une correction conserve l'identité du mouvement et les paramètres locaux des exercices. Leur contenu courant est lu par référence ; les instantanés passés et l'exécution en cours restent figés. Une nouvelle phase peut rendre un exercice incomplet : conserver le signalement existant avant lancement.
- Le groupe de niveaux est une classification ; il n'est pas l'identité de regroupement des records. Le rang est dérivé et n'est jamais stocké dans les relevés.
- Aucun rapprochement automatique, fusion rétroactive ni reconstitution d'identité par le nom. La suppression du dernier exercice ne supprime pas son mouvement.

## 3. Parcours et règles de saisie

### Création indépendante et recherche

Le formulaire initial est vierge et sa pastille affiche « Niveau ». Saisir un nom déclenche les suggestions ; aucune sélection n'est implicite. Sans sélection, enregistrer crée un mouvement indépendant sans groupe, sous réserve d'un nom disponible. « Utiliser ce mouvement » reprend l'identité existante et ouvre sa fiche en lecture seule ; il ne crée pas un duplicata ni un exercice.

Conserver R01–R08 de la [spécification v7](KODJO-Niveaux-Recherche-Parcours-Regles-v7.md), dont corpus automatique R07, paramètres de classement et recherche par nom/alias. Rechercher aussi les mouvements créés localement dans une séance. Un seul résultat par identité de mouvement, même si plusieurs alias correspondent ; retenir sa meilleure correspondance. Au plus cinq résultats dans le panneau et pas de réordonnancement pendant un appui. Entrée valide la saisie, sans sélectionner un résultat ni enregistrer la fiche.

Nom unique après normalisation des espaces, casse et accents : contrôle pendant la saisie et à l'enregistrement, en excluant l'identité éditée. La normalisation de recherche n'autorise pas à fusionner des noms. Les alias peuvent être partagés. L'erreur indique « Ce nom est déjà utilisé. Reprenez ce mouvement ou choisissez un autre nom. » et conserve le brouillon.

### Variante et niveau

### Résultats de recherche des Mouvements — rendu PRE-9

**Référence finale active :** [Résultats de recherche des Mouvements — PRE-9](KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md), contrat CE-MVT-RESULT-01. La **carte Résultat** du parcours « Créer un Mouvement » conserve « Ajouter un niveau » à droite (66 × 32 pt à x264, deux lignes), description 179 pt et zone tactile 78 × 36 pt à x258/y31 ; **aucun bouton Utiliser** sur ces cartes. La **carte Composition** du parcours « Créer un Exercice » n'a aucun bouton (338 × 73 pt, description 253 pt tronquée à deux lignes avec « … »), dans tous ses emplois. Les familles conservent leur filet bleu x3, largeur 2 pt, de centre à centre des cartes affichées. L'état « Niveau, plus facile ou plus difficile » utilise un cadre unique 338 × 104 pt et une quatrième ligne « Plus facile | Plus difficile », sans « Utiliser ce mouvement », deuxième cadre ni symboles d'arbre. Les conditions métier de création et le choix de sens demeurent ceux déjà validés.

### Ajouter un niveau — glissé du catalogue et résultats proches (27/10/2026)

Le libellé utilisateur **Ajouter un niveau** remplace **Créer une variante** dans les actions du catalogue des mouvements et dans les cartes de résultats. L'opération reste la création d'un mouvement distinct dans la même famille ; aucun changement d'identité ou de filiation de la source. La décision ne crée pas une quatrième action glissée.

| Entrée | Choix du sens | Destination |
| --- | --- | --- |
| Catalogue : glissé sur un mouvement → Ajouter un niveau | Deux boutons **Plus facile ↓** et **Plus difficile ↑** se déploient sous les trois actions, dans la liste, sans navigation | Après choix, formulaire du nouveau niveau `10415:21980`, directement |
| Liste des mouvements proches : Ajouter un niveau | État `10415:21939`, désormais nommé « Mouvement — Niveau, plus facile ou plus difficile » ; le choix Utiliser ce mouvement reste pertinent dans cette origine | Formulaire du nouveau niveau après choix du sens |
| Menu Niveau de la fiche | Ajouter un niveau → Plus facile / Plus difficile, selon D-448 point 9 | Formulaire du nouveau niveau |

Dans le catalogue, les trois actions restent **Partager / Ajouter un niveau / Archiver**. L'ouverture du choix est un état de la carte, pas un écran de navigation : ne pas router vers `10415:21939`, ne pas ajouter de barre de retour ou de commande Utiliser ce mouvement à cette étape. Les cartes suivantes descendent pour libérer l'espace nécessaire ; le filet de la famille s'allonge d'autant. Aucun recouvrement, aucun changement d'ordre ou de rang. Refermer le choix restitue la disposition sans créer de mouvement.

Plus facile signifie insertion avant la source dans l'ordre de difficulté ; Plus difficile signifie après. Les flèches décrivent la difficulté, pas une position de dépose dans la liste (qui peut présenter le niveau le plus élevé en premier). La sélection du sens prépare le brouillon ; seul l'enregistrement crée le nouveau niveau. Préremplissage, nom unique, annulation et sauvegarde directe restent ceux de CE-MVT-01. La création de niveau depuis une séance n'est pas réintroduite.

Nouvel état : **Mouvement — Catalogue — Ajouter un niveau**, `10579:21580`, après Actions glissées `10475:47634`. Le relevé du 27/10 comptait 12 états ; celui du 28/10 en compte 13 avec la création d’une famille. Le lot du 27/10 comporte 12 états, dont ces deux états intégrés au présent dossier ; cela ne clôt pas les règles de partage ou d'archivage. La livraison ciblée inclut cette entrée d'ajout de niveau, sans imposer la refonte complète du catalogue.

Le relevé utilisateur signale huit libellés visibles et seize noms de calques renommés. Le relevé direct et les captures actualisées sont conservés dans `figma-mouvements-2026-10-27/ajout-niveau-glisse.json`. « Variante » reste un terme explicatif du modèle, pas le libellé de l'action. La frame `10415:21939` conserve actuellement « Moins difficile » dans son contenu : cela signifie Plus facile et ne justifie pas une troisième direction.


Depuis un résultat du catalogue ou « Ajouter un niveau », choisir une variante plus facile/moins difficile, puis ouvrir un formulaire vierge : reprendre uniquement catégorie, zones corporelles et nom commencé ; description, médias et phases restent à saisir. L'invite grise « (compléter le nom) » disparaît à la reprise de saisie et ne fait jamais partie du nom enregistré. Le nom final doit rester unique.

La variante reçoit une nouvelle identité et s'insère avant/après le mouvement de référence selon la difficulté choisie. Si la source n'avait aucun niveau, créer le groupe au deuxième membre ; les deux rangs sont alors dérivés. Les exercices qui référencent ces mouvements affichent la classification actuelle sans réécriture des instantanés. Annuler ne laisse ni mouvement ni groupe provisoire. L'enregistrement d'une variante explicitement choisie ne demande pas une seconde confirmation de correction.

« Changer de niveau » dans cette fiche permet de consulter un autre mouvement de la famille ; ce n'est pas le reclassement du mouvement courant. Préserver la protection du brouillon avant de quitter une fiche modifiée. Le réordonnancement reste un autre parcours, hors lot.

### Consultation et modification

Depuis le catalogue, la fiche consultée permet le passage explicite en édition par le crayon. Depuis une séance, le mouvement repris reste en lecture seule : pas de crayon ni de création de variante dans ce contexte. Cette restriction remplace C04/v7 sur ce point seulement ; elle ne verrouille pas les paramètres locaux de l'exercice.

Le verrouillage depuis une séance concerne uniquement un mouvement existant ou repris. Lors de la création d'un nouvel exercice, le mouvement nouveau reste éditable tant qu'il n'est pas enregistré ; choisir un mouvement existant fait passer son contenu en lecture seule. La création de variante depuis une séance reste exclue de ce parcours cible.

La photo occupe toute la largeur, derrière le contexte ; description puis phases suivent. Aucun accordéon Médias en bas et aucune carte Paramètres. L'invite d'étape suivante apparaît seulement lorsque le champ de description est actif. Une description au repos s'arrête à sa dernière étape. Le bloc média adopte uniquement l'emplacement et les dimensions du nouveau gabarit Figma. Tous les comportements existants sont conservés : ajout/import, consultation/lecture, retrait et réordonnancement. La disparition de l'accordéon inférieur ne supprime aucune de ces commandes et n'introduit aucun nouveau parcours. Aucun écran ni arbitrage média supplémentaire n'est un prérequis de PRE-8. Les parcours de gestion des catégories/zones restent inchangés ; retirer une catégorie ou zone des propositions ne retire pas les valeurs déjà affectées.

### Sauvegarde — application de C03 depuis le catalogue

| Condition | Résultat |
| --- | --- |
| Nouveau mouvement indépendant ou variante explicitement choisie | Création directe après validation ; pas de dialogue de correction |
| Mouvement existant, nom modifié | Toujours proposer Mettre à jour / Créer un nouveau mouvement / Annuler, sans présélection, même avec zéro exercice et zéro exécution |
| Nom inchangé, contenu modifié, au moins un exercice lié ou une exécution passée | Confirmer la mise à jour / Annuler |
| Nom inchangé, contenu modifié, aucun exercice lié et aucune exécution passée | Mise à jour silencieuse de la même identité |
| Aucun changement | Aucune écriture ni dialogue de portée |

Dans le catalogue autonome, aucun exercice n'est l'objet édité : compter tous les exercices liés une seule fois, sans multiplier séries, tours ou planifications. L'existence d'exécutions se vérifie par identité, indépendamment de ce compteur. Afficher le nombre réel ; si seul l'historique existe, expliquer que l'identité est conservée sans annoncer une modification des exécutions passées.

Mettre à jour conserve l'identité. Créer un nouveau mouvement conserve l'original et crée une entrée indépendante ; depuis le catalogue, aucun exercice n'est réaffecté. Pas de rattachement automatique à la famille de l'original (arbitrage Q10 de v7). Annuler revient au brouillon sans écriture. Le choix doit être explicite avant confirmation ; un renommage en doublon reste interdit.

### Clarifications de clôture — 27/10/2026

Le rang est calculé dans la famille complète, avant filtrage de la vue. Filtrer ne reclasse pas les mouvements. Retirer ou supprimer un membre peut modifier le rang et le total affichés des autres (MFN-05), sans changer leur identité, leur contenu ou leurs instantanés. Ne pas appliquer la formule erronée « supprimer un membre ne modifie jamais le rang des autres ». Le traitement de l'archivage reste à décider dans son lot : il n'est pas assimilé ici à une suppression. [décidé par Hermann le 27/10/2026 (Q5) : un membre archivé conserve son appartenance et sa position dans la famille ; l'archivage ne recalcule aucun rang ; les rangs affichés restent ceux de la famille complète, membres archivés compris, quel que soit le filtre] [Rangs remplacés par b8-3, confirmé le 28/10/2026 (ch07) : les rangs affichés des actifs sont recalculés sur les seuls actifs ; un archivé garde son rang dans la famille complète ; appartenance et position inchangées]

Dans le menu Niveau d'un exercice, un changement effectif de mouvement conserve les durées locales des phases de rang commun ; les durées manquantes restent vides, sans valeur inventée ni remise à vide générale. Les autres paramètres sont conservés selon les règles existantes. Une correction du même mouvement conserve les durées par identité stable de phase. Dans la cible D-449, aucun Exercice autonome du Catalogue n'est à sélectionner pour fournir des durées : ne pas recréer cet objet ni déduire des durées par défaut du mouvement. Cette clarification de D-448 ne fait pas entrer la refonte des paramètres dans le lot PRE-8.

La revue du document de clôture ne valide pas ses décisions A à D (formats, nombre de séries imposé, archivage et partage), qui restent hors de ce lot. La distinction entre troncature et réserve de séries est rappelée au chapitre 10 ; elle ne change pas le fonctionnement des circuits.

## 4. Contrat, captures et design system

Contrats normatifs **CE-MVT-01** et **CE-MVT-02**, chapitre 13 ; inventaire/captures, chapitre 06 ; composants et correspondances tokens, chapitre 12. Les 25 états sont conservés comme preuves visuelles, sans devenir 25 écrans de navigation à implémenter.

Relevés : [écrans et textes](figma-mouvements-2026-10-27/ecrans.json), [composants et tokens de la fiche](figma-mouvements-2026-10-27/composants-tokens.json), [manifeste des captures](figma-mouvements-2026-10-27/captures.json).

## 5. Écarts du prototype à ne pas transcrire en règles

| Référence | Écart constaté | Consigne documentaire |
| --- | --- | --- |
| `10415:22524`, `10415:22566`, `10415:22786` | « Uniquement pour cet exercice » dans une sauvegarde du catalogue Mouvement | Libellé à adapter à une création indépendante ; aucun exercice n'est réaffecté. Figma n'a pas été modifié par ce report. |
| `10415:22524`, `10415:22786` | Confirmer absent avant sélection | Conserver la règle de sauvegarde existante : confirmation visible mais indisponible avant choix. |
| `10453:23030` | Texte Niveau 3 mais instance d'icône relevée `Niveau=1` (`9925:41235`) | Choisir la variante correspondant au rang réel ; ne pas figer l'instance de démonstration. |
| États de saisie portant « Niveau 1 » avant rattachement | Valeur de démonstration héritée | Mouvement indépendant : « Niveau », sans rang ; ne pas créer implicitement un groupe. |
| Fiche/sauvegarde montrant Terminer grisé et compteur « 2 autres exercices » | États statiques | Activation et nombre dépendent du brouillon valide et des relations effectives. |
| Planche `10419:23030` | Plusieurs traitements d'icônes et trois rangs d'exemple | Planche de comparaison, pas un choix de style supplémentaire dans l'application ; utiliser les composants de la fiche et le rang réel. |
| 25 états | Aucun état spécifique de saisie des alias ni d'erreur de persistance | Les alias et erreurs existants ne sont pas supprimés. Réutiliser les contrôles/patterns livrés ; aucun nouveau layout de ces états n'est prétendu validé par Figma. |

## 6. Recette du lot

| Cas | Résultat attendu |
| --- | --- |
| MVT-01 — créer puis rouvrir | Identité persistée, contenu retrouvé, aucun exercice créé, pastille Niveau |
| MVT-02 — doublon | Erreur pendant la saisie et à l'enregistrement, y compris doublon concurrent ; identité courante exclue en édition |
| MVT-03 — recherche R07 | Corpus automatique existant complet, noms/alias, dédoublonnage, mouvements locaux, aucun rattachement implicite |
| MVT-04 — reprise | Même identité, lecture seule puis crayon depuis catalogue ; aucun duplicata |
| MVT-05 — variante inférieure/supérieure | Nouvelle identité, contenu vierge sauf données reprises, invite non persistée, rangs dérivés, annulation sans résidu |
| MVT-06 — sauvegarde | Toutes les branches de la table C03, notamment renommage sans usage et historique seul |
| MVT-07 — nouveau mouvement depuis catalogue | Original et exercices liés inchangés, nouvelle entrée indépendante, pas de groupe implicite |
| MVT-08 — correction partagée | Contenu courant actualisé, paramètres locaux conservés, instantanés/exécution en cours inchangés |
| MVT-09 — phases | Identités stables au déplacement, nouvelle phase sans durée inventée ; aucune durée ni cible de série sur la fiche |
| MVT-10 — brouillon et erreur | Annulation de dialogue conserve la saisie ; abandon confirmé ne persiste rien ; erreur d'enregistrement conserve les valeurs pour réessayer |
| MVT-12 — ajout de niveau dans le glissé | Déploiement sans navigation ; boutons et flèches ; cartes suivantes décalées et filet allongé ; Plus facile/difficile ouvre directement le formulaire ; fermeture sans création ; entrée depuis résultats proches conservée |
| MVT-11 — UI | Photo/contexte, description/phases, clavier, scroll, safe areas, titres/pastilles et accessibilité conformes au contrat ; ajout/consultation/retrait/réordonnancement des médias inchangés |

Exécuter les tests automatiques pertinents existants et étendre leur couverture au nouveau parcours ; ne pas recréer les algorithmes de recherche ou le modèle de mouvement. La revue documentaire ne constitue pas une recette du produit. Aucune migration de données historiques n'est exigée pour cette refonte, conformément à l'autorisation de repartir d'une base vierge ; ne pas réinitialiser une base pendant une simple mise à jour documentaire.
