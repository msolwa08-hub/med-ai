export type SALanguageCode = 'en' | 'zu' | 'xh' | 'af' | 'nso' | 'tn' | 'st' | 'ts' | 'ss' | 've' | 'nr';

export interface Language {
  code: SALanguageCode;
  name: string;
  nativeName: string;
  region?: string;
}

export const SA_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', region: 'KwaZulu-Natal' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', region: 'Eastern Cape, Western Cape' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'nso', name: 'Sepedi', nativeName: 'Sepedi', region: 'Limpopo' },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana', region: 'North West, Northern Cape' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', region: 'Free State' },
  { code: 'ts', name: 'Xitsonga', nativeName: 'Xitsonga', region: 'Limpopo, Mpumalanga' },
  { code: 'ss', name: 'Siswati', nativeName: 'Siswati', region: 'Mpumalanga' },
  { code: 've', name: 'Tshivenda', nativeName: 'Tshivenda', region: 'Limpopo' },
  { code: 'nr', name: 'isiNdebele', nativeName: 'isiNdebele', region: 'Mpumalanga, Limpopo' },
];
