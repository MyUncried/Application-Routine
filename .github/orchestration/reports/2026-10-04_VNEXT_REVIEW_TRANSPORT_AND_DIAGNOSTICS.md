# VNext — transport de revue, diagnostic et correction causale

Parent : `ffd7e415ebb37be9eb44e17204302fd16417cb5f`. PR #269, étape 3 seulement.

## Correctifs livrés

- `vnext-live-chain.js` : transport sans répétition des schémas, du contexte et des sources des consommateurs. Encodage en colonnes sans perte du manifeste candidat. Tous les candidats, y compris les chemins d'archives, restent couverts : aucun filtre de périmètre ajouté. Le catalogue complet reste exigé.
- Couverture de sortie par indices explicites liés à l'empreinte du catalogue immuable. Décodage déterministe, puis vérificateur de rapport existant : absence, doublon, indice hors bornes, mauvais hash, cible ou dépendance inconnue restent refusés. Aucun index absent n'est rempli automatiquement. Les anciennes attestations par identifiants restent vérifiées sans réécriture.
- Diagnostic de chaque processus de revue, écrit dans le répertoire externe déjà uploadé : phase, hashes, taille du dossier, durée, limite, code de sortie, signal, erreur et sorties disponibles. Chaque flux conservé est borné à 128 Kio et les jetons connus sont masqués. Aucun environnement ni dossier intégral n'est ajouté au diagnostic. Les sorties peuvent être vides lors d'un timeout ; cela ne constitue pas une preuve de cause interne.
- `prepare-vnext12-revision.js` : un finding `TEST_GAP` peut être relié à l'intention de son plan parent uniquement avec le TEST exact, son impact de changement, le PLAN_ITEM explicitement présent dans les dépendances et un seul change_id correspondant dans la correction demandée. Le finding réel reste intact. Une seule correction du PLAN_ITEM couvre les causes ; toute ambiguïté reste refusée.
- Le contrôle final du benchmark fige désormais également les champs des change_items autres que leur intention. Source, registre d'exigences, impacts, candidats, scope, obligations de test/preuve et identités de changements restent exacts. Une seconde revue indépendante APPROVE et les résolutions de chaque finding restent nécessaires.
- Délai inchangé dans cette tranche : INITIAL 600000 ms, REVISION 900000 ms. Aucun worker, service, workflow ou dépendance ajouté.

## Mesure et limites

Sur le dossier réel conservé du run 37158701286 : ancien stdin 756620 octets, projection compacte avant consignes 370412 octets ; 1186 cibles intégralement conservées. La restitution des identifiants de couverture est remplacée par des indices plus courts. Cette mesure démontre l'allègement, pas une garantie de durée ni la disparition de tous les timeouts.

Le run 37158701286 a échoué en BOUNDED_CORRECTION après une vraie revue REVISE (session 0574798a-937b-4c1c-b9aa-911e97d53b97, 511893 ms). Ce n'était pas un timeout. Le second finding était classé TEST mais demandait de corriger l'intention CHG-7554bc0b17dad33b0f5d12a7, avec le PLAN_ITEM en dépendance. Sa trace et l'artefact réel sont archivés dans `v8-consolidation/revision-diagnostic-37158701286/`. Ni la seconde revue ni l'implémentation n'ont été lancées dans ce run.

## Vérification locale

234 tests VNext et superviseurs : 234 PASS, 0 FAIL. Tests de comportement du transport indexé et de son rejeu de receipt ; reconstruction exacte du catalogue ; couverture incomplète/mauvais hash/doublon/index inconnu refusés ; vraie interruption d'un petit processus Node de test capturée ; diagnostic d'échec conservé hors checkout sans approbation ; TEST vers PLAN accepté uniquement avec liaison exacte ; obligation modifiée refusée. Ces adaptateurs de test ne sont pas des sessions Claude réelles.

Ancien receipt réel REVISE vérifié sans modification ; ses deux findings sont couverts par un seul patch de plan calculé à titre de diagnostic, non publié comme nouvelle revue. Validateurs de workflows : PASS, YAML indépendant 64/64. Politique d'écriture : 0 ligne modifiée, 0 finding. Empreintes/positions historiques : 0 ligne à actualiser ; 420 sujets/protections préservés.

## Suite autorisée

1. Qualification du nouveau candidat exact : pilotes, contrats et historique Linux/Windows, drivers. Requête QUALIFY_ONLY : aucune revue Claude ni implémentation lancée avant ces résultats.
2. Une fois qualifié, nouvelle préparation REVISION réelle ; les receipts d'anciens candidats ne sont pas retargetés.
3. Seulement après APPROVE et RESOLVED borné à 1 : dossier révisé, transport UUID neuf, gate exact et qualification nécessaire avant EXECUTE_REVISION.

INITIAL déjà consommé ne doit jamais être rejoué. Aucun FINAL, promotion, cutover, fusion ou PRE-1. Qualification distante et nouveau parcours réel restent à prouver.
