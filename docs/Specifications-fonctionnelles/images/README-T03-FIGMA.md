# Évidences Figma — T03 Catalogue des activités

Les captures de référence de cette tranche sont stockées physiquement dans ce répertoire afin de rester visibles après export/import de la documentation. Les liens Markdown utilisent exclusivement des chemins relatifs vers ces fichiers ; aucune URL temporaire Figma n’est requise pour afficher les images.

## 1. État des preuves physiques existantes

| Évidence historique | Node Figma d’origine | Fichier documentaire | Statut au 16/09/2026 |
|---|---:|---|---|
| Catalogue des activités — liste | `3786:5093` | `CE-ACT-EXE-01a-catalogue-activites-liste-t03.jpg` | **À RÉEXPORTER** : le node existe mais a reçu la nouvelle rangée `Créer / Filtrer / Trier` après l’export du 15/09. |
| Catalogue — Créer — arbre d’actions | `3787:5148` | `CE-ACT-EXE-01b-catalogue-creer-arbre-actions-t03.jpg` | **À RÉEXPORTER** : le node existe mais la rangée et l’ancrage de `Créer` ont changé après l’export du 15/09. |
| Catalogue — action contextuelle directe | `3787:5209` | `CE-ACT-EXE-01c-catalogue-action-contextuelle-t03.jpg` | **HISTORIQUE UNIQUEMENT** : le node n’existe plus dans le Figma courant ; aucun remplacement n’est inventé. |

Les trois fichiers ci-dessus sont conservés physiquement pour traçabilité. Ils ne doivent pas être décrits comme des copies courantes du Figma du 16 septembre tant qu’un nouvel export binaire n’a pas été effectivement écrit et vérifié dans le dépôt.

## 2. Évidences Figma courantes vérifiées le 16 septembre 2026

Les nodes suivants ont été contrôlés directement dans le fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page `Prototype MVP` :

| Axe | Node Figma | État vérifié |
|---|---:|---|
| Catalogue des activités — liste | `3786:5093` | rangée `Créer / Filtrer / Trier` présente ; trois contrôles `108 × 32 pt`, gap `8 pt`, ensemble centré ; `Trier` disabled. |
| Catalogue des activités — Créer — arbre | `3787:5148` | trois commandes visibles sous scrim ; arbre porté par `Créer` et réancré à sa position gauche. |
| Catalogue des séances — liste | `1992:9910` | même rangée commune `108 / 108 / 108`, gaps `8 pt`, centrée ; `Trier` disabled. |
| Recherche globale — Champ déployé | `1992:10129` | rangée Catalogue conservée dans l’arrière-plan du contexte de recherche/clavier. |
| Catalogue des séances — Créer — arbre | `3841:8375` | même principe d’arrière-plan et d’ancrage sur `Créer`. |
| Création activité — Répétitions / Pause / Séries — avec mode | `3561:4695` | nom démo `Renforcement du genou`; contrôle `Durée totale >=`. |
| Création activité — Répétitions — roulette compacte ouverte | `3561:7673` | nom démo `Renforcement du genou`; contrôle `Durée totale >=`. |
| Création activité — À l’échec | `3561:7802` | nom démo `Renforcement du genou`; contrôle `Durée totale >=`. |
| Création activité — Durée / Pause / Séries — Vide | `3943:6064` | état vide `Nom de l’activité`; contrôle `Durée totale`. |
| Déployer canonique | `2537:1033` | composant canonique du Catalogue. |
| Navigation basse canonique | `2537:214` | source DSF de navigation. |

### Géométrie de la rangée Catalogue

Dans la référence Figma `402 pt`, la rangée vérifiée est :

- `Créer` : `x=31`, `108 × 32 pt` ;
- `Filtrer` : `x=147`, `108 × 32 pt` ;
- `Trier` : `x=263`, `108 × 32 pt` ;
- gaps : `8 pt` ;
- marges gauche/droite de l’ensemble : `31 pt`.

Ces coordonnées sont des **mesures d’évidence Figma pour la recette visuelle**. Elles ne constituent pas des positions absolues à reproduire en React Native. Les cibles tactiles restent ≥ `48 × 48 pt` conformément au contrat responsive/accessibilité.

### Éditeur Activité

`Renforcement du genou` est une **valeur de démonstration Figma**, jamais un libellé statique. Seul l’état vide `3943:6064` conserve `Nom de l’activité` comme état vide/placeholder.

En Répétitions et À l’échec, le contrôle visible porte `Durée totale >=`. La Synthèse fonctionnelle reste formulée `Durée totale : ≥ {durée connue}` : le libellé court du contrôle ne modifie pas la règle métier.

## 3. Périmètre encore non vérifiable visuellement

Les **contrôles d’entrée** `Créer`, `Filtrer` et `Trier` sont conçus et vérifiables dans Figma.

Seul le détail des **panneaux/options ouverts** `Filtrer` et `Trier` reste `NON VÉRIFIABLE` / `À CLARIFIER`, car aucune frame dédiée validée n’existe encore. Cette absence interdit d’inventer localement une modale, feuille, popover ou liste d’options.

## 4. Historique des exports

État du 15 septembre 2026 :
- le contrôle `Déployer` des cartes Activité réutilisait le composant DSF canonique `2537:1033 — State=Collapsed`, visible mais fonctionnellement désactivé en T03 ;
- le composant `Navigation / Bottom — Source exact` (`2537:214`) utilisait des dessins de destination de dimension maximale `24 pt`, recentrés dans les boîtes optiques `32 × 32 pt` ;
- les trois fichiers `CE-ACT-EXE-01a/01b/01c` avaient alors été réexportés après ces deux corrections.

État du 16 septembre 2026 :
- Figma a été contrôlé après propagation de la nouvelle rangée `Créer / Filtrer / Trier`, des états arbre, de Recherche globale et des corrections de l’éditeur Activité ;
- les copies binaires physiques correspondantes **ne sont pas déclarées réexportées dans cette passe** tant que le dépôt ne contient pas les nouveaux fichiers effectivement transférés et vérifiés.

Cette distinction est volontaire : Figma reste la source du rendu visuel courant ; une vérification Figma ne vaut pas à elle seule preuve qu’une copie binaire documentaire a été physiquement remplacée dans GitHub.
