import type { UnitTeam } from './unit'

export type EconomyTeamState = {
  manpower: number
}

export type EconomyState = {
  player: EconomyTeamState
  enemy: EconomyTeamState
  elapsedSinceLastTick: number
}

export type EconomyIncome = Record<UnitTeam, number>
