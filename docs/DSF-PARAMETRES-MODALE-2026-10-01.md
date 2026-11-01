# DSF-PARAMETRES-MODALE-2026-10-01 — référence historique

**Actualisation13/10 :** [DSF Deux modes et cible À l’échec](DSF-DEUX-MODES-ECHEC-2026-10-13.md) remplace les références à trois modes et complète les roulettes, cibles et totaux. Les dispositions non concernées restent applicables.

**Actualisation du 12/10 :** [DSF Circuits et contrôles du 12/10](DSF-CIRCUITS-CONTROLES-2026-10-12.md) fait autorité sur les nouveaux contrôles de séries, la nature du circuit, les volumes et la lecture seule héritée. Les mesures datées ci-dessous ne décrivent pas les états remplacés. Les règles communes sans rapport avec ces éléments restent applicables.


**État courant06/10 :** [DSF Cadence et corrections](DSF-CADENCE-2026-10-06.md), [matrice courante](MATRICE-CADENCE-FIGMA-2026-10-06.md). Les mesures/captures datées ci-dessous restent historiques lorsqu’elles sont remplacées ; règles cartes média conservées. Cadence commune REPS et phrase unique selon paramètres v13, Phrase v1.

**Remplacé pour les paramètres, les pauses et les côtés par la cible du 02/10/2026.** Aucun résultat de conformité ancien ne certifie cette nouvelle cible.

**Mise à jour du 18/10/2026 — spécification v3.0 :**
- Remplacé pour la présentation : les présentations de la feuille des paramètres décrites par cette référence historique et par les DSF qui lui succèdent (D-413, avec D-406, D-408, D-409, D-410 et D-412 selon la ligne). Aucun contenu de l’original archivé n’est réactivé.
- Comportements : règles RM-235 à RM-250 du chapitre 10, [Charge, côtés, cadence et condition d’arrêt — règles du 18/10/2026](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#charge-côtés-cadence-et-condition-darrêt--règles-du-18102026) (décisions D-403 à D-413 du [registre](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md#parametres-execution-20261018)) ; ce DSF n’en reprend pas l’énoncé. Les valeurs des captures restent illustratives.
- Présentation nouvelle de la feuille des paramètres (D-413 ; spécification v3.0, GR-01 et PR-01 à PR-04 ; référence 402 × 874) : six blocs successifs espacés de 8 px, dans l’ordre de D-413 ; contrôles segmentés alignés à droite, titres à gauche, sans enveloppe blanche ; tableaux à fond blanc sans contour, lignes de 36 px, sans boutons +/− de tableau ; Cadence en 12 px ; ligne « De chaque côté » sur une ligne, notations d’Enchaînement à la taille standard des options sans réduction ; labels Regular, plus petits que les valeurs ; options inactives en texte gris Regular sur le fond des champs variables ; option sélectionnée selon le traitement violet existant ; saisie de la charge au clavier décimal, tableau visible au-dessus du clavier avec une marge de 12 px (D-405) ; chevrons à l’intérieur des options Variables (Type de série) et Avec (Changement de côté) (D-410) ; Durée de l’exercice avec son chevron à 12 px du libellé (D-409).
- Tokens : les valeurs correspondantes sont à relever dans Figma avant publication ; aucun nouveau token n’est défini ici.

- [Document original conservé](archives/series-variables-2026-10-02/DSF-PARAMETRES-MODALE-2026-10-01.md).
- [Spécification normative v12](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice).
- [DSF actuel](DSF-SERIES-VARIABLES-2026-10-02.md).
- [Matrice de propagation et vérification](MATRICE-SERIES-VARIABLES-2026-10-02.md).

## Défauts Profil et Récupération

La Récupération après exercice appartient directement à l’Exercice dans le modèle cible de Séance. La ligne Récupération de la modale Paramètres d’exécution est son unique accès de saisie et de modification ; la Composition affiche exactement cette même valeur, sans objet Récupération autonome ni valeur concurrente. Le bouton Pause / Ajouter un arrêt ne propose que les Points d’arrêt : aucun ajout, réglage ou retrait de récupération par Placement.

Toute valeur initialisée depuis un défaut du Profil est présentée dans son cadre à fond orange dans Paramètres d’exécution jusqu’au premier ✓ validant les paramètres de cet Exercice. La règle est générale : elle vise chaque défaut du Profil effectivement repris, pas seulement Récupération. Ouvrir ou fermer la feuille ne vaut pas validation ; ✕ annule les changements et conserve l’état antérieur. ✓ applique les valeurs et leur état validé au brouillon parent ; une réouverture après ce ✓ utilise le rendu normal. La sauvegarde définitive reste celle de la Séance ; abandonner le brouillon restaure l’état enregistré. Changer ultérieurement le Profil ne réinitialise pas les paramètres d’un Exercice existant. Les constantes imposées par un Format ne sont pas des défauts Profil. Le fond orange n’altère ni la valeur ni les règles de calcul, ni les couleurs du texte éditable/verrouillé. Le contrôle de durée existant est réutilisé ; aucun nouveau composant.
