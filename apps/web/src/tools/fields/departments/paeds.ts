import type { DeptFieldFragments } from '../types';

export const paedsFields: DeptFieldFragments = {
  intake: d => [
    { key: 'weight', label: 'Weight (kg)', value: d.weight ?? '', placeholder: 'kg' },
    { key: 'immunisations', label: 'Immunisations', value: d.immunisations ?? '', placeholder: 'Up to date / Behind / Unknown' },
    { key: 'birthHistory', label: 'Birth History', value: d.birthHistory ?? '', placeholder: 'Term/preterm, mode of delivery' },
    { key: 'caregiver', label: 'Caregiver', value: d.caregiver ?? '', placeholder: 'Parent/guardian name' },
  ],

  history: {
    insertAt: 2,
    fields: (d, subDept) => {
      if (subDept === 'neonatal') {
        return [
          { key: 'birthDetails', label: 'Birth Details', value: d.birthDetails ?? '', kind: 'textarea', hint: 'gestation at birth, mode of delivery, birth weight, APGAR scores', placeholder: 'GA at birth, delivery mode, birth weight, APGAR 1/5min' },
          { key: 'feeding', label: 'Feeding', value: d.feeding ?? '', kind: 'textarea', hint: 'breast/formula/NG, volumes, tolerance', placeholder: 'Feed type, volumes, tolerance' },
        ];
      }
      return [
        { key: 'development', label: 'Development', value: d.development ?? '', kind: 'textarea', hint: 'milestones appropriate for age?', placeholder: 'Gross motor, fine motor, language, social — for age' },
        { key: 'feeding', label: 'Feeding / Nutrition', value: d.feeding ?? '', kind: 'textarea', hint: 'breast/formula/solids, appetite', placeholder: 'Feeding pattern, appetite, recent changes' },
      ];
    },
  },

  assessment: {
    insertAt: 3,
    fields: (d, subDept) => {
      if (subDept === 'neonatal') {
        return [
          { key: 'growth', label: 'Growth Parameters', value: d.growth ?? '', hint: 'weight, length, head circumference with centiles', placeholder: 'Weight/length/HC + centiles' },
          { key: 'jaundice', label: 'Jaundice', value: d.jaundice ?? '', hint: 'visible extent, transcutaneous/serum bilirubin, phototherapy', placeholder: 'e.g. jaundiced to trunk, TcB 220, on phototherapy' },
          { key: 'hydration', label: 'Hydration Status', value: d.hydration ?? '', hint: 'fontanelle, turgor, mucous membranes, cap refill', placeholder: 'Hydration assessment findings' },
        ];
      }
      return [
        { key: 'growth', label: 'Growth Parameters', value: d.growth ?? '', hint: 'weight, height, head circumference with centiles; MUAC', placeholder: 'Weight/height/HC + centiles, MUAC' },
        { key: 'hydration', label: 'Hydration Status', value: d.hydration ?? '', hint: 'fontanelle, turgor, mucous membranes, cap refill', placeholder: 'Hydration assessment findings' },
      ];
    },
  },
};
