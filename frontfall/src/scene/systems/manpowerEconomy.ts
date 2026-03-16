import { economyConfig } from '../../shared/config/economyConfig'
import type { EconomyIncome, EconomyState } from '../../shared/types/economy'
import type { ControlPointState } from '../../shared/types/map'

export type EconomySimulationResult = {
  economyState: EconomyState
  changed: boolean
  incomePerTick: EconomyIncome
}

export function createInitialEconomyState(): EconomyState {
  return {
    player: {
      manpower: economyConfig.startingManpower,
    },
    enemy: {
      manpower: economyConfig.startingManpower,
    },
    elapsedSinceLastTick: 0,
  }
}

export function getIncomePerTick(controlPoints: ControlPointState[]): EconomyIncome {
  return controlPoints.reduce<EconomyIncome>(
    (income, point) => {
      if (point.type !== 'resource' || point.owner === 'neutral') {
        return income
      }

      income[point.owner] += point.incomePerTick
      return income
    },
    {
      player: 0,
      enemy: 0,
    },
  )
}

export function simulateEconomyStep(
  economyState: EconomyState,
  controlPoints: ControlPointState[],
  deltaSeconds: number,
): EconomySimulationResult {
  const incomePerTick = getIncomePerTick(controlPoints)
  const tickInterval = economyConfig.incomeTickIntervalSeconds
  const elapsedSinceLastTick = economyState.elapsedSinceLastTick + deltaSeconds
  const completedTicks = Math.floor(elapsedSinceLastTick / tickInterval)

  if (completedTicks <= 0) {
    return {
      economyState: {
        ...economyState,
        elapsedSinceLastTick,
      },
      changed: elapsedSinceLastTick !== economyState.elapsedSinceLastTick,
      incomePerTick,
    }
  }

  return {
    economyState: {
      player: {
        manpower: economyState.player.manpower + incomePerTick.player * completedTicks,
      },
      enemy: {
        manpower: economyState.enemy.manpower + incomePerTick.enemy * completedTicks,
      },
      elapsedSinceLastTick: elapsedSinceLastTick - completedTicks * tickInterval,
    },
    changed: true,
    incomePerTick,
  }
}
