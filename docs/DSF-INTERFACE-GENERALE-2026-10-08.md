# DSF — règles générales d’interface — 08/10/2026

Source : [brief propriétaire](archives/planification-2026-10-08/demande-source.md). Décision D-327. Ces règles sont générales et ne sont pas limitées à la planification. Elles modifient le rendu ; les règles métier restent portées par les spécifications.

Les coordonnées x 24/y 802 et largeurs 354 décrivent la référence Figma 402×874. En développement, conserver les shells, Safe Areas et adaptations 360/402/440 : ancrage du pied, contenu défilant et cible tactile indépendante du dessin. La grille 18/20/13/12 concerne exactement les quatre relations ci-dessous, pas tous les espaces internes des composants. Elle n’interdit ni padding 4/8 ni marges de carte 16. Le fond blanc des modales est leur surface, distincte du voile #1F2129 à 34 % qui reste inchangé.

Les comptages 111/49/173/196/25/41 sont ceux du brief ; ils ne sont pas des résultats d’un nouveau recensement exhaustif. Les trois sets et leurs dimensions ont été relus le 08/10.

## 0. Règles d'interface de portée fichier

> **Avertissement de rédaction.** Les quatre règles de cette section ont été appliquées à **tout le prototype**, pas à la planification. Les écrire dans la documentation de la planification serait une erreur de classement : elles valent pour les catalogues, le Suivi, le Profil, la Composition, et tout écran futur. Elles appartiennent à la documentation d'interface / DSF. La documentation de la planification doit s'y **référer**, pas les redéfinir.

### 0.1 Grille d'écartement vertical

| distance | valeur |
|---|---|
| bas de la zone de contexte → première ligne de texte | **18 px** |
| dernier élément d'un bloc → titre de la section suivante | **20 px** |
| titre de section → son bloc | **13 px** |
| bloc → bloc, sans titre entre eux | **12 px** |

**Portée et ampleur du redressement**, à consigner car elle mesure l'incohérence corrigée :

- la première distance a été portée à 18 px sur **111 écrans** ; elle comptait **cinq valeurs distinctes** ;
- la seconde a été portée à 20 px sur **49 sections** ; elle comptait **dix-huit valeurs distinctes**.

**Le 12 px n'est pas une invention** : c'est l'écart standard entre deux cartes, relevé sur 24 paires consécutives dans les catalogues, sans exception. La grille s'aligne sur l'existant plutôt que de le contredire.

**Une seule exception, à documenter explicitement :** sur les **écrans de Profil**, la distance de 20 px n'est **pas** appliquée. Leurs contenus sont déjà encadrés et portent leur propre écartement. La distance de 18 px, elle, leur est bien appliquée.

**Corollaire sur la zone de contexte :** le titre porté par la zone de contexte (nom de l'exercice, nom de la séance, nom de la planification) est posé à la **même hauteur** dans tous les écrans, mesurée depuis le haut de la zone. L'écran de référence est `Ajouter un exercice — Initial`.

**Point de méthode indispensable**, car il fera trébucher toute vérification automatique future : la zone de contexte porte **trois noms de calque différents** selon les écrans — « Zone de contexte », « Zone bleue — Nom de l'exercice et média », « Fond gris — zone contenu Profil ». **Chercher par le nom donne un résultat faux.** Le seul critère fiable est la **forme** : un rectangle pleine largeur, en dégradé à trois arrêts — 0 % opaque, 80 % opaque, 100 % transparent — posé sous l'en-tête. Le bord visible est à 80 %, mais la référence de mesure est le **bas géométrique** du rectangle.

### 0.2 Le bouton d'action

| propriété | valeur |
|---|---|
| position | **y 802**, x 24 |
| dimensions | 354 × 48 |
| libellé | centré sur les deux axes |

Harmonisé sur **173 boutons** du fichier, qui occupaient **six positions différentes** entre y 786 et y 807. L'écran de référence est `Gabari bouton d'action`.

**Le centrage du libellé est une règle, pas un réglage par écran.** Il est désormais porté par le composant (§ 8.2) ; les boutons construits à la main hors composant doivent le respecter.

### 0.3 Fond des modales

**Toutes les modales du fichier sont blanches**, sans exception. Les modales de planification faisaient exception avec un fond #F9FAFC ; elles sont alignées sur la règle générale.

Corollaire : un bloc de section posé dans une modale est **gris** sur **fond blanc** (voir la spécification de planification), et non l'inverse.

### 0.4 Blocs de section

Spécification unique, valable partout où un groupe de lignes est encadré — Profil, planification, et tout écran futur :

| propriété | valeur |
|---|---|
| position / largeur | x 24, 354 |
| rayon | **12** |
| fond | **#F9FAFC** |
| trait | **aucun** |
| séparateurs internes | x 36, largeur 330, 1 px, **#E0E3E8** |

Le titre de section est **à l'extérieur** du bloc, 13 px au-dessus.

---

## 8. Changements du design system

Trois composants ont été modifiés. À documenter dans une note DSF datée, selon la convention du dossier, avec son entrée dans `INDEX.md`.

### 8.1 `DSF / Controls / Disclosure` — nouvel axe `Cadre`

Passe de 3 à **6 variantes** : `État` (Replié / Déployé / Désactivé) × **`Cadre` (Oui / Non)**, `Oui` par défaut.

- `Cadre=Oui` — le carré de 28 × 28 conserve son fond #FBFCFF et sa bordure #8283F2 de 2 px. **196 instances**, toutes les cartes du prototype.
- `Cadre=Non` — fond et bordure retirés, le chevron seul subsiste. **25 instances**, les lignes de formulaire.

Motif du nouvel axe : dans un formulaire, le cadre rend le repli trop proéminent — seul le chevron est nécessaire. Plutôt que de créer un second composant, l'axe a été ajouté à l'existant.

Le carré a par ailleurs été **recentré** dans les variantes `Cadre=Non` : il était à y 7 dans un composant de 48 de haut, soit 3 px au-dessus de son propre centre. Le même décalage subsiste dans les variantes `Cadre=Oui` — à corriger un jour, sachant que cela déplacerait un élément sur toutes les cartes.

**Note d'implémentation :** le cadre interne de 28 × 28 est conservé ; la cible interactive du composant reste 48 × 48 en `Cadre=Non`, seul son habillage disparaît. Le code doit garder la cible de 48 × 48, pas seulement le cadre interne ni le glyphe de 14 px.

### 8.2 `DSF / Actions / Bouton primaire` — variante `État=Actif` en auto-layout

La variante `État=Désactivé` était en auto-layout centré ; la variante `État=Actif` ne l'était pas, son libellé étant posé à une position calculée pour le mot « Enregistrer ». Elle est alignée sur sa jumelle, en auto-layout centré sur les deux axes. **41 instances** corrigées, dont 38 « Continuer » qui étaient décentrées de 4 px.

À consigner comme règle : **le centrage du libellé est porté par le composant.** Une position de texte posée à la main dans un bouton est un défaut, pas un réglage.

### 8.3 `DSF / Forms / Ligne interrupteur`

Composant canonique de la ligne « titre + chevron de repli + interrupteur ». Ses 9 variantes croisent `État` (Désactivé / Activé / Grisé) et `Repli` (Aucun / Replié / Déployé).

**À documenter :** `Repli` n'est pas une apparence mais trois situations distinctes.

| `Repli` | sens |
|---|---|
| Aucun | pas de contenu à déployer — aucun chevron |
| Replié | du contenu existe, il est caché — chevron bas |
| Déployé | du contenu existe, il est visible — chevron haut |

**Dettes à consigner :**

1. Les lignes « Répétition » et « Rappel » des écrans de planification reproduisent ce composant à la main (titre, chevron et interrupteur en calques séparés). Elles gagneront à être remplacées par une instance quand la forme sera figée.
2. Le libellé du composant est en Medium 14 alors que les titres de section du panneau sont en Semi Bold 16 — l'écart est surchargé sur chaque instance.
3. Le contrôle segmenté du Rappel est construit à la main : le composant `DSF / Controls / Segmenté` ne propose aucune variante au-delà de trois éléments.

---


## Références vérifiées et dettes conservées

- Bouton primaire : set 5544:4522 ; variantes 6981:14859/14861.
- Disclosure : set 5544:4650 ; variantes Cadre Oui 5544:4636/4639/4649 et Cadre Non 7501:13761/13764/13768 ; toutes 48×48. Cadre interne 28×28, x 7/y 7 avec cadre, x 7/y 10 sans cadre. Le recentrage observé est vertical ; aucun recentrage horizontal n’est déclaré.
- Ligne interrupteur : set 6679:26676, neuf variantes effectivement présentes. Aucun contenu à déployer / contenu caché / contenu visible sont trois situations distinctes.

Les compteurs et pages communautaires n’étendent pas à eux seuls le périmètre livré du MVP. Les règles générales ne permettent pas de déclarer toutes les anciennes captures réexportées : seules les captures listées dans la matrice du 08/10 sont nouvelles.
