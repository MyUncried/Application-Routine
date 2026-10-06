# KODJO — Seconde passe de contrôle du DSF

Date des mesures : 5 octobre 2026. Audit en lecture seule.

## 1. Diagnostic et périmètre

**Le DSF est exploitable comme base de travail, mais je déconseille de le figer comme référence intégralement qualifiée avant les corrections et clarifications ci-dessous.** Les collections et les composants ont une intégrité satisfaisante : aucun alias local cassé, aucune instance orpheline. Il reste toutefois un défaut d’opacité démontré sur six repères visibles, un manifeste d’icônes désynchronisé et des contradictions typographiques qui rendent dangereux un alignement global du code par simple correspondance de noms.

Le nombre d’interactions annoncé n’est pas reproduit. Cela ne prouve pas une régression : il manque un état antérieur comparable pour établir quelles interactions auraient disparu. Les pages responsive sont également trop anciennes pour servir de témoin de non-régression des nouveaux écrans.

**Limite d’indépendance :** cette conversation a participé antérieurement à des corrections de composants de cartes. Cette passe repose sur de nouvelles requêtes et des preuves enregistrées, mais ne constitue pas un audit réalisé par une personne n’ayant jamais participé aux corrections. Une validation strictement indépendante reste à confier à un autre intervenant.

Sources :

- [Figma — fichier courant](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg), inspection des 11 pages, avec priorité à Prototype MVP `510:101` et Design system — Fondations `2291:2`.
- [Dépôt à la révision imposée](https://github.com/MyUncried/Application-Routine/tree/6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b), et non une tête de branche supposée identique. Lecture des tokens, du manifeste, des composants ciblés, du chargement des polices et des chapitres 06, 12 et 13.
- Prompt de seconde passe et brief d’alignement du 5 octobre, utilisés comme hypothèses à contrôler.

Aucun composant, token, écran, fichier du dépôt ou document de spécification n’a été modifié. Ce rapport et son dossier de preuves sont les seuls livrables créés.

## 2. Synthèse quantitative

| Domaine | Affirmation de départ | Mesure actuelle | Écart / conclusion |
|---|---:|---:|---|
| Primitives | 350, dont 245 observed | 350 / 245 | Confirmé |
| Sémantiques | 432, dont 281 observed | 432 / 281 | Confirmé ; hors observed : 70 couleurs et 81 nombres |
| Responsive | 4 | 4 | Confirmé ; trois modes 360 / 402 / 440 |
| Styles de texte | 50 | 50 | Confirmé |
| Instances, toutes pages | 4 875 | 4 875 | Confirmé |
| Instances orphelines | 0 | 0 | Confirmé par résolution du composant principal |
| Sets sur DSF | 82, dont 72 DSF /… | 82 / 72 | Confirmé |
| Composants simples sur DSF | 66 | 66 | Confirmé |
| Frames racines Prototype MVP | 128 | 128 | Également 3 sets et 3 composants simples racines |
| Migrations d’instances avec signature conservée | 659 | Non vérifiable rétrospectivement | Absence d’état avant migration |
| Copies locales Valeur modifiable masquées | 12 | 0 frame/group de ce nom ; 3 masters supplémentaires | Affirmation non reproduite ; distinguer copies, masters et instances |
| En-têtes locaux | 1 + 5 | 1 + 5 | Confirmé |
| Cadres locaux d’icônes | 23, dont 19 masqués | 1 frame visible avec préfixe strict icon/ | Définition non équivalente ; ne démontre pas que les autres ont disparu |
| Masqués | 12 | 28 nœuds visible=false ; 18 hors descendants d’instances | Comptage divergent ; les ancres ne sont pas des défauts |
| Opacité de nœud à zéro | 301 | 301 hors descendants d’instances ; 373 avec ceux-ci | 301 confirmé avec ce périmètre |
| Interactions | 429 | 410 réactions / 410 actions | −19, à réconcilier |
| Smart Animate | 290 | 285 actions | −5, à réconcilier |
| Variantes retournements | 12 + 4 | 12 + 4 | Structure présente ; comportement animé non rejoué |

Les 122 destinations distinctes des interactions sont résolubles : aucune destination inexistante détectée. Aucun suffixe « (écran) » n’a été trouvé dans les noms de variantes DSF.

### Couverture mesurée

| Propriété | Départ annoncé | Liées / éligibles | Mesure | Écart indicatif en points |
|---|---:|---:|---:|---:|
| Fonds | ≈85 % | 5 078 / 5 624 | 90,29 % | +5,29 |
| Contours | ≈78 % | 1 175 / 1 232 | 95,37 % | +17,37 |
| Rayons | ≈75 % | 1 096 / 1 172 | 93,52 % | +18,52 |
| Gaps | ≈95 % | 1 307 / 1 350 | 96,81 % | +1,81 |
| Paddings | ≈98 % | 2 466 / 2 554 | 96,55 % | −1,45 |
| Textes avec style | ≈97,5 % | 2 422 / 2 446 | 99,02 % | +1,52 |

**Méthode :** page Prototype MVP ; exclusion des instances et de leurs descendants, des nœuds effectivement invisibles par leurs ancêtres, des illustrations, zones tactiles et barres d’état identifiées par leurs noms. Fonds/contours : peintures SOLID visibles ; ni images, gradients, ni ombres dans le dénominateur. Rayons uniformes ≥6 sur des boîtes ≥20 px ; petits rayons de glyphes exclus. Gaps et paddings : propriétés non nulles, chaque côté compté séparément. Textes : non vides, hors police système SF ; les plages de texte à styles mixtes sont contrôlées par segment.

La palette d’étiquettes n’a pas été isolée systématiquement du dénominateur des peintures. Ces pourcentages constituent donc une couverture technique conservatrice, **pas un score de conformité des seuls éléments à tokeniser**. Les valeurs locales de palette ne sont pas remontées comme défauts. Une autre mesure, incluant les textes locaux masqués et les glyphes SF, retrouve 2 533 textes entièrement stylés sur 2 597, soit 97,54 %. Cela illustre l’effet du périmètre.

Les écarts de pourcentage ne prouvent ni progression ni régression depuis le premier audit : son script et son instantané ne sont pas disponibles. Les anciens taux 7 / 11 / 14 / 8 / 9 / 0 % ne peuvent pas être reconstitués aujourd’hui.

## 3. Tableau des constats

Priorités : P1 à traiter avant qualification globale ou avant l’alignement du domaine concerné ; P2 consolidation ciblée ; P3 entretien ou suivi. Une recommandation n’autorise aucune modification dans le cadre de cette passe.

| ID | Statut | Type | Élément | Nœud(s) ou variable | Constat | Preuve | Cause | Correction recommandée | Priorité |
|---|---|---|---|---|---|---|---|---|---|
| A01 | NON CONFORME | EXCESSIVE_OVERRIDE | Repères de chronomètre | Instances `6452:10039`, `6452:9958` ; masters `6451:10931`, `6451:10930` | Six repères visibles ont un remplissage à 100 %, attendu 62 % comme leurs masters et le témoin prescrit | Lecture des paints et des overrides ; détails §4 | Surcharge locale du remplissage ; origine historique non démontrée | Rétablir seulement les six opacités, conserver autres overrides et ancres | P1 |
| A02 | À CLARIFIER | REGRESSION | Interactions | Page `510:101`, sets `6451:10942`, `6446:10103` | 410/285 au lieu de 429/290 ; régression non prouvée | Parcours de tous les nœuds et comptage réactions/actions | Instantané ou méthode de référence manquant | Diff des interactions avec version datée ; recette des transitions d’exécution | P1 |
| A03 | NON CONFORME | ASSET_NOT_CANONICAL | Manifeste d’icônes | 12 IDs absents, dont `2884:4442`, `2745:4`, `3089:81` | 12 sources Figma sur 25 introuvables, alors que les fichiers SVG existent | Résolution de chaque ID et inventaire du dépôt ; §6 | Manifeste non propagé après remplacements | Mapper vers les sources actuelles, réexporter si nécessaire, vérifier les tracés | P1 |
| A04 | NON CONFORME | FIGMA_CODE_MISMATCH | Dimensions navigation | `2537:103/135`, `2537:109/173`, `2537:114/209` | Six sources existantes ont des dimensions différentes du manifeste | Mesures width/height ; §6 | Sources modifiées sans actualiser le contrat d’asset | Qualifier source et viewBox avant remplacement | P1 |
| A05 | NON CONFORME | ASSET_NOT_CANONICAL | Boutons du stepper | `src/shared/ui/ProfileStepper.tsx`, lignes 176 et 197 | Actions rendues par textes « − » et « + », malgré l’interdiction du manifeste | Lecture du code à la révision imposée | Convention d’icônes non appliquée à tous les composants | Remplacer par actifs canoniques à rendu identique ; conserver libellés accessibles | P1 |
| A06 | PARTIELLEMENT CONFORME | FIGMA_CODE_MISMATCH | Couleurs du code | `VariableID:2290:61`, `VariableID:2290:59` | divider : code #DBE0E8 / Figma #E0E3E8 ; iconNeutral : code #5C636E / Figma #595E66 | Valeurs résolues comparées à tokens.ts | Rationalisation Figma non reportée dans les tokens code | Mettre à jour les correspondances qualifiées et leurs consommateurs | P1 |
| A07 | PARTIELLEMENT CONFORME | FIGMA_CODE_MISMATCH | Polices et interlignes | Styles Texte ; `app/_layout.tsx`, `tokens.ts` | Figma emploie Roboto Condensed ; chargement global du code limité à Inter. Certaines règles d’alignement proposées sont trop générales | Styles, 272 nœuds texte Roboto sur MVP, lecture des déclarations ; §5 | Plusieurs générations de styles et correspondances par nom | Cartographier les rôles, charger les graisses nécessaires, préserver les exceptions explicites | P1 |
| A08 | À CLARIFIER | FIGMA_CODE_MISMATCH | Card title | Texte `5017:6051` ; `type.cardTitle` | Le style DSF 17 px n’a qu’un usage MVP, le timer « 00:00 » ; cela ne justifie pas de passer tous les titres de cartes de 16 à 17 | Recherche des usages ; chapitre 12 distingue cartes récentes et rôle historique | Même intitulé, rôles différents | Corriger la table de correspondance avant migration du code | P1 |
| A09 | À CLARIFIER | LOCAL_STYLE | Glyphes photo et textes locaux | 38 textes SF Pro `photo.badge.plus` ; exemples détaillés dans type-copies.json | Ces 38 textes sont des icônes produit, pas le décor de barre d’état ; 24 autres textes visibles éligibles sont sans style | Inspection police/contenu et segments | Glyphes système mêlés à l’inventaire typographique | Définir le support canonique du symbole photo ; styliser seulement les textes métier concernés | P2 |
| A10 | NON CONFORME | COMPONENT_DUPLICATED | Valeur modifiable | `6944:26411`, `6944:26415`, `6944:26419` ; set `6944:26423` | Trois masters locaux inutilisés et identiques entre eux en plus du set DSF | Signature mesurée, zéro instance sur 11 pages | Restes de création ou migration | Archiver les trois masters après contrôle des références ; ne pas remplacer des instances inexistantes | P2 |
| A11 | À CLARIFIER | VARIANT_MISSING | Tri | Master `5544:4721` ; cadre `4548:6640`, icône `6939:26387` | Master inutilisé 32×32 / icône 16 ; 24 contrôles locaux 34×34 / icône 20 | Géométrie et usages | Composant DSF en retard sur la présentation courante | Canoniser le rendu 34/20 approuvé si confirmé, sans ramener les écrans à 32/16 | P2 |
| A12 | À CLARIFIER | TOKEN_NOT_USED | Tokens sans usage détecté | Ex. `VariableID:6364:10584`, `:6364:10593`, `:6364:10601` | 122 variables sans binding de nœud ni alias entrant détecté, dont 57 hors observed | Analyse des bindings sur 11 pages et graphe d’alias | Réserves, documentation, historique ou propagation incomplète | Classer les usages avant suppression ; aucune suppression automatique | P3 |
| A13 | À CLARIFIER | TOKEN_DUPLICATED | Noms et valeurs proches | `VariableID:3384:4490`, `VariableID:4096:6161` | Deux scrims de noms proches, mais alpha et RGB différents ; 28 groupes de valeurs sémantiques égales par ailleurs | Résolution récursive ; duplicate-values.json | Frontières sémantiques insuffisamment explicites | Documenter les rôles ; ne fusionner que les doublons réellement équivalents | P2 |
| A14 | À CLARIFIER | LAYOUT_NOT_CANONICAL | Contenu débordant | `5050:6047` / enfant `5087:5955` | Un groupe de compte à rebours dépasse à droite de 15 px ; intention non établie | Boîte locale du parent 354×99 et boîtes des enfants | Contrainte ou débordement intentionnel non documenté | Vérifier contexte et témoin avant toute modification de taille | P2 |
| A15 | NON VÉRIFIABLE | REGRESSION | Références visuelles | Pages `2291:3`, `2317:86` ; ex. `2320:107`, `2321:1849`, `2409:257` | Les références montrent des versions antérieures des parcours | Comparaison de 24 captures ; §7 | Témoins non actualisés avec les écrans | Fournir un état approuvé de même version pour qualifier la non-régression | P1 |
| A16 | CONFORME | TOKEN_DUPLICATED | Quatre alias attendus | `2290:61/60`, `2290:59/58`, `3382:53/2290:55`, `5882:4428/2290:56` (VariableID) | Égalité des valeurs résolues ; doublons sémantiques autorisés | Graphe d’alias et valeurs RGBA | Rôles distincts, valeur partagée | Conserver les alias sémantiques | — |
| A17 | CONFORME | DETACHED_INSTANCE | Intégrité des instances | 11 pages, inventaires page-*.json | Aucune des 4 875 instances n’a perdu son composant principal | Résolution des masters | — | Ne pas confondre cette vérification avec une preuve d’absence de détachements historiques | — |

## 4. Opacités, alias et composants

### Défaut démontré A01

Écran `4997:6113` : instance `6452:10039`, enfants `I6452:10039;6451:10042`, `;6451:10043`, `;6451:10044`.

Écran `5021:5994` : instance `6452:9958`, enfants `I6452:9958;6451:9961`, `;6451:9962`, `;6451:9963`.

Sur les six enfants, paint.opacity=1 et node.opacity=1 ; remplissage lié à `VariableID:2290:62`. Les masters portent 0,62. Les overrides des instances mentionnent explicitement `fills`. Les copies communautaires présentent aussi 100 % : **elles ne constituent donc pas ici un témoin intact**. Le constat est une divergence mesurée instance/master, pas une attribution certaine à un appel API particulier.

Deux instances masquées, `6452:10120` et `6452:10201`, portent aussi ce type de surcharge. Elles ne sont pas incluses dans les six repères visibles et doivent rester des ancres d’animation ; ne pas les supprimer. Éviter une réinitialisation complète des instances, qui effacerait d’autres états utiles.

Les contrôles ciblés confirment les autres opacités prescrites : segments blancs 50 %, tri 72 % et 75 %, options Rappel non sélectionnées 82 %, libellés 75 %, roulette 20 % et 45 %, petits traits du chronomètre 40 %. La présence des 12 + 4 variantes est confirmée. L’identité de position et la visibilité des quatre repères sur **tous** les états d’exécution, y compris les transitions animées, n’est pas intégralement certifiée.

### Variables

Les 786 variables locales se résolvent sans alias cassé ni cycle. Les quatre égalités demandées aboutissent respectivement à #E0E3E8, #595E66, #F5F7FA et #F9FAFC. Trois références absentes de l’inventaire local sont des variables distantes valides — Accents/Orange, Grays/White et Grays/Gray — et non des liens cassés. Exemple : le fond Statut terminé `4760:6462` utilise Accents/Orange #FF8D28.

Les nouveaux espacements 10/14/20 et rayons 14/17 portent respectivement des scopes GAP et CORNER_RADIUS cohérents. Le contrôle de compatibilité de **chaque** scope avec **chaque** propriété du fichier n’a pas été exhaustif. Les recherches d’usage couvrent les bindings de nœuds, peintures et effets et les alias entrants ; elles ne garantissent pas l’absence de référence via toutes les propriétés de composants ou tous les styles. « Sans usage détecté » ne signifie donc pas « supprimable ».

### Composants inutilisés et copies

La liste exhaustive des **205 masters DSF sans instance détectée** est fournie dans `unused-components.json` : 168 variantes et 37 composants simples. Elle inclut archives, démonstrations et identité de marque ; ce ne sont pas 205 défauts.

Les 26 composants du lot d’archives `6980:29177` n’ont aucune instance détectée. Cela confirme leur non-utilisation actuelle, pas l’historique des 659 migrations ni la préservation de leur signature passée.

Les trois masters Valeur modifiable supplémentaires mesurent tous 46×24, rayon 10, padding 10/4, Inter SemiBold 13 Auto et texte « 10s ». Leur fond #F4F4F8 diffère aussi du fond #F5F7FA des variantes DSF. Leur non-utilisation permet un nettoyage sans effet visuel attendu, après contrôle des liens.

Les constructions locales retrouvées ne sont pas qualifiées de « composants détachés » sans historique d’origine. Une structure ressemblante ne suffit pas à prouver un détachement.

## 5. Typographie et transmission au code

Le catalogue contient **29 styles KODJO / Texte /**, et non 28. Quatre ont un interligne explicite :

| Style | Interligne | Usages MVP par style scalar |
|---|---:|---:|
| Inter Regular 14 — `S:67215cd16544327587d0a9816eaab38b5d7485d7,` | 18 px | 52 |
| Inter Medium 10 — `S:0c36c17d6d2bb5f960b05a43549a01b728f4d075,` | 16 px | 24 |
| Roboto Condensed SemiBold 16 — `S:1070d9d8f7c56a721e02b315545f92617263dd75,` | 22 px | 24 |
| Inter Regular 12 — `S:659bb321877ab293184d3aa1e11dfc3dfc4c62e4,` | 15 px | 56 |

L’approximation Inter Auto ≈1,21× est une règle du brief, pas une mesure nouvelle des métriques de chaque police et plateforme. L’appliquer aveuglément aux quatre exceptions changerait le rendu.

**Dix des quatorze styles historiques sont toujours utilisés sur MVP, sur 195 nœuds à style scalar.** Les déclarer inutilisés et les supprimer serait incorrect. Exemples : `1992:390` (« HA ») et `1992:392` (« Hermann »), style Section title 16/20. La famille historique comporte aussi Picker action, encore très utilisée.

Le code déclare notamment `body` 14/20 et `timerPrimary` Inter SemiBold 58/64. Figma emploie plusieurs rôles proches, des interlignes Auto et explicites, et Roboto Condensed. La simple égalité de taille ne suffit pas à mapper deux rôles. Le chargement global inspecté dans `app/_layout.tsx` couvre Inter 400/500/600/700 ; il faut qualifier Roboto Condensed avant de reproduire les écrans concernés.

Le chapitre 12 distingue le token historique `type.cardTitle` 16/20 des cartes récentes : titres 15, formats compacts 14. Le style DSF nommé Card title en 17 px n’a qu’un usage dans MVP, un timer « 00:00 ». **Ne pas appliquer le changement global 16→17 proposé dans le brief sur la seule base du nom du style.**

Cette passe compare les déclarations et quelques composants structurants. Elle ne constitue pas une recette visuelle de tous les composants React Native de `src/shared/ui/`, ni une mesure d’interligne sur appareil.

## 6. Icônes : ce qui manque réellement

Au commit contrôlé, `assets/icons/` contient **27 SVG**, pour **25 entrées du manifeste**. Les 25 fichiers annoncés existent. `select-field-chevron.svg` et `label-outline.svg` ne sont pas inscrits dans ce manifeste. Le problème n’est donc pas « les 25 fichiers sont absents », mais leur traçabilité et leur couverture de la conception actuelle.

Sources Figma introuvables :

| Clé du manifeste | ID |
|---|---|
| action.add | 2884:4442 |
| action.start | 2884:4450 |
| control.back | 2884:4426 |
| control.chevronDown | 2884:4419 |
| control.chevronUp | 2884:4417 |
| control.repetitionPullDown | 2745:4 |
| navigation.sessions.active | 2537:95 |
| navigation.sessions.inactive | 2537:127 |
| state.selected | 2537:1509 |
| composition.fixed | 3066:4680 |
| wheel.action.cancel | 3089:81 |
| wheel.action.validate | 3089:83 |

Le total mesuré est **12**, et non 11.

| Sources navigation existantes | Dimensions Figma | Dimensions manifeste |
|---|---:|---:|
| Calendrier actif/inactif | 24×24 | 26×26 |
| Suivi actif/inactif | 24×19,3846 | 26×21 |
| Profil actif/inactif | 21,5172×24 | 26×29 |

L’inventaire courant comprend 13 composants nommés `icon/*`, dont les sources récentes : tri `6939:26387` (20×20), suivant `6959:15460`, précédent `6959:15579`, ajouter `6959:15706`, fermer `6959:15825`, retour `6959:15940` (24×24). Les tracés sont présents dans Figma ; les épaisseurs contrôlées sont 2, sauf fermer à 2,2. **L’identité géométrique exhaustive entre chaque SVG du dépôt et chaque tracé Figma actuel n’est pas certifiée par cette passe** : elle exige un rapprochement après remapping des sources supprimées.

Les symboles des cartes et catégories doivent aussi figurer dans le rapprochement de couverture ; l’existence de 25 exports historiques ne prouve pas que tous les symboles visibles aujourd’hui sont exportés. Les 38 glyphes SF `photo.badge.plus` restent à qualifier comme symboles système ou actifs portables. Aucun nouveau dessin n’est nécessaire pour traiter les défauts établis : partir des sources approuvées existantes.

## 7. Mise en page et contrôle visuel

**24 captures** sont jointes : 17 vues courantes et 7 références. Quatre planches contact facilitent leur consultation. L’échantillon couvre les familles demandées : profil, semaine/mois/jour, catalogue, création avant paramètres, paramètres en modale, étiquettes et confirmation, suppression d’une séance archivée, exécution séance et exercice.

| Famille | Références examinées | Résultat de la comparaison |
|---|---|---|
| Catalogue | `2320:107` | Ancienne organisation et ancienne navigation ; pas de témoin de même version |
| Calendrier semaine/mois | `2321:477`, `2321:907` | Références disponibles mais antérieures ; Jour sans équivalent qualifié |
| Exécution | `2321:1849` | Ancien layout ; ne qualifie pas les nouveaux états ni les animations |
| Suppression | `2321:2155` | Ancienne présentation ; les exceptions de dialogues longs sont conservées |
| Création | `2346:166` | Paramètres anciennement intégrés ; non équivalent aux nouvelles modales |
| Profil | `2409:257` | Ancien contenu de préférences, différent de la nouvelle organisation |
| Étiquettes et nouvelles modales | Aucun équivalent de même version établi | Non-régression historique NON VÉRIFIABLE |

L’inspection visuelle des captures courantes ne révèle pas d’autre défaut manifeste de découpe à cette échelle, en dehors des points à examiner et des exceptions connues. Elle ne certifie ni l’accessibilité, ni le rendu réel de l’application, ni toutes les largeurs responsive.

Le détecteur géométrique remonte **228 conteneurs** auto-layout avec dépassement d’enfant de plus de 1 px dans son périmètre. C’est un inventaire brut, **pas 228 défauts** : scrolls, galeries, overlays et débordements assumés y contribuent. Les familles préexistantes citées dans le prompt ne sont pas remontées comme régressions. A14 est un exemple restant à qualifier, pas une injonction à agrandir tous les parents.

Les six dialogues anciens, le décalage d’en-tête de 1 px, les icônes locales admises, la palette utilisateur, l’illustration Squat assisté, les bordures de cartes conservées séparées, le décor de statut et les ancres d’animation ne sont pas présentés comme de nouveaux défauts.

## 8. Causes racines principales

1. **Propagation partielle après remplacement de sources** : manifeste et certains composants DSF n’ont pas suivi les écrans.
2. **Surcharges locales conservées sur les instances** : elles peuvent neutraliser une correction du master, notamment l’opacité.
3. **Noms de styles employés comme équivalences de rôles** : « Card title » illustre un mapping trompeur.
4. **Coexistence de générations typographiques** : styles historiques encore consommés, styles récents, exceptions d’interligne et deuxième police.
5. **Mesures sans protocole versionné commun** : masqués, interactions et couverture ne peuvent pas être comparés sans définition identique.
6. **Témoins visuels anciens ou dépendants des mêmes composants** : ils ne prouvent pas une non-régression actuelle.
7. **Absence de classement explicite des réserves et archives** : unused n’équivaut pas à inutile.
8. **Contrat d’icônes appliqué incomplètement au code** : glyphes de stepper et symboles photo hors chaîne canonique d’assets.

## 9. Plan de remédiation proposé — sans refonte

| Ordre | Lot | Action / critère de clôture | Risque visuel |
|---:|---|---|---|
| 1 | A01 | Corriger les six opacités de repères seulement ; comparer les deux écrans et rejouer les retournements | Faible et intentionnel ; élevé si reset global des overrides |
| 2 | A02, A15 | Récupérer un instantané daté, réconcilier les interactions et constituer des témoins approuvés de même version | Aucun pour l’investigation ; ne pas reconstruire les écrans anciens |
| 3 | A03–A05, A09 | Faire le mapping sources→exports→manifest→consommateurs ; vérifier tracés, tailles et symboles ; remplacer les glyphes interdits | Modéré si viewBox, épaisseur ou alignement changent ; conserver le dessin existant |
| 4 | A06–A08 | Établir une table de rôles typographiques et couleurs ; résoudre Card title, exceptions Auto et polices avant modification du code | Élevé pour un remplacement global ; faible par migration ciblée avec captures |
| 5 | A10–A11 | Archiver les trois masters inutilisés ; aligner le contrôle Tri sur le rendu approuvé | Aucun pour masters réellement inutilisés ; modéré pour une migration de Tri |
| 6 | A12–A14 | Classer tokens/components inutilisés, documenter les scrims et qualifier les débordements | Aucun sans mutation ; élevé en cas de suppression ou normalisation automatique |
| 7 | Qualification | Rejouer les mesures avec le même script, documenter les exceptions et capturer les états critiques sur Figma puis dans l’application | Aucun pour les mesures ; recette nécessaire avant gel |

## 10. Points À CLARIFIER et limites explicites

- Quelle version et quel dénominateur produisaient 429 interactions et 290 Smart Animate ? Les chiffres actuels sont établis ; leur cause historique ne l’est pas.
- Quel état approuvé de même version doit servir de référence visuelle ? Les pages responsive examinées sont antérieures.
- Le rôle historique cardTitle doit être distingué des cartes récentes et du timer actuellement relié au style DSF 17 px.
- Les deux scrims ont-ils des contextes distincts ? Leur différence de nom ne suffit pas à établir une fusion.
- Les symboles photo SF relèvent-ils d’un composant système explicitement autorisé ou d’un export vectoriel commun ? Ne pas les assimiler à la barre d’état.
- Le Tri 34/20 et certains débordements locaux doivent être qualifiés à partir du rendu déjà approuvé, sans nouveau design.

Contrôles non intégralement vérifiables ou non réalisés : historique des 659 remplacements et des suppressions annoncées ; signature avant/après ; scopes de chaque binding ; tous les tracés SVG face aux sources courantes ; comportement des animations ; uniformité des quatre repères dans chaque état d’exécution ; recette exhaustive des composants code et sur appareil. Les preuves positives de ce rapport ne doivent pas être étendues à ces domaines.

## 11. Décision recommandée

**Ne pas figer aujourd’hui le DSF comme référence intégralement qualifiée.** Corriger A01, remettre en cohérence les sources d’assets A03–A05, puis résoudre les correspondances A06–A08 avant l’alignement global du code. Réconcilier A02 et obtenir les témoins A15 avant d’affirmer l’absence de régression.

Le développement peut préparer le mapping et avancer sur les composants déjà qualifiés. A10–A14 peuvent être traités par lots ciblés ; ils ne justifient aucune refonte ni une tokenisation exhaustive de valeurs locales légitimes.

## 12. Dossier de preuves

L’archive jointe contient les inventaires JSON, les copies de fichiers du dépôt à la révision imposée, les 24 captures PNG et les quatre planches contact. Fichiers principaux :

- `inventory.json`, `vars*.json`, `analysis.json`, `duplicate-values.json` : collections, alias, usages.
- `page-*.json`, `unused-components.json`, `archives.json` : inventaires et intégrité des composants.
- `coverage-final.json`, `scan-coverage-final.js` : mesure de couverture retenue.
- `opacity-*.json`, `controls.json`, `type-copies.json`, `style-samples.json` : opacités, typographie, contrôles.
- `icons.json`, `navigation-check.json`, `layout.json` : assets, destinations, dépassements.
- `code/`, `code-tree.json` : sources épinglées.
- `captures/`, `contact-*.png` : comparaison visuelle.

Les mesures exploratoires `coverage.json`, `summary.json` et `details.json` emploient parfois des périmètres plus larges ou comptent imparfaitement les styles mixtes. Elles sont conservées pour traçabilité, **mais ne remplacent pas les mesures finales et définitions de ce rapport**. Les comptes de bindings ne sont pas des nombres de nœuds uniques.
