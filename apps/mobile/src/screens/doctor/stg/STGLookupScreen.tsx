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
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { apiClient } from '../../../api/client';
import { documentsApi } from '../../../api/endpoints';
import { useMode } from '../../../context/ModeContext';

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
interface Part1PrepPoint {
  question: string;
  answer: string;
}

interface LearningPoints {
  pathophysiology: string;
  classicPresentation: string;
  keyExamFindings: string[];
  clinicalPearls: string[];
  complications: string[];
  differentialTips: string;
  memorableMnemonic?: string;
  saContext: string;
  part1PharmacologyPearls?: string[];
  part1ExamTraps?: string[];
  part1MustKnow?: Part1PrepPoint[];
  part1ClassicScenario?: string;
}

interface EMLFormulation {
  form: string;
  strength: string;
  levelOfCare: 'PHC' | 'District' | 'Regional' | 'Tertiary' | 'All';
  notes?: string;
}

interface EMLEntry {
  genericName: string;
  brandExamples: string[];
  schedule: string;
  atcCode?: string;
  formulations: EMLFormulation[];
  isOnEML: boolean;
  emlCategory: 'Core' | 'Complementary' | 'Not Listed';
  therapeuticCategory: string;
  costTier: string;
  publicSectorAvailability: string;
  prescribingRestrictions?: string;
  saContext: string;
  alternatives?: string[];
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
  const { mode: appMode } = useMode();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'name' | 'icd10' | 'eml'>('name');
  const [emlQuery, setEmlQuery] = useState('');
  const [emlEntry, setEmlEntry] = useState<EMLEntry | null>(null);
  const [loadingEML, setLoadingEML] = useState(false);
  const [results, setResults] = useState<STGEntry[]>([]);
  const [icd10Results, setIcd10Results] = useState<ICD10Result[]>([]);
  const [selectedSTG, setSelectedSTG] = useState<STGEntry | null>(null);
  const [adaptedSTG, setAdaptedSTG] = useState<{ checklist: ChecklistItem[]; aiNotes: string; contraindications: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAdapted, setLoadingAdapted] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [learningPoints, setLearningPoints] = useState<LearningPoints | null>(null);
  const [loadingLP, setLoadingLP] = useState(false);

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

  async function loadLearningPoints(stg: STGEntry) {
    setLearningPoints(null);
    setLoadingLP(true);
    try {
      const res = await documentsApi.getLearningPoints({
        conditionName: stg.conditionName,
        icd10Code: stg.icd10Code,
        category: stg.category,
        firstLineTreatment: stg.firstLineTreatment,
        investigations: stg.investigations,
        redFlags: stg.redFlags,
      });
      setLearningPoints(res.data?.data?.learningPoints ?? null);
    } catch {
      // silent — LP is a bonus for interns, not blocking
    } finally {
      setLoadingLP(false);
    }
  }

  async function selectSTG(stg: STGEntry) {
    setSelectedSTG(stg);
    setResults([]);
    setIcd10Results([]);
    setQuery(stg.conditionName);
    setLearningPoints(null);

    if (appMode === 'INTERN') {
      loadLearningPoints(stg);
    }

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

  async function lookupEML(name: string) {
    if (!name.trim()) return;
    setEmlEntry(null);
    setLoadingEML(true);
    try {
      const res = await documentsApi.emlLookup({ medicineName: name.trim() });
      setEmlEntry(res.data?.data?.emlEntry ?? null);
    } catch {
      // silent fail
    } finally {
      setLoadingEML(false);
    }
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
            onPress={() => { setMode('name'); setQuery(''); setResults([]); setIcd10Results([]); setEmlEntry(null); }}
          >
            <Text style={[styles.modeBtnText, mode === 'name' && styles.modeBtnTextActive]}>
              Condition
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'icd10' && styles.modeBtnActive]}
            onPress={() => { setMode('icd10'); setQuery(''); setResults([]); setIcd10Results([]); setEmlEntry(null); }}
          >
            <Text style={[styles.modeBtnText, mode === 'icd10' && styles.modeBtnTextActive]}>
              ICD-10
            </Text>
          </TouchableOpacity>
          {appMode === 'INTERN' && (
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'eml' && styles.modeBtnActive]}
              onPress={() => { setMode('eml'); setQuery(''); setResults([]); setIcd10Results([]); setSelectedSTG(null); setEmlEntry(null); }}
            >
              <Text style={[styles.modeBtnText, mode === 'eml' && styles.modeBtnTextActive]}>
                EML 💊
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {mode === 'eml' ? (
          <View style={emlStyles.searchRow}>
            <TextInput
              mode="outlined"
              placeholder="e.g. Amoxicillin, Metformin, Atenolol..."
              value={emlQuery}
              onChangeText={setEmlQuery}
              left={<TextInput.Icon icon="pill" color={COLORS.secondary} />}
              right={emlQuery ? <TextInput.Icon icon="close" onPress={() => { setEmlQuery(''); setEmlEntry(null); }} /> : undefined}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.secondary}
              style={[styles.searchInput, { flex: 1 }]}
            />
            <TouchableOpacity
              style={[emlStyles.lookupBtn, loadingEML && { opacity: 0.6 }]}
              onPress={() => lookupEML(emlQuery)}
              disabled={loadingEML || !emlQuery.trim()}
              activeOpacity={0.8}
            >
              {loadingEML ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={emlStyles.lookupBtnText}>Look up</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
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
        )}
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

              {/* Intern Mode: Learning Points */}
              {appMode === 'INTERN' && (
                loadingLP ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading clinical insights...</Text>
                  </View>
                ) : learningPoints ? (
                  <Surface style={lpStyles.card} elevation={1}>
                    <Text style={lpStyles.cardTitle}>🎓 Clinical Learning Points</Text>

                    <Text style={lpStyles.label}>Pathophysiology</Text>
                    <Text style={lpStyles.body}>{learningPoints.pathophysiology}</Text>

                    <Text style={lpStyles.label}>Classic Presentation</Text>
                    <Text style={lpStyles.body}>{learningPoints.classicPresentation}</Text>

                    {learningPoints.keyExamFindings.length > 0 && (
                      <>
                        <Text style={lpStyles.label}>Key Examination Findings</Text>
                        {learningPoints.keyExamFindings.map((f, i) => (
                          <Text key={i} style={lpStyles.bullet}>• {f}</Text>
                        ))}
                      </>
                    )}

                    {learningPoints.clinicalPearls.length > 0 && (
                      <>
                        <Text style={lpStyles.label}>Clinical Pearls</Text>
                        {learningPoints.clinicalPearls.map((p, i) => (
                          <Text key={i} style={[lpStyles.bullet, { color: COLORS.secondary }]}>💡 {p}</Text>
                        ))}
                      </>
                    )}

                    {learningPoints.complications.length > 0 && (
                      <>
                        <Text style={lpStyles.label}>Complications to Watch</Text>
                        {learningPoints.complications.map((c, i) => (
                          <Text key={i} style={lpStyles.bullet}>⚠️ {c}</Text>
                        ))}
                      </>
                    )}

                    <Text style={lpStyles.label}>Differential Diagnosis Tips</Text>
                    <Text style={lpStyles.body}>{learningPoints.differentialTips}</Text>

                    {learningPoints.memorableMnemonic ? (
                      <>
                        <Text style={lpStyles.label}>Mnemonic</Text>
                        <View style={lpStyles.mnemonicBox}>
                          <Text style={lpStyles.mnemonicText}>{learningPoints.memorableMnemonic}</Text>
                        </View>
                      </>
                    ) : null}

                    <Text style={lpStyles.label}>SA Context</Text>
                    <Text style={lpStyles.body}>{learningPoints.saContext}</Text>

                    {/* Part 1 Exam Prep — shown only when the model includes content */}
                    {(learningPoints.part1PharmacologyPearls?.length ||
                      learningPoints.part1ExamTraps?.length ||
                      learningPoints.part1MustKnow?.length ||
                      learningPoints.part1ClassicScenario) ? (
                      <>
                    <View style={p1Styles.divider} />
                    <Text style={p1Styles.sectionHeader}>📝 Part 1 Exam Prep</Text>
                    <Text style={p1Styles.sectionSubtitle}>FCP · FC Paeds · FCFP · FC Psych · MMed</Text>
                    </>) : null}

                    {(learningPoints.part1PharmacologyPearls?.length ?? 0) > 0 && (
                      <>
                        <Text style={p1Styles.label}>Pharmacology Pearls</Text>
                        {(learningPoints.part1PharmacologyPearls ?? []).map((pearl, i) => (
                          <View key={i} style={p1Styles.pharmRow}>
                            <Text style={p1Styles.pharmDot}>💊</Text>
                            <Text style={p1Styles.pharmText}>{pearl}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {(learningPoints.part1ExamTraps?.length ?? 0) > 0 && (
                      <>
                        <Text style={p1Styles.label}>Exam Traps</Text>
                        {(learningPoints.part1ExamTraps ?? []).map((trap, i) => (
                          <View key={i} style={p1Styles.trapRow}>
                            <Text style={p1Styles.trapDot}>⚠️</Text>
                            <Text style={p1Styles.trapText}>{trap}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {(learningPoints.part1MustKnow?.length ?? 0) > 0 && (
                      <>
                        <Text style={p1Styles.label}>Must-Know Q&A</Text>
                        {(learningPoints.part1MustKnow ?? []).map((qa, i) => (
                          <View key={i} style={p1Styles.qaCard}>
                            <Text style={p1Styles.qaQuestion}>Q: {qa.question}</Text>
                            <Text style={p1Styles.qaAnswer}>A: {qa.answer}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {learningPoints.part1ClassicScenario ? (
                      <>
                        <Text style={p1Styles.label}>Classic Vignette</Text>
                        <View style={p1Styles.vignette}>
                          <Text style={p1Styles.vignetteText}>{learningPoints.part1ClassicScenario}</Text>
                        </View>
                      </>
                    ) : null}
                  </Surface>
                ) : null
              )}

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

      {/* EML Result */}
      {mode === 'eml' && emlEntry && (
        <FlatList
          data={[emlEntry]}
          keyExtractor={() => 'eml'}
          renderItem={() => (
            <View style={emlStyles.resultContainer}>
              {/* Header */}
              <Surface style={emlStyles.headerCard} elevation={1}>
                <View style={emlStyles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={emlStyles.genericName}>{emlEntry.genericName}</Text>
                    <Text style={emlStyles.therapCat}>{emlEntry.therapeuticCategory}</Text>
                    {emlEntry.atcCode && <Text style={emlStyles.atcCode}>ATC: {emlEntry.atcCode}</Text>}
                  </View>
                  <View style={[emlStyles.emlBadge, {
                    backgroundColor: emlEntry.emlCategory === 'Core'
                      ? COLORS.secondary
                      : emlEntry.emlCategory === 'Complementary'
                        ? COLORS.warning
                        : COLORS.error,
                  }]}>
                    <Text style={emlStyles.emlBadgeText}>{emlEntry.emlCategory}</Text>
                  </View>
                </View>

                <View style={emlStyles.tagRow}>
                  <View style={emlStyles.tag}>
                    <Text style={emlStyles.tagLabel}>Schedule</Text>
                    <Text style={emlStyles.tagValue}>{emlEntry.schedule}</Text>
                  </View>
                  <View style={emlStyles.tag}>
                    <Text style={emlStyles.tagLabel}>Cost</Text>
                    <Text style={emlStyles.tagValue} numberOfLines={2}>{emlEntry.costTier}</Text>
                  </View>
                </View>

                {emlEntry.brandExamples.length > 0 && (
                  <Text style={emlStyles.brands}>Brands: {emlEntry.brandExamples.join(', ')}</Text>
                )}
              </Surface>

              {/* Public sector availability */}
              <Surface style={emlStyles.section} elevation={1}>
                <Text style={emlStyles.sectionTitle}>Public Sector Availability</Text>
                <Text style={emlStyles.bodyText}>{emlEntry.publicSectorAvailability}</Text>
              </Surface>

              {/* Formulations */}
              {emlEntry.formulations.length > 0 && (
                <Surface style={emlStyles.section} elevation={1}>
                  <Text style={emlStyles.sectionTitle}>SA Formulations</Text>
                  {emlEntry.formulations.map((f, i) => (
                    <View key={i} style={emlStyles.formulationRow}>
                      <View style={[emlStyles.locBadge, {
                        backgroundColor: f.levelOfCare === 'PHC' ? COLORS.secondary + '20'
                          : f.levelOfCare === 'All' ? COLORS.primary + '20'
                            : COLORS.warning + '20',
                      }]}>
                        <Text style={[emlStyles.locText, {
                          color: f.levelOfCare === 'PHC' ? COLORS.secondary
                            : f.levelOfCare === 'All' ? COLORS.primary
                              : COLORS.warning,
                        }]}>{f.levelOfCare}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={emlStyles.formulationText}>{f.form} {f.strength}</Text>
                        {f.notes && <Text style={emlStyles.formulationNotes}>{f.notes}</Text>}
                      </View>
                    </View>
                  ))}
                </Surface>
              )}

              {/* Prescribing restrictions */}
              {emlEntry.prescribingRestrictions && emlEntry.prescribingRestrictions !== 'null' && (
                <Surface style={[emlStyles.section, { backgroundColor: '#FFF8E0', borderColor: '#FFD700', borderWidth: 1 }]} elevation={0}>
                  <Text style={[emlStyles.sectionTitle, { color: '#856404' }]}>⚠️ Prescribing Restrictions</Text>
                  <Text style={[emlStyles.bodyText, { color: '#856404' }]}>{emlEntry.prescribingRestrictions}</Text>
                </Surface>
              )}

              {/* SA Context */}
              <Surface style={emlStyles.section} elevation={1}>
                <Text style={emlStyles.sectionTitle}>SA Context</Text>
                <Text style={emlStyles.bodyText}>{emlEntry.saContext}</Text>
              </Surface>

              {/* Alternatives */}
              {emlEntry.alternatives && emlEntry.alternatives.length > 0 && (
                <Surface style={emlStyles.section} elevation={1}>
                  <Text style={emlStyles.sectionTitle}>Alternatives</Text>
                  {emlEntry.alternatives.map((alt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={emlStyles.altRow}
                      onPress={() => { setEmlQuery(alt); lookupEML(alt); }}
                      activeOpacity={0.7}
                    >
                      <Text style={emlStyles.altText}>→ {alt}</Text>
                    </TouchableOpacity>
                  ))}
                </Surface>
              )}

              <View style={{ height: SPACING.xxl }} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        />
      )}

      {/* EML empty / prompt state */}
      {mode === 'eml' && !emlEntry && !loadingEML && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>SA Essential Medicines List</Text>
          <Text style={styles.emptyText}>
            Search any medicine by generic name to check if it's on the SA EML, its schedule, available formulations, and public sector availability.
          </Text>
        </View>
      )}

      {/* Empty state */}
      {mode !== 'eml' && !loading && !selectedSTG && results.length === 0 && icd10Results.length === 0 && (
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

const lpStyles = StyleSheet.create({
  card: {
    margin: SPACING.md,
    marginTop: 0,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  bullet: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    paddingLeft: SPACING.sm,
    marginBottom: 2,
  },
  mnemonicBox: {
    backgroundColor: '#E0F2FE',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: 4,
  },
  mnemonicText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C4A6E',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});

const emlStyles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  lookupBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
  },
  lookupBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  resultContainer: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  headerCard: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  genericName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  therapCat: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  atcCode: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emlBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emlBadgeText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 11,
  },
  tagRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tag: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  tagLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  brands: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  formulationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  locBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  locText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formulationText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  formulationNotes: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  altRow: {
    paddingVertical: SPACING.xs,
  },
  altText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

const p1Styles = StyleSheet.create({
  divider: {
    borderTopWidth: 2,
    borderTopColor: '#FDE68A',
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginTop: SPACING.sm,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pharmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  pharmDot: {
    fontSize: 13,
    marginTop: 1,
  },
  pharmText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
    flex: 1,
  },
  trapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  trapDot: {
    fontSize: 13,
    marginTop: 1,
  },
  trapText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
    flex: 1,
    fontStyle: 'italic',
  },
  qaCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  qaQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 4,
    lineHeight: 18,
  },
  qaAnswer: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
  vignette: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: SPACING.xs,
  },
  vignetteText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 21,
  },
});
