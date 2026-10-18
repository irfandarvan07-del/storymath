import { useTranslation } from 'react-i18next'

export function LoadingState() {
  const { t } = useTranslation()
  return (
    <div className="card flex flex-col items-center gap-4 py-10 text-center" role="status" data-testid="loading">
      <span className="h-12 w-12 animate-spin rounded-full border-8 border-brand-light border-t-brand" aria-hidden="true" />
      <p className="text-lg font-bold">{t('common.loading')}</p>
    </div>
  )
}

export function ErrorState({ kind, onRetry }: { kind: 'offline' | 'generic' | null; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="card space-y-4 py-8 text-center" role="alert" data-testid="error-state">
      <p className="text-4xl" aria-hidden="true">
        😕
      </p>
      <h2 className="text-xl font-extrabold">{t('error.title')}</h2>
      <p>{kind === 'offline' ? t('error.offline') : t('error.generic')}</p>
      <button type="button" className="btn-primary" onClick={onRetry} data-testid="retry-button">
        {t('common.retry')}
      </button>
    </div>
  )
}
