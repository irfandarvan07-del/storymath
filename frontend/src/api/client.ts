/**
 * Typed API client with automatic offline resilience.
 * Connects to live FastAPI backend when available, or seamlessly serves
 * rich authentic Karnataka offline curriculum when running standalone on Vercel.
 */
import { NetworkError, USE_MOCK, request } from './http'
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
    } catch (e) {
      if (e instanceof NetworkError) return mock.join(classCode)
      throw e
    }
  },

  async nextProblem(studentCode: string): Promise<Problem> {
    if (USE_MOCK) return mock.nextProblem()
    try {
      return await request<Problem>('POST', '/problems/next', { student_code: studentCode })
    } catch (e) {
      if (e instanceof NetworkError) return mock.nextProblem()
      throw e
    }
  },

  async submitStep(attemptId: number, submission: StepSubmission): Promise<StepResult> {
    if (USE_MOCK) return { queued: false, feedback: await mock.submitStep(attemptId, submission) }
    const path = `/attempts/${attemptId}/step`
    try {
      return { queued: false, feedback: await request<StepFeedback>('POST', path, submission) }
    } catch (e) {
      if (e instanceof NetworkError) {
        enqueue(path, submission)
        return { queued: false, feedback: await mock.submitStep(attemptId, submission) }
      }
      throw e
    }
  },

  async finish(attemptId: number): Promise<void> {
    if (USE_MOCK) return mock.finish()
    const path = `/attempts/${attemptId}/finish`
    try {
      await request<void>('POST', path)
    } catch (e) {
      if (e instanceof NetworkError) {
        enqueue(path)
        return mock.finish()
      }
      throw e
    }
  },

  async getTeacherMap(classCode: string) {
    if (USE_MOCK) return mock.getTeacherMap(classCode)
    try {
      return await request<import('./types').TeacherMapResponse>('GET', `/teacher/class/${classCode}/map`)
    } catch (e) {
      if (e instanceof NetworkError) return mock.getTeacherMap(classCode)
      throw e
    }
  },

  async getTeacherGroups(classCode: string) {
    if (USE_MOCK) return mock.getTeacherGroups(classCode)
    try {
      return await request<import('./types').TeacherGroupsResponse>('GET', `/teacher/class/${classCode}/groups`)
    } catch (e) {
      if (e instanceof NetworkError) return mock.getTeacherGroups(classCode)
      throw e
    }
  },

  async overrideDiagnosis(payload: import('./types').TeacherOverrideRequest) {
    if (USE_MOCK) return mock.overrideDiagnosis(payload)
    try {
      return await request<import('./types').TeacherOverrideResponse>('POST', '/teacher/overrides', payload)
    } catch (e) {
      if (e instanceof NetworkError) return mock.overrideDiagnosis(payload)
      throw e
    }
  },
}
