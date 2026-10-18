# G — Gouvernance, statut des documents, versions, registre, inventaire PRE-4 (Q-A, Q-B, Q-C, Q-D, Q-M, Q-N)

Lecture seule. Dépôt `C:\Dev\KODJO-OPENSPEC-DOCS`, branche `docs/openspec-revision`, base `main` 6656fefc (vérifiée par `git rev-parse main`). Aucun fichier du dépôt n'a été modifié.

Abréviations : `chNN` = `docs/Specifications-fonctionnelles/NN – ….md` ; les autres chemins partent de `docs/`. `pre4-r2:Xn` = copie figée `scratchpad/pre4-bmad-questions-ouvertes-r2.md`. `SR:n` = `C:\Dev\KODJO-BMAD-PRE4\docs\preparation\PRE-4\bmad\sources-retenues.md` ligne n. C'est une copie de travail **modifiée et non commitée** (HEAD `a8ec6c35`), lue le 16/10 en lecture seule et non figée : la citer avec réserve.

## Récapitulatif

| ID | Décision attendue | Classement | Preuve principale | Question résiduelle |
|---|---|---|---|---|
| Q-A | Fixer une seule règle d'autorité documentaire et son emplacement, puis décider du sort de PRODUCT:434–442, ch13:19 et ch08:33 | **ARBITRAGE_PRODUIT** pour le seul rang ch08/ch13. Le reste est soit RÉSOLUE_PAR_SOURCES (frontière doc/Figma), soit RECOMMANDATION_DOCUMENTAIRE (borne D-255, emplacement, ch07:559) | D-255 (ch07:378), D-300 (ch07:448), ch13:4059, INDEX:3 ; borne « jusqu'à D-255 » = dernier identifiant existant au 03/10 (`117bedcb`) | En cas de conflit sur un même écran, ch13 ou ch08 : lequel fait foi ? Ou bien aucun rang général ? |
| Q-B | Statut des DSF ; savoir si D-339/D-341 sont remplacées, et par quelle décision | (a) DSF = rendu : **RÉSOLUE_PAR_SOURCES**, avec transfert des règles = RECOMMANDATION_DOCUMENTAIRE (design G4). (b) D-339/D-341 : **ARBITRAGE_PRODUIT** | (a) D-255/D-300, ch13:9, DSF-INTERFACE:6, DSF-CIRCUITS:5. (b) Aucune décision D-xxx. ch13:4087 vient d'un commit de réconciliation (`096686e1`, 13/10) | D-339 et D-341 sont-elles remplacées à partir de PRE-4 (A/B/C) ? |
| Q-C | PRODUCT.md devient une synthèse sans ordre de référence propre ni règles | **RECOMMANDATION_DOCUMENTAIRE** | PRODUCT:432 « est une synthèse » ; INDEX:3 (les règles sont dans les 13 chapitres) | Aucune question produit. Validation du lot (CLAUDE.md:19) |
| Q-D | Définir MVP/V1/V2/tranche et attribuer une version à Formats, Circuits de séries et Cadence | Définitions : RECOMMANDATION_DOCUMENTAIRE (déjà implicites dans ch05). Circuits de séries : **RÉSOLUE_PAR_SOURCES** (MVP, un circuit par composition). **Formats et Cadence (exécution) : ARBITRAGE_PRODUIT** | ch05:1 « V1 – KODJO MVP », ch05:217 ; CIR-01 (ch07:589), ch08:500 ; ch05:284, ch06:2414 | Formats : MVP ou version ultérieure ? Cadence à l'exécution : MVP ou version ultérieure ? |
| Q-M | D-334/D-335 au registre ? D-047 encore active ? | **RÉSOLUE_PAR_SOURCES** (à reporter). D-334/D-335 : décisions de Hermann perdues lors d'une fusion. D-047 : décision active, mal rangée | `341f4d41:ch07:550,552` ; `decision-modalites-import.json` (« responded_by: Hermann », A) ; perte dans la fusion `ae50aaed`. D-047 : ch07:8, cohérente avec D-045, ch03:297 et ch08:970 | Aucune. Réintroduire dans ch07, fichier figé PRE-4, demande une autorisation de lot |
| Q-N | Le ch. 13 de main doit-il recevoir l'« Inventaire opposable PRE-4 » ? | RECOMMANDATION_DOCUMENTAIRE (ne pas l'intégrer en bloc). Les attendus D/H non validés relèvent d'un ARBITRAGE_PRODUIT résiduel, renvoyé à Q-L | pre4-r2:Q7, limité aux sources PRE-4 ; SR:124 exclut « main postérieur à caa2a5cf » ; aucune décision d'intégration à main | Seule question réelle : quelles déductions validées par PRE-4 deviennent normatives dans main (Q-L) ? |

---

## Q-A — Autorité documentaire

**(1) Décision attendue.** Fixer une règle d'autorité unique, dire où elle s'écrit, et décider de ce que deviennent les trois ordres concurrents, PRODUCT:434–442, ch13:19–25 et ch08:33, ainsi que la règle de récence de ch07:559.

**(2) Sources qui répondent déjà**

a) Frontière entre la documentation et Figma : explicite, décidée par Hermann.
- `ch07:378` (D-255, statut « Validée », colonne Intégrée « Clarification explicite 02/10/2026 ») : « Spécifications et arbitrages déterminent calculs et comportements ; Figma définit uniquement le layout/rendu. Exemples chiffrés et câblages ne sont jamais une règle. »
- `ch07:448` (D-300, « Confirmation de D-255 », « Clarifications propriétaire et plan révisé 06/10 ») : « Figma définit layout/rendu uniquement ; nombres et câblages ne définissent ni calculs ni comportement. »
- `ch13:4059` (§ « Clarification d'autorité et de portée », ajouté par `d8985d6e` le 14/10). Il se trouve à la l. 4411 de `d8985d6e` et aux l. 4057–4063 de main : « Les spécifications définissent les règles métier, les calculs et les comportements. Figma illustre les scénarios de présentation des écrans et contrôles. »
- Concordants : `INDEX.md:3`, `README.md:11`, `CLAUDE.md:24` (consigne de travail).

Ce point est **résolu**. Seule une reprise par renvoi reste à faire.

b) Rang 1 du registre, sans borne : `PRODUCT.md:436` « 1. registre des décisions de conception et arbitrages explicitement supersédants ». La borne de `ch13:19` (« décisions validées dans le chapitre 07, jusqu'à D-255 ») est un reste de rédaction. Elle a été introduite par `117bedcb` (03/10), date à laquelle D-255 était la dernière décision du registre (vérifié : `git show 117bedcb:ch07`, identifiant maximal D-255). PRE-4 applique déjà le rang 1 sans cette borne (pre4-r2:P4, D-337).

c) Récence. `ch07:559` : « Les décisions récentes prévalent, dans leur portée, sur les présentations antérieures (maquette figée du 08/10 comprise). » Le texte vise des *présentations*, pas des décisions. Une décision de Hermann va dans le même sens, mais pour les sources PRE-4 seulement : `SR:10` « Un document n'est pas prioritaire du seul fait qu'il est plus récent ». Cette portée est limitée aux sources de la préparation PRE-4. Elle ne doit pas être étendue au corpus général.

d) Rang de ch08 face à ch13 : **aucune décision de Hermann trouvée.**
- Aucune décision D-xxx du ch07 ne porte sur l'ordre des chapitres. Recherche : `grep "prévau|fait foi|autorité|ordre de référence"` sur ch07.
- `ch08:33` (« Les champs, contrôles et comportements spécifiques des écrans sont définis au chapitre 13. ») a été ajouté par la consolidation `7a89220f` (14/10), sans décision citée.
- `PRODUCT.md:434–442` date du 07/08 (`2c341059`).
- PRE-4 applique « ch. 13 prévaut sur ch. 08 » en citant ch08:33 (pre4-r2:P11, P19 ; SR:106 Δ6). Ces points figurent au §2 « Points traités par une règle de priorité écrite ». Ce sont des lectures de règle, pas des décisions de Hermann, et leur portée est la préparation PRE-4 (titre et l. 3 du fichier).

**(3) Sources qui contredisent**
- `PRODUCT.md:438,440` place ch08 (rang 3) au-dessus de ch13 (rang 5). C'est l'inverse de la lecture tirée de ch08:33.
- `ch10:7` (« Le détail visuel et les interactions écran par écran restent définis dans le chapitre 06 ») et `ch06:2234` (ch13 rangé du côté des références visuelles) attribuent les interactions d'écran à un troisième domicile.
- `ch13:19–25` range ch13 au rang 6, après l'API et l'architecture, que PRODUCT ne cite pas.

**(4) Classement**
- Frontière doc/Figma : RÉSOLUE_PAR_SOURCES (D-255, D-300), à reporter par renvoi.
- Borne « jusqu'à D-255 » : RECOMMANDATION_DOCUMENTAIRE. La supprimer ne crée aucune règle : elle aligne ch13:19 sur PRODUCT:436 et sur la pratique PRE-4 (P4). *Réserve :* cela change le rang écrit de D-256 à D-369. La correction doit donc être explicitement approuvée, et ch13 est un fichier figé PRE-4.
- Emplacement de la règle unique : RECOMMANDATION_DOCUMENTAIRE. *Recommandation :* l'écrire dans INDEX.md, qui porte déjà la frontière doc/Figma (INDEX:3). Remplacer PRODUCT:434–442 et ch13 §2 par un renvoi. Garder ch08:33 comme phrase de domaine, sans valeur de priorité.
- ch07:559 : RECOMMANDATION_DOCUMENTAIRE. Restreindre la formulation à « décisions nommées contre la maquette du 08/10 ».
- **Rang ch08/ch13 : ARBITRAGE_PRODUIT**, car le choix détermine quelle règle produit s'applique en cas de conflit.

**(5) Question minimale (fermée).** « Quand un contrat du ch. 13 et le ch. 08 se contredisent sur un champ, un contrôle ou un état d'un même écran, lequel fait foi ? »
- A : le ch. 13. Sources : ch08:33 ; lecture pre4-r2:P11, P19.
- B : le ch. 08. Source : PRODUCT:438–440.
- C : aucun rang général ; chaque contradiction est arbitrée et citée. Sources : design G3 ; brief « le domicile ne tranche pas ».
- *Recommandation (non décidée) :* C, conforme à G3. Hermann confirme en plus P11 et P19 comme décisions s'il veut leur donner une portée au-delà de PRE-4. A est compatible avec ce que PRE-4 a déjà appliqué. B obligerait à revoir P11 et P19.

**(6) Dépendances.** Q-C (sort de PRODUCT §13). PRE-4 : ch13 et ch08 sont figés à `caa2a5cf`, et P4, P11, P19 en dépendent. Aucune PR ouverte ne touche ces lignes (#370 et #371 ne modifient pas PRODUCT §13 ni ch13 §2 ; vérifié par grep des diffs).

**(7) Certitude.** Élevée sur l'absence de décision pour le rang ch08/ch13 et sur l'origine de la borne D-255. Élevée sur D-255 et D-300.

---

## Q-B — Statut des DSF ; D-339 et D-341

**(1) Décision attendue.** (a) Les DSF sont-ils des références de rendu dont les règles éventuelles migrent vers les chapitres ? (b) La présentation fixée par D-339 et D-341 est-elle remplacée par le DSF Circuits (12/10) et le DSF Deux modes (13/10) ? Si oui, par quelle décision ?

**(2) Sources qui répondent déjà**

(a) Les DSF ne portent que le rendu.
- `ch13:9` désigne les DSF comme le « Design System Figma ». D-255 et D-300 s'y appliquent donc (Figma = layout/rendu).
- Les DSF figés PRE-4 le déclarent eux-mêmes :
  - `DSF-INTERFACE-GENERALE-2026-10-08.md:6` : « Elles modifient le rendu ; les règles métier restent portées par les spécifications. »
  - `DSF-CIRCUITS-CONTROLES-2026-10-12.md:5` : « Ne change ni shells ni règles métier. » ; l. 7 : « Figma définit le layout. […] déterminent les données, interactions, bornes et calculs. »
  - `DSF-DEUX-MODES-ECHEC-2026-10-13.md:3` : « Les règles métier sont dans la spécification […] ; Figma détermine le layout. »

(b) D-339 et D-341.
- `ch07:550` D-339 « Validée, Hermann 12/10 », portée CE-UI-10. `ch07:552` D-341 « Validée sur le principe ; valeurs à valider ». Les deux appartiennent à la section « Recette PRE-3 — décisions du propriétaire » (ch07:541–543).
- `ch13:4087` : « État historique livré PRE-3 : sélecteurs segmentés et steppers permanents, avec fermeture progressive D-339 et typographie D-341. Le DSF du12/10 et Deux modes du13/10 supersèdent cette présentation pour la prochaine tranche ».
  - Origine : la phrase a été ajoutée dans SPECIFICATION-PARAMETRES-MODALE-v13 par `096686e1` (13/10 02:03, « docs(pre3): reconcile delivery with current normative editor and circuit specifications »), puis déplacée au ch13 par `7a89220f`. Le commit ne cite **aucune décision** de Hermann.
- `DSF-CIRCUITS-CONTROLES-2026-10-12.md:25` : « Les modes d'exécution et choix de côtés reprennent les popovers exportés ; ne pas réintroduire les anciens segmentés dans ces emplacements. » C'est un remplacement de *présentation*, porté par un DSF.
- PRE-4 : pre4-r2:P9 « Ch. 13 l. 4087 classe D-339 et D-341 parmi les présentations PRE-3 supersédées », mécanisme de la primitive native iOS. P10 et P23 tiennent le DSF Circuits pour explicitement supersédant. Ce sont des lectures de règle (§2), de portée PRE-4.
- Aucune décision D-xxx postérieure ne nomme D-339 ou D-341 (`grep -rn "D-339|D-341" docs` : seulement ch07, ch12:897–959 en tokens et ch13:4087).

Constat annexe : les valeurs de D-341 **ont été validées** par Hermann le 12/10. Source : `preparation/PRE-3/planification/execution/preuves/registre-recette1.md:189` « Hermann […] valide les valeurs D-6 (D-341) », et l. 193 pour les valeurs. Le statut du ch07:552 (« valeurs à valider ») est donc périmé. C'est un report documentaire.

**(3) Sources qui contredisent**
- (a) Dix chapitres déclarent que DSF-CARTES-ICONES-APPUIS « prévaut ». Exemple : `ch01:371` « Référence normative ciblée : […] Ces règles finales prévalent sur les anciennes formulations d'affichage du présent chapitre ». Ce DSF porte aussi des règles de gestion (RG-1 à RG-13, dont RG-10, une règle de donnée), en contradiction avec D-255.
- (b) ch07:550 et 552 restent « Validée », sans mention de remplacement. Le DSF n'a pas de rang pour remplacer une décision du registre (PRODUCT:436 rang 1 ; D-255). Et la récence ne vaut pas remplacement.

**(4) Classement**
- (a) RÉSOLUE_PAR_SOURCES pour le principe « DSF = rendu » (D-255, D-300 et autodéclarations). Le transfert des règles résiduelles (RG-1 à RG-13) et le reclassement en traçabilité relèvent d'une RECOMMANDATION_DOCUMENTAIRE, déjà encadrée par design G4 (« aucun DSF n'est déclassé avant transfert vérifié »).
- (b) **ARBITRAGE_PRODUIT.** Deux décisions validées de Hermann sont déclarées remplacées par une phrase de réconciliation et par un DSF, sans décision. La partie comportement de D-339 (application immédiate, fermeture, « Réduire les animations ») ne relève pas du seul rendu.

**(5) Question minimale (fermée).** « À partir de PRE-4, D-339 (fermeture après choix) et D-341 (typographie des options) sont-elles remplacées par les popovers du DSF Circuits (l. 25) et du DSF Deux modes ? »
- A : oui, les deux. Statut « Remplacée pour la présentation par DSF-CIRCUITS l. 25 / DSF Deux modes, décision D-xxx du JJ/MM ». P9 est confirmé.
- B : D-341 est remplacée, puisque son objet, le segmenté, disparaît. D-339 est maintenue pour sa partie comportement, transposée aux popovers : choix appliqué tout de suite au brouillon, fermeture, « Réduire les animations » respecté.
- C : les deux sont maintenues.
- *Recommandation (non décidée) :* B. Elle reste compatible avec P9 (primitive native, aucun choix persisté avant le ✓) et ne perd aucune règle de comportement. Quelle que soit l'option, une décision D-xxx doit l'acter, et le statut de D-341 doit indiquer que ses valeurs ont été validées le 12/10.

**(6) Dépendances.** PRE-4 (P9, P10, P23 ; ch07 et ch13 figés). PR #371 touche DSF-CIRCUITS, DSF-DEUX-MODES, ch07 et ch13, mais ni ch13:4087 ni D-339/D-341 (grep du diff).

**(7) Certitude.** Élevée sur l'absence de décision et sur l'origine de ch13:4087. Moyenne sur la qualification de la partie comportement de D-339.

---

## Q-C — Rôle de PRODUCT.md

**(1) Décision attendue.** PRODUCT.md devient-il une page de synthèse, sans ordre de référence propre ni règles normatives ?

**(2) Sources qui répondent déjà**
- `PRODUCT.md:432` : « `PRODUCT.md` est une synthèse. Il ne remplace pas les spécifications détaillées. »
- `INDEX.md:3` : « La documentation de référence forme un ensemble unique de treize chapitres. Les règles métier, calculs et comportements sont définis ici ». PRODUCT.md n'y figure pas.

**(3) Sources qui contredisent.** PRODUCT.md se comporte pourtant comme une référence :
- il porte un ordre de référence (l. 434–442) ;
- il désigne des « Références courantes » (l. 3, 518) ;
- il recopie des règles qui ont divergé : l. 52 « l'un des trois modes », l. 64, l. 500 « Durée par Série = 1 s..99 min 59 s ». Ces règles sont contredites par RM-033, par D-111 supersédée le 13/10 (ch07:143) et par la borne 5–3535 s (ch13:4106 ; pre4-r2:Q15, P20).

Aucune décision de Hermann n'a été trouvée sur le rôle de PRODUCT.md.

**(4) Classement.** RECOMMANDATION_DOCUMENTAIRE. Le statut de synthèse est déjà déclaré (l. 432), et les règles divergentes sont déjà tranchées ailleurs (P20, Q15). *Recommandation :* PRODUCT.md garde la finalité, le périmètre et la roadmap sous forme de renvois au ch05. Son §13 renvoie à la règle d'autorité unique (Q-A). Les règles recopiées sont remplacées par des renvois au moment où l'on touche le passage (design G2).

**(5)** Sans objet.

**(6) Dépendances.** Q-A (emplacement de la règle) et Q-D (périmètre des versions). PRODUCT.md n'est pas figé PRE-4 et n'est touché par aucune PR ouverte (grep des diffs #363, #370, #371).

**(7) Certitude.** Élevée.

---

## Q-D — MVP / V1 / V2 / tranche ; versions de Formats, Circuits de séries et Cadence

**(1) Décision attendue.** Définir les termes de version et attribuer une version produit à trois fonctionnalités spécifiées.

**(2) Sources qui répondent déjà**

Définitions, implicites mais écrites :
- `ch05:1` « ## V1 – KODJO MVP : séance structurée et exécution locale » ; `ch05:182` « ### V1 (MVP) ». V1 et MVP sont donc synonymes.
- V2 à V4 sont les versions produit 2 à 4 (ch05:75, 116, 147, avec leur objectif).
- Tranche : `ch05:217` « Roadmap des tranches MVP » (T01–T02, T03, T04, T05 et suivantes), repris dans `PRODUCT.md:419–426`. Une tranche est un incrément de livraison à l'intérieur du MVP.
- Termes réservés post-MVP : ch01 glossaire §7 (l. 295).
- Le glossaire ne définit ni MVP, ni V1, ni tranche, ni phase PRE-n, ni « Prototype MVP ».

Les usages homonymes de « V2 » s'expliquent par les sources :
- `ch07:632` « La V2 est amendée par ces décisions » désigne le document `sources/formats-2026-10-14/concept-V2.md`. Preuves : SPECIFICATION-FORMATS (`7a89220f^`) l. 24, « SRC-01 | Formats de séance — analyse d'impacts V2 », et §12, l. 285–289 (« V2 : … SUPERSÉDÉE_EXPLICITEMENT »).
- D-113 (`ch07:145`, « En V2, un Exercice de référence persistante est ajoutée à une Séance par copie indépendante ») est classé au MVP : `ch05:204` « ajout dans une Séance par copie indépendante » sous « MVP — complément T03 ».
- `V2-BILAT-01` (PRODUCT:428) et « DSF V2 » (PRODUCT:495) sont des noms de programme ou de design system.

Circuits de séries : attribués au MVP par une décision validée.
- `ch07:589` CIR-01 « Circuit de tours/séries, un circuit par composition MVP ». La section est validée en bloc : ch07:585 « toutes les lignes ci-dessous sont validées ».
- Concordants : `ch08:500` « Le MVP comporte **un seul circuit par composition**. », `ch04:437`, `ch13:1006`, `PRODUCT.md:526` « Un circuit MVP ».
- Le multicircuit est hors périmètre (CIR-12, ch07:600).
- Aucune tranche de livraison n'est assignée. pre4-r2:Q4 exclut « les circuits » de PRE-4 ; cette portée est limitée à PRE-4.

Cadence, en partie :
- Le paramètre Bip (saisie, persistance, copies, estimation) a été livré en PRE-3. Source : `preparation/PRE-3/perimetre-et-couverture.md:59` « Bip | Champ commun, persistance, copies et utilisation pour l'estimation | **Émission sonore et cycle réel pendant l'exécution reportés aux tranches EXE** ».
- Aucune version n'est attribuée à l'exécution de la cadence. Sources : `ch05:274` « Cible documentée, non déclarée livrée » ; ch01:171 « Cadence facultative — cible documentaire ».

**(3) Sources qui contredisent ou laissent ouvert**
- Formats, aucune attribution :
  - `ch05:284` : « La présence d'un écran sur Prototype MVP ne constitue ni son admission dans une tranche ni sa livraison applicative. Le moteur n'est pas encore développé ».
  - `ch06:2414` : le parcours Tabata est « dans Conception — Hors MVP ; cet alignement ne les promeut pas au périmètre MVP ».
  - À l'inverse, `ch13:9` et `ch13:13` comptent CE-FMT parmi « les 40 contrats actifs » d'une « spécification des familles d'écran du MVP », et `ch08:64` déclare tout son contenu MVP, Formats compris (ch08:685).
  - D-357 à D-369 (ch07:617–630) ne fixent pas de version ; « La V2 est amendée » renvoie au document concept-V2, pas à la version produit.
- Circuits : `PRODUCT.md:289` exclut du MVP les « structures comportant plusieurs Tours ». C'est l'ancien sens de « Tour » comme conteneur, antérieur à D-209 ; il est compatible avec « un circuit » mais prête à confusion.

**(4) Classement**
- Définitions : RECOMMANDATION_DOCUMENTAIRE. Inscrire dans le glossaire ch01 ce que ch05 dit déjà (V1 = MVP ; V2–V4 = versions produit ; tranche = incrément Tnn du MVP ; PRE-n = phase de projet ; « Prototype MVP » = page Figma, pas un périmètre, ch05:284). Renommer ou qualifier les usages homonymes : ch07:632 → « document concept-V2 » ; D-113 → « MVP T03 ».
- Circuits de séries : RÉSOLUE_PAR_SOURCES (MVP, un circuit par composition ; CIR-01). Report à faire dans ch05, sans tranche.
- **Formats : ARBITRAGE_PRODUIT. Cadence pendant l'exécution (émission sonore, relevé estimé) : ARBITRAGE_PRODUIT.**

**(5) Questions minimales (fermées)**
- « Les six formats (Tabata, Intervalles 30/30, EMOM, AMRAP, For time, Death by) et les départs rapides font-ils partie du MVP ? » Options : MVP (lecture ch13:9 et ch08:64) ou V2 / version ultérieure (lecture ch05:284, ch06:2414, page « Conception — Hors MVP » citée par concept-V2.md:148). Pas de recommandation : c'est un choix de périmètre.
- « Le guidage de cadence pendant l'Exécution (bip périodique 0..10 s, relevé estimé) fait-il partie du MVP ? » Options : MVP, livré par une tranche EXE, ou version ultérieure. Pas de recommandation.
- Précédent de forme : la PR #370 ajoute ch05 « Phases d'exercice — périmètre MVP » et D-370 « Phases au MVP ». Le même modèle (section ch05 et décision D-xxx) peut servir pour Formats et Cadence.

**(6) Dépendances.** PR #370 (ch05, ch07) ; PRE-4 (ch05 et ch07 figés ; Q4 exclut circuits, Formats et moteur de PRE-4, sans attribuer de version) ; Q-C (PRODUCT §4/§6).

**(7) Certitude.** Élevée pour V1 = MVP et pour l'absence de version des Formats. Moyenne-élevée pour les circuits : CIR-01 se lit comme une limitation du MVP qui suppose leur inclusion, mais il ne dit pas « les circuits de séries sont au MVP » en toutes lettres.

---

## Q-M — D-334, D-335, D-047

**(1) Décision attendue.** Inscrire D-334 et D-335 au registre ; dire si D-047 est active.

**(2) Sources qui répondent déjà**

D-334 et D-335 sont des décisions de Hermann, enregistrées puis perdues lors d'une fusion.
- Enregistrement au ch07 :
  - `fa62fc49` (08/10 22:15) ajoute D-334 : « PRE-3 importe les photos et vidéos depuis la photothèque seule. Le sélecteur de fichiers et la capture caméra ne font pas partie du parcours retenu. » Statut : « Validée explicitement par Hermann le08/10/2026, choix « Photothèque seule » ».
  - `acc07c1f` (08/10 23:12) ajoute D-335 : « Sélection multiple de photos et vidéos de la photothèque ; fichiers compatibles conservés sans conversion systématique ni plafond produit arbitraire ; annulation sans erreur ; import visible, erreur locale avec Réessayer… ». Statut : « Validée explicitement par Hermann le08/10/2026, choix A ».
- Preuve de la décision : `preparation/PRE-3/planification/decision-modalites-import.json` (« status: RESOLVED », « response_text: "A" », « responded_by: "Hermann" »).
- Ces décisions sont toujours appliquées sur main : `preparation/PRE-3/perimetre-et-couverture.md:294` (D-334) et `:296` (D-335) ; `plan-technique-corrige.md:64,70`.
- Perte : la fusion `ae50aaed` (09/10 20:05, « docs(pre3): prepare isolated product implementation from approved plan ») a pour parents `46b91bd2` (main, sans D-334/D-335) et `341f4d41` (branche PRE-3, avec D-334 à la l. 550 et D-335 à la l. 552 du ch07). Le résultat ne contient plus ces décisions. Comptages vérifiés : `git show <c>:ch07 | grep -c "D-334 |"` donne 1 pour 341f4d41 et 0 pour 46b91bd2, ae50aaed et main. Aucun commit ne les retire volontairement, et aucune décision ne les remplace.

D-047 est une décision active.
- `ch07:8` : « La règle de reprise tardive s'applique à partir de 30 minutes consécutives en pause, soit une durée de pause ≥ 30 min. | Validée | Oui ».
- Elle a été ajoutée par `aab70d39` (11/08, « Finaliser la documentation après revue Claude »), en réponse au point 13 de la revue initiale (`archives/Revue-claude/Revue-Claude-Initial.md:128`). Elle a été placée sous le tableau d'en-tête « # Format » (ch07:3), avec D-046. Ce n'est pas un exemple : c'est une décision mal rangée.
- Elle est cohérente avec D-045 (`ch07:65`, « au moins 30 minutes consécutives ») et avec `ch03:297` et `ch08:970`. La révision de D-045 du 01/10 ne porte que sur l'absence de réponse, pas sur le seuil.
- L'audit du 06/10 la distingue de la pause de sécurité : `.github/orchestration/reports/2026-10-06_AUDIT_FONCTIONNEL_CHAPITRES_CONTRATS_KODJO.md:58` « Pause prolongée (30 min en pause, D-047) et pause de sécurité (30 min / 2 h) | Conforme : deux mécanismes distincts ».

**(3) Sources qui contredisent.** Aucune trouvée. RM-068 (ch10:126) et PRODUCT:219 décrivent la pause de sécurité, un mécanisme distinct.

**(4) Classement.** RÉSOLUE_PAR_SOURCES, à reporter dans la documentation.
- D-334 et D-335 : restauration du texte exact depuis `341f4d41:ch07:550,552`. C'est un report, pas une nouvelle règle.
- D-047 et D-046 : actives. Les déplacer dans un tableau de décisions est une RECOMMANDATION_DOCUMENTAIRE de rangement.

**(5)** Sans objet. Il faut seulement l'autorisation de toucher le ch07, figé PRE-4.

**(6) Dépendances.** PRE-4 : ch07 figé ; ED-21 (médias, non-régression) s'appuie sur le comportement PRE-3 (pre4-r2:P18). Les PR #370 et #371 modifient ch07 ailleurs ; aucune ne touche la zone D-333/D-336 (grep des diffs).

**(7) Certitude.** Très élevée pour D-334/D-335 (chaîne Git vérifiée). Élevée pour D-047.

---

## Q-N — « Inventaire opposable PRE-4 » dans main

**(1) Décision attendue.** Intégrer ou non dans le ch13 de main la section l. 4346–5996 de `caa2a5cf`.

**(2) Sources**
- `pre4-r2:Q7` : « Ses exigences, états utilisateur et attendus de recette sont repris comme **sources produit communes**, après vérification de leur cohérence avec les spécifications normatives. Sont écartés uniquement les mécanismes propres à VNext […] BMad élabore son propre plan, mais reçoit les mêmes exigences. » La décision définit les **sources de la préparation PRE-4**, communes à BMAD et VNext. Elle ne dit rien de main.
- `SR:50,69,121,132` reprennent la même portée. `SR:124` exclut explicitement « `main` postérieur à `caa2a5cf` ».
- État de main : la section est absente (`git grep "Inventaire opposable" main` ne renvoie rien). Les commits `69e9178c`, `66ece980`, `87c53f24` et `caa2a5cf` ne sont pas ancêtres de main (seulement de `origin/plan/pre4-vnext-20261013`).
- `git diff --stat main caa2a5cf -- docs/Specifications-fonctionnelles docs/*.md` donne **uniquement** ch13, +1653 lignes. Le ch06 est identique. La question « ch. 06 et 13 » de tasks.md ne concerne donc que le ch13.
- Contenu vérifié par PRE-4 : 211 assertions, dont 155 règles sourcées, 13 calculs, 17 mécanismes techniques, 22 déductions non validées et 4 contradictions. Sources : pre4-r2:Q7 et `KODJO-BMAD-PRE4/_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/extracts/q7-inventaire-verification.md`. Les contradictions X1 à X4 sont traitées par P30, P3, P31 et P1.

**(3) Sources qui contredisent.** Aucune décision d'intégration à main, ni d'exclusion, n'a été trouvée.

**(4) Classement**
- RECOMMANDATION_DOCUMENTAIRE : ne pas intégrer la section en bloc. Les 155 règles sourcées existent déjà dans les chapitres ; les intégrer créerait une deuxième version normative (design G2). La section contient aussi les mécanismes VNext que Q7 écarte (JSON `kodjo.screen-states.v1`, `state_id`, `proof_required`).
- ARBITRAGE_PRODUIT résiduel, à traiter dans Q-L, pas ici : les 22 déductions et les hypothèses H* que PRE-4 adopte deviendraient des règles si elles entraient dans main. Il faut une validation de Hermann attendu par attendu.

**(5) Question minimale (fermée), si Hermann veut trancher maintenant.** « Après PRE-4, main reçoit-il (A) la section en bloc, (B) seulement les décisions et attendus validés (Q*, P* confirmés, H* validés), intégrés dans les chapitres de domicile, ou (C) rien ? »
- *Recommandation (non décidée) :* B, via Q-L.

**(6) Dépendances.** Q-L (ordre d'intégration de Q8, Q19–Q26 et des PR #370 et #371) ; PRE-4 (ch13 figé ; la section est source PRE-4 à `caa2a5cf`).

**(7) Certitude.** Élevée sur l'absence de décision pour main et sur l'écart limité au ch13.

---

## Couverture

Lu intégralement : BRIEF-ARBITRAGES.md, pre4-bmad-questions-ouvertes-r2.md, tasks.md §1C, constats H-hierarchie (§1, 2, 5), P-perimetre (P-01, P-02, P-09 à P-12), design.md, diagnostic.md §0–1, en-têtes des PR #363, #370 et #371.

Commandes principales :
- `sed -n 430,452p PRODUCT.md` ; `sed -n 7,30p ch13` ; `sed -n 4057,4110p ch13` ; `git show d8985d6e -- ch13` (clarification à la l. 4411 de ce commit) ; `sed -n 1,12p, 541–632 ch07`.
- `grep -nE "^\| ?D-(046|047|255|300|315|339|341|33[3-6]|357|36[0-9]) " ch07` ; `grep -nE "prévau|fait foi|autorité|ordre de référence" ch07` ; `grep -rnE "D-339|D-341" docs .github/orchestration/reports` ; `grep -rnE "D-33[45]" docs/preparation/PRE-3 .github/orchestration/reports`.
- `git log -S"supersèdent cette présentation"` et `-S"fermeture progressive D-339"` → `096686e1`, puis `7a89220f` ; `git log -S"jusqu’à D-255"` → `117bedcb` (identifiant maximal du ch07 à ce commit : D-255) ; `git log -S"…définis au chapitre 13"` → `7a89220f`.
- `git log -S"PRE-3 importe les photos…"`, `--diff-merges=separate` → fusion `ae50aaed` ; comptage `grep -c "D-334 |"` sur `acc07c1f`, `46b91bd2`, `341f4d41`, `ae50aaed` et main ; `git log -S"D-047"` → `aab70d39`.
- `grep -nE "^#" ch05, ch01` ; `sed -n 175,290p ch05` ; `grep -rnE "seul circuit par composition|circuit MVP"` ; `git show 7a89220f^:SPECIFICATION-*.md | grep MVP|V2|tranche` ; `sources/formats-2026-10-14/concept-V2.md`.
- `git merge-base --is-ancestor {69e9178c,66ece980,87c53f24,caa2a5cf} main` ; `git diff --stat main caa2a5cf -- docs/...` ; `git grep "Inventaire opposable" main`.
- `KODJO-BMAD-PRE4` : `sources-retenues.md` (copie de travail non commitée) et en-tête de `q7-inventaire-verification.md`, en lecture seule.

Non trouvé : une décision de Hermann sur le rang ch08/ch13, sur le remplacement de D-339/D-341, sur la version des Formats ou de la Cadence, ou sur l'intégration de l'inventaire PRE-4 à main.
