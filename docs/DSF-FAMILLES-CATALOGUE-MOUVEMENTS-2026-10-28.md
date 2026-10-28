# Catalogue des mouvements — Composition et ordre des familles

Référence intégrée le 28/10/2026 à partir du [document de Hermann](KODJO-Regles-Familles-de-niveaux-2026-10-28.md), conservé à l'identique, et du relevé direct de Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`. Cette spécification clôt C08 pour **constituer, rejoindre, quitter et dissoudre une famille depuis le catalogue**. Elle ne clôt pas le parcours de suppression définitive d'un mouvement ni les autres règles de son cycle de vie. Aucun code applicatif n'est livré par ce dossier.

Les règles A à E ci-dessous sont reproduites intégralement. Elles remplacent les restrictions et messages des règles 2 à 4 du 27/10 sur leur seule portée. Les anciennes formulations restent dans l'annexe Historique des consolidations. D-437, D-439, D-445 et D-448 point 9 restent applicables à l'identité, à la filiation et au menu de réordonnancement.

Le geste ne crée ni mouvement, ni exercice, ni séance : il modifie l'appartenance et l'ordre de mouvements existants. L'action **Ajouter un niveau** de CE-MVT-02 reste distincte : elle prépare un nouveau mouvement et conserve ses boutons Plus facile / Plus difficile et la validation de son formulaire.

## Principe : un geste, un indicateur

Toutes les opérations de famille se font avec **le même geste** : appui long sur une carte, déplacement, arrêt sur l'emplacement visé, relâchement.

Et elles se lisent sur **un seul indicateur** : le filet vertical à gauche de la pile. Sa longueur dit qui appartient à la famille, son apparition dit qu'une famille se forme, sa disparition dit qu'il n'y en a plus. Les pastilles de niveau complètent la lecture en annonçant les rangs obtenus.

Aucun anneau, aucune teinte d'acceptation, aucune invite textuelle pendant le geste. La barre, les pastilles et le reflux des cartes suffisent.

---

## Règle A — Déplacer dans sa famille

**A1.** Un appui long arme le déplacement. Les cartes se réordonnent en libérant l'emplacement visé ; le relâchement valide.

**A2. La longueur du filet ne change pas.** La famille garde les mêmes membres, seul leur ordre change.

**A3. Si la famille était repliée, elle se déplie d'abord**, afin que l'emplacement visé soit choisi parmi des membres visibles.

**A4. Les pastilles de niveau se recalculent en direct** pendant le déplacement, puisque le rang est dérivé de l'ordre.

**A5. Aucun message de confirmation.** Voir la règle E.

---

## Règle B — Sortir un mouvement de sa famille

**B1. C'est le même geste, poussé hors de l'emprise du filet.** Il n'existe pas d'action nommée ; sortir, c'est déplacer la carte au-delà de la portée verticale du filet, quel que soit le côté par lequel on en sort.

**B2. Ce que l'utilisateur voit avant de relâcher :**

- le **filet raccourcit** à la mesure des membres restants ;
- les cartes au-dessus **se referment** sur l'emplacement libéré ;
- les **niveaux des membres restants se recalculent** : une famille de rangs 3, 2 et 1 privée de son rang 1 affiche 2 et 1 ;
- la carte déplacée **perd sa pastille de niveau**, puisqu'elle n'appartient plus à la famille.

**B3. Relâcher valide la sortie.** Le mouvement devient un mouvement sans famille.

**B4. Ramener la carte dans l'emprise du filet annule la sortie.** Le filet se rétablit et le geste redevient un simple réordonnancement. La sortie n'est donc jamais accidentelle : elle est prévisualisée avant le relâchement et annulable après, par la règle E.

**B5. Famille en tête de liste.** Le dépôt au-dessus du filet est accepté, comme partout ailleurs. Le catalogue étant ordonné par son contrôle de tri, un mouvement sans famille n'a pas de position manuelle : il rejoint la liste à l'emplacement que le tri lui donne. Sortir d'une famille n'est donc jamais, en plus, un déplacement dans le catalogue.

---

## Règle C — Créer une famille, entrer dans une famille

**C1. Poser une carte sur une carte sans famille crée une famille.** Un filet naît à gauche des deux cartes.

**C2. Poser une carte sur un membre d'une famille existante l'y fait entrer.** Le filet s'allonge pour couvrir le nouveau membre, et les rangs de toute la famille se recalculent.

**C3. La position détermine le rang, et il n'y a donc aucune question à poser.** La carte posée **au-dessus** devient le niveau supérieur, la carte posée **en dessous** le niveau inférieur, exactement comme à l'intérieur d'une famille existante où le niveau le plus élevé figure en haut.

Cette règle remplace la proposition antérieure d'un choix Plus facile / Plus difficile après le dépôt. Ces deux boutons restent employés par l'action « Ajouter un niveau », où l'on crée un mouvement qui n'existe pas encore et où aucune position ne peut exprimer le sens.

**C4. Les pastilles provisoires annoncent le résultat.** Pendant l'arrêt sur l'emplacement, les deux cartes portent déjà leur rang, dans la même présentation que les pastilles établies. Elles se mettent à jour si l'utilisateur passe de l'autre côté.

**C5. Une famille repliée se déplie à l'approche**, comme en A3.

**C6. Un mouvement déjà membre d'une famille ne peut pas être posé sur une autre carte.** Il ne peut atterrir que libre. Changer de famille suppose donc deux gestes : sortir, puis lier. Aucun changement de famille silencieux, conformément à « aucun rattachement automatique ni fusion rétroactive ».

Conséquence d'interface : **le filet de formation ne s'affiche jamais pour une carte issue d'une famille.**

**C7. Famille de trois membres ou plus.** La carte prend le rang correspondant à l'endroit où elle se pose entre deux membres, et les rangs des autres se recalculent par dérivation. MFN-06, « insertion après origine », garde sa portée d'origine : elle régit l'action « Ajouter un niveau », où l'on crée un mouvement qui n'a aucune position pour exprimer son rang. Elle ne régit pas ce geste.

---

## Règle D — Supprimer une famille

**D1. Il n'existe pas d'action « supprimer la famille ».** Une famille disparaît en sortant ses membres, par la règle B.

**D2. Le dernier couple.** Lorsque la famille ne compte plus que deux membres et que l'utilisateur en sort un, **les deux identifiants de groupe sont effacés**, celui du membre sorti comme celui du membre restant. Le filet disparaît entièrement à l'écran.

**D3. Distinction à écrire explicitement.** Le chapitre 09 pose « singleton conservé » et le chapitre 13 « groupe singleton égale état vide ». Ces dispositions visent la disparition **subie** d'un membre, par archivage ou suppression : le groupe survit, le rang est masqué, et le retour du membre archivé restitue la progression.

Elles ne s'appliquent pas au détachement **explicite** du dernier couple, où l'intention de l'utilisateur est de ne plus avoir de famille. Laisser un groupe d'un seul membre y serait un état fantôme, invisible à l'écran mais actif dans les données.

**D4.** Un mouvement resté seul après un archivage conserve son groupe et son rang masqué. Un mouvement resté seul après une sortie explicite n'a plus de groupe. Les deux se présentent de la même façon à l'écran ; ils diffèrent par ce qui se passe ensuite.

---

## Règle E — Application immédiate, message et annulation

**E1. Toute opération s'applique au relâchement**, sans état provisoire, sans bouton de validation et sans mode d'organisation.

**E2. Un message temporaire apparaît quand l'appartenance change, et seulement alors.** Trois cas :

| Opération | Message |
| --- | --- |
| Création d'une famille | Nouvelle famille de niveaux créée |
| Suppression d'une famille | Famille de niveaux supprimée |
| Sortie d'un mouvement | Mouvement sorti de la famille |

**E3. Un réordonnancement à l'intérieur d'une famille ne produit aucun message.** L'ordre a changé sous les yeux de l'utilisateur et les pastilles se sont mises à jour devant lui : le message n'apprendrait rien.

**E4. Le message porte une action Annuler**, conformément au composant `DSF / Overlays / Message temporaire`. Les trois opérations structurelles sont donc réversibles tant que le message est affiché.

**E5. Le message reste affiché 3 secondes.** C'est la fenêtre d'annulation. Elle est délibérément courte, et elle est tenable parce qu'elle n'est pas la seule protection : la sortie d'une famille est prévisualisée avant le relâchement par la règle B2, et refaire une liaison ne coûte qu'un geste.

**E6. Le message est posé au-dessus de la barre de navigation**, comme pour les autres opérations du catalogue.

### Ce que E remplace

Les règles 3 et 4 du réordonnancement versées le 27/10 disposent que « le déplacement est appliqué dès le dépôt » avec « un message de confirmation », et que « toute opération du catalogue s'applique au geste, avec son message de confirmation », cette dernière règle étant justifiée par le souci qu'aucune action n'ait un contrôle que les autres n'auraient pas.

La règle E conserve l'application immédiate et l'absence de bouton. Elle restreint le message par un principe explicite : **message quand l'appartenance change, pas de message quand seul l'ordre change.** L'asymétrie est assumée et motivée, elle n'est pas arbitraire.

---

## Données et invariants

Au plus un groupe par mouvement ; identifiant de groupe et clé de tri facultatifs mais présents ensemble. Aucun rang persisté : il est dérivé de l'ordre complet, avant filtrage. Clé fractionnaire ou lexicographique pour insérer sans renuméroter les autres clés. Le niveau le plus élevé est en haut.

| Opération | Effet persistant |
| --- | --- |
| Réordonner | Seule la clé de tri du mouvement déplacé change. |
| Rejoindre une famille existante | Écrire groupe et clé de tri du mouvement entrant ; les autres clés sont conservées. |
| Sortir d'une famille de plus de deux membres | Effacer ensemble groupe et clé de tri du mouvement sorti ; les autres rangs sont dérivés à nouveau. |
| Sortir du dernier couple | Effacer groupe et clé de tri des deux mouvements ; aucun singleton fantôme. |
| Créer une famille avec deux mouvements sans groupe | Les deux mouvements doivent partager un identifiant et porter chacun une clé de tri. La phrase « seul mouvement concerné » du document source ne peut décrire cette initialisation à deux membres ; voir les réserves de transcription ci-dessous. |
| Annuler pendant les 3 secondes | Rétablir l'appartenance et l'ordre antérieurs de toute l'opération, y compris les deux membres d'un dernier couple. |

Les identités et contenus restent inchangés ; les exercices continuent à référencer les mêmes mouvements. Aucun changement de `sourceMovementId`, des instantanés ou de l'historique. Les performances restent séparées par mouvement : ni fusion ni scission des relevés. Seuls l'affichage des niveaux et l'ordre du menu Changer de niveau évoluent. Aucun plafond métier de famille.

**Singleton subi / détachement explicite.** Une disparition subie par archivage ou suppression ne vaut pas demande de dissolution de la famille : conserver l'identifiant du membre restant et masquer son rang quand il est présenté seul. L'archivage conserve aussi l'appartenance et la clé du membre archivé ; sa restauration restitue la progression. La sortie explicite du dernier couple efface au contraire les deux appartenances. L'identité d'un groupe n'est jamais un objet autonome à supprimer.

**Archivage, filtres et suppression définitive.** Conserver l'arbitrage validé du 27/10, chapitre 09 règle 8 : archiver/restaurer ne change pas les niveaux ; les membres archivés participent au calcul ; filtrer masque sans recalcul. Supprimer définitivement peut modifier les rangs et le total des restants sans réécrire leurs clés ni leurs identités. Le lot de composition de famille ne redéfinit pas ce cycle de vie.

## Relevé Figma et captures de référence

Trois écrans portent le geste continu, sans ajouter d'écran pour chaque transition. Captures PNG directes, sans retouche, 402 × 874 ; [manifest avec empreintes](figma-familles-2026-10-28/captures.json). Le catalogue comporte maintenant 13 frames, dont les trois suivantes. Les 12 états mentionnés dans le relevé du 27/10 sont un décompte historique.

| Écran | Nœud | Capture | Contrat |
| --- | --- | --- | --- |
| Mouvement — Catalogue — Pile — Déplacement | [10480:23374](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10480-23374) | [PNG](Specifications-fonctionnelles/images/familles-2026-10-28/10480-23374.png) | CE-MVT-03 : carte saisie, emplacement pointillé |
| Mouvement — Catalogue — Pile — Création d’une famille | [10797:20492](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10797-20492) | [PNG](Specifications-fonctionnelles/images/familles-2026-10-28/10797-20492.png) | CE-MVT-03 : naissance du filet, rangs provisoires |
| Mouvement — Catalogue — Pile — Message de confirmation | [10484:23428](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=10484-23428) | [PNG](Specifications-fonctionnelles/images/familles-2026-10-28/10484-23428.png) | CE-MVT-03 : appartenance changée, Annuler |

Le nœud `10484:23428`, anciennement « Réordonnée », illustre désormais **Nouvelle famille de niveaux créée**, avec Annuler. Il ne justifie plus de message de réordonnancement. La carte saisie et son ombre, le filet de 2 px et les pastilles sont observables dans les captures. Le message mesure 370 × 48 à x=16, y=738 dans le gabarit ; ce sont des mesures de référence, pas des contraintes empêchant l'adaptation du texte ou des safe areas.

**B5 vérifié à l'intégration.** Le contrôle de tri est présent dans le catalogue (`10266:20586`, cible `10266:20600`) et les trois écrans. La spécification v7 précise que les listes de catalogue se réduisent par leurs filtres et leur tri ; aucun ordre manuel des entrées n'y est prescrit. La règle B5 s'applique : accepter la sortie au-dessus d'une famille en tête, puis replacer le mouvement selon le tri courant. Le geste ne mémorise aucune position manuelle dans le catalogue.

**Renumérotation.** Les niveaux sont recalculés pendant le déplacement, conformément à A4 et à la précision de Hermann du 28/10. Les captures fixent le vocabulaire visuel du geste.

## Réserves de transcription — aucune règle inventée

Le document source indique que ses quatre arbitrages sont clos ; ils le restent. Deux formulations demandent néanmoins de distinguer le texte fourni de ce qu'il permet de spécifier :

- **Entrée dans une famille existante :** E2 pose un message quand l'appartenance change, mais sa table ne fournit que les libellés création, suppression et sortie. Le principe du message et d'Annuler pendant 3 secondes s'applique ; aucun quatrième libellé n'est inventé ni présenté comme validé.
- **Création à partir de deux isolés :** C1 exige deux appartenances, alors que le paragraphe de données n'excepte que la dissolution de la règle d'une seule ligne écrite. Le tableau ci-dessus expose cette conséquence de C1 et de la présence conjointe des champs ; il ne prétend pas à un arbitrage technique supplémentaire. Ne pas livrer une famille dont un seul membre porterait l'identifiant.

## Recette à appliquer au développement

| Cas | Résultat attendu |
| --- | --- |
| FAM-01 — réordonner une pile repliée ou déployée | Déploiement si nécessaire ; emplacement libéré ; filet de même longueur ; pastilles recalculées pendant le geste ; persistance au relâchement ; aucun message. |
| FAM-02 — sortir puis revenir avant relâchement | Filet raccourci, cartes refermées et rangs recalculés ; pastille retirée ; retour dans le filet rétablit l'appartenance avant dépôt. |
| FAM-03 — sortir d'une famille en tête | Dépôt au-dessus accepté ; mouvement sans famille replacé selon le tri courant ; aucune position manuelle persistée. |
| FAM-04 — lier deux isolés, au-dessus puis en dessous | Filet en formation et deux pastilles provisoires ; niveau supérieur en haut ; deux identités préservées ; famille créée au dépôt. |
| FAM-05 — rejoindre une famille de trois membres ou plus | Déploiement à l'approche ; insertion à l'emplacement choisi, rangs dérivés ; pas de question de difficulté ; message d'appartenance, libellé d'entrée non fourni par la source. |
| FAM-06 — tenter un transfert direct entre familles | Aucun filet de formation ; impossible de lier une carte encore membre à une autre carte ; sortir librement puis lier lors d'un second geste. |
| FAM-07 — sortir du dernier couple | Les deux paires groupe/clé sont effacées ; filet et pastilles disparaissent ; message Famille de niveaux supprimée. |
| FAM-08 — messages et Annuler | Création / dissolution / sortie : libellés E2 exacts ; au-dessus de la navigation ; 3 secondes ; Annuler restaure tout l'état antérieur. Aucun bouton de validation. |
| FAM-09 — archivage, restauration, filtre, suppression définitive | Archivage/restauration et filtre sans reclassement ; conservation du groupe subi ; suppression définitive selon la règle 8 du 27/10. |
| FAM-10 — invariants | Mêmes références d'exercices, identités, contenus, instantanés et performances ; pas de cascade ; un groupe maximum. |
| FAM-11 — accès existants | Réordonner les niveaux au menu garde le même résultat ; Ajouter un niveau garde choix du sens et formulaire ; aucun menu de retrait ou de suppression de famille. |

Cette mise à jour vérifie les liens, les PNG, les empreintes et la cohérence documentaire. Les scénarios d'application ci-dessus sont prescrits, pas déclarés exécutés.
