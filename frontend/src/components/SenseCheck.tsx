import { useTranslation } from 'react-i18next'

interface Props {
  /** `sense_check_prompt` from the problem */
  prompt: string
  onChoose: (direction: 'bigger' | 'smaller') => void
  disabled?: boolean
}

/** Step "sense_check": the prompt and two big answers. Tapping one submits it. */
export function SenseCheck({ prompt, onChoose, disabled }: Props) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <p className="card text-xl font-bold" data-testid="sense-prompt">
        {prompt}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          data-testid="sense-bigger"
          disabled={disabled}
          onClick={() => onChoose('bigger')}
          className="btn-secondary min-h-[88px] flex-col text-xl"
        >
          <span className="text-3xl leading-none" aria-hidden="true">
            ↑
          </span>
          {t('sense.bigger')}
        </button>
        <button
          type="button"
          data-testid="sense-smaller"
          disabled={disabled}
          onClick={() => onChoose('smaller')}
          className="btn-secondary min-h-[88px] flex-col text-xl"
        >
          <span className="text-3xl leading-none" aria-hidden="true">
            ↓
          </span>
          {t('sense.smaller')}
        </button>
      </div>
    </div>
  )
}
