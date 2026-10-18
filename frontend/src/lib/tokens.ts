/** Splits story/question text into tappable tokens with stable ids. */

export interface Token {
  /** "s0", "s1"... for the story, "q0", "q1"... for the question */
  id: string
  text: string
  /** the word without surrounding punctuation */
  clean: string
  isNumber: boolean
}

export type Part = 's' | 'q'

const strip = (s: string) => s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')

export function tokenize(text: string, part: Part): Token[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((raw, i) => {
      const clean = strip(raw)
      return { id: `${part}${i}`, text: raw, clean, isNumber: /^\d+([.,]\d+)?$/.test(clean) }
    })
}
