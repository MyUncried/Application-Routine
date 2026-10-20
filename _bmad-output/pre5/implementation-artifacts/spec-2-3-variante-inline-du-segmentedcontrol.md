---
title: 'Story 2.3 — Variante `inline` du `SegmentedControl`'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '4fb27179'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les lignes de la future Feuille (Mode, Condition d'arrêt, Phases, Type de série, Charge, Changement de côté, Enchainement, Cadence) doivent être des segmentés en ligne alignés à droite, avec chevron intérieur, police réduite ou lecture seule ; le `SegmentedControl` accepté n'offre que `standard` et `parameters`.

**Approach:** Story 2.3 de `epics.md` (AC1 à AC3, qui font foi), AD-24, QP5-06 : ajouter à `src/shared/ui/SegmentedControl.tsx` la variante `variant="inline"` et les props optionnelles `chevron` / `chevronAccessibilityLabel` / `selectedContent` (par option), `onChevronPress`, `compact`, `readOnly`, `optionWidth`, dimensions relevées sur Figma (`8328:38193`, segmentés `9230:19475`, `9230:19548`, `9230:19557`, `9230:19584`) en constantes locales nommées ; chevron = `KodjoIcon` `control-chevron-up/down` ; `standard` et `parameters` strictement inchangés ; aucun composant nouveau, aucun segmenté natif, `tokens.ts` inchangé ; tests de la variante dans `SegmentedControl.test.tsx` sans modifier les tests existants. Aucune ligne de la Feuille (hors story).

</frozen-after-approval>

## Implementation Notes

- Checkpoint : route `oneshot` (un composant partagé, ses tests ; aucune lacune d'intention, rien d'irréversible). Approbation pré-autorisée par Hermann (développement PRE-5 autorisé le 2026-10-19, enchaînement sans approbation par story).
- Relevé Figma (lecture seule, MCP, 19/10, frame `8328:38193` vérifiée) : cadre 32, marge 3, écart 2, rayon 8, sans fond ; option 26, rayon 5 ; non sélectionnée `#F5F7FA` (`colors.surface`), texte `#4A4A52` Inter Regular 12 ; sélectionnée `#5F60EE` (`colors.selection`), blanc Semi Bold 12 ; Enchainement 10 ; chevron 10 × 10, tracé 8 × 4, écart 4 ; largeurs d'option 106 / 62 / 113 / 46,4 (`INLINE_OPTION_WIDTHS`). Écart : le chevron réutilise l'icône imposée (trait ≈ 1,33 au lieu de 2 dans la frame).
- Fichiers : `src/shared/ui/SegmentedControl.tsx` (variante, props `optionWidth`, `onChevronPress`, `compact`, `readOnly` ; par option `chevron`, `chevronAccessibilityLabel`, `selectedContent`), `src/shared/ui/__tests__/SegmentedControl.test.tsx` (13 tests ajoutés, existants inchangés), `src/shared/ui/README.md`.
- Décisions : largeur connue d'avance (aucune mesure) ; zone de sélection pleine largeur sous le contenu centré, ce qui garde le chevron et le contenu fourni comme cibles distinctes ; libellé masqué à l'accessibilité (nom porté par l'onglet) ; `readOnly` = un seul élément de rôle texte « libellé, valeur », sans zone de sélection ; le rendu « violet atténué » du résultat dérivé (UX-DR2) relève de 2.4. Surprise : `interpolate` refusait une option unique (cas « À la cible et à l'échec », FR-20) → plage [0, 1], sans effet à deux options ou plus.
- Contrôles : 117 suites, 3 007 tests, `tsc` et lint verts.

## Review Triage Log

Passe 1 (2026-10-19) — Blind Hunter.

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| 1 | Fins de ligne du fichier de test passées en LF | medium | Vérifié (diff complet du fichier). **patch** : CRLF rétabli, diff réduit aux ajouts. |
| 2 | JSDoc de `variant` et commentaire de `showIndicator` non mis à jour | low | **patch** (commentaires). |
| 3 | En-tête du composant contredit par la largeur figée d'`inline` | low | **patch** (exception documentée). |
| 4 | Props propres à `inline` ignorées en silence par les autres variantes | low | Documentées « variante `inline` seulement » ; une union discriminée ajoute une abstraction (NFR-1). Rejeté. |
| 5 | Texte agrandi non géré (géométrie fixe) | maybe-false | Géométrie imposée par Figma ; débordement à constater sur iPhone. **defer** (`deferred-work.md`). |
| 6 | Cibles tactiles < 44 (option 26, chevron ≈ 18 × 32) | medium | Réel, mais dépend de la ligne hôte (41 dans Figma) et de l'appareil. **defer**, point pour Hermann. |
| 7 | Largeur fixe sans rétrécissement sur écran étroit ; 46,4 fractionnaire | maybe-false | Mise en page des lignes en 2.4 ; **defer** avec 5. |
| 8 | Chevron d'une option indisponible garde le gris actif | low | Vérifié. **patch** : teinte `colors.disabled`, test ajouté. |
| 9 | `selectedContent` non annoncé par l'onglet | low | Le contenu fourni (stepper existant) reste accessible par lui-même ; nom d'onglet = option (« Avec »). À traiter avec le contenu réel en 2.8. Rejeté ici. |
| 10 | Tests manquants (valeur inconnue, `readOnly` + chevron, option unique) | low | **patch** : deux tests ajoutés ; option unique couverte par le test `readOnly`. Position animée : déjà couverte par les tests standard du même mécanisme. |
| 11 | `#4A4A52` répété dans les tests | false | Les tests vérifient la valeur relevée littérale, comme les tests existants (`#EAEAFF`, `#DBDEE3`). |
| 12 | README incomplet | low | Le JSDoc porte le détail. Rejeté. |
