# KODJO — Constituer, modifier et supprimer une famille de niveaux

Lot de règles à revoir puis à intégrer. Périmètre strict : la composition d'une famille de niveaux depuis le catalogue des mouvements. Ni le code, ni Figma, ni les autres parcours.

> Cette version remplace intégralement la précédente du même jour, qui reposait sur un modèle à deux gestes distincts et sur une action de menu. Le modèle retenu n'a qu'un geste et un seul indicateur.

---

## Ce que ce lot complète

Le point est consigné comme différé sous la référence **C08** de `DSF-NIVEAUX-RECHERCHE-2026-10-25` : « Rattacher, détacher, supprimer : inclusion MVP à décider ultérieurement ; aucune exclusion décidée ».

Le réordonnancement est intégré depuis le 27/10. Sa règle 2 borne la portée du geste : « Un membre ne peut être déposé que dans sa propre famille. Un mouvement ne change pas de famille par glissement, et un mouvement sans famille ne peut pas en rejoindre une par ce geste. » Les règles ci-dessous étendent ce même geste ; la règle 2 doit être reformulée, non supprimée.

Sources à relire : D-437, D-439, D-445, D-448 point 9 ; MFN-05 à MFN-07 et MFN-10 au chapitre 10 ; lignes « Groupe sur Mouvement » et « Rang / total / suffixe - Nn » au chapitre 09 ; règles 1 à 9 du réordonnancement.

---

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

## Effets sur les données

- Le rang n'est pas une donnée. Il se dérive de l'ordre des membres d'un groupe.
- Lier, entrer, sortir écrit l'**identifiant de groupe et la clé de tri du seul mouvement concerné**. Aucun autre mouvement n'est réécrit, rien ne cascade. Seule la suppression du dernier couple écrit deux lignes.
- La clé de tri reste fractionnaire ou lexicographique, afin qu'une insertion entre deux membres n'oblige pas à réécrire la famille.
- Les deux champs sont facultatifs mais présents ensemble : les effacer revient à sortir de toute famille.
- Au plus un groupe par mouvement, règle inchangée.

## Effets sur le reste

- **L'identité du mouvement ne change pas.** Les exercices qui le référencent continuent de le référencer, les instantanés et l'historique ne sont pas touchés, conformément à `sourceMovementId` conservé sans rang.
- Seuls changent le niveau affiché sur les cartes et l'ordre proposé dans le menu « Changer de niveau ».
- Les performances restent séparées par mouvement. Lier deux mouvements ne fusionne aucun relevé, les séparer n'en sépare aucun.
- **Archivage et filtres**, inchangés : archiver, restaurer ou supprimer un membre ne modifie pas le rang des autres ; un filtre masque des membres sans recalculer les niveaux des membres visibles.

---

## Ce qui doit être reformulé

| Règle existante | Reformulation | Portée |
|---|---|---|
| Réordonnancement, règle 2 : « un mouvement ne change pas de famille par glissement » | Restreindre au dépôt **entre** deux cartes. Le dépôt **sur** une carte et la sortie hors de l'emprise du filet sont régis par les règles B et C. | La borne reste vraie pour le réordonnancement seul. |
| Réordonnancement, règles 3 et 4 : message de confirmation pour toute opération | Remplacer par la règle E. | Le message est réservé aux changements d'appartenance. |
| C08 de `DSF-NIVEAUX-RECHERCHE-2026-10-25` | Remplacer par le renvoi aux règles A à E. | Le point cesse d'être différé. |
| Chapitre 09, « singleton conservé » | Préciser que la conservation vise la disparition subie et non la sortie explicite du dernier couple. | Voir D2 à D4. |
| MFN-06, « insertion après origine » | Préciser que la règle régit l'action « Ajouter un niveau » et non le dépôt par geste, où la position exprime le rang. | Portée précisée, règle inchangée. |

Conserver les formulations antérieures pour traçabilité, comme le fait D-449.

---

## Ce qui ne doit pas être écrit

- Une action nommée de retrait, dans un menu ou ailleurs. Le retrait est un geste.
- Un choix de sens après le dépôt. La position l'exprime.
- Un mode d'organisation ou un bouton de validation propre à ces opérations.
- Un changement de famille automatique ou silencieux, y compris lorsqu'un mouvement est créé à partir d'un autre. D-445 et l'arbitrage Q10 l'excluent déjà.
- Une fusion des performances ou des historiques au moment de lier deux mouvements.
- Un plafond métier au nombre de membres d'une famille.

---

## Écrans

Trois écrans portent ce geste, et trois seulement. Un geste continu ne se spécifie pas en énumérant ses états : les écrans fixent le vocabulaire visuel, les règles font le reste.

| Écran | Ce qu'il fixe |
| --- | --- |
| `Mouvement — Catalogue — Pile — Déplacement` | Le traitement de la carte saisie et l'emplacement en pointillé |
| `Mouvement — Catalogue — Pile — Création d'une famille` | La naissance du filet et les pastilles provisoires |
| `Mouvement — Catalogue — Pile — Message de confirmation` | Le message temporaire et son action Annuler |

Deux écrans ont été écartés comme non porteurs, la sortie de famille et l'entrée dans une famille : ils ne montrent que l'inverse ou la répétition de mécanismes déjà fixés. Les deux faits qu'ils portaient, le filet qui raccourcit avec la pastille qui disparaît, et la renumérotation en direct des membres restants, sont écrits en B2.

---

## Points arbitrés le 28/10

Les quatre points que ce lot avait laissés en suspens ont été tranchés par Hermann et sont écrits dans les règles ci-dessus. **Aucun point n'est ouvert.**

| Point | Arbitrage | Où il est écrit |
| --- | --- | --- |
| Sortie quand la famille est en tête de liste | Le dépôt est accepté ; le tri du catalogue donne la position du mouvement libéré | B5 |
| Insertion dans une famille de trois membres ou plus | La position fixe le rang ; MFN-06 garde sa portée, limitée à « Ajouter un niveau » | C7 |
| Libellés des trois messages | Formules courtes, bouton Annuler conservé | E2, E4 |
| Durée d'affichage du message | 3 secondes | E5 |

La règle B5 repose sur un constat à confirmer à l'intégration : le catalogue des mouvements est ordonné par son contrôle de tri et n'accepte pas d'ordre manuel au niveau des entrées. Si cette lecture était fausse, B5 serait à réécrire.
