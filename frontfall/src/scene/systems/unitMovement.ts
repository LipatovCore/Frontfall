import type { MapPosition } from '../../shared/types/map'

export type UnitMovementResult = {
  arrived: boolean
  position: MapPosition
}

export function moveUnitTowardsTarget(
  currentPosition: MapPosition,
  targetPosition: MapPosition,
  deltaSeconds: number,
  moveSpeed: number,
  stopDistance: number,
): UnitMovementResult {
  const dx = targetPosition[0] - currentPosition[0]
  const dz = targetPosition[2] - currentPosition[2]
  const distanceToTarget = Math.hypot(dx, dz)

  if (distanceToTarget <= stopDistance) {
    return {
      arrived: true,
      position: [targetPosition[0], currentPosition[1], targetPosition[2]],
    }
  }

  const stepDistance = Math.min(moveSpeed * deltaSeconds, distanceToTarget)
  const directionX = dx / distanceToTarget
  const directionZ = dz / distanceToTarget
  const nextPosition: MapPosition = [
    currentPosition[0] + directionX * stepDistance,
    currentPosition[1],
    currentPosition[2] + directionZ * stepDistance,
  ]

  if (distanceToTarget - stepDistance <= stopDistance) {
    return {
      arrived: true,
      position: [targetPosition[0], currentPosition[1], targetPosition[2]],
    }
  }

  return {
    arrived: false,
    position: nextPosition,
  }
}
