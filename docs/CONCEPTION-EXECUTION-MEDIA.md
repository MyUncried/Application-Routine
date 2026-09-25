# Conception de synthèse — Médias pendant l’Exécution

Date de conception : 25 septembre 2026  
Baseline documentaire de départ : `main@5be88b695771566459fdcba61441cfeae7bce284`  
Décision de conception : **D-203**  
Statut fonctionnel : **conception validée**  
Statut roadmap : **version à planifier ; le périmètre MVP actuel n’est pas étendu par ce document**.

## 1. Objet

Permettre à l’utilisateur de consulter les images et vidéos associées à l’Exercice en cours sans perdre le contexte ni le contrôle de l’Exécution.

Cette évolution introduit une carte d’Exécution à deux faces :
- **face Information** : informations d’Exécution ;
- **face Média** : média de l’Exercice.

La consultation du média ne suspend pas l’Exécution et ne modifie pas le Plan d’Exécution.

## 2. Évidences Figma

Figma courant — page `Prototype MVP` (`510:101`) :
- `4997:6015` — **Test 2 Exécution d’une séance — Initial — Bascule (info)** ;
- `4997:6113` — **Test 2 Exécution d’une séance — Initial — Bascule (média)** ;
- `5009:6069` — **Test 2 Exécution d’une séance — Média plein écran**.

Ces frames matérialisent les états visuels. Les règles fonctionnelles ci-dessous proviennent des décisions de conception validées ; un détail purement graphique de Figma n’est pas transformé en règle métier.

## 3. Bascule Information / Média

- Le bouton de changement de face est placé en haut à droite de la carte concernée.
- Son icône représente un **changement de face**.
- Le bouton n’est affiché que si l’Exercice possède au moins un média.
- L’appui déclenche un **retournement 3D horizontal**.
- Information → Média et Média → Information utilisent des sens de rotation opposés.
- Le changement de face s’effectue uniquement avec ce bouton ; le swipe horizontal n’est pas utilisé pour retourner la carte.
- Le bouton reste visible sur la face Média, au même emplacement fonctionnel.
- Les deux faces occupent la même zone et leur bascule ne doit pas déplacer le reste de l’écran.

## 4. Mémoire de l’état pendant une séance

La mémorisation est limitée à la séance d’Exécution courante :
- pour chaque Exercice déjà affiché, KODJO mémorise la dernière face utilisée ;
- si la dernière face était Média, KODJO mémorise également le média courant ;
- lorsqu’on revient sur cet Exercice dans la même séance, ces deux états sont restaurés ;
- entre deux séances, l’état est réinitialisé : la face Information est affichée par défaut.

Cet état est transitoire et ne constitue pas une préférence utilisateur persistante.

## 5. Galerie média

- Les médias sont présentés dans **l’ordre exact défini dans la galerie de l’Exercice**, sans réordonnancement par type.
- Un seul média est visible à la fois.
- Le passage au média précédent ou suivant se fait par **swipe horizontal simple, de type Tinder**.
- Un geste ne change que d’un seul média.
- Des indicateurs de pagination discrets signalent le nombre de médias et la position courante.
- La galerie n’est pas circulaire.
- Au premier ou au dernier média, un swipe au-delà de la borne produit un léger effet de résistance puis revient sur le même média.
- Image et vidéo sont affichées intégralement en conservant leur ratio ; aucun recadrage ne doit couper le contenu. Des marges sont admises.

## 6. Vidéo

- Une vidéo ne démarre jamais automatiquement lorsqu’elle apparaît dans la galerie.
- Elle présente un état fixe / poster avant lecture.
- La lecture démarre uniquement après une action explicite de l’utilisateur.
- La vidéo se lit directement dans la face Média.
- Le son de la vidéo est actif par défaut.
- L’Exécution continue normalement pendant la lecture : chrono, progression, transitions, Série et Tour ne sont pas suspendus.
- Lors d’une annonce vocale KODJO, le volume de la vidéo est temporairement abaissé puis restauré après l’annonce.
- Si l’utilisateur retourne sur la face Information pendant la lecture, la vidéo est mise en pause. Un retour immédiat sur la face Média, sans avoir quitté l’Exercice, permet de reprendre la lecture.
- Si l’utilisateur quitte l’Exercice puis y revient plus tard dans la même séance, la face et le média sont restaurés mais la vidéo ne redémarre pas automatiquement ; une nouvelle action Lecture est requise.
- Un swipe vers un autre média met en pause la vidéo en cours ; le média atteint ne démarre pas automatiquement.

## 7. Plein écran média

Un appui simple sur le média ouvre le mode plein écran.

Règles :
- images et vidéos peuvent être affichées en plein écran ;
- le média reste affiché intégralement, ratio conservé ;
- l’orientation suit l’appareil et peut passer en paysage si l’utilisateur le tourne ;
- la rotation n’est pas forcée ;
- fermer le plein écran revient à la face Média sur le même média ;
- pour une vidéo, les contrôles plein écran sont limités à **Lecture/Pause**, **barre de progression** et **Fermer** ;
- l’Exécution continue pendant le plein écran.

## 8. Cadre flottant d’Exécution en plein écran

Le plein écran affiche un cadre flottant superposé au média afin de conserver le suivi et le contrôle de l’Exécution.

Il présente au minimum :
- nom de l’Exercice ;
- côté courant lorsqu’il est applicable ;
- chrono courant ;
- Série courante / total ;
- Tour courant / total ;
- commandes principales d’Exécution visibles dans le modèle Figma ;
- commandes son / vocal de l’Exécution.

Le cadre flottant et les contrôles du lecteur média sont deux couches fonctionnelles distinctes :
- le cadre flottant pilote et renseigne l’Exécution ;
- la barre média pilote uniquement la consultation du média.

## 9. Fin d’Exercice et transitions

Si l’Exercice courant se termine alors que la face Média ou le plein écran est actif :
- le média de l’Exercice terminé est fermé ;
- le mode plein écran est fermé le cas échéant ;
- le moteur poursuit sa transition normale vers l’étape suivante ;
- aucun média de l’Exercice précédent ne reste affiché.

## 10. Média indisponible

Si un média référencé ne peut pas être chargé ou lu :
- la face Média reste disponible ;
- un état d’erreur discret est affiché à la place du média concerné ;
- l’Exécution continue ;
- la navigation vers les autres médias reste disponible ;
- KODJO ne masque pas silencieusement le média défaillant et ne force pas le retour à la face Information.

## 11. Modèle fonctionnel et données

L’évolution s’appuie sur la collection ordonnée de médias associée à l’Exercice.

Elle ajoute uniquement un **état d’interface transitoire de l’Exécution** :
- face courante ;
- index du média courant ;
- état de lecture de la vidéo courante.

La face et l’index sont mémorisés pendant la séance courante uniquement. Ils ne sont pas persistés comme préférence durable et ne modifient ni les Instantanés d’Exécution ni les résultats historiques.

## 12. Contraintes techniques attendues

Sans imposer une bibliothèque particulière, l’implémentation devra garantir :
- lecture image/vidéo locale compatible avec l’architecture média existante ;
- conservation de l’ordre des médias ;
- animation 3D de bascule sans effet sur le moteur ;
- état de galerie borné et déterministe ;
- pause/reprise vidéo conforme aux transitions d’interface ;
- audio ducking pendant les annonces vocales KODJO ;
- plein écran avec rotation autorisée ;
- cadre flottant alimenté par l’état courant du moteur d’Exécution ;
- fermeture automatique du plein écran lors du changement d’Exercice.

## 13. Périmètre produit

La documentation active antérieure classe la gestion fonctionnelle de plusieurs médias comme **post-MVP**. La présente conception ne change pas ce classement : elle définit la cible fonctionnelle et UX de l’évolution, sans décider de sa tranche de livraison.

Toute entrée dans le MVP ou dans une tranche précise exige une décision de roadmap distincte.

## 14. Critères de validation fonctionnelle

La conception est satisfaite lorsque :
1. aucun bouton de bascule n’apparaît sans média ;
2. la face Information est l’état initial d’une nouvelle séance ;
3. face et média courant sont mémorisés uniquement pendant la séance ;
4. le swipe change exactement d’un média ;
5. l’ordre de galerie est respecté ;
6. les bornes ne bouclent pas ;
7. une vidéo n’autodémarre jamais ;
8. le retour Information met une vidéo en pause ;
9. les annonces vocales restent intelligibles grâce à la baisse temporaire du volume vidéo ;
10. le plein écran conserve l’Exécution active et affiche le cadre flottant ;
11. la fin de l’Exercice ferme le média de l’Exercice terminé ;
12. un média défaillant n’interrompt ni l’Exécution ni la navigation vers les autres médias.
