import type { ReinforcementUnitDefinition } from '../types/reinforcements'

export const enemyUnitDefinitions: ReinforcementUnitDefinition[] = [
  {
    id: 'enemy-guard-unit',
    label: 'Guard Unit',
    description: 'Baseline enemy infantry used by the simple AI to keep pressure on the map.',
    cost: 20,
    team: 'enemy',
    template: {
      unitTypeId: 'enemy-guard-unit',
      moveSpeed: 4.4,
      stopDistance: 0.12,
      maxHealth: 100,
      currentHealth: 100,
      attackRange: 2.35,
      attackDamage: 12,
      attackCooldown: 0.75,
      attackCooldownRemaining: 0,
    },
  },
]
