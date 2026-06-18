/**
 * Database seed for local development
 * Creates test patients, doctors (pre-verified), and sample consultations
 */
import { PrismaClient, UserRole, Gender, DoctorType, HpcsaStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding MedAI database...');

  // ──────────────────────────────────────────────────────
  // Admin user
  // ──────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medai.co.za' },
    update: {},
    create: {
      email: 'admin@medai.co.za',
      phone: '+27110000000',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });
  console.log(`Admin: ${admin.email}`);

  // ──────────────────────────────────────────────────────
  // Test patient (English)
  // ──────────────────────────────────────────────────────

  const patientHash = await bcrypt.hash('Patient@1234', 12);
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      email: 'patient@example.com',
      phone: '+27821234567',
      passwordHash: patientHash,
      role: UserRole.PATIENT,
      isVerified: true,
      patient: {
        create: {
          firstName: 'Sipho',
          lastName: 'Dlamini',
          dateOfBirth: new Date('1990-05-15'),
          gender: Gender.MALE,
          preferredLanguage: 'zu',
          consentVersion: '1.0',
        },
      },
    },
    include: { patient: true },
  });
  console.log(`Patient: ${patientUser.email} (${patientUser.patient?.firstName} ${patientUser.patient?.lastName})`);

  // ──────────────────────────────────────────────────────
  // Test GP doctor (verified)
  // ──────────────────────────────────────────────────────

  const doctorHash = await bcrypt.hash('Doctor@1234', 12);
  const gpUser = await prisma.user.upsert({
    where: { email: 'dr.van-wyk@example.com' },
    update: {},
    create: {
      email: 'dr.van-wyk@example.com',
      phone: '+27831234567',
      passwordHash: doctorHash,
      role: UserRole.DOCTOR,
      isVerified: true,
      doctor: {
        create: {
          firstName: 'Annelie',
          lastName: 'van Wyk',
          hpcsaNumber: 'MP0123456',
          hpcsaStatus: HpcsaStatus.VERIFIED,
          hpcsaVerifiedAt: new Date(),
          doctorType: DoctorType.GP,
          practiceNumber: 'PRC001234',
          isAvailable: true,
          currentLat: -26.2041,
          currentLng: 28.0473,
          availabilityRadius: 15,
          consultationFee: 800,
          bio: 'Experienced GP with 15 years in primary healthcare across Gauteng. Speaks English and Afrikaans. Passionate about preventive care and chronic disease management.',
          languages: ['en', 'af', 'zu'],
          rating: 4.8,
          totalReviews: 127,
          qualifications: [
            { degree: 'MBChB', institution: 'University of Pretoria', year: 2008 },
            { degree: 'Diploma in Family Medicine', institution: 'CMSA', year: 2012 },
          ],
        },
      },
    },
    include: { doctor: true },
  });
  console.log(`GP Doctor: ${gpUser.email} (Dr ${gpUser.doctor?.lastName})`);

  // ──────────────────────────────────────────────────────
  // Test Specialist (Cardiologist)
  // ──────────────────────────────────────────────────────

  const specialistUser = await prisma.user.upsert({
    where: { email: 'dr.nkosi@example.com' },
    update: {},
    create: {
      email: 'dr.nkosi@example.com',
      phone: '+27841234567',
      passwordHash: doctorHash,
      role: UserRole.DOCTOR,
      isVerified: true,
      doctor: {
        create: {
          firstName: 'Thabo',
          lastName: 'Nkosi',
          hpcsaNumber: 'MP0654321',
          hpcsaStatus: HpcsaStatus.VERIFIED,
          hpcsaVerifiedAt: new Date(),
          doctorType: DoctorType.SPECIALIST,
          specialization: 'Cardiologist',
          practiceNumber: 'PRC005678',
          isAvailable: false,
          currentLat: -26.1929,
          currentLng: 28.0305,
          availabilityRadius: 20,
          consultationFee: 1500,
          bio: 'Consultant cardiologist with subspecialty in interventional cardiology. 20 years experience at top Johannesburg hospitals. Fluent in English, isiZulu, and isiXhosa.',
          languages: ['en', 'zu', 'xh'],
          rating: 4.9,
          totalReviews: 89,
          qualifications: [
            { degree: 'MBChB', institution: 'University of KwaZulu-Natal', year: 2001 },
            { degree: 'FCP(SA)', institution: 'CMSA', year: 2007 },
            { degree: 'Cert Cardiology', institution: 'CMSA', year: 2009 },
          ],
        },
      },
    },
    include: { doctor: true },
  });
  console.log(`Specialist: ${specialistUser.email} (Dr ${specialistUser.doctor?.lastName})`);

  // ──────────────────────────────────────────────────────
  // Test Travelling Doctor
  // ──────────────────────────────────────────────────────

  const travellingUser = await prisma.user.upsert({
    where: { email: 'dr.sithole@example.com' },
    update: {},
    create: {
      email: 'dr.sithole@example.com',
      phone: '+27851234567',
      passwordHash: doctorHash,
      role: UserRole.DOCTOR,
      isVerified: true,
      doctor: {
        create: {
          firstName: 'Nomvula',
          lastName: 'Sithole',
          hpcsaNumber: 'MP0789012',
          hpcsaStatus: HpcsaStatus.VERIFIED,
          hpcsaVerifiedAt: new Date(),
          doctorType: DoctorType.TRAVELLING,
          practiceNumber: 'PRC009012',
          isAvailable: true,
          currentLat: -26.1870,
          currentLng: 28.0425,
          availabilityRadius: 30,
          consultationFee: 950,
          bio: 'Mobile GP serving Johannesburg and surrounding areas. Come to you within 1 hour. Fully equipped vehicle. Speaks Zulu, Sotho, and English.',
          languages: ['en', 'zu', 'st', 'nso'],
          rating: 4.7,
          totalReviews: 203,
          qualifications: [
            { degree: 'MBChB', institution: 'University of the Witwatersrand', year: 2010 },
            { degree: 'Diploma Emergency Medicine', institution: 'CMSA', year: 2014 },
          ],
        },
      },
    },
    include: { doctor: true },
  });
  console.log(`Travelling Doctor: ${travellingUser.email} (Dr ${travellingUser.doctor?.lastName})`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\nTest credentials:');
  console.log('  Patient:  patient@example.com / Patient@1234');
  console.log('  GP:       dr.van-wyk@example.com / Doctor@1234  (HPCSA: MP0123456)');
  console.log('  Spec:     dr.nkosi@example.com / Doctor@1234  (HPCSA: MP0654321)');
  console.log('  Travel:   dr.sithole@example.com / Doctor@1234  (HPCSA: MP0789012)');
  console.log('  Admin:    admin@medai.co.za / Admin@1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
