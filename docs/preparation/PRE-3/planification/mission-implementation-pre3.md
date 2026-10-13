# PRE-3 — Mission d'implémentation préparée après validation propriétaire

Opération unique #340. **MISSION PRÉPARÉE — ROUTE D'EXÉCUTION À DÉCIDER**. Ce document ne constitue pas une admission VNext et n'autorise pas à ignorer ses gates.

## Identité et preuves à conserver

- Hermann a validé le plan et les dispositions R-1/R-2 le 09/10/2026 à 19:14:18 Europe/Paris, réponse « oui ».
- [Décision publiée](decision-validation-proprietaire.json), commit ab9aa0986889f080266ddb1846628e1eb51b7d07.
- Plan exact 43e7b344937a2d60b04b987f19636faebb5aee06 et annexes de passe2/ ; manifeste SHA-256 16c155548ba161778f8780e664c65561b7c0d7e27666ca34481ec33a75cc08ff.
- Revue indépendante APPROVE d5d016674e09042bc49410100eec6f6c02197d8f ; 13 constats initiaux et deux régressions résolus au cumul des revues 2 et 3.
- Main observé 46b91bd279424899a02c099a68b2729f6d710809 ; baseline applicative analysée 1ddfb6d144552f578388257adc78db47ab5992c8. Diff de ces révisions vide sur src/, app/, package.json, package-lock.json et docs/Specifications-fonctionnelles/. Dans docs/preparation/PRE-3/, seul le script de fraîcheur Figma a changé ; ce delta ne livre aucun produit PRE-3.
- Aucune PR produit PRE-3 ou run actif observé ; ne pas créer d'opération parallèle.

## Blocage démontré du raccordement actuel

Le garde initial utilisé par vnext-live-chain.verifyReceipt, exécuté depuis main 46b91bd2 sur le rapport publié de revue 3, refuse :
`VNEXT_REVIEW_RECEIPT_HASH_INVALID: contract_hash must be lowercase SHA-256`.

Le rapport est `kodjo.pre3.third-targeted-review-report.v1`, pas `kodjo.vnext.live-review-receipt.v1`. Ajouter un hash ne résoudrait pas les liaisons produced/reviewer_packet/raw_result/session requises par la suite du validateur. Le dernier rapport canonique du dossier initial reste CLARIFICATION_REQUIRED ; il n'a pas été réécrit.

Ce contrôle est un sondage du premier garde, pas une tentative complète prepare/handoff/admit. Aucun faux reçu, faux verdict, plage de lecture ou décision GitHub n'a été créé.

Le relais ajouté par #348 reste limité à VNEXT-PRE-4 ; agent-relay.js refuse explicitement issue_number 340 et son moteur exige #340 fermée. Il ne démarre pas le développement PRE-3. Aucun correctif du protocole n'est autorisé par cette mission.

## Deux routes concrètes à décider

A. **Exception d'exécution directe limitée à PRE-3**, dans Claude Code, avec le plan validé, sa traçabilité, toutes les preuves produit, les revues indépendantes, la recette et le livrable installable. L'exception porterait explicitement sur le raccordement/admission automatique et les reçus canoniques indisponibles ; aucun changement du code VNext. Toute livraison et tout registre doivent nommer cette exception et distinguer ces preuves des reçus canoniques. Cette route n'est pas encore autorisée : la précédente exception ne portait que sur la révision du plan.

B. **Raccordement canonique existant avant exécution** : matérialiser le plan corrigé dans les objets supportés par les constructeurs VNext, conserver les sources/preuves sans nouvelle extraction globale, et obtenir le reçu indépendant lié à ces objets avant prepare/request-approval/handoff/admit. Ce sont des travaux sur le dossier de plan et ses preuves, sans correctif du protocole ; ils peuvent imposer un nouvel appel canonique et une validation liée au nouveau paquet exact. Ne pas présenter le rapport actuel comme ce reçu.

## Mission produit prête pour la route retenue

Après autorisation de route et revalidation de contexte :

1. Vérifier main et l'absence d'écrivain/run PRE-3 concurrent. Créer un worktree d'implémentation isolé et une branche produit à partir de main exact ; conserver les modifications récentes du protocole. Récupérer les documents du plan par leur commit exact, sans réaligner le dépôt principal ni remplacer les sources applicatives. Respecter LF à la matérialisation des fichiers manifestés et vérifier le dossier.
2. Lire intégralement le plan approuvé, la matrice P3-01..23 et les spécifications normatives référencées ; observer les blobs réels. Lire docs/AGENTS.md et la documentation Expo SDK 57 versionnée avant code. Réutiliser les preuves Figma gelées et les compléments ciblés, sans nouvelle extraction globale.
3. Livrer **les 23 exigences ensemble**, avec modifications minimales des consommateurs partagés : schéma canonique/compatibilité/migration 009 ; domaines/brouillons/calculs/phrases ; transactions et associations ordonnées ; médias physiques conservés ; quatre adaptateurs Catalogue/Séance ; éditeur, feuille, sélecteurs, rendu et accessibilité. Exécution sonore/chronomètre/moteur, refontes PRE-4/PRE-5 et surfaces exclues restent hors mission.
4. Garder les 59 assertions et leurs propriétaires exacts, huit scénarios migration SQLite réelle, 13 cas numériques indépendants, 276 phrases/segments/gras et montants indépendants. Pas de preuve SQL par mock UI. Vérifier bascule/restauration/N=1, conservation des anciennes données et de l'historique, rollback/erreurs/copies/médias réels. Les scripts documentaires PASS ne prouvent pas l'application.
5. Appliquer R-1/R-2 conformément au dossier validé : obligations du composant natif DurationWheelPicker dans sa suite existante ADAPT ; nouvelle suite stepper .ts limitée aux gestes PRE-3 optionnels ; suite .tsx du Profil RUN_EXISTING conservée, aucune duplication/suppression de contrats D-227. Toute impossibilité de cette séparation doit être documentée avant modification de portée.
6. Produire la traçabilité réelle par exigence : fichier modifié, assertion, commande, résultat, preuve Git. Vérifier les consommateurs et régressions PRE-1/PRE-2. Effectuer une seconde passe indépendante. Les écarts causés par les changements reviennent à correction ; ne pas relancer un audit global.
7. Comparer toutes les surfaces/états pertinents aux références Figma et aux relations 360/402/440, texte agrandi, phrase longue, clavier et Safe Areas. Conserver captures/mesures et écarts nommés. Séparer cette preuve des tests automatisés et des contrôles appareil natif/VoiceOver.
8. Publier le code, les faits de test et le rapport de mission obligatoire .github/orchestration/reports/ sur la branche produit, sans force ni écrasement distant. Ne pas fusionner, clôturer ou déclarer une conformité sans revue et preuves. La revue d'implémentation, recette propriétaire ciblée et livraison installable seront engagées ensuite par le pilote.
9. Ne transférer à Hermann aucun test technique SQLite/calcul. Une action iPhone/runner indispensable doit avoir une procédure précise et identifier uniquement la capacité système/perceptive vérifiée.
10. Le livrable final doit identifier PR/commits fusionnés, 23 exigences couvertes, résultats de revues/tests, réserves acceptées et effets, registre final et build installable/version/lien. Identifier honnêtement la route retenue ; aucun APPROVE inventé, aucune attestation native déduite d'un mock.

Aucun développement exécuté lors de la préparation de cette mission. Prochain jalon : décision de route, puis engagement effectif d'un seul écrivain.
