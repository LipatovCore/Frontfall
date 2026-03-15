import type { MapPosition } from './map'

export type UnitFaction = 'player'

export type UnitData = {
  id: string
  faction: UnitFaction
  position: MapPosition
  moveSpeed: number
  stopDistance: number
}

export type PlayerUnitData = UnitData & {
  faction: 'player'
}
