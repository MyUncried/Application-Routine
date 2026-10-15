# VNext — lot 2 : résultats, récupération et changement de conversation

Date : 15 octobre 2026. Mission VNEXT-LOT2-20261015. Périmètre PE-04 à PE-09.
État de livraison : candidat à qualifier en CI ; aucune clôture déduite des seuls tests locaux.

## Reprise et limites respectées

Base initiale main 6173ff7a6159e43f01b57f173d84032ed06fe04e, après clôture du lot 1.
Pendant ce travail, l'autre pilote a intégré #364 : base réconciliée par avance rapide
sur 81d962cdb438f5a801c0519d7d637b09b431b10b, sans remplacer ses fichiers.
Le lecteur reconnaît les reprises v1 et les reprises de session v2 avec leur validateur intégré.
PE-32/#365 reste sans fusion ; #344, PRE-4, V2 et le produit ne sont pas modifiés.
Aucune opération PRE-4, aucun modèle, aucune nouvelle automation ou campagne manuelle lancé.
La configuration Work et sa destination restent inchangées.

Le principe propriétaire de simplicité est conservé : pas de nouveau gate, permission,
timeout, expiration de charge, registre par tranche ou tâche de surveillance. Aucun
contrôle supprimé. Les nouveaux résultats sont indicatifs, jamais une autorisation.

## Cause et correction commune

Le transport, la consommation durable et le rattrapage existent déjà. Les lacunes
confirmées sont la reconstruction commune d'un dossier de reprise, la visibilité des
demandes sans run correspondant et la répétition des réveils sans évolution utile.

- inspect-vnext-work.js lit les références courantes, fige les lectures, vérifie les
  liens signal/claim/checkpoint/reçu et le checkpoint réellement publié dans Git.
  Il restitue les travaux traités et pendants, la prochaine action et le propriétaire
  existant, sans transmettre son nonce ni prendre une charge.
- Les demandes sont découvertes dans les chemins communs existants : revue/reprise,
  queue et clôture. Identité, source, cycle, hash et commit d'introduction sont contrôlés.
  Aucun run correspondant observé ne signifie jamais « aucun modèle n'a été appelé ».
  Un dispatch ambigu demande réconciliation ; aucune relance n'est autorisée.
- Le récupérateur horaire existant utilise ce lecteur par défaut, observe également les
  runs non terminés et publie seulement une observation utile différente. Son propre
  commit ou un nouveau passage du cron ne suffisent plus à créer un nouveau réveil.
- Une panne de cette lecture complémentaire devient un diagnostic dans le mécanisme
  de récupération existant, pas une condition supplémentaire d'admission du produit.
- finish retourne un message exploitable après conservation du reçu : résultat,
  erreur/verdict, état, prochaine action, preuves. Ce retour ne certifie jamais le routage
  vers un autre chat et ne masque pas le résultat primaire.
- prepare-handover produit uniquement une proposition de binding depuis la lecture
  fraîche et les automations observées. Ancien déclencheur arrêté, nouveau destinataire
  observé, historique préservé ; une charge possédée exige réconciliation, jamais vol
  ou reprise d'un nonce étranger. Aucune configuration réelle n'est déplacée ici.

## Qualification et preuves

Série locale après intégration de #364 : **81 PASS / 0 FAIL / 0 SKIP**,
tests work-resume, work-execution, work-continuation, work-archive-cache,
pilot-continuity, interrupted-session, chatgpt-plan-review et incident-register.
Les séries précédentes de 25, 33 et 50 tests se recouvrent ; elles ne sont pas additionnées.
Premier test du nouveau fixture : 7 PASS / 1 FAIL, erreur de construction du fixture
(tentative de resceller un objet portant déjà contract_hash), corrigée sans affaiblir le contrôle.
Syntaxe Node, validate-workflows.js et git diff --check : PASS.
Après raccordement du mode connecteur commun : **82 PASS / 0 FAIL / 0 SKIP**
sur les mêmes suites, avec vérification du rejeu en lecture seule, de la compatibilité
des modes du consommateur et du refus d'un transcript modifié. Les 81 tests précédents
sont inclus dans cette série. Le premier candidat ae60bcda26b8734f7343daf0b92e03787d1b9e2b
est supersédé par le candidat intégrant ce raccordement justifié par le contrôle réel.

Cas couverts : deux identités VNEXT-RESUME-A/B sans activation particulière ; reprise
depuis données Git sans mémoire ; échec/absence d'archive conservés ; décision utilisateur
maintenue ; sources tronquées, altérées, divergentes ou déplacées refusées ; transfert
conservant l'historique ; ancien destinataire non admis à prendre une nouvelle charge ;
absence de lancement observée ; doublon sans commit ; diagnostic de lecteur indisponible
conservant le récupérateur. Aucun test ne prétend simuler un vrai réveil Work.

### Confrontation en lecture seule aux données GitHub réelles

Le lecteur commun a été exécuté depuis un dossier isolé avec les réponses du connecteur
GitHub, sans écriture distante, prise de charge, publication de reçu ou appel modèle.
Main : 81d962cdb438f5a801c0519d7d637b09b431b10b.
Transport : 165bfc6ddf8b0d28a076ca420a95e9e8114608a8.
Les liens de checkpoints et leur ascendance ont été vérifiés, avec relecture finale des têtes.
L'API du connecteur refuse la collection runs par nom de workflow ; la collection globale
autorisée a donc été paginée intégralement (78 runs sur la fenêtre), puis filtrée sans
changer les données par producteur. Les enveloppes REST contents ont été reconstruites
depuis le texte exact retourné par le connecteur, pas depuis des assertions inventées.

Cette limitation d'API a conduit à raccorder le mode step-inspect à l'adaptateur de
rejeu existant, extrait dans vnext-connector-step sans changer les hashes de contexte,
les requêtes ou contrôles step-claim/step-finish. Le lecteur utilise directement la
collection globale autorisée. Ce raccordement remplace le besoin d'un pont de lecture
à reconstruire dans chaque nouvelle session ; aucune activation par tranche.

Un premier passage avait observé f23946a2a687c5b366861f481989b83812429818 au départ
et une autre tête à la fin : WORK_RESUME_HEAD_MOVED, sans snapshot annoncé courant.
La seconde observation a réussi sur la référence ci-dessus. Les signaux pendants ne sont
pas pris en charge dans cette mission, afin de préserver le pilote de chaque opération.
Résultat : 22 signaux, dont 12 PENDING et 10 PROCESSED ; parmi ces derniers,
7 RESULT_CONSUMED et 3 BLOCKED_WITH_EVIDENCE. Aucune opération attendue supplémentaire
sans signal n'a été relevée à cette observation. Le snapshot est conservé dans
2026-10-15_VNEXT_LOT2_RESUME_SNAPSHOT.json, SHA-256 physique
435000c078e75a356d4a16c894e1fc2e84cb954720f577f58defbbe3301ecfe4.

Exemple d'échec réel reconstructible : checkpoint
85d13a4655205c9c99ad44719cf9de57e6e3cedb7227de505a182467c973b225,
BLOCKED_WITH_EVIDENCE, run 38735463939 en échec ; il conserve la prochaine action de
diagnostic/correction et n'accorde ni approbation ni nouvel appel. Les reçus de #366 et
#365 restent des résultats techniques distincts de leur autorisation d'intégration.

## Disposition des six sujets avant résultat CI

| Sujet | Déjà présent | Complément candidat | Limite conservée |
|---|---|---|---|
| PE-04 | Signal et reçu durable sur succès/échec | Message commun après finish, état et prochaine action reconstruits | Publication dans le chat d'exécution ; routage de l'interface Work non garanti |
| PE-05 | Timeout des enfants et rattrapage horaire | Demandes sans run observé, runs en cours, réveils dédupliqués | Pas de délai arbitraire ni de relance implicite ; aucun travail attendu inventé sans demande |
| PE-06 | Échecs archivés et transport vérifié | Scénarios négatifs communs et reconstruction d'échecs réels | Réveil spontané dans le même fil pilote non démontré par ces tests |
| PE-07 | Binding et destinations historiques | Proposition de handover vérifiée, propriété conservée et procédure commune | Aucun transfert réel vers un nouveau chat effectué dans cette mission |
| PE-08 | Sources et checkpoints Git | Lecteur commun sans mémoire, utilisé aussi par la récupération | Ne crée pas une nouvelle conversation ni ses autorisations |
| PE-09 | Automation et binding observés | Proposition issue des vrais identifiants, ancienne destination conservée pour lecture | Un binding ne route pas l'interface Work ; nouvelle réception effective non fabriquée |

La limite Work déjà explicite au lot 1 ne devient pas une nouvelle garantie. Le candidat
qualifie les mécanismes contrôlables du dépôt ; il ne certifie ni un handover réel non
demandé, ni une destination inventée, ni une poursuite du pilote qui n'a pas été observée.
Le résultat CI exact, l'intégration et la disposition finale seront ajoutés après contrôle.

## Correctif de déclaration du writer après CI

Le run 38756077055 du candidat 2d423be7e912a483473e298b45001804e3e364b8 a échoué : l’empreinte déclarée de consume-vnext-work-signal.js était encore celle du fichier antérieur. Le contrôle a correctement refusé le candidat ; ses refus de publication et de cutover en sont les conséquences. L’empreinte déclarée devient 6773158c91e64b97ba2b34e3855efd5e86b1e040, calculée sur les octets du producteur. Aucune condition ni capacité du writer n’est changée.

Après correction : série locale vnext-remote-write-security, vnext-cutover-preparation et vnext-candidate-source : **22 PASS / 0 FAIL / 0 SKIP**. Ce résultat ne remplace pas la CI du nouveau candidat et ne clôture pas le lot 2.
