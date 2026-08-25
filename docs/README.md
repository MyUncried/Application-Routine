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
