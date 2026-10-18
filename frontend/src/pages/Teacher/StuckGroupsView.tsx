import type { TeacherStuckGroup } from '../../api/types'

interface StuckGroupsViewProps {
  groups: TeacherStuckGroup[]
}

const STRUCTURE_TITLES: Record<string, string> = {
  equal_sharing: 'Equal Sharing',
  equal_groups: 'Equal Groups',
  difference_comparison: 'Difference Comparison',
  unit_rate: 'Unit Rate',
  fraction_of_a_quantity: 'Fraction of a Quantity',
  perimeter_area: 'Perimeter and Area',
}

const REMEDIATION_ADVICE: Record<string, { summary: string; action: string }> = {
  equal_sharing: {
    summary: 'Students confuse sharing a total equally with multiplying groups.',
    action: 'Intervention: Use physical counters or group boxes to show dividing a known whole into equal shares.',
  },
  equal_groups: {
    summary: 'Students struggle recognizing repeated equal additions.',
    action: 'Intervention: Emphasize "number of groups" times "items in each group". Use grid picture models.',
  },
  difference_comparison: {
    summary: 'Students misread "more than" vs "fewer than" and pick the reverse operation.',
    action: 'Intervention: Have students draw dual comparison bars to visually spot which bar is longer.',
  },
  unit_rate: {
    summary: 'Students cannot identify whether to find the single unit price or total bulk cost.',
    action: 'Intervention: Teach the "One vs Many" rule using price tags and metro token stories.',
  },
  fraction_of_a_quantity: {
    summary: 'Students stop after step 1 (dividing by denominator) and forget the numerator.',
    action: 'Intervention: Two-step bar model: Divide total into denominator segments, then bracket numerator segments.',
  },
  perimeter_area: {
    summary: 'Students confuse 1D boundary fence line with 2D floor surface tiles.',
    action: 'Intervention: Trace outer boundary with a finger for perimeter; shade the inner tiles for area.',
  },
}

export function StuckGroupsView({ groups }: StuckGroupsViewProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
        <p className="text-slate-500 font-medium">No stuck student groups detected for this class!</p>
        <p className="text-xs text-slate-400 mt-1">Students are progressing without repeated misconception blocks.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map((group) => {
        const advice = REMEDIATION_ADVICE[group.structure] || {
          summary: 'Students require targeted practice on this structure.',
          action: 'Intervention: Review the visual model representation with the student group.',
        }

        return (
          <div
            key={group.structure}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {STRUCTURE_TITLES[group.structure] || group.structure.replace(/_/g, ' ')}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                  {group.failure_count} Failures Logged
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-3">{advice.summary}</p>

              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Affected Students ({group.students.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.students.map((code) => (
                    <span
                      key={code}
                      className="inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 bg-amber-50/60 -mx-5 -mb-5 p-4 rounded-b-xl">
              <p className="text-xs font-medium text-amber-900 leading-relaxed">
                <strong className="font-bold">Next Action:</strong> {advice.action}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
