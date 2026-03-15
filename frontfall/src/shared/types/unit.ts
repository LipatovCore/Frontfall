import type { MapPosition } from './map'

export type UnitTeam = 'player' | 'enemy'

export type UnitData = {
  id: string
  team: UnitTeam
  position: MapPosition
  moveSpeed: number
  stopDistance: number
  maxHealth: number
  currentHealth: number
  attackRange: number
  attackDamage: number
  attackCooldown: number
  attackCooldownRemaining: number
}
