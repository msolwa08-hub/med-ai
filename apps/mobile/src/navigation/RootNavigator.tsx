import React, { useEffect } from 'react';

import { useAuthStore } from '@store/authStore';
import AuthNavigator from '@navigation/AuthNavigator';
import PatientNavigator from '@navigation/PatientNavigator';
import DoctorNavigator from '@navigation/DoctorNavigator';
import LoadingOverlay from '@components/LoadingOverlay';

// HPCSAVerificationScreen is treated as a gate screen, not part of any stack
import HPCSAVerificationScreen from '@screens/auth/HPCSAVerificationScreen';

export default function RootNavigator() {
  const { isAuthenticated, isLoading, user, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  // Show a full-screen spinner while the stored session is being rehydrated
  if (isLoading) {
    return <LoadingOverlay />;
  }

  // Not logged in — show auth flow
  if (!isAuthenticated || !user) {
    return <AuthNavigator />;
  }

  // Doctor whose HPCSA registration has not yet been verified — block app access
  // until the council confirms their credentials
  if (user.role === 'doctor' && user.hpcsaStatus !== 'verified') {
    return <HPCSAVerificationScreen />;
  }

  if (user.role === 'patient') {
    return <PatientNavigator />;
  }

  if (user.role === 'doctor') {
    return <DoctorNavigator />;
  }

  // Fallback — should never be reached for a valid role
  return <AuthNavigator />;
}
