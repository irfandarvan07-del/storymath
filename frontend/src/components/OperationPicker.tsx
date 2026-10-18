import { useTranslation } from 'react-i18next'
import type { Operation } from '../api/types'

const OPS: Array<{ op: Operation; symbol: string }> = [
  { op: 'addition', symbol: '+' },
  { op: 'subtraction', symbol: '−' },
  { op: 'multiplication', symbol: '×' },
  { op: 'division', symbol: '÷' },
]

interface Props {
  value: Operation | null
  onChange: (op: Operation) => void
  disabled?: boolean
}

/** Step "operation": one big button per operation. */
export function OperationPicker({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-3" role="group">
      {OPS.map(({ op, symbol }) => (
        <button
          key={op}
          type="button"
          data-testid={`op-${op}`}
          aria-pressed={value === op}
          disabled={disabled}
          onClick={() => onChange(op)}
          className={`flex min-h-[88px] flex-col items-center justify-center rounded-2xl border-4 text-lg font-bold ${
            value === op ? 'border-brand bg-brand-light' : 'border-ink/15 bg-white'
          }`}
        >
          <span className="text-4xl leading-none">{symbol}</span>
          {t(`operation.${op}`)}
        </button>
      ))}
    </div>
  )
}
