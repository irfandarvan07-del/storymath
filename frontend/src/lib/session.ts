/** Tiny localStorage helpers. Only anonymous codes and attempt state are stored. */
import type { Marks, Problem } from '../api/types'

const STUDENT_KEY = 'sm_student'
const SESSION_KEY = 'sm_session'

function get(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function set(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}
function del(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export const getStudent = () => get(STUDENT_KEY)
export const saveStudent = (code: string) => set(STUDENT_KEY, code)
export function clearStudent() {
  del(STUDENT_KEY)
  del(SESSION_KEY)
}

/** The problem the student is working on, so a reload (or no signal) can resume. */
export interface SavedSession {
  studentCode: string
  problem: Problem
  stepIdx: number
  marks: Marks
}

export function loadSession(studentCode: string): SavedSession | null {
  const raw = get(SESSION_KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as SavedSession
    return s.studentCode === studentCode && s.problem ? s : null
  } catch {
    return null
  }
}
export const saveSession = (s: SavedSession) => set(SESSION_KEY, JSON.stringify(s))
export const clearSession = () => del(SESSION_KEY)
