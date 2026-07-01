import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useConsultationStore, Consultation } from '../../store/consultationStore';
import { ConsultationCard } from '../../components/ConsultationCard';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

type TabFilter = 'all' | 'completed' | 'inprogress';

const TAB_OPTIONS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'inprogress', label: 'In Progress' },
];

const COMPLETED_STATUSES: Consultation['status'][] = ['completed'];
const IN_PROGRESS_STATUSES: Consultation['status'][] = [
  'history_taking',
  'history_complete',
  'doctor_reviewing',
  'examination',
  'diagnosis',
  'management',
];

export const MyRecordsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { consultations, isLoading, loadConsultations } = useConsultationStore();

  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  useEffect(() => {
    if (user?.id) {
      loadConsultations(user.id);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    if (user?.id) {
      loadConsultations(user.id);
    }
  }, [user?.id]);

  const filtered = [...consultations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((c) => {
      if (activeTab === 'completed') return COMPLETED_STATUSES.includes(c.status);
      if (activeTab === 'inprogress') return IN_PROGRESS_STATUSES.includes(c.status);
      return true;
    });

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Records</Text>
        <Text style={styles.headerSubtitle}>
          {consultations.length} consultation{consultations.length !== 1 ? 's' : ''} on file
        </Text>
      </View>

      {/* Filter chips */}
      <View style={styles.tabBar}>
        {TAB_OPTIONS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <ConsultationCard
            consultation={item}
            onPress={() =>
              navigation.navigate('ConsultationDetail', { consultationId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={activeTab === 'inprogress' ? 'hourglass-outline' : 'folder-open-outline'}
                size={34}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'all'
                ? 'No consultations yet'
                : activeTab === 'completed'
                ? 'No completed consultations'
                : 'No consultations in progress'}
            </Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'all'
                ? 'Start your first consultation to see your medical records here.'
                : 'Records will appear here once available.'}
            </Text>
            {activeTab === 'all' && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('LanguageSelect')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
                <Text style={styles.startButtonText}>Start First Consultation</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.sm,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.card,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.healingMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    minHeight: 48,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  startButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
});

export default MyRecordsScreen;
