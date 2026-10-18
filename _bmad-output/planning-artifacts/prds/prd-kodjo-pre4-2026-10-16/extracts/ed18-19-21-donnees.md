# Extrait PRE-4 — Données : ED-18, ED-19, ED-21, et transport vers la Séance (ED-15)

Établi le 2026-10-16, en lecture seule, pour la rédaction du PRD BMad de PRE-4. Ce document **extrait** des règles ; il n'en invente aucune. Toute règle non sourcée est marquée « manque ».

## 0. Conventions

**Abréviations de chemin**

- `chNN` = `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/Specifications-fonctionnelles/NN – ….md` (copies consolidées de `caa2a5cf`, normatives).
- `DSF-2M` = `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/DSF-DEUX-MODES-ECHEC-2026-10-13.md`.
- `MAT-2M` = `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/MATRICE-DEUX-MODES-ECHEC-2026-10-13.md`.
- `SPEC-2M(base)` = `docs/Specifications-fonctionnelles/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md` à `c32e360d` : traçabilité seulement (identifiants EC-xx, Δ8). Son §2 et son §7 sont **identiques mot pour mot** à ch09 l. 1238-1262 (vérifié).
- `PERIM` = `docs/preparation/PRE-4/perimetre-et-couverture.md`. `PRE3` = `docs/preparation/PRE-4/../PRE-3/perimetre-et-couverture.md`.

**Statuts**

- **N** : normatif, à `caa2a5cf`.
- **N+B** : normatif, complété par la base pour la traçabilité (EC-xx).
- **CAD** : exigence du cadrage `PERIM` seulement, sans règle détaillée dans les spécifications.
- **HP** : hors périmètre PRE-4 (moteur, relevés, Composition) ; seule la contrainte de non-régression ou d'interface future est retenue.
- **ARB** : à arbitrer, voir §6.

**Non lu, conformément à la consigne :** ch13 l. 4346-5996 (Q7), `docs/preparation/PRE-4/planification/`, `.github/orchestration/reports/`, tout plan, contrat ou revue VNext.

---

## 1. ED-18 — Persistance et migration

Cadrage : `PERIM:212` « Ancien mode Échec→Répétitions+toutes cibles Échec ; tous paramètres conservés ; transaction/rollback et SQLite réelle ; invalide jamais converti en Échec ».

### 1.1 Modèle de la cible typée (persistée)

| ID | Règle atomique testable | Source | Statut |
|---|---|---|---|
| R18-01 | Le mode d'exécution appartient à l'Exercice et ne prend que deux valeurs : Durée (`DURATION`) ou Répétitions (`REPETITIONS`). Aucun troisième mode n'est persisté pour une donnée nouvelle ou migrée. | ch09:607 ; ch10:61 (RM-033) ; ch12:1359 ; ch09:1238 | N |
| R18-02 | Chaque Série effective porte une cible typée, de l'un des deux types : **chiffrée** (secondes en Durée, entier de répétitions en Répétitions) ou **À l'échec** (aucune valeur numérique prescrite). | ch09:1240-1243 ; ch09:607 ; ch04:344 ; EC-02 SPEC-2M(base):16 | N+B |
| R18-03 | Une cible **incomplète ou invalide** est un état d'erreur de saisie distinct des deux types. Elle n'est jamais convertie implicitement en À l'échec, ni à la saisie, ni à la sauvegarde, ni à la migration. | ch09:1244 ; ch09:607 ; ch10:739 (R14) ; ch10:654 | N |
| R18-04 | La distinction chiffrée / À l'échec est portée par une représentation typée explicite. Ni `0`, ni une chaîne dans un champ numérique, ni un simple `null` ambigu ne portent seuls cette distinction. | ch09:1246 | N |
| R18-05 | Une même Série ne peut pas porter à la fois une cible numérique et une cible À l'échec. | ch09:1196 ; ch09:1140 (« aucune cible numérique À l'échec ») | N |
| R18-06 | Zéro n'est jamais une cible valide. `00:00` est réservé à la représentation neutre de l'échec dans le sélecteur et n'est jamais persisté comme cible. | ch09:1196 ; DSF-2M:37 | N |
| R18-07 | Le régime identiques/variables est persisté explicitement et indépendamment du mode. L'égalité des valeurs ne le détermine pas. En identiques, toutes les Séries ont la même cible, À l'échec compris. En variable, la collection ordonnée peut mélanger cibles chiffrées et À l'échec ; l'ordre est conservé. | ch09:1248 ; ch09:1140 ; ch09:445 | N |
| R18-08 | En variable, la collection ordonnée de N couples cible/Pause (avec le Bip de chaque Série) est la source unique effective ; aucune surcharge commune n'est persistée au-dessus. | ch09:446 ; ch09:1230 ; ch07:370 (D-247) ; ch09:1150 | N |
| R18-09 | Aucun brouillon caché n'est persisté : ni alternatives de mode mémorisées, ni réserves de lignes retirées, ni valeurs temporaires de restauration, ni repli visuel. | ch09:446 ; ch09:1142 ; ch11:362 ; ch09:1149 | N |
| R18-10 | La phrase de synthèse, ses segments et la Durée totale ne sont jamais persistés comme vérité (définition, copie ou instantané). | ch09:607 ; ch09:448 ; ch11:461 ; ch09:1170 | N |
| R18-11 | Le Bip de cadence est un entier 0..10 par Série, valide et conservé dans les deux modes. Un ancien objet sans ce champ est lu à 0 = Aucun. Les valeurs −1, 11 et les fractions sont refusées sans correction silencieuse. | ch09:1148 ; ch09:1156 ; ch09:1270 ; ch11:371 | N (Δ12 : refus des valeurs hors plage repris de la base) |
| R18-12 | Bornes des cibles chiffrées : Durée de 5 à 3535 s, au pas de 5 ; Répétitions, entiers de 1 à 100. Les valeurs historiques ne sont **pas arrondies silencieusement** à la lecture. | DSF-2M:37 ; ch07:610 | N (règle portée par ED-09, rappelée ici pour son effet sur la lecture et la migration) |
| R18-13 | La persistance est atomique : aucune Série n'est écrite partiellement ; les paramètres et la collection sont écrits ensemble. | ch09:1232 ; ch09:1156 ; ch11:72 (API-ACT-01) | N |
| R18-14 | Une cible À l'échec explicitement sélectionnée est valide sans nombre ; elle ne bloque pas la sauvegarde. | ch10:654 | N |

### 1.2 Migration de l'ancien mode À l'échec

| ID | Règle atomique testable | Source | Statut |
|---|---|---|---|
| R18-20 | Tout ancien Exercice en mode À l'échec (`TO_FAILURE`) est lu, puis migré, comme un Exercice en **Répétitions** dont **toutes** les Séries ont une cible À l'échec. | ch09:1256 ; ch09:607 ; ch09:1198 ; ch10:740 (R15) ; ch11:267 ; ch12:1359 ; MAT-2M:15 (E07) | N |
| R18-21 | La migration conserve : le nombre de Séries, les Pauses, le Bip, le côté (`sideMode`), l'ordre des côtés et « les autres paramètres ». Liste explicite des autres paramètres persistés : régime uniforme/variable, collection ordonnée cible/Pause, direction, Pause entre les côtés (PC), Compte à rebours, Fin, nom, description, Catégorie, Zones, associations média ordonnées. | ch09:1256 (liste courte) ; ch09:1230 (liste du modèle persistant) ; ch09:410-450 | N (la liste explicite est une lecture combinée de deux passages ; voir C-06) |
| R18-22 | Après migration, le comportement observable est inchangé : fin de chaque Série par Suivant, total d'Exercice omis, phrase existante (« … séries menées jusqu'à l'échec » / carte « N séries à l'échec »). | ch09:1256 ; ch09:1122 ; ch10:712 | N |
| R18-23 | La transformation s'applique aux définitions **et aux copies concernées** (`SessionActivity`), pas seulement au Catalogue. | ch09:1258 ; ch12:1597 | N |
| R18-24 | Les identifiants des Exercices (définitions et copies) sont stables à travers la migration ; aucune copie de Séance n'est promue en définition du Catalogue, et aucune référence de Catalogue n'est créée silencieusement. | ch09:429 (« Identifiant … Stable ») ; ch04:112 ; ch12:1359 | N (application à la migration PRE-4 par analogie de la règle T03 ; à confirmer, voir C-09) |
| R18-25 | Aucun relevé historique n'est inventé : pas de répétitions rétrocalculées à partir d'un temps global ; un relevé absent n'est jamais transformé en zéro. | ch09:607 ; ch09:1196 ; ch09:1198 ; ch09:1260 ; ch10:734 (R09) | N |
| R18-26 | Les instantanés historiques ne sont pas réécrits par la migration : ils restent lisibles selon leur version (lecture versionnée de l'ancien format). | ch09:1260 ; ch09:1198 ; ch09:585-586 ; ch12:418, 422 | N (tension avec ch12:1597, voir C-03) |
| R18-27 | La migration est atomique : elle réussit entièrement, ou ne laisse aucune modification partielle. | ch09:1262 (« transformation atomique ») ; ch12:1597 (« versionnée et atomique ») ; ch12:434-436 | N |
| R18-28 | Une donnée ancienne invalide (cible manquante ou incohérente pour son mode) n'est **jamais** convertie en À l'échec par la migration. | ch09:1244 ; PERIM:212 | N + CAD (comportement attendu pour la donnée invalide elle-même : manque, voir M-02) |
| R18-29 | La migration est vérifiée sur une **SQLite réelle**, avec transaction et rollback. | PERIM:212 | CAD (exigence de preuve, pas de règle produit) |
| R18-30 | Aucune réinitialisation de base n'est autorisée : les données existantes doivent être préservées. | ch12:1505 ; recette-iphone.md §2 l. 17-27 | N (contredit, hors périmètre, par ch12:600 et ch12:1471 au sujet de D-208 ; voir C-07) |
| R18-31 | Les données sans nouveaux attributs sont lues uniformes et en « Un côté après l'autre » ; leur quantité de travail, leurs cibles, leurs Pauses et leur direction sont conservées. | ch09:1142 ; ch09:1226 ; ch12:1505 | N |
| R18-32 | Les DTO et API acceptent DURATION/REPETITIONS et une cible typée par Série ; `TO_FAILURE` n'est qu'un format historique à lire et à migrer. | ch11:267 ; ch11:405 | N |

### 1.3 Annulation sans écriture (côté données)

| ID | Règle atomique testable | Source | Statut |
|---|---|---|---|
| R18-40 | La persistance n'a lieu qu'à Terminer, de façon atomique. Le ✓ de la feuille Paramètres applique au brouillon parent, sans écrire en base. | ch13:620 (CE-T03-04 §15) ; ch13:604 (§12) ; ch08:1832 ; ch11:461 | N |
| R18-41 | ✕ de la feuille annule son brouillon, sans modifier aucun paramètre du parent. Fermer la feuille n'enregistre rien. | ch13:620 ; ch13:636 (§19) ; ch11:461 | N |
| R18-42 | Retour avec modifications : la confirmation d'abandon existante s'applique ; un abandon confirmé ne laisse aucune écriture. | ch13:552 (§4) ; ch13:598 (§11) ; ch08:1594 | N |
| R18-43 | En cas d'échec d'écriture en base, le brouillon est conservé, l'éditeur reste affiché et une nouvelle tentative est possible ; aucune donnée partielle. | ch13:628 (§17) ; ch12:434-436 | N |
| R18-44 | Source supprimée en parallèle : signaler une erreur, sans recréation implicite. | ch13:628 | N |

---

## 2. ED-19 — Copies, duplications, instantanés

Cadrage : `PERIM:213` « Catalogue et Séance, cibles typées et médias ordonnés conservés ; historique versionné non réécrit ; anciens résultats sans performance inventée ».

### 2.1 Copie Catalogue → Séance

| ID | Règle atomique testable | Source | Statut |
|---|---|---|---|
| R19-01 | L'ajout d'une définition du Catalogue à une Séance crée une **copie complète et indépendante** (`SessionActivity`) : aucune modification ne se propage ensuite, dans un sens comme dans l'autre. | ch04:110 ; ch04:342 ; ch11:262 (API-ACT-COPY-01) ; ch10:195 (RM-113) ; ch07:145 (D-113) | N |
| R19-02 | La copie transporte le mode commun et la **cible typée de chaque Série** (chiffrée ou À l'échec), dans leur ordre. | ch09:1196 ; ch11:405 ; ch11:362 | N |
| R19-03 | La copie transporte le régime uniforme/variable explicite, N, la collection ordonnée cible/Pause, le Bip de chaque Série, la direction, l'ordre des côtés, PC, le Compte à rebours et la Fin. | ch09:1142 ; ch09:1230 ; ch09:1150 ; ch04:427 | N |
| R19-04 | La copie transporte nom, description, Catégorie, Zones corporelles et associations média ordonnées. | ch09:609 (sans la Catégorie) ; ch04:342 (« toutes ses propriétés métier applicables ») ; ch04:110 | N (liste ch09:609 incomplète, voir C-01) |
| R19-05 | La définition source n'est jamais modifiée par sa copie dans une Séance. | ch09:1232 ; ch08:524 | N |
| R19-06 | La position avant/dans/après le Circuit n'existe que sur la copie de Séance. Une copie ne porte aucune récupération automatique ; `postActivityRecoverySeconds` est la projection des récupérations explicites (0 sinon). | ch09:609 ; ch04:110 ; ch04:251 | N |
| R19-07 | La copie groupée est atomique : en cas d'erreur, la Composition est inchangée et aucun sous-ensemble ne reste inséré. Les copies suivent l'ordre de présentation de la liste filtrée. | ch11:302 (API-COMP-SEL-03) ; ch11:296 ; ch10:228 (RM-163) | N |
| R19-08 | Supprimer définitivement une définition ne cascade ni vers ses copies de Séance, ni vers les instantanés, exécutions et résultats. | ch04:114 ; ch13:718 | N |
| R19-09 | L'édition d'une copie de Séance utilise le même éditeur, sans synchronisation vers la référence ; le retour se fait vers la Composition. | ch13:548 (§3) ; ch13:624 (§16) | N (ED-01) |
| R19-10 | L'adaptation d'une copie à un circuit de séries (ajout ou suppression de lignes) relève de Composition. | ch08:524 ; questions-ouvertes.md §4 | HP |

### 2.2 Duplications

| ID | Règle atomique testable | Source | Statut |
|---|---|---|---|
| R19-20 | Dupliquer un Exercice de Séance crée une copie indépendante, avec un nouvel identifiant, insérée juste après la source ; les propriétés intrinsèques et `postActivityRecoverySeconds` sont copiés ; rien n'est créé au Catalogue. | ch11:78 (API-ACT-07) ; ch10:38 (RM-021) ; ch10:255 (RM-210) | N |
| R19-21 | Dupliquer une Séance crée une Séance indépendante, avec de nouveaux identifiants et une copie de sa Composition et de ses paramètres ; aucune Routine ni Exécution n'est dupliquée. | ch11:51 (API-SEA-05) ; ch10:18 (RM-006) | N |
| R19-22 | Toute duplication conserve l'état complet des paramètres : régime explicite, collection ordonnée, **cibles typées**, Bip, côté et ordre. | ch09:1142 ; ch09:1150 ; ch11:362 ; ch11:275 (API-SIDE-03) | N |
| R19-23 | Copier une cible À l'échec, y compris par « copie de la dernière ligne » à l'augmentation de N, copie son type et sa Pause sans inventer de nombre. | ch09:1250 | N (ED-12, effet données) |
| R19-24 | La duplication d'un Exercice du Catalogue (balayage « Dupliquer ») suit les mêmes règles de conservation. | ch10:227 (RM-162) ; ch09:1142 | N (aucune API dédiée en ch11, voir M-05) |

### 2.3 Instantanés et historique

| ID | Règle atomique testable | Source | Statut |
|---|---|---|---|
| R19-30 | L'instantané d'exécution porte la cible typée de chaque Série et de chaque côté, avec son Bip ; il est immuable après démarrage. | ch09:1196 ; ch09:1151 ; ch09:560 | N (création d'instantané : moteur HP ; seule la forme transportée est concernée) |
| R19-31 | Les instantanés anciens restent lisibles selon leur version ; un instantané ancien sans Bip est lu « non cadencé ». | ch09:1151 ; ch09:1260 ; ch11:375 ; ch12:418 | N |
| R19-32 | Aucun résultat historique n'est réécrit : ni par la migration, ni par la régénération d'une phrase, ni par une modification de la source. | ch09:1196 ; ch09:1260 ; ch09:1226 ; ch10:157 (RM-084) ; ch11:362 ; ch11:423 | N |
| R19-33 | Aucune performance n'est inventée pour un ancien résultat : pas de nombre de répétitions déduit d'un temps global ; un relevé absent reste absent, sans zéro. | ch09:1198 ; ch09:1260 ; ch09:1153 ; ch11:373 | N |
| R19-34 | L'historique se lit exclusivement depuis l'instantané, jamais par recalcul depuis la source actuelle. | ch09:587 ; ch11:423 | N |
| R19-35 | Relevés qualifiés (estimé, déclaré), dernière tentative contre cumul (20 s, reset, 35 s → 55 s cumulés, 35 s relevés) : interface future. | ch09:1196-1198 ; ch12:1595 ; ch10:735 (R10) | HP (moteur et relevés exclus, PERIM:222) ; ne pas rendre le modèle incompatible |

---

## 3. ED-21 — Préservation des médias (côté données)

Cadrage : `PERIM:215` « Import local, ordre, erreurs/réessai, sauvegarde et copies, aucun fichier physique encore référencé supprimé ».

| ID | Règle atomique testable | Source | Statut |
|---|---|---|---|
| R21-01 | Un Exercice possède de 0 à n associations média ordonnées, chacune avec une position unique dans son Exercice. Un nouvel élément prend la dernière position ; réordonner ne touche que cette association. | ch09:611-613 ; ch09:496 | N |
| R21-02 | Les fichiers ne sont jamais stockés dans SQLite. `MediaAsset` porte une URI interne stable, le type photo/vidéo, une miniature éventuelle et des métadonnées. | ch09:613 ; ch12:1355 ; ch12:692 | N |
| R21-03 | Le brouillon parent contient les associations ordonnées, existantes ou ajoutées ; elles sont persistées avec l'Exercice, à Terminer. | ch13:560 (§5) ; ch13:564 | N |
| R21-04 | Copier ou dupliquer un Exercice ou une Séance crée de nouvelles associations, qui peuvent référencer le même fichier physique. Le fichier n'est pas dupliqué. | ch09:497 ; ch10:197 (RM-115) ; ch07:103 (D-066) ; ch07:105 (D-068) ; ch12:393 | N |
| R21-05 | Retirer un média d'un Exercice supprime seulement son association. | ch09:498 ; ch07:103 (D-066) | N |
| R21-06 | Le fichier physique n'est supprimé que lorsque le nombre de références est nul : définitions, copies de Séance et instantanés. Un service compte les usages actifs **et historiques** avant tout nettoyage. | ch09:498 ; ch09:613 ; ch12:1355 ; ch11:263 (API-MED-01..05) ; ch07:539 (D-333) | N |
| R21-07 | Les instantanés conservent les associations ordonnées et les références stables, sans copie physique ; un fichier reste conservé tant qu'un instantané le référence. | ch09:552 ; ch09:565 ; ch09:588 ; ch11:147 ; ch12:416 | N |
| R21-08 | L'ordre des médias est conservé à la sauvegarde, à la réouverture, à la copie et à la duplication. La vignette de carte utilise le premier média dans cet ordre. | ch13:564 ; ch04:403 ; PRE3:248 (P3-23) | N |
| R21-09 | Import nominal, annulé ou en erreur. Un import annulé ou en erreur ne crée ni association, ni fichier orphelin référencé. | ch13:564 ; PRE3:248 | N pour les trois états ; le comportement détaillé est un manque (M-06) |
| R21-10 | La migration de l'ancien mode À l'échec et la refonte des paramètres ne modifient ni les associations média ni leur ordre. | ch09:1256 (« autres paramètres ») ; ch09:410-450 | N (lecture de « autres paramètres ») |
| R21-11 | Un média indisponible ne doit pas compromettre la lisibilité de l'historique. | ch12:403 ; ch10:248 (RM-203.11) | N (consultation en exécution : HP) |
| R21-12 | La capture caméra n'est pas activée implicitement. | ch05:199 ; ch11:263 | N |

---

## 4. ED-15 — Transport vers la Séance et agrégation (données seulement)

Cadrage : `PERIM:209` « Pauses connues conservées malgré omitted ; remplacement terminal par R positive et bilatéralité préservés ; adaptations minimales des consommateurs de Séance, sans refonte Composition ». Q4 : adaptations admises seulement pour le transport, la persistance, les copies, les calculs et l'affichage des nouvelles cibles.

| ID | Règle atomique testable | Source | Statut |
|---|---|---|---|
| R15-01 | La copie de Séance (`SessionActivity`) et son repository transportent le mode commun et la cible typée de chaque Série ; validation, édition, copie et instantané partagent la même représentation. | ch11:405 ; ch11:362 ; ch09:1232 | N |
| R15-02 | Les consommateurs de Séance (Composition, détail, calcul) acceptent DURATION/REPETITIONS et des cibles mixtes, sans troisième mode. | ch11:267 ; ch10:61 (RM-033) | N + Q4 |
| R15-03 | Calcul d'un Exercice : exact si Durée et toutes les cibles chiffrées ; estimé (≈) si Répétitions avec Bip > 0 et toutes les cibles chiffrées ; borne basse (≥) pour un mélange chiffré/échec calculable, prioritaire sur ≈ ; omis si Répétitions sans Bip ou toutes les cibles À l'échec. | ch10:705-712 ; ch10:645-649 ; ch11:369 | N |
| R15-04 | Le total d'Exercice omis ne supprime **pas** ses pauses du total Circuit/Séance ; les pauses et le travail estimable contribuent toujours. | ch10:716 ; ch10:684 ; SPEC-2M(base):100 | N |
| R15-05 | Agrégat Séance/Circuit : exact si tout est exact ; ≈ si au moins une estimation et aucun travail inconnu ; ≥ si au moins un travail inconnu (cible À l'échec, ou Répétitions sans Bip). | ch10:650-652 ; ch10:684 ; ch10:135 (RM-072) | N |
| R15-06 | Une Pause est stockée et exécutée après chaque Série, dernière comprise ; seule la toute dernière Pause est remplacée par une récupération positive qui suit l'occurrence (To = T − PN + R si R > 0). | ch09:457 ; ch09:461 ; ch07:494 (D-314) ; ch07:371 (D-248) | N |
| R15-07 | Plan : une phase `SERIES_PAUSE` après chaque Série **dont la pause est positive**, dernière comprise, sauf substitution terminale par une récupération positive. | ch09:688 (Δ5) | N ; moteur HP |
| R15-08 | La bilatéralité est préservée dans les formules (succession 2Σ(Ti+Pi)+PC ; paire 2ΣTi+ΣPi+N×PC) et la cible typée s'applique aux deux côtés. | ch09:461 ; ch09:1250 | N |
| R15-09 | Multiplicité dans un circuit (zone historique `IN_TOUR`) : nombre de répétitions du Circuit, sans double multiplicateur. | ch11:418 ; ch12:1589 ; questions-ouvertes.md §4 | N (HP pour la Composition) |
| R15-10 | « omitted » se traduit par l'absence de ligne, de valeur, de zéro et de tiret ; une saisie invalide reste une erreur de validation, jamais omitted. | ch10:654 ; ch10:716 | N |
| R15-11 | Dès qu'une cible est À l'échec, aucun calcul inverse n'est possible depuis un total saisi. | ch10:720 | N (ED-14) |
| R15-12 | Progression et poids du moteur (RM-077, RM-126) : les prédicats distinguent la nature de la cible. | ch10:140 ; ch10:143 ; ch12:1595 | HP (moteur) |
| R15-13 | Synthèse des cartes de Séance : « N séries à l'échec » pour tout échec. Les variantes mixtes sur les cartes de Composition relèvent des volumes. | ch09:1122 ; ch13:31 ; ch11:397 | N pour tout échec ; mixte sur carte : M-07 |

---

## 5. Indications techniques des specs (pour l'architecture)

Ces passages sont des **contraintes ou des suggestions** à transmettre à l'architecture, non des règles produit. Les spécifications elles-mêmes renvoient le schéma physique au développement (ch09:1246, ch09:1262, ch11:435, ch12:397).

| ID | Indication | Source | Nature |
|---|---|---|---|
| T-01 | Le nom physique des champs et le schéma de migration sont des choix d'implémentation. | ch09:1246 ; ch09:1230 | Liberté explicite |
| T-02 | Conception préalable obligatoire : inventaire des enums et champs existants, versionnement, lecture de l'ancien format, transformation atomique, copies, reprises, compatibilité des données sauvegardées. **Ne pas déclarer une migration SQL définie avant l'inventaire du schéma réel.** | ch09:1262 ; ch12:1597 | Contrainte de méthode |
| T-03 | **Δ14 — numérotation fausse dans la spec :** ch12:1565 et ch11:435 disent « migrations 001..008 ; 009 prochain » (main `72d1bf4`) ; ch12:1553 « 001 à 008 » (PR323). Le code de départ contient déjà `migration001.ts` à `migration009.ts` (`src/infrastructure/database/migrations/`, constaté). Ces passages précisent eux-mêmes « à revalider », « pas une réservation ». **La numérotation se lit dans le code, pas dans la spec.** Ne pas modifier `migration001.ts` (AGENTS.md). | ch12:1565 ; ch11:435 ; ch12:1553 ; sources-retenues.md §5 Δ14 | Indication périmée |
| T-04 | Constat de code (lecture seule, à confirmer par l'architecture) : `TO_FAILURE` est présent dans le schéma (`migration003.ts`, `migration004.ts`, `CHECK execution_mode IN (…'TO_FAILURE')`), dans le domaine Exercice (`ActivityDefinition.ts:197`, `ExecutionParameters.ts:27`, `ExecutionParametersDraft.ts`, `executionPhrase.ts`) **et** dans le domaine Séance (`Session.ts:64`, `validation.ts:72`, `SessionDraft.ts`). Un module `exerciseSnapshot.ts` existe. La migration et le transport touchent donc les deux domaines (Q4). | code `c32e360d` | Observation, pas une solution |
| T-05 | Prérequis signalé : la refonte du modèle scalaire (`repetitionCount`, `seriesCount`, `pauseSeconds`) vers une collection `SeriesParameters` et des pauses explicites doit précéder l'intégration du Bip et des cibles par Série. `pauseSeconds` est porté dans `SeriesParameters.pauseSeconds`. | ch12:1553 ; ch09:1158 ; ch09:1176 ; ch07:486 (D-313) | À vérifier contre le code PRE-3 (ce prérequis a pu être livré) |
| T-06 | Instantané : JSON immuable, format relisible après évolution du modèle, nouvelle version d'instantané compatible avec les anciennes. | ch09:567 ; ch12:418-422 ; ch11:375 ; ch09:1230 | Contrainte |
| T-07 | Transactions : toute opération sur plusieurs objets liés est atomique (réussit entièrement ou ne laisse rien). Les contraintes d'intégrité du ch09 sont aussi appliquées en persistance lorsque c'est pertinent : interdiction de zéro comme cible, de la simultanéité numérique/échec, unicité de position média. | ch12:426-438 ; ch09:1196 ; ch09:613 | Contrainte |
| T-08 | Repositories séparés (`ActivityDefinitionRepository`, `SessionActivityRepository`, `MediaAssetRepository`) ; `CompositionService` orchestre la copie complète. Pas d'ORM. | ch12:1357 ; ch12:162 ; AGENTS.md | Contrainte |
| T-09 | Erreurs : catégories existantes de validation et `INVALID_STATE`, avec champ et Série localisés ; aucune nouvelle API réseau ni entité imposée. | ch11:375 | Contrainte |
| T-10 | Un service de références compte les usages actifs et historiques avant tout nettoyage physique d'un média. | ch12:1355 | Suggestion d'architecture |
| T-11 | Tests de persistance : création, modification, suppression, transactions, migrations. Pour PRE-4 : SQLite réelle (PERIM:212). | ch12:466 ; PERIM:212 | Exigence de preuve |
| T-12 | Le moteur doit classer chaque phase par mode **et** nature de cible, et séparer `durationDeterminable` de `autoComplete`. | ch12:1595 ; ch12:1531 | HP (moteur), contrainte de forme pour les données transportées |
| T-13 | « Contrôler les données réellement présentes avant livraison applicative. » | ch12:1565 | Contrainte de méthode (rejoint recette-iphone.md §2) |

---

## 6. Contradictions et manques

### 6.1 Contradictions ou tensions

| ID | Constat | Sources | Proposition de lecture (à valider ; aucune résolution par déduction) |
|---|---|---|---|
| C-01 | La liste des propriétés copiées à l'ajout d'une définition (ch09:609) omet la **Catégorie**, la cible typée, le régime, le Bip, le côté, l'ordre, PC, le Compte à rebours et la Fin. D'autres passages exigent pourtant une copie « complète » ou « de toutes les propriétés métier applicables ». | ch09:609 contre ch04:342, ch11:262, ch09:1142, ch09:1230, ch11:362 | La règle générale « copie complète » prévaut ; ch09:609 est une énumération ancienne. **Signaler avant de rédiger l'exigence de copie** (Catégorie surtout). |
| C-02 | ch09:446 décrit la « cible absente À l'échec », alors que ch09:1246 interdit qu'un `null` ambigu porte seul la distinction. | ch09:446 ; ch09:1246 | Pas de conflit de règle : « absente » vaut pour la valeur numérique, le type reste explicite. |
| C-03 | ch12:1597 demande une « migration versionnée et atomique de l'ancien mode, **copies/snapshots compris** », alors que ch09:585 et ch09:1260 posent des instantanés immuables, lus selon leur version et jamais réécrits. | ch12:1597 ; ch09:585-586 ; ch09:1198 ; ch09:1260 | Lire « snapshots compris » comme une **compatibilité de lecture**, pas une réécriture. **Arbitrage nécessaire si l'architecture envisage de réécrire un instantané.** |
| C-04 | « Aucune reprise fonctionnelle des anciennes séances demandée » (ch11:435, ch12:1565, ch09:1160) peut se lire comme une dispense de migrer les copies de Séance, alors que ch09:1258 l'exige. | ch11:435 ; ch12:1565 ; ch09:1160 ; ch09:1258 | Ces phrases appartiennent au lot Pauses/récupérations (D-208, pauses explicites) et ne visent pas la migration `TO_FAILURE`, qui s'applique aux copies. |
| C-05 | Δ14 : la numérotation de migration de la spec (« 009 prochain ») est fausse au regard du code (001..009 présents). | ch12:1565 ; ch11:435 ; code | Sans effet sur les règles (sources-retenues §5). |
| C-06 | La liste de conservation de la migration (« nombre, pauses, bip, côté, ordre et autres paramètres ») est ouverte. Le « bip » suppose un champ que l'ancien modèle `TO_FAILURE` n'a peut-être pas. | ch09:1256 ; ch09:1156 | Absence de Bip → 0 = Aucun (ch09:1156). La liste explicite (R18-21) combine ch09:1256 et ch09:1230 ; à valider. |
| C-07 | ch12:600 et ch12:1471 (D-208) disent la base de développement « réinitialisable » sans migration utilisateur ; ch12:1505 interdit toute réinitialisation et la recette suppose des données antérieures. | ch12:600 ; ch12:1471 ; ch12:1505 ; recette-iphone.md §2 | D-208 est historique et hors PRE-4. Pour PRE-4, aucune réinitialisation : préservation requise (R18-30). |
| C-08 | ch09:688 (Δ5) crée `SERIES_PAUSE` « quand sa pause est positive » ; ch09:461 dit « travail + pause après chaque série, dernière comprise ». | ch09:688 ; ch09:461 | Compatible : une pause nulle est stockée mais ne crée pas de phase. Retenue (Δ5). |
| C-09 | La stabilité des identifiants pendant la migration n'est écrite nulle part explicitement. Elle se déduit de « Identifiant … Stable » (ch09:429) et de la règle T03 de non-promotion. | ch09:429 ; ch04:112 ; PERIM:212 « tous paramètres et identifiants » (consigne) | À confirmer comme exigence explicite. |
| C-10 | ch09:497 parle d'une « nouvelle association/entité Média » à la duplication, alors que `MediaAsset` est un fichier immuable partageable (ch09:613). | ch09:497 ; ch09:613 ; RM-115 | Nouvelle **association** ; l'actif peut être partagé. |

### 6.2 Manques

| ID | Manque | Effet |
|---|---|---|
| M-01 | **Échec de la migration au démarrage :** les spécifications imposent l'atomicité et le rollback (R18-27), mais ne décrivent pas ce que voit l'utilisateur (message, application bloquée, nouvelle tentative au lancement suivant). | Bloquant pour une story d'erreur de migration. À arbitrer par Hermann. |
| M-02 | **Donnée ancienne invalide** (par exemple Répétitions sans nombre, Durée hors 5..3535 ou non multiple de 5, Bip hors 0..10 persisté) : seuls l'interdiction de conversion en Échec (R18-28) et la lecture sans arrondi (R18-12, ch09:1270) sont définis. Rien ne dit si la donnée est migrée telle quelle, marquée « à renseigner » à l'ouverture, ou si elle bloque la migration. | À arbitrer avant de rédiger ED-18 sur ce point. |
| M-03 | **Ancien `TO_FAILURE` en régime variable :** existe-t-il dans les données réelles ? Le régime et la collection doivent être conservés avec toutes les lignes À l'échec, mais aucun texte ne traite le cas. | Inventaire du schéma réel (T-02, T-13). |
| M-04 | **Instantanés existants contenant `TO_FAILURE` :** la lecture versionnée est exigée, mais rien ne dit comment l'historique affiche un ancien instantané (« à l'échec » ou Répétitions + échec). | Affichage de l'historique : Suivi hors périmètre ; seule la compatibilité de lecture est due. |
| M-05 | Duplication d'un Exercice du **Catalogue** : aucune API dédiée en ch11 (seulement API-ACT-07 pour la Séance), alors que RM-162 expose « Dupliquer ». | Règle de conservation déduite de ch09:1142 ; à confirmer. |
| M-06 | Médias : le comportement détaillé des erreurs et de la nouvelle tentative d'import (ED-21), les sources système, les formats et les permissions sont « À CLARIFIER dans le plan » (ch13:564), sans règle produit. Ce qui a été livré par PRE-3 fait référence. | Reprendre le comportement PRE-3 existant ; non-régression. |
| M-07 | Affichage d'un Exercice à cibles **mixtes** sur les cartes de Séance et de Composition : la synthèse ne définit que « N séries à l'échec » (tout échec) ; les volumes mixtes relèvent de la grille Volumes (HP). | Limite Q4 : arbitrage si une story touche la carte de Composition. |
| M-08 | ED-18 « SQLite réelle » et « rollback » ne sont que des exigences de preuve du cadrage, sans critère chiffré. | À traduire en critères d'acceptation dans le PRD. |
| M-09 | « Référence active » d'un média (ch09:613) : rien ne dit si un Exercice **archivé** ou une Séance archivée compte comme référence. Lecture prudente : oui, car seuls des Exercices supprimés définitivement libèrent une référence. | À confirmer. |

### 6.3 Questions ouvertes du dépôt concernées

- **Q7** (ch13 l. 4346-5996 exclu) : aucun attendu chiffré de cette section n'est repris ici, notamment `user_version 9`.
- **Q4** : R15-01, R15-02 et la migration des copies (R18-23) sont dans le périmètre (transport, persistance, copies). R19-10, R15-09 et M-07 restent à la frontière de Composition.

---

## 7. Comptage

| ED | Règles | Dont N | Dont CAD | Dont HP |
|---|---|---|---|---|
| ED-18 | 33 (R18-01..14, R18-20..32, R18-40..44) | 32 (R18-28 mixte N+CAD) | 1 (R18-29) | 0 |
| ED-19 | 20 (R19-01..10, R19-20..24, R19-30..35) | 18 | 0 | 2 (R19-10, R19-35) ; R19-30 N avec réserve moteur |
| ED-21 | 12 (R21-01..12) | 12 | 0 | 0 (R21-11 : consultation en exécution HP) |
| ED-15 (transport) | 13 (R15-01..13) | 11 | 0 | 2 (R15-07 moteur et R15-12 moteur ; R15-09 à la frontière de Composition) |
| Indications techniques | 13 (T-01..13) | — | — | — |
| Contradictions / manques | 10 C + 9 M | — | — | — |
