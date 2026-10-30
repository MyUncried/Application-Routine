# KODJO — PRE-9 : décisions consolidées sur la Composition et les Formats

**Statut : règles de configuration validées, consolidées pour la documentation normative et le plan BMAD.** Ce texte constitue la version active de référence pour le **périmètre Composition/configuration PRE-9**. Il n'atteste ni du code développé, ni de la qualification du moteur PRE-10/11.

## 1. Sources et priorité documentaire

- Décisions de Hermann du 29 octobre, **D-01 à D-30**, dans [règles consolidées du 29/10](../_bmad-output/pre9/planning-artifacts/regles-de-gestion-composition-consolidees-20261029.md) (branche `docs/pre9-arbitrages-reponses-20261029`) ; réponses détaillées actualisées, notamment **§4.6**, dans [réponses aux arbitrages](../_bmad-output/pre9/planning-artifacts/arbitrages-pre9-reponses-hermann-20261029.md), version source `522c1b934337d8605478f4b2543b089b320401ac`. Ces deux liens renvoient aux documents de source disponibles **sur branche parallèle** : leur contenu est décrit ici sans présumer de leur présence dans la branche courante.
- Contre-revue de ChatGPT : `regles-de-gestion-composition-consolidees-20261029-chatgpt-v2.md @ 73abb7dd` ; c'est une **revue critique**, non une décision additionnelle.
- Clarification ultérieure confirmée par Hermann : **le Format est porté uniquement par l'Exercice** ; le Circuit n'en porte aucun ; affichage des noms de Formats des membres dans la deuxième ligne du Circuit replié. Traçabilité dans le [registre des décisions](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md) ; preuve visuelle Figma page `510:101`, nœuds `10717:20056`, `10725:20142`.
- Documentation normative antérieure citée dans les arbitrages : `main @ c73079e9`, en particulier ch05, ch10 (RM-FMT, organisation des séries) et ch13 (CE-FMT-03). **Ne pas présenter une décision du 29/10 comme déjà présente dans le commit du 28/10.**
- Le plan `_bmad-output/pre9/` a été rédigé par étapes. Les mentions de révisions anciennes sont des **historiques**, non des prescriptions encore actives.

**Principe de priorité :** les décisions explicites validées du 29/10, leur clarification de propriété et les règles de structure D-449/D-451 priment sur les hypothèses de stockage initiales et les libellés historiques « Circuit formaté ». Les détails purement graphiques de Figma ne créent pas de règle métier.

## 2. Règles actives de Composition

### 2.1 D-01 à D-13 — Structure et interactions

| Référence | Règle applicable en PRE-9 |
|---|---|
| **D-01** | Une Séance peut comporter plusieurs Exercices porteurs de Formats distincts, successifs, directement ou dans un Cycle ; un Cycle répète la séquence qu'il contient. |
| **D-02** | **Précisée / remplacée sur le porteur :** le Format et ses réglages appartiennent à l'Exercice, **jamais au Circuit**. L'ancien partage « Exercice ou Circuit porteur » n'est pas actif. |
| **D-03** | Nom initial proposé de l'élément formaté : nom du Format ; le **Circuit conserve son nom structurel** (« Circuit A », etc.), et affiche, quand il est replié, les Formats de ses Exercices sur sa deuxième ligne existante. Aucun titre commun de Format n'est déduit pour le Circuit. |
| **D-04** | Création par enveloppe : poser Circuit/Cycle sur un premier contenu, puis glisser les autres depuis toute position admissible ; ni Circuit dans Circuit, ni Cycle dans Cycle. |
| **D-05** | Principes resserrés : le Format reste propre à l'Exercice ; le Circuit fixe uniquement son organisation (groupée/alternée) et son nombre de passages. Il ne réécrit pas les paramètres intrinsèques des membres ; l'élément entrant adopte l'organisation et, s'il est réglable, le compte compatible N. Refuser les déposes qui dénatureraient l'Exercice formaté. |
| **D-06** | **Remplacée** par les principes resserrés D-05 : ne pas figer systématiquement « tous les paramètres » d'un hypothétique Circuit formaté. Les constantes propres aux Formats des membres restent contrôlées. |
| **D-07** | En alternance, conserver le régime de séries et les paramètres propres compatibles ; adapter le nombre actif de séries à N. Confirmation avant perte de valeurs ; sortie : conserver le nombre actif et les paramètres actuels selon le chapitre 10. |
| **D-08** | En groupées, le compte du Circuit répète le passage **complet** de chacun des membres, séries et pauses comprises, sans modifier leurs séries intrinsèques. |
| **D-09** | Demander confirmation lorsqu'une adaptation retirerait des valeurs existantes, et pas pour un changement sans perte. |
| **D-10** | Un nouveau Circuit créé via le flux Format s'insère **après le Circuit** contenant le dernier Exercice entré, au même parent (Cycle ou Séance), sans imbrication. |
| **D-11** | Pour ajouter un Format déjà présent dans la Séance, proposer le choix **joindre un Circuit contenant déjà ce Format** ou **créer un Circuit nouveau**, selon le parcours validé ; ce choix ne transfère aucun Format au Circuit. L'UX est celle de Figma. |
| **D-12** | Ajout **volontaire** d'un deuxième Exercice au Format d'un premier : le nouvel Exercice adopte explicitement ce Format ; préserver le nombre de passages ; confirmation si des valeurs renseignées seraient remplacées. Une simple dépose d'un Exercice déjà formaté ne provoque **aucune adoption**. |
| **D-13** | Pour Tabata, EMOM, Progression : proposer l'organisation à l'ajout du second Exercice ; pas de sélecteur d'organisation pour For time. |

### 2.2 D-14 à D-17 et D-30 — Matrice des six Formats

Les **valeurs initiales réglables ne sont jamais des constantes imposées**. Les exemples Figma n'ajoutent aucune autre valeur initiale.

| Format de l'Exercice | Contraintes imposées / logique | Valeur initiale modifiable | Dépose dans Circuit groupé | Dépose dans Circuit alterné |
|---|---|---|---|---|
| **Tabata** | 8 séries par Exercice, 20 s effort / 10 s pause | — | **Admise** : bloc intégral à chaque passage | **Admise si N=8** ; refusée sinon |
| **Intervalles 30/30** | 30 s effort / 30 s pause | **6 séries** | **Admise**, bloc complet par passage | **Refusée** (D-16) |
| **EMOM** | Fenêtres cadencées ; durée calculée à partir du nombre de passages et des Exercices | **W=60 s ; N=6** | **Admise**, bloc complet par passage | **Admise** ; le N réglable s'adapte à celui du Circuit (D-16). FMT-22, qui conserve N quand on ajoute ou retire un Exercice **dans** un EMOM, vise une autre opération. |
| **For time** | Échelle **indexée par tour de l'échelle**, distinct du passage du Circuit | **21 · 15 · 9** | **Admise** ; chaque passage rejoue **toute l'échelle depuis 21**, sans reprendre au rang du Circuit | **Refusée** |
| **AMRAP** | La durée configurée borne **chaque occurrence du bloc** ; les tours réalisés sont un résultat | **12:00** | **Admise** ; nouvelle borne de durée configurée **à chaque passage** (D-15/D-30), pas une limite commune à tous les passages | **Refusée** |
| **Death by** | Progression par rang/fenêtre et acquisition déclarée | **Départ 1 ; incrément 1 ; fenêtre 1 min** | **Admise** ; l'arrêt termine cet élément, pas toute la Séance | **Admise** ; chaque Death by conserve sa référence temporelle propre (D-16) ; raccordement détaillé des fenêtres et de la fin d'un membre en PRE-11 |

**D-15** : Circuit groupé admis pour les six Formats. **D-16** : décisions alternées cellule par cellule reprises ci-dessus. **D-17** : le Circuit groupé répète ses membres, le Cycle répète sa **séquence entière** ; aucun compteur artificiel de « répétition de l'ensemble » n'est ajouté. Les constantes des Formats ne sont jamais effacées ou modifiées silencieusement. **D-30** : la durée AMRAP reste réglable ; 12 minutes est **une valeur initiale**, jamais la durée obligatoire de toutes les exécutions.

### 2.3 D-22 à D-28 — Départs rapides et interactions

- **D-22 / D-23 :** aucun Mouvement présélectionné ; les réglages de départ sont proposés sans créer un Exercice autonome. Les modèles réutilisent le parcours Catalogue de choix des Mouvements.
- **D-24 :** Renforcement = **3 séries × 15 répétitions** ; Progression = **10, 12, 14 répétitions** ; À l'échec = **3 séries à l'échec** ; Superset = Circuit groupé **1 passage**, avec **deux emplacements d'Exercices vides** et réglages libres. **Libre** = Séance libre.
- **D-25 :** retirer **Gainage · Mobilité** des départs rapides actifs. Ses anciennes mentions dans FMT-02/FMT-28 et les contrats sont remplacées pour la cible, sans effacer les preuves historiques.
- **D-26 :** superséder l'ancienne hypothèse ARB-24 de transmission des contraintes d'un « Circuit formaté » aux Exercices entrants. Un Circuit n'a aucun Format à transmettre.
- **D-27 :** le rattachement au Circuit est un geste volontaire ; aucune remontée implicite du Format au Circuit.
- **D-28 :** appliquer les deux niveaux de répétition D-17, sans double multiplication.

### 2.4 Règles de dépose, entrée et sortie (§4.1–4.6 des réponses)

- Exercice libre dans un Circuit libre ou dans un Circuit contenant déjà des Exercices formatés : **admis** ; conserver son absence de Format ; adapter uniquement l'organisation et le nombre actif compatible.
- Exercice formaté dans un Circuit : conserver Format et réglages propres ; valider la compatibilité de l'organisation et du compte selon la matrice des six Formats, avant toute mutation. Les combinaisons non compatibles sont **refusées sans altération**.
- Exercice sortant d'un Circuit : conserver son Format et ses paramètres actuels ; la sortie ne renomme ni ne modifie les autres Exercices ou le Circuit.
- Circuit réduit à un Exercice : il subsiste et conserve sa nature et son compte.
- En alternance, confirmer si l'adaptation de N ferait perdre des séries/valeurs ; ne pas assimiler une simple dépose à la **création volontaire d'un Exercice adoptant le Format**.
- Le nombre de séries en alternance contraint un paramètre déjà existant ; le régime (séries identiques/variables) reste propre à l'Exercice. Aucun compteur « Format du Circuit » n'est persisté.

### 2.5 D-18 à D-21, D-29 — Décisions d'exécution, **hors comportement moteur PRE-9**

- **D-18 :** arrêter un Death by termine **l'élément** ; la Séance peut poursuivre les éléments suivants. La formulation FMT-34 disant « met fin à la Séance » est remplacée **dans cette portée**. Ne pas affirmer que `main @ c73079e9` contenait déjà ce correctif ; un commit ultérieur `990542fd` l'a modifié sur une branche.
- **D-19 :** AMRAP / For time, un appui « tour terminé » acquiert au plus un tour ; un tour inachevé n'est pas acquis.
- **D-20 :** à l'échéance AMRAP, saisie des répétitions réellement faites du tour partiel, **0 proposé**. Death by possède déjà ses propres partiels dans FMT-37/38.
- **D-21 :** plafond temporel **optionnel** For time, arrêt à l'atteinte, résultat incomplet.
- **D-29 :** l'admission **fonctionnelle** de Death by alterné est décidée ; le raccordement des rangs/fenêtres, commandes générales et états partiels demeure à instruire en PRE-10/11. Il ne s'agit pas d'un arbitrage de configuration empêchant PRE-9.

**Portée du contrôle :** PRE-9 configure les Formats et produit un contrat d'instantané et de plan ; les horloges, échéances et résultats effectifs appartiennent au moteur PRE-10/11. Aucun défaut d'exécution ou de métrique absent ne sera inventé comme paramètre de configuration.

## 3. Modèle et présentation

- **Exercice :** possède `format_key` et `format_settings` facultatifs (prévu pour migration 017), paramètres propres, identité conservée à l'entrée/sortie d'un Circuit.
- **Circuit :** possède organisation, compte et liste ordonnée d'Exercices, mais **ni Format ni réglages de Format propres**. En-tête « Circuit A/B… ». **Replié**, deuxième ligne existante montrant les noms des Exercices et, lorsqu'ils en ont un, leur Format ; **déplié**, les cartes restent visibles (Figma `10717:20056`, `10725:20142`). Aucune classification obligatoire « homogène/mixte ».
- **Cycle :** contient des Exercices directs et des Circuits, répète toute sa séquence ; aucun Cycle imbriqué.
- **Séance :** contenu autonome unique enregistré/planifiable/lançable (D-449) ; origine de création distincte des Formats des Exercices.

Ne pas confondre **tour d'échelle For time**, **passage d'un Circuit**, **série d'un Exercice** et **répétition de Cycle**.

## 4. Traçabilité des corrections normatives

| Source antérieure | Règle cible / action |
|---|---|
| FMT-01, FMT-04, ch09/architecture : Format unique sur Séance ou Circuit | **Remplacé** par propriété exclusive de l'Exercice ; valeurs initiales rattachées à ses réglages. |
| FMT-02 / FMT-28, grilles de départs rapides | Retirer Gainage · Mobilité ; définir uniquement les quatre départs et Libre. |
| FMT-12/13, répétition de l'ensemble Tabata | Circuit groupé répète le passage complet ; Cycle répète une séquence ; aucun multiplicateur propre. |
| FMT-21/22 | EMOM : conserver la formule interne ; différencier ajout dans un EMOM (N conservé) et dépose de l'EMOM entier dans un Circuit alterné (N adapté). |
| FMT-26 | Clarifier « échéance globale » : **borne interne** de chaque bloc AMRAP ; la répétition extérieure recommence le bloc à sa durée configurée. Texte historique à conserver comme formulation remplacée **sur sa portée**. |
| FMT-30/31 et architecture For time | Tour = **rang de l'échelle** ; une répétition extérieure recommence l'échelle complète. |
| FMT-34 | Fin du Death by **élément**, pas fin de Séance ; mentionner la provenance ultérieure et la réserve PRE-11. |
| FMT-36 à FMT-38 | Saisie partielle Death by déjà définie ; AMRAP possède un déclencheur différent. |
| CE-FMT-03 §14 | Réappliquer **les constantes de l'Exercice formaté** et les contraintes de nature/N du Circuit, sans transfert implicite. |

**Aucune modification de code, migration SQL, Figma ou document de développement PRE-10/11 n'est entraînée par le présent texte.** Les anciennes règles ne doivent pas rester simultanément prescrites comme actives dans le registre, le PRD ou le plan BMAD.
