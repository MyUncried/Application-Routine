# Écrans modifiés — traçabilité des cartes, icônes et appuis

Contrôle du 30 septembre 2026, Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP. Cette matrice relie les frames courantes aux descriptions locales du chapitre06 et aux contrats du chapitre13. Elle remplace, dans ce périmètre, la simple dépendance au complément DSF.

## Couverture et limites

- 38 frames contiennent les nouveaux sets Carte séance/Carte exercice, dont les cinq états Calendrier Jour. Lecture structurelle : 130 instances rattachées à ces sets. Le total133 annoncé dans le journal de remplacement est une mesure historique différente ; ce recensement ne certifie pas le nombre d’opérations de remplacement ni les anciennes couches masquées.
- Les frames sans carte ci-dessous héritent seulement des changements transverses applicables : icônes, commandes, appuis et silhouette. Leur présence ne prouve pas une modification de chaque contrôle ; aucun nouveau comportement n’est déduit d’un nom de frame.
- Contrôle exhaustif du 30 septembre 2026 : 113 frames du prototype et les 6 références complémentaires du rapport utilisateur, soit 119 captures Figma. Les 84 écrans du rapport sont couverts (78 dans le prototype). 74 fichiers existants sont actualisés et 45 copies documentaires complètent des écrans déjà présents dans Figma ; aucun écran applicatif ou Figma créé. La matrice exhaustive donne les preuves.
- Les critères décrivent la cible à développer ; aucune recette de l’application ou parcours interactif Figma n’est déclarée.
- Aucun arbitrage rouvert : RG-3 seule reportée ; Photo demeure la référence de la présentation avec média, sans déclaration de propagation aux composants/écrans.

## Frames contenant les nouveaux sets de cartes

| Frame courante | Cartes rattachées | Description chapitre06 | Contrat chapitre13 | Changements et critères locaux |
|---|---:|---|---|---|
| [Calendrier — Semaine](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5101) | 7 | Écran7 Semaine / modale4 | CE-UI-03 | Nature, badge heure, durée ; SEM-01 à06 ; arrière-plan de modale inclus |
| [Modal — Supprimer une planification unique — Calendrier](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5365) | 3 | Écran7 Semaine / modale4 | CE-UI-03 | Nature, badge heure, durée ; SEM-01 à06 ; arrière-plan de modale inclus |
| [Calendrier — Jour — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5510) | 2 | Écran7 Jour | CE-UI-02 | Carte compacte et barre4 ; JOUR-01 à04 |
| [Calendrier — Jour — Appui long — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5602) | 2 | Écran7 Jour | CE-UI-02 | Carte compacte et barre4 ; JOUR-01 à04 |
| [Calendrier — Jour — MAJ — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5697) | 3 | Écran7 Jour | CE-UI-02 | Carte compacte et barre4 ; JOUR-01 à04 |
| [Calendrier — Jour — Créneau à planifier — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5794) | 2 | Écran7 Jour | CE-UI-02 | Carte compacte et barre4 ; JOUR-01 à04 |
| [Calendrier — Semaine — Actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5962) | 4 | Écran7 Semaine / modale4 | CE-UI-03 | Nature, badge heure, durée ; SEM-01 à06 ; arrière-plan de modale inclus |
| [Modal — Supprimer des occurrences — Calendrier](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6102) | 3 | Écran7 Semaine / modale4 | CE-UI-03 | Nature, badge heure, durée ; SEM-01 à06 ; arrière-plan de modale inclus |
| [Modal — Choisir une séance — Planification — Liste longue](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6249) | 9 | Écrans7d/8g | CE-UI-04 | Radio, sans durée/actions, largeur354 ; SEL-01 à05 |
| [Calendrier — Semaine — Séance déployée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6389) | 3 | Écran7 Semaine / modale4 | CE-UI-03 | Nature, badge heure, durée ; SEM-01 à06 ; arrière-plan de modale inclus |
| [Planifier une séance — Chioisir la séance](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7861) | 9 | Écrans7d/8g | CE-UI-04 | Radio, sans durée/actions, largeur354 ; SEL-01 à05 |
| [Suivi — Séances — Liste condensée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8843) | 5 | Écran11 | CE-T03-15 | Statut76, Déployer28/Ressenti28, heure ; CAR-07/ICO/ANI |
| [Suivi — Séances — Vue déployée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8996) | 3 | Écran11 | CE-T03-15 | Statut76, Déployer28/Ressenti28, heure ; CAR-07/ICO/ANI |
| [Catalogue des séances — Liste par défaut](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-9910) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des séances — Séance déployée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10014) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des séances — Liste condensée — actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10518) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des séances — Séance déployée — actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10628) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des séances — Archivées — Séance restaurée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10848) | 2 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des séances — Liste sans Renforcement du genou](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10937) | 2 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Calendrier — Jour suivant — Glissement gauche — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2059-267) | 1 | Écran7 Jour | CE-UI-02 | Carte compacte et barre4 ; JOUR-01 à04 |
| [Calendrier — Semaine — Après suppression d’une planification](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2074-86) | 2 | Écran7 Semaine / modale4 | CE-UI-03 | Nature, badge heure, durée ; SEM-01 à06 ; arrière-plan de modale inclus |
| [Calendrier — Semaine — Étirements — Actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2094-86) | 4 | Écran7 Semaine / modale4 | CE-UI-03 | Nature, badge heure, durée ; SEM-01 à06 ; arrière-plan de modale inclus |
| [Catalogue des séances — Archivées — actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-88) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Modal — Confirmer la suppression d’une séance archivée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-189) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Calendrier — Semaine — Mardi sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2252-86) | 4 | Écran7 Semaine / modale4 | CE-UI-03 | Nature, badge heure, durée ; SEM-01 à06 ; arrière-plan de modale inclus |
| [Catalogue des Exercices — Liste](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3786-5093) | 4 | Écran12 | CE-T03-02/05 | Sans/avec média, absence Déployer avec photo, synthèse ; CAR/MED |
| [Composition séance — Sélection exercices](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3789-5349) | 4 | Écran14 | CE-T03-07 | Case20, marge20, sans badge/actions ; état média ; CAR/MED/ICO |
| [Catalogue des séances — Filtrer — Panneau ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11149) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des Exercices — Filtrer — Panneau ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11262) | 4 | Écran12 | CE-T03-02/05 | Sans/avec média, absence Déployer avec photo, synthèse ; CAR/MED |
| [Modal — Confirmer l’archivage d’une séance planifiée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4593-6285) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des Exercices — Liste — Filtre inactif étendu](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4544-6344) | 1 | Écran12 | CE-T03-02/05 | Sans/avec média, absence Déployer avec photo, synthèse ; CAR/MED |
| [Catalogue des Exercices — Liste — Filtre actif étendu](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4544-6651) | 2 | Écran12 | CE-T03-02/05 | Sans/avec média, absence Déployer avec photo, synthèse ; CAR/MED |
| [Catalogue des séances — Liste — Filtre inactif étendu](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6382) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des séances — Filtre actif Archivé](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6742) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4592-6217) | 3 | Écran2 / modale3 | CE-T03-01 | Séance sans photo, classement, badge, archive/glissé ; CAR/CTX |
| [Catalogue des Exercices — Liste — actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6209) | 4 | Écran12 | CE-T03-02/05 | Sans/avec média, absence Déployer avec photo, synthèse ; CAR/MED |
| [Catalogue des Exercices — Liste — Première carte déployée — Média](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6355) | 4 | Écran12 | CE-T03-02/05 | Sans/avec média, absence Déployer avec photo, synthèse ; CAR/MED |
| [Modal — Choisir un exercice — Planification — Liste longue](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5451-4272) | 4 | Écrans7d/8g | CE-UI-04 | Radio, sans durée/actions, largeur354 ; SEL-01 à05 |

## États complémentaires — règles transverses applicables

| Frame courante | Description chapitre06 | Contrat chapitre13 | Portée exacte |
|---|---|---|---|
| [Profil — Vue d'ensemble - Vibration désactivée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-375) | Écrans1/1a | CE-UI-01 ; CE-T03-17 | Silhouette dans1a ; autres états : navigation/appuis uniquement, paramètres existants conservés |
| [Splash — Kodjo](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-469) | Shell transversal | CE-T03-17 | Navigation et appuis si présents ; aucun comportement nouveau |
| [Profil — Stepper Pause changement de côté](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-474) | Écrans1/1a | CE-UI-01 ; CE-T03-17 | Silhouette dans1a ; autres états : navigation/appuis uniquement, paramètres existants conservés |
| [Profil — Stepper Récupération après activité](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-579) | Écrans1/1a | CE-UI-01 ; CE-T03-17 | Silhouette dans1a ; autres états : navigation/appuis uniquement, paramètres existants conservés |
| [Profil — Vue d'ensemble - Vibration activée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-684) | Écrans1/1a | CE-UI-01 ; CE-T03-17 | Silhouette dans1a ; autres états : navigation/appuis uniquement, paramètres existants conservés |
| [Profil — Modifier le profil — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-778) | Écrans1/1a | CE-UI-01 ; CE-T03-17 | Silhouette dans1a ; autres états : navigation/appuis uniquement, paramètres existants conservés |
| [Calendrier — Mois](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5237) | Écran7 | CE-UI-02/03 | État vide/Mois : shell, segmenté et navigation ; pas de carte ajoutée |
| [Planifier une séance — Test picker date ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6622) | Écran8 | CE-UI-05 | Champs, paramètres et appuis ; PLAN-01 à05 |
| [Planifier une séance — Création](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6838) | Écran8 | CE-UI-05 | Champs, paramètres et appuis ; PLAN-01 à05 |
| [Planifier une séance — Test picker rappel personnalisé ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7187) | Écran8 | CE-UI-05 | Champs, paramètres et appuis ; PLAN-01 à05 |
| [Planifier une séance — Test rappel personnalisé sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7369) | Écran8 | CE-UI-05 | Champs, paramètres et appuis ; PLAN-01 à05 |
| [Planifier une séance — Stepper Nombre de semaines](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7537) | Écran8 | CE-UI-05 | Champs, paramètres et appuis ; PLAN-01 à05 |
| [Planifier une séance — Aucune répétition](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7716) | Écran8 | CE-UI-05 | Champs, paramètres et appuis ; PLAN-01 à05 |
| [Exécution d'une séance — Démarrée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8132) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Exécution d'un exercice — Démarrée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8188) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Modal — Réinitialiser l’activité](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8224) | Modales5/6/7 | CE-T03-09 à13 ; D-213 | Animation des commandes seulement ; confirmations inchangées |
| [Modal — Passer à l’activité suivante](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8326) | Modales5/6/7 | CE-T03-09 à13 ; D-213 | Animation des commandes seulement ; confirmations inchangées |
| [Modal — Séance en pause](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8428) | Modales5/6/7 | CE-T03-09 à13 ; D-213 | Animation des commandes seulement ; confirmations inchangées |
| [Exécution d'une séance — Démarrée — Bips et vocal désactivés](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8530) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Exécution d'une séance — Initial](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8626) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Synthèse de séance — Terminée —  Évaluation initiale](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8718) | Écrans10/18 | CE-T03-14 ; D-213 | Appuis et navigation si présents ; Ressenti/statuts non recolorés par palette de sélection |
| [Synthèse de séance — Terminée — Ressenti sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8780) | Écrans10/18 | CE-T03-14 ; D-213 | Appuis et navigation si présents ; Ressenti/statuts non recolorés par palette de sélection |
| [Synthèse d'exécution — Exercice Terminé —  Évaluation initiale](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8055) | Écrans10/18 | CE-T03-14 ; D-213 | Appuis et navigation si présents ; Ressenti/statuts non recolorés par palette de sélection |
| [Synthèse d'exécution — Exercice Terminé —  Ressenti sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8105) | Écrans10/18 | CE-T03-14 ; D-213 | Appuis et navigation si présents ; Ressenti/statuts non recolorés par palette de sélection |
| [Synthèse de séance — Partielle — Évaluation initiale](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4760-6448) | Écrans10/18 | CE-T03-14 ; D-213 | Appuis et navigation si présents ; Ressenti/statuts non recolorés par palette de sélection |
| [Synthèse de séance — Partielle — Ressenti sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4760-6500) | Écrans10/18 | CE-T03-14 ; D-213 | Appuis et navigation si présents ; Ressenti/statuts non recolorés par palette de sélection |
| [Composition séance — Initial](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11137) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Composition séance — Étiquettes](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11204) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Composition séance — Abandon](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11298) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Composition séance — Compte à rebours](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11375) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Composition séance — Fin](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11457) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Composition séance — Standard](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11700) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Composition séance — Actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11808) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Composition séance — Nom saisi](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-12003) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Catalogue des séances — État vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2117-86) | Écran2 ou12 | CE-T03-01/02/03 | État vide : contexte34, segmenté354 et navigation ; zéro carte fictive |
| [Suivi — Séances — État vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2117-190) | Écran11 | CE-T03-15 | État vide : contexte34, navigation ; Vue d’ensemble horsMVP |
| [Calendrier — Jour — État vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2128-86) | Écran7 | CE-UI-02/03 | État vide/Mois : shell, segmenté et navigation ; pas de carte ajoutée |
| [Profil — Vue d'ensemble — Parcours vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2139-86) | Écrans1/1a | CE-UI-01 ; CE-T03-17 | Silhouette dans1a ; autres états : navigation/appuis uniquement, paramètres existants conservés |
| [Composition séance — Déplacement](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3518-4576) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Création activité — Avant Paramètres d'exécution](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3542-4656) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Initial](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3943-6064) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Durée de l'exerciceouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3556-7645) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Pause — sélecteur ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3556-7712) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Contrôle déployé — 3 séries (stepper)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3556-7801) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Répétitions](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3561-7673) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Création activité — À l’échec](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3561-7802) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Création activité — Durée totale ajustée — message temporaire](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3580-4957) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Composition séance — Point d’arrêt](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3722-5061) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Composition séance — Étiquette sélectionnée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4581-6404) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Modification d'une séance](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5271-5455) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Ajouter un exercice — Nom Description Media](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4217-6980) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Catégorie renseignée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5088-6398) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Phrase éditée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4279-7044) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Modifier un exercice](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4734-6342) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Catégories](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4332-7095) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Mode d’exécution (3 pastilles)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4367-7128) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Modèle paramètre — Compte à rebours](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4367-7276) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Changement de côté (3 pastilles)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4367-7906) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Modèle paramètre — Durée totale — Roulette ouverte](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4367-8193) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Nouvelle catégorie](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4474-7157) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Zones corporelles](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4478-7209) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Catalogue des exercices — État vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4521-6220) | Écran2 ou12 | CE-T03-01/02/03 | État vide : contexte34, segmenté354 et navigation ; zéro carte fictive |
| [Composition séance — Nouvelle étiquette](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4640-6308) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Ajouter un exercice — Nouvelle zone corporelle](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4683-6336) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Modal — Abandonner la création de l’activité](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4714-6241) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Composition séance — Étiquettes — Appui long — Confirmation suppression](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4861-6145) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Ajouter un exercice — Catégorie — Appui long — Confirmation suppression](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4861-6259) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4861-6348) | Écrans4/15 / modale2 | CE-T03-04/16 | Contexte34/gap12, silhouette, états sélection, animations ; paramètres métier conservés |
| [Composition d’une séance — Placement d’un point d’arrêt](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4893-6675) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |
| [Exécution d'un exercice — Initial — Bascule basse (média) avec Cercle](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4997-6113) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Exécution d'un exercice — Initial — Bascule haute avec média](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5588-4363) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Exécution d'un exercice — Média plein écran](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5009-6069) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Exécution d'un exercice — Initial - Cercle avec Texte](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5021-5994) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Exécution d'un exercice — Démarré —  Bascule haute avec texte](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5581-4257) | Écrans9/16/17 | CE-T03-09 à13 ; CE-MEDIA-EXEC-01/02 | Appuis des contrôles ; moteur, médias d’exécution et transitions métier inchangés |
| [Composition séance — Retirer un point d’arrêt](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5301-5443) | Écran3 / Écran6 / modales | CE-T03-06/08 | Contexte34/gap10/cible44 ; cartes sans pause/récupération ; structure conservée |

## Critères transverses hérités

| Axe | Contrôle applicable |
|---|---|
| Navigation | Quatre dessins actuels, trait2, dessin≤24 ; Profil people-outline ; actif bleu et non actif gris ; Search du set n’active pas une fonction |
| Appui | D-213 : dilatation centrée, action immédiate au relâchement ; sortie de cible annule ; réduction des animations par opacité |
| Commandes contextuelles |34 visibles,20 dessin,44 cible ; gap12 ou10 Composition ; Aujourd’hui/Planifier Calendrier32 acceptés aprèsT04 |
| Segmenté trois choix |354 sur402, marges24, padding4, gaps4, options112,67 ; pas de généralisation aux autres sélecteurs |
| Sélection | #0508E5 / #5C636E / #C2C4D1 ; Ressenti/statuts/boutons à fond coloré exclus |
| Données | Pas d’inférence depuis les exemples ; données/calculs préservés malgré retrait de textes de carte |

## Documents mis à jour à leur emplacement

Chapitre06 : Profil, Catalogue Séances, Composition, éditeur, Calendrier Jour/Semaine/Mois, choix/planification, Suivi, Catalogue Exercices, multisélection et règles transverses. Chapitre13 : CE-T03-01/02/04/05/07/08/15/16/17 et cinq contrats complémentaires CE-UI-01 à05. Les décisions closes D-214/D-215 sont traduites dans les données affichées, structures, contrôles, invariants et recettes des contrats concernés.
