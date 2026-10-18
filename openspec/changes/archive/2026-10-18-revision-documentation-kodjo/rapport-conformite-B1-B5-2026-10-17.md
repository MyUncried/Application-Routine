# Rapport de conformité — précisions B1 à B5 (17/10/2026)

- **Départ :** `9e052128` (publié ; HEAD réel vérifié, aucun écart).
- **Commits :** `6912acc5` (registre et corrections), puis le commit de ce rapport.
- **Branche :** `docs/openspec-revision`, sans merge vers `main`.
- **Statut :** soumis à revue indépendante ; rien n'est déclaré clos ni certifié.

## Décisions enregistrées

- **Numéros :** D-397 à D-401, disponibles. Le registre s'arrêtait à D-396 ; la PR #370 emploie D-370 à D-375 ; aucune autre PR ouverte n'emploie ces numéros.
- **Emplacement :** section « Précisions de Hermann du 17 octobre 2026 (B1 à B5) », ancre `arbitrages-20261017-b`.
- **B1 :** sa portée a été demandée à Hermann avant application, car sa lecture littérale contredisait D-384 et D-396. **Réponse : les cas « omitted » seulement.** D-397 l'écrit explicitement.
- **B5 :** le texte transmis ne contenait pas le nombre (« … terminée. exercice(s) n’ont pas pu … »). D-394 imposant d'indiquer ce nombre, la marque `{N}` est restituée et le signalement figure dans la colonne Portée de D-401. **Point à valider par Hermann.** L'accord au singulier est prescrit par la décision, mais sa formulation exacte n'est pas rédigée ici, pour ne rien inventer.

## Conformité par décision

| Décision | Fichiers et passages | Preuves | Conformité | Remarque |
|---|---|---|---|---|
| **B1 — D-397** : ligne Durée totale masquée lorsqu’aucune durée totale n’est calculée | ch. 13 (CE-UI-10, ligne Total présente sauf ces cas) ; ch. 08 (ligne Durée totale) ; statuts de D-384 et D-396 | Les règles d'absence existaient déjà dans CE-UI-10 rang 8 (« Répétitions sans bip et toutes cibles À l’échec : absente »), au ch. 08 et au ch. 06 ; plus aucun « toujours affichée » sans l'exception | **vérifiée** | « — » maintenu si une cible manque (D-384, D-396) |
| **B2 — D-398** : valeur obligatoire absente, fond rouge pâle sans contour orange | ch. 13 (règles communes de la feuille Paramètres, `À CLARIFIER` résolu) ; ch. 08 (§3.8) ; statut de D-337 | Le contour orange ne subsiste que dans le texte historique de D-337, dont le statut indique désormais le remplacement. CE-UI-10 §14 « −1,11,fraction invalides … erreur nommant la Série » porte sur les valeurs **invalides** : conservé, conformément à B2. | **vérifiée** | Teinte exacte : Figma |
| **B3 — D-399** : Circuit vide « — min » ; aucun nombre d’Exercices | ch. 08 (ligne Résumé, état vide) ; statut de D-091 | Plus de « 0 exercice · 0 min » hors historique ; recette CE-CIR-03 « circuit vide sans valeurs fictives » compatible | **vérifiée** | Le nombre d’Exercices de la Composition reste calculé (RM-074), sans emplacement d’affichage décidé (D-399) |
| **B4 — D-400** : TalkBack sur Android | ch. 08 (tuile Média), ch. 13 (CE-T03-04), statut de D-335 | Plus aucune mention de VoiceOver sans son équivalent Android dans les passages de la tuile Média | **vérifiée** | — |
| **B5 — D-401** : texte du message de migration | ch. 09 (Migration et compatibilité, `À CLARIFIER` résolu) | Titre, texte, accord et bouton repris du texte transmis | **partielle** | `{N}` restitué (à valider) ; aucun contrat d’écran ne porte encore ce message (lot 6) |

## Contrôles

| Contrôle | Résultat | Statut |
|---|---|---|
| Rejeu indépendant des 12 corrections sur `9e052128` | identique au disque ; seuls écarts : la nouvelle section du registre et le statut de D-396, édités à la main | vérifié |
| Registre | 393 décisions, sans doublon ; fins de ligne homogènes | vérifié |
| Variantes résiduelles | « toujours affichée » sans exception : aucune ; contour orange pour une valeur absente : aucun (DSF-PAUSES : icône sans rapport) ; « 0 exercice · 0 min » : aucun ; VoiceOver sans TalkBack (tuile Média) : aucun ; « libellé exact du message » : aucun | vérifié |
| Liens Markdown ; chemins Unicode | 2 anomalies historiques inchangées ; aucun renommage | vérifié |
| Périmètre du diff | ch. 07, 08, 09, 13 et `openspec/` | vérifié |
| PR #363, #370, #371 | têtes inchangées ; fusions simulées : 0 conflit | vérifié |
| Validation OpenSpec | `--strict` réussie | vérifié |
| Rendu (teinte, absence de contour) | Figma non consulté | **non vérifiable** dans ce clone |
