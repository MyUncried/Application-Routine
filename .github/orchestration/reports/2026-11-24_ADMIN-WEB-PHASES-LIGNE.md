# ADMIN-WEB-PHASES-LIGNE — Phases d'une fiche sur une seule ligne (administration web locale)

- **Mission** : reformatage de l'administration web locale KODJO (`tools/catalogue-admin/`), premier lot.
  Demande de l'utilisateur : « Mettre le texte et la durée sur une même ligne » (section Phases d'une fiche).
- **Branche** : `claude/admiring-babbage-5v0tzs` — **commit de départ** : `b074c41`.

## Périmètre
- Demandé : section « Phases (ordonnées, 6 au plus) » de l'éditeur de fiche.
- Traité : mise en page de la ligne d'une phase uniquement. Serveur, validation, révisions, données : inchangés.

## Constat
Chaque phase utilisait la classe générique `.member` (grille à deux colonnes `1fr auto`) : quatre enfants
(numéro, libellé, durée, actions) se répartissaient sur deux lignes, avec le libellé rejeté dans une étroite
colonne de droite et la durée sur toute la largeur.

## Modifications
- `app.js` (`phasesSection`) : classe supplémentaire `phase-row` sur la ligne ; texte indicatif de la durée
  raccourci en « Durée (s), facultative » (colonne plus étroite), libellé complet conservé en `aria-label`.
- `styles.css` : `.member.phase-row` = grille `1.6em | libellé 1fr | durée 120–190 px | actions`. Sous 810 px,
  libellé, durée et actions s'empilent dans la colonne de contenu, alignés sous le numéro.
- PRESERVE : comportement des boutons ↑ ↓ Retirer / Ajouter, limites de phases, saisie de durée, autres usages de
  `.member` (membres des Bibliothèques) — non touchés (sélecteur restreint à `.phase-row`).

## Synchronisation code / documentation
Classe **D — Technique** (présentation de l'outil d'administration, aucune règle métier ni contrat touché).
Documents mis à jour : aucun.

## Preuves et tests
- `node --check tools/catalogue-admin/app.js` : OK.
- Rendu vérifié par capture d'une page statique reprenant `styles.css` et le balisage d'une ligne de phase,
  à 1280 px (une ligne) et 600 px (empilé). Le serveur réel n'a pas été lancé : `node_modules` absent du conteneur
  (génération de la couche métier impossible).
- Tests `server.test.mjs` / `installation.test.mjs` : non exécutés, non concernés (aucun changement serveur).

## Hypothèses non démontrées / à vérifier
- Rendu dans l'administration réelle sur le PC (`node tools/catalogue-admin/server.mjs`), onglet Fiches, section Phases.

## Hors périmètre
- Le bouton « Ajouter une phase » occupe toute la largeur (comportement préexistant de `fieldset.section`).

## Fichiers modifiés
- `tools/catalogue-admin/app.js`
- `tools/catalogue-admin/styles.css`
- `.github/orchestration/reports/2026-11-24_ADMIN-WEB-PHASES-LIGNE.md`

## Commit final / état Git
Voir le commit de livraison qui contient ce rapport ; arbre propre après push.
