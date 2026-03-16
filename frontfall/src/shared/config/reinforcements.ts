import type { ReinforcementConfig } from '../types/reinforcements'
import { enemyUnitDefinitions } from './enemyUnitDefinitions'
import { playerUnitDefinitions } from './playerUnitDefinitions'

export const reinforcementConfig = {
  waveIntervalSeconds: 30,
  spawnOffsets: {
    player: [
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
    enemy: [
      [-1.8, 0, 1.4],
      [0, 0, 1.4],
      [1.8, 0, 1.4],
      [-2.6, 0, 2.3],
      [-0.9, 0, 2.3],
      [0.9, 0, 2.3],
      [2.6, 0, 2.3],
      [-1.8, 0, 3.2],
      [0, 0, 3.2],
      [1.8, 0, 3.2],
    ],
  },
  playerUnitDefinitions,
  enemyUnitDefinitions,
} satisfies ReinforcementConfig
