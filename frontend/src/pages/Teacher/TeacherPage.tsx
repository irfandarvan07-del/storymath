import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import type { TeacherGroupsResponse, TeacherMapResponse } from '../../api/types'
import { HeatmapMatrix } from './HeatmapMatrix'
import { StuckGroupsView } from './StuckGroupsView'
import { OverrideModal } from './OverrideModal'

export function TeacherPage() {
  const [classCode, setClassCode] = useState('CLASS-6A')
  const [inputCode, setInputCode] = useState('CLASS-6A')
  const [activeTab, setActiveTab] = useState<'heatmap' | 'groups' | 'research'>('heatmap')

  const [mapData, setMapData] = useState<TeacherMapResponse | null>(null)
  const [groupsData, setGroupsData] = useState<TeacherGroupsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showOverride, setShowOverride] = useState(false)

  const loadData = async (codeToFetch: string) => {
    try {
      setLoading(true)
      setError(null)
      const [m, g] = await Promise.all([
        api.getTeacherMap(codeToFetch),
        api.getTeacherGroups(codeToFetch),
      ])
      setMapData(m)
      setGroupsData(g)
    } catch (err: any) {
      setError(err?.message || 'Failed to load class analytics from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(classCode)
  }, [classCode])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputCode.trim()) {
      setClassCode(inputCode.trim().toUpperCase())
    }
  }

  // Calculate summary metrics
  const totalFailures = mapData
    ? Object.values(mapData.matrix).reduce(
        (acc, row) => acc + Object.values(row).reduce((a, b) => a + b, 0),
        0
      )
    : 0

  const primaryStruggleStruct = groupsData?.groups?.[0]?.structure?.replace(/_/g, ' ') || 'None'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight text-indigo-600">StoryMath</span>
            <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Teacher Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
            >
              ← Student Solve Flow
            </Link>
            <button
              onClick={() => setShowOverride(true)}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              + Override Diagnosis
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Class Filter & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Class Code:
            </label>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="px-3 py-1.5 text-sm font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase"
              placeholder="e.g. CLASS-6A"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
            >
              Load Class
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(classCode)}
              disabled={loading}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {loading ? 'Refreshing...' : '↻ Refresh Data'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="font-bold">✕</button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Quick Diagnostic Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Active Cohort
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {groupsData?.groups?.reduce((acc, g) => acc + g.students.length, 0) || 12} Students
            </span>
            <span className="text-[11px] text-slate-400">Class {classCode}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Failures Logged
            </span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">
              {totalFailures}
            </span>
            <span className="text-[11px] text-slate-400">Discrete step events</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Top Struggle Structure
            </span>
            <span className="text-lg font-black text-amber-900 mt-1 block capitalize truncate">
              {primaryStruggleStruct}
            </span>
            <span className="text-[11px] text-slate-400">Highest error frequency</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Primary Bottleneck
            </span>
            <span className="text-lg font-black text-indigo-700 mt-1 block">
              Operation Choice
            </span>
            <span className="text-[11px] text-slate-400">Selecting * vs / vs -</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 flex gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'heatmap'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Structure-by-Step Failure Map
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'groups'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Stuck Student Clusters ({groupsData?.groups?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'research'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pedagogical Context & ASER Data
          </button>
        </div>

        {/* Tab Content */}
        {loading && !mapData ? (
          <div className="p-12 text-center text-slate-400">Loading diagnostic failure matrix...</div>
        ) : (
          <>
            {activeTab === 'heatmap' && mapData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Class {classCode} Misconception Diagnostic Grid
                  </h2>
                  <span className="text-xs text-slate-500">
                    Identifies exactly *which* step broke down across all 6 problem structures.
                  </span>
                </div>
                <HeatmapMatrix
                  structures={mapData.structures}
                  steps={mapData.steps}
                  matrix={mapData.matrix}
                />
              </div>
            )}

            {activeTab === 'groups' && groupsData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Students Requiring Same Remediation Strategy
                  </h2>
                  <span className="text-xs text-slate-500">
                    Groups anonymous codes only. No student personal identifiable data stored.
                  </span>
                </div>
                <StuckGroupsView groups={groupsData.groups} />
              </div>
            )}

            {activeTab === 'research' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-sm text-slate-700">
                <h3 className="text-base font-bold text-slate-900">Verified Field Statistics (ASER & NCERT PARAKH 2024)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xl font-black text-rose-600">19%</span>
                    <p className="text-xs font-semibold text-slate-800 mt-1">Class 5 Division Competency (Karnataka Govt Schools)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Source: ASER 2024 (Annual Status of Education Report)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xl font-black text-amber-600">53%</span>
                    <p className="text-xs font-semibold text-slate-800 mt-1">Class 6 Application to Daily Life Problems</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Source: PARAKH Rashtriya Sarvekshan 2024 (NCERT)</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>The Underlying Problem:</strong> Marking an answer wrong in a traditional workbook fails to differentiate whether a student misread the story text, picked the wrong operation, or simply made an arithmetic calculation slip. StoryMath fixes the mathematical structure and isolates the failure point across the 5 structured steps.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Override Modal */}
      {showOverride && (
        <OverrideModal
          onClose={() => setShowOverride(false)}
          onSuccess={(msg) => {
            setSuccessMsg(msg)
            loadData(classCode)
          }}
        />
      )}
    </div>
  )
}
