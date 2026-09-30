# Matrice de couverture Figma ↔ chapitre 06

Matrice initiale : 24 septembre 2026. Remplacements de captures exécutés le 30 septembre 2026 (voir bilan ci-dessous).

Sources contrôlées directement : Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page `Prototype MVP` (`510:101`), et `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` sur `main`.

## Objet

Cette matrice détermine, pour **chacune des 122 frames de premier niveau** actuellement présentes dans la page Figma, si une copie d’écran doit être reprise explicitement dans le chapitre 06 lors du prochain réexport documentaire.

Cette matrice a servi à remplacer les copies existantes le 30 septembre 2026. Les propositions anciennes d’ajout ne sont pas exécutées : aucun nouveau fichier PNG ni nouvel écran ajouté.

## Synthèse

| Qualification | Nombre | Traitement des copies |
|---|---:|---|
| Écran / état utilisateur actif | 90 | Copie à reprendre explicitement dans 06 |
| Historique documentaire de l’ancien éditeur | 9 | Ne pas réexporter comme référence courante ; conserver la traçabilité existante |
| Référence composant | 8 | Node/règle seulement, pas de copie autonome |
| Variante redondante | 2 | Node/règle seulement, pas de copie autonome |
| Exclu explicitement par Figma | 12 | Ne pas reprendre comme copie active |
| À clarifier | 1 | Arbitrage requis avant export |
| **Total** | **122** | **90 copies actives à reprendre ; 1 arbitrage** |

### Règles de qualification

- Une frame active représentant un état utilisateur distinct est reprise comme copie dans le chapitre 06.
- Une planche de composant reste référencée par son node mais ne devient pas un écran documentaire autonome.
- Une variante redondante ne reçoit pas de copie distincte si elle ne matérialise pas un état fonctionnel ou visuel distinct utile.
- Une frame explicitement nommée `HISTORIQUE`, `PROPOSITION`, `Comparaison` ou `Avant / Après` n’est pas promue en référence active.
- La famille d’ancien éditeur `3542/3556/3561/3580/3943` reste une trace documentaire ; l’organisation visuelle active est portée par `4217:*` à `4734:*`.
- Une copie physique déjà présente n’est jamais considérée comme actuelle uniquement parce que son fichier existe : le node Figma courant reste la source visuelle.

## Matrice exhaustive — 122 frames

| # | Node Figma | Frame | Nature | Copie dans 06 ? | Copie actuelle | Action | Cible PNG proposée | Réf. dans 06 | Justification |
|---:|---|---|---|:---:|---|---|---|---:|---|
| 1 | `1992:375` | Profil — Vue d'ensemble - Vibration désactivée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1-profil.png | REMPLACÉ 30/09 | images/ecran-1-profil.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 2 | `1992:469` | Splash — Kodjo (proposition métallisée) | À CLARIFIER | À CLARIFIER | images/ecran-0-splash-kodjo.png | À CLARIFIER | images/ecran-0-splash-kodjo.png | 1 | La frame est nommée `proposition métallisée` dans Figma mais sert actuellement de Splash actif dans le chapitre 06. Aucun remplacement/suppression silencieux avant arbitrage. |
| 3 | `1992:474` | Profil — Stepper Pause changement de côté | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1c-profil-compte-rebours-ouvert.png | REMPLACÉ 30/09 | images/ecran-1c-profil-compte-rebours-ouvert.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 4 | `1992:579` | Profil — Stepper Récupération après activité | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1d-profil-fin-seance-ouverte.png | REMPLACÉ 30/09 | images/ecran-1d-profil-fin-seance-ouverte.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 5 | `1992:684` | Profil — Vue d'ensemble - Vibration activée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1b-profil-vibration-activee.png | REMPLACÉ 30/09 | images/ecran-1b-profil-vibration-activee.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 6 | `1992:778` | Profil — Modifier le profil — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1a-modifier-profil.png | REMPLACÉ 30/09 | images/ecran-1a-modifier-profil.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 7 | `1992:5101` | Calendrier — Semaine | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7a-calendrier-semaine.png | REMPLACÉ 30/09 | images/ecran-7a-calendrier-semaine.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 8 | `1992:5237` | Calendrier — Mois | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7b-calendrier-mois.png | REMPLACÉ 30/09 | images/ecran-7b-calendrier-mois.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 9 | `1992:5365` | Modal — Supprimer une planification unique — Calendrier | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-4-suppression-planification-unique.png | REMPLACÉ 30/09 | images/modale-4-suppression-planification-unique.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 10 | `1992:5510` | Calendrier — Jour — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7-calendrier-jour.png | REMPLACÉ 30/09 | images/ecran-7-calendrier-jour.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 11 | `1992:5602` | Calendrier — Jour — Appui long — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7c-calendrier-jour-appui-long.png | REMPLACÉ 30/09 | images/ecran-7c-calendrier-jour-appui-long.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 12 | `1992:5697` | Calendrier — Jour — MAJ — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7f-calendrier-jour-apres-planification.png | REMPLACÉ 30/09 | images/ecran-7f-calendrier-jour-apres-planification.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 13 | `1992:5794` | Calendrier — Jour — Créneau à planifier — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7e-calendrier-creneau-a-planifier.png | REMPLACÉ 30/09 | images/ecran-7e-calendrier-creneau-a-planifier.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 14 | `1992:5962` | Calendrier — Semaine — Actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7j-calendrier-semaine-actions.png | REMPLACÉ 30/09 | images/ecran-7j-calendrier-semaine-actions.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 15 | `1992:6102` | Modal — Supprimer des occurrences — Calendrier | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-4a-suppression-occurrences.png | REMPLACÉ 30/09 | images/modale-4a-suppression-occurrences.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 16 | `1992:6249` | Modal — Choisir une séance — Planification — Liste longue | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7d-calendrier-choisir-seance.png | REMPLACÉ 30/09 | images/ecran-7d-calendrier-choisir-seance.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 17 | `1992:6389` | Calendrier — Semaine — Séance déployée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7i-calendrier-semaine-deployee.png | REMPLACÉ 30/09 | images/ecran-7i-calendrier-semaine-deployee.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 18 | `1992:6622` | Planifier une séance — Test picker date ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8a-planifier-date-ouverte.png | REMPLACÉ 30/09 | images/ecran-8a-planifier-date-ouverte.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 19 | `1992:6838` | Planifier une séance — Création | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8-planifier-seance.png | REMPLACÉ 30/09 | images/ecran-8-planifier-seance.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 20 | `1992:7006` | Planifier une séance — Test picker heure ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8b-planifier-heure-ouverte.png | CONSERVÉ — SOURCE ABSENTE | images/ecran-8b-planifier-heure-ouverte.png | 1 | Nœud introuvable le30/09 ; ancienne capture conservée comme historique, aucune substitution inventée. |
| 21 | `1992:7187` | Planifier une séance — Test picker rappel personnalisé ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8c-planifier-rappel-ouvert.png | REMPLACÉ 30/09 | images/ecran-8c-planifier-rappel-ouvert.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 22 | `1992:7369` | Planifier une séance — Test rappel personnalisé sélectionné | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8d-planifier-rappel-selectionne.png | REMPLACÉ 30/09 | images/ecran-8d-planifier-rappel-selectionne.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 23 | `1992:7537` | Planifier une séance — Stepper Nombre de semaines | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8e-planifier-semaines-ouvert.png | REMPLACÉ 30/09 | images/ecran-8e-planifier-semaines-ouvert.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 24 | `1992:7716` | Planifier une séance — Aucune répétition | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8f-planifier-sans-repetition.png | REMPLACÉ 30/09 | images/ecran-8f-planifier-sans-repetition.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 25 | `1992:7861` | Planifier une séance — Chioisir la séance | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8g-planifier-changer-seance.png | REMPLACÉ 30/09 | images/ecran-8g-planifier-changer-seance.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 26 | `1992:8132` | Exécution d'une séance — Démarrée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-9-execution-seance.png | REMPLACÉ 30/09 | images/ecran-9-execution-seance.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 27 | `1992:8224` | Modal — Réinitialiser l’activité | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-5-reinitialiser-activite.png | REMPLACÉ 30/09 | images/modale-5-reinitialiser-activite.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 28 | `1992:8326` | Modal — Passer à l’activité suivante | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-6-activite-suivante.png | REMPLACÉ 30/09 | images/modale-6-activite-suivante.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 29 | `1992:8428` | Modal — Séance en pause | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-7-seance-en-pause.png | REMPLACÉ 30/09 | images/modale-7-seance-en-pause.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 30 | `1992:8530` | Exécution d'une séance — Démarrée — Bips et vocal désactivés | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-9b-execution-sons-annonces-desactives.png | REMPLACÉ 30/09 | images/ecran-9b-execution-sons-annonces-desactives.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 31 | `1992:8626` | Exécution d'une séance — Initial | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-9a-execution-etat-initial.png | REMPLACÉ 30/09 | images/ecran-9a-execution-etat-initial.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 32 | `1992:8718` | Synthèse de séance — Terminée —  Évaluation initiale | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-10a-synthese-evaluation-initiale.png | REMPLACÉ 30/09 | images/ecran-10a-synthese-evaluation-initiale.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 33 | `1992:8780` | Synthèse de séance — Terminée — Ressenti sélectionné | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-10-synthese-seance.png | REMPLACÉ 30/09 | images/ecran-10-synthese-seance.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 34 | `4760:6448` | Synthèse de séance — Partielle — Évaluation initiale | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4760-6448.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 35 | `4760:6500` | Synthèse de séance — Partielle — Ressenti sélectionné | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4760-6500.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 36 | `1992:8843` | Suivi — Séances — Liste condensée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-11-suivi-condense.png | REMPLACÉ 30/09 | images/ecran-11-suivi-condense.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 37 | `1992:8996` | Suivi — Séances — Vue déployée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-11a-suivi-deploye.png | REMPLACÉ 30/09 | images/ecran-11a-suivi-deploye.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 38 | `1992:9910` | Catalogue des séances — Liste par défaut | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2-catalogue-seances.png | REMPLACÉ 30/09 | images/ecran-2-catalogue-seances.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 39 | `1992:10014` | Catalogue des séances — Séance déployée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2b-catalogue-seance-deployee.png | REMPLACÉ 30/09 | images/ecran-2b-catalogue-seance-deployee.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 40 | `1992:10129` | Recherche globale — Champ déployé | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2c-recherche-globale-champ.png | REMPLACÉ 30/09 | images/ecran-2c-recherche-globale-champ.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 41 | `1992:10320` | Recherche globale — Résultats affichés | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2a-recherche-globale-resultats.png | REMPLACÉ 30/09 | images/ecran-2a-recherche-globale-resultats.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 42 | `1992:10518` | Catalogue des séances — Liste condensée — actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2d-catalogue-condense-actions.png | REMPLACÉ 30/09 | images/ecran-2d-catalogue-condense-actions.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 43 | `1992:10628` | Catalogue des séances — Séance déployée — actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2e-catalogue-deployee-actions.png | REMPLACÉ 30/09 | images/ecran-2e-catalogue-deployee-actions.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 44 | `1992:10848` | Catalogue des séances — Archivées — Séance restaurée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2g-catalogue-seance-restauree.png | REMPLACÉ 30/09 | images/ecran-2g-catalogue-seance-restauree.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 45 | `1992:10937` | Catalogue des séances — Liste sans Renforcement du genou | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2h-catalogue-apres-archivage.png | REMPLACÉ 30/09 | images/ecran-2h-catalogue-apres-archivage.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 46 | `2028:11137` | Composition séance — Initial | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3b-composition-etat-initial.png | REMPLACÉ 30/09 | images/ecran-3b-composition-etat-initial.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 47 | `2028:11204` | Composition séance — Étiquettes | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-2028-11204.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 48 | `2028:11298` | Composition séance — Abandon | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-1-abandon-creation-seance.png | REMPLACÉ 30/09 | images/modale-1-abandon-creation-seance.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 49 | `2028:11375` | Composition séance — Compte à rebours | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3e-composition-compte-rebours-ouvert.png | REMPLACÉ 30/09 | images/ecran-3e-composition-compte-rebours-ouvert.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 50 | `2028:11457` | Composition séance — Fin | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3f-composition-fin-seance-ouverte.png | REMPLACÉ 30/09 | images/ecran-3f-composition-fin-seance-ouverte.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 51 | `2028:11580` | Composition séance — Tours | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3g-composition-nombre-tours.png | CONSERVÉ — SOURCE ABSENTE | images/ecran-3g-composition-nombre-tours.png | 1 | Nœud introuvable le30/09 ; ancienne capture conservée comme historique, aucune substitution inventée. |
| 52 | `2028:11700` | Composition séance — Standard | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3-composition-seance.png | REMPLACÉ 30/09 | images/ecran-3-composition-seance.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 53 | `2028:11808` | Composition séance — Actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3a-composition-actions-glissees.png | REMPLACÉ 30/09 | images/ecran-3a-composition-actions-glissees.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 54 | `2028:12003` | Composition séance — Nom saisi | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3c-composition-nom-renseigne.png | REMPLACÉ 30/09 | images/ecran-3c-composition-nom-renseigne.png | 3 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 55 | `2059:267` | Calendrier — Jour suivant — Glissement gauche — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7g-calendrier-jour-suivant.png | REMPLACÉ 30/09 | images/ecran-7g-calendrier-jour-suivant.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 56 | `2074:86` | Calendrier — Semaine — Après suppression d’une planification | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7l-calendrier-apres-suppression.png | REMPLACÉ 30/09 | images/ecran-7l-calendrier-apres-suppression.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 57 | `2094:86` | Calendrier — Semaine — Étirements — Actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7k-calendrier-etirements-actions.png | REMPLACÉ 30/09 | images/ecran-7k-calendrier-etirements-actions.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 58 | `2117:86` | Catalogue des séances — État vide | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2i-catalogue-vide.png | REMPLACÉ 30/09 | images/ecran-2i-catalogue-vide.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 59 | `2117:190` | Suivi — Séances — État vide | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-11b-suivi-vide.png | REMPLACÉ 30/09 | images/ecran-11b-suivi-vide.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 60 | `2128:86` | Calendrier — Jour — État vide | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7m-calendrier-vide.png | REMPLACÉ 30/09 | images/ecran-7m-calendrier-vide.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 61 | `2139:86` | Profil — Vue d'ensemble — Parcours vide | VARIANTE REDONDANTE | NON | images/ecran-1e-profil-parcours-vide.png | NE PAS RÉEXPORTER | images/ecran-1e-profil-parcours-vide.png | 2 | Rendu courant indistinguable de `1992:684`; conserver le node sans copie distincte. |
| 62 | `2234:88` | Catalogue des séances — Archivées — actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-3-seance-archivee-action-supprimer.png | REMPLACÉ 30/09 | images/modale-3-seance-archivee-action-supprimer.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 63 | `2234:189` | Modal — Confirmer la suppression d’une séance archivée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-3a-confirmer-suppression-seance-archivee.png | REMPLACÉ 30/09 | images/modale-3a-confirmer-suppression-seance-archivee.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 64 | `2252:86` | Calendrier — Semaine — Mardi sélectionné | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7h-calendrier-semaine-mardi.png | REMPLACÉ 30/09 | images/ecran-7h-calendrier-semaine-mardi.png | 1 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 65 | `3518:4576` | Composition séance — Déplacement | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3h-composition-appui-long.png | REMPLACÉ 30/09 | images/ecran-3h-composition-appui-long.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 66 | `3542:4656` | Création activité — Sans paramètre d'exécution— avec mode | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | images/ecran-4-creation-activite-duree.png | CONSERVER HISTORIQUE — PAS DE RÉEXPORT | images/ecran-4-creation-activite-duree.png | 3 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 67 | `3943:6064` | Création activité — Durée / Pause / Séries — Vide | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | — | AUCUNE | — | 3 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 68 | `3556:7645` | Création activité — Durée — sélecteur ouvert | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | images/ecran-4c-creation-activite-duree-ouverte.png | CONSERVER HISTORIQUE — PAS DE RÉEXPORT | images/ecran-4c-creation-activite-duree-ouverte.png | 1 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 69 | `3556:7712` | Création activité — Pause — sélecteur ouvert | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | images/ecran-4d-creation-activite-pause-ouverte.png | CONSERVER HISTORIQUE — PAS DE RÉEXPORT | images/ecran-4d-creation-activite-pause-ouverte.png | 1 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 70 | `3556:7801` | Création activité — Séries — roulette compacte ouverte | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | images/ecran-4e-creation-activite-series-ouvert.png | CONSERVER HISTORIQUE — PAS DE RÉEXPORT | images/ecran-4e-creation-activite-series-ouvert.png | 1 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 71 | `3561:4695` | Création activité — Répétitions / Pause / Séries — avec mode | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | images/ecran-4a-creation-activite-repetitions.png | CONSERVER HISTORIQUE — PAS DE RÉEXPORT | images/ecran-4a-creation-activite-repetitions.png | 2 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 72 | `3561:7673` | Création activité — Répétitions — roulette compacte ouverte | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | images/ecran-4f-creation-activite-repetitions-ouvert.png | CONSERVER HISTORIQUE — PAS DE RÉEXPORT | images/ecran-4f-creation-activite-repetitions-ouvert.png | 2 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 73 | `3561:7802` | Création activité — À l’échec | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | images/ecran-4b-creation-activite-a-l-echec.png | CONSERVER HISTORIQUE — PAS DE RÉEXPORT | images/ecran-4b-creation-activite-a-l-echec.png | 3 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 74 | `3580:4957` | Création activité — Durée totale ajustée — message temporaire | HISTORIQUE DOCUMENTAIRE | NON (pas de réexport) | images/ecran-4k-creation-activite-duree-ajustee.png | CONSERVER HISTORIQUE — PAS DE RÉEXPORT | images/ecran-4k-creation-activite-duree-ajustee.png | 1 | Ancienne organisation visuelle de l’éditeur ; règles métier conservées, mais références visuelles actives = série `4217:*` à `4734:*`. |
| 75 | `3722:5061` | Composition séance — Point d’arrêt | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-3722-5061.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 76 | `4581:6404` | Composition séance — Étiquette sélectionnée | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4581-6404.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 77 | `3752:5021` | PROPOSITION — Exécution séance — Timer pleine largeur | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 78 | `3764:5045` | PROPOSITION — Exécution séance — Média en partie basse | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 79 | `3771:5069` | PROPOSITION — Exécution séance — Timer pleine largeur et média | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 80 | `3786:5093` | Catalogue des Exercices — Liste | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-12-catalogue-activites-liste.png | REMPLACÉ 30/09 | images/ecran-12-catalogue-activites-liste.png | 3 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 81 | `3787:5148` | HISTORIQUE - Catalogue Exercices — Arbre Créer — supersédé D-187 | EXCLU | NON | — | AUCUNE | — | 2 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 82 | `3788:5258` | HISTORIQUE — Composition — ancien arbre Ajouter une activité — supersédé D-205 | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 83 | `3789:5349` | Composition séance — Sélection exercices | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-14-selection-activites-existantes.png | REMPLACÉ 30/09 | images/ecran-14-selection-activites-existantes.png | 2 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 84 | `3841:8375` | HISTORIQUE — Catalogue Séances — ancien arbre Créer — supersédé D-187 | EXCLU | NON | — | AUCUNE | — | 2 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 85 | `3933:5780` | HISTORIQUE — Composition — ancien arbre Ajouter une activité — supersédé D-205 | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 86 | `3967:5953` | Comparaison — pastille Archivée | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 87 | `3972:5953` | Avant / Après — modifications du 16 septembre | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 88 | `4091:6136` | PROPOSITION — Exécution activité directe — Informations regroupées | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 89 | `4168:11149` | Catalogue des séances — Filtrer — Panneau ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4168-11149.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 90 | `4168:11262` | Catalogue des Exercices — Filtrer — Panneau ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4168-11262.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 91 | `4593:6285` | Modal — Confirmer l’archivage d’une séance planifiée | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4593-6285.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 92 | `4217:6980` | Ajouter un exercice — Nom Description Media | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-15-creation-activite-persistante.png | REMPLACÉ 30/09 | images/ecran-15-creation-activite-persistante.png | 3 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 93 | `4279:7044` | Ajouter une activité — Squats sautés — Paramètres dépliés — Vue défilée | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4279-7044.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 94 | `4294:7075` | Ajouter une activité — Squats sautés — Paramètres repliés — Cliquez pour paramétrer | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4294-7075.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 95 | `4734:6342` | Modifier un exercice | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-15a-modification-activite-persistante.png | REMPLACÉ 30/09 | images/ecran-15a-modification-activite-persistante.png | 3 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 96 | `4332:7095` | Ajouter une activité — Squats sautés — Durée de l’activité — Roulette ouverte | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4332-7095.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 97 | `4367:7128` | Modèle paramètre — Mode d’exécution - Durée | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 98 | `4367:7276` | Modèle paramètre — Compte à rebours | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 99 | `4367:7906` | Modèle paramètre — Côté | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 100 | `4367:8052` | Modèle paramètre — Récupération | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 101 | `4367:8193` | Modèle paramètre — Durée totale | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 102 | `4474:7157` | Ajouter une activité — Squats sautés — Catégorie — Nouvelle catégorie — Clavier ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4474-7157.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 103 | `4478:7209` | Ajouter un exercice — Zones corporelles | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-4h-creation-activite-zone-corporelle.png | REMPLACÉ 30/09 | images/ecran-4h-creation-activite-zone-corporelle.png | 3 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 104 | `4490:6757` | Modèle paramètre — Mode d’exécution - À l’échec | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 105 | `4490:6903` | Modèle paramètre — Mode d’exécution - Répétitions | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 106 | `4521:6220` | Catalogue des exercices — État vide | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4521-6220.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 107 | `4534:6339` | Catalogue des Exercices — Filtre — États du contrôle | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 108 | `4544:6344` | Catalogue des Exercices — Liste — Filtre inactif étendu | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4544-6344.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 109 | `4544:6651` | Catalogue des Exercices — Liste — Filtre actif étendu | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4544-6651.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 110 | `4549:6382` | Catalogue des séances — Liste — Filtre inactif étendu | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4549-6382.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 111 | `4549:6742` | Catalogue des séances — Filtre actif Archivé | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2f-catalogue-archivees.png | REMPLACÉ 30/09 | images/ecran-2f-catalogue-archivees.png | 3 | Export direct du nœud Figma courant ; même chemin PNG, dimensions et lisibilité contrôlées. |
| 112 | `4592:6217` | Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité | VARIANTE REDONDANTE | NON | — | AUCUNE | — | 1 | Même contrat d’actions glissées que `1992:10518`; référence complémentaire uniquement. |
| 113 | `4640:6308` | Composition séance — Nouvelle étiquette | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4640-6308.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 114 | `4683:6336` | Ajouter une activité — Squats sautés — Zones corporelles — Nouvelle zone corporelle — Clavier ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4683-6336.png | 4 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 115 | `4714:6241` | Modal — Abandonner la création de l’activité | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4714-6241.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 116 | `4738:6209` | Catalogue des Exercices — Liste — actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4738-6209.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 117 | `4738:6355` | Catalogue des Exercices — Liste — Première carte déployée — Média | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4738-6355.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 118 | `4859:6128` | Composition d’une séance — Proposition aérée | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 119 | `4861:6145` | Composition séance — Étiquettes — Appui long — Confirmation suppression | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4861-6145.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 120 | `4861:6259` | Ajouter une activité — Catégorie — Appui long — Confirmation suppression | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4861-6259.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 121 | `4861:6348` | Ajouter une activité — Zones corporelles — Appui long — Confirmation suppression | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4861-6348.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 122 | `4863:6363` | Composition d’une séance — Proposition aérée V2 | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |

## Point nécessitant un arbitrage avant réexport

### Splash `1992:469`

La frame `1992:469 — Splash — Kodjo (proposition métallisée)` est explicitement nommée **proposition** dans Figma, alors que le chapitre 06 l’utilise actuellement comme `Écran 0 – Splash KODJO`. Statut : **À CLARIFIER**. Aucun arbitrage n’est inféré.

## Référentiels — suppression par appui long

Les trois nouveaux états Figma suivants matérialisent D-200 et doivent être repris comme copies actives :
- `4861:6145` — Étiquette — confirmation de suppression ;
- `4861:6259` — Catégorie — confirmation de suppression ;
- `4861:6348` — Zone corporelle — confirmation de suppression.

## Utilisation pour la phase de réexport

1. résoudre le seul point `À CLARIFIER` avant export global ;
2. exporter uniquement les lignes `Copie dans 06 ? = OUI` depuis leur node Figma courant ;
3. remplacer les fichiers existants indiqués `REMPLACER` sans changer leurs noms ;
4. créer uniquement les nouveaux PNG indiqués `AJOUTER` ;
5. ne pas réexporter les lignes historiques, composants, variantes redondantes ou exclusions ;
6. mettre à jour les références Markdown de 06 uniquement lorsque `AJOUTER` crée effectivement une nouvelle copie ;
7. contrôler après export l’intégrité des chemins UTF-8, les liens Markdown, les dimensions/rendus et l’absence de fichiers temporaires.

## Complément D-203 — frames d’Exécution média

| Node | Frame | Classification | Documentée | Référence documentaire | Statut |
| --- | --- | --- | :---: | --- | --- |
| `4997:6015` | Test 2 Exécution d’une séance — Initial — Bascule (info) | ÉTAT DE CONCEPTION POST-MVP | OUI | Chapitre 06 ; CE-MEDIA-EXEC-01 ; CONCEPTION-EXECUTION-MEDIA.md | COUVERT |
| `4997:6113` | Test 2 Exécution d’une séance — Initial — Bascule (média) | ÉTAT DE CONCEPTION POST-MVP | OUI | Chapitre 06 ; CE-MEDIA-EXEC-01 ; CONCEPTION-EXECUTION-MEDIA.md | COUVERT |
| `5009:6069` | Test 2 Exécution d’une séance — Média plein écran | ÉTAT DE CONCEPTION POST-MVP | OUI | Chapitre 06 ; CE-MEDIA-EXEC-02 ; CONCEPTION-EXECUTION-MEDIA.md | COUVERT |

Ces frames sont des évidences de la conception validée D-203 et ne constituent pas, à elles seules, une décision d’entrée dans le MVP.

## Réserve D-208 — récupération

D-208 modifie le comportement et le rendu attendus de la récupération. Tant que Figma n’a pas été réaligné, les frames montrant une récupération générique attachée/conditionnelle à l’Activité ou absente à `0 s` ne peuvent pas être considérées comme preuves fonctionnelles courantes sur cet axe. Elles restent utilisables pour les autres éléments non affectés. Un nouveau contrôle de couverture Figma est requis après mise à jour des écrans Éditeur Exercice, Composition et Exécution.


## Actualisation ciblée — 30 septembre 2026

Pour les cartes, icônes, contrôles contextuels et animations d’appui, les références actuelles et écarts sont recensés dans [le complément DSF](DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Les références antérieures ci-dessus décrivent l’état audité à leur date et ne prouvent pas la conformité à cette nouvelle grammaire. D-214 révise explicitement l’affichage prévu par D-195/D-206/D-208 ; leurs données et calculs restent applicables. Les 17 points sont clos. Calendrier Jour comporte deux variantes compactes (D-215).

## Propagation écran par écran — 30 septembre 2026

La [matrice courante des écrans](MATRICE-ECRANS-CARTES-2026-09-30.md) relie les 38 frames portant les nouveaux sets et les états complémentaires à leurs descriptions et contrats actualisés. Les anciennes règles d’affichage sont corrigées directement dans06/13 ; CE-UI-01 à05 couvrent Profil, Jour, Semaine/Mois, choix de source et formulaire de planification. Les captures remplacées le30/09 sont recensées dans le bilan de la matrice de couverture ; seules les captures non remplacées restent historiques.

## Bilan des remplacements de captures — 30 septembre 2026

64 PNG existants remplacés par export direct Figma ; aucun nouveau chemin image, aucun nouvel écran. Les 64 images ont été décodées, leurs dimensions vérifiées et les planches de contrôle visuel examinées. Les blobs enregistrés correspondent exactement aux fichiers exportés. Les variantes de champs/steppers qui ont changé de libellé gardent leur nom de fichier pour préserver les liens ; le nom actuel de la source figure ci-dessous.

Deux des66 références de remplacement ne sont plus exportables : `1992:7006` (heure ouverte) et `2028:11580` (nombre de tours). Leurs fichiers restent inchangés et historiques. Les autres fichiers hors liste de remplacement restent inchangés. Les références de recherche `1992:10129` et `1992:10320`, absentes de la liste de premier niveau de Prototype MVP, existent encore et ont été exportées directement.

| Source Figma | Nom courant | Fichier remplacé | Dimensions PNG | SHA Git du PNG |
|---|---|---|---|---|
| `1992:9910` | Catalogue des séances — Liste par défaut | `docs/Specifications-fonctionnelles/images/ecran-2-catalogue-seances.png` | 402 × 874 | `7f9169f212d7a6673d7f7d08acc54f6e5ab4ab6d` |
| `1992:375` | Profil — Vue d'ensemble - Vibration désactivée | `docs/Specifications-fonctionnelles/images/ecran-1-profil.png` | 402 × 874 | `a0a44adce908c1e44b192cd109267df55d0a3d8b` |
| `1992:474` | Profil — Stepper Pause changement de côté | `docs/Specifications-fonctionnelles/images/ecran-1c-profil-compte-rebours-ouvert.png` | 402 × 874 | `61a379f1fce83de265ca06174f415514b037587b` |
| `1992:579` | Profil — Stepper Récupération après activité | `docs/Specifications-fonctionnelles/images/ecran-1d-profil-fin-seance-ouverte.png` | 402 × 874 | `a6e65fb0413876e79a6b8501c3a2345a4e6cee34` |
| `1992:684` | Profil — Vue d'ensemble - Vibration activée | `docs/Specifications-fonctionnelles/images/ecran-1b-profil-vibration-activee.png` | 402 × 874 | `350b8446bb2cc271a4237c4cc5c4315e5cf185d4` |
| `1992:778` | Profil — Modifier le profil — MVP | `docs/Specifications-fonctionnelles/images/ecran-1a-modifier-profil.png` | 402 × 874 | `f669f397705650bffb08ba53e976fe12a0a9513b` |
| `1992:5101` | Calendrier — Semaine | `docs/Specifications-fonctionnelles/images/ecran-7a-calendrier-semaine.png` | 402 × 874 | `ec6b741141d89e68b558d47598f5c200f3296b9d` |
| `1992:5237` | Calendrier — Mois | `docs/Specifications-fonctionnelles/images/ecran-7b-calendrier-mois.png` | 402 × 874 | `837c3b38b08444e69c7a66c6e916c92c23fbc48e` |
| `1992:5365` | Modal — Supprimer une planification unique — Calendrier | `docs/Specifications-fonctionnelles/images/modale-4-suppression-planification-unique.png` | 402 × 874 | `9bdf919dfeab960e82ae02cf0a1dbf0319e18b47` |
| `1992:5510` | Calendrier — Jour — MVP | `docs/Specifications-fonctionnelles/images/ecran-7-calendrier-jour.png` | 402 × 874 | `f244636fa09ba76f4ea2ee5462ec4d9515c0ee2e` |
| `1992:5602` | Calendrier — Jour — Appui long — MVP | `docs/Specifications-fonctionnelles/images/ecran-7c-calendrier-jour-appui-long.png` | 402 × 874 | `7d4545147c23834526da74d4922827fb2576950d` |
| `1992:5697` | Calendrier — Jour — MAJ — MVP | `docs/Specifications-fonctionnelles/images/ecran-7f-calendrier-jour-apres-planification.png` | 402 × 874 | `f17c29e4e8f208483d629ded80b696609b9313e1` |
| `1992:5794` | Calendrier — Jour — Créneau à planifier — MVP | `docs/Specifications-fonctionnelles/images/ecran-7e-calendrier-creneau-a-planifier.png` | 402 × 874 | `4e76623e7799ab52735808ec8f2987cb35af359b` |
| `1992:5962` | Calendrier — Semaine — Actions glissées | `docs/Specifications-fonctionnelles/images/ecran-7j-calendrier-semaine-actions.png` | 402 × 874 | `6d90b9506d8c3783681d8514fb5386aa05438cd4` |
| `1992:6102` | Modal — Supprimer des occurrences — Calendrier | `docs/Specifications-fonctionnelles/images/modale-4a-suppression-occurrences.png` | 402 × 874 | `7fe6f7b619f880788e647de995c4ed76ec1b9be6` |
| `1992:6249` | Modal — Choisir une séance — Planification — Liste longue | `docs/Specifications-fonctionnelles/images/ecran-7d-calendrier-choisir-seance.png` | 402 × 874 | `3ad6ee4f308c71a66d9e9ba35d39f257034358a7` |
| `1992:6389` | Calendrier — Semaine — Séance déployée | `docs/Specifications-fonctionnelles/images/ecran-7i-calendrier-semaine-deployee.png` | 402 × 874 | `ef6d8694a9f4310b2dae74186cb00df8dfc65780` |
| `1992:6622` | Planifier une séance — Test picker date ouvert | `docs/Specifications-fonctionnelles/images/ecran-8a-planifier-date-ouverte.png` | 402 × 874 | `ac9806ad9268d99e74539f6c47ce9164199665c4` |
| `1992:6838` | Planifier une séance — Création | `docs/Specifications-fonctionnelles/images/ecran-8-planifier-seance.png` | 402 × 874 | `af463996732e0f1934068882cd3ec41fc061cdb0` |
| `1992:7187` | Planifier une séance — Test picker rappel personnalisé ouvert | `docs/Specifications-fonctionnelles/images/ecran-8c-planifier-rappel-ouvert.png` | 402 × 874 | `6ffe9788be3a7c03e031f0c309ddf4f9914de848` |
| `1992:7369` | Planifier une séance — Test rappel personnalisé sélectionné | `docs/Specifications-fonctionnelles/images/ecran-8d-planifier-rappel-selectionne.png` | 402 × 874 | `23e46f5442c9d106d639137523e4c4a82f30a19b` |
| `1992:7537` | Planifier une séance — Stepper Nombre de semaines | `docs/Specifications-fonctionnelles/images/ecran-8e-planifier-semaines-ouvert.png` | 402 × 874 | `514a33504f94107c8fd7e3a7bff93c0cfd40639c` |
| `1992:7716` | Planifier une séance — Aucune répétition | `docs/Specifications-fonctionnelles/images/ecran-8f-planifier-sans-repetition.png` | 402 × 874 | `5ab0e33ab81c83f3d0c04f14b72c08c9ff666b40` |
| `1992:7861` | Planifier une séance — Chioisir la séance | `docs/Specifications-fonctionnelles/images/ecran-8g-planifier-changer-seance.png` | 402 × 874 | `babd00ec27c68fedf832b44b4173f78a022a46e8` |
| `1992:8132` | Exécution d'une séance — Démarrée | `docs/Specifications-fonctionnelles/images/ecran-9-execution-seance.png` | 402 × 874 | `c79f117df0e7c2796bddcf6ce43e40298d9d0844` |
| `1992:8224` | Modal — Réinitialiser l’activité | `docs/Specifications-fonctionnelles/images/modale-5-reinitialiser-activite.png` | 402 × 874 | `c6d0e99d37a47964ca992f03744b05506d01b820` |
| `1992:8326` | Modal — Passer à l’activité suivante | `docs/Specifications-fonctionnelles/images/modale-6-activite-suivante.png` | 402 × 874 | `db29f49d57b075ac25837bb0b8c2776af11efd7b` |
| `1992:8428` | Modal — Séance en pause | `docs/Specifications-fonctionnelles/images/modale-7-seance-en-pause.png` | 402 × 874 | `130173331938c0603432e16a6223c6b49a01137f` |
| `1992:8530` | Exécution d'une séance — Démarrée — Bips et vocal désactivés | `docs/Specifications-fonctionnelles/images/ecran-9b-execution-sons-annonces-desactives.png` | 402 × 874 | `ccb454c6ec26b5d9442ce57046c22e835730d8f5` |
| `1992:8626` | Exécution d'une séance — Initial | `docs/Specifications-fonctionnelles/images/ecran-9a-execution-etat-initial.png` | 402 × 874 | `b3bf8661fe4d9007f673fb53060434ccfbd64af8` |
| `1992:8718` | Synthèse de séance — Terminée —  Évaluation initiale | `docs/Specifications-fonctionnelles/images/ecran-10a-synthese-evaluation-initiale.png` | 402 × 874 | `a0f4fc22afab5d345ead317614bf797beb765c92` |
| `1992:8780` | Synthèse de séance — Terminée — Ressenti sélectionné | `docs/Specifications-fonctionnelles/images/ecran-10-synthese-seance.png` | 402 × 874 | `4937fade8ae1a80c36d57c084af17a14876debe3` |
| `1992:8843` | Suivi — Séances — Liste condensée | `docs/Specifications-fonctionnelles/images/ecran-11-suivi-condense.png` | 402 × 874 | `05b43ced63a6bede4a1cf51ebd05977b3a32d2dd` |
| `1992:8996` | Suivi — Séances — Vue déployée | `docs/Specifications-fonctionnelles/images/ecran-11a-suivi-deploye.png` | 402 × 874 | `135d7b84233a26d72d411fbaa6e4fdae7379e69b` |
| `1992:10014` | Catalogue des séances — Séance déployée | `docs/Specifications-fonctionnelles/images/ecran-2b-catalogue-seance-deployee.png` | 402 × 874 | `fd124699b95f8ae7211b859500ad24231db5c47c` |
| `1992:10518` | Catalogue des séances — Liste condensée — actions glissées | `docs/Specifications-fonctionnelles/images/ecran-2d-catalogue-condense-actions.png` | 402 × 874 | `ee117ca78bbfdfc0da24abb12cce28ed291441fe` |
| `1992:10628` | Catalogue des séances — Séance déployée — actions glissées | `docs/Specifications-fonctionnelles/images/ecran-2e-catalogue-deployee-actions.png` | 402 × 874 | `72ddd098e4cee8e34f84541face514147b55452c` |
| `1992:10848` | Catalogue des séances — Archivées — Séance restaurée | `docs/Specifications-fonctionnelles/images/ecran-2g-catalogue-seance-restauree.png` | 402 × 874 | `fec2e085fc5cd936296205b56068565e14a9a290` |
| `1992:10937` | Catalogue des séances — Liste sans Renforcement du genou | `docs/Specifications-fonctionnelles/images/ecran-2h-catalogue-apres-archivage.png` | 402 × 874 | `fed22b502a386e12e5ad72b70e2aff4a1796e63c` |
| `2028:11137` | Composition séance — Initial | `docs/Specifications-fonctionnelles/images/ecran-3b-composition-etat-initial.png` | 402 × 874 | `d1d776840c5fdeefe8432c84d657f9565b1e0d1f` |
| `2028:11298` | Composition séance — Abandon | `docs/Specifications-fonctionnelles/images/modale-1-abandon-creation-seance.png` | 402 × 874 | `638253aaf581fabcab30e9ad88c0dc3356afe89b` |
| `2028:11375` | Composition séance — Compte à rebours | `docs/Specifications-fonctionnelles/images/ecran-3e-composition-compte-rebours-ouvert.png` | 402 × 874 | `141adbf039ca987ebf95e850342be9b798673c76` |
| `2028:11457` | Composition séance — Fin | `docs/Specifications-fonctionnelles/images/ecran-3f-composition-fin-seance-ouverte.png` | 402 × 874 | `e61b1b5aaf709865efd999047c625a498db68399` |
| `2028:11700` | Composition séance — Standard | `docs/Specifications-fonctionnelles/images/ecran-3-composition-seance.png` | 402 × 874 | `d8eea50e18742cc8a0fc24b41354eb97564eafa9` |
| `2028:11808` | Composition séance — Actions glissées | `docs/Specifications-fonctionnelles/images/ecran-3a-composition-actions-glissees.png` | 402 × 874 | `3d848990aa2f54052f203ff10dbe31db88091af1` |
| `2028:12003` | Composition séance — Nom saisi | `docs/Specifications-fonctionnelles/images/ecran-3c-composition-nom-renseigne.png` | 402 × 874 | `84852f6e29ec063b6077412d7b49133e2dc59754` |
| `2059:267` | Calendrier — Jour suivant — Glissement gauche — MVP | `docs/Specifications-fonctionnelles/images/ecran-7g-calendrier-jour-suivant.png` | 402 × 874 | `6c5d55b35b8e9252ff8defcbdf3330ede51b9c2c` |
| `2074:86` | Calendrier — Semaine — Après suppression d’une planification | `docs/Specifications-fonctionnelles/images/ecran-7l-calendrier-apres-suppression.png` | 402 × 874 | `f53119ba815bf873cefe1856a16eb53a196d9b85` |
| `2094:86` | Calendrier — Semaine — Étirements — Actions glissées | `docs/Specifications-fonctionnelles/images/ecran-7k-calendrier-etirements-actions.png` | 402 × 874 | `8c66fe5f7e32a7c49deb1dad9f88a219fc60cd86` |
| `2117:86` | Catalogue des séances — État vide | `docs/Specifications-fonctionnelles/images/ecran-2i-catalogue-vide.png` | 402 × 874 | `f12658d0e244ea1f6f2ead109378e6e9f039933c` |
| `2117:190` | Suivi — Séances — État vide | `docs/Specifications-fonctionnelles/images/ecran-11b-suivi-vide.png` | 402 × 874 | `386dc0f10e2e1f7aabc3566ace3b5ff60f2b69a3` |
| `2128:86` | Calendrier — Jour — État vide | `docs/Specifications-fonctionnelles/images/ecran-7m-calendrier-vide.png` | 402 × 874 | `e6a4714cf95b2abd6f16a0a03461e0266f4794ef` |
| `2234:88` | Catalogue des séances — Archivées — actions glissées | `docs/Specifications-fonctionnelles/images/modale-3-seance-archivee-action-supprimer.png` | 402 × 874 | `7f46d5ca3f75c848317ac84b6c9732b7fde63fe9` |
| `2234:189` | Modal — Confirmer la suppression d’une séance archivée | `docs/Specifications-fonctionnelles/images/modale-3a-confirmer-suppression-seance-archivee.png` | 402 × 874 | `09b61124fedba5884ffa03bec7cab29c46bafd6e` |
| `2252:86` | Calendrier — Semaine — Mardi sélectionné | `docs/Specifications-fonctionnelles/images/ecran-7h-calendrier-semaine-mardi.png` | 402 × 874 | `3fedb69599277d5f47aa08d482b5104e11e6c818` |
| `3518:4576` | Composition séance — Déplacement | `docs/Specifications-fonctionnelles/images/ecran-3h-composition-appui-long.png` | 402 × 874 | `b4f4aab2847a880129bb1e9d3f6b69c5fc0274c3` |
| `3786:5093` | Catalogue des Exercices — Liste | `docs/Specifications-fonctionnelles/images/ecran-12-catalogue-activites-liste.png` | 402 × 874 | `4f022ac5c17bd54b6e1af1179a89c6d7c3169aaa` |
| `3789:5349` | Composition séance — Sélection exercices | `docs/Specifications-fonctionnelles/images/ecran-14-selection-activites-existantes.png` | 402 × 874 | `d5b2aa29d4389fbb233241228bc3c70ba2633576` |
| `4217:6980` | Ajouter un exercice — Nom Description Media | `docs/Specifications-fonctionnelles/images/ecran-15-creation-activite-persistante.png` | 402 × 874 | `bfdac38156e0a32396c31ee7753dd8825884de21` |
| `4734:6342` | Modifier un exercice | `docs/Specifications-fonctionnelles/images/ecran-15a-modification-activite-persistante.png` | 402 × 874 | `1f864f14e20ac5270a86cfc6f26c646ad9e58307` |
| `4478:7209` | Ajouter un exercice — Zones corporelles | `docs/Specifications-fonctionnelles/images/ecran-4h-creation-activite-zone-corporelle.png` | 402 × 874 | `d791e6275a6be79aec443d404887eaa072fc4de8` |
| `4549:6742` | Catalogue des séances — Filtre actif Archivé | `docs/Specifications-fonctionnelles/images/ecran-2f-catalogue-archivees.png` | 402 × 874 | `4d58c9a2d5da36b51e3e9f987ddc582240159449` |
| `1992:10129` | Recherche globale — Champ déployé | `docs/Specifications-fonctionnelles/images/ecran-2c-recherche-globale-champ.png` | 402 × 874 | `696d54242bca0c09ab88ab08c336363b7cac3bc1` |
| `1992:10320` | Recherche globale — Résultats affichés | `docs/Specifications-fonctionnelles/images/ecran-2a-recherche-globale-resultats.png` | 402 × 874 | `17e90cecc2e48d9f1637991baf47ea453216d0ee` |
