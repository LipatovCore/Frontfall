import { reinforcementConfig } from '../shared/config/reinforcements'
import type { EconomyState } from '../shared/types/economy'
import type { WaveQueueItem } from '../shared/types/reinforcements'

type ReinforcementPanelProps = {
  deploymentCycle: number
  economyState: EconomyState
  waveQueue: WaveQueueItem[]
  waveTimerSeconds: number
  onQueueUnit: (definitionId: string) => void
}

function formatWaveTimer(timeRemainingSeconds: number) {
  const clampedSeconds = Math.max(0, Math.ceil(timeRemainingSeconds))
  const minutes = Math.floor(clampedSeconds / 60)
  const seconds = clampedSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function ReinforcementPanel({
  deploymentCycle,
  economyState,
  waveQueue,
  waveTimerSeconds,
  onQueueUnit,
}: ReinforcementPanelProps) {
  const queuedCounts = waveQueue.reduce<Record<string, number>>((counts, item) => {
    counts[item.definitionId] = (counts[item.definitionId] ?? 0) + 1
    return counts
  }, {})

  return (
    <aside className="reinforcement-panel" aria-label="Reinforcement controls">
      <div className="reinforcement-card">
        <span className="reinforcement-label">Next Wave</span>
        <strong className="reinforcement-timer">{formatWaveTimer(waveTimerSeconds)}</strong>
        <span className="reinforcement-cycle">Cycle {deploymentCycle}</span>
      </div>

      <div className="reinforcement-card">
        <span className="reinforcement-label">Available Units</span>
        <div className="reinforcement-actions">
          {reinforcementConfig.playerUnitDefinitions.map((definition) => {
            const canAfford = economyState.player.manpower >= definition.cost

            return (
              <button
                key={definition.id}
                type="button"
                className="reinforcement-button"
                onClick={() => onQueueUnit(definition.id)}
                disabled={!canAfford}
              >
                <span>{definition.label}</span>
                <span>{definition.cost} MP</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="reinforcement-card">
        <span className="reinforcement-label">Wave Queue</span>
        {waveQueue.length === 0 ? (
          <p className="reinforcement-empty">Queue is empty for the next deployment.</p>
        ) : (
          <ul className="reinforcement-queue" aria-label="Queued units">
            {reinforcementConfig.playerUnitDefinitions
              .filter((definition) => queuedCounts[definition.id])
              .map((definition) => (
                <li key={definition.id}>
                  <span>{definition.label}</span>
                  <strong>x{queuedCounts[definition.id]}</strong>
                </li>
              ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
