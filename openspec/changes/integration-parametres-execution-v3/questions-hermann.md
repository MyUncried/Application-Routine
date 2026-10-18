# Questions pour Hermann — intégration de la spécification v3.0 (18/10/2026)

La spécification déclare ses arbitrages clos. Les points ci-dessous ne sont pas tranchés par son texte ni par une règle existante ; la documentation énonce ce qui est décidé et renvoie ici, sans inventer de règle. Aucun ne bloque la relecture de l’intégration.

## Questions ouvertes

| ID | Sujet | Constat | Ce que dit la documentation aujourd’hui | Emplacements |
|---|---|---|---|---|
| Q-V3-01 | Charge dans la phrase de synthèse | CH-08 laisse « à intégrer » la place du groupe « avec une charge de 10 kg » dans la grammaire v15, ainsi que sa forme en séries variables (énumération, compaction au-delà de trois valeurs, séries à zéro) | Mention incluse si la charge est active, associée à chaque série, segments en gras, non persistée ; place et forme variables non fixées | RM-240 ; CE-UI-10 « Rendu et accessibilité de la phrase » |
| Q-V3-02 | Phrase des côtés | Les formes neutres « en faisant le côté 1 puis le côté 2 », « en alternant le côté 1 puis le côté 2 à chaque série », « en faisant d’abord toutes les séries du côté 1, puis du côté 2 » remplacent des textes du corpus v15 (276 cas) | Formes neutres appliquées (D-407) ; le corpus de recette n’est pas réécrit | ch. 10 « Phrase de synthèse — Côtés et durée » |
| Q-V3-03 | Condition d’arrêt à la création | Aucune valeur initiale n’est donnée (la frame 9289:17849 montre À la cible, à titre d’exemple) | Aucune sélection initiale écrite | RM-248 ; CE-UI-10 « Règles communes » |
| Q-V3-04 | Changement de côté à une seule série | La frame 8328:39072 montre Avec désactivé à N = 1 ; aucune règle existante n’interdit le changement de côté à N = 1 (seul l’Enchainement est grisé, D-250). CO-01 demande de confronter avant de généraliser | Règle existante conservée ; état Figma signalé, non généralisé | RM-242 ; ch. 06 capture 8328:39072 |
| Q-V3-05 | Réglage des cellules du tableau variable | D-413 retire le pied commun ± et les steppers de cellules ; seule la roulette d’une cellule Durée est décrite (RM-250). Le contrôle d’une cellule Pause ou Répétitions n’est pas spécifié | Aucun contrôle inventé | CE-UI-10 rubrique 9 ; ch. 08 éléments affichés ; ch. 10 conventions v13 |
| Q-V3-06 | Roulette Répétitions en séries identiques | RO-01 ne vise que la durée ; AR-01 demande de ne pas définir la condition à deux endroits. La roulette Répétitions garde « Aucune répétition, à l’échec » en tête (décision PRE-4 Q8, D-385) | Option conservée ; D-412 renvoie ici | D-412 ; CE-UI-10 « Sélecteur de cible » ; ch. 06 et 08 |
| Q-V3-07 | Ligne de durée en séries identiques à l’échec | RO-01 : « l’accès au champ de durée suit l’applicabilité déjà définie », mais aucune n’est définie pour l’état À l’échec commun (ligne masquée, « — », ou cadre informatif « à l’échec » du ch. 10) | Non précisé | RM-248, RM-250 ; ch. 10 « Exercice — Règles fonctionnelles » |
| Q-V3-08 | Cadence : Sans puis Autre | Rien n’indique si Autre restaure une valeur personnalisée antérieure après Sans, ni comment s’affiche la valeur personnalisée (CA-01 renvoie au contrôle existant ou à Figma) | Valeur 0 = Sans ; Autre utilise le stepper existant 0..10, pas 1 s | RM-245 |
| Q-V3-09 | Notation d’Enchainement dans Figma | La notation conservée (PR-05, §9.3) affiche « (D1 → D2) → (G1 → G2) », avec les lettres D et G, alors que CO-01 retire toute désignation anatomique | Notation Figma conservée, sans nouvelle notation | RM-243 ; ch. 06 capture 8328:38193 |
| Q-V3-10 | Tokens de la feuille | PR-03 et GR-01 demandent de relever les valeurs dans Figma avant de publier le DSF. Plusieurs tokens du ch. 12 décrivent l’ancienne présentation : `color.parametersSegmentedBorder`, `color.parametersSegmentedOption`, `color.variableSeriesGroupSurface`, `color.selectionSubtitle`, `type.segmentedCompactLabel`, `type.segmentedLabel` (tailles 13 et 14/11 des popovers) | Tokens inchangés (aucune valeur relevée) ; blocs du 18/10 des DSF : « valeurs à relever » | ch. 12, design tokens ; DSF |
| Q-V3-11 | Historique des côtés | Les valeurs historiques `RIGHT` / `LEFT` des résultats correspondent à côté 1 ou côté 2 selon le sens historique (`RIGHT_LEFT` ou `LEFT_RIGHT`) ; RM-244 exige seulement qu’elles restent lisibles | Lisibilité exigée, correspondance non fixée | RM-244 ; ch. 09 |
| Q-V3-12 | Carte Paramètres du formulaire | CE-T03-04 affiche Compte à rebours et Fin sous la phrase de la carte parent ; DU-01 vise la feuille. Ces lignes de la carte restent-elles toujours visibles ? | Non modifié | CE-T03-04 ; ch. 08 « Implantation des contrôles » |
| Q-V3-13 | Texte « Durée totale : » de la phrase | DU-01 renomme la ligne de la feuille ; la phrase de synthèse affiche encore « Durée totale : {total}. » (corpus v15, capture 8328:37022) | Texte de la phrase inchangé | ch. 10 « Phrase — Côtés et durée » ; PRODUCT |
| Q-V3-14 | Contrôles segmentés au lieu des popovers | GR-01, PR-03 et le scénario « Mode d’exécution (sélection segmentée) » décrivent des contrôles segmentés ; D-413 l’écrit et nomme D-377 comme remplacée pour Mode, Type de série et Changement de côté. Lecture à confirmer | D-413 appliquée | D-413 ; CE-UI-10 |
| Q-V3-15 | Version de livraison | La spécification ne dit pas dans quelle version du produit (ch. 05) ces évolutions sont livrées ; B-092 est rangé parmi les « besoins validés pour les évolutions » | Aucune version attribuée | ch. 02, ch. 05 |
| Q-V3-16 | Formats imposés | CE-FMT-04 : avec les constantes Tabata (Durée, 8, 20 s, 10 s), la Condition d’arrêt est-elle une valeur imposée grisée (À la cible) ou masquée ? | Non modifié au-delà du renvoi à D-413 | CE-FMT-04 |
| Q-V3-17 | Phases (PR #370) | #370 rend les phases incompatibles avec une cible À l’échec ; RO-01 demande de ne pas retirer l’option À l’échec de la roulette d’une phase. #370 décrit aussi « Aucune » sans chevron et un tableau avec son pied ; CV-01 et D-413 demandent Avec / Sans, chevron intérieur, sans pied | Points phases décidés au registre (D-410, D-412, D-413), à appliquer par le chantier #370 | [dependances-pr.md](dependances-pr.md) |
| Q-V3-18 | Terminologie résiduelle | « Direction effective » (glossaire, ch. 04), « bilatéralité par miroir » (cartes), le mot « popover » de la règle d’Annuler (décision PRE-4 Q29), « charge additionnelle » des formats (ch. 10, Progression : exclusion propre aux formats ou levée par D-403 ?) | Termes conservés | ch. 01, 04, 10, 12 |

## Points tranchés sans nouvelle décision

| Point soulevé pendant l’intégration | Réponse | Fondement |
|---|---|---|
| Les noms des quatre cadres sont-ils des titres visibles ? | Non : les frames n’en montrent aucun | Figma, référence de layout (9289:17849 et suivantes) |
| Libellé de la ligne du nombre de séries | « Nombre de séries » | PR-01, D-413 |
| Croix de retrait par ligne du tableau variable | Conservée | Visible dans toutes les frames ; PR-02 ne retire que les lignes de boutons +/− |
| Pas de l’option Autre de la cadence | Pas de 1 s, sans accélération | D-312, RM-245 (aucun nouveau pas) |
| Charges par série d’un tableau variable caché après ✓ en séries identiques | Non persistées, comme les autres valeurs variables cachées | CH-04 (règles communes) et D-249 ; l’exception de D-403 vise les valeurs désactivées par Sans |
| Charge négative à la migration | Sans objet : aucune donnée de charge antérieure n’existe | RM-236 (absence = Sans) |
| « Durée totale » des formats (CE-FMT-02, FMT-15) | Hors DU-01, qui vise la feuille des paramètres d’un Exercice | DU-01 |
| Copies figées PRE-4 / PRE-5 | Non modifiées ; elles sont hors de ce dépôt | Interdits du chantier |

## Écarts Figma relevés (lecture seule, Figma non modifié)

| Frame | Écart | Référence |
|---|---|---|
| Toutes les modales de paramètres | « A la cible » sans accent | AR-01 |
| `8470:13303` | Texte « A la cible età l’échec » au lieu de « À la cible et à l’échec » | AR-01, §9.3 |
| `9292:18077` | Clavier sans séparateur décimal ; cellule en surbrillance = Durée de la série 1, pas une cellule Charge | CH-05, PR-04, §4 écart 1 |
| `9232:44646` | Nom de phase (« Durée d’une phase ») sur une roulette ouverte depuis une cellule de séries variables (phases à Sans) | RO-01 |
| `8328:37092` | Valider actif alors qu’une cible manque | D-337 |
| `8328:39072` | Avec désactivé à une seule série | Q-V3-04 |
| 16 frames d’exécution | « Côté droit » affiché (calque « Côté courant — Côté droit ») | CO-01, D-407 |
| — | Aucune frame d’exécution avec charge ; aucun état de saisie de la charge en séries identiques | §4 écarts 2 et 4 |
| `9207:18817` | Nom hors convention (« Proposition 3 ») et barre bleue résiduelle | #370 |
| Calques de toutes les modales | Noms hérités (« Ligne — Cible », segments Avec/Sans nommés « D → G » / « Aucun », « Segmenté — Bip de cadence », « Valeur — Durée totale ») | Sans effet sur le rendu |
