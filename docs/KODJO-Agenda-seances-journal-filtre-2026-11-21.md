# KODJO — Agenda centré sur les Séances, Journal et filtre — décisions du 21/11/2026

**Statut : décisions fonctionnelles validées en conversation ; intégration documentaire en cours ; développement non demandé.**
**Référence UX de l'Agenda : maquette validée par Hermann, transmise le 21/11/2026 (capture iPhone « Agenda », lundi 16 novembre).** Figma fait foi pour le rendu réel ; ne pas redessiner l'Agenda.
**Sources préexistantes :** D-522, D-533 à D-540, CE-UI-15, DSF Agenda et DSF Journal (19–20/11/2026), modèle des occurrences et Exécutions (migration 033).
**Prévalence :** les décisions ci-dessous remplacent uniquement les règles antérieures incompatibles sur la présentation par Routine, les noms obligatoires/uniques et le rattachement des Exécutions. Les règles non contradictoires d'exécution, de rattrapage, de suppression et de récurrence sont conservées.

## 1. Identités et écrans

- **Séance** : contenu exécutable, nom unique (règle existante conservée). Une Exécution correspond à une Séance et garde son instantané historique.
- **Routine** : planification avec identité technique stable, un ou plusieurs contenus Séance ordonnés, créneaux et récurrence. Son nom n'a plus de contrainte d'unicité ; deux Routines peuvent porter le même nom.
- **Parcours** : présentation et enchaînement d'une Routine comprenant plusieurs Séances, pas une Exécution autonome ni un statut d'exécution agrégé.
- **Journal** : une carte compacte par Routine, active ou terminée ; son nom de Routine est visible, avec Ⓟ si Parcours ; déploiement pour voir les Séances. Pas de multiplication en lignes de Séances dans la carte repliée.
- **Agenda** : une carte par Séance, planifiée ou exécutée, y compris les Exécutions sans planification. Le titre est toujours le nom de la Séance, jamais le nom personnalisé de la Routine. Un Parcours ajoute une seule ligne d'en-tête compacte « Ⓟ Nom du parcours » immédiatement au-dessus de la première carte, et un rail vertical sans numéros reliant ses cartes. Pas de cadre, compteur, durée ni autre symbole dans la ligne Parcours. Une Routine à une Séance n'a ni ligne Ⓟ ni rail.
- **Déploiement de carte Agenda** : seulement le contenu de composition de la Séance ; ne pas répéter son nom. Conserver un format de carte unique pour toutes les Séances, y compris celles d'un Parcours.

## 2. Nom des Routines

- À la création, nom par défaut : nom de la Séance si une seule ; noms des Séances dans leur ordre séparés par « + » si plusieurs.
- Le nom par défaut non personnalisé suit les changements de composition ; le nom renommé explicitement par l'utilisateur reste stable.
- Un renommage de Routine se voit dans le Journal et dans le filtre, mais pas dans le titre des cartes de l'Agenda (toujours la Séance).
- Les doublons de noms de Routines sont autorisés. L'unicité des noms de Séances reste inchangée.
- **À préciser dans le modèle technique** : mécanisme explicite distinguant nom généré et nom personnalisé, y compris pour les Routines existantes ; ne pas inférer ce mode d'un simple test d'égalité textuelle.

## 3. Heures, dates, durées et statuts

- Séance non exécutée et seule dans sa Routine : heure du créneau prévue.
- Parcours non commencé : première Séance = heure prévue du créneau ; à partir de la deuxième Séance non commencée, afficher un trait horizontal « — » dans la zone heure, **jamais un vide ni une heure calculée**.
- Toute Séance exécutée : afficher l'heure **réelle de démarrage** ; la repositionner dans l'Agenda à la date et à l'heure réelles, même si elles diffèrent du créneau initial. Conserver séparément la date/heure planifiée pour la traçabilité.
- La durée estimée reste affichée pour les Séances non exécutées ; pour les Séances exécutées, afficher la durée réelle conformément aux données de l'Exécution.
- Statut par Séance uniquement (complétée, partielle, arrêtée, non commencée, rattrapable, expirée selon règles applicables) ; aucun statut d'exécution propre au Parcours. Ne pas compter le Parcours comme une Exécution.
- Le rail indique l'appartenance à une même occurrence de Parcours, non son achèvement.

## 4. Rattachement des Exécutions lancées hors Agenda

- Une Exécution démarrée depuis l'Agenda conserve son rattachement explicite au créneau et, pour un Parcours, son rang ; l'enchaînement actuel est conservé, sans changement de moteur.
- Une Exécution lancée hors Agenda d'une Séance **hors Parcours** se rattache automatiquement si la même Séance est planifiée le même jour dans un créneau non commencé **et non expiré**. Si plusieurs créneaux éligibles existent, choisir celui dont l'heure prévue est la plus proche de l'heure de lancement ; à égalité, le plus ancien. Un créneau expiré ne reçoit jamais d'Exécution.
- Sinon, afficher une carte « Hors planification » à l'heure réelle. Plusieurs Exécutions de la même Séance restent distinctes et ne se remplacent pas.
- **Exception validée :** une Séance appartenant à un Parcours, lancée directement hors Agenda, est **Hors planification**, sans rattachement automatique au Parcours, même si ce Parcours est prévu le même jour. Elle ne marque aucun rang du Parcours comme exécuté et ne déclenche pas ses autres Séances. Le lancement ultérieur du Parcours garde sa séquence complète actuelle.
- **À CLARIFIER** : lorsqu'une même Séance est à la fois planifiée seule et présente dans un Parcours le même jour, la règle de priorité entre le créneau autonome et l'exception Parcours doit être confirmée avant développement ; ne pas rattacher silencieusement à un Parcours.
- Une Exécution historique garde le nom et la composition instantanés de la Séance, indépendamment de son renommage, archivage ou suppression ultérieurs.

## 5. Filtre de l'Agenda et Journal

- **Liste de choix du filtre à redessiner** : une ligne par élément planifié, soit une Routine à Séance unique (représentée par le nom de sa Séance), soit un Parcours (Ⓟ et nom de Routine). Reprendre le principe de la carte compacte du Journal : **une ligne par Routine**, jamais une ligne par Séance d'un Parcours.
- La liste peut afficher plusieurs lignes de même nom (doublons de Routine autorisés) ; chaque sélection est liée à l'identifiant stable de la Routine, jamais à son libellé.
- Sélection multiple : les occurrences correspondant aux éléments choisis s'affichent, sans doublons ; sélectionner un Parcours montre toutes les Séances de ses occurrences et le rail ; les Exécutions libres sont masquées lorsque ce filtre sur les planifications est actif, visibles en l'absence de filtre.
- Le Journal conserve les états active/terminée, les créneaux, actions et protections déjà décidés (D-535 à D-540) ; le changement demandé concerne la représentation et la cohérence avec le filtre.
- **À CLARIFIER** : si la liste de choix doit contenir seulement les planifications encore actives ou aussi les terminées ; déterminer l'accès aux occurrences historiques lors d'un filtrage.

## 6. Figma et limites de modification

- **Agenda : déjà réalisé et validé dans Figma par Hermann** ; conserver son rendu (capture du 21/11/2026) et ne corriger que des écarts démontrés, après accord. Référence Figma : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`.
- **Journal et filtre Agenda : non revus pour cette évolution** ; lire leurs nodes actuels et ajuster seulement les représentations, la ligne compacte Ⓟ et les choix de filtre. Réutiliser le DSF, composants et styles existants.
- Ne pas transformer le dessin de la capture en règle technique. Les choix d'interaction non arbitrés sont « À CLARIFIER ».

## 7. Impacts transverses et recette

- **Registre** : superséder les seules clauses contradictoires de D-522 (nom obligatoire/unique), D-533 (carte par Routine), D-534 (une carte par occurrence, statut global), D-535/D-539 (libellés Journal/filtre), tout en conservant l'enchaînement D-534 et la protection des occurrences D-536–D-540.
- **Modèle / données** : nom généré vs personnalisé ; lien Exécution–occurrence optionnel ; distinction Exécution hors planification ; historique et horodatage réel.
- **API / architecture** : déterminer la stratégie de rattachement automatique et de lecture de toutes les Exécutions sans supposer que la migration 033 couvre les Exécutions libres.
- **Tests attendus** : créneaux multiples, expirés, double Exécution, Parcours direct, ordre et heure réels, passage minuit, noms identiques, renommage, historique après suppression, filtre mixte, absence de doublon, trait « — », rail et statut individuel.
- **Ne pas développer** dans cette mission documentaire ; Claude devra faire une revue indépendante avant toute implémentation.

## 8. Questions non arbitrées à ne pas inventer

1. Une Séance appartenant à un Parcours et aussi planifiée seule le même jour : rattachement possible au créneau autonome ?
2. Lorsqu'un Parcours est exécuté sur une longue période ou traverse minuit, faut-il scinder visuellement le rail pour préserver l'ordre chronologique strict ? La capture validée ne démontre pas ce cas.
3. Portée du filtre pour les Routines terminées et leurs occurrences historiques.
4. Présentation du nom de Routine généré après modification d'une occurrence individuelle (qui peut différer de la composition générale).
