import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { diagnosisApi } from '../../api/endpoints';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SHADOWS, SPACING } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type DiagnosisRouteParams = {
  DiagnosisScreen: { consultationId: string };
};

interface AIDiagnosis {
  name: string;
  icdCode: string;
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SelectedDiagnosis {
  name: string;
  icdCode?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROBABILITY_COLORS: Record<AIDiagnosis['probability'], string> = {
  HIGH: COLORS.error,
  MEDIUM: COLORS.warning,
  LOW: COLORS.info,
};

const PROBABILITY_TEXT_COLORS: Record<AIDiagnosis['probability'], string> = {
  HIGH: COLORS.white,
  MEDIUM: COLORS.text,
  LOW: COLORS.white,
};

/** Visual weight of the confidence bar per probability band. */
const PROBABILITY_FILL: Record<AIDiagnosis['probability'], `${number}%`> = {
  HIGH: '85%',
  MEDIUM: '55%',
  LOW: '25%',
};

const COMMON_SA_DIAGNOSES = [
  'Hypertension',
  'Diabetes T2',
  'TB',
  'HIV',
  'Asthma',
  'URTI',
];

// ─── Component ────────────────────────────────────────────────────────────────

export const DiagnosisScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<DiagnosisRouteParams, 'DiagnosisScreen'>>();
  const { consultationId } = route.params;

  const [aiDiagnoses, setAiDiagnoses] = useState<AIDiagnosis[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<SelectedDiagnosis[]>([]);
  const [customSearch, setCustomSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load AI diagnoses ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAI = async () => {
      try {
        const resp = await diagnosisApi.get(consultationId);
        const data = resp.data?.data;
        // Support both { diagnoses: [...] } and flat array responses
        const list: AIDiagnosis[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.diagnoses)
          ? data.diagnoses
          : Array.isArray(data?.differentialDiagnoses)
          ? data.differentialDiagnoses
          : [];
        setAiDiagnoses(list);
      } catch {
        // Silently fall back to empty list; doctor can still add manually
      } finally {
        setIsLoading(false);
      }
    };
    loadAI();
  }, [consultationId]);

  // ── Toggle AI diagnosis selection ────────────────────────────────────────────
  const toggleAIDiagnosis = useCallback(
    (diagnosis: AIDiagnosis) => {
      const exists = selectedDiagnoses.some((d) => d.name === diagnosis.name);
      if (exists) {
        setSelectedDiagnoses((prev) => prev.filter((d) => d.name !== diagnosis.name));
      } else {
        setSelectedDiagnoses((prev) => [
          ...prev,
          { name: diagnosis.name, icdCode: diagnosis.icdCode },
        ]);
      }
    },
    [selectedDiagnoses],
  );

  // ── Add common chip ──────────────────────────────────────────────────────────
  const addCommonDiagnosis = useCallback(
    (name: string) => {
      if (!selectedDiagnoses.some((d) => d.name === name)) {
        setSelectedDiagnoses((prev) => [...prev, { name }]);
      }
    },
    [selectedDiagnoses],
  );

  // ── Debounced custom search / add ────────────────────────────────────────────
  const handleCustomSearchChange = (text: string) => {
    setCustomSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) return;
    debounceRef.current = setTimeout(() => {
      // In a real app this would query an ICD-10 API; for now we just stage it
    }, 500);
  };

  const addCustomDiagnosis = () => {
    const trimmed = customSearch.trim();
    if (!trimmed) return;
    if (!selectedDiagnoses.some((d) => d.name === trimmed)) {
      setSelectedDiagnoses((prev) => [...prev, { name: trimmed }]);
    }
    setCustomSearch('');
  };

  const removeDiagnosis = (name: string) => {
    setSelectedDiagnoses((prev) => prev.filter((d) => d.name !== name));
  };

  // ── Confirm & navigate ───────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (selectedDiagnoses.length === 0) {
      Alert.alert('No diagnosis selected', 'Please select or add at least one diagnosis.');
      return;
    }
    setIsSaving(true);
    try {
      const [primary, ...differentials] = selectedDiagnoses;
      await diagnosisApi.select(
        consultationId,
        primary.name,
        [
          notes,
          differentials.length
            ? `Differentials considered: ${differentials.map((d) => d.name).join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
      navigation.navigate('Investigations', { consultationId });
    } catch (err) {
      Alert.alert('Error', 'Failed to save diagnosis. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isAISelected = (diagnosis: AIDiagnosis) =>
    selectedDiagnoses.some((d) => d.name === diagnosis.name);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Working Diagnosis</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── AI Differential Diagnoses ─────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>AI Differential Diagnoses</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Tap to select as working diagnosis</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>Analysing consultation...</Text>
            </View>
          ) : aiDiagnoses.length === 0 ? (
            <View style={styles.emptyAI}>
              <Ionicons name="bulb-outline" size={32} color={COLORS.textTertiary} />
              <Text style={styles.emptyAIText}>No AI suggestions available</Text>
              <Text style={styles.emptyAISubtext}>
                Search or add a diagnosis manually below
              </Text>
            </View>
          ) : (
            aiDiagnoses.map((dx) => {
              const selected = isAISelected(dx);
              return (
                <TouchableOpacity
                  key={dx.name}
                  style={[styles.aiCard, selected && styles.aiCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => toggleAIDiagnosis(dx)}
                >
                  <View style={styles.aiCardLeft}>
                    <Text style={styles.aiDxName}>{dx.name}</Text>
                    {dx.icdCode ? (
                      <Text style={styles.aiIcdCode}>{dx.icdCode}</Text>
                    ) : null}
                    <View style={styles.probabilityTrack}>
                      <View
                        style={[
                          styles.probabilityFill,
                          {
                            width: PROBABILITY_FILL[dx.probability],
                            backgroundColor: PROBABILITY_COLORS[dx.probability],
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.aiCardRight}>
                    <View
                      style={[
                        styles.probabilityBadge,
                        { backgroundColor: PROBABILITY_COLORS[dx.probability] },
                      ]}
                    >
                      <Text
                        style={[
                          styles.probabilityText,
                          { color: PROBABILITY_TEXT_COLORS[dx.probability] },
                        ]}
                      >
                        {dx.probability}
                      </Text>
                    </View>
                    <View style={[styles.checkmark, !selected && styles.checkmarkEmpty]}>
                      {selected && (
                        <Ionicons name="checkmark" size={15} color={COLORS.white} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Custom ICD-10 Search ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Or Search ICD-10 Code</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Type diagnosis or ICD-10 code..."
              placeholderTextColor={COLORS.textSecondary}
              value={customSearch}
              onChangeText={handleCustomSearchChange}
              returnKeyType="done"
              onSubmitEditing={addCustomDiagnosis}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={addCustomDiagnosis}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Common SA diagnoses chips */}
          <View style={styles.chipRow}>
            {COMMON_SA_DIAGNOSES.map((name) => (
              <TouchableOpacity
                key={name}
                style={[
                  styles.chip,
                  selectedDiagnoses.some((d) => d.name === name) && styles.chipSelected,
                ]}
                onPress={() => addCommonDiagnosis(name)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDiagnoses.some((d) => d.name === name) && styles.chipTextSelected,
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Selected Diagnoses ────────────────────────────────────────────── */}
        {selectedDiagnoses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Diagnoses</Text>
            {selectedDiagnoses.map((dx, index) => (
              <View key={dx.name} style={styles.selectedCard}>
                <View style={styles.selectedLeft}>
                  {index === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                    </View>
                  )}
                  <Text style={styles.selectedName}>{dx.name}</Text>
                  {dx.icdCode ? (
                    <Text style={styles.selectedIcd}>{dx.icdCode}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeDiagnosis(dx.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Doctor Notes ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Additional clinical notes..."
            placeholderTextColor={COLORS.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Confirm Button ────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, isSaving && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {selectedDiagnoses.length > 0
                ? `Confirm Diagnosis (${selectedDiagnoses.length})`
                : 'Confirm Diagnosis'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  emptyAI: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emptyAIText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  emptyAISubtext: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  aiCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.healingMint,
  },
  aiCardLeft: {
    flex: 1,
  },
  aiCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiDxName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  aiIcdCode: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  probabilityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  probabilityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  probabilityTrack: {
    height: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.systemGray5,
    marginTop: SPACING.xs + 2,
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  probabilityFill: {
    height: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.systemGray4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  selectedLeft: {
    flex: 1,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginBottom: SPACING.xs,
  },
  primaryBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  selectedName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedIcd: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    minHeight: 100,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.md,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});

export default DiagnosisScreen;
