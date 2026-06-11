const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withGoogleMapsApiKey(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application?.[0];

    if (mainApplication) {
      if (!mainApplication["meta-data"]) {
        mainApplication["meta-data"] = [];
      }

      // Remove any existing Google Maps API key metadata
      mainApplication["meta-data"] = mainApplication["meta-data"].filter(
        (m) => m.$?.["android:name"] !== "com.google.android.geo.API_KEY"
      );

      // Add the Google Maps API key metadata
      mainApplication["meta-data"].push({
        $: {
          "android:name": "com.google.android.geo.API_KEY",
          "android:value": "AIzaSyA_sm2bYCSScsiURu2C0oJtujw04VZRC4s"
        }
      });
    }

    return config;
  });
};
