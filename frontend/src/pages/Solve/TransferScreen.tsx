import { useTranslation } from 'react-i18next'
import { Confetti } from '../../components/Confetti'

interface Props {
  structure: string
  solvedCount: number
  onNext: () => void
  onDone: () => void
}

/** Shown after a solved problem: same maths structure, new story. */
export function TransferScreen({ structure, solvedCount, onNext, onDone }: Props) {
  const { t } = useTranslation()
  return (
    <>
      <Confetti duration={3500} />
      <div className="card space-y-5 py-8 text-center" data-testid="transfer">
        <p className="text-6xl animate-bounce" aria-hidden="true">
          🌟
        </p>
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-ink" data-testid="transfer-title">
            {t('transfer.title')}
          </h2>
          <p className="text-ink/70">{t('transfer.subtitle')}</p>
        </div>
        <div className="rounded-2xl bg-brand-light/60 border border-brand/20 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/70">{t('transfer.structure')}</p>
          <p className="text-xl font-extrabold text-brand-dark">
            {t(`structures.${structure}`, { defaultValue: structure.replace(/_/g, ' ') })}
          </p>
        </div>
        <p className="text-sm font-semibold text-ink/80">{t('transfer.count', { count: solvedCount })}</p>
        <div className="space-y-3 pt-2">
          <button type="button" className="btn-primary" data-testid="next-story-button" onClick={onNext}>
            {t('transfer.button')} →
          </button>
          <button type="button" className="btn-secondary" data-testid="done-button" onClick={onDone}>
            {t('transfer.done')}
          </button>
        </div>
      </div>
    </>
  )
}
