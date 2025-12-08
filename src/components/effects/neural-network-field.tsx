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
  isHub: boolean // Yellow hub particles
  alpha: number
  pulsePhase: number // For heartbeat effect on hubs
}

interface NeuralNetworkFieldProps {
  particleCount?: number
  hubCount?: number
  className?: string
}

export function NeuralNetworkField({
  particleCount = 200,
  hubCount = 10,
  className = "",
}: NeuralNetworkFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animationRef = useRef<number>(0)
  const isHoveringRef = useRef(false)
  const timeRef = useRef(0)

  // Colors
  const blueColor = { r: 0, g: 229, b: 255 } // #00E5FF
  const yellowColor = { r: 255, g: 184, b: 48 } // #FFB830

  const createParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []

    // Create hub particles (yellow) - distributed evenly
    for (let i = 0; i < hubCount; i++) {
      // Distribute hubs in a pattern across the canvas
      const angle = (i / hubCount) * Math.PI * 2
      const radiusFromCenter = Math.min(width, height) * 0.3
      const centerX = width / 2
      const centerY = height / 2

      const x = centerX + Math.cos(angle) * radiusFromCenter * (0.5 + Math.random() * 0.5)
      const y = centerY + Math.sin(angle) * radiusFromCenter * (0.5 + Math.random() * 0.5)

      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: 0,
        radius: 5 + Math.random() * 3, // Even larger hubs
        isHub: true,
        alpha: 0.9,
        pulsePhase: Math.random() * Math.PI * 2, // Random start phase for heartbeat
      })
    }

    // Create regular particles (blue)
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1, // Larger particles
        isHub: false,
        alpha: Math.random() * 0.5 + 0.3, // More visible
        pulsePhase: 0,
      })
    }

    return particles
  }, [particleCount, hubCount])

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

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      const particles = particlesRef.current
      const mouse = mouseRef.current
      timeRef.current += 0.016 // ~60fps

      // Find all hub particles
      const hubs = particles.filter(p => p.isHub)
      const regularParticles = particles.filter(p => !p.isHub)

      // Update and draw hub particles with heartbeat
      for (const hub of hubs) {
        // Heartbeat pulse effect
        const heartbeat = Math.sin(timeRef.current * 3 + hub.pulsePhase)
        const pulse = 0.5 + heartbeat * 0.5 // 0 to 1
        const glowIntensity = 0.3 + pulse * 0.4

        // Mouse interaction for hubs - gentle attraction
        const dx = mouse.x - hub.x
        const dy = mouse.y - hub.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const mouseRadius = 200

        if (dist < mouseRadius && isHoveringRef.current) {
          const force = (mouseRadius - dist) / mouseRadius * 0.3
          hub.vx += (dx / dist) * force
          hub.vy += (dy / dist) * force
        }

        // Return to base position
        const returnDx = hub.baseX - hub.x
        const returnDy = hub.baseY - hub.y
        hub.vx += returnDx * 0.01
        hub.vy += returnDy * 0.01

        // Apply friction
        hub.vx *= 0.95
        hub.vy *= 0.95

        // Update position
        hub.x += hub.vx
        hub.y += hub.vy

        // Keep within bounds
        hub.x = Math.max(hub.radius, Math.min(rect.width - hub.radius, hub.x))
        hub.y = Math.max(hub.radius, Math.min(rect.height - hub.radius, hub.y))

        // Draw hub glow (outer)
        const glowRadius = hub.radius * (3 + pulse * 2)
        const gradient = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, glowRadius)
        gradient.addColorStop(0, `rgba(${yellowColor.r}, ${yellowColor.g}, ${yellowColor.b}, ${glowIntensity * 0.3})`)
        gradient.addColorStop(0.5, `rgba(${yellowColor.r}, ${yellowColor.g}, ${yellowColor.b}, ${glowIntensity * 0.1})`)
        gradient.addColorStop(1, `rgba(${yellowColor.r}, ${yellowColor.g}, ${yellowColor.b}, 0)`)
        ctx.beginPath()
        ctx.arc(hub.x, hub.y, glowRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Draw hub core
        const coreRadius = hub.radius * (1 + pulse * 0.3)
        ctx.beginPath()
        ctx.arc(hub.x, hub.y, coreRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${yellowColor.r}, ${yellowColor.g}, ${yellowColor.b}, ${0.8 + pulse * 0.2})`
        ctx.fill()

        // Inner bright core
        ctx.beginPath()
        ctx.arc(hub.x, hub.y, coreRadius * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.3})`
        ctx.fill()
      }

      // Draw connections between hubs first (background)
      for (let i = 0; i < hubs.length; i++) {
        for (let j = i + 1; j < hubs.length; j++) {
          const h1 = hubs[i]
          const h2 = hubs[j]
          const dx = h1.x - h2.x
          const dy = h1.y - h2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = Math.min(rect.width, rect.height) * 0.6

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.15

            // Create gradient line between hubs
            const gradient = ctx.createLinearGradient(h1.x, h1.y, h2.x, h2.y)
            gradient.addColorStop(0, `rgba(${yellowColor.r}, ${yellowColor.g}, ${yellowColor.b}, ${opacity})`)
            gradient.addColorStop(0.5, `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, ${opacity * 0.5})`)
            gradient.addColorStop(1, `rgba(${yellowColor.r}, ${yellowColor.g}, ${yellowColor.b}, ${opacity})`)

            ctx.beginPath()
            ctx.moveTo(h1.x, h1.y)
            ctx.lineTo(h2.x, h2.y)
            ctx.strokeStyle = gradient
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      // Update and draw regular particles
      for (let i = 0; i < regularParticles.length; i++) {
        const p = regularParticles[i]

        // Mouse interaction - repel particles
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const mouseRadius = 150

        if (dist < mouseRadius && isHoveringRef.current) {
          const force = (mouseRadius - dist) / mouseRadius
          const angle = Math.atan2(dy, dx)
          p.vx -= Math.cos(angle) * force * 1.5
          p.vy -= Math.sin(angle) * force * 1.5
        }

        // Return to base position when not hovering
        if (!isHoveringRef.current) {
          const returnDx = p.baseX - p.x
          const returnDy = p.baseY - p.y
          p.vx += returnDx * 0.015
          p.vy += returnDy * 0.015
        }

        // Apply friction
        p.vx *= 0.96
        p.vy *= 0.96

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
        ctx.fillStyle = `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, ${p.alpha})`
        ctx.fill()

        // Draw connections to nearest hub
        let nearestHub = hubs[0]
        let nearestDist = Infinity
        for (const hub of hubs) {
          const hdx = p.x - hub.x
          const hdy = p.y - hub.y
          const hdist = Math.sqrt(hdx * hdx + hdy * hdy)
          if (hdist < nearestDist) {
            nearestDist = hdist
            nearestHub = hub
          }
        }

        // Connect to nearest hub
        if (nearestDist < 250) {
          const opacity = (1 - nearestDist / 250) * 0.25

          // Gradient from blue to yellow
          const gradient = ctx.createLinearGradient(p.x, p.y, nearestHub.x, nearestHub.y)
          gradient.addColorStop(0, `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, ${opacity})`)
          gradient.addColorStop(1, `rgba(${yellowColor.r}, ${yellowColor.g}, ${yellowColor.b}, ${opacity * 0.5})`)

          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(nearestHub.x, nearestHub.y)
          ctx.strokeStyle = gradient
          ctx.lineWidth = 0.3
          ctx.stroke()
        }

        // Draw connections between nearby regular particles
        for (let j = i + 1; j < regularParticles.length; j++) {
          const p2 = regularParticles[j]
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

          if (dist2 < 120) {
            const opacity = (1 - dist2 / 120) * 0.2
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Draw mouse glow when hovering
      if (isHoveringRef.current) {
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 120
        )
        gradient.addColorStop(0, `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, 0.08)`)
        gradient.addColorStop(0.5, `rgba(${yellowColor.r}, ${yellowColor.g}, ${yellowColor.b}, 0.03)`)
        gradient.addColorStop(1, `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, 0)`)
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2)
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
  }, [createParticles])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ display: "block", pointerEvents: "auto" }}
    />
  )
}
