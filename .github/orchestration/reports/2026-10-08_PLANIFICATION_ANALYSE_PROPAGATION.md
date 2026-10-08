# PLANIFICATION-20261008 — propagation documentaire et traçabilité

## État

**DOCUMENTATION_UPDATED — vérification visuelle ciblée terminée.** Le titre « Éléments planifiés » a été retiré à la demande du propriétaire sur les deux pages Figma. Après la correction de Claude et la confirmation du propriétaire, les deux écrans Planifier un parcours et Fréquence ont été relus et recapturés. Aucune nouvelle modification Figma effectuée par cette mission.

- Dépôt : MyUncried/Application-Routine.
- Base : main `6be6082efde244b14b9b3b6befc5d22db021c445`, arbre `24024b00edbda1f1808be00d6958a0b1ef760cf3` ; tête relue avant publication, inchangée.
- Branche : `docs/planification-2026-10-08`, PR documentaire prête à relire.
- Objectif : intégrer le brief propriétaire du 08/10, séparer règles générales DSF et conception de planification, propager aux contrats, données et API.
- Hors périmètre : code, schéma physique, workflows, fusion main et pull du dev local. Aucun test applicatif annoncé comme réussi.
- Travail concurrent observé : PR #333, PRE-3/médias, non incorporée et non modifiée.

## Sources et résolution des écarts

Le prompt fourni est archivé intégralement dans `docs/archives/planification-2026-10-08/demande-source.md`. Les relevés de lecture Figma et le retrait du titre sont conservés dans `releve-figma.json`. Fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg` ; pages MVP `510:101`, communautaire `6464:10219`, DSF `2291:2`.

| Constat | Traitement |
|---|---|
| A-01 — titre Éléments planifiés visible alors que le brief l’exclut | Arbitrage explicite du propriétaire : retirer. Nœuds 7594:34636 et 7510:33124 supprimés ; recherche du texte vide sur les deux pages après suppression. Après correction de Claude, capture reprise ; blocs gris, absence de titre et pied vérifiés sur les deux pages. |
| A-02 — cible Disclosure dite 28 × 28 dans le brief | Six variantes inspectées, toutes 48 × 48 ; 28 × 28 décrit le cadre enfant. La documentation conserve la cible de 48 et distingue le dessin. Cadre Oui x7/y7, Non x7/y10 ; seul le recentrage vertical est observé. |
| A-03 — mot Circuit potentiellement supprimé à tort | Suppression limitée à l’ancien usage autonome Parcours. Circuit interne à la Séance et répétitions en Tours conservés conformément à D-209/D-324. Aucun renommage technique. |
| A-04 — D-222 encore exclusive sur main | Décision et CE-UI-04 révisés : cases à cocher, Ajouter 1/n éléments ; les référentiels gardent leur propre contrat. |
| A-05 — modèle mono-source et semaine seule | PRODUCT, glossaire, parcours, modèles, règles, API et architecture propagés. Nouvelle liste ordonnée ; filtre x/n ; Jour/Semaine/Mois ; borne jusqu’au/pendant. Les lacunes ne sont pas comblées par des hypothèses. |
| A-06 — parité des pages et comptages annoncés | Dix états repérés sur chaque page ; exemples différents dans la sélection à un élément. Aucune certification d’identité complète. Comptages du brief identifiés comme déclaratifs. |
| A-07 — source Programme V1.2 absente | Recherche dans le dépôt et les fichiers disponibles. V1.1 retrouvée, mais son §29.2 et son recalcul rétroactif ne prouvent pas le gel de l’échu V1.2. Pas de substitution. Seules les règles explicitement transmises sont intégrées. |

## Modifications

- Nouveau DSF général : grille, contexte, CTA, surfaces, blocs et trois composants ; distinction surface/voile et cible/cadre.
- Nouvelle spécification de planification : occurrences produites par le créneau, contenus filtrants, sélection commune, ordre, Programme, répétition, rappel, résumé protégé et points ouverts.
- PRODUCT et chapitres00–13 propagés ; D-222/D-223 révisées ; D-327–D-332 ajoutées ; anciennes décisions autonomes et D-062/D-119 marquées remplacées.
- CE-UI-04 et CE-UI-05 réécrits ; CE-UI-11 ajouté ; 21 rubriques pour chaque contrat. Règles générales communes ajoutées sans modifier les shells existants.
- Galerie de planification du chapitre06 remplacée par dix PNG réellement capturés. Planifier un parcours et son arrière-plan dans Fréquence ont été revérifiés après correction, puis leurs PNG remplacés.
- INDEX et trois anciennes matrices/notes complétés par des renvois de supersession. Une matrice P01–P15 porte le traitement et ses limites, sans transformer « documenté » en « développé ».

## Vérifications

- Relecture de la base à SHA fixé et de la tête main avant publication.
- Contrôle des liens locaux nouveaux ou modifiés contre l’arbre Git de base et les fichiers ajoutés : aucune cible manquante.
- Contrôle des 31 contrats : chacun possède exactement les rubriques 1 à 21, toutes renseignées. Les règles restant ouvertes sont explicitement distinguées de leurs rubriques.
- Ouverture des dix PNG en planche de contrôle ; lecture pleine taille des états Création et Fréquence. Aucun montage utilisé comme capture documentaire.
- Recherche des anciennes prescriptions de planification, remplacement de RM-222/RM-223 et retrait des API-CIR autonomes. Les occurrences encore mono-source sont explicitement bornées au cas historique ; le modèle multi-contenus reste à compléter.
- Préservation du paragraphe de récupération après occurrence, sans rapport avec le retrait du Parcours autonome.
- Archive du prompt comparée au fichier fourni. Les seules écritures Figma sont les deux suppressions du titre autorisées par le propriétaire.

## Limites et prochaine clôture

Les cinq points ouverts du brief restent ouverts : contrôle de x, jours sous Jour/Mois, trois parcours Programme, conversion des bornes, décalage des Disclosure avec cadre. Les compléments techniques nécessaires sont nommés : bornes des steppers, règles mensuelles, origine/stabilité du motif, identité et statuts des réalisations multi-contenus, archivage d’une entrée, ordre initial mixte.

Le rendu corrigé de Planifier un parcours a été contrôlé, ainsi que l’arrière-plan de Fréquence sur les deux pages. Les blocs sont à x24, largeur354, rayon12, gris sans trait ; séparateurs à x36, largeur330 ; CTA y802, hauteur48 ; récapitulatif y732 à786, soit16 px avant le CTA. Le défilement interactif n’a pas été testé. Les autres écrans hors galerie ne sont pas tous réexportés : le DSF général est normatif, leurs anciennes captures ne sont pas une preuve des nouvelles mesures.

Aucune revue exhaustive des 111 écrans n’est annoncée. Aucun workflow ni test mobile exécuté : lot strictement documentaire. La vérification des deux états corrigés ne vaut pas certification visuelle exhaustive de tout le fichier.

## Traçabilité de livraison

La liste P01–P15 et les identifiants des vingt frames sont dans `docs/MATRICE-PLANIFICATION-2026-10-08.md`. Le commit contenant ce rapport porte les spécifications, les références et les captures ; son SHA et le lien de PR sont fournis dans le retour de livraison, sans auto-référence inventée dans le présent commit.
