import type { ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { pendingCount, subscribe } from '../api/queue'
import { LanguageSwitcher } from './LanguageSwitcher'

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
}

interface Props {
  children: ReactNode
  studentCode?: string
  onLeave?: () => void
}

/** Mobile-first page frame: header, offline/sync status, content column. */
export function AppShell({ children, studentCode, onLeave }: Props) {
  const { t } = useTranslation()
  const online = useOnline()
  const waiting = useSyncExternalStore(subscribe, pendingCount, () => 0)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-8 pt-3">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-9 w-9" />
          <span className="text-xl font-extrabold">{t('app.name')}</span>
        </div>
        <LanguageSwitcher />
      </header>

      {(!online || waiting > 0) && (
        <div className="mb-3 rounded-xl bg-sun-light px-3 py-2 text-sm font-semibold" role="status" data-testid="sync-status">
          {!online ? t('common.offline') : ''} {waiting > 0 ? t('common.waiting', { count: waiting }) : ''}
        </div>
      )}

      {studentCode && (
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="rounded-full bg-white px-3 py-1 font-bold shadow-sm" data-testid="header-student-code">
            {studentCode}
          </span>
          {onLeave && (
            <button type="button" onClick={onLeave} className="min-h-[44px] px-2 font-semibold text-ink/70 underline">
              {t('common.leave')}
            </button>
          )}
        </div>
      )}

      <main className="flex-1 space-y-4">{children}</main>
    </div>
  )
}
