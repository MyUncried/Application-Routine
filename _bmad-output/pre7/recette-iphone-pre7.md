# PRE-7 — Recette iPhone (JB, JA1, JA)

> Préparée le 24/10/2026 sur `pre7-bmad/dev` @ `050f6c99`. Aucun parcours n'est validé : la validation appartient à Hermann, sur appareil (360 / 402 / 440, iOS 26, texte agrandi).

## Ouvrir PRE-7

1. Serveur lancé depuis `C:\Dev\KODJO-BMAD-PRE7` : `APP_VARIANT=bmad npx expo start --dev-client --tunnel --scheme routine-bmad --port 8081` (le serveur PRE-6 est arrêté).
2. Sur l'iPhone, ouvrir l'application de développement **KODJO BMAD** (`com.ankusha.kodjo.bmad`, déjà installée : aucune dépendance native modifiée par PRE-7).
3. Saisir l'URL `https://rkrwpem-uncried-8081.exp.direct` (ou scanner le QR code du terminal). Si l'URL a changé après un redémarrage, lire la nouvelle dans le terminal du serveur.

## JA1 — Migration 012 (au premier lancement, une seule fois)

**Perte de données attendue** : tous les Exercices, Séances, occurrences, médias associés (lignes), Points d'arrêt, Tours et liens Séance–Étiquette existants sont supprimés. Conservés : Profil et préférences, Catégories, Zones corporelles (créations, renommages, retraits), Étiquettes.

- [ ] Au premier lancement : avis de réinitialisation affiché une fois (un avis 010 non acquitté peut apparaître d'abord).
- [ ] Profil, Catégories, Zones corporelles et Étiquettes identiques à avant.
- [ ] Catalogue et Séances vides ; création d'un Exercice et d'une Séance possible.
- [ ] Second lancement : aucun avis, aucune donnée perdue.

## JB — Éditeur d'Exercice (B.1 à B.3)

- [ ] B3/B4/B6/B7 : hauteurs communes de 32, rayons ; marges 12 des options Séries jusqu'à « 99 séries variables » à 360 ; Pause, Pause entre les côtés, Compte à rebours, Fin alignés à droite, fermés et ouverts ; chevron sans cadre de Durée de l'exercice.
- [ ] B1 : invite « Étape suivante » seulement Description active ; invite de première étape au repos si vide.
- [ ] B2 : « À l'objectif » / « À l'objectif et à l'échec » (cas mixte, texte agrandi).
- [ ] B8 : « 3 s » dans l'option Cadence ; nouvel appui rouvre le stepper.
- [ ] B10 : séries variables, colonne Charge en Sans avec tirets gris ; passage à Avec.
- [ ] B5 : déroulant Changement de côté (146 × 88, deux rangées) ; notation contenue dans l'option après fermeture et réouverture de la Feuille ; toucher extérieur ; VoiceOver.
- [ ] B9 : barre du clavier à quatre emplacements égaux (réservé quand À l'échec ne s'applique pas), Fermer bleu, flèches seules à 360 ; texte agrandi.

## JA — MFN (A2.1 à A4.1)

- [ ] Phases : croix à deux phases → Sans, Annuler ; « — » rouge pâle tant qu'une durée manque, ✓ indisponible.
- [ ] Occurrence de Séance : structure des phases et contenu verrouillés ; création locale modifiable jusqu'au premier enregistrement.
- [ ] Exercice du Catalogue « déjà utilisé » : question d'identité à 3 choix après changement de nom / description / média / structure ; étape « Durées manquantes » pour les Exercices frères (Passer).
- [ ] Création : suggestion de geste à la fin de saisie du nom ; « Rechercher un geste » (gestes locaux compris) ; même geste (contenu en lecture seule + crayon), variante, indépendant ; Annuler sans résidu ; depuis une Séance.
- [ ] Niveau : pastille dans la rangée de classification ; popover natif « Changer de niveau / Ajouter un niveau » ; niveau ajouté après l'origine ; « Réordonner les niveaux » (glisser, Monter / Descendre, VoiceOver).
- [ ] Catalogue et sélection : Exercices d'un même geste contigus ; sélection multiple insérée dans l'ordre affiché ; frère incomplet « Paramètres à compléter. », Continuer désactivé ; duplication en Composition « (copie) ».
