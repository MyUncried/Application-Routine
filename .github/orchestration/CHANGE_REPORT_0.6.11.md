# Rapport de changement — KODJO V2 `0.6.10` → `0.6.11`

## Objet

Rendre opérationnel l’adaptateur Claude local et supprimer le cycle humain répétitif « copier les erreurs, les transmettre, corriger les tests, relancer ».

## Parcours livré

1. une requête structurée fixe le HEAD, la tranche, le périmètre, les contrôles et le budget ;
2. le superviseur refuse un dépôt sale, un HEAD divergent, une version Claude différente ou une authentification absente ;
3. une exclusion locale empêche deux exécutions Claude simultanées ;
4. Claude Code `2.1.263` est lancé une seule fois, en mode non interactif et restreint ;
5. Claude exécute les tests autorisés via un runner externe figé, lit leurs erreurs, corrige la cause et les relance dans cette invocation ;
6. après Claude, le superviseur vérifie les références Git, le périmètre et rejoue les contrôles déterministes ;
7. aucun commit, push, branche, GitHub MCP ou accès réseau n’est accordé à Claude ;
8. le runner retire le jeton Claude avant chaque sous-processus de test et un résultat structuré est conservé sous le profil Windows, sans inclure le jeton.

## Authentification durable

Le jeton produit par la commande officielle `claude setup-token` est saisi une fois dans `setup-kodjo-claude-auth.ps1`. Il est chiffré par Windows DPAPI, lié au compte Windows courant, injecté seulement dans l’environnement du processus Claude puis supprimé de l’environnement du lanceur. Il n’est ni commité, ni écrit en clair dans le dépôt, ni placé dans une variable utilisateur permanente.

## Bornes effectives

| Contrôle | Valeur |
|---|---:|
| Invocations Claude | 1 |
| Tours maximum | 12 |
| Durée maximum | 3 600 s |
| Prompt maximum | 32 768 octets |
| Rollovers implicites | 0 |
| Version Claude Code | `2.1.263` |

## Qualification

Le paquet doit réussir tous les tests du pilote, la validation des trois workflows, le scanner d’écriture distante et les tests statiques du lanceur local. L’activation fonctionnelle reste subordonnée à un unique essai réel dans `/Dev`, sur une petite modification identifiée, avec validation utilisateur finale et Commit/Sync habituel.
