# 2026-11-24 — RECETTES-NOUVEAU-FORMAT

## Mission
Mettre au format du cahier « Recette Programmes » (https://claude.ai/artifact/DYbwwvFJZPq2HHKm2W8dAy : numéro stable, identifiant, versions successives avec historique, filtre « Version » par lot, bouton « À retester », pièces jointes) les cahiers :
- Recette PRE-10 Exécution — https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq
- Recette Planification Semaine — https://claude.ai/artifact/SbY2Ci9tcqVe3s9AiDBB84

Branche du rapport : `integration/bmad-planification-20261120`, commit de départ `63b95699`. Aucun fichier applicatif modifié (mission documentaire / outillage de recette).

## Réalisé
- Lecture intégrale des trois pages publiées. Les trois stockent les résultats de la même façon (collection `results`, un document par identifiant de point, `contexte` et `constats`) : la conversion conserve verdicts, notes et pièces jointes sans migration de données.
- Script du nouveau format repris tel quel ; clés de navigateur propres à chaque cahier conservées (`recette-planif-*`, `recette-pre10-*`).
- Sections remises dans l'ordre chronologique (plus ancienne en premier), regroupées en lots (« recette initiale », puis « lot N · date ou commit ») ; numéros attribués dans l'ordre d'affichage.
- Versions : un point dont l'intitulé cite entre parenthèses un point antérieur (identifiant exact, ou code court comme « k13 », « d4 ») devient la version suivante de la ligne de ce point. Si la ligne a déjà reçu une version dans le même lot, le point devient une ligne « issue de » placée juste après (comme r5-croix-nouveau dans le cahier Programmes).
- Bandeau « Nouveau format du cahier (24/11) » ajouté en tête ; bandeaux, en-têtes, adresses et textes des points inchangés.
- PRE-10 : capacité `assets` ajoutée (pièces jointes, comme Programmes et Planification).

## Résultats
| Cahier | Points d'origine | Lignes | Lignes à plusieurs versions | Lignes « issue de » | Sections (avant → après) |
|---|---|---|---|---|---|
| Planification | 311 | 266 | 36 | 4 | 45 → 43 |
| PRE-10 | 592 | 552 | 35 | 16 | 75 → 74 |

Sections disparues : toutes leurs lignes sont devenues des versions d'une ligne antérieure (leur lot reste visible dans chaque version et dans le filtre « Version »).

## Anomalie corrigée
PRE-10 : l'identifiant `k4-pause` servait à deux lignes (Guidage sonore — 3, 10/11 ; For time, 14/11), qui partageaient donc le même verdict. Le résultat enregistré (OK du 10/11) a été laissé à la ligne du 10/11 ; la ligne For time a reçu l'identifiant `k4-pause-fortime` et redevient non vérifiée.

## Preuves
- Contrôle du script : chaque point d'origine présent une seule fois comme version (PRE-10 : 592/592 ; Planification : 311/311) ; syntaxe des deux scripts vérifiée.
- Publications : Planification version 37 (capacités assets + db conservées) ; PRE-10 version 147 (assets + db).
- Relecture des bases après publication : Planification 311 verdicts, tous rattachés à un point de la page ; PRE-10 540 verdicts, 539 rattachés, 1 hors page (`z5-tabata`, point déjà retiré de l'ancienne page).

## Hypothèses non démontrées / limites
- Le rattachement des versions repose sur les références entre parenthèses des intitulés ; quelques chaînes sont discutables (ex. Planification : « Popovers centrés » r20-centre classé comme version de la ligne e2-choix via s19-popover). À signaler pour ajustement.
- Découpage en lots reconstitué d'après les bandeaux, titres et commits ; dates approximatives pour PRE-10.
- Les anciens « n° » du cahier PRE-10 (recalculés à chaque ajout, du plus récent au plus ancien) ne correspondent plus : ex. le titre « Ligne n° 50 » cite l'ancienne numérotation.

## Tests
Aucun test applicatif applicable (aucun code de l'application modifié). Vérifications : contrôles du script de conversion, syntaxe, relecture des bases.

## Vérifications restant à faire sur appareil
Ouvrir les deux cahiers sur l'iPhone : lisibilité, filtre « Version », « À retester », historique des versions.

## Fichiers modifiés
- `.github/orchestration/reports/2026-11-24_RECETTES-NOUVEAU-FORMAT.md` (ce rapport)

## Complément du 24/11 — bandeaux de synthèse numérotés et masqués une fois vérifiés
Demande : numéroter les grands bandeaux jaunes de synthèse et cacher ceux déjà couverts par les tests (précision de l'utilisateur : uniquement ces bandeaux, pas les badges de version des lignes).
- Chaque bandeau porte le numéro de son lot (pastille « lot N · date », la même que le filtre « Version ») ; correspondance établie bandeau par bandeau d'après son contenu (PRE-10 : 34 bandeaux ; Planification : 3 sur 4, le bandeau « Installer l'application de recette » ne se rattache à aucun lot et reste toujours affiché, comme le bandeau du nouveau format).
- Un bandeau est masqué quand toutes les versions courantes de son lot ont un verdict (OK, KO ou Sans objet) ; une version remplacée depuis par une version plus récente compte comme couverte. Le bouton « Afficher N bandeaux de lots déjà vérifiés » les réaffiche (choix mémorisé dans le navigateur).
- Simulation sur les résultats enregistrés : Planification, 3 bandeaux masqués ; PRE-10, 31 masqués, 3 visibles (lot 53 : 41 points à vérifier ; lot 51 : 1 ; lot 50 : 10).
- Publications : Planification version 38, PRE-10 version 148 (capacités inchangées). Syntaxe des scripts vérifiée. Aucun test applicatif applicable.
