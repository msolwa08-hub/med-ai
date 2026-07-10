# Surgery + Emergency — implementation record (M2)

Dossiers → app registries, 2026-07-10. **Clinical content below is pending your
review** — flag anything and it's a one-line edit per item. Doses are drawn from
the dossiers + SA STG/EML; the flagged items are where the dossier didn't give a
verbatim number and an agent instantiated a reasonable value.

## Loop gate (live)
- **Surgery 100/100** — appendicitis (US+markers), perforation (erect CXR free
  air), SBO (CT transition point), cholecystitis (US+Murphy). ~8.8c/loop.
- **Emergency 100/100** — SAH (CT), ischaemic stroke (CT excludes bleed),
  paracetamol (timed level), septic shock (lactate+source). ~8.5c/loop.
Reports in `../eval/m2/loop-{surgery,emergency}-2026-07-10.json`.

## Surgery

**Fields** (`fields/departments/surgery.ts`): Pain evolution/migration (site +
migration + sequence; βhCG on every reproductive-age woman); Anticoagulants +
exact last dose (drives operative/neuraxial timing); Last oral intake (6h solid
/ 2h clear, assume full stomach in emergencies); Operation performed + Post-op
day (the 5 Ws: day 0-2 wind, 3-5 water/walking, 5-7+ wound/anastomotic leak).
*Shared surgical fragment now inserts after PMH — also affects Ortho (judgment
call).*

**Treatment sets** (STG doses, each line + a why):
- **Acute appendicitis**: NPO; Ringer's/saline ± bolus; morphine 0.05-0.1mg/kg
  IV (or tramadol 50-100mg) + paracetamol 1g; **cefazolin 1g IV 8h +
  metronidazole 500mg IV 8h**; βhCG; consent + theatre; appendix mass →
  conservative (off by default).
- **Bowel obstruction (drip & suck)**: NGT 16-18Fr 4h aspirate; Ringer's/saline
  deficit-then-losses; replace K+ once passing urine; catheter ≥0.5ml/kg/h;
  morphine + metoclopramide; examine hernial orifices + PR; surgical review +
  re-examine 4-6h; gastrografin at 24h (off by default).
- **Perforated viscus / peritonitis**: resus + morphine; NG + catheter;
  ⚠ **ampicillin 1g IV 6h + gentamicin 6mg/kg IV daily + metronidazole 500mg IV
  8h** (SA triple therapy — *check gentamicin dose/renal caveats against your STG
  edition*); fluconazole if upper-GI perf (off); PPI if peptic; erect CXR (free
  air absence doesn't exclude); exclude medical mimics; urgent theatre.
- **Acute cholecystitis**: NPO + fluids; morphine (± diclofenac 75mg);
  **amoxicillin-clavulanate 1.2g IV 8h** (or cefazolin+metronidazole); LFTs + US;
  early lap chole <72h; ERCP/PTC if cholangitis (off).
- **Peri-op VTE + analgesia ladder**: documented VTE risk; **enoxaparin 40mg SC
  daily** (12h clear of neuraxial); TEDS + IPC; early mobilisation; regular
  paracetamol 1g 6h + diclofenac 75mg 12h (if no renal/bleed/anastomosis);
  breakthrough morphine 2.5-5mg IV 2-4h or tramadol; ondansetron 4mg 8h prn;
  ileus beyond day 5 = leak (off).

**Smart blocks**: post-op review (day, wound, drains, bowels, mobilising, VTE
given, HR trend); anticoagulation/bridging (agent, indication, last dose, INR,
restart plan).

**Investigation panel** `abdo` (surgery/emergency/ICU): amylase, lipase, group &
crossmatch. Amylase ≥300 (3× ULN) → pancreatitis alert (⚠ ULN varies by assay).

## Emergency

**Fields** (`fields/departments/emergency.ts`): Triage category (SATS — higher of
TEWS band or discriminator; re-triage in the queue); Time of onset/mechanism (the
ED clock: STEMI <30min, thrombolysis <4.5h, sepsis abx <1h); Pre-hospital
treatment + resuscitation status.

**Treatment sets**:
- **Major haemorrhage / MTP**: external control first (pressure/tourniquet/pelvic
  binder); activate MTP (ABC ≥2 / shock index >1); **TXA 1g IV over 10min then 1g
  over 8h** (within 3h); balanced 1:1:1; permissive hypotension (SBP ~90/radial);
  **calcium chloride 10ml 10%** (or gluconate 20ml) ~every 4 units; keep warm;
  serial lactate/base deficit + Hb.
- **Organophosphate poisoning**: PPE + decontaminate BEFORE contact; **atropine
  2mg IV, double every ~5min to atropinisation**, then infusion; **pralidoxime
  1-2g IV over 15-30min then 10-20mg/kg/h**; diazepam 10mg IV for seizures;
  airway early, avoid suxamethonium; watch intermediate syndrome 24-96h.
- **Paracetamol overdose (NAC)**: level at 4h (or now if late/staggered);
  Rumack-Matthew (150mg/L at 4h); charcoal 1g/kg <1h (off); **NAC 3-bag 150mg/kg
  /1h → 50mg/kg/4h → 100mg/kg/16h**; empirical NAC if >8h; LFTs/INR/creat/
  glucose/VBG; self-harm risk assessment before discharge.
- **Empirical bacterial meningitis**: **ceftriaxone 2g IV stat then 2g 12-24h**
  within the hour, don't delay for LP/CT; **dexamethasone 10mg IV** with/just
  before first dose then 6h ×4 days; TB/crypto cover + CrAg if HIV+/subacute;
  aciclovir if encephalitis not excluded (off); CT-before-LP only if focal/
  ↓GCS/immunocompromised; LP panel; isolate + notify + contact prophylaxis.
  *(anaphylaxis, status epilepticus, sepsis-6 already existed — not duplicated.)*

**Smart blocks**: SATS/TEWS triage (TEWS total, colour, discriminator override,
AVPU, re-triaged); GCS (E/V/M with point values, total, pupils, airway if ≤8).

**Investigation panel** `tox` (emergency/medicine/ICU): paracetamol (⚠ ≥150mg/L →
NAC, meaningless without ingestion time), salicylate (>50mg/dL severe — *check
your assay units*). Lactate ≥4 → RED hypoperfusion.

## AI discipline lenses (`tools-assist.ts`)
Both enriched to the Medicine standard: Surgery (the 4-question model, trends-
not-snapshots, tachycardia-first, hernial orifices + PR, source control) and
Emergency (ABCDE on a clock, actively exclude the mimicking killers, occult
compensated shock, glucose/βhCG/lactate reflexes, SA trauma + HIV/TB overlay).

## Items explicitly flagged for your sign-off
1. Perforated-viscus antibiotic regimen (ampicillin + gentamicin + metronidazole)
   — gentamicin dose/renal caveat vs your STG edition.
2. Numeric cutoffs: salicylate 50mg/dL, amylase 300 U/L — assay/lab dependent.
3. Shared surgical fields fragment `insertAt` moved to after PMH — also reorders
   Orthopaedics fields.
