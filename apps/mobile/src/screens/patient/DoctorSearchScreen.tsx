import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

function getMarkerIcon(doctorType: string): keyof typeof Ionicons.glyphMap {
  switch (doctorType) {
    case 'gp':
      return 'person';
    case 'specialist':
      return 'pulse';
    default:
      return 'medkit';
  }
}

const MapPlaceholder: React.FC<{
  doctors: NearbyDoctor[];
  selectedId: string | null;
  onMarkerPress: (id: string) => void;
}> = ({ doctors, selectedId, onMarkerPress }) => (
  <View style={mapStyles.container}>
    <View style={mapStyles.placeholderIconCircle}>
      <Ionicons name="map-outline" size={28} color={COLORS.primary} />
    </View>
    <Text style={mapStyles.placeholderText}>Map View</Text>
    <Text style={mapStyles.placeholderSub}>
      {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} nearby
    </Text>
    <View style={mapStyles.markers}>
      {doctors.slice(0, 5).map((doc) => (
        <TouchableOpacity
          key={doc.id}
          style={[
            mapStyles.marker,
            { backgroundColor: doc.isOnline ? COLORS.success : COLORS.systemGray2 },
            selectedId === doc.id && mapStyles.markerSelected,
          ]}
          onPress={() => onMarkerPress(doc.id)}
          activeOpacity={0.8}
        >
          <Ionicons name={getMarkerIcon(doc.doctorType)} size={18} color={COLORS.white} />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const mapStyles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.35,
    backgroundColor: COLORS.healingMint,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.healingTealMid,
  },
  placeholderIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  placeholderText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  placeholderSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  markers: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  markerSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.full,
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
    <SafeAreaView style={styles.root}>
      {/* Map */}
      <MapPlaceholder
        doctors={filteredDoctors}
        selectedId={selectedId}
        onMarkerPress={handleMarkerPress}
      />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.secondaryLabel} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or specialty…"
              placeholderTextColor={COLORS.textLight}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.systemGray2} />
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
          style={styles.filterListWrap}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                typeFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setTypeFilter(item.key)}
              activeOpacity={0.8}
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
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
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
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Finding doctors near you…</Text>
          </View>
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
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={30} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyStateText}>No doctors found nearby</Text>
                <Text style={styles.emptyStateSubText}>
                  Try a different filter or clear your search.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.healingMint,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: -BORDER_RADIUS.xl,
    paddingTop: SPACING.sm,
    ...SHADOWS.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.systemGray4,
    marginBottom: SPACING.sm,
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
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  filterListWrap: {
    flexGrow: 0,
  },
  filterList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
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
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
  loadingState: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyStateSubText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DoctorSearchScreen;
