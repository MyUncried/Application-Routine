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

## Traçabilité de la correction de l’audit du 06/10

- [Rapport de mise à jour Cadence](RAPPORT-MISE-A-JOUR-CADENCE-2026-10-06.md)
- [Provenance des exports SVG](../assets/icons/figma-current-exports.json)
- [Audit documentaire de Claude](../.github/orchestration/reports/2026-10-06_AUDIT_COMPLETUDE_COHERENCE_DOCUMENTAIRE_CADENCE_DSF.md)
- [Résolution des constats F-01 à F-15](../.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_DOCUMENTAIRE.md)

- [Vérification des repères F-09](../.github/orchestration/reports/2026-10-06_VERIFICATION_F09_REPERES.md)
- [Clarification de la référence du brief F-14](../.github/orchestration/reports/2026-10-06_CLARIFICATION_F14_BRIEF.md)
- [Audit transverse reçu de Claude](../.github/orchestration/reports/2026-10-06_AUDIT_TRANSVERSE_FINAL_DOCUMENTATION_KODJO.md)
- [Corrections G-01 à G-05 et contrôles](../.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_TRANSVERSE_DOCUMENTAIRE.md)

**Statut :** la seconde passe fonctionnelle de Claude est reçue, mais sa couverture reste partielle. Les contradictions déterminées sont corrigées dans le lot H ; les arbitrages H-03, placement du Point d’arrêt H-08 et avertissement H-09 ainsi que la source de sélection H-10 restent explicites. L’alignement total et la clôture ne sont pas déclarés.

- [Audit fonctionnel reçu](../.github/orchestration/reports/2026-10-06_AUDIT_FONCTIONNEL_CHAPITRES_CONTRATS_KODJO.md)
- [Corrections fonctionnelles et réserves](../.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_FONCTIONNEL_DOCUMENTAIRE.md)
