# Finalisation du lot 6 — rapport final de conformité (17–18/10/2026)

- **Départ :** `e8afc61b`, fin de l'exécution du lot 6. La revue ChatGPT l'a jugé PARTIELLEMENT CONFORME.
- **Base de la restructuration :** `cefc9b99`.
- **Branche :** `docs/openspec-revision`, sans merge vers `main` (`6656fefc`, inchangé).
- **Statut :** soumis à la revue indépendante finale. **Rien n'est déclaré clos.**
- **Méthode :** corrections appliquées sur l'**état actuel**, sans reconstruction depuis une ancienne base :
  - proposées en JSON par des examens en lecture seule ;
  - relues avant application, avec les rejets consignés ;
  - appliquées par `outils/appliquer-finalisation.mjs` ;
  - contrôlées lot par lot par `outils/controler-finalisation.sh` (rejeu exact, C1 à C7, documents hors chapitres, C10, liens, K1, K2, OpenSpec) ;
  - suivies d'une seconde passe de vérification par des agents distincts de ceux qui ont corrigé.

## 1. Commits

| Commit | Lot | Contenu |
|---|---|---|
| `753f4dd2` | F1 | Outillage de finalisation ; introductions des ch. 08 et 10 (D-402) ; correctifs de report des PR |
| `aa8aaa15` | F2 | Identifiants R-06, copies, rédaction, DSF |
| `424e93ae` | F2b | Transfert DSF Bip complété (règle rétablie au ch. 06) ; contrôle hors chapitres |
| `3bfc5d14` | F3 | Divergences alignées sur des décisions explicites |
| `16fc6efe` | F4 | Alias documentaires et renvois obsolètes |
| `372aa7f1` | F5 | Traçabilité : « Règles applicables » et Matrice de traçabilité |
| `82841dfd` | F6 | Réserves de la vérification fonctionnelle |
| `4592ae85` | F7 | Règles remplacées encore présentées comme actives |
| `114c3b5b` | F8 | Réserves des vérifications de structure et fonctionnelle (2e passe) |
| `9d018def` | — | Rapport, dossier d'arbitrage, dépendances Git, `tasks.md`, bilan |
| commit de la passe résiduelle | F9 | Passe résiduelle (§7) : résidus, références de position, introduction du ch. 08, rattachements réexaminés, report manuel des PR, matrice |

Corrections appliquées : 629 (578 jusqu'à F8, 51 en F9), réparties en 22 fichiers `constats/FIN-*` (version appliquée : `*-applique.json`). Corrections écartées : `lot6/finalisation/ecarts/`. Les rejets à la relecture y sont distingués des corrections devenues sans objet.

## 2. État de traitement des ensembles demandés

**214 lignes R-06.** Toutes examinées (`R06-examen-ch10.tsv`, `R06-examen-autres.tsv`).

| Statut | Lignes | Traitement |
|---|---|---|
| Déjà restaurées | 108 | 42 titres RM-FMT, D-357 à D-369, renvois FMT et autres (lots 1 et 3) |
| Restaurées ici | 10 | Prouvées par `7a89220f^` : incise RM-FMT de RM-071, renvois D-nnn, listes FMT des invariants CE-FMT, liens de matrices |
| Retirées | 63 | Retraits annoncés par la PR #360 (§21 Traçabilité, audit historique) ou phrases « Source : spécification Formats », dont la source est citée une fois au ch. 08 |
| Reformulées volontairement | 32 | Preuve citée pour chacune |
| Incertaine | 1 | AD-02 |

**12 copies partielles.** Le plan en annonçait 11 ; la table en compte 12, en incluant la copie d'autorité. Toutes ont été examinées : 9 diffèrent réellement (portée, lignes propres, autorité), 3 sont incertaines (AD-03). Aucune n'a été retirée.

**158 occurrences de lignes « à vérifier ».**

| Statut | Occurrences | Traitement |
|---|---|---|
| Équivalentes | 66 | Remplacées par un renvoi (61 corrections) |
| Différentes | 48 | Conservées : portée, autorité ou référence locale |
| Lignes de tableau | 16 | Conservées |
| Déjà retirées au lot 6 | 22 | — |
| Incertaines | 6 | AD-03 |

**204 paires divergentes.** Toutes examinées et qualifiées (`divergences-examen-*.tsv`, état dans `divergences-etat.tsv`).

| État | Paires |
|---|---|
| Résolue par une décision explicite (88 alignements) | 125 |
| Sans action : complément | 10 |
| Sans action : périmètre | 5 |
| Sans action : historique | 3 |
| Sans action : faux positif | 6 |
| Sans action : déjà résolue | 7 |
| Arbitrage (AR-01 à AR-15) | 41 |
| Correction rejetée à la relecture, passée en arbitrage (AR-02, AR-07, AR-19, AR-20) | 7 |

## 3. Conformité par axe

| Axe de la demande | Réalisation | Preuve | Reste |
|---|---|---|---|
| **A. Identifiants et références** | R-06 traitée (§2) ; 95 alias et renvois rompus remplacés par un lien vers la section actuelle ; 24 conservés (passages historiques, permaliens) | `alias-examen.tsv` ; contrôles F2, F4 | 22 alias incertains réexaminés en F9 : maintenus (AD-01) |
| **B. Duplications** | Remplacement seulement en cas d'équivalence complète ; différences de contenu, de portée et d'autorité conservées | `copies-examen.tsv` ; C3 informatif ; C5 = 0 | AD-03, AD-06, AD-07 |
| **C. Cohérence et contradictions** | 204 paires qualifiées ; registre et décisions PRE-4 consultés avant toute question ; 88 + 20 + 16 + 1 alignements sur une décision explicite ; seules les vraies décisions produit sont regroupées | `divergences-etat.tsv` ; [arbitrages-lot6.md](../arbitrages-lot6.md) | AR-01 à AR-26 |
| **D. Traçabilité** | Ligne « Règles applicables » dans la rubrique 1 des 40 contrats, texte des contrats inchangé. Elle est fondée sur les références écrites et sur 325 rattachements CERTAIN (272, puis 53 confirmés en F9) : même condition et même résultat, extraits vérifiés mot pour mot. Annexe générée « Matrice de traçabilité ». Index et annexes contrôlés | `tracabilite-contrats-*.tsv` ; contrôle F5 ; liens | Besoins : 5 sur 91 seulement citent un identifiant ; aucune liaison besoin → règle n'est déduite du sens. 146 PROBABLE réexaminés en F9 : 53 CERTAIN, 86 non retenus, 7 divergents (AR-22) |
| **E. Qualité rédactionnelle** | 216 corrections rédactionnelles : accords, espaces, pronom, méta-texte, termes, découpage en puces sans changement de mots. C10 : 0 correction qui change un nombre, une unité, un identifiant, un libellé, une négation ou une modalité. QUA-118 et QUA-119 annulées pour respecter K1 | `qualite-examen.tsv` ; C10 | 27 décisions produit (AR-25), 39 cas incertains (AD-08) ; aucune exigence ajoutée |
| **F. DSF et sources transverses** | 213 éléments de DSF examinés ; 3 transferts règle par règle, avec renvoi dans le DSF ; 25 maintenus, avec la raison. PRODUCT.md (5 alignements), INDEX.md (4e annexe), ch. 09, 11, 12 corrigés là où les corrections les concernaient. Introduction du ch. 08 harmonisée (D-402) | `dsf-examen.tsv` ; contrôle hors chapitres : 0 phrase perdue | AD-05 ; AR-24 |
| **PR concurrentes** | PR non modifiées ; correctifs repositionnés couvrant les 63 blocs : 52 reportés automatiquement, 7 par résolution déclarée, 4 sans objet (copies remplacées par un renvoi). `git apply --check` réussi sur l'état final, seul et en séquence | [dependances-git.md](pr/dependances-git.md) | Signalement de la PR #371 à coordonner (AD-10) |

## 4. Contrôle final indépendant (seconde passe)

| # | Vérification demandée | Résultat | Limite |
|---|---|---|---|
| 1 | Conservation des exigences, règles, décisions, identifiants | **De bout en bout depuis `cefc9b99`** (état F9) : les 782 identifiants d'origine sont tous définis une seule fois, plus D-402, justifié. Sur 7 015 lignes distinctes, 0 est absente (N1 6 455, N2 286, justifiées 274). Les 393 décisions gardent leur texte. **Depuis `e8afc61b`** : rejeu exact des 629 corrections, conservation vérifiée | Contrôle mécanique : il garantit le texte, pas le sens |
| 2 | Portée fonctionnelle et autorité | C5 (portée) = 0 ; C6 (marqueurs d'autorité) = 0 ; C7 (références) = 0. Vérification sémantique des 127 alignements fonctionnels par un agent distinct : 114 conformes, 13 réserves, 0 non-conforme ; les 13 réserves sont corrigées en F6 et F8 | Troisième passe (F9, `fonctionnel-3.tsv`) : les 30 corrections RV2, CPL, STR et INT conformes ; l'introduction du ch. 08 non conforme, corrigée (INT-101 à 103) |
| 3 | Résolution ou qualification de chaque défaut traité | §2 et §3 : chaque élément a un statut et une preuve dans son TSV | — |
| 4 | Aucune contradiction ancienne présentée comme active | Recherche indépendante sur 149 statuts « remplacée / supersédée / révisée » et sur les décisions D-200 à D-402, dont 44 vérifiées en détail : 22 cas actifs, dont 20 corrigés (F7) et 2 en arbitrage (AR-16, AR-17) ; statut de D-111 en AR-18 | Recherche par mots-clés : elle n'est **pas exhaustive** sur les 393 décisions |
| 5 | Cohérence des 13 chapitres et des documents transverses | Introductions des ch. 06, 10 et 13 et INDEX.md jugées cohérentes ; ch. 08 corrigée en F9. **Les 262 sections déplacées sont vérifiées** : 40 en F8 (37 conformes, 3 réserves), puis 222 en F9 (203 conformes, 16 réserves, 3 non conformes corrigées par STR-201 à 207) | Les réserves de placement sont en AD-11 |
| 6 | Traçabilité besoins → règles → contrats → recettes | Contrats → règles : 40 sur 40. Recettes → règles : citations écrites. Besoins → règles : 5 sur 91 | Les liaisons manquantes ne sont pas inventées |
| 7 | Références Markdown et chemins physiques | `links.mjs` : 0 fichier ni ancre manquant ; 2 mentions historiques connues (texte brut, pas des liens). Les 998 ancres de la matrice de correspondance sont valides | — |
| 8 | Noms de fichiers Unicode | 13 chapitres et 4 annexes sous leur nom exact (U+2013, U+2019) ; aucun renommage (K2) | — |
| 9 | Différences Git, absence de modifications collatérales | Les corrections ne touchent que `docs/` (chapitres, annexes, PRODUCT.md, INDEX.md, README.md, 3 DSF) et `openspec/` ; aucun fichier modifié hors corrections déclarées, hormis l'annexe générée. Code, `.github/`, Figma, `docs/preparation/` (copies PRE-4 et PRE-5) et autres clones : intacts | — |
| 10 | Validation stricte OpenSpec | Réussie à chaque lot | — |

**Ce qui n'est pas revendiqué :**
- une lecture exhaustive des 13 chapitres ;
- l'absence totale de contradiction ;
- l'exhaustivité de la recherche des contradictions actives (par mots-clés).

Les examens et vérifications ont été menés par des agents en lecture seule, sur des périmètres complets (214 lignes, 170 copies, 204 paires, 154 alias, 348 points de qualité, 213 éléments de DSF, 40 contrats, 146 rattachements, 262 sections déplacées) ou sur des échantillons, que le tableau signale comme tels.

## 5. Incidents traités pendant la finalisation

| Incident | Détection | Correction |
|---|---|---|
| DSF-001 écartée (ancrage modifié) alors que DSF-002 retirait la règle du DSF : la règle des steppers n'était plus nulle part | Relecture des écarts, avant publication | FIN-DSF-complement ; nouveau contrôle `verifier-hors-chapitres.mjs` |
| QUA-118 et QUA-119 modifiaient les rangs de design tokens lus par un test du code | K1 | Annulées (`annuler-corrections.mjs`) |
| Lignes « Règles applicables » insérées dans le tableau suivant, pour les rubriques 1 sans tableau | Contrôle de position | Annulées, puis régénérées dans la rubrique 1 |
| Justifications calculées sur des fragments de ligne | C2 | Justifications calculées par rejeu, sur les lignes entières |
| Fins de ligne mêlées (LF dans des fichiers CRLF) et « ancien » terminé par un `\r` isolé | Rejeu | Normalisation des fins de ligne ; rejeu sans retours chariot |
| `reporter-pr.mjs` appliquait les résolutions manuelles après le calcul du correctif : elles n'y figuraient pas | Lecture du correctif (F9) | Résolutions appliquées avant le calcul ; modes `avant` et `substituer` ; `apres` placé en fin de paragraphe ou de liste |
| RSD-002 à 004 retiraient avec les quasi-copies la ligne « Référence normative ciblée… du présent chapitre », dont la portée d'origine (ch. 09, 10, 11) aurait été perdue | Relecture (F9) | Ligne conservée, chapitre d'origine nommé (STR-203 à 205) |

## 6. Recommandation de clôture

- **Revue finale :** la documentation restructurée est prête pour la revue indépendante finale.
- **Fusion dans `main` :** je recommande de la conditionner à trois éléments :
  1. la revue finale ;
  2. la résolution des dépendances Git avec les PR #363, #370 et #371 ([dependances-git.md](pr/dependances-git.md)) ;
  3. la décision de Hermann.
- **Arbitrages :** AR-01 à AR-26 (AR-23 résolu) et AD-01 à AD-13 ne bloquent pas la fusion. Les passages en tension restent visibles et aucune contradiction n'est tranchée sans décision. Ils pourront être traités dans un change ultérieur.
- **Statut du chantier :** ne pas le déclarer clos avant la revue, et ne pas archiver le change.

## 7. Passe résiduelle F9 (18/10/2026, départ `9d018def`)

Traitement des points laissés ouverts par F1 à F8, sans nouvel audit ni réorganisation.

| Ensemble | Examen | Résultat | Fichier |
|---|---|---|---|
| Résidus : 22 alias, 39 cas de qualité, 9 copies, 1 ligne R-06, 5 éléments du ch. 06 | 76 éléments | 12 corrections appliquées (RSD-001 à 004, 009 à 016) ; RSD-005 à 008 écartées à la relecture (AD-08) ; 65 maintenus avec leur raison | `residus-examen.tsv` ; `constats/FIN-RESIDUS*` |
| Sections déplacées restantes | 222 sur 222 | 203 conformes, 16 réserves (AD-11, ou identifiants manquants dans la matrice, complétés), 3 non conformes corrigées | `verification/structure-2a.tsv`, `structure-2b.tsv` ; `constats/FIN-STRUCTURE-2*` |
| Troisième passe sur les dernières corrections | 30 corrections et introduction du ch. 08 | 30 conformes ; introduction corrigée (INT-101 à 103) ; réserves en AD-13 | `verification/fonctionnel-3.tsv` ; `constats/FIN-INTRO-2*` |
| Rattachements PROBABLE | 146 sur 146 | 53 CERTAIN (ajoutés aux contrats), 86 NON-RETENU, 7 DIVERGENT (AR-22) | `tracabilite-probables-reexamen.tsv` ; `constats/FIN-TRACE-2*` |
| Blocs de PR à reporter à la main | 11 sur 11 | 7 reportés par résolution déclarée, 4 sans objet | `pr/resolutions-manuelles-*.json` |
| Matrice de correspondance | 998 lignes | Colonne `finalisation` complétée (487 → 602 identifiants, dont ACT, RES, RSD, STR, INT et TRA2) ; index des titres régénéré | `correspondance-actualisee.tsv` ; `titres-actuels.tsv` |

**Références de position (STR-201 à 207).** Une section déplacée garde « ce document » ou « présent chapitre », qui visait son chapitre d'origine. La référence est rétablie sur ce chapitre : ch. 05 « Évolutivité » (venue du ch. 08), et quatre lignes « Référence normative ciblée » du ch. 06 (venues des ch. 03, 09, 10 et 11). Les ch. 09 et 11 renvoient de plus, sans recopie, vers les contrats `silhouette` du Profil.

**Contrôles F9** : `controles/RESIDUEL.txt` (depuis `9d018def`), `FINAL-depuis-e8afc61b.txt` (629 corrections rejouées) et `BOUT-EN-BOUT.txt` (depuis `cefc9b99`) : rejeu, conservation, rédaction, liens, K1, K2 et OpenSpec réussis.
