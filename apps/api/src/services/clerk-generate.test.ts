import { describe, it, expect } from 'vitest';
import { groundingBlock } from './clerk-generate.js';

describe('groundingBlock — STG grounding for the free-text differential generator', () => {
  it('grounds a differential that matches an STG condition, with real sourced dosing', () => {
    const out = groundingBlock([{ id: 'cap', name: 'Community-acquired pneumonia' }]);
    expect(out).toContain('REFERENCE — matching South African STG entries');
    expect(out).toContain('Community-Acquired Pneumonia (J18.9)');
    expect(out).toContain('Amoxicillin');
  });

  it('matches on a shorter differential name that is a substring of the full STG condition', () => {
    const out = groundingBlock([{ id: 'acs', name: 'Acute coronary syndrome' }]);
    expect(out).toContain('Acute Coronary Syndrome (ACS) / Myocardial Infarction');
  });

  it('grounds multiple different differentials in one call, each cited once', () => {
    const out = groundingBlock([
      { id: 'aki', name: 'Acute kidney injury' },
      { id: 'men', name: 'Meningitis' },
    ]);
    expect(out).toContain('Acute Kidney Injury');
    expect(out).toContain('Meningitis (Bacterial/Cryptococcal)');
  });

  it('dedupes when two differentials resolve to the same STG entry', () => {
    const out = groundingBlock([
      { id: 'a', name: 'Acute coronary syndrome' },
      { id: 'b', name: 'Myocardial infarction' },
    ]);
    const occurrences = out.split('I21.9').length - 1;
    expect(occurrences).toBe(1);
  });

  it('returns nothing (never blocks planning) when no differential matches the STG dataset', () => {
    const out = groundingBlock([{ id: 'x', name: 'Some invented condition not in any guideline' }]);
    expect(out).toBe('');
  });

  it('returns nothing for an empty differential list', () => {
    expect(groundingBlock([])).toBe('');
  });

  it('a differential name with extra qualifiers beyond the STG wording fails to match — known limitation', () => {
    // Documents a real gap: the lookup is substring-only, so a longer/more
    // specific model-generated name than the STG condition string won't hit.
    const out = groundingBlock([{ id: 'cap', name: 'Community-acquired pneumonia (CAP), moderate severity' }]);
    expect(out).toBe('');
  });
});
