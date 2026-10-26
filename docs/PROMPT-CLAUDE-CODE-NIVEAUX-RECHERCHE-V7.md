# Claude Code — KODJO, décisions closes C01–C09

Reprendre le chantier existant dans MyUncried/Application-Routine, avec BMAD et les stories en cours. Lire AGENTS.md, docs/INDEX.md, la spécification KODJO-Niveaux-Recherche-Parcours-Regles-v7.md et D-445 au chapitre 07. Lire les règles MFN et recettes du chapitre 10, le modèle des chapitres 04/09, les services 11, l’architecture 12 et les contrats 13. Le DSF du 25/10 contient les captures datées et les écarts de réalisation.

C01–C07 et C09 sont clos : ne pas les rouvrir. C08 seul reste différé pour l’inclusion MVP de rattacher/détacher/supprimer ; il n’est pas exclu. Aucun chantier VNext ni reconstruction de l’application ; préserver le travail en cours. Cette mise à jour ne prouve pas que le code est aligné.

Architecture cible : ActivityDefinition et SessionActivity référencent directement le mouvement ; paramètres locaux indépendants dans la séance, sans lien de dépendance à la définition Catalogue. Contenu courant lu au mouvement, pas de synchronisation de copies. Au démarrage, résoudre puis figer l’instantané ; ne pas relire le mouvement en cours d’exécution. Mouvement conservé après suppression de tous ses exercices ; intégrité sur références vivantes, pas sur filiation historique.

Dialogue unique : nom changé → toujours mettre à jour/créer/annuler ; nom inchangé et contenu modifié → confirmer si autre exercice lié ou exécution enregistrée, sinon silencieux. Paramètres seuls/rien/reclassement seul → aucun dialogue. Compter les autres définitions et occurrences, rechercher l’historique par identité ; ne pas réintroduire l’indicateur durable d’usage à l’insertion ni une seconde commande de création distincte. Variante explicite → création directe avec nom unique.

Formulaire de variante : description/médias vierges ; catégorie/zones reprises ; nom commencé avec invite non persistée (compléter le nom). Crayon disponible depuis séance pour correction partagée. Niveau actif hors crayon ; changement de mouvement = nouvelle occurrence, paramètres compatibles conservés. Correction de phases du même mouvement : conserver valeurs par phaseId ; changement entre mouvements : transférer par rang selon les quatre cas. Frères incomplets signalés avant lancement, sans durées inventées ni complétion immédiate obligatoire.

Tests automatiques dans la CI existante : corpus R07 de recherche complet, unicité et collisions, toutes les branches MFN-08 avec zéro/autres exercices et historique, variante et annulation, indépendance des paramètres, lecture du contenu courant, suppression de définition sans cassure de séance, mouvement sans exercice, phases et instantanés figés. Tester résultats de recherche, ordre et déduplication, jamais recopier la formule comme oracle. Ajouter tout défaut corrigé au corpus. Base vierge : aucune migration exigée.

Réutiliser composants/tokens existants. Carte Résultat 107 pt distincte de carte simple 80 pt ; les écarts Figma sont connus et ne remplacent pas D-445. Livrer ce qui est effectivement réalisé et vérifié, avec limites restantes distinctes des arbitrages clos.


Lire également `docs/KODJO-Phases-Guidage-Cyclique-2026-10-26.md` (PHC-20261026), prioritaire sur les anciennes restrictions : phases cycliques compatibles avec Répétitions et À l’échec ; cible de série indépendante ; aucune adaptation proportionnelle. Remplacer le transfert phases→sans par conservation de la cible. Rapprocher D-446 locale de cette clarification. Les tests PHC/AC01–12 sont à implémenter ; arrêt mixte et guidage après cible avant Suivant restent explicitement distincts.
