/**
 * T1 Compte — textes validés par Hermann (CPT-16, delta É3 CPT-29, É4-R5 CPT-32 ; plan `_bmad-output/compte/plan-lot-compte.md`).
 * Les textes marqués « à valider » n'ont pas de source validée et sont signalés au rapport.
 */
export const account = {
  signIn: {
    title: "Bienvenue dans KODJO",
    body: "Connectez-vous pour créer vos séances et partager vos mouvements.",
    bodyExistingInstallation: "Vos séances et votre historique restent sur ce téléphone et seront rattachés à votre compte.",
    continueWithApple: "Continuer avec Apple",
    continueWithGoogle: "Continuer avec Google",
    privacyPolicy: "Politique de confidentialité",
    offline: "Une connexion Internet est nécessaire pour vous connecter la première fois.",
    errorTitle: "Connexion",
    error: "La connexion n'a pas abouti. Réessayez.",
    ok: "OK",
    signingIn: "Connexion en cours",
  },
  refusedOtherAccount: {
    title: "Ce téléphone appartient à un autre compte",
    message: (provider: string, email: string) =>
      `Ses données sont rattachées au compte ${provider} ${email}. Connectez-vous avec ce compte, ou supprimez l'application pour repartir de zéro avec un autre compte. Supprimer l'application efface les données de ce téléphone.`,
  },
  refusedDeletedAccount: {
    title: "Ce téléphone contient les données d'un compte supprimé",
    message:
      "Pour les retrouver, reconnectez-vous avec le même identifiant Apple ou Google qu'avant la suppression. Pour utiliser un autre compte, supprimez puis réinstallez l'application : cette opération efface les données de ce téléphone.",
  },
  providerName: { apple: "Apple", google: "Google" },
  section: {
    title: "Compte",
    connectedWith: { apple: "Connecté avec Apple", google: "Connecté avec Google" },
    nameLabel: "Nom",
    emailLabel: "E-mail",
    privateRelay: "Adresse masquée par Apple",
    publicName: "Pseudo public",
    deleteAccount: "Supprimer mon compte",
  },
  deletion: {
    title: "Supprimer votre compte ?",
    message:
      "Votre compte, votre catalogue et les contenus que vous avez partagés seront supprimés de nos serveurs. Les personnes qui les ont déjà reçus les conservent, y compris les photos et vidéos déjà téléchargées.\nVos séances, mouvements et historique restent sur ce téléphone. Pour les effacer, supprimez l'application.",
    cancel: "Annuler",
    confirm: "Supprimer",
    inProgress: "Suppression en cours",
    offline: "La suppression du compte nécessite une connexion Internet.",
    // À valider : aucun texte validé pour un échec autre que l'absence de réseau.
    error: "La suppression du compte n'a pas abouti. Réessayez plus tard.",
  },
};
