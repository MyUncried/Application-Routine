# PRE-3 — Rapport de préparation du périmètre et des médias

Date : 08/10/2026. Mission : PRE3_SCOPE_PREPARATION.
Objectif : publier le périmètre validé, intégrer l’import de médias au MVP et préparer les entrées du plan technique.
Branche : docs/pre3-perimetre-medias-20261008.
Commit de départ : 3b325bf1f47b9ac427da2378a604e44fd66af9e5.

## Autorisation et portée

Hermann a validé le périmètre PRE-3, puis l’inclusion de l’import de médias dans le MVP avant le moteur d’exécution. Il a demandé de poursuivre après avoir demandé la PR. Cette publication documentaire ne lance pas l’implémentation.

## Réalisé

- Périmètre détaillé, 23 exigences P3, frontières PRE-4/PRE-5/EXE et réserves antérieures explicitement affectées.
- Inventaire de41frames/états Figma concernés, noms humains et liens.
- Consultation directe de la page Prototype MVP et du contexte/captures de trois frames : Séries variables Durée scénario A, Répétitions avec cadence, Zones corporelles.
- Lecture ciblée de12fichiers applicatifs du modèle, éditeur, calculs, services et persistance des médias.
- Décision D-327 enregistrée ; CE-T03-04, conception fonctionnelle et modèle Média amendés quant au périmètre MVP.
- Analyse des écarts techniques existant/cible et état de reprise durable.

## Constats

Les nouveaux paramètres ne sont pas représentés par les scalaires actuels. Le calculateur ne couvre pas la collection variable, l’ordre par paire et l’estimation par bip. L’import est désactivé dans l’éditeur. Le modèle et les tables médias existent déjà mais n’ont que les métadonnées minimales ; les projections d’édition/copie doivent conserver les associations.

Le prochain plan doit prévoir l’extraction atomique Figma exhaustive et le graphe d’impact avant de présenter des fichiers d’écriture autorisés. La présente PR ne se déclare pas un plan technique prêt pour la revue.

## Contrôles effectués

- main relu : tête identique au commit de départ lors du relevé.
- PR ouvertes inspectées : aucune préparation PRE-3 observée ; #332 concerne l’intégration VNext.
- Runs in_progress inspectés : trois contrôles sur integration/vnext-cutover-20261007 ; aucun run PRE-3 observé dans cette liste.
- Remplacements documentaires contrôlés : exclusions CE-T03-04 et ancien report Média remplacés ; aucune règle de lecture/exécution supprimée.
- Aucune modification applicative : seuls sept Markdown sont proposés.
- Tests applicatifs non applicables à cette publication documentaire ; aucun Jest/TypeScript/lint exécuté ici.
- CI de la nouvelle PR : non encore connue au moment de rédaction.

## Non démontré et travaux restants

- Paquet exhaustif des propriétés Figma, révision figée et visualisation sur appareil.
- Détail de toutes les sources/formats/contraintes d’import ; aucune capacité caméra ou limite inventée.
- Audit complet des consommateurs, liste finale des fichiers et tests, migration cible.
- Qualification et activation finale de VNext : #332 ouverte au relevé ; son titre ne vaut pas vérification de certification par cette mission.
- Exécution de tests sur la future implémentation.

## Fichiers proposés

1. docs/preparation/PRE-3/perimetre-et-couverture.md
2. docs/preparation/PRE-3/analyse-existant.md
3. docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md
4. docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md
5. docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md
6. docs/Specifications-fonctionnelles/13 – Contrats d’écran.md
7. .github/orchestration/reports/2026-10-08_PRE3_SCOPE_PREPARATION.md

## État de reprise

state: SPEC_PREPARED
next_actor: ChatGPT/orchestrateur
resume_from: docs/preparation/PRE-3/perimetre-et-couverture.md
next_task: compléter l’extraction atomique Figma et l’analyse d’impact, puis établir le plan canonique
implementation_authorized: false

Le commit qui porte le présent rapport est communiqué avec la PR après écriture. Aucun bootstrap, aucune activation de tranche, aucune requête de file, aucun appel reviewer ou développement n’est créé. Aucun checkout du PC utilisateur n’a été manipulé ; son état local n’est pas vérifiable depuis cette session.
