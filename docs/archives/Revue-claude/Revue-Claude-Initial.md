# Revue Claude initiale

> Source : onglet `Claude Première revue` du fichier Excel de référence.
> Contenu archivé de la première revue de Claude ; aucune réponse ou correction ultérieure n’est intégrée ici.

Contradictions fonctionnelles concrètes
#: 1
Sujet: Suppression d'une routine et historique
Le problème: Presque tous les documents (PRODUCT.md principe 2/3, 08 §1.3, 09.12, RM-006)garantissent
que supprimer une routine ne supprime jamais les séances passées. Mais le tableau « Règles
fonctionnelles » de l'écran Mes routines (08, ligne Supprimer) dit littéralement : «  Supprime
définitivement la routine après confirmation. L'historique associé est également  supprimé. » —
contradiction directe avec la règle métier structurante n°2/3 du produit.
---
#: 2
Sujet: « Pause après activité » vs « jamais automatique »
Le problème: PRODUCT.md §3 pose en principe qu'« une pause… n'est jamais ajoutée automatiquement à un
exercice ». Mais l'écran Création d'un exercice (05/08) propose un champ « Pause après l'activité »,
et le modèle de données (09.4, DM-001) décrit explicitement une « Activité Pause liée… créée
automatiquement » avec ses propres valeurs par défaut. Il faut clarifier si cette pause générée reste
 une activité indépendante et explicite dans la liste, ou une exception au principe.
---
#: 3
Sujet: « Fin de routine » : événement unique ou conteneur d'activités ?
Le problème: 08 §2.1 la décrit comme « une ou plusieurs séries de fin de routine facultatives » (comme
la fin de cycle). Mais l'annexe des écrans (08) et la maquette Nouvelle routine — État  initial
montrent une carte unique « 🚩 Fin de routine — 1 minute » avec une seule durée (comme lecompte à
rebours initial), cohérent avec D-019 (« un événement, pas une activité »). Ce sont deux modèles de
données différents.
---
#: 4
Sujet: Deux ou trois types d'activité ?
Le problème: PRODUCT.md, 01, 02, 05 (RM-016, RM-017) parlent constamment d'Exercice / Pause /
Récupération. Mais le modèle de données formel (09.4) ne définit que « Exercice » et « Pause » — «
Récupération » n'existe dans aucun attribut. Il faut trancher si Récupération est un vraitype ou un
simple synonyme visuel de Pause.
---
#: 5
Sujet: Terminologie « Série »
Le problème: Le mot « Série » désigne à la fois l'unité élémentaire (« Série | Étape élémentaire :
exercice… pause… ») et le conteneur qui la répète (« Série | Séquence ordonnée de séries,répétée N
fois » — un « Série » qui contient des « séries »). C'est intenable pour un modèle de données ou du
code (impossible de nommer deux concepts distincts avec le même identifiant). Le chapitre07 –
Glossaire et conventions, censé trancher ce point, est  vide.
---
#: 6
Sujet: Navigation à 3 ou 4 onglets ?
Le problème: PRODUCT.md et le corps du chapitre 05 décrivent une navigation à 3 entrées (Mes routines
/
Planification / Suivi), avec Planification en simple écran « Bientôt disponible ». Mais toutes les
maquettes Figma (et la note 99 – Synthèse de la mise à jour, plus récente) montrent 4 onglets actifs
: Mes routines, Agenda, Suivi, Profil, avec des séances planifiées visibles (« Prochaine séance :
demain à 18h ») et des notifications activées — bien au-delà de « Bientôt disponible ».
---
#: 7
Sujet: Ampleur du Suivi MVP
Le problème: Le texte fonctionnel (PRODUCT.md, 03, 08) décrit un suivi minimal : liste chronologique,
statut, durée. La maquette Suivi — Vue d'ensemble montre un tableau de bord complet avec cumuls,
comparaisons de périodes (+40 % vs période précédente), graphiques empilés par séance et top 5 des
routines — une fonctionnalité de la V4 (« tableaux de bord et analyses comparatives ») selon 04.
---
#: 8
Sujet: Bouton « Précédent » en exécution
Le problème: 02 (parcours) et le tableau détaillé de l'écran 8 (08) listent « revenir à l'étape
précédente » comme commande principale. La note d'itération plus récente du même chapitre08 déclare
: « Le bouton Précédent est supprimé du MVP. » Les deux passages cohabitent dans le même document
sans que l'un soit marqué comme remplaçant l'autre.
---
#: 9
Sujet: Décision D-013 vs maquettes Agenda
Le problème: D-013 confirme que les occurrences de planification ne sont pas persistées en V1
(cohérent
avec « hors MVP »), mais les maquettes affichent déjà un Agenda fonctionnel avec vues semaine/mois —
renforce l'incohérence n°6.
Ambiguïtés et manques documentaires
- docs/INDEX.md est vide — pas de point d'entrée vers la documentation.
- 07 – Glossaire et conventions est vide — aggrave directement la contradiction n°5 ; c'est pourtant
le document désigné pour fixer le vocabulaire.
- 11 – API fonctionnelles et 12 – Architecture technique sont vides — aucune décision technique
n'existe encore ; c'est cohérent avec le fait que vous me demandez de la proposer, mais cela confirme
qu'il n'y a pas de contrainte préexistante à respecter au-delà de PRODUCT.md §7/8.
- Stockage local « à définir » (PRODUCT.md §8) : décision technique ouverte, à trancher avant tout
modèle de données concret.
- Comportement en arrière-plan (audio, minuteur, écran verrouillé) explicitement noté comme « devra
être validé pendant le développement » (08, écran 8) — nécessite un spike technique iOS/Android avant
d'engager l'écran d'exécution.
- Reprise tardive d'une séance suspendue : 02 note explicitement que la règle (nouvelle séance vs
continuation) « reste à préciser ».
- Multilingue implicite : le Profil (maquette + tableau 08) montre un sélecteur de langue(« Langues
prises en charge par l'application »), alors qu'aucun document fonctionnel ne mentionne
l'internationalisation comme un besoin du MVP.
- Numérotation des décisions : le registre (06) saute D-003, D-009, D-010 — probablement des décisions
retirées, mais rien ne le confirme (risque de décisions « fantômes » perdues).
- Badge « Retour au calme » apparaît dans un tableau de l'écran de composition (08) alorsque le texte
affirme à plusieurs reprises que « Retour au calme n'est pas un type structurel particulier » —
probablement un simple libellé visuel facultatif, mais mérite confirmation explicite.
- Questions ouvertes non tranchées listées dans 00 et 01 (essentiellement hors MVP : vidéo,
granularité du partage, révocabilité, stats de groupe, interface pro) — n'impactent pas le MVP
directement, mais influencent l'architecture à préparer pour les V3/V4 (cf. section 4).
---
3. Décisions à prendre avant développement
Bloquantes pour modéliser les données et l'écran de composition :
1. Nom définitif des concepts « Série (élément) » vs « Série (conteneur répété) » — indispensable
avant d'écrire le moindre type TypeScript.
2. Nature de « Fin de routine » : événement à durée unique, ou conteneur d'activités ordinaires comme
la fin de cycle ?
3. Le champ « Pause après activité » crée-t-il une vraie Activité indépendante et positionnée dans la
routine, ou une sous-structure spécifique à l'Exercice ?
4. Deux types d'activité (Exercice/Pause) ou trois (+ Récupération) ?
5. Correction du tableau « Supprimer une routine » de 08 (l'historique ne doit pas être supprimé) — à
corriger dans la doc, pas une vraie décision produit mais une erreur à acter.
Bloquantes pour cadrer le périmètre exact du MVP livré :
6. Le MVP inclut-il réellement l'Agenda et les notifications basiques (comme le montrent les
maquettes), ou seulement un écran « Bientôt disponible » (comme l'indique le texte) ? Cela change
fortement l'ampleur du chantier V1.
7. Le Suivi du MVP est-il une simple liste, ou le tableau de bord complet avec graphiqueset
comparaisons vu en maquette ?
8. Le bouton « Précédent » pendant l'exécution : conservé ou retiré ?
9. Le sélecteur de langue en Profil : le MVP doit-il être livré en multi-langue (au moins
l'infrastructure i18n) ou uniquement en français ?
Techniques, à trancher avant d'écrire la couche de données :
10. Choix du moteur de stockage local (ex. SQLite via expo-sqlite/Drizzle, WatermelonDB, ou autre) —
doit anticiper la synchronisation cloud V3.
11. Stratégie de gestion d'état (ex. Zustand/Jotai + couche repository) et de tests (Jest+ RNTL, e2e
Maestro/Detox).
12. Résultat du spike « audio/minuteur/annonces en arrière-plan et écran verrouillé » suriOS et
Android — conditionne la conception de l'écran d'exécution.
13. Règle précise de « reprise tardive d'une séance suspendue » (délai au-delà duquel on considère une
nouvelle séance).
14. Complétion du glossaire (07) une fois les points 1-4 tranchés, pour servir de référence unique à
l'équipe et au code.
Je recommande de traiter les points 1 à 5 et 10 à 12 avant la première ligne de code — cesont eux qui
déterminent la forme du modèle de données et du moteur d'exécution. Les points 6 à 9 peuvent être
tranchés dans le plan de découpage (section 5) sans bloquer le démarrage.
---
4. Proposition d'architecture logicielle
Principe directeur
Une architecture locale d'abord (local-first), en couches, où le cœur métier (domaine + moteur
d'exécution) est du TypeScript pur, indépendant de React Native, testable sans simulateur, et portable
vers le web. Toute intégration native (audio, TTS, stockage, notifications) passe par uneinterface
(port) dont l'implémentation est substituable — c'est ce qui permettra sync cloud, comptes, partage et
IA plus tard sans réécrire le cœur.
src/
├── app/                     # Expo Router : écrans + navigation UNIQUEMENT (composition d'UI)
│
├── features/                # Un module par domaine fonctionnel
│   ├── routines/
│   │   ├── domain/          # Entités, règles métier pures (ex: validité d'une routine)
│   │   ├── application/     # Cas d'usage (créer, dupliquer, archiver…) + interfaces repository
│   │   ├── data/             # Implémentation(s) du repository (SQLite aujourd'hui)
│   │   └── ui/               # Composants + hooks spécifiques à l'écran
│   ├── activities/
│   ├── execution/            # Moteur d'exécution (plan, machine à états) — 100% pur, testé
unitairement
│   ├── tracking/              # Séances, historique, synthèse
│   ├── preferences/
│   └── taxonomies/            # Catégories + zones corporelles (référentiels)
│
├── shared/
│   ├── ui-kit/                # Design system : composants, tokens (couleurs, typo, espacements)
│   ├── i18n/                  # Couche de traduction (même si FR uniquement au départ)
│   ├── platform/               # Ports : AudioPort, TTSPort, HapticsPort, StoragePort,
NotificationPort
│   │                            # + implémentations natives (expo-*) et web (no-op/fallback)
│   └── utils/
│
├── store/                     # État applicatif transverse (session utilisateur, préférences en
cache)
└── test/                      # Utilitaires de test, fixtures
Points clés :
- Séparation domaine/plateforme. Le moteur d'exécution (construction du plan à partir de l'instantané,
machine à états En cours/Pause/Suspendue/Terminée) est un module pur — aucune dépendance React
Native. Il se teste massivement en Jest sans rendu, et sera réutilisable tel quel sur unefuture
version Web.
- Repository pattern. Chaque feature expose une interface (RoutineRepository, SessionRepository…)
implémentée localement (SQLite recommandé — via expo-sqlite ou Drizzle ORM pour un schématypé et des
migrations). Le jour de la synchronisation cloud (V3), on ajoute une implémentation
distante/synchronisée (ex. approche outbox + merge) sans toucher aux cas d'usage ni à l'UI.
- Identifiants stables dès le MVP. Toutes les entités utilisent des UUID générés côté client (pas
d'auto-incrément local) — indispensable pour fusionner des données lors d'une synchronisation future,
et déjà cohérent avec l'entité Utilisateur locale prévue par D-014.
- Modèle prêt pour le partage/pro sans l'implémenter. Les entités Routine et Séance portent un ownerId
dès le MVP (pointant vers l'utilisateur local unique). L'ajout futur d'un groupId/sharedWith/rôles
(V3/V4) se fait en étendant le schéma, pas en le refondant. La logique d'autorisation reste isolée
dans la couche application, jamais dans l'UI.
- Port IA. Une interface RoutineAdvisorPort (vide/no-op en MVP) dans features/routines/application
prépare l'intégration progressive de suggestions (V4) sans coupler l'UI à un fournisseur d'IA
particulier.
- Ports plateforme pour le guidage. AudioPort/TTSPort/HapticsPort isolent expo-speech,
expo-av/expo-audio, expo-haptics — utile pour gérer proprement le spike arrière-plan (point 12
ci-dessus) et pour offrir des fallbacks web (silencieux) sans dupliquer la logique de l'écran
d'exécution.
- Web-ready dès le MVP. Les modules domain/application/shared/i18n n'importent jamais directement
React Native ; seuls ui/ et shared/platform/*.native.ts le font. react-native-web est déjà dans les
dépendances, donc ui-kit doit rester compatible (éviter les API strictement natives dans les
composants partagés).
- État applicatif. Recommandation : Zustand (léger, testable, sans boilerplate) pour l'état
UI/session, combiné à des hooks de repository (pattern proche de TanStack Query même sansréseau, pour
préparer la mise en cache/synchro future).
- Tests. Jest + React Native Testing Library pour domaine/composants ; tests unitaires exhaustifs sur
le moteur d'exécution (c'est la partie la plus risquée et la plus centrale du produit) ; Maestro (ou
Detox) pour un parcours e2e critique (créer → exécuter → retrouver dans l'historique).
- Accessibilité/responsive. Design tokens centralisés dans ui-kit, respect des réglages système
(taille de texte, contraste) dès le départ, breakpoints définis mais non exploités avant la
tablette/web (juste pour éviter une réécriture).
---
5. Plan de développement du MVP (vertical slices)
Chaque étape est livrable, démontrable et testable indépendamment. L'ordre respecte les dépendances
fonctionnelles.
Phase 0 — Socle
1. Squelette Expo Router (onglets), thème/design tokens de base, choix et mise en place du stockage
local, configuration Jest/RNTL. Livrable : app vide, compile iOS/Android/Web, navigation
fonctionnelle.
Phase 1 — Créer une routine
2. Création d'une routine (nom seul) + écran Mes routines (liste, état vide, carte « routine vide »).
3. CRUD d'un Exercice (mode Durée) dans une routine, en liste plate (sans Série/Cycle).
4. CRUD d'une Pause (durée, fin auto/manuelle, consigne).
5. Réorganisation des activités (déplacer, dupliquer, supprimer + annulation temporaire).
6. Structure Série×M / Cycle×N (conteneurs, compteurs de répétition) — nécessite d'avoir tranché la
décision terminologique n°1.
7. Compte à rebours initial + Fin de routine — nécessite la décision n°2.
8. Résumé/validation avant lancement (durée estimée, blocage si routine invalide).
Phase 2 — Exécuter une routine
9. Moteur d'exécution : construction du plan à partir d'un instantané (module pur, testé unitairement,
sans UI).
10. Écran d'exécution minimal (un exercice chronométré, Terminé/Suivant) — preuve du parcours
bout-en-bout.
11. Intégration Série/Cycle dans le déroulé + modes Répétitions et Manuel.
12. Guidage sonore (bips, annonces vocales, activation indépendante) — inclut le spike
arrière-plan/écran verrouillé.
13. Pause/reprise de séance, réinitialisation d'une activité, passage à l'activité suivante,
interruption/abandon avec confirmation.
interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse (sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur, décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application effective à
la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préserv
compatible (éviter les API strictement natives dans les composants partagés).
- État applicatif. Recommandation : Zustand (léger, testable, sans boilerplate)
pour l'état UI/session, combiné à des hooks de repository (pattern proche de
TanStack Query même sans réseau, pour préparer la mise en cache/synchro future).
- Tests. Jest + React Native Testing Library pour domaine/composants ; tests
unitaires exhaustifs sur le moteur d'exécution (c'est la partie la plus risquée et
la plus centrale du produit) ; Maestro (ou Detox) pour un parcours e2e critique
(créer → exécuter → retrouver dans l'historique).
- Accessibilité/responsive. Design tokens centralisés dans ui-kit, respect des
réglages système (taille de texte, contraste) dès le départ, breakpoints définis
mais non exploités avant la tablette/web (juste pour éviter une réécriture).
---
5. Plan de développement du MVP (vertical slices)
Chaque étape est livrable, démontrable et testable indépendamment. L'ordre
respecte les dépendances fonctionnelles.
Phase 0 — Socle
1. Squelette Expo Router (onglets), thème/design tokens de base, choix et mise en
place du stockage local, configuration Jest/RNTL. Livrable : app vide, compile
iOS/Android/Web, navigation fonctionnelle.
Phase 1 — Créer une routine
2. Création d'une routine (nom seul) + écran Mes routines (liste, état vide, carte
« routine vide »).
3. CRUD d'un Exercice (mode Durée) dans une routine, en liste plate (sans
Série/Cycle).
4. CRUD d'une Pause (durée, fin auto/manuelle, consigne).
5. Réorganisation des activités (déplacer, dupliquer, supprimer + annulation
temporaire).
6. Structure Série×M / Cycle×N (conteneurs, compteurs de répétition) — nécessite
d'avoir tranché la décision terminologique n°1.
7. Compte à rebours initial + Fin de routine — nécessite la décision n°2.
8. Résumé/validation avant lancement (durée estimée, blocage si routine invalide).
Phase 2 — Exécuter une routine
9. Moteur d'exécution : construction du plan à partir d'un instantané (module pur,
testé unitairement, sans UI).
10. Écran d'exécution minimal (un exercice chronométré, Terminé/Suivant) — preuve
du parcours bout-en-bout.
11. Intégration Série/Cycle dans le déroulé + modes Répétitions et Manuel.
12. Guidage sonore (bips, annonces vocales, activation indépendante) — inclut le
spike arrière-plan/écran verrouillé.
13. Pause/reprise de séance, réinitialisation d'une activité, passage à l'activité
suivante, interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse
(sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur,
décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) +
application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation
garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles,
petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des
échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou préférez-vous d'abord
valider ce résumé avant qu'on entre dans le détail des décisions ?
found several contradictions (terminology, delete rules, MVP scope vs Figma) that need
your decisions before I can propose the data model and dev plan in detail. (disable
recaps in /config)
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP development.
I found several contradictions (terminology, delete rules, MVP scope vs Figma) that
need your decisions before I can propose the data model and dev plan in detail.
(disable recaps in /config)
I found several contradictions (terminology, delete rules, MVP scope vs Figma) that
need your decisions before I can propose the data model and dev plan in detail.
(disable recaps in /config)
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP
development. I found several contradictions (terminology, delete rules, MVP scope
vs Figma) that need your decisions before I can propose the data model and dev plan
in detail. (disable recaps in /config)
---
❯ On tranche ces points ensemble
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de
création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut)
+ application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec
préservation garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes,
zones tactiles, petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle,
gestion des échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage
avant que je puisse avancer utilement sur le modèle de données et le plan
détaillé : les 5 décisions bloquantes de la section 3 (terminologie
Série, Fin de routine, Pause automatique, 2 vs 3 types d'activité,
correction de la règle de suppression), et le périmètre réel du MVP (3 vs
4 onglets, ampleur du Suivi) au vu de l'écart entre le texte et les
maquettes Figma.
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou
préférez-vous d'abord valider ce résumé avant qu'on entre dans le détail
des décisions ?
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP
development. I found several contradictions (terminology, delete rules,
MVP scope vs Figma) that need your decisions before I can propose the data
model and dev plan in detail. (disable recaps in /config)
(terminologie Série, Fin de routine, Pause automatique, 2 vs 3 types
d'activité, correction de la règle de suppression), et le périmètre réel
du MVP (3 vs 4 onglets, ampleur du Suivi) au vu de l'écart entre le
texte et les maquettes Figma.
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou
préférez-vous d'abord valider ce résumé avant qu'on entre dans le détail
des décisions ?
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP
development. I found several contradictions (terminology, delete rules,
MVP scope vs Figma) that need your decisions before I can propose the
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP development. I
found several contradictions (terminology, delete rules, MVP scope vs Figma) that need
your decisions before I can propose the data model and dev plan in detail. (disable recaps
in /config)
recaps in /config)
recaps in /config)
recaps in /config)
valider ce résumé avant qu'on entre dans le détail des décisions ?
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP development. I found several contradictions
(terminology, delete rules, MVP scope vs Figma) that need your decisions before I can propose the data model and dev plan in
detail. (disable recaps in /config)
suivante, interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse
(sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur,
décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) +
application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation
garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles,
petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des
échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je
puisse avancer utilement sur le modèle de données et le plan détaillé : les 5
décisions bloquantes de la section 3 (terminologie Série, Fin de routine, Pause
automatique, 2 vs 3 types d'activité, correction de la règle de suppression), et le
périmètre réel du MVP (3 vs 4 onglets, ampleur du Suivi) au vu de l'écart entre le
texte et les maquettes Figma.
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou préférez-vous d'abord
valider ce résumé avant qu'on entre dans le détail des décisions ?
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP development. I found several contradictions (terminology, delete rules, MVP scope vs Figma) that need your
decisions before I can propose the data model and dev plan in detail. (disable recaps in /config)
---
❯ On tranche ces points ensemble
---
suivante, interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse
(sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur,
décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) +
application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation
garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles,
petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des
échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je
puisse avancer utilement sur le modèle de données et le plan détaillé : les 5
décisions bloquantes de la section 3 (terminologie Série, Fin de routine, Pause
automatique, 2 vs 3 types d'activité, correction de la règle de suppression), et le
périmètre réel du MVP (3 vs 4 onglets, ampleur du Suivi) au vu de l'écart entre le
texte et les maquettes Figma.
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou préférez-vous d'abord
valider ce résumé avant qu'on entre dans le détail des décisions ?
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP development. I found several contradictions (terminology, delete rules, MVP scope vs Figma) that need your
decisions before I can propose the data model and dev plan in detail. (disable recaps in /config)
---
❯ On tranche ces points ensemble
---
suivante, interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse
(sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur,
décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) +
application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation
garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles,
petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des
échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je
puisse avancer utilement sur le modèle de données et le plan détaillé : les 5
décisions bloquantes de la section 3 (terminologie Série, Fin de routine, Pause
automatique, 2 vs 3 types d'activité, correction de la règle de suppression), et le
périmètre réel du MVP (3 vs 4 onglets, ampleur du Suivi) au vu de l'écart entre le
texte et les maquettes Figma.
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou préférez-vous d'abord
valider ce résumé avant qu'on entre dans le détail des décisions ?
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP development. I found several contradictions (terminology, delete rules, MVP scope vs Figma) that need your
decisions before I can propose the data model and dev plan in detail. (disable recaps in /config)
---
❯ On tranche ces points ensemble
---
arrière-plan/écran verrouillé.
13. Pause/reprise de séance, réinitialisation d'une activité, passage à l'activité
suivante, interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse
(sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur,
décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) +
application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation
garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles,
petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des
échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je
puisse avancer utilement sur le modèle de données et le plan détaillé : les 5
décisions bloquantes de la section 3 (terminologie Série, Fin de routine, Pause
automatique, 2 vs 3 types d'activité, correction de la règle de suppression), et le
périmètre réel du MVP (3 vs 4 onglets, ampleur du Suivi) au vu de l'écart entre le
texte et les maquettes Figma.
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou préférez-vous d'abord
valider ce résumé avant qu'on entre dans le détail des décisions ?
✻ Cooked for 4m 53s
※ recap: I reviewed all the Routine app's product docs to prepare for MVP development. I found several contradictions (terminology, delete rules, MVP scope vs Figma) that need your
decisions before I can propose the data model and dev plan in detail. (disable recaps in /config)
---
arrière-plan/écran verrouillé.
13. Pause/reprise de séance, réinitialisation d'une activité, passage à l'activité
suivante, interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse
(sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur,
décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) +
application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation
garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles,
petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des
échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je
puisse avancer utilement sur le modèle de données et le plan détaillé : les 5
décisions bloquantes de la section 3 (terminologie Série, Fin de routine, Pause
automatique, 2 vs 3 types d'activité, correction de la règle de suppression), et le
périmètre réel du MVP (3 vs 4 onglets, ampleur du Suivi) au vu de l'écart entre le
texte et les maquettes Figma.
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou préférez-vous d'abord
valider ce résumé avant qu'on entre dans le détail des décisions ?
✻ Cooked for 4m 53s
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles, petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des échecs de sauvegarde.
---
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles, petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je puisse avancer utilement sur le modèle de données et le plan détaillé : les 5 décisions
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles, petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des échecs de sauvegarde.
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles, petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des échecs de sauvegarde.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles, petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je puisse avancer utilement sur le modèle de données et le plan détaillé : les 5
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles, petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des échecs de sauvegarde.
---
Je m'arrête ici, sans écrire de code. Deux sujets méritent votre arbitrage avant que je puisse avancer utilement sur le modèle de données et lplan             détaillé                                                                  les
5 décisions bloquantes de la section 3 (terminologie Série, Fin de routine, Pause automatique, 2 vs 3 types d'activité, correction de la règlede             suppression),                                                                  et
le périmètre réel du MVP (3 vs 4 onglets, ampleur du Suivi) au vu de l'écart entre le texte et les maquettes Figma.
Souhaitez-vous qu'on tranche ces points ensemble maintenant, ou préférez-vous d'abord valider ce résumé avant qu'on entre dans le détail des décisions             ?
3. CRUD d'un Exercice (mode Durée) dans une routine, en liste plate (sans Série/Cycle).
4. CRUD d'une Pause (durée, fin auto/manuelle, consigne).
5. Réorganisation des activités (déplacer, dupliquer, supprimer + annulation temporaire).
6. Structure Série×M / Cycle×N (conteneurs, compteurs de répétition) — nécessite d'avoir tranché la décision terminologique n°1.
7. Compte à rebours initial + Fin de routine — nécessite la décision n°2.
8. Résumé/validation avant lancement (durée estimée, blocage si routine invalide).
Phase 2 — Exécuter une routine
9. Moteur d'exécution : construction du plan à partir d'un instantané (module pur, testé unitairement, sans UI).
10. Écran d'exécution minimal (un exercice chronométré, Terminé/Suivant) — preuve du parcours bout-en-bout.
11. Intégration Série/Cycle dans le déroulé + modes Répétitions et Manuel.
12. Guidage sonore (bips, annonces vocales, activation indépendante) — inclut le spike arrière-plan/écran verrouillé.
13. Pause/reprise de séance, réinitialisation d'une activité, passage à l'activité suivante, interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse (sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur, décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation garantie de l'historique.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse (sans ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur, décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles, petits/grands écrans).
│   │                            # + implémentations natives (expo-*) et web
(no-op/fallback)
│   └── utils/
│
├── store/                     # État applicatif transverse (session utilisateur,
préférences en cache)
└── test/                      # Utilitaires de test, fixtures
Points clés :
- Séparation domaine/plateforme. Le moteur d'exécution (construction du plan à partir de
l'instantané, machine à états En cours/Pause/Suspendue/Terminée) est un module pur —
aucune dépendance React Native. Il se teste massivement en Jest sans rendu, et sera
réutilisable tel quel sur une future version Web.
- Repository pattern. Chaque feature expose une interface (RoutineRepository,
SessionRepository…) implémentée localement (SQLite recommandé — via expo-sqlite ou Drizzle
ORM pour un schéma typé et des migrations). Le jour de la synchronisation cloud (V3), on
ajoute une implémentation distante/synchronisée (ex. approche outbox + merge) sans toucher
aux cas d'usage ni à l'UI.
- Identifiants stables dès le MVP. Toutes les entités utilisent des UUID générés côté
client (pas d'auto-incrément local) — indispensable pour fusionner des données lors d'une
synchronisation future, et déjà cohérent avec l'entité Utilisateur locale prévue par
D-014.
- Modèle prêt pour le partage/pro sans l'implémenter. Les entités Routine et Séance
portent un ownerId dès le MVP (pointant vers l'utilisateur local unique). L'ajout futur
d'un groupId/sharedWith/rôles (V3/V4) se fait en étendant le schéma, pas en le refondant.
La logique d'autorisation reste isolée dans la couche application, jamais dans l'UI.
- Port IA. Une interface RoutineAdvisorPort (vide/no-op en MVP) dans
features/routines/application prépare l'intégration progressive de suggestions (V4) sans
coupler l'UI à un fournisseur d'IA particulier.
- Ports plateforme pour le guidage. AudioPort/TTSPort/HapticsPort isolent expo-speech,
expo-av/expo-audio, expo-haptics — utile pour gérer proprement le spike arrière-plan
(point 12 ci-dessus) et pour offrir des fallbacks web (silencieux) sans dupliquer la
logique de l'écran d'exécution.
- Web-ready dès le MVP. Les modules domain/application/shared/i18n n'importent jamais
directement React Native ; seuls ui/ et shared/platform/*.native.ts le font.
react-native-web est déjà dans les dépendances, donc ui-kit doit rester compatible (éviter
les API strictement natives dans les composants partagés).
- État applicatif. Recommandation : Zustand (léger, testable, sans boilerplate) pour
l'état UI/session, combiné à des hooks de repository (pattern proche de TanStack Query
même sans réseau, pour préparer la mise en cache/synchro future).
- Tests. Jest + React Native Testing Library pour domaine/composants ; tests unitaires
exhaustifs sur le moteur d'exécution (c'est la partie la plus risquée et la plus centrale
du produit) ; Maestro (ou Detox) pour un parcours e2e critique (créer → exécuter →
retrouver dans l'historique).
- Accessibilité/responsive. Design tokens centralisés dans ui-kit, respect des réglages
système (taille de texte, contraste) dès le départ, breakpoints définis mais non exploités
avant la tablette/web (juste pour éviter une réécriture).
---
5. Plan de développement du MVP (vertical slices)
Chaque étape est livrable, démontrable et testable indépendamment. L'ordre respecte les
dépendances fonctionnelles.
Phase 0 — Socle
1. Squelette Expo Router (onglets), thème/design tokens de base, choix et mise en place du
stockage local, configuration Jest/RNTL. Livrable : app vide, compile iOS/Android/Web,
navigation fonctionnelle.
Phase 1 — Créer une routine
2. Création d'une routine (nom seul) + écran Mes routines (liste, état vide, carte «
routine vide »).
3. CRUD d'un Exercice (mode Durée) dans une routine, en liste plate (sans Série/Cycle).
4. CRUD d'une Pause (durée, fin auto/manuelle, consigne).
5. Réorganisation des activités (déplacer, dupliquer, supprimer + annulation temporaire).
6. Structure Série×M / Cycle×N (conteneurs, compteurs de répétition) — nécessite d'avoir
tranché la décision terminologique n°1.
7. Compte à rebours initial + Fin de routine — nécessite la décision n°2.
8. Résumé/validation avant lancement (durée estimée, blocage si routine invalide).
Phase 2 — Exécuter une routine
9. Moteur d'exécution : construction du plan à partir d'un instantané (module pur, testé
unitairement, sans UI).
10. Écran d'exécution minimal (un exercice chronométré, Terminé/Suivant) — preuve du
parcours bout-en-bout.
11. Intégration Série/Cycle dans le déroulé + modes Répétitions et Manuel.
12. Guidage sonore (bips, annonces vocales, activation indépendante) — inclut le spike
arrière-plan/écran verrouillé.
13. Pause/reprise de séance, réinitialisation d'une activité, passage à l'activité
suivante, interruption/abandon avec confirmation.
Phase 3 — Historiser et clôturer
14. Enregistrement de la séance (instantané, résultat, statut) + écran de synthèse (sans
ressenti).
15. Ressenti, douleur/gêne, note libre (facultatifs).
16. Écran Suivi — liste chronologique simple (sous réserve d'arbitrage sur l'ampleur,
décision n°7).
17. Détail d'une séance (parcours figé, statuts par activité).
Phase 4 — Référentiels et personnalisation
18. Catégories (CRUD + association multiple + création rapide en modal).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
19. Zones corporelles (CRUD + association aux exercices + modal de création rapide).
20. Profil et préférences (sons, annonces, vibrations, valeurs par défaut) + application
effective à la création.
21. Duplication / Archivage / Suppression de routines (menu Options), avec préservation
garantie de l'historique.
Phase 5 — Consolidation transverse
22. Passe accessibilité et responsive (tailles de police, contrastes, zones tactiles,
petits/grands écrans).
23. Robustesse : récupération d'une séance après fermeture accidentelle, gestion des
échecs de sauvegarde.
