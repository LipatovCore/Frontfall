import { mapConfig } from '../../shared/config/mapConfig'
import { reinforcementConfig } from '../../shared/config/reinforcements'
import type { EconomyState } from '../../shared/types/economy'
import type { ControlPointState, ControlPointOwner, MapPosition } from '../../shared/types/map'
import type { ReinforcementUnitDefinition, WaveQueueItem } from '../../shared/types/reinforcements'
import type { UnitData } from '../../shared/types/unit'
import { assignGroupTargetPositions } from './groupTargetPositions'
import { queueWaveUnit } from './waveDeployment'

export const enemyAiConfig = {
  decisionIntervalSeconds: 3,
  queueIntervalSeconds: 2.5,
  maxUnitsQueuedPerTick: 2,
  maxQueuedUnits: 8,
} as const

export type EnemyAiMoveDecision = {
  targetPosition: MapPosition
  unitTargetAssignments: Record<string, MapPosition>
}

function getDistanceSquared(from: MapPosition, to: MapPosition) {
  const dx = to[0] - from[0]
  const dz = to[2] - from[2]

  return dx * dx + dz * dz
}

function getEnemyReferencePosition(units: UnitData[]): MapPosition {
  const movableEnemyUnits = units.filter((unit) => unit.team === 'enemy' && unit.moveSpeed > 0)

  if (movableEnemyUnits.length === 0) {
    return mapConfig.enemyBase.position
  }

  const sum = movableEnemyUnits.reduce(
    (accumulator, unit) => {
      accumulator.x += unit.position[0]
      accumulator.z += unit.position[2]
      return accumulator
    },
    { x: 0, z: 0 },
  )

  return [sum.x / movableEnemyUnits.length, 0, sum.z / movableEnemyUnits.length]
}

function findNearestPointByOwnerAndType(
  controlPoints: ControlPointState[],
  referencePosition: MapPosition,
  owner: ControlPointOwner,
  type: ControlPointState['type'],
) {
  let nearestPoint: ControlPointState | null = null
  let nearestDistanceSquared = Number.POSITIVE_INFINITY

  for (const point of controlPoints) {
    if (point.owner !== owner || point.type !== type) {
      continue
    }

    const distanceSquared = getDistanceSquared(referencePosition, point.position)

    if (distanceSquared >= nearestDistanceSquared) {
      continue
    }

    nearestPoint = point
    nearestDistanceSquared = distanceSquared
  }

  return nearestPoint
}

export function getEnemyAiMoveDecision(
  units: UnitData[],
  controlPoints: ControlPointState[],
): EnemyAiMoveDecision | null {
  const enemyUnitIds = units
    .filter((unit) => unit.team === 'enemy' && unit.moveSpeed > 0)
    .map((unit) => unit.id)

  if (enemyUnitIds.length === 0) {
    return null
  }

  const referencePosition = getEnemyReferencePosition(units)
  const targetPoint =
    findNearestPointByOwnerAndType(controlPoints, referencePosition, 'neutral', 'resource') ??
    findNearestPointByOwnerAndType(controlPoints, referencePosition, 'neutral', 'unlock') ??
    findNearestPointByOwnerAndType(controlPoints, referencePosition, 'player', 'resource') ??
    findNearestPointByOwnerAndType(controlPoints, referencePosition, 'player', 'unlock')

  const targetPosition = targetPoint?.position ?? mapConfig.playerBase.position

  return {
    targetPosition,
    unitTargetAssignments: assignGroupTargetPositions(enemyUnitIds, targetPosition),
  }
}

function getAvailableEnemyDefinitions(): ReinforcementUnitDefinition[] {
  return reinforcementConfig.enemyUnitDefinitions
}

export function planEnemyWaveQueue(
  economyState: EconomyState,
  waveQueue: WaveQueueItem[],
): {
  nextEconomyState: EconomyState
  nextWaveQueue: WaveQueueItem[]
  queuedUnits: number
} {
  const availableDefinitions = getAvailableEnemyDefinitions()
  const basicEnemyDefinition = availableDefinitions[0]

  if (!basicEnemyDefinition || waveQueue.length >= enemyAiConfig.maxQueuedUnits) {
    return {
      nextEconomyState: economyState,
      nextWaveQueue: waveQueue,
      queuedUnits: 0,
    }
  }

  let nextEconomyState = economyState
  let nextWaveQueue = waveQueue
  let queuedUnits = 0

  while (
    queuedUnits < enemyAiConfig.maxUnitsQueuedPerTick &&
    nextWaveQueue.length < enemyAiConfig.maxQueuedUnits
  ) {
    const result = queueWaveUnit(nextEconomyState, nextWaveQueue, basicEnemyDefinition, true)

    if (!result.queued) {
      break
    }

    nextEconomyState = result.nextEconomyState
    nextWaveQueue = result.nextWaveQueue
    queuedUnits += 1
  }

  return {
    nextEconomyState,
    nextWaveQueue,
    queuedUnits,
  }
}
