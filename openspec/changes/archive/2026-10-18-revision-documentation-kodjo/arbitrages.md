# Arbitrages — réexamen des questions Q-A à Q-N (révision 2, 16/10)

## Après les précisions B1 à B5 (17/10, D-397 à D-401)

Hermann a tranché B1 à B5 ; la portée de B1 a été confirmée : cas « omitted » seulement. Détail : [rapport-conformite-B1-B5-2026-10-17.md](rapport-conformite-B1-B5-2026-10-17.md).

| Point | Décision | Conformité |
|---|---|---|
| B1 Ligne Durée totale | D-397 | vérifiée |
| B2 Valeur obligatoire absente | D-398 | vérifiée |
| B3 Circuit vide | D-399 | vérifiée |
| B4 Accessibilité Android | D-400 | vérifiée |
| B5 Message de migration | D-401 | partielle : marque `{N}` restituée, à valider |

**Reste à valider par Hermann :**
- **C1** : le texte de D-401 tel que restitué, « {N} exercice(s) n’ont pas pu être récupérés … », avec la forme au singulier attendue.

**Vérifications Figma (non-arbitrages) :**
- teinte du fond rouge pâle ;
- application de D-389 et D-398 aux boutons-icônes Catégorie et Zones corporelles ;
- V1.

**Lot 6 :** contrat d’écran du message de migration ; emplacement éventuel du nombre d’Exercices de la Composition (aucun n’est décidé, D-399).

---

## Après les arbitrages A1 à A9 (17/10, D-388 à D-396)

Hermann a tranché A1 à A9. Le report au registre (D-388 à D-396) et dans les chapitres est décrit dans [rapport-conformite-A1-A9-2026-10-17.md](rapport-conformite-A1-A9-2026-10-17.md).

| Arbitrage | Décision | Conformité |
|---|---|---|
| A1 Persistance de la Composition | D-388 | vérifiée |
| A2 Contrôle obligatoire incomplet | D-389 | partielle (voir B2) |
| A3 En-tête du Circuit | D-390 | vérifiée pour l’emplacement (voir B3) |
| A4 Durées des cartes | D-391 | vérifiée |
| A5 Carte de Séance vide | D-392 | vérifiée |
| A6 Lecteur vidéo de l’éditeur | D-393 | vérifiée (voir B4) |
| A7 Message de migration | D-394 | partielle (voir B5) |
| A8 Bilatéralité d’un Circuit | D-395 | vérifiée |
| A9 Ligne Total | D-396 | partielle (voir B1) |

### Points à clarifier issus de l’application (aucune réponse présumée ; règles en vigueur inchangées)

| ID | Question | Options | Preuves |
|---|---|---|---|
| **B1** | Ligne Total de la feuille Paramètres en Répétitions **sans bip** ou quand **toutes les cibles sont À l’échec** : D-396 dit « toujours affichée », le corpus la retire (total omis) | Afficher la ligne avec « — » ; afficher un autre libellé ; maintenir le retrait comme exception à D-396 | D-396 ; CE-UI-10 §8, §9 (« Retrait du total »), §10, §12, §20 ; ch. 08 (ligne Total) ; DSF Deux modes ; DSF Séries variables ; RM-132 |
| **B2** | Feuille Paramètres : le contour orange de D-337 est-il maintenu avec le fond rouge pâle de D-389 ? Que devient « erreur nommant la Série » (CE-UI-10 §14) pour les valeurs invalides ? | Fond seul ; fond et contour ; contour réservé aux valeurs invalides | D-337 (« contour … conservé » ; remplacement par un fond annoncé « après définition dans Figma ») ; D-389 ; CE-UI-10 §14 |
| **B3** | Libellé de durée à vide sous le titre du Circuit ; emplacement éventuel du nombre d’Exercices de la Composition | Durée à vide selon le format min/s de D-391 ; « 0 min » ; nombre affiché ailleurs ou nulle part | D-091, D-390, D-391 ; ch. 08 §3.9 ; RM-074 |
| **B4** | Alternative accessible Android au menu de la tuile Média (« actions VoiceOver » sur iOS) | Équivalent natif Android (actions d’accessibilité TalkBack) ; autre | Q31 ; D-393 |
| **B5** | Libellé du message récapitulatif de migration | À fixer avec son contrat d’écran (lot 6) | D-394 (seule l’action `Compris` est fixée) |

**Vérification visuelle (non-arbitrage) :** application de D-389 aux boutons-icônes Catégorie et Zones corporelles ; teinte du fond rouge pâle (Figma).

---

## Clôture des 14 réserves (17/10) — arbitrages réellement restants

*État antérieur à A1–A9, conservé pour la traçabilité : A1 à A9 sont désormais tranchés (section ci-dessus).*

Le détail réserve par réserve figure dans [rapport-cloture-reserves-2026-10-17.md](rapport-cloture-reserves-2026-10-17.md).

- **Résolues :**
  - #1 borne D-255 : formulation obsolète ;
  - #3 « ignorer un exercice » : D-028, D-053 ;
  - #7 Q30 / D-384 : objets différents ;
  - #13 D-012, D-048, D-058.
- **Résolues en partie :** #4, #11, #12 et #14 ; il ne reste que les points ci-dessous.
- **Faux arbitrages éliminés :** #1, #3, #7, #11 (d).

### Questions à Hermann (doublons retirés)

Les règles concernées restent inchangées et marquées `À CLARIFIER` dans les chapitres.

| ID | Question | Options et conséquences | Preuves | Recommandation |
|---|---|---|---|---|
| **A1** | Quand la Composition est-elle persistée ? (ch. 08 §3.10 contre CE-T03-08 §15) | **A** — Persistance automatique de chaque modification : il faut alors réécrire CE-T03-08 §15, ch. 06:329, ch. 08 l. ~342 et ~581, et revoir l'abandon (« restitue la version persistée »). **B** — Brouillon persisté seulement par `Continuer` : il suffit de corriger la puce du ch. 08 §3.10. | ch. 08 l. ~581 « Continuer seul enregistre la Séance » ; CIR-03 « réserve de séance jusqu’à enregistrement » ; D-123 ; seule la puce du 06/08 dit le contraire | **B**, car tout le reste du corpus, y compris le ch. 08 lui-même, la prescrit |
| **A2** | Comment l’Exercice dont une cible obligatoire manque est-il signalé dans la Composition ? (`Continuer` est déjà désactivé : D-123 + D-380) | Message à l’appui sur `Continuer` désactivé ; indication sur la carte de l’Exercice, ce qui exige de revoir CIR-09 « aucun marqueur d’incomplétude » ; aucune signalisation autre que la désactivation | ch. 08:350 « Les exercices incomplètes sont signalées » ; CIR-09 | aucune |
| **A3** | Le nombre « N exercice(s) » sous le titre du Circuit compte-t-il ce seul Circuit, toute la Séance, ou est-il retiré ? (D-382 fixe le total) | **Circuit** : cohérent avec D-382. **Séance** : périmètre différent du total juste à côté. **Retiré** : conforme au DSF du 12/10 et aux captures, mais D-100 serait à mettre à jour. | D-100 ; ch. 08:1509 ; DSF Circuits du 12/10 « La durée agrégée est sous le titre » ; captures du ch. 06 | aucune (dépend du rendu Figma voulu) |
| **A4** | Totaux **exacts et estimés** des cartes Catalogue et Composition : arrondi à la minute supérieure (D-090, RM-159) ou minutes et secondes ? (le total partiel ≥ est déjà en min/s, Q20) | **Arrondi** : documentation inchangée ; le code PRE-3 (« 2 min 45 s ») s’en écarte. **Min/s** : D-090 et RM-159 à réviser. | D-090, RM-159 ; rectification de Q20 (renvoi à P41, règle de priorité et non décision) | aucune |
| **A5** | Carte de liste d’une Séance sans Exercice : « 0 exercice » (Q32) ou « 0 exercices » (D-091) ? | **Q32** : D-091 à mettre à jour (singulier pour zéro, comme la Composition). **D-091** : Q32 ne s’applique pas à la carte. | Q32 (PRE-4, D-385) ; D-091 ; D-081 ; ch. 13 l. ~291 | **Q32**, plus récente et explicite sur cet objet, mais elle ne nomme pas D-091 : la décision doit l'acter |
| **A6** | Consultation vidéo dans l’éditeur sous Android | Lecteur natif de chaque plateforme ; comportement propre à Android ; iOS seulement | Q27 « lecteur natif iOS » ; MVP iOS et Android (ch. 12) | **Lecteur natif de chaque plateforme**, par symétrie avec Q27, sans nouveau composant |
| **A7** | Forme du signalement des Exercices écartés par la migration (texte, moment, action) | À définir (la seule description existante est l’hypothèse PRE-4 H24) | Q19 « simplement signalé » ; Q28 | aucune |
| **A8** | Besoin futur « bilatéralité d’un Circuit » (ch. 02 §8) : le conserver comme évolution ou le retirer ? | **Conserver** : la qualification « non retenu dans la version actuelle » est déjà posée. **Retirer** : alignement complet sur D-209. | D-209 ; RM-145 à RM-147 (« dans la version actuelle ») ; D-387 | aucune |
| **A9** | « La ligne Total reste présente dans la feuille en Durée/Répétitions » (ch. 13, renvoi D-246 non démontré) : règle confirmée ? | Confirmer (citation à corriger) ; préciser le cas N = 1 | D-384 ne couvre que la cible manquante ; D-246 ne traite pas de la ligne Total | aucune |

**Vérification visuelle, et non arbitrage :**
- **V1** : dans Figma, en lecture seule, vérifier le contour des lignes à popover (ch. 08, RM-131), l'existence d'un segmenté « Mode d’exécution » (ch. 13 l. ~117) et la typographie des popovers (D-377).

**À coordonner avec la PR #371 :**
- les écarts X-06, X-07, Q17, Q21 et Q25 sont confirmés sur `2c050d0e` ([signalement](signalement-PR371-X06-X07.md), non publié) ;
- le ch. 08 l. 1573 (renvois D-232/D-246) attend la fusion de la PR.

**Relevant du lot 6 :** titres « Saisie des paramètres — D-246 » (ch. 01, 04, 08, 09) ; marquage de RM-131 (après la PR #370) ; inventaire des contrats du ch. 13 ; alias de documents ; rôle de PRODUCT.md (Q-C).

---

## Après les arbitrages du 16/10 (D-376 à D-387)

Hermann a tranché Q-A, Q-B, Q-D, Q-F, Q-H, Q-I, Q-J, Q-K, Q-L, D-237/D-252 et D-209, et a demandé de traiter sans nouvel arbitrage P-03 et les statuts de D-032, D-077, D-092, D-251 et D-228. Le report au registre et dans les chapitres est décrit dans [rapport-arbitrages-2026-10-16.md](rapport-arbitrages-2026-10-16.md).

### Décisions intégrées

| Question | Décision | État |
|---|---|---|
| Q-A | D-376 | intégrée ; borne « jusqu’à D-255 » non tranchée |
| Q-B | D-377 | intégrée |
| Q-D | D-378 | intégrée (périmètre MVP ; aucune tranche créée) |
| Q-F | D-379 | intégrée |
| Q-H (b) | D-380 | intégrée |
| Q-I | D-381 | intégrée (report au chantier Suivi) |
| Q-J | D-382 | intégrée ; confirme l’arbitrage Circuits du 12/10 |
| Q-K (a), Q-K (b) | D-383, D-384 | intégrées |
| Q-L / Q-N | D-385 | intégrée ; 23 corrections tirées des décisions PRE-4 (hors Q11–Q18, laissées à la PR #371) |
| D-237 / D-252 | D-386 | intégrée |
| D-209 | D-387 | intégrée (terminologie) |
| P-03 ; statuts D-032, D-077, D-092, D-251, D-228 | — | corrigés (sans nouvel arbitrage) |

### Points encore indéterminés (décision nécessaire, aucune réponse présumée)

| # | Point | Options | Preuves |
|---|---|---|---|
| 1 | Borne « jusqu’à D-255 » de l’ordre d’application du ch. 13 §2 | La retirer (le rang 1 vaut pour toutes les décisions) ; la conserver | Introduite le 03/10 (`117bedcb`), quand D-255 était la dernière décision ; D-376 ne la traite pas |
| 2 | ch. 08 §3.10 « les modifications sont enregistrées automatiquement » contre CE-T03-08 §15 « Continuer seul persiste » | Persistance automatique ; brouillon persisté par `Continuer` | Marqué `À CLARIFIER` selon D-376 ; ch. 06:329 et D-123 vont dans le sens de `Continuer` |
| 3 | Action « ignorer un exercice » (ch. 03) | Supprimer l’action ; la définir (statut du Résultat d’Exercice ignoré) | D-379 définit `Partielle` par les Résultats d’Exercice ; aucune commande « ignorer » n’existe parmi les commandes d’exécution (S-01) |
| 4 | D-380 : comportement de `Continuer` et signalisation de l’Exercice dont la cible manque | `Continuer` désactivé ; message à l’appui ; signalisation de l’Exercice | RM-017, CE-T03-08 §12/14/16, ch. 08:350 |
| 5 | D-382 : le **nombre** « N exercice(s) » affiché avec le total du Circuit compte-t-il aussi ce seul Circuit ? | Ce Circuit ; toute la Séance | ch. 08:1509, ch. 06:794 et 808, D-100 |
| 6 | Q20 / P41 : arrondi des totaux exacts et estimés des cartes (RM-159 `Math.ceil`, D-090) | Garder l’arrondi ; minutes et secondes | Rectification de Q20 du 16/10 ; carte Catalogue PRE-3 (« 2 min 45 s » pour 165 s) |
| 7 | Q30 contre D-384 : « l’Exercice lui-même n’affiche aucun total » contre la ligne Total « — » | Ligne Total « — » (D-384) ; pas de total | Q30 (PRE-4), D-384 |
| 8 | Q32 contre D-091 : « 0 exercice » au singulier sur la carte de liste contre « le libellé du Catalogue, qui reste `0 exercices` » | Appliquer Q32 et mettre à jour D-091 ; conserver D-091 | Q32 (PRE-4), D-091 ; ch. 13 l. ~289, ch. 06 l. ~483 |
| 9 | Q27 : consultation vidéo dans l’éditeur sur Android | Lecteur natif Android ; autre | Q27 nomme « lecteur natif iOS » ; le corpus vise iOS et Android |
| 10 | Q19 : forme du signalement des Exercices écartés par la migration | Texte, moment, action | Q19 dit « simplement signalé » ; seule l’hypothèse PRE-4 H24 décrit la forme |
| 11 | D-377, conséquences de présentation : couleur `color.selectionSubtitle` (ch. 12), contour « roulette/segmenté » (ch. 08, RM-131, DSF-SERIES-VARIABLES), segmenté « Mode d’exécution » (ch. 13 l. 117), mention « pour la prochaine tranche » | À relire dans Figma et les DSF ; décision de jalonnement pour la tranche | Dossier AR1, points isolés |
| 12 | Besoin futur du ch. 02 §8 « Activer la bilatéralité d’un Circuit » | Conserver comme besoin d’évolution ; le retirer (contraire à D-209 sur le fond) | D-209 « La bilatéralité n’existe qu’au niveau de l’Exercice » ; D-387 corrige seulement le terme |
| 13 | D-012, D-048, D-058 : « Tour » au sens de conteneur | Mention de statut D-387 ; laisser | D-387 ne les nomme pas |
| 14 | Traçabilité `À CLARIFIER` (renvois D-232/D-246 de la revue R1 ; H-11) | Désigner la décision fondatrice ; laisser | [constats/REVUE-R1-analyse-D232-D246.md](constats/REVUE-R1-analyse-D232-D246.md) |

**Écarts de la PR #371 à signaler :** X-06 (texte d’abandon de Q18), X-07 (stepper des répétitions contre Q8), Q17 (« jamais « 0 s » ni « 0 rép. » » absent des six contrats de cartes), Q21 (« pas de 5 s » sans le « multiple voisin » ni la position d’ouverture), Q25 (ouverture d’une cible à renseigner, côté DSF). Le texte est prêt, non publié : [signalement-PR371-X06-X07.md](signalement-PR371-X06-X07.md).

**Relevant du lot 6 :** inventaire des contrats du ch. 13 (31 lignes pour 40 contrats), alias de documents dans PRODUCT et le README, rôle de PRODUCT.md (Q-C).

---

## Questions ouvertes regroupées par thème (après la revue indépendante du 16/10)

*Section antérieure aux arbitrages du 16/10, conservée pour la traçabilité. Les questions tranchées sont indiquées ci-dessus.*

Ce regroupement reprend toutes les questions encore ouvertes : celles du §2 ci-dessous, les éléments isolés aux lots 1 et 5, et les réserves de la [revue indépendante](KODJO_revue_reserves_lots1-5_2026-10-16.md).

- Aucune réponse n'est présumée.
- Les recommandations sont celles déjà formulées, signalées comme non validées.
- Les preuves détaillées sont dans les sections indiquées et dans `constats/`.

### Thème 1 — Autorité documentaire (décision de gouvernance)

| Question | Options | Preuves | Effet si non tranchée |
|---|---|---|---|
| **Q-A** — Rang entre le ch. 08 et un contrat du ch. 13 en cas de contradiction ; sort de la borne « jusqu’à D-255 » (ch. 13 §2) | A : ch. 13 ; B : ch. 08 ; C : aucun rang automatique, arbitrage documenté au cas par cas (recommandé par Claude et par la revue, non validé) | ch. 08 §1.3 ; ch. 13 §2 ; PRODUCT.md §13 ; §2 question 2 | Q-H (a) reste isolée (ch. 08 « enregistrées automatiquement » contre CE-T03-08 §15) ; tâches 4.2 et 4.3 non faites |
| **Q-B** — Les DSF du 12/10 et du 13/10 remplacent-ils D-339 et D-341 ? | A : les deux sont remplacées ; B : D-341 remplacée, comportement de D-339 maintenu et transposé aux popovers (recommandé par Claude, non validé) ; C : les deux sont maintenues. Dans tous les cas, une décision D-xxx doit l'acter. | ch. 13 « Le DSF du12/10 et Deux modes du13/10 supersèdent cette présentation pour la prochaine tranche » (sans D-xxx) ; §2 question 3 | Le statut des DSF reste signalé comme non arbitré dans INDEX.md |

### Thème 2 — Périmètre des versions

| Question | Options | Preuves |
|---|---|---|
| **Q-D** — Les six formats et les départs rapides sont-ils au MVP ? Le guidage de cadence pendant l'Exécution est-il au MVP ? | MVP ou version ultérieure, pour chacun (aucune recommandation) | ch. 13:9, ch. 08:64 (lecture MVP) ; ch. 05:284, ch. 06:2414 (lecture ultérieure) ; §2 question 4 |
| **P-03** — Le segment Exercices du Catalogue est-il au MVP ? (ch. 12 l. ~1365 : « désactivé, aucune requête ») | Oui, par D-166 (« entrent dans le MVP »), si D-183 la conserve sur ce point ; ou non | D-166 « Supersédée et consolidée par D-183 » ; D-183 ne dit pas « MVP » ; RM-109 « actif à partir de T03 » ; dossier L5A-10 |
| **D-209, périmètre futur** — La V2 « plusieurs Tours » (ch. 05) et le besoin « bilatéralité d'un Tour » (ch. 02 §8) deviennent-ils « plusieurs Circuits » et sont-ils retirés ? | Réécrire selon D-209 ; ou conserver comme formulation d'évolution à revoir lors de la conception V2 | D-209 « La bilatéralité n’existe qu’au niveau de l’Exercice » ; CIR-12 (multi-circuit hors périmètre) ; dossier L5B 1.7 et 1.8 |

### Thème 3 — Exécution et statuts

| Question | Options | Preuves |
|---|---|---|
| **Q-F** — Une Séance close est-elle `Partielle` si et seulement si au moins un Résultat d'Exercice est `Partielle` ? | A : oui (recommandé par Claude, non validé) ; B : une récupération écourtée suffit aussi | D-053, D-150, ch. 06:2037 ; ch. 08:996 et 1386 ; §2 question 5 |
| **Q-I** — Statut affiché d'un Death by incomplet | A : un statut existant avec le motif ; B : un nouveau libellé ; C : différer à la planification des Formats (D-365) | D-365 « conception reportée au Suivi » ; FMT-38 ; §2 question 7 |

### Thème 4 — Composition, saisie et calculs

| Question | Options | Preuves |
|---|---|---|
| **Q-H (b)** — Séance contenant un Exercice dont une cible est à renseigner | A : enregistrée et exécutée en sautant l'Exercice ; B : enregistrée, non exécutable ; C : non enregistrable | RM-017 ; ch. 08:352 ; `pre4:H29` (hypothèse) ; §2 question 6 |
| **Q-J** — Total affiché sous le titre du Circuit | A : Circuit développé seul ; B : tous les Exercices de la Séance | Spécification Circuits supprimée §5.2, ch. 10:684 ; D-100, D-131 ; §2 question 8 |
| **Q-K (a)** — Valeur historique hors bornes non modifiée : enregistrable ? | Oui pour PRE-4 / oui en général / non | `pre4:Q15`, `pre4:H25` ; ch. 13 (bornes), API-PARAM-01 ; §2 question 9 |
| **Q-K (b)** — Ligne Total pendant une cible à renseigner | « — » ou absence | ch. 06:1119, ch. 08:1565 ; `pre4:H10` ; voir aussi le renvoi À CLARIFIER du ch. 13 (thème 7) |

### Thème 5 — Portée des décisions de la préparation PRE-4

| Question | Options | Preuves |
|---|---|---|
| **Q-L / Q-N** — Les décisions PRE-4 Q8, Q11–Q18, Q20, Q21, Q23, Q25–Q31 valent-elles pour la documentation générale ? | Décision par décision : PRE-4 seulement, ou générale. Q19 est déjà déclarée générale (« phase projet ») ; Q22 ne relève pas de la documentation ; Q24 est déjà conforme. | Fichier de décisions PRE-4 committé dans le clone PRE-4 (`e0e8ce58`, non publié) ; §3 ci-dessous. **Q31 déclare amender D-335**, réinsérée au lot 1. |
| **Écarts X-06 et X-07 de la PR #371** | À signaler au chantier propriétaire ; ce clone ne modifie pas la PR | [signalement-PR371-X06-X07.md](signalement-PR371-X06-X07.md) (texte prêt, non publié) |

### Thème 6 — Anomalies de prescription du registre

| Question | Options | Preuves |
|---|---|---|
| **D-237 et D-252** — Leur prescription courante « Bip v2 et D-308–313 » est sans rapport avec leur objet (animations d'appui ; pas des steppers). Quelle est leur prescription courante ? | A : leur texte historique (restauré au lot 1) redevient la prescription ; B : D-252 est remplacée sur les steppers par D-312 (« Stepper : tap1,maintien≈500ms,paliers5 après2s/10 après4s avec multiples directionnels ; … »), et D-237 redevient active ; C : autre | `37e372cd` (07/10) a posé le même texte sur 24 décisions, dont 22 relèvent de la Cadence ; D-237 est citée environ 15 fois comme applicable dans les chapitres ; constat R-08 ; lot 1 A5. **Anomalie non arbitrée : le contenu de ces décisions n'a pas été modifié.** |
| **D-032 / D-077** — Sont-elles révisées par D-209 sur le terme du conteneur (« Tour ») ? | Oui (statut à mettre à jour) ; non | D-209 « Révise les formulations historiques où Tour désignait le conteneur répété », sans les nommer ; dossier L5B 1.9 |
| **D-092** — Son statut « Validée » avec une borne de répétitions 1–99 | Mention « répétitions 1..100 selon D-232 et RM-234 » ; ou maintien | D-232 « Bornes conservées : … répétitions1..100 » ; RM-234 ; aucune source ne nomme D-092 ; constat X-08 |
| **D-251 / D-228 (Étiquette)** — Faut-il mettre à jour leur statut ? | Oui, si Hermann confirme que D-337 vise D-251 (message en ligne) et que D-355 vise D-228 (Étiquette) ; sinon non | D-337 « remplace le message en ligne de chapitre 08 » ; D-355 cite D-222 et non D-228 ; dossier L5B 2 et 4 |

### Thème 7 — Traçabilité documentaire à clarifier (sans effet sur les règles)

| Point | État | Preuves |
|---|---|---|
| Renvois D-232 et D-246 marqués `À CLARIFIER` : ch. 08 (retour à « aucun mode »), ch. 09 (non-persistance de la phrase, 2 lignes), ch. 13 (ligne Total) | Règles inchangées ; la décision qui les fonde reste à identifier | [constats/REVUE-R1-analyse-D232-D246.md](constats/REVUE-R1-analyse-D232-D246.md) |
| H-11 : ch. 08 l. ~1595 (« fragments conditionnels D-232 ») ; ch. 13 l. ~3099 (« pas … de D-232 ») | Isolé : aucune décision ne désigne le remplaçant | Dossier L5B 7 |
| **D-334 et D-335** | Réinsérées au lot 1 (`4668e215`) à l'identique depuis `341f4d41` (ch. 07 l. 550 et 552), perdues lors de la fusion `ae50aaed` du 09/10. Sources : `docs/preparation/PRE-3/planification/decision-modalites-import.json`, commits `fa62fc49` et `acc07c1f`. **Amendement PRE-4 Q31** (geste de consultation et menu à l'appui long) : consigné, portée non établie, **non reporté**. | [constats/LOT-1-registre.tsv](constats/LOT-1-registre.tsv) (G4) ; thème 5 |

## État au 16/10 après les lots 1 à 5

- **Appliquées** (décisions explicites trouvées) :
  - Q-E (D-203) ;
  - Q-G (RM-007, D-121) ;
  - Q-M (D-334 et D-335 réinsérées au lot 1) ;
  - Q-O (renvois D-nnn restaurés au lot 3b, commit séparé).
- **Toujours ouvertes :** questions 2 (Q-A), 3 (Q-B), 4 (Q-D), 5 (Q-F), 6 (Q-H b), 7 (Q-I), 8 (Q-J), 9 (Q-K), 10 (Q-L/Q-N).
- **Q-H (a) reste isolée.** Sa seule source est le contrat CE-T03-08 du ch. 13, sans D-xxx ni RM-xxx : la corriger trancherait Q-A.
- **Nouveaux éléments pour la question 10.** Le fichier de décisions PRE-4 est désormais committé dans le clone PRE-4 (`e0e8ce58`, non publié) et va jusqu'à Q31 :
  - Q27 et Q31 : consultation d'un Média dans l'Éditeur ;
  - Q28 : valeurs négatives ou fractionnaires écartées selon Q19 ;
  - Q29 : invalidation d'« Annuler » ;
  - Q30 : contribution d'une cible à renseigner au total de Séance.

  **Q31 déclare amender D-335**, réinsérée au lot 1 (« Le menu Retirer / Monter / Descendre passe à l'appui long … D-335 est amendée sur ce point »). Cet amendement n'est pas reporté : sa portée générale reste à confirmer (question 10).

## Méthode et sources

- **Base :** `main` `6656fefc` (inchangé). Les fichiers de `docs/` de la branche sont identiques à la base.
- **Sources consultées :**
  - chapitres 01 à 13 et `docs/*.md` ;
  - historique Git : textes d'origine des décisions, spécifications supprimées par `7a89220f`, fusion `ae50aaed` ;
  - PR #363, #370 et #371 (têtes inchangées : `d2386c8d`, `6cf3634a`, `2c050d0e`) ;
  - décisions de Hermann de la préparation PRE-4 BMAD : fichier **non versionné** `C:\Dev\KODJO-BMAD-PRE4\docs\preparation\PRE-4\bmad\questions-ouvertes.md`, lu le 16/10 à 17:31 (SHA-256 `ceadbee3967779b859b2c80b4c2522cd3b3ce0f9bf54f47ce11aee27249f2fbe`), cité ci-dessous `pre4:Qxx`. Il n'est pas copié dans ce change ; seuls des extraits sont cités.
- **Analyses détaillées** (preuves verbatim, sources contraires, certitude, couverture) :
  - [constats/arbitrages/G-gouvernance.md](constats/arbitrages/G-gouvernance.md) : Q-A, Q-B, Q-C, Q-D, Q-M, Q-N ;
  - [constats/arbitrages/F-fonctionnel.md](constats/arbitrages/F-fonctionnel.md) : Q-E à Q-L.
- **Classement :** `RÉSOLUE PAR LES SOURCES` (une décision explicite ou une règle non contredite répond, et il ne reste qu'à la reporter) ; `RECOMMANDATION DOCUMENTAIRE` (choix d'organisation sans effet sur une règle produit) ; `ARBITRAGE PRODUIT` (une décision de Hermann reste nécessaire).
- **Portée des décisions PRE-4 :** seule Q19 déclare une portée générale, « Décision pour la phase projet, commune aux versions PRE-4 BMAD et VNext » (`pre4:Q19`). Les autres sont lues comme des décisions pour PRE-4, sans extension implicite. Leur extension fait l'objet de la question 10.

## 1. Tableau récapitulatif

| ID | Décision attendue | Classement | Preuve principale | Suite |
|---|---|---|---|---|
| Q-A | Règle d'autorité unique ; sort de PRODUCT:434–442, ch. 13:19, ch. 08:33, ch. 07:559 | Frontière doc/Figma : **RÉSOLUE** ; borne « jusqu'à D-255 », emplacement, ch. 07:559 : **RECOMMANDATION** ; rang ch. 08 / ch. 13 : **ARBITRAGE** | D-255 (ch. 07:378) ; D-300 (ch. 07:448) ; ch. 13:4059 ; la borne D-255 date de `117bedcb` (03/10), quand D-255 était la dernière décision | Question 2 |
| Q-B | Statut des DSF ; D-339 et D-341 remplacées ? | DSF = rendu : **RÉSOLUE** (transfert des règles selon design G4) ; D-339 et D-341 : **ARBITRAGE** | ch. 13:4087 introduit par `096686e1` (13/10), sans décision D-xxx ; valeurs de D-341 validées le 12/10, alors que le ch. 07 indique encore « à valider » | Question 3 |
| Q-C | Rôle de PRODUCT.md | **RECOMMANDATION** : synthèse sans ordre de référence propre | PRODUCT.md:432 « `PRODUCT.md` est une synthèse » ; INDEX.md:3 | Lot 4, sans question |
| Q-D | MVP / V1 / V2 / tranche ; version de Formats, Circuits de séries, Cadence | Définitions : **RÉSOLUE** en grande partie (ch. 05:1 « V1 – KODJO MVP », ch. 05:217 tranches) ; Circuits de séries : **RÉSOLUE** (MVP, un circuit par composition, CIR-01 ch. 07:589) ; Formats et Cadence à l'exécution : **ARBITRAGE** | Aucune version attribuée (ch. 05:284, ch. 06:2414) ; précédent de forme : PR #370 (section ch. 05 et D-370 « Phases au MVP ») | Question 4 |
| Q-E | Médias pendant l'Exécution : MVP ? | **RÉSOLUE** | D-203 (ch. 07:259) : « périmètre MVP confirmé le 28/09/2026 » ; ch. 05:242 ; CONCEPTION-EXECUTION-MEDIA.md:7. Restes contraires : ch. 01:155, ch. 10:250 | Lot 5 (`FONCT-ARBITRÉ`) |
| Q-F | Prédicat du statut de Séance `Partielle` | **ARBITRAGE** (restreint) | Statut d'Exercice fixé (D-053 ch. 07:84, RM-060, D-150) ; deux définitions de Séance jamais arbitrées (ch. 08:996, ch. 08:1386) | Question 5 |
| Q-G | Suppression d'une Séance active | **RÉSOLUE** | RM-007 (ch. 10:19) : « Une Séance active ne peut pas être supprimée. Elle doit d'abord être archivée » ; D-121 (ch. 07:153) | Lot 5 |
| Q-H (a) | Persistance de la Composition | **RÉSOLUE** | D-123 (ch. 07:155) ; ch. 06:329 ; CE-T03-08 §15 (ch. 13:988) | Lot 5 |
| Q-H (b) | Séance avec un Exercice valide et un Exercice à cible à renseigner | **ARBITRAGE** | RM-017 ; ch. 08:352 ; `pre4:H29` (hypothèse tirée du code) | Question 6 |
| Q-I | Statut visible d'un Death by incomplet | **ARBITRAGE, différable** | D-365 (ch. 07:626) : « conception reportée au Suivi » ; spécification Formats supprimée, FMT-38 | Question 7 |
| Q-J | Montant affiché sous le titre du Circuit | **ARBITRAGE** | D-100 (ch. 07:132) et D-131, contre la spécification Circuits supprimée §5.2 et ch. 10:684 | Question 8 |
| Q-K (a) | Valeur héritée hors bornes non modifiée : enregistrable ? | **ARBITRAGE** (confirmer `pre4:H25` et sa portée) | `pre4:Q15` ne règle que l'affichage et le calcul ; ch. 13:4100 et API-PARAM-01 refusent | Question 9 |
| Q-K (b) | Ligne Total pendant une cible à renseigner : « — » ou absente | **ARBITRAGE** | ch. 08:1565 « Variable : lecture seule, — si incomplet » ; ch. 06:1119 ; contre `pre4:H10` (hypothèse) | Question 9 |
| Q-L | Intégration de Q8, Q19–Q26 ; X-06 et X-07 ; ordre des PR | X-06 et X-07 : **RÉSOLUES** (texte de Q18 et Q8) ; ordre des PR : **RECOMMANDATION** ; portée générale des décisions PRE-4 : **ARBITRAGE** | Voir §3 | Question 10 |
| Q-M | D-334 et D-335 au registre ; D-047 active ? | **RÉSOLUE** | D-334 et D-335 présentes à `341f4d41` (ch. 07:550 et 552), second parent de la fusion `ae50aaed` (09/10), et absentes de `main` (vérifié) ; D-047 active, rangée sous l'exemple « # Format » | Lot 1 (G4) ; D-047 au lot 6 |
| Q-N | « Inventaire opposable PRE-4 » dans `main` ? | **RECOMMANDATION** : pas d'intégration en bloc ; les décisions validées passent par Q-L | `pre4:Q7` limitée aux sources PRE-4 ; aucune décision d'intégration à `main` | Question 10 |
| **Q-O** (nouvelle) | Les renvois D-nnn effacés par `7a89220f` hors rubriques de traçabilité doivent-ils être restaurés ? | **RECOMMANDATION** (documentaire) | 244 lignes restaurables portent toutes une trace d'effacement mécanique ; la PR #360 n'annonce que le retrait des « rubriques de traçabilité des contrats » | Question 11 |
| **A-PRE4** (préalable) | Autoriser la modification, dans `main`, de sources figées par PRE-4 | Accord de procédure, pas une décision produit | Consigne du chantier ; PRE-4 BMAD lit une copie à `caa2a5cf` | Question 1 |

## 2. Décisions demandées à Hermann

Seules les questions qui restent ouvertes après le réexamen sont posées ici. Les recommandations sont des **propositions**, pas des décisions.

| # | Question fermée | Options et sources | Recommandation |
|---|---|---|---|
| 1 | **A-PRE4.** Autorisez-vous l'application du lot 1 (registre ch. 07, restaurations à l'identique depuis Git, sans changement de statut) dans `main`, alors que le ch. 07 est une source figée PRE-4 ? | Oui / Non / Après la fin de PRE-4 | — |
| 2 | **Q-A.** Quand un contrat du ch. 13 et le ch. 08 se contredisent sur un même écran, lequel fait foi ? | A : ch. 13 (ch. 08:33 ; lecture `pre4:P11`, `P19`). B : ch. 08 (PRODUCT:438–440). C : aucun rang général ; chaque contradiction est tranchée par une décision citée (design G3). | C, éventuellement complétée par la confirmation de P11 et P19 comme décisions générales |
| 3 | **Q-B.** À partir de PRE-4, D-339 (fermeture après choix) et D-341 (typographie des options) sont-elles remplacées par les popovers des DSF Circuits et Deux modes ? | A : les deux sont remplacées. B : D-341 est remplacée ; D-339 est maintenue pour son comportement, transposé aux popovers. C : les deux sont maintenues. Dans tous les cas, une décision D-xxx doit l'acter. | B |
| 4 | **Q-D.** (a) Les six formats et les départs rapides sont-ils au MVP ? (b) Le guidage de cadence pendant l'Exécution est-il au MVP ? | MVP (lecture ch. 13:9, ch. 08:64) ou version ultérieure (ch. 05:284, ch. 06:2414) | Aucune |
| 5 | **Q-F.** Une Séance close est-elle `Partielle` si et seulement si au moins un Résultat d'Exercice est `Partielle` ? Une récupération écourtée (RM-065a) n'y suffit-elle pas ? L'action « ignorer un exercice » (ch. 03) est-elle retirée ? | A : définition dérivée des résultats d'Exercice (D-053, D-150, ch. 06:2037). B : lecture large de ch. 08:996, où la récupération écourtée compte. | A |
| 6 | **Q-H (b).** Une Séance dont un Exercice a une cible à renseigner : (A) s'enregistre et s'exécute en sautant cet Exercice ; (B) s'enregistre mais ne s'exécute pas (ch. 08:352) ; (C) ne s'enregistre pas (`Continuer` désactivé, `pre4:H29`) ? | A / B / C | C ou B |
| 7 | **Q-I.** Pour un Death by clos (limite ou abandon), le Suivi et la Synthèse affichent : (A) un statut existant, avec le motif ; (B) un nouveau libellé ; (C) décision différée à la planification des Formats (D-365) ? | A / B / C | C |
| 8 | **Q-J.** Avec des Exercices avant ou après le Circuit, la ligne sous le titre Circuit totalise : (A) le Circuit développé seul (spécification Circuits §5.2, ch. 10:684) ; (B) tous les Exercices de la Séance, hors Compte à rebours et Fin (D-100, D-131) ? | A / B | Aucune : les deux s'appuient sur des décisions validées |
| 9 | **Q-K.** (a) Confirmez-vous `pre4:H25` : une valeur héritée hors bornes non modifiée laisse ✓ et `Terminer` actifs, et seule une valeur modifiée doit respecter les bornes ? Pour PRE-4 seulement, ou aussi pour la doc générale (RM-234, API-PARAM-01) ? (b) Pendant une cible à renseigner, la ligne Total affiche-t-elle « — » (ch. 06:1119, ch. 08:1565) ou n'apparaît-elle pas (`pre4:H10`) ? | (a) Oui, PRE-4 / Oui, général / Non. (b) « — » / absente | (a) Oui, général (cohérent avec `pre4:Q15`, « tant qu'on ne la modifie pas »). (b) Aucune |
| 10 | **Q-L / Q-N.** Les décisions PRE-4 suivantes valent-elles aussi pour la documentation générale : Q8, Q11–Q18 (portées par la PR #371), Q20, Q21, Q23, Q25, Q26 ? | Liste à cocher, décision par décision. Q19 est déjà générale, Q24 est déjà conforme dans `main`, et Q22 ne relève pas de la documentation. | — |
| 11 | **Q-O.** Faut-il restaurer, au lot 3, les renvois D-nnn effacés par la consolidation dans le texte courant des chapitres (lignes EXACT de R-06), en dehors des rubriques de traçabilité dont le retrait était annoncé ? | Oui, tous / Oui, sauf ch. 13 / Non, mais réparer les artefacts (parenthèses vides, espaces orphelines) | Oui, tous : les traces montrent un effacement mécanique, et la restauration est vérifiable ligne à ligne |

**Point d'information pour la question 10 :** la décision Q23 indique que le bouton de Mode est « absent des frames et des sources ». Or `docs/DSF-PHRASES-V15-2026-10-07.md:15` prescrit : « Le champ à droite de Paramètres d'exécution affiche le **mode** des paramètres appliqués » (constat X-11). La décision n'est pas remise en cause, mais son report dans la documentation devra modifier ce DSF.

## 3. Q-L : dépendances avec les PR et décisions déjà portées

| Décision | Portée déclarée | Portée par une PR ? | À aligner dans `main` (exemples vérifiés) |
|---|---|---|---|
| Q8 (roulette Répétitions) | non déclarée | **en partie**, par #371 (CE-UI-10, DSF Deux modes) | D-219 (ch. 07:294) ; ch. 13:125 ; ch. 06:186 ; **#371 réécrit ch. 08 l. 1573 en gardant les steppers** (X-07, ci-dessous) |
| Q11–Q18 | « Validation propriétaire du 16 octobre 2026 » (rapport de #371) | **oui**, par #371 | X-06 et X-07 restent à corriger dans la PR |
| Q19 (données illisibles) | **générale** (phase projet) | non | ch. 09 (migration) ; ch. 12:1597 |
| Q20 (≥ en min et s, sans arrondi) | non déclarée | non | RM-159 (ch. 10:141), D-090 (ch. 07:124) |
| Q21 (valeur valide la plus proche) | non déclarée | en partie, de façon ambiguë (#371 : « pas de 5 s ») | ch. 13 l. 4093 et 4104–4106 (X-05) |
| Q22 (dev client) | préparation de recette | sans objet | — |
| Q23 (retrait du bouton de Mode) | non déclarée | non | DSF-PHRASES-V15:15 ; CE-T03-04 §6 |
| Q24 (« {N} séries à l'échec ») | non déclarée | sans objet | `main` est déjà conforme (ch. 01:363, ch. 05:252, ch. 08:1814) |
| Q25 et Q26 | non déclarées | non | ch. 13 l. 4104 et 2997 |

**X-06 et X-07, écarts entre la PR #371 et les décisions :**

- **X-06.** `pre4:Q18` : création « Abandonner la création ? » / « Les informations saisies seront perdues et l'exercice ne sera pas créé. ». Le diff de #371 (ligne 197 de `pr371.diff`) écrit : « Création : « Abandonner la création ? » / « L'exercice ne sera pas créé. » ». Le texte est **raccourci par rapport à la décision**.
- **X-07.** `pre4:Q8` : roulette native à une colonne, qui « remplace, pour la cible, le stepper en ligne de … ch. 08 l. 1559 et 1573 ». Le diff de #371 (ligne 166 de `pr371.diff`) écrit : « Séries `1..99` et Répétitions `1..100` utilisent des steppers ». La phrase réécrite **contredit Q8**. La lecture « Répétitions » = nombre de répétitions cible est à vérifier dans la PR.

Ces deux corrections relèvent de la PR #371 elle-même : ce change ne modifie pas la PR.

**Ordre de fusion (recommandation documentaire) :**
- une fusion d'essai, faite dans un dépôt jetable construit par `git archive 6656fefc` puis supprimé, sans modifier le clone, montre que les PR #363, #370 et #371 **entrent en conflit au même endroit du ch. 06 (vers la l. 1162)**, quel que soit l'ordre ;
- la PR #363 est en outre basée sur `caeee0ef`, antérieur à `main` ;
- ordre proposé :
  1. corriger X-06 et X-07, puis fusionner #371 ;
  2. rebaser #370 et la fusionner ;
  3. rebaser #363 ;
  4. appliquer ensuite les lots 1 et 3 de ce change ; aucune de leurs lignes n'est touchée par ces PR ;
- cet ordre reste à confirmer par Hermann, et la PR #371 porte la mention « ne pas fusionner pendant le travail BMAD sans coordination explicite ».

## 4. Résolues par les sources : ce qu'il reste à faire

| ID | À reporter | Lot | Classe |
|---|---|---|---|
| Q-E | Retirer ou aligner ch. 01:155 et la dernière ligne de RM-203 (ch. 10:250, « post-MVP à planifier ») sur D-203 | 5 | FONCT-ARBITRÉ `[PRE4]` |
| Q-G | Aligner ch. 08 §2.5 (suppression directe) sur RM-007 et D-121 | 5 | FONCT-ARBITRÉ `[PRE4]` |
| Q-H (a) | Aligner ch. 08 §3.10 et ch. 08:403 sur D-123 | 5 | FONCT-ARBITRÉ `[PRE4]` |
| Q-M | Restaurer D-334 et D-335 depuis `341f4d41` (lot 1, groupe G4) ; ranger D-047 hors de l'exemple « # Format » (lot 6) | 1 et 6 | DOC `[PRE4]` |
| Q-B (a) | Transfert des règles des DSF, règle par règle (design G4) | 6 | DOC |
| Q-C | PRODUCT.md : remplacer l'ordre de référence par un renvoi | 4 | DOC-AUTORITÉ |
| Q-D (définitions) | Rappeler V1 = MVP et la notion de tranche dans le glossaire ; préciser que « V2 » désigne parfois un document (`concept-V2.md`) | 6 | DOC |
| D-341 | Le statut « valeurs à valider » ne reflète pas la validation du 12/10 (`docs/preparation/PRE-3/…/registre-recette1.md:189`, d'après l'analyse G) | 5 | FONCT-ARBITRÉ `[PRE4]`, preuve à revérifier avant application |
