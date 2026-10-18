/**
 * Authentication and Session Management for StoryMath.
 * Handles Student Registration, Student Login, Teacher Authentication,
 * and session state for both local offline mode and live Supabase DBMS backend.
 */

export interface StudentProfile {
  username: string
  school: string
  classLevel: string
  section: string
  rollNumber: string
  classCode: string
  studentCode: string
}

export interface AuthSession {
  role: 'student' | 'teacher'
  username: string
  student?: StudentProfile
}

const SESSION_KEY = 'storymath_auth_session'
const LOCAL_ACCOUNTS_KEY = 'storymath_student_accounts'

// Seed initial demo student accounts
function getLocalAccounts(): Record<string, StudentProfile & { passwordHash: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    student_demo: {
      username: 'student_demo',
      passwordHash: 'Pass1234',
      school: 'Govt High School, Bengaluru',
      classLevel: '6',
      section: 'A',
      rollNumber: '101',
      classCode: 'CLASS-6A',
      studentCode: 'S-101',
    },
  }
}

function saveLocalAccounts(accs: Record<string, StudentProfile & { passwordHash: string }>) {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accs))
  } catch {}
}

export const auth = {
  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setSession(session: AuthSession) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {}
  },

  clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {}
  },

  async isUsernameAvailable(username: string): Promise<boolean> {
    const clean = username.trim().toLowerCase()
    // 1. Check local storage
    const accounts = getLocalAccounts()
    if (accounts[clean]) return false

    // 2. Try backend API if running
    try {
      const res = await fetch(`/auth/check-username?username=${encodeURIComponent(clean)}`)
      if (res.ok) {
        const data = await res.json()
        return Boolean(data.available)
      }
    } catch {}
    return true
  },

  async registerStudent(params: {
    school: string
    classLevel: string
    section: string
    rollNumber: string
    username: string
    password: string
  }): Promise<StudentProfile> {
    const cleanUser = params.username.trim().toLowerCase()
    const cleanClass = params.classLevel.trim().toUpperCase().replace('CLASS', '').replace('-', '').trim()
    const cleanSection = params.section.trim().toUpperCase()
    const classCode = `CLASS-${cleanClass}${cleanSection}`
    const studentCode = `S-${1000 + Math.floor(Math.random() * 9000)}`

    const profile: StudentProfile = {
      username: cleanUser,
      school: params.school.trim(),
      classLevel: cleanClass,
      section: cleanSection,
      rollNumber: params.rollNumber.trim(),
      classCode,
      studentCode,
    }

    // 1. Try sending to backend API (which writes to Supabase student_users table)
    try {
      await fetch('/auth/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school: profile.school,
          class_level: profile.classLevel,
          section: profile.section,
          roll_number: profile.rollNumber,
          username: cleanUser,
          password: params.password,
        }),
      })
    } catch {
      // Offline fallback: save locally
    }

    // 2. Always persist in local accounts registry
    const accounts = getLocalAccounts()
    accounts[cleanUser] = {
      ...profile,
      passwordHash: params.password,
    }
    saveLocalAccounts(accounts)

    // 3. Set active session
    auth.setSession({
      role: 'student',
      username: cleanUser,
      student: profile,
    })

    return profile
  },

  async loginStudent(username: string, password: string): Promise<StudentProfile> {
    const cleanUser = username.trim().toLowerCase()

    // 1. Try backend API (which verifies with Supabase DBMS)
    try {
      const res = await fetch('/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password }),
      })
      if (res.ok) {
        const data = await res.json()
        const profile: StudentProfile = {
          username: data.username,
          school: data.school || 'Karnataka Govt School',
          classLevel: data.class_level || '6',
          section: data.section || 'A',
          rollNumber: data.roll_number || '1',
          classCode: data.class_code || 'CLASS-6A',
          studentCode: data.student_code || 'S-101',
        }
        auth.setSession({ role: 'student', username: cleanUser, student: profile })
        return profile
      }
    } catch {}

    // 2. Fallback to local accounts verification
    const accounts = getLocalAccounts()
    const userAcc = accounts[cleanUser]
    if (!userAcc || userAcc.passwordHash !== password) {
      throw new Error('Invalid username or password. Please verify credentials or create an account.')
    }

    const profile: StudentProfile = {
      username: userAcc.username,
      school: userAcc.school,
      classLevel: userAcc.classLevel,
      section: userAcc.section,
      rollNumber: userAcc.rollNumber,
      classCode: userAcc.classCode,
      studentCode: userAcc.studentCode,
    }

    auth.setSession({ role: 'student', username: cleanUser, student: profile })
    return profile
  },

  async loginTeacher(username: string, password: string): Promise<void> {
    const clean = username.trim().toUpperCase()
    if (clean !== 'TEACHER' || password !== '1234567891011') {
      throw new Error('Invalid Teacher credentials. Please enter authorized username TEACHER and password.')
    }

    // Try logging into Supabase teacher_logs via backend
    try {
      await fetch('/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean, password }),
      })
    } catch {}

    auth.setSession({ role: 'teacher', username: 'TEACHER' })
  },

  async logout(): Promise<void> {
    const session = auth.getSession()
    if (session?.role === 'teacher') {
      try {
        await fetch('/auth/teacher/logout', { method: 'POST' })
      } catch {}
    }
    auth.clearSession()
  },
}
