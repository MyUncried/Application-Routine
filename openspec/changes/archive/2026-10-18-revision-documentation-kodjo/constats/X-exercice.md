# X — Exercice et paramètres d'exécution : diagnostic (lecture seule)

Base lue : `C:\Dev\KODJO-OPENSPEC-DOCS`, état de travail courant (main 6656fefc + branche docs/openspec-revision). Lus avant la recherche : BRIEF-COMMUN.md, pr371.diff + body, pr370.diff + body, pre4-bmad-questions-ouvertes.md (Q1–Q23, P1–P44, H1–H30). Les points déjà tranchés (Q8, Q11–Q23, P1–P44, phases PR #370) ne sont pas rediagnostiqués. Quand un passage de main contredit encore un arbitrage, il est signalé « arbitré, intégration pendante », avec ce que PR #371 couvre ou non.

Abréviations de fichiers (toutes sous `docs/`) :
- ch03 = `Specifications-fonctionnelles/03 – Parcours utilisateur.md`
- ch06 = `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- ch07 = `Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- ch08 = `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`
- ch09 = `Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md`
- ch10 = `Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md`
- ch11 = `Specifications-fonctionnelles/11 – API fonctionnelles.md`
- ch13 = `Specifications-fonctionnelles/13 – Contrats d’écran.md`
- les DSF, MATRICE et JSON sont cités par leur nom de fichier.

Les numéros de ligne sont ceux de l'arbre de travail actuel (sans PR #370 ni #371). Les citations ont été vérifiées par grep -n et par un script de contrôle (cf. Couverture).

---

## Priorité 1 — calculs, bornes, validation

### X-01 — Arrondi « à la minute supérieure » (RM-159, D-090) contre affichage en min/s des cartes
- qualification : CONTRADICTION_REELLE (texte normatif contre arbitrage Q20 et règle de non-régression P41)
- gravité : majeur
- passages :
  - `ch10:141` — « Exprimée en secondes dans le Domaine, elle est convertie en minutes par arrondi à la minute supérieure (`Math.ceil`). »
  - `ch07:124` — « La durée synthétique des Exercices affichée dans le Catalogue et la Composition est convertie en minutes par arrondi à la minute supérieure (`Math.ceil`). » — statut de la décision : Révisée par D-131
  - `ch07:163` — D-131 : « La `Durée synthétique des Exercices`, affichée dans le Catalogue et sous `Nombre de tours` dans la Composition, couvre exclusivement les Exercices » (aucune mention de l'arrondi)
- analyse : RM-159 impose encore un arrondi `Math.ceil` aux cartes Catalogue et Composition. D-090 est dite « révisée par D-131 », mais D-131 ne dit ni que l'arrondi est maintenu ni qu'il est retiré : on ne sait pas si l'arrondi est encore en vigueur. Q20 impose « ≥ 1 min 45 s » sans arrondi pour le total partiel. P41 constate que la carte Catalogue PRE-3 affiche « 2 min 45 s » pour 165 s et en fait la règle pour les totaux exacts et estimés. Le texte normatif (RM-159) et le comportement arbitré sont donc incompatibles pour le même objet (durée synthétique d'une carte Catalogue ou Composition). La Rectification Q20 du 16/10 confirme qu'aucune décision ne garde l'arrondi.
- proposition : faire du formateur des cartes (min/s, sans arrondi) la référence unique, écrite une seule fois dans ch10 (RM-159). Retirer de RM-159 la phrase « convertie en minutes par arrondi… (`Math.ceil`) ». Passer D-090 au statut « Supersédée par Q20/P41 (16/10) ». Préciser dans D-131 qu'elle ne reprend pas l'arrondi. Pour la carte de Séance (P41 : formateur propre), renvoyer au formateur existant au lieu de le redéfinir.
- statut PR/décisions : arbitré par Q20 (total partiel) et P41 (exact/estimé). Intégration absente de PR #371 et de toute PR.
- touche_PRE4 : oui
- question à Hermann : confirmer que RM-159 perd l'arrondi `Math.ceil` pour **toutes** les natures (exact, ≈, ≥) sur les cartes Catalogue et Composition, et que seule la carte de Séance garde son formateur.

### X-02 — ≥ d'un Exercice mixte sur les cartes : propagation de Q17 incomplète, y compris après PR #371
- qualification : CONTRADICTION_REELLE (arbitrée), intégration pendante
- gravité : majeur
- passages :
  - `DSF-CARTES-DUREE-2026-10-07.md:18` — « À l’Exercice : Durée → valeur exacte ; Répétitions avec bip → ≈valeur ; Répétitions sans bip et À l’échec → aucun contenu dans cet emplacement. »
  - `ch13:440` — « Durée exacte / Répétitions avec bip≈ / autres modes sans total ; ne pas tester les calculs sur les montants dessinés. » (même texte en `ch13:339` et `ch13:738`)
  - `ch06:1119` — « Répétitions : ≈ avec cadence, omission sans bip à l’Exercice ; À l’échec aucun total. »
  - `ch10:135` — RM-072 : « Exercice : exact en Durée, ≈ en Répétitions avec bip, omitted en Répétitions sans bip et À l’échec. »
- analyse : Q17 fixe que les cartes consommatrices affichent ≥ si le total est partiel, comme l'éditeur et RM-129/RM-132. PR #371 ne corrige que le §5 des six contrats et D-309. Restent incompatibles avec Q17 : le DSF Cartes-Durée (qui pilote le rendu des cartes et n'a aucune actualisation du 13/10), le §20 « Recette » de trois contrats (CE-T03-01, CE-T03-02, CE-T03-05) et le résumé de ch06. RM-072 est lue par P25 comme portant sur le tout échec, mais son texte reste ambigu. Le même objet (durée d'un Exercice mixte sur une carte) reçoit donc deux règles.
- proposition : faire de RM-129/RM-132 (ch10) la référence unique. Ajouter en tête du DSF Cartes-Durée une actualisation « ≥ pour un mélange calculable (Q17) ». Remplacer le §20 des trois contrats par un renvoi à RM-132. Réécrire RM-072 et ch06:1119 en « toutes cibles À l’échec ».
- statut PR/décisions : arbitré par Q17. PR #371 couvre partiellement (§5 des six contrats, D-309), pas DSF-CARTES-DUREE, ni les §20, ni ch06:1119, ni RM-072.
- touche_PRE4 : oui
- question à Hermann : aucune.

### X-03 — Total d'Exercice pendant une saisie incomplète : « — » contre absence de ligne (H10)
- qualification : AMBIGUITE_PERIMETRE (deux textes normatifs et une hypothèse PRE-4 incompatibles)
- gravité : majeur
- passages :
  - `ch06:1119` — « Total variable readonly et — si incomplet »
  - `ch08:1565` — « Variable : lecture seule, — si incomplet ; Répétitions chiffrées avec bip≈ ; sans bip absente ; mélange calculable≥ ; tout échec absent »
  - `ch10:613` — « Erreur de cible : validation distincte, aucune fausse valeur. »
- analyse : ch06 et ch08 prescrivent un tiret dans la ligne Total pendant une saisie incomplète en variable. H10 (hypothèse PRE-4, sans décision) retient l'inverse : ni ligne ni montant. ch10:613 dit seulement « aucune fausse valeur », que les deux lectures respectent. Rien n'est dit pour une cible uniforme incomplète. Il ne s'agit pas d'omitted (absence de ligne, ch10:654) mais d'un état de validation. La règle de rendu n'est donc pas fixée, et l'hypothèse H10 contredit deux passages écrits.
- proposition : écrire la règle une seule fois dans CE-UI-10 §17 « Erreurs et cas limites » (états), et la faire référencer par ch06 et ch08. Le choix entre « — » et absence de ligne relève de Hermann.
- statut PR/décisions : aucun (H10 n'est qu'une hypothèse).
- touche_PRE4 : oui
- question à Hermann : pendant qu'une cible est à renseigner, la ligne Total de la feuille affiche-t-elle « — » (ch06, ch08) ou disparaît-elle (H10) ? Et en uniforme ?

### X-04 — Valeur historique hors bornes : conservée et calculée (Q15) mais « invalide » pour la validation
- qualification : AMBIGUITE_PERIMETRE (Q15 règle l'affichage et le calcul, pas la validation ; les contrats bloquent toute valeur hors bornes)
- gravité : majeur
- passages :
  - `ch13:4100` — « ✓ grisé tant que le mode ou une cible active exigée est invalide ; cellule concernée signalée par son contour »
  - `ch13:3027` — « Cibles chiffrées : N1..99,Ri1..100,Ti5..3535s,Pauses0..300s,Bip entier0..10 dans deux modes. −1,11,fraction invalides, aucune correction silencieuse. »
  - `ch13:3041` — « Historique non modifié ; données héritées hors plage à traiter explicitement, jamais tronquées silencieusement. »
  - `ch11:352` — « | API-PARAM-01 | Valider les bornes des paramètres | Paramètres d’exécution | paramètres valides / erreur | »
- analyse : Q15 conserve une cible historique (7 s, 5999 s) « affichée et calculée telle quelle tant qu'on ne la modifie pas ». Q21 et P38 règlent la roulette et les ±. Aucune décision ne dit si la feuille et `Terminer` acceptent cette valeur non modifiée. Lus à la lettre, CE-UI-10 et API-PARAM-01 la rejettent (« invalide », « erreur »), alors que H25 (hypothèse) l'accepte. « À traiter explicitement » (ch13:3041) ne tranche rien. Le cas est réel : PR #370 signale que le code canonique autorise 1..5999 s alors que RM-234 dit 5..3535 s, ce qui rend probables des données hors bornes. Le Profil a déjà une règle explicite pour son cas analogue (D-265 : valeur au-delà conservée, « + » inactif, « − » ramène à la borne), ce qui montre qu'une règle explicite est attendue.
- proposition : référence unique dans ch10, à côté de RM-234 : « une valeur héritée hors bornes non modifiée reste valide pour ✓, `Terminer` et API-PARAM-01 ; seule une valeur modifiée doit respecter les bornes ». CE-UI-10 §14 et API-PARAM-01 y renvoient. Énoncer aussi le cas du Bip (0..10, ch09:1270).
- statut PR/décisions : couvert partiellement par Q15, Q21 et P38 (affichage, roulette, ±). La validation n'est couverte que par H25, qui reste une hypothèse.
- touche_PRE4 : oui
- question à Hermann : confirmer H25. Une cible, une Pause ou un Bip ancien hors bornes, non modifié, laisse-t-il ✓ et `Terminer` actifs ?

### X-05 — Pas des ± sur une cible Durée : Q21 et P38 absents de toute documentation ; la formulation de PR #371 diverge de Q21
- qualification : COMPLEMENT manquant, avec risque de CONTRADICTION_REELLE dans la PR
- gravité : majeur
- passages :
  - `ch13:4098` — « Steppers : tap1 ; maintien≈500ms, puis paliers5 après≈2s et10 après≈4s, arrondi directionnel au multiple et saturation aux bornes. »
  - `DSF-CIRCUITS-CONTROLES-2026-10-12.md:36` — « | Groupe ± du pied | x254/y6, 88 × 36 | Conserver paliers et bornes du champ, définis par la spécification | »
  - `ch13:4093` — « | Durée par Série | 5..3535s | Roulette par pas de5s ;00:00 interdit comme cible | »
- analyse : la spécification ne donne au champ Durée par Série qu'une roulette par pas de 5 s, sans règle pour le pied ±. Or le DSF renvoie le pas du pied « à la spécification ». Lue seule, la règle générale des steppers (« tap1 ») donnerait 1 s. Q15 fixe 5 s, et PR #371 ajoute « Le pied ± de cible Durée utilise un pas de 5 s ». Q21 précise que, depuis 7 s, les ± mènent au multiple de 5 s voisin dans le sens du geste (10 s ou 5 s), et non à 12 s ou 2 s. P38 traite la borne haute. Ni Q21 ni P38 ne figurent dans un chapitre ou un DSF, et la phrase de PR #371 peut être lue comme « + 5 s » à partir de 7 s. H19 (paliers 5 puis 10 au maintien) est une hypothèse.
- proposition : référence unique dans le tableau des bornes de ch13 (l. 4093), ligne Durée par Série. Ajouter une colonne « ± du pied » : « pas 5 s ; depuis une valeur hors grille, multiple de 5 voisin dans le sens du geste ; au-dessus de 3535, + indisponible et − ramène à 3535 (Q21, P38) ». Faire de même pour Répétitions (1, bornes 1..100, 150 → − ramène à 100). Aligner la phrase de PR #371 sur cette règle.
- statut PR/décisions : arbitré par Q15, Q21 et P38. PR #371 intègre Q15 seulement, avec une formulation ambiguë au regard de Q21.
- touche_PRE4 : oui
- question à Hermann : confirmer H19, c'est-à-dire l'accélération au maintien (5 puis 10 s) sur une base de pas déjà égale à 5 s.

---

## Priorité 2 — décisions arbitrées dont la doc dit encore l'inverse

### X-06 — Texte d'abandon en création : PR #371 n'écrit pas le texte décidé en Q18
- qualification : CONTRADICTION_REELLE (PR brouillon contre décision Q18)
- gravité : majeur (le texte serait gravé dans D-094 et CE-T03-04)
- passages :
  - `pr371.diff:127` (D-094, ligne ajoutée) — « en création : titre `Abandonner la création ?`, message `L’exercice ne sera pas créé.` »
  - `pr371.diff:197` (CE-T03-04 §4, ligne ajoutée) — « Création : « Abandonner la création ? » / « L’exercice ne sera pas créé. ». »
  - `ch06:944` (modèle Séance auquel Q18 s'aligne) — « > Les informations saisies seront perdues et la séance ne sera pas créée. »
- analyse : Q18 fixe « Les informations saisies seront perdues et l'exercice ne sera pas créé. ». PR #371 écrit une version raccourcie aux deux endroits. Le titre, le texte de modification et les boutons sont conformes. Le texte de main (D-094 l. 128, « cette exercice ») reste fautif tant que la PR n'est pas fusionnée.
- proposition : corriger PR #371 avec le texte exact de Q18 dans D-094 et CE-T03-04 §4, et faire de CE-T03-04 §4 la référence (D-094 y renvoie).
- statut PR/décisions : arbitré par Q18. PR #371 l'intègre de façon inexacte.
- touche_PRE4 : oui
- question à Hermann : aucune (sauf si la version courte était voulue).

### X-07 — Sélecteur de cible en Répétitions : Q8 (roulette) non intégré, et PR #371 réécrit une ligne en gardant le stepper
- qualification : CONTRADICTION_REELLE (arbitrée), intégration pendante
- gravité : majeur
- passages :
  - `ch07:294` — D-219 : « les **entiers simples et courts** de l’éditeur/Composition (`Nombre de Séries`, `Nombre de répétitions`, `Nombre de Tours`) utilisent un **stepper inline** et n’ouvrent pas de roulette/modale. »
  - `ch13:125` — « Les entiers simples `Nombre de Séries`, `Nombre de répétitions` et `Nombre de Tours` utilisent un **stepper inline** et n’ouvrent aucune roulette. »
  - `ch08:1808` — « Séries : stepper `1..99`. Répétitions : stepper `1..100`. »
  - `pr371.diff:166` (ch08 l. 1573 réécrite) — « Séries `1..99` et Répétitions `1..100` utilisent des steppers ; les réglages du Profil utilisent des steppers. »
- analyse : Q8 remplace, pour la cible Répétitions, le stepper par une roulette à une colonne (option échec en tête, puis 1 à 100). Q8 cite ch13 l. 125, ch06 l. 186 et 2199, D-219 et ch08 l. 1559 et 1573. PR #371 touche ch08 l. 1573 pour Q12 sans retirer « Répétitions … steppers », et ne touche ni D-219, ni ch13:125, ni ch08:1808. Le stepper reste juste pour `Nombre de Séries` et `Nombre de Tours` : la contradiction ne porte que sur la cible Répétitions.
- proposition : référence unique dans CE-UI-10 §12 « Contrôles et interactions » (roulette de cible, Q8 et Q14). Amender D-219, ch13 §4.6 l. 125, ch06 l. 186 et 2199, ch08 l. 1559, 1573 et 1808 en « Répétitions : roulette de cible (Q8) ; Séries et Tours : stepper ». Corriger la ligne réécrite par PR #371.
- statut PR/décisions : arbitré par Q8 et Q14. PR #371 ne l'intègre pas et réécrit la ligne l. 1573 en gardant « Répétitions … steppers ».
- touche_PRE4 : oui
- question à Hermann : aucune.

### X-08 — D-092 « Validée » borne les répétitions à 1–99 ; toutes les sources actives disent 1..100
- qualification : CONTRADICTION_REELLE (registre ch07 interne ; aucune mention explicite de remplacement de D-092)
- gravité : mineur (les sources actives concordent à 1..100, mais le registre affiche une décision « Validée » contraire)
- passages :
  - `ch07:126` — « Les roulettes `Nombre de répétitions` et `Nombre de Séries` d’un Exercice sont bornées à 1–99, par cohérence avec le seul précédent comparable du produit (Tour, D-058). | Validée »
  - `ch07:312` — D-232 : « Bornes conservées : N1..99, répétitions1..100, durée5..3535s, pauses0..300s »
  - `DSF-DEUX-MODES-ECHEC-2026-10-13.md:37` — « Répétitions : entiers1–100. »
- analyse : même objet (borne des répétitions par série), même périmètre (éditeur MVP). D-232 ne nomme pas D-092. Avec la roulette Q8, ce sont 100 lignes de nombres, plus la ligne échec : la borne compte. De son côté, D-232 est « Supersédée sur ces points le 02/10 » alors que ch04:399, ch09:1116 et RM-234 la citent comme source active des bornes : statut confus.
- proposition : passer D-092 au statut « Révisée par D-232 (répétitions 1..100) ; Séries 1..99 conservé ». Faire de RM-234 (ch10:281) la référence unique des bornes et y faire renvoyer ch04, ch09, ch11 et ch12.
- statut PR/décisions : aucun.
- touche_PRE4 : oui
- question à Hermann : aucune (1..100 est confirmé le 13/10, R06).

### X-09 — Roulettes de cible et de Durée totale : « inline sous la ligne » contre popover (13/10)
- qualification : CONTRADICTION_REELLE de présentation (même contrôle, même écran). Elle se tranche par D-255 et D-300 (Figma définit le layout) et par la mention explicite du 13/10.
- gravité : majeur (le modèle de validation Q12, ✓ et ✕ de la roulette, suppose une surface propre)
- passages :
  - `ch08:1571` — « Les steppers sont permanents dans la feuille CE-UI-10 ; les roulettes de durée se déploient sous leur ligne dans cette même feuille. »
  - `ch13:127` — « L’exception de CE-UI-10 concerne uniquement la roulette inline, jamais la couleur ou l’opacité du voile. »
  - `ch06:2199` — « Dans la feuille v13, les roulettes s’ouvrent inline sous la ligne active »
  - `ch13:2995` — « Roulette cible : popover354×249 avec maître8452:13297 (330×181), option en tête330×30, séparateur1px, roulette numérique150px. Le total conserve le maître5544:5118 (330×150) et son popover354×216. »
- analyse : CE-UI-10 §9 (révision du 13/10) et le DSF Deux modes (l. 19, « Popover hôte de cible 354×249 ») placent les roulettes dans un popover ancré. ch08, ch13 §4.6, ch06 et DSF-SERIES-VARIABLES:24 les décrivent encore déployées sous la ligne. Q12 (✓ et ✕ propres à la roulette) n'a de sens qu'avec une surface distincte. P33 ne traite que le rendu natif.
- proposition : référence unique dans CE-UI-10 §9 (popover). Remplacer ch08:1571, ch13:127 et ch06:2199 par un renvoi, et ajouter au DSF-SERIES-VARIABLES une mention « remplacé par DSF Deux modes, 13/10 ».
- statut PR/décisions : couvert partiellement par Q12 (validation) et P33 (rendu). L'emplacement inline/popover n'est ni arbitré ni intégré.
- touche_PRE4 : oui
- question à Hermann : confirmer que les deux roulettes (cible et Durée totale) s'ouvrent en popover et non déployées sous leur ligne.

### X-10 — Validation propre à la roulette (Q12) : un DSF actif dit encore l'inverse, hors PR #371
- qualification : CONTRADICTION_REELLE (arbitrée), intégration pendante
- gravité : mineur
- passages :
  - `DSF-SERIES-VARIABLES-2026-10-02.md:24` — « | Roulette | DSF Forms/Roulette, minutes/secondes, sous sa ligne ; pas de seconde modale ni validation indépendante | »
  - `ch08:1573` — « Annuler et Valider portent sur l’ensemble de la feuille, sans seconde validation par roulette. »
- analyse : Q12 donne à la roulette ses propres ✓ et ✕. PR #371 corrige ch08:1573, ch13 et le DSF Deux modes, mais pas ce tableau du DSF du 02/10. Son en-tête (l. 3) délègue aux contrôles du 12/10 sans viser la roulette. La règle y reste donc lisible comme active.
- proposition : ajouter dans DSF-SERIES-VARIABLES une ligne « Roulette : remplacé par Q12 (16/10) et DSF Deux modes » ; la référence reste CE-UI-10 §12.
- statut PR/décisions : arbitré par Q12. PR #371 couvre partiellement (pas le DSF Séries variables).
- touche_PRE4 : non (DSF hors de la liste figée)
- question à Hermann : aucune.

### X-11 — Champ « Mode » à droite du titre de la carte : Q23 le retire, deux sources le prescrivent
- qualification : CONTRADICTION_REELLE (arbitrée), intégration pendante
- gravité : mineur
- passages :
  - `DSF-PHRASES-V15-2026-10-07.md:15` — « Le champ à droite de Paramètres d’exécution affiche le **mode** des paramètres appliqués ; il n’affiche pas un total. »
  - `ch13:572` — « Le champ du mode est distinct de la durée : Répétitions sur7059:13302 et7119:27855. »
- analyse : Q23 retire le bouton ou le nom du Mode à droite du titre : la carte devient une seule zone touchable, et le Mode reste visible dans la Phrase. Les deux passages, dont l'un dans un DSF figé PRE-4, prescrivent l'élément retiré. PR #371 ne les touche pas.
- proposition : référence CE-T03-04 §7 « Structure de l'écran » (structure de la carte). Marquer DSF-PHRASES:15 et CE-T03-04 §6 comme remplacés par Q23.
- statut PR/décisions : arbitré par Q23. Aucune PR.
- touche_PRE4 : oui
- question à Hermann : aucune.

### X-12 — Libellé « modalités d'exécution » : deux restes après PR #371
- qualification : CONTRADICTION_REELLE (arbitrée), intégration pendante
- gravité : mineur
- passages :
  - `ch08:459` — « (ligne « Séries » de la modale des modalités d'exécution). »
  - `ch13:4197` — « appliqué à toutes les valeurs numériques de la modale des modalités d'exécution et aux réglages de composition de séance. »
- analyse : Q11 impose « Paramètres d'exécution » partout. PR #371 traite ch06, ch13 (titres) et le DSF Circuits, mais pas ces deux occurrences en minuscules, avec apostrophe droite, qu'une recherche sur « Modalités d’exécution » ne trouve pas. INVENTAIRE-DSF-CIRCUITS:5 et MATRICE-COUVERTURE-FIGMA-CHAPITRE-06:3 sont des relevés datés, à laisser.
- proposition : remplacer par « feuille Paramètres d'exécution » dans PR #371.
- statut PR/décisions : arbitré par Q11. PR #371 couvre partiellement.
- touche_PRE4 : oui
- question à Hermann : aucune.

---

## Priorité 3 — cartes consommatrices et rendus non définis

### X-13 — Résumé des séries sur les cartes : deux notations (Catalogue et Composition), règle en quatre exemplaires, mélange non défini
- qualification : DIFFERENCE_PERIMETRE (Catalogue et Composition), DOUBLON (règle Catalogue écrite quatre fois), lacune pour le mélange chiffré/échec
- gravité : majeur (Q4 admet l'affichage des nouvelles cibles chez les consommateurs ; aucun rendu n'est écrit)
- passages :
  - `ch13:390` — « synthèse `N séries de X` / `N séries de N rép.` / `N séries à l’échec`, miroir 16 si bilatéral. »
  - `ch13:376` — « Exercice variable : indicateur N séries variables et total intrinsèque selon v13 ; pas de détail exhaustif des cibles sur la carte. »
  - `ch13:4167` — « | trois séries variables, répétitions | **`10 · 12 · 14 rép.`** | **nouveau** — remplaçait « 3 séries variables » | »
  - `ch13:4168` — « | trois séries, durée composée | `3 × 1 min 30` | inchangé | »
- analyse : 1) Catalogue (« N séries de X », « N séries variables ») et Composition (« 3 × 45 s », « 10 · 12 · 14 rép. ») sont deux cartes différentes : écart de périmètre légitime. Mais la mention « remplaçait 3 séries variables » n'indique pas si la Catalogue est aussi concernée. 2) La synthèse Catalogue est recopiée à l'identique en ch04:405, ch08:1814, ch09:1122 et ch10:287 : risque de divergence. 3) Aucune source ne donne le rendu d'un Exercice **mixte** (10, 12, échec) ni sur l'une ni sur l'autre carte ; seuls le tout échec et le tout chiffré sont définis. H20 couvre la Catalogue par hypothèse ; la Composition n'est pas couverte. 4) « 1 min 30 » (Composition) diffère du format « 1 min 30 s » de ch08:618, dont la portée (phrase seulement ou toute durée) n'est pas dite.
- proposition : référence unique des résumés de carte dans ch13 §« Ce que porte la carte d'un exercice » pour la Composition, et dans CE-T03-02 §8 pour le Catalogue. Les quatre copies (ch04, ch08, ch09, ch10) renvoient à ces deux endroits. Ajouter une ligne « mélange chiffré/échec » dans chacun.
- statut PR/décisions : couvert partiellement par Q17 (jamais « 0 s » ni « 0 rép. ») et H20 (hypothèse Catalogue).
- touche_PRE4 : oui
- question à Hermann : rendu de 10, 12, échec (a) sur la carte Catalogue (« 3 séries variables » ?) et (b) sur la carte Composition (« 10 · 12 · échec rép. » ? autre ?).

### X-14 — Grille des volumes : unité tout échec ou mixte contradictoire, et renvoi vers un « §9.5 » inexistant
- qualification : CONTRADICTION_REELLE interne à CE-CIR-03, et REFERENCE_ROMPUE qui masque la règle
- gravité : mineur (Volumes est exclu de PRE-4 par Q4)
- passages :
  - `ch13:3501` — « Le libellé d’unité ancien « À l’échec » pour une ligne tout échec ne suffit plus à distinguer les deux modes. »
  - `ch13:3559` — « Répétitions numériques + rép. ; durée min:ss ; échec ✓ + À l’échec en dernière colonne. »
  - `ch13:4130` — « une **dernière colonne d’unité ou de mode**, à droite : `rép.`, `min:ss` ou `À l’échec`. Les rendus complétés sont définis au §9.5. »
- analyse : le complément du 13/10 (l. 3501) disqualifie le libellé « À l'échec » dans la colonne unité. La recette (l. 3559) et DSF-CIRCUITS-CONTROLES:60 le prescrivent encore. Aucun « §9.5 » n'existe dans ch13 (grep). Le DSF Deux modes:55 et la MATRICE Deux modes R04 reconnaissent que le rendu mixte n'est pas défini.
- proposition : référence CE-CIR-03 §8 et §9 ; remplacer « §9.5 » par un lien vers CE-CIR-03. Décision de rendu à prendre lors du lot Composition.
- statut PR/décisions : aucun (hors PRE-4 par Q4).
- touche_PRE4 : oui
- question à Hermann : (lot Composition) unité de la colonne pour un exercice tout échec en Durée et en Répétitions, et pour un mélange.

### X-15 — Compaction de plus de 3 cibles mixtes : « rép. » abrégé dans une phrase dont les autres gabarits écrivent « répétitions »
- qualification : AMBIGUITE_PERIMETRE (gabarit normatif du 13/10 contre convention du corpus v15)
- gravité : mineur
- passages :
  - `ch08:631` — « | Répétitions variables, plus de3 | `{N} séries variables, de {min} à {max} répétitions` | »
  - `ch08:653` — « Au-delà, compacter le mélange en « de {minimum numérique} rép. à l’échec » ou « de {minimum numérique formaté} à l’échec ». »
  - `ch08:661` — « | Répétitions 10,12,15,échec | 4 séries variables, de 10 rép. à l’échec | ≥ avec bip ; absent sans bip | »
- analyse : la phrase longue (276 cas) écrit toujours « répétitions » en toutes lettres ; « rép. » est la convention des cartes (ch13:390). Le gabarit mixte au-delà de 3 cibles mêle les deux. Q16 n'a tranché que le cas de 3 cibles ou moins, et H16 étend « rép. » au bip. Il n'y a pas de contradiction stricte (gabarit explicite), mais l'incohérence de style est probablement involontaire, et H9 (gras de « rép. ») en dépend.
- proposition : garder ch08 §Extension comme référence ; faire confirmer la forme par Hermann, puis l'inscrire dans le tableau des cas complémentaires.
- statut PR/décisions : couvert partiellement par Q16 (3 cibles ou moins) et H16.
- touche_PRE4 : oui
- question à Hermann : pour plus de 3 cibles mixtes, « de 10 rép. à l'échec » (actuel) ou « de 10 répétitions à l'échec » ?

---

## Priorité 4 — doublons et cohérence de second rang

### X-16 — Calcul inverse de la Durée totale : ch03 décrit une règle plus large et un message différent de ch10 et RM-130
- qualification : DOUBLON divergent (ch10 et RM-130 font foi ; ch03 est périmé)
- gravité : mineur
- passages :
  - `ch03:116` — « En mode Durée, l’utilisateur peut confirmer soit `Séries`, soit `Durée totale`. Le contrôle confirmé devient pilote ; l’autre est recalculé. »
  - `ch10:615` — « **Inversion réservée à Durée uniforme avec nombre de séries libre.** »
  - `ch10:74` — RM-131 : « Le total variable/Répétitions est en lecture seule ; aucun état pilote persisté. »
- analyse : ch03 n'exclut ni le variable, ni le mélange avec échec (ch10 cibles-mixtes : « aucun calcul inverse »), ni le N hérité. Il garde la notion de « pilote ». Il qualifie le message de « temporaire », alors que ch10:615 lui donne une action « Annuler » et une fermeture au toucher. ch03 n'est pas dans la liste figée, mais il est lu comme parcours de référence. Les formules (arrondi .5 vers le haut, égalité vers N le plus grand) concordent.
- proposition : ch10 « Durées, affichage et inversion » est la référence unique. Réduire ch03:116 à un renvoi.
- statut PR/décisions : aucun (PR #370 réutilise R-02 sans y toucher).
- touche_PRE4 : non
- question à Hermann : aucune.

### X-17 — Restes de « steppers permanents » et de « à l'échec » comme troisième définition, hors des lignes listées par P11 et P20
- qualification : CONTRADICTION_REELLE (arbitrée par règle de priorité), intégration pendante
- gravité : mineur
- passages :
  - `ch10:74` — RM-131 : « La ligne active de roulette/segmenté porte le contour ; les steppers restent permanents sans contour pilote. »
  - `ch08:315` — « - jusqu’à l’échec, sans durée ni nombre de répétitions cibles. » (§3.4, troisième manière de définir un Exercice)
- analyse : P11 (pied commun, aucun stepper permanent) vise ch08 et P20 (restes à trois modes) liste ch08 l. 1580, 1564 et 488, mais ni RM-131 (ch10) ni ch08 §3.4 l. 315. Ces passages restent lisibles comme normatifs.
- proposition : amender RM-131 (« ± révélés à l'appui, pied commun en variable, cf. ch13 §Règles communes ») et ch08:315 (« ou avec une cible À l'échec par série, RM-033 »).
- statut PR/décisions : couvert partiellement par P11 et P20.
- touche_PRE4 : oui
- question à Hermann : aucune.

### X-18 — Nombre de rubriques des contrats : « 21 » dans les contrôles, « exactement 20 » dans ch13
- qualification : DOUBLON divergent (métadonnées de contrôle contre structure canonique)
- gravité : mineur
- passages :
  - `ch13:37` — « Chaque contrat comporte **exactement les 20 rubriques suivantes**, même lorsqu’une rubrique renvoie à une règle commune : »
  - `MATRICE-DEUX-MODES-ECHEC-2026-10-13.md:25` — « |34 contrats conservent chacun21 rubriques ordonnées et renseignées »
  - `CONTROLES-FORMATS-2026-10-14.json:12` — « "sections": 21, »
- analyse : CE-FMT-04 compte 20 sous-titres « ### n. » (contrôlé). Le « 21 » compte vraisemblablement le titre. Sans effet métier, mais une preuve de contrôle d'un document figé (MATRICE Deux modes) affirme une structure qui n'est pas celle du canon. PR #370 dit « 20/20 ».
- proposition : laisser ch13 §3 comme référence et préciser dans la MATRICE et le JSON « 20 rubriques + titre ».
- statut PR/décisions : aucun.
- touche_PRE4 : oui (MATRICE-DEUX-MODES figée)
- question à Hermann : aucune.

### X-19 — Couleur du texte de durée des cartes : #595E66 contre #141414
- qualification : AMBIGUITE_PERIMETRE (visuel ; deux DSF du 07/10 sans remplacement mutuel explicite)
- gravité : mineur
- passages :
  - `DSF-PAUSES-ICONES-2026-10-07.md:41` — « | Texte de durée | #595E66 | »
  - `DSF-CARTES-DUREE-2026-10-07.md:16` — « Texte Inter Semi Bold12, #141414, alignement droite ; aucun fond #F5F7FA, aucun cadre »
- analyse : DSF Cartes-Durée « remplace les anciennes dispositions de badge de durée Catalogue » (l. 3) et CE-T03-02 §9 retient #141414. DSF Pauses ne précise pas si sa ligne « Texte de durée » vise les cartes Catalogue ou d'autres cartes (Composition). C'est du rendu : Figma tranche (D-255).
- proposition : préciser la portée de la ligne de DSF Pauses (par exemple « carte de Composition ») ou la marquer remplacée pour le Catalogue.
- statut PR/décisions : aucun.
- touche_PRE4 : non
- question à Hermann : aucune (lecture Figma).

---

## Points examinés et jugés cohérents (non signalés comme constats)
- Formules intrinsèques (Σ(Ti+Pi), 2Σ(Ti+Pi)+PC, 2ΣTi+ΣPi+N×PC, To=T−PN+R) : identiques en ch04:104, ch08 (§3.9, annexe), ch10 (RM-129, calculs-durees), ch11 API-ACT-02 et ch13 R-01/R-03. Ce sont des doublons à l'identique (risque de divergence future, pas de divergence actuelle). Les scénarios A–F, Uniforme, Bilatéral, N1, Douze séries, R01 (≥ 1 min 45 s = 105 s) et R02 (≥ 1 min 14 s = 74 s) ont été recalculés : tous justes.
- Borne de cible Durée : 5..3535 s / 58 min 55 s partout dans les sources actives (ch04, ch08, ch09, ch10 RM-234, ch11, ch12, ch13, DSF Deux modes). 5999 s ne subsiste que dans MATRICE-SERIES-VARIABLES-2026-10-02:55 (relevé daté du 02/10, antérieur à R06) et comme écart de code signalé par PR #370.
- Bornes des pauses (0..300 s), du Bip (0..10, sans accélération) et du Compte à rebours ou de la Fin d'exercice (0..60, pas 1) : concordants (ch13:4091-4095, R-02, D-265, D-336, DSF Bip).
- Règle de redondance du total à N=1 : ch08:645, R-02 (ch13:3098) et PRODUCT.md:500 sont trois formulations équivalentes.
- Bornes de la roulette Durée totale (T(1)..T(99), granularité seconde, R-02) et inversion (ch10:615) : compatibles.

## Couverture
Lu intégralement : BRIEF-COMMUN.md ; pre4-bmad-questions-ouvertes.md ; pr371.diff et body ; pr370-body et les parties de pr370.diff sur le rapport et le ch08 Phases ; DSF-PHRASES-V15, DSF-BIP-CADENCE, DSF-DEUX-MODES-ECHEC, DSF-SERIES-VARIABLES, DSF-PARAMETRES-MODALE, DSF-CARTES-DUREE, MATRICE-DEUX-MODES-ECHEC, DSF-CIRCUITS-CONTROLES (l. 1-66), CORPUS-PHRASES-FORMATS, CONTROLES-FORMATS ; ch08 l. 232-400, 605-666, 1024-1130, 1545-1595, 1798-1850 ; ch10 l. 57-76, 130-146, 283-334, 591-745 ; ch13 l. 120-130, 345-447, 534-653, 2949-3116, 3811-3892, 4057-4272 ; ch09 l. 425-470 (partiel), 1104-1274 ; ch03 l. 105-125 ; ch06 l. 184-188, 1115-1130, 2196-2210 ; ch04 (grep et l. 186-190, 290-300, 395-400) ; ch07 (lignes des décisions citées, D-090, D-092, D-094, D-131, D-219, D-232, D-265, D-308-D-339) ; ch11 et ch12 (grep et lignes citées).
Lu partiellement ou par grep seulement : DSF-CADENCE (en-tête et grep des bornes, symboles et « trois modes ») ; DSF-PAUSES-ICONES (en-tête et grep) ; DSF-CARTES-ICONES-APPUIS (grep des synthèses et du stepper) ; CE-CIR-03 (grep).
Non lu : ch01, ch02, ch05 ; ch06 hors des lignes citées ; contrats d'exécution CE-T03-09 à 15 et CE-EXEC-SESSION-01 (côté exécution, seulement via ch08 bip-execution et releves-execution) ; MATRICE-*, RAPPORT-*, REVUE-*, SOURCE-*, VERIFICATION-*.json autres que ceux cités ; pr363 ; links.tsv (le constat X-14 « §9.5 » n'y a pas été recoupé).
Vérification : chaque citation a été recherchée par grep -n dans son fichier. Un script de contrôle a ensuite vérifié que le texte cité figure à la ligne indiquée : 57 citations conformes sur 57 (script : scratchpad/xcheck/check.js).
