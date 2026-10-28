# PRE-8 — Résultats de la recette iPhone de l'epic E (28/10/2026)

> Recette réalisée par Hermann le 28/10/2026 sur `pre8-bmad/dev` @ `da3b3553`, avec le cahier `recette-iphone-epic-e.md` mis en ligne (page de recette privée, verdicts enregistrés point par point, relus par Claude). Serveur Expo de la variante BMAD, build de développement **Routine BMAD** existant, base au schéma 15.

## Bilan

| Verdict | Points |
|---|---|
| OK | 70 |
| KO | 2 |
| Non testé | 7 |
| **Total** | **79** |

Non testés (NT) : `e2-08` (annonce VoiceOver du bouton Lecture), `e2-11` (Séance historique sans Exercice), `e3-07` (VoiceOver du déploiement), `e4-03` (VoiceOver de la bascule), `e5-13` (rotor d'actions VoiceOver), `e6-10` (annonce des formats indisponibles), `e8-08` (VoiceOver du crayon Modifier). Ils restent à vérifier ; l'epic n'est pas déclaré recetté sur ces points.

## KO et demandes de changement

| Point | Constat de Hermann | Décision de Hermann (28/10) | Traitement |
|---|---|---|---|
| `e2-10` KO | « Le titre des cartes est tronqué vers le bas » (texte agrandi) ; précisé : bas des lettres coupé | Corriger | Le nom de la carte n'a plus d'interligne fixe : la ligne suit la taille de la police ; hauteur de la rangée inchangée au repos (20). |
| `e5-12` KO | Toucher une Séance archivée affiche seulement « Cette séance est archivée et ne peut pas être modifiée » et « Revenir au catalogue », sans la composition | **Composition en lecture seule** | Nouvel écran de consultation : nom, avis « Séance archivée : consultation seule. Restaurez-la depuis le Catalogue pour la modifier. », conteneurs Cycle / Circuit (règle de la carte déployée), cartes d'Exercice de la Composition avec leurs récupérations ; aucune commande de modification, aucune écriture ; lecture de la structure générale (aucune limite R-E6). |
| `e4-02` (OK avec remarque) | « Un bouton en croix pour annuler le filtre apparaît. Ce bouton doit disparaître. » | Voir `q4-02` | Forme compacte retirée (elle seule portait la croix). |
| `q4-02` (OK avec remarque) | « Retirer la forme compacte avec deux boutons : garder à la place la forme étendue mais avec le texte « X filtres » à la place du nom du filtre » | Forme étendue toujours ; « N filtres » (« 1 filtre ») quand le nom ne tient pas ; **jamais sur deux lignes** (« "N filtres" tient sur une ligne sans chevauchement ») | Q-E4 révisé : forme compacte et seconde ligne retirées ; le texte passe au nombre de filtres quand le résumé ne tient pas ; la zone des commandes cède la place à la bascule plutôt que de la chevaucher. La variante `compact` de `FilterCommand` est supprimée. |

Remarque `e8-07` (OK) : « je pense que toutes les anciennes définitions sont présentes » — vérification visuelle sans référence antérieure ; le test d'intégration E.8-a couvre la présence de chaque définition.

## Réserves

| Réserve | Verdict | Conséquence |
|---|---|---|
| R-E2 — vignettes Tabata et EMOM reconstituées | OK | Rendu accepté tel quel. |
| R-E3 — forme compacte du filtre actif | OK, puis sans objet | Forme compacte retirée (`q4-02`). |
| R-E4 — lignes déployées « 3 × 12 rép. » / « 45 s » | OK | Format accepté ; le ch13 de `main` (`12 reps · x3`) est à mettre à jour lors de l'intégration documentaire. |
| R-E5 — message générique du filtre Archivées vide | OK | Message générique accepté ; le message propre prévu par le ch13 n'est pas requis. |

## Suite

- Corrections livrées dans un commit dédié de recette ; nouvelle passe iPhone ciblée sur `e2-10`, `e5-12`, `e4-02`/`q4-02` et les 7 points non testés.
- L'epic E reste `in-progress` jusqu'à la validation de Hermann.
