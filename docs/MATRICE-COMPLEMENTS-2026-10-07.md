# Compléments segmentés et titres — analyse et traçabilité du07/10/2026

Base : PR#328, branche `docs/voile-modal-2026-10-07`, commit `bc889f3d1a8ad3f182af6f8eaad31d2b713a05e3`. `main` vérifié à `ce7d641de233b8aad937ab513c979debf11c0696`. [Pièce jointe (2)](archives/complements-2026-10-07/demande-source.md), conservée sans modification.

La partie voile reprend le lot précédent et reste applicable. Ce lot traite les trois compléments nouveaux. Les spécifications définissent le comportement ; Figma fournit les titres et le layout. Aucun calcul de durée ni logique de pause modifié.

## Écarts, plan appliqué et résultat

| ID | Écart / demande | Modification et preuve | Résultat |
|---|---|---|---|
| C01 | Troisième segment encore prescrit | PRODUCT, INDEX, vision01, versions05, chapitres06/10/12/13 : seulement Exercices/Séances ; RM-109 et D-167 révisés, D-324 ajouté | Traité |
| C02 | D10 / point4 prescrivent un renommage | Suivi dans index des archives et journal complémentaire ; D10 caduc pour le catalogue ; concept Parcours et Circuit interne conservés | Traité |
| C03 | Ligne42 du registre d’audit datée | Ligne42 et conclusion associée révisées, suivi daté sans réécrire les autres conclusions | Traité |
| C04 | Suppression fonctionnelle de code à distinguer du visuel | Backlog FUNC-SEG-02 : critères, accessibilité, navigation, absence d’effet sur les autres segmentés | Spécifié, développement non réalisé |
| C05 | Titres affichés obsolètes ou implicites | CE-T03-04/08, glossaire, INDEX, chapitres03/06/08 ; Composer/Modifier une séance et Créer un exercice | Traité |
| C06 | Risque de confondre titre, bouton Ajouter et nom de frame | Table de titres courants ; noms/IDs/chemins inchangés ; Ajouter en Composition reste CE-T03-07 ; Créer une activité inchangé | Traité sans nouveau design |
| C07 | Inventaire DSF limité à6 variantes | Chapitre12, DSF Cadence et journal§6.3 :8 variantes, dont nouvelles7388:13779 et7388:13786 | Traité |
| C08 | Dimensions de Catalogue encore à3 options | 354×42, options171×34 ; styles cadre/options précisés ; Calendrier3 choix conservé | Traité |
| C09 | Typographie segmentés et exceptions | Section title16/20, côtés13 et14/11 ; portée commune du chapitre13 et DSF spécialisé | Traité |
| C10 | Risque d’opacité après liaison | Alpha0,5 de remplissage, nœud1 ; précaution explicitée dans DSF/architecture/journal | Traité |
| C11 | Captures antérieures |108 écrans réexportés :98 PNG modifiés,10 identiques ;2 captures de variantes DSF ajoutées | Traité |
| C12 | Complétude et propagation |30 contrats×21 sections non vides ; inventaire139 références conservé ; sources archivées, liens et prescriptions revérifiés | Traité |

## Constat Figma et limites

- Prototype MVP et Communautaire contrôlés :25 segmentés de type de contenu chacun, exactement Exercices/Séances ; pas de Parcours dans ces contrôles. Les Catalogues et modales de choix sont couverts. La modale de sélection multiple en Composition n’acquiert pas un sélecteur de type supplémentaire.
- Sur Prototype MVP :40 titres Créer un exercice,19 Composer une séance,1 Modifier une séance. Communautaire :23,17,1. Le total64 de créations annoncé par la source couvre aussi le DSF ; il ne doit pas devenir un nombre de captures MVP.
- Huit variantes DSF existent. Les deux nouvelles sont conformes aux dimensions/types relevés ; quatre anciennes variantes simples restent à14px et avec l’ancien cadre. Les peintures d’option des nouvelles variantes restent locales. Aucune conformité globale des bindings n’est annoncée.
- Les segmentés Mode/Changement/Ordre dans les feuilles gardent un cadre rayon12 opaque avec contour, distinct du standard Catalogue. La typographie suit16/20 ou les exceptions ; aucun changement de cette géométrie n’a été inventé. Les différences mesurées sont décrites dans le DSF.
- Le mot Parcours subsiste dans la Composition5271:5455, hors contrôle Catalogue. Il reste un écart à la règle Circuit/Tour ; il n’est pas propagé dans la conception.
- Noms de frames et annotations historiques conservés. Pages responsive/archives non requalifiées intégralement ; aucune mutation Figma. Tests de l’application et accessibilité sur appareil non réalisés.
- Les captures sont des exports complets actuels : une différence de SHA ne démontre pas que tous les pixels changés proviennent uniquement de ces trois compléments.

## Documents de référence

- [DSF Segmentés/Titres](DSF-SEGMENTES-TITRES-2026-10-07.md)
- [Journal DSF complémentaire](JOURNAL-DSF-COMPLEMENTS-2026-10-07.md)
- [Backlog fonctionnel FUNC-SEG-02](BACKLOG-SEGMENTS-CATALOGUE-2026-10-07.md)
- [Preuves et inventaire courant](VERIFICATION-COMPLEMENTS-2026-10-07.json)
- [Rapport de mission](../.github/orchestration/reports/2026-10-07_DOCUMENTATION_COMPLEMENTS_SEGMENTES_TITRES.md)

## Captures reprises

Le nom ci-dessous est le nom technique de la frame, conservé ; le titre visible est décrit dans le DSF. Les chemins existants du chapitre06 sont réutilisés.

| Frame | ID | Capture | Résultat |
|---|---|---|---|
| Calendrier — Semaine | `1992:5101` | [PNG](Specifications-fonctionnelles/images/ecran-7a-calendrier-semaine.png) | Actualisée |
| Calendrier — Mois | `1992:5237` | [PNG](Specifications-fonctionnelles/images/ecran-7b-calendrier-mois.png) | Actualisée |
| Modal — Supprimer une planification unique — Calendrier | `1992:5365` | [PNG](Specifications-fonctionnelles/images/modale-4-suppression-planification-unique.png) | Actualisée |
| Calendrier — Jour — MVP | `1992:5510` | [PNG](Specifications-fonctionnelles/images/ecran-7-calendrier-jour.png) | Actualisée |
| Calendrier — Jour — Appui long — MVP | `1992:5602` | [PNG](Specifications-fonctionnelles/images/ecran-7c-calendrier-jour-appui-long.png) | Actualisée |
| Calendrier — Jour — MAJ — MVP | `1992:5697` | [PNG](Specifications-fonctionnelles/images/ecran-7f-calendrier-jour-apres-planification.png) | Actualisée |
| Calendrier — Jour — Créneau à planifier — MVP | `1992:5794` | [PNG](Specifications-fonctionnelles/images/ecran-7e-calendrier-creneau-a-planifier.png) | Identique, contrôlée |
| Calendrier — Semaine — Actions glissées | `1992:5962` | [PNG](Specifications-fonctionnelles/images/ecran-7j-calendrier-semaine-actions.png) | Actualisée |
| Modal — Supprimer des occurrences — Calendrier | `1992:6102` | [PNG](Specifications-fonctionnelles/images/modale-4a-suppression-occurrences.png) | Actualisée |
| Modal — Choisir une séance — Planification — Liste longue | `1992:6249` | [PNG](Specifications-fonctionnelles/images/ecran-7d-calendrier-choisir-seance.png) | Actualisée |
| Calendrier — Semaine — Séance déployée | `1992:6389` | [PNG](Specifications-fonctionnelles/images/ecran-7i-calendrier-semaine-deployee.png) | Actualisée |
| Planifier une séance — Test picker date ouvert | `1992:6622` | [PNG](Specifications-fonctionnelles/images/ecran-8a-planifier-date-ouverte.png) | Identique, contrôlée |
| Planifier une séance — Création | `1992:6838` | [PNG](Specifications-fonctionnelles/images/ecran-8-planifier-seance.png) | Identique, contrôlée |
| Planifier une séance — Test picker rappel personnalisé ouvert | `1992:7187` | [PNG](Specifications-fonctionnelles/images/ecran-8c-planifier-rappel-ouvert.png) | Identique, contrôlée |
| Planifier une séance — Test rappel personnalisé sélectionné | `1992:7369` | [PNG](Specifications-fonctionnelles/images/ecran-8d-planifier-rappel-selectionne.png) | Identique, contrôlée |
| Planifier une séance — Stepper Nombre de semaines | `1992:7537` | [PNG](Specifications-fonctionnelles/images/ecran-8e-planifier-semaines-ouvert.png) | Identique, contrôlée |
| Planifier une séance — Aucune répétition | `1992:7716` | [PNG](Specifications-fonctionnelles/images/ecran-8f-planifier-sans-repetition.png) | Identique, contrôlée |
| Planifier une séance — Chioisir la séance | `1992:7861` | [PNG](Specifications-fonctionnelles/images/ecran-8g-planifier-changer-seance.png) | Actualisée |
| Suivi — Séances — Liste condensée | `1992:8843` | [PNG](Specifications-fonctionnelles/images/ecran-11-suivi-condense.png) | Actualisée |
| Suivi — Séances — Vue déployée | `1992:8996` | [PNG](Specifications-fonctionnelles/images/ecran-11a-suivi-deploye.png) | Actualisée |
| Catalogue des séances — Liste par défaut | `1992:9910` | [PNG](Specifications-fonctionnelles/images/ecran-2-catalogue-seances.png) | Actualisée |
| Catalogue des séances — Séance déployée | `1992:10014` | [PNG](Specifications-fonctionnelles/images/ecran-2b-catalogue-seance-deployee.png) | Actualisée |
| Catalogue des séances — Liste condensée — actions glissées | `1992:10518` | [PNG](Specifications-fonctionnelles/images/ecran-2d-catalogue-condense-actions.png) | Actualisée |
| Catalogue des séances — Séance déployée — actions glissées | `1992:10628` | [PNG](Specifications-fonctionnelles/images/ecran-2e-catalogue-deployee-actions.png) | Actualisée |
| Catalogue des séances — Archivées — Séance restaurée | `1992:10848` | [PNG](Specifications-fonctionnelles/images/ecran-2g-catalogue-seance-restauree.png) | Actualisée |
| Catalogue des séances — Liste sans Renforcement du genou | `1992:10937` | [PNG](Specifications-fonctionnelles/images/ecran-2h-catalogue-apres-archivage.png) | Actualisée |
| Composition séance — Initial | `2028:11137` | [PNG](Specifications-fonctionnelles/images/ecran-3b-composition-etat-initial.png) | Actualisée |
| Composition séance — Étiquettes | `2028:11204` | [PNG](Specifications-fonctionnelles/images/figma-2028-11204.png) | Actualisée |
| Composition séance — Abandon | `2028:11298` | [PNG](Specifications-fonctionnelles/images/modale-1-abandon-creation-seance.png) | Actualisée |
| Composition séance — Compte à rebours | `2028:11375` | [PNG](Specifications-fonctionnelles/images/ecran-3e-composition-compte-rebours-ouvert.png) | Actualisée |
| Composition séance — Fin | `2028:11457` | [PNG](Specifications-fonctionnelles/images/ecran-3f-composition-fin-seance-ouverte.png) | Actualisée |
| Composition séance — Standard | `2028:11700` | [PNG](Specifications-fonctionnelles/images/ecran-3-composition-seance.png) | Actualisée |
| Composition séance — Actions glissées | `2028:11808` | [PNG](Specifications-fonctionnelles/images/ecran-3a-composition-actions-glissees.png) | Actualisée |
| Composition séance — Nom saisi | `2028:12003` | [PNG](Specifications-fonctionnelles/images/ecran-3c-composition-nom-renseigne.png) | Actualisée |
| Calendrier — Jour suivant — Glissement gauche — MVP | `2059:267` | [PNG](Specifications-fonctionnelles/images/ecran-7g-calendrier-jour-suivant.png) | Actualisée |
| Calendrier — Semaine — Après suppression d’une planification | `2074:86` | [PNG](Specifications-fonctionnelles/images/ecran-7l-calendrier-apres-suppression.png) | Actualisée |
| Calendrier — Semaine — Étirements — Actions glissées | `2094:86` | [PNG](Specifications-fonctionnelles/images/ecran-7k-calendrier-etirements-actions.png) | Actualisée |
| Catalogue des séances — État vide | `2117:86` | [PNG](Specifications-fonctionnelles/images/ecran-2i-catalogue-vide.png) | Actualisée |
| Suivi — Séances — État vide | `2117:190` | [PNG](Specifications-fonctionnelles/images/ecran-11b-suivi-vide.png) | Actualisée |
| Calendrier — Jour — État vide | `2128:86` | [PNG](Specifications-fonctionnelles/images/ecran-7m-calendrier-vide.png) | Actualisée |
| Catalogue des séances — Archivées — actions glissées | `2234:88` | [PNG](Specifications-fonctionnelles/images/modale-3-seance-archivee-action-supprimer.png) | Actualisée |
| Modal — Confirmer la suppression d’une séance archivée | `2234:189` | [PNG](Specifications-fonctionnelles/images/modale-3a-confirmer-suppression-seance-archivee.png) | Actualisée |
| Calendrier — Semaine — Mardi sélectionné | `2252:86` | [PNG](Specifications-fonctionnelles/images/ecran-7h-calendrier-semaine-mardi.png) | Actualisée |
| Composition séance — Déplacement | `3518:4576` | [PNG](Specifications-fonctionnelles/images/ecran-3h-composition-appui-long.png) | Actualisée |
| Création activité — Avant Paramètres d'exécution | `3542:4656` | [PNG](Specifications-fonctionnelles/images/ecran-4-creation-activite-duree.png) | Actualisée |
| Ajouter un exercice — Initial | `3943:6064` | [PNG](Specifications-fonctionnelles/images/figma-3943-6064.png) | Actualisée |
| Composition séance — Point d’arrêt | `3722:5061` | [PNG](Specifications-fonctionnelles/images/figma-3722-5061.png) | Actualisée |
| Composition séance — Étiquette sélectionnée | `4581:6404` | [PNG](Specifications-fonctionnelles/images/figma-4581-6404.png) | Actualisée |
| Modification d'une séance | `5271:5455` | [PNG](Specifications-fonctionnelles/images/figma-5271-5455.png) | Actualisée |
| Catalogue des Exercices — Liste | `3786:5093` | [PNG](Specifications-fonctionnelles/images/ecran-12-catalogue-activites-liste.png) | Actualisée |
| Composition séance — Sélection exercices | `3789:5349` | [PNG](Specifications-fonctionnelles/images/ecran-14-selection-activites-existantes.png) | Actualisée |
| Catalogue des séances — Filtrer — Panneau ouvert | `4168:11149` | [PNG](Specifications-fonctionnelles/images/figma-4168-11149.png) | Identique, contrôlée |
| Catalogue des Exercices — Filtrer — Panneau ouvert | `4168:11262` | [PNG](Specifications-fonctionnelles/images/figma-4168-11262.png) | Identique, contrôlée |
| Modal — Confirmer l’archivage d’une séance planifiée | `4593:6285` | [PNG](Specifications-fonctionnelles/images/figma-4593-6285.png) | Actualisée |
| Ajouter un exercice — Nom Description Media | `4217:6980` | [PNG](Specifications-fonctionnelles/images/ecran-15-creation-activite-persistante.png) | Actualisée |
| Ajouter un exercice — Catégorie renseignée | `5088:6398` | [PNG](Specifications-fonctionnelles/images/figma-5088-6398.png) | Actualisée |
| Ajouter un exercice — Catégories | `4332:7095` | [PNG](Specifications-fonctionnelles/images/figma-4332-7095.png) | Actualisée |
| Ajouter un exercice — Nouvelle catégorie | `4474:7157` | [PNG](Specifications-fonctionnelles/images/figma-4474-7157.png) | Actualisée |
| Ajouter un exercice — Zones corporelles | `4478:7209` | [PNG](Specifications-fonctionnelles/images/ecran-4h-creation-activite-zone-corporelle.png) | Actualisée |
| Catalogue des exercices — État vide | `4521:6220` | [PNG](Specifications-fonctionnelles/images/figma-4521-6220.png) | Actualisée |
| Catalogue des Exercices — Liste — Filtre inactif étendu | `4544:6344` | [PNG](Specifications-fonctionnelles/images/figma-4544-6344.png) | Actualisée |
| Catalogue des Exercices — Liste — Filtre actif étendu | `4544:6651` | [PNG](Specifications-fonctionnelles/images/figma-4544-6651.png) | Actualisée |
| Catalogue des séances — Liste — Filtre inactif étendu | `4549:6382` | [PNG](Specifications-fonctionnelles/images/figma-4549-6382.png) | Actualisée |
| Catalogue des séances — Filtre actif Archivé | `4549:6742` | [PNG](Specifications-fonctionnelles/images/ecran-2f-catalogue-archivees.png) | Actualisée |
| Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité | `4592:6217` | [PNG](Specifications-fonctionnelles/images/figma-4592-6217.png) | Actualisée |
| Composition séance — Nouvelle étiquette | `4640:6308` | [PNG](Specifications-fonctionnelles/images/figma-4640-6308.png) | Actualisée |
| Ajouter un exercice — Nouvelle zone corporelle | `4683:6336` | [PNG](Specifications-fonctionnelles/images/figma-4683-6336.png) | Actualisée |
| Modal — Abandonner la création de l’activité | `4714:6241` | [PNG](Specifications-fonctionnelles/images/figma-4714-6241.png) | Actualisée |
| Catalogue des Exercices — Liste — actions glissées | `4738:6209` | [PNG](Specifications-fonctionnelles/images/figma-4738-6209.png) | Actualisée |
| Catalogue des Exercices — Liste — Première carte déployée — Média | `4738:6355` | [PNG](Specifications-fonctionnelles/images/figma-4738-6355.png) | Actualisée |
| Composition séance — Étiquettes — Appui long — Confirmation suppression | `4861:6145` | [PNG](Specifications-fonctionnelles/images/figma-4861-6145.png) | Actualisée |
| Ajouter un exercice — Catégorie — Appui long — Confirmation suppression | `4861:6259` | [PNG](Specifications-fonctionnelles/images/figma-4861-6259.png) | Actualisée |
| Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression | `4861:6348` | [PNG](Specifications-fonctionnelles/images/figma-4861-6348.png) | Actualisée |
| Composition séance — Retirer un point d’arrêt | `5301:5443` | [PNG](Specifications-fonctionnelles/images/figma-5301-5443.png) | Actualisée |
| Modal — Choisir un exercice — Planification — Liste longue | `5451:4272` | [PNG](Specifications-fonctionnelles/images/figma-5451-4272.png) | Actualisée |
| Création activité — Paramètres en modale — 1 Champ vide | `6407:9458` | [PNG](Specifications-fonctionnelles/images/figma-6407-9458.png) | Actualisée |
| Création activité — Paramètres en modale — 2 Modale ouverte (champs vides) | `6407:9551` | [PNG](Specifications-fonctionnelles/images/figma-6407-9551.png) | Actualisée |
| Création activité — Paramètres en modale — 3 Texte affiché | `6407:9702` | [PNG](Specifications-fonctionnelles/images/figma-6407-9702.png) | Actualisée |
| Création activité — Paramètres en modale — 4 Modale complète — mode activé | `6407:9805` | [PNG](Specifications-fonctionnelles/images/figma-6407-9805.png) | Actualisée |
| Création activité — Paramètres en modale — 5 Modale complète — steppers (séries, pauses) | `6407:9966` | [PNG](Specifications-fonctionnelles/images/figma-6407-9966.png) | Actualisée |
| Création activité — Paramètres en modale — 6 Durée activée (roulette ouverte) | `6407:10127` | [PNG](Specifications-fonctionnelles/images/figma-6407-10127.png) | Actualisée |
| Création activité — Paramètres en modale — 8 Changement de côté activé (contrôle segmenté) | `6407:10481` | [PNG](Specifications-fonctionnelles/images/figma-6407-10481.png) | Actualisée |
| Création activité — Paramètres en modale — 7 Durée totale activée (roulette ouverte) | `6411:9546` | [PNG](Specifications-fonctionnelles/images/figma-6411-9546.png) | Actualisée |
| Création activité — Paramètres en modale — 9 Avec changement de côté (pause au changement de côté) | `6411:9649` | [PNG](Specifications-fonctionnelles/images/figma-6411-9649.png) | Actualisée |
| Création activité — Paramètres en modale — 10 Répétitions (mode activé) | `6419:9847` | [PNG](Specifications-fonctionnelles/images/figma-6419-9847.png) | Actualisée |
| Création activité — Paramètres en modale — 11 À l’échec (mode activé) | `6419:10028` | [PNG](Specifications-fonctionnelles/images/figma-6419-10028.png) | Actualisée |
| Création activité — Paramètres en modale — 12 Modale complète — steppers (séries, pauses) avec message de durée totale ajustée | `6423:9953` | [PNG](Specifications-fonctionnelles/images/figma-6423-9953.png) | Actualisée |
| Composition séance — Standard — Séries variables | `6665:23973` | [PNG](Specifications-fonctionnelles/images/figma-6665-23973.png) | Actualisée |
| Séries variables — 2 Durée variable (scénario A) | `6665:24616` | [PNG](Specifications-fonctionnelles/images/figma-6665-24616.png) | Actualisée |
| Séries variables — 3 Répétitions variables (scénario E) | `6665:24844` | [PNG](Specifications-fonctionnelles/images/figma-6665-24844.png) | Actualisée |
| Séries variables — 4 À l’échec variable (scénario F) | `6665:25072` | [PNG](Specifications-fonctionnelles/images/figma-6665-25072.png) | Actualisée |
| Séries variables — 5 Douze séries (défilement — haut) | `6665:25277` | [PNG](Specifications-fonctionnelles/images/figma-6665-25277.png) | Identique, contrôlée |
| Ordre des côtés — 7 Sélection : Un côté après l’autre | `6665:26185` | [PNG](Specifications-fonctionnelles/images/figma-6665-26185.png) | Actualisée |
| Séries variables + Les deux côtés à chaque série — 9 (scénario D) | `6665:26575` | [PNG](Specifications-fonctionnelles/images/figma-6665-26575.png) | Actualisée |
| Une seule série — 10 Options sans effet | `6665:26822` | [PNG](Specifications-fonctionnelles/images/figma-6665-26822.png) | Actualisée |
| Changement de mode — 11 Cibles à renseigner | `6665:27008` | [PNG](Specifications-fonctionnelles/images/figma-6665-27008.png) | Actualisée |
| Validation impossible — 12 Série incomplète | `6665:27232` | [PNG](Specifications-fonctionnelles/images/figma-6665-27232.png) | Actualisée |
| Séries variables — 13 Tableau masqué | `6665:27458` | [PNG](Specifications-fonctionnelles/images/figma-6665-27458.png) | Actualisée |
| Séries variables — 14 Déplacement d’une série | `6665:27608` | [PNG](Specifications-fonctionnelles/images/figma-6665-27608.png) | Actualisée |
| Résumé — 15 Durée variable bilatérale Par série | `6665:27862` | [PNG](Specifications-fonctionnelles/images/figma-6665-27862.png) | Actualisée |
| Résumé — 17 À l’échec variable | `6665:28050` | [PNG](Specifications-fonctionnelles/images/figma-6665-28050.png) | Actualisée |
| Création activité — Paramètres en modale — 13 Répétitions avec cadence | `7059:13302` | [PNG](Specifications-fonctionnelles/images/figma-7059-13302.png) | Actualisée |
| Création activité — Paramètres en modale — 9b Avec changement de côté (copie) | `7069:13464` | [PNG](Specifications-fonctionnelles/images/figma-7069-13464.png) | Actualisée |
| Création activité — Paramètres en modale — 10b Répétitions (copie) | `7069:13573` | [PNG](Specifications-fonctionnelles/images/figma-7069-13573.png) | Actualisée |
| Création activité — Phrase longue (224 caractères) | `7119:27855` | [PNG](Specifications-fonctionnelles/images/figma-7119-27855.png) | Actualisée |
| Composition d’une séance — Placement d’une pause | `7167:13503` | [PNG](Specifications-fonctionnelles/images/figma-7167-13503.png) | Actualisée |
| Composition d’une séance — Durée de récupération (modale) | `7173:13521` | [PNG](Specifications-fonctionnelles/images/figma-7173-13521.png) | Actualisée |
| Composition séance — Retirer une récupération | `7296:13696` | [PNG](Specifications-fonctionnelles/images/figma-7296-13696.png) | Actualisée |
