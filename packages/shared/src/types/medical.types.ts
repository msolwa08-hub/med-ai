export interface ICD10Code {
  code: string;
  description: string;
  chapter?: string;
}

export type InvestigationType = 'LAB' | 'RADIOLOGY' | 'ECG' | 'OTHER';

export interface Investigation {
  id: string;
  consultationId: string;
  type: InvestigationType;
  name: string;
  resultDate?: Date;
  uploadedFileKey?: string;
  requestedBy: string;
}

export interface Review {
  id: string;
  patientId: string;
  doctorId: string;
  consultationId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface SAProvince {
  code: string;
  name: string;
  capital: string;
}

export const SA_PROVINCES: SAProvince[] = [
  { code: 'EC', name: 'Eastern Cape', capital: 'Bhisho' },
  { code: 'FS', name: 'Free State', capital: 'Bloemfontein' },
  { code: 'GP', name: 'Gauteng', capital: 'Johannesburg' },
  { code: 'KZN', name: 'KwaZulu-Natal', capital: 'Pietermaritzburg' },
  { code: 'LP', name: 'Limpopo', capital: 'Polokwane' },
  { code: 'MP', name: 'Mpumalanga', capital: 'Mbombela' },
  { code: 'NC', name: 'Northern Cape', capital: 'Kimberley' },
  { code: 'NW', name: 'North West', capital: 'Mahikeng' },
  { code: 'WC', name: 'Western Cape', capital: 'Cape Town' },
];

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}
