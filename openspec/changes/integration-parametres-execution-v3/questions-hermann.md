# Questions pour Hermann — intégration de la spécification v3.0 (18/10/2026)

Questions ouvertes par l’intégration, puis arbitrées par Hermann le 18/10/2026. La seconde passe de contrôle indépendante a fait apparaître trois points que les arbitrages ne fixent pas : Q-V3-16 (rouverte), Q-V3-19 et Q-V3-20. Q-V3-10 (tokens) et Q-V3-17 (phases, PR #370) restent des coordinations avec d’autres chantiers.

## Statut des questions (arbitrages de Hermann du 18/10/2026)

Hermann a clos Q-V3-01 et Q-V3-04, et validé Q-V3-03, 05, 06, 07, 08 et 15 : décisions D-414 à D-421 du registre, propagées dans les règles, contrats, recettes et DSF. Pour les dix autres questions, les décisions existantes sont appliquées et les vérifications ou coordinations déjà identifiées sont suivies.

| ID | Sujet | Statut | Décision ou traitement | Emplacements |
|---|---|---|---|---|
| Q-V3-01 | Charge dans la phrase de synthèse | Close | D-414 : `(charge : 20 kg)` ; `(charges : 20, 12, 13 kg)` jusqu’à trois séries ; `(charges : 20, 12 kg, ...)` au-delà ; aucune mention sans charge. La place de la mention n’est pas fixée : voir Q-V3-19 | RM-240 ; ch. 10 grammaire v15 ; CE-UI-10 ; CE-T03-04 |
| Q-V3-02 | Phrase des côtés | Close par décision existante | D-407 (côté 1 / côté 2) appliquée ; mise à jour du corpus de recette v15 à coordonner avec le chantier de la phrase | ch. 10 « Côtés et durée » |
| Q-V3-03 | Condition d’arrêt à la création | Close | D-416 : À la cible par défaut | RM-248 ; CE-UI-10 ; ch. 08 |
| Q-V3-04 | Changement de côté à une seule série | Close | D-415 : à N = 1, la ligne Enchainement n’apparaît pas ; Avec / Sans reste disponible ; normalisation N1 conservée | RM-242 ; D-250 (statut) ; ch. 08 ; CE-UI-10 |
| Q-V3-05 | Réglage des cellules du tableau variable | Close | D-417 : chaque cellule utilise le sélecteur existant de son champ ; d’après les règles en vigueur : roulettes de durée et Répétitions (D-219, D-385), stepper de Pause (RM-234), clavier de charge (D-405) | RM-250 ; CE-UI-10 ; ch. 08, ch. 10 |
| Q-V3-06 | Roulette Répétitions en séries identiques | Close | D-418 : option À l’échec retirée en séries identiques, conservée dans une cellule variable | RM-250 ; ch. 06, 08, 10, 12 ; PRODUCT ; DSF Deux modes |
| Q-V3-07 | Durée en séries identiques à l’échec | Close | D-419 : saisie de durée numérique masquée | RM-248, RM-250 ; CE-UI-10 |
| Q-V3-08 | Cadence : Sans puis Autre | Close | D-420 : aucune mémorisation personnalisée supplémentaire | RM-245 |
| Q-V3-09 | Notation d’Enchainement dans Figma | Close par décision existante | Notation Figma conservée (PR-05, §9.3, RM-243) ; lettres D/G signalées comme écart Figma au chantier de conception | Écarts Figma ci-dessous |
| Q-V3-10 | Tokens de la feuille | Vérification faite, coordination ouverte | Variables liées relevées dans Figma le 18/10/2026 sur `9290:17953` : surface `#F5F7FA`, bordure et séparateur `#E0E3E8`, texte secondaire `#595E66`, observé `#FCFCFE`, désactivé `#BEC2CC`, primaire `#0508E5`, valeur de paramètre Inter Semi Bold 13, libellé Inter Regular 14. Le gris des cadres et le violet de sélection ne sont liés à aucune variable. Les tokens du ch. 12 restent inchangés ; leur retrait ou réaffectation relève du chantier DSF | ch. 12 ; DSF |
| Q-V3-11 | Historique des côtés | Close par décision existante | RM-244 : lisibilité exigée ; la correspondance technique suit le schéma réel (spécification §9, CO-01, « stratégie technique à adapter ») | RM-244 ; ch. 09 |
| Q-V3-12 | Carte Paramètres du formulaire | Close par décision existante | D-409 vise la feuille ; la carte parent de CE-T03-04 reste inchangée | CE-T03-04 |
| Q-V3-13 | Texte « Durée totale : » de la phrase | Close par décision existante | D-409 vise la ligne de la feuille ; le texte du corpus v15 reste inchangé | ch. 10 |
| Q-V3-14 | Contrôles segmentés | Close par décision existante | D-413 (GR-01, PR-03, scénario §11.2 « sélection segmentée ») | D-413 ; CE-UI-10 |
| Q-V3-15 | Version de livraison | Close | D-421 : évolutions v3.0 incluses dans le MVP | ch. 05 ; B-092 |
| Q-V3-16 | Formats imposés | **Ouverte** | La Condition d’arrêt qui résulte d’une cible chiffrée imposée est À la cible (D-411). Sa présentation dans la feuille d’un format, valeur grisée ou ligne masquée, n’est fixée par aucune décision ; la frame `8598:30059` ne la montre pas mais omet aussi des valeurs imposées que CE-FMT-04 exige | CE-UI-10 (complément Formats) |
| Q-V3-17 | Phases (PR #370) | Coordination | Points phases décidés (D-410, D-412, D-413) ; adaptation par le chantier #370 | dependances-pr.md |
| Q-V3-19 | Place de la mention de charge dans la phrase | **Ouverte** | D-414 fixe les formes, pas la place. Lecture proposée dans la documentation, marquée « non arbitrée » : après la valeur par Série, avant la clause de pause (la parenthèse qualifie les séries) | RM-240 ; ch. 10 grammaire v15 ; CE-UI-10 |
| Q-V3-20 | Série à zéro dans la liste des charges | **Ouverte** | Une série à zéro est sans charge (RM-239) et n’affiche pas de charge en exécution (RM-241). D-414 ne dit pas si la liste l’écrit (« (charges : 0, 10, 15 kg) ») ou l’omet | RM-240 |
| Q-V3-18 | Terminologie résiduelle | Close par décisions existantes | Termes conservés comme noms de concepts ; « charge additionnelle » des formats reste une exclusion propre aux formats (D-403 ne lève que l’exclusion du ch. 04) | ch. 01, 04, 10, 12 |

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
| `8328:39072` | Avec désactivé à une seule série ; selon D-415, seule la ligne Enchainement disparaît à N = 1 | D-415 |
| `8328:36923` | Champs vides : aucune Condition d’arrêt sélectionnée ; la valeur par défaut est À la cible | D-416 |
| `8598:30059` | Tabata par exercice : Nombre de séries (8) et Pause (10 s) imposés non affichés, alors que CE-FMT-04 les présente grisés ; pas de ligne Condition d’arrêt | CE-FMT-04, D-360 |
| — | Aucune frame pour : séries identiques à l’échec (durée masquée), roulette Répétitions des séries identiques, une seule série avec Avec sans ligne Enchainement, phrase avec mention de charge | D-415, D-418, D-419, D-414 |
| 16 frames d’exécution | « Côté droit » affiché (calque « Côté courant — Côté droit ») | CO-01, D-407 |
| — | Aucune frame d’exécution avec charge ; aucun état de saisie de la charge en séries identiques | §4 écarts 2 et 4 |
| `9207:18817` | Nom hors convention (« Proposition 3 ») et barre bleue résiduelle | #370 |
| Calques de toutes les modales | Noms hérités (« Ligne — Cible », segments Avec/Sans nommés « D → G » / « Aucun », « Segmenté — Bip de cadence », « Valeur — Durée totale ») | Sans effet sur le rendu |
