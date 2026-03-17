import { mapConfig } from '../../shared/config/mapConfig'
import type { BaseCoreState } from '../../shared/types/map'

export function createInitialBaseCores(): BaseCoreState[] {
  return [
    {
      ...mapConfig.playerBase,
      currentHealth: mapConfig.playerBase.maxHealth,
    },
    {
      ...mapConfig.enemyBase,
      currentHealth: mapConfig.enemyBase.maxHealth,
    },
  ]
}
