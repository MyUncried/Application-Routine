> Relevé du02/10, complété et remplacé pour les références Figma par [l’état des lieux du03/10](ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03.md). Les39copies sont une preuve historique, pas l’inventaire actuel. La réserve reset/saut a été retirée : D-029/D-150 s’appliquent aux deux ordres.

**État antérieur au lot Bip de cadence.** La [matrice Bip du07/10](MATRICE-BIP-FIGMA-2026-10-07.md) porte les références courantes et remplace les états de captures en attente.

**Inventaire historique.** La [matrice du 07/10](MATRICE-FIGMA-2026-10-07.md) porte les références actives, notamment le remplacement de 4893:6675.

**Inventaire courant :** [matrice06/10](MATRICE-CADENCE-FIGMA-2026-10-06.md). Ce relevé antérieur conserve sa provenance ; ses empreintes datées ne décrivent pas les PNG réexportés le06/10. Les états6603/6611/6623 ne remplacent plus les frames6407/6411/6423 réintégrées. Cadence/phrase/DSF actifs : paramètres v13, Phrase v1 et DSF-CADENCE-2026-10-06.

# Matrice — Séries variables et Ordre des côtés — 02/10/2026

Source active : [v12](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md), D-247 à D-255. Baseline main8fc58a466679a85ea74752f0273939f901efa1b8, dernier identifiant antérieur D-246. Ce document remplace les anciennes matrices de calcul/bilatéralité sur le périmètre modifié ; il ne certifie pas le code.

## Traçabilité de la conception

| Source | Cible v12 | Contrats / recette |
|---|---|---|
| C1 | §2 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C2 | §3 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C3 | §4 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C4 | §2 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C5 | §4 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C6 | §2 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C7 | §3 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C8 | §2 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C9 | §3 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C10 | §5 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C11 | §2 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C12 | §5 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C13 | §7 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C14 | §4 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C15 | §6 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C16 | §7 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C17 | §3 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C18 | §3 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C19 | §2 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C20 | §2 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C21 | §8 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C22 | §6 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C23 | §6 | CE-UI-10 / CE-T03-04 ; v12§9 et tests ci-dessous |
| C24 | §8 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C25 | §4 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C26 | §4 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C27 | §4 | CE-T03-02/04/08, CE-EXEC-SESSION-01, CE-T03-09..13 ; v12§9 et tests ci-dessous |
| C11-bis | §2 amendé par prompt§4.1 | Ordre des côtés / Un côté après l’autre / Les deux côtés à chaque série / Pause entre les côtés |
| Prompt§5 | D-249 à D-254 | Déplacement, pas, compatibilité, Profil et N1 arbitrés ; G→D sans frame dédiée, comportement défini |

## Couverture de recette à implémenter

| Groupe | Critères |
|---|---|
| Calculs | A195s, B285s, C405s, D375s, E≥195s, Fsans total ; uniformes315/640/615s |
| Pauses | PN en direct/R0 ; substitution PN par R>0 ; chaque Tour et dernière occurrence ; PC0 sans repli ; phases nulles sans double transition |
| Ordres | D→G et G→D pour les deux ordres ; N1 normalisé dès brouillon ; cibles identiques entre côtés |
| Brouillon | Activation copie ; désactivation première courante ; réactivation restaure ; mode aller/retour ; réduction/restauration ; déplacement cible+Pause solidaire ; ✕/✓/Terminer distincts |
| Bornes | N1/99 ; durée1/5999s ; répétitions1/100 ; pauses4→5→10 et120→150 aller/retour ; total variable readonly/incomplet— |
| Persistance | Réouverture, duplication, copie vers Séance, ancien exercice uniforme ; résultats historiques inchangés |
| Layout | 12lignes haut/bas, tableau replié, erreur, texte agrandi, Safe Areas ; trois premières valeurs résumé ; Série/côté distincts |
| Réinitialisation / passage anticipé | D-029/D-150 conservées dans les deux ordres ; côté courant depuis sa première Série, résultats de l’autre côté préservés. Aucune nouvelle question métier. |

Ces critères sont documentaires ; aucune exécution de tests applicatifs ni recette interactive Figma n’est revendiquée. PRE-1 reste figé.

## Inventaire des exports du02/10

39frames :38états d’écran et1essai de composants. Chaque export est présent dans le chapitre06. Les noms de frames ci-dessous sont ceux de Figma ; leurs anciens termes ne remplacent pas le vocabulaire normatif. G→D n’a pas de copie dédiée ; c’est une absence de preuve graphique, pas une absence de spécification.

| Frame / nom source | Contrat | Capture | SHA blob Git |
|---|---|---|---|
| [6603:10219](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-10219) — Copie — Création activité — Paramètres en modale — 1 Champ vide | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-10219.png) | `d0a2f668722f876819b685df762489067ab161fd` |
| [6603:10304](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-10304) — Copie — Création activité — Paramètres en modale — 2 Modale ouverte (champs vides) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-10304.png) | `498f06b8b51a3a97dfc8d458818382dd6c5e3a19` |
| [6603:10414](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-10414) — Copie — Création activité — Paramètres en modale — 3 Texte affiché | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-10414.png) | `521d375a009814c932300d64d5b6a99ef572dae0` |
| [6603:10509](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-10509) — Copie — Création activité — Paramètres en modale — 4 Modale complète — mode activé | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-10509.png) | `2421a742f9e9012d9168204a15d9d7736b4e8637` |
| [6603:10633](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-10633) — Copie — Création activité — Paramètres en modale — 5 Modale complète — steppers (séries, pauses) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-10633.png) | `bdb589e1a801300b69fcd56471d4cf5afb016c3c` |
| [6603:10756](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-10756) — Copie — Création activité — Paramètres en modale — 6 Durée activée (roulette ouverte) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-10756.png) | `9b5058e0df82a1bdf99eda56e088faeecafe1653` |
| [6603:10879](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-10879) — Copie — Création activité — Paramètres en modale — 8 Changement de côté activé (contrôle segmenté) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-10879.png) | `297800794f7dce52127ffc93c3ccf4227d833780` |
| [6603:11002](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-11002) — Copie — Création activité — Paramètres en modale — 7 Durée totale activée (roulette ouverte) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-11002.png) | `04ebbe1cbb03760a6037d87140bd3595d8b1abce` |
| [6603:11125](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-11125) — Copie — Création activité — Paramètres en modale — 9 Avec changement de côté (pause au changement de côté) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-11125.png) | `62c5d3c0b06930e427b42d0ba0275927ad280ecb` |
| [6603:11251](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-11251) — Copie — Création activité — Paramètres en modale — 10 Répétitions (mode activé) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-11251.png) | `b92e6f58307f16c15f1420b11029c2940ee44783` |
| [6603:11375](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-11375) — Copie — Création activité — Paramètres en modale — 11 À l’échec (mode activé) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-11375.png) | `45f993787d5001766dd4bc5672ccbfffd16c779f` |
| [6603:11493](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-11493) — Copie — Création activité — Paramètres en modale — 12 Modale complète — steppers (séries, pauses) avec message de durée totale ajustée | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6603-11493.png) | `386eca3d50f8f694361f85ccea2edf54dd3d97fd` |
| [6603:11618](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-11618) — Copie — Exécution d’un exercice — Démarrée | CE-T03-09..13 | [PNG](Specifications-fonctionnelles/images/figma-6603-11618.png) | `25bd0b2a401ab5746a83931006d989cb53a9e0bd` |
| [6603:11688](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-11688) — Copie — Exécution d’une séance — Démarrée | CE-EXEC-SESSION-01 | [PNG](Specifications-fonctionnelles/images/figma-6603-11688.png) | `c1f43749019713709b287f1743a205f5075882e6` |
| [6603:11758](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6603-11758) — Copie — Exécution d’un exercice — Démarré — Bascule haute avec texte | CE-T03-09..13 | [PNG](Specifications-fonctionnelles/images/figma-6603-11758.png) | `0340b890a95fc3217971175962125c9e0d1289d0` |
| [6607:10896](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6607-10896) — Tests — Composants Séries variables | DSF, essai uniquement | [PNG](Specifications-fonctionnelles/images/figma-6607-10896.png) | `4b7f49d353493164187c62445f8ad8942a58ab23` |
| [6611:12781](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6611-12781) — Copie — Résumé — 14 Durée variable bilatérale Par série | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6611-12781.png) | `06100ece2df3bbadcaa840a09b23bb378e1be717` |
| [6611:12930](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6611-12930) — Copie — Résumé — 15 Répétitions variables | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6611-12930.png) | `79c1a7cbcb6e4d3bb9c961b4f7ca2b77364f9080` |
| [6611:13073](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6611-13073) — Copie — Résumé — 16 À l’échec variable | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6611-13073.png) | `e5943028de8eb7fb9c2101f4e6fa385e6d444556` |
| [6611:13215](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6611-13215) — Copie — Résumé — 17 Uniforme bilatéral Par série | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6611-13215.png) | `75519199e933e5c3c83d2f1c8d4833ad56ecf9df` |
| [6612:12272](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6612-12272) — Copie — Exécution d’une séance — Dernière série — Récupération (scénario B) | CE-EXEC-SESSION-01 | [PNG](Specifications-fonctionnelles/images/figma-6612-12272.png) | `6c6a1a855d8a9b92927c5d2ec8c6038967395543` |
| [6612:12371](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6612-12371) — Copie — Exécution d’un exercice — Par série — Série 1/3 Côté droit | CE-T03-09..13 | [PNG](Specifications-fonctionnelles/images/figma-6612-12371.png) | `4673aed022f1b155e4aaf576e4b77af0ab40f08b` |
| [6612:12471](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6612-12471) — Copie — Exécution d’un exercice — Par série — Série 1/3 Côté gauche | CE-T03-09..13 | [PNG](Specifications-fonctionnelles/images/figma-6612-12471.png) | `a35d981f1d1f1926fbb11de4f53db3da72136dfc` |
| [6612:23225](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6612-23225) — Copie — Catalogue des exercices — Liste — Séries variables | CE-T03-02 | [PNG](Specifications-fonctionnelles/images/figma-6612-23225.png) | `46b9dd92e5d08a7faf27e1e2056f4b4dfa933040` |
| [6623:12956](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-12956) — Copie — Séries variables — 1 Activation (valeurs recopiées) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-12956.png) | `d77f8b8602aa41b0b2b283208d47ea7e58901f98` |
| [6623:13296](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-13296) — Copie — Séries variables — 2 Durée variable (scénario A) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-13296.png) | `a6d5077625123be4493b41b8d79f65503fd7849d` |
| [6623:13636](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-13636) — Copie — Séries variables — 3 Répétitions variables (scénario E) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-13636.png) | `7fe803b8527277d970024877af483858f80c81ab` |
| [6623:13976](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-13976) — Copie — Séries variables — 4 À l’échec variable (scénario F) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-13976.png) | `9ab1f63ee705a249940424bde285ba3470c49dce` |
| [6623:14314](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-14314) — Copie — Séries variables — 5 Douze séries (défilement — haut) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-14314.png) | `d788d25eede02090045596a1ba062f48f24d4e26` |
| [6623:14880](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-14880) — Copie — Séries variables — 6 Douze séries (défilement — bas) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-14880.png) | `10f41e8f912effecbc9fb396f6c2684bb3c980a5` |
| [6623:15446](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-15446) — Copie — Ordre des côtés — 7 Sélection : Un côté après l’autre | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-15446.png) | `1c2c01a1ca5cf50e99111b6f462ef0fd4aa4a6b7` |
| [6623:15749](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-15749) — Copie — Ordre des côtés — 8 Sélection : Les deux côtés à chaque série | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-15749.png) | `6bea4da1a5d6faf016d77450e22cc0dbf3aab641` |
| [6623:16052](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-16052) — Copie — Séries variables + Les deux côtés à chaque série — 9 (scénario D) | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-16052.png) | `5c36dc630d97e18610889f1cf05fd6bb3a0c320d` |
| [6623:16770](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-16770) — Copie — Une seule série — 11 Options sans effet | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-16770.png) | `47f4bac3034e2efa9211e54056ad78204c592394` |
| [6623:17065](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-17065) — Copie — Changement de mode — 12 Cibles à renseigner | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-17065.png) | `3684197e0695aa3abadb9cba9bd03c0ff1e5ad24` |
| [6623:17404](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-17404) — Copie — Validation impossible — 13 Série incomplète | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-17404.png) | `6f4b904b4a305ccbef0225815d153902a30f86c0` |
| [6623:17745](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-17745) — Copie — Séries variables — 14 Tableau masqué | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-17745.png) | `e598f8788c97d7c33d1f8ddb86c1dae03badb57f` |
| [6623:18007](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6623-18007) — Copie — Séries variables — 15 Déplacement d’une série | CE-UI-10 / CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6623-18007.png) | `7b96caa830237fc88592cbef7c2f877b9820cec1` |
| [6637:13132](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6637-13132) — Copie — Composition séance — Standard — Séries variables | CE-T03-08 | [PNG](Specifications-fonctionnelles/images/figma-6637-13132.png) | `7f3bf1c0ec65c012b88a973f174332fdfd8ec8d7` |

