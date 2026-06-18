import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { NearbyDoctor } from './DoctorCard';

interface ConsentModalProps {
  visible: boolean;
  doctor: NearbyDoctor | null;
  onConsent: (remember: boolean) => void;
  onDecline: () => void;
}

const CONSENT_TERMS = `By granting consent, you agree to the following:

1. Medical Records Access
Dr. [name] will be able to view your AI-generated medical history, including your chief complaint, past medical history, medications, allergies, family history, social history, and review of systems — solely for the purpose of this consultation.

2. Data Protection
Your data is protected under the Protection of Personal Information Act (POPIA). All records are encrypted end-to-end and stored on South African servers.

3. Purpose Limitation
Your medical history will only be used to provide you with healthcare services during this consultation. It will not be shared with third parties without your explicit consent.

4. Withdrawal of Consent
You may revoke this consent at any time from the Consent Management screen. Revoking consent will immediately remove the doctor's access to your records.

5. Duration
Unless you select "Remember for 30 days", this consent is valid for this consultation only.`;

export const ConsentModal: React.FC<ConsentModalProps> = ({
  visible,
  doctor,
  onConsent,
  onDecline,
}) => {
  const [rememberDoctor, setRememberDoctor] = useState(false);

  if (!doctor) return null;

  const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Doctor header */}
          <View style={styles.doctorRow}>
            <View style={styles.avatarContainer}>
              {doctor.profileImage ? (
                <Image source={{ uri: doctor.profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {doctor.firstName[0]}
                    {doctor.lastName[0]}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{fullName}</Text>
              <Text style={styles.doctorType}>
                {doctor.specialization ?? doctor.doctorType.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={styles.consentQuestion}>
            <Text style={styles.bold}>{fullName}</Text> wants to access your medical history for
            this consultation. Do you consent?
          </Text>

          {/* Terms scroll area */}
          <ScrollView
            style={styles.termsScroll}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <Text style={styles.termsText}>
              {CONSENT_TERMS.replace('[name]', fullName)}
            </Text>
          </ScrollView>

          {/* Remember checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setRememberDoctor(!rememberDoctor)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberDoctor && styles.checkboxChecked]}>
              {rememberDoctor && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Remember for this doctor (30 days)</Text>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={onDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.consentButton}
              onPress={() => onConsent(rememberDoctor)}
              activeOpacity={0.85}
            >
              <Text style={styles.consentButtonText}>I Consent</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy note */}
          <Text style={styles.privacyNote}>
            🔒 Your data is encrypted. Only doctors you approve can see your history.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  doctorType: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  consentQuestion: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  bold: {
    fontWeight: '700',
  },
  termsScroll: {
    maxHeight: 200,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  termsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
  },
  checkboxChecked: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkboxTick: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    flex: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  declineButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  consentButton: {
    flex: 2,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  consentButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  privacyNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default ConsentModal;
