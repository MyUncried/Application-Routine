# QS — Structure, traçabilité, maintenabilité, utilisabilité de la spécification KODJO

Passe 2 « qualité », lecture seule. Dépôt `C:\Dev\KODJO-OPENSPEC-DOCS`, corpus `docs/Specifications-fonctionnelles/01..13`, `docs/INDEX.md`, `docs/README.md`, `docs/DSF-*.md`, `docs/PRODUCT.md`.
Les chemins abrégés ci-dessous (`ch08:1584`) désignent `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`, ligne 1584 (numéros obtenus par `grep -n` / `sed -n`).
Aucune certification formelle n'est revendiquée. Les incohérences de fond relèvent de la passe « cohérence » : elles ne sont citées ici que pour illustrer un défaut de maintenabilité.

---

## 1. Couverture réelle

| Source | Lu intégralement | Lu partiellement (plages) | Mesuré mécaniquement |
|---|---|---|---|
| INDEX.md | oui (23 lignes) | — | — |
| README.md | non | 85–101 | — |
| ch01 | non | ligne 77, 163–169, 359–390 (titres) | titres, ID, renvois, répétitions |
| ch02 | non | 1–40, 200–247 + tous les titres | idem ; recherche de tous les ID présents |
| ch03, ch04, ch05 | non | titres H1, lignes isolées citées | idem |
| ch06 | non | lignes isolées 1113, 1167, 1255, 2438 | idem + contrôle des ancres de liens |
| ch07 | non | 1–30, tous les titres, lignes D-111, D-131, D-214, D-217, D-247, D-338 | colonnes Statut / Intégrée des 349 lignes D-xxx à 4 colonnes |
| ch08 | non | 232–262, 362–397, 1545–1590, tous les titres | idem |
| ch09 | non | 60–80, titres H1 | idem |
| ch10 | non | 1–12, 57–76, 259–345, 593–784 | idem ; numérotation RM |
| ch11 | non | 318–330, ligne 352 | idem |
| ch12 | non | titres H2 1330–1613, lignes 886, 1380–1383 | idem |
| ch13 | non | 1–60, 170–182, 212–247, 2949–3064 (CE-UI-10 complet), 3065–3106, 3811–3892 (CE-FMT-04), CE-T03-08 (916–1019, extraits), 4057–4070, 4249–4272 | inventaire de toutes les sections `## ` avec comptage D/RM/recette |
| DSF-*.md (14 fichiers) | non | titres de DSF-BIP-CADENCE ; lignes RG-10..13 de DSF-CARTES-ICONES-APPUIS | décompte des liens entrants depuis les chapitres |
| MATRICE-FORMATS-SEANCES-2026-10-14.md (hors corpus déclaré) | non | 1–12 | recherche REC-xx, uniquement pour vérifier une référence pendante |

Échantillonnage : 2 tests d'utilisabilité (CE-UI-10 et durée totale d'un Exercice), 6 décisions du ch07, 3 contrats du ch13. Lecture partielle (environ 15 % du volume) : **aucune conclusion de complétude globale** n'est tirée ; les défauts « démontrés » le sont par recherche exhaustive (grep) sur les 13 chapitres, et la commande est indiquée.

---

## 2. Mesures mécaniques

### 2.1 Taille et titres

Commande : `wc -c`, `wc -l`, `grep -c '^# '` … `'^##### '` sur chaque chapitre.

| Ch | Octets | Lignes | H1 | H2 | H3 | H4 | H5 | Table des matières | Ancres `<a id>` / `{#}` | Liens `.md` sortants |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 48 876 | 449 | 1 | 16 | 12 | 19 | 1 | non | 3 | 8 |
| 02 | 17 803 | 247 | 1 | 16 | 7 | 8 | 0 | non | 1 | 4 |
| 03 | 45 679 | 565 | 11 | 57 | 13 | 0 | 0 | non | 1 | 6 |
| 04 | 41 694 | 459 | 11 | 21 | 4 | 0 | 0 | non | 1 | 5 |
| 05 | 23 203 | 284 | **0** | 17 | 15 | 5 | 0 | non | 1 | 5 |
| 06 | 197 395 | 2 794 | 1 | 26 | 155 | 192 | 0 | non | 47 | 63 |
| 07 | 133 583 | 632 | 2 | 41 | 1 | 0 | 0 | non | 1 | 1 |
| 08 | 176 655 | 1 850 | 7 | 83 | 70 | 49 | 0 | non | 10 | 6 |
| 09 | 118 654 | 1 274 | 19 | 89 | 27 | 2 | 0 | non | 4 | 8 |
| 10 | 85 499 | 784 | 1 | 26 | 52 | 0 | 0 | non | 48 | 5 |
| 11 | 62 241 | 463 | **0** | 29 | 9 | 0 | 0 | non | 3 | 6 |
| 12 | 150 485 | 1 623 | **0** | 57 | 40 | 8 | 6 | non | 2 | 12 |
| 13 | 287 428 | 4 343 | 1 | 56 | 832 | 23 | 0 | non | 6 | 14 |
| **Total** | **≈1,39 Mo** | **15 565** | | | | | | **0/13** | 128 | 143 |

`grep -ciE "table des mati|sommaire"` = 0 pour les 13 chapitres. Les liens internes à un même fichier (`](#…)`) sont au nombre de 5 sur tout le corpus (`grep -c "](#"`).

### 2.2 Identifiants

Commande : `grep -oE "\b<motif>" fichier | wc -l` (occurrences) et `| sort -u | wc -l` (distincts). Familles détectées par `grep -ohE "\b[A-Z]{1,4}(-[A-Z]{1,5})*-[0-9]{1,3}\b" *.md` normalisé : **plus de 30 familles** (D, RM, CE-UI, CE-T03, CE-FMT, CE-CIR, PRE, RG, DM, R/R-, V, CAD, CIR, API-xxx, N, F, H, Q, REC, EC, EXEC, SRC, COM-REC…).

| Famille | Définie dans | Occurrences totales | Citée hors du chapitre de définition |
|---|---|---|---|
| D-xxx (décisions) | ch07 (365 ID distincts) | 1 039 | dans tous les chapitres (3 à 81 occurrences selon le chapitre) |
| RM-xxx (règles métier) | ch10 (182 lignes de tableau) | 229 | **22 occurrences, 11 ID distincts** (ch07, ch08, ch13) |
| DM-xxx (décisions de données) | ch09 (20) | 20 | 0 |
| CE-xxx (contrats d'écran) | ch13 (40 contrats) | ≈230 | ch06 (73), ch07 (19), ch08 (11), ch12 (7) |
| API-xxx | ch11 (91 distincts) | 96 | 5 |
| RG-xx | DSF-CARTES-ICONES-APPUIS (hors chapitres) | 56 | recopié dans 10 chapitres |
| R / R-0x / R0x | trois familles homonymes (voir QS-07) | 42 | — |
| Besoins (ch02) | **aucune famille** | — | — |
| Critères de recette | **aucune famille stable** (lettres A–F, R01–R16, REC-xx non définis) | — | — |

### 2.3 Accrétion et décisions remplacées

Commandes : `grep -cE "^#{1,4} .*(JJ/MM|JJ mois)"`, `grep -oE "\*\*[^*]{0,60}JJ/MM[^*]{0,20}\*\*"`, `grep -ci remplac`, `grep -oi historique`.

| Ch | Titres datés | Marqueurs gras datés (« **Complément cible12/10 :** »…) | « remplac » | « historique » | obsol./abandon./annul./supersed. |
|---|---|---|---|---|---|
| 01 | 5 | 2 | 5 | 9 | 4 |
| 02 | 3 | 1 | 0 | 3 | 2 |
| 03 | 5 | 3 | 0 | 15 | 14 |
| 04 | 1 | 2 | 5 | 16 | 3 |
| 05 | 7 | 0 | 2 | 6 | 0 |
| 06 | 18 | 3 | 20 | 39 | 38 |
| 07 | 23 | 8 | 47 | 57 | 24 |
| 08 | 6 | 2 | 30 | 41 | 36 |
| 09 | 2 | 4 | 8 | 44 | 3 |
| 10 | 4 | 6 | 13 | 18 | 15 |
| 11 | 3 | 2 | 6 | 23 | 6 |
| 12 | 9 | 3 | 11 | 62 | 17 |
| 13 | 5 | 27 | 49 | 51 | 99 |
| **Total** | **91** | **63** | **196** | **384** | **261** |

Marqueurs les plus fréquents : « **Complément cible12/10 :** » ×13, « **Ancienne cible autonome retirée le 08/10/2026.** » ×10, « **Complément Formats du 14/10 :** » ×8, « **Clôture des contrats — 01/10/2026.** » ×8.

### 2.4 Répétitions

- Lignes de plus de 200 caractères répétées à l'identique : **63 lignes distinctes, 194 copies redondantes** (`cat *.md | awk 'length>200' | sort | uniq -c | awk '$1>1'`).
- Le bloc « Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) … Aucun calcul issu de Figma ou d'Excel. » : **14 occurrences dans 8 chapitres** + PRODUCT.md (`grep -oF "Durée intrinsèque calculable : unilatéral Σ(Ti+Pi)"`). Le segment « prioritaire sur ≈ » apparaît 20 fois.
- Paragraphes recopiés à l'identique dans **10 chapitres** : « RG-10 : le Profil porte une préférence silhouette… » (ch01:365, ch03:526, ch04:407, ch05:254, ch06:2271, ch08:1816, ch09:1124, ch10:289, ch11:333, ch12:1513) ; « D-239 : Calendrier Jour est une exception compacte… » (mêmes 10 chapitres) ; « Ancienne cible autonome retirée le 08/10/2026 » (10 occurrences, 9 chapitres).
- « La référence active est [Paramètres en modale v13](…) » : 7 chapitres (01, 04, 08, 09, 10, 11, 12).
- « Si la Série est en Répétitions avec bip, appliquer Bip v2 : … » : 7 fois dans ch13 (lignes 1076, 1174, 1386, 1484, 1933, 2023, 2725).

### 2.5 Liens

Script `py -3 -I …\scratchpad\qualite\tools\links.py` (vérifie, pour chaque lien `chapitre.md#ancre`, l'existence d'un `id="ancre"` ou d'un titre dont le slug correspond) : **106 liens avec ancre entre chapitres, 46 non résolus (43 %)**, tous de ch06 vers ch13 (`#ce-fmt-01` … `#ce-fmt-04`). Les seules ancres explicites de ch13 sont `editeur-parametres`, `formats-raccordement`, `controles-circuit`, `controle-bip`, `rendu-phrase`, `controles-planification` (`grep -n 'id="' ch13`) ; aucun contrat CE-xxx n'a d'ancre.
Références textuelles non cliquables vers des sources hors chapitres : « DSF Bip » 17 fois, « DSF du 12 », « DSF courant », « Bip v2 » 47 fois (aucun lien : `grep "Bip v2" | grep -c "]("` = 0).

---

## 3. Dimension STRUCTURE

**Bilan : faible.** Le découpage en 13 chapitres annonce une séparation claire (besoins 02, parcours 03, modèle 04/09, règles 10, écrans 06/13, décisions 07, technique 12), et l'INDEX la décrit correctement. Mais (1) aucun chapitre n'a de table des matières, alors que 5 dépassent 1 200 lignes ; (2) la numérotation des titres est cassée dans plusieurs chapitres, et 3 chapitres n'ont pas de titre de niveau 1 ; (3) les chapitres grossissent par sections datées ajoutées en fin de fichier (91 titres datés), ce qui remplace un plan thématique par une chronologie ; (4) chaque type de contenu (calculs, règles d'interface, règles métier) se retrouve dans 4 à 10 chapitres. Point fort réel : les 40 contrats d'écran suivent un gabarit à 20 rubriques identiques.

### Défauts

**QS-01 — Pas de table des matières, navigation intra-fichier quasi absente.**
Mesure : `grep -ciE "table des mati|sommaire"` = 0 sur les 13 chapitres ; 5 liens `](#…)` sur 15 565 lignes. ch13 compte 4 343 lignes et 832 titres H3 ; son « Inventaire des contrats actifs » (ch13:212) n'est pas cliquable :
```
| CE-T03-01 | Catalogue des séances — état T03 |
```
Référentiel : ISO/IEC/IEEE 29148:2018 §5.2.6, caractéristique « comprehensible » d'un ensemble d'exigences ; IREB CPRE FL : structuration des documents d'exigences (chapitre « work products », section à vérifier).
Conséquence : le développeur ne peut atteindre un contrat qu'avec la recherche texte. Les 20 sous-titres « ### 1. Identification » … « ### 20. Recette déterministe » sont répétés 40 fois : sans ancres uniques, ils sont indiscernables dans un plan généré.

**QS-02 — Numérotation et hiérarchie des titres incohérentes.**
Exemples vérifiés :
- ch08 : `# 2 bis.` (ch08:184), puis `# 4.` (ch08:801) suivi de `# 6.` (ch08:1328), sans section 5 ; `### 8.x Générateur de phrase de synthèse v13` (ch08:1802) ; numérotation locale `### 3. Concepts et invariants` (ch08:691) dans une section non numérotée.
- ch09 : `# 09.14 Extension du modèle` (ch09:594) placé avant `# 09.7.1 Résultat d'Exercice exécuté` (ch09:619).
- ch03 : deux `# Parcours complémentaire 3` (ch03:236 et ch03:258).
- ch10 : deux `## 12.` (ch10:170 « Langue, terminologie… » et ch10:215 « Règles métier — Exécution directe… »).
- ch05, ch11 et ch12 n'ont aucun H1 ; ch12 numérote jusqu'à `## 12.38` (ch12:1475), puis enchaîne 15 sections H2 non numérotées et datées (ch12:1483–1613).
Référentiel : ISO/IEC/IEEE 29148 §5.2.6 (comprehensible) ; INCOSE GtWR v4, C13 « Comprehensible » (caractéristique d'ensemble, numérotation à vérifier).
Conséquence : on ne peut pas citer une section de façon stable (« ch08 §5 » n'existe pas) ; les numéros ne permettent pas de deviner l'emplacement d'un sujet.

**QS-03 — Organisation chronologique par ajouts datés au lieu d'un plan thématique.**
Exemples : ch02:227 `## Besoins consolidés — 26 septembre 2026`, ch02:231 `## Paramètres d'exécution — complément du02/10/2026`, ch02:239 `## Conception de planification du 08/10/2026`. Le même titre « Paramètres d'exécution — complément du02/10/2026 » se trouve aussi en ch03:532 et ch05:268. Le registre ch07 contient 23 sections datées (ch07:190 → ch07:614).
Référentiel : ISO/IEC/IEEE 29148 §5.2.6 (comprehensible) ; IREB CPRE FL, gestion des versions et des changements (le versionnage appartient à la gestion de configuration, pas à la structure du document ; chapitre à vérifier).
Conséquence : pour connaître le besoin courant sur un sujet, il faut lire le chapitre jusqu'au bout, car une section ajoutée plus tard peut modifier une section antérieure sans que celle-ci le signale.

**QS-04 — Les types de contenu n'ont pas de « domicile » unique : besoins, règles, interface et technique sont mêlés.**
Exemples :
- Une règle de comportement écrite dans le chapitre des besoins, ch02:222 : « Dans la Composition, ajouter explicitement une récupération, en modifier la durée et la retirer. À 0 s ou en son absence, aucune information de récupération… »
- Une règle de présentation visuelle écrite dans le chapitre des règles métier, ch10:615 : « Présentation d'Annuler : capsule sans contour, blanc transparent à 90 %, demi-cercles, marges droite/haut/bas égales. »
- La formule de durée est placée dans le modèle de données (ch09:66 DM-002), dans les contrats d'écran (ch13:179, ch13:3105) et dans la vision (ch01:77).
- ch12 « Architecture technique » contient `## Interface générale — règles du 08/10/2026` (ch12:1579) et `## Pauses et symboles` (ch12:1547).
- ch10:7 annonce : « Le détail visuel et les interactions écran par écran restent définis dans le chapitre 06 », alors qu'INDEX.md indique « Les captures sont centralisées au chapitre 06, les contrats d'écran au chapitre 13 ».
Référentiel : IREB CPRE FL, séparation des niveaux d'exigences (but / exigence / solution) ; ISO/IEC/IEEE 29148 §5.2.5 « appropriate » (niveau d'abstraction adapté).
Conséquence : le développeur ne sait pas quel chapitre fait autorité, et une règle modifiée à un endroit reste ancienne ailleurs (voir QS-12).

**QS-05 — Une partie du contenu normatif se trouve hors des 13 chapitres, alors que l'INDEX affirme le contraire.**
INDEX.md : « Les annexes de spécification et de consolidation ont été réintégrées aux chapitres concernés. » Pourtant les chapitres pointent vers 11 documents hors chapitres (`grep -ohE "\]\(\.\./[^)#]+"`, avec par exemple 10 liens vers DSF-CARTES-ICONES-APPUIS et 8 vers DSF-INTERFACE-GENERALE), et des règles RG-10..RG-13 ne sont définies, sous forme de tableau, que dans `docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md:123-126`. Le contrat CE-UI-10 renvoie à « DSF Bip », « DSF du 12/10 », « matrice Deux modes du13/10 », « Bip v2 », « v13 », « v15 », sans aucun lien.
Référentiel : ISO/IEC/IEEE 29148 §5.2.6 (complete, comprehensible) ; §5.2.8 (attribut « source », clause à vérifier).
Conséquence : le périmètre normatif n'est pas fermé, et le lecteur ne sait pas quels documents il doit lire.

### Points forts
- **Gabarit de contrat uniforme** : ch13:35-58 impose 20 rubriques (« Chaque contrat comporte **exactement les 20 rubriques suivantes** ») ; l'inventaire confirme 20 H3 dans chacun des 40 contrats. C'est la meilleure garantie d'utilisabilité du corpus.
- **Ordre de priorité des sources déclaré** (ch13:15-26 : décisions → modèle/règles → API → architecture → ch06 → ch13 → Figma), même s'il est daté (« jusqu'à D-255 », alors que le registre va au-delà de D-340).
- **Bonne densité d'ancres dans ch06 et ch10** (47 et 48), ce qui permet des liens stables vers des sous-sujets.

---

## 4. Dimension TRAÇABILITÉ

**Bilan : faible.** La traçabilité amont est impossible, car les besoins (ch02) n'ont aucun identifiant. Les décisions D-xxx sont abondamment citées, mais le lien entre une décision et la règle RM qu'elle crée manque presque toujours : 4 décisions sur 349 citent une RM, et 11 RM sur 182 sont citées hors du ch10. Les critères de recette n'ont pas d'identifiants stables : des contrats renvoient à des REC-xx que ce corpus ne définit nulle part, et trois familles « R01 / R-01 / R06 » sont homonymes. Des matrices de traçabilité existent hors du corpus normatif (docs/MATRICE-*), ce qui confirme que le besoin a été identifié sans que le résultat soit intégré.

### Défauts

**QS-06 — Les besoins ne sont pas identifiés (manque démontré).**
Recherche : `grep -noE "\b[A-Z]{1,4}(-[A-Z]{1,5})*-[0-9]{1,3}\b" ch02` ne renvoie que des références à d'autres familles (PRE-3, D-328, D-217, CE-UI-10, CE-UI-04). Exemple ch02:245-247 :
```
## Besoins couverts par les formats
Composer un protocole sans ressaisir ses constantes ; choisir l'organisation lorsqu'elle est autorisée ; connaître la durée calculable avant départ ; …
```
Référentiel : ISO/IEC/IEEE 29148 §5.2.8 (attribut « identification ») ; IREB CPRE FL, traçabilité (section à vérifier).
Conséquence : on ne peut ni vérifier qu'un besoin est couvert par une règle ou un écran, ni tracer un critère de recette jusqu'à un besoin.

**QS-07 — Identifiants de règles absents, dupliqués ou homonymes.**
- 42 titres `### RM-` sans numéro, dans ch10:341 et suivants (`grep -cE "^### RM-\s*$"` = 42) :
```
<a id="fmt-01"></a>

### RM-
```
- Une même règle porte trois identifiants : RM-129 (ch10:72), DM-002 (ch09:66) et DM-015 (ch09:79) ont un texte identique (empreinte md5 de la cellule identique).
- Homonymes : « R-01 — Progression et estimation » (ch13:3088), « R-01 concerne les commandes du moteur à fenêtres » (ch13:4061), « R01 | Durée : 30 s, 45 s, échec… » (ch10:726). « R06 close : maximum58min55s » (ch13:3027) n'a pas de rapport avec « R06 | 12 bips proposés » (ch10:731).
- Identifiant cité mais jamais défini (manque démontré) : « supersédée le13/10 par EC-01/02 » (ch07:143) ; `grep -rnoE "\bEC-0[12]\b"` ne trouve que cette ligne.
Référentiel : ISO/IEC/IEEE 29148 §5.2.8 (identification unique) ; §5.2.5 « unambiguous » ; INCOSE GtWR v4, C3 « Unambiguous ».
Conséquence : un test ou un ticket qui cite « R-01 » ou « RM-… » ne désigne aucune règle de façon certaine.

**QS-08 — Les décisions ne mènent pas aux règles qu'elles créent.**
Mesure sur la colonne « Intégrée » des 349 lignes D-xxx à 4 colonnes : 149 valent « Oui/Non/vide », 149 sont un texte libre (« Oui — T03 », « Historique conservé dans Git ; référence active v12 »…), **4 citent une RM**, 30 un CE, 17 un chapitre. La colonne « Statut » prend **151 valeurs distinctes**.
Échantillon de 6 décisions :

| Décision | Statut affiché | Règle RM créée | Citée par l'écran qui l'applique ? | Observation |
|---|---|---|---|---|
| D-111 (ch07:143) | « Validée post-Figma » | aucune | non (citée uniquement dans ch07) | le texte dit « Disposition historique supersédée le13/10 par EC-01/02 » alors que le statut dit « Validée » ; EC-01/02 n'est défini nulle part |
| D-131 (ch07:163) | amendée le 06/10 | aucune | non : ch08:362-385 (« Durée estimée d'exécution » / « Durée synthétique ») l'applique sans la citer | citée seulement dans ch07 (6 fois) |
| D-214 (ch07:289) | « Révisée par Hermann — 12/10 » | RM-218 (ch10:268), mais ni D-214 ni RM-218 ne se citent l'une l'autre | oui : ch13 CE-T03-08 (ch13:940) et CE-EXEC-SESSION-01 | le texte est recopié dans 9 chapitres (ch01:163, ch02:229, ch04:391, ch06:2408, ch08:1788, ch10:268, ch10:676, ch13:171…) ; RM-218 n'est jamais citée hors ch10 |
| D-217 (ch07:292) | Validée | aucune visible | 1 fois dans ch13 (ch13:2733) | citée dans 7 chapitres |
| D-247 (ch07:370) | Validée | aucune ; cité comme « version » de DM-015 | non : CE-UI-10 ne cite aucune D ni RM | colonne Intégrée : « C1/C4–6/C8/C11/C19–20, prompt§4.1–4.2 », qui renvoie à un prompt hors corpus |
| D-338 (ch07:549) | « Validée ; évolution ouverte hors PRE-3 » | aucune | non : CE-UI-10 §5 (ch13:2973) l'applique (« clause de pauses variables omise conformément au corpus ») sans la citer | seul exemple dont la colonne Intégrée donne une destination (« chapitre 08, Phrase de synthèse ») |

Bilan de l'échantillon : 0/6 décisions mènent à une RM identifiée, 2/6 sont citées par le contrat d'écran concerné, et 1/6 a un statut contradictoire avec son texte.
Référentiel : ISO/IEC/IEEE 29148 §5.2.8 (attributs « rationale », « trace », clause à vérifier) ; IREB CPRE FL, traçabilité entre exigences et décisions.
Conséquence : pour savoir si une décision est appliquée et où, il faut faire une recherche plein texte, et le résultat dépend de la formulation recopiée.

**QS-09 — Les contrats d'écran ne citent pas leurs règles sources (3 contrats échantillonnés).**
Inventaire des sections `## CE-` de ch13 (script awk comptant les D-xxx et RM-xxx par section) : sur 40 contrats, **38 contiennent 0 RM** (les 6 occurrences de RM dans ch13 se trouvent dans §2, CE-T03-08 et §6).

| Contrat | Lignes | D cités | RM cités | Critères de recette |
|---|---|---|---|---|
| CE-UI-10 (ch13:2949-3064) | 116 | 0 | 0 | §20 en prose, sans ID ni résultat attendu par cas ; renvoie à « 276 gabarits v15 » |
| CE-FMT-04 (ch13:3811-3892) | 82 | 0 | 0 | ch13:3891 « REC-08, 18 » : non définis dans le corpus (manque démontré : `grep -rnoE "\bREC-[0-9]+"` sur les 13 chapitres ne trouve que les références de ch13 et API-COM-REC-01..05 de ch11, une autre famille ; les 28 cas du ch10:755-782 n'ont pas d'ID). La définition n'apparaît que dans `docs/MATRICE-FORMATS-SEANCES-2026-10-14.md`, hors corpus normatif |
| CE-T03-08 (ch13:916-1019) | 104 | 8 | 2 (RM-151/152) | prose « Tester … », sans résultat attendu |

Référentiel : ISO/IEC/IEEE 29148 §5.2.5 « verifiable » ; IREB CPRE FL, traçabilité exigence ↔ test.
Conséquence : un testeur ne peut pas relier un échec de recette à la règle violée, et un changement de règle ne permet pas de retrouver les contrats à revalider.

### Points forts
- **ch10 définit des scénarios de recette chiffrés** (ch10:619-633 : cas A–F avec résultats numériques, par exemple « A | Unilatéral ; cibles30/45/60s ; Pauses10/20/30s | 135+10+20+30=195s =3min15s »). Ce sont des critères vérifiables au sens de 29148 §5.2.5.
- **Le registre ch07 conserve les ID non utilisés** (ch07:10-18 : « ne doivent pas être réattribués, afin de préserver la traçabilité »).
- **Plusieurs décisions récentes indiquent leur destination** (D-336 → « CE-UI-1… », D-338 → « chapitre 08, Phrase de synthèse »).

---

## 5. Dimension MAINTENABILITÉ

**Bilan : faible.** La règle de calcul de durée, centrale, est recopiée à l'identique au moins 14 fois dans 8 chapitres plus PRODUCT.md, sous trois identifiants différents. 194 copies de longs paragraphes sont redondantes. Le contenu remplacé reste dans les chapitres actifs (384 mentions « historique », 196 « remplac »), signalé par 63 marqueurs gras datés posés en tête de rubrique plutôt que par une réécriture de la règle. Le registre ch07 gère correctement les remplacements de décisions, mais avec un statut en texte libre (151 variantes). Une modification de règle demande donc une propagation manuelle dans 10 fichiers, et des divergences sont déjà observables (QS-12).

### Défauts

**QS-10 — Une règle centrale existe en multiples copies, sans référence unique.**
Bloc « Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; … Aucun calcul issu de Figma ou d'Excel. » : 14 occurrences (ch01:77, ch04:104, ch08 ×4, ch09 ×3, ch10:72, ch11:73, ch13:179, ch13:3105) + PRODUCT.md. Dans ch08, la même cellule (917 caractères) sert de description à **trois règles différentes** (ch08:1584 « Durée totale calculée », ch08:1585 « Durée totale pilotée », ch08:1587 « Modes non chronométrés » ; empreinte md5 identique) :
```
| Durée totale pilotée | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; …
```
La règle propre à « Durée totale pilotée » (l'inversion) n'y figure pas : elle se trouve en ch10:615.
ch10 contient lui-même deux fois le tableau des formules (ch10:605-609 et ch10:664-668).
Référentiel : ISO/IEC/IEEE 29148 §5.2.6 « consistent » ; INCOSE GtWR v4, C5 « Singular » et C11 « Consistent » (numérotation à vérifier).
Conséquence : un développeur qui implémente « Durée totale pilotée » d'après ch08 n'implémente pas l'inversion. Toute correction de formule doit être reportée à 15 endroits.

**QS-11 — Les ajouts datés recouvrent les rubriques au lieu de les réécrire.**
Exemple ch13:2955-2957 (CE-UI-10 §1) :
```
Feuille Paramètres d'exécution de CE-T03-04. Références courantes :8328:37092,… ; les autres états du12/10 restent applicables. … Les références6419/6665/7059/7069 du07/10 sont historiques.
```
et ch13:2971 (§5) : « **Complément cible12/10 :** Contexte de l'occurrence et compte hérité ; total dérivé, jamais source de N dans ce contexte. » Le marqueur « Complément cible12/10 » apparaît 13 fois dans ch13. Dans CE-UI-10, 6 rubriques sur 20 combinent un texte de base et un ou plusieurs compléments datés.
Référentiel : ISO/IEC/IEEE 29148 §5.2.6 « comprehensible » ; IREB CPRE FL, versionnage et gestion des changements (section à vérifier).
Conséquence : le lecteur doit fusionner mentalement la base et les compléments. Les compléments ne disent pas quelle phrase de la base ils remplacent (« restent applicables »).

**QS-12 — Une révision non propagée crée des divergences dans le même chapitre (illustration).**
ch13:2999 (CE-UI-10 §9) : « Les anciennes indentations systématiques x52 des contrôles variables sont remplacées par la grille à cellules décrite dans le DSF du 12/10. »
ch13:4253 (section commune « Implantation du bip ») : « Les sous-lignes Séries variables/cible/Pause et Ordre/PC restent indentées x52, séparateurs314px. »
Autre cas : la règle d'ordre des sources (ch13:19) s'arrête à « jusqu'à D-255 », alors que les décisions applicables à l'écran vont jusqu'à D-346 (ch07:564).
Référentiel : ISO/IEC/IEEE 29148 §5.2.6 « consistent ». Le détail des contradictions est laissé à la passe cohérence.
Conséquence : deux règles opposées coexistent dans le même chapitre, et le corpus ne dit pas laquelle s'applique.

**QS-13 — Le statut des décisions est en texte libre et la règle remplacée reste dans le texte actif.**
151 valeurs distinctes de « Statut » (par exemple « Révisée par D-x le 03/10/2026 ; ancienne règle d'affichage ci-contre historique ; autres dispositions conservées »). D-111 (ch07:143) a le statut « Validée post-Figma » alors que son texte commence par « Disposition historique supersédée le13/10 ». ch07:143 : « **Amendée le06/10 : voir D-268 à D-298 … autres dispositions conservées.** » ne précise pas quelles dispositions restent actives.
Référentiel : ISO/IEC/IEEE 29148 §5.2.8 (attribut d'état / statut, clause à vérifier) ; IREB CPRE FL, attributs d'exigence.
Conséquence : on ne peut pas filtrer les décisions actives. Il faut lire chaque ligne et toutes ses successeuses.

**QS-14 — Lisibilité dégradée par la suppression systématique d'espaces.**
Exemples : ch13:3027 « Cibles chiffrées : N1..99,Ri1..100,Ti5..3535s,Pauses0..300s,Bip entier0..10 dans deux modes » ; ch02:231 « complément du02/10/2026 » (vérifié avec `od -c` : aucun caractère entre « du » et « 0 »).
Référentiel : ISO/IEC/IEEE 29148 §5.2.7 (langage des exigences) ; INCOSE GtWR v4, C13 « Comprehensible » (numérotation à vérifier).
Conséquence : risque de mauvaise lecture des bornes (« Ri1..100 » : Ri = 1..100) et recherche texte inefficace (« du 12/10 » ne trouve pas « du12/10 »).

### Points forts
- **Registre de décisions avec chaînage des remplacements** (« Supersédée par D-x » : 18 + 6 + 5 lignes ; « **HISTORIQUE SUPERSÉDÉ LE 08/10/2026 PAR D-328** » sur D-117/118/120/122/201/207).
- **Principe d'autorité explicite** : INDEX.md et ch13:4057-4063 indiquent que Figma illustre et ne définit pas les calculs. Cela limite une source de dérive.

---

## 6. Dimension UTILISABILITÉ

**Bilan : faible.** Les deux tests concrets montrent qu'un développeur doit consulter 9 à 10 chapitres et plusieurs documents externes, et parcourir de l'ordre de 1 000 lignes, pour reconstituer les exigences d'un seul écran ou d'un seul calcul. Il ne peut pas conclure sans arbitrer lui-même des passages qui divergent. Côté testeur, les critères existent, chiffrés pour le calcul, mais ils sont répartis entre ch10 et ch13, en prose ou sous des identifiants non uniques.

### Test (a) — Développeur : écran CE-UI-10 « Paramètres d'exécution — feuille basse »

Commande de départ : `grep -c "CE-UI-10" *.md` donne une mention dans **les 13 chapitres** (ch13 : 18, ch08 : 11, ch07 : 9, ch06 : 8, ch12 : 5…).

| # | Emplacement | Contenu nécessaire | Lien explicite depuis CE-UI-10 ? |
|---|---|---|---|
| 1 | ch13:2949-3064 | contrat (20 rubriques) | — |
| 2 | ch13:60-211 (§4 Règles communes T03, dont §4.6 roulettes ch13:123 et §4.14 cadence ch13:198) | voile, roulettes, steppers | non |
| 3 | ch13:28-33 (« Portée transverse des paramètres v13 ») | périmètre des durées | non |
| 4 | ch13:4065-4115 (`editeur-parametres`), 4247-4260 (`controle-bip`), 4259-4272 (`rendu-phrase`) | règles communes de l'éditeur, steppers, rendu de la phrase | non ; divergence x52 (QS-12) |
| 5 | ch13:534-653 (CE-T03-04, parent) et ch13:3811-3892 (CE-FMT-04, « Complète CE-UI-10 ») | contexte parent et variante format | référence inverse seulement |
| 6 | ch08:232-262 (`#parametres-exercice`, « v13 »), ch08:1545-1590 (tableau des champs), ch08:607-686 (phrase v15), ch08:1802-1833 | modèle, bornes, brouillon, phrase | « v13 » seulement, sans lien |
| 7 | ch10:593-743 | formules, inversion, résultats temporels, recettes R01-R16 | non (« total fourni par le calcul métier ») |
| 8 | ch07 D-246..D-255, D-336..D-346, §602-613 « Deux modes » | arbitrages fins (accélération, animations, Annuler) | non |
| 9 | ch06:1113-1260 | 19 états illustrés | « Captures au chapitre06 » |
| 10 | ch09:60-80 (DM-002/015), modèle `executionMode` | persistance | non |
| 11 | ch11:352 API-PARAM-01 | bornes côté API | non |
| 12 | ch12:886, 1380-1383 | jeton `overlayScrim` | non |
| 13 | DSF-DEUX-MODES-ECHEC, DSF-BIP-CADENCE, DSF-SERIES-VARIABLES, DSF-CIRCUITS-CONTROLES, DSF-PHRASES-V15 | tailles, opacités, steppers, 276 gabarits | désignés par alias (« DSF Bip », « DSF du 12/10 », « v15 »), sans lien |

**Bilan du test (a).** 10 chapitres et au moins 5 documents DSF, soit environ 1 100 lignes à lire (116 + 152 + 75 + 202 + environ 210 + environ 150 + environ 60 lignes de ch07 + environ 150). Estimation : **une demi-journée** pour un développeur qui découvre le corpus (estimation, non mesurée).
Ce qui manque pour conclure :
- l'ordre de priorité entre le contrat et les sections communes postérieures de ch13 (x52) ;
- le sens de « v13 », « v15 », « Bip v2 » (47 occurrences de « Bip v2 », aucune définition ni aucun titre : `grep -E "^#+ .*Bip v2"` = 0) ;
- la liste des décisions applicables, puisque la règle ch13:19 s'arrête à D-255 ;
- la référence de la rubrique 9 « Seul le placement de la mention/astérisque du nombre hérité reste sans référence visuelle identifiée » (ch13:2997, fin de paragraphe), qui reste ouverte.

### Test (b) — Développeur : calcul de la durée totale d'un Exercice

`grep -ci "durée totale"` : présent dans 12 chapitres sur 13. Emplacements utiles :
- **ch10:593-743** est la source la plus complète : ordres de phases, tableau des formules (deux fois), inversion, résultats temporels, extension Circuit, cibles mixtes.
- ch10:72 et ch10:75 (RM-129, RM-132), ch09:66 et ch09:79 (DM-002, DM-015) : copies.
- ch08:362-385 (§3.9 : deux métriques, définitions de périmètre), ch08:609 (« Format d'affichage des durées »), ch08:643 (« Côtés et durée »), ch08:1584-1587 (copies fautives, QS-10).
- ch13:179, ch13:3088-3105 (§6 « R-01 — Progression et estimation »), CE-UI-10 §8/§12/§19.
- ch07 : D-008, D-070, D-090, D-112, D-131, D-268..D-298 (cadence et incertitude).
- ch01:77, ch04:104, ch11:73 (API-ACT-02), PRODUCT.md : copies.

**Bilan du test (b).** 10 chapitres plus PRODUCT.md. Le contenu est au fond suffisant (formules, cas chiffrés), mais :
1. Rien n'indique que ch10:593 est la référence. ch10 lui-même renvoie à un prompt : « Cette clarification explicite du propriétaire remplace les passages contraires du prompt précédent » (ch10:662), « Conformément au prompt » (ch10:674).
2. Le périmètre (Catalogue, Composition, plan complet) se trouve dans ch08:362-385 et non dans ch10.
3. Il faut vérifier soi-même que les 14 copies sont identiques : elles le sont pour le bloc principal (md5), mais ch08:1585 donne un contenu erroné à « Durée totale pilotée ».

Estimation : 1 à 2 heures pour identifier la source fiable et s'assurer qu'aucune autre version ne la contredit (estimation).

### Côté testeur

| Objet | Où sont les critères | Forme | Problème |
|---|---|---|---|
| CE-UI-10 | ch13:3053-3061 (§20) | prose (« Tester30s → toucher échec →00:00 grisé → tourner vers30s → cible numérique ») + « Complément cible12/10 » | pas d'ID, résultats attendus partiels, renvoi à « 276 gabarits v15 » hors corpus |
| CE-UI-10 (calculs affichés) | ch10:617-633 (A–F, Uniforme, Bilatéral…), ch10:722-742 (R01–R16) | tableaux chiffrés | non référencés depuis CE-UI-10 ; « R06 » homonyme dans CE-UI-10 §14 |
| Durée totale | ch10:617-633, ch10:686 (tests Circuit en prose : « Ti30,Pi10,PC5 → passage bilatéral75s »), ch10:722-742 | tableaux et prose | trois blocs sans identifiants stables, sans lien vers RM-129 |
| CE-FMT-04 | ch13:3891 « REC-08, 18 » | ID pendants | les 28 cas de ch10:755-782 ne portent pas d'ID (manque démontré, QS-09) |

Le testeur trouve des valeurs attendues fiables pour le calcul (point fort), mais doit lui-même construire la correspondance écran ↔ cas ↔ règle.

### Défaut synthétique

**QS-15 — Aucune vue « par écran » ni « par calcul » des exigences applicables.**
Démontré par les tests (a) et (b) ci-dessus. Le contrat déclare en ch13:9 « Il transforme les décisions produit, règles métier, modèle de données, API fonctionnelles, architecture, Design System Figma et frames de référence en comportements directement exploitables par le développement et la recette », mais CE-UI-10 ne cite aucune règle (0 D, 0 RM) et renvoie à des alias non résolus.
Référentiel : ISO/IEC/IEEE 29148 §5.2.6 « comprehensible » et « able to be validated » ; IREB CPRE FL, traçabilité.
Conséquence : chaque développeur ou testeur reconstitue sa propre carte du sujet, avec des résultats potentiellement différents d'une personne à l'autre.

### Points forts
- Le **contrat CE-UI-10 est dense et précis** sur les états, la validation (§14 : bornes chiffrées, « aucune correction silencieuse ») et l'accessibilité (§18). Une fois trouvée, l'information est le plus souvent exploitable.
- **ch10:637 `#resultats-temporels`** fournit un tableau « Périmètre / Mode / Bip / Retour / Rendu » directement implémentable et testable.

---

## 7. Écart au format OpenSpec (convention d'outil)

Hors périmètre qualité. Le corpus n'utilise pas les blocs `### Requirement:` / `#### Scenario:` ; ce constat n'est **pas** compté comme un défaut. Les recommandations ci-dessous sont indépendantes de ce format.

---

## 8. Recommandations priorisées

| Priorité | Recommandation | Défauts traités | Effort |
|---|---|---|---|
| P1 | Désigner **un domicile unique par règle** : ch10 pour les règles et calculs, ch13 pour les comportements d'écran, ch09 pour les données. Remplacer les 14 copies du bloc de durée par un renvoi « voir RM-129 » ; fusionner DM-002, DM-015 et RM-129. Corriger ch08:1585 (« Durée totale pilotée » → renvoi à la règle d'inversion ch10:615). | QS-04, QS-10, QS-15 | moyen |
| P1 | Numéroter les 42 `### RM-` vides de ch10:341 et suivants (par exemple à partir de FMT-01..42, ancres déjà présentes) ; supprimer les homonymes R-01 / R01 / R06 en préfixant par famille (RES- pour les réserves, TST- pour les recettes). Définir ou retirer EC-01/02 et REC-xx. | QS-07, QS-09 | faible |
| P1 | Ajouter dans chaque contrat CE une **rubrique « Règles applicables »** (liste RM, D, DM, API) et donner aux critères de recette des ID stables avec résultat attendu. | QS-09, QS-15 | moyen |
| P2 | Ajouter une table des matières générée et une ancre par contrat CE dans ch13 (`<a id="ce-ui-10">`), ce qui corrige aussi les 46 liens cassés de ch06. Rendre cliquable l'inventaire ch13:212. | QS-01, liens §2.5 | faible |
| P2 | Réécrire les rubriques à compléments datés en texte consolidé ; déplacer l'historique dans le registre ch07 ou dans Git ; normaliser le statut ch07 en vocabulaire fermé (Active / Amendée / Remplacée par D-xxx / Retirée) avec une colonne « Destination » (RM/CE/DM). | QS-03, QS-11, QS-13, QS-08 | fort |
| P2 | Donner un identifiant aux besoins de ch02 (B-xx) et ajouter une matrice B → RM → CE → recette dans le corpus (les MATRICE-* externes peuvent servir de point de départ). | QS-06, QS-08 | moyen |
| P3 | Remplacer les alias « v13 », « v15 », « Bip v2 », « DSF Bip », « DSF du 12/10 » par des liens explicites, ou intégrer leur contenu normatif. Mettre à jour INDEX.md (périmètre réellement normatif) et ch13:19 (« jusqu'à D-255 »). | QS-05, QS-12 | moyen |
| P3 | Restaurer les espaces manquants (« du02/10 », « N1..99,Ri1..100 ») par un remplacement contrôlé. Corriger la numérotation (ch08 §5 manquant, ch09 09.14/09.7.1, ch03 « 3 » en double, ch10 « 12. » en double, H1 absents de ch05/11/12). | QS-02, QS-14 | faible |

---

## 9. Exemples AVANT / APRÈS

### Exemple 1 — Trois règles avec le même texte (ch08:1584-1587)

**AVANT** (ch08:1585, extrait) :
```
| Durée totale pilotée | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. …
```
(texte identique pour « Durée totale calculée » ligne 1584 et « Modes non chronométrés » ligne 1587)

**APRÈS** :
```
| Durée totale calculée   | Valeur calculée selon RM-129 (formules) et RM-132 (nature exact / ≈ / ≥ / absente). Non saisie. |
| Durée totale pilotée    | Saisie possible uniquement en mode Durée, séries identiques et nombre de séries libre : le nombre de séries est recalculé selon la règle d'inversion [RM-130]. Sinon, lecture seule. |
| Modes non chronométrés  | Répétitions sans bip ou toutes cibles À l'échec : aucune ligne de total (résultat « omitted ») selon RM-132. |
```
Aucune règle nouvelle : les contenus proviennent de ch10:72-75 (RM-129, RM-130, RM-132) et ch10:615.

### Exemple 2 — Règle sans identifiant (ch10:339-343)

**AVANT** :
```
<a id="fmt-01"></a>

### RM-

**— Format appliqué.** Une séance peut porter Tabata, Intervalles 30/30, EMOM, AMRAP, For time ou Death by. …
```
**APRÈS** :
```
<a id="fmt-01"></a>

### RM-[À CONFIRMER : numéro] — Format appliqué
Source : FMT-01. Écrans : CE-FMT-01, CE-FMT-02. Recette : [À CONFIRMER : ID du cas ch10 §« Cas de recette des formats »].
Une séance peut porter l'un des formats suivants : Tabata, Intervalles 30/30, EMOM, AMRAP, For time, Death by. Ce champ détermine des contraintes et un comportement d'exécution. Une séance libre ne porte aucun format contraignant.
```
Les rattachements aux écrans s'appuient sur les titres de ch13 (CE-FMT-01 « Choix du modèle et du format »). Ils restent à confirmer par l'auteur.

### Exemple 3 — Recette de CE-UI-10 en prose (ch13:3055)

**AVANT** :
```
Recette complémentaire : deux options, ouverture valeur/échec courant, exclusion mutuelle,00:00 cible refusée (pause0 valide), tout échec sans total, mixte30/45/échec avec pauses10/20/30 →≥2min15 en lecture seule, Répétitions sans bip sans total ; …
```
**APRÈS** :
```
| ID          | Règle   | Préconditions                                              | Action                       | Résultat attendu                                  |
|-------------|---------|------------------------------------------------------------|------------------------------|---------------------------------------------------|
| TST-UI10-01 | RM-132  | Mode Durée ; cibles 30 s, 45 s, À l'échec ; pauses 10/20/30 s | Ouvrir la feuille            | Total affiché « ≥ 2 min 15 », en lecture seule     |
| TST-UI10-02 | RM-132  | Mode Durée ; toutes cibles À l'échec                        | Ouvrir la feuille            | Aucune ligne de total                              |
| TST-UI10-03 | RM-132  | Mode Répétitions ; bip 0 ; cibles chiffrées                 | Ouvrir la feuille            | Aucune ligne de total                              |
| TST-UI10-04 | [À CONFIRMER : RM] | Cible numérique                                 | Sélectionner 00:00 comme cible | Validation ✓ refusée ; pause 0 s reste acceptée   |
```
Valeurs reprises de ch13:3055 et ch13:3027. Le rattachement RM-132 s'appuie sur ch10:75. La règle du refus de 00:00 n'a pas d'ID RM repéré dans l'échantillon lu.

### Exemple 4 — Référence de recette pendante (ch13:3891)

**AVANT** :
```
REC-08, 18 ; vérifier absence d'éditeur sur les quatre constantes et absence de tiret ; contrôle des segments et de l'unité tour.
```
**APRÈS** :
```
Cas de recette : [TST-FMT-08](10 – Processus métier….md#tst-fmt-08) « Ouvrir la modale Tabata → quatre valeurs réelles grisées, non éditables ; raison visible » ; [TST-FMT-18] « Phrase For time → texte exact validé ; segments/gras conformes ».
Vérifications propres à l'écran : aucun éditeur ne s'ouvre sur les quatre constantes ; aucune constante n'est remplacée par un tiret.
```
Correspondance REC-08 → 8e ligne et REC-18 → 18e ligne du tableau ch10:755-782 : **[À CONFIRMER]**. C'est une déduction par rang, et le corpus ne la garantit pas.

---

## 10. Manques démontrés vs sujets à confirmer

**Manques démontrés (recherche exhaustive sur les 13 chapitres)**
- Aucune table des matières (`grep -ciE "table des mati|sommaire"` = 0).
- Aucun identifiant de besoin dans ch02 (grep d'ID, §QS-06).
- 42 titres de règle `### RM-` sans numéro (ch10).
- EC-01/02 cité (ch07:143) et jamais défini.
- REC-xx cités (ch13:3645, 3727, 3809, 3891, 3973, 4055) et jamais définis dans les chapitres.
- « Bip v2 » cité 47 fois, sans titre ni lien qui le définisse.
- 46 liens sur 106 vers des ancres inexistantes (ch06 → ch13 `#ce-fmt-0x`).
- RM-129 et RM-218 ne sont cités nulle part hors ch10.
- 38 contrats sur 40 ne citent aucune RM.

**Sujets à confirmer**
- Les DSF-*.md et les « v13 / v15 » sont-ils normatifs ? INDEX.md affirme une réintégration complète ; à trancher par le propriétaire.
- Les autres familles (PRE, CAD, CIR, V, H, N…) n'ont pas été auditées en détail ; leurs définitions peuvent exister ailleurs.
- La correspondance REC-xx ↔ lignes du tableau ch10:755-782.
- Les estimations de temps des tests (a) et (b) sont des ordres de grandeur, non des mesures chronométrées.
- La complétude globale des règles n'est pas évaluée (lecture partielle).
