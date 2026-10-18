import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Mark, Marks } from '../api/types'
import { StoryCard } from './StoryCard'

interface Props {
  story: string
  question: string
  marks: Marks
  onChange: (marks: Marks) => void
}

/** Step "facts": choose Given or Asked, then tap words to mark them. */
export function FactTapper({ story, question, marks, onChange }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mark>('given')

  const tap = (id: string) => {
    const next = { ...marks }
    if (next[id] === mode) delete next[id]
    else next[id] = mode
    onChange(next)
  }

  const count = (m: Mark) => Object.values(marks).filter((x) => x === m).length

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('step.facts.help')}>
        <ModeButton mode="given" active={mode === 'given'} count={count('given')} onClick={() => setMode('given')} />
        <ModeButton mode="asked" active={mode === 'asked'} count={count('asked')} onClick={() => setMode('asked')} />
      </div>
      <StoryCard story={story} question={question} marks={marks} onTap={tap} />
    </div>
  )
}

function ModeButton({
  mode,
  active,
  count,
  onClick,
}: {
  mode: Mark
  active: boolean
  count: number
  onClick: () => void
}) {
  const { t } = useTranslation()
  const color =
    mode === 'given'
      ? active
        ? 'border-given bg-given-light'
        : 'border-ink/15 bg-white'
      : active
        ? 'border-asked bg-asked-light'
        : 'border-ink/15 bg-white'
  return (
    <button
      type="button"
      data-testid={`mode-${mode}`}
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-[64px] rounded-2xl border-4 px-2 py-2 text-left transition ${color}`}
    >
      <span className="block text-lg font-extrabold">{t(`facts.${mode}`)}</span>
      <span className="block text-xs text-ink/70">{t(`facts.${mode}Help`)}</span>
      {count > 0 && <span className="text-xs font-bold">{t('facts.marked', { count })}</span>}
    </button>
  )
}
