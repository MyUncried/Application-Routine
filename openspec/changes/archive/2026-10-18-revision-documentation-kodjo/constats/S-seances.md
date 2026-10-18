# S — Séances, composition, circuits, formats, planification, exécution et résultats

Diagnostic en lecture seule du dépôt `C:\Dev\KODJO-OPENSPEC-DOCS` (branche docs/openspec-revision, chapitres consolidés au 14/10). Chemins abrégés : `ch08` = `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`, et ainsi de suite ; `docs/X.md` pour les documents racine. Chaque citation a été relevée par `grep -n` sur le fichier courant (main, sans les PR #370/#371).

Ne sont pas rediagnostiqués : la contradiction D-077 / D-209 elle-même (pre4 §4), les points P1–P44 et Q1–Q23, les sujets de PR #370 (phases d'exercice) et PR #371 (Q11–Q18, D-309 révisée).

Constats classés par priorité : contradictions bloquantes ou majeures d'abord, puis références qui masquent des règles, puis points mineurs.

---

### S-01 — Statut `Partielle` : trois définitions incompatibles, et une action « ignorer » qui n'existe pas
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch08:996` — « | Partielle | `SESSION_END` a été achevée, mais au moins un Exercice a été interrompue ou ignorée. | »
  - `ch08:1386` — « |Partielle|La séance est arrivée à son terme, mais au moins un exercice chronométré a été interrompue avant la fin de sa durée.| »
  - `ch08:1387` — « |Interrompue|La séance a été arrêtée avant la fin de son exécution.| » (à comparer avec `ch08:997`/`ch03` : « arrêtée avant l'achèvement de `SESSION_END`, y compris pendant cette phase »)
  - `ch03:271` — « - ignorer un exercice ; » (parcours 3, actions disponibles pendant l'exécution)
  - `ch10:115` — « | RM-063 | Aucun retour à un Exercice précédente et aucune sélection libre d'une autre Exercice ne font partie du MVP. | »
- analyse : la même grille de statuts est écrite deux fois dans ch08 (§4.11 et §6.4), et une troisième fois dans ch03, avec des prédicats différents. Selon §4.11, n'importe quel exercice interrompu ou « ignoré » rend la séance Partielle. Selon §6.4, seul un exercice chronométré interrompu avant son terme compte. Les cas récupération partielle (RM-065a), côté partiel (D-150) et Suivant anticipé en cadence (ch13:1282, « sans … Partielle due à la durée ») donnent des statuts différents selon la grille appliquée. « Ignorer un exercice » n'existe pas parmi les actions de ch08 §4.5 (Réinitialiser, Pause, Suivant), et RM-063 exclut toute sélection libre. Le prédicat « ignorée » ne renvoie donc à aucun événement défini. Les deux règles visent le même objet dans le même périmètre (séance libre à plan fini) et ne peuvent pas être appliquées ensemble : c'est une contradiction, pas un complément.
- proposition : une seule grille de statuts de référence, dans ch10 (règle RM à créer à côté de RM-057). ch03 §Parcours 3, ch08 §4.11 et ch08 §6.4 renvoient à cette règle sans la recopier. Le prédicat doit énumérer les causes de Partielle : Suivant confirmé sur une série chronométrée, côté sauté, récupération écourtée (oui/non). Retirer « ignorer un exercice » de ch03 ou le définir comme une action réelle.
- statut PR/décisions : aucun
- touche_PRE4 : oui (ch03, ch08, ch10 figés)
- question à Hermann : une récupération écourtée par Suivant confirmé (RM-065a) rend-elle la Séance `Partielle` ? « Ignorer un exercice » est-il une action distincte de Suivant, ou faut-il le retirer ?

### S-02 — Achèvement « incomplet » du Death by : aucun raccord avec le statut d'Exécution (limite réellement ouverte)
- qualification : AMBIGUITE_PERIMETRE
- gravité : majeur
- passages :
  - `ch10:109` — « | RM-057 | Une Exécution peut être `En cours`, `Suspendue`, `Terminée`, `Partielle` ou `Interrompue`. | »
  - `ch10:154` — « | RM-081 | La cible Formats ajoute l'achèvement fonctionnel incomplet du Death by avec motif/résultat distincts ; son mapping physique reste à qualifier. »
  - `ch08:991` — « > **Formats :** cette grille antérieure n'encode pas à elle seule l'achèvement incomplet du Death by. Conserver séparément motif, résultat et achèvement selon aucun mapping implicite vers Terminée. »
  - `ch09:997` — « Création → En cours → Suspendue → Reprise → Terminée, Partielle ou Interrompue → Historique »
- analyse : la REVUE a corrigé l'assimilation « limite atteinte = Terminée » (REVUE-COHERENCE l.22), et les chapitres portent bien la correction (ch01:446, ch10 FMT-38, CE-FMT-06 §11 et §19, CE-UI-08). En revanche, aucune source ne dit quel statut l'Exécution reçoit dans le Suivi et la Synthèse, qui n'affichent que Terminée, Partielle ou Interrompue (ch08:1642-1643, CE-UI-08 §11). Le cycle de vie de ch09 ne contient pas « incomplet » et ajoute un pseudo-état « Reprise » absent de RM-057. Ce n'est pas une contradiction, puisque les notes interdisent explicitement un mapping implicite. C'est un trou de périmètre : l'achèvement est défini, son affichage et sa place dans le cycle de vie ne le sont pas. « Mapping physique » laisse croire à un sujet technique, alors que le libellé montré à l'utilisateur est une décision produit.
- proposition : dans ch10, compléter RM-057/RM-081 par un axe « achèvement » (complet/incomplet), distinct du statut, avec son libellé dans le Suivi et la Synthèse. Aligner le cycle de vie de ch09 (supprimer « Reprise » comme état ou l'ajouter à RM-057).
- statut PR/décisions : aucun ; signalé comme limite dans REVUE-COHERENCE l.56 (« Les statuts fonctionnels doivent être raccordés au stockage »), sans arbitrage
- touche_PRE4 : oui (textes figés) ; aucun effet sur le code PRE-4 (formats hors périmètre)
- question à Hermann : quel statut voit l'utilisateur sur la carte du Suivi pour un Death by clos par « Limite atteinte » : un statut existant (lequel ?) ou un quatrième libellé ?

### S-03 — Suppression d'une Séance : suppression directe depuis le Catalogue ou archivage préalable obligatoire
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch08:131` — « La suppression est définitive. »
  - `ch08:135` — « La suppression d'une séance entraîne également la suppression de toutes les routines qui lui sont associées. »
  - `ch10:19` — « | RM-007 | Une Séance active ne peut pas être supprimée. Elle doit d'abord être archivée, puis supprimée depuis le résultat du f[iltre `Archivées`] »
  - `ch10:20` — « | RM-008 | L'archivage supprime les Routines futures associées à la Séance, mais conserve les Exécutions… »
- analyse : ch08 §2.5 (« Une séance peut être supprimée depuis le catalogue », avec confirmation si des routines existent) décrit l'ancien modèle de suppression directe. RM-007, RM-008 et RM-011, ainsi que ch08 §2.9 et ch03:253, décrivent le modèle actif : archivage d'abord, suppression des routines à l'archivage, suppression définitive seulement depuis les archives. Les deux règles visent le même objet, la Séance active, et sont incompatibles. Aucune mention « historique » ou « remplacé par » ne figure en §2.5.
- proposition : référence unique RM-007, RM-008 et RM-011 (ch10). Réécrire ch08 §2.5 en renvoi : suppression définitive depuis les archives, routines déjà supprimées à l'archivage.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : aucune (RM-007 et D-121 sont explicites)

### S-04 — Composition : enregistrement automatique ou validation explicite
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch08:403` — « - les modifications sont enregistrées automatiquement ; »
  - `ch08:342` — « La réorganisation modifie le brouillon de composition ; l'enregistrement de la séance persiste cet ordre. »
  - `ch13:988` (CE-T03-08) — « Confirmer applique atomiquement au parent, Continuer seul persiste Session+Composition. »
- analyse : le principe de conception de ch08 §3.10 contredit le modèle de brouillon, persisté seulement par `Continuer`, décrit en §2.3 (ch08:96 « selon les validations explicites »), en §3.7, dans le placement des pauses (ch08:581) et dans CE-T03-08. Il ne s'agit pas d'une différence de périmètre : les deux règles portent sur la persistance de la Composition.
- proposition : supprimer ou corriger la puce de ch08:403 (« les modifications sont appliquées au brouillon et persistées par Continuer »). La référence reste CE-T03-08 §15.
- statut PR/décisions : aucun ; P8 (pre4) confirme le modèle brouillon/Continuer pour PRE-4
- touche_PRE4 : oui
- question à Hermann : aucune

### S-05 — Séance contenant un exercice invalide : enregistrable ou non ?
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch08:352` — « Une séance incomplète peut être enregistrée mais ne peut pas être exécutée. »
  - `ch10:34` — « | RM-017 | `Continuer` reste désactivé tant que le nom est vide ou qu'aucun Exercice valide n'est présent. »
  - `ch13:982` — « Continuer exige nom et au moins un Exercice valide. »
- analyse : selon ch08 §3.8, une séance incomplète s'enregistre et ne s'exécute pas. Selon RM-017 et CE-T03-08, l'enregistrement est refusé s'il n'existe aucun exercice valide, sans rien dire du cas « un exercice valide et un invalide ». pre4 H29 constate que le code PRE-3 (`validation.ts:586-597`) refuse `Continuer` tant qu'une cible reste à renseigner, ce qui fait une troisième lecture. ch08:350 (« Les exercices incomplètes sont signalées ») heurte aussi ch08:490 (« Le marqueur d'incomplétude … ne doit pas apparaître dans la documentation »), sauf à préciser que le signalement n'est pas porté par la carte de composition.
- proposition : référence unique dans ch10 (RM-017 complétée) : exiger que tous les exercices soient valides, ou n'en exiger qu'un. Aligner ch08 §3.8 et CE-T03-08 §14, puis préciser comment l'incomplétude est signalée (H28, « Paramètres à compléter. »).
- statut PR/décisions : couvert partiellement par pre4 H29 (hypothèse alignée sur le code, non validée)
- touche_PRE4 : oui
- question à Hermann : une Séance dont un Exercice a une Cible à renseigner peut-elle être enregistrée (ch08 §3.8) ou `Continuer` est-il refusé (code PRE-3, H29) ?

### S-06 — Circuit/Tour : le Tour reste décrit comme conteneur dans les chapitres actifs
- qualification : CONTRADICTION_REELLE (occurrences de la contradiction D-077/D-209 déjà connue)
- gravité : majeur (pour la documentation) ; sans effet sur PRE-4 (Q4)
- passages :
  - `ch10:48` — « | RM-025 | Une Séance contient exactement un Tour visible et un Cycle technique. | »
  - `ch10:49` — « | RM-026 | Le Circuit est le conteneur ordonné d'Exercices ; un Tour est une exécution complète. »
  - `ch04:198` — « - ce Cycle contient exactement un Tour ; » ; `ch04:190` — « …les Exercices ordonnés avant et après ce Tour. »
  - `ch08:288` — « Une séance contient obligatoirement un Cycle et un Tour… » ; `ch08:833` — « Le Tour répète automatiquement son contenu jusqu'à atteindre son nombre de répétitions défini. »
  - `ch07:52` — « | D-032 | Dans le MVP, une Séance contient exactement un Cycle et chaque Cycle contient exactement un Tour. … | Validé | »
- analyse : pre4 §4 relève la contradiction entre décisions (D-077 contre D-209 et le glossaire). Le présent constat ajoute les occurrences restées dans les règles actives : deux règles consécutives de ch10 (RM-025, où le Tour est le conteneur, et RM-026, où le Tour est une exécution), ch04, ch08 §3.2, §4.3 et §6.2 (ch08:1349, « structure ordonnée des Cycles, Tours et Exercices »), ch09:267, ch11:228 (« Gestion des Cycles, Tours et Exercices ») et D-032, encore « Validé ». D-209 « révise les formulations historiques », sans les nommer. La règle la plus récente ne s'applique pas d'office (brief) : ces lignes restent donc normatives telles qu'écrites.
- proposition : référence unique D-209 et le glossaire (ch01:237-238). Marquer D-032 et D-077 « révisées par D-209 sur le conteneur ». Remplacer « Tour » par « Circuit » dans RM-025, ch04:190 et 198, ch08:288 et 833, ch09:267, ch08:1349 et ch11:228, sans toucher aux identifiants techniques `tour*`/`IN_TOUR` (D-201/D-202).
- statut PR/décisions : contradiction de fond identifiée par pre4 §4 ; ces occurrences ne sont pas listées
- touche_PRE4 : oui (textes) ; non (exigences, Q4)
- question à Hermann : confirmer que D-032 et D-077 sont révisées par D-209 pour le terme du conteneur.

### S-07 — Exécution d'un circuit de séries : indicateur « Tour », barre segmentée par Tours et indices de résultat non définis
- qualification : AMBIGUITE_PERIMETRE
- gravité : majeur
- passages :
  - `ch08:846` — « - la Série et le Tour en cours ; le Cycle n'est jamais affiché ; »
  - `ch06:1627` — « - une barre de progression globale structurée en segments correspondant aux Tours, conformément au prototype Figma. »
  - `ch10:156` — « | RM-083 | Chaque Résultat d'Exercice conserve … sa position, ses indices de Série et de Tour… »
  - `ch13:2755` — « Séance libre à compte borné : Circuit unilatéral, Tours 1..99 ; récupération après chaque occurrence y compris dernière et chaque Tour… »
- analyse : la nature « séries » (ch08 §3.5 et §Circuits, MVP) remplace les Tours par des passages : la série i de chaque exercice (A1 B1 A2 B2…). L'affichage d'exécution (ch06:1622, « le Tour à droite »), la barre segmentée, les indices de résultat (RM-083) et les invariants de CE-EXEC-SESSION-01 ne sont écrits que pour les circuits de tours. Dans un circuit de séries, on ne sait pas ce que montre « Tour », ni comment la barre est découpée (par passage ? en un seul segment ?). Il ne s'agit pas d'une contradiction, puisque le circuit de tours est correctement spécifié, mais d'un trou dans le périmètre du circuit de séries. ch08:601 (« Les éléments internes au Circuit s'exécutent à chaque Tour ») dit « passage » ailleurs (ch08:502).
- proposition : dans ch08 §4.4 et CE-EXEC-SESSION-01 §7, §8 et §19, définir l'indicateur et les segments pour la nature « séries » (« Passage i/N » ou absence d'indicateur). Préciser l'indice porté par RM-083 (passage = indice de série).
- statut PR/décisions : aucun ; Q4 exclut les circuits de PRE-4
- touche_PRE4 : oui (textes) ; non (exigences)
- question à Hermann : pendant un circuit de séries, l'écran d'exécution affiche-t-il un compteur de passages à la place du Tour, et comment la barre est-elle segmentée ?

### S-08 — Compteur de Circuit : RM-027 et le « stepper Nombre de tours » subsistent après leur remplacement explicite
- qualification : CONTRADICTION_REELLE (déjà tranchée par un remplacement explicite, non répercuté)
- gravité : mineur
- passages :
  - `ch10:50` — « | RM-027 | Le nombre de Tours est modifié avec un contrôle compact affichant uniquement `N` … et ouvrant un sélecteur. … Les boutons `+ / −` … ne font pas partie de l'UX de référence. »
  - `ch06:2248` — « Le stepper `Nombre de tours` reste la seule commande numérique de ce groupe… »
  - `ch08:431` — « - appuyer sur **le chiffre** révèle les boutons `−` et `+`, qui changent le nombre ; »
  - `ch08:435` — « Cette décision du 12 octobre remplace l'ancienne cible unique sur toute la valeur. »
- analyse : ch08 §Circuits et DSF-CIRCUITS-CONTROLES l.5 (« remplace … de compteur Circuit indivisible ») prononcent un remplacement explicite. RM-027, qui n'affiche que N, ouvre un sélecteur et exclut les ±, et ch06:2248 n'en portent aucune mention. Le libellé « Nombre de tours » (ch08:382, 1509, 1515 ; D-084 et D-150, ch07:132 et 163) suppose aussi que l'unité est toujours « tours ».
- proposition : marquer RM-027 « remplacée le 12/10 par ch08 §Circuits / DSF Circuits ». Corriger ch06:2248. Remplacer « sous `Nombre de tours` » par « sous le compteur du Circuit ».
- statut PR/décisions : remplacement explicite du 12/10 ; pre4 §4 (point voisin) cite « Nombre de tours » comme libellé hors périmètre
- touche_PRE4 : oui (textes) ; non (exigences)
- question à Hermann : aucune

### S-09 — La « spécification Formats du 14/10 » est introuvable : renvoi en boucle, et §12, SRC-01/04/05 et REC-xx sans destination
- qualification : REFERENCE_ROMPUE (masque des règles)
- gravité : majeur
- passages :
  - `ch08:689` — « Source normative : [spécification Formats du 14/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#formats-conception), . »
  - `ch08:736` — « Les réglages de compte et la récupération éventuelle restent ceux du format décrit par SRC-01 ; »
  - `ch08:760` — « SRC-01 exclut pour l'AMRAP le circuit de séries et les séries variables… »
  - `ch13:3973` — « REC-10–15, 19–21, 27 ; ces scénarios sont prescrits, non exécutés sur un moteur livré. »
  - `docs/MATRICE-FORMATS-SEANCES-2026-10-14.md` (§2, D-357…D-369) — « Reprise dans le registre ; règles remplacées explicitement dans la spécification §12 »
- analyse : la source normative citée par ch08 renvoie à elle-même. Aucun fichier du dépôt ne porte « SRC-01 », « SRC-04 » ou « SRC-05 » comme définition (grep sur docs/, archives comprises). Les identifiants REC-01…28 cités par ch13 (CE-FMT-01…06) et ch11 n'existent pas dans ch10 §Cas de recette des formats, dont la table n'est pas numérotée. La liste des « règles remplacées explicitement dans la spécification §12 », sur laquelle reposent D-357…D-369 (MATRICE §2) et `docs/sources/formats-2026-10-14/README.md`, est inaccessible. Effets concrets : (a) les réglages de compte autorisés pour Intervalles 30/30 ne sont définis nulle part ailleurs (FMT-19) ; (b) on ne peut pas vérifier quelles règles antérieures sont remplacées, alors que le brief exige un remplacement explicite et cité ; (c) la recette CE-FMT ne peut pas être reliée.
- proposition : soit verser la spécification Formats dans `docs/` (ou `docs/sources/formats-2026-10-14/`) et corriger le lien de ch08:689, soit, si elle a été intégrée en totalité, (1) recopier dans ch07 (section Formats) la liste des règles remplacées par D-357…D-369, (2) remplacer SRC-01/04/05 par les ancres de ch08 (`#circuits`, `#pauses-composition`) ou par la règle elle-même, (3) numéroter REC-01…28 dans la table de ch10:745 et suivantes.
- statut PR/décisions : aucun ; la REVUE ne le relève pas
- touche_PRE4 : oui (textes) ; non (exigences)
- question à Hermann : la spécification Formats du 14/10 (avec ses §12 et §14.2 et ses identifiants SRC/REC) existe-t-elle hors du dépôt ? Quels réglages Intervalles 30/30 sont modifiables (nombre d'intervalles par exercice, nombre de tours, organisation) ?

### S-10 — ch10 Formats : 42 règles titrées « RM- » sans numéro, et exclusions de portée « (RM-et RM-) » illisibles
- qualification : REFERENCE_ROMPUE (masque la portée de règles générales)
- gravité : majeur
- passages :
  - `ch10:341` — « ### RM- » (répété 42 fois, ancres `fmt-01` à `fmt-42`)
  - `ch10:134` — « | RM-071 | Hors règles propres des formats (RM-et RM-), La Durée estimée d'exécution agrège… »
  - `ch10:135` — « | RM-072 | Hors règles propres des formats (RM-et RM-), Exercice : exact en Durée… »
- analyse : la numérotation des règles Formats n'a pas été produite. Les exclusions de portée de RM-071, RM-072, RM-075, RM-125 et RM-126 renvoient donc à « RM- et RM- » : la REVUE (l.19) avait restreint ces règles génériques pour les fenêtres, et cette correction tient sur une référence vide. Le lecteur ne peut pas savoir quelles règles Formats priment (EMOM N×E×W, AMRAP, Death by). MATRICE-FORMATS l.7 affirme « 42 exigences … possèdent une règle métier adressable dans le chapitre 10 », ce qui n'est vrai que par ancre, sans identifiant.
- proposition : attribuer des identifiants (par exemple RM-FMT-01…42, ou une plage RM libre) et remplacer « (RM-et RM-) » par la plage effective (par exemple RM-FMT-20…27 et 33…38 pour fenêtres, bornes et Death by).
- statut PR/décisions : aucun ; la REVUE déclare la correction faite (l.19) sans relever le trou de numérotation
- touche_PRE4 : oui (textes) ; non (exigences)
- question à Hermann : aucune (correction rédactionnelle)

### S-11 — Note Formats et ligne Circuit collées mécaniquement dans des tableaux sans rapport (tables cassées)
- qualification : AMBIGUITE_PERIMETRE
- gravité : mineur
- passages :
  - `ch09:203` — « > **Formats :** cette grille antérieure n'encode pas à elle seule l'achèvement incomplet du Death by… » (insérée au milieu de la table des attributs de Séance, avant « | Statut | État de la séance | … Active ou archivée »)
  - `ch09:377` — même note insérée avant « | Statut | Résultat de l'occurrence | … `Exécutée` ou `Non exécutée` »
  - `ch09:531` — même note au milieu de la table des attributs d'Exécution
  - `ch08:1472` — « | Circuit | Conteneur unique ; nature tours/séries… » dans la table « Catalogue de séances — Champs affichés » (doublon de ch08:1506)
- analyse : un remplacement automatique a placé la note Death by devant chaque ligne commençant par « | Statut », y compris le statut Active/Archivée d'une Séance et le statut d'une occurrence planifiée, qui n'ont aucun rapport avec l'achèvement d'une exécution. La citation en bloc coupe chaque tableau : les lignes suivantes (Statut, Date de création, Date d'archivage…) se retrouvent sans en-tête et s'affichent comme une table malformée. Le même mécanisme a ajouté la ligne Circuit de la Composition dans la table du Catalogue de séances.
- proposition : ne garder la note que dans ch09 §Exécution, placée hors de la table (avant ou après), et la retirer des tables Séance (l.203) et occurrence (l.377). Retirer ch08:1472.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : aucune

### S-12 — Glossaire de planification : « Aucune » et « hebdomadaire seulement » contredisent D-330
- qualification : CONTRADICTION_REELLE (déjà tranchée explicitement par D-330, glossaire non mis à jour)
- gravité : mineur
- passages :
  - `ch01:255` — « | **Planification unique** | … Le libellé d'interface utilisé est `Aucune` dans le choix de répétition. | »
  - `ch01:256` — « | **Planification périodique** | Routine produisant des occurrences hebdomadaires selon une fréquence en semaines… »
  - `ch08:1225` — « **L'option « Aucune » n'existe plus.** Elle appartenait à un contrôle binaire `Aucune / Périodique` qui est supprimé. »
- analyse : D-330 (ch07:527, « options Aucune/Aucun supprimées … Jour/Semaine/Mois ») et D-062, marquée « Supersédée par D-330 » (ch07:99), rendent ces deux définitions caduques. Le glossaire de ch01, qui sert de référence de vocabulaire, n'en porte aucune trace.
- proposition : réécrire ch01:255-256 selon D-330 (interrupteur Répétition ; unités Jour/Semaine/Mois ; borne jusqu'au/pendant), en renvoyant à ch08 §5.
- statut PR/décisions : remplacement explicite par D-330
- touche_PRE4 : oui (ch01 figé)
- question à Hermann : aucune

### S-13 — Durée synthétique : arrondi à la minute supérieure (RM-159) contre format min/s (ch08) et comportement PRE-3
- qualification : CONTRADICTION_REELLE
- gravité : majeur
- passages :
  - `ch10:141` — « | RM-159 | … Exprimée en secondes dans le Domaine, elle est convertie en minutes par arrondi à la minute supérieure (`Math.ceil`). »
  - `ch08:609-618` — « Une durée x, en secondes, s'écrit : … | autre | `{minutes} min {secondes} s` | 1 min 30 s | »
  - `pre4-bmad-questions-ouvertes.md:74` (P41) — « carte Catalogue « 2 min 45 s » pour 165 s »
- analyse : RM-159 impose l'arrondi `Math.ceil` pour la durée affichée sur le Catalogue et la Composition. Le format de durée de ch08 (repris par CE-UI-10 et par la Synthèse) et la carte Catalogue PRE-3 affichent minutes et secondes. Q20 a tranché pour le total partiel (≥ en min/s, sans arrondi). P41 conserve le rendu PRE-3 des totaux exacts et estimés par non-régression. RM-159 reste donc contredit par la règle appliquée, sans mention de remplacement.
- proposition : référence unique ch08 §Format d'affichage des durées. Amender RM-159 (supprimer l'arrondi ou le restreindre explicitement à un contexte nommé), et reprendre Q20/P41 dans ch10.
- statut PR/décisions : arbitré pour PRE-4 par Q20 et P41, intégration pendante dans ch10
- touche_PRE4 : oui
- question à Hermann : hors PRE-4, l'arrondi `Math.ceil` de RM-159 garde-t-il un usage, et lequel (résumé de Composition `N exercice(s) · X min` ?) ?

### S-14 — Montant affiché dans l'en-tête du Circuit : durée du Circuit ou durée de la Séance ?
- qualification : AMBIGUITE_PERIMETRE
- gravité : majeur
- passages :
  - `ch08:1506` — « | Circuit | … Total exact/≈/≥ calculé sur les passages réels, hors préparation/fin de Séance. »
  - `ch08:1509` — « | Résumé | `N exercice(s) · durée des Exercices`, placé dans l'en-tête du conteneur Circuit … la durée de Séance intègre les durées intrinsèques des Exercices ainsi que leurs récupérations… »
  - `ch10:684` — « Le Circuit produit exact si tout le travail est exact ; … Symbole préfixé au montant de l'en-tête : ≈ ou ≥, aucun symbole en exact. »
  - `docs/DSF-CIRCUITS-CONTROLES-2026-10-12.md:11` — « Le titre Circuit et l'œil sont sur la même ligne. La durée agrégée est sous le titre. »
- analyse : l'en-tête du Circuit porte un montant défini de deux façons. Dans un cas, c'est un total « sur les passages réels » du Circuit, avec un niveau Circuit qui a ses propres exact/≈/≥ (ch10:682-686). Dans l'autre, c'est une « durée de Séance » qui inclut tous les exercices et toutes les récupérations, donc aussi ceux placés avant et après le Circuit. Avec des exercices hors Circuit, les deux montants diffèrent. Il n'y a pas deux objets distincts : un seul emplacement est décrit.
- proposition : choisir une seule mesure pour l'en-tête et l'écrire dans ch10 (§Extension 12/10, niveau Circuit) avec renvoi depuis ch08 §Composition. Si la Séance entière est visée, renommer « niveau Circuit » ; sinon corriger la ligne Résumé.
- statut PR/décisions : aucun
- touche_PRE4 : oui (textes) ; à vérifier pour ED-15 (agrégation Séance/Circuit), car PRE-4 adapte l'affichage des consommateurs (Q4)
- question à Hermann : avec des Exercices avant et après le Circuit, le montant sous le titre Circuit couvre-t-il seulement le Circuit développé ou toute la Séance hors Compte à rebours et Fin ?

### S-15 — Suivi : déploiement des cartes et tri affirmés et niés dans le même chapitre
- qualification : CONTRADICTION_REELLE
- gravité : mineur
- passages :
  - `ch08:1402` — « Dans le MVP, les cartes du Suivi ont deux lignes, sans déploiement… sa présentation déployée est hors MVP . »
  - `ch08:1429` — « Chaque Exécution peut être déployée individuellement dans le MVP afin d'afficher son détail directement dans la carte. »
  - `ch08:1420` — « Le Suivi permet d'inverser l'ordre chronologique des Exécutions : »
  - `ch08:1450` — « … `Vue d'ensemble`, `Filtrer` et `Trier` restent visibles mais désactivés ; »
- analyse : §6.9 contredit §6.5, §6.11 et ch03:522 (« Aucun déploiement … de carte du Suivi »). §6.8 décrit un tri inversable, alors que RM-082 et §6.11 déclarent `Trier` désactivé. La seconde contradiction ne disparaît que si l'inversion passe par un autre contrôle que `Trier`, ce qu'aucune source ne dit.
- proposition : référence unique RM-082 et D-238 (ch03:522). Marquer ch08 §6.9 historique (hors MVP). Préciser §6.8 : tri par défaut seulement au MVP, ou inversion par un contrôle à nommer.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : au MVP, l'utilisateur peut-il inverser l'ordre du Suivi (et par quel contrôle), alors que `Trier` est désactivé ?

### S-16 — Synthèse d'une Exécution directe : bouton `Terminer` (ch03) contre `Enregistrer` (contrats)
- qualification : CONTRADICTION_REELLE
- gravité : mineur
- passages :
  - `ch03:425` — « 7. Appuyer sur `Terminer` pour enregistrer l'Exécution dans le Suivi général avec l'origine `ACTIVITY`. »
  - `ch13:192` — « Le bouton courant de Synthèse est Enregistrer ; Terminer reste le bouton de l'éditeur Exercice. »
  - `ch13:1556` (CE-T03-14) — « Shell Summary ; résumé Execution ; choix Ressenti ; Commentaire ; CTA Enregistrer. »
- analyse : même écran (Synthèse ACTIVITY) et même action. ch13 §4.12 tranche explicitement, et ch03 n'a pas été aligné.
- proposition : corriger ch03:425 en `Enregistrer`.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : aucune

### S-17 — Exécution directe : « la Récupération » listée parmi les phases, alors que les sources excluent toute récupération en direct
- qualification : AMBIGUITE_PERIMETRE
- gravité : mineur
- passages :
  - `ch03:422` — « … exécuter le Compte à rebours propre éventuel de l'Exercice, puis les Séries, Pauses, côtés, la Récupération et la Fin d'exercice éventuelle selon la définition figée. »
  - `ch10:672` — « … En direct, aucune Récupération contextuelle : PN reste exécutée. »
  - `ch11:437` — « Aucune récupération post-exercice en exécution directe. »
- analyse : si « la Récupération » désigne la Récupération après exercice, ch03 contredit ch10, ch11 et RM-036. Si elle désigne la Pause entre les côtés (`SIDE_RECOVERY`), c'est un doublon de « côtés ». Le texte ne permet pas de trancher.
- proposition : remplacer par « la Pause entre les côtés éventuelle » ou supprimer.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : aucune

### S-18 — Pause de sécurité en Durée chiffrée : deux règles voisines divergentes
- qualification : DOUBLON (divergent)
- gravité : mineur
- passages :
  - `ch10:126` — « | RM-068 | Sans interaction, une pause de sécurité intervient 30 minutes après la fin théorique d'un Exercice chronométré ou la fin nominale recalculée d'une Série cadencée. | »
  - `ch10:127` — « | RM-069 | … Répétitions chiffrées avec bip :30min après nominal recalculé. Durée chiffrée conserve ses transitions chronométrées. | »
  - `ch08:949` — « - 30 minutes après la fin théorique d'un Exercice chronométré ou la fin nominale recalculée d'une Série cadencée ; »
- analyse : RM-069 et la section Bip de ch08 (ch08:1052) ne prévoient pas de garde de 30 minutes pour la Durée chiffrée, qui « conserve ses transitions ». RM-068 et ch08 §4.9 la maintiennent. Une série chronométrée se termine automatiquement (RM-061) : on ne sait pas quand la garde de RM-068 se déclencherait, ni si elle existe encore.
- proposition : référence unique RM-069. Réécrire RM-068 en renvoi, ou préciser son cas résiduel s'il existe (par exemple point d'arrêt ou fin de plan). Aligner ch08 §4.9.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : aucune, sauf si RM-068 vise un cas que RM-069 ne couvre pas

### S-19 — Fin de création d'une Séance : « enregistrement des Catégories » (RM-024) et « quatre étapes » (ch08 §2.2)
- qualification : CONTRADICTION_REELLE
- gravité : mineur
- passages :
  - `ch10:41` — « | RM-024 | L'enregistrement des Catégories termine la création ou la modification et revient au `Catalogue des séances`, segment `S[éances]` »
  - `ch13:948` (CE-T03-08 §7) — « … Fin de séance → Continuer. Aucun Cycle visible ni étape finale Catégories. »
  - `ch08:82` — « La création d'une séance se déroule en quatre étapes successives : » (suivie de trois items, dont l'Étiquette en étape 2)
- analyse : RM-024 décrit l'ancien parcours terminé par une page Catégories, que ch13 §1 déclare retiré (« l'ancien parcours Catégories est retiré ») et que CE-T03-08 exclut. ch08 §2.2 annonce quatre étapes, en liste trois et présente l'Étiquette comme une étape séparée, alors qu'elle se choisit dans la Composition (ch08:1504, CE-T03-08).
- proposition : marquer RM-024 « historique, remplacée par RM-017 et CE-T03-08 ». Réécrire ch08 §2.2 : un écran unique, Étiquette dans la Composition, `Continuer`.
- statut PR/décisions : aucun
- touche_PRE4 : oui
- question à Hermann : aucune

### S-20 — Résultat de calcul « incomplete » (ch11) contre « pas de cinquième résultat temporel » (ch10)
- qualification : AMBIGUITE_PERIMETRE
- gravité : mineur
- passages :
  - `ch11:446` — « | Calculer le total | Plan et séries effectives | exact/estimated/lowerBound/omitted, ou incomplete | »
  - `ch10:654` — « … Une erreur de saisie est un état de validation séparé : elle ne devient pas un cinquième résultat temporel valide. »
  - `ch11:405` — « Le calcul retourne exact/estimated/lowerBound/omitted … ; aucune valeur pour omitted, erreur distincte. »
- analyse : la table des opérations de pause (antérieure au 13/10) ajoute une 5e valeur `incomplete`. ch11 §cibles typées et ch10 la refusent comme résultat et la renvoient à la validation. On ne sait pas si `incomplete` est une erreur retournée ou un résultat. H10 (pre4) suppose « aucune ligne, ✓ indisponible ».
- proposition : remplacer, à ch11:446, « ou incomplete » par « ou erreur de validation (cible à renseigner) ».
- statut PR/décisions : couvert partiellement par pre4 H10 (hypothèse)
- touche_PRE4 : oui (ED-13/14)
- question à Hermann : aucune

### S-21 — Tabata « Par exercice » : le nombre de tours est-il réglable ?
- qualification : AMBIGUITE_PERIMETRE
- gravité : mineur
- passages :
  - `ch08:722` — « Par exercice : A1…A8, puis B1…B8. La configuration illustrée comporte un circuit d'un tour … Le réglage de répétition de l'ensemble reste distinct des huit séries imposées. »
  - `ch07` D-359 — « « Séries par exercice — 8 » remplace « Circuit — 8 tours » »
  - `ch10:758` (recette) — « | Tabata A/B, par exercice, un tour | A1…A8 puis B1…B8 ; 16 efforts | »
- analyse : un « réglage de répétition de l'ensemble » est mentionné, sans être défini nulle part. Il peut s'agir du compte du Circuit (tours) modifiable en Tabata, ce qui ferait de 480 s un cas particulier et non une constante. Aucune règle ne dit s'il est réglable ni, en alternance (circuit de séries N=8), où il se placerait. Les constantes Tabata sont listées (8 séries, 20 s, 10 s), mais pas ce compte.
- proposition : dans ch08 §4.1 et CE-FMT-02, dire si le compte de tours est un réglage autorisé du format Tabata, avec sa borne, ou le figer à 1.
- statut PR/décisions : aucun ; ni R-04 ni la REVUE ne le couvrent
- touche_PRE4 : non (formats hors PRE-4)
- question à Hermann : en Tabata, l'utilisateur peut-il répéter l'ensemble (2 tours ou plus) ? Si oui, dans les deux organisations ?

### S-22 — Types de phase du Plan : énumération fermée à six valeurs, sans plusieurs phases prescrites ailleurs
- qualification : COMPLEMENT (manquant)
- gravité : mineur
- passages :
  - `ch09:676` — « | Type de phase | `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY` ou `SESSION_END` | Calculé | »
  - `ch13:175` — « | ACTIVITY | Préparation système 5 s → compte à rebours propre applicable → … → Fin propre applicable → signal de fin → Synthèse | »
  - `ch13:2719` (CE-EXEC-SESSION-01 §11) — « … récupération ; point d'arrêt ; pause utilisateur … »
- analyse : ch04:182, ch09:676 et ch12:303 énumèrent six types de phase avec « ou », donc une liste fermée. Les phases suivantes sont prescrites ailleurs sans type : attente au Point d'arrêt (« La machine distingue récupération chronométrée et attente au point d’arrêt », ch11:437), préparation système de 5 s et Compte à rebours ou Fin propres en exécution ACTIVITY, fenêtres EMOM et Death by, travail et repos résiduel. Ce n'est pas une contradiction, la liste a été écrite pour le plan SESSION libre, mais elle n'est pas complétée.
- proposition : dans ch09 (Phase de Plan), préciser que la liste vaut pour le plan SESSION libre et ajouter les types (ou leur représentation) des autres phases, ou renvoyer à ch12 §Formats.
- statut PR/décisions : PR #370 ajoute des sous-étapes « phases d'exercice », sans compléter cette liste
- touche_PRE4 : oui (textes) ; non (exigences)
- question à Hermann : aucune

---

## Vérification des écarts déjà corrigés par REVUE-COHERENCE-FORMATS (non rediagnostiqués)

| Sujet REVUE (l.15-25) | État dans les chapitres courants |
|---|---|
| Format et origine | Résolu : ch08 §3.1, ch09:1205-1206, FMT-01/02. La REVUE et la MATRICE (INT-01) citent un « chapitre 00 » qui n'existe pas (renvoi rompu mineur, probablement ch01). |
| Réglages après composition | Résolu : ch08 §3.1, FMT-04/05, CE-FMT-02/03. |
| Plan d'exécution fini/progressif | Résolu : ch01:211, ch09:655 et 687, ch12 §Formats. |
| Pause après série (09 limitait SERIES_PAUSE) | Résolu : ch09:688 « dernière comprise ». |
| Calcul/progression universels | Partiellement : les exclusions de RM-071/072/075/125/126 existent, mais renvoient à « (RM-et RM-) » (S-10). RM-077 est correctement restreinte. |
| Commandes d'exécution | Résolu : notes « Portée formats » en ch08 §4.3, §4.7, §4.10 et §6.4 ; complément CE-EXEC-SESSION-01. |
| Tour/série For time | Résolu : ch04:455, ch09:1207, ch11:417, CE-CIR-01/02/03 (compléments). |
| Death by (limite ≠ Terminée) | Résolu sur l'interdiction ; non résolu sur le statut affiché (S-02). |
| Valeur grisée | Résolu pour Formats (DSF Formats §3, FMT-17). Le double sens de « grisé » est traité par P5. |
| Fenêtre et bip | Résolu : ch08 §5 (« La durée de la fenêtre n'est pas le paramètre « Bip de cadence » »). |
| Carte modèle / carte séance | Résolu : DSF Formats §1. |
| F-01…F-04 (écarts Figma) | Toujours ouverts côté Figma ; la doc normative est correcte. Ce sont des écarts visuels, pas des règles. |
| R-01…R-05 | Toujours ouverts (voir liste ci-dessous) ; R-05 ne concerne que la couverture visuelle. |

## Limites déclarées « restant ouvertes » et vraiment ouvertes (vérifiées)

Planification (ch08 §5, CE-UI-05/11, MATRICE-PLANIFICATION l.55) :
1. Le stepper x plafonne-t-il la sélection des pastilles, ou suit-il le nombre de pastilles cochées ? (ch08:1205-1214, ch08:1313 ; CE-UI-11 §12 et §14 ; D-329). Ouvert.
2. Rangée L M M J V S D sous les unités Jour et Mois (ch08:1271-1273, 1314). Ouvert.
3. Conversion `jusqu'au` ↔ `pendant` (ch08:1265, 1316 ; D-331). Ouvert.
4. Trois écrans Programme : création, rattachement, hors période (ch08:1301-1309 ; D-332). La source Programme V1.2 est introuvable (ch08:1327). Ouvert.
5. Bornes Jour/Mois et des steppers x/n, règles de fin de mois, ancrage et origine de l'index du motif après édition, résultats et statuts d'un créneau à plusieurs contenus, archivage d'un seul contenu (ch08:1323 ; ch10:313-319 ; ch09:357). Ouverts. Le décalage de 3 px du Disclosure (point 5 de ch08:1317) est une dette visuelle, pas une règle.

Formats (ch08 §Combinaisons, REVUE R-01…R-04, ch12:1609) :
6. R-01 : Pause/Reprendre, réinitialisation, points d'arrêt et reprise système face à la fenêtre continue. Ouvert.
7. R-02 : bilatéralité dans une fenêtre EMOM ou Death by (CE-FMT-05 §17 « reste explicitement non qualifié »). Ouvert.
8. R-03 : Death by à plusieurs exercices (rang global, changement d'exercice, incrément). Ouvert.
9. R-04 : synchronisation du nombre de tours et du Volume par tour (For time, CE-FMT-02 §17), et représentation EMOM « Par exercice » sans double compte (ch08:749). Ouvert.
10. Statut affiché d'un Death by incomplet (S-02). Ouvert.
11. Progression d'un plan AMRAP ou Death by au nombre inconnu (ch12:1609). Ouvert.
12. Réglages de compte d'Intervalles 30/30 (S-09, renvoi SRC-01). Ouvert, faute de source.

Exécution et résultats :
13. Contrat de saisie et de correction des relevés À l'échec, notamment après la séance (ch08:1129 ; CE-UI-08 §5). Ouvert, avec un chantier d'écran séparé annoncé.
14. Emplacement de la mention « hérité du circuit » ou de l'astérisque sur N (ch08:514 ; DSF Circuits l.47). Ouvert, mais visuel ; le comportement est tranché.

Phases d'exercice (PR #370, non intégrée) : bornes et pas propres aux phases, arrondis extrêmes de l'adaptation proportionnelle, création sans durée préalable, phrases et cadran. Déclarés ouverts dans la PR ; non rediagnostiqués.

Limites déclarées ouvertes mais en fait fermées ou sans objet : aucune relevée dans cette dimension. Les R-01…R-05 ne sont pas des blocages globaux, ce qu'explicitent les « Clarification d'autorité » répétées à l'identique dans le DSF Formats, la REVUE, la MATRICE et ch13:4057 (quadruple DOUBLON rédactionnel, sans divergence constatée).

## Couverture

Lu en entier ou par sections complètes :
- BRIEF-COMMUN.md, pre4-bmad-questions-ouvertes.md (en entier), corps de pr370 et pr371, diff pr370 (rapport, DSF Formats, ch08 phases, ch10, ch11, ch12), diff pr371 (ch07 D-094/D-309, ch08 phrase).
- ch08 §2 (cycle de vie), §2.7-2.9, §3 (composition), §Circuits, §Placement des récupérations, §Phrase, §Formats, §4 (exécution), §Bip, §Cibles et relevés, §5 (planification), §6 (suivi), §Composition, §Synthèse, §Consultation média.
- ch10 §1-10, §Cadence, §Planification multi-contenus, §Circuits 12/10, §Formats (42 règles), §Calculs des durées, §Résultats temporels, §Cibles mixtes, §Recette Formats.
- ch13 §1-2, §4.12, CE-T03-08 (parties validation et persistance), CE-EXEC-SESSION-01, CE-UI-08, CE-UI-11, CE-FMT-05, CE-FMT-06, §Planification (4273 et suivantes), début de §Cartes et grille.
- ch07 : D-032, D-077, D-189, D-201…D-217 (lignes ciblées), D-300…D-340, Deux modes 13/10, D-357…D-369.
- ch01 glossaire (lignes Séance, Plan, Cycle, Routine, Circuit, Tour, Série, Set, planification, Death by).
- ch03 parcours 3, exécution directe, formats ; ch04 §4.4 ; ch09 (statuts, Exécution, Plan, Formats) ; ch11 §Formats, §Récupérations, §Phrase ; ch12 phases et §Formats.
- Documents racine : DSF-FORMATS-SEANCES, REVUE-COHERENCE-FORMATS, MATRICE-FORMATS (§1 survolée, §2-5 lus), DSF-CIRCUITS-CONTROLES, INVENTAIRE-DSF-CIRCUITS, MATRICE-CIRCUITS, MATRICE-PLANIFICATION, CORRECTION-PHASES-EXERCICE-SEANCE, CONCEPTION-EXECUTION-MEDIA (§1-9, 11), `docs/sources/formats-2026-10-14/README.md`.

Lu partiellement ou pas lu :
- ch06 : seules les lignes ciblées ont été lues (1620-1632, 2244-2250, galerie Formats non ouverte). Captures et images non examinées (hors règle).
- ch13 : CE-T03-01…07, 09…17, CE-MEDIA, CE-UI-01…07, 09, 10, CE-CIR-01…03 et CE-FMT-01…04 en entier non lus (seulement les compléments Formats par grep). Règles communes de l'éditeur (4067 et suivantes) non lues : relèvent de la dimension paramètres.
- ch02, ch05 non lus. ch12 en dehors des sections citées non lu. MATRICE-DSF-CIRCUITS lue par grep uniquement. DSF-INTERFACE-GENERALE : plan seulement (règles visuelles). CONTROLES-FORMATS et CORPUS-PHRASES-FORMATS (JSON) non lus. `concept-V2.md` et `inventaire-ecrans.md` (sources historiques) non lus.
- Liens et ancres non revérifiés mécaniquement (déjà dans links.tsv), sauf quand ils masquent une règle (S-09, S-10).
