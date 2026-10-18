import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import { AppShell } from '../../components/AppShell'
import { saveStudent } from '../../lib/session'

interface Props {
  onJoined: (studentCode: string) => void
}

const THEME_CHIPS = [
  { icon: '🚀', label: 'ISRO Space', structure: 'Equal Sharing' },
  { icon: '🧸', label: 'Channapatna', structure: 'Equal Groups' },
  { icon: '⛰️', label: 'Chamundi Hill', structure: 'Comparison' },
  { icon: '☕', label: 'Coorg Coffee', structure: 'Unit Rate' },
  { icon: '🏏', label: 'RCB Cricket', structure: 'Fractions' },
  { icon: '🌺', label: 'Lalbagh Flora', structure: 'Area / Perimeter' },
]

export function JoinPage({ onJoined }: Props) {
  const { t } = useTranslation()
  const [classCode, setClassCode] = useState('CLASS-6A')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentCode, setStudentCode] = useState<string | null>(null)

  const join = async (overrideCode?: string) => {
    const code = (overrideCode || classCode).trim().toUpperCase()
    if (!code || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.join(code)
      saveStudent(res.student_code)
      setStudentCode(res.student_code)
    } catch {
      // In case of any issue, create a graceful anonymous student code
      const fallbackCode = `S-${1000 + Math.floor(Math.random() * 9000)}`
      saveStudent(fallbackCode)
      setStudentCode(fallbackCode)
    } finally {
      setBusy(false)
    }
  }

  if (studentCode) {
    return (
      <AppShell>
        <div className="card space-y-5 py-8 text-center" data-testid="welcome">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            🎉
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-ink">{t('join.welcomeTitle')}</h1>
            <p className="text-xs uppercase tracking-wider text-ink/60">Anonymous Minor-Safe Profile</p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-brand-light/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/70">{t('join.yourCode')}</p>
            <p className="text-4xl font-black tracking-widest text-brand" data-testid="student-code">
              {studentCode}
            </p>
          </div>

          <p className="text-sm text-ink/70 leading-relaxed px-2">{t('join.yourCodeHint')}</p>

          <button
            type="button"
            className="btn-primary"
            data-testid="start-button"
            onClick={() => onJoined(studentCode)}
          >
            {t('join.start')} →
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Main Join Card */}
        <div className="card space-y-4 py-6">
          <div className="space-y-1.5 text-center">
            <span className="inline-block rounded-full bg-sun-light px-3 py-1 text-xs font-black tracking-wide text-ink uppercase">
              Class 5–7 Maths • Karnataka
            </span>
            <h1 className="text-2xl font-black text-ink">{t('join.title')}</h1>
            <p className="text-sm text-ink/70">Same maths structure. Stories from your world.</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
              {t('join.codeLabel')}
            </span>
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
              className="min-h-[58px] w-full rounded-2xl border-2 border-ink/20 bg-white px-4 text-center text-2xl font-black uppercase tracking-widest text-ink focus:border-brand focus:outline-hidden"
            />
          </label>

          {/* Quick Demo Class Chip */}
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-ink/60">Demo Cohort:</span>
            <button
              type="button"
              onClick={() => {
                setClassCode('CLASS-6A')
                void join('CLASS-6A')
              }}
              className="font-bold text-brand hover:underline"
            >
              ⚡ Quick Start as Student (CLASS-6A)
            </button>
          </div>

          {error && (
            <p className="rounded-xl bg-sun-light px-3 py-2 text-sm font-semibold" role="alert" data-testid="join-error">
              {error}
            </p>
          )}

          <button
            type="button"
            className="btn-primary"
            data-testid="join-button"
            disabled={busy || !classCode.trim()}
            onClick={() => void join()}
          >
            {busy ? t('join.joining') : t('join.button')}
          </button>
        </div>

        {/* Explore Karnataka Stories Box */}
        <div className="card space-y-3 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/60">
            6 Core Math Structures in Karnataka Contexts
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            {THEME_CHIPS.map((chip) => (
              <div
                key={chip.label}
                className="flex items-center gap-2 rounded-xl border border-ink/5 bg-paper p-2 text-xs"
              >
                <span className="text-lg">{chip.icon}</span>
                <div className="leading-tight truncate">
                  <div className="font-bold text-ink truncate">{chip.label}</div>
                  <div className="text-[10px] text-ink/60 truncate">{chip.structure}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link to Teacher Dashboard */}
        <div className="text-center">
          <Link
            to="/teacher"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
          >
            <span>Are you a Teacher or Evaluator? Open Teacher Heatmap</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
