/**
 * Mock backend, used while VITE_USE_MOCK=true.
 *
 * NOTE: unlike the real client, the mock has to know the answers so the demo
 * can give feedback. That logic lives ONLY here and is never bundled into the
 * real code path (client.ts dynamically picks one or the other).
 */
import sample from './sample_problem.json'
import { ApiError } from './http'
import { loadSession } from '../lib/session'
import { tokenize } from '../lib/tokens'
import { STEP_ORDER } from './types'
import type { JoinResponse, Problem, Step, StepFeedback, StepSubmission } from './types'

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms))

const VARIANTS = [
  { item: 'laddoos', people: 'children', one: 'child' },
  { item: 'pencils', people: 'students', one: 'student' },
  { item: 'stickers', people: 'friends', one: 'friend' },
  { item: 'mangoes', people: 'baskets', one: 'basket' },
]
/** [total, groups] pairs; each divides evenly and the answer is never shown in the story. */
const PAIRS: Array<[number, number]> = [
  [84, 12],
  [72, 8],
  [63, 9],
  [96, 6],
  [55, 5],
]

const HINTS: Record<Step, [string, string, string]> = {
  facts: [
    'Which numbers does the story tell you? Which part asks a question?',
    'Mark the numbers in the story as given. Mark what the question wants as asked.',
    'Example: "20 mangoes go into 4 baskets." Given: 20 and 4. Asked: how many in one basket.',
  ],
  model: [
    'Is something being split into equal parts?',
    'Try the groups picture: one box for each child.',
    'Example: 20 mangoes and 4 baskets. Draw 4 boxes and share the 20 mangoes between them.',
  ],
  operation: [
    'Is the total being split or joined?',
    'When a total is split into equal groups, think about sharing.',
    'Example: 20 mangoes shared in 4 baskets. Each basket gets 20 ÷ 4 = 5. Now use your numbers.',
  ],
  calculation: [
    'Take your time. Which number goes first?',
    'Check your tables. What times the number of groups gives the total?',
    'Example: 20 ÷ 4 = 5 because 4 × 5 = 20. Try the same idea.',
  ],
  sense_check: [
    'Think of one child getting a share of the whole.',
    'Is one share bigger or smaller than everything together?',
    'Example: 20 mangoes shared by 4 baskets. One basket gets fewer than 20.',
  ],
}

interface MockAttempt {
  problem: Problem
  wrong: Partial<Record<Step, number>>
}
const attempts = new Map<number, MockAttempt>()
let served = 0

export async function join(classCode: string): Promise<JoinResponse> {
  await delay()
  if (classCode.trim().length < 3) throw new ApiError(404, 'Class not found')
  return { student_code: `S-${1000 + Math.floor(Math.random() * 9000)}` }
}

export async function nextProblem(): Promise<Problem> {
  await delay(350)
  const i = served++
  let problem: Problem
  if (i === 0) {
    problem = { ...(sample as unknown as Problem) }
  } else {
    const v = VARIANTS[i % VARIANTS.length]
    const [total, groups] = PAIRS[i % PAIRS.length]
    problem = {
      attempt_id: 101 + i,
      structure: 'equal_sharing',
      model_type: 'groups_picture',
      story: `${groups} ${v.people} share ${total} ${v.item} equally.`,
      question: `How many ${v.item} does each ${v.one} get?`,
      numbers: { total, groups },
      // Strong students skip facts + model after two problems (backend decides in real life).
      steps_enabled: i >= 2 ? ['operation', 'calculation', 'sense_check'] : [...STEP_ORDER],
      sense_check_prompt: `Should the answer be bigger or smaller than ${total}?`,
    }
  }
  attempts.set(problem.attempt_id, { problem, wrong: {} })
  return problem
}

function getAttempt(id: number): MockAttempt {
  const found = attempts.get(id)
  if (found) return found
  // After a page reload the in-memory map is empty: rebuild from the saved session.
  const saved = (() => {
    try {
      const raw = localStorage.getItem('sm_student')
      return raw ? loadSession(raw) : null
    } catch {
      return null
    }
  })()
  if (saved && saved.problem.attempt_id === id) {
    const a = { problem: saved.problem, wrong: {} }
    attempts.set(id, a)
    return a
  }
  throw new ApiError(404, 'Attempt not found')
}

function isCorrect(problem: Problem, sub: StepSubmission): boolean {
  const total = problem.numbers.total
  const groups = problem.numbers.groups
  const r = sub.response as Record<string, unknown>
  switch (sub.step) {
    case 'facts': {
      const given = (r.given as string[]) ?? []
      const asked = (r.asked as string[]) ?? []
      const numberStrings = Object.values(problem.numbers).map(String)
      const needed = tokenize(problem.story, 's')
        .filter((t) => t.isNumber && numberStrings.includes(t.clean))
        .map((t) => t.id)
      const askedHasNumber = tokenize(problem.story, 's').some((t) => t.isNumber && asked.includes(t.id))
      return needed.every((id) => given.includes(id)) && asked.length > 0 && !askedHasNumber
    }
    case 'model': {
      const values = (r.values as Record<string, number>) ?? {}
      return r.model_type === problem.model_type && values.total === total && values.groups === groups
    }
    case 'operation':
      return r.operation === 'division'
    case 'calculation':
      return Number(r.answer) === total / groups
    case 'sense_check':
      return r.direction === 'smaller'
  }
}

export async function submitStep(attemptId: number, sub: StepSubmission): Promise<StepFeedback> {
  await delay()
  const a = getAttempt(attemptId)
  const steps = STEP_ORDER.filter((s) => a.problem.steps_enabled.includes(s))
  const idx = steps.indexOf(sub.step)
  if (isCorrect(a.problem, sub)) {
    const last = idx >= steps.length - 1
    return {
      correct: true,
      hint_level: 0,
      hint_text: null,
      next_step: last ? sub.step : steps[idx + 1],
      attempt_solved: last,
    }
  }
  const level = Math.min(3, (a.wrong[sub.step] ?? 0) + 1)
  a.wrong[sub.step] = level
  return {
    correct: false,
    hint_level: level,
    hint_text: HINTS[sub.step][level - 1],
    next_step: sub.step,
    attempt_solved: false,
  }
}

export async function finish(): Promise<void> {
  await delay(100)
}

export async function getTeacherMap(classCode: string): Promise<any> {
  await delay(200)
  return {
    class_code: classCode,
    structures: [
      'equal_sharing',
      'equal_groups',
      'difference_comparison',
      'unit_rate',
      'fraction_of_a_quantity',
      'perimeter_area',
    ],
    steps: ['facts', 'model', 'operation', 'calculation', 'sense_check'],
    matrix: {
      equal_sharing: { facts: 0, model: 3, operation: 7, calculation: 0, sense_check: 0 },
      equal_groups: { facts: 0, model: 0, operation: 0, calculation: 0, sense_check: 0 },
      difference_comparison: { facts: 0, model: 0, operation: 3, calculation: 0, sense_check: 6 },
      unit_rate: { facts: 0, model: 5, operation: 3, calculation: 0, sense_check: 0 },
      fraction_of_a_quantity: { facts: 0, model: 0, operation: 0, calculation: 4, sense_check: 0 },
      perimeter_area: { facts: 0, model: 3, operation: 0, calculation: 0, sense_check: 2 },
    },
  }
}

export async function getTeacherGroups(classCode: string): Promise<any> {
  await delay(200)
  return {
    class_code: classCode,
    groups: [
      { structure: 'equal_sharing', failure_count: 10, students: ['S-101', 'S-102', 'S-103'] },
      { structure: 'unit_rate', failure_count: 8, students: ['S-104', 'S-105', 'S-106'] },
      { structure: 'fraction_of_a_quantity', failure_count: 4, students: ['S-107', 'S-108'] },
      { structure: 'difference_comparison', failure_count: 9, students: ['S-109', 'S-110'] },
      { structure: 'perimeter_area', failure_count: 5, students: ['S-111', 'S-112'] },
    ],
  }
}

export async function overrideDiagnosis(payload: any): Promise<any> {
  await delay(100)
  return {
    status: 'success',
    event_id: payload.event_id,
    message: 'Teacher diagnosis override recorded successfully.',
  }
}
