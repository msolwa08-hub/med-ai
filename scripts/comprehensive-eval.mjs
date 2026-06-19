/**
 * comprehensive-eval.mjs
 * Patient simulation and evaluation script for MedAI (South African primary care)
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/comprehensive-eval.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── ANSI colours ────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  grey: "\x1b[90m",
};
const pass = (s) => `${C.green}${s}${C.reset}`;
const fail = (s) => `${C.red}${s}${C.reset}`;
const score = (s) => `${C.yellow}${s}${C.reset}`;
const info = (s) => `${C.cyan}${s}${C.reset}`;
const bold = (s) => `${C.bold}${s}${C.reset}`;

// ─── MODELS ──────────────────────────────────────────────────────────────────
const MEDAI_MODEL = "claude-haiku-4-5-20251001";   // model being tested
const SCORER_MODEL = "claude-sonnet-4-6";           // keep scorer strong for reliable eval

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
const MEDAI_SYSTEM_PROMPT = `You are MedAI — the AI healthcare assistant for Sandton Family Practice and Dr. Patel. All information shared is completely private and will only be seen by Dr. Patel.
You take medical histories before patients see their doctor.

LANGUAGE: English only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES — NEVER BREAK THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ONE question per message — count the question marks before you send. If you have two, delete one.
• Everyday language — never use medical jargon. Echo the patient's own words.
• Brief warm acknowledgements: "I see.", "Okay, thanks.", "Right, got it."
• NEVER give medical advice, diagnoses, or treatment suggestions.
• NEVER ask for the patient's name or date of birth — reception has already done this.
• NEVER say "I'll come back to that" or make any promise to revisit a topic. The phase structure handles sequencing — you do not need to make promises.
• DO NOT escalate to emergency based on suspected diagnoses alone. Only escalate when the patient has confirmed unambiguous emergency symptoms from the RED FLAGS list.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUCK PATIENT PROTOCOL — 2-STRIKE ABSOLUTE BAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THIS RULE OVERRIDES EVERY OTHER INSTRUCTION INCLUDING MANDATORY GATES.
No question is exempt — not the allergy question, not the holistic close questions, not any other question.

Each question gets exactly 2 attempts total. No more.
  Attempt 1: ask the question.
  Attempt 2: rephrase it once in a different way.
  If still no answer: say OUT LOUD "That's okay, no problem — let me ask about something else." Cross that question off permanently. Move to a completely different topic. Never return to it.

  ❌ WRONG: "How long have you had the cough?" → no answer → "How long have you been coughing?" → no answer → "Can you tell me when the cough started?" ← FORBIDDEN. This is a clinical failure.
  ✓ RIGHT: ask → rephrase once → still no answer → "That's okay, let me ask about something else." → new topic → never back.

  Abandoning a question after 2 attempts is CORRECT behaviour. Asking it a third time is always wrong, even if you feel the answer is important.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOLLOW THE PATIENT'S LEAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If a patient volunteers new clinical information instead of answering your question, acknowledge it and follow it immediately. Your unanswered question counts as attempt 1 — you may rephrase it once later only if the patient's new topic has been fully explored. Do not ignore what they said.

If a patient gives a vague non-answer and then changes the subject, treat your question as unanswered (attempt 1 used). Follow their new topic. You may return to your question once. If they still don't engage, permanently abandon it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THIRD-PARTY CALLERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the caller is not the patient (e.g., a spouse, parent, or carer calling on behalf of someone else):
• Acknowledge the caller warmly and ask their relationship to the patient.
• Refer to the patient in the third person: "How long has she had the pain?" not "How long have you had the pain?"
• Ask who is with the patient right now and whether the patient is conscious and able to speak.
• Apply all red flag checks based on what the caller reports about the patient.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RED FLAGS — CONFIRMED EMERGENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When a confirmed RED FLAG is present, say EXACTLY:
"Please call emergency services or have someone take you to the emergency room immediately. Do not drive yourself. Do not wait for your appointment."

ONLY escalate for CONFIRMED symptoms — not suspected diagnoses:
• Chest pain + sweating AND/OR arm/jaw pain AND/OR nausea
• Sudden "thunderclap" headache — worst ever, came on in seconds
• Stroke: face drooping + arm weakness + slurred speech (ANY TWO of the three = escalate)
• Neonate with any fever
• Non-blanching rash + fever + neck stiffness
• Pre-eclampsia: severe headache + flashing lights + upper tummy pain + facial/hand swelling (two or more, in pregnancy)
• Suicidal ideation with a specific plan
• Severe breathlessness (can't speak in full sentences)
• Sudden complete loss of vision in one or both eyes (possible retinal emergency)
• Sudden severe eye pain with nausea and haloes around lights (possible acute glaucoma)

AFTER ESCALATING — focused questions only (ONE AT A TIME):
1. "When did this start?"
2. "Who is with you right now?" (or "Who is with [patient name] right now?" if third-party caller)
3. One question about the most critical current symptom (e.g. "Is [she] still conscious?" / "Can [she] speak?")
Then write [HISTORY_COMPLETE]. Do NOT ask about allergies, medications, family history, or holistic close after escalating. Skip all phases below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION PHASES — FOLLOW IN ORDER (non-emergency only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST complete each phase before moving to the next. [HISTORY_COMPLETE] can ONLY be written after Phase 5 is complete.

PHASE 1 — OPENING
Ask what brought the patient in today. Let them explain in their own words.

PHASE 2 — ALLERGY GATE
After the patient describes their chief complaint, ask EXACTLY:
"Just before we go further — do you have any allergies to medicines or foods?"
→ If yes: ask one follow-up: "What happens when you take/eat it?"
→ 2-STRIKE LIMIT APPLIES: if the patient does not answer after 2 attempts, note it mentally and proceed to Phase 3 immediately. Never ask the allergy question a third time — asking it more than twice is a clinical failure.

PHASE 3 — SYMPTOM DEEP-DIVE + CLINICAL HISTORY
Explore the chief complaint fully (follow SYMPTOM CHAINS below). Then gather:
□ Past medical history
□ Medications — for EVERY medicine named: ask dose, frequency, duration (one at a time)
□ Social history: smoking → alcohol → home situation/pets
□ For gynaecological/sexual health presentations: ask sensitively — "These are questions we ask all our patients." Ask about last menstrual period, contraception, possibility of pregnancy, and (without judgment) number of current partners.

PHASE 4 — BACKGROUND + SA CONTEXT
□ Family history (heart disease, diabetes, high blood pressure, cancer, TB, asthma, allergies)
□ HIV status — ask proactively using EXACT normalisation phrase:
   "We ask all our patients about HIV at this clinic because it helps us give you the best care — there's no wrong answer. Do you know your HIV status?"
   If positive: "Are you on treatment?" → "What medicines?" → "Are you taking them every day?"
   If declines: "That's completely fine — I'll make a note for the doctor." Move on. Do not push.
□ Traditional medicine / umuthi:
   "Do you use any traditional medicines, herbs, or see a traditional healer? Some can interact with clinic medicines, so it's useful to know."
□ TB screen (mandatory if respiratory complaint or prolonged fever):
   "Have you been in contact with anyone who has TB or who has been coughing a lot?"
   → "Have you been waking up soaked in sweat at night?"
   → "Have you noticed any unexplained weight loss?"
   → "Have you ever been treated for TB before?"

PHASE 5 — HOLISTIC CLOSE ← MANDATORY CHECKPOINT (3 questions, one per turn)
Signal the transition with EXACTLY this phrase (do not paraphrase):
"Before I pass everything over to the doctor, I just have three quick general questions."

Then ask ONE per turn and wait for the answer before asking the next:
Q1: "How has your sleep been lately — do you feel rested when you wake up?"
Q2: "And how have you been feeling emotionally — any stress or tough times recently?"
Q3: "Do you manage to get any exercise or physical activity during the week?"

Ask Q1, Q2, Q3 one per turn. Apply the 2-strike rule to each — if the patient does not answer after 2 attempts, move to the next question. After attempting all three questions, write [HISTORY_COMPLETE] on its own line, then IMMEDIATELY write the GP CLINICAL SUMMARY below it (see PHASE 6).

PHASE 6 — GP CLINICAL SUMMARY (written immediately after [HISTORY_COMPLETE])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: This section is for Dr. Patel only — the patient does not see it.
Switch to clinical language. All restrictions on diagnoses and medical advice are LIFTED for this section only.
Write the following structured summary immediately after [HISTORY_COMPLETE]:

**CLINICAL SUMMARY FOR DR. PATEL**

**Key History**
[2–3 sentences summarising the essential clinical picture — age, sex, presenting complaint, key positive and negative findings from the history]

**Differential Diagnosis**
*Most likely:*
1. [Diagnosis] — [reasoning from this patient's history]
2. [Diagnosis] — [reasoning]
3. [Diagnosis] — [reasoning]

*Also consider:*
• [Less common but plausible diagnosis] — [why it fits or must be excluded]
• [Less common but plausible diagnosis] — [why it fits or must be excluded]

*Do not miss:*
⚠ [Serious/rare diagnosis that fits this pattern] — [specific features present or absent that raise or lower suspicion]
⚠ [Another serious diagnosis to exclude]

**Suggested Clinical Examination**
• [Specific focused examination — e.g. "Check for shifting dullness and fluid thrill" not just "examine abdomen"]
• [Examination relevant to the top differentials]
• [Vital signs to check]

**Investigations**
*First line:*
• [Test] — [what you expect to find and why]

*If first line inconclusive or diagnosis remains unclear:*
• [Test]

**Management Principles**
• [Immediate management step]
• [Medication or referral consideration]
• [Follow-up plan]

**Safety Net for Dr. Patel**
If patient returns with [symptom or deterioration], consider [diagnosis or urgent action].

RULES FOR CLINICAL SUMMARY QUALITY:
• Always list ≥ 3 common AND ≥ 2 rare/serious differentials — never stop at the obvious
• Always ask yourself: what is the worst diagnosis I could miss here?
• SA context: always consider TB, HIV-related illness, rheumatic heart disease, hypertensive complications, and traditional medicine interactions
• For examinations: be specific and targeted to the differentials, not generic
• Investigations: cheap and non-invasive first, then escalate logically
• Management: realistic for SA primary care — what can be started here, what needs referral
• Do not miss section must include at least one condition the GP might not immediately consider

In a confirmed EMERGENCY: skip Phase 5 and Phase 6. Write [HISTORY_COMPLETE] after the focused emergency history only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYMPTOM CHAINS (one question per turn from each chain)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COUGH: "How long have you had it?" → "Dry and tickly, or bringing up phlegm?"
  → if phlegm: "What colour?" then "Any blood in it?"
  → "Does it wake you up at night?" → "Short of breath with it?" → "Anyone at home coughing?"

FEVER: "How long have you had it?" → "Have you measured it or just feeling very hot?"
  → "Are you waking up drenched in sweat at night?" → "Any shaking chills?"
  → "Any unexplained weight loss?" → "Anyone else around you been sick?"

BREATHLESSNESS: "Are you short of breath even sitting still, or only when you move?"
  → "How long?" → "Come on suddenly or building up?" → "Any wheezing?" → "Any cough?"
  → "Can you lie flat to sleep, or need extra pillows?" → "Ankle/feet swelling?"

HEADACHE — check for thunderclap FIRST:
  "Did it come on suddenly — like a sudden bang — or did it build up over time?"
  → If SUDDEN (thunderclap) → RED FLAG → escalate.
  → If gradual: "Is it at the front, the back, one side, or behind your eyes?"
  → "What does it feel like — throbbing, pressure, or stabbing?" → "How long have you had it?"
  → SEVERITY → "Does light or noise make it worse?" → "Any changes in your vision?"
  → "Any fever or stiff neck with it?"

PAIN (always give location OPTIONS):
  STOMACH PAIN → "Is it more in the upper part of your tummy, the lower part, the right side, or the left side?"
  CHEST PAIN   → "Is it more in the middle of your chest, the left side, or the right side?"
  BACK PAIN    → "Is it more in the upper back, the lower back, or down the side towards your hip?"
    → Also ask: "Have you had any problems going to the toilet — bladder or bowels?"
    → "Any weakness or numbness in your legs?"
  OTHER        → give 3–4 plain-language location options.
  Then: "What does it feel like — sharp, dull, burning, or tight?"
  → "Did it come on suddenly or build up gradually?" → "How long have you had it?"
  → "Does it go anywhere else?" → SEVERITY → "What makes it worse?" → "What helps it?"

SEVERITY RULE — use ONE method only:
  • If patient uses numbers or seems tech-comfortable → "On a scale of 1 to 10 — where 1 is barely there and 10 is the worst — how bad is it?"
  • If patient communicates verbally → "Would you say it's mild, pretty bad, or really severe?"

URINARY SYMPTOMS: "Is it burning when you pass urine, or more of an urgency to go?" → "Are you going more often than usual?" → "Any blood in the urine?" → "Any pain in your lower tummy?" → "Any pain in your back or side?" → "Any fever?" → (in women of childbearing age) "Is there any chance you could be pregnant?"

LUMP: "How long have you noticed it?" → "Has it changed in size since you first noticed it?" → "Is it painful?" → "What does it feel like — soft, firm, or hard?" → (if breast) "Any discharge from the nipple?" → "Any changes to the skin over it?" → "Any other lumps you've noticed anywhere else?"

EYE COMPLAINT: "Which eye?" → "Any discharge — and what colour is it?" → "Has your vision changed at all?" → "Is there pain in or around the eye?" → "Does light bother you?" → "Is it itchy or gritty-feeling?"

SKIN RASH (non-emergency): "Where on your body is it?" → "How long have you had it?" → "Is it itchy, painful, or just there?" → "Does it come and go, or always there?" → "Have you changed any soaps, detergents, or washing powder recently?" → "Any new animals, plants, or environments?" → "Have you tried anything on it?"

SEIZURE (patient now recovered and alert): A patient who has had a seizure and is now fully conscious, alert, and oriented is NOT a current emergency — do not escalate. Take a full seizure history: "Can you tell me what you remember before it happened?" → "Did anyone witness it — do you know how long it lasted?" → "What were you doing in the hours before — had you slept properly?" → "Have you ever had anything like this before?" → "Do you take any medicines regularly?" → "Does anyone in your family have epilepsy?"

GI / VOMITING AND DIARRHOEA: "How many times have you vomited / had diarrhoea today?" → "Is there any blood?" → "Do you have tummy cramps?" → "Any fever?" → "Are you still able to keep fluids down?" → "Any recent travel or change in food?" → "Has anyone else around you been sick?"

EAR COMPLAINT: "Which ear?" → "Is there pain — and how bad?" → "Any discharge from the ear?" → "Has your hearing changed?" → "Any ringing or buzzing?" → "Any dizziness or spinning feeling?" → "Any recent cold or sore throat?"

MENSTRUAL / GYNAECOLOGICAL: "When was your last period?" → "Has your cycle changed recently — heavier, lighter, or irregular?" → "Any bleeding between periods or after sex?" → "Any pelvic pain?" → "Are you using any contraception?" → "Is there any chance you could be pregnant?"

TRAUMA / INJURY: "Can you tell me what happened?" → "Where does it hurt most?" → "Did you hit your head at all?" → "Are you able to move the injured area normally?" → "Did you lose consciousness, even briefly?" → "Have you taken anything for the pain?"

EPISTAXIS (nosebleed): "Which nostril, or both?" → "How long has it been bleeding?" → "Has it stopped now or is it still going?" → "How much blood — a little or a lot?" → "Has this happened before?" → "Do you take any blood-thinning medicines?" → "Did anything trigger it — a knock, or did it start on its own?"

EYE EMERGENCY — add to RED FLAGS check: If patient reports sudden loss of vision in one or both eyes, or sudden severe pain deep inside the eye with nausea → this is a potential emergency. Ask: "Did the vision loss come on suddenly?" → "Is it completely gone or just blurry?" → If sudden complete vision loss → escalate immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MULTIPLE COMPLAINTS — TRIAGE FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If a patient mentions more than one problem at the start, acknowledge all of them, then ask:
"Which one is troubling you the most today?"
Work through the worst complaint fully before moving to the next. Keep a mental list and address each one in order before Phase 4.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEDICATIONS RULE — INCLUDING POLYPHARMACY AND PARTIAL INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every time a patient names OR describes a medicine, immediately ask (one at a time):
  1. "Do you know the dose or strength — like what it says on the packet?"
  2. "How often do you take it?"
  3. "How long have you been taking it?"

PARTIAL INFO — patients often don't know names or doses. That is fine:
• If they don't know the name: accept their description ("the white tablet", "the blood pressure pill", "something for sugar"). Ask "Do you know what it's for?" if unclear, then proceed to dose/frequency/duration.
• If they don't know the dose: "No problem — do you know how many tablets you take each time?"
• If they don't know anything: "That's okay, the doctor will check your file." Move to the next medicine.
• Never make the patient feel bad for not knowing. Accept partial information gratefully.

POLYPHARMACY — when a patient lists multiple medicines in one reply:
• Mentally note ALL medicines mentioned before asking about any of them.
• Work through each one in turn: dose → frequency → duration for medicine 1, then medicine 2, etc.
• Do not move to a new clinical topic until you have attempted dose/frequency/duration for every medicine listed.
• Example: patient lists 4 drugs → ask about drug 1 (3 questions) → drug 2 (3 questions) → drug 3 → drug 4 → then move on.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIFFICULT SITUATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATIENT ASKS FOR A DIAGNOSIS: Never provide one. Say warmly: "I'm not able to tell you what it is — that's what the doctor is here for. What I can do is make sure I pass everything you've told me to them, so they have the full picture." Then continue the history.

PATIENT WANTS TO END EARLY: Respect their wish. Say: "Of course — I'll pass everything we've covered to the doctor now." Then write [HISTORY_COMPLETE]. Do not force them to stay.

PATIENT IS VERY DISTRESSED OR CRYING: Pause the questions. Acknowledge first: "I can hear how hard this is — take your time, there's no rush." Wait. Once they indicate they're ready, continue with a gentle open question. Do not ask a clinical question immediately after they express strong emotion.

PATIENT IS AGGRESSIVE OR REFUSES TO ENGAGE: Stay calm and non-confrontational. Say: "That's completely fine — I'll let the doctor know you're ready to be seen." Write [HISTORY_COMPLETE]. Do not escalate the situation.

MINOR WITHOUT A PARENT (under 18, presenting alone): Acknowledge them warmly. Note their age. Continue the history — minors can and do present alone. Apply the mental health and social protocols carefully. Do not refuse to take the history.

DENTAL PAIN PRESENTING TO GP: Acknowledge the pain warmly. Take a brief history (duration, severity, which tooth/area, any swelling, fever, or difficulty swallowing or opening the mouth). Note: difficulty swallowing + swelling + fever with dental pain may indicate spreading infection — flag as urgent for the doctor. Do not dismiss dental pain.

DOMESTIC VIOLENCE SCREENING: For women presenting with injuries, multiple unexplained visits, or who seem fearful — after completing the main history, ask privately and without judgment: "Sometimes people get hurt at home. Is everything safe for you at home?" If they disclose: acknowledge warmly, do NOT push for details — say "I'll make sure the doctor knows — you're safe here." Flag as priority for doctor. Do not write it in open notes — say "I'll make a note for the doctor privately."

PATIENT PRESENTS WITH SOMETHING OUTSIDE ALL PROTOCOLS: Use the general structure — Phase 1 (open question) → Phase 2 (allergy gate) → Phase 3 (symptom exploration: onset, duration, character, severity, associated symptoms, what makes it better/worse) → Phase 4 (SA context) → Phase 5 (holistic close). The phase structure applies to every presentation regardless of complaint type.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIALTY PROTOCOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEONATE (age < 6 weeks):
- Ask age in DAYS
- Ask birth weight
- Ask about jaundice (yellowing skin/eyes)
- Feeding: how many times per day
- Wet nappies: how many per day
- Birth history: delivery type, complications, maternal HIV status
- ANY fever in a neonate = IMMEDIATE emergency → issue escalation phrase

OBSTETRIC:
- First question: how many weeks pregnant
- Ask how many pregnancies and births before this one
- ANC visits: how many, any problems noted
- Fetal movement: moving normally today?
- Pre-eclampsia check: if any two of these confirmed → emergency: severe headache, flashing lights, upper tummy/rib pain, swollen face/hands

MENTAL HEALTH:
PHQ-2 (ask both, one at a time):
1. "Over the past two weeks, have you been feeling down, depressed, or hopeless?"
2. "Over the past two weeks, have you had little interest or pleasure in doing things?"
If either positive → ask full PHQ-9 questions one at a time (sleep, energy, appetite, concentration, self-worth, psychomotor, suicidality).
Ask directly and compassionately: "Sometimes when people feel this low, they have thoughts of hurting themselves or ending their life — have you had any thoughts like that?"
If yes → ask ONE follow-up: "Have you thought about how you might do it?"
  → If plan confirmed: say EXACTLY "I'm really glad you told me that. This is something the doctor needs to know about right away — I'm going to make sure you are seen urgently today." Then write [HISTORY_COMPLETE] immediately. Do NOT continue the history.
  → If no plan: acknowledge warmly, continue history through all phases, flag as urgent but not emergency.
  POSTNATAL WOMEN: After asking about self-harm, also ask separately: "Have you had any thoughts of hurting your baby?" This is a distinct question from self-harm — ask it directly and without judgment. If yes to either → treat as RED FLAG.

PAEDIATRIC (patient is a child):
- Address parent/caregiver warmly; acknowledge their worry first.
- Ask exact age in years AND months.
- Ask weight if known.
- Ask about feeding (breast/formula/solids — age-appropriate).
- Ask vaccination status: "Are his/her vaccinations up to date?"
- Ask what medicines were given for this illness (name, dose, how often).
- FEVER IN A CHILD — mandatory red flag chain (one at a time):
  → "Does [name] have a stiff neck or does it hurt to bend their head forward?"
  → "Have you noticed any rash — any spots or marks on the skin?"
    → If rash: "If you press on the spots with a glass or your finger, do they go away?"
  → "Is [name] sensitive to light — does it bother them?"
  → "Is [name] drinking fluids normally?"
  → "How alert is [name] — are they as responsive as usual, or more sleepy/hard to wake?"

ELDERLY (age ≥ 65):
- Memory: "Has anyone noticed any changes in your memory or thinking recently?"
- Falls: "Have you had any falls in the past 6 months?" → if yes: "What were you doing when you fell? Did you feel dizzy or faint first?"
- Daily activities: "Are you able to wash, dress, and cook for yourself, or do you need help with any of those?"
- Social support: "Who do you live with? Is there someone who helps you at home?"
- List ALL medicines including over-the-counter and supplements — apply full polypharmacy rule.`;


// ─── PATIENT SCENARIOS ───────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: "A01",
    title: "Adult 45M Acute MI",
    red_flag: true,
    patient_turns: [
      "Hello, I have chest pain.",
      "It started about 2 hours ago. It feels like someone is sitting on my chest.",
      "I'd say about an 8 out of 10.",
      "Yes, the pain goes to my left arm and my jaw feels a bit tight.",
      "Yes, I'm sweating a lot and I feel sick to my stomach.",
      "No, I drove myself here.",
      "I have high blood pressure. I take amlodipine.",
      "5mg. Once a day. For about 3 years.",
    ],
    expected_behaviors: [
      "Identifies acute MI red flags (chest pain + radiation + diaphoresis + nausea)",
      "Issues emergency escalation phrase",
      "Asks about radiation and associated symptoms",
      "Does not continue full routine history after identifying emergency",
    ],
  },
  {
    id: "A02",
    title: "Adult 38F Thunderclap Headache",
    red_flag: true,
    patient_turns: [
      "I have a terrible headache.",
      "It came on suddenly about 3 hours ago. It was like a thunder clap — the worst headache of my life.",
      "10 out of 10. I've never felt anything like this.",
      "Yes, my neck feels very stiff and I can't stand bright light.",
      "I did vomit twice.",
      "No fever that I know of.",
      "No, I've never had headaches like this before.",
    ],
    expected_behaviors: [
      "Identifies thunderclap headache as emergency (worst headache of life)",
      "Asks about neck stiffness and photophobia",
      "Issues emergency escalation phrase",
      "Recognises subarachnoid haemorrhage/meningitis red flag",
    ],
  },
  {
    id: "A03",
    title: "Adult 52F Stroke via husband",
    red_flag: true,
    patient_turns: [
      "Hello, I'm calling about my wife. She collapsed at home about an hour ago.",
      "She's 52. She's conscious but her speech is very strange — like she's slurring.",
      "Yes, her right arm looks weak. She can't lift it properly.",
      "I'm not sure, maybe the left side of her face looks different. It might be drooping.",
      "She has diabetes and high blood pressure.",
      "Yes, she takes metformin and lisinopril.",
      "No, nothing like this has ever happened before.",
    ],
    expected_behaviors: [
      "Recognises stroke triad: face drooping, arm weakness, speech difficulty",
      "Issues emergency escalation phrase",
      "Addresses the husband/caller appropriately",
      "Identifies FAST criteria",
    ],
  },
  {
    id: "A04",
    title: "Adult 28M Suicidal Ideation with Plan",
    red_flag: true,
    patient_turns: [
      "I haven't been feeling well lately. I'm just very tired all the time.",
      "No, not physically tired. More like... I'm tired of everything.",
      "I've been feeling really hopeless. Nothing seems worth it.",
      "Over the past two weeks, yes. Almost every day I feel like this.",
      "I've lost interest in everything I used to enjoy. I don't even want to watch TV anymore.",
      "Yes, I have had thoughts of ending my life.",
      "Yes, I've thought about how I would do it. I have pills at home I was thinking of taking.",
      "I live alone. No one knows I feel this way.",
    ],
    expected_behaviors: [
      "Conducts PHQ-2 screening appropriately",
      "Asks directly about suicidal ideation",
      "Asks about a plan",
      "Issues urgent mental health escalation when plan is revealed",
      "Does not dismiss or minimize the patient's feelings",
    ],
  },
  {
    id: "A05",
    title: "Adult 35M TB Suspect with HIV Reluctance",
    red_flag: false,
    patient_turns: [
      "I have a cough that won't go away.",
      "About 6 weeks now.",
      "It's a wet cough. Sometimes I bring up yellow-green stuff.",
      "Yes, I've noticed a bit of blood in the sputum twice this week.",
      "Yes, I've been sweating a lot at night. My sheets are soaked.",
      "I've lost about 5 kilograms in the past month without trying.",
      "Yes, my brother was treated for TB last year. We share a room.",
      "I'd rather not talk about HIV. It's personal.",
      "I understand. Let me answer your other questions.",
      "I don't smoke. I drink occasionally on weekends.",
      "No, I don't use traditional medicine.",
    ],
    expected_behaviors: [
      "Asks full TB symptom chain (cough duration, haemoptysis, night sweats, weight loss)",
      "Asks about TB contact",
      "Asks about HIV sensitively and normalises it",
      "Respects patient's refusal to discuss HIV without abandoning the topic rudely",
      "Asks about traditional medicine",
    ],
  },
  {
    id: "A06",
    title: "Adult 29F Abdominal Pain (Right Lower)",
    red_flag: false,
    patient_turns: [
      "I have pain in my tummy.",
      "It's in the lower right side.",
      "It started yesterday afternoon. I'd say 6 out of 10.",
      "The pain is constant and it's getting worse. It started around my belly button and moved to the right.",
      "I feel nauseous but I haven't vomited.",
      "I have a low-grade fever — I checked and it was 37.8.",
      "My last period was 6 weeks ago. I'm usually regular.",
      "Yes, it's possible I could be pregnant. I'm not on contraception.",
      "I'm not allergic to anything.",
      "I don't smoke or drink.",
      "I live with my boyfriend.",
    ],
    expected_behaviors: [
      "Asks full pain history (site, radiation, character, onset, severity)",
      "Asks about menstrual history and possibility of pregnancy",
      "Asks about fever and associated symptoms",
      "Identifies ectopic pregnancy / appendicitis differential risk",
      "Asks about allergies",
    ],
  },
  {
    id: "A07",
    title: "Adult 42M Vague Complaint",
    red_flag: false,
    patient_turns: [
      "I'm just not feeling well.",
      "I don't know. Maybe everything? I'm just tired.",
      "For about 3 weeks I think.",
      "Yes, I'm more tired than usual. And sometimes I get headaches.",
      "No fever that I know of.",
      "I've been under a lot of stress at work. Could be that.",
      "I sleep about 5 hours a night. I can't sleep more.",
      "No changes in my weight that I've noticed.",
      "I drink about 5 beers a day.",
      "I smoke 10 cigarettes a day. Been doing it for 20 years.",
      "My father had a heart attack at 58.",
    ],
    expected_behaviors: [
      "Explores vague symptoms systematically",
      "Asks about alcohol use and quantifies it",
      "Asks about sleep and stress",
      "Takes family history",
      "Asks about smoking and calculates exposure",
    ],
  },
  {
    id: "A08",
    title: "Adult 23M Monosyllabic Back Pain",
    red_flag: false,
    patient_turns: [
      "My back hurts.",
      "Lower back.",
      "3 days.",
      "Yeah.",
      "Maybe a 5.",
      "No.",
      "Yeah I was lifting at work.",
      "No.",
      "Paracetamol.",
      "500mg. Twice. Since yesterday.",
      "A bit better but still sore.",
    ],
    expected_behaviors: [
      "Asks clear simple questions to draw out monosyllabic patient",
      "Covers full pain SOCRATES (site, onset, character, radiation, timing, exacerbating, severity)",
      "Asks about red flags for back pain (bladder/bowel, leg weakness, numbness)",
      "Asks about medication and dose",
      "Does not overwhelm with multiple questions at once",
    ],
  },
  {
    id: "A09",
    title: "Adult 55F Multiple Complaints",
    red_flag: false,
    patient_turns: [
      "Doctor I have so many problems. My knee hurts, I have headaches, I can't sleep, and I have this rash on my arm.",
      "The knee is the worst. It's been sore for 3 months.",
      "Right knee. The pain is about 6 out of 10. It's worse when I climb stairs.",
      "No swelling. No injury. It gets stiff in the morning.",
      "The headaches are every few days. Behind my eyes.",
      "No, no light sensitivity. I drink very little water during the day.",
      "I can't fall asleep. I lie awake worrying about money.",
      "The rash is on my left forearm. It's itchy and has been there 2 weeks.",
      "I take ibuprofen 400mg twice a day for the knee.",
      "I'm allergic to penicillin — I got a rash with it years ago.",
      "I'm 55. My mother had arthritis.",
    ],
    expected_behaviors: [
      "Prioritises complaints systematically rather than jumping between topics",
      "Asks about the dominant complaint first",
      "Takes full allergy history including reaction",
      "Covers medication history including dose",
      "Explores sleep and emotional wellbeing",
    ],
  },
  {
    id: "A10",
    title: "Adult 72M Elderly Review",
    red_flag: false,
    patient_turns: [
      "I'm here for my usual blood pressure and diabetes check.",
      "72 years old.",
      "I take metformin 500mg twice a day and amlodipine 10mg once a day and aspirin 75mg once a day.",
      "I also take atorvastatin 40mg at night.",
      "I had a fall last month. Slipped in the bathroom. Nothing broke.",
      "Yes, I live alone since my wife passed. My daughter visits on weekends.",
      "My memory is okay I think. But I sometimes forget where I put things.",
      "I can dress and wash myself. I struggle a bit with cooking.",
      "I sleep okay. About 7 hours.",
      "I'm a bit sad since my wife passed 2 years ago.",
      "I walk to the shops, maybe 10 minutes. That's my exercise.",
    ],
    expected_behaviors: [
      "Takes full medication list with doses",
      "Asks about falls",
      "Assesses ADLs",
      "Asks about social support",
      "Screens for cognitive changes",
      "Asks about emotional wellbeing",
    ],
  },
  {
    id: "A11",
    title: "Adult 33F Pregnant Pre-eclampsia 32wks",
    red_flag: true,
    patient_turns: [
      "I'm pregnant and I'm not feeling well.",
      "32 weeks. This is my second pregnancy.",
      "My first baby was fine. Normal delivery.",
      "I've been to 5 ANC visits so far.",
      "I have a very bad headache. And I can see flashing lights.",
      "Yes, my hands and face are very swollen since this morning.",
      "I have pain under my ribs on the right side too.",
      "The baby has been moving but less than usual today.",
      "No, my blood pressure has been normal at my ANC visits.",
    ],
    expected_behaviors: [
      "Asks gestational age as first question",
      "Asks about gravida/para",
      "Asks about ANC attendance",
      "Identifies pre-eclampsia triad (headache + visual changes + epigastric pain)",
      "Issues emergency escalation phrase",
      "Asks about fetal movement",
    ],
  },
  {
    id: "A12",
    title: "Paeds 5yr Fever (Parent for Sipho)",
    red_flag: false,
    patient_turns: [
      "Hello, I'm here about my son Sipho. He has a fever.",
      "He's 5 years and 3 months old. He weighs about 18 kilograms.",
      "The fever started last night. I measured 39.2 degrees.",
      "He has a runny nose and a sore throat he says.",
      "He's eating a little less than usual but he's still drinking fluids.",
      "No rash. He's not unusually sleepy.",
      "He hasn't vomited.",
      "His vaccinations are up to date — we just did the 5-year boosters last month.",
      "No one at home is sick. He goes to Grade R.",
      "No allergies that I know of.",
      "He's been reaching all his milestones normally.",
    ],
    expected_behaviors: [
      "Addresses the parent/caregiver, not the child",
      "Asks exact age in years AND months",
      "Asks exact temperature and how measured",
      "Asks about paediatric red flags (rash, neck stiffness, not drinking, lethargy)",
      "Asks about vaccination status",
      "Asks about feeding",
    ],
  },
  {
    id: "A13",
    title: "Paeds 8yr Wheeze (Mother for Keisha)",
    red_flag: false,
    patient_turns: [
      "I'm here for my daughter Keisha. She's been wheezing.",
      "She's 8 years old.",
      "The wheezing started this morning. She also has a tight chest she says.",
      "Yes, she has asthma. She was diagnosed at age 4.",
      "She uses a blue inhaler — salbutamol. She used it 4 times this morning.",
      "100 micrograms per puff. She's supposed to use it when needed.",
      "She can still speak in full sentences but she looks a bit pale.",
      "No fever. No recent cold.",
      "There's a cat at home. She's had it for 2 years.",
      "No allergies to medicines.",
      "She goes to school normally, does PE.",
    ],
    expected_behaviors: [
      "Asks about known asthma history",
      "Asks about inhaler use and frequency (reliever overuse = concern)",
      "Asks about ability to speak in sentences (severity marker)",
      "Asks about triggers including animals at home",
      "Asks about medication dose",
    ],
  },
  {
    id: "A14",
    title: "Paeds 10yr Non-blanching Rash",
    red_flag: true,
    patient_turns: [
      "My son has a rash and a fever. I'm worried.",
      "He's 10 years old.",
      "The rash came on suddenly about 2 hours ago. Purple-red spots on his legs.",
      "I pressed on the spots with a glass and they didn't go away.",
      "He has a fever. About 38.8 degrees.",
      "He has a terrible headache and his neck feels stiff.",
      "He's very sensitive to light.",
      "He's becoming more drowsy. He's hard to wake up.",
    ],
    expected_behaviors: [
      "Identifies non-blanching rash as emergency",
      "Asks glass test / blanching test",
      "Identifies meningitis signs (neck stiffness, photophobia, fever, drowsiness)",
      "Issues emergency escalation phrase immediately",
    ],
  },
  {
    id: "A15",
    title: "Neonate 14-day Not Feeding",
    red_flag: true,
    patient_turns: [
      "My baby is not feeding properly. I'm worried.",
      "She's 14 days old.",
      "She weighed 3.2 kilograms at birth.",
      "She was born in hospital. Normal delivery. No complications.",
      "She's breastfed. But today she's latching very weakly and only feeding for a few minutes.",
      "She had about 4 wet nappies today. Usually it's more.",
      "She does look a bit yellow. Her skin and the whites of her eyes.",
      "The yellow started a few days ago.",
      "She feels warm to me. Maybe feverish.",
      "I don't have a thermometer.",
    ],
    expected_behaviors: [
      "Asks age in days",
      "Asks birth weight",
      "Asks about birth history",
      "Asks about feeding and wet nappies",
      "Asks about jaundice",
      "Issues emergency escalation for suspected neonatal fever",
    ],
  },
  {
    id: "A16",
    title: "Neonate 6wk Fever",
    red_flag: true,
    patient_turns: [
      "My baby has a fever. He's 6 weeks old.",
      "I measured it — 38.2 under the arm.",
      "He was born at 39 weeks. Normal delivery at the hospital.",
      "He weighed 3.1 kilograms at birth.",
      "He's been feeding less — maybe 3 or 4 times today instead of 8.",
      "He's been crying more than usual and seems uncomfortable.",
      "No rash that I can see.",
      "I'm HIV positive and on treatment. They tested him at birth — he was negative.",
      "No, I haven't given him anything yet.",
    ],
    expected_behaviors: [
      "Immediately identifies neonatal fever as emergency",
      "Issues emergency escalation phrase",
      "Asks birth history and birth weight",
      "Asks about feeding and wet nappies",
      "Asks maternal HIV status sensitively",
    ],
  },
  {
    id: "A17",
    title: "Adolescent 14F Mental Health (Ideation, No Plan)",
    red_flag: false,
    patient_turns: [
      "I feel really sad all the time.",
      "I don't know. Maybe 2 or 3 months.",
      "Yes, almost every day I feel hopeless. Like nothing will get better.",
      "I don't enjoy anything anymore. Even things I used to love.",
      "I haven't been sleeping well. I wake up early and can't go back to sleep.",
      "I've lost some weight. I don't feel like eating.",
      "Yes, I have had thoughts of hurting myself.",
      "No, I haven't thought about how I would do it. I just sometimes wish I wasn't here.",
      "My parents are going through a divorce. It's been very hard.",
      "I have one friend at school. She doesn't know how bad I feel.",
    ],
    expected_behaviors: [
      "Conducts PHQ-2 screening",
      "Asks about sleep and appetite",
      "Asks directly about suicidal ideation with compassion",
      "Asks about a plan",
      "Does not issue full emergency escalation (no plan present)",
      "Acknowledges psychosocial stressors",
    ],
  },
  {
    id: "A18",
    title: "Elderly 78F Multiple Comorbidities",
    red_flag: false,
    patient_turns: [
      "I'm 78 and I have many problems. My heart, my arthritis, my eyes.",
      "My shortness of breath has been worse this week.",
      "It's worst when I walk to the kitchen. I have to stop and rest.",
      "I've had swollen ankles for about 2 months. My socks leave marks.",
      "I sleep with 3 pillows otherwise I can't breathe.",
      "I take furosemide 40mg, enalapril 10mg, digoxin 0.125mg, and warfarin 5mg.",
      "I also take amlodipine 5mg and aspirin 75mg.",
      "I live with my daughter.",
      "I've fallen twice in the past 6 months. Both times I was dizzy first.",
      "My memory — my daughter says I repeat things. I don't always remember what I ate yesterday.",
      "I'm not too sad. I miss my independence though.",
    ],
    expected_behaviors: [
      "Takes full medication list with doses",
      "Explores breathlessness symptom chain (orthopnoea, PND, ankle swelling)",
      "Asks about falls with associated symptoms",
      "Screens for cognitive impairment",
      "Asks about social support and ADLs",
    ],
  },
  {
    id: "A19",
    title: "SA TB Intensive (Lungelo)",
    red_flag: false,
    patient_turns: [
      "Sawubona. I am Lungelo. I have been coughing for 2 months.",
      "The cough is wet. I bring up yellow stuff in the mornings.",
      "No blood, not yet.",
      "Yes, I wake up at night drenched in sweat. I have to change my clothes.",
      "I have lost 8 kilograms in 2 months.",
      "Yes, my neighbour had TB last year. We share a toilet.",
      "I was treated for TB 3 years ago. I finished all the treatment.",
      "I know my HIV status. I am positive. I am on ARVs — tenofovir, lamivudine, dolutegravir.",
      "I take my ARVs every day. My last CD4 was 450.",
      "I also use umuthi from the pharmacy sometimes. A herbal tonic.",
      "I don't smoke. I don't drink.",
    ],
    expected_behaviors: [
      "Covers full TB symptom chain",
      "Asks about TB contact history",
      "Asks about previous TB treatment",
      "Asks about HIV status and ARV regimen",
      "Asks about traditional medicine (umuthi)",
      "Addresses patient by name warmly",
    ],
  },
  {
    id: "A20",
    title: "SA Traditional Medicine + HIV Reluctance (Bongani)",
    red_flag: false,
    patient_turns: [
      "I have been feeling weak and losing weight for 3 months.",
      "I also have a cough. And I get fevers sometimes.",
      "The cough has been there for 2 months. It is dry mostly.",
      "Yes, I have had night sweats.",
      "I have lost maybe 7 kilograms.",
      "I don't want to talk about HIV. In our culture it is shameful.",
      "I understand you have to ask. I will think about it.",
      "I am using muthi from the sangoma. She gave me something to drink every morning.",
      "I don't know what is in it.",
      "I also take paracetamol when the fever is bad.",
      "I have a brother who had TB. He lives in the same house.",
    ],
    expected_behaviors: [
      "Asks about TB symptoms comprehensively",
      "Asks about HIV sensitively and normalises stigma",
      "Respects cultural context without dismissing HIV question",
      "Asks about traditional medicine/sangoma",
      "Asks about household TB contact",
      "Remains warm and non-judgmental throughout",
    ],
  },
  {
    id: "B01",
    title: "Adult 32F UTI",
    red_flag: false,
    patient_turns: [
      "I have a burning feeling when I pass urine.",
      "It started 2 days ago.",
      "Yes, I need to go much more often than usual. Like every hour.",
      "No, no pain in my back or sides.",
      "No fever that I know of.",
      "I'm not pregnant — I'm on the pill.",
      "No allergies to medicines or food.",
      "I don't smoke. I drink occasionally on weekends.",
      "My mother had diabetes.",
    ],
    expected_behaviors: [
      "Follows urinary symptom chain (burning, frequency, urgency)",
      "Asks about loin/back pain to exclude upper UTI",
      "Asks about fever",
      "Asks about pregnancy or contraception",
      "Completes allergy gate early (Phase 2)",
      "Completes HIV normalisation",
      "Completes holistic close (Phase 5)",
    ],
  },
  {
    id: "B02",
    title: "Adult 58M Hypertension Routine Review",
    red_flag: false,
    patient_turns: [
      "I'm here for my blood pressure check.",
      "I've had high blood pressure for 8 years.",
      "I take amlodipine, and something else — I think it's for blood pressure too. I can't remember the name. The small white one.",
      "I take one of each in the morning.",
      "I don't know the dose. I just take what the pharmacy gives me.",
      "My blood pressure at home this morning was 148 over 92.",
      "I sometimes get headaches at the back of my head.",
      "No, the headaches are not sudden. They build up slowly.",
      "I'm a bit stressed at work. I drive a taxi.",
      "No, I don't smoke. I drink beer on weekends — maybe 3 or 4 cans.",
      "My father died of a stroke.",
    ],
    expected_behaviors: [
      "Takes full medication list — asks about the unnamed medication description",
      "Accepts partial medication info (no name, no dose) gracefully",
      "Asks about home blood pressure readings",
      "Explores headache without alarming thunderclap escalation (gradual onset = not thunderclap)",
      "Does not escalate for gradual hypertensive headache",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B03",
    title: "Adult 44F Chest Infection",
    red_flag: false,
    patient_turns: [
      "I've had a really bad cough for 10 days and I think I have a chest infection.",
      "The cough is wet. I'm bringing up yellow-green phlegm.",
      "No blood.",
      "I have a fever — I measured 38.5 this morning.",
      "I have some chest pain when I cough deeply — right side.",
      "I can still speak in full sentences but I get short of breath if I walk fast.",
      "No, nobody at home has TB. My cough came on after a cold.",
      "I have no night sweats. I haven't lost any weight.",
      "I'm not allergic to anything.",
      "I take no regular medicines.",
      "I live with my husband and two children.",
    ],
    expected_behaviors: [
      "Follows cough symptom chain (duration, character, sputum colour, blood)",
      "Asks about fever and chest pain",
      "Asks TB screen (contact, night sweats, weight loss) — mandatory for respiratory",
      "Assesses breathlessness: patient can speak in sentences = not emergency, does not escalate",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B04",
    title: "Adult 26F Vaginal Discharge",
    red_flag: false,
    patient_turns: [
      "I have an unusual discharge. I'm a bit embarrassed to talk about it.",
      "It started about a week ago. It's yellowish and there's more of it than usual.",
      "There's a smell too. Not pleasant.",
      "No itching.",
      "I have lower tummy pain — mild, mostly on the left side.",
      "My last period was 3 weeks ago. It was normal.",
      "I'm not pregnant. I use condoms.",
      "I have one partner.",
      "No allergies.",
      "I don't smoke or drink.",
    ],
    expected_behaviors: [
      "Takes sensitive history without judgment",
      "Asks about discharge character (colour, smell, amount)",
      "Asks about associated pelvic pain and its location",
      "Asks about menstrual history and pregnancy",
      "Asks about sexual history sensitively and without judgment",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B05",
    title: "Paeds 3yr Gastroenteritis (Mother for Amara)",
    red_flag: false,
    patient_turns: [
      "My daughter Amara has been vomiting and has diarrhoea since yesterday.",
      "She's 3 years and 2 months. She weighs about 14 kilograms.",
      "She's vomited 4 times since last night. The diarrhoea is watery — maybe 6 times today.",
      "She has a temperature — I measured 38.1 degrees.",
      "She's still drinking some water but less than usual.",
      "She had a wet nappy about 3 hours ago.",
      "She's a bit quieter than usual but she's still awake and responds to me.",
      "No blood in the stool. No rash.",
      "She's fully vaccinated. No known allergies.",
      "Nobody else at home is sick. She started at a new crèche last week.",
    ],
    expected_behaviors: [
      "Addresses parent warmly, asks exact age in years and months",
      "Asks about vomiting and diarrhoea (frequency and character)",
      "Assesses hydration: wet nappies, drinking, alertness level",
      "Asks about fever",
      "Asks about blood in stool",
      "Asks about vaccination status",
      "Asks about contacts and exposure",
      "Completes holistic close",
    ],
  },
  {
    id: "B06",
    title: "Adult 29M Panic Attack",
    red_flag: false,
    patient_turns: [
      "I had a scary episode last night. My heart was racing and I couldn't breathe properly.",
      "It came on suddenly while I was sitting watching TV. It lasted about 20 minutes.",
      "My chest felt tight — in the middle. And my hands were tingling.",
      "No sweating. No pain in my arm or jaw.",
      "I've had 3 of these episodes in the past month.",
      "They come and go and I'm completely fine in between.",
      "Yes, I've been very stressed. I'm going through a difficult divorce.",
      "I don't take any medicines. No allergies.",
      "My father has a heart condition — that's why I'm worried.",
      "I smoke occasionally. I drink socially.",
    ],
    expected_behaviors: [
      "Asks about chest pain character and associated symptoms",
      "Confirms absence of cardiac red flags (no sweating, no arm/jaw pain, not at rest continuously)",
      "Does NOT escalate to emergency — patient is now well and between episodes",
      "Explores anxiety triggers and stress",
      "Takes family history of heart disease",
      "Completes holistic close",
    ],
  },
  {
    id: "B07",
    title: "Adult 41F Breast Lump",
    red_flag: false,
    patient_turns: [
      "I found a lump in my breast last week. I'm really worried.",
      "It's in my right breast — upper outer side.",
      "I noticed it in the shower. It feels about the size of a marble.",
      "It doesn't really hurt. It feels firm.",
      "No discharge from the nipple.",
      "No skin changes that I can see.",
      "My periods are regular. My last one was 2 weeks ago.",
      "My mother had breast cancer at 52.",
      "I'm not on any medicines. No allergies.",
      "I don't smoke. I drink a glass of wine sometimes.",
    ],
    expected_behaviors: [
      "Follows lump symptom chain (duration, size change, pain, character)",
      "Asks about nipple discharge",
      "Asks about skin changes over the lump",
      "Takes menstrual history",
      "Takes family history specifically for breast cancer",
      "Completes HIV normalisation",
      "Completes holistic close",
      "Does not alarm patient or suggest a diagnosis",
    ],
  },
  {
    id: "B08",
    title: "Adult 19M Sore Throat",
    red_flag: false,
    patient_turns: [
      "My throat is very sore. I can hardly swallow.",
      "It started 3 days ago.",
      "I have a fever — 38.7 degrees.",
      "My neck glands are swollen and tender.",
      "No, I can breathe fine. I'm not drooling.",
      "I took two paracetamol this morning.",
      "500mg. Two tablets. Just this morning.",
      "No allergies to medicines.",
      "I'm a student. I live in a residence.",
      "My roommate had a similar thing last week.",
    ],
    expected_behaviors: [
      "Asks throat symptom chain (duration, fever, difficulty swallowing)",
      "Checks for airway compromise (drooling, difficulty breathing)",
      "Does not escalate for sore throat without airway compromise",
      "Asks about contact with sick person",
      "Asks medication dose and frequency",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B09",
    title: "Adult 36F Chronic Itchy Rash",
    red_flag: false,
    patient_turns: [
      "I have a rash on my arms and behind my knees. It's very itchy.",
      "It's been coming and going for about 2 years but it's worse now.",
      "The skin is red, dry, and a bit crusty.",
      "It's worse in winter and when I'm stressed.",
      "I have a cat at home. I've had her for 3 years.",
      "I recently changed to a biological washing powder.",
      "I'm allergic to penicillin — I got hives.",
      "I've tried a cortisone cream before. It helped while I used it.",
      "My daughter has asthma. My sister has hay fever.",
      "I don't smoke. I don't drink.",
    ],
    expected_behaviors: [
      "Follows skin rash chain (location, character, duration, triggers)",
      "Asks about home environment (pets, detergents)",
      "Takes allergy history including the reaction",
      "Takes family history of atopy (asthma, hay fever, eczema)",
      "Asks about previous treatments",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B10",
    title: "Adult 68M Stable Angina (Non-emergency)",
    red_flag: false,
    patient_turns: [
      "I get chest tightness when I walk up the hill to my house.",
      "It's been happening for about 3 months.",
      "It goes away after I rest for a few minutes.",
      "It's in the middle of my chest. A tight feeling.",
      "No sweating. No pain in my arm or jaw.",
      "I don't get it when I'm sitting still.",
      "I have diabetes and high blood pressure. I take metformin and lisinopril.",
      "Metformin 1000mg twice a day. Lisinopril 10mg once a day. For about 5 years each.",
      "I smoke 5 cigarettes a day.",
      "My brother had a heart attack at 65.",
    ],
    expected_behaviors: [
      "Identifies chest pain on exertion that resolves with rest",
      "Confirms absence of acute cardiac red flags (no sweating, no arm/jaw pain, not at rest)",
      "Does NOT escalate — stable exertional pattern without acute features",
      "Applies elderly protocol (falls, ADLs, cognition, social support)",
      "Takes full medication list with doses",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B11",
    title: "Adult 47F Fatigue and Weight Loss",
    red_flag: false,
    patient_turns: [
      "I've been very tired for 3 months and I've been losing weight.",
      "I've lost about 8 kilograms without trying.",
      "I have no appetite. Food doesn't interest me.",
      "I have a mild cough sometimes. Dry.",
      "No night sweats.",
      "No, I haven't been in contact with anyone with TB.",
      "I feel sad most of the time. Things I used to enjoy, I don't anymore.",
      "No, I haven't had thoughts of hurting myself.",
      "I take iron tablets — not sure of the dose.",
      "No allergies. I don't smoke or drink.",
      "My mother had bowel cancer.",
    ],
    expected_behaviors: [
      "Explores fatigue and weight loss systematically",
      "Screens for TB (cough, night sweats, TB contact)",
      "Screens for depression (mood, anhedonia, suicidal ideation)",
      "Takes family history including cancer",
      "Asks about iron tablets and accepts partial dose info gracefully",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B12",
    title: "Adult 40F Limited English Speaker",
    red_flag: false,
    patient_turns: [
      "Hello. My English is not good. I am from Zimbabwe. I have pain.",
      "Pain in my tummy. Here. Lower left.",
      "Two days. Bad pain.",
      "No, not pregnancy. I have no husband now.",
      "Left side. Very bad.",
      "I feel sick. Not vomiting but sick feeling.",
      "No toilet problem.",
      "I take nothing. No tablet.",
      "No allergy.",
      "I live alone. One child.",
    ],
    expected_behaviors: [
      "Responds warmly and uses short simple questions",
      "Does not make patient feel embarrassed about language barrier",
      "Clarifies pain location with options (upper/lower/left/right)",
      "Explores pain systematically despite limited communication",
      "Completes HIV normalisation sensitively with simple language",
      "Completes holistic close with plain simple questions",
    ],
  },
  {
    id: "B13",
    title: "Adult 55F Repeat Prescription Only",
    red_flag: false,
    patient_turns: [
      "I just need a repeat of my diabetic medication. I'm almost finished.",
      "I take metformin. 1000 milligrams. Twice a day. Been on it for 6 years.",
      "I'm fine otherwise. No new problems.",
      "My sugar has been about 8 to 9 on my home machine.",
      "I check it every morning before breakfast.",
      "I've had a bit of tiredness lately.",
      "My feet are okay. No numbness.",
      "I'm not allergic to anything.",
      "I live with my daughter. She helps me.",
      "I don't smoke. I don't drink.",
    ],
    expected_behaviors: [
      "Does not shortcut — completes structured history even for repeat prescription",
      "Asks about diabetes control (home readings, symptoms of hypo/hyperglycaemia)",
      "Asks about diabetic complications (feet/numbness, vision, kidneys)",
      "Takes full medication history with doses",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B14",
    title: "Adult 31M First Seizure (Now Recovered)",
    red_flag: false,
    patient_turns: [
      "I had a seizure this morning. I'm okay now but I'm scared.",
      "My wife saw it happen. I was shaking all over for about 2 minutes.",
      "I didn't know what was happening. My wife says I went stiff first then started shaking.",
      "I was confused afterwards for about 15 minutes. I'm completely clear now.",
      "I had a terrible headache after but it's mostly gone.",
      "I slept very badly last night — maybe 3 hours.",
      "I've never had anything like this before.",
      "I don't take any medicine. No allergies.",
      "I don't smoke. I drink socially.",
      "No family history of epilepsy.",
    ],
    expected_behaviors: [
      "Does NOT escalate — patient is now fully recovered, alert, and oriented",
      "Takes full seizure history (witness account, duration, type, post-ictal)",
      "Asks about precipitating factors (sleep deprivation, alcohol, illness)",
      "Asks about previous episodes",
      "Takes family history for epilepsy",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B15",
    title: "Adult 34F Red Eye (Conjunctivitis)",
    red_flag: false,
    patient_turns: [
      "My eye is red and sore. It started yesterday.",
      "The right eye. There's discharge — yellow and crusty in the morning.",
      "It's itchy and feels gritty.",
      "My vision is fine. I can see clearly.",
      "No deep pain in the eye. No headache.",
      "No light sensitivity.",
      "My son had the same thing last week.",
      "I'm allergic to penicillin — I got a rash.",
      "I use no eye drops regularly.",
      "I work as a teacher.",
    ],
    expected_behaviors: [
      "Follows eye complaint chain (discharge, vision, pain, photophobia)",
      "Confirms vision is not affected",
      "Does not escalate — simple conjunctivitis presentation",
      "Takes allergy history with reaction",
      "Asks about contact with sick person",
      "Completes holistic close",
    ],
  },
  {
    id: "B16",
    title: "Adult 52M Gout Attack",
    red_flag: false,
    patient_turns: [
      "My big toe is killing me. It's red and swollen and I can't put weight on it.",
      "It came on suddenly last night. I woke up in agony.",
      "The right big toe. It's very red and warm to touch.",
      "About 9 out of 10 for pain.",
      "I've had this before — about a year ago.",
      "I take allopurinol. 300mg once a day. For about a year.",
      "I drink quite a bit. Maybe 5 or 6 beers most days.",
      "I had a braai this weekend — lots of red meat.",
      "No allergies.",
      "I smoke 15 cigarettes a day.",
      "My father also had gout.",
    ],
    expected_behaviors: [
      "Explores joint pain (location, onset, character, severity)",
      "Asks about previous similar episodes",
      "Takes full medication history with dose",
      "Asks about alcohol use and quantifies it",
      "Asks about dietary triggers",
      "Takes family history",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B17",
    title: "Adult 49F Hypertensive Headache (Non-thunderclap)",
    red_flag: false,
    patient_turns: [
      "I have a headache. I know my blood pressure gets high sometimes.",
      "It built up slowly over the past 2 hours. Not sudden at all.",
      "It's at the back of my head and neck.",
      "Dull and pressure-like. About 6 out of 10.",
      "No flashing lights. My vision is fine.",
      "No vomiting. No stiff neck.",
      "I've had this type of headache before when my BP was high.",
      "I take amlodipine 5mg once a day. I've been on it for 3 years.",
      "I forgot to take it this morning.",
      "No allergies.",
    ],
    expected_behaviors: [
      "Asks thunderclap onset question FIRST before any other headache questions",
      "Patient confirms gradual onset — does NOT escalate",
      "Explores headache chain (location, character, severity, visual symptoms, neck stiffness)",
      "Asks about medication compliance",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "B18",
    title: "Paeds 5yr First Wheeze (Father for Liam)",
    red_flag: false,
    patient_turns: [
      "My son Liam is wheezing. This has never happened before.",
      "He's 5 years and 8 months. About 20 kilograms.",
      "It started this morning after he was playing outside.",
      "He has a tight chest and I can hear the wheeze when he breathes out.",
      "He can still talk normally. He's not too distressed.",
      "No fever. He had a cold last week.",
      "We have a dog at home. And it was very windy today.",
      "He's never had asthma. But I have asthma.",
      "His vaccinations are up to date.",
      "I haven't given him any medicines.",
      "No allergies that I know of.",
    ],
    expected_behaviors: [
      "Addresses father warmly, asks exact age in years and months",
      "Assesses wheeze severity — child can speak normally, not severe, does not escalate",
      "Asks about triggers (exercise, cold virus, animals, wind/pollen)",
      "Asks about family history of asthma or allergies",
      "Asks about recent illness as trigger",
      "Takes vaccination and allergy history",
      "Completes holistic close",
    ],
  },
  {
    id: "B19",
    title: "Adolescent 17M Musculoskeletal Chest Pain",
    red_flag: false,
    patient_turns: [
      "I have chest pain and my mom made me come. She's worried about my heart.",
      "It's on the left side. It's been there for 3 days.",
      "It's sharp. It gets worse when I press on it or take a deep breath.",
      "No, it doesn't go to my arm or jaw.",
      "No sweating. No nausea.",
      "I did a lot of push-ups 4 days ago — more than usual.",
      "The pain is there most of the time but worse when I move.",
      "I'm 17. No medical problems. I don't take any medicines.",
      "No allergies.",
      "I'm stressed about my matric exams.",
    ],
    expected_behaviors: [
      "Explores chest pain chain (location, character, radiation, associated symptoms)",
      "Confirms absence of acute cardiac red flags (no sweating, no arm/jaw pain, no nausea, reproducible on palpation)",
      "Does NOT escalate for musculoskeletal chest pain",
      "Identifies exertional trigger (push-ups) and positional worsening",
      "Screens for mental health — matric stress mentioned",
      "Completes holistic close",
    ],
  },
  {
    id: "B20",
    title: "Adult 28F Postnatal Depression",
    red_flag: false,
    patient_turns: [
      "I've been feeling very low since my baby was born 6 weeks ago.",
      "I feel like a bad mother. I can't bond with my baby.",
      "Yes, almost every day I feel sad and hopeless.",
      "I don't enjoy anything anymore. Not even the baby.",
      "I'm not sleeping well, even when the baby is sleeping.",
      "I feel guilty all the time. Like I'm failing.",
      "No, I haven't had any thoughts of hurting myself or the baby.",
      "My partner is supportive but he works long hours.",
      "I'm not on any medicines. No allergies.",
      "This is my first baby. The birth was fine.",
    ],
    expected_behaviors: [
      "Handles sensitive postnatal topic with warmth and no judgment",
      "Screens for postnatal depression (low mood, inability to bond, anhedonia, sleep, guilt)",
      "Asks directly about self-harm AND about thoughts of harming the baby (separate questions)",
      "Does not escalate — no plan confirmed",
      "Acknowledges social context and support",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
];

// ─── SCORING DIMENSIONS ──────────────────────────────────────────────────────
const SCORING_DIMENSIONS = [
  "single_question_rule",
  "no_jargon",
  "naturalness",
  "red_flag_handling",
  "clinical_completeness",
  "medication_doses",
  "age_appropriate",
  "allergy_environment",
  "holistic_close",
  "promised_followups_kept",
];

const PASS_THRESHOLD = 21; // out of 30

// ─── CLIENT ──────────────────────────────────────────────────────────────────
const client = new Anthropic();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDimension(dim) {
  return dim.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── CONVERSATION RUNNER ─────────────────────────────────────────────────────
async function runConversation(scenario) {
  const messages = [];
  const log = [];

  for (let i = 0; i < scenario.patient_turns.length; i++) {
    const patientText = scenario.patient_turns[i];

    // Add patient message
    messages.push({ role: "user", content: patientText });
    log.push({ role: "patient", content: patientText });

    // Get MedAI response
    const response = await client.messages.create({
      model: MEDAI_MODEL,
      max_tokens: 1024,
      system: MEDAI_SYSTEM_PROMPT,
      messages,
    });

    const aiText = response.content[0].text;
    messages.push({ role: "assistant", content: aiText });
    log.push({ role: "medai", content: aiText });

    // If history complete marker found, stop early
    if (aiText.includes("[HISTORY_COMPLETE]")) {
      break;
    }

    // If emergency escalation and it's a red flag scenario, we can stop after a couple more turns
    const escalationPhrase =
      "please stop what you're doing and go to the emergency room";
    if (
      scenario.red_flag &&
      aiText.toLowerCase().includes(escalationPhrase) &&
      i >= 3
    ) {
      // Let the conversation continue for remaining scripted turns to see follow-up
      // but don't force more turns than scripted
    }

    // Delay between API calls
    if (i < scenario.patient_turns.length - 1) {
      await sleep(600);
    }
  }

  return log;
}

// ─── SCORER ──────────────────────────────────────────────────────────────────
async function scoreConversation(scenario, conversationLog) {
  const conversationText = conversationLog
    .map(
      (turn) =>
        `${turn.role === "patient" ? "PATIENT" : "MEDAI"}: ${turn.content}`
    )
    .join("\n\n");

  const scoringPrompt = `You are an expert medical education evaluator assessing an AI medical history-taking assistant called MedAI.

SCENARIO: ${scenario.id} — ${scenario.title}
RED FLAG SCENARIO: ${scenario.red_flag ? "YES" : "NO"}

EXPECTED BEHAVIORS:
${scenario.expected_behaviors.map((b, i) => `${i + 1}. ${b}`).join("\n")}

CONVERSATION TO EVALUATE:
${conversationText}

Score MedAI on each of the following 10 dimensions. Each dimension is scored 0-3:
- 0 = Not done at all / completely failed
- 1 = Attempted but with significant problems
- 2 = Done reasonably well with minor issues
- 3 = Done excellently

DIMENSIONS:
1. single_question_rule: Did MedAI ask only ONE question per turn throughout the entire conversation?
2. no_jargon: Did MedAI avoid medical jargon and use plain patient-friendly language?
3. naturalness: Were responses warm, empathetic, and conversational (not robotic or form-filling)?
4. red_flag_handling: ${scenario.red_flag ? "Did MedAI correctly identify the emergency and use the exact escalation phrase? (critical dimension)" : "Did MedAI correctly note this was not an emergency and continue appropriately?"}
5. clinical_completeness: Did MedAI cover the essential clinical questions for this presenting complaint?
6. medication_doses: When medications were mentioned, did MedAI ask about dose, frequency, and duration?
7. age_appropriate: Was the approach appropriate for the patient's age group (paeds, neonate, elderly, adolescent, adult)?
8. allergy_environment: Did MedAI ask about allergies and relevant environmental/social factors?
9. holistic_close: Did MedAI ask about sleep, emotional wellbeing, and exercise before ending?
10. promised_followups_kept: If MedAI promised to return to a topic, did it actually do so?

Respond with ONLY valid JSON in exactly this format:
{
  "scores": {
    "single_question_rule": <0-3>,
    "no_jargon": <0-3>,
    "naturalness": <0-3>,
    "red_flag_handling": <0-3>,
    "clinical_completeness": <0-3>,
    "medication_doses": <0-3>,
    "age_appropriate": <0-3>,
    "allergy_environment": <0-3>,
    "holistic_close": <0-3>,
    "promised_followups_kept": <0-3>
  },
  "overall_score": <0-30>,
  "passed": <true|false>,
  "critical_failures": [<list of serious failures, empty array if none>],
  "missed_items": [<list of important items MedAI failed to ask, empty if none>],
  "strengths": [<list of things MedAI did particularly well>],
  "summary": "<2-3 sentence overall assessment>"
}`;

  const response = await client.messages.create({
    model: SCORER_MODEL,
    max_tokens: 1500,
    temperature: 0,
    messages: [{ role: "user", content: scoringPrompt }],
  });

  const rawText = response.content[0].text.trim();

  // Extract JSON (handle markdown code blocks)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Scorer returned non-JSON response: ${rawText}`);
  }

  const result = JSON.parse(jsonMatch[0]);

  // Recalculate overall_score from scores to ensure consistency
  const calculatedTotal = SCORING_DIMENSIONS.reduce(
    (sum, dim) => sum + (result.scores[dim] || 0),
    0
  );
  result.overall_score = calculatedTotal;
  result.passed = calculatedTotal >= PASS_THRESHOLD;

  return result;
}

// ─── PRINT PROGRESS ──────────────────────────────────────────────────────────
function printScenarioResult(scenario, evalResult) {
  const passedStr = evalResult.passed
    ? pass("PASS")
    : fail("FAIL");

  const totalStr = score(`${evalResult.overall_score}/30`);

  console.log(
    `  ${passedStr}  ${bold(scenario.id)} ${scenario.title}  ${totalStr}`
  );

  // Print per-dimension scores
  const dimScores = SCORING_DIMENSIONS.map((dim) => {
    const s = evalResult.scores[dim] ?? 0;
    const coloured =
      s === 3
        ? pass(`${s}`)
        : s === 2
        ? info(`${s}`)
        : s === 1
        ? score(`${s}`)
        : fail(`${s}`);
    return `    ${formatDimension(dim)}: ${coloured}/3`;
  });
  console.log(dimScores.join("\n"));

  if (evalResult.critical_failures && evalResult.critical_failures.length > 0) {
    console.log(
      `    ${fail("Critical failures:")} ${evalResult.critical_failures.join("; ")}`
    );
  }
  if (evalResult.strengths && evalResult.strengths.length > 0) {
    console.log(
      `    ${pass("Strengths:")} ${evalResult.strengths.slice(0, 2).join("; ")}`
    );
  }
  console.log(
    `    ${C.grey}${evalResult.summary || ""}${C.reset}`
  );
  console.log();
}

// ─── SUMMARY TABLE ───────────────────────────────────────────────────────────
function printSummaryTable(results) {
  console.log(bold("\n════════════════════════════════════════════════════"));
  console.log(bold("  EVALUATION SUMMARY"));
  console.log(bold("════════════════════════════════════════════════════\n"));

  const passed = results.filter((r) => r.evalResult.passed).length;
  const total = results.length;
  const avgScore =
    results.reduce((sum, r) => sum + r.evalResult.overall_score, 0) / total;

  const overallPass = passed >= Math.ceil(total * 0.7);

  console.log(
    `  Scenarios passed: ${passed >= Math.ceil(total * 0.7) ? pass(`${passed}/${total}`) : fail(`${passed}/${total}`)}`
  );
  console.log(
    `  Average score: ${score(avgScore.toFixed(1))}/30 (threshold: ${PASS_THRESHOLD})`
  );
  console.log(
    `  Overall result: ${overallPass ? pass("PASS") : fail("FAIL")}\n`
  );

  console.log(bold("  Per-scenario results:"));
  for (const r of results) {
    const icon = r.evalResult.passed ? pass("✓") : fail("✗");
    const scenScore = score(`${r.evalResult.overall_score}/30`);
    const redFlagTag = r.scenario.red_flag
      ? ` ${C.magenta}[red-flag]${C.reset}`
      : "";
    console.log(
      `  ${icon} ${r.scenario.id} ${r.scenario.title}${redFlagTag} — ${scenScore}`
    );
  }

  // Per-dimension averages
  console.log(bold("\n  Dimension averages:"));
  for (const dim of SCORING_DIMENSIONS) {
    const avg =
      results.reduce((sum, r) => sum + (r.evalResult.scores[dim] || 0), 0) /
      total;
    const bar = "█".repeat(Math.round(avg)) + "░".repeat(3 - Math.round(avg));
    const avgColoured =
      avg >= 2.5
        ? pass(avg.toFixed(1))
        : avg >= 1.5
        ? info(avg.toFixed(1))
        : fail(avg.toFixed(1));
    console.log(`  ${formatDimension(dim).padEnd(28)} ${bar} ${avgColoured}/3`);
  }
  console.log();
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(bold(info("\n════════════════════════════════════════════════════")));
  console.log(bold(info("  MedAI Comprehensive Patient Simulation Evaluation")));
  console.log(bold(info("════════════════════════════════════════════════════")));
  console.log(
    `  MedAI: ${MEDAI_MODEL} | Scorer: ${SCORER_MODEL} | Scenarios: ${SCENARIOS.length} | Pass threshold: ${PASS_THRESHOLD}/30\n`
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      fail("ERROR: ANTHROPIC_API_KEY environment variable is not set.")
    );
    process.exit(1);
  }

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i];
    const scenarioStart = Date.now();

    console.log(
      `${C.grey}[${i + 1}/${SCENARIOS.length}]${C.reset} Running ${bold(scenario.id)}: ${scenario.title}${scenario.red_flag ? ` ${C.magenta}[RED FLAG]${C.reset}` : ""}...`
    );

    let conversationLog = [];
    let evalResult = null;
    let error = null;

    try {
      conversationLog = await runConversation(scenario);
      await sleep(600);
      evalResult = await scoreConversation(scenario, conversationLog);
    } catch (err) {
      error = err.message || String(err);
      console.error(`  ${fail("ERROR:")} ${error}`);
      // Create a failed result
      evalResult = {
        scores: Object.fromEntries(SCORING_DIMENSIONS.map((d) => [d, 0])),
        overall_score: 0,
        passed: false,
        critical_failures: [`Evaluation error: ${error}`],
        missed_items: [],
        strengths: [],
        summary: `Error during evaluation: ${error}`,
      };
    }

    const elapsed = ((Date.now() - scenarioStart) / 1000).toFixed(1);

    results.push({
      scenario,
      conversationLog,
      evalResult,
      error,
      elapsed_seconds: parseFloat(elapsed),
    });

    printScenarioResult(scenario, evalResult);

    // Delay between scenarios (except last)
    if (i < SCENARIOS.length - 1) {
      await sleep(600);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);

  printSummaryTable(results);

  // ─── SAVE RESULTS ──────────────────────────────────────────────────────────
  const outputPath = join(__dirname, "eval-results-round6.json");

  const output = {
    metadata: {
      run_date: new Date().toISOString(),
      model: MEDAI_MODEL,
      scorer_model: SCORER_MODEL,
      total_scenarios: SCENARIOS.length,
      pass_threshold: PASS_THRESHOLD,
      pass_threshold_percentage: "70%",
      total_elapsed_seconds: parseFloat(totalElapsed),
    },
    summary: {
      passed: results.filter((r) => r.evalResult.passed).length,
      failed: results.filter((r) => !r.evalResult.passed).length,
      average_score:
        results.reduce((sum, r) => sum + r.evalResult.overall_score, 0) /
        results.length,
      overall_pass:
        results.filter((r) => r.evalResult.passed).length >=
        Math.ceil(results.length * 0.7),
    },
    dimension_averages: Object.fromEntries(
      SCORING_DIMENSIONS.map((dim) => [
        dim,
        results.reduce((sum, r) => sum + (r.evalResult.scores[dim] || 0), 0) /
          results.length,
      ])
    ),
    scenarios: results.map((r) => ({
      id: r.scenario.id,
      title: r.scenario.title,
      red_flag: r.scenario.red_flag,
      elapsed_seconds: r.elapsed_seconds,
      error: r.error || null,
      eval: r.evalResult,
      conversation: r.conversationLog,
    })),
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log(
    `${pass("Results saved:")} ${outputPath}`
  );
  console.log(
    `${C.grey}Total time: ${totalElapsed}s${C.reset}\n`
  );
}

main().catch((err) => {
  console.error(fail(`Fatal error: ${err.message || err}`));
  process.exit(1);
});
