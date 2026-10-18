import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ModelType } from '../api/types'
import { ModelIcon, ModelPicture } from './ModelPicture'

export interface ModelDraft {
  model_type: ModelType | null
  /** slot key -> key of the number chip placed there (or null) */
  placed: Record<string, string | null>
}

export const emptyModelDraft: ModelDraft = { model_type: null, placed: {} }

const MODEL_TYPES: ModelType[] = ['groups_picture', 'bar_model', 'number_line']

interface Props {
  /** the problem's numbers; the board only shows them, it never knows the answer */
  numbers: Record<string, number>
  value: ModelDraft
  onChange: (draft: ModelDraft) => void
  disabled?: boolean
}

/** Step "model": pick a model, then drag (or tap) each number into its box. */
export function ModelBoard({ numbers, value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const keys = Object.keys(numbers)
  const [selected, setSelected] = useState<string | null>(null)

  // Drag works with mouse and touch; tapping a number then a box works everywhere.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  )

  const used = new Set(Object.values(value.placed).filter(Boolean) as string[])
  const tray = keys.filter((k) => !used.has(k)).sort((a, b) => numbers[a] - numbers[b])

  const place = (slot: string, chip: string) => {
    const placed = { ...value.placed }
    for (const k of keys) if (placed[k] === chip) placed[k] = null
    placed[slot] = chip
    onChange({ ...value, placed })
    setSelected(null)
  }

  const clearSlot = (slot: string) => {
    onChange({ ...value, placed: { ...value.placed, [slot]: null } })
  }

  const onSlotClick = (slot: string) => {
    if (disabled) return
    if (selected) place(slot, selected)
    else if (value.placed[slot]) clearSlot(slot)
  }

  const onDragEnd = (e: DragEndEvent) => {
    if (disabled || !e.over) return
    place(String(e.over.id), String(e.active.id))
  }

  const slotLabel = (k: string) => t(`keys.${k}`, { defaultValue: k.replace(/_/g, ' ') })

  const entries = keys.map((k) => {
    const chip = value.placed[k]
    return { key: k, label: slotLabel(k), value: chip ? numbers[chip] : null }
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" role="group">
        {MODEL_TYPES.map((m) => (
          <button
            key={m}
            type="button"
            data-testid={`model-${m}`}
            aria-pressed={value.model_type === m}
            disabled={disabled}
            onClick={() => onChange({ ...value, model_type: m })}
            className={`flex min-h-[80px] flex-col items-center justify-center rounded-2xl border-4 px-1 py-2 text-sm font-bold ${
              value.model_type === m ? 'border-brand bg-brand-light' : 'border-ink/15 bg-white'
            }`}
          >
            <ModelIcon type={m} />
            {t(`model.${m}`)}
          </button>
        ))}
      </div>

      {value.model_type && (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="card space-y-3">
            <ModelPicture type={value.model_type} entries={entries} />
            <p className="text-sm text-ink/70">{t('model.placeHelp')}</p>

            <div className="grid grid-cols-2 gap-2">
              {keys.map((k) => (
                <Slot
                  key={k}
                  id={k}
                  label={slotLabel(k)}
                  chipLabel={value.placed[k] ? String(numbers[value.placed[k] as string]) : null}
                  armed={Boolean(selected)}
                  onClick={() => onSlotClick(k)}
                />
              ))}
            </div>

            <div className="flex min-h-[64px] flex-wrap items-center gap-2" aria-label={t('model.numbers')}>
              {tray.map((k) => (
                <Chip
                  key={k}
                  id={k}
                  label={String(numbers[k])}
                  selected={selected === k}
                  disabled={disabled}
                  onClick={() => setSelected(selected === k ? null : k)}
                />
              ))}
            </div>
          </div>
        </DndContext>
      )}
    </div>
  )
}

function Chip({
  id,
  label,
  selected,
  disabled,
  onClick,
}: {
  id: string
  label: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled })
  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid={`chip-${id}`}
      {...listeners}
      {...attributes}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        touchAction: 'none',
        zIndex: isDragging ? 30 : undefined,
      }}
      className={`min-h-[56px] min-w-[72px] rounded-2xl border-4 bg-sun-light px-4 text-2xl font-extrabold shadow ${
        selected ? 'border-ink' : 'border-sun'
      } ${isDragging ? 'scale-110' : ''}`}
    >
      {label}
    </button>
  )
}

function Slot({
  id,
  label,
  chipLabel,
  armed,
  onClick,
}: {
  id: string
  label: string
  chipLabel: string | null
  armed: boolean
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid={`slot-${id}`}
      onClick={onClick}
      className={`flex min-h-[72px] flex-col items-center justify-center rounded-2xl border-4 border-dashed px-2 ${
        isOver || armed ? 'border-brand bg-brand-light' : chipLabel ? 'border-brand bg-white' : 'border-ink/30 bg-white'
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-wide text-ink/70">{label}</span>
      <span className="text-3xl font-extrabold">{chipLabel ?? '?'}</span>
    </button>
  )
}
