import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, Alert, Share, TouchableOpacity,
} from 'react-native';
import {
  Text, Surface, Button, TextInput, Chip, Switch,
  ActivityIndicator, Snackbar, IconButton, Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE, TYPOGRAPHY,
} from '../../constants/theme';
import { prescriptionsApi } from '../../api/endpoints';

// ─────────────────────────────────────────────────────────────
// Types — mirror the API contract (apps/api/src/routes/prescriptions.ts)
// ─────────────────────────────────────────────────────────────

const ROUTES = [
  'Oral', 'IV', 'IM', 'Topical', 'Subcutaneous',
  'Inhaled', 'Rectal', 'Sublingual', 'Nasal', 'Other',
] as const;

type DrugRoute = (typeof ROUTES)[number];

/** Item shape returned by (and sent to) the API. */
interface ApiPrescriptionItem {
  medication: string;
  dose: string;
  route: DrugRoute;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  isScheduled: boolean;
  scheduleNumber?: number;
  repetitions?: number;
}

/** Decrypted prescription record from GET /prescriptions/consultation/:id */
interface Prescription {
  id: string;
  scriptNumber: string;
  issueDate: string;
  validUntilDate?: string | null;
  items: ApiPrescriptionItem[];
  containsDDA: boolean;
  isRepeat: boolean;
  repeatTotal: number;
  repeatRemaining: number;
  status: string; // ISSUED | DISPENSED | CANCELLED | EXPIRED
  doctorName: string;
  doctorHPCSA: string;
  doctorPracticeNumber?: string | null;
}

/** Local form state (strings for numeric inputs). */
interface FormItem {
  drugName: string;
  strength: string;
  dose: string;
  route: DrugRoute;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
  isScheduled: boolean;
  scheduleNumber?: number;
}

interface Props {
  route?: {
    params?: {
      consultationId?: string;
      patientName?: string;
      patientId?: string;
    };
  };
}

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed (PRN)', 'Once weekly', 'Other'];
const SCHEDULE_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

function createEmptyItem(): FormItem {
  return {
    drugName: '',
    strength: '',
    dose: '',
    route: 'Oral',
    frequency: 'Twice daily',
    duration: '7 days',
    quantity: '',
    instructions: 'Take with food',
    isScheduled: false,
  };
}

function apiErrorMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
  );
}

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function PrescriptionScreen({ route }: Props) {
  const navigation = useNavigation();
  const consultationId = route?.params?.consultationId ?? '';
  const patientName = route?.params?.patientName ?? 'Patient';

  const [existingPrescriptions, setExistingPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNewRx, setShowNewRx] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  // New Rx state
  const [items, setItems] = useState<FormItem[]>([createEmptyItem()]);
  const [isRepeat, setIsRepeat] = useState(false);
  const [repeatTotal, setRepeatTotal] = useState('3');
  const [expandedItem, setExpandedItem] = useState(0);

  const loadExistingPrescriptions = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await prescriptionsApi.getForConsultation(consultationId);
      setExistingPrescriptions(res.data.data?.prescriptions ?? []);
    } catch (err: unknown) {
      setLoadError(apiErrorMessage(err, 'Could not load prescriptions for this consultation.'));
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    if (!consultationId) {
      setLoading(false);
      return;
    }
    loadExistingPrescriptions();
  }, [consultationId, loadExistingPrescriptions]);

  function addItem() {
    setItems([...items, createEmptyItem()]);
    setExpandedItem(items.length);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      setSnackbar('A prescription must have at least one item');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
    setExpandedItem(Math.max(0, expandedItem - 1));
  }

  function updateItem(index: number, field: keyof FormItem, value: string | boolean | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  async function issuePrescription() {
    // Mirror the API's zod validation client-side
    for (const item of items) {
      if (!item.drugName.trim() || !item.dose.trim() || !item.duration.trim() || !item.instructions.trim()) {
        setSnackbar('Each item needs a drug name, dose, duration, and patient instructions');
        return;
      }
      const qty = parseInt(item.quantity, 10);
      if (!Number.isInteger(qty) || qty <= 0) {
        setSnackbar('Each item needs a whole-number quantity greater than 0');
        return;
      }
      if (item.isScheduled && !item.scheduleNumber) {
        setSnackbar(`"${item.drugName}" is a scheduled substance — select its schedule number (1–7)`);
        return;
      }
    }

    const repeats = parseInt(repeatTotal, 10);
    if (isRepeat && (!Number.isInteger(repeats) || repeats < 1 || repeats > 11)) {
      setSnackbar('Repeat total must be between 1 and 11');
      return;
    }

    const payload = {
      consultationId,
      items: items.map((item) => ({
        medication: [item.drugName.trim(), item.strength.trim()].filter(Boolean).join(' '),
        dose: item.dose.trim(),
        route: item.route,
        frequency: item.frequency,
        duration: item.duration.trim(),
        quantity: parseInt(item.quantity, 10),
        instructions: item.instructions.trim(),
        isScheduled: item.isScheduled,
        ...(item.isScheduled && item.scheduleNumber
          ? { scheduleNumber: item.scheduleNumber }
          : {}),
      })),
      isRepeat,
      ...(isRepeat ? { repeatTotal: repeats } : {}),
    };

    setSaving(true);
    try {
      const res = await prescriptionsApi.create(payload);
      const scriptNumber = res.data.data?.scriptNumber;
      setSnackbar(scriptNumber ? `Prescription ${scriptNumber} issued` : 'Prescription issued successfully');
      setShowNewRx(false);
      setItems([createEmptyItem()]);
      setIsRepeat(false);
      loadExistingPrescriptions();
    } catch (err: unknown) {
      setSnackbar(apiErrorMessage(err, 'Failed to issue prescription'));
    } finally {
      setSaving(false);
    }
  }

  function cancelPrescription(id: string, scriptNumber: string) {
    Alert.alert(
      'Cancel Prescription',
      `Cancel script ${scriptNumber}? This cannot be undone.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Script',
          style: 'destructive',
          onPress: async () => {
            try {
              await prescriptionsApi.cancel(id, 'Cancelled by prescribing doctor');
              setSnackbar('Prescription cancelled');
              loadExistingPrescriptions();
            } catch (err: unknown) {
              setSnackbar(apiErrorMessage(err, 'Failed to cancel prescription'));
            }
          },
        },
      ]
    );
  }

  async function viewPrescription(id: string, scriptNumber: string) {
    try {
      // GET /prescriptions/:id/pdf returns raw HTML (not the JSON envelope)
      const res = await prescriptionsApi.getPdf(id);
      const html = typeof res.data === 'string' ? res.data : String(res.data ?? '');
      await Share.share({
        title: `Prescription ${scriptNumber}`,
        message: html,
      });
    } catch (err: unknown) {
      setSnackbar(apiErrorMessage(err, 'Failed to open prescription'));
    }
  }

  // ── Header (consistent back chevron + title) ──
  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backArrow}>{'‹'}</Text>
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Prescription</Text>
      <View style={styles.headerRight} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Loading prescriptions…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {header}
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.centerText}>{loadError}</Text>
          <Button
            mode="contained"
            onPress={() => { setLoading(true); loadExistingPrescriptions(); }}
            buttonColor={COLORS.primary}
            style={styles.retryBtn}
            contentStyle={styles.btn44}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {header}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {patientName !== 'Patient' && (
          <Text style={styles.patientName}>Patient: {patientName}</Text>
        )}

        {/* Existing prescriptions */}
        {existingPrescriptions.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Issued Scripts</Text>
            {existingPrescriptions.map((rx) => (
              <Surface key={rx.id} style={[styles.rxCard, rx.status !== 'ISSUED' && styles.rxCardInactive]} elevation={1}>
                <View style={styles.rxHeader}>
                  <View style={styles.rxHeaderLeft}>
                    <Text style={styles.rxScriptNumber}>{rx.scriptNumber}</Text>
                    <Text style={styles.rxMeta}>
                      {rx.items.length} item{rx.items.length !== 1 ? 's' : ''} ·{' '}
                      {rx.isRepeat ? `Repeat ×${rx.repeatTotal} (${rx.repeatRemaining} remaining)` : 'Once-off'}
                      {rx.containsDDA ? ' · ' : ''}
                      {rx.containsDDA && <Text style={styles.ddaTag}>DDA</Text>}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, getStatusStyle(rx.status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(rx.status)]}>{rx.status}</Text>
                  </View>
                </View>

                {rx.items.map((item, i) => (
                  <View key={i} style={styles.rxItem}>
                    <Text style={styles.rxItemName}>
                      {item.medication}
                      {item.isScheduled && <Text style={styles.schedTag}> [Sch {item.scheduleNumber}]</Text>}
                    </Text>
                    <Text style={styles.rxItemDetail}>
                      {item.dose} · {item.route} · {item.frequency} × {item.duration} — Qty: {item.quantity}
                    </Text>
                    {!!item.instructions && (
                      <Text style={styles.rxItemInstructions}>{item.instructions}</Text>
                    )}
                  </View>
                ))}

                <View style={styles.rxValidity}>
                  <Text style={styles.rxValidText}>
                    {rx.validUntilDate ? `Valid until: ${formatDate(rx.validUntilDate)}` : `Issued: ${formatDate(rx.issueDate)}`}
                  </Text>
                  <View style={styles.rxActions}>
                    <Button
                      mode="outlined"
                      compact
                      icon="printer"
                      onPress={() => viewPrescription(rx.id, rx.scriptNumber)}
                      textColor={COLORS.primary}
                      style={styles.rxActionBtn}
                      contentStyle={styles.btn44}
                    >
                      View
                    </Button>
                    {rx.status === 'ISSUED' && (
                      <Button
                        mode="outlined"
                        compact
                        icon="close"
                        onPress={() => cancelPrescription(rx.id, rx.scriptNumber)}
                        textColor={COLORS.error}
                        style={[styles.rxActionBtn, { borderColor: COLORS.error + '40' }]}
                        contentStyle={styles.btn44}
                      >
                        Cancel
                      </Button>
                    )}
                  </View>
                </View>
              </Surface>
            ))}
          </>
        ) : (
          !showNewRx && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="prescription" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No prescriptions yet</Text>
              <Text style={styles.emptyText}>
                No scripts have been issued for this consultation. Tap below to issue one.
              </Text>
            </View>
          )
        )}

        {/* New prescription form */}
        {!showNewRx ? (
          <Button
            mode="contained"
            icon="prescription"
            onPress={() => setShowNewRx(true)}
            buttonColor={COLORS.primary}
            style={styles.newRxBtn}
            contentStyle={{ height: 52 }}
            labelStyle={{ fontSize: FONT_SIZE.md }}
          >
            Issue New Prescription
          </Button>
        ) : (
          <>
            <Text style={styles.sectionTitle}>New Prescription</Text>

            {/* Repeat toggle */}
            <Surface style={styles.repeatCard} elevation={1}>
              <View style={styles.repeatRow}>
                <View>
                  <Text style={styles.cardTitle}>Repeat Prescription</Text>
                  <Text style={styles.cardSub}>
                    Patient may collect this {isRepeat ? repeatTotal : '1'} time{isRepeat && parseInt(repeatTotal, 10) !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Switch
                  value={isRepeat}
                  onValueChange={setIsRepeat}
                  color={COLORS.primary}
                />
              </View>
              {isRepeat && (
                <TextInput
                  mode="outlined"
                  label="Number of repeats (1–11)"
                  value={repeatTotal}
                  onChangeText={setRepeatTotal}
                  keyboardType="number-pad"
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={styles.repeatInput}
                  dense
                />
              )}
            </Surface>

            {/* Drug items */}
            {items.map((item, index) => (
              <Surface key={index} style={styles.itemCard} elevation={1}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>
                    Item {index + 1}{item.drugName ? ': ' + item.drugName : ''}
                    {item.isScheduled && <Text style={styles.schedTag}> [Sch {item.scheduleNumber ?? '?'}]</Text>}
                  </Text>
                  <View style={styles.itemHeaderActions}>
                    <IconButton
                      icon={expandedItem === index ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      onPress={() => setExpandedItem(expandedItem === index ? -1 : index)}
                    />
                    {items.length > 1 && (
                      <IconButton
                        icon="trash-can-outline"
                        size={22}
                        iconColor={COLORS.error}
                        onPress={() => removeItem(index)}
                      />
                    )}
                  </View>
                </View>

                {expandedItem === index && (
                  <>
                    <TextInput
                      mode="outlined"
                      label="Drug Name *"
                      placeholder="e.g. Amoxicillin"
                      value={item.drugName}
                      onChangeText={(v) => updateItem(index, 'drugName', v)}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      style={styles.field}
                    />
                    <View style={styles.twoCol}>
                      <TextInput
                        mode="outlined"
                        label="Strength"
                        placeholder="e.g. 500mg"
                        value={item.strength}
                        onChangeText={(v) => updateItem(index, 'strength', v)}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                        style={[styles.field, styles.halfField]}
                      />
                      <TextInput
                        mode="outlined"
                        label="Dose *"
                        placeholder="e.g. 1 tablet"
                        value={item.dose}
                        onChangeText={(v) => updateItem(index, 'dose', v)}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                        style={[styles.field, styles.halfField]}
                      />
                    </View>

                    <Text style={styles.chipLabel}>Route *</Text>
                    <View style={styles.chipRow}>
                      {ROUTES.map((r) => (
                        <Chip
                          key={r}
                          selected={item.route === r}
                          onPress={() => updateItem(index, 'route', r)}
                          compact
                          style={[styles.chip, item.route === r && styles.chipSelected]}
                          textStyle={item.route === r ? styles.chipTextSelected : styles.chipText}
                        >
                          {r}
                        </Chip>
                      ))}
                    </View>

                    <Text style={styles.chipLabel}>Frequency *</Text>
                    <View style={styles.chipRow}>
                      {FREQUENCIES.map((freq) => (
                        <Chip
                          key={freq}
                          selected={item.frequency === freq}
                          onPress={() => updateItem(index, 'frequency', freq)}
                          compact
                          style={[styles.chip, item.frequency === freq && styles.chipSelected]}
                          textStyle={item.frequency === freq ? styles.chipTextSelected : styles.chipText}
                        >
                          {freq}
                        </Chip>
                      ))}
                    </View>

                    <View style={styles.twoCol}>
                      <TextInput
                        mode="outlined"
                        label="Duration *"
                        placeholder="e.g. 7 days"
                        value={item.duration}
                        onChangeText={(v) => updateItem(index, 'duration', v)}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                        style={[styles.field, styles.halfField]}
                      />
                      <TextInput
                        mode="outlined"
                        label="Total Quantity *"
                        placeholder="e.g. 21"
                        value={item.quantity}
                        onChangeText={(v) => updateItem(index, 'quantity', v)}
                        keyboardType="number-pad"
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                        style={[styles.field, styles.halfField]}
                      />
                    </View>

                    <TextInput
                      mode="outlined"
                      label="Instructions for patient *"
                      placeholder="e.g. Take with food. Complete course."
                      value={item.instructions}
                      onChangeText={(v) => updateItem(index, 'instructions', v)}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      style={styles.field}
                      multiline
                      numberOfLines={2}
                    />

                    <Divider style={styles.divider} />

                    {/* Scheduled substance */}
                    <View style={styles.switchRow}>
                      <View style={styles.switchLabelWrap}>
                        <Text style={styles.switchLabel}>Scheduled Substance</Text>
                        <Text style={styles.switchHint}>Schedule 1–7 medicines require special handling</Text>
                      </View>
                      <Switch
                        value={item.isScheduled}
                        onValueChange={(v) => updateItem(index, 'isScheduled', v)}
                        color={COLORS.warning}
                      />
                    </View>

                    {item.isScheduled && (
                      <>
                        <Text style={styles.chipLabel}>Schedule Number *</Text>
                        <View style={styles.chipRow}>
                          {SCHEDULE_NUMBERS.map((n) => (
                            <Chip
                              key={n}
                              selected={item.scheduleNumber === n}
                              onPress={() => updateItem(index, 'scheduleNumber', n)}
                              compact
                              style={[
                                styles.chip,
                                item.scheduleNumber === n && { backgroundColor: COLORS.warning },
                              ]}
                              textStyle={item.scheduleNumber === n ? styles.chipTextSelected : styles.chipText}
                            >
                              S{n}
                            </Chip>
                          ))}
                        </View>

                        <Surface style={styles.ddaWarning} elevation={0}>
                          <Text style={styles.ddaWarningText}>
                            Scheduled substances are flagged as DDA and may require a government-issued
                            triplicate prescription pad. Ensure this prescription is also written in the
                            physical DDA book where applicable — electronic prescribing is supplementary only.
                          </Text>
                        </Surface>
                      </>
                    )}
                  </>
                )}
              </Surface>
            ))}

            <Button
              mode="outlined"
              icon="plus"
              onPress={addItem}
              textColor={COLORS.primary}
              style={styles.addItemBtn}
              contentStyle={styles.btn44}
            >
              Add Another Drug
            </Button>

            {/* Issue / Discard buttons */}
            <View style={styles.issueRow}>
              <Button
                mode="outlined"
                onPress={() => { setShowNewRx(false); setItems([createEmptyItem()]); }}
                style={styles.discardBtn}
                textColor={COLORS.textSecondary}
                contentStyle={styles.btn44}
              >
                Discard
              </Button>
              <Button
                mode="contained"
                onPress={issuePrescription}
                loading={saving}
                disabled={saving}
                buttonColor={COLORS.primary}
                style={styles.issueBtn}
                contentStyle={styles.btn44}
                icon="check"
              >
                Issue Prescription
              </Button>
            </View>

            {/* Legal notice */}
            <Surface style={styles.legalCard} elevation={0}>
              <Text style={styles.legalText}>
                By issuing this prescription you confirm you are a registered HPCSA practitioner and this prescription is clinically appropriate for the patient. MedAI prescriptions are digitally signed and logged for audit purposes.
              </Text>
            </Surface>
          </>
        )}
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3500}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'ISSUED': return { backgroundColor: COLORS.secondary + '20' };
    case 'DISPENSED': return { backgroundColor: COLORS.primary + '15' };
    case 'CANCELLED': return { backgroundColor: COLORS.error + '15' };
    case 'EXPIRED': return { backgroundColor: COLORS.textSecondary + '20' };
    default: return { backgroundColor: COLORS.systemGray6 };
  }
}

function getStatusTextStyle(status: string) {
  switch (status) {
    case 'ISSUED': return { color: COLORS.secondary };
    case 'DISPENSED': return { color: COLORS.primary };
    case 'CANCELLED': return { color: COLORS.error };
    case 'EXPIRED': return { color: COLORS.textSecondary };
    default: return { color: COLORS.textSecondary };
  }
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  body: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  centerText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  errorTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  retryBtn: { marginTop: SPACING.md, borderRadius: BORDER_RADIUS.md },
  btn44: { minHeight: 44 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    minHeight: 44,
  },
  backArrow: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 28,
    marginRight: 2,
  },
  backLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
    fontWeight: '500',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { minWidth: 60 },

  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  patientName: { ...TYPOGRAPHY.subheadline, color: COLORS.textSecondary, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.sm },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: { ...TYPOGRAPHY.headline, color: COLORS.text, marginTop: SPACING.sm },
  emptyText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  rxCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  rxCardInactive: { opacity: 0.7 },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  rxHeaderLeft: { flex: 1, paddingRight: SPACING.sm },
  rxScriptNumber: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.text, fontFamily: 'monospace' },
  rxMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  statusBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  rxItem: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  rxItemName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  rxItemDetail: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  rxItemInstructions: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, fontStyle: 'italic' },
  ddaTag: { color: COLORS.error, fontWeight: '800' },
  schedTag: { color: COLORS.warning, fontWeight: '700' },
  rxValidity: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, flexWrap: 'wrap', gap: SPACING.xs },
  rxValidText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  rxActions: { flexDirection: 'row', gap: SPACING.xs },
  rxActionBtn: { borderRadius: BORDER_RADIUS.sm },
  newRxBtn: { borderRadius: BORDER_RADIUS.lg, marginTop: SPACING.md },
  repeatCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  repeatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  repeatInput: { backgroundColor: COLORS.surface, marginTop: SPACING.sm },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text, flex: 1 },
  itemHeaderActions: { flexDirection: 'row' },
  field: { backgroundColor: COLORS.surface, marginBottom: SPACING.sm },
  twoCol: { flexDirection: 'row', gap: SPACING.sm },
  halfField: { flex: 1 },
  chipLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.xs },
  chip: { marginBottom: 2 },
  chipText: { fontSize: FONT_SIZE.xs },
  chipSelected: { backgroundColor: COLORS.primary },
  chipTextSelected: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.xs },
  divider: { marginVertical: SPACING.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  switchLabelWrap: { flex: 1, paddingRight: SPACING.sm },
  switchLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  switchHint: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  ddaWarning: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning + '55',
    marginBottom: SPACING.sm,
  },
  ddaWarningText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 17 },
  addItemBtn: { borderColor: COLORS.primary, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.md },
  issueRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  discardBtn: { flex: 1, borderColor: COLORS.divider, borderRadius: BORDER_RADIUS.md },
  issueBtn: { flex: 2, borderRadius: BORDER_RADIUS.md },
  legalCard: {
    backgroundColor: COLORS.systemGray6,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  legalText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 16 },
});
