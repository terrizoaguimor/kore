'use client'

interface ProgressBarProps {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function ProgressBar({
  progress,
  size = 'md',
  showLabel = true,
  className = ''
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  const getProgressColor = () => {
    if (clampedProgress === 100) return 'bg-[#00D68F]'
    if (clampedProgress >= 70) return 'bg-[#00E5FF]'
    if (clampedProgress >= 40) return 'bg-[#FFB830]'
    return 'bg-[#FF4757]'
  }

  const getHeight = () => {
    switch (size) {
      case 'sm': return 'h-1'
      case 'lg': return 'h-4'
      default: return 'h-2'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-[#2A2A2A] rounded-full overflow-hidden ${getHeight()}`}>
        <div
          className={`h-full ${getProgressColor()} transition-all duration-300`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-white/70 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {clampedProgress}%
        </span>
      )}
    </div>
  )
}
