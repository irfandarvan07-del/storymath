import { useTranslation } from 'react-i18next'

export interface HintEntry {
  level: number
  text: string
}

/**
 * Shows hints one level at a time. Only levels the backend has already
 * released are shown; the newest is the big one. We display `hint_text`
 * exactly as received and never compute or reveal an answer.
 */
export function HintBox({ hints }: { hints: HintEntry[] }) {
  const { t } = useTranslation()
  if (hints.length === 0) return null
  const sorted = [...hints].sort((a, b) => a.level - b.level)
  const latest = sorted[sorted.length - 1]
  const earlier = sorted.slice(0, -1)

  return (
    <div className="space-y-2" aria-live="polite" data-testid="hint-box">
      <div className="rounded-2xl border-4 border-sun bg-sun-light p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-ink/70">
          {t('hint.title')} · {t('hint.level', { level: latest.level })}
        </p>
        <p className="mt-1 text-lg font-semibold" data-testid="hint-text">
          {latest.text}
        </p>
      </div>
      {earlier.length > 0 && (
        <details className="rounded-xl bg-white px-3 py-2 text-sm">
          <summary className="min-h-[44px] cursor-pointer py-2 font-bold">{t('hint.earlier')}</summary>
          <ul className="space-y-1 pb-2">
            {earlier.map((h) => (
              <li key={h.level}>
                <span className="font-bold">{h.level}.</span> {h.text}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
