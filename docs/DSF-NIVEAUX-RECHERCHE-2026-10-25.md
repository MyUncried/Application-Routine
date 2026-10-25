# Niveaux et recherche — intégration documentaire du 25 octobre 2026

## Sources et statut

Sources : [spécification v6 reçue](KODJO-Niveaux-Recherche-Parcours-Regles-v6.md), [relevé Figma transmis](figma-niveaux-2026-10-25/releve-utilisateur.md), inspection en lecture seule du fichier `G6RY5Ebhgwb4AHIOYDwwvg`, pages Prototype MVP, Design system — Fondations et Expérience PRE-4.

La v6 remplace la v5 pour les niveaux, la recherche, les alias, la reprise des paramètres et la classification actuelle. Les changements visuels explicites sont intégrés. Les changements fonctionnels contradictoires du relevé sont identifiés ci-dessous, sans les faire passer pour des décisions rendues. « Continue » autorise la poursuite de la documentation ; il ne sélectionne pas une réponse aux questions précédentes. D-255/D-300 et D-376 restent applicables : une maquette ne remplace pas implicitement une règle métier.

Les sources reçues sont conservées telles quelles pour la revue. Leurs anciens identifiants d’écran ne constituent pas un inventaire courant : utiliser la table ci-dessous. Les termes actuels sont **mouvement**, **exercice**, **niveau**, **paramètres d’exécution**. Les noms de fichiers historiques et les identifiants techniques restent stables.

## Écrans et correspondances

| Écran courant | Nœud Figma | Contrat / statut |
|---|---|---|
| [Création exercice — Mouvement — Mouvements proches](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9882-19049) | `9882:19049` | CE-T03-04 |
| [Création exercice — Mouvement — Nom déjà utilisé](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10175-20349) | `10175:20349` | CE-T03-04 |
| [Création exercice — Mouvement — Options d’un résultat](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10131-21995) | `10131:21995` | CE-T03-04 |
| [Création exercice — Mouvement — Repris (lecture seule)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9891-39982) | `9891:39982` | CE-T03-04 |
| [Création exercice — Mouvement — Contenu éditable](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9959-19518) | `9959:19518` | CE-T03-04 |
| [Création exercice — Mouvement — Variante, plus ou moins difficile](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10140-20180) | `10140:20180` | CE-T03-04 |
| [Création exercice — Mouvement — Variante, formulaire vierge](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10187-20340) | `10187:20340` | CE-T03-04 |
| [Création exercice — Mouvement — Sauvegarde — Nom inchangé](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10253-20414) | `10253:20414` | CE-T03-04 |
| [Création exercice — Mouvement — Sauvegarde — Nom modifié](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9952-44349) | `9952:44349` | CE-T03-04 |
| [Création exercice — Mouvement — Sauvegarde — Choix sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10257-20651) | `10257:20651` | CE-T03-04 |
| [Création activité — Paramètres — Résumé affiché — Niveau (pastilles) — Popover](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10027-40760) | `10027:40760` | CE-UI-NIV-01 |
| [Création activité — Niveau — Changer de niveau (déployé)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10152-20245) | `10152:20245` | CE-UI-NIV-01 |
| [Création activité — Niveau — Ajouter un niveau (déployé)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10152-20369) | `10152:20369` | CE-UI-NIV-01 |
| [Groupe de niveaux — Ordre](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10085-20050) | `10085:20050` | CE-UI-NIV-01 |
| [Composition séance — Changer de niveau — Durées à compléter](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10070-20073) | `10070:20073` | CE-T03-08 / CE-UI-10 |
| [Catalogue des mouvements — Liste complète](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9959-19623) | `9959:19623` | Catalogue mouvements — proposition |
| [Catalogue des mouvements — Aucun résultat](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10070-19964) | `10070:19964` | Catalogue mouvements — proposition |
| [Catalogue — Vue Mouvements (piles)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10266-20575) | `10266:20575` | Catalogue mouvements — proposition |
| [Niveau — icônes, trois états](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10027-40948) | `10027:40948` | CE-UI-NIV-01 |

L’ancienne recherche `9959:19623` est désormais intitulée **Catalogue des mouvements — Liste complète**. Elle n’est plus une preuve du sélecteur de création décrit par R03/R04. L’ancien popover `9577:19843` est remplacé comme référence courante par `10027:40760`, puis ses déploiements `10152:20245` et `10152:20369`. `9952:44349` est maintenant un dialogue centré, plus une feuille basse.

Les captures courantes sont réunies au chapitre 06. Les captures antérieures demeurent dans Git et ne sont pas retouchées pour masquer un écart. Le [manifeste des captures](figma-niveaux-2026-10-25/captures.json) contient nœud, fichier et empreinte SHA-256. Le [relevé des composants](figma-niveaux-2026-10-25/releve-composants.json) conserve les liaisons observées.

## Parcours représentés

### Saisie et rapprochement

Le panneau se superpose sous le nom, clavier visible. Chaque carte porte **Utiliser ce mouvement** et **Créer une variante**, sans choix radio ni action globale de sélection. Entrée valide la saisie et poursuit le formulaire ; elle ne sélectionne jamais un résultat et ne sauvegarde pas à elle seule l’exercice. Cinq résultats au maximum dans le panneau ; ne pas les réordonner pendant un appui. Le dédoublonnage reste par identifiant de mouvement, sur la meilleure correspondance entre nom et alias. Les mouvements créés dans une séance restent recherchables sans devenir des exercices Catalogue.

R03 conserve l’accès explicite à une recherche préremplie, effaçable, et l’action Voir tous les mouvements en cas de résultat vide. L’écran du catalogue ne remplace pas cette fonction. Sa représentation courante est manquante. Les seuils et le corpus automatisé R07 demeurent obligatoires ; aucune modification arbitraire des coefficients n’est introduite par le panneau.

### Reprise et variante

La reprise verrouille initialement le contenu partagé ; les paramètres restent modifiables. Le crayon permet d’éditer le contenu dans le brouillon, avec son état actif blanc / bleu pendant l’édition. Une variante est accessible depuis chaque résultat et depuis Ajouter un niveau. Le choix plus facile / plus difficile place le nouveau membre avant / après l’origine ; la première variante crée le groupe de deux membres. Aucun rang zéro, aucun classement automatique, aucun plafond de trois ou cinq niveaux.

La variante explicite ne redemande pas s’il faut corriger l’origine. Le relevé dessine ensuite un formulaire vierge, un nom conservé ou une invite grise « (compléter le nom) », et désactive la similarité ; les divergences d’héritage et d’unicité sont C01/C02. L’invite est une aide de saisie, jamais un suffixe à persister dans le nom.

### Sauvegarde

Le dialogue est centré : largeur 354 sur écran 402, titre 18, message 14 ; boutons latéraux 147 dans les états à deux boutons. Nom modifié : deux cartes radio avec conséquence explicite et aucune présélection ; Annuler reste disponible ; Confirmer doit rester visible mais inactif avant choix. Nom inchangé : la maquette ne propose que la mise à jour. Le nombre d’autres exercices est une donnée calculée, jamais la constante « 2 ».

Les conditions fonctionnelles de déclenchement restent celles de MFN-08 / v6 tant que C03 n’est pas tranché. Les paramètres seuls et le reclassement seuls ne déclenchent aucun dialogue. Annuler conserve le brouillon, sans écriture ni nouvelle identité. Une correction commune ne doit pas être déduite de la simple validation du nom.

### Niveaux et composition

Le popover comporte Changer de niveau, Ajouter un niveau, Réordonner les niveaux. Les deux premiers se déploient sur place, chevron droite puis bas. Le réordonnancement montre rang fixe à gauche, image, nom et description tronquée sur deux lignes. La classification est lue au moment de l’affichage ; les copies conservent leur contenu.

Dans une séance, changer de niveau remplace l’occurrence dans le brouillon par une nouvelle occurrence et conserve les paramètres indépendants du mouvement. Les durées de phases se transfèrent **par rang**, jamais par égalité d’identifiants de deux mouvements. Sans→sans : durée reprise ; sans→phases : durées vides ; phases→sans : somme ; phases→phases : rangs communs repris, surplus source abandonné, surplus cible à compléter. Annuler restaure intégralement l’occurrence précédente. Aucun exercice Catalogue n’est créé par ce remplacement.

La commande vide affiche **Niveau**, sans « Aucun », sans rang. Le groupe singleton a le même affichage. Les cartes informatives sans niveau n’ajoutent aucun libellé. L’historique conserve contenu et relevés exécutés, sans rang stocké ; une présentation peut résoudre la classification actuelle séparément. La vue compacte `1992:8996` reste sans rang.

## Composants et tokens vérifiés

| Élément | Référence réelle | Observation / contrat |
|---|---|---|
| Carte — Mouvement | `10124:21979` | Component set, Sélection = Absente / Vide / Cochée ; chaque variante 322 × 80, instances extensibles à 354 |
| Carte — Mouvement — Résultat | `10199:22268` | Composant distinct 338 × 107 ; actions internes ; photo observée 57 × 57. Ne pas lui imposer les 80 pt de la carte simple |
| icon/modifier | `9925:41240` | Composant 24 × 24 ; crayon plein bleu sur les nouveaux écrans, état actif sur pastille blanche ; dimensions visuelles distinctes de la cible tactile |
| icon/niveau | `9932:44044` | Trois variantes 1 / 2 / 3, 24 × 24 ; ne couvre pas encore explicitement tous les rangs |
| Sélecteur classification | `9003:15638` | Rôle Catégorie / Zone / Niveau ; Niveau vide `9925:41506`, renseigné `9925:41515` |
| Zone bleue — Nom et média | `9029:18368` | Rangée `9029:18363`, Catégorie / Zones / Niveau, gap 12, marges 6, zones élastiques tronquées |
| Dialogues de sauvegarde | frames `10253:20414`, `9952:44349`, `10257:20651` | États d’un même dialogue ; aucune preuve d’un nouveau composant partagé à inventer |

**Liaisons de variables constatées :** fond des deux cartes → `VariableID:2290:56` ; contour → `color/cards/border` (`VariableID:6364:10579`, alias `VariableID:5541:4453`). Sélection radio cochée → `color/primary` (`VariableID:2290:51`, alias bleu `VariableID:2290:2`, `#0508E5`). Les textes Nom / Description / Niveau des nouvelles cartes ont un `textStyleId` vide et aucune liaison de variable de police dans le relevé. Tailles observées : 15 / 12 / 12 ; actions de résultat 13. Ne pas annoncer de styles ou de tokens liés là où ils ne le sont pas.

**Valeurs de rendu du relevé, pas nouveaux tokens inventés :** carte simple repliée 80, photo 64 avec marges 8 et texte x84 ; icônes de ligne 14 sans cercle ; inactif de jauge 28 % ; dialogue 354, titre 18, message 14, boutons 147. Le composant Résultat fait exception au gabarit simple. Les tokens existants `component/card/height`, `component/cards/media-size`, `color/cards/value-icon`, `color/cards/nature-icon`, `color/text-primary`, `color/text-secondary` doivent être rapprochés des valeurs observées au chapitre 12 ; leur présence ne prouve ni leur mise à jour ni une liaison sur chaque instance.

**Règles transverses de cartes :** bilatéralité après les zones corporelles en deuxième ligne ; sablier fixe dans une réserve dimensionnée sur la durée la plus longue de la liste, durée accolée ; même alignement pour horloge / heure du calendrier semaine, sans point médian avant l’horloge. Préserver les gabarits sans photo des séances et listes mixtes : le changement de hauteur n’ajoute pas de média à ces cartes. Les variantes dépliées conservent une hauteur adaptée au contenu. Les cibles tactiles existantes ≥44, ou 48 lorsqu’elles sont spécifiées, restent distinctes du glyphe 14 ou du bouton visible 26.

## Contradictions des sources — à trancher explicitement

| ID | V6 / règle en vigueur | Relevé Figma reçu | Incidence documentaire / technique |
|---|---|---|---|
| C01 | N08 et §6 autorisent noms identiques et variante sans différence décrite | Nom canonique unique, refus dès la frappe | Ne pas instaurer une contrainte unique DB ni supprimer Créer quand même sans décision. Distinguer normalisation d’unicité et score de proximité ; le périmètre des alias reste à préciser |
| C02 | §5 : adapter le contenu repris ; catégorie commune des niveaux dans MFN | Variante entièrement vierge, catégorie non héritée | Préciser contenu initial et validation de catégorie avant d’écrire le service de création |
| C03 | MFN-08 / §5 : usage durable + contenu modifié, y compris une seule définition déjà exécutée | Dialogue seulement à partir de deux exercices ; choix distinct impossible à nom inchangé | Risque de changer silencieusement l’identité d’un mouvement utilisé. Définir aussi si le comptage inclut copies de séance et exercices archivés |
| C04 | §7/8 : copie indépendante, contenu verrouillé | Crayon présent depuis une séance, avec édition du mouvement | Définir si le crayon vise la source partagée ou une nouvelle copie ; ne pas modifier silencieusement la filiation immuable |
| C05 | §10 : instantané figé, classification actuelle résolue séparément | Historique présenté comme arbitrage ouvert ; propagation aux exercices présents/futurs | Règle v6 conservée en attendant décision ; distinguer définitions Catalogue, copies de séances et instantanés |
| C06 | §9 : jauge + 2/3 sur cartes, Niveau 2 sur 3 dans les lignes de contexte | Nom suffixé - N2 sans pastille, Niveau N avec pastille | Rendu récent documenté ; total et accessibilité à harmoniser. Ne jamais persister le suffixe dans le nom |
| C07 | R03 : sélecteur de recherche ; R06 : pas de champ Catalogue réalisé | Catalogue mouvements et proposition de quatrième segment avec piles/recherche | Présence Figma attestée, périmètre MVP non confirmé. Ne pas transformer la proposition en route obligatoire |
| C08 | N03 décrit retrait de groupe ; rattachement explicite possible | Rattacher/détacher/supprimer hors MVP, non dessinés | Les invariants restent valables ; les parcours de maintenance ne sont pas déclarés livrés |
| C09 | §5 : référentiels modifiables directement, crayon réservé au contenu | Catégorie, zones et niveau inclus dans le verrouillage du crayon | La commande Niveau doit néanmoins rester accessible à un mouvement vierge et au changement de niveau en séance ; préciser les portées |

## Écarts entre relevé et maquette / travail manquant

- `9952:44349` : Confirmer est absent visuellement avant choix et Annuler occupe la largeur ; le relevé demande les deux boutons, Confirmer désactivé. `10257:20651` montre l’état après choix.
- `9882:19049` conserve un « Niveau 1 » dans son contexte alors qu’aucun mouvement n’est encore choisi ; N01 exige l’état vide. Le panneau le masque partiellement, cela ne valide pas ce niveau.
- `10070:20073`, Durées à compléter : les trois durées visibles sont déjà renseignées. Cette capture établit le parcours et son titre, pas l’état de champs manquants ni le blocage de validation.
- `10085:20050` : rangs, médias et descriptions présents ; les libellés Plus facile / Plus difficile sont visibles, contrairement au texte v6 qui les juge inutiles. Le nombre d’exercices et les actions accessibles de réordonnancement restent à vérifier/compléter.
- Le catalogue `10070:19964` est nommé Aucun résultat : ce n’est pas une preuve d’un catalogue initial vide. Le parcours de recherche explicite R03, le message d’origine locale, les zones et les comptes de R04 ne sont pas établis par les seules nouvelles cartes.
- La saisie/édition des alias, les erreurs d’enregistrement, le conflit concurrent d’unicité si C01 est adopté, le choix parmi plusieurs exercices d’un niveau, les frères incomplets après correction et la recherche multi-sélection avec filtres restent à couvrir explicitement.
- Jauge générique : seuil « au-delà de cinq, peut-être dès trois » non décidé, aucun plafond métier à en déduire. L’état vide reste Niveau. Le texte accessible doit porter le rang réel et le total, sans interpréter les trois tranches comme une borne.
- Catalogue en piles : navigation depuis une pile, entretien d’un mouvement sans exercice Catalogue et effet de la recherche sur l’affichage restent à spécifier si le périmètre est adopté.
- Aucune fusion rétroactive : un doublon de mouvement créé indépendamment conserve des statistiques séparées. La recherche est le filet préventif, pas un mécanisme de réparation.

## Couverture et vérification

Chapitre 06 : galerie et références courantes ; 12 : inventaire de composants/tokens et gabarits ; 13 : éditeur, sélection, composition, calendrier, catalogues et contrat Niveaux. Les chapitres 03/04/05/07/08/09/10/11 et PRODUCT/INDEX tracent la portée fonctionnelle et les réserves. La matrice de traçabilité relie règles, états et recettes.

La recette automatisée R07 reste requise pour toute évolution de recherche. Ajouter les scénarios Entrée sans sélection, résultat dédupliqué par mouvement, maintien des sélections filtrées, absence de réordonnancement sous appui, variante sans dialogue de correction, annulation sans résidu, transfert des quatre cas de phases, historique inchangé et classification recalculée. Les tests dépendant de C01–C09 doivent citer l’arbitrage retenu, pas choisir une règle par défaut.

Mission documentaire : aucun code produit, aucune donnée, aucune maquette modifiés ; pas de migration, conformément à la base vierge autorisée. Vérification des PNG, empreintes, liens locaux introduits et structure des contrats. Cette vérification ne vaut pas recette applicative.

## Limite effective des exports

97 captures PNG ont été récupérées et vérifiées, dont tous les nouveaux écrans et composants. Le connecteur Figma a ensuite refusé les appels avec le message « You've reached the Figma MCP tool call limit for your Full seat on the Professional plan ». 43 références secondaires documentaires n’ont pas pu être réexportées ; elles sont conservées et listées au chapitre 06 et dans le manifeste. Aucune image ancienne n’est présentée comme un export du 25/10. Cette limite empêche de déclarer le rafraîchissement visuel entièrement terminé.
