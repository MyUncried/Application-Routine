# Rapport de conformité par axe — lots 1 à 5, après traitement de la revue du 16/10

- **Revue de référence :** [KODJO_revue_reserves_lots1-5_2026-10-16.md](KODJO_revue_reserves_lots1-5_2026-10-16.md). Avis : **PARTIELLEMENT CONFORME — livraisons conservables, clôture fonctionnelle non acquise.**
- **Statut de ce rapport :** auto-évaluation de Claude, avec ses preuves. **Aucun lot n'est déclaré clos ni certifié.** La validation reste à ChatGPT et à Hermann.
- **Périmètre examiné :** `docs/openspec-revision` de `13484159` (avant le lot 1) au commit de ce rapport. La base d'analyse `main` `6656fefc` est inchangée.

## Méthode

Chaque axe combine trois éléments :
- **contrôles rejoués** dans cette session sur les commits publiés, par les commandes indiquées ;
- **relecture ciblée** des passages concernés ;
- **limites** déclarées.

La revue notait que plusieurs résultats étaient « rapportés par Claude, non tous rejoués indépendamment ». Les commandes ci-dessous permettent à un tiers de les rejouer depuis le dépôt (`outils/` du change).

## Axe 1 — Décisions historiques (registre, ch. 07)

| Contrôle | Commande | Résultat |
|---|---|---|
| Restaurations du lot 1 à l'octet près, depuis `37e372cd^`, `7a89220f^` et `341f4d41` | `node outils/verifier-lot1-registre.mjs <racine> 6656fefc 4668e215` | 139 contrôles réussis, 0 échec |
| Nombre de décisions, doublons | `grep -c '^| D-[0-9]{3} |'`, puis `sort -u` | 367 décisions, 367 identifiants uniques |
| D-237, D-252, D-334, D-335 inchangées depuis le lot 1 | comparaison des lignes `4668e215` / HEAD | identiques |
| Lignes du ch. 07 modifiées après le lot 1 | `git diff --numstat 4668e215 HEAD -- ch07` | 11 lignes, toutes au lot 5 : D-040, D-041, D-144, D-156, D-208, D-232, D-242, D-246 (« référence active v12 » → ch. 08), D-222 et D-228 (statut, D-343/D-355), D-341 (validation du 12/10) |

**Relecture :** les 24 textes historiques de G1 sont présentés comme « restaurés pour traçabilité ; il ne remplace pas la prescription courante ». Aucun statut n'a été modifié au lot 1 hors G2.

**Réserve maintenue (revue, point 2) :** la prescription « Bip v2 » de D-237 et D-252 est une **anomalie non arbitrée** (arbitrages, thème 6). Le contenu de ces décisions n'a pas été modifié.

## Axe 2 — Règles actives

| Lot | Effet sur les règles | Preuve |
|---|---|---|
| 2 | Aucun texte de règle modifié : cibles de liens, ancres, ligne « source » du ch. 08, point 4 du README | diff mot à mot `4668e215..a8714b29`, relu : seules ces lignes changent hors URL |
| 3a, 3b | Aucun texte de règle modifié : restauration d'identifiants et de renvois par suppressions seules | `verifier-lot3-identifiants.mjs <racine> a8714b29 646d5651` : 163/163 ; `… 406fecf1 0524d3b7` : 155/155 (différence de Myers ; aucune insertion de texte autre que les identifiants) |
| 4 | Aucune règle : section de navigation dans INDEX.md | relecture |
| 5 | **42 corrections de règles**, chacune adossée à une décision explicite versionnée | `LOT-5-corrections.json`, rejoué sur les commits (ancien présent dans `9c24c705`, nouveau dans `e5e22cc4`, ancien absent ensuite) : 42/42 |
| Revue R1 | Aucune règle : 6 citations précisées (2 actives démontrées, 4 marquées `À CLARIFIER`) | [constats/REVUE-R1-analyse-D232-D246.md](constats/REVUE-R1-analyse-D232-D246.md) |

**Relecture des termes périmés** (PRODUCT.md, README, INDEX, ch. 01, ch. 05, ch. 07) : « trois modes », « 99 min 59 », « réservé aux agrégats », « appui court valide et ferme », « Rechercher une Séance », « référence active v12 », « DSF courant ». Il reste deux occurrences, toutes deux correctes :
- « trois modes » dans D-155, explicitement « Ancienne règle » et « Supersédée par D-204 » ;
- « Catalogue des parcours » au ch. 01, glossaire, qui le déclare « Ancien concept retiré ».

**Limite :** le contrôle porte sur les passages corrigés et sur ces termes. Il n'établit pas l'absence d'autres formulations périmées dans le reste du corpus, qui relèvent du lot 6.

## Axe 3 — Renvois et liens

| Contrôle | Résultat |
|---|---|
| Renvois D-nnn des chapitres 01 à 13 absents du registre | aucun (comparaison des identifiants cités avec le registre) |
| Renvois vers D-232 et D-246 réintroduits au lot 3b | 6 occurrences traitées une par une (revue, point 1) : 2 actives démontrées (bornes conservées), 4 `À CLARIFIER` |
| Liens Markdown de `docs/` (`outils/links.mjs`) | 2 anomalies, contre 194 au départ : deux chemins cités en texte brut dans des documents historiques, conservés |
| Permaliens vers l'état d'origine `3623466a` | 11/11 en HTTP 200 (relevé du lot 2) |

## Axe 4 — Documents transverses

- **INDEX.md :** la section « Autorité documentaire » se présente comme une aide à la navigation (revue, point 3). Elle ne tranche ni Q-A (rang ch. 08 / ch. 13 ; borne D-255) ni Q-B (DSF face à D-339 et D-341), qui y sont listées comme non arbitrées.
- **README :** le point 4 des « Références actives » reprend le statut que DSF-CADENCE et MATRICE-CADENCE-FIGMA déclarent dans leurs propres en-têtes.
- **PRODUCT.md :**
  - la gouvernance documentaire (§13, ordre de référence) n'est **pas modifiée**, car liée à Q-A ;
  - les passages corrigés au lot 5 concernent les deux modes, la borne, l'appui court, le catalogue et le hors-MVP.

## Axe 5 — Concurrence et périmètre Git

| Contrôle | Résultat |
|---|---|
| PR #363, #370, #371 | ouvertes, têtes inchangées (`d2386c8d`, `6cf3634a`, `2c050d0e`) |
| Fusions simulées (`git merge-tree`) avec chacune, au commit de ce rapport | 0 conflit |
| Fichiers modifiés depuis la base hors `docs/`, `openspec/`, `.claude/`, `CLAUDE.md` | aucun |
| Renommages ou suppressions dans `docs/` | aucun (noms Unicode inchangés) |
| `docs/preparation`, `docs/archives`, `docs/sources` | non modifiés |
| Clones PRE-4, PRE-5, VNext | non modifiés par ce chantier ; lectures seules du clone PRE-4 |
| `main` | inchangé (`6656fefc`), aucun merge |

## Ce qui n'est pas acquis

- **Questions produit ouvertes**, regroupées par thème dans [arbitrages.md](arbitrages.md) : Q-A, Q-B, Q-D, Q-F, Q-H (b), Q-I, Q-J, Q-K, portée des décisions PRE-4 (dont Q31 sur D-335), anomalies de prescription (D-237, D-252), statuts de D-032, D-077, D-092, D-251 et D-228 (Étiquette).
- **Points documentaires `À CLARIFIER` :** 4 renvois (R1) et H-11.
- **Signalement à la PR #371** (X-06, X-07) : texte prêt, non publié.
- **Lot 6** (dont les 214 lignes « à examiner » du lot 3) : non lancé.
