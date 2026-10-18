/**
 * API types for the contract in docs/PROJECT.md section 9.
 *
 * STAND-IN: the rule is "never hand-write API types". Until Person B's
 * `openapi.json` exists, these mirror the contract exactly. Once it does:
 *   1. npm run gen:api            (writes src/api/schema.d.ts)
 *   2. replace the interfaces below with re-exports, e.g.
 *        import type { components } from './schema'
 *        export type Problem = components['schemas']['Problem']
 * Nothing else in the app needs to change.
 */

export type Step = 'facts' | 'model' | 'operation' | 'calculation' | 'sense_check'

/** Fixed order of steps. Step names are fixed by the contract. */
export const STEP_ORDER: Step[] = ['facts', 'model', 'operation', 'calculation', 'sense_check']

export type ModelType = 'groups_picture' | 'bar_model' | 'number_line'
export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division'

export interface Problem {
  attempt_id: number
  structure: string
  model_type: ModelType
  story: string
  question: string
  numbers: Record<string, number>
  steps_enabled: Step[]
  sense_check_prompt: string
}

export interface StepSubmission {
  step: Step
  response: Record<string, unknown>
}

export interface StepFeedback {
  correct: boolean
  hint_level: number
  hint_text: string | null
  next_step: Step
  attempt_solved: boolean
}

export interface JoinRequest {
  class_code: string
}

export interface JoinResponse {
  student_code: string
}

/** Local-only helper types (not part of the API). */
export type Mark = 'given' | 'asked'
export type Marks = Record<string, Mark>

/** Teacher Dashboard types (Person D) */
export interface TeacherMapResponse {
  class_code: string
  structures: string[]
  steps: string[]
  matrix: Record<string, Record<string, number>>
}

export interface TeacherStuckGroup {
  structure: string
  failure_count: number
  students: string[]
}

export interface TeacherGroupsResponse {
  class_code: string
  groups: TeacherStuckGroup[]
}

export interface TeacherOverrideRequest {
  event_id: number
  corrected_step?: string
  teacher_note?: string
}

export interface TeacherOverrideResponse {
  status: string
  event_id: number
  message: string
}
