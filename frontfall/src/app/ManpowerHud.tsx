import { economyConfig } from '../shared/config/economyConfig'
import type { EconomyState } from '../shared/types/economy'
import type { ControlPointState } from '../shared/types/map'
import { getIncomePerTick } from '../scene/systems/manpowerEconomy'

type ManpowerHudProps = {
  economyState: EconomyState
  controlPoints: ControlPointState[]
}

function formatManpower(value: number) {
  return Math.floor(value).toString()
}

export function ManpowerHud({ economyState, controlPoints }: ManpowerHudProps) {
  const incomePerTick = getIncomePerTick(controlPoints)
  const tickSeconds = economyConfig.incomeTickIntervalSeconds

  return (
    <aside className="manpower-hud" aria-label="Manpower resources">
      <div className="manpower-card manpower-card-player">
        <span className="manpower-label">Player Manpower</span>
        <strong className="manpower-value">{formatManpower(economyState.player.manpower)}</strong>
        <span className="manpower-income">+{incomePerTick.player} / {tickSeconds}s</span>
      </div>

      <div className="manpower-card manpower-card-enemy">
        <span className="manpower-label">Enemy Manpower</span>
        <strong className="manpower-value">{formatManpower(economyState.enemy.manpower)}</strong>
        <span className="manpower-income">+{incomePerTick.enemy} / {tickSeconds}s</span>
      </div>
    </aside>
  )
}
