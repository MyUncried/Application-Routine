# Brief — propagation de la spécification v3.0 dans la documentation KODJO

Tu proposes des corrections ; tu ne les appliques pas. **Ne modifie aucun fichier sous `docs/`**, ne fais aucune opération git. Tu écris uniquement ton fichier de corrections (chemin indiqué dans ta mission) dans `openspec/changes/integration-parametres-execution-v3/corrections/`.

## Sources à lire d'abord
1. Spécification : `openspec/changes/integration-parametres-execution-v3/source/KODJO_Charge_Specification_2026-10-18.md` (intégralement).
2. Décisions déjà intégrées : chapitre 07, section « Évolution des paramètres d’exécution — décisions du 18 octobre 2026 » (D-403 à D-413).
3. Règles déjà intégrées : chapitre 10, section « Évolution des paramètres d’exécution du 18/10/2026 » (RM-235 à RM-250). **C’est la source normative unique** de ces règles.
4. Inventaires (lecture seule) dans `C:\Users\hadjo\AppData\Local\Temp\claude\C--Dev-KODJO-OPENSPEC-DOCS\c0facca7-25bd-483e-9bf7-856fd338de22\scratchpad\` : `inv-cotes.tsv`, `inv-charge.tsv`, `inv-cadence.tsv`, `inv-duree.tsv`, `inv-arret.tsv`, `inv-groupes.tsv`, `figma/verification-figma.tsv`. Les numéros de ligne datent d’avant l’insertion des sections D-403/RM-235 (ch. 07 et 10 seulement décalés).
5. Correctifs des PR ouvertes, à ne pas appliquer : `openspec/changes/revision-documentation-kodjo/lot6/finalisation/pr/pr-370-report.patch` et `pr-371-report.patch`.

## Règles de propagation
- **Ne pas recopier les règles RM-235 à RM-250.** Dans les autres chapitres, citer l’identifiant (« RM-239 », « D-406 ») ou poser un lien vers la section du chapitre 10. Un passage existant contredit est réécrit au minimum, en citant la décision qui le remplace.
- **Libellés visibles** (écrans, contrats, DSF) : Mode ; Condition d’arrêt (À l’échec / À la cible ; résultat « À la cible et à l’échec ») ; Phases de l’exercice ; Nombre de séries ; Type de série (Variables / Identiques) ; Charge (Avec / Sans, valeur « 20 kg ») ; Changement de côté (Avec / Sans) ; Enchainement ; Pause entre les côtés ; Cadence (Autre | 5 s | 2 s | 1 s | Sans) ; Durée de l’exercice ; Compte à rebours ; Fin d’exercice. Ne pas réintroduire Activité, Tour, Cible, Définie, Ordre comme libellés de ces contrôles (les mots cible, tour gardent leur sens métier ailleurs).
- **Concepts conservés** (ne pas renommer partout) : « Ordre des côtés » reste le nom du concept d’enchaînement (libellé visible Enchainement) ; « Bip de cadence » reste le concept (libellé visible Cadence) ; « Durée totale » reste le concept de calcul, et le texte « Durée totale : … » de la phrase de synthèse n’est **pas** modifié (point ouvert) ; seul le libellé de la ligne de la feuille devient Durée de l’exercice. Ne pas renommer les titres de sections ni les ancres (liens).
- **Côtés (D-406, D-407, RM-242 à RM-244)** :
  - choix `Aucun` / `D→G` / `G→D`, « Sans changement / Droite puis gauche / Gauche puis droite » → Changement de côté Sans / Avec ;
  - « uniquement en D→G/G→D » → « uniquement avec changement de côté (Avec) » ;
  - `Côté droit` / `Côté gauche` (exécution) → `Côté 1` / `Côté 2` ;
  - phrases « côté droit puis le gauche », « à droite, puis à gauche » → côté 1 / côté 2 ; supprimer « inverser les directions pour un départ gauche » ;
  - séquences de calcul écrites D1…G3 : les réécrire en prose sans créer de notation (pas de C1S1/C2S1), par exemple « côté 1 : S1→P1→S2→P2→S3→PN, puis PC, puis côté 2 : S1→P1→…→P3 » ;
  - données : `UNILATERAL` / `RIGHT_LEFT` / `LEFT_RIGHT` → changement de côté Sans / Avec, valeurs historiques `RIGHT_LEFT` et `LEFT_RIGHT` lues Avec (RM-244) ; `RIGHT` / `LEFT` du côté courant et des résultats → côté 1 / côté 2, noms techniques laissés à l’implémentation, valeurs historiques lisibles ;
  - indicateur de carte `D→G` / `G→D` → indicateur de changement de côté sans direction (D-407), rendu selon Figma ;
  - « à droite », « à gauche » décrivant une position à l’écran : ne pas toucher.
- **Charge** : ajouter une mention citée (RM-235 à RM-241) là où le modèle, les données, l’API, la copie/duplication/instantané, la phrase, l’exécution ou les contrats énumèrent les paramètres d’un Exercice ; une phrase courte suffit. Ne pas inventer de nom de champ technique, de borne ou de position dans la phrase de synthèse.
- **Cadence** (RM-245), **Durée de l’exercice** (RM-246), **chevrons** (RM-247), **Condition d’arrêt** (RM-248, RM-249), **roulettes** (RM-250), **présentation** (D-413) : remplacer les prescriptions d’interface contredites (stepper Bip comme présentation de la ligne, chevron indépendant, popovers Mode / régime / côté, pied commun ± et steppers de cellules du tableau, option « Aucune durée, à l’échec » de la roulette de durée commune, libellés anciens). Conserver bornes, pas, calculs, symboles ≈ / ≥, substitution des signaux en Séance, règles de brouillon, de validation et de séries.
- **Ne pas toucher** : `docs/archives/`, annexes (« Annexe – … »), textes des décisions du registre (seul l’agent chargé du ch. 07 complète les colonnes de statut), journaux et rapports datés (`RAPPORT-*`, `REPORT-*`, `JOURNAL-*`, `VERIFICATION-*`, `MATRICE-*` sauf mission contraire), copies figées PRE-4/PRE-5 hors dépôt.
- **Phases d’exercice** : elles n’existent pas encore dans les chapitres (PR #370). Ne pas les introduire ; ne mentionner les phases que si un passage existant en parle déjà.
- **PR #370 / #371** : éviter de réécrire les lignes que ces correctifs modifient. Si c’est indispensable, ajoute juste avant le bloc une ligne de commentaire `# CONFLIT-PR #370` ou `# CONFLIT-PR #371` avec une phrase d’explication.
- **Unicode** : apostrophe typographique ’ dans le texte français, tirets – et — comme dans le fichier, espaces insécables existants conservés (copie exacte de l’« ancien »).
- En cas de doute réel sur le sens, **ne corrige pas** : consigne le passage dans la section `# QUESTIONS` de ton fichier (ligne de commentaire « # Q : fichier:ligne — question »).

## Format du fichier de corrections

```
=== <ID unique, ex. V3-A-001> | @<nom exact du chapitre>.md (ou nom du fichier relatif à docs/, ex. DSF-BIP-CADENCE-2026-10-07.md) | CORRECTION-DECIDEE:D-4nn | <références de la spécification, ex. CO-01, AC-23>
--- ancien
<texte EXACT, copié du fichier, une ou plusieurs lignes complètes ; il doit apparaître exactement UNE fois dans le fichier>
--- nouveau
<texte de remplacement>
```

- Motif : `CORRECTION-DECIDEE:D-4nn` (la décision qui fonde la modification, D-403 à D-413) ; `RENVOI` pour un simple lien ou une citation ajoutée sans changer de sens.
- Préférer des lignes complètes comme « ancien ». Vérifie l’unicité avec `grep -c -F` (ou un petit script node) avant de rendre le fichier. Pour un ajout, prends comme « ancien » une ligne voisine unique et recopie-la dans « nouveau » avec l’ajout.
- Les blocs d’un même fichier ne doivent pas se chevaucher.
- Vérifie ton fichier : `node openspec/changes/integration-parametres-execution-v3/outils/construire-corrections.mjs . <ton .txt> <scratchpad>/essai.json` puis `node openspec/changes/integration-parametres-execution-v3/outils/appliquer.mjs . <scratchpad>/essai.json` (simulation : rien n’est écrit). Corrige jusqu’à « 0 écartées ». Ne lance jamais `--appliquer`.

## Réponse finale
Résumé ≤ 20 lignes : nombre de corrections par fichier et par décision, passages volontairement non modifiés et pourquoi, questions, conflits PR.
