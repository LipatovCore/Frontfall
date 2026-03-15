import { controlPointRules } from '../../shared/config/controlPointRules'
import type { ControlPointData, ControlPointOwner, ControlPointState } from '../../shared/types/map'
import type { UnitData } from '../../shared/types/unit'

type CaptureOccupancy = {
  playerCount: number
  enemyCount: number
}

export type ControlPointCaptureResult = {
  controlPoints: ControlPointState[]
  changed: boolean
}

export function createInitialControlPointStates(controlPoints: ControlPointData[]): ControlPointState[] {
  return controlPoints.map((point) => ({
    ...point,
    owner: 'neutral',
    captureProgress: 0,
    isContested: false,
  }))
}

function clampCaptureProgress(progress: number) {
  return Math.max(
    -controlPointRules.captureProgressMax,
    Math.min(controlPointRules.captureProgressMax, progress),
  )
}

function getPointOccupancy(point: ControlPointState, units: UnitData[]): CaptureOccupancy {
  let playerCount = 0
  let enemyCount = 0
  const captureRadiusSquared = point.captureRadius * point.captureRadius

  for (const unit of units) {
    if (unit.currentHealth <= 0) {
      continue
    }

    const dx = unit.position[0] - point.position[0]
    const dz = unit.position[2] - point.position[2]
    const distanceSquared = dx * dx + dz * dz

    if (distanceSquared > captureRadiusSquared) {
      continue
    }

    if (unit.team === 'player') {
      playerCount += 1
      continue
    }

    enemyCount += 1
  }

  return { playerCount, enemyCount }
}

function resolveOwnerFromProgress(progress: number, currentOwner: ControlPointOwner): ControlPointOwner {
  if (progress >= controlPointRules.captureProgressMax) {
    return 'player'
  }

  if (progress <= -controlPointRules.captureProgressMax) {
    return 'enemy'
  }

  return currentOwner
}

export function simulateControlPointCaptureStep(
  controlPoints: ControlPointState[],
  units: UnitData[],
  deltaSeconds: number,
): ControlPointCaptureResult {
  let changed = false

  const nextControlPoints = controlPoints.map((point) => {
    const occupancy = getPointOccupancy(point, units)
    const isContested = occupancy.playerCount > 0 && occupancy.enemyCount > 0
    const hasOnlyPlayerUnits = occupancy.playerCount > 0 && occupancy.enemyCount === 0
    const hasOnlyEnemyUnits = occupancy.enemyCount > 0 && occupancy.playerCount === 0
    let captureProgress = point.captureProgress

    if (hasOnlyPlayerUnits) {
      captureProgress = clampCaptureProgress(
        captureProgress + controlPointRules.captureRatePerSecond * deltaSeconds,
      )
    } else if (hasOnlyEnemyUnits) {
      captureProgress = clampCaptureProgress(
        captureProgress - controlPointRules.captureRatePerSecond * deltaSeconds,
      )
    }

    const owner = resolveOwnerFromProgress(captureProgress, point.owner)

    if (
      captureProgress !== point.captureProgress ||
      owner !== point.owner ||
      isContested !== point.isContested
    ) {
      changed = true
    }

    return {
      ...point,
      owner,
      captureProgress,
      isContested,
    }
  })

  return {
    controlPoints: nextControlPoints,
    changed,
  }
}
