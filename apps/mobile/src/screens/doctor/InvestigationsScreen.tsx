import React, { useCallback, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { consultationApi } from '../../api/endpoints';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SHADOWS, SPACING } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type InvestigationsRouteParams = {
  InvestigationsScreen: { consultationId: string };
};

type InvType = 'LAB' | 'RADIOLOGY' | 'ECG' | 'OTHER';
type Urgency = 'ROUTINE' | 'URGENT' | 'STAT';
type ResultStatus = 'PENDING' | 'AVAILABLE';

interface Investigation {
  id: string;
  type: InvType;
  name: string;
  urgency: Urgency;
  dateOrdered: string;
  resultStatus: ResultStatus;
  resultText?: string;
  resultDocumentUrl?: string;
}

interface OrderForm {
  type: InvType;
  name: string;
  urgency: Urgency;
  instructions: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<InvType, string> = {
  LAB: COLORS.info,
  RADIOLOGY: COLORS.primaryLight,
  ECG: COLORS.secondary,
  OTHER: COLORS.textSecondary,
};

const URGENCY_COLORS: Record<Urgency, string> = {
  ROUTINE: COLORS.success,
  URGENT: COLORS.warning,
  STAT: COLORS.error,
};

const URGENCY_TEXT_COLORS: Record<Urgency, string> = {
  ROUTINE: COLORS.white,
  URGENT: COLORS.text,
  STAT: COLORS.white,
};

const SUGGESTIONS: Record<InvType, string[]> = {
  LAB: [
    'FBC',
    'U&E',
    'LFTs',
    'CRP',
    'HbA1c',
    'HIV Test',
    'Malaria RDT',
    'TB GeneXpert',
    'Urine MCS',
    'Blood culture',
  ],
  RADIOLOGY: ['Chest X-ray', 'Abdominal USS', 'CT Head', 'MRI Brain'],
  ECG: ['12-lead ECG', 'Rhythm strip'],
  OTHER: [],
};

const DEFAULT_ORDER_FORM: OrderForm = {
  type: 'LAB',
  name: '',
  urgency: 'ROUTINE',
  instructions: '',
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TypeBadgeProps {
  type: InvType;
}
const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => (
  <View style={[badgeStyles.badge, { backgroundColor: TYPE_COLORS[type] }]}>
    <Text style={badgeStyles.text}>{type}</Text>
  </View>
);

interface UrgencyBadgeProps {
  urgency: Urgency;
}
const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => (
  <View style={[badgeStyles.badge, { backgroundColor: URGENCY_COLORS[urgency] }]}>
    <Text style={[badgeStyles.text, { color: URGENCY_TEXT_COLORS[urgency] }]}>{urgency}</Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export const InvestigationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<InvestigationsRouteParams, 'InvestigationsScreen'>>();
  const { consultationId } = route.params;

  const [activeTab, setActiveTab] = useState<'ORDERED' | 'RESULTS'>('ORDERED');
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderForm>(DEFAULT_ORDER_FORM);
  const [isOrdering, setIsOrdering] = useState(false);

  // ── Load investigations ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const resp = await consultationApi.getById(consultationId);
        const data = resp.data;
        const list: Investigation[] = Array.isArray(data?.investigations)
          ? data.investigations
          : [];
        setInvestigations(list);
      } catch {
        // Silently fall back
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [consultationId]);

  // ── Order investigation ──────────────────────────────────────────────────────
  const handleOrder = useCallback(async () => {
    if (!orderForm.name.trim()) {
      Alert.alert('Missing name', 'Please enter or select an investigation name.');
      return;
    }
    setIsOrdering(true);
    try {
      const newInv: Investigation = {
        id: Date.now().toString(),
        type: orderForm.type,
        name: orderForm.name.trim(),
        urgency: orderForm.urgency,
        dateOrdered: new Date().toISOString(),
        resultStatus: 'PENDING',
      };
      setInvestigations((prev) => [newInv, ...prev]);
      setShowOrderSheet(false);
      setOrderForm(DEFAULT_ORDER_FORM);
    } catch {
      Alert.alert('Error', 'Failed to order investigation.');
    } finally {
      setIsOrdering(false);
    }
  }, [orderForm]);

  // ── Upload result ────────────────────────────────────────────────────────────
  const handleUploadResult = useCallback(
    (invId: string) => {
      const doUpload = async (source: 'camera' | 'library') => {
        try {
          // In production: use react-native-image-picker, then send FormData
          const formData = new FormData();
          formData.append('investigationId', invId);
          formData.append('source', source);
          await consultationApi.uploadDocument(consultationId, formData);
          setInvestigations((prev) =>
            prev.map((inv) =>
              inv.id === invId
                ? { ...inv, resultStatus: 'AVAILABLE', resultText: 'Result uploaded' }
                : inv,
            ),
          );
          Alert.alert('Success', 'Result uploaded successfully.');
        } catch {
          Alert.alert('Error', 'Failed to upload result.');
        }
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
            cancelButtonIndex: 0,
          },
          (idx) => {
            if (idx === 1) doUpload('camera');
            else if (idx === 2) doUpload('library');
          },
        );
      } else {
        Alert.alert('Upload Result', 'Choose source', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => doUpload('camera') },
          { text: 'Choose from Gallery', onPress: () => doUpload('library') },
        ]);
      }
    },
    [consultationId],
  );

  // ── Render investigation card (Ordered tab) ──────────────────────────────────
  const renderOrderedItem = ({ item }: { item: Investigation }) => (
    <View style={styles.invCard}>
      <View style={styles.invCardHeader}>
        <TypeBadge type={item.type} />
        <UrgencyBadge urgency={item.urgency} />
      </View>
      <Text style={styles.invName}>{item.name}</Text>
      <Text style={styles.invDate}>Ordered: {formatDate(item.dateOrdered)}</Text>
    </View>
  );

  // ── Render investigation card (Results tab) ──────────────────────────────────
  const renderResultItem = ({ item }: { item: Investigation }) => (
    <View style={styles.invCard}>
      <View style={styles.invCardHeader}>
        <TypeBadge type={item.type} />
        <View
          style={[
            styles.resultBadge,
            {
              backgroundColor:
                item.resultStatus === 'AVAILABLE' ? COLORS.success : COLORS.textSecondary,
            },
          ]}
        >
          <Text style={styles.resultBadgeText}>
            {item.resultStatus === 'AVAILABLE' ? 'Results Available' : 'Pending'}
          </Text>
        </View>
      </View>
      <Text style={styles.invName}>{item.name}</Text>

      {item.resultStatus === 'PENDING' ? (
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => handleUploadResult(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadBtnText}>Upload Result</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.resultContainer}>
          {item.resultText ? (
            <Text style={styles.resultText}>{item.resultText}</Text>
          ) : null}
          {item.resultDocumentUrl ? (
            <TouchableOpacity style={styles.viewDocBtn} activeOpacity={0.8}>
              <Text style={styles.viewDocBtnText}>View Document</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investigations</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['ORDERED', 'RESULTS'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={investigations}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'ORDERED' ? renderOrderedItem : renderResultItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeTab === 'ORDERED'
                  ? 'No investigations ordered yet'
                  : 'No results available yet'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB – Order Investigation */}
      {activeTab === 'ORDERED' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowOrderSheet(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* ── Order Investigation Bottom Sheet ─────────────────────────────────── */}
      <Modal
        visible={showOrderSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrderSheet(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowOrderSheet(false)}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>Order Investigation</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Type selector */}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.chipRow}>
              {(['LAB', 'RADIOLOGY', 'ECG', 'OTHER'] as InvType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    orderForm.type === t && { backgroundColor: TYPE_COLORS[t] },
                  ]}
                  onPress={() => setOrderForm((f) => ({ ...f, type: t, name: '' }))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      orderForm.type === t && styles.typeChipTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name input */}
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Investigation name..."
              placeholderTextColor={COLORS.textSecondary}
              value={orderForm.name}
              onChangeText={(v) => setOrderForm((f) => ({ ...f, name: v }))}
            />

            {/* Suggestions */}
            {SUGGESTIONS[orderForm.type].length > 0 && (
              <View style={styles.suggestionRow}>
                {SUGGESTIONS[orderForm.type].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.suggestionChip,
                      orderForm.name === s && styles.suggestionChipSelected,
                    ]}
                    onPress={() => setOrderForm((f) => ({ ...f, name: s }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        orderForm.name === s && styles.suggestionChipTextSelected,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Urgency selector */}
            <Text style={styles.fieldLabel}>Urgency</Text>
            <View style={styles.urgencyRow}>
              {(['ROUTINE', 'URGENT', 'STAT'] as Urgency[]).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.urgencyChip,
                    orderForm.urgency === u && {
                      backgroundColor: URGENCY_COLORS[u],
                      borderColor: URGENCY_COLORS[u],
                    },
                  ]}
                  onPress={() => setOrderForm((f) => ({ ...f, urgency: u }))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.urgencyChipText,
                      orderForm.urgency === u && {
                        color: URGENCY_TEXT_COLORS[u],
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Special instructions */}
            <Text style={styles.fieldLabel}>Special Instructions</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="Any special instructions..."
              placeholderTextColor={COLORS.textSecondary}
              value={orderForm.instructions}
              onChangeText={(v) => setOrderForm((f) => ({ ...f, instructions: v }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Buttons */}
            <View style={styles.sheetBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowOrderSheet(false);
                  setOrderForm(DEFAULT_ORDER_FORM);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.orderBtn, isOrdering && { opacity: 0.6 }]}
                onPress={handleOrder}
                activeOpacity={0.85}
                disabled={isOrdering}
              >
                {isOrdering ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.orderBtnText}>Order</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  invCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  invCardHeader: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  invName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  invDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  resultBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  resultBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  uploadBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  resultContainer: {
    marginTop: SPACING.sm,
  },
  resultText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  viewDocBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  viewDocBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  fabIcon: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  bottomSheetTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  fieldInputMulti: {
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeChipTextSelected: {
    color: COLORS.white,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  suggestionChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  suggestionChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
  suggestionChipTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  urgencyChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  urgencyChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sheetBtnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  orderBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  orderBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
});

export default InvestigationsScreen;
