import type { SALanguageCode } from './language.types.js';
import type { DoctorType } from './user.types.js';

export type HPCSAStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface DoctorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  hpcsaNumber: string;
  hpcsaStatus: HPCSAStatus;
  doctorType: DoctorType;
  specialization?: string;
  practiceNumber?: string;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
  availabilityRadius: number;
  consultationFee: number;
  languages: SALanguageCode[];
  rating: number;
  totalReviews: number;
  profilePhoto?: string;
  bio?: string;
  qualifications: Qualification[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
}

export interface NearbyDoctor extends DoctorProfile {
  distanceKm: number;
  estimatedArrivalMinutes?: number;
}

export interface DoctorAvailabilityUpdate {
  isAvailable: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface DoctorSearchParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  doctorType?: DoctorType;
  language?: SALanguageCode;
  maxFee?: number;
}
