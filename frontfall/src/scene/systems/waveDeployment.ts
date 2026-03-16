import { mapConfig } from '../../shared/config/mapConfig'
import { reinforcementConfig } from '../../shared/config/reinforcements'
import type { EconomyState } from '../../shared/types/economy'
import type {
  DeploymentBatch,
  ReinforcementUnitDefinition,
  WaveQueueItem,
} from '../../shared/types/reinforcements'
import type { MapPosition } from '../../shared/types/map'
import type { UnitData } from '../../shared/types/unit'

type QueueWaveUnitResult = {
  nextEconomyState: EconomyState
  nextWaveQueue: WaveQueueItem[]
  queued: boolean
}

function createQueueItemId(definitionId: string, queueLength: number) {
  return `${definitionId}-${queueLength}-${crypto.randomUUID()}`
}

function getSpawnPosition(basePosition: MapPosition, index: number): MapPosition {
  const offset = reinforcementConfig.playerSpawnOffsets[
    index % reinforcementConfig.playerSpawnOffsets.length
  ]
  const repeatRow = Math.floor(index / reinforcementConfig.playerSpawnOffsets.length)
  const rowDepthOffset = repeatRow * 1.2

  return [basePosition[0] + offset[0], basePosition[1] + offset[1], basePosition[2] + offset[2] - rowDepthOffset]
}

export function getPlayerReinforcementDefinition(definitionId: string) {
  return reinforcementConfig.playerUnitDefinitions.find((definition) => definition.id === definitionId) ?? null
}

export function queuePlayerWaveUnit(
  economyState: EconomyState,
  waveQueue: WaveQueueItem[],
  definition: ReinforcementUnitDefinition,
): QueueWaveUnitResult {
  if (definition.team !== 'player' || economyState.player.manpower < definition.cost) {
    return {
      nextEconomyState: economyState,
      nextWaveQueue: waveQueue,
      queued: false,
    }
  }

  return {
    nextEconomyState: {
      ...economyState,
      player: {
        manpower: economyState.player.manpower - definition.cost,
      },
    },
    nextWaveQueue: [
      ...waveQueue,
      {
        id: createQueueItemId(definition.id, waveQueue.length),
        definitionId: definition.id,
      },
    ],
    queued: true,
  }
}

export function createPlayerDeploymentBatch(
  queue: WaveQueueItem[],
  cycle: number,
): DeploymentBatch | null {
  if (queue.length === 0) {
    return null
  }

  return {
    id: cycle,
    cycle,
    team: 'player',
    queue,
  }
}

export function createUnitsFromDeploymentBatch(
  batch: DeploymentBatch,
  existingUnits: UnitData[],
): UnitData[] {
  if (batch.team !== 'player') {
    return []
  }

  const playerUnitCount = existingUnits.filter((unit) => unit.team === 'player').length
  const basePosition = mapConfig.playerBase.position

  return batch.queue.flatMap((queuedUnit, index) => {
    const definition = getPlayerReinforcementDefinition(queuedUnit.definitionId)

    if (!definition) {
      return []
    }

    return [
      {
        id: `${definition.id}-${batch.cycle}-${playerUnitCount + index + 1}`,
        team: definition.team,
        position: getSpawnPosition(basePosition, index),
        ...definition.template,
      },
    ]
  })
}
