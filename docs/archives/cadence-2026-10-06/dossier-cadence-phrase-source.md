# Dossier — Cadence des répétitions et phrase de synthèse

05/10/2026

## 1. Objet et pièces

Ce dossier rassemble ce qui a changé dans Figma pour la cadence des répétitions et la phrase de synthèse, et ce qu'il faut inscrire dans la documentation pour que les deux concordent.

Fichier Figma : `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » (`510:101`). Les modifications portent sur 30 écrans et 2 composants du DSF.

**Pièces jointes**

| Pièce | Contenu |
| --- | --- |
| `generateur-phrase-activite_v13.xlsx` | Grammaire de la phrase, 100 combinaisons, règles de calcul des durées |
| Conception fonctionnelle Cadence V1 | Source des règles de cadence, déjà close |

**Deux chantiers distincts**, menés ensemble parce qu'ils touchent les mêmes écrans : la cadence, qui ajoute un paramètre et change les symboles de durée ; la phrase de synthèse, qui passe d'un assemblage de segments à un texte unique généré.

## 2. Règles de la cadence

La cadence est une propriété facultative de la Série, en mode Répétitions uniquement. Entier de 1 à 60 secondes, jamais présélectionné. Le terme est retenu au sens où le sport l'emploie : le nombre d'occurrences d'un mouvement par unité de temps, ou l'intervalle entre deux occurrences, sans rien prescrire à l'intérieur du geste.

| Règle | Énoncé |
| --- | --- |
| Portée | Mode Répétitions seulement ; absente en Durée et À l'échec |
| Valeur | Entier 1 à 60 s, facultatif, aucune valeur par défaut |
| Séries variables | Chaque série reçoit la cadence commune ; édition individuelle non exposée dans cette version |
| Propagation | Modifier la cadence commune la propage à toutes les séries ; la supprimer la supprime partout |
| Changement de mode | Restaurée au retour en Répétitions avant validation ; effacée après validation d'un autre mode |
| Durée estimée | Série cadencée : répétitions × cadence. Non cadencée : environ 2 s par répétition |

**La convention de 2 s par répétition reste une estimation** et ne devient jamais une cadence implicite. Aucune migration ne doit attribuer 2 s à un exercice existant.

### Symbole de la durée

C'est le changement qui touche le plus d'écrans.

| Cas | Symbole |
| --- | --- |
| Toutes composantes déterminables | aucun |
| Répétitions non cadencées | ≈ |
| Une composante non estimable | ≥ |
| Mode À l'échec | durée totale omise |

Le `≥` l'emporte sur le `≈` lorsque les deux coexistent. **Règle supersédée** : la documentation actuelle affiche `≥` pour toutes les répétitions ; ce n'est plus vrai.

## 3. Phrase de synthèse

La phrase est désormais **un texte unique généré à la validation des paramètres**, et non plus un assemblage de segments positionnés. Les valeurs paramétrées s'y affichent en gras, sur la couleur de texte normale — plus de fond gris ni de bleu, puisque toute la zone ouvre la modale et qu'aucun segment n'est cliquable isolément.

La grammaire complète et les 100 combinaisons sont dans `generateur-phrase-activite_v13.xlsx`. En voici la structure.

| Groupe | Contenu | Exemple |
| --- | --- | --- |
| 1 | Nombre de séries | 3 séries |
| 2 | Contenu de la série, selon le mode | de 12 répétitions cadencées toutes les 4 s |
| 3 | Pause entre séries | , séparées par 15 s de pause |
| 4 | Côtés et pause au changement | , en alternant le côté droit puis le gauche à chaque série |
| 5 | Durée totale, phrase séparée | Durée totale : 5 min 53 s. |

### Règles nouvelles

- **Séries variables** : énumération jusqu'à 3 séries, intervalle au-delà. « 3 séries de durée variable (30 s, 45 s puis 1 min) » ; « 6 séries variables, de 30 s à 1 min 30 s ».
- **Cadence** : suffixe accolé aux répétitions, « cadencées toutes les 4 s ».
- **Côtés** : trois formulations selon l'ordre — une seule série, alternance à chaque série, un côté après l'autre. La mention « sans changement de côté » disparaît : la phrase n'énonce plus ce qui n'a pas lieu.
- **Durée totale omise** quand elle égale la durée de la série, c'est-à-dire une série unique en mode Durée sans changement de côté.
- **Avec une seule série**, l'ordre des côtés n'a aucun effet : une seule formulation.

### Encombrement

Mesuré dans Figma, Inter Regular 13, interligne 20, largeur 324 px.

| Caractères | Lignes | Hauteur du texte | Hauteur du bloc |
| --- | --- | --- | --- |
| 98 | 3 | 60 px | 124 px |
| 176 | 4 | 80 px | 172 px |
| 219 | 5 | 100 px | 192 px |

Environ 45 caractères par ligne, 20 px par ligne. Le pire cas de la matrice atteint 211 caractères.

## 4. Écrans Figma

### Créés

| Écran | Contenu |
| --- | --- |
| Création activité — Paramètres en modale — 13 Répétitions avec cadence | Cadence à 4 s, durée totale déterminable : 4 min 45 s |
| Création activité — Paramètres en modale — 14 Cadence (roulette ouverte) | Roulette à une colonne, 1 à 60 s, unité « secondes par répétition » |
| Création activité — Phrase longue (198 caractères) | Cas d'encombrement maximal de la phrase |

### Ligne de cadence ajoutée

Entre Répétitions et Pause après chaque série, indentée à x = 52, valeur « Aucune » calée à droite. Six écrans : 10 Répétitions, 10b copie, 13, 14, Séries variables — 3 Répétitions variables, Changement de mode — 11.

Sur les écrans en séries variables, la cadence est posée hors du tableau, ce qui traduit la règle : commune à toutes les séries, non éditable ligne à ligne.

### Symbole de durée corrigé

Quatre écrans de modale passent de `Durée totale ≥` à `Durée totale ≈` : 10 Répétitions, 10b copie, Séries variables — 3 Répétitions variables, Changement de mode — 11. Les écrans en mode Durée affichent `Durée totale` sans symbole.

Treize écrans de catalogue passent de `≥` à `≈` : huit au catalogue des séances, cinq au catalogue des exercices. Plus aucun `≥` ne subsiste dans le fichier.

### Phrase en texte unique

31 écrans. Fond gris retiré et texte passé en noir sur 111 instances de valeur.

### Hiérarchie et séparateurs

Changements de forme appliqués à l'ensemble des 25 modales de paramètres.

| Modification | Portée |
| --- | --- |
| Indentation à x = 52 des lignes dépendantes | Séries variables, Durée d'une série, Répétitions, Cadence, Pause après chaque série, Ordre des côtés, Pause entre les côtés |
| Séparateur raccourci à 314 px au-dessus d'une ligne indentée | Toutes les modales concernées |
| Séparateur ajouté au-dessus de Séries | 7 modales à contrôle segmenté |
| Séparateur retiré sur le bord du cadre des séries variables | 8 écrans |

### Composants du DSF

`DSF / Forms / Roulette` reçoit une quatrième variante, `État=Secondes avec unité`, 330 × 150 : une seule colonne de valeurs et la zone d'unité à droite. L'écran 14 en utilise une instance ; il ne reste plus d'éléments locaux.

`DSF / Forms / Valeur modifiable` reçoit un axe `État` avec les options Normal et Grisé. La variante grisée lie son texte à `color/disabled` (`#BEC2CC`). Motif : une valeur désactivée restait en bleu atténué et se lisait comme cliquable.

## 5. Champs et modèle

| Élément | Nature | Détail |
| --- | --- | --- |
| `repetitionIntervalSeconds` | Ajouté | Entier 1 à 60, facultatif, sur `SeriesParameters` — version commune et par série. Nul par défaut |
| `estimatedCadenceDurationSeconds` | Dérivé | répétitions cibles × cadence |
| Retour des calculs de durée | Modifié | Trois niveaux — déterminable, approximatif, non estimable — là où un booléen suffisait |
| État moteur | Ajouté | Intervalles acquis, début de l'intervalle courant, indicateur de fin nominale, accumulateur de durée réelle distinct du chronomètre |
| Instantané d'exécution | Modifié | Conserve la cadence effective de chaque série |
| Générateur de phrase | Ajouté | Fonction de composition du texte, avec ses règles d'accord |

**La phrase est générée, pas assemblée.** Les accords y vivent : série ou séries, menée ou menées, séparée ou séparées, et le choix entre énumération et intervalle selon le nombre de séries. C'est une fonction à écrire et à tester, pas un gabarit à trous.

**Prérequis d'implémentation.** Le code porte encore `repetitionCount`, `seriesCount` et `pauseSeconds` en propriétés scalaires sur `ActivityDefinition`, et ne matérialise pas partout le modèle des séries variables. La cadence suppose ce modèle : l'écart est à résorber avant, pas pendant.

## 6. Documentation à mettre à jour

### Contradictions à superséder

| Ancienne règle | Nouvelle règle |
| --- | --- |
| Bip à la minute pour toutes les répétitions | Non cadencées : bip minute. Cadencées : signaux de cadence, sans bip minute parallèle |
| Part de série acquise uniquement à la validation | Non cadencées : comportement historique. Cadencées : progression temporelle, puis validation séparée |
| `≥` pour toutes les répétitions | Déterminable : aucun symbole. Non cadencées : `≈`. Non estimable : `≥` |
| Reprise depuis l'état temporel exact | Série cadencée : temps actif conservé, intervalle incomplet abandonné, nouvel intervalle complet à la reprise |
| Pause de sécurité 2 h pour toute répétition | Cadencées : 30 min après la fin nominale recalculée. Non cadencées et à l'échec : 2 h |
| Phrase assemblée de segments, valeurs en bleu sur fond gris | Texte unique généré, valeurs en gras noir |
| Mention systématique « sans changement de côté » | Omise quand il n'y a pas de changement de côté |

### Documents à contrôler

`docs/PRODUCT.md` · `docs/INDEX.md` · `00 Glossaire` · `01 Vision générale` · `03 Parcours utilisateur` · `04 Modèle fonctionnel` · `06 Écrans et navigation V1` · `07 Registre des décisions` · `08 Conception fonctionnelle détaillée` · `09 Modèle de données fonctionnel` · `10 Règles métier transverses` · `11 API fonctionnelles` · `12 Architecture technique` · `13 Contrats d'écran` · spécification des paramètres en modale v12 · documentation DSF.

### Formulations à rechercher

« bip chaque minute » · « Répétitions ou À l'échec » traités indistinctement · `≥` systématique · « 2 s par répétition » présenté comme borne · série en répétitions toujours non chronométrée · progression acquise uniquement avec Suivant · pause de sécurité 2 h pour toute répétition · reprise exacte de l'intervalle après pause.

## 7. Décisions prises

| Sujet | Décision |
| --- | --- |
| Libellé de la ligne | **Cadence**. Le terme désigne le nombre d'occurrences par unité de temps, sans rien prescrire à l'intérieur du mouvement — c'est l'usage du sport. Objection levée |
| Roulette | Variante `État=Secondes avec unité` créée dans `DSF / Forms / Roulette` ; l'écran 14 en utilise une instance |
| Séries variables au-delà de 3 | « 6 séries variables, de 6 à 15 répétitions ». La virgule sépare le nombre de séries de l'intervalle |
| Durée totale | Mesure le travail prévu. Le compte à rebours et la fin d'exercice n'y entrent pas |
| Tempo multi-phases | Hors périmètre, sans mention d'évolution |
| Symbole des cartes | La séance « Renforcement du genou » ne contient aucun exercice à l'échec : son `≥` venait du Squat assisté en répétitions. Les 13 écrans de catalogue passent à `≈` |

## 8. Reste à faire

**Exécution et synthèse.** Trois états n'existent pas et sont à créer, non à modifier : série cadencée en cours avec sa position dans l'intervalle, fin nominale atteinte alors que la série reste active, reprise après pause redémarrant un intervalle complet. Sept écrans d'exécution et trois de synthèse sont concernés.

**Points techniques à qualifier.** Précision des signaux en arrière-plan sur iOS et Android, comportement écran verrouillé, ordonnancement sans minuteur permanent, restauration de l'ancre temporelle après suspension, accumulation des durées réelles à travers les réinitialisations, migration vers le modèle cible des séries variables.
