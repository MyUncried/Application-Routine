# Registre de correction — demande de changement du run 37214282333 (r4)

- **Origine.** Run d'implémentation `37214282333` (reprise `RESUME_DELTA` du paquet du run `37209872108`, PR #303 à `10ac761e`), arrêté en `CHANGE_REQUEST_REQUIRED`. Paquet intact de 23 fichiers, tous dans le périmètre ; contrôles jest, typescript et lint réussis.
- **Arbitrage du propriétaire (04/10/2026)** : « J'autorise l'ajout de assets/icons/label-outline.svg, exporté du composant Figma prévu, et son enregistrement dans KodjoIcon. Effectue la correction bornée du plan et la revue limitée à cet ajout, conserve le travail en cours, puis reprends l'implémentation. Aucun autre élargissement de périmètre. »
- **Constat épinglé** : `prior-findings-change-37214282333.json` (1 constat, cible `CRITERION_ID:UI-60B2C84BF572`). Il est publié par le propriétaire comme `[KODJO_V2] PLAN_CHANGE_REQUEST`, lié par l'empreinte de ce fichier.
- **Plan corrigé** : `technical-plan.md` (même répertoire). Il remplace le candidat approuvé r3 (publication `5980545085`, blob `0d0e7ce6`, revue de fermeture `5980614371`).

## 1. UI-60B2C84BF572 — icône d'étiquette au trait (R7a)

| Rubrique | Contenu |
|---|---|
| Observation | Le run `37214282333` n'a pas pu rendre l'état « sans Étiquette » de R7a : aucune icône d'étiquette au trait n'existe dans `assets/icons/` (inventaire à `10ac761e` : 26 SVG, aucun tag ou étiquette), et le périmètre approuvé ne contient aucun chemin `assets/`. |
| Exigence (source vérifiée) | Plan r3, assertion `UI-60B2C84BF572-A5905FEFAED8D` (CE-T03-16 L1609, L1677) : « sans Étiquette, le contrôle montre l'icône d'étiquette au trait, sans remplissage de couleur ». Figma `2028:11204` « Composition séance — Étiquettes » : l'action contextuelle `4916:6385` contient le composant `4916:6386` « Icône — Étiquette — cil:tag » (20 × 20). Les icônes du projet sont des SVG canoniques exportés de Figma, enregistrés dans `KodjoIcon` (précédent : silhouettes PRE-1). |
| Qualification | Lacune de périmètre du plan r3, et non décision métier : l'exigence était approuvée, mais son actif n'avait pas été prévu. L'extension est autorisée par le propriétaire et limitée à ce seul fichier. |
| Correction | Cible `assets/icons/label-outline.svg` (CREATE) et `src/shared/ui/KodjoIcon.tsx` ajoutées au critère `UI-60B2C84BF572` (`KodjoIcon.tsx` était déjà au périmètre global). L'assertion R7a désigne désormais l'actif enregistré sous `label-outline`. Paragraphe « Révision r4 » au §0 bis avec les octets exacts du fichier : 2 087 octets, sha256 `6b3a4b0c7334ce5af7bbcf6b49ceaa3b16715dda8d902d67658dd9ceba2e9da3`, blob `a573a07698cde1a368c95905678946e3e38ba2d7`. Ce sont les deux tracés de l'export vectoriel Figma de `4916:6386`, couleur `#0508E5`, normalisés au format des SVG du dépôt : attributs propres à l'export retirés, identifiant de découpe `clip0_4916_6386`. |
| Changement d'identifiant | L'identifiant de l'assertion dérive de son texte : `UI-60B2C84BF572-A5905FEFAED8D` devient **`UI-60B2C84BF572-A9605C517EBC0`**. |
| Preuve | Diff structurel r3 → r4 : 73 assertions, dont 72 identiques et 1 reformulée (ci-dessus) ; un seul critère modifié (`change_targets` + 2 chemins) ; périmètre global 95 → 96 (seul ajout : `assets/icons/label-outline.svg`) ; tests 41, inchangés. Narration : seul le paragraphe r4 et la ligne de périmètre ajoutés. |

## Conséquences directes vérifiées et acquis conservés

- Contrôles déterministes de l'assemblage : décodage, analyse d'impact à `10ac761e` (fermée en 1 itération), `APPROVED_BASE_NEW_CYCLE` sur la base approuvée r3, contrat UI (6 critères, 73 assertions), cohérence (périmètre 96, tests 41), impact vérifié.
- Toutes les corrections antérieures sont conservées : revues `5979898944` (7 constats) et `5980019179` (5 constats, fermés par `5980614371`), décisions D-265 à D-267, écarts de recette R1, R4, R5, R6, R7a, R9 et R10.
- Le travail d'implémentation en cours n'est pas touché : le paquet de 23 fichiers du run `37214282333` sera repris tel quel.
- Hors correction : aucune autre cible, aucune règle nouvelle, aucune décision métier.
