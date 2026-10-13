# KODJO — Deux modes d’exécution et cible À l’échec par série

**Version :** 1.0 — 13 octobre 2026.  
**Statut :** spécification de conception consolidée intégrée à la documentation ; réalisation applicative non livrée par ce lot.  
**Périmètre :** paramètres, exécution, calculs, relevés, données, migration et impacts documentaires. Layout de création aligné sur les captures Figma du13/10. Écrans de saisie/restitution des relevés, charge et indicateur étalon hors périmètre. Aucun code ni fichier Figma modifié.

## 1. Sources et décisions

Source initiale : `KODJO_Proposition_Deux-modes-et-echec-par-serie_2026-10-12.md`. Compléments : arbitrages d’Hermann des 12 et 13 octobre dans cette conversation, jusqu’à la validation de la conservation d’une estimation non confirmée.

Références comparées : main `46b91bd2`, spécification Bip v2, Paramètres v13, Phrase v1 et corpus v15, chapitres 09/10/13 ; branche documentaire Circuits, commit `84987917`, comprenant la spécification Circuits du 12/10. Ces repères décrivent les versions effectivement consultées ; l’intégration devra reprendre la tête courante et conserver les évolutions parallèles.

| ID | Décision ou conséquence | Origine |
|---|---|---|
| EC-01 | Deux modes communs à l’exercice : Durée et Répétitions | Proposition transmise |
| EC-02 | Chaque série possède une cible chiffrée du mode ou À l’échec | Proposition transmise |
| EC-03 | ≥ autorisé au niveau Exercice pour un total partiel calculable ; toutes séries à l’échec : total masqué | Arbitrage consigné dans la proposition |
| EC-04 | Répétitions sans bip : pas de durée totale calculée à l’Exercice, avec ou sans échec | Clarification explicite du 13/10 |
| EC-05 | Compaction mixte « de 10 rép. à l’échec » / « de 1 min 30 s à l’échec » ; option À l’échec en tête du sélecteur de valeur | Arbitrages consignés dans la proposition |
| EC-06 | Relevé par occurrence de série exécutée et par côté | Proposition transmise |
| EC-07 | Avec bip, le nombre de bips propose un relevé de répétitions, modifiable | Arbitrage du 13/10 |
| EC-08 | Proposition non confirmée : estimation conservée ; confirmation ou correction : valeur déclarée | Validation du 13/10 |
| EC-09 | Réinitialisation : temps actif cumulé conservé ; relevé de la dernière tentative terminée | Validation du 13/10 |
| EC-10 | L’enchaînement ne dépend pas de la saisie ou confirmation du relevé | Proposition transmise ; conséquences EC-07/08 |

Les identifiants EC sont locaux à cette spécification ; ils ne réservent pas de numéros dans le registre global.

## 2. Modèle de paramètres

Le mode reste unique pour l’exercice. La cible devient une propriété de chaque série effective :

- **Cible chiffrée** : durée en secondes si mode Durée ; entier de répétitions si mode Répétitions.
- **Cible À l’échec** : aucune valeur numérique prescrite ; fin décidée par l’utilisateur.
- **Cible incomplète ou invalide** : erreur de saisie distincte, jamais convertie implicitement en À l’échec.

Une représentation typée distinguera explicitement cible chiffrée et cible à l’échec. Ni `0`, ni une chaîne dans un champ numérique, ni un simple `null` ambigu ne doivent porter seuls cette distinction. Le nom physique des champs et le schéma de migration restent des choix d’implémentation.

Le régime identiques/variables reste indépendant du mode. En identiques, toutes les séries ont la même cible, y compris À l’échec. En variable, la collection peut mélanger cibles numériques et À l’échec ; l’ordre est conservé. Des cibles momentanément égales ne changent pas automatiquement le régime. N=1 suit la normalisation déjà actée.

Les mêmes prescriptions s’appliquent aux deux côtés ; leurs résultats sont distincts. Nombre hérité d’un circuit de séries, ajout, suppression, copie de dernière ligne, déplacement, retour au régime identique et restauration temporaire suivent les règles existantes. Copier une cible À l’échec copie son type et sa pause, sans inventer de nombre.

Une bascule Durée/Répétitions conserve le caractère À l’échec, indépendant de l’unité. Les cibles numériques incompatibles suivent les mécanismes existants de brouillon, mise à renseigner et restauration ; aucune conversion secondes ↔ répétitions n’est introduite.

## 3. Exécution et plan développé

| Mode | Cible | Mesure pendant l’effort | Fin normale |
|---|---|---|---|
| Durée | Chiffrée | Minuteur de la durée prescrite | Fin automatique existante |
| Durée | À l’échec | Temps d’effort écoulé | Suivant, sans confirmation |
| Répétitions | Chiffrée | Comportement existant, nominal estimé si bip positif | Suivant, sans confirmation |
| Répétitions | À l’échec | Temps d’effort et proposition de répétitions si bip positif | Suivant, sans confirmation |

La cible À l’échec n’est pas une durée infinie ni une durée zéro. Elle n’a pas de fin nominale. L’appui sur Suivant termine l’effort prescrit ; il ne prouve pas à lui seul un échec physiologique détecté par l’application.

Les règles existantes de Pause/Reprendre, Retour, réinitialisation, abandon et arrière-plan restent applicables. Chaque phase effective connaît le mode, la nature de cible, l’occurrence de série, le côté, le passage et le circuit éventuel.

### 3.1 Pauses, côtés et circuits

Aucune modification des règles déjà actées : pause après chaque série, traitement bilatéral, substitution de la toute dernière pause par une récupération positive, points d’arrêt et phases propres de séance. Le plan développé demeure la base de calcul.

Dans un circuit de séries, le passage bilatéral reste : premier côté → pause de changement de côté → second côté → pause de série ou récupération substituée → exercice suivant. Il n’y a pas de pause de série supplémentaire avant la pause de changement de côté. La nouvelle cible ne crée aucune exception.

### 3.2 Progression et sécurité

La classification doit porter sur la série effective :

- Cible À l’échec, dans les deux modes et avec ou sans bip : travail sans durée nominale ; poids acquis à Suivant selon le principe existant des étapes indéterminées.
- Durée chiffrée : progression temporelle existante.
- Répétitions chiffrées avec bip : progression selon le nominal estimé, sans fin automatique ; bips supplémentaires sans progression supplémentaire.
- Répétitions chiffrées sans bip : progression existante acquise à Suivant.

Les formules de pondération ne changent pas ; les prédicats de RM-077/RM-126 doivent être réécrits. « Mode Durée » ne suffit plus à reconnaître une phase chronométrée à fin automatique.

La sécurité existante sans fin nominale (2 h sans interaction selon la règle actuelle) s’applique à toute cible À l’échec. Les 30 min après nominal recalculé restent réservées aux répétitions chiffrées avec bip. Les transitions de Durée chiffrée restent celles du minuteur. Pas de nouveau seuil.

## 4. Calcul de la durée prévisionnelle

Pour une série i :

- Durée chiffrée : travail connu Ti = durée prescrite.
- Répétitions chiffrées, bip b > 0 : travail estimable Ti = Ri × b.
- À l’échec : travail inconnu, quel que soit le mode ou le bip.
- Répétitions sans bip : travail inconnu, même avec cible numérique.

Les pauses et répétitions de passages proviennent du plan développé, sans réintroduire les phases propres d’un exercice dans une séance. Compte à rebours/Fin sont exclus du total intrinsèque de l’exercice selon les règles existantes.

| Configuration de l’exercice | Résultat prévisionnel | Affichage |
|---|---|---|
| Durée, toutes cibles chiffrées | exact | Durée sans symbole |
| Durée, mélange chiffré/échec | lowerBound | ≥ suivi du total partiel |
| Répétitions avec bip, toutes cibles chiffrées | estimated | ≈ suivi du total |
| Répétitions avec bip, mélange chiffré/échec | lowerBound | ≥ suivi du total partiel |
| Répétitions sans bip, toutes configurations de cibles | omitted | Aucun total d’Exercice |
| Toutes séries à l’échec, dans les deux modes | omitted | Aucun total d’Exercice |

Pour un mélange calculable, le total partiel comprend les contributions de travail connues ou estimables et les pauses réellement prévues. Le travail inconnu n’est pas remplacé par une estimation arbitraire.

Comme dans l’agrégation existante, ≥ sur des répétitions cadencées exprime un total prévisionnel partiel intégrant une estimation. Il ne garantit pas une borne mathématique du temps réel si l’utilisateur accélère ou abrège.

L’omission à l’Exercice ne supprime pas ses pauses du total Circuit/Séance. Ceux-ci conservent le traitement de travail inconnu et de contributions connues déjà spécifié. Une saisie invalide reste une erreur de validation et n’est pas assimilée à omitted.

Dès qu’une cible est À l’échec, aucun calcul inverse depuis un total saisi n’est disponible. Le total applicable est en lecture seule ; omitted reste absent. Le verrouillage déjà imposé par un circuit de séries reste également applicable.

## 5. Relevés d’exécution

Le relevé est distinct de la prescription et des totaux temporels de l’exécution. Il concerne les séries prescrites À l’échec ; cette évolution n’étend pas la saisie de répétitions réalisées à toutes les séries chiffrées.

### 5.1 Origine et qualification

| Cas | Valeur | Qualification |
|---|---|---|
| Durée à l’échec terminée | Temps actif de la dernière tentative terminée | Chronométrée |
| Répétitions à l’échec avec bip, sans confirmation | Nombre de bips proposé | Estimée |
| Même cas, confirmation sans correction | Nombre confirmé | Déclarée |
| Même cas, correction | Nombre corrigé | Déclarée |
| Répétitions à l’échec sans bip, saisie | Nombre renseigné | Déclarée |
| Répétitions à l’échec sans bip, aucune saisie | Absence de valeur | Non renseignée |

Ni Suivant, ni le passage à l’exercice suivant, ni l’enregistrement global de la séance ne constituent implicitement une confirmation de l’estimation. Le relevé n’est pas requis pour poursuivre. Absence de saisie et zéro sont distincts ; zéro peut notamment être la proposition après une fin avant le premier bip.

Le bip ne détecte pas le mouvement. La confirmation produit une déclaration de l’utilisateur, pas une mesure automatique certifiée. Une série à l’échec ne devient pas temporellement calculable parce qu’un relevé de répétitions lui est associé après exécution.

### 5.2 Comptage de la proposition

Réutiliser la chronologie logique des intervalles du bip ; ne pas faire dépendre la donnée du volume, de l’activation du son ou du nombre de fichiers audio effectivement joués. Le premier bip est après un intervalle complet, conformément à la spécification existante. Les signaux de préparation, pauses, changements de côté et fin ne comptent pas comme répétitions.

Une Pause suspend les intervalles selon la mécanique existante. Le comptage conserve les intervalles acquis ; une fraction abandonnée à la Pause ne devient pas une répétition complète. Ne pas remplacer cette logique par une division globale du temps cumulé lorsque des pauses ou réinitialisations sont intervenues. La priorité existante de la transition évite de compter deux fois une échéance à la fin d’une série. La reprise et les événements répétés doivent rester idempotents.

### 5.3 Réinitialisation

Le temps actif cumulé conserve les tentatives antérieures. Le relevé correspond à la dernière tentative terminée pour l’occurrence concernée ; une tentative remplacée par réinitialisation n’est pas additionnée à sa performance.

Exemple validé : 20 s → Réinitialiser → 35 s → Suivant donne 55 s de temps actif cumulé et 35 s de relevé. Les pauses manuelles n’entrent pas dans le temps actif de cette tentative. Une simple Pause/Reprendre ne constitue pas une réinitialisation.

Pour les répétitions proposées, le compteur de la tentative est réinitialisé dans le même périmètre que la tentative concernée. Les résultats hors du périmètre réinitialisé restent conservés conformément aux règles existantes.

### 5.4 Identité et historique

Le rattachement utilise l’occurrence exécutée : exécution, exercice de l’instantané, série, côté et passage/circuit applicables. Deux tours ou deux côtés n’écrasent pas le même relevé.

Conserver au minimum la valeur facultative, son unité, son origine (chronomètre, proposition issue du bip, saisie utilisateur), sa qualification (chronométrée, estimée, déclarée ou absente) et son rattachement à la tentative. Conserver la proposition source lorsqu’elle est corrigée permet de distinguer calcul et déclaration. Ce modèle est fonctionnel ; il ne prescrit pas encore des noms de colonnes SQL.

Un abandon conserve les données partielles selon les règles existantes ; une tentative interrompue ne doit pas être présentée comme une performance terminée à l’échec. Le contrat détaillé de saisie et de correction, notamment après la séance, sera conçu dans le chantier d’écran prévu séparément. Cette spécification n’ouvre pas implicitement une édition illimitée de l’historique.

## 6. Phrases, cartes et contrôles

Le sélecteur de mode ne propose plus que Durée/Répétitions. À l’échec est une valeur de la cible, en tête du sélecteur avant la plus petite valeur numérique. Aucun interrupteur ni nouvelle ligne métier n’est ajouté. L’implantation vérifiée est décrite dans le DSF Deux modes du13/10 et CE-UI-10.

La référence de rédaction actuelle est Phrase v1 et son corpus v15 de 276 cas, non le seul document historique v10.2. Le générateur continue de produire des segments ordonnés `{texte, gras}`, avec valeurs et unités mises en forme, et aucune phrase persistée en base.

- Toutes cibles à l’échec : conserver « N séries jusqu’à l’échec » et les clauses applicables, sans total d’Exercice.
- Jusqu’à trois cibles variables : énumération dans l’ordre, admettant une entrée à l’échec ; les gabarits complets devront être ajoutés au corpus de référence.
- Au-delà de trois cibles, cas mixte : borne basse = minimum des valeurs numériques ; fin « à l’échec », selon EC-05. Ce raccourci est rédactionnel, sans supposer que la performance réelle dépassera la plus grande cible numérique.
- Répétitions sans bip : aucun total dans la phrase, même pour un mélange de cibles.
- Les clauses de pauses et de côtés conservent la grammaire existante ; aucune nouvelle énumération des pauses variables.

Les cartes de volumes et la grille doivent utiliser le type de cible par série. Dans la grille, ✓ peut représenter la cible À l’échec comme convenu, sans devenir une marque d’accomplissement ; le mode Durée/Répétitions doit rester identifiable puisque toutes les cibles d’un exercice peuvent être à l’échec. Les textes exacts d’unité et leur placement seront traités lors de l’alignement des contrats et du design, sans réintroduire un troisième mode.

Le corpus devra couvrir systématiquement les modes, bip nul/positif, régime identique/variable, tout numérique/tout échec/mixte, positions de l’échec, N=1/2/3/>3, bilatéralité et pauses. Les exemples Excel ne deviennent jamais un moteur de durée.

## 7. Migration et compatibilité

Tout ancien exercice en mode À l’échec est interprété comme Répétitions avec toutes ses séries à l’échec. Conserver nombre, pauses, bip, côté, ordre et autres paramètres. Fin par Suivant, omission du total et phrase existante restent préservées.

Appliquer la transformation aux définitions et copies concernées, pas seulement au Catalogue. Les instantanés et résultats historiques restent interprétables selon leur version ; ne pas réécrire un résultat historique ni lui attribuer rétrospectivement des répétitions à partir d’un temps global.

La migration est comportementalement conservatrice, mais nécessite une conception technique : inventaire des enums/champs existants, versionnement, lecture de l’ancien format, transformation atomique, copies, reprises et compatibilité des données déjà sauvegardées. Ne pas déclarer une migration SQL définie avant inventaire du schéma réel.

Le chronométrage existant ne garantit pas à lui seul que la durée de dernière tentative soit déjà disponible : le modèle documenté stocke notamment le temps cumulé, tentatives réinitialisées comprises. Il faut vérifier l’état moteur effectivement conservé et compléter la persistance de tentative si nécessaire. Le coût technique n’est donc pas déclaré nul.

## 8. Analyse d’impacts documentaires

| Support | Modification à propager |
|---|---|
| Glossaire 00 et concepts 04 | Deux modes ; cible À l’échec ; distinguer prescription, performance et temps cumulé |
| Parcours 03, vision/besoins/périmètre 01/02/05 | Réviser les mentions des trois modes dans leur contexte, sans élargir le périmètre aux écrans de relevé |
| Chapitre 06 | Textes de création, exécution, volumes ; cinq captures de création actualisées ; exécution/relevés sans nouvelle capture dans ce lot |
| Registre 07 | Consigner EC-01…10 avec numéros globaux disponibles lors de l’intégration ; superséder les décisions contraires |
| Conception 08 | Matrice mode × cible, validation, total non éditable et qualification du relevé |
| Données 09 | Type de cible, relevé qualifié, dernière tentative, snapshots et migration ; réviser DM-002/DM-015 et restrictions lowerBound |
| Règles 10 | RM-033, RM-058, RM-059, RM-069, RM-077, RM-111, RM-126, RM-127, RM-129, RM-132, RM-232 ; rechercher les autres conditions basées sur le troisième mode |
| API 11 | Transport et validation des cibles, résultat de calcul et relevé qualifié ; confirmation/correction indépendantes de la progression |
| Architecture 12 | Développement du plan, chronologie des bips, persistance/reprise des tentatives, idempotence et versions de données |
| Contrats 13 | CE-T03-04, CE-UI-10, CE-CIR-03 et contrats d’exécution/synthèse concernés ; maintenir toutes les rubriques et distinguer exigences des captures disponibles |
| Paramètres v13 | Deux modes, cible par série, transitions de mode/régime, validation et lecture seule du total |
| Bip v2 | Deux modes, absence de nominal à l’échec, contribution partielle et proposition de répétitions ; supprimer l’interdiction absolue du compteur au profit de sa qualification |
| Phrase v1 / corpus v15 | Nouveaux gabarits et cas mixtes, ≥, nouvelle condition de déclenchement ; conserver les cas anciens non affectés |
| Circuits du 12/10 | Admettre les cibles mixtes dans le plan et les volumes, sans modifier les séquences bilatérales ou les pauses |
| DSF documentaire / matrices / index | Décrire les changements fonctionnels attendus et la dette d’alignement visuel ; captures de création alignées ; relevés hors de ce lot |

La propagation doit remplacer les prescriptions contradictoires à leur emplacement, pas seulement ajouter une note finale. Ne pas remplacer globalement le texte « À l’échec » : le libellé reste valide comme cible, mais cesse de l’être comme troisième mode.

## 9. Recettes déterministes à intégrer

| ID | Situation | Attendu |
|---|---|---|
| R01 | Durée : 30 s, 45 s, échec ; pause 10 s après chaque série, unilatéral direct | ≥ 1 min 45 s ; total non éditable |
| R02 | Répétitions : 10, 12, échec ; bip 2 s ; mêmes pauses | ≥ 1 min 14 s prévisionnel partiel, incluant du travail estimé |
| R03 | Même exercice avec bip 0 | Aucun total d’Exercice |
| R04 | Trois cibles à l’échec, pauses positives, dans chaque mode et avec/sans bip | Aucun total d’Exercice ; pauses conservées dans le plan et l’agrégat |
| R05 | Durée à l’échec avec bip | Pas de fin automatique ni de nominal estimé ; Suivant termine |
| R06 | 12 bips proposés, utilisateur poursuit | 12 conservé comme estimation, enchaînement non bloqué |
| R07 | 12 proposés, confirmation | 12 déclaré |
| R08 | 12 proposés, correction à 10 | 10 déclaré ; origine et proposition distinguables |
| R09 | Répétitions à l’échec sans bip, pas de saisie | Relevé absent, pas zéro ; suite autorisée |
| R10 | Temps 20 s, reset, 35 s, Suivant | Temps cumulé 55 s ; relevé 35 s |
| R11 | Pause/Reprendre et sons désactivés | Pas de répétitions issues des pauses ; proposition fondée sur intervalles logiques, indépendante du son |
| R12 | Bilatéral et circuit à plusieurs passages | Relevés distincts par côté et occurrence ; séquences de pauses inchangées |
| R13 | Reprise ou double événement de fin | Pas de double comptage ni double relevé ; qualification préservée |
| R14 | Cible vide/invalide | Validation bloquée selon règle existante, pas conversion en échec |
| R15 | Ancien mode À l’échec | Lecture/migration vers Répétitions + cibles échec ; historique sans valeur inventée |
| R16 | Phrase à 2/3/>3 cibles mixtes | Énumération puis compaction actée, segments/gras corrects ; calcul indépendant du corpus |

Ces recettes sont des obligations de la future réalisation, pas des tests exécutés sur l’application.

## 10. Plan d’intégration et limites

1. Reprendre les versions courantes du dépôt et les branches documentaires dépendantes ; inventorier les mentions du troisième mode et les champs réels du moteur.
2. Intégrer la spécification et le registre de décisions ; aligner règles de paramètres, calcul, progression, sécurité et relevés.
3. Propager modèle de données, contrats/API, migration et exigences de reprise, en distinguant conception cible et capacités implémentées.
4. Étendre le corpus de phrases, les exemples normatifs et les recettes ; mettre à jour contrats, index et matrices de traçabilité.
5. Faire une revue ciblée des contradictions et de la couverture EC/R ; publier le lot documentaire, sans prétendre que Figma ou l’application ont changé.

Les arbitrages posés dans cette conversation sont clos. La définition des écrans de saisie/correction et de restitution, la charge et la sélection d’un indicateur étalon restent des chantiers explicitement séparés. Les dispositions de cette version définissent les données et comportements de base ; elles ne constituent pas un contrat d’écran de relevé prêt à développer. Le corpus exhaustif étendu et la migration physique sont des livrables de l’intégration/implémentation, pas réputés produits ici.

## 11. Sélecteur — §4.5 reçu dans le prompt complété

La version complétée du prompt reproduit intégralement le §4.5 dans son §4.2. La réserve de source R01 est close.

À tout instant, exactement une cible est sélectionnée. À l’ouverture : cible numérique → roulette active sur la valeur courante et libellé échec à45% ; cible échec → libellé actif et bloc numérique grisé à45%, affiché à00:00. Faire tourner la roulette sélectionne la valeur numérique et grise le libellé. Toucher le libellé sélectionne l’échec et ramène la roulette grisée à00:00. Le grisé exprime la non-sélection, pas une interdiction de manipuler la roulette. Aucun geste supplémentaire de déverrouillage, aucune coche. Validation par le bouton de la feuille ; annulation selon le brouillon existant.00:00 n’est jamais une cible valide ; pause0 reste valide.

**Bornes confirmées le13/10 :** cible Durée de00:05 à58:55 (5–3535s), sélecteur par pas de5s. Hermann corrige explicitement la borne maximale :58min55s ;5999s était une coquille. Répétitions : entiers1–100.00:00 reste réservé à la représentation neutre de l’échec, jamais une cible. Les valeurs historiques ne sont pas arrondies silencieusement à la lecture ; les contrôles de pauses et de Durée totale conservent leurs règles propres.

Composition : libellé dépendant du mode, filet, roulette dans la même feuille ; aucune nouvelle frame uniforme. Les cinq captures du parcours et la variante DSF restent les preuves de layout du lot précédent ; cette réception précise leurs interactions sans annoncer de changement Figma. Voir le DSF et la matrice de traçabilité.

Recette complémentaire : ouvrir30s → roulette30s/libellé grisé ; toucher échec → libellé actif/bloc00:00 grisé ; faire tourner vers30s → cible30s/libellé grisé ; rouvrir chaque état ; annuler restaure, valider applique. Refuser00:00 sans le convertir en échec. Vérifier le traitement45% du bloc et les annonces de sélection. Ces scénarios sont prescrits, pas déclarés exécutés.
