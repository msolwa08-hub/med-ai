import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DoctorCard, NearbyDoctor } from '../../components/DoctorCard';
import { doctorApi } from '../../api/endpoints';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type DoctorTypeFilter = 'ALL' | 'GP' | 'SPECIALIST' | 'ALLIED' | 'TRAVELLING';
type SortOption = 'nearest' | 'rating' | 'fee';

const TYPE_FILTERS: { key: DoctorTypeFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'GP', label: 'GP' },
  { key: 'SPECIALIST', label: 'Specialist' },
  { key: 'ALLIED', label: 'Allied' },
  { key: 'TRAVELLING', label: 'Travelling' },
];

const TYPE_MAP: Record<DoctorTypeFilter, string | undefined> = {
  ALL: undefined,
  GP: 'gp',
  SPECIALIST: 'specialist',
  ALLIED: 'allied_health',
  TRAVELLING: 'travelling',
};

const MapPlaceholder: React.FC<{
  doctors: NearbyDoctor[];
  selectedId: string | null;
  onMarkerPress: (id: string) => void;
}> = ({ doctors, selectedId, onMarkerPress }) => (
  <View style={mapStyles.container}>
    <Text style={mapStyles.placeholder}>🗺️</Text>
    <Text style={mapStyles.placeholderText}>Map View</Text>
    <Text style={mapStyles.placeholderSub}>
      {doctors.length} doctors nearby
    </Text>
    <View style={mapStyles.markers}>
      {doctors.slice(0, 5).map((doc) => (
        <TouchableOpacity
          key={doc.id}
          style={[
            mapStyles.marker,
            { backgroundColor: doc.isOnline ? COLORS.success : COLORS.textLight },
            selectedId === doc.id && mapStyles.markerSelected,
          ]}
          onPress={() => onMarkerPress(doc.id)}
        >
          <Text style={mapStyles.markerText}>
            {doc.doctorType === 'gp' ? '👨‍⚕️' : doc.doctorType === 'specialist' ? '🔬' : '🏥'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const mapStyles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.35,
    backgroundColor: '#E8F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  placeholder: {
    fontSize: 48,
  },
  placeholderText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  placeholderSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  markers: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  markerSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  markerText: {
    fontSize: 18,
  },
});

export const DoctorSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [doctors, setDoctors] = useState<NearbyDoctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<NearbyDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<DoctorTypeFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchLocation = useCallback(async () => {
    try {
      // Expo Location import (graceful fallback if not available)
      const ExpoLocation = await import('expo-location').catch(() => null);
      if (!ExpoLocation) {
        // Default to Johannesburg CBD
        setLocation({ lat: -26.2041, lng: 28.0473 });
        return;
      }
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation({ lat: -26.2041, lng: 28.0473 });
        return;
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setLocation({ lat: -26.2041, lng: 28.0473 });
    }
  }, []);

  const fetchDoctors = useCallback(
    async (lat: number, lng: number, type?: string) => {
      setIsLoading(true);
      try {
        const response = await doctorApi.getNearbyDoctors(lat, lng, type);
        const data: NearbyDoctor[] = response.data;
        setDoctors(data);
      } catch {
        // Use mock data for UI development
        const mock: NearbyDoctor[] = [
          {
            id: '1',
            firstName: 'Sipho',
            lastName: 'Dlamini',
            doctorType: 'gp',
            isOnline: true,
            hpcsaStatus: 'VERIFIED',
            rating: 4.8,
            reviewCount: 127,
            distanceKm: 1.2,
            etaMinutes: 8,
            consultationFee: 350,
            languagesSpoken: ['zu', 'en', 'xh'],
            latitude: lat + 0.01,
            longitude: lng + 0.01,
          },
          {
            id: '2',
            firstName: 'Priya',
            lastName: 'Naidoo',
            doctorType: 'specialist',
            specialization: 'Cardiology',
            isOnline: true,
            hpcsaStatus: 'VERIFIED',
            rating: 4.9,
            reviewCount: 243,
            distanceKm: 3.4,
            etaMinutes: 20,
            consultationFee: 850,
            languagesSpoken: ['en', 'af'],
            latitude: lat + 0.02,
            longitude: lng - 0.01,
          },
          {
            id: '3',
            firstName: 'Themba',
            lastName: 'Mokoena',
            doctorType: 'travelling',
            isOnline: false,
            hpcsaStatus: 'VERIFIED',
            rating: 4.6,
            reviewCount: 89,
            distanceKm: 5.1,
            etaMinutes: 30,
            consultationFee: 200,
            languagesSpoken: ['zu', 'st', 'en'],
            latitude: lat - 0.02,
            longitude: lng + 0.02,
          },
        ];
        setDoctors(mock);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (location) {
      const type = TYPE_MAP[typeFilter];
      fetchDoctors(location.lat, location.lng, type);
    }
  }, [location, typeFilter, fetchDoctors]);

  useEffect(() => {
    let result = [...doctors];
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (d) =>
          d.firstName.toLowerCase().includes(q) ||
          d.lastName.toLowerCase().includes(q) ||
          d.specialization?.toLowerCase().includes(q) ||
          d.doctorType.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'nearest') {
      result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'fee') {
      result.sort((a, b) => (a.consultationFee ?? 0) - (b.consultationFee ?? 0));
    }
    setFilteredDoctors(result);
  }, [doctors, searchText, sortBy]);

  const handleMarkerPress = (id: string) => {
    setSelectedId(id);
  };

  return (
    <View style={styles.root}>
      {/* Map */}
      <MapPlaceholder
        doctors={filteredDoctors}
        selectedId={selectedId}
        onMarkerPress={handleMarkerPress}
      />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors..."
              placeholderTextColor={COLORS.textLight}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Type filter chips */}
        <FlatList
          horizontal
          data={TYPE_FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                typeFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setTypeFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  typeFilter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Sort row */}
        <View style={styles.sortRow}>
          <Text style={styles.resultCount}>
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
          </Text>
          <View style={styles.sortButtons}>
            {(['nearest', 'rating', 'fee'] as SortOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.sortChip, sortBy === opt && styles.sortChipActive]}
                onPress={() => setSortBy(opt)}
              >
                <Text style={[styles.sortChipText, sortBy === opt && styles.sortChipTextActive]}>
                  {opt === 'nearest' ? 'Nearest' : opt === 'rating' ? 'Best Rated' : 'Lowest Fee'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Doctor list */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: SPACING.xl }}
          />
        ) : (
          <FlatList
            data={filteredDoctors}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.doctorList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <DoctorCard
                doctor={item}
                onSelect={() =>
                  navigation.navigate('DoctorProfile', { doctorId: item.id })
                }
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🩺</Text>
                <Text style={styles.emptyStateText}>No doctors found nearby.</Text>
                <Text style={styles.emptyStateSubText}>Try expanding your search.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: -BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
    ...SHADOWS.lg,
  },
  searchRow: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  clearIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
    padding: 4,
  },
  filterList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  resultCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  sortChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceVariant,
  },
  sortChipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  sortChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: COLORS.white,
  },
  doctorList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyStateSubText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: 4,
  },
});

export default DoctorSearchScreen;
