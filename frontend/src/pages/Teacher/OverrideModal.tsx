import React, { useState } from 'react'
import { api } from '../../api/client'
import { STEP_ORDER, Step } from '../../api/types'

interface OverrideModalProps {
  onClose: () => void
  onSuccess: (message: string) => void
}

export function OverrideModal({ onClose, onSuccess }: OverrideModalProps) {
  const [eventId, setEventId] = useState<string>('')
  const [correctedStep, setCorrectedStep] = useState<Step>('operation')
  const [teacherNote, setTeacherNote] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const idNum = parseInt(eventId.trim(), 10)
    if (isNaN(idNum) || idNum <= 0) {
      setError('Please enter a valid numeric Event ID.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const res = await api.overrideDiagnosis({
        event_id: idNum,
        corrected_step: correctedStep,
        teacher_note: teacherNote.trim() || undefined,
      })
      onSuccess(res.message || 'Diagnosis successfully overridden.')
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to submit override.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Override Logged Diagnosis</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Step Event ID
            </label>
            <input
              type="number"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="e.g. 104"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teacher Diagnosed True Failure Step
            </label>
            <select
              value={correctedStep}
              onChange={(e) => setCorrectedStep(e.target.value as Step)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {STEP_ORDER.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teacher Clinical Observation Note (Optional)
            </label>
            <textarea
              rows={3}
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="e.g. Student understood the model, but slipped on mental division by 4."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {submitting ? 'Saving...' : 'Save Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
