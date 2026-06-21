import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput } from 'react-native';
import {
  Text, Surface, Button, RadioButton, Snackbar, ActivityIndicator,
  ProgressBar, Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE } from '../../constants/theme';
import { apiClient } from '../../api/client';
import { useMode, type AppMode } from '../../context/ModeContext';

// ─── GP Profile types ─────────────────────────────────────────────────────────

type PracticeType = 'URGENT' | 'MIXED' | 'CONTINUITY' | 'SPECIALIST';
type InvestigationThreshold = 'MINIMAL' | 'STANDARD' | 'COMPREHENSIVE';
type PrescribingStyle = 'CONSERVATIVE' | 'STANDARD' | 'PROACTIVE';
type ReferralThreshold = 'MANAGE_MOST' | 'REFER_UNCERTAIN' | 'REFER_EARLY';
type SickNotePolicy = 'LIBERAL' | 'INDICATED' | 'RARE';
type AiHistoryDepth = 'FOCUSED' | 'STANDARD' | 'COMPREHENSIVE';

interface GPProfile {
  practiceType: PracticeType;
  populations: string[];
  priorities: string[];
  investigationThreshold: InvestigationThreshold;
  prescribingStyle: PrescribingStyle;
  referralThreshold: ReferralThreshold;
  sickNotePolicy: SickNotePolicy;
  specialInterests: string;
  practiceNotes: string;
}

const DEFAULT_GP_PROFILE: GPProfile = {
  practiceType: 'MIXED',
  populations: ['ADULTS'],
  priorities: ['ACUTE', 'CHRONIC'],
  investigationThreshold: 'STANDARD',
  prescribingStyle: 'STANDARD',
  referralThreshold: 'REFER_UNCERTAIN',
  sickNotePolicy: 'INDICATED',
  specialInterests: '',
  practiceNotes: '',
};

const GP_PROFILE_KEY = 'medai_gp_profile_v1';

const POPULATION_OPTIONS = [
  { id: 'CHILDREN', label: 'Children (0–12)' },
  { id: 'ADOLESCENTS', label: 'Adolescents (13–17)' },
  { id: 'ADULTS', label: 'Working adults (18–60)' },
  { id: 'ELDERLY', label: 'Elderly (60+)' },
  { id: 'CHRONIC', label: 'High chronic burden (HIV/DM/HTN/TB)' },
  { id: 'OCCUPATIONAL', label: 'Occupational workers' },
];

const PRIORITY_OPTIONS = [
  { id: 'ACUTE', label: 'Immediate acute management' },
  { id: 'CHRONIC', label: 'Chronic disease optimisation' },
  { id: 'MENTAL_HEALTH', label: 'Mental health & wellbeing' },
  { id: 'PREVENTIVE', label: 'Preventive care & immunisations' },
  { id: 'SOCIAL', label: 'Social determinants of health' },
  { id: 'LIFESTYLE', label: 'Lifestyle & behaviour change' },
];

const HISTORY_DEPTH_OPTIONS: { id: AiHistoryDepth; label: string; sub: string }[] = [
  { id: 'FOCUSED', label: '⚡ Focused', sub: '12–18 exchanges · Short chains · Skip health promotion · Less patient fatigue' },
  { id: 'STANDARD', label: '🩺 Standard (Recommended)', sub: '18–25 exchanges · Full symptom chains · Skip health promotion if time is short' },
  { id: 'COMPREHENSIVE', label: '🔬 Comprehensive', sub: 'No exchange limit · Every chain fully explored · Full screening & health promotion' },
];

type PracticeMode = 'OPEN_LOOP' | 'CLOSED_LOOP';
type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

interface DoctorSettings {
  practiceMode: PracticeMode;
  aiHistoryDepth: AiHistoryDepth;
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
  const navigation = useNavigation<any>();
  const { mode, setMode } = useMode();
  const [settings, setSettings] = useState<DoctorSettings | null>(null);
  const [incentive, setIncentive] = useState<IncentiveScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('OPEN_LOOP');
  const [aiHistoryDepth, setAiHistoryDepth] = useState<AiHistoryDepth>('STANDARD');
  const [savingDepth, setSavingDepth] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  // GP profile questionnaire
  const [gpProfile, setGpProfile] = useState<GPProfile>({ ...DEFAULT_GP_PROFILE });
  const [savingProfile, setSavingProfile] = useState(false);

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
        setAiHistoryDepth(settingsRes.data.aiHistoryDepth ?? 'STANDARD');
      } catch {
        setSnackbar('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    async function loadProfile() {
      try {
        const raw = await AsyncStorage.getItem(GP_PROFILE_KEY);
        if (raw) setGpProfile({ ...DEFAULT_GP_PROFILE, ...JSON.parse(raw) });
      } catch { /* use defaults */ }
    }
    load();
    loadProfile();
  }, []);

  const togglePopulation = useCallback((id: string) => {
    setGpProfile((p) => ({
      ...p,
      populations: p.populations.includes(id)
        ? p.populations.filter((x) => x !== id)
        : [...p.populations, id],
    }));
  }, []);

  const togglePriority = useCallback((id: string) => {
    setGpProfile((p) => ({
      ...p,
      priorities: p.priorities.includes(id)
        ? p.priorities.filter((x) => x !== id)
        : [...p.priorities, id],
    }));
  }, []);

  async function saveGPProfile() {
    setSavingProfile(true);
    try {
      await AsyncStorage.setItem(GP_PROFILE_KEY, JSON.stringify(gpProfile));
      setSnackbar('Practice profile saved');
    } catch {
      setSnackbar('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  }

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

  async function saveAiHistoryDepth() {
    setSavingDepth(true);
    try {
      await apiClient.put('/doctor/settings', { aiHistoryDepth });
      setSettings((prev) => prev ? { ...prev, aiHistoryDepth } : prev);
      setSnackbar('AI history preference saved');
    } catch {
      setSnackbar('Failed to save preference');
    } finally {
      setSavingDepth(false);
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

        {/* ── App Mode ───────────────────────────────────────────────────────── */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>App Mode</Text>
          <Text style={styles.cardSubtitle}>
            Intern mode surfaces STG learning content and pathology insights. GP mode gives you the full clinical workflow with AI-personalised packages.
          </Text>
          <View style={modeStyles.toggle}>
            {(['INTERN', 'GP'] as AppMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[modeStyles.btn, mode === m && modeStyles.btnActive]}
                onPress={() => setMode(m)}
                activeOpacity={0.8}
              >
                <Text style={[modeStyles.btnLabel, mode === m && modeStyles.btnLabelActive]}>
                  {m === 'INTERN' ? '🎓 Intern' : '🩺 GP'}
                </Text>
                {mode === m && (
                  <Text style={modeStyles.activeDesc}>
                    {m === 'INTERN' ? 'STG + EML · Learning mode' : 'Full clinical workflow'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Surface>

        {/* ── GP Profile Questionnaire ───────────────────────────────────────── */}
        {mode === 'GP' && (
          <>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>AI Practice Profile</Text>
            <Text style={styles.cardSubtitle}>
              This shapes how the AI generates clinical packages, management plans, and documents for your practice.
            </Text>

            {/* Q1: Practice type */}
            <Text style={qStyles.qLabel}>1. Practice type</Text>
            {([
              { id: 'URGENT', label: '⚡ High-volume urgent/walk-in', sub: '5–10 min slots, acute focus' },
              { id: 'MIXED', label: '🩺 Mixed GP', sub: 'Acute + follow-up, 10–15 min' },
              { id: 'CONTINUITY', label: '👨‍👩‍👧 Continuity family medicine', sub: 'Relationships, 20–30 min' },
              { id: 'SPECIALIST', label: '🔬 Specialist rooms', sub: 'Referred cases, deep focus' },
            ] as { id: PracticeType; label: string; sub: string }[]).map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[qStyles.optionRow, gpProfile.practiceType === opt.id && qStyles.optionRowSelected]}
                onPress={() => setGpProfile((p) => ({ ...p, practiceType: opt.id }))}
              >
                <View style={[qStyles.radio, gpProfile.practiceType === opt.id && qStyles.radioSelected]} />
                <View>
                  <Text style={qStyles.optionLabel}>{opt.label}</Text>
                  <Text style={qStyles.optionSub}>{opt.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Q2: Patient populations */}
            <Text style={[qStyles.qLabel, { marginTop: SPACING.md }]}>2. Patient populations (select all)</Text>
            <View style={qStyles.chipWrap}>
              {POPULATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[qStyles.chip, gpProfile.populations.includes(opt.id) && qStyles.chipSelected]}
                  onPress={() => togglePopulation(opt.id)}
                >
                  <Text style={[qStyles.chipText, gpProfile.populations.includes(opt.id) && qStyles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Q3: Priorities */}
            <Text style={[qStyles.qLabel, { marginTop: SPACING.md }]}>3. Always highlight in every consult</Text>
            <View style={qStyles.chipWrap}>
              {PRIORITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[qStyles.chip, gpProfile.priorities.includes(opt.id) && qStyles.chipSelected]}
                  onPress={() => togglePriority(opt.id)}
                >
                  <Text style={[qStyles.chipText, gpProfile.priorities.includes(opt.id) && qStyles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Q4: Investigation threshold */}
            <Text style={[qStyles.qLabel, { marginTop: SPACING.md }]}>4. Investigation threshold</Text>
            {([
              { id: 'MINIMAL', label: 'Lean — only what changes immediate management' },
              { id: 'STANDARD', label: 'Standard — evidence-based workup' },
              { id: 'COMPREHENSIVE', label: 'Thorough — I prefer to cast a wide net' },
            ] as { id: InvestigationThreshold; label: string }[]).map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[qStyles.optionRow, gpProfile.investigationThreshold === opt.id && qStyles.optionRowSelected]}
                onPress={() => setGpProfile((p) => ({ ...p, investigationThreshold: opt.id }))}
              >
                <View style={[qStyles.radio, gpProfile.investigationThreshold === opt.id && qStyles.radioSelected]} />
                <Text style={qStyles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Q5: Prescribing */}
            <Text style={[qStyles.qLabel, { marginTop: SPACING.md }]}>5. Prescribing philosophy</Text>
            {([
              { id: 'CONSERVATIVE', label: 'Conservative — lifestyle first, scripts only when essential' },
              { id: 'STANDARD', label: 'Guideline-based — standard evidence-based prescribing' },
              { id: 'PROACTIVE', label: 'Proactive — control symptoms quickly, prescribe early' },
            ] as { id: PrescribingStyle; label: string }[]).map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[qStyles.optionRow, gpProfile.prescribingStyle === opt.id && qStyles.optionRowSelected]}
                onPress={() => setGpProfile((p) => ({ ...p, prescribingStyle: opt.id }))}
              >
                <View style={[qStyles.radio, gpProfile.prescribingStyle === opt.id && qStyles.radioSelected]} />
                <Text style={qStyles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Q6: Referral threshold */}
            <Text style={[qStyles.qLabel, { marginTop: SPACING.md }]}>6. Referral threshold</Text>
            {([
              { id: 'MANAGE_MOST', label: 'I manage most things in-room' },
              { id: 'REFER_UNCERTAIN', label: 'I refer when uncertain or complex' },
              { id: 'REFER_EARLY', label: 'I refer early to ensure specialist review' },
            ] as { id: ReferralThreshold; label: string }[]).map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[qStyles.optionRow, gpProfile.referralThreshold === opt.id && qStyles.optionRowSelected]}
                onPress={() => setGpProfile((p) => ({ ...p, referralThreshold: opt.id }))}
              >
                <View style={[qStyles.radio, gpProfile.referralThreshold === opt.id && qStyles.radioSelected]} />
                <Text style={qStyles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Q7: Sick notes */}
            <Text style={[qStyles.qLabel, { marginTop: SPACING.md }]}>7. Sick note policy</Text>
            {([
              { id: 'LIBERAL', label: 'Liberal — flag for any likely indication' },
              { id: 'INDICATED', label: 'Only when clinically necessary' },
              { id: 'RARE', label: 'Rare — I rarely issue them' },
            ] as { id: SickNotePolicy; label: string }[]).map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[qStyles.optionRow, gpProfile.sickNotePolicy === opt.id && qStyles.optionRowSelected]}
                onPress={() => setGpProfile((p) => ({ ...p, sickNotePolicy: opt.id }))}
              >
                <View style={[qStyles.radio, gpProfile.sickNotePolicy === opt.id && qStyles.radioSelected]} />
                <Text style={qStyles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Q8: Special interests */}
            <Text style={[qStyles.qLabel, { marginTop: SPACING.md }]}>8. Special interests (optional)</Text>
            <TextInput
              style={qStyles.textInput}
              placeholder="e.g. HIV/ART, women's health, TB, sports medicine, occupational health..."
              placeholderTextColor={COLORS.textSecondary}
              value={gpProfile.specialInterests}
              onChangeText={(v) => setGpProfile((p) => ({ ...p, specialInterests: v }))}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            {/* Q9: Practice notes */}
            <Text style={[qStyles.qLabel, { marginTop: SPACING.md }]}>9. Anything else about your practice</Text>
            <TextInput
              style={qStyles.textInput}
              placeholder="e.g. Rural practice, limited investigations, public sector, Afrikaans-speaking patients..."
              placeholderTextColor={COLORS.textSecondary}
              value={gpProfile.practiceNotes}
              onChangeText={(v) => setGpProfile((p) => ({ ...p, practiceNotes: v }))}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <Button
              mode="contained"
              onPress={saveGPProfile}
              loading={savingProfile}
              disabled={savingProfile}
              buttonColor={COLORS.secondary}
              style={{ marginTop: SPACING.md, borderRadius: BORDER_RADIUS.md }}
            >
              Save Practice Profile
            </Button>
          </Surface>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>AI History Depth</Text>
            <Text style={styles.cardSubtitle}>
              Controls how thorough the AI is when taking patient history. Shorter flows reduce patient fatigue; comprehensive is best for complex or new patients.
            </Text>
            {HISTORY_DEPTH_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[qStyles.optionRow, aiHistoryDepth === opt.id && qStyles.optionRowSelected]}
                onPress={() => setAiHistoryDepth(opt.id)}
              >
                <View style={[qStyles.radio, aiHistoryDepth === opt.id && qStyles.radioSelected]} />
                <View style={{ flex: 1 }}>
                  <Text style={qStyles.optionLabel}>{opt.label}</Text>
                  <Text style={qStyles.optionSub}>{opt.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <Button
              mode="contained"
              onPress={saveAiHistoryDepth}
              loading={savingDepth}
              disabled={savingDepth || aiHistoryDepth === settings?.aiHistoryDepth}
              buttonColor={COLORS.primary}
              style={{ marginTop: SPACING.md, borderRadius: BORDER_RADIUS.md }}
            >
              Save History Preference
            </Button>
          </Surface>
          </>
        )}

        {/* ── Home Care & Medical Aid Quick Links ───────────────────────────── */}
        <View style={quickLinkStyles.row}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('HomeCarePlanner')}
            activeOpacity={0.82}
          >
            <Surface style={quickLinkStyles.card} elevation={1}>
              <Text style={quickLinkStyles.icon}>🏠</Text>
              <Text style={quickLinkStyles.label}>Home Care{'\n'}Planner</Text>
              <Text style={quickLinkStyles.badge}>Phase 2</Text>
            </Surface>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('MedicalAidClaim')}
            activeOpacity={0.82}
          >
            <Surface style={quickLinkStyles.card} elevation={1}>
              <Text style={quickLinkStyles.icon}>💳</Text>
              <Text style={quickLinkStyles.label}>Medical Aid{'\n'}Claims</Text>
              <Text style={quickLinkStyles.badge}>Phase 2</Text>
            </Surface>
          </TouchableOpacity>
        </View>

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

const modeStyles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  btnActive: {
    backgroundColor: COLORS.primary,
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  btnLabelActive: {
    color: COLORS.white,
  },
  activeDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.80)',
    marginTop: 2,
  },
});

const qStyles = StyleSheet.create({
  qLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  optionRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '0D',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  optionLabel: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    flexWrap: 'wrap',
  },
  optionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  chipSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary + '20',
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});

const quickLinkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  icon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
});
