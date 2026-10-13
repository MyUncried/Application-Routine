# PRE-3 — build et procédure appareil, correction revue 1

Opération #340. Ce document complète `procedure-appareil.md`, qui reste valable pour ses sections A à D. Il annule seulement son « Préalable bloquant » : le texte Photos est corrigé (voir `config-expo-revue1.json`).

Cette procédure ne demande **aucun** contrôle de base de données ni de calcul. Ceux-ci sont prouvés par `resultats-tests-revue1.json`.

## Candidat

- Branche `feat/pre3-exercice-20261009`, au commit de code de la correction revue 1 (hash dans le rapport `2026-10-10_PRE3-340_CORRECTION-REVUE1.md`).
- Application `1.0.0`, `runtimeVersion` `1.1.0`. Une **nouvelle build native** est nécessaire, à cause de la dépendance `expo-video` et du texte de permission compilé dans `Info.plist`.

## Build (non lancée ici, blocage décrit dans `comparaison-visuelle-revue1.md`)

```
npx eas-cli login
npx eas-cli build --profile review --platform ios
```

Le profil `review` existe dans `eas.json` (distribution interne, canal `review`, numéro de build incrémenté automatiquement). Ces commandes exigent le compte EAS et les identifiants de signature.

Installez la build une fois sur une installation propre. Installez-la aussi par-dessus une installation PRE-2 qui contient déjà des Exercices et des Séances.

## Vérifications bornées propres à la correction

| # | Étape | Attendu |
|---|---|---|
| R1 | Premier appui sur « Ajouter des photos ou vidéos » | L'invite iOS affiche « Routine accède à vos photos et vidéos pour choisir la photo de votre profil et ajouter des médias à vos exercices. » Aucune invite caméra ni micro |
| R2 | Feuille Paramètres, mode Durée, laisser une Série vide | ✓ grisé ; contour rouge sur la cellule ; message qui nomme la Série ; total « — » |
| R3 | Tableau variable : maintenir la poignée d'une ligne, la glisser de deux rangs | La ligne suit le doigt ; l'ordre final correspond à la position relâchée ; les cibles suivent la ligne |
| R4 | Durée variable avec cibles → Répétitions → Durée | En Répétitions, aucune valeur de durée n'apparaît comme cible ; au retour en Durée, les cibles d'origine reviennent |
| R5 | Tableau variable ramené à 1 Série, puis modifier le total dans son contrôle | La durée de la Série change selon le total choisi ; le message d'ajustement apparaît sous le total ; « Annuler » restitue |
| R6 | Sélectionner A, B, C dont A est une vidéo iCloud non téléchargée, appareil en mode Avion, de sorte que A échoue ; réactiver le réseau puis Réessayer | Ordre final A, B, C ; aucun doublon (si aucun échec ne peut être provoqué : noter « non provoqué », la preuve reste celle des tests) |
| R7 | Appui sur un média ; VoiceOver : balayage vertical sur un média | Feuille d'actions Retirer / Monter / Descendre, sans action impossible aux bornes ; mêmes actions annoncées pour ce média |
| R8 | Feuille Catégorie | Titre « Catégorie de l’exercice », aucune coche, sélection validée au toucher ; action « Créer » en pastille |
| R9 | Carte Catalogue d'un Exercice paramétré | Durée affichée (exacte ou « ≈ ») ou absente si elle n'est pas calculable |
| R10 | Comparaison visuelle 360 / 402 / 440 et texte agrandi, pour les écarts ouverts listés dans `comparaison-visuelle-revue1.md` | Constat oui/non par écart. Aucun PASS global |

## Compte rendu attendu

Pour chaque étape, donner le résultat (conforme ou non conforme) avec une capture en cas d'écart. Indiquer le modèle d'iPhone, la version d'iOS et le numéro de build.
