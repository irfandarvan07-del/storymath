import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, NetworkError, api } from '../../api'
import { AppShell } from '../../components/AppShell'
import { saveStudent } from '../../lib/session'

interface Props {
  onJoined: (studentCode: string) => void
}

/** Class code in, anonymous student code out. No names, no emails. */
export function JoinPage({ onJoined }: Props) {
  const { t } = useTranslation()
  const [classCode, setClassCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentCode, setStudentCode] = useState<string | null>(null)

  const join = async () => {
    const code = classCode.trim().toUpperCase()
    if (!code || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.join(code)
      saveStudent(res.student_code)
      setStudentCode(res.student_code)
    } catch (e) {
      if (e instanceof NetworkError) setError(t('join.errorNetwork'))
      else if (e instanceof ApiError && (e.status === 404 || e.status === 422)) setError(t('join.errorNotFound'))
      else setError(t('join.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  if (studentCode) {
    return (
      <AppShell>
        <div className="card space-y-4 py-8 text-center" data-testid="welcome">
          <p className="text-5xl" aria-hidden="true">
            🎉
          </p>
          <h1 className="text-2xl font-extrabold">{t('join.welcomeTitle')}</h1>
          <div>
            <p className="text-sm font-bold text-ink/70">{t('join.yourCode')}</p>
            <p className="text-5xl font-extrabold tracking-wider text-brand" data-testid="student-code">
              {studentCode}
            </p>
          </div>
          <p className="text-sm text-ink/70">{t('join.yourCodeHint')}</p>
          <button type="button" className="btn-primary" data-testid="start-button" onClick={() => onJoined(studentCode)}>
            {t('join.start')}
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="card space-y-5 py-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-extrabold">{t('join.title')}</h1>
          <p className="text-ink/70">{t('join.subtitle')}</p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-ink/70">{t('join.codeLabel')}</span>
          <input
            data-testid="class-code"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            value={classCode}
            placeholder={t('join.codePlaceholder')}
            onChange={(e) => setClassCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void join()
            }}
            className="min-h-[64px] w-full rounded-2xl border-4 border-ink/20 bg-white px-4 text-center text-3xl font-extrabold uppercase tracking-widest placeholder:text-base placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-brand"
          />
        </label>

        {error && (
          <p className="rounded-xl bg-sun-light px-3 py-2 text-sm font-semibold" role="alert" data-testid="join-error">
            {error}
          </p>
        )}

        <button type="button" className="btn-primary" data-testid="join-button" disabled={busy || !classCode.trim()} onClick={() => void join()}>
          {busy ? t('join.joining') : t('join.button')}
        </button>
      </div>
    </AppShell>
  )
}
