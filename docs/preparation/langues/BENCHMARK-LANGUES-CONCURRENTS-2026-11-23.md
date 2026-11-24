# KODJO — Benchmark de la gestion des langues (23/11/2026)

Recherche web du 23/11/2026. Légende : **V** vérifié (source lue), **P** probable (extrait, page non ouverte ou indirecte), **?** inconnu. Langues relevées sur la fiche App Store US. Les fiches indiquent seulement « Portuguese », sans préciser le Brésil (pt-BR) ou le Portugal (pt-PT).

## A. Concurrents

| App | Langues d'interface | Choix de la langue | Voix | Exercices traduits / perso | Unités |
|---|---|---|---|---|---|
| Hevy | EN + 15 (dont FR, ES, IT, PT, DE) **V** [1] ; fiche App Store Brésil en pt-BR **P** [2] | ? | pas de coach vocal connu | ? | Réglages > Units (poids, distance, mensurations), surcharge par exercice **V** [3] |
| Strong | EN + 10 (dont FR, ES, IT, PT, DE) **V** [4] | ? | ? | ? | ? |
| Fitbod | EN, ES, PT **V** [5] | Langue du téléphone, repli anglais **P** [6] | ? | ? | My Plan > Preferences > Units (lb/kg), surcharge par exercice, historique conservé dans son unité **V** [7] |
| JEFIT | EN, FR, DE, IT, ES, zh-Hans — **pas de portugais** **V** [8] | ? | ? | ? | ? |
| Freeletics | EN, FR, DE, IT, PT, ES + 4 **V** [9] | Réglage iOS « Langue » de l'app (et Android 13+) **P** [10] | ? | Bibliothèque traduite ; des noms d'exercices signalés non traduits **P** [11] | ? |
| Nike Training Club | EN + 16 (dont FR, ES, IT, PT, DE) **V** [12] | Réglages iOS > app > Langue **P** [13] | ? | pas d'exercices perso | ? |
| Seconds (Runloop) | EN, FR, DE, PT, ES + 5 — **pas d'italien** **V** [15] | ? | Voix système ; **choix de voix séparé** dans les réglages sonores, par défaut langue du téléphone **P** [16][17] | noms d'intervalles saisis lus tels quels **P** | — |
| FizzUp | EN, FR, DE, IT, PT, ES, NL, PL **V** [18] | ? | voix enregistrées dans les exercices **P** [18] | ? | ? |
| Decathlon Coach | EN, FR, DE, IT, PT, ES + 3 **V** [19] | ? | coaching vocal, langue ? | ? | ? |

## B. Plateformes

- **iOS** : l'app prend la première langue de la liste des langues préférées de l'utilisateur qu'elle supporte ; sinon sa langue de développement **V** [20]. Réglage « Langue » par application depuis iOS 13, visible seulement si l'app déclare plusieurs langues [21][22]. Une app ne peut pas modifier elle-même ce réglage ; Apple (support développeurs) recommande d'ouvrir les Réglages de l'app **V** [23]. Changer la langue relance l'app **V** [24]. Aucune recommandation HIG trouvée.
- **Android 13+** : réglage de langue par app ; sélecteur dans l'app possible et synchronisé avec le réglage système **V** [25].
- **Expo `expo-localization`** : `supportedLocales` dans le config plugin active le réglage par app ; `getLocales()` donne les langues dans l'ordre du téléphone, avec `regionCode`, `measurementSystem` (`metric`/`us`/`uk`), `textDirection` ; valeurs figées pendant l'exécution sur iOS **V** [24][26].
- **Hermes** : `Intl.NumberFormat`, `DateTimeFormat`, `Collator` supportés (avec restrictions) **V** [27] ; `Intl.PluralRules` non documenté par Hermes **P** [28] → à tester sur iPhone avant d'en dépendre.
- **Voix** : par défaut iOS choisit la voix de la langue du **système**, pas de l'app **V** [29] → pour lier voix et interface, KODJO doit passer explicitement la langue de l'interface.
- **Unités** : dépendent de la **région** (`measurementSystem`), pas de la langue **V** [26] ; Hevy et Fitbod les règlent dans l'app **V** [3][7].

## C. Synthèse

- Les cinq langues retenues (EN, ES, IT, PT, DE) sont celles que couvrent presque tous les concurrents.
- Aucun ne précise pt-BR ou pt-PT.
- Les apps documentées suivent la langue du téléphone ou le réglage iOS par app, avec repli anglais ; aucun sélecteur interne prouvé sur iOS.
- Voix : liée à la langue chez la plupart ; seul Seconds (minuteur) offre un choix de voix séparé.
- Unités : réglage dans l'app, défaut selon la région.
- Beaucoup de cellules restent **?** (centres d'aide inaccessibles).

## Sources

[1] https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350 · [2] https://apps.apple.com/BR/app/id1458862350 · [3] https://help.hevyapp.com/hc/en-us/articles/34953292892823 · [4] https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577 · [5] https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543 · [6] https://help.fitbod.me/hc/en-us/articles/26850917322519-Is-Fitbod-available-in-other-languages · [7] https://help.fitbod.me/hc/en-us/articles/23560953306263-Changing-Units-Imperial-Metric · [8] https://apps.apple.com/us/app/jefit-gym-workout-plan-tracker/id449810000 · [9] https://apps.apple.com/us/app/freeletics-workouts-fitness/id654810212 · [10] https://help.freeletics.com/hc/articles/14511216445714 · [11] https://forum.freeletics.com/t/language-setting-does-not-work-for-excercise-names/16961 · [12] https://apps.apple.com/us/app/-/id301521403 · [13] https://appletoolbox.com/nike-training-club-ios-change-language/ · [15] https://apps.apple.com/app/seconds-interval-timer/id475816966 · [16] https://intercom.help/runloop/en/articles/6159826-changing-the-voice · [17] https://intercom.help/runloop/en/articles/6560123-ios-16-voices-update · [18] https://apps.apple.com/us/app/id723322796 · [19] https://apps.apple.com/us/app/-/id495106186 · [20] https://developer.apple.com/library/archive/qa/qa1828/_index.html · [21] https://developer.apple.com/wwdc19/403 · [22] https://developer.apple.com/forums/thread/721302 · [23] https://developer.apple.com/forums/thread/121996 · [24] https://docs.expo.dev/guides/localization/ · [25] https://developer.android.com/guide/topics/resources/app-languages · [26] https://docs.expo.dev/versions/v57.0.0/sdk/localization/ · [27] https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md · [28] https://formatjs.github.io/docs/guides/react-native-hermes · [29] https://developer.apple.com/documentation/avfaudio/avspeechsynthesisvoice
