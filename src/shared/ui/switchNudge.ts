/**
 * Recette du 11/11/2026 (Profil, z2) puis du 17/11/2026 (Planification, Hermann : « aligner verticalement l’interrupteur
 * avec le texte "Répétition" », « Aligner verticalement les interrupteurs avec leur titre de section ») : le dessin de
 * l’interrupteur iOS apparaît plus haut que son cadre centré ; correction commune vers le bas.
 */
export const switchNudge = { transform: [{ translateY: 7 }] } as const;
