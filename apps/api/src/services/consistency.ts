/**
 * Input-consistency / discrepancy detection — the "alarmed discrepancy" net.
 *
 * An overwhelmed intern types in the wrong place, puts data in the wrong area,
 * skips things, or enters facts that contradict each other. This deterministic
 * checker reads the clerking record and raises FLAG-AND-GUIDE discrepancies: it
 * never blocks, it points at what looks off and what to check. No AI — it must
 * be instant so it can run as the intern types, at the bedside.
 */

export interface Discrepancy {
  severity: 'alarm' | 'note';
  fields: string[];
  message: string;
}

export interface ConsistencyInput {
  record: Record<string, string | undefined>;
  subDept?: string;
  /** Injectable "now" for testing; defaults to the real date. */
  now?: Date;
}

const num = (s?: string): number | null => {
  if (!s) return null;
  const m = String(s).match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

// Gestational age in weeks from "33", "33+2", "33/40", "33 weeks 2 days".
function parseWeeks(s?: string): number | null {
  if (!s) return null;
  const m = String(s).match(/(\d{1,2})\s*(?:\+\s*(\d)|weeks?\s*(\d)\s*days?)?/i);
  if (!m) return null;
  const w = Number(m[1]);
  if (!Number.isFinite(w) || w < 0 || w > 45) return null;
  const d = Number(m[2] || m[3] || 0);
  return w + (Number.isFinite(d) ? d / 7 : 0);
}

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const t = String(s).trim();
  // dd/mm/yyyy or dd-mm-yyyy (SA convention) → normalise
  const dmy = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const [, d, mo, y] = dmy;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const dt = new Date(year, Number(mo) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(t);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const has = (s: string | undefined, re: RegExp) => !!s && re.test(s);

export function checkConsistency(input: ConsistencyInput): Discrepancy[] {
  const r = input.record || {};
  const now = input.now ?? new Date();
  const out: Discrepancy[] = [];

  const ga = parseWeeks(r.gestationalAge);
  const lmp = parseDate(r.lmp);
  const age = num(r.age);
  const gravida = num(r.gravida);
  const para = num(r.para);
  const sex = (r.sex || '').toLowerCase();
  // Scan the WHOLE record, not one field — an overwhelmed intern types things in
  // the wrong place, so a "not pregnant" note may land in the HPI, not the
  // pregnancy-status field. The net must catch the mistake wherever it is typed.
  const allText = Object.entries(r)
    .filter(([k]) => k !== 'name')
    .map(([, v]) => v || '')
    .join(' \n ')
    .toLowerCase();
  const preg = `${r.pregnancyStatus || ''} ${allText}`.toLowerCase();
  const complaintText = `${r.chiefComplaint || ''} ${r.hpi || ''} ${r.admissionDiagnosis || ''}`.toLowerCase();
  // Markers of a CURRENT pregnancy (LMP deliberately excluded — every woman has
  // an LMP, so it is not evidence of an ongoing pregnancy and would false-positive
  // rule 2 on a genuinely non-pregnant gynae patient).
  const currentPregMarkers = [r.gestationalAge, r.edd, r.fetalHeart, r.fetalMovements, r.contractions, r.sfh]
    .some((v) => v && v.trim());
  const anyPregInfo = [r.gestationalAge, r.lmp, r.edd, r.fetalHeart, r.fetalMovements, r.contractions, r.sfh, r.pregnancyStatus]
    .some((v) => v && v.trim());
  const deliveredMarkers = [r.modeOfDelivery, r.dayPostDelivery, r.lochia, r.perineumRepair, r.csWound]
    .some((v) => v && v.trim());

  // 1. GA vs LMP mismatch
  if (ga != null && lmp) {
    const weeksByLmp = (now.getTime() - lmp.getTime()) / (7 * 86400000);
    if (weeksByLmp > 0 && weeksByLmp < 46 && Math.abs(weeksByLmp - ga) > 3) {
      out.push({
        severity: 'alarm',
        fields: ['gestationalAge', 'lmp'],
        message: `Gestational age (${r.gestationalAge}) and LMP (${r.lmp}, ~${weeksByLmp.toFixed(0)} weeks) do not agree — recheck the dates or which is from scan.`,
      });
    }
  }

  // 2. "not pregnant" / negative test but CURRENT-pregnancy findings present
  //    (scanned across the whole record, so a misplaced note is still caught)
  if (/not pregnant|pregnancy test negative|hcg negative|not currently pregnant|cannot be pregnant/.test(preg) && currentPregMarkers) {
    out.push({
      severity: 'alarm',
      fields: ['pregnancyStatus', 'gestationalAge'],
      message: 'Recorded as not pregnant / test negative, but current-pregnancy findings (gestational age / fetal heart / movements) are present — confirm the pregnancy status and clear whichever is wrong.',
    });
  }

  // 3. Currently pregnant AND delivered/postnatal at once
  if (currentPregMarkers && deliveredMarkers && (r.fetalHeart || r.fetalMovements || r.contractions)) {
    out.push({
      severity: 'alarm',
      fields: ['gestationalAge', 'modeOfDelivery'],
      message: 'Both current-pregnancy findings (fetal heart / movements / contractions) and delivery findings are recorded — is this antenatal or postnatal? Clear the section that does not apply.',
    });
  }

  // 4. GA out of plausible range
  if (ga != null && (ga < 4 || ga > 43)) {
    out.push({ severity: 'note', fields: ['gestationalAge'], message: `Gestational age ${r.gestationalAge} is outside the usual range — recheck for a typo.` });
  }

  // 5. Gravida / para sanity
  if (gravida != null && para != null && gravida < para) {
    out.push({ severity: 'alarm', fields: ['gravida', 'para'], message: `Gravida (${gravida}) is less than para (${para}) — gravida counts every pregnancy and cannot be lower. Recheck.` });
  }
  if (para != null && age != null && para > Math.max(age - 11, 0)) {
    out.push({ severity: 'note', fields: ['para', 'age'], message: `Para ${para} looks high for age ${age} — confirm it is in the right field.` });
  }

  // 6. Reproductive-age female with acute abdomen/pelvic pain and NO pregnancy status
  const acutePain = /abdominal pain|pelvic pain|lower abdo|iliac fossa|rif|lif|adnexal/.test(complaintText);
  const pregnancyAssessed = anyPregInfo || /pregnan|hcg|\blmp\b|urine test|preg test/.test(preg);
  if (/^f/.test(sex) && age != null && age >= 12 && age <= 55 && acutePain && !pregnancyAssessed) {
    out.push({
      severity: 'alarm',
      fields: ['pregnancyStatus', 'chiefComplaint'],
      message: 'Reproductive-age woman with abdominal/pelvic pain and no pregnancy test recorded — exclude ectopic first: do a urine hCG.',
    });
  }

  // 7. Wrong area — obstetric findings on a gynae patient (or vice versa)
  if (input.subDept === 'gynae' && (r.fetalHeart || r.contractions || r.sfh || r.lieAndPresentation)) {
    out.push({ severity: 'note', fields: ['fetalHeart', 'contractions'], message: 'Obstetric findings (fetal heart / contractions / SFH) are filled on a gynae patient — confirm this is the right patient and section.' });
  }

  // 8. Implausible vitals (likely mistyped / misplaced)
  const bp = (r.vitals || r.bpTrend || '').match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (bp) {
    const sys = Number(bp[1]), dia = Number(bp[2]);
    if (sys < 50 || sys > 300 || dia < 20 || dia > 200 || dia >= sys) {
      out.push({ severity: 'note', fields: ['vitals'], message: `Blood pressure ${bp[0]} looks implausible — recheck for a typo or a swapped systolic/diastolic.` });
    }
  }

  // 9. Allergies field holds what looks like a prescription (misplacement)
  if (has(r.allergies, /\b\d+\s*mg\b|\bbd\b|\btds\b|\bqid\b|\bnocte\b|\bstat\b/i) && !/allerg/i.test(r.allergies || '')) {
    out.push({ severity: 'note', fields: ['allergies'], message: 'The allergies field looks like it contains a medication/dose — is this meant to be in Medications?' });
  }

  return out;
}
