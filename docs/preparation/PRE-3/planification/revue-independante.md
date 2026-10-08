# PRE-3 — Revue indépendante VNext : blocage avant lancement

Statut : BLOCKED_BEFORE_REVIEW. Claude n'a pas été invoqué. Le propriétaire n'a aucun lancement de revue valide à effectuer actuellement. Aucun plan n'est approuvé.

## Preuve et responsabilité

Le PlanContract, le registre, le graphe et le contrat UI ont été réellement construits. [preuve-blocage-produced.json](preuve-blocage-produced.json) mesure les objets réels : les trois champs obligatoires `figma_launch`, `requirementRegistry` et `uiAtomicityContract` représentent au minimum **726 368 365 unités UTF-16**, hors autres champs. Node v24.19.0 limite une chaîne à **536 870 888 unités**. Le dépassement minimal est **189 497 477**. Le script `verifier-borne-produced.py <dossier JSON restitués> <launch.json réel>` reproduit ce calcul en lecture streaming ; sa seconde exécution sur les objets restitués a confirmé les mêmes nombres.

`vnext-live-chain.js` assemble ces objets dans `produceInternal`. `vnext-contract.js` scelle par `canonicalHash` → `canonicalStringify` → `JSON.stringify(canonicalize(value))`. Cette chaîne logique complète ne tient pas dans une chaîne V8. Le transport gzip/base64 ne change pas ce calcul. Augmenter le heap, le délai ou lancer Claude sur le poste ne résout pas cette limite.

La preuve est une borne exacte de sérialisation calculée sur les objets effectivement construits ; elle ne prétend pas être une réponse de Claude ni un échec du modèle. La fondation de ce calcul est présente depuis le commit `558f59648394f5cb3b1ec5f414ef11111bd3216e` ; les anciennes qualifications sur des paquets plus petits ne prouvent pas la capacité à traiter PRE-3 complet.

La correction relève de l'agent responsable du producteur VNext, avant toute action du propriétaire : fournir un scellement canonique et un transport/une lecture du conteneur entier sans matérialiser une chaîne supérieure à la limite, conserver tous les champs et toutes les preuves, puis vérifier les consommateurs de revue et d'admission. Aucun correctif de ce type ni nouvelle campagne de certification n'est livré ici. Réduire les états, propriétés ou exigences n'est pas une solution admissible.

## Point d'entrée canonique vérifié dans le dépôt

Le CLI courant accepte exactement :

```text
node scripts/kodjo/vnext-chain.js review <config.json> <receipt.json>
```

La configuration doit contenir `produced_file` (chemin absolu d'un conteneur VNext complet scellé) et `evidence_directory` (chemin absolu hors checkout). **Le premier fichier manque : il ne peut pas être produit dans ce format pour ce périmètre. Cette syntaxe de référence n'est donc pas une commande de revue à exécuter.** Passer le PlanContract seul, la recette ou le manifeste de stockage à sa place contournerait le protocole et serait rejeté.

Après résolution réelle du blocage, préparer un checkout isolé au commit publié, un `produced_file` scellé dont les références correspondent exactement à ce checkout, et la configuration absolue avant de fournir la commande finale sans paramètres fictifs. Le CLI vérifie les sources et la stabilité du checkout et produit les preuves de progression/réponse ainsi qu'un reçu durable. Le délai Claude configuré est de deux heures ; une interruption doit être reprise par le mécanisme VNext prévu, sans doublon.

## Prérequis vérifiés et limites de vérification

| Prérequis | État actuel |
|---|---|
| Main VNext actif et baseline application | Vérifiés : `1ddfb6d144552f578388257adc78db47ab5992c8` ; aucune nouvelle campagne |
| Suivi PRE-3 | #340 réutilisé ; aucune autre opération créée |
| Source Figma et documentaire | Lecture Git réelle à `3019c5f8c4a38efb83865635e0a8d67d48a5b5ab` PASS ; 41 écrans / 95 états |
| Plan, registre, graphe, contrat UI | Constructeurs courants PASS ; revue sémantique non faite |
| Conteneur `produced_file` complet scellé | Bloqué par la borne de sérialisation ci-dessus |
| Claude dans cet environnement | Indisponible ; aucune substitution à la revue indépendante |
| Claude sur le poste propriétaire | Installation/authentification actuelles non vérifiables à distance |
| Résolution Windows dans le code | `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe` |
| Vérifications locales sans appel au modèle, lorsque le paquet sera prêt | `node --version`, `git --version`, chemin Claude résolu par le helper ; `claude --version`, `claude auth status` (sortie JSON par défaut, code 0 si authentifié) |
| Accès GitHub pour la revue de ce manifeste | Sources FIGMA/MARKDOWN figées ; ne pas imposer un jeton GitHub sans besoin démontré |
| Permissions du reviewer | Read/Glob/Grep ; pas d'édition, Bash ou MCP ; vérification avant/après du checkout |

Documentation CLI d'authentification : https://code.claude.com/docs/en/cli-reference. Ne pas affirmer que les prérequis du poste sont validés avant leurs résultats locaux. Aucune action iPhone, test de base de données ou de calcul n'est demandée au propriétaire pour ce jalon.
