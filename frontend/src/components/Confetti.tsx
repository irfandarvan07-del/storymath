import { useEffect, useRef } from 'react'

interface ConfettiProps {
  duration?: number
}

export function Confetti({ duration = 3000 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#0f766e', '#f2a900', '#2f855a', '#c05621', '#3b82f6', '#ec4899', '#8b5cf6']
    const particles = Array.from({ length: 90 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.7) * 15,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1,
    }))

    const startTime = Date.now()
    let animId: number

    const render = () => {
      const elapsed = Date.now() - startTime
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const progress = elapsed / duration

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.35 // gravity
        p.rotation += p.vRot
        p.opacity = Math.max(0, 1 - progress)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [duration])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden="true"
    />
  )
}
