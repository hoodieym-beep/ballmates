import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from '../constants/en.json';
import ar from '../constants/ar.json';

const i18n = new I18n({ en, ar });
i18n.locale = Localization.getLocales()[0]?.languageTag?.slice(0, 2) || 'en';
i18n.enableFallback = true;

export function setLocale(locale) {
  i18n.locale = locale;
}

export function t(key) {
  return i18n.t(key);
}

export default i18n;
