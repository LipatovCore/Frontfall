import type { ReinforcementConfig } from '../types/reinforcements'

export const reinforcementConfig = {
  waveIntervalSeconds: 30,
  playerSpawnOffsets: [
    [-1.8, 0, -1.4],
    [0, 0, -1.4],
    [1.8, 0, -1.4],
    [-2.6, 0, -2.3],
    [-0.9, 0, -2.3],
    [0.9, 0, -2.3],
    [2.6, 0, -2.3],
    [-1.8, 0, -3.2],
    [0, 0, -3.2],
    [1.8, 0, -3.2],
  ],
  playerUnitDefinitions: [
    {
      id: 'player-rifle-unit',
      label: 'Rifle Unit',
      cost: 20,
      team: 'player',
      template: {
        moveSpeed: 4.6,
        stopDistance: 0.12,
        maxHealth: 100,
        currentHealth: 100,
        attackRange: 2.35,
        attackDamage: 12,
        attackCooldown: 0.75,
        attackCooldownRemaining: 0,
      },
    },
  ],
} satisfies ReinforcementConfig
