# PRE-3 — Plan final proposé à la validation propriétaire

Opération [#340](https://github.com/MyUncried/Application-Routine/issues/340). Statut : **EN ATTENTE DE VALIDATION PROPRIÉTAIRE**. Aucun développement commencé.

## Références exactes à valider

- Plan et annexes : commit `43e7b344937a2d60b04b987f19636faebb5aee06`, branche existante `plan/pre3-vnext-20261008`.
- [Plan technique](https://github.com/MyUncried/Application-Routine/blob/43e7b344937a2d60b04b987f19636faebb5aee06/docs/preparation/PRE-3/planification/passe2/plan-technique-corrige.md), [manifest](https://github.com/MyUncried/Application-Routine/blob/43e7b344937a2d60b04b987f19636faebb5aee06/docs/preparation/PRE-3/planification/passe2/manifest.json).
- SHA-256 du manifeste : `16c155548ba161778f8780e664c65561b7c0d7e27666ca34481ec33a75cc08ff`.
- Baseline applicative analysée : `1ddfb6d144552f578388257adc78db47ab5992c8`. La baseline d'exécution et les changements ultérieurs seront revalidés avant écriture ; aucun contexte plus récent n'est déclaré implicitement approuvé.
- [Revue 3 APPROVE](https://github.com/MyUncried/Application-Routine/blob/d5d016674e09042bc49410100eec6f6c02197d8f/docs/preparation/PRE-3/planification/passe2/reviews/2026-10-09_revue-passe3-claude.json), publiée au commit `d5d016674e09042bc49410100eec6f6c02197d8f`. Ce commit ajoute seulement les trois rapports ; aucun fichier du plan n'a changé.

Lecture consolidée des revues 2 et 3 : **13 constats initiaux RESOLVED ; REG-01 et REG-02 RESOLVED ; aucune nouvelle régression causale.** Les onze résolutions de la revue 2 sont conservées, pas recréées par le pilote. Deux réserves non bloquantes sont détaillées ci-dessous.

## Résultat produit attendu

Les 23 exigences P3-01 à P3-23 restent intégrales : quatre parcours Catalogue/Séance, éditeur et référentiels, paramètres/modes/brouillons, normalisation N=1, calculs indépendants et inversion, 276 phrases/gras, SQLite/migrations/copies/instantanés, médias locaux ordonnés et conservés, surfaces Figma et accessibilité ciblée.

Les preuves futures sont réparties entre tests métier/SQLite/fichiers réels, comparaisons visuelles par état et contrôles réellement perceptifs/natifs. Aucun test de base de données ou calcul n'est transféré à Hermann. 95 états, 41 frames, 6 725 éléments, 65 descendants masqués sont conservés. Aucun moteur d'exécution ni refonte hors PRE-3.

## Disposition proposée des réserves non bloquantes

Ces dispositions précisent des obligations futures dans les chemins déjà déclarés par le plan. Elles ne modifient ni le plan revu, ni ses empreintes, ni VNext. Leur acceptation est incluse explicitement dans la demande propriétaire ; aucune preuve exécutée ou résolution indépendante supplémentaire n'est inventée.

| Réserve | Impact / justification | Décision technique proposée | Statut avant validation |
|---|---|---|---|
| R-1 — suites secondaires citées sans obligation de surface | Les surfaces ont déjà une obligation dans ExecutionParametersSheet.test.tsx, donc aucune preuve nécessaire n'est retirée. Les suites secondaires doivent néanmoins avoir une responsabilité explicite avant d'être présentées comme preuves. | Dans DurationWheelPicker.test.tsx, adapter des tests d'intégration du composant : branche iOS déléguée à SwiftUI.Picker.wheel, labels/valeur/bornes fournis à la primitive, Valider/Annuler distincts, aucun commit au démontage. Dans ProfileStepper.test.ts, limiter les obligations à la politique PRE-3 optionnelle (voir R-2). Le maintien de la primitive et ses propriétés peuvent être contrôlés techniquement ; la perception VoiceOver/look & feel restent une preuve appareil distincte. Ajouter les obligations au suivi d'implémentation avant leurs preuves, sans prétendre que la liste de chemins les prouve. | OBLIGATION DE LIVRAISON PROPOSÉE, NON EXÉCUTÉE. Acceptation propriétaire attendue. |
| R-2 — ProfileStepper.test.ts CREATE alors que ProfileStepper.test.tsx existe | Le chemin .ts vient de la source initiale et figure déjà dans le périmètre autorisé. La suite .tsx teste la politique Profil baseline et reste à relancer. Risque : assertions dupliquées ou suppression accidentelle de la baseline. | Conserver les deux responsabilités distinctes déjà compatibles avec le plan : .tsx RUN_EXISTING pour les contrats Profil D-227 et comportement existant ; nouveau .ts pour la politique de geste PRE-3 explicitement optionnelle (début 500 ms, cadence 150 ms, accélération/paliers, bornes, arrêt sans tap, Bip/CR/Fin pas 1, absence d'activation de cette politique sur Profil). Ne pas recopier les tests D-227 dans .ts et ne pas remplacer .tsx. La revue d'implémentation vérifie cette séparation et la conservation. | DISPOSITION TECHNIQUE PROPOSÉE, NON EXÉCUTÉE. Acceptation propriétaire attendue. |

Aucune réserve n'autorise à omettre un contrôle applicatif, une comparaison visuelle ou une exigence normative. Si le code révèle qu'un contrat de la suite Profil doit réellement changer, la modification sera tracée et soumise aux règles de portée existantes ; aucun ajout silencieux au write_scope.

## Vérifications terminées et limites

- Vérificateur documentaire : 2 143 contrôles PASS, manifeste identique à la revue.
- Comparaison indépendante source ↔ propriétaires : 59/59 ensembles identiques ; obligations SQLite réelle rétablies.
- 13 cas numériques, 276 phrases et huit scénarios migration conservés ; ces données sont des attendus, pas des tests applicatifs.
- Publication vérifiée dans Git : revue 3 limitée aux trois rapports, tête de branche d5d016674e09042bc49410100eec6f6c02197d8f au contrôle.
- Aucun code applicatif testé, aucune comparaison de l'application livrée, aucune perception VoiceOver certifiée. L'omission de core.eol=lf par le reviewer ne constitue pas une dérive de contenu : la désactivation de conversion et les 2 143 contrôles ont confirmé les empreintes exactes.

## Décision propriétaire requise

Décision à recueillir : validation du **plan exact 43e7b344**, de ses annexes manifestées et des **dispositions R-1/R-2 ci-dessus**, pour engager l'implémentation PRE-3 selon le parcours autorisé.

Avant cette décision, owner_plan_approval reste false et aucun développement ne démarre. La validation ne transforme pas les attestations historiques en nouveaux reçus canoniques VNext ; aucune admission de développement n'est fabriquée. L'exception de planification déjà consignée reste limitée et aucune correction du protocole n'est engagée.

Après validation : consigner la décision liée à ces références, revalider le contexte/baseline et l'absence d'opération concurrente, préparer le handoff d'implémentation concret et appliquer les gates existants. La revue d'implémentation, la recette, les réserves et la livraison installable/versionnée restent à réaliser.
