# Exigences produit applicables au chantier OpenSpec

Extraites des instructions d’origine (base `main` `6656fefc`). Chaque règle cite sa source ; la source fait foi.

## P-1 — Sources de vérité et séparation documentation / Figma

> « 1. Documentation fonctionnelle = comportements et règles métier.
> 2. Documentation technique = contraintes et choix d’implémentation.
> 3. Figma = rendu visuel et états d’interface représentés.
> 4. Registre des décisions = arbitrages explicitement validés. »
> — `.github/AI_ORCHESTRATION.md` § « Sources de vérité » (le point 5, GitHub comme état de tâche, relève de l’orchestration).

> « Les règles métier, calculs et comportements sont définis ici ; Figma décrit les dispositions visuelles et illustre des états. Les valeurs de démonstration des captures ne définissent pas les calculs. »
> — `docs/INDEX.md`

## P-2 — Ne jamais inventer une règle

> « Ne jamais inventer une règle. Une ambiguïté nécessaire non résolue par les sources déclenche `CLARIFICATION_REQUIRED`. Une inconnue non nécessaire à la tranche est reportée sans décision implicite. »
> — `.github/AI_ORCHESTRATION.md` § « Sources de vérité »

Application dans ce chantier : toute ambiguïté est consignée comme constat avec question à Hermann, sans état VNext.

## P-3 — Baseline gelée (conservation des acquis)

> « Un composant, écran, comportement ou choix technique déjà validé explicitement, ou constituant la dernière version de référence acceptée, devient une **BASELINE GELÉE**. »
> — `.github/AI_ORCHESTRATION.md` § « Conservation des acquis / Change Control »

Application documentaire : une décision validée n’est remplacée que par une décision explicite ultérieure qui la nomme ; jamais par simple antériorité.

## P-4 — Priorité aux primitives natives de l’OS

> « Lorsqu’une primitive native iOS ou Android existe pour l’interaction demandée, Claude doit **systématiquement la privilégier**. »
> — `.github/AI_ORCHESTRATION.md` § « Priorité aux primitives natives de l’OS »

(Contrainte technique produit ; aucun code n’est écrit dans ce chantier.)

## P-5 — Socle technique

> « Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. »
> — `docs/AGENTS.md`

## P-6 — Documentation ≠ preuve de réalisation

> « La documentation décrit la conception attendue ; elle ne constitue pas une preuve de réalisation ni de qualification sur appareil. »
> — `docs/INDEX.md`

> « Une suite Jest verte ne permet jamais, à elle seule, de remplacer une preuve visuelle ou tactile sur appareil réel. »
> — `.github/AI_ORCHESTRATION.md` § « Conservation des acquis »

## P-7 — Livrable écrit de chaque mission (adapté)

L’original (`CLAUDE.md` § « Livraison documentaire obligatoire de chaque mission ») impose un rapport Markdown versionné dans `.github/orchestration/reports/`. Ce répertoire appartient à l’orchestration VNext. Dans ce clone, **le contenu minimal exigé est conservé**, mais le rapport est enregistré dans le change OpenSpec concerné (`openspec/changes/<change>/bilan-*.md`), committé localement. Cet aménagement est documenté et réversible.
