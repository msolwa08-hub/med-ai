import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SA_LANGUAGES, SALanguage } from '@constants/languages';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onSelect: (code: string) => void;
  multiSelect?: boolean;
  showTitle?: boolean;
}

export default function LanguageSelector({
  selectedLanguages,
  onSelect,
  multiSelect = false,
  showTitle = true,
}: LanguageSelectorProps): React.JSX.Element {
  const handlePress = (code: string): void => {
    if (multiSelect) {
      // Toggle: remove if already selected, add if not
      onSelect(code);
    } else {
      // Single-select: always call with the tapped code
      onSelect(code);
    }
  };

  const renderItem = ({ item }: { item: SALanguage }): React.JSX.Element => {
    const isSelected = selectedLanguages.includes(item.code);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected ? styles.cardSelected : styles.cardUnselected,
        ]}
        onPress={() => handlePress(item.code)}
        activeOpacity={0.75}
      >
        {/* Checkmark badge — only in multi-select mode when selected */}
        {isSelected && multiSelect && (
          <Text style={styles.checkmark}>✓</Text>
        )}

        {/* Flag */}
        <Text style={styles.flag}>{item.flag}</Text>

        {/* English name */}
        <Text
          style={[
            styles.languageName,
            isSelected ? styles.languageNameSelected : styles.languageNameUnselected,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* Native name */}
        <Text
          style={[
            styles.nativeName,
            isSelected ? styles.nativeNameSelected : styles.nativeNameUnselected,
          ]}
          numberOfLines={1}
        >
          {item.nativeName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={styles.title}>Select Language</Text>
      )}
      <FlatList<SALanguage>
        data={SA_LANGUAGES}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  row: {
    justifyContent: 'flex-start',
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    // Ensure the checkmark can be positioned absolutely inside
    position: 'relative',
  },
  cardUnselected: {
    backgroundColor: '#EEF2F7',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  cardSelected: {
    backgroundColor: '#1A3A6B',
    borderWidth: 1.5,
    borderColor: '#1A3A6B',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flag: {
    fontSize: 24,
    textAlign: 'center',
  },
  languageName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  languageNameUnselected: {
    color: '#1A1A2E',
  },
  languageNameSelected: {
    color: '#FFFFFF',
  },
  nativeName: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  nativeNameUnselected: {
    color: '#6C757D',
  },
  nativeNameSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
