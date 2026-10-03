> Relevé du02/10, complété et remplacé pour les références Figma par [l’état des lieux du03/10](ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03.md). Les39copies sont une preuve historique, pas l’inventaire actuel. La réserve reset/saut a été retirée : D-029/D-150 s’appliquent aux deux ordres.

# Rapport — mise à jour Séries variables et Ordre des côtés — 02/10/2026

## Base vérifiée et portée

Base GitHub main : `8fc58a466679a85ea74752f0273939f901efa1b8`, arbre `406ab64f2e54c066f74563eec7675bfc8c0b02c3`, vérifiée à nouveau avant préparation de la publication. Dernière décision antérieure D-246. Pas de reprise d’une ancienne branche documentaire. Livrable exclusivement documentaire, sans code ni tests applicatifs modifiés, sans modification Figma ; PRE-1 et ses preuves restent fermés. La planification PRE-2 vient après intégration formelle.

Cible : [v12](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md), [DSF](DSF-SERIES-VARIABLES-2026-10-02.md), [matrice](MATRICE-SERIES-VARIABLES-2026-10-02.md). Les calculs/comportements viennent des spécifications et arbitrages ; seules la géométrie et la présentation sont reprises de Figma.

## Décisions ajoutées

| ID | Objet |
|---|---|
| D-247 | Modèle variable explicite et deux ordres des côtés |
| D-248 | Pause terminale, formules intrinsèques et substitution par R>0 |
| D-249 | Brouillon, restauration et déplacement cible/Pause |
| D-250 | N=1 effectif uniforme/par côté, restauration temporaire et interrupteur grisé |
| D-251 | Feuille, tableau, repli, invalidité et total readonly |
| D-252 | Granularités durée/répétitions/pauses |
| D-253 | Vocabulaire unique, résumés et affichage Série/côté |
| D-254 | Application aux exercices existants, changement de durée assumé |
| D-255 | Autorité des spécifications / portée de Figma / PRE-1 |

D-040/041/144/156/208/232/242/246 ont une mention explicite de remplacement sur les points concernés. Les deux sources utilisateur sont conservées intactes ; la consolidation explique leurs amendements. La contradiction historique entre documentation C−1 et tests/code signalée dans le prompt est reconnue, sans prétendre avoir réaudité le moteur.

## Vérifications réalisées

- Relecture ciblée de la propagation dans les chapitres00–13, PRODUCT, INDEX, DSF et matrices demandées ; recherche des anciennes formules, du repli de PC vers Pause et de l’ancienne grille des pauses.
- Structure des30contrats contrôlée :21rubriques numérotées et renseignées chacun, soit630rubriques. CE-UI-10 réécrit ; contrats des éditeurs, résumés, Profil et exécution complétés. Les autres contrats héritent des règles transverses sans changement de shell.
- 39exports Figma décodés, ouverts et recoupés avec l’inventaire :38états d’écran et1essai de composants. Tous illustrés dans le chapitre06, avec ID source et empreinte dans la matrice. Les anciennes12captures de la feuille ne restent pas les références courantes de ce parcours.
- Formules vérifiées sur les scénarios A195s, B285s, C405s, D375s, E≥195s et le cas12séries510s. F : aucun total. Les calculs sont vérifiés indépendamment des chiffres Figma.
- Liens locaux des fichiers modifiés contrôlés contre l’arbre GitHub et les nouveaux fichiers ; structure des nouvelles lignes de tableaux vérifiée.

Ces vérifications ne sont ni une recette applicative ni une preuve de câblage interactif Figma. Aucun résultat PRE-1 n’est réécrit.

## Questions du prompt et limites restantes

Les questions produit de la section5 ont été arbitrées : déplacement/restauration, pas, compatibilité et libellé Profil. N=1 a aussi été clarifié explicitement. Le départ G→D est spécifié symétriquement ; aucune copie dédiée n’a été trouvée dans le lot, donc sa recette visuelle reste à fournir. La vérification des chiffres n’en fait jamais une source métier.

**Correction du03/10 :** Réinitialiser conserve D-029/D-150 : recommencer le côté courant depuis sa première Série, préserver les résultats de l’autre côté et le temps total écoulé. Cette portée s’applique aussi à Les deux côtés à chaque série ; un passage déjà acquis de l’autre côté n’est pas rejoué. Exemple : gauche2/3 → reprise gauche1/3, résultats droits conservés. Pendant une récupération, RM-062 réinitialise seulement cette phase. Le passage anticipé conserve D-150 : côté courant partiel, poursuite des passages restant à exécuter de l’autre côté ; les résultats acquis ne sont pas effacés. Ces conséquences du périmètre existant ne constituent pas un nouvel arbitrage.

| Écart de preuve Figma | Traitement documentaire |
|---|---|
| Douze séries :5min20 affichées pour des cibles totalisant390s +120s de Pause | Recette normative8min30 ; PNG conservé sans retouche |
| État vide6603:10304 :✓ bleu | Contrat exige✓ grisé si invalide |
| État invalide6623:17404 : résumé parent derrière voile déjà chiffré | Parent = état avant validation ; total du brouillon— ; ne pas calculer depuis l’arrière-plan |
| Exécution directe : mentions Tour et Série0/3 dans des copies | ACTIVITY sans Tour ; compteur réel commence à1 ; valeurs de démonstration non normatives |
| Composition6637:13132 : anciens mots Parcours et récupération encore visible | Circuit/Tour normatifs et retrait d’affichage D-238 conservés |
| Noms de frames : Par série, Activité, ancien libellé Pause | Identifiants/noms source préservés dans l’inventaire ; vocabulaire cible du prompt appliqué au texte normatif |
| Copies et frame de test de composants | Ne prouvent ni promotion DSF, ni remplacement des originaux dans le fichier, ni recette interactive |
| Anciens écarts médias/Profil/Composition du chapitre13§5 | Restent explicitement tracés ; aucune refonte ni correction Figma autorisée par ce livrable |

## Fichiers modifiés, remplacés, archivés ou inchangés

Les lignes suivantes décrivent chaque fichier Markdown touché ou explicitement demandé. Les39PNG sont détaillés individuellement dans la matrice avec empreinte.

| Fichier | Statut | Raison |
|---|---|---|
| [ARBITRAGES-CONTRATS-2026-09-30.md](ARBITRAGES-CONTRATS-2026-09-30.md) | Remplacé | Ancienne cible archivée ; renvoi explicite à v12 et matrice courante |
| [DSF-CARTES-ICONES-APPUIS-2026-09-30.md](DSF-CARTES-ICONES-APPUIS-2026-09-30.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [DSF-PARAMETRES-MODALE-2026-10-01.md](DSF-PARAMETRES-MODALE-2026-10-01.md) | Remplacé | Ancienne cible archivée ; renvoi explicite à v12 et matrice courante |
| [DSF-SERIES-VARIABLES-2026-10-02.md](DSF-SERIES-VARIABLES-2026-10-02.md) | Créé | Consolidation normative, preuve ou traçabilité du02/10 |
| [DSF-V2-MOTIFS-LOT-3.md](DSF-V2-MOTIFS-LOT-3.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [INDEX.md](INDEX.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [MATRICE-COUVERTURE-FIGMA-CHAPITRE-06.md](MATRICE-COUVERTURE-FIGMA-CHAPITRE-06.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [MATRICE-ECRANS-CARTES-2026-09-30.md](MATRICE-ECRANS-CARTES-2026-09-30.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [MATRICE-SERIES-VARIABLES-2026-10-02.md](MATRICE-SERIES-VARIABLES-2026-10-02.md) | Créé | Consolidation normative, preuve ou traçabilité du02/10 |
| [MATRICE-TRACABILITE-BILATERALITE.md](MATRICE-TRACABILITE-BILATERALITE.md) | Remplacé | Ancienne cible archivée ; renvoi explicite à v12 et matrice courante |
| [MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md](MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md) | Remplacé | Ancienne cible archivée ; renvoi explicite à v12 et matrice courante |
| [MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md](MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md) | Remplacé | Ancienne cible archivée ; renvoi explicite à v12 et matrice courante |
| [PRODUCT.md](PRODUCT.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [RAPPORT-CONFORMITE-BILATERALITE.md](RAPPORT-CONFORMITE-BILATERALITE.md) | Remplacé | Ancienne cible archivée ; renvoi explicite à v12 et matrice courante |
| [RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md](RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md) | Remplacé | Ancienne cible archivée ; renvoi explicite à v12 et matrice courante |
| [RAPPORT-MISE-A-JOUR-SERIES-VARIABLES-2026-10-02.md](RAPPORT-MISE-A-JOUR-SERIES-VARIABLES-2026-10-02.md) | Créé | Consolidation normative, preuve ou traçabilité du02/10 |
| [SOURCE-SAISIE-PARAMETRES-MODALE-2026-10-01.md](SOURCE-SAISIE-PARAMETRES-MODALE-2026-10-01.md) | Inchangé | Source utilisateur / archive historique à préserver |
| [SOURCE-SERIES-VARIABLES-2026-10-02.md](SOURCE-SERIES-VARIABLES-2026-10-02.md) | Créé | Consolidation normative, preuve ou traçabilité du02/10 |
| [Specifications-fonctionnelles/00 – Glossaire.md](Specifications-fonctionnelles/00%20%E2%80%93%20Glossaire.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/01 – Vision Générale.md](Specifications-fonctionnelles/01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/02 – Utilisateurs et besoins.md](Specifications-fonctionnelles/02%20%E2%80%93%20Utilisateurs%20et%20besoins.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/03 – Parcours utilisateur.md](Specifications-fonctionnelles/03%20%E2%80%93%20Parcours%20utilisateur.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/04 – Modèle fonctionnel.md](Specifications-fonctionnelles/04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/05 – Versions du produit.md](Specifications-fonctionnelles/05%20%E2%80%93%20Versions%20du%20produit.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md](Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/07 – Registre des décisions de conception.md](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md](Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/11 – API fonctionnelles.md](Specifications-fonctionnelles/11%20%E2%80%93%20API%20fonctionnelles.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/12 – Architecture technique.md](Specifications-fonctionnelles/12%20%E2%80%93%20Architecture%20technique.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/13 – Contrats d’écran.md](Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md) | Modifié | Règles, contrats, vocabulaire, références et/ou captures alignés avec v12 |
| [Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v11.md](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v11.md) | Remplacé | Ancienne cible archivée ; renvoi explicite à v12 et matrice courante |
| [Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md) | Créé | Consolidation normative, preuve ou traçabilité du02/10 |
| [Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2.md](Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2.md) | Inchangé | Source utilisateur / archive historique à préserver |
| [archives/series-variables-2026-10-02/ARBITRAGES-CONTRATS-2026-09-30.md](archives/series-variables-2026-10-02/ARBITRAGES-CONTRATS-2026-09-30.md) | Archivé | Référence historique ; liens figés vers le commit d’origine |
| [archives/series-variables-2026-10-02/DSF-PARAMETRES-MODALE-2026-10-01.md](archives/series-variables-2026-10-02/DSF-PARAMETRES-MODALE-2026-10-01.md) | Archivé | Référence historique ; liens figés vers le commit d’origine |
| [archives/series-variables-2026-10-02/MATRICE-TRACABILITE-BILATERALITE.md](archives/series-variables-2026-10-02/MATRICE-TRACABILITE-BILATERALITE.md) | Archivé | Référence historique ; liens figés vers le commit d’origine |
| [archives/series-variables-2026-10-02/MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md](archives/series-variables-2026-10-02/MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md) | Archivé | Référence historique ; liens figés vers le commit d’origine |
| [archives/series-variables-2026-10-02/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md](archives/series-variables-2026-10-02/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md) | Archivé | Référence historique ; liens figés vers le commit d’origine |
| [archives/series-variables-2026-10-02/RAPPORT-CONFORMITE-BILATERALITE.md](archives/series-variables-2026-10-02/RAPPORT-CONFORMITE-BILATERALITE.md) | Archivé | Référence historique ; liens figés vers le commit d’origine |
| [archives/series-variables-2026-10-02/RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md](archives/series-variables-2026-10-02/RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md) | Archivé | Référence historique ; liens figés vers le commit d’origine |
| [archives/series-variables-2026-10-02/SPECIFICATION-PARAMETRES-MODALE-v11.md](archives/series-variables-2026-10-02/SPECIFICATION-PARAMETRES-MODALE-v11.md) | Archivé | Référence historique ; liens figés vers le commit d’origine |
| [archives/series-variables-2026-10-02/conception-source.md](archives/series-variables-2026-10-02/conception-source.md) | Archivé | Source utilisateur intacte |
| [archives/series-variables-2026-10-02/prompt-source.md](archives/series-variables-2026-10-02/prompt-source.md) | Archivé | Source utilisateur intacte |

Tous les autres fichiers du dépôt restent inchangés, notamment code, tests, preuves et documents de clôture PRE-1. Les39captures sont ajoutées sous Specifications-fonctionnelles/images ; les anciennes images restent conservées pour l’historique, mais ne définissent plus la feuille courante.
