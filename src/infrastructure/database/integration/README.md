# Contrôle SQLite natif T01-S01

`runNativeDatabaseIntegrationCheck()` exécute sur un runtime Expo natif le
parcours d’intégration minimal de cette sous-étape :

1. création d’une base dédiée ;
2. migration depuis la version 0 ;
3. création transactionnelle d’une Séance T01-S01 ;
4. lecture et listage par `SessionRepository` ;
5. fermeture et réouverture de la base ;
6. vérification de la persistance de l’utilisateur local ;
7. suppression de la base de contrôle.

Le runner n’est relié à aucun écran métier. Pour une campagne native, l’appeler
temporairement depuis un point d’entrée de développement, attendre la résolution
de la promesse et retirer cet appel avant toute distribution :

```ts
import { runNativeDatabaseIntegrationCheck } from
  "@/infrastructure/database/integration/runNativeDatabaseIntegrationCheck";

void runNativeDatabaseIntegrationCheck();
```

La campagne doit être exécutée au minimum sur un runtime Android et un runtime
iOS. La base de contrôle `kodjo-t01-s01-integration.db` est distincte de
`kodjo.db` et est supprimée à la fin, y compris après la vérification de
réouverture.
