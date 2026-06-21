# POPIA Compliance — MedAI

This document records the **technical** data-protection controls implemented in
the codebase and the **legal / organisational** steps that must be completed
outside the code for full POPIA (Protection of Personal Information Act, 2013)
compliance.

> Patient medical data is **special personal information** under POPIA
> (s26–27). Every call to the AI model is a **cross-border transfer** (s72),
> because the model is processed outside South Africa.

---

## 1. Technical controls implemented in code ✅

| Control | POPIA principle | Where |
|---|---|---|
| **Encryption at rest** — AES-256-GCM, per-consultation data keys, master-key wrapped | s19 Security safeguards | `src/lib/encryption.ts` |
| **De-identification at the AI boundary** — direct identifiers never sent to the model | s10 Minimality, s19, s72 | `src/lib/deidentify.ts` |
| → Reversible **token substitution** for documents (name / ID / medical-aid / DOB) — real values re-attached locally, never sent | | sick-note & referral services |
| → Irreversible **redaction** of free text (SA ID, phone, email, long member numbers) before sending; clinical values preserved | | adaptive history service |
| → **Patient-name scrubbing** — the patient's own name is removed if free-typed mid-conversation | | `redactFreeText(text, knownNames)` |
| **Stored transcript keeps full fidelity** — only the copy sent to the model is scrubbed | s14 Records | history service / route |
| **Consent gate for AI processing** — verifies a granted, non-expired `DATA_PROCESSING` consent before any model call | s11 Lawful basis, s72 | `src/lib/ai-consent.ts` |
| **Audit trail** — every AI processing event and every missing/denied consent is logged (no PII in metadata) | s17 Documentation / accountability | `src/services/audit.service.ts` |
| **Data residency for object storage** — S3 default region `af-south-1` | s72 | `src/config.ts` |

### Consent enforcement flag

The AI-processing consent gate is controlled by `ENFORCE_AI_PROCESSING_CONSENT`
(default `false`):

- **`false`** — processing without a `DATA_PROCESSING` consent record is
  **allowed but audited** (action `AI_PROCESSING_CONSENT_MISSING`). Use during
  rollout before onboarding captures the consent.
- **`true`** — processing is **blocked** (HTTP 403, code
  `AI_PROCESSING_CONSENT_REQUIRED`) unless consent exists. Enable this in
  production once the patient onboarding flow records `DATA_PROCESSING` consent.

The consent-capture endpoint already exists (`POST /patients/.../consent`,
accepts `DATA_PROCESSING`).

---

## 2. Provider configuration — required before production ⬜

These are configured with the AI provider (Anthropic), not in code:

- [ ] **Sign the Data Processing Addendum (DPA)** — establishes Anthropic as a
      POPIA *operator* (s20–21).
- [ ] **Enable Zero Data Retention (ZDR)** on the API account — so patient data
      is not retained by the provider after the request.
- [ ] **Confirm no-training** on API data (default for the commercial API) in writing.
- [ ] Record the cross-border safeguard relied on under **s72** (binding
      agreement providing adequate protection, or data-subject consent).

---

## 3. Legal / organisational steps — outside the code ⬜

- [ ] **Informed patient consent** for (a) processing special personal
      information and (b) cross-border AI processing — captured at onboarding,
      versioned (`Patient.consentVersion`), and recorded as a `DATA_PROCESSING`
      consent record.
- [ ] Register an **Information Officer** with the Information Regulator.
- [ ] Complete a **Personal Information Impact Assessment (PIIA)**.
- [ ] Publish a **privacy notice** (s18) describing AI processing and transfers.
- [ ] Define **retention & deletion** schedules for medical records.
- [ ] **Attorney sign-off** by a South African privacy practitioner.

---

## 4. Known limitations

- Free-text **redaction covers structured identifiers** (SA ID, phone, email,
  long numbers) and the **patient's own name**. It does **not** detect arbitrary
  third-party names (e.g. a relative mentioned in passing) — that would require
  a named-entity-recognition pass, a candidate future enhancement.
- This document is an engineering record, **not legal advice**.

_Last updated: see git history for `POPIA-COMPLIANCE.md`._
