import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import Geolocation from '@react-native-community/geolocation';
import { useAuthStore } from '../../store/authStore';
import { doctorApi } from '../../api/endpoints';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../../constants/theme';

type Props = { navigation: any };

type DoctorTypeChip = {
  key: 'gp' | 'specialist' | 'allied_health' | 'travelling';
  label: string;
};

const DOCTOR_TYPE_CHIPS: DoctorTypeChip[] = [
  { key: 'gp', label: 'GP' },
  { key: 'specialist', label: 'Specialist' },
  { key: 'allied_health', label: 'Allied Health' },
  { key: 'travelling', label: 'Travelling' },
];

const DEFAULT_LATITUDE = -26.2041;
const DEFAULT_LONGITUDE = 28.0473;
const DEFAULT_REGION: Region = {
  latitude: DEFAULT_LATITUDE,
  longitude: DEFAULT_LONGITUDE,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function DoctorAvailabilityScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const mapRef = useRef<MapView>(null);

  const [isOnline, setIsOnline] = useState<boolean>(user?.isOnline ?? false);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(user?.doctorType ? [user.doctorType] : ['gp'])
  );
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  function requestLocationPermission() {
    if (Platform.OS === 'android') {
      Geolocation.requestAuthorization();
    }
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newRegion: Region = {
          latitude,
          longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        };
        setLocation({ latitude, longitude });
        setRegion(newRegion);
        setLocationPermission('granted');
        mapRef.current?.animateToRegion(newRegion, 800);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
        } else {
          setLocationPermission('denied');
          Alert.alert('Location Error', 'Could not retrieve your location. Please enable GPS.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  function handleUpdateLocation() {
    setIsUpdating(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newRegion: Region = {
          latitude,
          longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        };
        setLocation({ latitude, longitude });
        setRegion(newRegion);
        setLocationPermission('granted');
        mapRef.current?.animateToRegion(newRegion, 800);
        setIsUpdating(false);
      },
      () => {
        setIsUpdating(false);
        Alert.alert('Error', 'Could not update location. Please check GPS settings.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function toggleDoctorType(key: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return next;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleToggleOnline() {
    const nextState = !isOnline;
    Alert.alert(
      nextState ? 'Go Online' : 'Go Offline',
      nextState
        ? 'Patients within your set radius will be able to find you. Confirm to go online.'
        : 'You will no longer receive new patient requests. Confirm to go offline.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextState ? 'Go Online' : 'Go Offline',
          style: nextState ? 'default' : 'destructive',
          onPress: () => confirmToggleOnline(nextState),
        },
      ]
    );
  }

  async function confirmToggleOnline(nextState: boolean) {
    if (!user) return;
    setIsUpdating(true);
    try {
      await doctorApi.setAvailability(user.id, {
        isOnline: nextState,
        latitude: location?.latitude,
        longitude: location?.longitude,
        radius: radiusKm,
      });
      setIsOnline(nextState);
    } catch {
      Alert.alert('Error', 'Failed to update availability. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSaveAvailability() {
    if (!user) return;
    if (!location) {
      Alert.alert('No Location', 'Please update your location first.');
      return;
    }
    setIsUpdating(true);
    try {
      await doctorApi.setAvailability(user.id, {
        isOnline,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: radiusKm,
      });
      Alert.alert('Saved', 'Your availability settings have been updated.');
    } catch {
      Alert.alert('Error', 'Could not save settings. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  if (locationPermission === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Text style={styles.permissionIcon}>📍</Text>
        <Text style={styles.permissionTitle}>Location Permission Required</Text>
        <Text style={styles.permissionMessage}>
          MedAI needs access to your location to show patients nearby and update your availability
          radius on the map.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass
      >
        {location && (
          <>
            <Marker
              coordinate={location}
              title={`Dr ${user?.lastName ?? 'Doctor'}`}
              description={isOnline ? 'Online and accepting patients' : 'Currently offline'}
              pinColor={COLORS.primary}
            />
            <Circle
              center={location}
              radius={radiusKm * 1000}
              strokeColor={COLORS.primary + 'CC'}
              fillColor={COLORS.primary + '18'}
              strokeWidth={2}
            />
          </>
        )}
      </MapView>

      {/* Bottom Sheet Panel */}
      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Status Row */}
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textLight }]} />
              <Text style={[styles.statusText, { color: isOnline ? COLORS.success : COLORS.textSecondary }]}>
                {isOnline ? 'Online — Accepting Patients' : 'Offline'}
              </Text>
            </View>
            {isUpdating && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>

          {/* Radius Slider */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Accept patients within</Text>
              <View style={styles.radiusBadge}>
                <Text style={styles.radiusValue}>{radiusKm} km</Text>
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={radiusKm}
              onValueChange={(val) => setRadiusKm(Math.round(val))}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
            <View style={styles.sliderMinMax}>
              <Text style={styles.sliderMinMaxText}>1 km</Text>
              <Text style={styles.sliderMinMaxText}>50 km</Text>
            </View>
          </View>

          {/* Doctor Type Chips */}
          <View style={styles.chipsSection}>
            <Text style={styles.chipsLabel}>Practice Type</Text>
            <View style={styles.chipsRow}>
              {DOCTOR_TYPE_CHIPS.map((chip) => {
                const isSelected = selectedTypes.has(chip.key);
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
                    onPress={() => toggleDoctorType(chip.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.updateLocationButton}
              onPress={handleUpdateLocation}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <Text style={styles.updateLocationButtonText}>Update Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveAvailability}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Online Toggle */}
          <TouchableOpacity
            style={[styles.toggleButton, isOnline ? styles.toggleButtonOnline : styles.toggleButtonOffline]}
            onPress={handleToggleOnline}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            {isUpdating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.toggleButtonText}>
                {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  permissionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  permissionMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    maxHeight: '48%',
    ...SHADOWS.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  sliderSection: {
    marginBottom: SPACING.md,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sliderLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  radiusBadge: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  radiusValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderMinMax: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -SPACING.xs,
  },
  sliderMinMaxText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  chipsSection: {
    marginBottom: SPACING.md,
  },
  chipsLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipUnselected: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  chipTextUnselected: {
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  updateLocationButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  updateLocationButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },
  saveButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  toggleButton: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  toggleButtonOnline: {
    backgroundColor: COLORS.error,
  },
  toggleButtonOffline: {
    backgroundColor: COLORS.secondary,
  },
  toggleButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
