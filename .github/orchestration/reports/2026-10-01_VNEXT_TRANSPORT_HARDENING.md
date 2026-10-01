# Corrections VNext — transports, admissions et publication

Base GitHub exacte : 6af6455be9f1ab703727bfee021d188a0333a70c. PR #269.
Portée : protocole uniquement. INITIAL_PASS et REVISION_PASS acquis restent inchangés.
FINAL, activation, cutover, fusion et PRE-1 ne sont pas lancés.

| Incident ou lacune | Cause observée | Correction intégrée | Limite conservée |
| --- | --- | --- | --- |
| YAML invalide, empreintes obsolètes | Publication avant validation du contenu complet ; changement de test sans correspondance actualisée | Validation du tree Git exact avant publication, validateurs existants réutilisés | Les écritures administrateur hors protocole ne sont pas verrouillées |
| HEAD déplacé pendant la qualification Windows | Publication d'un nouveau checkpoint pendant un run lié au HEAD précédent | Guard HEAD/checkpoint/runs actifs et parent attendu ; groupes de concurrence conservés | Révalidation immédiatement avant publication obligatoire |
| Transport REVISION préparatoire avec issue_comment:1 | Placeholder présent dans le générateur ; remplacement manuel lors de cette campagne | Constructeur fermé commun INITIAL/REVISION sans gate ni UUID provisoire ; réservation GitHub réelle, finalisation générée, puis message exact après qualification | Une réservation ne vaut pas approbation |
| Entrées d'admission de rigueur différente | L'entrée directe cherchait des fragments de message et une réaction admissible | Vérification commune du message complet et de la réaction exacte référencée | Aucune compromission de la campagne réussie n'est alléguée |
| Qualification préalable contrôlée par le pilote de campagne | Le superviseur ne relisait pas les quatre jobs GitHub requis | Admission vérifiant candidat exact, workflow, dernière tentative et jobs réels Linux/Windows | Les tests de fixture ne sont pas des preuves runtime Claude |
| Ancien artefact de récupération absent | API GitHub du run 34606534268 : total_count=0 lors de la vérification du 1er octobre 2026 | Téléchargement non bloquant pour le pilote courant ; réserve NON_CERTIFIED conservée | Aucun gate exigeant cette preuve historique n'est affaibli |
| Erreur environnementale traitée comme décision humaine générique | Politique d'erreur : catégorie humaine par défaut | Diagnostics connus et inconnus orientés diagnostic technique, sans retry automatique | L'arbitrage métier reste requis quand effectivement identifié |

Les exacts blob OID des deux workflows writers modifiés sont actualisés dans
KODJO_VNEXT_REMOTE_WRITE_POLICY.json. Toutes les autres lignes legacy restent inchangées.
Les seules empreintes/positions des cas correspondant aux tests modifiés sont actualisées.
Les 420 sujets, leurs protections et leurs preuves historiques restent identiques.

## Échec de qualification conservé et correction causale

Candidat 57aa9f1b25fd57770784860c4ba4efcbb4965553 : run pilote 36897140188,
job Linux 110486847129, FAILURE réel (921 tests, 919 PASS, 1 FAIL, 1 SKIP).
Le contrôle historique `qualification jetable: cache Jest isolée et cache lint désactivée
dans les deux chemins réels` exige `continue-on-error: true` immédiatement après
le nom de l'étape de certification. La condition `if` insérée entre les deux
propriétés avait cassé cette assertion. Correction : réordonner les propriétés ;
le test et sa protection restent inchangés. Le run d'équivalence Linux 36897140225,
job 110486848562, a correctement refusé cette exécution incomplète.

Le validateur de publication réutilise désormais ce contrôle historique ciblé
lorsque le workflow pilote change. Le parser indépendant couvre aussi `.yaml`
et `.yml`, avec refus testé sur les deux extensions. Les 36 contrôles locaux
ciblés de cette correction et du raccordement commun INITIAL/REVISION passent ; cela ne remplace pas la nouvelle CI exacte.

## Qualification

Implémentation en cours de qualification. Les résultats CI seront enregistrés dans
2026-10-01_VNEXT_TRANSPORT_HARDENING_EVIDENCE.json avec les identifiants réels,
le candidat exact et les résultats par plateforme. Aucun succès CI n'est anticipé.
