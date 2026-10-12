# Deux modes et cible À l’échec — inventaire, propagation et vérification

Base documentaire : branche `docs/circuits-tours-series-20261012`, commit `84987917d23437b0756989adc5c16224b588743e`, PR350, elle-même dépendante de PR349. Main consulté : `46b91bd2`. Les sources reçues sont archivées dans `archives/deux-modes-echec-2026-10-13/`. Les dates13/10 reprennent le lot source ; aucun changement de code ni de périmètre PRE-3.

## Inventaire des écarts et traitement

| ID | Écart initial / demande | Mise à jour | Résultat |
|---|---|---|---|
| E01 | Troisième mode À l’échec | Glossaire, chapitres01/03–13, Paramètres, Bip ; RM-033/111/127 | Deux modes, cible typée par Série |
| E02 | Interdiction du ≥ à l’Exercice | RM-129/132, DM-002/015, API, contrats, table Bip | Mélange calculable ≥ ; priorité sur≈ ; sans bip en Répétitions et tout échec omitted |
| E03 | Terminaison fondée sur le mode seul | RM-058/059, contrats d’exécution, architecture | Durée chiffrée automatique ; toute cible échec par Suivant |
| E04 | Sécurité/progression | RM-069/077/126, Bip, spécification§3 | Échec sans nominal dans les deux modes ; formules conservées, prédicats corrigés |
| E05 | Relevé assimilé à un nombre mesuré | Chapitres09/11/12/13, spécification§5 | Estimé tant que non confirmé ; déclaré après confirmation/correction ; absence distincte de zéro |
| E06 | Cumul confondu avec performance | Modèle de données, architecture, recette | Dernière tentative distincte :20+35=55 cumulé,35 relevé |
| E07 | Ancien enum et migration | Chapitres09/11/12, spécification§7 | Ancien échec → Répétitions + cibles échec ; historique préservé |
| E08 | Phrases ne couvrant pas les mélanges | RM-232/D-298, Phrase v1, annotation v10.2 | Compaction actée, fragments mixtes ajoutés ; corpus276 conservé comme base historique |
| E09 | Popovers à trois choix | Chapitre06, CE-UI-10, DSF | Deux options ;184×99 ; deux captures reprises |
| E10 | Roulette sans échec | DSF, CE-UI-10, chapitre06 | Variante8452:13297 ;330×181 ; popover354×249 ; capture reprise + composant illustré |
| E11 | Mauvaise lecture du grisé | DSF | #1a1a1f commun ; opacités100/45/20/10%, tailles20/16/14/12 |
| E12 | Colonne absente tout échec | DSF, CE-UI-10, capture8328:38848 | Colonne cible rétablie ; aucune variante à une colonne |
| E13 | Nouveau mélange absent de galerie | Chapitre06, contrat, DSF |8470:13303 ajouté ;19 états de feuille,32 captures du parcours |
| E14 | Total et écran uniforme | Contrat et DSF | Total mixte en lecture seule ; tout échec absent ; aucune frame uniforme dédiée ajoutée |
| E15 | Périmètre à préserver | DSF et sources | Roulette du total inchangée ; cartes catalogue et filtres conservés ; pas de nouvelles captures d’exécution/relevés |
| E16 | Interactions de prototype | Vérification directe MVP et source pour Hors MVP | Durée cellule3→mixte ; mixte cellules1/2→échec ; échec cellules1/2→durée. Démonstration entre états, pas spécification d’une mutation de plusieurs cibles par un seul appui |
| E17 | Complétude des contrats | Chapitre13 |34 contrats conservent chacun21 rubriques ordonnées et renseignées ; contenu des contrats affectés révisé |
| E18 | Sélecteur : §4.5 annoncé absent | CE-UI-10§§11/12/20, DSF | Règles explicites intégrées ; transitions détaillées non déclarées complètes, réserve R01 |

## Écrans inspectés et captures courantes

Les cinq paires ont été inspectées directement. Les six exports ci-dessous ont été ouverts visuellement et leur format PNG contrôlé. Les captures antérieures du12/10 restent dans leur répertoire historique ; quatre références courantes du chapitre06 pointent désormais vers le nouveau lot.

| Écran | Conception — Hors MVP | Prototype MVP | Capture documentaire |
|---|---|---|---|
| Choix du mode |7413:32819|8328:37092|[PNG](Specifications-fonctionnelles/images/echec-2026-10-13/8328-37092.png)|
| Cible Durée, roulette |7413:33007|8328:37862|[PNG](Specifications-fonctionnelles/images/echec-2026-10-13/8328-37862.png)|
| Choix du mode, variable |8319:29185|8328:38513|[PNG](Specifications-fonctionnelles/images/echec-2026-10-13/8328-38513.png)|
| Toutes cibles échec |7413:35142|8328:38848|[PNG](Specifications-fonctionnelles/images/echec-2026-10-13/8328-38848.png)|
| Nouveau cas mixte |8467:28618|8470:13303|[PNG](Specifications-fonctionnelles/images/echec-2026-10-13/8470-13303.png)|
| Variante DSF |8452:13297|Même maître|[PNG](Specifications-fonctionnelles/images/echec-2026-10-13/8452-13297.png)|

Les roulettes de total ont été vérifiées sur les deux pages : maître5544:5118,330×150 ; instance MVP8328:38188, Conception7413:33276. Elles ne reçoivent pas l’option échec. Les lignes tout échec et mixtes utilisent8129:31593.

## Réserves explicites

| ID | Ce qui manque | Conséquence / suite |
|---|---|---|
| R01 | §4.5 ajouté après transmission, absent de la proposition disponible (elle passe de4.4 à5) | Obtenir la version complète ; vérifier surtout le retour d’échec vers un nombre lorsque les roues sont grisées. Aucune interaction inventée |
| R02 | Qualification native du sélecteur grisé | Vérifier les modificateurs Expo57 et tester sur appareils ; aucune propriété Picker.disabled supposée acquise |
| R03 | Texte de fond de8328:38848 et7413:35142 : « avec des pauses de30s,45s et1min » | Contradiction avec Phrase v1 qui omet les clauses de pauses variables. Documentation conserve la règle ; correction Figma à prévoir, sans modification automatique de ce lot |
| R04 | Unité des volumes mixtes et tout échec dans les deux modes non illustrée | CE-CIR-03 impose de préserver l’information de mode ; libellé/placement à aligner dans une passe Figma distincte. Pas de troisième mode réintroduit |
| R05 | Écrans de saisie/restitution des relevés | Données et comportements documentés ; conception détaillée de ces écrans reste hors de la passe demandée |

Les réserves Circuits du12/10 (état hérité, tiret et indicateurs de côté, propagation du retrait) restent ouvertes, sans être mélangées aux corrections réalisées ici. Aucun résultat applicatif, migration livrée ou conformité visuelle globale n’est revendiqué.

## Vérification documentaire

Contrôle des identifiants et liens des nouvelles captures, décodage des six PNG, revue visuelle de la planche, contrôle des34 contrats ×21 rubriques non vides, vérification des nouvelles références locales et recherche des prescriptions contradictoires dans les chapitres et spécifications actives. Les occurrences conservées dans les sources archivées et décisions supersédées sont historiques. La validation documentaire n’exécute pas les recettes applicatives R01–R16 de la spécification.
