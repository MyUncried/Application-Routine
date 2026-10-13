# PRE-3 #340 — réconciliation avec la documentation normative courante

La CI finale 38318732025 du candidat 18476565 est SUCCESS. La fusion parallèle de #349 puis #350 fait avancer main à b6b62ddf6cd4e6a97e38e9d366b9ce2f06542069 et introduit trois conflits documentaires avec #351. Ce rapprochement conserve les deux parents sans réécriture, sans code ni correctif de protocole.

## Résolution

- Chapitre 06 : galerie courante du12/10–13/10 conservée ; catégorie marquée puis validée par ✓ conformément à D-343, sans réintroduire les anciennes captures de tableau déjà remplacées.
- Chapitre 07 : décisions de recette D-336..356 et nouvelles sections CIR/EC toutes conservées, sans renumérotation.
- Paramètres v13 : restriction d’inversion quand N est hérité, nouvelle présentation et deux modes conservés ; Annuler D-340/D-346, ouverture D-342 et déplacement D-345 conservés. Les segmentés/steppers permanents livrés par PRE-3 sont explicitement historiques face au nouveau DSF. Corrigé le résidu « Trois modes » du Bip dans la même table.
- Chapitres 12/13 : fusion textuelle automatique conservant leurs deux changements ; aucune reprise de conception ni modification des règles À l’échec.

## Vérification

Aucun changement de src/app/scripts/workflows/dépendances par rapport à18476565. Tous les blobs applicatifs restent ceux de626632c3 publié par OTA01a1324c. Aucun conflit restant. Le vérificateur de la préparation figée PRE-3 passe2143contrôles ; il ne certifie pas les nouvelles règles EC/CIR, destinées à une tranche suivante. Les décisions D-336..356, CIR-01..12 et EC-01..10 sont conservées ; les nouvelles spécifications et les PNG de main sont repris sans altération. La CI exacte de cette réconciliation doit être lue avant fusion.

## Conséquence pour la demande suivante

Hermann autorise VNext sur la finalisation de l’éditeur et la cible À l’échec par série le13/10 à01:57:55Paris. Cette autorisation permet la préparation/planification, pas l’approbation d’un plan inconnu. Le relais intégré pour VNEXT-PRE-4 impose la fermeture de #340 ; ce préalable n’est pas contourné. Les évolutions de Composition, les circuits/volumes et le moteur/relevés restent séparés du périmètre éditeur convenu.
