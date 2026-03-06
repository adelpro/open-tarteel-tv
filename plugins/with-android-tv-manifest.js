// withTVManifest.js
const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * @type {import('@expo/config-plugins').ConfigPlugin}
 */

const withTVManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest['uses-feature']) {
      androidManifest['uses-feature'] = [];
    }

    // 1. ADD: Explicitly require Leanback (Critical for TV Play Store)
    const leanbackFeature = androidManifest['uses-feature'].find(
      (f) => f.$['android:name'] === 'android.software.leanback',
    );

    if (leanbackFeature) {
      leanbackFeature.$['android:required'] = 'true';
    } else {
      androidManifest['uses-feature'].push({
        $: {
          'android:name': 'android.software.leanback',
          'android:required': 'true',
        },
      });
    }

    // 2. DISABLE: Features that are unsupported on TV (Prevent install errors)
    const featuresToDisable = [
      'android.hardware.screen.portrait',
      'android.hardware.microphone',
      'android.hardware.touchscreen', // Good practice for TV
      'android.hardware.camera', // Good practice for TV
      'android.hardware.location', // Good practice for TV
      'android.hardware.telephony', // Good practice for TV
    ];

    featuresToDisable.forEach((featureName) => {
      // 1. Remove existing entry if it exists to avoid duplicates
      androidManifest['uses-feature'] = androidManifest['uses-feature'].filter(
        (feature) => feature.$['android:name'] !== featureName,
      );

      // 2. Add the feature with android:required="false"
      androidManifest['uses-feature'].push({
        $: {
          'android:name': featureName,
          'android:required': 'false',
        },
      });
    });

    return config;
  });
};

module.exports = withTVManifest;
