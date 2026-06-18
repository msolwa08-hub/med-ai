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
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useConsultationStore, Consultation } from '../../store/consultationStore';
import { ConsultationCard } from '../../components/ConsultationCard';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../../constants/theme';

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
      {/* Tabs */}
      <View style={styles.tabBar}>
        {TAB_OPTIONS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
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
            <Text style={styles.emptyIllustration}>🩺</Text>
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
              >
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyIllustration: {
    fontSize: 64,
    marginBottom: SPACING.lg,
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
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  startButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
});

export default MyRecordsScreen;
