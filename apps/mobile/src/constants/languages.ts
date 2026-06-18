export interface SALanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export const SA_LANGUAGES: SALanguage[] = [
  { code: 'zu', name: 'isiZulu', nativeName: 'isiZulu', flag: '🇿🇦', rtl: false },
  { code: 'xh', name: 'isiXhosa', nativeName: 'isiXhosa', flag: '🇿🇦', rtl: false },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', rtl: false },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
  { code: 'nso', name: 'Sepedi', nativeName: 'Sepedi', flag: '🇿🇦', rtl: false },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana', flag: '🇿🇦', rtl: false },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇿🇦', rtl: false },
  { code: 'ts', name: 'Xitsonga', nativeName: 'Xitsonga', flag: '🇿🇦', rtl: false },
  { code: 'ss', name: 'siSwati', nativeName: 'siSwati', flag: '🇿🇦', rtl: false },
  { code: 've', name: 'Tshivenda', nativeName: 'Tshivenḓa', flag: '🇿🇦', rtl: false },
  { code: 'nr', name: 'isiNdebele', nativeName: 'isiNdebele', flag: '🇿🇦', rtl: false },
];

export const LANGUAGE_GREETINGS: Record<string, string> = {
  zu: 'Sawubona! Ngingakusiza kanjani namuhla?',
  xh: 'Molo! Ndingakunceda njani namhlanje?',
  af: 'Hallo! Hoe kan ek u vandag help?',
  en: 'Hello! How can I help you today?',
  nso: 'Dumela! Ke ka moo ke ka go thuša bjang lehono?',
  tn: 'Dumela! Ke ka jang go go thusa gompieno?',
  st: 'Dumela! Ke ka ho o thusa joang kajeno?',
  ts: 'Ahee! Ndzi nga ku pfuna njhani namuntlha?',
  ss: 'Sawubona! Ngingakusita njani namuhla?',
  ve: 'Ndaa! Ndi nga ni thusa hani nngo?',
  nr: 'Lotjhani! Ngingakusiza njani namhlanje?',
};
