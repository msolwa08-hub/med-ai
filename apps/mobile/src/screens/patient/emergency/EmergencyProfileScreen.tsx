import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert, Share,
} from 'react-native';
import {
  Text, Surface, Button, TextInput, Switch, Chip, Divider,
  ActivityIndicator, Snackbar, IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { apiClient } from '../../../api/client';

interface EmergencyMedication {
  name: string;
  dose: string;
  indication: string;
}
interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}
interface EmergencyProfile {
  bloodType?: string;
  allergies: string[];
  currentMedications: EmergencyMedication[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  organDonor: boolean;
  isEnabled: boolean;
  qrToken?: string;
  lastUpdated?: string;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export default function EmergencyProfileScreen() {
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  // Edit state
  const [bloodType, setBloodType] = useState('');
  const [organDonor, setOrganDonor] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [medications, setMedications] = useState<EmergencyMedication[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/emergency/my-profile');
      setProfile(res.data);
      setBloodType(res.data.bloodType || '');
      setOrganDonor(res.data.organDonor);
      setIsEnabled(res.data.isEnabled);
      setAllergies(res.data.allergies || []);
      setConditions(res.data.chronicConditions || []);
      setContacts(res.data.emergencyContacts || []);
      setMedications(res.data.currentMedications || []);
    } catch {
      setSnackbar('Failed to load emergency profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const res = await apiClient.put('/emergency/my-profile', {
        bloodType: bloodType || undefined,
        organDonor,
        isEnabled,
        allergies,
        chronicConditions: conditions,
        emergencyContacts: contacts,
        currentMedications: medications,
      });
      setProfile(res.data);
      setEditing(false);
      setSnackbar('Emergency profile updated');
    } catch {
      setSnackbar('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function generateQR() {
    try {
      const res = await apiClient.post('/emergency/generate-qr');
      await Share.share({
        title: 'My Emergency Medical QR Code',
        message: `Emergency Medical Info: ${res.data.qrUrl}\n\nScan this QR code to view my critical medical information in an emergency.`,
        url: res.data.qrUrl,
      });
    } catch {
      setSnackbar('Failed to generate QR code');
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Emergency Profile</Text>
            <Text style={styles.subtitle}>
              Instantly accessible to emergency responders
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={(v) => { setIsEnabled(v); setEditing(true); }}
            color={COLORS.error}
          />
        </View>

        {isEnabled && (
          <Surface style={styles.qrBanner} elevation={0}>
            <Text style={styles.qrBannerText}>
              🔴 Emergency responders can scan your QR code to see this data without a login
            </Text>
            <Button
              mode="contained"
              buttonColor={COLORS.error}
              onPress={generateQR}
              icon="qrcode"
              style={styles.qrButton}
            >
              Share Emergency QR
            </Button>
          </Surface>
        )}

        {/* Blood Type */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Blood Type</Text>
          <View style={styles.chipGrid}>
            {BLOOD_TYPES.map((bt) => (
              <Chip
                key={bt}
                selected={bloodType === bt}
                onPress={() => { setBloodType(bt); setEditing(true); }}
                style={[styles.chip, bloodType === bt && styles.chipSelected]}
                textStyle={bloodType === bt ? styles.chipTextSelected : undefined}
              >
                {bt}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Allergies */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>⚠️ Allergies</Text>
          <View style={styles.inputRow}>
            <TextInput
              mode="outlined"
              placeholder="e.g. Penicillin, Latex"
              value={allergyInput}
              onChangeText={setAllergyInput}
              style={styles.inputFlex}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.error}
              dense
            />
            <IconButton
              icon="plus-circle"
              iconColor={COLORS.error}
              onPress={() => {
                if (allergyInput.trim()) {
                  setAllergies([...allergies, allergyInput.trim()]);
                  setAllergyInput('');
                  setEditing(true);
                }
              }}
            />
          </View>
          <View style={styles.tagRow}>
            {allergies.map((a, i) => (
              <Chip
                key={i}
                onClose={() => { setAllergies(allergies.filter((_, idx) => idx !== i)); setEditing(true); }}
                style={styles.allergyChip}
                textStyle={styles.allergyChipText}
              >
                {a}
              </Chip>
            ))}
          </View>
          {allergies.length === 0 && (
            <Text style={styles.emptyHint}>No allergies listed. Tap + to add.</Text>
          )}
        </Surface>

        {/* Chronic Conditions */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Chronic Conditions</Text>
          <View style={styles.inputRow}>
            <TextInput
              mode="outlined"
              placeholder="e.g. Hypertension, Diabetes"
              value={conditionInput}
              onChangeText={setConditionInput}
              style={styles.inputFlex}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              dense
            />
            <IconButton
              icon="plus-circle"
              iconColor={COLORS.primary}
              onPress={() => {
                if (conditionInput.trim()) {
                  setConditions([...conditions, conditionInput.trim()]);
                  setConditionInput('');
                  setEditing(true);
                }
              }}
            />
          </View>
          <View style={styles.tagRow}>
            {conditions.map((c, i) => (
              <Chip
                key={i}
                onClose={() => { setConditions(conditions.filter((_, idx) => idx !== i)); setEditing(true); }}
                style={styles.conditionChip}
              >
                {c}
              </Chip>
            ))}
          </View>
        </Surface>

        {/* Current Medications */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Current Medications</Text>
          {medications.map((m, i) => (
            <View key={i} style={styles.medRow}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{m.name}</Text>
                <Text style={styles.medDetail}>{m.dose} — {m.indication}</Text>
              </View>
              <IconButton
                icon="trash-can-outline"
                iconColor={COLORS.error}
                size={18}
                onPress={() => { setMedications(medications.filter((_, idx) => idx !== i)); setEditing(true); }}
              />
            </View>
          ))}
          <Button
            mode="outlined"
            icon="pill"
            onPress={() => {
              Alert.prompt(
                'Add Medication',
                'Enter medication name (e.g. Amlodipine 5mg - Hypertension)',
                (input) => {
                  if (input?.trim()) {
                    const [nameStr, indication] = input.split(' - ');
                    const [name, dose] = nameStr.trim().split(' ');
                    setMedications([...medications, {
                      name: name ?? nameStr,
                      dose: dose ?? '',
                      indication: indication ?? '',
                    }]);
                    setEditing(true);
                  }
                }
              );
            }}
            style={styles.addButton}
            textColor={COLORS.primary}
          >
            Add Medication
          </Button>
          <Text style={styles.medHint}>These sync automatically from your consultations</Text>
        </Surface>

        {/* Emergency Contacts */}
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Emergency Contacts</Text>
          {contacts.map((c, i) => (
            <View key={i} style={styles.contactRow}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>{c.name[0]}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactDetail}>{c.relationship} · {c.phone}</Text>
              </View>
              <IconButton
                icon="trash-can-outline"
                iconColor={COLORS.error}
                size={18}
                onPress={() => { setContacts(contacts.filter((_, idx) => idx !== i)); setEditing(true); }}
              />
            </View>
          ))}
        </Surface>

        {/* Organ Donor */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.cardTitle}>Organ Donor</Text>
              <Text style={styles.switchHint}>Consent to organ donation in event of death</Text>
            </View>
            <Switch
              value={organDonor}
              onValueChange={(v) => { setOrganDonor(v); setEditing(true); }}
              color={COLORS.secondary}
            />
          </View>
        </Surface>

        {/* Save */}
        {editing && (
          <Button
            mode="contained"
            onPress={save}
            loading={saving}
            disabled={saving}
            buttonColor={COLORS.primary}
            style={styles.saveButton}
            contentStyle={{ height: 52 }}
            labelStyle={{ fontSize: 16, fontWeight: '700' }}
          >
            Save Emergency Profile
          </Button>
        )}
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={3000}
      >
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  headerLeft: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  qrBanner: {
    backgroundColor: '#FFF3F3',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  qrBannerText: { fontSize: 13, color: COLORS.error, marginBottom: SPACING.sm },
  qrButton: { borderRadius: BORDER_RADIUS.md },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: { marginBottom: SPACING.xs },
  chipSelected: { backgroundColor: COLORS.primary },
  chipTextSelected: { color: COLORS.white },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputFlex: { flex: 1, backgroundColor: COLORS.surface },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  allergyChip: { backgroundColor: '#FFE0E0' },
  allergyChipText: { color: COLORS.error },
  conditionChip: { backgroundColor: '#E0EEFF' },
  emptyHint: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic', marginTop: SPACING.xs },
  medRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  medInfo: { flex: 1 },
  medName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  medDetail: { fontSize: 12, color: COLORS.textSecondary },
  addButton: { marginTop: SPACING.sm, borderColor: COLORS.primary },
  medHint: { fontSize: 11, color: COLORS.textLight, marginTop: SPACING.xs, fontStyle: 'italic' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs },
  contactAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  contactAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  contactDetail: { fontSize: 12, color: COLORS.textSecondary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { flex: 1 },
  switchHint: { fontSize: 12, color: COLORS.textSecondary },
  saveButton: { marginTop: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
});
