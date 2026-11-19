/**
 * Textes des notifications de rappel de séance — « KODJO — Notifications de rappel de séance : spécification
 * éditoriale et technique » (18/11/2026), fournie par Hermann à la recette du 19/11/2026 (t6) :
 * - titre : accroche du catalogue (30 caractères au plus), sans point final ; pas de sous-titre, pas de photo ;
 * - corps : commence toujours par le nom réel et complet de la séance ; si le complément fait dépasser 40 caractères,
 *   le corps est le nom complet seul — jamais tronqué par l'application ;
 * - choix par familles éligibles, en rotation déterministe, sans répéter un même modèle sur deux notifications
 *   consécutives ; GEN toujours éligible.
 *
 * Mise en œuvre (à confirmer, voir le rapport de mission) :
 * - Familles non retenues faute de donnée : RESTART et FIRST (supposent de savoir si une occurrence a été réalisée ou
 *   manquée — lien occurrence ↔ Exécution absent, D-525) ; PROGRAM (aucune notion de programme dans KODJO).
 * - Rotation « déterministe et persistée » : dérivée du rang de l'occurrence dans sa routine (identique à chaque
 *   reprogrammation, sans nouvelle persistance) ; ordre de départage de la spécification : RECUR / SINGLE, CAT-*, jour,
 *   moment, GEN.
 * - Nom : celui de la routine (D-522) ; une routine sans nom (antérieure au 18/11/2026) prend le nom de sa première séance.
 */

export type ReminderFamily =
  | "GEN"
  | "SINGLE"
  | "RECUR"
  | "MON"
  | "MIDWEEK"
  | "FRI"
  | "SAT"
  | "SUN"
  | "MORNING"
  | "LUNCH"
  | "AFTERNOON"
  | "EVENING"
  | "NIGHT"
  | `CAT-${string}`;

export type ReminderTemplate = { readonly id: string; readonly family: ReminderFamily; readonly title: string; readonly body: string };

/** Marque du nom dans les corps du catalogue. */
const NAME = "{nom}";
export const REMINDER_TITLE_MAX = 30;
export const REMINDER_BODY_MAX = 40;

/** Catalogue de la spécification (§ 3), hors FIRST, PROGRAM et RESTART (non éligibles, voir l'en-tête). */
export const REMINDER_TEMPLATES: readonly ReminderTemplate[] = [
  { id: "GEN-01", family: "GEN", title: "Un défi t’attend", body: `${NAME} : c’est maintenant !` },
  { id: "GEN-02", family: "GEN", title: "Chaque séance compte", body: `${NAME} t’attend.` },
  { id: "GEN-03", family: "GEN", title: "À toi de jouer", body: `${NAME} : c’est parti !` },
  { id: "GEN-04", family: "GEN", title: "Allez, on s’y met", body: `${NAME} est prête.` },
  { id: "SINGLE-01", family: "SINGLE", title: "Un défi t’attend", body: `${NAME} : c’est maintenant !` },
  { id: "SINGLE-02", family: "SINGLE", title: "Tout est prêt", body: `${NAME} t’attend.` },
  { id: "SINGLE-03", family: "SINGLE", title: "Allez, on s’y met", body: `${NAME} est prête.` },
  { id: "RECUR-01", family: "RECUR", title: "On garde le rythme", body: `${NAME} t’attend.` },
  { id: "RECUR-02", family: "RECUR", title: "La régularité compte", body: `${NAME} : c’est le moment !` },
  { id: "RECUR-03", family: "RECUR", title: "Une séance de plus", body: `${NAME} t’attend.` },
  { id: "MON-01", family: "MON", title: "On lance la semaine", body: `${NAME} t’attend.` },
  { id: "MON-02", family: "MON", title: "Une semaine qui bouge", body: `${NAME} : c’est parti !` },
  { id: "MIDWEEK-01", family: "MIDWEEK", title: "On garde l’élan", body: `${NAME} t’attend.` },
  { id: "MIDWEEK-02", family: "MIDWEEK", title: "Un moment pour bouger", body: `${NAME} : c’est le moment !` },
  { id: "FRI-01", family: "FRI", title: "On finit en mouvement", body: `${NAME} t’attend.` },
  { id: "FRI-02", family: "FRI", title: "On termine bien la semaine", body: `${NAME} : c’est parti !` },
  { id: "SAT-01", family: "SAT", title: "Le week-end, on bouge", body: `${NAME} t’attend.` },
  { id: "SAT-02", family: "SAT", title: "À toi de jouer ce samedi", body: `${NAME} : c’est le moment !` },
  { id: "SUN-01", family: "SUN", title: "Un dimanche actif", body: `${NAME} t’attend.` },
  { id: "SUN-02", family: "SUN", title: "Un moment pour toi", body: `${NAME} : c’est parti !` },
  { id: "MORNING-01", family: "MORNING", title: "On démarre en mouvement", body: `${NAME} t’attend.` },
  { id: "MORNING-02", family: "MORNING", title: "Un bon départ", body: `${NAME} : c’est le moment !` },
  { id: "LUNCH-01", family: "LUNCH", title: "La pause qui fait du bien", body: `${NAME} t’attend.` },
  { id: "LUNCH-02", family: "LUNCH", title: "Place au mouvement", body: `${NAME} : c’est parti !` },
  { id: "AFTERNOON-01", family: "AFTERNOON", title: "Un peu d’énergie", body: `${NAME} t’attend.` },
  { id: "AFTERNOON-02", family: "AFTERNOON", title: "À toi de jouer", body: `${NAME} : c’est le moment !` },
  { id: "EVENING-01", family: "EVENING", title: "On finit sur une bonne note", body: `${NAME} t’attend.` },
  { id: "EVENING-02", family: "EVENING", title: "Un moment rien qu’à toi", body: `${NAME} : c’est le moment !` },
  { id: "NIGHT-01", family: "NIGHT", title: "À ton rythme", body: `${NAME} t’attend.` },
  { id: "CAT-RENFO-01", family: "CAT-RENFO", title: "On gagne en force", body: `${NAME} t’attend.` },
  { id: "CAT-RENFO-02", family: "CAT-RENFO", title: "Prêt à te renforcer", body: `${NAME} : c’est parti !` },
  { id: "CAT-CARDIO-01", family: "CAT-CARDIO", title: "On fait monter le rythme", body: `${NAME} t’attend.` },
  { id: "CAT-CARDIO-02", family: "CAT-CARDIO", title: "On active le cardio", body: `${NAME} : c’est parti !` },
  { id: "CAT-MOBILITE-01", family: "CAT-MOBILITE", title: "On retrouve de l’aisance", body: `${NAME} t’attend.` },
  { id: "CAT-MOBILITE-02", family: "CAT-MOBILITE", title: "Bouger plus librement", body: `${NAME} : c’est le moment !` },
  { id: "CAT-ETIREMENTS-01", family: "CAT-ETIREMENTS", title: "On gagne en souplesse", body: `${NAME} t’attend.` },
  { id: "CAT-ETIREMENTS-02", family: "CAT-ETIREMENTS", title: "Un moment pour s’étirer", body: `${NAME} : c’est le moment !` },
  { id: "CAT-EQUILIBRE-01", family: "CAT-EQUILIBRE", title: "On travaille sa stabilité", body: `${NAME} t’attend.` },
  { id: "CAT-EQUILIBRE-02", family: "CAT-EQUILIBRE", title: "Trouve ton équilibre", body: `${NAME} : c’est parti !` },
  { id: "CAT-COORDINATION-01", family: "CAT-COORDINATION", title: "Place à la coordination", body: `${NAME} t’attend.` },
  { id: "CAT-COORDINATION-02", family: "CAT-COORDINATION", title: "Concentration et mouvement", body: `${NAME} : c’est parti !` },
  { id: "CAT-RECUP-01", family: "CAT-RECUP", title: "On prend soin de soi", body: `${NAME} t’attend.` },
  { id: "CAT-RECUP-02", family: "CAT-RECUP", title: "Le temps de récupérer", body: `${NAME} : c’est le moment !` },
  { id: "CAT-RESPIRATION-01", family: "CAT-RESPIRATION", title: "Un moment pour souffler", body: `${NAME} t’attend.` },
  { id: "CAT-RESPIRATION-02", family: "CAT-RESPIRATION", title: "On retrouve son souffle", body: `${NAME} : c’est parti !` },
  { id: "CAT-MEDITATION-01", family: "CAT-MEDITATION", title: "Une pause pour l’esprit", body: `${NAME} t’attend.` },
  { id: "CAT-MEDITATION-02", family: "CAT-MEDITATION", title: "Un moment de calme", body: `${NAME} : c’est le moment !` },
  { id: "CAT-AUTRE-01", family: "CAT-AUTRE", title: "À toi de jouer", body: `${NAME} t’attend.` },
  { id: "CAT-AUTRE-02", family: "CAT-AUTRE", title: "Un moment pour toi", body: `${NAME} : c’est parti !` },
];

/** Catégories KODJO vérifiées (§ 3) → famille CAT-*. Toute autre catégorie (personnalisée) : pas d'accroche CAT-*. */
const CATEGORY_FAMILIES: Readonly<Record<string, ReminderFamily>> = {
  renforcement: "CAT-RENFO",
  cardio: "CAT-CARDIO",
  mobilite: "CAT-MOBILITE",
  etirements: "CAT-ETIREMENTS",
  equilibre: "CAT-EQUILIBRE",
  coordination: "CAT-COORDINATION",
  recuperation: "CAT-RECUP",
  respiration: "CAT-RESPIRATION",
  meditation: "CAT-MEDITATION",
  autre: "CAT-AUTRE",
};

export type ReminderContext = {
  /** Début planifié de l'occurrence (heure locale de planification). */
  readonly plannedAt: Date;
  /** Nom réel et complet. */
  readonly name: string;
  /** Planification récurrente (RECUR) ou ponctuelle (SINGLE). */
  readonly recurring: boolean;
  /** Catégories des exercices des séances de l'occurrence. */
  readonly categoryIds: readonly string[];
  /** Rang de l'occurrence dans sa routine (à partir de 1) : base de la rotation. */
  readonly rank: number;
};

export type ReminderMessage = { readonly templateId: string; readonly title: string; readonly body: string };

/** Jour du début planifié (§ 3) : lundi, mardi–jeudi, vendredi, samedi, dimanche. */
function dayFamily(date: Date): ReminderFamily {
  const day = date.getDay();
  if (day === 1) return "MON";
  if (day >= 2 && day <= 4) return "MIDWEEK";
  if (day === 5) return "FRI";
  return day === 6 ? "SAT" : "SUN";
}

/** Créneau de l'heure planifiée (§ 3) : matin 05–10:59, midi 11–14:59, après-midi 15–17:59, soir 18–22:59, nuit. */
function momentFamily(date: Date): ReminderFamily {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 10) return "MORNING";
  if (hour >= 11 && hour <= 14) return "LUNCH";
  if (hour >= 15 && hour <= 17) return "AFTERNOON";
  if (hour >= 18 && hour <= 22) return "EVENING";
  return "NIGHT";
}

/** Familles éligibles, dans l'ordre de départage de la spécification (§ 4, étape 5). */
export function eligibleFamilies(context: ReminderContext): ReminderFamily[] {
  const families: ReminderFamily[] = [context.recurring ? "RECUR" : "SINGLE"];
  const distinct = [...new Set(context.categoryIds)];
  const category = distinct.length === 1 ? CATEGORY_FAMILIES[distinct[0]!] : undefined;
  if (category !== undefined) families.push(category);
  families.push(dayFamily(context.plannedAt), momentFamily(context.plannedAt), "GEN");
  return families;
}

/** Corps (§ 4, étape 7) : le modèle s'il tient en 40 caractères, sinon le nom complet seul. */
export function reminderBody(template: ReminderTemplate, name: string): string {
  const body = template.body.replace(NAME, name);
  return body.length > REMINDER_BODY_MAX ? name : body;
}

/**
 * Message d'une occurrence : famille et variante en rotation selon le rang ; un modèle identique au précédent (dernière
 * notification programmée avant celle-ci) est remplacé par le suivant.
 */
export function composeReminder(context: ReminderContext, previousTemplateId: string | null): ReminderMessage {
  const families = eligibleFamilies(context);
  const rotation = Math.max(0, context.rank - 1);
  const candidates: ReminderTemplate[] = [];
  for (let shift = 0; shift < families.length; shift += 1) {
    const family = families[(rotation + shift) % families.length]!;
    const variants = REMINDER_TEMPLATES.filter((template) => template.family === family);
    const first = Math.floor(rotation / families.length) % variants.length;
    for (let offset = 0; offset < variants.length; offset += 1) candidates.push(variants[(first + offset) % variants.length]!);
  }
  const template = candidates.find((candidate) => candidate.id !== previousTemplateId) ?? candidates[0]!;
  return { templateId: template.id, title: template.title, body: reminderBody(template, context.name) };
}
