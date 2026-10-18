import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Marks, Operation, Problem, Step } from '../../api'
import { CalculationInput } from '../../components/CalculationInput'
import { FactTapper } from '../../components/FactTapper'
import { HintBox } from '../../components/HintBox'
import type { HintEntry } from '../../components/HintBox'
import { ModelBoard, emptyModelDraft } from '../../components/ModelBoard'
import { OperationPicker } from '../../components/OperationPicker'
import { SenseCheck } from '../../components/SenseCheck'
import { StoryCard } from '../../components/StoryCard'
import type { Verdict } from './useSolve'

interface Props {
  problem: Problem
  step: Step
  marks: Marks
  onMarks: (m: Marks) => void
  hints: HintEntry[]
  verdict: Verdict
  busy: boolean
  onSubmit: (response: Record<string, unknown>, marks?: Marks) => void
}

/**
 * One step of the solve flow. Render it with key={attempt-step} so the draft
 * resets for each new step but survives a wrong answer (the student retries).
 */
export function StepPanel({ problem, step, marks, onMarks, hints, verdict, busy, onSubmit }: Props) {
  const { t } = useTranslation()
  const [model, setModel] = useState(emptyModelDraft)
  const [op, setOp] = useState<Operation | null>(null)
  const [calc, setCalc] = useState('')

  const locked = busy || verdict === 'correct' || verdict === 'queued'

  const submitFacts = () => {
    const ids = Object.keys(marks)
    onSubmit({
      given: ids.filter((id) => marks[id] === 'given'),
      asked: ids.filter((id) => marks[id] === 'asked'),
    })
  }

  const modelReady = Boolean(model.model_type) && Object.keys(problem.numbers).every((k) => model.placed[k])
  const submitModel = () => {
    const values: Record<string, number> = {}
    for (const k of Object.keys(problem.numbers)) {
      const chip = model.placed[k]
      if (chip) values[k] = problem.numbers[chip]
    }
    onSubmit({ model_type: model.model_type, values })
  }

  const calcValue = Number(calc)
  const calcReady = calc !== '' && calc !== '.' && Number.isFinite(calcValue)
  const submitCalc = () => {
    if (calcReady) onSubmit({ answer: calcValue })
  }

  const hasMarks = Object.values(marks).includes('given') && Object.values(marks).includes('asked')

  let canCheck = false
  let onCheck: () => void = () => undefined
  if (step === 'facts') [canCheck, onCheck] = [hasMarks, submitFacts]
  if (step === 'model') [canCheck, onCheck] = [modelReady, submitModel]
  if (step === 'operation') [canCheck, onCheck] = [op !== null, () => op && onSubmit({ operation: op })]
  if (step === 'calculation') [canCheck, onCheck] = [calcReady, submitCalc]

  return (
    <section className="space-y-4" data-testid={`step-${step}`}>
      <div>
        <h2 className="text-2xl font-extrabold">{t(`step.${step}.title`)}</h2>
        <p className="text-ink/70">{t(`step.${step}.help`)}</p>
      </div>

      {step === 'facts' && (
        <FactTapper story={problem.story} question={problem.question} marks={marks} onChange={onMarks} />
      )}
      {step !== 'facts' && <StoryCard story={problem.story} question={problem.question} marks={marks} />}

      {step === 'model' && (
        <ModelBoard numbers={problem.numbers} value={model} onChange={setModel} disabled={locked} />
      )}
      {step === 'operation' && <OperationPicker value={op} onChange={setOp} disabled={locked} />}
      {step === 'calculation' && (
        <CalculationInput value={calc} onChange={setCalc} onEnter={submitCalc} disabled={locked} />
      )}
      {step === 'sense_check' && (
        <SenseCheck prompt={problem.sense_check_prompt} disabled={locked} onChoose={(d) => onSubmit({ direction: d })} />
      )}

      <VerdictBanner verdict={verdict} />
      <HintBox hints={hints} />

      {step !== 'sense_check' && (
        <button type="button" className="btn-primary" data-testid="check-button" disabled={!canCheck || locked} onClick={onCheck}>
          {t('common.check')}
        </button>
      )}
    </section>
  )
}

function VerdictBanner({ verdict }: { verdict: Verdict }) {
  const { t } = useTranslation()
  if (verdict === 'idle') return null
  const style: Record<Exclude<Verdict, 'idle'>, string> = {
    correct: 'bg-given-light text-ink',
    wrong: 'bg-asked-light text-ink',
    queued: 'bg-sun-light text-ink',
    error: 'bg-asked-light text-ink',
  }
  return (
    <p className={`rounded-xl px-4 py-3 text-lg font-bold ${style[verdict]}`} role="status" data-testid={`verdict-${verdict}`}>
      {t(`verdict.${verdict}`)}
    </p>
  )
}
