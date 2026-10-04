# 2026-10-04 — V2-PRE-2 : correction après recette iPhone (rapport d'état, mission bloquée)

## Identifiant et objectif

- Mission : `V2-PRE-2-RECETTE-REVISION`.
- Objectif : traiter le retour de recette iPhone du propriétaire sur la livraison #303, sans `VISUAL_APPROVED` ni finalisation :
  - consigner la décision D-265 (bornes 0..60 s des défauts de Séance du Profil) ;
  - corriger les écarts justifiés au contrat par le chemin V2 ;
  - livrer sur Routine Dev.

## Branche et commit de départ

- `main` au début de la mission : `d5de8a7f`.
- Livraison retenue : PR #303, branche `kodjo/v2-v2-pre-2-37178165890`, tête `10ac761ef453f360110bf7b668b3998487b071b3`.
- Revue d'implémentation : 5976789183, APPROVE, `device_gate_required=true`.

## Périmètre demandé

Points 1 à 11 du retour de recette :
- Profil : défilement, marge basse, accès à Modifier le profil, présentation ;
- bornes 0..60 s ;
- palette Catégorie et Étiquette ;
- pastille de Catégorie ;
- rafraîchissement des Zones ;
- Étiquette ;
- garde de sortie ;
- preuves non visibles à l'écran ;
- VoiceOver ;
- livraison et checklist.

## Périmètre réellement traité

1. **État vérifié au départ.** #303 seule livraison retenue, aucune correction engagée, seul run actif le run fantôme 34748621746 du 13/09.
2. **Qualification complète des observations.** Registre `.github/orchestration/v2-slices/V2-PRE-2/recette-2026-10-04.md` (PR #305, fusion `7a51179f`).
3. **Arbitrage du propriétaire.**
   - D-265 limitée aux valeurs par défaut du Profil ; Composition inchangée, PRE-4.
   - Valeurs supérieures à 60 s conservées sans plafonnement.
   - D-265 à D-267 consignées. Sources actualisées : 07 (D-089 amendée), 13 (CE-UI-07 §5, §9, §14 ; R-02), 08 (PR #304, fusion `8710c3af`).
4. **Chemin V2 établi.**
   - Une `VISUAL_CORRECTION` serait refusée à l'admission (`verify-authorizations.js` 289–297, tête de #303 différente de la `scan_revision` du plan).
   - Elle ne clôt pas une tranche et ne porte pas un changement de contrat.
   - Chemin retenu : révision de plan `START_PLAN_REVISION` sur la PR #303 existante, avec les défauts justifiés dans le même cycle.
5. **Révision publiée et relancée une fois.**
   - Commande 5978226685, puis reprise unique 5978253884.
   - Les deux runs de planification ont échoué à la validation déterministe de la sortie du modèle.

## Constats

| Point | Qualification | Suite prévue |
|---|---|---|
| R1 Profil | Écart au contrat : pas de `ScrollView`, barre de navigation en surimpression, aucun bloc Identité ni accès à Modifier en vue | Révision |
| R2 Bornes | Décision D-265 | Révision |
| R3 Libellé et séparateurs | Décisions D-266 et D-267 | Révision |
| R4 Palette Catégorie et Étiquette | Écart au contrat : surcouche absolue qui masque les actions, clavier non géré | Révision |
| R5 Pastille de Catégorie dans l'éditeur | Écart préexistant (PRE-1) au regard de C09 926 et de Figma 6407:9702 | Révision |
| R6 Rafraîchissement des Zones | Écart introduit par PRE-2 | Révision |
| R7a Nom de l'Étiquette en Composition | Écart au contrat | Révision |
| R7b Bleu sans Étiquette | Non défaut : sources muettes, aucune couleur stockée | Aucune |
| R8 Retour sans avertissement depuis l'éditeur du Catalogue | Défaut préexistant, non régressif, hors PRE-2 (CE-T03-04 §12, éditeur du Catalogue) | Consigné |
| R9 Récupération et Pause entre les côtés | Preuves automatiques existantes listées ; deux tests d'écran manquants | Révision |
| R10 VoiceOver | Défaut partiel sur les interrupteurs et sur l'action des Étiquettes ; confinement et retour du focus à vérifier sur appareil | Révision |

## Preuves et tests

- **Plan run 37189965479** (`kodjo-v2-slice-plan`, étape « Construct V2 plan draft with OpenAI ») :
  - appel au modèle réussi (`gpt-5.6-luna`, HTTP 200, 234 420 jetons sérialisés) ;
  - refus par le décodeur : `PLAN_GENERATION_MARKER_DUPLICATION` (`scripts/kodjo/generate-ui-plan-contract.js` L153) ;
  - classification : `ORCHESTRATION_FAILURE` / `HUMAN_DECISION_REQUIRED`, sans relance automatique ;
  - artefact : `kodjo-v2-slice-plan-37189965479`, sans la réponse brute du modèle.
- **Plan run 37190167568** (reprise) :
  - appel réussi (HTTP 200, 234 721 jetons) ;
  - refus : `UI_PLAN_TARGET_INVALID: UI-103FBF8D197A: cible hors scope_allow: src/features/preferences/profilePhoto.ts` ;
  - même classification ; rien n'a été publié.
- Aucun test applicatif n'est applicable : aucun code n'a été modifié.

## Hypothèses non démontrées

- **Échec 1 :** l'origine probable est une recopie, dans la narration, de balises du plan antérieur, qui en contient beaucoup. La réponse brute n'étant pas archivée, le marqueur exact n'est pas connu.
- **Échec 2 :** en révision sur une livraison existante, le périmètre est recalculé à partir des seuls modules modifiés déclarés par le modèle. Un critère inchangé qui garde ses fichiers cibles d'origine (ici `profilePhoto.ts`, non modifié par la révision) sort donc du périmètre. Ce mécanisme n'est pas démontré dans le code de la révision.

## Modifications réalisées

- PR #304 : D-265 à D-267, chapitres 07, 13 et 08.
- PR #305 : registre de recette.
- Commentaires sur #288 : 5978226685 et 5978253884.
- Aucun fichier applicatif.

## Éléments non corrigés ou hors périmètre

- Toutes les corrections R1 à R10 : la révision n'a pas abouti.
- R8 consigné hors PRE-2.
- Pas de `VISUAL_APPROVED`, pas de finalisation, pas de build.

## Vérifications restant à effectuer sur appareil réel

L'ensemble de la recette de la future livraison corrigée, en particulier Modifier le profil (non testable sur #303), la palette (clavier affiché et masqué), le confinement et le retour du focus VoiceOver.

## Fichiers modifiés

- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`
- `.github/orchestration/v2-slices/V2-PRE-2/recette-2026-10-04.md`
- ce rapport

## Commit final et état Git

Voir le commit qui introduit ce rapport. État attendu après fusion :
- `main` à jour ;
- PR #303 ouverte et inchangée à `10ac761e` ;
- aucune opération PRE-2 active.

## Complément — diagnostic voie A (décision du propriétaire)

- **Cause démontrée du premier échec.** Le prompt « draft » de révision (`.github/workflows/kodjo-v2-slice-plan.yml` L208–211) demande un bloc texte `<KODJO_MODIFIED_MODULES_JSON>`, que le décodeur interdit dans `plan_markdown` (`scripts/kodjo/generate-ui-plan-contract.js` L153). Le prompt initial a été migré vers le champ structuré `modified_modules` (`kodjo-v2-slice-initial-plan.yml` L158), celui de la révision non.
- **Cause du second échec.** En phase draft, le périmètre est exactement `modified_modules` (`generate-ui-plan-contract.js` L154–171) et chaque `change_target` doit y figurer (`lib/ui-criteria-contract.js` L176–181). Aucune consigne n'indiquait que, pour une tranche déjà livrée, ce périmètre est cumulatif.
- **Historique.** Aucun run de `kodjo-v2-slice-plan.yml` n'a abouti dans l'historique consulté : le chemin de révision n'est pas qualifié.
- **Correctif proposé, non fusionné : PR #307.** Il porte sur le texte du prompt uniquement (décodeur, contrats et validations inchangés). Test `tests/kodjo/v2-revision-draft-prompt.pilot.js` : 3/3 ; `validate-workflows` : OK.
- **Prochaine action, conditionnée à la validation du propriétaire.** Fusion de #307, puis une seule nouvelle commande `START_PLAN_REVISION` (`resume_command_comment_id=5978226685`).

## Complément — génération après correctif #307 (troisième run)

- **Correctif #307.** Validé par le propriétaire, rejoué localement sans API par le vrai décodeur (`tests/kodjo/v2-revision-draft-replay.pilot.js`, 7/7 avec `v2-revision-draft-prompt.pilot.js`), puis fusionné (`297d334c`). Transition `7a51179f` → `main` : PASS (protocole seulement).
- **Commande.** 5978651284 (reprise de 5978226685). Run 37193280090 : appel au modèle réussi (HTTP 200, 234 871 jetons).
- **Sortie du modèle.**
  - Elle passe les deux contrôles corrigés : marqueur dans la narration, périmètre cumulatif.
  - Elle est refusée sur une troisième règle : `UI_PLAN_ASSERTION_PROOF_COVERAGE_INCOMPLETE: UI-103FBF8D197A: chaque preuve du critere doit etre allouee a au moins une assertion` (`scripts/kodjo/lib/ui-criteria-contract.js` L111).
- **Classement.** Cette règle figure dans le contrat transmis au modèle (`contractPrompt` inclut le code du validateur). Ce n'est donc pas un défaut du prompt, mais une erreur de contenu de la génération.
- **Coût.** Trois appels au modèle (environ 235 000 jetons chacun), trois refus sur trois règles différentes. La génération de cette révision par le modèle n'est pas fiable pour ce plan (6 critères, 57 assertions).
- **Arrêt sans nouvelle relance ; arbitrage demandé au propriétaire.**
  - Option recommandée : publier une révision assemblée localement, avec les mêmes contrôles déterministes, par une extension bornée de la publication vérifiée (#290/#295) aux révisions sur une livraison existante.
  - Autre option : une nouvelle tentative du modèle.
