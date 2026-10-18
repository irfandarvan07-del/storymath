/**
 * Rich mock backend with authentic Karnataka problem structures and offline fallback.
 * Allows full interactive exploration across all 6 mathematical structures.
 */
import { ApiError } from './http'
import { loadSession } from '../lib/session'
import { tokenize } from '../lib/tokens'
import { STEP_ORDER } from './types'
import type { JoinResponse, Problem, Step, StepFeedback, StepSubmission, Operation } from './types'

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms))

export interface RichProblemFixture extends Problem {
  category: string
  expectedOp: Operation
  expectedAnswer: number
  expectedSense: 'bigger' | 'smaller'
}

export const KARNATAKA_PROBLEMS: RichProblemFixture[] = [
  {
    attempt_id: 101,
    structure: 'equal_sharing',
    category: 'ISRO Spacecraft',
    model_type: 'groups_picture',
    story: 'ISRO URSC engineers have 48 solar sensors to mount equally across 4 satellite wings.',
    question: 'How many sensors will each satellite wing carry?',
    numbers: { total: 48, groups: 4 },
    steps_enabled: [...STEP_ORDER],
    sense_check_prompt: 'Should the sensors per wing be bigger or smaller than 48?',
    expectedOp: 'division',
    expectedAnswer: 12,
    expectedSense: 'smaller',
  },
  {
    attempt_id: 102,
    structure: 'equal_groups',
    category: 'Channapatna Toys',
    model_type: 'groups_picture',
    story: 'A Channapatna artisan crafts 8 wooden toy carts with 6 wheels on each cart.',
    question: 'How many wheels are needed altogether?',
    numbers: { groups: 8, items_per_group: 6 },
    steps_enabled: [...STEP_ORDER],
    sense_check_prompt: 'Should the total number of wheels be bigger or smaller than 8?',
    expectedOp: 'multiplication',
    expectedAnswer: 48,
    expectedSense: 'bigger',
  },
  {
    attempt_id: 103,
    structure: 'difference_comparison',
    category: 'Karnataka Heritage',
    model_type: 'bar_model',
    story: 'The Chamundi Hill stairs in Mysuru have 1000 stone steps, while the Bilikal Betta trek has 420 steps.',
    question: 'How many more steps does Chamundi Hill have than Bilikal Betta?',
    numbers: { larger: 1000, smaller: 420 },
    steps_enabled: [...STEP_ORDER],
    sense_check_prompt: 'Should the step difference be bigger or smaller than 1000?',
    expectedOp: 'subtraction',
    expectedAnswer: 580,
    expectedSense: 'smaller',
  },
  {
    attempt_id: 104,
    structure: 'unit_rate',
    category: 'Chikmagalur Coffee',
    model_type: 'number_line',
    story: '5 kilograms of organic Chikmagalur coffee beans cost 1750 rupees at the hill plantation.',
    question: 'What is the cost of 1 kilogram of coffee beans?',
    numbers: { total_cost: 1750, quantity: 5 },
    steps_enabled: [...STEP_ORDER],
    sense_check_prompt: 'Should the cost for 1 kilogram be bigger or smaller than 1750 rupees?',
    expectedOp: 'division',
    expectedAnswer: 350,
    expectedSense: 'smaller',
  },
  {
    attempt_id: 105,
    structure: 'fraction_of_a_quantity',
    category: 'Cricket at Chinnaswamy',
    model_type: 'bar_model',
    story: 'In a 20 over cricket match at Chinnaswamy Stadium, the bowling team has bowled 15 overs.',
    question: 'If they finished 3 fourths of the 20 overs, how many overs have been bowled so far?',
    numbers: { total: 20, parts: 15 },
    steps_enabled: [...STEP_ORDER],
    sense_check_prompt: 'Should the completed overs be bigger or smaller than 20?',
    expectedOp: 'division',
    expectedAnswer: 15,
    expectedSense: 'smaller',
  },
  {
    attempt_id: 106,
    structure: 'perimeter_area',
    category: 'Lalbagh Gardens',
    model_type: 'bar_model',
    story: 'A rectangular flower display near the Lalbagh Glass House is 12 metres long and 8 metres wide.',
    question: 'What is the area of the flower display in square metres?',
    numbers: { length: 12, width: 8 },
    steps_enabled: [...STEP_ORDER],
    sense_check_prompt: 'Should the total area in square metres be bigger or smaller than 12?',
    expectedOp: 'multiplication',
    expectedAnswer: 96,
    expectedSense: 'bigger',
  },
  {
    attempt_id: 107,
    structure: 'equal_sharing',
    category: 'Mysore Pak Sweets',
    model_type: 'groups_picture',
    story: 'A sweet master in Mysuru distributes 72 pieces of royal Mysore Pak equally into 6 festive boxes.',
    question: 'How many pieces of Mysore Pak go into each box?',
    numbers: { total: 72, groups: 6 },
    steps_enabled: [...STEP_ORDER],
    sense_check_prompt: 'Should one festive box hold bigger or smaller than 72 pieces?',
    expectedOp: 'division',
    expectedAnswer: 12,
    expectedSense: 'smaller',
  },
  {
    attempt_id: 108,
    structure: 'equal_groups',
    category: 'Namma Metro',
    model_type: 'groups_picture',
    story: 'On the Bengaluru Namma Metro Purple Line, 9 commuter trains operate with 6 coaches each.',
    question: 'How many metro coaches are in service altogether?',
    numbers: { groups: 9, items_per_group: 6 },
    steps_enabled: [...STEP_ORDER],
    sense_check_prompt: 'Should the total coaches be bigger or smaller than 9?',
    expectedOp: 'multiplication',
    expectedAnswer: 54,
    expectedSense: 'bigger',
  },
]

const HINTS: Record<Step, [string, string, string]> = {
  facts: [
    'Which numbers does the story give you? Which part asks what to find?',
    'Mark the numbers in the story as given. Mark what the question asks as asked.',
    'Carefully tap the numbers to highlight them as Given facts, then tap the question sentence.',
  ],
  model: [
    'Look at the relationship between the quantities.',
    'Place the numbers from your tray into the matching boxes of the visual model.',
    'Notice if the whole is being divided into equal parts, multiplied into groups, or compared.',
  ],
  operation: [
    'Think about whether the answer is combining equal groups, sharing a whole, or finding a gap.',
    'Division splits a total equally. Multiplication groups equal items. Subtraction finds differences.',
    'Select the arithmetic operation that matches the physical situation.',
  ],
  calculation: [
    'Take your time with the numbers you selected.',
    'Double check your arithmetic steps carefully.',
    'Perform the calculation using the values from the problem.',
  ],
  sense_check: [
    'Does your answer make physical sense in this real-world scenario?',
    'Think about whether a single share or part should be bigger or smaller than the starting total.',
    'Compare your final number to the original given quantities.',
  ],
}

interface MockAttempt {
  problem: RichProblemFixture
  wrong: Partial<Record<Step, number>>
}
const attempts = new Map<number, MockAttempt>()
let served = 0

export async function join(classCode: string): Promise<JoinResponse> {
  await delay()
  if (classCode.trim().length < 3) throw new ApiError(404, 'Class not found')
  return { student_code: `S-${1000 + Math.floor(Math.random() * 9000)}` }
}

export async function nextProblem(preferredIndex?: number): Promise<Problem> {
  await delay(250)
  const idx = typeof preferredIndex === 'number' ? preferredIndex % KARNATAKA_PROBLEMS.length : served++ % KARNATAKA_PROBLEMS.length
  const template = KARNATAKA_PROBLEMS[idx]
  const problem: RichProblemFixture = {
    ...template,
    attempt_id: 1000 + served,
  }
  attempts.set(problem.attempt_id, { problem, wrong: {} })
  return problem
}

function getAttempt(id: number): MockAttempt {
  const found = attempts.get(id)
  if (found) return found
  const saved = (() => {
    try {
      const raw = localStorage.getItem('sm_student')
      return raw ? loadSession(raw) : null
    } catch {
      return null
    }
  })()
  if (saved && saved.problem.attempt_id === id) {
    const matching = KARNATAKA_PROBLEMS.find((p) => p.structure === saved.problem.structure) || KARNATAKA_PROBLEMS[0]
    const a: MockAttempt = { problem: { ...matching, ...saved.problem }, wrong: {} }
    attempts.set(id, a)
    return a
  }
  // Default fallback attempt
  const def = KARNATAKA_PROBLEMS[0]
  const a: MockAttempt = { problem: { ...def, attempt_id: id }, wrong: {} }
  attempts.set(id, a)
  return a
}

function isCorrect(problem: RichProblemFixture, sub: StepSubmission): boolean {
  const r = sub.response as Record<string, unknown>
  const nums = Object.values(problem.numbers).map(Number)

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
      const placedNums = Object.values(values).map(Number)
      return nums.every((n) => placedNums.includes(n)) || Object.keys(values).length >= 1
    }
    case 'operation': {
      if (problem.structure === 'fraction_of_a_quantity') {
        return r.operation === 'division' || r.operation === 'multiplication'
      }
      return r.operation === problem.expectedOp
    }
    case 'calculation': {
      const userAns = Number(r.answer)
      return Math.abs(userAns - problem.expectedAnswer) < 0.1
    }
    case 'sense_check': {
      return r.direction === problem.expectedSense
    }
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
      equal_sharing: { facts: 1, model: 3, operation: 8, calculation: 1, sense_check: 0 },
      equal_groups: { facts: 0, model: 1, operation: 2, calculation: 0, sense_check: 1 },
      difference_comparison: { facts: 0, model: 2, operation: 4, calculation: 0, sense_check: 6 },
      unit_rate: { facts: 0, model: 5, operation: 3, calculation: 1, sense_check: 0 },
      fraction_of_a_quantity: { facts: 1, model: 1, operation: 2, calculation: 5, sense_check: 0 },
      perimeter_area: { facts: 0, model: 3, operation: 1, calculation: 1, sense_check: 2 },
    },
  }
}

export async function getTeacherGroups(classCode: string): Promise<any> {
  await delay(200)
  return {
    class_code: classCode,
    groups: [
      { structure: 'equal_sharing', failure_count: 13, students: ['S-101', 'S-102', 'S-103'] },
      { structure: 'difference_comparison', failure_count: 12, students: ['S-109', 'S-110'] },
      { structure: 'unit_rate', failure_count: 9, students: ['S-104', 'S-105', 'S-106'] },
      { structure: 'fraction_of_a_quantity', failure_count: 9, students: ['S-107', 'S-108'] },
      { structure: 'perimeter_area', failure_count: 7, students: ['S-111', 'S-112'] },
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
