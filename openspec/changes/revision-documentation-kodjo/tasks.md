# Tasks — révision documentaire KODJO

État : **proposition**. Aucune tâche des lots 1A, 1B ou 2 n'est exécutée avant la revue ChatGPT et la validation de Hermann.

Légende : `[PRE4]` signale un fichier figé par PRE-4 (`caa2a5cf`). Une telle tâche exige une décision explicite et une coordination avec les PR #370 et #371.

## 0. Préparation (faite)

- [x] 0.1 Cloner le dépôt et créer la branche `docs/openspec-revision` sur `main` `6656fefc`
- [x] 0.2 Installer OpenSpec 1.14.2 avec l'intégration Claude Code ; séparer les instructions produit et VNext (`openspec/instructions/`)
- [x] 0.3 Diagnostic de cohérence ([diagnostic.md](diagnostic.md), [constats/](constats/))
- [x] 0.4 Évaluation de la qualité de la spécification ([qualite.md](qualite.md))
- [ ] 0.5 Revue ChatGPT du diagnostic, de l'organisation et du lot 1
- [ ] 0.6 Validation de Hermann : organisation (design D1 à D6), décisions 1C, autorisation des lots 1A et 1B

## 1A. Premier lot — sans décision produit, hors sources figées PRE-4

- [ ] 1A.1 **R-01** : dans les 17 fichiers de traçabilité concernés, remplacer les 26 liens vers des fichiers supprimés par des permaliens Git `7a89220f^:<chemin>`. Ajouter le bandeau `Statut : historique`. *Justification :* ces documents tracent un état passé, et pointer vers le chapitre actuel changerait leur sens.
  - Exemple : `docs/MATRICE-PLANIFICATION-2026-10-08.md:5` → `Specifications-fonctionnelles/SPECIFICATION-PLANIFICATION-2026-10-08.md`
- [ ] 1A.2 **R-02 (partie hors PRE-4)** : `MATRICE-FORMATS-SEANCES-2026-10-14.md`, 120 liens `#ce-fmt-0x`. Les corriger vers les ancres explicites créées en 1B.3, ou, sans 1B, vers les ancres générées par les titres.
- [ ] 1A.3 **H-15** : réécrire `docs/README.md` § « Références actives » en renvoi aux seuls chapitres et ancres. Retirer « DSF courant » et « matrice courante ».
  - Passage actuel `README.md` : « [DSF courant](DSF-CADENCE-2026-10-06.md) et [matrice courante Figma](MATRICE-CADENCE-FIGMA-2026-10-06.md) »
- [ ] 1A.4 **H-17, H-18, H-20 (D5)** : ajouter un en-tête de statut aux DSF et matrices non figés : DSF-CADENCE, DSF-BIP-CADENCE, DSF-PAUSES-ICONES, DSF-V2-MOTIFS-LOT-3, MATRICE-CADENCE-FIGMA, MATRICE-FIGMA, etc.
  - DSF-V2-MOTIFS-LOT-3 : neutraliser « le classeur v10 détermine les règles de gestion », contraire à D-315
- [ ] 1A.5 **R-05** : corriger les mentions « chapitre 00 » dans REVUE-COHERENCE-FORMATS et MATRICE-FORMATS (le glossaire est dans le ch. 01 depuis `7a89220f`)
- [ ] 1A.6 Rejouer `outils/links.mjs` : 0 fichier manquant hors fichiers figés ; consigner le résultat

## 1B. Premier lot — rédactionnel sur sources figées PRE-4 (décision explicite requise)

- [ ] 1B.1 **H-04 / H-05** `[PRE4]` ch. 07 : restaurer depuis `37e372cd^` le texte des 24 décisions vidées (D-237, D-252, D-268–271, D-274–277, D-279–286, D-288, D-292, D-295, D-296, D-302, D-305). Fixer ensuite le statut de chacune : active, ou `Remplacée par D-308…313 (point)`.
  - Vérification faite : `37e372cd^` contient pour D-237 « La spécification d'animation d'appui figée v2 du 29/09/2026 est reprise : dilatation uniforme centrée au contact… »
  - *Pas de nouvelle règle :* le statut proposé pour chaque décision est soumis à Hermann
- [ ] 1B.2 **R-03 / H-13 / S-10** `[PRE4]` ch. 10 : numéroter les 42 règles `### RM-` (proposition : `RM-FMT-01` à `RM-FMT-42`, alignées sur les ancres `fmt-01` à `fmt-42`). Remplacer « (RM-et RM-) » dans RM-071, RM-072, RM-075, RM-125 et RM-126 par la plage effective, à **valider par Hermann** car elle fixe une portée.
- [ ] 1B.3 **R-02** `[PRE4]` ch. 13 : ajouter les ancres explicites `<a id="ce-fmt-01"></a>` à `ce-fmt-06`. Cela répare d'un coup les 46 liens du ch. 06 et les 120 de la matrice, sans modifier le ch. 06.
- [ ] 1B.4 **R-04 / S-09 / P-20** `[PRE4]` ch. 08 : remplacer le lien circulaire vers la « spécification Formats du 14/10 » par un permalien `7a89220f^`. Déclarer non résolus §12, SRC-01/04/05 et REC-xx, ou les définir (voir qualité QF, REC-10 à REC-27).
- [ ] 1B.5 **S-11** `[PRE4]` ch. 09 : réparer les trois tableaux coupés par l'insertion de la note Death by
- [ ] 1B.6 **H-06** `[PRE4]` ch. 07 : remplacer « référence active v12 » (D-040, D-041, D-144, D-156, D-232, D-242, D-246, D-208) par la référence de section actuelle
- [ ] 1B.7 **H-08** `[PRE4]` ch. 07 : D-111 « supersédée par EC-01/02 » → nommer le remplaçant réel, ou poser la question à Hermann

## 1C. Décisions demandées à Hermann avant le lot 2

| # | Question | Constats |
|---|---|---|
| Q-A | Adopter le principe du domicile unique (design D2) et l'emplacement de la règle d'arbitrage unique (en tête du ch. 07 ou dans INDEX.md) ? Que deviennent PRODUCT.md:434, ch. 13:19 et ch. 08:33 ? | H-01, H-02, H-14, P-01 |
| Q-B | Statut des DSF : intégration de leurs règles dans les chapitres, puis passage au statut de traçabilité (D1) ? Les DSF du 12/10 et du 13/10 remplacent-ils D-339 et D-341 ? Si oui, quelle décision D-xxx l'acte ? | H-03, H-19 |
| Q-C | PRODUCT.md devient-il une page de synthèse sans ordre de référence propre ni règles ? | H-16, P-12 |
| Q-D | Définir MVP, V1, V2 et « tranche », et attribuer une version à Formats, Circuits de séries et Cadence | P-02, P-09 |
| Q-E | Médias pendant l'Exécution : MVP ou non ? | P-05 |
| Q-F | Statut `Partielle` : quelle définition ? | S-01 |
| Q-G | Suppression d'une Séance : directe ou après archivage ? | S-03 |
| Q-H | Composition : enregistrement automatique ou `Continuer` ? Séance contenant un exercice invalide : enregistrable ? | S-04, S-05 |
| Q-I | Statut visible d'un Death by « incomplet » | S-02 |
| Q-J | Montant affiché dans l'en-tête du Circuit | S-14 |
| Q-K | Valeur historique hors bornes : valide à l'enregistrement ? Total pendant une saisie incomplète : tiret ou absence de ligne ? | X-04, X-03 |
| Q-L | Intégrer Q8 et Q19 à Q23 (décisions du 16/10) dans la documentation normative : quand, et dans quel ordre par rapport aux PR #370 et #371 ? Corriger les écarts X-06 et X-07 dans la PR #371 ? | X-01, X-05, X-06, X-07 |
| Q-M | D-334 et D-335 au registre ? D-047 encore active ? | H-12 |
| Q-N | Les ch. 06 et 13 de `main` doivent-ils recevoir l'« Inventaire opposable PRE-4 » ? | diagnostic §0 |

## 2. Lot 2 — après les décisions 1C (esquisse)

- [ ] 2.1 Écrire la règle d'arbitrage unique ; retirer les ordres concurrents
- [ ] 2.2 Propager les décisions arbitrées : Q17, Q20, D-209 (Tour), D-343/D-355 (appui court), D-092 (1..100)
- [ ] 2.3 Résorber les doublons P-13, P-14, H-19 et X-13 par des renvois vers le domicile
- [ ] 2.4 Réécrire en place les compléments empilés de CE-UI-10, puis contrat par contrat au ch. 13, puis le ch. 06 (P-21, P-22)
- [ ] 2.5 Retirer le rendu visuel des ch. 09 à 12 (P-17) et les justifications « Figma de référence » (P-16)
- [ ] 2.6 Appliquer les recommandations P1 de [qualite.md](qualite.md)
