# FUNC-SEG-02 — Supprimer le troisième segment de catalogue

Statut : **spécifié, à développer et à vérifier dans le code**. Décision D-324, complément1 propriétaire du07/10. Ce ticket documentaire appartient au backlog fonctionnel ; il ne fait pas partie du brief d’alignement visuel.

## Besoin

Exposer seulement Exercices et Séances dans les Catalogues et les sélecteurs de type des modales Choisir une séance / Choisir un exercice. Le document reçu signale encore « Circuits » dans le code ; cette mission documentaire n’a pas audité son implémentation.

## Travail et critères de recette

- Retirer la troisième option, sa largeur réservée, sa cible, son annonce accessible et ses éventuels traitements de navigation dans ces contrôles. Aucun simple renommage en Parcours.
- Conserver l’ordre Exercices / Séances et Séances par défaut au démarrage/relaunch du Catalogue. Vérifier l’ouverture, la sélection, le retour et l’annulation dans chaque modale concernée selon son contrat.
- Conserver Créer contextuel et les filtres/tri existants ; ne pas réintroduire l’ancien arbre de création. La sélection multiple d’Exercices en Composition reste CE-T03-07.
- Appliquer les deux variantes du [DSF](DSF-SEGMENTES-TITRES-2026-10-07.md), répartition flexible des deux options, focus et état sélectionné corrects ; aucune troisième annonce VoiceOver/TalkBack.
- Vérifier l’absence d’effet sur Jour/Semaine/Mois, modes d’exécution, Statut, Changement de côté et Ordre des côtés : leurs options ne sont pas supprimées.
- Ne supprimer aucune donnée, table ou notion de Circuit/Parcours ; le Circuit de Composition et l’extensibilité post-MVP restent inchangés.

Adapter les tests existants des consommateurs après lecture du code ; recette des deux Catalogues et des modales sur appareil. Aucun développement, workflow, fusion applicative ni test réel n’est lancé par ce lot documentaire.
