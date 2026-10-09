# PRE-3 — démarrage produit depuis le plan approuvé

Opération unique #340. Branche produit `feat/pre3-exercice-20261009`. Écrivain : Claude Code local. Pilote/revue indépendante : ChatGPT. Aucun développement exécuté par cette seule préparation.

## Autorité et route

Hermann a validé le plan exact 43e7b344 et R-1/R-2, puis demande le 09/10 à 20:00 Paris de lancer le développement d'un produit robuste, maintenable et conforme aux besoins, avec un minimum d'interventions. Cette mission engage le travail produit directement depuis ce plan. Elle ne prétend pas à une admission canonique VNext ; aucun correctif du protocole ou nouvelle certification n'est demandé.

**Rectification historique :** les mentions antérieures « exception propriétaire autorisée » au sujet du contournement de la planification étaient incorrectes. L'instruction de corriger/revoir le plan n'autorisait pas cette dérogation. Les fichiers gelés restent conservés comme preuves de ce qui a été fait ; leur formulation ne donne aucune autorisation supplémentaire. La présente route et ses limites sont explicites.

La valeur du contrôle vient des sources, du périmètre, des tests et des preuves produit. Aucun rapport indépendant n'est converti artificiellement en reçu VNext.

## Démarrage — un seul écrivain

1. Récupère la branche produit, avec une commande Git distincte. Fige le **SHA de départ fourni dans l'instruction**, lis `execution/contexte.json` et cette mission. S'il existe déjà une implémentation ou un écrivain sur cette branche, reprends son checkpoint, sans créer de doublon.
2. Crée un worktree isolé sur cette branche avec conversion LF désactivée. Ne touche pas au dépôt principal C:\\Dev\\Application-routine, à ses modifications locales, aux anciens worktrees ou aux réglages globaux. Conserve le protocole de main 46b91bd2 exactement tel qu'il est.
3. Vérifie `node docs/preparation/PRE-3/planification/passe2/verifier-passe2.cjs`, puis `node docs/preparation/PRE-3/planification/execution/controle-portee.cjs --start <SHA-départ-fourni>`. Le premier vérifie les entrées figées ; le second vérifie les modifications produit et documentaires avant chaque commit et publication. Ils ne prouvent ni le comportement de l'application ni la perception native.
4. Lis intégralement le plan, le périmètre P3-01..23, les sources normatives, les décisions et annexes. Les données/montants d'attente sont définis avant code. Observe le code actuel avant de le modifier. Lis docs/AGENTS.md et les docs Expo SDK 57 exactes avant code SDK.

## Implémentation complète, sans réduction

Livrer les quatre parcours créer/modifier depuis Catalogue et copie Séance ; éditeur, carte/feuille Paramètres et sélecteurs/formulaires Catégorie/Zones ; modes Durée/Répétitions/échec, état uniforme/variable explicite, cibles/Pauses/bilatéralité/cadence/CR/Fin ; brouillons/restaurations/repli/réordonnancement/N=1 immédiat ; exact/estimé/omis et contributions connues Séance ; Récupération explicite terminale et inversion ; 276 phrases/gras générées à l'affichage ; persistance, migrations, copies/instantanés ; médias locaux ordonnés conservés ; surfaces Figma et accessibilité.

Développer dans des commits cohérents : données/domaine et compatibilité ; repositories/migrations/médias ; adaptateurs et consommateurs ; surfaces/UI et accessibilité. Ce découpage n'autorise pas une livraison partielle.

Les médias suivent D-333/D-334/D-335 ; pas de plafond arbitraire, conversion systématique ni fichier référencé supprimé. ✓ applique au parent sans SQLite, Terminer conserve sa responsabilité par parcours, Continuer persiste la Séance. Phrase jamais stockée/tronquée. Nouvelle occurrence sans Récupération automatique.

Hors périmètre : moteur, chronomètre, son réel/lecture pendant exécution, refontes PRE-4/PRE-5/Profil/Étiquettes/Calendrier, sélecteur Catalogue à deux options et modifications VNext.

## Contrôles de portée et maintenabilité

- Autorité des fichiers : `passe2/tests-and-preservation.json#/write_scope` au commit 43e7b344. Le contrôle relit cet objet Git exact, pas une whitelist localement modifiable. Il détecte fichiers non prévus, qu'ils soient committés, staged, modifiés ou nouveaux non ignorés.
- Exécute le contrôle avant chaque commit, avant push et avant la livraison à revue. C'est une détection d'écart avant publication, pas un verrou qui empêche physiquement chaque écriture. La revue indépendante contrôle le diff complet, pas seulement le rapport du développeur.
- Toute adaptation technique minimale supplémentaire réellement indispensable est documentée (raison, consommateur, impact, test) et transmise au pilote avant élargissement. Aucun élargissement silencieux ; aucun protocole modifié pour satisfaire le contrôle.
- Source métier partagée, projections scalaires dérivées, frontières Domaine/SQLite/UI distinctes. Conserver noms/chemins ; éviter les suites parallèles et abstractions non nécessaires.
- R-1 : donner des obligations effectives à DurationWheelPicker.test.tsx et aux tests stepper concernés. Roulette iOS native réellement déléguée, actions Valider/Annuler distinctes, aucun commit au démontage ; propriétés simulables séparées de VoiceOver natif.
- R-2 : nouvelle ProfileStepper.test.ts réservée à la politique PRE-3 optionnelle ; suite Profil .tsx conservée et relancée, sans recopier ses contrats D-227.
- Aucun fichier de migration 001..008 modifié, aucun historique réécrit.

## Tests et preuves à produire, pas à transférer au propriétaire

- Tests unitaires métier : transitions/brouillons, normalisation, ordre des côtés, calculs exacts/estimés/omis, inversion et phrase.
- SQLite **réelle** : base neuve, upgrade v8, idempotence, rollback par instruction, FK/positions, malformed/version inconnue, projections, vieilles données hors bornes, réouverture/copies/absence de phrase stockée.
- Fichiers réels temporaires : import/erreurs/réessai, ordre et partage, conservation des fichiers référencés. Les mocks du sélecteur ne prouvent pas le stockage.
- 59 assertions avec leurs vrais propriétaires ; 13 cas numériques indépendants ; corpus 276 v15 avec texte/segments gras/montant indépendant ; huit scénarios migration.
- Tests des consommateurs partagés et régressions PRE-1/PRE-2. Sélectionner les commandes d'après le dépôt réel : Jest ciblé puis suites affectées, TypeScript/lint adaptés. Consigner commandes, nombre de tests, sorties et environnement. Corriger les erreurs avant revue ; ne déclarer aucune suite exécutée à partir de fixtures.
- Comparaisons visuelles séparées : 41 références et états pertinents, 360/402/440, texte agrandi, clavier, Safe Areas, phrase longue, bas de feuille ; écarts avec impact/justification/statut/décision. Réutiliser extraction/images/maîtres/styles/variables, aucune nouvelle extraction globale sans besoin démontré.
- Appareil : uniquement perception native/VoiceOver, permissions système, photo/vidéo réelles, maintien/scroll, redémarrage et installation. Préparer une procédure précise après les contrôles techniques ; ne déléguer aucun test DB/calcul à Hermann.

## Retour GitHub et arrêt avant fusion

Travaille jusqu'à une implémentation complète testée et publiée sur la branche produit. Ne demande pas une validation après chaque petit commit. Les questions au propriétaire restent limitées à une ambiguïté fonctionnelle réellement nouvelle, une action appareil/runner indispensable ou un blocage concret qui ne peut pas être résolu dans le périmètre.

Publie les preuves sous `docs/preparation/PRE-3/planification/execution/preuves/` et le rapport obligatoire `.github/orchestration/reports/YYYY-MM-DD_PRE3-340_IMPLEMENTATION.md` (nom respectant la convention). Le rapport identifie baseline, plan exact, tête livrée, changements, tests/résultats, couverture P3-01..23, preuves visuelles distinctes, limites/appareil, réserves et état Git.

Publie sans force ; commandes Git distinctes. Si une permission bloque, conserve les preuves et donne le refus exact. Ne lance pas de nouvelle campagne d'audit ni de relance payante automatique. Ne déclare pas un push réussi avant vérification distante.

Une fois prêt, donne ici les liens et le commit, puis arrête avant fusion. ChatGPT effectuera une revue indépendante de l'implémentation, pilotera les corrections causales, la recette et la livraison installable. Tu ne t'auto-approuves pas et ne clôtures pas #340.

La livraison finale doit démontrer les 23 exigences, fournir les PR/commits fusionnés, résultats des tests/revues, réserves acceptées et build installable/version/lien. La route directe est nommée honnêtement ; aucune clôture VNext fictive.
