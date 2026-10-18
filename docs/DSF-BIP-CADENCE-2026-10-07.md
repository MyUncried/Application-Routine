# DSF — Bip de cadence et steppers — 07/10/2026

**Actualisation13/10 :** [DSF Deux modes et cible À l’échec](DSF-DEUX-MODES-ECHEC-2026-10-13.md) remplace les références à deux modes et complète les roulettes, cibles et totaux. Les dispositions non concernées restent applicables.

**Actualisation du 12/10 :** [DSF Circuits et contrôles du 12/10](DSF-CIRCUITS-CONTROLES-2026-10-12.md) fait autorité sur les nouveaux contrôles de séries, la nature du circuit, les volumes et la lecture seule héritée. Les mesures datées ci-dessous ne décrivent pas les états remplacés. Les règles communes sans rapport avec ces éléments restent applicables.

**Mise à jour du 18/10/2026 — spécification v3.0 :**
- Remplacé pour la présentation : dans « Ligne Bip de cadence », le stepper 0..10 affiché Aucun comme présentation de la ligne (D-408 : ligne Cadence Autre | 5 s | 2 s | 1 s | Sans), sa position avant Durée totale ou avant Compte à rebours (D-409 et D-413 : groupe Cadence et durée), les indentations x36/x52, les séparateurs et le retrait de 42 px (D-413 : la feuille s’adapte au contenu visible). Le libellé visible Ordre des côtés devient Enchainement (D-413). Bornes 0..10 s et pas de 1 s inchangés ; le composant Stepper reste décrit pour les champs qui l’utilisent.
- Comportements : règles RM-235 à RM-250 du chapitre 10, [Charge, côtés, cadence et condition d’arrêt — règles du 18/10/2026](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#charge-côtés-cadence-et-condition-darrêt--règles-du-18102026) (décisions D-403 à D-413 du [registre](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md#parametres-execution-20261018)) ; ce DSF n’en reprend pas l’énoncé. Les valeurs des captures restent illustratives.
- Présentation nouvelle de la feuille des paramètres (D-413 ; spécification v3.0, GR-01 et PR-01 à PR-04 ; référence 402 × 874) : quatre cadres successifs espacés de 8 px, dans l’ordre de D-413 ; contrôles segmentés alignés à droite, titres à gauche, sans enveloppe blanche ; tableaux à fond blanc sans contour, lignes de 36 px, sans boutons +/− de tableau ; Cadence en 12 px ; labels Regular, plus petits que les valeurs ; options inactives en texte gris Regular sur le fond des champs variables ; option sélectionnée selon le traitement violet existant ; saisie de la charge au clavier décimal, tableau visible au-dessus du clavier avec une marge de 12 px (D-405) ; chevrons à l’intérieur des options Variables (Type de série) et Avec (Changement de côté) (D-410) ; Durée de l’exercice avec son chevron à 12 px du libellé (D-409).
- Tokens : les valeurs correspondantes sont à relever dans Figma avant publication ; aucun nouveau token n’est défini ici.


Complément courant à DSF Cadence et DSF Pauses/icônes ; remplace uniquement leurs dispositions incompatibles. Métier : [Bip v2](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#resultats-temporels). Aucun redesign des shells.

## Ligne Bip de cadence

[remplacé par D-408, D-409 et D-413 le 18/10/2026] Stepper0..10,0 affiché Aucun, intervalle en secondes ; actif dans les deux modes. Premier niveau x36 à largeur402, séparateur330. Position immédiatement avant Durée totale ; lorsque total omis, avant Compte à rebours/Fin. La structure commune au tableau variable reste hors tableau. Supprimer l’ancienne indentation sous Répétitions et la roulette spécifique.

[remplacé par D-413 le 18/10/2026] Séries variables/cible/Pause sous Séries et Ordre/PC sous Changement de côté conservent x52 et séparateurs314. La suppression de Durée totale retire42px par le haut, feuille ancrée en bas ; corps défilant si taille de police/espace utile l’exige. En-tête ✕/titre/✓ et marges du shell conservés. Aucun nouveau contrôle d’exécution requis.

## Composant Stepper

| Geste / champ | Valeur produite |
|---|---|
| Tap simple |1 unité |
| Maintien après≈500ms | Répétition au pas1 |
| Maintien après≈2s, champ avec accélération | Prochain multiple de5 dans le sens du geste |
| Maintien après≈4s, champ avec accélération | Prochain multiple de10 dans le sens du geste |
| Relâchement ou sortie de cible | Stop immédiat, retour pas1 ; aucun pas final supplémentaire |
| Bip, Compte à rebours, Fin d’exercice | Pas1 pendant tout maintien, accélération désactivée |
| Limites | Saturation, aucun dépassement ni rebouclage |

Exemples : + depuis13 au palier5 →15 puis20 ; − depuis13 →10 puis5 ; + depuis23 au palier10 →30. L’arrondi se fait seulement lors du geste accéléré. Aucune modification à la simple ouverture d’une valeur héritée. Fréquence technique de répétition150ms conservée ; les seuils remplacent l’ancien démarrage450ms. Les roulettes ne sont pas concernées.

Les règles d’animation, d’action et d’accessibilité des steppers de ce paragraphe sont désormais énoncées au [chapitre 06, « Interface et steppers »](Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md#interface-et-steppers) (transfert G4). Leur texte n’a pas changé ; la version antérieure reste consultable dans Git (commit `e8afc61b`).

## Guidage avec phases d’exercice

Le bip reste commun à la série et ne redémarre pas au changement de phase. Transition prioritaire s’il coïncide avec son signal. Si voix activée, annoncer chaque libellé au début, première phase comprise ; le chronométrage ne l’attend pas et la nouvelle annonce interrompt la précédente. Aucune file d’annonces périmées. Les réglages sons/voix existants gardent leur portée. Placement du libellé sur le cadran et articulation avec les annonces exercice/côté à compléter dans le contrat d’exécution, sans inventer de nouveau shell.

## Contrôle et état Figma

Les24 frames portant le libellé Bip ont été relues et recapturées ; les19 modales auparavant signalées sont maintenant couvertes.7061:13383 reste supprimé. Voir la [matrice courante](MATRICE-CARTES-PHRASES-2026-10-07.md), avec captures et écarts résiduels de texte ; présence du champ ne vaut pas qualification du comportement.

Le composant Roulette Secondes existant n’est pas supprimé de la bibliothèque au seul motif que le Bip ne l’utilise plus. Réutiliser les steppers existants, aucun doublon de famille. Les phrases gardent Inter13/20 et valeurs en gras ; les276 formulations v15 gouvernent leur texte, Q-08 clos.

**Complément courant cartes :** [durée sans cadre, propriété Durée et géométrie](DSF-CARTES-DUREE-2026-10-07.md). Les276 textes v15 et les segments `{texte, gras}` sont définis dans [Phrase v1 actualisée](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrases).

**Complément v15 :** [phrases longues, conteneurs et textes de fond](DSF-PHRASES-V15-2026-10-07.md). Corpus276v15 exclusivement rédactionnel ; règles de durée et de carte conservées.
