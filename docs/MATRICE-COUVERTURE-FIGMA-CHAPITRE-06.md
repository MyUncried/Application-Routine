# Matrice de couverture Figma ↔ chapitre 06

Date de contrôle : 24 septembre 2026.

Sources contrôlées directement : Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page `Prototype MVP` (`510:101`), et `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` sur `main`.

## Objet

Cette matrice détermine, pour **chacune des 122 frames de premier niveau** actuellement présentes dans la page Figma, si une copie d’écran doit être reprise explicitement dans le chapitre 06 lors du prochain réexport documentaire.

Elle ne déclenche aucun export PNG. Elle constitue la base de contrôle de la phase suivante de mise à jour des copies d’écran.

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
| 1 | `1992:375` | Profil — Vue d'ensemble - Vibration désactivée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1-profil.png | REMPLACER | images/ecran-1-profil.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 2 | `1992:469` | Splash — Kodjo (proposition métallisée) | À CLARIFIER | À CLARIFIER | images/ecran-0-splash-kodjo.png | À CLARIFIER | images/ecran-0-splash-kodjo.png | 1 | La frame est nommée `proposition métallisée` dans Figma mais sert actuellement de Splash actif dans le chapitre 06. Aucun remplacement/suppression silencieux avant arbitrage. |
| 3 | `1992:474` | Profil — Roulette compte à rebours initial ouverte | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1c-profil-compte-rebours-ouvert.png | REMPLACER | images/ecran-1c-profil-compte-rebours-ouvert.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 4 | `1992:579` | Profil — Roulette fin de séance ouverte | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1d-profil-fin-seance-ouverte.png | REMPLACER | images/ecran-1d-profil-fin-seance-ouverte.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 5 | `1992:684` | Profil — Vue d'ensemble - Vibration activée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1b-profil-vibration-activee.png | REMPLACER | images/ecran-1b-profil-vibration-activee.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 6 | `1992:778` | Profil — Modifier le profil — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-1a-modifier-profil.png | REMPLACER | images/ecran-1a-modifier-profil.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 7 | `1992:5101` | Calendrier — Semaine | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7a-calendrier-semaine.png | REMPLACER | images/ecran-7a-calendrier-semaine.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 8 | `1992:5237` | Calendrier — Mois | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7b-calendrier-mois.png | REMPLACER | images/ecran-7b-calendrier-mois.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 9 | `1992:5365` | Modal — Supprimer une planification unique — Calendrier | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-4-suppression-planification-unique.png | REMPLACER | images/modale-4-suppression-planification-unique.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 10 | `1992:5510` | Calendrier — Jour — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7-calendrier-jour.png | REMPLACER | images/ecran-7-calendrier-jour.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 11 | `1992:5602` | Calendrier — Jour — Appui long — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7c-calendrier-jour-appui-long.png | REMPLACER | images/ecran-7c-calendrier-jour-appui-long.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 12 | `1992:5697` | Calendrier — Jour — MAJ — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7f-calendrier-jour-apres-planification.png | REMPLACER | images/ecran-7f-calendrier-jour-apres-planification.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 13 | `1992:5794` | Calendrier — Jour — Créneau à planifier — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7e-calendrier-creneau-a-planifier.png | REMPLACER | images/ecran-7e-calendrier-creneau-a-planifier.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 14 | `1992:5962` | Calendrier — Semaine — Actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7j-calendrier-semaine-actions.png | REMPLACER | images/ecran-7j-calendrier-semaine-actions.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 15 | `1992:6102` | Modal — Supprimer des occurrences — Calendrier | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-4a-suppression-occurrences.png | REMPLACER | images/modale-4a-suppression-occurrences.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 16 | `1992:6249` | Modal — Choisir une séance — Planification — Liste longue — depuis Calendrier Jour | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7d-calendrier-choisir-seance.png | REMPLACER | images/ecran-7d-calendrier-choisir-seance.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 17 | `1992:6389` | Calendrier — Semaine — Séance déployée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7i-calendrier-semaine-deployee.png | REMPLACER | images/ecran-7i-calendrier-semaine-deployee.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 18 | `1992:6622` | Planifier une séance — Test picker date ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8a-planifier-date-ouverte.png | REMPLACER | images/ecran-8a-planifier-date-ouverte.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 19 | `1992:6838` | Planifier une séance — Création | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8-planifier-seance.png | REMPLACER | images/ecran-8-planifier-seance.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 20 | `1992:7006` | Planifier une séance — Test picker heure ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8b-planifier-heure-ouverte.png | REMPLACER | images/ecran-8b-planifier-heure-ouverte.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 21 | `1992:7187` | Planifier une séance — Test picker rappel personnalisé ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8c-planifier-rappel-ouvert.png | REMPLACER | images/ecran-8c-planifier-rappel-ouvert.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 22 | `1992:7369` | Planifier une séance — Test rappel personnalisé sélectionné | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8d-planifier-rappel-selectionne.png | REMPLACER | images/ecran-8d-planifier-rappel-selectionne.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 23 | `1992:7537` | Planifier une séance — Roulette nombre de semaines ouverte | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8e-planifier-semaines-ouvert.png | REMPLACER | images/ecran-8e-planifier-semaines-ouvert.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 24 | `1992:7716` | Planifier une séance — Aucune répétition | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8f-planifier-sans-repetition.png | REMPLACER | images/ecran-8f-planifier-sans-repetition.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 25 | `1992:7861` | Planifier une séance — Changer la séance — Liste ouverte | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-8g-planifier-changer-seance.png | REMPLACER | images/ecran-8g-planifier-changer-seance.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 26 | `1992:8132` | Exécution séance — Groupes d’information | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-9-execution-seance.png | REMPLACER | images/ecran-9-execution-seance.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 27 | `1992:8224` | Modal — Réinitialiser l’activité | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-5-reinitialiser-activite.png | REMPLACER | images/modale-5-reinitialiser-activite.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 28 | `1992:8326` | Modal — Passer à l’activité suivante | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-6-activite-suivante.png | REMPLACER | images/modale-6-activite-suivante.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 29 | `1992:8428` | Modal — Séance en pause | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-7-seance-en-pause.png | REMPLACER | images/modale-7-seance-en-pause.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 30 | `1992:8530` | Exécution séance — Groupes d’information — Bips et vocal désactivés | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-9b-execution-sons-annonces-desactives.png | REMPLACER | images/ecran-9b-execution-sons-annonces-desactives.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 31 | `1992:8626` | Exécution séance — Groupes d’information — État initial | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-9a-execution-etat-initial.png | REMPLACER | images/ecran-9a-execution-etat-initial.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 32 | `1992:8718` | Synthèse de séance — Terminée —  Évaluation initiale | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-10a-synthese-evaluation-initiale.png | REMPLACER | images/ecran-10a-synthese-evaluation-initiale.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 33 | `1992:8780` | Synthèse de séance — Terminée — Ressenti sélectionné | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-10-synthese-seance.png | REMPLACER | images/ecran-10-synthese-seance.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 34 | `4760:6448` | Synthèse de séance — Partielle — Évaluation initiale | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4760-6448.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 35 | `4760:6500` | Synthèse de séance — Partielle — Ressenti sélectionné | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4760-6500.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 36 | `1992:8843` | Suivi — Séances — Liste condensée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-11-suivi-condense.png | REMPLACER | images/ecran-11-suivi-condense.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 37 | `1992:8996` | Suivi — Séances — Vue déployée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-11a-suivi-deploye.png | REMPLACER | images/ecran-11a-suivi-deploye.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 38 | `1992:9910` | Catalogue des séances — Liste par défaut | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2-catalogue-seances.png | REMPLACER | images/ecran-2-catalogue-seances.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 39 | `1992:10014` | Catalogue des séances — Séance déployée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2b-catalogue-seance-deployee.png | REMPLACER | images/ecran-2b-catalogue-seance-deployee.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 40 | `1992:10129` | Recherche globale — Champ déployé | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2c-recherche-globale-champ.png | REMPLACER | images/ecran-2c-recherche-globale-champ.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 41 | `1992:10320` | Recherche globale — Résultats affichés | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2a-recherche-globale-resultats.png | REMPLACER | images/ecran-2a-recherche-globale-resultats.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 42 | `1992:10518` | Catalogue des séances — Liste condensée — actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2d-catalogue-condense-actions.png | REMPLACER | images/ecran-2d-catalogue-condense-actions.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 43 | `1992:10628` | Catalogue des séances — Séance déployée — actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2e-catalogue-deployee-actions.png | REMPLACER | images/ecran-2e-catalogue-deployee-actions.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 44 | `1992:10848` | Catalogue des séances — Archivées — Séance restaurée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2g-catalogue-seance-restauree.png | REMPLACER | images/ecran-2g-catalogue-seance-restauree.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 45 | `1992:10937` | Catalogue des séances — Liste sans Renforcement du genou | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2h-catalogue-apres-archivage.png | REMPLACER | images/ecran-2h-catalogue-apres-archivage.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 46 | `2028:11137` | Composition séance — Initial | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3b-composition-etat-initial.png | REMPLACER | images/ecran-3b-composition-etat-initial.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 47 | `2028:11204` | Composition séance — Étiquettes | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-2028-11204.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 48 | `2028:11298` | Composition séance — Abandon | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-1-abandon-creation-seance.png | REMPLACER | images/modale-1-abandon-creation-seance.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 49 | `2028:11375` | Composition séance — Compte à rebours | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3e-composition-compte-rebours-ouvert.png | REMPLACER | images/ecran-3e-composition-compte-rebours-ouvert.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 50 | `2028:11457` | Composition séance — Fin | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3f-composition-fin-seance-ouverte.png | REMPLACER | images/ecran-3f-composition-fin-seance-ouverte.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 51 | `2028:11580` | Composition séance — Tours | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3g-composition-nombre-tours.png | REMPLACER | images/ecran-3g-composition-nombre-tours.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 52 | `2028:11700` | Composition séance — Standard | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3-composition-seance.png | REMPLACER | images/ecran-3-composition-seance.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 53 | `2028:11808` | Composition séance — Actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3a-composition-actions-glissees.png | REMPLACER | images/ecran-3a-composition-actions-glissees.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 54 | `2028:12003` | Composition séance — Nom saisi | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3c-composition-nom-renseigne.png | REMPLACER | images/ecran-3c-composition-nom-renseigne.png | 3 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 55 | `2059:267` | Calendrier — Jour suivant — Glissement gauche — MVP | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7g-calendrier-jour-suivant.png | REMPLACER | images/ecran-7g-calendrier-jour-suivant.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 56 | `2074:86` | Calendrier — Semaine — Après suppression d’une planification | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7l-calendrier-apres-suppression.png | REMPLACER | images/ecran-7l-calendrier-apres-suppression.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 57 | `2094:86` | Calendrier — Semaine — Étirements — Actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7k-calendrier-etirements-actions.png | REMPLACER | images/ecran-7k-calendrier-etirements-actions.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 58 | `2117:86` | Catalogue des séances — État vide | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2i-catalogue-vide.png | REMPLACER | images/ecran-2i-catalogue-vide.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 59 | `2117:190` | Suivi — Séances — État vide | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-11b-suivi-vide.png | REMPLACER | images/ecran-11b-suivi-vide.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 60 | `2128:86` | Calendrier — Jour — État vide | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7m-calendrier-vide.png | REMPLACER | images/ecran-7m-calendrier-vide.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 61 | `2139:86` | Profil — Vue d'ensemble — Parcours vide | VARIANTE REDONDANTE | NON | images/ecran-1e-profil-parcours-vide.png | NE PAS RÉEXPORTER | images/ecran-1e-profil-parcours-vide.png | 2 | Rendu courant indistinguable de `1992:684`; conserver le node sans copie distincte. |
| 62 | `2234:88` | Catalogue des séances — Archivées — actions glissées | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-3-seance-archivee-action-supprimer.png | REMPLACER | images/modale-3-seance-archivee-action-supprimer.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 63 | `2234:189` | Modal — Confirmer la suppression d’une séance archivée | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/modale-3a-confirmer-suppression-seance-archivee.png | REMPLACER | images/modale-3a-confirmer-suppression-seance-archivee.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 64 | `2252:86` | Calendrier — Semaine — Mardi sélectionné | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-7h-calendrier-semaine-mardi.png | REMPLACER | images/ecran-7h-calendrier-semaine-mardi.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 65 | `3518:4576` | Composition séance — Déplacement | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-3h-composition-appui-long.png | REMPLACER | images/ecran-3h-composition-appui-long.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
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
| 80 | `3786:5093` | Catalogue des Exercices — Liste | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-12-catalogue-activites-liste.png | REMPLACER | images/ecran-12-catalogue-activites-liste.png | 3 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 81 | `3787:5148` | HISTORIQUE - Catalogue Exercices — Arbre Créer — supersédé D-187 | EXCLU | NON | — | AUCUNE | — | 2 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 82 | `3788:5258` | HISTORIQUE — Composition — ancien arbre Ajouter une activité — supersédé D-205 | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 83 | `3789:5349` | Composition séance — Sélection exercices | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-14-selection-activites-existantes.png | REMPLACER | images/ecran-14-selection-activites-existantes.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 84 | `3841:8375` | HISTORIQUE — Catalogue Séances — ancien arbre Créer — supersédé D-187 | EXCLU | NON | — | AUCUNE | — | 2 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 85 | `3933:5780` | HISTORIQUE — Composition — ancien arbre Ajouter une activité — supersédé D-205 | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 86 | `3967:5953` | Comparaison — pastille Archivée | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 87 | `3972:5953` | Avant / Après — modifications du 16 septembre | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 88 | `4091:6136` | PROPOSITION — Exécution activité directe — Informations regroupées | EXCLU | NON | — | AUCUNE | — | 0 | Frame explicitement historique, proposition, comparaison ou avant/après ; non normative comme copie active. |
| 89 | `4168:11149` | Catalogue des séances — Filtrer — Panneau ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4168-11149.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 90 | `4168:11262` | Catalogue des Exercices — Filtrer — Panneau ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4168-11262.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 91 | `4593:6285` | Modal — Confirmer l’archivage d’une séance planifiée | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4593-6285.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 92 | `4217:6980` | Ajouter une activité — Squats sautés — Paramètres repliés | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-15-creation-activite-persistante.png | REMPLACER | images/ecran-15-creation-activite-persistante.png | 3 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 93 | `4279:7044` | Ajouter une activité — Squats sautés — Paramètres dépliés — Vue défilée | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4279-7044.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 94 | `4294:7075` | Ajouter une activité — Squats sautés — Paramètres repliés — Cliquez pour paramétrer | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4294-7075.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 95 | `4734:6342` | Modifier une activité — Squats sautés | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-15a-modification-activite-persistante.png | REMPLACER | images/ecran-15a-modification-activite-persistante.png | 3 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 96 | `4332:7095` | Ajouter une activité — Squats sautés — Durée de l’activité — Roulette ouverte | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4332-7095.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 97 | `4367:7128` | Modèle paramètre — Mode d’exécution - Durée | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 98 | `4367:7276` | Modèle paramètre — Compte à rebours | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 99 | `4367:7906` | Modèle paramètre — Côté | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 100 | `4367:8052` | Modèle paramètre — Récupération | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 101 | `4367:8193` | Modèle paramètre — Durée totale | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 102 | `4474:7157` | Ajouter une activité — Squats sautés — Catégorie — Nouvelle catégorie — Clavier ouvert | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4474-7157.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 103 | `4478:7209` | Ajouter une activité — Squats sautés — Zones corporelles | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-4h-creation-activite-zone-corporelle.png | REMPLACER | images/ecran-4h-creation-activite-zone-corporelle.png | 3 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 104 | `4490:6757` | Modèle paramètre — Mode d’exécution - À l’échec | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 105 | `4490:6903` | Modèle paramètre — Mode d’exécution - Répétitions | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 106 | `4521:6220` | Catalogue des exercices — État vide | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4521-6220.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 107 | `4534:6339` | Catalogue des Exercices — Filtre — États du contrôle | RÉFÉRENCE COMPOSANT | NON | — | AUCUNE | — | 1 | Planche de référence/composant ; pas d’écran documentaire autonome. |
| 108 | `4544:6344` | Catalogue des Exercices — Liste — Filtre inactif étendu | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4544-6344.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 109 | `4544:6651` | Catalogue des Exercices — Liste — Filtre actif étendu | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4544-6651.png | 1 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 110 | `4549:6382` | Catalogue des séances — Liste — Filtre inactif étendu | ÉCRAN / ÉTAT UTILISATEUR | OUI | — | AJOUTER | Specifications-fonctionnelles/images/figma-4549-6382.png | 2 | Frame active de premier niveau représentant un état utilisateur distinct. |
| 111 | `4549:6742` | Catalogue des séances — Filtre actif Archivé | ÉCRAN / ÉTAT UTILISATEUR | OUI | images/ecran-2f-catalogue-archivees.png | REMPLACER | images/ecran-2f-catalogue-archivees.png | 3 | Frame active de premier niveau représentant un état utilisateur distinct. |
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
