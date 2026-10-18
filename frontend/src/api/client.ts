/**
 * Typed API client. Shared with Person D (teacher pages reuse `request`).
 * The Claude API is never called from here: the frontend only talks to our backend.
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
  join(classCode: string): Promise<JoinResponse> {
    if (USE_MOCK) return mock.join(classCode)
    return request<JoinResponse>('POST', '/students/join', { class_code: classCode })
  },

  nextProblem(studentCode: string): Promise<Problem> {
    if (USE_MOCK) return mock.nextProblem()
    return request<Problem>('POST', '/problems/next', { student_code: studentCode })
  },

  async submitStep(attemptId: number, submission: StepSubmission): Promise<StepResult> {
    if (USE_MOCK) return { queued: false, feedback: await mock.submitStep(attemptId, submission) }
    const path = `/attempts/${attemptId}/step`
    try {
      return { queued: false, feedback: await request<StepFeedback>('POST', path, submission) }
    } catch (e) {
      if (e instanceof NetworkError) {
        enqueue(path, submission)
        return { queued: true }
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
      if (e instanceof NetworkError) enqueue(path)
      else throw e
    }
  },

  getTeacherMap(classCode: string) {
    if (USE_MOCK) return mock.getTeacherMap(classCode)
    return request<import('./types').TeacherMapResponse>('GET', `/teacher/class/${classCode}/map`)
  },

  getTeacherGroups(classCode: string) {
    if (USE_MOCK) return mock.getTeacherGroups(classCode)
    return request<import('./types').TeacherGroupsResponse>('GET', `/teacher/class/${classCode}/groups`)
  },

  overrideDiagnosis(payload: import('./types').TeacherOverrideRequest) {
    if (USE_MOCK) return mock.overrideDiagnosis(payload)
    return request<import('./types').TeacherOverrideResponse>('POST', '/teacher/overrides', payload)
  },
}
