# P — Périmètre des versions, doublons structurels et frontière documentation/Figma

Corpus lu : branche `docs/openspec-revision`, fichiers de `docs/Specifications-fonctionnelles/` et `docs/*.md`. Les chemins sont relatifs à `docs/`. Les numéros de ligne ont été vérifiés par `grep -n`. Les constats déjà arbitrés (Q1–Q23, P1–P44 de `pre4-bmad-questions-ouvertes.md`) ne sont pas rouverts : ils sont signalés « arbitré, intégration pendante » quand la doc les contredit encore.

Ordre de priorité : P-01 à P-05 sont structurants (gouvernance, vocabulaire, périmètre) ; P-06 à P-12 sont des contradictions de périmètre localisées ; P-13 à P-16 traitent les doublons ; P-17 à P-20 la frontière avec Figma et le glossaire ; P-21 et P-22 la structure des ch. 06 et 13.

---

### P-01 — Trois ordres de référence incompatibles, dont un s'arrête à D-255

- qualification : CONTRADICTION_REELLE
- gravité : bloquant
- passages :
  - `PRODUCT.md:436-440` — « 1. registre des décisions de conception et arbitrages explicitement supersédants ; … 3. conception fonctionnelle détaillée ; 4. écrans et navigation ; 5. contrats d'écran du chapitre 13 »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:19` — « 1. décisions validées dans le chapitre 07, jusqu'à D-255, avec priorité aux décisions explicitement supersédantes »
  - `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md:33` — « Les champs, contrôles et comportements spécifiques des écrans sont définis au chapitre 13. »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:2234` — « le présent chapitre définit les comportements, tandis que les captures et le chapitre 13 définissent les références visuelles et critères déterministes. »
- analyse : PRODUCT.md place le ch. 08 au-dessus du ch. 13. Le ch. 08 renvoie pourtant au ch. 13 pour les champs et les contrôles, et la préparation PRE-4 en tire « ch. 13 prévaut sur ch. 08 » (P11, P19). Le ch. 06 range le ch. 13 du côté du visuel, alors que le ch. 13 §1 se dit normatif sur les comportements. Le ch. 13 §2 ne couvre que les décisions jusqu'à D-255 : D-256 à D-369 (D-298, D-328, D-333, D-337, D-343, D-354…) n'ont aucun rang écrit. Les trois textes portent sur le même objet (l'ordre de priorité des chapitres), dans le même périmètre, et ils divergent : c'est une contradiction, pas une différence de périmètre. Elle est bloquante, car toutes les résolutions P4, P11 et P19 reposent sur une hiérarchie qui n'est écrite nulle part de façon unique.
- proposition : écrire une seule règle de gouvernance, dans le ch. 01 (section Glossaire et gouvernance, ou une nouvelle section « Gouvernance documentaire »), avec deux axes distincts : (1) le **domaine** de chaque chapitre (comportement transverse : ch. 08 et 10 ; champs et contrôles d'un écran : ch. 13 ; rendu : Figma et DSF) ; (2) la **priorité** en cas de conflit sur un même objet (ch. 07 supersédant > ch. 13 pour un écran > ch. 08 > ch. 06 > ch. 05 et 01 > documents de travail). Retirer la borne « jusqu'à D-255 » du ch. 13 §2. Remplacer PRODUCT.md §13, ch. 08 §1.3–1.4 et ch. 06 l. 79 et 2234 par un renvoi à cette règle.
- statut PR/décisions : couvert partiellement par P4, P11 et P19 (appliqués au cas par cas, sans règle générale)
- touche_PRE4 : oui
- question à Hermann : pour un même écran, est-ce que le ch. 13 l'emporte sur le ch. 08 (comme l'appliquent P11 et P19), ou est-ce que le ch. 08 l'emporte (comme le dit PRODUCT.md §13) ?

### P-02 — Le vocabulaire MVP / V1 / V2 n'est défini nulle part, et « V2 » a au moins cinq sens

- qualification : AMBIGUITE_PERIMETRE
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/05 – Versions du produit.md:1` — « ## V1 – KODJO MVP : séance structurée et exécution locale »
  - `Specifications-fonctionnelles/05 – Versions du produit.md:75` — « ## V2 – Réutilisation avancée des séances »
  - `Specifications-fonctionnelles/07 – Registre des décisions de conception.md:145` — « D-113 | En V2, un Exercice de référence persistante est ajoutée à une Séance par copie indépendante. »
  - `Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md:1018` — « ## Extension V2 — origine et instantané d'Exécution »
  - `Specifications-fonctionnelles/07 – Registre des décisions de conception.md:632` — « La V2 est amendée par ces décisions, notamment : réglages éditables ; organisation Tabata/EMOM/Progression »
  - `PRODUCT.md:428` — « La tranche bilatéralité `V2-BILAT-01` reste un incrément préparatoire antérieur et clos »
- analyse : le glossaire du ch. 01 ne définit ni MVP, ni V1, ni tranche, ni « Prototype MVP ». Le ch. 05 assimile V1 et MVP. Le ch. 06 garde « de la V1 » dans son nom, alors que le reste du corpus dit « MVP ». « V2 » désigne tour à tour : la version produit 2 (ch. 05) ; l'ancien nom de ce qui est devenu MVP T03 (D-113, ch. 09 l. 1018, `API-CAT-01` « MVP T03 / V2 » en ch. 11 l. 264) ; la 2ᵉ version de la spécification Formats (ch. 07 l. 632, ch. 08 l. 797) ; le programme de réécriture « KODJO V2 » et ses tranches V2-PRE-1, V2-PRE-2, V2-CAT-01 et V2-BILAT-01 (ch. 07 l. 232, 354, 400) ; le Design System (« DSF V2 »). S'y ajoutent les numéros de spécification (Bip v2, Phrase v1, v13, v15). Ces sens ne sont pas contradictoires entre eux, mais rien ne permet de les distinguer : on ne peut donc pas savoir si « V2 » dans une décision veut dire « hors MVP ».
- proposition : ajouter au glossaire du ch. 01 une section « Versions et jalons » qui définit : MVP (= V1 produit), V2 à V4 (ch. 05), tranche (T01 à T05), phase de projet (PRE-n), page Figma « Prototype MVP » (qui n'est pas un périmètre, voir P-09) et version de spécification (vNN). Réserver « V2 » à la version produit. Renommer les autres usages ou les marquer historiques : D-113 et ch. 09 l. 1018 → « MVP T03 » ; « La V2 est amendée » → « la spécification Formats v2 ». Renommer le ch. 06 en « Écrans et navigation » (son titre H1 l'est déjà), en gardant un alias pour ne pas casser les liens.
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch. 06, 07 et 09)
- question à Hermann : confirmez-vous que « V1 » et « MVP » sont synonymes, et que « V2 » doit désigner uniquement la version produit 2 ?

### P-03 — Le ch. 12 déclare le segment Exercices désactivé au MVP

- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/12 – Architecture technique.md:1363-1365` — « | Segment | MVP | V2 | … | Exercices | désactivé, aucune requête | `ActivityDefinitionRepository` | »
  - `Specifications-fonctionnelles/05 – Versions du produit.md:234` — « Cette capacité appartient désormais au MVP T03. Le MVP n'est donc plus centré exclusivement sur les Séances »
- analyse : les deux passages portent sur le même objet (la source de données du segment Exercices) et le même périmètre (le MVP). Ils sont incompatibles : le ch. 05, PRODUCT.md §4 et le ch. 01 l. 55 rendent `Exercices` actif dès T03. Le tableau du ch. 12 reprend l'ancien découpage où « V2 » voulait dire T03 (voir P-02).
- proposition : la référence est le ch. 05 avec D-113 lu au sens de « MVP T03 ». Récrire le tableau du ch. 12 avec les colonnes « Avant T03 » et « MVP T03 et suivantes ».
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : —

### P-04 — La recherche figure encore au MVP dans les ch. 01, 02 et 03

- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/01 – Vision Générale.md:51` — « Il permet de rechercher une Séance, d'ouvrir sa carte en modification, de la planifier »
  - `Specifications-fonctionnelles/02 – Utilisateurs et besoins.md:34` — « - Rechercher une Séance. »
  - `Specifications-fonctionnelles/03 – Parcours utilisateur.md:318` — « 3. Il peut rechercher une Exécution et modifier l'ordre chronologique d'affichage, du plus récent au plus ancien ou inversement. »
  - `Specifications-fonctionnelles/07 – Registre des décisions de conception.md:301` — « D-221 | Le MVP ne comporte **aucune recherche globale ni recherche locale dans les Catalogues**. »
- analyse : D-221 dit explicitement « Supersède D-163 et D-168 pour toute mention de recherche ». Le ch. 01 l. 51 (section « Périmètre fonctionnel du MVP »), le ch. 02 l. 34 et 204 n'ont pas été réécrits. Le ch. 03 l. 318 et 320 ajoute, dans le Suivi, une recherche et un tri inversable. Or le Suivi du MVP a `Trier` désactivé et une liste du plus récent au plus ancien (PRODUCT.md l. 251–253, ch. 01 l. 95). Pour le Suivi, D-221 ne vise que les Catalogues, mais la désactivation de `Trier` contredit directement « inverser l'ordre chronologique ».
- proposition : la référence est D-221, avec PRODUCT.md §4 pour le Suivi. Supprimer « rechercher » dans ch. 01 l. 51, ch. 02 l. 34 et 204, et ch. 03 l. 318 et 320. Récrire les étapes 3 et 5 du ch. 03 sans recherche ni inversion du tri.
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch. 01)
- question à Hermann : —

### P-05 — Médias pendant l'Exécution : MVP ou non ? Le ch. 01 se contredit

- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/01 – Vision Générale.md:153` — « Le MVP permet de consulter les médias de l'Exercice sans quitter l'Exécution ni interrompre son moteur. »
  - `Specifications-fonctionnelles/01 – Vision Générale.md:155` — « Cette cible est conçue mais n'est pas ajoutée au périmètre MVP courant sans décision de roadmap distincte. »
  - `Specifications-fonctionnelles/05 – Versions du produit.md:242` — « La consultation des médias pendant l'Exécution fait partie du MVP, conformément à la confirmation du 28/09/2026 (D-203 »
- analyse : D-203 (ch. 07 l. 259) a pour statut « périmètre MVP confirmé le 28/09/2026 », et CONCEPTION-EXECUTION-MEDIA l. 7 le confirme. La phrase de la l. 155 du ch. 01 est antérieure et n'a pas été retirée : deux phrases contraires se suivent dans la même section. Le glossaire (ch. 01 l. 323, « L'ajout/import dans l'éditeur n'est pas activé par D-203 ») est exact au sens strict, mais il omet D-333 qui active l'import : c'est un complément manquant, pas une contradiction.
- proposition : la référence est D-203. Supprimer ch. 01 l. 155. Ajouter « (D-333 : import inclus au MVP, PRE-3) » au glossaire, entrée Média.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : —

### P-06 — « Catalogue des parcours » est toujours présenté comme un titre actif

- qualification : CONTRADICTION_REELLE
- gravité : mineur
- passages :
  - `PRODUCT.md:273` — « les titres contextuels sont `Catalogue des séances`, `Catalogue des exercices` et `Catalogue des parcours`. »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:244` — « les titres contextuels sont `Catalogue des séances`, `Catalogue des exercices` et `Catalogue des parcours`. »
  - `Specifications-fonctionnelles/01 – Vision Générale.md:287` — « | **Catalogue des parcours** | Ancien concept retiré ; aucun onglet ou segment Parcours. | »
- analyse : D-328 (ch. 07 l. 525) retire « catalogue » de Parcours. Le ch. 01 se contredit lui-même entre l. 107 (titre actif) et l. 287 (retiré). PRODUCT.md l. 112 et 383 parlent encore de « trois Catalogues ».
- proposition : la référence est D-328 avec ch. 01 l. 287. Retirer le troisième titre (PRODUCT.md l. 273, ch. 01 l. 107, ch. 06 l. 244) et remplacer « trois Catalogues » par « deux Catalogues ».
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch. 01 et 06)
- question à Hermann : —

### P-07 — Le ch. 05 range en V2 un calcul déjà spécifié au MVP

- qualification : CONTRADICTION_REELLE
- gravité : mineur
- passages :
  - `Specifications-fonctionnelles/05 – Versions du produit.md:88` — « - calculer distinctement la Durée estimée d'exécution du Plan complet et la Durée synthétique des Exercices affichée dans le Catalogue et la Composition ; »
  - `Specifications-fonctionnelles/04 – Modèle fonctionnel.md:188` — « Le modèle distingue trois mesures temporelles. La **Durée synthétique des Exercices**, utilisée dans le Catalogue et la synthèse du Tour »
  - `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md:380` — « ### Durée synthétique des Exercices »
- analyse : la même fonctionnalité est déclarée dans deux versions différentes. Les ch. 04, 08 et 10, ainsi que D-090 et D-131, la spécifient pour le MVP (cartes Catalogue et Composition, ch. 13 §« Portée transverse »). La mention du ch. 05 en V2 est un reliquat.
- proposition : la référence est le ch. 04 §188 avec RM-129. Supprimer ch. 05 l. 88.
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch. 05)
- question à Hermann : —

### P-08 — La V2 « Composition avancée » et le modèle du ch. 09 emploient « Tour » au sens de conteneur

- qualification : CONTRADICTION_REELLE (terminologie de périmètre)
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/05 – Versions du produit.md:111` — « - plusieurs Tours ordonnés dans un même Cycle ; »
  - `Specifications-fonctionnelles/05 – Versions du produit.md:67` — « Le modèle de données de la V1 repose sur la hiérarchie Séance → Cycle → Tour → Exercice. »
  - `Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md:253` — « | Tours | Collection ordonnée des Tours du Cycle | Obligatoire | Exactement 1 Tour dans le MVP ; extensible à plusieurs Tours dans une version ultérieure | »
  - `PRODUCT.md:289` — « - structures comportant plusieurs Tours ou plusieurs Cycles ; »
- analyse : selon le glossaire (ch. 01 l. 308) et D-209, le Circuit est le conteneur et le Tour une répétition. Avec ce sens, « exactement 1 Tour dans le MVP » contredit « exécuté de 1 à 99 Tours » (PRODUCT.md l. 68), et « plusieurs Tours » hors MVP (PRODUCT.md l. 289) contredit le MVP lui-même. Le contenu de la V2 n'est donc pas lisible : s'agit-il de plusieurs Circuits ? Le ch. 05 l. 22 (« ordonner les exercices d'un Tour ») et la l. 24 (« ordonner les Exercices dans le Circuit visible ») emploient les deux sens dans la même liste. La préparation PRE-4 §4 constate la contradiction D-077 / D-209 sans la trancher.
- proposition : appliquer D-209 aux textes de périmètre. Ch. 05 l. 111 → « plusieurs Circuits ordonnés dans un même Cycle » ; ch. 05 l. 67 → « Séance → Cycle → Circuit (répété en Tours) → Exercice » ; PRODUCT.md l. 289 → « plusieurs Circuits ou plusieurs Cycles ». Au ch. 09 l. 253, distinguer l'entité technique historique `Tour` (identifiant conservé, D-202) du concept fonctionnel Circuit.
- statut PR/décisions : couvert partiellement par la préparation PRE-4 §4 (D-077 / D-209), sans arbitrage
- touche_PRE4 : oui (ch. 05 et 09)
- question à Hermann : la V2 vise-t-elle plusieurs Circuits par Séance ? D-077 doit-il passer au statut historique au profit de D-209 ?

### P-09 — Formats, Circuits de séries et Cadence sont spécifiés en détail sans version assignée ; « Prototype MVP » est pris pour un périmètre

- qualification : AMBIGUITE_PERIMETRE
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/05 – Versions du produit.md:284` — « La présence d'un écran sur Prototype MVP ne constitue ni son admission dans une tranche ni sa livraison applicative. »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:2414` — « le parcours Tabata `8388:28362`, … sont dans Conception — Hors MVP ; cet alignement ne les promeut pas au périmètre MVP. »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:2420` — « 46 états présents sur Prototype MVP, exportés dans ce lot. »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:9` — « Ce chapitre constitue la **spécification des familles d'écran du MVP** »
  - `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md:64` — « Les comportements décrits correspondent au périmètre du MVP. »
- analyse : le ch. 13 §1 compte CE-FMT parmi « les 40 contrats actifs » (l. 13) d'une « spécification … du MVP ». Le ch. 08 §1.6 déclare tout son contenu MVP, y compris la section Formats (l. 685 et suivantes). Le ch. 06 classait Tabata « Hors MVP » le 12/10, puis l'a inventorié sur « Prototype MVP » le 14/10. Le ch. 05 dit seulement que la présence sur cette page ne vaut pas admission. Aucune version (MVP, V2…) n'est attribuée aux Formats, aux Circuits de séries (« Un circuit MVP », PRODUCT.md l. 526) ni à la Cadence (« Cible documentée, non déclarée livrée », ch. 05 l. 274). Les textes ne se contredisent pas : il manque l'attribution.
- proposition : dans le ch. 05, ajouter un tableau unique « fonctionnalité → version produit → tranche → statut (spécifiée / livrée) » qui couvre Formats, Circuits de séries, Cadence, Planification multi-contenus et Programme. Récrire ch. 08 §1.6 et ch. 13 §1 en « périmètre MVP et évolutions conçues, voir ch. 05 ». Définir « Prototype MVP » comme le nom d'une page Figma, et non comme un périmètre (voir P-02).
- statut PR/décisions : aucun (Q4 exclut les circuits de PRE-4 sans leur attribuer de version)
- touche_PRE4 : oui
- question à Hermann : les Formats (Tabata, EMOM, AMRAP, For time, Death by, Intervalles) font-ils partie du MVP ou d'une version ultérieure ? Même question pour les Circuits de séries.

### P-10 — La récurrence mensuelle est à la fois au MVP et dans les « évolutions prévues »

- qualification : AMBIGUITE_PERIMETRE
- gravité : mineur
- passages :
  - `PRODUCT.md:225` — « Répétition désactivée produit un créneau unique ; activée, elle expose Jour/Semaine/Mois et une borne **jusqu'au** (date) ou **pendant** »
  - `PRODUCT.md:374` — « - planification périodique étendue, notamment mensuelle ; »
  - `Specifications-fonctionnelles/05 – Versions du produit.md:64` — « - de définir un créneau unique ou répété via un interrupteur, avec unité Jour/Semaine/Mois et borne jusqu'au/pendant ; voir la spécification du 08/10 et ses points ouverts ; »
- analyse : PRODUCT.md met l'unité Mois dans le périmètre MVP (§4) et dans les évolutions (§10). Le ch. 09 l. 341 et le ch. 10 l. 315 disent « Ne pas utiliser ce calcul comme définition du mode Mois » : le mode Mois n'a pas de règle de calcul. Le ch. 05 inclut au MVP une spécification dont il reconnaît les points ouverts.
- proposition : le ch. 05 tranche. Soit Mois est MVP, et sa règle de calcul doit être écrite (ch. 10), soit il passe en V2 et sort de PRODUCT.md §4 et du ch. 05 l. 64.
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch. 05)
- question à Hermann : l'unité Mois de la Répétition est-elle livrée au MVP ?

### P-11 — Le ch. 02 garde des besoins de bilatéralité au niveau du Tour

- qualification : CONTRADICTION_REELLE
- gravité : mineur
- passages :
  - `Specifications-fonctionnelles/02 – Utilisateurs et besoins.md:190` — « - Activer la bilatéralité d'un Tour après confirmation ; toutes ses Exercices héritent alors du Tour et leur contrôle propre devient unilatéral désactivé. »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:2250` — « Aucune confirmation d'activation bilatérale du Tour n'est exposée dans la version actuelle. »
- analyse : D-209 dit « La bilatéralité n'existe qu'au niveau de l'Exercice ». Le ch. 02 §8 « Besoins validés pour les évolutions » mêle des besoins MVP (« dès le MVP », l. 186) et ce besoin, qui ne porte aucune version. La l. 187 (« Configurer un Exercice ou un Tour ») va dans le même sens.
- proposition : la référence est D-209. Supprimer ch. 02 l. 190 et la mention « ou un Tour » de la l. 187, ou les déplacer dans une liste V2+ explicitement marquée.
- statut PR/décisions : aucun
- touche_PRE4 : non
- question à Hermann : —

### P-12 — PRODUCT.md et le ch. 05 n'ont pas suivi « Deux modes » ni les bornes du 13/10

- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `PRODUCT.md:52` — « Un Exercice utilise l'un des trois modes `Durée`, `Répétitions` ou `À l'échec`. »
  - `PRODUCT.md:64` — « Répétitions sans bip et À l'échec omitted au niveau Exercice. ≥ réservé aux agrégats Séance/Circuit contenant du travail inconnu. »
  - `PRODUCT.md:500` — « Séries = `1..99`, Répétitions = `1..100`, Durée par Série = `1 s..99 min 59 s`. »
  - `Specifications-fonctionnelles/05 – Versions du produit.md:16` — « - une durée, un nombre de répétitions ou une cible À l'échec ; »
- analyse : D-111 (ch. 07 l. 143) a été explicitement supersédé le 13/10 : À l'échec est une cible de Série, et non un mode. Le paragraphe de calcul a été mis à jour dans 13 emplacements (« Mélange chiffré/échec calculable : ≥ au niveau Exercice », par exemple ch. 01 l. 77), mais pas dans PRODUCT.md l. 64 et 187. La borne 5–3535 s est confirmée au ch. 13 l. 4106 (« 5999 s était une coquille »). PRODUCT.md l. 516 et le ch. 05 l. 39 reprennent aussi les trois modes. C'est le cas typique d'un doublon (P-13) qui a divergé.
- proposition : aligner PRODUCT.md et le ch. 05 sur RM-033, RM-129 et le ch. 13 l. 4106. Mieux, y remplacer la règle par un renvoi (voir P-13).
- statut PR/décisions : arbitré par P20 (trois modes) et Q15 (bornes), intégration pendante dans PRODUCT.md et le ch. 05 (absents de la liste de P20)
- touche_PRE4 : oui (ch. 05)
- question à Hermann : —

### P-13 — Paragraphes normatifs copiés mot pour mot dans 8 à 10 chapitres

- qualification : DOUBLON
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md:72` — « | RM-129 | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC »
  - `Specifications-fonctionnelles/11 – API fonctionnelles.md:73` — « | API-ACT-02 | Calculer les paramètres temporels | … Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) »
  - `Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md:341` — « Sans répétition : une date/heure. Avec répétition : Jour/Semaine/Mois. » (identique à ch. 10 l. 315)
  - `Specifications-fonctionnelles/12 – Architecture technique.md:1515` — « D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80 »
- analyse : relevé mécanique des lignes de plus de 250 caractères présentes dans plusieurs chapitres :
  - formule « Durée intrinsèque calculable » : 15 copies dans 8 fichiers (PRODUCT.md, ch. 01, 04, 08 ×4, 09 ×3, 10, 11, 13 ×2). 14 sont identiques ; PRODUCT.md a déjà divergé (P-12) ;
  - « Pi est stockée et exécutée… » : 11 copies (ch. 04, 05, 06, 08, 09 ×2, 10, 11, 12, 13, PRODUCT.md) ;
  - bloc « Décisions finales … / Synthèses / RG-10 / D-239 » : 4 paragraphes copiés dans les 10 chapitres 01, 03, 04, 05, 06, 08, 09, 10, 11 et 12 ;
  - « Ancienne cible autonome retirée le 08/10/2026 » : 10 copies ; « Clôture des contrats — 01/10 » : 8 copies ;
  - paires : ch. 09 l. 339–345 = ch. 10 l. 313–319 (planification) ; ch. 09 l. 1168–1172 = ch. 11 l. 383–387 = ch. 12 l. 1557–1561 (phrase, i18n) ; ch. 04 l. 421–423 = ch. 09 l. 1140–1142 (copie complète) ; ch. 06 l. 2300–2307 = ch. 12 l. 1489–1496 (DSF V2).
  Les copies sont identiques aujourd'hui, sauf PRODUCT.md. Chaque mise à jour exige pourtant N modifications synchrones, et le seul échec constaté (PRODUCT.md) a déjà produit une règle fausse. Le ch. 08 §1.4 pose pourtant « Chaque sujet est décrit dans un document unique afin d'éviter toute redondance ».
- proposition : désigner une référence unique par règle et remplacer les copies par une phrase de renvoi d'une ligne (identifiant et ancre) :
  - calcul des durées : ch. 10 RM-129 et suivantes (ancre `calculs-durees`) ;
  - séquence des Pauses : ch. 10 ;
  - cartes, RG-1 à RG-13 et D-239 : DSF-CARTES-ICONES-APPUIS ;
  - planification : ch. 08 `#planification`, le ch. 09 n'en gardant que les données ;
  - phrase : ch. 08 `#phrases` ;
  - DSF V2 : le DSF, cité par le ch. 12.
  Les ch. 09, 11 et 12 ne gardent que ce qui relève de leur domaine (donnée, contrat d'API, composant).
- statut PR/décisions : aucun
- touche_PRE4 : oui (réécriture de chapitres figés : à programmer après PRE-4 ou sur décision explicite)
- question à Hermann : acceptez-vous de remplacer les copies par des renvois, une fois PRE-4 clos ?

### P-14 — L'ordre de la feuille Paramètres est écrit à quatre endroits et a déjà divergé

- qualification : DOUBLON (divergent)
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:1123` — « Feuille : en-tête fixe ✕ / Modalités d'exécution / ✓ ; corps défilant Mode → Séries (régime, chevron indépendant, nombre) → cible/Pause »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:2985` — « En-tête fixe ✕/titre/✓ ; corps défilant Mode → Séries → régime identiques/variables avec chevron indépendant → cible/Pause »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:4077` — « | 5 | Changement de côté | Segmenté, sans changement / D→G / G→D | »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:1125` — « Le régime identiques/variables, le mode et les choix de côtés utilisent les popovers représentés. »
- analyse : la même structure est décrite dans le ch. 06 l. 1123, le ch. 13 l. 2985 (CE-UI-10 §7), la table du ch. 13 l. 4071–4082 et le ch. 08 (tableau des champs, vers l. 1556–1587). Les divergences sont réelles : titre (Q11), contrôle de côté segmenté ou en popover (P10), place du régime avant ou après le nombre de Séries. Elles ont toutes dû être arbitrées une par une.
- proposition : la référence unique est la table du ch. 13 l. 4071 (« Règles communes de l'éditeur de paramètres »), une fois intégrés Q8, Q11, Q14, P10 et D-337. CE-UI-10 §7 et le ch. 06 l. 1123 renvoient à cette table. Le ch. 08 garde les règles de brouillon et de calcul, sans ordre d'affichage.
- statut PR/décisions : arbitré par Q11 et P10 (points divergents), intégration pendante ; le doublon lui-même n'est pas traité
- touche_PRE4 : oui
- question à Hermann : —

### P-15 — La liste des Préférences du Profil diffère d'un chapitre à l'autre

- qualification : DOUBLON (divergent)
- gravité : mineur
- passages :
  - `Specifications-fonctionnelles/01 – Vision Générale.md:99` — « Les Préférences sont : Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications. »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:389` — « - le `Compte à rebours d'exercice` ; »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:2593` — « Préférences locales : Sons, Annonces vocales, Vibration, Notifications ; groupe Exercice : Pause entre les côtés, Compte à rebours d'un exercice , Fin d'exercice ; groupe Séance : Récupération après exercice »
- analyse : il existe quatre listes. Le ch. 01 en a 6 entrées et le ch. 08 (tableau vers l. 1674–1683) n'a aucun défaut d'exercice. Le ch. 06 l. 381–391 ajoute Compte à rebours et Fin d'exercice, mais ni Pause entre les côtés ni Récupération, alors que ses captures montrent « Profil — Stepper Pause changement de côté » (l. 427) et « … Récupération après activité » (l. 435). CE-UI-07 (ch. 13) contient la liste complète, que PRODUCT.md (consolidation du 26/09) recoupe. Les listes ne se contredisent pas sur une valeur, mais elles décrivent des écrans différents.
- proposition : la référence est CE-UI-07 §5. Les ch. 01, 06 et 08 renvoient à cette liste au lieu de l'énumérer.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : —

### P-16 — Des valeurs par défaut sont justifiées par « le Figma de référence »

- qualification : AMBIGUITE_PERIMETRE (source de la règle)
- gravité : mineur
- passages :
  - `Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md:257` — « | RM-212 | `sideRecoverySeconds` est initialisé depuis le défaut global **Pause entre les côtés** du Profil (`10 s` dans le Figma de référence) »
  - `Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md:727` — « `30 s` dans le Figma de référence ; ajout explicite uniquement »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:2599` — « Défauts actés : côté 10 s, récupération après exercice 30 s, comptes à rebours 10 s, fins 5 s, Vibration activée. »
- analyse : D-255 et D-300 disent que Figma ne définit aucune valeur ni aucune règle. Pourtant le ch. 10 (règle métier), le ch. 09 (l. 726–727), le ch. 08 (l. 1583, 1782), le ch. 01 (l. 213) et PRODUCT.md (l. 470) donnent Figma pour source de deux défauts. Le ch. 13 les déclare « actés », sans citer de décision. Les valeurs concordent : le défaut est la source, pas la valeur.
- proposition : rattacher les défauts 10 s et 30 s à une décision du ch. 07 (à créer si aucune n'existe). Dans ces six passages, remplacer « dans le Figma de référence » par cette décision.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : confirmez-vous les défauts Profil « Pause entre les côtés = 10 s » et « Récupération après exercice = 30 s » comme règles produit ?

### P-17 — Du rendu visuel (px, couleurs, polices) est recopié dans des chapitres de comportement, de données et d'API ; le Profil a trois rendus incompatibles

- qualification : CONTRADICTION_REELLE (rendu du Profil) et DOUBLON (rendu recopié)
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:2306` — « - **Profil** : titres de section Semi Bold 16 px ; `Modifier` en `#0508E5`; groupes blancs 126 px ; zone de contexte 115 px »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:2613` — « Groupes selonDSF T5/T6 : fond#F9FAFC, liseré blanc 1, rayon 12, ombre sans rognage. »
  - `DSF-INTERFACE-GENERALE-2026-10-08.md:65` — « | trait | **aucun** | » (§0.4 Blocs de section, « Profil, planification, et tout écran futur », fond #F9FAFC)
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:93` — « Les dimensions de l'interface sont exprimées en points logiques React Native … jamais en pixels physiques. »
- analyse : classement des passages qui fixent du rendu.
  - (a) Légitime, car comportemental : présence ou absence d'un élément (aucun Déployer, D-261), libellés, cibles tactiles de 44 pt minimum, ordre d'activation.
  - (b) Empiète sur Figma et le DSF :
    - D-239 en pixels (298 × 46, x=80, tailles 13 et 11), recopié dans les ch. 09, 10, 11 et 12 (P-13) ;
    - « gouttière permanente de 64 px » (ch. 05 l. 250, ch. 01 l. 361) ;
    - « cercles visibles de `34 pt`, pictogrammes de `20 pt`, écart visuel de `12 pt` » (PRODUCT.md l. 110) ;
    - le bloc DSF V2 du ch. 06 l. 2300–2307 (couleurs hexadécimales, ombres, « y=449 », « Roboto Condensed Medium 24 px »), recopié au ch. 12 l. 1489–1496 ;
    - les géométries de CE-UI-10 §9 (« popover Mode184×99 », ch. 13 l. 2995) ;
    - les dimensions de la roulette du ch. 06 l. 185–186.
    Ces passages mélangent aussi px et pt, contre la règle du ch. 06 l. 93.
  - (c) Contradiction de rendu : les groupes du Profil sont « blancs » (ch. 06), « #F9FAFC, liseré blanc 1, ombre » (ch. 13 CE-UI-07) et « #F9FAFC, trait aucun » (DSF général du 08/10). Ce dernier se déclare général et postérieur, sans nommer les deux autres règles qu'il remplace.
- proposition : le rendu relève du DSF et de Figma. Les ch. 05, 09, 10 et 11 et PRODUCT.md ne gardent aucune valeur visuelle. Les ch. 06 et 13 ne gardent que les classes (a), plus un renvoi au DSF. Pour le Profil, le DSF général l. 56–65 fait référence, à condition qu'une mention explicite remplace CE-UI-07 §9 et ch. 06 l. 2306 ; à défaut, la question doit être posée.
- statut PR/décisions : couvert partiellement par P33 (les primitives natives priment sur les valeurs DSF) et D-255/D-300 (principe)
- touche_PRE4 : oui
- question à Hermann : pour les groupes du Profil, faut-il un liseré et une ombre (CE-UI-07) ou aucun trait (DSF général du 08/10) ?

### P-18 — L'ordre des éléments : comportement écrit ou layout Figma ?

- qualification : AMBIGUITE_PERIMETRE
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:1123` — « Formulaire : conserver les shells et l'ordre visible dans les captures. »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:230` — « l'ordre fonctionnel défini par le Figma est conservé. »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:2985` — « En-tête fixe ✕/titre/✓ ; corps défilant Mode → Séries → régime identiques/variables »
- analyse : la rubrique 7 « Structure de l'écran » du ch. 13 écrit l'ordre comme une exigence normative. Ailleurs, le ch. 06 délègue l'ordre aux captures, et P7 tranche un conflit d'ordre au motif que « l'ordre des blocs relève du layout, que Figma définit (D-255, D-300) ». Deux principes coexistent donc. Pour un ordre de lecture (accessibilité, H13) ou d'enchaînement, l'ordre est un comportement, de classe (a). Pour une simple disposition, il relève de Figma. La frontière n'est écrite nulle part.
- proposition : ajouter à la règle de gouvernance (P-01) une ligne : « l'ordre de présence et de lecture des éléments est un comportement (ch. 13 rubrique 7) ; positions, espacements et alignements relèvent de Figma ». Le ch. 06 l. 1123 et 230 renvoie alors à la rubrique 7. Un écart entre la capture et le texte devient un écart Figma à signaler, et non une règle.
- statut PR/décisions : couvert partiellement par P7 (cas Description et carte Paramètres)
- touche_PRE4 : oui
- question à Hermann : l'ordre des blocs d'un écran est-il une règle documentaire (Figma doit la suivre) ou un choix de layout (la documentation suit Figma) ?

### P-19 — Glossaire §8 : une règle périmée et des termes interdits encore employés

- qualification : CONTRADICTION_REELLE (« Sans répétition » / « Aucune ») et AMBIGUITE_PERIMETRE (usages d'« Activité »)
- gravité : mineur
- passages :
  - `Specifications-fonctionnelles/01 – Vision Générale.md:311` — « | **Sans répétition** | Ancien libellé du choix de planification unique ; l'interface utilise **Aucune**. | »
  - `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md:1225` — « **L'option « Aucune » n'existe plus.** Elle appartenait à un contrôle binaire `Aucune / Périodique` qui est supprimé. »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:119` — « `Créer une activité` reste inchangé. »
  - `Specifications-fonctionnelles/05 – Versions du produit.md:79` — « Enrichir rapidement la construction et l'exécution des routines »
- analyse : relevé des termes interdits ou obsolètes du §8 (ch. 01 l. 303–312) dans les autres chapitres et contrats.
  - « Sans répétition » : la règle du glossaire est périmée, puisque le libellé de remplacement « Aucune » est lui-même supprimé (ch. 08 l. 1225, PRODUCT.md l. 225). Le terme reste employé comme notion normative au ch. 09 l. 341 et au ch. 10 l. 315 ; au ch. 06 l. 1560, il s'agit d'un nom de frame.
  - « Activité » : il apparaît dans des titres de captures du ch. 06 (l. 435, 1957, 1963, et l. 2734–2790 pour les Formats du 14/10, « Modification activité — … »). Le ch. 06 l. 1588 admet que les noms de frames divergent. En revanche, « `Créer une activité` reste inchangé » (ch. 13 l. 119 ; ch. 01 l. 410 et ch. 06 l. 2400 « n'est pas concerné ») ne dit pas s'il s'agit d'un libellé visible, ce qui serait interdit, ou d'un nom de frame.
  - « Routine » au sens de contenu : ch. 05 l. 79 et l. 138 (« routines prescrites »).
  - « Set » : seulement des « sets » de composants Figma (DSF-CARTES l. 102, D-239), un autre sens, sans écart.
  - « Mes séances » : aucun usage hors glossaire.
  - « Bloc » : seulement au sens de bloc de mise en page (ch. 13 « Bloc B1 », DSF), pas au sens de structure répétable.
- proposition : récrire l'entrée « Sans répétition » du §8 (« interrupteur Répétition désactivé ») et remplacer le terme au ch. 09 l. 341 et au ch. 10 l. 315 par « Répétition désactivée ». Au ch. 13 l. 119, préciser « nom de frame historique, non affiché ». Au ch. 05 l. 79 et 138, remplacer « routines » par « séances ». Ajouter au §8 une note : les noms de frames Figma sont exemptés, les titres et libellés ne le sont pas.
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch. 01, 09, 10, 13)
- question à Hermann : « Créer une activité » est-il encore un libellé visible quelque part dans l'application ?

### P-20 — Le ch. 08 cite comme source de ses Formats un lien qui pointe vers lui-même

- qualification : REFERENCE_ROMPUE (elle masque l'origine d'une règle)
- gravité : mineur
- passages :
  - `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md:685-689` — « <a id="formats-conception"></a> … Source normative : [spécification Formats du 14/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#formats-conception) »
  - `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md:3` — « Voir la chapitre 08, Planification. » (dans le ch. 08 lui-même)
- analyse : la section Formats du ch. 08 renvoie à sa propre ancre comme « source normative ». Ni le document d'origine (brief du 14/10, DSF-FORMATS-SEANCES ?) ni les décisions D-357 à D-369 ne sont nommés à cet endroit. Un lecteur ne peut donc pas savoir si le ch. 08 est la source ou une copie. Le bandeau de la l. 3, copié dans 6 chapitres, s'auto-référence de la même façon.
- proposition : remplacer le lien par « Source : décisions D-357 à D-369 (ch. 07 §Formats) et DSF-FORMATS-SEANCES-2026-10-14 ». Dans le ch. 08, remplacer le bandeau de la l. 3 par « voir §Planification ».
- statut PR/décisions : aucun (cas absent de `links.tsv`, car le lien est techniquement valide)
- touche_PRE4 : oui
- question à Hermann : —

### P-21 — Ch. 13 : des « Compléments » et « Révisions » datés remplacent implicitement le texte en dessous

- qualification : DOUBLON (règle réécrite par ajout, sans retrait de l'ancienne)
- gravité : majeur
- passages :
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:3027` — « Repli ne contourne pas validation ; erreur nommant la Série. »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:4100` — « aucun message en ligne (D-337, 12/10 : remplace le message nommant la Série à renseigner). »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:2999` — « Les anciennes indentations systématiques x52 des contrôles variables sont remplacées par la grille à cellules »
  - `Specifications-fonctionnelles/13 – Contrats d'écran.md:4253` — « Les sous-lignes Séries variables/cible/Pause et Ordre/PC restent indentées x52, séparateurs314px. »
- analyse : dans CE-UI-10, 9 mentions « Complément cible12/10 », 1 « Complément Formats du 14/10 », 1 « Révision13/10 » et 1 « Alignement DSF du 12/10 » sont placées **au-dessus** du corps de rubrique d'origine, qui reste inchangé (§5, 7, 8, 9, 12, 18, 20). Le lecteur doit déduire seul quelle phrase l'emporte. Exemples :
  - §8 : le complément dit « Total affichable en lecture seule sous héritage », puis le corps dit « Total absent en Répétitions sans bip… » sans évoquer l'héritage ;
  - §14 : le corps garde « erreur nommant la Série », qui n'est remplacé qu'à 1 000 lignes de là (l. 4100). Le remplacement est explicite, mais il n'est pas écrit à l'endroit remplacé ;
  - §9 : la l. 2999 remplace x52, puis la l. 4253 le rétablit ;
  - la table l. 4077 garde « Segmenté » pour le côté, alors que le DSF Circuits le remplace par un popover (P10).
  Le même mécanisme existe ailleurs : 18 « Complément cible12/10 » et « Complément Formats du 14/10 » en tête des CE-T03-08, CE-UI-02/03 et CE-CIR. Il existe aussi sous forme de phrases de remplacement sans cible nommée, copiées dans 10 chapitres : « Ces règles finales prévalent sur les anciennes formulations d'affichage du présent chapitre dans ce périmètre uniquement » (ch. 06 l. 2275, par exemple), ou en tête du DSF général (l. 3 : « Les mesures datées ci-dessous ne décrivent pas les états remplacés »). Le bon modèle existe pourtant dans le corpus : D-337 (« remplace le message en ligne de chapitre 08 ») et le ch. 13 l. 4087 (« État historique livré PRE-3 … supersèdent cette présentation ») nomment ce qu'ils remplacent.
- proposition : principe de réécriture, en quatre points.
  1. Un complément est **fusionné** dans la rubrique concernée : la phrase remplacée est supprimée (Git garde l'historique). Une ligne « Historique » en fin de rubrique cite la décision (« D-337 du 12/10 remplace l'ancien message nommant la Série »).
  2. Aucune phrase « prévaut sur les anciennes formulations » sans la liste des formulations visées.
  3. Une règle partagée par plusieurs contrats (Cible par Série, Bip, Pauses) est écrite une fois au §4 et citée par renvoi.
  4. Les marques de date (« 12/10 ») ne servent que dans le ch. 07.
  Pour PRE-4, la fusion de CE-UI-10 peut s'appuyer sur Q8, Q11 à Q15, P4, P10, P11, P19, P23 et P24, déjà arbitrés.
- statut PR/décisions : couvert partiellement : chaque conflit isolé est arbitré (P4, P10, P23, P24), mais le schéma qui les produit ne l'est pas ; PR #371 réécrit une partie de CE-UI-10 (à vérifier lors de la fusion)
- touche_PRE4 : oui
- question à Hermann : acceptez-vous la règle « fusionner, ne pas empiler » pour les ch. 06 et 13, appliquée après PRE-4 ?

### P-22 — Ch. 06 : des sections datées en fin de chapitre modifient des familles écrites plus haut

- qualification : DOUBLON (remplacement implicite par ajout)
- gravité : mineur
- passages :
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:2404` — « Les captures hors de la galerie de planification n'ont pas été réexportées dans cette passe : leurs mesures antérieures ne remplacent pas ces règles. »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:16` — « ### Mise à jour Cadence et DSF du06/10/2026 »
  - `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:2420` — « 46 états présents sur Prototype MVP, exportés dans ce lot. »
- analyse : le ch. 06 annonce une organisation par famille (l. 7 : « Chaque famille rassemble ses règles et toutes ses captures »). Pourtant 12 sections datées sont ajoutées après les familles (l. 2244 à 2424 : Bilatéralité 13/09, Évidences 16/09, Résolutions 16/09, Cartes 30/09, DSF V2 28/09, Paramètres 02/10, Titres, Règles générales 08/10, Clarification 12/10, Composition 12/10, Formats 14/10, environ 300 lignes de captures). Elles modifient des règles des familles Profil, Composition et Éditeur sans les réécrire. Exemples : la l. 2404 rend caduques des « mesures antérieures » non nommées (dont la l. 2306 et les l. 188–192) ; la l. 2310 remplace « le champ éditable v10.2 » ; la clarification de la l. 2406 est un paragraphe déjà copié dans 9 chapitres (P-13). Les captures Formats du 14/10 ne sont pas rangées dans leurs familles (Composition, Éditeur), contrairement à la règle de la l. 7.
- proposition : même principe que P-21. Chaque section datée est fusionnée dans sa famille, puis supprimée. Les sections « HISTORIQUE » et « Référence historique hors MVP » passent dans `docs/archives`. Les captures Formats rejoignent leurs familles, avec la mention de version issue de P-09.
- statut PR/décisions : PR #363 (44 captures) touche les mêmes familles et doit être alignée sur ce principe
- touche_PRE4 : oui
- question à Hermann : —

---

## Couverture

Lu en entier : `BRIEF-COMMUN.md` ; `pre4-bmad-questions-ouvertes.md` ; ch. 05 (entier) ; PRODUCT.md (entier).

Lu par sections ciblées :
- ch. 01 : §Périmètre MVP, §Ambition, §Cible confirmée, §Médias, §Concepts, Glossaire §7, §8, §9, Titres, Planification, Circuits, Formats ;
- ch. 02 : §1 Besoins MVP, §7, §8, §Parcours post-MVP ;
- ch. 03 : Synthèse, Limites du MVP, Parcours 3 et 4, T03, post-MVP ;
- ch. 06 : l. 1–100, 175–232, 379–400, 1111–1130, 1586–1590, 2205–2424, plus la table complète des titres de sections ;
- ch. 07 : D-077, D-111, D-113, D-203, D-208, D-209, D-221, D-239, D-255, D-261, D-300, D-328, D-333, D-336 à D-344, recette 2, Formats l. 614–632 ;
- ch. 08 : §1 (l. 1–70), l. 685–700, 795–798, 1225, 1556, 1670–1692 ;
- ch. 09 : l. 240–256, 339–345, 724–728, 1018–1024 ;
- ch. 10 : l. 72, 257, 313–319, 600–612 ;
- ch. 11 : l. 73, 264 ;
- ch. 12 : l. 1340–1370, 1489–1496 ;
- ch. 13 : l. 1–72, CE-UI-10 complet (l. 2949–3063), CE-UI-07 (l. 2573–2613), l. 4057–4110, 4249–4260, plus la table des titres de sections ;
- DSF-INTERFACE-GENERALE (l. 1–70) ; CONCEPTION-EXECUTION-MEDIA (statut).

Relevés mécaniques (grep) sur tout le corpus : MVP/V1/V2 ; termes interdits du glossaire §8 ; formules « prévaut / fait foi / Figma de référence » ; lignes de plus de 250 caractères dupliquées entre chapitres ; variantes du paragraphe « Durée intrinsèque calculable ».

Non lu : le reste des ch. 04, 08, 09, 10, 11 et 12 (corps détaillé des règles et API, hors des passages cités) ; les familles intermédiaires du ch. 06 (Catalogues, Calendrier, Exécution, Synthèse, Suivi) au-delà des titres ; les contrats CE-T03, CE-EXEC, CE-CIR et CE-FMT du ch. 13 au-delà des en-têtes « Complément » ; les matrices, rapports et DSF autres que DSF-INTERFACE-GENERALE ; le contenu des PR #363, #370 et #371 (seul leur périmètre déclaré dans le brief a été pris en compte). La recherche de doublons ne couvre que les lignes identiques de plus de 250 caractères : les doublons reformulés (règle identique, texte différent) ne sont pas recensés, en dehors des cas P-14 et P-15 relevés à la lecture.
