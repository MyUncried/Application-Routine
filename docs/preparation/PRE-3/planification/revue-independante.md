# PRE-3 — lancement de la revue indépendante après correction de volume

Opération unique : [#340](https://github.com/MyUncried/Application-Routine/issues/340). Reprise autorisée le 09/10/2026 par Hermann. Aucun développement ni approbation anticipée.

## Référence exacte

La revue porte sur les objets reconstruits par le protocole corrigé au commit **1d42479181586d926a9970867a41d35d44cc4661**, fusion de #341 dans la branche existante `plan/pre3-vnext-20261008`. #342 a intégré le correctif dans main ; son registre final est au commit `9c6ff9fa3fdae72cdc44e7dca49b753746394d2e`.

La baseline applicative reste `1ddfb6d144552f578388257adc78db47ab5992c8` : le correctif main n'a changé aucun fichier src/app/package/lock. La source figée reste `3019c5f8c4a38efb83865635e0a8d67d48a5b5ab`, avec P3-01..23, D-334/D-335, 41 frames et 95 états. Les contrôles ciblés de fraîcheur du 08/10 sont réutilisés ; ce redémarrage ne prétend pas à une nouvelle lecture live de Figma. Recontrôler les évolutions pertinentes avant de figer la référence de livraison.

Les constructeurs sont rejoués, pas modifiés. Le nouveau conteneur porte l'empreinte **603de045f94fec3f14aa2198edaaad0b91020b79adddb19041b06314cc725e16** et mesure 844623228 octets logiques. PlanContract/UI/registre conservent leurs empreintes publiées ; le changement d'empreinte du conteneur lie notamment la nouvelle révision du producteur et ses consommateurs. Voir [preuve de reprise](preuve-reprise-plan.json). La construction et la navigation ne prouvent aucune revue sémantique.

## Ce qui est préparé

- Launch Git réel et reconstruction complète : conteneur scellé, huit objets de planification, recette et traçabilité canonique.
- 6384 requirements, 243974 assertions, 23 exigences de périmètre. Aucun montant de calcul applicatif ni migration future déclaré testé.
- Extraction et cohérence locales : 41/41 captures, 6725 éléments, 95 états, 59 assertions de recette ; oracle de préparation 13 cas et 276 fixtures cohérents.
- [Plan lisible](plancontract-publie.md), [objets canoniques publiés](contrats/manifest.json), [schéma/writers](schema-et-ecritures.md), [attendus](assertions-recette.json).
- [Lanceur local](lancer-revue-poste.cjs) : contrôle Node 24+, Git et le binaire exact résolu par VNext, vérifie `claude auth status`, crée un checkout détaché de la révision fixée, reconstruit hors checkout puis refuse toute divergence des empreintes avant `vnext-chain.js review`.

Le lanceur ne démarre ni développement, demande d'approbation, file d'implémentation, audit global ou qualification jetable. Une répétition refuse le dossier d'opération déjà présent. Aucun `--dangerously-skip-permissions` ni adaptateur de test.

## Action unique sur le poste de Hermann

Après récupération de cette publication dans un checkout propre (la procédure exacte avec le SHA de publication figure dans #340), exécuter depuis ce checkout :

```powershell
node docs/preparation/PRE-3/planification/lancer-revue-poste.cjs
```

Le checkout utilisé pour la revue sera un second worktree détaché, à `1d424791`, afin de conserver exactement le producteur qualifié. Le checkout courant et ses fichiers applicatifs ne sont pas modifiés. Le dossier de l'opération est `%TEMP%\p3-1d424791`, avec `checkout`, `evidence`, `operation.json` et `review-config.json`. Les chemins absolus et fichiers de configuration sont créés par le lanceur, sans paramètre fictif. Sortie attendue : `evidence\review-receipt.json` ; conserver aussi `evidence\claude-review`.

L'authentification/installations du poste ne sont pas vérifiables depuis ChatGPT : elles sont contrôlées avant la construction. Le binaire Windows imposé par le helper courant est `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe`. Si absent ou non authentifié, le lanceur s'arrête avant de créer l'opération ; transmettre seulement l'erreur, jamais un secret. La commande `auth status` et ses codes de sortie sont vérifiés dans [la documentation officielle Claude Code](https://code.claude.com/docs/en/cli-reference), consultée le 09/10.

Prévoir la mémoire pour un tas Node plafonné à 7 GiB et ses allocations supplémentaires, l'espace des objets complets et de leurs vues lisibles, garder le poste éveillé et le terminal ouvert. Ces volumes sont des ressources techniques de revue, pas des plafonds fonctionnels KODJO. Aucune disponibilité actuelle du poste n'est présumée. Ne pas installer les dépendances applicatives pour cette seule revue : les constructeurs utilisent les modules Node du dépôt.

## Suivi et interruption

Il ne s'agit pas d'un run GitHub Actions : la revue s'exécute sur le poste authentifié. Le terminal affiche son dossier exact. Dans une seconde fenêtre PowerShell :

```powershell
Get-Content (Join-Path $env:TEMP 'p3-1d424791\evidence\claude-review\initial-review-progress.json')
Get-Content (Join-Path $env:TEMP 'p3-1d424791\evidence\claude-review\initial-review-process.json')
```

Ces fichiers n'apparaissent qu'après construction et préparation du dossier. Les étapes précédentes sont visibles dans le terminal et `evidence\construction-progress.json`. Le budget canonique Claude est deux heures. Aucune surveillance ChatGPT en arrière-plan n'est annoncée.

Si une réponse durable existe mais pas le reçu, attendre la fin du processus puis exécuter depuis le checkout du lanceur :

```powershell
node docs/preparation/PRE-3/planification/lancer-revue-poste.cjs --recover
```

Cette commande utilise `recover-review`, sans nouvel appel modèle. Elle refuse l'absence de `initial-review-response.json` ou un reçu déjà présent. Ne pas supprimer les preuves ni relancer le lancement initial. Une construction interrompue ou une revue sans réponse durable nécessite diagnostic à partir du dossier conservé, pas un retry automatique.

## Prochain jalon

Transmettre le reçu et les preuves du processus pour validation et publication dans #340. ChatGPT traite les constats selon le cycle causal VNext puis prépare l'approbation exacte du plan. Hermann valide seulement le plan final revu. Les 304638 cibles restent dans la revue ; capacité de consultation complète non démontrée avant cet appel réel. Aucun verdict, omission acceptée ou conformité ne découle d'une empreinte.

## Historique du blocage remplacé

[preuve-blocage-produced.json](preuve-blocage-produced.json) conserve la borne de 726368365 unités UTF-16 pour trois champs et la limite V8 de 536870888. Le scellement par flux et les file-bundles intégrés par #341/#342 corrigent cette matérialisation. Le blocage de chaîne n'est plus un motif d'arrêt ; la disponibilité du reviewer authentifié et le résultat réel de sa revue restent distincts.
