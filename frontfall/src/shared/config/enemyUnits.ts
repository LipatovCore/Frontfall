import type { UnitData } from '../types/unit'
import { enemyUnitDefinitions } from './enemyUnitDefinitions'

const guardUnitTemplate = enemyUnitDefinitions.find((definition) => definition.id === 'enemy-guard-unit')?.template

if (!guardUnitTemplate) {
  throw new Error('Missing enemy guard unit definition.')
}

export const initialEnemyUnits: UnitData[] = [
  {
    id: 'enemy-unit-rho',
    team: 'enemy',
    position: [-1.8, 0, -7.2],
    ...guardUnitTemplate,
  },
  {
    id: 'enemy-unit-sigma',
    team: 'enemy',
    position: [0, 0, -6.6],
    ...guardUnitTemplate,
  },
  {
    id: 'enemy-unit-tau',
    team: 'enemy',
    position: [1.8, 0, -7.2],
    ...guardUnitTemplate,
  },
]
