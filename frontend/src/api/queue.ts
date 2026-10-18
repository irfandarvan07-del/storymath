/**
 * Offline queue. Step submissions (and finish calls) that cannot reach the
 * server are stored in localStorage and replayed in order when we are online.
 * Stored data is only attempt ids, step names and step responses: no names,
 * no emails, no free text.
 */
import { ApiError, NetworkError, USE_MOCK, request } from './http'

interface Job {
  id: string
  path: string
  body?: unknown
}

const KEY = 'sm_queue'
const listeners = new Set<() => void>()

function load(): Job[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Job[]
  } catch {
    return []
  }
}

function save(jobs: Job[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs))
  } catch {
    /* storage full or blocked: nothing we can do */
  }
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function pendingCount(): number {
  return load().length
}

export function enqueue(path: string, body?: unknown) {
  const jobs = load()
  jobs.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, path, body })
  save(jobs)
}

let flushing = false

export async function flushQueue(): Promise<void> {
  if (flushing || USE_MOCK) return
  flushing = true
  try {
    for (;;) {
      const [job] = load()
      if (!job) break
      try {
        await request('POST', job.path, job.body)
      } catch (e) {
        if (e instanceof NetworkError) break // still offline: keep the queue
        if (!(e instanceof ApiError)) break
        // The server rejected it (4xx/5xx). Retrying will not help, so drop it.
      }
      save(load().filter((j) => j.id !== job.id))
    }
  } finally {
    flushing = false
  }
}

/** Call once at startup. Flushes on reconnect and every 30 s as a safety net. */
export function startAutoFlush() {
  window.addEventListener('online', () => void flushQueue())
  window.setInterval(() => void flushQueue(), 30_000)
  void flushQueue()
}
