# Matrice de couverture — spécification v3.0 du 18/10/2026

Document de traçabilité du change, **non normatif** : les règles font foi dans les chapitres cités. Générée par `outils/matrice-couverture.mjs` ; les emplacements modifiés sont comptés depuis les références des corrections appliquées (`constats/*-applique.json`). Statuts : intégré, partiel (la raison est donnée), restant, exclu (§11.3), signalé (écart Figma).

Totaux : intégré 67 ; partiel 9 ; restant 1 ; exclu 9 ; signalé 4 — 90 éléments.

| Élément | Intitulé | Décision | Emplacement normatif | Emplacements modifiés (corrections) | Statut | Remarque |
|---|---|---|---|---|---|---|
| CH-01 | Nature de la valeur (informative, kg, sans convention de matériel) | D-403 | RM-235 | PRODUCT (1), ch. 01 (2), ch. 02 (1), ch. 04 (4), ch. 09 (3), ch. 10 (4), ch. 11 (2), ch. 12 (1), ch. 13 (2) | intégré |  |
| CH-02 | État initial Sans ; anciens exercices sans charge ; valeur remplaçant Avec | D-403, D-404 | RM-236, RM-237 | PRODUCT (1), ch. 01 (2), ch. 02 (1), ch. 03 (2), ch. 04 (3), ch. 08 (1), ch. 09 (2), ch. 10 (4), ch. 11 (1), ch. 12 (1), ch. 13 (6) | intégré |  |
| CH-03 | Séries identiques : charge commune après la Pause, saisie directe | D-404 | RM-237 | PRODUCT (1), ch. 01 (2), ch. 02 (1), ch. 03 (1), ch. 04 (4), ch. 08 (2), ch. 10 (4), ch. 11 (1), ch. 13 (4) | intégré | État de saisie non dessiné dans Figma (écart 2) |
| CH-04 | Séries variables : ligne Avec / Sans sous le tableau, colonne, valeur liée à la série, règles communes | D-404 | RM-238 | DSF-CIRCUITS-CONTROLES (2), DSF-DEUX-MODES-ECHEC (2), PRODUCT (1), ch. 01 (2), ch. 02 (1), ch. 03 (3), ch. 04 (4), ch. 06 (1), ch. 07 (2), ch. 08 (3), ch. 09 (3), ch. 10 (4), ch. 11 (1), ch. 13 (9) | intégré | Contrôle de la cellule Pause sans pied ± : Q-V3-05 |
| CH-05 | Saisie décimale, pas 0,25 kg, arrondi supérieur, zéro, (ré)activation | D-405 | RM-239 | PRODUCT (1), ch. 02 (1), ch. 04 (1), ch. 07 (1), ch. 08 (2), ch. 09 (1), ch. 10 (4), ch. 11 (3), ch. 12 (3), ch. 13 (7) | intégré | Clavier Figma sans séparateur décimal (écart 1) |
| CH-06 | Conservation avec Sans | D-403 | RM-236 | PRODUCT (1), ch. 02 (1), ch. 04 (3), ch. 07 (1), ch. 08 (2), ch. 09 (6), ch. 10 (4), ch. 11 (4), ch. 12 (1), ch. 13 (10) | intégré |  |
| CH-07 | Cohérence avec les autres paramètres (validation, séries, pas de valeur par côté) | D-403, D-404 | RM-235, RM-238 | ch. 02 (1), ch. 07 (1), ch. 08 (2), ch. 09 (1), ch. 10 (4), ch. 11 (1), ch. 13 (1) | intégré |  |
| CH-08 | Phrase de synthèse | D-403 | RM-240 | PRODUCT (1), ch. 02 (1), ch. 08 (1), ch. 09 (1), ch. 10 (6), ch. 11 (2), ch. 12 (1), ch. 13 (6) | partiel | Position du groupe et forme en séries variables non fixées par la spécification : Q-V3-01 |
| CH-09 | Exécution : charge de la série courante | D-403 | RM-241 | PRODUCT (1), ch. 02 (1), ch. 08 (2), ch. 09 (2), ch. 10 (6), ch. 11 (1), ch. 12 (1), ch. 13 (23) | intégré | Affichage non illustré dans Figma (écart 4) |
| CO-01 | Changement de côté Avec / Sans, côté 1 / côté 2, compatibilité | D-406, D-407 | RM-242, RM-243, RM-244 | DSF-CADENCE (2), DSF-CARTES-ICONES-APPUIS (2), DSF-CIRCUITS-CONTROLES (3), DSF-PHRASES-V15 (2), DSF-SEGMENTES-TITRES (2), DSF-SERIES-VARIABLES (2), PRODUCT (9), ch. 01 (7), ch. 02 (4), ch. 03 (6), ch. 04 (9), ch. 05 (2), ch. 06 (5), ch. 07 (7), ch. 08 (5), ch. 09 (11), ch. 10 (19), ch. 11 (6), ch. 12 (7), ch. 13 (36) | intégré | Frames d’exécution encore « Côté droit » ; « Une seule série » : Q-V3-04 ; phrase côté 1 / côté 2 : Q-V3-02 |
| CA-01 | Cadence Autre | 5 s | 2 s | 1 s | Sans | D-408 | RM-245 | DSF-BIP-CADENCE (2), DSF-CADENCE (2), DSF-PHRASES-V15 (2), PRODUCT (1), ch. 01 (1), ch. 03 (1), ch. 05 (2), ch. 06 (1), ch. 07 (1), ch. 08 (2), ch. 10 (6), ch. 12 (1), ch. 13 (10) | intégré | Sans puis Autre : Q-V3-08 |
| DU-01 | Durée de l’exercice, chevron des signaux, absence de ligne | D-409 | RM-246 | DSF-BIP-CADENCE (2), DSF-CADENCE (2), DSF-SERIES-VARIABLES (2), ch. 01 (2), ch. 03 (2), ch. 05 (1), ch. 06 (2), ch. 07 (3), ch. 08 (2), ch. 10 (3), ch. 13 (13) | intégré | Texte « Durée totale : » de la phrase non visé : Q-V3-07 |
| CV-01 | Chevrons intégrés (Variables, Avec, phases) | D-410 | RM-247 | DSF-CIRCUITS-CONTROLES (2), DSF-SERIES-VARIABLES (2), ch. 06 (1), ch. 07 (1), ch. 08 (2), ch. 10 (9), ch. 13 (7) | partiel | Option Avec des phases : dépend de #370 (dependances-pr.md) |
| AR-01 | Condition d’arrêt : saisie en identiques, résultat dérivé en variables | D-411 | RM-248, RM-249 | DSF-DEUX-MODES-ECHEC (3), ch. 01 (1), ch. 03 (1), ch. 04 (1), ch. 06 (1), ch. 08 (4), ch. 09 (1), ch. 10 (3), ch. 11 (1), ch. 13 (10) | intégré | État initial : Q-V3-03 ; libellé mixte Figma erroné |
| GR-01 | Quatre groupes, ordre, tableaux, modale adaptée | D-413 | CE-UI-10, ch. 06, DSF | DSF-BIP-CADENCE (2), DSF-CADENCE (3), DSF-CIRCUITS-CONTROLES (5), DSF-DEUX-MODES-ECHEC (2), DSF-INTERFACE-GENERALE (3), DSF-PARAMETRES-MODALE (1), DSF-PHRASES-V15 (2), DSF-SEGMENTES-TITRES (2), DSF-SERIES-VARIABLES (4), INDEX (1), ch. 06 (4), ch. 07 (4), ch. 08 (5), ch. 10 (4), ch. 13 (16) | partiel | Ligne Phases du groupe 2 : dépend de #370 ; valeurs de tokens à relever dans Figma |
| RO-01 | Roulettes : durée seule en identiques, durée ou échec par cellule variable | D-412 | RM-250 | DSF-DEUX-MODES-ECHEC (3), ch. 06 (1), ch. 08 (3), ch. 10 (4), ch. 13 (9) | partiel | Roulette Répétitions en identiques : Q-V3-06 ; roulette de phase : #370 |
| PR-01 | Libellés et contrôles | D-413 | CE-UI-10, ch. 01, ch. 06, ch. 08 | DSF-CIRCUITS-CONTROLES (2), DSF-DEUX-MODES-ECHEC (2), DSF-PARAMETRES-MODALE (1), DSF-PHRASES-V15 (2), DSF-SEGMENTES-TITRES (3), DSF-SERIES-VARIABLES (1), INDEX (1), ch. 01 (6), ch. 03 (7), ch. 04 (2), ch. 05 (1), ch. 06 (3), ch. 07 (4), ch. 08 (5), ch. 10 (2), ch. 13 (9) | intégré | « Phases de l’exercice » : #370 |
| PR-02 | Tableaux (36 px, sans +/−, fond blanc) | D-413 | CE-UI-10, DSF Circuits | DSF-CIRCUITS-CONTROLES (6), DSF-DEUX-MODES-ECHEC (2), DSF-PARAMETRES-MODALE (1), DSF-SERIES-VARIABLES (2), ch. 06 (3), ch. 07 (1), ch. 08 (2), ch. 13 (4) | intégré |  |
| PR-03 | Traitement des contrôles | D-413 | DSF (blocs du 18/10) | DSF-BIP-CADENCE (1), DSF-CADENCE (2), DSF-CIRCUITS-CONTROLES (1), DSF-DEUX-MODES-ECHEC (1), DSF-INTERFACE-GENERALE (2), DSF-PARAMETRES-MODALE (1), DSF-SEGMENTES-TITRES (3), DSF-SERIES-VARIABLES (3), ch. 06 (2), ch. 07 (1), ch. 08 (1), ch. 10 (1), ch. 13 (2) | partiel | Tokens à relever dans Figma avant publication du DSF (Q-V3-10) |
| PR-04 | Modale et clavier | D-405, D-413 | CE-UI-10 rubrique 10, RM-239 | DSF-BIP-CADENCE (1), DSF-CIRCUITS-CONTROLES (1), DSF-DEUX-MODES-ECHEC (1), DSF-PARAMETRES-MODALE (1), DSF-SERIES-VARIABLES (1), PRODUCT (1), ch. 06 (3), ch. 07 (1), ch. 08 (1), ch. 12 (1), ch. 13 (3) | intégré |  |
| PR-05 | Enchaînement des côtés : notation Figma conservée | D-406 | RM-243 | DSF-SEGMENTES-TITRES (1), ch. 01 (1), ch. 03 (1), ch. 04 (2), ch. 06 (1), ch. 08 (1), ch. 10 (2), ch. 13 (1) | intégré | Notation Figma à lettres D/G : Q-V3-09 |
| AC-01 | Exercice ancien sans charge | D-403 | RM-236 ; CE-UI-10 recette | ch. 09 (1), ch. 11 (1), ch. 12 (1), ch. 13 (4) | intégré |  |
| AC-02 | Identiques 10 kg | D-404 | RM-237 | ch. 13 (2) | intégré |  |
| AC-03 | 1,25 kg conservé | D-405 | RM-239 | ch. 09 (1), ch. 11 (1), ch. 13 (3) | intégré |  |
| AC-04 | Avec → Sans → Avec | D-403 | RM-236 | ch. 08 (1), ch. 13 (3) | intégré |  |
| AC-05 | Variables 20/25/30 kg | D-404 | RM-238 | ch. 09 (1), ch. 13 (2) | intégré |  |
| AC-06 | Déplacement d’une série | D-404 | RM-238 | ch. 08 (1), ch. 09 (2), ch. 13 (2) | intégré |  |
| AC-07 | Règles communes des champs | D-404 | RM-238 (renvois explicites) | ch. 08 (1), ch. 09 (1), ch. 13 (2) | intégré |  |
| AC-08 | Synthèse à charges différentes | D-403 | RM-240 | PRODUCT (1), ch. 08 (1), ch. 09 (1), ch. 12 (1), ch. 13 (3) | partiel | Q-V3-01 |
| AC-09 | Exécution à charge active | D-403 | RM-241 | PRODUCT (1), ch. 08 (1), ch. 09 (1), ch. 10 (1), ch. 11 (1), ch. 12 (1), ch. 13 (7) | intégré |  |
| AC-10 | Invariance des calculs | D-403 | RM-235 | ch. 09 (2), ch. 11 (1), ch. 13 (4) | intégré |  |
| AC-11 | Clavier ouvert sur tableau | D-405 | RM-239, CE-UI-10 | ch. 13 (2) | intégré | Écart Figma : pas de séparateur |
| AC-12 | Duplication ou copie | D-403 | RM-236 ; ch. 09, ch. 11 | PRODUCT (1), ch. 04 (1), ch. 08 (1), ch. 09 (6), ch. 10 (1), ch. 11 (4), ch. 12 (1), ch. 13 (4) | intégré |  |
| AC-13 | Plus de Gauche/Droite | D-406 | RM-242 | PRODUCT (1), ch. 01 (3), ch. 02 (2), ch. 03 (2), ch. 04 (4), ch. 05 (1), ch. 07 (1), ch. 08 (1), ch. 09 (1), ch. 10 (3), ch. 11 (1), ch. 12 (1), ch. 13 (6) | intégré |  |
| AC-14 | Compatibilité D→G / G→D | D-406 | RM-244 | PRODUCT (2), ch. 01 (2), ch. 04 (1), ch. 05 (1), ch. 07 (1), ch. 08 (1), ch. 09 (5), ch. 10 (4), ch. 11 (2), ch. 12 (3), ch. 13 (7) | intégré | Correspondance RIGHT/LEFT pour l’historique : Q-V3-11 |
| AC-15 | Cadence rapide | D-408 | RM-245 | DSF-BIP-CADENCE (2), PRODUCT (1), ch. 03 (1), ch. 05 (1), ch. 07 (1), ch. 08 (1), ch. 10 (1), ch. 13 (5) | intégré |  |
| AC-16 | Repli des signaux | D-409 | RM-246 | ch. 08 (1), ch. 13 (4) | intégré |  |
| AC-17 | Exercice ouvert depuis une séance | D-409 | RM-246, RM-218 | ch. 08 (1), ch. 13 (3) | intégré |  |
| AC-18 | Chevrons intérieurs | D-410 | RM-247 | ch. 10 (1), ch. 13 (3) | partiel | Phases : #370 |
| AC-19 | Identiques : deux conditions sélectionnables | D-411 | RM-248 | ch. 08 (1), ch. 09 (1), ch. 10 (1), ch. 13 (2) | intégré |  |
| AC-20 | Variables homogènes | D-411 | RM-249 | ch. 08 (1), ch. 09 (1), ch. 13 (1) | intégré |  |
| AC-21 | Variables mixtes | D-411 | RM-249 | DSF-DEUX-MODES-ECHEC (1), ch. 08 (1), ch. 09 (1), ch. 13 (1) | intégré |  |
| AC-22 | Ordre des cadres, pas d’espace vide | D-413 | CE-UI-10 | DSF-BIP-CADENCE (2), DSF-CIRCUITS-CONTROLES (1), DSF-INTERFACE-GENERALE (2), ch. 08 (1), ch. 13 (4) | intégré |  |
| AC-23 | Pas de côté anatomique imposé | D-407 | RM-243 | DSF-CADENCE (1), DSF-CARTES-ICONES-APPUIS (2), DSF-CIRCUITS-CONTROLES (2), DSF-PHRASES-V15 (2), PRODUCT (3), ch. 01 (3), ch. 02 (2), ch. 03 (1), ch. 04 (1), ch. 06 (3), ch. 07 (5), ch. 08 (4), ch. 09 (1), ch. 10 (4), ch. 11 (1), ch. 12 (5), ch. 13 (21) | intégré |  |
| AC-24 | Roulette commune sans À l’échec | D-412 | RM-250 | DSF-DEUX-MODES-ECHEC (3), ch. 08 (1), ch. 10 (2), ch. 13 (5) | intégré |  |
| AC-25 | Cellule variable À l’échec | D-412 | RM-250 | DSF-DEUX-MODES-ECHEC (1), ch. 08 (2), ch. 10 (1), ch. 13 (6) | intégré |  |
| AC-26 | Retour à une durée numérique | D-412 | RM-250 | ch. 08 (1), ch. 13 (3) | intégré |  |
| §11.2 8328:36923 | Champs vides | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré | Écart : « A la cible » |
| §11.2 8328:37092 | Mode d’exécution (sélection segmentée) | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré | Écart : Valider actif avec cible manquante |
| §11.2 8328:37972 | Changement de côté Replié | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré |  |
| §11.2 8328:39072 | Une seule série | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | partiel | Avec désactivé non généralisé : Q-V3-04 |
| §11.2 8328:38084 | Durée totale (roulette) | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré | 5 min 30 s illustratif |
| §11.2 8328:37862 | Durée d’une série (roulette) | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré |  |
| §11.2 9232:44646 | Durée d’une phase (roulette) | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré | Nom de frame de phase sur une cellule variable : signalé, aucun contrat de phase déduit |
| §11.2 8328:38632 | Séries variables en Répétition Avec Cadence | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré |  |
| §11.2 8328:38848 | Séries variables (tableau replié) | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré |  |
| §11.2 8982:15172 | Phases verrouillées (séries variables) | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | partiel | Cité au contrat CE-UI-10 ; capture laissée au report de #370 |
| §11.2 8470:13303 | Séries variables, cas mixte | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré | Écart : « A la cible età l’échec » |
| §11.2 9207:18817 | Tableau de 3 phases | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | restant | Dépend de #370 |
| §11.2 9289:17849 | Charge | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré |  |
| §11.2 9290:17953 | Séries variables avec charge | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré |  |
| §11.2 9292:18077 | Séries variables avec charge — Clavier numérique | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré | Écarts : pas de séparateur ; cellule Durée en surbrillance |
| §11.2 9307:18208 | Série en durée — Durée de l’exercice déployée | D-413 | ch. 06 (capture), CE-UI-10 rubrique 1 | ch. 06, ch. 13 | intégré |  |
| §11.3-1 | Essais centrés et Proposition 3/4 | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §11.3-2 | Option manuelle Mixte | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §11.3-3 | Déploiement temporaire des signaux sur les exemples avec charge | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §11.3-4 | Convention par haltère/barre/machine | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §11.3-5 | Autorisation particulière de cellules de charge vides | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §11.3-6 | Champ « Autre résistance » | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §11.3-7 | Charge « à côté de la cible » pendant l’exécution | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §11.3-8 | Liste de nouvelles bornes numériques | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §11.3-9 | Généralisation de la saisie au clavier aux autres nombres | — | Registre, en-tête de la section du 18/10 (exclusion) | ch. 07 | exclu | Non intégré comme règle (proposition abandonnée ou non arbitrée) |
| §12-1 | Pas 0,25 kg | D-405 | RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-2 | Zéro = Sans charge, par série en variable | D-405 | RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-3 | Toutes les séries à zéro → Sans | D-405 | RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-4 | Aucun plafond métier | D-405 | RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-5 | Arrondi au pas supérieur sans message | D-405 | RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-6 | Arrondi à la sortie du champ ou à la validation | D-405 | RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-7 | Première activation 0,25 kg et saisie ouverte | D-405 | RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-8 | Réactivation : valeurs mémorisées | D-405 | RM-236, RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-9 | Réactivation après tous zéros : 0,25 kg par série | D-405 | RM-239 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-10 | Ligne Avec / Sans sous le tableau | D-405 | RM-238 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-11 | Colonne masquée, valeurs conservées | D-405 | RM-238 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-12 | Titre de colonne non cliquable | D-405 | RM-238 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-13 | Pas de nouvelle notation d’enchaînement | D-406 | RM-243 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §12-14 | Signaux visibles sans ligne de durée | D-409 | RM-246 | ch. 07 (2), ch. 09 (1), ch. 10 (1) | intégré |  |
| §4-1 | Clavier sans séparateur décimal (9292:18077) | — | ch. 06 (captures), rapport | ch. 06 | signalé | Écart Figma, aucune modification de Figma |
| §4-2 | État de saisie de la charge en séries identiques non dessiné | — | ch. 06 (captures), rapport | ch. 06 | signalé | Écart Figma, aucune modification de Figma |
| §4-3 | Ligne Charge absente de l’état clavier 9292:18077 (choix de présentation) | — | ch. 06 (captures), rapport | ch. 06 | signalé | Écart Figma, aucune modification de Figma |
| §4-4 | Affichage de la charge en exécution non illustré | — | ch. 06 (captures), rapport | ch. 06 | signalé | Écart Figma, aucune modification de Figma |

Questions Q-V3-nn : [questions-hermann.md](questions-hermann.md). Dépendances aux PR : [dependances-pr.md](dependances-pr.md).
