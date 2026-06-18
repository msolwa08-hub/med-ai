import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../constants/theme';

// ─── Screens ──────────────────────────────────────────────────
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import PatientQueueScreen from '../screens/doctor/PatientQueueScreen';
import DoctorAvailabilityScreen from '../screens/doctor/DoctorAvailabilityScreen';
import DoctorPatientRecordsScreen from '../screens/doctor/DoctorPatientRecordsScreen';
import AIHistoryReviewScreen from '../screens/doctor/AIHistoryReviewScreen';
import ExaminationScreen from '../screens/doctor/ExaminationScreen';
import DiagnosisScreen from '../screens/doctor/DiagnosisScreen';
import InvestigationsScreen from '../screens/doctor/InvestigationsScreen';
import ManagementPlanScreen from '../screens/doctor/ManagementPlanScreen';
import PrescriptionScreen from '../screens/doctor/PrescriptionScreen';
import STGLookupScreen from '../screens/doctor/stg/STGLookupScreen';
import PracticeSettingsScreen from '../screens/settings/PracticeSettingsScreen';

// ─── Param Lists ───────────────────────────────────────────────

export type DoctorTabParamList = {
  Dashboard: undefined;
  Queue: undefined;
  Records: undefined;
  Settings: undefined;
};

export type DoctorStackParamList = {
  DoctorTabs: undefined;
  AIHistoryReview: { consultationId: string };
  Examination: { consultationId: string };
  Diagnosis: { consultationId: string };
  Investigations: { consultationId: string };
  ManagementPlan: { consultationId: string };
  Prescription: {
    consultationId: string;
    patientName?: string;
    patientId?: string;
  };
  STGLookup: { consultationId?: string; applyIcd10?: string };
  DoctorAvailability: undefined;
};

const Tab = createBottomTabNavigator<DoctorTabParamList>();
const Stack = createNativeStackNavigator<DoctorStackParamList>();

// ─── Bottom Tabs ───────────────────────────────────────────────

type TabIconName = 'view-dashboard' | 'account-group' | 'folder-open' | 'cog';

const TAB_META: Record<keyof DoctorTabParamList, { icon: TabIconName; label: string }> = {
  Dashboard: { icon: 'view-dashboard', label: 'Dashboard' },
  Queue: { icon: 'account-group', label: 'Queue' },
  Records: { icon: 'folder-open', label: 'Records' },
  Settings: { icon: 'cog', label: 'Settings' },
};

function DoctorTabs() {
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
            <MaterialCommunityIcons name={meta.icon} color={color} size={size ?? 24} />
          ),
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={DoctorHomeScreen} />
      <Tab.Screen name="Queue" component={PatientQueueScreen} />
      <Tab.Screen name="Records" component={DoctorPatientRecordsScreen} />
      <Tab.Screen name="Settings" component={PracticeSettingsScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack (tabs + consultation flow) ──────────────────────

export default function DoctorNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
      <Stack.Screen name="AIHistoryReview" component={AIHistoryReviewScreen} />
      <Stack.Screen name="Examination" component={ExaminationScreen} />
      <Stack.Screen name="Diagnosis" component={DiagnosisScreen} />
      <Stack.Screen name="Investigations" component={InvestigationsScreen} />
      <Stack.Screen name="ManagementPlan" component={ManagementPlanScreen} />
      <Stack.Screen name="Prescription" component={PrescriptionScreen} />
      <Stack.Screen name="STGLookup" component={STGLookupScreen} />
      <Stack.Screen name="DoctorAvailability" component={DoctorAvailabilityScreen} />
    </Stack.Navigator>
  );
}
