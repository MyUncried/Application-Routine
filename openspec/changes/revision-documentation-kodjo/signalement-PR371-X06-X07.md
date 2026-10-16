# Signalement au chantier propriétaire de la PR #371 — écarts X-06 et X-07

**Objet :** à transmettre au chantier qui porte la PR #371 (`docs/clarifications-q11-q18-20261016`, tête `2c050d0e`, brouillon). Ce clone **ne modifie pas** la PR.

**Statut :** texte prêt. **Non publié** sur GitHub : un commentaire de PR est une communication externe, qui attend l'accord de Hermann (voir la réponse de session).

---

**Texte proposé :**

> Deux passages de la PR #371 s'écartent des décisions de Hermann du 16/10, préparation PRE-4 BMAD (fichier `docs/preparation/PRE-4/bmad/questions-ouvertes.md` du clone PRE-4).
>
> 1. **X-06 — texte d'abandon en création (Q18).**
>    - Décision Q18 : « Création : « Abandonner la création ? » / « Les informations saisies seront perdues et l'exercice ne sera pas créé. » ».
>    - PR #371 (ch. 13, CE-T03-04) : « Création : « Abandonner la création ? » / « L’exercice ne sera pas créé. » ».
>    - Le second texte est raccourci par rapport à la décision.
> 2. **X-07 — sélecteur de cible en Répétitions (Q8).**
>    - Décision Q8 : « **Roulette native à une colonne** : l'option échec en tête, puis 1 à 100. Elle remplace, pour la cible, le stepper en ligne de ch. 13 l. 125, ch. 06 l. 186 et 2199, D-219 et ch. 08 l. 1559 et 1573. »
>    - PR #371 (ch. 08, réécriture de la l. 1573) : « Séries `1..99` et Répétitions `1..100` utilisent des steppers ».
>    - La phrase réécrite conserve le stepper que Q8 remplace pour la cible.
>
> 3. **Q17** — Les six contrats de cartes (« Durée et symbole viennent du calcul commun… ») reprennent ≥ et la durée omise, mais pas « le résumé des séries n’affiche jamais « 0 s » ni « 0 rép. » ».
> 4. **Q21 (X-05)** — « Le pied ± de cible Durée utilise un pas de 5 s » ne dit pas que la valeur ancienne hors grille va au multiple de 5 s voisin, ni la position d’ouverture de la roulette.
> 5. **Q25** — Côté DSF Deux modes (« À l’ouverture : … »), le cas d’une cible à renseigner manque : la roulette s’ouvre sur la plus petite valeur valide, sélectionnée (00:05 ou 1) ; rien n’est appliqué avant le ✓ ; ✕ laisse la cible à renseigner.
>
> Depuis le 16/10, D-385 donne à ces décisions PRE-4 une portée générale KODJO, sauf restriction explicite.

*Points 3 à 5 ajoutés le 16/10, d'après le dossier AR4 (constats de la livraison des arbitrages).*

---

**Preuves :**
- extraits de la PR : `git diff 6656fefc...origin/docs/clarifications-q11-q18-20261016`, ch. 13 (ligne `+… Création : « Abandonner la création ? » / « L’exercice ne sera pas créé. »`) et ch. 08 (ligne `+Dans CE-UI-10, … Séries \`1..99\` et Répétitions \`1..100\` utilisent des steppers …`) ;
- textes de Q8 et Q18 : copie du fichier de décisions PRE-4 lue le 16/10 à 17:31 (SHA-256 `ceadbee3…`), identique sur ces deux lignes à la version committée `e0e8ce58` du clone PRE-4 ;
- constats d'origine : [constats/X-exercice.md](constats/X-exercice.md), X-06 et X-07 ; analyse : [constats/arbitrages/F-fonctionnel.md](constats/arbitrages/F-fonctionnel.md), Q-L.
