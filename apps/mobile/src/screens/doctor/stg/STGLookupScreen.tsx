import React, { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import {
  Text, Surface, TextInput, Chip, ActivityIndicator, Divider,
  Button, Badge,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { apiClient } from '../../api/client';

interface STGMedication {
  medication: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  notes?: string;
}
interface STGInvestigation {
  name: string;
  urgency: 'ROUTINE' | 'URGENT' | 'STAT';
  rationale: string;
}
interface STGEntry {
  id: string;
  icd10Code: string;
  conditionName: string;
  category: string;
  levelOfCare: string;
  firstLineTreatment: STGMedication[];
  alternativeTreatment?: STGMedication[];
  investigations: STGInvestigation[];
  referralCriteria?: string;
  redFlags?: string;
  followUpAdvice?: string;
  notes?: string;
  saPrevalence: string;
}
interface ICD10Result {
  code: string;
  description: string;
  category?: string;
}
interface ChecklistItem {
  task: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
}

const URGENCY_COLORS = {
  STAT: COLORS.error,
  URGENT: '#FF9500',
  ROUTINE: COLORS.secondary,
};

export default function STGLookupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { consultationId, onSelect } = route.params ?? {};

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'name' | 'icd10'>('name');
  const [results, setResults] = useState<STGEntry[]>([]);
  const [icd10Results, setIcd10Results] = useState<ICD10Result[]>([]);
  const [selectedSTG, setSelectedSTG] = useState<STGEntry | null>(null);
  const [adaptedSTG, setAdaptedSTG] = useState<{ checklist: ChecklistItem[]; aiNotes: string; contraindications: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAdapted, setLoadingAdapted] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setIcd10Results([]); return; }
    setLoading(true);
    try {
      if (mode === 'name') {
        const res = await apiClient.get('/stg/search', { params: { q } });
        setResults(res.data);
        setIcd10Results([]);
      } else {
        const res = await apiClient.get('/stg/icd10/search', { params: { q } });
        setIcd10Results(res.data);
        setResults([]);
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [mode]);

  async function selectICD10(code: string) {
    setLoading(true);
    try {
      const res = await apiClient.get(`/stg/icd10/${code}`);
      if (res.data) selectSTG(res.data);
    } catch {
      // code has no STG entry
    } finally {
      setLoading(false);
    }
  }

  async function selectSTG(stg: STGEntry) {
    setSelectedSTG(stg);
    setResults([]);
    setIcd10Results([]);
    setQuery(stg.conditionName);

    if (consultationId) {
      setLoadingAdapted(true);
      try {
        const res = await apiClient.post('/stg/adapted', {
          icd10Code: stg.icd10Code,
          consultationId,
        });
        setAdaptedSTG(res.data);
        setChecklist(res.data.checklist || []);
      } catch {
        setAdaptedSTG(null);
      } finally {
        setLoadingAdapted(false);
      }
    }
  }

  function toggleChecklistItem(index: number) {
    setChecklist((prev) =>
      prev.map((item, i) => i === index ? { ...item, completed: !item.completed } : item)
    );
  }

  function applyToConsultation() {
    if (selectedSTG && onSelect) {
      onSelect({
        icd10Code: selectedSTG.icd10Code,
        conditionName: selectedSTG.conditionName,
        stgId: selectedSTG.id,
        firstLineTreatment: selectedSTG.firstLineTreatment,
        investigations: selectedSTG.investigations,
        checklist,
      });
    }
    navigation.goBack();
  }

  const getPriorityColor = (p: string) =>
    p === 'HIGH' ? COLORS.error : p === 'MEDIUM' ? '#FF9500' : COLORS.textSecondary;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchArea}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'name' && styles.modeBtnActive]}
            onPress={() => { setMode('name'); setQuery(''); setResults([]); setIcd10Results([]); }}
          >
            <Text style={[styles.modeBtnText, mode === 'name' && styles.modeBtnTextActive]}>
              Condition Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'icd10' && styles.modeBtnActive]}
            onPress={() => { setMode('icd10'); setQuery(''); setResults([]); setIcd10Results([]); }}
          >
            <Text style={[styles.modeBtnText, mode === 'icd10' && styles.modeBtnTextActive]}>
              ICD-10 Code
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          mode="outlined"
          placeholder={mode === 'name' ? 'e.g. Pneumonia, Hypertension, Asthma' : 'e.g. J18.9, I10, E11'}
          value={query}
          onChangeText={(q) => {
            setQuery(q);
            search(q);
            if (selectedSTG && q !== selectedSTG.conditionName) setSelectedSTG(null);
          }}
          left={<TextInput.Icon icon="magnify" color={COLORS.primary} />}
          right={query ? <TextInput.Icon icon="close" onPress={() => { setQuery(''); setResults([]); setIcd10Results([]); setSelectedSTG(null); }} /> : undefined}
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          style={styles.searchInput}
        />
      </View>

      {/* Loading */}
      {loading && <ActivityIndicator style={styles.loader} color={COLORS.primary} />}

      {/* ICD-10 search results */}
      {icd10Results.length > 0 && (
        <FlatList
          data={icd10Results}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => selectICD10(item.code)}>
              <Text style={styles.resultCode}>{item.code}</Text>
              <Text style={styles.resultDesc}>{item.description}</Text>
              {item.category && <Text style={styles.resultCat}>{item.category}</Text>}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <Divider />}
          style={styles.resultList}
        />
      )}

      {/* STG search results */}
      {results.length > 0 && !selectedSTG && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => selectSTG(item)}>
              <View style={styles.resultRow}>
                <Text style={styles.resultDesc}>{item.conditionName}</Text>
                <Chip compact style={styles.icdChip} textStyle={styles.icdChipText}>{item.icd10Code}</Chip>
              </View>
              <Text style={styles.resultCat}>{item.category} · {item.levelOfCare} · {item.saPrevalence}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <Divider />}
          style={styles.resultList}
        />
      )}

      {/* Selected STG Detail */}
      {selectedSTG && (
        <FlatList
          data={[selectedSTG]}
          keyExtractor={() => 'stg'}
          renderItem={() => (
            <View style={styles.stgDetail}>
              {/* Header */}
              <Surface style={styles.stgHeader} elevation={0}>
                <View style={styles.stgTitleRow}>
                  <Text style={styles.stgTitle}>{selectedSTG.conditionName}</Text>
                  <Chip style={styles.icdBadge} textStyle={styles.icdBadgeText}>
                    {selectedSTG.icd10Code}
                  </Chip>
                </View>
                <Text style={styles.stgMeta}>
                  {selectedSTG.category} · {selectedSTG.levelOfCare} · {selectedSTG.saPrevalence}
                </Text>
              </Surface>

              {/* Red Flags */}
              {selectedSTG.redFlags && (
                <Surface style={styles.redFlagCard} elevation={0}>
                  <Text style={styles.redFlagTitle}>🚨 Red Flags — Refer Immediately</Text>
                  <Text style={styles.redFlagText}>{selectedSTG.redFlags}</Text>
                </Surface>
              )}

              {/* AI-adapted management checklist */}
              {loadingAdapted && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Adapting to patient's history...</Text>
                </View>
              )}

              {adaptedSTG?.aiNotes && (
                <Surface style={styles.aiNotesCard} elevation={0}>
                  <Text style={styles.aiNotesTitle}>🤖 AI Clinical Notes</Text>
                  <Text style={styles.aiNotesText}>{adaptedSTG.aiNotes}</Text>
                </Surface>
              )}

              {/* Management Checklist */}
              {checklist.length > 0 && (
                <Surface style={styles.section} elevation={1}>
                  <Text style={styles.sectionTitle}>Management Checklist</Text>
                  {checklist.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.checklistItem}
                      onPress={() => toggleChecklistItem(i)}
                    >
                      <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                        {item.completed && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.checklistContent}>
                        <Text style={[styles.checklistTask, item.completed && styles.checklistTaskDone]}>
                          {item.task}
                        </Text>
                        <Text style={[styles.checklistCat, { color: getPriorityColor(item.priority) }]}>
                          {item.category} · {item.priority}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </Surface>
              )}

              {/* First Line Treatment */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>First Line Treatment</Text>
                {selectedSTG.firstLineTreatment.map((med, i) => (
                  <View key={i} style={styles.medCard}>
                    <Text style={styles.medName}>{med.medication}</Text>
                    <Text style={styles.medDetail}>{med.dose} · {med.route} · {med.frequency}</Text>
                    <Text style={styles.medDuration}>Duration: {med.duration}</Text>
                    {med.notes && <Text style={styles.medNotes}>{med.notes}</Text>}
                  </View>
                ))}
              </Surface>

              {/* Investigations */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Recommended Investigations</Text>
                {selectedSTG.investigations.map((inv, i) => (
                  <View key={i} style={styles.invRow}>
                    <View style={[styles.urgencyBadge, { backgroundColor: URGENCY_COLORS[inv.urgency] + '20' }]}>
                      <Text style={[styles.urgencyText, { color: URGENCY_COLORS[inv.urgency] }]}>
                        {inv.urgency}
                      </Text>
                    </View>
                    <View style={styles.invInfo}>
                      <Text style={styles.invName}>{inv.name}</Text>
                      <Text style={styles.invRationale}>{inv.rationale}</Text>
                    </View>
                  </View>
                ))}
              </Surface>

              {/* Referral Criteria */}
              {selectedSTG.referralCriteria && (
                <Surface style={styles.section} elevation={1}>
                  <Text style={styles.sectionTitle}>Referral Criteria</Text>
                  <Text style={styles.sectionText}>{selectedSTG.referralCriteria}</Text>
                </Surface>
              )}

              {/* Follow-up */}
              {selectedSTG.followUpAdvice && (
                <Surface style={styles.section} elevation={1}>
                  <Text style={styles.sectionTitle}>Follow-up Advice</Text>
                  <Text style={styles.sectionText}>{selectedSTG.followUpAdvice}</Text>
                </Surface>
              )}

              {/* Contraindications */}
              {adaptedSTG?.contraindications && adaptedSTG.contraindications.length > 0 && (
                <Surface style={[styles.section, styles.contraCard]} elevation={0}>
                  <Text style={styles.contraTitle}>⚠️ Contraindications for This Patient</Text>
                  {adaptedSTG.contraindications.map((c, i) => (
                    <Text key={i} style={styles.contraItem}>• {c}</Text>
                  ))}
                </Surface>
              )}

              {/* Apply to consultation */}
              {consultationId && (
                <Button
                  mode="contained"
                  buttonColor={COLORS.secondary}
                  onPress={applyToConsultation}
                  style={styles.applyButton}
                  contentStyle={{ height: 52 }}
                  labelStyle={{ fontSize: 16, fontWeight: '700' }}
                  icon="check-circle"
                >
                  Apply to Consultation
                </Button>
              )}
            </View>
          )}
          contentContainerStyle={styles.stgScroll}
        />
      )}

      {/* Empty state */}
      {!loading && !selectedSTG && results.length === 0 && icd10Results.length === 0 && query.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>SA Standard Treatment Guidelines</Text>
          <Text style={styles.emptyText}>
            Search by condition name or ICD-10 code to access evidence-based SA DoH treatment guidelines, recommended investigations, and management checklists.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchArea: { padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  modeToggle: { flexDirection: 'row', marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.primary },
  modeBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', backgroundColor: COLORS.surface },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  modeBtnTextActive: { color: COLORS.white },
  searchInput: { backgroundColor: COLORS.surface },
  loader: { marginTop: SPACING.lg },
  resultList: { backgroundColor: COLORS.surface, maxHeight: 300 },
  resultItem: { padding: SPACING.md },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCode: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  resultDesc: { fontSize: 14, color: COLORS.text, flex: 1 },
  resultCat: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  icdChip: { backgroundColor: COLORS.primary + '20' },
  icdChipText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  stgDetail: { paddingBottom: SPACING.xxl },
  stgScroll: { paddingBottom: SPACING.xxl },
  stgHeader: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  stgTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.sm },
  stgTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary, flex: 1 },
  stgMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs },
  icdBadge: { backgroundColor: COLORS.primary },
  icdBadgeText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  redFlagCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFB0B0',
  },
  redFlagTitle: { fontSize: 13, fontWeight: '700', color: COLORS.error, marginBottom: SPACING.xs },
  redFlagText: { fontSize: 13, color: COLORS.error },
  loadingRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  loadingText: { fontSize: 13, color: COLORS.textSecondary },
  aiNotesCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#B0D0FF',
  },
  aiNotesTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.xs },
  aiNotesText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  section: {
    margin: SPACING.md,
    marginTop: 0,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  sectionText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  checklistItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: COLORS.primary, marginRight: SPACING.sm, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  checklistContent: { flex: 1 },
  checklistTask: { fontSize: 13, color: COLORS.text },
  checklistTaskDone: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  checklistCat: { fontSize: 11, marginTop: 2 },
  medCard: { paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  medName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  medDetail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  medDuration: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  medNotes: { fontSize: 12, color: COLORS.warning, marginTop: 2, fontStyle: 'italic' },
  invRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: SPACING.sm },
  urgencyBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  urgencyText: { fontSize: 11, fontWeight: '700' },
  invInfo: { flex: 1 },
  invName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  invRationale: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  contraCard: { backgroundColor: '#FFF8E0', borderWidth: 1, borderColor: '#FFD700' },
  contraTitle: { fontSize: 13, fontWeight: '700', color: '#856404', marginBottom: SPACING.xs },
  contraItem: { fontSize: 13, color: '#856404', paddingVertical: 2 },
  applyButton: { margin: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm, textAlign: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
