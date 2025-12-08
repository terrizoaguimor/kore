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
    if (clampedProgress === 100) return 'progress-success'
    if (clampedProgress >= 70) return 'progress-info'
    if (clampedProgress >= 40) return 'progress-warning'
    return 'progress-error'
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
      <progress
        className={`progress ${getProgressColor()} ${getHeight()} flex-1`}
        value={clampedProgress}
        max="100"
      />
      {showLabel && (
        <span className={`text-base-content/70 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {clampedProgress}%
        </span>
      )}
    </div>
  )
}
