
interface HeatmapMatrixProps {
  structures: string[]
  steps: string[]
  matrix: Record<string, Record<string, number>>
  onSelectCell?: (structure: string, step: string, count: number) => void
}

const STRUCTURE_LABELS: Record<string, string> = {
  equal_sharing: 'Equal Sharing',
  equal_groups: 'Equal Groups',
  difference_comparison: 'Difference Comparison',
  unit_rate: 'Unit Rate',
  fraction_of_a_quantity: 'Fraction of Quantity',
  perimeter_area: 'Perimeter / Area',
}

const STEP_LABELS: Record<string, string> = {
  facts: '1. Facts',
  model: '2. Model',
  operation: '3. Operation',
  calculation: '4. Calculation',
  sense_check: '5. Sense Check',
}

export function HeatmapMatrix({ structures, steps, matrix, onSelectCell }: HeatmapMatrixProps) {
  // Helper to determine heatmap intensity
  const getCellBg = (count: number) => {
    if (count === 0) return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
    if (count <= 2) return 'bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200'
    if (count <= 4) return 'bg-orange-200 text-orange-950 font-bold hover:bg-orange-300'
    return 'bg-rose-500 text-white font-extrabold hover:bg-rose-600 shadow-sm'
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
          <tr>
            <th className="py-3 px-4 w-56">Mathematical Structure</th>
            {steps.map((st) => (
              <th key={st} className="py-3 px-4 text-center">
                {STEP_LABELS[st] || st}
              </th>
            ))}
            <th className="py-3 px-4 text-center text-slate-500 font-medium">Row Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {structures.map((struct) => {
            const row = matrix[struct] || {}
            const rowTotal = steps.reduce((sum, st) => sum + (row[st] || 0), 0)

            return (
              <tr key={struct} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-800">
                  {STRUCTURE_LABELS[struct] || struct.replace(/_/g, ' ')}
                </td>
                {steps.map((step) => {
                  const count = row[step] || 0
                  return (
                    <td key={step} className="p-1.5 text-center">
                      <button
                        onClick={() => onSelectCell?.(struct, step, count)}
                        className={`w-full py-2.5 rounded-lg text-center transition-all cursor-pointer ${getCellBg(
                          count
                        )}`}
                        title={`${count} failures at step '${step}' for ${struct}`}
                      >
                        {count > 0 ? count : '—'}
                      </button>
                    </td>
                  )
                })}
                <td className="py-3 px-4 text-center font-bold text-slate-700">
                  {rowTotal}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Heatmap legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Misconception Failure Intensity:</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-emerald-50 border border-emerald-200" /> 0 (Mastered)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-amber-100 border border-amber-300" /> 1–2 (Minor slip)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-orange-200 border border-orange-400" /> 3–4 (Frequent)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-rose-500" /> 5+ (Primary Block)
          </span>
        </div>
      </div>
    </div>
  )
}
