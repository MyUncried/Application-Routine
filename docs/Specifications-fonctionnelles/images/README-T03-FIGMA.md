# Évidences Figma — T03 Catalogue des activités

Ce répertoire contient les copies documentaires pérennes des évidences Figma T03. **Figma reste la source du rendu visuel courant** ; une copie physique n’est considérée comme courante qu’après réexport effectif depuis le node indiqué.

État contrôlé le **16 septembre 2026** dans le fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`.

## 1. Évidences Figma courantes

| Évidence | Node Figma | Statut Figma | Copie documentaire physique |
|---|---:|---|---|
| Catalogue des activités — liste | `3786:5093` | CONFORME | **À RÉEXPORTER** — `CE-ACT-EXE-01a-catalogue-activites-liste-t03.jpg` existe mais précède les dernières corrections du bandeau |
| Catalogue des activités — Créer — arbre d’actions | `3787:5148` | CONFORME | **À RÉEXPORTER** — `CE-ACT-EXE-01b-catalogue-creer-arbre-actions-t03.jpg` existe mais précède les dernières corrections du bandeau/ancrage |
| Catalogue des séances — liste par défaut | `1992:9910` | CONFORME | À CRÉER |
| Recherche globale — Champ déployé | `1992:10129` | CONFORME | À CRÉER |
| Création activité — Répétitions / Pause / Séries — avec mode | `3561:4695` | CONFORME | À CRÉER |
| Création activité — Répétitions — roulette compacte ouverte | `3561:7673` | CONFORME | À CRÉER |
| Création activité — À l’échec | `3561:7802` | CONFORME | À CRÉER |

Le node historique `3787:5209`, auparavant utilisé pour `CE-ACT-EXE-01c-catalogue-action-contextuelle-t03.jpg`, **n’existe plus dans le Figma courant**. Il n’est plus une évidence normative et ne doit plus être cité par les contrats d’écran ou l’INDEX.

## 2. Décision visuelle — bandeau `Créer / Filtrer / Trier`

Les frames Catalogue des séances, Catalogue des activités et le fond de `Recherche globale — Champ déployé` appliquent désormais le même bandeau :

- ordre exact : `Créer`, `Filtrer`, `Trier` ;
- à la référence `402 pt`, chaque surface visible mesure `108 × 32 pt` ;
- espace entre contrôles : `8 pt` ;
- groupe total : `340 pt`, centré horizontalement ;
- positions de référence Figma : `x=31`, `x=147`, `x=263` ;
- `Créer` et `Filtrer` : état actif bleu ;
- `Trier` : état visible désactivé T03.

Dans les écrans d’arbre `Créer` ouvert (`3787:5148` et `3841:8375`), `Créer` conserve cette géométrie et sert d’ancrage à l’arbre ; `Filtrer` et `Trier` restent visibles sous le scrim mais ne sont pas interactifs.

Ces dimensions décrivent la **surface visuelle Figma**. La cible accessible reste soumise à l’exigence transverse ≥ `48 × 48 pt`.

Le contrôle d’entrée est donc **vérifiable**. Le détail des panneaux/options ouverts de `Filtrer` et `Trier` reste **NON VÉRIFIABLE**, aucune frame dédiée n’ayant encore été validée.

## 3. Décision visuelle — éditeur Activité

Sur les frames :

- `3561:4695` — Répétitions ;
- `3561:7673` — Répétitions, roulette compacte ouverte ;
- `3561:7802` — À l’échec ;

le contrôle de deuxième rangée affiche maintenant explicitement le libellé **`Durée totale >=`** et sa valeur calculée de démonstration. Cette représentation matérialise la règle fonctionnelle `Durée totale : ≥ {durée connue}` ; elle n’introduit aucune nouvelle formule.

Dans les écrans `Création activité` renseignés, `Renforcement du genou` est une **valeur de démonstration Figma**. Il ne constitue pas une valeur par défaut. L’écran `Création activité — Durée / Pause / Séries — Vide` conserve le placeholder `Nom de l’activité`.

## 4. Autres évidences inchangées

- `2537:1033` — contrôle `Déployer` canonique, visible mais fonctionnellement désactivé dans le Catalogue des activités T03 ;
- `2537:214` — `Navigation / Bottom — Source exact`, dessins de destination max `24 pt` centrés dans des boîtes `32 × 32 pt` ;
- `3788:5258` — Composition — Ajouter une activité — arbre ;
- `3789:5349`, `3789:5405` — sélection multiple ;
- `3879:5947`, `3879:6079` — éditeur de référence persistante ;
- `2028:11700`, `2028:11808` — Composition / actions glissées ;
- `2028:11204` — Catégories.

## 5. Statut des copies physiques

Les copies binaires présentes dans ce répertoire ne sont **pas déclarées à jour** pour les sept frames listées au §1 tant que leur réexport physique n’a pas été remplacé/ajouté dans Git.

Le canal Figma utilisé permet de contrôler et d’exporter les frames, mais le connecteur GitHub disponible dans cette session ne permet pas de transférer directement ces exports binaires depuis Figma. En conséquence :

- état Figma : **CONFORME** pour les frames contrôlées ;
- documentation textuelle et contrats : mis à jour sur la branche documentaire ;
- copies d’écran physiques : **PARTIELLEMENT CONFORME / À RÉEXPORTER**.

Aucune ancienne capture n’est présentée ici comme preuve visuelle courante après une modification Figma non réexportée.
