# DSF — phrases v15 et conteneurs — 07/10/2026

Complément ciblé à DSF Bip/Cartes/Pauses ; aucun nouveau shell. [Matrice et captures](MATRICE-EVOLUTIONS-V15-2026-10-07.md). Figma relu en lecture seule sur Prototype MVP510:101.

**Mise à jour du 18/10/2026 — spécification v3.0 :**
- Remplacé pour la présentation : au §« Textes de fond et mode », le choix du Mode « par son popover » (D-413 : contrôle segmenté) ; dans « Composants déjà intégrés », « le Bip, qui est un stepper » (D-408 : ligne Cadence) ; dans « Cartes compactes de Composition », la direction propre D→G/G→D (D-407 : indicateur sans direction). Phrase, conteneurs et règles de durée sont inchangés.
- Comportements : règles RM-235 à RM-250 du chapitre 10, [Charge, côtés, cadence et condition d’arrêt — règles du 18/10/2026](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#charge-côtés-cadence-et-condition-darrêt--règles-du-18102026) (décisions D-403 à D-413 du [registre](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md#parametres-execution-20261018)) ; ce DSF n’en reprend pas l’énoncé. Les valeurs des captures restent illustratives.
- Présentation nouvelle de la feuille des paramètres (D-413 ; spécification v3.0, GR-01 et PR-01 à PR-04 ; référence 402 × 874) : quatre cadres successifs espacés de 8 px, dans l’ordre de D-413 ; contrôles segmentés alignés à droite, titres à gauche, sans enveloppe blanche ; tableaux à fond blanc sans contour, lignes de 36 px, sans boutons +/− de tableau ; Cadence en 12 px ; labels Regular, plus petits que les valeurs ; options inactives en texte gris Regular sur le fond des champs variables ; option sélectionnée selon le traitement violet existant ; saisie de la charge au clavier décimal, tableau visible au-dessus du clavier avec une marge de 12 px (D-405) ; chevrons à l’intérieur des options Variables (Type de série) et Avec (Changement de côté) (D-410) ; Durée de l’exercice avec son chevron à 12 px du libellé (D-409).
- Tokens : les valeurs correspondantes sont à relever dans Figma avant publication ; aucun nouveau token n’est défini ici.

## Phrase et conteneurs

Une seule zone interactive ouvre les paramètres. Flux Text continu, valeurs en gras, aucune interaction par segment. Inter13, interligne20, largeur324px à402px. Les conteneurs de phrase et la carte grandissent avec le contenu ; Compte à rebours/Fin puis Description suivent, sans chevauchement. Les segments techniques ne sont pas des boîtes positionnées séparément. Aucune virgule en début de ligne.

7119:27855 s’appelle **Création activité — Phrase longue (224 caractères)**. Relevé : texte100px/cinq lignes ; conteneur de carte193px, axe principalAUTO. Référence de recette, jamais hauteur maximale ou nombre maximal de caractères. À360/440, texte agrandi et lecteur d’écran, le contenu complet reste accessible. La capture permet de constater que les contrôles audio ne sont pas rognés.

Les cartes parentes agrandies de9/9b, Ordre7, N1, Résumé15, phrase longue, Modifier et Zones ne changent ni l’ordre des contrôles ni les marges du shell. Le corps peut défiler ; Terminer et actions de feuille restent accessibles selon leurs contrats.

## Textes de fond et mode

Aucun champ n’est affiché à droite de Paramètres d’exécution : le champ du **mode**, constaté sur7059:13302 et7119:27855, est retiré ; la carte forme une seule zone touchable qui ouvre la feuille, et le Mode reste visible dans la phrase et se choisit dans la feuille, [remplacé par D-413 le 18/10/2026 : contrôle segmenté] par son popover (décision PRE-4 Q23 du 16/10, D-385). Après déplacement d’une Série, la phrase suit l’ordre effectif des cibles ; les résumés bilatéraux distinguent les clauses par paire et par côté. Une cible manquante n’est pas remplacée par un nombre de démonstration : état incomplet, validation interdite.

Le parent inerte derrière une feuille suit son brouillon appliqué ; la validation applique le nouveau mode et la phrase ensemble. Le champ Durée reste dessiné derrière À l’échec sur6419:10028 : résidu connu de la maquette, non annoncé corrigé ni pris comme règle métier.

## Composants déjà intégrés

| Élément cité dans C.5 | Référence documentaire conservée |
|---|---|
| Exercice6214:7278, Durée#7344:0 | DSF Cartes : durée sans cadre, titre250px, autres lignes207px |
| Séance6214:7276, Durée#7344:11 | DSF Cartes : absence de photo, durée optionnelle |
| Valeur modifiable Normal/Grisé | DSF Cadence : quatre variantes et état désactivé |
| Roulette Secondes avec unité7130:13496 | Variante de bibliothèque conservée ; pas utilisée pour le Bip, [remplacé par D-408 le 18/10/2026 : ligne Cadence, RM-245] qui est un stepper |
| Ressenti6234:8895 | Indicateur20×20 sans action dans le Suivi ; ne réduit pas les cibles du choix en Synthèse |
| Icônes7245:13718 et7174:13554 | DSF Pauses : même tracé contour/plein, cercle inchangé ; aucune version pleine du+ prescrite |

Les compteurs82/187 de la source concernent les instances au moment du relevé de son auteur, pas le nombre de captures à renouveler. Les changements de composants du lot précédent sont déjà répercutés dans les PNG des catalogues, calendriers et compositions ; ce lot renouvelle les36références de son inventaire.

## Cartes compactes de Composition

[remplacé par D-407 le 18/10/2026 : indicateur de changement de côté sans direction, RM-243] Conserver RM-151/RM-152 : direction propre D→G/G→D, rien en unilatéral. La ligne de synthèse compacte conserve ses règles contextuelles ; aucune clause longue de la phrasev15 ni nouvelle ligne de pause n’y est injectée. Cette règle existante clôt CF3 sans inventer une nouvelle grammaire.

## Limites des preuves

139références de page, dont30blocs nommés Phrase dans les frames relues ; la source annonce31phrases avec un périmètre qui inclut une forme compacte ; la lecture ne prouve pas31blocs de phrase complète. Les brouillons incomplets illustrés ne sont pas des sorties valides parmi les276cas. Les24modales portent Bip de cadence. Le contrôle structurel et les captures portent sur Figma, pas sur le rendu applicatif ou la qualification audio.

## Raccordement Formats du 14/10/2026

Le [DSF Formats](DSF-FORMATS-SEANCES-2026-10-14.md) complète ce document : organisation Par exercice/En alternance, compte nommé selon son unité, constantes Tabata grisées mais effectives et phrases contextuelles. L’état imposé effectif conserve une valeur réelle ; ne pas lui appliquer le tiret des valeurs sans effet. Les cartes de modèles illustrées ne changent pas la règle des cartes catalogue. Les points de layout non qualifiés restent signalés dans la [revue transverse](REVUE-COHERENCE-FORMATS-2026-10-14.md).
