import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { StepProgress } from '../../components/StepProgress'
import { ErrorState, LoadingState } from '../../components/States'
import { StepPanel } from './StepPanel'
import { TransferScreen } from './TransferScreen'
import { useSolve } from './useSolve'

interface Props {
  studentCode: string
  onLeave: () => void
}

export function SolvePage({ studentCode, onLeave }: Props) {
  const { t } = useTranslation()
  const s = useSolve(studentCode)

  return (
    <AppShell studentCode={studentCode} onLeave={onLeave}>
      {s.status === 'loading' && <LoadingState />}

      {s.status === 'error' && <ErrorState kind={s.errorKind} onRetry={() => void s.startNext()} />}

      {s.status === 'ready' && s.problem && s.step && (
        <>
          {/* Diagnostic Context Header */}
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="rounded-full bg-brand-light px-3 py-1 text-brand-dark uppercase tracking-wider border border-brand/20">
              📐 {s.problem.structure.replace(/_/g, ' ')}
            </span>
            <button
              type="button"
              onClick={() => void s.startNext()}
              className="text-xs font-semibold text-ink/60 hover:text-brand hover:underline"
              title="Skip to next problem structure"
            >
              Next Story →
            </button>
          </div>

          <StepProgress steps={s.steps} currentIndex={s.stepIdx} />
          <StepPanel
            key={`${s.problem.attempt_id}-${s.step}`}
            problem={s.problem}
            step={s.step}
            marks={s.marks}
            onMarks={s.setMarks}
            hints={s.hints}
            verdict={s.verdict}
            busy={s.busy}
            onSubmit={(response, marks) => void s.submit(response, marks)}
          />

          <div className="text-center pt-2">
            <Link
              to="/teacher"
              className="text-[11px] font-semibold text-ink/50 hover:text-brand hover:underline"
            >
              View Class Heatmap & Diagnostics (Teacher Mode) →
            </Link>
          </div>
        </>
      )}

      {s.status === 'solved' && (
        <TransferScreen
          structure={s.problem?.structure ?? ''}
          solvedCount={s.solvedCount}
          onNext={() => void s.startNext()}
          onDone={s.endSession}
        />
      )}

      {s.status === 'finished' && (
        <div className="card space-y-4 py-10 text-center" data-testid="finished">
          <p className="text-6xl animate-bounce" aria-hidden="true">
            👏
          </p>
          <h2 className="text-2xl font-black text-ink" data-testid="finished-title">
            {t('finished.title')}
          </h2>
          <p className="text-ink/70">{t('finished.subtitle')}</p>
          <div className="pt-2 space-y-2">
            <button type="button" className="btn-primary" onClick={() => void s.startNext()}>
              {t('finished.again')} →
            </button>
            <Link to="/teacher" className="btn-secondary block text-center">
              Open Teacher Dashboard
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  )
}
