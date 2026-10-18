import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, StudentProfile } from '../../lib/auth'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'

export function AuthPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<'student' | 'teacher'>('student')

  // Teacher Login State
  const [teacherUser, setTeacherUser] = useState('TEACHER')
  const [teacherPass, setTeacherPass] = useState('1234567891011')
  const [teacherBusy, setTeacherBusy] = useState(false)
  const [teacherError, setTeacherError] = useState<string | null>(null)

  // Student Auth Mode: 'signin' vs 'signup'
  const [studentMode, setStudentMode] = useState<'signin' | 'signup'>('signin')

  // Student Signin State
  const [stuLoginUser, setStuLoginUser] = useState('')
  const [stuLoginPass, setStuLoginPass] = useState('')
  const [stuLoginBusy, setStuLoginBusy] = useState(false)
  const [stuLoginError, setStuLoginError] = useState<string | null>(null)

  // Student Signup State
  const [school, setSchool] = useState('Govt High School, Bengaluru')
  const [classLevel, setClassLevel] = useState('4')
  const [section, setSection] = useState('C')
  const [rollNumber, setRollNumber] = useState('12')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPass, setRegConfirmPass] = useState('')
  const [regBusy, setRegBusy] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState<StudentProfile | null>(null)

  // Password strength check
  const pwdLengthOk = regPassword.length >= 8
  const pwdUpperOk = /[A-Z]/.test(regPassword)
  const pwdLowerOk = /[a-z]/.test(regPassword)
  const pwdDigitOk = /\d/.test(regPassword)
  const pwdAllOk = pwdLengthOk && pwdUpperOk && pwdLowerOk && pwdDigitOk
  const pwdMatch = regPassword === regConfirmPass && regConfirmPass.length > 0

  // 1. Handle Teacher Login
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeacherError(null)
    setTeacherBusy(true)
    try {
      await auth.loginTeacher(teacherUser, teacherPass)
      navigate('/teacher')
    } catch (err: any) {
      setTeacherError(err?.message || 'Invalid Teacher credentials.')
    } finally {
      setTeacherBusy(false)
    }
  }

  // 2. Handle Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStuLoginError(null)
    setStuLoginBusy(true)
    try {
      const profile = await auth.loginStudent(stuLoginUser, stuLoginPass)
      navigate('/', { state: { profile } })
    } catch (err: any) {
      setStuLoginError(err?.message || 'Login failed.')
    } finally {
      setStuLoginBusy(false)
    }
  }

  // 3. Handle Student Registration
  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)

    if (!regUsername.trim()) {
      setRegError('Please choose a valid username.')
      return
    }

    if (!pwdAllOk) {
      setRegError('Password must meet all 4 security requirements.')
      return
    }

    if (!pwdMatch) {
      setRegError('Passwords do not match.')
      return
    }

    setRegBusy(true)
    try {
      const isAvail = await auth.isUsernameAvailable(regUsername)
      if (!isAvail) {
        setRegError(`Username '${regUsername}' is already taken. Try another.`)
        setRegBusy(false)
        return
      }

      const profile = await auth.registerStudent({
        school,
        classLevel,
        section,
        rollNumber,
        username: regUsername,
        password: regPassword,
      })

      setRegSuccess(profile)
    } catch (err: any) {
      setRegError(err?.message || 'Failed to create account.')
    } finally {
      setRegBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4 font-sans text-ink">
      {/* Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-9 w-9" />
          <span className="text-2xl font-black tracking-tight text-ink">StoryMath</span>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-ink/10 shadow-lg p-6 space-y-5">
        {/* Portal Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`py-2.5 rounded-xl transition-all ${
              role === 'student' ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:text-ink'
            }`}
          >
            🎒 Student Portal
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`py-2.5 rounded-xl transition-all ${
              role === 'teacher' ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:text-ink'
            }`}
          >
            👩‍🏫 Teacher Portal
          </button>
        </div>

        {/* TEACHER PORTAL */}
        {role === 'teacher' && (
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-ink">Global Teacher Login</h2>
              <p className="text-xs text-ink/70">
                Single authorized teacher access to Karnataka cohort diagnostic heatmaps.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1 text-amber-900">
              <div className="font-bold">🔑 Authorized Teacher Credentials:</div>
              <div>Username: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">TEACHER</code></div>
              <div>Password: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">1234567891011</code></div>
            </div>

            {teacherError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                ⚠ {teacherError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink/70 uppercase">Teacher Username</label>
              <input
                type="text"
                value={teacherUser}
                onChange={(e) => setTeacherUser(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 focus:border-brand focus:outline-hidden text-sm font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink/70 uppercase">Password</label>
              <input
                type="password"
                value={teacherPass}
                onChange={(e) => setTeacherPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 focus:border-brand focus:outline-hidden text-sm font-semibold font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={teacherBusy}
              className="btn-primary w-full py-3"
            >
              {teacherBusy ? 'Verifying with Supabase...' : 'Unlock Teacher Dashboard →'}
            </button>
          </form>
        )}

        {/* STUDENT PORTAL */}
        {role === 'student' && (
          <div className="space-y-4">
            {/* Sub Mode Toggle */}
            <div className="flex border-b border-ink/10 pb-2 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStudentMode('signin')}
                className={`pb-1 border-b-2 transition-colors ${
                  studentMode === 'signin' ? 'border-brand text-brand' : 'border-transparent text-ink/50'
                }`}
              >
                Sign In to Account
              </button>
              <button
                type="button"
                onClick={() => setStudentMode('signup')}
                className={`pb-1 border-b-2 transition-colors ${
                  studentMode === 'signup' ? 'border-brand text-brand' : 'border-transparent text-ink/50'
                }`}
              >
                + Create New Account
              </button>
            </div>

            {/* STUDENT SIGN IN */}
            {studentMode === 'signin' && (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-ink">Student Sign In</h2>
                  <p className="text-xs text-ink/70">
                    Sign in with your registered school username and password.
                  </p>
                </div>

                {stuLoginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    ⚠ {stuLoginError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink/70 uppercase">Username</label>
                  <input
                    type="text"
                    value={stuLoginUser}
                    onChange={(e) => setStuLoginUser(e.target.value)}
                    placeholder="e.g. arjun_4c"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 focus:border-brand focus:outline-hidden text-sm font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink/70 uppercase">Password</label>
                  <input
                    type="password"
                    value={stuLoginPass}
                    onChange={(e) => setStuLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink/20 focus:border-brand focus:outline-hidden text-sm font-semibold font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={stuLoginBusy}
                  className="btn-primary w-full py-3"
                >
                  {stuLoginBusy ? 'Signing In...' : 'Sign In as Student →'}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStuLoginUser('student_demo')
                      setStuLoginPass('Pass1234')
                    }}
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    ⚡ Auto-fill Demo Student (student_demo / Pass1234)
                  </button>
                </div>
              </form>
            )}

            {/* STUDENT SIGN UP */}
            {studentMode === 'signup' && !regSuccess && (
              <form onSubmit={handleStudentSignup} className="space-y-3.5">
                <div className="text-center space-y-0.5">
                  <h2 className="text-xl font-black text-ink">Create Student Account</h2>
                  <p className="text-xs text-ink/70">
                    Stores school profile in Supabase DBMS and creates your class code.
                  </p>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    ⚠ {regError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-ink/70 uppercase">School Name</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Govt Primary School, Mysuru"
                    className="w-full px-3 py-2 rounded-xl border border-ink/20 focus:border-brand text-xs font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink/70 uppercase">Class</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-ink/20 text-xs font-bold bg-white"
                    >
                      <option value="4">Class 4</option>
                      <option value="5">Class 5</option>
                      <option value="6">Class 6</option>
                      <option value="7">Class 7</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink/70 uppercase">Section</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-ink/20 text-xs font-bold bg-white"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink/70 uppercase">Roll No</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full px-2.5 py-2 rounded-xl border border-ink/20 text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Assigned Class Code Preview */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
                  <span className="text-ink/60">Your Auto-Assigned Class Code: </span>
                  <span className="font-mono font-black text-brand">CLASS-{classLevel}{section}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-ink/70 uppercase">Choose Username</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. rohit_4c"
                    className="w-full px-3 py-2 rounded-xl border border-ink/20 focus:border-brand text-xs font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-ink/70 uppercase">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className="w-full px-3 py-2 rounded-xl border border-ink/20 focus:border-brand text-xs font-mono"
                    required
                  />
                  {/* Live Password Rules */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
                    <span className={pwdLengthOk ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {pwdLengthOk ? '✓' : '○'} 8+ characters
                    </span>
                    <span className={pwdUpperOk ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {pwdUpperOk ? '✓' : '○'} 1 uppercase (A-Z)
                    </span>
                    <span className={pwdLowerOk ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {pwdLowerOk ? '✓' : '○'} 1 lowercase (a-z)
                    </span>
                    <span className={pwdDigitOk ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {pwdDigitOk ? '✓' : '○'} 1 number (0-9)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-ink/70 uppercase">Confirm Password</label>
                  <input
                    type="password"
                    value={regConfirmPass}
                    onChange={(e) => setRegConfirmPass(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 rounded-xl border border-ink/20 focus:border-brand text-xs font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={regBusy}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {regBusy ? 'Saving to Supabase DBMS...' : 'Register Account in Supabase →'}
                </button>
              </form>
            )}

            {/* REGISTRATION SUCCESS CARD */}
            {regSuccess && (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                  🎉
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-ink">Account Created!</h3>
                  <p className="text-xs text-ink/70">Saved in Supabase DBMS. Your class code is locked:</p>
                </div>

                <div className="p-4 rounded-2xl bg-brand-light/50 border border-brand/30 space-y-1">
                  <div className="text-xs uppercase font-bold text-ink/60">Your Exclusive Class Code</div>
                  <div className="text-3xl font-black text-brand tracking-widest font-mono">
                    {regSuccess.classCode}
                  </div>
                  <div className="text-[11px] text-ink/70">
                    Student ID: <span className="font-bold">{regSuccess.studentCode}</span> ({regSuccess.school})
                  </div>
                </div>

                <p className="text-xs text-ink/70 leading-relaxed">
                  You can only enter tests using <strong>{regSuccess.classCode}</strong> because your account is registered in Class {regSuccess.classLevel}{regSuccess.section}.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/', { state: { profile: regSuccess } })}
                  className="btn-primary w-full py-3"
                >
                  Enter Class {regSuccess.classCode} →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
