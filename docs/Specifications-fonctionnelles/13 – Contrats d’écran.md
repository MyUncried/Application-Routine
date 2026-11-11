# Contrats d’écran

### Plan de raccordement écran — Profil Bibliothèques (11/11/2026)

**Étape 3 :** spécifier dans Figma l'écran de gestion des sources/Bibliothèques, l'import, la provenance, les versions, l'installation et la mise à jour volontaire ; les services de catalogue CA-3 (étape 4) sont indépendants du rendu. **Étape 6 :** raccorder l'écran Profil aux services puis contrôler le chargement des 60 Mouvements et la conservation de leurs références. **Aucun second éditeur de Mouvement dans Profil** : le Catalogue conserve création/édition courantes, l'administration Web l'édition complète de la fiche source. Référence Figma vérifiée : [`1992:778`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-778). La commande « Mettre à jour » de Pilates y est visible ; l'état des entrées personnelles/partagées avant développement reste **À CLARIFIER**. Un fichier catalogue autonome importé dans la recette est distinct d'une Bibliothèque choisie par l'utilisateur. Valeurs « 14 mouvements » et « 8 mouvements » : exemples affichés, non règles de cardinalité.

### Contrôle Figma du 10/11/2026 — Profil et Bibliothèques

**Évidence directe :** page Prototype MVP `510:101`, écran [P-Profil — Modifier le profil — MVP, `1992:778`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-778). L'écran représente « Bibliothèques » avec « Mes bibliothèques » (« Celles que je crée et rends disponibles »), « Bibliothèques partagées » (« Celles que je peux importer »), puis « Bibliothèques installées » : Fitness (« 14 mouvements · à jour ») et Pilates (« 8 mouvements », action « Mettre à jour »). L'écran « Profil — Préférences » `1992:684` est distinct.

**Confrontation avec BIB-19 à BIB-23 :** les états installés et l'action « Mettre à jour » illustrent le premier lot. Les entrées « Mes bibliothèques » et « Bibliothèques partagées » et leurs sous-titres évoquent des capacités **reportées** (création et publication personnelles, partage et import depuis des tiers). Leur présence graphique dans Figma **ne réintègre pas ces fonctions au premier lot**. Le fonctionnement de ces entrées avant livraison des fonctions futures (masquées, désactivées, ou autre) reste **À CLARIFIER** ; ne pas déduire de comportement des seuls libellés. Les quantités 14 et 8 sont des valeurs illustratives d'écran, non des cardinalités métier.

**État :** Figma contrôlé en lecture, non modifié dans cette opération. Contrat fonctionnel en cours de convergence ; pas de déclaration de conformité UX complète.


## Contrat cible — Profil / Gestion des Bibliothèques (BIB-19 à BIB-23)

Le Profil doit proposer un parcours de gestion des Bibliothèques permettant de découvrir, sélectionner et installer les Bibliothèques génériques KODJO et déclencher volontairement « Mettre à jour » lorsqu'une nouvelle révision est proposée. Le bloc « Mes données » (Mouvements, Séances, Programmes) est supprimé du Profil : ces contenus sont accessibles depuis le Catalogue. Les contenus des Bibliothèques publiées ne sont pas éditables directement. **Contrat fonctionnel cible, pas contrat graphique Figma validé** ; affichages, confirmations, désinstallation et erreurs restent à préciser avant développement. La création de Bibliothèques personnelles, les Bibliothèques de coachs et le partage sont reportés. Voir BIB-19 à BIB-23.


<a id="recuperation-exercice-et-defauts-profil"></a>

## Récupération de l’Exercice et défauts du Profil

La Récupération après exercice appartient directement à l’Exercice dans le modèle cible de Séance. La ligne Récupération de la modale Paramètres d’exécution est son unique accès de saisie et de modification ; la Composition affiche exactement cette même valeur, sans objet Récupération autonome ni valeur concurrente. Le bouton Pause / Ajouter un arrêt ne propose que les Points d’arrêt : aucun ajout, réglage ou retrait de récupération par Placement.

À la création d’un nouvel Exercice, sa Récupération reprend « Récupération après un exercice » du Profil ; 30 s n’est pas une constante. Modifier un Exercice conserve sa valeur ; un ancien Exercice sans récupération affiche 0 s sans recevoir le défaut du Profil. Déplacement et duplication conservent la récupération de l’Exercice. À 0 s, aucune récupération n’est exécutée ; les règles existantes de Pause terminale, d’ordre avant Point d’arrêt et de répétition dans un Circuit restent applicables. Les anciens instantanés, exécutions et données historiques restent lisibles sans réécriture ; la règle historique « aucune récupération post-exercice en ACTIVITY » reste limitée à cet ancien parcours, sans réintroduire un Exercice autonome dans la cible.

Toute valeur initialisée depuis un défaut du Profil est présentée dans son cadre à fond orange dans Paramètres d’exécution jusqu’au premier ✓ validant les paramètres de cet Exercice. La règle est générale : elle vise chaque défaut du Profil effectivement repris, pas seulement Récupération. Ouvrir ou fermer la feuille ne vaut pas validation ; ✕ annule les changements et conserve l’état antérieur. ✓ applique les valeurs et leur état validé au brouillon parent ; une réouverture après ce ✓ utilise le rendu normal. La sauvegarde définitive reste celle de la Séance ; abandonner le brouillon restaure l’état enregistré. Changer ultérieurement le Profil ne réinitialise pas les paramètres d’un Exercice existant. Les constantes imposées par un Format ne sont pas des défauts Profil. Le fond orange n’altère ni la valeur ni les règles de calcul, ni les couleurs du texte éditable/verrouillé.

## CE-CAT-CTX-01 — Zones de contexte des Catalogues Mouvements et Séances

**Contrat final PRE-9 :** [spécification de développement](../KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md). Cible visuelle Figma `10266:20575`, `10465:23141`, `10495:24099` (Mouvements), `1992:9910`, `4549:6742`, `1992:10848` (Séances), page `510:101`.

**Révision du 06/11/2026 (Hermann, D-501 à D-503) :** [KODJO-Catalogues-cartes-modales-2026-11-06](../KODJO-Catalogues-cartes-modales-2026-11-06.md) §3–§4. Couleurs par catalogue `color/catalogue/{mouvements|seances|programmes}/{context|background}` ; zone de contexte opaque jusqu’à 80 % puis fondu vers le fond du catalogue, placée au-dessus de l’en-tête ; hauteur 115 inchangée. Onglets à trois emplacements fixes, sans barres verticales ; onglet sélectionné en forme (coins hauts 12, évasement inversé 10, couleur `context`), libellé Bold `color/text-primary`, autres Regular `color/text-secondary`. Ligne 1 : séparateur point médian, 8 pt de part et d’autre, 16 pt au-dessus de la rangée de boutons. Ligne 2 : champ Rechercher de 34 pt comme Filtre/Tri/Créer, rangée centrée entre la ligne 1 et le bas de la zone (22 pt), cibles 44 pt. Les positions ci-dessous sont remplacées sur ces points.

- Bande lilas « Recherche et création » pleine largeur : `y=92..207`, référence écran **402 × 874 pt**, marge latérale **16 pt**. Ligne 1 à `x=24, y=118` ; ligne 2 : champ Rechercher `x=16, y=155`, `216 × 44 pt`, placeholder « Rechercher » 15 pt, `#7A7A80`. En état filtré ou archivé, champ `107 × 44 pt`. [Remplacé le 06/11/2026 : couleur du catalogue, ligne 1 à 16 pt des boutons, champ 34 pt centré — voir révision ci-dessus.]
- Contrôles **Filtre**, **Tri**, **Créer** de **34 pt** à `y=160`, respectivement `x=260`, `306`, `352` ; chaque cible tactile mesure **44 × 44 pt** à partir de `y=155`. Titre individuel de page masqué ; conserver la navigation des Catalogues. [Remplacé le 06/11/2026 (D-503) : rangée centrée entre la première ligne et le bas de la zone, champ et boutons de 34 pt alignés, cibles de 44 pt.]
- **Mouvements** : première ligne « N familles · N mouvements », 14 pt Regular `#333333`, séparateur « · ». Les deux compteurs sont activables séparément, mutuellement exclusifs, désélectionnables au second toucher. Actif : bleu `#0508E5`, Semi Bold ou Bold ; inactif : `#333333`, Regular. Le choix se cumule avec filtres et recherche. Familles = celles ayant **au moins une carte visible** ; Mouvements = **cartes visibles** (sans inclure les membres cachés dans une pile repliée).
- **Séances** : première ligne « Un exercice N | Plusieurs N ». Les libellés conservent **exactement leur bascule existante**, actif bleu `#0508E5` et gras, inactif `#595E66` Regular ; compteurs `N` purement informatifs, 14 pt `#333333` ; séparateur « | » `#9499A8` à `x=127`. Chaque `N` est le nombre réel de Séances de la vue ; les valeurs 2/3 de Figma sont des exemples. [Remplacé le 06/11/2026 : séparateur « · » à 8 pt de part et d’autre — D-503.]
- **États filtrés/archivés** : « N résultats » bord droit `x=378`, 14 pt Regular `#333333`, nombre d'éléments **après tous les filtres et la recherche**, actualisé en direct. « 1 résultat » ; « 0 résultat » et « 2 résultats ».
- Recherche, vue et filtres s'appliquent conjointement à la même liste. Les chiffres ne sont jamais des données stockées ni des commandes, à l'exception des deux compteurs activables de Mouvements. Aucune nouvelle règle de tri, de cartes ou d'archivage.

**Critères de validation :** dimensions à 402 pt, exclusion/désélection des compteurs Mouvements, bascule Séances non régressée, calculs en listes vides/repliées/filtrées/archivées, recherche combinée, accord des résultats et absence de chevauchement tactile. Réalisation **dès PRE-9**.

## CE-MVT-RESULT-01 — Cartes de résultats de recherche des Mouvements — PRE-9

**Contrat final :** [spécification PRE-9 — résultats de recherche](../KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md). Références Figma `10415:21713`, `10415:21814`, `10415:21916`, `10415:21939` (création de Mouvement), et `9882:19049`, `10175:20349`, `10131:21995` (création d'Exercice depuis un Mouvement).

- **Carte « Mouvement — Résultat » :** description large de **179 pt**, commande **« Ajouter un niveau »** de **66 × 32 pt**, `x=264`, sur deux lignes à droite et alignée avec le bas de la description ; zone tactile **78 × 36 pt** à `x=258, y=31` dans le composant. Cette variante appartient aux résultats de **création de Mouvement** ; aucun bouton « Utiliser » n'est affiché sur ses cartes.
- **Carte « Mouvement — Composition » :** **338 × 73 pt** dans les listes de référence, **sans aucun bouton** ; description sur **253 pt**, deux lignes au maximum, tronquée par « … ». Le composant conserve ce comportement dans tous les emplois de Composition du projet.
- **Familles** : filet bleu à `x=3`, largeur **2 pt**, débutant au centre de la première carte affichée de la famille et se terminant au centre de la dernière ; applicable aux six listes concernées, sans modification du calcul des familles, rangs ou identités.
- **Choix du Niveau** : état `10415:21939`, un seul cadre **338 × 104 pt**, marges verticales 8 pt, liste de recherche **178 pt** ; carte Résultat sur trois lignes avec « Ajouter un niveau » à droite. Quatrième ligne « **Plus facile | Plus difficile** » ; « Plus facile » à `x=90,5`, largeur 64 pt, `y=68`, hauteur 28 pt ; « Plus difficile » à `x=183,5, y=68`, hauteur 28 pt. Séparateur **1,5 × 12 pt** à `x=166,5, y=74,5`. Ancienne commande « Utiliser ce mouvement », deuxième cadre et symboles d'arbre **absents** de cet état.
- **Navigation et données** : recherche existante, maximum de cinq résultats illustrés, filtres cumulables, classement/identités de Niveaux et validations de création inchangés. « Ajouter un niveau » prépare une nouvelle identité, non créée avant validation. Aucun des noms ou quantités des maquettes n'est codé en dur.

**Recette PRE-9 :** comparer les deux variantes de composants dans les écrans cités ; vérifier l'alignement, la troncature, l'absence de boutons dans la Composition, la ligne de difficulté et ses actions, le filet de familles, le clavier, le choix de niveau et l'absence de régression dans la recherche.

## CE-MVT-03 — Catalogue des mouvements : ordre et composition des familles

**Révision du 06/11/2026 (D-508) :** carte Mouvement de 72 pt, photo à 4 pt et rayon 8, fond blanc, liseré à 50 %, niveau à 12 pt du bord aligné sur la ligne de base du nom ; feuilles de pile 72 pt, blanches, même liseré et même ombre que la carte ; écran au fond et à la zone de contexte du catalogue Mouvements (D-501). [KODJO-Catalogues-cartes-modales-2026-11-06](../KODJO-Catalogues-cartes-modales-2026-11-06.md) §7.

**Complément du 06/11/2026 (D-510) :** état « fiche nouvelle ». Toute fiche créée (bouton +, Ajouter un niveau, duplication, ajout depuis la Composition) porte le badge « New » au premier affichage du catalogue qui suit ; la carte de tête d’une pile repliée porte « New ↓ » si un niveau caché sous elle est nouveau. Le badge disparaît au changement de vue par les onglets du haut ou la barre du bas, et à la fermeture de l’app ; il n’est pas enregistré. Au retour après création, la liste défile jusqu’à la fiche (ou sa pile, sans la déployer). Écran « Mouvement — Catalogue — Fiche créée » `11762:23747`. Règles complètes : [KODJO-Badge-Nouveau-catalogue-mouvements-2026-11-06](../KODJO-Badge-Nouveau-catalogue-mouvements-2026-11-06.md).

### 1. Identification

Contrat du 28/10/2026. Figma Prototype MVP `510:101` : Déplacement `10480:23374`, Création d’une famille `10797:20492`, Message de confirmation `10484:23428`. Trois captures au chapitre 06. Référence normative : [règles A à E](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), MFN-05, D-439, D-445 C08 et D-448 point 9.

### 2. Finalité fonctionnelle

Réordonner les membres, constituer une famille avec des mouvements existants, rejoindre ou quitter une famille et la dissoudre par sortie du dernier couple. Aucun nouveau mouvement n'est créé par le geste.

### 3. Contexte d'entrée

Catalogue des mouvements, carte d'un mouvement sans famille ou membre d'une famille repliée/déployée. Le tri du catalogue reste actif ; le geste ne définit pas d'ordre manuel entre entrées du catalogue.

### 4. Contexte de sortie / destinations

Rester dans le catalogue. Déposer valide l'opération ; revenir dans le filet avant relâchement annule la prévisualisation de sortie. Un mouvement libéré rejoint la position donnée par le tri. Aucun écran intermédiaire, choix de sens ou menu de retrait.

### 5. Données affichées et source de vérité

Mouvements existants, identifiant de groupe et clé de tri ; niveaux dérivés de l'ordre complet, avant filtrage [b8-3, 28/10/2026 : niveau affiché d'un actif dérivé des seuls actifs]. Pendant le déplacement, le filet, les cartes et les pastilles présentent le résultat envisagé sans écriture persistante. Au relâchement, appliquer l'opération ; Annuler restaure l'état antérieur complet.

### 6. Classification des valeurs Figma

Les noms, contenus et nombres de niveaux des cartes sont des exemples. Le filet, l'emplacement pointillé, la carte soulevée et les pastilles constituent le vocabulaire visuel. Le message observé est **Nouvelle famille de niveaux créée**, avec **Annuler**. L'ancien titre Réordonnée de `10484:23428` ne définit plus son usage.

### 7. Structure de l'écran

Shell du catalogue conservé : en-tête, onglets, recherche/filtres/tri/ajout, liste, navigation. Famille déployée reliée par un filet à gauche. Carte saisie soulevée et emplacement pointillé ; cartes voisines en reflux. Message temporaire au-dessus de la navigation après changement d'appartenance. [Emplacement pointillé : écart visuel connu dans PRE-8, accepté provisoirement par Hermann le 28/10/2026 ; la référence Figma reste le rendu attendu.]

### 8. Éléments obligatoires

Un seul indicateur d'appartenance : le filet. Les pastilles annoncent les rangs obtenus. Aucun anneau, teinte d'acceptation ou invite textuelle pendant le geste. Ni mode d'organisation, ni bouton de validation, ni action nommée de retrait/suppression de famille.

### 9. Layout déterministe

Niveau le plus élevé en haut. Longueur du filet inchangée à membres constants ; raccourcie à la sortie ; allongée à l'entrée ; naissance à la création ; disparition à la dissolution. Les cartes referment l'espace libéré ou ouvrent l'emplacement visé. Référence 402 × 874 ; filet 2 px ; message 370 × 48 à (16, 738), sans transformer ces mesures de maquette en taille de terminal imposée.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Respecter les safe areas et la navigation ; message et Annuler restent accessibles sans masquer la navigation. Adapter les cartes et le message au texte ; conserver le scroll du catalogue. [Recette iPhone du 28/10/2026, demande de Hermann : pendant le geste, la liste défile quand la carte portée approche du haut ou du bas ; la carte reste sous le doigt ; défiler n'est pas s'arrêter sur une famille repliée.] Aucun clavier ni panneau supplémentaire n'est ouvert par le geste.

### 11. États de l'écran

Les trois frames de référence suffisent au geste continu. Déplacement fixe la carte saisie et l'emplacement ; Création d’une famille fixe l'apparition du filet et les pastilles provisoires ; Message de confirmation fixe le retour structurel et Annuler. Sortie et entrée sont décrites par les règles B/C, sans exiger deux nouveaux écrans.

### 12. Contrôles et interactions

Appui long, déplacement, arrêt à l'emplacement, relâchement. Une famille repliée se déplie avant le choix de position ou à l'approche [à l'arrêt de la carte portée sur la famille, recette du 28/10/2026]. Recalculer les niveaux en direct. Pour l'ordre interne, conserver le filet et ne montrer aucun message après dépôt. Pour sortir, raccourcir le filet, refermer les cartes, recalculer les niveaux restants et retirer la pastille de la carte déplacée. La ramener dans le filet rétablit la famille avant dépôt.

### 13. Gestes

Un mouvement sans famille déposé sur une carte sans famille crée une famille ; sur un membre d'une famille existante, il la rejoint. Position au-dessus = niveau supérieur, en dessous = inférieur ; entre deux membres d'une famille de trois ou plus, le rang vient de cette position. Pas de question Plus facile / Plus difficile après dépôt. Une carte déjà membre ne peut être liée à une autre carte : aucun filet de formation ; elle doit sortir librement puis être liée lors d'un second geste. Ne pas empêcher son réordonnancement dans sa propre famille.

### 14. Validation

Relâcher applique immédiatement. Déposer au-dessus d'une famille en tête de liste est accepté ; le tri donne ensuite la position du mouvement sans famille. Sortir un des deux derniers membres dissout la famille et efface les deux appartenances. Aucun rattachement automatique, transfert silencieux ou fusion rétroactive.

### 15. Brouillon et persistance

Prévisualisation seulement pendant le geste ; aucun état provisoire persistant après relâchement. Réordonner écrit la clé du membre déplacé [sauf rééquilibrage technique exceptionnel, 28/10/2026]. Entrer/sortir écrit ou efface ensemble son groupe et sa clé ; le dernier couple implique deux mouvements. Former une famille de deux isolés exige deux appartenances. Annuler restaure toute l'opération, y compris les champs des deux membres concernés ; aucun changement des contenus ou références d'exercices.

### 16. Navigation et conservation d'état

Conserver le contexte du catalogue, ses filtres et son tri. Annuler ne crée aucune nouvelle identité. Le menu Réordonner les niveaux de D-448 point 9 et le geste d'ordre ont le même résultat. CE-MVT-02 Ajouter un niveau garde ses choix du sens, son formulaire et sa validation ; ne pas lui appliquer la sauvegarde au relâchement.

### 17. Erreurs et cas limites

Le dernier couple explicitement détaché devient deux mouvements sans groupe. Le singleton subi après archivage/suppression conserve son identifiant et son rang masqué, selon le chapitre 09. Filtrer ne recalcule pas les niveaux visibles ; archivage/restauration préserve les clés ; suppression définitive selon la règle 8 du 27/10. Un échec de persistance ne doit pas être présenté comme une réussite : conserver les mécanismes d'erreur existants, sans inventer de libellé métier.

### 18. Accessibilité

Annoncer l'identité du mouvement, son niveau dérivé et l'action Annuler ; ne pas dépendre de la couleur seule. Conserver l'accès de réordonnancement par le menu et les cibles accessibles existantes. Ne pas inventer une action nommée de retrait dans un menu. [Report du 28/10/2026, décision de Hermann : créer, rejoindre et quitter une famille avec VoiceOver sont reportés dans un lot d'accessibilité dédié en fin de MVP ; exigence différée, non supprimée.] Le retour temporaire dure les 3 secondes décidées ; aucun autre délai n'est déduit de la maquette.

### 19. Invariants et messages

Un groupe maximum ; pas de rang persisté ni plafond métier. Identités, exercices référents, `sourceMovementId`, instantanés, historique et performances séparées inchangés.

| Opération | Message après application |
| --- | --- |
| Ordre interne | Aucun |
| Création | Nouvelle famille de niveaux créée |
| Dissolution du dernier couple | Famille de niveaux supprimée |
| Sortie laissant une famille | Mouvement sorti de la famille |
| Entrée dans une famille existante | Mouvement ajouté à la famille (validé le 28/10/2026) |

Les messages d'appartenance portent Annuler, pendant 3 secondes, au-dessus de la barre de navigation. La dissolution du dernier couple utilise le message de suppression de famille, pas celui de simple sortie. E2 s'applique aussi à l'entrée dans une famille existante, mais aucun libellé d'entrée n'est fourni : ne pas en présenter un comme validé. [Tranché par Hermann le 28/10/2026 : libellé définitif **Mouvement ajouté à la famille**.]

### 20. Recette déterministe

Appliquer FAM-01 à FAM-11 de la [spécification](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md) : ordre sans message, déploiement, sortie/réintégration avant dépôt, sortie en tête et tri, création dans les deux sens, insertion entre membres, interdiction du transfert direct, dernier couple, annulation à 3 secondes, archivage/filtres et invariants. Vérifier les pastilles recalculées pendant le geste, pas seulement après sauvegarde. Ces scénarios sont à exécuter au développement ; le lot documentaire ne prétend pas les avoir exécutés.


> **C08 — actualisation du 28/10/2026.** La [composition des familles depuis le catalogue](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), règles A à E et CE-MVT-03, est désormais définie : rattacher, détacher et dissoudre une famille par geste. Les mentions antérieures « C08 différé » restent historiques pour ces opérations ; elles ne sont plus une restriction active. La suppression définitive d'un mouvement reste distincte et n'est pas clôturée par ce lot.

## CE-MVT-02 — Catalogue des mouvements : Ajouter un niveau dans le glissé

### 1. Identification

Complément validé le 27/10/2026. Actions glissées `10475:47634` ; choix du sens `10579:21580`. Références DSF `10586:45516` et `10586:45517`. Ce contrat précise l'entrée catalogue vers CE-MVT-01 ; il ne spécifie pas Partager ou Archiver.

### 2. Finalité fonctionnelle

Ajouter un niveau plus facile ou plus difficile au mouvement choisi, sans écran intermédiaire entre catalogue et formulaire du nouveau niveau.

### 3. Contexte d'entrée

Catalogue des mouvements, carte dont les actions sont révélées par glissé. Le mouvement de cette carte est l'origine de l'ajout. La liste des mouvements proches reste une entrée distincte.

### 4. Contexte de sortie / destinations

Toucher Ajouter un niveau reste dans le catalogue et déploie le choix. Toucher Plus facile ou Plus difficile ouvre directement `10415:21980` (Mouvement — Niveau, formulaire vierge), avec origine et sens choisis. Aucun passage par `10415:21939` depuis le catalogue.

### 5. Données affichées et source de vérité

Carte et famille courantes, rang dérivé, mouvement source, sens choisi. Le déploiement est un état UI sans écriture métier ; le formulaire porte ensuite le brouillon de création selon CE-MVT-01.

### 6. Classification des valeurs Figma

Partager / Ajouter un niveau / Archiver, Plus facile ↓ et Plus difficile ↑ sont les libellés de référence. Squats, rangs et contenu des cartes sont des exemples. La nouvelle frame est un état du catalogue, pas une destination de navigation distincte.

### 7. Structure de l'écran

La carte glissée révèle trois actions. Sous ces actions apparaissent deux boutons avec raccords : Plus facile à gauche, Plus difficile à droite. Les cartes suivantes descendent ; le filet de famille s'allonge dans l'espace créé.

### 8. Éléments obligatoires

Action Ajouter un niveau ; choix explicite des deux sens ; flèche bas pour Plus facile et haut pour Plus difficile ; maintien de la carte source et des cartes suivantes sans recouvrement. Aucune barre de retour ou action Utiliser ce mouvement ajoutée dans cet état du catalogue.

### 9. Layout déterministe

Composant Actions 204 × 80 et Choix du sens 204 × 56 dans la référence Figma. Intégrer l'espace réellement occupé dans la hauteur de la ligne et dans la longueur du filet, sans déplacement horizontal ou réordonnancement des cartes suivantes. Ne pas utiliser un overlay masquant la liste.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Conserver le scroll et les safe areas du catalogue. Adapter la hauteur au contenu et à la taille de texte ; les boutons, cartes suivantes et barre de navigation restent accessibles. Aucun clavier ni page supplémentaire n'est ouvert par le seul déploiement.

### 11. États de l'écran

Carte fermée ; actions glissées ; choix du sens déployé ; formulaire après choix. Replier les actions supprime le choix du sens et rétablit le layout. Ne pas inventer de nouvelle confirmation pour ouvrir/replier cet état.

### 12. Contrôles et interactions

Ajouter un niveau déploie en place. Plus facile prépare une insertion avant l'origine dans l'ordre de difficulté ; Plus difficile prépare une insertion après. Le choix ne persiste rien : validation du formulaire requise. Depuis les mouvements proches, « Ajouter un niveau » conduit à l'état `10415:21939` pour choisir « Plus facile » ou « Plus difficile » avant la création d'un nouveau Mouvement. La carte Résultat n'offre pas « Utiliser ce mouvement » (CE-MVT-RESULT-01 ; ancienne présentation du 27/10 supersédée).

### 13. Gestes

Réutiliser le glissé du catalogue et ses mécanismes de fermeture. Aucun glisser-déposer n'est requis pour choisir la difficulté. Les flèches n'indiquent pas une commande de déplacement du mouvement source.

### 14. Validation

Choisir explicitement un sens avant ouverture du formulaire. Unicité du nom, contenu requis et validation du nouveau mouvement suivent CE-MVT-01. Aucun nouveau niveau n'est créé par le simple toucher de l'action principale.

### 15. Brouillon et persistance

Déploiement purement local. Après choix, formulaire avec catégorie/zones et nom préparé selon CE-MVT-01 ; description, médias et structure des phases à saisir. Enregistrer crée l'identité et le rattachement ; abandonner ne laisse aucun résidu. Pas de dialogue de correction de la source.

### 16. Navigation et conservation d'état

Conserver le contexte du catalogue et la carte source. La fermeture du choix reste dans la liste. Le retour du formulaire suit les règles existantes de brouillon/abandon ; ne pas ajouter de détour par les mouvements proches.

### 17. Erreurs et cas limites

Mouvement sans groupe : premier ajout crée une famille de deux membres après enregistrement. Source devenue indisponible : appliquer les erreurs de service existantes sans créer de filiation de remplacement. Liste longue ou famille déployée : décaler toutes les cartes concernées sans changer leurs rangs. Filtrage ne recalcule pas le niveau.

### 18. Accessibilité

Annoncer Ajouter un niveau et l'état déployé ; boutons nommés Plus facile et Plus difficile. Les flèches sont un complément visuel, jamais l'unique indication. Réutiliser les cibles tactiles et actions accessibles du catalogue.

### 19. Invariants

Trois actions glissées, pas quatre. Source et exercices existants inchangés. Nouveau niveau = nouveau mouvement ; identité source conservée. Ni nouvelle commande de variante dans une séance, ni décision sur partage/archivage, ni changement des règles de rang ou de sauvegarde.

### 20. Recette déterministe

MVT-12 : ouvrir les actions, toucher Ajouter un niveau, vérifier absence de navigation, deux boutons/flèches, cartes descendues et filet allongé. Tester séparément chaque sens : ouverture directe du formulaire avec la bonne origine ; annulation sans création ; validation avec insertion avant/après et identité distincte. Vérifier fermeture sans résidu, renommage des actions de résultats, et maintien du parcours `10415:21939` depuis les mouvements proches seulement. Étendre les tests automatiques UI/navigation existants et comparer le rendu aux captures.

## CE-MVT-01 — Fiche, création et modification d'un mouvement

### 1. Identification

Contrat cible du lot Mouvement, 27/10/2026. Référence visuelle principale : `10453:23030`, initial `10415:21706`. Les 25 états et leurs captures sont indexés au chapitre 06 et dans `docs/figma-mouvements-2026-10-27/captures.json`. Ce contrat remplace le shell et les commandes de l'ancien écran de création d'exercice pour la fiche Mouvement seulement.

### 2. Finalité fonctionnelle

Créer un mouvement autonome, consulter et modifier son contenu partagé, créer une variante explicitement classée. Ne pas créer d'exercice ou de séance en même temps ; ne pas saisir les paramètres d'exécution.

### 3. Contexte d'entrée

Création depuis le catalogue, ouverture d'une fiche existante, reprise d'un résultat, ajout d'un niveau depuis le catalogue. Distinguer création indépendante, variante, consultation et édition. [04/11/2026, recette iPhone du 04/11 (Hermann : « Afficher en mode modale iOS (mode d'apparition identique à la fiche des mouvements du questionnaire par exemple) […] Catalogue des mouvements : Créer un mouvement ») : la création d'un Mouvement se présente en feuille native iOS (montée et descente par le système, voile du système, fond blanc, hauteur jusqu'au titre de l'écran, en-tête sans marge de zone sûre haute ; fermeture par ✕ avec la protection du brouillon, Terminer inchangé) ; même présentation pour la création depuis la Composition (même écran) ; consultation, modification et ajout d'un niveau restent des écrans poussés (références 402 × 874 du §9) ; voir ch07 « Recette iPhone du 04/11/2026 — décisions de Hermann », « Modales iOS des Catalogues ».] Un mouvement repris depuis une séance est consultable mais n'offre ni crayon ni création de variante. [Recette A/B du 27/10/2026, F07 — remplace la consultation préalable : depuis le Catalogue des Mouvements, une fiche existante s'ouvre directement en édition, sans crayon ; brouillon, abandon et dialogues C03 conservés ; un Mouvement archivé reste consultable seulement ; le verrouillage depuis une Séance est inchangé.]

Le verrouillage depuis une séance concerne uniquement un mouvement existant ou repris. Lors de la création d'un nouvel exercice, le mouvement nouveau reste éditable tant qu'il n'est pas enregistré ; choisir un mouvement existant fait passer son contenu en lecture seule. La création de variante depuis une séance reste exclue de ce parcours cible.

### 4. Contexte de sortie / destinations

Terminer valide le brouillon et revient au contexte appelant avec l'identité enregistrée ; celle-ci est retrouvable au catalogue. La réutilisation d'un Mouvement existant conserve son comportement sans création de doublon, mais **les cartes Résultat de création de Mouvement n'affichent aucun bouton « Utiliser ce mouvement »** (CE-MVT-RESULT-01). Changer de niveau ouvre le membre choisi de la famille, sans reclassement. Fermer protège les modifications non enregistrées ; Annuler un dialogue revient au brouillon.

### 5. Données affichées et source de vérité

Mouvement partagé : nom, alias existants, catégorie, zones corporelles, description, médias, phases (identités et libellés), groupe et clé de tri. Rang calculé à la lecture. Pendant l'édition, afficher le brouillon. Paramètres d'exécution et durées des phases absents. [31/10/2026, story A.2b — décisions de Hermann du 30/10 (« les durées de la phase peuvent faire partie du mouvement, si elles sont renseignées elles sont reprises par défaut et peuvent être changées dans la séance, si elles n'existent pas elles sont à renseigner dans la séance ») et du 31/10 (Exercices existants « Inchangés ») : chaque phase du mouvement porte une durée par défaut FACULTATIVE, reprise par identité de phase dans un nouvel exercice seulement ; voir ch07 « A.2b et B.4b — précisions de Hermann du 31/10/2026 ».] Compter les exercices réellement liés ; vérifier séparément les exécutions par identité.

### 6. Classification des valeurs Figma

« Squats sautés », les trois phases, Niveau 3, les catégories et « 2 autres exercices » sont des exemples. « Niveau » sans valeur est l'état d'un mouvement indépendant. Les textes d'actions et la structure visuelle sont des références sous réserve des écarts explicités dans la spécification ciblée. Les libellés historiques de composants contenant « exercice » ne changent pas la nature des données.

### 7. Structure de l'écran

En-tête fixe ; média pleine largeur derrière la zone de contexte (nom et pastilles catégorie/zone/niveau) ; description en étapes ; phases du mouvement [31/10/2026, recette iPhone n° 2 (Hermann) : libellé au clavier texte, Entrée → durée de la même ligne au clavier numérique (règles de saisie des cellules de durée D-434, 1..3535 s, vide = aucune durée ; aucune roulette), Entrée ou « Suivant → » de la barre du clavier → ligne suivante, clavier toujours ouvert ; voir ch07 « Recette iPhone n° 2 du 31/10/2026 »] [31/10/2026, contrôle de la recette n° 2 (cr2-phases) : Entrée du libellé au libellé par défaut (plus « Next »), barre du clavier et passage automatique à la ligne suivante retirés — l'utilisateur touche lui-même le champ suivant ; voir ch07 « Recette iPhone n° 2 du 31/10/2026 — contrôle (phases, feuille des paramètres, valeurs par défaut) »] ; action Terminer en bas. Sans média, gabarit vide permettant l'ajout. Pas d'accordéon Médias inférieur, pas de carte Paramètres ni de mode d'exécution. [Recette A/B du 27/10/2026, F01/F02 : le média se prolonge derrière la zone de contexte, dont le dégradé recouvre la partie haute sans bande blanche (chevauchement de 21 à la référence 402) ; la zone média reste fixe pendant le défilement de la description et des phases, et le gabarit reste présent sans média. F03/F04 : titres « Description du mouvement » et « Phases du mouvement (pour minuter l'exécution) » en 11, mêmes marges et espacements. F05 : phases en liste d'étapes textuelles numérotées, sans durée ni paramètre ; ajout par l'invite, retrait par effacement d'une phase vide ; ordre modifiable par les actions accessibles.]

Le bloc média adopte uniquement l'emplacement et les dimensions du nouveau gabarit Figma. Tous les comportements existants sont conservés : ajout/import, consultation/lecture, retrait et réordonnancement. La disparition de l'accordéon inférieur ne supprime aucune de ces commandes et n'introduit aucun nouveau parcours. Aucun écran ni arbitrage média supplémentaire n'est un prérequis de PRE-8.

### 8. Éléments obligatoires

Navigation/fermeture, nom, pastilles de contexte, gabarit média, blocs description et phases, action Terminer. Crayon dans le contexte catalogue pour entrer en édition. Ces blocs ne rendent pas tous leurs contenus obligatoires : conserver les validations métier existantes, sans exiger un média ou des phases pour créer un mouvement. Alias : conserver leur prise en charge, sans prétendre que les 25 frames fournissent un nouveau champ dessiné. [Recette A/B du 27/10/2026, F07 : plus de crayon depuis le Catalogue des Mouvements, la fiche y est ouverte en édition.]

### 9. Layout déterministe

Référence 402 × 874 ; en-tête 402 × 95 ; contexte 402 × 115 ; photo remplie 402 × 329 ; blocs description/phases de largeur 354 (marges 24). Le média passe derrière le contexte : ne pas additionner mécaniquement leurs hauteurs. Réutiliser les variantes et styles relevés au chapitre 12. Les hauteurs des listes s'adaptent à leur contenu. La pastille des zones absorbe la place disponible et tronque pour préserver catégorie et niveau. [Recette A/B du 27/10/2026, A01 : marges standard de 16, blocs de 370 à la référence 402 ; A02 : titre de la fiche et de la création Mouvement / Niveau en Inter Medium 17.]

### 10. Responsive, Safe Areas, texte, scroll et clavier

Adapter la largeur au terminal, respecter safe areas et mécanismes existants d'en-tête/bouton fixe. Le contenu défile sans passer sous l'action finale. Le clavier ne masque ni le champ actif ni les suggestions ; la description et les libellés longs restent accessibles. Les dimensions du prototype ne prescrivent pas une hauteur fixe de contenu. Conserver l'agrandissement de texte et les règles de clavier existantes.

**Clavier ouvert dans la Description ou les Phases (clarification UX de recette, 27/10/2026, PRE-8 ; remplace la remontée du gabarit média de B.10).** L'en-tête, la zone de contexte et le gabarit média restent fixes : le clavier ne les déplace, ne les réduit ni ne les redimensionne ; sans média, le gabarit vide et ses commandes d'ajout restent à leur place. Le contenu éditable (Description et Phases) remonte progressivement devant le média, sur une surface claire translucide (blanc à 90 %, `color.movementEditableSurface`, recette du 27/10 : « légèrement plus translucide ») : aucun texte n'est posé directement sur l'image. Il remonte jusqu'à poser le bas des Phases (ligne d'invite comprise) juste au-dessus du clavier, et y reste tant que le clavier est ouvert, quels que soient les changements de champ ou de contenu de la Description et des Phases : il ne redescend jamais clavier ouvert (il peut encore monter si le contenu s'allonge). Il monte au plus jusqu'à la part opaque de la zone de contexte : il glisse sous le fondu de cette zone, qui se pose sur son fond blanc translucide. Au-delà, le contenu défile ; la ligne en saisie (après Entrée : la ligne qui suit) reste visible. Le défilement vers la fin s'arrête quand la dernière ligne des Phases est juste au-dessus du clavier : elle ne monte pas plus haut. Toutes les étapes et toutes les Phases restent atteignables par défilement, clavier ouvert, sans retour forcé. Toucher le formulaire hors d'un champ (titre de section, espace) ne ferme pas le clavier. Clavier ouvert sur la Description ou les Phases, Nom, Catégorie, Zones et Niveau sont inactifs : un toucher sur la zone de contexte ferme seulement le clavier (recette du 27/10, demande de Hermann). Passer d'un champ à l'autre clavier ouvert ne provoque ni saut ni double décalage. À la fermeture du clavier, le contenu reprend progressivement sa disposition normale, sans perte de saisie. Une seule mécanique pour la Description et les Phases. « Réduire les animations » : changement immédiat, sans glissement. Précisions de mise en œuvre (à confirmer en recette) : la saisie du Nom n'entraîne pas cette remontée. Figma ne représente pas l'état clavier ouvert : sa référence reste l'état normal.

### 11. États de l'écran

Initial ; nom en cours et mouvements proches ; nom déjà utilisé ; options d'un résultat ; variante (choix de difficulté puis formulaire vierge) ; référentiels (sélection/création/suppression de proposition) ; consultation ; édition ; menus de niveau ; sauvegarde nom inchangé/modifié/choix sélectionné ; abandon. Ajouter les états de chargement/échec de persistance avec les patterns livrés ; ils n'ont pas de nouvelle frame dédiée.

### 12. Contrôles et interactions

Nom → recherche R01–R08, cinq résultats au plus [30/10/2026, contre-recette PRE-9 n° 1 (Hermann) : « Ne pas limiter à 5 le nombre de résultats » — tous les résultats sont listés ; voir ch07 « Contre-recette PRE-9 n° 1 ».]. Cartes Résultat de création de Mouvement : « Ajouter un niveau » → choix du sens puis création, sans bouton « Utiliser ce mouvement » ; cartes Composition de création d'Exercice : aucun bouton interne (CE-MVT-RESULT-01). La reprise d'une identité existante suit ses autres parcours déjà validés. Depuis le glissé du catalogue, appliquer CE-MVT-02 sans écran intermédiaire. Crayon → brouillon modifiable depuis catalogue. Pastilles → sélecteurs ; Niveau → consultation d'un autre membre ou ajout de niveau. Phases → libellés/structure, jamais durées [30/10/2026 (Hermann) : durées facultatives portées par le Mouvement, story A.2b]. Description → invite d'étape suivante seulement dans le champ actif. Terminer → validation puis table C03 de la spécification ciblée. Une variante ne repasse pas par le dialogue de correction. [Recette A/B du 27/10/2026, F07 : depuis le Catalogue des Mouvements, la fiche est directement modifiable ; C02 : après Plus facile / Plus difficile, le nouveau Niveau s'ouvre en édition, sans crayon, nom commencé sans rang ajouté et invite « (compléter le nom) » non persistée ; F06 : libellé de phase limité à 20 points de code (`WORK_PHASE_LIMITS.labelMaxLength`), même règle en création et en modification.]

### 13. Gestes

Appui sur commandes et résultats ; appui long sur catégories/zones selon leurs contrats existants. Le glissement de réordonnancement dans une pile n'appartient pas à ce formulaire. Ne pas ajouter de geste pour modifier le mouvement depuis une séance.

### 14. Validation

Nom principal non vide et unique selon C01, contrôle à la saisie et à la persistance ; exclure l'identité éditée. Conserver les validations de contenu existantes, dont phases à identités entières positives uniques et libellés valides. L'invite « (compléter le nom) » n'est pas une valeur. Choix explicite pour nouveau mouvement/mise à jour ; Confirmer indisponible sans choix. Aucun contrôle de durées sur cette fiche.

### 15. Brouillon et persistance

Saisie locale jusqu'à validation. Création indépendante sans groupe ; variante avec groupe/position explicitement choisis ; correction avec identité conservée. Création distincte depuis catalogue : nouvelle identité indépendante, original et exercices liés conservés. Aucun objet provisoire résiduel après abandon. Une erreur d'écriture ne perd pas le brouillon. Les commandes persistent une fois, sans doublon après réappui.

### 16. Navigation et conservation d'état

Fermer les sélecteurs rend le brouillon ; Annuler la sauvegarde garde les saisies ; confirmer l'abandon les perd. Protéger un brouillon avant consultation d'un autre niveau. Réutiliser les règles existantes de retour et d'abandon, sans multiplier les confirmations quand aucune modification n'existe.

### 17. Erreurs et cas limites

Nom doublon, aucun résultat, nom identique à un alias d'un autre mouvement, zéro exercice mais historique existant, un seul exercice lié, variante à partir d'un mouvement sans groupe, nouvel identifiant de phase, mouvement source devenu indisponible, erreur de stockage/média. Ne jamais récupérer silencieusement l'identité d'un homonyme ni inventer des durées. Les erreurs de service utilisent les patterns existants ; le prototype n'en définit pas de nouveaux.

### 18. Accessibilité

Libellés accessibles des actions média/crayon/niveau, état lecture seule/édition perceptible, ordre de focus conforme à l'écran, annonces des erreurs et de la sauvegarde. Conserver les cibles tactiles existantes (au moins 44 pt), indépendantes des icônes de 18/24/32 pt. Ne pas faire dépendre le niveau seulement du nombre de barres ou de la couleur.

### 19. Invariants

Mouvement ≠ paramètres d'exécution ; aucun exercice implicite ; noms uniques ; sélection/rattachement explicites ; rang dérivé ; correction conserve l'identité ; nouvelle identité sans réaffectation depuis catalogue ; intégrité des références actives ; instantanés figés. Ajouter un niveau ne modifie pas le contenu exécuté dans les historiques. Les restrictions de phase avec répétitions/échec/séries variables ne sont pas réintroduites.

### 20. Recette déterministe

Exécuter MVT-01 à MVT-12 de la spécification ciblée, avec le corpus automatique R07 complet et les tests existants de sauvegarde, phases et lecture partagée. Vérifier visuellement les six états principaux du chapitre 06 sur terminal (clavier, scroll et safe areas compris). Les 25 PNG sont des références d'états ; leur présence n'est pas une preuve de conformité du code.

> **Référence ciblée — parcours Mouvement, 27/10/2026.** [Création et modification des mouvements](../DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md) remplace, sur ce périmètre seulement, les anciens écrans de création d’exercice : nouveau gabarit, structure des phases sans durées [31/10/2026, A.2b : plus une durée par défaut facultative par phase — voir ch07 « A.2b et B.4b — précisions de Hermann du 31/10/2026 ».], modification et variante depuis le catalogue des mouvements. Le crayon et la création de variante depuis une séance ne sont plus des parcours cibles. Les règles de recherche R01–R08 et de sauvegarde C03 restent applicables. Les autres lots de la simplification ne sont pas déclarés documentés ou livrés par cette mise à jour.

> **Cible validée D-449 — 26/10/2026.** [Six décisions closes](../KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md). Les dispositions ci-dessous sur l’exercice autonome de catalogue, le lancement `ACTIVITY`, le cycle technique unique et les catalogues séparés par nature décrivent le modèle antérieur et sont remplacées sur ces seuls points. Les autres règles restent applicables. La réalisation et les visuels Figma ne sont pas déclarés livrés.

## Contrats cibles de simplification — D-449

| Contrat | Comportement fonctionnel validé |
| --- | --- |
| CE-SU-01 — Catalogue | Collection unique de séances ; vues filtrées un/plusieurs exercices, sans différence de nature. Libellés à fixer dans Figma. |
| CE-SU-02 — Composition | Un exercice référence un mouvement et porte ses paramètres. Ajouter/retirer un exercice conserve l’identité de séance. Plusieurs cycles successifs, sans imbrication. |
| CE-SU-03 — Reprendre une séance | Sélection d’une source et insertion de sa composition à une position du niveau principal. Conserver structure et réglages ; nouveaux identifiants de composition, mêmes mouvements ; début/fin de la destination conservés. |
| CE-SU-04 — Lancer | L’action lance toute la séance, avec un ou plusieurs exercices. Aucune action de lancement isolé depuis la composition. |
| CE-SU-05 — Modifier | Occurrences futures sur contenu courant ; instantanés existants inchangés. Pas de dialogue général ajouté pour séance planifiée/exécutée ; dialogue du mouvement partagé conservé. |

Ces contrats remplacent les clauses contraires des contrats historiques ci-dessous concernant catalogues distincts par nature, lancement ACTIVITY et cycle/circuit unique. Les autres clauses restent applicables. Les nodes et captures de référence seront raccordés après les modifications Figma ; aucune géométrie ni composant nouveau n’est inventé ici.

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).


> Planification à plusieurs contenus (08/10) : les règles antérieures d’archivage supprimant les Routines associées restent décrites pour le cas à contenu unique. Leur extension à une Routine contenant d’autres contenus est **non définie** ; ne pas supprimer ces autres planifications par généralisation. Voir la chapitre 08, Planification.

> **Règle documentaire :** le chapitre 13 ne contient aucune copie d’écran. Les captures et copies physiques d’écrans/modales sont centralisées exclusivement dans le chapitre 06. Le chapitre 13 conserve uniquement les contrats, états, règles et références de nodes Figma nécessaires à la recette.

Nouveau contrat : [CE-UI-NIV-01 — Niveaux](#ce-ui-niv-01--niveaux--choisir-ajouter-réordonner).

## Sommaire

- [Objet et organisation du chapitre](#objet-et-organisation-du-chapitre)
  - [Objet et statut normatif](#objet-et-statut-normatif)
  - [Sources et ordre d’application](#sources-et-ordre-dapplication)
  - [Structure canonique obligatoire](#structure-canonique-obligatoire)
  - [Inventaire des contrats actifs](#inventaire-des-contrats-actifs)
  - [Frontière de réalisation et recette](#frontière-de-réalisation-et-recette)
  - [Clarification d’autorité et de portée](#clarification-dautorité-et-de-portée)
- [Séances](#séances)
  - [CE-T03-01 — Catalogue des séances — état T03](#ce-t03-01--catalogue-des-séances--état-t03)
  - [CE-T03-16 — Étiquettes de Séance — sélectionner, créer, retirer](#ce-t03-16--étiquettes-de-séance--sélectionner-créer-retirer)
  - [Catalogue des séances — Objectif](#catalogue-des-séances--objectif)
  - [Catalogue des séances — Filtres](#catalogue-des-séances--filtres)
  - [Catalogue des séances — Actions sur une carte](#catalogue-des-séances--actions-sur-une-carte)
  - [Catalogue des séances — Carte de Séance — vue déployée](#catalogue-des-séances--carte-de-séance--vue-déployée)
  - [Catalogue des séances — Création d’une Séance](#catalogue-des-séances--création-dune-séance)
  - [Catalogue des séances — Actions secondaires](#catalogue-des-séances--actions-secondaires)
  - [Catalogue des séances — État vide](#catalogue-des-séances--état-vide)
  - [Catalogue des séances — Confirmation — Confirmer la suppression d’une Séance archivée](#catalogue-des-séances--confirmation--confirmer-la-suppression-dune-séance-archivée)
  - [Catalogue des séances — Confirmation — Confirmer l’archivage d’une Séance planifiée](#catalogue-des-séances--confirmation--confirmer-larchivage-dune-séance-planifiée)
  - [Composer une séance / Modifier une séance — Étiquettes — sélection et création en modale](#composer-une-séance--modifier-une-séance--étiquettes--sélection-et-création-en-modale)
  - [Composer une séance / Modifier une séance — Contenu et comportement](#composer-une-séance--modifier-une-séance--contenu-et-comportement)
  - [Champs et comportements des fonctionnalités — Catalogue de séances](#champs-et-comportements-des-fonctionnalités--catalogue-de-séances)
  - [Étiquettes de la séance — Éléments affichés](#étiquettes-de-la-séance--éléments-affichés)
- [Exercices](#exercices)
  - [CE-T03-02 — Catalogue des exercices — liste, filtres et cartes](#ce-t03-02--catalogue-des-exercices--liste-filtres-et-cartes)
  - [CE-T03-04 — Éditeur Exercice — créer / modifier](#ce-t03-04--éditeur-exercice--créer--modifier)
  - [CE-T03-05 — ActivityDefinition — archiver / restaurer / supprimer](#ce-t03-05--activitydefinition--archiver--restaurer--supprimer)
  - [Catalogue des exercices](#catalogue-des-exercices)
- [Paramètres d’exécution](#paramètres-dexécution)
  - [CE-UI-10 — Paramètres d’exécution — feuille basse](#ce-ui-10--paramètres-dexécution--feuille-basse)
  - [Règles communes de l’éditeur de paramètres](#règles-communes-de-léditeur-de-paramètres)
  - [Rendu et accessibilité de la phrase](#rendu-et-accessibilité-de-la-phrase)
- [Composition des séances](#composition-des-séances)
  - [CE-T03-06 — Composition — `Ajouter un exercice` vers le Catalogue](#ce-t03-06--composition--ajouter-un-exercice-vers-le-catalogue)
  - [CE-T03-07 — Sélection multiple d’Exercices existants](#ce-t03-07--sélection-multiple-dexercices-existants)
  - [CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation](#ce-t03-08--composer-une-séance--modifier-une-séance--brouillon-circuit-points-darrêt-et-validation)
  - [Composer une séance / Modifier une séance — Objectif](#composer-une-séance--modifier-une-séance--objectif)
  - [Composer une séance / Modifier une séance — En-tête](#composer-une-séance--modifier-une-séance--en-tête)
  - [Composer une séance / Modifier une séance — Ajout d’un Exercice](#composer-une-séance--modifier-une-séance--ajout-dun-exercice)
  - [Composer une séance / Modifier une séance — Résumé de la ligne d’un Exercice (D-095 révisée par D-238)](#composer-une-séance--modifier-une-séance--résumé-de-la-ligne-dun-exercice-d-095-révisée-par-d-238)
  - [Composer une séance / Modifier une séance — Consultation et modification d’un Exercice](#composer-une-séance--modifier-une-séance--consultation-et-modification-dun-exercice)
  - [Composer une séance / Modifier une séance — Réorganisation](#composer-une-séance--modifier-une-séance--réorganisation)
  - [Composer une séance / Modifier une séance — Sélection des exercices — modale](#composer-une-séance--modifier-une-séance--sélection-des-exercices--modale)
  - [Composer une séance / Modifier une séance — Placement et retrait des pauses](#composer-une-séance--modifier-une-séance--placement-et-retrait-des-pauses)
  - [Composer une séance / Modifier une séance — Confirmation — Abandonner la création d’une séance](#composer-une-séance--modifier-une-séance--confirmation--abandonner-la-création-dune-séance)
  - [Champs et comportements des fonctionnalités — Composition d’une séance — création et modification](#champs-et-comportements-des-fonctionnalités--composition-dune-séance--création-et-modification)
  - [Champs et comportements des fonctionnalités — Composition — comportement cible](#champs-et-comportements-des-fonctionnalités--composition--comportement-cible)
- [Circuits](#circuits)
  - [CE-CIR-01 — Choix de nature du circuit](#ce-cir-01--choix-de-nature-du-circuit)
  - [CE-CIR-02 — Confirmation d’adaptation avec perte](#ce-cir-02--confirmation-dadaptation-avec-perte)
  - [CE-CIR-03 — Volumes du circuit](#ce-cir-03--volumes-du-circuit)
- [Formats de séances](#formats-de-séances)
  - [CE-FMT-01 — Choix du modèle et du format](#ce-fmt-01--choix-du-modèle-et-du-format)
  - [CE-FMT-02 — Paramètres globaux et récapitulatif](#ce-fmt-02--paramètres-globaux-et-récapitulatif)
  - [CE-FMT-03 — Composition d’une séance issue d’un format](#ce-fmt-03--composition-dune-séance-issue-dun-format)
  - [CE-FMT-04 — Paramètres d’exercice contextualisés par un format](#ce-fmt-04--paramètres-dexercice-contextualisés-par-un-format)
  - [CE-FMT-05 — Exécution des fenêtres et formats à borne ouverte](#ce-fmt-05--exécution-des-fenêtres-et-formats-à-borne-ouverte)
  - [CE-FMT-06 — Arrêt et résultat Death by](#ce-fmt-06--arrêt-et-résultat-death-by)
- [Bilatéralité](#bilatéralité)
  - [CE-T03-12 — Exécution directe — bilatéralité, Pauses, Récupération](#ce-t03-12--exécution-directe--bilatéralité-pauses-récupération)
- [Exécution](#exécution)
  - [CE-T03-09 — Lancement direct et préparation fixe 5 s](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s)
  - [CE-T03-10 — Exécution directe — Durée chiffrée unilatérale](#ce-t03-10--exécution-directe--durée-chiffrée-unilatérale)
  - [CE-T03-11 — Exécution directe — Répétitions et À l’échec](#ce-t03-11--exécution-directe--répétitions-et-à-léchec)
  - [CE-T03-13 — Fin, interruption et retour d’Exécution directe](#ce-t03-13--fin-interruption-et-retour-dexécution-directe)
  - [CE-EXEC-SESSION-01 — Exécution d’une Séance — phases, commandes et confirmations](#ce-exec-session-01--exécution-dune-séance--phases-commandes-et-confirmations)
  - [Exécution — séance ou exercice — Objectif](#exécution--séance-ou-exercice--objectif)
  - [Exécution — séance ou exercice — Entrée dans l’écran et démarrage](#exécution--séance-ou-exercice--entrée-dans-lécran-et-démarrage)
  - [Exécution — séance ou exercice — Hiérarchie des informations affichées](#exécution--séance-ou-exercice--hiérarchie-des-informations-affichées)
  - [Exécution — séance ou exercice — Commandes principales](#exécution--séance-ou-exercice--commandes-principales)
  - [Exécution — séance ou exercice — Confirmation — Réinitialisation de l’Exercice](#exécution--séance-ou-exercice--confirmation--réinitialisation-de-lexercice)
  - [Exécution — séance ou exercice — Confirmation — Passage à l’Exercice suivant](#exécution--séance-ou-exercice--confirmation--passage-à-lexercice-suivant)
  - [Exécution — séance ou exercice — Confirmation — Pause / arrêt de l’Exécution](#exécution--séance-ou-exercice--confirmation--pause--arrêt-de-lexécution)
  - [Exécution d'une séance — Informations affichées](#exécution-dune-séance--informations-affichées)
  - [Exécution d'une séance — Éléments affichés](#exécution-dune-séance--éléments-affichés)
  - [Exécution d'une séance — Règles fonctionnelles](#exécution-dune-séance--règles-fonctionnelles)
- [Médias pendant l’Exécution](#médias-pendant-lexécution)
  - [CE-MEDIA-EXEC-01 — Exécution — faces Information et Média](#ce-media-exec-01--exécution--faces-information-et-média)
  - [CE-MEDIA-EXEC-02 — Exécution — média plein écran](#ce-media-exec-02--exécution--média-plein-écran)
- [Planification](#planification)
  - [CE-UI-02 — Calendrier — Jour compact](#ce-ui-02--calendrier--jour-compact)
  - [CE-UI-03 — Calendrier — Semaine et structure Mois](#ce-ui-03--calendrier--semaine-et-structure-mois)
  - [CE-UI-04 — Calendrier et planification — choisir des contenus](#ce-ui-04--calendrier-et-planification--choisir-des-contenus)
  - [CE-UI-05 — Planification — formulaire et états de paramètres](#ce-ui-05--planification--formulaire-et-états-de-paramètres)
  - [CE-UI-11 — Planification — fréquence d’un contenu](#ce-ui-11--planification--fréquence-dun-contenu)
  - [Contrôles et layout de planification](#contrôles-et-layout-de-planification)
  - [Calendrier — Objectif](#calendrier--objectif)
  - [Calendrier — Contenu](#calendrier--contenu)
  - [Calendrier — Comportement](#calendrier--comportement)
  - [Calendrier — Confirmation — Suppression d’une planification](#calendrier--confirmation--suppression-dune-planification)
  - [Planifier une séance, un exercice ou plusieurs contenus](#planifier-une-séance-un-exercice-ou-plusieurs-contenus)
- [Suivi et synthèse](#suivi-et-synthèse)
  - [CE-T03-14 — Synthèse d’Exécution directe](#ce-t03-14--synthèse-dexécution-directe)
  - [CE-T03-15 — Suivi général — Exécution ACTIVITY](#ce-t03-15--suivi-général--exécution-activity)
  - [CE-UI-08 — Synthèse de Séance](#ce-ui-08--synthèse-de-séance)
  - [Synthèse — séance ou exercice — Objectif](#synthèse--séance-ou-exercice--objectif)
  - [Synthèse — séance ou exercice — Contenu](#synthèse--séance-ou-exercice--contenu)
  - [Synthèse — séance ou exercice — Ressenti](#synthèse--séance-ou-exercice--ressenti)
  - [Synthèse — séance ou exercice — Commentaire](#synthèse--séance-ou-exercice--commentaire)
  - [Synthèse — séance ou exercice — Résultat d’un exercice lancé directement](#synthèse--séance-ou-exercice--résultat-dun-exercice-lancé-directement)
  - [Suivi — Séances — Objectif](#suivi--séances--objectif)
  - [Suivi — Séances — Contenu](#suivi--séances--contenu)
  - [Suivi — Séances — État vide](#suivi--séances--état-vide)
  - [Synthèse de séance — Éléments affichés](#synthèse-de-séance--éléments-affichés)
  - [Suivi - Séances — Élément affiché lié à la couleur](#suivi---séances--élément-affiché-lié-à-la-couleur)
- [Profil et préférences](#profil-et-préférences)
  - [CE-UI-01 — Profil — préférence silhouette](#ce-ui-01--profil--préférence-silhouette)
  - [CE-UI-07 — Profil — préférences et défauts d’exécution](#ce-ui-07--profil--préférences-et-défauts-dexécution)
  - [Profil — Objectif](#profil--objectif)
  - [Profil — Contenu](#profil--contenu)
  - [Profil — Comportement](#profil--comportement)
  - [Profil — Éléments affichés](#profil--éléments-affichés)
- [Référentiels](#référentiels)
  - [CE-UI-09 — Référentiels d’Exercice — Catégorie et Zones corporelles](#ce-ui-09--référentiels-dexercice--catégorie-et-zones-corporelles)
- [Interface transverse](#interface-transverse)
  - [Règles communes T03](#règles-communes-t03)
  - [CE-T03-17 — Navigation principale — inventaire DSF](#ce-t03-17--navigation-principale--inventaire-dsf)
  - [CE-UI-06 — Splash KODJO](#ce-ui-06--splash-kodjo)
  - [Splash KODJO](#splash-kodjo)
- [Sujets transverses](#sujets-transverses)
  - [CE-T03-03 — Catalogue — action `Créer` contextuelle](#ce-t03-03--catalogue--action-créer-contextuelle)
  - [Clôture des réserves fonctionnelles des contrats](#clôture-des-réserves-fonctionnelles-des-contrats)
  - [Référentiel élémentaire T03 et couverture](#référentiel-élémentaire-t03-et-couverture)

## Objet et organisation du chapitre

### Objet et statut normatif

Ce chapitre constitue la **spécification des familles d’écran du MVP, avec séparation des périmètres T03 et T04**. Il transforme les décisions produit, règles métier, modèle de données, API fonctionnelles, architecture, Design System Figma et frames de référence en comportements directement exploitables par le développement et la recette.

Un écran T03 n’est considéré comme spécifié que si son contrat définit explicitement : contexte d’entrée, sorties, données et leurs sources, valeurs Figma, structure, éléments obligatoires, layout, responsive, états, contrôles, gestes, validation, brouillon/persistance, navigation/conservation d’état, erreurs, accessibilité, invariants, recette.

Les 41 contrats actifs couvrent les familles CE-T03, CE-MEDIA-EXEC, CE-UI, CE-EXEC-SESSION et CE-FMT. Les contrats suivent les 20 rubriques canoniques définies ci-dessous. CE-T03-16 est désormais le contrat des Étiquettes de Composition ; l’ancien parcours Catégories est retiré. Les règles de clôture §6 complètent les contrats sans modifier le design. Cette correction documentaire ne modifie pas les tranches de réalisation ni leurs autorisations.

### Sources et ordre d’application

Pour les contrats actifs :

1. décisions validées dans le chapitre 07, avec priorité aux décisions explicitement supersédantes ; D-247 à D-255 et la section Paramètres et brouillon du chapitre 08 pour l’éditeur ;
2. modèle fonctionnel / modèle de données / règles métier ;
3. API fonctionnelles ;
4. architecture technique ;
5. chapitre 06 pour navigation/interaction et corrections UX T03 ;
6. présent chapitre 13 ;
7. Figma pour le rendu visuel et les états effectivement représentés.

Cet ordre n’établit aucune priorité automatique entre le chapitre 08, y compris sa section Paramètres et brouillon citée au rang 1, et le présent chapitre : une contradiction entre eux qui n’est pas résolue par une décision explicite reste `À CLARIFIER` (D-376).

Figma ne transforme jamais une valeur de démonstration en règle métier. Inversement, un comportement métier ne permet pas d’inventer un composant graphique absent de Figma. Tout détail visuel non représenté et non arbitré est `NON VÉRIFIABLE` ou `À CLARIFIER`.

#### Portée transverse des paramètres v13

Catalogue et exécution ACTIVITY : durée intrinsèque. Composition, détails de Séance, calendrier SESSION et exécution SESSION : durée d’occurrence avec récupération explicite, sans ajouter R deux fois. Les cartes de composition affichent les volumes variables selon la chapitre 13, Cartes et grille des volumes ; le détail complet est accessible dans la grille de volumes du circuit, en lecture seule, et dans CE-UI-10 pour édition. Copie/duplication et instantané conservent l’état variable explicite, les cibles/Pauses ordonnées, le changement de côté et l’Ordre des côtés (D-406), ainsi que l’activation et les valeurs de la charge (RM-236). Ces règles s’appliquent aux contrats hôtes, y compris CE-UI-01/02/03/05 et CE-T03-01/06/07/08. Les règles propres aux cartes et médias sont conservées.

Réinitialiser conserve D-029/D-150 et RM-062 : recommencer la Série courante en unilatéral ; en bilatéral, recommencer le côté courant depuis sa première Série, préserver les résultats de l’autre côté et le temps total écoulé. Cette portée s’applique aussi à Les deux côtés à chaque série ; un passage déjà acquis de l’autre côté n’est pas rejoué. Exemple : côté 2 en Série 2/3 → reprise du côté 2 en Série 1/3, résultats du côté 1 conservés (RM-243). Pendant une récupération, RM-062 réinitialise seulement cette phase. Le saut confirmé d’un bloc chronométré conserve D-150 : côté courant partiel, poursuite des passages restant à exécuter de l’autre côté ; les résultats acquis ne sont pas effacés. Ces conséquences du périmètre existant ne constituent pas un nouvel arbitrage.

### Structure canonique obligatoire

Chaque contrat comporte **exactement les 20 rubriques suivantes**, même lorsqu’une rubrique renvoie à une règle commune :

1. Identification ;
2. Finalité fonctionnelle ;
3. Contexte d’entrée ;
4. Contexte de sortie / destinations ;
5. Données affichées et source de vérité ;
6. Classification des valeurs Figma ;
7. Structure de l’écran ;
8. Éléments obligatoires ;
9. Layout déterministe ;
10. Responsive, Safe Areas, texte, scroll et clavier ;
11. États de l’écran ;
12. Contrôles et interactions ;
13. Gestes ;
14. Validation ;
15. Brouillon et persistance ;
16. Navigation et conservation d’état ;
17. Erreurs et cas limites ;
18. Accessibilité ;
19. Invariants ;
20. Recette déterministe ;

### Rattachement des 62 captures principales aux contrats

L’inventaire ci-dessous suit les frames `P-` de la page Figma `Prototype MVP` (D-426). Un même contrat peut couvrir plusieurs interfaces et états : l’absence de capture propre à une variante ne constitue pas une exclusion MVP. Le rattachement indique le contrat fonctionnel de référence, **pas** une déclaration automatique de complétude de tous les champs. Les zones sans règle explicite sont signalées après ce tableau.

| Frame Figma | Capture principale | Contrat de référence | Réserve |
|---|---|---|---|
| [`1992:375`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-375) | Profil — Vue d'ensemble - Vibration désactivée | `CE-UI-07` | — |
| [`1992:469`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-469) | Splash — Kodjo | `CE-UI-06` | — |
| [`1992:778`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-778) | Profil — Modifier le profil — MVP | `CE-UI-01` | — |
| [`1992:5101`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5101) | Calendrier — Semaine | `CE-UI-03` | — |
| [`1992:5237`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5237) | Calendrier — Mois | `CE-UI-03` | — |
| [`1992:5365`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5365) | Modal — Supprimer une planification unique — Calendrier | `CE-UI-02` | — |
| [`1992:5602`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5602) | Calendrier — Jour — Appui long — MVP | `CE-UI-02` | — |
| [`1992:5962`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5962) | Calendrier — Semaine — Actions glissées | `CE-UI-03` | — |
| [`1992:6102`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6102) | Modal — Supprimer des occurrences — Calendrier | `CE-UI-02` | — |
| [`1992:6249`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6249) | Modal — Choisir une séance — Planification — Liste longue | `CE-UI-04` | — |
| [`1992:6389`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6389) | Calendrier — Semaine — Séance déployée | `CE-UI-03` | — |
| [`1992:6838`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6838) | Planifier une séance — Création | `CE-UI-05` | — |
| [`1992:8132`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8132) | Exécution d'une séance — Démarrée | `CE-EXEC-SESSION-01` | — |
| [`4968:8188`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8188) | Exécution d'un exercice — Démarrée | `CE-T03-10` | — |
| [`1992:8718`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8718) | Synthèse de séance — Terminée —  Évaluation initiale | `CE-UI-08` | — |
| [`4968:8055`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8055) | Synthèse d'exécution — Exercice Terminé —  Évaluation initiale | `CE-T03-14` | — |
| [`1992:8843`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8843) | Suivi — Séances — Liste condensée | `CE-T03-15` | — |
| [`1992:9910`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-9910) | Catalogue des séances — Liste par défaut | `CE-T03-01` | — |
| [`1992:10014`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10014) | Catalogue des séances — Séance déployée | `CE-T03-01` | — |
| [`3786:5093`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3786-5093) | Catalogue des Exercices — Liste | `CE-T03-02` | —  **Retiré du catalogue cible le 27/10/2026 ; preuve historique.** |
| [`4168:11149`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11149) | Catalogue des séances — Filtrer — Panneau ouvert | `CE-T03-01` | — |
| [`4168:11262`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11262) | Catalogue des Exercices — Filtrer — Panneau ouvert | `CE-T03-02` | —  **Retiré du catalogue cible le 27/10/2026 ; preuve historique.** |
| [`4593:6285`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4593-6285) | Modal — Confirmer l’archivage d’une séance planifiée | `CE-T03-01` | — |
| [`4738:6209`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6209) | Catalogue des Exercices — Liste — actions glissées | `CE-T03-02` | —  **Retiré du catalogue cible le 27/10/2026 ; preuve historique.** |
| [`4997:6113`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4997-6113) | Exécution d'un exercice — Initial — Bascule basse (média) avec Cercle | `CE-MEDIA-EXEC-01` | — |
| [`5588:4363`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5588-4363) | Exécution d'un exercice — Initial — Bascule haute avec média | `CE-MEDIA-EXEC-01` | — |
| [`5009:6069`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5009-6069) | Exécution d'un exercice — Média plein écran | `CE-MEDIA-EXEC-02` | — |
| [`5581:4257`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5581-4257) | Exécution d'un exercice — Démarré —  Bascule haute avec texte | `CE-MEDIA-EXEC-01` | — |
| [`5451:4272`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5451-4272) | Modal — Choisir un exercice — Planification — Liste longue | `CE-UI-04` | — |
| [`7594:34531`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=7594-34531) | Planifier un parcours | `CE-UI-05` | — |
| [`7594:34653`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=7594-34653) | Modal — Planifier un parcours — Fréquence | `CE-UI-11` | — |
| [`8328:28863`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28863) | Composition séance — Actions glissées | `CE-T03-08` | — |
| [`8328:29270`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-29270) | Composition séance — Placement d’une pause | `CE-T03-08` | —  [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.] |
| [`8328:29428`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-29428) | Composition séance — Point d’arrêt | `CE-T03-08` | — |
| [`8328:33546`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-33546) | Composition séance — Déplacement | `CE-T03-08` | — |
| [`8328:33836`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-33836) | Composition séance — Étiquettes | `CE-T03-16` | — |
| [`8328:34107`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34107) | Composition séance — Nouvelle étiquette | `CE-T03-16` | — |
| [`8328:34965`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34965) | Composition séance — Circuit — Volumes (de séries) | `CE-CIR-03` | — |
| [`8328:35698`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-35698) | Ajouter un exercice — Initial | `CE-T03-04` | — |
| [`8328:35810`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-35810) | Ajouter un exercice — Catégories | `CE-UI-09` | — |
| [`8328:36056`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36056) | Ajouter un exercice — Nouvelle catégorie | `CE-UI-09` | — |
| [`8328:36348`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36348) | Ajouter un exercice — Zones corporelles | `CE-UI-09` | — |
| [`8328:36536`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36536) | Ajouter un exercice — Nouvelle zone corporelle | `CE-UI-09` | — |
| [`8328:36853`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36853) | Création activité — Paramètres — Champ vide | `CE-T03-04` | — |
| [`8328:37862`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-37862) | Création activité — Paramètres (modale) — Durée d’une série (roulette) | `CE-UI-10` | — |
| [`9232:44646`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9232-44646) | Création activité — Paramètres (modale) — Durée d’une phase (roulette) | `CE-UI-10` | D-434 — non conforme : la cellule Durée ne s’ouvre plus sur une roulette (clavier numérique MMSS) |
| [`8328:38193`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38193) | Création activité — Paramètres (modale) — Changement de côté déployé | `CE-UI-10` | — |
| [`8328:39279`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-39279) | Création activité — Paramètres (modale) — Séries variables (déplacement) | `CE-UI-10` | — |
| [`8470:13303`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8470-13303) | Création activité — Paramètres (modale) — Séries variables, cas mixte | `CE-UI-10` | — |
| [`8598:29271`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-29271) | Composition séance — Modèles | `CE-FMT-01` | — |
| [`8624:29980`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-29980) | Composition séance — Modèles — Tabata (quels exercices) | `CE-FMT-02` | —  [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.] |
| [`8598:29503`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-29503) | Composition séance — Modèles — Tabata (sélection des exercices) | `CE-FMT-02` | — |
| [`8624:30306`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30306) | Composition séance — Modèles — Tabata (récapitulatif) | `CE-FMT-02` | — |
| [`8921:35275`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8921-35275) | Avant la séance — Douleur | `CE-EXEC-SESSION-01` | À CLARIFIER — douleur initiale |
| [`8921:35340`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8921-35340) | Synthèse de séance — Effort et douleur — Douleur renseignée | `CE-UI-08` | D-427 — parcours enrichi validé |
| [`8928:15098`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8928-15098) | Modale — Répétitions partielles | `CE-T03-11` | D-428 — règles de saisie validées |
| [`8937:35362`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8937-35362) | Modale — Résultat de série | `CE-EXEC-SESSION-01` | D-429 — règles de saisie validées |
| [`8982:15383`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8982-15383) | Exécution d'une séance — Tabata — Par alternance | `CE-FMT-05` | — |
| [`8982:15709`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8982-15709) | Exécution d'une séance — EMOM — repos déclaré | `CE-FMT-05` | — |
| [`9207:18817`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9207-18817) | Création exercice — Paramètres — Tableau de 3 phases | `CE-UI-10` | — |
| [`9292:18077`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9292-18077) | Création activité — Paramètres (modale) — Séries variables avec charge — Clavier numérique | `CE-UI-10` | D-434 — écarts : valeur active non affichée en MM:SS, commande « À l’échec » absente à gauche de la barre |
| [`9307:18208`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=9307-18208) | Création activité — Paramètres (modale) — Série en durée — Durée de l’exercice déployée | `CE-UI-10` | — |

#### Réserves de définition des champs et zones observés

| Écran Figma | Zone ou champ représenté | Ce que Figma montre | Ce qui reste À CLARIFIER |
|---|---|---|---|
| `8921:35275` | Douleur avant séance | Choix 0 à 10, texte « Facultatif. Sans réponse, la douleur est notée 0 », action Commencer | Valeur métier effective en l’absence de réponse ; instantané, conservation, affichage ultérieur, possibilité de modifier |
| `8921:35340` | Effort perçu en Synthèse | Valeurs 1 à 10, une valeur visuellement sélectionnée | Relation, cumul ou remplacement du Ressenti triétat obligatoire (RM-078/RM-080), validation, persistance et exploitation |
| `8921:35340` | Douleur et localisation en Synthèse | Douleur 0 à 10 et choix « Genou droit / Genou gauche / Autre » | Caractère facultatif ou obligatoire, cardinalité des localisations, effet sur Enregistrer, stockage et utilisation |
| `8928:15098` | Résultats de répétitions partielles | Trois libellés d’exercices, sélections numériques, bouton « Terminer l’exercice » | D-428 : déclenchement, bornes, validation et fermeture arbitrés |
| `8937:35362` | Résultat d’une série | Feuille « Vos résultats », cible de série, sélection numérique et action Valider | D-429 : valeur initiale, bornes, validation et annulation arbitrées ; affichage dans les rapports non détaillé |

**Distinction des sources et arbitrages.** Les libellés et agencements ci-dessus restent des observations Figma. Les décisions D-427 à D-429 définissent maintenant les règles fonctionnelles de saisie, de bornes, de validation et d'annulation décrites ci-dessus. Le déclenchement exact de la modale « Résultat de série », les détails de rapports de suivi et la configuration de l'option du Programme demeurent À CLARIFIER. Les règles existantes de Résultat et Statut demeurent applicables hors des exceptions expressément arbitrées.

### Inventaire des contrats actifs

| Contrat | Famille |
|---|---|
| CE-T03-01 | Catalogue des séances — état T03 |
| CE-T03-02 | Catalogue des exercices — liste, filtres et cartes |
| CE-T03-03 | Catalogue — action `Créer` contextuelle |
| CE-T03-04 | Éditeur ActivityDefinition — créer / modifier |
| CE-T03-05 | ActivityDefinition — archiver / restaurer / supprimer |
| CE-T03-06 | Composition — `Ajouter un exercice` vers le Catalogue |
| CE-T03-07 | Sélection multiple d’Exercices existants |
| CE-T03-08 | Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation |
| CE-T03-09 | Lancement direct et préparation fixe 5 s |
| CE-T03-10 | Exécution directe — Durée unilatérale |
| CE-T03-11 | Exécution directe — Répétitions et À l’échec |
| CE-T03-12 | Exécution directe — bilatéralité, Pauses, Récupération |
| CE-T03-13 | Fin, interruption et retour d’Exécution directe |
| CE-T03-14 | Synthèse d’Exécution directe |
| CE-T03-15 | Suivi général — Exécution ACTIVITY |
| CE-T03-16 | Étiquettes de Séance — sélectionner, créer, retirer |
| CE-T03-17 | Navigation principale — inventaire DSF |
| CE-MEDIA-EXEC-01 | Exécution — faces Information et Média |
| CE-MEDIA-EXEC-02 | Exécution — média plein écran |
| CE-UI-01 | Profil — préférence silhouette |
| CE-UI-02 | Calendrier — Jour compact |
| CE-UI-03 | Calendrier — Semaine et structure Mois |
| CE-UI-04 | Calendrier et planification — choisir des contenus |
| CE-UI-05 | Planification — formulaire et états de paramètres |
| CE-UI-06 | Splash KODJO |
| CE-UI-07 | Profil — préférences et défauts d’exécution |
| CE-EXEC-SESSION-01 | Exécution d’une Séance — phases, commandes et confirmations |
| CE-UI-08 | Synthèse de Séance |
| CE-UI-09 | Référentiels d’Exercice — Catégorie et Zones corporelles |
| CE-UI-10 | Paramètres d’exécution — feuille basse |
| CE-UI-11 | Planification — fréquence d’un contenu |
| CE-CIR-01 | Choix de nature du circuit |
| CE-CIR-02 | Confirmation d’adaptation avec perte |
| CE-CIR-03 | Volumes du circuit |
| CE-FMT-01 | Choix du modèle et du format |
| CE-FMT-02 | Paramètres globaux et récapitulatif |
| CE-FMT-03 | Composition d’une séance issue d’un format |
| CE-FMT-04 | Paramètres d’exercice contextualisés par un format |
| CE-FMT-05 | Exécution des fenêtres et formats à borne ouverte |
| CE-FMT-06 | Arrêt et résultat Death by |

### Frontière de réalisation et recette

T03 décrit l’Exécution ACTIVITY autonome : préparation 5 s, phases propres, Séries/pauses/côtés, Pause entre les côtés, Synthèse et Suivi. T04 porte l’orchestration SESSION : Circuit/Tours, phases structurelles, récupération post-occurrence, points d’arrêt et progression globale. Ajouter leurs contrats ne déclenche ni développement ni changement de tranche. Ancien objet Parcours autonome retiré ; recherche hors MVP.

Pour chaque contrat : tester nominal/alternatifs/négatifs, comparer le rendu 402 à la preuve lorsqu’elle existe, vérifier 360/402/440 et texte agrandi, accessibilité, données réelles, persistance/annulation, erreurs et absence d’activation hors périmètre. Consigner séparément conformité documentaire, conformité visuelle et recette interactive. Les règles §6 et preuves manquantes §5 ne sont jamais marquées CONFORME en exécution par la seule présence de 20 sections.

### Clarification d’autorité et de portée

Les spécifications définissent les règles métier, les calculs et les comportements. Figma illustre les scénarios de présentation des écrans et contrôles. Un scénario absent de Figma ne constitue pas une lacune fonctionnelle lorsque son comportement est spécifié. Les shells, composants, DSF et contrats existants permettent de décliner des états sans dessiner chaque combinaison.

R-01 à R-05 sont des sujets de vérification ciblée, pas cinq blocages démontrés ni un préalable global au développement. R-01 concerne les commandes du moteur à fenêtres ; R-02 son exécution bilatérale ; R-03 l’enchaînement Death by multi-exercices. Leurs réponses doivent être recherchées dans les spécifications avant toute question. R-04 concerne uniquement la synchronisation des champs de l’éditeur For time s’ils sont modifiables séparément ; le contrôle du double comptage EMOM relève de l’implémentation et de ses tests. R-05 ne bloque rien du seul fait de captures absentes : une clarification de présentation n’est nécessaire que si l’implantation d’un élément nouveau ne peut pas être déterminée depuis les contrats et le DSF.

Aucun de ces constats ne suspend globalement la création/composition. Seule une règle effectivement absente ou contradictoire doit être clarifiée avant l’implémentation du comportement concerné. Les mentions de preuve visuelle partielle décrivent la couverture des illustrations, pas une obligation de produire une nouvelle maquette.

## Séances

### CE-T03-01 — Catalogue des séances — état T03

**Référence cible actualisée le 27/10/2026 ; identifiant historique conservé.**

#### 1. Identification

Contrat CE-T03-01 conservé, révisé le 27/10/2026. Source : [Carte et catalogue des séances](../KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md). [Douze écrans, trois variantes et copies contrôlées](../DSF-CATALOGUE-SEANCES-2026-10-27.md). D-449 §5/§6 ; D-260/D-261 remplacées dans le seul contexte Catalogue. Navigation CE-UI-05. Les anciens états du catalogue autonome d’exercices ne sont plus cibles.

#### 2. Finalité fonctionnelle

Présenter une collection unique de séances, quel que soit leur nombre d’exercices, avec vues Un exercice/Plusieurs, filtres et actions de cycle de vie. La carte permet la lecture structurée de la composition et le lancement de la séance entière.

#### 3. Contexte d’entrée

Catalogues → Séances ; retour de Composition, de planification ou d’Exécution. Séances reste le segment d’entrée à la relance selon la règle existante ; aucune vue Un exercice/Plusieurs sélectionnée par défaut.

#### 4. Contexte de sortie / destinations

Mouvements → catalogue des mouvements ; Séances → collection unique ; Programmes est le troisième segment, dont le développement métier est hors de ce lot. Créer et surface de modification réutilisent le parcours de Composition ; le chevron du nom déploie/replie seulement. Lecture lance la séance entière ; Planifier rejoint le parcours existant de planification. Une destination non livrée reste explicitement indisponible, pas une action factice.

#### 5. Données affichées et source de vérité

Séances enregistrées, mouvements et médias référencés, paramètres locaux et composition structurée. Nombre d’exercices sans multiplication par répétitions/tours/cycles, récupérations exclues. Catégories dédupliquées dans l’ordre de première apparition. Étiquette conservée pour filtrer, jamais affichée sur la carte ; zones corporelles et niveau absents. Durée issue du calcul commun, sans nouvelle formule ni déduction à partir des données d’exemple.

#### 6. Classification des valeurs Figma

Mouvements, Séances, Programmes, Un exercice, Plusieurs, Planifier, Dupliquer, Archiver, Restaurer, Supprimer et les titres des sections de filtres sont des libellés de référence. Noms, catégories, volumes, formats et durées des exemples sont des données démonstratives, jamais des constantes applicatives.

#### 7. Structure de l’écran

En-tête de navigation Catalogues à trois entrées conservé → zone de contexte commune **CE-CAT-CTX-01** (bande lilas, première ligne « Un exercice N | Plusieurs N », deuxième ligne Rechercher et Filtre/Tri/Créer) → liste de cartes/état vide → navigation. Le titre individuel de page est masqué. La bascule existante est inchangée ; **les compteurs ajoutés sont informatifs, non interactifs**. En état filtré ou archivé, « N résultats » est affiché à droite et le champ Rechercher est réduit à 107 pt. Panneau de filtres inchangé : Statut des séances, Catégories, Zones corporelles, Étiquettes, Format ; pied Réinitialiser fixe. [Remplacé le 06/11/2026 : « Un exercice N · Plusieurs N », onglets et couleurs D-501 à D-503.]

#### 8. Éléments obligatoires

Un seul gabarit de carte. Visuel 64 : photo de l’exercice unique, sinon première photo disponible dans l’ordre de composition, sinon vignette du format de séance, sinon Libre. Nom et seul chevron adjacent si plusieurs exercices. [Remplacé le 03/11/2026 (recette iPhone n° 3, Hermann) : chevron et vue déployée pour toute séance, même d'un seul exercice ; la photo et la zone déployée ouvrent la séance en modification, le reste de la carte (chevron compris) déploie — registre ch07, « Catalogue des séances — chevron pour toute séance — 03/11/2026 ».] Catégories avec pastille et +N pour les catégories non affichées, sans couper un mot. Synthèse : format si présent, sinon nombre pour plusieurs exercices, sinon volume de l’exercice unique ; jamais « 1 exercice ». Durée en second emplacement, y compris avec format ; vide pour For time et Death by. Lecture sur carte active, désactivée si non exécutable selon les règles existantes. Carte archivée sans action directe : restauration/suppression dans le glissé. [Remplacé le 06/11/2026 (D-504 à D-506) : chevron à gauche du nom sur toutes les cartes ; ligne 3 « N circuits · N exercices », circuits omis sans circuit ou pour un seul circuit d’un tour, « 1 exercice » ; durée en haut à droite sans sablier ; Démarrer en pilule en bas à droite, masqué dans les modales de planification — [KODJO-Catalogues-cartes-modales-2026-11-06](../KODJO-Catalogues-cartes-modales-2026-11-06.md) §5.]

#### 9. Layout déterministe

Référence 402 : marges 16, carte 370, intervalle 12. Maître replié/archivé 80 de haut ; état déployé selon contenu, exemple 273. Visuel carré 64 à 8 du bord, action lecture arrêtée à 8 du bord opposé. Déployée : en-tête inchangé, séparation et composition sur toute la largeur, sous le visuel. Cycle · N répétitions et Circuit · N tours en gris, sans volume propre ; enfants décalés de 16 par niveau, deux décalages au plus, filet vertical. Noms à gauche, volumes à droite. Récupérations en gris clair à leur position. Conteneur visible seulement s’il se répète ou contient plusieurs exercices. Actions glissées hautes de 80, alignées en haut, bloc jointif à marge droite, carte à 8 du bloc. [Remplacé le 06/11/2026 (D-504, D-507) : carte 72, visuel 64 à 4 du bord et rayon 8, colonne des symboles à 8 de la photo, textes alignés après les symboles et à 8 du haut et du bas, durée et Démarrer à 12 du bord droit ; dépliée : « Cycle » + « N passages », « Circuit · séries groupées | alternées » + « N tours » alignés à droite, « rép. » ; actions glissées hautes de 72.]

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Largeur de carte dérivée de l’espace disponible, pas 370 imposé sur tous les appareils. Conservation des Safe Areas et de la navigation. Catégories complètes puis +N, noms longs et texte agrandi sans collision avec lecture. Déploiement pousse les cartes suivantes. Panneau scrollable, Réinitialiser hors du contenu défilant. La vue avec filtre étendu doit préserver des cibles distinctes malgré le chevauchement présent dans le prototype ; pas d’option Toutes ajoutée.

#### 11. États de l’écran

Collection complète par défaut, Un exercice seul, Plusieurs seul, liste vide réelle, aucun résultat filtré, active/archivée, carte repliée/déployée, glissé actif/archivé, confirmation/annulation, retour après archivage/restauration. Une seule occurrence n’a pas de chevron. Aucune donnée de démonstration dans un état vide. [30/10/2026, contre-recette PRE-9 n° 1 (Hermann) : « Une séance incomplète doit avoir le même format qu'un exercice incomplet (fond rouge liseré rouge) » — carte d’une Séance dont un Exercice est « Paramètres à compléter » : fond `color.dangerSurface`, liseré 1 `color.danger` ; voir ch07 « Contre-recette PRE-9 n° 1 — décisions de Hermann du 30/10/2026 ».] [31/10/2026, contre-recette n° 3 de la recette iPhone n° 2 (Hermann, cr4-verifier) : « La carte de la séance dans le catalogue de séances doit aussi être orange. » — carte d’une Séance dont au moins un Exercice est « Paramètre à vérifier » : fond orange pâle, liseré 1 `color.warning` (rendu choisi, celui de la carte d’Exercice à vérifier de la Composition) ; « à compléter » (rouge) prime ; la carte suit ses Exercices, dont l’orange tombe à l’ouverture de leur feuille des paramètres ; voir ch07 « Recette iPhone n° 2 du 31/10/2026 — contrôle (phases, feuille des paramètres, valeurs par défaut) ».] [Remplacé le 06/11/2026 : chevron sur toutes les cartes — D-504.]

#### 12. Contrôles et interactions

Toucher une vue la sélectionne ; retoucher la vue active la désélectionne. Dans le catalogue des séances : toucher la photo ouvre la composition de séance en modification ; Démarrer exécute la séance ; le chevron et toute la zone centrale de la carte déploient/replient la séance ; toucher toute la zone déployée ouvre la séance en modification. Ces cibles sont distinctes. Actives : Planifier, Dupliquer, Archiver. Archivées : Restaurer puis Supprimer ; pas de bouton rond Restaurer. Filtres : titre et chevron adjacent ouvrent la section ; les options tenant sur une ligne sont à droite du titre, notamment Statut ; les autres pastilles sont sous le titre, hauteur 36. Sections à filtre actif ouvertes à l’entrée, autres fermées ; sans filtre, Statut seul ouvert. Réinitialiser reste en pied. Le tri garde son état de disponibilité existant tant que ses règles ne sont pas modifiées : le réordonnancement visuel des boutons ne l’active pas implicitement.

#### 13. Gestes

Glissé horizontal sur la carte entière, repliée ou déployée, pour les actions de séance ; les actions ne ciblent pas une ligne de composition. Défilement et appui sur chevron ne déclenchent ni Lecture ni modification. Réutiliser les gestes et animations existants, sans mode d’organisation ajouté.

#### 14. Validation

Créer ouvre un brouillon sans persister une séance vide. Les confirmations métier d’archivage/suppression restent applicables : archivage immédiat sans Routine, confirmation si Routine associée ; effet multicontenu non généralisé (RM-008). Suppression définitive depuis les archives avec confirmation, historique conservé. Le panneau conserve la validation/annulation existante ; la source déplace Réinitialiser sans en changer arbitrairement la portée. La nouvelle logique de combinaison Catégories/Zones reste à rechercher dans les règles existantes ou à préciser pour cette story.

#### 15. Brouillon et persistance

Déploiement et vues ne modifient ni le contenu de séance ni sa nature. Pas de stockage du rang, de catégories agrégées ou de photo dérivée dans la Séance. Le choix d’une vue n’engendre aucune conversion. Réutiliser les services existants pour Dupliquer/Archiver/Restaurer/Supprimer ; pas de copie de mouvement créée par un changement de vue.

#### 16. Navigation et conservation d’état

Retour des parcours existants conserve filtre et position selon les règles de navigation en vigueur. Relance complète : Séances et collection complète, sans choix de vue par défaut. La nouvelle nomination automatique appartient à la Composition (§8 de la spécification), pas au rendu des noms existants dans cette liste.

#### 17. Erreurs et cas limites

Chargement, erreur, séance disparue, absence de photo, média indisponible : mécanismes existants avec repli visuel, sans image inventée. État vide et séance non exécutable restent traités. Le jeu final des vignettes de formats est une dépendance de livraison, pas une justification pour déclarer le motif Libre conforme à EMOM. Le nœud de confirmation de suppression conserve un arrière-plan ancien : appliquer la règle des trois segments et du glissé Restaurer/Supprimer.

#### 18. Accessibilité

Labels et états sélectionnés des segments et vues ; annoncer la désélection possible. Cibles tactiles existantes au moins 44, lecture 48, sans chevauchement. Déploiement annoncé ouvert/fermé, ordre de lecture respectant la structure ; couleur non seule porteuse d’information. Conserver les alternatives accessibles existantes aux gestes ; ne pas faire dépendre le lancement du chevron.

#### 19. Invariants

Une Séance reste une Séance avec un ou plusieurs exercices ; aucun catalogue autonome d’exercices recréé. Déploiement disponible également pour une seule occurrence (D-504, précision du 06/11/2026) ; nom sans suffixe de niveau ; catégories seulement sur la ligne de classement, étiquette et zones seulement dans les données/filtres. Les changements de variantes Catalogue ne modifient pas Calendrier/Suivi/Choix. Le détail montre la structure sans multiplier ses lignes par les répétitions.

#### 20. Recette déterministe

Tester automatiquement : comptage structurel (cycles/circuits/récupérations), vues et désélection, cascade photo/format/Libre, déduplication et ordre des catégories, ligne 3 « N circuits · N exercices », omission du nombre de circuits sans circuit ou avec un seul circuit d’un tour, affichage « 1 exercice » (D-505), omission des durées For time/Death by, masquage conditionnel des conteneurs, conservation des données lors des actions. Tests UI : chevron sur toutes les cartes, photo ouvrant la modification, Démarrer lançant l’exécution, zone centrale déployant/repliant, zone déployée ouvrant la modification, aucune lecture par déploiement, actions actives/archivées dans le bon ordre, confirmations et annulation, état vide, filtres actifs à l’ouverture et pied fixe. Recette visuelle : douze états et variantes, marges/largeurs/espacement, actions 72 sur carte déployée (D-504), textes longs, accessibilité et non-régression des trois contextes hors lot. Les valeurs des maquettes ne servent pas d’oracle aux calculs. L’opérateur de combinaison des nouveaux filtres doit être fixé avant les assertions correspondantes.


**Zone de contexte PRE-9** : tests de la position des deux lignes, cibles 44 × 44, libellés N réels non cliquables, maintien de la bascule, largeur réduite en filtré/archivé et « N résultats » recalculé après recherche + filtres, selon CE-CAT-CTX-01.

### CE-T03-16 — Étiquettes de Séance — sélectionner, créer, retirer

#### 1. Identification

Modale de Composition 2028:11204, sélection 4581:6404, création 4640:6308, suppression 4861:6145. Remplace le contrat obsolète de page finale Catégories ; ID conservé pour traçabilité.

Règles applicables : RM-001, RM-017, RM-022, RM-200, RM-215, RM-216 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Associer zéro ou une Étiquette au brouillon de Séance et administrer le référentiel sans étape supplémentaire de sauvegarde de Séance.

#### 3. Contexte d’entrée

Action Étiquette dans CE-T03-08, avec sélection courante et brouillon conservés.

#### 4. Contexte de sortie / destinations

Toucher marque une Étiquette ; ✓ applique le choix puis ferme vers Composition ; ✕ laisse la sélection antérieure. Un nouveau toucher sur l’Étiquette marquée la démarque ; ✓ confirme alors le retrait (zéro Étiquette) (D-355, remplace le choix au toucher et D-259 sur ce point). Nouvelle Étiquette ouvre la création dans cette famille.

#### 5. Données affichées et source de vérité

Référentiel Étiquette (ID,nom,couleur,statut retiré) et ID facultatif dans brouillon Session ; couleur de Séance dérivée, pas copie indépendante modifiable.

#### 6. Classification des valeurs Figma

Étiquettes/Nouvelle étiquette/Annuler/Supprimer statiques ; noms et couleurs des options dynamiques ; Hyrox et couleurs de démonstration ne sont pas des constantes imposées.

#### 7. Structure de l’écran

Feuille de sélection et fermeture ; options avec pastilles ; création avec nom/palette ; confirmation centrée à l’appui long ; Composition demeure en arrière-plan.

#### 8. Éléments obligatoires

Sélection unique facultative, nom et couleur pour une nouvelle Étiquette, annulation ; aucune Catégorie de Séance ni CTA final d’enregistrement de Séance.

#### 9. Layout déterministe

Modale DSF D-228 ; lignes/pastilles selon 2028:11204 ; palette 4640:6308 ; dialogue 354/rayon 18, deux actions Annuler/Supprimer. Ne pas réutiliser le panneau Catégorie de l’Exercice.

*Texte identique à celui de la section [« CE-T03-05 — ActivityDefinition — archiver / restaurer / supprimer »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-05--activitydefinition--archiver--restaurer--supprimer) ; il n’est pas recopié ici.*

Étiquette contour au repos, pleine durant le panneau contextuel ; cercle blanc/trait inchangé. La sélection d’une valeur ne remplace pas la distinction ouvert/fermé.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Feuille limitée à la zone sûre, liste défilante, titre non tronqué ; clavier fait apparaître le nom saisi et les actions ; texte agrandi selon§4.2.

#### 11. États de l’écran

Aucune/une Étiquette ; liste vide ; création ; nom invalide ; sélection retirée existante ; appui long ; suppression confirmée/annulée ; erreur.

#### 12. Contrôles et interactions

Tap marque ou démarque l’Étiquette sans fermer, ✓ applique le choix ou le retrait et ferme (D-355) ; appui long ne change pas la sélection et ouvre le dialogue Modifier/Supprimer (D-259). Créer valide le référentiel ; son affectation reste dans le brouillon de Séance. La suppression globale conserve les affectations existantes D-210.

#### 13. Gestes

Tap, scroll, appui long option ; fermeture hors dialogue n’exécute jamais Supprimer. Pas de drag des options.

#### 14. Validation

Nom de nouvelle Étiquette non vide et unique dans le référentiel ; couleur choisie dans palette. Un nom correspondant à une Étiquette retirée la réactive avec la couleur choisie (D-257). Aucune Étiquette exigée pour Continuer dans Composition ; affectation retirée existante reste conservable.

#### 15. Brouillon et persistance

Affectation Session enregistrée seulement à Continuer. Création/renommage/couleur/suppression du référentiel sont des opérations explicites de référentiel, sans sauvegarder la Séance. Une erreur ne modifie pas partiellement le référentiel.

#### 16. Navigation et conservation d’état

Retour à la même Composition et au même brouillon ; Annuler la confirmation restitue la liste ; suppression retire des nouveaux choix mais conserve une affectation existante et dernière couleur.

#### 17. Erreurs et cas limites

Valeur retirée : pas de nouvelle affectation ; nom dupliqué/vide : conserver saisie et erreur ; échec persistance : conserver modale. Le message 4861:6145 mentionnant Exercices est incorrect : il doit viser les Séances.

#### 18. Accessibilité

Annoncer nom, sélection et action ; la couleur seule n’identifie pas une Étiquette. Focus captif dans confirmation puis retour à option/liste ; bouton destructif nommé.

#### 19. Invariants

Zéro ou une Étiquette ; couleur appartient au référentiel, propagée aux objets courants ; instantanés historiques immuables. Aucun parcours Composition→Catégories→Catalogue.

#### 20. Recette déterministe

Aucune/une sélection, changement/fermeture ; créer nom valide/vide/dupliqué et couleur ; renommer/recolorer ; supprimer valeur utilisée/inutilisée, Annuler ; conserver ancienne affectation et couleur ; abandonner Composition ne sauvegarde pas son affectation ; historique inchangé.

Vérifier icône sur ouverture, annulation et validation du panneau.

### Catalogue des séances — Objectif

Permettre à l’utilisateur de consulter son Catalogue de Séances, de le filtrer et le trier selon les fonctions disponibles, de créer une nouvelle Séance et d’accéder rapidement à la modification, à l’Exécution, à la consultation détaillée ou aux actions de gestion.

Cet écran constitue l’accueil de l’application.

### Catalogue des séances — Filtres

Le Catalogue présente le sélecteur `Exercices / Séances`, avec `Séances` sélectionné par défaut, `Exercices` actif en T03 et aucun segment `Parcours`. Sous ce sélecteur, la rangée commune `Créer / Filtrer / Trier` utilise les boutons contextuels de `34 pt`, pictogrammes `20 pt`, gaps `12 pt`, cibles ≥ `44 × 44 pt` sans chevauchement. Les panneaux ouverts de `Filtrer` sont définis dans Figma et contextuels au Catalogue. `Trier` reste visible mais désactivé en T03.

Les Catalogues du MVP ne comportent aucune recherche globale ni recherche locale. Les filtres restent contextuels au Catalogue et suivent les règles décrites ci-dessous.

Les Séances archivées restent exclues de la liste active et ne sont accessibles que par le mécanisme de filtrage prévu. T03 n’invente aucune option de filtre supplémentaire propre aux Séances au-delà de ce qui est explicitement arbitré.

### Catalogue des séances — Actions sur une carte

La carte distingue trois zones d’action :

- **zone principale de la carte** : ouvre la Séance en mode modification ;
- **chevron** : déploie ou replie la carte sans ouvrir l’Exécution ;
- **zone `Démarrer`** : ouvre l’écran initial d’Exécution.

La zone principale constitue une cible tactile large. Il n’est pas nécessaire d’afficher un bouton ou une icône `Ouvrir`.

### Catalogue des séances — Carte de Séance — vue déployée

**Révision du 06/11/2026 (D-507) :** lignes de cycle « Cycle » + « N passages » à droite ; lignes de circuit « Circuit · séries groupées » ou « Circuit · séries alternées » + « N tours » à droite ; volumes « 3 × 12 rép. ». [KODJO-Catalogues-cartes-modales-2026-11-06](../KODJO-Catalogues-cartes-modales-2026-11-06.md) §6.

Le déploiement est facultatif et permet de consulter les Exercices de la Séance sans changer d’écran.

La zone principale de la carte conserve la même action que dans la vue condensée : elle ouvre la Séance en mode modification. Le chevron sert uniquement à déployer ou replier la carte et la zone `Démarrer` ouvre l’écran initial d’Exécution.

Aucun bouton `Ouvrir` n’est affiché dans la vue déployée.

Chaque ligne d’Exercice présente :

- le nom de l’Exercice à gauche ;
- un groupe compact aligné à droite sous la forme `durée/reps · xN`. [Remplacé dans PRE-8 par R-E4, recette iPhone du 28/10/2026 (accepté par Hermann) : format de la synthèse d'occurrence, par exemple « 3 × 12 rép. », « 45 s ».]

`xN` n’est affiché que lorsque le nombre de Séries est supérieur à 1. En mode Répétition, l’abréviation `reps` est utilisée.

Exemples : `12 reps · x3`, `45 s · x2` ou simplement `30 s` lorsque le nombre de Séries vaut 1.

### Catalogue des séances — Création d’une Séance

Toucher l’action de création ouvre `Composer une séance`, qui réunit le nom, l’Étiquette/couleur et la Composition.

La création suit ensuite le parcours défini dans la section de navigation générale. `Continuer` valide la Séance ; l’ancien écran autonome de classification de la Séance n’est plus utilisé en sortie de Composition.

### Catalogue des séances — Actions secondaires

Sur une Séance active, un glissement gauche déplace visiblement la carte et révèle progressivement `Planifier`, `Dupliquer` et `Archiver` placés derrière. Au seuil d’ouverture, la carte se stabilise. Une seule carte peut exposer ses actions à la fois ; un glissement droit ne referme le contexte que s’il commence sur la carte ouverte.

Depuis le résultat du filtre `Archivées`, `Restaurer` affiche un snackbar `Séance restaurée` avec l’action `Annuler`.

### Catalogue des séances — État vide

Si aucune Séance n’a encore été créée, l’écran affiche : `Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.` Il présente également l’action permettant de créer la première Séance.

Le filtre `Archivées` possède également un état vide lorsque aucune Séance n’est archivée. Il conserve l’en-tête et les commandes du Catalogue, remplace la liste par un message d’absence de Séance archivée et ne propose pas d’action de suppression ou de restauration. [Message propre remplacé dans PRE-8 par R-E5, recette iPhone du 28/10/2026 (accepté par Hermann) : message générique « Aucune séance ne correspond aux filtres. ».]

Ces deux états sont fonctionnellement requis mais ne possèdent pas de frame dédiée dans le `Prototype MVP`. Ils réutilisent le composant d’état vide et la structure de leurs écrans parents ; aucune capture non issue de Figma n’est créée.

### Catalogue des séances — Confirmation — Confirmer la suppression d’une Séance archivée

L’action `Supprimer` est révélée par glissement gauche : la carte se déplace avec le geste et révèle l’action placée derrière.

Le dialogue flottant centré demande une confirmation explicite. `Annuler` ferme le dialogue et revient au résultat du filtre `Archivées`.

Le bouton destructif porte le libellé `Confirmer`. Dans l’application, sa confirmation supprime la Séance archivée tout en conservant les Exécutions historiques.

### Catalogue des séances — Confirmation — Confirmer l’archivage d’une Séance planifiée

Référence Figma : `4593:6285 — Modal — Confirmer l’archivage d’une séance planifiée`.

Cette modale est utilisée lorsqu’une Séance active possède des planifications associées. Elle indique que les planifications seront supprimées tandis que les Séances déjà effectuées restent dans l’historique. Les actions sont `Archiver` et `Annuler`.

### Composer une séance / Modifier une séance — Étiquettes — sélection et création en modale

La gestion des Étiquettes n’est plus un écran autonome de fin de parcours : elle est intégrée à la Composition de séance.

Références Figma courantes :
- `2028:11204 — Composition séance — Étiquettes` ;
- `4640:6308 — Composition séance — Nouvelle étiquette` ;
- `4581:6404 — Composition séance — Étiquette sélectionnée`.

### Composer une séance / Modifier une séance — Contenu et comportement

- l’action Étiquette ouvre une modale basse sur la Composition ;
- la modale affiche les Étiquettes disponibles et l’action `Nouvelle étiquette` ;
- toucher une Étiquette la marque sans fermer ; ✓ applique le choix et ferme la modale, puis son libellé s’affiche sous le nom de la Séance ; sa couleur devient la couleur de la Séance (D-355) ;
- `Nouvelle étiquette` ouvre la saisie `Nom de l’étiquette` dans la modale ; l’action d’envoi ajoute la nouvelle valeur aux choix ;
- les libellés visibles dans Figma (`Marathon`, `Hyrox`, `Vacances d'été`, `Challenge groupe`) sont des données de démonstration, pas des valeurs codées en dur ;
- la navigation et les autres valeurs déjà saisies dans la Composition sont conservées pendant l’ouverture/fermeture de la modale.

La validation de la Séance reste portée par l’action `Continuer` de la Composition ; l’Étiquette est enregistrée avec la Séance dans le même flux de validation.

### Champs et comportements des fonctionnalités — Catalogue de séances

#### Champs affichés

| Élément affiché | Type | Visible | Valeur / comportement | Action |
| --- | --- | --- | --- | --- |
| Commande `Créer` | Bouton | Toujours | Visible | Créer une Séance (D-187) |
| Filtre `Toutes` | Filtre | Toujours | Affiche toutes les Séances actives, planifiées ou non ; exclut les archivées | Filtrer |
| Filtre `Planifiées` | Filtre | Toujours | Séances ayant au moins une Routine | Filtrer |
| Filtre `Non planifiées` | Filtre | Toujours | Séances actives ne possédant aucune Routine | Filtrer |
| Filtre `Archivées` | Filtre | Toujours | Séances archivées uniquement | Filtrer |
| Carte Séance | Carte | 1 par Séance | Condensée ou déployée | Zone principale : ouvrir la Séance en modification |
| Chevron | Bouton | Toujours | Droite si replié, bas si déployé | Déployer / Replier uniquement |
| Nom de la Séance | Texte | Toujours | Nom enregistré | Aucune action spécifique distincte de la zone principale |
| Métadonnées Étiquette/Catégorie | Texte | Selon données disponibles | `Étiquette · Catégorie`, une seule ligne tronquée si nécessaire | Aucune |
| Nombre d’Exercices / durée | Texte | Toujours | Nombre d’Exercices (`0 exercice`, au singulier, pour une Séance sans Exercice, D-392) et durée synthétique des Exercices calculés ; Compte à rebours initial et Fin de séance exclus | Aucune |
| Circuit | Conteneur facultatif, multiple ; nature séries groupées/alternées, compte 1..99 défaut 1. Nombre → stepper révélé ; adjectif → choix de nature ; unité non interactive ; chevron accolé au nom → repli [08/11/2026 au soir, Hermann : « Circuit : mets le chevron entre le cercle et le nom du circuit » — chevron placé avant le nom, entre l’anneau et le nom] ; durée à droite. Voir la référence Composition du 28/10. |
| Dernière Exécution | Texte | Si disponible | Date relative | Aucune |
| Liste des Exercices | Liste | Carte déployée | Ordre de la Séance | Aucune |
| Résumé d’Exercice | Texte | Carte déployée | À droite : `durée/reps · xN` en uniforme ; en variable volumes séparés par points médians, unité finale, maximum trois valeurs selon place puis ellipse | Aucune |

#### Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Chargement | Les Séances sont affichées dès l’ouverture de l’écran. |
| `Toutes` | Affiche toutes les Séances non archivées. |
| `Planifiées` | Affiche les Séances disposant d’au moins une Routine. |
| `Archivées` | Affiche uniquement les Séances archivées. |
| Zone principale de la carte | Ouvre directement la Séance en mode modification. |
| Métadonnées | Sous le nom, affiche `Étiquette · Catégorie` selon les données disponibles et le rendu Figma actif ; même convention dans les archives. |
| Chevron | Sert exclusivement au déploiement / repli de la carte. |
| Carte déployée | Affiche la liste des Exercices ; la zone `Démarrer` conserve son action propre. |
| Actions d’une Séance active | Un glissement gauche révèle `Planifier`, `Dupliquer` et `Archiver`. |
| Modifier | Toucher la zone principale ouvre la Composition préremplie. |
| Supprimer | Disponible uniquement après archivage. Dans `Archivées`, un glissement gauche déplace la carte et révèle `Supprimer` derrière, puis ouvre une confirmation. Les Exécutions historiques sont conservées. |
| Archivage | Retire la Séance de `Toutes` et la rend accessible via `Archivées`. Sans Routine associée, l’action est immédiate, sans confirmation, puis affiche un snackbar `Séance archivée` avec `Annuler`. Si au moins une Routine est associée, une confirmation explicite est demandée ; après confirmation, seules les Routines à contenu unique dont la Séance est l’unique source relèvent de la suppression décidée. Effet multicontenu `À CLARIFIER` (RM-008) ; aucun snackbar d’annulation après confirmation. |

### Étiquettes de la séance — Éléments affichés

| Élément affiché | Type | Comportement |
| --- | --- | --- |
| Titre de modale | Texte | `Étiquettes` |
| Étiquettes proposées | Tags | Sélection de l’Étiquette de la Séance ; données démonstratives dans Figma |
| Nouvelle étiquette | Action | Ouvre la saisie `Nom de l’étiquette` |
| Nom de l’étiquette | Champ texte | Permet d’ajouter une nouvelle Étiquette via l’action d’envoi |
| Étiquette sélectionnée | Libellé dans la Composition | Affichée sous le nom de la Séance ; sa couleur devient celle de la Séance |

## Exercices

### CE-T03-02 — Catalogue des exercices — liste, filtres et cartes

**Historique, remplacé dans la cible du 27/10/2026 par la vue Un exercice de CE-T03-01.** Aucun catalogue autonome d’exercices à reconstruire. Les paragraphes conservés ci-dessous tracent le comportement antérieur.

> **Portée historique :** les restrictions de glissé de ce catalogue d’exercices ne décrivent pas le nouveau catalogue des mouvements. Son action Ajouter un niveau et son choix du sens en place sont régis par CE-MVT-02.

#### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S02–S12 |
| T03-E | E03, E07–E12, E32–E36, E58–E62, E73 |
| Frames | `3786:5093`  **Retiré du catalogue cible le 27/10/2026 ; preuve historique.** |
| Navigation | `6513:20151` |
| Nature | Nouvel écran T03 |
| Règles applicables | RM-041, RM-072, RM-095, RM-096, RM-103, RM-109, RM-112, RM-114, RM-159, RM-162, RM-188, RM-221, RM-243 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité ») |

L’ancienne référence `3787:5209` n’existe plus dans l’état Figma courant du 16 septembre 2026 et n’est plus une preuve active.

#### 2. Finalité fonctionnelle

Lister les ActivityDefinition ; filtres/archives, ouverture/modification et lancement direct. Format unique à gouttière permanente selon D-260/D-261, sans créer un mécanisme d’import.

#### 3. Contexte d’entrée

Segment Exercices depuis Catalogue ; retour éditeur ; retour Exécution directe ; retour archives. L’état du parcours courant est restitué.

#### 4. Contexte de sortie / destinations

Surface carte → `CE-T03-04`; Lecture → `CE-T03-09`; `Créer` → règle contextuelle `CE-T03-03` puis création directe `CE-T03-04`; Filtrer>Archivées → `CE-T03-05`; segment Séances → `CE-T03-01`.

#### 5. Données affichées et source de vérité


D-437/D-439 : la liste regroupe les définitions par mouvement ; chaque définition garde son identité et son résumé de paramètres, sans alias. La ligne de regroupement ne se lance ni ne s’insère sans sélection d’une définition précise. Deux duplicatas identiques peuvent être indiscernables jusqu’à modification. Les relations entre niveaux se naviguent depuis la fiche, séparément de ce regroupement.

Source : `ActivityDefinitionRepository` / `API-CAT-01`. Défaut : non archivées, `updatedAt DESC`. Exécuter ne modifie pas `updatedAt`. Le Catalogue n’affiche aucune récupération post-exercice, car elle n’existe pas sur `ActivityDefinition`; seule la Pause entre les côtés éventuelle relève de la définition.

Exercice variable : indicateur N séries variables et total intrinsèque selon [Calculs des durées et ordre des phases](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#calculs-des-durées-et-ordre-des-phases) ; pas de détail exhaustif des cibles sur la carte.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Noms, Catégories, Zones et paramètres sont des données métier ; les valeurs de la première carte ne sont jamais des constantes. Les pauses/récupérations et la prochaine planification ne sont pas des lignes de carte cible. Titres, segments et actions sont statiques.

#### 7. Structure de l’écran

Header → segmenté → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste scrollable → navigation. Carte : pastille de classement, titre/badge, valeurs, Lecture/Restaurer selon contexte, sans Déployer ; aucune barre verticale. Voir le complément Cartes du 30 septembre 2026.

#### 8. Éléments obligatoires

Pastille Catégorie colorée, Zones corporelles, titre et badge durée ; synthèse `N séries de X` / `N séries de N rép.` / `N séries à l’échec`, miroir 16 si bilatéral, indicateur de changement de côté sans direction (RM-243). Aucune pause/récupération ni prochaine planification affichée. Lecture indépendante ; aucun Déployer, avec ou sans média. Aucune poignée. Créer/Filtrer actifs, Trier désactivé.

#### 9. Layout déterministe


*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

Cartes standard : largeur 354 sur écran 402, rayon 8, fond #F9FAFC, bord intérieur 0,5 #CCD1E0, titre 15 Semi Bold ; classement pastilles 20, valeurs nues 16 ; aucune barre verticale. Références APRÈS6354:16089 / Photo 6354:16964. Les captures actualisées le 30/09 sont listées dans la matrice de couverture ; les fichiers hors remplacement restent historiques. Repliée 354 × 91. Gouttière permanente d’exercice : carré 64 à 12 du bord, photo si média ou icône de nature sinon, centrée et recadrée sans déformation (couverture vidéo), texte x88 ; titre250 en Catalogue replié/archivé, lignes basses207 ; Choix conserve sa largeur liée au contrôle ; hauteur inchangée ; place réservée pendant chargement/erreur, texte alternatif = nom de l’exercice. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). Durée Catalogue sans cadre, Inter Semi Bold12 #141414 à 16px du bord droit, présence selon [Résultats temporels et agrégation du circuit](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit) ; heure selon contexte, catégorie conservée, pictogramme de zone conservé ; Déployer absent. Séance avec visuel au Catalogue depuis le 27/10/2026 (CE-T03-01) ; autres contextes inchangés. Commandes 34/dessins 20/gaps 12/cibles 44. La référence Exercice Déployé est historique hors MVP, sans chemin d’accès.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

§4.2. Liste et cartes prennent largeur utile. Aucune recherche active ; `1992:10129` est une archive (D-221). Cibles ≥44 pour les commandes contextuelles visuelles hautes de 34 pt ; les cibles spécifiques de 48 restent conservées. Texte long peut passer sur plusieurs lignes selon DSF.

#### 11. États de l’écran

Liste active ; vide 4521:6220 ; filtre étendu Aucun ; filtre appliqué ; archives ; Trier désactivé ; carte glissée ; gouttière sans média/avec photo, sans Déployer ; chargement/erreur média ; retour restauré ; relance sans filtre. 4738:6355 illustre l’ancien assemblage média déployé, pas la cible Photo.

#### 12. Contrôles et interactions

Créer une variante/un niveau est accessible depuis le popover de niveau de la fiche : « Changer de niveau / Ajouter un niveau » (`9577:19843`) [remplacé par D-448 du 26/10/2026 : racine « Naviguer vers » (Catalogue en modification) ou « Changer de niveau » (séance et reprise), « Ajouter un niveau », « Réordonner les niveaux »]. Aucun Nouveau niveau dans les actions glissées : conserver Planifier / Dupliquer / Archiver (D-196). Nouveau niveau avant/après l’origine selon la difficulté déclarée [remplacé par la recette JA3 du 26/10/2026 (remarque r8-5 de Hermann) : « Du catalogue d'exercice, j'ouvre un exercice, j'appuie sur niveau > ajouter un niveau > plus difficile. Le nom n'est pas repris, ni l'invite grise. » « Ajouter un niveau » (Plus facile / Plus difficile) reprend le nom de l’Exercice d’origine avec l’invite grise « (compléter le nom) », comme la variante créée depuis le panneau ; l’unicité du nom s’applique (Terminer indisponible tant que le nom n’est pas complété) ; description et médias vierges, Catégorie, zones et paramètres repris. Source : `_bmad-output/pre7/implementation-artifacts/spec-r-10-recette-ja3-variante-crayon.md`.], ordre modifiable par glissement ; groupe réduit à un membre : rang et total masqués. Les corrections de contenu se partagent entre définitions ; aucune modification d’occurrence existante.

Surface carte = ouvrir/modifier ; Lecture = exécution directe. Aucun contrôle Déployer, visible ou invisible, quel que soit le média. La gouttière existe toujours ; le booléen Photo ne change que son contenu. Filtrer ouvre ses options ; Trier sans événement ; Créer ouvre directement la création persistante.

#### 13. Gestes

Swipe selon §4.7 ; pas de drag/appui long de carte Catalogue. Aucune zone de tap Déployer, avec ou sans média. Les commandes d’appui suivent D-237.

#### 14. Validation

Lecture seulement si définition exécutable. Filtrer>Archivées ne modifie aucune donnée. Trier reste désactivé quel que soit l’état de liste.

#### 15. Brouillon et persistance

Filtre/scroll = état UI mémoire du parcours. Aucun stockage persistant après relaunch. Aucun tri utilisateur persisté.

#### 16. Navigation et conservation d’état

Édition/Execution/Archives puis retour : restaurer filtre, tri implicite et scroll. Relaunch : perdre état et revenir globalement Séances.

#### 17. Erreurs et cas limites

Définition supprimée entre rendu et action : rafraîchir et indiquer indisponibilité. Filtre Archives sans résultat = état vide Archives, pas retour automatique aux actives.

#### 18. Accessibilité

Carte : `Ouvrir l’exercice <nom>` ; Lecture : `Exécuter l’exercice <nom>` ; vignette : nom de l’exercice. Aucune commande de déploiement ne doit être annoncée pour une carte d’Exercice. Trier désactivé/non déclenchable ; commandes contextuelles cibles 44 sans chevauchement. Troncature conserve la donnée complète.

#### 19. Invariants

Lecture indépendante ; aucune poignée ; carte à gouttière permanente sans Déployer et sans hausse de hauteur liée au média. Absence des pauses/récupérations/prochaine planification sur carte sans perte de données. Trier disabled, tri updatedAt DESC, règles Filtrer inchangées.

#### 20. Recette déterministe

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

Tester zéro/N cartes, active/archivée, avec/sans photo/vidéo, chargement/erreur, texte alternatif, troncature, sélection indépendante et absence de zone Déployer avec ou sans média. Vérifier formats des deux modes, miroir pour bilatéral et absence des textes retirés. Puis filtres, actions glissées, retour d’état et responsive. Critères CAR/MED/ICO/CTX/ANI du complément ([DSF — Cartes, icônes et animations d’appui](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md#critères-dacceptation-atomiques)).

Vérifier aussi les cartes variables dans les deux modes et la durée intrinsèque sans récupération contextuelle.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

### CE-T03-04 — Éditeur Exercice — créer / modifier

> **Portée historique PRE-7.** Les rubriques ci-dessous décrivent le formulaire livré avant la séparation des parcours. Pour créer/consulter/modifier un Mouvement, appliquer exclusivement CE-MVT-01 ci-dessus : elles ne prescrivent plus le shell Paramètres/Description/Média ni le crayon depuis une séance. Les annotations JA2/JA3 restent des traces de recette de l’ancien parcours, pas des instructions pour ce lot. Les paramètres d’exécution restent régis par CE-UI-10.

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). [bandeau répété dans ce chapitre, sans portée propre : même renvoi à D-445 que celui d’en-tête — annotation du 26/10/2026]

#### 1. Identification

Formulaire créer/modifier :3943:6064,4217:6980,5088:6398,3542:4656,4734:6342. Carte vide 6407:9458, résumé uniforme 6407:9702, variables 6665:27862/28050. Abandon 4714:6241. Feuille CE-UI-10 et référentiels CE-UI-09 ; inventaire courant du 03/10.

Phrase longue 7119:27855 et Bip 7059:13302 ; 7061:13383 supprimé ; copies 9b/10b7069:13464/13573. Relevé 06/10, captures dans chapitre 06.

Règles applicables : RM-033, RM-039, RM-041, RM-042, RM-058, RM-112, RM-113, RM-129, RM-131, RM-132, RM-152, RM-214, RM-215, RM-232, RM-236, RM-240, RM-243 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Créer/modifier un Exercice avec paramètres saisis dans la feuille basse. Le résumé de la carte est dérivé et sert de raccourci ; il ne contient aucun contrôle de saisie inline. Ajout/import de médias inclus au MVP dans PRE-3, avant le moteur d’exécution (D-333).

#### 3. Contexte d’entrée

Ouverture directement dans le formulaire ; paramètres locaux modifiables. Contenu du mouvement repris ou existant initialement en lecture seule, déverrouillable par crayon depuis Catalogue **et séance**. Le crayon édite le mouvement partagé, pas une copie locale de contenu. Catégorie/zones suivent ce contenu ; Niveau reste actif hors crayon. Mouvement neuf ou variante : contenu directement éditable.

#### 4. Contexte de sortie / destinations

Terminer valide et persiste puis retourne au contexte appelant. Carte Paramètres → CE-UI-10. Retour avec modifications → confirmation d’abandon existante. Création : « Abandonner la création ? » / « Les informations saisies seront perdues et l’exercice ne sera pas créé. ». Modification : « Abandonner les modifications ? » / « Les modifications apportées à cet exercice seront perdues. ». Annuler conserve le brouillon ; Confirmer abandonne les changements.

#### 5. Données affichées et source de vérité

Deux modes communs, cible typée par Série et régime conservé. Phrase régénérée depuis les cibles mixtes, total issu du moteur (≥ si mélange calculable). Les huit cartes catalogue tout échec conservent leur formulation.

Phrase selon les 276 cas v15, total fourni par le calcul métier. Générateur → segments ordonnés `{texte, gras}`, valeurs et unités en gras, aucun redécoupage de chaîne. Terme « pause après chaque série », y compris N=1 ; clause de pauses variables omise conformément au corpus. Lorsque la charge est active, la phrase inclut sa mention selon RM-240 ; avec Sans, aucune mention de charge.

Brouillon parent : nom, référentiels, description sous forme de séquence ordonnée d’étapes (D-425), paramètres validés par la feuille et associations médias ordonnées, existantes ou ajoutées dans PRE-3 (D-333). Aucun texte de démonstration codé en dur.

Paramètres étendus : uniforme/variable, liste ordonnée de cibles/Pauses, changement de côté (Avec / Sans, D-406) et Ordre des côtés, activation et valeurs de la charge (RM-236) ; copie complète vers CE-UI-10.

Import média : accès depuis la zone Média et sauvegarde avec l’Exercice. Tester import nominal/annulé/en erreur, conservation à la réouverture, ordre et copies indépendantes selon D-333. Sources système, formats, permissions et présentation des états non représentés : À CLARIFIER dans le plan, sans inventer de caméra ni de limite.

La collection inclut le bip commun 0..10 de chaque Série. Phrase dérivée des paramètres appliqués et du résultat de calcul intrinsèque, jamais sauvegardée comme vérité indépendante.

#### 6. Classification des valeurs Figma

Créer un exercice/Modifier un exercice, Paramètres d’exécution, Description de l’exercice, Terminer : statiques. Nom et résumé : dynamiques. Compte à rebours/Fin restent séparés de la phrase intrinsèque ; le Mode n’a pas de champ propre sur la carte et reste visible dans la phrase (décision PRE-4 Q23 du 16/10, D-385).

Le champ du mode à droite du titre de la carte, visible sur 7059:13302 et 7119:27855, est retiré : la carte forme une seule zone touchable qui ouvre la feuille ; le Mode reste visible dans la phrase et se choisit dans la feuille, par la ligne Mode (décision PRE-4 Q23 du 16/10, D-385 ; la présentation par popover est remplacée par D-413). La phrase reflète les paramètres appliqués ; les montants statiques des copies ne sont pas des valeurs par défaut.

#### 7. Structure de l’écran


En-tête fixe → bandeau de contexte (nom, Catégorie, Zones corporelles) → carte Paramètres (état non renseigné ou synthèse calculée) → Description en étapes numérotées → Média → Terminer. Compte à rebours et Fin relèvent de la feuille Paramètres d’exécution CE-UI-10 et ne sont pas des lignes autonomes du formulaire principal (D-413). Réutiliser le shell existant.

#### 8. Éléments obligatoires


Nom de l’exercice ; accès aux catégories et zones corporelles ; zone Description à étapes numérotées avec première invite « 1. Décrivez la première étape », puis invite « Étape suivante », affichée seulement quand le champ Description est actif et masquée au repos sans suppression d’étape (D-447) ; zone Média ; carte Paramètres vide ou résumée ; action Terminer dont la disponibilité suit la validité du brouillon. Après ✓ de la feuille, la carte affiche une phrase unique avec valeurs en gras, énumération jusqu’à 3 puis min/max selon [Phrase de synthèse des paramètres](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrase-de-synthèse-des-paramètres). La zone Paramètres entière ouvre CE-UI-10 ; aucun segment/raccourci autonome dans la phrase. Les réglages Compte à rebours et Fin se trouvent dans CE-UI-10 (D-413).

#### 9. Layout déterministe

Shell conservé : en-tête fixe, bandeau nom/référentiels, carte Paramètres, Description, Média, action Terminer. « Terminer » est la référence du bouton d’action principal standardisé de D-444 : fixe en bas de l’écran, centré verticalement dans sa zone protégée, sous un dégradé blanc pleine largeur. Complément du 23/10 : rangée Catégorie / Zones / Niveau, espacement 12 pt et marges latérales 6 pt ; zones élastiques tronquées, valeur intégrale accessible. Pastille « Niveau X », total dans le choix ; pas de rang pour un singleton ou un mouvement sans groupe. Confirmation en dialogue centré `9952:44349`, avec états `10253:20414` et `10257:20651` ; cibles tactiles ≥ 44 × 44, indépendantes des boîtes d’icônes. Références 3943:6064/4734:6342/6407:9702 et 6665:27862/28050. Les deux nouveaux résumés gardent cette implantation ; le texte peut grandir, sans déplacement arbitraire des contrôles. Feuille selon DSF-SERIES-VARIABLES-2026-10-02, actualisé le 03/10.

Phrase : Inter 13, interligne 20, texte sombre et valeurs en gras ; largeur 324/x39 dans la référence 402. *Remplacé par les arbitrages G-1 à G-10 de Hermann du 19/10 (G-6) : Inter Regular 14, interligne 20, dans un bloc `#F9FAFC` de rayon 12 sans liseré, sans Compte à rebours ni Fin (R-14).* Hauteur auto et retour naturel ; le contenu inférieur suit la croissance. Aucune limite de 198/211 caractères. Le layout du shell reste celui des frames du formulaire.

Icônes Catégorie et Zones : états contour/plein de la planche 7245:13718 ; une seule silhouette, issue du Profil, jamais deux boutons homme/femme dans l’éditeur. *Remplacé par les arbitrages G-1 à G-10 de Hermann du 19/10 (G-5) : glyphes pleins au repos (`8328:35698`), une seule forme de classification pour « à renseigner » et « renseigné ».*

Arbitrages G-1 à G-10 de Hermann du 19/10 (registre, chapitre 07), pour cet écran seulement : en-tête titre Inter Medium 17 `#3A3A3F`, ✕ à 12 du bord dans un cercle 38 `#FCFCFE` à liseré blanc et ombre (G-1) ; bandeau → première section 14, titre de section → contenu 10, entre sections 16, à la place de D-327 (G-2) ; placeholder du Nom en texte principal (G-3) ; Nom Semi Bold 20, interligne 22 (G-4) ; aucun titre « Médias » visible, identification VoiceOver conservée (G-7) ; Terminer de 48 avec ombre `#1A1A26` 18 %, bas à 24 du bas de l’écran (G-8, G-10) ; dialogue d’abandon : titre Semi Bold 18, message Regular 14 interligne 21 (G-9).

Référence longue 7119:27855 :224caractères, cinq lignes/100px à largeur 324, carte 193px en AUTO. Contenu et contrôles suivants suivent la hauteur intrinsèque, sans plafond.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440, Safe Areas, texte agrandi et clavier. Formulaire défilant ; Terminer accessible. Feuille ouverte : formulaire parent inerte et hors parcours de focus.

#### 11. États de l’écran

États : nouveau mouvement sans groupe ; rapprochement sous le nom ; nom déjà utilisé ; reprise verrouillée ; contenu partagé en édition ; variante avec catégorie/zones reprises et description/médias vierges ; dialogue nom modifié avec zéro/autres exercices et historique présent/absent ; confirmation nom inchangé selon MFN-08 ; paramètres seuls ; erreur DB ; autre exercice devenu incomplet. Les frames du 25/10 illustrent le rendu ; D-445 définit les conditions. Confirmer absent dans 9952:44349 et classification vide dans 10187:20340 sont des écarts à corriger dans Figma.

#### 12. Contrôles et interactions


Dans Description, Entrée ajoute l’étape numérotée suivante (D-425) ; aucun bouton « Ajouter une étape ». Le bouton ↑ ferme le clavier sans enregistrer l’Exercice (D-351 partiellement maintenue). Le traitement des étapes vides et l’application du plafond historique de 1 000 caractères à une séquence restent À CLARIFIER ; aucune valeur par étape n’est inventée. Toucher la zone Paramètres ouvre CE-UI-10. Aucun mot ou nombre de la phrase ne sélectionne une ligne indépendamment. ✓ applique au brouillon et régénère ; ✕ conserve le brouillon ; Terminer persiste atomiquement.

**Décision de Hermann du 26/10/2026 (recette JA, R2) :** nom en saisie : le premier appui dans le corps défilant ferme seulement le clavier, sans ouvrir la Feuille ni la Description ; la rangée Catégorie / Zones / Niveau garde son comportement.

#### 13. Gestes

Tap, saisie et défilement du formulaire. Toucher une tuile Média la consulte : vidéo lue en plein écran par le lecteur natif de la plateforme (iOS sur iPhone, Android sur Android, D-393), sans lecture automatique ; photo ouverte en plein écran. Appui long sur la tuile : menu contextuel natif Retirer / Monter / Descendre, avec actions VoiceOver équivalentes sur iOS et actions d’accessibilité natives TalkBack sur Android (D-400) ; aucun bouton ajouté sur la tuile (décisions PRE-4 Q27 et Q31 du 16/10, D-385). Pas d’autre geste métier.

#### 14. Validation

Les paramètres restent directement modifiables. Le crayon ouvre un brouillon du **mouvement partagé** depuis le Catalogue, une reprise en création ou une occurrence de séance. Nom, alias, description, médias, catégorie, zones et structure des phases sont du contenu ; la commande Niveau reste active indépendamment du crayon.

À l’enregistrement d’une modification d’un mouvement existant :

| Condition | Dialogue / résultat |
|---|---|
| Nom modifié, avec ou sans autre exercice et avec ou sans historique | Toujours : Mettre à jour ce mouvement / Créer un nouveau mouvement / Annuler ; choix explicite, sans présélection |
| Nom inchangé, contenu modifié, au moins un autre exercice lié ou une exécution enregistrée | Confirmation de mise à jour uniquement : Annuler / Confirmer |
| Nom inchangé, contenu modifié, ni autre exercice lié ni exécution enregistrée | Sauvegarde silencieuse du même mouvement |
| Aucun changement de contenu ; paramètres seuls ; reclassement seul | Aucun dialogue de mouvement |

Le changement de nom est une modification du nom effectivement enregistré ; une variation de casse ou d’accent peut donc être une correction à confirmer, même si la clé d’unicité reste identique. Le contrôle d’unicité exclut l’identité en cours d’édition ; une création distincte doit disposer d’une clé différente des mouvements existants.

« Autre exercice » couvre les définitions Catalogue et les occurrences persistées de séance utilisant le mouvement, hors objet édité ; les lignes sont comptées une fois, sans multiplication par les séries, tours ou planifications. Les occurrences historisées sont traitées par la condition d’existence d’une exécution, pas ajoutées au compteur d’exercices. L’existence se recherche par identité de mouvement, pour SESSION comme ACTIVITY, et non par nom. Une séance simplement enregistrée n’est pas une exécution passée. Aucun indicateur d’utilisation irréversible déclenché par insertion n’est requis.

Le dialogue indique la portée réelle et le nombre d’autres exercices concernés ; zéro autre exercice ne masque pas l’enjeu historique. Un renommage corrigé conserve l’identité : les anciens et nouveaux noms peuvent légitimement partager leurs performances. Créer un nouveau mouvement conserve l’original et rattache l’exercice édité à la nouvelle identité. Depuis une séance, ce choix remplace l’occurrence par une nouvelle occurrence dans le brouillon ; les exécutions antérieures gardent leur filiation. Le rattachement éventuel à un groupe reste explicite. [arbitrage de Hermann du 26/10/2026 (Q10) : aucun rattachement automatique au groupe après « Créer un nouveau mouvement » ; rattachement ultérieur par C08, différé]

Annuler conserve le brouillon et ne persiste rien. Confirmer reste visible mais indisponible avant sélection lorsqu’un choix est requis. Une variante explicitement choisie et un mouvement neuf sont des créations : pas de seconde question sur la correction de l’origine. Aucun bouton additionnel de création distincte dans l’édition n’est ajouté ; la recommandation antérieure de ce second mécanisme est retirée. L’application ne déduit pas la différence sémantique entre correction et nouveau mouvement.

Nom requis et unique ; catégorie et zones selon validations existantes. Paramètres complets pour l’exercice directement édité. Une modification de phase peut laisser d’autres exercices explicitement incomplets, à compléter avant lancement ; aucun chiffre inventé.

#### 15. Brouillon et persistance

Une `ActivityDefinition` référence directement un mouvement et porte ses paramètres propres. Une `SessionActivity` possède son identifiant et référence **directement le mouvement**, sans dépendance de contenu envers l’exercice Catalogue ; elle porte une copie locale complète des paramètres au moment de l’insertion, puis les conserve indépendamment. Elle ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases.

Les corrections du Mouvement local, partagé entre les Exercices et Séances de la même installation, sont visibles à leur prochaine lecture ; aucune propagation entre copies d'objets locaux n’est nécessaire. La distribution entre utilisateurs est régie par BIB-12 : pas de nouvelle révision sans action « Mettre à jour ». Modifier les paramètres Catalogue ne modifie pas ceux des séances. Supprimer ou archiver la définition Catalogue ne casse pas les occurrences.

Au démarrage, résoudre le contenu courant avec les paramètres de l’exercice puis construire un instantané autonome. Cet instantané, l’exécution déjà démarrée et les historiques ne changent plus avec le mouvement. Leur `sourceMovementId` conserve l’identité exécutée, sans rang stocké ; la classification actuelle peut être résolue séparément à la lecture.

Les relations actives vers le mouvement doivent rester intègres, depuis les définitions **et les occurrences de séance**. L’absence de contrainte référentielle et la tolérance d’orphelins concernent la filiation des instantanés, pas le contenu vivant. La suppression explicite d’un mouvement encore référencé par un exercice est interdite ; son parcours reste dans C08. La suppression du dernier exercice ne supprime jamais le mouvement : un mouvement peut exister sans exercice et reste recherchable.

Le crayon ne persiste rien. [remplacé par la recette JA3 du 26/10/2026 (remarque r9-5 de Hermann), sur une occurrence de séance : le crayon retouché après changement inscrit la correction retenue dans le brouillon de la séance (jamais en base avant l’enregistrement de la séance) ; voir la note ci-après.] Terminer valide le brouillon et applique l’opération atomiquement ; Annuler le dialogue conserve le brouillon. [D-448 du 26/10/2026, point 10 de `_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-recette-ja2-d448.md` : sur une occurrence de séance, le crayon reste affiché, à l’état actif, pendant l’édition du mouvement ; le toucher à nouveau quitte l’édition. La confirmation ne concerne que le contenu du mouvement (nom, description, médias, catégorie, zones) et la structure des phases (nombre, identités, libellés) : sans changement de ces éléments depuis le déverrouillage, retour immédiat au contenu verrouillé, les autres paramètres saisis étant conservés ; sinon, confirmation « Abandonner les modifications ? » — Confirmer restaure ce contenu et cette structure d’avant le déverrouillage, sans toucher aux autres paramètres, et reverrouille ; Annuler laisse l’édition ouverte. Les crayons du Catalogue et de la reprise gardent leur comportement (masqués une fois le contenu déverrouillé).] [remplacé par la recette JA3 du 26/10/2026 (remarque r9-5 de Hermann) : « Le message devrait être "Vous avez modifié ce mouvement" avec "X autres exercices utilisent ce mouvement, cette modification s'appliquera à tous." avec les boutons "Annuler" en gris et "Confirmer" en bleu Kodjo. » Sur une occurrence de séance, avec changements du contenu du mouvement ou de la structure des phases, le crayon retouché applique la décision de sauvegarde C03 de Terminer, et non plus « Abandonner les modifications ? » : nom modifié → deux choix ; mouvement partagé → « Vous avez modifié ce mouvement » avec le nombre d’autres exercices, Annuler / Confirmer ; mouvement non partagé → aucun dialogue. Après Confirmer, ou sans dialogue, la correction est inscrite dans le brouillon de la séance (toutes les occurrences du mouvement la montrent), le contenu est reverrouillé et l’éditeur reste ouvert ; cette correction inscrite est conservée à la sortie de l’éditeur (la confirmation d’abandon de la sortie ne la retire pas) ; rien n’est écrit en base avant l’enregistrement de la séance. Annuler laisse l’édition ouverte ; Terminer est inchangé. Source : `_bmad-output/pre7/implementation-artifacts/spec-r-10-recette-ja3-variante-crayon.md`.] Aucun compteur irréversible d’usage à l’enregistrement d’une séance. Les phrases de synthèse restent dérivées des paramètres, jamais persistées comme vérité indépendante.

#### 16. Navigation et conservation d’état

Retour au Catalogue restauré en contexte définition ; au contexte Composition en contexte copie. Les Exécutions historisées ne sont jamais modifiées.

#### 17. Erreurs et cas limites

Échec DB : conserver brouillon, rester éditeur et permettre nouvelle tentative. Source supprimée en parallèle : signaler erreur sans recréation implicite. Aucun contenu de démonstration en remplacement des données manquantes.

#### 18. Accessibilité


Un focus pour la zone de phrase, label Modifier les paramètres d’exécution, lecture intégrale ; aucune valeur estimée annoncée comme saisissable. Restituer le focus au retour.

#### 19. Invariants

Aucune édition inline de la phrase. Mode/nom exclus de la phrase intrinsèque ; pas de total À l’échec. Calculs selon [Calculs des durées et ordre des phases](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#calculs-des-durées-et-ordre-des-phases), D-248 ; D-242 supersédée ; import de médias livré dans PRE-3 selon D-333, sans anticiper le moteur de lecture en exécution. Aucun enregistrement à la simple fermeture de feuille.

#### 20. Recette déterministe


Recette complémentaire : scénarios du [relevé Figma MFN du 23/10](../DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md) (reprise, variante sans dialogue, recherche locale, comptes dynamiques, annulation, rangs, responsive), puis MFN/AC01 à MFN/AC37 du chapitre 10 ; vérifier notamment comptage des frères, annulation sans résidu, absence de fusion et exclusion des frères incomplets du lancement. Recette applicative à exécuter lors de l’implémentation.

Après✓ tester mélange chiffré/échec et ≥, puis annulation et édition d’une copie ; tout échec reste sans total. La formulation de fond divergente de 8328:38848 est une réserve Figma, pas une autorité métier.

Recette rédactionnelle :276 gabarits v15 avec total métier injecté, gras sur occurrences répétées d’une valeur, N1 avec pause mentionnée et total non redondant ; absence de troncature. Français au MVP ; i18n nécessite des gabarits et accords par locale, pas une traduction de fragments isolés. Phrase avec charge : « (charge : 10 kg) » et « (charge : 1,25 kg) », « (charges : 20, 12, 13 kg) », « (charges : 20, 12 kg, ...) » au-delà de trois séries, « (charges : 0, 10, 15 kg) » avec une série à zéro, mention après la valeur par série, Sans sans mention, Sans puis Avec restaurant la valeur (RM-240, D-414, RM-236).

Tester vide→feuille→annuler sans changement ; feuille valide→résumé→Terminer ; zone de phrase entière ; modification annulée ; deux modes, deux ordres bilatéraux et PC=0 sans repli ; source disparue/erreurDB ; champs/référentiels requis ; lecture seule Total Répétitions. Vérifier différences entre exemple Figma et données recalculées.

Sauvegarder/réouvrir après bascules, déplacement et N1 ; vérifier indépendance copie Catalogue/Séance et résumé v13.

Bip 0/1/10, supprimer puis annuler/confirmer, phrase à 3/4cibles, singulier et changement de côté désigné côté 1 / côté 2, sans direction anatomique (RM-243), omission Répétitions sans bip/À l’échec ; redondance N1 Durée unilatérale, texte agrandi. Le classeur teste la formulation avec un total fourni, jamais les calculs.

Vérifier état repos/activé à ouverture/fermeture du panneau et symbole du total selon D-305.

Corpus v15 :276gabarits, total métier injecté ; aucun changement grammatical vs v14. Tester virgule jamais isolée en début de ligne, cas 144 long et ordre des cibles après déplacement. Les cas de brouillon incomplet restent hors des 276sorties validées.

Recette phases : création/repli ; ajout libre6→6+6 ; format20→20+0→12+8 ; suppression5+7+8→5+15 ; déplacement sans modification du total ; dernière supprimée→durée simple ; six phases ; libellé20/vide ; zéro conservé comme durée manquante, enregistrement bloqué ; annulation complète ; adaptation15+15→10+10 et6+3→13+7 avec message ; total3×(6+3+15)=72s ; ancien objet inchangé. [remplacé par PHC-20261026 et D-446 du 26/10/2026 pour les cas de format, de suppression avec transfert, de dernière phase supprimée et d’adaptation proportionnelle : durées de phase jamais recalculées, cible de série indépendante ; recette PHC/AC01–12] Recette applicative non exécutée par la présente mise à jour documentaire.


### CE-T03-05 — ActivityDefinition — archiver / restaurer / supprimer

#### 1. Identification

Cycle de vie Exercice ; carte archivée du composant 6214:7278, panneau 4168:11262. Patrons de Séance 2234:88 et 1992:10848 illustrent les actions, sans constituer une frame archive Exercice.2234:189 ne prouve pas son dialogue de suppression.

Règles applicables : RM-095, RM-120, RM-162, RM-188, RM-206 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Gérer le cycle de vie d’une définition persistante : archiver depuis active, puis restaurer ou supprimer définitivement depuis Archives, sans cascade.

#### 3. Contexte d’entrée

Archiver : action contextuelle sur carte active. Archives : `Filtrer > Archivées` depuis CE-T03-02. Restaurer/Supprimer : depuis carte archivée.

#### 4. Contexte de sortie / destinations

Archiver → reste Catalogue actif avec carte retirée ; Restaurer → reste vue Archives, carte retirée après succès ; Supprimer confirmé → reste Archives recalculées.

#### 5. Données affichées et source de vérité

ActivityDefinition + statut/archivedAt éventuel. Copies Session et historique ne pilotent pas la carte.

#### 6. Classification des valeurs Figma

Nom/paramètres = dynamiques. Libellés Archiver/Restaurer/Supprimer/confirmation = statiques. Valeurs des Séances du pattern = démonstration et ne doivent pas être reprises.

#### 7. Structure de l’écran

Catalogue filtré Archives, cartes archivées et actions de cycle de vie ; confirmation destructive centrée. Panneau Filtrer représenté par 4168:11262 ; variante archive du composant existante, écran complet archive non fourni.

#### 8. Éléments obligatoires

Accès Archives via Filtrer ; Restaurer ; Supprimer uniquement depuis Archives ; confirmation avant suppression définitive ; feedback succès selon pattern commun.

#### 9. Layout déterministe

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

Variante archivée : fond `color/surface #F5F7FA` (ancienne prescription `#F6F6F6` historique ; référence couleur centralisée au chapitre12), bord #D9D9D9 à 0,5, même rayon/ombre ; Restaurer remplace Lecture. Avec média, RG-4 et RG-11 à RG-13 s’appliquent ; aucune prochaine planification. L’état existe dans le composant sans écran d’archive d’exercice dédié ; ne pas déclarer un écran Figma créé.

Actions destructives : token danger#D92D20 ; séparateurs#E0E3E8 et labels par rôle DSF. Aucune reprise des anciens rouges locaux.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; cibles ≥44 (dimensions spécifiques 48 conservées) ; liste scrollable ; aucun clavier de recherche.

#### 11. États de l’écran

Active ; swipe Archiver ; Archives avec N ; Archives vide ; Restaurer succès ; confirmation Supprimer ; suppression succès ; erreur écriture.

#### 12. Contrôles et interactions

Filtrer ouvre Archives ; Archiver/Restaurer exécutent action atomique ; Supprimer demande confirmation ; Trier demeure disabled même dans Archives.

#### 13. Gestes

Swipe selon §4.7. Actions accessibles par tap. Aucun drag.

#### 14. Validation

Supprimer autorisé seulement si archivée. Restaurer seulement si archivée. Archiver seulement si active.

#### 15. Brouillon et persistance

Actions écrivent immédiatement de façon atomique après confirmation requise. Filtre Archives n’est qu’état UI. Suppression ne cascade pas.

#### 16. Navigation et conservation d’état

Filtre Archives et scroll conservés pendant la session courante. Après restaurer/supprimer, rester Archives. Au relaunch, le filtre revient à `Aucun`.

#### 17. Erreurs et cas limites

Archivage avec Routines ACTIVITY : confirmation avant suppression des planifications futures ; Annuler ne modifie ni définition ni Routines. Suppression définitive depuis archives : aucune cascade vers les copies de Séance ou l’historique. Une erreur de transaction restaure la liste et l’état antérieur. La variante carte archivée existe sans écran complet dédié : limite de preuve acceptée.

#### 18. Accessibilité

Actions nommées ; Supprimer annoncé destructif ; dialogue focusé ; filtre Archives annoncé actif ; équivalents aux mouvements disponibles.

#### 19. Invariants

D-445 : supprimer une définition conserve le mouvement et les occurrences qui le référencent directement. Intégrité active depuis définitions et occurrences ; aucun ramassage automatique. Les instantanés sont autonomes, leur filiation peut rester orpheline après une suppression explicitement permise.

Suppression seulement Archives ; aucune suppression de SessionActivity, snapshot, Result ou Execution ; accès Archives via Filtrer ; Trier disabled.

#### 20. Recette déterministe

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

Archiver/restaurer/supprimer une définition non planifiée puis planifiée ; confirmer/annuler ; vérifier Routines futures retirées à l’archivage confirmé, copies et instantanés conservés. Restauration ne recrée pas les Routines supprimées. Vérifier double tap, échec atomique, filtre archives vide, absence Lecture dans l’état archivé.

### Catalogue des exercices

La frame `3786:5093` utilise le même Screen Shell et le même contrôle de type que le Catalogue des Séances, avec `Exercices` sélectionné. La liste contient les Exercices persistants et conserve filtres, tri implicite et position de défilement dans l’état de navigation du parcours courant.

La rangée `Créer / Filtrer / Trier` est identique au Catalogue des Séances : boutons contextuels `34 pt`, pictogrammes `20 pt`, gap `12 pt`, cibles tactiles ≥ `44 × 44 pt` sans chevauchement. `Filtrer` propose les critères contextuels validés et ses panneaux ouverts sont définis dans Figma ; `Trier` reste visible disabled.

Chaque carte utilise la nouvelle grammaire DSF : aucune barre verticale ; la couleur de Catégorie est portée par sa pastille dans le Catalogue. Sa surface principale ouvre la consultation ou la modification ; le bouton Lecture, dans une cible séparée, lance uniquement l’Exécution directe. La carte d’Exercice possède un seul format à gouttière permanente de 64 px dans le Catalogue : photo associée ou icône de nature sans média. Aucun Déployer avec ou sans média ; Lecture reste indépendante. Chargement/erreur conservent la place réservée, texte alternatif = nom de l’exercice. Un glissement gauche expose `Planifier / Dupliquer / Archiver` sur les Exercices actifs et `Supprimer` dans les archives. Aucune poignée de déplacement n’est affichée.

Titre 15 Semi Bold, durée sans cadre en haut à droite, seulement si calculable, classement Catégorie puis Zones, valeurs 16 et synthèse `N séries de X` / `N séries de N rép.` / `N séries à l’échec`. Bilatéralité par miroir 16 à 12 après la synthèse. Aucune pause/récupération ni prochaine planification affichée. Format unique : carte 354 × 91, gouttière 64 à 12, titre x88/largeur250, lignes basses de largeur 207, catégorie conservée et pictogramme de zone conservé. Variante archivée : fond `color/surface #F5F7FA` (ancienne prescription `#F6F6F6` historique ; référence couleur centralisée au chapitre 12), bord #D9D9D9, Restaurer ; l’absence d’écran d’archive dédié est acceptée. Ces règles valent aussi derrière les panneaux de filtres et dans les états glissés ; les actions suivent la hauteur de la carte.

États Figma complémentaires de la famille Catalogue des Exercices :

- `4521:6220 — Catalogue des exercices — État vide` ;
- `4168:11262 — Catalogue des Exercices — Filtrer — Panneau ouvert` ;
- `4544:6344 — Catalogue des Exercices — Liste — Filtre inactif étendu` ;
- `4544:6651 — Catalogue des Exercices — Liste — Filtre actif étendu` ;
- `4738:6209 — Catalogue des Exercices — Liste — actions glissées` ;
- `4738:6355 — Catalogue des Exercices — Liste — Première carte déployée — Média` : référence historique hors MVP (D-261).

La frame `4534:6339 — Catalogue des Exercices — Filtre — États du contrôle` est une planche de référence du contrôle, pas un écran utilisateur autonome.

L’ancienne référence Figma `3787:5209 — Catalogue — action contextuelle directe` n’existe plus dans l’état courant et n’est plus une preuve active. Aucun état de remplacement n’est inventé.

## Paramètres d’exécution

### CE-UI-10 — Paramètres d’exécution — feuille basse

**Révision 06/11/2026 (décision de Hermann, constat c ; registre ch07, « Recette iPhone du 06/11/2026 ») :** « Paramètre d'exécution : n'utiliser que le clavier pour entrer les valeurs des champs, plus aucune roulette ou popover. » Toutes les valeurs de la feuille (séries, cible commune, durée de l'exercice, récupération, pauses, compte à rebours, fin, cadence « Autre », nombre de phases) se tapent dans leur champ, avec la barre au-dessus du clavier des Formats (Précédent, Suivant, Fermer) ; bornes appliquées à la saisie. Les mentions de roulette, de panneau de roue et de ± de cette feuille ci-dessous sont remplacées ; les contrôles segmentés et le menu Enchaînement restent.


**Complément Formats actif :** Tabata et 30/30 standards modifiables ; contraintes effectives des Formats spécialisés selon CE-FMT-04 et la référence du 02/11.

#### 1. Identification

<a id="parametres-execution-etat-cible"></a>

**État cible — création et modification.** Quand la Durée de l’exercice est calculée et non modifiable, notamment en séries variables, sa valeur utilise Inter 13 px Semi Bold, en noir, sans pastille. Le bleu désigne les valeurs modifiables ; le gris désigne les valeurs verrouillées par un Format. Le rendu d’une durée modifiable, les calculs, les symboles ≈/≥, les états « — »/« Non calculable » et le chevron gardent leurs règles existantes.

La Récupération après exercice appartient directement à l’Exercice dans le modèle cible de Séance. La ligne Récupération de la modale Paramètres d’exécution est son unique accès de saisie et de modification ; la Composition affiche exactement cette même valeur, sans objet Récupération autonome ni valeur concurrente. Le bouton Pause / Ajouter un arrêt ne propose que les Points d’arrêt : aucun ajout, réglage ou retrait de récupération par Placement. À la création d’un nouvel Exercice, sa Récupération reprend « Récupération après un exercice » du Profil ; 30 s n’est pas une constante. Modifier un Exercice conserve sa valeur ; un ancien Exercice sans récupération affiche 0 s sans recevoir le défaut du Profil. Déplacement et duplication conservent la récupération de l’Exercice. À 0 s, aucune récupération n’est exécutée ; les règles existantes de Pause terminale, d’ordre avant Point d’arrêt et de répétition dans un Circuit restent applicables. Les anciens instantanés, exécutions et données historiques restent lisibles sans réécriture ; la règle historique « aucune récupération post-exercice en ACTIVITY » reste limitée à cet ancien parcours, sans réintroduire un Exercice autonome dans la cible. Toute valeur initialisée depuis un défaut du Profil est présentée dans son cadre à fond orange dans Paramètres d’exécution jusqu’au premier ✓ validant les paramètres de cet Exercice. La règle est générale : elle vise chaque défaut du Profil effectivement repris, pas seulement Récupération. Ouvrir ou fermer la feuille ne vaut pas validation ; ✕ annule les changements et conserve l’état antérieur. ✓ applique les valeurs et leur état validé au brouillon parent ; une réouverture après ce ✓ utilise le rendu normal. La sauvegarde définitive reste celle de la Séance ; abandonner le brouillon restaure l’état enregistré. Changer ultérieurement le Profil ne réinitialise pas les paramètres d’un Exercice existant. Les constantes imposées par un Format ne sont pas des défauts Profil. Le fond orange n’altère ni la valeur ni les règles de calcul, ni les couleurs du texte éditable/verrouillé.

Évidences Figma courantes : `8328:37972`, `8328:38193`, `9207:18817`, `8328:38632`, page Prototype MVP du fichier `G6RY5Ebhgwb4AHIOYDwwvg`. Les libellés « Phases du mouvement » et « De chaque côté » suivent les décisions explicites, indépendamment des noms de nœuds. « Objectif de durée » s’applique aussi en l’absence de frame dédiée au cas demandé.

Feuille Paramètres d’exécution de CE-T03-04. Références courantes (relevé du 18/10/2026, D-403 à D-413) : 9289:17849 (charge commune), 9290:17953 (séries variables avec charge), 9292:18077 (séries variables avec charge, clavier numérique), 9307:18208 (Durée de l’exercice déployée), 8328:37862 (Durée d’une série, roulette numérique seule), 9232:44646, 8470:13303 (séries variables, cas mixte), 8328:36923 (champs vides), 8328:37092 (Mode, sélection segmentée), 8328:37972 (Changement de côté replié), 8328:38193 (Changement de côté déployé), 8328:39072 (une seule série), 8328:38084 (roulette de la ligne Durée de l’exercice), 8328:38632 (séries variables en Répétitions avec cadence), 8328:38741 (séries variables en Répétitions sans cadence), 8328:38848 (tableau replié), 8982:15172 (séries variables toutes à l’échec, sans ligne Durée de l’exercice), 8328:39279 (déplacement d’une série). La frame 9232:44646, nommée « Durée d’une phase (roulette) », illustre malgré son nom la roulette d’une cellule de séries variables en mode Durée (RM-250) ; aucun contrat de phase n’en est déduit. Captures et écarts Figma au chapitre 06 ; les valeurs des captures sont illustratives. Les états du 12/10 et de la matrice Deux modes du 13/10 remplacés par ces frames, ainsi que les références 6419/6665/7059/7069 du 07/10, sont historiques. Écarts depuis D-434 (19/10/2026) : 9232:44646 et la variante DSF 8452:13297 (roulette de cellule à option À l’échec) ne sont plus conformes pour les cellules du tableau ; 9292:18077 reste la référence de la saisie au clavier, avec deux écarts : la cellule active affiche « 30 s » au lieu de « 00:30 » et la barre ne porte pas « À l’échec » à gauche de « ← Précédent | Suivant → | Fermer ». Aucune frame n’illustre la cellule Pause ni une durée de phase en saisie.

**Phases — MVP :** cette même feuille porte la création et l’édition des phases ; aucun contrat de page autonome supplémentaire. Les trois états dédiés du rapport Figma du15/10 ne sont pas encore recapturés au chapitre06.

Règles applicables : RM-033, RM-035, RM-036, RM-058, RM-095, RM-129, RM-130, RM-132, RM-232, RM-233, RM-234, RM-235 à RM-250, RM-FMT-10, RM-FMT-17 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »). RM-235 à RM-250 : [Charge, côtés, cadence et condition d’arrêt — règles du 18/10/2026](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#charge-côtés-cadence-et-condition-darrêt--règles-du-18102026) (décisions D-403 à D-413).

#### 2. Finalité fonctionnelle

Saisir/éditer Mode, Condition d’arrêt, Nombre de séries, Type de série (identiques/variables), cibles, Pauses, Charge, Changement de côté, Enchainement et Pause entre les côtés, Cadence (Bip de cadence), Compte à rebours et Fin d’exercice (D-413) ; appliquer au brouillon parent et régénérer la phrase sans sauvegarde prématurée.

Définir jusqu’à six phases de travail sans créer d’autres exercices ; maintenir les contraintes du format et calculer la durée de série. [PHC-20261026 et D-446 du 26/10/2026 : la durée de série n’est plus calculée depuis les phases ; cible indépendante]

#### 3. Contexte d’entrée

Ouverture depuis la zone Paramètres d’exécution. Copie du parent ; Bip initial 0, présenté Sans dans la ligne Cadence (RM-245), reprendre valeur existante 0..10 en édition. Aucun tempo implicite. Charge initiale Sans ; un Exercice qui ne porte pas la charge est lu Sans, jamais avec 0 kg (RM-236). Création : N1,Pause 0,cibles et mode selon [Paramètres et brouillon d’un exercice](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#paramètres-et-brouillon-dun-exercice) ; absence de cible requise distincte de Bip 0.

Phases absentes sur les anciens exercices. En édition, reprendre la liste effective de la définition ou de la copie de séance, jamais une référence mutable vers le Catalogue.

#### 4. Contexte de sortie / destinations

✕/retour système annule l’ouverture ; ✓ applique état actif valide au parent ; Terminer du parent persiste. Même feuille pour création/modification et copie d’Exercice dans Séance.

Les phases suivent la même frontière ✓/✕/Terminer ; aucune confirmation supplémentaire n’est ajoutée pour les adaptations validées.

#### 5. Données affichées et source de vérité

**Complément cible 12/10 :** Contexte de l’occurrence et compte hérité ; total dérivé, jamais source de N dans ce contexte.

*Texte identique à celui de la section [« CE-T03-04 — Éditeur Exercice — créer / modifier »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-04--éditeur-exercice--créer--modifier) ; il n’est pas recopié ici.*

Collection effective des Séries, cible/Pause/charge par série/bip, mode, activation et charge commune (valeurs conservées sous Sans, RM-236), changement de côté Avec / Sans sans direction (D-406 ; données historiques D→G et G→D lues Avec, RM-244), ordre,PC,Compte à rebours/Fin. La Condition d’arrêt en séries variables est dérivée des cibles des séries, jamais persistée à part (RM-249). Bip commun à toutes les lignes,0..10 dans deux modes ; aucune surcharge persistée. Calcul typé fourni par [Résultats temporels et agrégation du circuit](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit) ; phrase et montants Figma ne pilotent aucune donnée.

Avec phases : liste ordonnée de libellés/durées, durée du motif égale à leur somme ; cible de série indépendante, aucune dernière phase calculée. Le corpus historique de phrases ne couvre pas cette extension ; les nouveaux textes restent à valider.

#### 6. Classification des valeurs Figma

Titres/règles statiques ; valeurs de champs dynamiques ; exemples Figma démonstratifs. exact/estimated/lowerBound/omitted à l’Exercice ; lowerBound réservé au mélange calculable. Une erreur de cible n’est pas une durée omitted et bloque ✓ sans inventer un montant.

Phase 1 et Phase n sont des libellés initiaux ; les libellés personnalisés et durées sont des données. Les chiffres des maquettes ne déterminent aucun calcul.

#### 7. Structure de l’écran

**Complément cible 12/10, présentation remplacée par D-410 :** contrôle Type de série (Variables / Identiques) ; chevron à l’intérieur de l’option Variables, centré verticalement avec le texte (RM-247) ; identiques sans chevron. Tableau variable visible ou replié.

En-tête fixe ✕/titre/✓ ; corps défilant en six blocs successifs (D-413) : 1 Exécution — Mode, Condition d’arrêt ; 2 Phases du mouvement — ligne Avec / Sans et, lorsqu’il est déployé, tableau Libellé/Durée dans ce même bloc ; 3 Séries — ligne Séries avec nombre et type identiques/variables, cible commune et Pause ou tableau des séries variables, puis Charge ; 4 Côtés — ligne « De chaque côté », puis Enchaînement et Pause entre les côtés selon les règles de déploiement ; 5 Cadence et durée — Cadence, Durée de l’exercice toujours présente, puis signaux lorsqu’ils sont déployés et applicables ; 6 Récupération — seule ligne « Récupération » après le bloc Cadence et durée. Le bloc Séries commence par la ligne Séries et ne contient pas les phases. Cadence reste commune aux deux modes, hors tableau. N = 1 garde ses règles de normalisation. Récupération appartient à l’Exercice ; voir la règle courante et les défauts Profil.

#### 8. Éléments obligatoires

**Complément cible 12/10 :** Valeur numérique au repos, ± au toucher ; N hérité visible et non modifiable, origine discrète. Total affichable en lecture seule sous héritage.

Cadence : contrôle segmenté Autre | 5 s | 2 s | 1 s | Sans (RM-245) ; Sans vaut 0 ; Autre permet une autre valeur avec le mécanisme numérique existant du Bip (0..10, pas 1 s) ; l’option sélectionnée reflète la valeur courante [D-447 : une valeur personnalisée remplace « Autre » dans l’option, un nouvel appui rouvre le stepper] ; contrôle actif même à 0. Aucun interrupteur ou roulette Bip. Ligne Durée de l’exercice toujours présente (D-433) : « Non calculable » en Répétitions sans bip et toutes cibles À l’échec (auparavant total absent, D-397) ; exact en Durée toute chiffrée, ≈ en Répétitions toute chiffrée avec bip, ≥ en mélange calculable, symbole immédiatement avant la valeur. Condition d’arrêt : À l’échec / À l’objectif (libellé D-447), sélectionnable en identiques, résultat dérivé en variables (RM-248, RM-249). Charge : ligne Avec / Sans, Sans par défaut (RM-237, RM-238). Pause entre les côtés seulement avec changement de côté (Avec). Compte à rebours/Fin conservés ; repliés par défaut sous Durée de l’exercice, sans être désactivés (RM-246).

Libellés limités à20 caractères, nombre de phases réglé de 2 à 6 par le stepper de l’option Avec (D-432). Cible de série indépendante et éditable selon le format. Durée, Répétitions et À l’échec compatibles ; seul le régime variable reste indisponible (PHC-20261026). [remplacé par D-446 du 26/10/2026 : le régime variable est disponible avec phases ; une seule séquence de durées commune à toutes les séries]

#### 9. Layout déterministe

**Révision 13/10, amendée le 18/10 :** le popover Mode 184×99 est remplacé par le contrôle segmenté Mode, aligné à droite, sans enveloppe blanche (D-413). Roulette cible : popover 354×249 avec maître 8452:13297 (330×181), option en tête 330×30, séparateur 1px, roulette numérique 150px ; cette variante à option À l’échec ne s’ouvre plus, en mode Durée, que depuis une cellule de série variable (9232:44646) [remplacé par D-434 le 19/10/2026 : la cellule n’ouvre plus de roulette ; elle se saisit au clavier numérique MMSS et « À l’échec » est la commande de gauche de la barre du clavier] ; la roulette Durée d’une série des séries identiques est numérique seule (8328:37862 ; D-412, RM-250). Le total conserve le maître 5544:5118 (330×150) et son popover 354×216. Ligne de série à deux colonnes cible/Pause maintenue, même tout échec, complétée par la colonne Charge lorsqu’elle est affichée (RM-238) ; aucune variante à une colonne. Voir DSF Deux modes pour tailles et opacités.

Toucher une cellule cible du tableau variable ouvre sa roulette sur la cible courante (numérique ou À l’échec) ; seule cette cellule est modifiée. [Remplacé par D-434 le 19/10/2026 pour les cellules Durée et Pause : toucher la cellule la met en évidence avec sa valeur, ouvre le clavier numérique natif et affiche la valeur au format MM:SS dans la même cellule ; seule cette cellule est modifiée. Cellule Répétitions non visée, question ouverte QD-434-1.] Le pied commun est retiré (D-413) ; chaque cellule utilise le sélecteur de son champ (D-417).

**Alignement DSF du 12/10, amendé le 18/10 :** ligne variable `8129:31593`, 334 × 36 ; cellules cible/Pause 76 × 24. Le pied commun `8129:31601` (354 × 48, ± à droite) est retiré, sans réintroduction de lignes de boutons +/− (D-413). Tableau à fond blanc sans contour extérieur, séparateurs internes, lignes de 36 px ; l’espace sous la dernière ligne vaut une hauteur de ligne ; valeurs Durée ou Répétitions, Pause et Charge alignées sur leurs en-têtes ; numéros de série rapprochés des poignées. Une cellule active ; aucun stepper permanent dans les cellules : la cellule active utilise le sélecteur existant de son champ (D-417) [depuis D-434 : clavier numérique MMSS pour Durée et Pause, clavier décimal pour Charge, dans la cellule, sans champ supplémentaire]. Les états de la feuille sont illustrés au chapitre 06. Seul le placement de la mention/astérisque du nombre hérité reste sans référence visuelle identifiée.

À402 : six blocs à x24, largeur 354, espacés de 8 px (D-413) ; titres à gauche, contrôles à droite ; Cadence dans le bloc 5, juste avant Durée de l’exercice ; chevron de Durée de l’exercice à 12 px du libellé (RM-246). Les anciennes indentations systématiques x52 des contrôles variables sont remplacées par la grille à cellules décrite dans le DSF du 12/10. La ligne Durée de l’exercice n’est plus retirée (D-433) : aucun raccourcissement de 42px lié au total ; un repli ne laisse pas de hauteur vide (D-413). Valeurs/steppers à droite ; marges adaptées, pas de coordonnées absolues sur toutes largeurs. Voile modal `overlayScrim` (`color/overlay/scrim`) #1F2129 à 34 %, distinct de `compositionDraggedCardShadow`, qui ne sert jamais de voile.

**Révision 24/10 (D-447) :** boutons et champs éditables de la Feuille à hauteur commune (légère augmentation admise), rayons, alignements et espacements harmonisés, champs de saisie visuellement distincts des options, Design System existant sans modification de jeton (B3) ; marges intérieures horizontales des boutons actifs du segmenté Séries augmentées (B4) ; Pause après chaque série, Pause entre les côtés, Compte à rebours et Fin d’exercice alignés à droite comme Durée de l’exercice (B6) ; chevron de Durée de l’exercice sans cadre, variante du contrôle Disclosure (chapitre 12), position à 12 px du libellé, accessibilité et interaction inchangées (B7).

Référence longue 7119:27855 :224caractères, cinq lignes/100px à largeur 324, carte 193px en AUTO. Contenu et contrôles suivants suivent la hauteur intrinsèque, sans plafond.

Réutiliser la ligne de tableau à deux colonnes, sans pied ni boutons +/− (D-413), le repli par le chevron intérieur à Avec (D-410) et les états existants. Distinguer valeur calculée lisible, valeur imposée effective et option indisponible. Fond gris et hauteur suivent le contenu ; DSF Deux modes, section Phases.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440, Safe Areas, texte agrandi et scroll ; en-tête reste accessible. Tableau replié conserve données et erreurs ; la ligne Durée de l’exercice reste présente et à la même place dans ses trois états « — », « Non calculable » et valeur (D-433) ; la feuille conserve l’accès à la Cadence, à Compte à rebours et Fin d’exercice (RM-246) et aux actions. Aucune hauteur fixe ne doit rogner le texte ou les steppers ; la feuille s’adapte au contenu visible (D-413). Saisie de la charge : clavier numérique avec séparateur décimal, directement dans le champ ou la cellule, sans fenêtre intermédiaire ; le tableau reste entièrement visible au-dessus du clavier (marge de 12 px dans 9292:18077) (D-405, RM-239).

**Révision 19/10 (D-434) :** les cellules Durée et Pause du tableau des séries variables et les durées éditables des phases se saisissent au clavier numérique natif, en MMSS, directement dans la cellule ; la Charge garde le clavier décimal (charge commune des séries identiques comprise depuis RC-14, 20/10 : même saisie que la cellule). La cellule active reste visible au-dessus du clavier. Barre horizontale au-dessus du clavier, sur une seule ligne, de gauche à droite : « À l’échec » | « ← Précédent » | « Suivant → » | « Fermer » ; libellés Précédent et Suivant si la largeur le permet, sinon flèches seules avec leurs libellés d’accessibilité ; zones tactiles préservées. Aucun clavier numérique personnalisé.

**Révision 24/10 (D-447, B9) :** barre rendue par la Feuille au-dessus du clavier natif (mécanisme RC-1 de PRE-5 conservé, `InputAccessoryView` ne s’affichant pas dans la modale) ; une ligne, cinq emplacements stables de largeur et de hauteur égales : « À l’échec » lorsqu’il est applicable (emplacement réservé sinon), Précédent, Suivant, Fermer ; Précédent et Suivant au centre ; boutons arrondis au fond des touches ; Fermer sur fond bleu KODJO, texte blanc ; fond de la barre proche du clavier. Fusion avec la forme du clavier, recouvrement des coins et imitation du matériau vitré d’iOS 26 abandonnés. Focus et navigation inchangés.

Le clavier du libellé ne masque ni le champ actif ni les actions. Jusqu’à six phases : corps défilant, en-tête accessible, repli sans perte des valeurs ; aucune hauteur fixée à l’exemple de deux phases.

Le tableau n’a pas de défilement vertical indépendant du corps. (transféré du [DSF — Circuits, volumes et contrôles de séries du 12/10/2026](../DSF-CIRCUITS-CONTROLES-2026-10-12.md), § « Paramètres d’exécution et tableau variable », G4.)

#### 11. États de l’écran


Cible chiffrée / À l’échec / mélange ; ouverture sur la cible courante. Option sélectionnée100%, sinon45% du remplissage #1a1a1f. À l’échec sélectionné : partie numérique neutre00:00 et grisée en mode Durée ; ce zéro n’est pas une cible valide. Aucun écran uniforme supplémentaire : un changement de valeur seul ne crée pas un nouveau contrat.

Cadence Sans / 5 s / 2 s / 1 s / Autre avec valeur personnalisée, dans chacun des deux modes (RM-245) ; cible valide/incomplète ; uniforme/variable ;N1 ; Changement de côté Sans / Avec replié / Avec déployé et deux enchaînements (RM-242, RM-247) ; tableau ouvert/replié par le chevron de Variables ; option non modifiable avec sa valeur réelle (RM-247) ; Condition d’arrêt sélectionnable en identiques, résultat À l’objectif / À l’échec / « À l’objectif et à l’échec » en variables, tableau incomplet (RM-248, RM-249) ; Durée de l’exercice repliée / déployée (RM-246), dans ses trois états « — », « Non calculable », valeur avec ≈, ≥ ou sans symbole, et transitions entre ces états sans disparition ni déplacement de la ligne (D-433) ; charge Sans / valeur commune / colonne par série / saisie au clavier / zéro / valeurs conservées sous Sans (RM-236 à RM-239) ; steppers au minimum/maximum et maintenus ; validation/annulation. Depuis D-434 : cellule au repos (« 5 s », « 1 min 5 s », « 1 min 30 s », « 12 min », « 0 s ») et en saisie (« 00:05 », « 01:05 », « 01:30 », « 12:00 ») ; barre du clavier avec ou sans « À l’échec » ; libellés Précédent / Suivant affichés ou flèches seules selon la largeur. Plus aucun état roulette de cadence. Les états À l’échec de la roulette de cible décrits ci-dessus ne concernent plus la Objectif de durée des séries identiques, roulette numérique seule (RM-250).

Sans phases ; phases ouvertes/repliées ; Durée/Répétitions avec cible ou échec ; Variables indisponible [remplacé par D-446 du 26/10/2026 : Variables disponible avec phases ; Identiques ↔ Variables sans perte des phases ni de leurs durées] ; durées manquantes ; cible indépendante ; format sans adaptation. Recette PHC/AC01–12.

#### 12. Contrôles et interactions

D-445 / PHC-20261026 : structure modifiée par le crayon du mouvement partagé, y compris depuis une séance ; durées dans les paramètres. Retrait 2 → 1 revient à Sans sans modifier la cible ; aucune suppression par cellule vide ou nulle. Enregistrement local soumis à complétude ; autres exercices explicitement incomplets signalés avant lancement.

Deux modes seulement. Cible chiffrée et À l’échec mutuellement exclusives ; libellé « Aucune durée, à l’échec » ou « Aucune répétition, à l’échec ». En Répétitions, « Aucune répétition, à l’échec » est la ligne de tête de la roulette à une colonne ; aucun bloc horaire 00:00 n’y est transposé. Aucune coche dans la liste ; ✓ de la roulette applique la sélection au brouillon de la feuille ; ✕ de la roulette restaure la valeur à son ouverture. ✓ de la feuille applique l’ensemble au parent ; ✕ de la feuille annule toutes les modifications depuis son ouverture, y compris celles validées dans une roulette. Aucune persistance définitive à la validation de la roulette. Conserver le type À l’échec lors d’une bascule de mode. À tout instant, exactement une cible est sélectionnée. À l’ouverture : cible numérique → roulette active sur la valeur courante et libellé échec à45% ; cible échec → libellé actif et bloc numérique grisé à45%, affiché à00:00 en mode Durée uniquement. Faire tourner la roulette sélectionne la valeur numérique et grise le libellé. Toucher le libellé sélectionne l’échec et ramène le bloc numérique grisé à00:00 en mode Durée. Le grisé exprime la non-sélection, pas une interdiction de manipuler la roulette. Aucun geste supplémentaire de déverrouillage, aucune coche. ✓ de la roulette applique la sélection au brouillon de la feuille ; ✕ de la roulette restaure la valeur à son ouverture. ✓ de la feuille applique l’ensemble au parent ; ✕ de la feuille annule toutes les modifications depuis son ouverture, y compris celles validées dans une roulette. Aucune persistance définitive à la validation de la roulette.00:00 n’est jamais une cible valide ; pause0 reste valide.

**Révision 18/10 (D-411, D-412) :** en séries identiques, la Condition d’arrêt choisit À l’échec ou À l’objectif (libellé D-447) pour toutes les séries (RM-248) ; la roulette Objectif de durée ne propose plus « Aucune durée, à l’échec » (RM-250). L’option en tête « Aucune durée, à l’échec » et les règles ci-dessus de sélection, de grisé et de 00:00 valent pour la roulette d’une cellule de série variable en mode Durée, pour cette seule série ; chaque modification actualise la Condition d’arrêt, sans modifier les pauses (RM-249, RM-250). À l’échec n’est pas une durée nulle. En séries identiques, la roulette Répétitions ne propose plus « Aucune répétition, à l’échec » (D-418) et la saisie de durée est masquée lorsque la condition commune est À l’échec (D-419) ; dans une cellule de séries variables, la roulette Répétitions garde cette option en tête.

**Révision 19/10 (D-434) :** dans le tableau des séries variables, plus de roulette pour la durée ni de stepper pour la pause ; les cellules Durée et Pause et les durées éditables des phases se saisissent au clavier numérique, en MMSS. Sans focus, la durée est affichée en unités explicites, sans zéros inutiles (« 5 s », « 1 min 5 s », « 1 min 30 s », « 12 min » ; durée nulle autorisée « 0 s ») ; avec focus, au format MM:SS sur quatre chiffres (« 00:05 », « 01:05 », « 01:30 », « 12:00 »), dans la même cellule, sans champ supplémentaire. Les chiffres frappés se décalent vers la gauche, quatre au plus, et le séparateur « : » est inséré automatiquement. À l’activation, la cellule et sa valeur sont mises en évidence et le clavier natif s’ouvre ; la sélection native de texte (deux poignées verticales iOS) n’est pas utilisée ; la première frappe remplace la valeur existante, les suivantes composent la nouvelle valeur ; Retour arrière supprime le dernier chiffre. Ce principe vaut aussi pour la cellule Charge (clavier décimal, en kg). « À l’échec », à gauche de la barre du clavier, est visible pour les cellules de durée cible des séries lorsque le mode À l’échec est autorisé et bascule entre cible numérique et À l’échec pour cette seule série, en préservant les valeurs selon les règles existantes (RM-250) ; il n’apparaît ni pour les pauses, ni pour les charges, ni pour les durées de phase. Précédent, Suivant et Fermer restent disponibles dans tous les cas applicables. Bornes et validations des durées, pauses et charges inchangées ; séries à cible numérique, à l’échec et mixtes préservées ; modèle de données et persistance inchangés. Les règles ci-dessus de la roulette à option en tête ne valent plus pour une cellule Durée de série variable ; la cellule Répétitions n’est pas visée par D-434 (question ouverte QD-434-1). Hors tableaux, rien ne change. QD-434-1 à QD-434-4 tranchées par Hermann le 19/10 (ch. 07, D-434) : cellule cible Répétitions au clavier numérique entier, « À l’échec » dans la barre ; Précédent / Suivant ligne par ligne sans quitter le tableau et, dans le tableau des phases, durées seules ; à la sortie, secondes supérieures à 59 reportées et valeur hors bornes ramenée à la borne ; cellule vidée → 0 s, ou à renseigner si 0 est interdit ; cellule À l’échec affichée « 00:00 » au focus, la première frappe remplaçant la valeur.

**Complément cible 12/10 :** Un seul champ actif. Changer de champ ferme/ouvre en un geste. Pi et cible copiées depuis dernière ligne. Suppression immédiate + Annuler avec position et paramètres ; sous N hérité, suppression locale indisponible.

- Cadence : 5 s, 2 s, 1 s et Sans sélectionnent directement la valeur ; Autre utilise le mécanisme existant : ± modifie Bip par 1, bornes 0..10, sans accélération (RM-245).
- Autres steppers : DSF Bip (maintien≈500 ms, paliers 1/5/10 selon durée du maintien et champ).
- Bascule de mode conserve Bip même à ✓ ; cibles numériques incompatibles remplacées par — et restaurées dans le brouillon selon [Paramètres et brouillon d’un exercice](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#paramètres-et-brouillon-dun-exercice).
- Variable copie les valeurs uniformes, charge comprise ; retour uniforme reprend première ligne ; réduction/augmentation/restauration et déplacement selon [Paramètres et brouillon d’un exercice](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#paramètres-et-brouillon-dun-exercice), qui s’appliquent aussi à la charge par série (RM-238).
- Une seule roulette ouverte à la fois. Mode, Condition d’arrêt en identiques, Type de série, Changement de côté, Cadence et Charge Avec / Sans sont des contrôles segmentés sans popover (D-413).
- Condition d’arrêt en séries variables : non modifiable à cet endroit ; elle suit les cibles des cellules (RM-249).
- Charge : Avec ouvre directement la saisie (0,25 kg à la première activation), Sans conserve les valeurs ; saisie, pas, zéro et réactivation selon RM-239.
- Chevrons de Variables et d’Avec : repli ou déploiement sans perte de valeurs ni changement de mode (RM-247). [01/11/2026, Hermann : tableau des phases replié à l'ouverture de la feuille s'il n'y a aucune durée de phase à renseigner ni « à vérifier », déployé sinon ; ligne 2b des Règles communes.] Chevron de Durée de l’exercice : replie ou déploie Compte à rebours et Fin d’exercice, indépendamment de l’édition de la durée (RM-246).
- Le total Durée uniforme entièrement chiffré garde son inversion seulement si N est libre ; sous N imposé par un circuit à séries alternées, tout total affichable est en lecture seule.
- omitted reste absent.

PHC-20261026 : Avec crée deux phases à renseigner sans reprendre la cible de série ; ajout ultérieur reprend la dernière durée selon la convention existante. Retrait annulable, 2 → 1 revient à Sans sans modifier la cible. Durées modifiables sous format, aucune dernière phase calculée. Réutiliser clavier, stepper et chevron existants.

Avec phases et N libre, Durée totale conserve le calcul inverse de R-02 : seul N est ajusté, les durées des phases restent inchangées. N imposé : total en lecture seule.

#### 13. Gestes

Tap et maintien sur steppers, arrêt au relâchement/sortie de cible, pas supplémentaire de relâchement interdit après répétition. Glisser la poignée réordonne cible/Pause/charge/bip ensemble et recalcule la dernière ligne (RM-238). Alternatives accessibles sans geste fin.

Poignée : déplacer le libellé et sa durée ensemble. Tap libellé : saisie texte ; tap durée éditable : contrôle durée, au clavier numérique MMSS dans la cellule, sans « À l’échec » (D-434). La dernière calculée n’ouvre pas de saisie. Les gestes et alternatives accessibles du tableau existant sont conservés.

#### 14. Validation

Mode et cibles typées actives requis ; une cible À l’échec est valide sans nombre. R06 close : maximum 58 min 55 s (3535 s) confirmé ; roulette de cible par pas de 1 s dès 1 s (D-430, 19/10/2026 ; auparavant 5 s). Cibles chiffrées : N1..99,Ri1..100,Ti1..3535 s,somme des phases 1..3535 s (D-430),Pauses 0..300 s,Bip entier 0..10 dans deux modes. −1,11,fraction invalides, aucune correction silencieuse. Exception propre à la charge (D-405) : valeur positive hors pas arrondie au multiple de 0,25 kg supérieur, sans message, à la sortie du champ ou à la validation ; valeur négative refusée ; zéro = sans charge (RM-239). La Condition d’arrêt dérivée n’est pas validée à part (RM-249). Repli ne contourne pas la validation ; le champ ou la cellule invalide est indiqué visuellement selon D-337 et D-389, sans message en ligne nommant la Série. La valeur 0 (Sans) du Bip reste valide. Nom/Catégorie/Zones contrôlés au parent.

À ✓, une durée de phase nulle ou vide reste à renseigner, sans supprimer la phase ; l’exercice édité ne peut être enregistré incomplet (D-438). Le nommage par défaut des phases ajoutées est conservé au Catalogue. Les durées positives gardent leur valeur exacte, dont 6 + 3 = 9 s. La structure d’une occurrence reste verrouillée.

#### 15. Brouillon et persistance

*Texte identique à celui de la section [« CE-T03-04 — Éditeur Exercice — créer / modifier »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-04--éditeur-exercice--créer--modifier) ; il n’est pas recopié ici.*

Brouillon isolé ; ✓ atomique au parent ; ✕ restaure totalité avant ouverture. Bip persiste quel que soit le mode. Les variantes cachées de cibles/tableaux ne sont pas persistées hors état actif ; exception : les valeurs de charge désactivées par Sans ou masquées avec la colonne [depuis D-447, remplacées à l’affichage par un tiret dans la colonne conservée] sont conservées et enregistrées avec l’activation (D-403, RM-236). Duplication/copie/snapshot incluent Bip, l’activation et les valeurs de charge ; aucune mutation partielle.

Conserver les zéros temporaires uniquement en brouillon. Annuler restaure l’ordre, les libellés et toutes les durées, y compris le restant recalculé. Copie, duplication et instantané conservent la liste ; aucun total ni phrase en base.

#### 16. Navigation et conservation d’état

Retour au parent même position et contenu, phrase régénérée à chaque affichage depuis les paramètres appliqués, notamment après✓ valide. Une bascule de mode seule ne sauvegarde rien. Pas de navigation vers un écran de cadence ni de nouvelle route.

Même retour au parent ; le repli n’est pas une sortie. Les modifications de la copie de séance n’affectent pas le Catalogue.

#### 17. Erreurs et cas limites

Cible manquante, valeur hors borne, double validation, interruption ou erreur de persistance : aucun état partiel. Mode sans durée propre : ligne Durée de l’exercice présente avec « Non calculable », même si pauses positives (D-433, remplace « ligne absente ; Compte à rebours et Fin d’exercice alors directement visibles »). Historique non modifié ; données héritées hors plage conservées tant qu’elles ne sont pas modifiées, toute nouvelle saisie ou modification respectant les bornes (D-383) ; jamais tronquées silencieusement.

Pas de septième phase ni d’effacement via ancien DTO. Pas de budget restant ni d’arrondi proportionnel : motif indépendant de la cible (PHC-20261026).

#### 18. Accessibilité

**Complément cible 12/10 :** Lecture seule annoncée avec valeur et origine ; ne pas remplacer par un tiret. Cellule active identifiée par ligne/colonne et texte Série i · Durée (ou autre champ, dont Série i · Charge), sans dépendre seulement de la couleur.

Nom accessible Cadence (Bip de cadence) ; options Autre, 5 s, 2 s, 1 s et Sans annoncées avec la sélection courante ; valeur Sans ou intervalle en secondes ; pour Autre, boutons augmenter/diminuer et limites annoncées (RM-245). Condition d’arrêt : sélectionnable en identiques ; en variables, annoncée comme valeur déterminée par les séries, non modifiable (RM-249). Charge : valeur en kg ou Sans. Total ≈ annoncé estimation ; ≥ annoncé total prévisionnel partiel. Option À l’échec annoncée sélectionnée/non sélectionnée ; le grisé n’est pas le seul indicateur accessible. Focus modal contenu, retour à la zone Paramètres. Texte agrandi, cibles 44 minimum, alternatives au maintien/glisser.

Annoncer position, libellé, durée et état calculé/non modifiable ; raison de l’indisponibilité accessible, pas uniquement grise. Barre du clavier (D-434) : flèches Précédent et Suivant toujours dotées de leurs libellés d’accessibilité, même affichées seules ; « À l’échec » annoncé avec son état ; cellule active annoncée. Ordre de focus cohérent après ajout, suppression et déplacement ; texte20 caractères sans réduire les cibles tactiles.

#### 19. Invariants

Bip sonore uniquement pendant Série, aucune transition automatique. Les intervalles logiques peuvent proposer un relevé estimé en Répétitions à l’échec. Son ne transforme pas À l’échec en durée connue. Aucune estimation forfaitaire ; ≥ seulement pour mélange calculable à l’Exercice. Pause après chaque série, y compris la dernière ; récupération contextuelle positive remplaçant seulement la dernière Pause. La charge ne modifie ni minuteurs, ni cibles, ni cadence, ni pauses, ni ordre, ni calculs (RM-235). Un repli ne modifie ni valeurs, ni mode, ni durée affichée (RM-246, RM-247). Les images ne gouvernent ni calculs ni persistance.

Une série = un motif complet ; phases seulement Durée chiffrée et identiques. [remplacé par PHC-20261026 puis D-446 du 26/10/2026 : une série boucle le motif ; phases en Durée ou Répétitions, cible chiffrée ou À l’échec, séries identiques ou variables] Pauses et côtés inchangés. Aucun comportement ne découle d’un exemple chiffré Figma.

#### 20. Recette déterministe


Recette complémentaire (roulette de cible d’une cellule de série variable en mode Durée depuis le 18/10, RM-250 ; roulette remplacée par D-434 le 19/10 : les mêmes cas se vérifient au clavier numérique MMSS et par la commande « À l’échec » de la barre, notamment affichage « 1 min 5 s » / « 01:05 », première frappe remplaçant la valeur, Retour arrière, absence des poignées de sélection iOS, barre sur une seule ligne) : deux options, ouverture valeur/échec courant, exclusion mutuelle,00:00 cible refusée (pause 0 valide), tout échec « Non calculable », mixte 30/45/échec avec pauses 10/20/30 → « ≥ 2 min 15 s » en lecture seule, Répétitions sans bip « Non calculable » (D-433) ; annuler/appliquer sans persistance anticipée. Tester 30 s → toucher échec →00:00 grisé → tourner vers 30 s → cible numérique ; réouverture fidèle et annulation/restauration. Le bloc grisé reste manipulable. Qualification native et accessible sur appareils à réaliser ; §4.5 reçu, réserve de source close.

**Complément cible 12/10 :** Vérifier N libre/hérité, total éditable/lecture seule/omitted, identiques/variables égales, repli, croix/Annuler, cible destructive pendant stepper actif ; conserver tests des modes et pauses.

*Texte identique à celui de la section [« CE-T03-04 — Éditeur Exercice — créer / modifier »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-04--éditeur-exercice--créer--modifier) ; il n’est pas recopié ici.*

Deux modes × deux types de cible × bip nul/positif ;0/1/10 et rejets−1/11/fraction ; conservation lors des bascules, annulation et duplication.4×15×4+4×15=300 s, affiché « ≈ 5 min » ; sans bip, ligne présente avec « Non calculable » (D-433). Tester N1,variable,repli,réordre de dernière Série,inversion Durée,deux côtés/R ; ligne Durée de l’exercice immobile entre « — », « Non calculable » et valeur (D-433, remplace la géométrie de retrait de 42px), texte agrandi et accessibilité. Phrase de pauses conforme aux 276 formulations v15 ; Q-08 clos.

Recette v3.0 (D-403 à D-413), scénarios de la spécification du 18/10/2026 (§6, §9.2, §12) : charge AC-01 à AC-12, dont 1,3 → 1,5 kg, 0,01 → 0,25 kg, 1,25 kg inchangé, [0 ; 10 ; 15] → Sans → Avec et [0 ; 0 ; 0] (RM-236 à RM-241) ; Changement de côté Avec / Sans et données historiques AC-13, AC-14, AC-23 (RM-242 à RM-244) ; Cadence AC-15, dont une valeur 5 s saisie par Autre reflétée par l’option 5 s (RM-245) ; Durée de l’exercice et signaux AC-16, AC-17, dont la feuille sans ligne Durée de l’exercice (RM-246) ; chevrons AC-18 (RM-247) ; Condition d’arrêt AC-19 à AC-21 (RM-248, RM-249) ; six blocs et replis sans espace vide AC-22 (D-413) ; roulettes AC-24 à AC-26 (RM-250). Compléments du 18/10 (D-414 à D-420) : phrase « (charge : 20 kg) », « (charges : 20, 25, 30 kg) » et, pour quatre séries, « (charges : 20, 12 kg, ...) », aucune mention avec Sans ; N = 1 avec Avec : ligne Enchainement absente, Avec / Sans modifiable ; création avec Condition d’arrêt À l’objectif (libellé D-447) ; À l’échec commun : saisie de durée masquée ; roulette Répétitions des séries identiques sans À l’échec, cellule variable avec ; cellule Pause ouvrant son stepper [remplacé par D-434 : cellule Pause saisie au clavier numérique MMSS] ; Sans puis Autre sans restauration d’une valeur personnalisée. Recette applicative non exécutée par cette mise à jour documentaire.

*Texte identique à celui de la section [« CE-T03-04 — Éditeur Exercice — créer / modifier »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-04--éditeur-exercice--créer--modifier) ; il n’est pas recopié ici.*

<a id="editeur-parametres"></a>
### Règles communes de l’éditeur de paramètres

#### Feuille et contrôles

| Ordre | Ligne | Contrôle / visibilité |
|---|---|---|
| 1 | Mode | Cadre 1 Exécution. Contrôle segmenté Répétitions / Durée, sans popover (D-413) |
| 2 | Condition d’arrêt | Cadre 1. À l’échec (à gauche) / À l’objectif (à droite) ; À l’objectif par défaut (D-416 ; libellés D-447, qui remplacent « À la cible »). Identiques : sélectionnable, le choix vaut pour toutes les séries (RM-248) ; À l’échec masque la saisie de durée (D-419). Variables : résultat dérivé non modifiable, deux options avec sélection automatique ou une seule option « À l’objectif et à l’échec » ; tableau incomplet selon D-384 (RM-249) |
| 2b | Phases du mouvement | [31/10/2026, recette iPhone n° 2 (Hermann, constat a) : tableau replié avec au moins une durée de phase manquante → cadre de la ligne en rouge (fond `color.dangerSurface`, bord 1 `color.danger`, rendu choisi) ; voir ch07 « Recette iPhone n° 2 du 31/10/2026 ».] [31/10/2026, contrôle de la recette n° 2 (cr2-phases-rouge) : remplacé — seul le cadre du champ « n phases » est rouge, pas la ligne. Constat e : durées reprises d'une valeur par défaut ajoutée au Mouvement (« Paramètre à vérifier ») → leurs cellules et toute la ligne en orange (fond orange pâle, bord 1 `color.warning`, rendu choisi), sauf si une durée manque (le rouge prime) ; feuille ouverte puis fermée → plus d'orange ; voir ch07 « Recette iPhone n° 2 du 31/10/2026 — contrôle (phases, feuille des paramètres, valeurs par défaut) ».] [31/10/2026, contre-recette n° 3 (cr4-rouge, cr4-verifier) : remplace « tableau replié » et « toute la ligne en orange » — tant qu’une durée de phase manque, tableau replié OU déployé, le champ « n phases » (option Avec sélectionnée) est rouge : cadre 1 `color.danger` et fond `color.dangerSurface` à la place du fond violet de la sélection, texte primaire ; « à vérifier » : même champ en orange (cadre `color.warning`, fond orange pâle) ; le rouge prime ; la ligne ne porte jamais ni fond ni cadre ; les cellules de durée reprises gardent leur fond orange ; voir ch07 « Recette iPhone n° 2 du 31/10/2026 — contrôle (phases, feuille des paramètres, valeurs par défaut) ».] [01/11/2026, Hermann (classe B ; remplace, pour l'ouverture, « déployé à l'ouverture » de PRE-5 story 2.8, FR-28) : « Lorsque la modale des paramètres s'ouvre, le tableau des phases doit être fermé s'il n'y a aucune valeur à vérifier ou à renseigner. » À l'ouverture de la feuille, tableau replié (chevron bas) si toutes les durées de phase sont renseignées et aucune « à vérifier » ; déployé si au moins une durée manque (vide ou 0 s) ou est « à vérifier ». L'activation d'Avec le déploie toujours ; le chevron le replie ou le déploie ; voir ch07 même section, entrée du 01/11/2026.] Bloc 2 Phases du mouvement, autonome entre Exécution et Séries. Contrôle segmenté Avec / Sans, Sans par défaut ; l’option Avec affiche « n phases », réglé de 2 à 6 par le stepper existant révélé au toucher, et un chevron graphique à droite du nombre, visible stepper replié, qui replie ou déploie le tableau sans changer le nombre (D-410, D-432) [RC-16 et RC-17, 20/10 : stepper ouvert, chevron visible mais indisponible ; l’activation d’un champ du tableau des phases ferme le stepper et rend le chevron actif ; titre « Phases du mouvement »] [remplacé par D-448 du 26/10/2026 : titre « Phases du mouvement » ; option « n phases » élargie, chevron nettement séparé du nombre] [D-448 du 26/10/2026 : pendant l’édition, Sans puis Avec — ou la croix jusqu’à Sans puis Avec — restitue les phases désactivées (libellés, durées, nombre), mémoire non persistée ; hors édition, Avec crée deux phases vides] ; tableau de n lignes (poignée, numéro, Libellé, Durée, croix), sans ligne d’ajout ni boutons +/− (D-413, D-432) ; cible de série indépendante ; durée de phase saisie au clavier numérique MMSS dans la cellule, sans « À l’échec » (D-434) ; chaque phase validée ≥ 1 s, somme des phases 1..3535 s (D-430) [D-448 du 26/10/2026 : 0 s saisi reste 0 s, au lieu d’être ramené à 1 s ; cellule rouge et validation refusée comme pour une durée manquante] ; disponible en Durée ou Répétitions, à cible ou à l’échec, en séries identiques seulement [remplacé par D-446 du 26/10/2026 : en séries identiques ou variables, avec une seule séquence de durées] (D-370 à D-375, ch. 08 « Phases d’exercice ») |
| 3 | Nombre de séries | Bloc 3 Séries. Valeur numérique, défaut 1 ; appui révèle ± si N libre ; valeur réelle en lecture seule avec origine si N hérité du circuit. [RC-15, 20/10 : sans ligne propre ; valeur « n séries identiques / variables » dans l’option sélectionnée du segmenté Type de série, ± révélés dans l’option (« − \| n séries \| + »), refermés au toucher de la valeur ou ailleurs ; règles, bornes et accessibilité inchangées] |
| 4 | Type de série | Contrôle segmenté Variables / Identiques ; chevron à l’intérieur de l’option Variables, haut si le tableau est déployé, bas s’il est replié (D-410, RM-247) ; identiques sans chevron ; normalisation N1 existante conservée, option non modifiable avec sa valeur réelle. [RC-17, 20/10 : titre de la ligne « Séries » (au lieu de « Type de série ») ; stepper du nombre ouvert, chevron grisé et indisponible ; l’activation d’une cellule du tableau ferme le stepper et rend le chevron actif ; à N = 1, Variables indisponible (RC-15, confirmé)] |
| 5 | Cible et Pause | Identiques : lignes Durée/Répétitions et Pause après chaque série ; roulettes Objectif de durée et Répétitions sans option À l’échec (D-418), À l’échec choisi par la Condition d’arrêt, sans nombre prescrit (RM-248, RM-250). Variables : tableau rattaché à Type de série, ligne numérotée, poignée, colonnes Durée ou Répétitions, Pause et, si la charge est active, Charge [depuis D-447 : colonne Charge toujours présente, tiret gris en Sans] ; lignes de 36 px, sans pied ± ni stepper permanent (D-413) ; chaque cellule utilise le sélecteur existant de son champ, pour cette seule cellule : roulette de durée ou Répétitions avec « À l’échec », stepper de Pause, clavier de charge (D-417, RM-250) [remplacé par D-434 le 19/10/2026 : Durée et Pause au clavier numérique MMSS, Charge au clavier décimal, « À l’échec » dans la barre du clavier ; cellule Répétitions non visée, question ouverte QD-434-1] |
| 6 | Charge | Identiques : ligne après la Pause, Avec / Sans, Sans par défaut ; Avec ouvre directement la saisie ; la valeur et son unité remplacent Avec, par exemple « 20 kg » (RM-237) ; depuis RC-14 (20/10), clavier ouvert dans l’option dès Avec, saisie comme la cellule Charge (D-434), option de 62 élargie si la valeur ne tient pas. Variables : ligne Avec / Sans sous le tableau ; Avec affiche la colonne Charge, Sans la masque en conservant les valeurs [remplacé par D-447 du 24/10/2026 : en Sans, la colonne reste affichée, en-tête et largeur conservés, avec un tiret gris non éditable dans chaque cellule, ignoré par Précédent / Suivant ; Charge activée, valeurs et champs dans la même colonne, sans suppression ni recréation] ; titre de colonne non interactif (RM-238). Saisie au clavier numérique décimal, sans fenêtre intermédiaire ; pas, zéro, conservation et réactivation selon RM-239 (D-404, D-405) |
| 7 | De chaque côté | Bloc 4 Côtés. Contrôle segmenté Avec (à gauche) / Sans (à droite), sans choix de direction (D-406, RM-242) ; chevron à l’intérieur d’Avec, qui replie ou déploie les lignes 8 et 9 (RM-247) [D-447 : depuis Avec sélectionné, l’Enchainement se choisit par un déroulant conforme à Figma `9462:18986` / `9462:18987` (géométrie, position, ancrage, marges, options), qui remplace le menu natif iOS accepté en recette PRE-5 (RC-6) ; valeur sélectionnée toujours contenue dans l’option, y compris après réouverture ; comportements D-431 inchangés ; aucune désignation Droite / Gauche] |
| 8 | Enchainement | Les options d’Enchaînement affichent `DD… → GG…` (un côté après l’autre, par défaut) et `DG → DG → …` (les deux côtés à chaque série) dans l’option Avec sélectionnée et dans le déroulant, à la taille standard des options, sans réduction de police. D et G sont des signes graphiques désignant respectivement le côté 1, choisi au départ par l’utilisateur, et le côté 2 ; ils ne désignent jamais la droite et la gauche. Les libellés d’accessibilité sont « Chaque série d’un côté, puis chaque série de l'autre » et « Les deux côtés à chaque série ». Le champ épouse son contenu ; l’option Avec portant la notation et le déroulant mesurent environ 104 px dans la maquette de référence. La ligne visible s’intitule « De chaque côté », sur une ligne ; le concept, le modèle et RM-242 à RM-244 restent nommés Changement de côté. À N = 1, conserver les règles de D-415 : pas de choix d’Enchaînement, Avec / Sans reste disponible. |
| 9 | Pause entre les côtés | Avec uniquement, stepper ; copie du Profil à activation ; aligné à droite comme Durée de l’exercice (D-447) |
| 10 | Cadence | Bloc 5 Cadence et durée. Bip de cadence, deux modes ; contrôle segmenté Autre / 5 s / 2 s / 1 s / Sans, Sans = 0 ; Autre : mécanisme numérique existant, 0..10, pas 1 s (D-408, RM-245) ; une valeur personnalisée remplace « Autre » dans l’option, un nouvel appui rouvre le stepper (D-447) ; juste avant Durée de l’exercice ; commun hors tableau variable. |
| 11 | Durée de l’exercice | Concept Durée totale ; chevron à côté du libellé, sans cadre (variante du contrôle Disclosure, chapitre 12 ; D-447), replié par défaut, qui replie ou déploie les lignes 12 et 13 sans les désactiver (D-409, RM-246) [D-448 du 26/10/2026 : au dépliage, la feuille défile pour que les lignes 12 et 13 soient visibles]. Durée uniforme chiffrée avec N libre : roulette ; N hérité du circuit, variable/Répétitions avec bip : lecture seule ; mélange calculable : ≥ en lecture seule ; ligne toujours affichée, à la même place, dans tous les modes et tous les états de saisie, à N = 1 comme à N > 1 (D-396, D-433), en trois états : donnée nécessaire au calcul manquante : « — » (D-384) [remplacé par D-448 du 26/10/2026 pour les phases : en mode Durée, une durée de phase vide n’empêche pas le total calculable, la cellule restant rouge et ✓ indisponible ; en Répétitions avec phases, « — » tant qu’une durée manque] ; configuration excluant le calcul (Répétitions sans bip, toutes cibles À l’échec, combinaison dont une partie empêche le calcul) : « Non calculable », prioritaire sur « — » (D-433, remplace « absente », D-397) ; calculable et complète : valeur, avec « ≥ » ou « ≈ » placé immédiatement avant la valeur dans la même zone d’affichage (« ≥ 5 min 30 s », « ≈ 5 min 30 s »), jamais à côté du libellé, ou sans symbole si déterminée (D-433). « — » et « Non calculable » ne valent jamais zéro |
| 12 | Compte à rebours | Stepper ; défaut Profil 10 s ; aligné à droite comme Durée de l’exercice (D-447) ; masqué sous Durée de l’exercice repliée (RM-246) ; la ligne 11 n’est plus jamais absente (D-433) |
| 13 | Fin d’exercice | Stepper ; défaut Profil 5 s ; même visibilité et même alignement à droite que la ligne 12 (D-447) |
| 14 | Récupération | Bloc autonome après Cadence et durée ; contrôle de durée existant ; défaut Profil à la création, cadre orange avant premier ✓ ; valeur propre à l’Exercice, également affichée dans la Composition ; seul accès de modification, 0 s sans phase exécutée. |

Création : mode/durée/côté non renseignés —, Série 1, Pause 0 s, charge Sans (RM-236), Condition d’arrêt À l’objectif (D-416) ; cible Répétitions uniforme initiale 1 ; aucune cible implicite lors d’un changement de mode variable. Une cible à renseigner (—) ouvre la roulette sur la plus petite valeur valide, sélectionnée : 00:01 en Durée (D-430), 1 en Répétitions ; rien n’est appliqué avant le ✓ de la roulette ; ✕ laisse la cible à renseigner (décision PRE-4 Q25 du 16/10, D-385). Côté vide normalisé Sans à validation (D-406). La feuille entière défile sous un en-tête ✕/titre/✓ fixe. Ouverture : voile en fondu sur place, feuille montante depuis le bas ; « Réduire les animations » : feuille en place . Une seule roulette ouverte ; les contrôles segmentés n’ouvrent pas de popover (D-413) ; les boutons ± apparaissent à l’appui sur une valeur numérique ; la charge se saisit au clavier (D-405) ; un seul champ est actif, sans modale supplémentaire. Glisser une Série : corps immobile et repère d’insertion entre les lignes . Le chevron de l’option Variables masque le tableau sans modifier les données ni désactiver le mode variable (RM-247). [29/10/2026, recette PRE-9 n° 1 (Hermann) : création : mode Durée et côté Sans par défaut, cible non renseignée ; une cible Durée à renseigner ouvre la roulette à 00:00 sans valeur retenue. Tableau des phases : refermé (disparition progressive) quand un autre contrôle de la feuille est activé ; colonnes Libellé et Durée réparties sur la largeur. Barre grise du clavier : marges verticales agrandies, couleur du fond du clavier — voir ch07 « Recette PRE-9 n° 1 — décisions de Hermann du 29/10/2026 ».]

État historique livré PRE-3 : sélecteurs segmentés et steppers permanents, avec fermeture progressive D-339 et typographie D-341. Le DSF du 12/10 et Deux modes du 13/10 remplacent la présentation D-341 pour la prochaine tranche (D-377) ; la fermeture après sélection de D-339 est conservée, y compris dans les popovers (D-377). Ces DSF ne prétendent pas être déjà réalisés. Depuis le 18/10, D-413 remplace la présentation par popovers de D-377 pour Mode, Type de série et Changement de côté (contrôles segmentés), ainsi que le pied commun ± et les steppers permanents de cellules du tableau variable, chaque cellule utilisant le sélecteur existant de son champ (D-417) ; D-339 n’a plus d’objet pour ces lignes.

| Paramètre | Bornes | Granularité validée le 02/10 |
|---|---|---|
| Séries | 1..99 | 1 |
| Répétitions par Série | 1..100 [28/10/2026, COMP §3 : cibles 0..100 répétitions et 0..3535 s par série ; volume total de l'Exercice non nul (ARB-10) ; les phases conservent leur minimum de 1 s — annoté le 31/10 (B.3).] | 1 |
| Durée par Série | 1..3535 s (minimum porté de 5 à 1 s par D-430, 19/10/2026) [28/10/2026, COMP §3 : cibles 0..100 répétitions et 0..3535 s par série ; volume total de l'Exercice non nul (ARB-10) ; les phases conservent leur minimum de 1 s — annoté le 31/10 (B.3).] | Roulette par pas de 1 s ; 00:00 interdit comme cible |
| Phase d’exercice | Chaque phase validée ≥ 1 s ; somme des phases 1..3535 s (D-430) | Pas de 1 s ; 0 s ou vide reste à renseigner, sans retrait ; enregistrement de l’exercice édité bloqué (D-438) |
| Pause après chaque série / Pause entre les côtés | 0..300 s | Tap 1 s ; maintien accéléré 1/5/10 selon DSF Bip |
| Bip de cadence (ligne Cadence) | 0..10 s | 1 s, aucune accélération ; 5 s, 2 s, 1 s et Sans sont des choix directs (RM-245) |
| Compte à rebours / Fin d’exercice | 0..60 s | 1 s  |
| Charge | ≥ 0 kg, aucun plafond métier | 0,25 kg, validé le 18/10 ; valeur positive hors pas arrondie au multiple supérieur sans message ; 0 = sans charge (D-405, RM-239) |

Steppers : tap 1 ; maintien≈500 ms, puis paliers 5 après≈2 s et 10 après≈4 s, arrondi directionnel au multiple et saturation aux bornes. Bip/Compte à rebours/Fin restent au pas1. Relâchement arrête et rétablit le pas1 ; pas d’arrondi à l’ouverture. Voir DSF Bip. Les roulettes ne sont pas redéfinies par cette règle. La charge n’a pas de stepper : saisie au clavier (D-405). Les cellules du tableau variable n’ont pas de stepper permanent (D-413) ; la cellule Pause active ouvre le stepper de Pause existant pour cette seule cellule (D-417) [remplacé par D-434 le 19/10/2026 : la cellule Pause se saisit au clavier numérique MMSS ; la Pause des séries identiques garde son stepper].

✓ grisé tant que le mode ou une cible active exigée est invalide ; cellule concernée signalée par son contour ; aucun message en ligne (D-337, 12/10 : remplace le message nommant la Série à renseigner). Une cible obligatoire sans valeur, représentée par « — », reçoit un fond rouge pâle ; sur un stepper, les cercles − et + conservent leurs couleurs normales ; le fond redevient normal dès qu’une valeur valide est saisie ; aucun contour orange n’est appliqué dans ce cas (D-389, D-398). Une valeur renseignée mais invalide suit les règles existantes (D-398). Pause 0 valide. Une valeur héritée hors bornes, non modifiée, reste valide ; toute nouvelle saisie ou modification respecte les bornes (D-383). Repli du tableau ne contourne jamais la validation. Nom, Catégorie et Zones restent validés dans le parent. Charge : arrondi au pas de 0,25 kg sans message, exception propre à la charge (D-405, RM-239). Condition d’arrêt en séries variables : aucune validation supplémentaire ; une cellule vide n’est comptée ni à la cible ni à l’échec (RM-249).

#### Sélecteur de cible — complément §4.5 du13/10

Portée depuis le 18/10 (D-412) : ce sélecteur à option À l’échec est celui d’une cellule de série variable en mode Durée, pour cette seule série [remplacé par D-434 le 19/10/2026 : cette cellule se saisit au clavier numérique MMSS, « À l’échec » étant la commande de gauche de la barre du clavier ; ce sélecteur n’a plus d’usage en mode Durée] ; la roulette Objectif de durée des séries identiques est numérique seule et À l’échec s’y règle par la Condition d’arrêt (RM-248, RM-250). La roulette Répétitions suit D-418 : sans option À l’échec en séries identiques, avec « Aucune répétition, à l’échec » en tête dans une cellule de séries variables.

À tout instant, exactement une cible est sélectionnée. À l’ouverture : cible numérique → roulette active sur la valeur courante et libellé échec à45% ; cible échec → libellé actif et bloc numérique grisé à45%, affiché à00:00 en mode Durée uniquement. Faire tourner la roulette sélectionne la valeur numérique et grise le libellé. Toucher le libellé sélectionne l’échec et ramène le bloc numérique grisé à00:00 en mode Durée. Le grisé exprime la non-sélection, pas une interdiction de manipuler la roulette. Aucun geste supplémentaire de déverrouillage, aucune coche. ✓ de la roulette applique la sélection au brouillon de la feuille ; ✕ de la roulette restaure la valeur à son ouverture. ✓ de la feuille applique l’ensemble au parent ; ✕ de la feuille annule toutes les modifications depuis son ouverture, y compris celles validées dans une roulette. Aucune persistance définitive à la validation de la roulette.00:00 n’est jamais une cible valide ; pause0 reste valide.

**Bornes confirmées le13/10 :** cible Durée de00:05 à58:55 (5–3535s), sélecteur par pas de 1 s. Hermann corrige explicitement la borne maximale :58min55s ;5999s était une coquille. Répétitions : entiers1–100.00:00 reste réservé à la représentation neutre de l’échec, jamais une cible. Les valeurs historiques ne sont pas arrondies silencieusement à la lecture ; les contrôles de pauses et de Durée totale conservent leurs règles propres. Valeur historique hors bornes : conserver sa donnée et l’afficher exactement en consultation tant qu’elle n’est pas modifiée, sans arrondi ni écriture silencieuse (D-383). Le positionnement initial de la roulette sur cette valeur hors bornes à son ouverture reste `À CLARIFIER` (PRE-4 Q36) ; il ne modifie pas la valeur persistée. La roulette propose les valeurs de 1 à 3535 s par pas de 1 s (minimum porté de 5 à 1 s par D-430, 19/10/2026 ; la borne 00:05 confirmée le 13/10 est remplacée sur ce seul point) ; une sélection explicite remplace la valeur historique. La cible Durée utilise un pas de 1 s, dans les bornes autorisées, sans pied ± (retiré par D-413) ; ne pas confondre ce pas avec celui des pauses ou des phases. 00:00 ne peut pas être validé comme cible numérique et ne sélectionne jamais implicitement À l’échec. 5999 s n’est pas une borne autorisée.

<a id="formats-raccordement"></a>

#### Raccordement aux formats de séance

Paramètres selon le bon porteur et CE-FMT-04 ; Tabata/30/30 ne verrouillent rien. For time utilise les séries de l’Exercice, indexées par tour dans son Circuit porteur.

<a id="rendu-phrase"></a>
### Rendu et accessibilité de la phrase

#### Rendu et accessibilité

Zone cliquable unique, segments non interactifs. Inter 13 Regular, interligne 20 ; valeurs Semi Bold dans le texte courant. Référence 402 : x39, largeur 324 ; hauteur intrinsèque, retour naturel, aucun plafond de caractères. Le titre et les lignes Compte à rebours/Fin gardent leur hiérarchie. Zone entière → CE-UI-10, focus unique « Modifier les paramètres d’exécution ». Texte complet accessible et agrandissable ; retour de ligne de présentation avant Durée totale sans changement de grammaire.

La référence 7119:27855 est désormais « Phrase longue (224 caractères) », cas 144 du corpus v15 : largeur 324px, cinq lignes de 20px, bloc 100px, carte de paramètres 193px à hauteur automatique. Ces mesures constatées ne deviennent pas des hauteurs fixes : agrandissement de texte et autres largeurs doivent étendre le contenu sans rogner Compte à rebours/Fin.

Une virgule reste attachée au mot qui la précède : aucune virgule isolée en début de ligne. Les segments sont rendus dans un même flux Text, sans espace ajouté avant la ponctuation ni segments disposés chacun comme une boîte indépendante. Le retour visuel avant Durée totale est une propriété de rendu, pas une modification du texte canonique utilisé par la recette. La mention de charge `(charge : 20 kg)` ou `(charges : 20, 12, 13 kg)` suit le même rendu en segments, après la valeur par série (RM-240, D-414, D-422).

## Composition des séances

### CE-T03-06 — Composition — `Ajouter un exercice` vers le Catalogue

#### 1. Identification

Action Ajouter un exercice dans Composition ; propriétaire de l’écran CE-T03-08 et de la modale CE-T03-07. Aucun arbre intermédiaire actif.

Règles applicables : RM-192 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Ouvrir directement la sélection des Exercices persistants du Catalogue depuis la Composition, sans arbre intermédiaire.

#### 3. Contexte d’entrée

Tap `+ Ajouter un exercice` dans la Composition.

#### 4. Contexte de sortie / destinations

Ouvre CE-T03-07 au-dessus du brouillon courant. Fermer sans Sélectionner rend le même brouillon sans insertion.

#### 5. Données affichées et source de vérité

Aucune donnée métier n’est créée à l’ouverture. Le brouillon de Composition existant est conservé.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Les anciennes options `Un nouvel exercice / Un exercice existant / Annuler` appartiennent à des frames historiques et ne sont plus des contrôles du parcours courant.

#### 7. Structure de l’écran

Aucun écran intermédiaire : transition directe de la Composition vers la sélection Catalogue.

#### 8. Éléments obligatoires

Action `Ajouter un exercice` dans la Composition ; écran de sélection CE-T03-07.

#### 9. Layout déterministe

Aucun layout d’arbre contextuel à implémenter.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Conforme à la Composition puis à CE-T03-07.

#### 11. États de l’écran

Composition → sélection Catalogue → retour/validation.

#### 12. Contrôles et interactions

Le tap ouvre CE-T03-07. Aucun choix préalable n’est demandé.

#### 13. Gestes

Tap sur `Ajouter un exercice`.

#### 14. Validation

La validation métier est portée par CE-T03-07 ; aucune mutation à l’ouverture.

#### 15. Brouillon et persistance

Le brouillon de Composition est conservé. La capacité existante de création directe d’une `SessionActivity` locale reste fonctionnellement et techniquement conservée mais n’est pas exposée dans cet enchaînement.

#### 16. Navigation et conservation d’état

Conserver ID de brouillon, point d’insertion et position de Composition pendant la modale. Retour annulation identique ; retour validé montre les nouvelles copies au point d’insertion.

#### 17. Erreurs et cas limites

Échec d’ouverture du Catalogue → Composition inchangée.

#### 18. Accessibilité

`Ajouter un exercice` annonce l’ouverture de la sélection d’Exercices.

#### 19. Invariants

Aucun arbre intermédiaire ; aucune suppression du mécanisme technique de `SessionActivity` locale.

#### 20. Recette déterministe

Ouvrir/fermer sans sélection ; sélectionner une puis plusieurs définitions ; vérifier brouillon et ordre d’insertion ; aucune création persistante de Session avant Continuer ; aucune création locale exposée par cet enchaînement.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

### CE-T03-07 — Sélection multiple d’Exercices existants

#### 1. Identification

Modale Sélection des exercices depuis Composition ; frame 3789:5349. Le bouton Créer une activité résiduel de la capture n’appartient pas au parcours exposé D-194.

Règles applicables : RM-095, RM-113, RM-163, RM-192, RM-209 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Choisir plusieurs définitions actives puis copier selon le tri du Catalogue appliqué à toute la sélection, puis createdAt et identifiant croissants, indépendamment des requêtes et des touchers.

#### 3. Contexte d’entrée

Ouverture directe depuis `Ajouter un exercice` dans CE-T03-06.

#### 4. Contexte de sortie / destinations

Fermer/Annuler → Composition sans mutation ; Sélectionner avec N>0 → insertion groupée dans le brouillon puis CE-T03-08.

#### 5. Données affichées et source de vérité

D-437/D-439 : regroupement par mouvement, mais sélection par définition précise et résumé de paramètres. Une ligne de groupe ne choisit pas de paramètres implicitement. La copie reçoit contenu résolu et sourceMovementId, sans dépendance de lecture ultérieure.

Définitions actives et ensemble d’IDs sélectionnés en mémoire. Ordre de la liste affichée, stable pendant la sélection. Recherche textuelle et filtres Catégorie/Zones selon v7 §7 ; les sélections masquées sont conservées et incluses au compteur.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Noms/paramètres = dynamiques. Compteur = calculé. Libellés/actions = statiques. Exemples = démonstration.

#### 7. Structure de l’écran

Modale avec titre, fermeture, liste défilante, cases à cocher et compteur, CTA Sélectionner fixe. Pas de création locale exposée.

#### 8. Éléments obligatoires

Case 20, titre 15, pastilles 20, valeurs 16, compteur et Sélectionner désactivé à 0. Aucun badge durée/heure, Lecture ou Déployer. Fermeture accessible dans l’en-tête.

#### 9. Layout déterministe


Composants actifs et propriété Durée : [DSF cartes du 07/10](../DSF-CARTES-DUREE-2026-10-07.md). La suppression du cadre de durée Catalogue ne change pas le contrat de cette variante : sélecteurs sans durée, Suivi avec durée réelle, Calendrier avec données de planification. Ne pas injecter une durée à cause du défauttrue de la propriété Figma.

Cartes standard : largeur 354 sur écran 402, rayon 8, fond #F9FAFC, bord intérieur 0,5 #CCD1E0, titre 15 Semi Bold ; classement pastilles 20, valeurs nues 16 ; aucune barre verticale. Références APRÈS6354:16089 / Photo 6354:16964. Les captures actualisées le 30/09 sont listées dans la matrice de couverture ; les fichiers hors remplacement restent historiques. Choix Composition 354 × 91 ; cadre des zones corporelles arrêté à 8 px de la case, points de suspension en fin, liste seule défilante ; actions fixes. Gouttière permanente d’exercice : carré 64 à 12 du bord, photo si média ou icône de nature sinon, centrée et recadrée sans déformation (couverture vidéo), texte x88 ; titre 250 en Catalogue replié/archivé, lignes basses 207 ; Choix conserve sa largeur liée au contrôle ; hauteur inchangée ; place réservée pendant chargement/erreur, texte alternatif = nom de l’exercice. Aucun badge durée/heure dans ce choix, catégorie conservée, pictogramme de zone conservé ; Déployer absent.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; recherche avec clavier ; validation reste accessible ; lignes s’étendent pour texte ; scroll indépendant.

#### 11. États de l’écran

Liste vide ; 0/1/N sélection ; Sélectionner désactivé/actif ; copie en cours ; erreur ; texte long et média chargé/indisponible.

#### 12. Contrôles et interactions


Toucher ligne/case sélectionne ou désélectionne le même ID. Sélectionner produit une seule insertion groupée. Fermer annule toute sélection transitoire. Recherche et filtres locaux autorisés ; aucun réordre manuel ni action Créer un exercice ajouté.

#### 13. Gestes

Tap et scroll uniquement. Aucun drag/reorder.

#### 14. Validation

N>0 et toutes définitions encore disponibles avant insertion. L’ordre final suit v7 §7 : tri Catalogue, date de création croissante, identifiant croissant. Une disparition invalide cette soumission, actualise sélection/compteur et demande une nouvelle validation explicite.

#### 15. Brouillon et persistance

Les copies sont ajoutées atomiquement au brouillon de Composition ; aucune sauvegarde de Séance avant Continuer. Une erreur ne laisse aucune copie partielle. Les copies portent les paramètres intrinsèques ; la récupération déjà portée par un Exercice réutilisé est conservée ; le défaut Profil ne s’applique qu’à un nouvel Exercice.

#### 16. Navigation et conservation d’état

Succès → Composition enrichie, même contexte/scroll autant que possible. Annuler → exact état antérieur.

#### 17. Erreurs et cas limites

Définition supprimée entre sélection et validation : la retirer/recalculer, empêcher copie fantôme, informer. Échec d’une copie → rollback total.

#### 18. Accessibilité

Chaque ligne annonce nom/type et sélection ; cible case≥44 ; compteur annoncé après modification ; Sélectionner désactivé à 0 ; focus captif dans modale, restitué au déclencheur à la fermeture.

#### 19. Invariants

Ordre liste et non touchers ; copies indépendantes ; zéro sélection interdit ; pas de copie fantôme ou partielle ; pas de synchronisation ultérieure à la définition source.

#### 20. Recette déterministe

Liste A/B : sélectionner B puis A → insertion A/B ; désélection, 0/1/N, fermeture sans effet, double tap, suppression de source avant validation, rollback total, modification indépendante des copies. Vérifier recherche, filtres et sélection conservée ; aucun badge durée/lecture/déploiement/création ; vignette, texte long, cadre de coupe à 8 px de la case, clavier de recherche pris en charge.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

### CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation

**Complément Formats actif :** Tabata et 30/30 standards modifiables ; contraintes effectives des Formats spécialisés selon CE-FMT-04 et la référence du 02/11.

<a id="composition-menu-creer"></a>

**Nom de la Séance.** Le nom du Format peut être suggéré initialement ; le champ reste modifiable dès l’ouverture. Aucun Format n’impose le nom, et un nom personnalisé n’est jamais remplacé automatiquement. B.8 est déclarée développée et recettée par Hermann le 02/11 ; le parcours Formats actuel ne réintroduit pas cette option dans le menu à trois options.

Le menu Créer propose trois options, dans cet ordre : **Créer un exercice**, **Créer un circuit**, **Créer un cycle**. Créer un exercice ouvre la modale commune « Créer un exercice » : Exercice libre, puis grille Formats d’entraînement. Les mouvements existants se sélectionnent dans la fiche de création ; aucun accès distinct « Utiliser des mouvements existants » ou « Utiliser un format d’entraînement » dans ce menu. Le bouton + devient Annuler, croix grise 34 px au même emplacement ; voile, axe jusqu’à Créer un cycle et fermeture sont conservés. Créer un circuit/un cycle conserve le choix d’emplacement existant.

À l’ouverture, le bouton + « Ajouter une activité » devient Annuler : croix standard sur fond gris, 34 px, à l’emplacement exact du + et au-dessus du voile. Le toucher ferme le menu sans action ; la fermeture rétablit +. Le bouton Pause / Ajouter un arrêt conserve sa place à gauche, sous le voile. [Précisé le 01/11/2026 — recette iPhone PRE-9 de Hermann : « la zone de contexte doit être sous le voile grisé, seuls le bouton créer -> annuler, et les options doivent être visible dessus » : toute la zone de contexte est sous le voile ; seuls Annuler (le + transformé), l’axe et les options sont au-dessus.] Un axe vertical, au-dessus du voile et sous les options, relie Annuler aux icônes et s’arrête à Ajouter un cycle. Aucune option Annuler n’est ajoutée à la liste.

L’écran ouvert par « Créer un exercice » porte ce même titre. Le bouton de confirmation du mouvement sélectionné porte « Créer un exercice ». Les cartes de suggestion conservent les composants et règles du parcours de recherche existant ; ce libellé ne renomme pas les actions distinctes de correction ou de création d’un Mouvement dans les autres contextes.

Références Figma : « Composition séance — Initial » `8328:28172` et « Composition séance — Créer (menu) » `10705:20223`.

**MENU-FMT-01 — remplacée :** le parcours actif est celui de la fenêtre Formats et du menu à trois options ci-dessus.

**Référence courante du 28/10 :** [Composition du 28/10](../KODJO-Composition-conteneurs-2026-10-28.md) remplace les dispositions antérieures contraires de ce contrat : menu à trois options, création par enveloppe non vide, multi-circuit, cycle visible et non repliable, appui long G1–G8 et défilement CS-D1–CS-D8. La sélection d’enveloppe transfrontière et les frontières des points d’arrêt restent explicitement réservées ; les maquettes ne valent pas règle implicite.

#### 1. Identification

Composition courante du 21/10 : Standard `8328:28605`, création vide `8328:28172`, nom saisi `8328:28238`, modification `5271:5455`, placement `8328:29270`, récupération `8328:28733`, retrait `8328:29133`, point `8328:29428`, déplacement `8328:33546`, actions glissées `8328:28863`, carte v2 `9798:44464`. Références antérieures : Composition 2028:11137/11700/11808/12003,3518:4576 ; placement 7167:13503, durée 7173:13521, retrait 7296:13696, point 3722:5061/retrait 5301:5443. Ancien 4893:6675 supprimé, historique seulement. Étiquettes CE-T03-16, sélection CE-T03-07. Réglages 2028:11375/11457. [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.]

Règles applicables : RM-001, RM-015, RM-017, RM-018, RM-021, RM-025, RM-026, RM-027, RM-028, RM-029, RM-030, RM-036, RM-038, RM-095, RM-129, RM-143, RM-147, RM-151, RM-152, RM-159, RM-191, RM-209, RM-210, RM-213, RM-215, RM-218, RM-219, RM-220, RM-FMT-03, RM-FMT-04, RM-FMT-05, RM-FMT-09, RM-FMT-41, RM-236, RM-243, RM-251 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité » ; RM-251 rattachée par citation directe depuis D-441)

**Révision Composition du 06/11/2026 — D-511 à D-513, classe B :** carte d’exercice 72 pt, trois lignes nom/niveau, catégorie/prescription, zones/rôle/récupération ; aucun chevron de carte ni chronomètre. Chevron du Circuit entre rond du rail et nom ; Cycle non repliable. Placement réservé aux Points d’arrêt, sans cadre de récupération. Règles détaillées et état partiel de Figma : [spécification §11](../KODJO-Catalogues-cartes-modales-2026-11-06.md#11-composition--carte-dexercice-en-tête-de-circuit-placement). Cette révision prévaut sur les anciennes géométries et prescriptions annotées ci-dessous.

**Réalisation du 08/11/2026 (demande de Hermann : « Utiliser le composant « Carte d'exercice » dans la Composition de séance ») :** toutes les cartes d’Exercice de la Composition — Exercice isolé, dans un Cycle, dans un Circuit, buy-in, buy-out, placement — sont rendues par le composant « DSF / Cards / Exercice — Composition » (`11810:2159`) ; variante « Hors circuit » (pictogramme noir) ou « Dans un circuit » (pictogramme gris) selon l’appartenance effective à un Circuit, un Exercice directement dans un Cycle étant « Hors circuit ». À 402 : cartes de 362 à x 20, rail au centre de la photo (x 56), Circuit de 386 à x 8 inchangé ; marge basse d’un Circuit ou d’un Cycle sous ses cartes égale à l’écart bas de la photo → bas de la carte (4). [Remplacé le 08/11/2026 au soir (Hermann : « Respecte les espaces suivants … ») : cartes à 20 du bord de l'écran (362 à 402), Circuit à 10 du bord, cartes à 10 de son cadre, 10 sous la dernière carte ; Cycle de bord à bord, son Circuit à 10 de son bord, 12 sous son dernier membre. Voir ch07, « Marges des cadres et liseré des cartes (08/11/2026 au soir) ».] [Précisé le 08/11/2026 au soir : 0,75 pt pour la carte directement dans la Séance ; 0,5 pt dans un Circuit ou un Cycle (`borderWidths.exerciseCardSessionLevel` / `exerciseCard`).] Ligne 3 : rôle « Buy-in » / « Buy-out » puis sablier et durée de récupération, les deux ensemble lorsqu’ils existent. Prescription sans estimation : « 6 × 10 rép. », « 10 · 12 · 14 rép. », « 10 rép. +2/tour » (AMRAP, Volume croissant), « 1 rép. +1/min » (Death by), « 3 × 1′30″ », « à l’échec ». Le niveau « Niveau N » est à droite de la ligne 1 ; le nom visible ne porte plus le suffixe « - Nn » (nom accessible inchangé). Bandeau de placement « Confirmer N points d’arrêt ajoutés ». Interactions conservées : toucher (paramètres d’exécution), photo (fiche du mouvement), appui long et glisser, balayage Dupliquer / Supprimer, actions VoiceOver « Monter » / « Descendre ». Détail et points À CLARIFIER : chapitre 07, « Composition — carte d'exercice au composant DSF / Cards / Exercice — Composition (08/11/2026) ».

#### 2. Finalité fonctionnelle

Créer/modifier la Séance : nom, Étiquette facultative, exercices directs et circuits/cycles facultatifs, comptes propres et pauses explicites. Valider une seule fois vers le Catalogue.

#### 3. Contexte d’entrée

Créer depuis Catalogues/Séances, ouvrir une Séance existante, revenir de sélection/édition d’Exercice ou d’Étiquette. La modification part d’une copie de travail de la Séance.

#### 4. Contexte de sortie / destinations

Exercice → éditeur de copie locale ; Ajouter un exercice → CE-T03-07 ; Étiquette → CE-T03-16 ; Continuer valide/enregistre → CE-T03-01 segment Séances. Retour avec changements → confirmation d’abandon 2028:11298 ; abandon confirmé détruit le brouillon seul.

#### 5. Données affichées et source de vérité

**Complément cible 12/10 :** Nature, compte et régime explicites. N imposé en circuit à séries alternées ; durées agrégées exact/≈/≥, sans lire les chiffres Figma.

Brouillon Session indépendant, nom, Étiquette 0..1, compte à rebours/Fin, exercices directs et conteneurs facultatifs multiples, natures séries groupées/alternées, comptes propres 1..99 (D-451), exclusion systématique des Compte à rebours/Fin propres selon D-214 révisée, sans booléen et sans effacer leurs valeurs. Le défaut Profil initialise la récupération d’un nouvel Exercice ; un Exercice existant conserve sa valeur ; elle reste solidaire de son occurrence. postActivityRecoverySeconds est sa projection de calcul, 0 en l’absence de récupération (D-304/D-307). Chaque occurrence conserve ses séries/cadences ; To=T−PN+R si R>0, sinon To=T pour un travail calculable. Total développé selon la nature du Circuit ; exact/estimated/lowerBound selon [Résultats temporels et agrégation du circuit](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit) et spécification Circuits du 12/10. Point d’arrêt sans durée prévue.

#### 6. Classification des valeurs Figma

Titres statiques : `Composer une séance` en création, `Modifier une séance` en modification. Noms/paramètres = dynamiques ; titres structurels = statiques ; positions de cartes d’exemple = démonstration.

#### 7. Structure de l’écran

Nom/contexte de Séance, Étiquette et actions → compte à rebours initial → séquence de cycles, circuits et exercices directs, avec points aux positions autorisées → Fin de séance → Continuer (D-451). Chaque occurrence prend la forme d’une carte v2 à trois lignes (nom et indicateur de côté, Catégorie et travail, Zones corporelles et récupération), avec média intégré. Les points d’arrêt occupent des interstices centrés, raccordés au rail segmenté ; la récupération contextualisée s’intègre à la carte qui la précède et n’occupe plus de rangée autonome. Cycles visibles dans le MVP depuis D-451 ; aucune étape finale Catégories.

#### 8. Éléments obligatoires

**Référence 28/10 :** nombre et adjectif de nature sont deux commandes distinctes ; l’unité est un texte. Chevron accolé au nom du circuit ; aucun chevron sur le cycle. Le repli conserve les noms des exercices.

Compte à rebours/Fin non déplaçables ; nombre au format Valeur modifiable, stepper révélé au toucher ; unité tour(s) non interactive ; adjectif groupées/alternées ouvrant le choix ; chevron de repli accolé au nom du circuit, cycle non repliable ; aucun côté au Circuit (référence 28/10). Dans la zone de contexte, la puce Étiquette porte l’icône d’étiquette (contour de l’étiquette), dans la couleur de l’Étiquette quand elle est choisie, et non une pastille ronde (D-442). Aucun avertissement d’enchaînement sans pause (D-301 retirée par D-442). Carte sans Pause intrinsèque affichée ; récupération contextuelle affichable sur la troisième ligne de la carte (D-435), jamais sur une rangée séparée. Ligne variable : volumes séparés par un point médian, unité finale ; trois valeurs au maximum selon place puis ellipse. Régime explicite, notation stable ; voir chapitre 13, Cartes et grille des volumes. Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement (D-303). V-04 est clos par clarification du 12/10 : aucun réglage global D-214 n’est requis ; aucune modification Figma nécessaire sur ce point, selon confirmation du propriétaire. [29/10/2026, recette PRE-9 n° 1 (Hermann) : nombre et unité contigus, en gras, une seule cible du stepper — voir ch07 « Recette PRE-9 n° 1 — décisions de Hermann du 29/10/2026 ».]

#### 9. Layout déterministe


**Arbitrages de recette du 21/10 — D1 et D6 :** aucun trait de démarcation entre les cartes de Composition (hors rail segmenté et liaisons des points d’arrêt) ; les anciennes prescriptions de trait permanent D-303 sont supersédées sur ce seul rendu. En mode placement, les cartes conservent un grisé visuel perceptible pour signifier leur indisponibilité au toucher ; leur couleur ne doit pas masquer les zones d’ajout, le contenu ni les repères du rail. Le retour au mode normal restaure les styles habituels ; les gestes et règles d’édition existants ne sont pas changés.

Shell de Composition conservé ; commandes contextuelles 34/dessin20/gap10/cibles44 dans bande 32, durée immobile et actions à droite 6 plus bas. À la largeur Figma de 402 : cartes v2 370 × 80 dès x16, rayon12, fond blanc, bord1 `#E4E7EF` hors Circuit et sans bord dans Circuit ; média64 × 64 à x24, rayon12/bord1 `#7A7A80` ; texte dès x100, symboles x282, valeurs alignées sur x378. Les colonnes s’adaptent aux largeurs 360/402/440 et aux libellés. Catégorie et Zones sont deux propriétés distinctes ; deux valeurs éventuelles sur la ligne de travail ne repoussent pas la récupération de la ligne3. Rail `#7A7A80` 1,5, segmenté entre bords des repères et médias, calculé depuis le layout réel, jamais sur les gabarits. Circuit : aplat `#F3F4F9`, débord 8 de part et d’autre des cartes, sans rectangle de contour, cartes internes espacées de 9 ; nom et chevron en colonne fixe, compteur à abscisse fixe et durée à droite ; nom/nombre 15 pt, unité 13 pt, durée 12 pt. Le rendu du 28/10 remplace D-442 sur ces paramètres ; cibles compactes à qualifier. En placement, point d’arrêt centré dans un espace dédié de 22 et raccordé au rail ; récupération proposée par cadre pointillé dans la zone de ligne3 des seules cartes éligibles. Les commandes de nature et de volumes sont conservées même absentes d’une maquette illustrative. Les états soulevé et swipe renvoient à `8328:33546` et `8328:28863` ; un Point d’arrêt saisi par appui long est marqué visuellement par un état soulevé, comme une carte (D-442). Annuler et Confirmer restent accessibles dans le pied protégé. Depuis le complément du 28/10, qui remplace D-443 sur ce rendu, la durée du Circuit est affichée à droite et son compteur reste à abscisse fixe ; les cadres du Compte à rebours initial et de la Fin de séance sont alignés à droite sur le cadre des cartes d’Exercice. Le pied de Continuer et la barre de placement ✓ / Annuler suivent le composant d’action principal standardisé (D-444) : zone fixe protégée, dégradé blanc pleine largeur, bouton centré verticalement dans la zone, zone de sécurité inférieure d’iOS respectée, même position verticale sans saut au changement de mode. Le rail ne remplace pas les règles existantes sur le trait de démarcation (D-303). [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.]

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; largeur utile calculée, troncature du nom et des Zones sans chevauchement des symboles/valeurs, cibles tactiles indépendantes de la taille dessinée13. Scroll de toute la séquence, y compris en placement lorsque les rangées agrandissent le contenu, jusqu’au dernier emplacement sous le pied fixe protégé ; actions Annuler/Confirmer toujours accessibles et Safe Areas respectées ; le contenu défilant s’arrête avant la zone protégée du bouton d’action principal, sans qu’aucun élément soit masqué ni rendu inaccessible (D-444). Pendant le glisser d’une carte d’Exercice ou d’un Point d’arrêt, amener l’élément près du bord haut ou bas de la zone visible fait défiler la liste pour atteindre les cartes et emplacements non visibles ; le défilement s’arrête quand l’élément quitte ce bord ou à la dépose, sans changer les règles de dépose (D-442). Pas de clavier sauf champs de contexte déjà définis.

#### 11. États de l’écran

**Complément cible 12/10 :** Tours/séries ; compteur au repos / stepper ouvert au toucher (28/10, remplace la permanence D-442) ; conversion avec/sans perte ; confirmation annulée/confirmée ; réserve après diminution ; grille ouverte ; N minimal/maximal.

Création vide ; nom saisi ; composition valide/invalide ; édition ; Étiquette sélectionnée/absente ; réglages initial/fin ; glissé/déplacement ; placement multiple sans/avec sélection ; roulette récupération ; confirmation décomptée ; retour/annulation ; Récupération existante sélectionnée/désélectionnée (retrait programmé) ou modifiée en placement (D-442, qui supprime la bulle de retrait de la récupération) ; Point d’arrêt soulevé/déplacé/dépose refusée ; déplacement d’Exercice avec Point(s) retiré(s) sans message ; défilement automatique pendant un glisser ; choix début/fin de Tour à N ≥ 2 ; placement avec Points existants sélectionnés/désélectionnés (retrait programmé) ; suppression d’Exercice avec Point(s) retiré(s) sans message et carte disparaissant en fondu (D-442, qui remplace la suppression refusée de D-441) ; abandon/sauvegarde/erreur. Rabsente/R0/Rpositive croisés avec point absent/présent et trait hors/en placement.

#### 12. Contrôles et interactions


D-445 : contenu courant lu depuis le mouvement, crayon de correction partagée disponible ; paramètres locaux et commande Niveau modifiables selon contraintes. Changer de mouvement remplace l’occurrence, sans réécrire la filiation passée. Duplication = paramètres indépendants et même mouvement.

**Complément cible 12/10 :** Choix de nature → CE-CIR-01 ; perte → CE-CIR-02 ; vue Volumes CE-CIR-03 retirée le 5 novembre. Diminution sans message ; restauration avant préremplissage. Ajout catalogue avec perte exige confirmation, Annuler abandonne ajout.

Le mode Placement ne porte que sur les Points d’arrêt. Les cartes restent grisées, les emplacements autorisés restent actionnables et défilants jusqu’à la dernière position. Un Point existant apparaît sélectionné ; sa désélection programme son retrait. Confirmer applique le sous-brouillon atomiquement, Annuler le restitue ; l’enregistrement final reste celui de la Séance. Les contraintes de position, de non-consécutivité et de déplacement des Points restent celles de RM-251. Aucune zone d’ajout ou de retrait de Récupération n’est proposée.

En-tête du Circuit (D-442) : − et + toujours affichés et actifs autour du nombre de Tours ou de Séries, sans toucher préalable ; pastille d’unité → choix de nature. [Remplacé par le complément D-451 du 28/10/2026 (registre ch07) et RM-027 : « N tours · groupées / alternées », toucher le nombre révèle le stepper, unité tour(s) non interactive, adjectif → choix Séries groupées / Séries alternées, durée à droite, chevron de repli (Circuit replié : ligne des noms, 68 pt) ; livré par PRE-9 B.1a, annotation du 29/10/2026.] Début et fin de Tour (D-442) : un Point d’arrêt en tête de Circuit (début de Tour, avant son premier Exercice) est autorisé et proposé, comme en fin de Tour. Lorsque le Circuit est exécuté plusieurs fois (N ≥ 2 Tours ou Séries), une action qui ferait se suivre un Point de début de Tour et un Point de fin de Tour entre deux Tours — placement, déplacement d’un Point, déplacement d’un Exercice, passage de N = 1 à N ≥ 2 — demande lequel conserver : « Début de tour » ou « Fin de tour », ou Annuler l’action qui créerait les deux.

#### 13. Gestes

Swipe occurrence : Dupliquer/Supprimer, avec état visuel `8328:28863`. Appui long sur toute la carte, pas uniquement sur le média, puis glisser : déplacer, sans poignée permanente au repos ; rendu soulevé `8328:33546`. La récupération suit l’occurrence durant déplacement, duplication et suppression ; le Point d’arrêt ne la suit pas, garde sa position et n’est pas copié (D-441). Un déplacement d’Exercice qui laisserait un Point d’arrêt à une position non autorisée (juste après le Compte à rebours, juste avant la Fin, ou consécutif à un autre Point) est appliqué : le ou les Points en cause sont retirés, sans message ; pour deux Points devenus consécutifs, le premier est conservé (D-442, qui remplace le refus de D-441). La suppression d’un Exercice suit la même règle : elle est appliquée et le ou les Points en cause sont retirés, sans message (D-442, recette J6 du 22/10, qui remplace le refus doux de D-441) ; la carte supprimée disparaît en fondu et les éléments suivants glissent pour combler sa place (D-442), plus lentement et sans arrêt brutal depuis D-443. Depuis D-443, tous les mouvements de la Composition sont doux, sans arrêt brutal, avec une fin progressive : la carte créée par Dupliquer apparaît en fondu lent et les éléments suivants glissent pour lui faire place ; les actions glissées s’ouvrent, se referment et reviennent sans arrêt brutal. Appui long point : Point marqué visuellement par un état soulevé, comme une carte, puis glisser autonome vers une position autorisée, effectif à la seule dépose valide ; dépose interdite refusée sans modification. Pendant le glisser d’une carte ou d’un Point, l’approche du bord haut ou bas de la zone visible fait défiler la liste (D-442). Hors placement, la récupération ne réagit ni au toucher ni à l’appui long : aucune bulle Retirer (D-442, qui remplace la bulle de D-435). Compte à rebours/Fin non déplaçables.

#### 14. Validation

Continuer exige nom et au moins un Exercice valide ; il reste désactivé, et la Séance n’est pas enregistrée, si un de ses Exercices comporte une cible obligatoire non renseignée (D-380, D-123). Le contrôle ou champ obligatoire sans valeur est signalé par son fond rouge pâle, pas la carte entière, sans message supplémentaire (D-389). Récupération 0..300 s, grille 1 s jusqu’à 5,5 s jusqu’à 120,30 s jusqu’à 300 ; aucune durée requise pour point. Compte à rebours initial et Fin de séance : 0..60 s, pas 1 s, affichés en secondes seulement (D-443, qui remplace la borne 0..3599 s de D-089). Récupération après occurrence, dernière comprise ; pas avant première. Point interdit immédiatement après compte à rebours initial et avant Fin ; autorisé avant/après Circuit, en tête de Circuit (début de Tour, D-442) et entre ses Exercices. À N ≥ 2, un Point de début ou de fin de Tour reste autorisé même si le Circuit ouvre ou clôt la Séance : l’exécution omet seulement l’arrêt qui suivrait le Compte à rebours ou précéderait la Fin ; à N = 1, RM-219 s’applique et un Point devenu interdit par le passage à N = 1 est retiré sans message (D-442). Deux Points jamais consécutifs sans Exercice entre eux, récupération non séparatrice, frontières du Circuit comprises (RM-251) ; refus à l’insertion et au déplacement d’un Point ; au déplacement et à la suppression d’un Exercice, le ou les Points en cause sont retirés sans message, le premier de deux Points devenus consécutifs étant conservé (D-442) ; à N ≥ 2, un Point de début de Tour et un Point de fin de Tour donnent lieu au choix de celui à conserver (D-442). Un élément de chaque type au même emplacement ; pas de doublon du même type. Drop invalide d’un Point restitue la position ; la suppression d’un Exercice n’est plus refusée (D-442, qui remplace le refus doux de D-441). Les affectations de référentiels retirées restent valides selon D-210.

#### 15. Brouillon et persistance

**Complément cible 12/10 :** Diminution du compte : réserve dans le brouillon de séance jusqu’à Continuer/enregistrement ; conversion confirmée : troncature définitive. Annuler conversion restitue nature et toutes données.

Brouillon de placement isolé du brouillon Composition ; roulette incluse dans cette transaction. Confirmer applique atomiquement au parent, Continuer seul persiste Session+Composition. Annuler la roulette ne confirme pas un ajout ; Annuler placement restaure son état d’entrée ; abandon Séance restaure la version persistée.

Une récupération explicitement réglée à 0 reste persistée ; seule sa désélection en placement, appliquée par Confirmer, supprime l’objet (D-442). Elle ne produit aucune phase et ne remplace pasPN. Pause après chaque série et Pause de Composition sont deux données distinctes.

#### 16. Navigation et conservation d’état

Sous-parcours : conserver brouillon, insertion et scroll. Continuer succès → Catalogues/Séances avec transition canonique ; aucune page Catégories. Échec : rester, brouillon intact, action réactivée.

#### 17. Erreurs et cas limites

Liste vide, position interdite, erreur durée, double tap et erreur de transaction : pas de mutation partielle. R0 ne génère aucune phase. Suppression recovery retire cette phase et rétablit la Pause terminale configurée ; aucun changement de définition Catalogue. Anciennes séances : aucune reprise imposée par ce lot ; ne pas confondre migration de schéma et reprise fonctionnelle.

#### 18. Accessibilité

Annoncer type, position, durée, sélection et nombre d’ajouts ; ordre de focus récupération puis point à chaque emplacement. Focus contenu dans la roulette puis rendu à la commande d’origine (les bulles de retrait sont supprimées par D-441 et D-442). Alternatives accessibles au drag/swipe, dont les actions Monter / Descendre d’un Point d’arrêt vers l’emplacement autorisé voisin et la sélection/désélection annoncée d’un Point ou d’une récupération existants en placement (D-441, D-442) ; annonce de la raison d’un refus de dépose (la suppression n’est plus refusée depuis D-442) ; sélection non fondée sur couleur seule ; suppression et annulation explicitement nommées.

#### 19. Invariants

**Complément cible 12/10 :** Un circuit MVP. Nature séries : tous exercices à N ; régime indépendant. Passage bilatéral unique PC puis Pi terminale. Aucun compte à rebours/fin propre en SESSION.

Pause après chaque série, dernière comprise, même N1. Hors circuit à séries alternées, PN puis PC se cumulent à la frontière des côtés successifs ; ordre par paire selon paramètres d’exercice du chapitre 08. Dans un circuit à séries alternées : premier côté → PC → second côté → Pi, déroulement unique ; R positive remplace Pi terminale. Seule la toute dernière Pause est remplacée si une récupération positive suit l’Exercice ; sans elle (ou R0), conserver PN. En direct, conserver PN sans récupération contextuelle. Réordonner les Séries réévalue la dernière Pause.

Circuit=groupe, Tour=répétition ; récupération positive avant point, attente exclue du prévu ; éléments internes répétés à chaque Tour. Jamais deux Points d’arrêt consécutifs dans la Séance enregistrée ; un passage partiel de Circuit à séries alternées qui en ferait se suivre deux n’exécute qu’un arrêt, sans modifier la Séance (RM-251). À N ≥ 2, un Point de début ou de fin de Tour d’un Circuit qui ouvre ou clôt la Séance n’omet à l’exécution que l’arrêt qui suivrait le Compte à rebours ou précéderait la Fin (D-442). Récupération du nouvel Exercice initialisée depuis le Profil ; aucune récupération directe dans le parcours historique ACTIVITY. Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement (D-303). D-248 confirmée sur pause terminale et substitution par R ; D-301 retirée par D-442 : aucun avertissement pour l’absence de pause effective entre Exercices ; aucune persistance avant Continuer.

CF3 déjà tranché par RM-151/RM-152, amendées par D-407 : indicateur compact de changement de côté conservé, sans direction (RM-243), rendu selon Figma, sans nouvelle ligne de pause ni phrase longue injectée dans les cartes.

#### 20. Recette déterministe

**Complément cible 12/10 :** Tester A/B avec comptes différents ; conversion destructive/non destructive, annulation,4→3→4, enregistrement 3 puis augmentation ; sortie/ajout sans mutation du catalogue ; récupération/point chaque passage.

Tester annulation roulette/placement/Séance, sélection multiple/désélection/décompte, Rabsente/0/positive et point absent/présent, dans/hors placement. Tester frontières des deux types, dernière récupération, répétition par Tour, retrait par désélection en placement (la bulle de retrait est remplacée par D-441 et D-442), duplication/déplacement/suppression et sauvegarde atomique. Tester erreur/double tap ; D-214 révisée : vérifier l’absence du contrôle et des phases propres en SESSION ; V-04 clos. D-301 retirée par D-442 : vérifier qu’aucun avertissement d’enchaînement sans pause n’est affiché. Vérifier symbole ≈ avec bip/omission sans bip à l’Exercice et montants issus de la spécification, aucune formule de capture.

**Complément D-441 du 22/10 :** tester (1) déplacement d’un Exercice : sa récupération le suit, ses Points restent en place ; (2) dépose d’Exercice refusée si elle crée deux Points consécutifs ou un Point interdit, état initial restauré (remplacé par D-442 : voir le complément D-442, point 5) ; (3) déplacement d’un Point par appui long avant, dans et après le Circuit ; (4) dépose de Point interdite (après Compte à rebours, avant Fin, contre un autre Point) refusée sans modification ; la tête de Circuit n’est plus interdite (D-442) ; (5) Récupération entre deux Points non séparatrice ; (6) frontières « après le dernier Exercice du Circuit »/« après le Circuit » et Circuit vide « avant »/« après » ; (7) Monter / Descendre accessibles ; (8) Points existants sélectionnés en placement, désélection puis resélection ; (9) retrait seul, mélange et modification de durée seule : « Confirmer les modifications » ; ajouts seuls : « Confirmer N pauses ajoutées » ; (10) Annuler restaure tout, retraits compris ; (11) persistance seulement par Continuer ; (12) suppression d’Exercice refusée : Supprimer proposé, rien supprimé, carte refermée, raison annoncée (remplacé par D-442 : voir le complément D-442, point 5) ; (13) duplication `[A, P, B]` → `[A, A′, P, B]`, récupération copiée ; (14) passage partiel de Circuit à séries alternées : un seul arrêt, Séance enregistrée intacte ; (15) aucune bulle sur le Point (la bulle « Retirer la récupération » est elle-même retirée par D-442). [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.]

**Complément D-442 du 22/10 :** tester (1) aucun message lorsque deux Exercices s’enchaînent sans pause ; (2) puce Étiquette de la zone de contexte : icône d’étiquette, couleur de l’Étiquette quand elle est choisie, aucune pastille ronde ; (3) défilement automatique près du bord haut et du bord bas pendant le glisser d’une carte et d’un Point, arrêt hors du bord et à la dépose ; (4) hors placement, toucher et appui long sur la récupération sans effet ; en placement, récupération existante (0 comprise) sélectionnée avec sa durée, désélection = retrait programmé, zone non sélectionnée → roulette sur la durée existante sinon le défaut du Profil, modification de durée, Confirmer / Annuler, Pause terminale rétablie après retrait (RM-038), libellé « Confirmer les modifications » ; (5) déplacement d’Exercice laissant un Point juste après le Compte à rebours, juste avant la Fin ou contre un autre Point : déplacement appliqué, Point(s) en cause retiré(s) sans message, premier de la paire conservé ; suppression d’Exercice dans les mêmes cas : appliquée, Point(s) en cause retiré(s) sans message, carte disparaissant en fondu et éléments suivants glissant pour combler sa place (D-442, recette J6, qui remplace le refus doux de D-441) ; (6) Point en tête de Circuit proposé et accepté ; (7) à N ≥ 2, début et fin de Tour simultanés par placement, déplacement d’un Point, déplacement d’un Exercice et passage de N = 1 à N ≥ 2 : choix « Début de tour » / « Fin de tour » / Annuler ; (8) à N ≥ 2, Point de début ou de fin de Tour d’un Circuit qui ouvre ou clôt la Séance accepté, arrêt omis à l’exécution seulement après le Compte à rebours ou avant la Fin ; à N = 1, RM-219 appliquée et Point devenu interdit retiré sans message ; (9) Point saisi marqué soulevé ; (10) stepper du Circuit toujours actif, nombre en « Valeur modifiable », cibles −, + et pastille d’unité espacées et ≥ 44 pt, textes à la taille du titre « Circuit » ; (11) durée du Circuit arrondie à la minute la plus proche au-delà de 3 minutes (remplacé par D-443 : durée absente de l’en-tête).

**Complément D-443 et D-444 du 23/10 :** tester (1) mouvements doux, sans arrêt brutal : disparition plus lente d’une carte supprimée, apparition en fondu lent de la carte créée par Dupliquer et glissement des éléments suivants, ouverture, fermeture et retour des actions glissées ; (2) en-tête du 28/10 avec durée à droite, nombre à abscisse fixe et stepper révélé au toucher, remplaçant ce point de D-443 ; (3) cadres du Compte à rebours initial et de la Fin de séance alignés à droite sur le cadre des cartes, durée 0..60 s, pas 1 s, affichée en secondes seulement ; (4) durée de la Séance dans la zone de contexte arrondie aux 15 secondes les plus proches, préfixe « ≈ » ou « ≥ » ; (5) Continuer au format du bouton « Terminer », fixe, centré verticalement dans sa zone protégée, sous un dégradé blanc pleine largeur, dernier contenu atteignable et jamais masqué ; (6) barre de placement ✓ / Annuler dans la zone de sécurité inférieure d’iOS, à la même hauteur que les autres barres d’action, sans saut au changement de mode (D-444).

### Composer une séance / Modifier une séance — Objectif

Permettre à l’utilisateur de définir la structure et l’ordre d’Exécution d’une Séance.

L’écran de Composition ne lance pas directement l’Exécution.

### Composer une séance / Modifier une séance — En-tête

L’écran affiche notamment :

- le champ `Nom de la séance` ;
- l’accès à la modale `Étiquettes` ;
- l’Étiquette sélectionnée, lorsqu’elle existe, affichée sous le nom de la Séance ;
- la durée de ce Circuit, intégrée sous `Nombre de tours` dans le conteneur Circuit ; « N exercice(s) » n’est pas affiché à cet emplacement (D-390). Cette durée est une estimation : au-delà de 3 minutes, elle est arrondie à la minute la plus proche (D-442). Le complément du 28/10 remplace ce rendu D-443 : durée à droite de l’en-tête, compteur à abscisse fixe et stepper révélé au toucher.

Le champ `Nom de la séance` mesure `354 × 42`. Son fond reste transparent. Lorsqu’une Étiquette est sélectionnée, sa couleur devient la couleur affichée de la Séance ; il n’existe pas de palette de couleur indépendante de l’Étiquette dans le parcours courant.

L’ouverture de la modale Étiquettes conserve la Composition en arrière-plan et ne modifie aucune autre valeur tant qu’une sélection ou création n’est pas validée.

### Composer une séance / Modifier une séance — Ajout d’un Exercice

Un seul bouton secondaire `+ Ajouter un exercice` est affiché en haut de l’écran de Composition.

Aucun bouton `＋` intermédiaire n’est affiché dans le Circuit ou entre les Exercices.

Un appui sur `Ajouter un exercice` ouvre directement la sélection multiple des références persistantes du Catalogue. La validation est désactivée lorsque la sélection est vide et les Exercices validés sont insérés dans l’ordre courant de la liste filtrée, non dans l’ordre des touchers. Le mécanisme de création directe d’un Exercice local à la Séance est conservé dans le produit mais n’est pas proposé par l’enchaînement d’écrans courant.

Le premier Exercice créé est inséré immédiatement après le Compte à rebours initial et avant le Circuit. Les Exercices suivants sont insérés après le dernier Exercice ajouté, dans la même zone. L’utilisateur peut ensuite les déplacer manuellement avant le Circuit, dans le Circuit ou après le Circuit. La réorganisation est déclenchée par un appui long sur l’ensemble de la carte ; la poignée reste un indicateur visuel et ne constitue pas la seule zone de déclenchement.

La poignée de chaque carte d’Exercice est exclusivement une instance du composant DSF `Icon / Structure / Movable` (`3066:4676`) : dessin `20 × 20` centré dans un slot `28 × 28`, opacité `50 %`, couleur `color.iconNeutral`. Le dessin local historique `icon/réorganiser` en `16 × 16` et l’application du token `icon.compact` à cette poignée sont interdits.

Le MVP ne propose pas de menu d’ajout rapide `Pause 15 s / 30 s / 45 s`.

La récupération est une durée propre à l’Exercice, affichée sans duplication dans la Composition et réglée uniquement dans Paramètres d’exécution. À la création d’un nouvel Exercice, sa Récupération reprend « Récupération après un exercice » du Profil ; 30 s n’est pas une constante. Modifier un Exercice conserve sa valeur ; un ancien Exercice sans récupération affiche 0 s sans recevoir le défaut du Profil. Déplacement et duplication conservent la récupération de l’Exercice. À 0 s, aucune récupération n’est exécutée ; les règles existantes de Pause terminale, d’ordre avant Point d’arrêt et de répétition dans un Circuit restent applicables. Les anciens instantanés, exécutions et données historiques restent lisibles sans réécriture ; la règle historique « aucune récupération post-exercice en ACTIVITY » reste limitée à cet ancien parcours, sans réintroduire un Exercice autonome dans la cible.

**Avertissement d’enchaînement sans pause (D-301) — retiré par D-442 (22/10/2026).** La Composition n’affiche plus aucun message lorsque deux Exercices s’enchaînent sans pause ; aucun autre avertissement ne le remplace. Texte historique : lorsque deux Exercices consécutifs n’ont ni pause effective de transition ni Récupération positive après son occurrence, la Composition affiche l’avertissement non bloquant : « Attention, les exercices vont s’enchaîner sans pause. » Il concerne l’enchaînement entre Exercices ; aucun avertissement distinct entre Séries n’est ajouté. Il n’empêche ni l’enregistrement ni l’exécution et ne modifie aucun paramètre.

### Composer une séance / Modifier une séance — Résumé de la ligne d’un Exercice (D-095 révisée par D-238)

La ligne présente le nom, la Catégorie puis les Zones corporelles sur une ligne de classement, puis la synthèse :

- Séries identiques : `N × cible` avec unité ; le préfixe N × est conservé sous circuit à séries alternées ;
- Séries variables : cibles séparées par un point médian, unité à la fin ; au plus trois valeurs qui tiennent, puis ellipse ;
- À l’échec : libellé métier conservé sur la carte ; la grille Volumes utilise ✓ pour les cibles À l’échec. Le mode reste identifiable ; le rendu d’unité des lignes mixtes reste à aligner (matrice du 13/10).

Le nom n’est pas répété, le mode n’est pas nommé. Aucune Pause intrinsèque n’est affichée dans le corps de la carte ; la récupération contextuelle positive apparaît en troisième ligne de la carte v2 (D-435). Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement (D-303). Les valeurs et phases D-208 restent conservées, solidaires de l’occurrence lors des opérations et utilisées dans les calculs. Le réglage de récupération existant sur cette ligne est conservé (remplacé par D-442 : hors placement, la récupération affichée sur la carte n’est plus une cible ; son réglage et son retrait passent par le mode Placement).

La bilatéralité est indiquée par le miroir dans les variantes concernées ; le paramètre de changement de côté (Avec / Sans, D-406) et `Indicator / Sides` ne sont pas supprimés du modèle ; l’indicateur ne porte pas de direction (RM-243). Le texte développé du changement de côté (côté 1, puis côté 2) reste propre à l’éditeur. La Description est absente des cartes. Texte complet conservé derrière la troncature.

Les commandes contextuelles de Composition font 34 px, dessins 20, gaps 10, cibles 44 sans chevauchement. La bande Durée + actions reste à 32 px : durée immobile, actions à droite et 6 px plus bas. Depuis D-443, la durée totale de la Séance affichée dans la zone de contexte de la Composition est une estimation arrondie aux 15 secondes les plus proches, précédée de « ≈ » ou de « ≥ » selon les Exercices qui la composent, avec la même règle de choix du préfixe que l’estimation de durée existante. Les états initial, nom saisi, étiquette sélectionnée, modale ouverte, déplacement et actions glissées héritent de cette règle.

### Composer une séance / Modifier une séance — Consultation et modification d’un Exercice

Un appui court sur une carte Exercice ouvre directement son parcours de modification. [31/10/2026, recette iPhone n° 2 (Hermann, constat c) : remplacé — l’appui sur la carte ouvre la feuille des paramètres d’exécution (voile en fondu, feuille montant du bas ; carte : bouton, indication « Modifier les paramètres ») ; l’appui sur la photo (gabarit média) ouvre l’Exercice dans le gabarit Mouvement (CE-MVT-01) — bouton distinct « Ouvrir le mouvement » ; appui long et glissement gauche inchangés, photo comprise ; voir ch07 « Recette iPhone n° 2 du 31/10/2026 — lot 3 ».] [04/11/2026, recette iPhone du 04/11 (Hermann) : remplacé pour la photo — l’appui court sur la photo ouvre la fiche de l’Exercice en lecture seule, en feuille modale iOS (apparition et disparition par le bas, fermeture par la croix) : zone de contexte inchangée (nom, Catégorie, Zones corporelles, Niveau, renseignés ou non) ; photo, Description, Phases et synthèse des paramètres d’exécution, chaque section absente (titre et champ) sans valeur ; synthèse non touchable ; aucun bouton d’action ; voir ch07 « Recette iPhone du 04/11/2026 — décisions de Hermann ».] Un appui long sur la carte de l’occurrence Exercice déclenche sa réorganisation sans ouvrir la modification ; la carte et sa récupération contextuelle intégrée forment le bloc déplacé (D-435), sans rangée séparée. Un glissement gauche déplace le bloc avec le geste et révèle progressivement les actions `Dupliquer` et `Supprimer` placées derrière. `Dupliquer` crée un Exercice de Séance indépendant avec un nouvel identifiant, reprend tous les paramètres de la source, y compris Pause et Récupération, la nomme `{nom} (copie)` puis `{nom} (copie 2)`, etc., sans collision, et l’insère immédiatement après la source dans la même zone structurelle. Le Point d’arrêt qui suit la source n’est pas copié et garde sa place : `[A, P, B]` devient `[A, A′, P, B]` (D-441). Cette action ne crée aucun Exercice dans le catalogue. `Supprimer` retire le bloc du brouillon ; si la suppression laisse un Point à une position non autorisée ou deux Points d’arrêt consécutifs, elle est appliquée et le ou les Points en cause sont retirés sans message, le premier de deux Points devenus consécutifs étant conservé (D-442, qui remplace le refus doux de D-441 ; RM-251) ; la carte supprimée disparaît en fondu et les éléments suivants glissent pour combler sa place (D-442), plus lentement et sans arrêt brutal depuis D-443 ; la suppression n’est persistée qu’avec l’enregistrement final de la Séance et l’abandon restitue la version persistée.

Dans l’état Figma `Composition d’une séance — actions glissées` (`2028:11808`), la carte/bloc suit le geste. L’action `Dupliquer` reprend son rayon DSF et un espace visuel sépare son bord gauche de la portion encore visible de la carte, laissant apparaître le fond du conteneur Circuit. Aucun overlay immobile ne remplace ce mouvement réel. [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.]

### Composer une séance / Modifier une séance — Réorganisation

Les Exercices peuvent être réorganisés dans leur zone ou déplacés par glisser-déposer avant le Circuit, dans le Circuit ou après le Circuit. Le geste commence par un appui long sur le bloc complet ; la carte de l’occurrence passe dans l’état soulevé puis suit le glissement ; la récupération après exercice reste rattachée à l’occurrence pendant le déplacement ; sa valeur affichable suit la troisième ligne de carte jusqu’à la dépose valide. Le Point d’arrêt reste à sa position dans la séquence (D-441) ; une dépose d’Exercice qui le laisserait à une position non autorisée (juste après le Compte à rebours, juste avant la Fin, ou consécutif à un autre Point) est appliquée, et le ou les Points en cause sont retirés sans message, le premier de deux Points devenus consécutifs étant conservé (D-442, qui remplace sur ce point le refus de D-441). Un Point d’arrêt se réorganise lui-même par appui long, qui le marque visuellement par un état soulevé, puis glisser-déposer, vers une position autorisée avant, dans (tête de Circuit comprise, D-442) ou après le Circuit. Pendant le glisser d’une carte ou d’un Point, amener l’élément près du bord haut ou bas de la zone visible fait défiler la liste ; le défilement s’arrête quand l’élément quitte ce bord ou à la dépose (D-442). Un toucher court conserve son comportement d’ouverture de l’Exercice en modification. Le déplacement conserve l’identifiant et tous les paramètres, met à jour la position structurelle et renumérote continûment les positions de chaque zone. Il ne persiste rien avant l’enregistrement final.

L’état Figma `Composition d'une séance — Appui long — carte soulevée` (`3518:4576`) matérialise ce retour visuel. Avec Récupération, le bloc actif passe de `354 × 93` à `362 × 97`, reste centré dans la section (`x = 6`, contre `x = 10` au repos), utilise le fond bleu très clair `#F7F7FF`, un contenu atténué, un contour `1` point `#D1D1D6`, un rayon `12` et une ombre périphérique `#14171F` à `22 %`, décalage `0 / 0`, flou `10`, étalement `2`. L’ombre et le contour entourent l’Exercice et sa Récupération. Les autres cartes et éléments structurels restent inchangés.

La poignée `Icon / Structure / Movable` reste l’indice visuel du caractère déplaçable, mais le mouvement d’activation porte sur la carte. L’état soulevé est uniquement transitoire : il ne modifie ni l’ordre ni la position structurelle avant la dépose.

Le Circuit reste structurel. Le Compte à rebours initial et la Fin de séance sont explicitement non déplaçables, sans appui long ni poignée de déplacement.

### Composer une séance / Modifier une séance — Sélection des exercices — modale

Depuis `Ajouter un exercice`, la frame `3789:5349` ouvre directement la sélection des Exercices du Catalogue au-dessus de la Composition grisée. La liste seule défile. Les boutons fixes sont `Annuler` à gauche et `Sélectionner` à droite (D-228).

Les Exercices sont insérés selon leur ordre courant de présentation dans la liste filtrée au moment de la validation, indépendamment de l’ordre des touchers. L’état sélectionné de la sélection multiple utilise le composant DSF dédié ; aucun glyphe texte ne peut le remplacer.

Chaque carte de choix Composition mesure 354 × 91, rayon 8, titre 15, case arrondie 20 ; aucun badge durée ni Lecture/Déployer. Cadre des zones corporelles arrêté à 8 px de la case, troncature finale par points de suspension (D-263). Catégorie/Zones en classement, synthèse et miroir selon bilatéralité. Gouttière permanente 64 : photo associée centrée/recadrée, icône de nature sans média/pendant chargement/erreur, texte alternatif nom ; aucune hausse de hauteur. États sélectionné/non sélectionné/inactif suivent la palette #0508E5/#595E66 (iconNeutral/textSecondary ; ancien #5C636E historique)/#C2C4D1, sans remplacer le composant vectoriel par un glyphe. Les règles d’insertion et de validation à 0 restent inchangées. Contrat CE-T03-07.

### Composer une séance / Modifier une séance — Placement et retrait des pauses

Le placement est un état de la Composition, représenté par 7167:13503. Chaque position autorisée propose Récupération et Point d’arrêt côte à côte ; plusieurs ajouts peuvent être confirmés ensemble. Récupération ouvre immédiatement la modale de durée 7173:13521. Le bouton indique « Confirmer N pauses ajoutées » pour des ajouts seuls, « Confirmer les modifications » dès qu’il y a un retrait, un mélange ou une modification de durée d’une récupération existante (D-441) ; Annuler restitue le brouillon antérieur au placement. [30/10/2026, contre-recette PRE-9 n° 1 (Hermann) : « Appuyer de nouveau sur le bouton d'action point d'arrêt referme l'écran de sélection (même comportement sur confirmer) » — un second appui sur « Ajouter un arrêt » applique comme Confirmer ; sans changement, il referme seulement ; voir ch07 « Contre-recette PRE-9 n° 1 ».] Les frontières autorisées restent propres à chaque type ; deux Points d’arrêt ne se suivent jamais (RM-251). [31/10/2026, PRE-9 B.6 — placement sur tous les niveaux de la structure (Cycles compris), même barre, même dialogue de choix (Cycle répété : début ou fin de répétition), voir ch08.] [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.]

Le mode Placement ne porte que sur les Points d’arrêt. Les cartes restent grisées, les emplacements autorisés restent actionnables et défilants jusqu’à la dernière position. Un Point existant apparaît sélectionné ; sa désélection programme son retrait. Confirmer applique le sous-brouillon atomiquement, Annuler le restitue ; l’enregistrement final reste celui de la Séance. Les contraintes de position, de non-consécutivité et de déplacement des Points restent celles de RM-251. Aucune zone d’ajout ou de retrait de Récupération n’est proposée.

### Composer une séance / Modifier une séance — Confirmation — Abandonner la création d’une séance

#### Objectif

Éviter la perte accidentelle des informations saisies dans la nouvelle `Composer une séance`.

#### Ouverture

La modale s’affiche depuis `Composer une séance` lorsque l’utilisateur appuie sur Retour pendant une création en cours.

La Composition reste visible en arrière-plan, assombrie et non interactive.

#### Contenu

**Titre**

> Abandonner la création ?

**Message**

> Les informations saisies seront perdues et la séance ne sera pas créée.

**Actions**

- `Annuler`, action neutre grise
- `Confirmer`, action destructive rouge

#### Comportement

`Annuler` ferme le dialogue et conserve intégralement la création en cours.

`Confirmer` supprime la nouvelle Séance et tout son contenu déjà saisi, puis revient au `Catalogue des séances`.

Ce comportement concerne uniquement le parcours de création. Pour une Séance existante ouverte en modification, Retour ne supprime jamais la Séance.

### Champs et comportements des fonctionnalités — Composition d’une séance — création et modification

Le nom, l’Étiquette/couleur et la Composition sont réunis dans le même écran.

#### Éléments affichés

| Élément | Comportement et règle |
| --- | --- |
| Nom de la séance | Champ obligatoire de 1 à 80 caractères. Vide, il est signalé par un fond rouge pâle, sans message supplémentaire (D-389). |
| Étiquette | Facultative ; sa couleur devient la couleur affichée de la Séance. La sélection/création s’effectue dans la modale Étiquettes intégrée à la Composition. |
| Compte à rebours initial | Élément structurel ; roulette minutes/secondes intégrée (remplacé par D-443 du 23/10/2026 : durée bornée à 0..60 s, pas 1 s, affichée en secondes seulement, sans minutes ; cadre aligné à droite sur le cadre des cartes d’Exercice) ; valeur initiale 10 s. |
| Circuit | Conteneur facultatif, multiple ; nature séries groupées/alternées, compte 1..99 défaut 1. Nombre → stepper révélé ; adjectif → choix de nature ; unité non interactive ; chevron accolé au nom → repli [08/11/2026 au soir, Hermann : « Circuit : mets le chevron entre le cercle et le nom du circuit » — chevron placé avant le nom, entre l’anneau et le nom] ; durée à droite. Voir la référence Composition du 28/10. |
| Exercices | D-435 réintroduit uniquement la récupération contextuelle affichable sur la troisième ligne de la carte de Composition v2, sans afficher les Pauses propres aux Séries ; le trait de démarcation conserve les règles de D-303. La donnée `postActivityRecoverySeconds` appartient toujours à l’occurrence et accompagne déplacement, duplication et suppression. Le corps principal de la carte affiche le nom, la Catégorie et les Zones corporelles ; toucher ouvre la modification. |
| Fin de séance | Élément structurel ; roulette minutes/secondes intégrée (remplacé par D-443 du 23/10/2026 : durée bornée à 0..60 s, pas 1 s, affichée en secondes seulement, sans minutes ; cadre aligné à droite sur le cadre des cartes d’Exercice) ; valeur initiale 5 s. |
| Résumé | Durée de ce Circuit seule, placée dans l’en-tête du conteneur Circuit immédiatement sous `Nombre de tours` ; « N exercice(s) » n’est pas affiché à cet emplacement (D-390). La durée concerne exclusivement ce Circuit (D-382) et intègre les durées intrinsèques de ses Exercices ainsi que leurs récupérations après exercice. Le Compte à rebours initial et la Fin de séance en sont toujours exclus. À l'état vide, le nombre `0 exercice` de D-091 n’est pas affiché à cet emplacement ; seule la durée l’est, sous la forme « — min » (D-390, D-399). Cette durée est une estimation : au-delà de 3 minutes, elle est arrondie à la minute la plus proche (D-442). Le complément du 28/10 remplace ce rendu D-443 : durée à droite de l’en-tête, compteur à abscisse fixe et stepper révélé au toucher. |
| Créer | Le menu Créer propose trois options, dans cet ordre : **Créer un exercice**, **Créer un circuit**, **Créer un cycle**. Créer un exercice ouvre la modale commune « Créer un exercice » : Exercice libre, puis grille Formats d’entraînement. Les mouvements existants se sélectionnent dans la fiche de création ; aucun accès distinct « Utiliser des mouvements existants » ou « Utiliser un format d’entraînement » dans ce menu. Le bouton + devient Annuler, croix grise 34 px au même emplacement ; voile, axe jusqu’à Créer un cycle et fermeture sont conservés. Créer un circuit/un cycle conserve le choix d’emplacement existant.
| Continuer | Désactivé lorsque le nom est vide, qu’aucun Exercice valide n’est présent ou qu’un Exercice comporte une cible obligatoire non renseignée (D-380, D-123) ; valide et enregistre la Séance avec son Étiquette éventuelle. Bouton d’action principal standardisé, fixe en bas de l’écran dans sa zone protégée (D-444). |

Le cycle visible contient des circuits et des exercices directs et répète sa séquence de 1 à 99 fois, défaut 1 ; aucun cycle technique implicite (D-451, RM-252). La condition métier d’exécutabilité demeure la présence d’au moins un Exercice valide.

Le Compte à rebours initial et la Fin de séance conservent chacun leur propre valeur confirmée et leur propre brouillon. L’ouverture copie la dernière valeur confirmée dans le brouillon ; le défilement ne modifie ni le jalon concerné ni la synthèse intégrée au Circuit. Annuler abandonne le brouillon. Confirmer enregistre exactement les minutes et secondes centrées, puis actualise seulement le jalon structurel concerné. La synthèse sous `Nombre de tours` reste inchangée, car elle exclut ces deux éléments structurels hors Circuit. Les secondes couvrent `00` à `59` avec un pas de `1` (remplacé par D-443 du 23/10/2026 : durée bornée à 0..60 s, pas 1 s, affichée en secondes seulement, sans minutes).

Dans la variante d’actions glissées (`2028:11808`), la liste conserve l’origine verticale canonique `y = 92` sous l’en-tête fixe. La carte ou le bloc suit le glissement et révèle progressivement `Dupliquer` et `Supprimer` placés derrière. Selon D-435, la récupération n’occupe plus de ligne structurelle autonome : sa valeur positive figure dans la troisième ligne de la carte ; absente ou à `0 s`, aucune valeur de récupération n’est affichée. Le point d’arrêt reste indépendant, le trait de démarcation suit D-303 et les actions glissées accompagnent toute la carte v2, selon Figma `8328:28863`. Les anciennes géométries avec bloc Exercice–ligne de récupération sont historiques et supersédées sur ce rendu. `Dupliquer` conserve les rayons définis par Figma/DSF et un espace visuel à son bord gauche laisse apparaître le fond du conteneur Circuit conformément à D-176.

Dans la variante d’appui long courante (`8328:33546`), la carte v2 et sa récupération contextuelle intégrée sont déplacées comme une seule occurrence. Les anciennes dimensions de bloc Exercice–Récupération sont supersédées par D-435 ; les données de récupération restent celles de D-208. L’état soulevé reste transitoire : il ne modifie ni `postActivityRecoverySeconds` ni les autres données avant la dépose.

Retour pendant une nouvelle création ouvre le dialogue centré `Abandonner la création ?`. `Annuler` conserve les données ; `Confirmer`, action destructive rouge, les supprime. Pour une Séance existante, Retour ne supprime jamais la Séance.

### Champs et comportements des fonctionnalités — Composition — comportement cible

En-tête du 28/10 : nom et chevron en colonne fixe, compteur à abscisse fixe et durée à droite ; nombre 15 pt, unité 13 pt, durée 12 pt. [Remplacé le 03/11/2026 (contre-recette n° 3 bis, f3s-nom, Hermann) : « Un titre long ne doit pas décaler le compteur, par contre on peut décider maintenant de décaler le compteur au maximum vers la droite, en considérant la place minimum nécessaire pour l'affichage de la durée. Le compteur doit rester aligné pour le circuit et pour le cycle, sa position identique pour toutes les séances. Et s'il n'y a pas suffisamment de place on tronque le nom du circuit. » — colonnes depuis le bord droit : durée (place de la plus longue durée), compteur (place du plus long compteur), nom dans la place restante, tronqué — registre ch07, « Contre-recette n° 3 bis — 03/11/2026 ».] [Remplacé le 03/11/2026 (contre-recette n° 3 bis, f3s-nom, Hermann) : « Retirer le suffixe en lettre des circuits, il n'est plus nécessaire car on a déjà la deuxième ligne qui liste son contenu. » — l'en-tête d'un Circuit n'affiche plus de lettre ; le Cycle garde la sienne ; les désignations du mode enveloppe (« le circuit A ») sont inchangées — registre ch07, « Contre-recette n° 3 bis — 03/11/2026 ».] Nombre → stepper ; adjectif → choix de nature ; unité non interactive. Circuit replié : deuxième ligne existante listant les noms des Exercices, complétée du **nom du Format de chaque Exercice lorsqu'il en porte un**, avec troncature selon la place disponible ; aucun nom de Format commun n'est déduit ou persisté sur le Circuit. Circuit déplié : les cartes individuelles des Exercices demeurent visibles ; les règles Figma d'affichage des informations de Format sont à respecter sans inventer de nouvelle interaction. Cycle non repliable. Référence visuelle vérifiée : Prototype MVP `10717:20056` (deux Circuits repliés), `10725:20142` (un déplié, un replié), `10744:20108` (dans un Cycle). Les calculs restent ceux du chapitre 10 ; aucun chiffre de maquette ne les définit. [29/10/2026, recette PRE-9 n° 1 (Hermann) : nombre et unité contigus et en gras, cible unique du stepper ; durée du Circuit et du Cycle en noir et en gras ; adjectif groupées / alternées en gras ; ouverture et fermeture du Circuit animées, fermeture plus lente ; menu Créer : axe bleu, options inactives grises opaques, « Annuler » en bleu, apparition progressive lente — voir ch07 « Recette PRE-9 n° 1 — décisions de Hermann du 29/10/2026 ».] [01/11/2026, Hermann : « c’est la croix qui est correcte » — « Annuler » en bleu remplacé par la croix Annuler standard sur fond gris de 34 px du Menu Créer (voir « Menu Créer »).]

Carte : régime identiques → forme N×valeur ; variables → valeurs séparées par points médians avec unité finale, au plus trois selon place puis ellipse, même si valeurs égales. Douze séries : aperçu tronqué ; durées composées longues : moins de valeurs. Aucun marqueur d’incomplétude sur la carte ; validation des cibles dans la feuille conservée. La grille est détaillée dans les nouveaux contrats du chapitre 13.

## Circuits

### CE-CIR-01 — Choix de nature du circuit

**Règle active du 02/11 :** Circuits porteurs à nature fixée, autres Circuits standards ; compatibilité et entrée/sortie selon la référence Formats ; aucun refus général de portage Circuit.

#### 1. Identification

Popover de CE-T03-08, déclenché uniquement par la pastille tours/séries. Référence Prototype MVP `8328:34662`, capture au chapitre 06 ; DSF Circuits du 12/10.

Règles applicables : RM-025, RM-FMT-03, RM-FMT-09, RM-FMT-31 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Choisir comment le circuit développe les séries, sans changer le nombre affiché.

#### 3. Contexte d’entrée

Brouillon de composition, circuit visé identifié ; appui sur l’adjectif groupées/alternées, pas sur l’unité ni sur le chiffre.

#### 4. Contexte de sortie / destinations

Retour composition après choix sans perte ; CE-CIR-02 si perte ; abandon conserve état courant.

#### 5. Données affichées et source de vérité

Nature actuelle, compte N, nombres et paramètres des exercices dans le brouillon.

#### 6. Classification des valeurs Figma

Libellés Séries groupées / Séries alternées statiques ; nombre et sélection dynamiques ; aucune règle tirée d’un exemple.

#### 7. Structure de l’écran

Popover ancré au déclencheur, deux options.

#### 8. Éléments obligatoires

Deux options et état courant identifiable ; aucune troisième nature.

#### 9. Layout déterministe

Adjectif de nature distinct du nombre et de l’unité. Sélecteur avec libellés complets et sous-titres ; hauteur rapportée 143 pt dans la source du 28/10, contre 117 auparavant. Le stepper est révélé au toucher du nombre ; il ne fait pas partie du sélecteur de nature.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Conserver options accessibles avec texte agrandi, safe areas et petit écran ; aucun clavier.

#### 11. États de l’écran

Tours actif ; séries actif ; choix inchangé ; choix avec extension ; choix avec troncature.

#### 12. Contrôles et interactions

Séries→tours conserve compte et valeurs. Tours→séries adapte à N ; prédicat de perte avant mutation.

#### 13. Gestes

Toucher une option ; fermeture sans choix selon convention existante, aucune mutation.

#### 14. Validation

Nature dans les deux valeurs ; N valide ; confirmation requise uniquement si perte.

#### 15. Brouillon et persistance

Appliquer au brouillon atomiquement ; aucune persistance avant enregistrement de séance.

#### 16. Navigation et conservation d’état

Retour au même circuit et scroll ; restitution du focus au déclencheur.

#### 17. Erreurs et cas limites

Choix identique sans modification ; double action sans double conversion ; erreur conserve état initial.

#### 18. Accessibilité

Annoncer choix, état sélectionné et fonction ; pastille et chiffre ont des noms accessibles distincts.

#### 19. Invariants

Régime de chaque exercice conservé ; nombre affiché inchangé lors du choix ; catalogue intact.

#### 20. Recette déterministe

Tours→séries avec exercices<N,=N,>N ; séries→tours ; Annuler après perte ; absence de confirmation sans perte.

### CE-CIR-02 — Confirmation d’adaptation avec perte

**Complément Formats actif :** Tabata et 30/30 standards modifiables ; contraintes effectives des Formats spécialisés selon CE-FMT-04 et la référence du 02/11.

#### 1. Identification

Dialogue décision existant appelé par conversion ou ajout catalogue dans un circuit à séries alternées ; frame à rattacher ensuite.

Règles applicables : RM-113, RM-FMT-03, RM-FMT-31 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Confirmer une suppression de séries liée à une adaptation structurelle.

#### 3. Contexte d’entrée

Au moins un exercice concerné a plus de N séries. Pas de dialogue pour diminution simple du compteur.

#### 4. Contexte de sortie / destinations

Annuler retourne à l’état d’origine ; Confirmer applique l’opération et revient en composition.

#### 5. Données affichées et source de vérité

Opération demandée et séries au-delà de N depuis le brouillon, sans appliquer la perte avant confirmation.

#### 6. Classification des valeurs Figma

Actions Annuler/Confirmer fixes ; exercices/comptes affectés dynamiques.

#### 7. Structure de l’écran

Dialogue au-dessus de composition avec texte expliquant la perte et les deux actions.

#### 8. Éléments obligatoires

Annuler et Confirmer ; indication explicite de suppression définitive des séries excédentaires.

#### 9. Layout déterministe

Réutiliser le dialogue générique : frame `8328:34813`, instance `8328:34964`, 354 × 215 à x24/y635 sur la référence 402 × 874. Annuler à gauche, Confirmer à droite. Titre « Passer en circuit à séries alternées ? » ; message décrit N et les séries/valeurs supprimées. N=3 est un exemple dynamique. Fond et popover inertes. Hauteur adaptée au texte, sans figer les coordonnées sur tous les appareils.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Texte intégral et actions accessibles avec agrandissement ; aucune saisie clavier.

#### 11. États de l’écran

Conversion en attente ; ajout en attente ; confirmé ; annulé ; échec atomique.

#### 12. Contrôles et interactions

Annuler conversion conserve nature/compte/valeurs. Annuler ajout abandonne ajout. Confirmer applique toutes les modifications ensemble.

#### 13. Gestes

Pas de confirmation par simple appui sur le voile ; fermeture sans confirmation ne valide jamais la perte.

#### 14. Validation

Pertes recalculées sur état effectif avant application ; pas de confirmation sur état obsolète.

#### 15. Brouillon et persistance

Après confirmation, lignes tronquées non mémorisées pour retour de nature ; transaction de séance toujours annulable dans son ensemble.

#### 16. Navigation et conservation d’état

Conserver position et contexte ; ne pas créer un exercice catalogue lors de l’adaptation.

#### 17. Erreurs et cas limites

Erreur/double appui : pas de mutation partielle ni doublon ; si état changé, recalculer avant toute suppression.

#### 18. Accessibilité

Annonce du dialogue, de la conséquence et des actions ; focus contenu puis rendu à l’origine.

#### 19. Invariants

Confirmation si et seulement si perte lors des opérations visées ; diminution simple exclue.

#### 20. Recette déterministe

Confirmer/Annuler conversions et ajouts ; comparaison complète avant/après ; test catalogue inchangé.

### CE-CIR-03 — Volumes du circuit — retiré le 5 novembre 2026

Contrat retiré : aucun bouton œil ni fenêtre de volumes depuis la Composition. Les anciens nodes `8328:34965` et `8328:35135` ne sont plus des écrans cibles. Les paramètres d’Exercice et les tableaux de modèle conservent l’accès au détail. Cette ancre subsiste pour la traçabilité des références datées.

## Formats de séances

**Cible Formats active — 02/11/2026 :** [Formats d’entraînement — référence active du 2 novembre](../KODJO-Formats-entrainement-2026-11-02.md). Quatre Formats spécialisés (AMRAP, EMOM, For time, Death by) ; Tabata et cinq départs rapides standards modifiables (30/30, Renforcement, Superset, Progression, À l’échec). L’Exercice autonome ou le Circuit porte le Format selon le temps commun et la fin coordonnée ; le Circuit expose Format d’origine non modifiable et sa nature fixée, ses réglages applicables restant modifiables. Death by alterné : Format au Circuit, intervalle propre à chaque membre, aucune durée d’en-tête. Le portage exclusivement Exercice, les verrous Tabata/30/30 et le départ Libre dans la grille ne sont plus des règles actives.

### CE-FMT-01 — Choix du modèle et du format
<a id="ce-fmt-01"></a>

#### 1. Identification

Fenêtre P-Formats — Choix du format, deux colonnes (`9977:19613`), page Prototype MVP ; captures chapitre 06, ancre formats-galerie.

[04/11/2026 (essai adopté), Hermann : « Pourquoi la modale des formats ne bénéficie-t-elle pas de cet effet "lumière" qui est appliqué à la modale de présentation de la fiche des mouvements ? » ; « On garde cette modale native pour les questionnaires, les récapitulatifs, les fiches de mouvement. Applique-la aussi à la modale du format d'entraînement » ; « et l'utiliser aussi pour la modale du catalogue des mouvements lorsqu'on l'appelle à partir du bouton Créer » ; « On adopte le native d'iOS ». La fenêtre « Formats d'entraînement », le questionnaire, le récapitulatif et le Catalogue des mouvements ouvert par Créer sont des **feuilles natives iOS** (effet Liquid Glass du système) : la fenêtre Formats monte du bas, pleine largeur, ajustée à ses cartes ; un modèle ouvre son questionnaire **empilé** sur elle ; la croix du questionnaire et « Enregistrer dans la séance » reviennent à la Composition ; le voile est celui d'iOS ; fond blanc sur toute la hauteur de la feuille. Remplace la fenêtre centrée sur un fond voilé, la fermeture par tap sur le voile (non garantie par la feuille native, à constater en recette) et la règle « le voile déjà en place reste et accueille la modale » ; registre ch07, « Recette iPhone du 04/11/2026 ».]

#### 2. Finalité fonctionnelle

Choisir un modèle d’entraînement depuis Composition sans confondre identité spécialisée et préconfiguration standard.

#### 3. Contexte d’entrée

Composition → menu Créer → Utiliser un format d’entraînement.

#### 4. Contexte de sortie / destinations

Choix → questionnaire en modale sur la Composition, sans nom de Séance ; croix de fenêtre ou toucher le voile → Composition.

#### 5. Données affichées et source de vérité

Quatre Formats spécialisés et six préconfigurations standards (Tabata plus cinq départs) dans une grille commune ; origine et porteur ne sont pas déduits du titre.

#### 6. Classification des valeurs Figma

Les cartes et couleurs illustrent les modèles ; aucun visuel de Séance persisté ni contrainte supplémentaire déduit.

#### 7. Structure de l’écran

Fenêtre avec marges latérales sur le voile de Composition, titre Formats d’entraînement et croix interne ; pas de barre de navigation.

#### 8. Éléments obligatoires

Tabata, 30/30, EMOM, AMRAP, For time, Death by, Renforcement, Superset, Progression, À l’échec ; aucune carte Un exercice, Une séance, Libre ou Gainage · Mobilité.

#### 9. Layout déterministe

Grille deux colonnes sans défilement à la référence Figma ; réutiliser le composant de fenêtre existant.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Respecter largeur utile, texte agrandi et Safe Areas ; ne pas rendre une entrée inaccessible.

#### 11. États de l’écran

Ouverte, fermeture, modèle choisi ; aucun état de sélection durable supplémentaire.

#### 12. Contrôles et interactions

Toucher carte ouvre son questionnaire ; la fenêtre s’efface au profit du parcours choisi.

#### 13. Gestes

Toucher carte, croix ou voile ; aucune action de glisser nécessaire.

#### 14. Validation

Modèle reconnu ; aucune création silencieuse de mouvement ou d’exercice libre placeholder (B10 différé).

#### 15. Brouillon et persistance

Le choix initialise le parcours local ; l’ajout et la sauvegarde finale suivent CE-FMT-02/03.

#### 16. Navigation et conservation d’état

Questionnaires : croix vers Composition ; récapitulatifs : Retour vers questionnaire, réponses conservées.

#### 17. Erreurs et cas limites

Une erreur ne crée pas de structure partielle persistée ; anciens contenus libres restent libres.

#### 18. Accessibilité

Libellés accessibles des modèles et fermeture ; ordre de lecture de la grille conservé.

#### 19. Invariants

FMT-01/02/03/28/40 ; MENU-FMT-01 et ARB-05 remplacés sur cette grille.

#### 20. Recette déterministe

Chaque entrée mène au bon questionnaire ; croix/voile restaurent Composition sans ajout ; aucune carte retirée réintroduite.

### CE-FMT-02 — Questionnaires, récapitulatifs et tableau Progression
<a id="ce-fmt-02--paramètres-globaux-et-récapitulatif"></a>
<a id="ce-fmt-02--paramètres-globaux-et-récapitulatif"></a>
<a id="ce-fmt-02"></a>

#### 1. Identification

Famille des questionnaires et récapitulatifs du chapitre 06 ; Progression `8656:35005`, `8656:35062` ; AMRAP plusieurs blocs `11410:20361` ; Death by À la suite `11411:20474`.

#### 2. Finalité fonctionnelle

Configurer le modèle et les Mouvements choisis, vérifier le déroulé puis ajouter la structure au brouillon.

#### 3. Contexte d’entrée

Modèle choisi ou Retour depuis son récapitulatif.

#### 4. Contexte de sortie / destinations

**D-499 — précision validée par Hermann le 06/11/2026 :** « Valider les paramètres » apparaît uniquement lorsqu’une seconde étape est nécessaire et ouvre le récapitulatif sans enregistrer dans la séance. Dans ce cas, la coche du questionnaire reste grise et inactive. Sans seconde étape, la coche enregistre dans la séance lorsque les données sont complètes et cohérentes. Dans le récapitulatif, elle devient bleue et active lorsque les données sont complètes et cohérentes, puis enregistre dans la séance. Death by à un mouvement : questionnaire → coche → Composition, sans récapitulatif ; à deux mouvements : questionnaire → « Valider les paramètres » → récapitulatif → coche → Composition. L’enregistrement reste un ajout au brouillon de Composition, sans sauvegarde définitive de la Séance. Cette précision supersède la suppression générale du bouton dans les questionnaires ; les autres validations par coche restent applicables.

Questionnaire croix → Composition ; Valider les paramètres → récapitulatif modal sans ajout ; récapitulatif Retour → questionnaire avec réponses conservées ; Enregistrer dans la séance → Composition enrichie. Mode catalogue intégré : Ajouter → sélection appliquée ; Fermer le mode catalogue → saisie sans ajout. Photo → Fiche du mouvement superposée, croix → même état du parcours. [06/11/2026 : enregistrement porté par la coche ; bouton « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire, coche du questionnaire alors grise — D-499 précisée le 06/11/2026.]

#### 5. Données affichées et source de vérité

Paramètres effectifs, Mouvements choisis, cibles et charges par série, organisation, durée dérivée et déroulé ; source fonctionnelle : référence Formats du 02/11.

#### 6. Classification des valeurs Figma

Valeurs initiales modifiables distinctes des valeurs imposées et des exemples ; chiffres et charges de démonstration ne deviennent pas des constantes.

#### 7. Structure de l’écran

Modale sur Composition voilée ; en-tête nom du Format, sans bloc ni champ Titre de séance. Contexte et Mouvements, Paramètres d’exécution, déroulé et bouton ; Progression insère le tableau Mouvement immédiatement sous Nombre de séries, avant Pause/Durée totale/Exécution.

#### 8. Éléments obligatoires

Questionnaire Progression : Nombre de séries, Pause, Durée totale ; aucune cible globale sans Mouvement. Récapitulatif : une ligne par mouvement et une colonne par série ; répétitions, charge en dessous si Avec pour cet Exercice ; interrupteur Avec charge au questionnaire, Sans par défaut.

EMOM : tableau Unité | S1…Sn, cible et charge effectives de chaque série, aucune colonne ni formule d’incrément. Avec charge rend les commandes locales (+ kg)/(− kg) disponibles. Pour chaque fenêtre, travail connu des membres en Durée, deux côtés et pause applicable compris ; somme des membres dans l’intervalle commun ou intervalle local du membre. Atteinte ou dépassement bloque la validation ; Répétitions sans durée estimée inventée. Modale et récapitulatif partagent ces données. Death by multi-mouvements : Mouvement | Départ | Incrément juste sous Intervalle, en remplacement des deux lignes communes, valeurs locales et incrément ≥ +1 ; un seul mouvement conserve ses lignes. Aucune ligne Repos · jusqu’à la cadence. Petite carte : zones corporelles avec pastille 12 px gris à la place de la description, toutes variantes.

#### 9. Layout déterministe

Référence 402 × 874 : modale à y=95, pleine largeur, coins hauts 24 px, coins bas carrés, sans poignée. En-tête « DSF / Overlays / En-tête de modale », en-tête avec coche de validation (D-499 précisée le 06/11/2026) ; titre Inter Semi Bold 18 centré, croix au questionnaire et icon/retour au récapitulatif. Coche grise au questionnaire si une seconde étape est nécessaire, sinon active quand les données sont complètes et cohérentes ; au récapitulatif, coche bleue à complétude. Fond transparent et trait masqué uniquement dans ces modales Formats ; la Fiche du mouvement conserve fond blanc et trait. Zone de contexte 109 px depuis le haut de la modale, couleur et motif du Format ; tagline centrée 14/20 sur deux lignes. Lorsqu’une seconde étape est nécessaire, bouton « Valider les paramètres » à y=802 de l’écran de référence et déroulé 25 px au-dessus. Sans ce bouton et au récapitulatif, l’espace libéré revient au contenu. Contenu défilant, bouton de transition conditionnel en bas, clavier au premier plan ; ces cotes décrivent le rendu de référence, pas une hauteur fixe imposée à tous les appareils. Valeurs non modifiables et colonnes numériques alignées sur le texte des valeurs modifiables, avec un retrait de 10 px par rapport au bord droit de leur pastille.

Si le bouton de transition est présent, déroulé à 25 px au-dessus ; tableau blanc rayon 8 dans cadre gris, en-tête gris, traits fins et séparateur sous Nombre de séries. Progression 874 px ; en-tête 28 px, ligne avec charge 44 px, 12 px avant Déroulé dans l’exemple.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Clavier numérique répétitions, décimal charge (D-405) ; case et tableau restent visibles au-dessus ; réutiliser focus et adaptation de scroll existants. Le clavier reste au-dessus des modales ; contenu défilant, bouton « Valider les paramètres » ancré en bas uniquement lorsque la seconde étape est nécessaire ; enregistrement par la coche. Mode catalogue : résultats sur toute la hauteur disponible, sans compteur global. [05/11/2026, Hermann : « Un point à corriger pour tous les écrans questionnaires, récapitulatif : on utilise systématiquement le clavier pour renseigner les valeurs, plus aucun stepper et de roulette. L'appui sur suivant permet de passer d'une valeur à l'autre, aussi entre deux lignes ou d'une ligne à un tableau. » — chaque valeur des lignes de paramètres se tape dans sa pastille (pavé numérique ; durée « MM:SS » remplie par la droite, comme dans les tableaux) ; la barre du clavier (Précédent, Suivant, Fermer) enchaîne les lignes dans l'ordre affiché puis les cases du tableau ; bornes appliquées à la saisie ; une case vidée garde sa valeur, sauf le Temps limite qui repasse à « Sans limite » ; une valeur « variable » demande la confirmation existante à l'entrée dans la case. Les lignes de paramètres n'ont plus de stepper ; registre ch07, « Recette iPhone du 05/11/2026 — décisions de Hermann ».]

#### 11. États de l’écran

Questionnaire initial, mouvements ajoutés, récapitulatif, valeur à compléter, clavier sur cellule, erreur de validation ; charge active propre à chaque mouvement.

#### 12. Contrôles et interactions

Tap cellule ouvre la saisie directe ; Suivant passe répétitions S1, charge S1 si active, répétitions S2… ; modale du mouvement accessible pour autres paramètres. N augmenté : colonne nouvelle à compléter ; diminué : dernière colonne retirée, sans confirmation de perte.

« Ouvrir le mode catalogue » reste dans la même modale de questionnaire : aucune navigation sortante ni modale de catalogue supplémentaire. La recherche reste visible avec le texte saisi et les résultats déjà filtrés ; croix d’effacement dès que le champ contient du texte. Filtrer, Trier et Replier / déplier les piles sont à droite sur la même ligne. Les petites cartes occupent la hauteur disponible jusqu’au bas de la modale, avec le filet des niveaux d’une famille, sans compteur « n familles · n mouvements ». « Ajouter » applique la sélection et referme ce mode ; « Fermer le mode catalogue » revient à la saisie sans ajouter de mouvement. La boucle permet la sélection multiple ; le buy-in, sous « Mouvement du buy-in », une sélection unique. [remplacé le 08/11/2026 : sélection multiple aussi pour le buy-in et le buy-out (For time), « + Ajouter » ajoute sans remplacer — demande de Hermann du 08/11/2026, registre ch07, « Recette du 08/11/2026 au soir — buy-in / buy-out multiples ».] [06/11/2026 : lien retiré ; « + Ajouter » ouvre directement le mode catalogue — D-500.]

Dans le questionnaire et le récapitulatif, toucher la **photo** d’une petite carte ouvre la **Fiche du mouvement** en consultation seule, en modale par-dessus celle du Format, sur un second voile. Apparition par le bas, pleine largeur, coins hauts arrondis 24 px ; en-tête croix et titre « Fiche du mouvement », fond blanc et trait conservés. Nom, catégorie, zones corporelles, niveau, média, description et phases habituels ; aucun bouton d’action. Fermer restitue exactement l’état du parcours sous-jacent. Toucher le reste de la carte conserve son comportement existant.

#### 13. Gestes

Tap, clavier et Suivant ; réordonnancement/suppression selon règles existantes ; dernier membre de boucle protégé.

#### 14. Validation

**Validation du récapitulatif :** « Enregistrer dans la séance » n’est actif que si tous les paramètres requis sont renseignés et la configuration cohérente. Une cible à renseigner est signalée dans son cadre et bloque l’ajout ; un récapitulatif incomplet ne crée pas un Exercice « Paramètres à compléter » dans la Composition. Cet état reste possible après une modification ultérieure de Composition, notamment une entrée/sortie de Circuit ou de Format. Chaque case de tableau et la modale correspondante lisent et écrivent les mêmes champs standards de l’Exercice ; aucun second stockage. [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]

**Contrôle EMOM des durées — seuil inclusif :** le travail prévu d’un Exercice en Durée est sa cible, multipliée par deux s’il est fait de chaque côté, plus la pause entre les côtés applicable. En simple, alternance et À la suite, travail prévu ≥ intervalle propre bloque la validation ; Dans chaque intervalle, somme du travail prévu des membres ≥ intervalle commun bloque la validation. Les membres en Répétitions contribuent pour 0 à ce contrôle de durée connue, sans garantie que le travail total tiendra dans la fenêtre. Message sous le tableau, cadres des valeurs concernées et de l’intervalle rouges ; validation bloquée dans le récapitulatif, la modale et lors de l’édition de l’intervalle du Circuit. À 60 s : 40 s d’un seul côté admis, 40 s de chaque côté refusés ; 30 s + 30 s refusés ; 10 répétitions + 30 s ne déclenche pas ce seul contrôle.

Champs manquants distincts du zéro, volumes valides ; deux mouvements sélectionnés pour Superset ; pas de valeur inventée pour compléter Progression ou For time.

#### 15. Brouillon et persistance

Les réponses et cellules restent dans le brouillon du parcours. Enregistrer ajoute la structure au brouillon Composition ; sauvegarde de Séance ultérieure explicite, historique inchangé.

#### 16. Navigation et conservation d’état

Retour conserve toutes les réponses du modèle. Mode catalogue et consultation du Mouvement restituent recherche, sélection et réponses ; aucun second brouillon de Séance créé. Une fermeture de questionnaire ne sauvegarde pas définitivement la Séance.

#### 17. Erreurs et cas limites

AMRAP simple avec repos de boucle positif crée un Circuit un membre. For time variable s’adapte à N sans conversion ni dialogue de perte. B10 sans Mouvement reste différé.

#### 18. Accessibilité

Libellé de cellule associant mouvement, série, répétitions ou charge ; ordre Suivant identique à la saisie ; contrôles standards réutilisés.

#### 19. Invariants

FMT-08/14/15/19/20/26/28/29/30/31 ; cadence AMRAP/For time sans effet temporel ; données de tableau identiques aux séries de l’Exercice.

EMOM Répétitions par défaut, Durée possible par Exercice ; tableau et modale partagent Mode et cible. Changement de mode : objectif à renseigner sans conversion ; autres paramètres compatibles conservés. Max AMRAP renseigne À l’échec et grise/désactive Objectif et Par tour, Charge reste modifiable. Progression initialise ses trois séries à 10, 12, 14 ; les séries supplémentaires sont à renseigner. Tableaux EMOM/Death by/AMRAP/Progression : mêmes champs standards que la modale, aucun second stockage ni champ supplémentaire.

#### 20. Recette déterministe

Questionnaire→Valider les paramètres→récapitulatif→Retour conserve réponses sans ajout ; Enregistrer ajoute une seule fois au brouillon. Recherche Squ→Ouvrir le mode catalogue conserve Squ et filtre ; Fermer sans ajout ; Ajouter multiple, sélection unique par ajout de buy-in, plusieurs buy-in possibles [remplacé le 08/11/2026 : sélection multiple aussi pour le buy-in et le buy-out — registre ch07, « Recette du 08/11/2026 au soir — buy-in / buy-out multiples »] ; croix efface. Photo→Fiche consultation→croix conserve état. EMOM A10 Rép. / B30 s Durée et Death by A1/+1, B2/+2 sont distincts après enregistrement/réouverture. Passer Rép.→Durée→Rép. laisse à chaque fois une cible à renseigner, bouton désactivé jusqu’à complétude. W60 : 59 s admis, 60/70 refusés ; commun 20+30 admis, 30+30 refusé ; Rép.10 + Durée30 admis par ce contrôle. Message sous tableau, objectifs et intervalle rouges ; contrôle aussi depuis modale et en-tête après ajout. Les états incomplets post-modification de Composition restent distincts du formulaire de création. Aucun nom de Séance dans les formulaires. Vérifier l’alignement du texte, le bouton de transition visible uniquement si une seconde étape est nécessaire et la coche grise du questionnaire dans ce cas. Tester Death by à un mouvement sans récapitulatif et à deux mouvements avec récapitulatif ; coche grise si données incomplètes, bleue et active à complétude dans l’étape d’enregistrement ; aucun ajout avant la coche, aucun double ajout.  Progression 3→4 ajoute une colonne vide, 3→2 retire la dernière ; saisie mixte avec/sans charge ; 40 min pour 3×12 + 2×2 ; Tabata À la suite 530 s. [06/11/2026 : lien retiré ; « + Ajouter » ouvre directement le mode catalogue — D-500.]

### CE-FMT-03 — Composition d’une séance issue d’un modèle
<a id="ce-fmt-03--composition-dune-séance-issue-dun-format"></a>
<a id="ce-fmt-03--composition-d’une-séance-issue-d’un-format"></a>
<a id="ce-fmt-03--composition-dune-séance-issue-dun-format"></a>
<a id="ce-fmt-03--composition-d’une-séance-issue-d’un-format"></a>
<a id="ce-fmt-03"></a>

#### 1. Identification

Composition multi-conteneurs ; AMRAP `11270:19541`, sortie `11410:20123`, Death by alterné `11411:20181` ; référence D-451.

#### 2. Finalité fonctionnelle

Organiser et sauvegarder les structures créées par questionnaire en respectant le porteur du Format.

#### 3. Contexte d’entrée

Enregistrer dans la séance depuis questionnaire/récapitulatif ou réouverture d’une Séance. [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]

#### 4. Contexte de sortie / destinations

Composition conserve son parcours de sauvegarde ; modale du membre au toucher ; sortie de Circuit selon dialogue Conserver/Libre/Annuler.

#### 5. Données affichées et source de vérité

Structure complète et bon porteur ; origine de Séance distincte, titre suggéré immédiatement modifiable, titre personnalisé jamais écrasé.

#### 6. Classification des valeurs Figma

Exemples de durées et noms de mouvements ne sont pas des fixtures applicatives ; Format d’origine du Circuit est une identité métier explicite.

#### 7. Structure de l’écran

Mêmes Cycles/Circuits/cartes de Composition ; aucun nouveau type de conteneur.

#### 8. Éléments obligatoires

Circuit porteur à nature fixée et réglages applicables modifiables ; AMRAP affiche bloc(s) ; Death by alterné aucune durée d’en-tête, intervalles propres aux membres.

#### 9. Layout déterministe

Fonds, rail, repli et en-têtes existants réutilisés ; en-tête collant déjà livré conservé ; aucun titre Tabata imposé au Circuit standard.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Conserver Safe Areas, scroll et ordre structurel ; éviter une seconde Composition mono-Circuit.

#### 11. États de l’écran

Brouillon complet, paramètres à compléter, conteneur un membre conservé, conteneur vidé retiré ; boucle sans membre répétitif invalide.

#### 12. Contrôles et interactions

Entrée Circuit porteur : paramètres compatibles conservés, autres à compléter sans confirmation de perte. Déplacement direct : règles d’arrivée ; aucune étape de sortie intermédiaire.

#### 13. Gestes

Glisser entre conteneurs existants ; buy-in/out réordonnables dans leur zone et duplicables après l’original dans cette zone ; changer de zone passe par le Rôle.

#### 14. Validation

Circuit standard : matrice active ; Death by autonome groupé admis avec fin locale/redémarrage, standard alterné refusé sans mutation. Validation D.4 distincte de disponibilité du moteur.

#### 15. Brouillon et persistance

Sauvegarde et duplication conservent membres, porteurs, récupération et paramètres ; instantanés passés inchangés.

#### 16. Navigation et conservation d’état

Dialogue AMRAP Trois actions : Conserver le format AMRAP principal bleu par défaut, Adopter un format libre secondaire, Annuler restitue l’état antérieur ; compatible repris, reste à compléter ; buy-in/out sortent libres directement.

#### 17. Erreurs et cas limites

Sortie membre Durée vers AMRAP autonome : cible répétitions à renseigner, aucune conversion secondes/répétitions. Boucle vide signalée sans suppression arbitraire du buy-in/out.

#### 18. Accessibilité

Raisons de verrouillage réelles lisibles et commandes de conteneur actives selon le contexte ; pas de nouveaux impératifs VoiceOver ajoutés par cette révision.

#### 19. Invariants

FMT-01/04/09/12/13/21/26/30/31/34 ; aucun Format commun caché dans un Circuit standard ; aucune identité déduite du titre.

#### 20. Recette déterministe

Séance AMRAP puis For time relue/dupliquée à l’identique ; entrée/sortie inter-Circuits ; un membre conservé ; buy-in/out protégés ; Death by alterné coordonné distinct du standard groupé.

### CE-FMT-04 — Paramètres d’exercice contextualisés par un format
<a id="ce-fmt-04"></a>

#### 1. Identification

Famille des modales de la galerie, complète CE-UI-10 ; Tabata `8747:14451`, 30/30 `8656:34070` et modales AMRAP/EMOM/Death by/For time.

#### 2. Finalité fonctionnelle

Lire et modifier les valeurs effectives selon le porteur, sans confondre défaut, constante, valeur calculée et valeur à compléter.

#### 3. Contexte d’entrée

Ouverture depuis la carte d’un Exercice ou le parcours du modèle.

#### 4. Contexte de sortie / destinations

✓ applique au brouillon parent ; ✕ annule les changements locaux et restaure les valeurs antérieures.

#### 5. Données affichées et source de vérité

Prescription de l’Exercice, réglages du Circuit lorsqu’ils sont partagés, phrase générée ; aucune écriture sur le Mouvement partagé.

#### 6. Classification des valeurs Figma

Tabata 8/20/10 et 30/30 6/30/30 sont des valeurs modifiables ; ils ne justifient aucun grisé propre. Constantes des Formats spécialisés effectives et grisées ; Profil orange avant première validation selon CE-UI-10.

#### 7. Structure de l’écran

Feuille standard et ses six blocs : Exécution, Phases du mouvement, Séries, Côtés, Cadence et durée, Récupération ; champs non applicables retirés selon le modèle.

#### 8. Éléments obligatoires

EMOM Répétitions par défaut ou Durée (standard et dans chaque intervalle), cible propre à chaque Exercice ; AMRAP autonome en Répétitions ; membres AMRAP selon mode compatible ; Passage/incrément lorsqu’applicables ; For time borne héritée grisée ; Death by départ/incrément visibles avec À l’échec ; intervalle local en Death by alterné.

#### 9. Layout déterministe

Rendu DSF actuel, texte valeur calculée non modifiable noir sans pastille ; bleu éditable et gris verrouillé. Aucune copie d’un ancien layout à quatre cadres.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Feuille/scroll/claviers standards ; Charge Avec/Sans par Exercice et charges variables conservées.

#### 11. États de l’écran

Éditable, verrouillé effectif, calculé, à compléter, origine Profil non validée ; pas d’état sans effet déguisé en constante.

#### 12. Contrôles et interactions

Réglages autorisés actualisent la prescription ; cadence facultative AMRAP/For time sans modifier durées ou résultats ; Death by Cadence Sans. Modale accessible pour réglages autres que les cellules éditées directement dans le tableau Progression.

#### 13. Gestes

Interactions standards des paramètres ; la saisie directe au clavier de Progression est limitée au récapitulatif CE-FMT-02.

#### 14. Validation

**Validation du récapitulatif :** « Enregistrer dans la séance » n’est actif que si tous les paramètres requis sont renseignés et la configuration cohérente. Une cible à renseigner est signalée dans son cadre et bloque l’ajout ; un récapitulatif incomplet ne crée pas un Exercice « Paramètres à compléter » dans la Composition. Cet état reste possible après une modification ultérieure de Composition, notamment une entrée/sortie de Circuit ou de Format. Chaque case de tableau et la modale correspondante lisent et écrivent les mêmes champs standards de l’Exercice ; aucun second stockage. [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]

**Contrôle EMOM des durées — seuil inclusif :** le travail prévu d’un Exercice en Durée est sa cible, multipliée par deux s’il est fait de chaque côté, plus la pause entre les côtés applicable. En simple, alternance et À la suite, travail prévu ≥ intervalle propre bloque la validation ; Dans chaque intervalle, somme du travail prévu des membres ≥ intervalle commun bloque la validation. Les membres en Répétitions contribuent pour 0 à ce contrôle de durée connue, sans garantie que le travail total tiendra dans la fenêtre. Message sous le tableau, cadres des valeurs concernées et de l’intervalle rouges ; validation bloquée dans le récapitulatif, la modale et lors de l’édition de l’intervalle du Circuit. À 60 s : 40 s d’un seul côté admis, 40 s de chaque côté refusés ; 30 s + 30 s refusés ; 10 répétitions + 30 s ne déclenche pas ce seul contrôle.

Valider contraintes réelles au domaine, paramètres obligatoires et compatibilité ; aucun refus fondé sur d’anciennes constantes Tabata/30/30.

#### 15. Brouillon et persistance

Même état que tableau et Composition, aucune prescription parallèle ; Récupération propre à l’Exercice, aucun ajout par le bouton Pause/Arrêt.

#### 16. Navigation et conservation d’état

Fermeture restitue la carte ; aucune mutation partielle après annulation ; instantanés passés inchangés.

#### 17. Erreurs et cas limites

30/30 : effort 30 s, Pause 30 s, pas une récupération de 30 s. For time : 3×21 décrit trois tours de 21, distinct de 21-15-9.

#### 18. Accessibilité

Libellés et états explicites ; contrastes et composants existants ; pas de nouveau lot d’accessibilité imposé.

#### 19. Invariants

FMT-03/04/17/19/26/29/30/31/34/42 ; phases compatibles selon D-446 sans adaptation proportionnelle inventée.

#### 20. Recette déterministe

Objectif EMOM 40 s / intervalle 60 s valide ; porter l’objectif à 60 s, ou l’intervalle à 40 s, affiche l’erreur et bloque la validation. Circuit commun avec deux membres de 30 s : intervalle 60 s refusé ; passage à 61 s lève cette erreur si le reste est valide. Changer l’objectif depuis la modale se reflète dans le tableau, et inversement.

Tabata et 30/30 modifiables ; cadence AMRAP/For time activable sans effet temporel ; Death by alterné conserve son intervalle local, groupé coordonné référence celui du Circuit ; annulation réversible.

### CE-FMT-05 — Exécution des fenêtres et formats à borne ouverte
<a id="ce-fmt-05"></a>

#### 1. Identification

Complément fonctionnel CE-EXEC-SESSION-01. Aucun écran d’exécution spécifique qualifié dans les 46 captures ; layout non clôturé.

Règles applicables : RM-055, RM-FMT-23, RM-FMT-24, RM-FMT-25, RM-FMT-26, RM-FMT-33, RM-FMT-35, RM-FMT-36 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Exécuter la prescription selon sa borne et son unité sans double comptage ni transition anticipée.

#### 3. Contexte d’entrée

Démarrage d’un instantané valide ; format et paramètres effectifs figés.

#### 4. Contexte de sortie / destinations

EMOM : fin des fenêtres prévues ; AMRAP : échéance de chaque bloc ; Death by : portée locale autonome ou collective au Circuit selon la référence active, puis CE-FMT-06. Pas de fin par un compte d’exercices supposé.

#### 5. Données affichées et source de vérité

Instantané, horloge, rang/échéance/objectif courants et signal de travail accompli ; données de résultat distinctes.

#### 6. Classification des valeurs Figma

Les captures de composition ne prouvent pas le layout d’exécution. Les nombres du cadran sont calculés depuis l’exécution, pas copiés de Figma.

#### 7. Structure de l’écran

Réemploi du shell Exécution ; cadran de fenêtre et contexte exercice. Position précise des informations propres au format à illustrer avant qualification visuelle.

#### 8. Éléments obligatoires

Objectif et fenêtre courante ; temps restant ; distinction travail/repos ; rang distinct de tours acquis Death by.

#### 9. Layout déterministe

Pas de coordonnées nouvelles prescrites sans frame. Conserver shell, Safe Areas et hiérarchie existants ; compléter la preuve de layout pour les informations propres au format.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Commandes accessibles sans recouvrir le cadran ; textes agrandis et lecteurs d’écran ; aucun clavier pour saisir le rang.

#### 11. États de l’écran

Travail ; travail confirmé/repos révélé ; échéance ; clôture. R-01 couvre le raccordement avec pause utilisateur/reset/point et reprise.

#### 12. Contrôles et interactions

- Appui sur cadran révèle le repos sans avancer.
- Death by acquiert au plus une fois la fenêtre accomplie.
- L’échéance EMOM relance quoi qu’il arrive.
- Aucune saisie manuelle de rang.

#### 13. Gestes

Appui cadran explicite ; son et média ne confirment pas de travail. Gestes génériques ne doivent pas contourner l’échéance.

#### 14. Validation

Identité de fenêtre/exécution vérifiée, doublons idempotents ; objectif issu du rang et des paramètres. Cas multi-exercices Death by R-03 non extrapolé.

#### 15. Brouillon et persistance

Conserver instantané, événements/résultats qualifiés et échéances nécessaires ; pas de liste infinie de fenêtres précréée.

#### 16. Navigation et conservation d’état

Reprise sans double acquisition ni lecture de la source modifiée ; politique de suspension/reprise exacte à raccorder en R-01.

#### 17. Erreurs et cas limites

Fenêtre sans appui ≠ objectif confirmé. Audio indisponible ne doit pas devenir l’horloge métier. R-02 bilatéralité reste explicitement non qualifié.

#### 18. Accessibilité

Annonces des changements de phase, objectif et fin de fenêtre ; repos et travail différenciés autrement que par couleur ou son.

#### 19. Invariants

FMT-20–27, 33–36, 39–41 ; - repos inclus dans fenêtre ;
- pas de multiplicateur caché pour côtés.

#### 20. Recette déterministe

REC-10–15, 19–21, 27 ; ces scénarios sont prescrits, non exécutés sur un moteur livré.

### CE-FMT-06 — Arrêt et résultat Death by
<a id="ce-fmt-06"></a>

#### 1. Identification

Contrat fonctionnel de confirmation et raccord à CE-UI-08. Aucun nœud de confirmation Death by identifié dans l’inventaire courant ; layout partiel.

Règles applicables : RM-081, RM-FMT-06, RM-FMT-33, RM-FMT-34, RM-FMT-35, RM-FMT-36, RM-FMT-37, RM-FMT-38 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Clore avec un motif fidèle et un résultat tours acquis + répétitions partielles, sans confondre résultat et achèvement.

#### 3. Contexte d’entrée

Un seul déclencheur de fin pendant une exécution Death by ; dernière fenêtre et acquisitions connues.

#### 4. Contexte de sortie / destinations

Validation → synthèse/résultat ; refus de clôturer conserve l’exécution selon contrat de confirmation existant, sans acquérir un tour.

#### 5. Données affichées et source de vérité

Tours acquis par appuis valides, dernière fenêtre non acquise, répétitions partielles proposées à zéro, motif limite/abandon et état incomplet.

#### 6. Classification des valeurs Figma

12 tours + 5 répétitions est un exemple de résultat ; zéro initial est une proposition de saisie, non une mesure.

#### 7. Structure de l’écran

Confirmation à deux choix métier : Limite atteinte / Abandonner ; saisie des répétitions partielles lorsqu’applicable ; synthèse ensuite.

#### 8. Éléments obligatoires

Un seul déclencheur d’arrêt ; deux motifs ; saisie partielle si fenêtre entamée inachevée ; résultat et état incomplet indépendants du motif.

#### 9. Layout déterministe

Réutiliser le système de modale de confirmation ; emplacement précis des deux choix et du champ à illustrer. Ne pas prétendre ce layout validé depuis une capture de paramètres.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Clavier numérique pour répétitions ; valeur/action accessibles au-dessus du clavier et via scroll selon shell modal ; Safe Areas.

#### 11. États de l’écran

Confirmation ouverte ; valeur proposée/modifiée ; validation ; erreur ; clôture. Aucune issue « Terminée » sur limite atteinte.

#### 12. Contrôles et interactions

Saisie initiale 0 ; validation confirme la valeur affichée ; choisir le motif ne crée pas de tour supplémentaire. Empêcher une double clôture.

#### 13. Gestes

Actions explicites ; la fermeture non validée ne doit pas enregistrer la proposition comme mesure.

#### 14. Validation

Valeur entière non négative conforme au type répétitions ; ne pas inventer une borne max issue de Figma. Contrôle de cohérence avec fenêtre et résultat avant validation.

#### 15. Brouillon et persistance

Persister le résultat confirmé, son motif et l’achèvement incomplet avec l’instantané ; brouillon du formulaire non assimilé à un relevé acquis.

#### 16. Navigation et conservation d’état

Après clôture, synthèse puis suivi existants ; l’édition ultérieure de la séance ne modifie pas ce résultat. La représentation d’un Death by incomplet sera définie dans le chantier Suivi (D-381, D-365).

#### 17. Erreurs et cas limites

Aucun appui dans la dernière fenêtre : aucun tour acquis pour elle. Aucun doublon de clôture. Cas sans répétitions partielles à afficher selon valeur effective, sans faux objectif accompli.

#### 18. Accessibilité

Champs et choix nommés ; focus contenu dans la modale ; annonce du motif et du résultat ; retour du focus si non-validation.

#### 19. Invariants

FMT-34–38 ; limite atteinte et abandon donnent tous deux incomplet ; rang déduit de l’horloge.

#### 20. Recette déterministe

REC-20–24 ; 12 tours confirmés +5 déclarées ; zéro validé conservé comme déclaration ; double appui sans double acquisition.

## Bilatéralité

### CE-T03-12 — Exécution directe — bilatéralité, Pauses, Récupération

#### 1. Identification

Bloc B5 ; états S59–S62 ; T03-E E40–E41 ; Shell Execution ; sous-titre côté validé D-149, libellés Côté 1 / Côté 2 (D-407).

Règles applicables : RM-036, RM-037, RM-058, RM-059, RM-062, RM-077, RM-099, RM-129, RM-148, RM-149, RM-150, RM-211, RM-241, RM-242, RM-243, RM-244 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

L’ordre d’exécution vient du paramètre Ordre des côtés (libellé visible Enchainement, D-413) : Un côté après l’autre (défaut) ou Les deux côtés à chaque série. En bilatéral N est toujours par côté, paramètres communs aux deux côtés. Les successions et pauses sont celles de chapitre 08, paramètres d’exercice ; aucun repli de PC vers la Pause. Les cibles et Pauses variables proviennent de la ligne courante. Aucune récupération post-exercice en ACTIVITY.

#### 3. Contexte d’entrée

Après préparation d’un snapshot bilatéral.

#### 4. Contexte de sortie / destinations

Séries/pauses premier côté → SIDE_RECOVERY si positive → Séries/pauses second → Fin propre applicable → CE-T03-13.

#### 5. Données affichées et source de vérité

Changement de côté de l’instantané (Avec / Sans ; valeurs historiques `RIGHT_LEFT` et `LEFT_RIGHT` lues Avec, RM-244) ; côté courant côté 1 / côté 2, noms techniques laissés à l’implémentation, valeurs historiques `RIGHT` / `LEFT` lisibles (D-407) ; résultats séparés par côté ; charge de la série courante selon RM-241, sans valeur distincte par côté (RM-235).

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

`Côté 1` / `Côté 2` = libellés calculés, le côté 1 étant celui par lequel l’utilisateur commence (RM-243) ; succession selon l’Ordre des côtés de l’instantané, jamais selon la frame d’exemple.

#### 7. Structure de l’écran

Shell Execution + nom + sous-titre côté + information Série/mode + commandes.

#### 8. Éléments obligatoires

Sous-titre côté ; aucun `1/2`/`2/2`; même rang logique Activity entre côtés ; Pauses suivant [Ordres d’exécution et pauses](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#ordres-dexécution-et-pauses), Pause terminale comprise ; Pause entre les côtés éventuelle avant le second passage.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 9. Layout déterministe

Nom puis Catégorie, et ligne Côté 1 / Côté 2 distincte du contexte (RM-243) ; aucun compteur 1/2 ou 2/2. Pas de Tour en direct ; dimensions du shell courant.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; sous-titre reste lisible ; aucune collision avec titre ou timer.

#### 11. États de l’écran

Premier côté ; Pause intra-côté ; Pause entre les côtés éventuelle ; second côté ; Partial side ; fin intrinsèque.

#### 12. Contrôles et interactions

Ordre côté 1 puis côté 2 strict (RM-243). Réinitialiser ne touche que le côté courant et conserve l’autre résultat. Saut confirmé du premier côté chronométré : résultat partiel conservé, second côté selon D-150 ; transition selon la succession du plan ([Ordres d’exécution et pauses](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#ordres-dexécution-et-pauses) ; [R-03 — Transition, reset et suspension](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-03--transition-reset-et-suspension)).

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 13. Gestes

Tap commandes uniquement.

#### 14. Validation

*Texte identique à celui de la section [« Déroulement d’un Exercice »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#déroulement-dun-exercice) ; il n’est pas recopié ici.*

#### 15. Brouillon et persistance

Résultats séparés par côté (côté 1 / côté 2 ; résultats historiques par côté lisibles, RM-244) ; réinitialisation ne détruit pas résultat autre côté.

#### 16. Navigation et conservation d’état

Transitions internes au plan ; aucun écran intermédiaire Session.

#### 17. Erreurs et cas limites

Interruption entre côtés ; reprise sur bon side ; side result déjà finalisé ne doit pas être dupliqué.

#### 18. Accessibilité

Annonce vocale du côté (« Côté 1 » / « Côté 2 », RM-243) au début et au changement selon règles ; label accessible développé même si UI courte ailleurs.

#### 19. Invariants

*Texte identique à celui de la section [« CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-08--composer-une-séance--modifier-une-séance--brouillon-circuit-points-darrêt-et-validation) ; il n’est pas recopié ici.*

Respecter l’ordre effectif : successif, PC une fois ; par paire, PC à chaque Série. Pi et PC selon chapitre 08, paramètres d’exercice ; aucune Récupération contextuelle en ACTIVITY ; résultats séparés par côté ; rang logique Exercice inchangé.

L’ajout explicite de recovery concerne SESSION seulement ; aucune récupération contextuelle en ACTIVITY. Cadence sonore propre à chaque Série/côté conservée.

#### 20. Recette déterministe

Changement de côté Avec dans chacun des deux enchaînements, donnée historique `RIGHT_LEFT` ou `LEFT_RIGHT` lue Avec sans perte de l’Ordre des côtés (RM-244), C=1/2/99, pause inter-Séries 0/>0, SIDE_RECOVERY0/>0, reset second préservant premier, interruption pendant SIDE_RECOVERY, absence de récupération après second. Tester saut anticipé avec pC>0 puis pC=0/pS>0 puis les deux à zéro ; respecter les cumuls Pi puis PC en ordre successif et la succession PC puis Pi après paire en ordre alterné.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

### Contrats PRE-5 — D-427 à D-429
**P-Avant la séance — Douleur** (8921:35275) et **P-Synthèse de séance — Effort et douleur — Douleur renseignée** (8921:35340) : Par défaut, aucune évaluation avant exécution ; après, Ressenti obligatoire à trois choix. Parcours enrichi uniquement lorsque le lancement intervient dans le contexte d'un Programme dont l'option est active ; un lancement indépendant reste standard, même pour un contenu appartenant au Programme. Enrichi avant : douleur 0–10 obligatoire, choix explicite, aucune localisation, Commencer bloqué sans réponse. Enrichi après : douleur 0–10 obligatoire et sans présélection (indépendante de la valeur avant) et effort perçu 1–10 obligatoire, en remplacement du Ressenti ; Enregistrer bloqué tant que les valeurs requises manquent. Si douleur finale supérieure à zéro : au moins une localisation choisie parmi les zones corporelles KODJO avec latéralité si pertinente, sélection multiple admise ; aucune localisation imposée à zéro. Zéro n'est jamais déduit d'une absence de réponse. Configuration précise de l'option Programme : À CLARIFIER.

Modale « P-Modale — Répétitions partielles » (Figma 8928:15098). Formats imposés : interruption ou série achevée sous la cible. Valeur initiale proposée 0, minimum 0, dépassement de la cible autorisé. Zéro proposé n'est pas une mesure avant validation. Valider enregistre le résultat réel et poursuit automatiquement le plan (récupération, série suivante ou fin) ; fermer sans valider n'enregistre aucun résultat et revient à l'étape courante sans progression.

Modale « P-Modale — Résultat de série » (Figma 8937:35362). Valeur initiale proposée 0, minimum 0, dépassement de cible autorisé. Valider enregistre le résultat réel indépendamment de la cible et poursuit automatiquement le plan ; fermer sans validation n'enregistre rien, conserve l'état et revient à l'étape courante sans progression. Le déclencheur exact non encore arbitré reste À CLARIFIER.

**Contradiction Figma identifiée :** la mention « Facultatif. Sans réponse, la douleur est notée 0 » sur l'écran avant l'exécution contredit D-427.

## Exécution

### CE-T03-09 — Lancement direct et préparation fixe 5 s

#### 1. Identification

Préparation de l’Exécution ACTIVITY, état du shell partagé ; aucune ancienne page autonome « écran 16 ». Frame courante 4968:8188 pour la structure, pas une preuve de préparation 5 s.

Règles applicables : RM-096, RM-097, RM-098, RM-099, RM-162, RM-190, RM-218, RM-241 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Lancer une Exécution `ACTIVITY` autonome depuis Lecture, avec snapshot immuable et préparation système fixe 5 s.

#### 3. Contexte d’entrée

Lecture d’un Exercice valide du Catalogue ou d’une occurrence Calendrier ACTIVITY. Conserver contexte appelant et identifiant d’occurrence le cas échéant.

#### 4. Contexte de sortie / destinations

Après préparation fixe 5 s → compte à rebours propre applicable → première Série. Arrêt volontaire uniquement via pause/confirmation ; finalisation selon CE-T03-13/14.

#### 5. Données affichées et source de vérité

Snapshot ActivityDefinition, nom, préparation 5. `preparation=5` est règle système, pas propriété de la définition.

Paramètres de la Série courante issus de l’instantané variable/uniforme, dont la charge selon RM-241 ; ordres selon [Ordres d’exécution et pauses](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#ordres-dexécution-et-pauses). En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

Cadence éventuelle issue de la Série de l’instantané, jamais du Profil ou des chiffres Figma. Temps réellement dépensé cumulatif distinct du chrono de tentative ; bip applicable aux deux modes, sans modifier leur terminaison propre.

#### 6. Classification des valeurs Figma

Nom = dynamique ; 5 s = règle statique système ; autres exemples = démonstration.

#### 7. Structure de l’écran

Shell Exécution, nom Exercice et Catégorie, décompte de préparation ; aucune Séance/Tour/Cycle.

#### 8. Éléments obligatoires

Préparation 5 s, nom Exercice, Catégorie, état de suspension ; Pause/Reprendre et accès Arrêter depuis Pause selon§4.12. Réinitialiser/Suivant pendant cette phase système ne sautent pas la préparation.

Série n/N ; côté courant distinct uniquement en bilatéral, absent en unilatéral ; aucune barre par Série. À suivre affiche la phase réelle : Pause (y compris terminale) ou, uniquement en bilatéral, Pause entre les côtés ; aucune Récupération en direct.

#### 9. Layout déterministe

Réutiliser Shell existant, ne pas créer un écran Session factice. Le compte à rebours reste dans zone centrale prévue.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 et Safe Areas ; pas de clavier ; commandes visibles à taille standard et atteignables par scroll si texte agrandi.

#### 11. États de l’écran

Initial 5 ; 4..1 ; 0/transit ; erreur initialisation.

#### 12. Contrôles et interactions

Pause suspend le décompte, Reprendre reprend le restant ; Arrêter depuis Pause suit confirmation. Aucun tap ne crée de Session ni une seconde Exécution. Commandes propres à une Série ne sont pas des commandes de la préparation.

Si la Série est en Répétitions avec bip, appliquer [Exécution d'une séance — Bip de cadence, progression et sécurité](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#exécution-dune-séance--bip-de-cadence-progression-et-sécurité) : nominal sans transition, Suivant normal ; dans les deux autres modes, le bip est périodique sans changer leur terminaison ; Pause/Reprise sur intervalle complet ; reset de portée existante avec temps réel conservé. En préparation/phase chronométrée, conserver le décompte propre. Média/retournement ne déclenchent pas Pause.

#### 13. Gestes

Tap sur commandes explicites seulement ; aucun swipe Catalogue pendant Execution.

#### 14. Validation

Éligibilité avant création Execution. Définition invalide → aucune Execution créée.

#### 15. Brouillon et persistance

Création atomique Execution + snapshot ; origin ACTIVITY ; état Catalogue de retour mémorisé en mémoire de parcours.

#### 16. Navigation et conservation d’état

Conserver le contexte d’entrée jusqu’à la Synthèse ; démarrage crée un instantané autonome, aucune Séance artificielle. Retour après finalisation selon §4.12.

#### 17. Erreurs et cas limites

Échec snapshot/persistance = pas d’Execution fantôme. Source supprimée après snapshot n’empêche pas la suite.

#### 18. Accessibilité

Décompte annoncé selon guidage ; aucun label Tour/Séance ; nom accessible.

#### 19. Invariants

*Texte identique à celui de la section [« CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-08--composer-une-séance--modifier-une-séance--brouillon-circuit-points-darrêt-et-validation) ; il n’est pas recopié ici.*

5 s fixes ; origin ACTIVITY ; pas de Session artificielle ; pas SESSION_END.

#### 20. Recette déterministe

Tester Catalogue et Calendrier, source invalide/disparue, préparation exactement 5 s, compte à rebours propre 0/>0, absence de Tour/Cycle/SESSION_END, interruption et double démarrage ; vérifier instantané immuable et rattachement d’occurrence.

Vérifier les deux ordres avec changement de côté (côté 1 puis côté 2, RM-243), valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

Vérifier passage entre préparation, Série cadencée, pauses programmées et fin ; deux côtés/deux ordres si applicables ; reset préservant autre côté et temps cumulé ; absence de double signal/transition. Bip valide dans les deux modes ; aucun signal hors phase Série.

### CE-T03-10 — Exécution directe — Durée chiffrée unilatérale

#### 1. Identification

Exécution ACTIVITY en Durée unilatérale ; frame 4968:8188, contexte de données unilatéral ; pas d’ancien écran 17 autonome.

Règles applicables : RM-036, RM-060, RM-061, RM-062, RM-099, RM-190, RM-211, RM-241 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Exécuter une ActivityDefinition DURATION en autonomie avec Séries et Pauses, sans orchestration Session. En unilatéral, aucune phase de récupération n’est ajoutée.

#### 3. Contexte d’entrée

Fin CE-T03-09 ; mode DURATION ; changement de côté Sans (D-406).

#### 4. Contexte de sortie / destinations

Fin Série → Pause si positive, y compris la Pause terminale après la dernière Série → Fin d’exercice propre applicable → CE-T03-13. Aucune récupération de côté en unilatéral, aucune récupération post-occurrence en direct.

#### 5. Données affichées et source de vérité

**Cible par Série (13/10) :** fin automatique seulement en Durée chiffrée ; Suivant pour Répétitions ou toute cible À l’échec. Pas de nominal pour l’échec, même avec bip. Relevé par occurrence/côté : durée de dernière tentative ou répétitions estimées/déclarées ; non bloquant. Voir chapitre 08, Cibles et relevés d’exécution. Aucun nouveau layout de saisie/restitution n’est livré dans cette passe.

Snapshot uniquement ; série courante, cible temps, temps restant, progression locale ; charge de la série courante selon RM-241.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Nom/temps/série = dynamiques ; commandes = statiques ; exemples = démonstration.

#### 7. Structure de l’écran

Nom Exercice → Catégorie → chrono courant et Série → commandes du shell ; côté absent ; Tour/Cycle absents ; média conditionnel.

#### 8. Éléments obligatoires

Compte à rebours de Série ; numéro/total de Séries ; temps total actif ; Catégorie sous le nom ; commandes Réinitialiser, Pause, Suivant et son/vocal ; mode et unité non ambigus. Charge de la série courante lorsqu’elle est active, selon RM-241, sans acquittement.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 9. Layout déterministe

Réutiliser groupes visuels du Shell ; supprimer plutôt que remplacer par valeurs fictives les blocs Session-only. La charge de la série courante (RM-241) n’a pas encore de référence visuelle Figma : emplacement et traitement à fixer par Figma, aucun emplacement « à côté de la cible » n’est arrêté ; référence visuelle manquante.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas clavier ; commandes restent dans Safe Area ; pas scroll principal si Shell n’en prévoit pas.

#### 11. États de l’écran

Préparation/compte à rebours propre ; Série active ; pause inter-Séries ; pause utilisateur ; confirmation saut/reset ; Fin propre ; fin/interruption ; média éventuel. Pas de phase récupération unilatérale.

#### 12. Contrôles et interactions

Réinitialiser et Suivant selon table§4.12 ; Pause suspend les horloges actives ; terminer volontairement depuis Pause. Confirmation saut avant zéro produit le résultat partiel correspondant.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 13. Gestes

Tap commandes ; aucun mouvement structurel de Session.

#### 14. Validation

Transitions dérivées du snapshot et plan ; source persistante n’est jamais relue pour modifier le run.

#### 15. Brouillon et persistance

Résultats dans Execution ACTIVITY. Aucun SessionActivity créé/persisté par l’exécution.

#### 16. Navigation et conservation d’état

Aucune sortie Session ; fin vers CE-T03-13 puis Synthèse.

#### 17. Erreurs et cas limites

Background/reprise selon moteur commun ; interruption technique conserve snapshot/résultats ; source absente tolérée.

#### 18. Accessibilité

Timer/commandes nommés ; aucun côté annoncé sans changement de côté (D-406) ; état pause annoncé.

#### 19. Invariants

*Texte identique à celui de la section [« CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-08--composer-une-séance--modifier-une-séance--brouillon-circuit-points-darrêt-et-validation) ; il n’est pas recopié ici.*

Aucun Tour/Cycle/SESSION_END ; calculs existants inchangés.

#### 20. Recette déterministe

Vérifier alternance chiffré/échec, sécurité 2 h sans nominal, progression des cibles inconnues à Suivant ; reset 20 s puis 35 s donne 55 s cumulé et 35 s relevé. Suivant ne confirme pas implicitement un nombre de bips estimé.

Durée 1 s (borne minimale de saisie, D-430) et plusieurs Séries avec pause 0/>0 ; vérifier séparément la conservation d’une cible historique hors bornes non modifiée lorsqu’elle existe (D-383) ; fin naturelle, saut anticipé confirmé/annulé, reset, pause/reprise/arrêt, Fin propre 0/>0 ; aucun Tour/Cycle/récupération post-occurrence. Vérifier Catégorie, chrono et conservation du temps global après reset. Charge active, Sans et série variable à zéro : affichage selon RM-241 ; minuteurs, pauses et transitions inchangés.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

### CE-T03-11 — Exécution directe — Répétitions et À l’échec

#### 1. Identification

Bloc B5 ; états S57/S58 ; T03-E E40/E43 ; Shell Execution partagé.

Règles applicables : RM-033, RM-058, RM-059, RM-062, RM-067, RM-069, RM-077, RM-099, RM-111, RM-211, RM-241 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Exécuter REPETITIONS avec/sans cadence ou toute Série à cible À l’échec, y compris DURATION ; chronomètre croissant, Suivant fin normale. Avec cible chiffrée et cadence la durée prescrite Ri×Ci est estimée et ne termine pas la Série.

#### 3. Contexte d’entrée

Fin préparation CE-T03-09 avec mode REPETITIONS ou première cible À l’échec ; transition depuis une Série chiffrée lorsque la Série suivante est À l’échec.

#### 4. Contexte de sortie / destinations

Suivant → fin Série → Pause / Série suivante / `SIDE_RECOVERY` éventuelle selon le côté et le plan, puis CE-T03-13 ; jamais `POST_ACTIVITY_RECOVERY`.

#### 5. Données affichées et source de vérité

*Texte identique à celui de la section [« CE-T03-10 — Exécution directe — Durée chiffrée unilatérale »](#ce-t03-10--exécution-directe--durée-chiffrée-unilatérale) ; il n’est pas recopié ici.*

REPETITIONS chiffrées : cible du snapshot. Toute cible À l’échec : aucun nombre prescrit ; mode conservé pour l’unité du relevé. Pauses/Récupérations : durées connues snapshot.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

REPETITIONS : cadence et cible prescrites de l’instantané. État cadence avant/après nominal, progression interne, temps actif cumulé et chrono tentative séparés.

#### 6. Classification des valeurs Figma

Cibles REPETITIONS = dynamiques ; absence de cible Failure = règle métier ; exemples = démonstration.

#### 7. Structure de l’écran

Shell Exécution : nom, Catégorie, côté si applicable, numéro de Série, charge de la série courante selon RM-241, cible de répétitions ou À l’échec, chronomètre croissant et commandes ; Tour/Cycle absents.

#### 8. Éléments obligatoires

Chronomètre courant initial 00:00, cible Répétitions inchangée par reset, aucune cible chiffrée en À l’échec. Suivant termine normalement la Série ; Catégorie toujours sous le nom.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

Bip périodique positif : premier signal après un intervalle, puis jusqu’à fin/Pause de Série, même après le nominal Répétitions. Aucun signal périodique maintenu après nominal sans signal final distinct ni bip minute superposé. Aucun compteur de répétitions réalisées. Durée conserve sa fin au zéro du minuteur ; À l’échec reste manuel.

#### 9. Layout déterministe

Même architecture visuelle que CE-T03-10 ; ne jamais combler un espace Failure par une durée ou répétition fictive.

Conserver le shell et les commandes existantes. Les états cadencés sont spécifiés fonctionnellement ; placement d’un éventuel libellé de cadence/nominal non certifié faute de frame. Ne pas créer un indicateur par Série ou un nouveau design. La charge de la série courante (RM-241) n’a pas encore de référence visuelle Figma : emplacement et traitement à fixer par Figma, aucun emplacement « à côté de la cible » n’est arrêté ; référence visuelle manquante.

La durée cible Ri×Ci, lorsqu’affichée, utilise la ligne de temps existante et le style du compte à rebours, sans nouveau shell. Elle est une estimation ≈, aucun compteur automatique de répétitions.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas clavier ; labels modes non tronqués.

#### 11. États de l’écran

Série Répétitions/À l’échec ; pause inter-Séries ; côté suivant via CE-T03-12 ; pause utilisateur ; fin propre ; résultat terminé/interrompu.

Cadencée avant nominal ; nominal atteint sans Suivant ; Pause/Reprise avec intervalle complet ; reset. Ces variantes fonctionnelles réemploient le layout existant et ne nécessitent pas trois maquettes dédiées (CAD-V02–04 levées comme réserves de développement).

#### 12. Contrôles et interactions

Suivant valide normalement la Série sans confirmation de saut chronométré, puis applique pause/Série/côté/Fin propre selon plan. Réinitialiser remet le chronomètre courant 00:00 sans changer cible ni temps total déjà écoulé ; portée bilatérale spécifique §4.12.

Suivant anticipé en cadence acquiert le reste du poids sans confirmation ni Partielle due à la durée. Pause conserve le temps réel, abandonne la fraction pour progression ; Reprendre lance un intervalle complet. Réinitialiser : chrono tentative 0 et cadence intervalle 1, accumulateur réel conservé.

#### 13. Gestes

Tap commandes uniquement.

#### 14. Validation

Chaque Série exige une cible typée : nombre valide ou À l’échec. Absence/invalide n’équivaut pas à l’échec. Bip 0..10 valide dans les deux modes, entier obligatoire,0 = Sans (RM-245). Aucune estimation forfaitaire ni transition déclenchée par le bip.

#### 15. Brouillon et persistance

Résultat persistant par Série/côté : prescription instantanée et temps actif cumulé, y compris fraction abandonnée et tentatives reset. Aucun compte réel de répétitions.

#### 16. Navigation et conservation d’état

Enchaînement interne du plan ; fin CE-T03-13.

#### 17. Erreurs et cas limites

Double tap Suivant idempotent/protégé ; reprise après interruption ne crée pas une Série supplémentaire.

Arrière-plan continue par ancres, signaux manqués non rejoués ; seuil 30 min après nominal recalculé si cadence,2 h sans cadence/À l’échec. Audio à qualifier sur appareil.

#### 18. Accessibilité

Mode et cible utile annoncés ; Failure n’annonce aucune cible fausse ; Suivant clairement nommé.

Cadence et état utiles annoncés sans dépendre du son ; ne pas annoncer chaque seconde ni un nombre réalisé supposé. Suivant reste accessible après nominal.

#### 19. Invariants

*Texte identique à celui de la section [« CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-08--composer-une-séance--modifier-une-séance--brouillon-circuit-points-darrêt-et-validation) ; il n’est pas recopié ici.*

Failure sans cible ; Suivant normal ; aucune confirmation chronométrée ; pas SESSION_END.

D-302 confirme tous les signaux et comportements de cadence ; ≈ ne signifie pas absence de guidage.

#### 20. Recette déterministe

*Texte identique à celui de la section [« CE-T03-10 — Exécution directe — Durée chiffrée unilatérale »](#ce-t03-10--exécution-directe--durée-chiffrée-unilatérale) ; il n’est pas recopié ici.*

Deux modes, N=1/N>1, cible 1/100, reset après temps écoulé, Suivant sans dialogue, pauses 0/>0, changement de côté et Fin propre. Aucun total cible inventé pour À l’échec ; aucun Tour/Cycle ni récupération post-occurrence. Charge active ou Sans : affichage selon RM-241, sans confirmation ; cibles, cadence et pauses inchangées.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

10×4 s : début 0, bips 4..36, final 40 ; Suivant 20/45 s normal ; Pause 6 s puis intervalle 4 s complet ; reset 6 s puis 10 s → réel 16 s. Arrière-plan sans rejeu ; après nominal aucun bip, Série active. Recette prescrite, non exécutée.

### CE-T03-13 — Fin, interruption et retour d’Exécution directe

#### 1. Identification

Bloc B5 ; états S63–S65 ; T03-E E43, E44, E49.

Règles applicables : RM-078, RM-099, RM-100, RM-101, RM-102, RM-190 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Clore l’Execution ACTIVITY immédiatement après sa dernière phase métier et ouvrir la Synthèse, sans SESSION_END.

#### 3. Contexte d’entrée

Dernière Série/côté puis Fin propre achevée, ou arrêt volontaire/interruption technique depuis une phase en cours.

#### 4. Contexte de sortie / destinations

Fin de la dernière Série/côté puis Fin propre applicable → signal de fin → CE-T03-14. Arrêt volontaire confirmé → Synthèse Interrompue ; interruption technique sans présentation possible → historique Interrompue sans Ressenti autorisé.

#### 5. Données affichées et source de vérité

État moteur, résultats par Série/côté/phase et instantané ACTIVITY ; total actif exclut pauses utilisateur et attente de point d’arrêt le cas échéant. Instantané figé au départ ; Ressenti/Commentaire finalisés séparément.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Statut/temps = dynamiques ; libellés confirmation = statiques ; aucune valeur de fin de Séance applicable.

#### 7. Structure de l’écran

Commandes et dialogue d’arrêt selon§4.12 ; transition de fin vers Synthèse ; aucun composant SESSION_END.

#### 8. Éléments obligatoires

Signal de fin, statut persisté, Synthèse sur fin normale/arrêt volontaire ; interruption technique sans Synthèse seulement si présentation impossible.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 9. Layout déterministe

Réutiliser composants communs. Ne pas ajouter carte/phase Fin de séance.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Selon Shell Execution et dialogue commun ; 360/402/440.

#### 11. États de l’écran

Fin naturelle, fin partielle, arrêt confirmé/annulé, interruption technique, fin propre, Synthèse en attente de finalisation.

#### 12. Contrôles et interactions

Pause puis Arrêter ouvre confirmation ; Annuler reprend l’état suspendu ; confirmer clôt une seule Exécution et présente Synthèse si possible. Aucun bouton Retour ne remplace l’arrêt confirmé.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 13. Gestes

Tap commandes/dialogue ; aucun swipe métier.

#### 14. Validation

Finalisation seulement après état cohérent des résultats ; double finalisation interdite/idempotente.

#### 15. Brouillon et persistance

Sauvegarder Execution/results avant navigation ; ne pas perdre résultats en cas d’erreur transition.

#### 16. Navigation et conservation d’état

Conserver contexte Catalogue/Calendrier jusqu’à CE-T03-14. Aucun retour automatique qui contourne Ressenti lorsque la Synthèse est présentée.

#### 17. Erreurs et cas limites

Échec finalisation → rester état récupérable ; crash après persistance avant navigation → reprise sans nouvelle Execution.

#### 18. Accessibilité

Signal de fin non uniquement sonore ; dialogues lisibles ; focus sur décision.

#### 19. Invariants

*Texte identique à celui de la section [« CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-08--composer-une-séance--modifier-une-séance--brouillon-circuit-points-darrêt-et-validation) ; il n’est pas recopié ici.*

Aucun SESSION_END ; aucun Session count ; origin ACTIVITY intact.

#### 20. Recette déterministe

Fin 0/>0 ; plan terminé/partiel ; arrêt depuis Pause confirmé/annulé ; interruption technique sans Synthèse ; clôture idempotente et aucune duplication historique ; retour par contexte après Enregistrer.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

### CE-EXEC-SESSION-01 — Exécution d’une Séance — phases, commandes et confirmations

**Complément Formats actif :** Tabata et 30/30 standards modifiables ; contraintes effectives des Formats spécialisés selon CE-FMT-04 et la référence du 02/11.

#### 1. Identification

Famille SESSION :1992:8132/8530/8626 ; dialogues 1992:8224/8326/8428 ; médias CE-MEDIA-EXEC-01/02. ACTIVITY reste CE-T03-09..13.

Règles applicables : RM-026, RM-028, RM-029, RM-030, RM-038, RM-055, RM-056, RM-059, RM-060, RM-061, RM-062, RM-063, RM-067, RM-077, RM-084, RM-145, RM-147, RM-191, RM-209, RM-213, RM-218, RM-219, RM-220, RM-FMT-41, RM-241, RM-243 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Exécuter l’instantané de Séance avec Circuit répété en Tours, Exercices avant/après, phases de Séance uniquement pour préparation/fin, récupérations et points d’arrêt.

#### 3. Contexte d’entrée

Démarrer depuis Catalogue ou occurrence Calendrier SESSION valide ; écran initial puis action Démarrer lance le plan, sans double lancement.

#### 4. Contexte de sortie / destinations

Plan achevé → CE-UI-08 ; arrêt depuis Pause confirmé → CE-UI-08 Interrompue ; interruption technique sans Synthèse possible → historique conservé. Ne pas permettre un retour qui abandonne silencieusement le moteur.

#### 5. Données affichées et source de vérité

**Cible par Série hors fenêtres de formats (13/10) :** fin automatique seulement en Durée chiffrée ; Suivant pour Répétitions ou toute cible À l’échec. Pas de nominal pour l’échec, même avec bip. Relevé par occurrence/côté : durée de dernière tentative ou répétitions estimées/déclarées ; non bloquant. Voir chapitre 08, Cibles et relevés d’exécution. Aucun nouveau layout de saisie/restitution n’est livré dans cette passe.

Instantané Session au démarrage, occurrences développées, Série/côté/Tour courants, paramètres intrinsèques dont la charge de la série courante selon RM-241, exclusion inconditionnelle des Compte à rebours/Fin propres selon D-214 révisée, résultats et temps moteur ; aucune lecture réactive de la source modifiée.

Plan depuis les cibles/Pauses de chaque Série et l’Ordre des côtés de l’instantané ; R positive remplace seulement la dernière Pause de l’occurrence.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

Snapshot : figer la Récupération propre à chaque Exercice ; produire sa phase uniquement pour R positive. Ordre Exercice → R positive → Point → suite ; substitution terminale D-248 conservée.

#### 6. Classification des valeurs Figma

Noms/durées/compteurs calculés ; valeurs Figma démonstratives. Circuit=groupe, Tour=passage ; cycle visible avec compte propre depuis D-451. Le rendu d’exécution de ce contexte reste à qualifier.

#### 7. Structure de l’écran

Shell Execution ; nom Exercice puis contexte nom Séance + Catégorie, côté distinct ; charge de la série courante selon RM-241 ; chrono/Série/Tour/progression ; commandes ; état média conditionnel.

#### 8. Éléments obligatoires

Phase courante identifiable, temps et progression, commandes Réinitialiser/Pause/Suivant/sons/vocal ; Tour seulement dans contexte de Circuit ; aucune interface de bilatéralité Circuit.

Série n/N et côté séparés ; aucune barre par Série. À suivre : Pause / Pause entre les côtés / Récupération selon la phase.

#### 9. Layout déterministe

Rendu du shell courant et D-197/D-220 ; Série/Tour 24 selonDSF T10 ; écart vertical 24 entre temps total et progression Tours ; dialogues centrés D-228, jamais nouvelles pages numérotées. La charge de la série courante (RM-241) n’a pas encore de référence visuelle Figma : emplacement et traitement à fixer par Figma, aucun emplacement « à côté de la cible » n’est arrêté ; référence visuelle manquante.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Commandes visibles à texte standard ; à texte agrandi scroll accessible sans masquer temps/action ; Safe Areas ; plein écran média suit son contrat et orientation.

#### 11. États de l’écran

Initial ; compte à rebours initial de Séance ; aucune phase Compte à rebours/Fin propre aux Exercices ; Série ; pause inter-Séries ; côté ; récupération ; point d’arrêt ; pause utilisateur ; confirmations ; Fin de séance ; terminé/partiel/interrompu.

#### 12. Contrôles et interactions

Pour une séance libre à plan fini, Démarrer construit le plan ; ordre canonique§4.12. Pause suspend temps actif ; Reprendre relance ; Arrêter seulement depuis Pause avec confirmation. Réinitialiser/Suivant suivent table§4.12, résultat partiel si saut chronométré anticipé. Point d’arrêt attend reprise explicite ; média ne suspend pas moteur.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 13. Gestes

Tap commandes ; confirmation explicite avant action destructive ; gestes média uniquement dans sa zone ; aucun retour vers Exercice précédent au MVP.

#### 14. Validation

Séance contenant≥1Exercice valide ; pas de double démarrage. Points aux positions D-217 seulement. Phases 0 s instantanées. Hors fenêtres et formats à borne ouverte, progression hybride selon la formule de [R-01 — Progression et estimation](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-01--progression-et-estimation), calculée sur toutes les étapes contributives du plan.

#### 15. Brouillon et persistance

Instantané immuable ; résultats/temps checkpointés selon architecture ; Ressenti/Commentaire finalisés après clôture dans CE-UI-08. Réinitialiser conserve temps total déjà exécuté et résultats hors cible.

#### 16. Navigation et conservation d’état

Reprise technique restaure phase/Série/côté/Tour sans relire source ni dupliquer résultat. Retour normal après Synthèse vers Suivi ; contexte occurrence reste associé à l’Exécution.

#### 17. Erreurs et cas limites

Source supprimée après départ sans effet sur instantané ; interruption technique conserve résultats ; attente de point hors durée ; reprise après arrière-plan par horodatage. Gardes 30 min/2 h selon modèle, sans réponse, rester suspendu sans arrêt automatique ([R-03 — Transition, reset et suspension](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-03--transition-reset-et-suspension)).

#### 18. Accessibilité

Annoncer phase, nom et côté (« Côté 1 » / « Côté 2 », RM-243) au démarrage/changement ; commandes nommées selon phase, notamment Réinitialiser la récupération. Focus dans dialogue puis retour ; indicateurs non fondés uniquement sur couleur.

#### 19. Invariants

*Texte identique à celui de la section [« CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-08--composer-une-séance--modifier-une-séance--brouillon-circuit-points-darrêt-et-validation) ; il n’est pas recopié ici.*

Séance libre à compte borné : Circuit unilatéral, Tours 1..99 ; récupération après chaque occurrence y compris dernière et chaque Tour ; point interne répété chaque Tour ; attente hors durée ; pas de mutation de la source ; média indépendant du moteur.

Bip v2 remplace D-302/D-305 sur portée, signaux et symboles ; durées réelles conservées.

#### 20. Recette déterministe

*Texte identique à celui de la section [« CE-T03-10 — Exécution directe — Durée chiffrée unilatérale »](#ce-t03-10--exécution-directe--durée-chiffrée-unilatérale) ; il n’est pas recopié ici.*

Séance avec avant/dans/après Circuit, Tours 1/2, unilatéral/bilatéral, deux modes ; D-214 révisée : absence des phases propres quelle que soit la valeur d’un éventuel ancien champ ; toutes phases 0/>0 ; dernière récupération avant Fin ; points frontières/intérieur ; pause/reset/saut/arrêt confirmés/annulés ; source modifiée pendant run ; reprise ; médias ; vérifier poids [R-01 — Progression et estimation](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-01--progression-et-estimation) et transitions [R-03 — Transition, reset et suspension](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-03--transition-reset-et-suspension) ; aucun résultat de test applicatif n’est revendiqué ici.

Changement de côté Avec dans les deux enchaînements (côté 1 puis côté 2, RM-243), A–F, N1, R0/positif et dernière occurrence/chaque Tour ; jamais cumul PN+R ni récupération ajoutée deux fois.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

### Exécution — séance ou exercice — Objectif

Guider l’utilisateur pendant l’Exécution avec une hiérarchie visuelle adaptée à une lecture rapide et à distance.

Un seul layout standard est utilisé pour les Exercices en Durée, en Répétitions et À l’échec ainsi que pour leur phase de Récupération. Le comportement temporel s’adapte à la phase du Plan d’Exécution sans changer la structure générale de l’écran.

### Exécution — séance ou exercice — Entrée dans l’écran et démarrage

L’écran peut être ouvert :

- depuis la zone `Démarrer` d’une carte de Séance ou le bouton Lecture d’une carte d’Exercice du Catalogue (D-049, RM-162) ;
- depuis l’action `Démarrer` d’une occurrence planifiée, y compris lorsqu’une occurrence future est exécutée en avance.

L’ouverture de l’écran ne démarre pas immédiatement l’Exercice.

Avant le démarrage, l’utilisateur déclenche la Séance depuis la commande centrale.

Avant le démarrage, Retour renvoie dans l’application à l’écran depuis lequel l’Exécution a été lancée. Dans le prototype MVP, toutes les zones du bouton Retour renvoient explicitement au `Catalogue des séances — Séance déployée` (`1992:10014`) ; aucune ne pointe vers l’état vide du Catalogue.

Le Compte à rebours initial est alors exécuté s’il est configuré avec une durée supérieure à zéro, puis le premier Exercice commence.

### Exécution — séance ou exercice — Hiérarchie des informations affichées

L’écran affiche, de haut en bas :

- le nom de la Séance ;
- l’état des sons / annonces vocales ;
- le nom de l’Exercice en cours ;
- le compteur de Série lorsque l’élément exécuté est un Exercice ;
- l’indicateur temporel principal ;
- la Série sous l’indicateur principal, à gauche, et le Tour à droite. À partir de `360` points et avec le texte à `100 %` ou `135 %`, les deux valeurs restent sur une même ligne dans deux zones flexibles symétriques, séparées par un repère central de largeur fixe ;
- une progression discrète du Tour ;
- la zone `À suivre` avec le nom et la durée ou le nombre de reps de l’Exercice suivant ;
- les commandes `Réinitialiser`, `Pause` et `Exercice suivant` ;
- le temps total écoulé et la durée estimée d’exécution de la Séance ; le temps écoulé inclut toutes les phases effectivement exécutées, Compte à rebours initial et Fin de séance compris, mais exclut les Pauses manuelles ; durée exacte sans symbole en mode Durée, estimée ≈ avec cadence et borne omission sans bip à l’Exercice ou en présence de composante inconnue ;
- une barre de progression globale structurée en segments correspondant aux Tours, conformément au prototype Figma. Elle occupe exactement la largeur utile sans débordement. Les segments se répartissent dans cette largeur après déduction des espacements et ne conservent jamais la largeur fixe du gabarit `402`. Le remplissage représente l’avancement dans le Plan d’Exécution complet, Compte à rebours initial et `SESSION_END` compris, selon la pondération définie dans les chapitres 08 et 10 ; il n’est pas le simple rapport `temps écoulé / durée estimée d’exécution`. Il atteint `100 %` uniquement à l’achèvement de `SESSION_END`. Dans T04, les étapes chronométrées sont pondérées par leur durée planifiée ; les Séries Répétitions sans cadence et À l’échec acquièrent leur part avec `Suivant`. Les Séries Répétitions avec bip suivent une progression temporelle continue, plafonnée à la fin nominale sans terminer la Série ; `Suivant` acquiert le reste éventuel. La Pause abandonne la fraction d’intervalle pour la progression et la reprise lance un intervalle complet, sans effacer le temps actif réel. Les Pauses manuelles n’augmentent pas le remplissage.

Le rendu historique d’exécution ne montre pas le Cycle ; adaptation à D-451 à qualifier hors de ce lot de composition. Le nombre total d’étapes et la position sous la forme `x sur y` ne sont pas affichés dans le MVP.

Le moteur d’Exécution peut néanmoins conserver ces informations pour son fonctionnement interne. La charge de la Série courante, lorsqu’elle est active, est aussi affichée (RM-241) ; sa place dans cette hiérarchie relève de Figma, qui ne l’illustre pas encore.

### Exécution — séance ou exercice — Commandes principales

Les trois emplacements de commande restent identiques. Pendant un Exercice, ils affichent :

- `Réinitialiser l’exercice` ;
- `Pause` ;
- `Exercice suivant`.

Pendant la Récupération, la première commande devient `Réinitialiser la récupération`.

Leur position et leur rôle visuel ne changent pas entre Durée et Répétition.

### Exécution — séance ou exercice — Confirmation — Réinitialisation de l’Exercice

Référence Figma : `1992:8224`, `Modal — Réinitialiser l’exercice`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Neutral,Actions=2` (`2590:2926`), instance `2591:3047`. Il mesure `354 × 215`.

#### Objectif

Permettre de recommencer depuis son état initial le périmètre courant (Série courante en unilatéral, bloc du côté courant en bilatéral, phase courante pendant une récupération, D-029) sans revenir en arrière dans la Séance.

#### Ouverture

La modale s’affiche après appui sur `Réinitialiser l’exercice`.

L’Exécution est suspendue pendant l’affichage de la modale.

#### Contenu

**Titre**

> Réinitialiser l’exercice ?

**Message**

> L’exercice en cours recommencera depuis le début. La progression de la séance sera conservée.

**Actions**

- `Annuler`, action neutre grise ;
- `Confirmer`, action primaire bleue.

#### Comportement

Après confirmation :

- l’Exercice / Série courante reste l’Exercice courant ;
- un Exercice chronométré retrouve sa durée initiale ;
- un Exercice en Répétitions ou À l’échec retrouve un chronomètre d’Exercice à `00:00` ;
- la cible de répétitions reste inchangée ;
- le temps global déjà écoulé dans la Séance est conservé ;
- le circuit, le tour courant et le contexte du cycle restent inchangés ;
- l’Exercice redémarre selon son comportement normal.

`Annuler` ferme la modale et reprend l’Exercice à son état précédent.

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`.

### Exécution — séance ou exercice — Confirmation — Passage à l’Exercice suivant

Référence Figma : `1992:8326`, `Modal — Passer à l’exercice suivante`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Neutral,Actions=2` (`2590:2926`), instance `2591:3058`. Il mesure `354 × 215`.

#### Objectif

Confirmer l’interruption anticipée d’un Exercice chronométré.

#### Ouverture

Cette modale s’affiche lorsque l’utilisateur appuie sur `Exercice suivant` avant la fin d’un Exercice chronométré.

Elle ne s’affiche pas pour une Série en mode Répétitions ou à cible À l’échec : dans ce cas, `Suivant` constitue la validation normale de la Série courante.

#### Contenu

**Titre**

> Passer à l’exercice suivante ?

**Message**

> La séance continuera avec l’exercice suivante, elle sera enregistrée comme partiellement exécutée.

**Actions**

- `Annuler`, action neutre grise ;
- `Confirmer`, action primaire bleue.

#### Comportement

Après confirmation :

- l’Exercice chronométré est arrêté avant son terme ;
- sa durée réellement exécutée est conservée ;
- son statut métier devient `Partielle` ;
- la progression est mise à jour ;
- l’Exercice suivant démarre selon les règles normales du Plan d’Exécution.

`Annuler` ferme la modale et reprend l’Exercice en cours.

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`. Le terme visuel `partiellement exécutée` décrit le résultat à l’utilisateur ; le statut métier enregistré reste `Partielle`.

### Exécution — séance ou exercice — Confirmation — Pause / arrêt de l’Exécution

Référence Figma : `1992:8428`, `Modal — Séance en pause`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Danger,Actions=2` (`2590:2960`), instance `2591:3070`. Il mesure `354 × 194`.

#### Objectif

Suspendre temporairement une Exécution puis permettre soit de la reprendre, soit de l’arrêter.

#### Ouverture

La modale est affichée après appui sur `Pause`.

L’Exécution est immédiatement suspendue.

#### Contenu

**Titre**

> Séance en pause

**Message**

> L’exercice « Squats assistés » est suspendue.  
> Le chronomètre reprendra là où il s’est arrêté.

Ce texte décrit le temps actif. En cadence, l’intervalle sonore reprend entier et la progression reste au dernier intervalle complet, selon la spécification Cadence ; la fraction déjà dépensée reste comptée au réel.

Le nom d’Exercice est dynamique ; `Squats assistés` est uniquement la donnée d’illustration de la frame.

**Actions**

- `Reprendre la séance`, action primaire bleue
- `Arrêter la séance`, action destructive rouge

*Texte identique à celui de la section [« Exécution — séance ou exercice — Confirmation — Réinitialisation de l’Exercice »](#exécution--séance-ou-exercice--confirmation--réinitialisation-de-lexercice) ; il n’est pas recopié ici.*

#### Reprendre la séance

Ferme la modale et reprend le plan conservé. En cadence, la fraction d’intervalle abandonnée pour la progression n’est pas reprise : nouvel intervalle complet, temps actif cumulé conservé.

Pour un Exercice chronométré, le compte à rebours reprend.  
Pour un Exercice en Répétitions ou À l’échec, le chronomètre croissant reprend.

#### Arrêter la séance

Met fin à l’Exécution :

- la progression réellement effectuée est enregistrée ;
- le statut de l’Exécution devient `Interrompue` ;
- l’écran `Synthèse de séance` est affiché.

La modale ne peut être fermée que par l’une des deux actions prévues.

### Exécution d'une séance — Informations affichées

Pendant l'Exécution, l'écran affiche principalement :

- le nom de l'Exercice en cours ;
- la Série courante sous la forme `x/y` lorsqu'il s'agit d'un Exercice ;
- la charge de la Série courante lorsqu’elle est active (RM-241), à l’emplacement défini par Figma ;
- le temps de l’Exercice : compte à rebours pour un Exercice chronométré, chronomètre croissant pour un Exercice en Répétitions ou À l’échec ;
- la Série et le Tour en cours ; le rendu du cycle en exécution reste à qualifier pour D-451 ;
- l'Exercice suivant et sa durée lorsqu'elle est connue ;
- les commandes Réinitialiser, Pause et Exercice suivant ;
- le temps total écoulé / durée estimée d’exécution et sa barre de progression.

La notion d'« étape » n'est pas affichée comme indicateur de progression dans le MVP.

### Exécution d'une séance — Éléments affichés

| Élément affiché | Type | Visible | Obligatoire | Valeur / comportement | Source | Action | Remarques |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| Titre de la séance | Texte | Toujours | Oui | Nom de la séance | Séance | Aucune | En-tête |
| Nom de l’Exercice courant | Texte | Toujours | Oui | Exercice courant | Plan d’Exécution | Aucune | |
| Série | Texte | Exercice | Non | `x/y` | Plan d’Exécution | Aucune | Paramètre propre à l’Exercice |
| Charge | Texte | Série à charge active | Non | Charge de la Série courante (RM-241) | Instantané | Aucune | Emplacement selon Figma, non encore illustré |
| Temps de l’Exercice | Minuteur | Toujours | Oui | Compte à rebours si chronométrée ; chronomètre croissant si Répétition | Exécution | Aucune | |
| Cercle du minuteur | Indicateur | Toujours | Oui | Progression temporelle | Exécution | Aucune | Répétitions sans cadence/À l’échec : rotation minute ; cadence : progression temporelle, voir spécification Cadence |
| Série / Tour | Texte | Toujours | Oui | Série à gauche, Tour à droite ; aucun Cycle affiché | Plan d’Exécution | Aucune | |
| À suivre | Texte | Sauf dernier Exercice | Non | Nom + durée/reps de l’Exercice suivant | Plan d’Exécution | Aucune | |
| Réinitialiser | Bouton | Pendant Exécution | Oui | Actif | Statique | Ouvrir confirmation | Réinitialise l’Exercice courant |
| Pause | Bouton | Pendant Exécution | Oui | Actif | Statique | Suspendre | Suspend aussi le chrono croissant en Répétitions ou À l’échec |
| Suivant | Bouton | Pendant Exécution | Oui | Actif | Statique | Terminer la Série ou passer à la suite | Fin normale en Répétitions/À l’échec ; confirmation avant terme pour un Exercice chronométré |
| Temps total | Texte + barre | Toujours | Oui | Temps écoulé / estimé | Exécution | Aucune | |
| Bips / annonces | Icônes / états | Toujours | Oui | Selon Préférences | Préférences | Activer / désactiver | |

### Exécution d'une séance — Règles fonctionnelles

| Règle | Description |
| --- | --- |
| Ouverture | Ouvrir l’écran d’Exécution ne démarre pas automatiquement le premier Exercice. |
| Exercice chronométré | Compte à rebours. `Exercice suivant` avant zéro demande confirmation et enregistre l’Exercice comme `Partielle`. |
| Exercice en Répétitions ou À l’échec | Chronomètre croissant ; sans cadence/À l’échec : rotation et bip minute. Avec cadence : intervalles sans signal nominal final, progression temporelle des seules cibles chiffrées sans fin automatique ; Pause/Reprise sur intervalle complet. Suivant termine normalement dans les deux cas. |
| Réinitialisation | Demande confirmation et remet à son état initial le périmètre courant (Série courante en unilatéral, bloc du côté courant en bilatéral, phase courante pendant une récupération, D-029) sans revenir à un Exercice antérieur. |
| Pause / arrêt | `Pause` ouvre la modale permettant `Reprendre la séance` ou `Arrêter la séance`. Aucun bouton Arrêter direct n’est présent sur l’écran. |
| Présentation | Le nouveau layout regroupe chrono circulaire, côté courant, cible `Sur`, Série/Tour, progression segmentée et bloc `Temps écoulé / À suivre`. Le contenu d’Exécution utilise Roboto Condensed ; le titre supérieur de Séance et les dialogues utilisent Inter. La charge de la Série courante n’a pas d’emplacement arrêté dans ce layout, notamment pas « à côté de la cible » (RM-241). |
| Navigation | L’utilisateur ne revient pas à un Exercice déjà exécutée. |
| Étapes | Aucun compteur d’« étapes » n’est affiché dans le MVP. |

## Médias pendant l’Exécution

### CE-MEDIA-EXEC-01 — Exécution — faces Information et Média

#### 1. Identification

Variantes intégrées de l’Exécution SESSION ou ACTIVITY : 5021:5994,5581:4257,4997:6113,5588:4363. Source de comportement : CONCEPTION-EXECUTION-MEDIA ; aucune acquisition média.

Règles applicables : RM-058, RM-099 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Consulter les médias déjà associés à l’Exercice courant pendant que le moteur poursuit normalement l’Exécution.

#### 3. Contexte d’entrée

Exercice avec au moins un média, depuis le shell direct ou Séance ; face Information par défaut au début d’une nouvelle Exécution.

#### 4. Contexte de sortie / destinations

Bascule → autre face ; tap média → CE-MEDIA-EXEC-02 ; changement d’Exercice → fermeture du média précédent et nouvel état moteur ; les commandes d’Exécution restent sous le contrat moteur propriétaire.

#### 5. Données affichées et source de vérité

Collection ordonnée de médias de l’Exercice de l’instantané ; index courant, face et état du lecteur transitoires. Chrono/Série/côté/Tour proviennent exclusivement du moteur ; Tour seulement pour SESSION.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Nom et paramètres dynamiques ; photos/vidéos exemples non codées ; labels Information/Média et commandes statiques ; aucune valeur de Série/Tour de démonstration n’initialise le moteur.

#### 7. Structure de l’écran

Même zone de carte pour Information et Média, retournement sans déplacement du shell ; bouton dédié ; un média ; pagination ; Lecture central avant vidéo ; commandes d’Exécution accessibles.

#### 8. Éléments obligatoires

Bascule seulement si média présent ; pagination ; image/poster intégral avec ratio conservé ; Lecture central disparaît pendant lecture ; aucun autoplay ; catégorie et côté restent des informations distinctes du nom.

#### 9. Layout déterministe

Bascule circulaire 32, fond#FDFDFE, liseré blanc 1, ombreDSF T10 ; icône flip horizontale noire. Les deux emplacements graphiques haut/bas ne créent pas deux effets métier différents. Série/Tour cible 24 selonDSF T10 ; 17 sur 4997:6113 reste écart visuel. Tour masqué en ACTIVITY.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Même zone sûre que shell Exécution ; média non recadré, marges possibles ; texte agrandi sans masquer les commandes ; réduction des animations supprime la transformation 3D et utilise un changement discret sans mouvement spatial.

#### 11. États de l’écran

Sans média ; Information ; image ; vidéo poster/lecture/pause ; premier/dernier média ; chargement ; média indisponible ; Exercice terminé.

#### 12. Contrôles et interactions

Bouton retourne la face ; retour Information met vidéo en pause. Swipe change exactement un média et met la précédente vidéo en pause. Tap média ouvre plein écran ; Lecture lance explicitement vidéo. Son vidéo actif par défaut, abaissé pendant annonce KODJO puis restauré.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 13. Gestes

Swipe horizontal simple pour galerie, jamais pour changer de face ; galerie non circulaire avec résistance aux bornes ; tap dédié pour bascule/lecture/plein écran ; actions au relâchement D-237.

#### 14. Validation

Vérifier existence média et index dans bornes avant affichage ; absence média masque bascule ; aucune consultation ne valide une Série ni ne suspend le moteur.

#### 15. Brouillon et persistance

Face/index mémorisés par Exercice pendant l’Exécution courante seulement. Retour immédiat à Média permet reprise explicite de vidéo ; retour après avoir quitté l’Exercice restaure face/index mais jamais autoplay. Aucune préférence durable ni modification d’instantané.

#### 16. Navigation et conservation d’état

Plein écran revient sur même face/index ; au changement d’Exercice fermer lecteur précédent et plein écran, puis transition normale. Nouvelle Exécution réinitialise face Information.

#### 17. Erreurs et cas limites

Erreur locale visible à la place du média ; conserver face et accès aux autres médias, moteur continue. Ne pas masquer silencieusement le média en erreur. Une collection vide après chargement ne crée pas de commande fantôme.

#### 18. Accessibilité

Labels Changer de face, Lire la vidéo et Agrandir le média ; pagination annoncée ; alternatives accessibles précédent/suivant au geste ; ordre de focus stable. Annonces KODJO intelligibles via ducking ; aucun flash/autoplay.

#### 19. Invariants

Un média à la fois, ordre source, aucun bouclage ; moteur indépendant ; pas d’import ; pas de Tour en direct ; vidéo ne redémarre jamais sans action utilisateur.

Cadence sonore et progression continuent lors du changement de face ; symbole prévisionnel ≈ sans effet sur la durée réelle.

#### 20. Recette déterministe

Tester 0/1/N médias, mélange image/vidéo, premier/dernier, un swipe=un média, retour Information pendant lecture, retour même Exercice et autre Tour, nouveau run, erreur média, ducking, plein écran, fin naturelle et saut d’Exercice. Vérifier réduction des animations et contrôles accessibles ; essais interactifs nécessaires.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

### CE-MEDIA-EXEC-02 — Exécution — média plein écran

#### 1. Identification

Frame 5009:6069 Exécution d’un exercice — Média plein écran ; variante de CE-MEDIA-EXEC-01. Le nom historique de test Séance ne borne pas l’origine de données.

Règles applicables : RM-058 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Agrandir l’image/vidéo sans perdre le suivi et les commandes du moteur.

#### 3. Contexte d’entrée

Tap sur le média courant en face Média, avec origine SESSION/ACTIVITY, index et état de lecture conservés.

#### 4. Contexte de sortie / destinations

Fermer revient à face Média au même index ; changement d’Exercice ferme automatiquement le plein écran ; sortie d’Exécution selon le contrat moteur.

#### 5. Données affichées et source de vérité

Même média et même moteur que la face compacte ; couche flottante alimentée par nom, côté, chrono, Série et Tour conditionnel ; aucune copie autonome du temps.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Nom, chrono et index dynamiques ; contenu vidéo/image démonstratif ; labels Fermer/Lecture/Pause statiques. Un Tour visible dans la capture n’active pas cette donnée en ACTIVITY.

#### 7. Structure de l’écran

Média plein écran ratio conservé ; cadre flottant d’Exécution ; couche lecteur vidéo séparée. Le moteur et le lecteur ont des commandes différentes.

#### 8. Éléments obligatoires

Cadre : nom, côté si applicable, chrono, Série, Tour seulement SESSION, commandes principales d’Exécution et son/vocal. Lecteur vidéo : Lecture/Pause, progression vidéo, Fermer ; image : Fermer et cadre moteur.

#### 9. Layout déterministe

Reprendre la composition de 5009:6069 sans rogner le média ; marges admises ; couche flottante lisible au-dessus, Safe Areas respectées. Les commandes lecteur ne remplacent pas Pause/Réinitialiser/Suivant du moteur.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Orientation suit l’appareil, paysage autorisé sans rotation forcée ; recomposer les couches sans les étirer. À texte agrandi, commandes restent atteignables ; restaurer disposition compacte à la fermeture.

#### 11. États de l’écran

Image ; vidéo poster/en lecture/en pause ; portrait/paysage ; erreur média ; moteur actif/suspendu ; transition de phase/Exercice.

#### 12. Contrôles et interactions

Fermer ne modifie ni index ni temps moteur. Lecture/Pause et barre vidéo pilotent uniquement le lecteur ; commandes flottantes pilotent le moteur selon§4.12. Son vidéo actif par défaut, ducking pendant les annonces.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

#### 13. Gestes

Tap sur commandes ; interaction barre vidéo distincte de progression moteur. Ne pas déduire une galerie plein écran non spécifiée du swipe compact ; fermer puis naviguer dans la galerie compacte.

#### 14. Validation

Aucune modification du plan ou des résultats par ouverture/rotation/fermeture ; valider média existant ; empêcher l’action derrière les couches du plein écran.

#### 15. Brouillon et persistance

État lecteur et index transitoires partagés avec la face compacte ; aucun enregistrement durable. Les résultats du moteur suivent leur propre persistance.

#### 16. Navigation et conservation d’état

Retour au déclencheur/face même média ; fin d’Exercice ferme plein écran et média précédent même pendant vidéo ou rotation ; début d’un nouveau run réinitialise l’état transitoire.

#### 17. Erreurs et cas limites

Média indisponible : erreur locale et fermeture disponible ; moteur continue. La transition moteur garde priorité sur le maintien d’une vidéo terminée ; ne pas bloquer la fin de Séance.

#### 18. Accessibilité

Distinguer vocalement Pause vidéo et Pause exécution ; nommer Fermer le plein écran ; focus contenu dans la couche active et restauré à la sortie ; contraste du cadre et commandes vérifiable en portrait/paysage.

#### 19. Invariants

Pas de suspension implicite, pas d’autoplay, ratio conservé, un seul état moteur ; Tour conditionnel SESSION ; lecteur et commandes Exécution séparés.

Consulter le média ne crée ni Pause utilisateur ni cadence implicite ; comportements D-302 conservés.

#### 20. Recette déterministe

Image/vidéo, portrait/paysage, fermer/revenir, pause vidéo sans pause moteur, pause moteur distincte, ducking, erreur, fin de Série puis changement d’Exercice, arrêt confirmé ; vérifier focus/texte agrandi et absence de Tour ACTIVITY.

*Texte identique à celui de la section [« CE-T03-09 — Lancement direct et préparation fixe 5 s »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-09--lancement-direct-et-préparation-fixe-5-s) ; il n’est pas recopié ici.*

## Planification

### CE-UI-02 — Calendrier — Jour compact

#### 1. Identification

Calendrier Jour ; frames 1992:5510,1992:5602,1992:5697,1992:5794,2059:267 ; composants 6374:12704/12705.

Règles applicables : RM-045, RM-049, RM-072, RM-095, RM-112 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Présenter les occurrences sur la grille horaire avec la distinction Séance/Exercice.

#### 3. Contexte d’entrée

Onglet Calendrier (Jour par défaut), changement de jour, retour de planification.

#### 4. Contexte de sortie / destinations

Surface occurrence → CE-UI-05 en modification ; Lecture → moteur SESSION/ACTIVITY ; appui long sur créneau → sélection de plage puis Planifier avec date/heure de début préremplies ; source par CE-UI-04. Pas d’actions glissées en Jour.

#### 5. Données affichées et source de vérité

Occurrences futures Routine SESSION/ACTIVITY ; titre, heure, durée et couleur de l’événement. Nature issue du type de source.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Noms, dates, durées et couleurs d’événement sont des données ; les exemples Figma ne deviennent pas des constantes ni des règles de déduction.

#### 7. Structure de l’écran

Navigation de date et grille horaire ; cartes à droite de la colonne des heures ; navigation basse.

#### 8. Éléments obligatoires

Barre couleur 4 ; nature 26 ; titre 13 gras ; heure/durée 11 gris ; Lecture 26. Aucun Déployer.

#### 9. Layout déterministe


Composants actifs et propriété Durée : [DSF cartes du 07/10](../DSF-CARTES-DUREE-2026-10-07.md). La suppression du cadre de durée Catalogue ne change pas le contrat de cette variante : sélecteurs sans durée, Suivi avec durée réelle, Calendrier avec données de planification. Ne pas injecter une durée à cause du défauttrue de la propriété Figma.

Référence 402 : x80, largeur 298 ; séance 46 de haut, exercice 48. Hauteur d’instance adaptée à l’événement. Exemple heure/durée : 08 h · 13 min.

*Texte identique à celui de la section [« CE-T03-15 — Suivi général — Exécution ACTIVITY »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-15--suivi-général--exécution-activity) ; il n’est pas recopié ici.*

#### 10. Responsive, Safe Areas, texte, scroll et clavier

*Texte identique à celui de la section [« CE-UI-01 — Profil — préférence silhouette »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-ui-01--profil--préférence-silhouette) ; il n’est pas recopié ici.*

#### 11. États de l’écran

Jour standard ; appui long ; créneau ; après planification ; jour suivant ; vide 2128:86.

#### 12. Contrôles et interactions

Glissement gauche/droit ou chevrons change de jour ; Aujourd’hui revient à date locale ; toucher occurrence ouvre sa Routine ; Lecture lance sa source. Appui long crée une sélection transitoire, jamais une Routine avant Enregistrer. La plage n’impose pas une durée à l’Exercice/Séance.

#### 13. Gestes

Scroll vertical de grille ; navigation horizontale de jour ; appui long créneau distinct du tap occurrence. Pas de déploiement ni de swipe destructif.

#### 14. Validation

Aucune mutation par changement de date/vue ; valider la planification seulement dans CE-UI-05. Les périodes passées sans Exécution ne sont pas ajoutées au Suivi.

#### 15. Brouillon et persistance

Jour visible, position de grille et plage sélectionnée sont des états UI ; brouillon Routine appartient au formulaire. Annuler Planifier ne crée aucune occurrence ; Enregistrer actualise la grille.

#### 16. Navigation et conservation d’état

Conserver date/vue/position pendant planification ; au retour réussi montrer l’occurrence concernée. Changer Jour/Semaine/Mois conserve la date de référence. Aucune persistance durable de préférence de vue n’est ajoutée.

#### 17. Erreurs et cas limites

Jour vide sans carte fictive ; source supprimée : rafraîchir et signaler indisponibilité. Chevauchement d’occurrences : ne jamais masquer une action ; géométrie exacte non représentée, réserve V-05. Texte long tronqué avec nom complet accessible.

#### 18. Accessibilité

Annoncer type, nom, heure, durée et action Lecture. La taille visible 26 ne remplace pas le minimum tactile 44.

#### 19. Invariants

Exception explicite à largeur 354/titre 15/suppression de barre des cartes standard. Aujourd’hui/Planifier 32 restent l’exception acceptée à revoir aprèsT04.

#### 20. Recette déterministe

Jour vide/1/N, deux types de source, tap surface distinct de Lecture, glissements et chevrons, Aujourd’hui, sélection plage→date/heure préremplies, annulation et enregistrement, retour même date/scroll. Vérifier dimensions compactes, aucun Déployer, aucune action glissée ; chevauchements V-05 à qualifier.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

### CE-UI-03 — Calendrier — Semaine et structure Mois

#### 1. Identification

Calendrier ; frames 1992:5101,2252:86,1992:6389,1992:5962,2094:86,2074:86 ; Mois 1992:5237 ; suppressions 1992:5365/6102.

Règles applicables : RM-045, RM-046, RM-050, RM-072, RM-112, RM-123 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Présenter les occurrences chronologiques de Semaine ; conserver la grille mensuelle existante.

#### 3. Contexte d’entrée

Segment Semaine/Mois ; retour de planification/suppression.

#### 4. Contexte de sortie / destinations

Surface occurrence → CE-UI-05 modification de Routine ; Lecture → moteur selon origine ; Dupliquer → brouillon Routine copié ; Supprimer → confirmation unique/périodique ; choix source CE-UI-04.

#### 5. Données affichées et source de vérité

Occurrence et type SESSION/ACTIVITY, heure, durée et classement de la source ; jamais déduits du titre.

Sources SESSION : durées d’occurrence et total de Séance sans double ajout de R ; ACTIVITY : durée intrinsèque ; chapitre 08, paramètres d’exercice.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

*Texte identique à celui de la section [« CE-UI-02 — Calendrier — Jour compact »](#ce-ui-02--calendrier--jour-compact) ; il n’est pas recopié ici.*

#### 7. Structure de l’écran

Semaine : segmenté, barre 7 jours, sections chronologiques, navigation fixe. Mois : grille 7colonnes, navigation mensuelle, jour sélectionné et marqueurs d’occurrences ; ne pas appliquer les cartes de Semaine à chaque cellule du Mois.

#### 8. Éléments obligatoires

Semaine : nature 26, badge heure 08:00, classement puis durée avec sablier ; statut Suivi non ajouté. Mois : grille 7colonnes conservée.

#### 9. Layout déterministe


Composants actifs et propriété Durée : [DSF cartes du 07/10](../DSF-CARTES-DUREE-2026-10-07.md). La suppression du cadre de durée Catalogue ne change pas le contrat de cette variante : sélecteurs sans durée, Suivi avec durée réelle, Calendrier avec données de planification. Ne pas injecter une durée à cause du défauttrue de la propriété Figma.

Carte 354×95,5 repliée ; séance déployée 254,5. Segmenté 354/padding 4/gaps 4/options 112,67. Aucune barre de carte Semaine.

*Texte identique à celui de la section [« CE-T03-15 — Suivi général — Exécution ACTIVITY »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-15--suivi-général--exécution-activity) ; il n’est pas recopié ici.*

#### 10. Responsive, Safe Areas, texte, scroll et clavier

*Texte identique à celui de la section [« CE-UI-01 — Profil — préférence silhouette »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-ui-01--profil--préférence-silhouette) ; il n’est pas recopié ici.*

#### 11. États de l’écran

Repliée, séance déployée, jour sélectionné, actions glissées, après suppression ; Mois ; vide.

#### 12. Contrôles et interactions

Semaine : sélectionner un jour place sa section en tête ; scroll synchronise jour. Déployer sur une Séance uniquement révèle détails/récurrence ; aucune carte d’Exercice ne se déploie. Lecture distincte. Glisser expose Dupliquer/Supprimer seulement. Dupliquer copie source+paramètres dans brouillon sans persister. Mois : navigation change mois, sélection change date de référence ; passage Jour/Semaine utilise cette date.

#### 13. Gestes

Swipe contextuel en Semaine selon§4.7 ; Mois : tap jour/chevrons, pas de déploiement de carte mensuelle inventé ; D-237 pour les appuis.

#### 14. Validation

Unique : Annuler/Confirmer suppression. Périodique : Seulement cette occurrence / Toutes les occurrences à venir / Annuler. La seconde action porte les occurrences futures de la Routine, pas d’autres Routines de la même source. Historique et source conservés.

#### 15. Brouillon et persistance

Recalcul des occurrences après validation de Routine. Suppression unitaire doit rester exclue après relance et retirer sa notification ; le modèle/API doit persister l’exclusion par Routine et date/heure d’origine ([R-04 — Suppression d’une occurrence périodique](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-04--suppression-dune-occurrence-périodique)), pas de simulation d’une suppression seulement visuelle. Duplication reste brouillon jusqu’à Enregistrer.

#### 16. Navigation et conservation d’état

Après confirmation, conserver date/vue et actualiser liste/marqueurs. Après annulation, même sélection et même état. Changement de vue conserve date ; scroll Semaine synchronise la barre 7 jours.

#### 17. Erreurs et cas limites

Semaine/mois vide, occurrence déjà retirée, source disparue, erreur de suppression : informer sans mutation partielle. Ne pas confondre média absent avec erreur métier. Aucune photo sur les cartes du Calendrier, quel que soit le type (D-260).

#### 18. Accessibilité

Heure/type/nom annoncés ; aucune vignette dans le Calendrier ; cibles 44 hors exception explicite Aujourd’hui/Planifier.

#### 19. Invariants

Récurrence seulement déployée en Semaine ; ne pas appliquer les cartes compactes Jour à Semaine ou Mois.

#### 20. Recette déterministe

Semaine vide/N, deux origines, déploiement/récurrence, synchronisation jour/scroll, modification, duplication annulée/enregistrée. Suppression unique et deux choix périodiques confirmés/annulés, notifications/historique. Mois : sept colonnes, sélection, navigation de mois, retour Jour/Semaine même date, marqueurs actualisés. La recette de persistance unitaire est obligatoire ; cette documentation ne prétend pas l’avoir exécutée.

*Texte identique à celui de la section [« CE-T03-01 — Catalogue des séances — état T03 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-01--catalogue-des-séances--état-t03) ; il n’est pas recopié ici.*

### CE-UI-04 — Calendrier et planification — choisir des contenus

#### 1. Identification

CE-UI-04 ; sélection de contenus pour planification. Frames MVP 7599:14197 et 7594:34809 ; homologues communautaires 7599:14753 et 7600:14108. Un seul composant de choix avec des états de décompte différents.

Règles applicables : RM-206, RM-208, RM-222, RM-223 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Choisir une ou plusieurs Séances et/ou Exercices persistants pour un même créneau ; aucune entité Parcours créée.

#### 3. Contexte d’entrée

Calendrier → Planifier ; formulaire CE-UI-05 → Changer ; sélection initiale éventuellement préremplie depuis une carte Catalogue.

#### 4. Contexte de sortie / destinations

La coche de l’en-tête valide la sélection dans le brouillon et revient au formulaire. Fermer sans valider conserve la liste antérieure. Le toucher d’une carte ne ferme pas la modale.

#### 5. Données affichées et source de vérité

Sources actives SESSION/ACTIVITY appartenant à l’utilisateur ; collection d’identifiants retenus. Aucun contenu de démonstration injecté en liste vide. Conserver les règles existantes de classement et les paramètres de carte sans durée/Lecture/Déployer.

#### 6. Classification des valeurs Figma

Choisir des séances/Choisir des exercices dépendent du segment actif ; décompte et contenus dynamiques. Les noms et coches des exemples ne sont pas des règles de sélection.

#### 7. Structure de l’écran

En-tête avec fermeture et coche de validation → segmenté Exercices/Séances → liste défilante avec cases ; aucun bouton de validation en bas (D-499, 06/11/2026). Pas de segment Parcours.

#### 8. Éléments obligatoires

Cases à cocher même pour un seul élément. La coche valide les éléments sélectionnés (D-499, 06/11/2026). Le titre de la modale suit le segment actif.

#### 9. Layout déterministe


Marges 24 et largeur 354 sur 402 ; validation par la coche dans l’en-tête, sans bouton inférieur (D-499, 06/11/2026). Cartes de choix issues du DSF courant, sans durée ni Lecture/Déployer. Cases à droite ; pas de radios. États de sélection du contrôle de planification : retenu #5F60EE/texte blanc Semi Bold ; non retenu #F9FAFC/texte #141414 Regular.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Référence 402×874, adaptations 360/440 et Safe Areas conservées. Texte agrandi sans réduction de police ; liste/formulaire défilant ; coche de validation dans l’en-tête, sans CTA dans le pied (D-499, 06/11/2026). Les coordonnées Figma ne sont pas des constantes absolues sur tous les appareils.

#### 11. États de l’écran

Zéro, un, plusieurs éléments retenus ; liste vide/longue ; segment Séances/Exercices ; retour au brouillon ; source devenue indisponible. À zéro, ne pas créer une Routine vide ; coche inactive tant que la sélection ne permet pas de valider (D-499).

#### 12. Contrôles et interactions

Toucher carte/case sélectionne ou désélectionne sans fermeture. Basculer le segment change les choix affichés sans valider ; la sélection doit pouvoir contenir les deux types. La coche valide l’ensemble. Aucune copie SessionActivity.

#### 13. Gestes

Tap et scroll ; animation Discret/action au relâchement D-237. Pas d’action d’exécution dans la modale.

#### 14. Validation

Au moins un contenu actif et disponible à validation ; recontrôler les références à Enregistrer. L’ordre initial de la sélection mixte est à préciser ; le formulaire permet ensuite de réordonner. Ne pas importer implicitement l’ordre propre à la Composition.

#### 15. Brouillon et persistance

Sélection locale puis transfert au brouillon ; aucune écriture Routine avant Enregistrer. Annuler restaure la sélection d’entrée.

#### 16. Navigation et conservation d’état

Retour CE-UI-05 sans perdre dates, répétition, rappel et Programme déjà saisis. Le titre final est calculé depuis les types et le nombre, non le dernier segment visité.

#### 17. Erreurs et cas limites

Source archivée/supprimée : signaler et revalider sans référence fantôme. Liste mixte sans photo pour tous ; Séance jamais de photo. Ne pas activer des objets autonomes Parcours.

#### 18. Accessibilité

Rôle checkbox, nom/type et état coché annoncés ; texte complet accessible ; cibles minimales communes conservées et dimensions spécifiques de 48 points maintenues. Focus modal et coche de validation accessibles.

#### 19. Invariants

Même sélection pour 1 ou N ; le nombre ne change pas le mécanisme de validation. Aucun troisième type autonome ; aucune persistance au toucher.

#### 20. Recette déterministe

Tester 0/1/2, mêmes types et mixte, bascule de segment sans perte, cocher/décocher, fermer/valider, source disparue, longues listes, libellés singulier/pluriel, absence de radio et de fermeture automatique. Vérifier titre suivant pour 0/1/N.

### CE-UI-05 — Planification — formulaire et états de paramètres

#### 1. Identification

CE-UI-05 ; formulaire de Routine à un ou plusieurs contenus. Frames 1992:6838/6622/7187/7369/7537/7716 et 7594:34531 ; fréquence CE-UI-11 ; sélection CE-UI-04.

Règles applicables : RM-043, RM-044, RM-047, RM-052, RM-053, RM-054a, RM-223 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Créer/modifier un créneau, sa liste ordonnée, sa récurrence, son rappel et son rattachement facultatif à un Programme.

#### 3. Contexte d’entrée

Calendrier, action Planifier du Catalogue avec contenu prérempli, modification ou duplication de Routine.

#### 4. Contexte de sortie / destinations

Enregistrer réussi → appelant actualisé ; abandon → appelant inchangé ; Changer → CE-UI-04 ; fréquence d’une ligne → CE-UI-11. Les destinations Programme non représentées ne sont pas inventées.

#### 5. Données affichées et source de vérité

Liste ordonnée de références, motifs par contenu, début/heure, répétition/unité/multiplicateur/borne, rappel, Programme. Récapitulatif dérivé de ces paramètres. Valeurs historiques non réécrites.

#### 6. Classification des valeurs Figma

Libellés de structure statiques ; titre dépend du nombre/type ; noms, dates, montants et durées illustratifs dynamiques. Figma ne fournit aucune règle de calcul.

#### 7. Structure de l’écran

Bloc sans titre : Programme puis Début le → Répétition → lignes de contenus si N ≥ 2, sans titre → Rappel → zone protégée du récapitulatif en bas. Enregistrer est porté par la coche de l’en-tête (D-499). En-tête contextuel : Planifier, Planifier une séance, Planifier un exercice ou Planifier un parcours.

#### 8. Éléments obligatoires

Programme : Aucun par défaut, facultatif. Une date et une heure. Interrupteurs Répétition/Rappel. Répétition sur Oui : Jour/Semaine/Mois, multiplicateur, borne jusqu’au/pendant ; jours de semaine pour Semaine. Rappel sur Oui : 5 min/15 min/30 min/1 h/Autre. Poignées 12×18 et fréquence générique pour chaque ligne à N ≥ 2.

#### 9. Layout déterministe

Shell ModalFullscreen ; surface blanche de y 36 au bas y 874 sur référence 402×874, coins supérieurs carrés. Appliquer le DSF général pour les blocs gris, rayon 12, sans trait et espacements. Préfixe de récurrence au-dessus de la ligne porteuse ; titres Semi Bold 16, valeurs 16, libellés Medium 14, liaisons Medium 12. Récapitulatif en bas de l’écran, dans la zone protégée libérée par le bouton ; hauteur adaptée au texte, dégradé de 40 px au-dessus et fond opaque jusqu’au bas (D-499, 06/11/2026). Le formulaire défile sous cette zone.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Référence 402×874, adaptations 360/440 et Safe Areas conservées. Texte agrandi sans réduction de police ; liste/formulaire défilant ; coche de validation dans l’en-tête, sans CTA dans le pied (D-499, 06/11/2026). Les coordonnées Figma ne sont pas des constantes absolues sur tous les appareils. Le récapitulatif en bas et la coche d’en-tête restent visibles, sans chevauchement. Le contenu peut dépasser la hauteur du formulaire ; ne pas imposer un plafond arbitraire.

#### 11. États de l’écran

Sans contenu/un/multiple ; Répétition sur Non (section repliée) / Oui ; Jour/Semaine/Mois ; borne date/durée ; Rappel sur Non / Oui/Autre ; Programme : Aucun/choisi ; date/heure/stepper ouverts ; erreur/enregistrement. Les états encore non dessinés restent identifiés comme tels.

#### 12. Contrôles et interactions

Interrupteur Répétition sur Non replie et retire toute récurrence du résumé. Activer expose les réglages ; chevron gère le repli sans être un nouvel état d’activation. Réordonner les contenus par poignée. Toucher fréquence ouvre CE-UI-11. Modifier une valeur actualise le brouillon et le résumé. Première activation rappel demande la permission ; refus le désactive et informe.

#### 13. Gestes

Tap, scroll, poignée de réordonnancement, steppers et sélecteurs dédiés ; D-237 conservée. La bascule jusqu’au/pendant nécessite une conversion non encore spécifiée ; ne pas en inventer une.

#### 14. Validation

Contenus disponibles, date/heure valides, bornes cohérentes avec Programme. Semaine : multiplicateur 1..12, au moins un jour, bornes inclusives. Rappel personnalisé positif, maximum 24 h conservé. Bornes Jour/Mois et conversion ouvertes. Pas de sauvegarde avec motif incohérent ; interaction de sélection de x ouverte.

#### 15. Brouillon et persistance

Tout reste en brouillon jusqu’à Enregistrer ; enregistrer la Routine et ses entrées de façon cohérente, sans Routine partielle ; double soumission empêchée. Une phrase de récapitulatif ne devient pas une donnée métier stockée.

#### 16. Navigation et conservation d’état

Conserver les réglages au retour de sélection/fréquence/date/rappel. Annuler restaure l’état antérieur du sélecteur. Succès restitue vue/date du Calendrier ou filtre/défilement du Catalogue.

#### 17. Erreurs et cas limites

Sources supprimées, fenêtre du Programme incompatible, dates inversées, motif incomplet, permission refusée, persistance échouée : ne pas prétendre au succès. Traitement d’archivage d’un seul contenu et statut multi-contenus à compléter. PROG2/3 ne constituent pas les parcours finalisés.

#### 18. Accessibilité

Interrupteurs annoncés avec leur état ; unité et sélection annoncées ; focus modal, pastilles/jours nommés ; cible Disclosure 48 × 48 distincte du cadre de 28 points. Texte agrandi, récapitulatif intégral, réduction des animations.

#### 19. Invariants

Le créneau produit les occurrences, les contenus filtrent. Parcours n’est pas un objet. Aucune unité Heure ; aucune création persistante à l’ouverture ; aucune modification de l’échu.

#### 20. Recette déterministe

Tester contenu unique Séance/Exercice et liste mixte, ordre, suppression du titre des lignes, masquage complet à N = 1, répétition désactivée sans récurrence dans résumé, rappel oui/non, dates invalides, permission refusée, défilement long/résumé protégé, texte agrandi. Scénarios Mois, conversion et x marqués en attente des règles manquantes ; pas de PASS inventé.

### CE-UI-11 — Planification — fréquence d’un contenu

#### 1. Identification

CE-UI-11 — Planification — fréquence d’un contenu. Frame MVP 7594:34653, communautaire 7567:13761. Feuille au-dessus de CE-UI-05.

Règles applicables : RM-043 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Définir combien et quelles occurrences du créneau retient le contenu ciblé.

#### 3. Contexte d’entrée

Toucher la fréquence générique d’une ligne de contenu dans CE-UI-05.

#### 4. Contexte de sortie / destinations

Valider → brouillon de CE-UI-05 ; fermeture/annulation → fréquence antérieure conservée. Le parent reste inactif sous la feuille.

#### 5. Données affichées et source de vérité

Contenu ciblé, entiers x/n, motif des positions 1..n ; aucune unité de temps dans le motif.

#### 6. Classification des valeurs Figma

Fréquence et fois sur sont structurels ; la coche porte la validation ; nom, x/n et pastilles sont dynamiques. Le contenu de démonstration de la feuille ne détermine pas l’identité métier ciblée.

#### 7. Structure de l’écran

En-tête Fréquence avec croix et coche, puis nom → stepper x, liaison « fois sur », stepper n → n pastilles numérotées (D-499).

#### 8. Éléments obligatoires

Deux steppers, n pastilles, état gris/sélectionné, validation. Pas de texte explicatif supplémentaire ; libellés de groupe figurant dans Figma conservés. Pas de variante 2n avec séparateur.

#### 9. Layout déterministe

Feuille blanche, voile commun 34 %. Respecter les positions et styles de la frame de référence sans redessin. Retenu #5F60EE, texte blanc Semi Bold ; non retenu #F9FAFC, texte #141414 Regular. Liaison « fois sur » plus grande que les libellés voisins. Composants de stepper et cibles communes conservés.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Référence 402×874, adaptations 360/440 et Safe Areas conservées. Texte agrandi sans réduction de police ; liste/formulaire défilant ; coche de validation dans l’en-tête, sans CTA dans le pied (D-499, 06/11/2026). Les coordonnées Figma ne sont pas des constantes absolues sur tous les appareils. Grand n : comportement de retour à la ligne/scroll et borne maximale à spécifier ; ne pas tronquer des pastilles.

#### 11. États de l’écran

À chaque fois ; motif partiel ; après changement de x/n : toutes grisées ; sélection incomplète ; validation/annulation.

#### 12. Contrôles et interactions

Changer x ou n remet toutes les pastilles au gris. Sélectionner les positions voulues. Le contrôle « plafond x ou mise à jour de x » reste explicitement ouvert ; ne pas choisir silencieusement. x=n s’affiche à chaque fois dans la liste.

#### 13. Gestes

Toucher d’un stepper ou d’une pastille, action au relâchement ; aucun geste de réordonnancement dans le motif.

#### 14. Validation

Le motif final doit représenter x positions parmi n. Bornes des steppers et règle précise de validation pendant une sélection incomplète à compléter avec le point ouvert sur x. Pas de sélection automatique après changement.

#### 15. Brouillon et persistance

Brouillon local de fréquence ; la coche de l’en-tête transmet au parent (D-499) ; seule la sauvegarde finale de la Routine persiste.

#### 16. Navigation et conservation d’état

Retour conserve position de la liste et autres paramètres ; annulation ne remplace pas le motif antérieur.

#### 17. Erreurs et cas limites

Contenu retiré pendant l’édition, grand n, motif vidé après modification d’un stepper : revalider sans références fantômes. Ne pas généraliser la fréquence d’une entrée à toute la Routine.

#### 18. Accessibilité

Annoncer la position et l’état de chaque pastille ; steppers accessibles avec valeur ; texte complet et focus modal ; cibles minimales conservées.

#### 19. Invariants

n pastilles ; fréquence sans unité ; aucune occurrence ajoutée au créneau ; détails du motif seulement ici et au Calendrier.

#### 20. Recette déterministe

Tester 1 sur 2, 2 sur 3 avec positions 1/3 ou 1/2, x=n, chaque stepper réinitialisant toutes les pastilles, annuler/valider, indépendance des contenus. Les tests du comportement de x et des bornes attendent leur spécification.

<a id="controles-planification"></a>
### Contrôles et layout de planification

#### Règles d'interface propres à la planification

Les règles communes de shell, de voile et de blocs sont définies dans les règles transverses du présent chapitre ; les dispositions suivantes précisent la planification.

##### La modale de planification occupe toute la hauteur

La modale part de **y 36** (sous la barre d'état) et descend à 874. Coins supérieurs **carrés**. Elle ne laisse plus voir l'écran appelant.

Justification à consigner : le bandeau résiduel ne montrait qu'un titre générique, sans le jour ni le créneau visés ; il coûtait 56 px pour une information que l'en-tête de la modale donne déjà. Et le formulaire, qui porte cinq sections et s'achève par un engagement, relève de la page plutôt que de la feuille.

##### Les blocs du formulaire

Le formulaire applique les règles communes de blocs du présent chapitre. Deux blocs **ne portent pas de titre**, parce que leur contenu est autoporteur :

- le bloc **Créneau** — ligne Programme + ligne Début le, séparées par un filet. Le titre « Créneau » a été écrit puis retiré ;
- le bloc des **éléments planifiés** (§ 5.3).

Dans la section Répétition, les deux blocs successifs sont séparés par l'écart standard entre deux cartes, **12 px** ([DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md), § 0.1).

##### Ordre des sections du formulaire

1. **Créneau** — Programme, puis Début le
2. **Répétition**
3. **Éléments planifiés** (à partir de deux contenus)
4. **Rappel**

Le Rappel est en dernier : il porte sur ce qui a été planifié, il ne peut donc pas précéder la liste des éléments. L'ordre est une conséquence de la lecture, pas une préférence.

##### La ligne Rappel

Même forme que la ligne Répétition : **interrupteur à droite** du titre.

**L'option « Aucun » du contrôle segmenté est supprimée** — comme pour la répétition, c'est l'interrupteur qui porte l'absence. Les options restantes se **répartissent sur toute la largeur, à largeur égale**.

À consigner comme dette de design : ce contrôle est un contrôle segmenté construit à la main, et le DSF n'offre aucune variante au-delà de trois éléments (DSF général, § 8.3).

##### Échelle typographique du formulaire

| élément | style |
|---|---|
| titre de section | **Inter Semi Bold 16** |
| valeurs de paramètre — date, heure, `jusqu'au`, borne, multiplicateur | **16** |
| libellés de ligne, lignes des éléments planifiés | **Medium 14** |
| libellés d'appoint — « Toutes les », le mot d'unité | **Medium 12** |

La règle à retenir : **une valeur que l'utilisateur peut modifier est au corps des titres de section**, pas au corps du libellé qui l'introduit. Les mots de liaison, eux, sont en petit.

##### Le récapitulatif de planification

> Le récapitulatif est **toujours visible** et **jamais chevauché**. Il est posé sur une zone protégée, en bas de l’écran ; la validation est portée par la coche de l’en-tête (D-499, 06/11/2026).

| élément | géométrie |
|---|---|
| dégradé de transparence | 40 px, au-dessus du récapitulatif |
| fond opaque | du haut du récapitulatif jusqu'au bas de l'écran |
| récapitulatif | hauteur ajustée à son texte, en bas dans la zone protégée, sans bouton inférieur (D-499) |

Le contenu du formulaire **défile sous** cette zone et s'efface dans le dégradé. C'est ce qui permet au formulaire de dépasser la hauteur de l'écran sans que le récapitulatif soit repoussé ; la coche demeure dans l’en-tête. C'est aussi ce qui a dissous le problème de débordement : il n'y a plus de hauteur maximale à respecter pour le formulaire.

**Règle fonctionnelle associée :** le récapitulatif se recompose selon les sections actives. Quand la répétition est désactivée, il ne doit pas annoncer de récurrence.

##### Sélection

- Cases à cocher, **jamais de pastilles radio**, y compris quand un seul élément est attendu.
- Validation de la sélection par la **coche de l’en-tête**, sans bouton inférieur (D-499, 06/11/2026).
- Le titre de la modale de choix suit l'option active du contrôle segmenté : « Choisir des séances » / « Choisir des exercices ».
- **Style de l'état retenu**, valable pour le contrôle segmenté comme pour les pastilles de fréquence : fond **#5F60EE**, texte **blanc Semi Bold**. État non retenu : fond **#F9FAFC**, texte **#141414 Regular**.

---

### Calendrier — Objectif

Permettre à l’utilisateur de visualiser les Routines planifiées, de naviguer dans le calendrier et d’accéder rapidement à leur gestion.

### Calendrier — Contenu

L’écran comporte les vues `Jour`, `Semaine` et `Mois`. L’onglet `Calendrier` ouvre la vue `Jour`.

L’écran affiche :

- un calendrier ;
- uniquement les occurrences futures calculées à partir des Routines ;
- pour chaque occurrence : la Séance, sa couleur et la date / heure ;
- le bouton secondaire `+ Planifier`.

En vue Jour, un glissement horizontal de la grille vers la gauche affiche le jour suivant et un glissement vers la droite le jour précédent. Les chevrons restent disponibles. Un appui long sur une plage horaire prépare une nouvelle planification ; le texte `créneau libre` n’est pas utilisé.

### Calendrier — Comportement

En vue Jour, toucher une carte ouvre sa planification ; aucune action glissée n’est proposée. En vue Semaine, toucher la zone principale d’une occurrence ouvre la modification de sa Routine dans l’écran de planification prérempli. La carte possède également une zone distincte pour la déployer ou la replier, une zone `Démarrer`, et révèle uniquement `Dupliquer` et `Supprimer` par glissement gauche. `Dupliquer` identifie la Routine source à partir de l’occurrence, crée un brouillon reprenant la liste ordonnée des contenus, leurs motifs et tous ses paramètres de planification, puis ouvre ce brouillon en modification. Aucune nouvelle Routine n’est persistée avant validation explicite de l’utilisateur.

L’état obtenu par glissement ne remplace pas la liste : il décale la carte concernée pour révéler ses actions. Les autres jours et occurrences restent rendus à leur position chronologique.

En vue Semaine, la liste est organisée chronologiquement en sections journalières. Lorsque le défilement place un nouveau jour en tête de la liste, le curseur coloré de la barre de semaine sélectionne ce jour. Inversement, sélectionner un jour dans la barre positionne sa section comme première section visible de la liste.

La barre de semaine occupe toute la largeur utile. Les sept jours forment sept colonnes flexibles de même largeur ; aucune largeur de cellule ni position horizontale issue du gabarit `402` n’est conservée en dur. Les espacements s’adaptent afin que les sept jours restent entièrement visibles dès `360` points et utilisent l’espace supplémentaire sur un grand téléphone. La grille de la vue Mois applique la même répartition en sept colonnes égales.

`+ Planifier` ouvre la modale de sélection à cases à cocher, titrée « Choisir des séances » ou « Choisir des exercices » selon le segment. La liste y défile si nécessaire ; toucher un contenu bascule sa case sans fermer la modale ; la validation se fait par la coche de l’en-tête (D-499, 06/11/2026 ; remplace le bouton de D-222).

Lorsqu’une occurrence future est exécutée en avance, elle est considérée exécutée pour cette occurrence et n’est plus proposée à son horaire initial.

Lorsqu’une occurrence planifiée arrive à échéance sans avoir été exécutée, elle disparaît de l’interface. Elle n’est pas affichée dans le Suivi du MVP.

La suppression ou modification d’une Routine agit sur les occurrences futures conformément aux règles de planification.

### Calendrier — Confirmation — Suppression d’une planification

Pour une planification unique, `Supprimer` ouvre un dialogue centré comportant `Annuler` et `Confirmer`. Après confirmation, la planification est supprimée ; la source associée et les Exécutions historiques sont conservées.

Pour une planification périodique, le dialogue à trois choix présente sur sa première ligne les deux actions destructives `Seulement cette occurrence` et `Toutes les occurrences à venir`, puis `Annuler` en pleine largeur sur une seconde ligne. Les deux choix peuvent mener au même écran de résultat dans le prototype ; la vue Semaine montre ensuite l’occurrence retirée. Les Exécutions historiques restent conservées.

### Planifier une séance, un exercice ou plusieurs contenus

Le parcours commence depuis Calendrier ou Planifier sur une carte. Les choix utilisent la même modale à cases et coche de validation dans l’en-tête (CE-UI-04, D-499). Le formulaire CE-UI-05 organise Programme facultatif puis Début, Répétition, contenus si N ≥ 2 sans titre, Rappel ; récapitulatif protégé en bas, enregistrement par la coche de l’en-tête. Le mot parcours ne crée pas un objet autonome. La fréquence d’un contenu relève de CE-UI-11.

Règles métier, validations et points ouverts : [spécification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification). Règles générales de mise en page : [DSF commun](../DSF-INTERFACE-GENERALE-2026-10-08.md). Les titres et compteurs dépendent des données ; les exemples Figma ne déterminent aucun calcul. Programme PROG2/3 restent en construction hors MVP.

## Suivi et synthèse

### CE-T03-14 — Synthèse d’Exécution directe

#### 1. Identification

Synthèse ACTIVITY : 4968:8055 (initial),4968:8105 (Ressenti sélectionné). Pour SESSION voir CE-UI-08 ; ne pas utiliser les frames Séance comme seule preuve directe.

Règles applicables : RM-062, RM-078, RM-079, RM-101, RM-102, RM-103, RM-235, RM-236 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Collecter Ressenti obligatoire et Commentaire facultatif avant finalisation UI et retour au contexte appelant.

#### 3. Contexte d’entrée

Fin normale ou arrêt volontaire donnant lieu à Synthèse.

#### 4. Contexte de sortie / destinations

Enregistrer avec Ressenti valide sauvegarde puis restaure le Catalogue ou le Calendrier appelant selon§16.

#### 5. Données affichées et source de vérité

D-437 / MFN-11 amendée par D-445 / MFN-11 : nom et contenu issus de l’instantané, aucun rang stocké ; classification actuelle résoluble séparément. Pas de rang sur les lignes compactes du Suivi 1992:8996.

Le futur relevé À l’échec distingue chronométré, estimé, déclaré et non renseigné, par occurrence/côté ; il ne remplace pas le temps actif cumulé. Exigence de données validée ; implantation des champs de saisie et de restitution hors périmètre de cette passe, aucun emplacement nouveau supposé.

Instantané Exercice, statut et durée réelle issus de l’Exécution ACTIVITY ; Ressenti et Commentaire issus du brouillon de finalisation. Les statistiques ne comptent pas de Séance. Les résultats partiels sont conservés sans inventer un compteur de Tours.

La cadence prescrite est conservée dans l’instantané ; durée affichée réelle, cumulant intervalles abandonnés et tentatives reset par Série/côté. Aucun nombre de répétitions réellement effectué n’est inféré. Aucun nouveau champ de saisie en Synthèse. La charge prévue et son activation sont conservées dans l’instantané (RM-236) ; aucune charge réalisée n’est saisie ni inférée (RM-235).

#### 6. Classification des valeurs Figma

Nom/durée/résultats = dynamiques ; options Ressenti = statiques ; commentaire exemple = démonstration.

#### 7. Structure de l’écran

Shell Summary ; résumé Execution ; choix Ressenti ; Commentaire ; CTA Enregistrer.

#### 8. Éléments obligatoires

Nom Exercice, statut, durée réalisée, trois options de Ressenti, indication obligatoire, Commentaire facultatif limité 200 caractères, Enregistrer. Pas de Tours/Cycles ni de Relancer.

#### 9. Layout déterministe

Réutiliser disposition Summary ; supprimer blocs Session-only plutôt que valeurs fictives ; pas Tour/Cycle/compteur Session.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; clavier commentaire ne masque pas saisie/CTA ; scroll si nécessaire avec texte agrandi.

#### 11. États de l’écran

Ressenti vide ; Ressenti sélectionné ; commentaire vide ; commentaire renseigné ; save en cours ; erreur save.

#### 12. Contrôles et interactions

Sélectionner un Ressenti active Enregistrer ; modifier le Commentaire ne change aucun résultat moteur. Enregistrer finalise une fois. Aucune sortie normale ne contourne Ressenti.

#### 13. Gestes

Tap et saisie/scroll. Aucun swipe métier.

#### 14. Validation

Ressenti obligatoire dès présentation de Synthèse, même Interrompue ; Commentaire≤200 caractères. Au-delà, ne pas enregistrer : conserver la saisie et signaler la limite ; validation serveur/service identique. Pas de suppression silencieuse du commentaire.

#### 15. Brouillon et persistance

Résultats et instantané moteur conservés ; seule la finalisation Ressenti/Commentaire est modifiable avant Enregistrer. Écriture atomique et idempotente ; erreur conserve brouillon et écran.

#### 16. Navigation et conservation d’état

Enregistrer → contexte appelant : Catalogue Exercices avec filtre/scroll restaurés ; lancement depuis Calendrier → date/vue appelantes avec occurrence actualisée. Ce retour contextualisé est dérivé de la conservation d’état, sans création de Séance.

#### 17. Erreurs et cas limites

Commentaire>200 : indiquer la limite et empêcher Enregistrer, conserver saisie. Erreur DB : rester Synthèse avec brouillon ; Exécution déjà finalisée : aucun doublon.

#### 18. Accessibilité

Options selected ; CTA disabled annoncé ; commentaire avec limite ; erreurs annoncées.

#### 19. Invariants


Ressenti obligatoire si Synthèse affichée ; commentaire facultatif ; aucun Session count.

#### 20. Recette déterministe

Statuts Terminée/Partielle/Interrompue ; sans Ressenti bouton désactivé ; chaque Ressenti ; Commentaire 0/200/201 ; double tap, erreur de sauvegarde puis reprise ; historique ACTIVITY et absence de comptage Séance ; retour Catalogue/Calendrier ; accessibilité/clavier.

10×4 s terminé avec Suivant 20 s : temps réel 20 s et fin normale ; reset 6 s puis 10 s : cumulé 16 s ; modifier la définition après exécution ne change pas prescription/résultat. Aucun symbole d’estimation collé au temps réel.

### CE-T03-15 — Suivi général — Exécution ACTIVITY

#### 1. Identification

Suivi général ; frame courante 1992:8843 et état vide 2117:190. Carte ACTIVITY à deux lignes ; 1992:8996 est historique hors MVP. Copies exclusivement au chapitre 06.

Règles applicables : RM-011, RM-078, RM-082, RM-084, RM-102 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Afficher les Exécutions directes dans le Suivi général comme type Exercice sans compter une Séance.

#### 3. Contexte d’entrée

Navigation Suivi ; retour d’autres écrans Suivi.

#### 4. Contexte de sortie / destinations

Navigation globale ; aucun déploiement de carte. Pas de dépendance à l’ActivityDefinition source pour lire l’historique.

#### 5. Données affichées et source de vérité

D-437 / MFN-11 amendée par D-445 / MFN-11 : nom et contenu issus de l’instantané, aucun rang stocké ; classification actuelle résoluble séparément. Pas de rang sur les lignes compactes du Suivi 1992:8996.

*Texte identique à celui de la section [« CE-T03-14 — Synthèse d’Exécution directe »](#ce-t03-14--synthèse-dexécution-directe) ; il n’est pas recopié ici.*

Exécutions SESSION et ACTIVITY clôturées, ordre chronologique décroissant ; type depuis origine, titre/paramètres depuis instantané et résultats, pas source courante. Groupes de dates ; nature, titre, statut, durée réelle, catégorie et Ressenti lorsqu’il existe. Heure, zones et étiquettes restent enregistrées mais ne sont pas affichées dans la carte. ACTIVITY ne compte pas comme Séance.

*Texte identique à celui de la section [« CE-T03-14 — Synthèse d’Exécution directe »](#ce-t03-14--synthèse-dexécution-directe) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Nom/date/durée/statut = dynamiques ; `Exercice` = dérivé origin ; exemples de cartes = démonstration.

#### 7. Structure de l’écran

Liste Suivi mixte ; cartes à deux lignes sans photo ni déploiement ; contenu historique issu du snapshot.

#### 8. Éléments obligatoires

Ligne 1 : nature 26 liste ou tai-chi, titre 15, statut 76 aligné à droite. Ligne 2 : durée réelle, catégorie en pastille 20, Ressenti 20 × 20 aligné à droite. Aucun chevron, heure, zones corporelles ni étiquettes. Ressenti informatif, sans cible tactile ni action. Aucune Vue d’ensemble requise au MVP. Aucun miroir des cartes Catalogue ajouté au Suivi.

#### 9. Layout déterministe

Composants actifs et propriété Durée : [DSF cartes du 07/10](../DSF-CARTES-DUREE-2026-10-07.md). La suppression du cadre de durée Catalogue ne change pas le contrat de cette variante : sélecteurs sans durée, Suivi avec durée réelle, Calendrier avec données de planification. Ne pas injecter une durée à cause du défauttrue de la propriété Figma.

Carte 354 × 67 à texte standard ; bloc texte y12/hauteur43 ; statut x262/y9 (76 × 24), Ressenti x318/y39 (20 × 20), marge droite 16. Marge haute 12/basse8 assumée. Ces coordonnées sont la référence Figma 402, pas des positions absolues à imposer au responsive. Pas de champs Session-only fictifs sur activité. Filtrer/Trier 34, dessins 20, gap 12, cibles 44 ; liste scrollable, navigation fixe.

Durée des cartes : chronomètre 16×16, trait 0,9, #9499A8 lié au rôle catégorie ; texte durée #595E66 et nature #14141A. Suivi = temps réalisé, sans symbole prévisionnel ; Calendrier = nature de calcul fournie.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; liste scrollable ; carte adapte sa hauteur au texte agrandi sans réduire la police ; aucun clavier hors fonctions existantes.

#### 11. États de l’écran

Liste vide ; cartes à deux lignes sans déploiement ; ACTIVITY/SESSION ; trois statuts ; Ressenti présent/absent après interruption technique. Vue d’ensemble/Filtrer/Trier visibles désactivés, aucune recherche.

#### 12. Contrôles et interactions

Navigation globale, aucune action sur Ressenti et aucun déploiement ; commandes Suivi existantes selon statut de disponibilité.

#### 13. Gestes

Scroll. Aucun mouvement modifiant historique.

#### 14. Validation

Lecture historique depuis snapshot même si source n’existe plus. Calculs stats doivent respecter sémantique origin.

#### 15. Brouillon et persistance

Lecture seule. Aucun changement snapshot/results depuis Suivi.

#### 16. Navigation et conservation d’état

Conserver scroll pendant l’aller-retour du parcours courant. Après nouvelle Synthèse de Séance, afficher l’Exécution créée. Une source supprimée ne supprime pas sa carte historique.

#### 17. Erreurs et cas limites

Source supprimée : carte reste lisible. Snapshot ancien : appliquer compatibilité migration/lecture existante.

#### 18. Accessibilité

Type, titre, statut, durée, catégorie et Ressenti annoncé lorsqu’il existe ; dates des groupes accessibles. L’indicateur Ressenti n’est pas présenté comme un bouton. Aucun déployer/replier annoncé.

#### 19. Invariants


Historique indépendant source ; origin ACTIVITY ; compteur Séances inchangé.

#### 20. Recette déterministe

SESSION/ACTIVITY, statuts, source modifiée/supprimée, instantané conservé, absence Ressenti technique, deux lignes, absence de photo/heure/zones/étiquettes/chevron, liste vide. Filtrer/Trier/Vue d’ensemble sans action ; aucune Recherche. Carte ACTIVITY présente dans 1992:8843 ; aucune variante déployée n’est requise au MVP. Ressenti n’a ni action ni cible tactile.

*Texte identique à celui de la section [« CE-T03-14 — Synthèse d’Exécution directe »](#ce-t03-14--synthèse-dexécution-directe) ; il n’est pas recopié ici.*

### CE-UI-08 — Synthèse de Séance

**Complément Formats actif :** Tabata et 30/30 standards modifiables ; contraintes effectives des Formats spécialisés selon CE-FMT-04 et la référence du 02/11.

#### 1. Identification

SESSION terminée 1992:8718/8780, partielle 4760:6448/6500 ; ACTIVITY distinct CE-T03-14.

Règles applicables : RM-028, RM-076, RM-078, RM-079, RM-080, RM-081, RM-083, RM-084, RM-FMT-38, RM-235 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Afficher bilan de Séance et finaliser Ressenti/Commentaire avant Suivi.

#### 3. Contexte d’entrée

Fin normale du plan SESSION ou arrêt volontaire confirmé ; pas obligatoire à afficher si interruption technique l’empêche.

#### 4. Contexte de sortie / destinations

Enregistrer réussi → Suivi ; erreur reste sur Synthèse. Aucun Relancer ni sortie normale sans Ressenti.

#### 5. Données affichées et source de vérité

D-437 / MFN-11 amendée par D-445 / MFN-11 : nom et contenu issus de l’instantané, aucun rang stocké ; classification actuelle résoluble séparément. Pas de rang sur les lignes compactes du Suivi 1992:8996.

*Texte identique à celui de la section [« CE-T03-14 — Synthèse d’Exécution directe »](#ce-t03-14--synthèse-dexécution-directe) ; il n’est pas recopié ici.*

Instantané de Séance, statut, durée réelle et résultats atteints ; nombre exécuté inclut les partiels, nombre terminé les exclut. Ne pas étiqueter le premier comme Exercices terminés. Partiels affichés séparément si>0 ; aucun double comptage Série/côté. Aucune charge réalisée n’est saisie ni inférée (RM-235).

*Texte identique à celui de la section [« CE-T03-14 — Synthèse d’Exécution directe »](#ce-t03-14--synthèse-dexécution-directe) ; il n’est pas recopié ici.*

#### 6. Classification des valeurs Figma

Nom/date/nombres dynamiques ; labels Enregistrer/Commentaire statiques ; 12/12 et 10/12 des maquettes sont démonstratifs.

#### 7. Structure de l’écran

Nom/statut → durée et bilan → question de Ressenti et trois choix → Commentaire → Enregistrer.

#### 8. Éléments obligatoires

Ressenti obligatoire, Commentaire facultatif≤200, Enregistrer désactivé sans Ressenti ; pas de Tours/Cycles ni détail des Exercices sur cet écran.

#### 9. Layout déterministe

Shell Summary ; trois choix Ressenti égaux, séparations 16 ; question selon type.cardTitle ; noms et chiffres depuis données ; Enregistrer est le CTA des captures courantes.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Texte agrandi peut revenir à la ligne ; clavier n’occulte ni saisie ni CTA ; scroll utile, pas de rognage du bilan.

#### 11. États de l’écran

Terminée/Partielle/Interrompue ; aucun/un Ressenti ; commentaire vide/renseigné/invalide ; sauvegarde/erreur.

#### 12. Contrôles et interactions

Tap Ressenti change choix unique ; Commentaire modifie brouillon de finalisation ; Enregistrer une fois, pas de réexécution du plan.

#### 13. Gestes

Tap/saisie/scroll uniquement ; D-237 sur choix/actions ; aucun swipe qui quitte la Synthèse.

#### 14. Validation

Ressenti obligatoire même Interrompue si écran présenté ; commentaire≤200 caractères ; dépassement signalé sans enregistrement ni troncature silencieuse.

#### 15. Brouillon et persistance

Instantané/résultats figés ; finalisation Ressenti/Commentaire atomique et idempotente. Échec conserve brouillon, ne crée pas une seconde Exécution.

#### 16. Navigation et conservation d’état

Après Enregistrer, Suivi montre l’Exécution ; pas de retour au Catalogue imposé pour SESSION. L’occurrence Calendrier liée est marquée exécutée le cas échéant.

#### 17. Erreurs et cas limites

Interruption technique sans présentation autorise Ressenti absent ; données source supprimées restituées depuis instantané ; erreur sauvegarde garde écran/choix/commentaire.

#### 18. Accessibilité

Labels des trois Ressentis et état sélectionné ; obligatoire/facultatif annoncé ; statut non uniquement coloré ; focus/erreur champ ; réduction des animations.

#### 19. Invariants


Exécuté≠terminé ; un Exercice partiel compte exécuté, jamais atteint ne compte pas ; pas de compteur de Séries interprété comme nombre d’Exercices ; aucun Cycle/Tour.

#### 20. Recette déterministe

Trois statuts,0/1/N partiels, distinction exécutés/terminés, trois Ressentis, commentaire 0/200/201, erreur/reprise/double tap, source supprimée ; navigation Suivi ; pas de Relancer ni sortie sans Ressenti.

*Texte identique à celui de la section [« CE-T03-14 — Synthèse d’Exécution directe »](#ce-t03-14--synthèse-dexécution-directe) ; il n’est pas recopié ici.*

### Synthèse — séance ou exercice — Objectif

Présenter un bilan immédiatement compréhensible et recueillir le ressenti obligatoire avant de quitter l’écran.

### Synthèse — séance ou exercice — Contenu

L’écran affiche notamment :

- le nom de la Séance ;
- le statut de l’Exécution ;
- la durée réellement exécutée ;
- le nombre d’Exercices réalisés ;
- le nombre d’Exercices partielles, uniquement s’il est supérieur à zéro ;
- le choix du ressenti ;
- un champ `Commentaire` facultatif ;
- le bouton `Enregistrer`.

Les Tours et Cycles ne sont pas affichés dans la Synthèse du MVP.

Aucun parcours détaillé des Exercices n’est affiché sur cet écran dans le MVP.

### Synthèse — séance ou exercice — Ressenti

Le ressenti est obligatoire.

Le MVP propose trois niveaux, conformément au wireframe.

Le libellé `Comment s’est passée la séance ?` utilise `type.cardTitle` (`16/19`, Semi Bold — interligne Inter Auto depuis l’alignement DSF du 07/10/2026, ancien `16/20`). À la taille système standard, son conteneur occupe la largeur utile et maintient le libellé sur une ligne sur les largeurs prises en charge de `360` à `440` points ; la référence Figma `402` utilise une largeur de `322` points. Avec l’agrandissement d’accessibilité, le conteneur grandit verticalement et autorise le retour à la ligne sans chevaucher les choix de ressenti.

Le bouton `Enregistrer` reste désactivé tant qu’aucun ressenti n’a été sélectionné.

### Synthèse — séance ou exercice — Commentaire

Le `Commentaire` est facultatif et limité à **200 caractères maximum**.

Le Ressenti est obligatoire dès lors que cet écran de Synthèse est présenté, y compris pour une Exécution `Interrompue`. Il peut être absent uniquement lorsqu’une interruption technique n’a pas permis de présenter la Synthèse.

Il est enregistré avec l’Exécution.

### Synthèse — séance ou exercice — Résultat d’un exercice lancé directement

Le Ressenti est obligatoire pour activer `Enregistrer`; le Commentaire reste facultatif. La finalisation enregistre l’origine `ACTIVITY`, alimente les statistiques compatibles sans compter une Séance et restaure le contexte appelant : Catalogue des Exercices dans son état précédent, ou Calendrier avec date/vue conservées (CE-T03-14).

### Suivi — Séances — Objectif

Permettre à l’utilisateur de consulter les Exécutions enregistrées sur des cartes à deux lignes, sans déploiement (D-262).

Les occurrences planifiées non exécutées ne sont pas affichées dans le Suivi du MVP.

### Suivi — Séances — Contenu

L’écran comporte :

- la destination active `Séances` ;
- les commandes `Filtrer` et `Trier`, visibles mais désactivées dans ce contexte ;
- une liste chronologique des Exécutions.

Chaque carte présente deux lignes sans déploiement ; les détails restent conservés dans l’instantané et les résultats, sans carte déployée accessible au MVP.

La Vue d’ensemble est hors MVP ; l’ancien contrôle partagé ne constitue plus une exigence de cette version. Les commandes `Filtrer` et `Trier` conservent leur écart et sont centrées comme un groupe. Dans chaque carte, le Ressenti est un indicateur informatif 20 × 20 ancré au bord droit intérieur, sans zone tactile ni action ; il reste lisible sur écran compact et ne s’éloigne pas du bord sur grand téléphone. La liste est la seule zone défilante et s’arrête visuellement au moins `16` points avant la navigation basse fixe.

### Suivi — Séances — État vide

Si aucune Exécution ne correspond à la recherche, l’écran affiche un message indiquant qu’aucun résultat ne correspond.

Si aucune Exécution n’existe encore, l’écran affiche : `Vous verrez ici vos séances exécutées dès que vous aurez terminé votre première séance.`

### Synthèse de séance — Éléments affichés

| Élément affiché       | Type             |  Visible | Obligatoire | Valeur par défaut                                    | Contraintes                 | Source      | Action         | Remarques                            |
| --------------------- | ---------------- | -------: | ----------: | ---------------------------------------------------- | --------------------------- | ----------- | -------------- | ------------------------------------ |
| Titre de la séance    | Texte            | Toujours |         Oui | Nom de la séance                                     | 1 à 80 caractères           | Séance      | Aucune         | En-tête fixe                         |
| Carte Statut          | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Icône de statut       | Icône            | Toujours |         Oui | ✓                                                    | Terminée, Partielle ou Interrompue     | Séance      | Aucune         | Couleur selon le statut              |
| Libellé du statut     | Texte            | Toujours |         Oui | Séance terminée                                      | Terminée, Partielle ou Interrompue     | Séance      | Aucune         |                                      |
| Date / heure de fin   | Texte            | Toujours |         Oui | Date courante                                        | Format local                | Séance      | Aucune         |                                      |
| Carte Votre séance    | Carte            | Toujours |         Oui | Visible                                              | Une seule                   | Séance      | Aucune         |                                      |
| Durée réelle          | Durée            | Toujours |         Oui | Calculée                                             | Temps réellement exécuté    | Séance      | Aucune         |                                      |
| Nombre d'exercices    | Valeur           | Toujours |         Oui | Calculé                                              | X / Y                       | Séance      | Aucune         |                                      |
| Exercices partiellement réalisées | Texte | Si > 0 | Non | Masqué | `n exercice(s) partiellement réalisée(s)` | Séance | Aucune | Libellé UI ; le statut métier de l’Exercice reste `Partielle` |
| Question de ressenti  | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Obligatoire" | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Choix du ressenti     | Sélecteur        | Toujours |         Oui | Aucun sélectionné                                    | Une seule sélection         | Utilisateur | Sélection      | MVP : 3 niveaux                      |
| Titre Commentaire     | Texte            | Toujours |         Oui | Texte fixe                                           |                             | Statique    | Aucune         |                                      |
| Mention "Facultatif"  | Texte            | Toujours |         Oui | Visible                                              | Texte fixe                  | Statique    | Aucune         |                                      |
| Champ Commentaire     | Texte multiligne | Toujours |         Non | Vide                                                 | **200 caractères max**      | Utilisateur | Saisie         | Environ 2 à 3 lignes                 |
| Bouton Enregistrer       | Bouton           | Toujours |         Oui | Désactivé tant que le ressenti n'est pas sélectionné | Une seule action            | Statique    | Aller au Suivi | Enregistre définitivement la séance  |
### Suivi - Séances — Élément affiché lié à la couleur

| Élément affiché | Type | Visible | Obligatoire | Valeur par défaut | Contraintes | Source | Action | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Couleur de la séance exécutée | Indicateur visuel | Toujours | Oui | Couleur de l’instantané | Une couleur parmi 12 | Instantané de séance | Aucune | Ne dépend pas de la couleur actuelle de la séance |

## Profil et préférences

### CE-UI-01 — Profil — préférence silhouette

#### 1. Identification

Modifier le profil — MVP ; frame 1992:778. Contrat de photo/nom d’affichage/silhouette, distinct des préférences immédiates CE-UI-07.

Règles applicables : RM-091 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Modifier l’identité locale et la variante d’icône de Zone corporelle, sans compte distant ni effet métier de la silhouette.

#### 3. Contexte d’entrée

Profil > Modifier.

#### 4. Contexte de sortie / destinations

Enregistrer valide/persiste et revient à Profil ; retour avec modification propose abandon, qui restaure les valeurs enregistrées ; annuler abandon conserve le brouillon.

#### 5. Données affichées et source de vérité

Photo locale facultative choisie dans la galerie (D-258), nom d’affichage et silhouette facultative homme/femme ; absence silhouette affiche homme. Les champs viennent du brouillon de Profil, pas de données d’événement.

#### 6. Classification des valeurs Figma

Nom/photo utilisateur dynamiques ; hommes/femmes sont labels de choix d’icône, sans validation de sexe ; exemples du profil illustratifs. Aucun événement/date/durée à classer ici.

#### 7. Structure de l’écran

Photo/nom existants puis deux choix de silhouette sous l’aide du Nom d’affichage.

#### 8. Éléments obligatoires

Champ Nom d’affichage, action photo facultative, deux silhouettes à sélection unique et Enregistrer. Aucun sélecteur de langue ni identité distante.

#### 9. Layout déterministe

Cercles 64 espacés 24, silhouettes 44. Sélection contour 2 et dessin#0508E5 ; non sélection contour#CCD1E0 à 1, dessin#9499A8.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. Les dimensions de référence 402 ne figent pas les coordonnées sur tous les appareils.

#### 11. États de l’écran

Non renseigné ; homme ; femme ; modification non enregistrée.

#### 12. Contrôles et interactions

Toucher une silhouette change le brouillon ; Enregistrer persiste avec le Profil.

#### 13. Gestes

Tap choix/actions et saisie/scroll ; D-237 ; aucune interaction sur les icônes de zones ailleurs ne modifie cette préférence.

#### 14. Validation

Nom d’affichage non vide,1..80 caractères selon conception 08 ; photo et silhouette facultatives ; silhouette homme/femme ou absente. Les anciens profils sans silhouette restent valides.

#### 15. Brouillon et persistance

Même brouillon et action Enregistrer que photo/nom. Les profils existants sans valeur restent valides.

#### 16. Navigation et conservation d’état

Destination Profil inchangée ; préférence relue après relance.

#### 17. Erreurs et cas limites

Nom vide/trop long : erreur liée au champ, rester ; photo indisponible : avatar/initiales sans empêcher l’accès aux champs ; choix de photo annulé : aucune modification ; échec de lecture ou de copie : message, brouillon conservé ; erreur sauvegarde : conserver brouillon, aucune mutation partielle.

#### 18. Accessibilité

Labels Silhouette homme / Silhouette femme ; état sélectionné annoncé.

#### 19. Invariants

Aucun effet sur recherche, catégories, calculs, exécutions ou données historiques.

*Texte identique à celui de la section [« CE-T03-17 — Navigation principale — inventaire DSF »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-17--navigation-principale--inventaire-dsf) ; il n’est pas recopié ici.*

#### 20. Recette déterministe

Nom 1/80/vide/81, photo absente/présente/indisponible ; silhouette absente→homme, choisir femme/enregistrer/relancer ; abandon sans écriture ; erreur persistance ; vérifier toutes icônes de zone et aucun effet filtre/calcul/historique.

### CE-UI-07 — Profil — préférences et défauts d’exécution

#### 1. Identification

Profil principal 1992:375/474/579/684 et 2139:86 ; modification identité CE-UI-01.2139:86 est un doublon visuel, pas un parcours autonome.

Règles applicables : RM-031, RM-032, RM-051, RM-052, RM-085, RM-086, RM-089, RM-090, RM-209, RM-212, RM-217, RM-242 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Consulter identité et modifier les préférences globales et valeurs proposées aux nouveaux objets.

#### 3. Contexte d’entrée

Destination Profil ou retour de Modifier le profil.

#### 4. Contexte de sortie / destinations

Modifier → CE-UI-01 ; navigation basse vers les trois autres destinations ; un réglage reste sur Profil.

#### 5. Données affichées et source de vérité

Préférences locales : Sons, Annonces vocales, Vibration, Notifications ; groupe Exercice : Pause entre les côtés, Compte à rebours d’un exercice (D-266), Fin d’exercice ; groupe Séance : Récupération après exercice, Compte à rebours initial, Fin de séance.

Le défaut de Récupération du Profil initialise uniquement un nouvel Exercice ; le réglage est ensuite local et indépendant. La valeur apparaît dans un cadre orange dans Paramètres d’exécution avant premier ✓.

#### 6. Classification des valeurs Figma

Labels statiques ; valeurs locales dynamiques. Défauts actés : côté 10 s, récupération après exercice 30 s, comptes à rebours 10 s, fins 5 s, Vibration activée. L’état vibration désactivée est un exemple utilisateur.

#### 7. Structure de l’écran

Identité/Modifier, groupes Exercice et Séance de réglages, commandes son/vocal/vibration/notifications, navigation basse.

#### 8. Éléments obligatoires

Six défauts distincts ; aucune Pause inter-Séries globale ajoutée. La Pause après chaque série est initialisée à 0 s dans l’éditeur (chapitre 08, paramètres d’exercice, CE-UI-10 §3), sans défaut global du Profil. Silhouette ne se modifie que dans CE-UI-01.

Libellé unique Pause entre les côtés, inchangé (D-406) ; défaut 10 s, proposé lorsqu’un Exercice passe à Changement de côté Avec (RM-212, RM-242) ; pas des pauses selon D-312 (D-386). Les captures anciennes de Profil portant un ancien libellé sont historiques sur ce texte.

#### 9. Layout déterministe

Groupes selonDSF T5/T6 : fond#F9FAFC, liseré blanc 1, rayon 12, ombre sans rognage. Dans chaque groupe, un séparateur horizontal entre deux lignes consécutives, au style de séparateur de référence, aucun après la dernière ligne (D-267). Durées par steppers Profil, pas par roulette d’Exercice ; libellés complets accessibles.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Zone centrale scrollable, navigation fixe ; texte long/agrandi fait croître lignes/groupes ; unités et actions restent visibles dans Safe Areas.

#### 11. États de l’écran

Préférences chargées ; steppers actifs/borne ; vibration on/off ; notifications autorisées/refusées ; enregistrement/erreur.

#### 12. Contrôles et interactions

Chaque modification de préférence s’enregistre immédiatement. Les valeurs servent aux nouveaux objets seulement ; aucune rétroaction sur brouillons déjà initialisés, Séances ou Exécutions existantes. Permission système demandée lors de première activation d’un rappel en Planification.

#### 13. Gestes

Tap bascule ; stepper incrément immédiat, maintien≈500 ms, répétition 150 ms et paliers 1/5/10 selon DSF Bip, arrêt au relâchement ; action/animation D-237.

#### 14. Validation

Valeurs non négatives ; pauses côté/récupération 0..300 s, tap 1 s puis maintien accéléré selon DSF Bip. Compte à rebours d’exercice et Fin d’exercice : 0..60 s, pas 1 s (D-256). Compte à rebours initial et Fin de séance (valeurs par défaut) : 0..60 s, pas 1 s (D-265) ; une valeur enregistrée au-delà est conservée sans plafonnement : « + » inactif, « − » ramène d’abord à 60 s. Pas de maximum déduit d’un exemple. Les bornes partagées sont consolidées dans [R-02 — Validation des contrôles existants](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-02--validation-des-contrôles-existants).

#### 15. Brouillon et persistance

Persistance immédiate de préférence, atomique par modification ; pas de bouton Enregistrer global. Identité/photo/silhouette gardent leur brouillon séparé dans CE-UI-01.

#### 16. Navigation et conservation d’état

Navigation ne perd pas une préférence confirmée ; relance relit les valeurs. Création ultérieure copie les valeurs ; objets antérieurs inchangés.

#### 17. Erreurs et cas limites

Échec écriture : indiquer erreur et restituer valeur confirmée ; permission refusée ne s’affiche pas active. Profil sans silhouette valide, affichage homme par défaut.

#### 18. Accessibilité

Nom et état on/off annoncés ; steppers annoncent unité et borne ; cibles distinctes ; haptique de roulette indépendant de Vibration fonctionnelle.

#### 19. Invariants

Pas de compte distant, pas de langue MVP, aucune rétroactivité ; Notifications non autorisées par défaut ; Vibration ne désactive pas l’haptique des roulettes.

*Texte identique à celui de la section [« CE-T03-17 — Navigation principale — inventaire DSF »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-17--navigation-principale--inventaire-dsf) ; il n’est pas recopié ici.*

#### 20. Recette déterministe

Changer chacun des six défauts, créer un nouvel objet puis comparer ancien objet inchangé ; relancer ; erreur écriture ; vibration off et haptique roulette maintenu ; notification refusée ; Modifier puis Annuler sans changement identité.

Insérer un Exercice : aucune récupération. Ajouter recovery : défaut Profil proposé ; ancien objet inchangé après modification du Profil.

### Profil — Objectif

Permettre à l’utilisateur de consulter les informations générales de son compte et de définir les préférences globales de l’application.

### Profil — Contenu

L’écran comporte notamment :

- l’avatar ou les initiales, le nom d’affichage et l’action `Modifier` ;
- `Sons` ;
- `Annonces vocales` ;
- `Vibration` ;
- la durée par défaut du `Compte à rebours initial` ;
- la durée par défaut de la `Fin de séance` ;
- le `Compte à rebours d’exercice` ;
- la `Fin d’exercice` ;
- `Notifications` et rappels.

Les préférences de Compte à rebours initial et de Fin de séance servent de valeurs proposées lors de la création d’une nouvelle Séance. Elles restent modifiables au niveau de chaque Séance. Les lignes `Compte à rebours d’exercice` (ancien nœud `4179:9550`, historique supprimé ; le contrôle fonctionnel reste prescrit) et `Fin d’exercice` (ancien nœud `4179:9556`, historique supprimé ; le contrôle fonctionnel reste prescrit) sont des contrôles intégrés à cet écran Profil, pas des écrans distincts ; leurs valeurs sont proposées à la création d’un Exercice et restent modifiables dans chaque Exercice.

Les valeurs initiales de l’application sont `10 s` pour le Compte à rebours initial, `5 s` pour la Fin de séance et `activée` pour Vibration. L’état désactivé montré dans le parcours Figma illustre une modification utilisateur et ne définit pas la valeur initiale.

Le feedback haptique des roulettes est systématique dans le MVP et reste indépendant de la préférence `Vibration`, réservée aux vibrations fonctionnelles de séance.

Le MVP est disponible uniquement en français et n’affiche aucun sélecteur de langue. Tous les textes destinés à l’utilisateur sont référencés par des clés de traduction centralisées, sans texte fonctionnel codé directement dans les écrans. Les traductions futures peuvent ainsi être ajoutées sans modifier les composants. Les pluriels, variables, dates, heures, nombres, notifications et libellés d’accessibilité utilisent également ce mécanisme d’internationalisation.

### Profil — Comportement

Les préférences sont enregistrées immédiatement. L’écran `Modifier le profil — MVP` permet de modifier la photo, le nom d’affichage et la préférence facultative `silhouette`, puis demande une action explicite `Enregistrer`. La préférence est enregistrée avec le Profil. Valeurs : homme/femme ; non renseignée = silhouette homme. Elle ne modifie que l’icône de zone corporelle, sans filtre ni effet sur les données d’exercice.

Les préférences ne modifient pas rétroactivement les Séances existantes ni une Exécution déjà en cours.

Les notifications ne sont pas autorisées par défaut. La demande d’autorisation du système d’exploitation est présentée lorsque l’utilisateur active pour la première fois un rappel lors d’une planification. En cas de refus, le rappel n’est pas activé et l’application indique que l’autorisation peut être modifiée dans les réglages du système.

### Profil — Éléments affichés
| Élément affiché                     | Type            |  Visible | Obligatoire | Valeur par défaut          | Contraintes                     | Source      | Action               | Remarques                                            |
| ----------------------------------- | --------------- | -------: | ----------: | -------------------------- | ------------------------------- | ----------- | -------------------- | ---------------------------------------------------- |
| Titre de l'écran                    | Texte           | Toujours |         Oui | Profil                     | Texte fixe                      | Statique    | Aucune               |                                                      |
| Avatar                              | Icône           | Toujours |         Oui | Initiales de l'utilisateur | Image personnalisée en V2       | Profil      | Modifier le profil   |                                                      |
| Nom                                 | Texte           | Toujours |         Oui | Nom de l'utilisateur       | 1 à 80 caractères               | Profil      | Modifier le profil   |                                                      |
| Action `Modifier`                   | Bouton          | Toujours |         Oui | Visible                    | Photo et nom d’affichage         | Profil      | Ouvrir l'édition     | Active dans le MVP                                   |
| Sons                                | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Valeur par défaut des séances                        |
| Annonces vocales                    | Interrupteur    | Toujours |         Oui | Activé                     | Booléen                         | Préférences | Activer / Désactiver | Utilise la voix système                              |
| Vibration                           | Interrupteur    | Toujours |         Oui | Activée                    | Booléen                         | Préférences | Activer / Désactiver | Vibrations fonctionnelles de séance uniquement       |
| Compte à rebours initial par défaut | Sélecteur durée | Toujours |         Oui | 10 s                       | 0 à 60 s, pas 1 s (D-265)       | Préférences | Modifier             | Valeur utilisée à la création d'une séance (D-089)   |
| Fin de séance par défaut            | Sélecteur durée | Toujours |         Oui | 5 s                        | 0 à 60 s, pas 1 s (D-265)       | Préférences | Modifier             | 0 s = phase instantanée (D-089)                      |
| Notifications                       | Interrupteur    | Toujours |         Oui | Non autorisées             | Booléen                         | Préférences | Activer / Désactiver | Demande système lors de la première activation d’un rappel |

Les valeurs par défaut Pause entre les côtés, Compte à rebours d’un exercice, Fin d’exercice et Récupération après exercice figurent aussi au Profil (D-240) : voir [CE-UI-07 — Profil — préférences et défauts d’exécution](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-ui-07--profil--préférences-et-défauts-dexécution).

## Référentiels

### CE-UI-09 — Référentiels d’Exercice — Catégorie et Zones corporelles

#### 1. Identification

Catégorie 4332:7095, création 4474:7157 ; Zones 4478:7209, création 4683:6336 ; suppressions 4861:6259/6348. Étiquettes de Séance :CE-T03-16.

Règles applicables : RM-023, RM-039, RM-040, RM-042, RM-200, RM-214, RM-215, RM-216 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Renseigner les classifications d’un Exercice et administrer leurs valeurs sans changer son exécution.

#### 3. Contexte d’entrée

Accès Catégorie ou Zones depuis éditeur persistant/local, avec brouillon conservé.

#### 4. Contexte de sortie / destinations

Catégorie marquée au toucher (ou créée par ↑ et marquée), confirmée par ✓ → éditeur ; ✕ conserve la Catégorie précédente, une Catégorie créée reste dans le référentiel (D-343) ; Zones sélection multiple puis validation de la modale → éditeur ; fermer sans validation restaure sélection antérieure. Création/suppression restent dans la famille de sélection.

#### 5. Données affichées et source de vérité

Référentiels utilisateur et IDs du brouillon. Catégorie unique avec couleur ; Zones multiples sans couleur. Affectations retirées existantes conservables avec nom/dernière couleur.

Référentiel initial :10 zones D-093. Fessier est un ajout utilisateur dans les exemples Figma, pas une onzième valeur initiale obligatoire.

#### 6. Classification des valeurs Figma

Noms et couleurs dynamiques ; dix zones initiales sont un jeu de départ, pas une liste fermée. Labels Catégorie/Zones/Nouvelle… statiques.

#### 7. Structure de l’écran

Modale de choix, création inline avec clavier (action ↑ dans le champ, ↑ enregistre sans fermer le clavier ni la feuille — D-350 ; sans bouton Annuler : ✕ ferme la feuille ; espace réduit au-dessus du clavier — D-347), palette seulement Catégorie, dialogue destructif centré sur appui long.

#### 8. Éléments obligatoires

Catégorie 1 et Zones≥1 pour nouvel Exercice ; nouvelle valeur nommée ; annuler et confirmer les sélections multiples ; aucun CTA supplémentaire en choix simple D-222.

#### 9. Layout déterministe

Modales D-228 ; pastille Catégorie colorée et nom ; Zones icône silhouette depuis Profil ; palette de 4474:7157 : barre de couleurs sous le champ, sans pastille séparée, 12 couleurs D-026 (D-344). Les Zones n’ont pas de palette.

*Texte identique à celui de la section [« CE-T03-05 — ActivityDefinition — archiver / restaurer / supprimer »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-t03-05--activitydefinition--archiver--restaurer--supprimer) ; il n’est pas recopié ici.*

Catégorie et Zones utilisent contour au repos et plein pendant l’ouverture du panneau ; cercle inchangé. Silhouette selon Profil, homme par défaut.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Liste scrollable, clavier et actions visibles ; nom long accessible ; textes agrandis sans réduction ; focus confiné à la modale ouverte.

#### 11. États de l’écran

Liste vide/initiale/enrichie ; aucune/une Catégorie ; zéro/N Zones ; création/nom invalide ; valeur retirée déjà affectée ; confirmation/erreur.

#### 12. Contrôles et interactions

Catégorie tap marque sans fermer, ✓ confirme et ferme (D-343) ; Zones tap toggle puis confirmer. Appui long ouvre le dialogue Modifier/Supprimer sans sélectionner (D-259). Créer/renommer conserve identité de référence ; changer couleur Catégorie se propage aux objets courants, pas aux instantanés.

#### 13. Gestes

Tap, scroll, saisie et appui long option ; aucun drag des référentiels ; appui destructif jamais déclenché par simple sélection.

#### 14. Validation

Nom non vide et unique dans son référentiel ; un nom correspondant à une valeur retirée la réactive avec son identifiant et ses associations (D-257) ; Catégorie exactement 1, Zones≥1 pour nouvel objet. Une valeur retirée ne peut recevoir de nouvelle affectation ; l’ancienne affectation n’exige pas un remplacement forcé.

#### 15. Brouillon et persistance

Affectations dans brouillon Exercice, persistées à Terminer ; opérations de référentiel explicitement confirmées sont distinctes. Erreur de création/suppression ne sauvegarde pas l’Exercice.

#### 16. Navigation et conservation d’état

Fermer restitue éditeur/brouillon ; Annuler suppression restitue sélection intacte ; confirmer retire des futurs choix mais conserve affectations existantes et historique.

#### 17. Erreurs et cas limites

Nom vide/dupliqué, valeur retirée entre lecture et choix, échec écriture : message et brouillon conservé. Ne jamais recréer ni réactiver automatiquement une valeur supprimée au démarrage ou par migration ; seule une création explicite du même nom la réactive (D-257).

#### 18. Accessibilité

Nom/état sélectionné annoncés ; couleur accompagnée du nom ; labels accessibles des actions ; focus dialogue puis liste ; toutes Zones sélectionnées lisibles.

#### 19. Invariants

Classification sans effet sur moteur ; Catégorie colore les objets courants référents ; Zone sans couleur ; conservation D-210 ; silhouette sans effet de filtre.

#### 20. Recette déterministe

Catégorie choix/annulation/création/couleur ; Zones 0/1/N ; noms vide/dupliqué ; supprimer initiale/personnelle utilisée/inutilisée ; sauvegarder ancienne affectation retirée ; interdire nouvelle ; renommer sans changer ID ; historique inchangé.

Vérifier les deux silhouettes et le retour au repos après validation/annulation ; pas de suppression de la variante femme.

## Interface transverse

### Règles communes T03

#### 4.1 Classification des valeurs Figma

Toute valeur visible est classée :

- `LIBELLÉ STATIQUE OBLIGATOIRE` : texte d’interface traduit via i18n ;
- `DONNÉE MÉTIER DYNAMIQUE` : valeur provenant du modèle, d’un brouillon ou d’un calcul ;
- `VALEUR DE DÉMONSTRATION FIGMA` : valeur uniquement illustrative, interdite en dur.

Les noms d’Exercices/Séances, catégories, zones corporelles, durées, nombres de Séries/répétitions, commentaires, ressentis, dates et ordre des cartes montrés dans les maquettes sont dynamiques/démonstratifs sauf mention contraire.

#### 4.2 Responsive

- référence Figma standard : `402 × 874 pt` ;
- validations obligatoires : largeur `360`, `402`, `440` ;
- contenu centré au-delà selon architecture ;
- Safe Areas et Bottom Navigation selon chapitre 12 ;
- aucune coordonnée Figma n’est copiée comme position absolue React Native ;
- cibles tactiles ≥ `44 × 44 pt`, sans chevauchement ; dimensions spécifiques supérieures conservées ;
- aucun élément obligatoire sous le clavier, la navigation ou une zone système.

#### 4.3 Navigation globale

Destination basse permanente : `Catalogues`, `Calendrier`, `Suivi`, `Communauté`, `Profil`. Aucun contrôle Recherche n’est présent dans le MVP (D-221/D-225). [PRE-8, recette A/B E01 du 27/10/2026 : `Communauté` visible et désactivée, sans écran, tant que son écran n'est pas développé.]

Composant : `Navigation / Bottom — 5 onglets` (`6513:20151`). Les cinq dessins de destination mesurent au maximum `24 pt`, centrés dans une boîte optique `32 × 32 pt`. Aucune substitution par glyphe/emoji/système.

#### 4.4 Conservation d’état Catalogue

Filtre appliqué, tri implicite et scroll sont conservés pendant la session applicative courante et les allers-retours. Au relaunch, aucun filtre n’est appliqué et le Catalogue revient au segment `Séances`.

#### 4.5 Commandes Catalogue `Créer` / `Filtrer` / `Trier`

`Créer`, `Filtrer` et `Trier` forment la rangée commune de commandes. Référence du 30 septembre : cercles visibles `34 pt`, pictogrammes `20 pt`, gap visuel `12 pt`, cibles transparentes ≥ `44 × 44 pt` sans chevauchement. Les pilules étendues conservent une hauteur de `34 pt`. Le groupe est centré verticalement dans la zone de contexte existante. Les coordonnées de maquette ne deviennent pas des positions absolues React Native. [Recette A/B du 27/10/2026, D01–D05 : appliqué à tous les segments par un module commun (`CatalogueCommands`) ; sur le segment Mouvements, le champ Rechercher occupe la même rangée, à gauche des commandes, de même hauteur visible 34 (cible 44), et se réduit horizontalement quand Filtrer s’étend ; une croix dans le champ efface la saisie et restaure la liste des filtres actifs sans fermer le Catalogue. Commande Filtrer étendue : rond bleu (retire les filtres), « Filtres » + résumé + chevron (ouvre la feuille). Sans critère, Filtrer ouvre directement la feuille : l’étape intermédiaire « Filtres / Aucun » n’est pas développée (à valider). Catalogue des Mouvements, B06 : toute la marge gauche d’une pile déployée la replie ; B09 : une pile condensée ne glisse pas.]

`Filtrer` et `Trier` sont communs à `Exercices / Séances`; leur représentation d’entrée est commune, leurs options peuvent être contextuelles. Le filtre inactif est un bouton rond blanc. Dans le Catalogue des séances, l’état étendu sans filtre est retiré le 27/10/2026 : ouvrir le panneau sans créer cet état intermédiaire. Les autres contextes conservent leur comportement existant. Après sélection d’un critère, le contrôle actif est bleu et étendu ; le rond bleu retire le filtre, tandis que la zone texte ouvre la modale. `Réinitialiser` revient à `Aucun`. `Créer` reste actif. `Trier` reste visible mais disabled en T03.

Pour T03 / `Exercices` :

- `Filtrer` propose les critères contextuels validés : statut (`Actives` / `Archivées`), Catégories et Zones corporelles ;
- `Trier` est visible mais disabled ;
- le tri réellement appliqué reste `updatedAt DESC` ;
- aucun menu de tri n’est ouvert ;
- aucune préférence de tri n’est persistée ;
- aucun critère non arbitré n’est inventé.

`Créer` est contextuel au Catalogue affiché : un tap ouvre directement la création de l’objet correspondant, sans écran ni arbre intermédiaire.

Les **contrôles d’entrée** et les panneaux ouverts de `Filtrer` sont conçus et vérifiables dans Figma. `Trier` reste visible mais désactivé dans le périmètre T03.

#### 4.5 bis — Segmentés et titres courants (07/10/2026)

Catalogue cible du 27/10/2026 : **Mouvements / Séances / Programmes**, selon CE-T03-01, sans catalogue autonome d’exercices. Les sélecteurs des modales « Choisir une séance / Choisir un exercice » conservent leurs contrats propres hors de ce lot ; leur ancien segmenté Exercices/Séances n’impose pas la structure du Catalogue. Le catalogue conserve Séances par défaut et les comportements existants de sélection. Cette suppression n’ajoute aucun sélecteur à une modale qui n’en présente pas : CE-T03-07 reste la sélection multiple d’Exercices de Composition, sans choix de Séance ni nouveau parcours de création.

Ancien gabarit à deux options, conservé seulement pour ses contextes hors Catalogue : cadre 354×42, padding 4, gap 4, deux options 171×34 ; rayon extérieur 14, fond blanc `VariableID:2290:54` à 50 %, sans contour. Rayon des options 10 ; sélection indigo, texte blanc ; inactive #EAEAFF, texte sombre, sans contour. Largeurs flexibles : répartir la largeur utile, sans figer 171 sur tous appareils.

Libellés des segmentés généraux : `KODJO / Section title`, Inter Semi Bold 16/20, selon leur contexte. Dans la feuille Paramètres, conserver la typographie propre aux options. La ligne « De chaque côté » tient sur une ligne ; ses notations d’Enchaînement gardent la taille standard des options, sans réduction, conformément à D-431 et RM-243. Les Calendriers et modes à trois choix gardent leurs trois options. La typographie ne change ni les règles de sélection ni les états actifs ou désactivés.

Titres affichés : CE-T03-04 `Créer un exercice` / `Modifier un exercice` ; CE-T03-08 `Composer une séance` / `Modifier une séance`. Depuis le menu Créer de la Composition, le titre de l’écran et la confirmation du mouvement sont « Créer un exercice ». Les autres contextes conservent leurs libellés propres. Les noms techniques de frames et annotations historiques peuvent différer : les IDs et chemins restent stables. Un libellé d’action `Ajouter` ne devient pas automatiquement `Créer` ; depuis Composition, `Ajouter un exercice` conserve la destination CE-T03-07. Aucun arbre de création retiré n’est réintroduit.

[DSF détaillé et écarts de propagation](../DSF-SEGMENTES-TITRES-2026-10-07.md) ; [traçabilité et captures](../MATRICE-COMPLEMENTS-2026-10-07.md).

#### 4.6 Roulettes de durée et steppers

Toutes les roulettes de **durée** actives utilisent la famille de modales basses du DSF. Les entiers simples `Nombre de Séries` et `Nombre de Tours` utilisent un **stepper inline** et n’ouvrent aucune roulette. La cible `Nombre de répétitions` utilise une roulette native à une colonne, 1 à 100, avec « Aucune répétition, à l’échec » en tête dans une cellule de séries variables seulement (décision PRE-4 Q8 du 16/10, D-385 ; retirée en séries identiques par D-418). Les anciennes représentations contraires ne constituent plus une référence active. En séries identiques, la roulette Objectif de durée propose uniquement une durée numérique ; celle d’une cellule de série variable en mode Durée propose aussi « À l’échec » (RM-250).

Tous les voiles modaux utilisent exclusivement `overlayScrim` (`color/overlay/scrim`) = #1F2129 à 34 % : dialogues de décision, feuilles de sélection, roues, filtres, classification, catégorie, zones corporelles, calendrier ouvert, abandon/confirmation et CE-UI-10. [04/11/2026, recette iPhone du 04/11 (Hermann : « Afficher en mode modale iOS (mode d'apparition identique à la fiche des mouvements du questionnaire par exemple) […] Catalogue des mouvements : Filtres ; […] Catalogue des séances : Filtres ») : les feuilles de filtres des Catalogues sont des feuilles natives iOS, avec le voile du système (comme les feuilles natives adoptées le 04/11) ; le mode catalogue d'un Format garde le sien ; voir ch07 « Recette iPhone du 04/11/2026 — décisions de Hermann », « Modales iOS des Catalogues ».] Cette règle est commune à tous les contrats ci-dessous. L’exception de CE-UI-10 concerne uniquement la roulette inline, jamais la couleur ou l’opacité du voile. `compositionDraggedCardShadow` (`color/overlay-scrim`, #14171F) est réservé à l’ombre de la carte déplacée. Voir [traçabilité et captures](../MATRICE-VOILE-MODAL-2026-10-07.md).

Hors CE-UI-10 (roulette déployée dans la feuille), roulette ouverte : **modale basse standardisée** avec scrim bloquant arrière-plan et scroll ; CTA principal fixe reste visuellement normal mais fonctionnellement et accessibilité-inactif ; `Annuler` restaure ; `Confirmer` applique puis recalcule. Les valeurs restent brouillon jusqu’à confirmation.

#### 4.7 Swipe contextuel

Swipe gauche : la carte suit le doigt et révèle progressivement les actions derrière. Une seule carte peut exposer ses actions. Les autres contrôles restent actifs, mais un autre swipe gauche n’ouvre pas un second contexte. Tap fond = aucun effet. Tap surface de carte ouverte hors actions = aucun effet. Seul un swipe droit commencé sur la carte ouverte referme.

#### 4.8 Cartes structurelles Composition

`Compte à rebours initial` et `Fin de séance` : jamais déplaçables, aucun appui long, aucune poignée de drag.

#### 4.9 Transition canonique

Avancement vers l’écran suivant : cible entre depuis la droite, écran courant sort vers la gauche. Ne pas recréer localement une autre animation.

#### 4.10 Référentiels — appui long et suppression

Les modales `Étiquettes`, `Catégorie` et `Zones corporelles` partagent le même contrat :

- appui court : Étiquette marquée au toucher (nouveau toucher : démarquée) puis confirmée par ✓ (D-355) ; Catégorie d’Exercice marquée au toucher puis confirmée par ✓ (D-343) ; choix multiple Zones sélectionné/désélectionné puis confirmé ;
- appui long : aucun changement de sélection ni désaffectation ; ouverture d’un `Overlay / Decision Dialog` proposant `Modifier` (renommer ; couleur pour Catégorie et Étiquette) et `Supprimer` (D-259), dans la fenêtre de la feuille, sans masquer le clavier déjà affiché (D-354) ;
- titre dynamique : `Supprimer « {nom} » ?` ;
- message dynamique : si la valeur est utilisée, préciser qu’elle disparaît des nouveaux choix mais reste attachée aux objets existants, avec son nom et sa dernière couleur ; l’historique reste inchangé ;
- actions : ✕ rond en haut à gauche, puis `Modifier` (bleu Kodjo) et `Supprimer` (rouge) sur une ligne, texte blanc (D-354) ; `Supprimer` demande la confirmation destructive ci-dessus ; `Modifier` ouvre la saisie du nom de l’entrée visée, même formulaire de création ouvert (dont le texte est conservé) (et la palette pour Catégorie/Étiquette) avec les composants existants ;
- toutes les valeurs sont concernées, y compris les valeurs initiales fournies par KODJO ;
- après `Supprimer`, revenir à la modale de sélection restée ouverte, avec la valeur supprimée absente ;
- une affectation existante reste sélectionnée et peut être conservée à l’enregistrement ; une nouvelle affectation à cette valeur retirée n’est plus permise ;
- aucune restauration automatique d’une valeur supprimée au démarrage ou par migration ; créer explicitement un nom correspondant à une valeur retirée la réactive (D-257).

La recette doit couvrir au minimum une Étiquette, une Catégorie et une Zone corporelle, chacune dans un cas utilisé et non utilisé.

Références Figma : `4861:6145` (Étiquette), `4861:6259` (Catégorie), `4861:6348` (Zone corporelle).

---

#### 4.11 Cartes, médias de carte et appuis — référence courante

D-233–239 révisées par D-260 à D-264 et DSF-CARTES-ICONES-APPUIS-2026-09-30 gouvernent le rendu. Carte standard 354 sur 402, rayon 8, fond#F9FAFC/bord 0,5#CCD1E0, titre 15 Semi Bold, pastilles 20 et valeurs 16 ; marges adaptatives, aucune barre verticale hors Jour. Carte d’Exercice Catalogue/choix : gouttière permanente 64, photo recadrée centrée sans déformation ou icône de nature sans média/pendant chargement/erreur ; texte à x88 ; Catalogue replié/archivé : titre 250, lignes basses 207 ; Choix conserve sa coupe propre ; aucun Déployer. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi ; texte alternatif de la vignette égal au nom. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). La galerie d’Exécution conserve au contraire le média intégral sans recadrage. Séance sans photo hors Catalogue ; dans le Catalogue, appliquer CE-T03-01 révisé le 27/10/2026. Choix sans badge durée/heure ni Lecture/Déployer. Pauses/récupérations absentes des cartes Catalogue/choix/Composition ; prochaine planification absente des Catalogues ; données et calculs conservés.

Commandes contextuelles 34/dessin 20/cible 44, gaps 12 ou 10 en Composition ; dimensions spécifiques 48 conservées. Jour compact 298×46/48, barre 4, nature 26, titre 13, valeurs 11, Lecture 26 ; pas de déploiement. Aujourd’hui/Planifier 32 restent l’exception acceptée aprèsT04. Action au relâchement, sans attendre le retour animé ; sortie de cible annule ; stepper : maintien≈500 ms, répétition 150 ms et paliers 1/5/10 selon DSF Bip ; réduction des animations par opacité sans dilatation. Les dimensions à 402 ne sont pas des coordonnées absolues d’implémentation.

#### 4.12 Exécution — phases, commandes et finalisation partagées

Le moteur possède la source de vérité temporelle. En exécution autonome uniquement, le Compte à rebours propre et la Fin propre entourent l’Exercice complet, une fois. Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul. Référence : D-214 révisée le 12/10/2026.

| Origine | Séquence normale |
|---|---|
| ACTIVITY | Préparation système 5 s → compte à rebours propre applicable → toutes Séries/pauses du premier côté → transition SIDE_RECOVERY de durée q si bilatéral ([R-03 — Transition, reset et suspension](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-03--transition-reset-et-suspension)) → toutes Séries/pauses du second côté → Fin propre applicable → signal de fin → Synthèse |
| SESSION | Compte à rebours initial → plan avant Circuit → Circuit répété par Tours → plan après Circuit → Fin de séance → Synthèse |
| Occurrence SESSION | Exercice intrinsèque (Séries/côtés/pauses) → POST_ACTIVITY_RECOVERY positive éventuelle → point d’arrêt éventuel → suite ; aucun Compte à rebours/Fin propre |

*Texte identique à celui de la section [« Périmètre fonctionnel du MVP — Création et composition »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#périmètre-fonctionnel-du-mvp--création-et-composition) ; il n’est pas recopié ici.*

| Action/phase | Effet déterminé | Conservation |
|---|---|---|
| Réinitialiser Série unilatérale | Confirmation ; durée cible initiale en Durée, chrono 00:00 en Répétitions/échec | Cible de répétitions, temps global déjà écoulé et autres résultats conservés |
| Réinitialiser Exercice bilatéral | Portée bloc du côté courant conformément D-150, pas l’autre côté | Résultat autre côté, temps global, Tour/Cycle conservés ; reprise à la première Série du côté ([R-03 — Transition, reset et suspension](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-03--transition-reset-et-suspension)) |
| Réinitialiser récupération | Recommencer uniquement phase de récupération courante | Exercice terminé reste terminé |
| Suivant en Répétitions/échec | Terminer normalement Série courante sans confirmation de saut anticipé | Transitions prévues par le plan |
| Suivant chronométré avant terme | Confirmation ; résultat partiel si confirmé | Ne pas effacer résultats précédents ; saut du premier côté selon D-150, transition [R-03 — Transition, reset et suspension](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#r-03--transition-reset-et-suspension) |
| Suivant pendant récupération | Confirmation ; récupération partielle, Exercice terminé conservé | Pas de réexécution de l’Exercice |
| Pause / Reprendre | Suspendre / reprendre horloges actives | Position de plan et temps antérieur conservés |
| Arrêter depuis Pause | Confirmation ; clôture Interrompue et Synthèse si présentable | Instantané et résultats atteints conservés |

Instantané immuable au départ, résultats moteur clôturés une fois, puis finalisation Ressenti/Commentaire distincte et atomique. Le bouton courant de Synthèse est Enregistrer ; Terminer reste le bouton de l’éditeur Exercice. SESSION finalisé ouvre Suivi ; ACTIVITY restaure son appelant Catalogue/Calendrier. Une interruption technique sans Synthèse peut ne pas avoir de Ressenti ; une Synthèse présentée l’exige. Ni consultation média, ni paramètres de lecteur vidéo ne modifient le plan.

#### Phases internes de travail — complément commun

Les contrats ACTIVITY et SESSION appliquent les phases sous la série : enchaînement automatique sans repos, cadence continue, libellé annoncé au début si voix activée, sans retard du temps ; nouvelle annonce interrompt la précédente. Transition prioritaire en cas de coïncidence sonore. Pause conserve phase et restant ; réinitialisation repart de la première phase du périmètre de série/côté existant ; Suivant ne devient pas une commande de phase. Une subdivision ne modifie pas le poids global de la série.

Vérifier6+3 avec bip4 : bips à4 et8 ; annonces courtes/longues, voix désactivée, pause/reprise, reset et saut, deux côtés et circuit à séries alternées. La position du libellé de phase et le choix du temps affiché sur le cadran restent à préciser ; aucun layout de référence n’est déclaré qualifié pour ces nouveaux éléments.

#### 4.13 Usage des références et portée des recettes

Une frame présente peut montrer un état ancien ou incomplet. Chaque contrat distingue comportement cible, preuve graphique et limite constatée. Les recettes décrivent ce qu’il faut vérifier ; cette documentation ne constitue pas une recette réussie de l’application ni du prototype interactif. Les règles communes sont héritées par renvoi précis ; une rubrique non applicable en explique la raison. Les identifiants techniques ActivityDefinition/ACTIVITY restent inchangés et ne sont pas des libellés utilisateur.

#### 4.14 Cadence et DSF — consolidation du06/10/2026

Les références actives sont [Paramètres et brouillon d’un exercice](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#paramètres-et-brouillon-dun-exercice), [Résultats temporels et agrégation du circuit](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit), [Exécution d'une séance — Bip de cadence, progression et sécurité](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#exécution-dune-séance--bip-de-cadence-progression-et-sécurité), [Phrase de synthèse des paramètres](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrase-de-synthèse-des-paramètres) et [DSF courant](../DSF-CADENCE-2026-10-06.md). Figma fournit le layout ; Excel uniquement les formulations. Les titres de cartes approuvées restent 15, compactCardTitle15/18, cardTitle16 hors de cette famille ; pas de changement de hauteur induit par le média. Danger#D92D20 pour les confirmations destructives ; séparateur#E0E3E8 et iconNeutral#595E66. Safe Areas natives, aucune barre d’état9:41 codée en dur.

Les durées des contrats Catalogue/Composition/Calendrier utilisent leur périmètre défini : intrinsèque pour ACTIVITY, occurrences avec substitution de PN pour SESSION. Incertitude sans symbole/≈/≥ issue du calcul ; aucune formule locale ni nombre Figma recopié. Suivi/Synthèse affichent le réalisé issu de l’instantané et des accumulateurs, pas une estimation.

Bip de cadence : shell et préférences Profil conservés ; valeur 0..10 dans les deux modes, 0 = Sans, choisie par la ligne Cadence Autre | 5 s | 2 s | 1 s | Sans (RM-245). États d’exécution sans nouveau layout ; [Exécution d'une séance — Bip de cadence, progression et sécurité](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#exécution-dune-séance--bip-de-cadence-progression-et-sécurité) gouverne les signaux périodiques, nominal, Pause/Reprise et sécurité. L’ancien écran 7061:13383 de roulette est supprimé.

#### 4.15 Interface générale du 08/10/2026

Tous les contrats appliquent le [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md) pour les quatre relations verticales 18/20/13/12, les pieds d’action, les surfaces blanches des modales et les blocs de section gris sans trait. Exception 20du Profil conservée. Les dimensions internes des cartes ne sont pas remplacées par cette grille ; les cibles tactiles et Safe Areas restent indépendantes. Les coordonnées sont celles du gabarit 402×874 et se traduisent par les ancrages du shell sur les autres tailles.

La suppression du titre des contenus de planification est confirmée par le propriétaire le 08/10. Les états Calendrier multi-contenus et Programme PROG2/3 restent en construction : CE-UI-02/03 ne certifient pas leur recette ; le modèle cible et les limites figurent dans la spécification dédiée.

### CE-T03-17 — Navigation principale — inventaire DSF

#### 1. Identification

Bloc B8/B9 ; états S78–S82 ; T03-E E05–E06 ; composant `6513:20151`.

Règles applicables : RM-094, RM-109 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Garantir la même navigation globale sur T03 avec libellé `Catalogues` et icônes DSF exactes.

#### 3. Contexte d’entrée

Tous écrans utilisant Shell Bottom=Navigation.

#### 4. Contexte de sortie / destinations

Tap sur destination active/inactive ouvre la route racine correspondante selon navigation existante.

#### 5. Données affichées et source de vérité

Aucune donnée métier. État active dérivé de route.

#### 6. Classification des valeurs Figma

`Catalogues`, `Calendrier`, `Suivi`, `Communauté`, `Profil` = statiques ; icônes = composants DSF, pas données.

#### 7. Structure de l’écran

Barre Bottom Navigation canonique à cinq destinations.

#### 8. Éléments obligatoires

| Destination | Variante | Boîte | Dessin | Cible |
|---|---|---:|---:|---:|
| Catalogues | `6513:20152` | 32×32 | ≤24 centré | ≥48×48 |
| Calendrier | `6513:20168` | 32×32 | ≤24 centré | ≥48×48 |
| Suivi | `6513:20184` | 32×32 | ≤24 centré | ≥48×48 |
| Communauté | `6514:20240` | 32×32 | 24×24 centré | ≥48×48 |
| Profil | `6513:20200` | 32×32 | ≤24 centré | ≥48×48 |

#### 9. Layout déterministe

Répartition via composant DSF ; dessins centrés ; aucune substitution ou mise à l’échelle >24 pour cinq destinations.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Barre adapte largeur 360/402/440 et inset bas ; aucun chevauchement ; labels accessibles même si présentation visuelle compacte.

#### 11. États de l’écran


Cinq destinations : Catalogues, Calendrier, Suivi, Communauté, Profil ; une active. Aucune Recherche ; aucune destination créée par la variante Search du set DSF. Une modale peut conserver la navigation visible en arrière-plan, neutralisée par son overlay ; les shells d’Exécution suivent leur propre contrat.

#### 12. Contrôles et interactions

Tap navigation. Destination non disponible dans une livraison partielle doit être explicitement disabled plutôt qu’active sans action.

#### 13. Gestes

Tap uniquement ; aucun swipe/long press de navigation.

#### 14. Validation

Route courante détermine selected. Aucun état métier ne conditionne le label `Catalogues`.

#### 15. Brouillon et persistance

Aucune persistance métier. Le segment Catalogue n’est pas une propriété de la nav globale persistée au relaunch.

#### 16. Navigation et conservation d’état

Tap Catalogues ouvre espace Catalogue ; relaunch force Séances selon D-167.

#### 17. Erreurs et cas limites

Route indisponible = disabled explicite. Éviter double navigation sur double tap.

#### 18. Accessibilité

Role tab ; selected ; label exact ; ordre logique ; cibles suffisantes.

#### 19. Invariants

Premier onglet = Catalogues ; dessins ≤24 ; DSF exact ; aucune icône système de remplacement.

Aucune préférence Cadence ajoutée au Profil ; sons selon réglages existants. Barre d’état native et Safe Areas, pas9:41/95px codés en dur. DSF courant§4.14.

#### 20. Recette déterministe

Tester les cinq destinations, labels accessibles, état actif, dimensions et Safe Areas ; relance Catalogue/Séances ; aucune action ni bouton Recherche ; ne pas confondre une variante DSF inutilisée avec une route produit. [PRE-8, recette A/B E01 du 27/10/2026 : `Communauté` visible et désactivée, sans écran, tant que son écran n'est pas développé.]

### CE-UI-06 — Splash KODJO

#### 1. Identification

Splash actif 1992:469 ; unique exception aux Screen Shells standards. Anciennes propositions graphiques hors cible.

Règles applicables : RM-002, RM-109 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Présenter l’identité KODJO pendant l’initialisation locale.

#### 3. Contexte d’entrée

Démarrage de l’application nécessitant initialisation ; pas une destination de navigation.

#### 4. Contexte de sortie / destinations

Initialisation terminée → navigation initiale Catalogues/Séances ; ne pas ajouter une connexion ou un onboarding non spécifié.

#### 5. Données affichées et source de vérité

État d’initialisation locale ; identité KODJO/ANKUSHA et signature Keep On. Do Just One. depuis ressources produit.

#### 6. Classification des valeurs Figma

Logo, nom et signature statiques ; temps d’affichage dépend de l’initialisation, aucune durée de démonstration codée.

#### 7. Structure de l’écran

Identité centrée dans zone sûre ; aucun en-tête/navigation/action de formulaire.

#### 8. Éléments obligatoires

Logo proportionnel et textes d’identité représentés par 1992:469 ; aucune commande Recherche/Créer.

#### 9. Layout déterministe

Respecter centrage et proportions du Figma ; ne pas étirer le logo sur largeur écran ; fond du Splash courant.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440, centrage zone sûre ; texte agrandi lisible sans recouvrement ; aucun défilement normal.

#### 11. États de l’écran

Initialisation en cours ; prête ; échec d’initialisation pris en charge par état d’erreur technique, pas un écran vide infini.

#### 12. Contrôles et interactions

Aucune action sur logo/texte ; transition automatique quand l’initialisation est prête.

#### 13. Gestes

Aucun geste métier ni swipe de navigation.

#### 14. Validation

Ne pas ouvrir les Catalogues avant disponibilité du stockage requis ; ne pas retarder artificiellement pour reproduire une durée Figma.

#### 15. Brouillon et persistance

Aucun brouillon ni préférence persistée par Splash ; migrations/chargement relèvent du démarrage technique.

#### 16. Navigation et conservation d’état

Ne pas empiler Splash dans le retour utilisateur ; la reprise courante conserve le contexte si aucune initialisation n’est requise.

#### 17. Erreurs et cas limites

Échec stockage/migration : signaler échec selon architecture, sans effacer les données. Présentation graphique d’erreur sans frame : preuve manquante V-06.

#### 18. Accessibilité

Nom de l’application annoncé une fois ; éviter annonces répétées pendant chargement ; logo avec texte alternatif utile, signature non dupliquée.

#### 19. Invariants

Une seule référence Splash active ; aucune création de compte ; aucun timeout de maquette transformé en règle métier.

#### 20. Recette déterministe

Démarrage prêt/lent/échec ; proportions et centrage aux trois largeurs ; pas de navigation avant prêt, pas de Splash au retour Catalogue ; erreur ne détruit pas stockage.

### Splash KODJO

Le splash affiche exactement `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien`. Il ouvre automatiquement le `Catalogue des séances` dès que l’initialisation nécessaire est prête, sans attendre une durée fixe de démonstration ; le fondu `DISSOLVE` illustré par Figma est une référence de transition visuelle, pas une attente métier imposée (CE-UI-06). Le type `Séances` est sélectionné ; le Catalogue présente l’état vide lorsqu’aucune Séance non archivée n’existe, sinon la liste par défaut alimentée par les données locales.

## Sujets transverses

### CE-T03-03 — Catalogue — action `Créer` contextuelle

**Complément Formats actif :** Tabata et 30/30 standards modifiables ; contraintes effectives des Formats spécialisés selon CE-FMT-04 et la référence du 02/11.

#### 1. Identification

Contrat d’action, sans écran intermédiaire. Bouton Créer dans les Catalogues 1992:9910 et 3786:5093. Les arbres historiques 3787:5148/3841:8375 ne sont pas des destinations.

Règles applicables : RM-015, RM-109, RM-FMT-02 (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)

#### 2. Finalité fonctionnelle

Ouvrir directement la création de l’objet correspondant au Catalogue courant, sans écran ni arbre intermédiaire.

#### 3. Contexte d’entrée

Tap `Créer` depuis le Catalogue courant. Le type de Catalogue affiché détermine la destination.

#### 4. Contexte de sortie / destinations

Exercices → CE-T03-04 en création ; Séances → CE-T03-08 en création. Aucun troisième segment n’est présenté. Annuler le formulaire ouvert restaure le Catalogue appelant sans créer d’objet.

#### 5. Données affichées et source de vérité

Aucun écran intermédiaire et aucune donnée métier intermédiaire. La destination est dérivée du type de Catalogue courant.

#### 6. Classification des valeurs Figma

`Créer` est un libellé statique obligatoire. Les anciennes valeurs de l’arbre `Un nouvel exercice / Une séance / Un parcours / Annuler` ne sont plus des contrôles de l’interface des Catalogues.

#### 7. Structure de l’écran

Aucune structure d’écran supplémentaire : le tap sur `Créer` déclenche directement la navigation vers le parcours de création correspondant.

#### 8. Éléments obligatoires

Le bouton `Créer` reste dans la rangée commune `Créer / Filtrer / Trier`. Aucun scrim, aucune liste d’options et aucun bouton `Annuler` intermédiaire ne sont affichés.

#### 9. Layout déterministe

La géométrie de la rangée Catalogue reste celle de §4.5. La suppression de l’écran intermédiaire ne modifie pas les dimensions ni l’alignement du bouton `Créer`.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Appliquer les règles du Catalogue courant. Aucun layout responsive propre à un écran intermédiaire n’existe.

#### 11. États de l’écran

Action disponible depuis les Catalogues actifs. Dans T03 : `Exercices` et `Séances`. Aucun troisième segment n’est présenté.

#### 12. Contrôles et interactions

Un tap sur `Créer` produit une navigation directe. Aucun second choix utilisateur n’est demandé avant d’entrer dans le parcours de création.

#### 13. Gestes

Tap simple sur `Créer`. Aucun geste ou scrim intermédiaire.

#### 14. Validation

Aucune validation métier avant l’entrée dans le parcours de création. Les validations propres à l’objet créé restent dans son écran de création.

#### 15. Brouillon et persistance

Le brouillon du nouvel objet peut être initialisé au déclenchement du parcours de création. Aucune donnée persistée n’est créée par le seul tap sur `Créer`.

#### 16. Navigation et conservation d’état

Transmettre le segment appelant, les filtres et le scroll au formulaire. Retour avant validation : les restituer. Succès Séance : Catalogues/Séances ; succès Exercice : Catalogues/Exercices.

#### 17. Erreurs et cas limites

Si le parcours cible ne peut pas être initialisé, aucune donnée partielle n’est persistée et le Catalogue d’origine reste utilisable.

#### 18. Accessibilité

`Créer` expose son rôle de bouton et un libellé accessible. La navigation directe supprime tout ordre de focus propre à l’ancien arbre.

#### 19. Invariants

Destination déterminée par le Catalogue courant ; aucun écran/arbre intermédiaire ; aucun choix transversal d’un autre type d’objet ; Parcours non activés par cette règle en T03.

Action Créer contextuelle conservée D-187 ; ancien arbre Un circuit retiré, Parcours absent du Catalogue. Aucune règle Cadence ajoutée à ce contrôle.

#### 20. Recette déterministe

Depuis chaque segment actif, un tap ouvre exactement le formulaire correspondant ; aucun arbre. Annuler ne crée rien ; double tap n’empile pas deux formulaires ; aucun segment Parcours, aucune cible ni annonce accessible résiduelle.

### Clôture des réserves fonctionnelles des contrats

Les arbitrages des 30 septembre et 1er octobre 2026 ferment les points fonctionnels ci-dessous. Ils ne valent ni recette de l’application ni validation de preuves Figma absentes. Aucun shell, composant, placement ou parcours n’est redessiné.

#### R-01 — Progression et estimation

*Texte identique à celui de la section [« Informations affichées — Barre de progression globale »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#informations-affichées--barre-de-progression-globale) ; il n’est pas recopié ici.*

*Texte identique à celui de la section [« Durée estimée d’exécution »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#durée-estimée-dexécution) ; il n’est pas recopié ici.*

#### R-02 — Validation des contrôles existants

- Planifier : fréquence entière de 1 à 12 semaines incluses ; − inactif à 1 et + inactif à 12 ; toute valeur extérieure est refusée à l’enregistrement.
- Rappel Autre : délai strictement positif, maximum 24 h (1 440 minutes), avec les unités et le sélecteur existants. L’interrupteur Rappel désactive le rappel, l’option Aucun étant supprimée (D-330) ; zéro ne crée pas une deuxième manière de désactiver le champ. Une notification dont l’échéance est déjà passée n’est pas envoyée rétroactivement ; les futures occurrences conservent leur rappel.
- Durée de l’exercice (libellé visible de la ligne de durée totale, D-409) : conserver le sélecteur minutes/secondes. La borne dérivée est T(1)..T(99) pour les paramètres courants, et non 58 min 55 s (borne par Série). La colonne minutes doit représenter T(99), sans nouvelle colonne ni nouveau contrôle. Granularité seconde ; le calcul inverse existant choisit N dans 1..99, arrondi .5 vers le haut, puis affiche T(N) et le message d’ajustement si nécessaire. En Durée uniforme, une diminution à N=1 ne masque le total du résumé que s’il égale effectivement la cible ; la ligne Durée de l’exercice reste présente dans la feuille dans tous les modes et tous les états de saisie, y compris à N = 1 ; elle affiche « — » lorsqu’une cible nécessaire au calcul manque (D-396, D-384) ; elle affiche « Non calculable » lorsqu’aucune durée totale n’est calculée, en Répétitions sans bip et quand toutes les cibles sont À l’échec, cet état primant sur « — » ; le symbole ≈ ou ≥ précède immédiatement la valeur (D-433, qui remplace le masquage de D-397 et le cas « sans ligne Durée de l’exercice affichée » de RM-246).
- Profil : les paramètres identiques héritent des mêmes bornes que leur champ cible, sans maximum tiré des valeurs d’exemple, sauf D-265. Compte à rebours initial/Fin de séance : 0..60 s, pas 1 s, pour les champs de la Séance (D-443, qui remplace la borne 0..3599 s de D-089) comme pour leurs valeurs par défaut du Profil (D-265) ; Compte à rebours d’exercice/Fin d’exercice : 0..60 s, pas 1 s (D-256) ; pauses et récupération : 0..300 s ; le contrôle et ses pas restent ceux du DSF et, pour les steppers, de D-312 (D-386). Les valeurs initiales déjà validées ne changent pas.

#### R-03 — Transition, reset et suspension

*Texte identique à celui de la section [« Déroulement d’un Exercice »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#déroulement-dun-exercice) ; il n’est pas recopié ici.*

*Texte identique à celui de la section [« Périmètre fonctionnel du MVP — Création et composition »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#périmètre-fonctionnel-du-mvp--création-et-composition) ; il n’est pas recopié ici.*

La source active est chapitre 08, paramètres d’exercice ; D-242 est supersédée. Les tests PRE-1 restent figés sur leur source historique.

*Texte identique à celui de la section [« Portée transverse des paramètres v13 »](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#portée-transverse-des-paramètres-v13) ; il n’est pas recopié ici.*

Pause de sécurité : sans réponse au choix Reprendre/Arrêter, l’exécution reste suspendue, son état est conservé et son temps n’avance plus. Aucun délai d’arrêt automatique supplémentaire.

#### R-04 — Suppression d’une occurrence périodique

Le comportement utilisateur est déjà fixé. L’exclusion d’une occurrence identifiée par Routine et date/heure d’origine doit être persistée, survivre à la relance et au recalcul, et retirer sa notification. Les autres occurrences et l’historique restent conservés. La mutation doit être atomique et idempotente ; en cas d’échec, l’interface ne simule pas un succès. Modèle et API doivent satisfaire ce contrat ; le choix de stockage relève du développement et ne requiert aucun nouvel écran ni arbitrage de design. La recette doit prouver relance, recalcul et notifications ; elle n’est pas réputée exécutée par cette clôture documentaire.

### Référentiel élémentaire T03 et couverture

| ID | Contenu élémentaire |
|---|---|
| E01 | Catalogue cible Mouvements / Séances / Programmes (CE-T03-01, 27/10/2026) |
| E02 | Séances sélectionné par défaut/relaunch |
| E03 | Vue Un exercice dans la collection de séances ; catalogue autonome d’exercices retiré |
| E04 | Trois segments du Catalogue, sans généralisation aux modales Choix |
| E05 | Navigation basse `Catalogues` |
| E06 | Icônes navigation conformes DSF |
| E07 | Lister ActivityDefinition |
| E08 | Absence de recherche globale ou locale MVP (D-221) |
| E09 | Catalogue séances : Filtre / Tri / Créer ; filtres Statut / Catégories / Zones corporelles / Étiquettes / Format ; disponibilité du tri inchangée |
| E10 | Préserver filtres/tri/scroll pendant aller-retour |
| E11 | Ne pas conserver au relaunch |
| E12 | Ouvrir ActivityDefinition en consultation/modification |
| E13 | Créer ActivityDefinition depuis Catalogue |
| E14 | Modifier ActivityDefinition |
| E15 | Archiver ActivityDefinition |
| E16 | Restaurer ActivityDefinition |
| E17 | Supprimer définitivement depuis archives |
| E18 | Aucune cascade vers copies/historique |
| E19 | Créer contextuel Catalogue |
| E20 | Exercices → création directe ActivityDefinition |
| E21 | Séances → création directe Séance |
| E22 | Ajouter depuis Composition ouvre directement la sélection Catalogue |
| E23 | Création locale SessionActivity conservée techniquement, non exposée dans ce parcours |
| E24 | Pas Enregistrer dans Catalogue T03 |
| E25 | Multi-sélection ActivityDefinition |
| E26 | Validation disabled sélection vide |
| E27 | Compteur sélection |
| E28 | Ordre insertion = liste filtrée |
| E29 | Copie indépendante |
| E30 | Copier tout état métier applicable |
| E31 | Retour Composition enrichie |
| E32 | Bouton Lecture Activity |
| E33 | Aucun Déployer d’Exercice, avec ou sans média (D-261) |
| E34 | Gouttière permanente Exercice ; déploiement réservé aux Séances Catalogue/Semaine |
| E35 | Zone droite réservée identique |
| E36 | Pas poignée Catalogue Activity |
| E37 | Execution origin ACTIVITY |
| E38 | Snapshot autonome immuable |
| E39 | Préparation fixe 5 s |
| E40 | Séries / pauses / côtés / SIDE_RECOVERY / phases propres |
| E41 | Réutiliser règles bilatérales existantes |
| E42 | Pas Session artificielle |
| E43 | Pas SESSION_END |
| E44 | Signal fin → Synthèse |
| E45 | Ressenti obligatoire |
| E46 | Commentaire facultatif |
| E47 | Suivi type Exercice |
| E48 | Stats compatibles sans compter Séance |
| E49 | Retour au contexte appelant ACTIVITY avec état restauré |
| E50 | Résumé des paramètres sans nom ; valeurs dynamiques, saisie exclusivement CE-UI-10 |
| E51 | Deux modes × deux types de cible × Bip nul/positif : exact Durée, ≈ Répétitions avec bip, omitted Répétitions sans bip et À l’échec ; ≥ pour mélange calculable à l’Exercice |
| E52 | À l’échec : aucune Durée totale dans le texte éditable |
| E53 | Pas de texte développé du changement de côté sur les cartes Composition (D-407) |
| E54 | Feuille de paramètres bloque arrière-plan ; roulette déployée sous sa ligne |
| E55 | CTA visible normal mais fonctionnel/accessibilité disabled |
| E56 | Annuler la feuille restaure tout le brouillon parent |
| E57 | Valider la feuille applique les paramètres et régénère le résumé sans sauvegarde DB |
| E58 | Swipe gauche déplace carte |
| E59 | Actions révélées progressivement |
| E60 | Swipe droit ferme seulement carte ouverte |
| E61 | Autres contrôles restent actifs |
| E62 | Une seule carte expose actions |
| E63 | Dupliquer arrondi + gap fond Circuit |
| E64 | CR initial non déplaçable |
| E65 | Fin séance non déplaçable |
| E66 | Aucun long press/poignée cartes structurelles |
| E67 | Continuer de Composition → Catalogue séances ; Étiquette facultative en modale |
| E68 | Segment Séances sélectionné |
| E69 | Transition canonique droite→gauche |
| E70 | Migration sans promotion SessionActivity |
| E71 | Consultation galerie média MVP selon D-203 ; ajout/import activés dans PRE-3 par D-333 |
| E72 | Parcours fonctionnels hors T03 |
| E73 | Valeurs Figma démo non codées en dur |

#### Couverture des contenus élémentaires

| Plage | Contrats propriétaires |
|---|---|
| E01–E06 | CE-T03-01, CE-T03-17 |
| E07–E12 | CE-T03-02 |
| E13–E14 | CE-T03-04 |
| E15–E18 | CE-T03-05 |
| E19–E21 | CE-T03-03 |
| E22–E24 | CE-T03-06 |
| E25–E31 | CE-T03-07/08 |
| E32–E36 | CE-T03-02/09 |
| E37–E49 | CE-T03-09..15 |
| E50–E57 | CE-T03-04 |
| E58–E63 | CE-T03-02/05/08 |
| E64–E66 | CE-T03-08 |
| E67–E69 | CE-T03-01/16 |
| E70 | invariant non visuel 09 + contrats de persistance |
| E71 | CE-MEDIA-EXEC-01/02, CE-T03-04 |
| E72 | CE-T03-01/03 |
| E73 | règle commune §4.1 + tous contrats données |

Chaque contenu E01–E73 est rattaché ci-dessus ; E08 est rattaché à CE-T03-02/17 et §4.3. E70 n’a volontairement pas d’écran artificiel.


### CE-UI-NIV-01 — Niveaux — choisir, ajouter, réordonner

#### 1. Identification

CE-UI-NIV-01. Popover `10027:40760`, Changer déployé `10152:20245`, Ajouter déployé `10152:20369`, Ordre `10085:20050`. Règles N01–N07 et D-445 / MFN-05 à MFN-09.

#### 2. Finalité fonctionnelle

Consulter la progression, choisir un autre niveau, en ajouter un ou en réordonner les membres.

#### 3. Contexte d’entrée

Commande Niveau active depuis le formulaire Catalogue, création ou séance, indépendamment du crayon. Sans groupe : Niveau, ajout de première progression possible. Le choix d’un niveau ne déclenche pas un reclassement du mouvement courant.

#### 4. Contexte de sortie / destinations

Catalogue : consulter un exercice du mouvement choisi, sans transformer l’origine ; si plusieurs exercices, choix explicite. Séance : préparer un remplacement puis retour au brouillon. Ajouter : création d’un mouvement et d’un exercice. Réordonner : écran Ordre.

#### 5. Données affichées et source de vérité

Identifiant du mouvement, groupe et ordre courant ; rang et total calculés. Nom, média, description du candidat ; aucun rang persistant dans les copies. Les occurrences lisent le contenu courant ; les instantanés conservent le contenu exécuté.

#### 6. Classification des valeurs Figma

Libellés Changer / Ajouter / Réordonner statiques [remplacé par D-448 du 26/10/2026 : libellé du sous-menu des niveaux selon le contexte — « Naviguer vers » au Catalogue en modification, « Changer de niveau » en séance et en reprise ; « Ajouter un niveau » et « Réordonner les niveaux » statiques]. Noms, descriptions, rangs, comptes et photos dynamiques. Squats et Niveau 3 sont des exemples.

#### 7. Structure de l’écran

Popover à trois options ; Changer et Ajouter se déploient en place, chevrons droite/bas. [remplacé par D-448 du 26/10/2026 : trois entrées de premier niveau dans tous les contextes — sous-menu des niveaux intitulé « Naviguer vers » au Catalogue en modification et « Changer de niveau » en séance et en reprise ; « Ajouter un niveau » (Plus facile / Plus difficile) ; « Réordonner les niveaux », hors du sous-menu des niveaux, disponible à partir de deux niveaux] Ordre : rang fixe à gauche, carte avec vignette, nom et description sur deux lignes.

#### 8. Éléments obligatoires

Commande Niveau visible même sans groupe ; choix explicite de difficulté pour créer ; sélection explicite de mouvement pour remplacer. Aucun passage automatique au niveau suivant.

#### 9. Layout déterministe

Carte Mouvement `10124:21979`, variante adaptée à la sélection. Les trois variantes icon/niveau ne limitent pas la progression. Rendu des rangs supérieurs et comptes à harmoniser selon le relevé.

#### 10. Responsive, Safe Areas, texte, scroll et clavier

Liste défilante, noms longs tronqués visuellement mais complets pour l’accessibilité ; cibles tactiles conservées. Aucun clavier nécessaire pour choisir/réordonner, clavier du formulaire pour créer.

#### 11. États de l’écran

Sans groupe ; deux membres ; groupe singleton ; trois et plus de trois niveaux ; sélection ; ajout plus facile / difficile ; réordonnancement ; source indisponible ; durée manquante après remplacement.

#### 12. Contrôles et interactions

Choix difficulté = insertion avant/après l’origine. Changer dans une séance : nouvelle occurrence dans le brouillon, durée transférée par rang, complément des seules valeurs manquantes. [31/10/2026, A.2b — réponse de Hermann : « les durées par défaut de toutes les phases sont reprises ». Lecture appliquée : lors d'un changement de niveau, toute phase du mouvement choisi qui porte une durée par défaut la reçoit (elle remplace la durée locale du même rang) ; une phase sans durée par défaut suit la règle ci-dessus (durée locale du même rang, sinon vide). Voir ch07 « A.2b et B.4b — précisions de Hermann du 31/10/2026 ».] Les paramètres indépendants du mouvement restent modifiables.

#### 13. Gestes

Tap pour ouvrir, choisir et déployer ; déplacement des lignes pour réordonner. Prévoir commandes accessibles équivalentes au déplacement ; ne pas inférer d’une poignée un autre geste métier.

#### 14. Validation

Aucun niveau créé seul ; enregistrement atomique du nouveau mouvement, de son exercice et du groupe. Paramètres valides avant validation du remplacement. Aucune confirmation de correction de l’origine pour une variante explicite.

#### 15. Brouillon et persistance

Annulation de création/remplacement sans résidu. Reclassement ne change ni identité ni relevés ; les modalités de validation/annulation du réordonnancement non montrées par Figma restent à préciser, sans inventer de bouton.

#### 16. Navigation et conservation d’état

Retour au contexte Catalogue ou séance, avec position et paramètres conservés. La fermeture d’une sélection sans validation ne remplace rien.

#### 17. Erreurs et cas limites

Groupe singleton après disparition subie (archivage ou suppression) = état vide, appartenance conservée. Après détachement explicite du dernier couple, les deux mouvements sont sans groupe (D2–D4 du 28/10, CE-MVT-03). Le mouvement doit exister pour une définition ou occurrence vivante ; ne pas inventer de contenu de remplacement. Un mouvement sans exercice reste recherchable. Une filiation d’instantané peut être orpheline sans empêcher sa lecture ; les exécutions ne sont jamais réattribuées par nom.

#### 18. Accessibilité

Annoncer Niveau X sur Y, action et sélection. Ne pas utiliser la couleur seule ni annoncer les trois segments comme le total réel. Actions accessibles de déplacement à compléter dans la maquette.

#### 19. Invariants

Un groupe linéaire au plus par mouvement ; rangs dérivés, aucun plafond métier, records séparés. Contenu courant partagé entre définitions et séances, paramètres locaux ; instantanés et exécution déjà démarrée figés. Rattacher/détacher/supprimer : périmètre MVP différé C08, aucune exclusion décidée.

#### 20. Recette déterministe

Première variante facile : origine 2 / variante 1 ; difficile : origine 1 / variante 2. Réordonner recalcule tous les affichages sans toucher les relevés. Tester singleton, quatre cas de phases, annulation et source supprimée. Recette automatisée requise au développement ; non exécutée par cette mise à jour documentaire.


### Phases — clarification PHC-20261026

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. [remplacé par D-446 du 26/10/2026 : les phases sont aussi compatibles avec les séries variables ; une seule séquence de phases et de durées, commune à toutes les séries] La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

Référence normative : [PHC-20261026](../KODJO-Phases-Guidage-Cyclique-2026-10-26.md). La règle Répétitions sans bip = non calculable concerne désormais les exercices sans phases : avec phases, R × durée du motif donne une estimation nominale, jamais une mesure. Arrêt mixte et guidage après objectif avant Suivant restent les deux points distincts décrits dans cette référence. [clos par D-446 du 26/10/2026 : l’arrêt mixte se représente par les séries variables, avec phases ; en Répétitions chiffrées, le motif continue de boucler, sans signal, entre la cible et Suivant] Les anciennes captures sont des preuves datées ; alignement Figma et code non revendiqué.

Les contrats d’exécution ACTIVITY et SESSION appliquent PHC-20261026 : bouclage du motif, phase courante affichée, objectif temporel prioritaire même au milieu d’une phase ; Répétitions et échec terminés par Suivant. Nouvelle série à la première phase. Recette PHC/AC01–12 ; comportement après nombre cible avant Suivant explicitement à préciser, sans fin automatique inventée. [précisé par D-446 du 26/10/2026 (Q4) : le motif continue de boucler, sans signal, jusqu’à Suivant]


### Contrôle transversal de navigation — 27 octobre 2026

La référence courante est le composant `6513:20151`, utilisé sur les 62 écrans recensés de Prototype MVP. Le [relevé exhaustif](../DSF-NAVIGATION-CINQ-DESTINATIONS-2026-10-27.md) associe chaque écran à sa capture courante et au contrat commun CE-UI-05, et fournit les dix exports SVG disponibles dans `KodjoIcon`. La présence de Communauté dans la barre ne vaut pas spécification de ses fonctionnalités ; une destination non livrée reste explicitement désactivée. Les anciennes preuves datées à quatre destinations ne constituent plus la cible.


<a id="ce-fmt-05"></a>
### CE-FMT-05 — Actions du Circuit et réédition du modèle

**Règle.** Dans la Composition, un **glissé à gauche sur un Circuit replié** révèle **Renommer | Dupliquer | Supprimer** pour un Circuit composé à la main ou sans Modèle d'origine ; un Circuit issu d’un modèle propose **Renommer | Modifier le format | Dupliquer | Supprimer** (§7.9), sur le modèle du glissé d'un Exercice. Le Circuit déplié ne se glisse pas : le geste déplacerait tout le bloc et entrerait en concurrence avec le glissé des Exercices qu'il contient. Le Cycle n'est pas concerné : il n'est jamais replié.

**Présentation.** Le cadre du Circuit glisse à gauche avec son contenu et s'arrête à 8 px de Renommer. Les boutons ont la hauteur du cadre et forment un seul bloc : Renommer (bleu KODJO) arrondi à gauche, Modifier le format (violet, pour un Circuit issu d’un modèle) et Dupliquer (gris) à coins carrés, Supprimer (rouge) arrondi à droite, avec le rayon du cadre du Circuit.

- **Nom du Circuit** : nouvel attribut du Circuit. Par défaut : le nom de son **Modèle d'origine** pour tout Circuit créé par un modèle, porteur (« AMRAP », « For time ») ou standard (« Tabata », « Superset ») ; « Circuit » pour un Circuit composé à la main. Le nom ne remplace que le titre : la deuxième ligne garde l'organisation (« AMRAP · 1 bloc · groupées »), et renommer ne modifie ni le Format ni sa nature. L'appui sur le titre et le chevron reste réservé au repli et au dépliage ; le nom ne se modifie que par l'action Renommer.
- **Renommer** : le titre passe en saisie en ligne, avec le clavier ; validation par la touche Retour ; un nom vide reprend le nom par défaut. [Précisé le 04/11/2026, recette iPhone (Hermann : « Renommer : le circuit doit se retrouver au dessus du clavier et être visible ») : pendant la saisie, la Composition défile pour que le Circuit soit visible au-dessus du clavier.]
- **Dupliquer** : la copie est insérée juste après l'original, repliée, avec tous ses Exercices et réglages, y compris le Format porté et le Modèle d’origine ; elle est indépendante de l'original. Son titre passe aussitôt en saisie, prérempli avec le nom d'origine suivi de « (C) » (« Circuit (C) ») et sélectionné : l'utilisateur tape un nouveau nom ou valide. [Précisé le 04/11/2026, recette iPhone (Hermann : « Dupliquer : après la duplication, les options doivent se refermer ») : les actions de l'original se referment.]
- **Supprimer** : confirmation « Supprimer ce circuit ? », « Le circuit et ses N exercices seront supprimés de la séance. », Annuler / Supprimer. La confirmation se justifie parce qu'une erreur de geste fait perdre plusieurs Exercices.

**Écrans :** « Composition séance — Circuit replié, actions glissées » (trois actions), « Composition séance — Circuit issu d'un format, actions glissées » (quatre actions), « Composition séance — Circuit replié, suppression (confirmation) », « Composition séance — Circuit dupliqué, saisie du titre ».

### 7.9.1. Règle

Le glissé à gauche sur un **Circuit replié issu d'un modèle** (Modèle d'origine renseigné) révèle une quatrième action, **« Modifier le format »**, entre Renommer et Dupliquer : **Renommer | Modifier le format | Dupliquer | Supprimer**. Un Circuit composé à la main garde les trois actions.

« Modifier le format » ouvre la **modale du récapitulatif** du modèle, préremplie avec l'état actuel du Circuit. Le bouton Retour mène au questionnaire, pour changer la structure (par exemple l'Exécution) ; « Valider les paramètres » ramène au récapitulatif. Le bouton du récapitulatif s'intitule **« Enregistrer les modifications »** et suit la même règle d'activation que « Enregistrer dans la séance » (§7.6). L'enregistrement met à jour le Circuit existant ; fermer sans enregistrer ne change rien. [06/11/2026 : enregistrement porté par la coche ; bouton « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire, coche du questionnaire alors grise — D-499 précisée le 06/11/2026.]

### 7.9.2. Origine du Circuit

- **Modèle d'origine** : le Circuit garde le modèle qui l'a créé. Ce champ est **distinct** de « Format d'origine », qui reste propre aux Circuits porteurs et gouverne leur exécution (§7.9.7) ; il est renseigné pour tous les Circuits créés par un modèle :
  - Circuits porteurs : AMRAP, For time, EMOM, Death by (déjà connus) ;
  - Circuits standards créés par un Format : Tabata, 30/30, Superset, Renforcement, Progression, À l'échec, et les exécutions « À la suite » (§1.1 du présent document).
- Un Circuit sans Modèle d'origine (composé à la main) n'a pas l'action.
- Le Modèle d'origine n'est pas modifiable et ne change rien à l'exécution du Circuit standard ; il sert uniquement à rouvrir le bon questionnaire.

### 7.9.3. Préremplissage

- Le questionnaire et le récapitulatif sont **reconstruits à partir de l'état actuel** du Circuit et de ses Exercices ; les réponses d'origine ne sont pas stockées.
- Ils montrent donc ce qui sera exécuté, y compris les modifications faites après coup (valeurs, Exercices ajoutés ou retirés, Rôles).
- Les réponses se déduisent des champs : durée et nombre de blocs, nombre de tours, nature, présence d'un buy-in ou buy-out (Rôles), volume croissant (incrément non nul), « Avec charge » (§7.9.7), objectifs et charges des tableaux.

### 7.9.4. Enregistrement

- Le Circuit est **mis à jour en place**, pas recréé : mêmes identifiants d'Exercices, même position dans la Séance, même nom du Circuit.
- Seuls les champs **effectivement modifiés** dans le questionnaire et le récapitulatif sont mis à jour. Les autres sont **conservés** : phases, cadence, côtés, réglages faits dans la modale de l'Exercice.
- **Changement de structure** (par exemple EMOM « dans chaque intervalle » vers « à la suite ») : la règle d'entrée dans un Circuit s'applique (§6). Les paramètres compatibles sont conservés, les autres passent « à renseigner », et « Enregistrer les modifications » reste inactif tant qu'ils manquent. Aucune confirmation de perte supplémentaire. Le Format d'origine suit la nouvelle structure (renseigné pour un Circuit porteur, vide pour un Circuit standard) ; le Modèle d'origine et le nom du Circuit sont conservés. [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]
- **Fermer sans enregistrer** (Retour vers le questionnaire, puis croix) : aucune modification n'est appliquée.

### 7.9.5. Ce qui ne change pas

- Instantanés déjà figés, historique et records existants : aucun effet rétroactif. Les prochains lancements utilisent la configuration modifiée. L'instantané d'une Séance est figé au démarrage.
- Les autres actions glissées (Renommer, Dupliquer, Supprimer) et leurs règles.

### 7.9.6. Écrans Figma

- « Composition séance — Circuit issu d'un format, actions glissées » : quatre actions de 70 px ; « Modifier le format » en violet, coins carrés ; exemple sur un Circuit « Tabata ».
- « Tabata — Récapitulatif rouvert depuis la Composition » : récapitulatif prérempli, bouton « Enregistrer les modifications ». [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]

### 7.9.7. Représentation de l'état courant dans le formulaire

- Les dix modèles comportent Avec charge au questionnaire, désactivé par défaut ; la charge reste facultative et locale au mouvement. Progression/For time/Superset/EMOM : charges par série/tour ; autres : charge commune. (+ kg)/(− kg) et valeurs (12 kg), (—). Restauration des états et valeurs masqués dans le même brouillon avant sauvegarde ; vider efface réellement. Une ouverture ultérieure lit l’état enregistré ; aucune nouvelle mémorisation de réponses du questionnaire.
- **Réglages hétérogènes.** Quand un réglage commun du questionnaire ou du récapitulatif (nombre de séries, travail par série, pause, intervalle, valeurs par série…) ne correspond pas à une valeur unique parce que les Exercices ont des valeurs différentes :
  - le champ commun affiche **« variable »**, dans le style d'une valeur modifiable ;
  - les valeurs propres à chaque Exercice sont **conservées** à la réouverture et visibles là où le récapitulatif les détaille (tableaux, déroulé) ; elles ne sont jamais uniformisées automatiquement ;
  - seule une **modification explicite** du champ commun (saisie d'une valeur) remplace les valeurs de tous les Exercices concernés ; une confirmation courte l'annonce, puisque des valeurs personnalisées sont écrasées ;
  - « variable » n'est pas une valeur « à renseigner » : il ne bloque pas « Enregistrer les modifications ». [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]
- **Modèle d'origine et Format d'exécution.** Le modèle technique distingue l'information qui permet de rouvrir le parcours (Modèle d'origine) et les paramètres qui gouvernent l'exécution (Format d'origine d'un Circuit porteur, paramètres standards). Un Circuit standard issu d'un modèle conserve son exécution standard ; son origine ne lui attribue aucun Format partagé.

### 7.9.8. Vérifications attendues

- Réouverture avec les valeurs actuelles, y compris après modification individuelle d’un Exercice.
- Enregistrement en place : conservation des identifiants des Exercices conservés, du nom, de la position et des réglages hors périmètre des champs effectivement modifiés.
- Fermeture et retour sans enregistrement : aucune modification de la Composition.
- Changement de structure : conservation des paramètres compatibles, paramètres incompatibles à compléter, validation inactive si des valeurs obligatoires manquent, sans confirmation de perte supplémentaire.
- Circuit manuel ou ancien Circuit sans Modèle d’origine : absence de l’action.
- Avec / Sans charge repris de l'état effectif ; charges conservées en « Sans » sans réactivation.
- Réglage hétérogène affiché « variable », valeurs conservées, remplacement seulement sur saisie explicite.
- Duplication : conservation du Modèle d’origine et indépendance de la copie.

---

Références Figma : `11551:21479`, `11551:21673`, fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`. Contrat applicable avec CE-FMT-02 (questionnaire/récapitulatif) et CE-FMT-04 (modales). Les garde-fous métier sont au chapitre 10, ancre formats-reedition-roles-charges.

#### Complément CE-FMT-02 et CE-FMT-04 — tableaux et saisie

**EMOM — tableau et validation du 5 novembre.** Tableau Unité | S1…Sn, quatre colonnes visibles au plus, nom et unité fixes ; chaque série porte sa cible et sa charge. Pas de champ d’incrément d’objectif ni de charge. Création : valeurs de S1 reprises initialement ; nouvelles séries ajoutées après coup à compléter selon les règles existantes ; réouverture sans réinitialisation. Pour chaque rang/fenêtre, travail connu en Durée incluant deux côtés et pause entre côtés applicable ; somme des membres dans un intervalle commun, intervalle local sinon. Atteinte ou dépassement de l’intervalle bloque la validation (message et cadres rouges), y compris après modification en Composition ; aucune durée inventée pour les membres en Répétitions.

**Règle.** Les questionnaires For time, AMRAP et EMOM comportent le même interrupteur **« Avec charge »** que la Progression, **désactivé par défaut** : la charge est souvent prescrite dans ces formats (par exemple Fran, thrusters à 43 kg ; kettlebell en AMRAP ou EMOM). Il n'existe que dans le questionnaire.
- **Activé, For time** : présentation et fonctionnement identiques à la Progression : colonne Unité, une colonne par tour (Tour 1, Tour 2, Tour 3 ; 4 colonnes visibles au plus, défilement au-delà), **une charge par tour** sous l'objectif (40 / 45 / 50 kg), car elle varie souvent d'un tour à l'autre ; les tours sont préremplis avec la même valeur. Même clavier.
- EMOM : tableau Unité | S1…Sn, cible et charge effectives de chaque série, aucune colonne ni formule d’incrément. Avec charge rend les commandes locales (+ kg)/(− kg) disponibles. Pour chaque fenêtre, travail connu des membres en Durée, deux côtés et pause applicable compris ; somme des membres dans l’intervalle commun ou intervalle local du membre. Atteinte ou dépassement bloque la validation ; Répétitions sans durée estimée inventée. Modale et récapitulatif partagent ces données.
- **Activé, AMRAP** : **charge fixe** (on ne change pas de charge en cours d'AMRAP). Quatrième colonne **Charge** entre Par tour et Max ; colonnes resserrées : Objectif, Par tour, Charge, Max. Une seule valeur d'objectif par mouvement, avec l'unité à côté de la valeur ; même clavier. Max grise l'Objectif et Par tour, **pas la Charge** : un max de répétitions se fait avec une charge.
- **Charge des modèles — cible du 5 novembre.** Les dix questionnaires proposent Avec charge, Sans par défaut. L’activation globale rend les commandes locales disponibles sans charger tous les mouvements ; (+ kg)/(− kg) pilote chaque Exercice. Charges facultatives : Progression/For time/Superset/EMOM par série ou tour ; autres modèles fixes par mouvement. Affichage entre parenthèses et unité kg. Masquer puis réactiver retrouve états et valeurs dans le même brouillon avant sauvegarde ; vider efface réellement. Une réouverture lit l’état enregistré, sans nouvelle obligation de mémorisation de réponses historiques. Aucun incrément de charge EMOM ; seules les charges effectives par série font référence.
- **Commun** : la charge est facultative : laissée vide, le mouvement est fait **sans charge**, sans valeur 0 enregistrée (les tractions de Fran) ; elle ne bloque pas l'enregistrement. Saisie au clavier numérique avec la virgule.
- **Ordre de Suivant** : Progression et For time, objectif S1 → Sn (ou Tour 1 → n), puis charges, puis ligne suivante ; AMRAP, Objectif → Par tour → Charge → ligne suivante ; EMOM, objectifs S1→Sn puis charges S1→Sn, puis ligne suivante. Les cases grisées sont sautées.
- **Désactivation après saisie** : désactiver « Avec charge » (retour au questionnaire) applique la règle existante : les valeurs sont conservées mais ne s'appliquent pas tant que la charge est « Sans ».
- **Désactivé** : aucune charge n'est affichée ni créée.
- **Après l'enregistrement**, la charge se modifie dans la modale de l'Exercice.

Tabata et 30/30 n'ont pas cet interrupteur : ils se font presque toujours au poids du corps, et la modale de l'Exercice suffit.

**Écrans :** questionnaires des dix modèles avec Avec charge ; tableaux EMOM par série, AMRAP à charge fixe, Progression/For time/Superset par série/tour.

**Contrôle EMOM des durées — seuil inclusif :** le travail prévu d’un Exercice en Durée est sa cible, multipliée par deux s’il est fait de chaque côté, plus la pause entre les côtés applicable. En simple, alternance et À la suite, travail prévu ≥ intervalle propre bloque la validation ; Dans chaque intervalle, somme du travail prévu des membres ≥ intervalle commun bloque la validation. Les membres en Répétitions contribuent pour 0 à ce contrôle de durée connue, sans garantie que le travail total tiendra dans la fenêtre. Message sous le tableau, cadres des valeurs concernées et de l’intervalle rouges ; validation bloquée dans le récapitulatif, la modale et lors de l’édition de l’intervalle du Circuit. À 60 s : 40 s d’un seul côté admis, 40 s de chaque côté refusés ; 30 s + 30 s refusés ; 10 répétitions + 30 s ne déclenche pas ce seul contrôle.

**Rôle dans le circuit.** Dans un Circuit AMRAP ou For time, chaque Exercice porte un **Rôle dans le circuit** (libellé à l'écran : « Rôle »), qui remplace le champ « Passage » (Une fois / À chaque tour). Ce concept est distinct du Format porté par l'Exercice : le Rôle dit sa place dans l'organisation, pas ce qu'il fait.
- **AMRAP** : **Buy-in | Tour**. Pas de buy-out : l'échéance termine le bloc (puis sa clôture, et le bloc suivant ou la suite de la Séance) ; un travail après l'AMRAP n'est pas compté dans son temps et se compose comme l'élément suivant de la Séance ;
- **For time** : **Buy-in | Tour | Buy-out**.

La ligne n'existe que dans ces deux Circuits, et y est toujours présente ; « Tour » par défaut. Le rôle est une donnée explicite : la position en découle, et non l'inverse.

**Le rôle fixe la zone.** Le Circuit est découpé en trois zones dans cet ordre : buy-in, tour (la boucle), buy-out.
- Passer un Exercice en Buy-in le place à la fin de la zone buy-in ; en Buy-out, à la fin de la zone buy-out ; revenir à Tour le place en tête de la boucle. Un Exercice ajouté après coup peut ainsi prendre l'une ou l'autre position.
- Le glisser-déposer réordonne à l'intérieur d'une zone ; changer de zone passe par le Rôle, pour qu'un geste imprécis ne transforme pas un Exercice en buy-in.
- **Plusieurs buy-in sont autorisés** (par exemple 1000 m de rameur puis 50 burpees avant l'AMRAP), ainsi que plusieurs buy-out en For time. Ils s'enchaînent dans l'ordre, une seule fois. En AMRAP, les buy-in consomment le temps du premier bloc uniquement.
- **Au moins un Exercice reste en Tour** : pour le dernier Exercice de la boucle, les options Buy-in et Buy-out sont désactivées ; il ne peut pas non plus être supprimé ni sorti du Circuit tant qu'un buy-in ou un buy-out reste présent (message court invitant à passer d'abord un autre Exercice en Tour).
- **Changer de rôle** ne perd rien : passer en Buy-in ou Buy-out conserve l'Incrément et la Récupération de l'Exercice sans les appliquer (ligne grisée, Récupération à 0 s) ; revenir à Tour les rétablit. En For time, un Exercice à l'échec passé en Buy-in ou Buy-out passe À l'objectif, son objectif « à renseigner ».

**Ce qu'impose un buy-in ou un buy-out.** Pas d'incrément (ligne grisée), une seule exécution, Récupération 0 s verrouillée. Condition d'arrêt :
- **AMRAP** : À l'objectif ou **À l'échec** (par exemple un max de pompes avant l'AMRAP). Le temps passé est pris sur le premier bloc. « Terminé » lance immédiatement la boucle : aucune saisie ne s'intercale pendant que le temps du bloc court. Les répétitions réalisées sur le buy-in se saisissent **à la clôture du bloc**, avec le résultat de l'AMRAP (tours complets et partiel) ;
- **For time** : À l'objectif uniquement. Le résultat est le temps mis pour finir : un buy-in ou buy-out à l'échec le rendrait dépendant de l'effort fourni sur le max, et non comparable d'une séance à l'autre. « For time puis max en 1 min » se compose avec deux éléments successifs.

**Mode.** Un buy-in ou un buy-out peut être en **Répétitions ou en Durée** (par exemple 2 min de rameur) ; la cible est le Nombre de répétitions ou l'Objectif de durée selon le Mode. En For time, une durée fixe s'ajoute au chrono sans fausser le résultat. Revenir à Tour rend l'Incrément et la Récupération modifiables.

La modale d'un buy-in n'a ni ligne Séries ni ligne Pause : aucune modale AMRAP n'a de Séries, le tour en tient lieu, et le temps qui suit le buy-in est sa Récupération.

**Incrément par tour (AMRAP).** La ligne est **toujours présente** dans la modale d'un Exercice AMRAP, à « + 0 » par défaut ; on la laisse à 0 quand on n'en veut pas. Elle s'exprime dans l'unité de l'objectif : « + 2 rép. » en Répétitions, « + 5 s » en Durée (par exemple un gainage qui s'allonge à chaque tour). Elle est **grisée**, non modifiable, quand elle ne peut rien porter :
- Rôle Buy-in : pas de tour suivant ;
- Condition d'arrêt À l'échec : pas d'objectif chiffré à augmenter.

Le For time n'a pas d'Incrément par tour.

**Modale For time d'un Exercice seul.** Les séries peuvent être **variables** (21 / 15 / 9, cas le plus courant) ou **identiques** (par exemple 5 × 20 burpees) : le For time fixe un travail fait le plus vite possible, sans imposer sa forme. L'écran « For time — Modale exercice, standard » montre l'état initial cohérent avec le questionnaire : « 3 séries variables » sélectionné, 21 / 15 / 9 répétitions, pauses à 0 s.

**Boucle du For time.** Un Exercice de rôle Tour peut être en Répétitions ou en Durée (par exemple « 3 tours : 20 burpees, puis 30 s de gainage » : le chrono mesure toujours la performance). **Au moins un Exercice de l’ensemble du Circuit reste en Répétitions**, buy-in et buy-out compris : le travail du Circuit ne doit pas être entièrement défini par des durées fixes. Pour le dernier Exercice en Répétitions du Circuit, l’option Durée est désactivée, avec un message court. Ce contrôle s’applique aussi à la suppression, au déplacement hors du Circuit et aux autres modifications de mode. Une boucle entièrement en Durée est possible si un buy-in ou un buy-out reste en Répétitions.

**Données et développement.** Le champ « Passage » (Une fois / À chaque tour) devient « Rôle dans le circuit » (Buy-in / Tour / Buy-out). La règle qui réservait « Une fois » au premier ou au dernier Exercice, la limite à un seul buy-in et l'interdiction de dupliquer isolément un buy-in sont retirées : dupliquer un buy-in crée un second buy-in, exécuté une seule fois, placé juste après l'original dans la zone buy-in ; il en va de même pour un buy-out, dont la copie est placée juste après l'original dans la zone buy-out. Les règles de réordonnancement des buy-in et buy-out (§6, points 4 et suivants) sont remplacées par le découpage en zones ci-dessus.

**Point ouvert, à décider séparément : la distance.** KODJO ne connaît que les Modes Répétitions et Durée. Un Mode Distance (en mètres) toucherait la saisie, l'exécution, les résultats et les records de tous les formats ; il n'est pas introduit par cette règle.

**Écrans :** ligne « Rôle » sur « AMRAP — Modale exercice, buy-in », « … dans un circuit », « … dans un circuit, durée à l'échec », « For time — Modale exercice, dans un circuit » et « … buy-in ou buy-out » ; Durée activable sur les modales de buy-in et buy-out et sur « For time — Modale exercice, dans un circuit », et À l'échec sur « AMRAP — Modale exercice, buy-in » ; ligne Incrément grisée sur « AMRAP — Modale exercice, buy-in », « … simple, à l'échec (Max) » et « … dans un circuit, durée à l'échec ».

Progression : **Règle.** Le questionnaire Progression comporte un interrupteur **« Avec charge »**, entre Pause et Durée totale. Il n'existe que dans le questionnaire.
- **Activé** : le tableau des séries du récapitulatif affiche, sous les répétitions de chaque série, une **charge par série** pour chaque mouvement. La charge est facultative par mouvement : laissée vide, ce mouvement est fait sans charge, par exemple un mouvement au poids du corps dans la même Progression. Une charge vide ne bloque donc pas « Enregistrer dans la séance ». [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]
- **Désactivé** : le tableau n'affiche que les répétitions, et aucune charge n'est créée sur les Exercices.
- **Après l'enregistrement**, la charge se modifie dans la modale de l'Exercice, comme pour tout Exercice standard. L'interrupteur n'est pas reporté dans le récapitulatif ni dans la Séance.

**Valeur par défaut.** Désactivé (Sans charge). L'écran « Progression — Questionnaire » le représente activé, pour correspondre au récapitulatif « Progression — Récapitulatif » (charges sur « Fentes avant », aucune sur « Squats sautés »).

**Tableau des séries.** Le tableau affiche au plus **4 colonnes visibles** à côté du nom du mouvement : la première pour l'**unité** de l'objectif (« rép. », ou « durée »), puis une colonne par série (S1, S2, S3). Au-delà de trois séries, les colonnes de séries défilent horizontalement ; le nom et l'unité restent fixes. Les cases de l'objectif ne portent que des nombres (« 12 ») ; la durée s'affiche au format de l'application (« 30 s », « 1 min 30 »). La ligne de charge apparaît sous l'objectif quand l'interrupteur est activé, avec l'unité à côté de la valeur (« 10 kg »), en bleu KODJO comme toute valeur modifiable. Le déroulé garde les nombres seuls.

**Saisie au clavier.** Toutes les valeurs du tableau se saisissent avec le clavier numérique déjà développé pour les séries variables (barre au-dessus du clavier, boutons en pastilles, Fermer plein en bleu KODJO). Pas de roulette.
1. **Première case d'une ligne sans unité** : la barre affiche **Répétitions**, **Durée** et **Fermer**. Fermer ferme le clavier sans rien enregistrer. Un chiffre tapé sans choix vaut Répétitions.
2. **Unité choisie** : elle reste affichée dans la barre en état sélectionné (identifiable pendant la frappe), suivie de **Précédent**, **Suivant** et **Fermer** ; l'utilisateur entre les valeurs. Les autres cases de la ligne s'ouvrent directement dans cette configuration. Fermer garde les valeurs saisies.
3. **Nouvel appui sur l'unité** : Précédent et Suivant disparaissent, et la barre propose à nouveau les deux unités, la courante restant sélectionnée. Choisir l'autre unité remet les valeurs de la ligne « à renseigner », sans conversion.
4. **Durée** : les chiffres se remplissent par la droite (3, 0 → 30 s ; 1, 3, 0 → 1 min 30 [affichage remplacé le 08/11/2026 au soir, Hermann : « Partout veut bien dire partout » : 30″, 1′30″ ; registre ch07, « Recette du 08/11/2026 soir — format des durées »]). **Charge** : même clavier, avec la virgule, sans choix d'unité (kg).
5. **Ordre de Suivant** : objectif S1 → S3, puis charges S1 → S3, puis ligne suivante.

**Écrans :** « Progression — Récapitulatif » ; « Progression — Récapitulatif, clavier étape 1 (unité) », « … étape 2 (valeurs) », « … étape 3 (changement d'unité) », placés à la suite du récapitulatif.

<a id="ce-creation-01"></a>
### CE-CREATION-01 — Modale de création commune et retour au point de départ

Une seule **modale de création** est ouverte depuis deux endroits :
- le bouton **Créer** du **Catalogue des séances** ;
- l'option **Créer un exercice** du menu Créer de la **Composition**.

Elle propose :
- **Exercice libre** : la fiche de création d'un exercice vierge, mouvement puis paramètres d'exécution (parcours existant « Ajouter un exercice ») ;
- **les Formats**, dans la grille à deux colonnes existante : chaque Format ouvre son questionnaire, puis son récapitulatif.

| Départ | Choix | Suite | Arrivée |
|---|---|---|---|
| Catalogue des séances, Créer | Exercice libre | Fiche de création : mouvement, puis paramètres | Composition d'une **nouvelle** Séance, contenant cet Exercice |
| Catalogue des séances, Créer | Un Format | Questionnaire, récapitulatif, « Enregistrer dans la séance » | Composition d'une **nouvelle** Séance, contenant la structure du Format [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.] |
| Composition, Créer un exercice | Exercice libre | Fiche de création | Retour à la Composition, Exercice ajouté |
| Composition, Créer un exercice | Un Format | Questionnaire, récapitulatif | Retour à la Composition, structure ajoutée |

- **Nouvelle Séance depuis le catalogue** : un nouveau **brouillon** de Séance est ouvert à l’arrivée dans la Composition, avec son contenu déjà en place. La sauvegarde définitive n’intervient qu’à la validation de la Composition ; son nom se saisit dans la Composition (le parcours Format n'affiche plus le nom de la Séance). Quitter la Composition sans enregistrer déclenche la confirmation d'abandon existante.
- **Fermer** la modale de création, le questionnaire (croix) ou la fiche de création sans valider : retour au point de départ, aucune Séance enregistrée créée ni modifiée. Le point de départ du parcours est conservé pour revenir au Catalogue ou à la Composition concernée, sans altérer son état antérieur.
- La modale de création remplace, depuis le catalogue, l'ouverture directe d'une Composition vide.

Le menu passe de cinq à **trois** options, dans cet ordre :
1. **Créer un exercice** : ouvre la modale de création (§1) ;
2. **Créer un circuit** : comportement actuel de « Ajouter un circuit » (choix de l'emplacement) ;
3. **Créer un cycle** : comportement actuel de « Ajouter un cycle ».

« Utiliser des mouvements existants » et « Utiliser un format d'entraînement » sont retirés du menu : la sélection d'un mouvement existant se fait dans la fiche de création (suggestions pendant la saisie du nom, ou mode catalogue), et les Formats sont dans la modale de création. Les autres règles du menu sont conservées : bouton + transformé en Annuler, voile, axe vertical (qui s'arrête à Créer un cycle), fermeture.

- **Modale de création** (« P-Formats — Choix du format, deux colonnes ») : titre « Créer un exercice » ; carte pleine largeur **Exercice libre** (« un mouvement, puis ses paramètres ») au-dessus de la grille ; titre de section « Formats d'entraînement » ; la fenêtre remonte pour garder la marge basse.
- **Menu Créer** (« Composition séance — Créer (menu) ») : trois options, Créer un exercice, Créer un circuit, Créer un cycle ; axe vertical raccourci jusqu'à Créer un cycle.

#### Compléments CE-FMT-01 à CE-FMT-05 et CE-T03-08

**Règle.** L’Incrément par tour AMRAP peut être négatif, en Répétitions ou en Durée, pour représenter une échelle descendante. Il s’affiche avec son signe (« − 1 rép. », « − 5 s »). Le Death by conserve un incrément positif, au minimum +1 dans l’unité choisie (§13 du complément du 5 novembre). L’EMOM n’a aucun champ d’incrément de charge ni d’objectif : ses valeurs sont saisies par série (§14 du complément du 5 novembre).

**Borne des objectifs calculés.** Lorsqu’une progression AMRAP descendante atteindrait zéro ou une valeur négative, l’objectif calculé est borné à 1 répétition ou 1 s. La boucle ne se termine pas à cette borne : 5, 3, 1, 1, 1… La borne s’applique aux objectifs de cette progression, sans modifier les règles générales des cibles nulles intentionnelles ni rendre actif un Exercice sauté. Aucun incrément n’est appliqué aux membres pour lesquels il est inactif (Buy-in ou À l’échec).

**Saisie du signe.** Sur le champ Incrément par tour, la barre du clavier natif comporte **± | Précédent | Suivant | Fermer**. ± inverse le signe ; la saisie respecte l’unité et les bornes du champ. Aucun clavier personnalisé n’est introduit.

**Écran Figma :** « AMRAP — Récapitulatif, saisie d’un incrément négatif au clavier ».

**Documentation :** référence Formats (AMRAP), ch10 (bornes des incréments), ch13 (barre du clavier).

**Règle.** En Progression et en For time, la charge se décide **mouvement par mouvement**, dans le tableau du récapitulatif. Une même Progression ou un même For time associe souvent un mouvement chargé et un mouvement au poids du corps : la décision se prend par mouvement, une fois l'interrupteur « Avec charge » activé.

- **À la création**, chaque mouvement n’a que sa ligne d’objectif tant qu’aucune charge n’est activée pour lui. À la réouverture, son état effectif et ses valeurs sont repris (§16 du complément du 5 novembre).
- **Un bouton sur chaque ligne**, dans la colonne Unité, en bleu KODJO, qui bascule selon l'état :
  - **« + kg »** (mouvement sans charge, sous « rép. ») : ajoute la ligne de charge de ce mouvement (cases « — ») et ouvre le clavier sur la première série (ou le premier tour) ;
  - **« − kg »** (mouvement avec charge, en face de la ligne de charge) : retire la ligne. Dans le même brouillon non sauvegardé, les valeurs saisies sont conservées sans s’appliquer et reviennent si l’on touche à nouveau « + kg » (§16 du complément du 5 novembre).
- **Ligne de charge** : sous l'objectif, valeurs avec leur unité (« 10 kg »), modifiables au clavier (Précédent, Suivant, Fermer ; pavé décimal avec virgule).
- **Vider toutes les cases** retire la ligne à la fermeture du clavier, et « + kg » revient ; il n’y a rien à restaurer.
- **Présentation** : sur la ligne de charge, les valeurs s'affichent entre parenthèses avec leur unité (« (12 kg) », case vide « (—) »), et le bouton aussi (« (+ kg) », « (− kg) »), pour distinguer la charge de l'objectif. C'est un affichage seulement : la valeur reste un nombre décimal (12,5 kg possible). Même présentation en Progression, For time et Superset.
- **Données** : « + kg » met la Charge de l'Exercice sur « Avec » ; une ligne vidée la remet sur « Sans ».
- **Réouverture** (« Modifier le format ») : chaque mouvement affiche son état effectif ; l’interrupteur global suit la règle du §16.

**Interrupteur du questionnaire.** Progression et For time comportent « Avec charge », désactivé par défaut, selon le §16. Son activation rend disponibles les commandes locales ; la charge reste facultative pour chaque mouvement.

**Écrans Figma :** questionnaires Progression et For time avec interrupteur ; récapitulatifs et états clavier avec « (+ kg) » sur les mouvements sans charge et « (− kg) » sur les mouvements chargés ; « Progression — Récapitulatif, ajout d’une charge (+ kg) ».

**Documentation :** référence Formats (Progression §9.2–9.3, For time §11), ch13 (tableaux des récapitulatifs).

**Règle.** Dans la Composition, **l'appui sur la carte** d'un Exercice ouvre ses Paramètres d'exécution (inchangé) ; **l'appui sur la photo** ouvre la **fiche de l'exercice**, en modale et **en lecture seule** :
- contenu de la fiche du mouvement : média, nom, catégorie, zones corporelles, niveau, description et phases du mouvement si elles existent ;
- section **« Dans cette séance »** : la synthèse des paramètres de cet Exercice : réutiliser la phrase générée pour les paramètres qu’elle couvre, et présenter la Récupération propre à l’Exercice sans modifier silencieusement les règles de cette phrase ;
- **aucun bouton Modifier** : la croix ramène à la Composition ; pour modifier, l'utilisateur touche la carte.

**Pourquoi.** Un geste, un rôle : la photo pour voir, la carte pour modifier. Un seul chemin de modification, donc un seul chemin de retour. Les phases restent lisibles au moment où l'on relit la séance (important en rééducation), avec ce qui est prévu dans cette séance. Même geste et même fiche que dans le questionnaire et le récapitulatif des Formats (§7.1 de la référence Formats), complétés du contexte de la Séance.

**Écran Figma :** « Composition séance — Fiche de l'exercice (modale) ».

**Documentation :** ch06 (Composition : appui sur la photo), ch13 (contrat de la fiche en lecture seule).

**Deux mouvements à la création.** Un superset est une paire : le questionnaire n'accepte que deux mouvements. « + Ajouter » se désactive dès que deux mouvements sont choisis ; « Valider les paramètres » ne s'active qu'avec deux. Après l'enregistrement, le Circuit est un Circuit standard : un troisième Exercice peut y être ajouté depuis la Composition. [Remplacé le 08/11/2026 (demande de Hermann, registre ch07, « Recette du 08/11/2026 au soir — Superset limité ») : un Superset a au plus deux Exercices dans la Composition aussi.] [08/11/2026, réponse de Hermann (« Superset : dans la composition on limite à deux exercices aussi. », registre ch07) : et au moins deux — un membre d'un Superset à deux ne sort ni ne se supprime ; réordonnancement permis.] [06/11/2026 : enregistrement porté par la coche ; bouton « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire, coche du questionnaire alors grise — D-499 précisée le 06/11/2026.]

**Réouverture** (« Modifier le format ») : le questionnaire et le récapitulatif affichent les Exercices actuels du Circuit, y compris un troisième ajouté depuis la Composition [08/11/2026 : seulement un Superset antérieur à la règle « Superset limité », À CLARIFIER — tranché le 08/11/2026 (réponse de Hermann) : il reste tel quel et se réduit jusqu'à deux, jamais en dessous] ; la présence de plus de deux Exercices ne bloque pas « Valider les paramètres » ni « Enregistrer les modifications », sous réserve que tous les paramètres requis soient renseignés et cohérents ; « + Ajouter » reste désactivé ; un mouvement peut être retiré tant qu'il en reste au moins deux. [06/11/2026 : enregistrement porté par la coche ; bouton « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire, coche du questionnaire alors grise — D-499 précisée le 06/11/2026.]

**Questionnaire.** La ligne « Répétitions par série » est retirée : l'objectif dépend du mouvement. Le questionnaire garde la structure : Circuit (nombre de tours, **3 tours par défaut**), Récupération après le tour, Durée totale.

**Récapitulatif.** Le tableau reprend celui de la Progression et du For time (§9.3 de la référence Formats, §9 du complément du 5 novembre ci-dessus) : colonne **Unité** (mode Répétitions ou Durée, choisi au clavier), puis une colonne par tour (**Tour 1, Tour 2, Tour 3** ; 4 colonnes visibles au plus, défilement au-delà).
- **Aucune progression par défaut** : chaque tour est prérempli avec la valeur du premier ; l'utilisateur modifie les tours qui évoluent (charge montante 40 / 45 / 50 kg, répétitions dégressives 12 / 10 / 8).
- **Charge par tour**, par mouvement : bouton « + kg » / « − kg » sur chaque ligne (§9 du complément du 5 novembre). Présentation des charges : voir §9.
- **Présentation** : trois cadres séparés (Circuit ; tableau ; Récupération après le tour et Durée totale), §12.
- **À l'échec** n'est pas dans le tableau : c'est une condition d'arrêt, pas une unité ; elle se règle dans la modale de l'Exercice.

**Organisation.** Le Superset créé est un Circuit standard à **séries alternées**, trois tours par défaut : A1, B1, récupération, A2, B2… Chaque membre porte autant de séries effectives que de tours. Un tour ne rejoue pas la collection entière des séries de chaque membre. « Récupération après le tour » est la Récupération du **dernier** Exercice du Circuit ; aucun repos supplémentaire n’est ajouté entre les membres par cette préconfiguration. Les règles existantes de Pause terminale et de substitution par la Récupération restent applicables, sans double comptage.

**Troisième membre ajouté depuis la Composition.** Aucun transfert automatique : chaque Exercice garde sa Récupération. À la réouverture, « Récupération après le tour » affiche celle du nouveau dernier Exercice (« à renseigner » s’il n’en a pas) et l’enregistrement l’écrit sur lui ; les membres intermédiaires gardent la leur. [08/11/2026 (Superset limité, registre ch07) : plus aucun troisième membre n'entre depuis la Composition ; règle conservée pour un Superset qui en comptait déjà trois.] [08/11/2026 (réponse de Hermann) : ce Superset se réduit jusqu'à deux membres, jamais en dessous.]

**Écrans Figma :** « Superset — Questionnaire » (ligne retirée, 3 tours) ; « Superset — Récapitulatif » (tableau par tour : Squats sautés 12 / 12 / 12 sans charge, Fentes avant 10 / 10 / 10 à 12 kg ; « + Ajouter » désactivé avec deux mouvements ; déroulé à jour). Le libellé « Récupération après la paire » des écrans devient « Récupération après le tour ».

**Règle.** Dans les récapitulatifs Progression, For time, Superset, Death by et EMOM, le tableau des mouvements est **isolé dans son propre cadre**, entre le cadre des paramètres qui le précèdent (nombre de séries, de tours, intervalle…) et celui des paramètres qui le suivent (pause, récupération, durée totale, condition d'arrêt, exécution). **Position.** Pour Tabata, 30/30, Renforcement, À l'échec (sous « Nombre de séries ») et For time (sous « Nombre de tours »), le tableau des mouvements est placé **juste sous la ligne du nombre de séries ou de tours**, qui forme son propre cadre ; les autres paramètres (durée totale, exécution, récupération…) suivent dans un troisième cadre. En Death by, le tableau n'a pas de fond blanc propre : il prend la couleur de son cadre. Ses valeurs portent leur unité, à côté de la valeur (« 1 rép. », « + 1 rép. », « 10 s », « + 10 s »). Les cadres sont séparés de 8 px ; quand la place manque au-dessus du déroulé, l'écart descend à 4 px et le contenu de la modale défile si nécessaire.

**Écrans Figma :** « Progression — Récapitulatif » et ses écrans clavier et d'ajout de charge, « For time — Récapitulatif », « Superset — Récapitulatif », « Death by — Récapitulatif, dans chaque intervalle », « … en alternance », « … à la suite ».

**Règle.** Chaque Exercice Death by peut être en Répétitions ou en Durée, sans restriction des mouvements sélectionnables : le Mode appartient à l’Exercice. Départ et Incrément portent cette unité (« 10 s », « + 10 s ») ; l’incrément vaut au minimum +1 répétition ou +1 s. Le changement d’unité ne convertit pas les valeurs et laisse les champs incompatibles à renseigner.

**Travail prévu d’un rang.** Pour un Exercice en Durée, il inclut les deux côtés et la pause entre côtés applicable. Dans un intervalle commun, c’est la somme des travaux connus des membres de la fenêtre ; à intervalles locaux, celui du membre. Les membres en Répétitions n’ont pas de durée déduite.

**À l’enregistrement.** Une progression en Durée finit toujours par atteindre l’intervalle : c’est la fin normale du défi, sans avertissement. Seul le cas où le **premier rang** atteint ou dépasse déjà l’intervalle déclenche un **avertissement non bloquant** : « Le premier intervalle ne peut pas être tenu : le défi s’arrêtera avant de commencer. » L’enregistrement reste possible. Le contrôle EMOM du §14 du complément du 5 novembre reste bloquant.

**À l’exécution.** Un rang dont le travail prévu connu atteint ou dépasse l’intervalle n’est pas lancé : le défi s’arrête à la fin du rang précédent. Même seuil que l’EMOM (atteint ou dépasse), appliqué à l’exécution plutôt qu’à la saisie. Sinon, la fin reste celle du Death by : la première fenêtre non tenue. Aucune fenêtre n’est prolongée.

**Résultat.** Rangs acquis = derniers rangs entièrement tenus. Fin par limite : mention « limite de l’intervalle atteinte », aucun échec ni tentative fictifs. Fin par fenêtre non tenue : pour un membre en Durée, la durée tenue est renseignée à la clôture, jamais déduite de l’objectif prescrit. Unités et côtés du résultat suivent la prescription.

**Documentation :** référence Formats §12 du complément du 5 novembre, règles métier, données/résultats, capacités et conception du moteur. Le libellé « Nombre de répétitions de départ » devient « Objectif de départ » ; la tagline et les textes doivent couvrir les deux modes et les intervalles configurables, sans imposer ici une nouvelle formulation graphique.

**Écrans Figma :** récapitulatifs Death by avec un exemple mixte Répétitions/Durée. L’avertissement du premier rang n’a pas d’écran dédié : il suit la présentation des messages du formulaire.

**Règle.** Le récapitulatif EMOM reprend le tableau de la Progression (§9 du complément du 5 novembre, §12 du complément du 5 novembre) : colonne **Unité** (« rép. » ou « durée », choisie au clavier), puis une colonne par série (**S1, S2, S3** ; 4 colonnes visibles au plus, défilement horizontal au-delà, nom et unité fixes). Le tableau est isolé dans son propre cadre.
- **Progression de l'EMOM** : chaque série est préremplie avec la valeur de S1 (objectif fixe par défaut) ; l'utilisateur modifie les séries qui évoluent (« 3, 4, 5… soulevés de terre », « planche 20 s, 25 s, 30 s… »). Il n'y a pas de champ d'incrément.
- **Charge** : l'interrupteur « Avec charge » du questionnaire EMOM est conservé (il signale consciemment qu'une charge est à renseigner) ; activé, il fait apparaître le bouton « (+ kg) » / « (− kg) » sur chaque ligne ; la charge s'affiche en ligne sous l'objectif, une valeur par série (« (12 kg) »), comme en Progression.
- **Contrôle d’intervalle — bloquant.** Vérifier chaque série/fenêtre : travail prévu en Durée, deux côtés et pause entre côtés applicable compris, comparé à son intervalle. Dans chaque intervalle commun, sommer les travaux connus de tous les membres pour le rang concerné. Si le total atteint ou dépasse l’intervalle, afficher le message, les cadres rouges et bloquer la validation. Les membres en Répétitions ne reçoivent aucune estimation inventée. Ce contrôle s’applique aussi après modification depuis la Composition.

**Données.** Les objectifs et charges de chaque série sont les valeurs effectives de l’Exercice ; aucune formule d’incrément de charge EMOM n’est persistée ni réappliquée. Les diminutions de charge se saisissent directement dans les séries. Aucune mention de charge calculée nulle/négative ne s’applique.

**EMOM et Death by.** Les deux Formats partagent le principe de fenêtres temporelles, mais conservent leurs contrats distincts : compte fini et objectifs prescrits par série pour l’EMOM ; progression par rang, compte ouvert et fin au premier échec pour le Death by. Leur proximité ne justifie pas leur fusion.

**Écrans Figma :** « EMOM — Récapitulatif, dans chaque intervalle » (charge activée : Squats sautés 10 / 10 / 10 rép. « (+ kg) » ; Fentes avant 30 s × 3 à « (12 kg) » « (− kg) ») ; « … en alternance » et « … à la suite » (sans charge). L'écran « EMOM — Récapitulatif, saisie d'un incrément de charge négatif au clavier » est supprimé.

**Progression : aucune.** Tabata et 30/30 sont des protocoles de temps fixe (20 / 10 s, 30 / 30 s) : on progresse par le nombre de répétitions ou la vitesse dans la fenêtre, pas par la durée d'une série à l'autre. Le récapitulatif n'a pas de tableau par série ; les séries variables restent accessibles dans la modale de l'Exercice pour un cas particulier.

**Charge : par mouvement** (interrupteur au questionnaire, §16 du complément du 5 novembre). Ces formats se font souvent au poids du corps, mais aussi au kettlebell ou au wall ball. Une seule valeur de charge par mouvement (charge commune de l'Exercice, identique d'une série à l'autre), saisie au clavier (pavé décimal avec virgule) ; « (+ kg) » sur un mouvement sans charge, « (12 kg) » puis « (− kg) » pour la retirer (restauration temporaire dans le même brouillon selon §16 du complément du 5 novembre). Deux présentations :
- **Un seul mouvement** : une ligne **Charge** dans le cadre des paramètres, sous Durée totale.
- **Plusieurs mouvements** : un tableau par mouvement dans son propre cadre (§12 du complément du 5 novembre), sous les paramètres. L'Objectif est le travail par série de chaque mouvement (20 s en Tabata, 30 s en 30/30 ; modifiable au clavier, Répétitions ou Durée) ; la ligne commune « Travail par série » est retirée des paramètres. **30/30** : trois colonnes de valeurs, **Objectif | Pause | Charge** ; la ligne commune « Pause » est aussi retirée. **Tabata** : **Objectif | Pause | Charge** également (« 20 s », « 10 s ») ; la ligne commune « Pause » est retirée des paramètres. La colonne Charge n'apparaît que si « Avec charge » est activé (§16 du complément du 5 novembre).

**Écrans Figma :** « 30/30 — Récapitulatif », « P-Tabata — Récapitulatif, à la suite » et « … en alternance » : tableau Mouvement | Objectif | Pause | Charge, cette dernière colonne étant conditionnelle. Les lignes communes Travail par série et Pause sont retirées au profit des valeurs par mouvement. Le cas à un mouvement suit la règle décrite ci-dessus, même sans frame dédiée.

**Règle.** Chaque questionnaire d'un Format où une charge peut s'appliquer comporte l'interrupteur **« Avec charge »**, désactivé par défaut : Progression, For time, Superset, Tabata, 30/30, Renforcement, À l'échec, AMRAP, EMOM, Death by.
- **Activé** : les options de charge apparaissent dans le tableau du récapitulatif : bouton « (+ kg) » / « (− kg) » par mouvement et ligne de charge (Progression, For time, Superset, EMOM), ou colonne Charge (AMRAP, Tabata, 30/30, Renforcement, À l'échec, Death by). La décision reste prise **mouvement par mouvement**.
- **Renforcement et À l'échec** (structure de séries identiques, comme le 30/30) : un seul mouvement → ligne Charge sous Durée totale ; plusieurs → tableau **Mouvement | Objectif | Pause | Charge** dans son propre cadre (« 15 rép. » / « à l'échec », « 1 min » / « 2 min »), lignes communes « Répétitions par série » ou « Cible par série » et « Pause » retirées des paramètres. Une charge fixe par mouvement ; une charge qui évolue d'une série à l'autre relève de la Progression.
- **Death by** : colonne **Charge** ajoutée au tableau Mouvement | Départ | Incrément, une charge fixe par mouvement (par exemple Death by thrusters à 20 kg).
- **Désactivé** : aucune option de charge n'apparaît ; le tableau reste plus lisible pour une séance au poids du corps.
- **Réouverture** : l'interrupteur reprend l'état effectif (activé si au moins un Exercice a sa Charge sur « Avec », §7.9 de la référence Formats). Dans le même brouillon non sauvegardé, désactiver puis réactiver l’interrupteur retrouve les mouvements précédemment chargés et leurs valeurs ; ceux qui étaient sans charge le restent. La même restauration temporaire s’applique aux boutons locaux. Une première activation globale rend les commandes disponibles sans charger automatiquement tous les mouvements.

**Portée de la restauration.** Elle suit le fonctionnement des Paramètres d’exécution dans la même session d’édition, avant sauvegarde. Elle ne crée aucune nouvelle obligation de mémorisation après sauvegarde : une ouverture ultérieure lit l’état effectif enregistré selon les règles de persistance existantes. Vider volontairement une valeur n’équivaut pas à la masquer : les valeurs effacées ne sont pas restaurées automatiquement.

**Écrans Figma :** interrupteur ajouté, représenté activé pour correspondre aux récapitulatifs, sur « P-Tabata — Questionnaire », « 30/30 — Questionnaire », « Superset — Questionnaire », « For time — Questionnaire », « Progression — Questionnaire », « Renforcement — Questionnaire », « À l'échec — Questionnaire », « Death by — Questionnaire » ; « Renforcement — Récapitulatif » et « À l'échec — Récapitulatif » : tableau Mouvement | Objectif | Pause | Charge ; récapitulatifs Death by : colonne Charge ; « 30/30 — Récapitulatif » : tableau Mouvement | Objectif | Pause | Charge, lignes « Travail par série » et « Pause » retirées des paramètres.

### Écart visuel restant — Death by, contrôle du 5 novembre

**PARTIELLEMENT CONFORME visuel.** Le récapitulatif `11376:20189` représente bien des membres en Répétitions et en Durée ; l’accroche reste formulée en répétitions et minutes. Elle doit couvrir les deux modes et l’intervalle configurable, selon le complément §13. Aucun nouveau texte graphique n’est arbitré ici. Les captures montrent l’état courant ; aucune modification Figma ni recette de l’application n’est déclarée.

## Parcours UX à concevoir — Bibliothèques et partage (post-MVP)

Écrans et états **fonctionnels à concevoir**, sans contrat visuel Figma validé à cette date : **Mes Bibliothèques**, **Bibliothèque personnelle (composition modifiable)**, **Bibliothèque reçue (composition non modifiable)**, **Partage d'une fiche ou Bibliothèque**, **Mise à jour disponible / détail des changements**, **Espace en étoile / transmission individuelle** et **Signalement / contenu suspendu**.

L'écran **« Mise à jour disponible »** doit signaler, avant « Mettre à jour », la nouvelle composition éventuelle et les fiches révisées, **dont celles référencées dans d'autres Bibliothèques**. Une seule validation actualise ces fiches dans toutes leurs références, sans changer les compositions des autres Bibliothèques. Les homonymes de sources différentes doivent rester identifiables par leur provenance, sans suffixes arbitraires imposés. Le mode « Protégé » n'empêche pas la première publication d'une fiche par son propriétaire.

La distribution dans l'Espace en étoile reste individuelle, avec invitation acceptée, refus et blocage ; aucun rôle professionnel ni prescription d'exécution numérique à représenter dans ce lot.

**Évidence Figma limitée :** fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101` ; actions glissées « Partager » connues `10501:23846` et `10579:21622`. Ces actions ne prouvent pas l'existence d'écrans de Bibliothèques, de contrôle central, de versions ni de modération. N'inventer aucune taille, couleur ou interaction visuelle ; confronter les contrats à Figma après conception. [Parcours cibles](../KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md).
