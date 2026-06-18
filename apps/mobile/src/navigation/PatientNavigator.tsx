import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@constants/theme';

// ---------------------------------------------------------------------------
// Placeholder screens — replace with real imports once screen files exist
// ---------------------------------------------------------------------------

function PatientHomeScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Patient Home</Text>
    </View>
  );
}

function FindDoctorScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Find Doctor</Text>
    </View>
  );
}

function MyRecordsScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>My Records</Text>
    </View>
  );
}

function PatientProfileScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Profile</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab param list
// ---------------------------------------------------------------------------

export type PatientTabParamList = {
  Home: undefined;
  FindDoctor: undefined;
  MyRecords: undefined;
  Profile: undefined;
};

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator<PatientTabParamList>();

type TabIconName =
  | 'home'
  | 'map-marker'
  | 'folder-medical'
  | 'account';

interface TabMeta {
  icon: TabIconName;
  label: string;
}

const TAB_META: Record<keyof PatientTabParamList, TabMeta> = {
  Home: { icon: 'home', label: 'Home' },
  FindDoctor: { icon: 'map-marker', label: 'Find Doctor' },
  MyRecords: { icon: 'folder-medical', label: 'My Records' },
  Profile: { icon: 'account', label: 'Profile' },
};

export default function PatientNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const meta = TAB_META[route.name as keyof PatientTabParamList];
        return {
          headerShown: false,
          tabBarLabel: meta.label,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name={meta.icon}
              color={color}
              size={size ?? 24}
            />
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={PatientHomeScreen} />
      <Tab.Screen name="FindDoctor" component={FindDoctorScreen} />
      <Tab.Screen name="MyRecords" component={MyRecordsScreen} />
      <Tab.Screen name="Profile" component={PatientProfileScreen} />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Styles for placeholder screens
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
});
