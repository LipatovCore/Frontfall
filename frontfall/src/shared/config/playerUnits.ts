import type { PlayerUnitData } from '../types/unit'

export const initialPlayerUnits: PlayerUnitData[] = [
  {
    id: 'player-unit-alpha',
    faction: 'player',
    position: [-1.8, 0, 6.9],
    moveSpeed: 4.6,
    stopDistance: 0.12,
  },
  {
    id: 'player-unit-bravo',
    faction: 'player',
    position: [0, 0, 6.3],
    moveSpeed: 4.6,
    stopDistance: 0.12,
  },
  {
    id: 'player-unit-charlie',
    faction: 'player',
    position: [1.8, 0, 6.9],
    moveSpeed: 4.6,
    stopDistance: 0.12,
  },
]
