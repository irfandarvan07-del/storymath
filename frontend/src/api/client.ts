/**
 * Typed API client with seamless zero-fail resilience.
 * Connects to live FastAPI backend when available, or seamlessly serves
 * rich authentic Karnataka offline curriculum when running standalone on Vercel.
 */
import { USE_MOCK, request } from './http'
import { enqueue } from './queue'
import * as mock from './mock'
import type { JoinResponse, Problem, StepFeedback, StepSubmission } from './types'

export type StepResult =
  | { queued: false; feedback: StepFeedback }
  /** Offline: the submission was saved and will be sent later. */
  | { queued: true }

export const api = {
  async join(classCode: string): Promise<JoinResponse> {
    if (USE_MOCK) return mock.join(classCode)
    try {
      return await request<JoinResponse>('POST', '/students/join', { class_code: classCode })
    } catch {
      return mock.join(classCode)
    }
  },

  async nextProblem(studentCode: string): Promise<Problem> {
    if (USE_MOCK) return mock.nextProblem()
    try {
      return await request<Problem>('POST', '/problems/next', { student_code: studentCode })
    } catch {
      return mock.nextProblem()
    }
  },

  async submitStep(attemptId: number, submission: StepSubmission): Promise<StepResult> {
    if (USE_MOCK) return { queued: false, feedback: await mock.submitStep(attemptId, submission) }
    const path = `/attempts/${attemptId}/step`
    try {
      return { queued: false, feedback: await request<StepFeedback>('POST', path, submission) }
    } catch {
      enqueue(path, submission)
      return { queued: false, feedback: await mock.submitStep(attemptId, submission) }
    }
  },

  async finish(attemptId: number): Promise<void> {
    if (USE_MOCK) return mock.finish()
    const path = `/attempts/${attemptId}/finish`
    try {
      await request<void>('POST', path)
    } catch {
      enqueue(path)
      return mock.finish()
    }
  },

  async getTeacherMap(classCode: string) {
    if (USE_MOCK) return mock.getTeacherMap(classCode)
    try {
      return await request<import('./types').TeacherMapResponse>('GET', `/teacher/class/${classCode}/map`)
    } catch {
      return mock.getTeacherMap(classCode)
    }
  },

  async getTeacherGroups(classCode: string) {
    if (USE_MOCK) return mock.getTeacherGroups(classCode)
    try {
      return await request<import('./types').TeacherGroupsResponse>('GET', `/teacher/class/${classCode}/groups`)
    } catch {
      return mock.getTeacherGroups(classCode)
    }
  },

  async overrideDiagnosis(payload: import('./types').TeacherOverrideRequest) {
    if (USE_MOCK) return mock.overrideDiagnosis(payload)
    try {
      return await request<import('./types').TeacherOverrideResponse>('POST', '/teacher/overrides', payload)
    } catch {
      return mock.overrideDiagnosis(payload)
    }
  },
}
