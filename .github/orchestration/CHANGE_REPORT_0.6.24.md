# Change report — KODJO Protocol V2 0.6.24

## Objet

Débloquer V2-BILAT-01 sans élargir le droit de modification et sans ajouter de boucle de revue.

## Correction minimale

- Le paquet immuable définit les fichiers restaurés ; `scope_allow` continue de limiter les seules mutations de la correction.
- Une empreinte avant/après distingue les fichiers seulement restaurés des fichiers réellement retouchés.
- Les chemins déclarés par le manifeste doivent correspondre exactement au patch.
- Le diagnostic conserve séparément les deux périmètres et les mutations constatées.
- La planification lie la documentation courante sur `main` au HEAD exact de la PR applicative ouverte analysée.
- Le bootstrap V2-BILAT-01 référence les empreintes documentaires courantes et le HEAD applicatif de la PR #131.

## Effets

La famille d'échec du run `34851607031` devient admissible quand la migration est certifiée, tout en refusant une mutation hors du scope correctif. Aucun fichier applicatif n'est modifié. Aucune revue supplémentaire n'est créée. La qualification complète Linux/Windows reste requise parce que le superviseur de reprise et les workflows de planification exécutables changent.
