# DSF — Bip de cadence et steppers — 07/10/2026

**Actualisation13/10 :** [DSF Deux modes et cible À l’échec](DSF-DEUX-MODES-ECHEC-2026-10-13.md) remplace les références à deux modes et complète les roulettes, cibles et totaux. Les dispositions non concernées restent applicables.

**Actualisation du 12/10 :** [DSF Circuits et contrôles du 12/10](DSF-CIRCUITS-CONTROLES-2026-10-12.md) fait autorité sur les nouveaux contrôles de séries, la nature du circuit, les volumes et la lecture seule héritée. Les mesures datées ci-dessous ne décrivent pas les états remplacés. Les règles communes sans rapport avec ces éléments restent applicables.


Complément courant à DSF Cadence et DSF Pauses/icônes ; remplace uniquement leurs dispositions incompatibles. Métier : [Bip v2](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#resultats-temporels). Aucun redesign des shells.

## Ligne Bip de cadence

Stepper0..10,0 affiché Aucun, intervalle en secondes ; actif dans les deux modes. Premier niveau x36 à largeur402, séparateur330. Position immédiatement avant Durée totale ; lorsque total omis, avant Compte à rebours/Fin. La structure commune au tableau variable reste hors tableau. Supprimer l’ancienne indentation sous Répétitions et la roulette spécifique.

Séries variables/cible/Pause sous Séries et Ordre/PC sous Changement de côté conservent x52 et séparateurs314. La suppression de Durée totale retire42px par le haut, feuille ancrée en bas ; corps défilant si taille de police/espace utile l’exige. En-tête ✕/titre/✓ et marges du shell conservés. Aucun nouveau contrôle d’exécution requis.

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

Seul le bouton touché s’anime ; nombre, fond et bouton opposé immobiles. Dilatation/retour et réduction des animations selon DSF existant. Action sans attente de fin du ressort ; un maintien ne doit pas provoquer un second tap au relâchement. Cibles tactiles44 minimum, boutons séparés, nom du champ et valeur annoncés au lecteur d’écran.

## Guidage avec phases d’exercice

Le bip reste commun à la série et ne redémarre pas au changement de phase. Transition prioritaire s’il coïncide avec son signal. Si voix activée, annoncer chaque libellé au début, première phase comprise ; le chronométrage ne l’attend pas et la nouvelle annonce interrompt la précédente. Aucune file d’annonces périmées. Les réglages sons/voix existants gardent leur portée. Placement du libellé sur le cadran et articulation avec les annonces exercice/côté à compléter dans le contrat d’exécution, sans inventer de nouveau shell.

## Contrôle et état Figma

Les24 frames portant le libellé Bip ont été relues et recapturées ; les19 modales auparavant signalées sont maintenant couvertes.7061:13383 reste supprimé. Voir la [matrice courante](MATRICE-CARTES-PHRASES-2026-10-07.md), avec captures et écarts résiduels de texte ; présence du champ ne vaut pas qualification du comportement.

Le composant Roulette Secondes existant n’est pas supprimé de la bibliothèque au seul motif que le Bip ne l’utilise plus. Réutiliser les steppers existants, aucun doublon de famille. Les phrases gardent Inter13/20 et valeurs en gras ; les276 formulations v15 gouvernent leur texte, Q-08 clos.

**Complément courant cartes :** [durée sans cadre, propriété Durée et géométrie](DSF-CARTES-DUREE-2026-10-07.md). Les276 textes v15 et les segments `{texte, gras}` sont définis dans [Phrase v1 actualisée](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrases).

**Complément v15 :** [phrases longues, conteneurs et textes de fond](DSF-PHRASES-V15-2026-10-07.md). Corpus276v15 exclusivement rédactionnel ; règles de durée et de carte conservées.
