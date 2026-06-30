import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TermsConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

// ─── Consent sections ─────────────────────────────────────────────────────────

interface ConsentSection {
  title: string;
  items: string[];
}

const CONSENT_SECTIONS: ConsentSection[] = [
  {
    title: '1. Terms of Service',
    items: [
      'MedAI is a telemedicine platform connecting patients with registered healthcare professionals.',
      'Consultations are for non-emergency medical care only. In an emergency, call 10111 or go to the nearest hospital.',
      'Medical advice provided through MedAI is not a substitute for in-person emergency care.',
      'You must provide accurate information; false information may harm your health.',
    ],
  },
  {
    title: '2. Privacy Policy & POPIA Compliance',
    items: [
      'MedAI complies with the Protection of Personal Information Act (POPIA) No. 4 of 2013.',
      'Your medical information is encrypted with AES-256-GCM encryption.',
      'Your data is stored on servers in South Africa.',
      'Your information is only shared with your treating doctor during an active consultation.',
      'You may request deletion of your data by contacting privacy@medai.co.za.',
      'Medical records are retained for the minimum period required by the Health Act.',
    ],
  },
  {
    title: '3. AI-Assisted Care',
    items: [
      'MedAI uses artificial intelligence to assist with medical history taking.',
      'AI suggestions are reviewed and confirmed by a qualified doctor before any clinical decisions.',
      'The AI does not replace clinical judgment.',
    ],
  },
  {
    title: '4. Consent to Process Medical Data',
    items: [
      'By accepting, you consent to MedAI processing your personal and medical information as described above.',
      'Consent version: v1.0 (June 2026)',
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TermsConsentModal({
  visible,
  onAccept,
  onDecline,
}: TermsConsentModalProps): React.JSX.Element {
  const [agreed, setAgreed] = useState(false);

  function handleAccept(): void {
    if (!agreed) return;
    onAccept();
  }

  function handleClose(): void {
    setAgreed(false);
    onDecline();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Terms &amp; Conditions</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeButton}
              accessibilityLabel="Close terms and conditions"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.introText}>
            Please read the following carefully before creating your account.
          </Text>

          {/* Scrollable consent content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {CONSENT_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bullet}>{'•'}</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}

            {/* Fade hint — extra padding so last item isn't hidden behind sticky footer */}
            <View style={styles.scrollBottomPadding} />
          </ScrollView>

          {/* Sticky footer */}
          <View style={styles.footer}>
            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed((v) => !v)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the Terms of Service and Privacy Policy
              </Text>
            </TouchableOpacity>

            {/* Accept button */}
            <TouchableOpacity
              style={[styles.acceptButton, !agreed && styles.acceptButtonDisabled]}
              onPress={handleAccept}
              disabled={!agreed}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: !agreed }}
              accessibilityLabel="Accept and continue"
            >
              <Text style={[styles.acceptButtonText, !agreed && styles.acceptButtonTextDisabled]}>
                Accept &amp; Continue
              </Text>
            </TouchableOpacity>

            <Text style={styles.requiredNote}>
              You cannot use MedAI without accepting these terms.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    maxHeight: '92%',
    ...SHADOWS.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.full,
  },
  closeButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  introText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    lineHeight: 22,
  },

  // Scroll area
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  scrollBottomPadding: {
    height: SPACING.xl,
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  bullet: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },

  // Sticky footer
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxTick: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
  },

  // Accept button
  acceptButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  acceptButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  acceptButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  acceptButtonTextDisabled: {
    color: COLORS.textSecondary,
  },

  // Required note
  requiredNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default TermsConsentModal;
