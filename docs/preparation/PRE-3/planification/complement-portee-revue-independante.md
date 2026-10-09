# PRE-3 — complément indépendant de portée, même opération #340

## État vérifié

Correctif [#347](https://github.com/MyUncried/Application-Routine/pull/347), candidat exact `bdfde87b9f034021dc30c6412071e895283d716c`. Six fichiers publiés identiques aux octets testés localement. **482/482 tests VNext PASS**, zéro échec/ignoré ; quatre tests nouveaux de portée, admission Git et transport/récupération. Aucun appel Claude réel pendant ces tests.

[Qualification VNext Linux/Windows 37938431543](https://github.com/MyUncried/Application-Routine/actions/runs/37938431543) : Linux PASS, Windows en cours au dernier contrôle. [Suite pilote 37938431465](https://github.com/MyUncried/Application-Routine/actions/runs/37938431465) en cours. Audit automatique V2 37938431494 SKIPPED. Pas de nouveau dispatch, audit global ni certification générale. La fusion du correctif reste conditionnée aux contrôles du candidat exact.

## Préparation réelle terminée

Le reçu initial a été relu et vérifié par `Chain.verifyReceipt`. La proposition a été construite depuis les contrats exacts, sans les modifier :

- produit initial : `603de045f94fec3f14aa2198edaaad0b91020b79adddb19041b06314cc725e16` ;
- reçu initial : `56568e7ae81d44c60cb5185d0b69f3099fb64650953804dbf322e478d3845ce9` ;
- proposition : `f11d5172f9cfbca39bb162163da8d8c50ed2857d974f7bb31eb7d6c844edbb19` ;
- 13 demandes liées aux constats bloquants, 18476 couples constat/cible proposés, 10859 cibles uniques. Ce sont des objets du périmètre PRE-3, pas de nouveaux écrans ou exigences produit.

**Une proposition n'est pas une autorisation.** Le reviewer sélectionne et justifie les seules dépendances nécessaires. Aucun des 13 constats n'est fermé par cette préparation. La clarification numérique A reste résolue et ne vaut pas approbation du plan.

Le paquet complet est publié dans `complement-portee-proposition-publiee.json` (gzip/base64, longueur et SHA-256 des octets décompressés, hash canonique) ; restitution intégrale et hash contrôlés localement PASS. `complement-portee-preparation-resultat.json` donne les compteurs exacts. Les fichiers sources de préparation et le lanceur sont publiés sur la branche PRE-3 existante.

## Procédure sur le poste — seulement après qualification et fusion de #347

Le lanceur contrôle lui-même cette condition et les quatre fichiers de protocole exacts. Il refuse un dossier de complément déjà existant, ne reconstruit pas INITIAL et ne modifie pas le checkout d'examen initial.

Dans PowerShell :
```powershell
git -C C:\Temp\PRE3-revue-lanceur fetch origin plan/pre3-vnext-20261008
git -C C:\Temp\PRE3-revue-lanceur switch --detach aefef2aa9b53350bbc76a896612c399dcfd13cb7
Set-Location C:\Temp\PRE3-revue-lanceur
node docs/preparation/PRE-3/planification/lancer-complement-portee-poste.cjs
```

Prérequis : dépôt Git existant et producteur initial disponible, Node 24+, Claude installé et authentifié, fichiers `%TEMP%\p3-1d424791\evidence-lf\produced.json` et `review-receipt.json` (ou reçu lisible complet), poste éveillé pendant l'appel. Git 2.55, Claude 2.1.263 et authentification ont été observés lors de la revue initiale ; leur état courant est recontrôlé par le lanceur, pas présumé. Pas de test SQLite/calcul ou d'action iPhone demandé.

Preuves du complément : `%TEMP%\p3-1d424791\scope-reentry-bdfde87b\evidence`.
Pendant la préparation : `scope-preparation-progress.json`. Après validation canonique et démarrage effectif du processus Claude : `claude-scope\scope-review-progress.json`. Ce dernier n'existe pas avant le démarrage du modèle ; la validation du paquet peut durer plusieurs minutes.
Résultat : `scope-review-receipt.json`. Réponse brute durable : `claude-scope\scope-review-response.json`.

Si le processus est terminé avec une réponse durable mais sans reçu, utiliser `node docs/preparation/PRE-3/planification/lancer-complement-portee-poste.cjs --recover`. Cette commande ne relance pas Claude. Sans réponse durable, conserver tous les fichiers ; ne pas retenter automatiquement.

Retourner le reçu complet du complément pour vérification et publication Git. Il permettra de reconstruire l'AllowedChangeSet lié au rapport original, puis d'appliquer les corrections autorisées au plan. Les changements sources et leurs nouvelles références devront encore passer la reconstruction et les contrôles de préservation. Le complément ne préjuge pas de leur réussite.

## Responsabilités et jalon

Actuellement : qualification distante du correctif, préparation PRE-3 terminée, aucun complément Claude lancé. GitHub Actions est l'acteur actif. Après qualification/fusion, le seul transport Claude disponible reste le poste authentifié de Hermann ; Claude est le reviewer indépendant. ChatGPT reprend ensuite la correction des artefacts, leur revue et la préparation de validation du plan exact. Développement uniquement après cette validation. Aucun mécanisme de surveillance d'arrière-plan revendiqué.
