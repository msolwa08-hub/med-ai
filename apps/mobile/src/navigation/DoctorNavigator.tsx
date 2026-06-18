import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '@constants/theme';

// ---------------------------------------------------------------------------
// Placeholder screens — replace with real imports once screen files exist
// ---------------------------------------------------------------------------

function DoctorDashboardScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Dashboard</Text>
    </View>
  );
}

function DoctorPatientsScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Patients</Text>
    </View>
  );
}

function DoctorRecordsScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Records</Text>
    </View>
  );
}

function DoctorProfileScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Profile</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab param list
// ---------------------------------------------------------------------------

export type DoctorTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Records: undefined;
  Profile: undefined;
};

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator<DoctorTabParamList>();

type TabIconName =
  | 'view-dashboard'
  | 'account-group'
  | 'folder-medical'
  | 'account';

interface TabMeta {
  icon: TabIconName;
  label: string;
}

const TAB_META: Record<keyof DoctorTabParamList, TabMeta> = {
  Dashboard: { icon: 'view-dashboard', label: 'Dashboard' },
  Patients: { icon: 'account-group', label: 'Patients' },
  Records: { icon: 'folder-medical', label: 'Records' },
  Profile: { icon: 'account', label: 'Profile' },
};

export default function DoctorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const meta = TAB_META[route.name as keyof DoctorTabParamList];
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
      <Tab.Screen name="Dashboard" component={DoctorDashboardScreen} />
      <Tab.Screen name="Patients" component={DoctorPatientsScreen} />
      <Tab.Screen name="Records" component={DoctorRecordsScreen} />
      <Tab.Screen name="Profile" component={DoctorProfileScreen} />
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
