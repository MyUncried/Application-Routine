# Application Routine

## Dernière clarification — Bip de cadence

[Spécification Bip v2](Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md) · [DSF Bip/steppers](DSF-BIP-CADENCE-2026-10-07.md) · [Inventaire et captures](MATRICE-BIP-FIGMA-2026-10-07.md) · [Rapport de cohérence](REPORT-BIP-2026-10-07.md).

Bip0..10 transverse aux trois modes ; omission des durées non calculables d’Exercice ; ≥ réservé aux Séances ; pauses entre séries sans Pause terminale. Q-07 clos ; réserve rédactionnelle Q-08 sur les anciennes phrases de pauses. Cette clarification remplace les règles incompatibles du premier lot du07/10.

## Consolidation du 07/10/2026

- [Spécification Pauses et symboles](Specifications-fonctionnelles/SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md)
- [DSF — Pauses et icônes](DSF-PAUSES-ICONES-2026-10-07.md)
- [Inventaire des références Figma](MATRICE-FIGMA-2026-10-07.md)

Les documents source de Claude sont archivés sans altération ; les arbitrages D-302 à D-307 précisent les passages qui ne font pas autorité. Bip transverse0..10 ; Durée exacte, Répétitions avec bip ≈, sans bip durée omise ; contenu de récupération et trait de démarcation distingués.


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
2. [Bip v2](Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md) — calculs, exécution, données et recette.
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

**Statut :** la seconde passe fonctionnelle de Claude est reçue, mais sa couverture reste partielle. Les corrections déterminées du lot H sont reportées ; H-03 est clos par la formulation intrinsèque avec `+`, H-08 précisé par D-303 : aucune information de récupération à 0 s, trait conservé hors placement et absent pendant le choix, H-09 par l’avertissement non bloquant entre Exercices (D-301), H-10 par la coche courante vectorisée et archivée. Aucun arbitrage H-08/H-09 ne reste ouvert. La couverture partielle de l’audit ne permet pas de déclarer l’alignement fonctionnel total.

- [Audit fonctionnel reçu](../.github/orchestration/reports/2026-10-06_AUDIT_FONCTIONNEL_CHAPITRES_CONTRATS_KODJO.md)
- [Corrections fonctionnelles et réserves](../.github/orchestration/reports/2026-10-06_CORRECTIONS_AUDIT_FONCTIONNEL_DOCUMENTAIRE.md)

- [Décision rédactionnelle H-03 : pause avec +](../.github/orchestration/reports/2026-10-06_CLOTURE_H03_PHRASE_PAUSE.md)

- [Clôture H-10 : coche de sélection multiple](../.github/orchestration/reports/2026-10-06_CLOTURE_H10_COCHE_SELECTION.md)

- [Report des dernières décisions : H-08 et H-09](../.github/orchestration/reports/2026-10-06_REPORT_DECISIONS_H08_H09.md) — rectifie l’interprétation de D-238 dans les rapports antérieurs ; décisions H-03/H-10 déjà conservées.

