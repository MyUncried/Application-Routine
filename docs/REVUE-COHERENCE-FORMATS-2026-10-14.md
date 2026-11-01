# Analyse de cohérence transverse — Formats — 14 octobre 2026

## Conclusion

Les 42 exigences et les 13 décisions consolidées sont propagées dans le corpus cible ; les 12 lots INT ont une destination modifiée. Les six contrats CE-FMT possèdent leurs 21 rubriques ; les deux familles d’exécution/arrêt restent explicitement partielles sur la preuve de layout. Les décisions prises sont conservées. La cohérence documentaire des règles décidées ne vaut pas qualification de toutes les combinaisons du futur moteur.

## Périmètre relu et méthode

Relecture croisée des chapitres 00–13 de la baseline main `55aa34480d51472b540156e2e664b8528c511f6b`, spécifications Circuits/Bip/Deux modes/Paramètres/Phrase, DSF associés, V2 d’entrée et décisions consolidées. Recherche ciblée des prescriptions contraires, lecture de leur portée et correction à l’emplacement concerné. Relevé des textes/layouts Figma et export des 46 états du parcours ; pas de recette interactive ni audit exhaustif du code. Les contrôles structurels et liens ajoutés sont consignés dans le rapport JSON ; les scénarios REC restent prescrits.

## Contradictions corrigées dans le corpus actif

| Sujet | Risque antérieur | Correction / destination |
|---|---|---|
| Format et origine | Douze modèles assimilés à douze comportements | Séparation, chapitres 00/04/09 ; anciennes séances restent libres |
| Réglages après composition | V2 présentait des réglages figés | Réglages autorisés éditables, synthèse/calculs actualisés, chapitres 03/08/11 et CE-FMT-02/03 |
| Plan d’exécution | Liste finie et entièrement développée exigée partout | Prescription figée, développement progressif pour formats ouverts ; 00/09/12 |
| Pause après série | 09 limitait SERIES_PAUSE à l’entre-deux | Pause après chaque série, dernière comprise ; seule substitution terminale prévue, sans règle de pause nouvelle |
| Calcul/progression universels | Calcul du plan complet et pondération générique appliqués aux fenêtres | Portée des RM-071/072/075/077/125/126 et contrat d’exécution restreinte ; calcul EMOM séparé |
| Commandes d’exécution | Suivant/fin de cible/arrêt depuis Pause imposés sans réserve | Complément CE-FMT-05/06 et portée du contrat générique ; raccordement R-01 conservé |
| Tour/série | Volume For time réinterprété comme séries locales | Échelle For time par passage du Circuit, sans Séries locales ; Progression par série ; 04/08/09/11, CE-CIR-03, corpus |
| Death by | Limite atteinte assimilée à Terminée ; rang déclaré | Horloge, acquisition explicite, résultat partiel et état incomplet ; 00/08/09/10/11/13 |
| Valeur grisée | Valeur imposée assimilée à sans effet/tiret | Valeur réelle effective et raison ; DSF et CE-UI-10/CE-FMT-04 |
| Fenêtre et bip | Même mot cadence risquant de partager la règle | Fenêtre fixe distincte du bip d’exercice ; spécification Bip et chapitres 00/08/12 |
| Carte modèle et carte séance | Images des modèles assimilées à médias des séances | Familles distinguées dans DSF ; règle de carte catalogue conservée |

## Non-régressions vérifiées par lecture

Les phases propres Compte à rebours/Fin d’exercice restent exclues des séances sans booléen. Le repos EMOM n’est pas ajouté à sa fenêtre. Les règles existantes de récupération terminale ne sont pas remplacées par un cas spécial Tabata. Les deux organisations Tabata conservent 16 efforts pour deux exercices. L’échelle For time suit les passages du Circuit. En alternance : A21 B21 A15 B15 A9 B9 ; par exercice : A21 A15 A9 B21 B15 B9. Les historiques restent fondés sur l’instantané. Les phrases sont segmentées et régénérées ; le corpus rédactionnel ne calcule aucune durée. L’échec reste une cible par série ; les rapports comparatifs ne sont pas conçus dans ce lot. Le moteur n’étant pas développé, ces éléments sont des prescriptions, pas une non-régression applicative mesurée.

## Écarts Figma encore observés

| Repère | Nœuds | Écart de sens / présentation | Traitement documentaire |
|---|---|---|---|
| F-01 | 8624:29980, 8624:30306, 8624:30749, 8598:30059 | Ancienne représentation Tabata en tours/récupérations ; récapitulatif partiellement corrigé | Captures explicitement annotées ; prescription série/pause normative. Les copies Par exercice ne prouvent pas l’alignement de l’ancienne alternance |
| F-02 | 8598:31560 | Phrase For time « 21, 15 puis 9 … à chaque tour » | Corpus et contrat portent la phrase par tour validée ; capture identifiée en écart |
| F-03 | 8656:34070 | Modale Intervalles avec 20 s au lieu de la constante 30 s | Constante 30/30 documentée ; capture identifiée en écart |
| F-04 | 8624:30198 | Description du résultat Death by limitée au dernier tour bouclé | Résultat tours acquis + répétitions partielles documenté ; description à compléter |

Ce sont des écarts d’unité, de constante ou de texte, pas une recherche d’exactitude des sommes illustratives. Les textes de récupération présents mais masqués dans les calques du nouveau Tabata par exercice ne sont pas considérés comme visibles. Figma n’a pas été modifié par ce lot.

## Sujets de vérification ciblée — aucun blocage global établi

| Repère | Sujet | Vérification à rattacher au comportement concerné |
|---|---|---|
| R-01 | Fenêtres et commandes générales | Articuler Pause/Reprendre, reset, points d’arrêt, reprise système et gardes avec les échéances continues, sans déduire cette politique du simple appui de fin de travail |
| R-02 | Fenêtres et côtés | Rattacher les deux côtés et leurs pauses à la fenêtre sans multiplicateur caché dans N×E×W |
| R-03 | Death by à plusieurs exercices | Raccorder rang global, exercice de la fenêtre, incrément et acquisition ; ne pas extrapoler l’exemple à un exercice |
| R-04 | Reconfiguration des comptes | Détailler l’édition du Volume par tour et sa longueur ; confirmer représentation EMOM par exercice sans double compte |
| R-05 | Layout exécution/arrêt/résultat | Illustrer CE-FMT-05/06 et le résultat incomplet ; aucun écran des 46 captures de composition ne prouve ces layouts |

Les R-01…04 reprennent les réserves déjà explicites de la spécification §14.2 ; R-05 constate la couverture visuelle. Il ne s’agit pas de remettre en question les choix validés. Les cas concernés doivent être bornés/complétés dans la préparation VNext ; aucune règle arbitraire n’est utilisée pour les fermer.

## Limites et publication

Aucun test de moteur, audit du schéma physique, migration ou revue indépendante VNext n’a été réalisé. Les statuts fonctionnels doivent être raccordés au stockage sans confondre motif/résultat/achèvement. Les erreurs ou limites préexistantes hors concept ne sont pas déclarées corrigées. Le lot est destiné à une branche documentaire ; aucune fusion main ni mise à jour du dev local dans cette demande.

Vérification avant publication : `main` a avancé vers `d08ba87fa4d881303c6c66b82ab1376fd0be3a70` (rapport de nettoyage des branches uniquement). Aucun document source modifié ; le lot est construit sur cette nouvelle tête pour préserver ce rapport.

## Clarification d’autorité et de portée — 14/10/2026

Les spécifications définissent les règles métier, les calculs et les comportements. Figma illustre les scénarios de présentation des écrans et contrôles. Un scénario absent de Figma ne constitue pas une lacune fonctionnelle lorsque son comportement est spécifié. Les shells, composants, DSF et contrats existants permettent de décliner des états sans dessiner chaque combinaison.

R-01 à R-05 sont des sujets de vérification ciblée, pas cinq blocages démontrés ni un préalable global au développement. R-01 concerne les commandes du moteur à fenêtres ; R-02 son exécution bilatérale ; R-03 l’enchaînement Death by multi-exercices. Leurs réponses doivent être recherchées dans les spécifications avant toute question. R-04 concerne uniquement la synchronisation des champs de l’éditeur For time s’ils sont modifiables séparément ; le contrôle du double comptage EMOM relève de l’implémentation et de ses tests. R-05 ne bloque rien du seul fait de captures absentes : une clarification de présentation n’est nécessaire que si l’implantation d’un élément nouveau ne peut pas être déterminée depuis les contrats et le DSF.

Aucun de ces constats ne suspend globalement la création/composition. Seule une règle effectivement absente ou contradictoire doit être clarifiée avant l’implémentation du comportement concerné. Les mentions de preuve visuelle partielle décrivent la couverture des illustrations, pas une obligation de produire une nouvelle maquette.
