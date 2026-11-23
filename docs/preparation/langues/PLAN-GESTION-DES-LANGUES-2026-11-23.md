# KODJO — Gestion des langues : plan de définition et de mise en œuvre

> Document de préparation du 23/11/2026. Il n'est pas normatif : les règles ne deviennent applicables qu'une fois reportées dans le registre des décisions (chapitre 07) et les chapitres dépendants (étape D0 ci-dessous).
> Point de départ : état des lieux `.github/orchestration/reports/2026-11-23_LANGUES-ETAT-DES-LIEUX.md`. Benchmark : `BENCHMARK-LANGUES-CONCURRENTS-2026-11-23.md` (même dossier).


## 0. Troisième échange du 23/11/2026 — arbitrages (texte d'origine)

« A0. Bresilien / A1. Oui j'intègre le multilingue comme un chantier à part entière à commencer maintenant. / A2 ok / A3 je ne comprends pas / A4 un contenu KODJO ne peut pas être modifié par un utilisateur / A5 Veux tu dire est ce qu'on commence ? Oui / A6 simplifiées puis traduites. Je verrai ensuite pour la validation / A7. Une seule unité définie dans le profil, conversion seulement lorsque l'unité est modifiée. »

État : A0, A1, A2, A4, A5, A7 tranchés ; A6/A8 : traduction IA retenue, validation à définir plus tard ; **A3 reste ouvert** (reformulé ci-dessous). **D0 réalisé** : section « Gestion des langues — décisions de Hermann du 23/11/2026 » au chapitre 07, formulations contraires annotées dans les chapitres 02, 05, 07, 10, 12 et 13.

Point technique ouvert (A7) : arrondi à la conversion kg ↔ lb (par exemple 45 lb = 20,41 kg) et absence de dérive en cas de changements répétés ; à définir dans le lot T5.

## 1. Décisions de Hermann du 23/11/2026 (texte d'origine)

| # | Sujet | Réponse de Hermann |
|---|---|---|
| H1 | Langues après le français | « 1. Anglais 2. Espagnol 3. Italien 4 Allemand » ; complément du même jour : « J'ai oublié portugais » (rang et variante à préciser, A0) ; rang : « Avant l'allemand ». Ordre retenu : anglais, espagnol, italien, portugais, allemand. |
| H2 | Choix de la langue d'interface | « Par défaut celle du téléphone, avec option de changer dans le profil. L'anglais en dernier recours. » |
| H3 | Langue de la voix | « Liée. » (avec question : « Est ce l'usage, la bonne pratique ? ») |
| H4 | Contenus | « Les contenus de KODJO sont traduits, ceux fournis par les utilisateurs non, ou seulement en anglais. » |
| H5 | Alias | « Les deux, mais d'abord synonyme, ou le nom commun associé au nom qui est entré. » |
| H6 | Unités et formats | « À définir dans le profil utilisateur, Compte ou préférences, quelle recommandation ? » |
| H8 | Repli (texte manquant) | « Anglais » |
| H6 bis | Emplacement Langue / Unité (second échange) | « Dans Compte on a Le genre le nom, le pseudo. La langue et l'unité devraient être avec le genre je trouve non ? Ce n'est pas logique ni l'usage ? Préférence est déjà tellement chargé. Par ailleurs, est ce que notification ne devrait pas être sous confidentialité ? » (question : réponse au § 2.2) |
| H7 | Phrases de synthèse | « On va revoir cette synthèse qui n'est utilisée qu'à un endroit, les exercices dans la composition, la normer et la simplifier un peu. a) les standardiser / simplifier b) les traduire par un traducteur IA c) je les ferai relire par quelqu'un de natif dans la langue. » |

H3, H6 et H6 bis attendent une recommandation (§ 2). H7 tranche A6 (§ 2.3).

## 2. Recommandations sur les points ouverts

### 2.1 Voix liée à l'interface (H3)

Recommandation : **liée, sans réglage séparé** — c'est l'usage majoritaire (benchmark § C ; seul le minuteur Seconds propose un choix de voix séparé).
- Les annonces vocales sont produites à partir des mêmes textes que l'interface (nom de l'exercice, « Préparez-vous », phrases du générateur). Une voix dans une autre langue que l'interface lirait un texte qu'elle n'a pas, ou exigerait une seconde traduction de chaque annonce.
- La voix utilisée reste la voix système de la langue choisie (règle actuelle : pas de choix de voix au MVP).
- Point technique : par défaut iOS prend la voix de la langue du **système**, pas de l'app ; KODJO doit donc passer explicitement la langue de l'interface à la synthèse vocale (benchmark § B).
- Cas à traiter : contenu non traduit (exercice créé par l'utilisateur en français, interface en anglais) → la voix anglaise prononcera un nom français. Comportement accepté par défaut ; à confirmer.
- Conséquence documentaire : la phrase de D-034 « l'évolution multilingue pourra gérer séparément la langue de l'interface et celle de la synthèse vocale » est remplacée.

### 2.2 Unités et formats (H6)

Le Profil comporte les onglets **Compte · Préférences · Confidentialité** (CE-PRF-01). Recommandation :
- [Recommandation initiale « Préférences » remplacée après H6 bis.] **Langue** et **Unité de charge (kg / lb)** dans **Compte**, dans un groupe distinct placé sous l'identité (Nom d'affichage, Pseudo, Genre/silhouette). Il n'y a pas d'usage dominant : Hevy et Fitbod rangent les unités dans des « Réglages / Preferences », d'autres apps dans le profil. Dans KODJO, « Compte » est local et décrit la personne ; la langue et les unités lui sont attachées comme le genre, et « Préférences » est déjà chargé. Réserve : si un compte distant apparaît plus tard, garder ce groupe séparé de l'identité de connexion.
- **Notifications** : recommandation de **ne pas** les déplacer sous Confidentialité. Confidentialité porte le partage et l'usage des données (douleur, Communauté) ; les notifications sont des alertes, rangées à part sur iOS. Ce déplacement sort du sujet des langues : à traiter séparément si Hermann le souhaite.
- **Valeur par défaut de l'unité** déduite de la **région** du téléphone (`measurementSystem` d'`expo-localization`), pas de la langue (un Britannique en anglais utilise le kg, un Américain la livre). Hevy et Fitbod règlent aussi l'unité dans l'app (benchmark).
- **Dates, heures, séparateur décimal, premier jour de la semaine du Calendrier** : suivent automatiquement les réglages régionaux du téléphone, sans réglage dans KODJO (usage iOS).
- Point de conception à trancher : stockage d'une charge saisie en livres (valeur + unité conservées telles que saisies, ou conversion en kg). Aujourd'hui RM-235 : « valeur numérique en kilogrammes … exactement la valeur saisie ».

### 2.3 Gabarits de phrases (H7, reformulé)

KODJO génère des phrases comme « 3 séries de 10 répétitions (charge : 10 kg), récupération de 1 min 30 avant l'exercice suivant ». Ces phrases sont assemblées par du code écrit pour la grammaire française (ordre des mots, accords, singulier/pluriel, ponctuation) et vérifiées par 276 cas de recette. On ne peut pas les traduire mot à mot : en anglais l'ordre et les pluriels changent, en allemand les accords aussi.

Tranché par H7 :
1. **Normer et simplifier** la phrase de synthèse (seul consommateur dans le code : `src/features/activities/ActivityEditorForm.tsx`, via `src/domain/activities/executionPhrase.ts`) ; le corpus de 276 cas est à réviser en conséquence (nouveau corpus français validé par Hermann).
2. **Traduction par IA** des gabarits simplifiés.
3. **Relecture par une personne native** de chaque langue, organisée par Hermann.
Question restante (A8) : ce processus IA + relecture native s'applique-t-il aussi aux autres textes (interface, contenus KODJO) ?

### 2.4 Repli (H2, H8)

Chaîne proposée :
- **Interface** : langues préférées du téléphone, dans l'ordre → première langue supportée par KODJO → sinon **anglais**.
- **Texte manquant** dans la langue choisie → **anglais**. Conséquence : l'anglais doit être complet avant la publication de toute autre langue.
- **Contenu KODJO** non traduit dans la langue choisie → anglais → français (langue source).

## 3. Points à arbitrer avant la documentation

| # | Question | Pourquoi c'est bloquant |
|---|---|---|
| A0 | Portugais (rang tranché : avant l'allemand) : quelle variante — **Brésil (pt-BR)**, **Portugal (pt-PT)** ou les deux ? Les deux diffèrent sensiblement (vocabulaire, tutoiement/vouvoiement, voix iOS distinctes). | Nombre de traductions à produire et à recetter. |
| A1 | Le multilingue entre-t-il dans le **MVP** ? D-034, RM-091, ch. 05 et ch. 12 disent « MVP monolingue, aucun sélecteur, aucune préférence de langue persistée ». | Remplace des décisions validées ; change le périmètre et le planning. |
| A2 | Changement de langue dans Profil › Compte : **ligne « Langue » qui ouvre le réglage iOS de l'application** (recommandation : pratique d'Apple et des concurrents documentés ; KODJO ne stocke rien, iOS relance l'app au changement) ou **sélecteur dans KODJO** (préférence stockée par KODJO, à synchroniser avec le réglage iOS) ? | Définit l'écran Préférences, le stockage et Figma. |
| A3 | « ou seulement en anglais » (H4) : les contenus créés par l'utilisateur ne sont jamais traduits par KODJO, mais l'utilisateur peut-il saisir **une version anglaise** (par exemple pour la Communauté) ? | Change le modèle de données des contenus utilisateur. |
| A4 | Contenu KODJO **modifié par l'utilisateur** puis changement de langue : le champ modifié reste-t-il dans la langue de modification (proposition : oui), les champs non modifiés suivent-ils la nouvelle langue (proposition : oui) ? | Règles d'import, de conflit et d'affichage du catalogue. |
| A5 | Alias (H5) : la saisie d'alias par l'utilisateur, reportée le 27/10, est-elle **rouverte** maintenant ? À quoi servent-ils sans recherche au MVP (D-221) : affichage sur la fiche, détection de doublons à l'import ? | Périmètre de la fiche Mouvement. |
| A6 | ~~Q7a / Q7b~~ — **tranché par H7** (§ 2.3). | — |
| A8 | Processus IA + relecture native étendu à tous les textes ? (§ 2.3) | Lot D9, coût et délai des traductions. |
| A7 | Unité livre : conservation de la valeur saisie ou conversion (§ 2.2). | Modèle de données des charges. |

## 4. Ce qui doit être défini (documentation)

| Lot | Contenu | Documents |
|---|---|---|
| D0 | Inscrire H1–H8 et les arbitrages A1–A7 ; marquer D-034, RM-091, ch. 12 « aucune préférence persistée », ch. 13 « aucun sélecteur de langue » comme remplacés (texte d'origine conservé). | ch. 07, 05, 10, 12, 13 |
| D1 | Règle de résolution de la langue et chaîne de repli (§ 2.4). | ch. 10, 12 |
| D2 | Profil › Compte (groupe sous l'identité) : lignes Langue et Unité de charge, libellés, états. **Écran Figma à produire.** | ch. 13, Figma |
| D3 | Voix liée (§ 2.1). | ch. 10 (Préférences, sons, voix) |
| D4 | Contenus traduits : liste exhaustive des contenus KODJO (Mouvements : nom, alias, étapes ; Catégories, Zones, familles, Formats, Bibliothèques, programmes publiés) ; contenus utilisateur ; règles A3/A4. | ch. 04, 09, format catalogue |
| D5 | Alias : définition (synonyme / nom courant dans la langue de la fiche ; noms dans d'autres langues ensuite). | ch. 09, fiche Mouvement |
| D6 | Unités et formats régionaux (§ 2.2). | ch. 10 (RM-235 et suivantes), 12 |
| D7 | Phrase de synthèse normée et simplifiée, nouveau corpus français, puis gabarits par langue (H7). | ch. 11, 12, 13 |
| D8 | **Glossaire par langue** des termes KODJO (Séance, Mouvement, Exercice, Format, Bibliothèque, Série, Tour, À l'échec…), validé par Hermann avant toute traduction. | nouveau glossaire, ch. 07 |
| D9 | Processus de traduction et de recette : traducteur, relecture, recette iPhone par langue, fiche App Store, textes système iOS (autorisation des notifications). | ch. 12, procédure de recette |

## 5. Ce qui doit être mis en œuvre (code)

Ordre conseillé ; chaque lot passe par le protocole habituel (plan, revue, recette).

| Lot | Contenu | Dépend de |
|---|---|---|
| T1 | **Terminer l'externalisation** des textes encore écrits dans le code (`LibraryScreens.tsx`, `executionStrings.ts`, `catalogueLoadPresentation.ts`, `executionPhrase.ts`, `formats/registry.ts`…). Déjà exigé par RM-092 ; utile même en français seul. | — (peut démarrer) |
| T2 | Socle i18n : détection de la langue (`expo-localization`), déclaration des langues supportées (`supportedLocales`) pour le réglage iOS par application, chargement des ressources, pluriels par règles de langue (pas seulement singulier/pluriel ; support d'`Intl.PluralRules` par Hermes à vérifier sur iPhone), interpolation, repli anglais, tests. | D0, D1, A1, A2 |
| T3 | Formats régionaux (nombres, dates, durées) ; voix = langue de l'interface (remplace la constante `fr-FR`). | T2, D3, D6 |
| T4 | Profil › Compte : Langue, Unité de charge. | T2, D2 (Figma) |
| T5 | Unité livre : saisie, affichage, phrases, stockage. | D6, A7 |
| T6 | Phrase de synthèse simplifiée en gabarits par langue ; recette sur le nouveau corpus français, puis par langue après relecture native. | D7, A6 |
| T7 | Format catalogue multilingue (champs traduits, référentiels traduits), outil d'administration, import mobile, migration des contenus installés, alias. | D4, D5, A3, A4, A5 |
| T8 | Traduction **anglaise complète** (interface, contenus, phrases) puis recette ; ensuite espagnol, italien, portugais (variante selon A0), allemand, une langue à la fois. | T1–T7, D8, D9 |

## 6. Démarrage proposé

1. Hermann tranche A0–A5, A7, A8 (et consulte le benchmark pour A2 et H3).
2. D0–D9 : mise à jour de la documentation normative en un lot documentaire.
3. T1 peut commencer en parallèle de l'étape 2 : il ne dépend d'aucun arbitrage.
