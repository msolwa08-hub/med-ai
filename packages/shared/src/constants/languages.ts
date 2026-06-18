import type { SALanguageCode } from '../types/language.types.js';

export interface LanguageInfo {
  code: SALanguageCode;
  name: string;
  nativeName: string;
  region: string;
  speakersMillions: number;
  greeting: string;
}

export const LANGUAGE_INFO: Record<SALanguageCode, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'Nationwide',
    speakersMillions: 4.9,
    greeting: 'Hello! I am your AI medical assistant.',
  },
  zu: {
    code: 'zu',
    name: 'Zulu',
    nativeName: 'isiZulu',
    region: 'KwaZulu-Natal',
    speakersMillions: 12.1,
    greeting: 'Sawubona! Ngingumsizi wakho wezempilo we-AI.',
  },
  xh: {
    code: 'xh',
    name: 'Xhosa',
    nativeName: 'isiXhosa',
    region: 'Eastern Cape, Western Cape',
    speakersMillions: 8.2,
    greeting: 'Molo! NdinguMncedisi wakho wezempilo we-AI.',
  },
  af: {
    code: 'af',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    region: 'Western Cape, Northern Cape',
    speakersMillions: 7.2,
    greeting: 'Hallo! Ek is jou KI mediese assistent.',
  },
  nso: {
    code: 'nso',
    name: 'Sepedi',
    nativeName: 'Sepedi',
    region: 'Limpopo',
    speakersMillions: 4.6,
    greeting: 'Dumela! Ke moswi wa gago wa bophelo wo o dirišago AI.',
  },
  tn: {
    code: 'tn',
    name: 'Setswana',
    nativeName: 'Setswana',
    region: 'North West, Northern Cape',
    speakersMillions: 4.1,
    greeting: 'Dumela! Ke motlhankedi wa gago wa boitekanelo wa AI.',
  },
  st: {
    code: 'st',
    name: 'Sesotho',
    nativeName: 'Sesotho',
    region: 'Free State',
    speakersMillions: 3.8,
    greeting: 'Dumela! Ke motsebi oa hao oa bophelo bo botle oa AI.',
  },
  ts: {
    code: 'ts',
    name: 'Xitsonga',
    nativeName: 'Xitsonga',
    region: 'Limpopo, Mpumalanga',
    speakersMillions: 2.3,
    greeting: 'Avuxeni! Ndzi mutirheli wa wena wa vulavulelo bya matirhelo ya vutshilo wa AI.',
  },
  ss: {
    code: 'ss',
    name: 'Siswati',
    nativeName: 'Siswati',
    region: 'Mpumalanga',
    speakersMillions: 1.3,
    greeting: 'Sawubona! NginguMsizi wakho weMpilo we-AI.',
  },
  ve: {
    code: 've',
    name: 'Tshivenda',
    nativeName: 'Tshivenda',
    region: 'Limpopo',
    speakersMillions: 1.2,
    greeting: 'Ndaa! Ndi mushumisudzani waṋu wa vhulamukanyi wa AI.',
  },
  nr: {
    code: 'nr',
    name: 'isiNdebele',
    nativeName: 'isiNdebele',
    region: 'Mpumalanga, Limpopo',
    speakersMillions: 1.1,
    greeting: 'Lotjhani! NginguMsizi wakho wezeMpilo we-AI.',
  },
};

export const ALL_LANGUAGE_CODES: SALanguageCode[] = Object.keys(LANGUAGE_INFO) as SALanguageCode[];
