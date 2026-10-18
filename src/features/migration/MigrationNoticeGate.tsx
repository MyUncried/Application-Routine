import { useContext, useEffect, useRef } from "react";
import { Alert } from "react-native";

import type { MigrationNotice, MigrationNoticeKind } from "@/domain/migration/MigrationNotice";
import { MigrationNoticeRepositoryContext } from "@/features/sessions/MigrationNoticeRepositoryContext";
import { strings } from "@/shared/i18n";

/** Seul genre d'avis affiché ; un genre inconnu est ignoré, jamais affiché avec ce texte. */
const DISPLAYED_KIND: MigrationNoticeKind = "UNREADABLE_EXERCISES_DROPPED";

/**
 * PRE-4 (story 1.2, AD-12, H24, RM-092) : texte de l'avis, issu du lexique,
 * accordé au nombre d'Exercices écartés. Il ne porte que ce nombre : aucun
 * nom, identifiant ni contenu d'Exercice écarté (FR-18-20).
 */
export function formatMigrationNoticeMessage(notice: Pick<MigrationNotice, "count">): string {
  const texts = strings.migrationNotice;
  return notice.count === 1
    ? texts.unreadableExercisesDroppedSingular
    : texts.unreadableExercisesDroppedPlural.replace("{n}", String(notice.count));
}

/**
 * PRE-4 (story 1.2, AD-12, H24, FR-18-20 septième et huitième conséquences) :
 * UNIQUE lecteur de `migration_notices`, monté une seule fois à la racine
 * (`app/_layout.tsx`), sous `SessionServiceProvider` et jamais en `children`
 * de `SQLiteProvider` (piège de l'écran blanc, AGENTS.md).
 *
 * Au montage, il lit l'avis non acquitté et, s'il en existe un, l'affiche par
 * une `Alert` native (primitive de l'OS, aucune frame Figma : NON VÉRIFIABLE)
 * à un seul bouton. L'acquittement n'est écrit qu'à l'appui sur ce bouton :
 * une application quittée avant l'appui retrouve l'avis au lancement suivant.
 * `cancelable: false` empêche, sur Android, une fermeture par le bouton
 * retour ou un toucher hors de l'alerte qui ne passerait pas par le bouton.
 *
 * Le repository peut être encore nul au premier rendu (il est remonté par
 * effet depuis `SessionServiceInitializer`) : le composant attend alors sa
 * disponibilité, sans lever. Au plus un `Alert` par montage : une fois la
 * lecture réglée, un changement de référence du repository ne relance rien ;
 * si l'effet est nettoyé avant que la lecture ne se règle (changement de
 * référence, double effet du mode strict), une seconde lecture peut avoir
 * lieu et le résultat de la première est ignoré. Aucun `Alert` n'est affiché
 * après le démontage. Seul un avis de genre `UNREADABLE_EXERCISES_DROPPED` est
 * affiché. Une erreur de lecture ou d'écriture est journalisée
 * (`console.warn`, convention de `app/_layout.tsx`) et n'empêche jamais
 * l'usage de l'application ; l'avis non acquitté réapparaîtra au lancement
 * suivant.
 */
export function MigrationNoticeGate() {
  const repository = useContext(MigrationNoticeRepositoryContext);
  // Lecture réglée : plus aucune relecture pour ce montage. Si l'effet est
  // nettoyé AVANT que la lecture ne se règle (changement de référence, ou
  // double effet du mode strict de développement), le drapeau est rendu :
  // l'avis sera relu par l'effet suivant au lieu d'être perdu.
  const hasReadRef = useRef(false);

  useEffect(() => {
    if (!repository || hasReadRef.current) {
      return;
    }
    hasReadRef.current = true;
    let active = true;
    let settled = false;

    repository.findUnacknowledged().then(
      (notice) => {
        settled = true;
        if (!active || !notice || notice.kind !== DISPLAYED_KIND) {
          return;
        }
        Alert.alert(
          formatMigrationNoticeMessage(notice),
          undefined,
          [
            {
              text: strings.migrationNotice.dismissAction,
              onPress: () => {
                repository.acknowledge(notice.id).catch((error: unknown) => {
                  console.warn("L'avis de migration n'a pas pu être acquitté.", error);
                });
              },
            },
          ],
          { cancelable: false },
        );
      },
      (error: unknown) => {
        settled = true;
        console.warn("L'avis de migration n'a pas pu être lu.", error);
      },
    );

    return () => {
      active = false;
      if (!settled) {
        hasReadRef.current = false;
      }
    };
  }, [repository]);

  return null;
}
