import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, NetworkError, STEP_ORDER, api } from '../../api'
import type { Marks, Problem, Step } from '../../api'
import type { HintEntry } from '../../components/HintBox'
import { clearSession, loadSession, saveSession } from '../../lib/session'

export type Status = 'loading' | 'ready' | 'error' | 'solved' | 'finished'
export type Verdict = 'idle' | 'wrong' | 'correct' | 'queued' | 'error'

/** How long the "Yes! Well done." banner stays before the next step appears. */
const ADVANCE_MS = 700

/**
 * All state for solving one problem. The backend decides correctness, hints and
 * which steps are enabled; this hook only renders what it is told.
 */
export function useSolve(studentCode: string) {
  const [status, setStatus] = useState<Status>('loading')
  const [errorKind, setErrorKind] = useState<'offline' | 'generic' | null>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [marks, setMarks] = useState<Marks>({})
  const [hints, setHints] = useState<HintEntry[]>([])
  const [verdict, setVerdict] = useState<Verdict>('idle')
  const [busy, setBusy] = useState(false)
  const [solvedCount, setSolvedCount] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  const steps: Step[] = problem ? STEP_ORDER.filter((s) => problem.steps_enabled.includes(s)) : []
  const step: Step | undefined = steps[stepIdx]

  const begin = useCallback(
    (p: Problem, idx = 0, m: Marks = {}) => {
      setProblem(p)
      setStepIdx(idx)
      setMarks(m)
      setHints([])
      setVerdict('idle')
      setBusy(false)
      setStatus('ready')
      saveSession({ studentCode, problem: p, stepIdx: idx, marks: m })
    },
    [studentCode],
  )

  const startNext = useCallback(async () => {
    window.clearTimeout(timer.current)
    setStatus('loading')
    clearSession()
    try {
      begin(await api.nextProblem(studentCode))
    } catch (e) {
      setErrorKind(e instanceof NetworkError ? 'offline' : 'generic')
      setStatus('error')
    }
  }, [begin, studentCode])

  // On mount: resume a saved problem (reload, or no signal), otherwise fetch one.
  useEffect(() => {
    const saved = loadSession(studentCode)
    if (saved) begin(saved.problem, saved.stepIdx, saved.marks)
    else void startNext()
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentCode])

  const finish = useCallback(
    async (p: Problem) => {
      try {
        await api.finish(p.attempt_id)
      } catch (e) {
        // A rejected finish must not trap the student on a solved problem.
        if (!(e instanceof ApiError)) throw e
      }
      clearSession()
      setSolvedCount((n) => n + 1)
      setBusy(false)
      setStatus('solved')
    },
    [],
  )

  const goTo = useCallback(
    (p: Problem, list: Step[], idx: number, m: Marks) => {
      if (idx < 0 || idx >= list.length) {
        void finish(p)
        return
      }
      setStepIdx(idx)
      setHints([])
      setVerdict('idle')
      setBusy(false)
      saveSession({ studentCode, problem: p, stepIdx: idx, marks: m })
    },
    [finish, studentCode],
  )

  const submit = useCallback(
    async (response: Record<string, unknown>, nextMarks: Marks = marks) => {
      if (!problem || !step || busy) return
      setBusy(true)
      setMarks(nextMarks)
      const list = steps
      const current = stepIdx
      try {
        const res = await api.submitStep(problem.attempt_id, { step, response })

        if (res.queued) {
          // Offline: saved for later. Move on so the student is not stuck.
          setVerdict('queued')
          timer.current = window.setTimeout(() => goTo(problem, list, current + 1, nextMarks), ADVANCE_MS + 300)
          return
        }

        const fb = res.feedback
        if (fb.correct) {
          setVerdict('correct')
          timer.current = window.setTimeout(() => {
            if (fb.attempt_solved) {
              void finish(problem)
              return
            }
            const target = list.indexOf(fb.next_step)
            goTo(problem, list, target > current ? target : current + 1, nextMarks)
          }, ADVANCE_MS)
          return
        }

        // Wrong step: show the hint the backend sent and let the student retry the same step.
        setVerdict('wrong')
        if (fb.hint_text) {
          const entry: HintEntry = { level: fb.hint_level, text: fb.hint_text }
          setHints((prev) => [...prev.filter((h) => h.level !== entry.level), entry])
        }
        setBusy(false)
      } catch {
        setVerdict('error')
        setBusy(false)
      }
    },
    [problem, step, busy, marks, steps, stepIdx, goTo, finish],
  )

  const endSession = useCallback(() => {
    window.clearTimeout(timer.current)
    clearSession()
    setStatus('finished')
  }, [])

  return {
    status,
    errorKind,
    problem,
    steps,
    stepIdx,
    step,
    marks,
    setMarks,
    hints,
    verdict,
    busy,
    solvedCount,
    submit,
    startNext,
    endSession,
  }
}
