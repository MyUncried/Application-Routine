const base = require('./app.json');

const isDevelopmentVariant = process.env.APP_VARIANT === 'development';

// Variante de développement « Routine BMAD » (expérimentation PRE-4 BMAD,
// décision de Hermann du 2026-10-17) : application distincte de
// « Routine Dev », installée à côté d'elle, avec ses propres données.
// Identifiant iOS, nom, icône et schéma de lien distincts ; le schéma
// généré `exp+routine` du dev client n'est pas ajouté, pour qu'aucun lien
// ne puisse ouvrir l'une à la place de l'autre.
const isBmadVariant = process.env.APP_VARIANT === 'bmad';

function variantConfig() {
  if (isBmadVariant) {
    return {
      ...base.expo,
      name: 'Routine BMAD',
      scheme: 'routine-bmad',
      ios: {
        ...base.expo.ios,
        icon: './assets/variants/bmad/icon.png',
        bundleIdentifier: 'com.ankusha.kodjo.bmad',
      },
      plugins: [...base.expo.plugins, ['expo-dev-client', { addGeneratedScheme: false }]],
    };
  }
  return {
    ...base.expo,
    name: isDevelopmentVariant ? 'Routine Dev' : 'Routine',
    ios: {
      ...base.expo.ios,
      bundleIdentifier: isDevelopmentVariant ? 'com.ankusha.kodjo.dev' : 'com.ankusha.kodjo',
    },
  };
}

// Rappels de la planification : notifications LOCALES seulement (aucun
// serveur de push). Le plugin d'expo-notifications ajoute toujours le droit
// `aps-environment`, absent des profils de signature des variantes : la
// build échoue. On le retire ; les notifications locales n'en ont pas besoin.
const { withEntitlementsPlist } = require('expo/config-plugins');
const withoutPushEntitlement = (config) =>
  withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });

const expo = variantConfig();
module.exports = {
  ...base,
  expo: { ...expo, plugins: [withoutPushEntitlement, 'expo-notifications', ...(expo.plugins ?? [])] },
};
