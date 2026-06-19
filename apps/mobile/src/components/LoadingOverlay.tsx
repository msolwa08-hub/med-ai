import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

export default function LoadingOverlay(): React.JSX.Element {
  return (
    <View style={styles.container}>
      {/* Logo mark */}
      <View style={styles.logoSquare}>
        {/* White medical cross built from two overlapping rectangles */}
        <View style={styles.crossVertical} />
        <View style={styles.crossHorizontal} />
      </View>

      {/* Brand name */}
      <Text style={styles.brandName}>MedAI</Text>

      {/* Tagline */}
      <Text style={styles.tagline}>Healthcare in your language</Text>

      {/* Spinner anchored in the bottom quarter */}
      <View style={styles.spinnerContainer}>
        <ActivityIndicator color={COLORS.primary} size="small" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.systemBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSquare: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossVertical: {
    position: 'absolute',
    width: 10,
    height: 38,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 38,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  brandName: {
    ...TYPOGRAPHY.title2,
    color: COLORS.primary,
    marginTop: SPACING.lg,
  },
  tagline: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    marginTop: SPACING.xs,
  },
  spinnerContainer: {
    position: 'absolute',
    bottom: '22%',
  },
});
