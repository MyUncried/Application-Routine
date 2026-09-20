# Correction de l'empreinte UI entre producteurs et consommateurs

## Cause vérifiée

Baseline : c5e4524fa4b92a336d519a221bbb2d7270b5e9bd, après la correction
HANDOFF_APPLICATION_DRIFT qualifiée et intégrée par PR #226.
Le run de matérialisation 35510100229 franchit ce contrôle puis échoue avant
publication : IMPLEMENTATION_UI_MATRIX_HASH_MISMATCH.

Plan #5749470081, revue APPROVE #5749494128, PR applicative #181 inchangés.
Le validateur producteur verify-ui-plan-criteria.js calcule SHA256 sur la matrice
normalisée par validateMatrix. Deux consommateurs, implementation-contract.js et
verify-ui-implementation-review.js, calculaient SHA256 sur la matrice brute.
Le tri des tableaux rend ces empreintes différentes sans changement sémantique.

Rejeu exact du plan approuvé :
- contrat approuvé et matrice normalisée : a3c2aa8e052960900e752bab8e41faaceea004da8fa409d5cea5ce5eaed6e2fb ;
- matrice brute : 9d831c9a1284ec6cfd4bd3ccf30680f02076c38e5765060c352d7e440cb84d2d ;
- validateur producteur en mode consume : PASS, 10 critères.

Le plan et la revue restent valides. Aucune régénération ni réécriture de leurs
contenus approuvés n'est nécessaire ou effectuée.

## Correction minimale et dépendances

matrixFingerprint utilise le validateur/normaliseur autoritaire existant puis le
même SHA256 canonique que le producteur. Les deux consommateurs l'utilisent.
Aucun fallback vers le hash brut, aucune suppression du contrôle d'empreinte.
Le contexte des cibles fourni au normaliseur sert uniquement au calcul structurel
du hash : il ne vaut pas autorisation de scope, toujours contrôlée par le plan et
la Lean Request. Les règles de validation/normalisation existantes restent intactes.

Le workflow de revue transporte aussi ui-criteria-contract.js dans son runtime
figé avant checkout applicatif. Cette dépendance est indispensable pour ne pas
consommer un ancien validateur de la PR applicative.
Les quatre fixtures de tests des consommateurs portent désormais l'empreinte
normalisée réellement produite, plutôt qu'un contrat brut impossible en production.
La fixture minimale F12 est complétée avec les champs obligatoires de la matrice,
sans changer ses scénarios de rapports incomplets ni leurs refus.

## Vérifications

Tests ciblés : 42 tests, 41 PASS, 1 SKIP PowerShell absent localement, 0 FAIL.
Un nouveau test traverse les vrais CLI producteur et consommateur : matrice brute
non triée, empreinte normalisée différente, mission et revue acceptées, octets du
plan inchangés, hash brut refusé, altération de règle refusée.
Les tests de gel du runtime, de préservation, de preuves et de finalization sont
conservés et passent. Rejeu local du vrai plan : 10 critères, hash approuvé exact.
62 workflows acceptés par le parseur indépendant, invariants exécutables PASS.
Qualification complète Linux et Windows obligatoire sur le commit publié avant
intégration ; SHA et résultats distants consignés dans la PR.

Seconde passe : recherche transverse des calculs sha256(matrix) dans les scripts ;
les deux consommateurs concernés sont corrigés, le producteur conserve son calcul
sur normalizedMatrix. Aucun changement applicatif, produit, Figma, bootstrap,
registre, plan, revue, gate humain ou queue. Hors périmètre : évolutions niveau 2/3.
La qualification réelle du handoff reste à obtenir après intégration ; aucun succès
de tests n'est présenté comme une publication effective du commentaire utilisateur.

## Dépendance de transition contrôlée avant relance

La liste fermée historique ne reconnaissait que les workflows kodjo-v2-* et
omettait le workflow canonique de revue d'implémentation, dont le runtime figé
requiert maintenant la dépendance ci-dessus. Son chemin exact est ajouté ; aucun
wildcard kodjo-slice-* n'est introduit. Un test de vraie transition Git accepte
ce seul chemin et refuse un delta mixte applicatif ainsi que les chemins voisins
et inconnus. Les sources protégées et l'ascendance restent contrôlées. Cette
propagation nécessaire évite un refus artificiel postérieur sans requalifier un
changement produit comme protocolaire.
