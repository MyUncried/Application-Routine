# PRE-3 — Paquet Figma du 08/10/2026

[Bilan et limites](../extraction-figma.md) · [Manifeste](manifest.json) · [Index par élément](index-elements.jsonl) · [Maîtres et variantes](masters.json) · [Styles et variables](tokens.json) · [Consommateurs](consommateurs.json) · [Contraintes complémentaires](complements-layout.json) · [Seconde lecture](controle-source.json).

## Lire un élément

Chaque ligne de `index-elements.jsonl` identifie un élément par `<frameId>/<nodeId>`, fournit sa source Figma et son pointeur JSON `properties`. Lire cet objet dans `ecrans/`, puis joindre `complements-layout.json.schemas[layoutSchema]` pour les bornes de taille, bordures individuelles, grilles et autres contraintes complémentaires. Ces valeurs sont toutes observées ; les absences de propriété correspondent au type de nœud, sans valeur inventée. Une variable n’est pas créée pour une valeur inline.

`master` référence `masters.json.masters[].id` ; `setId` mène à la définition des propriétés et aux 75 racines de variantes des 17 ensembles. Les propriétés effectives et tous les descendants des instances utilisées figurent dans les fichiers d’écran. La topologie complète des maîtres est conservée ; les propriétés visuelles de chaque descendant de chaque variante non utilisée ne sont pas un nouveau périmètre d’écran.

`tokens.json` distingue styles, variables, collections et modes. Les alias sont résolus jusqu’aux variables terminales dans le catalogue, sans écraser les liaisons originales. Les deux collections ont chacune un mode (`Clair` et `Base`) ; les modes explicites et résolus des nœuds restent dans leurs propriétés. Les valeurs RGBA, opacités, coordonnées et tailles conservent les nombres fournis par l’API.

`visibleSelonArbre` applique seulement les drapeaux `visible` des ancêtres. Ce champ ne certifie pas qu’un élément est rendu dans le viewport : opacité, clipping, masque, recouvrement et défilement se lisent séparément dans les propriétés et les captures. Les éléments masqués sont conservés.

## Couverture des écrans

Tous les écrans mesurent 402 × 874. Les PNG correspondent aux exports de référence de ces écrans, conservés sans redimensionnement.

| Source et données | Écran / état | Éléments | Visibilité héritée | Textes | Instances | Capture |
|---|---|---:|---:|---:|---:|---|
| [3542:4656](ecrans/3542-4656.json) | Création activité — Avant Paramètres d'exécution | 82 | 81 | 14 | 7 | [PNG](captures/3542-4656.png) |
| [3943:6064](ecrans/3943-6064.json) | Ajouter un exercice — Initial | 80 | 79 | 12 | 10 | [PNG](captures/3943-6064.png) |
| [4217:6980](ecrans/4217-6980.json) | Ajouter un exercice — Nom Description Media | 91 | 90 | 12 | 9 | [PNG](captures/4217-6980.png) |
| [5088:6398](ecrans/5088-6398.json) | Ajouter un exercice — Catégorie renseignée | 86 | 85 | 13 | 8 | [PNG](captures/5088-6398.png) |
| [4734:6342](ecrans/4734-6342.json) | Modifier un exercice | 72 | 71 | 11 | 7 | [PNG](captures/4734-6342.png) |
| [4332:7095](ecrans/4332-7095.json) | Ajouter un exercice — Catégories | 145 | 144 | 24 | 14 | [PNG](captures/4332-7095.png) |
| [4474:7157](ecrans/4474-7157.json) | Ajouter un exercice — Nouvelle catégorie | 242 | 241 | 60 | 12 | [PNG](captures/4474-7157.png) |
| [4478:7209](ecrans/4478-7209.json) | Ajouter un exercice — Zones corporelles | 137 | 136 | 26 | 24 | [PNG](captures/4478-7209.png) |
| [4683:6336](ecrans/4683-6336.json) | Ajouter un exercice — Nouvelle zone corporelle | 216 | 215 | 62 | 22 | [PNG](captures/4683-6336.png) |
| [4714:6241](ecrans/4714-6241.json) | Modal — Abandonner la création de l’activité | 92 | 90 | 19 | 8 | [PNG](captures/4714-6241.png) |
| [4861:6259](ecrans/4861-6259.json) | Ajouter un exercice — Catégorie — Appui long — Confirmation suppression | 154 | 152 | 28 | 15 | [PNG](captures/4861-6259.png) |
| [4861:6348](ecrans/4861-6348.json) | Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression | 133 | 131 | 28 | 25 | [PNG](captures/4861-6348.png) |
| [6407:9458](ecrans/6407-9458.json) | Création activité — Paramètres en modale — 1 Champ vide | 82 | 81 | 14 | 7 | [PNG](captures/6407-9458.png) |
| [6407:9551](ecrans/6407-9551.json) | Création activité — Paramètres en modale — 2 Modale ouverte (champs vides) | 159 | 158 | 42 | 22 | [PNG](captures/6407-9551.png) |
| [6407:9702](ecrans/6407-9702.json) | Création activité — Paramètres en modale — 3 Texte affiché | 83 | 82 | 15 | 7 | [PNG](captures/6407-9702.png) |
| [6407:9805](ecrans/6407-9805.json) | Création activité — Paramètres en modale — 4 Modale complète — mode activé | 172 | 171 | 48 | 24 | [PNG](captures/6407-9805.png) |
| [6407:9966](ecrans/6407-9966.json) | Création activité — Paramètres en modale — 5 Modale complète — steppers (séries, pauses) | 164 | 163 | 45 | 23 | [PNG](captures/6407-9966.png) |
| [6407:10127](ecrans/6407-10127.json) | Création activité — Paramètres en modale — 6 Durée activée (roulette ouverte) | 179 | 178 | 57 | 24 | [PNG](captures/6407-10127.png) |
| [6407:10481](ecrans/6407-10481.json) | Création activité — Paramètres en modale — 8 Changement de côté activé (contrôle segmenté) | 171 | 170 | 48 | 24 | [PNG](captures/6407-10481.png) |
| [6411:9546](ecrans/6411-9546.json) | Création activité — Paramètres en modale — 7 Durée totale activée (roulette ouverte) | 179 | 178 | 57 | 24 | [PNG](captures/6411-9546.png) |
| [6411:9649](ecrans/6411-9649.json) | Création activité — Paramètres en modale — 9 Avec changement de côté (pause au changement de côté) | 177 | 176 | 51 | 25 | [PNG](captures/6411-9649.png) |
| [6419:9847](ecrans/6419-9847.json) | Création activité — Paramètres en modale — 10 Répétitions (mode activé) | 173 | 172 | 48 | 23 | [PNG](captures/6419-9847.png) |
| [6419:10028](ecrans/6419-10028.json) | Création activité — Paramètres en modale — 11 À l’échec (mode activé) | 164 | 163 | 44 | 22 | [PNG](captures/6419-10028.png) |
| [6423:9953](ecrans/6423-9953.json) | Création activité — Paramètres en modale — 12 Modale complète — steppers (séries, pauses) avec message de durée totale ajustée | 166 | 165 | 46 | 23 | [PNG](captures/6423-9953.png) |
| [6665:24616](ecrans/6665-24616.json) | Séries variables — 2 Durée variable (scénario A) | 228 | 227 | 62 | 34 | [PNG](captures/6665-24616.png) |
| [6665:24844](ecrans/6665-24844.json) | Séries variables — 3 Répétitions variables (scénario E) | 226 | 225 | 60 | 34 | [PNG](captures/6665-24844.png) |
| [6665:25072](ecrans/6665-25072.json) | Séries variables — 4 À l’échec variable (scénario F) | 227 | 205 | 62 | 34 | [PNG](captures/6665-25072.png) |
| [6665:25277](ecrans/6665-25277.json) | Séries variables — 5 Douze séries (défilement — haut) | 445 | 444 | 125 | 70 | [PNG](captures/6665-25277.png) |
| [6665:26185](ecrans/6665-26185.json) | Ordre des côtés — 7 Sélection : Un côté après l’autre | 186 | 185 | 56 | 26 | [PNG](captures/6665-26185.png) |
| [6665:26575](ecrans/6665-26575.json) | Séries variables + Les deux côtés à chaque série — 9 (scénario D) | 241 | 240 | 68 | 36 | [PNG](captures/6665-26575.png) |
| [6665:26822](ecrans/6665-26822.json) | Une seule série — 10 Options sans effet | 178 | 177 | 51 | 25 | [PNG](captures/6665-26822.png) |
| [6665:27008](ecrans/6665-27008.json) | Changement de mode — 11 Cibles à renseigner | 226 | 225 | 60 | 34 | [PNG](captures/6665-27008.png) |
| [6665:27232](ecrans/6665-27232.json) | Validation impossible — 12 Série incomplète | 228 | 227 | 62 | 34 | [PNG](captures/6665-27232.png) |
| [6665:27458](ecrans/6665-27458.json) | Séries variables — 13 Tableau masqué | 153 | 152 | 39 | 21 | [PNG](captures/6665-27458.png) |
| [6665:27608](ecrans/6665-27608.json) | Séries variables — 14 Déplacement d’une série | 229 | 228 | 62 | 34 | [PNG](captures/6665-27608.png) |
| [6665:27862](ecrans/6665-27862.json) | Résumé — 15 Durée variable bilatérale Par série | 83 | 82 | 15 | 7 | [PNG](captures/6665-27862.png) |
| [6665:28050](ecrans/6665-28050.json) | Résumé — 17 À l’échec variable | 83 | 82 | 15 | 7 | [PNG](captures/6665-28050.png) |
| [7059:13302](ecrans/7059-13302.json) | Création activité — Paramètres en modale — 13 Répétitions avec cadence | 168 | 167 | 47 | 22 | [PNG](captures/7059-13302.png) |
| [7069:13464](ecrans/7069-13464.json) | Création activité — Paramètres en modale — 9b Avec changement de côté (copie) | 177 | 176 | 51 | 25 | [PNG](captures/7069-13464.png) |
| [7069:13573](ecrans/7069-13573.json) | Création activité — Paramètres en modale — 10b Répétitions (copie) | 165 | 164 | 45 | 22 | [PNG](captures/7069-13573.png) |
| [7119:27855](ecrans/7119-27855.json) | Création activité — Phrase longue (224 caractères) | 83 | 82 | 15 | 7 | [PNG](captures/7119-27855.png) |

## Intégrité et reproduction des contrôles

Exécuter `python docs/preparation/PRE-3/figma/verifier-extraction.py` depuis la racine du dépôt. Le script vérifie les empreintes SHA-256, les 41 arbres, l’index, les captures, les références des composants/styles/variables et leurs alias. `controle-source.json` conserve les résultats d’une seconde lecture indépendante des propriétés des 41 arbres Figma : 41 empreintes concordantes. FNV-1a sert à cette comparaison de lecture ; l’intégrité des fichiers repose sur SHA-256.

Le manifeste fige les fichiers de ce relevé, pas un identifiant de version fourni par Figma : `sourceVersionId` reste `null`. Il faut revalider cette source au démarrage du développement si le fichier Figma évolue.
