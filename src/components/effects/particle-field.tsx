"use client"

import { useEffect, useRef, useCallback } from "react"

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
}

interface ParticleFieldProps {
  particleCount?: number
  particleColor?: string
  lineColor?: string
  maxDistance?: number
  mouseRadius?: number
  speed?: number
  className?: string
}

export function ParticleField({
  particleCount = 150,
  particleColor = "#0046E2",
  lineColor = "#0046E2",
  maxDistance = 120,
  mouseRadius = 150,
  speed = 0.5,
  className = "",
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animationRef = useRef<number>(0)
  const isHoveringRef = useRef(false)

  const createParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: Math.random() * 2 + 1,
        color: particleColor,
        alpha: Math.random() * 0.5 + 0.3,
      })
    }
    return particles
  }, [particleCount, particleColor, speed])

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 229, b: 255 }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      particlesRef.current = createParticles(rect.width, rect.height)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      isHoveringRef.current = true
    }

    const handleMouseLeave = () => {
      isHoveringRef.current = false
      mouseRef.current = { x: -1000, y: -1000 }
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    const rgb = hexToRgb(lineColor)

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      const particles = particlesRef.current
      const mouse = mouseRef.current

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Mouse interaction - repel particles
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < mouseRadius && isHoveringRef.current) {
          const force = (mouseRadius - dist) / mouseRadius
          const angle = Math.atan2(dy, dx)
          p.vx -= Math.cos(angle) * force * 2
          p.vy -= Math.sin(angle) * force * 2
        }

        // Return to base position when not hovering
        if (!isHoveringRef.current) {
          const returnDx = p.baseX - p.x
          const returnDy = p.baseY - p.y
          p.vx += returnDx * 0.02
          p.vy += returnDy * 0.02
        }

        // Apply friction
        p.vx *= 0.95
        p.vy *= 0.95

        // Update position
        p.x += p.vx
        p.y += p.vy

        // Boundary bounce
        if (p.x < 0 || p.x > rect.width) p.vx *= -1
        if (p.y < 0 || p.y > rect.height) p.vy *= -1

        // Keep within bounds
        p.x = Math.max(0, Math.min(rect.width, p.x))
        p.y = Math.max(0, Math.min(rect.height, p.y))

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.alpha})`
        ctx.fill()

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

          if (dist2 < maxDistance) {
            const opacity = (1 - dist2 / maxDistance) * 0.3
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }

        // Draw connection to mouse when hovering
        if (isHoveringRef.current && dist < mouseRadius * 1.5) {
          const opacity = (1 - dist / (mouseRadius * 1.5)) * 0.5
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Draw mouse glow when hovering
      if (isHoveringRef.current) {
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouseRadius
        )
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`)
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, mouseRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      cancelAnimationFrame(animationRef.current)
    }
  }, [createParticles, lineColor, maxDistance, mouseRadius])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  )
}
