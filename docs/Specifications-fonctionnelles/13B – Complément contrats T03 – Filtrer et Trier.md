# 13B – Complément normatif des contrats T03 — Filtrer et Trier

## 1. Statut et portée

Ce complément fait partie du **chapitre 13 — Contrats d’écran** pour T03. Il complète les contrats `CE-T03-01`, `CE-T03-02` et `CE-T03-05` sans créer un second modèle concurrent. En cas de divergence avec une formulation plus générale de `13 – Contrats d’écran.md`, les règles ci-dessous prévalent uniquement pour les contrôles `Filtrer` et `Trier` des Catalogues.

Arbitrage produit du 15 septembre 2026 :

- les contrôles `Filtrer` et `Trier` sont **communs aux trois Catalogues** `Activités`, `Séances`, `Circuits` ;
- leur représentation visuelle doit être commune ;
- le contenu de leurs options peut dépendre du segment actif ;
- le détail exhaustif des options n’est pas encore défini ;
- en T03, dans le **Catalogue des activités**, `Filtrer` est fonctionnel **au minimum pour accéder aux `Archivées`** ;
- en T03, `Trier` reste **visible mais désactivé** tant que ses options ne sont pas arbitrées ;
- aucune option supplémentaire de filtre ou de tri ne doit être inventée par le développement ;
- le design détaillé des panneaux/menus `Filtrer` et `Trier` n’est pas encore représenté dans Figma : il est donc `NON VÉRIFIABLE` visuellement au-delà du contrôle d’entrée lui-même.

## 2. Règle transverse Catalogue

### 2.1 Contrôle `Filtrer`

`Filtrer` est un contrôle partagé du Catalogue. Son composant d’entrée est identique quel que soit le segment actif. Le contenu présenté après activation est contextuel au segment.

Pour T03 / segment `Activités` :

- le contrôle est **actif** ;
- il permet obligatoirement d’atteindre l’état `Archivées` ;
- aucune autre option de filtre n’est contractuellement définie à ce stade ;
- l’implémentation ne doit donc pas créer silencieusement des options telles que zones corporelles, mode, date ou autres critères non arbitrés ;
- l’option `Archivées` sélectionne uniquement les `ActivityDefinition` archivées ;
- quitter puis revenir dans le parcours courant conserve ce filtre ;
- un relaunch complet ne le conserve pas.

Pour `Séances` et `Circuits`, ce complément ne définit pas le contenu des filtres. Les comportements existants ou futurs restent gouvernés par leurs décisions propres.

### 2.2 Contrôle `Trier`

`Trier` est visible dans le Catalogue mais **désactivé en T03** tant que son contenu contextuel n’est pas arbitré.

Le tri métier appliqué au Catalogue des activités reste néanmoins déterministe :

- tri initial / par défaut : `date de dernière modification décroissante` ;
- ce tri est appliqué automatiquement sans nécessiter l’ouverture du contrôle `Trier` ;
- une Exécution directe ne modifie pas la date de dernière modification de l’`ActivityDefinition` ;
- aucun menu de tri ne doit être ouvert, aucune option alternative ne doit être proposée, aucune valeur de tri utilisateur ne doit être persistée en T03.

L’état accessible du contrôle doit annoncer `désactivé` / `disabled` et ne pas être focusable comme action déclenchable selon les conventions de la plateforme.

## 3. Amendement CE-T03-01 — Catalogue des séances — état T03

Les sections 7, 8, 11, 12, 18, 19 et 20 de `CE-T03-01` sont complétées ainsi :

- la zone de commandes Catalogue prévoit les entrées communes `Filtrer` et `Trier` ;
- leur **aspect visuel est commun** aux segments, mais le contenu des options n’est pas déduit du segment `Activités` ;
- ce complément n’active pas de nouveaux filtres Séance ;
- aucune option de `Filtrer` ou `Trier` pour les Séances ne doit être inventée au titre de T03 ;
- l’existence de ces contrôles dans le Shell Catalogue n’autorise pas Claude à implémenter des fonctions non spécifiées pour le segment `Séances`.

Recette négative : implémenter dans `Séances` les options du filtre Activités par simple réutilisation métier = **NON CONFORME**.

## 4. Amendement CE-T03-02 — Catalogue des activités

### 4.1 Identification supplémentaire

Le contrat couvre explicitement :

- `S05 — Catalogue des activités — filtres ouverts` pour le seul état T03 déterminé `Archivées` ;
- `S06 — Catalogue des activités — tri` comme **contrôle visible disabled**, sans panneau de tri ;
- `S07 — Catalogue des activités — résultat archivé`.

### 4.2 Structure déterministe

La zone de commandes du Catalogue des activités contient les contrôles communs `Filtrer` et `Trier` avec le même langage visuel que les autres Catalogues.

`Filtrer` : actif.

`Trier` : visible disabled.

Aucune maquette détaillée du panneau `Filtrer` n’étant validée dans Figma à ce stade, le développement doit utiliser le composant partagé prévu par le Design System lorsqu’il sera disponible. Il est interdit de concevoir un nouveau panneau local au seul écran Activités sans arbitrage Figma/documentaire.

### 4.3 États

Les états contractuels de `CE-T03-02` deviennent :

1. liste active sans filtre Archives ;
2. état vide réel ;
3. recherche active ;
4. `Filtrer` ouvert avec accès à `Archivées` ;
5. filtre `Archivées` appliqué ;
6. `Trier` visible disabled ;
7. retour d’un sous-parcours avec restauration query/filtre/scroll ;
8. relaunch avec perte de cet état et retour global au segment `Séances`.

### 4.4 Contrôles et interactions

#### Filtrer

- tap sur `Filtrer` ouvre le contrôle de filtre partagé ;
- `Archivées` est l’unique option dont le comportement est exigé par T03 ;
- choisir `Archivées` affiche les définitions archivées et passe le cycle de vie sous la gouvernance de `CE-T03-05` ;
- le filtre est exclusif vis-à-vis de l’état liste active pour ce cas : une définition archivée ne reste pas simultanément affichée comme active ;
- annuler/fermer le filtre sans changement ne modifie pas la liste ;
- aucun autre critère ne doit être matérialisé tant qu’il n’est pas arbitré.

#### Trier

- visible ;
- disabled ;
- aucun tap, clavier, VoiceOver/TalkBack ou geste ne doit ouvrir un menu ;
- le tri automatique reste `updatedAt DESC`.

### 4.5 Validation et persistance

Le filtre `Archivées` est un **état UI de parcours**, pas une mutation des données. Il est restauré pendant l’aller-retour courant et perdu au relaunch.

Le contrôle `Trier` n’écrit aucune préférence en T03.

### 4.6 Accessibilité

- `Filtrer` : rôle bouton, actif ; son état doit permettre d’annoncer que le filtre Archives est appliqué lorsqu’il l’est ;
- `Trier` : rôle de contrôle visible, état disabled, non déclenchable ;
- l’utilisateur ne doit pas pouvoir atteindre un menu de tri par une technologie d’assistance alors que l’interface visuelle le marque désactivé.

### 4.7 Invariants

- `Archivées` est accessible via `Filtrer` dans le segment Activités ;
- `Trier` n’est jamais fonctionnel en T03 ;
- `updatedAt DESC` reste le tri par défaut ;
- aucune option de filtre ou de tri supplémentaire n’est inventée ;
- la représentation détaillée du panneau est `NON VÉRIFIABLE` Figma tant qu’une frame dédiée n’existe pas.

### 4.8 Recette déterministe

Cas minimum :

1. ouvrir Catalogue des activités ;
2. vérifier `Filtrer` actif ;
3. vérifier `Trier` visible disabled ;
4. ouvrir `Filtrer` ;
5. sélectionner `Archivées` ;
6. vérifier uniquement les ActivityDefinition archivées ;
7. restaurer une Activité puis vérifier disparition de la vue Archives selon `CE-T03-05` ;
8. revenir d’un sous-parcours et vérifier le filtre conservé ;
9. relaunch complet et vérifier perte du filtre ;
10. vérifier tri effectif `updatedAt DESC` ;
11. tenter d’activer `Trier` au tap, clavier et VoiceOver/TalkBack : aucun menu ne s’ouvre.

Tests négatifs :

- bouton `Filtrer` désactivé sur Activités ;
- archives accessibles par une navigation ad hoc parallèle au filtre ;
- menu `Trier` fonctionnel ;
- options de filtre/tri non arbitrées ;
- tri par ordre de création ou ordre alphabétique en remplacement du tri par défaut ;

→ **NON CONFORME**.

## 5. Amendement CE-T03-05 — cycle de vie ActivityDefinition

L’accès à l’état Archives n’est plus ambigu :

1. depuis le Catalogue des activités, l’utilisateur ouvre `Filtrer` ;
2. il choisit `Archivées` ;
3. la liste présente les `ActivityDefinition` archivées ;
4. une carte archivée propose les actions de cycle de vie définies par `CE-T03-05`, notamment Restaurer et Supprimer définitivement ;
5. Restaurer retire immédiatement la définition de la vue `Archivées` après succès de persistance ;
6. Supprimer définitivement retire la définition de cette vue après confirmation et succès ;
7. aucune de ces actions ne cascade vers les `SessionActivity`, snapshots, résultats ou Exécutions historiques.

Le filtre `Archivées` reste appliqué après une action tant que l’utilisateur demeure dans le parcours courant. Si la liste devient vide, afficher l’état vide du filtre Archives et non la liste active.

## 6. Figma et Design System

État contrôlé au 15 septembre 2026 :

- Figma contient des contrôles `Filtrer` représentés dans des états désactivés sur plusieurs écrans existants ;
- Figma ne contient pas encore le design détaillé validé des panneaux/options `Filtrer` et `Trier` pour le Catalogue multi-type T03 ;
- le comportement fonctionnel ci-dessus est donc validé, mais le **rendu détaillé du panneau** reste `NON VÉRIFIABLE` ;
- aucune nouvelle structure graphique ne doit être considérée comme validée avant mise à jour Figma.

Ce point ne bloque pas la définition du périmètre fonctionnel, mais il bloque toute affirmation de conformité visuelle exhaustive du panneau de filtre/tri.

## 7. Traçabilité

| Exigence | Décision | Contrats | Figma | Statut |
|---|---|---|---|---|
| Contrôles communs aux Catalogues | D-184 | CE-T03-01/02 | contrôle d’entrée existant, détail non conçu | PARTIELLEMENT CONFORME visuellement |
| Filtrer Activités → Archivées | D-184, D-169 | CE-T03-02/05 | panneau détaillé non disponible | CONFORME fonctionnel / NON VÉRIFIABLE visuel détaillé |
| Trier visible disabled | D-184 | CE-T03-02 | contrôle générique attendu | CONFORME fonctionnel |
| Tri par défaut updatedAt DESC | D-110 confirmé T03 | CE-T03-02 | non dépendant du panneau | CONFORME |
| Pas d’options inventées | D-184 | CE-T03-01/02/05 | — | CONFORME |

## 8. Frontière de développement

Claude peut implémenter dans T03 :

- présence du contrôle `Filtrer` ;
- accès fonctionnel à `Archivées` dans le Catalogue des activités ;
- conservation de cet état pendant le parcours courant ;
- présence de `Trier` en disabled ;
- tri par défaut déterministe déjà défini.

Claude ne doit pas implémenter sans nouvel arbitrage :

- une liste exhaustive d’autres filtres ;
- des options de tri utilisateur ;
- un nouveau composant visuel local spécifique aux Activités ;
- un comportement Filtrer/Trier pour `Circuits` ;
- une extension implicite des filtres du segment Activités au segment Séances.
