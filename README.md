# MedAI — AI-Powered Medical History Platform for South Africa

A comprehensive healthcare platform connecting patients with doctors across South Africa, featuring AI-powered medical history taking in all 11 official South African languages.

---

## Features

### For Patients
- **AI Medical History in Your Language** — Choose from all 11 SA official languages: English, isiZulu, isiXhosa, Afrikaans, Sepedi, Setswana, Sesotho, Xitsonga, Siswati, Tshivenda, isiNdebele
- **Find a Doctor** — Browse nearby available doctors on a map (GP, Specialist, Allied Health, Travelling Doctor)
- **Secure Records** — All medical records encrypted with AES-256-GCM. Only you control who sees them
- **Consent Management** — Grant or revoke doctor access to your records at any time
- **Consultation History** — View all past consultations and outcomes

### For Doctors
- **HPCSA Verified** — Only Healthcare Professionals Council of South Africa (HPCSA) verified practitioners can access patient data
- **Uber-like Availability** — Go online/offline, set your radius, accept consultations
- **AI History Review** — Review AI-taken structured history and confirm or correct it
- **Differential Diagnosis** — AI-generated ranked differential diagnoses with ICD-10 codes
- **Full Clinical Workflow** — Examination findings, investigations, management plans, prescriptions
- **Doctor Types** — GP · Specialist · Allied Health · Travelling Doctor

### Security & Compliance
- AES-256-GCM field-level encryption for all patient data
- Per-consultation encryption keys (envelope encryption)
- Patient consent required before any doctor access
- Full audit trail of every data access
- HPCSA registration verification
- POPIA (Protection of Personal Information Act) compliant

---

## Architecture

```
med-ai/
├── apps/
│   ├── api/           # Fastify + Node.js + TypeScript backend
│   └── mobile/        # React Native + Expo mobile app
├── packages/
│   └── shared/        # Shared TypeScript types and constants
├── prisma/            # Database schema (PostgreSQL)
├── scripts/           # Database init scripts
├── infrastructure/    # Cloud infrastructure (Terraform)
└── docker-compose.yml # Local development
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) |
| Backend | Fastify + TypeScript |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Encryption | AES-256-GCM (Node.js crypto) |
| Auth | JWT + bcrypt |
| SMS/OTP | Twilio |
| Storage | AWS S3 (af-south-1) |
| Maps | Google Maps |

---

## South African Languages Supported

| Code | Language | Native Name | Primary Region |
|------|----------|-------------|----------------|
| en | English | English | Nationwide |
| zu | Zulu | isiZulu | KwaZulu-Natal |
| xh | Xhosa | isiXhosa | Eastern Cape, Western Cape |
| af | Afrikaans | Afrikaans | Western Cape, Northern Cape |
| nso | Sepedi | Sepedi | Limpopo |
| tn | Setswana | Setswana | North West, Northern Cape |
| st | Sesotho | Sesotho | Free State |
| ts | Xitsonga | Xitsonga | Limpopo, Mpumalanga |
| ss | Siswati | Siswati | Mpumalanga |
| ve | Tshivenda | Tshivenda | Limpopo |
| nr | isiNdebele | isiNdebele | Mpumalanga, Limpopo |

---

## Getting Started

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- Anthropic API key
- PostgreSQL 16 (or use Docker)

### Setup

```bash
# Clone the repo
git clone https://github.com/msolwa08-hub/med-ai
cd med-ai

# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your API keys

# Start local services (PostgreSQL + Redis)
docker-compose up postgres redis -d

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed initial data
npm run db:seed

# Start API server
npm run dev:api

# Start mobile app (in another terminal)
npm run dev:mobile
```

### Environment Variables

See `.env.example` for all required variables. Key ones:
- `ANTHROPIC_API_KEY` — Claude AI for history taking and diagnosis
- `DATABASE_URL` — PostgreSQL connection
- `ENCRYPTION_KEY` — 32-byte hex key for AES-256-GCM (generate with `openssl rand -hex 32`)
- `JWT_SECRET` — JWT signing secret
- `HPCSA_API_KEY` — HPCSA verification API

---

## AI Medical History Flow

```
Patient selects language
        ↓
AI greets patient (in chosen language)
        ↓
AI systematically collects:
  • Chief complaint
  • History of present illness (onset, duration, severity...)
  • Past medical history
  • Current medications
  • Allergies
  • Family history
  • Social history (smoking, alcohol, occupation...)
  • Review of systems
        ↓
AI extracts structured data
        ↓
AI generates differential diagnoses (SA-context aware):
  • Ranked by probability
  • With ICD-10 codes
  • With clinical reasoning
  • Noting SA-prevalent conditions (TB, HIV, etc.)
        ↓
Doctor reviews and confirms history
        ↓
Doctor adds examination findings
        ↓
Doctor selects working diagnosis
        ↓
Management plan created
        ↓
All data encrypted and stored
```

---

## Doctor Availability (Uber Model)

Doctors can:
1. Toggle "Go Online" with their current GPS location
2. Set acceptance radius (e.g., 10km)
3. Set doctor type (GP/Specialist/Allied/Travelling)
4. Accept patient consultations from the queue
5. Patients see: distance, rating, fee, ETA, specialization, languages

---

## HPCSA Verification

All healthcare professionals must:
1. Register with their HPCSA registration number
2. Submit to verification (checked against HPCSA database)
3. Only VERIFIED practitioners can:
   - View patient medical histories
   - Confirm diagnoses
   - Create management plans
   - See patient records

Status: `PENDING` → `VERIFIED` | `REJECTED` | `SUSPENDED`

---

## Data Security

```
Patient Data Encryption:
  - Master key (env var) → encrypts Data Keys
  - Data Key (per consultation) → encrypts all medical fields
  - Fields encrypted: ID numbers, history, diagnoses, prescriptions, lab results

Access Control:
  - Patient must grant explicit consent to each doctor
  - ConsentRecord with expiry date
  - Revocable at any time
  - Audit log of every access

Storage:
  - PostgreSQL on AWS af-south-1 (Cape Town)
  - S3 for encrypted documents (lab results, radiology)
  - Redis for session/cache only (no sensitive data)
```

---

## Contributing

This application serves South African healthcare. Contributions welcome, particularly:
- Additional language improvements for AI history taking
- ICD-10 coding accuracy
- SA-specific disease prevalence data
- POPIA compliance enhancements

---

## Regulatory Notes

- Built for compliance with HPCSA regulations
- POPIA (Protection of Personal Information Act) compliant data handling
- NHI (National Health Insurance) compatible architecture
- Medical records retention per Health Professions Act requirements
