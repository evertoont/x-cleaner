import type { Activity } from '../lib/activity'
import { messages } from '../lib/i18n'

interface ProgressBarProps {
  activity: Activity
}

export function ProgressBar(props: ProgressBarProps) {
  const { activity } = props

  if (activity.type === 'idle') {
    return null
  }

  if (activity.type === 'capturing') {
    return (
      <div
        className="progress"
        data-indeterminate="true"
        role="progressbar"
        aria-label={messages.progress.capturing}
      >
        <span className="progress-fill" />
      </div>
    )
  }

  const completedRatio = activity.total === 0 ? 0 : activity.completed / activity.total

  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={messages.progress.removing}
      aria-valuemin={0}
      aria-valuemax={activity.total}
      aria-valuenow={activity.completed}
    >
      <span className="progress-fill" style={{ transform: `scaleX(${completedRatio})` }} />
    </div>
  )
}
