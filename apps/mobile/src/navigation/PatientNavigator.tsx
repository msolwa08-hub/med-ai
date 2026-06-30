import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../constants/theme';

// ─── Screens ──────────────────────────────────────────────────
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import DoctorSearchScreen from '../screens/patient/DoctorSearchScreen';
import DoctorProfileScreen from '../screens/patient/DoctorProfileScreen';
import MyRecordsScreen from '../screens/patient/MyRecordsScreen';
import LabResultsScreen from '../screens/patient/LabResultsScreen';
import ConsultationStatusScreen from '../screens/patient/ConsultationStatusScreen';
import AIHistoryScreen from '../screens/patient/AIHistoryScreen';
import LanguageSelectScreen from '../screens/patient/LanguageSelectScreen';
import EmergencyProfileScreen from '../screens/patient/emergency/EmergencyProfileScreen';
import EditPatientProfileScreen from '../screens/patient/EditPatientProfileScreen';
import OGHistoryScreen from '../screens/patient/OGHistoryScreen';
import PaymentScreen from '../screens/patient/PaymentScreen';
import PatientProfileSetupScreen from '../screens/patient/PatientProfileSetupScreen';

// ─── Param Lists ───────────────────────────────────────────────

export type PatientTabParamList = {
  Home: undefined;
  FindDoctor: undefined;
  MyRecords: undefined;
  Emergency: undefined;
};

export type PatientStackParamList = {
  PatientTabs: undefined;
  DoctorProfile: { doctorId: string };
  ConsultationStatus: { consultationId: string };
  AIHistory: { consultationId: string; language?: string };
  OGHistory: {
    consultationId: string;
    language?: string;
    isPregnant?: boolean;
    chiefComplaint?: string;
    gravida?: number;
    para?: number;
  };
  LanguageSelect: { consultationId: string };
  LabResults: undefined;
  EditPatientProfile: undefined;
  PatientProfileSetup: { language?: string };
  Payment: { consultationId: string; doctorName?: string };
};

const Tab = createBottomTabNavigator<PatientTabParamList>();
const Stack = createNativeStackNavigator<PatientStackParamList>();

// ─── Bottom Tabs ───────────────────────────────────────────────

type TabIconName = 'home' | 'map-marker-radius' | 'folder-medical' | 'ambulance';

const TAB_META: Record<keyof PatientTabParamList, { icon: TabIconName; label: string }> = {
  Home: { icon: 'home', label: 'Home' },
  FindDoctor: { icon: 'map-marker-radius', label: 'Find Doctor' },
  MyRecords: { icon: 'folder-medical', label: 'My Records' },
  Emergency: { icon: 'ambulance', label: 'Emergency' },
};

function PatientTabs() {
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
            <MaterialCommunityIcons name={meta.icon} color={color} size={size ?? 24} />
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={PatientHomeScreen} />
      <Tab.Screen name="FindDoctor" component={DoctorSearchScreen} />
      <Tab.Screen name="MyRecords" component={MyRecordsScreen} />
      <Tab.Screen
        name="Emergency"
        component={EmergencyProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ambulance" color={COLORS.error} size={size ?? 24} />
          ),
          tabBarActiveTintColor: COLORS.error,
          tabBarLabel: 'Emergency',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack (tabs + push screens) ──────────────────────────

export default function PatientNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="PatientTabs" component={PatientTabs} />
      <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
      <Stack.Screen name="ConsultationStatus" component={ConsultationStatusScreen} />
      <Stack.Screen name="AIHistory" component={AIHistoryScreen} />
      <Stack.Screen name="OGHistory" component={OGHistoryScreen} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="LabResults" component={LabResultsScreen} />
      <Stack.Screen name="EditPatientProfile" component={EditPatientProfileScreen} />
      <Stack.Screen name="PatientProfileSetup" component={PatientProfileSetupScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}
