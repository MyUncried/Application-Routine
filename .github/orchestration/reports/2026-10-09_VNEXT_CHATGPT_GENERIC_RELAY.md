# VNext / PRE-4 — relais générique ChatGPT

## Problème et livraison

#346 raccordait seulement la revue de plan. Le complément de portée conservait une réponse refusée localement et obligeait le pilote à demander à Hermann une commande et un fichier. Le besoin confirmé est un transport commun, pas un workflow par incident.

Le cycle est désormais dans `lib/vnext-agent-relay.js` : précontrôles, verrou Claude existant, intent exclusif, cache, dédoublonnage, reprise, résultat ou diagnostic, copie de réponse brute et manifeste de fichiers. `agent-relay.js` expose une demande GitHub fermée et trois adaptateurs : plan, portée, implémentation. Le CLI de #346 réutilise aussi ce cycle ; le workflow existant sélectionne l'entrée depuis un des deux répertoires de demande autorisés.

La demande dérive une identité sémantique vérifiée : un changement du commit de publication ne suffit pas à provoquer un second appel. En cas de cache absent, l'historique GitHub recherche aussi une demande antérieure de la même opération, y compris publiée depuis un autre commit ; une provenance indéterminée bloque.

Le reviewer d'implémentation conserve la réponse et l'état du processus avant validation et reconstruit son reçu sans nouvel appel. Le relais emploie une empreinte de dossier indépendante des chemins machine, conserve les hashes des preuves et lit les grands blocs liés depuis les objets Git exacts. Les entrées de revue existantes gardent leur comportement historique par défaut.

## Qualification locale

- 54 tests PASS, zéro échec : relais générique (9), compatibilité plan (10), complément (4), lancement/revue Figma (21), frontières causales (10).
- Adaptateurs de production exercés avec processus simulés et validateurs réels : plan REVISE, portée causale exacte, implémentation et faits JSON épinglés, reprise sans second appel, grands blocs file-bundle et vérification après téléchargement dans un autre répertoire.
- Cas exact de la capture `VNEXT_SCOPE_UNOBSERVED_DEPENDENCY` : réponse brute et diagnostic récupérables depuis l'artefact, aucun reçu valide, même refus lors de récupération, un seul appel simulé.
- Quota, Claude actif, PRE-3 ouverte, commande inconnue, demande étrangère, preuve altérée, cache perdu avec run antérieur et republication du même dossier sont couverts.
- Politique des 57 publications d'artefacts, syntaxe JS, validation des workflows, scanner d'écritures distantes et diff : PASS.

Ces résultats sont des preuves de tests techniques, jamais une attestation de revue indépendante réelle. La CI du commit publié sera consignée dans la PR. Aucun modèle n'a été appelé pour cette qualification locale.

## Limites et activation

Le raccordement ne lance rien par sa publication : aucun fichier de demande n'est ajouté. PRE-3 (#340), son dossier et sa revue en cours ne sont pas modifiés ; #344 reste indépendante. L'exécution est gardée pour PRE-4 après clôture #340 et instruction explicite de démarrage.

Le premier parcours réel, le réveil d'une conversation inactive et la récupération réelle après interruption restent à constater ; #345 reste ouverte. Le pilote peut nécessiter « reprends PRE-4 », mais doit retrouver lui-même les preuves. Il ne doit proposer ni commande PowerShell ni transfert de fichier à l'utilisateur.

Les processus de développement/clôture conservent leurs workflows, permissions et gates propres ; les audits historiques/de qualification ne sont pas relancés. Ce changement ne certifie pas les pixels ou les appareils natifs ; il transporte les preuves et résultats des validateurs existants.

Procédure et inventaire : `.github/orchestration/KODJO_VNEXT_CHATGPT_AGENT_RELAY.md`.
