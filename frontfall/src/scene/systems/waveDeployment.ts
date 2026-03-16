import { mapConfig } from '../../shared/config/mapConfig'
import { reinforcementConfig } from '../../shared/config/reinforcements'
import type { EconomyState } from '../../shared/types/economy'
import type {
  DeploymentBatch,
  ReinforcementUnitDefinition,
  WaveQueueItem,
} from '../../shared/types/reinforcements'
import type { MapPosition } from '../../shared/types/map'
import type { UnitData, UnitTeam } from '../../shared/types/unit'

type QueueWaveUnitResult = {
  nextEconomyState: EconomyState
  nextWaveQueue: WaveQueueItem[]
  queued: boolean
}

function createQueueItemId(definitionId: string, queueLength: number) {
  return `${definitionId}-${queueLength}-${crypto.randomUUID()}`
}

function getSpawnPosition(team: UnitTeam, basePosition: MapPosition, index: number): MapPosition {
  const spawnOffsets = reinforcementConfig.spawnOffsets[team]
  const offset = spawnOffsets[index % spawnOffsets.length]
  const repeatRow = Math.floor(index / spawnOffsets.length)
  const rowDepthOffset = repeatRow * 1.2

  return [basePosition[0] + offset[0], basePosition[1] + offset[1], basePosition[2] + offset[2] - rowDepthOffset]
}

export function getPlayerReinforcementDefinition(definitionId: string) {
  return reinforcementConfig.playerUnitDefinitions.find((definition) => definition.id === definitionId) ?? null
}

export function getEnemyReinforcementDefinition(definitionId: string) {
  return reinforcementConfig.enemyUnitDefinitions.find((definition) => definition.id === definitionId) ?? null
}

export function queueWaveUnit(
  economyState: EconomyState,
  waveQueue: WaveQueueItem[],
  definition: ReinforcementUnitDefinition,
  isUnlocked: boolean,
): QueueWaveUnitResult {
  const teamState = economyState[definition.team]

  if (!isUnlocked || teamState.manpower < definition.cost) {
    return {
      nextEconomyState: economyState,
      nextWaveQueue: waveQueue,
      queued: false,
    }
  }

  return {
    nextEconomyState: {
      ...economyState,
      [definition.team]: {
        manpower: teamState.manpower - definition.cost,
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

export function queuePlayerWaveUnit(
  economyState: EconomyState,
  waveQueue: WaveQueueItem[],
  definition: ReinforcementUnitDefinition,
  isUnlocked: boolean,
): QueueWaveUnitResult {
  if (definition.team !== 'player') {
    return {
      nextEconomyState: economyState,
      nextWaveQueue: waveQueue,
      queued: false,
    }
  }

  return queueWaveUnit(economyState, waveQueue, definition, isUnlocked)
}

export function createDeploymentBatch(
  team: UnitTeam,
  queue: WaveQueueItem[],
  cycle: number,
): DeploymentBatch | null {
  if (queue.length === 0) {
    return null
  }

  return {
    id: `${team}-${cycle}`,
    cycle,
    team,
    queue,
  }
}

export function createPlayerDeploymentBatch(
  queue: WaveQueueItem[],
  cycle: number,
): DeploymentBatch | null {
  return createDeploymentBatch('player', queue, cycle)
}

export function createUnitsFromDeploymentBatch(
  batch: DeploymentBatch,
  existingUnits: UnitData[],
): UnitData[] {
  const unitCount = existingUnits.filter((unit) => unit.team === batch.team).length
  const basePosition = batch.team === 'player' ? mapConfig.playerBase.position : mapConfig.enemyBase.position

  return batch.queue.flatMap((queuedUnit, index) => {
    const definition =
      batch.team === 'player'
        ? getPlayerReinforcementDefinition(queuedUnit.definitionId)
        : getEnemyReinforcementDefinition(queuedUnit.definitionId)

    if (!definition) {
      return []
    }

    return [
      {
        id: `${definition.id}-${batch.cycle}-${unitCount + index + 1}`,
        team: definition.team,
        position: getSpawnPosition(batch.team, basePosition, index),
        ...definition.template,
      },
    ]
  })
}
