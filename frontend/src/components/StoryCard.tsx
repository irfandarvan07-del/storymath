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
  return (
    <div className="card space-y-3" data-testid="story-card">
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
