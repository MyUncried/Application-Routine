# QF — Granularité, formulation et vérifiabilité de la spécification KODJO

Passe 2 (qualité), lecture seule. Base : `C:\Dev\KODJO-OPENSPEC-DOCS`, corpus défini par le brief commun. Préfixe des constats : **QF**.
Référentiels : ISO/IEC/IEEE 29148:2018 (§5.2.5 caractéristiques d'une exigence individuelle, §5.2.7 langage des exigences, §5.2.8 attributs) et INCOSE GtWR v4 (C1–C9 pour les exigences individuelles ; règles R*). Quand je ne suis pas sûr d'un numéro de règle INCOSE, j'écris « règle à vérifier ».
Aucune certification formelle n'est revendiquée. Les incohérences entre sources ne sont citées que lorsqu'elles illustrent un défaut de formulation ou de maintenabilité.

---

## 1. Couverture réelle

| Source | Ce qui a été lu intégralement (lignes) | Mode |
|---|---|---|
| BRIEF-QUALITE.md | 1–26 | lecture intégrale |
| 08 – Conception fonctionnelle détaillée.md | 230–264 (ancre `parametres-exercice` l. 232, « Paramètres et brouillon d'un exercice ») ; 605–686 (ancre `phrases` : format des durées, grammaire v15, côtés et durée, extension cibles mixtes, raccordement aux formats, combinaisons à préciser) | lecture intégrale |
| 08 | 54–61 (Convention de lecture) ; 1680–1681 (bornes Compte à rebours/Fin) | ponctuel |
| 10 – Processus métier et règles métier transverses.md | 130–146 (§9 Calculs et progression : RM-071…RM-128) ; 337–360 (début de « Formats — règles métier ») ; 593–746 (calculs des durées, résultats temporels, cibles mixtes, recettes R01–R16) ; 747–757 (en-tête des recettes de formats) | lecture intégrale des plages |
| 13 – Contrats d'écran.md | 534–653 (CE-T03-04 en entier) ; 2949–3064 (CE-UI-10 en entier) ; 3893–3974 (CE-FMT-05 en entier) ; 4085–4100 (règles communes de l'éditeur de paramètres) ; 2627–2633 | intégral pour les trois contrats, le reste ponctuel |
| 03 – Parcours utilisateur.md | 90–170 (parcours principal « Créer et exécuter une séance ») ; 356–364 (« Créer ou modifier un Exercice ») | parcours principal en entier, le reste ponctuel |
| 01 – Vision Générale.md | 187–449 (glossaire complet, dont §8 « Termes obsolètes ou interdits », l. 303–312) | lecture intégrale |
| MATRICE-FORMATS-SEANCES-2026-10-14.md | 1–40 | ponctuel, seulement pour résoudre les références REC-xx |
| 30 fichiers du corpus (01..13, PRODUCT, INDEX, README, 14 DSF-*) | — | **mesures mécaniques** (§2.0), environ 220 000 mots |

Limite : j'ai lu en entier environ 1 100 lignes sur 15 767 dans les chapitres 01..13. Les constats sont des **échantillons représentatifs**. Ils ne permettent **pas** de conclure sur la qualité de la formulation de tout le corpus, ni sur sa complétude.

---

## 2.0 Mesures mécaniques : comment l'obligation est exprimée

Commandes (Git Bash, depuis `docs/`, `LC_ALL=C.UTF-8`, PCRE `(*UCP)` pour gérer les lettres accentuées) :

```bash
F=(Specifications-fonctionnelles/*.md PRODUCT.md INDEX.md README.md DSF-*.md)   # 30 fichiers
for p in '\bdoit\b' '\bdoivent\b' '\bne (doit|doivent) pas\b' '\bil faut\b' '\b(peut|peuvent)\b' \
         '\bpossible\b' 'éventuel(le)?s?\b|éventuellement' '\betc\.' '\bpar exemple\b' 'à confirmer' \
         '\bTBD\b' 'reste ouvert' 'hypoth[èe]se' 'si nécessaire' '\badaptée?s?\b' 'à clarifier' 'à préciser' \
         'point(s)? ouvert' '\bjamais\b' '\btoujours\b' '\baucun(e)?\b' '\bSHALL\b|\bMUST\b' '\bomitted\b'; do
  printf "%-40s %s\n" "$p" "$(grep -oiP "(*UCP)$p" "${F[@]}" | wc -l)"; done
# densité par fichier
for f in Specifications-fonctionnelles/*.md; do d=$(grep -oiP '\b(doit|doivent)\b' "$f"|wc -l); w=$(wc -w <"$f"); echo "$f $d $w"; done
# règles du ch. 10 qui emploient doit/doivent
grep -P '^\| RM-\d+' "10 – …md" | wc -l ;  grep -P '^\| RM-\d+' "10 – …md" | grep -ciP '\b(doit|doivent)\b'
```

| Marqueur | Occ. | Marqueur | Occ. |
|---|---|---|---|
| doit | 153 | éventuel/éventuellement | 117 |
| doivent | 77 | etc. | 10 |
| ne doit/doivent pas | 60 | par exemple | 10 |
| il faut | 4 | à confirmer | 3 |
| peut/peuvent | 347 | TBD | 0 |
| possible | 18 | reste ouvert | 5 |
| si nécessaire | 18 | hypothèse | 0 |
| adapté(e)(s) | 30 | à clarifier / à préciser | 9 / 9 |
| aucun(e) | 1 480 | point(s) ouvert(s) | 31 |
| jamais | 251 | SHALL/MUST | 0 |
| toujours | 120 | `omitted` (anglais dans la prose) | 58 |

Densité de « doit/doivent » pour 1 000 mots : ch. 10 = **0,39**, ch. 13 = 0,67, ch. 08 = 1,07, ch. 12 = 3,03. Sur **182** règles `| RM-nnn |` du ch. 10, **5** seulement emploient doit/doivent. CE-UI-10 (1 824 mots) : 1 occurrence. CE-T03-04 : 1. CE-FMT-05 : 2.

**Conclusion : il n'existe pas de marqueur d'obligation stable.** L'obligation passe par au moins cinq formes concurrentes :
1. le présent de l'indicatif descriptif (« Le Catalogue des séances est l'écran d'accueil », RM-002) ;
2. le fragment nominal sans verbe (« Shell conservé : en-tête fixe… », 13:584) ;
3. l'infinitif injonctif (« Tester… », « Conserver… ») ;
4. les absolus négatifs (aucun ×1 480, jamais ×251) ;
5. plus rarement « doit ».

Sans marqueur, on ne distingue pas mécaniquement une prescription d'une description, d'un rappel historique ou d'un exemple. 29148:2018 recommande un mot-clé contraignant convenu, à distinguer des énoncés non contraignants (*clause à vérifier* : §5.2.4 ou §5.2.7). INCOSE GtWR v4 R1 (forme structurée) va dans le même sens. Le français n'impose pas « doit » : un présent normatif peut être acceptable, **à condition** qu'une convention le déclare, ce qui n'est pas le cas ici (voir QF-05).

Autres mesures :
- **≈ 326** cas d'espace manquante après un mot-outil devant un chiffre (`du12/10`, `aux276`, `jusqu'à3`, `pas5s`), dont 92 au ch. 13. Motif : `(?<!\w)(du|aux|à|de|pas|dès|le|les|au|jusqu'à|largeur|carte|Bip|bip)\d`.
- **≈ 38** accords féminins hérités du renommage Activité → Exercice (« Exercice persistante », « l'Exercice suivante », « première Tour », « de le dernier Exercice »).
- **2 358** barres obliques entre deux mots (`cible/Pause`, `ouvert/replié`), dont 45 dans CE-UI-10.

---

## 2.1 GRANULARITÉ (exigences singulières)

**Bilan : faible.** Les règles sont identifiées, mais les éléments identifiés sont souvent des **paragraphes de 60 à 170 mots** qui regroupent de 5 à 15 obligations, avec conditions et exceptions mêlées. 15 règles RM dépassent 60 mots (RM-077 : 168 mots, RM-129 : 128, RM-021 : 116). Dans les contrats d'écran, la rubrique (« §12 Contrôles et interactions ») sert d'unité, pas l'exigence. À l'inverse, les mêmes règles sont **dupliquées mot pour mot** d'un contrat à l'autre au lieu d'être référencées : c'est une fragmentation par copie. Enfin, 42 règles de formats ont perdu leur numéro.

### Défauts

**QF-01 — Règle de progression agrégée (RM-077)**
`10 – Processus métier…md:140`
> « M compte les étapes contributives ; R compte toutes les Séries à cible À l'échec […] Chaque Série sans durée déterminable pèse1/M ; chaque étape temporelle de durée d pèse(1−R/M)×d/T. […] Poids figés au départ ; reset remet à zéro son périmètre seulement. Aucun nouveau composant de progression par Série. »

Référentiels : 29148 §5.2.5 *singular* ; INCOSE C5 Singular, R18 (une seule pensée par phrase), R19 (combinateurs).
Conséquence : une seule ligne de recette RM-077 couvre une formule, trois cas dégénérés (sans R, sans T), la sémantique de Pause, de Suivant, du reset et une contrainte de conception (« aucun nouveau composant »). Si un test échoue, on ne sait pas quelle obligation est violée, et on ne peut pas tracer partiellement.

**QF-02 — Paragraphe de contrôles multi-obligations (CE-UI-10 §12)**
`13 – Contrats d'écran.md:3019`
> « ± modifie Bip par1, bornes0..10, sans accélération. Autres steppers : DSF Bip (maintien≈500ms, paliers1/5/10 selon durée du maintien et champ). Bascule de mode conserve Bip même à✓ ; cibles numériques incompatibles remplacées par— et restaurées dans le brouillon selon v13. »

La même ligne enchaîne ensuite variable/uniforme, réduction, déplacement, roulette unique et inversion : environ 12 obligations. Référentiels : 29148 §5.2.5 *singular* ; INCOSE C5, R18. Conséquence : aucun ID ne permet de rattacher un cas de test à « Bip sans accélération » plutôt qu'à « une seule roulette ouverte ». Voir l'exemple AVANT/APRÈS n° 1.

**QF-03 — Identifiants perdus : 42 titres `### RM-` vides et des renvois `(RM-et RM-)`**
`10 – Processus métier…md:341` (`### RM-`, suivi de « **— Format appliqué.** ») ; `10…md:134,135,138,142,143` (« Hors règles propres des formats (RM-et RM-), … »).
Commande : `grep -cP '^### RM-\s*$'` → 42 ; `grep -c '(RM-et RM-)'` → 5.
Référentiels : 29148 §5.2.8 (attribut d'identification unique) ; INCOSE C5/C3 (une exception qui vise une cible inconnue rend la règle ambiguë).
Conséquence : RM-071, 072, 075, 125 et 126 sont **conditionnées par une exception qui ne désigne rien**. Le développeur ne sait pas quelles règles de formats priment. Seules les ancres HTML `fmt-01…` subsistent.

**QF-04 — Duplication verbatim au lieu de référence**
`13…md:618` (CE-T03-04 §15) et `13…md:3031` (CE-UI-10 §15) (« Aucune phrase ni aucun segment en base, occurrence ou snapshot. Régénération à chaque affichage depuis les paramètres ; ✓ applique, ✕ annule, Terminer persiste les paramètres. »). On retrouve aussi le paragraphe « Recette rédactionnelle :276 gabarits v15… » et le paragraphe « Référence longue7119:27855 :224caractères… » dans les deux contrats. De même, RM-072 (`10…md:135`) est recopiée dans la définition « Durée estimée d'exécution » du glossaire (`01…md:277`).
Référentiels : 29148 §5.2.6 *consistent* (au niveau de l'ensemble) ; INCOSE R30 (expression unique, règle à vérifier).
Conséquence : chaque amendement doit être reporté en N endroits. Le glossaire porte déjà une définition de durée avec « omitted » et « Bip v2 » qui relève d'une règle et non d'une définition.
Illustration de maintenabilité : CE-UI-10 §14 dit « erreur nommant la Série » (`13…md:3027`), alors que la règle commune (`13…md:4100`) précise « aucun message en ligne (D-337, 12/10 : remplace le message nommant la Série à renseigner) ».

**QF-05 — Exigences sous-décomposées, en style télégraphique (CE-FMT-05)**
`13…md:3969` : « repos inclus dans fenêtre ; pas de multiplicateur caché pour côtés. »
`13…md:3941` : « L'échéance EMOM relance quoi qu'il arrive. »
Référentiels : 29148 §5.2.5 *complete* et *unambiguous* ; INCOSE C4, R7 (« quoi qu'il arrive » est une formule ouverte).
Conséquence : « relance » quoi (la fenêtre suivante ? le son ?) et dans quels états (Pause manuelle, arrière-plan) ? Le contrat renvoie lui-même ces points à R-01, ce qui est honnête, mais l'invariant reste alors formulé comme une obligation absolue.

### Points forts
- Les **tableaux de recette** ont un grain fin : une ligne = une situation + un attendu (R01–R16, `10…md:722-743` ; scénarios A–F, `10…md:617-634`).
- La table des bornes (`13…md:4088-4095`, « Séries | 1..99 | 1 ») a le grain idéal : un paramètre, une borne, une granularité par ligne.
- Le ch. 08 isole explicitement les combinaisons non décidées dans une rubrique dédiée (`08…md:674-683`) au lieu de les mêler aux règles.

---

## 2.2 FORMULATION (clarté, ambiguïtés, vocabulaire, statut des énoncés)

**Bilan : faible à acceptable.** Le fond est précis : l'auteur traite manifestement les cas limites (N=1, PC=0, R=0, PN). La **forme** dégrade cette précision :
- style télégraphique (articles et verbes supprimés) ;
- ≈ 326 espaces manquantes et ≈ 38 accords faux ;
- barres obliques massives ;
- anglicismes d'énumération technique (`omitted`, `lowerBound`) dans la prose métier ;
- pronoms sans antécédent clair ;
- références de version (« v13 », « Phrase v1 », « Bip v2 ») employées comme vocabulaire non défini ;
- **méta-texte de rédaction** (« prompt précédent », « clarification du propriétaire ») mêlé aux prescriptions.

Le glossaire est riche, mais ses synonymes ne sont pas verrouillés : « par côté », « Un côté après l'autre », « succession des côtés » et « ordre successif » désignent la même valeur.

### Défauts

**QF-06 — Pronom ambigu sur l'action d'annulation**
`13…md:604` (CE-T03-04 §12) : « ✓ applique au brouillon et régénère ; ✕ le conserve ; Terminer persiste atomiquement. »
Référentiels : 29148 §5.2.7 (pronoms vagues) ; INCOSE R24 (pronoms), C3.
Conséquence : « le » peut renvoyer au brouillon parent (lecture juste : ✕ laisse le parent inchangé) ou au brouillon de feuille (lecture fausse : ✕ conserverait les saisies). Le même contrat écrit ailleurs « ✕ annule » (§15, même section). Un testeur peut valider l'une ou l'autre lecture. Voir AVANT/APRÈS n° 2.

**QF-07 — Terme vague dans une exigence de mise en page**
`13…md:2999` (CE-UI-10 §9) : « Valeurs/steppers à droite ; marges adaptées, pas de coordonnées absolues sur toutes largeurs. »
Autres exemples : `13…md:2445` « hauteur adaptée au texte », `13…md:2989` « origine discrète », `10…md:615` « dans un cadre plus clair que son fond ». Au total : 30 « adapté(e)(s) », 18 « si nécessaire ».
Référentiels : 29148 §5.2.7 (termes subjectifs ou vagues) ; INCOSE R7 (termes vagues), C7.
Conséquence : ce n'est pas testable à 360/440 px. Une marge « adaptée » n'a ni valeur ni règle de calcul.

**QF-08 — « si nécessaire » qui affaiblit une obligation**
`03 – Parcours utilisateur.md:360` : « 3. Sélectionner sa **Catégorie** et, si nécessaire, ses **Zones corporelles**. »
Le glossaire (`01…md:225`, « Un Exercice valide en possède une ou plusieurs ») et CE-T03-04 §14 (`13…md:612`, « au moins une Zone pour un nouvel Exercice ») en font une **obligation**.
Référentiels : 29148 §5.2.7 (*loopholes* « si nécessaire », « le cas échéant ») ; INCOSE R8 (clauses échappatoires).
Conséquence : un lecteur du parcours conclut que les Zones sont facultatives. La même liste (l. 362) propose encore trois modes `Durée`, `Répétitions` ou `À l'échec`, alors que le modèle courant en a deux. C'est une illustration de maintenabilité.

**QF-09 — Vocabulaire non stabilisé pour un même concept**
- Ordre des côtés : « Un côté après l'autre » (35 occ., terme du glossaire `01…md:376`), « par côté » (47), « succession des côtés / ordre successif » (17). Et « Les deux côtés à chaque série » (18) contre « par paire » (31).
- Pause de côté : « Pause entre les côtés » (75, libellé déclaré « unique » en `08…md:244`), « PC » (133), « pause de changement de côté » (3), « pause au changement de côté » (`08…md:645`).
- Le texte d'interface lui-même varie : « …pour respecter un nombre entier de Séries. » (`03…md:116`) contre « …nombre entier de séries. » (`10…md:615`).

Commande : `grep -oP "(*UCP)par côté|Un côté après l'autre|succession des côtés|ordre successif|par paire" …`.
Référentiels : 29148 §5.2.5 *unambiguous* et §5.2.6 *consistent* ; INCOSE R36 (termes et unités cohérents, règle à vérifier), R4 (termes définis).
Conséquence : « par côté » (glossaire : *N Séries par côté*, qui est une cardinalité) et « par côté » (*ordre Un côté après l'autre*) sont homonymes. `10…md:599` « N=1 est normalisé par côté » se lit dans les deux sens. Un libellé UI sans casse fixée produira des écarts de recette.

**QF-10 — Termes du §8 « obsolètes ou interdits » et anglicismes encore présents**
- `06 – Ecrans et navigation de la V1.md:435` : « #### Profil — Stepper Récupération après activité ». « Activité » est interdit par `01…md:307`.
- 58 occurrences de `omitted` dans la prose française, par exemple RM-072 `10…md:135` « omitted en Répétitions sans bip et À l'échec ».

Référentiels : 29148 §5.2.5 *conforming* ; INCOSE R4 (termes définis), C9 Conforming.
Conséquence : `omitted`, `estimated` et `lowerBound` sont des valeurs d'énumération technique (`10…md:641-652`) employées comme adjectifs métier. Le glossaire ne les définit pas comme termes. Pour la ligne de ch. 06, il faut confirmer s'il s'agit d'un nom de frame Figma, autorisé par `01…md:410`, ou d'un titre de spécification : *sujet à confirmer*.

**QF-11 — Références de version utilisées comme vocabulaire**
`13…md:580` : « énumération jusqu'à3 puis min/max selon Phrase v1 ». Le même contrat dit (`13…md:` §5, CE-T03-04) « Phrase selon les276 cas v15 », et il cite « Calculs v13 » et « résumé v13 » (§19, §20).
Mesure : « v13 » ×68 dans 17 fichiers, « Phrase v1 » ×18, « Bip v2 » ×57. Seule mention dans le glossaire : « Références normatives : Bip v 2 et paramètres v 13. » (`01…md:388`).
Référentiels : 29148 §5.2.5 *unambiguous* ; INCOSE R4 et R37/R38 (acronymes et abréviations, règle à vérifier).
Conséquence : le lecteur ne sait pas si « Phrase v1 » et « v15 » sont deux référentiels concurrents ou une seule lignée. Une exigence qui renvoie à une version de document plutôt qu'à une règle identifiée n'est pas autoportante.

**QF-12 — Méta-texte de rédaction et historique dans des prescriptions**
- `10…md:662` : « Cette clarification explicite du propriétaire remplace les passages contraires du prompt précédent. »
- `10…md:674` : « Conformément au prompt, une estimation cadencée reste incluse… »
- `13…md:3027` : « R06 close : maximum58min55s (3535s) confirmé ». « R06 » est aussi l'ID d'une recette sans rapport (`10…md:731`).
- `01…md:213` : défaut de la Pause entre les côtés « (`10 s` dans le Figma de référence) », alors que `08…md:244` dit « défaut 10 s ». On ne sait pas si c'est un exemple ou une règle.

Référentiels : 29148 §5.2.5 *necessary* et *appropriate* ; §5.2.8 (la *rationale* et la source doivent être des attributs, pas du texte de l'exigence) ; INCOSE C1/C2.
Conséquence : un implémenteur ne peut pas savoir quels « passages contraires » sont abrogés. La provenance (propriétaire, prompt, Figma) se mélange à l'obligation. La collision d'ID « R06 » brouille la traçabilité.

**QF-13 — Défauts grammaticaux et typographiques systémiques**
- `10…md:142` (RM-125) : « La fin de le dernier Exercice déclenche `SESSION_END`. »
- `01…md:318` : « Exercice persistante autonome du Catalogue ».
- `08…md:622` : « Ponctuation et accords conformes aux276 cas ».
- Défaut de structure : `01…md:382`, ligne de 9 cellules (« Bip de cadence | Stepper | Trois modes, réglage commun | Non | Aucun (0) | … ») dans un tableau de 2 colonnes « Terme | Définition unique ». Le glossaire numérote aussi deux sections « 9. » (`01…md:314` et `348`).

Référentiels : INCOSE R12 (grammaire), R13 (orthographe), R14 (ponctuation), règles à vérifier ; 29148 §5.2.6 *comprehensible*.
Conséquence : « jusqu'à3 » et « pas5s » sont lisibles, mais les gabarits de phrase du ch. 08 **spécifient eux-mêmes des espaces exacts** (« Les espaces et unités font partie du texte », `08…md:622`). Le texte normatif n'applique donc pas la typographie qu'il prescrit, ce qui crée un risque de recopie dans le code.

**QF-14 — Négations et absolus en grand nombre**
« aucun(e) » ×1 480, « jamais » ×251. Par exemple `13…md:2999` « pas de coordonnées absolues sur toutes largeurs » ; `08…md:253` « Désactivation : sans confirmation ni message temporaire ».
Référentiels : 29148 §5.2.7 (énoncés négatifs, totalité « jamais/toujours/tous ») ; INCOSE R16 (« not »), R26 (absolus).
Conséquence : une partie de ces négations est légitime, car elle exclut un comportement précis et testable. Mais beaucoup sont des **exclusions ouvertes** (« Aucun texte de démonstration codé en dur ») dont l'absence ne se prouve que par inspection exhaustive. *Sujet à confirmer* : il faudrait un tri cas par cas, non réalisé ici.

### Points forts
- Le **statut** de certains blocs est déclaré explicitement. Par exemple `10…md:743` : « Ces recettes sont des obligations de la future réalisation, pas des tests exécutés sur l'application. » Ou encore `08…md:683` : « Ils ne constituent pas des blocages démontrés ; […] sans inventer de comportement. » C'est une bonne distinction obligation / décision ouverte.
- Le sens d'un symbole est défini sans ambiguïté : « omitted signifie absence de ligne, de valeur, de zéro et de tiret » (`10…md:654`).
- Le glossaire distingue entité et concept (`01…md:191`) et liste explicitement les termes interdits (§8).

---

## 2.3 VÉRIFIABILITÉ (résultat observable, bornes, unités, pas, arrondis, critères)

**Bilan : acceptable, et solide pour les calculs.** Les règles de calcul ont des **oracles numériques explicites** et justes. J'ai recalculé A, B, C, D, Uniforme, Bilatéral, N1, R01, R02 et la recette de CE-UI-10 (« ≥2min15 » : 75 + 60 = 135 s) : tous sont cohérents. Les bornes de saisie sont complètes (1..99, 1..100, 5..3535 s par pas de 5 s, 0..300 s, Bip 0..10, rejets −1/11/fraction). L'arrondi de la Durée synthétique est explicite (`Math.ceil`, RM-159).

Les faiblesses portent sur quatre points :
- des **unités absentes** (Bip, cibles 44, typographie 13/20) ;
- des **tolérances non chiffrées** (« ≈500ms », « temporairement ») ;
- des **résultats attendus écrits dans un format différent** du format normatif d'affichage ;
- des **recettes référencées mais introuvables** (REC-10…27 dans CE-FMT-05).

### Défauts

**QF-15 — Unité absente sur une borne**
`13…md:566` (CE-T03-04 §5) : « La collection inclut la bip commun0..10 de chaque Série. »
`13…md:3047` (CE-UI-10 §18) : « Texte agrandi, cibles44 minimum » ; `13…md:586` : « Phrase : Inter13, interligne20 ».
Référentiels : 29148 §5.2.5 *verifiable* ; INCOSE R6 (unités), R33 (plages de valeurs), C7.
Conséquence : pour 0..10, l'unité (s) est déduite d'autres sections (`13…md:4095`), pas de l'exigence. « 44 » peut être des pt, des dp ou des px selon la plateforme, et le test d'accessibilité dépend de cette unité.

**QF-16 — Tolérances et durées non chiffrées**
`13…md:3019` : « maintien≈500ms, paliers1/5/10 selon durée du maintien et champ » (seuils précisés seulement en `13…md:4098` : « paliers5 après≈2s et10 après≈4s »).
`10…md:20` (RM-008) : « un snackbar `Séance archivée` propose temporairement `Annuler` ».
`03…md:116` : « elle affiche temporairement « Durée ajustée à {T(N)}… » ».
Recherche : `grep -nP '(snackbar|message temporaire|temporairement).{0,80}\d+ ?s\b'` sur le corpus ne donne **aucun résultat**. C'est un **manque démontré** dans le corpus déclaré : la durée d'affichage n'y figure nulle part de façon adjacente.
Référentiels : 29148 §5.2.7 (termes vagues) ; INCOSE R34 (performance mesurable, règle à vérifier), C7.
Conséquence : « ≈ 500 ms » n'a pas de tolérance, et « temporairement » n'a pas d'oracle. Le test d'expiration du snackbar ne peut pas être écrit.

**QF-17 — Attendus de recette qui n'appliquent pas le format normatif d'affichage, et cas ≥ 1 h non spécifié**
Format normatif `08…md:611-618` : « autre | `{minutes} min {secondes} s` | 1 min 30 s ».
Attendus : `10…md:621` « 135+10+20+30=195s =3min15s » ; `10…md:631` « ≈5min » ; `13…md:3055` « →≥2min15 ».
Recherche `grep -nP '\{heures\}|\{h\}|x ?≥ ?3600|plus d.une heure|\b1 h \d'` → 0 résultat. C'est un **manque démontré** : aucun format n'est défini pour x ≥ 3 600 s, alors qu'une Séance peut dépasser 60 min (une seule cible va jusqu'à 3 535 s, et 99 Séries sont possibles).
Référentiels : 29148 §5.2.5 *verifiable* et *complete* ; INCOSE R33/R34, C4.
Conséquence : un test automatisé de rendu ne sait pas si « 3min15s » est la chaîne attendue ou une notation de calcul. Pour 4 500 s, l'affichage (« 75 min » ou « 1 h 15 min ») est indéterminé. Voir AVANT/APRÈS n° 4.

**QF-18 — Recettes référencées sans identifiant résolvable**
`13…md:3973` (CE-FMT-05 §20) : « REC-10–15, 19–21, 27 ; ces scénarios sont prescrits, non exécutés sur un moteur livré. »
Recherche : `grep -rnP '(^|\| ?)REC-10\b' docs --include=*.md` ne trouve que des renvois. La table de recettes du ch. 10 (`10…md:753-780`, 28 lignes) n'a **pas de colonne d'ID**. Les REC-xx n'existent que comme renvois dans `docs/MATRICE-FORMATS-SEANCES-2026-10-14.md`. C'est un **manque démontré** dans les chapitres 01..13.
Référentiels : 29148 §5.2.8 (identification) et §5.2.5 *verifiable* ; INCOSE C7.
Conséquence : le testeur doit déduire REC-10 du rang de la ligne. Insérer une ligne casse silencieusement la correspondance.

**QF-19 — Règle d'arrondi et de bornage de l'inversion partiellement ambiguë**
`10…md:615` : « N dans1..99 au plus proche, égalité vers le haut. Candidats : unilatéral arrondi(Tv/(d+p)) ; […] retenir le total le plus proche, égalité N le plus grand. Les bornes du sélecteur suivent les extrêmes réalisables. »
Référentiels : 29148 §5.2.5 *unambiguous* et *verifiable* ; INCOSE R33, R15 (expressions logiques, règle à vérifier).
Conséquence : trois points restent indéterminés :
- un quotient hors de [1 ; 99] est-il saturé ou refusé ?
- les « extrêmes réalisables » sont-ils T(1) et T(99) ?
- pourquoi comparer N=1 « calculé avec l'ordre normalisé par côté » ?

La règle est décidée, mais pas autoportante. Voir AVANT/APRÈS n° 3.

### Points forts
- Les scénarios A–F et l'exemple « Douze séries » (`10…md:617-634`) donnent paramètres, calcul détaillé et résultat. Je les ai recalculés, sans erreur.
- Bornes, pas et rejets explicites : « Cibles chiffrées : N1..99,Ri1..100,Ti5..3535s,Pauses0..300s,Bip entier0..10 dans deux modes. −1,11,fraction invalides, aucune correction silencieuse. » (`13…md:3027`).
- Arrondi déclaré : « convertie en minutes par arrondi à la minute supérieure (`Math.ceil`) » (RM-159, `10…md:141`).
- Oracles négatifs précis : « R03 | Même exercice avec bip 0 | Aucun total d'Exercice » (`10…md:728`).

---

## 3. Recommandations priorisées

| Prio | Recommandation | Constats | Effort |
|---|---|---|---|
| P1 | Rétablir les 42 numéros `### RM-` et les 5 renvois `(RM-et RM-)`, et ajouter une colonne ID (REC-01…28) à la table de recettes du ch. 10 | QF-03, QF-18 | faible |
| P1 | Adopter et **déclarer** une convention d'obligation (par exemple « doit » / « ne doit pas » pour l'obligatoire, « peut » pour la permission, présent réservé à la description), dans une note de lecture en tête de chaque chapitre normatif (08, 10, 13) | §2.0, QF-14 | moyen |
| P1 | Corriger les oracles : écrire les attendus dans le format normatif (`3 min 15 s`) et définir le format x ≥ 3 600 s [À CONFIRMER] ; chiffrer « temporairement » et « ≈ 500 ms » (valeur et tolérance) | QF-16, QF-17 | faible |
| P2 | Découper les règles de plus de 60 mots (15 RM) et les §12/§14 de CE-UI-10 et CE-T03-04 en exigences numérotées d'une obligation chacune, la condition en tête | QF-01, QF-02, QF-05 | fort |
| P2 | Verrouiller le vocabulaire : une table « terme canonique → synonymes proscrits » (Un côté après l'autre / par côté / ordre successif ; Pause entre les côtés / PC / pause de changement de côté), avec la casse exacte des libellés UI | QF-09, QF-10 | moyen |
| P2 | Sortir le méta-texte (« prompt », « propriétaire », « R06 close ») vers des attributs *source* / *rationale* / *décision* (D-xxx), conformément à 29148 §5.2.8 | QF-12 | moyen |
| P2 | Remplacer « Phrase v1 », « v13 », « Bip v2 » par des renvois à des ID de règle stables, ou les définir dans le glossaire | QF-11 | faible |
| P3 | Passe typographique et grammaticale automatisée : espaces avant chiffres et unités, accords Exercice (masculin), barres obliques remplacées par « et » ou « ou » selon le sens | QF-13 | faible (scriptable) |
| P3 | Référencer au lieu de dupliquer les paragraphes communs (CE-T03-04 / CE-UI-10 §15, §20) | QF-04 | faible |
| P3 | Trier les 1 480 « aucun » : garder les exclusions précises, convertir les exclusions ouvertes en critères positifs | QF-14 | moyen |

---

## 4. Exemples AVANT / APRÈS

Les réécritures n'ajoutent aucune règle. Les valeurs reprises d'ailleurs dans le dépôt sont sourcées. Les valeurs manquantes sont marquées [À CONFIRMER].

### Exemple 1 — Contrat d'écran CE-UI-10 §12 (granularité, unités, tolérance)

**AVANT** (`13 – Contrats d'écran.md:3019`, extrait) :
> ± modifie Bip par1, bornes0..10, sans accélération. Autres steppers : DSF Bip (maintien≈500ms, paliers1/5/10 selon durée du maintien et champ). Bascule de mode conserve Bip même à✓ ;

**APRÈS** :
- **UI10-12-01** — Un appui sur « + » ou « − » du Bip de cadence modifie sa valeur de 1 s.
- **UI10-12-02** — Le Bip de cadence est borné de 0 s à 10 s. Un appui qui sortirait de ces bornes laisse la valeur inchangée.
- **UI10-12-03** — Le maintien appuyé sur « + » ou « − » du Bip de cadence ne déclenche aucune accélération : le pas reste 1 s.
- **UI10-12-04** — Pour les autres steppers (Pause après chaque série, Pause entre les côtés), un maintien appuyé de 500 ms [tolérance À CONFIRMER] déclenche la répétition. Le pas passe à 5 après 2 s de maintien, puis à 10 après 4 s (source : `13…md:4098`, tolérances À CONFIRMER).
- **UI10-12-05** — Un changement de mode (Durée ↔ Répétitions) conserve la valeur du Bip de cadence, y compris après validation par ✓.

*Vérification* : 5 cas de test indépendants, chacun avec un résultat observable (valeur affichée).

### Exemple 2 — Contrat d'écran CE-T03-04 §12 (pronom ambigu, obligations multiples)

**AVANT** (`13…md:604`) :
> Toucher la zone Paramètres ouvre CE-UI-10. Aucun mot ou nombre de la phrase ne sélectionne une ligne indépendamment. ✓ applique au brouillon et régénère ; ✕ le conserve ; Terminer persiste atomiquement.

**APRÈS** :
- **T0304-12-01** — Un toucher n'importe où dans la zone Paramètres ouvre la feuille CE-UI-10.
- **T0304-12-02** — Un toucher sur un mot ou un nombre de la phrase de synthèse a le même effet que T0304-12-01 et ne présélectionne aucune ligne de la feuille.
- **T0304-12-03** — L'action ✓ de la feuille copie les paramètres de la feuille dans le brouillon de l'Exercice, puis régénère la phrase de synthèse. Elle n'écrit rien en base.
- **T0304-12-04** — L'action ✕ de la feuille laisse le brouillon de l'Exercice identique à son état avant l'ouverture de la feuille.
- **T0304-12-05** — L'action Terminer enregistre l'Exercice en une seule opération : soit tous les paramètres du brouillon sont enregistrés, soit aucun ne l'est.

### Exemple 3 — Règle de calcul : inversion Durée totale → nombre de Séries

**AVANT** (`10 – Processus métier…md:615`, extrait) :
> N dans1..99 au plus proche, égalité vers le haut. Candidats : unilatéral arrondi(Tv/(d+p)) ; succession des côtés arrondi((Tv−PC)/(2(d+p))) ; par paire arrondi(Tv/(2d+p+PC)). Comparer les candidats réalisables et N=1 calculé avec l'ordre normalisé par côté ; retenir le total le plus proche, égalité N le plus grand. Les bornes du sélecteur suivent les extrêmes réalisables.

**APRÈS** :
- **INV-01 (domaine)** — L'inversion n'est disponible que si : le mode est Durée, le régime est uniforme, toutes les cibles sont chiffrées, et le nombre de Séries n'est pas imposé par un circuit de séries. Dans les autres cas, le total est affiché en lecture seule.
- **INV-02 (quotient)** — Soit Tv la durée totale saisie, d la cible, p la Pause après chaque série et PC la Pause entre les côtés, toutes en secondes. Le quotient q vaut :
  - unilatéral : q = Tv / (d + p) ;
  - « Un côté après l'autre » : q = (Tv − PC) / (2 × (d + p)) ;
  - « Les deux côtés à chaque série » : q = Tv / (2d + p + PC).
- **INV-03 (arrondi)** — Le candidat N est l'entier le plus proche de q. Une partie décimale de 0,5 exactement arrondit vers le haut.
- **INV-04 (bornes)** — Le N retenu appartient à 1..99. Traitement d'un q hors de cette plage (saturation à la borne ou refus) : [À CONFIRMER].
- **INV-05 (N=1 en bilatéral)** — En bilatéral, la comparaison inclut aussi N = 1 calculé en ordre « Un côté après l'autre » : T(1) = 2(d + p) + PC (source : `10…md:670`).
- **INV-06 (choix)** — Parmi les candidats de INV-03 à INV-05, on retient le N qui minimise |T(N) − Tv|. En cas d'égalité, on retient le N le plus grand.
- **INV-07 (message)** — Si T(N) ≠ Tv, l'application affiche « Durée ajustée à {T(N)} pour respecter un nombre entier de séries. », où {T(N)} suit le format d'affichage des durées (ch. 08). Casse de « séries » et durée d'affichage : [À CONFIRMER]. Si T(N) = Tv, aucun message n'est affiché.
- **INV-08 (bornes du sélecteur)** — Les bornes min et max du sélecteur Durée totale sont [À CONFIRMER : T(1) et T(99) de la configuration courante ?].

*Cas de test dérivé des règles existantes* : unilatéral, d = 90 s, p = 15 s, Tv = 320 s → q = 3,05 → N = 3 → T(3) = 315 s (identique à la recette « Uniforme », `10…md:627`) → message « Durée ajustée à 5 min 15 s… ».

### Exemple 4 — Règle d'affichage et oracle de recette (format des durées)

**AVANT** (`08…md:617-618` et `10…md:621`) :
> | x multiple de 60 | `{x/60} min` | 1 min |
> | autre | `{minutes} min {secondes} s` | 1 min 30 s |
> | A | Unilatéral ; cibles30/45/60s ; Pauses10/20/30s | 135+10+20+30=195s =3min15s |

**APRÈS** :
- **FMT-D-01** — Une durée x est un entier de secondes, x ≥ 0. Le cas d'une valeur non entière : [À CONFIRMER, a priori impossible car Ti = Ri × b avec b entier].
- **FMT-D-02** — x = 0 s'affiche `0 s` ; 0 < x < 60 s'affiche `{x} s` ; 60 ≤ x < 3 600 et x multiple de 60 s'affiche `{x/60} min` ; sinon `{⌊x/60⌋} min {x mod 60} s`. L'espace entre nombre et unité fait partie du texte. Type d'espace (normale ou insécable) : [À CONFIRMER].
- **FMT-D-03** — Format pour x ≥ 3 600 s : [À CONFIRMER].
- **Recette A (oracle)** — Paramètres : unilatéral ; cibles 30 s, 45 s, 60 s ; Pauses 10 s, 20 s, 30 s. Calcul : 135 + 60 = 195 s. **Texte attendu : `3 min 15 s`**.

---

## 5. Manques démontrés et sujets à confirmer

| Type | Énoncé | Preuve |
|---|---|---|
| Manque démontré | Aucun format d'affichage pour une durée ≥ 3 600 s | `grep -nP '\{heures\}\|\{h\}\|x ?≥ ?3600\|plus d.une heure\|\b1 h \d'` → 0 sur 30 fichiers |
| Manque démontré | Pas de durée chiffrée adjacente à « temporairement » ou aux snackbars | `grep -nP '(snackbar\|message temporaire\|temporairement).{0,80}\d+ ?s\b'` → 0 |
| Manque démontré | REC-10…27 ne sont définis dans aucun chapitre 01..13 ; la table de recettes du ch. 10 n'a pas d'ID | `grep -rnP '(^\|\| ?)REC-10\b' docs` → uniquement des renvois ; `10…md:753` sans colonne ID |
| Manque démontré | 42 titres de règles de formats sans numéro ; 5 exceptions `(RM-et RM-)` sans cible | `grep -cP '^### RM-\s*$'` = 42 ; `grep -c '(RM-et RM-)'` = 5 |
| Manque démontré (dans les sections lues) | Aucune convention d'obligation (mot-clé) déclarée | 0 SHALL/MUST ; 5 « doit » sur 182 RM. La « Convention de lecture » `08…md:54-60` (lue) ne traite que du glossaire et de la primauté du texte sur les wireframes, pas du marqueur d'obligation. Présence ailleurs : *à confirmer* |
| Sujet à confirmer | Statut de « Stepper Récupération après activité » (`06…md:435`) : nom de frame autorisé ou terme interdit | `01…md:410` autorise les noms de frames |
| Sujet à confirmer | Unité de « cibles44 » (pt, dp ou px) | non trouvée dans les plages lues |
| Sujet à confirmer | Proportion de négations non testables parmi les 1 480 « aucun » | tri manuel non réalisé |

---

## Annexe — Écart au format OpenSpec (convention d'outil, non normative)

Le corpus n'emploie ni SHALL/MUST, ni `### Requirement:`, ni `#### Scenario:` WHEN/THEN (0 occurrence). Ce **n'est pas** un défaut de qualité au sens de 29148 ou de l'INCOSE. Si le projet vise un passage à OpenSpec, la réécriture de l'exemple 2 se transposerait ainsi : un `Requirement` par ID T0304-12-0x, et un `Scenario` par cas (WHEN ✕ est touché THEN le brouillon est identique à l'état d'ouverture). C'est une question d'outillage, distincte des recommandations ci-dessus.
