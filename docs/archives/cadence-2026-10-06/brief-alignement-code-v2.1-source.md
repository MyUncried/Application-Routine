# Brief de mission — alignement du code sur le Design System Figma (v2.1)

> **Version 2.1 — 2026-10-05 (mise à jour du soir ; les points 8 à 11 sont nouveaux), après la première exécution de la tranche T-0 (audit indépendant : `AUDIT-DSF-SECONDE-PASSE-2026-10-05.md`).** Cette version remplace la v1. Corrections apportées :
>
> 1. **Retrait du passage global de `cardTitle` de 16 à 17 px** (ancien § 5.1) : le style Figma « DSF / Card title » (17 px) n'a qu'un usage, un texte de chronomètre ; ce n'est pas un équivalent du rôle `cardTitle` du code (audit A08).
> 2. **Styles historiques** : dix des quatorze styles « KODJO / … » à interligne en pixels sont **encore utilisés** (195 textes) ; l'ancienne affirmation contraire est supprimée (audit § 5).
> 3. **Interlignes** : quatre styles « KODJO / Texte / … » ont un interligne explicite et sont des **exceptions** à la règle « ≈ 1,21 × la taille » (annexe B).
> 4. **Icônes** : **12** identifiants du manifeste sont absents de Figma (et non 11) ; les dimensions des sources de navigation diffèrent de celles du manifeste ; les 38 textes en police système sont des **icônes écrites comme du texte** (« photo.badge.plus »), pas l'horloge de la barre d'état ; les boutons « − » et « + » de `ProfileStepper.tsx` sont rendus par des textes (audit A03 à A05, A09).
> 5. **Interactions du prototype** : la base de référence est **410 interactions dont 285 en Smart Animate**. Les 19 interactions de clic perdues lors de remplacements de composants dans Figma sont recréées manuellement par le propriétaire ; elles sont **sans impact sur le développement** et ne sont plus un critère de recette du DSF.
> 6. **Couverture** : les valeurs de l'annexe H sont celles de l'audit, avec sa définition du dénominateur.
> 7. **Corrections déjà faites dans Figma depuis la v1** : opacité des six repères du chronomètre rétablie (A01), trois masters surnuméraires de « Valeur modifiable » archivés (A10), master « Tri » aligné sur le rendu approuvé 34 × 34 / icône 20 (A11).
> 8. **Décisions typographiques du propriétaire** : `cardTitle` reste à 16 px ; `compactCardTitle` = 15 px / interligne 18 (Figma) ; `caption` enregistré pour réintégration documentaire (§ 4, D9).
> 9. **Vocabulaire (tranché)** : « **Parcours** » dans les contrôles segmentés du catalogue des exercices et des séances ; « **Circuit** » dans la composition de séance. Le code dit « Circuits » pour le segment de catalogue : libellé à passer à « Parcours » (§ 4 D10, § 5.7).
> 10. **Zones corporelles de démonstration rétablies dans Figma** (Prototype MVP, page Communautaire, composants DSF) : 11 noms reconstitués (annexe G.4 bis).
> 11. **Documents liés** : `RAPPORT-CORRECTIONS-AUDIT-DSF-2026-10-05.md` (clôture des corrections de l'audit) et `POINTS-A-REINTEGRER-DANS-LA-DOCUMENTATION-2026-10-05.md` (liste des points à reporter dans la documentation).

| | |
|---|---|
| Destinataire | ChatGPT Protocole (orchestration KODJO V2) |
| Demandeur | Hermann (propriétaire du produit) |
| Documents liés | `AUDIT-DSF-SECONDE-PASSE-2026-10-05.md`, `RAPPORT-CORRECTIONS-AUDIT-DSF-2026-10-05.md`, `POINTS-A-REINTEGRER-DANS-LA-DOCUMENTATION-2026-10-05.md` |
| Préparé le | 2026-10-05, à l'issue d'un audit et d'une remise en ordre du Design System Figma ; v2 après l'audit indépendant du même jour |
| Dépôt | `MyUncried/Application-Routine`, branche `main`, commit de référence `6d03f5b` (PR n° 322) |
| Figma | fichier `G6RY5Ebhgwb4AHIOYDwwvg` — pages « Design system — Fondations » et « Prototype MVP » |
| Type de mission | développement / correction + mise à jour documentaire |
| Livrable attendu de cette étape | un **plan** (`PLAN_DRAFT` → `PLAN_READY_FOR_REVIEW`) respectant les trois portes du contrat lean : périmètre, plan, résultat |

Ce brief ne contient aucune règle fonctionnelle nouvelle. Il ne déduit rien d'un détail graphique de Figma : il aligne des **valeurs de présentation** (couleurs, typographie, géométrie, icônes) sur un Design System dont les décisions ont déjà été arbitrées par le propriétaire.

---

## 1. Objectif et contexte

Les écrans développés en React Native s'éloignent des références Figma. L'audit a établi les causes principales :

1. **Typographie** : Figma utilise Roboto Condensed (chronomètre, compteurs), absente du code qui ne charge qu'Inter. Les interlignes du code sont en pixels explicites, ceux de Figma en « auto » (≈ 1,21 × la taille pour Inter), d'où des écarts allant jusqu'à 4 px par ligne.
2. **Couleurs** : 14 couleurs du code n'ont pas de token Figma ; plusieurs quasi-doublons de noirs et de gris existaient des deux côtés.
3. **Géométrie** : Figma a besoin d'espacements 10, 14, 20 et de rayons 14, 17 que `tokens.ts` ne connaît pas.
4. **Icônes** : 11 des 25 identifiants Figma du manifeste n'existent plus ; 6 nouvelles icônes n'ont pas d'asset.
5. **Spécification** : la section « Design tokens canoniques » de `12 – Architecture technique.md` décrit un Figma qui n'existe plus (« 59, 62 et 4 variables » au 4 septembre ; le Prototype MVP y est décrit comme « non relié aux variables »).

État de Figma au 2026-10-05 : collections `KODJO / Primitives` (350 variables), `KODJO / Sémantiques` (432, dont 151 non « observed » : 70 couleurs et 81 nombres), `KODJO / Responsive` (4) ; 50 styles de texte ; 82 jeux de variantes dont 72 `DSF /…` sur la page Design system. Couverture mesurée par l'audit indépendant (page Prototype MVP, hors instances, illustrations, zones tactiles, barres d'état et petits rayons de glyphes) : fonds 90,3 %, contours 95,4 %, rayons 93,5 %, gaps 96,8 %, paddings 96,6 %, textes avec style 99,0 %. Ces taux sont une **couverture technique conservatrice**, pas un score de conformité des seuls éléments à tokeniser ; les taux de départ (7 / 11 / 14 / 8 / 9 / 0 %) ne peuvent pas être reconstitués avec la même méthode.

## 2. Sources de vérité et règles de conduite

- **Documentation fonctionnelle** : règles métier, comportements. Figma n'en porte aucune.
- **`docs/Specifications-fonctionnelles/12 – Architecture technique.md`** (section « Design tokens canoniques ») : source normative des tokens. `tokens.ts` en dérive. **La spécification est mise à jour avant le code.**
- **Figma** : source du rendu visuel. Valeurs reproduites en annexes : l'implémentation ne doit pas dépendre d'un accès Figma. Un contrôle par lecture Figma reste possible pour la vérification.
- **`assets/icons/manifest.json`** : référentiel des assets d'icônes.
- Toute ambiguïté non résolue par ces sources déclenche `CLARIFICATION_REQUIRED` (voir § 5), pas une décision implicite.

## 3. Périmètre

**Inclus**

1. Mise à jour de la spécification 12 (et des références croisées dans `06 – Ecrans et navigation de la V1.md`).
2. `src/shared/ui/tokens.ts` : couleurs, typographie, espacements, rayons ; consommateurs à adapter si une valeur de token change.
3. Chargement de la police Roboto Condensed (`app/_layout.tsx`, dépendance npm).
4. Libellés de traduction du segment de catalogue (D10, § 5.7).
5. Icônes : recalage du manifeste, ajout des 6 nouveaux assets, entrée des 2 SVG hors manifeste, remplacement des boutons « − » et « + » de `ProfileStepper.tsx` (lignes 176 et 197) par des assets canoniques à rendu identique, et décision sur le symbole « photo » (annexe E.7).
6. Remplacement des couleurs écrites en dur dans les composants lorsqu'un token canonique existe (annexe F).

**Exclu**

- Les écrans non codés (dossiers `execution`, `history`, `planning`, `composition` vides) : Calendrier, Planification, Exécution, Synthèse, Suivi. Leurs tokens et styles sont **documentés** dans la spécification, mais ne créent pas de code sans consommateur (sauf mention contraire à l'annexe A).
- Les écrans Communautaire (hors MVP).
- La barre d'état : décor de maquette rendu par le système ; ne pas la reproduire. Le code utilise la zone de sécurité de l'appareil, pas les 95 px de l'en-tête Figma.
- Les éléments d'animation de prototype (calques masqués ou à opacité 0, repères du chronomètre, états de retournement) : ne pas les implémenter ; les animations se réécrivent côté code.
- Les ombres (styles d'effet « observés ») : pas de décision, laisser en l'état.

## 4. Décisions arbitrées par le propriétaire (à ne pas rouvrir)

| N° | Décision | Détail |
|---|---|---|
| D1 | **Ajouter Roboto Condensed** | Utilisée volontairement dans Figma pour le chronomètre et les compteurs. Dépendance `@expo-google-fonts/roboto-condensed` (v0.4.2 publiée), graisses Medium, SemiBold, Bold ; chargement au même endroit que les polices Inter (`app/_layout.tsx`). |
| D2 | **Figma fait foi pour l'interligne** | Interlignes en pixels explicites égaux au rendu « auto » de Figma : `round(1,2102 × taille)` pour Inter (annexe B). **Exceptions** : les styles Figma à interligne explicite conservent leur valeur (annexe B). |
| D3 | **Couleurs du code ramenées aux tokens canoniques** | Tableau en annexe A. `dialogNeutralActionText` (`#292E38`) reste tel quel. |
| D4 | **Figma fait foi pour le point de séance du calendrier** | `calendarMarker = #1F9E7A` ; `positive = #4F9F83` est conservé pour ses autres usages. |
| D5 | **Géométrie** | Espacements 10, 14, 20 et rayons 14, 17 ajoutés à l'échelle (annexe C). |
| D6 | **Icônes** | Recalage du manifeste sur les composants Figma actuels, export des 6 nouvelles icônes, entrée des 2 SVG hors manifeste (annexe E). |
| D7 | **Rationalisation des neutres de Figma acceptée** | Fusion de blancs, gris et fonds quasi identiques ; les tokens cités dans la spécification 12 **gardent leur nom** mais prennent la valeur de leur cible (`divider` = `border` ; `iconNeutral` = `textSecondary` ; `mediaSurface` = `surface` ; `navigation/pill` = `surfaceSubtle`). |
| D8 | **Les deux noms sont conservés pour `divider`** | `divider` et `border` coexistent, à la même valeur `#E0E3E8`. |
| D9 | **Décisions typographiques (2026-10-05)** | `cardTitle` **reste 16 px** (« 16 est déjà petit sur l'écran »). `compactCardTitle` = **15 px, interligne 18**, comme dans Figma (la spécification dit 13 / 18, le code 14 / 18). `caption` : le propriétaire demande l'enregistrement du point pour la liste des réintégrations documentaires ; la hauteur de ligne cible issue de D2 est 13 (code 14, spécification 16), valeur à confirmer au plan. |
| D10 | **Vocabulaire « Parcours » / « Circuit » (2026-10-05, tranché)** | « **Parcours** » dans les **contrôles segmentés du catalogue des exercices et du catalogue des séances** ; « **Circuit** » dans les **écrans de composition de séance**. Conséquence pour le code : le libellé du troisième segment du catalogue (`contentTypes.circuits`, aujourd'hui « Circuits ») devient « **Parcours** », avec son libellé d'accessibilité (« Parcours — indisponible ») ; les clés de traduction ne sont pas renommées. Les libellés de composition et le modèle (« Circuit ») restent. |

## 5. Points à clarifier avant le plan (`CLARIFICATION_REQUIRED`)

1. **Titres de cartes** : le corps de `cardTitle` (16 px) n'est **pas** changé en 17. Le style « DSF / Card title » (17 px) était hérité de composants DSF dont **toutes les instances affichaient 15 px par surcharge** ; les masters sont désormais alignés sur 15 px et ce style est marqué obsolète. **Écart restant** : `SessionCard.tsx` et `ActivityCard.tsx` utilisent `type.cardTitle` 16 / 20, alors que la spécification 12 (« Titre des nouvelles cartes : Semi Bold 15 ») et Figma disent 15. Recommandation : un token dédié de 15 px pour les cartes de séance et d'exercice, `cardTitle` 16 conservé hors famille cartes. **Décisions du propriétaire (2026-10-05)** : `cardTitle` **reste à 16 px** (« 16 est déjà petit sur l'écran ») ; **`compactCardTitle` = 15 px / interligne 18, comme dans Figma** (la spécification dit 13 / 18 et le code 14 / 18 : tous deux à corriger). Point encore à confirmer : le corps du titre des cartes de séance et d'exercice dans Figma (15 px aujourd'hui, 16 px si le propriétaire généralise sa décision). `caption` : en attente (rapport de clôture, § 2.3). `compactCardTitle` est décidé (D9 : 15 / 18). `caption` : code 11 / 14, spécification 11 / 16, Figma 13 ; enregistré pour réintégration documentaire (D9).
2. **Collision de noms de variables** : Figma a `color/overlay/scrim` (`#1F2129` à 34 %, documenté `color.overlayScrim`) **et** `color/overlay-scrim` (`#14171F`, plein). Le tableau D3 mappe `compositionDraggedCardShadow` (`#14171F`) sur la seconde. Choisir un nom de token de code non ambigu.
3. **Écarts recalculés après D7** : deux lignes du tableau D3 ont un écart plus grand qu'au moment de la validation (la cible `divider` vaut maintenant `#E0E3E8`) : `compositionDraggedCardBorder` (Δ 30, validé à Δ 25) et `disclosureBorderCollapsed` (Δ 15, validé à Δ 10). Faire reconfirmer ces deux lignes, ou conserver leur valeur actuelle comme token propre.
4. **Nommage des nouveaux tokens de code** : appliquer la convention existante (nom Figma à barre → camelCase). Noms Figma sources : `color/text-label`, `color/text-tertiary`, `color/on-primary`, `color/primary-soft`, `color/calendar-marker`, `color/cards/border`.
5. **Tokens sans consommateur** : la spécification les documente tous ; le code n'ajoute que ceux qui sont consommés ou requis par D3/D4 (annexe A). Confirmer ce principe, ou autoriser des tokens « de traçabilité » comme pour `wheelAction*Icon`.
6. **Icônes de navigation** : les identifiants du manifeste (26 × 26, 30 × 20…) ne correspondent plus aux composants Figma `icon/…` (24 × 24 ou autres). Vérifier tailles, tracés et gestion actif/inactif avant d'exporter (annexe E).
7. **Vocabulaire du catalogue (code ↔ Figma) — tranché (D10), un point reste ouvert** : les ressources de traduction du code (`src/shared/i18n/resources/fr.ts`) disent « Circuits » pour le troisième segment du catalogue ; le propriétaire a tranché « **Parcours** » pour les contrôles segmentés du catalogue (exercices et séances) et « **Circuit** » pour la composition. À faire : `contentTypes.circuits` → « Parcours », `circuitsUnavailableAccessibilityLabel` → « Parcours — indisponible », tests i18n associés (`src/shared/i18n/index.test.ts`). **Reste ouvert** : le libellé de l'entrée `newCircuit` (« Un circuit ») de l'arbre de création du catalogue, que la décision ne couvre pas explicitement ; ne pas le modifier sans arbitrage. Le glossaire doit préciser si « Circuit » et « Parcours » désignent le même objet.

## 6. Découpage proposé en tranches (dans cet ordre)

| Tranche | Contenu | Dépend de |
|---|---|---|
| **T-0 — Vérification indépendante du DSF** | Contrôle en lecture seule de l'état réel de Figma, **avant** de le documenter ou de l'implémenter (§ 6 bis). Produit un rapport de vérification du DSF. | — |
| **T-A — Spécification** | Mise à jour de la section « Design tokens canoniques » : état réel de Figma (§ 1), nouveaux tokens, nouvelles valeurs des 4 tokens cités (D7), règle d'interligne (D2), règle d'usage de Roboto Condensed (D1), tokens géométrie (D5). Références croisées dans `06`. | T-0, décisions § 4 et § 5 |
| **T-B — Tokens et typographie** | `tokens.ts` : couleurs (annexe A), interlignes (annexe B), échelles (annexe C), nouvelles familles et tokens de type Roboto Condensed (annexe D). Adaptation des consommateurs. | T-A |
| **T-C — Police** | Dépendance, chargement, contrôle de disponibilité des graisses 500/600/700 sur iOS et Android. | T-B |
| **T-D — Icônes** | Manifeste, assets SVG, `KodjoIcon.tsx`. | T-A, point 6 du § 5 |
| **T-E — Couleurs en dur** | Annexe F : remplacer les littéraux par des tokens quand une équivalence existe. | T-B |

Une seule porte « plan » peut couvrir T-0 à T-E si elles sont planifiées ensemble ; T-C et T-D sont indépendantes l'une de l'autre.

## 6 bis. Vérification indépendante du DSF (tranche T-0)

**Pourquoi.** Les modifications du Design System Figma décrites ici (plusieurs milliers de liaisons de variables, fusions de tokens et de composants, réparations) ont été réalisées par la même IA qui a rédigé ce brief, à l'aide d'un outil dont une limite a déjà provoqué des incidents (voir annexe H). Le DSF doit donc être **vérifié par une IA indépendante avant d'être documenté dans la spécification et pris pour référence du code**. Cette vérification est un contrôle, pas une correction.

**Règles.**

- **Lecture seule** : aucune modification de Figma pendant T-0. Tout écart est consigné ; sa correction est décidée ensuite par le propriétaire.
- **Moyen d'accès** : Figma via MCP ou API REST en lecture seule (fichier `G6RY5Ebhgwb4AHIOYDwwvg`). Si aucun accès n'est disponible, l'orchestrateur le dit explicitement et classe les contrôles concernés `NON VÉRIFIABLE` : il ne les suppose pas conformes.
- **Vocabulaire des statuts** (le même que l'audit) : `CONFORME`, `PARTIELLEMENT CONFORME`, `NON CONFORME`, `NON VÉRIFIABLE`, `À CLARIFIER`. Une absence de preuve n'est jamais `CONFORME`.
- Chaque constat cite un identifiant de nœud ou de variable et la propriété concernée.

**Contrôles à effectuer.**

| N° | Contrôle | Référence attendue |
|---|---|---|
| V1 | **Variables** : comptes par collection ; valeurs résolues des tokens documentés ; alias (`divider` = `border`, `icon-neutral` = `text-secondary`, `media/surface` = `surface`, `navigation/pill` = `surface-subtle`) ; absence de variable supprimée encore référencée ; scopes cohérents avec l'usage | § 1, annexe A, annexe G |
| V2 | **Intégrité des liaisons** : tout nœud lié pointe vers une variable existante ; recalcul des indicateurs de couverture (fonds, contours, rayons, gaps, paddings, textes) | § 1 |
| V3 | **Opacités** : aucune opacité perdue sur les remplissages et traits semi-transparents, listés en annexe H (rechercher en particulier les nœuds liés à un token avec une opacité de 100 % alors que leur jumeau non modifié est semi-transparent) | annexe H |
| V4 | **Composants** : zéro instance orpheline ; jeux de variantes du DSF cohérents avec l'annexe G (noms de variantes, absence de suffixe « (écran) ») ; composants archivés sans instance ; `Valeur modifiable`, `En-tête fixe`, `Barre d'état`, `Poignée de modale`, `Progression par tours`, `icon/*` conformes à leurs descriptions | annexe G |
| V5 | **Styles de texte** : 50 styles ; couverture ; les textes sans style restants correspondent aux cas légitimes listés en annexe H ; l'interligne des styles « KODJO / Texte / … » est bien « auto » | § 4 D2, annexe B |
| V6 | **Mise en page** : détection des cadres à mise en page automatique dont le contenu dépasse (largeur et hauteur) ; comparaison avec la liste de dépassements préexistants (annexe H) ; tout nouveau dépassement est un constat | annexe H |
| V7 | **Prototype** : 410 interactions dont 285 en Smart Animate (nouvelle base acceptée par le propriétaire) ; jeux « Zone d'exécution — retournements » (12 variantes) et « Cadre bas — retournement » (4) intacts ; repères du chronomètre identiques dans tous les écrans (annexe H) | annexe H |
| V8 | **Cohérence documentaire** : rechercher dans `docs/` et dans les commentaires du code les noms et identifiants Figma modifiés (annexe G) et lister ceux à mettre à jour | annexe G |
| V9 | **Contrôle visuel par échantillon** : captures des écrans listés en annexe H, comparées aux pages de référence du fichier (« Référence responsive — Cible », « Validation responsive ») et à la documentation des écrans | annexe H |
| V10 | **Icônes** : existence, taille et tracé des composants de l'annexe E ; correspondance visuelle avec les assets actuels du dépôt | annexe E |

**État de T-0.** Une première exécution a eu lieu le 2026-10-05 (`AUDIT-DSF-SECONDE-PASSE-2026-10-05.md`). Ses constats P1 sont repris ici : A01 (corrigé), A03 à A05 (icônes, annexe E), A06 à A08 (couleurs et typographie, annexes A et B). **Une relecture strictement indépendante reste à confier à un autre intervenant** (l'auditeur signale lui-même une indépendance limitée), et T-0 est à rejouer après les corrections avec les définitions de mesure de l'audit.

**Livrable de T-0.** Un rapport de vérification du DSF (tableau des constats avec statut, identifiant, preuve, gravité), joint au rapport de mission. **Les tranches T-A à T-E ne démarrent pas tant que les constats `NON CONFORME` ne sont pas traités ou explicitement acceptés par le propriétaire.**

## 7. Critères d'acceptation et preuves

1. La spécification 12 ne contient plus de valeur périmée (nombre de variables, valeurs de `divider`, `iconNeutral`, `mediaSurface`, `navigation/pill`) ; chaque token de code est tracé vers une variable Figma ou une décision du § 4.
2. **Contrôle déterministe** : un test ou script compare les valeurs de `tokens.ts` au tableau de la spécification.
3. Aucune couleur hexadécimale hors `tokens.ts` hors cas listés en annexe F comme « laisser tel quel » ; `grep` joint au rapport.
4. Interlignes : chaque token `type.*` correspond à l'annexe B ; tests de rendu/instantanés mis à jour et justifiés un par un.
5. Police : `useFonts` charge Inter **et** Roboto Condensed (Medium, SemiBold, Bold) ; l'application démarre sans avertissement de police.
6. Manifeste : chaque `figmaNodeId` renseigné existe dans Figma (contrôle par lecture Figma) ; chaque fichier `.svg` est référencé ; aucun asset sans entrée.
7. Suites existantes (`jest`, e2e) au vert ; résultats joints.
8. Rapport de mission versionné selon `CLAUDE.md` (chemin, hash du commit, état Git, tests).
9. **Rapport de vérification indépendante du DSF (T-0)** joint, sans constat `NON CONFORME` ouvert ; les constats acceptés par le propriétaire y figurent avec la mention de son accord.

## 8. Hypothèses non démontrées et risques

- **Interligne de Roboto Condensed** : le brief suppose un rendu « auto » d'environ 1,17 × la taille (métriques de la police), soit 117 px pour 100 px, 35 px pour 30 px, 28 px pour 24 px. **À mesurer** sur la police chargée et à comparer à Figma avant de figer les valeurs.
- **Les 4 tokens documentés changent de valeur** (D7) : `divider` `#DBE0E8 → #E0E3E8` (Δ 6), `iconNeutral` `#5C636E → #595E66` (Δ 10), `mediaSurface` `#F6F6FF → #F5F7FA`, `navigation/pill` vers `#F9FAFC`. Effet visuel léger, mais sur des écrans déjà codés (Profil, Catalogue, Composition).
- **Réduction des interlignes** (`body` 20 → 17, `dialogMessage` 21 → 17, `navLabel` 16 → 13, `exerciseFieldValue` 18 → 16) : hauteurs de blocs réduites, risque de débordement ou d'instantané à mettre à jour.
- **Chargement d'une famille de polices supplémentaire** : poids de l'application et temps de démarrage à mesurer.
- Les écrans non codés ne peuvent pas être vérifiés côté code (`NON_VÉRIFIABLE`).

## 9. Vérifications restant à effectuer sur appareil réel

- Rendu du chronomètre en Roboto Condensed (largeur de « 00:24 » à 100 px, absence de coupure) sur iOS et Android.
- Hauteurs des textes avec les nouveaux interlignes sur les écrans Profil, Catalogue, Composition, Création d'activité.
- Couleurs de séparateurs (`divider`) et d'icônes inactives (`iconNeutral`) sur écran réel.
- Icônes de navigation : tailles, état actif/inactif, alignement avec la barre de navigation.

## 10. Livrables

Rapport de mission Markdown versionné (périmètre demandé et traité, constats, preuves, hypothèses, modifications, éléments non corrigés, vérifications à faire sur appareil, fichiers modifiés, commit final, état Git), nommé `AAAA-MM-JJ_<mission>.md`.

---

# Annexe A — Couleurs : code actuel → cible

Valeurs de Figma au 2026-10-05. Écart (Δ) = distance RVB entre la valeur actuelle du code et la cible.

**A.1 Inchangées** (nom et valeur identiques à Figma) : `primary` `#0508E5`, `selection` `#5F60EE`, `selectionSurface` `#E5F0FF`, `background` `#FFFFFF`, `surface` `#F5F7FA`, `surfaceSubtle` `#F9FAFC`, `textPrimary` `#141414`, `textSecondary` `#595E66`, `border` `#E0E3E8`, `disabled` `#BEC2CC`, `snackbar` `#292B33`, `positive` `#4F9F83`, `warning` `#FF8D28`, `danger` `#D92D20`, `dangerSurface` `#FFF1F0`, `wheelAction*` (alias existants), `sessionNameBorder` `#FFFFFF`.

**A.2 Valeurs qui changent** (noms conservés, décision D7/D8)

| Token de code | Valeur actuelle | Nouvelle valeur | Alias de | Δ |
|---|---|---|---|---|
| `divider` | `#DBE0E8` | `#E0E3E8` | `border` | 6 |
| `iconNeutral` | `#5C636E` | `#595E66` | `textSecondary` | 10 |

**A.3 Couleurs du code ramenées à un token canonique (D3)**

| Token de code | Valeur actuelle | Devient | Valeur cible | Δ |
|---|---|---|---|---|
| `dialogTitleText` | `#121212` | `textPrimary` | `#141414` | 3 |
| `exerciseParameterValueText` | `#14171C` | `textPrimary` | `#141414` | 9 |
| `exerciseParameterLabelText` | `#1F1F26` | `textPrimary` | `#141414` | 24 |
| `dialogMessageText` | `#474D57` | `textLabel` | `#46464C` | 13 |
| `dialogNeutralActionBackground` | `#F3F4F6` | `surface` | `#F5F7FA` | 5 |
| `exerciseParameterControlBorder` | `#DBDBE5` | `divider` | `#E0E3E8` | 10 |
| `exerciseContextBandBackground` | `#F7F7FF` | `surface` | `#F5F7FA` | 5 |
| `exerciseParameterCardBackground` | `#F6F6FF` | alias de `mediaSurface` (= `surface`) | `#F5F7FA` | 5 |
| `disclosureBackground` | `#FBFCFF` | `surfaceSubtle` | `#F9FAFC` | 4 |
| `disclosureBorderCollapsed` | `#D6D9E3` | `divider` | `#E0E3E8` | 15 (voir § 5.3) |
| `disclosureBorderExpanded` | `#8283F2` | `primarySoft` | `#8283F2` | 0 |
| `disclosureChevronCollapsed` | `#8282F2` | `primarySoft` | `#8283F2` | 1 |
| `compositionDraggedCardBorder` | `#D1D1D6` | `divider` | `#E0E3E8` | 30 (voir § 5.3) |
| `compositionDraggedCardShadow` | `#14171F` | token Figma `color/overlay-scrim` | `#14171F` | 0 (voir § 5.2) |
| `tourSurface` | `#CDCEFA` | alias de `mediaBorder` | `#CDCEFA` | 0 |
| `dialogDestructiveActionBackground` | `#E62B1E` | `danger` | `#D92D20` | 13 |
| `dialogDestructiveActionBorder` | `#DB2E2E` | `danger` | `#D92D20` | 14 |
| `dialogNeutralActionText` | `#292E38` | **inchangé** | `#292E38` | — |

**A.4 Tokens à ajouter au code** (consommés ou requis par ce qui précède)

| Token Figma | Valeur | Raison |
|---|---|---|
| `color/text-label` | `#46464C` | cible de `dialogMessageText` ; libellés de paramètres |
| `color/text-tertiary` | `#7A7A80` | 3ᵉ niveau de gris de texte, présent dans Figma (140 usages) |
| `color/on-primary` | `#FFFFFF` | texte, icône ou trait clair sur fond coloré (remplace `text-on-primary`, `stroke-inverse`, `icon-on-primary`) |
| `color/primary-soft` | `#8283F2` | cible des deux couleurs d'accordéon |
| `color/calendar-marker` | `#1F9E7A` | D4 (écran non codé : à documenter ; à ajouter au code seulement si un consommateur existe) |
| `color/cards/border` | `#CCD1E0` | bordure renforcée de carte (109 usages dans Figma) |

**A.5 Palette neutre de référence** (pour la spécification)

| Famille | Tokens |
|---|---|
| Fonds | `background`, `surface-subtle`, `surface` (+ `selection-surface`, `planned-surface`) |
| Lignes | `border` (= `divider`), `cards/border`, `disabled` |
| Texte | `text-primary`, `text-label`, `text-secondary` (= `icon-neutral`), `text-tertiary`, `on-primary` |

Variables supprimées dans Figma (ne pas les documenter) : `color/cards/badge`, `color/cards/surface`, `color/cards/archive-surface`, `color/progress-track`, `color/text-muted`, `color/card-surface`, `color/stroke-inverse`, `color/icon-on-primary`, `color/observed/e62b1e`, `color/observed/db2e2e`.

# Annexe B — Interlignes (Inter) : règle `round(1,2102 × taille)`

| Token `type.*` | Corps | Interligne actuel | Cible | Écart actuel |
|---|---|---|---|---|
| `activityTitle` | 28 | 34 | **34** | 0 |
| `metricPrimary` | 22 | 28 | **27** | +1 |
| `screenTitle` | 20 | 24 | **24** | 0 |
| `modalTitle` | 18 | 22 | **22** | 0 |
| `sectionTitle` | 16 | 20 | **19** | +1 |
| `cardTitle` | 16 (inchangé hors cartes ; cartes récentes : 15, § 5.1) | 20 | **19** | +1 |
| `compactCardTitle` | 14 → **15** (décision du propriétaire) | 18 | **18** | 0 |
| `body` | 14 | 20 | **17** | +3 |
| `label` | 14 | 18 | **17** | +1 |
| `button` | 14 | 18 | **17** | +1 |
| `supporting` | 12 | 16 | **15** | +1 |
| `caption` | 11 | 14 | **13** | +1 |
| `navLabel` | 11 | 16 | **13** | +3 |
| `parameterColumnLabel` | 15 | 18 | **18** | 0 |
| `exerciseFieldValue` | 13 | 18 | **16** | +2 |
| `dialogMessage` | 14 | 21 | **17** | +4 |
| `dialogNeutralActionLabel` | 16 | 20 | **19** | +1 |
| `dialogDestructiveActionLabel` | 16 | 20 | **19** | +1 |
| `contextLine` | 14 | 17 | **17** | 0 |

Les styles Figma « KODJO / Texte / … » sont au nombre de **29**. La plupart ont un interligne « auto » ; **quatre ont un interligne explicite et sont des exceptions** à la règle ci-dessus, à conserver telles quelles : Inter Regular 14 / 18 px (52 usages sur le Prototype MVP), Inter Medium 10 / 16 px (24), Roboto Condensed SemiBold 16 / 22 px (24), Inter Regular 12 / 15 px (56). La règle « ≈ 1,21 × la taille » est une approximation du brief, pas une mesure des métriques de chaque police et de chaque plateforme.

**Les styles historiques « KODJO / … » à interligne en pixels ne sont pas inutilisés** : dix des quatorze sont encore consommés sur le Prototype MVP (195 textes, par exemple « Section title » 16 / 20 pour « HA » et « Hermann », « Picker / Action »). Ne pas les déclarer obsolètes ni les supprimer.

# Annexe C — Géométrie

| Échelle | Valeurs du code | À ajouter | Variable Figma |
|---|---|---|---|
| `spacing` | 2, 4, 6, 8, 12, 16, 24, 32 | **10, 14, 20** | `spacing/10`, `spacing/14`, `spacing/20` |
| `fixedRadii` | 6, 8, 10, 12, 16, 20, 24 | **14, 17** | `radius/14`, `radius/17` |

Les rayons 1, 2, 4,5, 5 et 0,9375 sont des dessins de glyphes ou de petites barres (poignée de modale, symbole « + », progression par tours) : ils ne sont pas des tokens et doivent rester locaux. Les espacements 92 et 120 sont des dimensions de structure. Valeurs de gabarit présentes dans Figma et absentes du code, à documenter dans la spécification : `size/modal-bottom-action-height` (70), `size/main-navigation-region-height` (77), `size/content-max-width` (440), `size/modal-width` (378), `size/modal-height` (822), `size/header-fixed-height` (95 : ne pas l'implémenter tel quel, il inclut la barre d'état).

# Annexe D — Roboto Condensed : usages dans Figma

| Style Figma | Police | Corps | Interligne Figma | Crénage |
|---|---|---|---|---|
| `DSF / Timer` (chrono principal « 00:24 ») | Bold | 100 | auto | −1,5 |
| (grand chrono, 6 occurrences) | Bold | 158 | auto | −1,5 |
| Compteurs de série et de tour, temps écoulé | Bold | 30 | auto | 0 |
| (variante) | SemiBold | 30 | auto | 0 |
| `DSF / Exécution / Indication média 24` | Medium | 24 | auto | 0 |
| (libellés) | SemiBold | 16 | 22 px | 0 |
| (libellés) | Medium | 16 et 17 | auto | 0 |
| (petits libellés) | SemiBold | 12 | auto | 0 |

L'actuel `type.timerPrimary` (Inter SemiBold 58/64) n'est utilisé nulle part dans le code : il est remplacé par des tokens correspondant à ces usages. La police `SF Pro` n'est **pas** l'horloge de la barre d'état : les 38 textes concernés (24 px) sont le glyphe « photo.badge.plus », une **icône écrite comme du texte**, contraire à la règle du manifeste ; voir annexe E.7.

# Annexe E — Icônes

**E.1 Identifiants du manifeste absents de Figma (12)** : `action.add` (2884:4442), `action.start` (2884:4450), `control.back` (2884:4426), `control.chevronDown` (2884:4419), `control.chevronUp` (2884:4417), `control.repetitionPullDown` (2745:4), `navigation.sessions.active` (2537:95), `navigation.sessions.inactive` (2537:127), `state.selected` (2537:1509), `composition.fixed` (3066:4680), `wheel.action.cancel` (3089:81), `wheel.action.validate` (3089:83).

**E.2 Identifiants toujours valides** : `bodyZone.homme` (6322:10874), `bodyZone.femme` (6322:10877), `composition.reorder` (3066:4676, composant renommé `DSF / Primitives / Icône de structure — déplaçable`), `icon.tour` (3066:4685, renommé `DSF / Primitives / Icône de tour`), `composition.initialCountdown` (2537:1461), `composition.endSession` (2537:1471), `navigation.search` (2537:92), et les identifiants de navigation `calendar`, `history`, `profile` qui existent encore comme anciens groupes de tailles différentes (24 × 24, 24 × 19, 22 × 24 au lieu de 26 × 26, 26 × 21, 26 × 29).

**E.3 Composants Figma actuels (à rapprocher du manifeste — correspondance non vérifiée)**

| Composant Figma | Identifiant | Rapprochement probable |
|---|---|---|
| `icon/catalogue` | 6296:10468 | `navigation.sessions.*` |
| `icon/calendrier` | 6296:10484 | `navigation.calendar.*` |
| `icon/suivi` | 6296:10498 | `navigation.history.*` |
| `icon/profil` | 6296:10514 | `navigation.profile.*` |
| `icon/categorie` | 6296:10530 | catégorie |
| `icon/zone-corporelle` | 6322:10880 | `bodyZone.*` |
| `icon/poignee` | 6679:13419 | poignée de déplacement |
| `icon/ajouter` | 6959:15706 | `action.add` |
| `icon/retour` | 6959:15940 | `control.back` |
| `icon/fermer` | 6959:15825 | nouveau |
| `icon/suivant` | 6959:15460 | nouveau |
| `icon/précédent` | 6959:15579 | nouveau |
| `icon/tri` | 6939:26387 | nouveau |
| `DSF / Primitives / Icône d'action de modale` (Type=Cancel, Validate) | 4155:6201 | `wheel.action.cancel`, `wheel.action.validate` |

**E.4 Nouveaux assets à exporter** (tracés vectoriels, 24 × 24 sauf `tri` en 20 × 20 ; `photo-ajouter` : `7021:13149`, trait 1,8) : `suivant` (trait 2, tracé `M0 0 L7 7 L0 14`), `précédent` (trait 2), `ajouter` (trait 2, croix de 14 px), `fermer` (trait 2,2, croix de 12 px), `retour` (trait 2), `tri` (double flèche verticale, trait 2, `#9499A8` à 85 %).

**E.5 SVG hors manifeste, à y ajouter** (utilisés dans `KodjoIcon.tsx`) : `select-field-chevron` (14 × 14), `label-outline` (20 × 20).

**E.6 Dimensions des sources de navigation existantes (audit A04)**

| Source | Dimensions Figma | Dimensions du manifeste |
|---|---|---|
| Calendrier actif / inactif (`2537:103`, `2537:135`) | 24 × 24 | 26 × 26 |
| Suivi actif / inactif (`2537:109`, `2537:173`) | 24 × 19,3846 | 26 × 21 |
| Profil actif / inactif (`2537:114`, `2537:209`) | 21,5172 × 24 | 26 × 29 |

Qualifier la source et le viewBox **avant** tout remplacement ; ne pas modifier le dessin existant.

**E.7 Écarts d'icônes côté code et côté Figma (audit A05, A09)**

- `src/shared/ui/ProfileStepper.tsx`, lignes 176 et 197 : les actions sont rendues par les textes « − » et « + », contrairement à la règle du manifeste. Les remplacer par des assets canoniques à rendu identique, en conservant les libellés d'accessibilité.
- Dans Figma, les 38 textes en police système (« photo.badge.plus », 24 px), qui étaient des icônes écrites comme du texte, sont **remplacés** par des instances du composant `icon/photo-ajouter` (`7021:13149`, 24 × 24, trait 1,8 px, couleur liée à `color/icon-neutral`, dessin validé par le propriétaire). Elles sont dans la tuile « Ajouter » de la galerie de médias, hors zone visible des écrans statiques (tuile rognée). Ce composant est à ajouter aux assets exportés du manifeste (annexe E.4) ; le code ne doit pas utiliser de symbole SF.
- Aucun autre caractère typographique n'est utilisé comme icône dans le code d'après l'audit ; la règle du manifeste (« caractères typographiques et icônes approximatives interdits ») reste en vigueur.

# Annexe F — Couleurs écrites en dur hors `tokens.ts` (lignes non commentées)

| Fichier : ligne | Valeur | Équivalent canonique | Action |
|---|---|---|---|
| `KodjoSplash.tsx` : 38, 54 | `#0001F1`, `#FFFFFF` | splash dédié (frame Figma 1992:469) | laisser tel quel (à documenter) |
| `ProfileScreen.tsx` : 346 | `#FCFCFE` | `surfaceSubtle` (`#F9FAFC`, Δ 4) | remplacer |
| `ProfileScreen.tsx` : 348 | `#FFFFFF` | `background` | remplacer |
| `ProfileEditScreen.tsx` : 390 | `#CCD1E0` | `color/cards/border` | remplacer |
| `ProfileEditScreen.tsx` : 395 | `#0508E5` | `primary` | remplacer |
| `DurationWheelPicker.tsx` : 569, 610, 623 ; `NumberWheelPicker.tsx` : 343, 356 ; `DecisionDialog.tsx` : 109 ; `ColorPalette.tsx` : 149 ; `ProfileScreen.tsx` : 351 | `#000000` (`shadowColor`) | aucune (ombres hors périmètre) | laisser tel quel |

La palette de couleurs d'étiquettes choisies par l'utilisateur (`ColorPalette`) est une donnée, pas un token d'interface ; elle n'est pas concernée.

# Annexe G — Journal des modifications du DSF (pour la vérification T-0 et la mise à jour documentaire)

Les identifiants de nœuds sont conservés par les renommages et déplacements : seuls les noms ont changé. Les noms ci-dessous sont ceux à rechercher dans la documentation et les commentaires du code.

**G.1 Tokens**

| Opération | Détail |
|---|---|
| Supprimés (fusionnés) | `color/cards/badge`, `color/cards/surface`, `color/cards/archive-surface`, `color/progress-track`, `color/text-muted`, `color/card-surface`, `color/stroke-inverse`, `color/icon-on-primary`, `color/observed/e62b1e`, `color/observed/db2e2e` |
| Renommé | `color/text-on-primary` → `color/on-primary` (usages élargis au texte, aux formes et aux traits) |
| Alias conservés, valeur changée | `color/divider` (= `border`), `color/icon-neutral` (= `text-secondary`), `color/media/surface` (= `surface`), `color/navigation/pill` (= `surface-subtle`) |
| Créés | `color/primary-soft`, `color/text-tertiary`, `color/text-label`, `color/calendar-marker`, `color/action/breakpoint`, `spacing/10`, `spacing/14`, `spacing/20`, `radius/14`, `radius/17` (et la primitive `dimension/17`) |
| Fusion du rouge | `#E62B1E` et `#DB2E2E` reliés à `color/danger` (`#D92D20`) dans tout le fichier |
| Scopes élargis | `color/icon-neutral` (texte), `color/text-primary` (formes), `color/divider` (texte) |

**G.2 Composants archivés** (cadre « DSF V2 — Archive / Composants fusionnés (lot 5) », page Design system — Fondations) : `Controls / Switch — Source exact`, `Controls / Disclosure — Source exact`, `Modal / Header Action — Source exact`, `Header / Sound Control — Source exact`, `Header / Voice Control — Source exact`, `Button / Primary — Source exact` (et `/Disabled`), `Controls / Segmented` (et `/3/1`, `/2/1`), `Activity / Name Field — Source exact`, `Selection / Category Tag`, `Status / Badge — Source exact`. Leurs instances (659) pointent vers les équivalents `DSF /…`.

**G.3 Composants renommés** (cadre « DSF V2 — Primitives et gabarits (ex-« Source exact ») ») :

| Ancien nom | Nouveau nom |
|---|---|
| `Icon / Modal Action — Source exact` | `DSF / Primitives / Icône d'action de modale` |
| `Icon / Tour` | `DSF / Primitives / Icône de tour` |
| `Icon / Structure / Movable` | `DSF / Primitives / Icône de structure — déplaçable` |
| `Icon / Search` | `DSF / Primitives / Icône de recherche` |
| `Overlay / Decision Dialog/Icon/Add — Source exact` | `DSF / Primitives / Icône d'ajout — dialogue` |
| `Calendrier / Jour mensuel` | `DSF / Primitives / Jour mensuel` |
| `Composition / Activity Row` | `DSF / Primitives / Composition — ligne d'activité` |
| `Composition / Boundary Activity — Source exact` | `DSF / Primitives / Composition — activité de bord` |
| `Action / Categories — Source exact/Create` | `DSF / Primitives / Action — créer une catégorie` |
| `Action / Back` | `DSF / Primitives / Action — retour` |
| `Forms / Text Field — Source exact` | `DSF / Primitives / Champ de texte` |
| `Header / Fixed` | `DSF / Primitives / En-tête fixe (ancien)` |
| `Header / Fixed/Execution/On` | `DSF / Primitives / En-tête fixe — exécution` |
| `Overlay / Decision Dialog` | `DSF / Primitives / Dialogue de décision (ancien)` (6 instances conservées) |
| `Indicator / Sides — Source exact` | `DSF / Primitives / Indicateur de côté (ancien)` |
| `Shell / Screen`, `Shell / Execution`, `Shell / Modal Fullscreen` | `DSF / Gabarits / Écran`, `/ Exécution`, `/ Modale plein écran` |

**G.4 Composants créés ou modifiés**

- `DSF / Navigation / Barre d'état (décor)` : décor, imbriqué dans les 3 variantes de `En-tête fixe`.
- `DSF / Navigation / En-tête fixe` : propriétés `Titre` (texte) et `Démarcation` (booléen, masqué par défaut) ; faute « Mofification » corrigée.
- `DSF / Forms / Valeur modifiable` : 2 variantes (`Texte=13`, `Texte=14`) et propriété `Valeur`.
- `DSF / Overlays / Poignée de modale`, `DSF / Controls / Progression par tours` (`État=En cours` / `Initial`), `icon/tri`, `icon/suivant`, `icon/précédent`, `icon/ajouter`, `icon/fermer`, `icon/retour`.
- Variantes ajoutées ou renommées : Bouton primaire (`Actif`, `Désactivé` : versions des écrans), Statut d'exécution (7 états), Champ de nom (« Nom d'exercice — champ vide »), Catégorie sélectionnable (« Libellé seul — … »), Contrôle segmenté (« Trois éléments — 1, 2, 3 sélectionné », « Deux éléments — 1 sélectionné » ; variantes d'origine inutilisées supprimées, sauf « Deux détaillé »).

**G.4 bis Corrections postérieures à la v1 du brief**

- **Zones corporelles de démonstration** : les 11 étiquettes des écrans « Ajouter un exercice — Zones corporelles », « … — Appui long — Confirmation suppression » et « … — Nouvelle zone corporelle » (Prototype MVP **et** page Communautaire) affichaient « Catégorie » ; noms rétablis dans l'ordre de lecture : Cou, Épaules, Bras, Poignets et mains, Dos, Hanches et bassin, Cuisses (sélectionnée), Fessier (sélectionnée), Genoux, Jambes, Chevilles et pieds (reconstitution contrôlée : largeur de chaque étiquette = largeur du nom + 24 px). Même rétablissement dans les composants DSF `Overlays / Classification` (variantes « Zones corporelles » et « Créer une zone ») et `Overlays / Filtres`.
- **Pastilles de filtre « Actives » et « Archivées »** (catalogue des exercices et des séances, Prototype MVP, Communautaire, DSF) rétablies d'après le nom de leur instance ; les 11 zones du filtre des exercices aussi. Plus aucune étiquette n'affiche « Catégorie » par défaut dans le fichier.
- **« Parcours » → « Circuit »** dans les textes des 17 écrans de composition de séance (« Circuit », « N circuits ») ; noms de calques inchangés (animations préservées). Le contrôle segmenté du catalogue et les 26 autres occurrences gardent « Parcours ».
- Rouge des dialogues : tous les `#E62B1E` et `#DB2E2E` sont reliés à `color/danger` ; les boutons « Confirmer » (séance archivée) et « Supprimer » (étiquette) ont le même rouge.

- Six repères du chronomètre (3 h, 6 h, 9 h, deux instances `6452:10039` et `6452:9958`) : opacité rétablie à 62 %.
- Trois masters surnuméraires `DSF / Forms / Valeur modifiable` (`6944:26411`, `:26415`, `:26419`), résidus d'un script, sans instance : déplacés dans le cadre d'archive et renommés « copie résiduelle — à supprimer ».
- 38 glyphes texte « photo.badge.plus » remplacés par des instances de `icon/photo-ajouter` (`7021:13149`), position centrée identique, aucune interaction perdue (410 avant et après).
- `DSF / Controls / Tri` (`5544:4721`) : 34 × 34, rayon 17, fond blanc à 72 %, trait `#BEC2CC` à 75 %, icône `icon/tri` de 20 px (le glyphe texte « ↕ » est remplacé). Les 24 contrôles de tri des écrans ne sont pas modifiés.

- « DSF / Card title » (17 px) : 40 textes de composants DSF (cartes, gabarits) alignés sur le style `Texte / Inter Semi Bold 15` ; le texte de chronomètre `5017:6051` rebranché sur le style neutre `Texte / Inter Semi Bold 17` (créé) ; ancien style marqué obsolète. Aucun changement visible dans les écrans.

**G.5 Autres modifications**

- Repère de 6 h du chronomètre remonté de 55 px dans les 12 variantes de « Zone d'exécution — retournements » (Prototype MVP et copie Communautaire) ; petits traits à 40 % dans les variantes visibles.
- Suppression de 117 gabarits « Shell Instance » invisibles et de 208 éléments masqués ou transparents sans usage (dont 160 sans jumeau d'animation, 48 hors famille du retournement).
- Textes : 4 172 + 183 liaisons de styles de texte ; 28 styles « KODJO / Texte / … » créés ; ≈ 2 100 espacements et rayons liés ; ≈ 3 000 couleurs liées ; 24 caractères « ↕ » remplacés par `icon/tri`.

# Annexe H — Points sensibles connus et références pour le contrôle

**H.1 Limite d'outil ayant causé des incidents.** Lier une couleur à une variable remet l'opacité du remplissage ou du trait à 100 %. Les nœuds suivants ont été réparés après coup (valeurs d'origine, d'après leurs jumeaux non modifiés de la page Communautaire) ; ce sont les premiers à contrôler (V3) :

| Élément | Propriété | Valeur attendue |
|---|---|---|
| `Contrôle segmenté — Jour / Semaine / Mois`, `— Type de contenu`, `— Suivi MVP` | remplissage | `#FFFFFF` à 50 % |
| `Contrôle tri — Inactif seul` | remplissage ; trait | blanc à 72 % ; `#C2C4D1` à 75 % |
| `Rappel / Option` | remplissage | `#FBFAF7` à 82 % |
| `Chronomètre — repère relatif — quart / moitié / trois quarts` | remplissage | `color/disabled` à 62 % |
| Petits traits `Chronomètre — repère relatif — intermédiaire` (16 par écran) | opacité du nœud | 40 % dans les variantes visibles |
| Textes `Renforcement du genou · Renforcement`, `Renforcement` | remplissage | `#7A7A80` à 75 % |
| Textes de roulette `Durée heures / N`, `Durée minutes / N`, `Minutes / N`, `Secondes / N` | remplissage | `#1A1A1F` à 20 % ou 45 % selon la rangée |

**H.2 Références de comptage** (à comparer lors de T-0)

- Prototype MVP : 128 écrans plus 3 jeux de variantes ; **410 interactions dont 285 Smart Animate** (19 clics perdus lors de remplacements dans Figma, recréés manuellement par le propriétaire, sans impact sur le développement) ; 12 éléments masqués et 301 à opacité 0, tous dans les 6 conteneurs du retournement (4 écrans et 2 jeux) ou porteurs d'interaction.
- Instances : 4 875 au total, 0 orpheline.
- Page Design system : 82 jeux de variantes (72 `DSF /…`), 66 composants simples.
- Copies locales : l'audit ne retrouve aucun cadre ou groupe nommé `Valeur modifiable` (distinguer « copie », « master » et « instance ») ; 1 `En-tête fixe` + 5 en-têtes d'exécution ; 1 cadre d'icône visible au préfixe strict `icon/`.
- Textes sans style : l'audit mesure 99,0 % de textes stylés ; les 38 textes en police système sont des glyphes d'icône (voir annexe E.7).
- Indicateurs de couverture (mesurés avant la dernière fusion du rouge, à recalculer) : fonds 84,8 %, contours 78,0 %, rayons 75,0 %, gaps 94,6 %, paddings 98,1 %, textes 97,5 %.

**H.3 Dépassements de mise en page automatique préexistants** (à ne pas compter comme régressions) : `Repère récupération` (52, dépasse de 5 px), `Media / Gallery — Source exact` (galeries à défilement horizontal), `Media / Preview — Illustration…`, cadres `Formulaire de l'exercice` et `Contenu du formulaire` (contenu défilant ou derrière une modale), `Selected day routines`.

**H.4 Écarts connus et assumés** : 6 dialogues de décision restent sur l'ancien composant (message long) ; `En-tête fixe — Modification d'une séance` décalé d'1 px ; 4 icônes locales visibles ; couleurs de palette d'étiquettes (`#8FB8FF`, `#8052C7`, `#6E40C7`, `#A60F1F`) et illustration « Squat assisté » laissées locales ; `cards/calendar-day-border` et `cards/archive-border` non fusionnées avec `cards/border` ; les variantes du jeu de retournement masquées (C, D, « Milieu haut ») gardent des repères à opacité 0 (ancres d'animation) ; la barre d'état est un décor.

**H.5 Écrans à contrôler visuellement (V9)** : Ajouter un exercice — Zones corporelles et Appui long — Confirmation suppression ; Catalogue des Exercices — Filtrer — Panneau ouvert ; Composition d'une séance — Placement d'un point d'arrêt (« Circuit », « 3 circuits ») ; Profil — Vue d'ensemble ; Calendrier — Semaine, Mois, Jour ; Catalogue des séances — Liste par défaut ; Catalogue des Exercices — Liste ; Création activité — Avant Paramètres d'exécution ; Création activité — Paramètres en modale — 4, 5, 12 ; Composition séance — Étiquettes ; Composition séance — Étiquettes — Appui long — Confirmation suppression ; Modal — Confirmer la suppression d'une séance archivée ; Exécution d'une séance — Démarrée et Initial ; Exécution d'un exercice — Initial - Cercle avec Texte ; Synthèse de séance — Terminée.
