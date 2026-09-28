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
| Écran 0 | Splash KODJO | `1992:469` | `ecran-0-splash-kodjo.png` | `402 × 874` | écran | COURANT |
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
| Écran 3g | Nombre de Tours | `2028:11580` | `ecran-3g-composition-nombre-tours.png` | `402 × 874` | écran | COURANT |
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
| Écran 8b | Heure ouverte | `1992:7006` | `ecran-8b-planifier-heure-ouverte.png` | `402 × 874` | écran | COURANT |
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
| Écran 11a | Suivi : Séances — Vue déployée | `1992:8996` | `ecran-11a-suivi-deploye.png` | `402 × 874` | écran | COURANT |
| Écran 11b | Suivi : Séances — État vide | `2117:190` | `ecran-11b-suivi-vide.png` | `402 × 874` | écran | COURANT |
| Écran 12 | Catalogue des Exercices — Liste | `3786:5093` | `ecran-12-catalogue-activites-liste.png` | `402 × 874` | écran | COURANT |
| Écran 13 | Ancien Catalogue des Exercices — Créer — Arbre d’actions | `3787:5148` | `ecran-13-catalogue-activites-creer-arbre.png` | `402 × 874` | écran | SUPERSEDED |
| Écran 13a | Ancien Catalogue des Séances — Créer — Arbre d’actions | `3841:8375` | `ecran-13a-catalogue-seances-creer-arbre.png` | `402 × 874` | écran | SUPERSEDED |
| Écran 14 | Composition — Sélectionner plusieurs Exercices existantes | `3789:5349` | `ecran-14-selection-activites-existantes.png` | `402 × 874` | écran | COURANT |
| Écran 15 | Créer une Activité persistante | `3879:5947` | `ecran-15-creation-activite-persistante.png` | `402 × 874` | écran | COURANT |
| Écran 15a | Modifier une Activité persistante | `3879:6079` | `ecran-15a-modification-activite-persistante.png` | `402 × 874` | écran | COURANT |
| Écran 16 | Exécution directe — Préparation fixe de 5 s | `3835:5385` | `ecran-16-preparation-directe-5-s.png` | `402 × 874` | écran | COURANT |
| Écran 17 | Exécution directe — En cours | `3835:5465` | `ecran-17-execution-directe-en-cours.png` | `402 × 874` | écran | COURANT |
| Écran 18 | Synthèse d’une Activité directe — Ressenti requis | `3836:5437` | `ecran-18-synthese-directe-ressenti-requis.png` | `402 × 874` | écran | COURANT |
| Écran 18a | Synthèse d’une Activité directe — Ressenti sélectionné | `3836:5503` | `ecran-18a-synthese-directe-ressenti-selectionne.png` | `402 × 874` | écran | COURANT |
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
| Écran 11a | Suivi — Séances — Vue déployée | `1992:8996` | `ecran-11a-suivi-deploye.png` | `Terminée`, `Partielle`, `Interrompue` |
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
3. **Médias Activité.** Le média associé peut être affiché dans la carte déployée du Catalogue des Exercices dans le MVP. L’éditeur suit les frames courantes ; l’import/capture et la gestion multiple restent régis par leur périmètre propre. Voir D-195.
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

Selon D-204, le texte éditable distingue désormais les modes : en Répétitions, il affiche `Durée totale >= {estimation}` avec 1 seconde conventionnelle par répétition ; en À l’échec, il n’affiche pas de Durée totale. Les frames `3561:4695` et `3561:7802` matérialisent ces deux états.

## 9. Historique des exports

État du 15 septembre 2026 :
- le contrôle `Déployer` des cartes Activité était encore désactivé à cette date historique ; D-195 l’a depuis rendu actif dans le MVP pour afficher/masquer le média associé ;
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


## 10. Campagne d’export Prototype MVP — 28 septembre 2026

Les 96 PNG ci-dessous ont été rendus à partir des nodes de la matrice du 28 septembre et intégrés dans la PR #247 : 34 ajouts et 62 remplacements. Contrôle automatique réalisé : 96/96 fichiers au format PNG `402 × 874 px`, node et chemin uniques. **Statut : EXPORTÉ ; dimensions, chemins et identifiants contrôlés automatiquement ; échantillon visuel vérifié ; conformité visuelle exhaustive restant à vérifier.** Ce statut ne vaut pas `COURANT` au sens du §2 tant que le contenu et les liens n'ont pas été contrôlés visuellement.

| N° matrice | Node | Copie relative au chapitre 06 | Opération | Dimensions | SHA du contenu PNG |
|---:|---|---|---|---|---|
| 1 | `1992:375` | `ecran-1-profil.png` | Remplacement | 402 × 874 | `35e6132589469a12b3dd2fc3ce1685e083743c05` |
| 3 | `1992:474` | `ecran-1c-profil-compte-rebours-ouvert.png` | Remplacement | 402 × 874 | `4c8e218a0769058cb18a83ff9a7d40b05da31e38` |
| 4 | `1992:579` | `ecran-1d-profil-fin-seance-ouverte.png` | Remplacement | 402 × 874 | `f917e9a23ba58145933d7135fae82f58de01b551` |
| 5 | `1992:684` | `ecran-1b-profil-vibration-activee.png` | Remplacement | 402 × 874 | `bb74b14c92d1db15f21f7330f70162c851c13aa2` |
| 6 | `1992:778` | `ecran-1a-modifier-profil.png` | Remplacement | 402 × 874 | `11fe0b7cc75105c0c49b4be8ad3936b6a0797fa9` |
| 7 | `1992:5101` | `ecran-7a-calendrier-semaine.png` | Remplacement | 402 × 874 | `6eb83619579b7af86f7c9fd4fc1cd06d0e03d4fa` |
| 8 | `1992:5237` | `ecran-7b-calendrier-mois.png` | Remplacement | 402 × 874 | `6116223fcd0e80de0f8a5fee886e163c4ad86aad` |
| 9 | `1992:5365` | `modale-4-suppression-planification-unique.png` | Remplacement | 402 × 874 | `f053c9939d7b5a84b5fa4a0fd6bf757754792f7b` |
| 10 | `1992:5510` | `ecran-7-calendrier-jour.png` | Remplacement | 402 × 874 | `70205580b00e10f96d67bffacba823a17696ed9e` |
| 11 | `1992:5602` | `ecran-7c-calendrier-jour-appui-long.png` | Remplacement | 402 × 874 | `1bc028d7462572676843f4659be65f526dc087bd` |
| 12 | `1992:5697` | `ecran-7f-calendrier-jour-apres-planification.png` | Remplacement | 402 × 874 | `653a9bf00b64ae42df38e1b16ea6ae8e2e5a936c` |
| 13 | `1992:5794` | `ecran-7e-calendrier-creneau-a-planifier.png` | Remplacement | 402 × 874 | `d9ad8031fcad5f08035ecd88550c5a43024c65c4` |
| 14 | `1992:5962` | `ecran-7j-calendrier-semaine-actions.png` | Remplacement | 402 × 874 | `258c5820e35699179e00ce8e95ee7274b8cdd6cf` |
| 15 | `1992:6102` | `modale-4a-suppression-occurrences.png` | Remplacement | 402 × 874 | `748b94f8bd5a570a9216f133dc03e8c56225f0a5` |
| 16 | `1992:6249` | `ecran-7d-calendrier-choisir-seance.png` | Remplacement | 402 × 874 | `b0f5165ff00c44c4de1d71f595d035cffad31838` |
| 17 | `1992:6389` | `ecran-7i-calendrier-semaine-deployee.png` | Remplacement | 402 × 874 | `d90d0bd29732edcad0872a71b3a82a245f821a26` |
| 18 | `1992:6622` | `ecran-8a-planifier-date-ouverte.png` | Remplacement | 402 × 874 | `e1f8492e7e7b8a8c0b26eae1041ef68e40681a6b` |
| 19 | `1992:6838` | `ecran-8-planifier-seance.png` | Remplacement | 402 × 874 | `89e9f63876870511f254692bfdeaa68c668492fa` |
| 21 | `1992:7187` | `ecran-8c-planifier-rappel-ouvert.png` | Remplacement | 402 × 874 | `78f4f27901c27231141ce4d28c3e0224314fbcc2` |
| 22 | `1992:7369` | `ecran-8d-planifier-rappel-selectionne.png` | Remplacement | 402 × 874 | `fe27d7ab2440993f5a961a55007c028aff6ac36a` |
| 23 | `1992:7537` | `ecran-8e-planifier-semaines-ouvert.png` | Remplacement | 402 × 874 | `b7fd0e4f5e1e46a92d90a2fe87eea34908a9d805` |
| 24 | `1992:7716` | `ecran-8f-planifier-sans-repetition.png` | Remplacement | 402 × 874 | `b625f19b75a915ba0476a2e4dc213b6671e6c298` |
| 25 | `1992:7861` | `ecran-8g-planifier-changer-seance.png` | Remplacement | 402 × 874 | `e6af0f911d58a1a0374dec636583e010beede93d` |
| 26 | `1992:8132` | `ecran-9-execution-seance.png` | Remplacement | 402 × 874 | `c79f117df0e7c2796bddcf6ce43e40298d9d0844` |
| 27 | `1992:8224` | `modale-5-reinitialiser-activite.png` | Remplacement | 402 × 874 | `c6d0e99d37a47964ca992f03744b05506d01b820` |
| 28 | `1992:8326` | `modale-6-activite-suivante.png` | Remplacement | 402 × 874 | `db29f49d57b075ac25837bb0b8c2776af11efd7b` |
| 29 | `1992:8428` | `modale-7-seance-en-pause.png` | Remplacement | 402 × 874 | `130173331938c0603432e16a6223c6b49a01137f` |
| 30 | `1992:8530` | `ecran-9b-execution-sons-annonces-desactives.png` | Remplacement | 402 × 874 | `ccb454c6ec26b5d9442ce57046c22e835730d8f5` |
| 31 | `1992:8626` | `ecran-9a-execution-etat-initial.png` | Remplacement | 402 × 874 | `b3bf8661fe4d9007f673fb53060434ccfbd64af8` |
| 32 | `1992:8718` | `ecran-10a-synthese-evaluation-initiale.png` | Remplacement | 402 × 874 | `a0f4fc22afab5d345ead317614bf797beb765c92` |
| 33 | `1992:8780` | `ecran-10-synthese-seance.png` | Remplacement | 402 × 874 | `4937fade8ae1a80c36d57c084af17a14876debe3` |
| 34 | `4760:6448` | `figma-4760-6448.png` | Ajout | 402 × 874 | `cca20f57f76db8dd68a3d0578f2a46d658293fd7` |
| 35 | `4760:6500` | `figma-4760-6500.png` | Ajout | 402 × 874 | `5f23ef8bf1adeaded110aa1a81a7cbd4d0ce385f` |
| 36 | `1992:8843` | `ecran-11-suivi-condense.png` | Remplacement | 402 × 874 | `450194407de8608117dddea83d40304410316541` |
| 37 | `1992:8996` | `ecran-11a-suivi-deploye.png` | Remplacement | 402 × 874 | `e4d6bed2642be5bfc1d40bb07dda377fb43b0ed0` |
| 38 | `1992:9910` | `ecran-2-catalogue-seances.png` | Remplacement | 402 × 874 | `ca169321230c28320c1baa5dc5873197aa826436` |
| 39 | `1992:10014` | `ecran-2b-catalogue-seance-deployee.png` | Remplacement | 402 × 874 | `49beab80611c8f43e2a3e512b5e4a9e8318f48f4` |
| 42 | `1992:10518` | `ecran-2d-catalogue-condense-actions.png` | Remplacement | 402 × 874 | `25659b7e5cdf4fb648c45b78767c87c2c491fe31` |
| 43 | `1992:10628` | `ecran-2e-catalogue-deployee-actions.png` | Remplacement | 402 × 874 | `a5279e88e7c484bf0b9bf6d8bbcc1e08857efbe5` |
| 44 | `1992:10848` | `ecran-2g-catalogue-seance-restauree.png` | Remplacement | 402 × 874 | `90fb6b69cb39c1d51dd0c2637442001afda3773a` |
| 45 | `1992:10937` | `ecran-2h-catalogue-apres-archivage.png` | Remplacement | 402 × 874 | `55be5ae8b6848a371b1c6dc7b2bc678835d61290` |
| 46 | `2028:11137` | `ecran-3b-composition-etat-initial.png` | Remplacement | 402 × 874 | `a8107ef2d724bca92378a404065f59bd3a11e3ae` |
| 47 | `2028:11204` | `figma-2028-11204.png` | Ajout | 402 × 874 | `dce78215f208ffa20047d0ba16a71eeb6c95e8da` |
| 48 | `2028:11298` | `modale-1-abandon-creation-seance.png` | Remplacement | 402 × 874 | `6602f0cc6edbb549e4b9c72092a091c36c4c1708` |
| 49 | `2028:11375` | `ecran-3e-composition-compte-rebours-ouvert.png` | Remplacement | 402 × 874 | `f39e69832556016969f7a5dbc61f3731f81b3a79` |
| 50 | `2028:11457` | `ecran-3f-composition-fin-seance-ouverte.png` | Remplacement | 402 × 874 | `0b6f06a592a8a9d584f02dbcb7933d1177d7c1b6` |
| 52 | `2028:11700` | `ecran-3-composition-seance.png` | Remplacement | 402 × 874 | `565e739c62a54a474b728d4f47b3b207b0f3c852` |
| 53 | `2028:11808` | `ecran-3a-composition-actions-glissees.png` | Remplacement | 402 × 874 | `f702411a74b827970fd0c5898a2302c20178abea` |
| 54 | `2028:12003` | `ecran-3c-composition-nom-renseigne.png` | Remplacement | 402 × 874 | `75ed19008e4c9c1d74020b651712555f32107f9a` |
| 55 | `2059:267` | `ecran-7g-calendrier-jour-suivant.png` | Remplacement | 402 × 874 | `d593e99bbf56036bbdb1b0378fd66dbcd52122ad` |
| 56 | `2074:86` | `ecran-7l-calendrier-apres-suppression.png` | Remplacement | 402 × 874 | `bde4d2562cc9b884aef05e268f0b35f01b154574` |
| 57 | `2094:86` | `ecran-7k-calendrier-etirements-actions.png` | Remplacement | 402 × 874 | `81117f673b074df614d5378dea5c63519f72b424` |
| 58 | `2117:86` | `ecran-2i-catalogue-vide.png` | Remplacement | 402 × 874 | `3eab65c52e9c81e2198b23b420e9aeecdb68e6ce` |
| 59 | `2117:190` | `ecran-11b-suivi-vide.png` | Remplacement | 402 × 874 | `2b741a95b0e50ab87f42e35d1d027edf6bbc2878` |
| 60 | `2128:86` | `ecran-7m-calendrier-vide.png` | Remplacement | 402 × 874 | `f16afb30706b9657568ea8a6de376c0fe6e71fdc` |
| 62 | `2234:88` | `modale-3-seance-archivee-action-supprimer.png` | Remplacement | 402 × 874 | `62a0de603a5866e6632e2a2cdb25515409eecfbd` |
| 63 | `2234:189` | `modale-3a-confirmer-suppression-seance-archivee.png` | Remplacement | 402 × 874 | `bb7f79801856bf2b9f02e923ec3fef8c42655c3d` |
| 64 | `2252:86` | `ecran-7h-calendrier-semaine-mardi.png` | Remplacement | 402 × 874 | `757ca5049b5937b0d1336926c4c69dd3fc67cef9` |
| 65 | `3518:4576` | `ecran-3h-composition-appui-long.png` | Remplacement | 402 × 874 | `9ac0086946a730fab7a13ff762bc058fa78d48ab` |
| 75 | `3722:5061` | `figma-3722-5061.png` | Ajout | 402 × 874 | `3dc809ac0a99f8bc74dd5a96f84c0b0c3f09dbbf` |
| 76 | `4581:6404` | `figma-4581-6404.png` | Ajout | 402 × 874 | `0ed8513e8a701003c826d9977b3a21af8ff2f622` |
| 80 | `3786:5093` | `ecran-12-catalogue-activites-liste.png` | Remplacement | 402 × 874 | `207941e5b3cc367bae1da317584d34d7ebdbe234` |
| 83 | `3789:5349` | `ecran-14-selection-activites-existantes.png` | Remplacement | 402 × 874 | `6aa6617536d0531acffdd4c2b3b4bd31f70e7ffe` |
| 89 | `4168:11149` | `figma-4168-11149.png` | Ajout | 402 × 874 | `36e59f7909fc1df990f772f62f8708dee13d3970` |
| 90 | `4168:11262` | `figma-4168-11262.png` | Ajout | 402 × 874 | `709a3007bbac5676a6d8e1d3353138985fa679bd` |
| 91 | `4593:6285` | `figma-4593-6285.png` | Ajout | 402 × 874 | `efe1f7c6c4cebc3d72cf5ddc47bc9599eac23f14` |
| 92 | `4217:6980` | `ecran-15-creation-activite-persistante.png` | Remplacement | 402 × 874 | `0f2e139eb7ed006028708c1fa4f7e26981774a83` |
| 93 | `4279:7044` | `figma-4279-7044.png` | Ajout | 402 × 874 | `fd5335c0c0db14101a26c21d4442470124ce8384` |
| 95 | `4734:6342` | `ecran-15a-modification-activite-persistante.png` | Remplacement | 402 × 874 | `bca1cd0a20120a95d1118f626167135a4750250d` |
| 96 | `4332:7095` | `figma-4332-7095.png` | Ajout | 402 × 874 | `351facdabc366b1e30560e89983925924d7ed664` |
| 102 | `4474:7157` | `figma-4474-7157.png` | Ajout | 402 × 874 | `3d5c6de2c3c3074f5680a49c14827bb23177697f` |
| 103 | `4478:7209` | `ecran-4h-creation-activite-zone-corporelle.png` | Remplacement | 402 × 874 | `9883dce66df6439ed20e86242ac7edcceb13cef4` |
| 106 | `4521:6220` | `figma-4521-6220.png` | Ajout | 402 × 874 | `b09686ed1a6acccfaf6c69aa4df7c1c5b4be52e1` |
| 108 | `4544:6344` | `figma-4544-6344.png` | Ajout | 402 × 874 | `208e3fd39ff64f3154d222a7c3216c75271f5462` |
| 109 | `4544:6651` | `figma-4544-6651.png` | Ajout | 402 × 874 | `209ddbe8838eb56d0eb808860c04e96861a274ac` |
| 110 | `4549:6382` | `figma-4549-6382.png` | Ajout | 402 × 874 | `13ec4f62e29f83239bc3ebf7f50cb19e2582dabe` |
| 111 | `4549:6742` | `ecran-2f-catalogue-archivees.png` | Remplacement | 402 × 874 | `f124fd365aa02f171749402e3d4de2e70e514c46` |
| 113 | `4640:6308` | `figma-4640-6308.png` | Ajout | 402 × 874 | `65019ebc504ac868e0cfa4f0a1119b14cd94c125` |
| 114 | `4683:6336` | `figma-4683-6336.png` | Ajout | 402 × 874 | `7228a7a37f71e1f8cda673f66c9d5254b8f929a7` |
| 115 | `4714:6241` | `figma-4714-6241.png` | Ajout | 402 × 874 | `cfe3c39a9faac9f38827f5b5d1e055b054e231fb` |
| 116 | `4738:6209` | `figma-4738-6209.png` | Ajout | 402 × 874 | `749f79ee830f854e0611fd1d91e7829870bc1e93` |
| 117 | `4738:6355` | `figma-4738-6355.png` | Ajout | 402 × 874 | `913861c2fdc02322dc7f452332e9563d99b8b681` |
| 119 | `4861:6145` | `figma-4861-6145.png` | Ajout | 402 × 874 | `083aa3fcef38821d9bac5348f9511c8d9652caa2` |
| 120 | `4861:6259` | `figma-4861-6259.png` | Ajout | 402 × 874 | `b14c368d11baf826cac140b0dd5970972dd01ad1` |
| 121 | `4861:6348` | `figma-4861-6348.png` | Ajout | 402 × 874 | `7a372c1e44757d29d486d8cd81b650635686ec9b` |
| 123 | `4968:8188` | `figma-4968-8188.png` | Ajout | 402 × 874 | `bbc768307d0673a9c12b4f0f7fe5f5cb20db5b84` |
| 124 | `4968:8055` | `figma-4968-8055.png` | Ajout | 402 × 874 | `1ee35bfe4da7e9fa3c3299acf49325d5199778a0` |
| 125 | `4968:8105` | `figma-4968-8105.png` | Ajout | 402 × 874 | `6aa71b970506688a182f19935357aa5dadc63d33` |
| 126 | `5271:5455` | `figma-5271-5455.png` | Ajout | 402 × 874 | `941468036c91cc403e9595f0133237ab0429b561` |
| 127 | `5088:6398` | `figma-5088-6398.png` | Ajout | 402 × 874 | `8d9219f969fafd91fb48098aaebaec21654ade51` |
| 128 | `4893:6675` | `figma-4893-6675.png` | Ajout | 402 × 874 | `8226f494d03ede03b22b45ad2eeb0eacfa3454b7` |
| 130 | `5588:4363` | `figma-5588-4363.png` | Ajout | 402 × 874 | `65267db67ed8d5e77b6d369d40cc60f7dcd9b020` |
| 131 | `5021:5994` | `figma-5021-5994.png` | Ajout | 402 × 874 | `68999dd3ef8e5f32ff6690aa1370e63aac4ccdbe` |
| 132 | `5581:4257` | `figma-5581-4257.png` | Ajout | 402 × 874 | `761e80ad565ce193ffa5c2af026e8ea363302801` |
| 133 | `5301:5443` | `figma-5301-5443.png` | Ajout | 402 × 874 | `bdb1c48787cc6bd72d39d488f4a20112a1525546` |
| 134 | `5451:4272` | `figma-5451-4272.png` | Ajout | 402 × 874 | `f3ec099c19d953fd3da077ee4836873d5c1cd94a` |


### Complément de la seconde passe — conception média D-203

| Node | Copie relative au chapitre 06 | Classification | Dimensions | SHA du contenu PNG |
|---|---|---|---|---|
| `4997:6113` | `figma-4997-6113.png` | Conception post MVP, copie exportée | 402 × 874 | `84f7592f9cdd08458d70063b632909ab0013a6a4` |
| `5009:6069` | `figma-5009-6069.png` | Conception post MVP, copie exportée | 402 × 874 | `710c5a60bee4baed9737dbb90d695458b284371f` |

Les captures `4332:7095` (Catégorie) et `5088:6398` (état sans mode) révèlent les deux contrôles ouverts détaillés dans le chapitre 13. Les anciennes roulettes `3556:7645` et `3556:7712` restent des références historiques et ne reçoivent pas de nouveau PNG courant.
