# Bilan — intégration de la spécification v3.0 des paramètres d’exécution (18/10/2026)

- **Objectif** : intégrer à la documentation principale toutes les décisions validées de la spécification « Évolution des paramètres d’exécution » v3.0, avec le workflow OpenSpec et sans source normative concurrente.
- **Branche et commit de départ** : `docs/openspec-revision`, `b6ca2321`.
- **Périmètre demandé** : décisions et scénarios de la spécification, chapitres 01 à 13, contrats, données, API, registre, DSF ; vérification Figma ; contrôle transversal ; matrice de couverture ; cohérence avec #363, #370, #371.
- **Périmètre traité** : tout le périmètre demandé ; les points propres aux phases d’exercice sont décidés au registre et laissés au report de #370.
- **Constats, preuves, modifications** : [rapport-conformite.md](rapport-conformite.md) ; [matrice-couverture.md](matrice-couverture.md) ; [controles/FINAL.txt](controles/FINAL.txt).
- **Hypothèses non démontrées** : lecture « contrôles segmentés » de D-413 (Q-V3-14) ; formes neutres de la phrase des côtés (Q-V3-02) ; les autres points ouverts sont listés dans [questions-hermann.md](questions-hermann.md).
- **Hors périmètre** : Figma, code, copies figées PRE-4/PRE-5, BMAD, VNext, workflows, PR ouvertes, fusion dans `main`, archivage du change.
- **Fichiers modifiés** : 25 fichiers de `docs/` (ch. 01 à 13, 10 DSF, PRODUCT, INDEX) et l’annexe « Index des identifiants », plus 20 captures ajoutées ; dossier du change `openspec/changes/integration-parametres-execution-v3/`.
- **Commit final et état Git** : communiqués en fin de session ; poussé sur `docs/openspec-revision` uniquement. Les archives `.zip` non suivies de `openspec/changes/` restent hors commit.

## Seconde version — arbitrages de Hermann (18/10/2026)

- **Départ** : `69c45e4e`.
- **Fait** : décisions D-414 à D-421 (Q-V3-01, Q-V3-03 à Q-V3-08, Q-V3-15) enregistrées et propagées (lot `V3-11`, 40 corrections) ; dix questions traitées par les décisions existantes ; seconde passe de contrôle indépendante, 10 écarts corrigés (lot `V3-12`, 21 corrections) ; seconde passe Figma en lecture seule, nouveaux écarts signalés ; correctifs des PR recalculés.
- **Hypothèse signalée en seconde passe** : place de la mention de charge, tranchée ensuite par D-422.
- **Derniers arbitrages** : Q-V3-19 (D-422, après la valeur par série), Q-V3-20 (D-423, série à zéro listée), Q-V3-16 (D-424, grisée) ; lot `V3-13`. Plus aucune question produit ouverte ; coordinations Q-V3-02, Q-V3-10, Q-V3-17.
- **Contrôles** : [controles/FINAL-4.txt](controles/FINAL-4.txt), tous réussis depuis `b6ca2321`.

## Clôture — intégration des PR et archivage (18/10/2026)

- **PR** : #363, #370 et #371 intégrées par corrections tracées (lots `V3-14` à `V3-21`, [pr/traitement-pr.md](pr/traitement-pr.md)), puis fermées sur GitHub sans fusion, branches conservées.
- **Contrôles** : [controles/FINAL-6.txt](controles/FINAL-6.txt), depuis `b6ca2321` : rejeu exact de 489 corrections, conservation vérifiée, liens, K1, K2, OpenSpec.
- **OpenSpec** : `revision-documentation-kodjo` et `integration-parametres-execution-v3` archivés avec `openspec archive` ; spécifications de gouvernance créées dans `openspec/specs/` (aucune règle produit). Tâches non réalisées consignées en tête de chaque `tasks.md`.
- **Hors périmètre** : fusion dans `main` (décision de Hermann), vérification Figma écran par écran (mission distincte).
