> État du 09/10 : cette projection scellée est le plan INITIAL historique. La version corrigée à soumettre à la seconde revue est [passe2/plan-technique-corrige.md](https://github.com/MyUncried/Application-Routine/blob/c0c900f50879ea955c7ca1b1a5f5961eb949c438/docs/preparation/PRE-3/planification/passe2/plan-technique-corrige.md), commit `c0c900f50879ea955c7ca1b1a5f5961eb949c438`. Contournement limité du verrou de portée VNext autorisé par le propriétaire et tracé dans son manifeste. Aucun développement ni plan approuvé.

# PRE-3 — PlanContract publié, en attente de revue indépendante

Opération unique : [#340](https://github.com/MyUncried/Application-Routine/issues/340). Baseline application : `1ddfb6d144552f578388257adc78db47ab5992c8`. Source VNext figée : `3019c5f8c4a38efb83865635e0a8d67d48a5b5ab`.

Les objets canoniques sont dans [contrats/manifest.json](contrats/manifest.json), transportés en gzip/base64 par parties avec SHA-256 de chaque partie et de chaque JSON restitué. Le PlanContract, le registre, le graphe et le contrat UI ont été construits par les constructeurs VNext courants. Leur construction n'est ni une approbation indépendante ni une conformité de l'application. Aucun développement PRE-3 n'est livré.

- PlanContract : `5145cbd30860f9ddef041ed33b97a71697517a3ef248229112bb0f5f7b92006f`, 6 384 items ; 50 fichiers modifiés et 23 créations prévus.
- Contrat UI : `d4aa55ad8a0752ae4083a33a96d5d006491258ab1dee5bf2856610ec9399e4c9`, 243 879 propriétés visuelles et 95 états documentaires.
- Graphe : 14 542 impacts ; scan direct réel, classifications causales et obligations de test.
- Traçabilité canonique : entrée `tracabilite-canonique` du manifeste, liens exigences → REQ → PLAN → critères UI → fichiers → tests → preuves.

## Décisions techniques à examiner

Le détail du schéma, des écrivains et des transactions est dans [schema-et-ecritures.md](schema-et-ecritures.md). Les règles et parcours sont détaillés dans [plan-technique-travail.md](plan-technique-travail.md), document d'entrée conservé ; le JSON PlanContract publié est l'objet canonique à examiner. Les [59 assertions de recette](assertions-recette.json) et [attendus numériques](attendus-numeriques.json) sont écrits avant développement ; les [276 cas rédactionnels](attendus-phrases-276.json) restent opposables. Statut de ces tests applicatifs : prévus, non exécutés.

Paramètres versionnés et discriminés ; uniforme/variable explicite, N=1 normalisé immédiatement. ✓ applique seulement au brouillon parent. Terminer écrit la définition Catalogue ou applique la copie au brouillon Composition ; Continuer persiste la Séance. Annulation, restauration temporaire, changements de mode, nombre de Séries et réordonnancement gardent leurs règles complètes.

Migration suivante proposée 009, sans modifier 001..008 ; JSON nullable distingue anciens objets et données canoniques. Anciennes pauses hors plage préservées, absence adaptée sans relecture du Profil ; JSON présent invalide refusé. CR/Fin neutres à zéro pour les anciens objets constituent une proposition à revoir, distincte des défauts des nouveaux objets. Paramètres et associations sont écrits dans la même transaction SQLite ; rollback conserve le brouillon. Copies indépendantes, instantanés versionnés pour consommateurs futurs, aucun historique réécrit.

Un seul calcul métier, indépendante des phrases : durée exacte, répétitions avec bip estimées, répétitions sans bip et échec omis. Aucune hypothèse de 2 s/répétition. Contributions connues de Séance et ordre des indicateurs préservés ; Récupération explicite positive remplace seulement la dernière Pause, sans création automatique. Compte à rebours/fin exclus de durée intrinsèque, inclus une fois au calcul complet. Inversion Durée uniforme et cas limites proviennent des attendus indépendants. Phrases intégrales, segments gras générés à l'affichage, jamais persistés.

Médias : D-334 photothèque seule et D-335 option A conservées. Sélection multiple d'originaux compatibles, sans limite arbitraire ni conversion systématique. Annulation sans erreur, échec d'import visible avec réessai conservant le brouillon ; suppression/réordonnancement accessibles. Fichiers internes stables, références ordonnées propagées aux copies ; aucun fichier référencé supprimé. Préparation/leases et nettoyage limités aux fichiers non référencés. Aucun lecteur en exécution ni moteur sonore.

Préserver PRE-1/PRE-2 et les consommateurs hors périmètre ; adaptations partagées minimales tracées. Les classifications NO_CHANGE du graphe et la préservation native doivent être examinées par Claude : une réussite de constructeur ne prouve pas leur pertinence sémantique.

## Critères UI et preuves attendues

41 écrans de référence PRE-3 et leurs 6 725 éléments, y compris 65 descendants masqués ; fermeture des composants/styles/variables réutilisée depuis #333. Les 95 états représentent ces 41 références plus 54 états documentaires fonctionnels : ils ne comptent pas les écrans de toute l'application. Aucune nouvelle extraction globale. Les contrôles ciblés d'évolution figurent dans les preuves existantes du dossier.

Les assertions atomiques conservent les propriétés applicables par élément et les états fonctionnels par exigence. Les surfaces et fichiers de rendu sont inscrits dans le contrat UI. Comparer chaque état pertinent à Figma aux largeurs 360/402/440 et texte agrandi ; documenter chaque écart, impact, justification, statut et décision. Phrase non tronquée, feuille ancrée en bas/header fixe/corps défilant, sélection exclusive et retrait des éléments absents. Réutiliser la roulette native existante ; conserver la politique du stepper Profil, paramétrer seulement la politique Exercice.

Séparer tests de rendu/navigation/focus/alternatives au drag, comparaisons mesurées et captures, puis contrôles appareil photothèque/permissions/vidéo/VoiceOver/maintien/scroll. Les calculs, migrations et SQLite réels restent des contrôles techniques de l'agent, sans transfert au propriétaire. Aucune comparaison de l'application finale ni recette appareil n'a eu lieu au stade du plan.

## Traçabilité des 23 exigences

| Exigence | Couverture conservée | Assertions préalables | Statut |
|---|---|---|---|
| P3-01 | Quatre entrées créer/modifier × Catalogue/Séance ; copies indépendantes | 5 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-02 | Éditeur complet et actions accessibles | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-03 | Catégorie/Zones fidèles, valeurs conservées | 3 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-04 | Mode et cibles corrects dans trois modes | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-05 | Uniforme/variable explicite, copie/restauration | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-06 | Augmentation/réduction/restauration de N | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-07 | Déplacement, nouvelle première/dernière ligne | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-08 | N=1 normalisé immédiatement | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-09 | Directions et deux ordres bilatéraux | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-10 | Défauts Profil copiés sans réécriture | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-11 | Bip 0..10 dans trois modes | 1 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-12 | Totaux exact/estimé/omis corrects | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-13 | R remplace PN ; calcul Séance sans doublon | 4 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-14 | Inversion Durée uniforme | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-15 | Phrase et gras conformes aux 276 gabarits | 4 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-16 | Brouillons atomiques et erreurs conservées | 4 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-17 | Persistance et migration compatibles | 4 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-18 | Copie/duplication/instantané incluent tous les paramètres | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-19 | Steppers/roulettes/repli/scroll fonctionnels | 3 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-20 | Surfaces visuelles bornées conformes | 2 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-21 | Accessibilité des nouveaux contrôles | 1 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-22 | Frontières respectées, consommateurs préservés | 1 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |
| P3-23 | Import de médias depuis l’éditeur, association persistante et données disponibles pour la future exécution | 5 références ; IDs/fichiers/tests/preuves dans la trace canonique | Planifié, à revoir |

## Restitution et revue après correction de volume

À la racine du checkout de cette publication, avec Node :

```powershell
node docs/preparation/PRE-3/planification/materialiser-contrats-vnext.cjs C:\Temp\PRE3-contrats-publies
```

Le dossier cible doit être hors checkout et sans fichiers homonymes. La commande restitue et vérifie chaque octet ; elle ne déclenche aucun modèle ni revue. Les contrats UI et registre sont volumineux : prévoir au moins 1 Go disponible pour les JSON restitués.

Le [lancement de revue](revue-independante.md) est désormais préparé sur le producteur corrigé `1d42479181586d926a9970867a41d35d44cc4661`. Les objets ont été reconstruits avec les mêmes empreintes PlanContract/UI/registre ; le nouveau conteneur scellé est identifié par `603de045f94fec3f14aa2198edaaad0b91020b79adddb19041b06314cc725e16`. Voir [preuve de reprise](preuve-reprise-plan.json). Claude est absent ici (ENOENT) : la revue réelle nécessite le poste authentifié. Le plan attend toujours son verdict puis la validation explicite du propriétaire.
