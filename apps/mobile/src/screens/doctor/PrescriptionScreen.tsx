import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, Alert, Share,
} from 'react-native';
import {
  Text, Surface, Button, TextInput, Chip, Switch,
  ActivityIndicator, Snackbar, IconButton, Divider, RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { apiClient } from '../../api/client';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface PrescriptionItem {
  drugName: string;
  strength: string;
  form: string;
  dose: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
  isScheduled: boolean;
  scheduleNumber?: number;
  isDDA: boolean;
}

interface Prescription {
  id: string;
  scriptNumber: string;
  status: 'ACTIVE' | 'DISPENSED' | 'CANCELLED' | 'EXPIRED';
  isRepeat: boolean;
  repeatTotal?: number;
  repeatDispensed: number;
  validUntilDate: string;
  items: PrescriptionItem[];
  createdAt: string;
  doctor?: { firstName: string; lastName: string; hpcsaNumber: string };
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

const DRUG_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler', 'Patch', 'Cream', 'Drops', 'Suppository', 'Other'];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed (PRN)', 'Once weekly', 'Other'];
const SCHEDULE_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7];

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function PrescriptionScreen({ route }: Props) {
  const consultationId = route?.params?.consultationId ?? '';
  const patientName = route?.params?.patientName ?? 'Patient';

  const [existingPrescriptions, setExistingPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewRx, setShowNewRx] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  // New Rx state
  const [items, setItems] = useState<PrescriptionItem[]>([createEmptyItem()]);
  const [isRepeat, setIsRepeat] = useState(false);
  const [repeatTotal, setRepeatTotal] = useState('3');
  const [expandedItem, setExpandedItem] = useState(0);

  useEffect(() => {
    if (!consultationId) {
      setLoading(false);
      return;
    }
    loadExistingPrescriptions();
  }, [consultationId]);

  async function loadExistingPrescriptions() {
    try {
      const res = await apiClient.get(`/prescriptions/consultation/${consultationId}`);
      setExistingPrescriptions(res.data.data?.prescriptions ?? []);
    } catch {
      // No existing prescriptions is fine
    } finally {
      setLoading(false);
    }
  }

  function createEmptyItem(): PrescriptionItem {
    return {
      drugName: '',
      strength: '',
      form: 'Tablet',
      dose: '',
      frequency: 'Twice daily',
      duration: '7 days',
      quantity: '',
      instructions: 'Take with food',
      isScheduled: false,
      isDDA: false,
    };
  }

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

  function updateItem(index: number, field: keyof PrescriptionItem, value: string | boolean | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  async function issuePrescription() {
    const invalidItems = items.filter(
      (item) => !item.drugName.trim() || !item.dose.trim() || !item.quantity.trim()
    );
    if (invalidItems.length > 0) {
      setSnackbar('All items need a drug name, dose, and quantity');
      return;
    }

    if (isRepeat && (!repeatTotal || parseInt(repeatTotal) < 1)) {
      setSnackbar('Repeat total must be at least 1');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/prescriptions', {
        consultationId,
        items,
        isRepeat,
        repeatTotal: isRepeat ? parseInt(repeatTotal) : undefined,
      });
      setSnackbar('Prescription issued successfully');
      setShowNewRx(false);
      setItems([createEmptyItem()]);
      setIsRepeat(false);
      loadExistingPrescriptions();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSnackbar(msg ?? 'Failed to issue prescription');
    } finally {
      setSaving(false);
    }
  }

  async function cancelPrescription(id: string, scriptNumber: string) {
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
              await apiClient.put(`/prescriptions/${id}/cancel`);
              setSnackbar('Prescription cancelled');
              loadExistingPrescriptions();
            } catch {
              setSnackbar('Failed to cancel prescription');
            }
          },
        },
      ]
    );
  }

  async function viewPrescription(id: string, scriptNumber: string) {
    try {
      const res = await apiClient.get(`/prescriptions/${id}/pdf`, {
        responseType: 'text',
      });
      await Share.share({
        title: `Prescription ${scriptNumber}`,
        message: `MedAI Prescription ${scriptNumber} — ${patientName}`,
        url: `data:text/html;base64,${btoa(res.data)}`,
      });
    } catch {
      setSnackbar('Failed to open prescription');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Prescription</Text>
        {patientName !== 'Patient' && (
          <Text style={styles.patientName}>Patient: {patientName}</Text>
        )}

        {/* Existing prescriptions */}
        {existingPrescriptions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Issued Scripts</Text>
            {existingPrescriptions.map((rx) => (
              <Surface key={rx.id} style={[styles.rxCard, rx.status !== 'ACTIVE' && styles.rxCardInactive]} elevation={1}>
                <View style={styles.rxHeader}>
                  <View>
                    <Text style={styles.rxScriptNumber}>{rx.scriptNumber}</Text>
                    <Text style={styles.rxMeta}>
                      {rx.items.length} item{rx.items.length !== 1 ? 's' : ''} ·{' '}
                      {rx.isRepeat ? `Repeat x${rx.repeatTotal} (${rx.repeatDispensed} dispensed)` : 'Once-off'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, getStatusStyle(rx.status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(rx.status)]}>{rx.status}</Text>
                  </View>
                </View>

                {rx.items.map((item, i) => (
                  <View key={i} style={styles.rxItem}>
                    <Text style={styles.rxItemName}>
                      {item.drugName} {item.strength}
                      {item.isDDA && <Text style={styles.ddaTag}> [DDA]</Text>}
                      {item.isScheduled && <Text style={styles.schedTag}> [Sch {item.scheduleNumber}]</Text>}
                    </Text>
                    <Text style={styles.rxItemDetail}>
                      {item.dose} {item.frequency} × {item.duration} — Qty: {item.quantity}
                    </Text>
                    {item.instructions && (
                      <Text style={styles.rxItemInstructions}>{item.instructions}</Text>
                    )}
                  </View>
                ))}

                <View style={styles.rxValidity}>
                  <Text style={styles.rxValidText}>
                    Valid until: {formatDate(rx.validUntilDate)}
                  </Text>
                  <View style={styles.rxActions}>
                    <Button
                      mode="outlined"
                      compact
                      icon="printer"
                      onPress={() => viewPrescription(rx.id, rx.scriptNumber)}
                      textColor={COLORS.primary}
                      style={styles.rxActionBtn}
                    >
                      View
                    </Button>
                    {rx.status === 'ACTIVE' && (
                      <Button
                        mode="outlined"
                        compact
                        icon="close"
                        onPress={() => cancelPrescription(rx.id, rx.scriptNumber)}
                        textColor={COLORS.error}
                        style={[styles.rxActionBtn, { borderColor: COLORS.error + '40' }]}
                      >
                        Cancel
                      </Button>
                    )}
                  </View>
                </View>
              </Surface>
            ))}
          </>
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
            labelStyle={{ fontSize: 16 }}
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
                  <Text style={styles.cardSub}>Patient may collect this {isRepeat ? repeatTotal : '1'} time{isRepeat && parseInt(repeatTotal) !== 1 ? 's' : ''}</Text>
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
                  label="Number of repeats"
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
                    {item.isDDA && <Text style={styles.ddaTag}> [DDA]</Text>}
                  </Text>
                  <View style={styles.itemHeaderActions}>
                    <IconButton
                      icon={expandedItem === index ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      onPress={() => setExpandedItem(expandedItem === index ? -1 : index)}
                    />
                    {items.length > 1 && (
                      <IconButton
                        icon="trash-can-outline"
                        size={18}
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

                    <Text style={styles.chipLabel}>Formulation</Text>
                    <View style={styles.chipRow}>
                      {DRUG_FORMS.map((f) => (
                        <Chip
                          key={f}
                          selected={item.form === f}
                          onPress={() => updateItem(index, 'form', f)}
                          compact
                          style={[styles.chip, item.form === f && styles.chipSelected]}
                          textStyle={item.form === f ? styles.chipTextSelected : { fontSize: 11 }}
                        >
                          {f}
                        </Chip>
                      ))}
                    </View>

                    <Text style={styles.chipLabel}>Frequency</Text>
                    <View style={styles.chipRow}>
                      {FREQUENCIES.map((freq) => (
                        <Chip
                          key={freq}
                          selected={item.frequency === freq}
                          onPress={() => updateItem(index, 'frequency', freq)}
                          compact
                          style={[styles.chip, item.frequency === freq && styles.chipSelected]}
                          textStyle={item.frequency === freq ? styles.chipTextSelected : { fontSize: 11 }}
                        >
                          {freq}
                        </Chip>
                      ))}
                    </View>

                    <View style={styles.twoCol}>
                      <TextInput
                        mode="outlined"
                        label="Duration"
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
                      label="Instructions for patient"
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
                      <View>
                        <Text style={styles.switchLabel}>Scheduled Substance</Text>
                        <Text style={styles.switchHint}>Schedule 2–7 medicines require special handling</Text>
                      </View>
                      <Switch
                        value={item.isScheduled}
                        onValueChange={(v) => updateItem(index, 'isScheduled', v)}
                        color={COLORS.warning}
                      />
                    </View>

                    {item.isScheduled && (
                      <>
                        <Text style={styles.chipLabel}>Schedule Number</Text>
                        <View style={styles.chipRow}>
                          {SCHEDULE_NUMBERS.filter((n) => n > 0).map((n) => (
                            <Chip
                              key={n}
                              selected={item.scheduleNumber === n}
                              onPress={() => updateItem(index, 'scheduleNumber', n)}
                              compact
                              style={[
                                styles.chip,
                                item.scheduleNumber === n && { backgroundColor: COLORS.warning },
                              ]}
                              textStyle={item.scheduleNumber === n ? { color: COLORS.white, fontWeight: '700', fontSize: 11 } : { fontSize: 11 }}
                            >
                              S{n}
                            </Chip>
                          ))}
                        </View>
                      </>
                    )}

                    {/* DDA toggle */}
                    <View style={styles.switchRow}>
                      <View>
                        <Text style={styles.switchLabel}>Dangerous Dependence-Producing (DDA)</Text>
                        <Text style={styles.switchHint}>Opioids, benzodiazepines — requires DDA triplicate</Text>
                      </View>
                      <Switch
                        value={item.isDDA}
                        onValueChange={(v) => updateItem(index, 'isDDA', v)}
                        color={COLORS.error}
                      />
                    </View>

                    {item.isDDA && (
                      <Surface style={styles.ddaWarning} elevation={0}>
                        <Text style={styles.ddaWarningText}>
                          ⚠️ DDA substances require a government-issued triplicate prescription pad. Ensure this prescription is also written on the physical DDA book. Electronic prescribing is supplementary only.
                        </Text>
                      </Surface>
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
            >
              Add Another Drug
            </Button>

            {/* Issue / Cancel buttons */}
            <View style={styles.issueRow}>
              <Button
                mode="outlined"
                onPress={() => { setShowNewRx(false); setItems([createEmptyItem()]); }}
                style={styles.discardBtn}
                textColor={COLORS.textSecondary}
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
    case 'ACTIVE': return { backgroundColor: COLORS.secondary + '20' };
    case 'DISPENSED': return { backgroundColor: COLORS.primary + '15' };
    case 'CANCELLED': return { backgroundColor: COLORS.error + '15' };
    case 'EXPIRED': return { backgroundColor: COLORS.textSecondary + '20' };
    default: return {};
  }
}

function getStatusTextStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { color: COLORS.secondary };
    case 'DISPENSED': return { color: COLORS.primary };
    case 'CANCELLED': return { color: COLORS.error };
    case 'EXPIRED': return { color: COLORS.textSecondary };
    default: return {};
  }
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.xs },
  patientName: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  rxCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  rxCardInactive: { opacity: 0.7 },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  rxScriptNumber: { fontSize: 14, fontWeight: '800', color: COLORS.text, fontFamily: 'monospace' },
  rxMeta: { fontSize: 12, color: COLORS.textSecondary },
  statusBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  rxItem: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  rxItemName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  rxItemDetail: { fontSize: 12, color: COLORS.textSecondary },
  rxItemInstructions: { fontSize: 11, color: COLORS.textLight, fontStyle: 'italic' },
  ddaTag: { color: COLORS.error, fontWeight: '800' },
  schedTag: { color: COLORS.warning, fontWeight: '700' },
  rxValidity: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  rxValidText: { fontSize: 12, color: COLORS.textSecondary },
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  repeatInput: { backgroundColor: COLORS.surface, marginTop: SPACING.sm },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  itemHeaderActions: { flexDirection: 'row' },
  field: { backgroundColor: COLORS.surface, marginBottom: SPACING.sm },
  twoCol: { flexDirection: 'row', gap: SPACING.sm },
  halfField: { flex: 1 },
  chipLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: SPACING.xs },
  chip: { marginBottom: 2 },
  chipSelected: { backgroundColor: COLORS.primary },
  chipTextSelected: { color: COLORS.white, fontWeight: '700', fontSize: 11 },
  divider: { marginVertical: SPACING.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  switchHint: { fontSize: 11, color: COLORS.textSecondary },
  ddaWarning: {
    backgroundColor: '#FFF8E1',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: SPACING.sm,
  },
  ddaWarningText: { fontSize: 12, color: '#795548', lineHeight: 17 },
  addItemBtn: { borderColor: COLORS.primary, marginBottom: SPACING.md },
  issueRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  discardBtn: { flex: 1, borderColor: COLORS.divider },
  issueBtn: { flex: 2, borderRadius: BORDER_RADIUS.md },
  legalCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  legalText: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },
});
