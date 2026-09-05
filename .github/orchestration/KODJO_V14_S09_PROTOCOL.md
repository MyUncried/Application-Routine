# KODJO V1.4 — Protocole opérationnel T01-S09

## Statut et référence historique

Ce document gouverne l'exécution courante de S09. Le protocole précédent fondé sur la reprise permanente de la session historique S01-S08 est archivé dans `.github/orchestration/archive/KODJO_V14_S09_PROTOCOL_LEGACY.md` et ne gouverne plus aucune exécution.

La session `99404ae0-19e3-4004-8dde-cd670588afb5` reste une archive historique consultable. Elle ne doit plus être reprise automatiquement pour PLAN, REVIEW ou développement S09.

## Décision d'architecture

La continuité opérationnelle repose sur des artefacts vérifiables et les sources de vérité actuelles, pas sur une conversation IA longue.

Répartition cible :
- ChatGPT Work : orchestration, état GitHub, constitution du paquet de contexte, gates et routage ;
- Codex/OpenAI : construction et révision du plan à partir du HEAD, de l'Issue et des sources actuelles ;
- Claude Code local : revue indépendante courte du plan, puis développement dans une nouvelle session dédiée à S09 après Gate 1 ;
- OpenAI API : revue indépendante de l'implémentation et routage `APPROVE / REVISE / CLARIFY` ;
- utilisateur : Gate 1 Plan et Gate 2 Visuel uniquement, sauf vraie décision produit indéterminable.

Claude.ai désigne le compte/authentification/quota utilisé par Claude Code ; il ne constitue pas un agent d'orchestration distinct.

## Règle de session Claude

Une tranche de développement utilise une session Claude dédiée et bornée. Pour S09 :
- la revue du plan utilise une nouvelle session courte de REVIEW, sans reprendre la session historique ;
- après Gate 1, le développement démarre dans une nouvelle session `DEV-S09` ;
- les corrections techniques et visuelles de S09 réutilisent `DEV-S09` tant que la tranche reste ouverte ;
- S10 démarrera dans une nouvelle session.

Le paquet de contexte d'une nouvelle session est construit par l'orchestrateur à partir de sources vérifiables. Il contient au minimum : tranche/objectifs, branche et HEAD exacts, Issue et décisions applicables, documents/contrats pertinents, plan approuvé lorsqu'il existe, état technique nécessaire hérité de la tranche précédente, périmètre/interdictions, critères d'acceptation et tests. Claude ne prépare pas lui-même la vérité de reprise de la session suivante.

## Sources de vérité

À chaque étape, les sources actuelles priment sur toute mémoire IA :
- Figma : rendu visuel et états représentés ;
- documentation fonctionnelle : comportements, interactions, règles métier ;
- documentation technique : contraintes et choix d'implémentation ;
- registre des décisions : arbitrages explicitement validés ;
- code/HEAD : état réel de l'implémentation.

Une ambiguïté n'est escaladée à l'utilisateur que si elle reste réellement indéterminable après contrôle de ces sources.

## Machine d'état

`PLAN_BUILDING_OPENAI` → `PLAN_CLAUDE_REVIEW` → (`PLAN_REVISE_OPENAI` → `PLAN_CLAUDE_REVIEW`)* → `PLAN_READY_FOR_USER_APPROVAL` → **GATE HUMAIN PLAN** → `DEV_SESSION_BOOTSTRAP` → `IMPLEMENTING` → `IMPLEMENTATION_OPENAI_REVIEW` → (`IMPLEMENTATION_REWORK` → `IMPLEMENTATION_OPENAI_REVIEW`)* → `VISUAL_REVIEW_REQUIRED` → **GATE HUMAIN VISUEL** → (`VISUAL_REWORK` → `IMPLEMENTATION_OPENAI_REVIEW` → `VISUAL_REVIEW_REQUIRED`)* → `S09_DONE`.

Les boucles sont bornées. Une non-convergence ou une limite d'usage arrête la chaîne en état technique explicite ; elle n'est jamais traitée comme un résultat métier.

## Phase PLAN

Codex/OpenAI construit le plan en lecture seule depuis le HEAD courant, l'Issue #17 et les sources applicables. Le plan doit être :
1. complet sur le périmètre S09 ;
2. traçable vers les sources ;
3. exempt de règles inventées ou obsolètes ;
4. techniquement exécutable ;
5. testable avec critères de validation explicites.

Le plan candidat est soumis à une revue Claude indépendante dans une nouvelle session courte. Claude reçoit le plan et un paquet de preuves borné ; il ne reprend pas la session historique S01-S08.

Résultats :
- `APPROVE` : Gate 1 ;
- `REVISE` : correction côté OpenAI/Codex puis nouvelle revue, dans une boucle bornée ;
- `CLARIFY` : uniquement décision produit/UX réellement absente des sources, avec points bloquants précis.

Aucune écriture métier ni développement avant Gate 1.

## Gate humain 1 — Plan

Instruction attendue :
- `APPROUVER PLAN S09` ; ou
- `CORRIGER PLAN S09 : <écart/décision>`.

## Bootstrap DEV-S09

Après Gate 1, l'orchestrateur crée une nouvelle session Claude Code locale dédiée à S09. Elle reçoit le paquet de contexte canonique et le plan approuvé. Aucun `--resume` de la session historique S01-S08 n'est autorisé.

Avant développement : runner/repository/branche/HEAD, worktree, OAuth Claude, disponibilité de quota et paquet de contexte sont contrôlés.

## Développement et revue

Claude Code développe S09 dans `DEV-S09`. Les corrections de S09 restent dans cette même session pour préserver la continuité technique utile à l'intérieur de la tranche.

OpenAI API effectue la revue indépendante contre : plan approuvé, HEAD/code réel, spécifications, registre des décisions, contrats d'écran, DSF, données/API/architecture et Figma lorsque pertinent.

Les écarts techniques déterminables produisent `REVISE` et repartent automatiquement vers `DEV-S09`. Une vraie décision produit indéterminable produit `CLARIFY`. La boucle est bornée.

## Gate humain 2 — Visuel

Lorsque la revue technique est conforme : `VISUAL_REVIEW_REQUIRED`.

Instruction attendue :
- `VALIDER VISUEL S09` ; ou
- `CORRIGER VISUEL S09 : <écarts observés>`.

Une correction visuelle revient dans `DEV-S09`, puis repasse par la revue OpenAI avant un nouveau Gate 2.

## Usage et garde-fous

Le protocole journalise autant que techniquement disponible : phase, session, durée, contexte, fenêtre 5 h et usage hebdomadaire avant/après les appels Claude significatifs.

Garde-fous :
- une tranche = une session Claude de développement ;
- pas de reprise automatique de la session historique ;
- sources actuelles > mémoire IA ;
- HEAD exact et worktree contrôlés ;
- aucune réponse de type `session limit`, erreur OAuth, timeout ou sortie invalide n'est routée vers REVIEW comme résultat métier ;
- boucles bornées et anti-doublon ;
- aucun développement avant Gate 1 ;
- aucun `S09_DONE` avant Gate 2 validé ;
- commit/push et rapports contrôlés pour les phases d'écriture.

## Clôture

`S09_DONE` exige : plan approuvé, implémentation publiée, contrôles techniques conformes, revue indépendante conforme, Gate 2 validé, rapport final, commit/push contrôlés et traçabilité de la tranche.
