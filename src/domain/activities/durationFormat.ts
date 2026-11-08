/**
 * PRE-4 (story 2.2, AC1, AD-5, FR-17-01, H8) — formateur unique d'une durée
 * d'Exercice en minutes et secondes.
 *
 * Fonction pure, sans dépendance hors du domaine. `formatPhraseDuration` est
 * déplacée telle quelle depuis `executionPhrase.ts` (`[ADOPTED]`) : la Phrase,
 * la Feuille, la carte Catalogue (par `totalClauseAmount`) et
 * `formatCompactDuration` (Composition) l'importent ; aucun autre module ne
 * formate une durée d'Exercice en minutes et secondes. Au-delà de 59 min, les
 * minutes continuent sans heures (H8). Exempté du lexique (AD-11).
 */

/**
 * Durée affichée, dans toute l'application : « M′SS″ » ou « S″ » (`formatPrimeDuration`, ci-dessous) — spécification de Hermann du
 * 08/11/2026 (« Durées au format `M′SS″`, ou `S″` sous une minute, partout ») ; Hermann, 08/11/2026 au soir : « Et tu dois encore modifier le format des durées. » ; « Partout veut bien dire partout ». Aucune heure : au-delà de 59 minutes, les
 * heures s'affichent « Hh MM′ » (Hermann, 08/11/2026 au soir : « Il y a les heures aussi » ; « 75 minutes doit s’afficher 1h 15´ » ;
 * notation détaillée À CLARIFIER, voir `formatPrimeDuration`).
 * [« X min Y s » / « X min » / « Y s » ; minutes sans heures au-delà de 59 min (H8) — remplacés le 08/11/2026 au soir.]
 */
export function formatPhraseDuration(totalSeconds: number): string {
  return formatPrimeDuration(totalSeconds);
}

/**
 * Durées des Formats d'entraînement (spécification de Hermann du 08/11/2026, A §1 et B §1 : « Durées au format `M′SS″`, ou `S″` sous
 * une minute, partout » ; récapitulatif puis, le 08/11/2026 au soir, questionnaire : « Et tu dois encore modifier le format des
 * durées. ») : à partir d'une minute « M′SS″ » (minutes sans zéro initial, secondes sur 2 chiffres, aucun espace : 1′00″, 6′00″,
 * 22′39″) ; moins d'une minute, secondes seules (30″, 5″). Prime U+2032 et double prime U+2033, jamais d'apostrophe ni de guillemet
 * droit. À partir d'une heure (Hermann, 08/11/2026 au soir : « Il y a les heures aussi » ; « 75 minutes doit s’afficher 1h 15´ ») :
 * « Hh MM′ » — heures sans zéro initial, « h », espace insécable U+00A0, minutes sur 2 chiffres et prime U+2032 (1h 15′, 1h 05′,
 * 2h 00′) ; secondes non nulles à la suite, sans espace (1h 15′30″), sans arrondi (D-391). À CLARIFIER avec Hermann : minutes sur
 * 2 chiffres, secondes au-delà d'une heure, espace insécable, prime U+2032 pour l'accent aigu tapé « ´ ». [« HhMM′SS″ » (proposition
 * du 08/11/2026 au soir) — remplacé le même soir.]
 */
export function formatPrimeDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  if (hours > 0) return `${hours}h\u00A0${pad(minutes)}′${rest > 0 ? `${pad(rest)}″` : ""}`;
  return minutes === 0 ? `${rest}″` : `${minutes}′${pad(rest)}″`;
}

/**
 * Durée lue par VoiceOver (08/11/2026 au soir) : les primes ne se lisent pas ; « 1 heure 5 minutes 30 secondes », « 1 minute 30
 * secondes », « 2 minutes », « 45 secondes ». Les unités nulles sont omises (sauf « 0 seconde »).
 */
export function spokenDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const unit = (value: number, one: string, many: string) => `${value} ${value > 1 ? many : one}`;
  const parts = [
    hours > 0 ? unit(hours, "heure", "heures") : null,
    minutes > 0 ? unit(minutes, "minute", "minutes") : null,
    rest > 0 ? unit(rest, "seconde", "secondes") : null,
  ].filter((part): part is string => part !== null);
  return parts.length === 0 ? unit(0, "seconde", "secondes") : parts.join(" ");
}

/** Remplace, dans un libellé d'accessibilité, chaque durée « M′SS″ » / « S″ » par sa forme lue (`spokenDuration`). */
export function spokenDurations(text: string): string {
  return text
    .replace(/(\d+)h\u00A0(\d{2})′(?:(\d{2})″)?/gu, (_, hours: string, minutes: string, seconds: string | undefined) =>
      spokenDuration(Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds ?? 0)),
    )
    .replace(/(\d+)′(\d{2})″/gu, (_, minutes: string, seconds: string) => spokenDuration(Number(minutes) * 60 + Number(seconds)))
    .replace(/(\d+)″/gu, (_, seconds: string) => spokenDuration(Number(seconds)));
}
