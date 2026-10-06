# CORRECTIONS-AUDIT-DOCUMENTAIRE — 06/10/2026

Objectif : traiter les constats F-01 à F-15 de l’audit documentaire de Claude, après correction F-09 annoncée par le propriétaire. Reprise du chantier existant, sans nouveau parcours de qualification.

Branche : `docs/cadence-dsf-2026-10-06`, PR [#323](https://github.com/MyUncried/Application-Routine/pull/323). Départ : `12940315c30663988447b7f78572f62418bfc509`. Main vérifié inchangé : `6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`. Travaux antérieurs, captures, contrats et exports SVG réutilisés. Aucun fichier applicatif, protocole VNext/V2/PRE-2/PRE-3, manifeste runtime ou Figma modifié.

## Résolution des constats

| Constat | État | Correction / preuve | Fichiers concernés |
|---|---|---|---|
| F-01 | Corrigé | Échelles et usages des espacements 10/14/20 et rayons 14/17 ; interdictions historiques corrigées. | Chapitre 12, Espacements et rayons |
| F-02 | Corrigé | Catalogue courant, noms, IDs, variantes et exceptions conservées ; Disclosure courant 48×48. Contraintes métier/contextuelles antérieures conservées. | Chapitre 12 ; DSF §7 |
| F-03 | Corrigé | Correspondance des 13 familles archivées et des 18 renommages ; variantes, exceptions, référence Statut d’exécution. Volumes 31/659 attribués au journal. | DSF §7 ; README des images |
| F-04 | Corrigé avec limite de source | Huit fusions : valeurs, cibles, écarts et usages ; text-on-primary→on-primary. Valeurs anciennes qualifiées là où elles étaient prescrites. Ancienne valeur exacte de cards/archive-surface non fournie, non inventée. | DSF §2 ; DSF Cartes ; chapitres 06/07/12 |
| F-05 | Corrigé | Icônes neutres #595E66 ; anciennes occurrences #5C636E identifiées comme historiques. | Chapitre 06 ; matrice Cartes ; registre historique qualifié |
| F-06 | Corrigé | Roboto Condensed Medium/SemiBold/Bold ; rôles 100/158/30/24/16/17/12, exceptions 16/22. Auto Roboto reste propre au rôle. | Chapitre 12, Typographie |
| F-07 | Corrigé | cards/border #CCD1E0 et dimensions 95/77/70/440/378/822 avec distinction des Safe Areas réelles et ancienne référence 92. | Chapitre 12 ; DSF §2 |
| F-08 | Corrigé | Tableau contextualisé 62/40/50/72/75/82/20/45 %, couleurs et masquage à 0 % conservé. | DSF §2, Opacités |
| F-09 | Correction déclarée, persistance non certifiée | Propriétaire : 24 repères corrigés sur deux pages. Lecture accessible : remplissage encore à 100 % sur les 8 instances citées (24 marques), dont nœuds à 0 % pour les variantes masquées. Ne pas confondre opacité de nœud et remplissage. Aucun correctif Figma réalisé ici. | DSF §5 A01 ; preuve ci-dessous |
| F-10 | Corrigé | cardTitle 16 : 19 Auto / 20 si style explicite ; aucune décision de taille rouverte. | Chapitre 12, Typographie |
| F-11 | Corrigé | A02 clos par décision propriétaire, reprise manuelle future ; aucune contradiction imputée aux §1/§5. | DSF §5 |
| F-12 | Corrigé | Index et README relient mise à jour, provenance SVG, audit original et résolution. | INDEX ; README |
| F-13 | Corrigé | N circuits localisé sur 4893:6675 ; distinction Circuit/Tours préservée. | DSF §4 |
| F-14 | Archivé, identité d’une version non certifiée | Plan révision 2, brief reçu v2.1, audit de seconde passe archivés avec SHA-256. Brief reçu 38e4487… différent de copie 5e90753… citée par Claude, inaccessible. Audit du 06/10 archivé inchangé. | Archives Cadence ; rapports |
| F-15 | Corrigé | Couleurs SVG fidèles conservées ; teinte par tokens explicitement prévue au futur branchement runtime. | DSF §6 |

## Contrôles et limites

- Audit de Claude archivé octet pour octet : SHA-256 `f30e03951f3cf39208c894f15f6dcbfe01cb9139698aa8a6495cb998cd5d4071`. Le patch fourni concernait ce seul rapport ; il ne corrigeait pas les documents audités.
- Relecture ciblée de Figma, noms, IDs, variantes et Disclosure ; correspondance des composants reportée dans DSF §7. La lecture accessible ne confirme pas la nouvelle persistance de F-09 : 6452:10039, 6452:9958, 6452:10120, 6452:10201, 6464:18896, 6464:18926, 6464:19023, 6464:19053. Origine de la divergence (session, version, persistance) non établie. Aucun export PNG nouveau : les 136 exports conservés ne constituent pas une preuve de la correction F-09 annoncée ensuite.
- Ancres internes : 9 liens contrôlés, zéro ancre manquante ; fichiers relatifs contrôlés dans les documents actifs concernés et les deux nouveaux rapports. Contrôle structurel des 30 contrats à 21 rubriques, références croisées de captures et unicité des décisions. Ce contrôle ne remplace pas une relecture fonctionnelle : les changements métier de la consolidation précédente ne sont pas réécrits ici.
- Revue fonctionnelle ciblée : suppression de cadence via « Aucun », cadence commune hors tableau des séries variables, calcul des durées issu des spécifications, phrases issues de Phrase v1 ; aucun arbitrage rouvert. Vérification que le catalogue conserve les contraintes contextuelles antérieures et qualifie les sources historiques. Les volumes de migrations du journal ne sont pas présentés comme recomptés.
- Diff relu : portée documentaire et archives ; aucun changement applicatif. `git diff --check` sans erreur. Aucun test applicatif ni contrôle sur appareil pertinent pour cette correction documentaire.
- Workflows : audit/pilote V2 excluent `.github/orchestration/reports/**` sauf trois rapports de protocole nommés, aucun présent dans cette livraison. Les autres déclenchements push sont limités à d’autres branches/chemins ; aucune fermeture/fusion ni dispatch réalisé. Aucun workflow accessible sur cette branche avant publication. L’état interne d’une autre conversation ChatGPT n’est pas inspectable ; contrôle des opérations limité à cet environnement et aux exécutions GitHub accessibles.

## Livraison et prochaine action

Publication prévue sur la branche existante, sans force, avec vérification de sa tête attendue ; PR conservée ouverte en brouillon. Le commit exact de livraison contenant ce rapport est indiqué dans la PR et le bilan final (identifiable également par `git log -1 -- .github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_DOCUMENTAIRE.md`). Les opérations de création des blobs, du commit et de mise à jour de référence sont distinguées et vérifiées après publication.

Restes : confirmer dans la session Figma de référence la persistance des 24 repères annoncés ; obtenir la copie exacte du brief citée par Claude si une identité de version est requise. L’alignement du code demeure une mission ultérieure fondée sur le brief archivé et les spécifications. Interactions du prototype reprises ultérieurement par le propriétaire, sans contrôle requis ici. Aucune fusion sur main ou synchronisation du PC dans cette mission.

## Fichiers modifiés

- `.github/orchestration/reports/2026-10-06_AUDIT_COMPLETUDE_COHERENCE_DOCUMENTAIRE_CADENCE_DSF.md`
- `.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_DOCUMENTAIRE.md`
- `docs/DSF-CADENCE-2026-10-06.md`
- `docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md`
- `docs/INDEX.md`
- `docs/MATRICE-ECRANS-CARTES-2026-09-30.md`
- `docs/README.md`
- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md`
- `docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md`
- `docs/archives/cadence-2026-10-06/README.md`
- `docs/archives/cadence-2026-10-06/audit-dsf-seconde-passe-source.md`
- `docs/archives/cadence-2026-10-06/brief-alignement-code-v2.1-source.md`
- `docs/archives/cadence-2026-10-06/plan-documentaire-valide-source.md`
