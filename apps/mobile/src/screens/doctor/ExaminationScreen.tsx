import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { consultationApi } from '../../api/endpoints';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../../constants/theme';

// ---------- Types ----------

type ExaminationRouteParams = {
  Examination: {
    consultationId: string;
  };
};

interface VitalSigns {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  painScore: number;
}

interface GeneralExamination {
  generalAppearance: string;
  handsNails: string;
  headNeck: string;
  jvp: string;
  lymphNodes: string;
}

interface SystemicExamination {
  cardiovascular: string;
  respiratory: string;
  abdominal: string;
  neurological: string;
  msk: string;
  skin: string;
}

interface ExaminationState {
  vitalSigns: VitalSigns;
  generalExamination: GeneralExamination;
  systemicExamination: SystemicExamination;
}

// ---------- BMI calculation ----------

function calculateBMI(weight: string, height: string): number | null {
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100; // cm → m
  if (!w || !h || h === 0) return null;
  return w / (h * h);
}

interface BMIResult {
  value: number;
  label: string;
  color: string;
}

function getBMIResult(bmi: number): BMIResult {
  if (bmi < 18.5) return { value: bmi, label: 'Underweight', color: COLORS.warning };
  if (bmi < 25) return { value: bmi, label: 'Normal', color: COLORS.success };
  if (bmi < 30) return { value: bmi, label: 'Overweight', color: COLORS.accent };
  return { value: bmi, label: 'Obese', color: COLORS.error };
}

// ---------- ExpandableSection ----------

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  return (
    <View style={exStyles.expandableCard}>
      <TouchableOpacity style={exStyles.expandableHeader} onPress={toggle} activeOpacity={0.7}>
        <Text style={exStyles.expandableTitle}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
      <Animated.View
        style={{
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 600],
          }),
          opacity: animatedHeight,
          overflow: 'hidden',
        }}
      >
        <View style={exStyles.expandableContent}>{children}</View>
      </Animated.View>
    </View>
  );
};

// ---------- Helper: labeled input ----------

interface LabeledInputProps {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  placeholder?: string;
  unit?: string;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  hint,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  placeholder,
  unit,
}) => (
  <View style={exStyles.fieldContainer}>
    <View style={exStyles.fieldLabelRow}>
      <Text style={exStyles.fieldLabel}>{label}</Text>
      {unit ? <Text style={exStyles.fieldUnit}>{unit}</Text> : null}
    </View>
    {hint ? <Text style={exStyles.fieldHint}>{hint}</Text> : null}
    <TextInput
      style={[
        exStyles.textInput,
        multiline && { minHeight: numberOfLines * 22 + SPACING.md * 2, textAlignVertical: 'top' },
      ]}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : undefined}
      placeholder={placeholder ?? (hint ? hint.replace(/[()]/g, '').trim() : label)}
      placeholderTextColor={COLORS.textSecondary}
    />
  </View>
);

// ---------- Helper: vital sign input tile ----------

interface VitalTileProps {
  label: string;
  unit: string;
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'numeric' | 'decimal-pad';
  wide?: boolean;
}

const VitalTile: React.FC<VitalTileProps> = ({
  label,
  unit,
  hint,
  value,
  onChangeText,
  keyboardType = 'numeric',
  wide = false,
}) => (
  <View style={[exStyles.vitalTile, wide && exStyles.vitalTileWide]}>
    <View style={exStyles.vitalTileHeader}>
      <Text style={exStyles.vitalTileLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={exStyles.vitalTileUnit}>{unit}</Text>
    </View>
    <TextInput
      style={exStyles.vitalTileInput}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder="—"
      placeholderTextColor={COLORS.textTertiary}
      maxLength={6}
    />
    {hint ? <Text style={exStyles.vitalTileHint}>Normal {hint}</Text> : null}
  </View>
);

// ---------- Payload helpers ----------

/** Parse a text input into a number, returning undefined for empty/invalid values. */
function parseNum(s: string): number | undefined {
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

/** Keep only non-empty (trimmed) string fields of a record. */
function trimmedFields<T extends { [K in keyof T]: string }>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as Array<keyof T>).forEach((key) => {
    const v = obj[key].trim();
    if (v) out[key] = v as T[keyof T];
  });
  return out;
}

// ---------- Tabs ----------

const TABS = ['Vital Signs', 'General Exam', 'Systemic Exam'];

// ---------- Main Screen ----------

const ExaminationScreen: React.FC = () => {
  const route = useRoute<RouteProp<ExaminationRouteParams, 'Examination'>>();
  const navigation = useNavigation<any>();
  const { consultationId } = route.params;

  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);

  const [state, setState] = useState<ExaminationState>({
    vitalSigns: {
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      painScore: 0,
    },
    generalExamination: {
      generalAppearance: '',
      handsNails: '',
      headNeck: '',
      jvp: '',
      lymphNodes: '',
    },
    systemicExamination: {
      cardiovascular: '',
      respiratory: '',
      abdominal: '',
      neurological: '',
      msk: '',
      skin: '',
    },
  });

  // Helpers to update nested state
  const setVital = (field: keyof VitalSigns, value: string | number) => {
    setState((prev) => ({
      ...prev,
      vitalSigns: { ...prev.vitalSigns, [field]: value },
    }));
  };

  const setGeneral = (field: keyof GeneralExamination, value: string) => {
    setState((prev) => ({
      ...prev,
      generalExamination: { ...prev.generalExamination, [field]: value },
    }));
  };

  const setSystemic = (field: keyof SystemicExamination, value: string) => {
    setState((prev) => ({
      ...prev,
      systemicExamination: { ...prev.systemicExamination, [field]: value },
    }));
  };

  const bmi = calculateBMI(state.vitalSigns.weight, state.vitalSigns.height);
  const bmiResult = bmi ? getBMIResult(bmi) : null;

  const handleSave = async () => {
    try {
      setSaving(true);
      const { vitalSigns, generalExamination, systemicExamination } = state;

      await consultationApi.saveExamination({
        consultationId,
        // Numeric vitals — empty inputs are omitted (undefined)
        vitalSigns: {
          bloodPressureSystolic: parseNum(vitalSigns.bloodPressureSystolic),
          bloodPressureDiastolic: parseNum(vitalSigns.bloodPressureDiastolic),
          heartRate: parseNum(vitalSigns.heartRate),
          respiratoryRate: parseNum(vitalSigns.respiratoryRate),
          temperature: parseNum(vitalSigns.temperature),
          oxygenSaturation: parseNum(vitalSigns.oxygenSaturation),
          weight: parseNum(vitalSigns.weight),
          height: parseNum(vitalSigns.height),
          painScore: vitalSigns.painScore,
        },
        // Both examination sections are structured objects per the API schema
        generalExamination: trimmedFields(generalExamination),
        systemicExamination: trimmedFields(systemicExamination),
      });

      navigation.navigate('Diagnosis', { consultationId });
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.error ?? 'Failed to save examination findings. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------- Tab content ----------

  const renderVitalSigns = () => (
    <ScrollView
      style={exStyles.tabScrollView}
      contentContainerStyle={exStyles.tabScrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={exStyles.tabSectionHeading}>Blood Pressure</Text>
      <View style={exStyles.vitalGrid}>
        <VitalTile
          label="Systolic"
          unit="mmHg"
          hint="90–120"
          value={state.vitalSigns.bloodPressureSystolic}
          onChangeText={(v) => setVital('bloodPressureSystolic', v)}
        />
        <VitalTile
          label="Diastolic"
          unit="mmHg"
          hint="60–80"
          value={state.vitalSigns.bloodPressureDiastolic}
          onChangeText={(v) => setVital('bloodPressureDiastolic', v)}
        />
      </View>

      <Text style={exStyles.tabSectionHeading}>Vital Signs</Text>
      <View style={exStyles.vitalGrid}>
        <VitalTile
          label="Heart Rate"
          unit="bpm"
          hint="60–100"
          value={state.vitalSigns.heartRate}
          onChangeText={(v) => setVital('heartRate', v)}
        />
        <VitalTile
          label="Resp. Rate"
          unit="/min"
          hint="12–20"
          value={state.vitalSigns.respiratoryRate}
          onChangeText={(v) => setVital('respiratoryRate', v)}
        />
        <VitalTile
          label="Temperature"
          unit="°C"
          hint="36.5–37.5"
          value={state.vitalSigns.temperature}
          onChangeText={(v) => setVital('temperature', v)}
          keyboardType="decimal-pad"
        />
        <VitalTile
          label="SpO2"
          unit="%"
          hint="95–100"
          value={state.vitalSigns.oxygenSaturation}
          onChangeText={(v) => setVital('oxygenSaturation', v)}
        />
      </View>

      <Text style={exStyles.tabSectionHeading}>Anthropometry</Text>
      <View style={exStyles.vitalGrid}>
        <VitalTile
          label="Weight"
          unit="kg"
          value={state.vitalSigns.weight}
          onChangeText={(v) => setVital('weight', v)}
          keyboardType="decimal-pad"
        />
        <VitalTile
          label="Height"
          unit="cm"
          value={state.vitalSigns.height}
          onChangeText={(v) => setVital('height', v)}
          keyboardType="decimal-pad"
        />
      </View>

      {bmiResult && (
        <View style={[exStyles.bmiCard, { borderColor: bmiResult.color }]}>
          <Text style={exStyles.bmiLabel}>BMI</Text>
          <Text style={[exStyles.bmiValue, { color: bmiResult.color }]}>
            {bmiResult.value.toFixed(1)}
          </Text>
          <View style={[exStyles.bmiCategoryBadge, { backgroundColor: bmiResult.color }]}>
            <Text style={exStyles.bmiCategoryText}>{bmiResult.label}</Text>
          </View>
        </View>
      )}

      <Text style={exStyles.tabSectionHeading}>Pain Assessment</Text>
      <View style={exStyles.painContainer}>
        <View style={exStyles.painLabelRow}>
          <Text style={exStyles.fieldLabel}>Pain Score</Text>
          <View style={exStyles.painScoreBadge}>
            <Text style={exStyles.painScoreValue}>{state.vitalSigns.painScore}</Text>
            <Text style={exStyles.painScoreMax}>/10</Text>
          </View>
        </View>
        <View style={exStyles.painScaleLabels}>
          <Text style={exStyles.painScaleEnd}>No Pain</Text>
          <Text style={exStyles.painScaleEnd}>Worst</Text>
        </View>
        <Slider
          style={exStyles.slider}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={state.vitalSigns.painScore}
          onValueChange={(v) => setVital('painScore', v)}
          minimumTrackTintColor={
            state.vitalSigns.painScore <= 3
              ? COLORS.success
              : state.vitalSigns.painScore <= 6
                ? COLORS.warning
                : COLORS.error
          }
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={COLORS.primary}
        />
        <View style={exStyles.painTickRow}>
          {Array.from({ length: 11 }, (_, i) => (
            <Text key={i} style={exStyles.painTick}>
              {i}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );

  const renderGeneralExam = () => (
    <ScrollView
      style={exStyles.tabScrollView}
      contentContainerStyle={exStyles.tabScrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={exStyles.tabSectionHeading}>General Examination</Text>
      <View style={exStyles.examCard}>
      <LabeledInput
        label="General Appearance"
        value={state.generalExamination.generalAppearance}
        onChangeText={(v) => setGeneral('generalAppearance', v)}
        multiline
        numberOfLines={4}
        placeholder="Describe patient's general appearance..."
      />
      <LabeledInput
        label="Hands & Nails"
        value={state.generalExamination.handsNails}
        onChangeText={(v) => setGeneral('handsNails', v)}
        multiline
        numberOfLines={4}
        placeholder="Describe hands and nails..."
      />
      <LabeledInput
        label="Head & Neck"
        value={state.generalExamination.headNeck}
        onChangeText={(v) => setGeneral('headNeck', v)}
        multiline
        numberOfLines={4}
        placeholder="Describe head and neck..."
      />
      <LabeledInput
        label="JVP"
        value={state.generalExamination.jvp}
        onChangeText={(v) => setGeneral('jvp', v)}
        multiline
        numberOfLines={4}
        placeholder="Describe JVP findings..."
      />
      <LabeledInput
        label="Lymph Nodes"
        value={state.generalExamination.lymphNodes}
        onChangeText={(v) => setGeneral('lymphNodes', v)}
        multiline
        numberOfLines={4}
        placeholder="Describe lymph node findings..."
      />
      </View>
      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );

  const renderSystemicExam = () => (
    <ScrollView
      style={exStyles.tabScrollView}
      contentContainerStyle={exStyles.tabScrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={exStyles.tabSectionHeading}>Systemic Examination</Text>
      {(
        [
          { key: 'cardiovascular', label: 'Cardiovascular' },
          { key: 'respiratory', label: 'Respiratory' },
          { key: 'abdominal', label: 'Abdominal' },
          { key: 'neurological', label: 'Neurological' },
          { key: 'msk', label: 'MSK (Musculoskeletal)' },
          { key: 'skin', label: 'Skin' },
        ] as { key: keyof SystemicExamination; label: string }[]
      ).map(({ key, label }) => (
        <ExpandableSection key={key} title={label}>
          <TextInput
            style={exStyles.systemicInput}
            multiline
            numberOfLines={4}
            value={state.systemicExamination[key]}
            onChangeText={(v) => setSystemic(key, v)}
            placeholder={`Enter ${label} findings...`}
            placeholderTextColor={COLORS.textSecondary}
            textAlignVertical="top"
          />
        </ExpandableSection>
      ))}
      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={exStyles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={exStyles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={exStyles.header}>
          <TouchableOpacity
            style={exStyles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={exStyles.headerTitle}>Examination</Text>
          <View style={exStyles.headerRight} />
        </View>

        {/* ── Custom Tab Bar ── */}
        <View style={exStyles.tabBar}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              style={[exStyles.tabItem, activeTab === idx && exStyles.tabItemActive]}
              onPress={() => setActiveTab(idx)}
              activeOpacity={0.7}
            >
              <Text style={[exStyles.tabLabel, activeTab === idx && exStyles.tabLabelActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab Content ── */}
        <View style={exStyles.tabContent}>
          {activeTab === 0 && renderVitalSigns()}
          {activeTab === 1 && renderGeneralExam()}
          {activeTab === 2 && renderSystemicExam()}
        </View>

        {/* ── Fixed Save Button ── */}
        <View style={exStyles.saveBar}>
          <TouchableOpacity
            style={[exStyles.saveButton, saving && exStyles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                <Text style={exStyles.saveButtonText}>Save Findings</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------- Styles ----------

const exStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Tab content
  tabContent: {
    flex: 1,
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    padding: SPACING.md,
  },
  tabSectionHeading: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // Field
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  fieldUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  fieldHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },

  // Vital tiles
  vitalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  vitalTile: {
    width: '48.5%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    paddingBottom: SPACING.xs + 2,
    marginBottom: SPACING.sm,
    ...SHADOWS.xs,
  },
  vitalTileWide: {
    width: '100%',
  },
  vitalTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  vitalTileLabel: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginRight: SPACING.xs,
  },
  vitalTileUnit: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.healingMint,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.xs,
    overflow: 'hidden',
  },
  vitalTileInput: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    minHeight: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  vitalTileHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },

  // Exam section card
  examCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    paddingBottom: 0,
    marginBottom: SPACING.md,
    ...SHADOWS.xs,
  },

  // BMI
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  bmiLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    width: 36,
  },
  bmiValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    flex: 1,
  },
  bmiCategoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  bmiCategoryText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Pain
  painContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  painLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  painScoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  painScoreValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  painScoreMax: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.75)',
    marginLeft: 1,
  },
  painScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  painScaleEnd: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  slider: {
    width: '100%',
    height: 44,
  },
  painTickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  painTick: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    width: 18,
    textAlign: 'center',
  },

  // Expandable (systemic)
  expandableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    minHeight: 44,
  },
  expandableTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  expandableContent: {
    padding: SPACING.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  systemicInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    minHeight: 96,
    backgroundColor: COLORS.background,
    marginTop: SPACING.sm,
  },

  // Save bar
  saveBar: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.md,
  },
  saveButton: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});

export default ExaminationScreen;
