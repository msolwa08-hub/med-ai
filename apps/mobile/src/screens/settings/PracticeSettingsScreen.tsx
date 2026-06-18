import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text, Surface, Button, RadioButton, Snackbar, ActivityIndicator,
  ProgressBar, Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { apiClient } from '../api/client';

type PracticeMode = 'OPEN_LOOP' | 'CLOSED_LOOP';
type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

interface DoctorSettings {
  practiceMode: PracticeMode;
  cloudProvider?: string;
  cloudBucket?: string;
}
interface IncentiveScore {
  totalPoints: number;
  completionRate: number;
  streakDays: number;
  priorityBoost: number;
  tier: Tier;
  nextTierPoints: number;
}

const TIER_COLORS: Record<Tier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
};
const TIER_THRESHOLDS: Record<Tier, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 3000,
};

export default function PracticeSettingsScreen() {
  const [settings, setSettings] = useState<DoctorSettings | null>(null);
  const [incentive, setIncentive] = useState<IncentiveScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('OPEN_LOOP');
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, incentiveRes] = await Promise.all([
          apiClient.get('/doctor/settings'),
          apiClient.get('/doctor/incentive'),
        ]);
        setSettings(settingsRes.data);
        setIncentive(incentiveRes.data);
        setPracticeMode(settingsRes.data.practiceMode);
      } catch {
        setSnackbar('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save() {
    if (practiceMode === 'CLOSED_LOOP') {
      Alert.alert(
        'Switch to Closed Loop?',
        'In Closed Loop mode:\n\n✓ Your data stays on your own cloud\n✓ Full privacy for your practice\n\n✗ You will no longer appear in the patient marketplace\n✗ No new patients through MedAI\n\nYou can switch back to Open Loop anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch to Closed Loop',
            style: 'destructive',
            onPress: () => saveSettings(),
          },
        ]
      );
    } else {
      saveSettings();
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await apiClient.put('/doctor/settings', { practiceMode });
      setSettings({ ...settings!, practiceMode });
      setSnackbar('Settings saved');
    } catch {
      setSnackbar('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  const tierColor = TIER_COLORS[incentive?.tier ?? 'BRONZE'];
  const nextTier = incentive ? getNextTier(incentive.tier) : null;
  const progressToNext = incentive && nextTier
    ? (incentive.totalPoints - TIER_THRESHOLDS[incentive.tier]) /
      (TIER_THRESHOLDS[nextTier] - TIER_THRESHOLDS[incentive.tier])
    : 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Practice Settings</Text>

        {/* Incentive Score Card */}
        {incentive && (
          <Surface style={[styles.card, styles.tierCard]} elevation={2}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
                <Text style={styles.tierBadgeText}>{incentive.tier}</Text>
              </View>
              <View style={styles.tierInfo}>
                <Text style={styles.tierPoints}>{incentive.totalPoints.toLocaleString()} pts</Text>
                <Text style={styles.tierBoost}>
                  Priority boost: ×{incentive.priorityBoost.toFixed(1)} — you rank {getPriorityDesc(incentive.priorityBoost)} in patient searches
                </Text>
              </View>
            </View>

            {nextTier && (
              <>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Progress to {nextTier}</Text>
                  <Text style={styles.progressLabel}>
                    {incentive.nextTierPoints} pts needed
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.max(0, Math.min(1, progressToNext))}
                  color={tierColor}
                  style={styles.progressBar}
                />
              </>
            )}

            <View style={styles.statsRow}>
              <StatPill label="Completion" value={`${Math.round(incentive.completionRate)}%`} color={COLORS.secondary} />
              <StatPill label="Streak" value={`${incentive.streakDays}d`} color={COLORS.primary} />
              <StatPill label="Total Pts" value={incentive.totalPoints.toLocaleString()} color={tierColor} />
            </View>

            <Surface style={styles.howToEarn} elevation={0}>
              <Text style={styles.howToEarnTitle}>How to earn points</Text>
              <EarnRow action="Confirm AI history" pts={5} />
              <EarnRow action="Record examination findings" pts={10} />
              <EarnRow action="Select diagnosis + ICD-10" pts={5} />
              <EarnRow action="Complete management plan" pts={15} />
              <EarnRow action="Issue prescription" pts={5} />
              <EarnRow action="Full SOAP note completed" pts={20} />
              <EarnRow action="7-day completion streak" pts={50} highlight />
            </Surface>
          </Surface>
        )}

        {/* Practice Mode */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Practice Mode</Text>
          <Text style={styles.cardSubtitle}>
            Choose how your data is stored and whether you appear in the patient marketplace.
          </Text>

          <RadioButton.Group
            onValueChange={(v) => setPracticeMode(v as PracticeMode)}
            value={practiceMode}
          >
            <Surface style={[styles.modeCard, practiceMode === 'OPEN_LOOP' && styles.modeCardSelected]} elevation={0}>
              <View style={styles.modeRow}>
                <RadioButton value="OPEN_LOOP" color={COLORS.primary} />
                <View style={styles.modeText}>
                  <Text style={styles.modeTitle}>🌐 Open Loop (Recommended)</Text>
                  <Text style={styles.modeDesc}>
                    Data stored on MedAI's secure cloud (AWS Cape Town). You appear in the patient marketplace and can accept new patients. Full platform access with incentive scoring.
                  </Text>
                  <View style={styles.modePros}>
                    <ProChip text="New patients" />
                    <ProChip text="Higher priority" />
                    <ProChip text="Research insights" />
                  </View>
                </View>
              </View>
            </Surface>

            <Surface style={[styles.modeCard, practiceMode === 'CLOSED_LOOP' && styles.modeCardSelected]} elevation={0}>
              <View style={styles.modeRow}>
                <RadioButton value="CLOSED_LOOP" color={COLORS.primary} />
                <View style={styles.modeText}>
                  <Text style={styles.modeTitle}>🔒 Closed Loop (Private Practice)</Text>
                  <Text style={styles.modeDesc}>
                    Data stored on your own cloud (AWS/Azure/GCP). Full data sovereignty. You do NOT appear in the patient marketplace — only your existing patients can use the app with you.
                  </Text>
                  <View style={styles.modePros}>
                    <ProChip text="Your cloud" color={COLORS.textSecondary} />
                    <ProChip text="Full privacy" color={COLORS.textSecondary} />
                    <ConChip text="No new patients" />
                  </View>
                </View>
              </View>
            </Surface>
          </RadioButton.Group>

          <Button
            mode="contained"
            onPress={save}
            loading={saving}
            disabled={saving || practiceMode === settings?.practiceMode}
            buttonColor={COLORS.primary}
            style={styles.saveButton}
          >
            Save Practice Mode
          </Button>
        </Surface>

        {/* POPIA Notice */}
        <Surface style={styles.popiaCard} elevation={0}>
          <Text style={styles.popiaTitle}>🛡️ POPIA Compliance</Text>
          <Text style={styles.popiaText}>
            MedAI processes personal health information in accordance with the Protection of Personal Information Act (POPIA) No. 4 of 2013. All data is encrypted at rest with AES-256-GCM. Patient consent is obtained and audited for every data access. You may request a POPIA Compliance Certificate for your practice.
          </Text>
        </Surface>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[statStyles.pill, { borderColor: color }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  pill: { alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, minWidth: 72 },
  value: { fontSize: 16, fontWeight: '800' },
  label: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
});

function EarnRow({ action, pts, highlight }: { action: string; pts: number; highlight?: boolean }) {
  return (
    <View style={earnStyles.row}>
      <Text style={[earnStyles.action, highlight && earnStyles.highlight]}>{action}</Text>
      <Text style={[earnStyles.pts, highlight && { color: COLORS.warning }]}>+{pts} pts</Text>
    </View>
  );
}
const earnStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  action: { fontSize: 13, color: COLORS.text },
  highlight: { fontWeight: '700', color: COLORS.primary },
  pts: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
});

function ProChip({ text, color }: { text: string; color?: string }) {
  return <Chip compact style={{ marginRight: 4, marginTop: 4, backgroundColor: (color ?? COLORS.secondary) + '20' }} textStyle={{ fontSize: 11, color: color ?? COLORS.secondary }}>{text}</Chip>;
}
function ConChip({ text }: { text: string }) {
  return <Chip compact style={{ marginRight: 4, marginTop: 4, backgroundColor: COLORS.error + '15' }} textStyle={{ fontSize: 11, color: COLORS.error }}>{text}</Chip>;
}

function getNextTier(tier: Tier): Tier | null {
  if (tier === 'BRONZE') return 'SILVER';
  if (tier === 'SILVER') return 'GOLD';
  if (tier === 'GOLD') return 'PLATINUM';
  return null;
}
function getPriorityDesc(boost: number): string {
  if (boost >= 1.5) return 'much higher';
  if (boost >= 1.3) return 'higher';
  if (boost >= 1.1) return 'slightly higher';
  return 'standard';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  tierCard: { borderWidth: 2, borderColor: COLORS.primary + '30' },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  tierBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, marginRight: SPACING.md },
  tierBadgeText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  tierInfo: { flex: 1 },
  tierPoints: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  tierBoost: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  progressLabel: { fontSize: 12, color: COLORS.textSecondary },
  progressBar: { height: 8, borderRadius: 4, marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  howToEarn: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm },
  howToEarnTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  cardSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  modeCard: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.divider, marginBottom: SPACING.sm, padding: SPACING.sm },
  modeCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  modeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  modeText: { flex: 1, paddingTop: SPACING.xs },
  modeTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  modeDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs, lineHeight: 19 },
  modePros: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.xs },
  saveButton: { marginTop: SPACING.md, borderRadius: BORDER_RADIUS.md },
  popiaCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  popiaTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, marginBottom: SPACING.xs },
  popiaText: { fontSize: 12, color: '#2E7D32', lineHeight: 18 },
});
