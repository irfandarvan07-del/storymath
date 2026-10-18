import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import { AppShell } from '../../components/AppShell'
import { saveStudent } from '../../lib/session'
import { auth, StudentProfile } from '../../lib/auth'

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
  const navigate = useNavigate()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [classCode, setClassCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentCode, setStudentCode] = useState<string | null>(null)

  useEffect(() => {
    const session = auth.getSession()
    if (!session || session.role !== 'student' || !session.student) {
      // Must login first
      navigate('/login')
      return
    }
    setProfile(session.student)
    setClassCode(session.student.classCode)
  }, [navigate])

  const join = async (overrideCode?: string) => {
    const inputCode = (overrideCode || classCode).trim().toUpperCase()
    if (!inputCode || busy) return
    setError(null)

    // Strict security check: must match registered class code
    if (profile && inputCode !== profile.classCode) {
      setError(
        `Class Code Mismatch! Your account is registered in Class ${profile.classLevel}${profile.section} (${profile.school}). You can only take tests with your assigned code '${profile.classCode}'.`
      )
      return
    }

    setBusy(true)
    try {
      const res = await api.join(inputCode)
      const finalCode = profile?.studentCode || res.student_code
      saveStudent(finalCode)
      setStudentCode(finalCode)
    } catch {
      const finalCode = profile?.studentCode || `S-${1000 + Math.floor(Math.random() * 9000)}`
      saveStudent(finalCode)
      setStudentCode(finalCode)
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = () => {
    auth.clearSession()
    navigate('/login')
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
            <p className="text-xs uppercase tracking-wider text-ink/60">
              Verified Student: {profile?.username} • Class {profile?.classLevel}{profile?.section}
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-brand-light/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/70">{t('join.yourCode')}</p>
            <p className="text-4xl font-black tracking-widest text-brand font-mono" data-testid="student-code">
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
        {/* Student Session Header */}
        {profile && (
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-ink/10 text-xs">
            <div className="truncate">
              <span className="font-bold text-ink">👤 {profile.username}</span>
              <span className="text-ink/60 ml-1.5">({profile.school})</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-rose-600 font-bold hover:underline ml-2"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Main Join Card */}
        <div className="card space-y-4 py-6">
          <div className="space-y-1 text-center">
            <span className="inline-block rounded-full bg-sun-light px-3 py-1 text-xs font-black tracking-wide text-ink uppercase">
              Class 5–7 Maths • Karnataka
            </span>
            <h1 className="text-2xl font-black text-ink">{t('join.title')}</h1>
            <p className="text-xs text-ink/70">
              Enter your assigned class code to begin your personalized problem set.
            </p>
          </div>

          <label className="block space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
                {t('join.codeLabel')}
              </span>
              {profile && (
                <span className="text-[11px] font-bold text-brand">
                  Assigned Code: {profile.classCode}
                </span>
              )}
            </div>
            <input
              data-testid="class-code"
              type="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={12}
              value={classCode}
              placeholder="e.g. CLASS-4C"
              onChange={(e) => setClassCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void join()
              }}
              className="min-h-[58px] w-full rounded-2xl border-2 border-ink/20 bg-white px-4 text-center text-2xl font-black uppercase tracking-widest text-ink focus:border-brand focus:outline-hidden font-mono"
            />
          </label>

          {/* Quick chip to fill assigned code */}
          {profile && (
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-ink/60">Registered Class:</span>
              <button
                type="button"
                onClick={() => {
                  setClassCode(profile.classCode)
                  void join(profile.classCode)
                }}
                className="font-bold text-brand hover:underline font-mono"
              >
                ⚡ Use My Code ({profile.classCode})
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800" role="alert">
              ⚠ {error}
            </div>
          )}

          <button
            type="button"
            className="btn-primary"
            data-testid="join-button"
            disabled={busy || !classCode.trim()}
            onClick={() => void join()}
          >
            {busy ? 'Validating Class Code...' : 'Enter Class Test →'}
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
            <span>Are you a Teacher? Open Global Teacher Portal</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
