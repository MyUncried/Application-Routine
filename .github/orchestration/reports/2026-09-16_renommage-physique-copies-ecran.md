# 2026-09-16 — Renommage physique des copies d’écran selon la numérotation documentaire

## 1. Identification et objectif

- **Identifiant de mission** : `renommage-physique-copies-ecran`
- **Type** : correction documentaire ciblée
- **Objectif** : renommer les fichiers image physiques pour que leur nom commence par le numéro documentaire attribué par la mission `figma-evidence-refresh-chapitre-06`, puis répercuter le renommage dans toutes les références du dépôt documentaire.
- **Mission précédente** : `2026-09-16_figma-evidence-refresh-chapitre-06.md`, commit `de9ddabfd544657b1e0f6247bcf6c6e66357842e`.

## 2. Baseline

- **Branche** : `main`
- **HEAD** : `de9ddabfd544657b1e0f6247bcf6c6e66357842e` (inchangé au démarrage et à la fin, hors commit du présent rapport)
- Aucun `pull`, `reset`, `checkout`, `restore`, changement de branche ni réexport Figma.
- Aucune image n’a été régénérée : les binaires sont ceux produits par la mission précédente.

## 3. Convention appliquée

- Écrans : `ecran-<numero>-<titre-court>.png`
- Modales : `modale-<numero>-<titre-court>.png`
- Preuve de composant : nom fonctionnel sans numéro d’écran, **conservé tel quel**.

Le numéro utilisé est **strictement** celui déjà attribué dans le chapitre 06. Aucun écran n’a été renuméroté, aucun node Figma n’a été modifié.

Contrôle de forme : les 89 nouveaux noms valident tous l’expression `^(ecran|modale)-[0-9]+[a-z]?-[a-z0-9-]+\.png$`.

## 4. Périmètre traité

- **89 fichiers renommés** : 80 entrées `Écran …` (écrans principaux et sous-états) et 9 entrées `Modale …`.
- **1 preuve de composant conservée sans numéro** : `status-badge-composant.png`.
- **7 fichiers non numérotables conservés en l’état** (voir § 7).
- **218 substitutions de nom** appliquées dans 3 documents (chapitre 06 : 91, chapitre 13 : 28, registre : 99), dont **2 corrigées** après détection d’une cascade de substitution (voir § 6). Contrôle final : **216 occurrences** de noms nouveaux effectivement présentes.

## 5. Table de renommage

| Ancien nom | Nouveau nom | N° | Titre | Réf. mises à jour |
| --- | --- | --- | --- | --- |
| `splash-kodjo.png` | `ecran-0-splash-kodjo.png` | Écran 0 | Splash KODJO | 2 (06:1 REG:1) |
| `profil.png` | `ecran-1-profil.png` | Écran 1 | Profil — Vue d’ensemble (Vibration désactivée) | 2 (06:1 REG:1) |
| `modifier-profil.png` | `ecran-1a-modifier-profil.png` | Écran 1a | Profil — Modifier le profil | 2 (06:1 REG:1) |
| `profil-vibration-activee.png` | `ecran-1b-profil-vibration-activee.png` | Écran 1b | Vibration activée | 2 (06:1 REG:1) |
| `profil-compte-rebours-ouvert.png` | `ecran-1c-profil-compte-rebours-ouvert.png` | Écran 1c | Sélecteur du compte à rebours | 2 (06:1 REG:1) |
| `profil-fin-seance-ouverte.png` | `ecran-1d-profil-fin-seance-ouverte.png` | Écran 1d | Sélecteur de fin de séance | 2 (06:1 REG:1) |
| `profil-parcours-vide.png` | `ecran-1e-profil-parcours-vide.png` | Écran 1e | Profil d’un parcours encore vide | 3 (06:1 REG:2) |
| `catalogue-seances.png` | `ecran-2-catalogue-seances.png` | Écran 2 | Catalogue des séances — Liste par défaut | 2 (06:1 REG:1) |
| `recherche-globale-resultats.png` | `ecran-2a-recherche-globale-resultats.png` | Écran 2a | Recherche globale — Résultats affichés | 4 (06:1 REG:3) |
| `catalogue-seance-deployee.png` | `ecran-2b-catalogue-seance-deployee.png` | Écran 2b | Séance déployée | 2 (06:1 REG:1) |
| `recherche-globale-champ.png` | `ecran-2c-recherche-globale-champ.png` | Écran 2c | Champ de recherche déployé | 2 (06:1 REG:1) |
| `catalogue-condense-actions.png` | `ecran-2d-catalogue-condense-actions.png` | Écran 2d | Carte condensée avec actions | 2 (06:1 REG:1) |
| `catalogue-deployee-actions.png` | `ecran-2e-catalogue-deployee-actions.png` | Écran 2e | Carte déployée avec actions | 2 (06:1 REG:1) |
| `catalogue-archivees.png` | `ecran-2f-catalogue-archivees.png` | Écran 2f | Liste des Séances archivées | 2 (06:1 REG:1) |
| `catalogue-archivees-seance-restauree.png` | `ecran-2g-catalogue-seance-restauree.png` | Écran 2g | Séance restaurée | 2 (06:1 REG:1) |
| `catalogue-apres-archivage.png` | `ecran-2h-catalogue-apres-archivage.png` | Écran 2h | Catalogue après archivage | 3 (06:1 REG:2) |
| `catalogue-vide.png` | `ecran-2i-catalogue-vide.png` | Écran 2i | Catalogue des séances — État vide | 2 (06:1 REG:1) |
| `composition-seance.png` | `ecran-3-composition-seance.png` | Écran 3 | Composition d’une séance | 2 (06:1 REG:1) |
| `composition-actions-glissees.png` | `ecran-3a-composition-actions-glissees.png` | Écran 3a | Composition — Actions glissées | 4 (06:1 13:2 REG:1) |
| `composition-etat-initial.png` | `ecran-3b-composition-etat-initial.png` | Écran 3b | Composition initiale | 2 (06:1 REG:1) |
| `composition-nom-renseigne.png` | `ecran-3c-composition-nom-renseigne.png` | Écran 3c | Nom renseigné | 2 (06:1 REG:1) |
| `composition-couleur-ouverte.png` | `ecran-3d-composition-couleur-ouverte.png` | Écran 3d | Palette de couleurs ouverte | 2 (06:1 REG:1) |
| `composition-compte-rebours-ouvert.png` | `ecran-3e-composition-compte-rebours-ouvert.png` | Écran 3e | Compte à rebours ouvert | 2 (06:1 REG:1) |
| `composition-fin-seance-ouverte.png` | `ecran-3f-composition-fin-seance-ouverte.png` | Écran 3f | Fin de séance ouverte | 2 (06:1 REG:1) |
| `composition-nombre-tours.png` | `ecran-3g-composition-nombre-tours.png` | Écran 3g | Nombre de Tours | 2 (06:1 REG:1) |
| `composition-appui-long.png` | `ecran-3h-composition-appui-long.png` | Écran 3h | Appui long — carte soulevée | 2 (06:1 REG:1) |
| `creation-activite-exercice.png` | `ecran-4-creation-activite-duree.png` | Écran 4 | Activité — Durée / Pause / Séries | 2 (06:1 REG:1) |
| `creation-activite-repetitions.png` | `ecran-4a-creation-activite-repetitions.png` | Écran 4a | Mode Répétitions | 2 (06:1 REG:1) |
| `creation-activite-a-l-echec.png` | `ecran-4b-creation-activite-a-l-echec.png` | Écran 4b | Mode À l’échec | 2 (06:1 REG:1) |
| `creation-activite-duree-ouverte.png` | `ecran-4c-creation-activite-duree-ouverte.png` | Écran 4c | Durée ouverte | 2 (06:1 REG:1) |
| `creation-activite-pause-ouverte.png` | `ecran-4d-creation-activite-pause-ouverte.png` | Écran 4d | Pause ouverte | 2 (06:1 REG:1) |
| `creation-activite-series-ouvert.png` | `ecran-4e-creation-activite-series-ouvert.png` | Écran 4e | Nombre de Séries ouvert | 2 (06:1 REG:1) |
| `creation-activite-repetitions-ouvert.png` | `ecran-4f-creation-activite-repetitions-ouvert.png` | Écran 4f | Répétitions ouvertes | 2 (06:1 REG:1) |
| `creation-activite-description.png` | `ecran-4g-creation-activite-description.png` | Écran 4g | Description déployée | 2 (06:1 REG:1) |
| `creation-activite-zone-corporelle.png` | `ecran-4h-creation-activite-zone-corporelle.png` | Écran 4h | Zone corporelle déployée | 2 (06:1 REG:1) |
| `creation-activite-series-pilote.png` | `ecran-4i-creation-activite-series-pilote.png` | Écran 4i | Séries pilote | 2 (06:1 REG:1) |
| `creation-activite-duree-totale-pilote.png` | `ecran-4j-creation-activite-duree-totale-pilote.png` | Écran 4j | Durée totale pilote | 2 (06:1 REG:1) |
| `creation-activite-duree-ajustee.png` | `ecran-4k-creation-activite-duree-ajustee.png` | Écran 4k | Durée ajustée | 2 (06:1 REG:1) |
| `categories-seance.png` | `ecran-6-categories-seance.png` | Écran 6 | Catégories de la séance | 5 (06:1 13:3 REG:1) |
| `categories-nouvelle-inline.png` | `ecran-6a-categories-nouvelle-inline.png` | Écran 6a | Catégories — Nouvelle catégorie inline | 2 (06:1 REG:1) |
| `calendrier-jour.png` | `ecran-7-calendrier-jour.png` | Écran 7 | Calendrier — Jour | 2 (06:1 REG:1) |
| `calendrier-semaine.png` | `ecran-7a-calendrier-semaine.png` | Écran 7a | Calendrier — Semaine | 2 (06:1 REG:1) |
| `calendrier-mois.png` | `ecran-7b-calendrier-mois.png` | Écran 7b | Calendrier — Mois | 2 (06:1 REG:1) |
| `calendrier-jour-appui-long.png` | `ecran-7c-calendrier-jour-appui-long.png` | Écran 7c | Appui long en vue Jour | 2 (06:1 REG:1) |
| `calendrier-choisir-seance.png` | `ecran-7d-calendrier-choisir-seance.png` | Écran 7d | Choix de la Séance | 2 (06:1 REG:1) |
| `calendrier-creneau-a-planifier.png` | `ecran-7e-calendrier-creneau-a-planifier.png` | Écran 7e | Créneau à planifier | 2 (06:1 REG:1) |
| `calendrier-jour-apres-planification.png` | `ecran-7f-calendrier-jour-apres-planification.png` | Écran 7f | Jour après planification | 2 (06:1 REG:1) |
| `calendrier-jour-suivant.png` | `ecran-7g-calendrier-jour-suivant.png` | Écran 7g | Jour suivant | 2 (06:1 REG:1) |
| `calendrier-semaine-mardi.png` | `ecran-7h-calendrier-semaine-mardi.png` | Écran 7h | Semaine, mardi sélectionné | 2 (06:1 REG:1) |
| `calendrier-semaine-deployee.png` | `ecran-7i-calendrier-semaine-deployee.png` | Écran 7i | Séance hebdomadaire déployée | 2 (06:1 REG:1) |
| `calendrier-semaine-actions.png` | `ecran-7j-calendrier-semaine-actions.png` | Écran 7j | Actions glissées | 2 (06:1 REG:1) |
| `calendrier-etirements-actions.png` | `ecran-7k-calendrier-etirements-actions.png` | Écran 7k | Actions sur Étirements | 2 (06:1 REG:1) |
| `calendrier-apres-suppression.png` | `ecran-7l-calendrier-apres-suppression.png` | Écran 7l | Après suppression | 2 (06:1 REG:1) |
| `calendrier-vide.png` | `ecran-7m-calendrier-vide.png` | Écran 7m | Calendrier vide | 2 (06:1 REG:1) |
| `planifier-seance.png` | `ecran-8-planifier-seance.png` | Écran 8 | Planifier une séance — Création | 2 (06:1 REG:1) |
| `planifier-date-ouverte.png` | `ecran-8a-planifier-date-ouverte.png` | Écran 8a | Date ouverte | 2 (06:1 REG:1) |
| `planifier-heure-ouverte.png` | `ecran-8b-planifier-heure-ouverte.png` | Écran 8b | Heure ouverte | 2 (06:1 REG:1) |
| `planifier-rappel-ouvert.png` | `ecran-8c-planifier-rappel-ouvert.png` | Écran 8c | Rappel personnalisé ouvert | 2 (06:1 REG:1) |
| `planifier-rappel-selectionne.png` | `ecran-8d-planifier-rappel-selectionne.png` | Écran 8d | Rappel personnalisé sélectionné | 2 (06:1 REG:1) |
| `planifier-semaines-ouvert.png` | `ecran-8e-planifier-semaines-ouvert.png` | Écran 8e | Nombre de semaines ouvert | 2 (06:1 REG:1) |
| `planifier-sans-repetition.png` | `ecran-8f-planifier-sans-repetition.png` | Écran 8f | Aucune répétition | 2 (06:1 REG:1) |
| `planifier-changer-seance.png` | `ecran-8g-planifier-changer-seance.png` | Écran 8g | Changer la Séance | 2 (06:1 REG:1) |
| `execution-seance.png` | `ecran-9-execution-seance.png` | Écran 9 | Exécution de séance — Groupes d’information | 2 (06:1 REG:1) |
| `execution-etat-initial.png` | `ecran-9a-execution-etat-initial.png` | Écran 9a | Avant démarrage | 2 (06:1 REG:1) |
| `execution-bips-vocal-desactives.png` | `ecran-9b-execution-sons-annonces-desactives.png` | Écran 9b | Sons et annonces désactivés | 2 (06:1 REG:1) |
| `synthese-seance.png` | `ecran-10-synthese-seance.png` | Écran 10 | Synthèse de séance — Ressenti sélectionné | 2 (06:1 REG:1) |
| `synthese-evaluation-initiale.png` | `ecran-10a-synthese-evaluation-initiale.png` | Écran 10a | Synthèse de séance — Évaluation initiale | 2 (06:1 REG:1) |
| `suivi-condense.png` | `ecran-11-suivi-condense.png` | Écran 11 | Suivi : Séances — Liste condensée | 6 (06:1 13:3 REG:2) |
| `suivi-deploye.png` | `ecran-11a-suivi-deploye.png` | Écran 11a | Suivi : Séances — Vue déployée | 6 (06:1 13:3 REG:2) |
| `suivi-vide.png` | `ecran-11b-suivi-vide.png` | Écran 11b | Suivi : Séances — État vide | 2 (06:1 REG:1) |
| `CE-ACT-EXE-01a-catalogue-activites-liste.png` | `ecran-12-catalogue-activites-liste.png` | Écran 12 | Catalogue des Activités — Liste | 5 (06:1 13:2 REG:2) |
| `CE-ACT-EXE-01b-catalogue-creer-arbre-actions.png` | `ecran-13-catalogue-activites-creer-arbre.png` | Écran 13 | Catalogue des Activités — Créer — Arbre d’actions | 5 (06:1 13:2 REG:2) |
| `catalogue-seances-creer-arbre-actions.png` | `ecran-13a-catalogue-seances-creer-arbre.png` | Écran 13a | Catalogue des Séances — Créer — Arbre d’actions | 2 (06:1 REG:1) |
| `CE-COMP-SEL-01-selection-activites-existantes.png` | `ecran-14-selection-activites-existantes.png` | Écran 14 | Composition — Sélectionner plusieurs Activités existantes | 5 (06:1 13:3 REG:1) |
| `creation-activite-persistante-creation.png` | `ecran-15-creation-activite-persistante.png` | Écran 15 | Créer une Activité persistante | 2 (06:1 REG:1) |
| `creation-activite-persistante-modification.png` | `ecran-15a-modification-activite-persistante.png` | Écran 15a | Modifier une Activité persistante | 2 (06:1 REG:1) |
| `CE-ACT-EXE-02-preparation-5-s.png` | `ecran-16-preparation-directe-5-s.png` | Écran 16 | Exécution directe — Préparation fixe de 5 s | 5 (06:1 13:3 REG:1) |
| `CE-ACT-EXE-03-execution-en-cours.png` | `ecran-17-execution-directe-en-cours.png` | Écran 17 | Exécution directe — En cours | 5 (06:1 13:3 REG:1) |
| `CE-ACT-EXE-04-synthese-ressenti-requis.png` | `ecran-18-synthese-directe-ressenti-requis.png` | Écran 18 | Synthèse d’une Activité directe — Ressenti requis | 4 (06:1 13:2 REG:1) |
| `CE-ACT-EXE-05-synthese-ressenti-selectionne.png` | `ecran-18a-synthese-directe-ressenti-selectionne.png` | Écran 18a | Synthèse d’une Activité directe — Ressenti sélectionné | 4 (06:1 13:2 REG:1) |
| `abandon-creation.png` | `modale-1-abandon-creation-seance.png` | Modale 1 | Abandonner la création de la séance | 2 (06:1 REG:1) |
| `activite-abandon-modifications.png` | `modale-2-abandon-modifications-activite.png` | Modale 2 | Abandonner les modifications d’une Activité | 4 (06:2 REG:2) |
| `catalogue-archivees-actions.png` | `modale-3-seance-archivee-action-supprimer.png` | Modale 3 | Séance archivée — Action Supprimer révélée | 2 (06:1 REG:1) |
| `suppression-seance-archivee.png` | `modale-3a-confirmer-suppression-seance-archivee.png` | Modale 3a | Confirmer la suppression d’une séance archivée | 2 (06:1 REG:1) |
| `calendrier-suppression-unique.png` | `modale-4-suppression-planification-unique.png` | Modale 4 | Supprimer une planification unique | 2 (06:1 REG:1) |
| `calendrier-suppression-periodique.png` | `modale-4a-suppression-occurrences.png` | Modale 4a | Supprimer des occurrences | 2 (06:1 REG:1) |
| `execution-reinitialiser.png` | `modale-5-reinitialiser-activite.png` | Modale 5 | Réinitialiser l’activité | 2 (06:1 REG:1) |
| `execution-activite-suivante.png` | `modale-6-activite-suivante.png` | Modale 6 | Passer à l’activité suivante | 2 (06:1 REG:1) |
| `execution-pause.png` | `modale-7-seance-en-pause.png` | Modale 7 | Séance en pause | 2 (06:1 REG:1) |

Légende de la colonne « Réf. mises à jour » : `06` = chapitre 06, `13` = chapitre 13, `REG` = `images/README-T03-FIGMA.md`.

## 6. Incident détecté et corrigé pendant la mission

La substitution textuelle traitait les anciens noms du plus long au plus court, ce qui évitait qu’un nom court écrase un nom long. Ce tri ne protégeait pas contre le cas inverse : `modifier-profil.png` se termine par `profil.png`, si bien que le nouveau nom `ecran-1a-modifier-profil.png` contenait encore la chaîne `profil.png` et a été réécrit une seconde fois en `ecran-1a-modifier-ecran-1-profil.png`.

- Occurrences affectées : **2** (chapitre 06 ligne 367, registre ligne 30).
- Le **fichier physique n’a jamais été affecté** : il porte bien `ecran-1a-modifier-profil.png`.
- Correction appliquée, puis balayage exhaustif par expression régulière à la recherche de toute autre cascade `(ecran|modale)-…-(ecran|modale)-…` : **aucune autre occurrence**.

## 7. Fichiers non renommés

| Fichier | Motif |
| --- | --- |
| `status-badge-composant.png` | Preuve de composant transverse (`3959:5970`), pas un écran. Nom fonctionnel conservé conformément à la consigne. |
| `CE-ACT-EXE-01a-catalogue-activites-liste-t03.jpg` | `SUPERSEDED`, sans numéro documentaire actif. |
| `CE-ACT-EXE-01b-catalogue-creer-arbre-actions-t03.jpg` | `SUPERSEDED`, sans numéro documentaire actif. |
| `CE-ACT-EXE-01c-catalogue-action-contextuelle-t03.jpg` | `HISTORIQUE`, node `3787:5209` disparu du Figma. |
| `CE-ACT-EXE-01c-catalogue-action-contextuelle-directe.png` | `HISTORIQUE`, même node disparu. |
| `creation-activite-informations.png` | `HISTORIQUE`, cité uniquement par un rapport de conformité historique. |
| `creation-activite-recuperation.png` | `HISTORIQUE`, idem. |
| `creation-recuperation-duree-ouverte.png` | `HISTORIQUE`, idem. |

Aucun de ces fichiers ne porte de numéro documentaire dans le chapitre 06 ; leur imposer un numéro d’écran serait une invention.

## 8. Documents non modifiés et justification

Le renommage n’a été répercuté que là où un nom de fichier constitue une référence documentaire active. Les fichiers suivants citent d’anciens noms **en prose ou en commentaire**, jamais sous forme de lien Markdown : aucun lien n’est donc cassé, et les modifier réécrirait un état historique ou un fichier applicatif.

| Fichier | Nature de la mention | Décision |
| --- | --- | --- |
| `src/features/sessions/CatalogueScreen.tsx` | Commentaire de code citant `catalogue-vide.png` | **Non modifié** — fichier applicatif, hors périmètre explicite de la mission. |
| `src/features/sessions/SessionCard.tsx` | Commentaire de code citant `catalogue-seances.png` et `catalogue-condense-actions.png` | **Non modifié** — même motif. |
| `docs/RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md` | Liste de noms en texte (18 mentions) | **Non modifié** — rapport de conformité historique, aucun lien image. |
| `.github/orchestration/reports/2026-09-03_*`, `2026-09-04_*`, `2026-09-07_*` | Listes de noms en texte (24 mentions) | **Non modifié** — rapports historiques, aucun lien image. |
| `.github/orchestration/reports/2026-09-16_figma-evidence-refresh-chapitre-06.md` | Rapport de la mission précédente, déjà committé | **Non modifié** — il décrit fidèlement l’état au moment de sa production ; le présent rapport documente le renommage ultérieur. |
| `.github/orchestration/v2-slices/V2-BILAT-01/recovery-migration-*.json` | Manifestes de fichiers d’exécutions d’orchestration passées (24 mentions) | **Non modifié** — preuves d’audit d’un état passé ; les altérer falsifierait le registre. |
| `docs/Specifications-fonctionnelles/.obsidian/workspace.json` | État local de l’éditeur Obsidian (10 mentions) | **Non modifié** — artefact d’éditeur, ni documentation ni lien. |

Ce point est signalé explicitement : **trois fichiers applicatifs et plusieurs documents historiques contiennent encore les anciens noms en texte**. Aucune décision n’a été prise à votre place sur ces fichiers.

## 9. Contrôles exécutés

| Contrôle demandé | Méthode | Résultat |
| --- | --- | --- |
| Aucune ancienne référence résiduelle | Extraction de tous les tokens `*.png` / `*.jpg` des 5 documents actifs, comparaison à la table de renommage | **0 ancien nom résiduel** sur 232 occurrences, 97 noms distincts |
| Images référencées existantes | Résolution de chaque nom contre le contenu réel du répertoire | **0 introuvable** |
| Casse exacte des chemins | Comparaison stricte avec `readdirSync`, avec détection séparée des écarts de casse | **0 casse incorrecte** |
| Liens Markdown non cassés | Résolution des wikilinks et des liens relatifs des 5 documents | **126 cibles valides, 0 cassée** |
| Aucune image perdue ou dupliquée | Comptage avant/après + empreintes MD5 avant/après renommage | **97 avant, 97 après**, 0 binaire altéré |
| Cohérence du nombre d’images | Idem | 89 renommées + 8 conservées = 97 |
| Dimensions PNG inchangées | Lecture de l’en-tête IHDR après renommage | **93 fichiers `402 × 874` + 1 fichier `1374 × 128`** (94 PNG), identiques à l’état d’entrée |
| Nodes et numéros inchangés | Relecture du chapitre 06 et comparaison `N° / node / fichier` avec le registre | **89 entrées, 0 divergence** |
| Séquences interdites | Recherche de `#Uxxxx`, `\uXXXX`, caractère de remplacement | **0 occurrence** |
| Aucun fichier hors périmètre modifié | `git status --short` | Aucun fichier applicatif, script ou configuration touché |

Aucun test automatisé n’est applicable : la mission ne modifie aucun code.

## 10. Fichiers modifiés par cette mission

- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` — 91 références de nom de fichier.
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` — 28 références.
- `docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md` — 99 références.
- 89 fichiers image renommés dans `docs/Specifications-fonctionnelles/images/`.

`docs/INDEX.md` et `docs/PRODUCT.md` ne citent aucun nom de fichier image : **0 modification**, aucune n’était nécessaire.

Deux titres courts ont été ajustés plutôt que repris à l’identique, parce que l’ancien slug était devenu trompeur :

- `creation-activite-exercice.png` → `ecran-4-creation-activite-duree.png` (l’écran documente le mode `Durée`, ce que « exercice » n’exprimait pas, et aligne la famille `duree` / `repetitions` / `a-l-echec`) ;
- `execution-bips-vocal-desactives.png` → `ecran-9b-execution-sons-annonces-desactives.png` (les libellés de l’écran sont `Sons` et `Annonces vocales`).

## 11. État Git

- **HEAD de départ** : `de9ddabfd544657b1e0f6247bcf6c6e66357842e`
- Le renommage a été réalisé par renommage de système de fichiers sans passage par l’index : `git status` présente donc 87 entrées `D` (anciens noms suivis) et les nouveaux noms en `??`. Les deux fichiers `creation-activite-persistante-*` n’étaient pas encore suivis ; leur renommage n’apparaît qu’en `??`. Un `git add -A` ultérieur regroupera ces paires en renommages.
- **Aucun commit de la correction, aucun push, aucune PR**, conformément à l’instruction.
- Le présent rapport est committé seul, conformément à l’obligation de livraison documentaire de `CLAUDE.md`.

## 12. Vérifications restant à effectuer

- Rendu des images dans Obsidian après renommage (le cache de vignettes et `workspace.json` peuvent conserver les anciens chemins).
- Décision à prendre sur les trois fichiers applicatifs et les documents historiques citant encore les anciens noms en texte (§ 8).
