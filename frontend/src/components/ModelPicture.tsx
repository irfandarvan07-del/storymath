import { useTranslation } from 'react-i18next'
import type { ModelType } from '../api/types'

export interface PictureEntry {
  key: string
  label: string
  /** null while the slot is still empty */
  value: number | null
}

/**
 * Plain-SVG pictures for the three models. They draw only what the student has
 * placed so far, so the picture grows as the student fills the boxes.
 */
export function ModelPicture({ type, entries }: { type: ModelType; entries: PictureEntry[] }) {
  const { t } = useTranslation()
  const label = t('model.pictureLabel')
  if (type === 'bar_model') return <BarModel entries={entries} label={label} />
  if (type === 'groups_picture') return <GroupsPicture entries={entries} label={label} />
  return <NumberLine entries={entries} label={label} />
}

function BarModel({ entries, label }: { entries: PictureEntry[]; label: string }) {
  const rowH = 34
  const gap = 10
  const height = entries.length * (rowH + gap) + gap
  const filled = entries.filter((e) => e.value !== null).map((e) => e.value as number)
  const max = Math.max(1, ...filled)
  return (
    <svg viewBox={`0 0 320 ${height}`} className="w-full" role="img" aria-label={label}>
      {entries.map((e, i) => {
        const y = gap + i * (rowH + gap)
        const w = e.value === null ? 110 : 40 + (e.value / max) * 190
        return (
          <g key={e.key}>
            <text x={4} y={y + rowH / 2 + 4} fontSize={11} className="fill-ink">
              {e.label}
            </text>
            <rect
              x={78}
              y={y}
              width={w}
              height={rowH}
              rx={8}
              className={e.value === null ? 'fill-none stroke-ink/40' : 'fill-brand'}
              strokeWidth={2}
              strokeDasharray={e.value === null ? '6 4' : undefined}
            />
            <text
              x={78 + w / 2}
              y={y + rowH / 2 + 6}
              textAnchor="middle"
              fontSize={18}
              fontWeight={700}
              className={e.value === null ? 'fill-ink/50' : 'fill-white'}
            >
              {e.value ?? '?'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function GroupsPicture({ entries, label }: { entries: PictureEntry[]; label: string }) {
  const nums = entries.filter((e) => e.value !== null).map((e) => e.value as number)
  const total = nums.length ? Math.max(...nums) : null
  const groups = nums.length > 1 ? Math.min(...nums) : null
  const count = groups === null ? 3 : Math.min(12, Math.max(1, Math.round(groups)))
  const cols = 4
  const rows = Math.ceil(count / cols)
  const height = rows * 54 + 8 + 30
  return (
    <svg viewBox={`0 0 320 ${height}`} className="w-full" role="img" aria-label={label}>
      {Array.from({ length: count }, (_, i) => {
        const x = 8 + (i % cols) * 78
        const y = 8 + Math.floor(i / cols) * 54
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={70}
              height={46}
              rx={10}
              className={groups === null ? 'fill-none stroke-ink/40' : 'fill-brand-light stroke-brand'}
              strokeWidth={2}
              strokeDasharray={groups === null ? '6 4' : undefined}
            />
            <text x={x + 35} y={y + 30} textAnchor="middle" fontSize={20} fontWeight={700} className="fill-brand-dark">
              ?
            </text>
          </g>
        )
      })}
      <text x={160} y={height - 8} textAnchor="middle" fontSize={14} fontWeight={700} className="fill-ink">
        {total ?? '?'}
      </text>
    </svg>
  )
}

function NumberLine({ entries, label }: { entries: PictureEntry[]; label: string }) {
  const x0 = 24
  const x1 = 296
  const y = 80
  const filled = entries.filter((e) => e.value !== null) as Array<PictureEntry & { value: number }>
  const max = Math.max(1, ...filled.map((e) => e.value))
  const pos = (v: number) => x0 + (v / max) * (x1 - x0)
  return (
    <svg viewBox="0 0 320 140" className="w-full" role="img" aria-label={label}>
      <line x1={x0} y1={y} x2={x1} y2={y} strokeWidth={4} strokeLinecap="round" className="stroke-ink" />
      <line x1={x0} y1={y - 8} x2={x0} y2={y + 8} strokeWidth={3} className="stroke-ink" />
      <text x={x0} y={y + 26} textAnchor="middle" fontSize={12} className="fill-ink">
        0
      </text>
      {filled.map((e, i) => {
        const up = i % 2 === 0
        return (
          <g key={e.key}>
            <circle cx={pos(e.value)} cy={y} r={8} className="fill-brand" />
            <text
              x={pos(e.value)}
              y={up ? y - 18 : y + 30}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              className="fill-ink"
            >
              {e.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Small icon for the model picker buttons. */
export function ModelIcon({ type }: { type: ModelType }) {
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-16" aria-hidden="true">
      {type === 'bar_model' && (
        <>
          <rect x={4} y={6} width={56} height={12} rx={4} className="fill-brand" />
          <rect x={4} y={24} width={34} height={12} rx={4} className="fill-sun" />
        </>
      )}
      {type === 'groups_picture' && (
        <>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={4 + i * 20} y={8} width={16} height={24} rx={4} className="fill-brand-light stroke-brand" strokeWidth={2} />
          ))}
        </>
      )}
      {type === 'number_line' && (
        <>
          <line x1={4} y1={22} x2={60} y2={22} strokeWidth={3} className="stroke-ink" />
          <circle cx={18} cy={22} r={5} className="fill-brand" />
          <circle cx={48} cy={22} r={5} className="fill-sun" />
        </>
      )}
    </svg>
  )
}
