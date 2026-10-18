/**
 * Authentication and Session Management for StoryMath.
 *
 * SECURITY POLICY:
 * - NO passwords are ever stored locally (localStorage, sessionStorage, cookies).
 * - All credential validation happens exclusively via the backend API → Supabase.
 * - Only the session PROFILE (username, class code, role — no password) is stored
 *   in localStorage so the browser remembers who is logged in across page refreshes.
 * - If the backend is unreachable, login/register fail with a clear error.
 *   (Offline browsing of the public pages is still possible; auth is not.)
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

// ─────────────────────────────────────────────────────────────────────────────
// Session helpers — profile only, no secrets
// ─────────────────────────────────────────────────────────────────────────────

function saveSession(session: AuthSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported auth object
// ─────────────────────────────────────────────────────────────────────────────

export const auth = {
  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? (JSON.parse(raw) as AuthSession) : null
    } catch {
      return null
    }
  },

  // Exposed for JoinPage sign-out button
  clearSession,

  // ── Username availability ──────────────────────────────────────────────────

  async isUsernameAvailable(username: string): Promise<boolean> {
    const clean = username.trim().toLowerCase()
    try {
      const res = await fetch(`/auth/check-username?username=${encodeURIComponent(clean)}`)
      if (res.ok) {
        const data = await res.json()
        return Boolean(data.available)
      }
      // 4xx means server responded — unavailable or bad request
      return false
    } catch {
      throw new Error('Cannot reach the server to check username. Please check your connection.')
    }
  },

  // ── Student registration ───────────────────────────────────────────────────

  async registerStudent(params: {
    school: string
    classLevel: string
    section: string
    rollNumber: string
    username: string
    password: string
  }): Promise<StudentProfile> {
    const res = await fetch('/auth/student/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school: params.school.trim(),
        class_level: params.classLevel.trim(),
        section: params.section.trim().toUpperCase(),
        roll_number: params.rollNumber.trim(),
        username: params.username.trim().toLowerCase(),
        password: params.password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.detail || 'Registration failed. Please try again.')
    }

    const profile: StudentProfile = {
      username: data.username,
      school: data.school,
      classLevel: data.class_level,
      section: data.section,
      rollNumber: params.rollNumber.trim(),
      classCode: data.class_code,
      studentCode: data.student_code,
    }

    // Save profile (NO password) to localStorage for session continuity
    saveSession({ role: 'student', username: profile.username, student: profile })
    return profile
  },

  // ── Student login ──────────────────────────────────────────────────────────

  async loginStudent(username: string, password: string): Promise<StudentProfile> {
    const res = await fetch('/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(
        data?.detail ||
        'Invalid username or password. Please verify your credentials or create an account.'
      )
    }

    const profile: StudentProfile = {
      username: data.username,
      school: data.school || '',
      classLevel: data.class_level || '',
      section: data.section || '',
      rollNumber: '',
      classCode: data.class_code || '',
      studentCode: data.student_code || '',
    }

    // Save profile (NO password) to localStorage
    saveSession({ role: 'student', username: profile.username, student: profile })
    return profile
  },

  // ── Teacher login ──────────────────────────────────────────────────────────

  async loginTeacher(username: string, password: string): Promise<void> {
    const res = await fetch('/auth/teacher/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(
        data?.detail ||
        'Invalid Teacher credentials. Contact your administrator.'
      )
    }

    // Save role only (NO password) to localStorage
    saveSession({ role: 'teacher', username: data.username || 'TEACHER' })
  },

  // ── Logout ─────────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    const session = auth.getSession()
    if (session?.role === 'teacher') {
      try {
        await fetch('/auth/teacher/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: session.username }),
        })
      } catch {
        // Audit log best-effort; session is still cleared client-side
      }
    }
    clearSession()
  },
}
