# PRE-4 — Finalisation de l’éditeur Exercice et cible À l’échec par série

## Autorité, identité et frontière

Opération unique #352 ; tranche `VNEXT-PRE-4`, pilote ChatGPT, protocole VNEXT activé. Hermann autorise « Lance Vnext sur ce périmètre » le13/10/2026 à01:57:55Paris, puis confirme le démarrage à02:33:36. Cette autorisation concerne préparation et planification ; aucun plan technique inconnu n’est approuvé et aucun développement n’est autorisé avant la porte propriétaire prévue. PRE-3/#340 est clôturé, #351 fusionnée au commitdfc83e6c ; registre finalf762a0df. Baseline applicative/documentaire/protocole observée :96a191a975a5de03ed3194568cb991196908fc67. Les modifications de filtre CI à cette baseline ne changent pas les gates VNext.

Le repère PRE-4 désigne la première tranche suivante demandée, consacrée à l’éditeur. Les travaux Composition auparavant envisagés sous PRE-4 restent une tranche suivante distincte : pas de réduction ni d’abandon, aucun objet actif Composition identifié ou renommé. La variante Claude #344 et la certification historique restent séparées.

## Sources opposables

Spécifications fonctionnelles prioritaires : Deux modes/Échec par série du13/10 (§§2/4/6/7/9/11), Paramètres v13, Phrase v1 et corpusv15 historique, Bip v2 dans sa portée de paramétrage/calcul, chapitres04/07–13, CE-T03-04 et CE-UI-10. DSF Interface générale du08/10, Circuits/contrôles du12/10 pour les contrôles de l’éditeur seulement, Deux modes du13/10. Les32références PNG de `references-figma.json` concernent l’éditeur, ses paramètres et référentiels, pas Composition/Volumes/Catalogue. Les champs visuels doivent être extraits et rapprochés individuellement ; présence du nom d’un contrôle ou d’une capture ne prouve pas sa réalisation.

Les consignes jointes du13/10 restent une source historique confrontée à ces normes : la borne Durée est58min55s, pas59:55 ; le bloc grisé reste manipulable, pas désactivé. Pas de zéro implicite pour À l’échec. Pas de nouvelle frame « Série à l’échec » uniforme. La phrase Figma énumérant des pauses variables est contradictoire : appliquer Phrase v1, pas l’image. Les relevés/moteur décrits dans la spécification définissent une interface future, pas une implémentation incluse par ce périmètre.

## Couverture à conserver (identifiants locaux de cadrage)

| ID | Prescription | Attendu de recette à écrire avant développement |
|---|---|---|
| ED-01 | Quatre parcours créer/modifier Catalogue et copie Séance | Même éditeur, sauvegarde/réouverture et retour correct ; copie isolée |
| ED-02 | Composition entière de l’écran principal selon références courantes | En-tête/fermeture, nom, Catégorie/Zones, carte Paramètres, description, médias, Terminer : position, marges, typographie, couleur, contour/ombre et états définis |
| ED-03 | Organisation des boutons et champs ; popovers de Mode/Côté/Ordre/Régime | Ancrage, voile, fermeture, focus et une seule surface interactive ; maintien des décisions de recette non supersédées |
| ED-04 | Suppression de l’interrupteur Séries variables | Choix identiques/variables par popover ; chevron indépendant seulement en variable ; aucune déduction depuis l’égalité des valeurs |
| ED-05 | Deux modes seulement | Durée/Répétitions dans tous les sélecteurs, validations et consommateurs ; Échec reste une cible |
| ED-06 | Cible typée par série | Numérique ou Échec distincts d’une saisie vide/invalide ; identiques commun, variable mixte ordonné |
| ED-07 | Sélecteur de cible courant | Ouverture sur la valeur ; libellé dépend du mode ; échec en tête ; exactement une sélection, pas de coche ; ✓ applique au brouillon |
| ED-08 | Transitions et grisé | Nombre actif/échec45% ; échec actif/bloc00:00à45% ; manipuler la roulette revient au numérique sans déverrouillage ; annuler restaure |
| ED-09 | Bornes indépendantes des pauses/totaux | Durée5–3535s par pas5, Répétitions1–100 ;00:00refusé comme cible, pause0valide ; anciennes valeurs lues sans arrondi silencieux |
| ED-10 | Tableau variable et pied commun | Poignée, numéro, cible et Pause, retrait ; un champ actif ; commandes du pied sur cette cellule seulement ; pas de steppers permanents dans chaque cellule |
| ED-11 | Brouillons et changements de mode | Échec conservé entre modes ; cibles numériques incompatibles mises à renseigner/restaurées sans conversion ; Bip conservé |
| ED-12 | Variations de N et réordonnancement | Réserves temporaires et restauration, copie du type Échec et de la Pause ; N1normalise ; Annuler suppression restaure position/paramètres |
| ED-13 | Calculs exact/estimé/partiel/omis | Durée numérique exacte, Répétitions avec bip estimée ; mixte calculable≥prioritaire sur≈ ; tout Échec ou Répétitions sans bip : total Exercice omis |
| ED-14 | Total et inversion | Dès une cible Échec, aucun inverse ; lecture seule du total affichable ; roulette du total reste numérique et ses règles propres inchangées |
| ED-15 | Agrégation et pauses | Pauses connues conservées malgré omitted ; remplacement terminal par R positive et bilatéralité préservés ; adaptations minimales des consommateurs de Séance, sans refonte Composition |
| ED-16 | Phrases/gras à l’affichage | ≤3cibles mixtes énumérées dans l’ordre ;>3compaction de minimum numérique à Échec ; tout Échec formulation existante ; aucune phrase persistée ni troncature |
| ED-17 | Corpus/oracle | Conserver les276cas historiques non affectés, étendre les variantes mixtes/deux modes ; calcul métier indépendant de la rédaction et des exemples Figma |
| ED-18 | Persistance/migration | Ancien mode Échec→Répétitions+toutes cibles Échec ; tous paramètres conservés ; transaction/rollback et SQLite réelle ; invalide jamais converti en Échec |
| ED-19 | Copies/duplications/instantanés | Catalogue et Séance, cibles typées et médias ordonnés conservés ; historique versionné non réécrit ; anciens résultats sans performance inventée |
| ED-20 | Référentiels et clavier | Catégorie/Zones depuis l’éditeur : règles PRE-3 conservées, sélection/✓/annulation/création/erreurs, clavier continu ; nom vide Ajouter désactivé sans erreur |
| ED-21 | Préservation médias | Import local, ordre, erreurs/réessai, sauvegarde et copies, aucun fichier physique encore référencé supprimé |
| ED-22 | Fidélité et accessibilité | Tous contrôles par état et propriétés observées ; viewport/texte agrandi, labels/focus/lecture seule et alternatives aux gestes ; séparer tests, captures et perception appareil |

Le plan doit relier chaque ligne aux règles, sources Git/Figma, fichiers réels, assertions et preuves. Ces identifiants de cadrage ne sont pas les identifiants atomiques générés par VNext et ne remplacent pas leur granularité.

## Hors périmètre

Refonte Composition, circuits de tours/séries, grille Volumes, placement complet R/Points d’arrêt ; moteur/chronomètre/sons/lecture médias d’exécution ; comptage des relevés, saisie/correction/restauration de performances, Synthèse/Suivi, charge/étalon ; refonte Catalogue/Profil/Calendrier. Des adaptateurs minimaux des consommateurs existants peuvent être nécessaires : ils doivent être justifiés par une exigence éditeur, pas étendre silencieusement la tranche. L’héritage N par circuit doit être compatible avec la tranche Composition suivante, sans l’implémenter ici.

## Suite opérationnelle

Activation par le bootstrap existant VNEXT, acquisition/réconciliation/freeze des sources, exigences atomiques, graphe des lectures/écritures, PlanContract et UIAtomicityContract depuis le code réel, publication, revue indépendante via le relais commun intégré. Puis validation propriétaire du plan exact avant admission/développement. Réutiliser #352 ; pas de V2, pas de commande PowerShell ou JSON à transporter. La référence figée est Git+empreintes : aucun numéro de version Figma inventé. Les32PNG sont réutilisés ; fraîcheur et propriétés sont à vérifier sur les surfaces concernées, pas sur toutes les pages.

Aucune conformité ni couverture applicative nouvelle annoncée. Le plan physique de migration et le corpus étendu ne sont pas réputés livrés par ce cadrage.
