# Arbitrage de Hermann du 26/10/2026 — proposition de reprise (Q1 à Q11, lot R-1)

> Réponses à `sprint-change-proposal-2026-10-26.md` §5. Q1 et Q2 : verbatim. Q3 à Q11 : Hermann a choisi « appliquer les recommandations » de la proposition. Lot documentaire §4 (R-1) : validé.

## Q1 — verbatim

Q1 — OUI, appliquer intégralement C05 dès cette tranche.

L'occurrence doit référencer directement le Mouvement et lire son contenu courant. Elle conserve uniquement ses paramètres locaux, sa position et sa récupération contextuelle.

Aucune duplication persistante du contenu partagé, aucun mécanisme de propagation ou synchronisation de copies.

Les instantanés d'exécution restent autonomes et figés. Préserver l'intégrité des références actives au Mouvement.

Cette évolution est à réaliser maintenant, avant le développement du moteur d'exécution.

## Q2 — verbatim

Q2 — OUI, migration 013 avec réinitialisation ponctuelle.

Conserver le Profil, les Catégories, les Zones corporelles et les Étiquettes, y compris leurs personnalisations.

Réinitialiser les Mouvements, groupes de Niveaux, Exercices et Séances, ainsi que leurs associations devenues obsolètes.

Ne pas supprimer d'autres données sans nécessité réelle. Garantir une migration unique, sans réinitialisation aux démarrages suivants.

Tester la migration sur une copie de base et me prévenir avant l'installation de la version entraînant la perte des données de recette sur mon iPhone.

## Consignes générales — verbatim

Intègre ces décisions au périmètre de la nouvelle tranche, en partant de D-445 et de la documentation MFN v7.

Privilégie le modèle le plus simple répondant aux règles validées. Ne développe pas de mécanisme transitoire inutile et n'ajoute pas de procédure de contrôle supplémentaire.

## Q3 à Q11 — recommandations retenues

| Question | Réponse retenue |
|---|---|
| Q3 Suffixe « (copie) » | A : attribut d'occurrence non éditable (numéro de copie), affiché après le nom du mouvement ; libellé inchangé |
| Q4 Répétitions chiffrées avec phases, entre cible et Suivant | A : le motif continue de boucler, sans signal |
| Q5 Activation des phases | A : deux phases aux durées vides, à renseigner (pas de préremplissage D-432) |
| Q6 Cadence avec phases | Réglable et sonore, sans changement (D-375) |
| Q7 Annonce des phases | A : chaque libellé à chaque cycle ; consigné, implémenté avec T04 |
| Q8 Cible plus courte que le motif | A : permise, sans avertissement |
| Q9 Phases et formats | A : compatibles avec tous les formats ; contraintes du format sur le mode, la cible et les séries seulement |
| Q10 Rattachement après « Créer un nouveau mouvement » | Aucun rattachement automatique ; rattachement ultérieur par C08 (différé) |
| Q11 Hors moteur T04 | Hors PRE-7 : instantanés, refus de lancement, guidage minuté, annonces, progression. Dans PRE-7 : signalement des durées manquantes et module pur `phaseGuidance.ts` testé |

## Lot documentaire R-1

Validé tel que décrit au §4 de la proposition, complété par Q1 à Q11 ci-dessus.
