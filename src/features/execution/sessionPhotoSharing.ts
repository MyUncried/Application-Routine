/**
 * Photo de fin de séance — partage (décision de Hermann du 27/11/2026, point 4) : « Partage : automatique, selon les règles de la
 * relation et de l'affectation du programme, de la séance ou de la routine à cette relation. Aucun bouton ni choix de partage dans
 * l'écran de fin. […] Quand il est actif, la photo part avec le résultat de séance vers les destinataires que la relation définit, et
 * l'écran de fin affiche sous la photo une ligne discrète : « Sera partagée avec … ». » ; « Le transport du partage relève du module
 * de relation en cours de développement : ne pas le construire ».
 *
 * **Point d'accroche** du futur module de relation : `sessionPhotoRecipients` renvoie les noms des destinataires dont une relation
 * active, avec le paramètre « inclure la photo de fin de séance », couvre ce lancement (programme, séance ou routine). Le module
 * n'existant pas sur cette branche, la liste est vide : la ligne « Sera partagée avec … » n'est jamais affichée et rien n'est envoyé.
 */
export type SessionPhotoContext = {
  readonly sessionId: string;
  readonly routineId: string | null;
  readonly programId: string | null;
};

export type SessionPhotoRecipients = (context: SessionPhotoContext) => Promise<readonly string[]>;

export const sessionPhotoRecipients: SessionPhotoRecipients = async () => [];
