import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getCurrentLocationWithAddress, isInUK } from '../utils/location';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const DEFAULT_LAT = 51.5074;
const DEFAULT_LNG = -0.1278;
const GOOGLE_MAPS_API_KEY = 'AIzaSyA_sm2bYCSScsiURu2C0oJtujw04VZRC4s';

function formatAddressFromGeocode(results) {
  if (!results?.length) return null;
  const r = results[0];
  return [r.street, r.city, r.region, r.postalCode, r.country].filter(Boolean).join(', ') || null;
}

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function MapPickerModal({ visible, onClose, onSelect, initialLat, initialLng }) {
  const insets = useSafeAreaInsets();
  const initLat = toNum(initialLat, DEFAULT_LAT);
  const initLng = toNum(initialLng, DEFAULT_LNG);

  const [marker, setMarker] = useState({ latitude: initLat, longitude: initLng });
  const [region, setRegion] = useState({ latitude: initLat, longitude: initLng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    console.log('MapPickerModal useEffect - visible:', visible);
    if (visible) {
      const lat = toNum(initialLat, DEFAULT_LAT);
      const lng = toNum(initialLng, DEFAULT_LNG);
      console.log('MapPickerModal setting initial coordinates:', { lat, lng });
      setMarker({ latitude: lat, longitude: lng });
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      setAddress('');
    }
  }, [visible, initialLat, initialLng]);

  const reverseGeocode = (latitude, longitude) => {
    console.log('Reverse geocoding:', { latitude, longitude });
    setLoadingAddress(true);
    setAddress('');
    Location.reverseGeocodeAsync({ latitude, longitude })
      .then((results) => {
        console.log('Geocode results:', results);
        if (Array.isArray(results) && results.length > 0) {
          setAddress(formatAddressFromGeocode(results) || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } else {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      })
      .catch((err) => {
        console.error('Reverse geocode error:', err);
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      })
      .finally(() => {
        console.log('Geocode complete');
        setLoadingAddress(false);
      });
  };

  const handleMapPress = (e) => {
    console.log('Map pressed - event:', e);
    if (!e?.nativeEvent?.coordinate) {
      console.error('No coordinates in event');
      Alert.alert('Error', 'Could not detect tap location. Please try again.');
      return;
    }
    const { latitude, longitude } = e.nativeEvent.coordinate;
    console.log('Map press coordinates:', { latitude, longitude });
    if (!latitude || !longitude) {
      console.error('Invalid latitude or longitude:', { latitude, longitude });
      Alert.alert('Error', 'Invalid coordinates received. Please try again.');
      return;
    }
    if (!isInUK(latitude, longitude)) {
      console.warn('Location outside UK:', { latitude, longitude });
      Alert.alert('UK only', 'Please choose a location within the United Kingdom.');
      return;
    }
    console.log('Setting marker to:', { latitude, longitude });
    setMarker({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const goToCurrentLocation = async () => {
    const result = await getCurrentLocationWithAddress();
    if (!result) return;
    const { latitude, longitude, address: addr } = result;
    setMarker({ latitude, longitude });
    setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    setAddress(addr || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
  };

  const handleConfirm = () => {
    const label = address?.trim() || `${marker.latitude.toFixed(5)}, ${marker.longitude.toFixed(5)}`;
    onSelect(marker.latitude, marker.longitude, label);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Choose location</Text>
          <TouchableOpacity onPress={goToCurrentLocation} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Map — rendered only when modal is visible to prevent Android crash */}
        {visible && (
          <>
            {console.log('Rendering MapView with region:', region, 'marker:', marker)}
            <MapView
              style={styles.map}
              provider={Platform.OS === 'android' ? 'google' : undefined}
              apiKey={Platform.OS === 'android' ? GOOGLE_MAPS_API_KEY : undefined}
              initialRegion={region}
              onRegionChangeComplete={(newRegion) => {
                console.log('Region changed:', newRegion);
                setRegion(newRegion);
              }}
              onPress={handleMapPress}
              mapType="standard"
              zoomEnabled={true}
              scrollEnabled={true}
              pitchEnabled={false}
              rotateEnabled={false}
              onMapReady={() => console.log('Map is ready')}
              onError={(e) => console.error('Map error:', e)}
            >
              <Marker coordinate={marker} />
            </MapView>
          </>
        )}

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          {loadingAddress ? (
            <View style={styles.addressRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.addressLoading}>Getting address…</Text>
            </View>
          ) : address ? (
            <View style={styles.addressRow}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
            </View>
          ) : (
            <View style={styles.addressRow}>
              <Ionicons name="hand-left-outline" size={16} color={colors.textMuted} />
              <Text style={styles.hint}>Tap the map to set the pitch location</Text>
            </View>
          )}
          <Button title="Use this location" onPress={handleConfirm} style={styles.confirmBtn} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  headerBtn: { minWidth: 60, alignItems: 'flex-start' },
  cancelText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  title: { ...typography.h3, color: colors.text },
  map: { flex: 1 },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, minHeight: 36 },
  addressLoading: { ...typography.bodySmall, color: colors.textMuted },
  addressText: { ...typography.bodySmall, color: colors.text, flex: 1, fontWeight: '500' },
  hint: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  confirmBtn: { borderRadius: borderRadius.xl },
});
