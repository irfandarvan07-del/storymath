import { useTranslation } from 'react-i18next'
import type { Step } from '../api/types'

interface Props {
  /** only the steps listed in the problem's `steps_enabled` */
  steps: Step[]
  currentIndex: number
}

export function StepProgress({ steps, currentIndex }: Props) {
  const { t } = useTranslation()
  return (
    <ol className="flex items-start justify-between gap-1" aria-label="Progress" data-testid="step-progress">
      {steps.map((s, i) => {
        const done = i < currentIndex
        const current = i === currentIndex
        return (
          <li
            key={s}
            className="flex flex-1 flex-col items-center gap-1"
            aria-current={current ? 'step' : undefined}
            data-testid={`progress-${s}`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-extrabold ${
                done ? 'bg-given text-white' : current ? 'bg-brand text-white ring-4 ring-brand-light' : 'bg-ink/10 text-ink/60'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className={`text-center text-[11px] leading-tight ${current ? 'font-bold' : 'text-ink/70'}`}>
              {t(`steps.${s}`)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
