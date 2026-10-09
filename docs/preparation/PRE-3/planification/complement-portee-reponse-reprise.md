# PRE-3 — diagnostic de la réponse du complément et reprise bornée

Opération #340 ; session Claude réelle `e61534e8-cb03-49ef-aaa7-1f19060e5d92`.
Archive originale publiée sans modification dans `evidence/complement-portee-reponse-initiale.json`.
Diagnostic exhaustif dans `complement-portee-diagnostic-reponse.json`.

## Résultat vérifié

Archive scellée valide ; empreinte de proposition identique au paquet publié ; processus sorti avec code 0, sans signal ni erreur de processus. 141 tours, 1793362 ms (~29 min 53 s). Refus canonique reproduit avec Scope.fromRaw : VNEXT_SCOPE_UNOBSERVED_DEPENDENCY.

Sept évaluations sélectionnent au moins une cible absente de leur observed_ranges : 11150 couples constat/cible. Cela ne constitue pas une preuve que toutes ces cibles n'ont jamais été lues : la réponse finale ne les atteste pas comme examinées. Six autres évaluations passent ces contrôles locaux ; ce n'est pas un reçu partiel autorisé ni une validation sémantique indépendante.

Identifiant tronqué supplémentaire : `FND-c3c952` au lieu de `FND-c3c9529d7f622ac36707b163`. Ce défaut serait également refusé après résolution du premier.

Un appel Glob hors du dossier autorisé est refusé (recherche dans le parent evidence). Aucune preuve que ce refus explique l'ensemble des lacunes.

## Correction requise dans le transport indépendant

Le validateur doit conserver les gardes actuelles. Ne pas compléter automatiquement observed_ranges, tronquer dependency_ranges ni substituer soi-même l'identifiant dans la réponse signée. Ne pas transformer --recover en nouvel appel modèle.

Ajouter un chemin explicite de correction de réponse invalide, lié au hash exact de l'archive refusée et à la même proposition :
1. Conserver réponse/session/dossier originaux et isoler les nouveaux fichiers de preuve.
2. Fournir au reviewer la réponse rejetée et le diagnostic complet. Exiger les 13 identifiants EXACTS ; borner leur schéma aux IDs de la proposition.
3. Préserver les évaluations déjà valides, sauf correction indépendante explicitement motivée. Pour les sept évaluations rejetées, lire réellement les cibles sélectionnées et leurs objets pertinents, OU limiter les dépendances aux cibles justifiées et examinées. Une inférence de groupe depuis quelques exemples ou un recensement ne suffit pas à déclarer toutes les cibles observées.
4. Exiger explicitement dependency_ranges ⊆ observed_ranges pour chaque request, avec indices locaux zéro-based, plages inclusives ordonnées et bornées ; vérifier avant réponse finale.
5. Retourner un nouveau résultat réel, archivé séparément et validé par les mêmes contrôles. Le rapport initial, la proposition et les sources restent immuables. Aucune fermeture de constat ni approbation du plan.
6. Prévoir progression lisible, récupération de la réponse corrigée sans second appel, refus de doublon et refus si le contexte/hash d'origine ne correspond pas.

Les raisonnements qui renvoient au propriétaire le typage technique d'exigences, le choix du fichier de test ou les interactions déjà spécifiées ne constituent pas des arbitrages fonctionnels manquants. Le pilote doit appliquer les décisions existantes ; ne pas demander à Hermann de prendre ces décisions techniques.

Tests requis avant qualification ciblée : réponse réelle rejetée conservée ; toutes les lacunes et ID invalide signalés ; correction valide ; altération de la réponse d'origine refusée ; dérive de proposition refusée ; récupération sans invocation ; doublon refusé ; impossibilité d'élargir automatiquement les déclarations de lecture.

## Retour automatique

Le lanceur local PRE-3 n'a pas d'étape de publication automatique du résultat sur GitHub. Le transfert manuel vient de ce choix de transport, pas d'une exigence générale de VNext. Le relais PRE-4 fusionné via #346 doit être examiné avant tout raccordement ; ne pas présumer qu'il couvre review-scope ou sa correction. Aucune permission/token nécessaire à ce retour n'a été vérifiée sur le poste. Raccorder le chemin existant si compatible, sans modifier le checkout de la session terminée.

## Statut et limite opérationnelle

Aucun reçu valide produit. Aucun nouvel appel Claude déclenché. Tous les éléments disponibles ici sont préparés pour la correction. Le correctif #347 ne fournit actuellement ni reprise de session de complément ni branche de réparation après validation refusée ; --recover relit seulement la réponse et reproduit le refus. Aucun binaire Claude dans cet environnement. Le chemin de correction bornée doit donc être implémenté/qualifié avant une commande propriétaire réellement exécutable. Ne pas demander un nouveau lancement INITIAL ou un second review-scope aveugle.
