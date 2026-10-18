# Extraction PRE-4 BMAD — ED-05 à ED-12 (deux modes, cible typée, sélecteur, transitions, bornes, tableau variable, brouillons, variations de N, régime)

Établi le 2026-10-16, en lecture seule, pour la rédaction du PRD BMad de PRE-4. Document de travail : il n'est pas une exigence et ne résout aucune question par déduction.

## 0. Conventions

### 0.1 Abréviations de sources

Les sources normatives sont les copies `caa2a5cf` sous `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/` :

| Abréviation | Fichier |
|---|---|
| [01] | `Specifications-fonctionnelles/01 – Vision Générale.md` (glossaire) |
| [04] | `Specifications-fonctionnelles/04 – Modèle fonctionnel.md` |
| [06] | `Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` |
| [07] | `Specifications-fonctionnelles/07 – Registre des décisions de conception.md` |
| [08] | `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` |
| [09] | `Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md` |
| [10] | `Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md` |
| [11] | `Specifications-fonctionnelles/11 – API fonctionnelles.md` |
| [12] | `Specifications-fonctionnelles/12 – Architecture technique.md` |
| [13] | `Specifications-fonctionnelles/13 – Contrats d'écran.md` (seulement l. 1-4345 ; **l. 4346-5996 non lues**, Q7) |
| [DSF2M] | `DSF-DEUX-MODES-ECHEC-2026-10-13.md` |
| [DSFCIR] | `DSF-CIRCUITS-CONTROLES-2026-10-12.md` (contrôles de l'éditeur seulement) |
| [DSFGEN] | `DSF-INTERFACE-GENERALE-2026-10-08.md` |
| [MAT2M] | `MATRICE-DEUX-MODES-ECHEC-2026-10-13.md` |

Sources de la base `c32e360d`, en traçabilité (cas « Base » de `sources-retenues.md` §5) :

| Abréviation | Fichier |
|---|---|
| [B-2M] | `docs/Specifications-fonctionnelles/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md` |
| [B-v13] | `docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md` |
| [HIST] | `docs/archives/deux-modes-echec-2026-10-13/KODJO_Prompt_Deux-modes-et-echec_2026-10-13_complet.md` (consigne du 13/10, **non normative**) |
| [PER] | `docs/preparation/PRE-4/perimetre-et-couverture.md` (périmètre ED) |
| [QO] | `docs/preparation/PRE-4/bmad/questions-ouvertes.md` |
| [SR] | `docs/preparation/PRE-4/bmad/sources-retenues.md` |

Figma : [FIG] `nœud` désigne une capture PNG de `caa2a5cf` (`…/images/echec-2026-10-13/` ou `…/images/circuits-2026-10-12/`), ou un texte relevé dans les arbres figés `docs/preparation/PRE-4/figma/*.json.gz`. Figma fournit le visuel, jamais une règle (D-255, [07]:378).

Décision de Hermann du 2026-10-16 transmise dans la consigne de mission : [D-H Q8], « en mode Répétitions, le sélecteur de cible est une roulette native à une colonne, avec l'option échec en tête, puis 1..100, selon la même logique que Durée ». `questions-ouvertes.md` la porte encore comme ouverte, à mettre à jour.

### 0.2 Statuts

- **N** : normatif dans `caa2a5cf`.
- **N-B** : normatif repris de la base, parce que la consolidation l'a perdu (§5 de [SR]).
- **D-H** : décision de Hermann du 2026-10-16.
- **Ex** : exemple non normatif. Les chiffres ne sont pas des règles.
- **V** : visuel ou géométrie (Figma, DSF). Fait foi pour le layout seulement.
- **H** : historique, non normatif.

Chaque règle porte un identifiant local `EDxx-Rnn`, propre à ce document.

---

## ED-05 — Deux modes seulement

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED05-R01 | Un Exercice a un seul mode : `Durée` ou `Répétitions`. « À l'échec » n'est ni un troisième mode, ni une cible manquante. C'est une nature de cible de Série, disponible dans les deux modes. | [10]:61 (RM-033) ; [10]:193 (RM-111 absorbée) ; [01]:320 ; [09]:607 ; [06]:2206 ; [07]:604 ; [B-2M]:15 (EC-01) | N | Δ3 de [SR] retenu |
| ED05-R02 | Le popover du champ `Mode d'exécution` propose exactement deux options, dans l'ordre `Durée` puis `Répétitions`. Le popover est identique en séries identiques et variables. | [13]:4073 ; [13]:3015 (« Deux modes seulement ») ; [DSF2M]:7 ; [06]:223 ; [08]:196 ; ordre visuel [FIG] 8328:37092, 8328:38513 | N (ordre : V) | L'ordre n'est donné que par l'énumération « Durée/Répétitions » et par Figma |
| ED05-R03 | Popover de mode : référence locale 184×99, hauteur automatique (anciennement 136). Shell, ancrage, voile et brouillon existants sont conservés. | [DSF2M]:7 ; [13]:2995 ; [MAT2M]:17 (E09) | V | |
| ED05-R04 | À la création, le mode n'est pas renseigné (affichage `—`), la phrase est vide et `Terminer` est désactivé. Après une première sélection, le mode ne peut plus revenir à l'état vide. | [13]:4085 ; [08]:1557 ; [08]:1808 ; [08]:1567 ; [08]:1595 | N | |
| ED05-R05 | Après un choix de mode, la valeur s'applique immédiatement et reste visible, puis le sélecteur se referme progressivement. Avec « Réduire les animations » d'iOS, il se ferme sans animation. | [07]:550 (D-339) | N | |
| ED05-R06 | Les options du sélecteur de mode sont en Regular, plus petites, centrées horizontalement et verticalement, sans débordement. Les titres des lignes ne changent pas. | [07]:552 (D-341) | N sur le principe | Valeurs exactes « non encore validées » (D-341) |
| ED05-R07 | Changer de mode ne sauvegarde rien. Seul ✓ applique au parent, et seul `Terminer` persiste. | [13]:3037 ; [13]:2967 | N | Voir ED-11 |
| ED05-R08 | Le Bip de cadence existe dans les deux modes (0..10, 0 = `Aucun`). Il est conservé quand on change de mode, même après ✓. | [13]:4080 ; [13]:3019 ; [13]:3033 ; [07]:481 (D-308) ; [B-v13]:139 | N | |
| ED05-R09 | Validation, édition, copie et instantané transportent le mode commun (`DURATION`/`REPETITIONS`) et la cible typée de chaque Série. `TO_FAILURE` est un format historique, lu puis migré. | [11]:267 ; [11]:405 ; [09]:607 ; [12]:1359 ; [10]:144 (RM-127) | N | La migration relève d'ED-18 |
| ED05-R10 | La phrase ne répète pas le mode. Le champ Mode reste distinct de la phrase intrinsèque. | [08]:1595 ; [13]:570 ; [13]:636 | N | |
| ED05-R11 | Aucun interrupteur et aucune ligne métier ne s'ajoutent pour l'échec. Aucun écran uniforme « Série à l'échec » n'est créé : un simple changement de valeur ne crée pas de contrat. | [B-2M]:147 ; [DSF2M]:49 ; [13]:3009 ; [MAT2M]:22 (E14) ; [HIST]:79 | N (+H) | |
| ED05-R12 | Ne pas remplacer globalement le texte « À l'échec » : le libellé reste valide pour une cible, pas pour un mode. | [B-2M]:191 | N-B | |
| ED05-R13 | Les cartes Catalogue d'un exercice dont toutes les cibles sont à l'échec gardent leur formulation (`3 séries à l'échec`). | [13]:556 ; [13]:4170 ; [08]:1814 ; [HIST]:154 | N | Consommateur, affichage seulement |
| ED05-R14 | Le mode reste identifiable même quand toutes les cibles d'un exercice sont à l'échec (cartes, grille). | [B-2M]:157 ; [06]:842 ; [13]:4130 | N | Grille Volumes hors périmètre (Composition) |

## ED-06 — Cible typée par Série

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED06-R01 | Chaque Série effective a une cible de l'un de trois états distincts : **chiffrée** (secondes en Durée, entier de répétitions en Répétitions), **À l'échec** (aucun nombre prescrit, fin décidée par l'utilisateur), ou **incomplète/invalide** (erreur de saisie, jamais convertie implicitement en échec). | [09]:1240-1244 ; [B-2M]:30-34 ; [10]:739 (R14) | N | |
| ED06-R02 | La représentation distingue explicitement « chiffrée » et « échec ». Ni `0`, ni une chaîne dans un champ numérique, ni un `null` ambigu ne portent seuls cette distinction. | [09]:1246 | N | Les noms physiques relèvent de la solution technique |
| ED06-R03 | Une Série ne peut pas porter à la fois une valeur numérique et l'échec. Zéro n'est jamais une cible. | [09]:1196 ; [13]:4104 | N | |
| ED06-R04 | En séries identiques, toutes les Séries ont la même cible, y compris l'échec. | [09]:1248 ; [B-2M]:38 | N | |
| ED06-R05 | En séries variables, la collection ordonnée des N couples cible/Pause est la seule source de vérité. Elle peut mélanger cibles chiffrées et échec, dans un ordre conservé. Il n'existe aucune combinaison « valeur commune + surcharge ». | [09]:1248 ; [08]:247 ; [07]:370 (D-247) | N | |
| ED06-R06 | Des cibles momentanément égales ne changent pas le régime. | [09]:1248 ; [09]:445 ; [13]:4145 ; [13]:4181-4185 | N | Lien ED-04 |
| ED06-R07 | En bilatéral, N désigne N Séries **par côté**. Les deux côtés ont les mêmes prescriptions et des résultats distincts. | [08]:238 ; [09]:1250 ; [09]:1140 | N | |
| ED06-R08 | Une cible À l'échec explicitement sélectionnée est valide sans nombre et ne bloque pas ✓. | [13]:3027 ; [10]:654 ; [08]:536 | N | |
| ED06-R09 | Une cible invalide est une erreur de validation, pas un résultat `omitted`. Elle bloque ✓ sans inventer de montant. | [13]:2979 ; [10]:654 ; [10]:613 ; [B-2M]:100 | N | |
| ED06-R10 | En Répétitions sans bip, la ligne Durée totale reste absente même si une cible est incomplète. L'erreur reste portée par la cible et interdit ✓. | [10]:654 | N | Croisement avec ED-13 |
| ED06-R11 | La cible typée appartient à chaque Série effective et à chaque copie ou instantané. Le mode appartient à l'Exercice. | [09]:1196 ; [11]:405 ; [13]:31 | N | Croisement avec ED-19 |
| ED06-R12 | Dans le tableau variable, une cellule échec affiche `à l'échec`. L'en-tête de colonne reste celui du mode (`Durée` en mode Durée). La ligne garde ses deux colonnes cible/Pause, même quand toutes les cibles sont à l'échec. | [DSF2M]:45 ; [13]:2995 ; [MAT2M]:20 (E12) ; [FIG] 8328:38848, 8470:13303 ; [HIST]:95-97 | N (+V) | |
| ED06-R13 | Une cible À l'échec n'est pas un nombre modifiable : ce n'est pas une valeur ± dans une cellule. | [DSFCIR]:41 ; [13]:4076 (« cible textuelle sélectionnable, sans nombre prescrit ») | N | Comment une cellule variable passe à l'échec : voir C-03 |
| ED06-R14 | Les cibles d'intensité (charge, RPE…) sont hors périmètre. | [08]:247 | N | |
| ED06-R15 | La valeur relevée après exécution est distincte de la prescription. | [09]:1196 ; [B-2M]:106 | N | Relevés hors périmètre ([PER]:46) |

## ED-07 — Sélecteur de cible

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED07-R01 | **Mode Durée.** Le sélecteur de cible montre, de haut en bas, une option échec centrée, un filet, puis la roulette numérique, dans la même surface. La roulette du total n'en fait pas partie. | [HIST]:119 ; [DSF2M]:13-19 ; [13]:2995 ; [B-2M]:234 | N (+H) | |
| ED07-R02 | Géométrie de référence : popover hôte 354×249 en hauteur automatique (anciennement 216). Maître `8452:13297` de 330×181. Option échec 330×30 à y0, texte centré, Inter Regular 20, marge verticale 3. Séparateur 330×1 à y30, de la couleur des séparateurs de popover. Roulette numérique 330×150 à y31, de structure inchangée. | [DSF2M]:13-19 ; [13]:2995 ; [MAT2M]:18 (E10) | V | Tactile : cible indépendante des 30 px dessinés ([DSF2M]:53) |
| ED07-R03 | Libellé de l'option échec selon le mode : **« Aucune durée, à l'échec »** en Durée, **« Aucune répétition, à l'échec »** en Répétitions. Il ne se réduit pas à « À l'échec ». | [13]:3015 ; [DSF2M]:21 ; [HIST]:42 ; [HIST]:119 ; [FIG] 8328:37862 (variante Durée seulement) | N | Contredit l'état de Q10 : voir C-07 |
| ED07-R04 | L'option échec est en tête, avant la plus petite valeur numérique. | [B-2M]:147 ; [B-2M]:19 (EC-05) ; [DSF2M]:21 ; [HIST]:20 | N | |
| ED07-R05 | Le sélecteur s'ouvre toujours sur l'état courant du champ, jamais sur une position neutre. Cible numérique : roulette active sur la valeur courante, libellé échec à 45 %. Cible échec : libellé actif, bloc numérique grisé à 45 % et affiché `00:00`. | [13]:3015 ; [13]:4104 ; [DSF2M]:21 ; [DSF2M]:33 ; [HIST]:123-128 | N | |
| ED07-R06 | À tout instant, exactement une cible est sélectionnée. Valeur numérique et échec s'excluent. | [13]:3015 ; [13]:4104 ; [DSF2M]:21 ; [DSF2M]:33 ; [HIST]:121 | N | |
| ED07-R07 | Aucune coche dans la liste. | [13]:3015 ; [DSF2M]:21 ; [HIST]:121 | N | |
| ED07-R08 | Le bouton de validation de la surface du sélecteur applique le choix au brouillon de la feuille Paramètres. ✕ annule selon le brouillon existant. | [13]:3015 ; [DSF2M]:21 ; [DSF2M]:33 ; [HIST]:119 ; [PER]:25 | N | Une validation propre à la roulette existe-t-elle ? Voir C-01 |
| ED07-R09 | Roulette Durée : deux colonnes, minutes et secondes. Secondes par pas de 5. Valeurs de 00:05 à 58:55. | [08]:1558 ; [13]:4093 ; [13]:4106 ; [DSF2M]:37 | N | Colonne des minutes 00..58 ; Figma montre 59 (C-09) |
| ED07-R10 | **Mode Répétitions.** Roulette native à une colonne : option échec en tête, puis les entiers 1 à 100, selon la même logique que Durée (ouverture sur la valeur courante, exactement une sélection, pas de coche, validation et annulation). | [D-H Q8] ; faisabilité [HIST]:171-173 ; « même logique » : [13]:3015 | D-H | Remplace pour la cible le stepper inline de [13]:125, [06]:186, [06]:2199, [07]:294 (D-219), [08]:1559 et [08]:1573. Interprétation à préciser : C-11 |
| ED07-R11 | Utiliser la primitive native (Picker en roue). Ne pas bloquer ses gestes par une désactivation native : la transition prescrite deviendrait impossible. | [DSF2M]:35 ; [MAT2M]:48 (R02) ; [HIST]:165 (point ouvert historique) ; AGENTS.md (primitives natives) | N | |
| ED07-R12 | Chaque changement effectif de valeur d'une roulette numérique déclenche un retour haptique léger et bref, une fois par cran, indépendamment de la préférence `Vibrations` du Profil. | [08]:1569 | N | S'applique aux deux roulettes de cible, par extension de « roulettes numériques » |
| ED07-R13 | La roulette Durée totale reste `5544:5118` (330×150, popover 354×216), sans option échec. Elle n'est pas remplacée par la roulette de cible. | [DSF2M]:41 ; [13]:2995 ; [MAT2M]:41 ; [HIST]:61 | N/V | |
| ED07-R14 | Accessibilité : l'option échec est annoncée sélectionnée ou non sélectionnée. Le gris n'est jamais le seul indicateur. Focus modal contenu, texte agrandi, cibles de 44 minimum, alternatives aux gestes. | [13]:3047 ; [DSF2M]:53 | N | |
| ED07-R15 | En séries identiques, la cible se règle sur la ligne `Durée d'une série` (Durée). Le libellé de la ligne équivalente en Répétitions n'est pas fixé. | [FIG] 8328:37760, 8328:37862 ; [08]:1559 (« Nombre de répétitions ») | V | Libellé Répétitions à arbitrer (C-19) |
| ED07-R16 | Un seul popover ou une seule roulette ouverts à la fois. | [13]:4085 ; [13]:3019 | N | |

## ED-08 — Transitions et grisé

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED08-R01 | Faire tourner la roulette sélectionne la valeur numérique et grise le libellé échec (45 %). | [13]:3015 ; [13]:4104 ; [DSF2M]:33 ; [HIST]:130 | N | |
| ED08-R02 | Toucher le libellé sélectionne l'échec. La roulette repasse à `00:00` et devient grisée. | [13]:3015 ; [13]:4104 ; [DSF2M]:33 ; [07]:610 | N | |
| ED08-R03 | Le grisé exprime la non-sélection, pas une interdiction. Le bloc grisé reste manipulable, sans geste de déverrouillage. | [13]:3015 ; [13]:3055 ; [DSF2M]:33 ; [DSF2M]:35 ; [MAT2M]:48 (R02) ; [MAT2M]:61 ; [PER]:13 ; [QO] P5 | N | « Grisé » signifie ici manipulable (P5) |
| ED08-R04 | Rendu de la roulette : toutes les lignes numériques sont remplies en `#1a1a1f`, et le dégradé passe par l'opacité du remplissage. Sélection 100 %/20 px, voisine 45 %/16 px, distance 2 20 %/14 px, distance 3 10 %/12 px. Option échec : 100 % si sélectionnée, 45 % sinon, en 20 px. | [DSF2M]:23-31 ; [13]:3009 ; [MAT2M]:19 (E11) ; [HIST]:46-55 | V (rendu documenté) | |
| ED08-R05 | Quand le bloc numérique n'est pas sélectionné, le traitement à 45 % porte sur le bloc entier. Quand la roulette est active, ses niveaux restent ceux de ED08-R04. | [DSF2M]:35 ; [HIST]:132 | N/V | |
| ED08-R06 | `00:00` n'est jamais une cible valide : il représente seulement l'échec en position neutre. Il est refusé sans être converti en échec. Une pause de 0 reste valide. | [13]:4104 ; [13]:4106 ; [13]:3009 ; [13]:3055 ; [B-2M]:236 ; [HIST]:139 ; [HIST]:164 | N | Mécanisme du refus non défini (C-10) |
| ED08-R07 | Annuler restaure l'état d'avant l'ouverture du sélecteur ; valider l'applique. | [B-2M]:236 ; [13]:3055 ; [PER]:26 | N(-B) | |
| ED08-R08 | Scénario de recette : ouvrir sur 30 s (roulette à 30 s, libellé grisé) ; toucher l'échec (libellé actif, bloc à 00:00 grisé) ; tourner vers 30 s (cible 30 s, libellé grisé) ; rouvrir chaque état ; annuler restaure ; valider applique. Contrôler aussi le refus de 00:00 sans conversion, le traitement à 45 % et l'annonce de la sélection. | [B-2M]:236 ; [13]:3055 | N-B / N | Scénario prescrit, non exécuté |
| ED08-R09 | **Répétitions** (roulette à une colonne, [D-H Q8]) : l'échec est la première position de la roue. Aucun `00:00` neutre n'est requis. | [D-H Q8] ; [HIST]:173 | D-H | Le transfert du bloc à 45 % reste à préciser (C-11) |
| ED08-R10 | Aucun écran supplémentaire pour l'état « Série uniforme à l'échec » : le sélecteur l'exprime. | [HIST]:79 ; [DSF2M]:49 ; [MAT2M]:22 | N | |

## ED-09 — Bornes indépendantes des pauses et des totaux

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED09-R01 | Durée par Série : 5 à 3535 s (00:05 à 58:55). Sélecteur par pas de 5 s à partir de 5 s. | [13]:4093 ; [13]:4106 ; [13]:3027 ; [10]:281 (RM-234) ; [09]:1116 ; [07]:312 (D-232) ; [07]:610 ; [08]:1558 ; [08]:1808 ; [DSF2M]:37 | N | |
| ED09-R02 | Le maximum est 58 min 55 s. 5999 s et 59:55 sont des coquilles corrigées par Hermann. | [13]:4106 ; [MAT2M]:65 (R06 close) ; [PER]:13 | N | [HIST]:136 (« 00:05 à 59:55 ») est historique et supersédé |
| ED09-R03 | Répétitions par Série : entiers de 1 à 100. | [13]:4092 ; [13]:4106 ; [13]:3027 ; [10]:281 ; [09]:1116 | N | |
| ED09-R04 | Séries : 1 à 99, pas 1, défaut 1. | [13]:4091 ; [13]:4074 ; [09]:442 ; [09]:1116 | N | |
| ED09-R05 | Pause après chaque série et Pause entre les côtés : 0 à 300 s. Appui : 1 s. Maintien accéléré 1/5/10 selon DSF Bip. 0 est valide. | [13]:4094 ; [10]:281 ; [08]:1808 ; [13]:4100 | N | |
| ED09-R06 | Bip : entier de 0 à 10 s, pas 1, sans accélération. −1, 11 et les fractions sont invalides, sans correction silencieuse. 0 = `Aucun` est valide. | [13]:4095 ; [13]:3027 ; [09]:1270 ; [B-v13]:139 | N | Δ12 de [SR] inexact : voir C-08 |
| ED09-R07 | Compte à rebours et Fin d'exercice : 0 à 60 s, pas 1, sans accélération. | [13]:4096 ; [07]:379 (D-256) ; [07]:547 (D-336) | N | Rappel, hors ED-09 strict |
| ED09-R08 | Steppers : appui = 1. Maintien d'environ 500 ms, puis pas de 5 après environ 2 s et de 10 après environ 4 s, arrondis au multiple dans le sens du geste, saturés aux bornes sans rebouclage. Le relâchement arrête et rétablit le pas de 1 sans pas supplémentaire. Répétition à 150 ms. Aucun arrondi à l'ouverture ni au chargement. | [13]:4098 ; [13]:4255-4257 ; [07]:485 (D-312) ; [08]:1822 | N | |
| ED09-R09 | La règle des steppers ne redéfinit pas les roulettes : aucune accélération ne s'applique aux roulettes. | [13]:4098 ; [13]:4257 | N | |
| ED09-R10 | Les valeurs historiques ne sont pas arrondies silencieusement à la lecture. Les données héritées hors plage sont traitées explicitement, jamais tronquées en silence. | [13]:4106 ; [09]:1116 ; [13]:3041 ; [09]:1270 ; [PER]:27 | N | Traitement non défini (C-04) |
| ED09-R11 | Les contrôles de pauses et de Durée totale gardent leurs règles propres : les bornes de cible ne les modifient pas. | [13]:4106 ; [DSF2M]:37 ; [MAT2M]:65 | N | |
| ED09-R12 | Le pas de l'interface n'est pas une contrainte de stockage. | [09]:1116 | N | Conséquence pour une durée stockée qui n'est pas multiple de 5 : C-04 |
| ED09-R13 | Une saisie hors borne, une cible manquante, une double validation, une interruption ou une erreur de persistance ne laissent aucun état partiel. | [13]:3041 | N | |

## ED-10 — Tableau des séries variables et pied commun

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED10-R01 | En régime variable, un tableau est rattaché au champ de régime. Chaque ligne, numérotée de 1 à N, comporte une poignée, un numéro, une cellule cible, une cellule Pause et une commande de retrait. | [13]:4076 ; [DSFCIR]:29 ; [06]:1125 ; [07]:374 (D-251) | N | |
| ED10-R02 | Géométrie de référence à 402 : ligne `8129:31593` de 334×36. Poignée à x0/y9, 12×18. Numéro à x24/y10, 24×17, texte 14. Cellules à x79/y6 et x175/y6, 76×24 chacune. Zone de retrait à x294/y0, 36×36. Icône `8129:31604` de 24×24, trait de 14 px. | [DSFCIR]:29-37 ; [13]:2997 | V | Mesures de référence, pas des coordonnées absolues ([DSFCIR]:7) |
| ED10-R03 | En-têtes des colonnes : unité du mode (`Durée` ou `Répétitions`), puis `Pause`. Deux colonnes, même quand toutes les cibles sont à l'échec. Aucune variante à une colonne. | [DSF2M]:45 ; [13]:2995 ; [HIST]:97 ; [FIG] 8328:38632, 8328:38741, 8328:38848 | N/V | |
| ED10-R04 | Les cellules n'ont pas de steppers permanents. Une seule cellule est active à la fois. | [13]:2997 ; [DSFCIR]:5 ; [DSFCIR]:29 ; [PER]:28 | N | Δ6 : le ch. 13 prévaut sur [08]:1559-1561 (« commandes permanentes ») selon [08]:33 |
| ED10-R05 | Pied commun `8129:31601`, 354×48 : à gauche, le nom de la cellule active (libellé à x12/y17, texte 12), et à droite le groupe ± (x254/y6, 88×36). Les ± agissent uniquement sur la cellule active, avec les pas et bornes de son champ. | [DSFCIR]:34-36 ; [13]:2997 | N/V | Pas d'une cellule Durée : C-04 |
| ED10-R06 | Le nom du pied suit le format `Série <i> · <champ>`, avec le champ `Durée`, `Répétitions` ou `Pause`. Il est annoncé par l'accessibilité. | [13]:4223 ; [13]:3045 ; [DSFCIR]:35 ; [FIG] (« Série 1 · Durée », « Série 1 · Répétitions », « Série 1 · Pause ») | N (+V) | |
| ED10-R07 | La cellule active est désignée trois fois : barre d'accent sur la ligne, fond coloré sur la colonne, mention dans le pied. L'accessibilité l'identifie par ligne et colonne, pas seulement par la couleur. | [13]:4223 ; [13]:3045 | N | |
| ED10-R08 | Au repos, seule la valeur est visible. Les ± apparaissent à l'appui sur une valeur numérique, à droite de celle-ci, qui recule d'une translation constante. | [13]:4199-4203 ; [13]:4085 ; [13]:2989 ; [B-v13]:145 | N | Modèle commun à toutes les valeurs numériques de la feuille |
| ED10-R09 | Un seul champ actif : appuyer sur une autre valeur ferme le premier et ouvre le second d'un même geste. | [13]:4205-4207 ; [13]:3017 ; [DSFCIR]:39 | N | |
| ED10-R10 | Chaque appui sur ± est acquis. Un appui extérieur range l'outil, sans bouton Annuler. Ces appuis restent annulables par ✕ de la feuille. | [13]:4209-4219 ; [B-v13]:145 | N | |
| ED10-R11 | L'appui qui range l'outil n'active pas une cible destructive, comme le retrait. Il peut activer une cible inoffensive (autre valeur, chevron). | [13]:4217 ; [08]:555 ; [DSFCIR]:39 | N | |
| ED10-R12 | Le tableau ne défile pas indépendamment du corps de la feuille. | [DSFCIR]:39 | N | |
| ED10-R13 | Le chevron masque le tableau sans changer les données ni désactiver le mode variable. Replié, le tableau conserve données et erreurs. Le repli ne contourne jamais la validation. | [13]:4085 ; [13]:4100 ; [13]:3005 ; [08]:478-484 | N | |
| ED10-R14 | Une cellule incomplète est entourée d'un contour orange figé `#FF8D28`, épaisseur 1,5. ✓ est indisponible. Aucun message en ligne (ni « Renseignez la durée… », ni « Renseignez les répétitions »). | [07]:548 (D-337) ; [13]:4100 | N | P4 de [QO] : D-337 prévaut sur [13]:3027 et sur D-251 |
| ED10-R15 | Une cellule échec affiche `à l'échec`, sans valeur numérique modifiable. Le ✓ de la grille Volumes n'est pas transposé aux champs de l'éditeur. | [DSFCIR]:41 ; [13]:4076 | N | |
| ED10-R16 | Glisser une ligne par sa poignée déplace la ligne entière. Pendant le glisser, le corps ne défile pas. Un repère d'insertion (trait bleu Kodjo de 2) entre deux lignes montre la position de dépôt. Une alternative accessible au glisser est requise. | [07]:563 (D-345) ; [13]:4085 ; [13]:3023 ; [13]:3047 ; [DSFCIR]:30 | N | |
| ED10-R17 | Le Bip reste commun, au premier niveau, hors du tableau. Aucune surcharge par ligne. | [13]:4080 ; [13]:2975 ; [13]:2985 ; [B-v13]:139 | N | |
| ED10-R18 | Layout à 402 : groupe à x24, largeur 354, Bip à x36. Les anciennes indentations x52 des contrôles variables sont remplacées par la grille à cellules. Aucune hauteur fixe ne rogne le texte ni les steppers. | [13]:2999 ; [13]:3005 | V | Contredit par [13]:4253 (C-15) |
| ED10-R19 | Ordre de la feuille : Mode → Séries (régime, chevron, nombre) → cible/Pause uniformes ou tableau → Changement de côté → Ordre/PC si bilatéral → Bip → Total applicable → Compte à rebours → Fin. | [13]:2985 ; [06]:1123 ; [DSFCIR]:25 | N | [08]:196 omet Mode et Bip : le ch. 13 prévaut |

## ED-11 — Brouillons et changements de mode

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED11-R01 | La feuille travaille sur une copie des paramètres du parent. ✕ ou le retour système annulent toute l'ouverture, y compris les appuis ± et les déplacements. ✓ applique l'état actif et valide, de façon atomique, au parent, puis régénère le résumé. Seul `Terminer` persiste. | [08]:251 ; [08]:257 ; [13]:2967 ; [13]:3033 ; [13]:620 ; [07]:372 (D-249) | N | |
| ED11-R02 | Les états alternatifs cachés (cibles de l'autre mode, tableau variable caché, lignes retirées) servent au brouillon seulement. Ils ne sont jamais persistés. | [08]:251 ; [13]:3033 ; [09]:446 ; [09]:1142 ; [09]:1149 | N | |
| ED11-R03 | Un changement de mode conserve N et les Pauses. Les cibles numériques incompatibles sont remplacées par `—` (à renseigner), sans conversion entre secondes et répétitions. | [08]:259 ; [09]:1252 ; [13]:3019 ; [B-v13]:38 | N | |
| ED11-R04 | Un changement de mode conserve le caractère À l'échec, qui ne dépend pas de l'unité. | [09]:1252 ; [13]:3015 ; [B-2M]:42 | N | |
| ED11-R05 | Revenir au mode précédent avant ✓ restaure ses dernières cibles. | [08]:259 ; [13]:3019 ; [08]:1808 | N | Cas des cibles modifiées entre-temps : C-12 |
| ED11-R06 | `—` n'est jamais zéro. | [08]:259 | N | |
| ED11-R07 | Création : Série 1, Pause 0 s. La cible uniforme initiale en Répétitions vaut 1. Un changement de mode en régime variable n'introduit aucune cible implicite. | [13]:4085 ; [13]:2963 | N | Cible Durée initiale : C-05 |
| ED11-R08 | Le Bip est conservé lors d'un changement de mode, même après ✓. | [13]:3019 ; [13]:3033 ; [B-v13]:139 ; [07]:481 | N | |
| ED11-R09 | Un changement de mode peut exiger une nouvelle cible. ✓ reste grisé tant que le mode ou une cible active exigée est invalide. La cellule concernée est signalée par son contour, sans message. | [08]:536 ; [13]:4100 | N | |
| ED11-R10 | Pendant l'édition, les paramètres communs et les dernières valeurs propres à chaque mode sont conservés. | [08]:1808 | N | |
| ED11-R11 | Un changement de mode seul ne sauvegarde rien. Au retour au parent, la position et le contenu sont conservés et la phrase se régénère. | [13]:3037 | N | |
| ED11-R12 | Annuler la feuille ne modifie aucun paramètre du parent. Le brouillon de la feuille est distinct du brouillon parent. | [13]:620 ; [13]:3033 | N | |
| ED11-R13 | Après ✓, les lignes retirées et les alternatives cachées ne sont plus conservées. | [08]:255 ; [08]:253 | N | |
| ED11-R14 | Duplication, copie et instantané incluent le Bip et la cible typée, sans mutation partielle. | [13]:3033 ; [09]:1196 | N | Croisement avec ED-19 |

## ED-12 — Variations de N et réordonnancement

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED12-R01 | Quand N augmente, les lignes temporairement retirées sont rétablies d'abord. Au-delà, chaque nouvelle ligne copie la dernière ligne active dans l'ordre courant : cible (y compris le type échec) et Pause. | [08]:255 ; [08]:488 ; [08]:534 ; [13]:3017 ; [09]:1250 | N | |
| ED12-R02 | Quand N diminue, les dernières lignes de la liste active sont retirées. Leur cible, leur Pause et leur ordre sont conservés temporairement, pour une restauration avant ✓. | [08]:255 ; [07]:372 (D-249) | N | |
| ED12-R03 | Une tranche retirée se restaure dans son ordre relatif d'origine. Exemple : réduire de 5 à 3 puis revenir à 5 restitue 4 puis 5, et non 5 puis 4. | [08]:255 | N (exemple normatif) | |
| ED12-R04 | Après ✓, les lignes retirées ne sont plus conservées. | [08]:255 ; [08]:520 | N | |
| ED12-R05 | Copier une ligne dont la cible est à l'échec copie son type et sa Pause, sans inventer de nombre. | [09]:1250 ; [B-2M]:40 | N | |
| ED12-R06 | Un déplacement emporte ensemble cible, Pause et cadence éventuelle. Les lignes sont renumérotées de 1 à N. La nouvelle dernière ligne porte PN (la Pause terminale, stockée et exécutée). | [08]:257 ; [07]:372 (D-249) ; [13]:3023 | N | « Cadence » : C-14 |
| ED12-R07 | Les lignes actives déplacées gardent leur nouvel ordre quand les lignes retirées sont restaurées. Celles-ci sont réinsérées en fin, dans leur ordre conservé. | [08]:257 | N | |
| ED12-R08 | Passer en identiques après un déplacement reprend la nouvelle première ligne. | [08]:257 | N | |
| ED12-R09 | ✕ annule aussi les déplacements. | [08]:257 | N | |
| ED12-R10 | À N = 1, l'état effectif est uniforme et l'Ordre des côtés effectif est « Un côté après l'autre », **dès le brouillon et son calcul**. Le champ de régime n'est pas modifiable. L'Ordre des côtés est grisé s'il est visible en bilatéral. Aucun texte explicatif. | [08]:261 ; [07]:373 (D-250) ; [13]:4075 ; [13]:4078 ; [13]:2985 | N | D-250 parle d'« interrupteur » : historique (C-18) |
| ED12-R11 | À N = 1, l'ancien état variable, ses lignes et l'ancien ordre des côtés sont conservés temporairement, pour être restaurés si N remonte à 2 ou plus avant ✓. Valider à 1 ne garde qu'une série uniforme et l'ordre par défaut. | [08]:261 ; [07]:373 | N | |
| ED12-R12 | Supprimer une ligne par sa croix est immédiat, sans confirmation. Le message discret « Série supprimée — Annuler » s'affiche, et Annuler restaure la position et les paramètres. La convention de notification existante est réutilisée, sans durée ni écran inventés. Les bornes de validité restent applicables. | [08]:551 ; [13]:3017 ; [13]:4219 ; [07]:599 (CIR-11) ; [B-v13]:149 | N | Cas limites : C-13 |
| ED12-R13 | Compatibilité (sans implémenter Composition) : sous N hérité d'un circuit de séries, le nombre reste visible avec sa valeur réelle mais non modifiable, avec une origine discrète. Aucune suppression locale. Les déplacements restent possibles. Le total affichable est en lecture seule. | [08]:514 ; [08]:553 ; [13]:4074 ; [13]:3017 ; [13]:2989 ; [DSFCIR]:45 ; [PER]:46 | N (compat.) | Placement de la mention non fixé dans Figma ([DSFCIR]:47) |
| ED12-R14 | La réserve créée par le compteur d'un circuit appartient au brouillon de séance. Ouvrir puis valider la feuille d'un exercice ne doit pas la purger. Hors héritage, la frontière de la feuille (✓) s'applique. | [08]:516-520 ; [B-v13]:149 | N (compat.) | Composition hors périmètre |
| ED12-R15 | Le nombre de Séries s'affiche `N séries`, ou `1 série` au singulier. | [FIG] (« 3 séries », « 1 série ») | V | |
| ED12-R16 | Tester : N à 1 et à 99, réduction, augmentation et restauration, réordonnancement de la dernière Série, changement de dernière ligne après déplacement, copie et instantané. | [B-v13]:135 ; [13]:3061 | N(-B) | |

## ED-04 (lié) — Régime identiques/variables

| ID | Règle atomique testable | Sources | Statut | Note |
|---|---|---|---|---|
| ED04L-R01 | Le régime prend deux valeurs, `identiques` et `variables`, choisies dans un popover à deux entrées porté par un champ de la ligne `Séries`. Sous-titres : « toutes les séries ont la même valeur » et « chaque série a sa propre valeur ». | [08]:467-474 ; [13]:4075 ; [FIG] 8328:39390 | N (+V) | Texte des sous-titres identique entre spécification et Figma |
| ED04L-R02 | Trois états d'affichage : identiques, sans chevron ; variables avec liste visible (chevron déployé) ; variables avec liste masquée (chevron replié). | [08]:476-484 ; [B-v13]:145 ; [DSFCIR]:25 | N | |
| ED04L-R03 | Le régime est explicite. Il ne dépend ni de l'égalité des valeurs, ni du mode. | [09]:445 ; [09]:1248 ; [09]:1140 ; [13]:4145 ; [13]:4181-4185 ; [PER]:22 | N | |
| ED04L-R04 | Passer en variables : chaque ligne copie la cible et la Pause uniformes courantes, échec compris. La cadence commune s'applique. | [08]:253 ; [07]:420 (D-272) ; [13]:3019 | N | |
| ED04L-R05 | Revenir à identiques se fait sans confirmation ni message temporaire. L'état uniforme reprend la première ligne dans l'ordre courant : cible **et** Pause. | [08]:253 ; [08]:532 ; [13]:3019 | N | |
| ED04L-R06 | Repasser en variables avant ✓ restitue le dernier tableau variable. | [08]:253 ; [08]:532 | N | |
| ED04L-R07 | Si ✓ valide en identiques, les valeurs variables cachées ne sont pas persistées. | [08]:253 ; [08]:532 | N | |
| ED04L-R08 | En identiques, une cible et une Pause communes sont effectives. Lignes visibles : `Durée d'une série` et `Pause après chaque série`. | [08]:247 ; [13]:4076 ; [FIG] 8328:37760 | N (+V) | Libellé en Répétitions : C-19 |
| ED04L-R09 | Défaut : `Séries variables` vaut faux, et faux à N = 1. Un exercice nouvellement créé et ajouté à un circuit est en identiques. Les données qui n'ont pas les nouveaux attributs sont lues en uniforme. | [09]:445 ; [08]:461 ; [09]:1142 | N | |
| ED04L-R10 | L'ancien interrupteur Séries variables est supprimé au profit du popover. | [DSFCIR]:5 ; [B-v13]:145 ; [PER]:22 | N | D-250 et D-251 mentionnent encore interrupteur et message : historiques pour ce point |

---

## Contradictions et manques

| ID | ED | Constat | Sources | Règle de priorité écrite / proposition |
|---|---|---|---|---|
| C-01 | ED-07, ED-11 | **Validation de la roulette de cible.** Figma 8328:37862 montre une surface de roulette avec ses propres ✕ et ✓, et [13]:4213 dit que « le popover de roulette … a besoin d'une validation ». La règle §4.5 parle d'une « validation par le bouton de la feuille » ([13]:3015, [HIST]:119, où « feuille » désigne la surface du sélecteur). En sens inverse, [08]:1573 écrit « sans seconde validation par roulette » et [08]:1571 parle de roulettes « sous leur ligne ». | [13]:3015 ; [13]:4213 ; [08]:1571-1573 ; [FIG] 8328:37862 | Le ch. 13 fait autorité sur les champs ([08]:33, Δ6). Lecture retenue : ✓ du sélecteur → brouillon de la feuille Paramètres, puis ✓ de la feuille → parent. **À confirmer**, car la phrase du ch. 08 n'est pas explicitement supersédée. |
| C-02 | ED-07 | **Forme du sélecteur en Répétitions.** Les sources prescrivent un stepper inline ([13]:125, [06]:186, [06]:2199, D-219 [07]:294, [08]:1559, [08]:1573). Hermann a décidé une roulette à une colonne. | [D-H Q8] | Résolu par la décision de Hermann du 16/10, qui prime comme arbitrage explicite du propriétaire. Mettre à jour Q8 dans [QO] (« décidée ») ; les sources ne sont pas amendées. |
| C-03 | ED-07, ED-10, ED-06 | **Édition d'une cellule cible du tableau variable.** Le pied ± agit sur la cellule active ([DSFCIR]:34, [13]:2997 ; Figma 8328:38632 montre « Série 1 · Durée » avec ±). Aucune source ne dit comment une cellule variable passe à l'échec, ni comment elle en revient : le sélecteur avec option échec s'ouvre-t-il depuis la cellule ? [13]:4076 dit seulement « cible et Pause par steppers ; À l'échec : cible textuelle sélectionnable ». Les liens de prototype de cellule à cellule ne sont qu'une démonstration ([MAT2M]:24, E16). Q8 ne tranche pas le cas des cellules Répétitions. | [13]:4076 ; [DSFCIR]:34-41 ; [MAT2M]:24 ; [HIST]:83-91 | **À arbitrer, bloquant pour ED-07/ED-10 en régime variable.** Options à soumettre : (a) toucher une cellule cible ouvre le sélecteur de cible (roulette avec échec) ; (b) ± du pied, plus un moyen distinct de choisir l'échec. |
| C-04 | ED-09, ED-10 | **Pas et valeurs non multiples de 5 en Durée.** La roulette avance par 5 s ([13]:4093). Dans le pied, ± sur une cellule Durée suit les pas du stepper (appui 1 s ?), non définis pour une cible. Le stockage n'impose pas de pas ([09]:1116), et les valeurs historiques ne s'arrondissent pas ([13]:4106, [13]:4098). On ignore comment la roulette affiche une cible stockée à 7 s, ou supérieure à 3535 s. | [13]:4093 ; [13]:4098 ; [13]:4106 ; [13]:3041 ; [09]:1116 ; [DSFCIR]:36 | **À arbitrer** : pas des ± d'une cellule Durée (1 ou 5 s), et présentation d'une valeur hors grille ou hors plage. Seul principe écrit : « jamais tronquées silencieusement, traitées explicitement ». |
| C-05 | ED-11 | **Cible Durée initiale.** « mode/durée/côté non renseignés — » ([13]:4085) contre « Durée, valeur par défaut 1 min » ([08]:1558). | [13]:4085 ; [08]:1558 | Priorité écrite : le ch. 13 fait autorité sur les champs ([08]:33). Retenir `—`. Signaler au PRD. |
| C-06 | ED-05 | **Restes de la formulation à trois modes.** [08]:1580 (règle « Mode À l'échec »), [08]:1564 (Bip « Trois modes »), [08]:488 (« À l'échec n'exige pas de cible numérique », au rang d'un mode), [09]:455, [01]:207, [01]:29, [06]:1664, [06]:2208. | ces lignes | Priorité écrite : RM-033 ([10]:61) et la section « Décisions Deux modes » ([07]:604), qui remplace D-111. Ces lignes sont des restes non actualisés, lus comme supersédés. Δ3 va dans le même sens. |
| C-07 | ED-07 | **Q10 en partie mal décrite.** [QO] Q10 dit que les sources normatives ne donnent que « libellé dépendant du mode ». Or [13]:3015 (CE-UI-10 §12) et [DSF2M]:21 donnent les textes exacts « Aucune durée, à l'échec » et « Aucune répétition, à l'échec ». Figma n'a que la variante Durée. | [13]:3015 ; [DSF2M]:21 ; [FIG] | Proposition : retenir ces deux textes comme normatifs (lexique) et réduire Q10 à la vérification visuelle. La variante Répétitions dépend de la forme décidée en Q8 (libellé comme première ligne de la roue ?). |
| C-08 | ED-09 | **Δ12 de [SR] inexact.** « −1, 11, fraction invalides, aucune correction silencieuse » figure bien dans `caa2a5cf`, à [13]:3027 et [09]:1270. | [13]:3027 ; [09]:1270 ; [B-v13]:139 | Corriger le classement de Δ12 : la règle est présente à `caa2a5cf` (statut N), pas reprise depuis la base. |
| C-09 | ED-07, ED-09 | **Colonne des minutes.** Figma 8328:37862 montre 58, 59, 00…, et [HIST]:136 dit « minutes de 00 à 59 », soit un maximum de 59:55. La borne normative est 58:55. | [13]:4106 ; [FIG] 8328:37862 ; [HIST]:136 | Priorité écrite : D-255 ([07]:378), Figma ne crée aucune règle ; la correction de Hermann (R06, [MAT2M]:65) s'applique. Minutes de 00 à 58, et à 58 les secondes vont de 0 à 55. **À préciser** : la roue des minutes boucle-t-elle ? |
| C-10 | ED-08 | **Comportement à 00:00.** On sait seulement que « le sélecteur doit l'interdire comme valeur de cible » et que la recette vérifie « 00:00 refusé sans conversion ». Rien ne dit ce qui se passe quand l'utilisateur fait tourner la roulette jusqu'à 00:00 (✓ bloqué, saut à 00:05, contour…). | [HIST]:139 ; [13]:3055 ; [B-2M]:236 | **À arbitrer** (mécanisme d'interface). |
| C-11 | ED-07, ED-08 | **Portée de « même logique que Durée » (Q8).** Dans une roue à une colonne, l'échec est une ligne de la roue : il n'y a ni filet, ni libellé séparé, ni `00:00` neutre, ni bloc grisé à 45 %. Questions restantes : le texte de cette première ligne (« Aucune répétition, à l'échec » ?) ; son rendu (opacités de la roue) ; et le fait que « tourner sélectionne le nombre » reste vrai sans geste distinct. | [D-H Q8] ; [HIST]:173 ; [13]:3015 | **À préciser par Hermann** au moment de rédiger ED-07/ED-08 pour Répétitions. |
| C-12 | ED-11 | **Mémoire par mode avec des cibles modifiées.** « Revenir au mode précédent avant ✓ restaure ses dernières cibles. » Que se passe-t-il si, après le changement, une cellule passe de l'échec à un nombre (ou l'inverse), ou si N change, avant le retour au mode d'origine ? | [08]:259 ; [08]:1808 ; [09]:1252 | **À arbitrer.** Aucune règle écrite. |
| C-13 | ED-12 | **Cas limites de la suppression par croix.** (a) La ligne supprimée entre-t-elle dans la réserve des lignes retirées par diminution de N, et dans quel ordre ? (b) Retrait à N = 1 (N minimum 1) ? (c) Une suppression qui ramène N à 1 déclenche-t-elle la normalisation N1, et Annuler la défait-elle ? (d) Durée de vie d'Annuler face à d'autres gestes, et après ✓. | [08]:551 ; [08]:255 ; [08]:261 ; [13]:4219 | **À arbitrer.** Seul principe écrit : « restauration des paramètres et de la position ». |
| C-14 | ED-12, ED-10 | « La cadence éventuelle se déplace » ([08]:257) et « réordonne cible/Pause/bip ensemble » ([13]:3023) contre « Bip commun, aucune surcharge par ligne » ([13]:2975, [B-v13]:139, [07]:421 D-273). | ces lignes | Le Bip est commun : son déplacement n'a aucun effet observable. Pas de cadence par ligne. |
| C-15 | ED-10 | [13]:4253 maintient les sous-lignes en retrait x52 (séparateurs de 314 px). [13]:2999 remplace ces retraits par la grille à cellules du DSF du 12/10. | [13]:2999 ; [13]:4253 | Proposition : l'« Alignement DSF du 12/10 » ([13]:2997-2999), plus récent et explicitement supersédant ([DSFCIR]:5), s'applique au tableau. Le retrait x52 des sous-lignes uniformes reste un point visuel à vérifier sur Figma. |
| C-16 | ED-10 | Titre de la feuille : « Modalités d'exécution » ([06]:1123, Figma) ; la feuille et la carte du parent s'appellent « Paramètres d'exécution » ([13]:2955, [13]:570). | [06]:1123 ; [13]:570 ; [13]:2955 | Pas de conflit : l'en-tête de la feuille affiche « Modalités d'exécution », la carte du parent « Paramètres d'exécution ». Texte à confirmer dans le lexique. |
| C-17 | ED-10 | D-251 ([07]:374, « cellule et message en ligne ») et [13]:3027 (« erreur nommant la Série ») contre D-337. | [07]:548 | Résolu (P4 de [QO]) : D-337 s'applique. |
| C-18 | ED-04/ED-12 | D-250 ([07]:373) parle d'« options grisées, interrupteur visuellement désactivé » à N = 1, alors que l'interrupteur est supprimé. | [08]:261 ; [DSFCIR]:5 | Règle écrite : le DSF du 12/10 remplace l'interrupteur. À N = 1, le champ de régime n'est pas modifiable ([08]:261). |
| C-19 | ED-07, ED-04 | Le libellé de la ligne de cible uniforme en Répétitions n'est fixé nulle part. Figma n'a aucune capture de Répétitions en identiques, et seul « Nombre de répétitions » figure à [08]:1559. | [08]:1559 ; [FIG] | **À arbitrer** (clé du lexique), par exemple en symétrie avec « Durée d'une série ». |
| C-20 | ED-07 | Feuille du sélecteur de cible en uniforme : [08]:1571-1573 parle de roulettes « sous leur ligne », Figma 8328:37862 d'un popover ancré, et [13]:129 d'un cas à part pour « CE-UI-10 (roulette déployée dans la feuille) ». | ces lignes | Visuel : Figma et [DSF2M] (popover hôte 354×249). Le comportement reste celui de ED-07. |

**Top 5 pour le PRD :** C-03 (édition d'une cellule variable et choix de l'échec), C-11 (portée de Q8), C-04 (pas et valeurs hors grille), C-10 (00:00), C-13 et C-12 (suppression, et mémoire par mode).

## Termes et libellés d'interface cités par les sources

| Texte exact | Contexte | Sources |
|---|---|---|
| `Durée` / `Répétitions` | Options du popover de mode ; en-tête de colonne du tableau | [13]:4073 ; [DSF2M]:7 ; [FIG] 8328:37092 |
| `Mode d'exécution` | Libellé de ligne | [13]:4073 ; [FIG] |
| `Séries` ; `3 séries` ; `1 série` | Ligne et valeur du nombre | [FIG] |
| `identiques` / `variables` | Valeurs du régime | [08]:471-472 ; [FIG] 8328:39390 |
| « toutes les séries ont la même valeur » / « chaque série a sa propre valeur » | Sous-titres des options de régime | [08]:471-472 ; [FIG] 8328:39390 |
| `Durée d'une série` | Ligne de cible uniforme en Durée | [FIG] 8328:37760 |
| `Pause après chaque série` | Ligne de Pause uniforme ; libellé d'interface | [08]:241 ; [FIG] |
| `Pause` | En-tête de la colonne Pause du tableau | [FIG] 8328:38632 |
| « Aucune durée, à l'échec » / « Aucune répétition, à l'échec » | Option échec du sélecteur | [13]:3015 ; [DSF2M]:21 ; [HIST]:42 |
| `à l'échec` | Valeur affichée d'une cellule ou d'un champ à l'échec | [FIG] 8328:38848, 8470:13303 ; [DSF2M]:45 |
| `minutes` / `secondes` | Unités de la roulette Durée | [FIG] 8328:37862 |
| `12 rép.` (nombre + `rép.`) | Cellule Répétitions | [FIG] 8328:38741 |
| `30 s`, `1 min` | Format de cellule Durée | [FIG] ; format des durées : [08]:609-618 (Δ4) |
| `Série 1 · Durée` / `Série 1 · Répétitions` / `Série 1 · Pause` | Libellé du pied commun, au format `Série <i> · <champ>` | [13]:4223 ; [13]:3045 ; [DSFCIR]:35 ; [FIG] |
| « Série supprimée — Annuler » | Message après suppression par croix | [08]:551 ; [B-v13]:149 |
| `—` | Cible ou valeur non renseignée (jamais zéro) | [08]:259 ; [13]:4085 |
| `Aucun` | Bip à 0 | [13]:4080 ; [13]:2991 |
| `Bip de cadence` ; `Changement de côté` ; `Sans changement` ; `Durée totale` ; `Compte à rebours` ; `Fin d'exercice` | Autres lignes de la feuille (contexte) | [FIG] ; [13]:4071-4083 |
| `Modalités d'exécution` | Titre de l'en-tête de la feuille | [06]:1123 ; [FIG] |
| « Modifier les paramètres d'exécution » | Focus accessible de la zone de phrase | [13]:4265 ; [13]:632 |
| `3 séries à l'échec` / « N séries à l'échec » | Cartes Catalogue, tout à l'échec | [13]:4170 ; [08]:1814 |
| « N séries menées jusqu'à l'échec » | Phrase, tout à l'échec (corpus) | [08]:662 ; P3 de [QO] |
| « Série N, à l'échec » | Libellé accessible de la grille Volumes (hors périmètre) | [08]:544 |
| Libellés à **ne pas** reprendre | « Renseignez la durée… », « Renseignez les répétitions » (supprimés par D-337) ; « Aucune durée » et « Aucune répétition » seuls (section Q7 exclue) ; troisième option « À l'échec » dans le popover de mode | [07]:548 ; [QO] Q7 ; [13]:3015 |

## Dénombrement

| ED | Règles |
|---|---|
| ED-05 | 14 |
| ED-06 | 15 |
| ED-07 | 16 |
| ED-08 | 10 |
| ED-09 | 13 |
| ED-10 | 19 |
| ED-11 | 14 |
| ED-12 | 16 |
| ED-04 (lié) | 10 |
| **Total** | **127** |

Contradictions et manques relevés : 20 (C-01 à C-20), dont 8 à arbitrer : C-03, C-04, C-10, C-11, C-12, C-13, C-19 et la confirmation de C-01.
