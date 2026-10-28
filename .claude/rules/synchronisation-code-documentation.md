# KODJO — Synchronisation code / documentation (règle permanente)

> Décision de Hermann du 28/10/2026 (« Synchronisation permanente Code / Documentation »). S'applique à tout travail de code sur KODJO dans Claude Code : stories BMAD, corrections demandées directement (recette, conversation), corrections hors story, changements produits par des sous-agents. Chargée par `CLAUDE.md` (import) ; dans un clone où BMAD est installé localement, aussi par les surcharges locales, non versionnées, `_bmad/custom/bmad-build.toml` et `bmad-code-review.toml`.

## Quand

Avant de déclarer terminée **toute** livraison qui modifie, ou peut modifier, un comportement observable (écran, geste, message, calcul, donnée persistée, contrat), y compris une correction faite pendant une recette. Pour un changement fait par un sous-agent, le contrôle a lieu dans la session principale, au moment d'intégrer ce changement.

## Comment

1. Partir du **diff réel** de la livraison (pas de relecture générale de la documentation).
2. Pour chaque comportement touché, retrouver la règle applicable : spécifications (`docs/Specifications-fonctionnelles/`, `docs/DSF-*.md`, `docs/PRODUCT.md`, `docs/INDEX.md`), registre des décisions (chapitre 07), décisions de Hermann citables (conversation, artefacts BMAD) ; une décision prise en conversation est recopiée textuellement dans la spec BMAD du lot ou dans le registre (chapitre 07).
3. Classer, puis traiter **dans la même livraison** :
   - **A — Conformité** : le code rejoint une règle déjà écrite. Aucune décision ni modification de spécification ; citer la règle dans le suivi habituel (spec BMAD du lot ou message de commit) ; tests ajustés.
   - **B — Évolution validée** : une demande **explicite et vérifiable** de Hermann change, ajoute ou précise une règle. Mettre à jour la source normative, propager aux documents réellement dépendants (fonctionnel, technique, contrats d'écran, registre), marquer les formulations contraires comme remplacées (texte d'origine conservé, annotation datée entre crochets). Distinguer règle fonctionnelle et choix technique. Cette décision explicite vaut validation du lot documentaire : aucune approbation supplémentaire.
   - **C — Non arbitré** : le comportement n'est ni documenté ni décidé. Chercher décisions et spécifications ; anomalie, évolution validée ou interprétation technique ? Ne **jamais** promouvoir le code en règle. Si une décision est nécessaire : À CLARIFIER dans la spec BMAD du lot, et ne bloquer que l'opération qui en dépend.
   - **D — Technique** : sans effet sur l'utilisateur, les règles métier ou les contrats. Rien à documenter, sauf choix d'architecture ou contrainte importante (chapitre 12).
4. Rechercher les anciennes formulations contradictoires (recherche ciblée des termes de la règle) dans les documents dépendants.
5. Consigner le résultat (classe et documents touchés) dans l'artefact déjà utilisé : spec BMAD du lot, section existante, ou à défaut le message de commit. Pas de nouveau rapport par correction.

## Cas particulier : source normative absente de la branche

Si la documentation applicable n'existe que sur une autre branche non fusionnée (par exemple la documentation des familles du 28/10 sur `main` pendant PRE-8) : ne pas fusionner. Préparer la correction sous forme de patch ou dans le plan d'intégration existant (`_bmad-output/<tranche>/integration-documentaire-main.md`), vérifier qu'il s'applique (`git apply --check` sur un index temporaire), et le signaler comme **préparé, non appliqué**.

## Limites

- Une correction de code ne crée pas une règle. Un comportement implémenté n'est pas une décision validée.
- Figma définit le rendu ; une différence visuelle ne crée pas de règle métier.
- Une suite de tests verte ne prouve pas une validation sur iPhone.
- Ne pas rouvrir des recettes ou stories closes ; ne pas reprendre globalement la rédaction.
- Conserver les noms Unicode des fichiers, la structure et les décisions remplacées.

## Déclaration de livraison

Une livraison qui touche un comportement n'est **complète** que lorsque le contrôle ci-dessus est fait. Le compte rendu indique la classe (A à D), les documents mis à jour ou « aucun (A/D) », et toute correction préparée mais non appliquée.
