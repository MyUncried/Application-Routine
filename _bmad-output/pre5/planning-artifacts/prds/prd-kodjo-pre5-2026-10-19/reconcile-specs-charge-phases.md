# Réconciliation du PRD PRE-5 avec la spécification de la charge v3, la spécification des phases et la matrice

Date : 2026-10-19. Lecture seule des sources, sauf la création du présent fichier.

**Documents comparés**

- PRD : `prd.md` et `addendum.md` (ce dossier).
- **[CHG]** : `openspec/changes/archive/2026-10-18-integration-parametres-execution-v3/source/KODJO_Charge_Specification_2026-10-18.md`. Règles CH, CO, CA, DU, CV, AR, GR, RO et PR ; §6, §9.2, §11.2, §11.3 et §12.
- **[PH]** : `_bmad-output/pre5/sources-2026-10-19/KODJO-Phases-specification-consolidee-2026-10-15.md`, §1 à 5 et recette §8.
- **[MAT]** : `_bmad-output/pre5/sources-2026-10-19/Matrice des règles de compatibilité des paramètres d'exécution.md`. C'est une analyse : elle ne prime pas sur les décisions.

**Préséances appliquées.** Les points suivants ne sont pas signalés comme écarts :

- l'exécution est exclue : cadran, audio, moteur, CH-09, [PH] §4 sauf §4.1 ;
- les formats et la durée imposée sont exclus ([PH] §3) ;
- QP5-03 : pas d'option À l'échec pour une phase ; cette décision prime sur RO-01, dernière phrase, et sur la scène 9232:44646 ;
- QP5-07 : libellés de l'Enchainement ; cette décision prime sur PR-05 ;
- Δ50 : minimum et pas de 1 s, maxima conservés, somme des phases comprise entre 1 et 3 535 s ; cette décision prime sur [PH] §2.1 « bornes distinctes » et sur §9, point 5 ;
- la Pause après chaque série reste applicable à N = 1 ([MAT] ne prime pas).

## 1. Écarts principaux (correction proposée)

| # | FR | Source | Constat | Correction proposée |
|---|---|---|---|---|
| E1 | FR-31 | DU-01 §2 et §3 ; AC-16, AC-17 | Trois règles de DU-01 sont omises. (a) Dans un Exercice ouvert depuis une Séance, Compte à rebours et Fin restent absents, selon la substitution existante. Le chevron ne les réintroduit pas et ne crée aucun réglage booléen des signaux. (b) L'ouverture de la section est indépendante de l'édition de la valeur de durée : le chevron et la valeur sont deux cibles distinctes, et la valeur reste éditable par inversion. (c) Replié : chevron vers le bas. Déployé : chevron vers le haut. « Ne pas créer de faux total ni de contrôle de repli alternatif. » La phrase de FR-31 « Si la ligne est absente, ces deux signaux sont directement visibles » doit aussi dire « lorsqu'ils s'appliquent », ce qui exclut le contexte Séance. | Ajouter ces points à FR-31. L'exclusion « aucun nouveau réglage booléen des signaux » du §8 doit renvoyer à DU-01. Ajouter un critère de recette pour AC-17. |
| E2 | FR-22 (et FR-20) | RO-01 §2 à §4 ; AC-25, AC-26 | Plusieurs garanties de RO-01 manquent. (a) « À l'échec » n'est pas une durée nulle, et zéro n'est jamais un code d'échec. (b) Le choix dans une cellule ne modifie ni la pause ni les autres paramètres de la série. (c) Le retour d'À l'échec vers une durée suit les conventions existantes de conservation et de saisie, sans borne ni durée par défaut nouvelle. (d) Le tableau affiche « à l'échec » selon son format validé. Côté AR-01 : quand le détail redevient homogène, les deux options réapparaissent avec la bonne sélection (AC-21). Le rendu automatique ne signifie pas que la condition est sans effet. Aucune validation supplémentaire n'est ajoutée. | Compléter FR-22 avec (a) à (d) et FR-20 avec le retour aux deux options et l'interdiction d'ajouter une validation. Ajouter au §8 : « pas de valeur Mixte, pas de troisième bouton », déjà partiellement dans FR-20. |
| E3 | FR-14, FR-11, FR-13 | CH-04 §2-3, CH-05 §1-4, §11.3, §12 | Plusieurs détails de CH-04 et CH-05 sont absents. (a) « Ne pas remplacer les valeurs zéro explicitement saisies par d'anciennes charges positives. » (b) Tant qu'une série garde une charge positive, la charge reste activée globalement. (c) Les scénarios 1,25 → 1,25 et 0 → 0 manquent ; seuls 1,3 et 0,01 sont donnés. (d) Le kg est une information d'affichage, pas une partie du nombre ; la valeur est normalisée avant l'enregistrement. (e) Aucune autorisation particulière de cellule de charge vide n'est créée ; la règle commune des champs de série s'applique (§11.3). (f) La saisie d'une charge dans une série ne se propage pas aux autres cellules ; seule l'initialisation à 0,25 kg est arbitrée. (g) La première activation à 0,25 kg suppose l'absence de valeur mémorisée. FR-14 dit seulement « première activation ». Il ne précise pas le cas d'une donnée PRE-4 qui passe pour la première fois à Avec. | Compléter FR-14 avec (a) à (d) et (g). Compléter FR-11 et FR-13 avec (e) et (f). Pour une cellule de charge vide, renvoyer explicitement à la règle commune des champs de série, ce qu'exige AC-07, et non à « traitée comme les autres valeurs » seulement. |
| E4 | FR-29, FR-27, FR-32 | PR-02, PR-03, PR-04, GR-01 §2-4 | Les principes de présentation de PR-02 à PR-04 sont presque tous absents. Or PR-02 dit qu'ils « priment sur la recopie d'une ancienne capture » : ce ne sont donc pas de simples relevés Figma. **Manquent pour PR-02 :** aucun séparateur résiduel ni aucun séparateur après le tableau des phases ; le fond blanc ne déborde pas du cadre et ne chevauche rien ; un espace d'une hauteur de ligne sous la dernière ligne ; marge supérieure distincte, espace inférieur réduit ; valeurs alignées avec leurs en-têtes ; numéros rapprochés des poignées ; séparateurs internes. **Manquent pour PR-03 et GR-01 :** libellés en regular, plus petits que les valeurs ; options non sélectionnées en gris regular, sur le fond des champs variables ; mêmes largeurs pour les options d'un même contrôle ; Cadence en 12 px ; cadres d'un gris plus soutenu ; contenu conditionnel maintenu dans son groupe, sans chevauchement (AC-22). **Manquent pour PR-04 :** marge basse réduite de la Feuille ; roues avec leur voile et leur fenêtre ; aucun voile supplémentaire pour la saisie de la charge (§11.2). | Ajouter à FR-29 une sous-liste « principes PR-02 (priment sur les captures) ». Ajouter à FR-27 les traitements PR-03, dont l'égalité de largeur des options et la Cadence en 12 px. Ajouter à FR-32 la marge basse réduite et l'absence de chevauchement. Ajouter à FR-23 « ni voile supplémentaire ». Ne garder pour S-2 que les valeurs numériques. |
| E5 | FR-42 | CH-08 vs D-414 / D-422 / D-423 | **Incohérence de forme interne au PRD.** L'exemple de FR-42 suit CH-08 : « avec une charge de 20 kg ». Les décisions citées par la même FR (inventaire des sources, D-414) fixent `(charge : 20 kg)` et `(charges : 20, 12, 13 kg)` jusqu'à trois séries. FR-42 ne donne que la forme au-delà de trois séries. Les deux grammaires coexistent sans arbitrage visible. Par ailleurs, la règle « une charge nulle d'une série est affichée » (D-423) est à réconcilier en une phrase avec CH-05 (« zéro = sans charge pour cette série ») et FR-10 (« jamais 0 kg ») : 0 n'apparaît que dans une énumération variable. CH-08 ajoute deux règles absentes : « ne pas présenter une charge unique comme commune si les séries diffèrent » et « la charge ne change pas le statut des durées ni leurs symboles ». | Signaler à Hermann avant de rédiger, conformément à la règle CLAUDE.md sur les différences non résolues : choisir la forme `(charge : X kg)` (D-414) ou « avec une charge de X kg » (CH-08). Donner la forme jusqu'à trois séries. Préciser que le 0 ne s'affiche que dans l'énumération variable. Ajouter les deux règles de CH-08. |
| E6 | FR-3, FR-31 (contradiction à signaler) | CHG §11.2 « Tableau de 3 phases » ; [PH] §9, dernier point ; [MAT] | Dans le scénario validé « Tableau de 3 phases », la Durée de l'exercice est « non modifiable, texte simple sans fond de champ ». Or [PH] §9 et FR-3 disent que l'inversion de la durée totale ajuste N lorsqu'il est libre, et que seule une valeur de N imposée (format) rend le total en lecture seule. Le PRD reprend la règle de [PH] sans relever cette illustration contraire. | Signaler à Hermann au §9 : la Durée de l'exercice reste-t-elle éditable avec des phases (inversion sur N) ? Si oui, la capture est une illustration non normative ; sinon, FR-3 change. Ne pas trancher dans le PRD. |

## 2. Écarts secondaires

| FR | Source | Constat | Proposition |
|---|---|---|---|
| FR-1, FR-3 | [PH] §2.1, §2.4 ; recette §8 | « Les phases ne définissent ni exercice supplémentaire ni pause entre elles ; les phases n'ajoutent aucune pause de côté ni de série. » Le cas de recette « 6 + 3, N = 3, P = 0 → 27 s » manque. Le bilatéral manque aussi : chaque passage d'un côté exécute la séquence complète, et les formules existantes s'appliquent avec D. | Ajouter ces deux phrases à FR-1 et FR-3, avec le cas 27 s. |
| FR-4, FR-9 | [PH] §2.2 | Les libellés personnalisés suivent leur phase lors d'un déplacement. Seuls les libellés vides reçoivent « Phase n » selon la position finale. | Ajouter à FR-4. |
| FR-9 | [PH] §2.2 | Le ✓ de la Feuille applique au brouillon parent ; l'enregistrement définitif suit la frontière existante de l'éditeur (`Terminer`). | Ajouter une phrase. |
| FR-43 | [PH] §4.1 | La Phrase est régénérée après toute modification des paramètres, des libellés ou de leur ordre. Le libellé « pause après chaque série » est conservé. La syntaxe française n'est pas présentée comme un mécanisme multilingue. | Ajouter à FR-43 (les deux premières règles au moins). |
| FR-2 | [MAT] « Phases × Type de série » | La ligne Phases est verrouillée **sans texte d'incompatibilité**. Le PRD n'interdit pas l'ajout d'un message. Cela vaut aussi pour CH-07 : aucun message ni confirmation supplémentaire pour la charge. | Ajouter à FR-2 et FR-11 : « aucun message, aucune confirmation supplémentaire ». |
| FR-28 | CV-01 §2 | « Le chevron ne crée pas une nouvelle étape de configuration. » | Ajouter une phrase. |
| FR-30 | CA-01 §3 ; FR-30 | « Le choix visuel reflète la valeur courante. » Le cas d'une valeur saisie par Autre qui vaut 1, 2 ou 5, ou 0, n'est pas précisé : quelle option est mise en évidence ? La règle « Sans puis Autre ne restaure rien » ne vient pas de CA-01 (elle vient de D-420, à vérifier). CA-01 demande aussi de reprendre l'affichage de la valeur personnalisée « du contrôle existant ou de Figma, sans inventer un nouvel état ». | Préciser la règle de mise en évidence, ou la signaler comme question ; citer D-420 pour le non-mémorisé. |
| FR-15 | CO-01 §3 | « Avec / Sans ne crée à lui seul aucune restriction selon N. » Le PRD le respecte par Δ24 ; une référence explicite à CO-01 éviterait de généraliser la capture « Une seule série », où Avec est désactivé (§11.2). | Ajouter une phrase et citer CO-01 dans Δ24. |
| FR-12 | CH-02, §4 écart 2 | En séries identiques, l'état de saisie n'a pas été dessiné. Il faut réutiliser la saisie directe validée pour les variables et ne pas présenter une modale comme validée. | Ajouter une phrase à FR-12. |
| FR-24 | §4 écart 1 ; AC-11 | Le clavier de référence Figma n'a pas de séparateur décimal. C'est un écart de capture, pas une règle. | Mentionner dans S-2. |

## 3. Inventions ou glissements

| FR | Texte du PRD | Source | Appréciation |
|---|---|---|---|
| FR-14 | « Une valeur négative est refusée » | CH-05 : « appliquer le comportement standard des champs numériques du projet » | Glissement : la source renvoie au comportement standard sans fixer le refus. Reformuler : « suit le comportement standard des champs numériques du projet ». |
| FR-20 | « Le rendu (violet atténué, texte blanc) suit Figma » | AR-01 §4 : ce rendu est « validé » et le groupe est « non sélectionnable » | Conforme, mais la règle « ne signifie pas que la condition est sans effet » est perdue (voir E2). |
| FR-42 | « avec une charge de 20 kg » et « (charges : 20, 12 kg, ...) » | CH-08 et D-414 / D-423 | Deux grammaires mêlées (voir E5). |

Aucune autre invention n'a été relevée par rapport à ces trois sources. Les autres règles du PRD absentes de ces sources (fermeture du clavier sans Retour, Précédent / Suivant, Q47, etc.) viennent d'autres décisions citées ; elles n'ont pas été vérifiées ici.

## 4. Idées qualitatives perdues

- **Principe de détermination unique** ([MAT] : « une grandeur ne peut être déterminée qu'une fois »). Il explique FR-2, FR-3, FR-20 et FR-22. Il pourrait ouvrir §4.1 et §4.4 comme principe directeur, à titre d'analyse et non de règle.
- **Distinction entre côté de départ et enchaînement** (CO-01 §2). Ce sont deux informations distinctes, à garder séparées dans le lexique et la Phrase (FR-16, FR-18, FR-44).
- **Figma n'illustre que des valeurs** (§4, §9.3, §11.2) : les chiffres des captures ne deviennent pas des constantes. Le PRD le dit au §8 ; il faut l'appliquer aussi aux captures contradictoires relevées par [MAT] (Une seule série, Phases verrouillées).
- **Aucune généralisation du clavier** (§9.3, §11.3, dernier point). C'est couvert par §8 et Δ30.

## 5. Couverture, règle par règle

| Règle | FR du PRD | Statut |
|---|---|---|
| CH-01 | FR-10 | Couvert |
| CH-02 | FR-10, FR-12 | Couvert |
| CH-03 | FR-12 | Couvert (écart 2 du §4 manquant) |
| CH-04 | FR-11, FR-13 | Partiel (E3 e, f) |
| CH-05 | FR-14 | Partiel (E3 a à d, g ; glissement sur le négatif) |
| CH-06 | FR-10, FR-42 | Couvert |
| CH-07 | FR-11 | Partiel (aucun message ni confirmation supplémentaire) |
| CH-08 | FR-42 | Partiel (E5) |
| CH-09 | §8 | Exclu (préséance) |
| CO-01 | FR-15, FR-16, FR-18 | Couvert (secondaire sur N) |
| CA-01 | FR-30 | Partiel (mise en évidence, état de la valeur personnalisée) |
| DU-01 | FR-31 | Partiel (E1) |
| CV-01 | FR-28, FR-4 | Couvert (secondaire) |
| AR-01 | FR-19, FR-20 | Partiel (E2) |
| GR-01 | FR-26, FR-29, FR-32 | Partiel (E4) |
| RO-01 | FR-22 | Partiel (E2) ; dernière phrase remplacée par QP5-03 |
| PR-01 | FR-26, §3 | Couvert |
| PR-02 | FR-29 | Partiel (E4) |
| PR-03 | FR-27 | Partiel (E4) |
| PR-04 | FR-23, FR-24, FR-32 | Partiel (E4) |
| PR-05 | FR-17 | Remplacé par QP5-07 |
| AC-01 à AC-12 | FR-10 à FR-14, FR-41, FR-42 | AC-07 partiel (E3 e) ; AC-09 exclu |
| AC-13 à AC-26 | FR-15 à FR-31 | AC-17, AC-21 et AC-26 partiels (E1, E2) |
| §12, scénarios | FR-14 | Partiel (1,25 et 0 manquants) |
| [PH] §2.1 à 2.4 | FR-1 à FR-9 | Couvert, sauf points secondaires |
| [PH] §4.1 | FR-43 | Partiel (régénération) |
| [PH] §5 | FR-1, FR-39, FR-43, Q-A1, Q-A3 | Couvert |
| [PH] recette §8 (hors exécution et formats) | FR-1 à FR-9, FR-41 | Couvert, sauf le cas P = 0 (27 s) |
