import type { MapPosition } from './map'
import type { UnitData, UnitTeam } from './unit'

export type ReinforcementUnitDefinition = {
  id: string
  label: string
  description: string
  cost: number
  team: UnitTeam
  template: Omit<UnitData, 'id' | 'team' | 'position'>
}

export type WaveQueueItem = {
  id: string
  definitionId: ReinforcementUnitDefinition['id']
}

export type DeploymentBatch = {
  id: number
  cycle: number
  team: UnitTeam
  queue: WaveQueueItem[]
}

export type ReinforcementConfig = {
  waveIntervalSeconds: number
  playerSpawnOffsets: MapPosition[]
  playerUnitDefinitions: ReinforcementUnitDefinition[]
}
