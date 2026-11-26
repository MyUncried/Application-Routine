# KODJO — Claude Code : exécution, décomptes dynamiques en bas à droite (26/11/2026)

## Mandat et références

Projet : `MyUncried/Application-Routine`. Développement **maintenant**, en branche dédiée, publication d'une PR **sans fusion dans main**.

- Décision validée par le propriétaire le 26/11/2026 : **complément de D-529**, et contrat **CE-UI-14**.
- Normes à lire dans cette branche : `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` (D-529) et `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` (CE-UI-14).
- Historique : `_bmad-output/pre11/spec-pre11-formats.md` §5 point 34, `.github/orchestration/reports/2026-11-19_COINS-CHRONO-D529.md`. Les anciennes mentions « compte à rebours en bas à gauche » sont **supersédées**.
- Code à auditer avant changement : `src/features/execution/executionCorners.ts`, `ExecutionScreen.tsx`, `ExecutionCornerBadge.tsx`, `src/domain/execution/projection.ts` et tests d'exécution.
- Figma : `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » (`510:101`), pour le rendu visuel des coins et des états représentés. **Ne pas modifier Figma** ; la présente décision est comportementale. Une capture d'état de repos ne suffit pas à prouver le rendu d'un décompte actif.

Vérifier le HEAD réel des branches avant d'agir. Le présent prompt se trouve sur `docs/d529-coins-dynamiques-20261126` (créée depuis `main@410fc7911c3851533dd6fc5c141ec1ac311c4c34`). Créer une branche de développement à partir de cette branche documentaire, ou incorporer proprement son commit si `main` a avancé, sans perdre les ajouts et sans revenir à une documentation antérieure.

## 1. Résultat attendu : affectation fixe

| Coin | Donnée fonctionnelle |
|---|---|
| **Haut gauche** | Objectif de Série, de mouvement ou de pause, selon le contexte |
| **Haut droite** | Limite de temps : For time, AMRAP, fenêtre EMOM/Death by si pertinente |
| **Bas gauche** | Charge de la Série en cours ; charge de la prochaine Série pendant une pause |
| **Bas droite** | Une seule information dynamique active : compte à rebours de Série en Durée, compteur « mouv. » en Répétitions guidées par phases, décompte du repos EMOM en Répétitions, ou score AMRAP Max |

**Règle validée :** le compte à rebours d'une Série en Durée dans un Format (For time, AMRAP, EMOM en Durée ; autres Formats lorsqu'un tel décompte existe réellement) apparaît dans le **coin inférieur droit** pendant son activité, y compris lorsque la Série comporte une charge. La charge doit **rester visible** dans le coin inférieur gauche. Aucun réarrangement vers un coin voisin.

**Autre arbitrage validé :** le compteur de mouvements `autoRepetitions` est réservé aux séries en mode **Répétitions avec guidage par phases**. Ne pas le créer pour l'EMOM en Durée. Dans ce dernier, le coin inférieur droit contient le compte à rebours de Série actif ; en son absence, il reste vide.

Lors d'une retenue du compte à rebours : reprendre le comportement existant (couleurs, durée figée, clignotement final), sans changement de chronométrage ni de logique de pause.

## 2. Examen et corrections minimales

1. Vérifier les données réellement disponibles pour chaque format et chaque étape (`durationActive`, `autoRepetitions`, `restCountdownMs`, `amrapScore`, `cornerLoad`). Ne déduire aucune donnée absente.
2. Faire de `executionCorners.ts` la **seule autorité de placement**. `SERIES_COUNTDOWN` doit correspondre à `BOTTOM_RIGHT` dans `CORNER_OF` et dans les seules lignes de `CORNER_TABLE` qui acceptent effectivement le décompte ; retirer son exclusivité avec `LOAD` en bas à gauche.
3. Garantir l'**exclusivité entre les informations dynamiques** du bas à droite, et l'absence de clignotement/artefact quand la source change entre deux étapes.
4. Vérifier le cas **Death by** : le modèle actuel peut exposer un décompte de durée ; n'ajouter cette affectation que si la projection actuelle expose effectivement une Série en Durée active, sans inventer de mécanisme nouveau. Consigner le résultat.
5. Vérifier le cas **Tabata / Intervalles 30/30** : conserver la logique existante des objectifs et de l'horloge. Ne pas générer de décompte de coin supplémentaire s'il n'existe pas.
6. Préserver les règles du chrono principal, de l'anneau, des points d'arrêt, des pauses/récupérations, de la progression, des signaux, du bouton « +Tour », de l'affichage Série/Tour/Cycle et des couleurs du composant. Ne pas modifier le domaine, la base de données ni les services si la règle peut être réalisée par la seule projection/présentation.
7. Préserver la forme géométrique des quatre triangles et les dimensions Figma, ainsi que les références Unicode/UTF-8 de la documentation. Aucun changement de style non requis.

## 3. Tests de non-régression obligatoires

- Test de table `CORNER_OF` : `SERIES_COUNTDOWN = BOTTOM_RIGHT`, `LOAD = BOTTOM_LEFT`, quels que soient les formats.
- **For time** : Série en Durée active **avec charge** → décompte en bas à droite **et** charge en bas à gauche, objectif et temps max inchangés.
- **AMRAP** : même situation, avec temps limite du bloc en haut à droite.
- **EMOM en Durée** : intervalle haut droite, objectif haut gauche, charge bas gauche, décompte actif bas droite ; jamais de compteur « mouv. » inventé.
- **EMOM en Répétitions** : décompte du repos en bas à droite uniquement pendant le repos ; charge conservée en bas gauche.
- **Répétitions guidées par phases** : le compteur de mouvements reste en bas à droite, sans décompte de Série en Durée concurrent.
- **AMRAP Max** : score cumulé toujours en bas à droite.
- **Absence de donnée** : coin vide, aucun décalage des trois autres.
- **Transition de Série ou d'état** : aucune superposition de badges dans le coin bas droite.
- **Death by et Tabata / 30-30** : tests confirmant le comportement réellement supporté, sans extension fonctionnelle.
- Vérification du cas de **retenue / reprise** pour la couleur et le figement du décompte.

Exécuter tests ciblés, TypeScript, lint sur les fichiers modifiés. Ne pas déclarer de recette mobile vérifiée sans test réel sur iPhone.

## 4. Livraison et vérification indépendante

- Avant édition : état Git propre, baseline réelle, fichiers autorisés, diff attendu, classification PRESERVE / CHANGE / FORBIDDEN.
- Après édition : seconde passe indépendante de recherche des variantes « décompte Série en bas gauche », exceptions historiques, tests et contrats ; aucune contradicton active.
- Si un écart UX/Figma demeure, le signaler **À CLARIFIER**, ne pas créer de règle produit par inférence d'une capture.
- Publier le commit et ouvrir une PR de développement **sans fusion**. Aucun fichier temporaire ni rapport de travail non demandé hors des rapports d'orchestration usuels.
- Remettre : branche, commit, PR, diff, tests (réussis/échoués/non exécutés), risques, matrice de conformité par format, points non vérifiables sur simulateur et procédure de recette iPhone.

**Objectif :** il n'y a plus aucun cas actif où une Série en Durée masque la charge parce que son décompte utilise le bas gauche. Le décompte est en bas droite ; l'absence de compteur de mouvements en EMOM en Durée est normale.
