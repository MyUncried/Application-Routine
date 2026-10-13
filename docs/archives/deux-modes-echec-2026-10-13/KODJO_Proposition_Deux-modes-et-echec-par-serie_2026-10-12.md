# KODJO — Proposition de modification documentaire
## Deux modes d'exécution, et l'échec comme valeur de cible par série

**Date** : 12 octobre 2026
**Statut** : proposition. Aucune modification n'a été apportée à la documentation, au dépôt ni à Figma.
**Origine** : un kinésithérapeute décrit « trois séries à l'échec » comme protocole courant de renforcement, utilisé pour obtenir une mesure étalon suivie de séance en séance. L'analyse a montré que le protocole est exprimable aujourd'hui mais ne produit aucune mesure, et que le modèle à trois modes en est la cause.

---

## 1. La décision

| | Avant | Après |
|---|---|---|
| Modes d'exécution | Durée · Répétitions · **À l'échec** | Durée · Répétitions |
| « À l'échec » | un mode | **une valeur de la cible par série**, au même titre qu'une durée ou un nombre |
| Granularité | l'exercice entier | **la série** |
| Ce qui est mesuré | indéterminé | déterminé par le mode : un temps, ou un nombre de répétitions |

Trois arbitrages rendus par Hermann le 12 octobre 2026 :

1. Le marqueur **« ≥ » est autorisé au niveau de l'Exercice**.
2. La compaction de la phrase au-delà de trois séries s'écrit **« de 10 rép. à l'échec »** ou **« de 1 min 30 s à l'échec »**.
3. Dans la roulette de valeur, **« à l'échec » se place en tête**, avant la plus petite valeur.

### Pourquoi ce n'est pas un changement cosmétique

RM-111 définit aujourd'hui le troisième mode *par référence au deuxième* : « Un Exercice À l'échec n'a ni durée ni répétitions cibles ; `Suivant` termine chaque Série **comme en mode Répétitions** ». Le mode n'a donc pas de comportement propre : c'est un mode Répétitions privé de cible.

Et ce modèle rend un cas inexprimable. On va à l'échec en durée — un gainage tenu, un relevé de talon unipodal jusqu'à fatigue — comme en répétitions. Les deux tombent aujourd'hui dans le même mode, qui n'a ni l'une ni l'autre. Le système ne sait pas ce qu'il mesure, et c'est pour cette raison qu'il n'enregistre rien.

Avec deux modes, la mesure découle du mode :

| Mode | Cible | Ce qui est relevé à l'exécution |
|---|---|---|
| Durée | 45 s | rien, c'est la cible |
| **Durée, à l'échec** | aucune | **le temps tenu** — déjà capté par les horodatages |
| Répétitions | 15 rép. | rien, c'est la cible |
| **Répétitions, à l'échec** | aucune | **le nombre atteint** — donnée nouvelle, sauf avec bip de cadence |

---

## 2. Règles à modifier

### 2.1 — Le modèle de modes

| Règle | Texte actuel (extrait) | Modification proposée |
|---|---|---|
| **RM-033** | « Un Exercice utilise exactement un mode parmi Durée, Répétitions et À l'échec. » | « Un Exercice utilise exactement un mode parmi **Durée et Répétitions**. La cible d'une Série est une valeur du mode, ou **À l'échec**, qui signifie l'absence de cible chiffrée. » |
| **RM-111** | « Un Exercice À l'échec n'a ni durée ni répétitions cibles ; `Suivant` termine chaque Série comme en mode Répétitions. » | **Absorbée.** Son contenu devient : « Une Série dont la cible est À l'échec n'a pas de valeur chiffrée ; `Suivant` la termine comme une Série en mode Répétitions. » |
| **RM-059** | « `Suivant` termine normalement la Série courante d'un Exercice en Répétitions ou À l'échec sans confirmation. » | « `Suivant` termine normalement la Série courante **en mode Répétitions, ou toute Série dont la cible est À l'échec**, sans confirmation. » |
| **RM-127** | « T04 accepte les Exercices en Durée, Répétitions ou À l'échec […] » | « T04 accepte les Exercices en **Durée ou Répétitions**, **avec ou sans cible À l'échec sur tout ou partie de leurs Séries** […] » |

### 2.2 — Le « ≥ » au niveau de l'Exercice

La phrase suivante est reprise **à l'identique** dans quatre emplacements : **RM-129**, **RM-132**, **DM-002** et **DM-015**. Les quatre changent ensemble.

> Texte actuel : « Durées selon Bip v2 et paramètres v13 : Durée exacte ; Répétitions avec bip estimées ≈ ; Répétitions sans bip et À l'échec omitted au niveau Exercice. **≥ réservé à la Séance contenant du travail inconnu.** »

> **Modification proposée** : « Durées selon Bip v2 et paramètres v13 : Durée exacte ; Répétitions avec bip estimées ≈ ; Répétitions sans bip omitted au niveau Exercice. **Un Exercice dont une partie seulement des Séries porte une cible À l'échec est noté ≥, borné par la somme du travail connu et des pauses. Un Exercice dont toutes les Séries sont À l'échec reste omitted au niveau Exercice. ≥ s'applique également à la Séance contenant du travail inconnu.** »

**Justification de l'asymétrie.** En cas mixte, le travail connu existe et la borne a un sens : deux séries de 45 s plus une à l'échec valent au moins 1 min 30 s de travail. Quand toutes les séries sont à l'échec, le seul temps connu est celui des pauses ; afficher « ≥ 45 s » pour un exercice entièrement composé d'effort inconnu induirait en erreur. L'omission actuelle est conservée pour ce cas.

**Conséquence directe** : la Durée totale d'un Exercice **cesse d'être modifiable dès qu'au moins une Série porte la cible À l'échec**. Le calcul inverse qui déduit le nombre de séries d'un total saisi suppose un total déterminé ; un « ≥ » ne s'inverse pas. Même mécanique que celle déjà actée pour la durée totale dans un circuit de séries : la valeur reste affichée et calculée, elle cesse d'être éditable.

### 2.3 — La phrase de synthèse

| Règle | Point | Modification proposée |
|---|---|---|
| **RM-232 / D-298** | « cibles énumérées jusqu'à 3 puis min/max » | La compaction min/max doit admettre une borne non numérique. **Cas mixte** : « de 10 rép. à l'échec », « de 1 min 30 s à l'échec ». **Toutes séries à l'échec** : pas de borne basse, la formulation actuelle est conservée — « 3 séries jusqu'à l'échec ». |
| **v10.2 cas 3D** | « ␣jusqu'à l'échec » en valeur par série | Conservé, mais déclenché par **la cible de la Série**, non par le mode de l'Exercice. |
| **v10.2 cas 6E** | Durée totale vide en mode À l'échec | Devient : **vide** si toutes les Séries sont À l'échec ; **« ≥ » suivi de la borne** si une partie seulement l'est. |
| **v10.2 cas 28 à 36** | Neuf cas du tableau de référence libellés « À l'échec » en colonne Mode | À réécrire : la colonne Mode prend Durée ou Répétitions, et la cible À l'échec passe en colonne de valeur. Le libellé rendu ne change pas pour les cas où toutes les séries sont à l'échec. |

**Cas à ajouter au tableau de référence** : les combinaisons mixtes, qui n'existent pas aujourd'hui. Au minimum — séries variables en Répétitions avec dernière série à l'échec ; même cas en Durée ; même cas avec changement de côté.

**Approximation assumée.** Placer « à l'échec » en borne haute suppose que l'échec dépasse la plus grande valeur chiffrée, ce qui n'est pas garanti. C'est la même approximation que la compaction min/max fait déjà en perdant l'ordre des séries. Signalée une fois, non rouverte.

### 2.4 — La pause de sécurité

| Règle | Texte actuel | Modification proposée |
|---|---|---|
| **RM-069** | « Répétitions sans cadence **et À l'échec** : pause de sécurité après 2 h sans interaction depuis démarrage ; cadence : 30 min après fin nominale recalculée (RM-068). » | « **Toute Série sans fin nominale** — Répétitions sans cadence, ou cible À l'échec — : pause de sécurité après 2 h sans interaction depuis démarrage ; cadence : 30 min après fin nominale recalculée (RM-068). » |

La règle est aujourd'hui indexée sur le mode de l'Exercice. Elle doit l'être sur la Série, puisqu'un même Exercice peut désormais mêler des séries avec et sans fin nominale. Le comportement est inchangé, seule la clé de déclenchement change.

### 2.5 — Le bip de cadence

| Règle | Point | Modification proposée |
|---|---|---|
| **RM-058** | « Bip0..10 dans trois modes : périodique pendant Série, au-delà du nominal Répétitions […] Durée conserve le minuteur ; Répétitions/À l'échec conservent Suivant. » | Remplacer « trois modes » par « les deux modes », et « Répétitions/À l'échec conservent Suivant » par « **les Séries en Répétitions et toute Série À l'échec conservent Suivant** ». |

**Opportunité à noter, hors périmètre de cette proposition** : en Répétitions à l'échec avec bip de cadence, le tempo est imposé, donc le nombre de répétitions tenues avant `Suivant` est déductible du nombre de bips. Le relevé devient automatique, sans saisie. À traiter avec la définition du relevé (§ 3).

### 2.6 — Règles vérifiées et inchangées

Ces règles ont été relues et **ne nécessitent aucune modification**. Elles sont citées pour que la revue puisse le constater sans les rouvrir.

| Règle | Pourquoi elle tient |
|---|---|
| **RM-077** | La pondération de la progression est déjà écrite par Série, non par mode : « R compte les Séries Répétitions sans cadence **et À l'échec** ; chaque Série sans durée déterminable pèse 1/M ». Ouvrir l'échec série par série ne change rien à son calcul. |
| **RM-126** | Même granularité : « les occurrences Répétitions sans cadence / À l'échec acquièrent leur part avec Suivant ». |
| **RM-107, RM-108** | Persistance et échec d'enregistrement : sans rapport avec le mode d'exécution. |

---

## 3. La donnée nouvelle : le relevé

C'est l'objet même de la demande initiale. Sans lui, le protocole produit une séance, pas une mesure.

**Définition proposée** : une Série exécutée dont la cible était À l'échec produit **une valeur relevée**, exprimée dans l'unité de son mode — un temps en mode Durée, un nombre de répétitions en mode Répétitions.

**Granularité : par occurrence de Série exécutée, et par côté.** En bilatéral, chaque côté va à l'échec et produit sa propre valeur. Ce n'est pas une complication gratuite : en rééducation, l'écart droite / gauche sur un test à l'échec est l'information clinique la plus utile, et la structure bilatérale existe déjà.

**Origine de la valeur selon le cas :**

| Cas | Origine | Coût |
|---|---|---|
| Durée à l'échec | horodatages de la phase, **déjà captés** | aucun |
| Répétitions à l'échec, avec bip de cadence | nombre de bips avant `Suivant` | calcul |
| Répétitions à l'échec, sans cadence | **saisie de l'utilisateur** à la fin de la série | écran et donnée nouvelle |

Seul le troisième cas demande une saisie. Elle doit tenir en un geste et ne jamais bloquer l'enchaînement.

**Portée** : cette section définit la donnée, pas son écran ni sa restitution dans le Suivi. Les deux relèvent d'une conception à part.

---

## 4. Interface

### 4.1 — La modale de paramètres

La modale suit une règle unique : une ligne, un libellé à gauche, une valeur modifiable à droite. Deux de ses lignes expriment déjà une absence **comme une valeur** : `Changement de côté → Sans changement` et `Bip de cadence → Aucun`. « À l'échec » suit le même motif, sur la ligne qui porte déjà la cible.

```
Mode d'exécution                    Durée
Séries              identiques      3 séries
   Durée d'une série                Jusqu'à l'échec
   Pause après chaque série         15 s
Changement de côté                  Sans changement
Bip de cadence                      Aucun
Compte à rebours                    10 s
Fin d'exercice                      5 s
```

**Aucune ligne supplémentaire n'est consommée.** La modale raccourcit même, puisque `Durée totale` disparaît quand toutes les séries sont à l'échec.

Ni interrupteur ni coche : les deux exigeraient leur propre libellé, donc leur propre ligne, et obligeraient à nommer l'état inverse — ce que le motif « valeur » évite entièrement.

### 4.2 — Le popover de mode

Passe de trois pastilles à deux : **Durée · Répétitions**.

### 4.3 — La roulette de valeur

« À l'échec » se place **en tête, avant la plus petite valeur** : l'utilisateur qui cherche l'échec ne fait pas défiler des durées. La primitive native est conservée, conformément à la règle de priorité aux primitives de l'OS.

### 4.4 — Le tableau des séries variables

La colonne de valeur accepte désormais une entrée non numérique. C'est ce qui rend exprimable un protocole réellement courant : **deux séries à 10 répétitions, puis une dernière à l'échec.**

---

## 5. Migration

**Neutre.** RM-111 définit déjà l'À l'échec actuel comme un mode Répétitions sans cible. Les Exercices existants deviennent **« Répétitions, toutes Séries à l'échec »**.

- Aucun comportement d'exécution ne change : `Suivant` termine la série comme avant.
- Aucune durée affichée ne change : toutes séries à l'échec reste `omitted`.
- Aucune phrase rendue ne change : « 3 séries jusqu'à l'échec » est conservée pour ce cas.
- Aucune donnée n'est perdue, aucun champ n'est à remplir rétroactivement.

Le seul écart visible est le popover de mode, qui perd sa troisième pastille.

---

## 6. Hors périmètre de cette proposition

À traiter séparément, et dans cet ordre :

1. **La charge comme valeur** et non comme libellé. Aujourd'hui `Matériel` est un texte. Sans charge fixée et enregistrée, un nombre de répétitions à l'échec n'est comparable à rien d'une séance à l'autre : la mesure étalon n'existe pas. C'est la condition de validité du protocole demandé.
2. **L'écran de saisie du relevé** et sa restitution dans le Suivi.
3. **Le modèle de séance** correspondant, et les écrans d'entrée vers la composition.

---

## 7. Points restant à trancher

1. **Quel nombre fait l'étalon** sur trois séries : la première, qui est la mesure propre ; le total, qui mesure le volume tenu ; ou l'écart entre la première et la dernière, qui mesure la résistance à la fatigue. La réponse détermine ce que montre le Suivi, et elle appartient au kinésithérapeute.
2. **Les cas mixtes à ajouter** au tableau de référence de la phrase : la liste minimale est proposée au § 2.3, à compléter ou restreindre.
