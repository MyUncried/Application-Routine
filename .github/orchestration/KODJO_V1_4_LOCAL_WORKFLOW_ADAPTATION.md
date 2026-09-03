# KODJO — V1.4 LOCAL — adaptation minimale des workflows

Statut : **option 3 retenue — automatisation de l’orchestration hors réveil Claude local**.

## 1. Décision d’exploitation

Claude Code local reste l’unique écrivain de développement.

Le réveil de Claude Code local n’est pas déclenché par GitHub Actions dans le chemin nominal. Lorsque Claude doit reprendre, l’utilisateur saisit uniquement :

`Reprends le protocole KODJO depuis le dernier checkpoint GitHub.`

Le contexte, la mission, le plan, le HEAD, les décisions et l’autorisation doivent déjà être présents dans GitHub. L’utilisateur ne les recopie pas.

Le runner Windows self-hosted et les workflows de micro-test restent des preuves historiques. Ils ne sont pas supprimés, mais ne sont pas promus comme moteur de développement automatique.

## 2. Ancien chemin Cloud

Les workflows V1.3 utilisant `ubuntu-latest`, `anthropics/claude-code-action@v1`, `CLOUD_WRITE` ou un HEAD historique ne doivent pas être réarmés pour le développement nominal.

Claude Cloud, le fallback Cloud et une nouvelle étude de Managed Agents/SessionStore sont hors périmètre sauf nouvelle décision explicite.

## 3. Ce qui reste automatisable

GitHub/GitHub Actions peut continuer à automatiser sans lancer Claude :

1. publication et validation des checkpoints ;
2. contrôle déterministe de branche/HEAD/périmètre ;
3. anti-doublon et verrouillage des transitions ;
4. conservation des décisions et résultats ;
5. détection des états `*_READY_FOR_REVIEW` ;
6. signal vers ChatGPT/Work via un transport réellement démontré/configuré ;
7. accusés de réception et reprise de publication ;
8. métriques et traçabilité ne nécessitant pas d’appel Claude.

Le transport historique démontré `pull_request:synchronize → Work` reste réutilisable sous ses conditions démontrées.

## 4. Checkpoint obligatoire avant réveil Claude

Avant de demander à l’utilisateur de réveiller Claude, GitHub doit permettre de déterminer sans ambiguïté :

- mission/tranche ;
- état courant et dernier état stable ;
- branche ;
- HEAD et `authorized_head` ;
- mode local canonique ;
- écrivain Claude local ;
- autorisation d’écriture ou lecture seule ;
- périmètre de fichiers/actions ;
- plan approuvé lorsqu’il est requis ;
- décisions/arbitrages applicables ;
- sources fraîches à consulter ;
- résultat/revue à traiter ;
- prochaine action attendue de Claude.

Si ces informations ne sont pas reconstructibles, le réveil Claude est bloqué par `ORCHESTRATION_FAILURE`.

## 5. Reprise Claude

Après l’instruction canonique, Claude doit d’abord lire le checkpoint GitHub et vérifier les préconditions. L’instruction utilisateur n’est pas une autorisation d’écriture.

Une session native Claude existante peut être reprise si elle est disponible et cohérente avec le checkpoint. Sinon Claude reconstruit le contexte minimal depuis GitHub. Aucune mission complète n’est recopiée manuellement par l’utilisateur.

## 6. Retour Claude → GitHub

À la fin d’une mission, Claude publie le rapport/checkpoint exigé par le protocole. Le résultat doit permettre à ChatGPT/Work de reprendre indépendamment de la mémoire de la conversation Claude.

Les règles de double livraison des rapports définies dans `KODJO_ORCHESTRATION_V1_4_LOCAL.md` restent applicables.

## 7. Revue ChatGPT / Work

Lorsqu’un résultat est prêt pour revue :

1. l’état durable passe dans l’état canonique correspondant ;
2. le signal Work démontré peut être émis automatiquement ;
3. ChatGPT/Work effectue la revue indépendante ;
4. si la revue autorise une reprise Claude, un nouveau checkpoint complet est publié ;
5. l’utilisateur reçoit uniquement la demande de réveil minimal de Claude.

L’utilisateur ne sert pas de relais de contenu entre ChatGPT et Claude.

## 8. Incident technique

Les erreurs de transport, publication, compilation/test ou choix d’implémentation réversibles ne sont pas transformées en arbitrages utilisateur.

Quand une correction exige Claude local, le checkpoint décrit le défaut et la reprise attendue, puis l’utilisateur effectue le même réveil minimal. Il n’a pas à recopier l’erreur.

## 9. Sécurité

Le chemin option 3 réduit l’exposition du PC : aucun workflow nominal n’exécute automatiquement Claude Code local.

Le self-hosted runner existant doit être considéré comme infrastructure technique séparée. Son maintien en service n’autorise aucun workflow à lancer Claude dans le cadre du protocole nominal.

Toute réactivation future d’un réveil automatique Claude constitue un changement d’architecture et nécessite une décision explicite.

## 10. Mise en œuvre pour le développement actuel

Avant la prochaine correction métier :

1. établir le checkpoint GitHub du périmètre à corriger ;
2. contrôler documentation/Figma/contrats d’écrans et HEAD ;
3. publier le plan/autorisation nécessaires ;
4. automatiser le signal vers Work lorsque pertinent ;
5. demander à l’utilisateur uniquement le réveil canonique de Claude ;
6. Claude travaille localement et retourne son résultat dans GitHub ;
7. ChatGPT/Work reprend la revue.

Aucun workflow de lancement automatique Claude n’est requis pour rendre V1.4 option 3 opérationnelle.
