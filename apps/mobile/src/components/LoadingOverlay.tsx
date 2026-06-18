import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export default function LoadingOverlay(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoCircle}>
          <Text style={styles.crossSymbol}>+</Text>
        </View>
        <Text style={styles.brandName}>MedAI</Text>

        {/* Spinner */}
        <ActivityIndicator
          color="#FFFFFF"
          size="large"
          style={styles.spinner}
        />

        {/* Loading label */}
        <Text style={styles.loadingText}>Loading...</Text>
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
    backgroundColor: '#1A3A6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossSymbol: {
    color: '#1A3A6B',
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  spinner: {
    marginTop: 24,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
  },
});
