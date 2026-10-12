# Prompt — mise à jour de la documentation et du DSF
## Deux modes d'exécution, et l'échec comme valeur de cible par série

**Date** : 13 octobre 2026
**Destinataire** : IA de la documentation et IA du DSF
**Source normative des règles** : `KODJO_Proposition_Deux-modes-et-echec-par-serie_2026-10-12.md`, déjà transmise, **y compris sa section § 4.5 ajoutée après la transmission initiale**.
**Objet de ce document** : décrire exactement ce qui a été modifié dans Figma, afin que la documentation et le DSF soient mis en conformité. Ce document ne rouvre aucune décision.

---

## 1. Ce qui a été décidé

`À l'échec` cesse d'être un mode d'exécution. Les modes sont **Durée** et **Répétitions**. « À l'échec » devient **une valeur de la cible, au niveau de la série** — au même titre qu'une durée ou un nombre de répétitions.

Quatre arbitrages rendus, à reporter tels quels :

1. le marqueur **`≥` est autorisé au niveau de l'Exercice**, en cas mixte uniquement ; un exercice dont toutes les séries sont à l'échec reste `omitted` ;
2. **`≥` l'emporte sur `≈`** lorsque le travail connu est lui-même estimé, c'est-à-dire en Répétitions avec bip de cadence ;
3. la compaction de la phrase au-delà de trois séries s'écrit **« de 10 rép. à l'échec »** ou **« de 1 min 30 s à l'échec »** ; toutes séries à l'échec conserve la formulation existante, « 3 séries jusqu'à l'échec » ;
4. dans la roulette, **« à l'échec » se place en tête**, avant la plus petite valeur.

La granularité par série rend exprimable un protocole courant que le modèle précédent ne savait pas écrire : **deux séries à 10 répétitions, puis une dernière à l'échec**.

---

## 2. Ce qui a changé dans le DSF

### 2.1 — Nouvelle variante de roulette

Jeu de composants `DSF / Forms / Roulette` (`5544:5146`). Il comptait quatre variantes, **toutes intégralement numériques** : `État=Secondes`, `État=Minutes secondes`, `État=Fin de séance`, `État=Secondes avec unité`.

**Ajout d'une cinquième** : `État=Minutes secondes avec échec` (`8452:13297`), **330 × 181**.

Anatomie, de haut en bas :

| Élément | Géométrie | Style |
|---|---|---|
| `Option — À l'échec` | 330 × 30, texte centré horizontalement, marge verticale 3 px | Inter Regular **20 px** — la taille du chiffre sélectionné |
| `Séparateur` | 330 × 1, en y 30 | même remplissage que les séparateurs de popover |
| Roulette d'origine | 330 × 150, en y 31 | **inchangée** |

**Libellé dépendant du mode** : « Aucune durée, à l'échec » en mode Durée, « Aucune répétition, à l'échec » en mode Répétitions. Le libellé nomme ce qui est absent ; il ne se réduit pas à « À l'échec ».

### 2.2 — Le grisé, et une règle du DSF à consigner

Le dégradé de la roulette **n'est pas porté par la couleur mais par l'opacité du remplissage**. Toutes les lignes sont en `#1a1a1f` ; seule l'opacité varie :

| Distance à la sélection | Opacité du remplissage | Taille |
|---|---|---|
| ligne sélectionnée | 100 % | 20 px |
| à une ligne | 45 % | 16 px |
| à deux lignes | 20 % | 14 px |
| à trois lignes | 10 % | 12 px |

Le libellé « à l'échec » suit la même échelle : **100 % quand il est sélectionné, 45 % quand il ne l'est pas** — le même grisé que la ligne voisine de la sélection, et non un gris inventé.

**À consigner dans le DSF** : une comparaison de couleurs seule conclurait à tort que toutes ces lignes sont identiques.

### 2.3 — Ce qu'il ne faut pas toucher

`État=Minutes secondes` reste **inchangée**, à 330 × 150. Elle est partagée avec les écrans `Durée totale (roulette)` des deux pages, où « à l'échec » n'a aucun sens. Quatre instances au total : deux sur la nouvelle variante, deux sur l'ancienne.

---

## 3. Ce qui a changé dans Figma

Les mêmes opérations ont été appliquées sur `Conception — Hors MVP` puis transposées sur `Prototype MVP`.

| Écran | Hors MVP | Prototype MVP | Opération |
|---|---|---|---|
| Mode d'exécution (popover) | `7413:32819` | `8328:37092` | trois pastilles → **deux** : Durée, Répétitions. Popover 136 → 99 px, hauteur repassée en automatique |
| Durée d'une série (roulette) | `7413:33007` | `8328:37862` | bascule sur la nouvelle variante ; popover 216 → **249 px** en hauteur automatique ; libellé **grisé**, la durée étant la valeur courante |
| Mode d'exécution (popover) — séries variables | `8319:29185` | `8328:38513` | idem, 136 → 99 px |
| Séries variables à l'échec | `7413:35142` | `8328:38848` | ligne `Mode d'exécution` remise à **Durée** ; **colonne de valeur rétablie** avec `à l'échec` sur les trois séries ; en-tête de colonne `Durée` rétabli ; phrase mise à jour |
| Séries variables, cas mixte | **`8467:28618`** | **`8470:13303`** | **créé** : 30 s, 45 s puis `à l'échec`, pauses 10 s / 20 s / 30 s, `Durée totale ≥ 2 min 15 s` en valeur non modifiable |

### 3.1 — Un écran créé puis supprimé

Un écran `Série à l'échec` — séries identiques, cible à l'échec — a été créé puis **supprimé sur revue** : il ne montrait qu'un changement de valeur, pas une présentation d'interface différente. Le comportement correspondant est décrit au § 4.5 de la proposition. **Ne pas le réintroduire**, et ne pas documenter d'écran pour ce cas.

### 3.2 — Liens de prototypage

Le lien `Option — À l'échec → Séries variables à l'échec` a été **supprimé sur les deux pages**, l'option n'existant plus. Il est remplacé par un enchaînement **cellule par cellule**, identique sur les deux pages :

| Écran | Cellule 1 | Cellule 2 | Cellule 3 |
|---|---|---|---|
| Séries variables en durée | — | — | → cas mixte |
| Séries variables, cas mixte | → à l'échec | → à l'échec | — |
| Séries variables à l'échec | → en durée | → en durée | — |

On n'atteint donc plus « toutes séries à l'échec » par un choix de mode, mais en posant la valeur série après série.

### 3.3 — Anomalies de fichier réparées, à ne pas prendre pour des choix de conception

Sur **les deux pages**, les trois instances `Ligne de série` de l'écran `Séries variables à l'échec` avaient **perdu leur enfant `Champ — Colonne 1`**, alors qu'elles pointent sur le même composant maître (`8129:31593`) que celles de l'écran en durée, qui le possèdent. Une instance ne perd pas un enfant en usage normal : le fichier était dans un état divergent. Réparé par `resetOverrides()` puis réapplication des textes.

**Conséquence documentaire** : il n'a jamais existé de variante « une colonne » de `Ligne de série`. Ne pas en documenter une.

---

## 4. Ce que la documentation doit refléter

### 4.1 — Règles à modifier

La proposition les détaille une par une avec leur reformulation. Rappel du périmètre :

- **modèle de modes** : `RM-033`, `RM-111` (absorbée), `RM-059`, `RM-127` ;
- **le `≥` au niveau Exercice** : `RM-129`, `RM-132`, `DM-002`, `DM-015` — la même phrase y figure à l'identique, les quatre changent ensemble ;
- **la phrase** : `RM-232` / `D-298` pour la compaction, et les cas `3D`, `6E` et `28` à `36` de `SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2` ;
- **la pause de sécurité** : `RM-069`, dont la clé passe du mode à la série ;
- **le bip de cadence** : `RM-058`, « trois modes » → « les deux modes ».

**Relues et inchangées** : `RM-077` et `RM-126`, déjà écrites par série et non par mode ; `RM-107` et `RM-108`, sans rapport.

### 4.2 — Comportement du sélecteur et valeurs possibles

> Ce texte est le § 4.5 de la proposition. Il a été **ajouté après la transmission initiale** de celle-ci : il est donc reproduit intégralement ici, et non référencé.

**Composition.** Une ligne « Aucune durée, à l'échec » — « Aucune répétition, à l'échec » en mode Répétitions — centrée horizontalement, suivie d'un filet, puis la roulette. Le tout dans une même feuille, confirmée par le bouton de validation de la feuille.

**Invariant.** À tout instant, **exactement un des deux éléments est sélectionné, l'autre est grisé**. Aucune coche n'est ajoutée dans la liste : la validation est déjà portée par le bouton de la feuille.

**À l'ouverture**, le sélecteur s'ouvre sur l'état courant du champ, jamais sur une position neutre :

| Le champ porte | Le libellé | La roulette |
|---|---|---|
| une durée | grisé | **active**, positionnée sur cette durée |
| « à l'échec » | **actif** | grisée, affichée à 00:00 |

**Transitions.** Faire tourner la roulette sélectionne la durée : le libellé passe en gris. Toucher le libellé sélectionne l'échec : la roulette passe en gris et revient à 00:00.

**Rendu du grisé.** Le remplissage passe à **45 % d'opacité** — la valeur déjà employée dans la roulette pour la ligne voisine de la sélection, de sorte que le grisé du libellé et celui des chiffres soient le même grisé. Lorsque c'est la roulette qui est grisée, le traitement porte sur l'ensemble du bloc.

**Valeurs possibles.**

- Mode **Durée** : à l'échec, ou une durée de **00:05 à 59:55 par pas de 5 secondes** — minutes de 00 à 59, secondes par pas de 5, conformément à la roulette existante.
- Mode **Répétitions** : à l'échec, ou un nombre entier de répétitions.

**Point à confirmer.** `00:00` n'est pas une durée de série valide, et il sert de position neutre lorsque l'échec est sélectionné. Le sélecteur doit donc **l'interdire comme valeur de cible**, faute de quoi une même position de roulette signifierait deux choses. La valeur canonique `0 s` reste légitime pour les pauses, qui passent par un autre sélecteur.

### 4.3 — La donnée nouvelle

Une série exécutée dont la cible était à l'échec produit **une valeur relevée**, dans l'unité de son mode, **par occurrence de série et par côté**. En mode Durée, elle est déjà captée par les horodatages. En Répétitions avec bip de cadence, elle est déductible du nombre de bips. Sans cadence, elle demande une saisie.

### 4.4 — Un constat à consigner pour éviter une recherche inutile

L'arbitrage « la durée totale cesse d'être modifiable dès qu'une série est à l'échec » est **réel dans le modèle et invisible à l'écran**. Un exercice mixte suppose des séries variables, où le total est déjà non modifiable ; un exercice en séries identiques à l'échec a toutes ses séries à l'échec, donc un total omis. **Aucun écran ne montre cette règle, et il ne faut pas en chercher un.**

---

## 5. Ce qu'il ne faut pas modifier

- **`État=Minutes secondes`** et les deux écrans `Durée totale (roulette)`.
- **Les huit cartes du catalogue** affichant « 3 séries à l'échec » : la formulation est conservée pour le cas « toutes séries à l'échec », qui est celui qu'elles montrent.
- **Le filtre du catalogue** : ses facettes sont Statut, Catégories et Zones corporelles. Il n'y a pas de filtre par mode, donc la suppression du troisième mode ne l'affecte pas. L'occurrence « à l'échec » visible sur cet écran provient d'une carte située derrière le panneau.
- **Les écrans d'exécution, de synthèse et de suivi**, hors périmètre de cette passe.

---

## 6. Points ouverts

Deux seulement, et tous deux ont un impact sur le développement.

1. **`00:00` doit être interdit comme valeur de cible de série.** Il sert de position neutre lorsque l'échec est sélectionné ; s'il reste sélectionnable, une même position de roulette signifie deux choses. La valeur canonique `0 s` des pauses n'est pas concernée, elles passent par un autre sélecteur.
2. **La propriété de désactivation du `Picker` natif.** La documentation Expo 57 de `@expo/ui/swift-ui` ne documente pas de propriété `disabled` sur le `Picker`. L'état « roulette grisée quand l'échec est sélectionné » doit être confirmé côté modificateurs avant d'être tenu pour acquis.

---

## 7. Note de faisabilité, pour information

`@expo/ui/swift-ui` expose le `Picker` SwiftUI natif ; `pickerStyle` accepte `wheel`, `segmented` et `menu`, et les options sont des `Text` portant un `tag` **dont la valeur peut être une chaîne**. La documentation ne décrit aucun mécanisme multi-colonnes : une roulette minutes / secondes est **deux `Picker` côte à côte**.

Deux conséquences : la ligne posée au-dessus relève de la composition ordinaire ; et **sur une roulette à une colonne — les répétitions — « à l'échec » pourra être littéralement la première option**, sans la composition retenue ici pour la roulette à deux colonnes.
