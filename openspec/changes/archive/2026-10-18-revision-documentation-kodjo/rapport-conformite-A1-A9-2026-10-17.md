# Rapport de conformité — arbitrages A1 à A9 (17/10/2026)

- **Départ :** `ca3a009d` (publié, HEAD réel vérifié, aucun écart).
- **Commits :**
  - `57dfd336` : registre et 36 corrections ;
  - commit de ce rapport et du suivi.
- **Branche :** `docs/openspec-revision`, sans merge vers `main`.
- **Statut :** soumis à revue indépendante (GitHub). Rien n'est déclaré clos ni certifié.

## Méthode

1. **Registre.** Numérotation vérifiée avant usage. La PR #370 emploie D-370 à D-375 ; les anciennes PR documentaires ouvertes (#140, #245, #246) n'emploient que des numéros inférieurs ou égaux à D-230. Les neuf décisions prennent **D-388 à D-396**, dans la section « Arbitrages complémentaires de Hermann du 17 octobre 2026 » (ancre `arbitrages-20261017`). Les textes des décisions anciennes ne sont pas réécrits : seuls leurs statuts reçoivent une mention « remplacée » ou « précisée sur ce point ».
2. **Préparation.** Trois dossiers en lecture seule : P1 (A1 à A3), P2 (A4 à A6), P3 (A7 à A9). Chacun recherche les variantes dans tout le corpus et exclut les lignes des PR ouvertes.
3. **Revue de chaque correction** contre le texte de la décision. Fusion des deux mentions visant le statut de D-091 (A3-05 et A51).
4. **Application** par `outils/appliquer-lot5.mjs` (`constats/A1-A9-corrections.json`, 36 corrections, chacune unique au moment de son application).
5. **Seconde passe distincte :**
   - rejeu indépendant (`outils/verifier-corrections-json.mjs`) ;
   - recherche des anciennes prescriptions et de leurs variantes ;
   - liens, chemins Unicode, fins de ligne ;
   - fusions simulées avec les PR.

## Conformité par décision

| Décision | Règle de référence | Fichiers modifiés | Preuves | Conformité | Anomalies résiduelles |
|---|---|---|---|---|---|
| **A1 — D-388** : Composition persistée seulement par `Continuer` | ch. 07 D-388 ; CE-T03-08 §15 ; ch. 08 l. ~581 « Continuer seul enregistre la Séance » | ch. 08 §3.10 (`À CLARIFIER` retiré) | Variantes « enregistrées automatiquement » restantes : Exécution (ch. 03:150), objets hors brouillon (ch. 06:329), Profil (ch. 08:1700). Aucune ne concerne la Composition. | **vérifiée** | — |
| **A2 — D-389** : contrôle obligatoire sans valeur, fond rouge pâle | ch. 07 D-389 ; ch. 10 RM-017 ; ch. 13 (règles communes de la feuille Paramètres, CE-T03-08) | ch. 06, 08 (§3.8, nom de la séance, validation de l’éditeur), 10, 13 ; statuts de D-123, D-337, D-380 | Aucun « Renseignez… » ni « incomplètes sont signalées » résiduel ; aucune valeur de couleur écrite (rendu dans Figma) ; CIR-09 (carte) compatible avec un signalement du contrôle, donc non amendée | **partielle** | (a) Le contour orange de D-337 et le fond rouge pâle de D-389 sont conservés ensemble, avec un `À CLARIFIER` sur le maintien du contour, car aucune décision ne tranche. (b) CE-UI-10 §14 « erreur nommant la Série » : la formulation contredit D-337 et D-389 pour une cible manquante, mais couvre aussi les valeurs invalides, qui ne sont pas arbitrées ; elle n'est pas modifiée. (c) Catégorie et Zones corporelles sont obligatoires mais sans « fond gris » documenté : l'application de D-389 à ces boutons-icônes est à vérifier dans Figma. |
| **A3 — D-390** : sous le titre du Circuit, la durée seule | ch. 07 D-390 ; ch. 08 (ligne Résumé de la Composition) | ch. 06, 08 ; statuts de D-100 et D-091 | Aucun « N exercice(s) · » ni « 0 exercice · 0 min » résiduel | **vérifiée** pour l'emplacement | (a) Libellé de durée à vide sous le Circuit (« 0 min » de D-091, ou format min/s de D-391 ?) : non fixé. (b) Le nombre d'Exercices de la Composition (ch. 08 §3.9, RM-074) n'a plus d'emplacement d'affichage documenté. (c) Formulation ambiguë du ch. 12 l. ~826 (« synthèse calculée des exercices »). |
| **A4 — D-391** : durées des cartes en min/s, sans arrondi | ch. 10 RM-159 ; format des durées du ch. 08 `#phrases` | ch. 08, 10, DSF-CARTES-DUREE ; statut de D-090 | Aucun `Math.ceil`, « minute supérieure » ni « arrondi à la minute » résiduel hors historique du registre ; règle Q20 (≥ en min/s) conservée | **vérifiée** | Durées du Calendrier hors du champ de D-391, non touchées |
| **A5 — D-392** : carte de Séance vide, `0 exercice` | ch. 07 D-392 (portée de D-091 précisée) | ch. 06, 08, 13 (`À CLARIFIER` résolu) ; statut de D-091 (fusion avec A3) | Aucun « 0 exercices » résiduel hors historique ; D-081 (pluralisation générale) non modifiée | **vérifiée** | — |
| **A6 — D-393** : lecteur vidéo natif de la plateforme dans l’éditeur | ch. 07 D-393 | ch. 08 (`À CLARIFIER` résolu), ch. 13 CE-T03-04, PRODUCT | Aucun « lecteur natif iOS » seul ; Exécution (CE-MEDIA-EXEC) non touchée | **vérifiée** | Les « actions VoiceOver » (alternative accessible au menu de la tuile, Q31) sont propres à iOS ; l'équivalent Android n'est pas décidé |
| **A7 — D-394** : message récapitulatif de migration, `Compris` | ch. 09 (migration) ; ch. 12 | ch. 09, 12 | Rien n'est affiché si aucun Exercice n'est écarté ; pas à chaque mise à jour ; migration atomique, dénombrement et Q19/Q28 conservés | **partielle** | (a) Libellé exact du message non fixé par la décision : `À CLARIFIER` conservé. (b) Aucun contrat d’écran ne porte ce message (le contrat Splash ne traite que l'échec) : à placer au lot 6, sans créer de contrat ici. |
| **A8 — D-395** : bilatéralité d’un Circuit, besoin d’évolution hors périmètre | ch. 07 D-395 ; ch. 02 §8 | ch. 02 (2 lignes) | Plus de « non retenu dans la version actuelle » sans D-395 ; D-209 inchangée ; aucune conception ajoutée | **vérifiée** | La ligne du ch. 02 §8 décrit déjà un comportement de l'évolution (héritage, contrôle unilatéral désactivé). Elle est conservée telle quelle, D-395 interdisant de concevoir la fonctionnalité. |
| **A9 — D-396** : ligne Total toujours affichée dans la feuille Paramètres | ch. 07 D-396 ; ch. 13 CE-UI-10 | ch. 06, 08, 13 (`À CLARIFIER` D-246 résolu) ; statut de D-384 | Cas N = 1 et « — » écrits ; totaux de Composition et des cartes non touchés | **partielle** | **Contradiction à arbitrer** : D-396 dit « toujours affichée, en modes Durée et Répétitions », mais CE-UI-10 (§8, §9 « Retrait du total », §10, §12, §20), le ch. 08 (ligne Total) et les DSF Deux modes et Séries variables retirent la ligne en Répétitions **sans bip** et quand **toutes les cibles sont À l’échec** (total omis, RM-132). D-396 ne dit pas ce que la ligne affiche dans ce cas. Ces passages ne sont pas modifiés. |

## Contrôles (seconde passe)

| Contrôle | Résultat | Statut |
|---|---|---|
| Présence des 9 règles à leur domicile | registre (D-388 à D-396) et passages cités ci-dessus | vérifié |
| Rejeu indépendant des 36 corrections sur `ca3a009d` | identique au disque, hormis la section du registre (12 lignes attendues) | vérifié |
| Anciennes prescriptions concurrentes | aucune pour A1, A3, A4, A5, A6, A8 ; A2 et A9 : résidus listés ci-dessus | vérifié / partiel |
| Propagation transverse (PRODUCT, INDEX, DSF, données, API, architecture) | PRODUCT (A6), DSF-CARTES-DUREE (A4), ch. 09 (A7), ch. 12 (A7) ; INDEX et ch. 11 : rien à modifier (aucune occurrence concernée) | vérifié |
| Conservation des règles non concernées | les corrections ajoutent ou remplacent seulement les formulations visées ; statuts historiques complétés sans réécriture | vérifié |
| Registre | 388 décisions, sans doublon | vérifié |
| Liens Markdown ; chemins Unicode ; fins de ligne | 2 anomalies historiques inchangées ; aucun renommage ; CRLF homogène | vérifié |
| Périmètre du diff | `docs/` (10 fichiers) et `openspec/` uniquement | vérifié |
| PR #363, #370, #371 | têtes inchangées ; aucune ligne de PR touchée ; fusions simulées : 0 conflit | vérifié |
| Validation OpenSpec | `openspec validate --strict` | vérifié |
| Rendu graphique (teinte, contour, boutons-icônes) | Figma non consulté | **non vérifiable** dans ce clone |

## Points à clarifier issus de cette livraison

Ils sont repris dans [arbitrages.md](arbitrages.md), section « Après les arbitrages A1 à A9 ».

1. **A9** : contenu de la ligne Total en Répétitions sans bip ou toutes cibles « À l’échec » (aujourd'hui retirée), face à « toujours affichée ».
2. **A2** : maintien ou retrait du contour orange de D-337 avec le fond rouge pâle ; sort de « erreur nommant la Série » (CE-UI-10 §14) pour les valeurs invalides.
3. **A3** : libellé de durée à vide sous le titre du Circuit ; emplacement éventuel du nombre d'Exercices de la Composition.
4. **A6** : alternative accessible Android au menu de la tuile Média (VoiceOver sur iOS).
5. **A7** : libellé du message de migration (à fixer avec le contrat d'écran au lot 6).
