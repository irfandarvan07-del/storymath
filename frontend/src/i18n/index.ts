import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import hi from './hi.json'
import kn from './kn.json'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const

const saved = (() => {
  try {
    return localStorage.getItem('sm_lang')
  } catch {
    return null
  }
})()

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, kn: { translation: kn } },
  lng: saved ?? 'en',
  // Hindi/Kannada stubs are empty, so anything missing falls back to English.
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function setLanguage(code: string) {
  void i18n.changeLanguage(code)
  document.documentElement.lang = code
  try {
    localStorage.setItem('sm_lang', code)
  } catch {
    /* ignore */
  }
}

export default i18n
