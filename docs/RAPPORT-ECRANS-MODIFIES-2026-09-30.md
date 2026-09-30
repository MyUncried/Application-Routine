# Écrans modifiés — liste de référence

Liste établie par un balayage du fichier Figma (identifiants de nœuds actuels, au 30 septembre 2026). Un écran est listé s'il contient au moins un élément que nous avons modifié. Les codes de la dernière colonne indiquent la nature des modifications.

## Légende des modifications

| Code | Modification |
|---|---|
| **C** | cartes remplacées par des instances des composants « Carte séance » / « Carte exercice » |
| **J** | cartes du calendrier « Jour » (contexte « Calendrier Jour ») |
| **N** | barre de navigation (composant « Navigation / Bottom » reconstruit, nouvelles icônes) |
| **B** | boutons d'action contextuelle (cercles de 34 px, pictogrammes de 20 px, zones tactiles de 44 px, centrage vertical) |
| **S** | contrôle segmenté à 3 options (options de 112,67 px, cadre de 354 px à 24 px du bord) |
| **I** | icônes de catégorie et de zone corporelle (composants vectoriels ; silhouettes homme et femme) |
| **P** | choix de silhouette homme / femme sans texte |

Les icônes de catégorie et de zone corporelle des cartes, ainsi que la mise en page des cartes, sont héritées des composants : elles ne sont pas signalées séparément (code I) sur les écrans où elles ne viennent que d'une carte.

## Page « Prototype MVP » — 78 écrans

| Référence | Titre | Modifications |
|---|---|---|
| `1992:375` | Profil — Vue d'ensemble - Vibration désactivée | N |
| `1992:474` | Profil — Stepper Pause changement de côté | N |
| `1992:579` | Profil — Stepper Récupération après activité | N |
| `1992:684` | Profil — Vue d'ensemble - Vibration activée | N |
| `1992:778` | Profil — Modifier le profil — MVP | IP |
| `1992:5101` | Calendrier — Semaine | CNS |
| `1992:5237` | Calendrier — Mois | NS |
| `1992:5365` | Modal — Supprimer une planification unique — Calendrier | CNS |
| `1992:5510` | Calendrier — Jour — MVP | CJNS |
| `1992:5602` | Calendrier — Jour — Appui long — MVP | CJNS |
| `1992:5697` | Calendrier — Jour — MAJ — MVP | CJNS |
| `1992:5794` | Calendrier — Jour — Créneau à planifier — MVP | CJNS |
| `1992:5962` | Calendrier — Semaine — Actions glissées | CNS |
| `1992:6102` | Modal — Supprimer des occurrences — Calendrier | CNS |
| `1992:6249` | Modal — Choisir une séance — Planification — Liste longue | CNS |
| `1992:6389` | Calendrier — Semaine — Séance déployée | CNS |
| `1992:6622` | Planifier une séance — Test picker date ouvert | NS |
| `1992:6838` | Planifier une séance — Création | NS |
| `1992:7187` | Planifier une séance — Test picker rappel personnalisé ouvert | NS |
| `1992:7369` | Planifier une séance — Test rappel personnalisé sélectionné | NS |
| `1992:7537` | Planifier une séance — Stepper Nombre de semaines | NS |
| `1992:7716` | Planifier une séance — Aucune répétition | NS |
| `1992:7861` | Planifier une séance — Chioisir la séance | CNS |
| `1992:8843` | Suivi — Séances — Liste condensée | CNBS |
| `1992:8996` | Suivi — Séances — Vue déployée | CNBS |
| `1992:9910` | Catalogue des séances — Liste par défaut | CNBS |
| `1992:10014` | Catalogue des séances — Séance déployée | CNBS |
| `1992:10518` | Catalogue des séances — Liste condensée — actions glissées | CNBS |
| `1992:10628` | Catalogue des séances — Séance déployée — actions glissées | CNBS |
| `1992:10848` | Catalogue des séances — Archivées — Séance restaurée | CNBS |
| `1992:10937` | Catalogue des séances — Liste sans Renforcement du genou | CNBS |
| `2028:11137` | Composition séance — Initial | B |
| `2028:11204` | Composition séance — Étiquettes | B |
| `2028:11298` | Composition séance — Abandon | B |
| `2028:11375` | Composition séance — Compte à rebours | B |
| `2028:11457` | Composition séance — Fin | B |
| `2028:11700` | Composition séance — Standard | B |
| `2028:11808` | Composition séance — Actions glissées | B |
| `2028:12003` | Composition séance — Nom saisi | B |
| `2059:267` | Calendrier — Jour suivant — Glissement gauche — MVP | CJNS |
| `2074:86` | Calendrier — Semaine — Après suppression d’une planification | CNS |
| `2094:86` | Calendrier — Semaine — Étirements — Actions glissées | CNS |
| `2117:86` | Catalogue des séances — État vide | NBS |
| `2117:190` | Suivi — Séances — État vide | NBS |
| `2128:86` | Calendrier — Jour — État vide | NS |
| `2139:86` | Profil — Vue d'ensemble — Parcours vide | N |
| `2234:88` | Catalogue des séances — Archivées — actions glissées | CNBS |
| `2234:189` | Modal — Confirmer la suppression d’une séance archivée | CNBS |
| `2252:86` | Calendrier — Semaine — Mardi sélectionné | CNS |
| `3518:4576` | Composition séance — Déplacement | B |
| `3943:6064` | Ajouter un exercice — Initial | BI |
| `3722:5061` | Composition séance — Point d’arrêt | B |
| `4581:6404` | Composition séance — Étiquette sélectionnée | B |
| `5271:5455` | Modification d'une séance | B |
| `3786:5093` | Catalogue des Exercices — Liste | CNBS |
| `3789:5349` | Composition séance — Sélection exercices | CB |
| `4168:11149` | Catalogue des séances — Filtrer — Panneau ouvert | CNBS |
| `4168:11262` | Catalogue des Exercices — Filtrer — Panneau ouvert | CNBS |
| `4593:6285` | Modal — Confirmer l’archivage d’une séance planifiée | CNBS |
| `4217:6980` | Ajouter un exercice — Nom Description Media | BI |
| `5088:6398` | Ajouter un exercice — Catégorie renseignée | BI |
| `4332:7095` | Ajouter un exercice — Catégories | BI |
| `4474:7157` | Ajouter un exercice — Nouvelle catégorie | BI |
| `4478:7209` | Ajouter un exercice — Zones corporelles | BI |
| `4521:6220` | Catalogue des exercices — État vide | NBS |
| `4544:6344` | Catalogue des Exercices — Liste — Filtre inactif étendu | CNBS |
| `4544:6651` | Catalogue des Exercices — Liste — Filtre actif étendu | CNBS |
| `4549:6382` | Catalogue des séances — Liste — Filtre inactif étendu | CNBS |
| `4549:6742` | Catalogue des séances — Filtre actif Archivé | CNBS |
| `4592:6217` | Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité | CNBS |
| `4640:6308` | Composition séance — Nouvelle étiquette | B |
| `4683:6336` | Ajouter un exercice — Nouvelle zone corporelle | BI |
| `4738:6209` | Catalogue des Exercices — Liste — actions glissées | CNBS |
| `4738:6355` | Catalogue des Exercices — Liste — Première carte déployée — Média | CNBS |
| `4861:6259` | Ajouter un exercice — Catégorie — Appui long — Confirmation suppression | BI |
| `4893:6675` | Composition d’une séance — Placement d’un point d’arrêt | B |
| `5301:5443` | Composition séance — Retirer un point d’arrêt | B |
| `5451:4272` | Modal — Choisir un exercice — Planification — Liste longue | CNS |

## Page « Profil » — 1 écran

| Référence | Titre | Modifications |
|---|---|---|
| `1354:182` | Profil — Cible post-MVP | N |

## Page « Suivi » — 2 écrans

| Référence | Titre | Modifications |
|---|---|---|
| `1842:2` | Suivi — Séances — Vue déployée | NS |
| `3401:86` | Suivi — Vue d’ensemble | N |

## Page « Archives — Écrans retirés du prototype » — 3 écrans

| Référence | Titre | Modifications |
|---|---|---|
| `1992:10129` | Recherche globale — Champ déployé | NS |
| `1992:10320` | Recherche globale — Résultats affichés | NS |
| `3841:8375` | HISTORIQUE — Catalogue Séances — ancien arbre Créer — supersédé D-187 | NS |

## Autres cadres et pages modifiés (hors écrans)

| Référence | Titre | Page | Nature de la modification |
|---|---|---|---|
| `2317:87` | KODJO — 8 familles structurantes | Référence responsive — Cible | 72 icônes de navigation, de catégorie et de zone remplacées ; non contrôlé visuellement, hors périmètre |
| `5993:3540` à `5993:3543` | Barre — Repos (Catalogues actif), Barre — Appui, Barre — Arrivée (dépassement), Barre — Repos (Profil actif) | Démonstrations — Animations d'appui | nouvelles icônes de navigation |
| `5988:4933`, `5988:4934` | Onglet de navigation — Repos et Appui | Démonstrations — Animations d'appui | icône Profil remplacée (24 px au repos, 28,8 px à l'appui) |
| `6310:9684`, `6310:9688` | Bouton d'action contextuelle — Repos et Appui | Démonstrations — Animations d'appui | démo ajoutée (34 px, appui ×1,2 = 40,8 px) |
| `6354:15686` | Wireframe — Cartes AVANT | Cartes - Icônes | référence figée, section de test d'icône de nature |
| `6354:16089` | Wireframe — APRÈS | Cartes - Icônes | cartes redessinées, carte déployée avec zone sur une ligne à part, cartes « Jour » |
| `6354:16964` | Wireframe — Photo | Cartes - Icônes | état des cartes d'exercice avec photo (cinq cartes) |
| `6354:17843` | Wireframe — Icônes de navigation | Cartes - Icônes | comparaison avant / après des icônes de la barre |
| `6354:17913` | Icônes — sélectionné, non sélectionné, inactif | Cartes - Icônes | écran créé : 27 icônes hors barre de navigation dans trois états |
| `6214:7276`, `6214:7278` | Carte séance, Carte exercice (composants) | Composants — Cartes | variantes de cartes créées, dont « Calendrier Jour » |
| `6296:10465` | DSF V2 / Icônes — navigation et catégorie | Design system — Fondations | section créée : 6 composants d'icônes (`icon/catalogue`, `icon/calendrier`, `icon/suivi`, `icon/profil`, `icon/categorie`, `icon/zone-corporelle`) |
| `6298:12462` | Navigation / Bottom | Design system — Fondations | composant de navigation reconstruit (5 variantes) |

## Notes

- Total : 84 écrans, dont 78 dans « Prototype MVP ».
- Écrans non modifiés à dessein : « Ajouter un exercice — Mode d'exécution (3 pastilles) » et « … Changement de côté (3 pastilles) », dont le contrôle segmenté est un autre composant.
- Les composants de cartes, de navigation et d'icônes ne sont pas des écrans ; ils figurent dans la dernière section pour mémoire.
