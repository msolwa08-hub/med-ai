import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import {
  Text, Surface, Button, TextInput, Chip, ActivityIndicator,
  Snackbar, IconButton, Divider, Badge,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { apiClient } from '../../api/client';

type LabProvider = 'LANCET' | 'AMPATH' | 'LAB24' | 'PATHCARE' | 'NHLS' | 'OTHER';

interface LabAccount {
  id: string;
  provider: LabProvider;
  providerPatientId: string;
  linkedAt: string;
  lastSyncAt?: string;
  isActive: boolean;
}

interface LabResultValue {
  name: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  flag?: 'H' | 'L' | 'HH' | 'LL' | 'N';
}

interface LabResult {
  id: string;
  provider: LabProvider;
  testName: string;
  collectedAt: string;
  reportedAt?: string;
  isAbnormal: boolean;
  importedAt: string;
  results: LabResultValue[] | null;
  consultationId?: string;
  labAccountId: string;
}

const PROVIDER_COLORS: Record<LabProvider, string> = {
  LANCET: '#E53935',
  AMPATH: '#1565C0',
  LAB24: '#2E7D32',
  PATHCARE: '#6A1B9A',
  NHLS: '#E65100',
  OTHER: COLORS.textSecondary,
};

const PROVIDER_LOGOS: Record<LabProvider, string> = {
  LANCET: 'L',
  AMPATH: 'A',
  LAB24: '24',
  PATHCARE: 'P',
  NHLS: 'N',
  OTHER: '?',
};

type ActiveTab = 'accounts' | 'results';

export default function LabResultsScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('results');
  const [accounts, setAccounts] = useState<LabAccount[]>([]);
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [filterAbnormal, setFilterAbnormal] = useState(false);
  const [filterProvider, setFilterProvider] = useState<LabProvider | null>(null);

  // Link account form
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkProvider, setLinkProvider] = useState<LabProvider>('LANCET');
  const [linkId, setLinkId] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    try {
      const [accountsRes, resultsRes] = await Promise.all([
        apiClient.get('/labs/accounts'),
        apiClient.get('/labs/results', {
          params: {
            ...(filterAbnormal && { isAbnormal: 'true' }),
            ...(filterProvider && { provider: filterProvider }),
            limit: 50,
          },
        }),
      ]);
      setAccounts(accountsRes.data.data?.accounts ?? []);
      setResults(resultsRes.data.data?.results ?? []);
    } catch {
      setSnackbar('Failed to load lab data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterAbnormal, filterProvider]);

  useEffect(() => { load(); }, [load]);

  async function syncNow() {
    setSyncing(true);
    try {
      await apiClient.post('/labs/sync');
      setSnackbar('Sync triggered — new results will appear shortly');
      setTimeout(() => load(), 3000);
    } catch {
      setSnackbar('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  async function linkAccount() {
    if (!linkId.trim()) {
      setSnackbar('Patient ID is required');
      return;
    }
    setLinking(true);
    try {
      await apiClient.post('/labs/accounts', {
        provider: linkProvider,
        providerPatientId: linkId.trim(),
        providerPassword: linkPassword || undefined,
      });
      setSnackbar(`${linkProvider} account linked successfully`);
      setShowLinkForm(false);
      setLinkId('');
      setLinkPassword('');
      load();
    } catch {
      setSnackbar('Failed to link account. Check your patient ID.');
    } finally {
      setLinking(false);
    }
  }

  async function unlinkAccount(accountId: string, provider: LabProvider) {
    try {
      await apiClient.delete(`/labs/accounts/${accountId}`);
      setSnackbar(`${provider} account unlinked`);
      load();
    } catch {
      setSnackbar('Failed to unlink account');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading lab results...</Text>
      </View>
    );
  }

  const abnormalCount = results.filter((r) => r.isAbnormal).length;
  const filteredResults = results.filter((r) => {
    if (filterAbnormal && !r.isAbnormal) return false;
    if (filterProvider && r.provider !== filterProvider) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Lab Results</Text>
          <Text style={styles.subtitle}>{results.length} results · {accounts.length} accounts linked</Text>
        </View>
        <Button
          mode="contained"
          onPress={syncNow}
          loading={syncing}
          disabled={syncing || accounts.length === 0}
          buttonColor={COLORS.primary}
          icon="sync"
          compact
        >
          Sync
        </Button>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.tabActive]}
          onPress={() => setActiveTab('results')}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>
            Results
          </Text>
          {abnormalCount > 0 && (
            <View style={styles.abnormalBadge}>
              <Text style={styles.abnormalBadgeText}>{abnormalCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accounts' && styles.tabActive]}
          onPress={() => setActiveTab('accounts')}
        >
          <Text style={[styles.tabText, activeTab === 'accounts' && styles.tabTextActive]}>
            Lab Accounts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />}
      >
        {activeTab === 'results' ? (
          <>
            {/* Filters */}
            <View style={styles.filterRow}>
              <Chip
                selected={filterAbnormal}
                onPress={() => setFilterAbnormal(!filterAbnormal)}
                style={filterAbnormal ? styles.filterChipActive : styles.filterChip}
                textStyle={filterAbnormal ? styles.filterChipTextActive : undefined}
                icon="alert-circle"
              >
                Abnormal only
              </Chip>
              {(Object.keys(PROVIDER_COLORS) as LabProvider[]).map((p) => {
                const hasResults = results.some((r) => r.provider === p);
                if (!hasResults) return null;
                return (
                  <Chip
                    key={p}
                    selected={filterProvider === p}
                    onPress={() => setFilterProvider(filterProvider === p ? null : p)}
                    style={filterProvider === p ? { ...styles.filterChip, backgroundColor: PROVIDER_COLORS[p] + '20' } : styles.filterChip}
                    textStyle={filterProvider === p ? { color: PROVIDER_COLORS[p] } : undefined}
                  >
                    {p}
                  </Chip>
                );
              })}
            </View>

            {filteredResults.length === 0 ? (
              <Surface style={styles.emptyCard} elevation={1}>
                <Text style={styles.emptyIcon}>🧪</Text>
                <Text style={styles.emptyTitle}>No lab results yet</Text>
                <Text style={styles.emptyDesc}>
                  {accounts.length === 0
                    ? 'Link a lab account to import your results automatically.'
                    : 'Tap Sync to fetch your latest results from linked labs.'}
                </Text>
                {accounts.length === 0 && (
                  <Button
                    mode="contained"
                    onPress={() => { setActiveTab('accounts'); setShowLinkForm(true); }}
                    buttonColor={COLORS.primary}
                    style={{ marginTop: SPACING.md }}
                  >
                    Link Lab Account
                  </Button>
                )}
              </Surface>
            ) : (
              filteredResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  onPress={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                >
                  <Surface style={[styles.resultCard, result.isAbnormal && styles.resultCardAbnormal]} elevation={1}>
                    <View style={styles.resultHeader}>
                      <View style={[styles.providerDot, { backgroundColor: PROVIDER_COLORS[result.provider] }]}>
                        <Text style={styles.providerDotText}>{PROVIDER_LOGOS[result.provider]}</Text>
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.testName}>{result.testName}</Text>
                        <Text style={styles.resultMeta}>
                          {result.provider} · {formatDate(result.collectedAt)}
                        </Text>
                      </View>
                      <View style={styles.resultRight}>
                        {result.isAbnormal && (
                          <View style={styles.abnormalTag}>
                            <Text style={styles.abnormalTagText}>ABNORMAL</Text>
                          </View>
                        )}
                        <IconButton
                          icon={selectedResult?.id === result.id ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          iconColor={COLORS.textSecondary}
                        />
                      </View>
                    </View>

                    {selectedResult?.id === result.id && result.results && (
                      <>
                        <Divider style={{ marginVertical: SPACING.sm }} />
                        <Text style={styles.detailsTitle}>Test Results</Text>
                        {result.results.map((rv, i) => (
                          <View key={i} style={styles.resultValueRow}>
                            <View style={styles.resultValueLeft}>
                              <Text style={styles.resultValueName}>{rv.name}</Text>
                              {rv.referenceRange && (
                                <Text style={styles.refRange}>Ref: {rv.referenceRange}</Text>
                              )}
                            </View>
                            <View style={styles.resultValueRight}>
                              <Text style={[
                                styles.resultValue,
                                (rv.flag === 'H' || rv.flag === 'HH') && styles.valueHigh,
                                (rv.flag === 'L' || rv.flag === 'LL') && styles.valueLow,
                              ]}>
                                {rv.value} {rv.unit ?? ''}
                              </Text>
                              {rv.flag && rv.flag !== 'N' && (
                                <Text style={[
                                  styles.flagBadge,
                                  (rv.flag === 'H' || rv.flag === 'HH') ? styles.flagHigh : styles.flagLow,
                                ]}>
                                  {rv.flag}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                        {result.reportedAt && (
                          <Text style={styles.reportedAt}>
                            Reported: {formatDate(result.reportedAt)}
                          </Text>
                        )}
                      </>
                    )}

                    {selectedResult?.id === result.id && !result.results && (
                      <>
                        <Divider style={{ marginVertical: SPACING.sm }} />
                        <Text style={styles.noDetails}>
                          Detailed breakdown not available for this result.
                        </Text>
                      </>
                    )}
                  </Surface>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            {/* Linked accounts */}
            {accounts.map((account) => (
              <Surface key={account.id} style={styles.accountCard} elevation={1}>
                <View style={styles.accountRow}>
                  <View style={[styles.accountLogo, { backgroundColor: PROVIDER_COLORS[account.provider] }]}>
                    <Text style={styles.accountLogoText}>{PROVIDER_LOGOS[account.provider]}</Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountProvider}>{account.provider}</Text>
                    <Text style={styles.accountId}>Patient ID: {account.providerPatientId}</Text>
                    {account.lastSyncAt && (
                      <Text style={styles.accountSync}>Last sync: {formatDate(account.lastSyncAt)}</Text>
                    )}
                  </View>
                  <View style={styles.accountActions}>
                    <View style={[styles.statusDot, { backgroundColor: account.isActive ? COLORS.secondary : COLORS.error }]} />
                    <IconButton
                      icon="link-off"
                      size={18}
                      iconColor={COLORS.error}
                      onPress={() => unlinkAccount(account.id, account.provider)}
                    />
                  </View>
                </View>
              </Surface>
            ))}

            {/* Link new account */}
            {showLinkForm ? (
              <Surface style={styles.linkCard} elevation={1}>
                <Text style={styles.linkTitle}>Link Lab Account</Text>
                <Text style={styles.linkSubtitle}>
                  Enter the patient ID from your lab provider. This lets MedAI import your results automatically.
                </Text>

                <Text style={styles.fieldLabel}>Lab Provider</Text>
                <View style={styles.providerChips}>
                  {(['LANCET', 'AMPATH', 'LAB24', 'PATHCARE', 'NHLS'] as LabProvider[]).map((p) => (
                    <Chip
                      key={p}
                      selected={linkProvider === p}
                      onPress={() => setLinkProvider(p)}
                      style={[styles.providerChip, linkProvider === p && { backgroundColor: PROVIDER_COLORS[p] + '20' }]}
                      textStyle={linkProvider === p ? { color: PROVIDER_COLORS[p], fontWeight: '700' } : undefined}
                    >
                      {p}
                    </Chip>
                  ))}
                </View>

                <TextInput
                  mode="outlined"
                  label="Patient ID / Account Number"
                  value={linkId}
                  onChangeText={setLinkId}
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={styles.linkInput}
                  autoCapitalize="none"
                />
                <TextInput
                  mode="outlined"
                  label="Portal Password (optional)"
                  value={linkPassword}
                  onChangeText={setLinkPassword}
                  secureTextEntry
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={styles.linkInput}
                />

                <View style={styles.linkButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowLinkForm(false)}
                    style={styles.linkCancelBtn}
                    textColor={COLORS.textSecondary}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={linkAccount}
                    loading={linking}
                    disabled={linking || !linkId.trim()}
                    buttonColor={COLORS.primary}
                    style={styles.linkConfirmBtn}
                  >
                    Link Account
                  </Button>
                </View>
              </Surface>
            ) : (
              <Button
                mode="outlined"
                icon="plus"
                onPress={() => setShowLinkForm(true)}
                style={styles.addAccountBtn}
                textColor={COLORS.primary}
              >
                Link Lab Account
              </Button>
            )}

            {/* Privacy notice */}
            <Surface style={styles.privacyCard} elevation={0}>
              <Text style={styles.privacyTitle}>🔒 Privacy Notice</Text>
              <Text style={styles.privacyText}>
                Your lab credentials are encrypted with AES-256-GCM and never stored in plain text. Results are automatically imported and linked to your medical record. You can unlink any account at any time.
              </Text>
            </Surface>
          </>
        )}
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  tab: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  abnormalBadge: { backgroundColor: COLORS.error, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  abnormalBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  filterChip: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.divider },
  filterChipActive: { backgroundColor: COLORS.error + '15', borderWidth: 1, borderColor: COLORS.error },
  filterChipTextActive: { color: COLORS.error },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  emptyDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  resultCardAbnormal: { borderLeftWidth: 3, borderLeftColor: COLORS.error },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  providerDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  providerDotText: { color: COLORS.white, fontWeight: '800', fontSize: 12 },
  resultInfo: { flex: 1 },
  testName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  resultMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  resultRight: { flexDirection: 'row', alignItems: 'center' },
  abnormalTag: { backgroundColor: COLORS.error + '15', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  abnormalTagText: { fontSize: 10, fontWeight: '800', color: COLORS.error },
  detailsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  resultValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  resultValueLeft: { flex: 1 },
  resultValueName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  refRange: { fontSize: 11, color: COLORS.textLight },
  resultValueRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  valueHigh: { color: COLORS.error },
  valueLow: { color: '#1565C0' },
  flagBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  flagHigh: { backgroundColor: COLORS.error + '20', color: COLORS.error },
  flagLow: { backgroundColor: '#1565C020', color: '#1565C0' },
  reportedAt: { fontSize: 11, color: COLORS.textLight, marginTop: SPACING.xs, textAlign: 'right' },
  noDetails: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  accountCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  accountRow: { flexDirection: 'row', alignItems: 'center' },
  accountLogo: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  accountLogoText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  accountInfo: { flex: 1 },
  accountProvider: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  accountId: { fontSize: 13, color: COLORS.textSecondary },
  accountSync: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  accountActions: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  linkCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  linkTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  linkSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 19 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  providerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  providerChip: { borderWidth: 1, borderColor: COLORS.divider },
  linkInput: { backgroundColor: COLORS.surface, marginBottom: SPACING.sm },
  linkButtons: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  linkCancelBtn: { flex: 1, borderColor: COLORS.divider },
  linkConfirmBtn: { flex: 1 },
  addAccountBtn: { borderColor: COLORS.primary, marginBottom: SPACING.md },
  privacyCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  privacyTitle: { fontSize: 13, fontWeight: '700', color: COLORS.secondary, marginBottom: SPACING.xs },
  privacyText: { fontSize: 12, color: '#2E7D32', lineHeight: 18 },
});
