import type { account as frAccount } from "./frAccount";
import type { Widen } from "./types";

/** T1 Account — English catalogue (fallback language). */
export const account: Widen<typeof frAccount> = {
  signIn: {
    title: "Welcome to KODJO",
    body: "Sign in to create your sessions and share your movements.",
    bodyExistingInstallation: "Your sessions and history stay on this phone and will be linked to your account.",
    continueWithApple: "Continue with Apple",
    continueWithGoogle: "Continue with Google",
    privacyPolicy: "Privacy policy",
    offline: "An Internet connection is required to sign in for the first time.",
    errorTitle: "Sign-in",
    error: "Sign-in did not complete. Please try again.",
    ok: "OK",
    signingIn: "Signing in",
  },
  refusedOtherAccount: {
    title: "This phone belongs to another account",
    message: (provider: string, email: string) =>
      `Its data is linked to the ${provider} account ${email}. Sign in with that account, or delete the app to start over with another account. Deleting the app erases the data on this phone.`,
  },
  refusedDeletedAccount: {
    title: "This phone holds the data of a deleted account",
    message:
      "To get it back, sign in again with the same Apple or Google ID as before the deletion. To use another account, delete and reinstall the app: this erases the data on this phone.",
  },
  providerName: { apple: "Apple", google: "Google" },
  section: {
    title: "Account",
    connectedWith: { apple: "Signed in with Apple", google: "Signed in with Google" },
    nameLabel: "Name",
    emailLabel: "Email",
    privateRelay: "Address hidden by Apple",
    publicName: "Public username",
    deleteAccount: "Delete my account",
  },
  deletion: {
    title: "Delete your account?",
    message:
      "Your account, your catalogue and the content you shared will be deleted from our servers. People who already received it keep it, including photos and videos already downloaded.\nYour sessions, movements and history stay on this phone. To erase them, delete the app.",
    cancel: "Cancel",
    confirm: "Delete",
    inProgress: "Deleting",
    offline: "Deleting the account requires an Internet connection.",
    error: "Deleting the account did not complete. Please try again later.",
  },
};
