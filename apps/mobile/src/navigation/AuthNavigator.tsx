import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WelcomeScreen from '@screens/auth/WelcomeScreen';
import LoginScreen from '@screens/auth/LoginScreen';
import RegisterPatientScreen from '@screens/auth/RegisterPatientScreen';
import RegisterDoctorScreen from '@screens/auth/RegisterDoctorScreen';
import OTPVerificationScreen from '@screens/auth/OTPVerificationScreen';
import ForgotPasswordScreen from '@screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '@screens/auth/ResetPasswordScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegisterPatient: undefined;
  RegisterDoctor: undefined;
  OTPVerification: {
    phone: string;
    purpose: 'login' | 'register';
  };
  ForgotPassword: undefined;
  ResetPassword: { phone: string };
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterPatient" component={RegisterPatientScreen} />
      <Stack.Screen name="RegisterDoctor" component={RegisterDoctorScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
