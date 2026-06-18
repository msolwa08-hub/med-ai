import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { doctorApi, consultationApi } from '../../api/endpoints';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../../constants/theme';

type Props = { navigation: any };

interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  lastVisit: string;
  consultationCount: number;
  patientId: string;
}

interface ConsultationSummary {
  id: string;
  date: string;
  status: string;
  consultationType: string;
  chiefComplaint?: string;
  diagnosis?: string;
  medications?: string[];
}

interface DetailedConsultation {
  id: string;
  date: string;
  status: string;
  consultationType: string;
  chiefComplaint?: string;
  vitalSigns?: Record<string, string | number>;
  diagnosis?: string;
  medications?: string[];
  patientInstructions?: string;
}

const MOCK_PATIENTS: PatientRecord[] = [
  { id: 'p1', firstName: 'Sipho', lastName: 'Mkhize', lastVisit: '15 Jun 2026', consultationCount: 3, patientId: 'pid1' },
  { id: 'p2', firstName: 'Zanele', lastName: 'Dlamini', lastVisit: '12 Jun 2026', consultationCount: 1, patientId: 'pid2' },
  { id: 'p3', firstName: 'Fatima', lastName: 'Adams', lastVisit: '8 Jun 2026', consultationCount: 5, patientId: 'pid3' },
  { id: 'p4', firstName: 'Lebo', lastName: 'Petersen', lastVisit: '1 Jun 2026', consultationCount: 2, patientId: 'pid4' },
];

const MOCK_CONSULTATIONS: Record<string, ConsultationSummary[]> = {
  pid1: [
    { id: 'c1', date: '15 Jun 2026, 10:00', status: 'COMPLETED', consultationType: 'IN_PERSON', chiefComplaint: 'Chest pain and shortness of breath', diagnosis: 'Hypertension (I10)', medications: ['Amlodipine 5mg OD'] },
    { id: 'c2', date: '2 May 2026, 14:30', status: 'COMPLETED', consultationType: 'TELECONSULT', chiefComplaint: 'Follow-up for blood pressure', diagnosis: 'Hypertension (I10)', medications: ['Amlodipine 5mg OD', 'Atenolol 50mg OD'] },
    { id: 'c3', date: '10 Mar 2026, 09:15', status: 'COMPLETED', consultationType: 'IN_PERSON', chiefComplaint: 'Cough and fever for 5 days', diagnosis: 'Upper respiratory tract infection (J06.9)', medications: ['Amoxicillin 500mg TDS x 5 days', 'Paracetamol 1g QID PRN'] },
  ],
  pid2: [
    { id: 'c4', date: '12 Jun 2026, 11:00', status: 'COMPLETED', consultationType: 'HOME_VISIT', chiefComplaint: 'Diabetic foot ulcer review', diagnosis: 'Diabetic foot ulcer (E11.621)', medications: ['Metformin 500mg BD', 'Wound dressing change daily'] },
  ],
  pid3: [
    { id: 'c5', date: '8 Jun 2026, 16:00', status: 'COMPLETED', consultationType: 'IN_PERSON', chiefComplaint: 'Persistent cough for 6 weeks', diagnosis: 'Pulmonary Tuberculosis (A15.3)', medications: ['Rifampicin 150mg OD', 'Isoniazid 100mg OD', 'Pyrazinamide 500mg OD', 'Ethambutol 400mg OD'] },
    { id: 'c6', date: '20 May 2026', status: 'COMPLETED', consultationType: 'TELECONSULT', chiefComplaint: 'Nausea and vomiting', diagnosis: 'Gastroenteritis (K52.9)', medications: ['Metoclopramide 10mg TDS', 'ORS sachets x10'] },
  ],
  pid4: [
    { id: 'c7', date: '1 Jun 2026, 08:30', status: 'COMPLETED', consultationType: 'IN_PERSON', chiefComplaint: 'Back pain after lifting injury', diagnosis: 'Lumbar strain (M54.5)', medications: ['Ibuprofen 400mg TDS x 5 days', 'Physiotherapy referral'] },
    { id: 'c8', date: '15 May 2026, 13:00', status: 'COMPLETED', consultationType: 'TELECONSULT', chiefComplaint: 'Headache and dizziness', diagnosis: 'Tension headache (G44.2)', medications: ['Paracetamol 1g QID PRN'] },
  ],
};

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return COLORS.success;
    case 'CANCELLED': return COLORS.error;
    case 'EXAMINATION': return COLORS.info;
    default: return COLORS.warning;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'IN_PERSON': return 'In-Person';
    case 'TELECONSULT': return 'Teleconsult';
    case 'HOME_VISIT': return 'Home Visit';
    default: return type;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'TELECONSULT': return COLORS.info;
    case 'HOME_VISIT': return COLORS.accent;
    default: return COLORS.secondary;
  }
}

export default function DoctorPatientRecordsScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<PatientRecord[]>(MOCK_PATIENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationSummary | null>(null);
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    setIsLoading(true);
    try {
      // In production, use: await doctorApi.getPatientRecords(user!.id, '')
      // For now, use mock data
      setPatients(MOCK_PATIENTS);
    } catch {
      // Fall back to mock data
    } finally {
      setIsLoading(false);
    }
  }

  function selectPatient(patient: PatientRecord) {
    setSelectedPatient(patient);
    setSelectedConsultation(null);
    const mockConsultations = MOCK_CONSULTATIONS[patient.patientId] ?? [];
    setConsultations(mockConsultations);
  }

  function goBack() {
    if (selectedConsultation) {
      setSelectedConsultation(null);
    } else if (selectedPatient) {
      setSelectedPatient(null);
    } else {
      navigation.goBack();
    }
  }

  const filteredPatients = patients.filter((p) =>
    searchQuery === '' ||
    (p.firstName + ' ' + p.lastName).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // FULL RECORD VIEW
  if (selectedConsultation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consultation Record</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Patient Info */}
          <View style={styles.patientInfoCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{selectedPatient?.firstName.charAt(0) ?? '?'}</Text>
            </View>
            <View>
              <Text style={styles.patientName}>{selectedPatient?.firstName} {selectedPatient?.lastName}</Text>
              <Text style={styles.consultationDate}>{selectedConsultation.date}</Text>
            </View>
          </View>

          {/* Status & Type */}
          <View style={styles.section}>
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedConsultation.status) + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedConsultation.status) }]}>
                  {selectedConsultation.status}
                </Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedConsultation.consultationType) + '20' }]}>
                <Text style={[styles.typeBadgeText, { color: getTypeColor(selectedConsultation.consultationType) }]}>
                  {getTypeLabel(selectedConsultation.consultationType)}
                </Text>
              </View>
            </View>
          </View>

          {/* Chief Complaint */}
          {selectedConsultation.chiefComplaint && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chief Complaint</Text>
              <View style={styles.chiefComplaintBox}>
                <Text style={styles.chiefComplaintText}>{selectedConsultation.chiefComplaint}</Text>
              </View>
            </View>
          )}

          {/* Diagnosis */}
          {selectedConsultation.diagnosis && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Diagnosis</Text>
              <Text style={styles.diagnosisText}>{selectedConsultation.diagnosis}</Text>
            </View>
          )}

          {/* Medications */}
          {selectedConsultation.medications && selectedConsultation.medications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medications Prescribed</Text>
              {selectedConsultation.medications.map((med, idx) => (
                <View key={idx} style={styles.medRow}>
                  <View style={styles.medDot} />
                  <Text style={styles.medText}>{med}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // CONSULTATION LIST VIEW for selected patient
  if (selectedPatient) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedPatient.firstName} {selectedPatient.lastName}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.patientInfoBanner}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{selectedPatient.firstName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.patientName}>{selectedPatient.firstName} {selectedPatient.lastName}</Text>
            <Text style={styles.patientSubInfo}>{selectedPatient.consultationCount} consultations · Last seen {selectedPatient.lastVisit}</Text>
          </View>
        </View>

        <FlatList
          data={consultations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No consultation records found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.consultationCard}
              onPress={() => setSelectedConsultation(item)}
              activeOpacity={0.85}
            >
              <View style={styles.consultationCardTop}>
                <Text style={styles.consultationDate}>{item.date}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.consultationType) + '20', alignSelf: 'flex-start', marginTop: 4 }]}>
                <Text style={[styles.typeBadgeText, { color: getTypeColor(item.consultationType) }]}>
                  {getTypeLabel(item.consultationType)}
                </Text>
              </View>
              {item.chiefComplaint && (
                <Text style={styles.complaintSnippet} numberOfLines={2}>{item.chiefComplaint}</Text>
              )}
              {item.diagnosis && (
                <Text style={styles.diagnosisSnippet} numberOfLines={1}>Dx: {item.diagnosis}</Text>
              )}
              <Text style={styles.viewRecord}>View full record &rarr;</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // MAIN PATIENT LIST VIEW
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Patients</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No patients found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No patients match your search.'
                  : 'Patients who grant you consent will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.patientCard}
              onPress={() => selectPatient(item)}
              activeOpacity={0.85}
            >
              <View style={styles.patientCardLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.firstName.charAt(0)}</Text>
                </View>
                <View style={styles.patientCardInfo}>
                  <Text style={styles.patientName}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.patientSubInfo}>Last seen: {item.lastVisit}</Text>
                  <Text style={styles.consultationCount}>
                    {item.consultationCount} consultation{item.consultationCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevron}>{'>'}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: FONT_SIZE.xl, color: COLORS.white, fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.white },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchInput: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  listContent: { padding: SPACING.md, gap: SPACING.sm },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center' },
  patientCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  patientCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  patientCardInfo: { flex: 1 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.primary },
  patientName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  patientSubInfo: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  consultationCount: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  chevron: { fontSize: FONT_SIZE.lg, color: COLORS.textLight, fontWeight: '700' },
  patientInfoBanner: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  patientInfoCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  consultationDate: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  statusBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  typeBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  chiefComplaintBox: {
    backgroundColor: COLORS.info + '15',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  chiefComplaintText: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: '500' },
  diagnosisText: { fontSize: FONT_SIZE.md, color: COLORS.text },
  medRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: 6 },
  medDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 6 },
  medText: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  consultationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  consultationCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  complaintSnippet: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  diagnosisSnippet: { fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  viewRecord: { fontSize: FONT_SIZE.sm, color: COLORS.primaryLight, marginTop: SPACING.sm, fontWeight: '600' },
});
