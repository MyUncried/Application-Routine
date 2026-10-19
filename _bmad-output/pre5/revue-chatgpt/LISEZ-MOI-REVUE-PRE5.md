# PRE-5 BMAD : dossier de revue indépendante (ChatGPT)

Préparé le 19/10/2026 dans le clone `C:\Dev\KODJO-BMAD-PRE5`, sur la branche `bmad/pre5-depuis-pre4`. Le commit du dossier est indiqué dans le message de transmission. La branche n'est pas publiée sur GitHub : les commits sont locaux.

**Statut.** La préparation est terminée et rien n'est implémenté : aucune modification de `src/`, d'`app/` ni des tests. Le développement ne commencera qu'après le retour de cette revue, la correction des écarts retenus et l'autorisation explicite de Hermann.

## 1. Ce qui est demandé à la revue

La préparation a suivi le cadrage de Hermann du 18/10 et sa méthode : une table de delta avant les stories, puis un PRD ciblé, une architecture des seuls changements, des stories proportionnées et la planification. La revue est attendue sur les points suivants.

1. **Correspondance.** Construire la table entre les sources produit (§3) et les documents BMad (§2). Pour chaque exigence, vérifier que le détail est couvert, et pas seulement mentionné.
2. **Interprétation.** Vérifier l'interprétation des décisions, en particulier celles du 19/10 (§4).
3. **Exclusions.** Vérifier qu'aucun élément exclu n'est réintroduit, et qu'aucun élément du périmètre n'est oublié.
4. **Remplacements.** Signaler tout changement d'un comportement PRE-4 validé qui n'est pas couvert par un remplacement R-xx accepté ou par une décision.
5. **Ambiguïtés restantes.** Les signaler, sans les trancher.

## 2. Documents BMad (contenu de l'archive)

| Document | Chemin dans l'archive | Rôle |
|---|---|---|
| Table de delta | `pre5/table-delta.md` | 50 lignes Δ (besoin, source, existant, modification, conservé, validation). Remplacements R-xx. Questions QP5. §6 : toutes les décisions du 19/10, qui priment sur les recommandations de la §3. |
| Inventaires | `pre5/inventaire-sources.md`, `pre5/inventaire-code.md` | Sources avec leurs révisions ; code de départ (PRE-4 livré). |
| Propagation de D-430 | `pre5/propagation-borne-1s.md`, `revue-chatgpt/D-430-propagation-docs.patch` | Minimum de 1 s : modifications de `docs/` (commit local `de7a5491`, absent de GitHub) et points de code concernés. |
| PRD | `pre5/planning-artifacts/prds/prd-kodjo-pre5-2026-10-19/prd.md`, avec `addendum.md`, `.memlog.md`, `reconcile-*.md` et `review-*.md` | 45 FR et 10 NFR ; lignes NR (§6) ; remplacements R-01 à R-17 (§7) ; exclusions (§8) ; points signalés, tous tranchés (§9). |
| Architecture | `pre5/planning-artifacts/architecture/architecture-kodjo-pre5-2026-10-19/ARCHITECTURE-SPINE.md`, avec `.memlog.md` et `reviews/` | AD-18 à AD-33 (AD-1 à AD-17 héritées de PRE-4). Six écarts avec le spine PRE-4, chacun justifié par une décision. |
| Epics et stories | `pre5/planning-artifacts/epics.md` | 3 epics et 12 stories ; carte de couverture FR → story ; NFR ; UX-DR1 à UX-DR10 (relevés Figma). |
| Planification | `pre5/implementation-artifacts/sprint-status.yaml` | Porte de préparation : CONCERNS (voir §5). |

Le spine d'architecture PRE-4, que PRE-5 reprend, est sur `main` : `_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md`.

## 3. Sources utilisées et révisions

- **Dépôt `MyUncried/Application-Routine`, `main` = `5e14a65e`.** Il est vérifié inchangé le 19/10 après `git fetch`. C'est PRE-4 livré (merge `1116586b`, PR #372), avec la documentation v3 intégrée.
  - Chapitres `docs/Specifications-fonctionnelles/04` à `13` et `docs/PRODUCT.md`. Les lignes et révisions exactes figurent dans `pre5/inventaire-sources.md`, §1.
  - Spécification de la charge v3.0 du 18/10 : `openspec/changes/archive/2026-10-18-integration-parametres-execution-v3/source/KODJO_Charge_Specification_2026-10-18.md`.
  - La documentation de `main` est complétée par le patch local de D-430 (§2).
- **Sources transmises par Hermann, copiées dans `pre5/sources-2026-10-19/` :**
  - `KODJO_PRE5_Cadrage_et_lancement_2026-10-18.md` : le cadrage ;
  - `KODJO-Phases-specification-consolidee-2026-10-15.md` : consolidation du 16/10, §1 à 5 ;
  - `KODJO_Registre_Modifications_Creation-activite_2026-10-10_v25.md` : demande 10 (modèle A), demandes 17 et 21 ;
  - `Matrice des règles de compatibilité des paramètres d'exécution.md` : analyse du 19/10. Elle ne prime pas sur les décisions ;
  - `KODJO_Audit_PRE4_BMAD_2026-10-18.md` : audit PRE-4, actions de méthode ;
  - `KODJO_PRE5_Reponses_QP5-01_a_QP5-09_et_consigne_BMAD_2026-10-19.md`, puis `PRE5_BMAD_Decisions_v2.md` : réponses aux QP5, la version 2 remplaçant la première.
- **Figma, fichier `G6RY5Ebhgwb4AHIOYDwwvg` (Prototype MVP).** Il n'a été ni relu ni modifié pendant cette préparation.
  - Frames citées : `8328:38193` (Enchainement, encore en notation D/G), `9207:18817` (phases), `9292:18077` (clavier) et la série `8328:*` des paramètres. La liste complète figure dans `pre5/inventaire-sources.md`, §4.
  - Les propriétés visuelles seront relevées en lecture seule, story par story (UX-DR1 à UX-DR10). Aucune règle n'est déduite de valeurs illustratives.

## 4. Décisions de Hermann prises pendant la préparation (19/10)

Toutes sont reportées dans `pre5/table-delta.md`, §6, avec leurs effets.

- **QP5-01 à QP5-09 :** toutes décidées.
  - QP5-01 : pas de reprise des anciennes descriptions.
  - QP5-06 : le `SegmentedControl` existant est réutilisé.
  - QP5-07 : libellés « Un côté après l'autre » et « Les deux côtés à chaque série », en police réduite.
  - QP5-09 : parenthèse des phases, selon le §4.1 de la spécification des phases.
- **Charge :** elle s'applique en mode Répétitions comme en mode Durée.
- **Clavier numérique :** Précédent, Suivant et Fermer, avec un fond qui signale la cellule active.
- **D-430 :** minimum de 1 s pour toute durée strictement positive, pas de 1 s ; somme des phases entre 1 et 3 535 s.
- **Passage des phases de Avec à Sans :** la somme devient la durée de la série, sans mémoire des anciennes phases.
- **Points 1 à 11 signalés par le PRD**, dont l'ordre phases puis charge dans la Phrase et la Description en texte 14, sans cadre.
- **QN-1 à QN-4 de l'architecture :**
  - QN-1 : limite de 1 000 caractères sur la chaîne encodée ;
  - QN-2 : cellules vides non comptées ;
  - QN-3 : « Phase n » stocké en clair ;
  - QN-4 : comportement existant des côtés conservé.
- **QN-5 :** close par D-414.

## 5. Points réellement non résolus

Aucune question produit n'est ouverte. Restent des réserves de réalisation, déjà inscrites dans les stories :

1. **Écarts visuels E-V1 à E-V16 hérités de PRE-4 (Q48), story 3.2.** Ils seront arbitrés par Hermann un par un, quand un écart touche un jeton, un composant ou la grille D-327.
2. **Relevés Figma S-2 (UX-DR1 à UX-DR10).** Ils se font pendant les stories. Aucune frame relevée ne montre le contrôle d'ajout d'une phase (`9207:18817`) : un défaut est retenu (QP5-04 b).
3. **Essais sur iPhone qui conditionnent la suite :**
   - le champ clavier de la charge (story 2.2, NFR-6) conditionne les stories 2.7 et 2.8. Le comportement d'un `InputAccessoryView` dans la `Modal` de la Feuille reste à constater ;
   - la cible tactile des lignes de 36 conditionne la story 2.6.
4. **Formats de Séance, hors périmètre de PRE-5,** relevés pour plus tard dans `pre5/propagation-borne-1s.md` :
   - adaptation proportionnelle sous 1 s ;
   - durée imposée inférieure au nombre de phases ;
   - dernière phase calculée à 0 s.
5. **Retour arrière vers un build PRE-4 non pris en charge.** Le format v3 (AD-18) est refusé explicitement par un build PRE-4, sans perte silencieuse.

## 6. Hors périmètre (rappel)

- Moteur d'exécution, cadran et audio.
- Formats de Séance, durée imposée et adaptation proportionnelle.
- Refonte de Composition, des médias et des référentiels.
- Migration des anciennes descriptions.
- Refonte du `SegmentedControl`.
- Aucun troisième Mode, aucune condition Mixte persistée.
