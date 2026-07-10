import type { DeptId } from '../../config/departments';
import type { DeptFieldFragments } from '../types';
import { surgeryFields } from './surgery';
import { medicineFields } from './medicine';
import { ogFields } from './og';
import { paedsFields } from './paeds';
import { icuFields } from './icu';
import { emergencyFields } from './emergency';
import { psychFields } from './psych';
import { orthoFields } from './ortho';

// Per-department field fragments, keyed by DeptId. Adding a future specialty
// (e.g. ENT) means creating one new file in this directory and registering it
// here — the base field builders never change. Departments without an entry
// just use the base fields.
export const DEPT_FIELD_FRAGMENTS: Partial<Record<DeptId, DeptFieldFragments>> = {
  medicine: medicineFields,
  surgery: surgeryFields,
  og: ogFields,
  paeds: paedsFields,
  icu: icuFields,
  emergency: emergencyFields,
  psych: psychFields,
  ortho: orthoFields,
};
