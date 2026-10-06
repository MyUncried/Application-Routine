# Application Routine

Application mobile de création, d’exécution et de suivi de routines personnelles, développée avec React Native et Expo.

## Références du projet

- [`PRODUCT.md`](./PRODUCT.md) : synthèse fonctionnelle et périmètre du MVP.
- Obsidian : documentation fonctionnelle détaillée.
- Figma : écrans et prototype navigable de référence.

En cas de contradiction documentaire, l’ordre de priorité défini dans `PRODUCT.md` s’applique.

## Socle technique

- React Native
- Expo SDK 57
- TypeScript
- Expo Router
- iOS, Android et support web pour le développement

## Installation locale

```bash
npm install
```

## Lancer l’application

```bash
npx expo start
```

Expo affiche ensuite un QR code et les options permettant d’ouvrir l’application avec Expo Go, Android ou le navigateur web.

## Structure actuelle

```text
Application-routine/
├── app/            # routes et écrans Expo Router
├── src/components/ # composants d’interface réutilisables
├── assets/         # ressources graphiques
├── scripts/        # scripts utilitaires
├── PRODUCT.md      # référence produit synthétique
└── README.md       # utilisation du dépôt
```

La structure sera complétée progressivement avec les modèles métier, les fonctionnalités, le stockage local, le thème et les tests.

## Commandes Git courantes

```bash
git status
git add .
git commit -m "Description de la modification"
git push origin main
```

Le dossier `node_modules` est local et ne doit jamais être ajouté à GitHub.

## Références actives — Cadence et documentation du06/10/2026

1. [Paramètres v13](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md) — pauses/côtés conservés, cadence et symboles.
2. [Cadence v1](Specifications-fonctionnelles/SPECIFICATION-CADENCE-REPETITIONS-v1.md) — calculs, exécution, données et recette.
3. [Phrase v1](Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md) — grammaire et rendu ; Excel exclusivement rédactionnel.
4. [DSF courant](DSF-CADENCE-2026-10-06.md) et [matrice courante Figma](MATRICE-CADENCE-FIGMA-2026-10-06.md).
5. Chapitre06 : captures centralisées ; chapitre13 :30 contrats dont CE-UI-10,21 rubriques chacun, états et limites graphiques explicites.

v12 et v10.2 sont historiques ; leurs règles remplacées ne doivent pas être utilisées pour la cible. Les sources reçues sont conservées dans `archives/cadence-2026-10-06` ; elles ne remplacent pas cette chaîne normative consolidée.
