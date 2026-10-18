import { useState } from 'react'
import type { Marks } from '../api/types'
import { tokenize } from '../lib/tokens'
import type { Token } from '../lib/tokens'

interface Props {
  story: string
  question: string
  /** token id -> given | asked */
  marks?: Marks
  /** when set, every word and number becomes a tappable button */
  onTap?: (tokenId: string) => void
}

export function StoryCard({ story, question, marks = {}, onTap }: Props) {
  const [speaking, setSpeaking] = useState(false)

  const speak = () => {
    if (!('speechSynthesis' in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(`${story}. ${question}`)
    utterance.rate = 0.95
    utterance.pitch = 1.05
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="card space-y-3 relative" data-testid="story-card">
      <div className="flex items-center justify-between pb-1 border-b border-ink/5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Word Problem</span>
        {'speechSynthesis' in window && (
          <button
            type="button"
            onClick={speak}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              speaking
                ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse'
                : 'bg-white border-ink/15 text-ink/70 hover:border-brand hover:text-brand'
            }`}
            title="Read story aloud"
          >
            <span>{speaking ? '🔊 Speaking...' : '🔈 Read Aloud'}</span>
          </button>
        )}
      </div>
      <Words tokens={tokenize(story, 's')} marks={marks} onTap={onTap} />
      <Words tokens={tokenize(question, 'q')} marks={marks} onTap={onTap} strong />
    </div>
  )
}

function markClass(mark: Marks[string] | undefined): string {
  if (mark === 'given') return 'bg-given-light border-b-4 border-given'
  if (mark === 'asked') return 'bg-asked-light border-b-4 border-asked'
  return 'border-b-4 border-transparent'
}

function Words({
  tokens,
  marks,
  onTap,
  strong,
}: {
  tokens: Token[]
  marks: Marks
  onTap?: (id: string) => void
  strong?: boolean
}) {
  return (
    <p className={`text-xl leading-loose ${strong ? 'font-bold' : ''}`}>
      {tokens.map((tk) =>
        onTap ? (
          <button
            key={tk.id}
            type="button"
            data-testid={`token-${tk.id}`}
            aria-pressed={Boolean(marks[tk.id])}
            onClick={() => onTap(tk.id)}
            className={`mr-1 inline-block min-h-[44px] rounded-lg px-1.5 py-1 ${markClass(marks[tk.id])}`}
          >
            {tk.text}
          </button>
        ) : (
          <span key={tk.id} className={`mr-1 inline-block rounded-md px-0.5 ${markClass(marks[tk.id])}`}>
            {tk.text}
          </span>
        ),
      )}
    </p>
  )
}
