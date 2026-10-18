import { useTranslation } from 'react-i18next'

interface Props {
  value: string
  onChange: (value: string) => void
  onEnter: () => void
  disabled?: boolean
}

/** Step "calculation": a big numeric field. Digits and one decimal point only. */
export function CalculationInput({ value, onChange, onEnter, disabled }: Props) {
  const { t } = useTranslation()

  const sanitize = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '')
    const [head, ...rest] = cleaned.split('.')
    return (rest.length ? `${head}.${rest.join('')}` : head).slice(0, 8)
  }

  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-ink/70">{t('calculation.label')}</span>
      <input
        data-testid="calc-input"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        value={value}
        disabled={disabled}
        placeholder={t('calculation.placeholder')}
        onChange={(e) => onChange(sanitize(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter()
        }}
        className="min-h-[72px] w-full rounded-2xl border-4 border-ink/20 bg-white px-4 text-center text-4xl font-extrabold placeholder:text-base placeholder:font-normal focus:border-brand"
      />
    </label>
  )
}
