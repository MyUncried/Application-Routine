# Rapport de corrections — arbitrages de Hermann du 16/10/2026

- **Départ :** `cc690a3c` (publié).
- **Commits :**
  - `e8d98309` : registre D-376 à D-387 et alignements, 87 corrections ;
  - `948665ef` : décisions PRE-4 rendues générales par D-385, 23 corrections ;
  - le commit de ce rapport.
- **Branche :** `docs/openspec-revision`, sans merge vers `main`.
- **Statut :** livraison soumise à revue indépendante. Rien n'est déclaré clos ni certifié.

## Méthode

1. **Préparation.** Quatre dossiers en lecture seule (AR1 à AR4, dans le scratchpad de session), chacun avec ses recherches dans tout le corpus, ses variantes et ses exclusions des lignes modifiées par les PR #363, #370 et #371.
2. **Revue par Claude de chaque correction**, avec comparaison au texte exact de la décision source. Ajustements apportés aux propositions :
   - AR2-12/13 : D-100 et D-131 sont « précisées », non « remplacées », car D-382 confirme l'arbitrage Circuits du 12/10.
   - AR2-16 : information conservée.
   - AR3-06/07 : lignes de D-237 et D-252 reconstruites depuis `37e372cd^`, portée d'origine comprise.
   - AR4-06 : retrait de « de même que la fermeture de la feuille », absent de Q29.
   - AR4-20 : phrase Q13 retirée, car Q13 relève de la PR #371.
3. **Application** par `outils/appliquer-lot5.mjs` : chaque « ancien » est unique au moment de son application, sinon arrêt.
4. **Seconde passe indépendante** par `outils/verifier-corrections-json.mjs` : rejeu en mémoire sur les fichiers du commit de départ, puis comparaison au disque.
5. **Contre-vérification** par recherches de variantes dans tout le corpus, puis contrôle des liens et des fusions simulées.

## Registre (ch. 07)

- **Section ajoutée :** « Arbitrages de Hermann du 16 octobre 2026 », avec l'ancre `arbitrages-20261016` et 12 décisions, D-376 à D-387.
- **Numérotation :** elle commence à D-376, car D-370 à D-375 sont employés par la PR #370. La section est placée avant les décisions du 14/10 pour éviter un conflit avec cette PR, qui complète la fin du registre (fusion simulée : 0 conflit).
- **Historique :** les textes des décisions anciennes ne sont pas réécrits. Les statuts reçoivent une mention de remplacement ou de précision, sauf pour D-237 et D-252, que D-386 demande de rétablir.

## Décision par décision

| Décision | Corrections | Fichiers | Preuves et sources | Réserves |
|---|---|---|---|---|
| **D-376** (Q-A) : aucune priorité automatique 08/13 | 6 | PRODUCT.md §13, ch. 13 §2 (phrase de neutralisation sans renumérotation), ch. 08 §3.10 (`À CLARIFIER`), INDEX.md | texte de Hermann | Borne « jusqu’à D-255 » non tranchée. Contradiction ch. 08 §3.10 / CE-T03-08 §15 marquée `À CLARIFIER`. |
| **D-377** (Q-B) : D-339 maintenue, présentation D-341 remplacée | 10 | ch. 07 (statuts D-339, D-341), ch. 13 (l. ~4093, tableau CE-UI-10 « Popover » pour Changement de côté, exceptions typographiques historiques), ch. 12 (3 jetons), DSF-SERIES-VARIABLES, INDEX | DSF Circuits 12/10 (popovers), ch. 13 « supersèdent cette présentation » | Couleur `color.selectionSubtitle`, règle de contour « roulette/segmenté » (ch. 08, RM-131), segmenté « Mode d’exécution » (ch. 13 l. 117), « pour la prochaine tranche » : indéterminés |
| **D-378** (Q-D) : formats, départs rapides, cadence à l'Exécution au MVP | 9 | ch. 01, 03, 05, 06, 08, PRODUCT.md (nouvelle sous-section « Formats et départs rapides ») | texte de Hermann ; D-369 (moteur non développé) conservée | Aucune tranche créée. Les titres « cible » (état de réalisation) sont conservés. |
| **D-379** (Q-F) : `Partielle` | 4 | ch. 03, ch. 08 (2 tableaux de statuts), ch. 10 RM-057 | D-053, D-150 | Action « ignorer un exercice » (ch. 03) : indéterminée |
| **D-380** (Q-H) : pas d'enregistrement si cible obligatoire manquante | 4 | ch. 01, ch. 08, ch. 10 RM-017, ch. 13 CE-T03-08 | — | Comportement de `Continuer` et signalisation de l'Exercice fautif non prescrits |
| **D-381** (Q-I) : Death by incomplet, chantier Suivi | 3 | ch. 10 RM-081, ch. 13 (CE-UI-08, CE-FMT-06) | D-365 | Aucun libellé fixé (report explicite) |
| **D-382** (Q-J) : total sous le titre du Circuit = ce Circuit | 9 | ch. 07 (statuts D-100, D-131 : « précisée »), ch. 01, 04, 05, 08, 09, 12 | **Décision antérieure retrouvée** : arbitrage Circuits du 12/10, §5.2 « Un circuit est un agrégat » de la spécification supprimée `7a89220f^:…/SPECIFICATION-CIRCUITS-TOURS-SERIES-2026-10-12.md`, transcrit au ch. 10 « Extension normative du12/10 — niveau Circuit ». **Contradiction résiduelle expliquée** : D-100 et D-131 ont été rédigées avant les Exercices hors Circuit et lisaient « Séance ». | Le **nombre** « N exercice(s) » affiché avec le total : D-382 ne vise que le total (indéterminé) |
| **D-383** (Q-K1) : valeur héritée hors bornes | 6 (+1 via D-385) | ch. 08, 09, 10 RM-234, 11 API-PARAM-01, 13 (CE-UI-10, règles communes) | texte de Hermann (portée générale) | Paragraphes « Bornes confirmées » du ch. 13 et du DSF Deux modes : lignes de la PR #371, compatibles, non touchées |
| **D-384** (Q-K2) : « — » dans la ligne Total | 3 | ch. 06, ch. 08, ch. 13 (feuille Paramètres) | ch. 06 et ch. 08 prescrivaient déjà « — » en régime variable : généralisation | Le renvoi `À CLARIFIER` du ch. 13 sur « la ligne Total reste présente » n'est pas couvert (N=1, présence générale) |
| **D-385** (Q-L) : décisions PRE-4 générales | 23 | ch. 06, 07 (D-219, D-335), 08, 09, 10, 12, 13, DSF-CIRCUITS, DSF-PHRASES-V15, PRODUCT | Fichier de décisions PRE-4 committé dans le clone PRE-4 (`8133e4bb`, non publié), lu en lecture seule ; Q8, Q14, Q19, Q20, Q23, Q25–Q31 | Q11–Q18 laissées à la PR #371. Isolés : Q32 (contredit D-091), Q30 « aucun total d'Exercice » (contre D-384), P41 (totaux exacts des cartes), Android pour Q27, forme du signalement de Q19 |
| **D-386** : D-237 rétablie, D-312 prévaut sur D-252 | 3 | ch. 07 (lignes complètes D-237 et D-252, historique du 07/10 conservé), ch. 13 CE-UI-07 (« pas des pauses selon D-312 ») | `37e372cd^` (texte, statut, portée d'origine) | Les 22 autres décisions portant la mention du 07/10 (Cadence) ne sont pas touchées |
| **D-387** : terminologie Circuit/Tour | 23 | ch. 07 (statuts D-032, D-077), ch. 01, 02 §8, 04, 05 (dont V2), 06, 08, 10, 12 | D-209 | Nom technique `Tour` non renommé (ch. 09, 11, 12). **Besoin futur du ch. 02 §8** (« bilatéralité d’un Circuit ») : terme corrigé, fond contraire à D-209 non tranché. D-012, D-048 et D-058 non nommées par D-387. |
| **P-03** : segment Exercices au MVP à partir de T03 | 1 | ch. 12 (tableau des segments) | D-166, D-183, RM-109 | — |
| **Statuts** D-092, D-251, D-228 | 3 | ch. 07 | D-232 « Bornes conservées » et RM-234 ; D-337 ; D-355 face à D-228 « Sélection simple des référentiels : fermeture au toucher » | — |
| **Transverses** | 3 | README (40 contrats, 20 rubriques ; chapitres 01–13), PRODUCT (DSF-CADENCE actualisé par DSF-DEUX-MODES) | ch. 13 §1 ; `grep -c '^## CE-'` = 40 | Alias v13, Bip v2, Phrase v1 et « Références courantes » : lot 6 ; inventaire du ch. 13 (31 lignes pour 40 contrats) : lot 6 |

## Contrôles

| Contrôle | Résultat |
|---|---|
| Rejeu indépendant des 87 corrections sur `cc690a3c` | identique au disque, hormis la section du registre insérée à la main (19 lignes, attendues) |
| Rejeu indépendant des 23 corrections PRE-4 sur `e8d98309` | identique au disque |
| Fichiers modifiés hors JSON | aucun |
| Registre | 379 décisions (367 + 12), identifiants uniques |
| Liens Markdown (`links.mjs`) | 2 anomalies, inchangé (mentions historiques en texte brut) |
| Fins de ligne | homogènes dans tous les fichiers modifiés |
| Noms de fichiers Unicode | aucun renommage ni suppression |
| Recherche de variantes contraires (statut `Partielle`, séance incomplète enregistrable, stepper des répétitions, formats ou cadence hors MVP, Tour conteneur, segment Exercices désactivé, D-341 courante, durée de Séance sous le Circuit) | aucun résidu contraire, hors cas isolés listés ; les occurrences restantes de « Tour » sont des répétitions du Circuit (« à chaque Tour ») |
| Fusions simulées avec #363, #370 et #371 | 0 conflit |
| Périmètre | rien hors `docs/` et `openspec/` ; `docs/preparation`, `archives`, `sources` intacts ; clones PRE-4, PRE-5, VNext non modifiés |

## Points réellement indéterminés

Ils sont regroupés dans [arbitrages.md](arbitrages.md), section « Après les arbitrages du 16/10 ».
