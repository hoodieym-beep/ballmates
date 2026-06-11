import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

// UK bounding box
const UK_BOUNDS = { latMin: 49.9, latMax: 60.9, lngMin: -8.2, lngMax: 1.8 };

export function isInUK(latitude, longitude) {
  return (
    latitude >= UK_BOUNDS.latMin &&
    latitude <= UK_BOUNDS.latMax &&
    longitude >= UK_BOUNDS.lngMin &&
    longitude <= UK_BOUNDS.lngMax
  );
}

function formatAddressFromGeocode(results) {
  if (!results?.length) return null;
  const r = results[0];
  return [r.street, r.city, r.region, r.postalCode, r.country].filter(Boolean).join(', ') || null;
}

/**
 * Request location permission and return the current position + address.
 * Returns null if permission denied, outside UK, or location unavailable.
 * Shows appropriate alerts at every failure point.
 */
export async function getCurrentLocationWithAddress({ skipUKCheck = false } = {}) {
  // 1. Check existing permission status first
  const { status: existing } = await Location.getForegroundPermissionsAsync();

  if (existing === 'denied') {
    Alert.alert(
      'Location permission denied',
      'Please enable location access for Ball Mates in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
    return null;
  }

  // 2. Request if not yet granted
  if (existing !== 'granted') {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Location access is needed to set the pitch location. Please allow it when prompted.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // 3. Get position
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = loc.coords;

    // 4. UK check (skipped for features like Near Me)
    if (!skipUKCheck && !isInUK(latitude, longitude)) {
      Alert.alert(
        'UK only',
        'Ball Mates is only available in the United Kingdom. Your current location is outside the UK.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // 5. Reverse geocode
    let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      address = formatAddressFromGeocode(results) || address;
    } catch (_) {}

    return { latitude, longitude, address };
  } catch (e) {
    Alert.alert('Location unavailable', 'Could not get your current location. Make sure GPS is enabled.');
    return null;
  }
}

export { formatAddressFromGeocode };
