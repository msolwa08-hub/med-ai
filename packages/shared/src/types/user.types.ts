import type { SALanguageCode } from './language.types.js';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  preferredLanguage: SALanguageCode;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterPatientRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  idNumber?: string;
  preferredLanguage: SALanguageCode;
}

export interface RegisterDoctorRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  hpcsaNumber: string;
  doctorType: DoctorType;
  specialization?: string;
  consultationFee: number;
  languages: SALanguageCode[];
  bio?: string;
}

export type DoctorType = 'GP' | 'SPECIALIST' | 'ALLIED_HEALTH' | 'TRAVELLING';
