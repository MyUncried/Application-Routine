# Rapport de clôture des 14 réserves — 17/10/2026

- **Départ :** `0a8d6656` (publié).
- **Branche :** `docs/openspec-revision`, sans merge vers `main`.
- **État soumis à revue indépendante :** rien n'est déclaré clos ni certifié.
- **Réserves traitées :** celles du tableau « Points encore indéterminés » d'[arbitrages.md](arbitrages.md), section « Après les arbitrages du 16/10 ».

## Méthode

1. **Qualification.** Trois analyses en lecture seule (R1 : réserves 1 à 5 ; R2 : 6 à 10 ; R3 : 11 à 14), sur un brief commun. Pour chaque réserve : passages exacts, décisions applicables (version, statut, portée), recherche d'une décision existante, qualification, correction minimale ou question.
2. **Revue par Claude de chaque proposition**, avec vérification directe des preuves décisives :
   - historique de la borne D-255 ;
   - RM-232, RM-233 et RM-145 à RM-147 ;
   - CIR-03 et CIR-09 ;
   - renumérotation RM-101 → RM-159.

   Ajouts de la revue :
   - **R11d** : la phrase d'INDEX renvoyant aux points non arbitrés, devenue sans objet ;
   - **R2-05** : référence obsolète de D-090.
3. **Application** par `outils/appliquer-lot5.mjs` : 31 corrections, chacune unique au moment de son application. Fichiers : [constats/RES14-corrections.json](constats/RES14-corrections.json) et [constats/RES14-complement-corrections.json](constats/RES14-complement-corrections.json).
4. **Seconde passe distincte :**
   - rejeu indépendant des 31 corrections sur `0a8d6656`, avec comparaison au disque ;
   - recherche de variantes résiduelles ;
   - liens Markdown et chemins Unicode ;
   - fusions simulées avec les PR.

## Qualifications utilisées

- **CR** : contradiction réelle
- **DP** : différence de périmètre ou d'état
- **FO** : référence ou formulation obsolète
- **RV** : report volontaire
- **DM** : décision produit manquante

## Réserve par réserve

| # | Réserve | Statut initial | Preuves examinées | Qualification | Correction effectuée ou motif de non-correction | Fichiers | Statut final | Décision attendue de Hermann |
|---|---|---|---|---|---|---|---|---|
| 1 | Borne « jusqu’à D-255 » (ch. 13 §2) | À arbitrer | `3ab664f4` (30/09) : « jusqu’à D-239 », alors que D-239 est la dernière décision du registre ; `117bedcb` (03/10) : « jusqu’à D-255 », alors que D-255 est la dernière ; PRODUCT §13 rang 1 sans borne ; le ch. 13 applique déjà des décisions postérieures (dont D-376) | **FO** — repère daté de la dernière décision connue, non une restriction (faux arbitrage) | Borne retirée au ch. 13 §2 ; la mention et le point non arbitré sont retirés d'INDEX (R11a à R11d) | ch. 13, INDEX.md | **RÉSOLU** | — |
| 2 | Persistance de la Composition : ch. 08 §3.10 « enregistrées automatiquement » contre CE-T03-08 §15 « Continuer seul persiste » | À arbitrer | Aucune D-xxx ni RM ne fixe le moment de la persistance. Vont dans le sens de `Continuer` : ch. 06:329, ch. 08 l. ~342 et ~581, CIR-03 « réserve de séance jusqu’à enregistrement », D-123 (libellé et activation). Seule la puce du 06/08 (ch. 08 §3.10) dit le contraire. | **CR** sans décision (**DM**) | Aucune modification de règle ; le marquage `À CLARIFIER` posé le 16/10 est conservé | — | **À ARBITRER** | **A1** |
| 3 | Action « ignorer un exercice » (ch. 03) | À arbitrer | D-028 : « L'écran d'exécution ne comporte que trois commandes : Réinitialiser, Pause/Reprendre et Exercice suivant » ; D-053 : `Partielle` est « l’unique vocabulaire métier » pour un Exercice passé avant son terme ; la même liste du ch. 03 contient déjà « passer directement à l’exercice suivante » et « terminer un exercice avant son terme » | **FO** (faux arbitrage) | Puces « ignorer un exercice » et « les exercices ignorées » retirées ; « exercice ignorée » remplacé par « exercice passé avant son terme » (R13a à R13c) | ch. 03 | **RÉSOLU** | — |
| 4 | `Continuer` lorsqu’une cible obligatoire manque | À arbitrer | D-123 : « Elle est seulement activée ou désactivée selon la validité de la Composition » ; D-380 : pas d’enregistrement ; RM-017 ; CE-T03-08 §14 ; ch. 08:350 « Les exercices incomplètes sont signalées » ; CIR-09 « aucun marqueur d’incomplétude » | **FO** pour l'activation ; **DM** pour la signalisation | `Continuer` désactivé dans ce cas (D-380, D-123) : RM-017, CE-T03-08, ch. 06, ch. 08, ch. 03 (R14a à R14e). Forme de la signalisation marquée `À CLARIFIER` (R14f). | ch. 03, 06, 08, 10, 13 | **RÉSOLU EN PARTIE** | **A2** |
| 5 | Nombre « N exercice(s) » sous le titre du Circuit | À arbitrer | D-382 ne vise que le total ; D-100 « compte et totalise » ; DSF Circuits du 12/10 « La durée agrégée est sous le titre » ; les captures du ch. 06 n’affichent plus de nombre (« 0 min », « ≥ 19 min ») | **DM** | Marquage `À CLARIFIER` (R15a) ; règle inchangée | ch. 08 | **À ARBITRER** | **A3** |
| 6 | Arrondi des totaux exacts et estimés des cartes | À arbitrer | D-090 et RM-159 : `Math.ceil` ; Q20 (≥ en min et s, sans arrondi) déjà reportée pour le total partiel ; la rectification de Q20 renvoie les totaux exacts et estimés à P41, qui n'est pas une décision ; code PRE-3 : « 2 min 45 s » pour 165 s | **DP** (documentation cohérente, écart avec l'état du code) | Aucune modification de règle. **Référence obsolète corrigée :** D-090 citait RM-101, renumérotée en RM-159 par `83634178` (14/09) ; correspondance ajoutée au statut (R2-05) | ch. 07 | **À ARBITRER** (choix produit) | **A4** |
| 7 | Q30 « l’Exercice lui-même n’affiche aucun total » contre D-384 « — » | À arbitrer | Q-K (b) avait été posée contre l’hypothèse H10 ; Hermann a choisi « — » pour la ligne Total de la feuille (D-384). Q30 traite de la contribution au total de Séance d’une Copie dont une cible ancienne est à renseigner. | **DP** (objets différents ; faux arbitrage) | Clarification ajoutée au ch. 10 : la Copie n’affiche elle-même aucun total (Q30) ; dans la feuille Paramètres, la ligne Total est affichée avec « — » (D-384) (R2-01) | ch. 10 | **RÉSOLU** | — |
| 8 | Q32 « 0 exercice » contre D-091 « 0 exercices » | À arbitrer | Même objet : carte de liste d’une Séance sans Exercice, au Catalogue ; Q32 ne nomme pas D-091 ; D-081 (pluralisation) | **CR** | Marquage `À CLARIFIER` au ch. 13 (R2-02) ; règle inchangée | ch. 13 | **À ARBITRER** | **A5** |
| 9 | Consultation vidéo dans l’éditeur sous Android | À arbitrer | Q27 nomme « lecteur natif iOS » ; le MVP vise iOS et Android (ch. 12) ; aucune règle « lecteur natif de la plateforme » ; l’Exécution utilise son propre plein écran | **DM** | Marquage `À CLARIFIER` au ch. 08 (R2-03) | ch. 08 | **À ARBITRER** | **A6** |
| 10 | Forme du signalement des Exercices écartés par la migration | À arbitrer | Q19 « simplement signalé » ; aucune Q ne fixe la forme ; seule l’hypothèse H24 la décrit | **DM** | Marquage `À CLARIFIER` au ch. 09 (R2-04) | ch. 09 | **À ARBITRER** | **A7** |
| 11 | Présentation liée à D-377 | À arbitrer | DSF du 12/10 et du 13/10 : ni contour des lignes à popover, ni sous-titre ni couleur d’Ordre des côtés, ni typographie des popovers | (a) **FO** ; (b) **DM** visuelle ; (c) non vérifiable sans Figma ; (d) **DP** (état de réalisation, faux arbitrage) | (a) jeton `color.selectionSubtitle` : même mention D-377 que ses voisins (R3-01) ; (b) règle de contour marquée `À CLARIFIER`, à vérifier dans Figma (R3-02), et marquage de RM-131 **reporté**, car cette ligne sert de contexte à la PR #370 ; (c) segmenté « Mode d’exécution » (ch. 13 l. ~117) non modifié ; (d) « pour la prochaine tranche » conservé | ch. 08, ch. 12 | **RÉSOLU EN PARTIE** | **V1** (vérification Figma, pas un arbitrage) |
| 12 | Besoin futur « bilatéralité d’un Circuit » (ch. 02 §8) | À arbitrer | D-209 ; RM-145 à RM-147, qui limitent l’interdiction à « la version actuelle » ; D-387 « sans supprimer implicitement les besoins futurs » | **DP** (besoin d’évolution contre règle actuelle) | Les deux phrases sont qualifiées « besoin d’évolution, non retenu dans la version actuelle (D-209, RM-145 à RM-147) » (R3-04, R3-05) ; besoin conservé | ch. 02 | **RÉSOLU EN PARTIE** | **A8** (conserver ou retirer le besoin) |
| 13 | D-012, D-048, D-058 : « Tour » au sens de conteneur | À arbitrer | Textes des trois décisions ; D-209 ; D-387 (correction générale des terminologies historiques) | **FO** | Même mention de statut que D-032 et D-077 (R3-06 à R3-08) | ch. 07 | **RÉSOLU** | — |
| 14 | Citations `À CLARIFIER` (D-232/D-246) et H-11 | À clarifier | RM-233 « Après la première sélection, aucun retour à l’état « aucun mode » » ; RM-232 « … sans persistance » ; ch. 08 `#phrases` et D-298 ; D-312 et D-386 pour les pas des steppers | **FO** | Renvois remplacés par la règle démontrée : ch. 08 (RM-233), ch. 09 ×2 (RM-232), ch. 08 « fragments conditionnels » (phrase de synthèse, RM-232, D-298), ch. 13 « pas » (D-312, D-386) (R3-09 à R3-13) | ch. 08, 09, 13 | **RÉSOLU EN PARTIE** | **A9** : fondement de « la ligne Total reste présente » (ch. 13), règle confirmée ou non. Le ch. 08 l. 1573 attend la PR #371. |

## Contrôles (seconde passe distincte)

| Contrôle | Résultat | Statut |
|---|---|---|
| Rejeu indépendant des 31 corrections sur `0a8d6656` | identique au disque | vérifié |
| Fichiers modifiés hors JSON | aucun | vérifié |
| Conservation des prescriptions | les seules règles dont la formulation change sont : `Continuer` (désactivé, D-123 + D-380), la liste des commandes du ch. 03 (D-028, D-053), la borne du ch. 13 §2 (formulation obsolète). Les autres corrections sont des renvois, des statuts ou des marquages `À CLARIFIER`. | vérifié |
| Décisions et statuts | statuts complétés : D-012, D-048, D-058 (D-387), D-090 (renvoi RM-159) ; aucun texte de décision réécrit | vérifié |
| Variantes résiduelles | aucune occurrence de « jusqu’à D-2nn », d’« exercice(s) ignoré(s) », ni de conditions de `Continuer` sans la cible obligatoire ; renvois D-232 restants : seulement « bornes conservées » (actif) | vérifié |
| Mentions résiduelles de D-246 | titres « Saisie des paramètres — D-246 » (ch. 01, 04, 08, 09) et ch. 08 l. 1573 (PR #371) | partiellement conforme : hors des 14 réserves, signalé pour le lot 6 |
| Propagation (chapitres, PRODUCT, INDEX, DSF, données, API, architecture) | `Continuer` aligné aux ch. 03, 06, 08, 10, 13 (ch. 01 déjà aligné le 16/10) ; INDEX cohérent | vérifié |
| Liens Markdown (`links.mjs`) ; chemins Unicode | 2 anomalies, inchangé ; aucun renommage | vérifié |
| Fusions simulées avec #363, #370, #371 | 0 conflit | vérifié |
| Rendu visuel (popovers, contour, segmenté « Mode d’exécution ») | Figma non consulté | **non vérifiable** dans ce clone |

## Dépendances

- **PR #363, #370, #371 :** têtes inchangées depuis le 16/10 (`d2386c8d`, `6cf3634a`, `2c050d0e`).
- **Signalement de la PR #371** revérifié sur `2c050d0e` : X-06, X-07, Q17, Q21 et Q25 sont toujours présents ([signalement-PR371-X06-X07.md](signalement-PR371-X06-X07.md)). Il n'est ni publié ni appliqué à la PR.
- **Source des décisions PRE-4 :** commit local `8133e4bb` du clone PRE-4, inchangé pour ce fichier.
