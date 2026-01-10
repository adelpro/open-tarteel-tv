// withTVManifest.js
const { withAndroidManifest } = require("@expo/config-plugins");

/** 
 * @type {import('@expo/config-plugins').ConfigPlugin} 
 */

const withTVManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest["uses-feature"]) {
      androidManifest["uses-feature"] = [];
    }

    // List of features to explicitly mark as not required
    const featuresToDisable = [
      "android.hardware.screen.portrait",
      "android.hardware.microphone",
      "android.hardware.touchscreen", // Good practice for TV
      "android.hardware.camera", // Good practice for TV
      "android.hardware.location", // Good practice for TV
      "android.hardware.telephony", // Good practice for TV
    ];

    featuresToDisable.forEach((featureName) => {
      // 1. Remove existing entry if it exists to avoid duplicates
      androidManifest["uses-feature"] = androidManifest["uses-feature"].filter(
        (feature) => feature.$["android:name"] !== featureName
      );

      // 2. Add the feature with android:required="false"
      androidManifest["uses-feature"].push({
        $: {
          "android:name": featureName,
          "android:required": "false",
        },
      });
    });

    // OPTIONAL: If you do NOT need to record audio (only play),
    // strictly remove the RECORD_AUDIO permission to be safe.
    if (androidManifest["uses-permission"]) {
      androidManifest["uses-permission"] = androidManifest[
        "uses-permission"
      ].filter(
        (perm) => perm.$["android:name"] !== "android.permission.RECORD_AUDIO"
      );
    }

    return config;
  });
};

module.exports = withTVManifest;
