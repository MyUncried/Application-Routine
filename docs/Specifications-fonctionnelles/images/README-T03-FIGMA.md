# Registre des évidences Figma — captures embarquées de la documentation

Les captures de référence de la documentation sont stockées physiquement dans ce répertoire afin de rester visibles après export/import. Les liens Markdown utilisent exclusivement des chemins relatifs vers ces fichiers ; aucune URL temporaire Figma n’est requise pour afficher les images.

Fichier Figma source : `G6RY5Ebhgwb4AHIOYDwwvg`. Pages : `Prototype MVP` (`510:101`) et `Design system — Fondations` (`2291:2`).

Ce registre couvre l’ensemble des preuves visuelles référencées par `06 – Ecrans et navigation de la V1.md` et `13 – Contrats d’écran.md`. La numérotation `N°` est celle du chapitre 06 et fait autorité.

## 1. Convention d’export

- **Écrans mobiles** : export PNG à l’échelle native de la frame, soit `402 × 874 px`. Aucun export `×2` n’est produit pour un écran complet.
- **Preuves de composant** : format naturel de la frame, à l’échelle explicitement demandée. `status-badge-composant.png` est un export PNG `×2` (`687 × 64 pt` → `1374 × 128 px`).
- **Affichage documentaire** : `260 px` de largeur pour une capture isolée, `220 px` en cellule de tableau, largeur dédiée pour une preuve de composant. Le ratio natif est toujours conservé.

## 2. Statuts utilisés

- `COURANT` : le fichier a été réexporté depuis le node Figma courant, existe physiquement, ses dimensions ont été mesurées, son contenu a été contrôlé visuellement et sa référence Markdown est valide.
- `SUPERSEDED` : conservé physiquement pour traçabilité, remplacé comme preuve courante par un autre fichier.
- `HISTORIQUE` : conservé physiquement, sans node source dans le Figma courant.
- `À CLARIFIER` : aucune correspondance certaine avec une frame du Figma courant.

Un statut ne peut pas devenir `COURANT` au seul motif qu’un fichier du même nom existe.

## 3. Inventaire des preuves courantes — contrôle du 16 septembre 2026

| N° | Titre | Node Figma | Fichier | Dimensions | Type | Statut |
| --- | --- | ---: | --- | --- | --- | --- |
| Écran 0 | Splash KODJO | `1992:469` | `ecran-0-splash-kodjo.png` | `402 × 874` | écran | COURANT — réexporté le 28/09/2026 |
| Écran 1 | Profil — Vue d’ensemble (Vibration désactivée) | `1992:375` | `ecran-1-profil.png` | `402 × 874` | écran | COURANT |
| Écran 1a | Profil — Modifier le profil | `1992:778` | `ecran-1a-modifier-profil.png` | `402 × 874` | écran | COURANT |
| Écran 1b | Vibration activée | `1992:684` | `ecran-1b-profil-vibration-activee.png` | `402 × 874` | écran | COURANT |
| Écran 1c | Sélecteur du compte à rebours | `1992:474` | `ecran-1c-profil-compte-rebours-ouvert.png` | `402 × 874` | écran | COURANT |
| Écran 1d | Sélecteur de fin de séance | `1992:579` | `ecran-1d-profil-fin-seance-ouverte.png` | `402 × 874` | écran | COURANT |
| Écran 1e | Profil d’un parcours encore vide | `2139:86` | `ecran-1e-profil-parcours-vide.png` | `402 × 874` | écran | COURANT |
| Écran 2 | Catalogue des séances — Liste par défaut | `1992:9910` | `ecran-2-catalogue-seances.png` | `402 × 874` | écran | COURANT |
| Écran 2a | Recherche globale — Résultats affichés | `1992:10320` | `ecran-2a-recherche-globale-resultats.png` | `402 × 874` | écran | COURANT |
| Écran 2b | Séance déployée | `1992:10014` | `ecran-2b-catalogue-seance-deployee.png` | `402 × 874` | écran | COURANT |
| Écran 2c | Champ de recherche déployé | `1992:10129` | `ecran-2c-recherche-globale-champ.png` | `402 × 874` | écran | COURANT |
| Écran 2d | Carte condensée avec actions | `1992:10518` | `ecran-2d-catalogue-condense-actions.png` | `402 × 874` | écran | COURANT |
| Écran 2e | Carte déployée avec actions | `1992:10628` | `ecran-2e-catalogue-deployee-actions.png` | `402 × 874` | écran | COURANT |
| Écran 2f | Liste des Séances archivées | `1992:10749` | `ecran-2f-catalogue-archivees.png` | `402 × 874` | écran | COURANT |
| Écran 2g | Séance restaurée | `1992:10848` | `ecran-2g-catalogue-seance-restauree.png` | `402 × 874` | écran | COURANT |
| Écran 2h | Catalogue après archivage | `1992:10937` | `ecran-2h-catalogue-apres-archivage.png` | `402 × 874` | écran | COURANT |
| Écran 2i | Catalogue des séances — État vide | `2117:86` | `ecran-2i-catalogue-vide.png` | `402 × 874` | écran | COURANT |
| Écran 3 | Composition d’une séance | `2028:11700` | `ecran-3-composition-seance.png` | `402 × 874` | écran | COURANT |
| Écran 3a | Composition — Actions glissées | `2028:11808` | `ecran-3a-composition-actions-glissees.png` | `402 × 874` | écran | COURANT |
| Écran 3b | Composition initiale | `2028:11137` | `ecran-3b-composition-etat-initial.png` | `402 × 874` | écran | COURANT |
| Écran 3c | Nom renseigné | `2028:12003` | `ecran-3c-composition-nom-renseigne.png` | `402 × 874` | écran | COURANT |
| Écran 3d | Palette de couleurs ouverte | `2028:11921` | `ecran-3d-composition-couleur-ouverte.png` | `402 × 874` | écran | COURANT |
| Écran 3e | Compte à rebours ouvert | `2028:11375` | `ecran-3e-composition-compte-rebours-ouvert.png` | `402 × 874` | écran | COURANT |
| Écran 3f | Fin de séance ouverte | `2028:11457` | `ecran-3f-composition-fin-seance-ouverte.png` | `402 × 874` | écran | COURANT |
| Écran 3g | Nombre de Tours | `2028:11580` | `ecran-3g-composition-nombre-tours.png` | `402 × 874` | écran | HISTORIQUE — non affiché comme référence active |
| Écran 3h | Appui long — carte soulevée | `3518:4576` | `ecran-3h-composition-appui-long.png` | `402 × 874` | écran | COURANT |
| Écran 4 | Activité — Durée / Pause / Séries | `3542:4656` | `ecran-4-creation-activite-duree.png` | `402 × 874` | écran | COURANT |
| Écran 4a | Mode Répétitions | `3561:4695` | `ecran-4a-creation-activite-repetitions.png` | `402 × 874` | écran | COURANT |
| Écran 4b | Mode À l’échec | `3561:7802` | `ecran-4b-creation-activite-a-l-echec.png` | `402 × 874` | écran | COURANT |
| Écran 4c | Durée ouverte | `3556:7645` | `ecran-4c-creation-activite-duree-ouverte.png` | `402 × 874` | écran | COURANT |
| Écran 4d | Pause ouverte | `3556:7712` | `ecran-4d-creation-activite-pause-ouverte.png` | `402 × 874` | écran | COURANT |
| Écran 4e | Nombre de Séries ouvert | `3556:7801` | `ecran-4e-creation-activite-series-ouvert.png` | `402 × 874` | écran | COURANT |
| Écran 4f | Répétitions ouvertes | `3561:7673` | `ecran-4f-creation-activite-repetitions-ouvert.png` | `402 × 874` | écran | COURANT |
| Écran 4g | Description déployée | `3553:4704` | `ecran-4g-creation-activite-description.png` | `402 × 874` | écran | COURANT |
| Écran 4h | Zone corporelle déployée | `3553:4768` | `ecran-4h-creation-activite-zone-corporelle.png` | `402 × 874` | écran | COURANT |
| Écran 4i | Séries pilote | `3580:4733` | `ecran-4i-creation-activite-series-pilote.png` | `402 × 874` | écran | COURANT |
| Écran 4j | Durée totale pilote | `3580:4845` | `ecran-4j-creation-activite-duree-totale-pilote.png` | `402 × 874` | écran | COURANT |
| Écran 4k | Durée ajustée | `3580:4957` | `ecran-4k-creation-activite-duree-ajustee.png` | `402 × 874` | écran | COURANT |
| Écran 6 | Composition séance — Étiquettes | `2028:11204` | `ecran-6-categories-seance.png` | `402 × 874` | écran | COURANT — binaire historique à ne pas substituer à Figma |
| Écran 6a | Composition séance — Nouvelle étiquette | `4640:6308` | `ecran-6a-categories-nouvelle-inline.png` | `402 × 874` | écran | COURANT — binaire historique à ne pas substituer à Figma |
| Écran 7 | Calendrier — Jour | `1992:5510` | `ecran-7-calendrier-jour.png` | `402 × 874` | écran | COURANT |
| Écran 7a | Calendrier — Semaine | `1992:5101` | `ecran-7a-calendrier-semaine.png` | `402 × 874` | écran | COURANT |
| Écran 7b | Calendrier — Mois | `1992:5237` | `ecran-7b-calendrier-mois.png` | `402 × 874` | écran | COURANT |
| Écran 7c | Appui long en vue Jour | `1992:5602` | `ecran-7c-calendrier-jour-appui-long.png` | `402 × 874` | écran | COURANT |
| Écran 7d | Choix de la Séance | `1992:6249` | `ecran-7d-calendrier-choisir-seance.png` | `402 × 874` | écran | COURANT |
| Écran 7e | Créneau à planifier | `1992:5794` | `ecran-7e-calendrier-creneau-a-planifier.png` | `402 × 874` | écran | COURANT |
| Écran 7f | Jour après planification | `1992:5697` | `ecran-7f-calendrier-jour-apres-planification.png` | `402 × 874` | écran | COURANT |
| Écran 7g | Jour suivant | `2059:267` | `ecran-7g-calendrier-jour-suivant.png` | `402 × 874` | écran | COURANT |
| Écran 7h | Semaine, mardi sélectionné | `2252:86` | `ecran-7h-calendrier-semaine-mardi.png` | `402 × 874` | écran | COURANT |
| Écran 7i | Séance hebdomadaire déployée | `1992:6389` | `ecran-7i-calendrier-semaine-deployee.png` | `402 × 874` | écran | COURANT |
| Écran 7j | Actions glissées | `1992:5962` | `ecran-7j-calendrier-semaine-actions.png` | `402 × 874` | écran | COURANT |
| Écran 7k | Actions sur Étirements | `2094:86` | `ecran-7k-calendrier-etirements-actions.png` | `402 × 874` | écran | COURANT |
| Écran 7l | Après suppression | `2074:86` | `ecran-7l-calendrier-apres-suppression.png` | `402 × 874` | écran | COURANT |
| Écran 7m | Calendrier vide | `2128:86` | `ecran-7m-calendrier-vide.png` | `402 × 874` | écran | COURANT |
| Écran 8 | Planifier une séance — Création | `1992:6838` | `ecran-8-planifier-seance.png` | `402 × 874` | écran | COURANT |
| Écran 8a | Date ouverte | `1992:6622` | `ecran-8a-planifier-date-ouverte.png` | `402 × 874` | écran | COURANT |
| Écran 8b | Heure ouverte | `1992:7006` | `ecran-8b-planifier-heure-ouverte.png` | `402 × 874` | écran | HISTORIQUE — non affiché comme référence active |
| Écran 8c | Rappel personnalisé ouvert | `1992:7187` | `ecran-8c-planifier-rappel-ouvert.png` | `402 × 874` | écran | COURANT |
| Écran 8d | Rappel personnalisé sélectionné | `1992:7369` | `ecran-8d-planifier-rappel-selectionne.png` | `402 × 874` | écran | COURANT |
| Écran 8e | Nombre de semaines ouvert | `1992:7537` | `ecran-8e-planifier-semaines-ouvert.png` | `402 × 874` | écran | COURANT |
| Écran 8f | Aucune répétition | `1992:7716` | `ecran-8f-planifier-sans-repetition.png` | `402 × 874` | écran | COURANT |
| Écran 8g | Changer la Séance | `1992:7861` | `ecran-8g-planifier-changer-seance.png` | `402 × 874` | écran | COURANT |
| Écran 9 | Exécution de séance — Groupes d’information | `1992:8132` | `ecran-9-execution-seance.png` | `402 × 874` | écran | COURANT |
| Écran 9a | Avant démarrage | `1992:8626` | `ecran-9a-execution-etat-initial.png` | `402 × 874` | écran | COURANT |
| Écran 9b | Sons et annonces désactivés | `1992:8530` | `ecran-9b-execution-sons-annonces-desactives.png` | `402 × 874` | écran | COURANT |
| Écran 10 | Synthèse de séance — Ressenti sélectionné | `1992:8780` | `ecran-10-synthese-seance.png` | `402 × 874` | écran | COURANT |
| Écran 10a | Synthèse de séance — Évaluation initiale | `1992:8718` | `ecran-10a-synthese-evaluation-initiale.png` | `402 × 874` | écran | COURANT |
| Écran 11 | Suivi : Séances — Liste condensée | `1992:8843` | `ecran-11-suivi-condense.png` | `402 × 874` | écran | COURANT |
| Écran 11a | Suivi : Séances — Vue déployée | `1992:8996` | `ecran-11a-suivi-deploye.png` | `402 × 874` | écran | HISTORIQUE — hors MVP (D-261/D-262) |
| Écran 11b | Suivi : Séances — État vide | `2117:190` | `ecran-11b-suivi-vide.png` | `402 × 874` | écran | COURANT |
| Écran 12 | Catalogue des Exercices — Liste | `3786:5093` | `ecran-12-catalogue-activites-liste.png` | `402 × 874` | écran | COURANT |
| Écran 13 | Ancien Catalogue des Exercices — Créer — Arbre d’actions | `3787:5148` | `ecran-13-catalogue-activites-creer-arbre.png` | `402 × 874` | écran | SUPERSEDED |
| Écran 13a | Ancien Catalogue des Séances — Créer — Arbre d’actions | `3841:8375` | `ecran-13a-catalogue-seances-creer-arbre.png` | `402 × 874` | écran | SUPERSEDED |
| Écran 14 | Composition — Sélectionner plusieurs Exercices existantes | `3789:5349` | `ecran-14-selection-activites-existantes.png` | `402 × 874` | écran | COURANT |
| Écran 15 | Créer une Activité persistante | `3879:5947` | `ecran-15-creation-activite-persistante.png` | `402 × 874` | écran | COURANT |
| Écran 15a | Modifier une Activité persistante | `3879:6079` | `ecran-15a-modification-activite-persistante.png` | `402 × 874` | écran | COURANT |
| Écran 16 | Exécution directe — Préparation fixe de 5 s | `3835:5385` | `ecran-16-preparation-directe-5-s.png` | `402 × 874` | écran | HISTORIQUE — non affiché comme référence active |
| Écran 17 | Exécution directe — En cours | `3835:5465` | `ecran-17-execution-directe-en-cours.png` | `402 × 874` | écran | HISTORIQUE — non affiché comme référence active |
| Écran 18 | Synthèse d’une Activité directe — Ressenti requis | `3836:5437` | `ecran-18-synthese-directe-ressenti-requis.png` | `402 × 874` | écran | HISTORIQUE — non affiché comme référence active |
| Écran 18a | Synthèse d’une Activité directe — Ressenti sélectionné | `3836:5503` | `ecran-18a-synthese-directe-ressenti-selectionne.png` | `402 × 874` | écran | HISTORIQUE — non affiché comme référence active |
| Modale 1 | Abandonner la création de la séance | `2028:11298` | `modale-1-abandon-creation-seance.png` | `402 × 874` | écran | COURANT |
| Modale 2 | Abandonner la création d’une Activité | `4714:6241` | `modale-2-abandon-modifications-activite.png` | `402 × 874` | écran | COURANT |
| Modale 3 | Séance archivée — Action Supprimer révélée | `2234:88` | `modale-3-seance-archivee-action-supprimer.png` | `402 × 874` | écran | COURANT |
| Modale 3a | Confirmer la suppression d’une séance archivée | `2234:189` | `modale-3a-confirmer-suppression-seance-archivee.png` | `402 × 874` | écran | COURANT |
| Modale 4 | Supprimer une planification unique | `1992:5365` | `modale-4-suppression-planification-unique.png` | `402 × 874` | écran | COURANT |
| Modale 4a | Supprimer des occurrences | `1992:6102` | `modale-4a-suppression-occurrences.png` | `402 × 874` | écran | COURANT |
| Modale 5 | Réinitialiser l’activité | `1992:8224` | `modale-5-reinitialiser-activite.png` | `402 × 874` | écran | COURANT |
| Modale 6 | Passer à l’activité suivante | `1992:8326` | `modale-6-activite-suivante.png` | `402 × 874` | écran | COURANT |
| Modale 7 | Séance en pause | `1992:8428` | `modale-7-seance-en-pause.png` | `402 × 874` | écran | COURANT |
| Composant | `Status / Badge — Source exact` | `3959:5970` | `status-badge-composant.png` | `1374 × 128` | composant | COURANT |

Les quatre fichiers `CE-ACT-EXE-02`, `CE-ACT-EXE-03`, `CE-ACT-EXE-04` et `CE-ACT-EXE-05` ont été réexportés depuis leurs nodes courants : leur binaire est strictement identique à l’existant, ils étaient donc déjà courants. Tous les autres fichiers listés ci-dessus ont vu leur binaire remplacé.

## 4. Composant transverse `Status / Badge`

Le node `3959:5970`, `Status / Badge — Source exact`, est la **preuve canonique du composant**. Il mesure `687 × 64 pt` et porte les sept variantes de la propriété `Status` dans un composant unique. Le composant n’est pas scindé et aucune variante supplémentaire n’est introduite.

| Famille sémantique | Variante | Node de variante |
| --- | --- | ---: |
| Statuts d’exécution | `Terminée` | `3959:5966` |
| Statuts d’exécution | `Partielle` | `3959:5963` |
| Statuts d’exécution | `Interrompue` | `3959:5969` |
| Statuts d’élément / provenance | `Catalogue` | `3959:5951` |
| Statuts d’élément / provenance | `Planifiée` | `3959:5954` |
| Statuts d’élément / provenance | `Exécutée` | `3959:5957` |
| Statuts d’élément / provenance | `Archivée` | `3959:5960` |

Les preuves d’usage sont distinctes de la preuve du composant et ne s’y substituent pas :

| N° | Écran | Node Figma | Fichier | Variantes visibles contrôlées |
| --- | --- | ---: | --- | --- |
| Écran 11 | Suivi — Séances — Liste condensée | `1992:8843` | `ecran-11-suivi-condense.png` | `Terminée`, `Partielle`, `Interrompue` |
| Écran 11a | Suivi — Séances — Vue déployée | `1992:8996` | `ecran-11a-suivi-deploye.png` | `Terminée`, `Partielle`, `Interrompue` | <!-- Historique hors MVP : D-261/D-262 -->
| Écran 2a | Recherche globale — Résultats affichés | `1992:10320` | `ecran-2a-recherche-globale-resultats.png` | `Catalogue`, `Planifiée`, `Exécutée`, `Archivée` |

Les sept variantes ont été contrôlées visuellement sur l’export `status-badge-composant.png`. Les variantes visibles des trois preuves d’usage ont été contrôlées visuellement sur les exports correspondants.

`ecran-2a-recherche-globale-resultats.png` était précédemment stocké en `804 × 1748 px` ; il est désormais en `402 × 874 px` conformément à la convention d’export.

## 5. Fichiers conservés sans statut courant

| Fichier | Node d’origine | Statut | Motif |
| --- | ---: | --- | --- |
| `CE-ACT-EXE-01a-catalogue-activites-liste-t03.jpg` | `3786:5093` | SUPERSEDED | Fichier de `41 × 88 px`, inexploitable comme preuve. Remplacé comme preuve courante par `ecran-12-catalogue-activites-liste.png`. Référence du chapitre 13 réorientée. |
| `CE-ACT-EXE-01b-catalogue-creer-arbre-actions-t03.jpg` | `3787:5148` | SUPERSEDED | Fichier de `41 × 88 px`, inexploitable comme preuve. Remplacé comme preuve courante par `ecran-13-catalogue-activites-creer-arbre.png`. Référence du chapitre 13 réorientée. |
| `CE-ACT-EXE-01c-catalogue-action-contextuelle-t03.jpg` | `3787:5209` | HISTORIQUE | Le node n’existe plus dans le Figma courant. Aucun remplacement n’est inventé. |
| `CE-ACT-EXE-01c-catalogue-action-contextuelle-directe.png` | `3787:5209` | HISTORIQUE | Même node disparu. Ce fichier n’est référencé par aucun document ; il est conservé en l’état, sans suppression spontanée. |
| `creation-activite-informations.png` | non documenté | HISTORIQUE | Référencé uniquement par `RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md`, document explicitement historique. Non réexporté. |
| `creation-activite-recuperation.png` | non documenté | HISTORIQUE | Idem. |
| `creation-recuperation-duree-ouverte.png` | non documenté | HISTORIQUE | Idem. |

## 6. Résolutions et point restant `À CLARIFIER`

1. **Modale d’abandon de création d’Activité.** Le Figma courant contient `4714:6241 — Modal — Abandonner la création de l’activité`. Cette frame remplace l’ancienne référence disparue `3224:4082` pour le parcours de création courant.
2. **Panneaux ouverts `Filtrer`.** Ils sont conçus et vérifiables dans Figma avec des options contextuelles selon le Catalogue. `Trier` reste visible mais disabled dans le périmètre T03.
3. **Médias Activité.** Le média associé est affiché dans la gouttière permanente de la carte du Catalogue des Exercices, sans déploiement (D-260/D-261). L’éditeur suit les frames courantes ; l’import/capture et la gestion multiple restent régis par leur périmètre propre. Voir D-195.
4. **Ancien arbre `Créer` des Catalogues.** D-187 supprime cet écran intermédiaire : `Créer` est désormais contextuel et ouvre directement la création de l’objet correspondant au Catalogue courant. Les frames `3787:5148` et `3841:8375` sont conservées comme évidences historiques/supersédées ; D-186 reste une décision historique.
5. **Écran 1e — `ecran-1e-profil-parcours-vide.png`.** L’export de la frame `2139:86`, `Profil — Vue d’ensemble — Parcours vide`, est **strictement identique** (même empreinte binaire) à l’export de la frame `1992:684`, `Profil — Vue d’ensemble - Vibration activée`. L’état « parcours vide » n’est pas visuellement distinguable dans le Figma courant. Les deux nodes existent et sont conservés tels quels.

## 7. Géométrie de la rangée Catalogue

Dans la référence Figma `402 pt`, la rangée vérifiée est :

- `Créer` : `x=31`, `108 × 32 pt` ;
- `Filtrer` : `x=147`, `108 × 32 pt` ;
- `Trier` : `x=263`, `108 × 32 pt` ;
- gaps : `8 pt` ;
- marges gauche/droite de l’ensemble : `31 pt`.

Ces coordonnées sont des **mesures d’évidence Figma pour la recette visuelle**. Elles ne constituent pas des positions absolues à reproduire en React Native. Les cibles tactiles restent ≥ `48 × 48 pt` conformément au contrat responsive/accessibilité.

La présence de la rangée `Créer / Filtrer / Trier` et l’état `disabled` de `Trier` restent contrôlés visuellement sur les états Catalogue actifs `3786:5093`, `1992:9910` et `1992:10129`. Les frames `3787:5148` et `3841:8375` ne sont plus des cibles fonctionnelles après D-187.

## 8. Éditeur Activité

`Renforcement du genou` est une **valeur de démonstration Figma**, jamais un libellé statique. Seul l’état vide `3943:6064` conserve `Nom de l’activité` comme état vide/placeholder. Les frames `3879:5947` et `3879:6079` utilisent respectivement `Étirement du quadriceps` et `Squat assisté` comme valeurs de démonstration.

Les frames historiques `3561:4695` et `3561:7802` témoignent de l’ancienne formulation D-204. La phrase active est régie par D-298/Phrase v1 : total fourni sans symbole avec cadence, ≈ sans cadence ; aucun total d’Exercice en À l’échec. Ces captures ne constituent pas la référence de l’éditeur v13.

## 9. Historique des exports

État du 15 septembre 2026 :
- le contrôle `Déployer` des cartes Activité était encore désactivé à cette date historique ; D-195 l’a rendu actif le24/09, puis D-261 l’a supprimé du MVP le03/10 ;
- le composant `Navigation / Bottom — Source exact` (`2537:214`) utilisait des dessins de destination de dimension maximale `24 pt`, recentrés dans les boîtes optiques `32 × 32 pt` ;
- les trois fichiers `CE-ACT-EXE-01a/01b/01c` avaient alors été réexportés après ces deux corrections.

État du 16 septembre 2026 — contrôle Figma :
- Figma a été contrôlé après propagation de la nouvelle rangée `Créer / Filtrer / Trier`, des états arbre, de Recherche globale et des corrections de l’éditeur Activité ;
- les copies binaires physiques n’avaient alors **pas** été déclarées réexportées.

État du 16 septembre 2026 — réexport documentaire complet :
- l’ensemble des frames référencées par le chapitre 06 a été réexporté depuis le Figma courant au format `402 × 874 px` ;
- `82` fichiers ont vu leur binaire remplacé, `4` étaient déjà identiques à l’export courant, `3` fichiers ont été ajoutés ;
- les formats non conformes `804 × 1748 px` (`13` fichiers) et `185 × 402 px` (`12` fichiers) ont été ramenés à `402 × 874 px`; les `57` autres fichiers remplacés étaient déjà au bon format mais leur contenu avait changé ;
- le composant `Status / Badge` a reçu sa preuve canonique `status-badge-composant.png` en PNG `×2` ;
- chaque export a été contrôlé visuellement avant intégration.

Figma reste la source du rendu visuel courant. Une vérification Figma ne vaut pas à elle seule preuve qu’une copie binaire documentaire a été physiquement remplacée dans le dépôt : les deux contrôles sont tracés séparément ci-dessus.


État du 21 septembre 2026 — décision D-187 :
- `Créer` devient contextuel à chaque Catalogue et ouvre directement la création de l’objet correspondant ;
- l’écran/arbre intermédiaire des Catalogues est supprimé ;
- les frames `3787:5148` et `3841:8375` et leurs captures sont conservées comme historiques/supersédées, sans suppression physique.

## Réserve D-208 — récupération

À compter du 25/09/2026, les captures montrant l’ancien modèle de récupération générique attachée à l’Activité ne font plus foi sur cet axe. D-208 impose une récupération entre côtés conditionnelle dans l’éditeur et une ligne `Récupération {durée}` systématique sous chaque occurrence de Composition, y compris `0 s`. Les captures concernées doivent être réexportées après alignement du Figma ; jusqu’alors leur statut visuel est **PARTIELLEMENT CONFORME** sur le seul axe récupération.


Les titres de famille remplacent désormais la numérotation dans le chapitre 06. Les numéros présents dans cet inventaire de fichiers sont des identifiants historiques de capture ; ils ne définissent pas de nouveaux écrans. Les PNG restent à leurs chemins d’origine.

## Réexport des cartes — 03/10/2026

36 écrans courants, exports directs402 × 874, contrôle visuel en planche et contrôle détaillé Catalogue Exercice/Suivi. Les deux déploiements historiques1992:8996/4738:6355 restent conservés, sans réexport comme cible courante.

| Node | Fichier | Empreinte Git |
|---|---|---|
| `1992:5101` | `ecran-7a-calendrier-semaine.png` | `0ca1c7d530bf92c8acb6a59945f0c0459cbfff70` |
| `1992:5365` | `modale-4-suppression-planification-unique.png` | `bd262a6a7ff3baeb928147c009a0303fa57212bc` |
| `1992:5510` | `ecran-7-calendrier-jour.png` | `f244636fa09ba76f4ea2ee5462ec4d9515c0ee2e` |
| `1992:5602` | `ecran-7c-calendrier-jour-appui-long.png` | `7d4545147c23834526da74d4922827fb2576950d` |
| `1992:5697` | `ecran-7f-calendrier-jour-apres-planification.png` | `fee928c4e02b4ff65fc5b33468fd51533d600311` |
| `1992:5794` | `ecran-7e-calendrier-creneau-a-planifier.png` | `4e76623e7799ab52735808ec8f2987cb35af359b` |
| `1992:5962` | `ecran-7j-calendrier-semaine-actions.png` | `777be1a8cd21ec7d71dfce49472a42b91ff2cc42` |
| `1992:6102` | `modale-4a-suppression-occurrences.png` | `7fe6f7b619f880788e647de995c4ed76ec1b9be6` |
| `1992:6249` | `ecran-7d-calendrier-choisir-seance.png` | `3ad6ee4f308c71a66d9e9ba35d39f257034358a7` |
| `1992:6389` | `ecran-7i-calendrier-semaine-deployee.png` | `3f0b24b221f6ed22a7fa6768d204ecdd8113c7e6` |
| `1992:7861` | `ecran-8g-planifier-changer-seance.png` | `babd00ec27c68fedf832b44b4173f78a022a46e8` |
| `1992:8843` | `ecran-11-suivi-condense.png` | `7175acebdfa2df05d7a47dc3fae9ce5406c5fc9a` |
| `1992:9910` | `ecran-2-catalogue-seances.png` | `7f9169f212d7a6673d7f7d08acc54f6e5ab4ab6d` |
| `1992:10014` | `ecran-2b-catalogue-seance-deployee.png` | `fd124699b95f8ae7211b859500ad24231db5c47c` |
| `1992:10518` | `ecran-2d-catalogue-condense-actions.png` | `ee117ca78bbfdfc0da24abb12cce28ed291441fe` |
| `1992:10628` | `ecran-2e-catalogue-deployee-actions.png` | `72ddd098e4cee8e34f84541face514147b55452c` |
| `1992:10848` | `ecran-2g-catalogue-seance-restauree.png` | `fec2e085fc5cd936296205b56068565e14a9a290` |
| `1992:10937` | `ecran-2h-catalogue-apres-archivage.png` | `fed22b502a386e12e5ad72b70e2aff4a1796e63c` |
| `2059:267` | `ecran-7g-calendrier-jour-suivant.png` | `f94c3d3568771b8aedb6e4d2fa028bc9e8c7bf19` |
| `2074:86` | `ecran-7l-calendrier-apres-suppression.png` | `552042355fc4369dc8e2598be6434b40a8b01fc4` |
| `2094:86` | `ecran-7k-calendrier-etirements-actions.png` | `8c66fe5f7e32a7c49deb1dad9f88a219fc60cd86` |
| `2234:88` | `modale-3-seance-archivee-action-supprimer.png` | `7f46d5ca3f75c848317ac84b6c9732b7fde63fe9` |
| `2234:189` | `modale-3a-confirmer-suppression-seance-archivee.png` | `92c9c185d593ddcbd9671fc585a90223bc50d557` |
| `2252:86` | `ecran-7h-calendrier-semaine-mardi.png` | `406b0d735b3b67d3415eba04c3d0582f4d7790cf` |
| `3786:5093` | `ecran-12-catalogue-activites-liste.png` | `a2af6b3046fcd2fd2de5cffb2ac6a92fc4c473a6` |
| `3789:5349` | `ecran-14-selection-activites-existantes.png` | `6e42ebe3396f7f31d7ffa19e0713fcdca8bc35e1` |
| `4168:11149` | `figma-4168-11149.png` | `ba5a14d0c06ddcbb394586c8a3e441a49df9e13f` |
| `4168:11262` | `figma-4168-11262.png` | `47cd2f6e25af56e05a90457052a6e6c640bd223e` |
| `4593:6285` | `figma-4593-6285.png` | `c6d7b1ba41223584049b73bc771814f464b57808` |
| `4544:6344` | `figma-4544-6344.png` | `d987c34aab09b76a7fb04aa6a7fa8b6a059576cb` |
| `4544:6651` | `figma-4544-6651.png` | `cd5c125c37da5bd7081046e1af00b5333cdfbc73` |
| `4549:6382` | `figma-4549-6382.png` | `fc9bdc26f4520001bdbbdbf7b7034fd20b603957` |
| `4549:6742` | `ecran-2f-catalogue-archivees.png` | `4d58c9a2d5da36b51e3e9f987ddc582240159449` |
| `4592:6217` | `figma-4592-6217.png` | `cd20bf170b8e516d001b65f42dd49aa0e4450894` |
| `4738:6209` | `figma-4738-6209.png` | `e9aee1d08a6a50916273f1a5bc25a8fa45b71105` |
| `5451:4272` | `figma-5451-4272.png` | `34a70bcbc6948c3bf489661a9ef14ee582b254a5` |


## Corrections après audit — 04/10/2026

Douze captures courantes réexportées après correction des badges Catalogue Exercice et activation de la troncature des zones Semaine. Quatre PNG ont changé (Catalogue, deux filtres, actions glissées) ; huit sont identiques, notamment lorsque le panneau masque les badges ou que le libellé court ne nécessite pas de troncature. Les empreintes du tableau ci-dessus sont actualisées. Les deux déploiements historiques restent hors cible.
