import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export default function AddressAutocomplete({ onSelect, initialValue = '' }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(!!initialValue);
  const debounceRef = useRef(null);

  const search = useCallback((text) => {
    clearTimeout(debounceRef.current);
    if (text.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: text.trim(),
          format: 'json',
          limit: '6',
          addressdetails: '1',
          countrycodes: 'gb',
        });
        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
          headers: { 'User-Agent': 'BallMatesApp/1.0' },
        });
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (_) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleChangeText = (text) => {
    setQuery(text);
    setSelected(false);
    // Clear parent selection when user starts typing again
    onSelect({ address: '', lat: null, lng: null });
    search(text);
  };

  const handleSelect = (item) => {
    const address = item.display_name;
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setQuery(address);
    setSelected(true);
    setSuggestions([]);
    onSelect({ address, lat, lng });
  };

  const handleClear = () => {
    setQuery('');
    setSelected(false);
    setSuggestions([]);
    onSelect({ address: '', lat: null, lng: null });
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Address</Text>
      <View style={[styles.inputRow, selected && styles.inputRowSelected]}>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'location-outline'}
          size={18}
          color={selected ? colors.success : colors.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder="Search for an address…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />}
        {!loading && query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {!selected && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((item, idx) => (
            <TouchableOpacity
              key={item.place_id ?? idx}
              style={[styles.suggestion, idx < suggestions.length - 1 && styles.suggestionBorder]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.75}
            >
              <Ionicons name="location-outline" size={15} color={colors.primary} style={styles.suggestionIcon} />
              <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!selected && !loading && query.trim().length >= 3 && suggestions.length === 0 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No results found — try a different search</Text>
        </View>
      )}

      {!selected && query.trim().length > 0 && (
        <Text style={styles.hint}>Select an address from the suggestions above</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  inputRowSelected: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  inputIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  spinner: { flexShrink: 0 },
  dropdown: {
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadows.md,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  suggestionIcon: { marginTop: 2, flexShrink: 0 },
  suggestionText: { ...typography.bodySmall, color: colors.text, flex: 1, lineHeight: 20 },
  noResults: {
    marginTop: 4,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  noResultsText: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, marginLeft: 2 },
});
