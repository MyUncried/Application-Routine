# PRE-3 #340 — revue et préparation de clôture indépendante

Date : 12 octobre 2026. Pilote/reviewer : ChatGPT/Codex. Implémentation et recettes correctives : Claude Code local.

## Mission et références

Instruction : « PRE-3 est validé dans son intégralité » (Hermann,23:52:48 Paris), puis « ok, pilote la clôture de cette tranche » (23:53:45). Décision versionnée : `docs/preparation/PRE-3/planification/execution/preuves/validation-finale-proprietaire.json`.

Main exact : `46b91bd279424899a02c099a68b2729f6d710809`. Départ produit : `ae50aaedc1aaf506dccbb81c4e406e127af9824b`. Candidat distant initial : `64174128fe1e2c82fccf44fc6b17628d49185571`. Plan approuvé : `43e7b344937a2d60b04b987f19636faebb5aee06`. PR existante créée pour cette livraison : [#351](https://github.com/MyUncried/Application-Routine/pull/351). Même opération [#340](https://github.com/MyUncried/Application-Routine/issues/340).

Route directe PRE-3 documentée. Aucun reçu, admission ni clôture canonique VNext fabriqué. Les qualifications historiques restent distinctes de cette revue produit.

## Revue réalisée

Relecture des changements et de leurs frontières : brouillon et cibles par mode/identité, N=1/inversion, ledger et récupération terminale, phrases/gras, schéma/migration009 et transactions, liens médias et stockage physique, quatre adaptateurs Catalogue/Séance, sélecteurs et champs persistants N-01, gestes, variantes partagées, diagnostic de version. Relecture des rapports de recettes et autorisations X-1..X-4/EXT-R3. Main n'a pas changé sur le produit depuis le départ analysé ; aucun diff de scripts ou workflows de protocole introduit par PRE-3.

Ce rapport combine revue de source, tests réellement exécutés et acceptation propriétaire. Il ne prétend pas à une mesure indépendante de chaque pixel ni à une certification générale VoiceOver/Android.

## Constats initiaux

| Constat | Conclusion finale |
|---|---|
| REV-01, cibles d'un mauvais mode | Corrigé : identités et réserves par mode ; repro indépendant initial PASS, suites de transitions PASS |
| REV-02, total à N=1 | Corrigé : inversion sur état effectif, normalisation et première ligne ; repro indépendant PASS |
| REV-03, ordre médias après réessai | Corrigé : insertion par voisins de sélection sans annuler réordonnancement utilisateur ; repro indépendant UI PASS |
| REV-04, sept tests d'intégration | Deux suites passent dans les98 suites réellement exécutées ; aucun retrait des assertions de persistance |
| REV-05, permission Photos | Texte corrigé dans app.json ; pas de nouvelle permission caméra/micro |
| REV-06, preuve visuelle absente/écarts déclarés | Recettes successives et décisions D-336..356, puis validation globale finale explicite de Hermann, N-01 compris ; ne pas transformer cette déclaration en captures automatiques inventées |

## Dernier constat technique et correction bornée

Les1970 assertions étaient vertes sur64174128 mais le processus Jest quittait avec1. Le journal contient `ReferenceError: ... Jest environment ... torn down`, via les rappels requestAnimationFrame du preset React Native ; suites ExecutionParametersSheet et CatalogueScreen. Une répétition conservée confirme le résultat.

La source montre deux animations démarrées sans nettoyage d'effet : montée de la feuille Paramètres et indicateur de SegmentedControl. Leur rappel peut dépasser le démontage de la surface. La correction retient chaque animation, la démarre, et retourne `animation.stop()` comme nettoyage de l'effet. Elle arrête aussi l'ancienne animation avant remplacement de l'effet. Durées, valeurs cibles, easing, pilotes, données et présentation inchangés ; aucun délai ajouté, aucune assertion retirée, aucun --forceExit.

Périmètre : deux fichiers déjà concernés par PRE-3 et son extension X-1. Le contrôleur original immuable signale SegmentedControl hors portée43e7b344 ; ce refus est conservé, sans fausse déclaration PASS. X-1 est autorisée et livrée dans6fd6d40d ; le nettoyage est une adaptation causale minimale de clôture. Les déclarations historiques « non modifié » d'une autre mission ne sont pas étendues à toute la tranche.

## Tests indépendants réellement exécutés

| Contrôle | Résultat |
|---|---|
| TypeScript | PASS, sortie0 |
| ESLint src/app | PASS, sortie0 |
| Suites ciblées après nettoyage | 3/3 suites,85/85 tests, sortie0 |
| Jest complet après nettoyage | **98/98 suites,1970/1970 tests, sortie0** |
| Trois repros adversariaux initiaux inchangés | 3/3 PASS |
| Jointure des résultats Jest aux obligations | **442/442** avec un test effectivement passé au bon chemin ; zéro correspondance absente |
| Intégrité du dossier du plan | 2143 PASS, dans sa seule portée documentaire |
| Préservation | Migrations001..008 et repository d'historique inchangés ; aucun script/workflow VNext modifié |
| Espaces du delta technique final | PASS après conservation du contenu et correction des seules fins de ligne ajoutées |

Environnement : Linux, Node24.19.0, Jest29.7.0. Preuves : `preuves-controles-cloture.json` (hashes des sources et du résultat réel), `couverture-obligations-cloture.json` (442 jointures). Les anciennes sorties/échecs restent historiques ; aucune reclassification d'un test échoué comme PASS.

## Recette et livrable installable

Hermann valide toute PRE-3 le12/10, N-01 compris. Cette déclaration globale remplace les statuts « à retester » des registres historiques ; elle n'invente aucun résultat individuel absent.

Dernière publication avant ce nettoyage : OTA `01a131f9-1cf0-705c-8531-3919ff3b2aa6`, commit `29d149bdcdc998e90eeff6d66834312f90e72d72`, canal review, runtime1.1.0. Le diff29d149bd..64174128 est documentaire seulement.

Build compatible : Routine Dev **1.0.0(8)**, commit58bbc3bc, [installation](https://expo.dev/accounts/ankushas-team/projects/routine/builds/38bf5fc2-b053-4fd1-a475-48f08b7f542f). Build7 également compatible. La vérification publiée par Claude indique57/57 assets ; une nouvelle lecture du manifeste depuis cet environnement reçoit HTTP403 et n'est pas présentée comme une vérification fraîche réussie.

Le nettoyage introduit maintenant un delta JS supplémentaire : **une nouvelle publication OTA est nécessaire pour lier le livrable final au code à fusionner**. Aucun nouveau build natif ne découle de ces deux fichiers.

## État et prochain relais engagé

Revue des corrections Claude : aucun défaut produit bloquant supplémentaire identifié ; correction de nettoyage testée. Validation visuelle propriétaire complète enregistrée. **Fusion et clôture en attente de la publication du delta exact et de sa revue ciblée par Claude**, puis vérification des checks de #351.

Mission concrète publiée : `mission-publication-cloture.md`, bornée au nettoyage et à la publication OTA. Le pilote n'a pas l'authentification Expo du poste et aucun outil disponible de dispatch EAS/reprise de la session Claude. Il ne prétend pas avoir lancé cette session ni assurer une surveillance en arrière-plan.

Une seule instruction dans Claude Code est nécessaire ; aucune commande PowerShell à transférer au propriétaire. Le pilote reprendra ensuite la fusion et l'enregistrement de la clôture effective. Pas de nouvelle campagne d'audit, pas de PRE-4.

Fichiers : deux composants ; décision propriétaire ; preuves techniques et couverture ; mission de publication ; registre de finalisation ; ce rapport. Le SHA contenant ces fichiers est identifié par le commit de publication dans #351/#340 : aucune auto-référence Git impossible insérée dans le fichier.
