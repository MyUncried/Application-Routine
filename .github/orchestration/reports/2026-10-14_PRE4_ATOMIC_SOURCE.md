# PRE-4 — unités fonctionnelles et point de reprise

Source : revue partielle réelle run 38465662376, conservée et refusée ; plan 08c68415. Aucun nouvel appel Claude ni développement.

Cause démontrée : le constructeur générique `requirements` imposait une seule unité `FULL_FILE` pour le document fonctionnel. Le correctif ajoute un mode scellé `ATOMIC_SCREEN_STATES` aux nouvelles préparations. Le document Git intégral, son chemin Unicode, sa révision et son empreinte sont conservés ; chaque objet d’état, y compris ses scénarios, reçoit un locator de lignes et une empreinte propres. Les états non requis restent contextuels. Les inventaires compactés sur une même ligne sont refusés pour ne pas prétendre à une atomisation absente. Validation des checkpoints historiques inchangée.

Contrôle réel : source PRE-4 figée a082de8c ; 83 états requis, 83 unités de lignes plus le document complet contextuel. Première unité L3873-L3892, dernière L5491-L5512. Aucune assertion, propriété ou capture Figma supprimée. 32 tests ciblés réussis, incluant lecture Git de la référence historique et lancement atomique. La suite complète VNext passe : 533 tests, 533 réussis, aucun échec. Après le dernier ajustement de compatibilité, les 32 tests ciblés ont aussi été rejoués avec succès. Les CI distantes doivent compléter cette preuve.

Reconstruction précédente, avec les corrections natives et de préservation : tous les constructeurs passent ; 4843 exigences et 180526 assertions conservées. Ce succès n’est pas une revue indépendante. Les preuves sont dans le checkout intermédiaire pre4-native-corrected-contracts, et doivent être régénérées avec le mode atomique après intégration du correctif.

Reste : raccorder les assessments natifs aux exigences fonctionnelles atomiques appropriées ; vérifier séparément les captures jumelles ; mettre en place une lecture cumulative de toutes les cibles, sans réduction du catalogue ni attestation inventée. La réponse historique 4996/236896 reste refusée et immuable. Aucune relance du paquet historique n’est autorisée. Une nouvelle revue exige un paquet corrigé et précontrôlé ; aucune nouvelle certification globale.
