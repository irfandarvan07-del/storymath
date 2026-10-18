import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from '../i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  return (
    <select
      aria-label={t('common.language')}
      value={i18n.language}
      onChange={(e) => setLanguage(e.target.value)}
      className="min-h-[44px] rounded-xl border-2 border-ink/15 bg-white px-2 text-sm font-bold"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}
